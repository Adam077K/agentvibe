---
date: 2026-08-26
role: ceo
task: wave-1-honest-floor
qa_verdict: PASS
tier: irreversible
engines: [builder, reviewer]
claims_touched: []
---

# The floor was red for two days and hiding twelve checks

**Decision, and it is an exception — recorded so it is a choice rather than a drift.** This lands **without a
gate PASS**. The binding gate ran **five times** on this branch and BLOCKed every time; each block was a real
defect and each was fixed. It has never returned PASS here. The founder decided on 2026-08-26, presented with
three options and the weakness of this one stated in advance: **land now and run the gate against `main`
afterwards.** The named weakness stands — a post-hoc BLOCK means reverting something already merged, and this
wave's own thesis is that a check which runs after the fact is the one nobody acts on. It is the founder's
call, taken with that in front of them, because four finished PRs are queued behind this one and this is the
only branch that turns them green without bypassing a required check.

**What was wrong.** `main` had been red on CI since 2026-08-24 on a single test — and that failure was hiding
twelve more. `scripts/pre-tool-use.test.mjs` asserted a write under `$HOME/.claude/plans/` without creating
it: true on macOS because the harness made it, false on `ubuntu-latest`. **The hook was correct; the test read
the machine.** One level up, `ci.yml` ran 30 sequential steps in one job with **zero `if:` conditions**, so a
failure at step 18 skipped everything after it — measured across four consecutive runs, **12 check steps
skipped every time**, including `check:ledger`, `test:merge-gate`, `test:tier-gate` and `test:sandbox`. The
claim ledger's own enforcement had not executed in CI for two days. A prior session found this exact defect
inside `npm run check`, fixed it there, and recorded that *"CI was unaffected because it runs each script
individually."* Half true: CI runs each script as its own **step**, and the **job** still short-circuits.

**What landed.** A hermetic `$HOME` fixture that picks its base by **asking the hook** whether a candidate is
already an allowed root, rather than keeping a second copy of the hook's list — under an agent session
`os.tmpdir()` *is* one of those roots, so the obvious fix would have made three assertions pass for the wrong
reason. All 44 `run:` steps carry `if: ${{ !cancelled() }}`. Five `&&`-chained scripts became 18
individually-reported links; the suite went 30 → 43 steps. Three claims `ci.yml` made about itself became
enforced rather than asserted — **the third had no mechanism at all**: the comment said *"the grep is the
check"* and there was no grep.

**And the ci.yml chain detector judges the real file.** `ciChainFindings(CI)` reads
`.github/workflows/ci.yml` from disk inside `test:check-suite`, which is a STEP. I falsified it by hand:
planting one `&&` in a copy yields `["ci.yml:463 carries `&&` — …"]`. A check that cannot fail is not a check,
and this one can.

**Seven rounds on one function, and the direction is the story.**

| round | gate verdict | what it found |
|---|---|---|
| 1 | BLOCK | 2 P2 — chains hidden in `$( )` inside double quotes; nothing applied the predicate to `ci.yml` |
| 2 | BLOCK | **P1** — the arithmetic frame added to fix round 1 *was* the bypass |
| 3 | BLOCK | **P1** — ANSI-C `$'…'` quote parity desynced from bash |
| 4 | BLOCK | 4 P2 — a contract violation (`"$[1+2]"` certified clean) + three unpinned claims |
| 5 | BLOCK | 3 P2 — **all fail-closed false positives**: `$(($1\|1))`, `$((x\|=2))`, `0<&3` |
| 6 | focused review | **FAIL** — the redirect widening opened a real laundering bypass, `\<&` |
| 7 | focused review | **PASS** — 0 bypasses across 36 shapes, 33/33 pinned cases, 3 mutations bite |

**Rounds 1–3 were under-reports; 4–5 were over-reports.** The dangerous direction closed at round 4.
**Severity should be read by direction, not only by tier** — an over-report costs a rewrite, an under-report
costs the whole control.

**The cure that ended the bypass sequence was structural, not another special case.** Three rounds of
modelling one more construct each. The fix was to invert: **the scanner declares the vocabulary it
understands, and anything outside it is reported as an unmodelled construct — never as clean.** The `$`
surface is closed by enumeration; everything else is *asserted* to over-report with pinned cases; and one
under-report is **disclosed** — an unterminated quote returns `[]`, which is not a bypass because bash exits
with a syntax error and runs nothing, pinned so a change becomes visible. Impact measured **before** building
and confirmed independently: across all 114 governed commands, **zero contain a `$` or a backslash at any
position**, so zero verdict changes.

**The bypass round 6 caught would have shipped on my verification.** I tested `&<` — the widening the judge
warned against — and it held. **I never constructed the escaped form `\<&`.** The reviewer built an oracle
instead of an equality assertion: *LEFT touches a marker and exits 7, RIGHT touches a marker; a laundering
chain is both markers present AND exit 0.* That tests the requirement rather than today's answer, which is
why it survived an implementation change and my checks did not. Round 7 closed both arms, so the guard is
**strictly better than any prior commit** — including on `\\<&`, where HEAD is right and the parent was wrong.

**Corrections carried, not absorbed.** I relayed `ci.yml:351` for the mission-control step; it is `:528`, and
the builder measured it. The builder's own note on round 6: *"I wrote that widening, I wrote an abuse case for
it, and my abuse case was the one the judge had already named — I tested the shape I was handed rather than
the shape I had created."* And an advisory finding was itself wrong: wrapping (`bash -c "node --test x"`)
does **not** evade the runner guard; indirection through a variable does. **Gate output is not automatically
correct either**, and treating it so would be the same error as trusting a self-report.

**Restraint, verified.** A new `EXCLUDED` entry would have tripped an existing heuristic that keys on whether
an exemption reason mentions `ci.yml`. The builder measured that exactly and **did not change the heuristic to
make its own entry pass** — it wrote the honest coverage claim and flagged the blunt heuristic as a founder
call. An agent declining to weaken a check that stood in its way is what separates a gate that works from one
that has been negotiated with.

**Residuals, all latent and stated.** `>|` over-reports on a single-command clobber redirect — identical on
every commit here, never touches the guard. `resolveChain` has three disclosed blind spots (`--silent`, `npx`,
`sh -c "…"`), pinned as known limitations. The runner-shape checks have no standalone entry point, declined
because a second name for one property is the name that goes stale. The `40`-character reason threshold and
the ops/unmodelled split were both de-duplicated into single definitions.

**Verification.** `npm run check` **43 of 43 · 0 failed**. `test:check-suite` **52 pass** (was 36).
`test:pre-tool-use` **167 pass · 0 skipped** (was 161 pass / 5 skipped). CI on this PR: **52 steps · 52
success · 0 skipped · 0 failed**, holding across **seven consecutive** rewrites of the guard.

**Owed immediately after merge:** run the binding gate against `main`, per the founder's decision. If it
blocks, the finding is acted on as a follow-up PR, not a revert, unless it is a genuine bypass.

**Not an independent panel:** single model family throughout.
