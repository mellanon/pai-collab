# SpecFlow Lifecycle Extension

**Goal:** Extend [SpecFlow](https://github.com/jcfischer/specflow-bundle) from a build tool into a full development lifecycle tool.

SpecFlow + [Maestro](https://runmaestro.ai/) handles **Spec → Build → Test** well. But the pipeline has gaps after the build — the phases you need to go from "working code" to "shipped contribution":

| Phase | SpecFlow Today | What's Missing |
|-------|---------------|----------------|
| Spec | SPEC.md + SpecFirst | Covered |
| Build | Maestro Playbooks | Covered |
| Test | Unit + integration | Covered |
| **Contrib Prep** | — | Extract from private trunk, sanitize, stage |
| **Review** | — | Independent AI review ([Greptile principle](https://www.greptile.com/blog/ai-code-review-bubble)) |
| **Release** | — | PR packaging, changelog, contribution workflow |
| **Maintain** | — | Versioned spec evolution post-merge |

## Four New Playbooks

### 1. Contrib Prep Playbook
Every PAI contributor develops on a private trunk. Before sharing, extract the contribution cleanly.
```
INVENTORY → SANITIZE → EXTRACT → VERIFY → TEST → STAGE → GATE → PUBLISH
```
Three concerns, cleanly separated: Contrib Prep ("Is this safe to share?"), Review ("Is this good code?"), Release ("Is this ready to merge?").

### 2. Review Playbook
The reviewing agent must be independent from the coding agent. Based on the existing [Maestro PR_Review playbook](https://github.com/mellanon/maestro-pai-playbooks/tree/main/playbooks/PR_Review) (6-step pipeline producing structured findings).
```
SCOPE → ARCH → EVAL → SECURITY → PERF → DOCS → REPORT → GATE
```

### 3. Release Playbook
Based on the [SpecFirst Release Framework](https://github.com/mellanon/pai-1.2/blob/feature/jira-analysis/.claude/skills/SpecFirst/templates/RELEASE-FRAMEWORK.md). Nine human approval gates from file inventory through to PR creation. Key principle: tag = tested code, cherry-pick from tag, file inventory is law.

### 4. Open Spec Template
SpecFlow handles v0 → v1.0.0. Open Spec handles evolution post-merge: baseline (what's shipped), Change Proposals (what's next with impact analysis), and version history. It feeds back into SpecFlow for the next build cycle.

## Proven by Signal

[PAI Signal](../signal/) is the first project to need all four missing phases. The experience of shipping 25,000 lines of AI-generated code through Contrib Prep → Review → Release is what identified these gaps. See Signal's [JOURNAL.md](../signal/JOURNAL.md) for the full story.

## Source Code

| What | Where |
|------|-------|
| Upstream | [jcfischer/specflow-bundle](https://github.com/jcfischer/specflow-bundle) |
| Fork | [mellanon/specflow-bundle](https://github.com/mellanon/specflow-bundle) |
| Maestro Playbooks | [mellanon/maestro-pai-playbooks](https://github.com/mellanon/maestro-pai-playbooks) |

## Project Files

| File | Purpose |
|------|---------|
| [PROJECT.yaml](PROJECT.yaml) | Source pointers |
| [JOURNAL.md](JOURNAL.md) | Journey log |
