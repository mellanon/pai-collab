# SOP: SpecFirst Release Process

The release process for contributing PAI projects to upstream. Based on the [SpecFirst methodology](https://github.com/danielmiessler/PAI) — flexible on spec tooling, strict on release process.

## Tooling Status

| Layer | Status | What Exists |
|-------|--------|-------------|
| **Process doc** | ✅ This document | Human-readable 8-gate procedure |
| **Prototype** | ⚠️ [_SPECFIRST skill](https://github.com/danielmiessler/PAI) | PAI skill with release framework templates (private, will be contributed) |
| **Maestro playbook** | ❌ Needs building | Autorun-format playbook adapting this process |
| **PAI skill (CLI)** | ❌ Needs building | `bin/release/` — changelog, migration guide, PR template, gate tracking |

**Today:** This process is executed manually. It's been battle-tested across 4 projects (see below), but a human walks through each gate and orchestrates between tools. The goal is to integrate this with SpecFlow bundle, Maestro playbooks, and PAI skills so agents can execute the process end-to-end with human approval at each gate.

See [SOPs README](README.md) for where this fits in the full lifecycle and what's needed across all phases.

## Core Principle

> AI tools make development easy — but also make it easy to leak data or create bloated PRs. The release process must be more controlled than development.

## The Tag-Before-Contrib Pattern

```
feature branch → test → tag (vX.Y.Z) → cherry-pick FROM TAG → contrib branch → sanitize → push → PR
```

**Why tag first?** Ensures the PR contains EXACTLY what was tested — no more, no less. Cherry-pick from the tag, not the feature branch. The tag is the checkpoint.

## The Fork Pattern (PAI Contribution)

PAI development happens on private trunks entangled with personal data. The contrib branch is the sanitization gate:

```
upstream/main ← fork/contrib ← origin/contrib ← TAG ← origin/feature
   (target)      (PR source)     (staging)     (tested)  (development)
```

## 8 Mandatory Approval Gates

| Gate | What to Review | Who Approves |
|------|----------------|-------------|
| **1. File Inventory** | Is scope correct? Every file explicitly included or excluded. | Maintainer |
| **2. Test Results** | All tests pass on feature branch? | Automated + Human |
| **3. Pre-Release Checklist** | All boxes checked? No shortcuts. | Maintainer |
| **4. Tag Creation** | Ready to mark this as tested code? `git tag -a vX.Y.Z` | Maintainer |
| **5. Cherry-Pick Review** | Staged files match inventory? Only tagged files present? | Maintainer |
| **6. Sanitization** | No secrets, PII, personal paths (`/Users/*/`, API keys)? | Maintainer + Automated scan |
| **7. Push to Fork** | Ready to make this public? Last chance before code is visible. | Maintainer (explicit approval) |
| **8. Create PR** | Description accurate? Review findings included? Test evidence attached? | Maintainer |

**Never skip gates.** AI can assist at every step, but human approves before proceeding to the next gate.

## File Inventory

The file inventory IS the release specification. Create `CONTRIBUTION-REGISTRY.md`:

```markdown
## Included Files (cherry-pick these)

| File | Purpose | Status |
|------|---------|--------|
| Observability/docker-compose.yml | Stack orchestration | ✅ |
| hooks/ToolUseInstrumentation.hook.ts | Event emission | ✅ |
| ... | ... | ... |

## Excluded Files (never include)

| File | Reason |
|------|--------|
| .env | Contains API keys |
| settings.json | Personal configuration |
| MEMORY/ | Private session data |
| ... | ... |
```

## Sanitization Checklist

Before Gate 6 (Push to Fork), verify:

- [ ] No API keys, tokens, or secrets in any file
- [ ] No personal paths (`/Users/andreas/`, `/home/user/`)
- [ ] No Telegram IDs, email addresses, or phone numbers
- [ ] No private vault references
- [ ] No test fixtures with real captured data
- [ ] No `.env` files or credentials
- [ ] `git diff` between tag and contrib branch shows only inventory files
- [ ] `grep -r` for common secret patterns returns nothing

## PR Description Template

```markdown
## Summary
[What this contribution does — 1-3 sentences]

## Architecture
[Key architectural decisions and how they fit PAI patterns]

## What Was Built
- [Feature/component list]

## How It Was Built
- [Tooling: Maestro, SpecFlow, manual]
- [The 80/20 split: what was autonomous vs human]

## Review Findings
[Include findings from independent review if available]

## Test Evidence
- [Test count, acceptance levels]
- [What each test level proves]

## Incremental Review Path
[How to review this without reading every line — suggest review order by layer/component]

## Files
[Total files, organized by area]
```

## Battle-Tested Across

| Project | Files | Outcome |
|---------|-------|---------|
| Context Skill | 50 files | PR created, rejected by upstream |
| Jira Skill | 18 files | PR created, rejected by upstream |
| pai-knowledge Bundle | 63 files | PR created, rejected by upstream |
| Signal (upcoming) | ~102 files | In Contrib Prep |

The process scales. Signal is larger but the workflow is the same: tag → contrib → sanitize → fork → PR.

## Reference

- [SpecFirst RELEASE-FRAMEWORK.md](https://github.com/mellanon/pai-1.2/blob/feature/jira-analysis/.claude/skills/SpecFirst/templates/RELEASE-FRAMEWORK.md)
- [PAI Release Runbook](https://github.com/mellanon/PAI) (private, will be contributed)
