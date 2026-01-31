# SOP: Contribution Preparation

How to extract a contribution from a private PAI trunk for public collaboration.

## Why This Exists

PAI development happens on private trunks entangled with personal data — `.env` files, API keys, personal paths, vault references, real test fixtures. Before any code can be shared, it must be extracted cleanly through a sanitization gate.

## Pipeline

```
INVENTORY → SANITIZE → EXTRACT → VERIFY → TEST → STAGE → GATE → PUBLISH
```

## Three Concerns (Cleanly Separated)

| Phase | Question It Answers | SOP |
|-------|-------------------|-----|
| **Contrib Prep** | "Is this safe to share?" | This document |
| **Review** | "Is this good code?" | [review-format.md](review-format.md) |
| **Release** | "Is this ready to merge?" | [specfirst-release-process.md](specfirst-release-process.md) |

## Steps

### 1. Inventory

Create `CONTRIBUTION-REGISTRY.md` listing every file to include and exclude. **The inventory is law** — only listed files get extracted.

```markdown
## Included Files

| File | Purpose | Status |
|------|---------|--------|
| Observability/docker-compose.yml | Stack orchestration | ✅ |
| hooks/ToolUseInstrumentation.hook.ts | Event emission | ✅ |

## Excluded Files

| File | Reason |
|------|--------|
| .env | API keys |
| settings.json | Personal config |
| MEMORY/ | Private session data |
```

### 2. Sanitize

Scan for PII, secrets, personal paths. Both automated and manual:

- [ ] `grep -r "API_KEY\|SECRET\|TOKEN\|PASSWORD"` across inventory files
- [ ] `grep -r "/Users/" ` for personal paths
- [ ] Check for hardcoded Telegram IDs, email addresses, phone numbers
- [ ] Check test fixtures for real captured data
- [ ] Verify `.env` and credentials files are excluded

### 3. Extract

Use the **Tag-Before-Contrib** pattern:

```bash
# 1. Set up remotes
git remote add upstream git@github.com:danielmiessler/PAI.git
git remote add fork git@github.com:mellanon/PAI.git

# 2. Tag tested code on feature branch
git tag -a signal-v1.0.0 -m "Signal v1.0.0 — 708 tests passing, 18 features"

# 3. Create clean contrib branch from upstream
git checkout -b contrib/signal-v1.0.0 upstream/main

# 4. Cherry-pick ONLY inventory files from tag
git checkout signal-v1.0.0 -- Observability/ hooks/ToolUseInstrumentation.hook.ts ...
```

**Why cherry-pick from tag, not feature branch?** The tag is a checkpoint of tested code. Cherry-picking from the tag ensures the contrib branch contains exactly what was tested — no stale changes, no untested additions.

### 4. Verify

- [ ] `git diff upstream/main..contrib/signal-v1.0.0` — only inventory files present
- [ ] No excluded files in the diff
- [ ] No secrets in the diff (`grep -r` patterns)
- [ ] File count matches inventory

### 5. Test

- [ ] Run project tests on the clean contrib branch: `bun test`
- [ ] All tests pass in isolation (no dependency on private trunk files)
- [ ] Docker stack starts clean (if applicable)

### 6. Publish

- [ ] Push contrib branch to public fork: `git push fork contrib/signal-v1.0.0`
- [ ] Update `PROJECT.yaml` in blackboard with contrib branch link
- [ ] Update project `JOURNAL.md` with contrib prep completion

## Concrete Example: Signal

Signal has **304 files changed** on `feature/signal-agent-2`, but only **~102 are Signal files**. The rest is USER data, Maestro state, credentials, and config noise:

| Category | Files | Action |
|----------|-------|--------|
| Signal source code | ~102 | Include |
| Observability Docker config | ~15 | Include |
| Hook instrumentation | 3 | Include |
| USER/ personal data | ~80 | Exclude |
| .env, credentials | ~10 | Exclude |
| Maestro state files | ~50 | Exclude |
| Other config noise | ~44 | Exclude |

The file inventory makes this explicit. Without it, a naive `git push` would publish personal data.

## Battle-Tested Across

| Project | Files | Outcome |
|---------|-------|---------|
| Context Skill | 50 | Merged to upstream PAI |
| Jira Skill | 18 | Merged to upstream PAI |
| pai-knowledge Bundle | 63 | Merged to upstream PAI |
| Signal (upcoming) | ~102 | In Contrib Prep |

## References

- [SpecFirst Release Process](specfirst-release-process.md) — 8 mandatory approval gates
- [Review Format](review-format.md) — independent review after contrib prep
- [PAI Release Runbook](https://github.com/mellanon/PAI) — battle-tested workflow
