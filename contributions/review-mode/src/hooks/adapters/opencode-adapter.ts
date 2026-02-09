/**
 * OpenCode Platform Adapter for Review Mode
 *
 * Integrates with OpenCode's tool.execute.before hook system.
 * On deny: throws Error (OpenCode interprets thrown errors as tool blocks).
 * On allow: returns silently (tool proceeds).
 *
 * @module hooks/adapters/opencode-adapter
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
 * OpenCode Platform Adapter for Review Mode enforcement.
 *
 * Wraps the shared enforcement logic (`enforceReviewMode`) and integrates
 * rate limiting and security logging for OpenCode's plugin system.
 *
 * @example
 * ```typescript
 * const adapter = new OpenCodeReviewModeAdapter();
 *
 * // In OpenCode plugin:
 * export default {
 *   "tool.execute.before": async (input, output) => {
 *     const metadata = resolveAgentMetadata(input);
 *     adapter.handleBeforeToolUse(input.tool, output.args ?? {}, metadata);
 *   }
 * };
 * ```
 */
export class OpenCodeReviewModeAdapter {
	private readonly config: QuarantineConfig;
	private readonly rateLimiter: RateLimiter;
	private readonly logger: SecurityLogger;

	/**
	 * Creates a new OpenCode Review Mode adapter.
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
	 * OpenCode hook handler for tool.execute.before.
	 *
	 * This is the entry point called by OpenCode's plugin system.
	 * Enforces rate limits first, then review mode restrictions.
	 *
	 * @param tool - Tool name being executed (e.g., "Read", "Bash")
	 * @param args - Tool arguments as key-value pairs
	 * @param metadata - Agent metadata (resolved from agent registry)
	 * @throws Error if tool is denied (OpenCode blocking mechanism)
	 * @throws Error if rate limit exceeded
	 */
	handleBeforeToolUse(
		tool: string,
		args: Record<string, unknown>,
		metadata: AgentMetadata,
	): void {
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
				throw new Error(
					`[Review Mode] Rate limit exceeded: ${this.config.toolRateLimitPerMinute} calls/minute limit reached. Resets at ${new Date(rateLimitResult.resetAt).toISOString()}`,
				);
			}
		}

		// Enforce review mode restrictions via shared logic
		const decision: HookDecision = enforceReviewMode(
			tool,
			args,
			metadata,
			this.config,
		);

		// Log security event if present
		if (decision.securityEvent) {
			this.logger.log(decision.securityEvent);
		}

		// Block tool execution if denied
		if (!decision.allowed) {
			throw new Error(
				`[Review Mode] ${decision.reason || "Tool blocked"}`,
			);
		}

		// Tool allowed - return silently
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
	 * Get the rate limiter instance (for testing/inspection).
	 *
	 * @returns RateLimiter instance
	 */
	getRateLimiter(): RateLimiter {
		return this.rateLimiter;
	}

	/**
	 * Get the security logger instance (for testing/inspection).
	 *
	 * @returns SecurityLogger instance
	 */
	getLogger(): SecurityLogger {
		return this.logger;
	}
}

/**
 * Factory function to create the OpenCode plugin export format.
 *
 * Returns an object matching OpenCode's plugin hook signature.
 * The metadata parameter must be provided by the calling plugin wrapper,
 * typically resolved from an agent registry.
 *
 * @param config - Partial quarantine configuration
 * @returns OpenCode plugin hook object
 *
 * @example
 * ```typescript
 * import { createOpenCodePlugin } from './adapters/opencode-adapter.js';
 *
 * const plugin = createOpenCodePlugin({ toolRateLimitPerMinute: 50 });
 *
 * export default {
 *   "tool.execute.before": async (input, output) => {
 *     const metadata = agentRegistry.get(input.sessionId);
 *     await plugin["tool.execute.before"](input.tool, output.args ?? {}, metadata);
 *   }
 * };
 * ```
 */
export function createOpenCodePlugin(
	config?: Partial<QuarantineConfig>,
): {
	"tool.execute.before": (
		tool: string,
		args: Record<string, unknown>,
		metadata: AgentMetadata,
	) => void;
} {
	const adapter = new OpenCodeReviewModeAdapter(config);

	return {
		"tool.execute.before": (
			tool: string,
			args: Record<string, unknown>,
			metadata: AgentMetadata,
		): void => {
			adapter.handleBeforeToolUse(tool, args, metadata);
		},
	};
}
