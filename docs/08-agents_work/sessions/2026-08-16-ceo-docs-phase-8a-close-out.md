---
date: 2026-08-16
role: ceo
task: docs-phase-8a-close-out
tier: trivial
qa_verdict: PASS
---

Closes out the phase's record. Documentation and one generated index; no source changed.

**`c-mission-control-cold-start` disposition: REFRESH**, `valid_until` 2026-11-13 → 2027-02-16. The claim asserts the **cold** build completes within 10 s, and **#48 did not change the cold build** — it added a warm path in front of it. A genuinely cold build still runs on first launch, after a corpus change beyond threshold, and whenever the cache is rejected, so the budget still describes something real. What was stale was the prose beside it: "3.9–4.1 s cold and 16–26 ms on the next call, across 2,037 sessions" is now 2,405–4,675 ms cold across 2,610, and "the next call" is a different mechanism. **Deprecate would have been wrong** — it would have retired a claim about a path that still exists and still has a budget.

The warm path gets **no new claim**, deliberately. A claim exists to catch what nothing watches; `live.test.ts` now gates that path with executable assertions on the real corpus — `filesRead` < 1% of scanned, `filesSkipped` > 99%, `filesVerified` ≥ 99%, `filesStale === 0`, the bucket partition exact.

**The stale RCE warning is removed.** The handoff told readers not to point Mission Control at a tree containing repositories they did not write. #44 closed all three vectors. The replacement states the limit rather than the absence: it blocks **cross-site browser requests** — `same-site` is allowed, so another service on the same loopback still reaches everything, and a non-browser client sends no such header.

Three rules added to §0, each earned by an execution this session: **a green suite and a green suite where five tests never ran print identically** (measured: 319 pass / 0 fail / **5 NOT VERIFIED** with the corpus absent — and both a builder and the CEO cited "CI green on that SHA" six times between them as evidence for work CI never executed); **assert the edit landed, and that covers repair edits** (a timeout anchored on a non-unique shape attached 120 s to an unrelated test sixty lines earlier, so a fix that appeared applied was not, and the next two diagnoses were made against evidence that had never changed); and **a bracket whose soundness depends on where it runs must say where it runs** (99% is sound against 2,611 transcripts and wrong against a 4-file fixture — same assertion, opposite verdict, decided by the corpus it meets).

**One defect found by writing this file.** Editing `mission-control/README.md` — touching no claim — turned `npm run check` red: the ledger index stores `source_line` per claim, so prose above a claim shifts it and the committed index drifts. The message misattributes it (*"the committed index does not match the claims"* — the claims matched exactly) and its evidence is **19,749 bytes on disk versus 19,749 regenerated**, a figure identical on both sides in the one place a reader needs to know what differed. A builder had warned about this hours earlier and left the README alone; the CEO edited it anyway. Fixed here with `ledger build`; **the coupling and the message are dispatched as their own work**, because "remember to rebuild" is what this repo's rules table calls a wish.

Verification: `npm run check` **exit 0**, **319 pass / 0 fail** on `2442cbc`. Classifier floor `trivial`.
