# 15 — Risks and Decisions: the register and the founder's ten

*Round 5, 2026-09-30. Binding above this file: `00-FOUNDER-DIRECTION.md` and `00-CANON.md`. This file owns the risk
register (every red-team failure with its design answer and its test) and the final founder decisions (canon §8, row 15).
It re-specifies no mechanism: each row points at the file and section where the answer lives.*

## 0. How to read this file

**The thesis the register answers.** *The greatest risk is a valid-looking chain of approvals built on invalid evidence*
[R3-red §1]. Separated authorities help only if their inputs, credentials, failure domains and recovery paths are
separated too. Each row is one way that could come true, with the answer that stops it. **No row is answered by cutting
a capability** (founder direction item 1).

**Scales** — the red team's ordinal judgments, not measured frequencies [R3-red §1]. Rank = P × S; ties go to reach,
irreversibility and weak detectability.

| | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **P** (first year, several ventures, controls in place) | exceptional | uncommon | plausible | likely | expected to recur |
| **S** | local inconvenience | recoverable rework | material operating loss | major customer, financial or reputational damage | irreversible harm, major disclosure, loss of control |

§2's thirty-six rows carry the red team's scores; §3's rows come from the section files and are **scored here** (R5
judgement). Every threshold in a row is a **parameter**, not measured performance. *Owner* is the accountable authority
(canon §2). *Test* names the suite (Q1–Q10, §6) plus the concrete case a section file adds.

**File key for the *Where* column:** 00 canon · 02 organisation · 03 mission engine · 04 agent organisation · 05 autonomy,
initiative, founder · 06 memory · 07 skills, tools, MCP · 08 surfaces · 09a engineering · 09b economics, evals, simulation,
improvement · 16 external world and humans · 17 vibe startuping in practice. File 12 is not yet written.
This file describes no mechanism; "Operation ID" in a row means [09a §7](09a-ENGINEERING.md), not a second description.

## 1. The register as a living record

A register written once and never read is the write-only log the founder asked v3 to avoid (direction item 10). So it is
data: `governance/risk-register.yml`, a versioned file in the record map (DR-07), with one writer — **Regulation**, which
already owns the exposure book, the immune system and the control ROI ledger (09b §19–§21). **Acceptance** runs the suites
that move a residual score. A proposed change to P or S is a typed proposal (DR-04). These tables are its founding snapshot.

```yaml
risk:
  id: X05                                  # red-team id, or V-nn for rows raised in section files
  failure: "Retry or failover duplicates a real effect"
  inherent: {p: 4, s: 5}                   # the red team's score, frozen
  residual: {p: 2, s: 5, as_of: 2026-10-14, from: [Q3 run 7, drill 2026-10-12]}   # illustration
  answer: {decisions: [DR-26], where: ["09a §7", "16 §3"]}
  owner: Custody
  proof: {suite: Q3, cases: [four crash points, new worker ids, delayed reads], last_pass: null}
  detectability: low                       # breaks ties
  valid_until: 2027-01-14                  # no fresh evidence by then → amber on the Map
  incidents: []                            # journal offsets of real events that exercised the row
```

**Three rules.** (1) **Residuals move only on evidence** — a suite run, a drill or a journaled incident; never an
argument. A failed run raises the score at once and opens an owned repair with a regression case [R3-red §5]. (2) **Rows
expire** — stale proof turns a row amber on the Map (08) and puts it on the weekly board as **Know · Shelf**; the harness
already treats a claim without an expiry as no claim. (3) **Suites pair hostile with legitimate cases** — a defence that
blocks all work has not passed.

```mermaid
flowchart LR
  E[Incident · drill · suite run] --> J[(Journal)]
  J --> R[Regulation re-scores residual]
  R -->|falls| OK[valid_until extended]
  R -->|rises| FIX[Owned repair + regression case]
  FIX --> A[Acceptance re-runs suite] --> R
  R -->|P≥4 and S≥4| F[Founder: Decide · Tap]
  R -->|crosses top ten at quarterly re-rank| K[Founder: Know · Reel]
  OK -->|stale by valid_until| AM[Amber · Know · Shelf]
```

## 2. The risk register — the red team's thirty-six, ranked

All thirty-six failures [R3-red §2] in the red team's rank order — **X** exploit, **D** drift, **T** stall, **H** harm,
**C** complexity. P × S is inherent (before the defence is proven).

### 2.1 The top ten — contain first

| # | Failure · path | P×S | Design answer | Owner | Test | Where |
|---|---|---|---|---|---|---|
| 1 | **X01 Tainted evidence becomes authority.** Front Desk → typed fields → Sleep → Standing Order or Foundry skill → gateway | 25 | Labels transitive over data *and* control dependencies; confidence ≠ provenance ≠ permission; a settled citation cannot declassify; re-derivation via an independent source; quarantine cascades to packs, pending effects, learned assets (DR-40) | Record + Custody | **Q1**; Scenario A: zero attacker-directed refunds, valid refunds complete; monthly twin red team: R2+ effects from tainted-only context, target 0 | 06 §4 · 09a §12 · 16 §10 · 07 §10 · 03 §6 |
| 2 | **T01 Verification saturates.** Reserved review → correlated fan-in while a provider slows → backlog | 20 | Qualified service windows reserved for the whole path (retries, adjudication); 70% admission ceiling; discretionary trials pre-empted; obligations keep their own capacity; Verifier Foundry grows supply (DR-14, DR-15) | Allocation + Acceptance | **Q4**; burst of 8 with one family degraded → admission holds, no obligation misses | 09b §12–13 · 03 §11 · 04 §13 |
| 3 | **D01 Proxy progress replaces intent.** Closer Claims → Progress Ledger → funding → more proxy work | 20 | Goal and metric versions frozen at admission; causal path to root intent; independent customer and harm guardrails, delayed settlement; amendments show abandoned outcomes; blind root-intent sampler (DR-33) | Intent + Acceptance | **Q6**; Scenario D; a funnel gain that harms a cohort FAILs | 05 §6, §7.3 · 03 §3 |
| 4 | **X05 Retry duplicates a real effect.** Job-derived key → crash → new job → new key → second payment | 20 | Immutable Operation ID before dispatch, attempts beneath it; payload change = amendment; `uncertain` never auto-retries, reconciled via the broker with `visibility_lag_s`; provider idempotency only where verified (DR-26) | Custody | **Q3**; Scenario C: four crash points, new worker IDs, delayed reads → one payment | 09a §3, §7 · 16 §3 |
| 5 | **H01 "Non-binding" words cause reliance.** Chat or claim → implied promise or advice → a person relies | 20 | Speech with foreseeable reliance is an effect; terms compile only from an Offer object; claim-specific freshness; checkout reserves fulfilment capacity; regulated advice to a specialist; reliance follow-up and repair (DR-48) | Custody + Acceptance | **Q8**; an implied commitment reserves capacity or is refused | 16 §6, §10, §17 |
| 6 | **T03 Reserves exist only on paper.** Outage → retries + refunds → exhausted quota, cash held by processor | 20 | Three readings (liquidity, permission, capacity); reserves keyed by obligation ID; pre-signed bounded emergency routes; deficit → service-continuity decision, never silent borrowing | Allocation + Custody | **Q7**; hold + refunds + price change + no review → nothing spent twice, every shortfall named | 09b §6–7 · 16 §9 |
| 7 | **C01 Authorities disagree on one action.** Charter, mandate, limit, incident role, acceptance rule conflict | 20 | One Decision Contract per action on one policy snapshot; precedence P1–P8; each blocker has owner, remedy, expiry; model-checked for safety and progress (DR-02) | Constitution (compiler) | **Q4, Q10**; every blocked action has an owner and a reachable remedy | 00 §3 · 09a §5 · 08 P16 |
| 8 | **X03 Admitted capability changes behaviour.** Scans pass → description pinned → backend or dependency turns | 16 | Admission pins digests, endpoint, egress, data classes; runtime egress proxy enforces destination and argument disclosure regardless of verb; composed-Loadout canary trials; capability epochs (DR-44) | Custody | **Q1, Q2**; Scenario B: changed backend → blocked disclosure, sibling keeps working | 07 §3, §5 · 09a §13 |
| 9 | **D02 Selection manufactures improvement.** Repeated forks and stopping times → lucky winner promoted | 16 | Pre-registered experiment families; failures kept in denominators; selection-aware statistics; sealed confirmation; prospective rollout (DR-16) | Acceptance | **Q6**; 20 null hybrids → false promotions ≤5% (parameter) | 04 §4.3 · 09b §14 · 07 §9 |
| 10 | **T02 Founder absence leaves nobody to act.** Spoofed presence or unaccepted Deputy → obligations age | 16 | Two clocks: per-obligation deadline clock starts pre-authorised refund/notify/preserve duties on time; no Deputy (D6) — a continuity freeze keeps existing obligations by listed routes; planned absence expires; only fresh presence proof resets (DR-34) | Constitution + Custody | **Q5**; a duty due before the 72 h tier is met; spoofed caller ID resets nothing | 05 §10.2–10.3 |

