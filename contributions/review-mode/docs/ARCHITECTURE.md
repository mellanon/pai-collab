# Architecture Specification

## System Architecture

Review Mode implements a **True Dual-Context isolation** architecture where trusted and untrusted execution contexts are physically separated through agent spawning, connected only by cryptographically verified TypedReferences.

### Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         REVIEW MODE SYSTEM                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    MAIN AGENT CONTEXT                         │     │
│  │                       (Trusted)                               │     │
│  ├──────────────────────────────────────────────────────────────┤     │
│  │                                                               │     │
│  │  SessionManager                                               │     │
│  │  ├─ createSession() → { sessionId, hmacKey }                 │     │
│  │  └─ getSession(sessionId) → Session                          │     │
│  │                                                               │     │
│  │  TypedReference                                               │     │
│  │  ├─ create(path, key, sessionId) → TypedReference            │     │
│  │  ├─ toURI(typedRef) → "typed://..."                          │     │
│  │  └─ verify(uri, key, sessionId) → HMACVerificationResult     │     │
│  │                                                               │     │
│  │  SpawnTemplate                                                │     │
│  │  ├─ buildQuarantinePrompt(config) → systemPrompt             │     │
│  │  └─ buildUserContentPrompt(files) → userPrompt               │     │
│  │                                                               │     │
│  └───────────────────────┬──────────────────────────────────────┘     │
│                          │                                             │
│                          │ Task tool with TypedReference URIs         │
│                          │                                             │
│  ┌───────────────────────▼──────────────────────────────────────┐     │
│  │              HOOK ENFORCEMENT LAYER                           │     │
│  │            (Platform-Agnostic Core)                           │     │
│  ├──────────────────────────────────────────────────────────────┤     │
│  │                                                               │     │
│  │  ReviewModeHook (review-mode-hook.ts)                        │     │
│  │  ├─ Intercept every tool call                                │     │
│  │  ├─ Check agent quarantine status                            │     │
│  │  ├─ Lookup tool in allowlist (Read, Grep, Glob)              │     │
│  │  ├─ Verify TypedReference HMAC if Read tool                  │     │
│  │  ├─ Apply rate limiting (100/min per agent, 5 concurrent)    │     │
│  │  └─ Log security events to audit log                         │     │
│  │                                                               │     │
│  │  ToolAllowlist (tool-allowlist.ts)                           │     │
│  │  ├─ QUARANTINE_ALLOWED_TOOLS = ["Read", "Grep", "Glob"]      │     │
│  │  ├─ QUARANTINE_DENIED_TOOLS = [23 tools with risk map]       │     │
│  │  └─ isToolAllowed(tool) → boolean                            │     │
│  │                                                               │     │
│  │  RateLimiter (rate-limiter.ts)                               │     │
│  │  ├─ Sliding window per-agent tracking                        │     │
│  │  ├─ Global concurrent agent limit                            │     │
│  │  └─ checkRateLimit(agentId) → { allowed, reason }            │     │
│  │                                                               │     │
│  │  SecurityLogger (security-logger.ts)                         │     │
│  │  ├─ Buffered JSONL writer (flush every 10 events)            │     │
│  │  ├─ Sensitive data redaction                                 │     │
│  │  └─ logSecurityEvent(event) → Promise<void>                  │     │
│  │                                                               │     │
│  └───────────────────────┬──────────────────────────────────────┘     │
│                          │                                             │
│                          │ Platform Adapters                           │
│                          │                                             │
│  ┌───────────────────────┴──────────────────────────────────────┐     │
│  │                 OpenCode Adapter                              │     │
│  │  • Hook: hooks/PreToolUse                                     │     │
│  │  • Block: throw Error("Tool blocked")                         │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                 Claude Code Adapter                              │     │
│  │  • Hook: hooks/tool.execute.before                            │     │
│  │  • Block: process.exit(2)                                     │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│                          │ If tool allowed, execution proceeds         │
│                          │                                             │
│  ┌───────────────────────▼──────────────────────────────────────┐     │
│  │              QUARANTINE AGENT CONTEXT                         │     │
│  │                    (Untrusted)                                │     │
│  ├──────────────────────────────────────────────────────────────┤     │
│  │                                                               │     │
│  │  • Receives system prompt with tool restrictions             │     │
│  │  • Receives TypedReference URIs for files to review          │     │
│  │  • Can ONLY use Read, Grep, Glob (hook enforced)             │     │
│  │  • Analyzes code for security/quality issues                 │     │
│  │  • Returns structured JSON findings                          │     │
│  │                                                               │     │
│  │  TimeoutManager                                               │     │
│  │  └─ Enforces 5 minute execution limit                        │     │
│  │                                                               │     │
│  └───────────────────────┬──────────────────────────────────────┘     │
│                          │                                             │
│                          │ Returns QuarantineAgentResponse (JSON)      │
│                          │                                             │
│  ┌───────────────────────▼──────────────────────────────────────┐     │
│  │                  RESPONSE PARSER                              │     │
│  │                   (Main Agent)                                │     │
│  ├──────────────────────────────────────────────────────────────┤     │
│  │                                                               │     │
│  │  ResponseParser (response-parser.ts)                         │     │
│  │  ├─ Validate JSON schema (Zod)                               │     │
│  │  ├─ Sanitize findings                                        │     │
│  │  └─ Present to user                                          │     │
│  │                                                               │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Step-by-step flow from untrusted content to verified review:**

