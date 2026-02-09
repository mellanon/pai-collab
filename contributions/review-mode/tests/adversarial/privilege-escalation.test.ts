import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { enforceReviewMode } from "../../src/hooks/review-mode-hook.js";
import {
  isToolAllowed,
  isToolDenied,
  getToolRisk,
  getToolCategory,
  QUARANTINE_ALLOWED_TOOLS,
  QUARANTINE_DENIED_TOOLS,
  TOOL_RISK_MAP,
} from "../../src/hooks/tool-allowlist.js";
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

describe("AS-007: Privilege Escalation via Agent/Skill Tools", () => {
  let metadata: AgentMetadata;

  beforeEach(() => {
    metadata = makeQuarantineMetadata();
  });

  it("should block Task tool for quarantine agents", () => {
    const decision = enforceReviewMode("Task", {}, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not allowed.*Review Mode/i);
    expect(decision.securityEvent).toBeDefined();
  });

  it("should block Skill tool for quarantine agents", () => {
    const decision = enforceReviewMode("Skill", {}, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not allowed.*Review Mode/i);
  });

  it("should block TodoWrite tool for quarantine agents", () => {
    const decision = enforceReviewMode("TodoWrite", {}, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.securityEvent).toBeDefined();
  });

  it("should block QuestionTool for quarantine agents", () => {
    const decision = enforceReviewMode("QuestionTool", {}, metadata);

    expect(decision.allowed).toBe(false);
  });

  it("should verify Task tool has high risk in TOOL_RISK_MAP", () => {
    const risk = getToolRisk("Task");
    expect(risk?.risk).toBe("critical");
  });

  it("should verify Skill tool has high risk in TOOL_RISK_MAP", () => {
    const risk = getToolRisk("Skill");
    expect(risk?.risk).toBe("high");
  });

  it("should verify TodoWrite tool has medium-high risk", () => {
    const risk = getToolRisk("TodoWrite");
    expect(["medium", "high"]).toContain(risk?.risk);
  });

  it("should categorize Task tool correctly", () => {
    const category = getToolCategory("Task");
    expect(category).toBe("agent");
  });

  it("should categorize Skill tool correctly", () => {
    const category = getToolCategory("Skill");
    expect(category).toBe("skill");
  });

  it("should verify all agent tools are in denied list", () => {
    const agentTools = ["Task"];
    
    agentTools.forEach(tool => {
      expect(isToolDenied(tool)).toBe(true);
      expect(isToolAllowed(tool)).toBe(false);
    });
  });

  it("should verify all skill tools are in denied list", () => {
    const skillTools = ["Skill"];
    
    skillTools.forEach(tool => {
      expect(isToolDenied(tool)).toBe(true);
    });
  });

  it("should log security event with correct severity for escalation attempts", () => {
    const decision = enforceReviewMode("Task", { prompt: "spawn agent" }, metadata);

    expect(decision.securityEvent).toBeDefined();
    expect(decision.securityEvent?.severity).toBe("high");
    expect(decision.securityEvent?.type).toBe("TOOL_BLOCKED");
  });

  it("should ensure QUARANTINE_ALLOWED_TOOLS does not contain agent tools", () => {
    const dangerousTools = ["Task", "Skill", "TodoWrite"];
    
    dangerousTools.forEach(tool => {
      expect(QUARANTINE_ALLOWED_TOOLS).not.toContain(tool);
    });
  });

  it("should ensure QUARANTINE_DENIED_TOOLS contains all privilege escalation vectors", () => {
    const escalationVectors = ["Task", "Skill", "Bash", "Write", "Edit"];
    
    escalationVectors.forEach(tool => {
      expect(QUARANTINE_DENIED_TOOLS).toContain(tool);
    });
  });
});
