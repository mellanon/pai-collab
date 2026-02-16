/**
 * Security Event Logger
 *
 * Handles security event audit logging with async, non-blocking writes to JSONL files.
 * Events are buffered and periodically flushed to disk. Logging failures are swallowed
 * to ensure they never crash the system.
 *
 * @module security-logger
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import type { SecurityEvent, SecurityEventType } from "../lib/types.js";

/**
 * Redacts sensitive values from tool arguments before logging.
 *
 * Replaces passwords, API keys, tokens, secrets, and long file contents
 * with redacted placeholders to prevent credential leakage in logs.
 *
 * @param args - Tool arguments to redact
 * @returns New object with sensitive values redacted
 *
 * @example
 * ```typescript
 * const args = { password: "secret123", name: "user" };
 * const redacted = redactSensitiveArgs(args);
 * // { password: "[REDACTED]", name: "user" }
 * ```
 */
export function redactSensitiveArgs(
	args: Record<string, unknown>,
): Record<string, unknown> {
	const redacted: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(args)) {
		const lowerKey = key.toLowerCase();

		// Check for sensitive key patterns
		if (
			lowerKey.includes("password") ||
			lowerKey.includes("secret") ||
			lowerKey.includes("token") ||
			lowerKey.includes("apikey") ||
			lowerKey.includes("api_key") ||
			lowerKey.includes("credential")
		) {
			redacted[key] = "[REDACTED]";
			continue;
		}

		// Handle string values
		if (typeof value === "string") {
			// Redact long content (likely file contents)
			if (value.length > 100) {
				redacted[key] = `[REDACTED: ${value.length} chars]`;
			} else {
				redacted[key] = value;
			}
		}
		// Handle nested objects recursively
		else if (value && typeof value === "object" && !Array.isArray(value)) {
			redacted[key] = redactSensitiveArgs(value as Record<string, unknown>);
		}
		// Handle arrays (check each element)
		else if (Array.isArray(value)) {
			redacted[key] = value.map((item) =>
				item && typeof item === "object" && !Array.isArray(item)
					? redactSensitiveArgs(item as Record<string, unknown>)
					: item,
			);
		}
		// Pass through primitives
		else {
			redacted[key] = value;
		}
	}

	return redacted;
}

/**
 * Security event logger with buffered, async writes to JSONL audit logs.
 *
 * Events are buffered in memory and periodically flushed to disk. The logger
 * is fail-safe: all errors are caught and swallowed to prevent logging from
 * crashing the application.
 *
 * @example
 * ```typescript
 * const logger = new SecurityLogger("audit.jsonl", { flushInterval: 2000 });
 * logger.startAutoFlush();
 *
 * logger.logToolBlocked("agent-123", "session-456", "exec", "Blocked by policy");
 * logger.logHmacFailure("agent-123", "session-456", "write");
 *
 * await logger.stopAutoFlush(); // Flush remaining events before exit
 * ```
 */
export class SecurityLogger {
	private logPath: string;
	private buffer: SecurityEvent[] = [];
	private flushInterval: number;
	private maxBufferSize: number;
	private flushTimer: ReturnType<typeof setInterval> | null = null;
	private totalEventCount = 0;

	/**
	 * Creates a new security logger instance.
	 *
	 * @param logPath - Path to JSONL audit log file (default: "review-mode-audit.jsonl")
	 * @param options - Configuration options
	 * @param options.flushInterval - Milliseconds between automatic flushes (default: 1000)
	 * @param options.maxBufferSize - Max events before forced flush (default: 100)
	 */
	constructor(
		logPath = "review-mode-audit.jsonl",
		options: { flushInterval?: number; maxBufferSize?: number } = {},
	) {
		this.logPath = logPath;
		this.flushInterval = options.flushInterval ?? 1000;
		this.maxBufferSize = options.maxBufferSize ?? 100;
	}

	/**
	 * Logs a security event to the buffer.
	 *
	 * Adds a UUID and timestamp to the event, buffers it, and triggers a flush
	 * if the buffer is full. This method is synchronous and never throws.
	 *
	 * @param event - Event to log (without id/timestamp)
	 * @returns Complete security event with id and timestamp
	 */
	log(event: Omit<SecurityEvent, "id" | "timestamp">): SecurityEvent {
		const completeEvent: SecurityEvent = {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			...event,
		};

		this.buffer.push(completeEvent);
		this.totalEventCount++;

		// Trigger flush if buffer is full
		if (this.buffer.length >= this.maxBufferSize) {
			this.flush().catch(() => {
				// Errors are swallowed - logging must not crash the system
			});
		}

		return completeEvent;
	}

