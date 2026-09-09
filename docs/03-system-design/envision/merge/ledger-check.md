# Ledger check — §27 and §28 of `2026-09-02-THE-SYSTEM.md` against their four sources

*Fact-checker's note. Every cell of §27 (32 rows) and §28 (16 rows) was checked against the full text of
`2026-09-02-mind-1.md` (M1, 2,255 lines), `2026-09-02-mind-2.md` (M2, 1,270), `2026-09-02-mind-3.md`
(M3, 1,970) and `../dream/2026-09-02-THE-SYSTEM.md` (WAKE, 619) — all four read end to end, not sampled.
Verdicts: **CONFIRMED** (the source says it, quote and line given), **PARTLY** (the source says something
adjacent and the difference matters), **NOT FOUND / MISATTRIBUTED** (the source does not say it).
Line numbers are of the source named, not of the merge.*

**Result: 37 of 48 rows fully confirmed. 2 misattributions. 9 partials. The §0 crosscheck count is
correct.**

---

## Headline findings

| # | Row | Finding |
|---|---|---|
| 1 | §27 row 29, cell **M1** | **NOT FOUND.** M1 contains no occurrence of *red*, *dissent*, *adversarial*, *devil* or *heretic*. It never takes a position on assigned dissent and never uses the phrase "red bets". |
| 2 | §27 row 25, cell **M3** | **MISATTRIBUTED.** M3 refuses repetition by a hash over `(tool, arguments)` on a **sliding window**, with no attempt-count threshold anywhere. "on the third" is M2's number, not M3's. |

---

## §0 — the crosscheck count

> *"found thirty-three claims that at least two spines make and **twenty-two that all three make**"*

**CONFIRMED.** `merge/spine-crosscheck.md` table 1 holds exactly **33 rows** (A1–A33), of which **22**
carry `**3**` in the Count column (A1, A2, A6, A7, A8, A9, A11, A12, A14, A17, A18, A19, A20, A21, A22,
A24, A25, A28, A29, A30, A31, A32). The remaining 11 carry 2. Derivable:
`awk '/^## 1\. Blind agreements/,/^## 2\./' merge/spine-crosscheck.md | grep '^| A' | wc -l` → 33; the same
pipeline with `grep -c '\*\*3\*\*'` → 22.

---

## A caveat that applies to six rows at once, and is not an error

Rows 1, 2, 3, 9, 10 and 12 are marked **blind**. The merge's own preamble defines the marker as *"Rows
marked blind were disagreements between the spines"* — i.e. it dates the *disagreement*, not the cell
contents. Every one of those six disagreements **is** in `spine-crosscheck.md` §2 as a blind disagreement,
so the markers are correct. But the cells frequently quote the mind's **post-reading body position**, not
its spine:

- Row 2, M1 "two atoms: the bet and the debt" — the spine had **one** atom; the debt arrives in
  *Where the spine was wrong* #1 (M1:97–103).
- Row 3, M1 "three questions in a fixed order … no cardinal score" — the spine said *"the open bet with
  the highest expected information per dollar"* (M1:28–29), a ranking. The Why column is transparent about
  this (*"M1 corrected its own spine to this"*), so it is disclosed rather than hidden.
- Row 10, M1 "hunt · walk · watch · serve · sleep" — the spine's four were *Hunt · Walk · Hold · Client*
  (M1:69–70). Both sets are represented across the row and its losing-images column.
- Row 9, M2 and M3 — neither spine has a fuse or a strip; those are body mechanisms.

No verdict below is downgraded on this basis; it is recorded once so a reader does not take a **blind**
cell as a spine quotation.

---

## §27 — row by row

### Row 1 · The name, blind — **all CONFIRMED**
M1 "**The name is THE HOUSE.**" (M1:12). M2 "**The name is CONTINUO.**" (M2:11). M3 "**The name is
WATCH**" (M3:9). Losing images resolve: *the house* as the fleet and *the continuo* as the debts line are
the merge's re-homing, both flagged `NEW in the re-homing` in §1.

### Row 2 · The unit of work, blind — **CONFIRMED** (see blind caveat)
M1 "There are **two atoms**: the **bet** and the **debt**." (M1:101). M2 "**Ply** … WAKE §6, taken whole.
My spine called this a 'bet'" (M2:163) and "I had 'Bet' and 'Move' as separate primitives … I fold them"
(M2:114). M3 "The unit of WATCH is not a role. It is a **commission**" (M3:27–28); three goal kinds at
M3:39–43; the keel at M3:313. Losing images all appear under those names in their sources.

### Row 3 · What selects the next act, blind — **all CONFIRMED**
M1 "No score. No rank. No weight. Three questions in a fixed order" (M1:505); flip test M1:360; lethality
order M1:529–537. M2 "Not a loop. A **standing auction**" (M2:43) with the cardinal `value(move)` formula
(M2:277). M3 "a tick spends only if its outcome would change what happens next" (M3:36); "Keel work does
not have to justify itself by information. It justifies itself by the definition of done." (M3:453–454).
Why column CONFIRMED both halves: M1's own correction (M1:105–114) and M2 "CONTINUO's is mis-allocation"
(M2:1126). Losing images CONFIRMED: reserve (M2:242), *doing nothing is a purchase* (M2:244), record of
declines (M2:1204), *a bid that never withdraws* (M2:304).

