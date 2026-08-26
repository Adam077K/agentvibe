---
date: 2026-08-26
role: builder
task: memory-budget-volume-types
qa_verdict: PASS
tier: full
engines: [builder]
claims_touched: []
---

# `existsSync` answers "is something there", not "can I read it"

**The defect, measured before it was fixed.** Every memory file was guarded by `existsSync` and then
handed to `readFileSync`. At `.claude/memory/DECISIONS.md`: a **directory** gave `EISDIR` with a raw
stack trace; a **FIFO** gave **exit 142 at 8,016 ms** — it never returned, and was killed by an
8-second cap. `check:memory` is a blocking CI step, where a crash names itself and a hang reads as a
slow build. Six read sites, not three: the `--json` branch re-read all three paths with the same
unguarded pair, so passing `--json` reached a second copy of the same defect.

**Only the scan question exists here, so one predicate answers it.** This file creates nothing — no
`writeFileSync`, `appendFileSync`, `mkdirSync`, `renameSync`, `rmSync`, `unlinkSync` or `openSync` —
so "is this path free to create?", the question that must *not* resolve symlinks, is never asked.
The question it does ask must resolve: a memory file reached through a symlink is content that must
still be measured. Hence `statSync`, pinned by two controls that go red under `lstatSync` and by
nothing else.

**Nothing is newly skipped, and one row narrows.** The dangling-symlink path is deliberately
untouched — `existsSync` follows links, so a broken one is already "absent" and already refused by
name; a control asserts it still reports `missing-file` rather than the new refusal. The single
behaviour change beyond crash-to-refusal: a symlink to a character device (`/dev/null`) previously
read as `0 bytes` and **passed**, and is now refused. Measured on both versions.

**Verification.** `18 tests · 18 pass · 0 fail` (was 11 before the 7 new cases). Against the original
script the new cases are `13 pass · 5 fail`, three of them the FIFO cap firing at ~8,010 ms; under
`lstatSync` exactly the two symlink controls go red. `npm run check`: `Tally: 43 of 43 passed`.

**Carried in with the fix:** the test helper's `JSON.parse(r.out)` had no emptiness check — the
third instance in this repo of the shape found on #99, and it belongs with the change that drives
crash paths through it.

**Residual, flagged not fixed (founder/lead decision).** A TOCTOU window remains between `statSync`
and `readFileSync`: an entry swapped in that window still reaches the read. For a checker the
handle-based read is not worth the complexity, and the same window exists in
`scripts/evict-memory.mjs`. Raised rather than decided.
