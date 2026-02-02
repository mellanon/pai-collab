# SpecFlow Lifecycle Extension

**Goal:** Extend [SpecFlow](https://github.com/jcfischer/specflow-bundle) from a build tool into a full development lifecycle tool.

---

## The Tooling Stack

Five layers work together to enable autonomous spec-driven development. Each layer leans on the one below it:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  5. MAESTRO                                                              │
│  Playbooks orchestrate multi-step workflows in Auto Run mode.            │
│  Each playbook step is a markdown file with tasks, gates, and routing.   │
│  State: .maestro/CURRENT_FEATURE.md, .maestro/outputs/                   │
│  Reads SpecFlow state to know which feature is next, what phase it's in. │
├──────────────────────────────────────────────────────────────────────────┤
│  4. PAI (Skills + Hooks)                                                 │
│  Skills provide domain expertise (SKILL.md + workflows + tools).         │
│  Hooks fire at lifecycle events (SessionStart, PreToolUse, etc.).        │
│  _SPECFIRST skill wraps release process. Hooks enable observability.     │
├──────────────────────────────────────────────────────────────────────────┤
│  3. SPECFLOW BUNDLE (CLI + State)                                        │
│  `specflow specify`, `specflow plan`, `specflow implement` CLI commands. │
│  SQLite state tracking: .specflow/features.db, .specflow/evals.db        │
│  Quality gates (≥80%), interview protocol, TDD enforcement.              │
│  Specs stored in .specify/specs/ per feature.                            │
├──────────────────────────────────────────────────────────────────────────┤
│  2. CLAUDE CODE                                                          │
│  The agentic coding environment. Executes tool calls, manages context,   │
│  runs bash commands, reads/writes files. The execution engine.           │
├──────────────────────────────────────────────────────────────────────────┤
│  1. CLAUDE OPUS 4.5 (LLM)                                                │
│  The model powering everything above. Reasoning, code generation,        │
│  quality assessment, spec writing, review analysis.                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### How the layers interact during a build

When Maestro runs the `SpecFlow_Development` playbook in Auto Run:

1. **Maestro** reads `.maestro/CURRENT_FEATURE.md` to determine which feature is active
2. **Maestro** routes to the correct playbook step (SELECT → SPECIFY → PLAN → TASKS → IMPLEMENT → VERIFY → COMPLETE)
3. The playbook step invokes **SpecFlow CLI** commands (`specflow specify`, `specflow plan`, etc.)
4. **SpecFlow** uses **Claude Code** to execute — writing specs, generating code, running tests
5. **Claude Code** leans on **Claude Opus 4.5** for reasoning and generation
6. **SpecFlow** records state in SQLite (`.specflow/features.db`) — feature status, phase, quality scores
7. **Maestro** reads that state on the next loop to decide what to do next

This is how Signal was built: 18 features, 708 tests, two parallel agents in separate git worktrees, running for ~24 hours. Maestro's Auto Run kept looping through features while SpecFlow tracked per-feature state.

### What exists today vs what's needed

| Lifecycle Phase | Tooling Stack Coverage | Status |
|----------------|----------------------|--------|
| **Specify + Build** | All 5 layers working together | ✅ Proven (Signal) |
| **Harden** | Human-driven, no tooling | ✅ Works (manual) |
| **Contrib Prep** | **`specflow contrib-prep` CLI shipped** — 5-gate workflow with file inventory, secret scanning, extraction, verification. [670 tests](https://github.com/jcfischer/specflow-bundle). | ✅ CLI shipped |
| **Review** | **`specflow review` CLI shipped** — 3-layer review (automated checks, AI alignment, human template). Branch: [`feature/lifecycle-extension`](https://github.com/mellanon/specflow-bundle/tree/feature/lifecycle-extension) | ✅ CLI shipped |
| **Release** | **`specflow release` CLI shipped** — 8-gate evaluation engine (completeness, quality, CHANGELOG, inventory, secrets, branch, sanitization, PR template). | ✅ CLI shipped |
| **Evolve** | **`specflow brownfield` CLI shipped** — scan/diff/apply workflow for codebase analysis and spec evolution via delta-specs. | ✅ CLI shipped |

The goal: extend the same 5-layer stack to cover the full lifecycle, so an agent can pick up a project from the blackboard and execute SPECIFY through RELEASE with human approval at key gates.

---

## The Current Pipeline (Specify + Build)

SpecFlow + [Maestro](https://runmaestro.ai/) provides a powerful spec-driven development pipeline that already works:

```
SPECIFY → PLAN → TASKS → IMPLEMENT → (complete)
   │        │       │         │
   │        │       │         └── TDD loop: RED → GREEN → BLUE per task
   │        │       └── Implementation breakdown with task-level tracking
   │        └── Architecture design, validated at ≥80% quality
   └── Interview-driven specs (8-phase protocol), validated at ≥80% quality
```

**What makes it work:**
- **Quality gates** — Cannot advance phases until score ≥80% (LLM-based rubric scoring)
- **Interview-driven specs** — 8-phase structured requirements elicitation prevents shallow specs
- **TDD enforcement** — RED → GREEN → BLUE for every task, not just "one test file"
- **Constitutional compliance** — Every phase validates against [PAI principles](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/PAI-PRINCIPLES.md) (CLI-first, deterministic, UNIX philosophy)
- **State persistence** — SQLite databases track feature status across loops and sessions

**Playbook variants:**
| Playbook | When to Use |
|----------|-------------|
| `SpecFlow_Development` | Monolithic — runs all phases in a loop, autonomous |
| `SpecFlow_1_Specify` → `_2_Plan` → `_3_Implement` | Phased — human reviews between each phase |
| Parallel "border run" | Multiple agents on same spec via git worktrees, comparator picks best |

---

## The Gap: After the Build

The pipeline gets you to **working, tested code**. But between "working" and "shipped", four phases are missing:

| Phase | What Exists | What's Missing | Question It Answers |
|-------|------------|----------------|-------------------|
| **Contrib Prep** | **`specflow contrib-prep` CLI** (5-gate workflow, 670 tests), _SPECFIRST gates, SOP, [pai-secret-scanning](https://github.com/jcfischer/pai-secret-scanning) | Maestro playbook wrapping CLI | "Is this safe to share?" |
| **Review** | PR_Review playbook, SOP | Lifecycle integration, four-layer strategy | "Is this good code?" |
| **Release** | _SPECFIRST full workflow, SOP | SpecFlow CLI command, Maestro playbook | "Is this ready to merge?" |
| **Evolve** | Open Spec template in SpecFlow bundle | SpecFlow CLI command, Maestro playbook | "How does this evolve?" |

### Why These Matter for PAI

PAI development is uniquely challenging because **your private instance is entangled with personal data**:
- `.env` files with API keys
- Personal vault paths and Telegram IDs
- Real test fixtures with captured data
- Config files with personal preferences

The contrib branch is a **sanitization gate** that forces explicit file selection. Without Contrib Prep, you're one `git push` away from leaking secrets.

---

## Blueprint and Future State

We're not starting from scratch. Two existing projects provide the blueprint for what the SpecFlow bundle needs to become:

### Reference Architecture

| Source | What It Provides | Status |
|--------|-----------------|--------|
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | The **spec-driven development (SDD) standard** — spec format, directory structure, change proposal workflow. SpecFlow already implements this for the build phase. | Active standard |
| [_SPECFIRST skill](https://github.com/mellanon/Personal_AI_Infrastructure/tree/contrib-specfirst-v1.0.0) | The **release lifecycle process** — Contrib Prep, Release, and Open Spec phases encoded as PAI workflows. Battle-tested across 3 contributions (131 files total). | Reference architecture — to be superseded |

**Key artifacts in _SPECFIRST (process knowledge to absorb):**
- **`workflows/Release.md`** — Full fork contribution workflow with 8 human approval gates, tag-before-contrib pattern, cherry-pick from tag, sanitization checklist (~574 lines)
- **`templates/RELEASE-FRAMEWORK.md`** — Scope definition, sanitization rules, propagation process, CHANGELOG management, pre-release checklist, version lifecycle

**Battle-tested across:**
| Contribution | Scale | Outcome |
|-------------|-------|---------|
| Context Skill | 50 files | Process validated, PR submitted |
| Jira Skill | 18 files | Process validated, PR submitted |
| pai-knowledge | 63 files | Process validated, PR submitted |

### Future State: SpecFlow as End-to-End Lifecycle Tool

The _SPECFIRST skill is a stepping stone — it will be **superseded** by an extended SpecFlow bundle that natively supports the full lifecycle. The future state:

```
┌──────────────────────────────────────────────────────────────────────┐
│                     SPECFLOW BUNDLE (current)                        │
│                                                                      │
│  Build:                  Shipped:                  Lifecycle:         │
│  specflow specify        specflow contrib-prep     specflow review   │
│  specflow plan           (5 gates, 670 tests)      specflow release  │
│  specflow implement                                specflow brownfield│
│                                                                      │
│  SQLite state tracking across ALL phases                             │
│  Quality gates, interview protocol, TDD — extended to full lifecycle │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │      MAESTRO PLAYBOOKS        │
                    │                               │
                    │  Orchestration + human gates   │
                    │  wrapping SpecFlow CLI commands │
                    │  .maestro/ state management    │
                    └───────────────────────────────┘
```

OpenSpec defines the standard. _SPECFIRST provides the process knowledge to absorb. The SpecFlow bundle becomes the single tool that supports the full lifecycle — from spec to shipped code to post-merge evolution. Maestro playbooks orchestrate it with human gates.

Once the SpecFlow bundle covers the full lifecycle, the _SPECFIRST skill becomes redundant and can be retired.

**Tracked in:** Issues [#4](https://github.com/mellanon/pai-collab/issues) (align with Jens on bundle extension), [#5](https://github.com/mellanon/pai-collab/issues) (Contrib Prep), [#6](https://github.com/mellanon/pai-collab/issues) (Review), [#7](https://github.com/mellanon/pai-collab/issues) (Release), [#8](https://github.com/mellanon/pai-collab/issues) (Open Spec)

---

## Four New Playbooks

### 1. Contrib Prep Playbook

Bridges private development and public collaboration. Based on the [SpecFirst release process](../../sops/specfirst-release-process.md) with 8 human approval gates.

```
INVENTORY → SANITIZE → EXTRACT → VERIFY → TEST → STAGE → GATE → PUBLISH
```

The file inventory IS the release specification. Every file is explicitly included or excluded. Cherry-pick from tag (not feature branch) to ensure the PR contains exactly what was tested.

**Tag-Before-Contrib pattern:**
```
feature branch → test → tag (v1.0.0) → cherry-pick FROM TAG → contrib branch → sanitize → push
```

Why tag first? Ensures PR contains EXACTLY what was tested — no more, no less.

### 2. Review Playbook

The existing [Maestro PR_Review playbook](https://github.com/mellanon/maestro-pai-playbooks/tree/main/playbooks/PR_Review) provides the foundation — 6-step pipeline producing structured findings:

```
ANALYZE_PR → CODE_QUALITY → SECURITY_REVIEW → TEST_VALIDATION → DOCUMENTATION → SUMMARIZE
     ↓             ↓              ↓                  ↓                ↓              ↓
REVIEW_SCOPE  CODE_ISSUES  SECURITY_ISSUES   TEST_RESULTS      DOC_ISSUES    REVIEW_SUMMARY
                                                                              PR_COMMENT
```

The lifecycle extension adds: community agent review via blackboard PRs, layered strategy (automated gates + playbook + community + human), and structured findings format (see [sops/review-format.md](../../sops/review-format.md)).

### 3. Release Playbook

Based on the [SpecFirst Release Framework](https://github.com/mellanon/pai-1.2/blob/feature/jira-analysis/.claude/skills/SpecFirst/templates/RELEASE-FRAMEWORK.md). Eight human approval gates from file inventory through to PR creation:

| Gate | What to Review |
|------|----------------|
| 1. File Inventory | Is scope correct? |
| 2. Test Results | All tests pass? |
| 3. Pre-Release Checklist | All boxes checked? |
| 4. Tag Creation | Ready to mark as tested? |
| 5. Cherry-Pick Review | Staged files match inventory? |
| 6. Sanitization | No secrets, PII, or personal data? |
| 7. Push to Fork | Ready to make public? |
| 8. Create PR | Description accurate? |

**Never skip gates.** AI can assist, but human approves before proceeding.

### 4. Open Spec Template

SpecFlow handles v0 → v1.0.0. [Open Spec](https://github.com/Fission-AI/OpenSpec) handles evolution post-merge — spec-driven development (SDD) for AI coding assistants:

```
Open Spec (baseline + Change Proposals) → CP approved → SpecFlow cycle → ship → Open Spec (updated baseline)
```

Uses the [OpenSpec directory structure](https://github.com/Fission-AI/OpenSpec) (integrated into [SpecFlow bundle](https://github.com/jcfischer/specflow-bundle)):
```
openspec/
├── specs/           # Current source of truth (baseline)
├── changes/         # Proposed modifications
│   └── [feature]/
│       ├── proposal.md
│       ├── tasks.md
│       └── specs/   # Spec deltas (ADDED/MODIFIED/REMOVED)
└── archive/         # Completed changes (audit trail)
```

---

## The Complete Lifecycle

With the extended SpecFlow bundle, the full lifecycle becomes one tool from spec to evolution:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          SPECFLOW BUNDLE                                  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  BUILD (existing)                                                │     │
│  │  SPECIFY → PLAN → TASKS → IMPLEMENT                              │     │
│  │     ↑ quality gates ↑ TDD enforcement ↑ interview protocol       │     │
│  └────────────────────────────┬────────────────────────────────────┘     │
│                                │                                         │
│                     HARDEN (human acceptance)                            │
│                                │                                         │
│  ┌────────────────────────────┼────────────────────────────────────┐     │
│  │  SHIP (new — from _SPECFIRST blueprint)                          │     │
│  │  CONTRIB PREP → REVIEW → RELEASE                                 │     │
│  │  (sanitize)    (independent)  (8 gates, tag-before-contrib)      │     │
│  └────────────────────────────┼────────────────────────────────────┘     │
│                                │                                         │
│                           MERGE TO UPSTREAM                              │
│                                │                                         │
│  ┌────────────────────────────┼────────────────────────────────────┐     │
│  │  EVOLVE (new — from OpenSpec standard)                           │     │
│  │  baseline + Change Proposals → next SpecFlow cycle               │     │
│  └─────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  SQLite state tracking across ALL phases                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Upstream Dependencies (Maestro)

Building lifecycle playbooks that work in Auto Run mode depends on upstream Maestro capabilities. We've filed experience reports from the Signal build to help align:

| Issue | What It Enables | Why It Matters for Lifecycle |
|-------|----------------|----------------------------|
| [#231 — Exit Condition Detection](https://github.com/pedramamini/Maestro/issues/231) | Playbooks can signal completion instead of looping indefinitely | Contrib Prep and Release playbooks have a clear "done" state — they need to stop when the PR is created, not loop back to step 1 |
| [#232 — HITL Gates for Auto-Run](https://github.com/pedramamini/Maestro/issues/232) | Human review points pause auto-run, notify, and resume after approval | Every lifecycle phase has approval gates. Without pause-notify-resume, auto-run skips past them or requires manual intervention |
| [#233 — Surfacing Run Data to UI](https://github.com/pedramamini/Maestro/issues/233) | Feature phase, test results, and quality scores visible in Maestro UI during auto-run | Operators need visibility into which lifecycle phase is active, what the sanitization status is, whether review findings are blocking |
| [#235 — Token Exhaustion UX](https://github.com/pedramamini/Maestro/issues/235) | Graceful pause with state save when approaching rate limits, instead of silent stop | Long-running lifecycle playbooks (Contrib Prep can take hours for large projects) need to survive token limits without losing progress |

These issues emerged directly from the 24-hour parallel Signal build — two agents in separate git worktrees running the SpecFlow_Development playbook. The build succeeded, but the experience surfaced friction points that would be blockers for the longer lifecycle phases (Contrib Prep through Release), where human approval gates are mandatory and runs can span multiple sessions.

---

## Constitutional Documents

The playbooks validate against these PAI constitutional documents at every phase:

| Document | What It Enforces |
|----------|-----------------|
| [PAI-PRINCIPLES.md](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/PAI-PRINCIPLES.md) | 16 founding design principles (CLI-first, deterministic, UNIX philosophy) |
| [SKILL-BEST-PRACTICES.md](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/SKILL-BEST-PRACTICES.md) | Skill structure guidelines (under 500 lines, USE WHEN triggers) |
| [TDD-EVALS.md](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/TDD-EVALS.md) | Test methodology (deterministic tests, pass@k metrics) |
| [RELEASE-FRAMEWORK.md](https://github.com/mellanon/maestro-pai-playbooks/blob/master/docs/RELEASE-FRAMEWORK.md) | Release checklist (file inventory, sanitization, no secrets) |

---

## Proven by Signal

[PAI Signal](../signal/) (25,000 lines, 102 files, 708 tests) is the first project to need the full lifecycle. The experience of building Signal through SpecFlow and then hitting the "works but not merge-ready" gap is what identified these missing phases. See Signal's [JOURNAL.md](../signal/JOURNAL.md) for the full story.

**Signal's state directories** show the tooling stack in action:
- `.maestro/CURRENT_FEATURE.md` — Maestro tracked "ALL_FEATURES_COMPLETE" after 18 features
- `.maestro/outputs/` — Completion logs, file inventory, loop progress, test results
- `.specflow/features.db` — SQLite tracking all 18 features through SPECIFY → IMPLEMENT
- `.specflow/evals.db` — Quality evaluation scores per feature per phase
- `.specify/specs/` — 18 feature specifications generated by the interview protocol

## Source Code

| What | Where |
|------|-------|
| SpecFlow Bundle | [jcfischer/specflow-bundle](https://github.com/jcfischer/specflow-bundle) |
| OpenSpec | [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) — Spec-driven development for AI coding assistants |
| Maestro Playbooks | [mellanon/maestro-pai-playbooks](https://github.com/mellanon/maestro-pai-playbooks) |
| SpecFirst Skill | [PAI _SPECFIRST skill](https://github.com/mellanon/Personal_AI_Infrastructure/tree/contrib-specfirst-v1.0.0) |
| Maestro | [pedramamini/Maestro](https://github.com/pedramamini/Maestro) |

## Project Files

| File | Purpose |
|------|---------|
| [PROJECT.yaml](PROJECT.yaml) | Source pointers |
| [JOURNAL.md](JOURNAL.md) | Journey log |
