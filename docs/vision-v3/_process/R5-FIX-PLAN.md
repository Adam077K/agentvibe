# R5 fix plan — grouped by target file

*Chief architect, 2026-09-30. Inputs: `R5-SCENARIO-WALK-codex.md` (B01–B40, C1–C10), `R5-ISSUES.md` (#1–#21), the scenario
writers' gaps in 13 (G1–G7, G-B1–G-B7), 15 §7 OPEN GAPS (here **OG1–OG11**, to avoid clashing with 13's G-numbers), SP1,
and 12's ND-12-1 / ND-12-2.*

**The rulings are already in `00-CANON.md`** — §3 (P2 × P3, consequence rule, overlays, activation timing), §5 ("Added in
the R5 fix pass"), §6 DR-56 to DR-83, §9 D1–D10, §11 reading paths. Fixers cite DR numbers and **do not re-argue them.**

**Rules for fixers.** Edit **only** your file. Each section below is self-contained; where it says "link", add a link
and do not specify another file's mechanism. Use canon §4–§5 words. Mark any number you add as target, illustration,
parameter or measured. Every section also includes **L — links**: all links between design files are sibling-relative
(`05-AUTONOMY-INITIATIVE-FOUNDER.md`, never `../05-…`); fix any link to the old names `05-AUTONOMY-AND-FOUNDER.md` or
`11-FIVE-CONCEPTS.md`, and spike links to `r4-spikes/<file>.md` (#9, B40, DR-82). After fixing, do not add a changelog —
edit in place; where a line is superseded and history matters, use one struck-through clause plus the DR number.

## 0. The two cross-cutting rulings

**Money (#10, #11, #18 → DR-60): one pool per purpose.**

| Purpose of spend | Pool |
|---|---|
| Delivering an obligation | Obligations reserve |
| Judging funded work (verifiers, judges, Time-out Confirmers, adjudication) | Acceptance reserve |
| Recovery | Recovery reserve |
| Manufacturing acceptance capacity (Verifier Foundry) | Acceptance reserve's **uncommitted headroom only**, ≤25%/month (parameter); never windows reserved for admitted missions |
| Improving how the organisation works (auditions, Forge, config trials, Skill Foundry, reflex re-runs, post-Handover harness tuning) | Improvement sleeve: floor 6%, 12% for 30 days after a model release, cap 15% of investment-lane capacity (parameters) |
| Constructing the organisation until Handover | Build Charter (ends at Handover) |
| Everything else | Its investment sleeve |

Rulings on the NEW DECISIONs: ND-04-1 **accepted** (the post-release window becomes 30 days); 03's verifier-reserve rule
**modified** (headroom only, capped); 14's Build Charter **modified** (bounded by Handover; afterwards tuning goes to
the Improvement sleeve). Every draw names a beneficiary and faces the 30-day outcome check.

**Billing (#7, #21, OG2 → DR-61).** Until the founder signs D2, **every headless run uses an API key.** The
recommendation for D2 is attended headless on the subscription for **Claude only**, when all of these hold: the job was
launched by his command, a presence proof is <30 min old, the venture is A0–A1, and the data is D0–D1. **All Codex
headless runs use an API key.** Autonomous ventures, D2+ data and initiative jobs always use API keys. Subscription work
carries an API shadow price. 09a's `providerMode` and 15's D2 must both say exactly this.

**Not fixed, with reasons.**
- #8 (26 directories vs ~19 repos): 17 already explains it.
- #16 (S14 prices for older models): 09b already says fetch, never assume; 14 carries the pricing-fetch job (checked in §14).
- #5 (package size): depth is kept and reading paths added (canon §11); nothing is cut.
- G1's "proceed on silence" proposal is rejected: authority is never created by silence (DR-59).
- G-B1's "≥40% disjoint work" is rejected as a universal threshold: it came from a canned SP2 run.
- B40's "12 is absent" is resolved: 12 now exists.

---

## 01-VISION

| Id | Change |
|---|---|
| DR-58, DR-59 | §3 principle 13: after "Narrowing is instant and free; widening needs the founder" add "— and waits out a 12-hour cooling-off" and link 05. |
| DR-57 | §3 principle 12: add "classified once, from one rule source" and link 16. |
| L | Link check (§ rules above). |

## 02-ORGANISATION

| Id | Change |
|---|---|
| DR-56, C2 | §5.2 row "Obligation vs freeze": replace the resolution with: "P2 still wins. The freeze's safe state lists continuity routes; an obligation proceeds only along a listed route; otherwise it stays pending and its latest safe start opens a continuity decision." |
| DR-58 | §4.0 Constitution powers: add "Automatic narrowing is a Journal overlay, never an edit of signed files." §4.7 Regulation powers: "narrows by overlay". §5.1 matrix, Regulation row: annotate S as "(overlay)". |
| DR-59 | §4.0: add cooling-off for widening, with the Genesis and emergency-envelope exceptions (link 05). |
| #15 | §7 "What each authority did", Constitution row: "refund mandate ≤$200" is an **Effect Mandate** (16), not a Charter field. Reword to "Keel's charter and its signed refund Effect Mandate (≤$200)". |
| DR-69, DR-70 | §4.4 Acceptance: add (a) nothing is published before the required verdicts, (b) three settlement edges, (c) single-family verdicts are provisional. |
| DR-57 | §7 sequence note: the disposition comes from 05's table on 16's classification (one line, link both). |
| L | Link check. |

## 03-MISSION-ENGINE

| Id | Change |
|---|---|
| ND-12-1, DR-73, OG6 | §4 and §10: land the SP1 changes fully. (1) **Capability-checked success tests**: at Framing, every success/kill clause maps to an available worker capability or a named human gate, or the test is rejected. (2) **`awaiting_gate`** as a first-class stop state beside `stop_success`, `kill`, `stop_budget`; the mission stops and emits the gate request. (3) **Diminishing-returns stop**: top question's value moves <0.1 over two consecutive cycles → forced decision (pivot, gate, accept). (4) **`veto` question class** (legal, regulatory, safety) exempt from VoI ranking, which must be resolved before `stop_success`. (5) **Loop-worth threshold**: run a mission-shaped loop only if the decision is worth ~20× a single run (parameter), else a single run plus one Referee pass. (6) Steward on a cheaper model with a compact state view. Link 09b for the Referee's fetch-based attribution check. Keep 12's §5 text as the evidence; 03 states the design. |
| C6, DR-67, B31 | Rewrite guard **G2** as the diminishing-returns invariant, not "three consecutive Research moves". Rewrite **G4** as the invariant "a one-way commit needs independent objection generation and ≥2-family verification of each factual premise", accepting any method that produces that evidence. Keep exact predicates. |
| DR-74, OG9 | Add the **Re-scope Review** trigger: tranche burn ≥80% and settlement forecast ≥30% below admission (parameters) → review led by a fresh other-lineage Mission Lead, funded from the mission's reserve. It returns re-scope, kill or continue-with-falsifier. |
| DR-60, #11 | §12 NEW DECISION box: modify to "Verifier-building draws only on the acceptance reserve's uncommitted headroom, ≤25%/month (parameter), never on windows reserved for admitted missions", and mark it accepted as DR-60. Link 09b as the owner of the charging rule. |
| #11 | Keep "moonshot lane folded into the Long-Horizon sleeve; two lanes" (accepted). |
| C10 | Sleeves table: name **Core** explicitly as the residual allocation beside the six named sleeves. |
| B05 | Probe section (§12.2): distinguish *one probe with four arms* (one reservation, one graduation decision) from *four bundled probes* (four reservations). Link 09b for the charged vector. |
| B22 | §4.2 / §15.2: integration rework and recovery are funded from the recovery reserve and the priced integration rework (link 04). The **surprise reserve (10%, parameter)** is only for unforeseen moves. An override of the parameter must be recorded. |
| DR-77, B02, B18, G6 | §8: (a) rung-bearing evidence must match the **exact proposition** (one customer accepting one offer ≠ "flat fees are required"); (b) evidence debt gets a durable id, successor owner, frozen question, repayment test and reassignment event, and survives mission death and pivot; (c) repaying debt (obtaining the owed rung) is distinct from a hypothesis succeeding; an underpowered result is a typed null (link 06). |
| B14 | §6–§7 Strategy Cells: compared cells need a shared estimand (same population, outcome, window), or their results are labelled descriptive and cannot form a causal prior. |
| G3 | §12.5: the competitor trigger consumes **competitor change events from the Brain** (link 06 §11), not the Pain Index. |
| G4 | §11 Allocator: when 06 reports a domain non-exchangeable, use 06's wide labelled prior; the exploration share comes from 09b's bounds. |
| L | Link check; the SP1 subsection already points to 12 — keep it. |

## 04-AGENT-ORGANISATION

| Id | Change |
|---|---|
| #10, DR-60 | ND-04-1: mark **accepted as DR-60**; change "12% in the week after a model release" to "12% for the 30 days after a model release"; link 09b for the charging rule. Keep the replacement of the reviewer-family casting filter by coverage-contract refs. |
| B07, DR-70 | §9.4 integration queue: split **staging integration** (merge, re-test on a staging branch) from **publication** (CAS land to main, deploy), which happens only after the coverage contract's required verdicts. "Main never goes red" is kept by construction. |
| B38, DR-70 | §10: the **Time-out Confirmer** is a named coverage edge (not an ad-hoc role) for every R3/R4 effect, reserved with the coverage contract (link 09b). |
| G-B1 | §7/§9: define the **overlap estimator**: inputs (declared footprints, hot-resource map, historical touched-vs-declared), output (expected integration rework launches with an interval), fallback (a transparent count of shared resources). State that live-worker calibration is owed (SP2 live arms, link 14) and that no universal disjointness threshold exists. |
| OG10 | Leases: a hot resource whose lease-wait share is >15% for two weeks (parameter) opens a priced-lease experiment for that resource. |
| B37, DR-75 | §4.4 re-audition after a model-version change: the population is **every record in both families** that uses the changed model, and the arms are within-model pairs. |
| DR-83 | Cast registry evidence records family derived from the model id (link 09a). |
| L | Link check. |

## 05-AUTONOMY-INITIATIVE-FOUNDER

| Id | Change |
|---|---|
| #15 | Rename the Charter field "mandate" → **Charter terms** everywhere (schemas, prose, examples). "Mandate" in this file then means only an Effect Mandate (link 16). |
| C1, DR-57 | §3.3: keep **one** disposition table (level × grant × door → auto/notify/ask/co-sign/never). Add the mandate row: a covering Effect Mandate lowers disposition one step, never below notify for one-way. Delete this file's own R-class definitions (R0–R1 "two-way internal", etc.) and link 16 for classification. At A2 the trust condition stays in *this* table. |
| C5, DR-58 | §2.1: automatic narrowing (Regulation, tripwires, continuity tiers, CCIR additions, validity shortening) is a **narrowing overlay** recorded in the Journal, applied by the compiler, and never written into signed files. The founder may fold overlays into an amendment. |
| DR-59, B01, B24 | §2.1–2.2: the cooling-off NEW DECISION is accepted. Add (a) **initial Charter activation**: Genesis ends in one passkey signature over the complete canonical Charter; A0–A2 within default genesis caps activates on signature, A3+ or above-cap waits for cooling-off; voice may propose but never confirm. (b) An **emergency-capacity envelope** field per Charter (money, duration, purpose bounds, pre-signed) that an Incident Lead or the founder may draw immediately. |
| DR-56 | Charter schema: `scram_safe_state` gains a `continuity:` list of bounded routes per obligation class. |
| G1 | Genesis leaves a **baseline CCIR** from the Kind template, signed with the Charter; each line names its floor (default Tap; `wake` allowed) — reach itself is 08's. |
| G-B5, B20 | §10: define the **presence proof** (passkey, or a registered watch's device-bound signed tap), which resets Clock 2 and never authorises an effect. Specify planned-absence arithmetic: a declaration suspends an already-running clock from the declaration time, not retroactively, and expires at the stated return + 24 h. The **pre-absence sweep** presents packets early; it cannot dispose of them without his choice or a permitted default. |
| G-B7 | §8.2–8.3: **async board** — pack delivered on his return window, minutes counted when read, packet deadlines unchanged, un-read items carry forward, defaults only per the silence rule; one-way Decides keep their reach floor (link 08). |
| G5 | §8: a **Mind carry-over table** for Pivot, Shelve, Sell: fingerprint, founder preferences, hypotheses (frozen, not deleted), dissent, wagers (kept and settled), commitments (kept), Standing Orders (recompiled against the new Charter; none carries silently). Link 06 for lineage and consent scope. |
| G-B2, B14, DR-78 | §8.4 wagers: recuse interested **records and lineages** (not only families); an uninvolved planner executes; the query is frozen at registration and evaluated at the resolution date. |
| B27 | §6 and matrix row 4: every goal-tree node carries a classification (core / speculative) and the operative cap (e.g. speculative ≤30%). A founder overrule of a *strategy* does not amend an exposure limit; exceeding the cap needs a signed widening, and a Shadow blocker is preserved. |
| C3, DR-66 | Matrix row 15 and §3.4: venture pivot = new intent = new Charter, founder passkey only. Strategy change inside existing intent = goal-tree row 4. |
| B33, DR-76 | Add: classification consent (Fleet Import sort, silence on a sort) never grants authority; member and imported Charters activate only by signature. |
| C4, DR-65 | §10.1: replace "focus = Halt only between windows" with "focus is a ceiling input; reach is resolved by 08's table". Remove any other place where this file chooses a reach; emit class + door + CCIR line + deadline only. |
| L | Link check. |

## 06-MEMORY

| Id | Change |
|---|---|
| C7, DR-68 | Use 09a's wire field names (link 09a's mapping table). Keep semantics here. Classification, boundary (sealed/guarded/open), retention class, retention deadline, permission, taint and origin are distinct fields. |
| B16, DR-40 | Remove any wording that public/untrusted evidence becomes trusted "when cited" or "cited in a settled decision". Citation raises confidence in *our use*, never the source's taint or authority. Human-supplied material keeps an existing origin plus a `provenance.human_principal` field. |
| B18, DR-77 | §9: add **typed nulls** — powered, underpowered, confounded. Only a powered null settles a hypothesis; the others are stored as observations. |
| B30, DR-79 | §4/§10: add a **Release** effect for sealed derivatives: consent-scope check (link 16), disclosure test, founder signature. Without it sealed derivatives (lessons, priors, datasets) stay local. De-identification alone changes nothing. |
| G3 | §11: define **competitor entities** in each Brain with a watchlist owner, sources, freshness and emitted **change events** that 03 and 05 consume. |
| G4 | §9: define pool membership (an exchangeability check per domain) and the fallback — a wide, labelled, uninformative prior when no pool is exchangeable. |
| G5, G6 | Preserve lineage and consent scope across a pivot (scope never expands with a new offer); preserve evidence-debt records (link 03). |
| G-B3 | Add **participant** labels and release scope for human-subject data (link 16 for protocol). |
| #4 | Memory mass: state it as a band on Regulation's Knowledge stock and link 09b, which owns the band. |
| OG3 | Disclosure budget: keep the half-budget interim and link 14's spike job. |
| L | Link check. |

## 07-SKILLS-TOOLS-MCP

| Id | Change |
|---|---|
| #2 | Capability epoch and Capability Custodian are accepted into canon §5; point the glossary box at canon. |
| B15 | §4.2/§9: rollout rings need a **separately recorded ring-transition decision** (ring 0 twin → ring 1 venture) before live data. State the exact admission bounds (e.g. CI lower bound ≥ −0.02 with positive point uplift and acceptable cost, as written), not "CI crosses zero". |
| B35, DR-75 | §12 Model-Release Reflex: track qualification per **model version × capability × route**; only completed combinations are eligible; the report shows partial completion. |
| B36, DR-75 | Scope replacement and retirement to the exact model/tool configuration; the old default keeps its MCP until equivalence is demonstrated there. |
| B37, DR-75 | Capability tests are **within-model** with/without pairs; cross-family drift controls are recorded separately. |
| DR-73 | Grants: Acceptance's observation broker holds a read-only **fetch** capability for attribution checks (SP1); workers do not supply it. |
| L | Link check. |

## 08-SURFACES

| Id | Change |
|---|---|
| C4, DR-65, G2, G-B4, B21 | §2: publish **one ordered routing table**. (1) Compute floor from class, door, CCIR line floor and deadline: Halt ≥ Buzz (Ring after 5 min unacked); one-way Decide ≥ Tap; Know about an executed one-way effect ≥ Reel unless a CCIR line raises it; a CCIR line's floor is signed (default Tap; `wake` may exceed quiet hours). (2) Compute ceiling from Founder State, focus, quiet hours and budget. (3) If floor > ceiling, Halt, `wake` CCIR lines and one-way Decides whose deadline precedes the next permitted window take the floor; everything else is **deferred** to the first permitted moment, and if that falls after the deadline the silence rule applies. Replace the property test with "reach ≥ floor, or deferred and deadline-safe". Delete "Know at Tap only by founder override" (superseded, DR-64). Mixed-option packets take the highest option's floor. Note that 05, 09b and 16 supply inputs only. |
| B19, DR-80 | Wrist grammar: never approves offers, concessions, outbound or publishing; those route to the phone (Tap). |
| G-B5 | Render the **presence proof** on the wrist as a signed presence tap, visibly distinct from an approval. |
| DR-64 | UNPARSED accepted; keep. |
| DR-70 | Board card: show the three settlement edges (accepted · observed in production · promise fulfilled) and a "published" marker separate from Done. |
| L | Link check. |

## 09a-ENGINEERING

| Id | Change |
|---|---|
| #7, #21, DR-61 | §10 `providerMode`: codify DR-61. A flag `d2Signed` (default false) makes every headless job `api`. When true: `sub` only if the family is Claude, the job was founder-launched, presence proof <30 min, level A0–A1 and data D0–D1. Codex headless is always `api`. Keep the D4 refuse. Subscription jobs are priced at the API shadow price. |
| DR-56 | §5 compiler: evaluate a P2 deny as "deny within scope except actions matching the safe state's `continuity:` list"; a match continues to P3–P8. Show the pseudocode. |
| DR-57 | §5: the compiler composes 16's classification with 05's disposition table; delete any local copy of either table. |
| DR-58 | Compiler input includes active **narrowing overlays** (scope, reason, expiry) from the Journal. |
| C7, DR-68 | §12: publish **one versioned wire schema** for labels and a mapping table from 06's semantic names (incl. 06's confidential/sealed onto D-classes plus boundary). |
| C8, DR-69 | §10: single-family mode flags verdicts **provisional**; provisional verdicts never satisfy a missing coverage edge; the provider-exit drill measures degraded production only. |
| B34, DR-76 | §11: deterministic **pre-model secret scanning and redaction** before any model reads a repo; census manifests carry references, never secret values. |
| OG4 | §13: add Kernel-host administrator mitigations — a separate admin account never used for agents; custody keychain sealed by Touch ID; hourly journal-head vs anchor comparison run from the third domain, which trips the external epoch on mismatch; provider keys revocable from the recovery kit. |
| OG11 | WorkerAdapter: Codex headless via pseudo-TTY and streamed JSON; measure the UNPARSED rate per family; above 2% (parameter), no autonomous venture relies on that family's headless route. |
| DR-83 | §8 Receipts and launch logs: `family` derived from the model id, never from the slot. |
| DR-73 | Observation broker: add an out-of-sandbox fetch path used by Acceptance's attribution check. |
| DR-62 | Third failure domain: already written; mark accepted. |
| L | Link check. |

## 09b-ECONOMICS-EVALS-SIM-IMPROVEMENT

| Id | Change |
|---|---|
| DR-60 | Add the **charging rule** table (§0 of this plan) as the canonical home, with denominators: sleeve percentages are of monthly investment-lane capacity per resource; Foundry cap is of uncommitted acceptance reserve. Link 03, 04 and 14 for the NEW DECISIONs it reconciles. |
| C10, B05, B22 | State denominators for every cap and the **charged vector** per mission (cash, allowance, throughput, minutes, verifier windows); a reservation ledger per probe or arm; the full reserved tranche with its authorised contingency draw; any parameter override is recorded with its authority. |
| B23, DR-81 | Provider spend caps are reservation **buckets held before every debit**; execution cannot consume acceptance headroom; a violated invariant is a labelled failure. |
| B08, B17, DR-71 | §10: acknowledged-defect remediation closes a disagreement without adjudication (the old candidate stays FAIL); adjudication only to accept over an unrefuted FAIL; independence is judged by component and lineage. |
| B07, B09, B38, DR-70 | §10: define which coverage edges gate **publication**; add the three settlement edges (production observation is its own edge); reserve the Time-out Confirmer edge for R3/R4. |
| B25, DR-69 | §6: a human may substitute for a missing edge only if the contract named a qualified human alternative before launch; single-family verdicts are provisional. |
| B11, DR-72 | §20: separate immediate scoped SCRAM (extendable to siblings with recorded applicability evidence) from the antibody lifecycle observe → warn → block. |
| B19, DR-80 | Define **concession exposure** as the full commitment value; grants check that value. |
| B39 | Accounting categories: decision minutes vs total attention vs work time. |
| G-B1 | Price expected integration rework from 04's overlap estimator. |
| G4 | Exploration-temperature bounds used when a domain has no exchangeable prior. |
| #4 | Add memory mass as a band on the Knowledge stock. |
| C4 | §6: remove the independent Hold-to-Buzz escalation; emit class, deadline and cost of delay to 08. |
| DR-73 | Referee: deterministic claim-source fetch and quote-match before any model; include refereeing cost (SP1: 42% of the loop's cost, measured) in mission forecasts. |
| OG11 | Count UNPARSED in T01's verifier-capacity model. |
| L | Link check. |

## 10-INSPIRATION-MAP

| Id | Change |
|---|---|
| L | Link check only. |

## 11-CONCEPTS-AND-JUDGES

| Id | Change |
|---|---|
| #1 | Vocabulary pass against canon §4–§5 wherever the file describes the *final* design: seven authorities + Constitution (not four), Record (not "Learning layer"), Acceptance Coverage Contract (not "the other family from the builder"), Budget Ledger / Books / Calibration Ledger (not "the Ledger"). Leave the concept descriptions in their original words, marked as Round 1 vocabulary. |
| L | Link check. |

## 12-SPIKE-RESULTS

| Id | Change |
|---|---|
| ND-12-1, ND-12-2 | Mark both **accepted** as DR-73 and DR-83. |
| L | Link check. |

## 13-WORKED-SCENARIOS — part A (Scenarios 1–7 and "Gaps found (writer A)" only)

*13 owns none of the mechanisms; it makes its traces obey them. Fixer A edits only S1–S7 and the writer-A gaps table.*

| Id | Change |
|---|---|
| B01, DR-59 | S1 (and S6 Genesis): Genesis ends with one passkey signature over the full Charter; show the activation time; no voice confirmation. |
| B02 | S1: split "this client accepted this flat-fee offer" (E4 for that proposition) from the pricing/ethics constraint (separate, lower rung). |
| B03 | S2: send ≤30 cold emails/day/cell; queue the other 16 for day two, or show a second authorised cell and jurisdiction eligibility. |
| B04, DR-57 | S2 ads ($180): one-way money under the signed Probe Mandate → **notify**; state the mandate. |
| B05 | S2: fix the arithmetic (6% of $1.4k = $84); decide one probe with four arms and reserve accordingly; reconcile $239 vs $241.70; state the mandate-headroom denominator. |
| B06 | S2: pre-orders auto-refund at probe close unless holders consent to a new Offer; graduation into the fleet follows 17's eligibility checks. |
| B07, B08, B09, DR-70, DR-71 | S3: staging integration first, publication only after component and security verdicts; at the 00:34 disagreement, the producer accepts the defect and reworks (old candidate stays FAIL, per DR-71); the promise is marked fulfilled only after the broker's production read. |
| B12 | S4: the three refused corrections stay open obligations with owner, deadline and escalation after the technical incident closes. |
| B11, DR-72 | S4: immediate sibling containment is a scoped SCRAM with recorded applicability evidence; the antibody starts in observe. |
| B13 | S5: the comparison page is a one-way publication → show the founder's approval (Decide · Tap) or cite a signed grant for that class. |
| B14, DR-78 | S5: cells use a shared estimand or are labelled descriptive; the wager settles on a fresh D30 value from its frozen query. |
| B15 | S6: show the ring 0 → ring 1 transition before live invoices; use 07's exact bounds. |
| B16, DR-68 | S1, S6: public evidence stays untrusted after citation; replace `origin: human_contractor` with an existing origin + human provenance. |
| B17 | S6: name the independent exam seat and the mixed-artifact acceptance edges. |
| B18, DR-77 | S7: the pricing result is a typed (underpowered/confounded) null, and debt repayment is recorded separately from hypothesis success. |
| B39 | S7: three vitals missed, not two; Decide minutes total 9 (10.5 includes Know time). |
| B38, DR-70 | S3 overnight deploy and S5 comparison publication: record the Time-out Confirmer edge and its reservation before each R3/R4 effect. |
| G1–G7 | Gaps table: add a "Resolved by" column: G1 → 05 baseline CCIR (DR-59); G2 → 08 (DR-65); G3 → 06 §11; G4 → 06 §9 + 09b; G5 → 05 §8; G6 → 03 §8 (DR-77); G7 → 17. |
| B40, L | Fix all links in part A to sibling-relative paths. |

## 13-WORKED-SCENARIOS — part B (Scenarios 8–15 and "Gaps found (writer B)" only)

| Id | Change |
|---|---|
| B19, DR-80 | S8: concession = 2 months × 20% × $2.4k = **$960**; check it against the $150/$500 grants (it exceeds them → ask); route to the phone, not the wrist. |
| B20 | S8: show the qualifying presence proof (Wednesday watch presence tap) and the clock arithmetic before Friday. |
| B21, DR-65 | S8 one-way price change and BAA packet, S13 packet with a one-way option, S14 scrub: apply 08's floors (Tap for one-way Decide). |
| B39 | S8: forced leave Monday 00:00 → Wednesday 00:00 for 48 h, or relabel as 40 h. |
| B22 | S9: use the 10% surprise reserve or record an override; fund predictable rework from the priced integration rework. |
| B07, DR-70 | S9: the hidden combined suite runs on staging **before** publication. |
| B23, DR-81 | S10: show the acceptance hold on the Claude bucket; if S10 depicts the reservation failing, label it a labelled invariant failure. |
| B24, DR-59 | S10: the +$40 is drawn from a pre-signed emergency-capacity envelope, or it waits 12 h. |
| B25, DR-69 | S10: drop Alternative C unless the contract pre-named a qualified human edge. |
| B26 | S10: the extension is pending until the client accepts; show the fallback if refused. |
| B27 | S11: classify the new-segment node; cap speculative at 30% or show the signed widening; keep the Shadow blocker. |
| B28 | S11: outbound only to an opt-in audience, or show the separate signed grant change. |
| B29 | S12: show approvals for the $180 and $150 tasks; recruitment 702 needs an amendment from 660 (or recruit 660). |
| B30, DR-79 | S12: sealed data and priors stay local unless a Release effect is shown. |
| B31, DR-67 | S12: remove the "third Research move refused" firing, or show the diminishing-returns condition that triggers it. |
| B32 | S13: drop the injected payload/session, keep the principal's clean channel per 16's quarantine unit. |
| B33, B34, DR-76 | S14: secret scan runs deterministically before any Surveyor model; Live/Dormant member Charters activate only by signature; the history scrub is a separately authorised hygiene operation. |
| B35, B36, B37, DR-75 | S15: report partial requalification; scope MCP retirement to the new model's configuration; show within-model pairs; re-audition both families. |
| B38, DR-70 | S10 delivery and S12 recruitment/publication: record the Time-out Confirmer edge and its reservation before each R3/R4 effect. |
| G-B1–G-B7 | Gaps table: add "Resolved by": G-B1 → 04 + 09b; G-B2 → 05 §8.4 (DR-78); G-B3 → 16 + 06 + 17; G-B4 → 08 (DR-65); G-B5 → 05 §10 + 08; G-B6 → 17 (DR-76); G-B7 → 05 §8. |
| B40, L | Fix all links in part B. |


## 14-BUILD-PLAN

| Id | Change |
|---|---|
| #18, DR-60 | Build Charter NEW DECISION: mark accepted as DR-60, bounded by **Handover**; after Handover, harness tuning is charged to the Improvement sleeve with the 30-day check. |
| OG1 | Add a **Q8 job** (harm, privacy, human work, repair) beside the Front Desk and Human Task Market jobs, and a **Q9 job** (five adaptive campaigns) before the first A3 venture; suites in the protected base; attackers from both families; acceptance reserve. |
| OG3 | Add the disclosure-budget spike (cumulative-transcript attack, three synthetic ventures). |
| OG7 | Phase one: SP2 live arms and the isolation spikes (`claude -p` under a second macOS user, proxy-only VM egress, nested Seatbelt), gated on D1. |
| OG8 | Title-vs-procedure four-arm spike before a second hybrid passes Shadow. |
| OG11 | Phase-one UNPARSED-rate measurement per family and the Codex pseudo-TTY adapter job. |
| DR-73 | SP1-bis job (12's proposal) and the 03 SP1 changes as jobs. |
| New mechanisms | Add jobs (≤30 turns each) for: continuity lists in the compiler (DR-56); narrowing overlays (DR-58); cooling-off and emergency envelopes (DR-59); 08's reach table + property test (DR-65); the label wire schema + mapping (DR-68); pre-model secret scanner (DR-76); launch-log family from model id (DR-83); spend-cap buckets (DR-81). |
| #16 | Confirm the pricing-fetch job exists; add it if not. |
| L | Link check; 12 now exists. |

## 15-RISKS-AND-DECISIONS

| Id | Change |
|---|---|
| DR-61 | D2: add "Until signed, every headless run uses an API key (DR-61)". |
| #15 | §9: the rename is **Charter terms** (the field), not "Charter envelope" (the whole). |
| §9 | Map each listed NEW DECISION to its DR: cooling-off DR-59, third domain DR-62, audition spend and verifier-building DR-60, `support_bucket` DR-63, UNPARSED DR-64, Build Charter DR-60; add ND-12-1 (DR-73) and ND-12-2 (DR-83). |
| OG1–OG11 | §7: add a "Resolution" column: OG1 → 14 jobs; OG2 → DR-61, closes on D2; OG3 → 14 spike, 06 interim; OG4 → 09a §13; OG5 → D7 + 16; OG6 → DR-73 in 03; OG7 → 14 phase one; OG8 → 14; OG9 → DR-74 in 03; OG10 → 04; OG11 → 09a + 09b + 14. The rows stay open until their "Closes when" is met. |
| Register | §3: add rows for the walker's high breaks that are *mechanism* risks: effect classification drift (C1 → DR-57), P2/P3 deadlock (C2 → DR-56), reach ambiguity (C4 → DR-65), provisional single-family acceptance (C8 → DR-69), sealed-data release (B30 → DR-79). |
| L | Link check. |

## 16-EXTERNAL-WORLD-HUMANS

| Id | Change |
|---|---|
| C1, DR-57, B04 | §4: this file **owns classification**: R0–R4 as in canon §3; door derived; blast radius moves the door, never the R-class. Delete this file's disposition table (A-level × class) and link 05. Money floor: outgoing money is one-way except qualifying refunds; paid probes, ads and task procurement run inside a signed Effect Mandate as **notify**, else ask. Remove "ask Rings when deadline <1 h" (08 decides reach). |
| B03 | Outbound limits are the **intersection** of campaign size, per-cell daily rate, consent, jurisdiction and portfolio contact frequency; excess is queued. A Probe Mandate never erases them. |
| B06 | Pre-orders: auto-refund at probe close unless the holder explicitly consents to a new Offer; escrow converts only on consent. |
| B12 | §9: residual obligations need an **acknowledged responsibility transfer** or a verified fallback before their latest safe start. |
| B13 | Public comparative claims are one-way publications; list them in the classification table. |
| B26 | Extensions: states requested / accepted / refused / expired, independently recorded; the original due date stands until acceptance; each state names the next funded fallback. |
| B28 | Before outbound dispatch, verify audience eligibility against the Charter's contact grant; a goal-tree change never grants contact. |
| B29 | Each task or recruitment contract binds to its approval, reservation and sample; any change is an amendment. |
| B32 | §10: the unit of quarantine is the payload or session; the principal is banned only for flooding or repeated hostility; define the clean continuation route. |
| C9, G-B3, B30 | §13: add a general **contribution** kind (writing, analysis, design) to HumanTask and a **participant protocol** (principal, protocol, accountable reviewer, consent scope, pay, withdrawal, approved sample, amendments, deception/debrief rules consistent with the no-deception procurement rule). Consent scope governs any Release (link 06). |
| OG5 | Insurance: broker task per entity before its first A3 money mandate; commitment mandates capped at the Repair Budget until cover is confirmed (link 15 D7). |
| #17 | Keep Claims Register. |
| L | Link check. |

## 17-VIBE-STARTUPING-IN-PRACTICE

| Id | Change |
|---|---|
| B01, DR-59, G1 | §3 Genesis: the three confirmations are a signing ceremony ending in one passkey signature over the full Charter (incl. baseline CCIR and continuity routes); voice can propose, not confirm; show when the Charter becomes effective. |
| C3, DR-66 | §11: distinguish a strategy adjustment inside existing intent (A3 proposes / A4 decides) from a **venture pivot** (new Charter, founder passkey only, never on silence or veto-timeout). |
| G7, B06 | §6/§8.1: **probe → existing fleet**: pattern match against the Fleet Charter, member cap and fleet-sum checks, shared-trust eligibility, per-member retests (pricing, compliance, channel), activation under the signed template; pre-order conversion per 16. |
| B33, B34, G-B6, DR-76 | §4 Fleet Import: deterministic secret scan before any model; classification never activates authority; member Charters are signed at adoption or stay inactive; a history scrub is a separately authorised hygiene operation outside the Import Charter (rotation, historical exposure, scrub, adoption as separate states). |
| C10 | §8.1: the illustrative $18k probe month names the signed envelope that admits it (or scale it to the $6k mandate). |
| G-B3 | Research ventures: add protocol-approved vitals (link 16's participant protocol). |
| L | Link check. |

---

## Counts

| File section | Items (excl. link check) |
|---|---:|
| 01-VISION | 2 |
| 02-ORGANISATION | 6 |
| 03-MISSION-ENGINE | 12 |
| 04-AGENT-ORGANISATION | 7 |
| 05-AUTONOMY-INITIATIVE-FOUNDER | 14 |
| 06-MEMORY | 10 |
| 07-SKILLS-TOOLS-MCP | 6 |
| 08-SURFACES | 5 |
| 09a-ENGINEERING | 12 |
| 09b-ECONOMICS-EVALS-SIM-IMPROVEMENT | 15 |
| 10-INSPIRATION-MAP | 0 |
| 11-CONCEPTS-AND-JUDGES | 1 |
| 12-SPIKE-RESULTS | 1 |
| 13-WORKED-SCENARIOS — part A (Scenarios 1–7 and "Gaps found (writer A)" only) | 19 |
| 13-WORKED-SCENARIOS — part B (Scenarios 8–15 and "Gaps found (writer B)" only) | 21 |
| 14-BUILD-PLAN | 9 |
| 15-RISKS-AND-DECISIONS | 5 |
| 16-EXTERNAL-WORLD-HUMANS | 12 |
| 17-VIBE-STARTUPING-IN-PRACTICE | 6 |
| **Total** | **163** |
