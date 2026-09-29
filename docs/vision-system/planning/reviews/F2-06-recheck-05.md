<!-- PROVENANCE (orchestrator, ceo-1-1789446032, 2026-09-15). Reviewer: `reviewer` engine, lane `f2-06-recheck-05`; authored nothing in this package; brief carried subject + criteria only (producer accounts, state.json, history.jsonl, session files, names contracts and handoffs barred). Subject: `95ca14d`; root HEAD advanced to `a2effbd` during the review (five paths, none read by the reviewer at HEAD; the one working-tree measurement over a moved file was re-taken at 95ca14d and matched). Validator and fixture runners not run by instruction (the split suite was executing on the machine). Return channel: truncated at ~4k; this file is the reviewer's final transcript message extracted verbatim from the subagent transcript (53,838 chars; sha256 of the body recorded in history.jsonl). Verdicts: F6Z-02..09 and F6Y-01 CLOSED at specification level; F6Z-01 PARTIAL (MD-02 answered over a narrowed question); 0 regressions. New findings F6AA-01..11, all class (a), none (d), none blocking under protocol §8. NOTE on ids: the orchestrator named the new family `F6AA`; validate_contracts.py's STEP6_ID pattern matches one-letter families only, so these ids are outside the finding sweep's reach until a contracts lane widens the pattern and adds their finding_sources rows — recorded as owed, not hidden. One model family; procedural independence only; no runtime exists. -->

## Précis

Ten items rechecked at `95ca14d`: nine prose findings (F6Z-01 … F6Z-09) and one contracts finding (F6Y-01). **Nine CLOSED at specification level, one PARTIAL (F6Z-01). No regressions. Eleven new findings, all class (a), none class (d), so nothing here blocks under protocol §8.**

The consequential ones in plain words:

- **The founder's answer to Q-017 is stated over a question narrower than the one the packet asks.** The attack consolidation defines MD-02 as *"which standing roles **or holders** are staffed by a person other than the founder…"*. Chapter 05 restates it with *"or holders"* removed, then says both halves are answered. The four layer-5 holders the same section still counts in its own denominator get no staffing answer anywhere. (F6AA-01)
- **The disposition that closes AC-M4-02 escalates to the party whose silence triggered it.** The paragraph says that on no answer the middle two consequence classes escalate on a timer to the standing holder, "which under this decision is the founder himself" — the party who by hypothesis did not answer. §2's fallback covers a duty class with *no admitted holder*, and R-D09's stop covers an *unfilled* role. A filled-but-absent holder falls in neither. (F6AA-02)
- **The repair for F6Z-04 wrote a fresh present-tense claim about a register that the package falsified two commits later.** Chapter 05 says AD-021's `epistemic_basis` "still closes" a sentence it no longer closes, and is "owed" an update that commit `740764c` already made. The tense fix the finding asked for did land; the new clause beside it did not survive the session. (F6AA-03)
- **The contracts repair is sound and its two new ceilings state a number neither constant holds.** Recomputed: `unanswered` is 66 against a constant of 67, `not_answered` is 62 against 63. The extra slot is deliberate — the paired benign fixture needs it and says so — but the reason is recorded only in the fixture, while each constant's own comment states the tight value. (F6AA-07)

The Q-017 bucket arithmetic recomputes exactly: 3 + 6 + 32 + 5 = 46, every CAP id in exactly one bucket, against the re-run's own id lists. The ten-to-nine consolidation-finding count recomputes. The widened Step 6 sweep reaches all ten families the corpus states, and all 89 ids now hold source rows.

## Provenance

**Subject.** `95ca14dc6986e4fbb70818a0fdd498e8c3341566`, branch `ceo-1-1789446032`, worktree `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-1-1789446032`.

**HEAD moved under me, and I did not follow it.** `HEAD` is `a2effbd` at the close of this pass. `git diff --name-only 95ca14d HEAD` reports five paths: `docs/08-agents_work/sessions/2026-09-15-builder-r8-prose-e.md`, `docs/vision-system/history.jsonl`, `docs/vision-system/planning/reviews/F2-06-findings-index.json`, `docs/vision-system/planning/specification/05-work-agents-skills.md`, `docs/vision-system/state.json`. I read none of their content at HEAD. Because `05-work-agents-skills.md` is among them, I re-took the one measurement I had run against the working tree over that directory — the R-X07 / `capability_refs` / wording counts — at `95ca14d` with `git grep <sha>`, and the figures were identical. Everything else I read from the working tree (`registers/decisions.json`, `predicate-registry.json`, `pinned-conjuncts.json`, `validate_contracts.py`, the fixture manifests and files, `tools/run_negative_fixtures.py`, the nine `F2-06-*.md` reviews) is unchanged between `95ca14d` and `a2effbd`, which the same path list establishes.

**Criteria.** `docs/vision-system/planning/F2/00-acceptance-protocol.md`, read in full — §5 finding classes, §7 evidence rules, §8 disposition rules, the standing caveat. Lenses `evidence`, `correctness`, `scope` from `.claude/review-lenses.yml` as named in my brief.

**Subject files read, all at `95ca14d` unless noted.** `planning/reviews/F2-06-recheck-04b.md` (§2 item 9 and §3, for each F6Z finding's statement and required contract); `planning/reviews/F2-06-recheck-04a.md` (§2 F6R-01/F6R-03 and §4, for F6Y-01); `planning/specification/05-work-agents-skills.md` (the eleven changed lines, §2, §11, §12, §13, and every MD-02 site); `planning/specification/07-integrations-capacity.md` line 113; `planning/F2/04-attack-consolidation.md` (two cited rows only); `planning/F2/09-q017-conjunction-rerun.md` §2–§4 (the id lists the repair cites); `registers/decisions.json` (AD-021's `epistemic_basis` alone); `planning/specification/contracts/predicate-registry.json` (`guard.launch.actual_compared_to_expected` alone); `planning/specification/contracts/pinned-conjuncts.json`; `planning/specification/contracts/validate_contracts.py` (lines 1670–1800, 2490–2560, 2980–2995); the two fixture manifests, `r36-step-6-finding-loses-its-source-row.json`, `r36-a-declared-family-gains-a-finding-benign.json`, and the match logic of `tools/run_negative_fixtures.py`; the nine `planning/reviews/F2-06-*.md` documents, read only by regex for finding ids.

