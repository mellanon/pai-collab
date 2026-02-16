import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { enforceReviewMode } from "../../src/hooks/review-mode-hook.js";
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

describe("AS-001: Prompt Injection via Command Execution", () => {
  let metadata: AgentMetadata;

  beforeEach(() => {
    metadata = makeQuarantineMetadata();
  });

  it("should block Bash tool regardless of innocent-looking command", () => {
    const decision = enforceReviewMode(
      "Bash",
      { command: "echo 'Hello World'", description: "Print greeting" },
      metadata
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Bash");
    expect(decision.securityEvent).toBeDefined();
    expect(decision.securityEvent?.type).toBe("TOOL_BLOCKED");
  });

  it("should block Bash tool with shell metacharacters in args", () => {
    const decision = enforceReviewMode(
      "Bash",
      { command: "ls -la; rm -rf /", description: "Injected command" },
      metadata
    );

    expect(decision.allowed).toBe(false);
    expect(decision.securityEvent).toBeDefined();
    expect(decision.securityEvent?.tool).toBe("Bash");
  });

  it("should block Bash tool with pipe operators", () => {
    const decision = enforceReviewMode(
      "Bash",
      { command: "cat /etc/passwd | grep root", description: "Read users" },
      metadata
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Bash");
  });

  it("should block Bash tool with command substitution", () => {
    const decision = enforceReviewMode(
      "Bash",
      { command: "echo $(whoami)", description: "Check user" },
      metadata
    );

    expect(decision.allowed).toBe(false);
    expect(decision.securityEvent?.severity).toBe("high");
  });

  it("should block Write tool even with innocent args", () => {
    const decision = enforceReviewMode(
      "Write",
      { filePath: "/tmp/test.txt", content: "Hello" },
      metadata
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Write");
    expect(decision.securityEvent).toBeDefined();
  });

  it("should block Edit tool regardless of arguments", () => {
    const decision = enforceReviewMode(
      "Edit",
      { filePath: "/src/file.ts", oldString: "foo", newString: "bar" },
      metadata
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Edit");
  });

  it("should block tool name with injected whitespace", () => {
    const decision = enforceReviewMode(
      "Bash ",
      { command: "ls" },
      metadata
    );

    expect(decision.allowed).toBe(false);
  });

  it("should block tool name with unicode tricks", () => {
    // Unicode zero-width space
    const decision = enforceReviewMode(
      "Bash\u200B",
      { command: "ls" },
      metadata
    );

    expect(decision.allowed).toBe(false);
  });

  it("should log security event for each blocked attempt", () => {
    const tools = ["Bash", "Write", "Edit", "TodoWrite"];
    
    tools.forEach(tool => {
      const decision = enforceReviewMode(tool, {}, metadata);
      expect(decision.securityEvent).toBeDefined();
      expect(decision.securityEvent?.agentId).toBe(metadata.agentId);
      expect(decision.securityEvent?.sessionId).toBe(metadata.sessionId);
    });
  });

  it("should block Bash with AND operator", () => {
    const decision = enforceReviewMode(
      "Bash",
      { command: "cd /tmp && rm -rf *", description: "Cleanup" },
      metadata
    );

    expect(decision.allowed).toBe(false);
    expect(decision.securityEvent?.message).toContain("not allowed");
  });

  it("should block Bash with OR operator", () => {
    const decision = enforceReviewMode(
      "Bash",
      { command: "test -f file || echo 'missing'", description: "Check file" },
      metadata
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not allowed.*Review Mode/i);
  });
});
