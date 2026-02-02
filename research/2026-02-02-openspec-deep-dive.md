# OpenSpec Deep Dive — Research Report

**Date:** 2026-02-02
**Author:** @mellanon (agent: Luna)
**Purpose:** Comprehensive analysis of OpenSpec v1.1.1 — capabilities, architecture, competitive landscape, and comparison with SpecFlow bundle to inform adoption decisions.

---

## 1. What is OpenSpec?

OpenSpec is a **spec-driven development (SDD) framework for AI coding assistants**. It adds a lightweight spec layer so humans and AI agree on what to build before any code is written.

| Field | Value |
|-------|-------|
| **Repo** | [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) (MIT) |
| **Version** | v1.1.1 (Jan 30, 2026) — v1.0.0 launched Jan 26, 2026 |
| **Language** | TypeScript (ESM), Node.js ≥ 20.19.0 |
| **Stars** | 21,567 |
| **npm** | `@fission-ai/openspec` (~50K total downloads) |
| **Website** | [openspec.dev](https://openspec.dev/) |
| **AI tools** | 23 supported (Claude Code, Cursor, Windsurf, Copilot, Gemini CLI, etc.) |
| **Maintainer** | Essentially single-maintainer (TabishB: 454/490 commits) |

**Philosophy** (verbatim from README):
- Fluid not rigid
- Iterative not waterfall
- Easy not complex
- Built for brownfield not just greenfield
- Scalable from personal projects to enterprises

---

## 2. Architecture

### Core Components

```
openspec/
├── specs/                    # Source of truth (current baseline)
│   └── <domain>/spec.md      # Requirements by domain
├── changes/                  # Active change proposals
│   └── <change-name>/
│       ├── .openspec.yaml    # Change metadata + schema override
│       ├── proposal.md       # Why + what changes
│       ├── specs/            # Delta specs (ADDED/MODIFIED/REMOVED)
│       │   └── <domain>/spec.md
│       ├── design.md         # Architecture decisions
│       └── tasks.md          # Implementation checklist
└── config.yaml               # Project config (schema, context, rules)
```

### Artifact Dependency Graph (DAG)

```
         proposal (root)
            │
   ┌────────┴────────┐
   │                 │
  specs            design
   │                 │
   └────────┬────────┘
            │
          tasks
            │
          apply
```

Artifacts are created in **topological order** — you can't create tasks without specs and design, can't create specs without a proposal. But within the DAG, you can create artifacts in any valid order. This is **"actions not phases"** — no rigid phase gates.

### Config System

```yaml
# openspec/config.yaml
schema: spec-driven          # Workflow schema (extensible)

context: |                    # Injected into ALL AI instructions
  Tech stack: TypeScript, React, Node.js
  Testing: Vitest

rules:                        # Per-artifact rules
  proposal:
    - Include rollback plan
  specs:
    - Use Given/When/Then format
  design:
    - Include sequence diagrams
```

Context is injected into `<context>` tags in skill instructions. Rules are injected into `<rules>` tags. This means the AI gets project-specific guidance automatically.

---

## 3. The OPSX Workflow (End-to-End)

| Command | What Happens | Creates |
|---------|-------------|---------|
| `/opsx:explore` | Thinking mode — investigate, ask questions, draw diagrams. No writing code. | Nothing (or artifacts if asked) |
| `/opsx:new <name>` | Creates `openspec/changes/<name>/` directory scaffold | `.openspec.yaml` |
| `/opsx:continue` | AI checks `openspec status --json`, creates the next "ready" artifact | One artifact at a time |
| `/opsx:ff` | Fast-forward: creates ALL ready planning artifacts at once | proposal → specs + design → tasks |
| `/opsx:apply` | AI reads tasks.md, implements, checks off `- [x]` as it goes | Working code |
| `/opsx:verify` | Validates implementation matches spec artifacts | Verification report |
| `/opsx:sync` | Merges delta specs (ADDED/MODIFIED/REMOVED) into main `specs/` | Updated baseline |
| `/opsx:archive` | Moves change to `changes/archive/<date>-<name>/` | Archived change |
| `/opsx:onboard` | 11-phase guided walkthrough (~15 min) for new users | First complete change |

**Key mechanism:** The `openspec instructions <artifact> --change <name> --json` command returns enriched instructions with template + context + rules + dependency content. The AI doesn't need to figure out what to create — the CLI tells it.

---

## 4. Spec Format

### Delta Specs (the core innovation)

```markdown
## ADDED Requirements
### Requirement: Two-Factor Authentication
The system MUST support TOTP-based authentication.
#### Scenario: 2FA enrollment
- GIVEN a user without 2FA enabled
- WHEN the user enables 2FA in settings
- THEN a QR code is displayed

## MODIFIED Requirements
### Requirement: Login Flow
(copy FULL existing requirement, then edit)

## REMOVED Requirements
### Requirement: Legacy Password Reset
**Reason**: Replaced by SSO
**Migration**: Redirect to SSO provider
```

**How sync works:** `openspec sync` parses ADDED/MODIFIED/REMOVED sections using requirement-level block parsing (not brittle header matching) and applies the deltas to `openspec/specs/`. This means specs/ always reflects the current state.

### Proposal Template

```markdown
## Why
<!-- motivation -->
## What Changes
<!-- bullet list, mark BREAKING changes -->
## Capabilities
### New Capabilities
- `<kebab-name>`: <description>    # Each becomes specs/<name>/spec.md
### Modified Capabilities
- `<existing-name>`: <what changes>
## Impact
<!-- affected code, APIs, dependencies -->
```

---

## 5. CLI Commands (Full Inventory)

| Command | Purpose |
|---------|---------|
| `openspec init [path]` | Initialize: create dirs, generate skill files for selected AI tools |
| `openspec update [path]` | Regenerate instruction files |
| `openspec new change <name>` | Create a new change directory |
| `openspec list [--specs]` | List active changes or specs |
| `openspec status` | Artifact completion status |
| `openspec show [item]` | Display a change or spec |
| `openspec instructions [artifact]` | Enriched AI instructions for artifact creation |
| `openspec validate [item]` | Validate changes/specs |
| `openspec archive [change]` | Archive completed change + sync specs |
| `openspec view` | Interactive dashboard |
| `openspec templates` | Show resolved template paths |
| `openspec schemas` | List available workflow schemas |
| `openspec schema init/fork/validate/which` | Schema management |
| `openspec config get/set/list` | Global config |
| `openspec feedback <msg>` | Submit feedback (creates GitHub issue) |
| `openspec completion generate/install` | Shell completions |

---

## 6. Skill File Generation

When you run `openspec init --tools claude`, it creates:

**10 skill files** at `.claude/skills/openspec-*/SKILL.md`:
- `openspec-explore`, `openspec-new-change`, `openspec-continue-change`
- `openspec-ff-change`, `openspec-apply-change`, `openspec-verify-change`
- `openspec-sync-specs`, `openspec-archive-change`, `openspec-bulk-archive-change`
- `openspec-onboard`

**10 command files** at `.claude/commands/opsx/*.md`:
- Slash commands that trigger the skills

Each skill file contains substantial instruction text (hundreds of lines). These all load into context when activated.

**Context overhead concern:** Issue #611 questions whether 10 skill files are necessary. This is a real consideration for context-window-sensitive workflows.

---

## 7. The Competitive Landscape (SDD in 2026)

SDD is now a **recognized engineering practice** with institutional backing from Thoughtworks, Martin Fowler, GitHub, JetBrains, and Red Hat.

### Four Major Players

| Tool | Stars | Positioning | Best For |
|------|-------|-------------|----------|
| **GitHub Spec Kit** | ~50K | Platform/ecosystem play | GitHub-native teams |
| **OpenSpec** | 21.5K | Lightweight, portable, 23 tools | Brownfield, multi-tool teams |
| **Kiro (AWS)** | N/A | Full IDE experience | All-in-one IDE users |
| **Tessl** | N/A | Enterprise registry (10K+ library specs) | Enterprise teams |

**Spec Kit criticism:** "A sea of markdown documents, long agent run-times and unexpected friction" (Scott Logic). Some call it "reinvented waterfall."

**OpenSpec positioning:** Explicitly lightweight alternative. "Actions not phases" vs Spec Kit's rigid phase gates.

**SpecFlow bundle** is not visible in this landscape — it's a smaller project with a different origin (PAI ecosystem, not the broader SDD movement).

### How People Manage Specs Without SDD Tools

- Cursor Rules (`.cursor/rules/`)
- CLAUDE.md files
- Ruler (unified rules across agents)
- agent-rules collections

These are **configuration management**, not **specification management**. They tell the AI how to behave, not what to build.

---

## 8. SpecFlow Bundle vs OpenSpec — Feature Comparison

| Dimension | SpecFlow Bundle | OpenSpec v1.1.1 |
|-----------|----------------|-----------------|
| **Philosophy** | Phase-gated, quality-scored | Action-based, fluid |
| **Best for** | Greenfield (v0 → v1.0) | Brownfield (v1.0 → v1.1) |
| **State tracking** | SQLite database (features.db) | File system (openspec/ dirs) |
| **Quality gates** | Score-based rubrics (≥80%) | Human approval (no scoring) |
| **AI tools** | Claude Code only | 23 tools (Claude, Cursor, Copilot, etc.) |
| **CLI commands** | 25 commands | 16 commands |
| **Spec format** | Interview-driven, 8-section structured | Proposal + delta specs (ADDED/MODIFIED/REMOVED) |
| **Planning** | Mandatory plan.md + tasks.md + architecture | Optional design.md + tasks.md |
| **Implementation** | TDD enforcement (RED → GREEN → BLUE) | Checkbox tracking in tasks.md |
| **Headless mode** | Full pipeline (`specflow pipeline F-1`) | N/A (relies on AI tool's session) |
| **Contribution prep** | 5-gate workflow with sanitization | Not included |
| **Release management** | Not included (gap) | Not included |
| **Feature queue** | Database-backed with priority ordering | None (one change at a time, or concurrent) |
| **Web dashboard** | specflow-ui on localhost:3000 | `openspec view` (terminal) |
| **Dependency tracking** | pai-deps integration | None |
| **Interview system** | Progressive question-driven | None (proposal template) |
| **Doctorow Gate** | Pre-completion validation (4 checks) | None |
| **Revision history** | SQLite audit trail | Git history only |
| **Tests** | 670+ tests | 60 test files |
| **Schema extensibility** | Fixed workflow | Custom schemas via `openspec schema fork` |
| **Config injection** | Project constitution file | `config.yaml` with context + per-artifact rules |
| **Maturity** | Production (multiple projects built) | Just hit 1.0 (Jan 26, 2026) |
| **Community** | Small (jcfischer + contributors) | 21.5K stars, single maintainer |

---

## 9. What OpenSpec Does Better

1. **Multi-tool support.** 23 AI tools vs Claude-only. If you work across Cursor, Claude Code, and Copilot, OpenSpec is the only option that works everywhere.

2. **Brownfield workflow.** The delta spec format (ADDED/MODIFIED/REMOVED) is purpose-built for evolving existing codebases. SpecFlow has no equivalent.

3. **Fluid over rigid.** "Actions not phases" means you can create artifacts in any valid order. SpecFlow requires sequential phase progression with quality gates.

4. **Config injection.** Project context and per-artifact rules propagate into AI instructions automatically. SpecFlow uses a constitution file but doesn't inject it into AI prompts.

5. **Schema extensibility.** You can fork the `spec-driven` schema and create custom artifact workflows. SpecFlow's workflow is fixed.

6. **Spec sync.** Delta specs merge cleanly into a baseline. The baseline always reflects current state. SpecFlow specs are snapshots, not a managed baseline.

7. **Lightweight.** `npm install -g @fission-ai/openspec && openspec init` and you're running. SpecFlow requires a compiled binary and SQLite setup.

---

## 10. What SpecFlow Does Better

1. **Quality gates with scoring.** AI-graded rubrics (spec quality, plan quality, task quality) with configurable thresholds. OpenSpec has no quality measurement.

2. **Feature queue management.** Database-backed feature ordering with priorities, batch processing, and `next` command. OpenSpec manages one change at a time.

3. **Headless pipeline.** Full autonomous execution (`specflow pipeline F-1`) for CI/CD. OpenSpec relies on interactive AI sessions.

4. **TDD enforcement.** RED → GREEN → BLUE cycle built into the implement phase. OpenSpec's apply phase is unconstrained.

5. **Contribution preparation.** 5-gate workflow with sanitization, tagging, and branch extraction. OpenSpec has nothing for contribution/release.

6. **Doctorow Gate.** Pre-completion validation for failure modes, assumptions, rollback safety, and technical debt. OpenSpec has no completion validation.

7. **Interview system.** Progressive question-driven spec gathering with decomposition analysis. OpenSpec relies on the AI + template to generate proposals.

8. **Dependency tracking.** pai-deps integration for ecosystem-level dependency analysis. OpenSpec operates at the single-project level.

9. **Revision history.** SQLite-backed audit trail for all spec/plan/task changes. OpenSpec relies on git history.

10. **Proven at scale.** Signal was built with SpecFlow: 18 features, 708 tests, ~24 hours. OpenSpec just hit 1.0 a week ago.

---

## 11. The Adoption Question: Replace, Complement, or Ignore?

### Option A: Replace SpecFlow with OpenSpec

**Argument:** OpenSpec is the industry-standard lightweight SDD tool with 21K stars and 23-tool support. It's where the market is heading.

**Problem:** OpenSpec lacks quality gates, headless pipeline, feature queue, TDD enforcement, contribution prep, and Doctorow Gate. These are core SpecFlow capabilities that would need to be rebuilt or abandoned.

**Verdict:** Not viable as a direct replacement. Too much capability loss.

### Option B: Adopt OpenSpec alongside SpecFlow

**Argument:** Use SpecFlow for greenfield build (v0 → v1.0) and OpenSpec for brownfield evolution (v1.0 → v1.1). This is the natural split identified in the ecosystem map.

**How it works:**
```
v0 → v1.0:  specflow specify → plan → tasks → implement → complete
             (SpecFlow's strength: structured greenfield with quality gates)

v1.0 → v1.1: opsx:new "add-caching" → opsx:ff → opsx:apply → opsx:archive
             (OpenSpec's strength: lightweight brownfield with delta specs)
```

**Integration points:**
- SpecFlow COMPLETE produces baseline specs → feed into `openspec/specs/`
- OpenSpec tasks.md → could feed into SpecFlow's task system
- Shared project constitution/config context

**Verdict:** Most promising. Uses each tool where it's strongest. Requires design work on the handoff points.

### Option C: Adopt OpenSpec's ideas, not the tool

**Argument:** OpenSpec's real value is the two-folder model (specs/ vs changes/) and delta spec format. These patterns can be adopted independently, potentially as SpecFlow extensions.

**What to take:**
- `openspec/specs/` as baseline concept → `specflow specs/` directory
- Delta spec format (ADDED/MODIFIED/REMOVED) → for SpecFlow's planned `openspec` command
- Config injection (context + rules) → enrich SpecFlow's constitution system
- Schema extensibility → let users customize SpecFlow's workflow

**What to leave:**
- 10 skill files (context overhead concern)
- Single-maintainer dependency risk
- npm distribution (SpecFlow is already a compiled binary)

**Verdict:** Safest option. Gets the best ideas without the dependency risk. More work to implement.

### Option D: Ignore OpenSpec, extend SpecFlow

**Argument:** SpecFlow is proven, battle-tested, and purpose-built for PAI. Why add another tool?

**Problem:** SpecFlow has no brownfield workflow. The v1.0 → v1.1 gap is real and needs solving. Ignoring the SDD landscape means reinventing what OpenSpec already solved.

**Verdict:** Not viable. The brownfield gap is real and growing.

---

## 12. Risk Assessment

### OpenSpec Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Single maintainer** (bus factor = 1) | High | Fork contingency plan. MIT license allows this. |
| **Just hit v1.0** (API instability) | Medium | Pin version, wait for stabilization |
| **Context overhead** (10 skill files) | Medium | Custom skill that wraps only needed commands |
| **Star-to-adoption gap** | Low | Validate with hands-on usage before committing |
| **PostHog telemetry** by default | Low | Opt out in config |

### SpecFlow Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **No brownfield workflow** | High | OpenSpec complement or build extension |
| **Claude-only** | Medium | Acceptable for PAI (Claude-native) |
| **Small community** | Medium | Upstream relationship with jcfischer |
| **No release management** | High | Port SpecFirst release framework |

---

## 13. Recommendation

**Option B (Complement) with elements of Option C (adopt ideas).**

1. **Install OpenSpec** in a project and run through the full OPSX workflow hands-on
2. **Design the SpecFlow→OpenSpec handoff** — when a SpecFlow feature reaches COMPLETE, how does its spec become an OpenSpec baseline?
3. **Evaluate context overhead** — do the 10 skill files cause problems in practice?
4. **Consider building `specflow evolve`** — a SpecFlow command that wraps OpenSpec's delta spec workflow, giving you the brownfield capability without the full OpenSpec skill overhead

The tools solve different problems. Using both is not redundant — it's complementary.

---

## Appendix: Sources

- [Fission-AI/OpenSpec on GitHub](https://github.com/Fission-AI/OpenSpec)
- [@fission-ai/openspec on npm](https://www.npmjs.com/package/@fission-ai/openspec)
- [OpenSpec.dev](https://openspec.dev/)
- [Thoughtworks: SDD Practices](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices)
- [Martin Fowler: SDD Tools](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [GitHub Blog: SDD Top Posts 2025](https://github.blog/developer-skills/agentic-ai-mcp-and-spec-driven-development-top-blog-posts-of-2025/)
- [Red Hat: SDD Improves AI Coding Quality](https://developers.redhat.com/articles/2025/10/22/how-spec-driven-development-improves-ai-coding-quality)
- [JetBrains: Spec-Driven Approach](https://blog.jetbrains.com/junie/2025/10/how-to-use-a-spec-driven-approach-for-coding-with-ai/)
- [Scott Logic: Spec Kit Review](https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html)
- [OpenSpec Deep Dive Guide](https://redreamality.com/garden/notes/openspec-guide/)
- [SDD Comparison: BMAD vs spec-kit vs OpenSpec](https://redreamality.com/blog/-sddbmad-vs-spec-kit-vs-openspec-vs-promptx/)