### Row 4 · How debts are handled — **all CONFIRMED** *(priority row)*
- **M1 CONFIRMED.** "**Debts are not ranked against bets, ever.** A debt that is due is done." (M1:395).
- **M2 CONFIRMED, both clauses.** Obligations "enter the auction at high appetite by construction"
  (M2:352). Durable execution: "These run on durable execution (§15.3), because a deliverable that must
  complete exactly once … is the bass line" (M2:1222) and "**Durable execution for the bass.**" (M2:962).
- **M3 CONFIRMED.** Clock as opener (M3:442–445); "they are goals opened by the clock, they cannot be
  deprioritised by any allocator" (M3:1814–1815); Tend posture (M3:396, 408–411).
- The losing image *obligations at high appetite in the auction* is recorded verbatim in merged Law 4,
  which is consistent.

### Row 5 · May the founder model license action — **all CONFIRMED** *(priority row)*
- **M1 CONFIRMED.** "**Answer a question of preference.** Not in copy, not in design, not in positioning
  … Not at any accumulated score, in any domain, at any AUC." (M1:984–985).
- **M2 CONFIRMED, verbatim.** "**The model of the founder may decide what not to ask. It may never decide
  what to do.**" (M2:681).
- **M3 CONFIRMED on all three clauses.** The Taste (M3:754–765). *No explicit refusal*: M3's §21 "Refused"
  list (M3:1599–1632) refuses *"The founder as a retirement stage, and falling questions as the health
  metric"* (M3:1601) — the role, not the licence; M3's only carve-out is identity, "WATCH never decides
  what company this is" (M3:559), which is WAKE's own exception rather than a refusal of it. **M3 nowhere
  grants the licence either.** *Eventually the taste document* is exact: field-map row "| Brand voice |
  **Blind** | the founder, and eventually the taste document |" (M3:1009). Capture check (M3:1159–1164).
- Why column CONFIRMED: M2 "**the score rises exactly when it becomes invalid**" and "A rubber stamp and
  an agreement produce byte-identical data" (M2:675); M1 "**a model of a person cannot be validated by
  anything except that person, so using it to avoid asking them removes the only signal that could ever
  correct it**" (M1:989–990).

### Row 6 · The health metric — **all CONFIRMED** *(priority row)*
- **M1 CONFIRMED.** "fact-questions per unit of output → must fall … preference-questions per unit of
  output → must RISE." (M1:1025–1027).
- **M2 CONFIRMED, all three numbers.** "**Dollars per entry in the Book** … **Founder-minutes per unit of
  output** … Both must fall." (M2:527–531); "**founder interventions per surviving artifact** … It should
  fall." (M2:1065).
- **M3 CONFIRMED, both numbers and both directions.** "**Founder-originated work that shipped** … which
  must stay above a floor. And **the share of the founder's minutes spent choosing between
  machine-generated options**, which must stay below a ceiling." (M3:1159–1164).
- Losing image *WAKE's single falling curve* CONFIRMED at WAKE:343.

### Row 7 · The unit of time — **M1, M3 CONFIRMED; M2 PARTLY**
M1 "It is a **watch**: one window, with a helm, a crew, orders, and a log." (M1:593–594). M3 "a sequence
of short watches inside the window, each one relieving the last through §9, each one crash-only"
(M3:1358–1359).
**M2 PARTLY — "five a day".** M2's §5.3 says *"the unit of time is the **tide**, and there are **four or
five** of them a day"* (M2:250); the flat "five" appears only in the five-sentence picture, "Five times a
day the cup refills" (M2:147). Flood/slack/ebb (M2:252–256), the 240-second tick (M2:266) and the dog
watch (M2:262) are all exact.

### Row 8 · The boundary's classes — **all CONFIRMED**
M1's three classes with *drill the undo* / *drill the delay* (M1:905–928). M2 "what does it cost to undo
this, in money, time, reputation and law? … Cheap in all four … Expensive in any one" (M2:699–703). M3
same four plus "**The undo estimator is itself an instrument, and it is graded.**" (M3:539). Why column
verbatim from M1's correction #3: "A refund is not an un-payment; a delete is not an un-post" (M1:116).

### Row 9 · Does silence act, blind — **M1, M2 CONFIRMED; M3 PARTLY (inferred)** *(priority row)*
- **M1 CONFIRMED, spine and body.** Spine: "**Every question to the founder carries a recommendation, a
  default, and a deadline; silence executes the default.**" (M1:65–66). Body: "**Silence executes the
  default — but only for reversible items whose undo drill is current** … it is fenced three ways."
  (M1:1332–1341). The three fences are exact: compensable/one-way items expire unexecuted and re-queue; a
  cap on defaults between founder touches, counted per venture; a 72-hour liveness heartbeat.
- **M2 CONFIRMED.** "**Irreversible rows and first-contact rows cannot carry a fuse** … silence is a
  legitimate answer to *which of these two* and never a legitimate answer to *may I charge this card*."
  (M2:813). Fuses on reversible items only ✓ — "The default is always the reversible branch."
