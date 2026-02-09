# Review Mode — Platform-Agnostic Security Review for AI Coding Agents

## Overview

Review Mode is a **platform-agnostic security framework** for AI coding agents that process untrusted code contributions (pull requests, external repositories, user-submitted code). It implements **True Dual-Context isolation** to prevent prompt injection attacks and unauthorized system access when analyzing potentially malicious code.

Built as a response to identified security gaps in the CaMeL framework (Constrained Agent Markup Language), Review Mode provides production-ready security boundaries through HMAC-secured content references, hook-enforced tool restrictions, and isolated quarantine agents.

**Key principle:** The main agent (trusted) **NEVER sees** raw untrusted content. Instead, it spawns quarantine agents via TypedReferences (HMAC-SHA256 signed URIs) that operate in a strict sandbox with allowlist-enforced tool access (Read, Grep, Glob only).

## Quick Start

### Installation

```bash
# Clone the pai-collab repository
git clone https://github.com/mellanon/pai-collab.git
cd pai-collab/contributions/review-mode

# Install dependencies
bun install

# Run tests to verify installation
bun test
```

### Basic Usage

```typescript
import { SessionManager } from './src/lib/session-manager.js';
import { TypedReference } from './src/lib/typed-reference.js';
import { buildQuarantinePrompt, buildUserContentPrompt } from './src/quarantine/spawn-template.js';

// 1. Create a session manager with HMAC key
const sessionManager = new SessionManager();
const session = sessionManager.createSession();

// 2. Create TypedReferences for untrusted files
const typedRef = TypedReference.create(
  '/path/to/untrusted/pr/auth.ts',
  session.hmacKey,
  session.sessionId
);

const uri = TypedReference.toURI(typedRef);
// → typed://%2Fpath%2Fto%2Funtrusted%2Fpr%2Fauth.ts?hmac=a1b2...&ts=1704067200&sid=550e8400...

// 3. Spawn quarantine agent (via Task tool)
const systemPrompt = buildQuarantinePrompt();
const userPrompt = buildUserContentPrompt([
  { reference: typedRef, uri, description: 'Authentication module to review' }
]);

// Agent spawning happens through your platform's Task tool
// The review-mode hook will enforce tool restrictions
```

### Configuration

Create a configuration object to customize Review Mode behavior:

```typescript
import { DEFAULT_QUARANTINE_CONFIG } from './src/lib/types.js';

const config = {
  ...DEFAULT_QUARANTINE_CONFIG,
  typedReferenceTTL: 1800,        // 30 minutes
  toolRateLimitPerMinute: 50,      // Stricter rate limit
  quarantineAgentTimeout: 120000,  // 2 minute timeout
};
```

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN AGENT (Trusted)                     │
│  • Has access to all tools                                       │
│  • NEVER sees untrusted content directly                         │
│  • Creates HMAC-signed TypedReferences                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Spawns via Task tool with TypedReferences
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              QUARANTINE AGENT (Untrusted Context)                │
│  • Only Read, Grep, Glob tools allowed (hook-enforced)          │
│  • Can ONLY access files via HMAC-verified TypedReferences      │
│  • Hook blocks: Bash, Write, Edit, Task, Skill, MCP, WebFetch   │
│  • Returns structured JSON findings                              │
└─────────────────────────────────────────────────────────────────┘
             │
             │ Returns structured review
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSE PARSER (Main Agent)                  │
│  • Validates JSON schema                                         │
│  • Sanitizes findings before presenting to user                 │
└─────────────────────────────────────────────────────────────────┘
```

## Core Concepts

### TypedReferences

TypedReferences are HMAC-SHA256 signed URIs that cryptographically prove a file was explicitly authorized for access by the trusted main agent. The quarantine agent cannot forge these references.

**URI Format:**
```
typed://<url_encoded_path>?hmac=<hex64>&ts=<unix_seconds>&sid=<uuid>
```

**Example:**
```
typed://%2Fsrc%2Fauth%2Flogin.ts?hmac=a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90&ts=1704067200&sid=550e8400-e29b-41d4-a716-446655440000
```

**Security Properties:**
- **Cryptographic integrity:** HMAC-SHA256 signature prevents forgery
- **Expiration:** TTL enforcement (default: 1 hour)
- **Session binding:** References tied to specific quarantine session
- **Path canonicalization:** Prevents `../` path traversal attacks

### Quarantine Agents

Quarantine agents are spawned via the `Task` tool with restricted capabilities. They operate in a **read-only sandbox** with no execution, modification, or network access.

**What they CAN do:**
- Read files via TypedReferences
- Search file contents (Grep)
- Pattern match filenames (Glob)
- Analyze code structure
- Return structured JSON findings

**What they CANNOT do:**
- Execute code (Bash blocked)
- Modify files (Write/Edit blocked)
- Spawn sub-agents (Task blocked)
- Access network (WebFetch blocked)
- Access business data (all MCP tools blocked)
- Invoke skills (Skill blocked)

### Hook Enforcement

The Review Mode hook (`src/hooks/review-mode-hook.ts`) runs on **every tool call** and enforces the quarantine security model. It uses platform adapters to support both OpenCode and Claude Code.

**Enforcement Actions:**
1. Check if agent is marked as quarantine
2. Lookup tool name in allowlist (Read, Grep, Glob)
3. If tool is forbidden → BLOCK via platform adapter
4. Log security event to audit log (JSONL)
5. Apply rate limiting (100 calls/minute per agent, 5 concurrent agents max)

**Platform Adapters:**
- **OpenCode:** Blocks via `throw Error("Tool blocked")`
- **Claude Code:** Blocks via `process.exit(2)`

## Configuration

Review Mode is configured via the `QuarantineConfig` interface:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable Review Mode |
| `allowedTools` | string[] | `["Read", "Grep", "Glob"]` | Tool allowlist for quarantine agents |
| `hmacKeySize` | number | `32` | HMAC key size in bytes (256 bits) |
| `typedReferenceTTL` | number | `3600` | Reference validity in seconds (1 hour) |
| `toolRateLimitPerMinute` | number | `100` | Max tool calls per minute per agent |
| `maxConcurrentQuarantineAgents` | number | `5` | Max simultaneous quarantine agents |
| `quarantineAgentTimeout` | number | `300000` | Agent execution timeout in ms (5 min) |
| `auditLogPath` | string | `"review-mode-audit.jsonl"` | Path to JSONL audit log |
| `auditDatabase` | object | `undefined` | Optional PostgreSQL connection for audit logs |

**Example:**

```typescript
import { QuarantineConfigSchema } from './src/lib/types.js';

