# SpecFlow Lifecycle Extension

**Goal:** Extend [SpecFlow](https://github.com/jcfischer/specflow-bundle) from a build tool into a full development lifecycle tool.

---

## The Current Pipeline

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
- **Constitutional compliance** — Every phase validates against [PAI principles](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/PAI-PRINCIPLES.md) (CLI-first, deterministic, UNIX philosophy)
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

| Phase | SpecFlow Today | What's Missing | Question It Answers |
|-------|---------------|----------------|-------------------|
| **Contrib Prep** | — | Extract from private trunk, sanitize, stage | "Is this safe to share?" |
| **Review** | PR_Review playbook exists | Independent review, structured findings, community agents | "Is this good code?" |
| **Release** | — | PR packaging, changelog, migration guide, approval gates | "Is this ready to merge?" |
| **Maintain** | — | Versioned spec evolution, change proposals | "How does this evolve?" |

### Why These Matter for PAI

PAI development is uniquely challenging because **your private instance is entangled with personal data**:
- `.env` files with API keys
- Personal vault paths and Telegram IDs
- Real test fixtures with captured data
- Config files with personal preferences

The contrib branch is a **sanitization gate** that forces explicit file selection. Without Contrib Prep, you're one `git push` away from leaking secrets.

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

SpecFlow handles v0 → v1.0.0. Open Spec handles evolution post-merge:

```
Open Spec (baseline + Change Proposals) → CP approved → SpecFlow cycle → ship → Open Spec (updated baseline)
```

Uses the [OpenSpec directory structure](https://github.com/jcfischer/specflow-bundle):
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

With all four playbooks, the full lifecycle becomes:

```
                    ┌──────────────────────────────────────────────────┐
                    │            SPECFLOW (existing)                    │
                    │  SPECIFY → PLAN → TASKS → IMPLEMENT              │
                    │     ↑ quality gates ↑ TDD enforcement            │
                    └────────────────────┬─────────────────────────────┘
                                         │
                    ┌────────────────────┼─────────────────────────────┐
                    │       LIFECYCLE EXTENSION (new)                   │
                    │                    │                              │
                    │  CONTRIB PREP → REVIEW → RELEASE                 │
                    │  (sanitize)    (independent)  (8 gates)          │
                    │                    │                              │
                    └────────────────────┼─────────────────────────────┘
                                         │
                                    MERGE TO UPSTREAM
                                         │
                    ┌────────────────────┼─────────────────────────────┐
                    │          OPEN SPEC (evolution)                    │
                    │  baseline + Change Proposals → next cycle         │
                    └──────────────────────────────────────────────────┘
```

---

## Constitutional Documents

The playbooks validate against these PAI constitutional documents at every phase:

| Document | What It Enforces |
|----------|-----------------|
| [PAI-PRINCIPLES.md](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/PAI-PRINCIPLES.md) | 16 founding design principles (CLI-first, deterministic, UNIX philosophy) |
| [SKILL-BEST-PRACTICES.md](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/SKILL-BEST-PRACTICES.md) | Skill structure guidelines (under 500 lines, USE WHEN triggers) |
| [TDD-EVALS.md](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/TDD-EVALS.md) | Test methodology (deterministic tests, pass@k metrics) |
| [RELEASE-FRAMEWORK.md](https://github.com/mellanon/maestro-pai-playbooks/blob/main/docs/RELEASE-FRAMEWORK.md) | Release checklist (file inventory, sanitization, no secrets) |

---

## Anti-Patterns to Guard Against

| Anti-Pattern | Guard |
|--------------|-------|
| Init and Abandon | Loop enforcement — must complete or fail explicitly |
| Quick Questions Instead of Interview | 8-phase interview protocol required |
| Time Pressure Rationalization | Quality gates block advancement |
| One Test File = TDD | Task-level test verification |
| Skip Sanitization | File inventory is law, 8 approval gates |

---

## Proven by Signal

[PAI Signal](../signal/) (25,000 lines, 102 files, 708 tests) is the first project to need the full lifecycle. The experience of building Signal through SpecFlow and then hitting the "works but not merge-ready" gap is what identified these missing phases. See Signal's [JOURNAL.md](../signal/JOURNAL.md) for the full story.

## Source Code

| What | Where |
|------|-------|
| SpecFlow Bundle | [jcfischer/specflow-bundle](https://github.com/jcfischer/specflow-bundle) |
| Maestro Playbooks | [mellanon/maestro-pai-playbooks](https://github.com/mellanon/maestro-pai-playbooks) |
| SpecFirst Skill | [PAI _SPECFIRST skill](https://github.com/danielmiessler/PAI) (private, will be contributed) |

## Project Files

| File | Purpose |
|------|---------|
| [PROJECT.yaml](PROJECT.yaml) | Source pointers |
| [JOURNAL.md](JOURNAL.md) | Journey log |