**Bounded existence checks, declared.** Three citations were opened for their cited range and nothing else. `04-attack-consolidation.md` rows 132 and 240, to settle whether AC-M4-02's required-repair quote and MD-02's question are stated as the chapter says. `09-q017-conjunction-rerun.md` §2–§4, because recomputing 3 + 6 + 32 + 5 = 46 requires the id lists the chapter cites to it. `registers/decisions.json`, because the repaired passage quotes AD-021 and asserts its current state. In each case I read the cited range, settled whether it says what the citing sentence claims, and carried nothing else out.

**What I did not run, and what that costs.** I executed no Python: not `validate_contracts.py`, nothing under `contracts/tools/`, and no fixture runner. Every contracts verdict below is about **content, not executability**. I recomputed the partition, the ceilings, the floors and the Step 6 sweep by parsing `pinned-conjuncts.json` and by running the validator's own regex over the review corpus in a separate interpreter — so I can say what the numbers *are*, and I cannot say the file passes its own validator, nor that the r36 pair behaves as declared when the runner executes it.

**Barred paths, honoured in full.** I opened none of: `state.json`, `history.jsonl`, anything under `docs/08-agents_work/sessions/`, `planning/F2/07-repair-names-contract.md`, `planning/F2/08-repair-names-prose-b.md`, any `planning/HANDOFF-*.md`, or the `status`/`disposition` text of `registers/review-findings.json` and `planning/reviews/F2-06-findings-index.json` — I read neither of those two JSON files at all. Two session files for the producing lanes are visible in the commit ranges and I opened neither. I read no lane's account of its own work.

**Independence, in my own words.** I share one model family with the authors of all ten repairs. What separates me from them is procedural and I will not describe it as more: a separate context, no authorship anywhere in this package, no `Write` or `Edit` tool with which I could have produced or altered any of it, and no exposure to any producer's self-assessment. That rules out one failure mode — a reviewer agreeing with a rationale it was shown — and rules out nothing about correlated error. Where the authors and I share a blind spot, this pass did not find it, and my agreement with them is weak evidence. This is not an independent panel; protocol §1 requires two distinct model families for that and there is one here.

## 1. Per-item verdicts

| Item | Class | Verdict | New findings raised |
|---|---|---|---|
| F6Z-01 — MD-02 open in four places, answered in two | (a) | **PARTIAL** | F6AA-01, F6AA-04 |
| F6Z-02 — R-X09's universal sentence unamended | (a) | **CLOSED at specification level** | — |
| F6Z-03 — "the other 32" is 41; five ids undisposed | (a) | **CLOSED at specification level** | F6AA-06, F6AA-11 |
| F6Z-04 — AD-021 quoted as "correctly" recording | (a) | **CLOSED at specification level** | F6AA-03 |
| F6Z-05 — parking cited to §5, which lacks it | (a) | **CLOSED at specification level** | F6AA-02, F6AA-05 |
| F6Z-06 — the honest limit understates itself | (a), low | **CLOSED at specification level** | — |
| F6Z-07 — "Every row is SPECIFICATION" over DECISION rows | (a), low | **CLOSED at specification level** | — |
| F6Z-08 — "an admitted procedure version" vs two states | (a), low | **CLOSED at specification level** | — |
| F6Z-09 — R-X07's "every standing structure" | (a), low | **CLOSED at specification level** | — |
| F6Y-01 — the Step 6 sweep omits a review family | (a), high | **CLOSED at specification level** | F6AA-07, F6AA-08, F6AA-09, F6AA-10 |

**The diff is bounded and every edit is attributed.** Prose lane D's range `35f0710..44a317c` changes exactly eleven lines: `05:3`, `:350`, `:352`, `:364`, `:374`, `:378`, `:380`, `:386`, `:402`, `:407` and `07:113`, each a one-for-one replacement, so the line numbers the findings cite are stable at the subject. Every one carries a dated amendment note naming its finding. `planning/02-architecture-selection.md` and `registers/decisions.json`, both named as possibly touched in my brief, are **not** in that range — the register was changed separately, in `740764c`, which is F6AA-03's subject. The prose files are byte-identical between `44a317c` and `95ca14d`; the contracts files are byte-identical between `f512da5` and `95ca14d`. I found no silent change inside either range.

## 2. Evidence per item

### F6Z-01 · PARTIAL

**Required contract.** Reconcile all four sites in one edit: state at `05:386` and `05:407` whether the founder's answer closes AC-M3-02, AC-M4-01 and AC-M4-02 or which survive it; correct the packet count if it falls to five; amend `05:3`'s *"None is closed here"* with the date and the packet; if the three (d)s survive, say what each still needs.

**What the diff shows.** All four named sites moved. `05:3` now carries *"**DECISION (founder, 2026-09-14, [Q-017]) — none of the six is closed entire and one is narrowed: MD-02's staffing question is answered, and AC-M4-02 closes with it**"*, and *"None is closed here"* survives only inside the quoted supersession note. The packet list reads *"**MD-02** (AC-M3-02 · AC-M4-01 — **AC-M4-02 closed 2026-09-14**)"*. `05:386`'s heading is now *"**The founder decisions this section depends on. Five are not taken here; the sixth, MD-02, was answered on 2026-09-14 and is recorded below as narrowed rather than closed.**"*, and its MD-02 row states what each survivor needs — AC-M3-02's counting half, AC-M4-01's sampling limb. `05:407` reads *"**six founder packets open, subsuming nine (d)-class consolidation findings**"*. The closing sentence at `:386` is now quantified: *"Until each **of the five unanswered packets** is answered…"*.

**Recomputed.** The ten-to-nine move closes. Summing the ids the header lists per packet: MD-01 two, MD-02 three, MD-03 one, MD-04 one, MD-07 two, MD-08 one = **10**; with AC-M4-02 marked closed, **9** remain open. The packet count correctly does not fall to five, and the header says why. `05:356`, which F6Z-01 counted among the four, already read *"the packet stays open"* and already carried an amendment recording Q-017 as answered, so it needs nothing.

**Why PARTIAL.** Two things the contract did not name are unreconciled, and one of them is not a site but the question itself. `05:386` restates MD-02 as *"which standing roles are staffed by a person other than the founder…"*, where `04-attack-consolidation.md:240` defines it as *"Which standing roles **or holders** are staffed by a person other than the founder…"* — then declares *"Both halves are answered in §12."* (F6AA-01). And `grep -n 'MD-02'` over the chapter returns six sites, of which `05:207` and `05:395` still state MD-02 in its pre-decision form (F6AA-04).

