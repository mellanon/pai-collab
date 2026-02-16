import { describe, it, expect } from "vitest";
import { OpenCodeReviewModeAdapter } from "../../src/hooks/adapters/opencode-adapter.js";
import {
	ClaudeCodeReviewModeAdapter,
	parseClaudeCodeHookInput,
} from "../../src/hooks/adapters/claude-code-adapter.js";
import { generateHMACKey } from "../../src/lib/hmac-ops.js";
import type { AgentMetadata } from "../../src/lib/types.js";
import crypto from "node:crypto";

// ============================================================================
// HELPERS
// ============================================================================

function createQuarantineMetadata(): AgentMetadata {
	const key = generateHMACKey();
	return {
		agentId: crypto.randomUUID(),
		sessionId: crypto.randomUUID(),
		isQuarantine: true,
		hmacKey: key,
	};
}

function createNormalMetadata(): AgentMetadata {
	return {
		agentId: crypto.randomUUID(),
		sessionId: crypto.randomUUID(),
		isQuarantine: false,
	};
}

// ============================================================================
// TESTS
// ============================================================================

describe("Platform Compatibility Tests", () => {
	// ════════════════════════════════════════════════════════════════════════
	// 1. OpenCode Adapter (ISC #14) (4 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("OpenCode Adapter (ISC #14 - Error Throwing)", () => {
		it("should allow quarantine agent using Read", () => {
			const adapter = new OpenCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();
			adapter.onAgentSpawn(metadata.agentId);

			expect(() => {
				adapter.handleBeforeToolUse(
					"Read",
					{ filePath: "/test" },
					metadata,
				);
			}).not.toThrow();
		});

		it("should throw Error when quarantine agent uses Bash", () => {
			const adapter = new OpenCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();
			adapter.onAgentSpawn(metadata.agentId);

			expect(() => {
				adapter.handleBeforeToolUse(
					"Bash",
					{ command: "echo test" },
					metadata,
				);
			}).toThrow("[Review Mode]");
		});

		it("should throw Error when quarantine agent uses Write", () => {
			const adapter = new OpenCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();
			adapter.onAgentSpawn(metadata.agentId);

			expect(() => {
				adapter.handleBeforeToolUse(
					"Write",
					{ filePath: "/test", content: "test" },
					metadata,
				);
			}).toThrow("[Review Mode]");
		});

		it("should allow non-quarantine agent using Bash", () => {
			const adapter = new OpenCodeReviewModeAdapter();
			const metadata = createNormalMetadata();

			expect(() => {
				adapter.handleBeforeToolUse(
					"Bash",
					{ command: "echo test" },
					metadata,
				);
			}).not.toThrow();
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 2. Claude Code Adapter (ISC #15) (4 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Claude Code Adapter (ISC #15 - HookDecision)", () => {
		it("should allow quarantine agent using Read", () => {
			const adapter = new ClaudeCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();
			adapter.onAgentSpawn(metadata.agentId);

			const decision = adapter.checkToolUse(
				"Read",
				{ filePath: "/test" },
				metadata,
			);
			expect(decision.allowed).toBe(true);
		});

		it("should deny when quarantine agent uses Bash", () => {
			const adapter = new ClaudeCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();
			adapter.onAgentSpawn(metadata.agentId);

			const decision = adapter.checkToolUse(
				"Bash",
				{ command: "echo test" },
				metadata,
			);
			expect(decision.allowed).toBe(false);
			expect(decision.reason).toContain("Bash");
		});

		it("should deny when quarantine agent uses Write", () => {
			const adapter = new ClaudeCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();
			adapter.onAgentSpawn(metadata.agentId);

			const decision = adapter.checkToolUse(
				"Write",
				{ filePath: "/test", content: "test" },
				metadata,
			);
			expect(decision.allowed).toBe(false);
			expect(decision.reason).toContain("Write");
		});

		it("should allow non-quarantine agent using Bash", () => {
			const adapter = new ClaudeCodeReviewModeAdapter();
			const metadata = createNormalMetadata();

			const decision = adapter.checkToolUse(
				"Bash",
				{ command: "echo test" },
				metadata,
			);
			expect(decision.allowed).toBe(true);
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 3. Platform Parity (ISC #18) (3 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Platform Parity (ISC #18 - Shared Enforcement Logic)", () => {
		it("should block the same set of dangerous tools for quarantine agents", () => {
			const opencode = new OpenCodeReviewModeAdapter();
			const claudecode = new ClaudeCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();

			opencode.onAgentSpawn(metadata.agentId);
			claudecode.onAgentSpawn(metadata.agentId);

			const dangerousTools = ["Bash", "Write", "Edit", "Task"];

			for (const tool of dangerousTools) {
				// OpenCode throws
				expect(() => {
					opencode.handleBeforeToolUse(tool, {}, metadata);
				}).toThrow("[Review Mode]");

				// Claude Code returns denied decision
				const decision = claudecode.checkToolUse(tool, {}, metadata);
				expect(decision.allowed).toBe(false);
			}
		});

		it("should allow Read/Grep/Glob for quarantine agents on both platforms", () => {
			const opencode = new OpenCodeReviewModeAdapter();
			const claudecode = new ClaudeCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();

			opencode.onAgentSpawn(metadata.agentId);
			claudecode.onAgentSpawn(metadata.agentId);

			const safeTools = ["Read", "Grep", "Glob"];

			for (const tool of safeTools) {
				// OpenCode doesn't throw
				expect(() => {
					opencode.handleBeforeToolUse(tool, {}, metadata);
				}).not.toThrow();

				// Claude Code returns allowed decision
				const decision = claudecode.checkToolUse(tool, {}, metadata);
				expect(decision.allowed).toBe(true);
			}
		});

		it("should pass through all tools for non-quarantine agents on both platforms", () => {
			const opencode = new OpenCodeReviewModeAdapter();
			const claudecode = new ClaudeCodeReviewModeAdapter();
			const metadata = createNormalMetadata();

			const allTools = [
				"Read",
				"Write",
				"Edit",
				"Bash",
				"Task",
				"Grep",
				"Glob",
			];

			for (const tool of allTools) {
				// OpenCode doesn't throw
				expect(() => {
					opencode.handleBeforeToolUse(tool, {}, metadata);
				}).not.toThrow();

				// Claude Code returns allowed decision
				const decision = claudecode.checkToolUse(tool, {}, metadata);
				expect(decision.allowed).toBe(true);
			}
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 4. parseClaudeCodeHookInput (4 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("parseClaudeCodeHookInput", () => {
		it("should parse tool_name/tool_input format correctly", () => {
			const input = JSON.stringify({
				tool_name: "Read",
				tool_input: { filePath: "/test" },
			});

			const result = parseClaudeCodeHookInput(input);
			expect(result.tool).toBe("Read");
			expect(result.args).toEqual({ filePath: "/test" });
		});

		it("should parse tool/args format correctly", () => {
			const input = JSON.stringify({
				tool: "Read",
				args: { filePath: "/test" },
			});

			const result = parseClaudeCodeHookInput(input);
			expect(result.tool).toBe("Read");
			expect(result.args).toEqual({ filePath: "/test" });
		});

		it("should throw on invalid JSON", () => {
			expect(() => {
				parseClaudeCodeHookInput("not json");
			}).toThrow("Invalid JSON");
		});

		it("should throw on missing required fields", () => {
			const input = JSON.stringify({
				some_other_field: "value",
			});

			expect(() => {
				parseClaudeCodeHookInput(input);
			}).toThrow("Missing required fields");
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 5. Agent Lifecycle (2 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Agent Lifecycle", () => {
		it("should register agent with rate limiter on spawn", () => {
			const opencode = new OpenCodeReviewModeAdapter();
			const claudecode = new ClaudeCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();

			const opencodeRegistered = opencode.onAgentSpawn(metadata.agentId);
			const claudecodeRegistered = claudecode.onAgentSpawn(
				metadata.agentId,
			);

			expect(opencodeRegistered).toBe(true);
			expect(claudecodeRegistered).toBe(true);

			// Verify rate limiter has the agent by checking stats
			const opcStats = opencode
				.getRateLimiter()
				.getAgentStats(metadata.agentId);
			const ccStats = claudecode
				.getRateLimiter()
				.getAgentStats(metadata.agentId);

			expect(opcStats).toBeDefined();
			expect(opcStats?.callsInWindow).toBe(0);
			expect(ccStats).toBeDefined();
			expect(ccStats?.callsInWindow).toBe(0);
		});

		it("should unregister agent on exit (stats return undefined)", () => {
			const opencode = new OpenCodeReviewModeAdapter();
			const claudecode = new ClaudeCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();

			opencode.onAgentSpawn(metadata.agentId);
			claudecode.onAgentSpawn(metadata.agentId);

			opencode.onAgentExit(metadata.agentId);
			claudecode.onAgentExit(metadata.agentId);

			const opcStats = opencode
				.getRateLimiter()
				.getAgentStats(metadata.agentId);
			const ccStats = claudecode
				.getRateLimiter()
				.getAgentStats(metadata.agentId);

			expect(opcStats).toBeUndefined();
			expect(ccStats).toBeUndefined();
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 6. Error Message Format (2 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Error Message Format", () => {
		it("should include [Review Mode] prefix in OpenCode error message", () => {
			const adapter = new OpenCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();
			adapter.onAgentSpawn(metadata.agentId);

			try {
				adapter.handleBeforeToolUse("Bash", {}, metadata);
				expect.fail("Should have thrown");
			} catch (error) {
				expect((error as Error).message).toContain("[Review Mode]");
				expect((error as Error).message).toContain("Bash");
			}
		});

		it("should include tool name in Claude Code denial reason", () => {
			const adapter = new ClaudeCodeReviewModeAdapter();
			const metadata = createQuarantineMetadata();
			adapter.onAgentSpawn(metadata.agentId);

			const decision = adapter.checkToolUse("Write", {}, metadata);
			expect(decision.allowed).toBe(false);
			expect(decision.reason).toContain("Write");
		});
	});
});
