# SOP: Review Format

How to conduct an independent code review on a blackboard project.

## Principle

**The auditor doesn't prepare the books** ([Greptile](https://www.greptile.com/blog/ai-code-review-bubble)). The reviewing agent must be independent from the coding agent.

## Pipeline

```
SCOPE → ARCH → EVAL → SECURITY → PERF → DOCS → REPORT → GATE
```

Review operates on the clean contrib branch from Contrib Prep. Reviewers never see private customizations.

## Layered Review Strategy

No single review layer is enough. The blackboard uses four layers, each catching different things:

| Layer | What | Catches | Effort |
|-------|------|---------|--------|
| **1. Automated gates** | [BugBot](https://cursor.com/bugbot), [Greptile](https://www.greptile.com/blog/ai-code-review-bubble) | Logic bugs, common vulnerabilities, style violations | Zero — runs on every PR |
| **2. Maestro PR_Review playbook** | 6-step structured pipeline via independent agent | Architecture fit, security, test quality, documentation gaps | One agent session |
| **3. Community agent review** | Cross-agent review via blackboard protocol | Domain expertise, convention adherence, integration concerns | PR to `reviews/` |
| **4. Human sign-off** | Maintainer reviews findings from all layers | Final judgment, merge decision | Human time |

## Working Implementation: Maestro PR_Review Playbook

The [Maestro PR_Review playbook](https://github.com/mellanon/maestro-pai-playbooks/tree/main/playbooks/PR_Review) (adapted from Kayvan Sylvan's Fabric PR Review) is a concrete, working implementation of the review pipeline. It runs as a Maestro auto-run — 6 sequential documents, each producing a structured working file:

```
1_ANALYZE_PR.md        → REVIEW_SCOPE.md       (PR scope, changed files, risk areas)
2_CODE_QUALITY.md      → CODE_ISSUES.md        (Language idioms, error handling, patterns)
3_SECURITY_REVIEW.md   → SECURITY_ISSUES.md    (OWASP vulnerabilities, secret handling)
4_TEST_VALIDATION.md   → TEST_RESULTS.md       (Test execution, coverage gaps)
5_DOCUMENTATION.md     → DOC_ISSUES.md         (README updates, inline comments, changelog)
6_SUMMARIZE.md         → REVIEW_SUMMARY.md     (Consolidated findings)
                       → PR_COMMENT.md         (Ready-to-post GitHub PR comment)
```

This playbook integrates into the SpecFlow pipeline — it runs after `SpecFlow_Development` creates a PR. The review output (`REVIEW_SUMMARY.md`) feeds into the community review and human sign-off layers.

## Review Areas

| Area | What to Check |
|------|--------------|
| **Architectural fit** | Does it follow PAI patterns? Conflict with existing hooks/skills? |
| **Code quality** | Redundancy, dead code, naming conventions, error handling |
| **Non-functional** | Performance implications, resource usage, Docker footprint |
| **Security** | No exposed secrets, no injection vectors, proper input validation |
| **Test quality** | Are tests meaningful? Coverage gaps? Fragile tests? |

## How to Review a Blackboard Project

1. Read the project's `PROJECT.yaml` for source pointers
2. Clone the contrib branch (not the feature branch)
3. Run tests: use the `tests` field from PROJECT.yaml
4. Review by layer (e.g., events → collection → storage → visualization)
5. Write structured findings to `projects/<name>/reviews/<date>-review-<author>.md`
6. Submit via PR to this repo

## Review Output Template

```markdown
# Review: <Project> — <Date>

Reviewer: @<handle> (agent: <name>)
Commit: <hash>
Branch: <contrib-branch>

## Summary
<1-3 sentences>

## Findings

### Critical
- ...

### Major
- ...

### Minor
- ...

### Positive
- ...

## Recommendation
[ ] Ready to merge
[ ] Merge with fixes (list required fixes)
[ ] Needs rework (explain what and why)
```

## Example: Signal Review (Upcoming)

When Signal's clean contrib branch is pushed, a review would:

1. Read `projects/signal/PROJECT.yaml` → clone `mellanon/PAI`, checkout `contrib/signal-v1.0.0`
2. Run `bun test` (708 tests)
3. Review `Observability/`, `hooks/ToolUseInstrumentation.hook.ts`, `hooks/LoadContext.hook.ts`, `bin/ingest/`
4. Focus areas: Docker footprint, OTLP configuration, test quality, PAI convention adherence
5. Post findings to `projects/signal/reviews/2026-02-XX-review-<author>.md` via PR
