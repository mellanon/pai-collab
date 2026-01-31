# Signal — Project Telos

## Mission

Build a signal system that acts as the **connective tissue between all domains of LifeOS** — starting with connecting PAI to a time series observability stack.

Signal is more than monitoring tooling. It's the nervous system: every signal from every domain (PAI sessions, home automation, off-grid infrastructure, calendar, health) flows through a single gateway. PAI is the brain that watches, decides, and directs. The observability stack was the first step in that exploratory journey.

![Signal Gateway: The Nervous System](../../assets/pai-signal-nervous-system.png)

## What It Does

PAI Signal is an advanced observability pipeline — Vector Collector consuming JSONL Events and forwarding to pluggable backends:

- **JSONL event logging** with structured metadata from all PAI hooks
- **OTLP trace collection** (HTTP + gRPC) with session-scoped correlation
- **VictoriaMetrics storage** for metrics, logs, and distributed traces
- **Grafana dashboards** provisioned for sessions, tools, agents, costs
- **Docker Compose orchestration** — `docker compose up` for the full stack
- **Progressive architecture** — CLI-only (Stage 0) → Local stack (Stage 1) → Distributed (Stage 2+)

## Current State

- **18 features** implemented from spec
- **708 tests** passing (L1–L4 acceptance levels)
- **25,000 lines** from Maestro (255 commits) + **~9,800 lines** human hardening (11 commits)
- Working end-to-end on private branch `feature/signal-agent-2`
- **Currently:** Extracting from private trunk for community collaboration

## The 80/20 Split

| Who | Commits | Lines | Nature |
|-----|---------|-------|--------|
| Maestro | 255 | ~25,500 | Autonomous feature implementation from spec |
| Human | 11 | ~9,800 | Integration fixes, infrastructure gaps, emergent features |

The human work was the "last mile" — requirements that only surface through actual usage:
- Acceptance fixes (OTLP mismatch, Grafana URLs, test isolation)
- Infrastructure gaps (Vector health ports, agent file inclusion)
- Emergent features (session-scoped tracing, multi-tool correlation, visual hierarchy logging)

## Success Criteria

- [ ] Clean contrib branch with only Signal files (~102 files)
- [ ] Independent community review completed
- [ ] PR merged to upstream `danielmiessler/PAI`
- [ ] At least one community member running the observability stack

## Key Challenge

The code works but is AI-generated at scale. **"Works" ≠ "merge-ready."** Need independent review for:
- Architectural fit with existing PAI patterns
- Code style consistency and convention adherence
- Redundancy and dead code
- Non-functional concerns (Docker footprint, resource usage)
- Security (no exposed secrets, proper input validation)
- Test quality (are 708 tests meaningful? coverage gaps?)

Human-touched code (the 9,800 lines) deserves *more* review scrutiny — it was written to fix what the machine got wrong.

## Why This Matters

Signal is the first project through the blackboard system. It tests the entire collaboration pipeline: Contrib Prep → community review → PR packaging → merge. If the process works for Signal (25,000 lines, 102 files, complex Docker infrastructure), it works for smaller contributions too.

## References

- [Architecture Spec](SPEC.md) | [Full Spec (Gist)](https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7)
- [Maestro PAI Playbooks](https://github.com/mellanon/maestro-pai-playbooks)
- [Signal Gateway Transport Diagram](../../assets/pai-signal-gateway-transport.png)
