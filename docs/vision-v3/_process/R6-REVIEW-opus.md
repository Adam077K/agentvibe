# R6 — Independent review of the v3 package (Opus)

*Reviewer: an independent senior reviewer who wrote none of the package. Date: 2026-09-30. Scope: `docs/vision-v3/` 00–17,
README, HANDOFF-NEXT, with spot checks into `_process/` and `r4-spikes/`. Files read substantially: 00, 01, 02 (§1–2, §5–9),
05 (§1–4), 14 (whole), 15 (whole), 17 (whole). Files range-read or grepped for evidence: 03, 08, 09a, 09b, 12, 13, 16. No
package file was edited. Every arithmetic claim below was recomputed from the package's own numbers. Where a count comes
from a shell command, the command is named.*

---

## Executive summary: the ten findings that matter most

| # | Severity | Finding | Where |
|---|---|---|---|
| 1 | **Critical** | **The money plan is missing.** Year-1 cash authority starts at $2,000/month, yet the Probe Mandate alone allows $6,000/month. Two acquisitions are targeted with no capital source. The founder's own capital and runway appear nowhere. By the package's own Vital Signs, $2M ARR is not reachable without acquisitions nobody has funded. | 09b §4, 17 §5.2/§8.1, canon §7 |
| 2 | **Critical** | **Governance comes before revenue.** Nothing is sold to a customer until P3 (W13–W24). The first A3 venture is planned for 2027-01-29. Four months of Go kernel, VMs and a compiler come first, while "no venture work has ever run through this harness". | 14 §1, §5, §8 |
| 3 | **Critical** | **The risk register is blind to business, execution and founder risk.** It has 71 rows, and every one of them describes the machine failing internally. There is no row for "no demand", "the build overruns", "cash runs out", "the founder burns out" or "a provider account is suspended". | 15 §2–§3 |
| 4 | **High** | **The build is sized at a fraction of the work.** 128 jobs add up to 2,942 agent turns and ~$1,840. Of those jobs, 36 sit at 28–30 turns, right under the lint cap. The critical path to Spine Night has zero slack. Treasury + double-entry Books + Key Vault is one 30-turn job. | 14 §6 |
| 5 | **High** | **Dependency contradictions on the critical path.** Starred P3 jobs and the A2→A3 Promotion Case both require the digital twin (B4-04) and the Calibration Ledger (B4-03), and both are built in P4. As written, gate G3 can pass only through a logged founder *overrule*. | 14 §6, 05 §3.7 |
| 6 | **High** | **The acceptance spine rests on n = 1 and on contrary evidence.** Cross-family review is mandatory everywhere. SP3 found the two families' composite scores **negatively correlated (r = −0.37)**, Codex headless reliability has not been measured, and SP1 could not run Codex at all. | canon DR-11/12, 12 §4, §6.2, 15 G11 |
| 7 | **High** | **The founder-attention arithmetic fails at scale.** Year 5 has 300 micro-ventures at "~5 founder min/week" each, which is 1,500 min/week against a ≤30-min/day target. The "decision minutes" metric leaves out sales calls. The founder is also the accountable human on every effect and the landing gate for 40 PCB jobs. | canon §5/§7, 17 §6, 13 S1 |
| 8 | **High** | **The economics break founder direction 6 (equal families).** API caps are $150 Anthropic vs $50 OpenAI per venture, while lanes split work ~50/50 and GPT-6 Astra is listed at 2× Opus prices. That leaves Codex roughly a sixth of Claude's token budget. The subscription route is Claude-only. | canon D2, 09b §2, 14 §5 |
| 9 | **High** | **Regulation is missing from the package's own flagship example.** Clinic Voice, an AI receptionist for clinics with 31 customers, is HIPAA business-associate work. "HIPAA" appears nowhere. The founder's jurisdiction and tax residency are never stated, and payment-processor risk is not modelled. | 13 S8, 17 §2, 16 §11 |
| 10 | **High** | **One founder cannot operate this as specified.** The design has 7 authorities, ~186 canon glossary terms, 83 decision records, 19 pages, 5 × 5 contact class × reach combinations, and a Constitution he must understand to sign. "Founder-present landing" of Go kernel code is ceremony unless he can review it. | canon §2–§6, 14 §7 |