**Named because it should survive.** The repair kept the packet count at six and explained why rather than letting a narrowing read as a closure, and it recorded AC-M4-02's closure against the consolidation's own required-repair text rather than against its own judgement. I verified that quote: `04-attack-consolidation.md:132` reads *"Name the alternate as a role with its own admission and funding, or mark H9 a declared exception with the parking behaviour stated as the consequence"*, and the chapter's two quotations of it are exact.

### F6Z-02 · CLOSED at specification level

**Required contract.** Amend `05:350` in the package's own supersession form — quote the universal text, date it, restate the rule over the set the answer leaves standing.

**What the diff shows.** `05:350` now opens *"**SPECIFICATION — an admitted standing acceptance-owner role is a record (R-X09), and after 2026-09-14 that set is three roles, not 46.**"*, names the set — *"**CAP-22, CAP-42, and CAP-31 on its day-five arm only** … **plus any of the six flagged candidates later admitted**"* — states that *"**The 32 that dissolve are not records under this rule**"*, and carries the superseded text verbatim in a dated `*Amended 2026-09-14 (F6Z-02)*` note that reproduces the re-run's identification of this sentence as the target. All three clauses of the contract are met at one site. The two sentences that quantified over the same set in opposite directions now agree.

### F6Z-03 · CLOSED at specification level

**Required contract.** Name CAP-04, CAP-14 and CAP-39 as merged residues into CAP-22 and CAP-42, name CAP-16, keep CAP-17 as UNKNOWN, so that 3 + 6 + 32 + 5 = 46 closes on the page.

**Recomputed against the re-run's own lists, read at `09-q017-conjunction-rerun.md` §2–§3.**

