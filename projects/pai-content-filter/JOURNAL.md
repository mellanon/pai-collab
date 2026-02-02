# pai-content-filter — Journey Log

A structured, append-only log of what happened on this project. New entries go at the top. Each entry is a self-contained block — submit via PR, no merge conflicts.

**Maintainer:** @jcfischer

---

## 2026-02-02 — Community review enhancements implemented

**Author:** @jcfischer (agent: Ivy)
**Phase:** Evolve
**Status:** 389 tests passing, 34 detection patterns. Enhancement suggestions from reviews implemented.
**Issues:** #67

### What Happened
- Implemented 6 new detection patterns per @Steffen025 review feedback on pai-collab PR #56:
  - PI-012: Instruction override variants (broader "from now on" phrasing)
  - PI-013: Format marker exploits (Llama/Mistral-style delimiters)
  - PI-014: Advanced jailbreak patterns (DAN mode, safety bypass)
  - PII-009: Replicate API tokens (r8_ prefix)
  - PII-010: HuggingFace API tokens (hf_ prefix)
  - PII-011: Groq API keys (gsk_ prefix)
- 8 new tests added, full suite now 389 tests passing
- Detection pattern count: 28 → 34
- Created issues for remaining suggestions: placeholder filtering ([#3](https://github.com/jcfischer/pai-content-filter/issues/3)), confidence/severity scoring ([#4](https://github.com/jcfischer/pai-content-filter/issues/4))

### What Emerged
- The pattern additions were straightforward — YAML config + test is a clean extension model
- Placeholder filtering and confidence scoring are architectural changes that need their own design pass — tracked as issues rather than rushed in

---

## 2026-02-02 — F-006 Sandbox Enforcer shipped, stats updated

**Author:** @jcfischer (agent: Ivy)
**Phase:** Release
**Status:** 6/6 features shipped, 380 tests passing. Blackboard artifacts updated to reflect F-006.
**Issues:** #67

### What Happened
- F-006 Sandbox Enforcer hook shipped upstream ([PR#2](https://github.com/jcfischer/pai-content-filter/pull/2)) after the initial blackboard registration
- New modules: command-parser.ts (Bash tokenization, command classification), sandbox-rewriter.ts (destination rewriting)
- 76 new tests (37 command parser + 25 sandbox rewriter + 14 integration), bringing total from 275→380
- Dual-hook pattern now complete: SandboxEnforcer intercepts acquisition commands → ContentFilter scans sandbox content
- Updated blackboard README and JOURNAL stats per review feedback from @azmaveth and @Steffen025

### What Emerged
- The block-and-instruct pattern was chosen over transparent rewrite due to Claude Code's `updatedInput` limitation in `bypassPermissions` mode — pragmatic trade-off (extra round-trip for reliability)
- WebFetch removed from quarantine allowed tools per @azmaveth's security review (exfiltration vector)
- CaMeL claims in upstream README honestly qualified with 4 documented divergences per review feedback

---

## 2026-02-01 — Project Registration on pai-collab

**Author:** @jcfischer (agent: Ivy)
**Phase:** Release
**Status:** Registered on blackboard. 5/5 features shipped, 275 tests passing.
**Issues:** #16, #17, #18, #24

### What Happened
- Registered pai-content-filter as a standalone tool on the pai-collab blackboard
- Project implements inbound content security — Layer 4 of the trust model (content boundary enforcement)
- Five features shipped via SpecFlow: content filter engine (F-001), audit trail & override (F-002), typed references & provenance (F-003), dual-context sandboxing (F-004), integration & canary suite (F-005)
- 275 tests passing across unit, integration, canary, and performance benchmarks
- Architecture: CaMeL-inspired (arXiv:2503.18813) with three defense layers — pattern matching, schema validation, encoding detection
- Delivers a PreToolUse hook for Claude Code and a standalone CLI (`content-filter check <file>`)

### What Emerged
- The project addresses pai-collab issues #16 (LoadContext scanning), #17 (review mode tool restrictions), and #18 (audit logging) — all identified in the trust model Council debate
- CaMeL-inspired rather than CaMeL-faithful: uses regex-based pattern matching (not LLM reasoning), file-level sandboxing (not dual-LLM), no taint propagation. These divergences are intentional per the project constitution (deterministic, no LLM classification).
- Complements pai-secret-scanning (outbound, Layers 1-2) with inbound content security (Layers 4-5)

---
