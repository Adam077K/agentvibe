> Archival provenance — 2026-09-13: Step 4 attack review, **human and whole-company** perspective (W1, W11, W12, W15; responsibility), on the five F2 candidates at frozen subject `c6d62a3`. Preserved verbatim from the reviewer engine's report file. The reviewer authored nothing in the round, was barred from session files, lane worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, other reviewers' scratch and every prior F2 review, read each candidate's §11/§12 last, and computed every 46-capability table and the founder acceptance load itself rather than reading the candidates' claims. Same model family as every author; independence is procedural only. Archival is not acceptance.

# Step 4 attack — human and whole-company perspective

## Provenance

**Subject.** Commit `c6d62a3` of `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685`, read at
the repository root, read-only. I hold no `Write` or `Edit` tool; nothing under the subject was modified.

**Protocol applied.** `planning/F2/00-acceptance-protocol.md` frozen at `26af5d5`, plus amendment **AM-01**
from `00-acceptance-protocol-amendments.md`. Dimensions judged: **W1** (completeness for unknown future
jobs), **W11** (vision preservation), **W12** (founder attention and competence), **W15** (capability
binding and traceability), and responsibility as a cross-cutting probe. Negative controls §4 items 1, 2, 4
and 8 were applied. Finding classes are protocol §5's (a)/(b)/(c)/(d); **only (d) blocks**.

**Independence — disclosed, not laundered.** I authored nothing in Steps 1–5 of this round. I share one
model family with every author of the five candidates, so independence here is **procedural only**:
separate context, no read of any producer's self-assessment, no read of any lane session file, no read of
any lane worktree. This is not an independent panel and must not be reported as one. Specifically excluded
by the standing bars and by my brief, and not read: `docs/08-agents_work/`, `.worktrees/`,
`docs/vision-system/state.json`, `history.jsonl`, `PLANNING-REPORT.md`, anything under
`planning/F2/reviews/`, and every other reviewer's scratch directory.

**Order discipline.** For each candidate I read §1–§10 and wrote my own list of missing decisions **before**
opening §11 and §12, and treated §11 as a claim to falsify rather than as a summary to accept.

**Computed, not read.** I counted the rows of every §8 capability table myself and checked every id against
`coverage/capability-requirements.json`. Results below; two apparent discrepancies resolved on inspection
and are recorded as resolved rather than dropped.

**Standing caveat, per protocol §8.** No runtime exists. Nothing here was executed. Every judgment is about
**specified behaviour checked offline** by a reviewer of one model family. Nothing in this report
establishes runtime conformance, deployment readiness, or business value.

---

## 0. Capability-table census (computed at `c6d62a3`)

| Candidate | §8 body rows | Distinct CAP ids in the key column | Missing | Duplicated |
|---|---|---|---|---|
| M1 | 18 (grouped) | **46** | none | none |
| M2 | 46 | **46** | none | none |
| M3 | 46 | **46** | none | none |
| M4 | 46 | **46** | none | none |
| M5 | 46 | **46** | none | none |

**No candidate's "all 46" claim is false.** Two suspicions were raised by a first pass and both resolve:

- **M1** binds 46 ids across **18 rows**, five ids to a row in places. The count is honest; the
  *granularity* is a finding (AC-M1-04), not the count.
- **M2 §8's preamble** says "26 of 46 carry no charter", "**Five** name a charter as primary holder", "the
  remaining 15". A naive parse returns 25 / 6 / 15 because the CAP-10 cell is `**— (deliberately)**`, a
  bolded em-dash meaning *no charter, on purpose*. Counting that cell as "no charter" reproduces the
  preamble exactly: **26 / 5 / 15**. The preamble is correct. Recorded so the next reader does not
  re-raise it.

---

## 1. Cross-candidate finding raised before the per-candidate sections, because it is identical in all five

**AC-ALL-01 · class (b) · the fixed founder-competence mechanism is cited by no candidate.**

*Governing requirement.* Protocol §1: the **founder-competence mechanism** and **human responsibility** are
**fixed** unless a lane returns a named falsifier routed to the founder as a decision packet, "never by
preference and never silently". My brief states the mechanism in
`planning/specification/04-human-operation.md` §1–§3 is FIXED. DIRECTIVE §1.6 requires the return of
selected work to be "a designed mechanism, not an optional recommendation".

*Computed passage.* Across all five candidate files, grepped at `c6d62a3`:

```
specification/04 links         : M1 0 · M2 0 · M3 0 · M4 0 · M5 0
"04-human-operation"           : M1 0 · M2 0 · M3 0 · M4 0 · M5 0
ParticipationPlan              : 0 in all five
ParticipationEncounter         : 0 in all five
DomainAssessment               : 0 in all five
AuthorityMatrix                : 0 in all five
DecisionPacket                 : 0 in all five
specification/03 (the ownership resolver) : cited by M1 (2x), M3 (2x), M5 (3x) as bare `03`
                                 NOT cited by M2, NOT cited by M4
specification/04 (human operation)        : cited ONCE in the round — M5 line 593, `[04]`, and for the
                                 no-answer rule, not for the competence mechanism
GrievanceCase / ResponsibilityAssignment : 0 in all five
```

*Expected behaviour.* Each candidate's §6.3 user model should either **inherit** `04`'s fixed mechanism by
name — the one-cycle-per-five-operating-days schedule, the four encounter kinds, the stratified
reproducible-seed selection held **outside the account producer's write authority**, and the recorded empty
strata — or reopen it with a decision packet.

