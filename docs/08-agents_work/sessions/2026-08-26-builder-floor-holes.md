---
date: 2026-08-26
role: builder
task: floor-holes
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: fix/ci-chain-structure-holes
---

# Eight ci.yml shapes walked past the chain guard — one of them my own — and the citation existence check is blocking

**The PASS is self-recorded, and that is not the tier being met.** `tier: irreversible` asks for
2-of-3 multi-judge and ≥2 distinct model families. This branch has one author, one model family, and
no external review. Everything below is measured; none of it is adjudicated.

decisions:
- **Refuse, do not model.** Four bypasses were reported. The cure applied is round 9's — declare what
  is read and refuse the rest — moved one layer up, from the VALUE to the LINE. That decided the shape
  of every change here and is why sweeping the class was cheap.
- **Measure ci.yml before writing a parser for anything.** 50 item lines, 97 step-key lines, 0 of them
  anything but a plain `key: value` pair, 1 job, 0 inline `steps:`, 0 bare `-`. The refusals change
  zero live verdicts, which is what makes them safe to make blocking. *The two line counts are the
  census taken BEFORE this change and are provenance; it added two steps, so they are 52 and 101 now.
  The zero is the load-bearing half and `check:ci-chains` re-derives it every run.*
- **Promote the EXISTENCE class only.** Existence is deterministic with no false positives by
  construction. Drift is heuristic, covers ~a quarter of the corpus, and resolves ~85% of locators by
  basename — which the checker's own blind-spot list says may be the wrong file.
- **`EXCLUDED["check:citations"]` does not name the workflow file, on purpose.** The guard over these
  reasons tests them as prose: any entry naming that file must be RUN by it, and it cannot tell "the
  workflow runs me" from "the workflow runs my replacement". Rather than loosen a guard to fit one
  entry, the reason claims two narrower things that ARE enforced. The over-breadth is recorded in the
  entry, not worked around in silence.

corrections:
- **The brief's mechanism was wrong for three of four shapes, and it said so itself.** It described the
  class as "`parseCiSteps` does not see the step at all". Measured on 244e8db: it sees ONE step for
  every fixture. Three leave `run: null` because `record()`'s key pattern missed the line and it
  returned in silence — and `run: null` is what a step that runs nothing looks like. Only the second
  job is never reached. Deriving that is what found the other three bypasses.
- **The brief said the `unguardedSteps` coupling has "no test covering it".** It has one, on 244e8db:
  `the unguardedSteps exclusion is discharged by ANOTHER function, and this is that coupling`. This
  branch extends it rather than writing it.
- **Two of my own five mutation proofs were invalid on the first run, and the run said so.**
  `if (!m) return false` → `return;` is a NO-OP at the call site (`!undefined` is also true), and
  `steps:(.*)$` → `steps:\s*$` deletes a capture group so the code THROWS — 21 red tests that were a
  crash, not a proof. Both redone as clean reverts.
- The header of `check-citations.mjs` said it was "deliberately NOT wired". That is now false for one
  of its two classes and the header says which.

claims_touched: none registered. `c-mission-control-cold-start` untouched; no ledger entry asserts
anything about `parseCiSteps` or the citation checker's posture.

## What was wrong, and the evidence

Seven shapes of **valid YAML** (checked against PyYAML 6.0.3) each carrying `npm run x && npm run y`
were SILENT on `origin/main` — `ciChainFindings → []`, `unguardedSteps → []`. The composed case is the
worst: a second job whose items sit at eight spaces defeats even the raw-line cross-checks in
`check-suite.test.mjs`, which count `/^ {6}- /`. Same fixtures, same command, two libraries:

| fixture | origin/main | this branch |
|---|---|---|
| CONTROL plain chain | FLAGGED | FLAGGED |
| BENIGN single command | SILENT | SILENT |
| second job | SILENT | **FLAGGED (chain)** |
| `run : x` — space before the colon | SILENT | **FLAGGED (refused)** |
| `- {run: x}` — flow mapping | SILENT | **FLAGGED (refused)** |
| `"run": x` — quoted key | SILENT | **FLAGGED (refused)** |
| `-  name:` — wide dash, keys at +3 | SILENT | **FLAGGED (chain)** |
| `steps: [{run: x}]` — flow sequence | SILENT | **FLAGGED (refused)** |
| `- <<: *base` — merge key | SILENT | **FLAGGED (refused)** |
| flush job — `steps:` and `- ` at one column | SILENT *(blocks on `main`, see below)* | **FLAGGED (chain)** |

