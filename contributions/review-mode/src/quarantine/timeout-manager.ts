/**
 * Quarantine Agent Timeout Manager
 *
 * Timeout enforcement for quarantine agents. Tracks active agents with
 * configurable timeouts (default 5 minutes), enforces limits, and
 * returns partial results on timeout. Implements graceful shutdown.
 *
 * @module quarantine/timeout-manager
 */

import type { SecurityEvent } from "../lib/types.js";

/**
 * Tracked agent entry with timeout state.
 */
export interface TrackedAgent {
	/** Unique agent identifier */
	agentId: string;
	/** Session identifier for context */
	sessionId: string;
	/** Start time in milliseconds (Date.now()) */
	startTime: number;
	/** Timeout duration in milliseconds */
	timeoutMs: number;
	/** Active timeout timer or null if cleared */
	timer: ReturnType<typeof setTimeout> | null;
	/** Current agent status */
	status: "running" | "completed" | "timed_out" | "error";
	/** Optional callback fired on timeout */
	onTimeout?: (agentId: string) => void;
}

/**
 * Result returned when a timeout occurs or agent completes.
 */
export interface TimeoutResult {
	/** Agent identifier */
	agentId: string;
	/** Session identifier */
	sessionId: string;
	/** Elapsed time in milliseconds */
	elapsedMs: number;
	/** Whether this result is from a timeout */
	timedOut: boolean;
	/** Optional partial result from the agent */
	partialResult?: unknown;
}

/**
 * TimeoutManager — Manages timeout enforcement for quarantine agents.
 *
 * Tracks active agents, enforces configurable timeouts, and provides
 * graceful timeout handling with partial results.
 *
 * @example
 * ```typescript
 * const manager = new TimeoutManager(300000); // 5 minutes default
 *
 * manager.trackAgent("agent-1", "session-1", 60000, (id) => {
 *   console.log(`Agent ${id} timed out`);
 * });
 *
 * const result = await manager.withTimeout("agent-2", "session-2", somePromise());
 * manager.destroyAll();
 * ```
 */
export class TimeoutManager {
	private agents: Map<string, TrackedAgent>;
	private defaultTimeoutMs: number;

	/**
	 * Create a new TimeoutManager.
	 *
	 * @param defaultTimeoutMs - Default timeout in milliseconds (default: 300000 = 5 min)
	 */
	constructor(defaultTimeoutMs: number = 300000) {
		this.agents = new Map();
		this.defaultTimeoutMs = defaultTimeoutMs;
	}

	/**
	 * Register a new agent for timeout tracking.
	 * Creates a setTimeout that fires onTimeout and marks agent as timed_out.
	 *
	 * @param agentId - Unique agent identifier
	 * @param sessionId - Session identifier
	 * @param timeoutMs - Timeout duration in ms (uses default if not provided)
	 * @param onTimeout - Optional callback fired when timeout occurs
	 * @returns Tracked agent entry
	 */
	trackAgent(
		agentId: string,
		sessionId: string,
		timeoutMs?: number,
		onTimeout?: (agentId: string) => void,
	): TrackedAgent {
		// Cancel existing tracking if present
		this.cancelTracking(agentId);

		const timeout = timeoutMs ?? this.defaultTimeoutMs;
		const startTime = Date.now();

		const agent: TrackedAgent = {
			agentId,
			sessionId,
			startTime,
			timeoutMs: timeout,
			timer: null,
			status: "running",
			onTimeout,
		};

		// Set timeout timer
		agent.timer = setTimeout(() => {
			const trackedAgent = this.agents.get(agentId);
			if (trackedAgent && trackedAgent.status === "running") {
				trackedAgent.status = "timed_out";
				trackedAgent.timer = null;

				if (trackedAgent.onTimeout) {
					try {
						trackedAgent.onTimeout(agentId);
					} catch (_err) {
						// Swallow callback errors to prevent timer issues
					}
				}
			}
		}, timeout);

		this.agents.set(agentId, agent);
		return agent;
	}

	/**
	 * Mark agent as completed and clear timeout timer.
	 *
	 * @param agentId - Agent identifier
	 * @param result - Optional result data
	 * @returns TimeoutResult with elapsed time and completion status
	 */
	completeAgent(agentId: string, result?: unknown): TimeoutResult {
		const agent = this.agents.get(agentId);

		if (!agent) {
			return {
				agentId,
				sessionId: "",
				elapsedMs: 0,
				timedOut: false,
				partialResult: result,
			};
		}

		const elapsedMs = Date.now() - agent.startTime;
		const wasTimedOut = agent.status === "timed_out";

		// Clear timer if still active
		if (agent.timer !== null) {
			clearTimeout(agent.timer);
			agent.timer = null;
		}

		// Mark completed unless already timed out
		if (agent.status === "running") {
			agent.status = "completed";
		}

		return {
			agentId: agent.agentId,
			sessionId: agent.sessionId,
			elapsedMs,
			timedOut: wasTimedOut,
			partialResult: result,
		};
	}

	/**
	 * Get remaining time for an agent in milliseconds.
	 *
	 * @param agentId - Agent identifier
	 * @returns Remaining time in ms, 0 if expired, null if not tracked
	 */
	getRemainingTime(agentId: string): number | null {
		const agent = this.agents.get(agentId);
		if (!agent) {
			return null;
		}

		const elapsed = Date.now() - agent.startTime;
		const remaining = agent.timeoutMs - elapsed;
		return Math.max(0, remaining);
	}

