---
date: 2026-08-26
role: builder
task: gate-refusal-is-not-a-block
branch: fix/refusal-is-not-a-block
tier: irreversible
qa_verdict: PASS
decisions:
  - Added a third terminal verdict, REFUSED, rather than a side-channel field. The brief's bar was
    that a caller reading ONLY the verdict cannot mistake the two; a boolean beside an unchanged
    verdict does not meet it.
  - Cut on "was anything established about this diff", not on "did an agent run". A real failing
    check stays BLOCK; a dropped-out oracle becomes REFUSED even though it dispatched more agents.
  - Updated coding.js, the only programmatic consumer, so the distinction is not re-hidden one
    level up. Its PASS-vs-everything fold would have reported a refusal as a block.
  - Judge dropout deliberately stays BLOCK. The panel ran; only the synthesiser died.
  - Put the tests in scripts/run-gate.test.mjs rather than a new file — it is already the qa.js
    contract file AND already a CI step, so this needs no 47th step and no figures change.
  - SHIPPED ONLY THE PRIMARY. The secondary is refuted below, by measurement.
corrections:
  - "Brief: 'roughly half of subagent runs end mid-tool' implies a died reviewer reads as clean.
    MEASURED FALSE — a reviewer returning nothing structured, or a malformed object, already
    BLOCKs via the coverage gap. Only a well-formed `findings: []` reads as clean."
  - "My own report to the lead said the distinguishers were `agents dispatched == 0` and the word
    REFUSED. The first is WRONG: an oracle dropout dispatches 4 agents and establishes nothing,
    while a real failing check establishes something with 1. I gave a discriminator that does not
    discriminate; the verdict field is the only one that does."
claims_touched: []
---

**Tier `irreversible`** — `node scripts/classify.mjs` returns `floor=irreversible`, driven by
`.claude/workflows/qa.js`. **This PASS is author-recorded against a deterministic floor by one
agent of one model family**; the tier's 2-of-3 multi-judge is not met.

## The defect

A gate that refused its own arguments and a gate that reviewed the diff and found defects returned
the same word. Measured across eleven entry shapes with the panel stubbed: **ten returned `BLOCK`,
and exactly one of those ten was a statement about the diff.**

The prose already knew. Three summaries said *"establishes nothing in either direction"*, *"a
partial floor is not a floor"*, *"NOT a judgement about the diff"* — while returning `BLOCK`. Nine
test names in `run-gate.test.mjs` said **REFUSES** while asserting `'BLOCK'`. Every layer of English
in the file had the distinction; the one field callers read did not.

## Before → after

| # | entry shape | before | after |
|---|---|---|---|
| 1–5 | no `tree` · symbolic `ref` · tier only · no `ref` · relative `tree` | BLOCK, 0 agents | **REFUSED** |
| 7 | oracle measured a different tree | BLOCK, 1 | **REFUSED** |
| 8 | oracle dropped out | BLOCK, **4** | **REFUSED** |
| 9 | oracle claimed pass having run 0 checks | BLOCK, 1 | **REFUSED** |
| 10 | oracle reported 1 of 3 checks | BLOCK, 1 | **REFUSED** |
| **11** | **a named check actually FAILED in the right tree** | **BLOCK, 1** | **BLOCK** — unchanged |
| 6 | the valid invocation | PASS, 7 | PASS — unchanged |

Case 8 is why the cheap discriminator fails: **the refusal dispatches four agents and the real
block dispatches one**, because the oracle retries. A dispatch count separates nothing; only the
verdict can carry it. That is pinned as its own test.

## Why widening the enum was safe

Checked **before** adding the value, not after. Every consumer keys on `=== 'PASS'`
(`coding.js`), never on `=== 'BLOCK'`, so an unrecognised third value fails **closed** everywhere by
construction. `lib/gate-logic.mjs` is the panel arithmetic and refusals return before the panel ever
runs. `scripts/verdict.mjs` is a different mechanism (the `.qa/verdicts` record), not a consumer.
So exactly one consumer needed changing, and it was changed — `coding.js` now returns
`REFUSED_BY_QA`, and a test fails if the old fold returns.

`established` is emitted on every return, derived from the verdict on the same line that sets it, so
the two cannot drift. The **judge's** schema is deliberately still `['PASS','BLOCK']` — REFUSED is
the harness's word about whether it established anything, never a judgement an agent may hand back;
a test asserts no agent-facing enum offers it.

## Verification

- `npm run check` → **Tally: 46 of 46 passed · 0 failed · 509.5s · exit 0**, sandbox armed.
- `npm run test:run-gate` → **96 pass · 0 fail** (87 before; 19 existing assertions moved BLOCK→REFUSED).
- **Mutations, all red:** `gateRefusal`→BLOCK **23 fail** · oracle split removed **5** ·
  `established` hardcoded true **2** · `coding.js` fold restored **1**. Restored: 96/96.
- **The control the brief required:** a real failing check and a **confirmed P1 from the panel**
  both still BLOCK. The P1 case drives verifiers to 3-of-3 real and asserts `judge_verdict: 'PASS'`
  — so it is the deterministic override that blocks, which is the case a careless widening loses.
- `loadQa()`/`runQa()` were **moved**, not copied, to `scripts/lib/load-qa.mjs`; `run-gate.test.mjs`
  imports them and stayed 87/87 across the move.

## The secondary: refuted, not deferred

`findings: []` does **not** currently read as clean for the case the brief described. Measured:

| reviewer behaviour | verdict |
|---|---|
| returns nothing structured (dies) | **BLOCK** — all 5 dimensions flagged |
| returns `{}` (malformed) | **BLOCK** — all 5 flagged |
| returns a well-formed `findings: []` | PASS |

A dropped-out reviewer already blocks, through retries and the coverage gap. So the tool-use-count
discriminator would add a mechanism for a case **already covered**, while appearing to close the one
that is not — and the brief's own caveat is why: a count proves an agent did not die at turn one,
which is precisely the half already handled.

The remaining gap is real and narrow, and `qa.js` already carries a written decision on it naming
the **strong** form — the reviewer attesting to what it examined, a changed-file count or the sha it
diffed — with its cost: a new required field in `FINDINGS_SCHEMA` and a new instruction in
`reviewPrompt()` across five dimensions plus verifiers and sweep, in a runtime that already loses
dispatches to schema failures. Building the weak form would foreclose that. **Shipped only the
primary.**
