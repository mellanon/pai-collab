# SOP: SpecFlow Development Pipeline

How projects are built using the SpecFlow + Maestro development pipeline.

## The Pipeline

```
SPECIFY → PLAN → TASKS → IMPLEMENT
   │        │       │         │
   │        │       │         └── TDD loop: RED → GREEN → BLUE per task
   │        │       └── Implementation breakdown with task-level tracking
   │        └── Architecture design, validated at ≥80% quality gate
   └── Interview-driven specs (8-phase protocol), validated at ≥80% quality gate
```

This pipeline produces **working, tested code on a feature branch**. Signal proved this: two parallel agents, 18 features, 708 tests, ~25,000 lines in 24 hours of autonomous execution.

## The Gap: What Happens After IMPLEMENT

The pipeline gets you to code that passes tests. But between "tests pass" and "safe to share," Signal exposed a missing phase:

### Acceptance Hardening (Not Yet Formalized)

After Maestro's autonomous build, a human ran the system end-to-end and discovered what the spec missed:

| What Maestro Built | What the Human Fixed |
|--------------------|--------------------|
| OTLP trace collection | OTLP HTTP/gRPC protocol mismatch |
| Docker Compose config | Vector health port conflicts |
| Test suites | Test isolation failures across features |
| Grafana provisioning | Datasource URL configuration |
| — | Session-scoped tracing (emergent feature) |
| — | Visual hierarchy logging (emergent feature) |
| — | Multi-tool span correlation (emergent feature) |

**The 80/20 split:**

| Who | Commits | Lines | Nature of Work |
|-----|---------|-------|----------------|
| **Maestro** | 255 | ~25,500 | Autonomous feature implementation from spec |
| **Human** | 11 | ~9,800 | Integration fixes, infrastructure gaps, emergent features |

Maestro builds what the spec says. The human discovers what the spec missed by actually running the system. This acceptance hardening step — run end-to-end, verify integration points, check non-functional behavior, add emergent requirements — should become a formal SpecFlow phase. It's the bridge between "tests pass" and "ready for Contrib Prep."

### The HITL Speed Problem

The bottleneck isn't the agents — it's the human's ability to review, decide, and direct at the speed agents produce. Tools like [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) (task orchestration across multiple agents) and Maestro (playbook-driven auto-run) are on the same trajectory: making the human effective as a 10x operator by structuring agent output for rapid human review rather than requiring line-by-line reading.

This motivates the entire lifecycle extension — layering automated gates, structured playbooks, and community review so the human makes high-leverage decisions. See [SpecFlow Lifecycle Extension](../projects/specflow-lifecycle/) for the full roadmap.

### Where This Pipeline Ends, the Next Phase Begins

```
THIS SOP                                    NEXT SOPs
────────                                    ─────────
SPECIFY → PLAN → IMPLEMENT → [HARDEN]  →   Contrib Prep → Review → Release → Evolve
                                ▲
                                │
                        Not yet formalized
                        (Signal proved it's needed)
```

After the build pipeline completes, the output is tested code on a feature branch. The next step is [Contribution Preparation](contribution-protocol.md) — extracting that code from your private trunk for public collaboration.

---

## Quality Gates

Each phase has a quality threshold. Cannot advance until the gate passes:

| Phase | Threshold | What's Measured |
|-------|-----------|-----------------|
| SPECIFY | 100% | Spec completeness (SHALL/MUST requirements) |
| PLAN | 80% | Architecture quality (LLM-based rubric scoring) |
| IMPLEMENT | 80% | Task completion + test coverage |

## Workflow Variants

### A. Monolithic (Autonomous)

One playbook runs all phases in a loop. Best for: well-defined features, high confidence in spec quality.

```
SpecFlow_Development playbook → loops through all phases → outputs PR-ready code
```

### B. Phased (Human Gates)

Separate playbooks per phase with human review between each. Best for: complex features, new contributors, high-risk changes.

```
SpecFlow_1_Specify → [human reviews specs] → SpecFlow_2_Plan → [human reviews] → SpecFlow_3_Implement
```

### C. Parallel "Border Run" (Multi-Agent)

Same spec given to multiple agents on separate git worktrees. Comparator picks best approach. Best for: critical features, exploring multiple architectures.

```
Agent 1 ──→ PR 1 ──┐
Agent 2 ──→ PR 2 ──┼──→ SpecFlow_PR_Comparator ──→ Recommendation
Agent 3 ──→ PR 3 ──┤
Agent 4 ──→ PR 4 ──┘
```

## Constitutional Documents

Every phase validates against these PAI founding principles:

| Document | What It Enforces |
|----------|-----------------|
| [PAI-PRINCIPLES.md](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/PAI-PRINCIPLES.md) | CLI-first, deterministic code, UNIX philosophy (16 principles) |
| [SKILL-BEST-PRACTICES.md](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/SKILL-BEST-PRACTICES.md) | Skill structure (under 500 lines, USE WHEN triggers, activation reliability) |
| [TDD-EVALS.md](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/TDD-EVALS.md) | Test methodology (deterministic tests, pass@k metrics, grader design) |
| [RELEASE-FRAMEWORK.md](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/RELEASE-FRAMEWORK.md) | Release checklist (file inventory, sanitization, no secrets) |

## Test Pyramid

```
              ┌─────────────────┐
              │   ACCEPTANCE    │  L4: User outcomes (slow, few)
          ┌───┴─────────────────┴───┐
          │         CLI            │  L3: Command contracts (medium)
      ┌───┴─────────────────────────┴───┐
      │       INTEGRATION              │  L2: Component interaction
  ┌───┴─────────────────────────────────┴───┐
  │              UNIT                      │  L1: Function behavior (fast, many)
  └─────────────────────────────────────────┘
```

## Spec Format

Requirements use SHALL/MUST language with Given/When/Then scenarios:

```markdown
### Requirement: Event Logging
The system SHALL emit structured JSONL events for all hook lifecycle events.

#### Scenario: Session Start
- **GIVEN** a new Claude Code session starts
- **WHEN** the SessionStart hook fires
- **THEN** a `session.start` event is written to the daily JSONL file
- **AND** the event contains `session_id`, `timestamp`, and `event_type` fields
```

## Anti-Patterns

| Anti-Pattern | What Happens | Guard |
|--------------|-------------|-------|
| Quick Questions Instead of Interview | Shallow specs, missing requirements | 8-phase interview protocol enforced |
| One Test File = TDD | Missing coverage, false confidence | Task-level test verification |
| Skip Quality Gate | Bad architecture propagates to implementation | Score threshold blocks advancement |
| Init and Abandon | Half-built features | Loop enforcement — must complete or explicitly fail |
| Ship Without Hardening | Integration gaps, missing emergent features | Acceptance hardening phase (not yet formalized) |

## References

- [SpecFlow Bundle](https://github.com/jcfischer/specflow-bundle) — Jens-Christian Fischer
- [Maestro PAI Playbooks](https://github.com/mellanon/maestro-pai-playbooks) — playbook implementations
- [Maestro](https://runmaestro.ai/) — multi-agent orchestration platform
- [PAI Signal](../projects/signal/) — first project through this pipeline (25k lines, 708 tests)
