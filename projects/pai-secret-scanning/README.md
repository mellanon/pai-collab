# pai-secret-scanning

Automated secret detection for PAI private instances. Prevents API keys, credentials, personal paths, and environment variables from leaking into shared repositories.

**Maintainer:** @jcfischer
**Source:** [jcfischer/pai-secret-scanning](https://github.com/jcfischer/pai-secret-scanning)
**Status:** Shipped

---

## What It Does

- 8 custom gitleaks rules targeting PAI-specific secrets (Anthropic, OpenAI, ElevenLabs, Telegram, personal paths, .env files)
- Global pre-commit hook via `gitleaks protect --staged` — catches secrets at commit time
- GitHub Actions CI gate — catches anything the pre-commit hook missed
- 10-test validation suite

## Why It Matters

PAI private instances are entangled with personal data. Every operator's `$PAI_HOME` contains API keys, voice credentials, personal context, and configuration that must never reach a shared repository. Secret scanning is the automated first line of defense — the gate that makes cross-operator collaboration possible.

Without it, every contribution to the shared blackboard is a potential exposure event.

---

## Role in the Trust Model

pai-collab's [Trust Model](../../TRUST-MODEL.md) identifies three threat vectors for multi-agent collaboration:

| Threat Vector | What It Is | pai-secret-scanning's Role |
|---------------|-----------|---------------------------|
| **1. Outbound: Secrets leaving** | API keys, credentials, personal paths leaking into shared repos | **Primary defense** — Layer 1 (pre-commit) and Layer 2 (CI gate) |
| **2. Inbound: Prompt injection** | Malicious instructions hidden in markdown loaded as agent context | Not addressed — see LoadContext scanning |
| **3. Cross-agent manipulation** | Exploiting trust between agents reviewing each other's work | Not addressed — see trust zones and review mode |

pai-secret-scanning fully solves threat vector 1. Threat vectors 2 and 3 require different defenses at different layers — content scanning before context loading, tool restrictions during review, and trust zone enforcement.

### Defense-in-Depth: The Six Layers

```
Layer 1: Pre-commit scanning        ← pai-secret-scanning (contributor's machine)
Layer 2: CI gate                     ← pai-secret-scanning (repository level)
Layer 3: Fork and pull request       ← GitHub process
Layer 4: Content trust boundary      ← LoadContext hook scanning (planned)
Layer 5: Tool restrictions           ← Review mode (planned)
Layer 6: Audit trail                 ← Signal observability (planned)
```

Layers 1 and 2 are the outbound defense — they prevent secrets from leaving. Layers 4–6 are the inbound defense — they prevent malicious content from entering agent context and causing harm. Layer 3 (fork+PR) is the structural boundary between the two.

---

## Where It Fits in the Lifecycle

pai-secret-scanning is collaboration infrastructure, not just a tool. It operates at the Contrib Prep phase of the lifecycle — the prerequisite before human sanitization review begins.

```
SPECIFY → BUILD → HARDEN → CONTRIB PREP → REVIEW → RELEASE → EVOLVE
                              ↑
                    pai-secret-scanning:
                    • Pre-commit hook catches secrets at commit time
                    • CI gate catches anything the hook missed
                    • Must pass BEFORE human sanitization review
```

Referenced in:
- [Contribution Protocol SOP](../../sops/contribution-protocol.md) — step 2 (Sanitize)
- [TRUST-MODEL.md](../../TRUST-MODEL.md) — Defense Layers 1 and 2

---

## Current State

| Capability | Status |
|-----------|--------|
| Pre-commit hook (contributor machines) | ✅ Shipped — gitleaks with 8 PAI-specific rules |
| GitHub Actions CI gate (contributor repos) | ✅ Shipped — runs on every PR |
| CI gate on pai-collab itself | ✅ Shipped — `.github/workflows/secret-scan.yml` with PAI-specific `.gitleaks.toml` |
| Integration with LoadContext scanning | 🏗️ Planned — scanning patterns could be shared between outbound and inbound detection |

### What "Done" Looks Like

- [ ] Every pai-collab contributor has pre-commit hooks installed
- [x] pai-collab itself runs pai-secret-scanning as a CI gate on every PR
- [ ] Scanning patterns are reusable by the inbound content trust boundary (Layer 4)
- [ ] Zero secret leaks across all pai-collab contributions

---

## How to Install

See the [pai-secret-scanning repository](https://github.com/jcfischer/pai-secret-scanning) for installation instructions. The one-command installer sets up the global pre-commit hook.

---

## Origin

Built as Phase 1 from the [pai-collab council recommendation](https://github.com/jcfischer/kai-improvement-roadmap/blob/main/analysis/pai-collab-council-recommendation.md) — automated secret scanning was the unanimous non-negotiable gate before any cross-project integration.

First external contribution to pai-collab — registered via [PR #12](https://github.com/mellanon/pai-collab/pull/12) by @jcfischer.

---

## Project Files

| File | Purpose |
|------|---------|
| [PROJECT.yaml](PROJECT.yaml) | Source pointers |
| [JOURNAL.md](JOURNAL.md) | Journey log |
