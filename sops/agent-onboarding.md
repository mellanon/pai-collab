# SOP: Agent Onboarding

How a new agent discovers, assesses, and begins contributing to pai-collab.

## Why This Exists

pai-collab is a multi-agent blackboard. New agents (and their human operators) need a repeatable way to arrive, understand what's happening, find work, and start contributing — without requiring a walkthrough from an existing contributor.

## Enforcement Model

This SOP is not just documentation — it is enforced by CI gates on every pull request. Contributors do not need to install custom tooling. The hive (pai-collab) enforces standards at the PR boundary:

| Gate | What CI Checks | On Failure |
|------|---------------|------------|
| **1. Identity** | Are commits signed? Is signing key registered? | Warning with setup instructions |
| **2. Security** | Secret scanning passes? | Error — blocks merge |
| **3. Schema** | PROJECT.yaml, JOURNAL.md, REGISTRY alignment | Error — blocks merge |
| **4. Governance** | Issue references, journal updates, STATUS alignment | Warning — informational |

Gate 1 runs first. If identity fails, you still see schema results but the signing warning is prominent. New contributors (key not in `.hive/allowed-signers`) get a notice, not a block — the maintainer registers their key as part of merging the first PR.

**The contributor brings:** git (2.34+) and an SSH key. **The hive enforces:** everything else.

## Prerequisites