- **M3 PARTLY.** The cocked-out strip is exact — "a strip that needs a human is **cocked out**, offset
  from alignment" (M3:1211). But **M3 never states that silence must not execute**; it has no fuse, no
  default and no deadline mechanism at all, and grep over M3 for *silence / default fires / executes the
  default / fuse* returns nothing on point. The "no" is a correct reading of an absence, not a quotation.
  The spine-level "no" is separately supported: `spine-crosscheck.md` §2 records M3's spine as **no** on
  *"Does founder silence authorise action?"*, quoting "only the founder signs one [commitment]" — so the
  **blind** marker is sound even though the body cell is inferred.
- Why column CONFIRMED: M1's founder-with-the-flu passage is nearly verbatim at M1:1338–1341.

### Row 10 · The postures, blind on the dial — **all CONFIRMED**
M1's five (M1:1507–1513: Hunt, Walk, Watch, Serve, Sleep); spine's *Hold* at M1:70 — both *hold* and
*sleep* appear in the losing-images column, correctly. M2's five with appetite and ceiling
(M2:324–340). M3's five (M3:391–397). *Walk* blind in two spines CONFIRMED by
`spine-crosscheck.md` A22 (count 3 on the concept, M1 and M3 on the word).

### Row 11 · Who opens a goal — **all CONFIRMED**
M1 "**A venture is created by the founder. Only ever by the founder.**" and "**an instrument that
contradicts a live belief opens a bet by itself**" and "**The offer is drafted by the house and signed by
the founder, every version.**" (M1:1489–1501). M2's three openers plus "**the fifth** (§11) may open
orphans" (M2:350–356). M3's four openers (M3:422–445). "union, no conflict" is fair.

### Row 12 · Do playbooks survive, blind — **all CONFIRMED** *(priority row)*
- **M1 CONFIRMED.** "make it *earned and perishable*: a path becomes a playbook only after it has won
  several times, it carries an expiry" (M1:45–47); "**Every standard has an expiry**" (M1:1048).
- **M2 CONFIRMED.** "**A method is never written down. A standard always is.**" (M2:74–75).
- **M3 CONFIRMED.** "Structure is *pressure*, never *path*" (M3:57).
- Decided cell CONFIRMED against M2: the four quadrants (M2:608–611); "**Procedure is forbidden where the
  judge is strong and mandatory where the judge is absent and the act cannot be taken back.**" (M2:617);
  "**The checklists are short, there are perhaps a dozen of them**" (M2:619).
- Internal cite `(§19, §11)` checks out: the quadrant text is in the merge's §11 and the reflex-with-expiry
  text in its §19.

### Row 13 · The founder's surfaces — **all CONFIRMED**
M1 desk + room (M1:1309–1414). M2 bridge in three buckets (M2:803), theatre (M2:795), phone as a thin
mirror (M2:819). M3 bay (M3:1206–1231), dailies (M3:1233–1253), phone in three verbs "**Look. Say.
Stop.**" (M3:1271). Losing image *the morning page* is M2's own word (M2:843).

### Row 14 · A live rendering for pleasure — **all CONFIRMED**
M1's room: lights, map, river, replay (M1:1394–1406). M2 "a **theatre** … costs nothing, is never the
place a decision is made … Nothing in the system reads whether you did." (M2:795). M3 "**An office
simulation shows motion, and motion is not progress.**" (M3:1194) and "**It shows state, not events.**"
(M3:1217). Why column CONFIRMED: "I owe the founder an argument there, not an assertion, because they
asked for one by name" (M1:324–325).

### Row 15 · Where divergence comes from — **all CONFIRMED** *(priority row)*
- **M1 CONFIRMED.** "One candidate per round is generated with **no knowledge of the current leader** —
  checked mechanically" and "a **map of cells over a space of real differences**" (M1:1070–1077).
- **M2 CONFIRMED, all three.** "**Forking is a discount.**" (M2:637); "**A map, not a leaderboard.**"
  (M2:647); "The novelty-rejection filter, which stops you generating twenty near-identical candidates"
  (M2:931) and "Novelty is measured against the project's own archive" (M2:649).
- **M3 CONFIRMED.** "**divergence is a line item**. It has its own budget, it is spent on conditioning
  rather than on sampling" (M3:1088); "The thing that makes the forks cheap is the thing that makes them
  alike." (M3:1074).
- Why column CONFIRMED to the digit: "semantic similarity around **0.85**; diversifying the conditioning
  … drops it to about **0.65**" (M3:1078–1080).
- Losing image CONFIRMED: M3's §21 heading "**Forking a shared trunk as the diversity mechanism.**"
  (M3:1619).

### Row 16 · How calibration is reported — **all CONFIRMED** *(priority row)*
- **M1 CONFIRMED, both numbers.** "The house tracks Brier and **suppresses the verdict** below fifty
  resolutions, printing *insufficient resolutions*" (M1:318–320); "**`redefined` is a first-class outcome**
  … unlike calibration it is measurable at n=1" (M1:372–375).
- **M2 CONFIRMED.** "I made 34 predictions; 19 have resolved. **Brier 0.31.**" (M2:1182).
- **M3 CONFIRMED.** Day-7 accounting gives a sentence and no number: "I made 34 predictions; 19 have
  resolved. I am well calibrated about engineering and badly calibrated about what people will pay"
  (M3:1720–1722).
- Why column CONFIRMED: "about **81 resolutions in that bin alone**" (M1:316–317); "the redefinition count
  … is the one number here that cannot be flattered" (M1:450).
- Losing image CONFIRMED: WAKE's "Brier 0.31 overall" (WAKE:456).