Both controls are identical in both cells, which is what makes the flips mean something.

**The eighth row is mine, and it is a REGRESSION rather than a residual — found by review, not by me.**
At the *library* level `main` is equally silent on a flush-style job, so a differential there reads
"pre-existing". At the *repo* level `main` BLOCKS: its `break` collapsed the parse to **zero** steps
on meeting the shape, which tripped the `CI_CHAINS_ALLOWED` rot-check and nine tests. My resume kept
a **plausible** 52-step parse and reported clean — a view byte-identical to the pristine file.
Nothing named that backstop and nothing tested it, so removing it left all 63 tests green.

> **A deletion attracts no test cases** — committed by the change that was closing seven instances of
> exactly that class. It also falsified my own commit subject: I applied the cure at the item line and
> the key line and **not at the sequence-detection layer**, which is the one that silently discards.

Measured, flush job prepended as the FIRST job of the real `ci.yml`:

| | parseCiSteps | ciChainFindings |
|---|---|---|
| `main` 244e8db | **0 steps** | 1 (the rot-check firing) |
| my first cut | 52 steps | **0** — identical to pristine |
| after the fix | 53 steps | 1 (`carries \`&&\``) |

The review's method note is worth keeping: appending the flush job at the **end** of `ci.yml` went
red, but only because my own test appends its injection after it — the test's self-control caught its
own instrument dying. **Moving the job to the front removed that accident, and that is how the P0
surfaced.** Reporting the first result alone would have been wrong in my favour.

Five pieces of the fix, five mutation proofs, each failing the case that pins it and nothing else:
removing the key-line refusal, removing the item-line refusal, hardcoding the key column back to +2,
requiring `steps:` to be bare again, and restoring `break` at the first dedent. Dropping the
`u.key === null` exclusion from `unguardedSteps` fails only the coupling case.

## Verification, by execution

- `npm run test:check-suite` → **66 pass · 0 fail** (59 before; 7 cases added).
- `npm run check` → **46 of 48 passed · 2 failed · 289.5s**. Both failures are documented figures in
  `docs/STATUS.md`, which another lane owns. Patching its eight figure sites temporarily and reverting
  byte-exactly: **48 of 48 passed · 0 failed · exit 0 · 180.2s**. Those eight sites are the only thing
  between this branch and a green suite.
- `check:citations-exist` non-vacuity: a locator naming line 99999 of `scripts/lib/check-suite.js`
  → **exit 1**, reporting `line-beyond-eof`; the same locator naming line 1 → **exit 0**; probe
  removed → **exit 0**. *Neither probe is written here as a `path:line` code span, because the
  checker would harvest it out of this file and report the dead one. It did: the first draft of
  this line spelled both, and CI reported the 99999 one against this very file. It passed LOCALLY
  because the file was still untracked and resolution runs off `git ls-files` — the local-only gap
  this checker names in its own blind-spot list, biting one commit later.*
- The real `ci.yml` is unchanged by the parser rewrite and still agrees with PyYAML exactly: 52 steps,
  49 `run:` values, 0 refusals, 0 chain findings, 0 unguarded.

corrections (third round — an independent review returned FAIL, P0):
- **My fix removed an accidental backstop and I did not notice, because nothing named it.** See the
  eighth row above. Closed by reading a flush sequence rather than refusing it: the two shapes are one
  sequence written two ways, so the honest finding is the chain, and a `- ` at exactly `stepsIndent`
  cannot be anything else — a sibling key sits at that column but is `key:`-shaped, never `- `-shaped.
