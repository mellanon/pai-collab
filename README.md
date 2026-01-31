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

The [SOPs](sops/) document the end-to-end lifecycle — from building with SpecFlow, through contribution preparation and review, to release. Tooling support is partial today; completing it is a key collaboration goal. See the [SOPs README](sops/README.md) for the full tooling maturity matrix.

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

> **Note:** This section describes how a personal blackboard (like Daniel Miessler's [ULWork](https://github.com/danielmiessler/ULWork)) could connect to pai-collab's shared blackboard. The ULWork analysis is based on what Daniel has shared publicly — it may not fully represent his implementation.

Many PAI operators maintain their own system of record — a personal repo, PAI's built-in `WORK/` directory, or something like Daniel Miessler's ULWork model (GitHub as system of record with `TASKLIST.md`, Issues, SOPs, and deep context). pai-collab is not a replacement for any of these. It's the **shared coordination layer on top**.

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│   Operator A's Personal Board   │     │   Operator B's Personal Board   │
│                                 │     │                                 │
│  All your work, your context,   │     │  All your work, your context,   │
│  your agents, your priorities   │     │  your agents, your priorities   │
│                                 │     │                                 │
│  PROJECT.yaml ──────────────────┼──┐  │  PROJECT.yaml ──────────────────┼──┐
└─────────────────────────────────┘  │  └─────────────────────────────────┘  │
                                     │                                       │
                                     ▼                                       ▼
                    ┌────────────────────────────────────────┐
                    │     pai-collab (Shared Blackboard)      │
                    │                                        │
                    │  Only what involves other people:       │
                    │  • Shared project milestones            │
                    │  • Review requests                      │
                    │  • Community coordination                │
                    │  • Shared SOPs and processes             │
                    │                                        │
                    │  Code lives in project repos ───────────┼──→ github.com/...
                    └────────────────────────────────────────┘
```

Your personal board tracks everything you care about. pai-collab tracks only the work that involves other people.

### How the models relate

| Daniel's ULWork (single operator) | pai-collab (multi-operator) | Why different |
|-----------------------------------|----------------------------|---------------|
| `TASKLIST.md` as dashboard | GitHub Issues with label filtering | Multiple operators can't share one task list |
| Bots auto-update SOPs | SOPs updated via human PR | Multiple operators need review before process changes |
| Single board for all work | Two-layer: personal + shared boards | Each operator has their own context |
| Direct write access | Fork + PR model | Access control for multiple contributors |
| One operator's agents | Multiple operators' agents + daemon registry | Agent discovery across operators |

What we share with the ULWork model: GitHub as system of record, Issues for dynamic work tracking, SOPs as process knowledge, and a learning loop (Work → Learn → Update Repo → Better Work).

The connection point is `PROJECT.yaml` — each project on the shared blackboard points to where its code lives. An operator working on Signal has their own branch, their own agents, their own priorities. When they need coordination — a review, a milestone check, a process question — that happens here.

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
│   │   ├── TELOS.md             # Vision, architecture direction, goals, challenges
│   │   ├── JOURNAL.md           # Journey log — what happened, what's emerging
│   │   ├── OPEN-SPEC.md         # Living spec (post-v1.0 evolution)
│   │   └── reviews/             # Community review findings
│   │
│   ├── specflow-lifecycle/      # SpecFlow lifecycle extension
│   └── skill-enforcer/          # Deterministic skill surfacing
│
├── ideas/                       # Proposals not yet adopted as projects
├── sops/                        # Shared processes (how we work together)
└── assets/                      # Architecture diagrams and visuals
```

---

## Get Involved

1. **Browse** — Read project READMEs and `TELOS.md` files to understand what each project needs
2. **Fork + PR** — All contributions flow through pull requests. No write access needed.
3. **Register your agent** — Add a daemon entry to [REGISTRY.md](REGISTRY.md) via PR
4. **Propose an idea** — Drop a markdown file in `ideas/` via PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution protocol.

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
