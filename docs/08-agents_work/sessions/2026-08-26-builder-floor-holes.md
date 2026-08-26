---
date: 2026-08-26
role: builder
task: floor-holes
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: fix/ci-chain-structure-holes
---

# Seven ci.yml shapes walked past the chain guard, and the existence half of the citation checker is blocking

**The PASS is self-recorded, and that is not the tier being met.** `tier: irreversible` asks for
2-of-3 multi-judge and ≥2 distinct model families. This branch has one author, one model family, and
no external review. Everything below is measured; none of it is adjudicated.

decisions:
- **Refuse, do not model.** Four bypasses were reported. The cure applied is round 9's — declare what
  is read and refuse the rest — moved one layer up, from the VALUE to the LINE. That decided the shape
  of every change here and is why sweeping the class was cheap.
- **Measure ci.yml before writing a parser for anything.** 50 item lines, 97 step-key lines, 0 of them
  anything but a plain `key: value` pair, 1 job, 0 inline `steps:`, 0 bare `-`. The refusals change
  zero live verdicts, which is what makes them safe to make blocking.
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

Both controls are identical in both cells, which is what makes the seven flips mean something.

Five pieces of the fix, five mutation proofs, each failing the case that pins it and nothing else:
removing the key-line refusal, removing the item-line refusal, hardcoding the key column back to +2,
requiring `steps:` to be bare again, and restoring `break` at the first dedent. Dropping the
`u.key === null` exclusion from `unguardedSteps` fails only the coupling case.

## Verification, by execution

- `npm run test:check-suite` → **63 pass · 0 fail** (59 before; 4 cases added).
- `npm run check` → **46 of 48 passed · 2 failed · 289.5s**. Both failures are documented figures in
  `docs/STATUS.md`, which another lane owns. Patching its eight figure sites temporarily and reverting
  byte-exactly: **48 of 48 passed · 0 failed · exit 0 · 180.2s**. Those eight sites are the only thing
  between this branch and a green suite.
- `check:citations-exist` non-vacuity: a `check-suite.js:99999` locator → **exit 1**, naming
  `line-beyond-eof`; `check-suite.js:1` → **exit 0**; restored → **exit 0**.
- The real `ci.yml` is unchanged by the parser rewrite and still agrees with PyYAML exactly: 52 steps,
  49 `run:` values, 0 refusals, 0 chain findings, 0 unguarded.

## Residual

`docs/STATUS.md` needs `suiteSteps` 46 → 48 (four sites), `ciRunSteps`/`ciGuardedSteps` 47 → 49 (three
sites) and `ciRunStepsPlusOne` 48 → 50 (one site). Reported to the lead, not edited here.
