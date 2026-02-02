# Council Debate: SpecFlow Bundle vs OpenSpec — Keep, Replace, or Complement?

**Council Members:** Architect (Serena), Engineer (Marcus), Researcher (Ava), Security (Rook)
**Rounds:** 3 (Positions → Responses → Synthesis)
**Date:** 2026-02-02

---

## Context

We're building a spec-driven development lifecycle for PAI. The question is how to handle the full lifecycle from greenfield build through release and evolution.

**The Current Stack:**
- **SpecFlow bundle** (jcfischer/specflow-bundle): 25 CLI commands, SQLite state, quality gates (≥80%), TDD enforcement, headless pipeline, contribution prep (5 gates), Doctorow Gate, interview system. Proven: Signal built with 18 features, 708 tests, ~24hrs. Claude-only.
- **OpenSpec v1.1.1** (Fission-AI/OpenSpec): 16 CLI commands, file-system state, delta specs (ADDED/MODIFIED/REMOVED), 23 AI tool integrations, "actions not phases" philosophy, config injection. 21.5K stars but single maintainer (bus factor=1). Just hit v1.0 Jan 26, 2026.
- **Maestro playbooks**: 9 playbooks exist but limitations (#231-235). Maintainer receptive but cautious.
- **SpecFirst skill** (PAI 2.3): 8-gate release framework, tag-before-contrib, CHANGELOG management. Not ported to SpecFlow.

**The v1.0→v1.1 Problem:** SpecFlow handles greenfield excellently but after v1.0 ships, there's no brownfield workflow for new features, iteration planning, CHANGELOG, or versioning. OpenSpec's delta spec format is purpose-built for this but has NO quality gates, NO headless mode, NO TDD enforcement, NO contribution prep.

**Four Options Debated:**
- A. Replace SpecFlow with OpenSpec
- B. Complement: SpecFlow for greenfield, OpenSpec for brownfield
- C. Adopt OpenSpec's ideas into SpecFlow
- D. Ignore OpenSpec, extend SpecFlow natively

---

## Round 1: Initial Positions

**Architect (Serena) — Option C:**
OpenSpec's 21.5K stars are a vanity metric masking critical systemic risk: single maintainer, bus factor=1. We've seen this pattern collapse before — left-pad, core-js, faker.js. OpenSpec solves a real problem SpecFlow doesn't: state evolution after v1.0. Delta specs (ADDED/MODIFIED/REMOVED) are architecturally sound for brownfield. But we don't need to import their implementation — we need to extract the pattern. Build delta-spec semantics as a SpecFlow extension. This gives us ownership of the critical path, proven quality gates + TDD enforcement, brownfield capability, and constitutional compliance. Don't outsource your core competency to fragile dependencies. Extract ideas, own infrastructure. Prototype delta-spec syntax within SpecFlow's existing SQLite state model — it's a data model evolution, not a replacement architecture.

**Engineer (Marcus) — Option C:**
OpenSpec's delta-spec concept solves a real problem but OpenSpec's architecture is fundamentally incompatible with SpecFlow's quality-first philosophy. No gates, no TDD enforcement, no headless mode. What to extract: delta detection logic (parse git diffs to classify ADDED/MODIFIED/REMOVED), brownfield workflow pattern ("actions not phases"), config injection strategy. What to reject: 23 tool integrations (context bloat), file-system state vs SQLite (need queryable history), lack of quality gates (non-negotiable), single maintainer dependency. Implementation path: Add `specflow brownfield` command that runs delta detection on git working tree, applies quality gates to MODIFIED files, uses existing SQLite state + contribution prep, maintains TDD enforcement.

**Researcher (Ava) — Option B:**
This is a classic "innovator's dilemma" pattern. OpenSpec has strong market validation (21.5K stars in <1 year, endorsed by Thoughtworks Tech Radar, Martin Fowler, GitHub, JetBrains, Red Hat — institutional legitimacy). SpecFlow has empirical execution proof (Signal: 18 features, 708 tests, 24 hours). Industry precedent: specialized tools beat general tools for greenfield; general tools dominate brownfield. Docker/Kubernetes coexisted. ESLint/Prettier complemented. pytest/nose served different needs. Bus factor risk (TabishB = 454/490 commits, 92.6% concentration) is real but mitigated by 21.5K community interest. Recommendation: Option B minimizes regret — SpecFlow retains proven greenfield velocity, OpenSpec addresses brownfield gap. Port quality gates to OpenSpec workflow as integration layer.

**Security (Rook) — Option D leaning C:**
SpecFlow security posture: SQLite state (contained, auditable), Doctorow Gate (pre-sanitization), 5-gate contribution prep (defense-in-depth), proven in production, Claude-only (single trust boundary). OpenSpec security concerns: bus factor=1 with 23 downstream integrations (supply chain nightmare), 10 skill files per AI tool = 230+ generated files (massive attack surface), config injection without validation gates, file-system state (harder to audit, easier to poison), no quality gates. Supply chain risk is unacceptable. Adopt brownfield patterns natively with SQLite state and sanitization. Reject multi-LLM integration model — maintain Claude-only trust boundary. Don't trade proven security architecture for capability we can build safely.

---

## Round 2: Responses & Challenges

**Architect (Serena):**
Challenges Ava: Martin Fowler's endorsement validates the problem space (brownfield spec generation), not this particular implementation. Thoughtworks publishes patterns, not maintenance guarantees. Ava's Docker/K8s analogy actually supports Option C — Kubernetes didn't depend on Docker, it abstracted container runtimes through CRI precisely to avoid single-vendor lock-in. We should do the same: extract the brownfield delta pattern, implement against our proven SQLite state layer, maintain interop boundaries. The question isn't "Is OpenSpec's vision good?" It's "Should we couple our architecture to its execution?" Vision yes. Coupling no.

**Engineer (Marcus):**
Challenges Ava: Docker/ESLint analogy fails because those are horizontal tools (container runtime, linting). OpenSpec is vertically identical to SpecFlow — both are spec-to-implementation orchestrators. Two competing engines = architectural duplication, not division of labor. Challenges "institutional legitimacy" — OpenSpec has ONE maintainer and zero Fortune 10 production evidence. That's hype, not legitimacy. Brownfield delta detection is 80% of OpenSpec's value. The other 20% (23-tool integrations) is bloat. Position stands: build `specflow brownfield`, extract delta pattern, own our destiny.

**Researcher (Ava):**
Challenges Serena/Marcus: You're conflating two distinct competencies — brownfield migration tooling vs spec governance at scale. SpecFlow excels at workflow orchestration (current state → ideal state). OpenSpec solves institutional adoption (getting 47 teams to agree on one standard). These aren't substitutes — they're different layers. Counter-proposal to C: Build `specflow brownfield` as Option C suggests, BUT output to OpenSpec format as interchange layer. Gives delta-detection ownership + standards compliance. Challenges Rook: Supply chain analysis correct on risk but incomplete on mitigation. Solution isn't rejection — it's strategic forking + automated upstream tracking. Revised position: Option B+ — Complement with controlled fork strategy.

**Security (Rook):**
To Ava: Institutional legitimacy means nothing if the institution is one person with no succession plan. Your precedent examples (W3C, IETF) have governance, not a single point of failure. We're not rejecting the pattern — we're rejecting the dependency. To Marcus: Love the brownfield approach, but 2-3 day estimate assumes clean extraction without hidden dependencies. Have you audited OpenSpec's codebase? To Serena: Ownership principle is sound, but what's the migration path for those 230+ generated files? We all agree on delta-spec value. Question is: reverse-engineer wisdom or vendor-lock into single-maintainer risk? Extract patterns, own implementation.

---

## Round 3: Synthesis

**Architect (Serena) — B+ with exit criteria:**
Agreement: strategic value of delta-specs exists (all), SpecFlow has unique extraction capability. Tension: vertical duplication concern (if outputting OpenSpec format, maintaining two spec generators), extraction ROI (research bet, not proven). Recommendation: Build SpecFlow brownfield with OpenSpec-compatible output. Set 90-day validation gate — if extraction quality doesn't meet reliability thresholds (false positive rate, coverage accuracy), pivot. De-risks the bet while preserving greenfield strength.

**Engineer (Marcus) — Complement (B+):**
Agreement: brownfield retention (all lean toward keeping SpecFlow), OpenSpec's value as interchange format (Ava's B+ insight resonates), vertical duplication problem exists. Final recommendation: Keep SpecFlow for existing workflows. Build OpenSpec as canonical interchange format — not to replace internal flows, but to standardize export/import/federation across tools. Make OpenSpec the bridge, not the replacement.

