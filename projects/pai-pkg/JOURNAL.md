# pai-pkg — Journal

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
