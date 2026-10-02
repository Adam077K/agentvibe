---
date: 2026-10-02
engine: builder
task: b1-12-tests-r4
branch: build/b1-12-tests-r4
base: ee19236
qa_verdict: PENDING
tier: full
---
Added `kernel/internal/outbox/outbox_r4_donetest_test.go` (6 tests) and registered it in `build/done-tests/B0-17b.yml`; rounds 1-3 unchanged. Corrected the ruling-B quote in `docs/vision-v3/_process/FOUNDER-RULINGS-2026-10-02-outbox.md`: "Make that the UncertainDeadline default" was the orchestrator's, not the founder's; the ruling covers hung calls only. No implementation code touched.
FAIL on ee19236, by design: SilentPastFifteenMinutesIsNeverResent (times out after 20m; worker dies) and NonPositiveLagUsesTheDefault/declared_0s.
Mutants in `/tmp/claude-501/b112mut-r4`, on a base with three controls (hung timeout -> Human, dead hung attempt -> Human, lag > 0) that turns every package test green: zero lag, negative lag, uncertain-extends-window, lagFrom=began, hung state guard, markSent guard all killed, each by exactly one test. Fold sent guard alone NOT killed: unreachable through the API (markSent checks the same condition under the journal lock); killed together with markSent's.
Not addressed: review LOW (lag on the wall clock). Race detector: 0 races on rounds 3-4.
`node build/check-done-tests.mjs` exit 0; `npm run check:citations-exist` exit 0 (no findings, strict, existence only).
