# Challenge D · FINAL-PLAN-v2.md after the fixer round · reviewer-readonly lane (no shell) · 2026-09-06

*Recorded verbatim by the orchestrator from the lane's numbered SendMessage parts (delivery truncates near 4,000
characters per message; parts recorded in arrival order, each labelled). Sealed: the lane read the assembled plan
and, to check citations only, SPINE §A–§N and DECISIONS §24; no review/, rethink-2/, returns/ or session file.
Findings, never fixes.*

---

## PART 1 of 5 · verdict and the P1s

VERDICT. The four overrules are honoured where they are carried (§1.1, §4.1b, §8.2b, §9.4b, §12.2b, §15.1, §20.1 rows 17–18, §22 entries 73–75, §19's preamble), and every O81–O127 reaches §17.4.3, §19.1 and §19.2b. Three P1s remain: two are sentences the overrules should have struck, one is a consequence of E1 the plan never states. Priority 1: FAIL until the three below are settled. Priorities 2–6: PASS with the P2s in parts 2–3.

P1-1 (E7, no keys). §9.5 cache-facts table, row 4: "batch still needs a metered key; the row is ready for the day one exists." §16.4, same subject: "(amended 2026-09-06: E7 / v90 — 'no keys'; there is no such day.)" One fact, two sentences, opposite tense. Settle: strike the §9.5 clause and point at §J 74.

P1-2 (E11, first contact widens). §5.3 #11 growth: "First contact with a stranger is on the default `never` list." §5.5 row 26 refuses influencer outreach because "first contact with a stranger is on the default `never` list." §12.1 defines never as "what is not done by this system under any circumstance." §12.2b step 5: first-contact is "reachable like any other class (E11), never a tap per send forever." A stopped ladder survives in two sentences. Also stated nowhere: how a class on the default never list ("anything delivered to a person") ever reaches step 1 of the ladder at all. Settle: reword §5.3 #11 and §5.5 row 26 to "first-contact is step 5 of the ladder, per venture (v94)"; add one sentence in §12.2b saying whether the charter's `ladder:` line removes the five classes from the default never list or the never list overrides the ladder.

P1-3 (E1, no box, carried to its consequence). §15.1b: `night_capable` requires "sleep off — `sleep 0` or `disablesleep 1`". §4.1b (W33): "`pmset -g custom` reads `sleep 1` on AC and battery". §20.2 row 7: "`pmset -a disablesleep 1` … DEFERRED to build time — 'Neither yet'". §3.5 hosted-lane row: "until a cancel path is documented the fallback holds a brief and mints nothing." §13a.11 and §21.1b score month one on "three consecutive nights with `orphaned = 0` and at least one handover each." Read together: the predicate is false every night, the fallback mints nothing, so no night runs and month one cannot be scored. No sentence says so. Meanwhile §0.5, §4.1b and §14.6 say a refused brief is "routed to the cloud carrier", which reads as minted and contradicts §3.5. Settle: one sentence in §15.1b or §19 Stage 2 naming the precondition (the founder runs `disablesleep`, or state whether a `caffeinate` assertion visible in `pmset -g assertions` satisfies the predicate), and reword the three "routed" sentences to "held, not minted, until the carrier's `stop:` is known (v67)".

Parts 2–3 carry eleven P2s, part 4 the P3s, part 5 scope notes and the single-family caveat.

---

## PART 2 of 5 · P2-1 to P2-6 (propagation and cross-section contradictions)

P2-1 §17.1 is stale against §5.2 on E7. §17.1 row 2 reviewer and row 14 challenger: "a second family when reachable"; row 6 scout: "Gemini once authenticated". §5.2 struck exactly those words on 2026-09-06 and wrote "the Gemini CLI or Codex CLI as a `bin/run` child from launchd, no key". §5.2a says both tables are renderings of one `roster.yml`; they now disagree. Settle: carry §5.2's amended cells into §17.1 rows 2, 6, 14.

P2-2 O126 not propagated to §17 and §20. §17.4 Intent row: "for a standing intent that never expires (v55, §2.8)". §20.6 v55 row: "an intent that never expires". §2.8, §13a.6 and §17.8's tree say "a standing intent EXPIRES (O126)". Settle: strike "never expires" in both and cite O126.

P2-3 v87 (one built, one written) not propagated. §6.1 flowchart: "Builds both options, stages them, queues a WHICH. It cannot ask" — and no decision-budget branch, unlike §3.3's flowchart. §14.7: "each card carrying its six fields and both options already built". §11.6: "as two built options and a which". §5.3 #12 and §5.5 row 29: "with both options prepared". §16.7: "*both options built* is the only sampled diversity". §20.3 row 15: "staged as a *which* with both options built". §20 is one of the late sections the brief names. Settle: one wording, "one built, a second written unless a ten-word summary cannot separate them (v87)", at all six sites; add the O96 budget branch to §6.1.

P2-4 founder_hours is a stop in one sentence and a report in the next. §2.1: "The Desk reads it exactly like `ceiling:` — harness intents stop starting when it is spent" and, two lines on, "a bind at 20 is reported, never enforced silently". §16.2b: "the Desk stops starting harness intents when it is spent, and a bind at 20 is reported, never enforced silently", then "the bind reports … and never stops work in silence". The losing image is "a hard bind · wins_if: the founder asks for it", so a stop is the image that lost. Also: §4.1's eleven gates and §12.9's three ceilings carry no founder_hours gate, and §12 never names the field, though the brief asks for the shape in §2, §4, §12, §16, §21. Settle: pick stop-with-report or report-only, state it once in §2.1, and add the gate to §4.1 and §12.9 or say why it is not one.

P2-5 `confidence: LOW` is both adopted and a losing image, and the header lacks it. v96's last column lists "`confidence: LOW` on the header until one overnight (B1) · wins_if: fewer than one row in ten changes after it" as a losing image. §13a.11: "the header carries `confidence: LOW` until then". §21.1b: "the plan's `confidence:` is `LOW` until one overnight has run". The header block (lines 3–58) has no `confidence:` field; grep confirms none in the file. Settle: decide which; if adopted, add the field and move the image out of v96's last column.

P2-6 §21.1a is stale against §5.6 on O112. §21.1a, O26 row: "the launcher (below the floor on a move class, that class is **unroutable** until a rehearsal passes)". §5.6 amended that consumer: "below the floor … the agent is in **probation** for that class … `unroutable` is the state after a rehearsal fails, not the state before evidence exists (O112 · v103)". Settle: carry the probation wording into §21.1a.

---

## PART 3 of 5 · P2-7 to P2-11

P2-7 §11.10 is stale against §7.3 on O114. §11.10 point 1: "an admission on 2–3 cases is an admission **below the floor**, recorded as `insufficient`." §7.3 struck that: "recorded as ~~insufficient~~ **`provisional`**, and the number that decides it is gathered from real work (amended 2026-09-06: O114)". Settle: carry `provisional` into §11.10.

P2-8 §20.8 reproduces SPINE §N "unchanged in substance" and two rows are false as reproduced. R4: "outbound connect to loopback is unmeasured" — §15.7 and §8.1a record W36: "outbound loopback `connect()` is measured denied too". R9: status "OPEN" — §6.4 and §13.3 say "Answered by O90; the remainder is R32". A reader of the late section gets the pre-fixer state. Settle: amend R4's and R9's cells in §20.8 (and, if SPINE §N still reads that way, note it there).

P2-9 §15.6 is stale against §10.6 and §14.11 on W35. §15.6 Fleet and terminal row: "**`-w` / `--worktree` / `--tmux`: UNRESOLVED** — measured by a prior lane, absent from this session's CLI-reference fetch". §10.6 gap 6: "**CLOSED 2026-09-06** (THINKER: A4 · W35): `claude --help` 2.1.263 lists `-w/--worktree` and `--tmux[=classic]`". §15 is a late section the brief names. Settle: close the cell and cite W35.

P2-10 `bin/stop` has two different lists of its four receivers, and two answers on who may pull `--all`. §12.9 and §3.5: "four receivers — the cord file, the process groups, the Sender's recall window, the hosted lane's UNKNOWN". §14.13: "Four receivers (the Watch's file, the process groups, the Operator sessions, the cloud carrier's cancel where one exists)" — Operator sessions in, the Sender's recall window out. §14.2 and §14.13: "`--all` behind a second tap" on every page's control. §17.5: "The cord is on every page, and its verb is `bin/stop --night`; `--all` from the Operator only". Settle: one receiver list in §12.9 (five, if Operator sessions count) cited by §14.13; one answer on `--all`'s reach.

P2-11 mechanisms named without a path. O102's path is "one `-p` pass · one founder sitting — ABSENT" (§0.1a, §11.2, §11.11a, §19.2b node R27RUN); SPINE §L O102 carries the same non-path, so the gap is upstream too. The briefing generator carries O95's line, O96's first line, O116's subsidy line, O74–O76 and O123, and is "ABSENT" in §14.8 and §16.8 with no path anywhere; §17.5 lists `keel briefing` as a verb but nothing ties the two. Settle: name a program for each (e.g. `bin/r27` or a `bin/rehearse` mode; `bin/briefing` or the `keel briefing` verb) in §17.5 and §19.

---

## PART 4 of 5 · P3s

P3-1 §22's count and placement. Intro: "one lookup instead of … **eighty-eight**"; §22.2b: "The sixteen … 73–88". Entries 89 and 90 exist but sit after §22.3's closing "(FINAL) Everything above is kept so it can be argued for later" paragraph, outside any subsection. §22.2b's own text says they are "reproduced below". Settle: move 89–90 into §22.2b and make the count ninety.

P3-2 §20.6 closing note: "The list of five that stands is at the end of this section". The end of §20 now reads "four rows of 20.1 are open". Settle: "four".

P3-3 The briefing's first line carries two units. §3.8: "*decisions taken · deferred · defaulted*, with the bytes each cost". §14.8: "with the founder-minutes each cost". Settle: one unit (the which row carries `cost_to_answer_bytes`; O95 carries minutes — say which the line shows).

P3-4 Call-site count for `founder.last`. §4.4: "Five call sites share it" then "Mechanism: one predicate and one field shared by four call sites". §0.1a: "at four call sites … a fifth reading". Settle: five, everywhere.

P3-5 Handover line count. §0.3 flowchart and §6.3 heading: "eighteen lines, always". §6.3 then adds `verifier:` and `adequacy:` (O108), making twenty. The schema "owns the count, so no paragraph has to" — so drop the number from both or make it twenty.

P3-6 `vendor_wins_if:` and `class:` thinner in the plan than in SPINE §L. In the plan's own text no `vendor_wins_if:` appears for O93, O95, O96, O97, O98, O104, O111, O112, O116, O120, O123, O126, O127 (SPINE §L carries "—" for each, which the plan could carry too), and O82's SPINE value "the OS publishes an uptime history" is omitted at §15.1b and §15.8. O90 is marked adapter with "—" in §17.4.3, which the v96 rule ("an adapter is the thinnest reader of a named vendor surface") makes odd. No `class:` is stated in the plan for O98, O102 or O127. Settle: carry SPINE's two columns into each mechanism's first statement or into §17.4.3.

P3-7 The two doctrine changes are stated without a "cost, once" line and the commodity line is stated three times. §0.3's v96 and v97 paragraphs carry Mechanism, Why and Losing image but no cost; §13a's intro ("the doctrine gains one line") and §5.1 rule 4 restate v96. Settle: one cost line each in §0.3; §13a and §5.1 cite rather than restate.

P3-8 The band table O5 says is one rendering is two. §3.2's Codex column header: "`approval_policy` × `sandbox_mode` × **Guardian** (W21)". §12.3's: "Codex `approval_policy` × `sandbox_mode`". Settle: carry W21 into §12.3.

P3-9 §14.12: "Count is bounded three ways" — O71 (§6.6, §17.8 `sessions_ceiling`) adds a fourth, the session ceiling, and §6.6 says "§14.12 names three bounds … and none of them is a session count". Settle: four in §14.12.

P3-10 E7's scope. §20.7b E7 row: "**No API keys.**" §17.3 still admits tools whose credential is "API key" (CRM read, Higgsfield, RunPod when capped). v90 is about a checker-family key. Settle: one clause in §20.7b or §9.4b saying E7 governs model access, not tool credentials.

---

## PART 5 of 5 · what landed, scope notes, the single-family caveat

WHAT LANDED. The propagation the last two rounds failed at has largely happened: §15's header names v83, v84, v90 and O81–O93, O104 with their own rows; §19.2b has a row for every O81–O127 and eighteen new nodes plus nine vendor surfaces; §20.1 rows 17 and 18 close with the founder's words and §20.8 carries R27–R40; §21.1b and §21.2 carry v106/O124 and v105/O120; §22.2b carries 73–88 each with `source:` and `wins_if:`. E14 leaves no residue I could find. The founder-attention shape is consistent on the which budget (six per five-hour window until R34, same in §3.3, §4.5, §12.5, §16.2b) and on the first line's three words. The P1s are stale sentences and one unstated consequence, not structural gaps.

SCOPE NOTES.
- Read: docs/03-system-design/final-v2/FINAL-PLAN-v2.md whole (lines 1–12,094). Not opened: round-6/, final-v2/review/, rethink-2/, the scratchpad returns/ directory, any session file, or any producer reasoning or self-assessment.
- Bounded existence checks, as the brief permits: DECISIONS.md §24 lines for E1, E7, E11, E14 (the four quotes match the plan verbatim); SPINE.md §J 89 and 90 (exist, as the plan says); SPINE §L rows O82, O93, O96, O102, O104, O116, O120, O123, O127 (each carries `class:` and `vendor_wins_if:`, which is how P3-6 was settled as plan-side drift); one grep of the plan for a `confidence:` field (none). Nothing else in either companion was read.
- No shell. No count in the plan was re-derived; §19's "91 nodes and 195 edges", the `.qa/verdicts/` figures in §18.1 and §21.4, and the transcript counts (3,060 vs 3,116) are left to census D. P1-3 is read-only inference from four sentences the plan itself states; whether a `caffeinate` assertion satisfies `night_capable` is unmeasured and I did not guess.
- Findings, never fixes: every "settle" line names the sentences to reconcile and nothing was written.

SINGLE-FAMILY CAVEAT. One reviewer, one model family (Fable 5.1), no shell. This is not an independent panel and does not discharge the `irreversible` tier's 2-of-3 or the ≥2-family predicate in `.claude/review-lenses.yml`. It is one sealed read of the plan against the brief's six priorities. Where a P1 rests on a chain of sentences (P1-3), a second family reading the same four sentences would be the check worth having.

Return contract: status COMPLETE · lenses applied: the brief's six priorities · findings: 3 P1, 11 P2, 10 P3 · verdict: priority 1 FAIL, priorities 2–6 PASS with P2s.
