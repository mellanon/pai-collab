# pai-secret-scanning — Journey Log

A structured, append-only log of what happened on this project. New entries go at the top. Each entry is a self-contained block — submit via PR, no merge conflicts.

**Maintainer:** @jcfischer

---

## 2026-01-31 — PROJECT.yaml Schema Defined and All Files Aligned

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** PROJECT.yaml schema documented in CONTRIBUTING.md, all four project files aligned (closes #22)

### What Happened
- Identified that three (now four) PROJECT.yaml files used inconsistent field names and structures — no canonical schema existed for contributors to reference
- Defined canonical schema in CONTRIBUTING.md with required fields (name, maintainer, status, contributors) and optional fields (type, upstream, fork, source, paths, tests, docs)
- Three examples: upstream contribution (Signal), standalone tool (pai-secret-scanning), lifecycle/process project (specflow-lifecycle)
- Aligned all four existing PROJECT.yaml files to canonical schema:
  - pai-secret-scanning: `project:` → `name:`, `tests.command:` → `tests:`, added `type: infrastructure`
  - signal: added `maintainer: mellanon`, added `status: contrib-prep`
  - specflow-lifecycle: added `maintainer: mellanon`, added `status: building`
  - skill-enforcer: added `maintainer: jcfischer`, added `status: shipped`, added `contributors`
- Status values follow the lifecycle: proposed → building → hardening → contrib-prep → review → shipped → evolving

### What Emerged
- The schema naturally splits into two project types: upstream contributions (upstream/fork/contrib_branch/paths) and standalone tools (source.repo/source.branch). Both share the same required fields.
- Status values map directly to lifecycle phases — a project's status tells you where it is in the pipeline
- The `contributors` section (from #19) is now a required field — every project declares its trust zones

---

## 2026-01-31 — Trust Zones Implemented in CONTRIBUTORS.yaml and PROJECT.yaml

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** CONTRIBUTORS.yaml created, all PROJECT.yaml files updated with trust zones (closes #19)

### What Happened
- Created `CONTRIBUTORS.yaml` at repo root — repo-level trust zones for all contributors
- @mellanon as `maintainer` (repo owner), @jcfischer as `trusted` (first external contributor, promoted by mellanon)
- Updated all three `PROJECT.yaml` files with project-level trust zones:
  - pai-secret-scanning: @jcfischer as project `maintainer`
  - signal: @mellanon as project `maintainer`
  - specflow-lifecycle: @mellanon as project `maintainer`
- Two-level scoping now concrete: Jens is `trusted` repo-wide but `maintainer` of pai-secret-scanning
- CONTRIBUTORS.yaml header documents the three zones and references TRUST-MODEL.md

### What Emerged
- The two-level model is clean in practice: one file at root for repo-wide trust, one section in each PROJECT.yaml for project governance
- Default for unlisted contributors is untrusted — you don't appear in CONTRIBUTORS.yaml until promoted
- The schema is deliberately simple: zone, date, promoted_by, optional notes. No automation, no scoring — just manual declarations by maintainers

---

## 2026-01-31 — Inbound SOP and CLAUDE.md Self-Alignment

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Inbound contribution SOP created (#20 closed), CLAUDE.md self-alignment check added

### What Happened
- Created `sops/inbound-contribution-protocol.md` (#20) — 8-step protocol for processing external PRs: RECEIVE → ASSESS → REVIEW → DECIDE → MERGE → FOLLOW UP → JOURNAL → ANNOUNCE
- SOP codifies the exact pattern used to process PR #12, including Council debate as the recommended review method for non-trivial PRs
- Step 1 (Receive) integrates trust model: check contributor zone before reading content, apply review intensity accordingly
- Includes worked example showing how PR #12 mapped to each step
- Added mandatory self-alignment check to top of CLAUDE.md: after every policy change, issue closure, or SOP modification, review CLAUDE.md against all policy documents and SOPs to ensure alignment
- Corrected CLAUDE.md's policy change protocol: this file is NOT a leaf node — it's the codified version of procedures and must stay in sync bidirectionally
- Updated SOPs README with inbound SOP entry, updated CLAUDE.md SOP table to remove "(when created)" placeholder
- Ran self-alignment check: verified CLAUDE.md accurately reflects the new inbound SOP

### What Emerged
- CLAUDE.md as "codified procedures" means it must be treated as a living document that evolves with every SOP and policy change — not a static instruction file
- The self-alignment check creates a feedback loop: change SOP → check CLAUDE.md → change CLAUDE.md → check SOPs → confirm alignment
- The inbound SOP completes the contribution lifecycle: outbound (contribution-protocol.md) covers preparing code, inbound covers receiving it. Together with review-format.md, the full cycle is documented.

---

## 2026-01-31 — Agent Protocol, Two-Level Scoping, SOP Alignment

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** CLAUDE.md created (#21), TRUST-MODEL.md updated with two-level scoping, SOPs aligned with trust model

### What Happened
- Added two-level trust zone scoping to TRUST-MODEL.md: repo-level (CONTRIBUTORS.yaml) for overall trust, project-level (PROJECT.yaml) for project governance. A contributor can be maintainer of their project without elevated repo-level trust.
- Added zero-trust framing: trust zones control authority (what you can decide), not immunity (what you skip). Nobody exempt from scanning.
- Created CLAUDE.md (#21) — agent operating protocol for pai-collab: journaling protocol (after every commit, update JOURNAL.md), issue protocol, trust model compliance, SOP compliance, policy change protocol (check downstream impact when modifying policy docs)
- Followed CLAUDE.md's own policy change protocol: reviewed all SOPs against TRUST-MODEL.md for alignment
- Updated review-format.md — added trust zone check as step 1 of "How to Review a Blackboard Project"
- Updated contribution-protocol.md — added TRUST-MODEL.md reference
- Updated SOPs README — added TRUST-MODEL.md and CLAUDE.md cross-references
- Created issue #20 for inbound contribution processing SOP — codifying the 8-step pattern from PR #12 (receive, review, council debate, decision, merge, follow-up issues, journal, announce)

### What Emerged
- CLAUDE.md creates a self-reinforcing system: it instructs agents to journal, and to check downstream impact when modifying policy — which itself is a journalable event
- The policy change protocol is the key insight: when you change TRUST-MODEL.md, you must check whether SOPs, CONTRIBUTING.md, and CLAUDE.md need updating. This prevents documents from drifting out of alignment.
- Two-level trust scoping resolves the "who governs what" question cleanly — Jens governs pai-secret-scanning but can't modify the trust model. Repo maintainers retain override authority.

---

## 2026-01-31 — Three-Zone Trust Model: Maintainer as Distinct Level

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** TRUST-MODEL.md updated from two zones to three, issue #19 updated

### What Happened
- Reviewed Council debate output against TRUST-MODEL.md and issue #19 — identified that Ava's Wikipedia three-zone model was lost during synthesis
- Original Council Round 1: Ava proposed Zone 1 (untrusted), Zone 2 (established), Zone 3 (maintainers). Round 2: Rook argued two zones sufficient. Synthesis simplified to two, losing the maintainer distinction.
- Maintainers were described in "Maintainer Responsibilities" with elevated duties (promote, demote, merge, modify SOPs) but not formalized as a trust zone
- Updated TRUST-MODEL.md to three zones: untrusted (default, Layers 4-6 triggered), trusted (promoted, Layers 1-3 only), maintainer (governance authority)
- Key distinction: trusted contributors can have content loaded without extra scanning, but only maintainers can promote others, merge PRs, or modify the trust model itself
- Updated issue #19 with three-zone PROJECT.yaml schema

### What Emerged
- The gap was subtle — maintainers had responsibilities but no formal trust designation above "trusted contributor"
- Formalizing maintainer as a zone makes the privilege model explicit: it's not just about content trust (scanning), it's about governance authority (who controls the collaboration process)
- As pai-collab grows, maintainer promotion should require approval from at least two existing maintainers — preventing unilateral trust escalation

---

## 2026-01-31 — Trust Architecture: From Tool to Infrastructure

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Six trust architecture issues created (#15–#19), TRUST-MODEL.md committed

### What Happened
- Pushed deeper on the question: if pai-secret-scanning solves outbound secrets, what about inbound threats?
- Ran a Council debate (Architect, Engineer, Security, Researcher) on trust architecture for multi-agent collaboration
- Council identified three threat vectors: outbound secrets (solved), inbound prompt injection (gap), cross-agent manipulation (gap)
- Council converged on six-layer defense model: pre-commit scanning, CI gate, fork+PR, content trust boundary, tool restrictions, audit trail
- Created TRUST-MODEL.md as a timeless policy document — three threat vectors, six defense layers, contributor and maintainer responsibilities (later expanded to three trust zones — see entry above)
- Created five new issues tracking Council recommendations: TRUST-MODEL.md (#15, closed), LoadContext scanning (#16), review mode (#17), audit logging (#18), trust zones (#19)
- Added CI gate investigation scope to this issue (#13) — pai-collab should run pai-secret-scanning on its own PRs
- Prioritized all issues P1–P4 with dependency reasoning documented on each

### What Emerged
- pai-secret-scanning is Layer 1 and Layer 2 of a six-layer trust model — foundational, but only covers one of three threat vectors
- The inbound threat (prompt injection via loaded markdown) is the primary unsolved gap — an agent loading a JOURNAL.md entry could execute hidden instructions
- Two trust zones (untrusted/trusted) are sufficient at current scale — start simple, automate trust scoring later if scale demands
- The trust model creates a clear roadmap: outbound is solved, inbound needs LoadContext hook extension and tool restrictions, both are upstream PAI core contributions

---

## 2026-01-31 — Contribution Onboarding Clarified

**Author:** @mellanon (agent: Luna)
**Phase:** Contrib Prep
**Status:** Issue #14 closed — REGISTRY.md, CONTRIBUTING.md, README.md updated

### What Happened
- Processing PR #12 revealed a gap: contribution docs assumed all contributions need full project directories
- Created issue #14 to clarify onboarding for different contribution types
- Updated REGISTRY.md with expanded "How to Join" steps and contribution types table
- Updated CONTRIBUTING.md with "Types of Contributions" section distinguishing coordinated projects, standalone tools, process improvements, ideas, and reviews
- Updated README.md "Get Involved" from 4 to 6 steps

### What Emerged
- The contribution model needs to accommodate different scales: a full project with PROJECT.yaml vs a standalone tool vs a process improvement vs just an idea
- pai-secret-scanning arrived as a standalone tool — the docs now have a clear path for that pattern

---

## 2026-01-31 — Reframed as Collaboration Infrastructure

**Author:** @mellanon (agent: Luna)
**Phase:** Contrib Prep
**Status:** Issue #13 updated with infrastructure framing, SOP updated

### What Happened
- Reframed pai-secret-scanning from "just another project" to collaboration infrastructure — a prerequisite for safe contribution
- Updated the Contribution Protocol SOP step 2 (Sanitize) to reference pai-secret-scanning as a pre-commit hook prerequisite
- Updated issue #13 body with lifecycle positioning and infrastructure framing

### What Emerged
- The question "when do you need this tool?" has a clear answer: before any contribution leaves your private instance
- This positions pai-secret-scanning as the automated gate that enables trust between operators — without it, every PR is a potential exposure event

---

## 2026-01-31 — First External PR Merged

**Author:** @mellanon (agent: Luna)
**Phase:** Review
**Status:** PR #12 merged — Ivy agent and pai-secret-scanning registered

### What Happened
- @jcfischer submitted PR #12 — first external contribution to pai-collab
- PR registered Ivy as Jens's named agent and added pai-secret-scanning to the Active Projects table in REGISTRY.md
- Ran a Council debate on the PR: four agents reviewed the diff
- Security agent pushed for immediate merge — scanning tooling shouldn't wait for structural perfection
- Architect flagged that the project links directly to GitHub rather than having a `projects/` directory
- Council converged: merge now, track structural follow-up as an issue
- Merged PR #12, created issue #13 (this issue — project directory), created issue #14 (contribution docs clarity)
- Posted PR comment referencing issue #13 for follow-up

### What Emerged
- First external contribution processed through the blackboard — the collaboration model works
- The Council debate pattern proved useful for PR review: multiple perspectives catch what a single reviewer misses
- Discord announcement shared with the community, showing the full review process transparently

---
