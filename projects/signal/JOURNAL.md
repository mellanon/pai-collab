# Signal — Journey Log

Maintainer: @mellanon

---

## Jan 22–31, 2026 — From Spec to Working Prototype

### The Build (Jan 22–24)

Shared the Signal spec as a [gist](https://gist.github.com/mellanon/62a12ddef60ca7ff74331c2983fb43c7) on the Discord PAI Signal Requirements thread. Got feedback from Zeb, Rudy, Jens, and Steffen on architecture decisions (OTLP transport, naming conventions, storage choices).

Set up two parallel Maestro agents running the SpecFlow Development playbook. Over ~24 hours of autonomous execution, they produced 18 features across 255 commits and ~25,500 lines of code. The process was robust but felt slow towards the end — took the reins manually to get the data structures right after Maestro handed over.

### Human Hardening (Jan 25–26)

The "last mile" — 11 commits, ~9,800 lines of work that Maestro couldn't do:

- **Acceptance fixes**: OTLP HTTP/gRPC mismatch (the spec said HTTP, the OTel SDK defaulted to gRPC), Grafana datasource URLs pointing to wrong ports, test isolation issues where parallel tests shared state
- **Infrastructure gaps**: Vector health check ports not exposed, agent file inclusion missing from Docker context, log rotation schedules needed for JSONL files
- **Emergent features**: Session-scoped tracing (correlate all events within a session), multi-tool span nesting (see which tools an agent called and in what order), visual hierarchy logging with emoji depth markers, Grafana dashboards that actually tell a story

This is the pattern: Maestro builds what the spec says. You discover what the spec missed by running the system. The 80/20 split (80% machine, 20% human) held true — but the human 20% is the hardest 20%.

### Testing (Jan 26–27)

708 tests passing across four acceptance levels:
- **L1**: Unit tests — individual functions
- **L2**: Integration tests — components working together
- **L3**: System tests — Docker stack end-to-end
- **L4**: Acceptance tests — does it actually answer the questions you'd ask?

### Community Cross-Pollination (Jan 22–31)

The Discord thread produced more than just Signal feedback:
- **Jens** built the [SkillEnforcer hook](https://github.com/jcfischer/pai-skill-enforcer) inspired by the spec discussion
- **Andreas** filed an issue on SkillEnforcer, contributed a PR to [SpecFlow bundle](https://github.com/jcfischer/specflow-bundle/pull/1)
- **Rudy** connected Signal concepts to his Argus observability work
- **Steffen** provided feedback on Maestro playbook sharing
- **Zeb** gave architecture feedback on OTLP transport decisions

Each contribution was independent, asynchronous, and visible to everyone. This is the blackboard pattern in practice — before we had a blackboard.

### Where Things Stand (Jan 31)

The code works. Tests pass. Docker stack runs end-to-end. But 25,000 lines of AI-generated code needs independent review before it's merge-ready. The immediate next steps:

- **Contrib Prep**: Extract ~102 Signal files from private trunk (the branch has 304 files changed, most are personal config/Maestro state). Sanitize for PII, secrets, personal paths.
- **Community Review**: Push clean branch, invite independent review through the blackboard.
- **PR Packaging**: Structure the PR so the upstream maintainer can evaluate without reading 25k lines.

---

## What's Emerging

- The **HITL speed problem**: The bottleneck isn't the agents — it's the human's ability to review, decide, and direct at the speed agents produce. Tools like [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) and Maestro are on the same trajectory: making the human effective as a 10x operator.
- The **review pipeline** needs layering: automated gates (BugBot, Greptile) → Maestro PR_Review playbook → community agent review → human sign-off. No single layer is enough.
- Signal is the **first project through the blackboard** — it's testing the entire collaboration pipeline. What works here becomes the template for everything else.

---

## What Would Be Helpful

- **Reviewers**: Anyone willing to do an independent review of the Signal code once the clean branch is up. Architecture fit, code quality, security, test quality.
- **Docker feedback**: Is the VictoriaMetrics stack reasonable for a local dev tool? Resource footprint concerns?
- **SpecFlow lifecycle feedback**: The four missing playbooks (Contrib Prep, Review, Release, Open Spec) are designed from Signal's experience. Does the pipeline make sense?
