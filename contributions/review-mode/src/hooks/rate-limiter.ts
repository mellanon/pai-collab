/**
 * Rate Limiter for Review Mode Quarantine Agents
 *
 * Sliding window rate limiter that enforces per-agent call limits
 * and global concurrency limits for quarantine agents.
 *
 * ISC #12: 100 tools/minute per quarantine agent
 * ISC #13: Max 5 concurrent quarantine agents globally
 *
 * @module hooks/rate-limiter
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration for the rate limiter.
 *
 * @property maxCallsPerMinute - Maximum tool calls per agent per window (default: 100)
 * @property maxConcurrentAgents - Maximum concurrent quarantine agents globally (default: 5)
 * @property windowSizeMs - Sliding window size in milliseconds (default: 60000)
 */
export interface RateLimiterConfig {
	/** Maximum tool calls per agent per minute */
	maxCallsPerMinute: number;
	/** Maximum concurrent quarantine agents globally */
	maxConcurrentAgents: number;
	/** Sliding window size in milliseconds */
	windowSizeMs: number;
}

/**
 * Result of a rate limit check.
 *
 * @property allowed - Whether the call is allowed
 * @property remaining - Number of calls remaining in current window
 * @property resetAt - Unix timestamp when the oldest call expires from window
 * @property reason - Reason if blocked
 */
export interface RateLimitResult {
	/** Whether the call is allowed */
	allowed: boolean;
	/** Number of calls remaining in current window */
	remaining: number;
	/** Unix timestamp when the window resets */
	resetAt: number;
	/** Reason if blocked */
	reason?: string;
}

/**
 * Statistics for a single agent.
 */
export interface AgentRateStats {
	/** Agent identifier */
	agentId: string;
	/** Number of calls in current window */
	callsInWindow: number;
	/** Unix timestamp of window start */
	windowStart: number;
	/** Unix timestamp of last call */
	lastCallAt: number;
}

/**
 * Global rate limiter statistics.
 */
export interface GlobalRateStats {
	/** Number of currently active agents */
	activeAgents: number;
	/** Maximum concurrent agents allowed */
	maxConcurrentAgents: number;
	/** Total calls across all agents in current window */
	totalCallsAllAgents: number;
}

/**
 * Default rate limiter configuration.
 *
 * Production-safe defaults based on spec requirements.
 */
export const DEFAULT_RATE_LIMITER_CONFIG = {
	maxCallsPerMinute: 100,
	maxConcurrentAgents: 5,
	windowSizeMs: 60_000, // 1 minute
} as const satisfies RateLimiterConfig;

// ============================================================================
// INTERNAL STATE
// ============================================================================

/**
 * Internal state for tracking agent calls.
 */
interface AgentState {
	agentId: string;
	callTimestamps: number[];
	registeredAt: number;
}

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

/**
 * Sliding window rate limiter for quarantine agents.
 *
 * Thread-safe via synchronous operations on in-memory Map.
 * Uses sliding window algorithm for smooth rate limiting.
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter();
 *
 * if (limiter.registerAgent("agent-1")) {
 *   const result = limiter.checkRateLimit("agent-1");
 *   if (result.allowed) {
 *     // Execute tool call
 *   } else {
 *     console.log(`Blocked: ${result.reason}`);
 *   }
 * }
 * ```
 */
export class RateLimiter {
	private readonly config: RateLimiterConfig;
	private readonly agents: Map<string, AgentState>;

	/**
	 * Create a new rate limiter.
	 *
	 * @param config - Configuration options (uses defaults if not provided)
	 */
	constructor(config?: Partial<RateLimiterConfig>) {
		this.config = {
			...DEFAULT_RATE_LIMITER_CONFIG,
			...config,
		};
		this.agents = new Map();
	}

