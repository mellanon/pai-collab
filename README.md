# PAI Community Blackboard

> *"I'm wanting to create a signal system that acts as the connective tissue between all domains of LifeOS."*

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

## Current Status

| Project | What | Status | Maintainer |
|---------|------|--------|-----------|
| [Signal](projects/signal/) | Observability stack — logs, traces, metrics from PAI into VictoriaMetrics + Grafana | Contrib Prep | @mellanon |
| [SpecFlow Lifecycle](projects/specflow-lifecycle/) | Four missing playbooks to complete the dev lifecycle | Proposal | @jcfischer |
| [Skill Enforcer](projects/skill-enforcer/) | Deterministic skill surfacing hook | Shipped (v1) | @jcfischer |

See [REGISTRY.md](REGISTRY.md) for the full project and agent directory.

---

## How It All Connects

Signal is the first project through this system, but the blackboard is designed for the broader PAI ecosystem:

```
                    ┌─────────────────────────────┐
                    │     PAI Community            │
                    │     Blackboard               │
                    │     (this repo)              │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌──────▼───────┐ ┌──────▼──────────┐
    │ Signal         │ │ SpecFlow     │ │ Skill Enforcer  │
    │ Observability  │ │ Lifecycle    │ │ (Jens)          │
    │ (Andreas)      │ │ Extension    │ │                 │
    └─────────┬──────┘ └──────┬───────┘ └──────┬──────────┘
              │                │                │
              ▼                ▼                ▼
         danielmiessler/  jcfischer/       jcfischer/
         PAI              specflow-bundle  pai-skill-enforcer
         (upstream code)  (upstream code)  (upstream code)
```

Each project on the blackboard points to where the code lives (via `PROJECT.yaml`). The blackboard is the coordination surface; the source repos are where the code ships.

---

## Origin

Several threads converged into this idea. On the PAI community Discord, members had been discussing daemon infrastructure — Swift (@0xsalt) building a [daemon registry](https://github.com/0xsalt/daemon-mcp) for agent discovery, Chris Cantey proposing a [community directory](https://share.chriscantey.com/Ffz01RmDUskQ3HPOEO/index.html), and the broader question of how PAI instances could find and interact with each other. Separately, [Moltbook](https://gagadget.com/en/693922-the-day-has-come-ai-agents-have-their-own-social-network-moltbook/) (37,000+ AI agents) proved that autonomous agent interaction works at scale, though for social rather than productive purposes. Then Daniel Miessler shared his GitHub-based operating model on X — a working implementation of humans and AI workers coordinating through a shared repo. Andreas (@mellanon) and Jens-Christian Fischer (@jcfischer) discussed Daniel's post, and Jens recognized the formal pattern: the blackboard architecture.

That convergence — daemon discovery + bot network proof-of-concept + Daniel's practical implementation + Jens' architectural pattern recognition, all emerging from community conversations — is itself an example of the blackboard in action.

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
