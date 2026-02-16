/**
 * Review Mode - Shared Types and Zod Schemas
 *
 * Security-critical type definitions and validation schemas for HMAC-secured
 * TypedReferences, quarantine agent operations, and audit logging.
 *
 * @module types
 */

import { z } from "zod";
import path from "node:path";

// ============================================================================
// SECURITY EVENT TYPES
// ============================================================================

/**
 * Security event types for audit logging.
 *
 * Tracks all security-relevant events during Review Mode operation.
 */
export type SecurityEventType =
	| "QUARANTINE_AGENT_SPAWN"
	| "QUARANTINE_AGENT_EXIT"
	| "TOOL_BLOCKED"
	| "HMAC_VERIFICATION_FAILED"
	| "TYPED_REFERENCE_EXPIRED"
	| "RATE_LIMIT_EXCEEDED"
	| "INVALID_TYPED_REFERENCE"
	| "SESSION_MISMATCH"
	| "QUARANTINE_TIMEOUT";

/**
 * Zod schema for SecurityEventType enum validation.
 */
export const SecurityEventTypeSchema = z.enum([
	"QUARANTINE_AGENT_SPAWN",
	"QUARANTINE_AGENT_EXIT",
	"TOOL_BLOCKED",
	"HMAC_VERIFICATION_FAILED",
	"TYPED_REFERENCE_EXPIRED",
	"RATE_LIMIT_EXCEEDED",
	"INVALID_TYPED_REFERENCE",
	"SESSION_MISMATCH",
	"QUARANTINE_TIMEOUT",
]);

// ============================================================================
// HMAC AND TYPED REFERENCES
// ============================================================================

/**
 * HMAC-secured reference to untrusted content.
 *
 * TypedReferences are the core security primitive in Review Mode. They contain
 * an HMAC signature that proves the reference was created by a trusted agent,
 * preventing quarantine agents from accessing arbitrary files.
 *
 * @property path - Canonicalized absolute file path
 * @property hmac - HMAC-SHA256 signature (64 hex characters)
 * @property timestamp - Unix timestamp in seconds (when reference was created)
 * @property sessionId - Session ID (UUID v4) that created this reference
 */
export interface TypedReference {
	path: string;
	hmac: string;
	timestamp: number;
	sessionId: string;
}

/**
 * Zod schema for TypedReference validation.
 *
 * Enforces:
 * - Path must be absolute
 * - HMAC must be exactly 64 hex characters (SHA-256 output)
 * - Timestamp must be positive integer
 * - Session ID must be valid UUID v4
 */
export const TypedReferenceSchema = z.object({
	path: z
		.string()
		.min(1)
		.refine((p) => path.isAbsolute(p), {
			message: "Path must be absolute",
		}),
	hmac: z
		.string()
		.length(64)
		.regex(/^[0-9a-f]{64}$/, "HMAC must be 64 hex characters (SHA-256)"),
	timestamp: z.number().int().positive(),
	sessionId: z.string().uuid(),
});

/**
 * Data structure signed to create TypedReference HMAC.
 *
 * This is the canonical format for HMAC input. The HMAC is computed over
 * the stringified version of this object to prevent tampering.
 *
 * @property path - Canonicalized absolute file path
 * @property timestamp - Unix timestamp in seconds
 * @property sessionId - UUID v4 of the session creating this reference
 */
export interface HMACInput {
	path: string;
	timestamp: number;
	sessionId: string;
}

/**
 * Result of HMAC verification operation.
 *
 * @property valid - Whether the HMAC signature is valid
 * @property error - Machine-readable error code if validation failed
 * @property message - Human-readable error message if validation failed
 */
export interface HMACVerificationResult {
	valid: boolean;
	error?:
		| "invalid_hmac"
		| "expired"
		| "session_mismatch"
		| "malformed_reference";
	message?: string;
}

// ============================================================================
// SECURITY EVENTS AND AUDIT LOGGING
// ============================================================================