```
1. User requests review of pull request files
   └─> Main Agent identifies untrusted content

2. Main Agent creates quarantine session
   └─> SessionManager.createSession()
       ├─ Generate unique sessionId (UUID v4)
       ├─ Generate HMAC key (32 bytes random)
       └─> Returns { sessionId, hmacKey, metadata }

3. Main Agent creates TypedReferences for each file
   └─> TypedReference.create(filePath, hmacKey, sessionId)
       ├─ Canonicalize path (path.resolve)
       ├─ Create HMACInput { path, timestamp, sessionId }
       ├─ Sign with HMAC-SHA256
       └─> Returns { path, hmac, timestamp, sessionId }

4. Main Agent converts TypedReferences to URIs
   └─> TypedReference.toURI(typedRef)
       └─> "typed://<encoded_path>?hmac=<hex64>&ts=<unix>&sid=<uuid>"

5. Main Agent builds quarantine prompts
   ├─> buildQuarantinePrompt(config)
   │   └─> System prompt with tool restrictions, output format
   └─> buildUserContentPrompt(files)
       └─> User prompt listing TypedReference URIs

6. Main Agent spawns quarantine agent
   └─> Task tool with systemPrompt + userPrompt
       └─> Creates new agent with quarantine flag set

7. Quarantine agent attempts tool call
   └─> Hook intercepts on tool.execute.before

8. Hook enforcement
   ├─> Check agent.isQuarantine → true
   ├─> Lookup tool in allowlist
   │   ├─ If "Read" → Verify TypedReference HMAC
   │   │   └─> TypedReference.fromURI(uri)
   │   │       └─> TypedReference.verify(ref, hmacKey, sessionId)
   │   │           ├─ Re-compute HMAC from path+timestamp+sessionId
   │   │           ├─ Compare with provided HMAC (timing-safe)
   │   │           ├─ Check expiration (timestamp + TTL)
   │   │           └─> { valid: true/false, error?, message? }
   │   ├─ If "Grep" or "Glob" → Allow (read-only, no path access)
   │   └─ If NOT in allowlist → BLOCK
   ├─> Apply rate limiting
   │   └─> rateLimiter.checkRateLimit(agentId)
   │       ├─ Sliding window: 100 calls/minute
   │       └─ Global: max 5 concurrent agents
   ├─> Log security event
   │   └─> securityLogger.logSecurityEvent(event)
   │       └─> Append to review-mode-audit.jsonl
   └─> If allowed → proceed, else → block via adapter
       ├─ OpenCode: throw Error("Tool blocked: <reason>")
       └─ Claude Code: process.exit(2)

9. Quarantine agent completes review
   └─> Returns structured JSON (QuarantineAgentResponse)

10. Main Agent parses response
    └─> ResponseParser.parse(agentOutput)
        ├─ Validate against QuarantineAgentResponseSchema (Zod)
        ├─ Sanitize findings (remove potential injected content)
        └─> Present to user
```

## Components

### HMAC Library (src/lib/)

| File | Purpose |
|------|---------|
| **hmac-ops.ts** | HMAC-SHA256 sign/verify operations using Node.js crypto |
| **typed-reference.ts** | TypedReference creation, URI encoding/decoding, HMAC verification |
| **session-manager.ts** | Session lifecycle management, HMAC key generation, session metadata tracking |
| **types.ts** | Zod schemas and TypeScript interfaces for all data structures (402 lines) |

