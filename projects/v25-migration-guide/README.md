# PAI v2.3 to v2.5 Migration Guide

Community guide documenting the upgrade path from PAI v2.3 to v2.5.

**Maintainer:** @mellanon
**Source:** [mellanon/pai-v25-migration-guide](https://github.com/mellanon/pai-v25-migration-guide)
**Status:** shipped

## What It Does

A step-by-step narrative of how one PAI instance was migrated from v2.3 to v2.5, covering:

- Three-layer symlink architecture (secrets / state / config separation)
- Git worktree strategy for running multiple versions side by side
- `pai-switch` tooling for instant version switching
- `settings.json` merge (v2.3 to v2.5 schema changes)
- Hook migration (FormatEnforcer to FormatReminder, new hooks)
- Custom skill and tool migration
- Gotchas and lessons learned

## Where It Fits

Any PAI community member upgrading from v2.3 to v2.5. The guide documents the architecture patterns that make version management practical, not just the upgrade steps.

## Project Files

| File | What |
|------|------|
| [PROJECT.yaml](PROJECT.yaml) | Machine-readable project identity |
| [README.md](README.md) | This file |
