# ivy-heartbeat

Proactive monitoring and agent dispatch for PAI systems.

## Maintainer & Source

- **Maintainer:** [@jcfischer](https://github.com/jcfischer)
- **Source:** [jcfischer/ivy-heartbeat](https://github.com/jcfischer/ivy-heartbeat)

## Status

**shipped** — CI passing, 214 tests, launchd scheduling

## What It Does

ivy-heartbeat is the *time* dimension to ivy-blackboard's *state* dimension. It runs on a schedule (macOS launchd), checks a configurable set of evaluators, and acts on what it finds.

Key features:
- **Checklist evaluation** — Parse markdown checklists with YAML frontmatter, evaluate due items
- **Built-in evaluators** — Calendar conflict detection, email backlog monitoring
- **Multi-channel alerts** — Terminal notifications, voice (PAI voice server), email
- **Cost guard** — Skip evaluation when nothing is due, bypass with `--force`
- **FTS5 search** — Full-text search across all events
- **Web dashboard** — Summary stats, event stream, heartbeat timeline
- **Agent dispatch** — Read blackboard, claim available work, dispatch Claude agents

## Where It Fits

Together with ivy-blackboard, ivy-heartbeat creates a system where:
1. Projects post work to the blackboard
2. ivy-heartbeat queries for available work on a schedule
3. Agents claim and execute work items
4. Progress is observable via dashboards and event logs
5. Failures are recoverable through session liveness checking

This is the foundation for autonomous agent coordination in PAI.

## Project Files

| File | Description |
|------|-------------|
| [PROJECT.yaml](PROJECT.yaml) | Machine-readable project identity |
