import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  createTypedReference,
  verifyTypedReference,
} from "../../src/lib/typed-reference.js";
import { generateHMACKey } from "../../src/lib/hmac-ops.js";
import type { AgentMetadata } from "../../src/lib/types.js";

function makeQuarantineMetadata(overrides?: Partial<AgentMetadata>): AgentMetadata {
  return {
    agentId: `quarantine-${crypto.randomUUID()}`,
    sessionId: crypto.randomUUID(),
    isQuarantine: true,
    hmacKey: generateHMACKey(),
    ...overrides,
  };
}

function makeMainMetadata(overrides?: Partial<AgentMetadata>): AgentMetadata {
  return {
    agentId: `main-${crypto.randomUUID()}`,
    sessionId: crypto.randomUUID(),
    isQuarantine: false,
    hmacKey: generateHMACKey(),
    ...overrides,
  };
}

describe("AS-003: Context Confusion Attack", () => {
  let sessionA: AgentMetadata;
  let sessionB: AgentMetadata;

  beforeEach(() => {
    sessionA = makeMainMetadata();
    sessionB = makeQuarantineMetadata();
  });

  it("should reject TypedReference from session A when verified in session B", () => {
    const refFromA = createTypedReference("/src/file.ts", sessionA.sessionId, sessionA.hmacKey!);

    const result = verifyTypedReference(refFromA, sessionB.sessionId, sessionB.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/HMAC|session/i);
  });

  it("should reject TypedReference from session B when verified in session A", () => {
    const refFromB = createTypedReference("/src/file.ts", sessionB.sessionId, sessionB.hmacKey!);

    const result = verifyTypedReference(refFromB, sessionA.sessionId, sessionA.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/HMAC|session/i);
  });

  it("should reject cross-session verification with correct HMAC key but wrong sessionId", () => {
    const refFromA = createTypedReference("/src/file.ts", sessionA.sessionId, sessionA.hmacKey!);

    // Attempt to verify with session A's key but session B's ID
    const result = verifyTypedReference(refFromA, sessionB.sessionId, sessionA.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/session/i);
  });

  it("should reject cross-session verification with correct sessionId but wrong HMAC key", () => {
    const refFromA = createTypedReference("/src/file.ts", sessionA.sessionId, sessionA.hmacKey!);

    // Attempt to verify with session A's ID but session B's key
    const result = verifyTypedReference(refFromA, sessionA.sessionId, sessionB.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/(HMAC|verification failed|Session mismatch)/i);
  });

  it("should accept TypedReference when verified in same session", () => {
    const refFromA = createTypedReference("/src/file.ts", sessionA.sessionId, sessionA.hmacKey!);

    const result = verifyTypedReference(refFromA, sessionA.sessionId, sessionA.hmacKey!);

    expect(result.valid).toBe(true);
  });

  it("should prevent main session's HMAC from being used in quarantine context", () => {
    // Create reference in main session
    const mainRef = createTypedReference("/src/config.ts", sessionA.sessionId, sessionA.hmacKey!);

    // Attempt to use in quarantine session with stolen HMAC key
    const result = verifyTypedReference(mainRef, sessionB.sessionId, sessionA.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/session/i);
  });

  it("should prevent quarantine session's HMAC from accessing main session references", () => {
    // Create reference in quarantine session
    const quarantineRef = createTypedReference("/src/data.ts", sessionB.sessionId, sessionB.hmacKey!);

    // Attempt to use in main session
    const result = verifyTypedReference(quarantineRef, sessionA.sessionId, sessionA.hmacKey!);

    expect(result.valid).toBe(false);
  });

  it("should ensure session isolation even with identical paths", () => {
    const samePath = "/src/shared.ts";
    
    const refA = createTypedReference(samePath, sessionA.sessionId, sessionA.hmacKey!);
    const refB = createTypedReference(samePath, sessionB.sessionId, sessionB.hmacKey!);

    // Each reference should only work in its own session
    expect(verifyTypedReference(refA, sessionA.sessionId, sessionA.hmacKey!).valid).toBe(true);
    expect(verifyTypedReference(refB, sessionB.sessionId, sessionB.hmacKey!).valid).toBe(true);
    
    expect(verifyTypedReference(refA, sessionB.sessionId, sessionB.hmacKey!).valid).toBe(false);
    expect(verifyTypedReference(refB, sessionA.sessionId, sessionA.hmacKey!).valid).toBe(false);
  });
});
