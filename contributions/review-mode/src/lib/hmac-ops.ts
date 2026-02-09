import crypto from "node:crypto";

/**
 * Generate a cryptographically secure random HMAC key.
 *
 * @param size - Key size in bytes (default: 32, minimum: 32)
 * @returns Buffer containing the random key
 * @throws {RangeError} If size is less than 32 bytes
 *
 * @example
 * const key = generateHMACKey(); // 32-byte key
 * const largerKey = generateHMACKey(64); // 64-byte key
 */
export function generateHMACKey(size = 32): Buffer {
	if (typeof size !== "number" || !Number.isInteger(size)) {
		throw new TypeError("Key size must be an integer");
	}

	if (size < 32) {
		throw new RangeError("Key size must be at least 32 bytes (256 bits)");
	}

	return crypto.randomBytes(size);
}

/**
 * Create an HMAC-SHA256 signature for arbitrary data.
 *
 * @param data - Data to sign (string)
 * @param key - HMAC key (Buffer)
 * @returns Hex-encoded HMAC signature (64 characters)
 * @throws {TypeError} If data is not a string or key is not a Buffer
 *
 * @example
 * const key = generateHMACKey();
 * const hmac = createHMAC("my data", key);
 * // Returns: "a3f2b8c4..." (64 hex chars)
 */
export function createHMAC(data: string, key: Buffer): string {
	if (typeof data !== "string") {
		throw new TypeError("Data must be a string");
	}

	if (!Buffer.isBuffer(key)) {
		throw new TypeError("Key must be a Buffer");
	}

	const hmac = crypto.createHmac("sha256", key);
	hmac.update(data);
	return hmac.digest("hex");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 *
 * This is the core timing-attack prevention primitive. Never use === for HMAC comparison.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 * @throws {TypeError} If either parameter is not a string
 *
 * @example
 * const equal = constantTimeEqual(hmac1, hmac2);
 */
export function constantTimeEqual(a: string, b: string): boolean {
	if (typeof a !== "string" || typeof b !== "string") {
		throw new TypeError("Both parameters must be strings");
	}

	// If lengths differ, comparison is safe to short-circuit
	// (length is not secret information)
	if (a.length !== b.length) {
		return false;
	}

	// Convert to buffers for constant-time comparison
	const bufferA = Buffer.from(a, "utf-8");
	const bufferB = Buffer.from(b, "utf-8");

	// timingSafeEqual requires equal-length buffers
	// We've already verified string lengths match, so this is safe
	return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Verify an HMAC-SHA256 signature using constant-time comparison.
 *
 * SECURITY: Uses crypto.timingSafeEqual() to prevent timing attacks.
 * NEVER use === to compare HMACs.
 *
 * @param data - Data that was signed
 * @param expectedHmac - Expected HMAC signature (hex-encoded)
 * @param key - HMAC key used for signing
 * @returns true if HMAC is valid, false otherwise
 * @throws {TypeError} If parameters are invalid types
 *
 * @example
 * const key = generateHMACKey();
 * const hmac = createHMAC("data", key);
 * const valid = verifyHMAC("data", hmac, key); // true
 * const invalid = verifyHMAC("different", hmac, key); // false
 */
export function verifyHMAC(
	data: string,
	expectedHmac: string,
	key: Buffer,
): boolean {
	if (typeof data !== "string") {
		throw new TypeError("Data must be a string");
	}

	if (typeof expectedHmac !== "string") {
		throw new TypeError("Expected HMAC must be a string");
	}

	if (!Buffer.isBuffer(key)) {
		throw new TypeError("Key must be a Buffer");
	}

	// Compute the actual HMAC
	const actualHmac = createHMAC(data, key);

	// Use constant-time comparison to prevent timing attacks
	return constantTimeEqual(actualHmac, expectedHmac);
}

/**
 * Create an HMAC signature specifically for TypedReference binding.
 *
 * This binds a file path to a specific session and timestamp, preventing
 * reference reuse across sessions or time periods.
 *
 * Format: HMAC(path|timestamp|sessionId)
 *
 * @param path - File path being referenced
 * @param timestamp - Unix timestamp (milliseconds)
 * @param sessionId - Session identifier
 * @param key - HMAC key
 * @returns Hex-encoded HMAC signature (64 characters)
 * @throws {TypeError} If parameters are invalid types
 *
 * @example
 * const key = generateHMACKey();
 * const hmac = createReferenceHMAC(
 *   "/path/to/file.ts",
 *   1704067200000,
 *   "session-123",
 *   key
 * );
 */
export function createReferenceHMAC(
	path: string,
	timestamp: number,
	sessionId: string,
	key: Buffer,
): string {
	if (typeof path !== "string") {
		throw new TypeError("Path must be a string");
	}

	if (typeof timestamp !== "number" || !Number.isInteger(timestamp)) {
		throw new TypeError("Timestamp must be an integer");
	}

	if (typeof sessionId !== "string") {
		throw new TypeError("Session ID must be a string");
	}

	if (!Buffer.isBuffer(key)) {
		throw new TypeError("Key must be a Buffer");
	}

	// Concatenate components with pipe separator
	const data = `${path}|${timestamp}|${sessionId}`;

	return createHMAC(data, key);
}

/**
 * Verify a TypedReference HMAC signature using constant-time comparison.
 *
 * Recomputes the HMAC from components and compares with the expected value
 * using constant-time comparison to prevent timing attacks.
 *
 * @param path - File path being verified
 * @param timestamp - Unix timestamp (milliseconds)
 * @param sessionId - Session identifier
 * @param expectedHmac - Expected HMAC signature (hex-encoded)
 * @param key - HMAC key
 * @returns true if HMAC is valid, false otherwise
 * @throws {TypeError} If parameters are invalid types
 *
 * @example
 * const key = generateHMACKey();
 * const hmac = createReferenceHMAC("/path/to/file.ts", 1704067200000, "session-123", key);
 * const valid = verifyReferenceHMAC(
 *   "/path/to/file.ts",
 *   1704067200000,
 *   "session-123",
 *   hmac,
 *   key
 * ); // true
 */
export function verifyReferenceHMAC(
	path: string,
	timestamp: number,
	sessionId: string,
	expectedHmac: string,
	key: Buffer,
): boolean {
	if (typeof path !== "string") {
		throw new TypeError("Path must be a string");
	}

	if (typeof timestamp !== "number" || !Number.isInteger(timestamp)) {
		throw new TypeError("Timestamp must be an integer");
	}

	if (typeof sessionId !== "string") {
		throw new TypeError("Session ID must be a string");
	}

	if (typeof expectedHmac !== "string") {
		throw new TypeError("Expected HMAC must be a string");
	}

	if (!Buffer.isBuffer(key)) {
		throw new TypeError("Key must be a Buffer");
	}

	// Recompute the HMAC from components
	const actualHmac = createReferenceHMAC(path, timestamp, sessionId, key);

	// Use constant-time comparison to prevent timing attacks
	return constantTimeEqual(actualHmac, expectedHmac);
}
