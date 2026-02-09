/**
 * Claude Code Platform Adapter for Review Mode
 *
 * Claude Code hooks are external scripts that:
 * - Receive hook event data via stdin (JSON)
 * - Exit with code 0 to allow
 * - Exit with code 2 to block (deny)
 * - Write reason to stderr before exit(2)
 *
 * This adapter wraps the shared enforcement logic for Claude Code's hook model.
 *
 * @module hooks/adapters/claude-code-adapter
 */

import { enforceReviewMode } from "../review-mode-hook.js";
import { RateLimiter } from "../rate-limiter.js";
import { SecurityLogger } from "../security-logger.js";
import type {
	AgentMetadata,
	QuarantineConfig,
	HookDecision,
} from "../../lib/types.js";
import { DEFAULT_QUARANTINE_CONFIG } from "../../lib/types.js";

/**
 * Claude Code Platform Adapter for Review Mode enforcement.
 *
 * Separates pure enforcement logic (testable via `checkToolUse()`) from
 * process.exit() side effects (only in `handleHookExecution()`).
 *
 * @example
 * ```typescript
 * // For testing (pure, no side effects):
 * const adapter = new ClaudeCodeReviewModeAdapter();
 * const decision = adapter.checkToolUse("Bash", {}, metadata);
 * expect(decision.allowed).toBe(false);
 *
 * // For production (calls process.exit):
 * adapter.handleHookExecution(stdinJson, metadata);
 * ```
 */
export class ClaudeCodeReviewModeAdapter {
	private readonly config: QuarantineConfig;
	private readonly rateLimiter: RateLimiter;
	private readonly logger: SecurityLogger;

	/**
	 * Creates a new Claude Code Review Mode adapter.
	 *
	 * @param config - Partial quarantine configuration (merged with defaults)
	 */
	constructor(config?: Partial<QuarantineConfig>) {
		this.config = { ...DEFAULT_QUARANTINE_CONFIG, ...config };
		this.rateLimiter = new RateLimiter({
			maxCallsPerMinute: this.config.toolRateLimitPerMinute,
			maxConcurrentAgents: this.config.maxConcurrentQuarantineAgents,
		});
		this.logger = new SecurityLogger(this.config.auditLogPath);
	}

	/**
	 * Core enforcement check (does NOT exit -- for testability).
	 *
	 * Returns the decision so tests can inspect it without process.exit().
	 * Rate limiting is checked first, then review mode enforcement.
	 *
	 * @param tool - Tool name being invoked (e.g., "Read", "Bash")
	 * @param args - Tool arguments as key-value pairs
	 * @param metadata - Agent metadata including quarantine status and HMAC key
	 * @returns Hook decision (allowed/denied with reason and optional security event)
	 */
	checkToolUse(
		tool: string,
		args: Record<string, unknown>,
		metadata: AgentMetadata,
	): HookDecision {
		// Only check rate limits for quarantine agents
		if (metadata.isQuarantine) {
			const rateLimitResult = this.rateLimiter.checkRateLimit(
				metadata.agentId,
			);

			if (!rateLimitResult.allowed) {
				this.logger.logRateLimitExceeded(
					metadata.agentId,
					metadata.sessionId,
					tool,
					this.config.toolRateLimitPerMinute,
				);

				return {
					allowed: false,
					reason: `Rate limit exceeded: ${this.config.toolRateLimitPerMinute} calls/minute limit reached`,
				};
			}
		}

		// Enforce Review Mode restrictions via shared logic
		const decision = enforceReviewMode(tool, args, metadata, this.config);

		// Log security event if tool was blocked
		if (!decision.allowed && decision.securityEvent) {
			this.logger.log(decision.securityEvent);
		}

		return decision;
	}

	/**
	 * Full Claude Code hook handler (reads parsed stdin, writes stderr, exits).
	 *
	 * This is what gets called when running as a Claude Code PreToolUse script.
	 * DO NOT call in tests -- use `checkToolUse()` instead.
	 *
	 * **Fail-closed:** Any error during processing results in exit(2) (deny).
	 *
	 * @param stdinData - Raw JSON string from Claude Code's stdin
	 * @param metadata - Agent metadata (from environment variables or config)
	 */
	handleHookExecution(stdinData: string, metadata: AgentMetadata): void {
		try {
			const { tool, args } = parseClaudeCodeHookInput(stdinData);
			const decision = this.checkToolUse(tool, args, metadata);

			if (!decision.allowed) {
				// Write denial reason to stderr
				process.stderr.write(
					`[Review Mode] ${decision.reason || "Tool call denied"}\n`,
				);
				// Exit with code 2 to block the tool call
				process.exit(2);
			}

			// Allow the tool call
			process.exit(0);
		} catch (error) {
			// Fail-closed: parsing error -> deny
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			process.stderr.write(
				`[Review Mode] Error processing hook: ${errorMessage}\n`,
			);
			process.exit(2);
		}
	}