const config = QuarantineConfigSchema.parse({
  enabled: true,
  allowedTools: ["Read", "Grep", "Glob"],
  typedReferenceTTL: 1800,         // 30 minutes
  toolRateLimitPerMinute: 50,
  quarantineAgentTimeout: 120000,  // 2 minutes
  auditLogPath: "./logs/review-mode-audit.jsonl",
});
```

## Platform Support

Review Mode is **platform-agnostic** through thin adapter layers. The core enforcement logic is shared across all platforms.

| Platform | Adapter | Blocking Mechanism | Hook Location |
|----------|---------|-------------------|---------------|
| **OpenCode** | `opencode-adapter.ts` | `throw Error()` | `hooks/PreToolUse` |
| **Claude Code** | `claude-code-adapter.ts` | `process.exit(2)` | `hooks/tool.execute.before` |

**Shared Logic:** 268+ lines of enforcement code in `review-mode-hook.ts` (tool allowlist, HMAC verification, rate limiting, audit logging)

**Platform-Specific:** ~30 lines per adapter (hook integration, blocking mechanism)

**Adding a new platform:** Create a new adapter in `src/hooks/adapters/` implementing the platform's hook interface and blocking mechanism.

## Testing

Review Mode includes comprehensive test coverage across unit, integration, and adversarial attack scenarios.

### Run All Tests

```bash
bun test
```

### Run Adversarial Attack Tests

```bash
bun test:adversarial
```

**Adversarial test coverage:**
- AS-001: Command execution via prompt injection
- AS-002: TypedReference forgery attempts
- AS-003: Context confusion (secret leakage)
- AS-004: Path traversal attacks
- AS-005: Replay attacks (stolen TypedReferences)
- AS-006: Denial of Service (rate limiting)
- AS-007: Privilege escalation (tool allowlist bypass)
- AS-008: MCP data exfiltration

### Run Performance Benchmarks

```bash
bun test:bench
```

**Performance targets:**
- HMAC sign/verify: <50ms per operation
- Hook enforcement: <10ms per tool call
- Quarantine agent spawn: <2s

### Test Coverage

```bash
bun test:coverage
```

**Coverage metrics:**
- Unit tests: 168+ tests
- Integration tests: 100+ tests
- Adversarial tests: 65+ tests
- **Total: 268+ tests**

## Contributing

Review Mode is part of the [pai-collab](https://github.com/mellanon/pai-collab) open-source project.

**Before contributing:**
1. Read `docs/ARCHITECTURE.md` for system design and ADRs
2. Review `docs/SECURITY.md` for threat model and attack scenarios
3. Run the full test suite including adversarial tests
4. Ensure performance benchmarks still pass

**Contribution areas:**
- Additional platform adapters (Cline, Aider, etc.)
- Extended adversarial test coverage
- Performance optimizations
- Documentation improvements

## License

MIT License - See [LICENSE](../LICENSE) for details.

---

**Security Disclosure:** If you discover a security vulnerability in Review Mode, please report it via GitHub Security Advisories on the [pai-collab repository](https://github.com/mellanon/pai-collab/security/advisories).