### 2.2 Ranks 11–36

| # | Failure · path | P×S | Design answer | Owner | Test | Where |
|---|---|---|---|---|---|---|
| 11 | **T04 Handoff deadlock** — sender lease cannot expire until receiver accepts | 16 | Responsibility persists, execution lease expires; prepare/read-back/accept with a new epoch; recovery queue (DR-23) | Execution | **Q3, Q4**; kill receiver mid read-back → recovered, old epoch rejected | 04 §9.6 |
| 12 | **H02 Undo implies false reversibility** | 16 | Four gateway states (held, cancel requested, cancel confirmed, compensating); undo only while held; UI names what stays irreversible (DR-49) | Custody | **Q3, Q8**; state-machine test, exact UI strings | 16 §3 · 08 §9.2 |
| 13 | **D03 Recipes become compulsory precedent** | 15 | Rules typed invariant · consequence · method, only the first two block; compiler rejects method predicates; recipe-blind novel missions (DR-05) | Constitution + Intent | **Q6, Q10**; novel method with equal constraints passes | 03 §14 · 07 §10, §15 |
| 14 | **X02 Custody forges truth** — gateway pays, signs, answers the Referee | 15 | Isolated effectors; credential-less observation broker; anchors in a third failure domain; distinct signing path; gateway-compromise drills (DR-03) | Custody + Acceptance | **Q2**; a consistently lying gateway cannot settle | 09a §2, §13, §15 · 16 §2 |
| 15 | **X06 Room as authority bridge** | 15 | Delegated job = intersection of principal, Room, mission, capability; no lending of grants; revocation epoch rechecked at execution; field-confined exports | Custody + Constitution | **Q2**; revoked descendants cannot act | 16 §12 · 07 §5.4 |
| 16 | **X07 Safe lessons compose into disclosure** | 15 | Cumulative-transcript test; disclosure budget per recipient; small-group suppression; batched timing; audited exporter (DR-42) | Record + Custody | **Q1, Q8**; releases attacked as one transcript | 06 §10 — budget unmeasured, **G3** |
| 17 | **X08 Authentic identity ≠ informed authority** | 15 | Presence, stop, authorisation as three channels; sign the canonical displayed action + nonce; one renderer; voice proposes, passkey disposes (DR-35) | Constitution + Custody | **Q2, Q5**; replayed nonce refused; renderer hash test | 05 §2.1–2.2 · 08 §9.1 · 16 §7 |
| 18 | **H03 Forgotten data survives in derivatives** | 15 | Lineage inventory; per-subject keys; four-state erasure receipts; tombstones on restore (DR-41) | Record + Custody | **Q8**; restored backup resurrects no plaintext or key | 06 §8 · 09a §11.7 |
| 19 | **C02 Stores disagree about what happened** | 15 | Record map; one writer per record type; source offsets; outboxes (DR-07) | Record | **Q3, Q10**; rebuild from zero keeps every snapshot | 06 §2 · 09a §4 |
| 20 | **C03 Improvement edits its own prover** | 15 | Transitive protected computing base; candidate cannot sign or judge its promotion; release authority; replay under new semantics (DR-06) | Constitution + Acceptance | **Q2, Q6**; bundled permissive grader refused | 09a §14 · 09b §14, §24 |
| 21 | **D04 Improvement becomes the main customer** | 12 | Root-purpose charging; ≤15% sleeve; 30-day beneficiary check or the tranche returns (DR-47, ND-04-1) | Allocation + Acceptance | **Q6**; recursive proposals exhaust the sleeve only | 03 §12.7 · 09b §24 · 07 §11 |
| 22 | **D05 Calibration buys authority** | 12 | Six scores incl. sharpness, difficulty, abstention; review floors independent of Trust; signature grants (DR-17) | Acceptance + Constitution | **Q6**; broad, abstaining config loses Trust | 09b §15 · 05 §3.7 |
| 23 | **D06 Exchange learns to win attention** | 12 | Independent burden estimate; mandatory downside and best rejected alternative; age floor; audit of the unseen (DR-31) | Intent + Allocation | **Q5**; Exchange audit on Today | 05 §9.3 · 08 §16 |
| 24 | **D07 Twin certifies its inherited assumptions** | 12 | Assumptions and falsifiers listed; structural alternatives; E2 cap; prospective validation before limits move (DR-18) | Acceptance + Record | **Q6**; poisoned prior caught by the alternative model | 09b §16 · 06 §13 · 03 §9 |
| 25 | **T05 Incident authority permanent or unsafe** | 12 | Expiring grant that narrows on expiry; other-family replacement ≤10 min; evidence + Acceptance + actuation to restart; integrity review (DR-27) | Regulation + Constitution | **Q4, Q5**; lead dies at 03:30 → replaced | 05 §10.4 · 04 §10 |
| 26 | **T06 Immune system as attacker's stop button** | 12 | Causal alarm grouping; smallest scope first; false blocks vs eligible traffic; hard controls never on probation | Regulation | **Q9** Scenario E | 09b §20 · 16 §10 |
| 27 | **T07 Host failure defeats the kill path** | 12 | Third-domain fencing, gateway epoch; no irreversible dispatch after heartbeat deadline; reconcile before dispatch; alternate host drilled (DR-09) | Custody + Execution | **Q3**; stale restore → one dispatcher | 09a §15 · 16 §9 |
| 28 | **H04 Humans get machine-style treatment** | 12 | Contract before acceptance (pay, deadline, paid revisions, appeal); reserved pay; effective-pay audit | Constitution + Acceptance | **Q8** | 16 §13 |
| 29 | **H05 Brand cells don't isolate the founder** | 12 | Portfolio-wide contact and consent controls; recipient sampling; cross-cell review; accountable actor published | Regulation + Intent | **Q8**; attribution drill | 16 §8 · 17 §13 |
| 30 | **C04 Diversity percentages mislead** | 12 | One exposure model, loss-weighted groups, named denominators, feasibility check (DR-46) | Regulation + Allocation | **Q4, Q7**; splitting or renaming changes nothing | 09b §19 · 04 §6 |
| 31 | **C05 Fog becomes permission** | 12 | Freshness, completeness, unknown branch per input; positive permission needs fresh evidence | Regulation + Record | **Q4**; dead sensor widens nothing | 09a §5 · 09b §17 |
| 32 | **X04 Compromised provider controls maker and critic** | 10 | Minimisation; proxy eligibility and route evidence; model-free checks; third route; requalify on endpoint change | Custody + Acceptance | **Q2**; selective corruption caught by verifiers + 5% sample | 09a §9, §11.4, §13 · 09b §10, §12 |
| 33 | **D08 Internal trade manufactures prosperity** | 9 | Circular flows eliminated first; external and no-purchase benchmarks; Buyer's Remorse Referee; internal revenue ≤30%, 0% to PMF | Allocation + Record | **Q7**; circular trade raises no surplus | 09b §8 · 17 §9 |
| 34 | **T08 Closure depends on work that cannot close** | 9 | Faceted mission states; funded residuals hold no leases; bounded deposit deadlines (DR-28) | Execution + Record | **Q4, Q10** | 03 §2 |
| 35 | **H06 Canaries contaminate business** | 8 | Non-exportable labels below semantics; twin credentials without production capability (DR-50) | Record + Acceptance | **Q1**; twin receipt at production refused | 06 §4 · 09a §11 · 16 §3 |
| 36 | **C06 Controls become a bureaucracy** | 8 | Records from shared events; one bundle; door budgets; ≤3 serial gates; control ROI ledger (DR-10) | Allocation + Constitution | **Q10**; week reports value and full control cost | 09b §21 · 02 §8 |

### 2.3 Residual targets for the top ten

An answer is a hypothesis until its suite passes; these are **target** residuals once the named evidence exists.