**The three most important corrections**
1. **Add a Venture Economics & Capital model** (a new owner file, or a 09b section). It needs bottom-up revenue per venture from the Kind-Prior vitals, a founder capital budget and runway, the funding source for probes and acquisitions, and stage-gated targets that the founder signs. Canon §7 should then derive from that model instead of from the expander.
2. **Open a revenue lane on Day 1** (this adds scope; it cuts nothing). Run 1–2 founder-driven A0/A1 ventures through the *current* harness while the Kernel is built. They fund the build, and they give the Referee base-rate study, the Kind Priors and the calibration machinery real data before those systems gate anything.
3. **Repair the critical path and write a second risk register.** Pull twin v0 and calibration v0 into P2, re-estimate the build against a reference class with P50/P90 dates, and add a business/execution/founder risk register with the same expiring-evidence discipline 15 already uses.

---

## 1. Mistakes: factual errors, wrong numbers, contradictions

### Critical / High

**M1. Year-1 ARR cannot be reached from the package's own Vital Signs (critical).** Canon §7 targets $2M ARR in Year 1 with 3 Flagships, 12 micro-ventures and 2 acquired businesses. 17 §5.2 sets Year-1 vitals of "$10–30k MRR" for a startup and "$15k MRR" for an agency. Take the top of every band. Three Flagships at ~$20k MRR is $0.72M ARR. Twelve micro-ventures below the $250k-ARR promotion bar (17 §6), at a generous ~$3k MRR each, is ~$0.43M. That totals ~$1.15M, and it assumes ventures that only *start* in P3/P4 (B3-16 on 2027-01-29, B4-17 from W20) reach year-1 vitals by W52. The remaining ~$0.85M must come from acquisitions (P5, W32+), which would cost several million dollars at any market multiple. **No file names where that capital comes from.** A grep for "personal savings / founder's capital / runway plan" returns nothing. The only "runway" hits are reserve floors inside ventures.

**M2. Cash authority contradicts the mandates it funds (critical).** 09b §4 sets the Year-1 starting authorisation at "$2,000" a month in total. 17 §8.1's Probe Mandate sets `monthly_max_usd: 6000`, and the text says R3-X's figure needs "~$18k". Canon §7 wants 1,000 probes in Year 1, roughly $48k at the illustrated ~$48 per probe. 09b says the ramp comes from "the Treasury rule releasing reconciled revenue". That is circular: probes produce the ventures that produce revenue, and revenue is supposed to fund the probes. The bootstrap money exists only in the founder's head.

**M3. The twin and the Calibration Ledger are used before they are built (high).** B4-04 builds "Digital twin v1" in P4 (from 2027-02-11). Yet B2-03's acceptance test, G2(c), B3-18 "Chaos Friday in the twin", and the ★ jobs B3-19/B3-20 (fixtures "twin + …", required "before the first A3 venture") all run in the twin during P2–P3. Separately, 05 §3.7 requires a "Twin replay of the last 4 weeks at the new level" and trust cells ≥80% for A2→A3, but the Calibration Ledger (B4-03) is also P4. 05 §3.7 says "Without a complete case, promotion is never *offered*. A founder promotion without one is logged as an overrule." **G3(a) (first A3 venture) is therefore only passable by an overrule, which the deviance monitor then counts.**

**M4. The canon's core precedence table is broken (medium-high, because it is the single source of truth).** In canon §3, rows P1–P3 are followed by a prose paragraph ("P2 × P3, made executable"), and then rows P4–P8 continue with no header row. In rendered Markdown, P4–P8 are no longer a table. The builder of the compiler (B1-14) reads this table.

