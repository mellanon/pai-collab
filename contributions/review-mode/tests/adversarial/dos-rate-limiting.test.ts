import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { RateLimiter } from "../../src/hooks/rate-limiter.js";
import type { RateLimiterConfig } from "../../src/lib/types.js";

describe("AS-006: DoS via Infinite Tool Calls", () => {
  let rateLimiter: RateLimiterConfig;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxToolCallsPerMinute: 100,
      maxConcurrentQuarantineAgents: 5,
    });
  });

  it("should allow exactly 100 tool calls within rate limit", () => {
    const agentId = crypto.randomUUID();
    rateLimiter.registerAgent(agentId);

    for (let i = 0; i < 100; i++) {
      const result = rateLimiter.checkRateLimit(agentId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99 - i);
    }
  });

  it("should block 101st tool call", () => {
    const agentId = crypto.randomUUID();
    rateLimiter.registerAgent(agentId);

    // Make 100 calls
    for (let i = 0; i < 100; i++) {
      rateLimiter.checkRateLimit(agentId);
    }

    // 101st call should be blocked
    const result = rateLimiter.checkRateLimit(agentId);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/rate limit|exceeded/i);
  });

  it("should provide clear rate limit reason message", () => {
    const agentId = crypto.randomUUID();
    rateLimiter.registerAgent(agentId);

    // Exhaust limit
    for (let i = 0; i < 100; i++) {
      rateLimiter.checkRateLimit(agentId);
    }

    const result = rateLimiter.checkRateLimit(agentId);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.reason).toContain("100");
  });

  it("should reject 6th agent when max concurrent is 5", () => {
    const agents = Array.from({ length: 6 }, () => crypto.randomUUID());

    // Register first 5 agents - should succeed
    for (let i = 0; i < 5; i++) {
      const registered = rateLimiter.registerAgent(agents[i]);
      expect(registered).toBe(true);
    }

    // 6th agent should be rejected
    const registered = rateLimiter.registerAgent(agents[5]);
    expect(registered).toBe(false);
  });

  it("should allow new agent registration after one is unregistered", () => {
    const agents = Array.from({ length: 6 }, () => crypto.randomUUID());

    // Register 5 agents
    for (let i = 0; i < 5; i++) {
      rateLimiter.registerAgent(agents[i]);
    }

    // Unregister one
    rateLimiter.unregisterAgent(agents[0]);

    // Now 6th agent should succeed
    const registered = rateLimiter.registerAgent(agents[5]);
    expect(registered).toBe(true);
  });

  it("should maintain independent rate limits per agent", () => {
    const agent1 = crypto.randomUUID();
    const agent2 = crypto.randomUUID();

    rateLimiter.registerAgent(agent1);
    rateLimiter.registerAgent(agent2);

    // Agent 1 makes 100 calls
    for (let i = 0; i < 100; i++) {
      rateLimiter.checkRateLimit(agent1);
    }

    // Agent 1 should be blocked
    expect(rateLimiter.checkRateLimit(agent1).allowed).toBe(false);

    // Agent 2 should still have full quota
    const result = rateLimiter.checkRateLimit(agent2);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it("should track remaining calls correctly", () => {
    const agentId = crypto.randomUUID();
    rateLimiter.registerAgent(agentId);

    // Make 50 calls
    for (let i = 0; i < 50; i++) {
      rateLimiter.checkRateLimit(agentId);
    }

    const result = rateLimiter.checkRateLimit(agentId);
    expect(result.remaining).toBe(49); // 100 - 50 - 1 = 49
  });

  it("should reset rate limits on reset()", () => {
    const agentId = crypto.randomUUID();
    rateLimiter.registerAgent(agentId);

    // Exhaust limit
    for (let i = 0; i < 100; i++) {
      rateLimiter.checkRateLimit(agentId);
    }

    expect(rateLimiter.checkRateLimit(agentId).allowed).toBe(false);

    // Reset
    rateLimiter.reset();

    // Need to re-register
    rateLimiter.registerAgent(agentId);

    // Should have full quota again
    const result = rateLimiter.checkRateLimit(agentId);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });
});