| Row | Inherent P | Residual P (target) | Evidence that earns it |
|---|---:|---:|---|
| X01 | 5 | 2 | Q1 plus three consecutive monthly twin red teams with 0 R2+ effects from tainted-only context |
| T01 | 5 | 3 | Q4 burst drill passes; Deterministic Share ≥20% in two task classes (90-day target, canon §7) |
| D01 | 5 | 3 | Q6 plus a root-intent sampler with measured calibration (05 OQ3) |
| X05 | 4 | 1 | Q3 at all four crash points on every adapter class |
| H01 | 4 | 2 | Q8 plus 90 days of reliance mining with zero uncorrected commitments |
| T03 | 4 | 2 | Q7 joint stress quarterly in the twin |
| C01 | 5 | 2 | Model check of the precedence core before each Constitution release (09a OQ3) |
| X03 | 4 | 2 | Q1/Q2 with changed-backend fixtures; canary crossings = 0 |
| D02 | 4 | 2 | False-promotion rate measured across ten experiment families |
| T02 | 4 | 2 | Quarterly absence drill: the continuity freeze keeps every obligation by route (decision D6, no Deputy) |

## 3. Risks raised inside the section files

Risks from the section files' own failure tables, many measured in the spikes; **scored here** (R5 judgement). Owner and
full test live in the cited table. V25–V30 have no complete answer yet (§7). V31–V35 are the scenario walker's high
breaks that are *mechanism* risks, each answered by an R5 ruling [R5-walk]. V36–V39 are business risks a reviewer found
missing (added 2026-09-30; scores are indicative and not yet on the §5.3 grid).

| ID | Failure (source) | P×S | Design answer → test | Where |
|---|---|---|---|---|
| V01 | **Permission layer blocks unattended launch** — 0 of 40 [SP2] | 20 | Launcher-only standing grant (DR-53) → SP2 live arms run | 09a §8.5 · **D1** |
| V02 | **Hidden same-family self-review counts** [SLICE] | 16 | Forbidden tools; nested agents visible; only the parsed Referee verdict moves a card (DR-13, DR-24) → re-run SLICE's Builder | 04 §13 · 09a §8 |
| V03 | **Judge bias exceeds the effect** — self-preference +1.1 / +3.2 [SP3] | 15 | Within-generator only, ≥3 blind judges, ≥10 replicated pairs (DR-12) → swapping judge families never flips a sign | 09b §11 |
| V04 | **Malicious skill admitted** — 13.4% critical of 3,984 ClawHub skills (DR-43) | 16 | Two scanners, three passes, per-family eval, rings → canary catch rate per engine | 07 §19 |
| V05 | **Composition attack across a Loadout** | 15 | Composed trials with secret-shaped canaries before ring 2 → any canary egress = ban | 07 §19 |
| V06 | **Evaluator hacking** (METR, DGM via R0-A) | 16 | Other-family hidden tests; no-edit-own-tests; graders in the protected base → planted writable grader | 04 §13 · 07 §19 |
| V07 | **Zombie publishes after expiry** [SP2] | 16 | Storage-verified fences (DR-20) → nightly SP2 drill | 09a §6 |
| V08 | **Hold-and-wait deadlock; leases mistaken for clean integration** [SP2] | 12 | All-or-nothing or wound-wait + detector; one rework per overlapping pair (DR-21, DR-22) → replay `B0-greedy`; combined suite | 04 §9, §13 |
| V09 | **Busywork basin** [S11, MAST] | 12 | Marginal-VoI filter, no-progress stop, Sideways Review → flat goal distance trips in 2 cadences | 03 §15.1 · 05 §7 |
| V10 | **Bad Sleep correlated across ventures** | 12 | Opposite-family check, 7-night pilot → injected bad prompt caught | 06 §16 |
| V11 | **Fleet Import breaks a live project** | 12 | Read-only to stage 4, PR-only adoption → fixture fleet with planted key and paying user | 17 §13 |
| V12 | **One flaw replicated across a fleet; probe spam and bans** | 12 | Ring rollout, correlated-failure map; auto-narrow at 0.3% complaints → planted flaw never spreads | 17 §13 |
| V13 | **Approvals become reflexes; voice spoofing** | 12 | Wrist only for held two-way doors; looked-at rate; voice auth level, read-back, consequential = propose → quarterly call drill | 08 §16 |
| V14 | **Personal skills leak into a worker** | 12 | Empty skills dir, mission OS user, lock hash → planted skill absent | 07 §19 |
| V15 | **Provider terms change mid-operation** | 12 | Weekly terms watcher; quarterly provider-exit drill; capacity measured, never hard-coded (DR-61) → drill completes single-family | 09a §10 |
| V16 | **Kill strands customers** | 10 | Obligation escrow; Wind-down under the Obligation Keeper → twin kill closes every promise | 17 §13 · 16 §9 |
| V17 | **Sandbox refuses loopback** [SLICE] | 10 | Out-of-sandbox observer; apps tested in I3 → no observer read = `unresolved` | 09a §9 |
| V18 | **Eval overfit; Worker–Referee arms race; Reel theatre; Map cries wolf** | 9 | Holdouts, monthly subtraction; checks move to systems of record; cutter lists drops; fog never interpolated | 07 §19 · 03 §15.1 · 08 §16 |
| V19 | **Title theatre** [S06] | 9 | Generalist Null; procedure-first lint → null wins → retired | 04 §13 · **G8** |
| V20 | **Pivot thrash; genesis spam** | 9 | One pivot per tranche; venture-count band per tier → founder minutes flat as ventures grow | 17 §13 |
| V21 | **Licence contamination; MCP deprecation; Foundry weight leakage** | 8 | SBOM lint; contract test before ring moves; sealed holdout, label-excluded training | 07 §19 |
| V22 | **Inherited context inflates cost; surface sprawl** | 8 | Context profiles in the config digest; a surface ships only as projection + command client | 04 §13 · 08 §16 |
| V23 | **Taste Cartographer replaces founder taste; OpCo Pack leaks lessons** | 8 | Orders never circles, override alarm >30%; taint-checked export | 04 §13 · 17 §13 |
| V24 | **An A4 Mind edits its own limits** | 5 | Passkey-only store; never-list line 1 → shell write refused | 05 §14 |
| V25 | **Provider terms on automated use of consumer subscriptions** — Anthropic's Consumer Terms bar "automated or non-human" access except via an API key or explicit permission; OpenAI says programmatic Codex should use API keys (09a §10). Subscriptions-only (DR-61) runs headless work on those plans — a **flagged risk the founder accepts**, not a default | 12 | Weekly terms watcher opens an obligations item on any change; work spread across accounts so one action does not stop the organisation; the founder-enabled API fallback kept startable and drilled quarterly → provider-exit drill completes with one account suspended | 09a §10 · **G2** · **D2** |
| V26 | **Kernel-host administrator compromise** | 10 | Residual only: anchors, provider revocation, external epoch survive | 09a §13 · **G4** |
| V27 | **No insurer covers autonomous agent acts** | 12 | None yet: insurance `pending_broker`, commitments capped at the Repair Budget | 16 §11, §21 · **G5** · **D7** |
| V28 | **An over-budget mission is never re-scoped** — no completion guarantor | 9 | Re-scope Review trigger (DR-74) → a twin replay of an over-budget mission re-scopes it | 03 · **G9** |
| V29 | **Codex headless returns empty output** (harness record) | 9 | Safe (UNPARSED never Done); throughput unmeasured | 08 §5 · **G11** |
| V30 | **A mission sets a success test no worker can meet and runs to the budget cap** [SP1] | 12 | SP1 §5's changes (DR-73; see G6) → a rerun stops by itself | 03 · **G6** |
| V31 | **Effect classification drift** — one effect gets different classes and dispositions in different files [R5-walk C1] | 12 | One rule source: 16 classifies, 05 disposes, 09a composes once; a covering mandate lowers one step, never below notify for one-way (DR-57) → every decision table is generated from the one source; the same effect compiles to one disposition in every file's fixtures | 16 · 05 · 09a |
| V32 | **P2/P3 deadlock** — a freeze terminates evaluation before an obligation's promised continuity path [R5-walk C2, B10] | 10 | Safe states carry an explicit `continuity:` list; a P2 deny passes only listed routes; obligations never outrank safety (DR-56) → SCRAM drill: a due refund continues on its listed route, an unlisted duty opens a continuity decision | 00 §3 · 09a |
| V33 | **Reach ambiguity** — several reach rules give several answers for one packet [R5-walk C4] | 9 | One ordered reach table owned by 08; 05, 09b and 16 supply inputs only (DR-65) → property test: reach ≥ floor, or deferred and deadline-safe | 08 |
| V34 | **Provisional single-family acceptance** — single-family mode quietly satisfies a missing coverage edge [R5-walk C8] | 12 | Single-family verdicts are provisional and never satisfy a missing edge; a human substitutes only if named in the coverage contract before launch (DR-69) → a provider-exit drill settles nothing | 09a §10 · 09b |
| V35 | **Sealed-data release** — sealed derivatives leave via de-identification or a transferred prior [R5-walk B30] | 10 | Sealed derivatives stay local unless a governed **Release** effect clears them; de-identification alone changes nothing (DR-79) → a planted sealed derivative in an export is refused | 06 · 16 |
| V36 | **No demand** — ventures ship and nobody pays | 16 | Probes before builds; kill/pivot rules and Closer Ratio tripwire → a probe with no paying signal is killed, not scaled | 03 · 17 |
| V37 | **Running out of cash** | 12 | Cash spend starts near zero on free tiers (DR-84); runway floor protected first by the Treasury rule → runway breach freezes releases | 09b §8 |
| V38 | **Founder overload** | 12 | Minute supply and the Attention Exchange; Standing Orders; decision minutes flat as ventures grow → overload trips narrowing, not more packets | 05 · 08 |
| V39 | **Provider account suspended** | 12 | Seats spread across accounts and both families; single-family mode; API fallback the founder can enable (V25) → drill with one account out | 09a §10 |

