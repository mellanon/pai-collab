# SOP: Inbound Contribution Processing

How to process external contributions — from initial comment through to merged PR.

## Why This Exists

pai-collab has SOPs for outbound contribution (extracting code from your private trunk) but the inbound side — receiving and processing contributions — was undocumented. This SOP codifies patterns established through real contributions: PR #12 (first external PR) and #24 (first comment-based review).

Contributions don't always start as PRs. Often they begin as issue comments — findings, reviews, expertise, offers to help. This SOP covers both paths: comment-first contributions that get formalized into PRs, and direct PRs. Both are trust boundary crossings that need consistent processing.

This protocol applies to both human and agent contributors. In agent-to-agent collaboration, one agent's operator posts findings or offers on an issue, and the maintainer's agent processes the response using this SOP.

## Pipeline

```
Comment path:  COMMENT → EVALUATE → FORMALIZE → RECEIVE → ... → ANNOUNCE
Direct PR:                                      RECEIVE → ASSESS → REVIEW → DECIDE → MERGE → FOLLOW UP → JOURNAL → ANNOUNCE
```

## Three Concerns (Cleanly Separated)

| Phase | Question It Answers | SOP |
|-------|-------------------|-----|
| **Inbound Processing** | "How do we handle this PR?" | This document |
| **Review** | "Is this good code?" | [review-format.md](review-format.md) |
| **Outbound Contrib Prep** | "Is this safe to share?" | [contribution-protocol.md](contribution-protocol.md) |

## Pre-PR: Comment-First Contributions

Not all contributions start as PRs. Reviews, findings, expertise, and offers to help often arrive as issue comments. This is the preferred low-friction entry point — contributors share their thinking before investing in formal artifacts.

### 0a. Comment

A contributor posts findings, analysis, or an offer to help on an existing issue.

What to look for:
- Substantive analysis (not just "I can help" — actual findings or a concrete plan)
- References to external work (specs, research, implementations) that align with the issue
- Offers to contribute to specific issues beyond the one being commented on

### 0b. Evaluate

