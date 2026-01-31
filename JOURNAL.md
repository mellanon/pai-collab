# pai-collab — Governance Journal

A structured, append-only log of governance-level changes — SOPs, trust model, agent protocols, contribution docs, and repo-level policy. Project-specific changes are journaled in their respective `projects/*/JOURNAL.md`.

**Maintainer:** @mellanon

---

## 2026-02-01 — Layer 1 automated review on PRs #56 and #57

**Author:** @mellanon (agent: Luna)
**Phase:** Review
**Status:** Schema validation posted as PR comments on both PRs; review request issue #67 created
**Issues:** #67, #56, #57

- Ran `validate-schemas.mjs`, `check-registry-alignment.mjs`, `check-status-alignment.mjs` locally against both PR branches
- PR #56 (pai-content-filter): 2 errors — missing JOURNAL.md in project directory, missing from STATUS.md. Also CONTRIBUTORS.yaml uses old schema. Posted structured comment with required fixes
- PR #57 (secret scanning CI gate): all checks pass. Clean implementation with proper journaling, issue references, and README update. Posted clean report
- Both PRs have base branch drift (behind main) — governance files updated since PRs opened. Not PR issues, rebase resolves
- Created #67 requesting external cybersecurity review of both PRs, labelled `seeking-contributors` + `expertise-needed` + `parallel-review` + `security`

**What emerged:** First real use of Layer 1 automated gates as a review tool. The scripts caught exactly what we expected — schema gaps in #56, clean pass for #57. This validates the CI investment from #59. External review for security substance now tracked via #67.

---

## 2026-02-01 — Close documentation audit (#64)

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Audit complete — 17/25 resolved, 8 deferred (low priority), all majors resolved
**Issues:** #64

- Closed #64 with full resolution summary referencing durable artifact at `reviews/2026-02-01-documentation-audit-mellanon.md`
- Pattern established: issues provide traceability, review documents in `reviews/` provide substance
- 8 deferred findings are cosmetic, by-design, or nice-to-have — can be picked up as standalone issues if relevant

**What emerged:** This is the first governance review to complete the full issue → artifact → close cycle using the new `reviews/` directory. The pattern works: the issue tracks the work, the document preserves the findings, and the closing comment links them together.

---

## 2026-02-01 — Review naming, audit fixes, issue-tracked workflow

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Audit findings #1-3, #7, #25 resolved; review naming standardized with date prefix
**Issues:** #66, #64