### Row 17 · The stores and their names — **PARTLY**
Name lists are exact. M1's ten rooms (M1:411–422) include all eight named plus the Watch and the Room.
M2's four (M2:431–472). M3's five (M3:683–781).
**PARTLY on the Why: "three of four on *Book* and *Bench*".** *Bench* is three of four (M2:165, M3:201,
WAKE:89 — M1 calls it the **Proof House**, M1:416). *Book* is **four** of four by name, but M1's Book holds
**bets**, not beliefs — its belief store is the **Almanac** (M1:413, 415) — so "three of four" is only true
if one counts by meaning rather than by name, and the sentence does not say which. The *Hand* collision is
real and correctly diagnosed: M2 uses **Hand** for an effector in the spine (M2:33) and for a compiled
skill in §8.3 (M2:455), and M3's word is **reflex** (M3:1553).

### Row 18 · How a lesson is written — **all CONFIRMED**
M1 "**A post-mortem outputs a mechanism or a counted nothing.**" (M1:1292). M2 "A pattern is promoted to a
Hand at **three** independent sightings, never at the first" (M2:1063) — note M1 says the same at
M1:1295–1296, so the attribution to M2 is right but not exclusive. M3 "Five fixed questions over the
trace. Not *what did you learn*." (M3:742). Why column CONFIRMED: "**zero of 121 reflections** mentioned
the correct target object … took correct diagnosis from **0% to 86%**" (M3:673–677).

### Row 19 · The handover — **all CONFIRMED**
M1's four-section byte-capped baton with a readback (M1:631–635, 1244–1248). M2 "**Anything that does
travel is read back before it binds.**" (M2:204). M3's four-phase relief, "**A material divergence does
not complete the relief**" (M3:614–625). Why column CONFIRMED: "it converts the summary from an unreviewed
artifact into a *checked* one, which is the first time anyone has put a control on the largest defect
surface in multi-agent work" (M3:629–630).

### Row 20 · Reconciliation — **all CONFIRMED**
M1's Law 1 (M1:441–450) and the §15 table (M1:862–871). M2 has the money instrument and no organ —
"Money | Reconciliation — does the number in the deck equal the number in the payment processor"
(M2:580), "Payments and billing | Reconciliation" (M2:879) — and no reconciliation organ anywhere. M3's
World Ledger (M3:767–781). Why column "two of three called it the largest hole" CONFIRMED: M1 "**The
largest hole in every design in this study, mine included**" (M1:854) and M1:133–134; M3 "The organ nobody
builds, and the one I would build second" (M3:769) and "**§10's world ledger** is the missing organ"
(M3:1631–1632).

### Row 21 · Positions — **PARTLY**
M1's powers (M1:51–53), cells (M1:408), pod (M1:1239) — CONFIRMED. M3's six positions with a may-touch
table (M3:276–284) — CONFIRMED.
**PARTLY on M2's "closed for cache reasons".** M2 gives **two** reasons, not one: the cache argument
(M2:509–513) *and* "the capability profiles of §9.2 are the same six, and **this is why they are a closed
set rather than a dial: they exist to separate the things that must never meet**" (M2:730). The Decided
cell and Why column both get this right ("closed for both reasons"), so the under-statement is confined to
the M2 cell.
**Presentation note.** The Decided cell reads "**six positions** … maker, lookout, looker, judge, mouth,
broker and relay" — seven names. It matches the merge's own §6, where the broker and the relay share one
table row, so the table has six rows; a reader counting names will get seven.

### Row 22 · Forking a company — **all CONFIRMED** *(priority row)*
- **M1 CONFIRMED.** "**Forking a company.** … This is the real engineering project of the whole design,
  and it is the place to start rather than the agents." (M1:2003–2007).
- **M2 CONFIRMED.** "**Forking a company — and I believe this is the wrong project.**" and "The
  dissolution is to notice that the goal is **incoherent** rather than merely hard." (M2:1118–1120);
  "**It forks the artifact and touches the world once.**" (M2:1122).
- **M3 CONFIRMED.** "**Forking a company.** … This is the real engineering project underneath the whole
  design and it is where I would start, before any agent work." (M3:1861–1864).
- Why column CONFIRMED verbatim from M2: "**A company's relationship with the world has no branches.** …
  Forking the world means forking other people" (M2:1120).

### Row 23 · Where it lives — **PARTLY**
M1 "Push after every watch to a private remote." (M1:1894) — CONFIRMED. M3 crash-only on this Mac
(M3:1514–1517) — CONFIRMED. M2's split CONFIRMED in substance: "**The mouth and the record belong on the
always-on machine** … The founder's Mac becomes what it should have been from the start: a client"
(M2:1038). **PARTLY on vocabulary: M2's store is "the record", not "the Log".** M2 has no organ called the
Log; the row uses the merge's name for M2's object.

### Row 24 · The restore drill — **all CONFIRMED**
M1 "Once a month the house restores the entire fleet into a scratch directory **from the remote alone**"
(M1:1900–1901). M2 "Twice a year, on a machine that is not this one … the drill produces a number"
(M2:1030). M3 "Backups restore | a real restore, **on a schedule**, or the backup does not count"
(M3:968).

### Row 25 · Refusing repetition — **M1, M2 CONFIRMED; M3 MISATTRIBUTED** *(priority row)*
- **M1 CONFIRMED, exactly.** "**Repetition is refused on the second attempt, on a semantic key.** Hash the
  tool identity plus a canonicalised argument set" (M1:1119–1123).
