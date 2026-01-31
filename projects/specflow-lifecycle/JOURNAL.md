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
