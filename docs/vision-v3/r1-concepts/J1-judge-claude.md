# J1 — Round 1 judge (Claude)

*Independent score, 2026-09-30. I judge content, not length or model family. C3 is over the size cap; I did not
penalise it for that. Scores are 1–10.*

## 1. Score table

| | Ambition | Leverage | Unknown work | Speed | Robustness | Learning | **Total** |
|---|---|---|---|---|---|---|---|
| **C1 Market** | 8 | 8 | 7 | 6 | 6 | 8 | **43** |
| **C2 Co-founder** | 7 | 9 | 8 | 7 | 6 | 8 | **45** |
| **C3 Swarm** | 7 | 6 | 8 | 6 | 9 | 7 | **43** |
| **C4 Lab** | 8 | 8 | 8 | 6 | 8 | 10 | **48** |
| **C5 Studio** | 7 | 9 | 7 | 8 | 7 | 8 | **46** |

**Justifications** (Amb · Lev · Unk · Spd · Rob · Lrn)

- **C1:** founder as LP over N treasuries, uncapped · Attention Exchange is the best minute-rationing, but fuzzy contracts still need his valuations · Framing Contracts brilliant, pricing unknown value is weak · bid windows + auditions; rate card only <25 credits · stakes/clawback strong, but stakes reward oracle hacking (R0-A #5) and LLM bidders are correlated · every contract a calibrated forecast; memory royalties original.
- **C2:** continuous judgment, but the "thousands" are only disposable hands around one ~200 KB Mind · Standing Orders + founder-model/own-view + wagers: best model of what reaches him · Question Tree, scouts, 3-variant bake-offs · framing p90 < 20 min, parallel incarnations · Mind-as-file and Fingerprint gate clever, but one judgment is one correlated failure; Shadow only advises · "share of decisions resolved by policy" is a genuinely new KPI.
- **C3:** horizontal, bossless, but no portfolio strategy owner; co-founder shrinks to a weekly packet · no taste capture or founder model · capability-gap recruitment: no unsupported mission type · emergent discovery + 30-min disputes; it flags its own overhead · fencing tokens, atomic leases, idempotency, effect gateway, partition rules: most engineered · read-and-outcome memory, replay, but no calibration per identity.
- **C4:** runs whole-venture variants in parallel and experiments on itself · evidence levels + CIs, conviction tokens keep taste sovereign · VoI over an Uncertainty Map; forecast bets for the un-A/B-able · pre-registration and day-scale kill dates tax routine work · pre-reg, cross-family Referee, systems of record, interference graph, IRB; thin coordination substrate · Priors Library, Null Registry, founder-scored calibration, Org Science: learning *is* the architecture.
- **C5:** lot compounds, Series runs businesses, but departments and T0–T3 are startup-shaped · raw-artifact Dailies Reel, circled takes, 19 min / 3 decisions · ladder fixes evidence not method, yet a fixed four-rung lifecycle nears a playbook · backlot reuse, self-greenlit T0–T1, second-unit swarms · tranches, single edit bay, completion guarantor; departments can bottleneck · mandatory strike makes N+1 cheaper; calibration charges missed upside.

## 2. Strongest mechanism and most dangerous flaw

| Concept | Strongest mechanism | Most dangerous flaw |
|---|---|---|
| C1 | **Framing Contract.** When no oracle exists, the first job is to buy measurability. This converts unknown work into checkable work. | **A synthetic economy with real incentives to cheat.** Stakes and believability gains reward gaming the oracle, and R0-A reports hidden-test hacking attempts in ~80% of MirrorCode runs. The bidders are correlated LLMs, so the market price can be confident and wrong, and it will drive auto-freeze. |
| C2 | **Judgment → Standing Orders compilation, measured as the share of decisions resolved by policy.** Founder leverage rises with time instead of staying flat. | **One judgment, correlated everywhere.** Every venture inherits the same blind spot. A poisoned or drifted Mind propagates through every incarnation, and the Shadow seat can only advise. |
| C3 | **Fenced leases plus a scoped effect gateway.** Stale workers cannot act, and money and messages pass only through adapters that enforce margin floors and idempotency. | **No owner of direction.** The attention field optimises locally. Busywork is caught only after "two experiments without progress", and nobody holds the portfolio thesis between weekly packets. |
| C4 | **Default-kill on the kill date plus a pre-registration registry.** Zombies and self-deception die mechanically. | **Everything-is-a-bet overhead and small-N theatre.** Most business decisions have an unreachable MDE, so the ceremony risks producing false precision at the speed of paperwork. |
| C5 | **Dailies Reel + circled takes.** The founder's taste is captured from real artifacts in 5–8 minutes a day and becomes a routing signal. | **Permanent departments and a fixed lifecycle.** They re-import an org chart and a venture template, which is the playbook-as-core the founder banned, in costume. |

## 3. The best combination

**Spine: C4 Lab.** It is the only concept whose core loop *is* the ability to learn over time. Its evidence ladder,
bound to door type, turns "right altitude" and per-project autonomy into mechanics rather than judgment calls. It also
already treats hybrids and Claude vs Codex as experimental arms. Its gaps are a runtime substrate, a continuous
judgment, a taste channel and speed on routine work, and each of the other concepts fills one of them.

| Graft | From | Why |
|---|---|---|
| Evidence-linked world model, fenced leases, per-resource merge queue, effect gateway, idempotency, partition rules | **C3** | The Lab's coordination is thin. C3 is the most robust substrate, so it becomes the floor that the Lab runs on. |
| Attention field for the **obligations lane** (hazards, incidents, customer commitments) | **C3** | Incidents and obligations should never wait for a bet cycle. |
| Mind-as-record, Standing Orders, founder-model / own-view split on every packet, Fingerprint gate, Shadow seat | **C2** | Gives the Lab's Venture Steward continuity and a way to compile repeated calls into policy. The Fingerprint gate generalises to *every* config promotion. |
| Framing Contract (buy an oracle) and the Brier-corrected forecast score `p_cal` | **C1** | Becomes the Bet Designer's first move when no metric exists. `p_cal` becomes the Allocator's prior weighting. |
| Founder Attention Exchange with default-on-silence and cost of delay | **C1** | Sharper than a "≈5 open items" cap: it prices his minutes. |
| Memory royalties | **C1** | Unifies with the read-counts in the Priors Library. A finding survives only if settled work cites it. |
| Dailies Reel + circled takes | **C5** | Taste arrives as raw artifacts, not CIs alone, and circles become data for the Allocator. |
| Backlot with mandatory strike; Series / showrunner mode; completion guarantor | **C5** | The Lab learns *what is true*; the backlot compounds *what is built*. Series mode handles businesses that never "end". |

**Conflicts between grafts and their resolutions**

1. **Market bids (C1) vs no-bids attention field (C3) vs Thompson allocator (C4).**
   - Two lanes. The obligations lane is ordered by C3's field, with no bidding.
   - The investment lane is funded by C4's Allocator, using C1's calibrated forecasts as inputs.
   - Credits exist only as cost accounting. There are **no stakes and no transferable rewards**, which removes the incentive to cheat.
2. **One permanent judgment (C2) vs no superior agent (C3) vs independent Referee (C4).**
   - The Mind holds *framing and proposal* authority only, never verdict or merge authority.
   - The Referee cannot be overruled by the Mind.
   - Every Mind call is a registered bet, so the wager ledger and the calibration ledger become one ledger.
3. **Permanent departments (C5) vs dissolve-after-mission (all others).** Departments become *stores plus policies*: the backlot, the cast registry and the ledger. No standing agents except the Mind *record*.
4. **Pre-registration ceremony (C4) vs speed (C5, C3).**
   - Pre-registration is required only when a result will enter the Priors Library, buy a tranche or cross a door type.
   - Two-way work under a cost threshold runs unregistered and is logged afterwards as an observational finding at a down-weighted evidence level.
5. **Backlot reuse (C5) vs exploration arms (C4).** Merge C5's Originals slate and C4's moonshot sleeve into one 20% exploration sleeve. Reuse versus fresh build becomes an experimental arm itself.
6. **Standing Orders (C2) vs "no playbooks as core".** Standing Orders are *decision policies*, not methods. They carry `valid_until` and default-kill like bets, and an Order that dictates steps fails lint, the same way playbook stages refuse `steps:` today.

## 4. What all five missed

1. **The legal-financial body:** entities, contracts, tax, bookkeeping, banking, and **who is liable for an autonomous action**. C3's agency invoices unattended, yet nobody designs a Controller/Legal-Ops function or a liability map per charter clause.
2. **Founder continuity:** every design rations his minutes; none models his *state* (travel, overload, illness), a dead-man switch for 14 days unreachable, or succession. He is the real single point of failure.
3. **Counterparty agents:** customers, suppliers and competitors will send *their* agents — A2A commerce, negotiation, and defence against injection via tickets, reviews and inbound mail.
4. **Reputation as a shared, breakable asset:** AI-disclosure policy, a per-brand reputation firewall, and one outbound claims standard with a global kill switch.
5. **Model-release reflexes:** on each new model or tool, re-run the frozen benchmark for every config (C2's Fingerprint gate, generalised) *and* ask what it newly makes possible — capability jumps as strategy.
6. **Hiring humans as a tool:** a human-task market (signatures, physical work, human-only calls) on the same ledger as agents.
7. **Self-funding capital loops and exits:** Series revenue recycles into compute by treasury rule; selling, spinning out or shutting a venture as a designed outcome.
8. **A measure of "out-building thousands":** e.g. FTE-equivalent output per founder-hour on matched deliverables. Without it the headline is unmeasurable.
9. **Inter-venture economy:** ventures as each other's first customers — synergy, not only cannibalism.

## 5. Evidence checks against Round 0

- **C2 vs R0-D.** R0-D's Vend finding is that *"specialist separation was more useful than adding an executive persona"* — it cuts at C2's premise, though C2 cites Vend only for capture. Its >85% taste-match target [S] has one data point behind it: **61%** (Project Swap).
- **C1 vs R0-A/R0-D.** Internal prediction markets with LLM traders have **no support in R0**, and Vend shows shared blind spots, so trader errors correlate. Stakes amplify the evaluator hacking R0-A documents (~80% attempts on hidden tests). Its −39–70% sequential figure is correctly sourced.
- **C3 vs R0-A.** R0-A says a single strong agent beats any swarm on sequential reasoning and the target is an org that *chooses its shape per mission*; C3 makes swarm the default. Independent agents amplify errors 17.2× vs 4.4× centralised; per-resource merge queues only partly meet "every fan-out ends at a verifier". C3 cites no R0 source — honest as proposal, unevidenced as stigmergy.
- **C2, C5 vs R0-B.** Both cap spans at ≤5 lanes/makers; R0-B says the 3–7 span limit *"dies for workers"*. Any cap should come from R0-A's verifier/MAST data, tuned.
- **C4 and C5 are consistent:** C4 reads the 85% simulation figure correctly as survey test–retest, not purchases, and its promotion path matches R0-E #16; C5 matches R0-B on Haier and M&M with closure.
