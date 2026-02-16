/**
 * Quarantine Agent Spawn Integration Tests (ISC #19-25)
 *
 * Tests the full quarantine spawn system including:
 * - Spawn template prompt generation (#25)
 * - Agent metadata injection (#19, #20)
 * - Session key lifecycle (#24)
 * - Response parsing (#22)
 * - Concurrency limits (#13 via canSpawnQuarantine)
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
	buildQuarantinePrompt,
	buildUserContentPrompt,
	QUARANTINE_SYSTEM_PROMPT_TEMPLATE,
} from "../../src/quarantine/spawn-template.js";
import {
	prepareQuarantineSpawn,
	canSpawnQuarantine,
	createFileReferences,
	createCleanupFn,
} from "../../src/quarantine/agent-metadata.js";
import {
	parseQuarantineResponse,
	extractJsonFromText,
	attemptPartialParse,
	validateResponse,
} from "../../src/quarantine/response-parser.js";
import { SessionManager } from "../../src/lib/session-manager.js";
import { DEFAULT_QUARANTINE_CONFIG } from "../../src/lib/types.js";
import type { QuarantineConfig } from "../../src/lib/types.js";

describe("Quarantine Agent Spawn System", () => {
	let sessionManager: SessionManager;

	beforeEach(() => {
		sessionManager = new SessionManager();
	});

	// =====================================================================
	// Spawn Template (ISC #25)
	// =====================================================================

	describe("Spawn Template (ISC #25)", () => {
		it("buildQuarantinePrompt includes tool restrictions", () => {
			const prompt = buildQuarantinePrompt();
			expect(prompt).toContain("Read");
			expect(prompt).toContain("Grep");
			expect(prompt).toContain("Glob");
			expect(prompt).toContain("FORBIDDEN TOOLS");
		});

		it("buildQuarantinePrompt includes TypedReference format explanation", () => {
			const prompt = buildQuarantinePrompt();
			expect(prompt).toContain("TypedReference");
			expect(prompt).toContain("typed://");
			expect(prompt).toContain("hmac");
		});

		it("buildQuarantinePrompt includes output JSON schema", () => {
			const prompt = buildQuarantinePrompt();
			expect(prompt).toContain("findings");
			expect(prompt).toContain("riskLevel");
			expect(prompt).toContain("recommendedActions");
			expect(prompt).toContain("metadata");
			expect(prompt).toContain("JSON");
		});

		it("buildQuarantinePrompt replaces TTL placeholder", () => {
			const customConfig: QuarantineConfig = {
				...DEFAULT_QUARANTINE_CONFIG,
				typedReferenceTTL: 7200,
			};
			const prompt = buildQuarantinePrompt(customConfig);
			expect(prompt).toContain("7200");
			expect(prompt).not.toContain("{{TTL}}");
		});

		it("buildQuarantinePrompt replaces timeout placeholder", () => {
			const customConfig: QuarantineConfig = {
				...DEFAULT_QUARANTINE_CONFIG,
				quarantineAgentTimeout: 180000,
			};
			const prompt = buildQuarantinePrompt(customConfig);
			expect(prompt).toContain("180"); // 180000ms / 1000 = 180s
			expect(prompt).not.toContain("{{TIMEOUT_SECONDS}}");
		});

		it("buildUserContentPrompt lists all files with URIs", () => {
			const session = sessionManager.createSession("test-agent", true);
			const refs = createFileReferences(
				["/tmp/file1.ts", "/tmp/file2.ts"],
				session.sessionId,
				session.hmacKey,
			);

			const files = refs.map((r) => ({
				reference: r.reference,
				uri: r.uri,
			}));

			const prompt = buildUserContentPrompt(files);
			expect(prompt).toContain("typed://");
			expect(prompt).toContain("File 1");
			expect(prompt).toContain("File 2");

			sessionManager.destroySession(session.sessionId);
		});

		it("buildUserContentPrompt includes instructions when provided", () => {
			const session = sessionManager.createSession("test-agent", true);
			const refs = createFileReferences(
				["/tmp/test.ts"],
				session.sessionId,
				session.hmacKey,
			);

			const files = refs.map((r) => ({
				reference: r.reference,
				uri: r.uri,
			}));

			const prompt = buildUserContentPrompt(
				files,
				"Pay special attention to input validation",
			);
			expect(prompt).toContain(
				"Pay special attention to input validation",
			);

			sessionManager.destroySession(session.sessionId);
		});

		it("buildUserContentPrompt works without instructions", () => {
			const session = sessionManager.createSession("test-agent", true);
			const refs = createFileReferences(
				["/tmp/test.ts"],
				session.sessionId,
				session.hmacKey,
			);

			const files = refs.map((r) => ({
				reference: r.reference,
				uri: r.uri,
			}));

			const prompt = buildUserContentPrompt(files);
			expect(prompt).toBeTruthy();
			expect(prompt).toContain("typed://");

			sessionManager.destroySession(session.sessionId);
		});

		it("raw template contains all required placeholders", () => {
			expect(QUARANTINE_SYSTEM_PROMPT_TEMPLATE).toContain(
				"{{ALLOWED_TOOLS}}",
			);
			expect(QUARANTINE_SYSTEM_PROMPT_TEMPLATE).toContain("{{TTL}}");
			expect(QUARANTINE_SYSTEM_PROMPT_TEMPLATE).toContain(
				"{{TIMEOUT_SECONDS}}",
			);
		});
	});

	// =====================================================================
	// Agent Metadata (ISC #19, #20, #24)
	// =====================================================================

	describe("Agent Metadata (ISC #19, #20, #24)", () => {
		it("prepareQuarantineSpawn creates session and returns params", () => {
			const result = prepareQuarantineSpawn(sessionManager, {
				filePaths: ["/tmp/test-file.ts"],
				instructions: "Review this file",
			});

			expect(result).toHaveProperty("agentId");
			expect(result).toHaveProperty("sessionId");
			expect(result).toHaveProperty("metadata");
			expect(result).toHaveProperty("typedReferences");
			expect(result).toHaveProperty("systemPrompt");
			expect(result).toHaveProperty("userPrompt");
			expect(result).toHaveProperty("timeoutMs");
			expect(result).toHaveProperty("cleanup");
			expect(typeof result.cleanup).toBe("function");

			result.cleanup();
		});

		it("prepareQuarantineSpawn generates unique agentId (UUID)", () => {
			const result1 = prepareQuarantineSpawn(sessionManager, {
				filePaths: ["/tmp/test1.ts"],
			});
			const result2 = prepareQuarantineSpawn(sessionManager, {
				filePaths: ["/tmp/test2.ts"],
			});

			expect(result1.agentId).not.toBe(result2.agentId);
			expect(result1.agentId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);

			result1.cleanup();
			result2.cleanup();
		});

		it("prepareQuarantineSpawn creates TypedReferences for all files", () => {
			const filePaths = [
				"/tmp/file1.ts",
				"/tmp/file2.ts",
				"/tmp/file3.ts",
			];
			const result = prepareQuarantineSpawn(sessionManager, {
				filePaths,
			});

			expect(result.typedReferences).toHaveLength(3);
			result.typedReferences.forEach((ref, idx) => {
				expect(ref).toHaveProperty("reference");
				expect(ref).toHaveProperty("uri");
				expect(ref).toHaveProperty("originalPath");
				expect(ref.uri).toContain("typed://");
				expect(ref.originalPath).toBe(filePaths[idx]);
			});

			result.cleanup();
		});

		it("prepareQuarantineSpawn sets isQuarantine true in metadata", () => {
			const result = prepareQuarantineSpawn(sessionManager, {
				filePaths: ["/tmp/test.ts"],
			});

			expect(result.metadata.isQuarantine).toBe(true);
			expect(result.metadata.agentId).toBe(result.agentId);
			expect(result.metadata.sessionId).toBe(result.sessionId);

			const session = sessionManager.getSession(result.sessionId);
			expect(session).toBeDefined();
			expect(session?.isQuarantine).toBe(true);

			result.cleanup();
		});

		it("prepareQuarantineSpawn.cleanup destroys session keys", () => {
			const result = prepareQuarantineSpawn(sessionManager, {
				filePaths: ["/tmp/test.ts"],
			});

			expect(
				sessionManager.getSession(result.sessionId),
			).toBeDefined();

			result.cleanup();

			expect(
				sessionManager.getSession(result.sessionId),
			).toBeUndefined();
		});

		it("prepareQuarantineSpawn.cleanup is idempotent", () => {
			const result = prepareQuarantineSpawn(sessionManager, {
				filePaths: ["/tmp/test.ts"],
			});

			result.cleanup();
			result.cleanup();
			result.cleanup();

			expect(
				sessionManager.getSession(result.sessionId),
			).toBeUndefined();
		});

		it("canSpawnQuarantine returns allowed when under limit", () => {
			const result = canSpawnQuarantine(sessionManager);
			expect(result.allowed).toBe(true);
			expect(result.currentCount).toBe(0);
			expect(result.maxCount).toBe(
				DEFAULT_QUARANTINE_CONFIG.maxConcurrentQuarantineAgents,
			);
		});

		it("canSpawnQuarantine returns denied at max concurrent", () => {
			const maxCount =
				DEFAULT_QUARANTINE_CONFIG.maxConcurrentQuarantineAgents;

			for (let i = 0; i < maxCount; i++) {
				sessionManager.createSession(`agent-${i}`, true);
			}

			const result = canSpawnQuarantine(sessionManager);
			expect(result.allowed).toBe(false);
			expect(result.currentCount).toBe(maxCount);
			expect(result.reason).toBeTruthy();
		});

		it("prepareQuarantineSpawn throws when filePaths is empty", () => {
			expect(() => {
				prepareQuarantineSpawn(sessionManager, { filePaths: [] });
			}).toThrow("filePaths array is empty");
		});

		it("createFileReferences returns correct number of references", () => {
			const session = sessionManager.createSession("test-agent", true);
			const filePaths = ["/tmp/a.ts", "/tmp/b.ts", "/tmp/c.ts"];

			const refs = createFileReferences(
				filePaths,
				session.sessionId,
				session.hmacKey,
			);

			expect(refs).toHaveLength(3);
			refs.forEach((ref, idx) => {
				expect(ref.originalPath).toBe(filePaths[idx]);
				expect(ref.reference.hmac).toHaveLength(64);
				expect(ref.uri).toContain("typed://");
			});

			sessionManager.destroySession(session.sessionId);
		});
	});

	// =====================================================================
	// Response Parsing (ISC #22)
	// =====================================================================

	describe("Response Parsing (ISC #22)", () => {
		const validResponse = JSON.stringify({
			findings: [
				{
					type: "security_issue",
					severity: "high",
					description: "SQL injection in query builder",
					location: { file: "src/db.ts", line: 42 },
					remediation: "Use parameterized queries",
				},
			],
			riskLevel: "high",
			recommendedActions: ["Block merge until fixed"],
			metadata: {
				agentId: "550e8400-e29b-41d4-a716-446655440000",
				executionTime: 5000,
				toolCallCount: 3,
				model: "claude-sonnet-4",
			},
		});

		it("parseQuarantineResponse parses valid JSON directly", () => {
			const result = parseQuarantineResponse(validResponse);
			expect(result.success).toBe(true);
			expect(result.parseAttempt).toBe("direct");
			expect(result.data?.findings).toHaveLength(1);
			expect(result.data?.riskLevel).toBe("high");
		});

		it("parseQuarantineResponse extracts JSON from markdown", () => {
			const wrapped = `Here is my analysis:\n\`\`\`json\n${validResponse}\n\`\`\``;
			const result = parseQuarantineResponse(wrapped);
			expect(result.success).toBe(true);
			expect(result.parseAttempt).toBe("json_extract");
		});

		it("parseQuarantineResponse fails on invalid JSON", () => {
			const result = parseQuarantineResponse("this is not json at all");
			expect(result.success).toBe(false);
			expect(result.errors).toBeDefined();
			expect(result.errors!.length).toBeGreaterThan(0);
		});

		it("parseQuarantineResponse returns schema errors for wrong shape", () => {
			const wrongShape = JSON.stringify({ findings: "not an array" });
			const result = parseQuarantineResponse(wrongShape);
			expect(result.success).toBe(false);
			expect(result.errors).toBeDefined();
		});

		it("extractJsonFromText strips markdown fences", () => {
			const text = '```json\n{"key": "value"}\n```';
			const extracted = extractJsonFromText(text);
			expect(extracted).toContain('"key"');
			expect(extracted).not.toContain("```");
		});

		it("extractJsonFromText returns null for non-JSON text", () => {
			const result = extractJsonFromText(
				"just some plain text without braces",
			);
			expect(result).toBeNull();
		});

		it("attemptPartialParse extracts riskLevel from malformed JSON", () => {
			const partial = '... "riskLevel": "critical" ... }';
			const result = attemptPartialParse(partial);
			expect(result).not.toBeNull();
			expect(result?.riskLevel).toBe("critical");
		});

		it("attemptPartialParse returns null for completely unrecoverable", () => {
			const result = attemptPartialParse("nothing here");
			expect(result).toBeNull();
		});

		it("validateResponse validates a correct object", () => {
			const obj = JSON.parse(validResponse);
			const result = validateResponse(obj);
			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
		});

		it("validateResponse rejects invalid objects", () => {
			const result = validateResponse({ findings: "not-array" });
			expect(result.success).toBe(false);
			expect(result.errors).toBeDefined();
		});
	});

	// =====================================================================
	// Cleanup and Session Management
	// =====================================================================

	describe("Cleanup and Session Management", () => {
		it("createCleanupFn destroys the correct session", () => {
			const session = sessionManager.createSession("test-agent", true);
			const cleanup = createCleanupFn(
				sessionManager,
				session.sessionId,
			);

			expect(
				sessionManager.getSession(session.sessionId),
			).toBeDefined();
			cleanup();
			expect(
				sessionManager.getSession(session.sessionId),
			).toBeUndefined();
		});

		it("multiple spawns create independent sessions", () => {
			const result1 = prepareQuarantineSpawn(sessionManager, {
				filePaths: ["/tmp/file1.ts"],
			});
			const result2 = prepareQuarantineSpawn(sessionManager, {
				filePaths: ["/tmp/file2.ts"],
			});

			expect(result1.sessionId).not.toBe(result2.sessionId);
			expect(
				sessionManager.getSession(result1.sessionId),
			).toBeDefined();
			expect(
				sessionManager.getSession(result2.sessionId),
			).toBeDefined();

			result1.cleanup();
			expect(
				sessionManager.getSession(result1.sessionId),
			).toBeUndefined();
			expect(
				sessionManager.getSession(result2.sessionId),
			).toBeDefined();

			result2.cleanup();
		});
	});
});
