# SOP: SpecFlow Development Pipeline

How projects are built using the SpecFlow + Maestro development pipeline.

## Tooling Status

| Layer | Status | What Exists |
|-------|--------|-------------|
| **Process doc** | ✅ This document | Human-readable build pipeline procedure |
| **Maestro playbook** | ✅ Working | `SpecFlow_Development` + phased variants (`_1_Specify`, `_2_Plan`, `_3_Implement`) |
| **SpecFlow bundle** | ✅ Working | [jcfischer/specflow-bundle](https://github.com/jcfischer/specflow-bundle) — spec-driven development |
| **PAI skill (CLI)** | — | Not needed — SpecFlow + Maestro handle this phase directly |

This is the **most mature phase** — the tooling is working end-to-end. See [SOPs README](README.md) for the full lifecycle.

## The Pipeline

```
SPECIFY → PLAN → TASKS → IMPLEMENT
   │        │       │         │
   │        │       │         └── TDD loop: RED → GREEN → BLUE per task
   │        │       └── Implementation breakdown with task-level tracking
   │        └── Architecture design, validated at ≥80% quality gate
   └── Interview-driven specs (8-phase protocol), validated at ≥80% quality gate
```

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
| [PAI-PRINCIPLES.md](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/PAI-PRINCIPLES.md) | CLI-first, deterministic code, UNIX philosophy (16 principles) |
| [SKILL-BEST-PRACTICES.md](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/SKILL-BEST-PRACTICES.md) | Skill structure (under 500 lines, USE WHEN triggers, activation reliability) |
| [TDD-EVALS.md](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/TDD-EVALS.md) | Test methodology (deterministic tests, pass@k metrics, grader design) |
| [RELEASE-FRAMEWORK.md](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/RELEASE-FRAMEWORK.md) | Release checklist (file inventory, sanitization, no secrets) |

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

## References

- [SpecFlow Bundle](https://github.com/jcfischer/specflow-bundle) — Jens-Christian Fischer
- [Maestro PAI Playbooks](https://github.com/mellanon/maestro-pai-playbooks) — playbook implementations
- [Maestro](https://runmaestro.ai/) — multi-agent orchestration platform
