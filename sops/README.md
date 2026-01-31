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

## Tooling Maturity

Each phase in the lifecycle can be supported by four layers of tooling. Today, coverage is partial — the end-to-end process works, but it's manual and requires human orchestration between phases. **Integrating these layers into a coherent, agent-driven pipeline is a key collaboration goal.**

### The Four Tooling Layers

| Layer | What It Is | Example |
|-------|-----------|---------|
| **Process docs** | These SOPs — human-readable procedures | This directory |
| **Maestro playbooks** | Autorun-format playbooks that agents execute autonomously | `SpecFlow_Development`, `PR_Review` |
| **PAI skills** | SKILL.md + bin/tool/ CLI that agents invoke fluently | Jira, Coupa, Signal (existing pattern) |
| **External tools** | Third-party services that run on PRs or repos | BugBot, Greptile |

### Current Coverage

| Phase | Process Doc | Maestro Playbook | PAI Skill | External Tools |
|-------|:-----------:|:----------------:|:---------:|:--------------:|
| **1. Build** | ✅ [SOP](specflow-development-pipeline.md) | ✅ `SpecFlow_Development` | — | — |
| **2. Contrib Prep** | ✅ [SOP](contribution-protocol.md) | ❌ Needs playbook | ❌ Needs `bin/contrib/` | — |
| **3. Review** | ✅ [SOP](review-format.md) | ⚠️ `PR_Review` exists (covers Layer 2 only) | ❌ Needs `bin/review/` | ⚠️ BugBot, Greptile available but not integrated |
| **4. Release** | ✅ [SOP](specfirst-release-process.md) | ❌ Needs playbook | ❌ Needs `bin/release/` | — |
| **5. Evolve** | ⚠️ Template in SpecFlow bundle | ❌ Needs playbook | ❌ Needs `bin/openspec/` | — |
| **∞. Discover** | ✅ [SOP](daemon-registry-protocol.md) | — | ❌ Needs `bin/collab/` | ✅ Swift's daemon-mcp (live) |

**Legend:** ✅ Working — ⚠️ Partial/prototype — ❌ Needs building

### What This Means

**Today:** A contributor follows these SOPs manually. They run SpecFlow to build, then manually extract files, manually run the Maestro PR_Review playbook, manually walk through the 8 release gates. It works — Signal, Context Skill, Jira Skill, and pai-knowledge Bundle all went through this process — but it requires a human who knows the full sequence.

**Goal:** An agent reads the blackboard, picks up a project, and can execute the lifecycle end-to-end with human approval at key gates. The tooling layers make this possible:

1. **Maestro playbooks** make each phase autonomous (agent runs the playbook, produces structured output)
2. **PAI skills** make each phase invocable (agent triggers the skill when it recognizes the context)
3. **External tools** add automated quality gates (run on every PR without human effort)
4. **The Collab skill** ties them together — reads PROJECT.yaml, knows what phase the project is in, orchestrates the right tools

### Where to Contribute

| Deliverable | What It Is | Priority | Owner |
|-------------|-----------|----------|-------|
| Contrib Prep Playbook | Maestro autorun: INVENTORY → SANITIZE → EXTRACT → VERIFY → PUBLISH | High | Seeking contributor |
| Review Playbook | Maestro autorun extending PR_Review for SpecFlow lifecycle | High | @jcfischer |
| Release Playbook | Maestro autorun adapting SpecFirst 8-gate process | Medium | Seeking contributor |
| Open Spec Playbook | Maestro autorun for baseline + Change Proposal management | Medium | @jcfischer |
| PAI Review Skill | `skills/Review/` + `bin/review/` — clone, gate, playbook, findings | High | @mellanon |
| PAI Contrib Prep Skill | `skills/ContribPrep/` + `bin/contrib/` — inventory, sanitize, cherry-pick | Medium | Seeking contributor |
| PAI Release Skill | `skills/Release/` + `bin/release/` — changelog, migration, PR template | Medium | Seeking contributor |
| PAI Collab Skill | `skills/Collab/` + `bin/collab/` — daemon registration, registry, status | High | @mellanon |
| BugBot Integration | GitHub Actions to run BugBot on contrib branch PRs | Low | Seeking contributor |
| Greptile Integration | External review layer for automated quality gates | Low | Seeking contributor |

See [SpecFlow Lifecycle Extension](../projects/specflow-lifecycle/) for the full project context. The skills architecture follows the existing PAI pattern (Jira, Coupa, Signal): `SKILL.md` routing + `bin/tool/` TypeScript CLI + hooks.

---

## Cross-References

- [CONTRIBUTING.md](../CONTRIBUTING.md) — The 6-step contribution flow (PROPOSE → ADOPT → BUILD → REVIEW → SHIP → EVOLVE) that these SOPs support
- [projects/specflow-lifecycle/](../projects/specflow-lifecycle/) — The project to formalize these processes as Maestro playbooks
- [projects/signal/](../projects/signal/) — The first project going through this full lifecycle
- Source document: The [PAI Signal Collaboration Plan](https://github.com/mellanon/pai-collab) Workstreams B (lifecycle) and D (tooling) describe the end-to-end vision
