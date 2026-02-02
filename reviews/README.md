# Governance Reviews

Repo-level review artifacts — trust model audits, documentation audits, governance assessments, and cross-project reviews that don't belong to any single project.

Project-level reviews live in `projects/*/reviews/`. This directory is for work that spans the entire blackboard.

## Naming Convention

```
reviews/<date>-<topic>-<handle>.md
```

Example: `reviews/2026-02-01-documentation-audit-mellanon.md`

## What Belongs Here

| Type | Example |
|------|---------|
| Trust model reviews | External assessment of TRUST-MODEL.md |
| Documentation audits | Cross-file consistency checks |
| Governance assessments | Policy gap analysis, process reviews |
| Cross-project reviews | Reviews spanning multiple projects |

## What Doesn't Belong Here

- Project-specific reviews → `projects/*/reviews/`
- Process changes → `sops/` (as SOPs or SOP updates)
- Ideas → GitHub issues with `type/idea` label
