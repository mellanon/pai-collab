# pai-pkg — Journal

## 2026-03-18 — Security Architecture Design + Research Paper

**Author:** @mellanon (Luna)
**Phase:** Specify
**Status:** Design deepened — security architecture, research paper, and implementation plan published

### What happened

- Conducted extensive research (14 parallel research agents) on AI skill package management landscape: npm supply chain attacks (454K+ malicious packages in 2025), MCP Registry, AAIF, Sigstore/TUF/in-toto, Chrome/VS Code/WordPress trust models, Android/iOS capability models, prompt injection through plugin systems
- Convened 4-agent council debate (Package Ecosystem Architect, Security Researcher, Developer Experience Designer, Open Source Governance Expert) across 3 rounds
- Ran 8-agent red team analysis from 32 perspectives
- Analyzed three external security sources: "Gas Town Needs a Citadel" (agent control architecture), "The Anthropic Attack" (trust stack framework, drip-feed attack patterns), AvaKill (YAML-based tool-call interception)
- Synthesized into RESEARCH.md (5,390 words) — comprehensive research paper with threat model, council findings, red team analysis, implementation strategy, and standards alignment
- Conducted first-principles analysis of the runtime enforcement problem — discovered that PAI's existing SecurityValidator.hook.ts IS the tool-call firewall, it just needs skill-scoped policy extension
- Published SECURITY-ARCHITECTURE.md — concrete design for extending the existing enforcement infrastructure with skill-scoped policies, behavioral anomaly detection (drip-feed attack mitigation), and integration of pai-collab spoke repos
- Mapped Arbor's 5-layer authorization kernel patterns to Claude Code hook equivalents

### What emerged

- **The enforcement gap is smaller than assumed.** SecurityValidator.hook.ts already implements deterministic YAML-based tool-call interception in <10ms. The "missing firewall" is actually a schema extension to patterns.yaml, not a new system
- **Skill-scoped policies don't require skill attribution.** The hook doesn't need to know which skill caused a tool call — policies are the UNION of all installed skills. `pai-pkg install` adds capabilities; `pai-pkg disable` removes them
- **Council consensus shifted from 3 tiers to 2.** The ecosystem (~40 built-in + ~7 custom skills) is too small for Official/Community/Universe. Two tiers (Built-in + Community) with PR-based curation
- **Council consensus shifted from npm to git.** Skills are repos with natural language + code, not library packages. Git-based transport with flat tarballs for Phase 1
- **Composition trust is the critical weakness.** When Skill A (network access) and Skill B (file write) are both installed, the combined capability surface enables download-and-write — neither declared alone. Capability budget warnings needed
- **Drip-feed attacks require observability, not just enforcement.** Individual operations look benign; the attack is only visible as a sequence. A PostToolUse SessionAudit hook with behavioral anomaly rules addresses this
- **The pai-collab spoke repos (pai-secret-scanning, pai-content-filter, skill-enforcer) should become `--system` packages** — infrastructure components installed and updated through pai-pkg but with elevated trust and protection against casual disabling
- **Arbor patterns map cleanly.** The resource URI scheme (`arbor://fs/read/{path}`) maps 1:1 to Claude Code tools. The capability-based authorization model translates to YAML policy sections. The trust-capability sync maps to install-time policy generation

### Follow-up

- Coordinate with @jcfischer on packaging pai-secret-scanning, pai-content-filter, and skill-enforcer as `--system` packages
- Prototype patterns.yaml v2.0 schema with skill sections
- Extend SecurityValidator.hook.ts with skill policy evaluation (Phase 1)
- Build SessionAudit.hook.ts for behavioral anomaly detection (Phase 2)
- Update PROJECT.yaml status to `building` when Phase 1 implementation begins
- Request security review of SECURITY-ARCHITECTURE.md from @Steffen025

## 2026-02-21 — Project Registered

**Author:** @mellanon (Luna)
**Phase:** Specify
**Status:** Proposed — design spec published, seeking community feedback

### What happened

- Created design specification for PAI skill package management system
- Published repository at [mellanon/pai-pkg](https://github.com/mellanon/pai-pkg) with README.md and DESIGN.md
- Registered as a spoke project on pai-collab blackboard
- Design draws from research of SkillSeal (mcyork), SpecFlow (jcfischer), Debian apt/dpkg, Homebrew, npm/PyPI security incidents, MCP Registry, and Anthropic Agent Skills standard

### What emerged

- Three-layer architecture: npm transport + SkillSeal signing + Debian-style governance
- The SkillSeal project by Ian McCutcheon (mcyork) already solves the cryptographic signing problem — integration rather than reinvention is the right approach
- SpecFlow's pai-manifest.yaml pattern for capability declarations is directly applicable
- npm as transport gives versioning, deps, and registry for free but needs trust layered on top
- Community iteration on the design spec is the immediate next step before any implementation

### Follow-up

- Seek feedback from @jcfischer and @mcyork on the design
- Iterate on DESIGN.md based on community input
- Align trust model with the-hive spoke protocol where applicable
