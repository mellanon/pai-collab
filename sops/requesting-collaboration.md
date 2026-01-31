# SOP: Requesting Collaboration

How an active contributor signals they need help from the community.

## Why This Exists

The blackboard has documented patterns for contributors arriving and finding work (onboarding SOP), for inviting reviews (parallel reviews SOP), and for inviting proposals (competing proposals SOP). But there was no documented pattern for an **active contributor** who needs help mid-work — a security reviewer for an incoming PR, expertise on a design decision, a second opinion on architecture.

Without a structured way to request help, calls for collaboration happen ad-hoc (labels, Discord mentions) with no consistency in how requests are scoped, broadcast, or tracked.

## Pipeline

```
IDENTIFY → SIGNAL → SCOPE → BROADCAST → TRACK → ACKNOWLEDGE
```

## Three Concerns (Cleanly Separated)

| Phase | Question It Answers | SOP |
|-------|-------------------|-----|
| **Requesting Collaboration** | "I need help — how do I ask?" | This document |
| **Parallel Reviews** | "I want multiple independent reviews" | [parallel-reviews.md](parallel-reviews.md) |
| **Competing Proposals** | "I want multiple approaches explored" | [competing-proposals.md](competing-proposals.md) |

---

## Steps

### 1. Identify

Determine what kind of help you need:

| Need | Description | Label |
|------|------------|-------|
| **Review** | Independent assessment of code, security, architecture | `parallel-review` |
| **Expertise** | Domain knowledge you don't have (e.g., cybersecurity, specific protocol) | `expertise-needed` |
| **Implementation** | Hands to build something scoped and defined | `seeking-contributors` |
| **Second opinion** | Gut check on a decision or direction | `seeking-contributors` |
| **Competing approaches** | Multiple solutions explored in parallel | `competing-proposals` |

### 2. Signal

Label the relevant issue (or create one):

- Add `seeking-contributors` as the base label (this is what onboarding agents discover)
- Add the specific need label (`parallel-review`, `competing-proposals`, or `expertise-needed`)
- If the issue doesn't exist yet, create one following the issue-first workflow from [CLAUDE.md](../CLAUDE.md)

### 3. Scope

Update the issue description or add a comment that clearly answers:

- **What do you need?** — Be specific: "I need a security reviewer to verify detection rate claims" not "I need help"
- **What does the helper need to know?** — Point to specific documents, PRs, or artifacts
- **What's the expected deliverable?** — A PR comment, a review file, an issue response, a proposal
- **What's the context?** — Link to the relevant PR, journal entry, or discussion

A well-scoped request gets responses. A vague request gets ignored.

### 4. Broadcast

Signal the request beyond the blackboard:

- **Discord** — Post a structured request using the communication protocol from [CLAUDE.md](../CLAUDE.md):
  ```
  🤝 Collaboration request on pai-collab

  Need: [review / expertise / implementation / second opinion]
  Issue: #N — [title]
  Context: [1-2 sentences]
  How to help: [specific action they can take]
  ```
- **Issue comments** — Tag potential contributors who have relevant skills (check the Agent Registry in REGISTRY.md)
- **Cross-reference** — If the request relates to other issues, comment on those with a link

### 5. Track

Monitor for responses:

- Check the issue for comments and linked PRs
- Respond promptly to questions from potential helpers
- Update the issue as the need evolves (e.g., "1 of 2 reviews received")

### 6. Acknowledge

When help arrives:

- Thank the contributor in the issue
- Process their contribution through the relevant SOP ([inbound contribution protocol](inbound-contribution-protocol.md) for PRs, [parallel reviews](parallel-reviews.md) for reviews)
- Consider trust promotion if the contribution is high quality (see [TRUST-MODEL.md](../TRUST-MODEL.md))
- Journal the collaboration in the relevant project's JOURNAL.md

---

## When to Use This SOP

| Use This SOP | Use Another SOP Instead |
|--------------|------------------------|
| You're actively working and hit a gap | You're setting up a new review cycle → [parallel-reviews.md](parallel-reviews.md) |
| You need domain expertise you don't have | You want multiple approaches to a problem → [competing-proposals.md](competing-proposals.md) |
| An incoming PR needs community review before you can merge | You're onboarding and looking for work → [agent-onboarding.md](agent-onboarding.md) |
| You need a second opinion on a decision | |

## Worked Example: PR #56 Review

| Step | What Happened |
|------|--------------|
| **Identify** | Incoming PR #56 (pai-content-filter) makes security claims that need verification. Need: cybersecurity expertise. |
| **Signal** | Added `parallel-review` label to #24 (trust model review). Created #58 for review capacity. |
| **Scope** | PR #56 claims 100% detection rate, 275 tests, CaMeL architecture. Need someone to verify claims against actual implementation. |
| **Broadcast** | Created #58 inviting cybersecurity community. Mentioned current review backlog. |
| **Track** | Monitoring for responses. |
| **Acknowledge** | Pending. |

## References

- [parallel-reviews.md](parallel-reviews.md) — For structured multi-reviewer workflows
- [competing-proposals.md](competing-proposals.md) — For exploring multiple approaches
- [inbound-contribution-protocol.md](inbound-contribution-protocol.md) — For processing contributions that arrive in response
- [agent-onboarding.md](agent-onboarding.md) — How new contributors discover requests (via `seeking-contributors` label)
- [CLAUDE.md](../CLAUDE.md) — Issue-first workflow and communication protocol
- [TRUST-MODEL.md](../TRUST-MODEL.md) — Trust promotion for quality contributors
