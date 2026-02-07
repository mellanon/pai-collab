# hive-spoke — Journey Log

A structured, append-only log of what happened on this project. New entries go at the top. Each entry is a self-contained block — submit via PR, no merge conflicts.

**Maintainer:** @mellanon

---

## 2026-02-07 — Phase 1C: Hub aggregation commands + handle detection fix

**Author:** @mellanon (agent: Luna)
**Phase:** Build
**Status:** All three phases shipped. Full spoke↔hub data flow operational.

### What Happened
- **Handle detection fix:** `init` command now queries `gh api user --jq .login` for GitHub handle instead of deriving from email (which gave `andreas.aastroem` instead of `mellanon`). Fallback chain: GitHub handle → git name → email prefix. Also auto-populates `operator.yaml` identities when GitHub handle detected.
- **Phase 1C — Hub aggregation:** Two new hub-side commands:
  - `pull` — Scans `projects/*/.collab/status.yaml` and produces a dashboard with phase, tests, maintainer, freshness/staleness flags
  - `verify` — Cross-references spoke signing keys against `.hive/allowed-signers` trust anchor
- **Dogfooded** both against pai-collab: pull shows 10 projects (0 with .collab/ yet), verify finds 1 signer in allowed-signers. Manual test with the-hive .collab/ data confirmed pull and verify work end-to-end.
- SOP updated with hub-side commands documentation

### What Emerged
- The full spoke data flow is now: `init` → `status` → `validate` → `publish` → (PR merge) → `pull` → `verify`
- Phase 1A (local CLI), 1B (hub projection), 1C (hub aggregation) are all shipped. The spoke protocol reference implementation is functionally complete.
- No spokes have published to the hub yet — the pull/verify commands will show data once the first `publish` PR is merged

Refs: hive-spoke commits b1afb12, 5aab353

---

## 2026-02-07 — License set to AGPL-3.0, GitHub repo created

**Author:** @mellanon (agent: Luna)
**Phase:** Specify
**Status:** License finalized, public repo created on GitHub.

### What Happened
- Changed license from MIT to AGPL-3.0 following two-layer licensing model analysis
- Created public GitHub repo: mellanon/hive-spoke (AGPL-3.0)
- AGPL-3.0 chosen to prevent cloud extraction without contribution (Elasticsearch precedent) while remaining OSI-approved
- The open CC-BY-4.0 spec in the-hive serves as the escape valve — anyone who can't use AGPL can implement from spec

### What Emerged
- The two-layer model (CC-BY-4.0 spec + AGPL-3.0 implementation) is the licensing pattern for all hive-* infrastructure repos
- This required updating the licensing policy in CONTRIBUTING.md and CLAUDE.md — AGPL-3.0 is now an accepted license for infrastructure tooling

Refs: #96

---

## 2026-02-07 — Project inception

**Author:** @mellanon (agent: Luna)
**Phase:** Specify
**Status:** Project registered on pai-collab blackboard. Spec complete in the-hive.

### What Happened
- Registered hive-spoke as a new project on the pai-collab blackboard
- Scope: CLI tool implementing the spoke protocol — `blackboard init/status/validate/publish --level spoke`
- Decision: new repository (mellanon/hive-spoke) rather than extending ivy-blackboard — SOPs need to reference it, the hive protocol stack needs to be aware of it as a registered project
- First dogfood target: the-hive repo projecting to pai-collab
- Tech stack: TypeScript + Bun + Commander.js + Zod (same as ivy-blackboard)
- Protocol spec is complete in the-hive: spoke-protocol.md (including four-layer compliance verification), operator-identity.md, IMPLEMENTATION.md Phase 1

### What Emerged
- The spoke is the highest-leverage build target — it connects the local blackboard (shipped) to the hub (operational). Everything else in the protocol stack depends on spokes existing.
- hive.yaml created for pai-collab, making it a proper hive per hive-protocol.md. This is a prerequisite for spoke projection.
- Tiered SOP loading designed and implemented — reduces onboarding friction for new operators arriving via spoke. The onboarding section in hive.yaml declares Foundation/First Contribution/Workflow tiers.

---
