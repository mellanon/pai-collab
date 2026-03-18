# pai-review-mode

Platform-Agnostic Review Mode for PAI agents — True Dual-Context isolation for safely processing untrusted code contributions.

**Source:** [github.com/Steffen025/pai-review-mode](https://github.com/Steffen025/pai-review-mode)

## What It Does

Security framework for AI coding agents that need to safely analyze untrusted code (pull requests, external repos, user-submitted code). Prevents prompt injection attacks through True Dual-Context isolation — the main agent never sees raw untrusted content.

1. **True Dual-Context Isolation**: Separate agent contexts for trusted and untrusted content. Main agent spawns quarantine agents via Task tool — never reads untrusted files directly.
2. **HMAC-SHA256 TypedReferences**: Cryptographically signed URIs that prove file access was explicitly authorized by the trusted main agent. Includes expiration (TTL), session binding, and path canonicalization.
3. **Hook-Enforced Tool Allowlist**: Quarantine agents can ONLY use Read, Grep, Glob (23 tools blocked). Enforced via platform hooks on every tool call — not prompt-based restrictions.
4. **Platform-Agnostic Adapters**: Works on OpenCode (`throw Error()`) and Claude Code (`process.exit(2)`). ~30 lines per adapter, 268+ lines of shared enforcement logic.

## Stats

- 364 tests (123 unit + 165 integration + 85 adversarial + 11 benchmark)
- 89.26% line coverage
- 8 adversarial attack scenarios (AS-001 through AS-008)
- HMAC generation: 0.02ms avg (2,500x under 50ms target)
- Hook enforcement: 0.01ms p99 (1,000x under 10ms target)
- 4 ADRs documenting architectural decisions

## Security Properties

Addresses 7 identified gaps in the CaMeL framework (DeepMind, 2025):

| Gap | CaMeL Limitation | Review Mode Solution |
|-----|-------------------|---------------------|
| C-1 | No systematic content sanitization | TypedReference URI format with HMAC integrity |
| C-2 | No trusted/untrusted context separation | True Dual-Context via agent spawning |
| C-3 | No runtime tool restriction enforcement | Hook-based allowlist enforcement |
| H-1 | No hook-based enforcement mechanism | Platform adapters (OpenCode, Claude Code) |
| H-2 | No rate limiting | Sliding window (100/min per agent, 5 concurrent) |
| H-3 | No audit logging | Buffered JSONL with sensitive data redaction |
| H-4 | No timeout enforcement | Configurable limits (default: 5 min) |

## Relationship to pai-content-filter

Together these form a complete security perimeter:
- **pai-content-filter** (inbound) — prevents malicious content from compromising agents reading shared repos
- **pai-review-mode** (review) — safely reviews untrusted code contributions without exposing the main agent to prompt injection

Review Mode can use pai-content-filter as an additional defense layer within the quarantine context.

## Research Basis

- [CaMeL: Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813) (DeepMind, 2025) — architectural inspiration; Review Mode addresses 7 gaps identified in adversarial analysis
- Adversarial security review of pai-content-filter (PR #90, merged) informed the defense-in-depth approach
