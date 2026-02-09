import { describe, it, expect, beforeEach } from "vitest";
import { SessionManager } from "../../src/lib/session-manager.js";

describe("SessionManager", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe("Constructor", () => {
    it("creates instance with default key size (32 bytes)", () => {
      const manager = new SessionManager();
      const session = manager.createSession("agent-1", false);
      const key = manager.getSessionKey(session.sessionId);

      expect(key).toBeDefined();
      expect(key?.length).toBe(32);
    });

    it("creates instance with custom key size", () => {
      const manager = new SessionManager(64);
      const session = manager.createSession("agent-1", false);
      const key = manager.getSessionKey(session.sessionId);

      expect(key).toBeDefined();
      expect(key?.length).toBe(64);
    });

    it("throws error for key size less than 16", () => {
      expect(() => new SessionManager(15)).toThrow("HMAC key size must be at least 16 bytes");
    });

    it("throws error for key size less than 16 with specific value", () => {
      expect(() => new SessionManager(8)).toThrow("HMAC key size must be at least 16 bytes");
    });
  });

  describe("createSession", () => {
    it("creates session with valid UUID session ID", () => {
      const session = sessionManager.createSession("agent-1", false);

      expect(session.sessionId).toBeDefined();
      expect(session.sessionId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("creates session with 32-byte HMAC key", () => {
      const session = sessionManager.createSession("agent-1", false);
      const key = sessionManager.getSessionKey(session.sessionId);

      expect(key).toBeDefined();
      expect(key).toBeInstanceOf(Buffer);
      expect(key?.length).toBe(32);
    });

    it("sets initial tool count to 0", () => {
      const session = sessionManager.createSession("agent-1", false);

      expect(session.toolCallCount).toBe(0);
    });

    it("sets active to true", () => {
      const session = sessionManager.createSession("agent-1", false);

      expect(session.active).toBe(true);
    });

    it("correctly sets agent ID", () => {
      const session = sessionManager.createSession("agent-test", false);

      expect(session.agentId).toBe("agent-test");
    });

    it("correctly sets quarantine flag to false", () => {
      const session = sessionManager.createSession("agent-1", false);

      expect(session.isQuarantine).toBe(false);
    });

    it("correctly sets quarantine flag to true", () => {
      const session = sessionManager.createSession("agent-1", true);

      expect(session.isQuarantine).toBe(true);
    });

    it("sets createdAt timestamp", () => {
      const before = Math.floor(Date.now() / 1000);
      const session = sessionManager.createSession("agent-1", false);
      const after = Math.floor(Date.now() / 1000);

      expect(session.createdAt).toBeGreaterThanOrEqual(before);
      expect(session.createdAt).toBeLessThanOrEqual(after);
    });

    it("throws error for empty agent ID", () => {
      expect(() => sessionManager.createSession("", false)).toThrow("Agent ID must be a non-empty string");
    });

    it("creates unique session IDs for multiple sessions", () => {
      const session1 = sessionManager.createSession("agent-1", false);
      const session2 = sessionManager.createSession("agent-2", false);

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });
  });

  describe("Session retrieval", () => {
    it("getSession returns session data for existing session", () => {
      const created = sessionManager.createSession("agent-1", false);
      const retrieved = sessionManager.getSession(created.sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe(created.sessionId);
      expect(retrieved?.agentId).toBe("agent-1");
      expect(retrieved?.isQuarantine).toBe(false);
      expect(retrieved?.active).toBe(true);
      expect(retrieved?.toolCallCount).toBe(0);
    });

    it("getSession returns undefined for unknown session ID", () => {
      const session = sessionManager.getSession("nonexistent-id");

      expect(session).toBeUndefined();
    });

    it("getSessionKey returns Buffer for existing session", () => {
      const session = sessionManager.createSession("agent-1", false);
      const key = sessionManager.getSessionKey(session.sessionId);

      expect(key).toBeDefined();
      expect(key).toBeInstanceOf(Buffer);
      expect(key?.length).toBe(32);
    });

    it("getSessionKey returns undefined for unknown session ID", () => {
      const key = sessionManager.getSessionKey("nonexistent-id");

      expect(key).toBeUndefined();
    });

    it("getSessionKey returns same key across multiple calls", () => {
      const session = sessionManager.createSession("agent-1", false);
      const key1 = sessionManager.getSessionKey(session.sessionId);
      const key2 = sessionManager.getSessionKey(session.sessionId);

      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
      expect(key1?.equals(key2!)).toBe(true);
    });
  });

  describe("Destroy sessions", () => {
    it("destroySession returns true for existing session", () => {
      const session = sessionManager.createSession("agent-1", false);
      const result = sessionManager.destroySession(session.sessionId);

      expect(result).toBe(true);
    });

    it("destroySession returns false for unknown session", () => {
      const result = sessionManager.destroySession("nonexistent-id");

      expect(result).toBe(false);
    });

    it("destroySession removes session from storage", () => {
      const session = sessionManager.createSession("agent-1", false);
      sessionManager.destroySession(session.sessionId);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved).toBeUndefined();
    });

    it("destroySession zeros the HMAC key buffer", () => {
      const session = sessionManager.createSession("agent-1", false);
      const key = sessionManager.getSessionKey(session.sessionId);

      // Verify key has non-zero bytes before destruction
      expect(key).toBeDefined();
      const hasNonZero = key!.some((byte) => byte !== 0);
      expect(hasNonZero).toBe(true);

      // Destroy session
      sessionManager.destroySession(session.sessionId);

      // Verify key is all zeros
      const allZeros = key!.every((byte) => byte === 0);
      expect(allZeros).toBe(true);
    });

    it("destroyAllSessions returns correct count", () => {
      sessionManager.createSession("agent-1", false);
      sessionManager.createSession("agent-2", false);
      sessionManager.createSession("agent-3", true);

      const count = sessionManager.destroyAllSessions();

      expect(count).toBe(3);
    });

    it("destroyAllSessions removes all sessions", () => {
      const s1 = sessionManager.createSession("agent-1", false);
      const s2 = sessionManager.createSession("agent-2", false);
      const s3 = sessionManager.createSession("agent-3", true);

      sessionManager.destroyAllSessions();

      expect(sessionManager.getSession(s1.sessionId)).toBeUndefined();
      expect(sessionManager.getSession(s2.sessionId)).toBeUndefined();
      expect(sessionManager.getSession(s3.sessionId)).toBeUndefined();
    });

    it("destroyAllSessions zeros all HMAC key buffers", () => {
      const s1 = sessionManager.createSession("agent-1", false);
      const s2 = sessionManager.createSession("agent-2", false);

      const key1 = sessionManager.getSessionKey(s1.sessionId);
      const key2 = sessionManager.getSessionKey(s2.sessionId);

      // Verify keys have non-zero bytes
      expect(key1!.some((byte) => byte !== 0)).toBe(true);
      expect(key2!.some((byte) => byte !== 0)).toBe(true);

      sessionManager.destroyAllSessions();

      // Verify all keys are zeroed
      expect(key1!.every((byte) => byte === 0)).toBe(true);
      expect(key2!.every((byte) => byte === 0)).toBe(true);
    });

    it("destroyAllSessions returns 0 when no sessions exist", () => {
      const count = sessionManager.destroyAllSessions();

      expect(count).toBe(0);
    });
  });

  describe("Active sessions", () => {
    it("getActiveSessions returns only active sessions", () => {
      const s1 = sessionManager.createSession("agent-1", false);
      const s2 = sessionManager.createSession("agent-2", false);
      const s3 = sessionManager.createSession("agent-3", true);

      sessionManager.deactivateSession(s2.sessionId);

      const activeSessions = sessionManager.getActiveSessions();

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.some((s) => s.sessionId === s1.sessionId)).toBe(true);
      expect(activeSessions.some((s) => s.sessionId === s3.sessionId)).toBe(true);
      expect(activeSessions.some((s) => s.sessionId === s2.sessionId)).toBe(false);
    });

    it("getActiveSessions returns empty array when no sessions exist", () => {
      const activeSessions = sessionManager.getActiveSessions();

      expect(activeSessions).toEqual([]);
    });

    it("getActiveSessions returns empty array when all sessions are inactive", () => {
      const s1 = sessionManager.createSession("agent-1", false);
      const s2 = sessionManager.createSession("agent-2", false);

      sessionManager.deactivateSession(s1.sessionId);
      sessionManager.deactivateSession(s2.sessionId);

      const activeSessions = sessionManager.getActiveSessions();

      expect(activeSessions).toEqual([]);
    });

    it("getActiveQuarantineCount counts only active quarantine sessions", () => {
      sessionManager.createSession("agent-1", false); // active, not quarantine
      sessionManager.createSession("agent-2", true); // active, quarantine
      const s3 = sessionManager.createSession("agent-3", true); // will be inactive
      sessionManager.createSession("agent-4", true); // active, quarantine

      sessionManager.deactivateSession(s3.sessionId);

      const count = sessionManager.getActiveQuarantineCount();

      expect(count).toBe(2);
    });

    it("getActiveQuarantineCount returns 0 when no quarantine sessions exist", () => {
      sessionManager.createSession("agent-1", false);
      sessionManager.createSession("agent-2", false);

      const count = sessionManager.getActiveQuarantineCount();

      expect(count).toBe(0);
    });

    it("getActiveQuarantineCount returns 0 when all quarantine sessions are inactive", () => {
      const s1 = sessionManager.createSession("agent-1", true);
      const s2 = sessionManager.createSession("agent-2", true);

      sessionManager.deactivateSession(s1.sessionId);
      sessionManager.deactivateSession(s2.sessionId);

      const count = sessionManager.getActiveQuarantineCount();

      expect(count).toBe(0);
    });
  });

  describe("Tool count", () => {
    it("incrementToolCount increments and returns new count", () => {
      const session = sessionManager.createSession("agent-1", false);

      const count1 = sessionManager.incrementToolCount(session.sessionId);
      expect(count1).toBe(1);

      const count2 = sessionManager.incrementToolCount(session.sessionId);
      expect(count2).toBe(2);

      const count3 = sessionManager.incrementToolCount(session.sessionId);
      expect(count3).toBe(3);
    });

    it("incrementToolCount persists count in session data", () => {
      const session = sessionManager.createSession("agent-1", false);

      sessionManager.incrementToolCount(session.sessionId);
      sessionManager.incrementToolCount(session.sessionId);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.toolCallCount).toBe(2);
    });

    it("incrementToolCount throws for unknown session", () => {
      expect(() => sessionManager.incrementToolCount("nonexistent-id")).toThrow(
        "Session not found: nonexistent-id"
      );
    });

    it("tool counts are independent across sessions", () => {
      const s1 = sessionManager.createSession("agent-1", false);
      const s2 = sessionManager.createSession("agent-2", false);

      sessionManager.incrementToolCount(s1.sessionId);
      sessionManager.incrementToolCount(s1.sessionId);
      sessionManager.incrementToolCount(s2.sessionId);

      expect(sessionManager.getSession(s1.sessionId)?.toolCallCount).toBe(2);
      expect(sessionManager.getSession(s2.sessionId)?.toolCallCount).toBe(1);
    });
  });

  describe("Metadata", () => {
    it("getMetadata returns AgentMetadata format", () => {
      const session = sessionManager.createSession("agent-test", true);
      sessionManager.incrementToolCount(session.sessionId);

      const metadata = sessionManager.getMetadata(session.sessionId);

      expect(metadata).toBeDefined();
      expect(metadata).toHaveProperty("agentId", "agent-test");
      expect(metadata).toHaveProperty("sessionId", session.sessionId);
      expect(metadata).toHaveProperty("isQuarantine", true);
      expect(metadata).toHaveProperty("hmacKey");
    });

    it("getMetadata includes sessionId", () => {
      const session = sessionManager.createSession("agent-1", false);

      const metadata = sessionManager.getMetadata(session.sessionId);

      expect(metadata).toBeDefined();
      expect(metadata!.sessionId).toBe(session.sessionId);
    });

    it("getMetadata returns undefined for unknown session", () => {
      const metadata = sessionManager.getMetadata("nonexistent-id");

      expect(metadata).toBeUndefined();
    });

    it("getMetadata reflects current session state", () => {
      const session = sessionManager.createSession("agent-1", false);
      sessionManager.incrementToolCount(session.sessionId);
      sessionManager.incrementToolCount(session.sessionId);

      const metadata = sessionManager.getMetadata(session.sessionId);

      expect(metadata?.agentId).toBe("agent-1");
      expect(metadata?.isQuarantine).toBe(false);
    });
  });

  describe("Deactivate session", () => {
    it("deactivateSession sets active to false", () => {
      const session = sessionManager.createSession("agent-1", false);

      expect(session.active).toBe(true);

      const result = sessionManager.deactivateSession(session.sessionId);

      expect(result).toBe(true);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.active).toBe(false);
    });

    it("deactivateSession returns false for unknown session", () => {
      const result = sessionManager.deactivateSession("nonexistent-id");

      expect(result).toBe(false);
    });

    it("deactivateSession does not remove session from storage", () => {
      const session = sessionManager.createSession("agent-1", false);
      sessionManager.deactivateSession(session.sessionId);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe(session.sessionId);
    });

    it("deactivateSession preserves other session properties", () => {
      const session = sessionManager.createSession("agent-test", true);
      sessionManager.incrementToolCount(session.sessionId);
      sessionManager.incrementToolCount(session.sessionId);

      sessionManager.deactivateSession(session.sessionId);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.agentId).toBe("agent-test");
      expect(retrieved?.isQuarantine).toBe(true);
      expect(retrieved?.toolCallCount).toBe(2);
      expect(retrieved?.createdAt).toBe(session.createdAt);
    });

    it("deactivateSession can be called multiple times", () => {
      const session = sessionManager.createSession("agent-1", false);

      const result1 = sessionManager.deactivateSession(session.sessionId);
      expect(result1).toBe(true);

      const result2 = sessionManager.deactivateSession(session.sessionId);
      expect(result2).toBe(true);

      const retrieved = sessionManager.getSession(session.sessionId);
      expect(retrieved?.active).toBe(false);
    });
  });

  describe("Edge cases and error handling", () => {
    it("handles multiple rapid session creations", () => {
      const sessions = Array.from({ length: 100 }, (_, i) =>
        sessionManager.createSession(`agent-${i}`, i % 2 === 0)
      );

      expect(sessions).toHaveLength(100);
      expect(new Set(sessions.map((s) => s.sessionId)).size).toBe(100);
    });

    it("handles destroying already destroyed session gracefully", () => {
      const session = sessionManager.createSession("agent-1", false);
      
      const result1 = sessionManager.destroySession(session.sessionId);
      expect(result1).toBe(true);

      const result2 = sessionManager.destroySession(session.sessionId);
      expect(result2).toBe(false);
    });

    it("session data returns direct reference (mutable)", () => {
      const session = sessionManager.createSession("agent-1", false);
      const retrieved = sessionManager.getSession(session.sessionId);

      // Modify retrieved data
      if (retrieved) {
        (retrieved as any).toolCallCount = 999;
        (retrieved as any).active = false;
      }

      // Verify changes are reflected (because it's a direct reference)
      const retrievedAgain = sessionManager.getSession(session.sessionId);
      expect(retrievedAgain?.toolCallCount).toBe(999);
      expect(retrievedAgain?.active).toBe(false);
    });
  });
});