**M5. The inter-venture economy contradicts the never-list and the entity structure (high).** Never-list line 4 forbids "Move money across a boundary: Between ventures" (05 §4), and gives as its test "Refund to a sibling venture refused". 17 §9 requires "Real invoices at list price" between ventures. D7's recommended structure is one holding entity with **DBAs**, and a DBA cannot invoice its own legal entity. Intercompany "real invoices" only exist once ventures are separate entities. The Treasury Standing Order that "recycles collected surplus into compute" is also a cross-venture money movement.

**M6. The OpenAI cap is ~6× tighter than the Anthropic cap despite equal work (high).** D2 sets caps at $150 Anthropic and $50 OpenAI per venture per month. 09b §2 lists GPT-6 Astra at $10/$50 per M tokens against Opus at $5/$25. 14 §5 sets lane splits of 50/50 or 60/40 either way, and 14 §1 rule 4 says "Both families build ~50/50". At those prices, $50 buys about one-sixth of the Claude tokens that $150 does. Combined with the Claude-only subscription route (DR-61), the Allocator's shadow prices will push work toward Claude, and direction 6 erodes silently.

**M7. The founder-minute arithmetic fails at Year 3 and Year 5 (high).** The canon glossary gives a micro-venture "~5 founder minutes a week", and the Fleet Charter template sets `founder_min_week: 5`. At Year 5, 300 × 5 = 1,500 min/week ≈ 214 min/day, plus 10 Flagship boards × 30 min. The target is ≤30 decision min/day. Year 3 gives 80 × 5 = 400 min/week ≈ 57 min/day against ≤40. 17 §16's destination week covers all 300 in one 30-minute Friday fleet review, so the two definitions disagree.

### Medium

**M8. Stale text survived the unchecked fix pass.** The handoff says the 163 fixes were "applied by per-file fixers; no re-check chain, by design". Evidence of the gap:
- **README** says "Six phases, 112 jobs". 14's totals line and HANDOFF-NEXT say **128**, and `grep -cE '^\| B[0-5]-' 14-BUILD-PLAN.md` returns 128.
- **15 §0** says "File 12 is not yet written", but 12 exists.
- **15 §6** says "Q8 and Q9 have no job yet — OPEN GAP G1", while 14 now carries B3-19, B3-20 and B5-15.
- **14 §9** says "≈16 landings × 15 min" for P1, but P1 has **20** PCB jobs.
- **Canon §6** lists DR-83 before DR-82, and canon §9 says "Not founder decisions: DR-56 to DR-82", which omits DR-83.

**M9. Scenario and illustration dates contradict the build calendar.** 17 §5.3 shows Clinic Voice at A2 with $5,400 MRR in **2026-W49**, before the Effect Gateway exists (B3-01, P3 from 2026-12-24). Scenario 8 has a Deputy "drilled 2026-09-12", before the build started. 17 §3's Genesis quotes "$600 a month", while Clinic Voice's 31 clinics at $5.4k MRR is about $174 per clinic.

**M10. The "governance overhead ≤10%" metric has no denominator and leaves acceptance ambiguous.** 09b §21 budgets overhead per door type without saying overhead of *what*, and without saying whether mandatory cross-family acceptance counts as a control. The illustrated tranche (09b §4) holds acceptance $20 plus recovery $20 against $64 of execution, which is 62% on top. Canon §3 requires every cap to name its denominator, and this one does not.

**M11. SP3's "PASS" is weaker than the canon implies.** DR-54 treats SP3 as a narrow pass: Δ = +1.01 against a +1.0 bar, with a 0.53 generation-noise floor. 12 also reports judge self-preference of +1.1 (Claude) and **+3.2 (Codex)**, which exceeds the effect itself. Promotion-bar design (the Audition Ladder) inherits a hybrid finding that is statistically at the threshold.

---

## 2. Thinking problems