*Counterexample.* Every candidate instead re-derives a founder-return mechanism from the research lanes —
"the delayed unfamiliar-transfer test" reaches four of the five through `R1 TC-29` and `AG-10` rather than
through `04`, which specifies it — and several label the dose **UNKNOWN** or a **(c)-class hypothesis**. `04`
already fixes a dose (one cycle per five declared operating days, within the chosen minutes), a selector (a
recorded reproducible random seed within strata, **outside the account producer's write authority**), a
sampling frame, an anti-flattery rule (empty strata and unavailable originals are recorded, never replaced
by flattering examples) and four encounter kinds. Two accounts of one mechanism now exist, neither
referencing the other, and the fixed one is the one nothing in Step 3 points at.

*Correction recorded rather than silently fixed.* A first pass of this grep reported `04` as cited zero
times in all five. That was wrong: **M5 cites `[04]` once**, at line 593, and it is for the **no-answer
behaviour** rather than for the competence mechanism. The finding stands with the count corrected. `M4` has
**zero** hits on every competence-vocabulary term searched (`practiced competence`, `transfer test`,
`delayed transfer`, `encounter`, `sampling frame`, `stratif*`, `reproducible seed`, `adverse sample`,
`participation`), which is the sharpest instance and is recorded against M4 separately.

*Required contract.* Each candidate's user model names `04-human-operation.md`'s
`ParticipationPlan`/`ParticipationEncounter` as the mechanism it inherits and states only its **deltas**;
any delta is a decision packet. This is **(b)** rather than (d) because an implementer of the whole package
would reach `04` on their own — but the silence is exactly the shape that lets one of the two accounts drift.

**Not a finding, checked and cleared.** `Mission.retired-with-residuals`, `AccountReconstruction` and
`ContradictionSet` — named by M1 §8 as the mechanisms carrying CAP-36/39, CAP-28/44 and CAP-32 and defined
nowhere in M1 — all exist in `planning/specification/` (`05`, `06`, and the record registry). Binding to an
existing record without restating it is legitimate. `standing delegate` does **not** exist there, which is
AC-M1-02 below.

---

## 2. M1 — Capability-differentiated ephemeral agents around shared state

### C1 · The plain-language test (W11)

Renamed into ordinary business terms: **C02** is *the admissions office that logs every incoming job, decides
what kind it is, and says yes or no with a reason*; **C01** is *the owner who approves the week's plan and
authorises dropping a line of business*; an **executor** is *a temp hired for exactly one job and dismissed at
the end of it*; a **skill** is *a written procedure*; a **ConstraintSet** is *the cover sheet of deadlines,
promises and exclusions that must travel with the job*; **FieldAuthority** is *one named person owns each
number, and nobody else may change it*; **HandoffAcceptance** is *nobody is off the hook until somebody signs
for the work*.

Two sentences a business-literate reader would write: *"Every piece of incoming work — a customer complaint, a
supplier's contract clause, a new idea — gets logged, typed and given an owner before anyone touches it. The
work itself is done by temps hired one job at a time, each given only the keys and files that job needs, and
nothing leaves the building until a separate person signs for it."*

**That reads as a company, not as a coding tool, a dashboard or a workflow product.** It is not a roster of
digital employees: §4.1 refuses specialised knowledge as a reason to create a worker and refuses attributable
identity as one, and §6.5 declares the **profile-convergence probe** against itself — *"if the same six shapes
recur, this candidate has a roster it discovered instead of declared"* — with the pre-declared remedy. That is
the correct posture toward negative control 8 and it is the strongest W11 answer in the round.

**Where the rendering strains.** §1 "Summary for the founder" is 40 lines about agents, existence criteria and
handoff cost, and contains no customer, no revenue and no product. Read alone it is an engineering memo about
staffing policy. The company only becomes visible at §8. This is a presentation defect rather than a design
one — the mechanisms *are* company-wide — but W11's probe is explicitly *"describe it to a reader and ask what
it is"*, and §1 is what such a reader would be handed.

**Judgment W11 — sufficient.**

### C2 · The unfamiliar job (W1)

*Invented job, anticipated by none of the 46:* **a supplier holding pre-paid customer money enters insolvency
during a paid pre-order; the administrator demands delivery stop while customers demand refunds, and the
statutory claim window closes in eleven days.**

| Step | M1's answer | Verdict |
|---|---|---|
| Where it enters | `AdmissionRecord` opens from any authenticated channel or native observation; opening grants no authority to act (§3.2.1) | Named, no human edit |
| Who admits it | C02, against the three-class typing matrix; here `no_match` — a *searched* answer (§3.2.2) | Named, no human edit |
| Who owns it | ordered resolver: promise sponsor → service mandate → maintenance/discovery custodian → **the founder's standing delegate**, least-authority-sufficient tie-break (§3.2.4) | Named — but see AC-M1-02 |
| Who performs it | **a capability that does not exist.** `CapabilityProposal` raised by the maintenance custodian, **approved by "the legitimate capability owner"** (§3.2.3, §7 F-1 step 5) | **A human edits the system** |
| What the founder sees | the shed/park record and the re-entry brief (§7 F-6.7) | Named |

M1 does not hide this: §3.2.3 states *"ownership of unknown work needs no edit; the capability to perform it
does … Zero-edit staffing is not claimed,"* and §7 F-1 closes *"A human approved the new capability, and M1
states that rather than claiming otherwise."* Honest — and W1's failure condition is written in the protocol
as *"Fails if the answer is 'the founder adds a new agent/skill/route'."* The candidate's own words satisfy
the failure condition.

**Judgment W1 — insufficient.** The honesty is creditable and changes the disposition of the finding, not the
judgment. See C7: this is not a discriminator, because the same wall stands in front of every candidate.

### C3 · The three named answers

| Question | M1's answer | Reachable? | Has capacity? | Existed before the event? |
|---|---|---|---|---|
| Who accepts a refund (CAP-17) | **the promise sponsor accepts the customer outcome; C04 alone releases the money** (§8) | yes | yes | **yes** — `03` assigns outcome sponsorship *before an offer becomes available* |
| Who owns a grievance from a non-customer six months after closure (CAP-42) | **a standing custodian independent of the disputed production decision, named in the closure record**, via `Mission.retired-with-residuals` (§8) | yes, intake needs no product account | funded? not stated | **yes, by construction** |
| Who sheds a lane at 4× (CAP-45) | **C02 proposes, C01 authorises, `ShedDecision` records what moved and to whom** (§7 F-2.4, §8) | yes | yes | yes |

All three are operative answers, not chapter links. The refund answer correctly splits *accepting that the
customer outcome was met* from *releasing money*, which matches `03`'s separation of remedy from entitlement
and its rule that sales retention and support cannot pay a refund twice.

**The grievance answer is the best in the round and M1 earns it by conceding the objection first:** §8 quotes
the steelman against itself — *"an assignment rule produces a custodian at the moment it is asked, and a
complaint six months after closure needs a party that already existed and can be reached (R8 A-5)"* — and
answers it with **standing accountability, ephemeral execution**, then names the finding that should reopen
the persistence question if that separation proves unreachable. One gap: `03`'s `remedy_authorized` phase
requires the remedy's **funding to be actually reserved** with a named performer, and M1's custodian answer
never mentions funding. See AC-M1-05.

### C4 · Founder attention and competence (W12)

**A week of ordinary operation.** What reaches the founder, and why:

1. **Every acceptance at CAP-01, 02, 06, 33, 38** — the founder is the named acceptance owner of all five (§8
   row 1).
2. **Every taste judgment at CAP-08, 09, 13** — "taste is the founder's" (§8 row 3).
3. **CAP-43** — the designed return (§8 row 18).
4. **Decision packets** for founder-values questions (§3 and §7 F-6.2).
5. **The disjoint-family panel decision**, routed as a packet (§6.1).

That is a defensible weekly load and **not** a full-time reviewer — with one structural exception and one
missing mechanism, below.

**The designed return is present but not bound.** §6.3 opens correctly — *"The founder is a designed
participant, not a fallback"* — then labels the dose **UNKNOWN** and records the return as *"a (c)-class
empirical hypothesis with a protocol, a baseline, a unit, a stopping rule and an owner — not as a claim."*
DIRECTIVE §1.6 requires a designed mechanism. A (c)-class hypothesis about dose is compatible with that
**only if a mechanism exists to be dosed**, and M1 never names the fixed one (AC-ALL-01). §6.3 also never
names **who selects** the returned material; `04` fixes that the selector sits outside the producing
authority precisely so the founder is not shown flattering examples.

**Two things M1 gets right that others should copy.** The re-entry brief carries *what was omitted and what
was contested*, not only what was decided, and the reason is evidentiary rather than aesthetic: in
hidden-profile tasks agents failed to surface private information contradicting group consensus, so a brief
reporting only decisions reproduces that failure for the human (§6.3, §7 F-6.7). And §6.3 states that the
founder is *"an instrument with an unmeasured error rate"* whose value is that his errors are **uncorrelated
with the model family's** — which is the only honest account of the human's role in this round.

**Judgment W12 — insufficient**, on AC-M1-01 and AC-M1-03 together.

### C5 · Capability binding (W15)

Computed: **46 of 46 ids present, no duplicates, no omissions, across 18 grouped rows.** Every row names a
production mode and an acceptance owner. Three findings, below.

### C6 · Responsibility probe

*A non-customer contests a harmful decision; the usual custodian is implicated; the founder is absent (F-6).*

M1's CAP-42 answer says the custodian is *"independent of the disputed production decision"*, which handles
the implication **definitionally** but names no field recording that the custodian is disputed and no
alternate to activate when the named custodian **is** the implicated party. `03` carries exactly this as a
checked guard — `edge.GrievanceCase.received.triaged.v1` reads `/payload/disputed_custodian` and, where true,
requires `neq(independent_escalation_assignment_ref, custodian_assignment_ref)`, with an **absent** field
reading as *unresolved and deny* rather than as "not disputed". M1 has no equivalent and does not cite it.

With the founder absent, §7 F-6.4 puts the item in `parked_awaiting_principal` under *"a standing owner who
holds actual authority to contain but not to decide"*. Containment is not a disposition, and `03`'s
`awaiting_evidence` row is explicit that the deadline and the duty both continue — *"A stopped clock"* is
named as what the phase must not be mistaken for. So a grievance disposition parks behind an absent founder
while its clock runs.

### Findings

**AC-M1-01 · class (d) · a novel job that needs a new capability cannot be staffed while the founder is
absent, and the two rules that collide are both M1's.**
*Passage.* §3.2.3: staffing a genuinely novel kind requires a `CapabilityProposal` "approved by the
legitimate capability owner". §7 F-6.2: "What parks, explicitly: anything needing a founder value judgement,
anything at a consequence class whose supervision requires him, **and any capability creation**."
*Counterexample.* The insolvency job of C2 arrives on day one of the absence with an eleven-day statutory
window. Admission works, typing works, ownership resolves — and the capability to act cannot be created for
the length of the absence. F-6's own required outcome is that *authorized work continues and useful outcomes
are delivered*.
*Missing decision.* Whether a bounded emergency capability-creation path exists during absence, who holds it,
and what its ceiling is. An implementer must invent one of: the work waits (M1 fails F-6 for any novel job
with a deadline inside the absence); a delegate approves (undefined — see AC-M1-02); or the custodian
self-authorises (destroys the §3.2.1 rule that opening a record grants no authority to act).
*Required contract.* A named standing approver for capability creation with a stated consequence ceiling and
an expiry, plus the explicit statement of the maximum tolerable delay when even that is unavailable.

**AC-M1-02 · class (d) · the terminal owner of otherwise-unowned harm is an undefined party.**
*Passage.* §3.2.4: the ordered resolver is "promise sponsor → service mandate → designated
maintenance/discovery custodian → **the founder's standing delegate**". §3.3: "when no mandate covers the harm
at all, custody terminates at **a standing human role with actual authority to act**, not at a queue."
*Computed evidence.* `grep -rn "standing delegate" planning/specification/ coverage/` returns **nothing**. The
term appears **once** in M1, in a list, and is never defined, never given existence conditions, never given
capacity, and never given a consequence ceiling. `03`'s fixed resolver has **three** tiers and no fourth; M1
adds one silently.
*Counterexample.* R8 A-5's test applied to M1's own terminal tier: is the party reachable, does it have
capacity, and did it exist before the event? M1 answers all three for CAP-42's custodian and none of them
here. In a one-person company the honest reading is that the standing delegate **is the founder**, which
makes him the router of last resort for every unowned unknown — the exact W12 failure — and reduces §3.3's
"not at a queue" to a rename.
*Required contract.* Either define the standing delegate as a record with an acceptance act, a scope, a
consequence ceiling and an alternate, or delete the fourth tier and state that the maintenance/discovery
custodian is terminal.

**AC-M1-03 · class (d) · acceptance above C2 is bound to the founder's *availability*, not to his
*participation*, and the two readings build different companies.**
*Passage.* §7 F-6.8: "during the absence, M1 **does not accept** any artifact whose acceptance rests solely on
a same-family model judgement at a consequence class above `C2`. That work parks rather than passing."
*Counterexample.* §8 states every outward artifact is `C3`. An outward customer message accepted on Tuesday
while the founder is at his desk and not looking at it has **exactly** the epistemic status of the same
message on Wednesday while he is away: the model family's correlation does not change with his calendar.
Nothing in M1 connects his presence to the acceptance of the artifact.
*Missing decision.* What makes presence count. An implementer picks: (i) presence alone suffices — the rule is
ceremony and the absence behaviour is arbitrary; or (ii) he must actually review — and since every outward
artifact is `C3`, he reviews every outward artifact, which is the full-time reviewer W12 forbids and §8.18
requires the system to prevent by design.
*Required contract.* State the acceptance rule as a property of the **evidence** — deterministic oracle,
paired-clean-case-calibrated checker, or human cross-family review, with the last sampled under `04`'s fixed
plan — and drop presence from it entirely.

**AC-M1-04 · class (b) · grouped binding hides four genuinely different acceptance owners in one row.**
*Passage.* §8 row 9: "CAP-21, 22, 40, 41 | S1-C07 | Qualified professionals | … | **Qualified professional**".
*Counterexample.* CAP-41 is succession, whose fixed requirement in `03` is *"competent **successor**
acceptance of actual authority, access, duties, unresolved effects and restrictions before transfer"* — a
successor is not a qualified professional and the two cannot be the same acceptance act. CAP-22 is the
capability the protocol §1 names by hand as a completeness test: *who owns a privacy request from a
non-customer*. M1's answer is a professional who may not be engaged, and a rights request carries a statutory
deadline that runs whether or not one is.
*Required contract.* Split the row. Name an internal standing acceptance owner for CAP-22 and CAP-41 with the
professional as a **consulted determination**, not as the acceptance owner. This is **(b)** rather than (d)
because `03` supplies the answers and M1's defect is failing to carry them.

**AC-M1-05 · class (b) · the grievance custodian is standing but unfunded.**
*Passage.* §8: the custodian "role is **standing and named in the closure record**".
*Counterexample.* `03`'s `remedy_authorized` phase is explicit that an authorisation whose funding is not
actually reserved and which lacks a named performer "is an **unowned promise**, not this phase", and the
repaired criterion requires `remedy_reservation_refs` resolving to a live `Reservation`. A custodian named in
a closure record with no reserved remedy fund six months after the venture closed can issue reasons and
cannot pay.
*Required contract.* Closure inventories a funded remedy reserve alongside the custodian, or records
`closed_with_residuals` with the funding gap as a surviving duty.

**AC-M1-06 · class (a), recorded as a strength.** The profile-convergence probe (§6.5) is a pre-declared
negative control against the candidate's own thesis, with the remedy named in advance. Negative control 8 has
something to bite on here and does not on some others.

### My (d) list against M1's §11

M1's §11 walks protocol §5's ten examples, marks **all ten decided**, and adds two open items it names itself
— **O-1** (the metered-path affordance can be observed, not prevented) and **O-2** (the shared record may
itself be a preference-leakage channel into the checker). Both are real, and O-2 is raised by the candidate
against its own central mechanism, which is the behaviour the protocol wants.

**Against the ten, I agree with all ten dispositions.** My three (d)s are **outside §5's ten examples** and
outside §11's two open items: AC-M1-01, AC-M1-02 and AC-M1-03 are none of them. §11's frame is §5's
enumerated list, and that list contains no example about *the approver being absent*, *an undefined terminal
custodian*, or *acceptance bound to presence*. The self-audit is accurate and its scope is narrower than the
class it reports on.

### Dimension judgments — M1

| Dimension | Judgment |
|---|---|
| **W1** Completeness for unknown future jobs | **insufficient** — capability creation needs a human approver (§3.2.3, conceded), and AC-M1-01 makes it unavailable exactly when F-6 runs |
| **W11** Vision preservation | **sufficient** — reads as a company; roster risk named and pre-tested (§6.5) |
| **W12** Founder attention and competence | **insufficient** — AC-M1-03 and AC-M1-02; designed return unbound to the fixed mechanism (AC-ALL-01) |
| **W15** Capability binding and traceability | **sufficient** — 46/46 computed, mode and owner per row, three named answers all operative; AC-M1-04 is (b) |

---

## 3. M2 — Chartered persistent agents

### C1 · The plain-language test (W11)

M2 does the renaming itself and does it well: a charter is *"a standing duty with a named desk that outlives
any particular job, the way a company has a complaints desk or a records office, neither of which is the
person sitting there"* (§1). Renaming the rest: `CarriedRecord` = *the desk's ledger of what is still open and
who has complained*; `ShedNegotiation` = *when we are overloaded we ask each desk what it can give up*;
`eligibility_ceiling` = *the most this desk is ever allowed to reach, which is not the same as what it is
allowed to do today*.

Two sentences a business-literate reader would write: *"It is a company with five standing offices — complaints
and data rights, surviving obligations and closure, continuity and absence, measurement, and records-meaning —
each with a name and a route an outsider can use. The offices do not do the work; temps hired one job at a
time do that, and the office signs for the duty."*

**That is a company, and specifically not a roster of digital employees** — but M2 earns that only because of
a computed fact rather than an assertion. The four most department-shaped capabilities are **blank in the
chartered column**, and I verified each cell at `c6d62a3`: CAP-10 software construction reads
`**— (deliberately)**`, CAP-13 content, CAP-14 marketing and CAP-15 sales all read `—`. §10's five checkable
properties are the right form of W11 answer: no charter produces work, scopes are predicates over obligations
rather than activities, the holder is replaceable and quarterly measured, no department-shaped capability has
one, and 26 of 46 carry none.

**The residual, and it is real.** Read aloud, the five desks are five recognisable corporate functions —
complaints/privacy, contracts/legal, business continuity, quality assurance, knowledge management. M2's
defence is that the boundary follows the **three-part test** of §2.5 (a duty existing between work orders; a
carried record that is not re-derivable inside the duty's deadline; an outside party who must reach it by
name), not the activity. That defence is sound in form. It is not demonstrated per desk — see AC-M2-01.

**Judgment W11 — sufficient**, with AC-M2-01 outstanding against one of the five.

### C2 · The unfamiliar job (W1)

Same invented job: the insolvent supplier holding pre-paid customer money, eleven days to the claim window.

M2 states its own answer against its own interest, under the label **DIRECT OBSERVATION**: *"admission, typing
and acceptance need no human edit; staffing may. Charters arguably make F-1 harder, because a genuinely new
kind of work has no chartered holder — R8's own reading of this fixture, and it is correct."*

| Step | M2's answer | Verdict |
|---|---|---|
| Enters | `Observation` on an admitted integration with its `SourceRecord` | Named |
| Admits | C02, existing rule, bounded discriminator first | Named |
| Types | matched against `duty_scope` **predicates**; where two desks match, narrower scope holds, tie broken by predicate specificity and **recorded** | Named, and better specified than the alternatives |
| Owns | `CT-DUTY`'s holder, **if a predicate matches**. Where none matches, unstated | See AC-M2-02 |
| Performs | ephemeral worker under whatever template fits; **may need a human** to create one | Fails W1's condition |
| Founder sees | the shed record, the charter sheet, the re-entry brief | Named |

**Judgment W1 — insufficient**, on the staffing wall the candidate concedes, plus AC-M2-02 for the ownership
gap that is specific to a charter-keyed acceptance model.

### C3 · The three named answers

| Question | M2's answer | Reachable? | Capacity? | Existed before the event? |
|---|---|---|---|---|
| Refund (CAP-17) | the venture's **outcome sponsor** accepts the remedy decision; **C04** releases the money; **the discharge is the customer's and nobody else's**; if contested after closure, **`CT-STANDING`'s holder** owns it and can reach a funded remedy without the customer re-explaining | yes | funded remedy named | yes |
| Non-customer grievance six months after closure (CAP-42, CAP-22) | **`CT-STANDING`'s holder by name**, via the published `reachability` route, intake needing no product access, proportionate identity checks, acknowledgment, deadline, reasons, escalation to a named human or professional, remedy through C04, continuity via `CT-CONTINUITY`, preserved disagreement | yes | yes | **yes, by construction — the desk exists before any complaint** |
| Shed a lane at 4× (CAP-45) | **C02 decides**; every holder returns a **stated minimum declared in advance, not invented under pressure**, plus the deadline that moves; founder sees the lane, the holder, the duty at risk and **whether the minimum was breached**; a charter never vetoes | yes | yes | yes |

**This is the strongest set of three answers in the round, and two of them are strictly better than any other
candidate's.** The refund answer is the only one that separates three acts rather than two — decision,
release, and **discharge**, with discharge belonging to the customer. That matches `03`'s fixed rule that a
silent customer acquires no new discharge meaning and that partial receipts do not complete an order, and it
is the distinction that stops an internal status closing an external obligation.

The shed answer is the only one in the round with a **pre-declared** minimum. M2's own falsifier is attached:
run the shed decision twice on the same tabletop, once asking named holders and once applying `07` §6's class
reservations with no holder, and count founder reversals and breached minimums. If the arms agree, the holder
binding bought nothing. That is a proper removal criterion for the candidate's own strongest claim.

**The lapse rule is a genuine contribution and no other candidate has it.** A reserved lane carries a lapse
point before its reset window; unconsumed reservation releases automatically and the holder is notified, not
asked, *because the allowance does not roll over — a reserve held back is destroyed, not saved*. Every other
candidate treats a reservation as thrift.

### C4 · Founder attention and competence (W12)

**What reaches the founder in a week of ordinary operation:** the five charter sheets (cadence unstated); any
shed record with a breached minimum, as an alert with a named recipient rather than a log line; decision
packets for founder-only decisions; and the two standing decisions M2 declares blocking. **Monthly:** one open
duty from a roll he did not watch being created, handed to him with an instruction to act on it; plus
acceptance of `CT-INSTRUMENT`'s own instrument readings, which M2 records as *"a real charge against W12's
attention budget … stated as a cost, not as governance."*

**M2 is the only candidate with a designed return that names a dose.** §6.3: *"Per DIRECTIVE §1.6, the return
of work is designed, not offered: once a month he is handed one open duty from a roll he did not watch being
created and asked to act on it."* That is a mechanism, not a recommendation, and it satisfies the shape §1.6
demands.

**It is also narrower than the fixed mechanism, and the gap is specific.** `04-human-operation.md` fixes
**four** encounter kinds per cycle — original customer material alternating ordinary with adverse/abandoned/
underserved cases; an independent taste decision **before advice**; an unusual financial or obligation
explanation with an adverse sample each cycle; and an intervention or recovery rehearsal — selected by a
recorded reproducible seed within strata, held outside the account producer's write authority. M2's single
monthly duty maps onto roughly the fourth. The three it drops are precisely the ones serving DIRECTIVE §1.6's
"understanding customers", "exercising taste" and "judging important work".

**M2 declares the attention cost against itself.** §10 weakness 6: *"Founder attention rises, not falls: five
sheets and one transfer test a month is a real cost charged against W12's own criterion."* No other candidate
states this as a debit.

**He is not the router of last resort.** C02 admits, C02 sheds, desks hold duties. His two blocking decisions
— whether a model may hold a desk carrying external standing, and the size of each reserved lane — are
DIRECTIVE §3 decisions on their face: professional standing and risk tolerance.

**Judgment W12 — sufficient**, with AC-M2-04 and AC-M2-05 recorded as non-blocking.

### C5 · Capability binding (W15)

Computed at `c6d62a3`: **46 rows, 46 distinct ids, no gaps, no duplicates**, each with a production mode
(`D`/`P`/`M`/`H`/`X`), an acceptance owner in C01–C09, and a chartered cell. The preamble's own counts
(26 / 5 / 15) verify exactly once the `**— (deliberately)**` cell on CAP-10 is read as "no charter", which is
what it says. Every named mechanism in the chartered column — `ShedNegotiation`, `reserved_lane`, the charter
sheet — is defined in the candidate. **No binding names a mechanism M2 never defines.**

### C6 · Responsibility probe

*A non-customer contests a harmful decision; the usual custodian is implicated; the founder is absent.*

M2 gets further than any other candidate and then stops one step short. `CT-STANDING`'s holder is the
custodian for grievances — **so when the grievance is about `CT-STANDING`'s own disposition, the custodian is
the implicated party.** §6.6's suspension row is the nearest mechanism and its trigger list is *"a released
effect outside `eligibility_ceiling`; a failed understanding check after a correction; a poisoned or
unresolvable carried entry"* — the disputed-custodian case is not among them. The `Charter` field table has
`reachability` (how an outsider reaches **this** desk) and no field naming an independent escalation target.
See AC-M2-03.

What M2 does supply, and it is more than the others: suspension requires **a named interim holder**, and
*"where none is reachable, **admissions in that duty class narrow** rather than the duty going silently
unheld."* Narrowing intake rather than pretending to hold a duty is the correct failure direction and it is
stated nowhere else in the round.

### Findings

**AC-M2-01 · negative control §4 item 4 FAILED · blocks · `CT-MEANING` is a chartered desk that no fixture
exercises.**
*Governing requirement.* Protocol §4 control 4: *"An agent justified by a capability the fixtures never
exercise … Must be flagged as unjustified."* Protocol §8: a failure of any §4 negative control blocks.
*Computed passage.* `grep -n "CT-MEANING"` over the candidate returns **three** hits at `c6d62a3`: line 147
(the list of five duties that pass the test), line 843 (CAP-32 binding) and line 845 (CAP-34 binding). It
appears in **none** of the six fixtures. `CT-STANDING`, `CT-DUTY`, `CT-CONTINUITY` and `CT-INSTRUMENT` are
each exercised in F-1, F-4 or F-6; `CT-MEANING` is exercised nowhere, including F-5, whose "a source fact
changed during the gap" variation is its natural home and whose walkthrough does not mention it.
*Counterexample.* §2.5 requires **all three** parts of the test to hold and asserts *"Five duties pass"*
without applying the test to any of them individually. Part 3 asks who outside the duty's own production path
must reach this desk **by name**; for `CT-STANDING` that is the non-customer, for `CT-CONTINUITY` the
returning founder, for `CT-INSTRUMENT` and `reserved_lane` the capacity authority. For `CT-MEANING` M2 names
nobody, anywhere in the document.
*Required contract.* Either exercise `CT-MEANING` in a frozen fixture and name the outside party who must
reach it, or drop it and bind CAP-32 and CAP-34 to ephemeral production under C05 and C03, which the rest of
the design already supports. **Note the asymmetry that makes this cheap to fix and expensive to ignore:**
§2.5's whole argument is that the test is refutable, and one of the five was never run through it.

**AC-M2-02 · class (b) · no acceptance owner is named for an admitted duty that matches no charter
predicate.**
*Passage.* §3's decision table: *"Accept the outcome | The named acceptance owner | Yes, **for a duty in its
own `duty_scope`**"*. §7 F-1: *"a genuinely new kind of work has no chartered holder."*
*Counterexample.* The insolvency job matches no `duty_scope` predicate. §11 item 2 answers the handoff case —
*"parent sponsorship persists until an accepted responsibility transfer"* — but this duty has no parent: it
arrives from outside on a supplier's insolvency, not as a transfer from an earlier work order.
*Mitigation, stated honestly.* §2 declares *"M2 adds exactly three records to S1.0 and changes none"*, so
`03-company-capabilities.md`'s fixed ordered resolver (promise sponsor → service mandate → maintenance/
discovery custodian, least-authority-sufficient tie-break) presumably still applies. But that blanket
inheritance is written against `05-work-agents-skills.md` by name and the resolver lives in `03`, which M2
cites **zero** times (computed). **M1 is the only candidate in the round that cites the resolver at all.**
*Required contract.* One sentence naming `03`'s ordered resolver as the fallback when no `duty_scope`
matches, and stating that the resolver's output — not a desk — is then the acceptance owner. This is **(b)**
rather than (d) because the mechanism exists and is fixed; what is missing is the pointer.

