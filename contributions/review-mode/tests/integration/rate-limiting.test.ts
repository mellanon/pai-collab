import { describe, it, expect, beforeEach } from "vitest";
import { RateLimiter, DEFAULT_RATE_LIMITER_CONFIG } from "../../src/hooks/rate-limiter.js";
import type {
	RateLimiterConfig,
	RateLimitResult,
	AgentRateStats,
	GlobalRateStats,
} from "../../src/hooks/rate-limiter.js";

describe("RateLimiter", () => {
	// ════════════════════════════════════════════════════════════════════════
	// 1. Registration and Concurrency (ISC #13) (5 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Registration and Concurrency (ISC #13)", () => {
		let limiter: RateLimiter;

		beforeEach(() => {
			limiter = new RateLimiter({ maxConcurrentAgents: 5 });
		});

		it("should register the first agent successfully", () => {
			const result = limiter.registerAgent("agent-1");
			expect(result).toBe(true);
		});

		it("should be idempotent when registering the same agent twice", () => {
			const first = limiter.registerAgent("agent-1");
			const second = limiter.registerAgent("agent-1");
			expect(first).toBe(true);
			expect(second).toBe(true);
		});

		it("should allow registering up to maxConcurrentAgents (5)", () => {
			const results = [];
			for (let i = 1; i <= 5; i++) {
				results.push(limiter.registerAgent(`agent-${i}`));
			}
			expect(results.every((r) => r === true)).toBe(true);
		});

		it("should reject the 6th agent when max concurrent agents is reached", () => {
			for (let i = 1; i <= 5; i++) {
				limiter.registerAgent(`agent-${i}`);
			}

			const result = limiter.registerAgent("agent-6");
			expect(result).toBe(false);
		});

		it("should allow new registration after unregistering an agent", () => {
			for (let i = 1; i <= 5; i++) {
				limiter.registerAgent(`agent-${i}`);
			}

			expect(limiter.registerAgent("agent-6")).toBe(false);

			limiter.unregisterAgent("agent-3");

			expect(limiter.registerAgent("agent-6")).toBe(true);
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 2. Rate Limiting (ISC #12) (5 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Rate Limiting (ISC #12)", () => {
		let limiter: RateLimiter;

		beforeEach(() => {
			limiter = new RateLimiter({
				maxCallsPerMinute: 100,
				windowSizeMs: 60_000,
			});
		});

		it("should allow the first call with remaining = 99", () => {
			limiter.registerAgent("agent-1");
			const result = limiter.checkRateLimit("agent-1");

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(99);
		});

		it("should allow the 100th call with remaining = 0", () => {
			limiter.registerAgent("agent-1");

			for (let i = 0; i < 99; i++) {
				limiter.checkRateLimit("agent-1");
			}

			const result = limiter.checkRateLimit("agent-1");
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(0);
		});

		it("should block the 101st call within the window", () => {
			limiter.registerAgent("agent-1");

			for (let i = 0; i < 100; i++) {
				const result = limiter.checkRateLimit("agent-1");
				expect(result.allowed).toBe(true);
			}

			const result = limiter.checkRateLimit("agent-1");
			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
			expect(result.reason).toContain("Rate limit exceeded");
		});

		it("should deny calls from unregistered agents", () => {
			const result = limiter.checkRateLimit("unregistered-agent");

			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("Agent not registered");
		});

		it("should respect custom maxCallsPerMinute config", () => {
			const customLimiter = new RateLimiter({
				maxCallsPerMinute: 3,
				windowSizeMs: 60_000,
			});
			customLimiter.registerAgent("agent-1");

			for (let i = 0; i < 3; i++) {
				const result = customLimiter.checkRateLimit("agent-1");
				expect(result.allowed).toBe(true);
			}

			const result = customLimiter.checkRateLimit("agent-1");
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("Rate limit exceeded");
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 3. Sliding Window Behavior (3 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Sliding Window Behavior", () => {
		it("should reset calls after window expires", async () => {
			const limiter = new RateLimiter({
				maxCallsPerMinute: 5,
				windowSizeMs: 100,
			});
			limiter.registerAgent("agent-1");

			// Use up all calls
			for (let i = 0; i < 5; i++) {
				limiter.checkRateLimit("agent-1");
			}

			// 6th call should fail
			let result = limiter.checkRateLimit("agent-1");
			expect(result.allowed).toBe(false);

			// Wait for window to expire
			await new Promise((r) => setTimeout(r, 150));

			// Now calls should be allowed again
			result = limiter.checkRateLimit("agent-1");
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(4);
		});

		it("should reflect only calls within the current window", async () => {
			const limiter = new RateLimiter({
				maxCallsPerMinute: 10,
				windowSizeMs: 100,
			});
			limiter.registerAgent("agent-1");

			// Make 3 calls
			for (let i = 0; i < 3; i++) {
				limiter.checkRateLimit("agent-1");
			}

			let result = limiter.checkRateLimit("agent-1");
			expect(result.remaining).toBe(6); // 10 - 4 = 6

			// Wait for window to expire
			await new Promise((r) => setTimeout(r, 150));

			// Old calls should not count
			result = limiter.checkRateLimit("agent-1");
			expect(result.remaining).toBe(9); // 10 - 1 = 9
		});

		it("should provide a future resetAt timestamp", () => {
			const limiter = new RateLimiter({ windowSizeMs: 60_000 });
			limiter.registerAgent("agent-1");

			const now = Date.now();
			const result = limiter.checkRateLimit("agent-1");

			expect(result.resetAt).toBeGreaterThan(now);
			expect(result.resetAt).toBeLessThanOrEqual(now + 60_000 + 10); // small margin
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 4. Statistics (3 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Statistics", () => {
		let limiter: RateLimiter;

		beforeEach(() => {
			limiter = new RateLimiter({ maxCallsPerMinute: 100 });
		});

		it("should return correct agent stats for registered agent", () => {
			limiter.registerAgent("agent-1");

			for (let i = 0; i < 7; i++) {
				limiter.checkRateLimit("agent-1");
			}

			const stats = limiter.getAgentStats("agent-1");
			expect(stats).toBeDefined();
			expect(stats?.agentId).toBe("agent-1");
			expect(stats?.callsInWindow).toBe(7);
			expect(stats?.lastCallAt).toBeGreaterThan(0);
		});

		it("should return undefined for unregistered agent stats", () => {
			const stats = limiter.getAgentStats("nonexistent");
			expect(stats).toBeUndefined();
		});

		it("should provide accurate global statistics", () => {
			limiter.registerAgent("agent-1");
			limiter.registerAgent("agent-2");

			for (let i = 0; i < 5; i++) {
				limiter.checkRateLimit("agent-1");
			}
			for (let i = 0; i < 3; i++) {
				limiter.checkRateLimit("agent-2");
			}

			const stats = limiter.getGlobalStats();
			expect(stats.activeAgents).toBe(2);
			expect(stats.totalCallsAllAgents).toBe(8);
			expect(stats.maxConcurrentAgents).toBe(
				DEFAULT_RATE_LIMITER_CONFIG.maxConcurrentAgents,
			);
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 5. Reset (1 test)
	// ════════════════════════════════════════════════════════════════════════
	describe("Reset", () => {
		it("should clear all agents and state", () => {
			const limiter = new RateLimiter();

			limiter.registerAgent("agent-1");
			limiter.registerAgent("agent-2");
			limiter.checkRateLimit("agent-1");
			limiter.checkRateLimit("agent-2");

			let stats = limiter.getGlobalStats();
			expect(stats.activeAgents).toBe(2);
			expect(stats.totalCallsAllAgents).toBe(2);

			limiter.reset();

			stats = limiter.getGlobalStats();
			expect(stats.activeAgents).toBe(0);
			expect(stats.totalCallsAllAgents).toBe(0);
			expect(limiter.getAgentStats("agent-1")).toBeUndefined();
			expect(limiter.getAgentStats("agent-2")).toBeUndefined();

			expect(limiter.registerAgent("agent-1")).toBe(true);
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 6. Edge Cases (3 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Edge Cases", () => {
		it("should handle rapid successive calls correctly", () => {
			const limiter = new RateLimiter({ maxCallsPerMinute: 10 });
			limiter.registerAgent("agent-1");

			const results: boolean[] = [];
			for (let i = 0; i < 15; i++) {
				results.push(limiter.checkRateLimit("agent-1").allowed);
			}

			expect(results.slice(0, 10).every((r) => r === true)).toBe(true);
			expect(results.slice(10).every((r) => r === false)).toBe(true);
		});

		it("should maintain independent rate limits per agent", () => {
			const limiter = new RateLimiter({ maxCallsPerMinute: 5 });
			limiter.registerAgent("agent-1");
			limiter.registerAgent("agent-2");

			// Exhaust agent-1's limit
			for (let i = 0; i < 5; i++) {
				limiter.checkRateLimit("agent-1");
			}

			expect(limiter.checkRateLimit("agent-1").allowed).toBe(false);

			// agent-2 should still be allowed
			const agent2Result = limiter.checkRateLimit("agent-2");
			expect(agent2Result.allowed).toBe(true);
			expect(agent2Result.remaining).toBe(4);
		});

		it("should handle unregistering non-existent agents gracefully", () => {
			const limiter = new RateLimiter();

			expect(() => limiter.unregisterAgent("nonexistent")).not.toThrow();

			const stats = limiter.getGlobalStats();
			expect(stats.activeAgents).toBe(0);
		});
	});
});