**Key Functions:**
- `hmacSign(data, key)` → HMAC-SHA256 signature
- `hmacVerify(data, signature, key)` → Timing-safe comparison
- `TypedReference.create()` → Create signed reference
- `TypedReference.verify()` → Verify HMAC, expiration, session binding
- `SessionManager.createSession()` → Generate session with HMAC key

### Hook Enforcement (src/hooks/)

| File | Purpose |
|------|---------|
| **review-mode-hook.ts** | Core enforcement logic — tool allowlist, HMAC verification, decision making (268+ lines of shared logic) |
| **tool-allowlist.ts** | Allowlist definition, deny list with risk mapping, tool categorization (366 lines) |
| **rate-limiter.ts** | Sliding window rate limiting, per-agent and global concurrent agent tracking |
| **security-logger.ts** | Buffered JSONL audit logging with sensitive data redaction |
| **adapters/opencode-adapter.ts** | OpenCode platform integration — hooks/PreToolUse, throw Error() blocking |
| **adapters/claude-code-adapter.ts** | Claude Code platform integration — tool.execute.before hook, process.exit(2) blocking |

**Enforcement Decision Flow:**
1. Is agent in quarantine? (AgentMetadata lookup)
2. Is tool in allowlist? (tool-allowlist.ts)
3. If Read tool → Verify TypedReference HMAC
4. Check rate limit (rate-limiter.ts)
5. Log security event (security-logger.ts)
6. Return HookDecision { allowed: boolean, reason?, securityEvent? }

### Quarantine System (src/quarantine/)

| File | Purpose |
|------|---------|
| **spawn-template.ts** | System prompt template for quarantine agents, user content prompt builder (268 lines) |
| **response-parser.ts** | Parse and validate quarantine agent JSON responses, Zod schema validation |
| **timeout-manager.ts** | Enforce execution time limits (default: 5 minutes), graceful timeout handling |
| **agent-metadata.ts** | Track quarantine agent state, HMAC keys, session bindings |

**Spawn Template Variables:**
- `{{ALLOWED_TOOLS}}` → Rendered list of allowed tools
- `{{TTL}}` → TypedReference expiration time in seconds
- `{{TIMEOUT_SECONDS}}` → Agent execution timeout
- `{{SESSION_ID}}` → Unique quarantine session identifier

### Platform Adapters (src/hooks/adapters/)

Platform adapters are **thin wrappers** (~30 lines each) that integrate the shared enforcement logic with platform-specific hook APIs.

**Shared Logic:** `review-mode-hook.ts` (268+ lines)
**Platform-Specific:** Adapter files (30 lines each)

**Adapter Responsibilities:**
1. Hook registration (platform-specific hook name)
2. Extract tool name and arguments from hook input
3. Call shared `enforceQuarantinePolicy(tool, args, agentMetadata)`
4. If blocked → Use platform-specific blocking mechanism
5. If allowed → Return to allow execution

**Adding a New Platform:**
1. Create `src/hooks/adapters/<platform>-adapter.ts`
2. Implement platform's hook interface
3. Call shared enforcement logic
4. Use platform's blocking mechanism (throw, exit, return false, etc.)

## Architecture Decision Records

### ADR-001: True Dual-Context Over Taint Tracking

**Status:** Accepted

**Context:** The CaMeL framework proposes taint tracking for untrusted content — marking data as "tainted" and propagating that tag through operations. We identified gap C-2: "No trusted/untrusted context separation" as a fundamental issue that taint tracking alone does not solve.

**Decision:** Implement **True Dual-Context** architecture where untrusted content is analyzed in a completely separate agent context (quarantine agent), isolated from the main agent's trusted context. Communication between contexts happens ONLY via HMAC-secured TypedReferences.

**Consequences:**

**Pros:**
- **Stronger isolation:** No shared memory, no shared state, no data leakage risk
- **Simpler to audit:** Clear security boundary at agent spawning
- **Defense in depth:** Even if HMAC is compromised, quarantine agent still has limited tools
- **Platform-agnostic:** Works on any platform with agent spawning capability

**Cons:**
- **Higher latency:** Agent spawning adds ~2 seconds per review (vs in-process taint tracking)
- **More complex orchestration:** Main agent must manage sessions, TypedReferences, response parsing
- **Resource overhead:** Each quarantine agent is a full LLM inference context

**Rationale:** Security first. The latency trade-off is acceptable for untrusted code review (not a hot path). The isolation guarantee is stronger and easier to verify than taint propagation rules.

### ADR-002: HMAC-SHA256 Over Asymmetric Signatures

**Status:** Accepted

