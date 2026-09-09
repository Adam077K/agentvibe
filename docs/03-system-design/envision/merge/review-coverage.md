# Review of `2026-09-02-THE-SYSTEM.md` against `01-MERGE-BRIEF.md` and `00-BRIEF.md`

Read-only review, 2026-09-03. Document under review: 1,503 lines, 310 KB, 29 numbered sections plus
`## Sources`. Line numbers below are of the merged document unless another file is named.

Severity key: **blocking** — a reader is actively misled, or the brief's core instruction is broken ·
**should-fix** — a real defect that survives a careful read · **nit** — cosmetic or arguable.

---

## A. COVERAGE

The merge brief's paragraph 3 list, item by item. All 28 items are present. Two are thin, one is
displaced, none is missing.

| # | Brief item | Covered at | Verdict |
|---|---|---|---|
| 1 | A name | §1 (41–53) | Full. Decided, not blended (47), with both losing names re-homed: *the house* → the fleet (49), *the continuo* → the debts line (51) |
| 2 | The one sentence | §2 (57–59), epigraph (3) | Full |
| 3 | The inversion it rests on | §3 (63–77) | Full. WAKE's inversion (65) plus three turns (69, 71, 73) unified at 75 |
| 4 | Its organs | §4 (81–112) | Full. 10 stores · 4 engines · 4 boundary parts · 4 surfaces; the table's counts check out |
| 5 | Its laws | §5 (116–144) | Full. Twelve laws, each naming its enforcement, plus a thirteenth marked as not a law |
| 6 | The unit of work | §6 (148–205) | Full. Two atoms + the keel + cells and six positions |
| 7 | How autonomy is computed | §7 (209–284) | Full. Four currencies, three classes, the written function (229–274), configured envelope vs computed freedom (280–284) |
| 8 | Memory and its metabolism | §8 (288–364) | Full. Ten stores' write paths, rent-and-compost, erasure resolved at 364 |
| 9 | How it learns a field it has never seen | §11 (530–599) | Full. Borrow-before-build table (540–552), five-step apprenticeship (558–564) |
| 10 | How it finds and compiles context | §10 (510–526) | Full |
| 11 | **The drive** — what next, when nothing, per kind of project, who opens a goal, never burns tokens | §9 (368–506) | Full and the strongest section. Four questions (372–424); postures (474–496); openers (462–472); the flip test as the token answer (399) |
| 12 | **The founder's environment** — terminal, phone, Mac, seeing the agents, giving tasks, seeing progress; the right picture; the tension with a one-page stance | §13 (654–711) | Full. Office question answered with an argument (658–666); four surfaces (668–697); terminal (701); voice (703). **The one-page tension is answered explicitly at 699** — desk is the one page, dailies are the work, WAKE's Edition was trying to be both |
| 13 | **The fleet** — many projects, one founder, one budget, shared and never shared | §12 (603–650) | Full. One window not one dollar budget (609); WIP limit of three (613); two tables at 623–640; no channel between ventures (642) |
| 14 | **The door** — how a repo/skill/tool enters, and which of the 177 come in first | §16 (817–883) | Full. Seven admission tests (821–827), expiry (829), taint rule (835), ten named projects (845–856), a second ring (858–875), refusals by name (877) |
| 15 | **Storage** — where every store lives, in what form, **at what size**, what survives a dead machine | §17 (887–951) | **Thin on one clause.** Location and form are complete (the tree at 891–921 accounts for all ten stores). *What survives a dead machine* is the best-argued sub-section in the document (941–947, incl. the credential plan). **"At what size" is only implied**: the sole size figures are git's 50 MiB/100 MiB blob thresholds (927) and monthly Log compaction (929). No expected size for the Log, `.index/`, `derived/` snapshots, or a venture repository. *should-fix* |
| 16 | **The field map** — every job, its ground truth, its class of judge, **security from day one**, and **harness or organisation** | §18 (955–1064) | Full. Security block is first and explicit (961–978). Harness-or-organisation answered twice, at 77 (*a crew*) and 1064. *Nit:* the security table (965–978) has columns Job · Instrument · Class and no ground-truth column, unlike the other three tables; the instrument stands in for it |
| 17 | The night | §14 (715–787), esp. 770 | Full |
| 18 | The day, and the founder's life | §15 (791–813) | Full |
| 19 | Reserved capacity for being wrong | §19 (1068–1100) | Full |
| 20 | How it checks itself without gates | §20 (1104–1145) | Full. Seventeen numbered ways; the count matches |
| 21 | The one line it never crosses | §21 (1149–1184) | Full |
| 22 | What it costs | §22 (1188–1228) | Full |
| 23 | The first week | §23 (1232–1272) | Full — but see D-1 and C-1, both of which land here |
| 24 | The year | §24 (1276–1294) | Full |
| 25 | What it would take to exist, three buckets | §25 (1298–1326) | Full. Buildable (1302–1306) · trend (1308–1310) · unsolved, one dissolved (1312–1326) |
| 26 | Why nobody has seen it | §26 (1330–1354) | Full. Ten items, counted at 1332 |
| 27 | **The disagreement ledger**, one row per decision, losing images by name | §27 (1358–1399) | Full in form: 32 rows, a *Losing images, kept as* column on every one, plus false disagreements named at 1397. **One row is wrong on its facts** — see C-3 |
| 28 | **The dropped-from-WAKE ledger**, one row per organ or law no mind kept | §28 (1403–1426) | Full. 15 rows plus a survivor row, each with a *Should it have been dropped?* verdict, plus what WAKE won against the minds (1426) — an addition the brief did not ask for and that earns its place |
| 29 | **The fates table, last** | §29 (1430–1491) | Full. ~50 rows, four fates, `*changed*` and `*new row*` marks against WAKE's §22, closing accounting at 1489. *Nit:* it is not literally last — `## Sources` (1495–1499) and a closing italic line follow. Defensible, but the brief said "last" |

