/**
 * Performance benchmarks for Review Mode Phase 4 NFR validation
 *
 * NFR-001: HMAC generation completes under 50ms average
 * NFR-002: Hook overhead under 10ms p99
 * NFR-003: Quarantine spawn preparation under 2s p95
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateHMACKey, createHMAC, verifyHMAC } from "../../src/lib/hmac-ops.js";
import {
  createTypedReference,
  verifyTypedReference,
} from "../../src/lib/typed-reference.js";
import { enforceReviewMode } from "../../src/hooks/review-mode-hook.js";
import { prepareQuarantineSpawn } from "../../src/quarantine/agent-metadata.js";
import { SessionManager } from "../../src/lib/session-manager.js";
import type { AgentMetadata } from "../../src/lib/types.js";

/**
 * Manual performance measurement with percentile calculation
 */
function measureMs(
  fn: () => void,
  iterations: number
): { avg: number; p95: number; p99: number; min: number; max: number } {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    p95: times[Math.floor(times.length * 0.95)] ?? 0,
    p99: times[Math.floor(times.length * 0.99)] ?? 0,
    min: times[0] ?? 0,
    max: times[times.length - 1] ?? 0,
  };
}

describe("NFR-001: HMAC Operations Performance (<50ms average)", () => {
  const iterations = 1000;

  it("generateHMACKey() completes under 50ms average", () => {
    const result = measureMs(() => {
      generateHMACKey(32);
    }, iterations);

    console.log(
      `generateHMACKey: avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.avg).toBeLessThan(50);
  });

  it("createHMAC() completes under 50ms average", () => {
    const key = generateHMACKey(32);
    const data = "test data for signing";

    const result = measureMs(() => {
      createHMAC(data, key);
    }, iterations);

    console.log(
      `createHMAC: avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.avg).toBeLessThan(50);
  });

  it("verifyHMAC() completes under 50ms average", () => {
    const key = generateHMACKey(32);
    const data = "test data for verification";
    const signature = createHMAC(data, key);

    const result = measureMs(() => {
      verifyHMAC(data, signature, key);
    }, iterations);

    console.log(
      `verifyHMAC: avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.avg).toBeLessThan(50);
  });

  it("createTypedReference() completes under 50ms average", () => {
    const key = generateHMACKey(32);
    const filePath = "/test/path/file.txt";
    const sessionId = "test-session-id";

    const result = measureMs(() => {
      createTypedReference(filePath, sessionId, key);
    }, iterations);

    console.log(
      `createTypedReference: avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.avg).toBeLessThan(50);
  });

  it("verifyTypedReference() completes under 50ms average", () => {
    const key = generateHMACKey(32);
    const filePath = "/test/path/file.txt";
    const sessionId = "test-session-id";
    const reference = createTypedReference(filePath, sessionId, key);

    const result = measureMs(() => {
      verifyTypedReference(reference, sessionId, key, 3600);
    }, iterations);

    console.log(
      `verifyTypedReference: avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.avg).toBeLessThan(50);
  });
});

describe("NFR-002: Hook Enforcement Performance (<10ms p99)", () => {
  const iterations = 1000;
  let metadata: AgentMetadata;

  beforeEach(() => {
    metadata = {
      agentId: "test-agent",
      sessionId: "test-session",
      isQuarantine: false,
      hmacKey: generateHMACKey(32),
    };
  });

  it("enforceReviewMode() with allowed tool completes under 10ms p99", () => {
    const result = measureMs(() => {
      enforceReviewMode("mcp_bash", { command: "ls" }, metadata);
    }, iterations);

    console.log(
      `enforceReviewMode (allowed): avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.p99).toBeLessThan(10);
  });

  it("enforceReviewMode() with denied tool completes under 10ms p99", () => {
    const result = measureMs(() => {
      enforceReviewMode("mcp_write", { filePath: "/test/file.txt" }, metadata);
    }, iterations);

    console.log(
      `enforceReviewMode (denied): avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.p99).toBeLessThan(10);
  });

  it("enforceReviewMode() with TypedReference validation completes under 10ms p99", () => {
    const key = metadata.hmacKey!;
    const sessionId = metadata.sessionId;
    const reference = createTypedReference("/test/path/file.txt", sessionId, key);

    const result = measureMs(() => {
      enforceReviewMode(
        "mcp_read",
        { filePath: JSON.stringify(reference) },
        metadata
      );
    }, iterations);

    console.log(
      `enforceReviewMode (TypedReference): avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.p99).toBeLessThan(10);
  });
});

describe("NFR-003: Quarantine Spawn Preparation Performance (<2s p95)", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager(32);
  });

  afterEach(() => {
    sessionManager.destroyAllSessions();
  });

  it("prepareQuarantineSpawn() with 1 file completes under 2s p95", () => {
    const iterations = 100;
    const filePaths = ["/test/file1.txt"];

    const result = measureMs(() => {
      prepareQuarantineSpawn(sessionManager, {
        filePaths,
        instructions: "Review this file",
      });
      // Clean up session after each iteration
      sessionManager.destroyAllSessions();
    }, iterations);

    console.log(
      `prepareQuarantineSpawn (1 file): avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.p95).toBeLessThan(2000);
  });

  it("prepareQuarantineSpawn() with 10 files completes under 2s p95", () => {
    const iterations = 100;
    const filePaths = Array.from(
      { length: 10 },
      (_, i) => `/test/file${i + 1}.txt`
    );

    const result = measureMs(() => {
      prepareQuarantineSpawn(sessionManager, {
        filePaths,
        instructions: "Review these files",
      });
      // Clean up session after each iteration
      sessionManager.destroyAllSessions();
    }, iterations);

    console.log(
      `prepareQuarantineSpawn (10 files): avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.p95).toBeLessThan(2000);
  });

  it("prepareQuarantineSpawn() with 50 files completes under 2s p95", () => {
    const iterations = 50;
    const filePaths = Array.from(
      { length: 50 },
      (_, i) => `/test/file${i + 1}.txt`
    );

    const result = measureMs(() => {
      prepareQuarantineSpawn(sessionManager, {
        filePaths,
        instructions: "Review these files",
      });
      // Clean up session after each iteration
      sessionManager.destroyAllSessions();
    }, iterations);

    console.log(
      `prepareQuarantineSpawn (50 files): avg=${result.avg.toFixed(3)}ms, p95=${result.p95.toFixed(3)}ms, p99=${result.p99.toFixed(3)}ms, min=${result.min.toFixed(3)}ms, max=${result.max.toFixed(3)}ms`
    );

    expect(result.p95).toBeLessThan(2000);
  });
});
