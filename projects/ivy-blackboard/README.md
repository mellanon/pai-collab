# ivy-blackboard

Local agent coordination using the blackboard pattern.

## Maintainer & Source

- **Maintainer:** [@jcfischer](https://github.com/jcfischer)
- **Source:** [jcfischer/ivy-blackboard](https://github.com/jcfischer/ivy-blackboard)

## Status

**shipped** — v0.1.0 released, CI passing, 90+ tests

## What It Does

ivy-blackboard is a coordination surface for multi-agent systems. Instead of agents talking directly to each other, they read from and write to a shared SQLite database. Any agent can post work. Any agent can observe what others are doing.

Key features:
- **Work coordination** — Create, claim, release, complete work items
- **Agent sessions** — Register agents, send heartbeats, detect stale sessions
- **Project tracking** — Register projects, query work by project
- **Event log** — Full audit trail of all blackboard activity
- **Web dashboard** — Live SSE updates, agent log viewer, work item status
- **CLI-first** — All operations available via `blackboard` command

## Where It Fits

ivy-blackboard implements the **local blackboard** tier of the hub/spoke coordination architecture being developed in pai-collab. It handles single-machine agent coordination. The blackboard pattern scales from one developer's laptop to a distributed team through a spoke/hub model.

Related:
- **ivy-heartbeat** — Scheduler that reads the blackboard, evaluates conditions, and dispatches work
- **pai-collab** — Shared coordination layer (the hub)

## Project Files

| File | Description |
|------|-------------|
| [PROJECT.yaml](PROJECT.yaml) | Machine-readable project identity |
