# SOP: Iteration Planning

How contributors coordinate cross-project work through time-boxed iteration plans.

## Why This Exists

pai-collab tracks individual tasks (issues) and narrative history (journals), but neither answers: *"What am I doing THIS week across projects, and where does each item stand?"* When a contributor works across multiple issues and multiple projects simultaneously, they need an aggregation layer — a single artifact that ties everything together for the current cycle.

This SOP defines iteration plans as that aggregation layer, following the [VS Code Iteration Plans](https://github.com/microsoft/vscode/wiki/Iteration-Plans) model.

## Pipeline

```
SCOPE → CREATE → WORK → UPDATE → CLOSE → JOURNAL
```

## Three Contribution Modes

Not every contribution needs an iteration plan. The blackboard supports three modes:

| Mode | When | Overhead | Mechanism |
|------|------|----------|-----------|
| **Solo iteration plan** | Working across 3+ issues/projects simultaneously | Low | GitHub issue with checkboxes |
| **Multi-contributor plan** | Coordinating parallel work toward a shared milestone | Medium | GitHub issue, champion manages |
| **No plan** | Single issue, single PR, straightforward contribution | Zero | Issue-first workflow from CLAUDE.md |

**Default is no plan.** Iteration plans are opt-in when complexity warrants them.

## Hub vs Spoke: What Goes in the Iteration Plan

pai-collab is the **coordination hub**. Iteration plans are the **roadmap view** — they show vision, milestones, and state. Implementation details belong in the **spoke repos** where the work happens.

| Level | Where | Example |
|-------|-------|---------|
| **Vision** | Iteration plan (hub) | "Extend SpecFlow from build tool to full lifecycle tool" |
| **Milestone** | Iteration plan (hub) | "Brownfield command designed and spec'd" |
| **Feature design/implementation** | Spoke repo issues | "Design `specflow brownfield` command — delta-spec on SQLite" |
| **Task** | Spoke repo issues/commits | "Add delta-spec table to SQLite schema" |

**The iteration plan should read like a release notes preview** — what will be true at the end of the iteration, not what steps to take. Each line is an **outcome**, not an action.

**Bad:** `- [ ] Design specflow brownfield command — delta-spec semantics on SQLite`
**Good:** `- [ ] 🏃 Brownfield command — designed, spec'd, ready for implementation`

**In-flight items go at the top.** When someone opens the iteration plan, they should immediately see what's active and what state it's in. Completed items move to the bottom. This is the opposite of a journal (reverse chronological) — the plan is a **live dashboard**, not a log.

## Steps

### 1. SCOPE

Decide what goes into this iteration.

- [ ] Review open issues you intend to work on: `gh issue list --assignee @me` or filter by project labels
- [ ] Group by project/workstream
- [ ] Identify dependencies (what blocks what)
- [ ] Set a time box (1–2 weeks recommended)
- [ ] Choose a goal — one sentence describing what "done" looks like for this iteration

### 2. CREATE

Create a GitHub issue as the iteration plan.

**Title convention:**
```
iteration: @handle — Iteration N: [Goal]
```

For multi-contributor plans:
```
iteration: [project] — Iteration N: [Goal]
```

**Labels:** `type/iteration`, plus scope labels for each project included

**Body template:**

```markdown
Champion: @handle
Period: [start date] – [end date]
Goal: [one sentence — what will be true when this iteration succeeds]

## Vision
[2-3 sentences: the big picture. Why does this iteration matter?
What capability or state change does it deliver?]

## In Flight
[Active milestones — what's happening NOW. This section is the dashboard.]
- [ ] 🏃 Milestone description — current state
- [ ] ✋ Milestone description — blocked on [reason]

## Planned
[Milestones not yet started]
- [ ] Milestone description
- [ ] 💪 Stretch milestone
- [ ] ⬛ Multi-iteration milestone

## Completed
[Milestones achieved — moves here from In Flight when done]
- [x] Milestone description

## Deferred
[Explicitly postponed — with reason]
- [ ] ⬛ Milestone — [reason for deferral]

## References
- [Research, specs, spoke repos where implementation happens]
```

**Key principle:** Each line is a **milestone-level outcome**, not an implementation task. The iteration plan is the hub view — implementation details live in spoke repo issues. When you read a line, you should understand *what changes for the project*, not *what commands to run*.

**Emoji status indicators:**

| Emoji | Meaning |
|-------|---------|
| 🏃 | In progress — actively being worked on |
| 💪 | Stretch goal — do if time permits |
| ✋ | Blocked — waiting on external dependency |
| ⬛ | Multi-iteration — won't finish this cycle |
| *(none)* | Planned — not yet started |

**Rules:**
- Each line references an issue (the plan is the summary, issues are the depth)
- Cross-repo references use full format: `org/repo#number`
- Sections group by project, not by type of work
- Multi-contributor plans include sub-sections per contributor

### 3. WORK

Execute the plan using the standard issue-first workflow from CLAUDE.md.

- [ ] Comment on each issue before starting work ("picking this up as part of iteration #N")
- [ ] Work on your fork/branch
- [ ] Commit with `partial #N` or `closes #N` references

### 4. UPDATE

Keep the iteration plan current as work progresses.

- [ ] Check boxes as tasks complete (`- [x]`)
- [ ] Add 🏃 when starting a task
- [ ] Add ✋ with reason when blocked
- [ ] Add new tasks discovered during the iteration
- [ ] Comment on the issue with significant updates or scope changes

**Frequency:** Update after each significant milestone (PR merged, phase completed, blocker resolved). Not after every commit.

### 5. CLOSE

When the time box expires or all tasks are done.

- [ ] Check all completed boxes
- [ ] Note any incomplete items — will they carry to next iteration or be dropped?
- [ ] Close the issue with a summary comment:
  ```
  ## Iteration Summary
  Completed: X/Y tasks
  Carried forward: [list items moving to next iteration]
  Dropped: [items no longer relevant]
  Key outcomes: [1-2 sentences]
  ```

### 6. JOURNAL

After closing, add a journal entry to the most relevant project.

- [ ] Add entry to `projects/*/JOURNAL.md` following the schema in CONTRIBUTING.md
- [ ] Reference the iteration issue in the `**Issues:**` field
- [ ] Capture what emerged — insights from working across multiple projects

## Multi-Contributor Plans

When a champion creates a plan for multiple contributors:

- **Champion responsibilities:** Create the plan, assign sections, update status, synthesize at close
- **Contributor responsibilities:** Update their own checkboxes, comment on blockers, signal completion
- **Coordination:** Champion comments on the issue when priorities shift or scope changes
- **Independence:** Each contributor works on their own fork — the plan coordinates, it doesn't mandate

## Examples

### Solo iteration plan (roadmap-level)

```markdown
# @mellanon — JellyBean: Spec Driven Development

Champion: @mellanon
Period: Feb 3 – Feb 14, 2026
Goal: SpecFlow lifecycle direction established, brownfield capability designed

## Vision
Extend SpecFlow from a build tool into a full lifecycle tool. The council
verdict (C+) says build brownfield/review/release natively, don't depend
on OpenSpec or Maestro. This iteration establishes the direction and
produces the first design specs.

## In Flight
- [ ] 🏃 Upstream PRs landed — headless pipeline merged to specflow-bundle
- [ ] 🏃 Brownfield command — designed, spec'd, ready for implementation

## Planned
- [ ] Release command — SpecFirst 8-gate framework ported to SpecFlow design
- [ ] 💪 Cedars integration — engagement with @Steffen025 on milestone approach (#72)

## Completed
- [x] Research foundation — landscape report, OpenSpec deep dive, council debate
- [x] Project direction pivoted — native commands, not Maestro playbooks
- [x] Issues #5, #6, #7 re-scoped to reflect council verdict

## Deferred
- [ ] ⬛ OpenSpec interchange format — evaluate at 90-day gate, not now (#8)

## References
- Research: pai-collab research/ (3 docs + architecture diagram)
- Implementation: mellanon/specflow-bundle fork (spoke repo)
- SpecFirst source: contrib-specfirst-v1.0.0 branch
```

### Multi-contributor iteration plan

```markdown
# specflow-lifecycle — Iteration 1: Feb 3–14, 2026

Champion: @mellanon
Period: Feb 3 – Feb 14, 2026
Goal: Headless pipeline shipped, lifecycle extension designed

## Vision
SpecFlow covers SPECIFY→COMPLETE today. This iteration lands the headless
pipeline (autonomous execution) and begins designing the post-COMPLETE
phases: review, release, and brownfield evolution.

## In Flight
### @mellanon
- [ ] 🏃 Headless pipeline PRs merged upstream
- [ ] 🏃 Brownfield command design spec produced

### @jcfischer
- [ ] 🏃 PRs #3, #4, #6, #7 reviewed on specflow-bundle

## Planned
### @mellanon
- [ ] 💪 Review command design spec

### @Steffen025
- [ ] 💪 Cedars integration proposal (#72)

## References
- Research: pai-collab research/
- Implementation: jcfischer/specflow-bundle + mellanon/specflow-bundle fork
```

## References

- [VS Code Iteration Plans](https://github.com/microsoft/vscode/wiki/Iteration-Plans) — The model this SOP follows
- [VS Code January 2026 Plan](https://github.com/microsoft/vscode/issues/286040) — Example of the format in production
- [CLAUDE.md](../CLAUDE.md) — Issue-first workflow (the default for simple contributions)
- [CONTRIBUTING.md](../CONTRIBUTING.md) — JOURNAL.md schema for the JOURNAL step
- [sops/specflow-development-pipeline.md](specflow-development-pipeline.md) — SpecFlow phases that iteration plans may coordinate
