import path from "node:path";
import type { TypedReference, HMACVerificationResult } from "./types.js";
import { createReferenceHMAC, verifyReferenceHMAC } from "./hmac-ops.js";

/**
 * Canonicalizes a file path to its absolute form.
 * Prevents path traversal by resolving to absolute path.
 *
 * @param filePath - The file path to canonicalize
 * @returns The absolute, normalized path
 * @throws {TypeError} If filePath is not a string
 */
export function canonicalizePath(filePath: string): string {
	if (typeof filePath !== "string") {
		throw new TypeError("filePath must be a string");
	}
	return path.resolve(filePath);
}

/**
 * Creates a TypedReference for a file path.
 * Generates an HMAC signature binding the path to the current session.
 *
 * @param filePath - The file path to reference
 * @param sessionId - The current session identifier
 * @param hmacKey - The HMAC key for signing
 * @returns A TypedReference object with path, hmac, timestamp, and sessionId
 * @throws {TypeError} If parameters are invalid
 * @throws {Error} If canonical path is not absolute
 */
export function createTypedReference(
	filePath: string,
	sessionId: string,
	hmacKey: Buffer,
): TypedReference {
	if (typeof filePath !== "string") {
		throw new TypeError("filePath must be a string");
	}
	if (typeof sessionId !== "string") {
		throw new TypeError("sessionId must be a string");
	}
	if (!Buffer.isBuffer(hmacKey)) {
		throw new TypeError("hmacKey must be a Buffer");
	}

	// Canonicalize path to prevent traversal attacks
	const canonicalPath = canonicalizePath(filePath);

	// Verify path is absolute (additional safety check)
	if (!path.isAbsolute(canonicalPath)) {
		throw new Error(`Canonical path must be absolute: ${canonicalPath}`);
	}

	// Get current timestamp (Unix seconds)
	const timestamp = Math.floor(Date.now() / 1000);

	// Generate HMAC signature
	const hmac = createReferenceHMAC(
		canonicalPath,
		timestamp,
		sessionId,
		hmacKey,
	);

	return {
		path: canonicalPath,
		hmac,
		timestamp,
		sessionId,
	};
}

/**
 * Verifies a TypedReference against the current session and HMAC key.
 * Checks session ID, expiry (TTL), and HMAC signature.
 *
 * @param reference - The TypedReference to verify
 * @param currentSessionId - The current session identifier
 * @param hmacKey - The HMAC key for verification
 * @param ttl - Time-to-live in seconds (default: 3600)
 * @returns HMACVerificationResult with valid flag and optional error details
 * @throws {TypeError} If parameters are invalid
 */
export function verifyTypedReference(
	reference: TypedReference,
	currentSessionId: string,
	hmacKey: Buffer,
	ttl = 3600,
): HMACVerificationResult {
	if (!reference || typeof reference !== "object") {
		throw new TypeError("reference must be a TypedReference object");
	}
	if (typeof currentSessionId !== "string") {
		throw new TypeError("currentSessionId must be a string");
	}
	if (!Buffer.isBuffer(hmacKey)) {
		throw new TypeError("hmacKey must be a Buffer");
	}
	if (typeof ttl !== "number" || ttl <= 0) {
		throw new TypeError("ttl must be a positive number");
	}

	// Check session ID match
	if (reference.sessionId !== currentSessionId) {
		return {
			valid: false,
			error: "session_mismatch",
			message: `Session mismatch: reference from session ${reference.sessionId}, current session ${currentSessionId}`,
		};
	}

	// Check expiry
	const now = Math.floor(Date.now() / 1000);
	const age = now - reference.timestamp;

	if (age > ttl) {
		return {
			valid: false,
			error: "expired",
			message: `Reference expired: age ${age}s exceeds TTL ${ttl}s`,
		};
	}

	// Verify HMAC signature
	const isValidHmac = verifyReferenceHMAC(
		reference.path,
		reference.timestamp,
		reference.sessionId,
		reference.hmac,
		hmacKey,
	);

	if (!isValidHmac) {
		return {
			valid: false,
			error: "invalid_hmac",
			message: "HMAC verification failed",
		};
	}

	return { valid: true };
}

/**
 * Serializes a TypedReference to a typed:// URI string.
 * Format: typed://<path>?hmac=<hex>&ts=<unix_timestamp>&sid=<session_id>
 *
 * @param ref - The TypedReference to serialize
 * @returns A typed:// URI string
 * @throws {TypeError} If ref is invalid
 */
export function serializeTypedReference(ref: TypedReference): string {
	if (!ref || typeof ref !== "object") {
		throw new TypeError("ref must be a TypedReference object");
	}
	if (typeof ref.path !== "string") {
		throw new TypeError("ref.path must be a string");
	}
	if (typeof ref.hmac !== "string") {
		throw new TypeError("ref.hmac must be a string");
	}
	if (typeof ref.timestamp !== "number") {
		throw new TypeError("ref.timestamp must be a number");
	}
	if (typeof ref.sessionId !== "string") {
		throw new TypeError("ref.sessionId must be a string");
	}

	// URL-encode the path for safety
	const encodedPath = encodeURIComponent(ref.path);

	// Build query string
	const params = new URLSearchParams({
		hmac: ref.hmac,
		ts: ref.timestamp.toString(),
		sid: ref.sessionId,
	});

	return `typed://${encodedPath}?${params.toString()}`;
}

/**
 * Parses a typed:// URI string into a TypedReference.
 * Expected format: typed://<path>?hmac=<hex>&ts=<unix_timestamp>&sid=<session_id>
 *
 * @param uri - The typed:// URI string to parse
 * @returns A TypedReference object
 * @throws {Error} If URI is malformed or missing required fields
 */
export function parseTypedReference(uri: string): TypedReference {
	if (typeof uri !== "string") {
		throw new TypeError("uri must be a string");
	}

	// Validate protocol
	if (!uri.startsWith("typed://")) {
		throw new Error(`Invalid protocol: URI must start with "typed://"`);
	}

	// Parse URI manually to handle custom protocol
	const protocolEnd = "typed://".length;
	const queryStart = uri.indexOf("?", protocolEnd);

	if (queryStart === -1) {
		throw new Error("Malformed URI: missing query string");
	}

	// Extract and decode path
	const encodedPath = uri.slice(protocolEnd, queryStart);
	const decodedPath = decodeURIComponent(encodedPath);

	// Extract query parameters
	const queryString = uri.slice(queryStart + 1);
	const params = new URLSearchParams(queryString);

	// Validate required parameters
	const hmac = params.get("hmac");
	const ts = params.get("ts");
	const sid = params.get("sid");

	if (!hmac) {
		throw new Error("Malformed URI: missing 'hmac' parameter");
	}
	if (!ts) {
		throw new Error("Malformed URI: missing 'ts' parameter");
	}
	if (!sid) {
		throw new Error("Malformed URI: missing 'sid' parameter");
	}

	// Parse timestamp
	const timestamp = Number.parseInt(ts, 10);
	if (Number.isNaN(timestamp)) {
		throw new Error(`Malformed URI: invalid timestamp "${ts}"`);
	}

	return {
		path: decodedPath,
		hmac,
		timestamp,
		sessionId: sid,
	};
}