**AC-M2-03 · class (d) · a grievance about `CT-STANDING`'s own disposition has no named independent
recipient.**
*Passage.* §8: the non-customer grievance answer routes to `CT-STANDING`'s holder. The `Charter` field table
(§2.1) has `reachability`, `suspension_rule` and `retirement_rule`; none names an escalation target
independent of the holder. §6.6's suspension triggers do not include "a complaint about this desk's decision".
*Counterexample.* `03` fixes this and checks it: `edge.GrievanceCase.received.triaged.v1` reads
`/payload/disputed_custodian` and, where true, requires
`neq(independent_escalation_assignment_ref, custodian_assignment_ref)`; an **absent** field resolves
`unresolved` and denies rather than reading as "not disputed". Under M2 the implicated custodian is a single
named desk, so the case is not hypothetical — it is the ordinary shape of a second complaint.
*Why this is (d) for M2 and only (b) for M1.* M1's answer is *"a standing custodian **independent of the
disputed production decision**"*, which is self-repairing under composition. M2 names one fixed desk, so an
implementer must invent the second route.
*Required contract.* A `disputed_holder` predicate on grievance intake and a required
`independent_escalation` field on every charter carrying external standing, with the guard that the two
assignments differ, plus the existing "admissions narrow when no interim holder is reachable" rule as the
failure path.

**AC-M2-04 · class (b) · the designed return covers one of the fixed mechanism's four encounter kinds.**
*Passage.* §6.3's monthly single duty, against `04-human-operation.md`'s fixed four-encounter cycle.
*Counterexample.* A founder handed one open duty per month retains intervention practice and loses the
customer-material, taste-before-advice and adverse-financial encounters. DIRECTIVE §1.6 lists understanding
customers and exercising taste among the competences the mechanism exists to preserve.
*Required contract.* Adopt `04`'s four encounters and state only the delta, or reopen with a decision packet.
Covered generally by AC-ALL-01; recorded here because M2 is the candidate that comes closest and so has the
most to lose from the gap.