- **A refusal I added FAILED THE BUILD on correct YAML, with a message that was false about it.** The
  opener matched any line beginning `steps:` at any depth, which my own multi-job resume made reachable
  between every pair of jobs — so `strategy.matrix.steps: [1, 2]` blocked, saying "this parser reads no
  step of this job at all" while three steps including that job's were parsed. Scoped by the enclosing
  key chain now, and the message says only what is checked. **A rule that fires on correct code gets
  weakened; this repo has learned that twice and I re-taught it a third time.**
- **The enumeration in the line-refusal message read as exhaustive and was not** — `- # comment` and a
  bare `-` reach it and are none of the four shapes named. It names the RULE first now and the examples
  second, marked "not limited to".
- **`if (!item[3]) itemKeyIndent = itemIndent + 2;` could be deleted with 63 tests green.** Not dead
  code: without it a bare-dash step's `run:` is never read, so the build goes red on the refusal alone
  and never names the chain. Now pinned by a case that asserts BOTH findings, with a benign control
  asserting exactly one.
- **A figure I froze went stale inside my own PR, twice, and the sweep found the second.** `874
  locators` was falsified by my own session-file commits — every `path:line` span a lane writes is a
  locator. Replaced with the command. Sweeping the class then found `50 item lines and 97 step-key
  lines` in **three** files, falsified by the two ci.yml steps this same change adds (52 and 101 now).
  Restated as provenance, with the load-bearing **zero** kept live and re-derived by `check:ci-chains`.

## `main` moved under this branch, and the figure fence was then lifted

`main` went 244e8db → 47dbbd6 while this ran (#108, which also WIRED `CLAUDE.md` into `check:figures`
— that is why three sites exist there that did not at this branch's base). `origin/main` is merged in
here; the merge was clean, because that lane touched no file this one touches. All 16 sites are
updated **from a fresh re-derivation**, not from the handoff table:

| file | figure | was | now | sites |
|---|---|---|---|---|
| `docs/STATUS.md` | `suiteSteps` | 46 | **48** | :97 · :335 · :358 · :360 |
| `docs/STATUS.md` | `ciRunSteps` / `ciGuardedSteps` | 47 | **49** | :207 · :215 · :262 |
| `docs/STATUS.md` | `ciRunStepsPlusOne` | 48 | **50** | :263 |
| `CLAUDE.md` | `suiteSteps` | 46 | **48** | :481 · :486 · :620 |

History is not flattened. `CLAUDE.md:620` is a correction naming its own old values — the preserved
"30" and "29" stay exactly as written and only the live figure moves, with "46" joining the list. §4's
superseded blockquote gains an entry saying **46 → 48 is the 43 → 44 kind, not the 30 → 43 kind**:
genuinely new work, not a renaming, which is the distinction that block exists to keep.

Two `CLAUDE.md` prose bullets are rewritten because this branch falsifies them. *"Four bypasses are
live on `main` … `parseCiSteps` does not see the step at all"* → seven, closed, with the measured
mechanism and the composed variant that defeats every backstop. *"`check-citations.mjs` is STILL
UNWIRED … Founder decision, not an agent's"* → the decision is recorded as **taken**, with the run it
was made from, and it publishes a three-part recipe that prints `true true true`.

**Two figures moved that nobody asked me to touch, because my own runs falsified them.**
`npm run check` took **480.0s** here against a published range of "90 to 275 seconds" — carried
identically in both files. The upper bound is 480s now and the three new runs are recorded. A bound
the next honest run steps over is not a bound, which is that paragraph's own argument.

corrections (second round):
- **I published "together under two seconds" for the two added steps and it was wrong.** Written from
  the checker's own 1.4s and never measured as a pair. Timed before pushing: **6.0-6.8s together**
  across four consecutive pairs. It is in the file as a correction rather than silently right, because
  it would otherwise have been a fifth wrong figure on a page about wrong figures.
- `docs/STATUS.md:97` could not simply take the new number: it cited CI run `32944938976` as having
  "confirmed it", and that run was the suite at **46** steps. The claim is scoped to what the runner
  actually saw rather than restated over a number no runner has seen.

## Verification, after the merge

`npm run check` → **48 of 48 passed · 0 failed · exit 0 · 480.0s**, on the merged tree. The figure this
file now publishes is the figure that ran.