	/**
	 * Check if agent has timed out.
	 *
	 * @param agentId - Agent identifier
	 * @returns True if agent exists and has timed out
	 */
	isTimedOut(agentId: string): boolean {
		const agent = this.agents.get(agentId);
		return agent !== undefined && agent.status === "timed_out";
	}

	/**
	 * Get tracked agent info.
	 *
	 * @param agentId - Agent identifier
	 * @returns Tracked agent or undefined if not found
	 */
	getAgent(agentId: string): TrackedAgent | undefined {
		return this.agents.get(agentId);
	}

	/**
	 * Get all active (running) agents.
	 *
	 * @returns Array of agents with status "running"
	 */
	getActiveAgents(): TrackedAgent[] {
		return Array.from(this.agents.values()).filter(
			(agent) => agent.status === "running",
		);
	}

	/**
	 * Get count of active agents.
	 *
	 * @returns Number of agents with status "running"
	 */
	getActiveCount(): number {
		return this.getActiveAgents().length;
	}

	/**
	 * Cancel tracking for an agent without marking as timed out.
	 * Clears the timer and removes the agent from tracking.
	 *
	 * @param agentId - Agent identifier
	 * @returns True if agent was tracked and cancelled
	 */
	cancelTracking(agentId: string): boolean {
		const agent = this.agents.get(agentId);
		if (!agent) {
			return false;
		}

		if (agent.timer !== null) {
			clearTimeout(agent.timer);
			agent.timer = null;
		}

		this.agents.delete(agentId);
		return true;
	}

	/**
	 * Destroy all tracked agents and clear all timers.
	 * Marks running agents as "error". Used for graceful shutdown.
	 *
	 * @returns Number of agents destroyed
	 */
	destroyAll(): number {
		let count = 0;

		for (const agent of this.agents.values()) {
			if (agent.timer !== null) {
				clearTimeout(agent.timer);
				agent.timer = null;
			}

			if (agent.status === "running") {
				agent.status = "error";
			}

			count++;
		}

		this.agents.clear();
		return count;
	}

	/**
	 * Create a security event for a timeout.
	 * Returns a SecurityEvent (without id/timestamp) for logging.
	 *
	 * @param agent - Tracked agent that timed out
	 * @returns SecurityEvent without id and timestamp
	 */
	createTimeoutEvent(
		agent: TrackedAgent,
	): Omit<SecurityEvent, "id" | "timestamp"> {
		const elapsedMs = Date.now() - agent.startTime;

		return {
			type: "QUARANTINE_TIMEOUT",
			agentId: agent.agentId,
			sessionId: agent.sessionId,
			severity: "high",
			message: `Quarantine agent timed out after ${elapsedMs}ms (limit: ${agent.timeoutMs}ms)`,
			context: {
				timeoutMs: agent.timeoutMs,
				elapsedMs,
				startTime: agent.startTime,
			},
		};
	}

	/**
	 * Wrap a promise with timeout enforcement.
	 *
	 * Races the provided promise against a timeout. On timeout, resolves
	 * with TimeoutResult (does NOT reject — graceful degradation).
	 * Automatically tracks and completes the agent.
	 *
	 * @param agentId - Agent identifier
	 * @param sessionId - Session identifier
	 * @param promise - Promise to wrap with timeout
	 * @param timeoutMs - Timeout duration in ms (uses default if omitted)
	 * @returns Promise resolving to the result or TimeoutResult on timeout
	 */
	async withTimeout<T>(
		agentId: string,
		sessionId: string,
		promise: Promise<T>,
		timeoutMs?: number,
	): Promise<T | TimeoutResult> {
		const timeout = timeoutMs ?? this.defaultTimeoutMs;

		// Track the agent (sets the primary timer)
		this.trackAgent(agentId, sessionId, timeout);

		// Create a timeout promise that resolves (not rejects) on timeout
		const timeoutPromise = new Promise<TimeoutResult>((resolve) => {
			const agent = this.agents.get(agentId);
			if (!agent) {
				// Should not happen since we just tracked it
				resolve({
					agentId,
					sessionId,
					elapsedMs: 0,
					timedOut: true,
				});
				return;
			}

			// Replace the onTimeout callback to resolve this promise
			const originalOnTimeout = agent.onTimeout;
			agent.onTimeout = (id: string) => {
				if (originalOnTimeout) {
					try {
						originalOnTimeout(id);
					} catch (_err) {
						// Swallow
					}
				}
				resolve({
					agentId: id,
					sessionId,
					elapsedMs: Date.now() - agent.startTime,
					timedOut: true,
				});
			};
		});

		try {
			const result = await Promise.race([promise, timeoutPromise]);

			// Check if result is a TimeoutResult
			if (isTimeoutResult(result)) {
				return result;
			}

			// Promise completed successfully — mark agent done
			this.completeAgent(agentId, result);
			return result as T;
		} catch (error) {
			// Promise rejected — mark as error and clean up timer
			const agent = this.agents.get(agentId);
			if (agent) {
				if (agent.timer !== null) {
					clearTimeout(agent.timer);
					agent.timer = null;
				}
				agent.status = "error";
			}
			throw error;
		}
	}
}

/**
 * Type guard to check if a value is a TimeoutResult.
 *
 * @param value - Value to check
 * @returns True if value matches TimeoutResult shape with timedOut === true
 */
function isTimeoutResult(value: unknown): value is TimeoutResult {
	return (
		typeof value === "object" &&
		value !== null &&
		"timedOut" in value &&
		(value as TimeoutResult).timedOut === true &&
		"agentId" in value &&
		"sessionId" in value
	);
}