/**
 * Security audit log entry.
 *
 * All security-relevant events are logged as SecurityEvent entries.
 * These are written to JSONL files and optionally to a database.
 *
 * @property id - Unique event ID (UUID v4)
 * @property timestamp - ISO 8601 timestamp
 * @property type - Event type classification
 * @property agentId - ID of the agent that triggered this event
 * @property sessionId - Session ID (UUID v4)
 * @property tool - Tool name if this event is tool-related
 * @property severity - Event severity level
 * @property message - Human-readable event description
 * @property context - Additional structured data (arbitrary JSON)
 */
export interface SecurityEvent {
	id: string;
	timestamp: string;
	type: SecurityEventType;
	agentId: string;
	sessionId: string;
	tool?: string;
	severity: "low" | "medium" | "high" | "critical";
	message: string;
	context?: Record<string, unknown>;
}

/**
 * Zod schema for SecurityEvent validation.
 */
export const SecurityEventSchema = z.object({
	id: z.string().uuid(),
	timestamp: z.string().datetime(),
	type: SecurityEventTypeSchema,
	agentId: z.string().uuid(),
	sessionId: z.string().uuid(),
	tool: z.string().optional(),
	severity: z.enum(["low", "medium", "high", "critical"]),
	message: z.string().min(1),
	context: z.record(z.unknown()).optional(),
});

// ============================================================================
// QUARANTINE CONFIGURATION
// ============================================================================

/**
 * Review Mode quarantine configuration.
 *
 * Controls all aspects of Review Mode behavior including tool allowlists,
 * HMAC parameters, rate limiting, and audit logging.
 *
 * @property enabled - Whether Review Mode is active
 * @property allowedTools - Whitelist of tools quarantine agents can use
 * @property hmacKeySize - HMAC key size in bytes (default: 32 = 256 bits)
 * @property typedReferenceTTL - TypedReference validity period in seconds
 * @property toolRateLimitPerMinute - Max tool calls per minute per agent
 * @property maxConcurrentQuarantineAgents - Max simultaneous quarantine agents
 * @property quarantineAgentTimeout - Agent execution timeout in milliseconds
 * @property auditLogPath - Path to JSONL audit log file
 * @property auditDatabase - Optional database connection for audit logs
 */
export interface QuarantineConfig {
	enabled: boolean;
	allowedTools: string[];
	hmacKeySize: number;
	typedReferenceTTL: number;
	toolRateLimitPerMinute: number;
	maxConcurrentQuarantineAgents: number;
	quarantineAgentTimeout: number;
	auditLogPath: string;
	auditDatabase?: {
		host: string;
		port: number;
		database: string;
		table: string;
	};
}

/**
 * Zod schema for QuarantineConfig validation with defaults.
 */
export const QuarantineConfigSchema = z.object({
	enabled: z.boolean().default(true),
	allowedTools: z.array(z.string()).default(["Read", "Grep", "Glob"]),
	hmacKeySize: z.number().int().positive().default(32),
	typedReferenceTTL: z.number().int().positive().default(3600),
	toolRateLimitPerMinute: z.number().int().positive().default(100),
	maxConcurrentQuarantineAgents: z.number().int().positive().default(5),
	quarantineAgentTimeout: z.number().int().positive().default(300000),
	auditLogPath: z.string().default("review-mode-audit.jsonl"),
	auditDatabase: z
		.object({
			host: z.string(),
			port: z.number().int().positive(),
			database: z.string(),
			table: z.string(),
		})
		.optional(),
});

/**
 * Default quarantine configuration.
 *
 * These are production-safe defaults based on the spec:
 * - Read-only tools only (Read, Grep, Glob)
 * - 1 hour TypedReference TTL
 * - 100 tool calls/minute rate limit
 * - 5 concurrent quarantine agents max
 * - 5 minute agent timeout
 */
export const DEFAULT_QUARANTINE_CONFIG: QuarantineConfig = {
	enabled: true,
	allowedTools: ["Read", "Grep", "Glob"],
	hmacKeySize: 32, // 256 bits
	typedReferenceTTL: 3600, // 1 hour
	toolRateLimitPerMinute: 100,
	maxConcurrentQuarantineAgents: 5,
	quarantineAgentTimeout: 300000, // 5 minutes
	auditLogPath: "review-mode-audit.jsonl",
};

