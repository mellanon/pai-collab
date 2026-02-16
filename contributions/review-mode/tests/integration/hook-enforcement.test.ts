import { describe, it, expect } from "vitest";
import {
	enforceReviewMode,
	extractTypedReferenceFromArgs,
} from "../../src/hooks/review-mode-hook.js";
import {
	createTypedReference,
	serializeTypedReference,
} from "../../src/lib/typed-reference.js";
import { generateHMACKey, createReferenceHMAC } from "../../src/lib/hmac-ops.js";
import type { AgentMetadata, QuarantineConfig } from "../../src/lib/types.js";
import { DEFAULT_QUARANTINE_CONFIG } from "../../src/lib/types.js";
import crypto from "node:crypto";

// ============================================================================
// HELPERS
// ============================================================================

function createQuarantineMetadata(
	overrides?: Partial<AgentMetadata>,
): AgentMetadata {
	return {
		agentId: crypto.randomUUID(),
		sessionId: crypto.randomUUID(),
		isQuarantine: true,
		hmacKey: generateHMACKey(),
		...overrides,
	};
}

function createNonQuarantineMetadata(): AgentMetadata {
	return {
		agentId: crypto.randomUUID(),
		sessionId: crypto.randomUUID(),
		isQuarantine: false,
	};
}

// ============================================================================
// TESTS
// ============================================================================

