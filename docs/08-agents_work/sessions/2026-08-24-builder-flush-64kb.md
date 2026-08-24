---
date: 2026-08-24
role: builder
task: flush-64kb
branch: fix/pr2-flush
tier: full
qa_verdict: NOT-RUN
gate_run: false
gate_blocked_by: "builder scope — no reviewer or QA-Lead ran; the lead routes review for this branch"
---

**Defect, measured.** `process.exit()` does not flush a queued stdout write. Stdout to a PIPE (how CI and any `| jq` run these) is async: a large `console.log` fills the 64KB buffer, queues the rest, and the exit tears the process down first. Payload cut at **exactly 65536 bytes with exit status 0** — truncated JSON reported as a clean run, inside the blocking `check:dispatch`. A file redirect is complete, which is why a spot-check missed it.
**Fix.** `process.exitCode` + natural exit in six scripts; report tails became if/else so control flow no longer relies on `process.exit()`. All exit codes verified unchanged.
**`fs.writeSync(1, …)` is NOT the fix** — `check-citations.mjs` already used it, and once anything touches `process.stdout` the fd is O_NONBLOCK and writeSync returns a **short count of 65536 without throwing**. That file emits **288,412 bytes today**: its hand-rolled fix was one `console.log` from failing silently.
**Regression test** `scripts/check-dispatch-flush.test.mjs` → `check:dispatch` (already blocking in CI). Spawns each checker with stdout a **pipe**, 800-site fixture, 106,448 / 139,271 bytes. **Before the fix it exits 1**, both `--json` cases at exactly 65536 bytes and unparseable; **after, 4/4.** Three anti-vacuity guards including a canary that fails if the old pattern stops truncating.
**Named non-findings.** The human path is labelled NOT a truncation test — unfixed it emitted all 263,096 bytes, since the defect needs one oversized write and that path emits ~800 small ones. `classify.mjs` already exits naturally. `ledger.mjs` shares the shape but `verify` does network I/O where a natural exit could hang — reported, not changed.
**Out of stated scope, isolated in commit `117604d`:** `CODEBASE-MAP.md` regenerated (`npm run build:map`, 3 mechanical lines). Unavoidable — the map derives from `package.json` scripts and `scripts/*.test.mjs`, and `check:map` blocks in CI. Revert that one commit to route it elsewhere.
**Verified:** 29/30 `npm run check` steps green, run individually. `check:mc` fails on missing `mission-control` deps — pre-existing, zero files touched there.
**Follow-up (comment only, no behaviour change).** `ledger.mjs`'s exit site now records why it keeps `process.exit()`: same shape, but measured under the buffer (`views` 20,802 is the largest · `verify` 20,774 · `lint` 131) and emitting many small writes, while `verify`'s network fetches mean a natural exit could hang `check:ledger` — a worse failure than the truncation. Carries the tripwire for the next reader: one oversized write, or a slow reader plus high volume, makes it live. Checked and under the line is not the same as cleared.