	/**
	 * Check if a tool call should be allowed for an agent.
	 *
	 * Uses sliding window algorithm:
	 * 1. Remove timestamps older than windowSizeMs
	 * 2. Check if remaining count < maxCallsPerMinute
	 * 3. If allowed, add current timestamp
	 *
	 * @param agentId - Identifier for the quarantine agent
	 * @returns Result indicating if call is allowed and why
	 */
	checkRateLimit(agentId: string): RateLimitResult {
		const state = this.agents.get(agentId);

		if (!state) {
			return {
				allowed: false,
				remaining: 0,
				resetAt: Date.now() + this.config.windowSizeMs,
				reason: "Agent not registered",
			};
		}

		const now = Date.now();
		const windowStart = now - this.config.windowSizeMs;

		// Remove timestamps outside the sliding window
		state.callTimestamps = state.callTimestamps.filter(
			(ts) => ts > windowStart,
		);

		const callsInWindow = state.callTimestamps.length;
		const remaining = this.config.maxCallsPerMinute - callsInWindow;

		if (callsInWindow >= this.config.maxCallsPerMinute) {
			// Find oldest timestamp to calculate when window resets
			const oldestTimestamp = state.callTimestamps[0] ?? now;
			const resetAt = oldestTimestamp + this.config.windowSizeMs;

			return {
				allowed: false,
				remaining: 0,
				resetAt,
				reason: `Rate limit exceeded: ${callsInWindow}/${this.config.maxCallsPerMinute} calls in window`,
			};
		}

		// Allowed - record this call
		state.callTimestamps.push(now);

		// Calculate when the window will reset (when oldest call expires)
		const oldestTimestamp = state.callTimestamps[0] ?? now;
		const resetAt = oldestTimestamp + this.config.windowSizeMs;

		return {
			allowed: true,
			remaining: remaining - 1, // -1 because we just added current call
			resetAt,
		};
	}

	/**
	 * Register a new quarantine agent.
	 *
	 * Checks global concurrency limit before allowing registration.
	 *
	 * @param agentId - Identifier for the quarantine agent
	 * @returns true if registered, false if max concurrent agents reached
	 */
	registerAgent(agentId: string): boolean {
		// Check if already registered
		if (this.agents.has(agentId)) {
			return true;
		}

		// Check global concurrency limit
		if (this.agents.size >= this.config.maxConcurrentAgents) {
			return false;
		}

		// Register new agent
		this.agents.set(agentId, {
			agentId,
			callTimestamps: [],
			registeredAt: Date.now(),
		});

		return true;
	}

	/**
	 * Unregister an agent and clean up its state.
	 *
	 * Should be called when a quarantine agent exits.
	 *
	 * @param agentId - Identifier for the quarantine agent
	 */
	unregisterAgent(agentId: string): void {
		this.agents.delete(agentId);
	}

	/**
	 * Get current statistics for a specific agent.
	 *
	 * @param agentId - Identifier for the quarantine agent
	 * @returns Agent statistics or undefined if not registered
	 */
	getAgentStats(agentId: string): AgentRateStats | undefined {
		const state = this.agents.get(agentId);

		if (!state) {
			return undefined;
		}

		const now = Date.now();
		const windowStart = now - this.config.windowSizeMs;

		// Filter to current window for accurate count
		const callsInWindow = state.callTimestamps.filter(
			(ts) => ts > windowStart,
		);

		return {
			agentId: state.agentId,
			callsInWindow: callsInWindow.length,
			windowStart,
			lastCallAt:
				state.callTimestamps[state.callTimestamps.length - 1] ?? 0,
		};
	}

	/**
	 * Get global rate limiter statistics.
	 *
	 * @returns Global statistics across all agents
	 */
	getGlobalStats(): GlobalRateStats {
		const now = Date.now();
		const windowStart = now - this.config.windowSizeMs;

		let totalCalls = 0;

		for (const state of this.agents.values()) {
			const callsInWindow = state.callTimestamps.filter(
				(ts) => ts > windowStart,
			);
			totalCalls += callsInWindow.length;
		}

		return {
			activeAgents: this.agents.size,
			maxConcurrentAgents: this.config.maxConcurrentAgents,
			totalCallsAllAgents: totalCalls,
		};
	}

	/**
	 * Reset all rate limiter state.
	 *
	 * Useful for testing. Removes all agents and clears all counters.
	 */
	reset(): void {
		this.agents.clear();
	}
}
