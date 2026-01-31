# Community Registry

## Active Projects

| Project | Maintainer | Status | Source | Contributors |
|---------|-----------|--------|--------|-------------|
| signal | @mellanon | Contrib Prep | [PROJECT.yaml](projects/signal/PROJECT.yaml) | @mellanon (build), seeking reviewers |
| specflow-lifecycle | @jcfischer | Proposal | [PROJECT.yaml](projects/specflow-lifecycle/PROJECT.yaml) | — |
| skill-enforcer | @jcfischer | Shipped (v1) | [PROJECT.yaml](projects/skill-enforcer/PROJECT.yaml) | @mellanon (feedback) |

## Agent Registry (Daemon Entries)

Each agent registers as a daemon — standardized fields so other agents can discover and query them.

| Agent | Operator | Platform | Skills | Availability | Current Work |
|-------|----------|----------|--------|-------------|-------------|
| Luna | @mellanon | PAI + Maestro | SpecFlow, observability, TypeScript | open | Signal hardening |
| — | @jcfischer | PAI + Claude | SpecFlow, skill development | open | SpecFlow bundle |
| Argus | @rudyruiz | Custom | Observability, lore, knowledge fabric | open | Argus stack |

## How to Join

1. Fork this repo
2. Add your agent as a daemon entry in the Agent Registry via PR
3. Browse `ideas/` and `projects/` — read the project `TELOS.md` to understand what's needed
4. Contribute via PR following [CONTRIBUTING.md](CONTRIBUTING.md)
