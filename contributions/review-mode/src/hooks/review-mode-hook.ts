/**
 * Review Mode Hook - Core Security Enforcement Module
 *
 * This module defines the platform-agnostic interface and shared logic for Review Mode
 * (quarantine) enforcement. It determines whether tool calls from quarantine agents
 * should be allowed or blocked based on tool allowlists and HMAC validation.
 *
 * @module hooks/review-mode-hook
 */

import type {
  AgentMetadata,
  HookDecision,
  SecurityEventType,
  QuarantineConfig,
} from "../lib/types.js";
import { DEFAULT_QUARANTINE_CONFIG } from "../lib/types.js";
import {
  verifyTypedReference,
  parseTypedReference,
} from "../lib/typed-reference.js";

/**
 * Review Mode Hook Interface
 *
 * Platform adapters implement this interface to integrate Review Mode enforcement
 * into their respective hook systems (Claude Code, Cline, etc.).
 *
 * @interface ReviewModeHook
 */
export interface ReviewModeHook {
  /**
   * Called before a tool is executed. Returns a decision on whether to allow or block.
   *
   * @param tool - The name of the tool being invoked (e.g., "Read", "Write", "Bash")
   * @param args - The tool's arguments as a key-value object
   * @param metadata - Agent metadata including quarantine status and HMAC key
   * @returns HookDecision indicating allowed/denied with optional security event
   */
  beforeToolUse(
    tool: string,
    args: Record<string, unknown>,
    metadata: AgentMetadata
  ): HookDecision;
}

/**
 * Core Review Mode Enforcement Function
 *
 * This is THE central enforcement logic for Review Mode. It determines whether
 * a tool call from a quarantine agent should be allowed or blocked.
 *
 * **Decision Flow:**
 * 1. If agent is NOT in quarantine → ALLOW (pass through)
 * 2. If Review Mode is disabled → ALLOW (feature toggle)
 * 3. If tool is NOT in allowlist → DENY (block dangerous tools)
 * 4. If tool args contain TypedReference → validate HMAC
 * 5. If HMAC validation fails → DENY (prevent unauthorized access)
 * 6. Otherwise → ALLOW
 *
 * **Fail-Closed:** Any exception during enforcement results in DENY.
 *
 * @param tool - The tool being invoked (e.g., "Read", "Write", "Bash")
 * @param args - Tool arguments as key-value pairs
 * @param metadata - Agent metadata including isQuarantine flag and HMAC key
 * @param config - Quarantine configuration (defaults to DEFAULT_QUARANTINE_CONFIG)
 * @returns HookDecision with allowed flag, optional reason, and security event
 *
 * @example
 * ```typescript
 * const decision = enforceReviewMode(
 *   "Read",
 *   { filePath: "typed://hmac123/file.txt" },
 *   { agentId: "agent-1", sessionId: "session-1", isQuarantine: true, hmacKey: Buffer.from("key") }
 * );
 * if (!decision.allowed) {
 *   console.error(decision.reason);
 *   logSecurityEvent(decision.securityEvent);
 * }
 * ```
 */
