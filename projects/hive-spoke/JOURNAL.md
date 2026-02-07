# hive-spoke — Journey Log

A structured, append-only log of what happened on this project. New entries go at the top. Each entry is a self-contained block — submit via PR, no merge conflicts.

**Maintainer:** @mellanon

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
