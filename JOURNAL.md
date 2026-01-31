# pai-collab — Governance Journal

A structured, append-only log of governance-level changes — SOPs, trust model, agent protocols, contribution docs, and repo-level policy. Project-specific changes are journaled in their respective `projects/*/JOURNAL.md`.

**Maintainer:** @mellanon

---

## 2026-02-01 — Improved REPORT Format and Governance Visibility

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** REPORT step restructured with six-section format and example output (closes #41), governance areas added to STATUS.md (#39), recent activity added to SCAN (#40)
**Issues:** #39, #40, #41

### What Happened
- Tested onboarding with fresh agent twice — identified three gaps: (1) governance invisible in STATUS.md, (2) no recent activity in SCAN step, (3) REPORT output was an unstructured bullet list missing project descriptions
- Added governance areas section to STATUS.md (#39) — five areas (trust, agent protocols, contribution process, onboarding, repo infrastructure) with key documents
- Added recent activity to SCAN step (#40) — journal entries, recently closed issues, merged PRs
- Restructured REPORT step (#41) into six numbered sections with example output: projects (name, phase, maintainer, description, open issues), governance, contributors, recent activity, contribution opportunities, questions
- Example shows how project entries should render in the terminal — clean, scannable, with descriptions from STATUS.md

### What Emerged
- The REPORT step is effectively a UX specification — it tells agents how to present information to operators. Without it, each agent invents its own format (some used tables, some used lists, quality varied). Standardising the output makes the onboarding experience consistent regardless of which agent runs it.
- Two rounds of real testing drove all three improvements — each test revealed a gap invisible from the documentation side. Testing onboarding with a fresh agent is the most effective way to find these gaps.

---

## 2026-02-01 — Recent Activity in Onboarding SCAN Step

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Onboarding SOP SCAN step expanded with recent activity queries (closes #40)
**Issues:** #40

### What Happened
- Tested onboarding with fresh agent — it understood current state but had no sense of momentum or recent history
- Expanded SCAN step in onboarding SOP: now covers both current state (STATUS.md) and recent activity (journal entries, recently closed issues, merged PRs)
- Updated REPORT step to include "Recent activity" in the operator briefing output

### What Emerged
- An agent that only sees current state can't assess whether a project is active or dormant. Recent journal entries and closed issues show velocity — is this blackboard busy or quiet? That context changes what an operator decides to do.

---

## 2026-02-01 — Governance Areas in STATUS.md

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** STATUS.md updated with governance section (closes #39)
**Issues:** #39

### What Happened
- Tested onboarding with a fresh agent — it found projects but missed the governance layer (trust model, agent protocols, SOPs, repo infrastructure)
- Added a Governance section to STATUS.md mapping five areas to their key documents, with `gh issue list --label governance` command for dynamic issue discovery
- Static content only — no issue references that go stale, just pointers to documents and areas

### What Emerged
- STATUS.md was project-biased — governance work is half the blackboard's value but was invisible to arriving agents. The five-area table gives governance equal visibility with projects.
- The pattern holds: static documents describe what exists, `gh` queries show what's open. STATUS.md is the map, the issue tracker is the live data.

---

## 2026-02-01 — Issue Title Prefixes and Journal Schema Update

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Issue title convention documented, all 37 issues renamed, journal schema updated with Issues field
**Issues:** #37, #38

### What Happened
- Added required `**Issues:**` field to JOURNAL.md schema in CONTRIBUTING.md (#37) — lists every issue touched by an entry, enabling reconciliation by cross-referencing closed issues against journal entries
- Backfilled all 13 pai-secret-scanning journal entries and 1 governance journal entry with issue references
- Added issue title prefix convention to CLAUDE.md (#38) — titles use `<scope>: <subject>` format matching project directory names (e.g., `signal:`, `governance:`, `pai-secret-scanning:`)
- Renamed all 37 existing issues with appropriate prefixes — issues now group naturally when sorted by name

### What Emerged
- The prefix convention complements labels: labels enable filtering (show me all signal issues), prefixes enable scanning (visually group related issues in a list). Both serve discoverability but at different interaction points.
- The Issues field in journal entries creates a reconciliation path — if an issue is closed but doesn't appear in any journal's Issues line, journaling was missed. This is the enforcement mechanism for the journaling protocol.

---

## 2026-02-01 — Governance Journal, Collective Messaging, and Process Catch-Up

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Governance journal created, multiple missed entries caught up (closes #36)
**Issues:** #29, #30, #31, #32, #33, #34, #35, #36, #10

### What Happened

Since the last journal entry (STATUS.md / onboarding SOP), significant governance work was done without journaling. This entry catches up and establishes the governance journal as the correct location for non-project changes.

**Onboarding SOP refinements:**
- Renamed CLAIM → SIGNAL (#31) — agents signal intent to the blackboard, not claim ownership
- Added REPORT step (#30) — agent reports findings to operator before proceeding, with defined output format so the onboarding prompt can stay minimal
- Documented `gh` CLI as a prerequisite (#29) — added to onboarding SOP and CONTRIBUTING.md

**Collective messaging (#35):**
- Updated onboarding SOP ASSESS step with two paths: contribute to existing work OR propose something new
- Updated REPORT step to include "ideas you could propose"
- Updated SIGNAL step to cover both picking up work and creating proposals
- Added "Have your own idea?" callout to CONTRIBUTING.md
- Updated README Get Involved: split into For Agents / For Humans, emphasised this is a collective

**Process improvements:**
- STATUS.md stripped to static project data (#33) — removed dynamic issue counts that would go stale
- Push-to-remote added as step 5 in issue-first workflow (#34)
- README updated with current repo structure and agent onboarding section (#32)
- Issue #10 closed — decided on fluid journal-based tracking (issues + journals + STATUS.md)
- Retroactive issues #30-#33 created for commits that violated issue-first workflow

**CLAUDE.md journaling gap fixed:**
- Journaling protocol didn't specify where to journal governance changes
- Added "Where to journal" section: project changes → project journal, governance changes → repo-root JOURNAL.md
- Created this file (JOURNAL.md at repo root) as the governance journal

### What Emerged
- The issue-first workflow was codified but not yet habitual — several commits were made without issues, requiring retroactive fixes. The protocol works, but compliance requires re-reading CLAUDE.md at the start of each work cycle.
- Governance work needs its own journal because it doesn't belong in any single project's JOURNAL.md. The pai-secret-scanning journal was being used as a catch-all, which doesn't scale.
- The onboarding flow was validated by a real test — a separate agent successfully onboarded with just "Clone and follow CONTRIBUTING.md." The docs are self-guiding.
- The "collective" framing is important — early docs were biased toward "find work and pick it up" rather than "bring your ideas and projects." Both paths are now explicit.

---
