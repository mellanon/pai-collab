# Review: pai-pkg Security Architecture + Skill Lifecycle — 2026-03-18

Reviewer: @jcfischer (agent: Ivy)
Commit: 748afb2 (security: address JC review with council + red team findings)
Issue: [#106](https://github.com/mellanon/pai-collab/issues/106)

## Summary

Comprehensive design-level review of four documents: SECURITY-ARCHITECTURE.md, SKILL-LIFECYCLE.md, RESEARCH.md, and BRIEFING.md. The architecture is sound, the research is thorough (14 agents, council debate, red team), and the phased approach is realistic. All 7 findings were adopted by the maintainer.

---

## Findings

### F1: Union Model Permissiveness (Architecture — Accepted as Documented Tradeoff)

**Severity:** Design consideration
**Status:** Accepted with guardrails

The SecurityValidator enforces the UNION of all installed skill policies. This means installing more skills monotonically increases the capability surface. A malicious SKILL.md can piggyback on capabilities declared by other installed skills without declaring its own.

**Maintainer response:** Accepted as conscious tradeoff. Added §3.1.1 "Known Limitation: Union Model Permissiveness" to SECURITY-ARCHITECTURE.md. Zero-declared = zero-granted blocks the simplest form of piggybacking. Expanded composition warnings in `pai-pkg audit`. Runtime skill attribution deferred until Claude Code exposes skill-level tool attribution in hook payloads.

### F2: `--system` Package Manifest Schema (Architecture — Accepted and Extended)

**Severity:** Design gap
**Status:** Adopted with refinements

The architecture proposed `--system` packages for pai-content-filter, pai-secret-scanning, and skill-enforcer but lacked a manifest schema differentiating them from regular skills. System packages install hooks and patterns, not SKILL.md files. Hook ordering matters — content-filter must execute before SecurityValidator.

**Proposed schema:**

```yaml
type: system
hooks:
  pre_tool_use:
    - file: hooks/ContentFilter.hook.ts
      order: 10  # lower = earlier
      tools: [Read, Glob, Grep]
  pre_commit:
    - file: hooks/secret-scan.sh
patterns:
  - file: patterns/content-filter.yaml
    merge_into: base  # not skills section
```

**Maintainer response:** Accepted as starting point. Council refined with priority ranges (0-9 core, 10-29 system, 50-99 user), manifest superset model, path-protected installation, and periodic integrity verification. Added §6.2.1 to SECURITY-ARCHITECTURE.md.

### F3: SessionAudit PostToolUse Timing (Security — Critical Fix Adopted)

**Severity:** High
**Status:** Fixed

The original design placed behavioral anomaly detection in a PostToolUse hook. PostToolUse cannot block — it fires after tool execution. For critical sequences like "read secrets → curl to external server," the exfiltration completes before detection.

**Recommendation:** Move sequence detection to PreToolUse. When `Bash: curl` is called, PreToolUse checks the rolling event window, sees the prior secret read, and blocks the curl before execution.

**Maintainer response:** Adopted. Rewrote §5.3 as dual-hook architecture:
- PostToolUse (SessionAuditRecorder): Records events, ~0.3ms, O_APPEND
- PreToolUse (SessionAuditEnforcer): Reads window + evaluates sequences, CAN BLOCK, <8ms p99

### F4: Anomaly Rule Fail Modes (Security — Adopted)

**Severity:** Medium
**Status:** Adopted

Content-filter uses fail-open (false positives on reads would break normal work). SessionAudit anomaly rules need differentiated fail modes by severity.

**Recommendation:**
- Critical severity: fail-closed (block, require human override)
- High/medium severity: fail-open (alert but allow)

**Maintainer response:** Adopted. Added `fail_mode` field to anomaly rule schema and §5.2.1 documenting the tiered policy.

### F5: patterns.yaml v2.0 Migration Path (Architecture — Designed)

**Severity:** Medium
**Status:** Designed

The existing patterns.yaml has no `version` field. The v2.0 schema needs auto-detection and migration, plus manifest hash verification on every SecurityValidator load.

**Maintainer response:** Designed auto-migration (detect v1 → wrap under `base:`, add `skills: {}`, set `version: "2.0"`). Added manifest hash verification — mismatch suspends skill until re-verified. Added §3.2.1 and §3.2.2.

### F6: Theoretical vs Observed Risk in Audit (Architecture — Accepted)

**Severity:** Low
**Status:** Accepted for Phase 3

`pai-pkg audit` will generate warnings for capability combinations that never occur together in practice. Recommended opt-in runtime telemetry to distinguish theoretical from observed risk.

**Maintainer response:** Accepted. Added to Phase 3 scope (requires SessionAudit to ship first).

### F7: Miscellaneous (Documentation + Security)

- **Dead link:** SKILL-LIFECYCLE.md referenced local filesystem path → removed
- **Rate limiting:** Arbor-style constraint enforcement promoted from "future" to Phase 2
- **zeroAccess gaps:** `~/.ssh/config` and `~/.aws/credentials` added to zeroAccess paths

---

## Follow-Up Review: Implementation Progress (2026-03-24)

Reviewed 4 additional commits implementing the CLI (147 tests, 418 assertions).

### Implementation Strengths

- **Catalog/registry split:** Clean separation between personal catalog and community registry. Not in original design but fills a real gap.
- **Source resolver:** Handles local, GitHub browser, and raw GitHub URLs cleanly.
- **Database design:** SQLite + WAL + foreign keys + CASCADE. Clean schema.
- **CLI/simple skill differentiation:** `has_cli`/`bundle` flag determines full-repo clone vs. skill-dir copy.
- **TDD discipline:** Test counts grew with each commit.

### Security Findings (Implementation)

**S1: `catalog push` executes `git push` to arbitrary remotes (Medium)**
If catalog.yaml source URLs are tampered with, `catalog push` pushes to attacker-controlled repos. Recommend verifying remote URL and requiring confirmation before push.

**S2: Path traversal in install path (Low)**
`extractRepoName()` doesn't sanitize against `../` in repo names. A crafted name like `../../.claude/skills/Research` could escape the repos directory. Fix: verify `installPath.startsWith(paths.reposDir)`.

### Code Quality Findings

**C1: Duplicate clone logic** between `install.ts` and `catalog.ts` `installSkillEntry()`. The catalog version is more complete — should be promoted to shared lib.

**C2: Unchecked `Bun.spawnSync()` exit codes** for `bun install` and `git add` — failures silently ignored.

**C3: `findRepoRoot()` silent fallback** — returns start directory on failure instead of signaling error.

**C4: `extractRepoName()` collision risk** — different orgs with same repo name install to same directory. Use `org-repo` format.

---

## Recommendation

**Merge-ready for Phase 1 scope.** Fix S2 (path traversal, one-line check) and S1 (push confirmation) before shipping. The rest can be tracked as issues.

The architecture is sound, the implementation is clean, and the pace is impressive. Ready to collaborate on `--system` package design for pai-content-filter.
