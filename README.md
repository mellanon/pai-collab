# PAI Community Blackboard

> *"What if multiple PAI instances — each with their own human operator — could work together on shared projects? Not autonomous chaos, but structured collaboration with human control."*

A shared coordination space where PAI community members collaborate on projects using their own agents. This is not a code repository — it's the **planning table** where independent contributors align on what to build, review each other's work, and track progress across PAI projects.

![The PAI Blackboard — Community collaboration through shared knowledge](assets/pai-blackboard-collaboration.png)

---

## How This Works

This repo implements the [blackboard architecture](https://en.wikipedia.org/wiki/Blackboard_(design_pattern)) (Hayes-Roth, 1985) — a formal model for independent knowledge sources collaborating through a shared knowledge base:

| Component | What It Means Here |
|-----------|-------------------|
| **Blackboard** | This repo — specs, project context, reviews, journey logs |
| **Knowledge Sources** | Each community member's PAI instance, working independently |
| **Control** | Human-in-the-loop — maintainers triage, review, and merge via PRs |

**Code lives elsewhere.** Each project has a `PROJECT.yaml` pointing to its source repository, branch, and paths. The blackboard tracks *coordination* — what's being built, by whom, what state it's in, and what's needed. Contributors work freely on their own forks; the structured rigour comes at merge time.

### Files and Issues

**Files are static artifacts. Issues are dynamic work.** Markdown files in this repo (READMEs, JOURNALs, SOPs, PROJECT.yaml) capture stable knowledge — architecture decisions, process documentation, project context. [GitHub Issues](https://github.com/mellanon/pai-collab/issues) track dynamic work — tasks, ideas, review requests, milestones. If it changes state (open → closed, blocked → unblocked), it's an issue. If it's reference material, it's a file.

### Three Layers

```
Discord                          Blackboard (this repo)            Daemon Registry
──────                           ──────────────────────            ───────────────
Communication                    Coordination                      Discovery
Ideas, discussion, feedback      Specs, status, reviews            Agent capabilities
Ephemeral (threads archive)      Permanent (Git = immutable log)   Decentralized (MCP)
```

**Discord** is where you talk about the work. **The blackboard** is where you track the work. **The daemon registry** is where agents find each other. Ideas surface on Discord; decisions land here. When a Discord thread archives, nothing is lost — the structured output already lives in Git.

---

## Projects and Registry

See [REGISTRY.md](REGISTRY.md) for active projects, their status, maintainers, and the agent directory.

---

## How It All Connects

The blackboard is a coordination surface — it tracks *what's being built*, not the code itself. Each project points to where its code lives via `PROJECT.yaml`:

| Blackboard Project | What It Is | Code Lives At | Maintainer |
|-------------------|-----------|---------------|------------|
| [Signal](projects/signal/) | Observability stack for PAI | Private branch — public contrib branch TBD | @mellanon |
| [SpecFlow Lifecycle](projects/specflow-lifecycle/) | Four missing lifecycle playbooks | [jcfischer/specflow-bundle](https://github.com/jcfischer/specflow-bundle) | @jcfischer |
| [Skill Enforcer](projects/skill-enforcer/) | Deterministic skill surfacing hook | [jcfischer/pai-skill-enforcer](https://github.com/jcfischer/pai-skill-enforcer) | @jcfischer |

| Shared Resource | What It Is |
|----------------|-----------|
| [Maestro PAI Playbooks](https://github.com/mellanon/maestro-pai-playbooks) | Playbook-driven autonomous development — SpecFlow, PR Review, constitutional docs |

The blackboard holds vision, status, reviews, and SOPs. The source repos hold the code. Contributors work on their own forks; structured rigour comes at merge time.

### The Development Lifecycle

Every contribution follows the same lifecycle — from spec to shipped code. The [SOPs](sops/) document each phase:

```
SPECIFY → BUILD → HARDEN → CONTRIB PREP → REVIEW → RELEASE → EVOLVE
```

| Phase | Question | SOP |
|-------|----------|-----|
| **Specify** | "What are we building?" | [SpecFlow Development Pipeline](sops/specflow-development-pipeline.md) (specify phase) |
| **Build** | "How do I build this?" | [SpecFlow Development Pipeline](sops/specflow-development-pipeline.md) |
| **Harden** | "Does this survive real use?" | Human acceptance testing — no SOP (project-specific) |
| **Contrib Prep** | "Is this safe to share?" | [Contribution Preparation](sops/contribution-protocol.md) |
| **Review** | "Is this good code?" | [Review Format](sops/review-format.md) |
| **Release** | "Is this ready to merge?" | [SpecFirst Release Process](sops/specfirst-release-process.md) |
| **Evolve** | "How does this grow?" | Open Spec baseline + Change Proposals |
| **Discover** | "How do agents find each other?" | [Daemon Registry Protocol](sops/daemon-registry-protocol.md) |

Build → Contrib Prep → Review → Release are sequential — each phase produces input for the next. Discovery runs in parallel. See the [SOPs README](sops/README.md) for how they connect.

---

## Origin

Several threads converged into this idea:

**Daemon infrastructure** — On the PAI community Discord, Swift ([@0xsalt](https://github.com/0xsalt)) was building a [daemon registry](https://github.com/0xsalt/daemon-mcp) for agent discovery. Chris Cantey proposed a [community directory](https://share.chriscantey.com/Ffz01RmDUskQ3HPOEO/index.html). The broader question: how could PAI instances find and interact with each other?

**Bot networks at scale** — [Moltbook](https://gagadget.com/en/693922-the-day-has-come-ai-agents-have-their-own-social-network-moltbook/) proved autonomous agent interaction works — 37,000+ AI agents communicating. Social, not productive, but proof the pattern scales.

**A working implementation** — Daniel Miessler shared his GitHub-based operating model on X: humans and AI workers coordinating through a shared repo with `TASKLIST.md` as the central knowledge base.

**Pattern recognition** — Andreas ([@mellanon](https://github.com/mellanon)) and Jens-Christian Fischer ([@jcfischer](https://github.com/jcfischer)) discussed Daniel's post. Jens recognized the formal pattern: the [blackboard architecture](https://en.wikipedia.org/wiki/Blackboard_(design_pattern)) (Hayes-Roth, 1985) — independent knowledge sources collaborating through a shared knowledge base with human control.

That convergence — daemon discovery + bot network proof-of-concept + practical implementation + architectural pattern recognition, all emerging from community conversations — is itself an example of the blackboard in action.

---

## Personal and Shared Blackboards

pai-collab is a **shared coordination layer** — it doesn't replace your personal system of record. Each operator maintains their own board (PAI's `WORK/` directory, a personal repo, or any GitHub-based model). The shared blackboard tracks only the work that involves other people: milestones, reviews, coordination, and shared processes.

The connection point is `PROJECT.yaml` — each project here points to where its code lives. You work on your board; you coordinate here.

See **[BLACKBOARD-MODEL.md](BLACKBOARD-MODEL.md)** for the full two-level model, process description, learning loop, and comparison with Daniel Miessler's ULWork operating model.

---

## Repo Structure

```
pai-collab/
├── README.md                    # You are here
├── REGISTRY.md                  # Active projects + agent directory
├── CONTRIBUTING.md              # How work flows through the blackboard
│
├── projects/
│   ├── signal/                  # PAI Signal — observability stack
│   │   ├── README.md            # Project overview, architecture, status
│   │   ├── PROJECT.yaml         # Source pointers (repo, branch, paths, tests)
│   │   ├── JOURNAL.md           # Journey log — what happened, what's emerging
│   │   └── reviews/             # Community review findings
│   │
│   ├── specflow-lifecycle/      # SpecFlow lifecycle extension
│   └── skill-enforcer/          # Deterministic skill surfacing
│
├── sops/                        # Shared processes (how we work together)
└── assets/                      # Architecture diagrams and visuals
```

---

## Get Involved

1. **Browse** — Read project READMEs and [open issues](https://github.com/mellanon/pai-collab/issues) to understand what's happening
2. **Fork + PR** — All contributions flow through pull requests. No write access needed.
3. **Register your agent** — Add a daemon entry to [REGISTRY.md](REGISTRY.md) via PR
4. **Start a project** — Create a `projects/` directory for coordinated work or standalone tools
5. **Propose an idea** — Open an issue with the `type/idea` label
6. **Improve a process** — Submit SOP updates to `sops/` via PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution protocol and [REGISTRY.md](REGISTRY.md) for the different types of contributions.

---

## References

| Resource | What |
|----------|------|
| [PAI](https://github.com/danielmiessler/PAI) | Personal AI Infrastructure — the upstream project |
| [Daemon](https://github.com/danielmiessler/Daemon) | Personal API framework for agent identity |
| [daemon-mcp](https://github.com/0xsalt/daemon-mcp) | Daemon registry — agent discovery via MCP |
| [SpecFlow Bundle](https://github.com/jcfischer/specflow-bundle) | Spec-driven development methodology |
| [Maestro PAI Playbooks](https://github.com/mellanon/maestro-pai-playbooks) | Playbook-driven autonomous development |
| [VS Code Iteration Plans](https://github.com/microsoft/vscode/wiki/Iteration-Plans) | Inspiration for project coordination format |
| [Greptile](https://www.greptile.com/blog/ai-code-review-bubble) | Independent AI code review — "the auditor doesn't prepare the books" |
| [Cursor BugBot](https://cursor.com/bugbot) | Automated pre-merge logic bug detection |
| [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) | HITL agent orchestration at 10x speed |
