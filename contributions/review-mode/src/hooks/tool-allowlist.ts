/**
 * Tool Allowlist Module for Review Mode Quarantine Agents
 *
 * This module defines the authoritative security boundary for quarantined agents.
 * It implements a strict allowlist approach: only explicitly permitted tools can be used.
 *
 * Security Model:
 * - Allowlist default: Read, Grep, Glob (read-only analysis tools)
 * - Everything else is denied by default
 * - Deny list exists for documentation and explicit risk mapping
 *
 * @module tool-allowlist
 */

/**
 * Default allowlist for quarantine agents.
 *
 * These tools are safe for untrusted content analysis:
 * - Read: Read files with offset/limit controls
 * - Grep: Search file contents (no execution)
 * - Glob: File pattern matching (no execution)
 *
 * Design: Read-only, no execution, no network, no privilege escalation.
 */
export const QUARANTINE_ALLOWED_TOOLS = ["Read", "Grep", "Glob"] as const;

/**
 * Comprehensive deny list of dangerous tools.
 *
 * This list documents ALL tools that pose security risks in quarantine.
 * Used for:
 * - Documentation of attack surface
 * - Risk mapping and audit logging
 * - Validation that allowlist doesn't contain denied tools
 * - Testing security boundaries
 *
 * Note: With allowlist approach, these are denied by default.
 * This list makes the security model explicit.
 */
export const QUARANTINE_DENIED_TOOLS = [
  // ════════════════════════════════════════════════════════════
  // EXECUTION TOOLS (Critical Risk)
  // ════════════════════════════════════════════════════════════
  "Bash", // Arbitrary command execution

  // ════════════════════════════════════════════════════════════
  // WRITE TOOLS (Critical Risk)
  // ════════════════════════════════════════════════════════════
  "Write", // Create/overwrite files
  "Edit", // Modify existing files

  // ════════════════════════════════════════════════════════════
  // AGENT TOOLS (Critical Risk - Privilege Escalation)
  // ════════════════════════════════════════════════════════════
  "Task", // Spawn sub-agents without quarantine

  // ════════════════════════════════════════════════════════════
  // SKILL TOOLS (High Risk - Capability Escalation)
  // ════════════════════════════════════════════════════════════
  "Skill", // Invoke arbitrary skills with unknown behaviors

  // ════════════════════════════════════════════════════════════
  // NETWORK TOOLS (High Risk - Exfiltration)
  // ════════════════════════════════════════════════════════════
  "WebFetch", // HTTP requests to external servers

  // ════════════════════════════════════════════════════════════
  // MCP TOOLS (High Risk - Business Data Access)
  // ════════════════════════════════════════════════════════════
  "mcp_odoo", // CRM/ERP data access
  "mcp_linear", // Project management data
  "mcp_n8n", // Workflow automation access
  "mcp_dify", // AI orchestration platform
  "mcp_chatwoot", // Customer communication data
  "mcp_garrett", // Garrett AI integration
  "mcp_omi", // Memory/conversation data
  "mcp_svelte", // Svelte documentation (benign but unnecessary)
  "mcp_deepwiki", // GitHub repo analysis (network access)

  // ════════════════════════════════════════════════════════════
  // STATE/TODO TOOLS (Medium Risk - State Manipulation)
  // ════════════════════════════════════════════════════════════
  "TodoWrite", // Task state manipulation

  // ════════════════════════════════════════════════════════════
  // INTERACTION TOOLS (Medium Risk - Social Engineering)
  // ════════════════════════════════════════════════════════════
  "QuestionTool", // Prompt user for input (social engineering vector)
] as const;

/**
 * Risk mapping for each denied tool.
 *
 * Maps tool name to:
 * - risk: "critical" | "high" | "medium"
 * - attackScenario: Reference to specific attack scenario in threat model
 *
 * Used for:
 * - Audit logging context
 * - Security incident investigation
 * - Risk assessment and prioritization
 */
export const TOOL_RISK_MAP: Record<
  string,
  { risk: "critical" | "high" | "medium"; attackScenario: string }
> = {
  // Critical: Direct system compromise
  Bash: {
    risk: "critical",
    attackScenario: "AS-001: Arbitrary command execution",
  },
  Write: {
    risk: "critical",
    attackScenario: "AS-001: Write malicious files to disk",
  },
  Edit: {
    risk: "critical",
    attackScenario: "AS-001: Modify system/config files",
  },
  Task: {
    risk: "critical",
    attackScenario: "AS-007: Spawn privileged sub-agents (escape quarantine)",
  },

  // High: Data access or exfiltration
  Skill: {
    risk: "high",
    attackScenario: "AS-007: Invoke arbitrary skills with unknown capabilities",
  },
  WebFetch: {
    risk: "high",
    attackScenario: "AS-008: Exfiltrate data via HTTP requests",
  },
  mcp_odoo: {
    risk: "high",
    attackScenario: "AS-008: Access CRM/ERP business data",
  },
  mcp_linear: {
    risk: "high",
    attackScenario: "AS-008: Access project management data",
  },
  mcp_n8n: {
    risk: "high",
    attackScenario: "AS-008: Trigger workflows, access automation data",
  },
  mcp_dify: {
    risk: "high",
    attackScenario: "AS-008: Access AI orchestration platform",
  },
  mcp_chatwoot: {
    risk: "high",
    attackScenario: "AS-008: Access customer communication data",
  },
  mcp_garrett: {
    risk: "high",
    attackScenario: "AS-008: Access Garrett AI integration",
  },
  mcp_omi: {
    risk: "high",
    attackScenario: "AS-008: Access memory/conversation history",
  },
  mcp_svelte: {
    risk: "high",
    attackScenario: "AS-008: Network access to documentation APIs",
  },
  mcp_deepwiki: {
    risk: "high",
    attackScenario: "AS-008: Network access to GitHub repos",
  },

  // Medium: State manipulation or social engineering
  TodoWrite: {
    risk: "medium",
    attackScenario: "AS-003: Manipulate task state to hide malicious actions",
  },
  QuestionTool: {
    risk: "medium",
    attackScenario:
      "AS-004: Social engineering via prompted user interaction",
  },
};