// ============================================================================
// AGENT METADATA AND HOOK DECISIONS
// ============================================================================

/**
 * Agent metadata tracked by the hook system.
 *
 * The hook system maintains this metadata for each active agent to enforce
 * quarantine constraints and HMAC verification.
 *
 * @property agentId - Unique agent identifier (UUID v4)
 * @property sessionId - Session identifier (UUID v4)
 * @property isQuarantine - Whether this agent is running in quarantine mode
 * @property hmacKey - HMAC key for this agent (only present for quarantine agents)
 */
export interface AgentMetadata {
	agentId: string;
	sessionId: string;
	isQuarantine: boolean;
	hmacKey?: Buffer;
}

/**
 * Zod schema for AgentMetadata validation.
 */
export const AgentMetadataSchema = z.object({
	agentId: z.string().uuid(),
	sessionId: z.string().uuid(),
	isQuarantine: z.boolean(),
	hmacKey: z.instanceof(Buffer).optional(),
});

/**
 * Hook enforcement decision result.
 *
 * Returned by hook handlers to indicate whether an operation should be allowed,
 * and optionally to log a security event.
 *
 * @property allowed - Whether the operation should proceed
 * @property reason - Human-readable reason if operation was denied
 * @property securityEvent - Security event to log (without id/timestamp which are added by logger)
 */
export interface HookDecision {
	allowed: boolean;
	reason?: string;
	securityEvent?: Omit<SecurityEvent, "id" | "timestamp">;
}

/**
 * Zod schema for HookDecision validation.
 */
export const HookDecisionSchema = z.object({
	allowed: z.boolean(),
	reason: z.string().optional(),
	securityEvent: SecurityEventSchema.omit({ id: true, timestamp: true }).optional(),
});

// ============================================================================
// QUARANTINE AGENT RESPONSE
// ============================================================================

/**
 * Individual finding from a quarantine agent review.
 *
 * @property type - Classification of the finding
 * @property severity - Severity level
 * @property description - Human-readable description of the issue
 * @property location - Optional file/line/column location
 * @property remediation - Optional suggested fix
 */
export interface ReviewFinding {
	type:
		| "security_issue"
		| "code_quality"
		| "documentation"
		| "test_coverage"
		| "other";
	severity: "low" | "medium" | "high" | "critical";
	description: string;
	location?: {
		file: string;
		line?: number;
		column?: number;
	};
	remediation?: string;
}

/**
 * Zod schema for ReviewFinding validation.
 */
export const ReviewFindingSchema = z.object({
	type: z.enum([
		"security_issue",
		"code_quality",
		"documentation",
		"test_coverage",
		"other",
	]),
	severity: z.enum(["low", "medium", "high", "critical"]),
	description: z.string().min(1),
	location: z
		.object({
			file: z.string(),
			line: z.number().int().positive().optional(),
			column: z.number().int().positive().optional(),
		})
		.optional(),
	remediation: z.string().optional(),
});

/**
 * Structured response from a quarantine agent.
 *
 * This is the canonical format for quarantine agent output. It provides
 * structured findings, risk assessment, and metadata about the review.
 *
 * @property findings - List of individual findings
 * @property riskLevel - Overall risk assessment
 * @property recommendedActions - List of recommended next steps
 * @property metadata - Execution metadata (agent ID, timing, etc.)
 */
export interface QuarantineAgentResponse {
	findings: ReviewFinding[];
	riskLevel: "low" | "medium" | "high" | "critical";
	recommendedActions: string[];
	metadata: {
		agentId: string;
		executionTime: number;
		toolCallCount: number;
		model: string;
	};
}

/**
 * Zod schema for QuarantineAgentResponse validation.
 */
export const QuarantineAgentResponseSchema = z.object({
	findings: z.array(ReviewFindingSchema),
	riskLevel: z.enum(["low", "medium", "high", "critical"]),
	recommendedActions: z.array(z.string()),
	metadata: z.object({
		agentId: z.string().uuid(),
		executionTime: z.number().int().nonnegative(),
		toolCallCount: z.number().int().nonnegative(),
		model: z.string(),
	}),
});