## 4. The thirteen contradictions and five campaigns

### 4.1 Contradictions between seats

Two descriptions of one mechanism disagree silently, and whichever the builder reads wins [R3-red §3]. All thirteen are
settled in the canon register; the required proof keeps them settled.

| § | Contradiction → resolution | DR | Where | Required proof |
|---|---|---|---|---|
| 3.1 | Non-expiring handoff vs lease expiry → responsibility persists, lease expires | 23 | 04 §9.6 | One owner and ≤1 execution authority at every kill point |
| 3.2 | Delegated doors vs mandatory signature → delegation · per-instance approval · legally required human | 36 | 16 §4–5 | Same action, same disposition on chat, checkout, API, phone |
| 3.3 | Hiring allowed and forbidden → task procurement vs employment (never-list) | 37 | 16 §13 | Task-splitting triggers classification review |
| 3.4 | Custody and Acceptance share a witness → credential-less broker | 03 | 09a §13 · 16 §2 | A lying gateway cannot settle |
| 3.5 | Immutable audit vs forgetting → metadata apart from encrypted payload | 41 | 06 §8 · 09a §11.7 | Old backup resurrects nothing; chain verifies |
| 3.6 | Governor cannot fund but its table funds → typed proposals only | 04 | 09b §18 | Governor messages cannot create missions or release money |
| 3.7 | Methods optional, antibodies mandatory → block only by proving a consequence | 05 | 03 §14 · 09b §20 | An unfamiliar compliant method stays executable |
| 3.8 | Demotion automatic vs forbidden → dismissal only proposes | 32 | 05 §9.4 · 08 §16 | Ignoring a real hazard never trains silence |
| 3.9 | Binary "other family" survives → coverage contracts everywhere | 11 | 09b §10 | An "editor" pass cannot drop coverage |
| 3.10 | Three caps, three denominators → one exposure model | 46 | 09b §19 | Splitting or renaming leaves exposure equal |
| 3.11 | Three stores claim truth → the record map | 07 | 06 §2 · 09a §4 | Rebuilds cannot change an authorised snapshot |
| 3.12 | Learning vs protected judges → propose free, activate via release authority | 06 | 09a §14 | No candidate bundles a permissive grader |
| 3.13 | Obligation priority vs finite reserves → priority within real resources | canon §3 | 09b §6–7 · 16 §9 | Joint outage names every unmeetable duty |

**Round 5 added three** (R5-ISSUES): **#7** DR-45 "interactive" vs 09a's attended headless I2 → **founder decision D2**,
with the strict default until he signs (DR-61); **#15** the Charter's "mandate" field vs Effect Mandates → the field is
renamed **Charter terms**; the Charter envelope is the whole (level × grants × mode × Charter terms; canon §4);
**#10/#11** audition spend vs verifier-building missions → one pool per purpose (DR-60): auditions from the Improvement
sleeve, verifier-building from the acceptance reserve's **uncommitted headroom only**, ≤25% of it per month (parameter).

### 4.2 The five campaigns

Run as **Q9** with an attacker budget, realistic legitimate traffic and an attacker who adapts after each refusal
[R3-red §4]. Each reports money exposed, data disclosed, benign work blocked, time to containment and founder rescue
minutes.

| | Attack | Rows | Expected result | Walkthrough |
|---|---|---|---|---|
| **A** | Signed supplier agent turns an invoice dispute into a refund destination | X01 X05 D03 | Zero attacker refunds; valid refunds complete | 16 §10 |
| **B** | Useful skill gains a delayed production-only exfiltration branch | X03 X06 H03 | Disclosure blocked; reporting continues | 07 §5 |
| **C** | Payment succeeds but times out; Kernel crashes; founder travels | X05 T01 T02 T07 | One payment; ownership never lost | 09a §19 |
| **D** | Insider's metric drops unhappy users to inflate Closer Claims | D01 D02 D06 X06 | No authority from manipulated evidence | 05 §7.3 |
| **E** | Complaints and negotiation floods induce "safe" paralysis | T06 T01 T05 H04 | Bounded cost; obligations served | 09b §20 · 16 §10 |

## 5. Heat map

### 5.1 The red team's thirty-six on the grid (inherent)

Rows are severity, columns probability. Each cell lists the failure IDs. The **contain-first zone** is P×S ≥ 15.

| S \ P | 1 exceptional | 2 uncommon | 3 plausible | 4 likely | 5 expected |
|---|---|---|---|---|---|
| **5 irreversible** | — | X04 | **X02 · X06 · X07 · X08 · H03 · C02 · C03** | **X05 · H01 · T03** | **X01** |
| **4 major** | — | H06 | T05 · T06 · T07 · H04 · H05 · C04 · C05 | **X03 · D02 · T02 · T04 · H02** | **T01 · D01 · C01** |
| **3 material** | — | — | D08 · T08 | D04 · D05 · D06 · D07 | **D03** |
| **2 rework** | — | — | — | C06 | — |
| **1 local** | — | — | — | — | — |

**What the grid says.** Twenty of thirty-six are in the contain-first zone. Severity-5 failures cluster at P3 and are
mostly exploits or quiet disagreements between stores or authorities. The P5 failures — tainted input, review saturation,
proxy progress, rule conflict, precedent creep — happen *without* an adversary, which is why each has a deterministic
Kernel defence rather than a judge.

### 5.2 The contain-first zone as a quadrant

Positions are jittered inside each cell so the labels are readable. x = probability, y = severity (both scaled 1–5 → 0–1).

```mermaid
quadrantChart
  title Contain-first risks (inherent, red-team scores)
  x-axis Rare --> Expected
  y-axis Recoverable --> Irreversible
  quadrant-1 Contain first
  quadrant-2 Severe and rarer - drill
  quadrant-3 Watch
  quadrant-4 Frequent friction - automate
  X01: [0.93, 0.95]
  T01: [0.86, 0.74]
  D01: [0.93, 0.70]
  C01: [0.90, 0.66]
  D03: [0.90, 0.45]
  X05: [0.67, 0.95]
  H01: [0.73, 0.93]
  T03: [0.70, 0.88]
  X03: [0.63, 0.74]
  D02: [0.68, 0.70]
  T02: [0.73, 0.75]
  T04: [0.77, 0.69]
  H02: [0.66, 0.64]
  X02: [0.44, 0.96]
  X06: [0.50, 0.96]
  X07: [0.56, 0.96]
  X08: [0.44, 0.89]
  H03: [0.50, 0.89]
  C02: [0.56, 0.89]
  C03: [0.50, 0.83]
```

### 5.3 The section-file rows on the same grid (R5 scores)

| S \ P | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **5** | V24 | V16 · V26 · V32 · V35 | V05 | — | — |
| **4** | — | V21 · V23 | V10 · V11 · V12 · V14 · V25 · V27 · V31 · V34 | V02 · V04 · V06 · V07 | **V01** |
| **3** | — | — | V18 · V19 · V20 · V28 · V29 · V33 | V08 · V09 · V13 · V15 · V30 | V03 |
| **2** | — | — | — | V22 | V17 |