**T1. The design optimises the controllability of a company that does not yet exist (critical).** R0-D's own verdict, quoted in 17 §1, is that "verified profitability with negligible human intervention is **not** [evidenced]". The package answers by building the most elaborate control system it can imagine *before* the first sale. Its binding constraints are founder judgment, verifier capacity, trust, cash and reputation. It omits the constraint that dominates every early-stage company: **finding customers who pay**. Principle 3, "grow the scarce inputs", assigns growth owners to verification, judgment, capability, trust and cash, but not to demand or distribution. Distribution appears as Keystone Assets and a Guild. SEO appears once in the whole package (a grep of 00–17 for "SEO" returns 1 hit). The warm network, which drives Scenario 1's first sale, is never modelled as a stock that depletes.

**T2. Rigour becomes Goodhart pressure.** Several mechanisms reward fitting the rule over doing the work:
- The **≤30-turn lint** leads estimators to size jobs to 28–30 turns (36 of 128 jobs). The cap has become the estimate.
- **"Decision minutes"** is the headline founder metric (01 §8 idea 2, "seconds per outcome"). It excludes Scenario 1's 162 minutes of founder sales work, which was counted as "6 decision minutes", so the number falls while the founder's real load does not.
- **Control ROI**: "a control catching nothing for 90 days drops to 5% sampling" (canon §3). That is exactly wrong for rare, severe events such as fraud or breach, where a quiet quarter is the expected state. Only "constitutional hard controls" are exempt, and the package never lists which controls those are.
- **The VoI/Thompson Allocator** (03 §11) draws P(o) from a Priors Library that is empty in Year 1. It outputs lines like "worth ~$40k, for ~$540" whose precision is invented. Across dozens of arm families, Year-1 settlement counts (~600 accepted outcomes a month in total) are far too thin for posteriors to converge. The cold-start behaviour of the whole quantitative layer (trust cells, Brier, sharpness, Promotion Cases) is not specified.

**T3. Cross-family acceptance is assumed to track truth.** DR-11 makes cross-family review mandatory everywhere. The evidence is one SLICE catch (n = 1, which 12 §6.4 admits: "DR-11 is mandatory design resting on n = 1") and SP3's self-preference data. The same SP3 data shows the two families' composite scores **negatively** correlated (r = −0.37). The within-generator rule fixes ranking *across generators*. It does not show that either judge is right. The design therefore turns disagreement into adjudication cost, not into truth. B0-11 (the base-rate study) is correctly scheduled, but no pre-registered rule says what changes in the design if the Referee's error rate is high.

**T4. The founder is treated as a security control he may not be able to perform.** "Trusted code is landed by a founder-present session, forever" (14 §1 rule 6) puts him in the loop for 40 PCB jobs, including the Go Journal, the compiler, VM isolation and the fencing authority. The package elsewhere says "zero founder-written code" and treats him as the vibe-coder. If he cannot evaluate a Go diff, his presence adds latency and no assurance. The real assurance is the two-family evidence bundle. This is the critical-path bottleneck in P1, and it is ceremony dressed as control.

**T5. "Don't shrink" has been used to justify unrequested expansion.** Direction 3 asks for "2–3 businesses/agencies (maybe one project)" autonomous. The Year-5 targets (300 micro-ventures, 15,000 probes a year, 50 acquired businesses, a 1,000-member Guild, an owned model family) came from the R3 expander and were never shown to the founder as a choice. Growing the scope is allowed. Growing the founder's liability surface without his informed signature is not. Every effect names him as "accountable human" (16 §3). One Deputy would cover 360 ventures. He would hold legal risk across 50 acquired companies.

**T6. Separation of powers is argued from organisation design, not from failure data.** Seven authorities, a policy compiler, model checking and third-failure-domain fencing are defences against adversaries and insiders at scale. Year 1 is one founder, two ventures and a queue. Nothing in the package measures how much of the red team's P×S ranking applies at that scale (15 §0 says its scales are "ordinal judgments, not measured frequencies"). The design's own governance-budget idea should decide *when* each separation is activated. At present all of them are scheduled by build phase instead.

