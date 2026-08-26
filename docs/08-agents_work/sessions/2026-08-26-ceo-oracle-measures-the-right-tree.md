---
date: 2026-08-26
role: ceo
task: oracle-measures-the-right-tree
qa_verdict: PASS
tier: irreversible
engines: [builder, reviewer]
claims_touched: []
---

# The gate's oracle measured whichever tree the dispatch landed in

**Decision.** Landed on blinded-reviewer evidence rather than a `qa.js` run — a scoped exception to
rule 8, taken by the founder on 2026-08-25 and recorded here because an exception nobody wrote down
becomes a precedent. The circularity forcing it: `qa.js`'s oracle measured the dispatching session's
cwd, so a gate run on this branch would have measured an unmodified `main` and returned a false PASS.
The gate cannot trustworthily review the fix to its own oracle.

**Evidence.** Two blinded reviewers at `172bad8` returned FAIL with 3 P1s, two converged independently.
One delta reviewer across two reports returned 4 P2 / 6 P3 / no P1: *"nothing found yields a PASS from
an invocation `run-gate.mjs` can emit."* Five fix rounds, severity P1 → P1 → P2 → P2 → prose. The
deterministic floor was executed by the orchestrator in the tree under review, not inferred.

**Corrections.** The orchestrator asserted the structural fix "does not exist"; it did — `<base>...HEAD`
denotes the same range inside the named tree and discloses nothing, taking the expected sha from 5
occurrences in the prompt to 0. The orchestrator also instructed a corroboration claim that n=31 cannot
support (95% CI 35.2 points wide) between two populations where one contains the other; deleted, with
the arithmetic preserved.

**Residuals, accepted and documented in source.** An oracle that reaches the tree to read HEAD but runs
the checks elsewhere still passes — closing it needs an attestation over check *output*. Panel prompts
INSTRUCT a tree-scoped diff rather than enforcing it. Empty findings arrays still read as reviewed
rather than never-looked; scheduled to Wave 3.1.

**Not an independent panel.** Single model family throughout.
