# The Hive

An open protocol for human-operated agent networks. Humans at the centre.

**Maintainer:** @mellanon
**Source:** [mellanon/the-hive](https://github.com/mellanon/the-hive)
**Status:** Building

---

## What It Does

The Hive defines the protocol specification for how communities form **hives** (managed collaboration spaces), how operators project state via **spokes**, how **swarms** form around work, how **trust** is earned and scored, and how **skills** distribute through the network.

Seven protocol specifications:
- **Hive Protocol** — how hives form, govern, and federate
- **Spoke Protocol** — how operators project state to hives
- **Swarm Protocol** — how operators form around work dynamically
- **Trust Protocol** — how trust is earned, scored, and made portable
- **Work Protocol** — how work is posted, claimed, and completed
- **Skill Protocol** — how skills are packaged, shared, and installed
- **Operator Identity** — operator profiles and verification

## Where It Fits

The Hive is the protocol layer that connects the existing PAI ecosystem components into a network:

```
┌─────────────────────────────────────────────┐
│  THE HIVE PROTOCOL (this project)           │
│  Defines how components connect             │
└────────────┬────────────────────────────────┘
             │ specifies
┌────────────┴────────────────────────────────┐
│  EXISTING IMPLEMENTATIONS                   │
│  pai-collab (hub), ivy-blackboard (local),  │
│  ivy-heartbeat (dispatch),                  │
│  pai-secret-scanning + pai-content-filter   │
└─────────────────────────────────────────────┘
```

pai-collab itself is "Hive Zero" — the first hive. The Hive protocol formalizes what pai-collab does into a reproducible specification that other communities can adopt.

## Current State

| Deliverable | Status |
|-------------|--------|
| 7 protocol specifications | Draft (all open questions resolved) |
| Architecture document | Complete |
| Implementation plan (7 phases) | Complete |
| Operator experience scenarios | Complete |
| MIT license | Added |

All protocols are resolved — no open design questions remain. Next step is Phase 1 implementation: the spoke contract (`blackboard --level spoke` commands).

---

## Project Files

| File | Purpose |
|------|---------|
| [PROJECT.yaml](PROJECT.yaml) | Source pointers |
| [JOURNAL.md](JOURNAL.md) | Journey log |