export function enforceReviewMode(
  tool: string,
  args: Record<string, unknown>,
  metadata: AgentMetadata,
  config: QuarantineConfig = DEFAULT_QUARANTINE_CONFIG
): HookDecision {
  try {
    // 1. Non-quarantine agents pass through without checks
    if (!metadata.isQuarantine) {
      return { allowed: true };
    }

    // 2. If Review Mode is disabled, allow all (feature toggle)
    if (!config.enabled) {
      return { allowed: true };
    }

    // 3. Check if tool is in the allowlist
    if (!isToolAllowed(tool, config.allowedTools)) {
      return createDenyDecision(
        tool,
        metadata,
        "TOOL_BLOCKED",
        `Tool '${tool}' is not allowed in Review Mode. Allowed tools: ${config.allowedTools.join(", ")}`,
        "high"
      );
    }

    // 4. For allowed tools, check if args contain a TypedReference
    const typedRefUri = extractTypedReferenceFromArgs(args);

    if (typedRefUri) {
      // 5. Validate HMAC if TypedReference is present
      if (!metadata.hmacKey) {
        return createDenyDecision(
          tool,
          metadata,
          "HMAC_VERIFICATION_FAILED",
          "TypedReference found but agent has no HMAC key",
          "critical"
        );
      }

      try {
        const parsed = parseTypedReference(typedRefUri);
        const verificationResult = verifyTypedReference(
          parsed,
          metadata.sessionId,
          metadata.hmacKey!,
          config.typedReferenceTTL
        );

        if (!verificationResult.valid) {
          return createDenyDecision(
            tool,
            metadata,
            "HMAC_VERIFICATION_FAILED",
            `HMAC verification failed for TypedReference: ${parsed.path}`,
            "critical"
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown parsing error";
        return createDenyDecision(
          tool,
          metadata,
          "INVALID_TYPED_REFERENCE",
          `Invalid TypedReference format: ${message}`,
          "high"
        );
      }
    }

    // 6. All checks passed - allow the tool call
    return { allowed: true };
  } catch (err) {
    // FAIL-CLOSED: Any unexpected error results in deny
    const message = err instanceof Error ? err.message : "Unknown error";
    return createDenyDecision(
      tool,
      metadata,
      "TOOL_BLOCKED",
      `Internal enforcement error: ${message}`,
      "critical"
    );
  }
}

/**
 * Check if a tool is in the allowed tools list
 *
 * Performs case-sensitive membership check.
 *
 * @param tool - The tool name to check (e.g., "Read", "Grep")
 * @param allowedTools - Array of allowed tool names
 * @returns true if tool is in allowlist, false otherwise
 *
 * @example
 * ```typescript
 * isToolAllowed("Read", ["Read", "Grep", "Glob"]) // true
 * isToolAllowed("Write", ["Read", "Grep", "Glob"]) // false
 * isToolAllowed("read", ["Read"]) // false (case-sensitive)
 * ```
 */
export function isToolAllowed(
  tool: string,
  allowedTools: string[]
): boolean {
  return allowedTools.includes(tool);
}

/**
 * Extract TypedReference URI from tool arguments
 *
 * Searches common tool argument fields for TypedReference URIs (starting with "typed://").
 * Checks the following fields in order:
 * - filePath (Read, Write, Edit tools)
 * - path (Glob, directory operations)
 * - pattern (Grep tool)
 * - content (Write tool with TypedReference content)
 *
 * @param args - Tool arguments as key-value pairs
 * @returns The first TypedReference URI found, or undefined if none present
 *
 * @example
 * ```typescript
 * extractTypedReferenceFromArgs({ filePath: "typed://hmac123/file.txt" })
 * // Returns: "typed://hmac123/file.txt"
 *
 * extractTypedReferenceFromArgs({ filePath: "/regular/path.txt" })
 * // Returns: undefined
 *
 * extractTypedReferenceFromArgs({ pattern: "typed://hmac456/src/**" })
 * // Returns: "typed://hmac456/src/**"
 * ```
 */
export function extractTypedReferenceFromArgs(
  args: Record<string, unknown>
): string | undefined {
  // Check common argument fields for TypedReference URIs
  const candidateFields = ["filePath", "path", "pattern", "content"];

  for (const field of candidateFields) {
    const value = args[field];
    if (typeof value === "string" && value.startsWith("typed://")) {
      return value;
    }
  }

  return undefined;
}

/**
 * Create a deny HookDecision with SecurityEvent
 *
 * Helper function to construct a standardized deny decision with an associated
 * security event for audit logging.
 *
 * @param tool - The tool that was blocked
 * @param metadata - Agent metadata (agentId, sessionId)
 * @param eventType - Type of security event (e.g., "TOOL_BLOCKED")
 * @param reason - Human-readable explanation of why the tool was blocked
 * @param severity - Severity level of the security event
 * @returns HookDecision with allowed=false and populated securityEvent
 *
 * @example
 * ```typescript
 * const decision = createDenyDecision(
 *   "Write",
 *   { agentId: "agent-1", sessionId: "session-1", isQuarantine: true },
 *   "TOOL_BLOCKED",
 *   "Write tool not allowed in Review Mode",
 *   "high"
 * );
 * // decision.allowed === false
 * // decision.reason === "Write tool not allowed in Review Mode"
 * // decision.securityEvent.type === "TOOL_BLOCKED"
 * ```
 */
export function createDenyDecision(
  tool: string,
  metadata: AgentMetadata,
  eventType: SecurityEventType,
  reason: string,
  severity: "low" | "medium" | "high" | "critical"
): HookDecision {
  return {
    allowed: false,
    reason,
    securityEvent: {
      type: eventType,
      agentId: metadata.agentId,
      sessionId: metadata.sessionId,
      tool,
      severity,
      message: reason,
      context: {
        isQuarantine: metadata.isQuarantine,
      },
    },
  };
}
