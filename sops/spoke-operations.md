# SOP: Spoke Operations

How an operator sets up, maintains, and projects a spoke to a hive.

## Why This Exists

The spoke is the projection layer between an operator's local workspace and a shared hive (hub). Without it, the hub has no visibility into spoke state, and the spoke has no way to prove compliance. This SOP covers the CLI commands and workflow for operating a spoke.

## When to Use

- **Setting up a new spoke repo** — `hive-spoke init`
- **After making progress on work** — `hive-spoke status` to refresh the snapshot
- **Before submitting to the hub** — `hive-spoke validate` to pre-flight check compliance
- **Publishing state to the hub** — `hive-spoke publish` to project a status update

## Prerequisites

| Tool | Required For | Install |
|------|-------------|---------|
| `hive-spoke` | All spoke operations | [github.com/mellanon/hive-spoke](https://github.com/mellanon/hive-spoke) |
| `bun` | Runtime for hive-spoke | [bun.sh](https://bun.sh/) |
| `gh` (GitHub CLI) | Publishing spoke status to hub | [cli.github.com](https://cli.github.com/) |
| Ed25519 SSH key | Commit signing (Layer 1: Provable) | `ssh-keygen -t ed25519` |

Install hive-spoke:
```bash
git clone https://github.com/mellanon/hive-spoke.git
cd hive-spoke && bun install
# Run directly:
bun src/index.ts --help
# Or link globally:
bun link
```

## The Commands

### 1. Initialize a spoke

```bash
hive-spoke init --hub <org/repo>
```

Creates `.collab/` with three files:
- **manifest.yaml** — identity, license, hub target, security reflexes (human-maintained)
- **status.yaml** — point-in-time snapshot of repo state (auto-generated)
- **operator.yaml** — operator profile Tier 1 (public) + Tier 2 (hive-scoped)

The command auto-detects your git signing config and SSH key. Review and edit the generated files — especially `license`, `skills`, and `security.reflexes` in the manifest.

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--hub <org/repo>` | Target hive (required) | — |
| `--project <id>` | Project identifier | Current directory name |
| `--name <name>` | Display name | `git config user.name` |
| `--overwrite` | Replace existing .collab/ | false |

### 2. Generate status snapshot

```bash
hive-spoke status
```

Queries git state (branch, last commit, dirty, behind remote) and runs the test command from manifest.yaml. Writes the result to `.collab/status.yaml`.

Run this before publishing to ensure the hub gets a current snapshot.

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--phase <phase>` | Override lifecycle phase | Existing value or "build" |
| `--stdout` | Print to stdout instead of file | false |

### 3. Validate spoke compliance

```bash
hive-spoke validate
```

Pre-flight check before projecting to the hub. Validates all four compliance layers:

| Layer | What It Checks | How |
|-------|---------------|-----|
| **Layer 4: Structural** | `.collab/` files conform to schemas | Zod validation |
| **Layer 1: Provable** | Git signing configured | Reads git config |
| **Layer 3: Attested** | Security reflex claims in manifest | Reports manifest values |
| **Cross-file** | Handle, public key match across files | Compares manifest ↔ operator |

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--strict` | Fail on warnings | false |

**Exit codes:** 0 = pass, 1 = errors, 2 = warnings in strict mode.

### 4. Publish to hub (Phase 1B)

```bash
hive-spoke publish
```

Projects the spoke's current state to the hub:
1. Runs `status` to refresh the snapshot
2. Runs `validate` to pre-flight check
3. Creates or updates a PR to the hub with the spoke's `.collab/` files

This is how the hub learns about spoke state. The hub's CI gates validate the incoming PR.

## Workflow

### First-time setup (new spoke)

```bash
cd your-spoke-repo
hive-spoke init --hub mellanon/pai-collab
# Edit .collab/manifest.yaml — set license, skills, reflexes
# Edit .collab/operator.yaml — add identities, skills
hive-spoke validate
git add .collab/ && git commit -m "spoke: Initialize .collab/ for hub projection"
```

### Ongoing (after making progress)

```bash
hive-spoke status          # Refresh snapshot
hive-spoke validate        # Pre-flight check
hive-spoke publish         # Project to hub (Phase 1B)
```

### CI automation (GitHub Action)

A GitHub Action can run `hive-spoke status` + `hive-spoke validate` on every push. See the spoke repo template for the workflow file.

## Compliance Verification Model

The hub cannot reach into a spoke to inspect its setup. Instead, compliance is verified through four layers at the projection boundary. See [spoke-protocol.md](https://github.com/mellanon/the-hive/blob/main/protocols/spoke-protocol.md#spoke-compliance-verification) for the full model.

**Key principle:** Layer 1 (signing) is cryptographic proof. Layer 2 (detectable) catches liars — if the hub finds a secret that gitleaks should have caught, the spoke's `secretScanning: true` claim is falsified. Layer 3 (attested) is trust-but-verify. Layer 4 (structural) is schema conformance.

## Spec ↔ Implementation Feedback

hive-spoke implements the [spoke protocol](https://github.com/mellanon/the-hive/blob/main/protocols/spoke-protocol.md) from the-hive. The relationship flows both ways:

| Direction | How | Example |
|-----------|-----|---------|
| **Spec → Implementation** | Protocol defines schemas and CLI behavior | manifest.yaml schema in spoke-protocol.md → Zod schema in hive-spoke |
| **Implementation → Spec** | Dogfooding discovers spec issues, fed back as PRs | `building` vs `build` phase mismatch found during validation → spec clarified |

When hive-spoke discovers a spec gap or ambiguity, it's fixed in the-hive via PR and journaled at `projects/the-hive/JOURNAL.md` in pai-collab.

## Related SOPs

| SOP | Connection |
|-----|-----------|
| [Agent Onboarding](agent-onboarding.md) | Prerequisites (signing, gitleaks) are the same — spoke operations build on onboarding |
| [Contribution Preparation](contribution-protocol.md) | The publish command IS a contribution to the hub |
| [Inbound Contribution Processing](inbound-contribution-protocol.md) | Hub-side processing of incoming spoke PRs |

## Related Specs

| Document | Where |
|----------|-------|
| [Spoke Protocol](https://github.com/mellanon/the-hive/blob/main/protocols/spoke-protocol.md) | Spec: schemas, CLI commands, compliance verification |
| [Operator Identity](https://github.com/mellanon/the-hive/blob/main/protocols/operator-identity.md) | Spec: operator.yaml three-tier model |
| [Hive Protocol](https://github.com/mellanon/the-hive/blob/main/protocols/hive-protocol.md) | Spec: hub-side hive.yaml, spoke registration |