**Researcher (Ava) — B+ hybrid:**
Agreement: delta-spec value (all), brownfield value (all), OpenSpec format useful for interchange (Serena, Ava, Rook). Disagreement: timeline (Serena/Marcus want foundation-first, Ava wants incremental). Final recommendation: Ship brownfield capability, emit OpenSpec delta-specs as we learn. Format and tooling co-evolve. Immediate value + future optionality.

**Security (Rook) — Controlled Complement (B+):**
Agreement: keep SpecFlow operational, adopt OpenSpec as interchange for cross-agent scenarios, create delta-spec abstraction layer, preserve vertical integration benefits while enabling horizontal standardization. Disagreement: extraction difficulty (Rook pessimistic, Marcus optimistic), timeline urgency. Final recommendation: Three-phase controlled fork: (1) OpenSpec for new cross-agent integrations only, (2) build delta-spec adapter layer for SpecFlow↔OpenSpec translation, (3) evaluate extraction ROI after 6 months — sunset only if adapters prove costly.

---

## Council Verdict

### Areas of Convergence (4/4 agreed)
- Delta-spec concept (ADDED/MODIFIED/REMOVED) has clear value for brownfield
- SpecFlow's quality gates, TDD, Doctorow Gate are non-negotiable — must be preserved
- OpenSpec as direct dependency is too risky (bus factor=1, supply chain)
- Build brownfield capability natively in SpecFlow

### Remaining Disagreements
- **Format output**: Ava wants OpenSpec-compatible interchange format; Marcus/Rook see this as unnecessary coupling to a fragile standard
- **Timeline**: Marcus says 2-3 days; Rook says audit the extraction difficulty first
- **Scope**: Ava frames this as "workflow tool vs platform" — others frame it as "own your infrastructure"

### Recommended Path: Option C+ (Build Natively, Emit Compatibly)
1. Build `specflow brownfield` with delta-spec semantics natively on SQLite state
2. Port SpecFirst's 8-gate release framework + CHANGELOG management into SpecFlow
3. Optionally emit OpenSpec-compatible format as interchange — but don't depend on it
4. Set 90-day review gate to assess whether interchange format adds value
5. Maintain Claude-only trust boundary; reject 23-tool integration bloat

The council shifted from a 3-way split (C/C/B/D) to near-unanimous C+ — build the brownfield idea natively, keep the door open to interop, but own the implementation.
