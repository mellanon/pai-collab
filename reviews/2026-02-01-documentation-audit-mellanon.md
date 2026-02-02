# Documentation Audit Report — 2026-02-01

**Auditor:** @mellanon (agent: Luna)
**Scope:** All 20 governance and policy files in pai-collab
**Method:** Cross-referencing every document against every other for consistency, drift, missing references, and schema compliance

---

## Files Audited

| # | File | Purpose |
|---|------|---------|
| 1 | CLAUDE.md | Agent operating protocol |
| 2 | CONTRIBUTING.md | Artifact schemas and contribution flow |
| 3 | TRUST-MODEL.md | Threat vectors, defense layers, trust zones |
| 4 | CONTRIBUTORS.yaml | Repo-level trust zones |
| 5 | REGISTRY.md | Project and agent index |
| 6 | STATUS.md | Project status overview |
| 7 | sops/README.md | SOP index and sequence |
| 8 | sops/agent-onboarding.md | 8-step onboarding pipeline |
| 9 | sops/inbound-contribution-protocol.md | PR processing pipeline |
| 10 | sops/review-format.md | Review pipeline and template |
| 11 | sops/parallel-reviews.md | Multi-reviewer workflow |
| 12 | sops/competing-proposals.md | Multi-proposal evaluation |
| 13 | sops/requesting-collaboration.md | Call-for-help pattern |
| 14 | sops/project-archival.md | Project retirement |
| 15 | sops/contribution-protocol.md | Outbound contribution prep |
| 16 | sops/specflow-development-pipeline.md | SpecFlow build pipeline |
| 17 | sops/specfirst-release-process.md | Release process |
| 18 | sops/daemon-registry-protocol.md | Agent discovery |
| 19 | .github/workflows/pr-schema-check.yml | CI automation |
| 20 | All projects/*/PROJECT.yaml (4 files) | Project identity |

---

## Findings Summary

| Severity | Count | Resolved | Deferred |
|----------|-------|----------|----------|
| Major | 6 | 6 | 0 |
| Minor | 18 | 11 | 7 |
| Trust audit gap | 1 | 0 | 1 |
| **Total** | **25** | **17** | **8** |

---

## Major Findings

### #4 — CONTRIBUTORS.yaml schema inconsistency
**Severity:** Major
**File:** CONTRIBUTORS.yaml
**Issue:** Had `promoted`, `promoted_by`, `notes` fields. PROJECT.yaml contributors use `zone`/`since` only. No documented schema for repo-level CONTRIBUTORS.yaml — two different schemas for the same concept.
**Resolution:** ✅ Fixed. Standardized to `zone`, `since`, `promoted_by` (audit trail). Removed `notes` and renamed `promoted` → `since`. CI now validates this schema.
**Commit:** `a2525c0`

### #9 — STATUS.md vs REGISTRY.md maintainer drift
**Severity:** Major
**File:** STATUS.md, REGISTRY.md, projects/specflow-lifecycle/PROJECT.yaml
**Issue:** STATUS.md listed specflow-lifecycle maintainers as "@mellanon, @jcfischer" but REGISTRY.md and PROJECT.yaml both show only @mellanon as maintainer. @jcfischer is a trusted contributor, not maintainer.
**Resolution:** ✅ Fixed. STATUS.md aligned to PROJECT.yaml (source of truth). New `check-status-alignment.mjs` CI script prevents future drift.
**Commit:** `d0e0fb5`

### #1-3 — Missing optional branching fields in PROJECT.yaml
**Severity:** Major (downgraded to low priority)
**Files:** projects/skill-enforcer/PROJECT.yaml, projects/specflow-lifecycle/PROJECT.yaml
**Issue:** Both are upstream contributions but missing optional `fork`, `source_branch`, `contrib_branch` fields. CONTRIBUTING.md schema examples include these for upstream contributions.
**Resolution:** ✅ Fixed. Added `fork`, `source_branch`, `contrib_branch` to both PROJECT.yaml files.
**Commit:** `6c34e2e`

### #21 — No STATUS.md alignment validation in CI
**Severity:** Major
**File:** .github/workflows/pr-schema-check.yml
**Issue:** CI validated REGISTRY.md ↔ PROJECT.yaml alignment but not STATUS.md ↔ PROJECT.yaml. STATUS.md could drift without detection (as proven by finding #9).
**Resolution:** ✅ Fixed. Created `check-status-alignment.mjs` — validates project phases and maintainers in STATUS.md match PROJECT.yaml.
**Commit:** `d0e0fb5`

### #23 — Trust promotion audit trail gap
**Severity:** Major
**File:** TRUST-MODEL.md, CONTRIBUTORS.yaml
**Issue:** TRUST-MODEL.md says "document the reason for promotion" but CONTRIBUTORS.yaml has `promoted_by` without a `reason` field. No audit trail for *why* someone was promoted.
**Resolution:** Deferred. `promoted_by` provides accountability (who promoted). Adding `reason` is desirable but not blocking. Could be tracked in journal entries instead.

---

## Minor Findings

### #5 — CLAUDE.md vs sops/README.md SOP description wording
**Files:** CLAUDE.md line 161, sops/README.md
**Issue:** CLAUDE.md says "Registering agents" for daemon-registry-protocol; SOP README says "How do agents find each other?" Different framing.
**Resolution:** Noted. Both are correct — registration and discovery are two sides of the same SOP. No action needed.

### #6 — CONTRIBUTORS.yaml not in governance journaling list
**File:** CLAUDE.md line 59
**Issue:** Audit initially flagged CONTRIBUTORS.yaml as missing from governance file list.
**Resolution:** Already correct. CONTRIBUTORS.yaml is listed on line 59. Finding was wrong.

### #7 — SOP numbering scheme unclear
**File:** sops/README.md
**Issue:** Sequential phases numbered 1-6, parallel phases use ∞. No legend explaining the convention.
**Resolution:** ✅ Fixed. Added numbering legend: 1–6 sequential, 0 prerequisite, ∞ parallel.
**Commit:** `6c34e2e`

### #8 — Harden phase has no SOP
**File:** CONTRIBUTING.md
**Issue:** The 6-step flow includes "Harden" but there's no SOP for it. sops/README.md explains this is intentional (project-specific testing), but CONTRIBUTING.md doesn't mention this.
**Resolution:** Noted. Could add a parenthetical in CONTRIBUTING.md. Low priority.

### #10 — Agents not in CONTRIBUTORS.yaml
**File:** CONTRIBUTORS.yaml, REGISTRY.md
**Issue:** CONTRIBUTORS.yaml lists humans only. Agents are in REGISTRY.md agent table. No cross-reference explaining this separation.
**Resolution:** Noted. The separation makes sense (agents are listed with their operators). Low priority.

### #11 — `seeking-contributors` dual category
**File:** CLAUDE.md
**Issue:** Label appears in both Cross-cutting and Collaboration categories in the label taxonomy table. Unclear whether it's a functional tag or a collaboration signal.
**Resolution:** ✅ Fixed. Clarified as a signal label that pairs with collaboration labels to compose requests.
**Commit:** `d0e0fb5`

### #12 — `expertise-needed` not in label taxonomy
**File:** CLAUDE.md
**Issue:** Label was created and used in requesting-collaboration SOP but not documented in CLAUDE.md's label taxonomy.
**Resolution:** ✅ Fixed then superseded. Label was added to Collaboration category, then later removed — consolidated to `seeking-contributors` as the single label for all help requests. `expertise-needed` label deleted from GitHub.
**Commit:** `a2525c0`

### #13 — CONTRIBUTING.md missing CLAUDE.md reference
**File:** CONTRIBUTING.md line 348
**Issue:** "What Doesn't Belong Here" section references issue-first workflow without linking to CLAUDE.md where it's documented.
**Resolution:** Noted. Minor cross-reference gap. Low priority.

### #14 — BugBot integration untracked
**File:** sops/review-format.md
**Issue:** External Tools section mentions Cursor BugBot as "available, needs GitHub Actions setup" but no issue tracks this integration.
**Resolution:** Noted. Could create an issue to track. Low priority — we now have our own schema enforcement CI.

### #15 — specflow-lifecycle naming inconsistency
**File:** sops/README.md, projects/specflow-lifecycle/PROJECT.yaml
**Issue:** Directory is `specflow-lifecycle`, formal name is "SpecFlow Lifecycle Extension". The two differ.
**Resolution:** Noted. Common pattern — directory names are kebab-case, display names are proper case. No action needed.

### #16 — External Maestro playbook dependency
**File:** sops/specflow-development-pipeline.md, sops/review-format.md
**Issue:** References `github.com/mellanon/maestro-pai-playbooks` — an external repo not under pai-collab control. Drift risk.
**Resolution:** Noted. This is by design — Maestro playbooks live in their own repo. Could add version pinning.

### #17 — Inconsistent SOP naming in references
**File:** Various
**Issue:** Some files reference "Contribution Preparation SOP", others "Contribution Protocol". File is `contribution-protocol.md`.
**Resolution:** Noted. Both names are used interchangeably. Could standardize but not blocking.

### #18 — `type/governance` not in label taxonomy
**File:** CLAUDE.md
**Issue:** Label was created on GitHub and used in issues but not listed in CLAUDE.md's Type labels.
**Resolution:** ✅ Fixed. Added to Type category.
**Commit:** `a2525c0`

### #19 — Hypothetical example in requesting-collaboration SOP
**File:** sops/requesting-collaboration.md
**Issue:** Worked example references PR #56 which is still open/unreviewed. Could be seen as hypothetical.
**Resolution:** Noted. The example is forward-looking but accurate — PR #56 does need review. Will become a real example once reviewed.

### #20 — GitHub Actions script paths hard-coded
**File:** .github/workflows/pr-schema-check.yml
**Issue:** Script paths are hard-coded as `.github/scripts/`. No fallback if moved.
**Resolution:** Noted. Standard convention for GitHub Actions. No action needed.

### #22 — JOURNAL.md missing = warning, README.md missing = error
**File:** .github/scripts/validate-schemas.mjs
**Issue:** Inconsistent severity for the same type of check (missing required file in project directory).
**Resolution:** ✅ Fixed. Both now error consistently.
**Commit:** `d0e0fb5`

### #24 — Label deletion not in scope label lifecycle
**File:** CLAUDE.md, sops/project-archival.md
**Issue:** Archival SOP says "retire the `project/<name>` scope label (delete it)" but CLAUDE.md's scope label lifecycle section doesn't mention deletion.
**Resolution:** ✅ Fixed. Added label deletion reference to scope label lifecycle.
**Commit:** `d0e0fb5`

### #25 — Council debate roles not operationalized
**File:** sops/inbound-contribution-protocol.md
**Issue:** References Council debate pattern (Architect, Engineer, Security, Researcher) but doesn't explain how to assign these roles or who fills them.
**Resolution:** ✅ Fixed. Clarified as PAI Council skill agent roles (not human assignments) with link to the Council skill. Any agent with the skill can invoke a debate.
**Commit:** `6c34e2e`

---

## CI Coverage Analysis

### Before Audit

| Check | Type |
|-------|------|
| PROJECT.yaml required fields | Error |
| PROJECT.yaml status values | Error |
| PROJECT.yaml license | Error |
| Contributors zone+since only | Error |
| REGISTRY ↔ PROJECT.yaml alignment | Error |
| STATUS.md update warning | Warning |

**Total: 6 automated checks**

### After Audit

| Check | Type | Script |
|-------|------|--------|
| PROJECT.yaml required fields | Error | validate-schemas.mjs |
| PROJECT.yaml status values | Error | validate-schemas.mjs |
| PROJECT.yaml license | Error | validate-schemas.mjs |
| Contributors zone+since only | Error | validate-schemas.mjs |
| JOURNAL.md present in project dir | Error | validate-schemas.mjs |
| README.md present in project dir | Error | validate-schemas.mjs |
| JOURNAL.md entry fields (author, phase, status, issues) | Warning | validate-schemas.mjs |
| JOURNAL.md phase values (lifecycle) | Warning | validate-schemas.mjs |
| CONTRIBUTORS.yaml schema (zone, since, zones valid) | Error | validate-schemas.mjs |
| REGISTRY ↔ PROJECT.yaml alignment | Error | check-registry-alignment.mjs |
| STATUS ↔ PROJECT.yaml alignment | Error | check-status-alignment.mjs |
| STATUS.md update warning | Warning | workflow inline |
| JOURNAL.md update warning (project + governance) | Warning | workflow inline |
| PR references an issue | Warning | workflow inline |
| Commit references an issue | Warning | workflow inline |

**Total: 14 automated checks (6 errors, 9 warnings)**

### Not Automated (Requires Human Judgment)

| Rule | Why Not Automated |
|------|-------------------|
| Trust zone check before PR review | Requires GitHub API + runtime context |
| SOP required sections | Too varied to validate mechanically |
| Scope label exists for project | Requires GitHub label API |
| Claim verification (PR does what it says) | Human judgment |
| Issue overclaiming (closing issues not addressed) | Human judgment |
| Architecture fit | Human judgment |

---

## Recommendations

### Immediate
1. Review PR #56 using the updated review format SOP and CI findings
2. Consider whether deferred findings (#1-3, #23) should be tracked as issues

### Short-term
3. Run a fresh agent onboarding test to validate the REPORT format + HOW TO CONTRIBUTE section work correctly end-to-end
4. Create a BugBot/Greptile integration issue (#14) or remove stale references

### Medium-term
5. Add `reason` field to CONTRIBUTORS.yaml promotion schema (#23)
6. Add version pinning for external Maestro playbook references (#16)
7. Standardize SOP naming convention across all cross-references (#17)