**Context:** TypedReferences need cryptographic verification to prevent forgery. Two options considered:
1. **Symmetric (HMAC-SHA256):** Shared secret key per session
2. **Asymmetric (ECDSA/Ed25519):** Private key signs, public key verifies

**Decision:** Use **HMAC-SHA256** with session-scoped symmetric keys.

**Consequences:**

**Pros:**
- **Performance:** HMAC is 10-50x faster than asymmetric signatures (sign: ~5ms vs ~50-500ms, verify: ~5ms vs ~10-100ms)
- **Simpler key management:** One 32-byte key per session vs public/private key pair
- **Smaller signatures:** 32 bytes HMAC vs 64+ bytes ECDSA signature
- **Session binding:** Key is session-scoped and destroyed on session end

**Cons:**
- **Key security:** HMAC key must be kept secret. If leaked, attacker can forge TypedReferences
- **No non-repudiation:** Symmetric key means both parties can create valid signatures (not relevant for this use case)

**Mitigations:**
- Keys are generated with `crypto.randomBytes(32)` (cryptographically secure)
- Keys stored in memory only (never persisted)
- Keys zeroed on session destroy (`key.fill(0)`)
- Attack scenario AS-010 documents this as a known limitation with OS-level mitigation (memory isolation, process sandboxing)

**Rationale:** Performance is critical for interactive code review (agent spawning is already 2s). HMAC provides sufficient security for session-scoped references with proper key management.

### ADR-003: Allowlist Over Denylist

**Status:** Accepted

**Context:** Need to restrict quarantine agent tool access. Two approaches:
1. **Denylist:** Block specific dangerous tools (Bash, Write, Edit, etc.)
2. **Allowlist:** Allow ONLY explicitly permitted tools (Read, Grep, Glob)

**Decision:** Use strict **allowlist** approach. Deny list exists for documentation and risk mapping only.

**Consequences:**

**Pros:**
- **Secure by default:** New tools are automatically blocked until explicitly reviewed and added
- **Clear security boundary:** Only 3 tools allowed, audit surface is minimal
- **No bypass risk:** Unknown tools or new platform tools are denied by default
- **Easy to verify:** 3 allowed tools vs 23+ denied tools

**Cons:**
- **Less flexible:** Adding a new safe tool requires code change and security review
- **Potential usability impact:** If a legitimate read-only tool exists, it's blocked until allowlist is updated

**Implementation:**
```typescript
// src/hooks/tool-allowlist.ts
export const QUARANTINE_ALLOWED_TOOLS = ["Read", "Grep", "Glob"] as const;

export function isToolAllowed(tool: string): boolean {
  return QUARANTINE_ALLOWED_TOOLS.includes(tool);
}
```

**Deny list purpose:**
- Document attack surface (23 tools with risk levels)
- Risk mapping for audit logging (TOOL_RISK_MAP)
- Testing security boundaries (verify blocked tools)

**Rationale:** Security over convenience. Code review is not a hot path. The allowlist is static and reviewed. Any new tool must go through security assessment.

### ADR-004: Platform-Agnostic Hook Interface

**Status:** Accepted

**Context:** Different AI coding platforms (OpenCode, Claude Code, Cline, Aider) have different hook APIs and blocking mechanisms. Need to support multiple platforms without duplicating enforcement logic.

**Decision:** Create a **platform-agnostic core** (`review-mode-hook.ts`) with thin platform adapters. All enforcement logic is shared. Only hook registration and blocking mechanism are platform-specific.

**Consequences:**

**Pros:**
- **Single source of truth:** 268+ lines of enforcement logic audited once, works everywhere
- **Easy to add platforms:** New adapter is ~30 lines (hook registration + blocking)
- **Consistent security:** Same allowlist, same HMAC verification, same rate limiting across all platforms
- **Testable:** Core logic tested independently of platform specifics

**Cons:**
- **Abstraction overhead:** Need to map platform-specific hook inputs to shared interface
- **Lowest common denominator:** Can only use features available on all platforms (but this is fine — we need basic tool interception)

**Implementation:**

**Shared Core:**
```typescript
// src/hooks/review-mode-hook.ts
export async function enforceQuarantinePolicy(
  tool: string,
  args: Record<string, unknown>,
  agentMetadata: AgentMetadata,
  config: QuarantineConfig
): Promise<HookDecision> {
  // 268+ lines of allowlist, HMAC verification, rate limiting
}
```

