---
date: 2026-08-26
role: builder
task: position-invariant-fixtures
qa_verdict: PASS
tier: full
risk: full
branch: test/position-invariant-fixtures
---

# Fixture position is a variable to sweep, not a setting to pick

**Self-recorded PASS.** One author, one model family; `full` tier's reviewer and security lens are
unmet. This is the deterministic floor and nothing more.

decisions:
- **Scoped to ADDITIVE injections into the real `ci.yml`, and named narrowly on purpose.** The brief
  said "every fixture-based finding in this repo is exposed". Swept: there are **three** additive
  sites in `scripts/check-suite.test.mjs` — a fragment that must *choose* where to go. The other
  fourteen injections are `CI.replace(...)` mutations of an existing line; they do not choose a
  position, they inherit one. Calling this harness repo-wide would be the same over-generalisation it
  exists to catch.
- **The denominator is checked before the verdict.** The harness asserts the parse still sees the
  whole file at every position, and only then asks what was found. That is the half neither of us had
  written down, and it is what turns `steps=1 → CAUGHT` from a pass into a failure.
- **Left the existing appended-step case alone.** It loops four operators at one position to assert
  the finding *names the operator*, which is not position-dependent — `shellOperators` reads the run
  string. The position property is owned by the new cases. One property per test is this file's style.

corrections:
- **My first harness passed `{}` as the allowlist and every cell reported two findings.** Against the
  *real* `ci.yml` that un-exempts its one legitimate `bun install … && npm run check:mc` step, so the
  sweep was measuring the allowlist, not the position. My earlier probes used `{}` correctly — on
  *synthetic* fixtures, which have no such step. The judge takes the real allowlist now.
- **My first position-blind judge threw for the wrong reason.** It SLICED the workflow text, which
  also deletes the allowlisted step, so the `CI_CHAINS_ALLOWED` rot-check fired and the throw had
  nothing to do with position. It filters findings by line number now, so the whole file is still
  parsed and position is the only variable. *A self-test that passes for the wrong reason is the
  defect this branch is about.*

claims_touched: none registered.

## Why a harness and not a paragraph

Two findings on one day, **each masked by the position that revealed the other**:

| finding | prepended | appended |
|---|---|---|
| the flush-job P0 | **surfaced it** | masked — the case below it appends its own injection after |
| the second-job bypass | masked — "CAUGHT" at `steps=1` | **surfaced it** — `steps=52`, silent |

So "prepend your fixture" is half a technique, and it was recorded as a whole one three hours after
the first finding. **A catch from a collapsed parse is not a catch.** This file has long insisted a
negative result needs a control that must fire; this is the mirror — **a positive result needs its
denominator read.**

## The proof, by execution

Same sweep logic, pre-fix library (`47dbbd6`) against post-fix (`main` `0c78fa2`), both against the
real `ci.yml`:

| fixture | position | pre-fix | post-fix |
|---|---|---|---|
| plain second job | first | `steps=1`, 2 findings → **FAIL (collapsed)** | `steps=53`, 1 → PASS |
| plain second job | last | `steps=52`, 0 findings → **FAIL (missed)** | `steps=53`, 1 → PASS |
| flush-style job | first | `steps=0`, 1 finding → **FAIL (collapsed)** | `steps=53`, 1 → PASS |
| flush-style job | last | `steps=52`, 0 findings → **FAIL (missed)** | `steps=53`, 1 → PASS |

**Four of four fail on the code that had the defects; four of four pass on the code that fixed them.**
The `steps=1` row is the one worth staring at: pre-fix `main` reported a finding while parsing **one**
step of a fifty-two-step workflow, and that was recorded as a catch by two readers.

## The claim I was asked to make, and did not — it is false

I was asked to assert this is **"the first place in this repo where *read the denominator before the
verdict* is mechanised rather than remembered"**, and to make it only if it holds. **It does not.**
Two pieces of prior art, both mechanised, both predating this branch, both verified by execution:

| prior art | what it does | proof |
|---|---|---|
| `check-citations.mjs --min-locators` | a non-vacuity floor that exits 1 **even in WARN posture** | `--min-locators 99999` → **exit 1**, *"A checker that finds nothing must fail, not report clean."* |
| `scripts/run-checks.mjs` | a zero-step run is **REFUSED**, a partial run says **SUBSET**, an interrupted one says **INCOMPLETE** | its own header and banner text; `test:check-suite` pins all three |

So the practice is established here and I am extending it, not founding it. **The smaller claim that
IS true:** this is the first place the denominator of a **test fixture sweep** is declared by the
caller and checked before any verdict is taken. The prior art bounds a *checker's corpus* and a
*runner's step list* — neither reaches a fixture, which is exactly where both of today's failures
lived.

**And the axis it does NOT reach, stated because a control cannot find it:** the harness proves the
instrument ran and was aimed at every position. It says nothing about whether the *predicate* is wide
enough — and no control drawn from the same predicate ever can. That needs a second independent
enumeration, which this harness does not provide and cannot.

## Verification

- `npm run test:check-suite` → **70 pass · 0 fail** (66 before; 4 cases added).
- The harness's own self-test refuses **six** defects and passes the correct judge, so no
  `assert.throws` is satisfied by something that throws at everything: a position-blind judge · an
  unread parse denominator · a sweep over **zero** positions · a sweep covering a **subset** of what
  was declared · two positions that are the **same workflow** · and a base the fixture cannot be
  placed in at all.
- **The position count is DECLARED by the caller and checked before any verdict is taken.** It was
  `attacks.length >= 2` with the caller comparing labels afterwards — a derivation checked against
  itself, and one that is never reached if the loop throws first.
- `npm run check` → **48 of 48 passed · 0 failed · exit 0 · 188.7s**.
- **`STEPS.length` unchanged at 48** — no npm script added, no documented figure moved.
