import { describe, it, expect, beforeEach } from "vitest";
import { generateHMACKey } from "../../src/lib/hmac-ops.js";
import {
  canonicalizePath,
  createTypedReference,
  verifyTypedReference,
  serializeTypedReference,
  parseTypedReference,
} from "../../src/lib/typed-reference.js";
import type { TypedReference } from "../../src/lib/types.js";
import * as path from "node:path";

describe("TypedReference Module", () => {
  let hmacKey: Buffer;
  let sessionId: string;

  beforeEach(() => {
    hmacKey = generateHMACKey();
    sessionId = "test-session-123";
  });

  describe("canonicalizePath", () => {
    it("should resolve relative path to absolute", () => {
      const relativePath = "foo/bar.txt";
      const result = canonicalizePath(relativePath);
      
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toContain("foo/bar.txt");
    });

    it("should normalize path with ../ components", () => {
      const pathWithDotDot = "foo/../bar/./baz.txt";
      const result = canonicalizePath(pathWithDotDot);
      
      expect(result).not.toContain("..");
      expect(result).not.toContain("/./");
      expect(result).toContain("bar/baz.txt");
    });

    it("should return already-absolute path unchanged (modulo normalization)", () => {
      const absolutePath = "/usr/local/bin/test.sh";
      const result = canonicalizePath(absolutePath);
      
      expect(result).toBe(path.normalize(absolutePath));
    });

    it("should throw TypeError for non-string input", () => {
      expect(() => canonicalizePath(123 as any)).toThrow(TypeError);
      expect(() => canonicalizePath(null as any)).toThrow(TypeError);
      expect(() => canonicalizePath(undefined as any)).toThrow(TypeError);
      expect(() => canonicalizePath({} as any)).toThrow(TypeError);
    });

    it("should handle path traversal attempts by canonicalizing", () => {
      const maliciousPath = "../../../etc/passwd";
      const result = canonicalizePath(maliciousPath);
      
      // Should be canonicalized to an absolute path
      expect(path.isAbsolute(result)).toBe(true);
      // The result depends on cwd, but it should be normalized
      expect(result).not.toContain("../");
    });
  });

  describe("createTypedReference", () => {
    it("should create reference with absolute path", () => {
      const filePath = "/absolute/path/to/file.txt";
      const ref = createTypedReference(filePath, sessionId, hmacKey);

      expect(ref).toBeDefined();
      expect(ref.path).toBe(filePath);
      expect(ref.sessionId).toBe(sessionId);
      expect(ref.hmac).toBeDefined();
      expect(ref.timestamp).toBeDefined();
    });

    it("should create reference with relative path (gets canonicalized)", () => {
      const relativePath = "relative/path/file.txt";
      const ref = createTypedReference(relativePath, sessionId, hmacKey);

      expect(path.isAbsolute(ref.path)).toBe(true);
      expect(ref.path).toContain("relative/path/file.txt");
    });

    it("should canonicalize path traversal attempts", () => {
      const maliciousPath = "../../../etc/passwd";
      const ref = createTypedReference(maliciousPath, sessionId, hmacKey);

      expect(path.isAbsolute(ref.path)).toBe(true);
      expect(ref.path).not.toContain("../");
    });

    it("should generate HMAC with 64 hex characters", () => {
      const filePath = "/test/file.txt";
      const ref = createTypedReference(filePath, sessionId, hmacKey);

      expect(ref.hmac).toMatch(/^[0-9a-f]{64}$/);
      expect(ref.hmac.length).toBe(64);
    });

    it("should set timestamp as recent Unix seconds", () => {
      const beforeCreate = Math.floor(Date.now() / 1000);
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const afterCreate = Math.floor(Date.now() / 1000);

      expect(ref.timestamp).toBeGreaterThanOrEqual(beforeCreate);
      expect(ref.timestamp).toBeLessThanOrEqual(afterCreate + 1);
    });

    it("should preserve session ID in reference", () => {
      const customSessionId = "custom-session-xyz-789";
      const ref = createTypedReference("/test/file.txt", customSessionId, hmacKey);

      expect(ref.sessionId).toBe(customSessionId);
    });

    it("should throw TypeError for non-string filePath", () => {
      expect(() => createTypedReference(123 as any, sessionId, hmacKey)).toThrow(TypeError);
      expect(() => createTypedReference(null as any, sessionId, hmacKey)).toThrow(TypeError);
      expect(() => createTypedReference(undefined as any, sessionId, hmacKey)).toThrow(TypeError);
    });

    it("should throw TypeError for non-Buffer hmacKey", () => {
      expect(() => createTypedReference("/test/file.txt", sessionId, "not-a-buffer" as any)).toThrow(TypeError);
      expect(() => createTypedReference("/test/file.txt", sessionId, 123 as any)).toThrow(TypeError);
      expect(() => createTypedReference("/test/file.txt", sessionId, null as any)).toThrow(TypeError);
    });

    it("should create different HMACs for different files", () => {
      const ref1 = createTypedReference("/file1.txt", sessionId, hmacKey);
      const ref2 = createTypedReference("/file2.txt", sessionId, hmacKey);

      expect(ref1.hmac).not.toBe(ref2.hmac);
    });

    it("should create different HMACs for different sessions", () => {
      const ref1 = createTypedReference("/file.txt", "session-1", hmacKey);
      const ref2 = createTypedReference("/file.txt", "session-2", hmacKey);

      expect(ref1.hmac).not.toBe(ref2.hmac);
    });
  });

  describe("verifyTypedReference", () => {
    it("should return valid for correctly created reference", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const result = verifyTypedReference(ref, sessionId, hmacKey);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return session_mismatch for different session", () => {
      const ref = createTypedReference("/test/file.txt", "session-1", hmacKey);
      const result = verifyTypedReference(ref, "session-2", hmacKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("session_mismatch");
    });

    it("should return expired for old reference with short TTL", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      
      // Manually set timestamp to 2 hours ago
      ref.timestamp = Math.floor(Date.now() / 1000) - 7200;
      
      const result = verifyTypedReference(ref, sessionId, hmacKey, 3600); // 1 hour TTL

      expect(result.valid).toBe(false);
      expect(result.error).toBe("expired");
    });

    it("should return invalid_hmac for forged HMAC", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      
      // Forge the HMAC
      ref.hmac = "a".repeat(64);
      
      const result = verifyTypedReference(ref, sessionId, hmacKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_hmac");
    });

    it("should return invalid_hmac for tampered path", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      
      // Tamper with the path
      ref.path = "/test/different-file.txt";
      
      const result = verifyTypedReference(ref, sessionId, hmacKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_hmac");
    });

    it("should use default TTL of 3600 seconds", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      
      // Reference was just created, should be valid with default 3600s TTL
      const result = verifyTypedReference(ref, sessionId, hmacKey);

      expect(result.valid).toBe(true);
      
      // Also verify that a reference within TTL would pass
      // (we can't actually manipulate timestamp without breaking HMAC)
      const now = Math.floor(Date.now() / 1000);
      expect(now - ref.timestamp).toBeLessThan(3600);
    });

    it("should respect custom TTL", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      
      // Set timestamp to 90 seconds ago
      ref.timestamp = Math.floor(Date.now() / 1000) - 90;
      
      // With 60 second TTL, should be expired
      const result = verifyTypedReference(ref, sessionId, hmacKey, 60);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("expired");
    });

    it("should throw TypeError for non-object reference", () => {
      expect(() => verifyTypedReference(null as any, sessionId, hmacKey)).toThrow(TypeError);
      expect(() => verifyTypedReference("not-an-object" as any, sessionId, hmacKey)).toThrow(TypeError);
      expect(() => verifyTypedReference(123 as any, sessionId, hmacKey)).toThrow(TypeError);
    });

    it("should throw TypeError for non-Buffer hmacKey", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      
      expect(() => verifyTypedReference(ref, sessionId, "not-a-buffer" as any)).toThrow(TypeError);
      expect(() => verifyTypedReference(ref, sessionId, 123 as any)).toThrow(TypeError);
    });

    it("should validate reference with very long path", () => {
      const longPath = "/very/long/path/" + "segment/".repeat(50) + "file.txt";
      const ref = createTypedReference(longPath, sessionId, hmacKey);
      const result = verifyTypedReference(ref, sessionId, hmacKey);

      expect(result.valid).toBe(true);
    });

    it("should validate reference with special characters in path", () => {
      const specialPath = "/path/with spaces/and-dashes/under_scores/file.txt";
      const ref = createTypedReference(specialPath, sessionId, hmacKey);
      const result = verifyTypedReference(ref, sessionId, hmacKey);

      expect(result.valid).toBe(true);
    });
  });

  describe("serializeTypedReference", () => {
    it("should produce typed:// URI format", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const uri = serializeTypedReference(ref);

      expect(uri).toMatch(/^typed:\/\//);
    });

    it("should contain hmac parameter", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const uri = serializeTypedReference(ref);

      expect(uri).toContain(`hmac=${ref.hmac}`);
    });

    it("should contain ts parameter", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const uri = serializeTypedReference(ref);

      expect(uri).toContain(`ts=${ref.timestamp}`);
    });

    it("should contain sid parameter", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const uri = serializeTypedReference(ref);

      expect(uri).toContain(`sid=${ref.sessionId}`);
    });

    it("should URL-encode the path", () => {
      const pathWithSpaces = "/path/with spaces/file.txt";
      const ref = createTypedReference(pathWithSpaces, sessionId, hmacKey);
      const uri = serializeTypedReference(ref);

      expect(uri).toContain("with%20spaces");
      expect(uri).not.toContain("with spaces");
    });

    it("should URL-encode special characters in path", () => {
      const specialPath = "/path/with?special&chars=value/file.txt";
      const ref = createTypedReference(specialPath, sessionId, hmacKey);
      const uri = serializeTypedReference(ref);

      expect(uri).toContain("%3F"); // ?
      expect(uri).toContain("%26"); // &
      expect(uri).toContain("%3D"); // =
    });

    it("should create valid URI that can be parsed", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const uri = serializeTypedReference(ref);

      expect(() => new URL(uri)).not.toThrow();
    });
  });

  describe("parseTypedReference", () => {
    it("should parse valid typed:// URI", () => {
      const originalRef = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const uri = serializeTypedReference(originalRef);
      const parsed = parseTypedReference(uri);

      expect(parsed.path).toBe(originalRef.path);
      expect(parsed.hmac).toBe(originalRef.hmac);
      expect(parsed.timestamp).toBe(originalRef.timestamp);
      expect(parsed.sessionId).toBe(originalRef.sessionId);
    });

    it("should round-trip: serialize then parse returns equivalent reference", () => {
      const originalRef = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const uri = serializeTypedReference(originalRef);
      const parsed = parseTypedReference(uri);

      expect(parsed).toEqual(originalRef);
    });

    it("should throw for invalid protocol (http://)", () => {
      const invalidUri = "http://example.com/file.txt?hmac=abc&ts=123&sid=session";
      
      expect(() => parseTypedReference(invalidUri)).toThrow();
    });

    it("should throw for missing hmac parameter", () => {
      const invalidUri = "typed:///test/file.txt?ts=123456789&sid=session";
      
      expect(() => parseTypedReference(invalidUri)).toThrow();
    });

    it("should throw for missing ts parameter", () => {
      const invalidUri = `typed:///test/file.txt?hmac=${"a".repeat(64)}&sid=session`;
      
      expect(() => parseTypedReference(invalidUri)).toThrow();
    });

    it("should throw for missing sid parameter", () => {
      const invalidUri = `typed:///test/file.txt?hmac=${"a".repeat(64)}&ts=123456789`;
      
      expect(() => parseTypedReference(invalidUri)).toThrow();
    });

    it("should throw for malformed URI (no query string)", () => {
      const invalidUri = "typed:///test/file.txt";
      
      expect(() => parseTypedReference(invalidUri)).toThrow();
    });

    it("should handle URL-encoded paths correctly", () => {
      const pathWithSpaces = "/path/with spaces/file.txt";
      const ref = createTypedReference(pathWithSpaces, sessionId, hmacKey);
      const uri = serializeTypedReference(ref);
      const parsed = parseTypedReference(uri);

      expect(parsed.path).toBe(ref.path);
      expect(parsed.path).toContain("with spaces");
    });

    it("should handle complex URL-encoded paths", () => {
      const complexPath = "/path/with?special&chars=value/file.txt";
      const ref = createTypedReference(complexPath, sessionId, hmacKey);
      const uri = serializeTypedReference(ref);
      const parsed = parseTypedReference(uri);

      expect(parsed.path).toBe(ref.path);
    });

    it("should parse URI with very long path", () => {
      const longPath = "/very/long/path/" + "segment/".repeat(50) + "file.txt";
      const ref = createTypedReference(longPath, sessionId, hmacKey);
      const uri = serializeTypedReference(ref);
      const parsed = parseTypedReference(uri);

      expect(parsed.path).toBe(ref.path);
    });

    it("should throw for empty URI", () => {
      expect(() => parseTypedReference("")).toThrow();
    });

    it("should throw for malformed protocol", () => {
      expect(() => parseTypedReference("typed:/test/file.txt?hmac=abc&ts=123&sid=session")).toThrow();
    });
  });

  describe("Integration Tests", () => {
    it("should validate reference after serialize/parse round-trip", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      const uri = serializeTypedReference(ref);
      const parsed = parseTypedReference(uri);
      const result = verifyTypedReference(parsed, sessionId, hmacKey);

      expect(result.valid).toBe(true);
    });

    it("should reject tampered URI after parsing", () => {
      const ref = createTypedReference("/test/file.txt", sessionId, hmacKey);
      let uri = serializeTypedReference(ref);
      
      // Tamper with path in URI
      uri = uri.replace("file.txt", "hacked.txt");
      
      const parsed = parseTypedReference(uri);
      const result = verifyTypedReference(parsed, sessionId, hmacKey);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_hmac");
    });

    it("should handle multiple references for same file with different sessions", () => {
      const filePath = "/shared/file.txt";
      const ref1 = createTypedReference(filePath, "session-1", hmacKey);
      const ref2 = createTypedReference(filePath, "session-2", hmacKey);

      const result1 = verifyTypedReference(ref1, "session-1", hmacKey);
      const result2 = verifyTypedReference(ref2, "session-2", hmacKey);
      const crossResult = verifyTypedReference(ref1, "session-2", hmacKey);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(crossResult.valid).toBe(false);
      expect(crossResult.error).toBe("session_mismatch");
    });

    it("should maintain security with different HMAC keys", () => {
      const key1 = generateHMACKey();
      const key2 = generateHMACKey();
      
      const ref = createTypedReference("/test/file.txt", sessionId, key1);
      const result = verifyTypedReference(ref, sessionId, key2);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalid_hmac");
    });
  });
});