**T7. Autonomy promotions are tied to calendar weeks, not to an evidence count.** A2→A3 needs "4 weeks", and A3→A4 needs "≥8 weeks". With low early volume, four weeks may hold a handful of settled forecasts. That volume cannot support "trust cells 100%" or sharpness scores. Promotion should require a minimum *count* of settled observations per trust cell, not only elapsed time.

**T8. The plan counts on external dependencies it has not checked.** D5's recommended first autonomous venture is "an imported venture **with live revenue**", and B3-16 (★) depends on it. No census has run, and no file says which of the 26 directories earns money. If none does, the critical path's G3 has no subject.

---

## 3. Missing concepts

| # | Severity | Missing or under-covered | Evidence | Why an operator or investor asks first |
|---|---|---|---|---|
| G1 | **Critical** | **Capital, runway and founder personal finance.** How much the founder puts in, for how long, the burn before revenue, what happens at runway zero, who pays for acquisitions and probes. | 0 hits for founder capital or personal savings; 09b §4 starts at $2k/month | It is the first question any investor asks, and it sets every Year-1 target |
| G2 | **Critical** | **A bottom-up venture P&L and go-to-market model.** Channel economics, CAC/LTV per Kind, the sales cycle, and how the first 10 customers per venture are found beyond the warm network. | "SEO" 1 hit; "distribution" 8 hits, mostly caveats (17 §8.5 calls it "speculation") | $200M ARR is a distribution problem before it is a governance problem |
| G3 | **High** | **Business, schedule and founder risks** in the register: demand failure, build overrun, cash-out, founder illness or burnout, key relationships, market shifts, competitor AI platforms commoditising the offers. | 15 §2–§3: all 71 rows are internal mechanisms | The register guides the build, but it cannot see the risks most likely to end the company |
| G4 | **High** | **Provider account suspension**, as distinct from a terms change. A whole-account ban or payment failure at Anthropic or OpenAI, or a fraud flag triggered by many parallel headless jobs. | 0 hits for "account ban/suspension"; V15 covers only "terms change"; the Model Foundry hedge arrives in Year 3 | Both families sit on two US vendors' accounts, likely in the founder's name |
| G5 | **High** | **A regulatory map per Kind.** HIPAA/BAA for clinics (the running example), PCI scope, call-recording consent, GDPR processor agreements with B2B customers, consumer-protection rules for pre-order probes, platform (ad/processor) policies on fake-door tests. | "HIPAA" 0 hits; "GDPR" 1 hit; a BAA appears only as a contract negotiation in 13 S8 | The flagship example would be non-compliant from its first customer |
| G6 | **High** | **Founder jurisdiction, tax residency and cross-border structure.** Audiences cover US/EU/IL. If the founder is resident in Israel, a US holding with DBAs raises CFC, reporting and permanent-establishment questions. | D7 says only "his jurisdiction"; 16 §11 is ~20 lines | Entity choice is "partly one-way" (D7), and it must be made before revenue |
| G7 | **High** | **Payment-processor risk.** Stripe or other processor account holds and closures for high refund rates, many DBAs on one account, pre-order probes and AI-run merchants. Merchant-of-record strategy. | "Processor hold" appears only as a stress case in 09b; merchant-of-record is one parenthesis in 16 §11 | Losing a processor freezes revenue across every venture on it |
| G8 | **Medium** | **Customer-side quality and trust.** How customers feel about AI-run services with disclosure, NPS and reviews, support quality at the 60-second acknowledgement SLA, and the effect of AI disclosure on conversion. | Only compliance tests (the "are you a bot?" suite) | Disclosure is legally right, but its conversion cost is unmeasured and it drives every revenue target |
| G9 | **Medium** | **The founder's life as a system.** 50 h/week in Year 1, and weekend work on D3–D4 of the first fortnight (14 §8). No vacation model beyond "absence", no measure of sustainability. The Founder State lacks "recovering". | 0 hits for burnout or vacation | The single irreplaceable input has no preventive maintenance |
| G10 | **Medium** | **Recruiting and running the humans the design needs:** the Deputy (and alternate), a lawyer, an accountant, a broker, adjudicators, and eventually a 1,000-member Guild across countries (payroll, classification, tax forms). | D6/D9 name the roles, but nothing covers finding, vetting, paying or retaining them | Human dependencies sit on the critical path (G3 needs a drilled Deputy) |
| G11 | **Medium** | **Physical host resilience.** The Kernel runs on a Mac at the founder's premises: power, ISP, theft and regional events. D3 drills host failover quarterly but has no statement of site risk. | 09a/D3 | The kill path and the Journal live on it |
| G12 | **Medium** | **Recovery of the founder's root identities** (Apple ID, GitHub, domain registrar, email, and the passkey device itself) and the order of recovery after device loss. | G4 covers Kernel-host admin compromise only | The passkey is the only writer of the Constitution |
| G13 | **Medium** | **A concrete first venture.** The package never names the actual first customer segment, offer and revenue goal for the next 90 days. The first-90-day indicators are about the machine. | canon §7 first-90-day list | "How the first real venture actually gets run" should be a named plan, not Scenario 1's illustration |