	/**
	 * Logs a tool blocked event.
	 *
	 * @param agentId - ID of the agent that attempted the tool call
	 * @param sessionId - Session ID
	 * @param tool - Tool that was blocked
	 * @param reason - Reason for blocking
	 * @returns The logged security event
	 */
	logToolBlocked(
		agentId: string,
		sessionId: string,
		tool: string,
		reason: string,
	): SecurityEvent {
		return this.log({
			type: "TOOL_BLOCKED",
			agentId,
			sessionId,
			tool,
			severity: "high",
			message: `Tool "${tool}" blocked: ${reason}`,
			context: { reason },
		});
	}

	/**
	 * Logs an HMAC verification failure.
	 *
	 * @param agentId - ID of the agent with invalid HMAC
	 * @param sessionId - Session ID
	 * @param tool - Tool that failed verification
	 * @returns The logged security event
	 */
	logHmacFailure(
		agentId: string,
		sessionId: string,
		tool: string,
	): SecurityEvent {
		return this.log({
			type: "HMAC_VERIFICATION_FAILED",
			agentId,
			sessionId,
			tool,
			severity: "critical",
			message: `HMAC verification failed for tool "${tool}"`,
		});
	}

	/**
	 * Logs a rate limit exceeded event.
	 *
	 * @param agentId - ID of the agent that exceeded rate limit
	 * @param sessionId - Session ID
	 * @param tool - Tool that exceeded rate limit
	 * @param callCount - Number of calls made
	 * @returns The logged security event
	 */
	logRateLimitExceeded(
		agentId: string,
		sessionId: string,
		tool: string,
		callCount: number,
	): SecurityEvent {
		return this.log({
			type: "RATE_LIMIT_EXCEEDED",
			agentId,
			sessionId,
			tool,
			severity: "high",
			message: `Rate limit exceeded for tool "${tool}": ${callCount} calls`,
			context: { callCount },
		});
	}

	/**
	 * Logs a quarantine agent spawn event.
	 *
	 * @param agentId - ID of the quarantine agent
	 * @param sessionId - Session ID
	 * @returns The logged security event
	 */
	logQuarantineSpawn(agentId: string, sessionId: string): SecurityEvent {
		return this.log({
			type: "QUARANTINE_AGENT_SPAWN",
			agentId,
			sessionId,
			severity: "low",
			message: `Quarantine agent spawned: ${agentId}`,
		});
	}

	/**
	 * Logs a quarantine agent exit event.
	 *
	 * @param agentId - ID of the quarantine agent
	 * @param sessionId - Session ID
	 * @param reason - Reason for exit (e.g., "normal", "timeout", "error")
	 * @returns The logged security event
	 */
	logQuarantineExit(
		agentId: string,
		sessionId: string,
		reason: string,
	): SecurityEvent {
		return this.log({
			type: "QUARANTINE_AGENT_EXIT",
			agentId,
			sessionId,
			severity: "low",
			message: `Quarantine agent exited: ${agentId} (${reason})`,
			context: { reason },
		});
	}

	/**
	 * Flushes all buffered events to the JSONL audit log.
	 *
	 * Each event is written as a single JSON line. This method is async and
	 * catches all errors to prevent logging from crashing the application.
	 *
	 * @returns Promise that resolves when flush is complete
	 */
	async flush(): Promise<void> {
		if (this.buffer.length === 0) {
			return;
		}

		const eventsToWrite = [...this.buffer];
		this.buffer = [];

		try {
			// Convert events to JSONL format (one JSON object per line)
			const jsonl = eventsToWrite.map((event) => JSON.stringify(event)).join("\n") + "\n";

			// Append to log file
			await fs.appendFile(this.logPath, jsonl, "utf-8");
		} catch (error) {
			// Swallow errors - logging must not crash the system
			// In production, this could be logged to a fallback mechanism
			// (e.g., stderr, system log, monitoring service)
		}
	}

	/**
	 * Starts automatic periodic flushing.
	 *
	 * Flushes buffered events every `flushInterval` milliseconds.
	 */
	startAutoFlush(): void {
		if (this.flushTimer !== null) {
			return; // Already running
		}

		this.flushTimer = setInterval(() => {
			this.flush().catch(() => {
				// Errors are swallowed
			});
		}, this.flushInterval);
	}

	/**
	 * Stops automatic flushing and flushes remaining events.
	 *
	 * Should be called before application exit to ensure all events are written.
	 *
	 * @returns Promise that resolves when final flush is complete
	 */
	async stopAutoFlush(): Promise<void> {
		if (this.flushTimer !== null) {
			clearInterval(this.flushTimer);
			this.flushTimer = null;
		}

		// Flush any remaining buffered events
		await this.flush();
	}

	/**
	 * Returns a copy of currently buffered events.
	 *
	 * Useful for testing and debugging.
	 *
	 * @returns Copy of buffered events
	 */
	getBufferedEvents(): SecurityEvent[] {
		return [...this.buffer];
	}

	/**
	 * Returns the total number of events logged.
	 *
	 * This includes both buffered and flushed events.
	 *
	 * @returns Total event count
	 */
	getEventCount(): number {
		return this.totalEventCount;
	}
}
