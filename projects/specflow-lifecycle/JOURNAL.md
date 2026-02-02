# SpecFlow Lifecycle — Journey Log

A structured, append-only log of what happened on this project. New entries go at the top. Each entry is a self-contained block — submit via PR, no merge conflicts.

**Maintainer:** @jcfischer

---

<!-- JOURNAL ENTRY FORMAT (copy this template for new entries):

## YYYY-MM-DD — Title

**Author:** @handle (agent: name)
**Phase:** Proposal | Design | Build | Review | Ship
**Status:** What changed

### What Happened
- ...

### What Emerged
- ...

---

-->

## 2026-02-02 — All 10 Features Implemented (F-1 through F-10)

**Author:** @mellanon (agent: Luna)
**Phase:** Build
**Status:** All 10 lifecycle extension features implemented, building clean at 200 modules
**Branch:** `feature/lifecycle-extension` on `mellanon/specflow-bundle`

### What Happened
- Implemented all 10 features from the iteration plan in a single session
- **F-1:** Delta-spec SQLite schema — migration 007, `spec_versions` + `spec_deltas` tables, TypeScript types, CRUD module
- **F-2:** Spec versioning — auto-snapshot in `specify` command, version + delta tracking in `revise` command
- **F-3:** Brownfield scanner — `specflow brownfield scan` with regex-based TS/JS parser, heuristic multi-language support, dependency scanning
- **F-4:** Delta-spec generator — `specflow brownfield diff` with structural diff + optional AI classification
- **F-5:** Brownfield apply — `specflow brownfield apply` creates versioned spec with full delta trail
- **F-6:** Review automated checks — `specflow review` Layer 1 with typecheck/lint/test + spec-code file alignment
- **F-7:** Review AI alignment — Layer 2 using headless Claude to evaluate spec-code faithfulness
- **F-8:** Review human template — Layer 3 structured review template with risk areas, checklists, sign-off
- **F-9:** Release gates 1-4 — `specflow release` evaluating completeness, quality evals, CHANGELOG, file inventory
- **F-10:** Release gates 5-8 — PII/secrets scan, contrib branch, sanitization verification, PR template
- Build: 200 modules compiled, 0 errors, binary functional
- Updated PROJECT.yaml with correct `source_branch` and full `paths` inventory

### What Emerged
- **Process failure noted:** Did NOT use SpecFlow's own specify → plan → tasks pipeline for these features. Went straight from features.json descriptions to implementation. Ironic for a spec-driven development framework.
- SpecFlow lacks a `catch-up` or `sync-state` command to retroactively update feature phases when implementation outpaces the process — this is a feature request
- The `specflow complete` command validates artifact existence (spec.md, plan.md, tasks.md), so features implemented without those artifacts can't be properly closed through the CLI
- F-011 through F-015 (pipeline orchestration features) remain pending and should follow the actual SpecFlow process

---

## 2026-02-02 — Council Verdict C+: Build Natively, Emit Compatibly

**Author:** @mellanon (agent: Luna)
**Phase:** Design
**Status:** Project scope pivoted from Maestro playbooks to native SpecFlow commands
**Issues:** #82 (iteration plan), #83 (brownfield design), #5, #6, #7, #8

### What Happened
- Completed Spec-Driven Development Landscape research report with council debate (4 agents, 3 rounds)
- Council verdict: **C+ — Build brownfield/review/release natively in SpecFlow, optionally emit OpenSpec-compatible format**
- Issues #5, #6, #7 need re-scoping: originally framed as "Maestro playbooks" but council recommends native SpecFlow commands instead
- Issue #8 (OpenSpec template) deprioritized — council says evaluate interchange format at 90-day review gate
- Created iteration plan #82 (Feb 3-14) and brownfield design issue #83
- Updated PROJECT.yaml paths from `playbooks/` to `src/commands/` to reflect native command approach
- New command targets: `specflow brownfield` (delta-spec semantics), `specflow review`, `specflow release` (port SpecFirst 8-gate)