---

## 4. Corrections

Each correction adds or repairs scope. None cuts it.

| Finding | Correction |
|---|---|
| M1, M2, G1, G2 | Create **`18-VENTURE-ECONOMICS-AND-CAPITAL`** (or 09b §0) with: (a) the founder's capital commitment and runway in months, signed as a new **D11**; (b) a bottom-up Year-1 revenue build per venture from 17's Kind-Prior vitals and start dates; (c) the funding source for probes and acquisitions (founder capital, revenue, debt or outside equity), each with a trigger; (d) canon §7 re-derived from (b), with the expander's figures kept as a stretch row. Also make the Probe Mandate's monthly max a function of available authorisation, so a $6k mandate cannot sit on a $2k budget. |
| T1, M1, G13 | Add **lane V0 "Revenue now"** from Day 1. Pick 1–2 ventures and run them founder-driven at A0/A1 on the current harness (the SLICE board plus human-sent outreach), in parallel with the Kernel build. They produce revenue to feed the Treasury rule, real missions for the Referee base-rate study (B0-11), and data for the first Kind Priors. The rule "venture work is the acceptance test" then carries real money, not only fixtures. |
| G3, G4 | Add a **Business & Execution Risk Register** to 15, with the same expiry and evidence rules. It needs at least these rows: demand failure, build overrun ×2, cash-out, founder incapacity or burnout, provider account suspension (each provider), processor loss, key-person loss (Deputy, counsel), regulatory action, reputational event. Each row needs a leading indicator on the Map. |
| M3 | Insert **B2-xx "Twin v0"** (the fixtures and replay harness the P2/P3 tests assume) and **B2-xx "Calibration v0"** (Brier + count-gated trust cells) into P2, with B3-16, B3-18, B3-19 and B3-20 depending on them. Alternatively, write explicitly that the first A3 promotion uses a *reduced* Promotion Case, and that a founder signature on it is a documented *bootstrap exception*, not an overrule. |
| 14 sizing (finding 4) | Re-estimate every job against a reference class (P0's actuals are the calibration set). Report **P50/P90 dates** per gate. Treat the ≤30-turn cap as a **split trigger**, and require that a job estimated at ≥26 turns be split before admission. Budget 2–3× on K-lane jobs. State what slips first and what is protected, instead of "zero slack". |
| T3, finding 6 | Make DR-11 **conditional on B0-11**, with a pre-registered decision table. If the Referee's false-PASS rate is below X, keep coverage as designed. If it lies between X and Y, add deterministic and outcome-based settlement edges. If it is above Y, cross-family judgment becomes advisory and acceptance moves to observed outcomes plus human spot-checks. Also measure **inter-judge agreement** (Cohen's κ) per task class, and show it on the Map. |
| M6 | Size provider caps **per venture from forecast workload per family**, with a parity check. The expected share of Codex work multiplied by the Astra price must fit the OpenAI cap. Add a scorecard line for "family share of accepted work vs lane target". |
| M7, T2 (founder metric) | Define founder minutes at **fleet** level (for example, a fleet review of N minutes regardless of member count, with exceptions only). Report **total founder attention and work**, not decision minutes alone, as the headline metric. Recompute Year-3 and Year-5 feasibility. |
| T4 | Replace "founder-present landing" for PCB code with an **evidence gate**: two-family review, the deterministic suite, and a paid external human reviewer for the Go Kernel (via the Human Task Market). The founder signs the *release*, not the diff. Keep founder presence for Constitution and never-list changes, where his judgment is the control. |
| M5 | Reconcile the inter-venture economy with never-list line 4. Internal trade happens either only between separate legal entities, or as **internal transfer pricing inside one entity**: booked as allocations, never as "real invoices", and excluded from every revenue vital. Name the Treasury Standing Order as a pre-listed exception, or reclassify it as an intra-entity allocation. |
| G5, G6, G7 | Add a **Regulatory Map per venture Kind** (data classes including PHI and cardholder data, consent regimes, licensing, platform policies), checked at Genesis as a **veto question** (03 already has the class). Add **D12, Jurisdiction and tax residency**, before D7. Add processor strategy: a merchant of record for small ventures, and one processor account per entity. |
| Finding 10 | Write a **Founder Operating Manual** of 10 pages or fewer: the seven verbs, the five contact classes, the ten decisions, and what each surface asks of him. Add a **"minimum Constitution v1"** he can read in one sitting, and make the canon glossary a reference, not a prerequisite. Test it: the founder must pass a 20-question comprehension check before signing Constitution v1, because a signature over a misunderstood document is the X08 failure. |
| T5 | Present the Year-1/3/5 scale as an explicit **founder decision (D13: portfolio ambition and personal liability surface)**, with the liability line from 15 idea 6 attached. It stays in the destination if he signs it. |
| T2 (control ROI) | Exempt controls whose loss severity is 5 from the 90-day decay rule, and publish the list of "constitutional hard controls". |
| T2 (Allocator cold start), T7 | Specify **cold-start behaviour**: until an arm has n ≥ k settlements, use simple heuristics labelled as such, and suppress numeric VoI claims. Gate promotions on the count of settled observations, not only on weeks. |
| M4, M8, M9 | Run the missing **re-check chain**: one linter pass that checks cross-file counts (jobs, PCB, DR list order), stale "not yet" sentences, and scenario dates against 14's calendar. Fix the canon §3 table (move the P2 × P3 paragraph below the table). |
| G9 | Add a Founder State of `recovering` and a **founder sustainability stock** in Regulation (hours, weekends, consecutive days), with a homeostat. Protect two weekends a month in the build fortnight plan. |
| G10, G11, G12 | Add a **Human Bench plan**: sourcing, vetting, paying and backing up the Deputy, counsel and accountant, with lead times on the critical path. Add a site-risk section to D3 and a founder identity-recovery runbook (as policy data, not a playbook). |

