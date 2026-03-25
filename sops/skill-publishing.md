# SOP: Package Publishing

How to publish a skill, tool, agent, or prompt to the pai-collab registry so others can discover and install it via `pai-pkg`.

## Why This Exists

pai-collab hosts a `skills/REGISTRY.yaml` that `pai-pkg` clients fetch for package discovery. Publishing a skill means adding an entry to this file via PR. The maintainer reviews the skill's `pai-manifest.yaml` capabilities before merging — this is the trust gate.

## Pipeline

```
PREREQUISITES -> ENTRY -> PR -> REVIEW -> MERGE -> DISCOVERABLE
```

## Prerequisites

Before publishing, your skill or tool repo must have:

| Requirement | Why |
|-------------|-----|
| `pai-manifest.yaml` at repo root | Declares capabilities, author, dependencies |
| Public GitHub repo | pai-pkg clones via git — must be accessible |
| Working install | Someone should be able to `git clone` + `bun install` + use it |
| License file | Accepted: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause |

### pai-manifest.yaml minimum

```yaml
name: MySkill
version: 1.0.0
type: skill              # skill | tool | agent | prompt
tier: community

author:
  name: yourname
  github: your-github-handle

provides:
  skill:
    - trigger: "my skill trigger"

depends_on:
  tools:
    - name: bun
      version: ">=1.0.0"

capabilities:
  filesystem:
    read: []
    write: []
  network: []
  bash:
    allowed: false
  secrets: []
```

Declare **everything** the skill accesses. Undeclared capabilities are a trust violation — the maintainer will reject the PR.

## Steps

### 1. Fork pai-collab

```bash
gh repo fork mellanon/pai-collab --clone
cd pai-collab
```

### 2. Add your entry to skills/REGISTRY.yaml

Add your package under the appropriate section (`skills:`, `tools:`, `agents:`, or `prompts:`):

```yaml
- name: MySkill
  description: What it does (one line)
  author: your-github-handle
  source: https://github.com/you/pai-skill-myskill
  type: community
  status: shipped           # or "beta" for early releases
```

**Fields:**

| Field | Required | Values |
|-------|----------|--------|
| `name` | Yes | Must match `name` in your pai-manifest.yaml |
| `description` | Yes | One-line description |
| `author` | Yes | Your GitHub handle |
| `source` | Yes | GitHub repo URL (not raw file URL) |
| `type` | Yes | `community` for community-reviewed, `custom` for personal |
| `status` | Yes | `shipped`, `beta`, or `deprecated` |

### 3. Open a PR

```bash
git checkout -b add-myskill
git add skills/REGISTRY.yaml
git commit -m "Add MySkill to registry"
gh pr create --title "Publish MySkill to registry" --body "
## Skill Details
- **Name:** MySkill
- **Repo:** https://github.com/you/pai-skill-myskill
- **Type:** skill
- **Capabilities:** [list key capabilities]

## Checklist
- [ ] pai-manifest.yaml present and complete
- [ ] All capabilities honestly declared
- [ ] Repo is public
- [ ] License file present
"
```

### 4. Maintainer Review

The maintainer will:
1. Clone your repo and read `pai-manifest.yaml`
2. Check declared capabilities against actual code
3. Run `pai-pkg install <your-repo-url>` to test the install flow
4. Verify no secrets, personal paths, or undeclared network access
5. Merge or request changes

### 5. After Merge

Once merged, anyone with pai-collab as a source can discover your skill:

```bash
pai-pkg search myskill     # Finds it
pai-pkg install MySkill     # Installs from registry
```

## Version Management

Versions follow [semver](https://semver.org/) and are tracked in two places:

| Location | Field | Purpose |
|----------|-------|---------|
| `pai-manifest.yaml` | `version: "1.2.0"` | Canonical version — source of truth |
| `git tag` | `v1.2.0` | Installable snapshot — pai-pkg uses this for pinned installs |

### Convention

1. **Bump the version** in `pai-manifest.yaml` when you ship a meaningful change
2. **Tag the commit**: `git tag v1.2.0 && git push origin v1.2.0`
3. **Tag must match manifest**: the `v` prefix on the tag, the version string in the manifest — they must agree (tag `v1.2.0` ↔ manifest `version: 1.2.0`)

### When to bump

| Change | Bump | Example |
|--------|------|---------|
| Bug fix, typo, docs | Patch | `1.0.0` → `1.0.1` |
| New workflow, new capability, new CLI command | Minor | `1.0.0` → `1.1.0` |
| Breaking change to skill interface, renamed triggers, removed capabilities | Major | `1.0.0` → `2.0.0` |

### Registry version field

REGISTRY.yaml entries may include an optional `version` field to advertise the latest available version:

```yaml
- name: MySkill
  description: What it does
  author: your-github-handle
  source: https://github.com/you/pai-skill-myskill
  version: 1.2.0              # optional — latest published version
  type: community
  status: shipped
```

This is informational today. Future pai-pkg versions will use it for upgrade detection (`pai-pkg upgrade` compares installed version against registry version).

### Install behavior

| Command | What happens |
|---------|-------------|
| `pai-pkg install MySkill` | Clones default branch (latest) |
| `pai-pkg install MySkill@1.2.0` | (future) Clones and checks out `v1.2.0` tag |
| `pai-pkg upgrade MySkill` | (future) Pulls latest, compares versions, upgrades if newer |

## Trust Tier Assignment

Skills published through pai-collab get the **community** tier. This means:
- `pai-pkg` shows capability summary before install
- User must confirm before proceeding
- Capabilities are displayed so users can make an informed decision

The **official** tier is reserved for upstream PAI skills (Daniel Miessler's repo). The **custom** tier is for direct git URL installs from unknown sources — users see a risk warning.

## References

- [CONTRIBUTING.md](../CONTRIBUTING.md) — Publishing section with entry format
- [TRUST-MODEL.md](../TRUST-MODEL.md) — Trust zones and defense layers
- [pai-pkg README](https://github.com/mellanon/pai-pkg) — Package manager documentation
