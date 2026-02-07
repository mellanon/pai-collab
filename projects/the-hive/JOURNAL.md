# The Hive — Journey Log

A structured, append-only log of what happened on this project. New entries go at the top. Each entry is a self-contained block — submit via PR, no merge conflicts.

**Maintainer:** @mellanon

---

## 2026-02-07 — Security by design: Arbor-informed protocol updates

**Author:** @mellanon (agent: Luna)
**Phase:** Build
**Status:** Four protocol specs updated with security-by-design patterns informed by Arbor architecture study.

### What Happened
- Studied [Arbor](https://github.com/trust-arbor/arbor) security architecture (Ed25519 identity, capability-based access, taint tracking, reflex system) as reference for protocol design
- Updated `trust-protocol.md`: unified reflex pipeline with 4 boundary reflexes (pre-commit, CI gate, acquisition, context load), commit signing as trust foundation, content provenance labels (operator/agent/external/mixed), Arbor prior art
- Updated `hive-protocol.md`: `.hive/allowed-signers` trust anchor pattern, `trust.signing` in hive.yaml schema, CI-as-state-machine enforcement model with 4 ordered gates, state tracking via git artifacts
- Updated `operator-identity.md`: SSH commit signing as recommended default provider, signing key in Tier 1 profile schema, key lifecycle (rotation, revocation), Arbor in prior art
- Updated `spoke-protocol.md`: signed-by-default design principle, `identity` section in manifest.yaml, commit signing verification command

### What Emerged
- Git's native SSH signing (2.34+) eliminates the need for custom key management infrastructure — operators already have Ed25519 SSH keys, 3 git config commands enables signing, `allowed-signers` is the trust anchor
- Arbor patterns adapted for git: in-process reflexes become boundary-crossing reflexes, capability tokens become git-native signing verification, taint levels become content provenance commit trailers
- CI-as-state-machine is the bridge between "SOPs as best-effort docs" and "SOPs as enforced processes" — enforcement on the receiving end means zero contributor-side tooling beyond git + SSH key
- The reflex pipeline is the architectural connector between the six defense layers (previously listed independently) — every hive operation now maps to specific reflexes that fire at specific boundaries

---

## 2026-02-06 — Project Registered on pai-collab

**Author:** @mellanon (agent: Luna)
**Phase:** Build
**Status:** The Hive registered as a project on the shared blackboard. Repository made public.
**Issues:** #92

### What Happened
- Registered The Hive as a project on pai-collab — dogfooding the contribution protocol by coordinating protocol development through the hive itself
- Repository [mellanon/the-hive](https://github.com/mellanon/the-hive) made public under CC-BY-4.0 license
- All 7 protocol specifications are at Draft status with all open design questions resolved
- Architecture document, implementation plan (7 phases), and operator experience scenarios complete
- Existing implementations mapped: pai-collab (hub), ivy-blackboard (local state), ivy-heartbeat (dispatch), pai-secret-scanning (outbound security), pai-content-filter (inbound security)

### What Emerged
- The Hive is both a specification and a test of that specification — every contribution to the protocol goes through pai-collab (Hive Zero), validating the collaboration model it describes
- The protocol stack is ready for Phase 1 implementation: spoke contract (`blackboard --level spoke` commands), which connects the shipped local layer to the operational hub layer

---
