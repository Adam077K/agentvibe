# Challenge C · the plan after the rethink round · sealed lane (plan + founder's list only) · 2026-09-06

*Recorded verbatim by the orchestrator from the reviewer-readonly lane's numbered parts (delivery truncates near 4,000 characters per message; parts are recorded in the order they arrived, each labelled). Findings, never fixes. Severity P1 (contradiction or founder row not applied) · P2 (rule with no mechanism) · P3 (drift, wording).*

---

## PART 1 of 4 · lane C2 · challenge · reviewer-readonly, no shell

VERDICT: 13 findings — 4 P1, 5 P2, 4 P3. The rule discipline holds nearly everywhere; the failures cluster in three places. §19 did not receive the rethink round. §12.7 and §13.8/§17.2 still carry numbers and counts that other sections corrected. The R-n register has a hole, an unmarked question, and a pointer to a list that does not exist.

P1-1 · §1 contradicts itself on the step-list rule, and three sections follow the wrong half.
§1.1's v18 row (line 336) reads "A step list is admitted in exactly one place". §1.1's v51 row (line 369) reads "v18 now reads 'two places'". Two rows of the set that exists so that "twenty-five sections cannot disagree if each of them decides nothing that is not here". Downstream, §7.2 (2650) says two; §13.8 (5793), §13a.10 (6217) and §17.2 (8068) each say one. The curator's five fixed questions are the second admitted place, and three sections deny it exists.

P1-2 · v70 does not reach §19, which is the build order.
v70 makes wave one ten and wave two five (§5.0, 1647; §17.1, 7956). §19.1's graph still reads "WAVE ONE · eight agent files (v54)" and "WAVE TWO · seven agent files (v54)", listing curator and challenger in wave two (8698-8699). §19.2's table repeats "The seven wave-two agent files — product · analyst · writer · growth · steward · curator · challenger" (8884). §19.3 repeats "AGENTS1 is eight files … AGENTS2 is the other seven" (9039-9040). Four sites in one section, all pre-v70. A founder row that moved an implementation did not move the graph that orders it.

P1-3 · Contradiction 1 is closed in §5 and still open in §12.7.
§5.2 (1764) corrects the shell count to "~~Ten~~ Eleven of the fourteen carry no shell", with O57 striking analyst's Bash and a paragraph on why a hand-written count of a column drifts from the column. §12.7 (5163) still reads "ten of the fourteen carry no shell, five carry no write of any kind, and only four can touch source" — and cites it as "§B.2's own summary", which is precisely the source the correction retired.

*(Delivery note: part 1 arrived after parts 2–4; recorded here in its numbered place.)*

---

## PART 2 of 4 · lane C2 · challenge

P1-4 · §17.8 decides a third agent-file location and its generator; §10.8 says that gap is not filled, and no §1 row decides it.
§10.8 (4263-4271) records W25 — Gemini CLI ships named subagents in `.gemini/agents` — calls it "a third agent-file location beside `.claude/agents/` and Codex TOML, which v42 decided one home without contemplating", and closes: "the gap is recorded rather than filled here". §17.8 (8436-8439) then puts `.gemini/agents/` in the house file tree and decides "the file is GENERATED from shared/roster.yml (O2) for the agents Gemini may stand". §5.8 fact 1 and §17.7 both send the reader to §17.8 for it. v42's row decides one home and is not amended. A generated third location is a decision with an owner and a mechanism, made in the section §17's own preamble calls an inventory of what is already decided.

P2-1 · v76's mechanism is marked ABSENT while the same sentence says no path is named, which v50 says is not ABSENT.
§0.1a (94-95): "Mechanism: one predicate and one field shared by four call sites — ABSENT, and §A v76 names no path for it." Repeated verbatim at §4.4 (1516). v50 (368) defines the marks: "ABSENT: the mechanism is designed and its path is named; it is not built. WISH: no mechanism is designed." A mechanism with no path satisfies neither clause. v76 governs the reserve, which §4.2 calls "the most important number in the system", and the ABSENT mark makes it read as designed work rather than as the wish v50's own text makes it.