- **M2 CONFIRMED, twice.** "the **third attempt** at an approach whose hash matches the previous two"
  (M2:370); "a *we already tried that* check that hashes the approach and **refuses a third attempt**"
  (M2:651).
- **M3 MISATTRIBUTED on "on the third".** M3's mechanism has no attempt count: "**A hash over `(tool,
  arguments)` on a sliding window** is the only real loop detector found anywhere in the five, and it is
  necessary and not sufficient" (M3:475–477), plus a pre-action check against the dead-ends file
  (M3:471–473, 749–752). Grep over M3 for *third attempt*, *on the third* and *third sighting* returns
  **nothing**. The completion half of the cell is exact — "The keel/weather split is what completes it: on
  the keel, repetition against a fixed definition of done is a fault; in the weather it is the method."
  (M3:477–478). **Fix: M3's cell should read "by hash over (tool, arguments) on a sliding window, completed
  by the keel-and-weather split", with no number.** The Decided cell and Why column are unaffected.

### Row 26 · The cost figure — **all CONFIRMED**
M1 "**The honest target for a pre-revenue founder is $10 to $40 a day**" (M1:1181) and "**Six rules**"
(M1:1145). M2 "I am not going to pick a number between them. I am going to say what determines it"
(M2:1075) with the formula and "**Dominant term, by a distance: whether siblings hit the cache.**"
(M2:1083). M3 "somewhere between about **$130 and $1,700** … run **ten real moves** and read the reported
cost" (M3:1828–1830). Losing image CONFIRMED: WAKE's "$30 to $80" (WAKE:425).

### Row 27 · What rings the bell — **all CONFIRMED**
M1's four (M1:1356–1359: one-way door, damage, kill criterion, statutory debt). M2's four (M2:829: the
Line, damage, a kill criterion, a contradiction). M3's four are identical to M2's (M3:1285–1290), so "the
same as M2" is exact. The union is five.

### Row 28 · Research — **all CONFIRMED**
M1 "**Law 4 applies to reading**: a search that cannot flip a decision is not run" (M1:1191). M2's Book
write rule applied to sources: "It makes **research honest**: a search that confirms is compressed to a
tally and a search that contradicts enters with its source, its date and the exact quoted sentence"
(M2:451). M3 "And research is **weather, never keel**." (M3:915). *Minor note:* the exact phrase "the
Book's write rule … applied to reading" is **M3's** (M3:906); M2 holds the position in substance, under
different words.

### Row 29 · Assigned dissent — **M2, M3 CONFIRMED; M1 NOT FOUND** *(finding)*
- **M2 CONFIRMED.** "**No assigned dissent.** CONTINUO has no devil's advocate, no Heretic persona, no
  adversary agent, no board of characters … **red plies**" (M2:663–665).
- **M3 CONFIRMED.** "a standing share of the weather is spent trying to break the company's own live
  conclusions … What WATCH does *not* build is an assigned devil's advocate, because inauthentic assigned
  dissent is measurably weaker than genuine dissent and can entrench the view it was meant to challenge"
  (M3:1567–1573).
- **M1 NOT FOUND.** Grep over the whole of M1 for `red`, `dissent`, `adversar`, `devil`, `heretic` returns
  **zero matches**. M1 states no position on assigned dissent, and the phrase "red bets" does not exist in
  it. The two nearest things are not the claim: M1's **unearned share** (M1:492–496, 1051–1056) is aimed at
  *confident rejection by the Second*, which is the fifth, not adversarial pressure; and in the first-week
  narrative, "something aimed at breaking the house's own conclusions survives for the first time"
  (M1:2149–2150) — an unnamed mechanism in a scenario, never defined as a category and never called red.
  The only adjacent refusal is of "the persona frameworks, which are playbooks with a bigger star count"
  (M1:1699), which is about vendored libraries, not about assigned dissent as a design choice.
  **The Why column "all three" therefore overstates by one.** M1 is silent, not agreeing.

### Row 30 · Synthetic customers — **all CONFIRMED**
M1 "**Synthetic customers.** … the most seductive wrong turn available." (M1:311–314). M2 "one refusal
that is not a repository: **synthetic customers**, which VIGIL wanted and WAKE refused and I refuse with
it" (M2:968). M3 "WATCH refuses it by construction" (M3:1052–1058). WAKE:271 and WAKE §21 row 6 confirm
"the Orrery's population, cut in round one".

### Row 31 · Erasure against an append-only Log — **all CONFIRMED**
M1 "Forgetting is by **rent, into compost, never by deletion**" (M1:717). M2 "**nothing is deleted to meet
a cap**" (M2:987). M3 "a person's right to erasure means **the record must be able to lose something on
purpose**, and that has to be built rather than apologised for" (M3:1815–1817). Why column CONFIRMED —
M3's own hash-absence rule is at M3:1495–1497: "A hash with no blob behind it is a *known absence*, which
is a recoverable state".

### Row 32 · Harness or organisation — **all CONFIRMED**
M1 "**An organisation** … it **persists, owns, owes, remembers, and answers for itself** … **no titles, no
reporting lines, no headcount and no agent with a name**" (M1:260–265). M2 "**Neither, and the third answer
is the useful one.** … **the list of things a company must do or die, each owing evidence on a clock**"
(M2:861). M3 "**A crew is the third thing, and it is what WATCH is.**" (M3:265).

### The three "false disagreements" paragraph — **CONFIRMED**
*Only surprise enters the Almanac / Book*: M1's refusal is real (M1:1967–1970) and the reconciliation is
sound, because WAKE already says "**Confirmed predictions compress to a tally**" (WAKE:112), and M1's
sharpening — unresolved and redefined counted separately (M1:693–694) — is what the merge takes.
*load / contingent*: M2 "**load** how much else collapses if that belief is false" (M2:284); M1
"`contingent` | The other bets that cannot resolve until this one does" (M1:350) and "ties broken by how
many other bets are contingent on it" (M1:575). Same term, two words. CONFIRMED.
*retirement stage / preference*: M3:1601 and M1:984–985. CONFIRMED.

---

## §28 — row by row

### The Understudy's licence — **all CONFIRMED** *(priority row)*
WAKE's part correctly located: §7 step 3's fourth judge class, "Understudy s = calibration on this founder
in this domain" (WAKE:182), and Law 6's third reason, "since the Understudy is an instrument on the Bench
whose license is what lets WAKE act alone in taste domains" (WAKE:359).
- **M1 refused by name.** "**The Understudy as an instrument with authority.** This is the one I refuse
  hardest" (M1:1954).
- **M2 refused by name.** "**Then WAKE makes its calibration a license to act** … I refuse this, and it is
  the one place where I think WAKE is not merely different from CONTINUO but wrong." (M2:671); also
  M2:120.
- **M3 refused the role it implies.** "**The founder as a retirement stage, and falling questions as the
  health metric.** … it is the refusal I would defend hardest." (M3:1601). Correctly *not* claimed as a
  refusal of the licence itself — consistent with §27 row 5's "no explicit refusal".
- "WAKE's own §19 named the loop as unsolved and then built on it" CONFIRMED: WAKE:493.

### The Vigil — **PARTLY**
WAKE's part exact: "**The Vigil** | engine | The night, 22:00 to 06:00, structured as a germinal centre"
(WAKE:94); eight unattended hours (WAKE:269, 315).
"nobody as a night" CONFIRMED — M1:301, M2:248, M3:1610.
**PARTLY on "all three as an ordered set of phases."** M1 CONFIRMED (the watch's eight named phases,
M1:596–640, settle before make). M2 CONFIRMED and explicit — "the phases are not decoration — they are
**ordered by data dependency**, which is the one thing WAKE got right about its night" (M2:250). **M3
does not have one.** M3's night is "a sequence of short watches inside the window … each one crash-only:
read the state from disk, take one move, write, exit" (M3:1358–1359); its only ordered set of phases is
the **relief** (preview, brief, read-back, sign-off — M3:614–625), which is a handover procedure, not the
night's ordering. So "The ordering by data dependency survives" is carried by M1 and M2, not by three.
The two reasons in the last column are both CONFIRMED: 01:30 (M2:248) and "a fixed nightly ritual is a
schedule, and a schedule spends without asking whether the spend changes anything" (M3:1614–1615,
near-verbatim).

### The Orrery — **all CONFIRMED** *(priority row)*
WAKE's part exact: "**The Orrery** | engine | A running model of the company's numbers: funnel, cohorts,
cost curves, cycle, cash, each with measured uncertainty. It **prices** a ply before it runs and its own
predictions are bets scored against reality." (WAKE:92).
**"nobody by name" CONFIRMED mechanically** — grep for `orrery` across M1, M2 and M3 returns **zero
matches in all three**.
M1's day-two funnel CONFIRMED: "**The first crude model of the funnel is built** and its output is not a
recommendation: *here are the three assumptions that dominate every outcome, and the cheapest test of each
this week.*" (M1:2124–2125). The merge quotes it as "a first crude model of the funnel" — article changed,
sense identical.
"already stripped its population" CONFIRMED (WAKE:92 "It contains no simulated people"; WAKE §21 row 6).
"Its role as *the thing every decision goes through first* was already narrowed in round one" CONFIRMED
(WAKE §21 row 7: "VIGIL's 'goes through it first' narrowed to pricing").

### The Edition — **CONFIRMED**
WAKE's part exact: "One page, written at 05:00, that fits on a phone without scrolling: the map, the
forks, the receipts with undo, the surprise, the number that moved." (WAKE:96).
"all three kept its contents" CONFIRMED — M1's desk (M1:1433–1438), M2's morning page (M2:843), M3's
dailies (M3:1249–1253) each carry the map/forks/receipts/surprise/number and the *things I got wrong*
heading.
"none kept it as one surface" CONFIRMED **on the load-bearing reading**: no mind kept one surface doing
both the decision queue and the view of the work. Worth noting that both M1's desk and M2's morning page
are still single phone-sized pages; what each mind split off is the *watching* half (M1's room, M2's
theatre, M3's bay).
"the founder's measured behaviour is opening rendered pages, not reading summaries" CONFIRMED at
M3:1190, 1245–1247.

### Sideways replay — **all CONFIRMED** *(priority row)*
WAKE's part exact: "Sideways: the last days are replayed as counterfactuals against the Orrery, *what if
we had answered that ticket in four minutes* … kept only if it would have changed a decision" (WAKE:305).
**"nobody" CONFIRMED mechanically** — grep for `counterfactual` and `sideways` across all three minds
returns exactly **one** hit, M2:958, and it is a rejection in a different context ("Pointing a
durable-execution engine at plies would be using recovery infrastructure to do counterfactual simulation,
and it would fight you every step").
**"all three kept the backward replay" CONFIRMED**, and the §28 closing paragraph's finer account is right
about where each put it: M1 explicitly — "the backward replay asks of every dead bet, against this month's
Almanac, *would we still have killed this?*" (M1:1127–1130); M2 in the graveyard's re-check (M2:471, 1200);
M3 in the archive (M3:1788–1791).
The reason given — a counterfactual against a model is "a model having opinions about a model" — is WAKE's
own phrase for the circular case (WAKE:496).

### One health metric — **PARTLY**
WAKE's part exact: "**questions per week, per unit of output, should fall.**" (WAKE:343).
**PARTLY on "all three found the same flaw from different sides."**
- **M1 CONFIRMED, and it is the sharpest statement of it.** "That metric is satisfied perfectly by a
  system that has quietly stopped consulting the founder about anything … it is gameable in precisely the
  direction of the failure it was meant to catch." (M1:1017–1020).
- **M3 CONFIRMED.** "WAKE's health metric is that **questions per week per unit of output should fall** …
  It is a beautiful design and **it optimises for the founder's *absence***." (M3:1129–1131).
- **M2 NOT FOUND on this point.** Grep over M2 for `health metric`, `questions per`, `asked less` and
  `asks less` returns **nothing**. M2 replaces the metric in effect — two weekly numbers (M2:527–531) plus
  founder interventions per surviving artifact (M2:1065) — but never states WAKE's metric, never names its
  flaw, and its §23 ledger's "Refused" column (M2:1230) does not list it. M2 is silent, not concurring.
- The fate ("Replaced by three lines") and the last column ("satisfied perfectly by the failure it was
  meant to catch", M1's own words) are CONFIRMED.

### Autonomy is computed, never configured — **PARTLY**
Law 3 CONFIRMED at WAKE:110: "There is no permissions file and no tier for a human to assign."
**PARTLY on the description "no permissions file, no tier, no configured envelope of any kind."** WAKE
itself configures three numbers: "**The three thresholds are the only configured numbers in the system**"
(WAKE:197). The §28 closing paragraph gets this right — it lists "The **three thresholds** as the only
configured numbers about trust" among what WAKE won — so the two passages of §28 disagree about whether
WAKE configured anything.
"all three kept the computation; all three configured an envelope, drives, figures, standing orders"
CONFIRMED — M1's drives (M1:1507), M2's figures (M2:318–344), M3's standing orders (M3:361–373).
"WAKE could not express a project that should sit still, and the founder asked for one twice" CONFIRMED
near-verbatim from M2:118: "there is no representation anywhere of a project that should sit still. The
founder asked for exactly that and asked for it twice."

### The ply as the one unit — **all CONFIRMED**
WAKE §6 (WAKE:124) and "Agents, in this design, are weather." (WAKE:98).
M2 "WAKE §6, **taken whole**" (M2:163). M1 "**One unit of work.** WAKE's ply carries a wager as a field,
which makes every unit a hypothesis. Then nothing renews the domain. Two atoms" (M1:1980–1981) — the last
column is M1's sentence almost verbatim. M3's commission/keel/weather (M3:27, 313, 319).

### The night lengthens to eight unattended hours — **all CONFIRMED**
WAKE:269 and WAKE:470. "nobody" CONFIRMED: M1 "**An eight-hour night.** Fact 1. There is no eight-hour
window. There are watches." (M1:301); M2:248; M3:1610–1611. "Replaced by five useful hours" CONFIRMED —
all three day-7 accountings say "about five hours" (M1:2160, M2:1180, M3:1718).

### The cost table — **all CONFIRMED**
WAKE's table exact: 400 cells, $30–$80 a night, "about $60" for the first week (WAKE:421–426).
"M1 kept the week's $60-ish" CONFIRMED: "We spent $63 by my count and $63 by the provider's" (M1:2172).
"nobody kept the nightly figure as an estimate" CONFIRMED: M1's $10–$40/day is a *target* (M1:1181), M2
refuses a number (M2:1075), M3 gives a monthly range (M3:1828).

### Brier 0.31 on day seven — **all CONFIRMED**
WAKE:456. M2 kept it (M2:1182). M1 refused it: "**I will not show you a calibration number for months** —
19 resolutions cannot support one, and anybody who shows you one on 19 is showing you noise."
(M1:2163–2165). M3 gave a sentence (M3:1720–1722).

### Singularity — **all CONFIRMED**
WAKE:57 verbatim, both halves. "nobody; all three built the fleet" CONFIRMED — M1 §26 (M1:1478), M2 §7
(M2:378–380), M3 §17 (M3:1316). The half kept is M2's sentence: "**the part that cannot be transferred is
the founder, not the company**" (M2:380).

### Hands are never handwritten, only compiled — **all CONFIRMED** *(priority row)*
WAKE's part exact: "Not handwritten; **compiled** from lessons that paid rent long enough to become
reflex." (WAKE:90, and WAKE:223).
- **M1 kept the rule for knowledge.** "A path becomes a standard only by winning. After N successes … a
  path is compiled" (M1:1041–1044); "Knowledge learned from outcomes indexes itself, by usefulness."
  (M1:776). *Worth knowing:* M1 also has a door (M1:1598–1629) and lets skills re-enter one at a time
  through it (M1:1720–1727) — the same softening the merge lands on — so M1 and the fate are closer than
  the row implies. The row's narrower claim, that M1 kept the rule **for knowledge**, is still accurate.
- **M3 kept it.** "Lessons become reflexes. A lesson retrieved many times with good outcomes … gets
  *compiled*" (M3:1553–1557).
- **M2 refused it for the world, and the whole clause is verbatim.** "**That rule is right about
  handwritten *knowledge* and wrong about the world, because it leaves the system unable to accept a
  gift.** There are 177 catalogued open-source projects … the census found that **zero** of the 177 are
  cited by anything in the existing system. **A door that nothing has ever come through is a wall.**"
  (M2:906). The last column's sentence is M2's own.

### Forking a whole company as the real engineering project — **all CONFIRMED**
WAKE:492 exact, including "branchable databases and snapshot microVMs". M1 kept (M1:2003–2007), M3 kept
(M3:1861–1864), M2 dissolved (M2:1118–1122). "the one row here where the merge took one mind against two
and WAKE" is accurate.

### The Kill-Criteria Keeper as a named function — **all CONFIRMED**
WAKE §14 (WAKE:383). "all three kept the mechanism; nobody kept the name" CONFIRMED: M1 keeps it unnamed
(M1:946–951, and the March/September sentence verbatim); M3 as "kill criteria … recorded verbatim with the
date" in the standing orders (M3:371); M2 as "**The stop sentence**, in the founder's own words, with the
date they said it" (M2:344) — M2 *cites* the name as provenance ("This is VIGIL's Kill-Criteria Keeper …
I take it unchanged") while not using it for its own object, which is consistent with the row. The renamed
form, "the stop sentence", is M2's word.

### The catch-all "kept" row — **PARTLY**
The eighteen named parts do survive and are tagged in the merge. **PARTLY on "all three, most of them
blind."** Several of the names are WAKE coinages that could not be blind by name — *the Bench*, *the
Line*, *the Compiler*, *the fifth*, *the Wake* — and `spine-crosscheck.md` §1 does not list them. The
underlying claims of several *are* blind (irreversibility = A17, no roles = A20, memory with provenance
and expiry = A8, context composed = A11/A12, contact over rulebook = A32), and *the reverse seal* is in all
three bodies (M1:1466, M2:853, M3:1778). Read as "the ideas, mostly blind; the names, WAKE's" the row is
true; read literally it is not.

### The closing "what WAKE won" paragraph — **CONFIRMED**
Three thresholds (WAKE:197). Backward replay's split across the minds — CONFIRMED as above. The death
condition: "which M3's commission carried as *wake conditions*" is exact — "its goal, its budget, its
assembled context, its standard of done, and its **wake conditions**" (M3:28–29). "unawareness of
termination is 12.4% of multi-agent failures" appears in WAKE:135, M2:183 and M3:1933.

---

## Losing images: does each survive under the name the row gives it?

Every "kept as" name was checked against its source. All resolve except the two below.

| Row | Name given | Verdict |
|---|---|---|
| 3 | *a bid that never withdraws* | ✓ M2:304, verbatim |
| 6 | *M3's choosing-share ceiling* | ✓ M3:1160–1163 |
| 7 | *the tide*; *flood · slack · ebb* | ✓ M2:250–256 |
| 12 | *the perishable playbook* | **coined by the merge.** M1's words are "earned and perishable" (M1:45) and "a path becomes a playbook only after it has won several times" (M1:47). The compound noun does not appear in M1; it is a fair compression, not a quotation. |
| 13 | *the morning page* | ✓ M2:843 |
| 15 | *forking is a discount* | ✓ M2:637, M3:1619 |
| 17 | *Almanac · Proof House · proof mark · Drill Book · Taste · record* | ✓ M1:415, 416, 417; M3:754; M2:431 |
| 21 | *reader*, *sourcer*; *the watch* as a position name; *powers*; the pod | ✓ M2:730 (reader, sourcer); M3:278 (the watch); M1:51 (powers), M1:1239 (pod) |
| 25 | *the third attempt* | ✓ as M2's, M2:370 — but **not** as M3's; see row 25 |
| 29 | *the Heretic, through WAKE* | ✓ WAKE §21 row 8, and M2:664 names it to refuse it |
| 30 | the Orrery's population, cut in round one | ✓ WAKE §21 row 6 |

---

## Summary

| | Count |
|---|---|
| Rows fully confirmed | **37 of 48** (§27: 25 of 32 · §28: 12 of 16) |
| MISATTRIBUTED / NOT FOUND | **2** — §27 row 25 (M3), §27 row 29 (M1) |
| PARTLY | **9** — §27 rows 7, 9, 17, 21, 23; §28 the Vigil, one health metric, autonomy-computed, the catch-all row |
| §0 crosscheck count | **CONFIRMED** — 33 rows, 22 at count 3 |

Nothing in either ledger reverses a mind's position, invents a position a mind did not hold on a question
it addressed, or attributes a decision to a mind that opposed it. The two hard findings are both of the
same shape: a cell that fills a mind's silence with the neighbouring mind's answer.
