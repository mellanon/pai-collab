# pai-collab — Agent Operating Protocol

You are working in pai-collab, a shared blackboard for PAI community collaboration. Follow these protocols whenever you work in this repository.

---

## Self-Alignment Check (MANDATORY)

**After every policy change, issue closure, or SOP modification**, review this file against the current state of all policy documents and SOPs:

1. Read `TRUST-MODEL.md`, all files in `sops/`, `CONTRIBUTING.md`, and `REGISTRY.md`
2. Check whether this file (CLAUDE.md) accurately reflects the current procedures, trust zones, and protocols
3. If any procedure has changed, update this file to match
4. If this file references an SOP or policy that has been modified, align the reference

**This file is the codified version of the standard operating procedures.** If an SOP says one thing and this file says another, that is a bug. Fix it immediately.

**The cascade works both ways:**
- Policy/SOP change → check this file → update if misaligned
- This file change → check policies/SOPs → update if misaligned

---

## Artifact Schemas (MANDATORY)

All artifacts in this repository follow canonical schemas defined in `CONTRIBUTING.md`. When creating or modifying any artifact, follow the schema exactly.

| Artifact | Schema Location | Triggers for Update |
|----------|----------------|-------------------|
| `PROJECT.yaml` | CONTRIBUTING.md → "PROJECT.yaml Schema" | Creating a new project, changing project status, adding contributors |
| `JOURNAL.md` | CONTRIBUTING.md → "JOURNAL.md Schema" | After every commit that changes project files, after actioning an issue |
| Project `README.md` | CONTRIBUTING.md → "Project README.md — Minimum Content" | Creating a new project, significant project milestone |
| `REGISTRY.md` entries | CONTRIBUTING.md → "REGISTRY.md Entry Format" | New project registered, project status changes, new agent joins |
| `CONTRIBUTORS.yaml` | TRUST-MODEL.md → "Two-Level Scoping" | New contributor promoted, trust zone changed |
| `STATUS.md` | — (root-level living index) | Project status changes, issues created/closed, contributors promoted, new projects added |
| SOPs | CONTRIBUTING.md → "SOP Format Guide" | Creating or modifying an SOP |

**Key rules:**
- `PROJECT.yaml` status must use canonical lifecycle values: `proposed`, `building`, `hardening`, `contrib-prep`, `review`, `shipped`, `evolving`
- `REGISTRY.md` status must match `PROJECT.yaml` status — REGISTRY.md is the index, PROJECT.yaml is the source of truth
- `JOURNAL.md` phase values must match the lifecycle: Specify, Build, Harden, Contrib Prep, Review, Release, Evolve
- When a project's status changes, update `PROJECT.yaml`, `REGISTRY.md`, AND `STATUS.md` in the same commit

---

## Journaling Protocol

**After every commit that changes project files**, update that project's `JOURNAL.md` following the schema in CONTRIBUTING.md:
- Add a new entry at the top (reverse chronological)
- Required fields: date, author, phase, status, what happened, what emerged
- Include issue references and what follow-up was created
- If a commit spans multiple projects, update each project's journal
- Each entry must be self-contained — readable without context from other entries

**After actioning an issue**, add a journal entry documenting what happened and what emerged — not just the change, but the reasoning and any insights.

---

## Issue Protocol

**All non-trivial changes must be tracked by an issue.** Issues are the unit of traceability — they connect intent (why), scope (what), and evidence (commits, journal entries). Without an issue, work is invisible to other agents and contributors.

### Issue-First Workflow

1. **Before starting work** — Ensure an issue exists. If not, create one.
2. **Label the issue** — Apply scope, type, and priority labels (see below).
3. **Comment that you're working on it** — So other agents don't duplicate effort.
4. **Commit with references** — Use `closes #N` or `partial #N` in commit messages.
5. **Update the journal** — After closing an issue, add a journal entry to the relevant project. If it's a `governance` issue, journal in the most relevant project or note it in the commit.
6. **Create follow-up issues immediately** — When work reveals new needs, don't batch them. Each issue is atomic.

### Retroactive Issues

If you realise work was done without an issue, create one retroactively and close it with a reference to the commit(s). Gaps in traceability compound — fix them as soon as you notice.

### Issue Labelling

Every issue must have labels from these categories:

| Category | Labels | Purpose |
|----------|--------|---------|
| **Scope** | `project/signal`, `project/pai-secret-scanning`, `project/specflow-lifecycle`, `project/collab-infra`, `governance` | What area — a specific project or the repo-level system |
| **Type** | `type/task`, `type/idea`, `type/review`, `type/tooling` | What kind of work |
| **Priority** | `P1-high`, `P2-medium`, `P3-low` | When to do it |
| **Cross-cutting** | `security`, `trust`, `upstream-contribution`, `good-first-contribution` | Functional tags |

