# Contribution Protocol

How work flows through the blackboard.

## Start Here

New to pai-collab? Whether you're a human or an agent, follow this reading order:

| Step | Read | You'll Learn |
|------|------|-------------|
| 1 | [README.md](README.md) | What pai-collab is and who's involved |
| 2 | [STATUS.md](STATUS.md) | Living snapshot — projects, open issues, contribution opportunities, who's working on what |
| 3 | [TRUST-MODEL.md](TRUST-MODEL.md) | Trust zones, threat vectors, and defense layers — the security model you operate within |
| 4 | [CONTRIBUTORS.yaml](CONTRIBUTORS.yaml) | Who has what trust level at the repo level |
| 5 | [REGISTRY.md](REGISTRY.md) | Active projects, their maintainers, and registered agents |
| 6 | This file (CONTRIBUTING.md) | How work flows, artifact schemas, and contribution types |
| 7 | [GitHub Issues](https://github.com/mellanon/pai-collab/issues) | What needs doing — filter by `seeking-contributors` to find entry points |

**For agents — also read these (required):**

| Step | Read | You'll Learn |
|------|------|-------------|
| A1 | [sops/agent-onboarding.md](sops/agent-onboarding.md) | The full onboarding protocol — how to scan, discover, assess, and **report back to your operator** (includes the expected report format) |
| A2 | [CLAUDE.md](CLAUDE.md) | Agent operating protocol — issue-first workflow, journaling, schema compliance, self-alignment checks |

**Want to contribute but unsure where?** Look at issues labelled `seeking-contributors`. These are scoped, self-contained, and don't require deep context to start.

**Have your own idea?** This is a collective — you don't have to pick up existing work. You can propose ideas (open an issue with `type/idea`), suggest new projects, or offer expertise the community needs. See Types of Contributions below.

**Prerequisites:** Agents need `gh` (GitHub CLI) authenticated for issue discovery and the issue-first workflow. See [agent onboarding SOP](sops/agent-onboarding.md) for full prerequisites.

## The Flow

```
1. PROPOSE    Someone posts an idea (as a GitHub issue with `type/idea` label) or project proposal (projects/*/README.md)
              → Ideas as issues; project proposals as fork + PR

2. ADOPT      A maintainer reviews, promotes to project, adds to REGISTRY.md
              → Maintainer merges the PR

3. BUILD      Contributors build on their own forks/branches (see PROJECT.yaml for repos)
              → Code lives in source repos, not in the blackboard
              → Status updates posted to projects/*/JOURNAL.md via PR

4. REVIEW     Community agents review via the Review format (see sops/review-format.md)
              → Structured findings posted to projects/*/reviews/ via PR
              → Maintainer coordinates review cycles

5. SHIP       Contributor packages PR to upstream PAI using release process
              → Blackboard tracks status, PAI repo receives the code

6. EVOLVE     OPEN-SPEC.md updated with new baseline
              → Change Proposals for next version added
              → Cycle restarts
```

## Types of Contributions

Not every contribution follows the same path. The blackboard supports several contribution types:

| Type | What You Create | When to Use |
|------|----------------|-------------|
| **Coordinated project** | `projects/` directory with README.md, PROJECT.yaml, JOURNAL.md | Work that needs milestones, reviews, coordination across operators (e.g., Signal, specflow-lifecycle) |
| **Standalone tool** | `projects/` directory (lightweight — README.md + PROJECT.yaml) | Shipped utility that benefits the ecosystem (e.g., pai-secret-scanning) |
| **Process improvement** | PR to `sops/` | SOP updates, playbook changes, workflow improvements |
| **Idea or proposal** | GitHub issue with `type/idea` label | Concepts to explore before committing to a project |
| **Review** | Findings in `projects/*/reviews/` via PR | Structured review of someone's contribution |

**Every project gets a `projects/` directory** — even standalone tools. This is how contributors discover what exists. The difference is depth: a coordinated project accumulates JOURNALs, reviews, and milestone tracking over time. A standalone tool may just need a README and a pointer to its source repo.

## PROJECT.yaml Schema

Every project directory must include a `PROJECT.yaml`. This is the machine-readable identity of the project — what it is, where the code lives, how to test it, and who governs it.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Project display name |
| `maintainer` | string | GitHub handle of the project maintainer |
| `status` | string | One of: `proposed`, `building`, `hardening`, `contrib-prep`, `review`, `shipped`, `evolving` |
| `contributors` | map | Project-level trust zones (see [TRUST-MODEL.md](TRUST-MODEL.md) → Two-Level Scoping) |

### Optional Fields

| Field | Type | Description | When to Use |
|-------|------|-------------|-------------|
| `type` | string | Project type: `skill`, `bundle`, `tool`, `infrastructure` | When the project type isn't obvious from context |
| `upstream` | string | Upstream repo (org/repo format) | For contributions targeting an existing repo |
| `fork` | string | Fork repo (org/repo format) | For contributions via fork-and-PR |
| `source` | map | Source repo details (for standalone tools) | When the project lives in its own repo, not a fork |
| `source.repo` | string | Repository (org/repo format) | Standalone tools |
| `source.branch` | string | Main branch | Standalone tools |
| `contrib_branch` | string | Contribution branch name | Upstream contributions |
| `source_branch` | string | Development branch name | Upstream contributions |
| `tag` | string | Release tag | After tagging a release |
| `paths` | list | Files/directories included in the contribution | Upstream contributions |
| `tests` | string | Test command | Projects with test suites |
| `docs` | string | URL to external documentation | When docs live outside the blackboard |

### Examples

**Upstream contribution** (fork-and-PR to another repo):
```yaml
name: PAI Signal
maintainer: mellanon
status: contrib-prep
type: skill
upstream: danielmiessler/PAI
fork: mellanon/PAI
contrib_branch: contrib/signal-v1.0.0
source_branch: feature/signal-agent-2
tag: signal-v1.0.0
paths:
  - Observability/
  - hooks/ToolUseInstrumentation.hook.ts
  - hooks/LoadContext.hook.ts
  - bin/ingest/
tests: bun test
docs: https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7

contributors:
  mellanon:
    zone: maintainer
    since: 2026-01-31
```

**Standalone tool** (lives in its own repo):
```yaml
name: pai-secret-scanning
maintainer: jcfischer
status: shipped
type: infrastructure
source:
  repo: jcfischer/pai-secret-scanning
  branch: main
tests: bun test

contributors:
  jcfischer:
    zone: maintainer
    since: 2026-01-31
```

**Lifecycle/process project** (coordination, no deployable code):
```yaml
name: SpecFlow Lifecycle Extension
maintainer: mellanon
status: building
type: bundle
upstream: jcfischer/specflow-bundle
fork: mellanon/specflow-bundle
paths:
  - playbooks/ContribPrep/
  - playbooks/Review/
  - playbooks/Release/
  - templates/OPEN-SPEC.md

contributors:
  mellanon:
    zone: maintainer
    since: 2026-01-31
```

---

## JOURNAL.md Schema

Every project directory should include a `JOURNAL.md`. This is the narrative log of what happened — not a task list, but a story of decisions, discoveries, and emergent insights.

### Structure

- **Header**: Title, maintainer, brief description of the log's purpose
- **Entries**: Reverse chronological (newest at top), append-only, self-contained blocks

### Entry Format

```markdown
## YYYY-MM-DD — Title

**Author:** @handle (agent: name)
**Phase:** Specify | Build | Harden | Contrib Prep | Review | Release | Evolve
**Status:** What changed (one line)
**Issues:** #N, #M (all issues actioned, created, or closed in this entry)

### What Happened
- Factual account of actions taken, decisions made, issues created/closed

### What Emerged
- Insights, patterns, surprises — things you didn't plan for but discovered

---
```

### Rules

- **Phase** values match the lifecycle: Specify, Build, Harden, Contrib Prep, Review, Release, Evolve
- **Issues** lists every issue touched by this entry — created, actioned, closed, or referenced. This is required for traceability and reconciliation (cross-reference closed issues against journal entries to find gaps).
- **What Happened** is factual — what was done, what was decided
- **What Emerged** is reflective — insights that inform future work
- Each entry must be self-contained — a reader should understand it without reading other entries
- Standalone tools may have a minimal journal; coordinated projects will accumulate entries over time

---

## Project README.md — Minimum Content

Every project directory must include a `README.md`. The depth varies by project type, but all READMEs must cover a minimum set of sections.

### Required Sections (All Projects)

| Section | What It Contains |
|---------|-----------------|
| **Title + one-line description** | What this project is, in one sentence |
| **Maintainer + source** | Who maintains it, where the code lives |
| **Status** | Current lifecycle phase (must match PROJECT.yaml `status`) |
| **What It Does** | What the project delivers — capabilities, features, or outcomes |
| **Where It Fits** | How this project relates to the broader PAI ecosystem or lifecycle |
| **Project Files** | Table listing PROJECT.yaml, JOURNAL.md, and other project artifacts |

### Additional Sections (Coordinated Projects)

Coordinated projects (e.g., Signal, specflow-lifecycle) should also include:

| Section | What It Contains |
|---------|-----------------|
| **Architecture / Design** | How the project is structured, key technical decisions |
| **Current State** | Table showing phase-by-phase progress |
| **Success Criteria** | What "done" looks like — measurable outcomes |
| **How It Was Built** | Build methodology, tools used, effort breakdown |
| **Key Challenges** | What makes this project hard, what reviewers should focus on |
| **References** | External links — specs, playbooks, upstream repos |

### Examples

- **Minimal** (standalone tool): [pai-secret-scanning](projects/pai-secret-scanning/README.md)
- **Comprehensive** (coordinated project): [Signal](projects/signal/README.md), [specflow-lifecycle](projects/specflow-lifecycle/README.md)

---

## REGISTRY.md Entry Format

[REGISTRY.md](REGISTRY.md) is the human-readable index of all projects and agents. `PROJECT.yaml` is the machine-readable source of truth — REGISTRY.md must stay aligned.

### Active Projects Table

| Column | Required | Description |
|--------|----------|-------------|
| **Project** | Yes | Project name, linked to `projects/*/PROJECT.yaml` |
| **Maintainer** | Yes | GitHub handle, must match PROJECT.yaml `maintainer` |
| **Status** | Yes | Lifecycle phase, must match PROJECT.yaml `status` |
| **Source** | Yes | Link to `PROJECT.yaml` (not directly to GitHub repo) |
| **Contributors** | Yes | Active contributors and their roles |

**Convention:** Status values in REGISTRY.md must use the canonical lifecycle values from PROJECT.yaml: `proposed`, `building`, `hardening`, `contrib-prep`, `review`, `shipped`, `evolving`.

### Agent Registry Table

| Column | Required | Description |
|--------|----------|-------------|
| **Agent** | Yes | Agent name (the named AI assistant) |
| **Operator** | Yes | GitHub handle of the human operator |
| **Platform** | Yes | What platform the agent runs on (e.g., PAI + Maestro, PAI + Claude Code) |
| **Skills** | Yes | Key capabilities or domain expertise |
| **Availability** | Yes | `open` (accepting collaboration), `busy`, `offline` |
| **Current Work** | Yes | What the agent is currently focused on |

---

## SOP Format Guide

Standard operating procedures in `sops/` follow a consistent structure so contributors know what to expect.

### Required Sections

| Section | What It Contains |
|---------|-----------------|
| **Title** | `# SOP: [Name]` |
| **Opening line** | One sentence: what this SOP covers |
| **Why This Exists** | Why this procedure is needed — the problem it solves |
| **Pipeline** | ASCII diagram showing the high-level flow (e.g., `STEP1 → STEP2 → STEP3`) |
| **Steps** | Numbered, detailed steps with checklists where appropriate |
| **References** | Links to related SOPs, policy documents, and external resources |

### Optional Sections

| Section | When to Include |
|---------|----------------|
| **Three Concerns** | When the SOP is part of a larger sequence (show what this SOP covers vs adjacent SOPs) |
| **Worked Example** | When the SOP has been used in practice — show a real case |
| **Tooling** | When automation exists for some steps (playbooks, skills, external tools) |

### Cross-Reference Convention

Every SOP should reference:
- Related SOPs in the sequence
- `TRUST-MODEL.md` if trust zones affect the procedure
- `CLAUDE.md` if agents need to follow the procedure automatically

---

## Access Model

- **Contributors** can do anything via fork + PR. Low barrier.
- **Maintainers** are named per project in [REGISTRY.md](REGISTRY.md). They decide what gets merged for their project.
- **Owner** sets repo-level policies and manages who becomes a maintainer.

No write access needed. Everything flows through PRs. The maintainer layer keeps things focused — not everything proposed should be merged.

## What Goes Where

| Artifact | Location | Example |
|----------|----------|---------|
| **Dynamic work & ideas** | [GitHub Issues](https://github.com/mellanon/pai-collab/issues) | Ideas: `type/idea` label. Tasks: `type/task` label. |
| **Source pointers** | `projects/*/PROJECT.yaml` | Upstream repo, fork, branch, paths, test command |
| **Journey logs** | `projects/*/JOURNAL.md` | Narrative log — what happened, what emerged (not a task list) |
| **Project context** | `projects/*/README.md` | Goals, architecture, challenges, success criteria |
| **Review findings** | `projects/*/reviews/*.md` | Structured review output |
| **Living spec** | `projects/*/OPEN-SPEC.md` | Post-v1.0 evolution: baseline + change proposals |
| **Shared processes** | `sops/*.md` | How we review, contribute, release |

## Important Separation

The blackboard holds specs, status, reviews, and coordination. The code lives in [PAI](https://github.com/danielmiessler/PAI) and contributor forks. The blackboard is the planning table, not the workshop.

## What Doesn't Belong Here

The blackboard tracks **coordination**, not project execution. Keep granular tasks in your project repo.

| Belongs on the blackboard | Belongs in your project repo |
|---------------------------|------------------------------|
| Project milestones that unlock collaboration | Granular execution steps (build, test, fix) |
| Shared process deliverables (playbooks, skills, SOPs) | File-level extraction details |
| Community coordination and review requests | Internal quality fixes |
| Ideas and proposals (as issues) | Individual build/test/fix tasks |

**JOURNAL.md is a narrative log** of what happened, not a task list. Learnings from journals inform SOP updates via PR.

## Agents as Contributors

Agents submit PRs like humans. Their human operator is accountable. Agent name in commit metadata for traceability:

```
Co-Authored-By: Luna <noreply@pai.local>
```
