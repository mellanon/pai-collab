# Standard Operating Procedures

How we build, share, review, and ship work through the blackboard.

These SOPs are **sequenced** — they follow the lifecycle of a contribution from development through to release. Read them in order if you're new; reference them individually once you know the flow.

---

## The Sequence

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   1. SPECIFY+BUILD    2. HARDEN            3. CONTRIB PREP     4. REVIEW        │
│   SpecFlow pipeline   Human acceptance     Extract & sanitize  Independent       │
│   SPECIFY→IMPLEMENT   testing & fixes      from private trunk  "auditor ≠ builder│
│                                                                                 │
│        │                    │                     │                 │            │
│        ▼                    ▼                     ▼                 ▼            │
│                                                                                 │
│   5. RELEASE          6. EVOLVE                                ∞. DISCOVER      │
│   8 approval gates    Open Spec baseline                       Daemon registry  │
│   Tag→PR→merge        + Change Proposals                       agent discovery  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Numbering:** 1–6 are sequential lifecycle phases (each feeds the next). **0** is a prerequisite (onboarding). **∞** are parallel processes that run independently alongside any phase.

| # | Phase | SOP | Question It Answers | Tier | When to Read |
|---|-------|-----|-------------------|------|-------------|
| 0 | Onboard | [Agent Onboarding](agent-onboarding.md) | "How do I start contributing?" | **1** | First session — full onboarding pipeline |
| 1 | Specify + Build | [SpecFlow Development Pipeline](specflow-development-pipeline.md) | "What + how do I build this?" | 2 | Starting a new feature or project |
| 2 | Harden | — (project-specific) | "Does this survive real use?" | 2 | After build, before sharing — human acceptance testing |
| 3 | Contrib Prep | [Contribution Preparation](contribution-protocol.md) | "Is this safe to share?" | **1** | Before first PR — how to prepare and submit work |
| 4 | Review | [Review Format](review-format.md) | "Is this good code?" | 2 | Reviewing someone else's contribution (or preparing for review) |
| 5 | Release | [SpecFirst Release Process](specfirst-release-process.md) | "Is this ready to merge?" | 2 | Packaging a PR for upstream |
| 6 | Evolve | — (Open Spec + Change Proposals) | "How does this grow post-merge?" | 2 | After v1.0 is merged, evolving the spec |
| ∞ | Discover | [Daemon Registry Protocol](daemon-registry-protocol.md) | "How do agents find each other?" | 2 | Registering your PAI instance or discovering collaborators |
| ∞ | Inbound | [Inbound Contribution Processing](inbound-contribution-protocol.md) | "How do we handle this PR?" | 2 | Processing external PRs to the shared blackboard |
| ∞ | Archive | [Project Archival](project-archival.md) | "How do we retire inactive projects?" | 2 | Maintainer or owner decides a project is stale |
| ∞ | Parallel Reviews | [Parallel Reviews](parallel-reviews.md) | "How do we get multiple perspectives?" | 2 | Inviting independent reviews on security, architecture, or governance topics |
| ∞ | Competing Proposals | [Competing Proposals](competing-proposals.md) | "Which approach should we take?" | 2 | Multiple valid solutions exist for the same problem |
| ∞ | Requesting Collaboration | [Requesting Collaboration](requesting-collaboration.md) | "I need help — how do I ask?" | 2 | Active contributor needs review, expertise, or a second opinion |
| ∞ | Iteration Planning | [Iteration Planning](iteration-planning.md) | "What am I doing this week across projects?" | 2 | Working across 3+ issues/projects, or coordinating parallel contributors |
| ∞ | Spoke Operations | [Spoke Operations](spoke-operations.md) | "How do I project my spoke to a hive?" | 2 | Setting up .collab/, generating status, validating compliance, publishing to hub |

**Loading tiers:** SOPs use tiered loading to reduce onboarding friction. **Tier 0** (Foundation) is `CLAUDE.md` + `TRUST-MODEL.md` + `CONTRIBUTING.md` "Start Here" — always read on arrival. **Tier 1** is read before your first contribution. **Tier 2** is loaded on demand when performing that specific workflow. See `CLAUDE.md` → SOP Compliance for the full tier definitions.

---

## How They Connect

**Steps 1–6 are sequential.** You specify and build (1), then harden through real usage (2), then extract from your private trunk (3), then get reviewed (4), then release (5), then evolve (6). Each step produces input for the next:

- **Specify + Build** produces tested code on a feature branch
- **Harden** produces battle-tested code with acceptance fixes and emergent features
- **Contrib Prep** produces a clean contrib branch (sanitized, inventoried, tagged)
- **Review** produces structured findings in `projects/*/reviews/` (project) or `reviews/` (governance)
- **Release** produces a PR to upstream with changelog and migration guide
- **Evolve** produces an Open Spec baseline for future Change Proposals

**Discover runs in parallel.** The daemon registry is infrastructure — agents register once and are discoverable throughout. It doesn't depend on the build→ship sequence.

**Harden has no SOP** — it's project-specific human acceptance testing. Signal's hardening produced 11 commits and ~9,800 lines of fixes. The pattern is: use the thing yourself, find what the machine got wrong, fix it. What emerges from hardening often becomes the most valuable code.

---

## Tooling Maturity

Each phase in the lifecycle can be supported by four layers of tooling. Today, coverage is partial — the end-to-end process works, but it's manual and requires human orchestration between phases. **Integrating these layers into a coherent, agent-driven pipeline is a key collaboration goal.**

### The Four Tooling Layers

| Layer | What It Is | Example |
|-------|-----------|---------|
| **Process docs** | These SOPs — human-readable procedures | This directory |
| **Maestro playbooks** | Autorun-format playbooks that agents execute autonomously | `SpecFlow_Development`, `PR_Review` |
| **PAI skills** | SKILL.md + bin/tool/ CLI that agents invoke fluently | Jira, Coupa, Signal (existing pattern) |
| **External tools** | Third-party services that run on PRs or repos | BugBot, Greptile |

Today, the process docs (this directory) are the primary layer. The vision is for each phase to progressively gain tooling support across all four layers — so that an agent can read the blackboard, pick up a project, and execute the lifecycle end-to-end with human approval at key gates. Maestro playbooks provide phase-level autonomy, PAI skills make phases invocable from any session, and external tools add automated quality gates. Formalizing this tooling is tracked in the [SpecFlow Lifecycle Extension](../projects/specflow-lifecycle/) project.

---

## Cross-References

- [TRUST-MODEL.md](../TRUST-MODEL.md) — Threat model, defense layers, and trust zones that govern how contributions are reviewed
- [CLAUDE.md](../CLAUDE.md) — Agent operating protocol for working in this repository
- [CONTRIBUTING.md](../CONTRIBUTING.md) — The 6-step contribution flow (PROPOSE → ADOPT → BUILD → REVIEW → SHIP → EVOLVE) that these SOPs support
- [projects/specflow-lifecycle/](../projects/specflow-lifecycle/) — The project to formalize these processes as Maestro playbooks
- [projects/signal/](../projects/signal/) — The first project going through this full lifecycle
- Source document: The [PAI Signal Collaboration Plan](https://github.com/mellanon/pai-collab) Workstreams B (lifecycle) and D (tooling) describe the end-to-end vision
