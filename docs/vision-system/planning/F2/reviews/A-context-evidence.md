> Archival provenance — 2026-09-13: Step 4 attack review, **context integrity and evidence** perspective (W3, W5, W14), on the five F2 candidates at frozen subject `c6d62a3`. Preserved verbatim from the reviewer engine's report file, written incrementally during the review. The reviewer authored nothing in the round, was barred from session files, lane worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, other reviewers' scratch and every prior F2 review, and read each candidate's self-audit and evidence ledger only after its substantive sections; it audited 95 ledger rows against the lane findings they cite. Same model family as every author; independence is procedural only, and the reviewer notes that judging evidence quality with the family that produced it is itself the W5 problem. Archival is not acceptance.

# Attack review — context integrity and evidence (W3, W5, W14)

## Provenance header

- **Subject, frozen:** commit `c6d62a3` of `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685`,
  read at the root, read-only. Five candidates at `docs/vision-system/planning/F2/candidates/M{1..5}-*.md`.
- **Reviewer:** authored nothing in this round — no candidate, no research lane, no synthesis.
- **Protocol version applied:** `00-acceptance-protocol.md` frozen 2026-09-13 at `26af5d5`, plus
  `00-acceptance-protocol-amendments.md` AM-01 (F-4 gains a paired clean case). Dimensions judged:
  **W3** (context integrity under summarization and handoff), **W5** (independence of verification under
  one model family), **W14** (evidence quality of this round's own claims). Negative controls 3, 5, 6, 9.
- **Independence, disclosed and not laundered.** I share one model family with every author of every
  candidate and every research lane I cite. Independence here is **procedural only**: separate context,
  authored nothing under review, and three standing bars observed — I did not read
  `docs/08-agents_work/`, `.worktrees/`, `docs/vision-system/state.json`, `history.jsonl`,
  `PLANNING-REPORT.md`, anything under `planning/F2/reviews/`, or any other reviewer's scratch directory.
  I read each candidate's §2–§10 before its §12 evidence ledger.
- **The reflexive problem, stated rather than disclaimed.** W14 asks me to judge the evidence quality of
  claims produced by my own model family, using the same family. R7 F13 names the defect class this
  cannot reach: self-consistent errors are a property of the family, not of the draw, and "all four types
  of detection methods significantly struggle to detect" them. R7 F1 adds familiarity-driven
  self-preference that blinding does not remove. **So a clean W14 verdict from me is weaker evidence than
  a dirty one.** Where I find a stretched citation, that finding is load-bearing; where I find none, the
  absence is not assurance. This is FAL-08 and TC-37 applied to the review rather than to the design.
- **What I computed rather than trusted.** Every ledger row I sampled was resolved by opening the cited
  lane finding in `research/F2/R*.md` and comparing the two texts. Counts below are of rows I opened.
- **Standing caveat.** No runtime exists. Every judgment here is about **specified behavior checked
  offline**. Nothing establishes runtime conformance.
- **Return channel truncation:** my return to the requesting agent is capped at 3,000 characters. This
  file is the archive; the return is a pointer.

---

## M1 — capability-differentiated ephemeral agents

### W3 · context integrity under summarization and handoff — **sufficient**

**X1, the context manifest.** M1 §4.2 item 3 specifies a `ContextManifest` carrying "source/capture/artifact
versions, permission and validity epochs, transformations, selection reasons, byte allocations, actual source
spans, **omissions**, and complete known native ancestry — with each item's **trust level** named". It then
does the thing negative control 5 is hunting for and goes past it: "The manifest's most important field is the
one DIRECTIVE §8.12 does not obviously name. 'What was omitted' must be read as **which typed constraints were
dropped**, because that is the class that dies in transfer", and makes `ConstraintSet` membership a separately
reported section. **Negative control 5 passes**, and so does negative control 2 — §4.2 makes the loader
"discover and record actual delivered inputs" with "the caller's claimed read list is not trusted" (CP-128),
which is the paired benign case control 2 requires to pass.

**The residual is disclosed rather than buried**, which is rare in this set: §4.2 states that server-recorded
delivery "is not satisfiable across the provider boundary, because provider-side context editing happens after
the loader has handed off and reports only aggregate counts", cites R1 F-02 and F-21 correctly for it, and
adopts the narrow remedy (reconcile the provider's reported edits against the manifest; an unaccounted edit is
a manifest defect). That is the correct disposition of an unclosable gap.

**X2, boundary metadata across transfers.** Enumerated transfer points and what carries typed metadata:

| Transfer | Typed carrier | Prose anywhere? |
|---|---|---|
| Delegation / subagent dispatch | `ConstraintSet`, schema-validated | No — a failed validation quarantines |
| `WorkMessage` assignment and result | `ConstraintSet` | No |
| Consultation return | `ConstraintSet` + `AttemptReport` | No |
| Handoff | `ConstraintSet` restated **by the receiver** before the giver's accountability ends | No |
| Continuation across a capacity reset | Same `ConstraintSet` schema, same manifest, same critical-field recheck (§4.5) | No |
| Summary to the founder (re-entry brief, §6.3 / F-6.7) | **None specified** | **Yes** |

The load-bearing rule is stated and is the strongest single sentence in any candidate on this dimension:
"a receiver may act only on members it can restate as typed values. Prose accompanying a `ConstraintSet` is
evidence, never a substitute for a member." R2 F-04's 0-of-48 against 73% is cited exactly for it.

**AX-M1-01 · (b) · The founder brief is the one untyped transfer, and it is the highest-consequence one.**
*Passage:* §4.2's `ConstraintSet` obligation enumerates "every `Delegation`, every `WorkMessage` of kind
`assignment` or `result`, every `Continuation`, every subagent dispatch and every consultation return" — the
re-entry brief of §6.3 and F-6 item 7 is not in that list, and F-6.7 describes its contents as prose
categories ("what was decided and by whom; what was omitted; what was contested and by whom…").
*Counterexample:* a week's absence ends; the brief compresses four parked decisions into a paragraph; the
exclusion on one of them ("do not settle above the standing ceiling without a professional") survives as
sentiment rather than as a `restriction[]` member; the founder reads it as advisory and approves. R2 F-04
measures exactly this: boundary-marker survival ~0.57 under compression, and vague constraint language leaking
in 73% of cases. *Required contract:* the founder brief carries a `ConstraintSet` in the same schema as every
machine transfer, with the omissions section rendered rather than narrated. M1 already argues the general
form of this and stops one recipient short. **(b), not (d):** the mechanism exists and its application to one
transfer is missing, not a decision an implementer must invent.

**X3, contamination and freshness.** §5.3 is the best treatment in the set. It **rejects both obvious
defences on measurement** rather than adopting them — write-path content screening (R1 F-10: 0 of 360 refused,
0.832 recall on injection, 0.850 → 0.300 at 1.2% of corpus) and provenance-weighted ranking (p=0.80 at shipped
weight; evidence recall to exactly 0.00% at the weight that worked) — and substitutes out-of-band
discrimination plus the CP-142 understanding check. It also imposes a paired clean case on every filter, citing
the correct reason (every filtering source in the corpus measures leakage and none measures correct work
refused). The stale-decision case is handled at §4.5 and F-5: re-derive every critical field by direct probe
against the `FieldAuthority` value and its `ValidityEpoch`, "never by re-reading the stored context".
**What it does not answer:** what a poisoned entry *already influenced*. §5.3 detects and supersedes; no
mechanism enumerates the downstream artifacts a superseded entry touched.

**AX-M1-02 · (c) · Contamination has detection and supersession but no blast-radius enumeration.**
*Passage:* §5.3, "supersession as an operation rather than an append, followed by an understanding check".
*Counterexample:* a false canonical value is superseded on day 9; three accepted `WorkOrder`s between day 2
and day 9 consumed it through a `Projection`; nothing re-opens their acceptance. M1's own `Projection` rule
propagates revocation to derivatives ("including derivatives already written") — that machinery exists for
grants and is not wired to corrections. *Required contract:* a supersession enumerates the accepted outcomes
whose evidence closure includes the superseded value, and either re-accepts or flags each. Evaluation
protocol, baseline and owner needed; (c), not (d), because the decision is made and the reach is unstated.

### W5 · independence of verification under one model family — **sufficient**

M1 §6.1 and F-4 do four things the dimension asks for and one more.

1. **The split is written in the candidate's own words**, which is what R7 §8 makes the compliance test:
   influence yes, error no, "and no procedure converts one into the other". R7 F13, F1, F2 and F12 are all
   cited accurately, including the uncomfortable one — buying a second frontier family buys the *most*
   correlated second opinion because correlation rises with capability.
2. **A third arm past W5's two.** §F-4 item 3 adds "checker reads the shared record versus checker reads only
   the artifact and criteria" and names it as the probe that decides whether §5's design is safe for §6.1's.
   This is R7 F2's preference-leakage channel applied to the candidate's own central mechanism.
3. **AM-01's paired clean case is carried with its reason and its storage**, in `InstrumentCalibration`:
   "Both numbers or neither", with the 68.4–96.8% false-positive figure cited exactly and the correct
   inference from it ("Detection of 97.2% alongside a 96.8% false-positive rate is not detection; it is a
   constant" is R7 F8's own sentence, and M1 reproduces the substance).
4. **Negative control 6 is detectable** because the checker's *delivered* inputs are recorded by the loader
   rather than asserted by the caller, and both attack surfaces are closed — rationale (anchoring) and
   preferred conclusion (sycophancy) — with M1 stating that closing one is "half the door".
5. **It refuses two tempting mechanisms on evidence**: debate rounds (R7 R3 — no asymmetry to exploit when the
   checker holds the artifact) and a same-family jury (R7 F14's stated mechanism is disjoint families, which a
   same-family panel has removed). Refusing an available mechanism against interest is the strongest single
   signal of W5 seriousness in the set.

**It also raises the sharpest objection to itself.** §11 O-2: "If a producer's framing reaches the checker
through the canonical record, every provenance check passes and the independence claim is void." M1 names this
as unrun and as the first probe to run when a runtime exists. No finding is raised against it here because the
disclosure is already the required contract.

**One residual, recorded not as a finding but as the W5 problem restated:** M1's §F-6 item 8 refuses to accept
anything above consequence class `C2` on same-family judgement alone during founder absence. That is the only
place in the five candidates where the one-family residual changes what the system *does* rather than what it
*says*. It is a design proposal on evidence and it is unmeasured.

### W14 · evidence quality of this round's own claims — **sufficient**

**Ledger audit — 20 rows opened and resolved against `research/F2/R*.md`.**

| Row | Cited | Verdict |
|---|---|---|
| 9 | R2 F-04 | **exact** — 0.97–0.98 / ~0.57 / 73% / 0 of 48, all present |
| 10 | R2 F-18, FAL-02 | **exact** — 360 s window, continuation mandatory in every arm |
| 13 | R3 F42, F44; R1 F-23 | **exact** — F44's "only mechanism in the survey that answers protocol §5 item 8 structurally rather than by convention" is reproduced with its scope intact |
| 14 | R8 W-3; R1 F-06, F-07 | **exact** |
| 16 | R1 F-10 | **exact** — 0 of 360, 0.832 recall, 0.850→0.300, p=0.80, 0.8583→0.0417, recall 0.00% |
| 19 | R7 M1, F5 | **exact** |
| 20 | R7 M2, F9 | **exact** — 28.6 vs 23.8 at p=0.004, 24.6 at p=0.008, and the p=0.11 control reported as the control |
| 21 | R7 F13, F1, F2, F12 | **exact** |
| 22 | R7 F15, M5 | **exact** — 5–65%, 46%, 48 of 93, +42/+20/+13, severity 20–28% |
| 24 | R7 F19, D-08 | **exact**, including "does not license a published detection rate" |
| 25 | R7 R3, R2, F14, F17 | **exact** |
| 29 | R4 F5, FAL-03, D-01 | **exact** — all four inheritance paths |
| 33 | R2 F-08; R6 F7 | **exact** — "grants… does not restrict… can grant itself broad tool access" |
| 34 | R3 F59 | **paraphrase, with one wrong number.** §2.2 says the zero-tool dispatches came "two days later"; R3 F59 dates them 2026-08-16 and 2026-08-17, **one** day. Immaterial to the mechanism, material as a specimen: this is a restatement drifting on a detail with no reader between it and the source |
| 36 | R1 F-17 | **exact** — 18 of 30, 2.4 M / 117, hidden-profile |
| 39 | R5-14, R5-09 | **exact** |
| 44 | R5-23 | **paraphrase, mild stretch.** M1 §2.2 says the plan has "an approver who is a **different role**". R5-23 records the author as "personnel managing the incident" and the approver as "the Incident Commander or Unified Command". The separation is a fair reading; "a different role" is M1's word, not the source's |
| 50 / 51 | R8 W-6, R8 §3 | **exact** — no published denominator; unused allowance destroyed rather than saved |
| 63 | R6 F3, F2 | **paraphrase.** "above 90% below roughly 20–30 candidates" blends R6 F3's |S| ≤ 20 with the RAG-MCP "below position ~30" datum reported in the same finding. Both are in R6 F3; the blend is not flagged |
| 66 | R1 F-02, F-21 | **exact** |

**Counts: 17 exact · 3 paraphrase (1 carrying a wrong date) · 0 stretched · 0 absent.**

**DESIGN PROPOSAL rows labelled as evidenced: zero.** M1 marks six rows `†` as having no finding behind them
(38, 71, 72, 73, 74, 75) and counts them in the text. Rows labelled "DESIGN PROPOSAL on evidence" each carry
a finding id that resolves. The label discipline holds.

**AX-M1-03 · (b) · One ledger restatement carries a date error and nothing in the round could have caught it.**
*Passage:* §2.2 `GrantDeliveryReceipt`, "zero across three dispatches two days later". *Counterexample:*
R3 F59 reads 2026-08-16 and 2026-08-17. *Required contract:* none beyond the round's own — and that is the
point. Cross-lane §H records that **no quotation in this round has been machine-verified against its source**,
seven of eight lanes reporting the registration tool absent. This error survived because nothing checks.
The finding is against the round's instrument, not against M1's argument.

---

## M2 — chartered persistent agents

### W3 · context integrity under summarization and handoff — **sufficient**

**X1, the manifest.** M2 does not restate the manifest; it inherits `06` §2 and cites the load-bearing clause
verbatim at F-4 item 4 — "The caller's claimed read list is not trusted" — and at §4 item 4, where the loader
resolves carried entries "under current permission and validity" and "records what it actually delivered".
§11 item 4 closes (d)-example 4 with "portable `Continuation` plus loader manifest; no provider-resumed
session; carried entries are Refs with `valid_until` checked at read; applied provider edits reconciled
against the manifest." **Negative control 5 passes by inheritance**, which is legitimate but thinner than M1:
M2 nowhere states that omissions are a required manifest section in its own words, and its `SummaryLoss`
reference at F-5 is a pointer rather than a specification.

**X2, boundary metadata.** M2's typing is real but narrower in scope than M1's. §5.2: a carried entry is
"(class, Ref, typed fields, valid_until, provenance, writer)" with "**no free-text field in any class**",
and R2 F-04 is cited exactly as the reason. The containment argument is the sharpest structural idea in the
candidate: "Because every entry is a Ref, **there is nowhere for a plausible false statement to land.**"
It states the residual honestly — an attacker who can file a real complaint creates a real standing entry,
which is a false complaint rather than poisoning.

**AX-M2-01 · (b) · Typing covers the carried record and does not cover the work-order transfer.**
*Passage:* §5.2 types the four carried-memory classes; §4 steps 1–7 describe wake → admit → staff → carry →
accept → land → close with no typed constraint envelope named on the `WorkOrder` handoff itself, and §11
item 2 closes the handoff-acceptance question with "parent sponsorship persists until an accepted
responsibility transfer (`05` §5)" — an inherited prose rule, not a typed carrier. *Counterexample:*
`CT-DUTY` wakes a deletion duty; the ephemeral worker receives the roll entry's Refs and the work order;
the supplier contract's *rejected alternative* ("we declined pseudonymisation because the contract names
erasure") lives in the `DecisionRecord` prose and is not a typed member; the worker pseudonymises.
R2 F-04's stratification is the evidence: operational facts survive, boundary markers do not. *Required
contract:* the typed-member rule M2 applies to `CarriedRecord` extended to every transfer the fixture list
names, including the `WorkOrder` dispatch and the founder's charter sheet.

**X3, contamination and freshness — M2's strongest section and its largest exposure, and it says so.**
§5.1 opens by quoting the measurements *against its own central mechanism* before proposing anything:
R1 F-10 (0 of 360), F-11 (>60% override), F-04 (19 and 15 points, "a bigger model does not close it", budget
expansion recovers nothing), F-15 (defences work worst in memory: 28–29% against up to 50% in channels).
It then draws the conclusion against itself: "A standing memory of free-text recollections is the single worst
artifact this evidence permits anyone to build." The design target is stated as *containment*, not usefulness.
Freshness is a mandatory `valid_until`; correction is supersession plus CP-142's understanding check; the
**decision probe** flips a probe entry to confirm the output changes, on the correct ground that "recall
without the decision probe is not evidence of use". The write-time cap oracle is derived from R1 F-03 exactly
("an index trimmed on read is an index whose omissions nobody observes").

**The stale-decision case is answered better here than anywhere else in the set**, because the Ref
indirection makes it structural: the carried entry resolves to the canonical record whose validity is checked
at read, so a founder changing their mind updates one authority and every carried citation lapses with it.

### W5 · independence of verification under one model family — **sufficient**

**M2 refuses a charter at exactly the point where its own design is most tempted, and the refusal is
evidence-driven.** §7 F-4: "There is **no standing reviewer** in M2, and no checker may read any charter's
carried record", justified on R7 F9 (fresh context beats a context-carrying subagent at p=0.004) and R7 F2
(preference leakage through a record the producer wrote and the checker reads, with "every provenance check
still passes"). §2.5 lists the standing reviewer as one of three named refusals. §5.2's disposition-precedent
class marks any checker **excluded** at the table level, not in prose.

The four F-4 requirements are met: deterministic oracle first with its stated limit (it "cannot see a skipped
authorisation"); three channels blinded separately with the "half the door" formulation; loader-recorded
delivered inputs; and AM-01's paired clean case with the 68.4–96.8% figure and the correct reading of it.
The W5 floor R7 §8 asks for is present — "the repeated same-context control (p=0.11) must be shown beside it"
— and M2 is the only candidate besides M1 that states that control as a requirement rather than as context.

**The honest account is present and goes further than required:** §9.1 "What M2 does not claim over S1.0 …
**Nothing at all on F-4** — independence comes from separate evidence, method or grounding, not from
standing", and §9.2 quotes R7 §8's finding *against* M2 verbatim rather than paraphrasing it, then adjusts the
claim: "Its advantage over B0 is not verification."

**AX-M2-02 · (c) · The instrument desk evaluates every other desk and is accepted by the founder alone.**
*Passage:* §11, "Who accepts `CT-INSTRUMENT`'s own instrument readings, given that it holds the pools that
evaluate every other desk including itself? **Decided: the founder**". *Counterexample:* R7 F15 measures the
human anchor at 5–65% any-two agreement and 20–28% on severity; a single human accepting the calibration of
the instrument that gates every other acceptance is a one-instrument chain with a measured error rate and no
second reading. M2 records this as "a real charge against W12's attention budget" — correct as far as it goes,
but the W5 consequence (the instrument's own verification has an N of one) is not stated. *Required contract:*
the instrument desk's readings carry their own paired clean case and a deterministic reproduction path, so
founder acceptance is a check of a computation rather than a judgement. (c): protocol and owner needed.

### W14 · evidence quality of this round's own claims — **sufficient**

**Ledger audit — 18 rows opened and resolved.**

| Row | Cited | Verdict |
|---|---|---|
| 3 | R4 F2 | **exact** — AWS "limit permissions … but do not grant permissions", macaroons, Biscuit |
| 4 | R4 F7 | **exact**, including the verbatim "What is missing is not capability. What is missing is a *policy object*…" |
| 5 | R4 F5 (FAL-03) | **exact** — all four inheritance paths, correctly summarised |
| 6 | R2 F-08; R6 F7 | **exact** |
| 7 | R4 F3 | **exact** — attenuation buys narrowing, not revocation |
| 8 | R8 §8 | **exact** — "a charter defends its mandate against admission narrowing" is quoted from R8's own failure list |
| 10 | R2 F-04 | **exact** |
| 11 | R1 F-10 | **exact** — 0 of 360 |
| 15 | R1 F-03 | **exact** — 200 lines / 25 KB, write-time size check |
| 16 | R3 F42, F44 | **exact** |
| 18 | R7 F9 | **exact**, with the p=0.11 control preserved |
| 19 | R7 F2 | **exact** |
| 20 | AM-01; R7 F8 | **exact** — 68.4–96.8% on patched code, and the threshold-not-discrimination reading |
| 21 | R7 F19 | **exact**, preserved as a disagreement |
| 23 | R7 F3, F15 | **exact** — 541,000 judgments, 118 runs, 21 judges, 33.8–41.2 points, κ 0.39–0.46 |
| 26 | R7 F7 | **exact** — 84% → 51% in three months |
| 29 | R5-15 | **exact** — 96%+ in-scope, 66% best out-of-scope recall, 40.3% when examples were cut |
| 40 | R8 §7.3 | **exact** — "Drift of a *performer* is not measurable without a performer that persists" |

**Counts: 18 exact · 0 paraphrase · 0 stretched · 0 absent.** M2's citation fidelity is the highest of the five.

**DESIGN PROPOSAL rows labelled as evidenced: zero, and the count is stated against interest.** Rows 44–53
are marked `—` / "**DESIGN PROPOSAL, no evidence**", and §12 says so in the open: "**Ten design choices carry
no evidence** … **None of the ten is the candidate's central claim**, and that is the point of counting them:
the central claim is row 38 and its evidence is a review finding and an inference, not a measurement."
Row 53 goes finer still, splitting an evidenced problem from an unevidenced remedy. This is the only ledger in
the set that separates *the failure is measured* from *my fix is not*.

**AX-M2-03 · (a) · The ledger's row 1 contradicts the body's own count, in the direction that flatters R8.**
*Passage:* §12 row 1, "Charter delta is exactly **two** properties, not six | R8 A-1 | INFERENCE". *Passage
contradicted:* §2.4, "R8 A-1 counts the delta as **two** properties … **This candidate counts three and says
why**, rather than quietly adopting the smaller number". *Counterexample:* a reader auditing M2 by its ledger
alone records a two-property delta and drops reachability — which is the row CAP-42 depends on, and CAP-42 is
what §8 calls "the single capability that most justifies M2's existence". *Required contract:* the ledger row
states M2's count and cites R8 A-1 as the source it departs from. Classed **(a)** because the fix is a
specification edit with no open question behind it. Severity is low and the direction is notable: the
discrepancy understates the candidate's own claim rather than inflating it.


---

## M3 — workflow-first, no agents

### W3 · context integrity under summarization and handoff — **sufficient**

**X1, the manifest.** §2's primitive table specifies a `ContextManifest` "produced by the loader, which
discovers and records the inputs it actually delivered", carrying "versions, validity epochs, selection
reasons, **omissions, summarisations and known loss**", and the negation is written into the same row:
"Not the caller's claimed read list, which is not trusted." §7 F-5 then states the honest position on
negative control 5 — "a manifest that lists inputs but not omissions — **is what every surveyed system
currently emits**", so M3 must build this rather than import it, and the provider-side half may be
unachievable. §5 names the standards gap correctly: of nine required fields, one protocol's resource metadata
touches age and nothing touches version, trust level, omission, summarisation or possible loss.

**AX-M3-01 · (b) · The manifest omits per-input trust level, which DIRECTIVE §8.12 requires by name.**
*Passage:* §2, the `ContextManifest` row, enumerates "versions, validity epochs, selection reasons,
omissions, summarisations and known loss" — no trust level. Trust exists in M3 at record granularity
(the `WorkRecord` carries "trust class of its origin channel", used at §7 F-1 adverse variation A) and not at
item granularity. *Counterexample:* a `model` step's read set delivers a customer's authenticated statement
and a scraped competitor page; the record's trust class is the *channel's*, so the two arrive
indistinguishable inside one manifest, and the invariant "control flow is trusted; model output is data"
does not separate them because both are data. *Required contract:* trust level is a per-item manifest field,
not a per-record one. M1 §4.2 states it correctly and is the model. **(b):** the mechanism is present at the
wrong granularity, not absent.

**X2, boundary metadata.** M3 types the boundary at every step edge, not only at agent edges — `ConstraintSet`
carrying "exclusions, deadlines, promised remedies, rejected alternatives, units, recipient scope,
authorisation scope" and the `WorkRecord`'s surviving obligations, with R2 F-04's 0-of-48 cited exactly and
the row's own negation written as "**Not prose.**" §5 adds the point no other candidate makes: "The
authorisation and recipient scope is not optional and its absence is the dominant measured failure" in the
founder's own five-part list of what shared truth should contain [R1 TC-14]. **This is the only candidate
where the typed envelope crosses every execution boundary, because in M3 every boundary is a step edge.**

**X3, contamination and freshness.** The design choice is structural rather than defensive: invariant 4,
"Nothing a model wrote is authoritative until a non-model step accepted it", justified by R1 F-10's 0-of-360
and explicitly declining to rely on screening. **M3 then states the residual against itself, which is the
test of an honest answer:** §5, "a wrong fact accepted by a person is still wrong, and **the blast radius of
a false journal entry in M3 is every later step that reads that field**. The measurement that would size it
is unrun." That is the same gap M1 carries (AX-M1-02) and M3 is the only candidate that names it unprompted.
The stale-fact case is answered deterministically: a version comparison at step entry, "not a judgement",
plus the CP-142 understanding check with the correct reason attached.

**X5, false success and summary distortion — M3 gives the strongest answer in the set, and it is computed.**
§7 F-6, the re-entry brief: "a **deterministic projection**: everything admitted, completed, parked, refused
and shed with residuals; every default-on-no-answer that fired; every irreversible decision deferred and its
remaining slack; every `unknown_effect`. Then **one model step** whose narrative output is validated
field-by-field against that projection before the founder sees it — the same discipline the field applies
nowhere." A summary that cannot diverge from a computation is the only mechanism in the five candidates that
makes omission structurally visible rather than dutifully reported. §7 F-1 adds the matching rule for the
producer side: "silent mistyping into the nearest existing kind … must never be scored as success", with a
three-way confusion matrix as the instrument.

### W5 · independence of verification under one model family — **sufficient**

M3's claim on this fixture is narrower than M1's and stronger where it is narrow. §7 F-4 step 2: "A review
that says it did not read the producer's rationale, in a system where nothing recorded what it read, is an
assertion; **in M3 it is a record, and that is M3's single strongest claim on this fixture**." The mechanism
is that `read_set = {artifact_ref, criteria_ref}` is a declared field the loader enforces, and the producing
step's rationale lives in a named journal field the read set excludes — so negative control 6 is detected by
a manifest comparison rather than by a reviewer's word.

All of AM-01, the three-arm probe, the p=0.11 floor, union aggregation and chance-correction are present and
cited exactly. Two things M3 does that the others do not:

- **It escalates the class rather than the panel.** "For irreversible and outward-facing consequence classes,
  a model step may generate findings and **may not be the acceptance step**." This is the only candidate that
  converts R7 F9's 28.6% F1 into a structural exclusion rather than a caveat: "that is a finding generator,
  not a gate."
- **It closes a routing hole nobody else names.** §7 F-4: "The router selects the review step's procedure
  from committed configuration, never at runtime from the producing run's state. **A design whose routing
  component can choose who checks its own work has not achieved procedural independence**" [R5 §8].

**And it states the cost of its own answer without offset.** §6.1: "Every design here eventually routes to
human acceptance, and human evaluators agree with each other at 5–65% … **The human anchor is an instrument
with an unmeasured error rate.** M3 makes more use of it than any agent-based candidate … That is a real cost
of this candidate and it is not offset by anything." Under W5 that is the correct disclosure, and it is the
only place in the set where a candidate charges itself for the instrument it leans on.

### W14 · evidence quality of this round's own claims — **sufficient**

**Ledger audit — 21 rows opened and resolved.**

| Row | Cited | Verdict |
|---|---|---|
| 3 | R2 F-09 | **exact** — 77% with provable security against 84% undefended, 7-point utility cost, and M3 states it pays the price "by construction and does not hide it" |
| 4 | R3 F24, F25 | **exact** — "a state write *is* an event" |
| 5 | R3 F42 | **exact** |
| 6 | R2 F-04, F-05 | **exact** |
| 7 | R1 F-02, F-21; AG-02 | **exact**, including the nine-field standards gap |
| 9 | R4 F1, F5, F7 | **exact** |
| 10 | R4 F4 | **exact** — both failing mechanisms named (tool annotations, command-text permission rules) |
| 11 | R4 F2, F10 | **exact, and cited against interest.** M3 reproduces F10's status caveat — "individual submission … 'not endorsed by the IETF' … 'no formal standing'" — and concludes "**M3 is building ahead of the standards here, not behind them**, and should say so" |
| 12 | R4 F3 | **exact** |
| 13 | R7 M1, F5 | **exact**, including M1's stated limit (an oracle cannot see a skipped authorisation) |
| 14 | R7 M2, F9, §9 | **exact** |
| 15 | AM-01; R7 M4, F8 | **exact** — 68.4–96.8%, threshold not discrimination |
| 16 | R7 M5, R4 | **exact** |
| 18 | R3 F27; R5-23, R5-12 | **exact** — typed request node with its own checkpoint; do not delay planning; assigned-and-silent is not an end state |
| 20 | R5-14; AG-12; R3 §9 F-1 | **exact** |
| 23 | R3 F11 | **exact** — "three single-context failures", "significantly more tokens", and M3 "takes the mechanism and refuses the autonomy" |
| 24 | R5-19, R5-10 | **exact** — including the transferable form (benign pass-through for a token, silent drop for an obligation) |
| 26 | R8 §3 | **exact** |
| 35 | R3 F60, F57 | **exact** — 44 declarations, 16 budget blocks, three of four workflow files, and F57's "checks the DECLARATION, not the binding" |
| 38 | R5-18 | **exact, and correctly downgraded.** M3 writes "one vendor states a 30–50 item threshold **with no published method**", which is R5-18's own conflicted-source-claim label carried through |
| 42 | R3 F47, F48 | **exact** — content-hash pinning re-checked at use as the only mitigation surviving a rug pull |

**Counts: 20 exact · 1 paraphrase carrying an inherited error (§7 F-3's "two days later", see AX-ROUND-01
below) · 0 stretched · 0 absent.**

**DESIGN PROPOSAL rows labelled as evidenced: zero.** Rows 22 and 37 are marked "**DESIGN PROPOSAL**,
direction evidenced" in the kind column, which is the correct finer label, and six further choices are named
in prose after the table with a falsifier attached to the first one. M3 also closes the ledger with two
explicit non-assertions — that it consumes less capacity than B0 or S1.0, and that independent verification
is achieved.

**Two places M3 cites a lane's caveat rather than its headline**, which is the behaviour W14 is looking for
and which no other candidate does twice: R4 F10's "no formal standing", and R3 F62's restriction of F61's
roster collapse to one harness ("does not establish that role-shaped decomposition carries none in general,
and reading it that way would be the absence-of-evidence error DIRECTIVE §6 forbids").


### Addendum to M2 — one further W3 finding, raised after the cross-candidate pass

**AX-M2-04 · (b) · M2 names no trust level anywhere, at any granularity.**
*Passage:* searching M2 for `trust level`, `trust class` or `trust-level` returns nothing. Its manifest is
inherited from `06` §2 and never restated, and DIRECTIVE §8.12's trust-level field therefore has no carrier
in M2's own specification. *Counterexample:* `CT-STANDING`'s published intake route is, in M2's own words,
"deliberately, a channel an untrusted party can reach" (§10, Security implications). An `Observation`
arriving there and an `Observation` from an admitted integration both resolve to `Ref`s inside a carried
entry; §5.2's containment argument turns on the Ref, not on a trust grade, so the two are structurally
indistinguishable once referenced. M2 relies on `SourceRecord` marking the channel untrusted at §7 F-1, but
that is a property of the observation and is never carried into a manifest a consuming step reads.
*Required contract:* trust level named as a manifest field, per input, as M1 §4.2 and M5 §5.1 do.

---

## M4 — hybrid by consequence class

### W3 · context integrity under summarization and handoff — **sufficient**

**X1, the manifest.** §5 restates the core rule correctly ("The loader records **actual delivered inputs**;
the caller's claimed read list is not trusted") and adds two fields no other candidate adds: **which typed
constraints were dropped** by a transformation, on the explicit ground that "what was omitted" does not
obviously cover *which constraints*; and **the class the manifest was assembled for**, "so a manifest built
for a C1 action cannot be silently reused for a C3 one". The second is a genuine contribution — it makes
manifest reuse across a consequence boundary a detectable error rather than an invisible one. Negative
control 5 passes.

**AX-M4-01 · (b) · The manifest omits trust level, and M4's own derivation makes the omission bite harder
than it does elsewhere.** *Passage:* §5's manifest paragraph enumerates delivered inputs, dropped constraints
and the assembled-for class. `trust level` appears nowhere in M4. *Counterexample:* §2.2 input 1 resolves
parameters from "the verified payee source" and input 3 from record joins, and §7.1 adverse variation states
that a false report "can never be a parameter authority". Both are correct **at the derivation**. But the
`E` preparing the payload receives a manifest with no per-input trust grade, so an attested supplier contract
and an untrusted inbound report arrive in one window with the same standing, and M4's protection is entirely
downstream. That is a coherent design — but it means a producer cannot *tell* a reader which of its inputs
were trusted, and §10 already concedes "a false entry in a trusted business record defeats the derivation".
*Required contract:* per-input trust level as a manifest field, so the derivation's trust assumption is
visible to the step that acts on it, not only to the gate.

**X2, boundary metadata.** M4's `WorkManifest` (§2.4) is the most complete typed field list in the set:
"the derived class and its contributing dimensions; the attenuated grant set; exclusions; acceptance owner
and criterion; deadlines and latest responsible time; promised remedies; units on every quantity; rejected
alternatives with reasons; the context manifest ref with its omissions; and the interval holder". R2 F-04 and
F-05 are both cited and the inference drawn from F-05 is the right one: "Four of the five facts the round's
own recall probe seeds … are boundary metadata."

M4 then does something no other candidate does — it **keys the seam rule to the class** (§4.3). Handoff is
permitted at C0/C1; at C2 and above only consultation, the obligation-holder never leaving the turn. Typing
happens at every class, so the class governs whether *ownership* moves through the compressed artifact, not
whether the artifact is typed. And §4.3 extends it to the continuation: "a C3 work order crossing a launch
boundary resumes in consultation shape, the obligation stays with the interval holder".

**X4 note carried here because it belongs to W3:** §4.4 names the interval between declared-done and accepted
as `submitted-pending-acceptance`, gives it a holder who is "never the producer and never the acceptor", and
makes it **inherit the class of the unreleased effect and therefore its deadline**. AG-18, R5-13 and X18 are
cited correctly for the gap this fills.

**X3, contamination and freshness.** §5's answer is structural: "**a false entry cannot change a class**,
because the class comes from parameter authorities and destinations rather than narrative content." R1 F-10's
0-of-360 is cited as the reason not to build a screen. The concession is explicit and is repeated in §10:
"A false entry in a trusted business record defeats the derivation, because trusted records are its inputs."
Freshness: §7.5, "a pre-gap class is stale the way a pre-gap fact is", with R7 F7's 84→51 drift cited for the
model-verdict half.

### W5 · independence of verification under one model family — **sufficient**

§6.1 states R7's sentence almost verbatim and, crucially, states why it states it: "M4 states both halves
wherever it claims verification, because stating the first and implying the second is the laundering the
protocol forbids." Three mechanisms are stronger than the set average:

- **A checker with no clean-case rate resolves `unresolved`, never `pass`.** §6.1 ties AM-01 to `06` §6's
  `inconclusive` disposition and to the repository's Rule 10. This is the only candidate that gives the
  paired clean case a *terminal value* rather than a reporting obligation, so an omitted control fails
  closed instead of being a missing paragraph.
- **The verification floor is derived from the class by the same function**, so "who may accept" is not a
  per-capability negotiation. §4.1's right-hand column makes the C3 line a structural exclusion: "**A 28.6%
  instrument is a finder, not a gate. Model checkers find; deterministic predicates and people accept.**"
- **The approval ratchet is closed on the arm R4 says is usually missed.** §6.2: "the accumulated **approval
  set** can lower supervision without the executor's record changing at all, which is what a permanent
  repository-wide allow rule with no expiry does [R4 TC-25, failure case 8]. **Every approval in M4 carries
  an expiry.**" That is a W5-adjacent leak nobody else names.

The three-arm probe, the p=0.11 floor, chance-correction, union aggregation and the debate refusal are all
present and correctly sourced. §7.4's disposal of the planted-defect rate is the sharpest phrasing in the
set: "A planted-defect detection rate is an **upper bound on a capability, not an estimate of a real rate**."

### W14 · evidence quality of this round's own claims — **sufficient**

**Ledger audit — 19 rows opened and resolved.**

| Row | Cited | Verdict |
|---|---|---|
| 3 | R4 F4 | **exact** — untrusted tool annotations and command-text matching both named as the source names them |
| 14 | R2 F-04, F-05 | **exact** |
| 17 | R8 A-4, A-5, A-7 | **exact**, and A-7 is cited *against* M4's own holder design |
| 22 | R8 A-4 | **exact** — "a class has no representative to ask" |
| 23 | R8 §3 | **exact** |
| 24 | R8 W-6 | **exact** — "'this design consumes 40% of the allowance' is not a sentence anyone here can write" |
| 26 | R5-15, R5-16 | **exact**, including the base-rate inversion |
| 29 | R5-04, R5-05, R5-14 | **exact** — "Resources that authorities do not request should refrain from spontaneous deployment" |
| 33 | R4 F10 | **exact**, and M4 reproduces F10's decidable/deterministic framing |
| 34 | R3 F59 | **paraphrase carrying the inherited date error** — see AX-ROUND-01 |
| 36 | R1 F-14, F-15, F-16 | **exact**; "roughly 16% and 51%" rounds F-14's 15.8–50.9% and is flagged as roughly |
| 39 | R1 F-20 | **exact** — "context, not enforced configuration", "may pick one arbitrarily" |
| 41 | R2 F-08, R6 F7 | **exact** |
| 42 | R6 F3 | **exact, and the best rendering of R6 F3 in the set** — "fitted capacity near 84–92 packages, near-duplicates costing 17 to 63 points, two-tier routing measuring 72–85% against 45–63% flat" matches κ = 83.5/91.8, the two-competitor row, and the |S| ≥ 60 rows |
| 44 | R7 F8, FAL-09 | **exact** |
| 51 | R4 TC-25, failure case 8 | **exact** |
| 54 | R7 F15, R7 §8 F-6 | **exact** |
| 58 | R5-12, R5-19, R5-10 | **exact** |
| 69 | FAL-13, R8 TC-21 | **exact, and cited against interest.** M4 reproduces FAL-13's warning in the same sentence as the advantage it constrains: B0's F-3 failure is "entailed by the frozen boundaries rather than measured, **and it must not be scored as an empirical result**" |

**Counts: 18 exact · 1 paraphrase carrying the inherited error · 0 stretched · 0 absent.**

**DESIGN PROPOSAL rows labelled as evidenced: zero**, and M4's labelling is unusually fine-grained. Row 6
reads "*(none)* — control 8 · R3 F60 motivate, **neither evidences**", which separates motivation from
support; rows 18, 19, 30, 65 and 66 do the same. The closing paragraph then ranks its own unevidenced rows
by consequence — "Rows 6, 18 and 19 are the load-bearing ones: if the holder test is wrong the holder set is
wrong and §8's last column is wrong with it" — and marks row 66's threshold as "a placeholder chosen to be
falsifiable rather than derived". No other ledger ranks its own gaps.

**AX-M4-02 · (b) · One row labelled DIRECT OBSERVATION rests on two files the provenance header does not
list.** *Passage:* §12 row 7, "One implementation of the derivation | **DIRECT OBSERVATION**:
`scripts/classify.mjs` and the recorded collision in `CLAUDE.md`", supporting §2.2's quotation *"Two
implementations of risk classification will disagree, and you find out during the incident."*
*Verification:* I resolved both. The string is at `scripts/classify.mjs:15–16` and the collision is recorded
at `CLAUDE.md:222`. **The content is accurate.** *Counterexample to the label:* M4's own provenance header
enumerates its reads and contains neither file — the list ends at the specification, coverage and DIRECTIVE
files. A reader auditing M4 against its declared reads cannot resolve a row marked DIRECT OBSERVATION, which
is the strongest kind label available. The most likely route is the harness's auto-loaded `CLAUDE.md`, which
is legitimate reading and undeclared. *Required contract:* a DIRECT OBSERVATION names the artifact it
observed in the provenance header. Low severity, and it is the only kind-label defect I found in five
ledgers.


---

## M5 — subscription-activated capabilities around a shared record

### W3 · context integrity under summarization and handoff — **sufficient**

**X1, the manifest — M5 is the most literal against DIRECTIVE §8.12 of the five.** §5.1: "The manifest
carries version, age, trust level, **what was omitted, what was summarized and what may have been lost**."
That is the directive's field list reproduced rather than gestured at, and it is the only candidate that
names **age** and **trust level** alongside the three loss fields. It then bounds its own promise with a
FACT: no standard in the path carries those fields, the provider edits server-side after the loader has
handed off, and "**that is the available remedy, it costs one field read, and it does not make the manifest
complete**." Negative control 5 passes, and the residual is priced rather than waved at.

**X2, boundary metadata.** Typed at the record layer rather than only at the transfer layer: the `Constraint`
entry kind is defined as "a **typed** exclusion, deadline, promised remedy, unit, or recipient scope — never
prose", with a named sole writer and a discrimination step before acceptance. R2 F-04 is cited exactly at
§7 F-1 step 3. The eleven entry kinds are justified against the founder's five by R1 TC-14, and M5 is
explicit that the dominant measured failure — authorization and recipient scope — is none of the five.

**X3, contamination and freshness — the strongest structural answer in the set, and the one closest to
having a blast-radius mechanism.** §5.3 rejects both screening and ranking on R1 F-10, and substitutes
**trust class as a gate on what an entry may activate, never a weight on a ranking**: an
`untrusted-external` Fact may be a precondition only for `read_only` interests, so it "can never gate an
outward effect and can never serve as a discriminator". The price is stated in the same paragraph — R2
F-09's seven points — which is the correct accounting and is rare.

Two further mechanisms matter here. Freshness is a **disarm**: "An expired precondition does not fire its
interest; it fires the `freshness` interest instead" (§5.2). And a contradiction **suspends the interests
that depend on that field** and arms `contradiction`, which retains both claims rather than picking a winner.
That is the stale-decision case answered by construction: a founder changing their mind writes one entry,
and every interest whose precondition reads that field stops arming, without anyone enumerating them.

**AX-M5-01 · (c) · Contamination suspends future firing and does not reopen what already fired.**
*Passage:* §5.2, contradiction "suspends the interests that depend on that field"; §5.3 item 3, supersession
arms an understanding check. *Counterexample:* an `untrusted-external` Fact is corroborated on day 2 and a
**new** `attested-external` Fact is written (§7 F-1 adverse A); the corroboration was wrong; on day 9 the
attested Fact is superseded. Six activations between day 2 and day 9 wrote `derived` entries from it. M5 is
closer than any other candidate to closing this — trust class `derived` is defined as "produced by an
activation from named inputs", so the lineage exists — but no rule walks it. *Required contract:* a
supersession arms an interest over the transitive closure of `derived` entries naming the superseded entry
as an input, and each reopened `AcceptanceState` is re-decided or flagged. M1 and M3 carry the same gap with
less machinery available to close it; M5 has the lineage and does not use it. (c): protocol, unit and owner
needed.

**X5, false success.** §7 F-5 gives M5 a structural answer that no other candidate has: "**The armed set is
recomputed from typed entries, never carried in a summary.** A pre-reset summary that omits a decision
therefore cannot cause the wrong activation, because the summary is not what activates." That removes a whole
class of summary-distortion failure rather than detecting it. The founder-facing side is weaker than M3's —
the re-entry brief's contents are enumerated (what was omitted, what was contested, refused-item sample, shed
lanes, crossed times, pool contents, and the checker's clean-case refusal rate) but the brief is not
specified as a validated rendering of a projection. The `refusal-sample` interest is a genuine addition:
"a refusal nobody reviews is a decision nobody made."

### W5 · independence of verification under one model family — **sufficient**

§7 F-4 opens on the right object: the producer writes `submitted`, that transition arms `check`, and the
checker's inputs are "**server-recorded by a loader instance the producer cannot write to**". The
loader-instance separation is a detail only M5 states, and it is the correct one — a loader the producer can
write to is not a witness.

The leakage-channel answer is M5's own architecture turned on itself: the checker's projection is restricted
**by entry class** to what the producer could not author — externally provenanced `Fact` entries,
`Constraint` entries written by C01 or C07, the original acceptance criteria, and the artifact — with
producer-authored rationale a separate excluded class. **M5 then classes its own answer correctly and
publicly:** "**UNKNOWN:** nobody has tested this. It is class (b) — a documented mechanism whose deployment
is unverified." Declaring the central W5 mechanism (b) rather than (a) is the behaviour the disposition rules
ask for and the one most easily skipped.

AM-01, the two arms plus the sycophancy channel, the p=0.11 control and the 28.6%-versus-23.8% result are
all present and exact. The terminal decision is stated as a rule: "a same-family checker is **never** the
acceptance owner for an `outward_release` … acceptance for consequential classes routes to the cheapest
discriminator that can actually decide."

**AX-M5-02 · (b) · One citation presents the favourable half of a tension the corpus documents in full, and
it is the half that supports the design.** *Passage:* §7 F-3, "Least privilege is assembled by progressive
elevation from a minimal baseline [R3 F46, MCP's normative scope model], not held from the start."
*Counterexample:* R4 F11 is titled "**MCP's own least-privilege guidance contains a documented tension that a
reader could easily miss**", and records that the authorization specification's fallback is: *"If `scope` is
not available, use all scopes defined in `scopes_supported`"* — request everything — defended on the ground
that general-purpose clients "lack domain-specific knowledge". R4 then says the system under design has
exactly the property the defence assumes away. **M5 cites the progressive-scope half and not the fallback.**
M1 §6.2 cites both and refuses the fallback by name, so the full citation was available and one candidate
used it. Severity is low — the design conclusion is unchanged and arguably strengthened by R4 F11 — but the
*shape* is the one W14 exists to catch: a citation that is accurate and partial, omitting the clause that
complicates it. *Required contract:* cite R4 F11 beside R3 F46 wherever progressive scope is claimed.

### W14 · evidence quality of this round's own claims — **sufficient**

**Ledger audit — 17 rows opened and resolved.**

| Row | Cited | Verdict |
|---|---|---|
| 1 | R8 W-3, R1 F-23 | **exact** — including F-23's scope limit, one fact class at enormous cost |
| 2 | R3 F24, F25 | **exact** |
| 3 | R3 F42 | **exact** |
| 4 / 5 | R1 TC-14, F-14…F-16 | **exact** — 15.8–50.9% carried with the finding |
| 6 | R2 F-04 | **exact** — 0.97 / 0.57 / 73% / 0 of 48 |
| 8 / 9 | R1 F-10; R2 F-09 | **exact** — 0 of 360, 0.832, p=0.80, recall exactly zero; 77% vs 84% with the 7 points named as a price |
| 10 | R3 F33 | **exact**, verbatim: "an agent activates its action only after receiving all its prerequisite dependencies" |
| 13 | R5-01, R5-02 | **exact**, verbatim on "broad executive power … violate one essential characteristic … opportunistic problem solving" |
| 16 / 18 | R1 F-17 | **exact** — 18 of 30, 2.4 M to 117, and the correct causal reading (correlated behaviour, not divergent context) |
| 25 | R2 F-08; R6 F7, FC-6 | **exact** — including FC-6's "up to 80% attack success" |
| 26 | R3 F59 | **paraphrase carrying the inherited date error** — see AX-ROUND-01 |
| 29 | R1 F-02, F-21 | **exact** |
| 38 | FAL-09, AM-01 | **exact** |
| 39 | R7 F9, F13 | **exact** |
| 43 / 44 | R5-09, R5-10 | **exact** — and §7 F-1 step 6 does what R5-09 demands, naming the residue: "**The pool cannot catch an entry that armed the *wrong* interest.**" |
| 48 | R5-12, R3 F27 | **exact** |
| 49 | R5-23, R1 F-17 | **exact** |

**Counts: 16 exact · 1 paraphrase carrying the inherited error · 0 stretched · 0 absent.**

**DESIGN PROPOSAL rows labelled as evidenced: zero, and M5's ledger is the most granular of the five.**
Fifty-eight rows; **eight** named as resting on no finding, each with the *specific part* that is unevidenced
isolated inside the row — "the *four levels and their names*", "**the specific five**", "**the allowance's
size**", "**which five**". Row 17 is the most honest line in any of the five ledgers: "`contention_tie_break_
reason` recorded | 03 (custody analogue) | design proposal — **no finding; borrowed by analogy**". Two
further rows are separately named class (b). And the `## Claims` block records `claims_emitted: []` with the
reason: the append tool was absent, "This reproduces, in this candidate's own operation, the
declared-versus-delivered gap the round identifies as axis X16."

**AX-M5-03 · (a) · Two citations to the governing directive do not resolve, and this is the one finding in
the round that the repository's own blocking check exists to catch.** *Passage:* M5's header and §12 kind
line both write `[DIRECTIVE §6](../../inputs/DIRECTIVE.md)`. *Counterexample, computed:* from
`docs/vision-system/planning/F2/candidates/`, `../../inputs/` resolves to
`docs/vision-system/planning/inputs/`, which does not exist; the correct prefix is `../../../inputs/`, which
M1, M2, M3 and M4 all use. I resolved every relative link in all five candidates: **M5 is the only file with
a dead one, and it is dead twice.** *Required contract:* `../../../inputs/DIRECTIVE.md`. Classed **(a)** —
a one-character-class fix with no open question. It is recorded because of what it implies rather than what
it costs: `check:citations-exist` is a wired, blocking step of this repository's CI (existence blocks, drift
warns), and these files have not been through it.


---

## A round-level finding — the one specimen of summary distortion I could trace end to end

**AX-ROUND-01 · (b) · One measured interval drifted inside its own lane's summary, propagated through the
cross-lane artifact, and was reproduced by every candidate that cited it. Four of four.**

This is the W14 probe returning something, and it is worth more than its subject matter, which is
immaterial. The chain, fully resolved:

| Where | Text | Interval |
|---|---|---|
| `research/F2/R3-frameworks.md` §2, F59 — **the finding itself** | "held twenty-four `mcp__playwright__*` tools on **2026-08-16** and zero across three independent dispatches on **2026-08-17**" | **one day** |
| `R3-frameworks.md` §6, same lane, same file | "delivered twenty-four tools on one date and zero on three dispatches **two days later**" | two days |
| `R3-frameworks.md` §8, same lane, same file | "twenty-four tools one day and zero on three dispatches **two days later**" | two days |
| `research/F2/cross-lane-comparison.md` §F, MG-13 | "zero on three dispatches **two days later**" | two days |
| `cross-lane-comparison.json` | three separate rows, all **"two days later"** | two days |
| `M1` §2.2 · `M3` §7 F-3 · `M4` §4.5 · `M5` §6 | all four: **"two days later"** | two days |

M2 is the only candidate that does not carry it, and only because it never cites F59.

**Why this is a finding and not a typo.** Nothing in the chain is dishonest and no design conclusion moves:
the mechanism claim — *attenuation held, delivery did not* — is unaffected, and the dates are not
load-bearing for anything. What the chain demonstrates is that **the round has no mechanism that would catch
a restatement drifting from its own source**, and it demonstrates it on the easiest possible case: a
two-integer comparison, inside one file, between a finding and that same file's summary of the finding, with
no model boundary crossed and no compression budget applied. Every downstream reader then inherited the
summary rather than the finding, which is the exact shape of DIRECTIVE §7 Phase D's summary-distortion
attack and of the failure this repository's own `CLAUDE.md` records twice under a different name: *the
orchestrator's brief is a defect surface nobody reviews*.

The round already knows this about itself and said so. Cross-lane §H: "**No lane registered a claim.** Seven
of eight report the claim-registration tool absent from their session while the roster declares the grant.
So **not one quotation in this round has been machine-verified against its source by the resolver**, and the
round reproduced, in its own operation, the declared-versus-delivered gap it identifies as axis X16." M5
repeats it in its own `## Claims` block. **This finding is the measured instance of that stated gap** — the
thing §H predicts, located.

*Required contract:* before Step 4 consumes the candidates, run the existence-and-drift check the repository
already owns over `research/F2/**` and `planning/F2/candidates/**` — existence blocking, drift warning, per
the split posture already decided. AX-M5-03 is a second, independent instance in the same corpus that the
existence half alone would have caught.

**One methodological note against myself.** I found this by comparing figures I had already read, in one
model family, without an instrument. A drift that *both* my reading and the authors' shared would be
invisible to me by exactly the mechanism R7 F13 describes. The absence of further findings of this kind is
not evidence that there are none.

---

## X7 — cross-candidate

### Which transfers are typed end to end

| Candidate | Machine transfers typed | Continuation typed | Record layer typed | Founder-facing transfer typed |
|---|---|---|---|---|
| **M1** | Yes — `ConstraintSet` on delegation, `WorkMessage`, consultation return, subagent dispatch | **Yes**, same schema as a handoff, stated as deliberate | n/a (`FieldAuthority` is authority, not typing) | **No** — re-entry brief is prose categories |
| **M2** | Partial — carried entries typed; the `WorkOrder` transfer inherits a prose rule | Yes, via `Continuation` + manifest | **Yes** — no free-text field in any carried class | **No** — five charter sheets, one page each |
| **M3** | **Yes, at every step edge**, because every boundary is a step edge | Not applicable — work stops between steps | Journal is typed events | **Partly** — a deterministic projection, then a narrative validated field-by-field against it |
| **M4** | Yes — `WorkManifest`, the fullest field list of the five, at every transfer | **Yes**, and class-keyed: a C3 continuation resumes in consultation shape | n/a | **No** — brief contents enumerated, rendering unconstrained |
| **M5** | Yes — `Constraint` entries typed, never prose, with a discrimination step | Not applicable — the armed set is recomputed, not carried | **Yes** — eleven typed entry kinds, single-writer | **No** — brief contents enumerated |

**Only M3 types the founder-facing transfer**, and only by validating a narrative against a computation
rather than by typing the narrative. **Every candidate relies on prose at the boundary to the one reader
whose errors are uncorrelated with the family's.** R2 F-04 measured boundary-marker survival at ~0.57 under
compression and typed survival at 0 of 48 leaks; nothing in that measurement is conditioned on the receiver
being a machine. This is the single most common gap in the set and it is in the same place in all five.

### Who discloses the one-family residual most honestly

All five state the influence/error split, name the self-consistent class, and cite R7 F13. They separate on
what the disclosure *costs them*:

1. **M3** — highest. It charges itself for the instrument it leans on: "**The human anchor is an instrument
   with an unmeasured error rate.** M3 makes more use of it than any agent-based candidate … That is a real
   cost of this candidate and it is not offset by anything." It also converts R7 F9's 28.6% into a
   structural exclusion at irreversible classes rather than a caveat.
2. **M5** — declares its own central W5 mechanism class **(b)** and says "nobody has tested this", rather
   than presenting the checker-projection rule as achieved.
3. **M2** — quotes R7 §8's finding *against itself* verbatim and then withdraws the claim: "Its advantage
   over B0 is not verification." §9.1 says "**Nothing at all on F-4**."
4. **M4** — names the laundering rule explicitly ("stating the first and implying the second is the
   laundering the protocol forbids") and is the only one to give a missing clean-case control a terminal
   value of `unresolved` rather than a reporting obligation.
5. **M1** — raises the sharpest adverse question against its own central mechanism unprompted (§11 O-2, the
   shared record as a preference-leakage channel) and is the only candidate whose disclosure changes runtime
   behaviour: nothing above `C2` is accepted on same-family judgement alone during founder absence.

The ordering is between five honest disclosures. **None of the five launders it by a second name or a second
prompt, and all five refuse the same-family jury on R7 F14's stated mechanism.** Negative control 6 is
detectable in all five, by four different instruments: loader-recorded delivered inputs (M1, M2, M4), a
declared read set the loader enforces (M3), and entry-class restriction on the projection (M5).

### Shared context mechanisms present in three or more candidates

| Mechanism | In | Note |
|---|---|---|
| One authority per field, delivery narrowed per attempt — **not** one store | **all five** | The unanimous refusal of the thesis's literal reading, all citing R8 W-3 + R1 F-06 and all preserving D-03 as unresolved |
| Loader records actual delivered inputs; caller's claimed read list untrusted | **all five** | The shared answer to negative control 2 and to negative control 6 |
| Single-writer keyed state; no last-writer-wins | M1, M2, M3, M5 | All from R3 F42/F44. M4 adopts it "for the fields the derivation reads" |
| Correction = supersession + CP-142 understanding check | **all five** | All note it is untested anywhere |
| Write-path screening and provenance ranking **rejected** on R1 F-10 | M1, M2, M3, M4, M5 | Unanimous, and each cites the 0-of-360 and the recall-to-zero halves together |
| Idempotency record **on the effect**, never state in the shared record | **all five** | All cite R1's failure case rather than inventing it |
| Pre-gap model verdict is stale in the same class as a pre-gap fact | **all five** | All from R7 F7's 84→51 |
| Re-entry brief carries what was **omitted** and what was **contested** | **all five** | All from R1 F-17's hidden-profile result. The unanimity is notable: five independently formed candidates reached the same non-obvious brief contract from one finding |
| Deterministic oracle before any model checker | **all five** | R7 M1 |
| AM-01's paired clean case, same session, both rates or neither | **all five** | The amendment landed in every candidate |
| Typed constraints rather than prose at a boundary | **all five** | R2 F-04 |
| Continuation is mandatory because of the 360-second window | M1, M2, M3, M4, M5 | R2 F-18 / FAL-02 reached all five and reframed F-5 in all five |

**What the convergence means, stated narrowly.** Five candidates formed blind of each other agree on twelve
mechanisms. That is **not** twelve independent confirmations. Cross-lane's own standing caveat applies with
more force here than there: these are five readers of **one** upstream corpus, in one model family, and
where two candidates agree because they read the same finding the agreement is one observation with two
readers. The convergence is evidence that the research lanes were legible, not that the mechanisms are right.

### The gap that is in all five, in the same place

Per-input **trust level** in the context manifest, which DIRECTIVE §8.12 names:

| Candidate | Trust level |
|---|---|
| **M1** | **Present and correct** — §4.2, "with each item's **trust level** named (DIRECTIVE §8.12)" |
| **M5** | **Present and correct** — §5.1, "version, age, trust level, what was omitted, what was summarized and what may have been lost"; plus trust class on every `Fact` as an activation gate |
| **M3** | Record-level only — the `WorkRecord` carries "trust class of its origin channel"; no per-item field |
| **M2** | **Absent at every granularity** (AX-M2-04) |
| **M4** | **Absent at every granularity** (AX-M4-01) |

And the blast-radius gap: **no candidate enumerates what a false entry already influenced.** M1 (AX-M1-02),
M3 (states it against itself: "the blast radius of a false journal entry in M3 is every later step that reads
that field … the measurement that would size it is unrun") and M5 (AX-M5-01, and it has the `derived`
lineage to close it) all detect and supersede; none reopens accepted outcomes downstream. M2's Ref
indirection makes the question narrower but does not answer it; M4 concedes it directly ("a false entry in a
trusted business record defeats the derivation").

### Per-dimension verdicts

| | W3 | W5 | W14 |
|---|---|---|---|
| **M1** | sufficient | sufficient | sufficient |
| **M2** | sufficient | sufficient | sufficient |
| **M3** | sufficient | sufficient | sufficient |
| **M4** | sufficient | sufficient | sufficient |
| **M5** | sufficient | sufficient | sufficient |

**No (d)-class finding on W3, W5 or W14 against any candidate.** Every finding above is (a), (b) or (c).
No negative control among 3, 5, 6 and 9 fails against any candidate on these three dimensions: control 5
passes in all five (control 5 is about omissions, and all five carry them); control 3 passes in all five via
the known-defect control plus AM-01's pairing; control 6 is detectable in all five by a recorded-inputs
mechanism; control 9 is failed-by-design and paired in all five, with M2, M4 and M5 additionally reporting a
refusal rate on a matched benign case.

**No aggregate score, no ranking, no recommendation.** The five differ in where they are strongest on these
three dimensions and the differences do not compose into an order: M1 has the most complete manifest
specification and the sharpest self-directed W5 question; M2 has the highest citation fidelity and the only
ledger separating an evidenced problem from an unevidenced remedy; M3 has the only computed founder summary
and the only routing rule preventing a producer's run from selecting its own checker; M4 has the only
terminal-value treatment of a missing clean-case control and the fullest typed transfer schema; M5 has the
most literal §8.12 manifest, the only trust gate on activation, and the most granular ledger.

### Dissent preserved

- **On whether M4's row-7 DIRECT OBSERVATION is a defect at all.** A reader may hold that a harness-loaded
  `CLAUDE.md` is ambient context rather than a declared read, and that requiring it in a provenance header is
  pedantry. I record the finding because the label is the strongest one available and the content was
  unresolvable from the declared reads; a reviewer who weighs the other way is not wrong about the content,
  which I verified as accurate.
- **On M3's abstain threshold.** M3 classes it (c) and records in its own text that "**a reviewer could
  reasonably read it as (d)** on the ground that 'criterion' includes the threshold", and preserves the
  disagreement rather than arguing it away. I do not resolve it: it falls under W1 rather than under W3, W5
  or W14, and the lane that owns W1 should decide. Recording that M3 raised it against itself is the part
  that belongs here.
- **On whether AX-ROUND-01 should be classed (b) or dismissed.** The interval is immaterial and no
  conclusion moves. I class it (b) — a documented mechanism (citation verification) whose deployment is
  absent — rather than (a), because the fix is not an edit to five files but a check that does not currently
  run over this corpus. A reviewer who classes it (a) and edits the five files has fixed the instance and
  not the instrument.

---

*End of report. Findings: AX-M1-01, AX-M1-02, AX-M1-03, AX-M2-01, AX-M2-02, AX-M2-03, AX-M2-04, AX-M3-01,
AX-M4-01, AX-M4-02, AX-M5-01, AX-M5-02, AX-M5-03, AX-ROUND-01. Fourteen findings: two (a), nine (b), three
(c), zero (d). Standing caveat: specified behaviour checked offline, one model family, procedural
independence only.*