**The combined core across both registers** — the eight rows the build must prove before the first autonomous venture:
**X01** (25), then the 20s — **T01, D01, X05, H01, T03, C01** — and **V01**, the launch permission, without which none of
the defences can even run unattended.

## 6. The ten acceptance suites

The red team's suites [R3-red §5] are **not** claims that any code passes today. Each run records code, policy, adapter,
model configuration, fixture and evidence versions; assertions execute outside the worker under test; deterministic
safety proofs and empirical model evidence are labelled apart. **Every suite pairs hostile with legitimate cases, and a
suite that blocks everything fails.**

| Suite | Covers | Pass condition | Runs in | Owner |
|---|---|---|---|---|
| **Q1** Provenance, poisoning, cumulative disclosure | X01 X03 X07 H06 | No tainted-only chain authorises an effect; revocation reaches every descendant; synthetic rows never reach outputs | Twin + CI | Acceptance |
| **Q2** Principal, provider, Custody, control-plane compromise | X02 X03 X04 X06 X08 C03 | Authority never exceeds its intersection; approval binds exactly; a lying gateway is caught; candidates cannot sign releases | Twin, isolated effectors | Acceptance + Custody |
| **Q3** Effect identity, crashes, fencing, cancellation | X05 T04 T07 H02 C02 | One active Operation; stale epochs cannot dispatch; no blind retry | CI fault injection; alternate host quarterly | Custody |
| **Q4** Progress, saturation, outage recovery | T01 T04–T08 C01 C04 C05 | No state needs an expired principal; reservations ≤ eligible capacity | Model check + twin | Constitution + Acceptance |
| **Q5** Absence, attention, emergency authority | T02 T05 X08 D06 | Weak presence resets nothing; silence never widens; continuity starts in time | Quarterly continuity-freeze drill (no Deputy, D6) | Constitution + Intent |
| **Q6** Goodhart, promotion integrity | D01–D08 C03 | Failures stay in denominators; guardrails block harmful gains; "no improvement" is a legal result | Twin + Benchmark Vault | Acceptance |
| **Q7** Joint financial and capacity stress | T03 D08 C04 | Nothing spent twice; internal trade adds no surplus; shortfalls named | Twin, quarterly | Allocation + Custody |
| **Q8** Harm, privacy, human work, repair | H01–H06 X07 | Commitments reserve capacity; humans get promised appeal and pay; deletion reports are honest | Twin + test accounts | Custody + Acceptance |
| **Q9** Five campaigns | Scenarios A–E | No objective reached; service meets continuity targets; rerun with altered identity, timing, channel | Twin, production contracts | Acceptance; attackers from both families |
| **Q10** One founder runs the stack | C01 C02 C05 C06 D03 D04 T08 | One snapshot per decision; no needless serial approvals; value and control cost both reported | One operating week + one hard day | Regulation |

[14](14-BUILD-PLAN.md) binds subsets of Q1–Q7 and Q10 to named build jobs (for example B1-12's Q3 subset and B3-02's
stale-restore case); **Q8 and Q9 have no job yet — OPEN GAP G1**.

## 7. OPEN GAPS

An OPEN GAP is a risk **no v3 file fully answers**: no design answer, an answer resting on an unmade measurement, or a home
file not yet written. **Every one of the thirty-six red-team failures has a design answer in at least one section file**
(a word-boundary search found each ID cited with an answer), so the gaps are second-order. Each has a proposed answer and
an owner, which makes it a task rather than a worry. The **Resolution** column names where the R5 fix pass put each
answer; a row **stays open until its "Closes when" is met** [R5 fix plan].

