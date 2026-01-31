# PAI Signal Architecture Spec

> *Codename: **Signal** — Advanced observability stack built on existing JSONL infrastructure.*

**Full spec source:** [SpecFlow Development Assets](https://github.com/mellanon/maestro-pai-playbooks/tree/main/playbooks/SpecFlow_Development/assets) | [Original Gist](https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7)

---

## Executive Summary

**What:** An advanced observability pipeline — Vector Collector consuming JSONL Events and forwarding to pluggable backends (VictoriaMetrics, Grafana LGTM, or cloud services). Complements the basic PAI Observability Server which reads JSONL directly.

**Why:** PAI agents run autonomously — you need to know what's happening, what's failing, and what it costs. The basic Observability Server gives current session visibility. The Signal Stack adds cross-session analysis, alerting, and multi-system aggregation.

**How:** Three-layer progressive architecture:

| Layer | What You Get | Complexity |
|-------|--------------|------------|
| **Stage 0: CLI Only** | JSONL files + grep/jq queries | Zero setup |
| **Stage 1: Local Stack** | Grafana dashboards, historical queries | `docker compose up` |
| **Stage 2+: Distributed** | Multi-machine, alerting, cloud backends | Production-ready |

---

## Relationship to PAI Observability Server

| System | PAI Observability Server | PAI Signal Stack (This Spec) |
|--------|--------------------------|------------------------------|
| **Fed From** | Direct read from JSONL Events | Vector Collector |
| **Focus** | Current session visibility | Cross-session analysis & alerting |
| **Analogy** | Browser DevTools | Datadog/Grafana |
| **Scope** | Single PAI instance | Multi-system (PAI + home automation + off-grid) |
| **Storage** | In-memory (1000 events) | Persistent (weeks/months) |
| **Use Case** | "What's happening now?" | "What patterns emerge over time?" |

Both paths are near real-time. The hooks write JSONL files that:
1. PAI Observability Server reads directly (basic current session visibility)
2. Vector Collector tails and transforms for the Signal Stack (advanced cross-session analysis)

---

## Infrastructure Decisions

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Container runtime** | OrbStack | ~300MB RAM vs Docker Desktop's ~2GB. Drop-in replacement. |
| **Observability stack** | VictoriaMetrics | ~400MB RAM vs Grafana LGTM's ~1GB. 15x better log compression. Single-vendor consistency. |
| **Collector** | Vector | Excellent self-observability (`vector top`), rich transform pipeline, tails JSONL natively. |
| **Dashboards** | Grafana | Portable — works with either VM or LGTM backend. |

---

## Data Architecture

### Two Data Types

- **Logs & Traces** = Textual (strings, JSON, structured events) — "What happened?"
- **Metrics** = Numeric (integers, floats, counters, gauges) — "How much/how many?"

### The Flow

```
Events (JSONL)                    Metrics (derived)
─────────────                     ─────────────────
{"event_type":"session.end",      ──► pai_session_duration_seconds
 "data":{"duration_ms":12345}}        histogram

{"event_type":"skill.error"}      ──► pai_skill_errors_total
                                      counter (labels: skill, code)

{"event_type":"api.cost",         ──► pai_api_cost_usd_total
 "data":{"cost_usd":0.42}}            counter (labels: model, skill)
```

**Approach:** Capture events first (JSONL = source of truth), derive metrics via Vector transforms at collection time. Write events once, get metrics for free.

---

## PAI Integration: Three Tiers

| Tier | What | Where |
|------|------|-------|
| **Tier 1: Core PAI** | Built-in instrumentation — hooks emit JSONL events. Zero config. | `hooks/lib/events.ts`, `MEMORY/Events/` |
| **Tier 2: Observability Skill** | Enhanced querying, stack management, dashboard deployment. Installable. | `skills/Observability/SKILL.md` |
| **Tier 3: Signal Stack** | Full Docker pipeline — Vector + VictoriaMetrics + Grafana. | `Observability/docker-compose.yml` |

---

## Core Building Blocks for Trusted AI Agents

Based on AWS Bedrock Agent Core patterns:

| Building Block | Purpose | Signal Coverage |
|---------------|---------|-----------------|
| **Policy** | Enforceable boundaries | Via hook validation |
| **Identity** | Clear agency & delegation chains | session_id, agent_instance_id |
| **Memory** | Context without poisoning risk | JSONL audit trail |
| **Observability** | Full audit trail of decisions and actions | This spec |
| **Evaluations** | Continuous quality assurance | Quality gates in SpecFirst |
| **Runtime** | Isolation prevents cross-contamination | Container-based stack |
| **Gateway** | Controlled blast radius for tools | Hook-level gating |

---

## 18 Features

The spec defines 18 features across the Signal stack. For the complete feature list, acceptance criteria, and detailed architecture diagrams, see the [full spec](https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7).

Key feature areas:
- **Event instrumentation** — Structured JSONL events from all PAI hooks
- **Trace collection** — OTLP trace export (HTTP + gRPC) with session-scoped correlation
- **Metrics derivation** — Vector transforms extracting numeric metrics from events
- **Storage** — VictoriaMetrics (metrics), VictoriaLogs (logs), VictoriaTraces (distributed traces)
- **Visualization** — Grafana provisioned dashboards for sessions, tools, agents, costs
- **Docker orchestration** — Full stack via `docker compose up`
- **Testing** — 708 tests across L1–L4 acceptance levels
