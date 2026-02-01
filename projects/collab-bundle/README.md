# pai-collab-bundle

CLI skill and tooling for pai-collab blackboard operations.

## Maintainer

@mellanon — [mellanon/pai-collab-bundle](https://github.com/mellanon/pai-collab-bundle)

## Status

`proposed` — Project registered, specification phase next.

## What It Does

A PAI skill + CLI tooling bundle (modelled on [specflow-bundle](https://github.com/jcfischer/specflow-bundle)) that provides structured commands for interacting with the pai-collab blackboard:

- **Issue discovery** — Query open issues by scope, type, and cross-cutting labels
- **Project registration** — Scaffold `projects/` directories with canonical schemas
- **Status updates** — Update PROJECT.yaml, REGISTRY.md, STATUS.md in sync
- **Journal entries** — Append entries following the JOURNAL.md schema
- **Onboarding** — Automate the agent onboarding SOP (ARRIVE through REPORT)
- **Schema validation** — Validate artifacts against CONTRIBUTING.md schemas

## Where It Fits

pai-collab-bundle is infrastructure for the blackboard itself — it codifies the manual processes described in CLAUDE.md and the SOPs into repeatable CLI commands. It complements specflow-bundle (which handles development lifecycle) by handling collaboration lifecycle.

## Architecture

Following the specflow-bundle pattern:

```
pai-collab-bundle/
├── packages/
│   └── collab/              # Main CLI + PAI skill
│       ├── src/
│       │   ├── index.ts     # CLI entry point
│       │   └── commands/    # Command modules
│       └── SKILL.md         # PAI skill definition
├── install.ts               # Automated installer
└── README.md
```

**Runtime:** Bun + TypeScript
**CLI entry point:** `collab`
**PAI skill:** `_COLLAB` (installed to `~/.claude/skills/`)

## Project Files

| File | Purpose |
|------|---------|
| [PROJECT.yaml](PROJECT.yaml) | Source pointer and project metadata |
| [JOURNAL.md](JOURNAL.md) | Journey log |
