# F2 · r8-contracts-f — the names contract

**What this file is.** Every name lane `r8-contracts-f` registered, and — the part a recheck should read
first — every required contract it did **not** land, with the reason and the cure named. A name not in
this file was not registered by this lane.

**Standing caveat, and it governs every row.** Author-recorded, one model family, awaiting independent
recheck. **No runtime of any kind exists.** Every "check" below is specified behaviour checked offline by
`validate_contracts.py` against the committed registries.

**Base:** `ffeb072` · **Branch:** `docs/vision-r8-contracts-f`

---

## Names registered

| name | kind | finding |
|---|---|---|
| `#/step6_mention_only` + `#/step6_mention_only_why` | JSON keys in `pinned-conjuncts.json` | item 0 (the `F6X-03` RED) |
| `STEP6_RAISED` | validator constant — the three raising forms | item 0 |
| `STEP6_MENTION_ONLY` | validator constant | item 0 |
| `AN EXEMPTION NAMES A FINDING THE CORPUS RAISES` | check | item 0 |
| `THE MENTION-ONLY EXEMPTION NO LONGER MATCHES THE CORPUS` | check | item 0 |
| `THE SET OF RAISED STEP 6 FINDINGS HAS SHRUNK` | check (new floor, 100) | F6AA-08 |
| `R37` · `r37-a-raised-finding-is-excused-as-a-mention` + `r37-the-mention-only-exemption-is-restated-benign` | fixture pair | item 0 |
| `R38` · `r38-a-two-letter-family-finding-loses-its-source-row` + `r38-a-two-letter-family-finding-is-declared-benign` | fixture pair | F6Y-01, F6AA-08 |
| `R39` · `r39-a-finding-declared-answered-by-a-file-that-is-not-there` + `r39-a-finding-crosses-to-answered-with-a-file-that-resolves-benign` | fixture pair | F6Y-08 |
| `F6AA-01..11` | eleven `finding_sources` rows, doc `planning/reviews/F2-06-recheck-05.md` | F6Y-01's class, recurring |

**Constants moved, each comment now stating the value its constant holds (F6AA-07).**
`FINDING_SOURCE_FLOOR` 141 → 152 (committed 152; a floor takes no headroom) ·
`UNANSWERED_CEILING` 67 → 78 (committed 77 + one slot) ·
`NOT_ANSWERED_CEILING` 63 → 71 → 69 (committed 68 + one slot) ·
`ANSWERED_ELSEWHERE_CEILING` 4 → 10 (committed 9 + two slots, one of them F6Y-08's) ·
the three Step 6 floors 81/8/— → 101/100/11 ·
`NEGATIVE_FIXTURE_FLOOR` 112 → 115 · `POSITIVE_FIXTURE_FLOOR` 73 → 76.

---

## OWED — F6Y-02, the structural pairing check. NOT ATTEMPTED BY THIS LANE.

*Required contract: walk the `any` node's branches of
`criterion.ExistenceJustification.admitted.v1` and assert the set of `(reason_kind, reason_unit)`
constant pairs equals `EXISTENCE_REASON_PAIRS`, rather than testing string presence over the serialised
body. Adverse fixture: two units swapped between branches. Paired benign: the six branches in a different
order.*

**Not landed, and not started.** The lane ran out of its turn budget after item 4b. Nothing about it is
blocked that this lane knows of, and lane E's two warnings still stand and are the reason it is not a
small job: the benign twin **as the review words it is not expressible** — the applier patches JSON only,
and any edit to the criterion body alone is refused by the `author_phase_content.py` derivation oracle
before the pairing check is reached — so the adverse fixture needs
`regenerate_from_derivation`, and the shipped benign must be the nearer one (the two `records.schema.json`
enums reordered, which exercises set comparison at the enum layer and not at the branch layer) with the
substitution **stated in the fixture**. `R40` is free.

**The finding is live and its defect is unguarded on this head.** Swapping the `reason_unit` constants of
the `input_provenance` and `consequence_class` branches leaves all twelve strings present, so all six
current checks pass, the pin's `any`/`contains_pointers` row is satisfied, and the derivation oracle
agrees with the swapped criterion. No control in the package refuses it.

## OWED — F6Y-06, the CHECK half. The data half landed; the check did not, and the reason is structural.

*Required contract: assert that a fixture's `finding` citation, where it names a repository path,
resolves, and that `paired_benign_fixture` / `paired_adverse_fixture` resolve to a declared fixture in
the other manifest.*

**The nine dead citations are fixed** (commit `5523cfd`), and a scan of all 191 declarations now reports
zero unresolved citations and zero dangling pairs. **Nothing enforces that**, so the tenth will be as
silent as the first nine.

**Why the check is not simply added.** `run_negative_fixtures.py` symlinks the two **MANIFESTs** into each
scratch tree and **not the fixture bodies**, so inside a fixture run there is nothing for such a check to
read: put it outside the `CONTRACTS_FIXTURE_RUN` guard and it fails on every fixture in the suite; put it
inside the guard and it runs on the real tree but **cannot itself be fixtured**, because the adverse case
the review asks for — a fixture citing a nonexistent review — is not expressible in a tree that carries no
fixtures. An unfixtured check is worth less than a fixtured one and more than nine silent citations, and
this lane judged that shipping it unfixtured while calling the finding answered was the worse of the two.

**Cure, named rather than left:** carry the fixture bodies into the scratch tree, as **copies and not
symlinks** — a patch written through a symlinked directory edits the real fixture, which is why the runner
already copies `tools/` whenever a fixture declares `tools_patch`. That is a change to the runner's tree
construction with its own failure modes, it is an architectural decision this lane's brief did not make,
and it belongs to whoever owns `tools/run_negative_fixtures.py`.

## OWED — F6Y-05, the chapter half.

The contracts half landed: `producer_unauthorable_fields_why` now cites
`record-registry.json#/IdentityBinding/owner_component`, which states the ownership, instead of `02` §4,
which does not. **The second half is a chapter sentence and this lane writes no chapter.** Either `05` §1
or `02` §4 must state the owner of each control field, or the choice must be registered as an open
question with the chapter owner. The two competing chapter claims a recheck should weigh are named in the
row itself: `03` §27 gives C05 validity and lineage, which reaches `content_hash_rechecked_at_use`, and
C06 evidence and acceptance, which reaches `precondition_evaluator_kind`.

## NOT OWED — F6AA-08, F6AA-09, F6AA-10 landed, and not in the commit their item number names.

Item 3's three findings were discharged by the commits that made their repairs necessary, which is why
there is no commit titled "item 3". Recorded here so a recheck does not go looking for one.
**F6AA-08** — the three Step 6 floors, set tight twice: 90/89/10 at item 0 when the demand narrowed to
raisings, then 101/100/11 at item 2 when the two-letter widening landed. There had been no floor on the
raised set at all. **F6AA-09** — `F6Y-01` moved from `not_answered` to `answered_elsewhere` at item 2,
with the file and both check names; its row there had stated a condition the row itself met.
**F6AA-10** — the `why` of `r36-step-6-finding-loses-its-source-row` rewritten at item 1, in the same
commit that made its claim true, because that commit changed what the field describes.

**F6AA-07 and F6AA-10 are repaired and stay in `not_answered` anyway.** Both repairs are *sentences*, and
no check in this package carries the truth of a sentence. A row crosses when a check answers the finding,
not when the finding has been attended to — F6D-05's rule, applied to this lane's own work.
