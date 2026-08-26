---
date: 2026-08-26
role: ceo
task: memory-eviction
qa_verdict: PASS
tier: irreversible
engines: [builder, reviewer]
claims_touched: []
---

# Typed eviction for DECISIONS.md — four review rounds, and the fix was the defect three times

**Decision.** Reviewed at the lean weight — one blind adversarial delta reviewer under
`independence: provenance`, against the deterministic floor — across four rounds. `scripts/lib/**` tiers
`irreversible`, and the binding `qa.js` gate is reserved for surfaces `git revert` does not undo. This is
tooling that edits a memory file under version control; a bad eviction is recoverable from git. Recorded so
the weight is a choice, not an omission.

**Evidence.** Round 4 (`4c08950..e28008e`, four commits, one defect each): **PASS**. Three P1s closed, the P2
closed, no regression across ten probes and eight call-site mutations. `check:memory` 24+86 pass ·
`npm run check` 30 of 30 · `check:ledger` 80 pass · 8 would_block · 0 block, unchanged. The reviewer
content-confirmed the tree against `git show` rather than `rev-parse`, and ran a positive control before every
measurement.

**The finding that shaped the method.** Rounds 2 and 3 each fixed a real defect and each introduced a new P1
doing it — one widening of the field selector, opening a new shadow surface every round, with each round's
fixture shaped so it could not see the remainder. The cure was not another fix: it was measuring what the
tolerance bought. **0 non-canonical field lines across 575 tracked `.md` files**, derived independently by the
orchestrator and the reviewer. The selector was narrowed to the canonical form and made fail-closed. Round 4
is the first round that did not introduce a regression, and the only difference in its brief was an explicit
instruction to construct the input that defeats your own fix and confirm the fixture admits it.

**The P2 was ranked above the three P1s, and that ranking was right.** `volExisting: ''` disabled the
conservation gate's destination check with **zero** failing tests, because `startsWith('')` is always true.
The P1s were latent and needed unusual authorship; a disabled gate needs only a plausible refactor. It is now
**unexpressible** rather than guarded — the parameter was deleted and the destination is read from what the
write itself opens. Eight call-site corruptions all caught, including the direct heir: forcing the file read
to return `''` refuses instead of going vacuous.

**Protocol, and it is the transferable part.** The builder declared its own residuals in a note addressed to
the reviewer. Those were **withheld** until the reviewer had reported blind against a pre-registered table.
The gap between the two is the measurement, and it found an overstatement in one pass — see below. Forwarding
the declaration first would have had the reviewer verify the *closure* rather than probe the *construct*,
which is a weaker test for no saving.

**Two overstatements, in opposite directions, both by the producer about its own finding.**
- *"Closes the class, including constructs nobody has thought of"* is **broader than achieved.** The defence
  works by counting canonical candidates, so it closes the class wherever the entry's own field is canonical
  and unmasked — 575 of 575 real entries — and anything making the count 1 defeats it.
- *"i.e. your P1-1 again"* is **harsher than the evidence.** Control run with the comment removed: the entry
  refuses. P1-1 was a wrong value outranking a correctly written field; this supplies a readable value where
  the parser had none, converting fail-closed into fail-open. A milder, differently shaped defect. The
  producer graded its own bug worse than it was.

**Residual carried forward, named rather than discovered.** A canonical field inside an HTML comment, when it
is the *sole* canonical candidate and the entry's real fields are written non-canonically, is read as the
entry's own — evicting an entry that declares `irreversible` against a live path, `exit 0`, mutated. **P1 by
severity, present at all four commits including the branch's first**, so not this delta's defect. Needs two
simultaneous conditions each measuring 0 of 578 tracked files. Must close before the feature is relied upon,
because the tool is irreversible tier and the failure is silent.

**Residual declared by the producer that the review could not have found.** On the *fresh*-volume path the
gate and the writer both derive the prior from `volumeHeader`, so a change to the header formula itself is
invisible there. Verified: benign, because a fresh volume has no prior content to preserve, making the
append-only condition vacuous by nature rather than by defect. The reviewer's mutation set corrupts call
sites, and detecting this needs a mutation to `volumeHeader` — outside that set. **A producer declaring a real
weakness in its own work that survives independent review is the evidence that its other declarations are
worth something.**

**The refusal-to-choose is load-bearing, and it holds.** Re-widening `CANONICAL_FIELD` to the exact round-3
tolerant form still yields `unknown / refused / exit 1` on both shadow probes, and the suite catches the
re-widening independently with 6 named failures. Three layers, not one. Three residuals on it: the regex `i`
flag is load-bearing and nothing names it as such; it defends by counting, so count-of-1 is the structural
limit; and a duplicated canonical line permanently pins an otherwise-eligible entry — fail-closed and
acceptable, but an unpriced denial cost whose only signal is the message text.

**Correction to the record, at its source.** The round-3 report stated that P1-3 ate a trailing blank line. It
did not — the fixture had no blank line at that position. **P1-3 stands, on its own evidence: the stub was
written inside the quoting entry's fenced example, the evicted entry survived intact in `DECISIONS.md`, its
body was also written to the archive, and all five conservation conditions passed while the report claimed
"conservation closes to zero".** That evidence is untouched by the correction. The wrong detail is repeated
verbatim in `7e56e4a`'s commit message; the commits are not being rewritten for one sentence, so the
correction lives here beside the claim.

**The reviewer corrected itself twice more, unprompted:** its `p8-splice` instrument is valid for *detecting*
the round-3 defect but cannot *confirm* the fix, because its summary booleans read identically in both worlds
— it read the document dump instead of amending a validated instrument. And it ran its mutation set before
establishing a baseline, catching it only because one test failed in all eight arms.

**Owed at merge time, not in this branch.** `test:eviction` needs its `STEPS` entry in
`scripts/lib/check-suite.js` and its `ci.yml` step; both files have Wave 1 work in flight. This branch also
conflicts with Wave 1 on `package.json` — keep the split form and give `test:eviction` its own script — and on
the generated `CODEBASE-MAP.md`, which is resolved either way then rebuilt with `npm run build:map`.

**Not an independent panel:** single model family throughout.
