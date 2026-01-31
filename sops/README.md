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

| # | Phase | SOP | Question It Answers | When to Read |
|---|-------|-----|-------------------|-------------|
| 1 | Specify + Build | [SpecFlow Development Pipeline](specflow-development-pipeline.md) | "What + how do I build this?" | Starting a new feature or project |
| 2 | Harden | — (project-specific) | "Does this survive real use?" | After build, before sharing — human acceptance testing |
| 3 | Contrib Prep | [Contribution Preparation](contribution-protocol.md) | "Is this safe to share?" | Extracting work from your private PAI trunk |
| 4 | Review | [Review Format](review-format.md) | "Is this good code?" | Reviewing someone else's contribution (or preparing for review) |
| 5 | Release | [SpecFirst Release Process](specfirst-release-process.md) | "Is this ready to merge?" | Packaging a PR for upstream |
| 6 | Evolve | — (Open Spec + Change Proposals) | "How does this grow post-merge?" | After v1.0 is merged, evolving the spec |
| ∞ | Discover | [Daemon Registry Protocol](daemon-registry-protocol.md) | "How do agents find each other?" | Registering your PAI instance or discovering collaborators |
| ∞ | Inbound | [Inbound Contribution Processing](inbound-contribution-protocol.md) | "How do we handle this PR?" | Processing external PRs to the shared blackboard |
| 0 | Onboard | [Agent Onboarding](agent-onboarding.md) | "How do I start contributing?" | New agent or contributor arriving at pai-collab |
| ∞ | Archive | [Project Archival](project-archival.md) | "How do we retire inactive projects?" | Maintainer or owner decides a project is stale |
| ∞ | Parallel Reviews | [Parallel Reviews](parallel-reviews.md) | "How do we get multiple perspectives?" | Inviting independent reviews on security, architecture, or governance topics |
| ∞ | Competing Proposals | [Competing Proposals](competing-proposals.md) | "Which approach should we take?" | Multiple valid solutions exist for the same problem |
| ∞ | Requesting Collaboration | [Requesting Collaboration](requesting-collaboration.md) | "I need help — how do I ask?" | Active contributor needs review, expertise, or a second opinion |

---

## How They Connect

**Steps 1–6 are sequential.** You specify and build (1), then harden through real usage (2), then extract from your private trunk (3), then get reviewed (4), then release (5), then evolve (6). Each step produces input for the next:

- **Specify + Build** produces tested code on a feature branch
- **Harden** produces battle-tested code with acceptance fixes and emergent features
- **Contrib Prep** produces a clean contrib branch (sanitized, inventoried, tagged)
- **Review** produces structured findings in `projects/*/reviews/`
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
