# PAI Signal

Build a signal system that acts as the **connective tissue between all domains of LifeOS** — starting with connecting PAI to a time series observability stack.

Signal is more than monitoring tooling. It's the nervous system: every signal from every domain (PAI sessions, home automation, off-grid infrastructure, calendar, health) flows through a single gateway. PAI is the brain that watches, decides, and directs. The observability stack was the first step in that exploratory journey.

![Signal Gateway: The Nervous System](../../assets/pai-signal-nervous-system.png)

---

## Architecture Direction

The Signal Gateway is **pure transport** — it connects producers to consumers, never decides. Three layers, progressively adoptable:

| Layer | What You Get | Complexity |
|-------|--------------|------------|
| **Stage 0: CLI Only** | JSONL files + grep/jq queries | Zero setup |
| **Stage 1: Local Stack** | Grafana dashboards, historical queries | `docker compose up` |
| **Stage 2+: Distributed** | Multi-machine, alerting, cloud backends | Production-ready |

**Producers** (top layer): PAI hooks, MQTT sensors, webhooks, Telegram, IoT devices — anything that emits a signal.

**Gateway** (middle layer): Vector Collector ingests, routes to all subscribers. Pure transport, no processing logic.

**Consumers** (bottom layer): VictoriaMetrics (storage, calculations, projections), PAI "the brain" (watches, decides, directs), home automation (actuators, devices), Grafana (dashboards, alerts).

![Signal Gateway Transport](../../assets/pai-signal-gateway-transport.png)

**Key infrastructure decisions:**
- **OrbStack** over Docker Desktop (~300MB vs ~2GB RAM)
- **VictoriaMetrics** over Grafana LGTM (~400MB vs ~1GB RAM, 15x better log compression)
- **Vector** as collector (excellent self-observability, tails JSONL natively)
- **Grafana** for dashboards (portable — works with either backend)

The full technical specification lives in the source repository and will be available once the contrib branch is published.

---

## Current State

| Phase | Status |
|-------|--------|
| Specify | ✅ Done — shared as [gist](https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7), community feedback from Discord |
| Build | ✅ Done — Maestro + SpecFlow, 18 features, 708 tests |
| Harden | ✅ Done — 11 commits, ~9,800 lines of acceptance fixes and emergent features |
| **Contrib Prep** | 🏃 **Current** — extracting ~102 files from private trunk, sanitizing |
| Review | ⏳ Pending — seeking independent community reviewers |
| Release | ⏳ Pending — PR packaging, changelog, migration guide |

**Track progress:** [Signal issues on the blackboard](https://github.com/mellanon/pai-collab/issues?q=is%3Aissue+label%3Aproject%2Fsignal)

---

## How It Was Built

Built using [Maestro](https://runmaestro.ai/) playbooks with Claude Code, PAI, and [SpecFlow](https://github.com/jcfischer/specflow-bundle) working together. Two parallel agents produced 18 features in about 24 hours of autonomous execution.

### The 80/20 Split

| Who | Commits | Lines | Nature |
|-----|---------|-------|--------|
| Maestro | 255 | ~25,500 | Autonomous feature implementation from spec |
| Human | 11 | ~9,800 | Integration fixes, infrastructure gaps, emergent features |

The human work was the "last mile" — requirements that only surface through actual usage:
- Acceptance fixes (OTLP mismatch, Grafana URLs, test isolation)
- Infrastructure gaps (Vector health ports, agent file inclusion)
- Emergent features (session-scoped tracing, multi-tool correlation, visual hierarchy logging)

---

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

---

## Why This Matters

Signal is the first project through the blackboard system. It tests the entire collaboration pipeline: Contrib Prep → community review → PR packaging → merge. If the process works for Signal (25,000 lines, 102 files, complex Docker infrastructure), it works for smaller contributions too. See [JOURNAL.md](JOURNAL.md) for the full story.

---

## Project Files

| File | What It Contains |
|------|-----------------|
| [JOURNAL.md](JOURNAL.md) | Journey log — what happened, what's emerging |
| [PROJECT.yaml](PROJECT.yaml) | Source pointers — repo, branch, paths, test command |
| [reviews/](reviews/) | Community review findings |

## References

- [Full Spec (Gist)](https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7) — original requirements shared on Discord
- [Maestro PAI Playbooks](https://github.com/mellanon/maestro-pai-playbooks) — playbook-driven development
- [Signal Gateway Transport Diagram](../../assets/pai-signal-gateway-transport.png)