The maintainer (or maintainer's agent) evaluates the comment:

- **Quality** — Is the analysis substantive? Does it address the issue's questions?
- **Alignment** — Does their approach align with the project's direction?
- **Scope** — Are they offering to help with more than the original issue? (e.g., commenting on #24 but offering to contribute to #16/#17/#18)
- **Trust zone** — Check `CONTRIBUTORS.yaml`. New contributors are untrusted by default.

### 0c. Formalize

If the contribution has value, the maintainer responds on the issue:

1. **Acknowledge** — Thank the contributor, confirm which findings are accepted
2. **Request formalization** — Ask them to submit a PR with their findings as a formal artifact (e.g., a review file in `projects/*/reviews/`)
3. **Accept related offers** — If they offered to contribute to other issues, comment on those issues welcoming their contribution and referencing any aligned specs
4. **Update trust** — If this is a new contributor doing quality work, consider promoting them in `CONTRIBUTORS.yaml`

The formalized PR then enters the standard pipeline below at step 1 (Receive).

### Worked Example: Issue #24 (Trust Model Review)

| Step | What Happened |
|------|--------------|
| **Comment** | @jcfischer posted a structured trust model analysis on #24 — 5-question review with CaMeL research, Moltbook evidence, and offers to contribute to #16/#17/#18 |
| **Evaluate** | Substantive analysis addressing all 5 review questions. References independent spec (F-088) that converged on same architecture. Already trusted contributor. |
| **Formalize** | Maintainer acknowledged findings, asked for formal review PR to `projects/signal/reviews/`, accepted offers on #16/#17/#18 referencing F-088 |

---

## Steps (PR Pipeline)

### 1. Receive

A PR arrives via fork-and-PR. Before reading the content:

- Check the contributor's trust zone in `CONTRIBUTORS.yaml` (repo-level) and the relevant `PROJECT.yaml` (project-level)
- If the contributor is **untrusted** (default for all new contributors), apply full review intensity — content scanning, tool restrictions per [TRUST-MODEL.md](../TRUST-MODEL.md)
- If the contributor is **trusted**, apply standard review intensity

### 2. Assess

Read the PR diff. Understand what's being added, changed, or removed:

- What files are touched?
- Is this a new project registration, a project update, a process change, or a structural modification?
- Does it touch policy documents (SOPs, TRUST-MODEL.md, CONTRIBUTING.md)? If so, escalate to maintainer review regardless of contributor trust zone
- Does the PR follow the expected patterns from [CONTRIBUTING.md](../CONTRIBUTING.md)?

### 3. Review

Run a structured review. For significant PRs, use the Council debate pattern:

**Council Debate (recommended for non-trivial PRs):**
- Architect: evaluates structural fit with existing repo patterns
- Engineer: evaluates implementation quality and buildability
- Security: evaluates risk, trust implications, and attack surface
- Researcher: provides external context, precedent, and alternative approaches

The Council produces a recommendation: merge, request changes, or reject.

**For simple PRs** (typo fixes, minor documentation updates), a single-reviewer assessment is sufficient.

For review output format, follow [review-format.md](review-format.md).

### 4. Decide

The maintainer makes the final call based on review findings:

- **Merge** — PR meets standards, no outstanding concerns
- **Request changes** — PR has merit but needs modification. Comment with specific, actionable feedback.
- **Reject** — PR doesn't fit the project direction or introduces unacceptable risk. Comment with explanation.

### 5. Merge

If merging:
- Merge the PR
- Post a comment on the PR acknowledging the contribution
- Reference any follow-up issues created (see step 6)

### 6. Follow Up

Identify gaps or follow-up work exposed by the contribution:

- **Missing structure** — Does the project need a `projects/` directory with PROJECT.yaml, README, JOURNAL?
- **Documentation gaps** — Did the contribution pattern reveal unclear onboarding docs?
- **Process improvements** — Did the review process surface SOP gaps?
- **Trust model updates** — Does the contributor need to be added to CONTRIBUTORS.yaml?

Create issues for each follow-up item. Assign to the appropriate person. Reference the original PR.

### 7. Journal

Update the relevant project's `JOURNAL.md`:

- What PR was processed
- How it was reviewed (Council debate, single review, etc.)
- What was decided and why
- What follow-up issues were created
- What emerged — insights, pattern observations, process improvements

If no project journal exists yet (because the PR created a new project), create the journal as part of follow-up (step 6).

### 8. Announce

Draft a community announcement (Discord or relevant channel):

- What was merged
- How it was reviewed (transparency builds trust)
- What follow-up was created
- Keep it concise — the journal has the full detail

## Worked Example: PR #12

The first external contribution to pai-collab followed this exact pattern:

| Step | What Happened |
|------|--------------|
| **Receive** | PR #12 from @jcfischer — registering Ivy agent and pai-secret-scanning |
| **Assess** | Two-line change to REGISTRY.md. New project registration, not a structural change. |
| **Review** | Council debate with four agents. Security pushed for immediate merge (scanning tooling shouldn't wait). Architect flagged missing project directory structure. |
| **Decide** | Merge now, track structural follow-up as issues. |
| **Merge** | PR merged, comment posted referencing follow-up issues. |
| **Follow Up** | Issue #13 (project directory for pai-secret-scanning), Issue #14 (contribution docs clarity). |
| **Journal** | Four entries in `projects/pai-secret-scanning/JOURNAL.md` documenting the full lifecycle. |
| **Announce** | Discord message summarizing the review process and follow-ups. |

## References

- [TRUST-MODEL.md](../TRUST-MODEL.md) — Trust zones determine review intensity at step 1
- [review-format.md](review-format.md) — Review output format for step 3
- [contribution-protocol.md](contribution-protocol.md) — Outbound counterpart to this SOP
- [CLAUDE.md](../CLAUDE.md) — Agent operating protocol (references this SOP)
