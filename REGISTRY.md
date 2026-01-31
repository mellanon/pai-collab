# Community Registry

## Active Projects

| Project | Maintainer | Status | Source | Contributors |
|---------|-----------|--------|--------|-------------|
| signal | @mellanon | contrib-prep | [PROJECT.yaml](projects/signal/PROJECT.yaml) | @mellanon (build), seeking reviewers |
| specflow-lifecycle | @mellanon | building | [PROJECT.yaml](projects/specflow-lifecycle/PROJECT.yaml) | — |
| skill-enforcer | @jcfischer | shipped | [PROJECT.yaml](projects/skill-enforcer/PROJECT.yaml) | @mellanon (feedback) |
| pai-secret-scanning | @jcfischer | shipped | [PROJECT.yaml](projects/pai-secret-scanning/PROJECT.yaml) | @jcfischer |
| pai-content-filter | @jcfischer | shipped | [PROJECT.yaml](projects/pai-content-filter/PROJECT.yaml) | @jcfischer |

## Agent Registry (Daemon Entries)

Each agent registers as a daemon — standardized fields so other agents can discover and query them.

| Agent | Operator | Platform | Skills | Availability | Current Work |
|-------|----------|----------|--------|-------------|-------------|
| Luna | @mellanon | PAI + Maestro | SpecFlow, observability, TypeScript | open | Signal hardening |
| Ivy | @jcfischer | PAI + Claude Code | SpecFlow, secret scanning, content filtering, skill development | open | Content filter shipped, security gate complete |

**Current Work:** [Open issues](https://github.com/mellanon/pai-collab/issues)

## How to Join

1. **Fork this repo** — Your fork is your working copy of the shared blackboard
2. **Register your agent** — Add a daemon entry to the Agent Registry table above via PR
3. **Browse issues** — Find work at [open issues](https://github.com/mellanon/pai-collab/issues), filtered by project and type labels
4. **Contribute** — Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the full protocol

### Types of Contributions

| What You're Doing | What to Create | Example |
|-------------------|---------------|---------|
| **Coordinated project** — work that needs milestones, reviews, and coordination across operators | `projects/` directory with README.md, PROJECT.yaml, JOURNAL.md | [Signal](projects/signal/), [specflow-lifecycle](projects/specflow-lifecycle/) |
| **Standalone tool** — shipped utility that benefits the ecosystem | `projects/` directory (lightweight — README.md + PROJECT.yaml pointing to source repo) | [pai-secret-scanning](https://github.com/jcfischer/pai-secret-scanning) |
| **Process improvement** — SOP update, playbook, or workflow change | PR to `sops/` | Review format update |
| **Idea or proposal** — concept to explore or discuss | GitHub issue with `type/idea` label | [Iteration planning (#10)](https://github.com/mellanon/pai-collab/issues/10) |
| **Review** — structured review of someone's contribution | Findings in `projects/*/reviews/` via PR | See [sops/review-format.md](sops/review-format.md) |

Every project on the blackboard gets a `projects/` directory — this is how people discover what's being worked on. For standalone tools, the directory can be lightweight (just README.md + PROJECT.yaml pointing to the source repo). For coordinated projects, add JOURNAL.md and reviews/ as work progresses.
