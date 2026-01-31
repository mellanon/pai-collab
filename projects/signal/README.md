# PAI Signal

An observability stack that ships logs, traces, and metrics from PAI into VictoriaMetrics + Grafana. The first project through the blackboard collaboration system.

![Signal Gateway: The Nervous System](../../assets/pai-signal-nervous-system.png)

---

## Current State

| Phase | Status |
|-------|--------|
| Spec | ✅ Done — shared as [gist](https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7), community feedback from Discord |
| Build | ✅ Done — Maestro + SpecFlow, 18 features, 708 tests |
| Human Hardening | ✅ Done — 11 commits, ~9,800 lines of acceptance fixes and emergent features |
| **Contrib Prep** | 🏃 **Current** — extracting ~102 files from private trunk, sanitizing |
| Review | ⏳ Pending — seeking independent community reviewers |
| Release | ⏳ Pending — PR packaging, changelog, migration guide |

## What's Needed

- **Reviewers** — Independent code review (architecture fit, code quality, security, test quality). See [review format](../../sops/review-format.md).
- **Docker feedback** — Is the OrbStack + VictoriaMetrics + Vector + Grafana stack reasonable for local PAI?
- **Contrib Prep completion** — Extract, sanitize, push clean branch

## Why This Matters

Signal tests the entire collaboration pipeline end-to-end. If the process works for 25,000 lines of AI-generated code across 102 files with Docker infrastructure, it works for smaller contributions too. See [JOURNAL.md](JOURNAL.md) for the full story.

---

## Project Files

| File | What It Contains |
|------|-----------------|
| **[TELOS.md](TELOS.md)** | Vision, architecture direction, how it was built, success criteria, key challenge |
| [JOURNAL.md](JOURNAL.md) | Journey log — what happened, what's emerging, what would be helpful |
| [PROJECT.yaml](PROJECT.yaml) | Source pointers — repo, branch, paths, test command |
| [OPEN-SPEC.md](OPEN-SPEC.md) | Living spec — populated after v1.0 merge |
| [reviews/](reviews/) | Community review findings |