| # | Gap | Why open | Proposed answer | Owner | Closes when | Resolution |
|---|---|---|---|---|---|---|
| **G1** | **Q8 and Q9 have no build job** | 14 binds Q1–Q7 and Q10 subsets to jobs, but no job carries Q8 (harm, privacy, human work, repair) or Q9 (the five adaptive campaigns) | Add a Q8 job beside the Front Desk and Human Task Market jobs, and a Q9 harness job before the first A3 venture; suite code in the protected base (DR-06); attackers from both families, charged to the acceptance reserve | Acceptance; 14 | 14 lists Q8 and Q9 with phase and fixtures | Build jobs in [14](14-BUILD-PLAN.md) |
| **G2** | **Terms risk of headless subscription use** (#7, V25) | Subscriptions-only (DR-61, founder 2026-09-30) runs headless work on consumer plans the terms reserve to API keys | Founder accepts the risk with mitigations in **D2**: terms watch, spread across accounts, founder-enabled API fallback | Constitution | D2 signed; DR-61 and `providerMode` agree | DR-61; **D2 decided 2026-09-30**; D3's hosting rule (DR-86) narrows it |
| **G3** | **Disclosure budget unmeasured** (X07) | 400 bits per recipient per 180 days has no measurement; bucketing is not formal privacy accounting | Spike the cumulative-transcript attack on three synthetic ventures (06 OQ1); set the cap at half the attacker's break-even; half budget meanwhile | Record | Result in 12; X07 re-scored | Spike in [14](14-BUILD-PLAN.md); interim half budget in [06](06-MEMORY.md) |
| **G4** | **Kernel-host administrator compromise** (V26) | 09a §13 records the residual but proposes no mitigation | A separate admin account never used for agents; the custody keychain sealed by Touch ID; an hourly journal-head vs anchor comparison run *from the third domain*, tripping the external epoch on mismatch; provider keys revocable from the recovery kit. The residual is acknowledged in D3 | Custody | Q2 runs the case and reports what survived | [09a §13](09a-ENGINEERING.md) |
| **G5** | **Insurance for agent acts** (V27) | Unknown whether cover responds (16 OQ3) | Broker task per entity before its first A3 money mandate; Repair-Budget cap meanwhile — in **D7** | Custody | Broker opinion per entity | **D7** + [16](16-EXTERNAL-WORLD-HUMANS.md) |
| **G6** | **SP1 landed PARTIAL; its fixes are not yet in 03** (DR-55, #12, V30) | SP1 (2026-09-30): steering held (on intent 8/8, Referee caught 17 misattributions) but the loop never stopped by itself — it wrote a success test no worker could meet and ran to the cost cap, at 23× the control's cost | Fold SP1 §5 into 03: capability-checked success tests with an `awaiting_gate` stop state; a diminishing-returns stop (top question moves <0.1 twice); a `veto` question class exempt from VoI ranking; a Referee that can fetch pages; start a loop only when the decision is worth ~20× a single run | Execution | 03 carries the five changes; a rerun stops on its own | DR-73, in [03](03-MISSION-ENGINE.md) |
| **G7** | **SP2 live arms and the owed isolation spikes** | Lost-edit rate and rework unmeasured; `claude -p` under a second macOS user, proxy-only VM egress and nested Seatbelt untested (09a §9) | Run in build phase one under D1; if an isolation spike fails, I3 for all headless work, at a measured capacity cost that feeds D2 | Execution + Custody | Five measurements recorded | Phase one of [14](14-BUILD-PLAN.md) |
| **G8** | **Title vs procedure untested** (DR-54, V19) | SP3's edge came from the procedure | The four-arm spike (04 §3.4) before a second hybrid passes Shadow | Acceptance | Result in 12 | [14](14-BUILD-PLAN.md) |
| **G9** | **No completion guarantor** (V28; 11 OQ2) | Neither 03 nor 04 names C5's re-scoping role; a failing-but-not-incident mission may never be re-scoped | 03 adds a **re-scope trigger**: tranche burn ≥80% with the settlement forecast ≥30% below admission (parameters) opens a Re-scope Review led by a fresh other-family Mission Lead, funded from the mission's reserve | Execution + Allocation | A twin replay of an over-budget mission re-scopes it | DR-74, in [03](03-MISSION-ENGINE.md) |
| **G10** | **No trigger for congestion-priced leases** (11 OQ3) | Unpriced leases have no stated bottleneck point | Lease-wait share >15% (04's target) for two weeks on a hot resource opens a priced-lease experiment for that resource | Execution | 04 names the trigger | [04](04-AGENT-ORGANISATION.md) |
| **G11** | **Codex headless reliability unmeasured** (V29) | The harness recorded Codex exiting 0 with empty stdout when detached from a TTY, and SP1 could not run Codex at all (sandbox blocks its credentials; the unsandboxed launch was refused), so its cross-family claim is untested. v3 relies on unattended Codex for half of acceptance. UNPARSED keeps it safe, not fast | Measure UNPARSED rate per family in phase one; above 2% (parameter), fix the adapter (pseudo-TTY, streamed JSON) before any autonomous venture; count UNPARSED in T01's capacity model | Acceptance | Rate in 12; adapter fixed | [09a](09a-ENGINEERING.md) + [09b](09b-ECONOMICS-EVALS-SIM-IMPROVEMENT.md) + [14](14-BUILD-PLAN.md) |

Open questions that section files already answer with a default (06's Sleep scope, 07's registry location) are choices,
not gaps.

## 8. The founder's ten decisions

**Status: all ten DECIDED by the founder, 2026-09-30.** Each keeps its original analysis and ends with a **Decided:**
line; where he chose differently, that line restates the consequences. The final wording of the canon's draft F1–F10 (canon §9). D2 also carries R5-ISSUES #7 (the terms risk of headless
subscription use). 08's wrist and Ring thresholds fold into D4 and insurance (G5) into D7, so the list stays at ten.

**How they reach him.** All ten arrive as **Decide · Tap** packets at the first weekly board, in deadline order, and are
signed with the passkey as Constitution records. Each record carries a `review_on` date and a **reversal trigger** (§10
idea 5). Narrowing later is instant; widening passes the 12-hour cooling-off ([05 §2.1](05-AUTONOMY-INITIATIVE-FOUNDER.md)).

**Deadlines are build milestones**, because [14](14-BUILD-PLAN.md) owns the calendar. Dates are **targets**, assuming the
build starts in October 2026.

**M0** first unattended worker launch (build week 1) · **M1** first headless I2 run (week 2) · **M2** first outbound
effect or first 24/7 venture at A2 (target: before 2026-12-01) · **M3** first live customer served under autonomy ·
**M4** first venture with live customers at A3 (≥8 weeks after A2) · **M5** end of Year 1 Q2 (target: 2027-03-31).

```mermaid
flowchart LR
  D1[D1 launch permission] --> M0((M0 first unattended launch))
  D2[D2 seats and terms risk] --> M1((M1 first headless I2 run))
  D3[D3 hosts and fencing] --> M2((M2 first outbound or 24/7 venture))
  D4[D4 minute supply] --> M2
  D5[D5 first autonomous ventures] --> M2
  D8[D8 outbound and selling] --> M2
  D7[D7 entity and insurance] --> M3((M3 first customer under autonomy))
  D10a[D10 structured reconciliation] --> M3
  D6[D6 continuity freeze and Will] --> M4((M4 first A3 with customers))
  D9[D9 legal review of scale programmes] --> M5((M5 Year 1 Q2))
  D10b[D10 Model Foundry spike] --> M5
  M0 --> M1 --> M2 --> M3 --> M4 --> M5
```

### D1 — Standing launch permission for the Kernel's dispatcher (F1)

- **Question.** May one Kernel component launch Claude Code and Codex workers without a human approving each launch?
- **Options.** (a) Per-launch approval — SP2 ran **0 of 40** launches this way. (b) A standing, narrow grant held by the
  launcher alone. (c) Permission-bypass flags on workers.
- **Recommendation: (b)** — binaries pinned by digest, argv templates, forbidden flags, and per-launch requirements (admitted
  Job, tool lease with forbidden list, isolation ≥ I2 if headless, provider mode, budget cap, fenced lease); 12 concurrent,
  120/hour (parameters); a Receipt per launch (09a §8.5).
- **Why.** Nothing unattended, including the §2 defences, runs without launches — SP1 hit the same wall and could not
  launch Codex at all. Option (c) recreates SLICE's hidden same-family reviewer (V02).
- **Cost to reverse.** Very low: revoke the record, instantly; work falls back to founder-present only.
- **Deadline.** **M0.**
- **Decided (2026-09-30): (b), as recommended** — a standing rule: dispatcher-only, pinned commands, every launch receipted.

### D2 — Model capacity: how many seats, and accepting the terms risk (F2 + R5-ISSUES #7)

- **Already decided (2026-09-30):** all model work runs on subscriptions, capacity measured, no metered API (DR-61).
- **Question.** (i) How many seats/accounts per family to start with? (ii) Does he accept the terms risk (V25) with its
  mitigations?
- **Recommendation.** (i) One Claude Max and one ChatGPT plan (illustration); a second of either only when four weeks of the
  meter show capacity binding, with Fund's case of what it adds. (ii) Accept, with: the weekly terms watcher; work spread
  across accounts; the API fallback kept startable (off by default, he alone enables it); one written question to each
  provider about headless use on his own projects, the reply filed as evidence (**Know · Shelf**). *A reading of
  published terms (09a §10), not legal advice.*
- **Cost to reverse.** Low: seats change at renewal; enabling the fallback is one Constitution flag.
- **Deadline.** **M1** (first headless I2 run); closes G2.
- **Decided (2026-09-30): as recommended** — **1 Claude + 1 Codex** seat to start; add seats when the capacity meter shows
  the bottleneck. Terms risk accepted with the DR-61 mitigations; D3's hosting rule (agents on his Mac or vendor clouds)
  narrows it further.

### D3 — Hosts, the third failure domain and the residual host risk (F3)

- **Question.** Where do the Kernel, the effectors and the fencing authority run?
- **Options.** (a) His laptop. (b) A dedicated always-on Mac for the Kernel; a small cloud host for Front Desk and
  effectors; a **third failure domain** (conditional-write store in a separate cloud account) for fencing and anchors;
  alternate host drilled quarterly. (c) All cloud.
- **Recommendation: (b)** (09a §15, refining DR-09), with the G4 residual acknowledged in writing: a compromised
  Kernel-host administrator defeats the local sandbox.
- **Why.** Laptops sleep and travel, and T07 needs the kill path to survive host loss. All-cloud separates the Kernel from
  the Secure Enclave passkey and from the I1/I2 path that D2 relies on. In a third domain no host can grant itself the epoch.
- **Reverse / deadline.** Moderate (hardware, a small cloud bill; the move is the drill already rehearsed). **M2**:
  fencing live before the first outbound dispatch.
- **Decided (2026-09-30): differently from (b).** **The agents (Claude Code and Codex sessions, headless included) run on
  the founder's Mac on his own logins; everything else may run in the cloud.** Research (`_process/R7-…`, [09a §15.1](09a-ENGINEERING.md))
  refines it: vendor clouds (Claude cloud sessions and routines, Codex cloud tasks) are also allowed on the subscription;
  his login on a rented VPS or CI is avoided by default (grey zone); web UI, database, queue, scheduler, webhooks and the
  notification relay run in the cloud because they hold no subscription credential — the cloud enqueues, the Mac pulls.
  **Consequences:** a *dedicated* always-on Mac is no longer required (an option if uptime needs it); laptop sleep pauses
  local work, and overflow goes to vendor clouds; DR-62's third-domain fencing and the G4 residual are unchanged; the
  quarterly alternate-host drill becomes "restore onto another Mac of his". DR-86.

### D4 — Founder minute supply and reach (F4 + 08 §18 OQ1–OQ2)

- **Question.** How many decision minutes, when, and through which channels? **Options.** (a) An open inbox. (b) The
  canon's supply. (c) A smaller supply with more Standing Orders from day one.
- **Recommendation: (b).** 45 min weekdays, 10 weekend days, plus a 30-min weekly board; windows at 08:00 and 17:00.
  **Ring** always for Halt, and for Decide only above $200/h cost of delay, ≤2 calls a day. **Wrist** approval without a
  passkey only for two-way doors under $50 with a 1-hour held-dispatch undo, never outbound or publishing. Re-derived
  monthly (parameters; 05 §9).
- **Why.** The Exchange needs a supply to price anything (D06); without a budget, C06 lands on him; the wrist rule keeps
  reflex approvals (V13) off anything that cannot be held.
- **Reverse / deadline.** Negligible (parameters). **M2.**
- **Decided (2026-09-30): channels chosen, no minute figure.** Channels: **his Mac, the Mission Control website, phone
  calls only if a free way exists, and the push built into the Claude and Codex phone apps.** The minute supply stays at
  (b)'s default as a **parameter**. **Consequences** ([08 §2.1](08-SURFACES.md)): Mac notifications via Claude hooks and
  Codex `notify`; Mission Control web as the one inbox; Claude Remote Control push plus ntfy free for routine phone
  alerts; **Ring renders as Pushover emergency priority** ($4.99 one-time, iOS Critical Alerts), the night-wake path; a
  phone call is only an optional fallback, since no free reliable call option was found; Codex mobile push is unreliable
  today and never carries a floor.

### D5 — Which ventures go autonomous first, and how high (F5)

- **Question.** Which projects get the autonomy switch first (direction item 3)? **Options.** (a) One. (b) Two: a
  Fleet-Import venture with live revenue at A2 → A3, and a new agency at A2. (c) Three.
- **Recommendation: (b)**; A4 only through a Promotion Case after ≥8 weeks at A3 (DR-29). He names the two; 17's census of
  his repositories informs the choice but does not make it.
- **Why.** Two gives an imported-versus-greenfield comparison inside T01's verifier capacity and D4's minutes. A third
  venture waits until T01's residual P reaches 2, which is this decision's reversal trigger.
- **Reverse / deadline.** Low (narrowing is instant; an imported venture with customers winds down under the Obligation
  Keeper). Names by **M0**, so Fleet Import can buy baselines; switch at **M2**.
- **Decided (2026-09-30): differently from (b).** The first autonomous venture is **a new venture: "beeond (new
  version)"**, a new version of his old beeond project. **Details are pending from the founder** — its business model,
  customers and target level are not yet stated and must not be invented. **Consequences:** no imported live-revenue
  venture goes autonomous first, so the imported-versus-greenfield comparison is dropped; beeond starts as a greenfield
  Genesis at A0–A2 and reaches A3 only through the Promotion evidence of 05 §3.7; a second autonomous venture waits for
  his choice and T01's residual P (the reversal trigger stands).

### D6 — Deputy and Continuity Will (F6)

- **Question.** Who acts when he cannot, and what happens to each venture if he is gone? **Options.** (a) No Deputy;
  Caretaker, then Wind-down. (b) A named human Deputy who **accepts** a scoped grant and **passes a drill**, an alternate,
  and a per-venture Will (hold, wind down, hand over). (c) A professional Deputy under contract.
- **Recommendation: (b), with (c) acceptable as Deputy or alternate.** Required for A3+ ventures with live customers. The
  grant covers stop, Caretaker, wind-down and paying due bills, and never the never-list (05 §10.3).
- **Why.** T02 is in the top ten. Without a drilled Deputy, a duty due between 72 hours and 14 days has nobody lawful to
  act on it, and handing a venture over is a legal act only a human can perform.
- **Reverse / deadline.** Low (a new acceptance and drill); the sealed briefing, once read, is the one-way part. Will
  before **M3**, Deputy before **M4**. Without one, no customer-facing venture passes A2.
- **Decided (2026-09-30): differently — (a), narrowed.** **Nobody acts for him; everything pauses.** After unplanned
  silence, autonomous ventures **freeze in their safe state** and keep only **existing** customer obligations through
  their listed continuity routes. **Consequences** ([05 §10](05-AUTONOMY-INITIATIVE-FOUNDER.md), DR-85): no human Deputy,
  no alternate, no Deputy drill; the Continuity Will has one shape (freeze and keep obligations to a runway cap); the
  tier timings stay as parameters; acts only a human can perform (a hand-over, a wind-down with live customers) wait on
  the Re-entry Brief. T02's residual rises for duties no route can keep, so a venture with live customers must show a
  funded route for every obligation (a drilled freeze) before it passes A2. Will before **M3**; the freeze drill replaces
  the Deputy gate at **M4**.

### D7 — Legal holding structure and insurance (F7 + G5)

- **Question.** Which entities do ventures act through, and who confirms cover for agent acts? **Options.** (a) The
  founder personally. (b) One holding entity with DBAs before revenue; a venture's own entity when a trigger fires. (c) An
  entity per venture from day one.
- **Recommendation: (b)**, with 16 §11's triggers (invoice over threshold, liability-bearing contract, first contractor,
  outside investor, risk to isolate, acquisition), confirmed by a lawyer and an accountant in his jurisdiction. A broker
  Human Task per entity before its first A3 money or commitment mandate; until cover is confirmed, commitment mandates
  stay capped at the Repair Budget.
