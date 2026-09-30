---
date: 2026-10-01
role: builder
task: b0-16-wire
qa_verdict: PENDING
tier: irreversible
---
Wires B0-16's kernel check into the suite and CI, split from `build/b0-16` (lite) because the workflow and `check-suite.js` are irreversible tier. `check:kernel` = `GOCACHE=${TMPDIR:-/tmp}/go-build go -C kernel test -count=1 ./...`. Without the GOCACHE prefix it exits 1 under the armed sandbox (`~/Library/Caches/go-build` not writable), which would have put a `check:mc`-class red step into `npm run check`. Added as the last STEP; `ci.yml` gains `actions/setup-go@v5` (go 1.25) and a guarded `Kernel boundary` step.
Knock-ons, all forced by existing guards: `check-suite.test.mjs` pinned 3 setup steps, re-decided as 4 (setup-go carries no `if:`, same reasoning as the other three); 18 figure sites in `docs/STATUS.md`, `CLAUDE.md` and `ci.yml` (48→49 suite, 49→50 run steps, 3→4 setup).
Verified: `test:check-suite` 112/0, `check:figures`, `test:figures`, `check:ci-chains`, `check:registration`, `check:citations-exist` all exit 0; full `npm run check` with the sandbox armed → `Tally: 49 of 49 passed · 0 failed · 336.4s`, exit 0. Open: the irreversible tier needs 2-of-3 multi-judge and founder sign-off. `setup-go` has not yet run on a runner.
