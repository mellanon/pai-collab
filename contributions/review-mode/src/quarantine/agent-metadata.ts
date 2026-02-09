/**
 * Quarantine Agent Metadata Injection
 *
 * Orchestrates session creation, TypedReference generation, prompt building,
 * and cleanup for quarantine agent spawning. This is the "glue" that connects
 * the main agent's spawn request to the hook enforcement system.
 *
 * @module quarantine/agent-metadata
 */

import crypto from "node:crypto";
import type {
	AgentMetadata,
	TypedReference,
	QuarantineConfig,
} from "../lib/types.js";
import { DEFAULT_QUARANTINE_CONFIG } from "../lib/types.js";
import { SessionManager } from "../lib/session-manager.js";
import {
	createTypedReference,
	serializeTypedReference,
} from "../lib/typed-reference.js";
import { buildQuarantinePrompt, buildUserContentPrompt } from "./spawn-template.js";

/**
 * Complete parameters for spawning a quarantine agent.
 * Contains everything needed to launch a restricted agent session.
 */
export interface QuarantineSpawnParams {
	/** Unique identifier for this agent instance */
	agentId: string;
	/** Session ID for HMAC verification */
	sessionId: string;
	/** Metadata injected into Task tool spawn */
	metadata: AgentMetadata;
	/** TypedReferences for files the agent can read */
	typedReferences: Array<{
		reference: TypedReference;
		uri: string;
		originalPath: string;
	}>;
	/** System prompt with quarantine rules */
	systemPrompt: string;
	/** User prompt with file list and instructions */
	userPrompt: string;
	/** Timeout in milliseconds */
	timeoutMs: number;
	/** Cleanup function to destroy session keys (idempotent) */
	cleanup: () => void;
}

/**
 * Options for preparing a quarantine spawn.
 */
export interface PrepareQuarantineOptions {
	/** Absolute file paths the quarantine agent should review */
	filePaths: string[];
	/** Optional review instructions */
	instructions?: string;
	/** Quarantine configuration (defaults to DEFAULT_QUARANTINE_CONFIG) */
	config?: QuarantineConfig;
}

/**
 * Result of checking if a quarantine agent can be spawned.
 */
export interface CanSpawnResult {
	/** Whether spawning is allowed */
	allowed: boolean;
	/** Reason if not allowed */
	reason?: string;
	/** Current number of active quarantine agents */
	currentCount: number;
	/** Maximum allowed concurrent agents */
	maxCount: number;
}

/**
 * Prepare all parameters needed to spawn a quarantine agent.
 *
 * Orchestrates:
 * 1. Concurrency limit check
 * 2. Session creation with HMAC key
 * 3. TypedReference generation for each file
 * 4. System and user prompt building
 * 5. Cleanup function creation
 *
 * @param sessionManager - Session manager instance
 * @param options - Spawn options with file paths and instructions
 * @returns Complete spawn parameters
 * @throws {Error} If concurrency limit exceeded or filePaths is empty
 *
 * @example
 * ```typescript
 * const sessionManager = new SessionManager();
 * const params = prepareQuarantineSpawn(sessionManager, {
 *   filePaths: ["/path/to/file1.ts", "/path/to/file2.ts"],
 *   instructions: "Review for security issues",
 * });
 *
 * // Use params to spawn agent via Task tool
 * // When agent completes:
 * params.cleanup();
 * ```
 */
