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

---

## Rounds 5–9: a CI failure four review rounds could not see, and what it uncovered

**CI caught what the whole pipeline could not.** After round 4 passed review, `ubuntu-latest` failed a test
that passes on macOS: the fixture wrote `DECISIONS_ARCHIVE_002.MD` and asserted something occupied
`...002.md` — one file on a case-folding filesystem, two on a case-sensitive one. Its own precondition guard
used a **case-insensitive** regex to assert a **case-sensitive** property, so it passed while its premise was
false. **Every agent on this task runs on one machine, so a platform-dependent defect is invisible to the
review pipeline by construction.** The lane's answer was better than the rule it was given: it mounted a
case-sensitive APFS volume and measured, rather than reasoning — and produced the counter-example proving
`process.platform` would also have been wrong (a case-sensitive volume on macOS).

**The test bug was hiding a production defect, and two more behind that.** A directory named like a volume
was handed to `readFileSync` and crashed `plan` — documented read-only, exits 0 — with an unhandled `EISDIR`.
A **FIFO** named like a volume made it **hang forever** (8s timeout vs 38ms with the type filter); the
reviewer later corrected the attribution: the surviving hang is the claim scanner reading every git-listed
`.md`, and **git lists symlinks but not FIFOs**, so a bare FIFO is harmless while a symlink to one hangs. The
lane withdrew its own explanation rather than defending it.

**Then the fix for that dropped a needed shape.** Filtering non-regular files by `lstat` also dropped
**symlinks that resolve to real volumes** — invisible to the scan, so `targetVolume` appended to an older
volume and broke monotonic append **silently**, and the cross-volume duplicate guard went blind, duplicating
history on the recovery this tool's own message recommends. Two P1s. **The code's own comment named that exact
harm and applied it to the wrong branch** — one line above the filter inflicting it.

Cure: **one predicate cannot answer two questions.** The scan resolves (*does this hold content I must not
skip?*); the guard does not (*is this path free to create?*). Both collapse directions are pinned.

**The sweep then stopped short three times, and that is the durable finding.** Guarding one volume read left
three siblings; the funnel built to fix that reintroduced the defect one level down with an unconditional
catch — and asking the question of *every* catch found two worse siblings that failed **open and silent**;
and pinning "the four I recalled" left two of six guards held by nothing. **Intent caught none of these. A
grep did.**

**And a structural predicate forgot a class too.** `isFsError` tested shape rather than enumerating codes —
defended as *"a list is a thing to forget an entry from"*, which is true and was not the whole truth. A read
of an oversized file throws `ERR_STRING_TOO_LONG` with no `syscall` and no `errno`: the read genuinely failed
and **the kernel was never involved**, so a working named refusal became a stack trace. It is now structural
for what the kernel refused **plus an explicit list for what Node refused after the read, labelled as a
list**, with `ERR_INVALID_ARG_TYPE` excluded by its own test so the list cannot drift into dressing up bugs.

**Restraint verified, not assumed.** One catch is deliberately left wide — around `git ls-files`, whose
failure vocabulary is not the filesystem's. The reviewer injected a fault there and confirmed it fails
**closed and announced** (`plan` exits 0 reporting "claim scan: NOT PERFORMED"; `apply` refuses), categorically
unlike the fail-open pair. Sweeping it on a matching *shape* would have been the error this file keeps finding.

**Honesty carried in the artefacts, not just the report.** `ERR_STRING_TOO_LONG` is measured;
`ERR_FS_FILE_TOO_LARGE` is taken from Node's documentation and is **unreachable on this build** — the comment
says which is which rather than letting both read as evidence. The read-failure tests **stage** the window by
denying a read at the point under test and say plainly *"that is not a race and is not evidence of one."*
Environment is probed, never assumed: `truncate` availability, sparse allocation, whether `chmod 000` really
denies, whether the filesystem folds case.

**Final state:** `check:memory` 24 + **108 pass**, `npm run check` 30 of 30, `check:ledger` 0 block. Reviewer
verdict **PASS** at `44560e1` with the two remaining P3s fixed at `58e4821`. Nine rounds; severity ran
P1 → P1 → P1 → clean → P1 → P2 → P3 → P3.

**The lane's own closing summary, which is the most useful sentence produced on this branch:**
> *"The through-line was not any one predicate — each fix's own fixture was shaped by the fix, so the thing it
> dropped, forgot, or concentrated stayed invisible. The countermeasures that actually worked were the
> mechanical ones: enumerate by grep, assert the anchor matched exactly once, and probe the environment
> instead of assuming it. Intent caught none of them."*

**Backlog, latent, not blocking:** the claim scanner hangs on a symlink to a FIFO (outside this tool);
`check-memory-budget.mjs` has the same regex-then-`readFileSync` shape and is a blocking CI script; content
outside `.claude/memory` is reachable through a symlinked volume path; `ERR_FS_FILE_TOO_LARGE` unverified.