	/**
	 * Register a spawned quarantine agent with the rate limiter.
	 *
	 * @param agentId - Unique agent identifier
	 * @returns true if registered, false if max concurrent agents reached
	 */
	onAgentSpawn(agentId: string): boolean {
		return this.rateLimiter.registerAgent(agentId);
	}

	/**
	 * Unregister an exiting quarantine agent from the rate limiter.
	 *
	 * @param agentId - Unique agent identifier
	 */
	onAgentExit(agentId: string): void {
		this.rateLimiter.unregisterAgent(agentId);
	}

	/**
	 * Get the rate limiter instance (for testing).
	 *
	 * @returns RateLimiter instance
	 */
	getRateLimiter(): RateLimiter {
		return this.rateLimiter;
	}

	/**
	 * Get the security logger instance (for testing).
	 *
	 * @returns SecurityLogger instance
	 */
	getLogger(): SecurityLogger {
		return this.logger;
	}
}

/**
 * Parse Claude Code hook stdin format.
 *
 * Supports multiple formats from different Claude Code versions:
 * - `{"tool_name": "Read", "tool_input": {...}}`
 * - `{"tool": "Read", "args": {...}}`
 *
 * @param stdinJson - Raw JSON string from stdin
 * @returns Normalized tool name and arguments
 * @throws Error if JSON is invalid or required fields are missing
 */
export function parseClaudeCodeHookInput(stdinJson: string): {
	tool: string;
	args: Record<string, unknown>;
} {
	let data: Record<string, unknown>;

	try {
		data = JSON.parse(stdinJson) as Record<string, unknown>;
	} catch (error) {
		throw new Error(
			`Invalid JSON: ${error instanceof SyntaxError ? error.message : "Unknown parse error"}`,
		);
	}

	// Format 1: tool_name + tool_input (Claude Code native format)
	if (data.tool_name && typeof data.tool_name === "string") {
		return {
			tool: data.tool_name,
			args: (data.tool_input as Record<string, unknown>) || {},
		};
	}

	// Format 2: tool + args (generic format)
	if (data.tool && typeof data.tool === "string") {
		return {
			tool: data.tool,
			args: (data.args as Record<string, unknown>) || {},
		};
	}

	throw new Error(
		'Missing required fields: expected "tool_name"/"tool_input" or "tool"/"args"',
	);
}

/**
 * Create a runnable Claude Code hook script entry point.
 *
 * Usage in `.claude/settings.json`:
 * ```json
 * { "hooks": { "PreToolUse": "bun run /path/to/claude-code-adapter.ts" } }
 * ```
 *
 * The returned function reads stdin, resolves agent metadata from environment
 * variables, calls `checkToolUse`, writes stderr on deny, and exits with
 * the appropriate code.
 *
 * Environment variables:
 * - `AGENT_ID` — Agent identifier (default: "default-agent")
 * - `SESSION_ID` — Session identifier (default: "default-session")
 * - `QUARANTINE_MODE` — "true" to enable quarantine (default: false)
 * - `HMAC_KEY` — Hex-encoded HMAC key (optional)
 *
 * @param config - Optional quarantine configuration override
 * @returns Async function that handles the hook lifecycle
 */
export function createClaudeCodeHookMain(
	config?: Partial<QuarantineConfig>,
): () => Promise<void> {
	return async () => {
		const adapter = new ClaudeCodeReviewModeAdapter(config);

		// Read stdin
		const chunks: Buffer[] = [];
		for await (const chunk of process.stdin) {
			chunks.push(chunk as Buffer);
		}
		const stdinData = Buffer.concat(chunks).toString("utf-8");

		// Resolve agent metadata from environment variables
		const metadata: AgentMetadata = {
			agentId: process.env.AGENT_ID || "default-agent",
			sessionId: process.env.SESSION_ID || "default-session",
			isQuarantine: process.env.QUARANTINE_MODE === "true",
			hmacKey: process.env.HMAC_KEY
				? Buffer.from(process.env.HMAC_KEY, "hex")
				: undefined,
		};

		// Handle the hook execution (will call process.exit)
		adapter.handleHookExecution(stdinData, metadata);
	};
}
