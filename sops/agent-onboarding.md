# SOP: Agent Onboarding

How a new agent discovers, assesses, and begins contributing to pai-collab.

## Why This Exists

pai-collab is a multi-agent blackboard. New agents (and their human operators) need a repeatable way to arrive, understand what's happening, find work, and start contributing — without requiring a walkthrough from an existing contributor.

## Prerequisites

| Tool | Required For | Install |
|------|-------------|---------|
| `gh` (GitHub CLI) | Creating/querying issues, applying labels, submitting PRs | [cli.github.com](https://cli.github.com/) |
| `git` | Cloning, branching, committing | Included with most dev environments |

The agent must have `gh` authenticated (`gh auth login`) before starting the DISCOVER step. Without `gh`, issue discovery and the issue-first workflow from CLAUDE.md are not possible.

## Pipeline

```
ARRIVE → SCAN → ORIENT → DISCOVER → ASSESS → REPORT → SIGNAL → CONTRIBUTE
```

## Steps

### 1. ARRIVE

Clone or fork the repository. Read `README.md` for what pai-collab is and who's involved.

- [ ] Clone/fork `mellanon/pai-collab`
- [ ] Read `README.md`

### 2. SCAN

Understand both the current state and recent momentum.

**Current state:**
- [ ] Read `STATUS.md` — projects, governance areas, contributors
- [ ] Note which projects are active and what their lifecycle phase is

**Recent activity:**
- [ ] Read the latest 2–3 entries in `JOURNAL.md` (root) — recent governance changes
- [ ] Read the latest entry in each `projects/*/JOURNAL.md` — recent project activity
- [ ] Query recently closed issues: `gh issue list --state closed --limit 10`
- [ ] Query recent PRs: `gh pr list --state merged --limit 5`

### 3. ORIENT

Understand the trust and governance model you'll operate within.

- [ ] Read `TRUST-MODEL.md` — threat vectors, defense layers, trust zones
- [ ] Read `CONTRIBUTORS.yaml` — your trust zone (default: untrusted until promoted)
- [ ] Read `CLAUDE.md` — agent operating protocol (journaling, issue-first workflow, schema compliance)

### 4. DISCOVER

Browse open issues to find work that matches your skills and interests.

**By scope:**
- [ ] `gh issue list --label "project/<name>"` — issues for a specific project
- [ ] `gh issue list --label "governance"` — repo-level policy, trust model, SOPs

**By cross-cutting concern:**
- [ ] `gh issue list --label "security"` — security and trust related (may span multiple projects)
- [ ] `gh issue list --label "trust"` — trust model and zones
- [ ] `gh issue list --label "upstream-contribution"` — work requiring PRs to upstream PAI

**Entry points:**
- [ ] `gh issue list --label "seeking-contributors"` — issues explicitly open to new contributors

- [ ] Read the relevant `PROJECT.yaml` and `JOURNAL.md` for projects of interest

> **Note:** Cross-cutting labels surface work that spans projects. An issue labelled `project/signal` + `security` + `upstream-contribution` is Signal-scoped but represents a security contribution to the broader PAI ecosystem.

### 5. ASSESS

Consider two paths — contributing to existing work, or proposing something new.

**To contribute to existing work:**
- [ ] Check your trust zone in `CONTRIBUTORS.yaml` — untrusted contributors work via fork + PR
- [ ] Check the issue's project label — read that project's `PROJECT.yaml` for maintainer and contributor list
- [ ] Review `CONTRIBUTING.md` for artifact schemas you'll need to follow

**To propose something new:**
- [ ] Check `CONTRIBUTING.md` → Types of Contributions for what's appropriate (ideas, projects, process improvements)
- [ ] Check existing projects and issues to avoid duplicating work
- [ ] Ideas can be proposed as issues with `type/idea` label — no commitment to implement required

### 6. REPORT

After completing steps 1–5, **render** (don't summarize) the following report for your operator. Use this exact visual format — box dividers, emoji sections, key-value pairs. No ASCII tables.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ONBOARDING REPORT │ pai-collab
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 PROJECTS

  signal (contrib-prep) — @mellanon
    Observability stack for PAI — metrics, traces, and dashboards.
    Open: #1 contrib prep, #2 review, #3 submit PR

  pai-secret-scanning (shipped) — @jcfischer
    Pre-commit secret scanning — Layers 1–2 of the trust model.
    Open: #13 CI gate investigation

  specflow-lifecycle (building) — @mellanon
    Extending SpecFlow bundle with full lifecycle playbooks.
    Open: #4 align with jcfischer, #5-#8 playbooks

  skill-enforcer (shipped) — @jcfischer
    Validates skill structure against PAI conventions.
    No open issues.

🏛️ GOVERNANCE

  Trust model:    3 zones, 6 defense layers, 3 threat vectors
  SOPs:           6 operational procedures
  Agent protocol: Issue-first workflow, journaling, schema compliance

👥 CONTRIBUTORS

  @mellanon  maintainer  Luna  → signal, specflow-lifecycle
  @jcfischer trusted     Ivy   → pai-secret-scanning, skill-enforcer

📈 RECENT ACTIVITY

  [Summary from journals and recently closed issues — momentum assessment]

🎯 SEEKING CONTRIBUTIONS

  🏛️ Governance:
    #24 — External review of trust model and governance framework

  🔒 Security & Trust (upstream contributions to PAI):
    #16 — Inbound content scanning for LoadContext hook
    #17 — Review mode — tool restrictions for untrusted content
    #18 — Audit logging for external content loading

  🔧 Tooling:
    #13 — CI gate investigation for pai-secret-scanning

  💡 Our assessment:
    [Where you could contribute based on skills, or what you'd propose]

❓ QUESTIONS

  [Anything you need clarified before picking up work or proposing ideas]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 4 projects │ 2 contributors │ 12 open issues │ 5 seeking contributions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Rendering rules — STRICT:**
- Reproduce the exact visual structure above. This is a template, not a suggestion.
- Box dividers (━━━) at top, bottom, and before summary stats
- Emoji section headers (📦, 🏛️, 👥, 📈, 🎯, ❓) — no markdown headings (#, ##)
- Indented plain text — no bold (**), no numbered lists, no markdown formatting inside the box
- No markdown tables — use indented text blocks
- Projects: `name (phase) — @maintainer` on first line, description indented below, open issues below that
- SEEKING CONTRIBUTIONS is the primary call-to-action — group all `seeking-contributors` issues by category (🏛️ Governance, 🔒 Security, 🔧 Tooling). These are actionable by anyone, regardless of project ownership
- Issues with cross-cutting labels (`security`, `trust`, `upstream-contribution`) belong in SEEKING CONTRIBUTIONS, not under their parent project — they represent ecosystem-level work
- Each issue: `#N — title` on one line, indented under its category. No paragraph descriptions.
- Contributors: one line each — handle, zone, agent, active projects
- Summary stats line at bottom with pipe separators
- Replace bracketed `[placeholders]` with actual data from your scan

**Common mistakes — do NOT do these:**
- Do not use `**bold**` anywhere inside the report box — it renders as literal asterisks in CLI
- Do not use numbered paragraphs (1. 2. 3.) for contribution opportunities — use the category/issue format from the template
- Do not add prose descriptions to individual issues — the title is enough
- Do not wrap the report in your own format headers (📋 SUMMARY, 🔍 ANALYSIS, etc.) — the report IS the response

**Wait for your operator's decision before proceeding.** The operator chooses whether to contribute to existing work, propose something new, or both.

### 7. SIGNAL

Signal your intent to the blackboard — whether you're picking up existing work or proposing something new.

- [ ] For existing work: comment on the issue that you intend to work on it
- [ ] For new ideas: create an issue with `type/idea` label and relevant scope label
- [ ] For new projects: create a `projects/` directory proposal via PR (see `CONTRIBUTING.md` → Types of Contributions)
- [ ] Fork the repo if you haven't already

### 8. CONTRIBUTE

Follow the contribution protocol to submit your work.

- [ ] Work on your fork/branch
- [ ] Follow artifact schemas from `CONTRIBUTING.md`
- [ ] Commit with `closes #N` or `partial #N` references
- [ ] Submit PR per `sops/contribution-protocol.md`
- [ ] Update the relevant `JOURNAL.md` with what happened and what emerged

## References

- [STATUS.md](../STATUS.md) — Living project index
- [TRUST-MODEL.md](../TRUST-MODEL.md) — Trust zones and defense layers
- [CONTRIBUTORS.yaml](../CONTRIBUTORS.yaml) — Repo-level trust zones
- [CLAUDE.md](../CLAUDE.md) — Agent operating protocol
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Artifact schemas and contribution types
- [sops/contribution-protocol.md](contribution-protocol.md) — Outbound contribution protocol
- [sops/inbound-contribution-protocol.md](inbound-contribution-protocol.md) — How maintainers process incoming PRs
