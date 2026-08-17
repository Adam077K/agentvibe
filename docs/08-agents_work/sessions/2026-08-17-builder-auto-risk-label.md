---
date: 2026-08-17
role: builder
task: auto-risk-label
tier: irreversible
qa_verdict: PASS
---
Closed issue #85. Design B chosen: the gate reads the classifier directly; the `risk:*` label is now display-only (cosmetic, nothing reads it). **Reasoning:** the label was a second statement of a fact `classifier.js` already owns, living in GitHub metadata where it drifts silently — PR #78 proved this when two `run:` steps raised the floor from `full` to `irreversible` mid-review and the label became wrong. Design A (auto-apply the label) still keeps the label as gating logic with the same drift risk. Design B eliminates the second implementation entirely.
New script `scripts/check-tier-gate.mjs` is the single implementation of "floor=irreversible → session-file tier check." Tested by `scripts/check-tier-gate.test.mjs` (17 tests, 0 fail). The four "CANNOT LOWER TIER" tests run first and prove the safety property: floor=irreversible + tier:lite session → BLOCKED; floor=irreversible + no sessions → BLOCKED; floor=irreversible + missing session file → BLOCKED. Nothing the caller passes can lower the gate below the classifier floor.
`qa-lead-pass.yml` "Tier floor" step: added `id: classify`, emits `floor=$FLOOR` to GITHUB_OUTPUT, removed `HAS_LABEL` check. "Enforce tier" step rewritten to read `${{ steps.classify.outputs.floor }}` and call `node scripts/check-tier-gate.mjs` — no label read anywhere. `ci.yml` gets a "Tier gate" step running `npm run test:tier-gate`. The step is explicitly wired (not relying on `npm run check` chain). **Verified:** `npm run test:tier-gate` exits 0 (17/17 pass); `npm run check` exits 0; `ledger verify` → 0 block.