**AC-M2-05 · class (b) · absence-only acceptance rules are bound to the founder's availability rather than to
the evidence.**
*Passage.* §7 F-6: *"During a declared absence, three classes are not accepted by anyone: a taste judgment; an
acceptance resting on a model's judgment of objective correctness (near chance, R7 F5); and any first entry
into a consequence class the company has not entered before."*
*Counterexample.* If a model's judgment of objective correctness is near chance, it is near chance on the days
he is at his desk. Nothing in M2 connects his presence to those acceptances, so either the rule should apply
always — in which case the absence clause is redundant — or his presence is doing work that is nowhere
specified. Identical in shape to AC-M1-03 and AC-M4-03; see C7.
*Required contract.* State the rule as a property of the evidence and delete the absence condition, or name
the act of participation that his presence supplies.

**AC-M2-06 · class (a), recorded as a strength.** Two blocking (d)s declared against itself in §11, plus the
admissibility note that **if the founder's five criteria are a closed list, M2 is inadmissible on the
founder's own gate and should be withdrawn rather than argued**. No other candidate offers to withdraw itself.

### My (d) list against M2's §11

M2's §11 closes all ten of protocol §5's examples and then declares **two (d)-class items against itself,
both blocking**: whether a model may hold a desk carrying external standing (trigger: the first non-customer
rights request; failure: an acknowledgment with no standing behind it), and the size and lapse point of each
reserved lane (trigger: the first `ShedNegotiation`; failure: the first implementer's default becomes the
company's shedding policy). Both are correctly identified, correctly classed and correctly routed as decision
packets. I agree with both and add nothing to them.

**What §11 does not carry:** AC-M2-01, which is a **negative-control failure** rather than a §5 example and
therefore invisible to a self-audit framed on §5's ten; and AC-M2-03, which sits inside the capability M2
declares as its main reason for existing. §11's frame is again narrower than the class it reports on.

### Dimension judgments — M2

| Dimension | Judgment |
|---|---|
| **W1** | **insufficient** — staffing wall conceded; AC-M2-02 leaves acceptance unowned exactly where charters do not reach |
| **W11** | **sufficient** — department-shaped capabilities verified blank; five checkable properties; AC-M2-01 outstanding against one desk |
| **W12** | **sufficient** — the only named dose in the round, and the attention cost declared as a debit; AC-M2-04/05 non-blocking |
| **W15** | **sufficient** — 46/46 computed, preamble counts verify, every named mechanism defined |

**Blocking for M2:** AC-M2-01 (negative control §4.4) and AC-M2-03, in addition to the candidate's own
(d-M2-1) and (d-M2-2).

---

## 4. M3 — Workflow-first, no agents

### C1 · The plain-language test (W11)

Renamed: a `Procedure` is *the written-down way we do this job*; the `Journal` is *the ledger, and the ledger
is the truth*; the `EffectGate` is *the one door to the outside world, and it holds the only keys*; the
`Scheduler` is *the clock and the work queue*; the `RouteTable` is *the classification desk*; the three policy
objects are *the standing rules about who may spend, what gets dropped when we are overloaded, and what a
machine is allowed to sign off*.

Two sentences: *"It is a company that has written down how it does each of its jobs and runs each one the same
way every time, calling a model or a person in at the points that need judgement. Nothing reaches a customer
except through one door, and only a person or a deterministic check can open it."*

**M3 hands you that sentence itself, in §6.3, and simultaneously confesses the risk:** *"M3 is the candidate
most exposed to the workflow-product reading, and pretending otherwise would be dishonest … Whether a reader
hears a company or a dashboard is an empirical question about people, and it is untested here."*

**I judge it sufficient, and the reason is the protocol's own rule.** G's discipline, inherited verbatim into
protocol §1, is *"judge **specified behavior**, not vocabulary"*. M3's vocabulary is engine vocabulary — the
title is literally "Workflow-first" and §2's eleven primitives are all machinery. Its **specified behaviour**
is company-wide and end to end: §8 names an operative acceptance owner for all 46, including who signs a
supplier commitment, who owns a non-customer grievance after closure, and that *"software shutdown is not
closure"*. A reader handed §1 alone would say "a state machine"; a reader handed §8 would say "a company with
an operations manual". W11's probe is about the description of the system, and the system is the second thing.

**One residual M3 names against itself and which W11 should carry forward:** *"no evidence bears on customs
disputes, refunds, supplier commitments or wind-down … **The narrowing risk W11 names is a risk of importing
the evidence base, not only the vocabulary.**"* That sentence is the sharpest statement of the W11 hazard
anywhere in the round, and it is the one candidate that makes it.

**Judgment W11 — sufficient**, nearest to failure of the five, with the exposure recorded by the candidate.

### C2 · The unfamiliar job (W1)

Same job: the insolvent supplier, pre-paid customer money, eleven days to the claim window.

**M3 is the only candidate that completes this walk with no system edit, and it does so through a mechanism
the others do not have.**

| Step | M3's answer |
|---|---|
| Enters | `intake/v1`, WorkRecord in state `unclassified` with the channel's trust class attached; *"admission is a state with a named owner, not a folder"* |
| Types | `classify/v1` exact matchers, then one `model` step returning exactly one of `{procedure_id, no_match, ambiguous}`; the three-way confusion matrix is the instrument and *"the failure to hunt is silent mistyping into the nearest existing kind, and it must never be scored as success"* |
| Staffed | **`unclassified-work/v1`** — a real, versioned, tested procedure: bound the question → gather evidence through model steps holding no credentials → produce a typed decision packet → route to the named triage custodian → the custodian accepts a one-off disposition, **authorises a bounded sequence of effect steps one at a time**, or commissions a new procedure |
| Owned | the ordered resolver of `03`, tie-break reason recorded |
| Cannot rest unowned | `no_match` carries **a declared maximum age**, and *breach of the age is itself an admitted WorkRecord with the founder as acceptance owner* |

**Why this clears W1's failure condition where M1 and M2 do not.** The protocol fails a candidate whose answer
is *"the founder adds a new agent/skill/route"*. M3 adds none: the custodian authorises effect steps one at a
time inside an existing admitted procedure. A **new capability** is needed only to make the handling
*repeatable*, which is a different question from whether this job gets done and owned. M3's own §7 F-1 is more
pessimistic about itself than the fixture requires — it says *"refuses to claim [zero edits] for capability
creation"* — and the concession is about repeatability, not about this job.

**The second half of W1's failure condition — "or if unowned work can rest in a queue" — is closed better here
than anywhere else in the round**, by the declared maximum age whose breach is itself admitted work.

**Judgment W1 — sufficient**, subject to AC-M3-01, which is about what the custodian may actually authorise.

### C3 · The three named answers

| Question | M3's answer | Reachable? | Capacity? | Existed before? |
|---|---|---|---|---|
| Refund (CAP-17) | **a `human` step held by the standing support custodian under a bounded value ceiling; the founder above it.** The effect step's amount is bound to the entitlement record by the procedure — *"a model step may recommend and may never author the amount"* | yes | ceiling stated | yes |
| Non-customer grievance six months after closure (CAP-42) | **a standing continuity custodian named in a continuity arrangement, funded by a remedy reserve**, reachable by a route that survives the retirement of every other procedure in that venture; the grievance procedure's **durable timers keep running after closure** | yes | **funded — the only candidate naming a reserve** | yes |
| Shed a lane at 4× (CAP-45) | **the scheduler, executing a capacity policy the founder endorsed in advance.** Nobody negotiates. Every shed parks with an owner, a deadline and a count | yes | yes | yes, the policy predates the pressure |

**The grievance answer is the only one in the round that names funding.** `03`'s `remedy_authorized` phase is
explicit that authorisation without actually reserved funding and a named performer *"is an unowned promise,
not this phase"*; M3 is the candidate that carries that requirement into its own answer. It also states the
residual it cannot remove: *"the person has to exist and be paid, and no architecture creates them."*

**The shed answer trades a real property away and says so.** *"M3's counter is not that the objection is
wrong; it is that at 4× there is no time to negotiate and a pre-endorsed, auditable order is faster and
reviewable … M3's residual cost is real: **a pre-endorsed order cannot notice that this particular shed is
catastrophic.**"* That is the honest converse of M2's negotiation, and the two are a genuine design
disagreement rather than one being wrong.

### C4 · Founder attention and competence (W12) — **the decisive dimension for M3**

**Computed from M3's own §8, at `c6d62a3`, across all 46 rows of the acceptance-owner column:**

| Acceptance owner names | Count of the 46 |
|---|---|
| the **Founder** explicitly | **19** — CAP-01, 02, 03, 06, 08, 09, 12, 18, 25, 26, 27, 33, 35, 36, 38, 39, 43, 45, 46 |
| a **human** with no standing role named | 15 — CAP-08, 10, 11, 13, 14, 15, 16, 17, 20, 24, 29, 30, 34, 37, 46 |
| union of the two | **32 of 46** |
| an **oracle** | 6 — CAP-10, 11, 28, 29, 37, 44 |
| a named **standing** non-founder role | 8 — CAP-07, 12, 17, 19, 22, 23, 31, 42 |

**M3 reports none of these counts.** Set them beside two of M3's own rules and the consequence is arithmetic
rather than argument. §6.1: *"for irreversible and outward-facing consequence classes, **no model step is an
acceptance step.** Acceptance is an oracle or a person."* §8 CAP-16: *"Human. **Outward = irreversible
class.**"* Therefore **every outward customer communication requires a human acceptance step**, and §8 puts a
human on CAP-13 (*"human accepts every outward claim"*), CAP-14 (*"human accepts each outward channel
commitment"*), CAP-15 (*"no model step may author a promise"*) and CAP-16.

In a company whose standing custodians are not yet staffed — and §10 weakness 2 concedes *"a company with no
reachable second person degrades to 'everything parks'"* — those standing roles resolve to the founder, and
the 32 becomes closer to 40.

**M3's escape from "full-time reviewer" is real but it is a different escape than W12 asks for.** The overload
does not silently land on him; it converts into refusal to admit: *"If no such alternate exists, M3 stops
admitting work in that class rather than letting the record sit assigned and silent — a refusal with a reason,
which is worse for throughput and better for truth."* That is the correct failure direction. It is also,
precisely, DIRECTIVE §8.18's requirement to *"define how the system avoids turning the founder into a
full-time reviewer"* answered with *"it does not; it stops the company instead."*

**The designed return is the best-specified in the round.** `founder-return/v1` is a scheduled procedure whose
selection rule is deterministic: every irreversible-class decision, every shed with a residual duty, every
default-on-no-answer that fired, **a declared share of accepted outcomes sampled before the outcome is known**,
and **a declared share of adverse samples**. Sampling before the outcome is known is the anti-flattery
property `04` fixes by holding the seed outside the producer's write authority; M3 reaches the same property
by a different route and is the only candidate that does. The re-entry brief is a deterministic projection
plus **one model step validated field-by-field against that projection before the founder sees it**, plus
adverse samples he must judge because *"attendance, confidence and agreement with the model are explicitly not
competence."*

**Judgment W12 — insufficient**, on AC-M3-02. The mechanism quality is the highest in the round; the load is
the highest in the round and is uncounted.

### C5 · Capability binding (W15)

Computed: **46 rows, 46 distinct ids, no gaps, no duplicates.** Every row names a dominant step kind and an
acceptance owner, and most rows carry an operative qualifier rather than a label — *"the refund effect's
amount comes from the entitlement record, never from a model output"*, *"a professional is not created by
naming an endpoint"*, *"a successful dispatch does not satisfy a fulfillment guard"*. **This is the most
operative §8 in the round.**

M3 also states where its binding is weakest, which no other candidate does: *"CAP-10 is the row M3 can defend
from published work. CAP-17, CAP-22, CAP-24, CAP-39, CAP-41 and CAP-42 are rows where M3 is reasoning from
operating doctrine and from the package's own boundaries, not from measured agent systems."*

**Judgment W15 — sufficient.**

### C6 · Responsibility probe

*Non-customer contests a harmful decision; the usual custodian is implicated; the founder is absent.*

M3 has two of the three pieces. The grievance route is a standing continuity custodian with durable timers and
a funded reserve, and §6.1's structural rule is directly on point for the implicated-custodian case: *"The
router selects the review step's procedure from committed configuration, never at runtime from the producing
run's state. A design whose routing component can choose who checks its own work has not achieved procedural
independence."* Applied to grievances that rule gives the right answer.

**What is missing is that M3 never applies it to grievances.** There is no predicate distinguishing "this
complaint is about the custodian" from "this complaint is about a decision", and `03`'s guard that does exactly
that — `disputed_custodian` read at `received → triaged`, with an absent value denying rather than reading as
"not disputed" — is not carried across. With the founder absent, M3's terminal element is *"a standing human
alternate declared in the continuity arrangement"*, and if the implicated custodian **is** that alternate,
admission in the class stops. Stopping admission does not dispose of a grievance already received, whose clock
`03` says keeps running.

### Findings

**AC-M3-01 · class (d) · the grant backing an effect step on unclassified work is undefined, and the two
readings destroy different invariants.**
*Passage.* §6.2: *"A grant named in a procedure is resolved against the grant policy when the procedure is
admitted; **an unbacked grant fails admission.**"* §7 F-1 step 3: the triage custodian *"authorises a bounded
sequence of effect steps one at a time"*. §12 ledger row 22: *"Generic `unclassified-work/v1` with every effect
human-gated."*
*Counterexample.* The insolvency job requires filing a claim with an administrator — an effect class the grant
policy has no entry for, because nobody anticipated it. Under §6.2 that effect step cannot be admitted. So
either `unclassified-work/v1` carries a **standing broad grant** covering effect classes nobody enumerated —
which is the omnibus scope M3's own §6.2 refuses, and destroys invariant 2 and the non-composition property
that is M3's whole answer to F-3 — or **every novel effect requires a grant-policy amendment**, which is a
system edit and re-opens W1 for exactly the case §7 F-1 claims to close.
*Missing decision.* Which one, and if the first, what bounds the standing grant.
*Required contract.* A named `unclassified-effect` grant class with an explicit consequence ceiling, a
per-authorisation expiry, a value ceiling and a human authoriser per effect — or the explicit statement that
novel effect classes require a grant-policy change with a named owner and a stated turnaround, in which case
§7 F-1's zero-edit claim must be narrowed to admission, typing and ownership only.
*Why §11 does not catch it.* §11 walks §5's ten examples and item 6 answers permission **composition**
(*"refused, not minted"*), which is a different question from permission **existence** for an unforeseen
effect.

**AC-M3-02 · class (d) · the founder-attention load is the design's central cost and is counted nowhere.**
*Passage.* §6.3 raises the W11/W12 tension and calls it *"an empirical question about people … untested
here"*. §11 open item 2 asks *"whether `unclassified-work/v1`'s custodian is the founder or a standing
non-founder role"* and routes it to the founder as one decision.
*Computed counterexample.* It is not one decision. Across §8's own 46 rows, **19 name the founder and a
further 13 name an unspecified human** — 32 of 46 — and the rules at §6.1 and §8 CAP-16 make every outward
artifact a human acceptance. W12's probe is *"Run a month of the candidate's normal operation. **Count** what
reaches the founder and why."* The count is derivable from the candidate and the candidate does not derive it.
*Missing decision.* Which of the eight standing custodian roles — support, product, treasury, privacy,
security, incident, release, continuity — are **staffed by someone other than the founder before the company
admits work in that class**, and what the company does in each class where none is.
*Required contract.* A staffing precondition per standing role, enforced the way M3 already enforces the
analogous case: *"admission in that class stops"* until the role has a named holder. M3 has the mechanism; it
has not applied it to its own acceptance table.
*Note the direction of the finding.* M3's failure mode is honest — it parks rather than pretending. The defect
is that the company that results may be unable to admit outward work at all, and nobody has been told.

**AC-M3-03 · class (b) · the grievance route has no disputed-custodian predicate.**
*Passage.* §8 CAP-42 and §6.1's routing rule. `03`'s fixed guard
`edge.GrievanceCase.received.triaged.v1`, reading `/payload/disputed_custodian`, is not carried across.
*Required contract.* Apply §6.1's own committed-configuration routing rule to CAP-42 explicitly, with the
absent-field-denies semantics `03` already specifies. This is **(b)** rather than (d) because M3 cites `03`
twice and the mechanism is one sentence away.

**AC-M3-04 · class (a), recorded as a strength.** §11 is the **only** self-audit in the round that walks all
ten of protocol §4's negative controls individually, and it is the only one that records a disagreement with
its own classification: open item 3 states that *"a reviewer could reasonably read it as (d)"* and preserves
the disagreement rather than arguing it away. On that item I agree with M3's (c): the abstain threshold has a
protocol, a unit, a baseline, a stopping rule and an owner, which is what (c) requires.

### My (d) list against M3's §11

§11 classes all ten of §5's examples **(a)** with two (c) residuals, then names three open items, one of which
it flags as arguably (d). I agree with the ten dispositions and with the (c) on the abstain threshold.

**My two (d)s are outside §11's frame in the same way they were for M1 and M2.** AC-M3-01 falls between §5
item 6 (composition) and W1 (staffing) and belongs to neither; AC-M3-02 is a quantity the candidate never
computed rather than a rule it never wrote. §11's third open item — who the unclassified-work custodian is —
is the single-decision shadow of AC-M3-02 and is correctly routed; what it misses is that the same question
recurs 32 times in its own capability table.

### Dimension judgments — M3

| Dimension | Judgment |
|---|---|
| **W1** | **sufficient** — the only candidate completing the unfamiliar job with no agent, skill or route added; unowned-queue closure is the round's best. Subject to AC-M3-01 |
| **W11** | **sufficient** — specified behaviour is company-wide; vocabulary is the exposure and the candidate names it |
| **W12** | **insufficient** — AC-M3-02. Best-specified return mechanism in the round, heaviest and uncounted load |
| **W15** | **sufficient** — 46/46, the most operative acceptance column in the round, with its own evidence-thinness declared |

---

## 5. M4 — Hybrid by consequence class

### C1 · The plain-language test (W11)

Renamed: `ConsequenceDerivation` = *a rule that works out, from the company's own records rather than from
anything a worker says, how much damage this particular action could do*; C0–C5 = *harmless · internal ·
goes outside · costs money or makes a promise · touches production or safety · changes who is in charge*;
the five structures = *a script, a temp, a standing desk, a person, an outside professional*; the nine
holders = *front desk, remedy desk, complaints desk, data desk, supplier desk, filings desk, on-call desk,
wind-down desk, and the owner*.

Two sentences: *"It is a company where every action is first sized by how much harm it could do, worked out
from its own records rather than from what the worker claims, and that size decides whether a script, a temp,
a standing desk, a person or an outside professional carries it and who must sign it off. Nine standing desks
exist, each because somebody outside has a right to write to it and a clock keeps running when no job is
open."*

**That is the cleanest company-shaped rendering of the five.** It is not a coding tool, not a dashboard, not a
workflow product, and not a roster of digital employees: the holders are **records** with ephemeral performers
(`performer_binding: "ephemeral-per-contact"`, *"never a model identity, never a session"*), and M4 supplies
its own discriminating test against negative control 1 — *"take one action and change only its consequence
class, holding work, tools, skills and context fixed … If a reader runs that test and observes no difference,
the candidate is S1.0 with new nouns and negative control 1 should fail it."* Offering the falsifying test
against yourself is the correct posture and only M2 and M4 do it.

Its negative-control-8 answer is also the most specific in the round: *"H3 (grievance) and H2 (remedy) both
touch customers and are separate because one must be independent of the disputed decision; H4 (deletion
scopes) and H6 (statutory calendar) both touch compliance and are separate because one is reachable by a data
subject and the other by a filing deadline."* A department roster cannot produce that partition.

**Judgment W11 — sufficient.**

### C2 · The unfamiliar job (W1)

The insolvent supplier, eleven days to the claim window.

**M4's distinctive move is real and it is the best single idea in the round on this dimension: the class is
computed before the kind.** §3: *"A job whose kind is unrecognised still has a destination, resolvable
parameters and a selector closure. So an unknown job is bounded before it is understood."* The insolvency job
creates an `Obligation` → C3, touches money → C3, touches a customer population → C2 floor on outward steps,
all without anyone knowing what kind of job it is. Mistyping cannot lower the class *because the class did not
come from the type*. That closes a failure mode the other four leave open in different ways.

Where it lands, and this is decided rather than left open: §3's unresolvable rule — *"C0/C1 parks, C2/C3
escalates on a timer to the standing holder, C4/C5 refuses and routes a decision packet."* The insolvency job
is C3, so it escalates on a timer to H2 or H5 rather than sitting.

**And then M4 hits the same wall, and names it:** *"Capability creation without a human still needs an
approver … M4 achieves zero edits for admission, class derivation, ownership and acceptance-owner assignment,
and does not claim them for capability creation."* Unlike M3, M4 has no `unclassified-work/v1` equivalent — no
pre-declared procedure that can carry an unknown job through to an outcome. The escalation timer delivers the
job to a holder; what the holder may then **do** is not specified.

**Judgment W1 — insufficient.** The class-before-kind mechanism is a genuine advance on admission, typing and
ownership. The staffing half is conceded and, unlike M3, has no pre-declared landing procedure behind it.

### C3 · The three named answers

| Question | M4's answer | Reachable? | Capacity? | Existed before? |
|---|---|---|---|---|
| Refund (CAP-17) | C3, so **a person accepts the remedy decision and C04 releases** against the verified payee source, the entitlement record and a `ConflictClaim` keyed on the original charge — *"so two independently named 'courtesy' and 'refund' operations on one entitlement share the liability constraint"*. **H2 owns the duty after the support case closes** | yes | reservation | yes |
| Non-customer grievance six months after closure (CAP-42) | **H3**, which exists for exactly this: independent of the disputed production decision, intake address outliving the case, deadline clock, escalation contract, named alternate. And: **`CAP-39` closure cannot complete until H3's duties are transferred to an accepted custodian with acknowledgment; closure with an unowned grievance route is refused** | yes | reservation | yes |
| Shed a lane at 4× (CAP-45) | **the holder of that lane's reservation.** Discretionary and ordinary lanes are the scheduler's; due service, grievance, recovery and maintenance lanes are H2, H3, H7 and H6, and **shedding one needs that holder's consent or is refused** | yes | yes | yes |

**The refund answer's double-payment guard is the most precise in the round.** `03`'s fixed rule is that
*"refund conflict identity uses entitlement and prior unknown effects, so sales retention and support cannot
pay it twice"*; M4 is the only candidate that names the mechanism — a `ConflictClaim` keyed on the original
charge — rather than the rule.

**The closure interlock is the strongest single sentence on standing accountability in the round:** a venture
cannot finish closing while its grievance route is unowned. That is `03`'s `closed_with_residuals` requirement
turned into a blocking precondition on a different capability, and it is the mechanism M1's *"named in the
closure record"* gestures at without enforcing.

**The shed answer takes the opposite side from M3 and is the stronger of the two on accountability**: a
protected lane cannot be shed without its holder's consent. The cost, which M4 does not state as clearly as M3
states its converse, is that a holder can refuse a shed that the company needs.

### C4 · Founder attention and competence (W12) — **M4 is the heaviest load in the round, and it is computable
from M4's own table**

**Computed at `c6d62a3` across all 46 rows of §8:**

| Quantity | Count |
|---|---|
| Capabilities whose **Accepts** column names a **person (P)** | **37 of 46** |
| Capabilities whose declared **floor** is C3 or higher | **26 of 46** (19 C3 · 3 C4 · 4 C5) |
| Capabilities held by **H9, which M4 defines as "the founder"** | **9** — CAP-01, 02, 06, 27, 33, 38, 43, 45, 46 |
| Capabilities accepted by an **oracle** | 8 |
| Capabilities where an **E-checker** may accept | 3 |

Set those beside two of M4's own rules. §8's preamble: *"A capability's actions are not all one class — **the
floor is a minimum**."* §4.1's C3 row: *"Must ACCEPT: **P**, or **Q** where the act's standing requires it."*
Together these say that **every action in the 26 capabilities with a C3+ floor requires a person's
acceptance** — not a sample of them, all of them. CAP-15 sales, CAP-17 support, CAP-12 launch, CAP-30
fulfillment, CAP-24 procurement and CAP-45 capacity are all in that set.

**M4 states the consequence as a hypothetical that its own table makes certain.** §10, "when this is the wrong
design": *"When one person accepts everything anyway, so the rule adds bookkeeping to a decision already being
made."* That is not a contingency in M4; it is what §8 specifies. §9.2 gets closer — *"On founder legibility
it is worse: nine holders, five structures and a derived class is more than one record a person reads end to
end"* — but legibility and load are different costs and only the first is named.

**The designed return is well-formed and its selection rule is the problem.** §6.3: *"every C5, always; every
C4 acceptance; every C3 acceptance where the standing is not a professional's; **a deliberate sample** of C2
selected before outcome is known, including customer material he could have been spared."* Sampling is applied
only at C2. At C3 and above there is no sample, and 26 of 46 capabilities floor at C3+. The anti-flattery
property — *selected before outcome is known* — is present and correct, and it governs the one tier where
volume was never the problem.

**The competence instrument fires only after an absence.** §7.6's re-entry brief carries *"the delayed
unfamiliar-transfer material on which recognition is actually measured"*. Nothing in ordinary operation does.
`04` fixes a cycle running **one per five declared operating days** regardless of absence, and DIRECTIVE §1.6
requires the return to be designed rather than triggered by an event.

**Judgment W12 — insufficient**, on AC-M4-01 and AC-M4-02.

### C5 · Capability binding (W15)

Computed: **46 rows, 46 distinct ids, no gaps, no duplicates**, and the richest column set in the round —
declared classes, floor, admissible structures, acceptor, holder. Every structure token (`W`/`E`/`H`/`P`/`Q`)
and every holder id (H1–H9) is defined in the candidate. **No binding names a mechanism M4 never defines.**

One observation that is not a finding: several C0/C1 rows name a person as acceptor (CAP-01, 06, 27, 43)
where §4.1's mapping sets the acceptance floor at a deterministic predicate. That is over-satisfaction rather
than contradiction, since §4.1 is monotone and a floor is a minimum — but it means the class rule is **not**
what selects the acceptor on those rows, which weakens §9.1's "structure follows the action" claim by exactly
those four rows and adds to the count in AC-M4-01.

**Judgment W15 — sufficient.**

### C6 · Responsibility probe

*Non-customer contests a harmful decision; the usual custodian is implicated; the founder is absent.*

**M4 answers this better than any other candidate, and the answer is structural rather than procedural.** H3
exists *"independent of the disputed production decision"* and is a **different holder** from H2, which owns
remedy — §9.1 names that separation as one of its discriminating observations. §2.3's H row carries the
prohibition that makes it work: a holder *"may never … **Decide the matter it is the subject of**."* So where
H2's own decision is contested, H3 holds it, and H3 is not H2.

§8's CAP-42 acceptor is *"**P**, independent of the disputed decision"*, and H3 carries a named alternate and
an escalation contract. With the founder absent, §7.6 parks a C3 acceptance reserved to him — which leaves the
grievance disposition waiting, the same gap M1 and M2 have, but here the clock and the escalation contract are
at least named on the holder record.

### Findings

**AC-M4-01 · class (d) · a person is the acceptor on 37 of 46 capabilities and on every action in 26 of them,
and M4 does not say who that person is or what happens when there is only one.**
*Passage.* §8's acceptor column, computed above; §8's preamble *"the floor is a minimum"*; §4.1's C3 row
*"Must ACCEPT: P"*; §8's holder list, *"**H9** the founder"*.
*Counterexample.* DIRECTIVE §8.18 requires the design to *"define how the system avoids turning the founder
into a full-time reviewer"*, and W12 fails a candidate where he becomes one. In a company whose only admitted
person is the founder, §8 requires his acceptance on every sale (CAP-15, floor C3), every support remedy
(CAP-17, C3), every launch (CAP-12, C3), every fulfillment (CAP-30, C3), every purchase (CAP-24, C3) and every
capacity decision (CAP-45, C3). M3 reaches a similar load and answers it by **stopping admission in the class**
when no person is available; M4 has no equivalent rule and parks individual items instead.
*Missing decision.* Which of the nine holders are staffed by a person other than the founder before the
company admits work at a C3 floor in that class, and what the company does in each class where none is.
*Required contract.* A staffing precondition per holder with a stated behaviour when unfilled — the candidate
already has the vocabulary, since §2.5 requires an `alternate_holder_ref` on every holder — plus either a
sampling rule at C3 equivalent to the one §6.3 applies at C2, or an explicit statement that C3 acceptance is
unsampleable and the resulting per-week count.
*Why §11 does not catch it.* §11 walks §5's ten examples, none of which is about acceptance volume, and its
three open (d)s are about credentials, composition and novel-work arrival rate.

**AC-M4-02 · class (d) · H9 is the founder, every holder must carry an alternate, and H9's alternate is
unnamed and in a one-person company unfillable.**
*Passage.* §2.5's record: `alternate_holder_ref` is a payload field of every `StandingHolder`. §8: *"Each
satisfies the §2.5 conjunction; each has an intake address, a reservation, **an alternate** and a review
date."* §8's holder list: *"**H9** the founder."*
*Counterexample.* H9 holds CAP-01, 02, 06, 27, 33, 38, 43, 45 and 46 — intent, portfolio direction, strategy,
human collaboration, governance, pivot, owner competence, capacity and system improvement. §7.6 says *"a C3
acceptance reserved to the founder parks"*, which is the behaviour of a holder **with no alternate**, stated
in one place and contradicted by the blanket assertion in another. `04`'s fixed absence mechanism is explicit
that *"joint owner/provider loss must not depend on the absent owner to appoint or pay the substitute"*.
*Missing decision.* Who H9's alternate is, or the explicit statement that H9 alone has none and that its nine
capabilities therefore park for the duration of any absence.
*Required contract.* Either name the alternate as a role with its own admission and funding, or mark H9 as a
declared exception to the conjunction with the parking behaviour stated as the consequence, and revise §8's
"each has … an alternate" to say so.

**AC-M4-03 · class (d) · CAP-43's holder, subject and acceptor are the same party, which M4's own §2.3
forbids.**
*Passage.* §2.3, the H row: a standing holder *"May never … **Decide the matter it is the subject of**."* §8
row 43: *"| 43 | Owner attention and competence | … | C1 | W · P | **P** | **H9** |"*, with H9 defined as the
founder.
*Counterexample.* CAP-43's required outcome in `coverage/capability-requirements.json` is *"contestable
authentic participation and adverse evidence to preserve domain understanding and intervention ability"* — the
acceptance judgment is about the founder's own competence. `04` fixes the opposite arrangement: *"On material
domain misunderstanding, **a competent assessor** states the exact factual proposition/intervention, evidence
and limits. **The owner can contest it** or request a second assessment."* The assessor is not the owner and
the owner's role is to contest. M4 makes the owner the acceptor of the assessment of himself. CAP-33 avoids
this by carrying *"P, independent authorization"*; CAP-43 carries a bare `P`.
*Missing decision.* Who accepts CAP-43's outcome.
*Required contract.* Name a competent assessor outside H9 for CAP-43 with the owner's contestation right, as
`04` specifies, and apply §2.3's prohibition to H9 the way §9.1 already applies the analogous separation to
H2 and H3.

**AC-M4-04 · class (b) · the competence instrument is triggered by absence rather than scheduled.**
*Passage.* §7.6's re-entry brief carries the delayed unfamiliar-transfer material; §6.3's ordinary-operation
return does not.
*Required contract.* Schedule it on `04`'s fixed cycle. Covered by AC-ALL-01; recorded here because M4 is the
only candidate whose sole use of the instrument is conditional on an event.

**AC-M4-05 · class (a), recorded as a strength.** The closure interlock — *"CAP-39 cannot complete until H3's
duties are transferred to an accepted custodian with acknowledgment; closure with an unowned grievance route
is refused"* — is the strongest standing-accountability mechanism in the round, and it is a precondition on a
different capability rather than a promise inside the same one.

### My (d) list against M4's §11

§11 classes nine of §5's ten **(a)**, item 5 **(b)** with *"who owns a skill's expiry date is still
unassigned"*, and item 7 (a) with a (b) residual. It then names three open (d)s: **whether this system has a
credential at the boundary at all** (M4 names mediation as the fallback, which makes it (b) for M4 and leaves
the question with the runtime adapter owner); **composition across unjoined records**, which §10 calls its
sharpest weakness and states rather than mitigates; and **the arrival rate of genuinely novel work**, which
M4 argues it is deliberately insensitive to because the class is computed before the kind. All three are
correctly identified and I add nothing to them.

**My three (d)s are all in the human and company half, and §11's frame reaches none of them.** §5's ten
examples contain nothing about acceptance volume, nothing about an unfillable alternate, and nothing about a
holder deciding its own subject. AC-M4-03 is the sharpest because it is an **internal contradiction** between
§2.3 and §8 rather than an omission, and the candidate's own §9.1 uses exactly that separation argument to
justify splitting H2 from H3.

### Dimension judgments — M4

| Dimension | Judgment |
|---|---|
| **W1** | **insufficient** — class-before-kind is the round's best admission idea; the staffing half is conceded and has no pre-declared landing procedure |
| **W11** | **sufficient** — cleanest company rendering; offers its own falsifying test; the most specific negative-control-8 answer |
| **W12** | **insufficient** — AC-M4-01, AC-M4-02, AC-M4-03. Heaviest computed founder load in the round |
| **W15** | **sufficient** — 46/46, richest column set, every token defined |

---

## 6. M5 — Subscription-activated capabilities around a shared record

### C1 · The plain-language test (W11)

Renamed: **the Record** is *our files, where every number has exactly one owner allowed to change it*; a
**standing interest** is *a standing instruction saying in advance the exact conditions that make this job
relevant*; **arming** is *the job raising its hand*; the **Admission Authority** is *the dispatcher who
decides which two raised hands get served now and what gets dropped when we are overloaded*; the **unmatched
pool** is *the tray of things that are due, belong to somebody, and match no job we have, with an alarm on
it*; the **effect allocator** is *the one thing that stops us paying the same refund twice*.

Two sentences: *"It is a company where every standing job states in advance the exact conditions that make it
relevant, so when the files change the jobs that now matter raise their hands by themselves and nobody can
stop them. A dispatcher decides which get worked on now and what gets dropped under pressure, and anything
due that matches no job lands in a tray with an alarm and an owner."*

**That reads as a company, and the phrase a reader keeps is "nobody can stop a job raising its hand" — which
is a governance property, not a technology one.** It is not a roster of digital employees: an interest is a
declaration, not a worker, and §5.4 refuses two credits it could have taken (the attention sense of isolated
context, and parallel work as a reason any interest exists) precisely because negative control §4.4 exists to
catch them. Declining available credit is the behaviour the control is looking for.

**Its negative-control-8 answer is structurally the right shape and its evidence does not hold — see
AC-M5-01.** The shape: *"One interest serves many capabilities and one capability is served by many … the
boundary follows a record transition, an effect class and a grant, not a department name."* A genuine
many-to-many mapping is incompatible with a department roster, and that is the correct argument. The single
worked example offered for it is contradicted by M5's own table.

**Judgment W11 — sufficient.**

### C2 · The unfamiliar job (W1)

The insolvent supplier, eleven days to the claim window.

| Step | M5's answer |
|---|---|
| Enters | the adapter's capture identity writes a `Fact`, trust class `attested-external`, writer key `(supplier_id, document_id)`; *"authenticated capture proves origin within its boundary, not truth"* |
| Types | deterministic predicate match, **and M5 closes a would-be (d) here**: *"The typing interest has **no confidence threshold**. Typing is deterministic predicate match; anything else is `no_match` and goes to the pool. A model may propose a type and may never assign one above `read_only`."* The cost is named: more items reach the pool and the pool becomes the bottleneck |
| Owns | `unowned-duty` arms, **can never be retired**, runs `03`'s ordered resolver deterministically, recording `custody_basis`, `custody_tie_break_reason` and `contesting_mandate_refs`. *"Custody exists in the same transaction as the duty, and a disputed assignment does not suspend it"* |
| Lands | the **unmatched pool**, whose precondition is *the computable complement* — "accepted, owned, due, armed nothing at or above its required class" — read-only, unretirable, alarmed on arrival, retention longer than the longest plausible outage |
| Staffed | an `InterestProposal` with six tests including the paired clean case. **Graduated:** `read_only` and `internal_artifact` proposals are admitted under a standing mandate as an expiring bounded trial with mandatory review; `outward_draft` and `outward_release` require human approval |

**Two things M5 does here that nobody else does.** The pool is defined as *the computable complement* rather
than as a catch-all branch, and M5 names its residue as the source requires: *"**The pool cannot catch an
entry that armed the wrong interest.** Mistyping is invisible to it, and only out-of-scope recall measurement
finds that class."* And the graduated staffing rule means a read-only capability **can** be created without
human approval, which narrows the concession every other candidate makes to its outward half.

**But the insolvency job's effect class is `outward_release`** — filing a claim, stopping delivery, paying
refunds — so it falls on the human-approval side, with a decision packet whose latest responsible decision
time is `T+30d` minus the procedure's duration. The claim window closes in eleven days and the founder is the
approver.

**Judgment W1 — insufficient**, on the outward half, with the most tightly bounded concession in the round.
The graduated rule is the right partial answer and should survive into any synthesis.

### C3 · The three named answers

| Question | M5's answer | Reachable? | Capacity? | Existed before? |
|---|---|---|---|---|
| Refund (CAP-17) | `remedy-release` arms on an accepted remedy obligation **whose amount comes from an authoritative selector — entitlement and terms, never a document a model read**. Within a standing remedy mandate and a bounded amount it releases without founder approval; above the bound, a decision packet. **Acceptance owner: the customer-outcome sponsor**; the acceptance predicate is **observed destination state at the payment processor** plus counterparty acknowledgment where the promise requires it, *"never the producer's report"* | yes | bounded mandate | yes |
| Non-customer grievance six months after closure (CAP-42 with CAP-39) | `grievance` is **∞ — it can never be retired** — and *"its precondition does not reference an active venture, so a wound-down venture still arms it"*. **Closure cannot be recorded as complete while a surviving duty has no accepted custodian**; the state is `retired-with-residuals`. Complaints **against the custodian** retain standing through closure | yes, no product account needed | see AC-M5-02 | yes |
| Shed a lane at 4× (CAP-45) | the **Admission Authority**, by class, in the fixed order discretionary (5%) → maintenance and evaluation (10%) → ordinary creation and research (20%); **never** the 50% due-service floor or the 15% continuity/security/grievance reserve. *"A grievance does not compete on a commercial score."* Shed work stays owned; each shed writes the lane, reason, overflow count, retained owner and latest responsible time. **Authority to change the shares is the founder's, not the Authority's** | yes | yes | yes |

**The refund answer is the only one whose acceptance predicate is an external observation.** "Observed
destination state at the payment processor" is what `03`'s `Fulfillment.delivered` row demands — *"an
independently observed result correlated to the delivery adapter's own native object"* — and it is the
difference between a refund that was accepted and one that was merely recorded.

**The grievance answer is the only one that survives by construction rather than by an arrangement.** The
interest is marked ∞ and its precondition does not name a venture, so closure cannot orphan it; where M1
relies on the closure record naming a custodian and M4 blocks closure until one is accepted, M5 makes the
route independent of whether closure went well. Those are three different mechanisms for one requirement and
M4's and M5's compose.

### C4 · Founder attention and competence (W12) — **the strongest in the round**

**Computed at `c6d62a3` across §8's 46 rows: the founder is the named acceptance owner on 15**, against 19+13
for M3 and 37 for M4. More importantly, **which 15**: intent, portfolio, strategy, taste, brand, pricing,
supplier signing, hiring, collaboration, governance, capacity shares, pause, pivot, succession and his own
competence. Every one is a DIRECTIVE §3 decision — personal intent, values, taste, risk tolerance, an
irreversible external commitment. **The volume capabilities are delegated:** sales to the relationship owner,
support to a bounded remedy mandate, customer communication to the relationship owner, content to the outcome
sponsor, analytics to a metric owner, the truthful account to an independent investigator.

**The designed return reproduces the fixed mechanism's content without citing it, and is the only one in the
round that does.** §6.3: *"`founder-return` (a fixed rotation of **original customer evidence**, **taste
choices**, **unfamiliar financial interpretation** and **recovery practice**, inside **his chosen attention
budget**)."* Set that beside `04-human-operation.md`'s fixed cycle — four short encounters: original customer
material; an independent taste decision before advice; an unusual financial or obligation explanation; and an
intervention or recovery rehearsal — inside the `ParticipationPlan`'s maximum decision-batch minutes. Four for
four, plus the budget. M5 reached it through `R1 TC-29` rather than through `04`, which is AC-ALL-01, but the
content agrees.

**`refusal-sample` is an addition beyond the fixed mechanism and it is a good one.** *"A sample of what the
system declined, because a refusal nobody reviews is a decision nobody made."* No other candidate returns
refusals to the founder, and refusal is where a company's boundaries are actually set.

**The re-entry brief carries one item nobody else thought of:** *"the checker's clean-case refusal rate — so
he can see whether **his instruments got tighter while he was away**."* That is instrument drift surfaced to
the human who must judge whether to trust the instrument, which is precisely what AM-01 exists for.

**Judgment W12 — sufficient.** The load is the lightest and correctly targeted, the mechanism matches the
fixed one, and the two additions are sound.

### C5 · Capability binding (W15)

Computed: **46 rows, 46 distinct ids, no gaps, no duplicates**, each with a mode and an acceptance owner. Two
defects in the binding, one of which breaks the candidate's own negative-control evidence.

### C6 · Responsibility probe

*Non-customer contests a harmful decision; the usual custodian is implicated; the founder absent.*

M5 states the requirement directly — *"non-customers **and complaints against the custodian** retain standing
through closure [02 §7]"* — which is the only explicit statement of the implicated-custodian case in the
round. What it does not supply is the mechanism: no field records that the custodian is disputed, and no rule
names the independent recipient. With the founder absent, §7 F-6's terminal state `awaiting-principal` keeps
the obligation live, the alarm lit and the count visible under *"the terminal standing custodian"* — who, by
M5's own §11, **is not named**.

### Findings

**AC-M5-01 · class (b) · the §8 table excludes the standing interests by its own column rule, applies the
rule inconsistently in 11 rows, and the one worked example supporting M5's negative-control-8 answer is
contradicted by the table it points at.**
*Passage.* §8's column header: *"Interest(s) **beyond the standing set**"*. §8's prose: *"`deadline` alone
carries CAP-19, CAP-20, CAP-21, CAP-24 and CAP-39. **That is the test the control asks for.**"*
*Computed counterexample.* Grepping the table's key column at `c6d62a3`: `deadline` appears on **CAP-19 and
nowhere else**. CAP-20 carries `variance`/`reconciliation`, CAP-21 `determination-required`, CAP-24
`supplier-commitment`, CAP-39 `closure`/`residual-custody`. Separately, **11 of 46 rows do name standing-set
interests** in the column defined to exclude them — CAP-10, 11, 19, 32, 35, 37, 39, 42, 43, 45, 46 — so the
rule is not applied consistently either. The consequence for W15 is that **22 standing interests have their
capability coverage stated nowhere**, even though §2.2 makes `capability_refs` a mandatory field of every
interest.
*Required contract.* Publish the `capability_refs` of the 22 standing interests, or add a second column for
them. The many-to-many claim is M5's whole answer to negative control 8 and it is currently an assertion.
This is **(b)** rather than (d) because the mechanism is specified and the field exists; what is missing is
the data.

**AC-M5-02 · class (d) · twelve acceptance-owner roles are named with no record that makes any of them exist,
and §11 declares only the terminal one open.**
*Passage.* §8's acceptance-owner column names, beyond the founder and qualified professionals: outcome
sponsor (7), relationship owner (3), knowledge custodian (2), finance custodian, privacy custodian, security
custodian, incident custodian, metric owner, evaluation owner, recovery administrator, independent
investigator, capability owner. §11 open (d) 1 names **only** *"the terminal standing custodian"* as unnamed
and routes it as a founder decision packet.
*Counterexample.* CAP-22 is the capability protocol §1 names by hand — *who owns a privacy request from a
non-customer*. M5's answer is "Privacy custodian". Apply R8 A-5's three-part test: is that party reachable,
does it have capacity, and did it exist before the event? M5 answers none of the three, and a rights request
carries a statutory clock. The comparison is exact and unflattering: **M4 requires every holder to carry an
intake address, a reservation, an alternate and a review date; M2 makes `reachability` a mandatory charter
field with an interim holder on suspension; M5 names the role and stops.** Outcome sponsor is the one role
that is backed, by `03`'s rule that *"outcome sponsorship is assigned before an offer becomes available"* —
and M5 cites `03`, so the pattern was available.
*Missing decision.* Whether each named custodian role is a record with an existence condition, and what the
company does in a class whose custodian is unfilled. M5 has the right answer for one case already — *"the
company may not admit work of a class with no such custodian"* — and applies it only to the terminal
custodian.
*Required contract.* Generalise §11's own rule: every acceptance-owner role named in §8 is a record with a
reachability route, a capacity reservation and an alternate, and admission in that class stops while it is
unfilled.

**AC-M5-03 · class (b) · the grievance route states the implicated-custodian case and supplies no mechanism
for it.**
*Passage.* §8 CAP-42: *"complaints against the custodian retain standing through closure."*
*Counterexample.* `03`'s fixed guard `edge.GrievanceCase.received.triaged.v1` reads
`/payload/disputed_custodian` and, where true, requires
`neq(independent_escalation_assignment_ref, custodian_assignment_ref)`, with an absent value denying rather
than reading as "not disputed". M5 cites `03` three times and does not carry this across. Since M5's
`grievance` interest is a **single ∞ interest**, the implicated-custodian case has no second route by
construction.
*Required contract.* A `disputed_custodian` precondition field and a second `grievance-independent` interest
whose precondition is that field, with the absent-denies semantics.

**AC-M5-04 · class (a), recorded as a strength.** §11's first open (d) — *"The terminal standing custodian is
unnamed … an implementer choosing between 'refuse the class' and 'default to the founder' is choosing the
system's meaning"* — is **the same gap I found silently present in M1 as AC-M1-02**. M5 names it, states both
horns, and routes it as a founder decision packet. That is what the difference between a declared and an
undeclared (d) looks like, and it should count in M5's favour rather than against it.

### My (d) list against M5's §11

§11 classes all ten of §5's examples **(a)** and declares two open (d)s — the unnamed terminal standing
custodian, and whether a read-only bounded trial may renew automatically (*"If yes, the trial envelope is
decorative. If no, every trial expires into a human approval and the zero-edit region shrinks as the catalogue
grows"*). Both are correctly identified and both horns are stated. It also names a third item that blocks the
**evaluation** rather than the specification: whether the concurrency pin is a provider constraint or a
self-imposed policy, *"the highest-leverage open question in the round … and settling it is an account
inspection, not an experiment."* That distinction — blocking the evaluation rather than the design — is one
no other self-audit draws and it is correct.

**My one (d), AC-M5-02, is the generalisation of §11's own first item** from the terminal custodian to all
twelve named roles. §11 saw the shape and scoped it to one instance.

### Dimension judgments — M5

| Dimension | Judgment |
|---|---|
| **W1** | **insufficient** on the outward half; the graduated read-only trial is the tightest concession in the round and the unmatched pool as *computable complement* is the best queue-closure construction |
| **W11** | **sufficient** — declines two available credits under negative control §4.4; many-to-many shape is right, its evidence is not (AC-M5-01) |
| **W12** | **sufficient** — lightest and best-targeted load (15 of 46, all DIRECTIVE §3 decisions); return matches `04`'s four encounters; `refusal-sample` and the instrument-drift line are net additions |
| **W15** | **sufficient** — 46/46 with mode and owner per row; AC-M5-01 leaves 22 interests unbound and AC-M5-02 leaves twelve owners without existence |

---

## 7. C7 — cross-candidate

No aggregate score, no ranking, no recommendation. This section says which company duties are handled the
same way by all five (so the selection cannot turn on them), and which candidate handles standing
accountability best and worst, with the passage.

### 7.1 Handled identically by all five — the selection cannot turn on these

Each of the following is specified by every candidate in substantially the same terms, usually citing the
same lane finding. **A reviewer comparing candidates on any of them is comparing nothing.**

| Duty | The shared answer |
|---|---|
| **Refusal of a spurious job** | A terminal state of the **same record**, with a named failed predicate or reason and an owner; refusal is never deletion. All five cite R5-14 and all five note a communicated refusal is itself an outward effect |
| **Admission bias** | Low threshold for *reporting*, paired with an explicit prohibition on self-dispatch. All five cite R5-04/R5-05 |
| **Typing** | Three outcomes — match, honest `no_match`, budget exhausted — with *"typed into the nearest existing kind"* named as a failure that must never score as success. All five cite R5-15 |
| **What a resumed attempt may trust** | The portable `Continuation` and the loader's manifest; never a provider-resumed opaque session; a pre-gap **model verdict** is stale in the same class as a pre-gap fact. All five cite R1 F-02 and R7 F7 |
| **An already-released effect** | Detected by the **idempotency record on the effect**, never by state in the shared record; an expired lease does not prove no external effect |
| **Permission composition** | Minted narrowly per attempt or refused; never borrowed; intersection computed **at release** rather than at assignment. All five cite R4 §8.1 |
| **Revocation** | A live epoch re-read inside the ordered release transaction; attenuation buys narrowing and not revocation |
| **Typed constraints on every boundary** | Prose refused; all five cite the 0.97-against-0.57 survival split and the 0-of-48 typed allowlist (R2 F-04) |
| **The paired clean case** | AM-01 applied as published; both rates reported or neither; all five cite the 68.4–96.8% false-positive band |
| **What independence can mean in one family** | Influence yes, error no; all five state the residual and none launders it |
| **The founder's value** | Not accuracy — he is a **differently-correlated instrument**, and his absence removes the only cross-family error source. All five say this in nearly the same words (R7 §8 F-6) |
| **The re-entry brief** | Carries **what was omitted and what was contested**, not only what was decided, because a trusted shared view suppresses the dissenting fact (R1 F-17). All five |
| **Token counts refused as a capacity model** | All five; all five state that no absolute weekly denominator is published, so every figure is a ratio between arms |
| **Reserved-but-unconsumed allowance** | Destroyed rather than banked, so a conservative reserve is waste rather than thrift. Four of five state it; M1 states it as an inversion of the usual reading |
| **B0's two falsified strengths** | FAL-01 (B0 does not minimise the weekly bucket) and FAL-02 (the long session is not purchasable at a 360-second cap). All five report them as findings against a premise and **none amends the frozen protocol** |

**One negative shared by all five and it is the most consequential item in this section.** Every candidate
concedes that **creating a capability for a genuinely novel kind of work requires a human approver**, and
every one cites the same lane verdict (R5-06, R5-08, TC-19). The differences are in what each can do *while*
that approval is pending, and only there:

- **M3** carries the job to an outcome with no system edit at all, through `unclassified-work/v1` and a
  custodian authorising effect steps one at a time. Subject to AC-M3-01, which asks what grant backs them.
- **M5** splits the concession by effect class: read-only and internal-artifact capabilities are created on an
  expiring bounded trial under a standing mandate; only outward ones need a person.
- **M4** bounds the job before it is understood — *class before kind* — so staffing, permissions and the
  acceptance owner follow from the class while typing stays open.
- **M1** and **M2** concede the whole of staffing. M2 goes further and says charters make F-1 *harder*.

**That is the one place where the five genuinely differ on W1, and all three of the partial answers are
compatible with each other.**

### 7.2 Standing accountability — best and worst, with the passage

The question is R8 A-5's: when a non-customer complains six months after a venture closed, is there a party
that **already existed**, can be **reached**, and has the **capacity** to remedy?

**Best: M4, and the mechanism is an interlock on a different capability rather than a promise inside the
same one.**

> *"If the venture is closed, **CAP-39 cannot complete** until H3's duties are transferred to an accepted
> custodian with acknowledgment; **closure with an unowned grievance route is refused.**"* — M4 §8

Why this is strongest: it makes the guarantee a **precondition on the act that would destroy it**. M1 names
the custodian in the closure record, M2 requires `reachability` to be re-pointed or formally withdrawn at
retirement, M5 makes the grievance interest unretirable — all three are good, and all three are properties of
the grievance machinery. M4's is a property of **closure**, which is the thing that goes wrong. It is also
backed by a second mechanism: H3 is a *different holder* from H2, so the party that remedies is not the party
that decided, and §2.3's prohibition — *"[a holder] may never … Decide the matter it is the subject of"* —
makes that structural. **M5's unretirable `grievance` interest and M4's closure interlock compose, and a
synthesis should take both.**

**Worst: M1, and the reason is a single undefined word at the end of the resolver.**

> *"promise sponsor → service mandate → designated maintenance/discovery custodian → **the founder's standing
> delegate**"* — M1 §3.2.4
>
> *"when no mandate covers the harm at all, custody terminates at a standing human role with actual authority
> to act, not at a queue."* — M1 §3.3

`standing delegate` appears **once** in M1 and **nowhere** in `planning/specification/` or `coverage/`
(computed). It has no existence condition, no capacity, no consequence ceiling and no alternate. M1 is
otherwise excellent on this dimension — its CAP-42 answer quotes the objection against itself and answers it
with *"standing accountability, ephemeral execution"*, which is the right formulation — but the terminal
element of its ownership resolver is a party that does not exist in any document in the corpus. In a
one-person company the honest reading is that it is the founder, which makes him the router of last resort
for every unowned unknown and reduces *"not at a queue"* to a rename.

**The instructive contrast is M5, which has the identical gap and declares it.** M5 §11: *"The terminal
standing custodian is unnamed … an implementer choosing between 'refuse the class' and 'default to the
founder' is choosing the system's meaning. **Routed as a founder decision packet.**"* Same hole; one
candidate walked past it and one stopped at it and told the founder. That difference is worth more to the
selection than most of the design differences.

### 7.3 Founder load — computed, since no candidate computes it

All five specify a designed return. None states how much acceptance work the founder actually carries, and
all five state it is computable from their own capability tables. Computed at `c6d62a3`:

| Candidate | Capabilities whose acceptance owner names the founder | Note |
|---|---|---|
| M2 | **0** | Acceptance owners are the C01–C09 components; the founder's load is five charter sheets, one monthly duty, and the instrument readings, all declared as a debit in §10 |
| M1 | 9 of 46 | CAP-01, 02, 06, 08, 09, 13, 33, 38, 43 |
| M5 | 15 of 46 | All fifteen are DIRECTIVE §3 decisions — intent, taste, risk tolerance, irreversible commitments |
| M3 | 19 of 46 explicitly, plus 13 more naming an unspecified human — **32 of 46** | And *"outward = irreversible class"*, so every outward artifact needs a human acceptance |
| M4 | **37 of 46 name a person**, and 26 of 46 floor at C3+, where §4.1 requires a person on **every** action | H9, one of nine holders, is defined as the founder |

**This is the sharpest cross-candidate result in the report and it inverts the usual reading.** The candidate
that most resembles a roster of digital employees on first reading (M2) puts the least on the founder; the
candidate whose rule is the tidiest (M4, one sentence: *what an action can do to somebody decides who carries
it*) puts the most, because the rule routes consequence to people and the company has one person. **W11 and
W12 do pull in opposite directions here**, which is FAL-11's recorded criterion tension — and every candidate
that mentions FAL-11 declines to advance it as a defect against the frozen criteria, as R8 did. So do I. The
tension is real; the criteria stand as written; the resolution is a staffing decision and belongs to the
founder.

**M3 is the only candidate with a stated behaviour when the person does not exist:** *"If no such alternate
exists, M3 stops admitting work in that class rather than letting the record sit assigned and silent — a
refusal with a reason, which is worse for throughput and better for truth."* M5 has the same rule for one
case. M4 and M1 park individual items instead, which is the failure that accumulates silently.

### 7.4 Dissent preserved

**On shedding, M2 and M3 take opposite and individually correct positions, and neither is refuted.** M2: a
class cannot be asked to yield, a desk can, and a holder returns a minimum *declared in advance, not invented
under pressure*. M3: *"at 4× there is no time to negotiate and a pre-endorsed, auditable order is faster and
reviewable"*, conceding that *"a pre-endorsed order cannot notice that this particular shed is
catastrophic."* M4 sides with M2 and adds consent; M5 sides with M3 and adds an overflow count. **The
discriminator neither side has is whether a shed at 4× has time for a negotiation round**, and nobody has
measured it. It should be retained as a design input rather than resolved.

**On persistence, M2 and M4 reach the same requirement by opposite routes and both are honest.** M2 counts
the charter delta as **three** properties where R8 A-1 counts two, and says why — *"a party an outsider can
reach by name is not a consequence of memory or of reservation, and CAP-42 is carried by that row alone."*
M4 counts it as **one**, takes the reserved capacity and explicitly refuses the carried memory: *"no source
measures persistent model identity improving accepted outcomes."* Both are defensible on the same evidence
and the disagreement is about which property CAP-42 needs. **M2 is right that reachability is separable;
M4 is right that carried memory is unsupported.** Those are compatible, and the composition — a reachable
named party with no carried memory — is what M4's `StandingHolder` already is.

### 7.5 What I checked and cleared, recorded so it is not re-raised

- **All five "all 46" claims are true.** 46 distinct ids in every candidate, no omissions, no duplicates.
  M1 does it in 18 grouped rows, which is a granularity finding (AC-M1-04) and not a coverage one.
- **M2's §8 preamble counts (26 / 5 / 15) verify**, once `**— (deliberately)**` on CAP-10 is read as what it
  says. A naive parse returns 25 / 6 / 15.
- **`Mission.retired-with-residuals`, `AccountReconstruction` and `ContradictionSet`** — named by M1 §8 and
  defined nowhere in M1 — all exist in `planning/specification/`. Binding to an existing record without
  restating it is legitimate.
- **`standing delegate`** exists nowhere in `planning/specification/` or `coverage/`. That one is AC-M1-02.

### 7.6 Blocking summary

Findings I class **(d)**, which block per protocol §8, plus one negative-control failure which blocks
independently:

| Finding | Candidate | What it is |
|---|---|---|
| AC-M1-01 | M1 | Capability creation parks during absence while unknown work needs it; the two rules are both M1's |
| AC-M1-02 | M1 | The terminal owner of unowned harm is an undefined party |
| AC-M1-03 | M1 | Acceptance above C2 bound to the founder's availability rather than his participation |
| **AC-M2-01** | M2 | **Negative control §4.4 failed** — `CT-MEANING` is chartered and exercised by no fixture |
| AC-M2-03 | M2 | A grievance about `CT-STANDING`'s own disposition has no independent recipient |
| AC-M3-01 | M3 | The grant backing an effect on unclassified work is undefined; both readings break something |
| AC-M3-02 | M3 | The founder-attention load is the central cost and is counted nowhere |
| AC-M4-01 | M4 | A person accepts on 37 of 46; who that person is, is unstated |
| AC-M4-02 | M4 | H9 is the founder, every holder must have an alternate, and H9's is unfillable |
| AC-M4-03 | M4 | CAP-43's holder, subject and acceptor are one party, which §2.3 forbids |
| AC-M5-02 | M5 | Twelve acceptance-owner roles named with no record making any exist |

Plus every (d) the candidates declare against themselves, which I reviewed and do not dispute: M2's
(d-M2-1) and (d-M2-2); M3's three open items; M4's three; M5's two.

**Standing caveat, restated because protocol §8 requires it in every review.** No runtime exists. Every
judgment above is about **specified behaviour checked offline** by one reviewer of one model family with
procedural independence only. This is not an independent panel. Nothing here establishes runtime
conformance, deployment readiness, actual fulfillment, or the business value of the intended system.
