import crypto from "node:crypto";
import type { AgentMetadata } from "./types.js";
import { generateHMACKey } from "./hmac-ops.js";

/**
 * Session data stored in memory for each active agent session.
 * Contains HMAC key, metadata, and lifecycle tracking.
 */
export interface SessionData {
  sessionId: string;
  hmacKey: Buffer;
  agentId: string;
  isQuarantine: boolean;
  createdAt: number; // Unix timestamp (seconds)
  toolCallCount: number;
  active: boolean;
}

/**
 * SessionManager handles the lifecycle of agent sessions.
 * 
 * SECURITY REQUIREMENTS:
 * - All HMAC keys are stored IN MEMORY ONLY (never persisted to disk)
 * - Keys are zeroed out before session destruction
 * - Session IDs use cryptographically secure UUIDs
 * 
 * @example
 * const manager = new SessionManager();
 * const session = manager.createSession("agent-001", true);
 * const key = manager.getSessionKey(session.sessionId);
 * manager.destroySession(session.sessionId); // Zeros key before removal
 */
export class SessionManager {
  private sessions: Map<string, SessionData>;
  private hmacKeySize: number;

  /**
   * Create a new SessionManager instance.
   * 
   * @param hmacKeySize - Size of HMAC keys in bytes (default: 32)
   */
  constructor(hmacKeySize = 32) {
    if (hmacKeySize < 16) {
      throw new Error("HMAC key size must be at least 16 bytes");
    }
    this.sessions = new Map();
    this.hmacKeySize = hmacKeySize;
  }

  /**
   * Create a new session with a unique ID and HMAC key.
   * 
   * @param agentId - Unique identifier for the agent
   * @param isQuarantine - Whether this is a quarantine session
   * @returns SessionData containing session ID, HMAC key, and metadata
   * 
   * @example
   * const session = manager.createSession("agent-001", true);
   * console.log(session.sessionId); // "550e8400-e29b-41d4-a716-446655440000"
   */
  createSession(agentId: string, isQuarantine: boolean): SessionData {
    if (!agentId || typeof agentId !== "string") {
      throw new Error("Agent ID must be a non-empty string");
    }

    const sessionId = crypto.randomUUID();
    const hmacKey = generateHMACKey(this.hmacKeySize);

    const sessionData: SessionData = {
      sessionId,
      hmacKey,
      agentId,
      isQuarantine,
      createdAt: Math.floor(Date.now() / 1000),
      toolCallCount: 0,
      active: true,
    };

    this.sessions.set(sessionId, sessionData);
    return sessionData;
  }

  /**
   * Retrieve session data by session ID.
   * 
   * @param sessionId - The session identifier
   * @returns SessionData if found, undefined otherwise
   */
  getSession(sessionId: string): SessionData | undefined {
    if (!sessionId || typeof sessionId !== "string") {
      return undefined;
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Get the HMAC key for a specific session.
   * Convenience method for accessing just the key.
   * 
   * @param sessionId - The session identifier
   * @returns HMAC key Buffer if session exists, undefined otherwise
   */
  getSessionKey(sessionId: string): Buffer | undefined {
    const session = this.getSession(sessionId);
    return session?.hmacKey;
  }

  /**
   * Destroy a session and securely zero out its HMAC key.
   * 
   * SECURITY: The HMAC key buffer is filled with zeros before removal
   * to prevent key material from remaining in memory.
   * 
   * @param sessionId - The session identifier to destroy
   * @returns true if session was found and destroyed, false if not found
   */
  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // SECURITY: Zero out key material before removal
    session.hmacKey.fill(0);
    
    this.sessions.delete(sessionId);
    return true;
  }

  /**
   * Destroy all sessions and zero out all HMAC keys.
   * 
   * SECURITY: All HMAC key buffers are filled with zeros before removal.
   * 
   * @returns Number of sessions that were destroyed
   */
  destroyAllSessions(): number {
    const count = this.sessions.size;

    for (const session of this.sessions.values()) {
      // SECURITY: Zero out key material
      session.hmacKey.fill(0);
    }

    this.sessions.clear();
    return count;
  }

  /**
   * Get all currently active sessions.
   * 
   * @returns Array of SessionData for sessions where active === true
   */
  getActiveSessions(): SessionData[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.active
    );
  }

  /**
   * Count active quarantine sessions.
   * Used for enforcing global concurrency limits.
   * 
   * @returns Number of active quarantine sessions
   */
  getActiveQuarantineCount(): number {
    return Array.from(this.sessions.values()).filter(
      (session) => session.active && session.isQuarantine
    ).length;
  }

  /**
   * Increment the tool call count for a session.
   * 
   * @param sessionId - The session identifier
   * @returns The new tool call count
   * @throws Error if session not found
   */
  incrementToolCount(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.toolCallCount++;
    return session.toolCallCount;
  }

  /**
   * Convert session data to AgentMetadata format for the hook system.
   * 
   * @param sessionId - The session identifier
   * @returns AgentMetadata if session exists, undefined otherwise
   */
  getMetadata(sessionId: string): AgentMetadata | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return undefined;
    }

    return {
      agentId: session.agentId,
      sessionId: session.sessionId,
      isQuarantine: session.isQuarantine,
      hmacKey: session.hmacKey,
    };
  }

  /**
   * Deactivate a session without destroying it.
   * Keeps the session data for audit purposes.
   * 
   * @param sessionId - The session identifier
   * @returns true if session was found and deactivated, false if not found
   */
  deactivateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.active = false;
    return true;
  }
}
