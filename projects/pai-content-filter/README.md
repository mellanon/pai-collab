# pai-content-filter

Inbound content security for PAI cross-project collaboration.

**Source:** [github.com/jcfischer/pai-content-filter](https://github.com/jcfischer/pai-content-filter)

## What It Does

Defense-in-depth security for when PAI agents consume shared repository content (Blackboard pattern). Three layers:

1. **Layer 1 — Content Filter**: Deterministic pattern matching (28 regex patterns), Zod schema validation, encoding detection (base64, unicode, hex, URL-encoded, HTML entities)
2. **Layer 2 — Architectural Isolation**: CaMeL-inspired dual-context. Quarantined agent has read-only MCP access. Output is immutable TypedReferences with provenance metadata.
3. **Layer 3 — Audit + Override**: Append-only JSONL audit trail. Human override requires reason. Every decision logged.

## Stats

- 5 features, all complete
- 275 tests across 9 test files
- 9 source modules + 1 PreToolUse hook
- 28 detection patterns + 6 encoding rules
- 100% detection rate on adversarial canary suite
- 0% false positive rate on benign content
- Zero dependencies beyond Zod

## Relationship to pai-secret-scanning

Together these form the complete security gate:
- **pai-secret-scanning** (outbound) — prevents secrets from leaking into shared repos
- **pai-content-filter** (inbound) — prevents malicious content from compromising agents reading shared repos

## Research Basis

- [CaMeL: Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813) (DeepMind, 2025)
- [Moltbook evidence](https://www.moltbook.com) — 151k+ agents, real-world injection failures
