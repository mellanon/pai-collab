# pai-collab — Status

A living snapshot of what's happening across the blackboard. Updated whenever project status changes, issues are created or closed, or contributors are promoted.

**Last updated:** 2026-01-31

---

## Projects

| Project | Maintainer | Status | Open Issues | Key Issue |
|---------|-----------|--------|-------------|-----------|
| [signal](projects/signal/) | @mellanon | contrib-prep | 5 | #1 Contrib prep, #2 Review, #3 Submit PR |
| [pai-secret-scanning](projects/pai-secret-scanning/) | @jcfischer | shipped | 1 | #13 CI gate investigation |
| [specflow-lifecycle](projects/specflow-lifecycle/) | @mellanon | building | 4 | #4 Align with @jcfischer, #5–#8 Playbooks |
| [skill-enforcer](projects/skill-enforcer/) | @jcfischer | shipped | 0 | — |

## Governance

Open issues that affect the repo as a whole — policy, trust model, SOPs, and process.

| # | Issue | Priority | Labels |
|---|-------|----------|--------|
| 27 | Create STATUS.md — living index | P1-high | governance |
| 28 | SOP: Agent onboarding — discovery protocol | P2-medium | governance |
| 24 | External review: Trust model feasibility | — | governance, security, good-first-contribution |
| 9 | Post on Discord introducing the blackboard | P1-high | collab-infra |
| 10 | Iteration planning — sprints vs journal-based | P3-low | collab-infra |

## Security & Trust

Issues related to the trust model, defense layers, and upstream PAI contributions.

| # | Issue | Priority | Blocked By |
|---|-------|----------|------------|
| 16 | LoadContext hook — inbound content scanning | P2-medium | Upstream PR to PAI |
| 17 | Review mode — tool restrictions for untrusted content | P2-medium | Upstream PR to PAI |
| 18 | Audit logging for external content loading | P3-low | Signal observability pipeline |

## Contribution Opportunities

Issues labelled `good-first-contribution` — accessible entry points that don't require deep context.

| # | Issue | What's Needed |
|---|-------|--------------|
| 24 | External review: Trust model and governance framework | Security expertise — review TRUST-MODEL.md and the six-layer defense model for feasibility |

## Contributors

| Contributor | Repo Zone | Project Roles | Agent |
|-------------|-----------|---------------|-------|
| @mellanon | maintainer | signal (maintainer), specflow-lifecycle (maintainer) | Luna |
| @jcfischer | trusted | pai-secret-scanning (maintainer), skill-enforcer (maintainer) | Ivy |

Trust zones defined in [CONTRIBUTORS.yaml](CONTRIBUTORS.yaml). Project roles in each `PROJECT.yaml`.

---

**How to use this file:** If you're new, read this first to understand what's in flight. Then check [CONTRIBUTING.md](CONTRIBUTING.md) → Start Here for the full onboarding path.