export function prepareQuarantineSpawn(
	sessionManager: SessionManager,
	options: PrepareQuarantineOptions,
): QuarantineSpawnParams {
	const config = options.config ?? DEFAULT_QUARANTINE_CONFIG;

	// Check concurrency limit
	const spawnCheck = canSpawnQuarantine(sessionManager, config);
	if (!spawnCheck.allowed) {
		throw new Error(
			`Cannot spawn quarantine agent: ${spawnCheck.reason} ` +
				`(${spawnCheck.currentCount}/${spawnCheck.maxCount} active)`,
		);
	}

	// Validate file paths
	if (!options.filePaths || options.filePaths.length === 0) {
		throw new Error("prepareQuarantineSpawn: filePaths array is empty");
	}

	// Generate unique agent ID
	const agentId = crypto.randomUUID();

	// Create quarantine session (generates HMAC key)
	const sessionData = sessionManager.createSession(agentId, true);
	const { sessionId, hmacKey } = sessionData;

	// Create TypedReferences for file access
	const typedReferences = createFileReferences(
		options.filePaths,
		sessionId,
		hmacKey,
	);

	// Build system prompt (uses QuarantineConfig)
	const systemPrompt = buildQuarantinePrompt(config);

	// Build user prompt with TypedReference file list
	const userPrompt = buildUserContentPrompt(
		typedReferences.map((tr) => ({
			reference: tr.reference,
			uri: tr.uri,
		})),
		options.instructions,
	);

	// Create metadata for hook enforcement
	const metadata: AgentMetadata = {
		agentId,
		sessionId,
		isQuarantine: true,
		hmacKey,
	};

	// Create idempotent cleanup function
	const cleanup = createCleanupFn(sessionManager, sessionId);

	return {
		agentId,
		sessionId,
		metadata,
		typedReferences,
		systemPrompt,
		userPrompt,
		timeoutMs: config.quarantineAgentTimeout,
		cleanup,
	};
}

/**
 * Check if another quarantine agent can be spawned.
 * Enforces maxConcurrentQuarantineAgents limit.
 *
 * @param sessionManager - Session manager instance
 * @param config - Quarantine configuration
 * @returns Structured result with allowed status and counts
 *
 * @example
 * ```typescript
 * const check = canSpawnQuarantine(sessionManager);
 * if (!check.allowed) {
 *   console.error(`Cannot spawn: ${check.reason} (${check.currentCount}/${check.maxCount})`);
 * }
 * ```
 */
export function canSpawnQuarantine(
	sessionManager: SessionManager,
	config?: QuarantineConfig,
): CanSpawnResult {
	const cfg = config ?? DEFAULT_QUARANTINE_CONFIG;
	const currentCount = sessionManager.getActiveQuarantineCount();
	const maxCount = cfg.maxConcurrentQuarantineAgents;

	if (currentCount >= maxCount) {
		return {
			allowed: false,
			reason: "Maximum concurrent quarantine agents reached",
			currentCount,
			maxCount,
		};
	}

	return {
		allowed: true,
		currentCount,
		maxCount,
	};
}

/**
 * Create TypedReferences for a list of file paths.
 *
 * Each reference gets:
 * - HMAC-SHA256 signature for verification
 * - Timestamp for TTL enforcement
 * - Serialized typed:// URI for passing to quarantine agent
 *
 * @param filePaths - Absolute file paths to create references for
 * @param sessionId - Session ID for HMAC generation
 * @param hmacKey - HMAC key from session
 * @returns Array of { reference, uri, originalPath }
 *
 * @example
 * ```typescript
 * const refs = createFileReferences(
 *   ["/path/to/file.ts"],
 *   sessionId,
 *   hmacKey,
 * );
 * // refs[0].uri → "typed://%2Fpath%2Fto%2Ffile.ts?hmac=...&ts=...&sid=..."
 * ```
 */
export function createFileReferences(
	filePaths: string[],
	sessionId: string,
	hmacKey: Buffer,
): Array<{ reference: TypedReference; uri: string; originalPath: string }> {
	return filePaths.map((filePath) => {
		const reference = createTypedReference(filePath, sessionId, hmacKey);
		const uri = serializeTypedReference(reference);

		return {
			reference,
			uri,
			originalPath: filePath,
		};
	});
}

/**
 * Create an idempotent cleanup function for destroying session keys.
 *
 * The returned function:
 * - Destroys the session and zeros its HMAC key
 * - Is idempotent (safe to call multiple times)
 * - Should be called when the quarantine agent completes
 *
 * @param sessionManager - Session manager instance
 * @param sessionId - Session ID to destroy
 * @returns Cleanup function
 */
export function createCleanupFn(
	sessionManager: SessionManager,
	sessionId: string,
): () => void {
	let cleaned = false;

	return () => {
		if (cleaned) {
			return;
		}

		sessionManager.destroySession(sessionId);
		cleaned = true;
	};
}
