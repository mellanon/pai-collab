import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import {
  createTypedReference,
  verifyTypedReference,
  serializeTypedReference,
  parseTypedReference,
} from "../../src/lib/typed-reference.js";
import { generateHMACKey } from "../../src/lib/hmac-ops.js";
import type { AgentMetadata } from "../../src/lib/types.js";
import type { TypedReference } from "../../src/lib/typed-reference.js";

function makeQuarantineMetadata(overrides?: Partial<AgentMetadata>): AgentMetadata {
  return {
    agentId: `quarantine-${crypto.randomUUID()}`,
    sessionId: crypto.randomUUID(),
    isQuarantine: true,
    hmacKey: generateHMACKey(),
    ...overrides,
  };
}

describe("AS-002: TypedReference Forgery", () => {
  let metadata: AgentMetadata;
  let validReference: TypedReference;
  let serialized: string;

  beforeEach(() => {
    metadata = makeQuarantineMetadata();
    validReference = createTypedReference("/src/file.ts", metadata.sessionId, metadata.hmacKey!);
    serialized = serializeTypedReference(validReference);
  });

  it("should reject TypedReference with tampered HMAC", () => {
    const parsed = parseTypedReference(serialized);
    
    // Tamper with HMAC by changing one hex character
    const tamperedHmac = parsed.hmac.slice(0, -1) + (parsed.hmac.slice(-1) === "a" ? "b" : "a");
    const tamperedRef: TypedReference = { ...parsed, hmac: tamperedHmac };

    const result = verifyTypedReference(tamperedRef, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toContain("HMAC");
  });

  it("should reject TypedReference with tampered path", () => {
    const parsed = parseTypedReference(serialized);
    
    // Change the path
    const tamperedRef: TypedReference = { ...parsed, path: "/etc/passwd" };

    const result = verifyTypedReference(tamperedRef, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/(HMAC|verification failed|Session mismatch)/i);
  });

  it("should reject TypedReference with tampered timestamp", () => {
    const parsed = parseTypedReference(serialized);
    
    // Change timestamp by 1 second (timestamps are in seconds, not milliseconds)
    const tamperedRef: TypedReference = { ...parsed, timestamp: parsed.timestamp + 1 };

    const result = verifyTypedReference(tamperedRef, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/(HMAC|verification failed|Session mismatch)/i);
  });

  it("should reject TypedReference with tampered sessionId", () => {
    const parsed = parseTypedReference(serialized);
    
    // Change sessionId
    const tamperedRef: TypedReference = { ...parsed, sessionId: crypto.randomUUID() };

    const result = verifyTypedReference(tamperedRef, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/(HMAC|verification failed|Session mismatch)/i);
  });

  it("should reject completely fabricated TypedReference", () => {
    const fakeRef: TypedReference = {
      path: "/etc/shadow",
      sessionId: crypto.randomUUID(),
      timestamp: Date.now(),
      hmac: crypto.randomBytes(32).toString("hex"),
    };

    const result = verifyTypedReference(fakeRef, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/(HMAC|verification failed|Session mismatch)/i);
  });

  it("should reject TypedReference with HMAC from different key", () => {
    const otherKey = generateHMACKey();
    const otherRef = createTypedReference("/src/file.ts", metadata.sessionId, otherKey);

    const result = verifyTypedReference(otherRef, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/(HMAC|verification failed|Session mismatch)/i);
  });

  it("should reject TypedReference with partial HMAC truncation", () => {
    const parsed = parseTypedReference(serialized);
    
    // Truncate HMAC
    const tamperedRef: TypedReference = { ...parsed, hmac: parsed.hmac.slice(0, 32) };

    const result = verifyTypedReference(tamperedRef, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(false);
  });

  it("should reject TypedReference with HMAC case change", () => {
    const parsed = parseTypedReference(serialized);
    
    // Change case of HMAC
    const tamperedRef: TypedReference = { ...parsed, hmac: parsed.hmac.toUpperCase() };

    // HMAC verification is case-sensitive for hex strings
    const result = verifyTypedReference(tamperedRef, metadata.sessionId, metadata.hmacKey!);

    // This might pass if implementation is case-insensitive, but HMAC should fail on data mismatch
    expect(result.valid).toBe(false);
  });

  it("should accept TypedReference with extra fields (HMAC only covers core fields)", () => {
    const parsed = parseTypedReference(serialized);
    
    // Add extra field (HMAC only covers path, timestamp, sessionId - not extra fields)
    const refWithExtra = { ...parsed, extraField: "ignored" } as TypedReference;

    const result = verifyTypedReference(refWithExtra, metadata.sessionId, metadata.hmacKey!);

    // Should pass because HMAC verification only checks path|timestamp|sessionId
    expect(result.valid).toBe(true);
  });

  it("should accept valid unmodified TypedReference", () => {
    const result = verifyTypedReference(validReference, metadata.sessionId, metadata.hmacKey!);

    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });
});