**Coverage findings**

- **A-1 · should-fix ·** §17. *"at what size"* is not answered. Storage form and location are complete;
  size appears only for blobs. Nothing tells a reader whether a year of Log is 40 MB or 4 GB, which is
  the number that decides whether "push after every watch" (943) is cheap.
- **A-2 · nit ·** §18, line 965–978. The security block alone lacks the *Ground truth* column the brief
  asked for on every job.
- **A-3 · nit ·** §29 is not the last section; `## Sources` follows it.

Everything else the brief demanded is present, and the six founder-added items are the best-served in
the document, not the worst. Item 11 (the drive) and item 12 (the environment) in particular read as
sections written to a question rather than sections retrofitted to one.

---

## B. PROVENANCE DISCIPLINE

Mechanically checked: every non-heading, non-table, non-code, non-blockquote line was tested for a
trailing tag containing `M1`, `M2`, `M3`, `WAKE` or `NEW`. **Discipline is very high.** Ten lines
failed, and nine of those are false positives: lines 560–564 (the five apprenticeship steps) and
778–781 (the four relief phases) are numbered lists carrying one group tag on the sentence that
introduces or closes them (558, 783), and line 3 is the epigraph, tagged where it recurs as the one
sentence at 59. That leaves the following real findings.

- **B-1 · should-fix · line 691.** The sentence *"There is deliberately no* approve*: WATCH asks
  preference and never permission, so a rubber stamp has nothing to land on"* is tagged **(M3 · M2 · M1)**.
  But §28's own survivor row (1424) lists **"ask-preference-never-permission"** among WAKE's parts that
  were **"Kept, tagged where they appear."** The one place it appears is tagged with three minds and no
  WAKE. This is exactly the failure mode the brief names — an idea taken from WAKE tagged only with the
  minds — and the document convicts itself of it two hundred lines later. Every other item on that
  survivor list (the Wake 88, the Book 90, the Bench 92, the Line 101, the Compiler 99, the fifth 1088,
  the germinal centre 1070, the apprenticeship 558, the licence 566, contact-first 1110, nothing-judges-
  its-own-homework 138 and 1112, kill criteria 169 and 1115, the map 1082, red plies 1096, the reverse
  seal 811, the day 793, the first week 1234) does carry WAKE. This is the single miss.
- **B-2 · should-fix · line 1499.** A bare `(NEW)` with no colon and no reason, on the paragraph
  describing the merge's own two check files. The brief's form is `(NEW: one line why)`.
