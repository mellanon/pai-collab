import { describe, it, expect, beforeEach } from "vitest";
import crypto from "node:crypto";
import { enforceReviewMode } from "../../src/hooks/review-mode-hook.js";
import { getToolRisk, TOOL_RISK_MAP } from "../../src/hooks/tool-allowlist.js";
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

describe("AS-008: MCP Data Exfiltration", () => {
  let metadata: AgentMetadata;

  beforeEach(() => {
    metadata = makeQuarantineMetadata();
  });

  it("should block mcp_odoo for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_odoo", { method: "search_read" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not allowed.*Review Mode/i);
    expect(decision.securityEvent).toBeDefined();
  });

  it("should block mcp_linear for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_linear", { query: "list_issues" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.securityEvent?.tool).toBe("mcp_linear");
  });

  it("should block mcp_n8n for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_n8n", { workflow: "get_executions" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not allowed.*Review Mode/i);
  });

  it("should block mcp_chatwoot for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_chatwoot", { action: "list_conversations" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.securityEvent).toBeDefined();
  });

  it("should block mcp_garrett for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_garrett", { message: "hello" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not allowed.*Review Mode/i);
  });

  it("should block mcp_omi for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_omi", { action: "get_memories" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.securityEvent?.type).toBe("TOOL_BLOCKED");
  });

  it("should block WebFetch for quarantine agents", () => {
    const decision = enforceReviewMode("WebFetch", { url: "https://example.com" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not allowed.*Review Mode/i);
  });

  it("should block mcp_dify for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_dify", { action: "list_apps" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.securityEvent).toBeDefined();
  });

  it("should block mcp_svelte for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_svelte", { action: "get_documentation" }, metadata);

    expect(decision.allowed).toBe(false);
  });

  it("should block mcp_deepwiki for quarantine agents", () => {
    const decision = enforceReviewMode("mcp_deepwiki", { repo: "facebook/react" }, metadata);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not allowed.*Review Mode/i);
  });

  it("should verify mcp_odoo has high risk level", () => {
    const risk = getToolRisk("mcp_odoo");
    expect(risk?.risk).toBe("high");
  });

  it("should verify mcp_linear has high risk level", () => {
    const risk = getToolRisk("mcp_linear");
    expect(risk?.risk).toBe("high");
  });

  it("should verify mcp_n8n has high risk level", () => {
    const risk = getToolRisk("mcp_n8n");
    expect(risk?.risk).toBe("high");
  });

  it("should verify mcp_chatwoot has high risk level", () => {
    const risk = getToolRisk("mcp_chatwoot");
    expect(risk?.risk).toBe("high");
  });

  it("should verify WebFetch has at least medium risk level", () => {
    const risk = getToolRisk("WebFetch");
    expect(["medium", "high"]).toContain(risk?.risk);
  });

  it("should log security events with correct context for MCP tools", () => {
    const mcpTools = [
      "mcp_odoo",
      "mcp_linear",
      "mcp_n8n",
      "mcp_chatwoot",
      "mcp_garrett",
      "mcp_omi",
    ];

    mcpTools.forEach(tool => {
      const decision = enforceReviewMode(tool, {}, metadata);
      
      expect(decision.securityEvent).toBeDefined();
      expect(decision.securityEvent?.agentId).toBe(metadata.agentId);
      expect(decision.securityEvent?.sessionId).toBe(metadata.sessionId);
      expect(decision.securityEvent?.tool).toBe(tool);
    });
  });

  it("should ensure all MCP tools are marked high severity when blocked", () => {
    const mcpTools = ["mcp_odoo", "mcp_linear", "mcp_n8n", "mcp_chatwoot"];

    mcpTools.forEach(tool => {
      const decision = enforceReviewMode(tool, {}, metadata);
      expect(decision.securityEvent?.severity).toBe("high");
    });
  });

  it("should verify all network-accessing tools are blocked", () => {
    const networkTools = ["WebFetch", "mcp_garrett", "mcp_deepwiki"];

    networkTools.forEach(tool => {
      const decision = enforceReviewMode(tool, {}, metadata);
      expect(decision.allowed).toBe(false);
    });
  });
});