---

## 5. What is genuinely strong (keep it)

1. **Numbers carry their status.** Target, illustration, parameter or measured, with sources. The spikes are reported honestly: SP1 PARTIAL, SP2 INCONCLUSIVE, n = 1 flagged, costs shown. Few design packages hold this discipline.
2. **The Decision Contract.** One compiled answer per action, with blockers that carry an owner, a remedy and an expiry, and "why" as a lookup (02 §9 idea 2). This is the right answer to the separation-of-powers paralysis problem, and it is buildable.
3. **Narrowing is cheap and instant, widening is signed and cooled off, and automatic narrowing is an overlay** (DR-58/59). This is simple, strong and testable.
4. **Effect identity.** Operation IDs assigned before dispatch, `uncertain` never auto-retried, the broker reading the system of record instead of trusting the gateway receipt, and honest undo. This is production-grade thinking about the part that loses real money.
5. **Obligations as first-class records.** Latest safe start, continuity routes in safe states, the Obligation Keeper, escrow for prepaid work, and "obligations before classification" at import. Customers are protected even when the company is being killed.
6. **Measure first in the build.** Frozen, red, hashed done-tests; the price fetch before budgets; the scorecard before the Allocator; UNPARSED never passing; the keep/fork/retire table grounded in what the harness has actually proven.
7. **Founder-facing economics.** Founder burden priced on every P&L (17 §5.3), the autonomy balance sheet, and the Transfer Drill as the honest measure of "runs without me".
8. **The inter-venture economy's anti-self-deception rules** (0% counts toward PMF, circular flows eliminated, Buyer's Remorse Referee). Keep them once the never-list conflict is fixed.
9. **The risk register as expiring data** whose residuals move only on evidence. Extend the same pattern to business risk; it is the right container.
10. **Surfaces faithfully cover direction 12**: Today, Decisions, Live, Tasks, Calendar, Ideas, a board that launches teams, Spend, Traces with the compiled contract. The terminal, phone, voice and watch all compile to one contract.