- **Why.** (a) puts his personal assets behind every agent act; (c) buys overhead before revenue; insurance for agent acts
  is unknown, so exposure stays capped until a broker answers.
- **Reverse / deadline.** Partly one-way (forming is cheap, unwinding contracts and tax status is not). **M3**; the broker
  task before the first A3 money mandate.
- **Decided (2026-09-30): as recommended, adapted** — start under the founder as a sole business; a company per venture
  later, on 16 §11's triggers; an accountant and a lawyer before the first autonomous money movement.
- ~~**Open item — jurisdiction and health data.** The founder's jurisdiction is unstated~~ **Closed (2026-09-30):
  Israel.** The data regime is the **Israeli Privacy Protection Law and its 2024 Amendment 13** (*needs a lawyer's
  confirmation*); **GDPR only for EU customers**; **health data is out of scope until a venture needs it**. Client data:
  subscriptions with training off; that venture moves to business/API terms only if a contract or health data requires
  it ([09a §11.10](09a-ENGINEERING.md)). Entities and tax follow Israeli rules, confirmed by the accountant.

### D8 — Who sells, and the outbound rules (F8)

- **Question.** Does he sell personally, and what cold outreach may agents do? **Options.** (a) Agents prospect freely.
  (b) The canon's rules. (c) Warm and inbound only.
- **Recommendation: (b).** He takes the first 10 sales calls per Flagship. Agents may send 1:1 disclosed cold outreach,
  ≤30 per day per cell (parameter), from warmed per-venture mailboxes, under an A2+ mandate, in the US and consenting B2B
  settings; EU and Israel batches need his approval until licensed review clears them. **Bulk cold email never** (16 §21).
  At Year 5, fleet members substitute a Guild seller plus ten circled call clips (17 OQ2).
- **Why.** Customer judgment is what he must keep; H01 and H05 are costly, and per-cell meters (V12) contain one cell.
- **Reverse / deadline.** Policy is cheap to change; reputation or domain damage already done is **irreversible**, hence
  the low start. **M2.**
- **Decided (2026-09-30): differently — stricter than (c).** **No agent outreach by default.** If a venture needs agents
  to contact people, the founder asks the system to build that capability for that project. **Consequences**
  ([16](16-EXTERNAL-WORLD-HUMANS.md), DR-87): the outbound-contact effect class is **off** in every Charter by default; the
  ≤30/day cold-outreach allowance is not a default; replies and inbound conversations are unaffected; when he turns it on
  for a venture, the disclosure rules, per-cell meters and "bulk cold email never" still apply, and Israel's rules on
  unsolicited commercial messages are checked by the lawyer first. Reversal trigger unchanged.

### D9 — Acquisition Desk, Capital Desk and Guild (F9)

- **Question.** Are these destination capabilities, and what must exist before the first deal? **Options.** (a) Defer.
  (b) Approve all three, fund legal review in Year 1, and he signs the first acquisition and first Guild contracts.
  (c) Approve with delegated signing.
- **Recommendation: (b)** (16 §14, §16). The review also covers contractor classification per jurisdiction (row 3.3).
- **Why.** Canon §7's Year-5 targets need them; they are the most legally exposed programmes, so the first instances stay
  in human hands.
- **Reverse / deadline.** Cheap before the first contract. Review funded and started by **M5**; no deal before it reports.
- **Decided (2026-09-30): (b), as recommended** — the design is approved; he signs each first deal of each kind.

### D10 — A third acceptance route (F10)

- **Question.** When Claude and Codex judges materially disagree, who decides? **Options.** (a) The founder, every time.
  (b) A paid human adjudicator pool now, plus a **Model Foundry** spike. (c) More same-family judges voting.
- **Recommendation: (b).** Three domain adjudicators on per-item terms through the Human Task Market, ≤5% of acceptance
  spend, resized after 200 coverage contracts (09b OQ3). The spike fine-tunes one small open-weight model on one
  accepted-trace class; exit on parity within 2 points at ≤25% of cost, or a recorded null (07 §14).
- **Why.** (a) spends the scarcest input on the hardest calls; (c) breaks DR-12, since SP3's self-preference exceeded the
  effect; X04 needs an independent route.
- **Reverse / deadline.** Low. Pool by **M3**; spike by **M5**.
- **Decided (2026-09-30): differently — (a) plus a structured reconciliation.** **The founder, or a reconciliation in
  which the two judges challenge each other's reasoning and reach a shared understanding through well-organised facts and
  argument.** **Consequences** ([09b](09b-ECONOMICS-EVALS-SIM-IMPROVEMENT.md), DR-88): a premise-by-premise facts table,
  cross-challenge with evidence, ≤2 rounds (parameter), a shared-understanding record; still split → a Decide packet to
  him. Not free-form debate: R0-A found debate ≈ voting at equal compute. No paid adjudicator pool; the Model Foundry
  spike stays optional by **M5**. To keep (a)'s cost off him, the split rate per task class feeds the Verifier Foundry.