**Platform Adapter:**
```typescript
// src/hooks/adapters/opencode-adapter.ts (30 lines)
export function registerOpenCodeHook(config: QuarantineConfig) {
  // Hook registration
  hooks.on('PreToolUse', async (input) => {
    const decision = await enforceQuarantinePolicy(...);
    if (!decision.allowed) {
      throw new Error(decision.reason); // OpenCode blocking
    }
  });
}
```

**Rationale:** Don't repeat security-critical logic. Platform differences are minimal (hook name + blocking mechanism). Shared core is easier to audit and maintain.

## Security Properties

Review Mode addresses **7 identified gaps** in the CaMeL framework:

| Gap ID | CaMeL Gap | Review Mode Solution |
|--------|-----------|---------------------|
| **C-1** | No systematic content sanitization | TypedReference URI format with HMAC integrity, response parser with Zod validation |
| **C-2** | No trusted/untrusted context separation | True Dual-Context via agent spawning — main agent NEVER sees raw untrusted content |
| **C-3** | No runtime tool restriction enforcement | Hook-based allowlist enforcement on every tool call, platform-agnostic adapters |
| **H-1** | No hook-based enforcement mechanism | Platform adapters for OpenCode (throw Error), Claude Code (exit 2), extensible to others |
| **H-2** | No rate limiting for tool calls | Sliding window rate limiter (100 calls/min per agent, 5 concurrent agents max) |
| **H-3** | No audit logging for security events | Buffered JSONL security logger with sensitive data redaction, event type classification |
| **H-4** | No timeout enforcement | TimeoutManager with configurable limits (default: 5 minutes), graceful termination |

**Additional Security Properties:**
- **Cryptographic integrity:** HMAC-SHA256 prevents TypedReference forgery (AS-002)
- **Expiration:** TTL enforcement prevents replay attacks (AS-005)
- **Session binding:** TypedReferences tied to specific quarantine session (AS-003)
- **Path canonicalization:** Prevents `../` traversal attacks (AS-004)
- **Timing-safe comparison:** HMAC verification uses constant-time comparison to prevent timing attacks

## Known Limitations

### AS-009: Taint Escape via Summarization

**Description:** Quarantine agent's structured JSON findings contain text from untrusted code (e.g., code snippets in `finding.description`). If this text contains prompt injection instructions, the main agent might follow them when processing the findings.

**Mitigation:**
- **Partial:** System prompt warns quarantine agent not to propagate malicious content
- **Partial:** Structured JSON output format reduces attack surface vs free-form text
- **Partial:** Response parser sanitizes findings before presentation

**Full Mitigation:** Would require deep content inspection + LLM-based taint detection (future work).

**Risk Assessment:** Medium — Main agent has full tool access, so any injection is critical. However:
- Main agent typically presents findings to user (not executes them)
- User review is the final gate before action
- Findings are structured (type, severity, description) not commands

**Documented in:** `docs/SECURITY.md` attack scenario AS-009

### AS-010: HMAC Key Theft via Memory Dump

**Description:** If an attacker can dump the process memory of the AI agent, they can extract the HMAC key and forge TypedReferences.

**Mitigation:**
- **Partial:** Keys are session-scoped (short-lived)
- **Partial:** Keys are zeroed on session destroy (`Buffer.fill(0)`)
- **Requires OS-level mitigation:** Memory isolation, process sandboxing, kernel-level memory encryption

**Full Mitigation:** Would require hardware-backed key storage (TPM, secure enclave) or asymmetric signatures (but trades performance for non-repudiation we don't need).

**Risk Assessment:** Low — Requires existing code execution on the host system. If attacker has memory dump capability, they already have full system access (bigger problem than TypedReference forgery).

**Documented in:** `docs/SECURITY.md` attack scenario AS-010

### No Persistent Key Storage

**Description:** HMAC keys are session-scoped and exist only in memory. Sessions cannot be resumed after process restart.

**Design Decision:** This is intentional. Sessions are ephemeral by design:
- Reduces attack surface (keys are never persisted)
- Simpler key management (no secure storage, rotation, revocation)
- Review operations are short-lived (minutes, not hours/days)

**Consequence:** If the AI agent process crashes during a review, the session is lost and must be restarted.

**Rationale:** Security over persistence. Code review is not a long-running background task. The simplicity of session-scoped keys outweighs the minor inconvenience of non-resumable sessions.

---

For detailed attack scenario documentation, see `docs/SECURITY.md`.

For implementation details, see source code in `src/`.

For test coverage, see `tests/` (268+ tests).