### What Emerged
- The v1.0→v1.1 problem is now clearly scoped: `specflow brownfield` with delta-spec semantics on SQLite is the core answer
- SpecFirst's 8-gate release workflow (tag-before-contrib, CHANGELOG, file inventory) should be ported as `specflow release`, not recreated from scratch
- OpenSpec's delta-spec concept (ADDED/MODIFIED/REMOVED) has value but OpenSpec as a dependency is too risky (bus factor=1, 21.5K stars but single maintainer). Extract the pattern, own the implementation.
- Cedars (#72, @Steffen025) offers a complementary milestone-based approach — the `GateApprover` injection pattern is a natural integration point

---

## 2026-02-02 — Headless Pipeline, Doctorow Gate, and Bug Fixes (PRs #3, #4, #6, #7)

**Author:** @mellanon (agent: Luna)
**Phase:** Build
**Status:** Four PRs submitted to jcfischer/specflow-bundle — headless autonomous execution, AI quality gates, and two bug fixes
**Issues:** #5, #8

### What Happened
- **PR #7 — Full headless pipeline** (1038 lines, 12 files): Shared `lib/headless.ts` runner using `claude -p --output-format json`. Headless branches added to specify, plan, tasks, and executor commands. New `specflow pipeline <featureId>` command runs the full lifecycle (specify → plan → tasks → implement → complete) autonomously. Controlled via `SPECFLOW_HEADLESS=true` and `SPECFLOW_MODEL` env vars. Auto-detects non-TTY environments.
- **PR #6 — AI-powered Doctorow Gate**: Replaces stub quality checks in the `complete` command with real AI evaluation using Claude. Four checks (spec coherence, plan-spec alignment, test-plan alignment, scope discipline) run headlessly via `claude -p --output-format json`. Default model: Opus. Configurable via `SPECFLOW_DOCTOROW_MODEL`.
- **PR #4 — N/A sections in verify.md**: CLI-only features (no UI) can now have N/A sections in verification checklists without failing validation.
- **PR #3 — Migration fix for compiled binary**: `specflow init` migrations weren't running in the compiled Bun binary due to path resolution. Fixed import resolution.
- Also created issue #5 on specflow-bundle for the headless Doctorow Gate feature request.
- Used SpecFlow to dogfood its own headless mode development — created `features.json` with 6 features, ran SpecFlow on specflow-bundle to track the work.

### What Emerged
- **`claude -p --output-format json` is the key pattern** for headless AI execution in PAI tooling. The `--system-prompt` flag alone does NOT prevent PAI hooks from injecting formatting into output. The JSON envelope (`{"type":"result","result":"..."}`) is reliably parseable regardless of hook interference.
- The headless pipeline directly enables the autonomous lifecycle vision from the specflow-lifecycle README: BUILD phase can now run end-to-end without human interaction. This is a prerequisite for Maestro playbook wrapping (issues #5-#7).
- **OpenSpec gap confirmed**: SpecFlow bundle has zero OpenSpec implementation. Maestro has a full OpenSpec integration (openspec-manager.ts, 5 commands, IPC handlers, UI panel) pulling from Fission-AI/OpenSpec. The bridge between SpecFlow (feature-driven, greenfield) and OpenSpec (change-driven, brownfield/evolve) is issue #8's territory.
- The four PRs collectively address the BUILD → HARDEN transition gap identified in the project README — automated quality gates (Doctorow) and autonomous execution (headless) make the build phase robust enough to feed into contrib-prep.

### PR Summary

| PR | Title | Status | Lines |
|----|-------|--------|-------|
| #3 | Fix migrations for compiled binary | Open | ~50 |
| #4 | Allow N/A sections in verify.md | Open | ~80 |
| #6 | AI-powered headless Doctorow Gate | Open | ~400 |
| #7 | Full headless mode for autonomous pipelines | Open | 1038 |

---

## 2026-01-31 — `specflow contrib-prep` CLI Shipped

**Author:** @jcfischer (agent: Ivy)
**Phase:** Build
**Status:** First lifecycle extension command implemented and merged to specflow-bundle main
**Issues:** #4, #5

### What Happened
- Implemented `specflow contrib-prep` as a new CLI command in the [SpecFlow bundle](https://github.com/jcfischer/specflow-bundle) with a 5-gate workflow: Inventory, Sanitize, Extract, Verify, Approve
- Built in 6 implementation phases with TDD throughout — 670 tests passing (expanded from 641 baseline)
- Added SQLite state tracking (new migration), file classification engine, secret/PII scanning (gitleaks + regex), git extraction with tag-before-contrib pattern, and branch verification
- Created `tasks-quality` evaluation rubric (was missing — only `spec-quality` and `plan-quality` existed)
- Updated README with full lifecycle diagrams and pai-collab integration illustrations
- All three eval rubrics pass: spec 98%, plan 100%, tasks 100%

### What Emerged
- The 5-gate pattern maps cleanly to _SPECFIRST's gates 1-6 but as a single CLI command with injectable approvers for testing
- `GateApprover` injection pattern allows swapping readline for auto-approvers in tests — same approach could work for Maestro playbook integration
- Resume support via `state.gate` checking means interrupted workflows pick up where they stopped — important for the long-running scenarios identified in Maestro issue #235
- The contrib-prep implementation directly addresses issues #4 (align with Jens on CLI design) and #5 (formalize Contrib Prep)
- Next step: Maestro playbook wrapping the CLI (issue #5), then `specflow review` and `specflow release`

### CLI Reference

```bash
specflow contrib-prep F-1              # Full 5-gate workflow
specflow contrib-prep F-1 --inventory  # File inventory only
specflow contrib-prep F-1 --sanitize   # Secret/PII scanning only
specflow contrib-prep F-1 --extract    # Extract to clean branch
specflow contrib-prep F-1 --verify     # Verify contribution branch
specflow contrib-prep F-1 --dry-run    # Preview without git changes
specflow contrib-prep F-1 --base dev   # Custom base branch
```

---

## 2026-01-31 — Project Proposed on Blackboard

**Author:** @mellanon (agent: Luna)
**Phase:** Proposal
**Status:** Project documented on blackboard with SOPs and tooling maturity analysis

### What Happened
- Documented four missing SpecFlow playbooks: Contrib Prep, Review, Release, Open Spec
- Created detailed [project README](README.md) with gap analysis, pipeline diagrams, and anti-patterns
- Mapped tooling maturity across the full lifecycle (see [SOPs README](../../sops/README.md))
- Identified acceptance hardening as a missing phase between Build and Contrib Prep

### What Emerged
- The blackboard itself is the first test of the lifecycle — Signal will be the first project shipped through it
- Five PAI skills needed to make the lifecycle agent-fluent: Collab, Review, Contrib Prep, Release, Open Spec

**Track open work:** [SpecFlow lifecycle issues](https://github.com/mellanon/pai-collab/issues?q=is%3Aissue+label%3Aproject%2Fspecflow-lifecycle)

---

## 2026-01-25 — PR to SpecFlow Bundle + HITL Gate Gaps

**Author:** @mellanon
**Phase:** Discovery
**Status:** PR submitted to SpecFlow bundle; Maestro feedback issues filed

### What Happened
- @mellanon submitted PR to [SpecFlow bundle](https://github.com/jcfischer/specflow-bundle) with skip validation gate and SKILL.md restructure
- Filed Maestro feedback issues [#231–237](https://github.com/runmaestro/maestro/issues) covering HITL gates, exit conditions, and token exhaustion
- Identified that Maestro's autonomous execution model lacks approval checkpoints — agents run to completion or fail, with no pause-and-confirm pattern

### What Emerged
- The HITL speed problem: Maestro agents can build faster than humans can review. [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) discovered as a potential HITL orchestration tool
- SpecFlow bundle covers SPECIFY → PLAN → TASKS → IMPLEMENT → COMPLETE — everything after COMPLETE is a gap

---

## 2026-01-23–24 — SpecFlow + Maestro First Full Run

**Author:** @mellanon
**Phase:** Discovery
**Status:** Two parallel agents ran SpecFlow Development playbook for ~24 hours

### What Happened
- @mellanon created [Maestro PAI Playbooks](https://github.com/mellanon/maestro-pai-playbooks) based on @jcfischer's SpecFlow bundle — wrapping SpecFlow's spec-driven methodology in Maestro's autonomous execution format
- Two parallel Maestro agents ran the SpecFlow Development playbook against the Signal spec, producing 18 features and 708 tests in ~24 hours of autonomous execution
- @jcfischer also started using Maestro independently, discussed merging autorun versions back into the SpecFlow bundle
- @jcfischer made updates to the bundle: triggers, feature branches, validation improvements

### What Emerged
- The 80/20 split pattern: Maestro produced ~25,500 lines (255 commits) autonomously, but ~9,800 lines (11 commits) of human hardening was needed for integration fixes, infrastructure gaps, and emergent features — this became the evidence for adding an acceptance hardening phase to the lifecycle
- @jcfischer suggested merging the autorun/Maestro versions into the SpecFlow bundle itself, signaling convergence between the two toolchains

---

## 2026-01-22 — SpecFlow Bundle Adopted for Signal

**Author:** @mellanon, @jcfischer
**Phase:** Discovery
**Status:** SpecFlow bundle used as foundation for Signal build; SkillEnforcer created

### What Happened
- @mellanon shared the [Signal spec](https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7) on Discord — the observability requirements that would become the first real SpecFlow workload
- @jcfischer created the [SkillEnforcer hook](https://github.com/jcfischer/pai-skill-enforcer) the same day — deterministic skill surfacing triggered by the spec discussion
- Community feedback on the spec: Zeb suggested "Signal" as codename, Rudy proposed POST-until-stored pattern and Argus naming from Greek mythology, Steffen discussed OpenCode migration

### What Emerged
- The SpecFlow bundle's specify phase worked well for structured spec creation, but the question of what happens *after* the code is built — contrib prep, review, release — had no tooling answer
- Cross-pollination between community members (spec feedback, tool creation, methodology discussion) demonstrated exactly the collaboration pattern that would later become the blackboard model

---

## 2026-01-09 — SpecFlow Bundle Created

**Author:** @jcfischer
**Phase:** Pre-history
**Status:** SpecFlow bundle established as a unified spec-driven development methodology

### What Happened
- @jcfischer created the [SpecFlow bundle](https://github.com/jcfischer/specflow-bundle) (Jan 9) — unifying his earlier SpecKit and SpecFlow tools into a single PAI skill for spec-driven development
- The bundle provides a structured pipeline: SPECIFY → PLAN → TASKS → IMPLEMENT → COMPLETE, with SQLite state tracking, 8-phase interview protocols for requirements elicitation, and quality gates between phases
- Rapidly iterated over the first week: unified SpecKit/SpecFlow (Jan 14), added batch mode with migrations, interviews, revisions, and quality gates (Jan 16), applied meta-prompting best practices to all AI prompts (Jan 16)
- Accompanied by a "Why SpecFlow?" introduction explaining the philosophy: specs as the primary artifact, code as a liability (citing Cory Doctorow), AI agents guided by structured specifications rather than ad-hoc prompting

### What Emerged
- SpecFlow established the core idea that would shape all subsequent collaboration: **specs are the source of truth, not code**. The bundle enforced this through structured interviews, validation gates, and deterministic phase transitions
- The pipeline covered the build phase comprehensively but stopped at COMPLETE — everything after (contrib prep, review, release) remained manual, which became the gap this project aims to fill

---
