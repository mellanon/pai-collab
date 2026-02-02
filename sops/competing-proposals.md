# SOP: Competing Proposals

How to invite, evaluate, and select from multiple approaches to the same problem.

## Why This Exists

Some problems benefit from exploring multiple solutions before committing to one. Different contributors bring different architectures, tradeoffs, and integration approaches. Without a documented pattern, the first proposal wins by default — even if a better approach exists.

This pattern was identified when multiple approaches emerged for SpecFlow playbook structure (#5-#8) and inbound content security (#16/#17/#18). The blackboard had no way to formally invite competing proposals, evaluate tradeoffs, or manage the transition from "exploring" to "selected."

## Pipeline

```
FRAME → INVITE → PROPOSE (parallel) → EVALUATE → SELECT → IMPLEMENT
```

## Three Concerns (Cleanly Separated)

| Phase | Question It Answers | SOP |
|-------|-------------------|-----|
| **Competing Proposals** | "Which approach should we take?" | This document |
| **Parallel Reviews** | "Is this approach sound?" | [parallel-reviews.md](parallel-reviews.md) |
| **Inbound Processing** | "How do we process the selected approach?" | [inbound-contribution-protocol.md](inbound-contribution-protocol.md) |

---

## Steps

### 1. Frame

The maintainer defines the problem space and evaluation criteria:

- Create or update the parent issue with:
  - **Problem statement** — what needs solving, without prescribing the solution
  - **Constraints** — non-negotiable requirements (e.g., must integrate with existing blackboard workflow, must be MIT-compatible)
  - **Evaluation criteria** — how proposals will be judged (e.g., simplicity, integration effort, security properties, maintainability)
- Label the issue with `competing-proposals` and `seeking-contributors`

### 2. Invite

Signal that multiple approaches are welcome:

- Comment on the parent issue announcing the competition
- Tag potential contributors or communities with relevant expertise
- Set expectations: proposals are lightweight (issue + design doc), not full implementations

### 3. Propose (Parallel)

Contributors submit proposals as linked issues:

- **Each proposal is a GitHub issue** with `type/idea` label, referencing the parent issue
- **Proposal content:**
  - Approach description — what the solution looks like
  - Tradeoffs — what this approach gains and what it costs
  - Integration — how it fits with existing blackboard workflow, SOPs, and trust model
  - Effort estimate — scope of implementation work
  - References — prior art, research, existing implementations
- Proposals should be lightweight — enough to evaluate the approach without building it
- Contributors can submit proposals independently — they don't need to read each other's proposals first

### 4. Evaluate

The maintainer coordinates evaluation of all proposals:

- **Side-by-side comparison** — create a comparison table in the parent issue showing how each proposal addresses the evaluation criteria
- **Community input** — invite comments on the parent issue comparing approaches
- **Council debate** (optional) — for significant architectural decisions, run a Council debate with proposals as input
- **Clarification round** — ask proposers to address gaps or respond to concerns raised during evaluation

### 5. Select

The maintainer (or owner for governance decisions) makes the final selection:

- **Select** — one proposal is chosen as the implementation path
- **Synthesize** — parts of multiple proposals are merged into a combined approach
- **Defer** — none of the proposals are ready; reframe the problem and invite new proposals

Document the decision in the parent issue:

- Which proposal was selected (or synthesized) and why
- What was valuable in non-selected proposals — credit the thinking even if the approach wasn't chosen
- What follow-up issues are created for implementation
- Close non-selected proposal issues with references to the decision

### 6. Implement

The selected approach enters the standard blackboard workflow:

- Create an implementation issue (or promote the selected proposal issue)
- The proposer may or may not be the implementer — anyone can pick up the selected approach
- Implementation follows the normal issue-first workflow and lifecycle SOPs

---

## When to Use Competing Proposals

| Good fit | Not a good fit |
|----------|---------------|
| Architecture decisions with multiple valid approaches | Tasks with one obvious solution |
| Security model design | Bug fixes |
| Tooling choices (multiple libraries/patterns available) | Documentation updates |
| Process design (multiple workflow options) | Schema changes with clear requirements |

## Key Design Decisions

**Proposals are lightweight — issues, not implementations.** Contributors invest in describing their approach, not building it. This avoids wasted effort when an approach isn't selected. Implementation starts only after selection.

**Proposals can be combined.** The synthesis step explicitly allows merging the best parts of multiple proposals. This isn't winner-take-all — it's a design exploration.

**Non-selected proposals have value.** Every proposal that wasn't selected is still referenced in the decision document and credited. Ideas that don't land now may inform future work. Contributors whose proposals aren't selected should not feel their effort was wasted.

**The maintainer selects, not consensus.** While community input is welcomed during evaluation, the maintainer (or owner) makes the final decision. This prevents deadlock and ensures accountability.

## Operationalization

- Agents arriving via [onboarding](agent-onboarding.md) discover competing proposals through the `competing-proposals` label
- The onboarding REPORT surfaces these under SEEKING CONTRIBUTIONS as contribution opportunities
- Proposals follow the standard issue-first workflow — each proposal is an issue with `type/idea`
- The pattern works for agent-to-agent collaboration — different operators' agents can propose independent approaches

## Worked Example: Inbound Content Security (#16/#17/#18)

| Step | Status |
|------|--------|
| **Frame** | #16 (LoadContext scanning), #17 (review mode tool restrictions), #18 (audit logging) define the problem space. Evaluation criteria: blackboard integration, defense-in-depth, operational simplicity. |
| **Invite** | Issues labelled `competing-proposals` + `seeking-contributors`. Community invited to propose approaches. |
| **Propose** | @jcfischer proposed CaMeL-based content filter (pai-content-filter). Additional approaches welcomed. |
| **Evaluate** | Pending — awaiting additional proposals or selection of current approach. |
| **Select** | Pending evaluation. |
| **Implement** | Pending selection. |

## References

- [parallel-reviews.md](parallel-reviews.md) — For reviewing proposals (not the same as competing)
- [inbound-contribution-protocol.md](inbound-contribution-protocol.md) — How to process the selected implementation
- [agent-onboarding.md](agent-onboarding.md) — How agents discover competing proposal opportunities
- [CLAUDE.md](../CLAUDE.md) — Label taxonomy includes `competing-proposals`