P2-2 · §5.1 rule 4 names no mechanism, in a list whose heading promises one per rule.
§5.1 opens "(FINAL, kept; each names its mechanism)". Rules 1-3 each name one — `bin/run`, the argv plus `bin/probe`, the MCP column plus `bin/probe`. Rule 4, "The no-model programs stay programs", carries only a citation, "(FINAL §7.4, §16.1)", and the paragraph beneath it says outright that "the mechanism is a naming discipline" and "The test is whether the thing needs judgement". A discipline somebody applies is the shape §12.10 and §13a call a wish elsewhere in the same document. Rule 4 is also the rule §5.1 itself calls "the one most at risk from a roster".

P2-3 · Three founder rows have ABSENT mechanisms and no node in §19, which claims completeness for exactly that set.
§19.2 and §19.2a both state the claim: "one row per ABSENT path", and "a path in two nodes means the graph is wrong". v76's last-founder-event predicate is named ABSENT in §4.1's Enforced-by (1388) and §4.4 (1516), and reaches §19 only as "v76's which-expiry" folded into `DECIDE` (8937) — one of its four call sites. v77's startup-metadata checker and per-namespace generator are ABSENT (§7.8, 2963) and appear nowhere in §19. v81's per-row `source:`/`valid_until` fields and the `scout` standing intent are ABSENT (§1.1, 413; §13a.10, 6238) and appear nowhere in §19. §19.2a does carry other founder rows — v68, v69, v74, v79 — so this is an omission, not a scoping boundary.

---

## PART 3 of 4 · lane C2 · challenge

P2-4 · §15.4's restore plan carries two cadences the plan elsewhere refuses, and its escrow half names no mechanism.
§15.4: "Monthly, the fleet is restored into a scratch directory from the remote alone", and "Twice a year, on a machine that is not this one, the company is rebuilt". §13a.3 (6003-6004) states the rule being broken: "FINAL re-ran the promoted checks 'monthly'; v2 puts them on the mechanism it already has, because the SPINE refuses a schedule and v19 refuses a calendar audit." §18.7 deletes the model-drift cadence for the same reason — "a cadence is a schedule the SPINE forbids" (8645). The section's own Mechanism line offers "the drill as an obligation with `recurs: monthly`", which relocates the cadence rather than removing it. Separately the escrow half — a printed emergency kit, hardware keys registered in pairs with the second off-site, a k-of-n split — names no mechanism and carries no ABSENT or WISH mark, in the section whose strongest sentence is "The restore is drilled or none of this is true."

P2-5 · §4.5's two escape hatches carry no mechanism, and one is a cadence.
"one spinning slot is always held for whatever the founder asks next" and "the Desk re-ranks on a cadence, not on every event" are inherited from FINAL and carry no path and no mark, in a subsection that gives every other rule one — the lexicographic comparator, O55, O56, O20's replayer. The spinning slot is a capacity reservation that nothing in §4.2's reserve arithmetic accounts for.

P3-1 · R20 does not exist anywhere in the plan.
R1-R19 and R21-R26 are each cited at least once. There is no R20 at any site. Either the numbering carries a hole or a question was dropped between the spine and the plan; a reader counting the research questions from this document alone gets twenty-five.

P3-2 · R26 is never carried as OPEN.
It appears five times (3889, 4229, 4286, 7079, 9002) and §10.8 calls it "the only cheap route to R10", the hinge of the cross-model design. Every other live question is marked "(Rn, OPEN)" at least once. R26 is marked nowhere, so a reader scanning for open questions does not find the cheapest one.

P3-3 · §1 says the twenty-six research questions are "listed in §20", and §20 lists none of them.
Line 309: "the twenty-six questions nothing resting on them can be decided without (SPINE §N, listed in §20)". §20 carries seventeen open decisions and FINAL §19's rows. R5 and R12 appear inside two of those rows; the other twenty-four appear nowhere in §20, and no R-list exists anywhere in the document.

