# SOP: Parallel Reviews

How to invite, manage, and synthesize multiple independent reviews on the same topic.

## Why This Exists

The most valuable review work — security audits, architecture reviews, governance assessments — benefits from multiple independent perspectives. Different contributors bring different threat models, experiences, and blind spots. A single review produces findings; parallel reviews produce coverage.

This pattern was identified when #24 (trust model review) received one review from @jcfischer but clearly needed additional independent assessments. The blackboard had no documented way to invite, coordinate, or synthesize multiple reviews on the same topic.

## Pipeline

```
INVITE → SCOPE → REVIEW (independent) → COLLECT → SYNTHESIZE → DECIDE
```

## Three Concerns (Cleanly Separated)

| Phase | Question It Answers | SOP |
|-------|-------------------|-----|
| **Parallel Reviews** | "How do we get multiple perspectives?" | This document |
| **Review Format** | "What does each review contain?" | [review-format.md](review-format.md) |
| **Inbound Processing** | "How do we process each review PR?" | [inbound-contribution-protocol.md](inbound-contribution-protocol.md) |

---

## Steps

### 1. Invite

The maintainer identifies a topic that benefits from multiple perspectives and sets up the parallel review:

- Label the issue with `parallel-review` and `seeking-contributors`
- Update the issue description to include:
  - **What to review** — specific documents, code, or artifacts
  - **Review questions** — what the reviewer should focus on
  - **Expected format** — artifact type and naming convention (see step 3)
  - **Target count** — how many independent reviews are sought (e.g., "seeking 2-3 reviews")
- Comment on the issue announcing the parallel review and tagging potential reviewers

### 2. Scope

Each reviewer operates independently. The maintainer ensures:

- **Independence** — reviewers do not see each other's work until the synthesis phase. Reviews are submitted as separate PRs, not as comments on each other's work.
- **Consistent scope** — all reviewers work from the same artifact versions (pin to a commit or tag if the artifacts are evolving)
- **Clear deliverable** — each reviewer knows what to produce and where to put it

### 3. Review (Independent)

Each contributor conducts their review independently and submits a PR with their findings:

- **Artifact location:** `projects/*/reviews/` for project reviews, `reviews/` for governance reviews
- **Naming convention:** `<date>-<topic>-review-<handle>.md` for project reviews, `<date>-<topic>-<handle>.md` for governance reviews
- **Review content:** follows [review-format.md](review-format.md) or the format specified in the issue
- Each review PR is processed through the standard [inbound contribution protocol](inbound-contribution-protocol.md)

Reviewers should not read other reviews before submitting their own. This preserves diverse findings.

### 4. Collect

The maintainer tracks incoming reviews:

- Monitor PRs tagged to the parallel review issue
- Process each review PR through the inbound contribution protocol
- Merge reviews as they arrive — don't wait for all reviews to land before merging early ones
- Comment on the issue when each review lands, updating the count (e.g., "2 of 3 reviews received")

### 5. Synthesize

When enough reviews have landed (or the time window closes), the maintainer produces a synthesis document:

- **Artifact location:** `projects/*/reviews/<topic>-synthesis.md`
- **Content:**
  - Which reviews were received and from whom
  - Common findings — themes that appeared across multiple reviews
  - Unique findings — insights that only one reviewer surfaced
  - Contradictions — where reviewers disagreed, and how to resolve
  - Adopted findings — which recommendations will be actioned
  - Deferred findings — which recommendations are noted but not actioned now, and why

The synthesis references each individual review by filename.

### 6. Decide

The maintainer (or owner for governance topics) makes decisions based on the synthesis:

- Create follow-up issues for adopted findings
- Close or update the original parallel review issue with a summary of outcomes
- Reference the synthesis document in all follow-up issues
- Credit all reviewers in the decision — even findings that weren't adopted are valuable

---

## When to Use Parallel Reviews

| Good fit | Not a good fit |
|----------|---------------|
| Security and trust model assessments | Typo fixes |
| Architecture reviews | Single-file changes |
| Governance framework evaluation | Implementation PRs (use standard review) |
| Cross-cutting design decisions | Well-understood, low-risk changes |

## Key Design Decisions

**Independence first, then cross-pollination.** Reviewers work independently to maximize diverse findings. The synthesis phase is where cross-pollination happens — the maintainer connects the dots across reviews.

**Maintainer triggers synthesis.** There's no automatic trigger. The maintainer decides when enough reviews have landed or when the time window has passed. This avoids premature synthesis and allows for late-arriving reviews.

**Reviews are PRs, not comments.** Formal review artifacts are more durable, referenceable, and structured than issue comments. Comments are for the pre-PR phase (see [inbound contribution protocol](inbound-contribution-protocol.md)).

## Operationalization

- Agents arriving via [onboarding](agent-onboarding.md) discover parallel review opportunities through the `parallel-review` label
- The onboarding REPORT surfaces these under SEEKING CONTRIBUTIONS alongside `seeking-contributors` issues
- Each review PR follows the standard inbound contribution protocol — no special handling needed beyond the naming convention

## Worked Example: #24 (Trust Model Review)

| Step | What Happened |
|------|--------------|
| **Invite** | #24 labelled `parallel-review` + `seeking-contributors`. Issue describes 5 review questions covering threat vectors, defense layers, trust zones, inbound injection, and self-reinforcing docs. |
| **Scope** | Reviewers assess TRUST-MODEL.md, CONTRIBUTORS.yaml, inbound SOP, and CLAUDE.md at current main. |
| **Review** | @jcfischer submitted first review via issue comment (formalized via inbound SOP). Additional reviews sought. |
| **Collect** | 1 of 2-3 target reviews received. Awaiting additional independent reviews. |
| **Synthesize** | Pending — awaiting additional reviews. |
| **Decide** | Pending synthesis. |

## References

- [review-format.md](review-format.md) — Review output format for individual reviews
- [inbound-contribution-protocol.md](inbound-contribution-protocol.md) — How to process each review PR
- [agent-onboarding.md](agent-onboarding.md) — How agents discover parallel review opportunities
- [TRUST-MODEL.md](../TRUST-MODEL.md) — Trust zones determine review intensity
- [CLAUDE.md](../CLAUDE.md) — Label taxonomy includes `parallel-review`