/**
 * Check if a tool is in the allowed list.
 *
 * @param tool - Tool name to check (case-sensitive)
 * @param allowedTools - Optional custom allowlist (defaults to QUARANTINE_ALLOWED_TOOLS)
 * @returns true if tool is explicitly allowed, false otherwise
 *
 * @example
 * isToolAllowed("Read") // true
 * isToolAllowed("Bash") // false
 * isToolAllowed("Write", ["Read", "Write"]) // true with custom list
 */
export function isToolAllowed(
  tool: string,
  allowedTools: readonly string[] = QUARANTINE_ALLOWED_TOOLS,
): boolean {
  return allowedTools.includes(tool);
}

/**
 * Check if a tool is explicitly in the deny list.
 *
 * Note: With allowlist approach, this is primarily for documentation.
 * Any tool NOT in the allowlist is effectively denied.
 *
 * @param tool - Tool name to check (case-sensitive)
 * @returns true if tool is in the explicit deny list
 *
 * @example
 * isToolDenied("Bash") // true
 * isToolDenied("Read") // false
 * isToolDenied("UnknownTool") // false (but still denied by allowlist)
 */
export function isToolDenied(tool: string): boolean {
  return QUARANTINE_DENIED_TOOLS.includes(
    tool as (typeof QUARANTINE_DENIED_TOOLS)[number],
  );
}

/**
 * Get risk information for a tool.
 *
 * Returns risk level and attack scenario reference.
 * Used for audit logging and security incident investigation.
 *
 * @param tool - Tool name to look up
 * @returns Risk info if tool is in risk map, undefined otherwise
 *
 * @example
 * getToolRisk("Bash")
 * // { risk: "critical", attackScenario: "AS-001: Arbitrary command execution" }
 *
 * getToolRisk("Read")
 * // undefined (safe tool, not in risk map)
 */
export function getToolRisk(
  tool: string,
): { risk: "critical" | "high" | "medium"; attackScenario: string } | undefined {
  return TOOL_RISK_MAP[tool];
}

/**
 * Validate a proposed tool allowlist.
 *
 * Ensures:
 * 1. Allowlist is not empty
 * 2. No tool in allowlist is also in deny list
 * 3. (Future) Tool names are valid
 *
 * @param tools - Proposed allowlist to validate
 * @returns Validation result with errors if any
 *
 * @example
 * validateToolAllowlist(["Read", "Grep"])
 * // { valid: true, errors: [] }
 *
 * validateToolAllowlist(["Read", "Bash"])
 * // { valid: false, errors: ["Tool 'Bash' is explicitly denied (critical risk)"] }
 *
 * validateToolAllowlist([])
 * // { valid: false, errors: ["Allowlist cannot be empty"] }
 */
export function validateToolAllowlist(
  tools: string[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check: Allowlist must not be empty
  if (tools.length === 0) {
    errors.push("Allowlist cannot be empty");
  }

  // Check: No tool in allowlist should be in deny list
  for (const tool of tools) {
    if (isToolDenied(tool)) {
      const riskInfo = getToolRisk(tool);
      const riskLevel = riskInfo ? riskInfo.risk : "unknown";
      errors.push(
        `Tool '${tool}' is explicitly denied (${riskLevel} risk)`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Categorize a tool by its primary function.
 *
 * Used for audit logging context and security analysis.
 *
 * Categories:
 * - read-only: Safe read operations (Read, Grep, Glob)
 * - write: File modification (Write, Edit)
 * - execution: Command execution (Bash)
 * - network: External communication (WebFetch)
 * - mcp: MCP server access (mcp_*)
 * - agent: Sub-agent spawning (Task)
 * - skill: Skill invocation (Skill)
 * - state: State manipulation (TodoWrite)
 * - interaction: User interaction (QuestionTool)
 * - other: Unknown/uncategorized
 *
 * @param tool - Tool name to categorize
 * @returns Category string
 *
 * @example
 * getToolCategory("Read") // "read-only"
 * getToolCategory("Bash") // "execution"
 * getToolCategory("mcp_odoo") // "mcp"
 */
export function getToolCategory(tool: string): string {
  // Read-only tools (safe)
  if (["Read", "Grep", "Glob"].includes(tool)) {
    return "read-only";
  }

  // Write tools
  if (["Write", "Edit"].includes(tool)) {
    return "write";
  }

  // Execution tools
  if (tool === "Bash") {
    return "execution";
  }

  // Network tools
  if (tool === "WebFetch") {
    return "network";
  }

  // MCP tools
  if (tool.startsWith("mcp_")) {
    return "mcp";
  }

  // Agent tools
  if (tool === "Task") {
    return "agent";
  }

  // Skill tools
  if (tool === "Skill") {
    return "skill";
  }

  // State tools
  if (tool === "TodoWrite") {
    return "state";
  }

  // Interaction tools
  if (tool === "QuestionTool") {
    return "interaction";
  }

  // Unknown/other
  return "other";
}
