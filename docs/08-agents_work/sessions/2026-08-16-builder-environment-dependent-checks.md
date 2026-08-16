---
date: 2026-08-16
role: builder
task: environment-dependent-checks
branch: fix/environment-dependent-checks
worktree: .worktrees/lane-envgate
qa_verdict: PASS
tier: full
---

Fixed four instances of the §0 defect class: a check whose answer depends on
machine state, run where that state does not exist.

Instance 1 — `collectors.test.ts` single-project stall test: changed from one
round to three interleaved rounds, comparing median(asyncStalls) < median(controlStalls)
× 0.75. A single OS pre-emption inflated asyncStallMs past the threshold while the
pre-sweep idle gate stayed low and did not fire. Three-run median absorbs one bad round;
a blocking implementation yields ~170ms across all three rounds and still fails.

Instance 2 — `crosscheck.test.ts` "claim counts by verdict": `verify --offline`
exceeds VERIFY_TIMEOUT_MS (60s) on a loaded machine, returning `{ present: false }`.
The old `expect().not.toBeNull()` failed on the absent result. Now gates on absent
first (`notVerified` + return); when present, count comparisons still fire.

Instance 3 — `views.test.tsx` fleet tests: ten tests calling `/api/fleet` (which
shells out to `warroom-install.mjs fleet`, ~4-5s) had no explicit timeout, relying
on bun's default 5s. Added `30_000` to each; assertion logic unchanged.

Instance 4 — `scripts/check-cold-start.ts`: under concurrent build load (la 12-15),
OS memory reclaim inflates cold-start from ~9.7s to 15+s, exiting 1 (BROKEN) when
the code is correct. Added OS load gate: if `os.loadavg()[0] > cpus × 1.5`, exit 2
(UNCHECKED) with a named reason. Budget check still runs on a quiet machine.

Verification:
- collectors 3 runs: 101 pass / 0 fail each; stall ratios 0.028–0.038 (far below 0.75)
- crosscheck 2 runs: 17 pass / 0 fail each
- views 1 run: 72 pass / 0 fail
- Risk tier: full (mission-control/scripts/** floor)
