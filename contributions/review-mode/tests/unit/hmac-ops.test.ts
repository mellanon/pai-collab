import { describe, it, expect } from "vitest";
import {
  generateHMACKey,
  createHMAC,
  constantTimeEqual,
  verifyHMAC,
  createReferenceHMAC,
  verifyReferenceHMAC,
} from "../../src/lib/hmac-ops.js";

describe("generateHMACKey", () => {
  it("returns Buffer of default size 32", () => {
    const key = generateHMACKey();
    expect(Buffer.isBuffer(key)).toBe(true);
    expect(key.length).toBe(32);
  });

  it("returns Buffer of requested larger size (64)", () => {
    const key = generateHMACKey(64);
    expect(Buffer.isBuffer(key)).toBe(true);
    expect(key.length).toBe(64);
  });

  it("throws RangeError for size < 32", () => {
    expect(() => generateHMACKey(31)).toThrow(RangeError);
    expect(() => generateHMACKey(31)).toThrow(
      "Key size must be at least 32 bytes"
    );
  });

  it("throws TypeError for non-integer size", () => {
    expect(() => generateHMACKey(32.5)).toThrow(TypeError);
    expect(() => generateHMACKey(32.5)).toThrow("Key size must be an integer");
  });

  it("generates unique keys (no two calls return same buffer)", () => {
    const key1 = generateHMACKey();
    const key2 = generateHMACKey();
    expect(Buffer.compare(key1, key2)).not.toBe(0);
  });
});

describe("createHMAC", () => {
  const testKey = Buffer.from("a".repeat(64), "hex"); // 32-byte key

  it("returns 64-character hex string", () => {
    const hmac = createHMAC("test data", testKey);
    expect(typeof hmac).toBe("string");
    expect(hmac.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hmac)).toBe(true);
  });

  it("same data+key produces same HMAC (deterministic)", () => {
    const data = "consistent data";
    const hmac1 = createHMAC(data, testKey);
    const hmac2 = createHMAC(data, testKey);
    expect(hmac1).toBe(hmac2);
  });

  it("different data produces different HMAC", () => {
    const hmac1 = createHMAC("data one", testKey);
    const hmac2 = createHMAC("data two", testKey);
    expect(hmac1).not.toBe(hmac2);
  });

  it("different key produces different HMAC", () => {
    const key1 = Buffer.from("a".repeat(64), "hex");
    const key2 = Buffer.from("b".repeat(64), "hex");
    const data = "same data";
    const hmac1 = createHMAC(data, key1);
    const hmac2 = createHMAC(data, key2);
    expect(hmac1).not.toBe(hmac2);
  });

  it("throws TypeError for non-string data", () => {
    expect(() => createHMAC(123 as any, testKey)).toThrow(TypeError);
    expect(() => createHMAC(123 as any, testKey)).toThrow(
      "Data must be a string"
    );
  });

  it("throws TypeError for non-Buffer key", () => {
    expect(() => createHMAC("data", "not a buffer" as any)).toThrow(TypeError);
    expect(() => createHMAC("data", "not a buffer" as any)).toThrow(
      "Key must be a Buffer"
    );
  });
});

describe("constantTimeEqual", () => {
  it("returns true for equal strings", () => {
    const str = "a".repeat(64);
    expect(constantTimeEqual(str, str)).toBe(true);
  });

  it("returns false for different strings", () => {
    const str1 = "a".repeat(64);
    const str2 = "b".repeat(64);
    expect(constantTimeEqual(str1, str2)).toBe(false);
  });

  it("returns false for different-length strings", () => {
    const str1 = "a".repeat(64);
    const str2 = "a".repeat(32);
    expect(constantTimeEqual(str1, str2)).toBe(false);
  });

  it("throws TypeError for non-string first input", () => {
    expect(() => constantTimeEqual(123 as any, "string")).toThrow(TypeError);
    expect(() => constantTimeEqual(123 as any, "string")).toThrow(
      "Both parameters must be strings"
    );
  });

  it("throws TypeError for non-string second input", () => {
    expect(() => constantTimeEqual("string", 123 as any)).toThrow(TypeError);
    expect(() => constantTimeEqual("string", 123 as any)).toThrow(
      "Both parameters must be strings"
    );
  });
});

describe("verifyHMAC", () => {
  const testKey = Buffer.from("a".repeat(64), "hex");

  it("returns true for valid HMAC", () => {
    const data = "test data";
    const hmac = createHMAC(data, testKey);
    expect(verifyHMAC(data, hmac, testKey)).toBe(true);
  });

  it("returns false for invalid HMAC", () => {
    const data = "test data";
    const invalidHmac = "0".repeat(64);
    expect(verifyHMAC(data, invalidHmac, testKey)).toBe(false);
  });

  it("returns false for tampered data", () => {
    const originalData = "original data";
    const hmac = createHMAC(originalData, testKey);
    const tamperedData = "tampered data";
    expect(verifyHMAC(tamperedData, hmac, testKey)).toBe(false);
  });
});

describe("createReferenceHMAC", () => {
  const testKey = Buffer.from("a".repeat(64), "hex");

  it("creates valid reference HMAC from components", () => {
    const hmac = createReferenceHMAC(
      "/test/path",
      1234567890,
      "session-123",
      testKey
    );
    expect(typeof hmac).toBe("string");
    expect(hmac.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hmac)).toBe(true);
  });

  it("creates consistent HMAC for same inputs", () => {
    const path = "/test/path";
    const timestamp = 1234567890;
    const sessionId = "session-123";

    const hmac1 = createReferenceHMAC(path, timestamp, sessionId, testKey);
    const hmac2 = createReferenceHMAC(path, timestamp, sessionId, testKey);

    expect(hmac1).toBe(hmac2);
  });
});

describe("verifyReferenceHMAC", () => {
  const testKey = Buffer.from("a".repeat(64), "hex");
  const path = "/test/path";
  const timestamp = 1234567890;
  const sessionId = "session-123";

  it("verification passes for matching components", () => {
    const hmac = createReferenceHMAC(path, timestamp, sessionId, testKey);
    const isValid = verifyReferenceHMAC(
      path,
      timestamp,
      sessionId,
      hmac,
      testKey
    );
    expect(isValid).toBe(true);
  });

  it("verification fails for different path", () => {
    const hmac = createReferenceHMAC(path, timestamp, sessionId, testKey);
    const isValid = verifyReferenceHMAC(
      "/different/path",
      timestamp,
      sessionId,
      hmac,
      testKey
    );
    expect(isValid).toBe(false);
  });

  it("verification fails for different timestamp", () => {
    const hmac = createReferenceHMAC(path, timestamp, sessionId, testKey);
    const isValid = verifyReferenceHMAC(
      path,
      9876543210,
      sessionId,
      hmac,
      testKey
    );
    expect(isValid).toBe(false);
  });

  it("verification fails for different session ID", () => {
    const hmac = createReferenceHMAC(path, timestamp, sessionId, testKey);
    const isValid = verifyReferenceHMAC(
      path,
      timestamp,
      "different-session",
      hmac,
      testKey
    );
    expect(isValid).toBe(false);
  });
});