P3-4 · §19.1's CODEXTEST node and §17.7 still carry the rehearsal floor W19 retired.
The node reads "version >= 0.124.0" (8736); §17.7 (8340) reads "version ≥ 0.124.0". W19 replaced it with "the installed version, recorded" at §10.2 (3880), §10.8 (4216-4221), §9.4a (3536) and §11.10 (4753). §19.2a flags its own node's label as stale (9000-9002) and leaves the string unchanged, which is a note beside an uncorrected value rather than a correction.

---

## PART 4 of 4 · lane C2 · challenge · the brief's five questions, answered

(a) Rules and mechanisms. Sampled every section. The discipline holds: nearly every rule names a path and an ABSENT/WISH/EXISTS state, and the per-section "What enforces this section" tables (§7.8, §8.8, §9.11, §11.11a, §12.10a, §13.10, §14.13, §15.8, §16.9) make the check cheap. The five failures are P2-1 to P2-5. Notably honest and worth keeping: §2.5 marks the founder-actually-reads-it half WISH and says why no mechanism is proposed; §11.11 marks the whole anchor table WISH; §12.10 refuses to state a count of missing mechanisms and points at the table instead.

(b) Method in stages. No stage states method. Near calls, each defended in place and each holding: §7.5's four-move routing rule (v49 makes it a routing rule plus one no-model program, and it names which agent does each move, never how); §5.4's solo chain (v60 makes it a card default, not a procedure); §13.6's five fixed questions and §12.2a's Sender checklist (both admitted by v51 and v18 as the two legitimate step lists — the rule P1-1 shows the document disagreeing with itself about). No finding.

(c) Sentences deciding what no §1 row decides. One: P1-4, §17.8's generated `.gemini/agents/`. Two near-misses that stay on the right side: §16.4a tells the founder to set `bashOutputMaxChars` low but marks it a FACT and leaves the number to the founder; §5.2's `cacheTtl` column adds a field to fifteen files from W6, and §5.2a routes it through O2 as mechanism rather than as decision.

(d) v66-v82 in their sections with a (FOUNDER, rethink) mark. Sixteen of seventeen present and marked: v66 §3.1a/§14.1 · v67 §3.5/§6.4/§12.9 · v68 §8.1a/§12.8a · v69 §12.8b/§13.2a/§15.3 · v70 §5.0/§3.6/§17.1 · v71 §5.0a/§17.1 · v72 §5.0a/§17.1 · v73 §11.2a/§21.1 · v74 §2.1/§4.2/§16.2a · v75 §4.5 · v76 §0.1a/§4.4 · v77 §7.6a · v78 §9.4a · v79 §15.1a/§2.1 · v80 §3.5 · v81 §13a.7/§22 · v82 §11.3/§20.7. The one failure is v70 in §19 (P1-2).

(e) Promised measurements carried as OPEN. R1-R19 and R21-R25 are each carried OPEN at least once. R20 is absent (P3-1), R26 is never marked OPEN (P3-2), and §1's pointer to a list of all twenty-six is wrong (P3-3).

What landed, so the next round keeps it. The losing-image register with a `wins_if:` line per entry (§22) is the strongest device in the document: it turns every decision into something an observation can overturn rather than an argument, and entry 70 gives the register itself a falsifier. The rethink-round tables that name mechanism, path, source row and state, one per section, are what made a single-pass review of 9,772 lines possible at all.

out_of_scope_notes
- No shell. Nothing was executed. Every finding is a read of the two files the brief names; no claim rests on a command's output.
- Single model family, one reviewer. This is not an independent panel.
- Read only FINAL-PLAN-v2.md and rethink/FOUNDER-LIST.md. SPINE, DECISIONS, SYNTHESIS and round-6 were not opened. Consequence for (d): §K's assignments live in SPINE, so v66-v82 were checked against the sections the plan itself names per row, not against §K. A row placed correctly by the plan and wrongly by §K is invisible from here.
- FOUNDER-LIST.md was read whole and used as the checklist behind (a) and (c). §23's tally was not verified against COVERAGE.md, which the brief excludes.
- Line numbers are from the file as read today and rot on the next edit above them. Every finding also quotes the string it turns on.