- Standardized all review artifact naming to include date prefix: project reviews now `<date>-<topic>-review-<handle>.md`, governance reviews already had dates
- Added issue-tracked review workflow concept to review-format SOP and onboarding: issue provides traceability, document is the durable artifact contributed back via PR
- Added optional branching fields (`fork`, `source_branch`, `contrib_branch`) to skill-enforcer and specflow-lifecycle PROJECT.yaml (audit #1-3)
- Added numbering legend to sops/README.md: 1-6 sequential, 0 prerequisite, ∞ parallel (audit #7)
- Clarified Council debate in inbound-contribution-protocol.md: these are PAI Council skill agent roles, not human assignments, with pointer to the Council skill (audit #25)

**What emerged:** The date prefix in review names is essential for chronological traceability — without it, you can't tell when a review was conducted. The issue-tracked workflow makes explicit what was implicit: every review should be traceable through an issue, but the substantive artifact is the document, not the issue.

---

## 2026-02-01 — Add governance reviews directory structure

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** `reviews/` directory created at repo root for governance-level review artifacts
**Issues:** #65

- Created `reviews/` directory with README.md (naming convention, what belongs here)
- Moved documentation audit report from issue #64 into `reviews/2026-02-01-documentation-audit-mellanon.md` as first governance review artifact
- Updated CONTRIBUTING.md: "What Goes Where" table and "Types of Contributions" table now distinguish project reviews (`projects/*/reviews/`) from governance reviews (`reviews/`)
- Updated CLAUDE.md: added `reviews/` to repository structure tree and artifact schemas table
- Updated sops/review-format.md: report step now shows both project and governance artifact paths
- Updated sops/parallel-reviews.md: artifact location and naming convention updated for governance scope

**What emerged:** The gap was identified during #64 audit — governance-level review artifacts (trust model audits, documentation audits) had no canonical home. The trust model review from #24 was routed to `projects/signal/reviews/` despite being repo-wide. This directory fills that structural gap.

---

## 2026-02-01 — Fix remaining audit findings + STATUS.md alignment validation

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** All major audit findings now resolved, CI coverage at 14 automated checks
**Issues:** #59, #63

### What Happened
- Fixed STATUS.md specflow-lifecycle maintainer to match PROJECT.yaml (was listing two maintainers, PROJECT.yaml has one)
- Clarified `seeking-contributors` dual role in CLAUDE.md as a signal label that pairs with collaboration labels
- Added `check-status-alignment.mjs` — validates STATUS.md project phases and maintainers match PROJECT.yaml
- Upgraded missing JOURNAL.md from warning to error (consistent with README.md)
- Added label deletion reference to scope label lifecycle for archived projects

### What Emerged
- CI now has 14 automated checks covering 3 alignment scripts (REGISTRY, STATUS, schema) plus workflow-level checks (journal, issue references, STATUS updates). The audit revealed that STATUS.md was the least-maintained document — it had drifted from PROJECT.yaml on maintainers. The new alignment script prevents this.

---

## 2026-02-01 — Documentation audit + CI validation coverage expansion

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** 25 audit findings identified, major issues fixed, CI coverage expanded from 6 to 12 CLAUDE.md rules
**Issues:** #59, #63

### What Happened
- Ran comprehensive audit across all 20 documentation files — found 25 issues (6 major, 18 minor, 1 trust audit gap)
- Fixed CONTRIBUTORS.yaml schema: standardized to zone/since/promoted_by, removed non-standard fields
- Added `type/governance` to CLAUDE.md label taxonomy
- Enhanced CI: journal phase validation, project journal validation, CONTRIBUTORS.yaml schema, PR/commit issue reference checks
- Tested locally: phase validation correctly flagged pre-standard entries as warnings

### What Emerged
- CI now enforces 12 of the CLAUDE.md rules automatically (was 6). Remaining rules (trust zone checks, SOP structure, scope label lifecycle) require runtime context that would add complexity without proportional value. Current coverage catches the most common PR issues.

---

## 2026-02-01 — Operationalize requesting collaboration + journal enforcement in CI

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Requesting collaboration pattern fully operationalized, GitHub Actions enhanced with journal checks
**Issues:** #61, #59, #62

### What Happened
- Expanded CLAUDE.md communication protocol with structured Discord broadcast template and step-by-step requesting help workflow — agents now have inline guidance on when and how to call for help
- Added "Request help" path to onboarding REPORT's HOW TO CONTRIBUTE section — newcomers see requesting collaboration as a contribution path alongside review, build, and propose
- Enhanced GitHub Actions (#59) with journal entry enforcement: warns when project files change without project JOURNAL.md update, warns when governance files change without root JOURNAL.md update
- Broadened CI trigger paths to catch all project changes, SOPs, and governance docs — not just PROJECT.yaml

### What Emerged
- Journal enforcement in CI closes a gap that was the most-missed requirement in PRs. The automated warning is gentler than blocking (warnings not errors) because journal entries sometimes arrive in follow-up commits. But the signal is clear: if you changed files, you should journal.

---

## 2026-02-01 — Automated schema enforcement, review SOP update, requesting collaboration pattern

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Three governance issues actioned — automated PR checks, review SOP modernized, call-for-help pattern documented
**Issues:** #59, #60, #61, #58

### What Happened
- **#59 — GitHub Actions schema enforcement.** Created `.github/workflows/pr-schema-check.yml` with two validation scripts: `validate-schemas.mjs` (PROJECT.yaml required fields, license, status, contributors schema, JOURNAL.md format) and `check-registry-alignment.mjs` (REGISTRY.md ↔ PROJECT.yaml status match). Tested locally — all 4 projects pass. This implements Layer 1 (automated gates) from the review format SOP.
- **#60 — Review format SOP update.** Major rewrite: added SCHEMA as first pipeline step, updated Layer 1 from "available" to "operational", added community reviewer pathway with trust-building framing, added proposal review type (lightweight for ideas/competing-proposals), added schema compliance and claim verification to review template, cross-referenced parallel reviews/competing proposals/inbound SOPs.
- **#61 — Requesting collaboration SOP.** New SOP with 6-step pipeline (IDENTIFY → SIGNAL → SCOPE → BROADCAST → TRACK → ACKNOWLEDGE). Covers how active contributors call for help: review, expertise, implementation, second opinions. Includes Discord broadcast template and worked example from PR #56. Created `expertise-needed` label.
- **#58 closed** — Review capacity work addressed through onboarding HOW TO CONTRIBUTE section, parallel reviews SOP, and requesting collaboration SOP. Follow-ups tracked in #59, #60, #61.

### What Emerged
- The review format SOP was the most outdated document — written before parallel reviews, competing proposals, community reviewers, and automated checks existed. Updating it revealed that the blackboard's review infrastructure has matured significantly: Layer 1 is now automated, Layer 3 has a documented community pathway, and there's a formal mechanism for requesting help. The gap is now Layer 2 (Maestro playbook) running consistently on incoming PRs.

---

## 2026-02-01 — Parallel collaboration SOPs and review capacity

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Two new SOPs codified, review capacity issue created
**Issues:** #51, #52, #58

### What Happened
- Created `sops/parallel-reviews.md` — 6-step pipeline (INVITE → SCOPE → REVIEW → COLLECT → SYNTHESIZE → DECIDE) for inviting multiple independent reviews on the same topic. Covers independence preservation, artifact naming (`<topic>-review-<handle>.md`), synthesis documents, and worked example from #24.
- Created `sops/competing-proposals.md` — 6-step pipeline (FRAME → INVITE → PROPOSE → EVALUATE → SELECT → IMPLEMENT) for exploring multiple approaches before committing. Covers lightweight proposals (issues not implementations), evaluation criteria, and synthesis/selection by maintainer.
- Updated SOP README and CLAUDE.md with references to both new SOPs.
- Created #58 — review capacity issue inviting cybersecurity community to help review inbound contributions. Framed as low-barrier entry: no code required, review against schemas and trust model. Positions review competence as the trust-building path from untrusted → trusted.

### What Emerged
- Review capacity is the missing operational layer. The blackboard has good schemas, SOPs, and trust model — but a single reviewer is a bottleneck and single point of failure. Inviting community reviewers solves capacity *and* strengthens the trust model through real-world validation. The parallel reviews SOP makes this discoverable and structured rather than ad-hoc.

---

## 2026-02-01 — Licensing requirements for project acceptance

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Added licensing policy — permissive licenses required for all projects
**Issues:** #55

### What Happened
- Created `type/governance` label and issue #55 proposing licensing requirements
- Added `license` field to PROJECT.yaml schema as required (SPDX identifier)
- Accepted licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause
- Added licensing policy section to CONTRIBUTING.md explaining rationale
- Added agent enforcement rule to CLAUDE.md (reject PRs without license or with copyleft)
- Backfilled all 4 existing projects with `license: MIT`

### What Emerged
- PAI's MIT license creates a hard constraint: copyleft contributions can't flow upstream without conflict. Making this explicit prevents future licensing disputes before they happen. The "no license = no acceptance" rule is particularly important for AI-generated contributions where copyright ownership is jurisdictionally uncertain.

---

## 2026-02-01 — Second external PR merged (specflow contrib-prep)

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** PR #53 merged — first lifecycle extension command, second external contribution processed
**Issues:** #53, #4, #5

### What Happened
- Processed PR #53 from @jcfischer/Ivy: specflow contrib-prep CLI shipped (670 tests, 5-gate workflow)
- Requested two schema fixes during review: removed `contributions:` field from PROJECT.yaml (log data, not config), added missing `**Issues:**` field to journal entry
- Contributor responded quickly to both — schema enforcement working as intended
- Closed #4 (align with jcfischer). Updated #5 (CLI done, Maestro playbook remaining)
- Updated CONTRIBUTING.md to explicitly state contributors map only has `zone` and `since`

### What Emerged
- The inbound SOP's comment-first flow (#50) wasn't needed here — this was a direct PR, not a comment-based contribution. But the review step caught schema violations, which validated the process.
- Schema enforcement through PR review is the practical mechanism for maintaining artifact quality. The contributor learned two patterns (no log data in config, Issues field required) that will carry forward.
- This is the second external PR (after #12). The process is becoming routine, which is the goal.

---

## 2026-02-01 — Parallel collaboration patterns

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Two new collaboration patterns proposed as seeking-contributors issues
**Issues:** #51, #52

### What Happened
- Created #51 — parallel reviews pattern: multiple independent reviews on the same topic, maintainer synthesizes
- Created #52 — competing proposals pattern: multiple approaches to the same problem, maintainer selects or merges
- Created two new labels: `parallel-review` and `competing-proposals`
- Updated CLAUDE.md label taxonomy with new Collaboration category
- Updated onboarding SOP DISCOVER step and REPORT template to surface these

### What Emerged
- The blackboard pattern (Hayes-Roth) naturally supports parallel knowledge sources — we just hadn't formalized it. These patterns make it explicit that multiple contributors working the same topic isn't duplication, it's the design.
- Both issues are tagged `seeking-contributors` — testing whether the blackboard can attract parallel collaboration on its own governance processes

---

## 2026-02-01 — First external review + comment-first contribution flow

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** First external review received and processed; inbound SOP updated with pre-PR phase
**Issues:** #50, #24, #16, #17, #18

### What Happened
- @jcfischer posted a structured trust model analysis on #24 — addressed all 5 review questions with CaMeL research (DeepMind, March 2025), Moltbook real-world evidence, and an offer to contribute to #16/#17/#18
- Maintainer acknowledged findings on #24, requested formalization as PR to `projects/signal/reviews/`
- Accepted contribution offers on #16 (content scanning), #17 (review mode/CaMeL), #18 (audit logging) — each referencing F-088 spec convergence
- Updated inbound SOP with pre-PR phase: COMMENT → EVALUATE → FORMALIZE, covering both human and agent-to-agent collaboration
- Added worked example based on #24

### What Emerged
- Comment-first is the natural contribution pattern — low friction entry, maintainer evaluates quality, then formalizes if valuable. This filters out noise before anyone invests in PR overhead.
- Independent architectural convergence (F-088 and our design arriving at the same layered approach) is strong validation signal — when two teams solve the same problem and arrive at the same architecture, the design is likely correct.
- This is the first external review on pai-collab. The governance framework is being tested by real contributions, not just by its creators.

---

## 2026-02-01 — Strict REPORT rendering rules

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Added anti-patterns to prevent bold markdown and numbered paragraphs in REPORT output
**Issues:** #49

### What Happened
- Fresh agent test showed `**bold**` rendering as literal asterisks in CLI and contribution opportunities formatted as numbered paragraphs instead of the category/issue template
- Added "Common mistakes" section with four explicit anti-patterns
- Changed rendering rules header from "Rendering rules" to "Rendering rules — STRICT"
- Added rule: the report IS the response — don't wrap in external format headers

### What Emerged
- LLMs default to markdown formatting (bold, headers, numbered lists) unless explicitly told not to. The SOP needs to fight against model defaults, not just specify the ideal — anti-patterns are as important as patterns.

---

## 2026-02-01 — Project archival SOP

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** New SOP for archiving inactive projects, added `archived` status value
**Issues:** #48

### What Happened
- Created `sops/project-archival.md` — IDENTIFY → DECIDE → ARCHIVE → NOTIFY pipeline
- Added `archived` to canonical lifecycle status values in CONTRIBUTING.md (schema + REGISTRY convention)
- Added archival SOP to SOPs README sequence table
- Revival process defined: propose via issue, owner approves, reset `created:` date

### What Emerged
- Archival is manual and that's correct for now — automated staleness detection would create false urgency in an async, volunteer-driven collective
- The `projects/` directory is never deleted, only status-changed — preserving the record of what was attempted and learned

---

## 2026-02-01 — Created date for PROJECT.yaml staleness tracking

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** New required `created:` field added to PROJECT.yaml schema
**Issues:** #47

### What Happened
- Added `created:` (date, required) to PROJECT.yaml schema in CONTRIBUTING.md
- Backfilled all 4 existing projects with 2026-01-31
- Updated all 3 schema examples in CONTRIBUTING.md

### What Emerged
- This enables manual archival decisions — maintainer can query projects by age and activity to identify stale proposals. No automation needed yet; the date is the foundation.

---

## 2026-02-01 — Elevate security/trust issues to seeking-contributions

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** Cross-cutting security issues now surface as contribution opportunities, not buried under projects
**Issues:** #46, #16, #17, #18

### What Happened
- Added `seeking-contributors` label to #16 (content scanning), #17 (review mode), #18 (audit logging)
- Restructured REPORT template: renamed section to SEEKING CONTRIBUTIONS, grouped by category (governance, security & trust, tooling)
- Removed cross-cutting issues from project listings — they belong in contributions section
- Updated rendering rules: issues with cross-cutting labels represent ecosystem-level work, not project-scoped tasks

### What Emerged
- Project-scoped labels hide contribution opportunities — security work filed under `project/signal` is invisible to security-minded contributors who don't care about Signal specifically
- The contribution section should be the primary call-to-action, not an afterthought

---

## 2026-02-01 — Rich CLI UX for onboarding REPORT

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** REPORT format redesigned with Coupa-style rendering
**Issues:** #45

### What Happened
- Studied Coupa skill UX patterns (box dividers, emoji sections, key-value pairs, status indicators, summary stats)
- Redesigned REPORT step from plain markdown headers + ASCII tables to rich CLI format
- Added explicit rendering rules so agents reproduce the visual template consistently

### What Emerged
- "Render, don't summarize" is the key principle — agents should output structured visual templates, not prose wrapped in format headers
- The onboarding report is the first impression; its quality signals the quality of the whole system

---

## 2026-02-01 — Cross-cutting label discovery in onboarding

**Author:** @mellanon (agent: Luna)
**Phase:** Evolve
**Status:** DISCOVER step now surfaces security, trust, and upstream-contribution issues
**Issues:** #44, #16, #17

### What Happened
- Identified that issues #16 and #17 (security/trust upstream work) were invisible to agents querying only by scope label
- Updated onboarding SOP DISCOVER step with structured `gh` queries by cross-cutting label
- Updated CONTRIBUTING.md step 7 to mention cross-cutting labels as a discovery path
- Updated REPORT section 5 to include cross-cutting issues in contribution opportunities

### What Emerged
- Cross-cutting labels are the mechanism for surfacing work that transcends project boundaries — governance categories like security and trust need their own discovery paths, not just scope-based filtering

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