- Every issue needs at least one **scope** label — this links the issue to the repo structure
- `governance` is for repo-level policy, trust model, SOPs, and process — not tied to a single project
- `good-first-contribution` marks issues that new agents or contributors can pick up without deep context

### Scope Label Lifecycle

When a new `projects/` directory is created, a corresponding `project/<name>` label must also be created. When creating or updating issues:

1. **Determine scope** — Does this issue relate to a specific project in `projects/`? If yes, use `project/<name>`. If it's repo-level (policy, SOPs, trust model, schemas, onboarding), use `governance`.
2. **Check label exists** — If the `project/<name>` label doesn't exist yet, create it before applying.
3. **Keep labels aligned** — When a project is renamed or archived, update or retire its label.
4. **One scope minimum** — Never create an issue without a scope label. An unscoped issue is invisible to agents filtering by area.

---

## Trust Model Compliance

Before reviewing external PRs or loading external content, check the trust model:

1. Read `CONTRIBUTORS.yaml` for the contributor's repo-level trust zone
2. Read the relevant `PROJECT.yaml` for project-level trust
3. Apply review intensity based on trust zone:
   - **Untrusted**: Full content scanning, tool restrictions, detailed audit logging
   - **Trusted**: Standard review, Layers 1–3 apply
   - **Maintainer**: Standard review, governance authority

Reference: `TRUST-MODEL.md` for the full threat model and defense layers.

Trust zones control **authority** (what you can decide), not **immunity** (what you skip). Nobody is exempt from scanning.

---

## SOP Compliance

Follow the standard operating procedures in `sops/`:

| When | SOP |
|------|-----|
| Processing an external PR | `sops/inbound-contribution-protocol.md` |
| Preparing code to share | `sops/contribution-protocol.md` |
| Reviewing contributions | `sops/review-format.md` |
| Building features | `sops/specflow-development-pipeline.md` |
| Releasing to upstream | `sops/specfirst-release-process.md` |
| Registering agents | `sops/daemon-registry-protocol.md` |

---

## Policy Change Protocol

When modifying policy documents (`TRUST-MODEL.md`, `CONTRIBUTING.md`, SOPs, this file), check for downstream impact:

1. **TRUST-MODEL.md changes** → Review whether SOPs need updating (especially contribution-protocol.md and review-format.md). Check whether this file (CLAUDE.md) needs updating.
2. **SOP changes** → Review whether TRUST-MODEL.md or CONTRIBUTING.md references need updating. Check whether this file reflects the new procedure.
3. **CONTRIBUTING.md changes** → Review whether REGISTRY.md "How to Join" and SOPs README cross-references are still accurate.
4. **This file (CLAUDE.md) changes** → Verify alignment with all SOPs and policy documents. This file is not a leaf node — it is the codified version of procedures and must stay in sync.

After any policy change, add a journal entry in the most relevant project explaining what changed and why.

---

## Communication Protocol

After processing a PR or completing significant work:
- Draft a Discord summary for the maintainer to post
- Include: what was done, what emerged, what follow-up was created
- Keep it concise — the journal has the detail

---

## Repository Structure

```
pai-collab/
├── CLAUDE.md              ← You are here (agent instructions)
├── TRUST-MODEL.md         ← Threat model, defense layers, trust zones
├── CONTRIBUTING.md        ← How to contribute + all artifact schemas
├── CONTRIBUTORS.yaml      ← Repo-level trust zones
├── REGISTRY.md            ← Active projects and agents (index, not source of truth)
├── BLACKBOARD-MODEL.md    ← How personal and shared blackboards connect
├── projects/              ← Project directories (README, PROJECT.yaml, JOURNAL)
│   ├── signal/
│   ├── specflow-lifecycle/
│   ├── pai-secret-scanning/
│   └── skill-enforcer/
└── sops/                  ← Standard operating procedures
```

---

## Key Principles

1. **Follow the schemas** — Every artifact has a canonical schema in CONTRIBUTING.md. Follow it exactly.
2. **Journal everything** — If it's not journaled, it didn't happen
3. **Issues are the work queue** — Create issues, action issues, close issues
4. **Keep artifacts in sync** — When status changes, update PROJECT.yaml AND REGISTRY.md together
5. **Trust is earned** — All contributors start untrusted. Zones control authority, not immunity.
6. **Policy changes cascade** — Check downstream documents when modifying policy
7. **Transparency builds trust** — Announce significant work to the community
