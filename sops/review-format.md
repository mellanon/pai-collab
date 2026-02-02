# SOP: Review Format

How to conduct an independent review on a blackboard project or proposal.

## Principle

**The auditor doesn't prepare the books** ([Greptile](https://www.greptile.com/blog/ai-code-review-bubble)). The reviewing agent must be independent from the coding agent.

## Pipeline

```
SCHEMA → SCOPE → ARCH → EVAL → SECURITY → PERF → DOCS → REPORT → GATE
```

Review operates on the clean contrib branch from Contrib Prep. Reviewers never see private customizations.

## Layered Review Strategy

No single review layer is enough. The blackboard uses four layers, each catching different things:

| Layer | What | Catches | Effort | Status |
|-------|------|---------|--------|--------|
| **1. Automated gates** | GitHub Actions schema checks (#59) | Missing fields, invalid license, registry misalignment, schema violations | Zero — runs on every PR | **Operational** |
| **2. Maestro PR_Review playbook** | 6-step structured pipeline via independent agent | Architecture fit, security, test quality, documentation gaps | One agent session | Working |
| **3. Community agent review** | Cross-agent review via blackboard protocol | Domain expertise, convention adherence, integration concerns | PR to `reviews/` | Available |
| **4. Human sign-off** | Maintainer reviews findings from all layers | Final judgment, merge decision | Human time | Always |

### Layer 1: Automated Gates (Operational)

GitHub Actions runs on every PR that touches project files. It validates:

- **PROJECT.yaml schema** — required fields (name, maintainer, status, created, license, contributors), valid status values, accepted license (MIT, Apache-2.0, BSD-2/3-Clause)
- **Contributors schema** — each contributor has only `zone` and `since`
- **JOURNAL.md format** — entry has date, author, phase, status, issues fields
- **REGISTRY.md alignment** — status matches PROJECT.yaml
- **STATUS.md updated** — warning if PROJECT.yaml changed but STATUS.md didn't

This automates the mechanical checks that were previously the most common review feedback (PRs #53, #56).

### Layer 2: Maestro PR_Review Playbook (Working)

The [Maestro PR_Review playbook](https://github.com/mellanon/maestro-pai-playbooks/tree/main/playbooks/PR_Review) (adapted from Kayvan Sylvan's Fabric PR Review) is a concrete, working implementation. It runs as a Maestro auto-run — 6 sequential documents, each producing a structured working file:

```
1_ANALYZE_PR.md        → REVIEW_SCOPE.md       (PR scope, changed files, risk areas)
2_CODE_QUALITY.md      → CODE_ISSUES.md        (Language idioms, error handling, patterns)
3_SECURITY_REVIEW.md   → SECURITY_ISSUES.md    (OWASP vulnerabilities, secret handling)
4_TEST_VALIDATION.md   → TEST_RESULTS.md       (Test execution, coverage gaps)
5_DOCUMENTATION.md     → DOC_ISSUES.md         (README updates, inline comments, changelog)
6_SUMMARIZE.md         → REVIEW_SUMMARY.md     (Consolidated findings)
                       → PR_COMMENT.md         (Ready-to-post GitHub PR comment)
```

### Layer 3: Community Agent Review

Community reviewers — both agents and humans — can review contributions independently. This is the primary mechanism for getting diverse perspectives on security, architecture, and governance.

**How to participate as a community reviewer:**
1. Find issues labelled `parallel-review` or `seeking-contributors`
2. Read the relevant SOPs and schemas (this document, CONTRIBUTING.md)
3. Conduct your review — the template below is a guide, not a requirement
4. Submit findings as a PR or as issue comments (see [inbound contribution protocol](inbound-contribution-protocol.md))

**Community review is a trust-building path.** Demonstrating review competence is how contributors move from untrusted → trusted in the [trust model](../TRUST-MODEL.md).

See [parallel reviews SOP](parallel-reviews.md) for coordinating multiple independent reviews on the same topic.

### External Tools (Available, Not Yet Integrated)

| Tool | What It Does | How It Fits | Status |
|------|-------------|------------|--------|
| [Greptile](https://www.greptile.com/blog/ai-code-review-bubble) | Independent AI code review — autonomous, specialized, feedback loops back to coding agents | Validates "auditor ≠ builder" principle. External reviewer alongside community agents | Available — needs integration |
| [Cursor BugBot](https://cursor.com/bugbot) | Automated pre-merge logic bug detection with low false-positive rate, posts comments on PRs | Pre-merge quality gate — catches logic bugs that test suites miss | Available — needs GitHub Actions setup |

---

## Review Types

The blackboard supports two types of review, each with different scope and depth:

### Code/Project Review (Full Pipeline)

For PRs that register projects, add code, or modify existing project artifacts. Uses the full SCHEMA → ... → GATE pipeline.

### Proposal Review (Lightweight)

For evaluating ideas and competing proposals (issues with `type/idea` or `competing-proposals` label). Lighter weight — focuses on feasibility, integration, and tradeoffs rather than code quality.

| Check | Code Review | Proposal Review |
|-------|------------|----------------|
| Schema compliance | ✅ Full validation | ✅ If artifacts included |
| Architecture fit | ✅ Detailed | ✅ High-level |
| Security assessment | ✅ Code-level | ✅ Design-level |
| Test quality | ✅ | N/A |
| Integration analysis | ✅ | ✅ Key focus |
| Tradeoff evaluation | Optional | ✅ Key focus |

See [competing proposals SOP](competing-proposals.md) for evaluating multiple proposals.

---

## Review Steps

### 0. Schema Check (Automated)

Before human review begins, automated checks validate schema compliance. If Layer 1 (GitHub Actions) catches errors, the contributor fixes them before proceeding.

**What's automated:** PROJECT.yaml fields, license, contributors schema, REGISTRY alignment, JOURNAL format.

**What's NOT automated (and must be checked manually):**
- Claim verification — does the PR actually do what it says?
- Issue reference accuracy — do the referenced issues match the actual changes?
- Overclaiming — does the PR claim to close issues it doesn't fully address?

### 1. Trust Zone Check

Read `CONTRIBUTORS.yaml` (repo-level) and the project's `PROJECT.yaml` (project-level). Apply review intensity per [TRUST-MODEL.md](../TRUST-MODEL.md):
- **Untrusted** — full content scanning, tool restrictions
- **Trusted** — standard review
- **Maintainer** — standard review (nobody is exempt from review)

### 2. Scope

Read the PR diff. Understand what's being added, changed, or removed:
- What files are touched?
- Is this a new project registration, project update, process change, or structural modification?
- Does it touch policy documents? → Escalate to maintainer regardless of trust zone

### 3. Architecture & Integration

- Does it follow PAI patterns? Conflict with existing hooks/skills?
- Does it integrate with the blackboard workflow or just sit alongside it?
- For project registrations: does the project fill a gap or duplicate existing work?

### 4. Code Quality (Code Reviews Only)

- Redundancy, dead code, naming conventions, error handling
- For standalone tools: read the source repo, run tests — code lives in the project's own repository, not on the blackboard
- Code improvements (bug fixes, new features) should be contributed to the project's repo directly (e.g., via PR to the maintainer's fork)

### 5. Security

- No exposed secrets, no injection vectors, proper input validation
- For security tools: verify claims (detection rates, false positive rates, adversarial coverage)
- Check for prompt injection patterns in loaded content

### 6. Documentation & Artifacts

- README covers required sections (see CONTRIBUTING.md → Project README.md)
- JOURNAL.md present with initial entry
- PROJECT.yaml complete and accurate

### 7. Report

Write structured findings using the template below. Submit as:
- **PR comment** — for inline review feedback
- **Review file (project)** — for project findings: `projects/<name>/reviews/<date>-<topic>-review-<handle>.md`
- **Review file (governance)** — for trust model, documentation, cross-project reviews: `reviews/<date>-<topic>-<handle>.md`

**Workflow:** Reviews are tracked by a GitHub issue (use the review's parent issue, or create one). The review document is the durable artifact contributed back via PR. The issue provides traceability; the document provides substance.

### 8. Gate

Recommendation: merge, request changes, or reject. The maintainer makes the final call.

---

## Review Areas

| Area | What to Check |
|------|--------------|
| **Schema compliance** | PROJECT.yaml fields, license, JOURNAL.md format, REGISTRY alignment |
| **Claim verification** | Does the PR do what it says? Are issue references accurate? |
| **Architectural fit** | Does it follow PAI patterns? Conflict with existing hooks/skills? |
| **Code quality** | Redundancy, dead code, naming conventions, error handling |
| **Non-functional** | Performance implications, resource usage, Docker footprint |
| **Security** | No exposed secrets, no injection vectors, proper input validation |
| **Test quality** | Are tests meaningful? Coverage gaps? Fragile tests? |

---

## Review Output Template (Optional Guide)

The template below is a starting point, not a requirement. Good reviews come in many forms — what matters is that findings are clear, actionable, and saved as a durable artifact. Use whatever structure fits the review.

```markdown
# Review: <Project> — <Date>

Reviewer: @<handle> (agent: <name>)
Commit: <hash>
Branch: <contrib-branch>

## Summary
<1-3 sentences>

## Findings
<Structured however makes sense for the review — by severity, by topic, by component>

## Recommendation
<merge / merge with fixes / needs rework>
```

---

## References

- [parallel-reviews.md](parallel-reviews.md) — Multi-reviewer workflow for topics needing diverse perspectives
- [competing-proposals.md](competing-proposals.md) — Evaluating multiple approaches to the same problem
- [inbound-contribution-protocol.md](inbound-contribution-protocol.md) — Full PR processing pipeline (this SOP is step 3)
- [TRUST-MODEL.md](../TRUST-MODEL.md) — Trust zones determine review intensity
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Artifact schemas for validation
- [CLAUDE.md](../CLAUDE.md) — Agent operating protocol
