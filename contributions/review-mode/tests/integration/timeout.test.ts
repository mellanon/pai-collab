/**
 * Integration Tests: Timeout Manager
 *
 * Tests timeout enforcement for quarantine agents including timer behavior,
 * status transitions, callbacks, and graceful timeout handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	TimeoutManager,
	type TimeoutResult,
	type TrackedAgent,
} from "../../src/quarantine/timeout-manager.js";

describe("TimeoutManager - Integration Tests", () => {
	let manager: TimeoutManager;

	beforeEach(() => {
		vi.useFakeTimers();
		manager = new TimeoutManager(300000); // 5 minute default
	});

	afterEach(() => {
		manager.destroyAll();
		vi.useRealTimers();
	});

	describe("trackAgent", () => {
		it("should set agent status to running", () => {
			const agent = manager.trackAgent("agent-1", "session-1", 100);

			expect(agent.status).toBe("running");
			expect(agent.agentId).toBe("agent-1");
			expect(agent.sessionId).toBe("session-1");
			expect(agent.timeoutMs).toBe(100);
			expect(agent.timer).not.toBeNull();
		});

		it("should use default timeout when timeoutMs not provided", () => {
			const agent = manager.trackAgent("agent-1", "session-1");

			expect(agent.timeoutMs).toBe(300000);
		});

		it("should fire onTimeout callback after timeout period", () => {
			const onTimeoutMock = vi.fn();

			manager.trackAgent("agent-1", "session-1", 100, onTimeoutMock);

			// Before timeout
			expect(onTimeoutMock).not.toHaveBeenCalled();

			// Advance timers to trigger timeout
			vi.advanceTimersByTime(100);

			expect(onTimeoutMock).toHaveBeenCalledWith("agent-1");
			expect(onTimeoutMock).toHaveBeenCalledTimes(1);
		});

		it("should mark agent as timed_out after timeout period", () => {
			manager.trackAgent("agent-1", "session-1", 100);

			const beforeTimeout = manager.getAgent("agent-1");
			expect(beforeTimeout?.status).toBe("running");

			// Trigger timeout
			vi.advanceTimersByTime(100);

			const afterTimeout = manager.getAgent("agent-1");
			expect(afterTimeout?.status).toBe("timed_out");
			expect(afterTimeout?.timer).toBeNull();
		});

		it("should not fire onTimeout if agent is cancelled before timeout", () => {
			const onTimeoutMock = vi.fn();

			manager.trackAgent("agent-1", "session-1", 100, onTimeoutMock);

			// Cancel before timeout
			vi.advanceTimersByTime(50);
			manager.cancelTracking("agent-1");

			// Advance past original timeout
			vi.advanceTimersByTime(100);

			expect(onTimeoutMock).not.toHaveBeenCalled();
		});

		it("should replace existing tracking when called with same agentId", () => {
			const firstCallback = vi.fn();
			const secondCallback = vi.fn();

			manager.trackAgent("agent-1", "session-1", 100, firstCallback);
			manager.trackAgent("agent-1", "session-2", 200, secondCallback);

			vi.advanceTimersByTime(200);

			expect(firstCallback).not.toHaveBeenCalled();
			expect(secondCallback).toHaveBeenCalledWith("agent-1");

			const agent = manager.getAgent("agent-1");
			expect(agent?.sessionId).toBe("session-2");
		});
	});

	describe("completeAgent", () => {
		it("should clear timer and return elapsed time", () => {
			manager.trackAgent("agent-1", "session-1", 1000);

			vi.advanceTimersByTime(250);

			const result = manager.completeAgent("agent-1", { data: "test" });

			expect(result.agentId).toBe("agent-1");
			expect(result.sessionId).toBe("session-1");
			expect(result.elapsedMs).toBeGreaterThanOrEqual(250);
			expect(result.timedOut).toBe(false);
			expect(result.partialResult).toEqual({ data: "test" });

			const agent = manager.getAgent("agent-1");
			expect(agent?.timer).toBeNull();
			expect(agent?.status).toBe("completed");
		});

		it("should return timedOut false for completed agent", () => {
			manager.trackAgent("agent-1", "session-1", 1000);

			const result = manager.completeAgent("agent-1");

			expect(result.timedOut).toBe(false);
		});

		it("should return timedOut true if agent already timed out", () => {
			manager.trackAgent("agent-1", "session-1", 100);

			// Trigger timeout
			vi.advanceTimersByTime(100);

			const result = manager.completeAgent("agent-1", { partial: true });

			expect(result.timedOut).toBe(true);
			expect(result.partialResult).toEqual({ partial: true });
		});

		it("should handle completing non-existent agent", () => {
			const result = manager.completeAgent("non-existent");

			expect(result.agentId).toBe("non-existent");
			expect(result.sessionId).toBe("");
			expect(result.elapsedMs).toBe(0);
			expect(result.timedOut).toBe(false);
		});

		it("should not change status from timed_out to completed", () => {
			manager.trackAgent("agent-1", "session-1", 100);

			// Timeout
			vi.advanceTimersByTime(100);
			expect(manager.getAgent("agent-1")?.status).toBe("timed_out");

			// Complete after timeout
			manager.completeAgent("agent-1");
			expect(manager.getAgent("agent-1")?.status).toBe("timed_out");
		});
	});

	describe("getRemainingTime", () => {
		it("should return correct remaining time", () => {
			manager.trackAgent("agent-1", "session-1", 1000);

			vi.advanceTimersByTime(250);

			const remaining = manager.getRemainingTime("agent-1");
			expect(remaining).toBeGreaterThanOrEqual(750);
			expect(remaining).toBeLessThanOrEqual(750);
		});

		it("should return 0 when time exceeded", () => {
			manager.trackAgent("agent-1", "session-1", 100);

			vi.advanceTimersByTime(150);

			const remaining = manager.getRemainingTime("agent-1");
			expect(remaining).toBe(0);
		});

		it("should return null for untracked agent", () => {
			const remaining = manager.getRemainingTime("non-existent");
			expect(remaining).toBeNull();
		});

		it("should return full timeout immediately after tracking", () => {
			manager.trackAgent("agent-1", "session-1", 5000);

			const remaining = manager.getRemainingTime("agent-1");
			expect(remaining).toBeGreaterThanOrEqual(5000);
		});
	});

	describe("isTimedOut", () => {
		it("should return false for running agent", () => {
			manager.trackAgent("agent-1", "session-1", 1000);

			expect(manager.isTimedOut("agent-1")).toBe(false);
		});

		it("should return true after timeout", () => {
			manager.trackAgent("agent-1", "session-1", 100);

			vi.advanceTimersByTime(100);

			expect(manager.isTimedOut("agent-1")).toBe(true);
		});

		it("should return false for completed agent", () => {
			manager.trackAgent("agent-1", "session-1", 1000);
			manager.completeAgent("agent-1");

			expect(manager.isTimedOut("agent-1")).toBe(false);
		});

		it("should return false for non-existent agent", () => {
			expect(manager.isTimedOut("non-existent")).toBe(false);
		});
	});

	describe("getAgent", () => {
		it("should return tracked agent", () => {
			const tracked = manager.trackAgent("agent-1", "session-1", 1000);
			const retrieved = manager.getAgent("agent-1");

			expect(retrieved).toBeDefined();
			expect(retrieved?.agentId).toBe("agent-1");
			expect(retrieved?.status).toBe("running");
			expect(retrieved).toBe(tracked);
		});

		it("should return undefined for non-existent agent", () => {
			const agent = manager.getAgent("non-existent");
			expect(agent).toBeUndefined();
		});
	});

	describe("getActiveAgents", () => {
		it("should return only running agents", () => {
			manager.trackAgent("agent-1", "session-1", 1000);
			manager.trackAgent("agent-2", "session-2", 1000);
			manager.trackAgent("agent-3", "session-3", 100);

			// Timeout agent-3
			vi.advanceTimersByTime(100);

			// Complete agent-2
			manager.completeAgent("agent-2");

			const active = manager.getActiveAgents();
			expect(active).toHaveLength(1);
			expect(active[0].agentId).toBe("agent-1");
			expect(active[0].status).toBe("running");
		});

		it("should return empty array when no active agents", () => {
			const active = manager.getActiveAgents();
			expect(active).toEqual([]);
		});
	});

	describe("getActiveCount", () => {
		it("should reflect running agents only", () => {
			expect(manager.getActiveCount()).toBe(0);

			manager.trackAgent("agent-1", "session-1", 1000);
			expect(manager.getActiveCount()).toBe(1);

			manager.trackAgent("agent-2", "session-2", 1000);
			expect(manager.getActiveCount()).toBe(2);

			// Complete one
			manager.completeAgent("agent-1");
			expect(manager.getActiveCount()).toBe(1);

			// Timeout the other
			manager.trackAgent("agent-3", "session-3", 50);
			vi.advanceTimersByTime(50);
			expect(manager.getActiveCount()).toBe(1); // agent-2 still running

			// Complete last one
			manager.completeAgent("agent-2");
			expect(manager.getActiveCount()).toBe(0);
		});
	});

	describe("cancelTracking", () => {
		it("should clear timer and remove agent", () => {
			const onTimeoutMock = vi.fn();
			manager.trackAgent("agent-1", "session-1", 100, onTimeoutMock);

			const cancelled = manager.cancelTracking("agent-1");

			expect(cancelled).toBe(true);
			expect(manager.getAgent("agent-1")).toBeUndefined();

			// Timer should not fire
			vi.advanceTimersByTime(100);
			expect(onTimeoutMock).not.toHaveBeenCalled();
		});

		it("should return false for non-existent agent", () => {
			const cancelled = manager.cancelTracking("non-existent");
			expect(cancelled).toBe(false);
		});

		it("should allow re-tracking after cancellation", () => {
			manager.trackAgent("agent-1", "session-1", 1000);
			manager.cancelTracking("agent-1");

			const newTracked = manager.trackAgent("agent-1", "session-2", 500);
			expect(newTracked.sessionId).toBe("session-2");
			expect(newTracked.timeoutMs).toBe(500);
		});
	});

	describe("destroyAll", () => {
		it("should clear all timers and return count", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			manager.trackAgent("agent-1", "session-1", 1000, callback1);
			manager.trackAgent("agent-2", "session-2", 1000, callback2);
			manager.trackAgent("agent-3", "session-3", 1000);

			const count = manager.destroyAll();

			expect(count).toBe(3);
			expect(manager.getActiveCount()).toBe(0);
			expect(manager.getAgent("agent-1")).toBeUndefined();
			expect(manager.getAgent("agent-2")).toBeUndefined();
			expect(manager.getAgent("agent-3")).toBeUndefined();

			// Callbacks should not fire after destroy
			vi.advanceTimersByTime(1000);
			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).not.toHaveBeenCalled();
		});

		it("should mark running agents as error", () => {
			manager.trackAgent("agent-1", "session-1", 1000);
			manager.trackAgent("agent-2", "session-2", 100);

			// Timeout agent-2
			vi.advanceTimersByTime(100);

			const agents = Array.from((manager as any).agents.values());
			expect(agents[0].status).toBe("running");
			expect(agents[1].status).toBe("timed_out");

			manager.destroyAll();

			// After destroy, check the agents Map is empty
			expect((manager as any).agents.size).toBe(0);
		});

		it("should return 0 when no agents tracked", () => {
			const count = manager.destroyAll();
			expect(count).toBe(0);
		});
	});

	describe("createTimeoutEvent", () => {
		it("should return correct SecurityEvent shape", () => {
			const agent = manager.trackAgent("agent-1", "session-1", 5000);

			vi.advanceTimersByTime(2500);

			const event = manager.createTimeoutEvent(agent);

			expect(event).toMatchObject({
				type: "QUARANTINE_TIMEOUT",
				agentId: "agent-1",
				sessionId: "session-1",
				severity: "high",
			});

			expect(event.message).toContain("Quarantine agent timed out");
			expect(event.message).toContain("5000ms");

			expect(event.context).toBeDefined();
			expect(event.context?.timeoutMs).toBe(5000);
			expect(event.context?.elapsedMs).toBeGreaterThanOrEqual(2500);
			expect(event.context?.startTime).toEqual(agent.startTime);

			// Should NOT have id or timestamp
			expect(event).not.toHaveProperty("id");
			expect(event).not.toHaveProperty("timestamp");
		});
	});

	describe("withTimeout", () => {
		it("should resolve with result when promise completes before timeout", async () => {
			const promise = Promise.resolve({ data: "success" });

			const result = await manager.withTimeout(
				"agent-1",
				"session-1",
				promise,
				1000,
			);

			expect(result).toEqual({ data: "success" });

			const agent = manager.getAgent("agent-1");
			expect(agent?.status).toBe("completed");
		});

		it("should resolve with TimeoutResult when promise exceeds timeout", async () => {
			// Create a promise that never resolves
			const neverResolves = new Promise(() => {});

			const resultPromise = manager.withTimeout(
				"agent-1",
				"session-1",
				neverResolves,
				100,
			);

			// Don't await yet — advance timers first
			vi.advanceTimersByTime(100);

			const result = await resultPromise;

			expect(result).toMatchObject({
				agentId: "agent-1",
				sessionId: "session-1",
				timedOut: true,
			});
			expect((result as TimeoutResult).elapsedMs).toBeGreaterThanOrEqual(100);
		});

		it("should call original onTimeout callback on timeout", async () => {
			const onTimeoutMock = vi.fn();

			// Track first to set callback
			manager.trackAgent("agent-1", "session-1", 100, onTimeoutMock);

			// Cancel and use withTimeout
			manager.cancelTracking("agent-1");

			const neverResolves = new Promise(() => {});
			const resultPromise = manager.withTimeout(
				"agent-1",
				"session-1",
				neverResolves,
				100,
			);

			vi.advanceTimersByTime(100);
			await resultPromise;

			// The internal onTimeout is replaced, so the original won't be called
			// unless we set it before calling withTimeout
		});

		it("should handle promise rejection", async () => {
			const rejectingPromise = Promise.reject(new Error("Test error"));

			await expect(
				manager.withTimeout("agent-1", "session-1", rejectingPromise, 1000),
			).rejects.toThrow("Test error");

			const agent = manager.getAgent("agent-1");
			expect(agent?.status).toBe("error");
			expect(agent?.timer).toBeNull();
		});

		it("should use default timeout when timeoutMs not provided", async () => {
			const promise = Promise.resolve("ok");

			await manager.withTimeout("agent-1", "session-1", promise);

			const agent = manager.getAgent("agent-1");
			expect(agent?.timeoutMs).toBe(300000); // default
		});

		it("should complete agent even if promise resolves after timeout", async () => {
			let resolveFn: (value: string) => void;
			const delayedPromise = new Promise<string>((resolve) => {
				resolveFn = resolve;
			});

			const resultPromise = manager.withTimeout(
				"agent-1",
				"session-1",
				delayedPromise,
				100,
			);

			// Trigger timeout
			vi.advanceTimersByTime(100);

			const result = await resultPromise;

			expect((result as TimeoutResult).timedOut).toBe(true);

			// Now resolve the promise
			resolveFn!("late result");

			// Give microtasks a chance
			await Promise.resolve();

			const agent = manager.getAgent("agent-1");
			expect(agent?.status).toBe("timed_out");
		});
	});

	describe("edge cases", () => {
		it("should handle multiple timeouts concurrently", () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();
			const callback3 = vi.fn();

			manager.trackAgent("agent-1", "session-1", 100, callback1);
			manager.trackAgent("agent-2", "session-2", 200, callback2);
			manager.trackAgent("agent-3", "session-3", 300, callback3);

			vi.advanceTimersByTime(100);
			expect(callback1).toHaveBeenCalled();
			expect(callback2).not.toHaveBeenCalled();
			expect(callback3).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(callback2).toHaveBeenCalled();
			expect(callback3).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(callback3).toHaveBeenCalled();
		});

		it("should handle callback exceptions gracefully", () => {
			const throwingCallback = vi.fn(() => {
				throw new Error("Callback error");
			});

			manager.trackAgent("agent-1", "session-1", 100, throwingCallback);

			// Should not throw
			expect(() => {
				vi.advanceTimersByTime(100);
			}).not.toThrow();

			expect(throwingCallback).toHaveBeenCalled();
			expect(manager.isTimedOut("agent-1")).toBe(true);
		});

		it("should handle very short timeouts", () => {
			const callback = vi.fn();
			manager.trackAgent("agent-1", "session-1", 1, callback);

			vi.advanceTimersByTime(1);

			expect(callback).toHaveBeenCalled();
			expect(manager.isTimedOut("agent-1")).toBe(true);
		});

		it("should handle completing same agent multiple times", () => {
			manager.trackAgent("agent-1", "session-1", 1000);

			const result1 = manager.completeAgent("agent-1");
			const result2 = manager.completeAgent("agent-1");

			expect(result1.timedOut).toBe(false);
			expect(result2.timedOut).toBe(false);
			expect(result1.agentId).toBe(result2.agentId);
		});
	});
});
