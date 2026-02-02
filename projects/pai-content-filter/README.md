# pai-content-filter

Inbound content security for PAI cross-project collaboration.

**Source:** [github.com/jcfischer/pai-content-filter](https://github.com/jcfischer/pai-content-filter)

## What It Does

Defense-in-depth security for when PAI agents consume shared repository content (Blackboard pattern). Three layers:

1. **Layer 1 — Content Filter**: Deterministic pattern matching (28 regex patterns), Zod schema validation, encoding detection (base64, unicode, hex, URL-encoded, HTML entities)
2. **Layer 2 — Architectural Isolation**: Tool-restricted sandbox. Quarantined agent has read-only MCP access (no Bash, Write, WebFetch). Output is immutable TypedReferences with provenance metadata.
3. **Layer 3 — Audit + Override**: Append-only JSONL audit trail. Human override requires reason. Every decision logged.
4. **Layer 4 — Sandbox Enforcer**: PreToolUse hook intercepts acquisition commands (`git clone`, `curl -o`, `wget`) and redirects them to a sandbox directory. Ensures all external content lands in sandbox before scanning.

## Stats

- 6 features, all complete
- 380 tests across unit, integration, canary, and performance suites
- 11 source modules + 2 PreToolUse hooks (ContentFilter + SandboxEnforcer)
- 28 detection patterns + 6 encoding rules
- 100% detection rate on adversarial canary suite
- 0% false positive rate on benign content
- Zero dependencies beyond Zod

## Relationship to pai-secret-scanning

Together these form the complete security gate:
- **pai-secret-scanning** (outbound) — prevents secrets from leaking into shared repos
- **pai-content-filter** (inbound) — prevents malicious content from compromising agents reading shared repos

## Research Basis

- [CaMeL: Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813) (DeepMind, 2025) — architectural inspiration; this project implements a subset (see [source repo README](https://github.com/jcfischer/pai-content-filter#relationship-to-camel) for divergences)
- [Moltbook evidence](https://www.moltbook.com) — 151k+ agents, real-world injection failures
