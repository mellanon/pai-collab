/**
 * Quarantine Agent Response Parser
 *
 * Parse and validate quarantine agent output. Handles valid JSON, invalid JSON,
 * partial responses, and malformed schema. Returns structured results with
 * validation errors for retry.
 *
 * @module quarantine/response-parser
 */

import type { QuarantineAgentResponse } from "../lib/types.js";
import { QuarantineAgentResponseSchema } from "../lib/types.js";

/**
 * Result type for parsing attempts.
 *
 * @property success - Whether parsing and validation succeeded
 * @property data - Validated QuarantineAgentResponse if successful
 * @property errors - Human-readable error messages if failed
 * @property rawInput - Original raw input string
 * @property parseAttempt - Which strategy produced this result
 */
export interface ParseResult {
	success: boolean;
	data?: QuarantineAgentResponse;
	errors?: string[];
	rawInput: string;
	parseAttempt: "direct" | "json_extract" | "partial";
}

/**
 * Main parser function for quarantine agent responses.
 * Attempts multiple parsing strategies in order of preference:
 *
 * 1. Direct JSON.parse() → Zod validation
 * 2. Extract JSON from markdown/text → parse → validate
 * 3. Partial field extraction from malformed output
 *
 * @param raw - Raw string output from quarantine agent
 * @returns ParseResult with success status, data, and any errors
 *
 * @example
 * ```typescript
 * const result = parseQuarantineResponse('{"findings": [], ...}');
 * if (result.success) {
 *   console.log(result.data.riskLevel);
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export function parseQuarantineResponse(raw: string): ParseResult {
	// Strategy 1: Direct JSON parse + validate
	try {
		const parsed = JSON.parse(raw);
		const validation = QuarantineAgentResponseSchema.safeParse(parsed);

		if (validation.success) {
			return {
				success: true,
				data: validation.data,
				rawInput: raw,
				parseAttempt: "direct",
			};
		}

		// Valid JSON but failed schema validation
		return {
			success: false,
			errors: formatZodErrors(validation.error),
			rawInput: raw,
			parseAttempt: "direct",
		};
	} catch (_directError) {
		// Not valid JSON, continue to next strategy
	}

	// Strategy 2: Extract JSON from text (handle markdown code blocks, etc.)
	const extracted = extractJsonFromText(raw);
	if (extracted) {
		try {
			const parsed = JSON.parse(extracted);
			const validation = QuarantineAgentResponseSchema.safeParse(parsed);

			if (validation.success) {
				return {
					success: true,
					data: validation.data,
					rawInput: raw,
					parseAttempt: "json_extract",
				};
			}

			// Valid JSON but failed schema validation
			return {
				success: false,
				errors: formatZodErrors(validation.error),
				rawInput: raw,
				parseAttempt: "json_extract",
			};
		} catch (_extractError) {
			// Continue to partial parse
		}
	}

	// Strategy 3: Attempt partial parsing for recovery
	const partial = attemptPartialParse(raw);
	if (partial) {
		const validation = QuarantineAgentResponseSchema.safeParse(partial);

		if (validation.success) {
			return {
				success: true,
				data: validation.data,
				rawInput: raw,
				parseAttempt: "partial",
			};
		}

		return {
			success: false,
			errors: [
				"Partial parsing recovered some data but validation failed",
				...formatZodErrors(validation.error),
			],
			rawInput: raw,
			parseAttempt: "partial",
		};
	}

	// All strategies failed
	return {
		success: false,
		errors: [
			"Failed to parse response using all strategies",
			"Response is not valid JSON",
			"Could not extract JSON from text",
			"Partial parsing recovered no data",
		],
		rawInput: raw,
		parseAttempt: "partial",
	};
}

/**
 * Extract JSON from text that may contain markdown code blocks or surrounding text.
 *
 * Handles:
 * - ```json ... ``` code blocks
 * - ``` ... ``` code blocks without language hint
 * - JSON embedded in prose text
 *
 * @param text - Text potentially containing JSON
 * @returns Extracted JSON string or null if not found
 *
 * @example
 * ```typescript
 * extractJsonFromText('Here is the result: ```json\n{"key": "value"}\n```');
 * // Returns: '{"key": "value"}'
 * ```
 */