### Summary

All ten were **decided by the founder on 2026-09-30** (`_process/FOUNDER-ANSWERS-2026-09-30.md`).

| # | Decision | Decided (2026-09-30) | Reversal cost | Deadline |
|---|---|---|---|---|
| D1 | Standing launch permission | Yes: dispatcher-only, pinned, every launch receipted (as recommended) | Very low | M0 |
| D2 | Seats; terms risk | 1 Claude + 1 Codex seat; add on the meter's case; V25 accepted with DR-61 mitigations (as recommended) | Low | M1 |
| D3 | Hosts, third domain | **Changed:** agents on his Mac (his logins) or vendor clouds; rented VPS/CI with his login avoided; UI, DB, queue, relay in the cloud; third-domain fencing kept (DR-86) | Moderate | M2 |
| D4 | Minutes and reach | **Changed:** Mac, Mission Control web, Claude/Codex app push + ntfy, Pushover emergency as Ring; call optional; minutes stay default parameters | Negligible | M2 |
| D5 | First autonomous venture | **Changed:** one new venture, "beeond (new version)"; details pending from the founder | Low | M0 / M2 |
| D6 | Deputy and Will | **Changed:** no Deputy; freeze to safe state, keep existing obligations only (DR-85) | Low | M3 / M4 |
| D7 | Entities and insurance | Sole business first, company per venture later; accountant/lawyer before first autonomous money; **Israel** (Privacy Protection Law + Amendment 13, lawyer to confirm; GDPR for EU customers only; health data out of scope) | Partly one-way | M3 |
| D8 | Selling and outbound | **Changed:** no agent outreach by default; built per project on his request, disclosure rules apply when on (DR-87) | Policy cheap; harm irreversible | M2 |
| D9 | Scale programmes | Approve; he signs each first deal (as recommended) | Cheap before first deal | M5 |
| D10 | Judge disagreement | **Changed:** structured reconciliation, then the founder (DR-88) | Low | M3 / M5 |

## 9. Decisions that do not need the founder

Round 5's NEW DECISIONs change mechanisms, not his rights, money or exposure, so they go to the architect's register
(canon §6). Listed so nobody mistakes them for open founder questions:

| NEW DECISION | Source | Ruling |
|---|---|---|
| **Widening cooling-off** of 12 h — it narrows what a stolen passkey can do | 05 §2.1, #14 | **DR-59** |
| **Third failure domain** for fencing and anchors — inside D3 | 09a §15, #6 | **DR-62** |
| **Audition spend** in the Improvement sleeve (window becomes 30 days after a model release) | 04 ND-04-1, #10 | **DR-60** (accepted) |
| **Verifier-building missions** — acceptance reserve's uncommitted headroom only, ≤25%/month (parameter) | 03 §12, #11 | **DR-60** (modified) |
| **Build Charter** — ends at Handover; residual tuning then goes to the Improvement sleeve | 14, #18 | **DR-60** (modified) |
| **`support_bucket`** beside rungs E0–E5 | 06, #3 | **DR-63** |
| **UNPARSED** verdict state — strictly safer | 08, #13 | **DR-64** |
| **SP1's fixes into 03** (ND-12-1) | 12 §2 | **DR-73** |
| **Family derived from the model id**, never the launch slot (ND-12-2) | 12 §6.2 | **DR-83** |

Renames, also architect's: **Claims Register** (16, #17), **Charter terms** — the envelope's fourth field, formerly
"mandate"; the Charter envelope is the whole (#15, canon §4) — and **capability epoch** and **Capability Custodian** (07,
#2).

By design the founder never decides anything whose remedy is an owner's action rather than a Constitution change (canon
§3). If one ever needs his signature, a rule was typed wrongly — itself a C01 defect.

## 10. Ideas the founder did not ask for

1. **Risk rows that expire** (§1) — a register is a set of claims about safety, so it gets the harness's claim discipline.
2. **Two numbers per row** — what the red team feared and what drills *demonstrated*; the gap is a sortable safety backlog.
3. **A drill calendar weighted by risk** — frequency ∝ P × S / detectability: X01 and X05 monthly, C06 only via the weekly
   scorecard; the control ROI ledger applies to drills too.
4. **Cross-family bounty** — in 09a §13's monthly twin red team each family attacks the other's defences; a **register
   miss** (a real path matching no row) earns Improvement-sleeve credit and adds a row. The register grows from attack.
5. **Decisions with reversal triggers** — D2 reopens on any change to the quoted terms; D5 when T01's residual P reaches 2;
   D8 when per-cell complaints exceed 0.3%. A decision that states its falsifier cannot quietly become dogma.
6. **The founder's personal exposure line** on the Map — effects he signed, open one-way doors, entities without cover
   (D7), A3+ ventures with obligations no continuity route keeps (D6): "how much could hurt me this week", derived from the register.
7. **Pre-mortem from the register** — every one-way-door packet lists the rows its effect class touches, with residuals
   and last drill: 06's Graveyard Walk applied to risks.

## 11. A worked example — one row's life

*Illustration.* **X05, the duplicate payment.** Week 1: seeded at 4×5, `valid_until` +90 d. Week 3: Q3 passes three crash
points on the payments adapter; the fourth (during reconciliation) is unbuilt, so residual P stays 4 and a repair opens.
Week 5: all four pass on two adapter classes, the unqueryable-adapter case fails → residual P 3, that adapter restricted
to `ask`. Week 9: a real supplier API times out at 02:10; the Operation stays `uncertain`, the broker confirms settlement
at 02:24, one payment → residual P 2, founder gets **Log** only. Week 13: the alternate-host drill passes; `valid_until`
extended. The founder saw one row move in a quarter.

## Open questions

1. **May a model's judgment lower a residual score?** *Recommendation:* no — only suites, drills and journaled incidents;
   a judge may propose a re-score that Acceptance confirms with a run.
2. **Should more open questions become founder decisions** — the Judgment Gym routing work away from him (05 OQ2), binding
   his personal email and calendar (04 OQ3)? *Recommendation:* keep ten; present these two as **Circle** items at the
   first board and promote only if he circles them.
3. **Who scores new V-rows?** This file scored V01–V30. *Recommendation:* Regulation proposes, Acceptance confirms against
   §0's scales, with a second-family check on any S = 5.

## Sources

- **Primary:** `r3-stretch/R3-redteam-codex.md` [R3-red] — §1 scales and ranking; §2 X01–X08, D01–D08, T01–T08, H01–H06,
  C01–C06; §3 contradictions; §4 Scenarios A–E; §5 suites Q1–Q10.
- **Binding:** `00-FOUNDER-DIRECTION.md`; `00-CANON.md` §2–§4, §6, §7, §8, §9 (F1–F10).
- **Process:** `_process/R5-ISSUES.md` (#2, #3, #6, #7, #10, #11, #13, #14, #15, #17); `_process/prompts/R5-writer-common.md`;
  `_process/SEAT-CONTEXT.md`.
- **Section files:** 02 §8; 03 §15.1, OQ; 04 §13, OQ; 05 §2, §7.3, §9, §10, §14, §15; 06 §16, OQ1; 07 §5, §14, §19, OQ;
  08 §9, §16, §18; 09a §8.5, §9–§11, §13, §15, §19, §20; 09b §7, §13, §20, §26, OQ3; 11 OQ2–3; 16 §11, §19, §21; 17 §13, OQ2
  — and through them SP2, SP3 and SLICE; 14 (build jobs carrying suite subsets).
- **Spike:** `r4-spikes/SP1-mission-loop.md` §4–§6 (verdict PARTIAL; design changes; Codex could not run).
- **Provider terms** (fetched 2026-09-30 by S12, quoted from 09a §10, not re-fetched): anthropic.com/legal/consumer-terms ·
  code.claude.com/docs/en/legal-and-compliance · support.claude.com/en/articles/15036540 · learn.chatgpt.com/docs/auth ·
  developers.openai.com/api/docs/guides/your-data · platform.claude.com/docs/en/manage-claude/api-and-data-retention
- **Harness:** root `CLAUDE.md` (Codex exit 0 with empty stdout when detached from a TTY; claims carry an expiry).
- **Method:** each red-team ID located in the section files by word-boundary search and nearest heading, then checked
  against each file's failure table.