| Bucket | Ids | Count |
|---|---|---|
| Stands | 22, 31, 42 | 3 |
| Flagged | 21, 23, 25, 27, 30, 41 | 6 |
| Dissolve (§3's enumerated list) | 01,02,03,05,06,07,08,09,10,11,12,13,15,18,19,20,24,26,28,29,32,33,34,35,36,37,38,40,43,44,45,46 | 32 |
| Fourth category | 04, 14, 16, 17, 39 | 5 |
| Total | | 46 |

Every CAP id falls in exactly one bucket, and the union is the full 46. The chapter's added text names CAP-04 and CAP-14 as merging into CAP-22 and CAP-39 into CAP-42 and CAP-22 — faithful to §3, including the R-X08 attribution. CAP-16 is named. CAP-17 is kept UNKNOWN at both `:374` and `:380`. The `capability_refs` justification for stating the fourth category at all — *"a capability no structure names is uncovered, not covered by default"* — is the chapter's own rule from `:352` and is correctly applied.

**Two residues, both new findings.** The bucket is defined as *"five neither stand, dissolve nor are flagged"* and CAP-16 is then declared *"dissolved"* three clauses later (F6AA-06). And the chapter now carries two different 41s six lines apart without distinguishing them (F6AA-11).

### F6Z-04 · CLOSED at specification level

**Required contract.** Put the quotation in the past tense and date it, naming this landing as what ended it; and record that AD-021's `epistemic_basis` is owed a corresponding update by whoever owns the register.

**What the diff shows.** *"records — correctly — that"* became *"recorded — correctly **at the time it was written, and no longer** — that"*, followed by *"**That state ended with this paragraph's own landing on 2026-09-14 (F6W-01)**"* and an OWED clause naming the register. Both halves of the contract are met.

**Recomputed.** The claim the amendment makes about the specification directory holds at `95ca14d`: `git grep -o 'R-X07'` over `planning/specification/*.md` returns **8** hits and `capability_refs` returns **11**. The chapter's separate honesty clause also still holds — `git grep -l 'capability_refs'` under `contracts/` returns **0**, so *"specified and unregistered"* is accurate, and the contracts lane did not quietly change it.

**The new clause did not survive the session** — see F6AA-03.

### F6Z-05 · CLOSED at specification level

**Required contract.** Repoint the citation to §2's per-class disposition and R-X09, and state which reached classes park and which refuse with a packet; or, if the behaviour is new, label it DECISION, define the undefined phrase, and say what it does and does not settle of MD-03's third clause.

**What the diff shows.** The lane took the first branch and delivered the second's last clause as well. `05:378` now reads *"that behaviour is §2's rather than a new rule"*, restates all three bands, cites `(§2, with §11's rule that every reached class's gates apply)`, separates the admission stop — *"**Separately and independently**, admission in the class stops while the role is unfilled (R-X09; §2, R-D09) — a stop on an unfilled office, not on an unanswered duty"* — and adds *"**UNKNOWN — what this does not settle:** MD-03's third clause…"*. The phrase *"recorded bounded state"* is gone from the live text and survives only in the quoted note.

**Citations verified at the subject.** `05:45` carries the disposition the repair restates, in §2 as the finding said: *"At the two lowest reached classes the work **parks** with an owner and a review date. At the middle two it **escalates on a timer** to the standing holder for that duty class (§12) … At the two highest it is **refused**, and a decision packet is routed to the human authority named in [`04-human-operation.md`]'s `AuthorityMatrix`."* `05:316` in §11 carries *"**Every reached class's gates apply.**"* and *"no seventh class is added"*, so six classes make the three bands a complete partition. Both citations resolve.

**Two residues.** The restatement drops §2's own branch for a duty class with no admitted standing holder, and the branch it keeps routes to the absent party (F6AA-02). And `05:370`, which the diff did not touch, still states MD-03's third clause as *"what happens during a founder absence"*, while `:378`'s UNKNOWN rests on reading it as *"who the **person** is"* (F6AA-05).

### F6Z-06 · CLOSED at specification level

**Required contract.** State it as the re-run does — all 41 still need a human at acceptance time, and 37 to 38 are additionally released from waiting on a pre-staffed office — and cite `planning/F2/09-q017-conjunction-rerun.md` §4 by path.

**What the diff shows.** `05:380` now reads *"**all 41 of the human-acceptance capabilities still need a human at acceptance time** — that requirement is untouched … and **37 to 38 of the 41 are additionally released from waiting on a pre-staffed office**"*, names the gated roles — *"CAP-22, CAP-42, CAP-31 on its day-five arm, and CAP-17 if the founder resolves its preserved dissent"* — and carries the path citation the contract asked for, which no passage in §12 had.

**Recomputed.** 41 − 3 = 38 and 41 − 4 = 37, so the 37-to-38 range and the 3-to-4 gated set are consistent. The re-run §4 is quoted faithfully: *"at most 4 remain legitimately gated … The other **37 to 38** keep needing a human at acceptance time — that requirement is untouched."* The sentence now runs in the unflattering direction, which is the paragraph's stated purpose.

### F6Z-07 · CLOSED at specification level

**Required contract.** Amend the preamble to except the founder decisions marked DECISION, or move the three decisions into the DECISION paragraph.

**What the diff shows.** `05:364` now reads *"*Every row is SPECIFICATION except the clauses marked* **DECISION (founder, 2026-09-14, [Q-017])** *in the first three rows, which record what one party chose and not what the design requires.*"*

**Recomputed.** The table at `:366`–`:371` has five body rows. Rows one, two and three — personal data and deletion scopes, grievance and rights, continuity and on-call — each carry a `DECISION (founder, 2026-09-14, [Q-017])` clause. Rows four and five, the reserved lane and "any other proposed holder", carry none. "The first three rows" is exact, and the amendment note's "three of the five rows" is exact.

### F6Z-08 · CLOSED at specification level

**Required contract.** Say "an admitted or restricted procedure version" at `05:402` and `07:113`, in one edit.

**What the diff shows.** Both lines now read *"the run's definition to be an **admitted or restricted** procedure version"*, changed in the single commit `120cdc9`. At `95ca14d`, `git grep -c 'admitted or restricted'` over `planning/specification/*.md` returns one hit in each of the two chapters, and the two surviving occurrences of *"an admitted procedure version"* are on those same two lines, inside the quoted supersession notes.

**Verified against the registry, by parsing, not by running.** `predicate-registry.json`'s `guard.launch.actual_compared_to_expected` body is `{"op": "all"}` over two predicates: `nonempty_fields` over the three pointers, and `related_phases` binding `/payload/workflow_ref` with `"states": ["admitted", "restricted"], "optional": false`. Both states, non-optional, exactly as the repaired chapters now say. The guard still carries no comparison operator, so the earlier F6W-05 correction on the same lines stands.

### F6Z-09 · CLOSED at specification level

**Required contract.** State the closure explicitly, or say what admits a new member.

**What the diff shows.** The heading is narrowed to *"every standing structure **that owns a capability's acceptance** publishes its `capability_refs`"*, and the body adds *"**SPECIFICATION — that set is closed and named rather than open: the standing structures R-X07 reaches are exactly `StandingHolder` and the acceptance-owner role record.**"* with `StandingInterest` excluded by a stated reason — it *"may arm but never admit, and binds no capability's acceptance"* — which matches §7's role for it. The contract asked for one of the two branches and the repair supplies both.

**Observation, not a finding.** *"That set is closed"* and *"A new member enters this set only by being a structure that owns a capability's acceptance, admitted through §12's five-part path"* are in tension read literally. The ordinary reading — enumerated at this commit, extended only by the named path — is clear enough that an implementer is not left to guess, which is what the finding asked for. I record it and do not raise it.

### F6Y-01 · CLOSED at specification level

**Required contract.** *"Derive the family set rather than writing it, **or** assert the pattern's own coverage: sweep `F6[A-Z]-\d\d` over the corpus and refuse any family letter not in a declared, hand-written literal, so adding a family is an edit a reviewer sees. Add `finding_sources` rows for `F6W-01…08`, and place each in exactly one half of the partition. Adverse fixture: a review document raising a finding in an undeclared family. Paired benign: a review document raising a finding in a declared family that already has a row."*

**The family set is NOT derived from the corpus, and the contract's own second branch is what the lane took.** `validate_contracts.py` now carries `STEP6_FAMILIES = ("F6A", "F6B", "F6C", "F6D", "F6R", "F6V", "F6W", "F6X", "F6Y", "F6Z")` as a hand-written literal, with `STEP6_ID = re.compile(r"\b(F6[A-Z]-[0-9][0-9])\b")` derived over the corpus and `checked(set(_step6_families) <= set(STEP6_FAMILIES), …)` as the containment assertion. The lane states the refusal and its reason in the comment: *"the literal is not derived from the corpus, because a literal derived from the file it measures is satisfied by the empty file."* My brief asked me to verify derivation, which is the contract's first branch; the finding's own required contract offers the second as an equal alternative, and the criteria are the contract's. Judged against it, this is met — and the reasoning for preferring the literal is the same reasoning the rest of the file applies to every floor in it.

**Recomputed over the corpus, by running the validator's regex in a separate interpreter.** Nine documents match `F2-06-*.md` at the subject. The widened pattern returns **89 ids in 10 families**: F6A 12, F6B 11, F6C 19, F6D 12, F6R 4, F6V 4, F6W 8, F6X 2, F6Y 8, F6Z 9. The old `F6[A-DRVX]` pattern returns **64**. The families found are exactly the ten declared, so the containment check passes and nothing is outside the required set. **F6W, F6V, F6Y and F6Z are all reached.**

**The 25 rows, recomputed from `pinned-conjuncts.json`.**

| Quantity | Value |
|---|---|
| `finding_sources` | 141 (floor 141) |
| Step 6 ids missing a source row | 0 of 89 |
| New rows F6W-01…08, F6Y-01…08, F6Z-01…09 | 25, all present |
| Of those, in `not_answered` | 25 |
| Of those, in `answered_elsewhere`, `covered` or `unpinnable` | 0 |

**Placement is defensible against F6R-01's four rules, with one exception.** The union of `answered_elsewhere` (4) and `not_answered` (62) equals `unanswered` (66) exactly; the halves are disjoint; no row has a blank reason; every `answered_elsewhere` row names a file. The F6W rows say the conservative half is where an unestablished answer belongs, which is F6R-01's own stated rule. The F6Z rows say *"This lane writes no chapter and cannot name the file and check that answer a prose finding"* — correct, and correct at the time: prose lane D's repairs landed in a different range. The exception is F6Y-01's own row, which is F6AA-09.

**The fixture pair mutates the thing the finding names and expects the string the check emits.** `fixtures/negative/r36-step-6-finding-loses-its-source-row.json` removes `/finding_sources/F6W-04` and `/not_answered/F6W-04` — F6W being the family the old pattern could not see — and declares `expect_failure_contains: "A STEP 6 FINDING IS RAISED IN A REVIEW AND HELD BY NO SOURCE ROW"`. The per-id check at `validate_contracts.py:2544` emits exactly that as the first clause of its message. Removing both pointers rather than one is right: removing only the source row would leave F6W-04 in `not_answered` but out of `unanswered`, and the partition equality would fail first with a different message. The runner matches on the string (`run_negative_fixtures.py:322`, `wanted not in output` → `wrong_reason` → not ok). The benign twin adds `F6X-03` to both tables in a declared family and expects a pass. Both manifests were raised by one, and the declared counts match the tree: negative 112 declared, 112 present (103 `<id>.json` plus 9 `<id>/` directory fixtures, both shapes declared in the manifest); positive 73 declared, 73 present.

**Named because it should survive.** The sweep now carries two vacuity guards the finding did not ask for — a family-count floor so the containment check cannot pass over an empty set, and the id floor — and the lane wrote down what it deliberately did not do and why. Four residues follow, all small: F6AA-07, F6AA-08, F6AA-09, F6AA-10.

## 3. New findings

### F6AA-01 · class (a) · medium-high · MD-02's question is restated with one of its two subjects removed, and the narrowed version is declared fully answered

**Governing requirement.** Protocol §5 (a) and §7 — an inference presented as fact. The `evidence` lens on whether a restatement is faithful to the source it claims to restate.

**Site.** `05:386`, against `planning/F2/04-attack-consolidation.md:132` and `:240`, and against `05:380` and `05:364` row 4.

**Statement.** `04-attack-consolidation.md:240` defines the packet as *"**Which standing roles or holders are staffed by a person other than the founder before work is admitted in that class, and what happens in a class where none is**"*. `05:386` restates it as *"The question was which standing roles are staffed by a person other than the founder before work is admitted in that class, and what happens in a class where none is"* — dropping *"or holders"* — and then states *"**Both halves are answered in §12**"*. Q-017's answer is over the 46 acceptance-owner roles only.

**Counterexample, computed.** The chapter's own arithmetic keeps the holders outside the answer. `05:380` states the post-decision standing infrastructure as *"roughly 3 roles + 3 alternates + **the 4 layer-5 holders + their 4 alternates**"* — so four `StandingHolder` records persist after the answer. The holder table at `05:364` lists five holder kinds; three carry a `DECISION` clause and two do not, and row four, the reserved lane, reads *"**exercised only at 4× demand … Recorded as owed, not as passed**"* with no staffing statement anywhere. So for the holders half of MD-02's own question the chapter names neither who staffs them nor what happens in a class where nobody does.

**Resulting failure.** `05:407` is the sentence protocol §8 governs and a downstream reader quotes, and it now records nine open (d)s on the strength of AC-M4-02 closing. AC-M4-02 is the *holder* finding — `:132` reads *"H9 is the founder, **every holder must carry an alternate**, and H9's alternate is unnamed"* — so the packet's holders subject is exactly where the closure is claimed, and it is the subject the restatement drops. A reader checking whether MD-02 is fully answered is checking the narrowed question.

**Required contract.** Restate MD-02 at `05:386` in the consolidation's own words, including *"or holders"*, and state for the four layer-5 holders either that the founder's answer reaches them or that it does not and this limb of the packet survives with AC-M3-02's and AC-M4-01's. If it does not reach them, `05:3` and `05:407` should say the packet is narrowed on its roles subject only.

**Blocks under §8?** No. Class (a): the decision exists and is recorded; the chapter's account of what it answers is what is wrong.

**Confidence.** High. Both texts are quotations and the persistence of the four holders is the chapter's own figure at `:380`.

### F6AA-02 · class (a) · medium · The disposition that closes AC-M4-02 escalates the middle two classes to the party whose non-answer triggered it

**Governing requirement.** Protocol §5 (a) — a rule an implementer must complete by inventing policy is not concrete enough to implement. Protocol §5 (d) example 2 is named below and I do not apply it.

**Site.** `05:378`, against `05:45` (§2) and `05:47` (R-D09).

**Statement.** `05:378` reads *"**SPECIFICATION — on no answer the work takes §2's per-reached-class disposition, and no branch of it proceeds on a default:** … at the middle two it **escalates on a timer** to the standing holder for that duty class, **which under this decision is the founder himself**"*. The paragraph's premise is that the founder, holding all three roles as a declared exception, has not answered. The escalation target is that same party, and no further step is named.

**Counterexample, computed.** §2 at `05:45` has a fallback for this shape and the repair's restatement omits it: *"and **where that duty class has no admitted standing holder** the escalation goes to the ordered custody resolver of [`03-company-capabilities.md`], whose last tier is the designated maintenance/discovery custodian"*. That branch is gated on *no admitted holder*, and under this decision the three classes each have one. R-D09 at `05:47` is gated the same way — *"When a standing acceptance role is **unfilled or suspended**, admission of new work in that duty class stops"* — and a role held by the founder is filled. A filled-but-unresponsive holder is reached by neither branch, so an implementer asked what happens when the timer expires must choose between waiting, re-escalating and refusing.

**Resulting failure.** AC-M4-02's accepted repair is *"mark H9 a declared exception **with the parking behaviour stated as the consequence**"*, and `05:3`, `:386` and `:407` all rest the closure on the consequence being stated. For the two lowest classes it is stated, and for the two highest it is stated. For the middle two it terminates at the absent party.

**Why (a) and not (d), and I name the branch rather than resolving it.** The chapter does not leave the founder-as-terminus problem silent: it records grievance-route independence as OWED *"before the first venture carries an outward obligation"*, and it names MD-03's third clause as untouched. It also states that for these three duties *"**refusal with a decision packet, not parking, is the disposition to expect**"*, so the middle band is characterised as the unusual case rather than the normal one. A reader could class this (d) on the ground that an implementer must invent the timer's terminal behaviour; I class it (a) because the disposition for the expected case is determinate and the residue is named elsewhere in the same paragraph, and I state that branch rather than resolving it in the subject's favour.

**Required contract.** State what the escalation timer does when the standing holder for a class is the declared exception and does not respond — either extend §2's custody-resolver fallback to a filled-but-unresponsive holder, or say that for the three exception-held roles the middle two classes refuse with a packet like the two highest. One sentence at `05:378` settles it.

**Confidence.** High for the omission and the two gating conditions, all quotations. Medium for the reading that the middle band is reachable for these three duties, which the chapter implies rather than states.

### F6AA-03 · class (a) · medium · The OWED clause the F6Z-04 repair added is false at its own subject commit

**Governing requirement.** Protocol §7 — an inference presented as fact; the `evidence` lens on whether a citation supports the claim attached to it. This is F6Z-04's own defect class, one turn later.

**Site.** `05:352`, against `registers/decisions.json`, AD-021's `epistemic_basis`.

**Statement.** `05:352` reads *"**OWED, and the prose lane cannot make it:** AD-021's `epistemic_basis` in [`registers/decisions.json`] **still carries that sentence verbatim and still closes** "That coverage discipline is carried by the F2 selection record alone, and is recorded here as outstanding, not as specified" — **it is stale as of 2026-09-14 and is owed a corresponding update from whoever owns the register.**"*

**Counterexample, computed.** Bounded read of that field alone at `95ca14d`. The DID-NOT-LAND sentence is still present, so the first clause holds. The field no longer **closes** with the quoted sentence: it closes with *"[Superseded 2026-09-14: R-X07 landed in 05-work-agents-skills.md §12 on 2026-09-14 (F6W-01 repair, r7-prose-c); the statement that it did not land was correct when written and is stale now. **Recorded by the orchestrator per F6Z-04.**]"*. And the update is not owed: `git log -- registers/decisions.json` names `740764c`, *"registers, state and history record the prose-d repairs; AD-021 dated as superseded"*, and the bracket is absent at `44a317c` and present at `95ca14d`. Two of the clause's three assertions are false at the subject.

**Resulting failure.** The paragraph tells a reader that a sibling register is stale and that someone still owes the correction. The correction was made, by the party the bracket names, citing the very finding this repair answers. A reader acting on the sentence would redo work already done, or would conclude the register is untrustworthy when it is current.

**Why this is not the lane's error and is still a defect.** The clause was true when `120cdc9` wrote it and was falsified by a commit three later in the same session, which did not touch the chapter. The class is what matters: F6Z-04 was raised because a present-tense claim about a register sat inside the paragraph that falsified it, and the repair replaced it with a different present-tense claim about the same register.

**Required contract.** Replace the OWED clause with a dated past-tense record — that the update was owed, and was made in `740764c` — or, better, state the register's current content rather than its currency, since a sentence asserting another file's state rots every time that file changes.

**Blocks under §8?** No.

**Confidence.** High. Both texts are quotations and the commit is named.

### F6AA-04 · class (a) · low · Two further MD-02 sites still state the packet in its pre-decision form

**Governing requirement.** Protocol §5 (a). F6Z-01's own governing rule, at the two sites its passage list did not name.

**Sites.** `05:395` and `05:207`.

**Statement.** `05:395`, row 2 of the §13 self-audit table against the (d)-class frame, reads *"**Residual: who staffs that standing holder is MD-02**"*. `05:386` now states that MD-02's staffing question is answered — *"**none** — the founder holds all three confirmed roles himself as a declared exception"*. `05:207` reads *"**UNKNOWN — founder parameter, no default:** … who performs the enumeration where the dependency is a professional obligation (MD-02)"*, a question that is neither of the two halves `05:386` says MD-02 consists of.

**Counterexample, computed.** `grep -n 'MD-02'` over the chapter at `95ca14d` returns six lines: 3, 207, 356, 386, 395, 407. Four were reconciled by the repair. `:395` sits in the table whose stated purpose is walking the (d)-class checklist item by item, which is the same section F6W-05's amendment note calls out for exactly this — *"the one inside this chapter's own self-audit table … promised a comparison the registry deliberately omits"*.

**Resulting failure.** A reader who goes to the (d)-class self-audit — the natural place to check whether a (d) is open — reads the pre-decision answer, and a reader at `:207` reads an UNKNOWN attributed to a packet the chapter says has exactly two halves, both answered.

**Required contract.** At `05:395`, restate the residual as the surviving limbs — AC-M3-02's counting half and AC-M4-01's sampling limb — or as the holders subject if F6AA-01 resolves that way. At `05:207`, either attribute the enumeration question to the packet that actually carries it or state that it is a third residue MD-02 subsumes.

**Blocks under §8?** No.

**Confidence.** High. All three passages are quotations and the site list is a grep.

### F6AA-05 · class (a) · low · MD-03's third clause is characterised two ways in one section, and the repair's UNKNOWN rests on the narrower one

**Governing requirement.** Protocol §5 (a) — a rule whose scope an implementer must guess.

**Sites.** `05:370` and `05:378`.

**Statement.** `05:370`, the continuity row of the holder table, reads *"turns on MD-03's unanswered third clause, **what happens during a founder absence** (§7)"*. `05:378` reads *"MD-03's third clause, **who the human approver is** during a founder absence, is untouched by it — §2 says what happens to the *work*, and MD-03 asks who the *person* is."*

**Counterexample, computed.** The two sentences state the same clause with different subjects, eight lines apart, and the repair's disclaimer is sound only under `:378`'s reading. Under `:370`'s reading — *what happens* during a founder absence — §2's per-class disposition, which `:378` has just restated in full, is an answer to it, and the repair would then be supplying an answer the table three rows above records as owed. That is the second half of what F6Z-05 raised, and the repair addressed it by asserting the distinction at one site without amending the other.

**Resulting failure.** Whether a (d)-subsuming packet's third clause is answered by this section depends on which of two sentences in the same section a reader takes as its statement.

**Required contract.** Amend `05:370` to `:378`'s formulation, or amend `:378` to say which part of `:370`'s broader clause §2 does settle and which it does not.

**Blocks under §8?** No.

**Confidence.** High for the two passages, which are quotations. The reading that they are not interchangeable is mine, and `:378`'s own *work*-versus-*person* contrast is the evidence for it.

### F6AA-06 · class (a) · low · The fourth bucket is defined as "neither … dissolve …" and its member CAP-16 is then declared dissolved

**Governing requirement.** Protocol §5 (a) and §1, compute rather than trust. This is F6Z-03's defect class inside the repair for F6Z-03.

**Site.** `05:374`.

**Statement.** *"**SPECIFICATION — and five neither stand, dissolve nor are flagged, so that the buckets sum on the page: 3 + 6 + 32 + 5 = 46.**"* Three clauses later: *"**this chapter carries CAP-16 as dissolved with that dissent named, and not as a silent absence.**"* The intervening sentence also uses *"flagged"* in a second sense — *"**Two were flagged with a dissent**"* — of CAP-16 and CAP-17, which are precisely the two the bucket line says are not flagged.

**Counterexample, computed.** The re-run's §2 table gives CAP-16 the verdict `DISSOLVES`; its §3 enumerated dissolve list of 32 omits CAP-16, which is how the fourth bucket reaches five. So the chapter's dissolved set has 32 members by the arithmetic sentence and 33 by CAP-16's row, and an implementer counting per-case-acceptance capabilities from this paragraph gets whichever they read.

**Resulting failure.** Small, and exactly the kind the amendment note beside it describes: *"The 32 is the founder's own figure and is not the defect; the arithmetic frame this chapter put around it was."* The new frame closes on the ids and reopens on the words.

**Required contract.** State the fourth bucket by what it is rather than by what it is not — *"five that the founder's three-bucket answer does not place"* — and say explicitly that CAP-16's disposition is dissolution outside the founder's 32, so that the 32 and the 33 are both traceable.

**Blocks under §8?** No.

**Confidence.** High. All passages are quotations and the id sets are recomputed from the re-run's own lists.

### F6AA-07 · class (a) · low · Two new ceilings each state, in their own comment, a value the constant does not hold

**Governing requirement.** Protocol §7 — a figure carried without the context that makes it true. This is F6Y-07's class, in the repair that followed it.

**Site.** `validate_contracts.py`, the `UNANSWERED_CEILING` and `NOT_ANSWERED_CEILING` blocks.

**Statement.** The comment above `UNANSWERED_CEILING` opens *"# 41 -> 66 (F6Y-01)"* and the constant is `UNANSWERED_CEILING = 67`. `NOT_ANSWERED_CEILING = 63` carries the inline comment *"# 37 -> 62 (F6Y-01): the twenty-five newly declared F6W/F6Y/F6Z findings"*.

**Counterexample, computed by parsing `pinned-conjuncts.json` and reproducing the file's own expressions.** `finding_sources` 141; `covered` from 71 pins and 50 pinned transitions; 34 `unpinnable` rows; `unanswered` = **66**; `answered_elsewhere` = 4; `not_answered` = **62**. Both comments state the true, tight value. Both constants are one higher. 37 + 25 = 62 and 41 + 25 = 66, so each comment's own arithmetic also lands on the tight value.

**The headroom is deliberate, and its reason is recorded in the wrong file.** `fixtures/positive/r36-a-declared-family-gains-a-finding-benign.json` adds one `finding_sources` row and one `not_answered` row, taking the counts to 67 and 63, and its `why` says so outright: *"The ceilings therefore carry exactly one slot of headroom, and this fixture is what holds that slot open."* So the constants are correct and the comments beside them are not.

**Resulting failure.** A reader at the constant — which is where the file's own convention says the reason goes, *"the reason goes in the constant's comment there"* — learns a number the constant does not hold and no reason for the difference. A later contributor tightening 67 to 66 to match the comment would break the benign fixture and would have been told nothing. Separately, the slot means one real crossing from `answered_elsewhere` to `not_answered` passes both ceilings silently, which is the move F6R-01's two-ceiling design exists to make visible; the crossing is in the conservative direction and `ANSWERED_ELSEWHERE_CEILING = 4` equals the current size, so the dangerous direction stays bound.

**Required contract.** Write the fixture's reason into both constants' comments — that the value is the committed count plus exactly one slot held open by `r36-a-declared-family-gains-a-finding-benign`, and that the committed counts are 66 and 62.

**Blocks under §8?** No.

**Confidence.** High. Every number is recomputed from the data, and the reason is quoted from the fixture.

### F6AA-08 · class (a) · low · The widened sweep's floors are eight ids and two families below the committed counts at the subject

**Governing requirement.** Protocol §5 (a), and the file's own RC5-02 rule stated three blocks above: *"A floor that does not move with the table it budgets is the denominator again … RAISE THESE WHENEVER A PIN IS ADDED."*

**Site.** `validate_contracts.py`, `checked(len(_step6) >= 81, …)` and `checked(len(_step6_families) >= 8, …)`.

**Counterexample, computed over the corpus at three commits.**

| Commit | Documents | Ids | Families |
|---|---|---|---|
| `740764c` | 8 | 81 | 9 |
| `f512da5` (the lane's own commit) | 8 | 81 | 9 |
| `95ca14d` (the subject) | 9 | 89 | 10 |

The id floor was exactly tight when the lane set it; the family floor was set one below its own commit's count. `F2-06-recheck-04a.md` landed between `f512da5` and `95ca14d`, taking the corpus to 89 and 10. Every other bound in the same region is exactly tight at the subject: `FINDING_SOURCE_FLOOR` 141 against 141, `PIN_FLOOR` 71 against 71, `PIN_TRANSITION_FLOOR` 50 against 50, `ANSWERED_ELSEWHERE_CEILING` 4 against 4.

**Resulting failure.** Eight ids and two families could leave the corpus — a review document deleted or renamed — and the sweep's vacuity guards would not notice, so the per-id coverage demand would narrow by up to eight without a control firing. That is the same disappearance F6Y-01 is about, at one remove.

**Required contract.** Raise the two floors to the committed counts, 89 and 10, with the reason in the comment as the file's convention requires. Note that this is a live drift rather than a lane defect: the id floor was correct at `f512da5`.

**Blocks under §8?** No.

**Confidence.** High. Recomputed at three commits with the validator's own regex.

### F6AA-09 · class (a) · low · F6Y-01's own `not_answered` row fails its own stated condition

**Governing requirement.** Protocol §5 (a); F6R-01's partition rule that `not_answered` means nothing here answers it.

**Site.** `pinned-conjuncts.json#/not_answered/F6Y-01`.

**Statement.** The row reads *"No file-and-check pair is recorded here for it. Raised in F2-06-recheck-04a.md against this package; declared here by F6Y-01 so that the widened Step 6 sweep counts it. **The repairs this lane landed are named in `answered_elsewhere` individually where a file and a check exist.**"*

**Counterexample, computed.** A file and a check exist for F6Y-01: `validate_contracts.py`, the `STEP6_FAMILIES` containment assertion and the widened per-id sweep, with the fixture pair `r36-step-6-finding-loses-its-source-row` and `r36-a-declared-family-gains-a-finding-benign`. `answered_elsewhere` holds exactly four keys — `F6A-10`, `F6D-08`, `F6D-09`, `F6R-03` — and F6Y-01 is not among them. The row's own condition is satisfied and its placement contradicts it.

**Why it is not merely tidiness.** `ANSWERED_ELSEWHERE_CEILING = 4` equals the current size, so moving F6Y-01 to the half where it belongs is an edit to `validate_contracts.py`. That is F6Y-08's finding verbatim — *"`not_answered` holds findings this package answers with a named check and a fixture pair, and its ceiling makes correcting that an edit to the validator"* — reproduced by the repair for F6Y-01. F6Y-08 is outside my recheck scope and I do not judge it; I record only that this instance is inside the F6Y-01 repair.

**Required contract.** Move F6Y-01 to `answered_elsewhere` with the file and the two check names, raising `ANSWERED_ELSEWHERE_CEILING` to 5 with the reason written there; or amend the row's last sentence so it does not state a condition the row itself meets.

**Blocks under §8?** No.

**Confidence.** High. Both halves are parsed from the data.

### F6AA-10 · class (a) · low · The r36 negative fixture states a tripwire mechanism that another control pre-empts

**Governing requirement.** Protocol §7 — a claim about a control's own behaviour, stated as fact.

**Site.** `fixtures/negative/r36-step-6-finding-loses-its-source-row.json`, the `why` field.

**Statement.** *"The fixture is what stops the pattern narrowing again: re-narrowing it to any range that omits F6W **makes this fixture PASS**, which this runner fails the build for."*

**Counterexample, computed.** The fixture removes `/finding_sources/F6W-04`, taking `finding_sources` from 141 to 140. `FINDING_SOURCE_FLOOR = 141` is a separate assertion outside the Step 6 block, so under a re-narrowed pattern the fixture would not pass validation — it would be rejected by the floor, with a message containing nothing like `expect_failure_contains`. `run_negative_fixtures.py:322` then classifies it `wrong_reason` and the build fails. The tripwire holds; the mechanism is not the one the field names.

**Resulting failure.** Small and specific: the `why` is the record of what this fixture guards, and a contributor reading it would conclude the fixture's protection is independent of `FINDING_SOURCE_FLOOR` when in practice the floor fires first. Someone lowering that floor would think they had left the tripwire intact.

**Required contract.** State the mechanism as it is — a re-narrowing makes the fixture fail for the wrong reason, which the runner fails the build for — and name `FINDING_SOURCE_FLOOR` as the check that would fire first.

**Blocks under §8?** No.

**Confidence.** High for the floor's value and the runner's match logic, both read directly. I did not execute the runner, so this is a reading of the code path rather than an observed run.

### F6AA-11 · class (a) · low · Two different 41s six lines apart, and the chapter never says they are different sets

**Governing requirement.** Protocol §7 — a figure carried without the context that makes it true.

**Sites.** `05:374`'s amendment note and `05:380`.

**Statement.** The note at `:374` reads *"the 'Of the 46' frame closed over **3 + 6 + 32 = 41**"*. `:380` reads *"**all 41 of the human-acceptance capabilities** still need a human at acceptance time"*, sourced from re-run §4, which defines its 41 as *"the 41 of 46 capabilities that carry `human` among their production modes"*.

**Counterexample, computed.** The two sets are provably different. CAP-17 is one of the five the `:374` note names as falling outside 3 + 6 + 32, so it is not in the bucket-41; and `:380` names CAP-17 among the human-acceptance capabilities — *"CAP-22, CAP-42, CAP-31 on its day-five arm, **and CAP-17** if the founder resolves its preserved dissent"* — so it is in the human-41. One id inside one and outside the other settles it.

**Resulting failure.** Six lines apart, one number, two extensions, and nothing distinguishing them. A reader carrying "41" from `:374` to `:380` gets a set that differs from the one the sentence is about, in a passage whose stated purpose is to state the limit accurately.

**Required contract.** Say at `:380` that the 41 there is the count of capabilities carrying `human` among their production modes, which is not the 41 of the bucket union at `:374`, and cite re-run §4 for the definition — a half-sentence, in the paragraph that already carries that path citation.

**Blocks under §8?** No.

**Confidence.** High for the disjointness, which rests on CAP-17 appearing in one and not the other, both quotations. The re-run flags its own 41 as *"not recomputed here"*, so neither figure is independently verified against `planning/specification/capabilities.json`, which exists but which I did not open.

## 4. Limits

**Content, not executability.** I ran no Python. Every contracts verdict is about what the file says: I can state that `unanswered` is 66, that all 89 Step 6 ids hold source rows, that the partition is exact and disjoint, that the expected failure string is the one the check emits, and that the fixture manifests match the tree. I cannot state that `validate_contracts.py` passes, that the r36 pair behaves as declared when the runner executes it, or that any fixture in the suite other than the two I read does what its declaration says.

**The re-run is a source I checked and did not audit.** `09-q017-conjunction-rerun.md` is a framer lane's analysis, not a producer's account of its own repair, so the provenance bar does not reach it and I read §2–§4 for the id lists the chapter cites. Its own defects are not my subject. Two bear on §12 and I record them without expanding: its §3 "Five roles merge" sentence names only four ids explicitly, so CAP-16's membership in that category is reachable only by elimination; and its 41 human-acceptance figure is sourced from §12 and marked not recomputed, so the chapter and its source cite each other for it.

**Not judged: whether any dimension verdict moves.** Eleven findings are recorded and none is (d)-class, so under protocol §8 none blocks. Whether they move W2, W8, W12 or W14 from sufficient to insufficient is the dimension owners' call and not a recheck's. F6AA-01 is the one I would hand them first, because it concerns whether a packet subsuming (d)-class findings is answered on its own terms, and that question is §8's.

**Standing caveat.** No runtime exists. Every "closed", "repaired" and "verified" above is about **specified behaviour checked offline** against a protocol frozen on 2026-09-13, by a reviewer of one model family with procedural independence only. Nothing in this pass establishes runtime conformance, deployment readiness, actual fulfilment, or the business value of the intended system. Not one mechanism I confirmed has ever executed: the launch guard has never evaluated a `WorkflowRun`; no `StandingHolder` record exists to carry the `capability_refs` the chapter specifies, and none is registered under `contracts/**` at all; the three standing roles the founder confirmed have never received a case; and the widened Step 6 sweep has never run in my presence — I recomputed what it would find, which is not the same claim.