---

## 6. Low-severity items (no more than 10)

1. 09b §2 prices "Sonnet 4.6 · Opus 4.7", while every engine pins `claude-opus-5` / `claude-sonnet-5`. The file says rates are to be fetched, but every cost illustration in 14 is scaled from the old rows.
2. Canon §6 lists DR-83 before DR-82. Canon §9's "DR-56 to DR-82" omits DR-83.
3. 14 §9 "≈16 landings" in P1: the real count is 20 PCB jobs.
4. 15 §0 "File 12 is not yet written", and 15 §6's "Q8 and Q9 have no job yet", are both stale.
5. README "112 jobs" should read 128.
6. 01 §2 fact 1, "does in minutes what took a specialist days", is an unsourced claim presented as fact.
7. 13 S8 schedules forced leave (a configuration swap) during the founder's absence. Doing so deliberately raises risk in the one week nobody is watching.
8. 17 §3's "$600 a month" is ambiguous (budget cap or price) and conflicts with Clinic Voice's ~$174 per clinic.
9. The canon glossary's Micro-venture "~5 founder minutes a week" conflicts with 17 §16's single 30-minute fleet review (see M7).
10. The Kernel's allowed size (≤8,000 lines) is set before any module has been written. Mark it explicitly as a parameter to be re-set at Spine Night from measured size.

---

## 7. Recommended next actions (ordered)

1. **The founder answers three new questions before D1–D10:** capital and runway (D11), jurisdiction and tax residency (D12), and portfolio ambition with its personal liability surface (D13). Everything in 14 and canon §7 depends on them.
2. **Run the Fleet Import census now** (B0-19 then B0-14, ~$1.30) to learn whether any repo has live revenue. D5 and the B3-16 critical path depend on the answer.
3. **Write the Venture Economics & Capital model** and re-derive canon §7 from it, keeping the expander's numbers as a stretch row.
4. **Open lane V0 "Revenue now"**: choose 1–2 founder-driven ventures with a named customer segment and offer, and start selling in week 1 on the current harness.
5. **Fix the critical-path dependencies**: add twin v0 and calibration v0 to P2, or document the bootstrap exception for the first A3 case.
6. **Re-estimate 14** against a reference class, publish P50/P90 gate dates, and turn the 30-turn cap into a split trigger.
7. **Add the business/execution/founder risk register** to 15, including provider-account suspension and processor loss.
8. **Pre-register B0-11's decision table**, so the Referee base-rate result changes DR-11 mechanically, and add inter-judge agreement to the Map.
9. **Resize the D2 provider caps** from forecast per-family workload, with a parity check against direction 6.
10. **Add the Regulatory Map per Kind** (HIPAA first, because Clinic Voice is the running example) as a Genesis veto question.
11. **Write the Founder Operating Manual and a minimum Constitution v1**, and run the comprehension check before any passkey signature.
12. **Run the missing re-check pass** over the package (counts, stale sentences, scenario dates, the canon §3 table) before the founder's 45-minute read.
