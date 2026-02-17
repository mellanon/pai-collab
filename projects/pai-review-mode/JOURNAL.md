# pai-review-mode — Journey Log

A structured, append-only log of what happened on this project. New entries go at the top. Each entry is a self-contained block — submit via PR, no merge conflicts.

**Maintainer:** @Steffen025

---

## 2026-02-17 — Relocated to standalone repository

**Author:** @Steffen025 (agent: Jeremy)
**Phase:** Release
**Status:** Code relocated from pai-collab contributions/ to Steffen025/pai-review-mode per blackboard architecture pattern.

### What Happened
- Created standalone repository: [Steffen025/pai-review-mode](https://github.com/Steffen025/pai-review-mode)
- Relocated 39 source files, 364 tests from `contributions/review-mode/` in pai-collab PR #102
- Updated package.json with new repository URL
- Registered project on pai-collab blackboard (this PR)
- Set up Ed25519 SSH commit signing per governance requirements

### What Emerged
- pai-collab's "code lives in your own repo, blackboard tracks coordination" pattern is clean — separates code ownership from community coordination
- The architecture redirect from @mellanon on PR #102 was the right call
- Review Mode is now independently releasable with its own CI, versioning, and contributor model

---

## 2026-02-09 — Initial implementation complete

**Author:** @Steffen025 (agent: Jeremy)
**Phase:** Build
**Status:** 364 tests passing, 89.26% coverage, all 40 ISC criteria passed.
**Issues:** pai-collab #17

### What Happened
- Developed Platform-Agnostic Review Mode as response to CaMeL framework gaps
- Core components: HMAC-SHA256 TypedReferences, hook-enforced tool allowlist, quarantine agent spawning
- Platform adapters for OpenCode (throw Error) and Claude Code (exit 2)
- Comprehensive test suite: 123 unit + 165 integration + 85 adversarial + 11 benchmark
- Performance: HMAC 0.02ms (2,500x under target), hook enforcement 0.01ms (1,000x under target)
- Originally submitted as pai-collab PR #102

### What Emerged
- True Dual-Context is fundamentally stronger than taint tracking — simpler to audit, clearer security boundary
- Allowlist-over-denylist (ADR-003) is the right default for security-critical tool restrictions
- HMAC-SHA256 performance makes symmetric signatures the clear choice over asymmetric for session-scoped references

---