- **B-3 · nit · lines 156, 768, 783, 923.** `(… ; NEW only in the merging.)` is used four times. It is a
  disclaimer, not a reason: it says nothing is new *except* the merging, which is true of every merged
  paragraph in the document. Compare the good form at 47, 364, 831, 1130, 1399, each of which says
  something a reader could not have derived.
- **B-4 · nit · lines 49, 51, 182.** `(… ; NEW in the re-homing.)` — same shape, borderline. These are
  weaker than B-3 because the re-homing genuinely is the new act (M1's *house* becoming the fleet).
- **B-5 · nit · line 91.** `PLY's reflexes through WAKE` in the Lessons row. **`PLY` is never defined
  anywhere in the document** — it is a round-one dream name a reader of this file alone cannot resolve.
  Lower-case `ply` is defined at 154 as WAKE's unit; upper-case `PLY` at 91 is a different referent.

No malformed tags were found. No tag names a mind that does not exist. The `blind` marker is used
consistently and only where §0 or §27 supports it. The `(M2 · WAKE)`-style double tag required by the
brief where a mind took an idea from WAKE is used correctly throughout: 290, 316, 320, 416, 770, 1074,
1080, 1211, 1314, 1416.

---

## C. INTERNAL CONSISTENCY

- **C-1 · blocking · lines 1260 vs 787 and 1280.** *The same number, twice, three months apart.*
  §23's Sunday accounting says: *"This week I learned to judge three things I could not judge on Monday…
  **That took my unattended watch from twenty minutes to about five hours.**"* §14 line 787 says: *"On day
  one the Bench holds nothing and the unattended watch is worth twenty minutes. **A year later** it is a
  genuinely useful five hours."* §24 line 1280 repeats it: *"from twenty minutes on day one to a genuinely
  useful five hours **by autumn**."* The week-one letter reaches the year's endpoint on day seven. This is
  not a rounding difference: the whole "freedom is derived, never granted" arc (§7 280–284, §14 787, §24
  1280) rests on the claim that the length of the night is *earned slowly*, and the first week reads as
  though it were earned in six days by three instruments. Since five hours is also the whole window (609),
  §23 as written says the house went fully unattended in week one.

- **C-2 · should-fix · line 370 vs 401, 502, 615.** *A rule stated absolutely in a law and contradicted
  in the same section.* §9 opens: **"No score. No rank. No weight."** Then, inside §9: line 401, *"the
  lowest unproven rung on the critical path wins, **ties broken by** how much else collapses"* — an
  ordinal rank with a tie-break; and line 502, the standing orders hold *"the **appetite**, a number that
  multiplies the concern's claim on the window"* — which is definitionally a weight. §12 line 615 then
  adds a second ranker: *"Above the floor, watches go by **rung movement per watch spent** over the
  trailing month, and a venture that has not moved a rung in four weeks loses discretionary watches to one
  that has."* The document's actual, defensible position is stated at 428 — no **cardinal** score of
  information per cost — and Law 11 (140) even presupposes an allocator exists. The opening three words
  overstate it, and a reader who takes 370 literally will read 502 and 615 as violations.

- **C-3 · should-fix · line 31 vs line 486 vs §27 row 10 (line 1373).** *A fact stated three ways in the
  ledger the brief specifically asked for, and one losing image not kept by name.*
  - §0 line 31: *"M1: hunt, walk, hold, client."*
  - §9 line 486: *"the losing names are kept in §27: M1's* hunt *and* hold *and* sleep…"
  - §27 row 10, M1's column: *"hunt · walk · watch · serve · sleep"*, with losing images
    *"**hunt**, **hold**, **sleep**; **pursue**, **beside**, **watch**, **still**; **wait**"*.

  Three different sets. The merge's own check file resolves it: `merge/spine-crosscheck.md` line 39 and
  line 65 record M1's **spine** paces as *"four named — Hunt, Walk, Hold, Client"*, quoted from the source.
  Row 10 is marked **blind**, which by the document's own convention (line 7) means a *spine* disagreement,
  yet it carries M1's post-reading body names. Consequences: (a) row 10 disagrees with §0 and with the
  merge's own crosscheck; (b) *watch* is listed as M2's losing name when it is M1's too; (c) **`Client`,
  M1's fourth pace and the direct ancestor of the decided name `Serve`, is never kept by name in §27** — it
  appears exactly once, at line 31, and line 486 credits M1 with *"Serve"*, a name M1's spine did not use.
  The brief's instruction is *keep the losing image by name*; this is the one place a losing image is
  quietly renamed into the winner.

- **C-4 · should-fix · line 717 vs line 617.** *A number stated two ways, and the second statement's
  argument needs the first to be exact.* §14 line 717: a watch is *"one window… **four or five of them a
  day**, phase-drifting so no venture owns the dead slot."* §12 line 617: *"**Rotation is odd on purpose.
  Five watches** against a twenty-four-hour day means the phase drifts… This is the dog watch, a ship
  deliberately splitting one watch so **the count per day is odd**."* If the count is *four or five*, the
  oddness on which the dog-watch argument rests is not established — at four, the phase does not drift and
  a venture *does* own the dead slot. One of the two sentences has to give.

- **C-5 · should-fix · line 599.** *A `§N` cross-reference pointing at the wrong section.* *"a cell whose
  context is tainted has its grant narrowed for the rest of its life, **§21**."* The taint rule —
  *"Reading the outside narrows what you may touch"* — is **§16**, at lines 833–835. §21 only refers back
  to it (*"And the taint rule of §16 closes the seam between them"*, line 1180). Should read §16.

- **C-6 · should-fix · line 1264 vs 1272 (and 813, 1290).** *A number stated two ways inside one section.*
  The Sunday letter: *"**Thirty-one decisions reached you.** Twenty-two were questions of fact… Nine were
  questions of preference"* — and §15 line 813 (*"In week one that is thirty-one decisions"*) and §20 line
  1290 (*"Fact questions fall from **twenty-two a week**… Preference questions rise from **nine**"*) all
  agree on 31. Then line 1272, eight lines later: *"By Sunday the founder has written no spec, **answered
  perhaps fifteen questions**."* Either sixteen of the thirty-one fired on silence — which §13's fences
  (685) cap at *"no more than a small number of defaults… between two founder touches"* and which would be
  a remarkable fact to leave unstated — or one of the two numbers is wrong.

- **C-7 · nit · line 118.** *"this repository already paid to learn that **eight of its ten rules were
  wishes**."* The parts bin says something different: `CLAUDE.md`'s rules table reads *"this list previously
  had eight of them, zero enforced"* — i.e. eight rules in total, all unenforced, later grown to ten of
  which four are `ENFORCED`. The document turns "eight rules, none enforced" into "eight of ten
  unenforced". Cheap to fix and checkable, which is why it is worth naming in a document whose Law 1 is
  that a number must reconcile to a record it does not write.

- **C-8 · nit · lines 122, 128 (and 120).** *Terms used before they are defined.* §5's laws use **the
  weather** (122), **the keel** (128), **the posture** (128) and **rung 1 of the evidence ladder** (120);
  the keel and the weather are defined in §6 at 178, the postures in §9 at 474, the ladder in §9 at 403.
  Laws must forward-reference something, but four terms in one section, none of them carrying a `§`
  pointer, is more than necessary.

- **C-9 · nit · line 761.** `Relieve        Preview, brief, read-back, sign-off. §below.` — `§below` is
  not a section reference. It means §14's *The relief*, which begins fourteen lines later.

- **C-10 · nit · line 199 vs 695 vs 1310.** Three scales for one watch that a reader will try to
  reconcile: *"a few hundred cells of about twelve minutes' median"* (199), *"four hundred lights over
  five hours"* (695), and *"thirty siblings a watch"* (1310). They are three different objects — all
  cells, all lights, siblings of one bet — but nothing in the text says so, and §22's cost formula
  (1199–1206) is written in *siblings*, so the reader who wants to price a watch has to guess which
  number goes in.

- **C-11 · nit · line 1489 vs line 83.** §29 names *"six organs in WATCH [that] have no ancestor in the
  bin: the keel, the refusal ledger, the World Ledger, the capture floor, the relief's outgoing audit, and
  the Continuo."* Three of those six are not organs under §4's own taxonomy (83): the refusal ledger is
  part of the Treasury (96), the capture floor is a metric (§20, 1136), and the relief's outgoing audit is
  a phase of an engine (781). The word *organ* is doing two jobs.

**Checked and clean.** Organ counts (83 vs the table); twelve laws; seventeen self-checks (1108); thirty-two
disagreement rows (1360); ten door projects (843); five bell conditions (707 vs row 27); six positions
(186 vs 1384); six block-from-day-one classes (1157 vs 1441); the six desk fields (672–681); the tick at
240s (526, 1205, 1221); the Sunday arithmetic (14+4+1 = 19, 22+9 = 31); and **every number in §29 against
`merge/parts-bin-census.md`** — 68 verdict files, 48 check steps, 134 skills, 175 session files, 18
handoffs, 18 agent files, 42 mission-control TypeScript files, 3,429 launcher lines. All match. Every
other `§N` cross-reference in the document resolves to the right heading; C-5 is the only one that does not.

---

## D. ONE SYSTEM, NOT A BLEND

The document decides. Thirty-two rows in §27 each name one winner, and the losing images are re-homed
rather than discarded — *the house* as the fleet (49), *the continuo* as the debts (51), *the ply*'s
fields inside the bet (156–170), *the auction*'s four gifts taken whole at 430, *the tide*'s odd rotation
kept at 617, *the Edition* split at 699, M3's *choosing-share ceiling* dropped and named at 1141. On the
brief's own test this is the strongest part of the document. Three exceptions.

- **D-1 · blocking · line 1244.** *The losing mechanism is reinstated as the worked example.* §9 line 428
  is unambiguous: *"The merge does **not** take the auction as the mechanism and records why… A cardinal
  score of information per cost is arithmetic that cannot be fed here."* §27 row 3 confirms it: the drive
  is *"four questions in a fixed order"*, and the auction is *"the losing image"*. Then §23's Monday reads:

  > *"**Sixty offers went to the escapement and the seventh**, build the product, **lost** to a research
  > bet costing a twentieth as much, and WATCH says so on the desk in one line: I am not building anything
  > this week. **Here is what beat it.**"*

  Offers, submitted to a ranker, arriving in ordinal position, one *beating* another: that is M2's standing
  auction, described in M2's vocabulary, doing the job the merge refused to give it, in the one section a
  reader will use to picture the system working. The escapement as designed cannot produce a "seventh" —
  it asks four questions in order and the third has no ranking, only a flip test that a candidate passes
  or fails. The tag on the paragraph is `(M3 · M2 · M1)`, which correctly names M2 but does not say the
  image is the losing one. Either §23 is rewritten in the escapement's terms, or §9's decision is not
  the one the document actually made.

- **D-2 · should-fix · §27 row 24, line 1387.** The only row whose *Decided* cell is **"both"**: monthly
  restore from the remote alone, and twice-yearly rebuild on another machine. The justification —
  *"different drills for different failures"* — is real and §17 line 947 does implement two distinct
  drills with distinct outputs. But the brief's rule is *a decision is one image*, and a row that answers
  "both" is the one place a reader cannot tell a synthesis from an unresolved disagreement. Recommend
  restating it as one drill programme with two cadences, so the *Decided* cell holds an image.

- **D-3 · nit · §22, lines 1196 and 1211.** *"The merge does not pick a number between them. It says what
  determines it."* Two cost targets are then kept side by side — WAKE's *$30 to $80 a night* and M1's
  *$10 to $40 a day* — as *"targets a real bill can falsify, not… estimates to plan on."* This is a
  deliberate refusal to decide, argued at length and recorded in §27 row 26, and the argument (two
  competent reviewers diverged tenfold on one assumption) is good. Flagged only because it is the second
  place in the document where the answer is a pair rather than an image, and because §22's own heading
  calls it *"The number nobody has"* while §27 row 26 records a decision — a reader should be told which.

**Examined and cleared.** §13's office question (658–666) reads at first like taking both sides — *"As a
control surface, no… As a thing to look at, yes"* — but it is a partition of one ask into two questions,
each decided, with the partition enforced structurally (*"Keeping them in separate windows is the whole
trick"*, 666; *"nothing in the system reads whether you watched it"*, 695) and recorded as row 14. That is
a decision, not a hedge. Likewise §17's *"Day one is on the Mac; the split is the target"* (951) is a
sequence, not an evasion; §27 rows 11, 27, 28 answer "union" only where the minds genuinely did not
conflict, and each says so.

---

## E. THE ≤200-WORD RETURN

Drafted from the document as read, for the author to compare against their own. **199 words.**

> **WATCH.**
>
> *A crew that stands the night over everything you are building, moves only where moving would change
> what it does next, judges its work by contact with the world and its books against records it does not
> write, keeps a book of bets and a book of debts and never ranks the second against the first, predicts
> you so that it can ask you less about facts and more about what is only yours, and never once does
> alone what cannot be undone.*
>
> Three decisions shaped it. The drive is four questions in fixed order and a flip test, not a cardinal
> auction: a price prefers cheap, legible probes and needs a prior nobody has. WAKE's Understudy licence
> goes: the Second lowers what is *asked*, about facts, never acts — its score rises exactly when it
> becomes invalid. The eight-hour night becomes a five-hour watch with a two-way relief: one window stops
> every agent at once.
>
> Kept from WAKE against the minds: the three trust thresholds, the backward replay, the death condition.
> Dropped: the Understudy, Vigil, Orrery and Edition, sideways replay, one health metric, day-seven Brier,
> singularity, forking a company.
>
> Left out: fresh research, store sizes, M1's *Client*.

---

## Summary of findings

| ID | Severity | Where | What |
|---|---|---|---|
| D-1 | **blocking** | 1244 | §23 runs the drive as M2's auction — "sixty offers… the seventh… lost… what beat it" — the mechanism §9/§27 row 3 refused |
| C-1 | **blocking** | 1260 vs 787, 1280 | The unattended watch reaches five hours in week one and, elsewhere, in a year |
| C-2 | should-fix | 370 vs 401, 502, 615 | "No score. No rank. No weight." contradicted by appetite, the tie-break, and the weekly allocator |
| C-3 | should-fix | 31, 486, 1373 | M1's postures stated three ways; `Client` never kept by name in §27 |
| C-4 | should-fix | 717 vs 617 | "four or five" watches a day vs the dog-watch argument, which needs exactly five |
| C-5 | should-fix | 599 | Cross-reference to §21 should be §16 |
| C-6 | should-fix | 1264 vs 1272 | 31 decisions vs "perhaps fifteen questions" answered, in one section |
| A-1 | should-fix | §17 | "At what size" is not answered for any store but blobs |
| B-1 | should-fix | 691 | "asks preference and never permission" tagged (M3 · M2 · M1); §28 line 1424 says it is WAKE's and "tagged where it appears" |
| B-2 | should-fix | 1499 | Bare `(NEW)` with no reason |
| D-2 | should-fix | 1387 | §27 row 24 decides "both" |
| C-7 | nit | 118 | "eight of its ten rules were wishes" misreads the parts bin's "eight rules, zero enforced" |
| C-8 | nit | 120, 122, 128 | keel · weather · posture · evidence ladder used in §5 before §6/§9 define them |
| C-9 | nit | 761 | `§below` is not a section reference |
| C-10 | nit | 199, 695, 1310 | Three unreconciled scales for one watch; §22 prices in the third |
| C-11 | nit | 1489 vs 83 | "six organs" includes three things §4 does not classify as organs |
| B-3 | nit | 156, 768, 783, 923 | `NEW only in the merging` is a disclaimer, not a reason |
| B-4 | nit | 49, 51, 182 | `NEW in the re-homing` — same shape, weaker case |
| B-5 | nit | 91 | `PLY` used and never defined |
| A-2 | nit | 965–978 | The security table alone has no ground-truth column |
| A-3 | nit | §29 | The fates table is not literally last; `## Sources` follows |
| D-3 | nit | 1196, 1211 | Two cost targets kept side by side; deliberate and argued |

Nothing in the merge brief's required contents is missing. The provenance discipline holds across
roughly 400 tagged paragraphs with one substantive miss. The document's own two check files
(`spine-crosscheck.md`, `parts-bin-census.md`) verify every count in §29 and are what caught C-3.
