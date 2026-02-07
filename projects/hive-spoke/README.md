# hive-spoke

CLI tool for the spoke contract — the missing link between the local blackboard and the hub.

## What It Does

The spoke is how an operator projects their local state to a hive without coupling local internals to the network. `hive-spoke` implements the [spoke protocol](https://github.com/mellanon/the-hive/blob/main/protocols/spoke-protocol.md) as CLI commands that extend the `blackboard` binary.

## Commands

```bash
blackboard init --level spoke      # Scaffold .collab/ with manifest, status, operator templates
blackboard status --level spoke    # Generate status.yaml from local blackboard + git state
blackboard validate --level spoke  # Validate .collab/ files against Zod schemas
blackboard publish --level spoke   # Commit + push spoke status to hub
```

## The Spoke Contract

Three YAML files in `.collab/` at the repo root:

| File | Maintained By | Purpose |
|------|--------------|---------|
| `manifest.yaml` | Human (operator) | Stable identity: who, what hub, signing key, security reflexes |
| `status.yaml` | Auto-generated | Point-in-time snapshot: phase, tests, git state |
| `operator.yaml` | Human + CLI | Operator profile: handle, identities, skills (Tier 1 only) |

## Compliance Verification

The hub verifies spoke compliance through four layers at the projection boundary:

1. **Provable** — cryptographic evidence (signed commits verified against `allowed-signers`)
2. **Detectable** — negative signals (if CI catches what local reflexes should have blocked)
3. **Attested** — signed manifest claims about local security reflexes
4. **Structural** — schema conformance of `.collab/` files

See [spoke-protocol.md — Spoke Compliance Verification](https://github.com/mellanon/the-hive/blob/main/protocols/spoke-protocol.md#spoke-compliance-verification) for the full model.

## Tech Stack

- **TypeScript** + **Bun** (runtime + build)
- **Commander.js** (CLI framework, same as ivy-blackboard)
- **Zod** (schema validation)
- **YAML** (protocol data format)

## Status

**Proposed** — spec complete in the-hive, implementation starting.

## Dogfooding

The first spoke will be [the-hive](https://github.com/mellanon/the-hive) projecting to [pai-collab](https://github.com/mellanon/pai-collab) (Hive Zero).