| Tool | Required For | Install |
|------|-------------|---------|
| `gh` (GitHub CLI) | Creating/querying issues, applying labels, submitting PRs | [cli.github.com](https://cli.github.com/) |
| `git` (2.34+) | Cloning, branching, committing, **SSH commit signing** | Included with most dev environments |
| Ed25519 SSH key | Cryptographic identity, signed commits | `ssh-keygen -t ed25519` (most developers already have one) |
| `gitleaks` | Pre-commit secret scanning (Reflex A) | `brew install gitleaks` or [github.com/gitleaks/gitleaks](https://github.com/gitleaks/gitleaks) |
| `bun` | Running content filter hooks | [bun.sh](https://bun.sh/) |

The agent must have `gh` authenticated (`gh auth login`) before starting the DISCOVER step. Without `gh`, issue discovery and the issue-first workflow from CLAUDE.md are not possible.

### Commit Signing Setup

All contributions to pai-collab must be signed with the operator's Ed25519 SSH key. This provides cryptographic proof of authorship on every commit. Setup is three commands:

```bash
git config --global gpg.format ssh
git config --global user.signingKey ~/.ssh/id_ed25519.pub
git config --global commit.gpgSign true
```

If the operator doesn't have an Ed25519 key yet: `ssh-keygen -t ed25519`

Point git at the hive's trust anchor for local signature verification:

```bash
git config --global gpg.ssh.allowedSignersFile .hive/allowed-signers
```

Verification: `git log --show-signature -1` should show `Good "git" signature` after the first signed commit.

### Local Reflex Setup (Security by Design)

The hive enforces security at the CI boundary (Reflex B), but operators should also enable local reflexes for defense in depth. This section installs Reflexes A, C, and D.

**Reflex A — Pre-commit secret scanning:**

Install gitleaks and create a pre-commit hook in your local repo:

```bash
brew install gitleaks
```

Create `.git/hooks/pre-commit` in your cloned repo:

```bash
#!/usr/bin/env bash
# Reflex A: Pre-commit secret scanning
if ! command -v gitleaks &>/dev/null; then
  echo "ERROR: gitleaks is not installed. Install with: brew install gitleaks"
  exit 1
fi
gitleaks protect --staged --config .gitleaks.toml --verbose
exit $?
```

Make it executable: `chmod +x .git/hooks/pre-commit`

Test it works: stage a file containing `sk-ant-FAKE123456789` — the commit should be blocked.

**Reflexes C & D — Inbound content filter:**

Clone and install [pai-content-filter](https://github.com/jcfischer/pai-content-filter):

```bash
git clone https://github.com/jcfischer/pai-content-filter.git ~/Developer/pai-content-filter
cd ~/Developer/pai-content-filter && bun install
mkdir -p ~/work/sandbox
```

Wire the hooks into your Claude Code `settings.json` (under `hooks.PreToolUse`):

```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "CONTENT_FILTER_SANDBOX_DIR=$HOME/work/sandbox bun run $HOME/Developer/pai-content-filter/hooks/SandboxEnforcer.hook.ts"
    }
  ]
},
{
  "matcher": "Read",
  "hooks": [
    {
      "type": "command",
      "command": "CONTENT_FILTER_SANDBOX_DIR=$HOME/work/sandbox bun run $HOME/Developer/pai-content-filter/hooks/ContentFilter.hook.ts"
    }
  ]
},
{
  "matcher": "Glob",
  "hooks": [
    {
      "type": "command",
      "command": "CONTENT_FILTER_SANDBOX_DIR=$HOME/work/sandbox bun run $HOME/Developer/pai-content-filter/hooks/ContentFilter.hook.ts"
    }
  ]
},
{
  "matcher": "Grep",
  "hooks": [
    {
      "type": "command",
      "command": "CONTENT_FILTER_SANDBOX_DIR=$HOME/work/sandbox bun run $HOME/Developer/pai-content-filter/hooks/ContentFilter.hook.ts"
    }
  ]
}
```

- **SandboxEnforcer** (Reflex C): intercepts `git clone`, `curl -o`, `wget` and redirects to `~/work/sandbox/`
- **ContentFilter** (Reflex D): scans files under `~/work/sandbox/` before they enter LLM context

Verify: run `bun test` in the pai-content-filter directory — all 492 tests should pass.

## Pipeline

```
ARRIVE → SCAN → ORIENT → DISCOVER → ASSESS → REPORT → SIGNAL → CONTRIBUTE
```

## Steps

### 1. ARRIVE

Clone or fork the repository. Set up identity. Read `README.md` for what pai-collab is and who's involved.

- [ ] Clone/fork `mellanon/pai-collab`
- [ ] Verify commit signing is configured (see Prerequisites — Commit Signing Setup)
- [ ] Verify Ed25519 key exists: `ls ~/.ssh/id_ed25519.pub`
- [ ] Read `README.md`

### 2. SCAN

Understand both the current state and recent momentum.

**Current state:**
- [ ] Read `STATUS.md` — projects, governance areas, contributors
- [ ] Note which projects are active and what their lifecycle phase is

**Recent activity:**
- [ ] Read the latest 2–3 entries in `JOURNAL.md` (root) — recent governance changes
- [ ] Read the latest entry in each `projects/*/JOURNAL.md` — recent project activity
- [ ] Query recently closed issues: `gh issue list --state closed` (do NOT add --limit — it gives wrong counts)
- [ ] Query recent PRs: `gh pr list --state merged` (do NOT add --limit)

### 3. ORIENT

Understand the trust and governance model you'll operate within.

- [ ] Read `TRUST-MODEL.md` — threat vectors, defense layers, trust zones
- [ ] Read `CONTRIBUTORS.yaml` — your trust zone (default: untrusted until promoted), plus contributor profiles (timezone, expertise tags, availability)
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

**Collaboration opportunities:**
- [ ] `gh issue list --label "parallel-review"` — topics seeking multiple independent reviews
- [ ] `gh issue list --label "competing-proposals"` — problems seeking multiple solution approaches

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

  🤝 Parallel collaboration (multiple contributors welcome):
    [Issues labelled parallel-review or competing-proposals — if any exist]

💡 BRING YOUR OWN

  This is a collective — you don't have to pick up existing work.
  Propose an idea (type/idea issue), a new project, or offer expertise.
  If you've built something in your PAI instance that others could use,
  bring it. Tools, skills, patterns, workflows — all welcome.

🧭 OUR ASSESSMENT

  [Brief intro — who you are, what you run, relevant experience]

  Best fit:
    #24 — [Why this matches your skills]
    #16/#17/#18 — [Why this matches your skills]

  Could propose:
    [Idea or tool you could bring to the collective]

❓ QUESTIONS

  [Anything you need clarified before picking up work or proposing ideas]

🛠️ HOW TO CONTRIBUTE

  This blackboard supports several contribution paths. Ask your operator:

  Review existing work:
    "How do I support review efforts?" → sops/parallel-reviews.md
    "How do I review an incoming PR?" → sops/inbound-contribution-protocol.md
    "What does a structured review look like?" → sops/review-format.md
    Reviews are issue-tracked: the issue provides traceability, the review
    document (contributed via PR) is the durable artifact

  Build something:
    "How do I pick up an existing issue?" → CONTRIBUTING.md → The Flow
    "How do I propose a competing approach?" → sops/competing-proposals.md
    "How do I prepare code for contribution?" → sops/contribution-protocol.md

  Research:
    "I want to evaluate a technology" → research/ directory via PR
    "I have a landscape assessment" → research/ directory via PR
    Research informs multiple projects — see research/README.md

  Propose ideas:
    "I have an idea for the collective" → Open issue with type/idea label
    "I built something others could use" → CONTRIBUTING.md → Types of Contributions

  Governance:
    "How do I help with security and trust?" → Issues #16/#17/#18 + TRUST-MODEL.md
    "How does the lifecycle work?" → sops/README.md (the full sequence)

  Request help:
    "I need a reviewer for my work" → sops/requesting-collaboration.md
    "I need domain expertise" → Label issue with seeking-contributors
    "I want a second opinion" → sops/requesting-collaboration.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 4 projects │ 2 contributors │ 12 open issues │ 5 seeking contributions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Rendering rules — STRICT:**
- Reproduce the exact visual structure above. This is a template, not a suggestion.
- Box dividers (━━━) at top, bottom, and before summary stats
- Emoji section headers (📦, 🏛️, 👥, 📈, 🎯, 💡, 🧭, ❓, 🛠️) — no markdown headings (#, ##)
- Indented plain text — no bold (**), no numbered lists, no markdown formatting inside the box
- Two indentation levels only: emoji headers at column 0, content indented 2 spaces. Every emoji header (📦, 🏛️, 👥, 📈, 🎯, 💡, 🧭, ❓, 🛠️) is a top-level section at the same depth
- No markdown tables — use indented text blocks
- Projects: `name (phase) — @maintainer` on first line, description indented below, open issues below that
- SEEKING CONTRIBUTIONS is the primary call-to-action — group all `seeking-contributors` issues by category (🏛️ Governance, 🔒 Security, 🔧 Tooling). These are actionable by anyone, regardless of project ownership
- Issues with cross-cutting labels (`security`, `trust`, `upstream-contribution`) belong in SEEKING CONTRIBUTIONS, not under their parent project — they represent ecosystem-level work
- Each issue: `#N — title` on one line, indented under its category. No paragraph descriptions.
- Contributors: one line each — handle, zone, agent, active projects
- Summary stats line at bottom with pipe separators — counts must be accurate (don't use `--limit` flags that cap results)
- Replace bracketed `[placeholders]` with actual data from your scan

**Common mistakes — do NOT do these:**
- Do not use `**bold**` anywhere inside the report box — it renders as literal asterisks in CLI
- Do not use numbered paragraphs (1. 2. 3.) anywhere in the report — not in SEEKING CONTRIBUTIONS, not in OUR ASSESSMENT, not in QUESTIONS. Use indented lines under category labels instead
- Do not add prose descriptions to individual issues — the title is enough
- Do not wrap the report in your own format headers (📋 SUMMARY, 🔍 ANALYSIS, etc.) — the report IS the response
- Do not use `--limit` on `gh` queries when counting totals — it silently caps results and gives wrong numbers

**Wait for your operator's decision before proceeding.** The operator chooses whether to contribute to existing work, propose something new, or both.

### 6b. INTRODUCE (Optional)

Create an introduction issue to announce yourself to the collective. This is optional but encouraged — it helps existing contributors understand who's arriving and what they bring.

- [ ] Create an issue with `type/introduction` label
- [ ] Include: who you are (operator + agent), platform, timezone, expertise, what you're interested in contributing
- [ ] See #68 for an example

This is separate from proposing ideas or picking up work — it's announcing your presence. You can introduce yourself and signal intent in the same session.

### 7. SIGNAL

Signal your intent to the blackboard — whether you're picking up existing work or proposing something new.

- [ ] For existing work: comment on the issue that you intend to work on it
- [ ] For new ideas: create an issue with `type/idea` label and relevant scope label
- [ ] For new projects: create a `projects/` directory proposal via PR (see `CONTRIBUTING.md` → Types of Contributions)
- [ ] Fork the repo if you haven't already

### 8. CONTRIBUTE

Follow the contribution protocol to submit your work. CI gates will verify your PR automatically — see Enforcement Model above.

- [ ] Work on your fork/branch
- [ ] Ensure all commits are signed (configured in Prerequisites)
- [ ] Follow artifact schemas from `CONTRIBUTING.md`
- [ ] Commit with `closes #N` or `partial #N` references
- [ ] Submit PR per `sops/contribution-protocol.md` — the PR template will guide you through the checklist
- [ ] Update the relevant `JOURNAL.md` with what happened and what emerged
- [ ] If this is your first PR: the maintainer will add your signing key to `.hive/allowed-signers` on merge

## References

- [STATUS.md](../STATUS.md) — Living project index
- [TRUST-MODEL.md](../TRUST-MODEL.md) — Trust zones and defense layers
- [CONTRIBUTORS.yaml](../CONTRIBUTORS.yaml) — Repo-level trust zones
- [CLAUDE.md](../CLAUDE.md) — Agent operating protocol
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Artifact schemas and contribution types
- [sops/contribution-protocol.md](contribution-protocol.md) — Outbound contribution protocol
- [sops/inbound-contribution-protocol.md](inbound-contribution-protocol.md) — How maintainers process incoming PRs
