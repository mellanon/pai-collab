# Standard Operating Procedures

How we build, share, review, and ship work through the blackboard.

These SOPs are **sequenced** — they follow the lifecycle of a contribution from development through to release. Read them in order if you're new; reference them individually once you know the flow.

---

## The Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   1. BUILD            2. CONTRIB PREP         3. REVIEW             │
│   SpecFlow pipeline   Extract & sanitize      Independent review    │
│   SPECIFY→IMPLEMENT   from private trunk      "auditor ≠ builder"   │
│                                                                     │
│        │                     │                      │               │
│        ▼                     ▼                      ▼               │
│                                                                     │
│   4. RELEASE          5. EVOLVE               ∞. DISCOVER           │
│   8 approval gates    Open Spec baseline      Daemon registry       │
│   Tag→PR→merge        + Change Proposals      agent discovery       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| # | SOP | Question It Answers | When to Read |
|---|-----|-------------------|-------------|
| 1 | [SpecFlow Development Pipeline](specflow-development-pipeline.md) | "How do I build this?" | Starting a new feature or project |
| 2 | [Contribution Preparation](contribution-protocol.md) | "Is this safe to share?" | Extracting work from your private PAI trunk |
| 3 | [Review Format](review-format.md) | "Is this good code?" | Reviewing someone else's contribution (or preparing for review) |
| 4 | [SpecFirst Release Process](specfirst-release-process.md) | "Is this ready to merge?" | Packaging a PR for upstream |
| 5 | [Daemon Registry Protocol](daemon-registry-protocol.md) | "How do agents find each other?" | Registering your PAI instance or discovering collaborators |

---

## How They Connect

**Steps 1–4 are sequential.** You build (1), then extract from your private trunk (2), then get reviewed (3), then release (4). Each step produces input for the next:

- **Build** produces tested code on a feature branch
- **Contrib Prep** produces a clean contrib branch (sanitized, inventoried, tagged)
- **Review** produces structured findings in `projects/*/reviews/`
- **Release** produces a PR to upstream with changelog and migration guide

**Step 5 runs in parallel.** The daemon registry is infrastructure — agents register once and are discoverable throughout. It doesn't depend on the build→ship sequence.

---

## What Exists vs What's Being Built

| SOP | Existing Implementation | What Needs Building |
|-----|------------------------|-------------------|
| Development Pipeline | SpecFlow + Maestro playbooks (working) | — |
| Contribution Preparation | Battle-tested across 3 projects (Context, Jira, pai-knowledge) | Maestro autorun playbook for SpecFlow bundle |
| Review Format | Maestro PR_Review playbook (working) | SpecFlow Review Playbook, PAI Review Skill, external tool integration |
| Release Process | SpecFirst release framework, 8 approval gates (working) | Maestro autorun playbook for SpecFlow bundle |
| Daemon Registry | Swift's daemon-mcp registry (live) | PAI Collab Skill to connect PAI instances |

See [SpecFlow Lifecycle Extension](../projects/specflow-lifecycle/) for the full roadmap of what's being built to formalize these processes as Maestro playbooks and PAI skills.

---

## Cross-References

- [CONTRIBUTING.md](../CONTRIBUTING.md) — The 6-step contribution flow (PROPOSE → ADOPT → BUILD → REVIEW → SHIP → EVOLVE) that these SOPs support
- [projects/specflow-lifecycle/](../projects/specflow-lifecycle/) — The project to turn these SOPs into formal SpecFlow playbooks
- [projects/signal/](../projects/signal/) — The first project going through this full lifecycle
