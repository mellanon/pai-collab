import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  createTypedReference,
  verifyTypedReference,
} from "../../src/lib/typed-reference.js";
import { SessionManager } from "../../src/lib/session-manager.js";
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

describe("AS-005: Replay Attack", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  it("should reject TypedReference after session is destroyed", () => {
    const agentId = "agent-1";
    const sessionData = sessionManager.createSession(agentId, true);
    
    const ref = createTypedReference("/src/file.ts", sessionData.sessionId, sessionData.hmacKey);

    // Verify it works initially
    let result = verifyTypedReference(ref, sessionData.sessionId, sessionData.hmacKey);
    expect(result.valid).toBe(true);

    // Destroy session
    sessionManager.destroySession(sessionData.sessionId);

    // Create new session with different key
    const newSession = sessionManager.createSession(agentId, true);

    // Attempt to use old reference in new session
    result = verifyTypedReference(ref, newSession.sessionId, newSession.hmacKey);
    expect(result.valid).toBe(false);
  });

  it("should reject expired TypedReference based on TTL", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("/src/file.ts", metadata.sessionId, metadata.hmacKey!);
    
    // Artificially set timestamp to past (4 hours ago in seconds, beyond 1 hour default TTL)
    ref.timestamp = Math.floor(Date.now() / 1000) - (4 * 60 * 60);

    const result = verifyTypedReference(ref, metadata.sessionId, metadata.hmacKey!, 3600);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/expired|TTL/i);
  });

  it("should accept newly created TypedReference within TTL", () => {
    const metadata = makeQuarantineMetadata();
    
    // Create reference now - it will have current timestamp
    const ref = createTypedReference("/src/file.ts", metadata.sessionId, metadata.hmacKey!);

    // Verify immediately (within TTL)
    const result = verifyTypedReference(ref, metadata.sessionId, metadata.hmacKey!, 3600);

    expect(result.valid).toBe(true);
  });

  it("should reject TypedReference created in old session when used in new session", () => {
    const agentId = "agent-2";
    const sessionA = sessionManager.createSession(agentId, true);
    
    const ref = createTypedReference("/src/data.ts", sessionA.sessionId, sessionA.hmacKey);

    // Destroy session A
    sessionManager.destroySession(sessionA.sessionId);

    // Create new session B
    const sessionB = sessionManager.createSession(agentId, true);

    // Attempt to use session A's reference with session B's credentials
    const result = verifyTypedReference(ref, sessionB.sessionId, sessionB.hmacKey);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/HMAC|session/i);
  });

  it("should reject TypedReference with wrong session key", () => {
    const metadata1 = makeQuarantineMetadata();
    const metadata2 = makeQuarantineMetadata();
    
    const ref = createTypedReference("/src/file.ts", metadata1.sessionId, metadata1.hmacKey!);

    // Attempt to verify with different session's key
    const result = verifyTypedReference(ref, metadata1.sessionId, metadata2.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/(HMAC|verification failed|Session mismatch)/i);
  });

  it("should accept TypedReference in same valid session", () => {
    const metadata = makeQuarantineMetadata();
    
    const ref = createTypedReference("/src/file.ts", metadata.sessionId, metadata.hmacKey!);

    const result = verifyTypedReference(ref, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it("should reject replayed TypedReference across session rotation", () => {
    const agentId = "agent-3";
    
    // Session 1
    const session1 = sessionManager.createSession(agentId, true);
    const ref1 = createTypedReference("/src/file.ts", session1.sessionId, session1.hmacKey);
    
    // Session 2 (after rotation)
    sessionManager.destroySession(session1.sessionId);
    const session2 = sessionManager.createSession(agentId, true);
    
    // Session 3 (after another rotation)
    sessionManager.destroySession(session2.sessionId);
    const session3 = sessionManager.createSession(agentId, true);

    // Attempt to replay reference from session 1 in session 3
    const result = verifyTypedReference(ref1, session3.sessionId, session3.hmacKey);

    expect(result.valid).toBe(false);
  });

  it("should enforce TTL strictly at boundary", () => {
    const metadata = makeQuarantineMetadata();
    const ttl = 60; // 60 seconds
    
    const ref = createTypedReference("/src/file.ts", metadata.sessionId, metadata.hmacKey!);
    
    // Set timestamp to exactly TTL seconds ago
    ref.timestamp = Date.now() - (ttl * 1000);

    const result = verifyTypedReference(ref, metadata.sessionId, metadata.hmacKey!, ttl);

    // Should be rejected at or beyond TTL boundary
    expect(result.valid).toBe(false);
  });
});