describe("Review Mode Hook Enforcement", () => {
	// ════════════════════════════════════════════════════════════════════════
	// 1. Non-quarantine pass-through (3 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Non-quarantine pass-through", () => {
		it("should allow non-quarantine agent to use any tool", () => {
			const metadata = createNonQuarantineMetadata();
			const decision = enforceReviewMode(
				"Write",
				{ filePath: "/tmp/test.txt" },
				metadata,
			);

			expect(decision.allowed).toBe(true);
			expect(decision.securityEvent).toBeUndefined();
		});

		it("should allow non-quarantine agent to use Bash", () => {
			const metadata = createNonQuarantineMetadata();
			const decision = enforceReviewMode(
				"Bash",
				{ command: "rm -rf /" },
				metadata,
			);

			expect(decision.allowed).toBe(true);
			expect(decision.securityEvent).toBeUndefined();
		});

		it("should allow non-quarantine agent with no hmacKey", () => {
			const metadata = createNonQuarantineMetadata();
			expect(metadata.hmacKey).toBeUndefined();

			const decision = enforceReviewMode(
				"Task",
				{ prompt: "Do something" },
				metadata,
			);

			expect(decision.allowed).toBe(true);
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 2. Feature toggle (2 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Feature toggle", () => {
		it("should allow quarantine agent when review mode is disabled", () => {
			const metadata = createQuarantineMetadata();
			const config: QuarantineConfig = {
				...DEFAULT_QUARANTINE_CONFIG,
				enabled: false,
			};

			const decision = enforceReviewMode(
				"Bash",
				{ command: "echo test" },
				metadata,
				config,
			);

			expect(decision.allowed).toBe(true);
		});

		it("should enforce restrictions when review mode is enabled (default)", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Write",
				{ filePath: "/tmp/test.txt" },
				metadata,
			);

			expect(decision.allowed).toBe(false);
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 3. Tool allowlist enforcement (ISC #9, #10, #18) (6 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Tool allowlist enforcement (ISC #9, #10, #18)", () => {
		it("should allow quarantine agent to use Read", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Read",
				{ filePath: "/tmp/test.txt" },
				metadata,
			);

			expect(decision.allowed).toBe(true);
		});

		it("should allow quarantine agent to use Grep", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Grep",
				{ pattern: "test", path: "/tmp" },
				metadata,
			);

			expect(decision.allowed).toBe(true);
		});

		it("should allow quarantine agent to use Glob", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Glob",
				{ pattern: "*.ts" },
				metadata,
			);

			expect(decision.allowed).toBe(true);
		});

		it("should deny quarantine agent from using Bash with TOOL_BLOCKED event", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Bash",
				{ command: "ls -la" },
				metadata,
			);

			expect(decision.allowed).toBe(false);
			expect(decision.reason).toContain("Bash");
			expect(decision.reason).toContain("not allowed");
			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.type).toBe("TOOL_BLOCKED");
			expect(decision.securityEvent?.tool).toBe("Bash");
			expect(decision.securityEvent?.severity).toBe("high");
		});

		it("should deny quarantine agent from using Write with TOOL_BLOCKED event", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Write",
				{ filePath: "/tmp/test.txt", content: "data" },
				metadata,
			);

			expect(decision.allowed).toBe(false);
			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.type).toBe("TOOL_BLOCKED");
			expect(decision.securityEvent?.tool).toBe("Write");
		});

		it("should deny quarantine agent from using Task with TOOL_BLOCKED event (privilege escalation)", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Task",
				{ prompt: "Execute sub-agent", subagent_type: "Engineer" },
				metadata,
			);

			expect(decision.allowed).toBe(false);
			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.type).toBe("TOOL_BLOCKED");
			expect(decision.securityEvent?.tool).toBe("Task");
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 4. HMAC validation in hook (ISC #11) (5 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("HMAC validation in hook (ISC #11)", () => {
		it("should allow valid TypedReference URI in args", () => {
			const metadata = createQuarantineMetadata();
			const ref = createTypedReference(
				"/tmp/test.txt",
				metadata.sessionId,
				metadata.hmacKey!,
			);
			const uri = serializeTypedReference(ref);

			const decision = enforceReviewMode(
				"Read",
				{ filePath: uri },
				metadata,
			);

			expect(decision.allowed).toBe(true);
			expect(decision.securityEvent).toBeUndefined();
		});

		it("should deny forged HMAC in TypedReference URI with HMAC_VERIFICATION_FAILED", () => {
			const metadata = createQuarantineMetadata();
			// Create a valid reference, then forge the HMAC
			const ref = createTypedReference(
				"/tmp/test.txt",
				metadata.sessionId,
				metadata.hmacKey!,
			);
			const forgedRef = { ...ref, hmac: "a".repeat(64) };
			const uri = serializeTypedReference(forgedRef);

			const decision = enforceReviewMode(
				"Read",
				{ filePath: uri },
				metadata,
			);

			expect(decision.allowed).toBe(false);
			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.type).toBe("HMAC_VERIFICATION_FAILED");
			expect(decision.securityEvent?.severity).toBe("critical");
		});

		it("should deny when HMAC key missing on metadata with HMAC_VERIFICATION_FAILED", () => {
			const metadata = createQuarantineMetadata({ hmacKey: undefined });
			// Create a typed:// URI (using a temp key for construction)
			const tempKey = generateHMACKey();
			const ref = createTypedReference(
				"/tmp/test.txt",
				metadata.sessionId,
				tempKey,
			);
			const uri = serializeTypedReference(ref);

			const decision = enforceReviewMode(
				"Read",
				{ filePath: uri },
				metadata,
			);

			expect(decision.allowed).toBe(false);
			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.type).toBe("HMAC_VERIFICATION_FAILED");
			expect(decision.reason).toContain("no HMAC key");
		});

		it("should deny expired TypedReference with HMAC_VERIFICATION_FAILED", () => {
			const metadata = createQuarantineMetadata();
			// Manually create an expired reference
			const expiredTimestamp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
			const hmac = createReferenceHMAC(
				"/tmp/test.txt",
				expiredTimestamp,
				metadata.sessionId,
				metadata.hmacKey!,
			);
			const expiredRef = {
				path: "/tmp/test.txt",
				hmac,
				timestamp: expiredTimestamp,
				sessionId: metadata.sessionId,
			};
			const uri = serializeTypedReference(expiredRef);

			const decision = enforceReviewMode(
				"Read",
				{ filePath: uri },
				metadata,
			);

			expect(decision.allowed).toBe(false);
			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.type).toBe("HMAC_VERIFICATION_FAILED");
		});

		it("should deny malformed TypedReference URI with INVALID_TYPED_REFERENCE", () => {
			const metadata = createQuarantineMetadata();
			const malformedUri = "typed:///tmp/test.txt?invalid=params";

			const decision = enforceReviewMode(
				"Read",
				{ filePath: malformedUri },
				metadata,
			);

			expect(decision.allowed).toBe(false);
			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.type).toBe("INVALID_TYPED_REFERENCE");
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 5. Security event logging (ISC #16) (3 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Security event logging (ISC #16)", () => {
		it("should produce securityEvent with correct type for denied tool", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Bash",
				{ command: "ls" },
				metadata,
			);

			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.type).toBe("TOOL_BLOCKED");
			expect(decision.securityEvent?.agentId).toBe(metadata.agentId);
			expect(decision.securityEvent?.sessionId).toBe(metadata.sessionId);
		});

		it("should produce securityEvent with high severity for denied tool", () => {
			const metadata = createQuarantineMetadata();

			const decision = enforceReviewMode(
				"Write",
				{ filePath: "/tmp/test.txt" },
				metadata,
			);

			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.severity).toBe("high");
		});

		it("should produce securityEvent with critical severity for HMAC failure", () => {
			const metadata = createQuarantineMetadata();
			const forgedRef = {
				path: "/tmp/test.txt",
				hmac: "b".repeat(64),
				timestamp: Math.floor(Date.now() / 1000),
				sessionId: metadata.sessionId,
			};
			const uri = serializeTypedReference(forgedRef);

			const decision = enforceReviewMode(
				"Read",
				{ filePath: uri },
				metadata,
			);

			expect(decision.securityEvent).toBeDefined();
			expect(decision.securityEvent?.severity).toBe("critical");
			expect(decision.securityEvent?.type).toBe("HMAC_VERIFICATION_FAILED");
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 6. Fail-closed behavior (ISC #17) (2 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("Fail-closed behavior (ISC #17)", () => {
		it("should deny when enforcement throws an unexpected error (fail-closed)", () => {
			const metadata = createQuarantineMetadata();
			// Pass a config with empty allowedTools to exercise the edge case
			const config: QuarantineConfig = {
				...DEFAULT_QUARANTINE_CONFIG,
				allowedTools: [],
			};

			const decision = enforceReviewMode("Read", {}, metadata, config);

			expect(decision.allowed).toBe(false);
		});

		it("should handle empty args object gracefully for allowed tools", () => {
			const metadata = createQuarantineMetadata();

			// Grep with empty args — no TypedReference found, so it should pass through
			const decision = enforceReviewMode("Grep", {}, metadata);

			expect(decision.allowed).toBe(true);
		});
	});

	// ════════════════════════════════════════════════════════════════════════
	// 7. extractTypedReferenceFromArgs (2 tests)
	// ════════════════════════════════════════════════════════════════════════
	describe("extractTypedReferenceFromArgs", () => {
		it("should find typed:// URI in filePath field", () => {
			const metadata = createQuarantineMetadata();
			const ref = createTypedReference(
				"/tmp/test.txt",
				metadata.sessionId,
				metadata.hmacKey!,
			);
			const uri = serializeTypedReference(ref);
			const args = { filePath: uri };

			const extracted = extractTypedReferenceFromArgs(args);

			expect(extracted).toBe(uri);
		});

		it("should return undefined for regular paths", () => {
			const args = { filePath: "/tmp/test.txt" };

			const extracted = extractTypedReferenceFromArgs(args);

			expect(extracted).toBeUndefined();
		});

		it("should find typed:// URI in path field", () => {
			const uri = "typed:///tmp/test?hmac=abc&ts=123&sid=test";
			const args = { path: uri };

			const extracted = extractTypedReferenceFromArgs(args);

			expect(extracted).toBe(uri);
		});
	});
});