export function extractJsonFromText(text: string): string | null {
	// Strip markdown code block fences
	const cleaned = text.replace(/```(?:json|typescript|ts)?\n?/g, "");

	// Find first { and last } to extract JSON object
	const firstBrace = cleaned.indexOf("{");
	const lastBrace = cleaned.lastIndexOf("}");

	if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
		return null;
	}

	const extracted = cleaned.substring(firstBrace, lastBrace + 1);

	// Basic sanity check: must contain at least one key-value pair
	if (!extracted.includes(":")) {
		return null;
	}

	return extracted;
}

/**
 * Attempt partial parsing — extract recoverable fields from malformed responses.
 * Uses regex patterns to find individual JSON structures.
 *
 * @param raw - Raw malformed response
 * @returns Partial QuarantineAgentResponse with recoverable fields, or null
 *
 * @example
 * ```typescript
 * const partial = attemptPartialParse('... "riskLevel": "high" ...');
 * // Returns: { riskLevel: "high" }
 * ```
 */
export function attemptPartialParse(
	raw: string,
): Partial<QuarantineAgentResponse> | null {
	const result: Partial<QuarantineAgentResponse> = {};
	let foundAny = false;

	// Try to extract findings array
	const findingsMatch = raw.match(
		/"findings"\s*:\s*(\[[\s\S]*?\](?=\s*[,}]))/,
	);
	if (findingsMatch) {
		try {
			const findings = JSON.parse(findingsMatch[1]);
			if (Array.isArray(findings)) {
				result.findings = findings;
				foundAny = true;
			}
		} catch {
			// Ignore parse errors
		}
	}

	// Try to extract riskLevel
	const riskLevelMatch = raw.match(
		/"riskLevel"\s*:\s*"(low|medium|high|critical)"/,
	);
	if (riskLevelMatch) {
		result.riskLevel = riskLevelMatch[1] as
			| "low"
			| "medium"
			| "high"
			| "critical";
		foundAny = true;
	}

	// Try to extract recommendedActions array
	const actionsMatch = raw.match(
		/"recommendedActions"\s*:\s*(\[[\s\S]*?\](?=\s*[,}]))/,
	);
	if (actionsMatch) {
		try {
			const actions = JSON.parse(actionsMatch[1]);
			if (Array.isArray(actions)) {
				result.recommendedActions = actions;
				foundAny = true;
			}
		} catch {
			// Ignore parse errors
		}
	}

	// Try to extract metadata object
	const metadataMatch = raw.match(
		/"metadata"\s*:\s*(\{[\s\S]*?\}(?=\s*[,}]))/,
	);
	if (metadataMatch) {
		try {
			const metadata = JSON.parse(metadataMatch[1]);
			if (typeof metadata === "object" && metadata !== null) {
				result.metadata =
					metadata as QuarantineAgentResponse["metadata"];
				foundAny = true;
			}
		} catch {
			// Ignore parse errors
		}
	}

	return foundAny ? result : null;
}

/**
 * Validate a pre-parsed object against the QuarantineAgentResponse schema.
 *
 * @param obj - Object to validate
 * @returns ParseResult with validation status and errors
 *
 * @example
 * ```typescript
 * const result = validateResponse({ findings: [], riskLevel: "low", ... });
 * if (result.success) { ... }
 * ```
 */
export function validateResponse(obj: unknown): ParseResult {
	const rawInput =
		typeof obj === "string" ? obj : JSON.stringify(obj ?? null);
	const validation = QuarantineAgentResponseSchema.safeParse(obj);

	if (validation.success) {
		return {
			success: true,
			data: validation.data,
			rawInput,
			parseAttempt: "direct",
		};
	}

	return {
		success: false,
		errors: formatZodErrors(validation.error),
		rawInput,
		parseAttempt: "direct",
	};
}

/**
 * Format Zod validation errors into human-readable strings.
 *
 * @param error - Zod error object
 * @returns Array of formatted error messages
 */
function formatZodErrors(error: {
	issues: Array<{ path: Array<string | number>; message: string }>;
}): string[] {
	return error.issues.map((issue) => {
		const path = issue.path.length > 0 ? issue.path.join(".") : "root";
		return `${path}: ${issue.message}`;
	});
}
