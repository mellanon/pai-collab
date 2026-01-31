# SOP: Project Archival

How to archive inactive projects and how to revive them.

## Why This Exists

Projects that stall consume attention. When a proposed or building project has no activity for an extended period, it should be archived so contributors can focus on active work. Archival is reversible — projects can be revived when someone picks them up.

## Pipeline

```
IDENTIFY → DECIDE → ARCHIVE → NOTIFY
```

## Steps

### 1. IDENTIFY

Review projects for staleness. Indicators:

- **`created:` date** in PROJECT.yaml — how long has this existed?
- **JOURNAL.md** — when was the last entry?
- **Open issues** — any activity? Comments? Assignees?
- **PRs** — any recent submissions?

There is no automatic threshold. The maintainer or repo owner decides when a project is stale based on these signals.

### 2. DECIDE

The decision to archive rests with:

- **Project maintainer** — can archive their own project at any time
- **Repo owner** — can archive any project after consulting the maintainer

Before archiving, consider:

- [ ] Is the maintainer aware and in agreement?
- [ ] Are there open PRs that should be merged or closed first?
- [ ] Are there open issues that should be closed or transferred?

### 3. ARCHIVE

Execute the following steps in a single commit:

- [ ] Update `PROJECT.yaml`: set `status: archived`
- [ ] Update `REGISTRY.md`: change project status to `archived`
- [ ] Update `STATUS.md`: move project to an "Archived" section or remove from active projects
- [ ] Close all open issues scoped to this project with a comment: `Archived — project inactive. Reopen if revived.`
- [ ] Retire the `project/<name>` scope label (delete it) — archived projects don't need issue routing
- [ ] Add a final `JOURNAL.md` entry documenting the archival decision and reason

The `projects/<name>/` directory is **not deleted** — it serves as a record of what was attempted, decisions made, and lessons learned.

### 4. NOTIFY

- [ ] If the project had external contributors, comment on the project README or create a discussion noting the archival
- [ ] If the project had `seeking-contributors` issues, those are closed in step 3

## Reviving an Archived Project

Anyone can propose reviving an archived project:

1. Create an issue: `governance: Revive <project-name>` with `type/idea` label
2. Explain why — what's changed, who will maintain it, what the plan is
3. If approved by repo owner:
   - [ ] Update `PROJECT.yaml`: set `status: proposed` (or appropriate phase), update `created:` to today's date
   - [ ] Update `REGISTRY.md` and `STATUS.md`
   - [ ] Create a new `project/<name>` scope label
   - [ ] Add a JOURNAL.md entry documenting the revival

## References

- [CONTRIBUTING.md](../CONTRIBUTING.md) — PROJECT.yaml schema, lifecycle status values
- [CLAUDE.md](../CLAUDE.md) — Scope label lifecycle rules
- [STATUS.md](../STATUS.md) — Living project index
- [REGISTRY.md](../REGISTRY.md) — Project and agent registry
