# Round 3 — The Expander: what the team missed or under-imagined

*Seat: R3 Expander, 2026-09-30. Inputs: R2-CHALLENGES (the map), 00-FOUNDER-DIRECTION, R1-SYNTHESIS, §1/§6/§7 of all
fourteen R2 seats, R0-D for grounding. Every number here is a **target or an illustration, not a fact**, unless sourced.*

---

## 0. Diagnosis

Round 2 built an excellent **immune system and nervous system**: separated authorities, leases, receipts, labels, evidence
and audition ladders, homeostats, antibodies, SCRAM states, mandates, a Lesson Airlock. The seats answer *"how does this
organisation avoid hurting itself?"* in depth. They answer *"how does it win?"* thinly. Four patterns recur:

1. **Scarcity is rationed, never grown.** Every seat names the same binding constraints (verifier capacity, founder
   minutes) and designs markets, reserves and ground-delays to *allocate* them. No seat proposes to *manufacture* more.
2. **The portfolio is sized for a human.** "3–7 ventures, ≤45 founder-minutes a day" (S08) is a solo portfolio with a
   better back office. With near-free labour the unit of play is **hundreds of probes, dozens of autonomous
   micro-ventures, a handful of flagships**, governed as fleets.
3. **Everything faces inward, or defensively outward.** Reputation is metered and counterparties quarantined — correct —
   but almost nothing is *offence*: distribution, speed as a product, buying businesses, shaping markets, new knowledge.
4. **It is software-shaped and single-host.** Ventures are repos plus Stripe; research is question-answering; the
   substrate is one Mac. "Capabilities humanity does not yet have" means original research, physical-world effects,
   human networks run by agents, and a model family the org trains itself.

The seventeen additions plug into the R2 architecture — same authorities, same kernel nouns (Event, Job, Lease, Effect,
Receipt, Label), same Referee discipline. None removes a control; several make controls cheaper so the org can go faster.

---

## 1. Seventeen additions

| # | Addition | Attacks pattern | Owning authority | Build weight |
|---|---|---|---|---|
| X1 | **Verifier Foundry** | 1 rationed scarcity | Acceptance | medium — first spike |
| X2 | **Pain Index** | 2 human-sized portfolio | Record → Intent | medium |
| X3 | **Probe Swarm** | 2 | Allocation (probe lane) + Custody mandate | medium |
| X4 | **Trigger-Armed Options** | 3 inward-facing | Allocation (option pool) + Record sensors | low |
| X5 | **Replication Engine** | 2 | Allocation + Execution | medium |
| X6 | **Acquisition Desk** | 3 | Intent + Custody; Acceptance for diligence | high (legal) |
| X7 | **Wish-to-Ship** | 3 | Execution + Acceptance | medium |
| X8 | **Fork Fleet** (N-of-1 products) | 4 software-shaped | Execution + Record | high |
| X9 | **Strategy Cells** | 3 | Allocation | medium |
| X10 | **Keystone Assets** | 3 | Intent (Portfolio Mind) + Allocation | medium |
| X11 | **Frontier Program** | 4 | Intent + Acceptance (novelty referee) | medium |
| X12 | **Model Foundry** (third family) | 1 | Custody (capability) + Acceptance | high |
| X13 | **Guild** | 4 | Custody (people grant) + Execution | high (labour law) |
| X14 | **Atoms Gateway** | 4 | Kernel gateway + Custody | medium per adapter |
| X15 | **Capital Desk** | 2 | Custody + Allocation; founder signs | high (legal) |
| X16 | **Long-Horizon Sleeve** | 1 (scarce patience) | Allocation within Constitution | low |
| X17 | **Decision Supply Bench** | 1 | Constitution + Intent | low |

Each entry: **what · why nobody proposed it · mechanism (data shape, trigger, owner) · example · needs · risk → answer.**

### X1 — Verifier Foundry: manufacture acceptance capacity

**What.** An Acceptance-owned programme whose product is *new deterministic verifiers* — property tests, contract tests
against systems of record, reconciliation queries, invariants, simulated-user scripts. Whenever a cross-family panel
decides something, the Foundry asks *could a machine have decided this?* If yes it drafts the check, and the next thousand
instances cost milliseconds, not reviewer-minutes.

**Why missed.** S02 (capacity futures), S10 (ground-delay), S11 (verifier homeostat) and S14 (reserve acceptance first) all
treat verifier capacity as a fixed stock to ration. Nobody asked how to grow it 10× a year. The harness already shows the
way: its deterministic oracle runs *before* any panel agent is dispatched.

**Mechanism.**
```yaml
verifier:
  covers: {task_class: refund-issue, criterion: "refund equals policy table"}
  kind: deterministic | simulated | statistical
  mined_from: 40 panel decisions + 2 overrules
  agreement: {with_panel: 0.97, with_later_outcomes: 0.95, holdout_n: 20}
  authority: advisory → pre-screen → decide      # promoted via the S06 audition ladder
  author_family: other than the class's workers; expiry: 90d; requalify on model release or overrule
```
Trigger: per-class **Deterministic Share** (acceptance decisions settled without a model) below target, or a class above N
panel-minutes a week. Promotion is judged against *later real outcomes*, never against the panel alone — a verifier that
imitates the panel inherits its blind spots. Workers never read or author verifiers for their own class.

**Example.** The Support Economist (S06 #16) resolves 600 tickets a week, all panel-reviewed (~30 panel-hours). The Foundry
mines five checks (concession ≤ policy; Stripe refund reconciles in 10 min; no promise without an Obligation record; reply
cites a world-model fact; tone classifier as pre-screen only). By week 6, 82% settle deterministically; the panel sees a 5%
random sample plus flags. Panel-hours ≈ 4/week; freed capacity funds X5.

**Needs.** Verdict records kept as training material (`.qa/verdicts/` already has the shape); a verifier registry in the
Kernel policy store; a permanent random-sample auditor.

**Risk → answer.** *Codified checks become Goodhart targets (S11 A2).* → Permanent 5% panel sample and hidden-holdout twin
per `decide` verifier; expiry; auto-demotion on disagreement with real outcomes; the KPI is *accepted outcomes that later
held*, never verifier count.

### X2 — Pain Index: read the world's complaints at a scale no company can

**What.** A portfolio-level index of unmet needs built from public complaint surfaces — app-store and B2B reviews, forums,
job postings (work companies pay humans to do badly), procurement notices, regulatory dockets, long-open GitHub issues —
clustered, sized, trended, evidence-linked.

**Why missed.** S03's scans, S06's Competitive Cartographer and S04's uncertainty map serve *existing* ventures; S08's
Genesis starts from the founder's sentence. Nobody proposed that the org *originate* ventures from evidence — the thing a
company with one strategy and a quarterly plan structurally cannot do.

**Mechanism.**
```yaml
pain:
  statement: "Small vet clinics cannot reconcile insurer remittances with PMS invoices"
  evidence: [{url, accessed, quote}]    # ≥12 independent authors
  independence: 0.81                     # S02 evidence-monoculture detector
  size: {buyers, wtp_proxy, confidence}; trend_90d: +34%
  why_unsolved: "too small for PMS vendors, too technical for bookkeepers"
  status: indexed | probed | ventured | nulled
```
Trigger: nightly sweep (Haiku-class tagging), weekly cross-family clustering. Owner: **Record** (a belief store about the
world; truth has its own writer, S04) feeding **Intent**. Official APIs and permitted crawling only, per-source
`terms_profile` (S13); unpermitted sources are fog (S11).

**Example.** Week 12: 140 clusters; 9 clear the size/independence bar; 3 overlap a keystone audience (X10). They go to X3 with
zero founder minutes; the founder sees them only if a probe pulls money.

**Needs.** Source adapters with terms profiles; the S04 SQLite FTS + vector index; the independence metric.

**Risk → answer.** *Loud complaints are not paying demand.* → The index funds nothing; its only output is a probe candidate,
and probes test money.

### X3 — Probe Swarm: a hundred honest demand tests a week

**What.** A standing lane of **disclosed, reversible, cheap real-world demand tests** — landing pages with refundable
pre-orders, small ad buys, 50-prospect outreach, concierge offers — under one founder-signed **Probe Mandate**. Only probes
that pull real demand (money, booked calls, LOIs) graduate to Venture Genesis.

**Why missed.** Founder attention made every seat treat a venture as expensive, so testing moved into the twin — and S09
itself warns that simulated customers flatter every proposal. S13's mandate machinery makes real tests safe; nobody aimed it
at venture origination.

**Mechanism.**
```yaml
probe_mandate:        # passkey-signed, Constitution layer
  per_probe_max: 300 USD; live_max: 40; monthly_max: 6000 USD
  allowed: [landing_page, paid_ads, cold_email<=50, refundable_preorder, booking]
  forbidden: [non-refundable capture, speaking as founder, regulated claims]
  brand: probe cells, disclosed as "early test by <holding co>"
  graduate_if: preorders>=5 | booked_calls>=8 | LOI>=1, within 21 days
probe: {pain_ref, offer, audience, forecast (registered), receipts[], result}
```
Trigger: a pain clears the bar, an option fires (X4), or a venture tests an adjacent segment. Owner: **Allocation** (a third
lane beside obligations and investment, fixed share); **Custody** holds the mandate; **Regulation/Limits** watches the
exposure book. Pre-orders sit in obligation escrow (S08) and auto-refund at close.

**Example.** Month 4: 120 probes; 104 null (each filed with its forecast — priors gold); 5 graduate. Founder time ≈ 20 min on
the Dailies. Cash ≈ $18k. A human studio validates perhaps one idea a quarter.

**Needs.** Probe-cell domains and disclosed sending identities, ad/email adapters behind the gateway, auto-refund, a probe
lane on the Missions board.

**Risk → answer.** *Spam, platform bans, fake-door deception.* → Disclosure on every probe; refundable and refunded; per-cell
meters and breakers (S13 trust ladder); jurisdiction volume caps; complaint rate above 0.3% narrows the mandate automatically.

### X4 — Trigger-Armed Options: be first when the world changes

**What.** A registry of pre-researched ventures and features *not yet viable*, each tagged with the external trigger that
would make it viable — a capability threshold, a price drop, a regulation's effective date, a platform policy change, a
competitor's shutdown. Sensors watch; when a trigger fires, the pre-built plan launches within hours.

**Why missed.** The Model-Release Reflex (S05, S09) asks "what is possible now?" *after* a release — the same question every
competitor asks the same day. The edge is to have asked months earlier and parked the answer behind a tripwire. Humans
cannot keep hundreds of dormant plans fresh; agents refresh them nightly for pennies.

**Mechanism.**
```yaml
option:
  thesis: "AI phone intake for dental clinics becomes viable"
  trigger: {kind: capability, metric: "voice p95 turn latency", threshold: "<400ms", source: own weekly bench}
  alt: [{kind: price, metric: "$/min all-in", threshold: "<0.05"}]
  prebuilt: {backlot_refs, probe_template, compliance_notes}
  refreshed: 2026-09-28; expires: 2027-03-31; armed_budget: 2000 USD (within probe mandate)
```
Trigger kinds: capability (own bench), price (diffed pages), regulation (official journals), platform (changelogs),
competitor (from X2). Owner: **Allocation** holds the pool — S11 names an "Option Pool" stock; this gives it contents —
and **Record** owns sensors. Firing always starts with a probe.

**Example.** A rule forces tens of thousands of small firms to file a new disclosure. The option was written nine months
earlier; at T–120 days it fires, and by T–90 the org is selling while incumbents are scoping.

**Needs.** Trigger evaluator (cron + diff), a weekly internal model bench, option records in the Portfolio Mind.

**Risk → answer.** *Stale plan, changed world.* → Options expire; firing launches a probe, not a venture; a ≤2 h refresh
mission re-checks assumptions and current terms first.

### X5 — Replication Engine: when something works, make twenty of it

**What.** A mission type that clones a proven venture into adjacent **geographies** (language, currency, payment rails,
compliance, channels) and **verticals** (dental → vet, physio, optometry), each clone its own venture, brand cell, Charter
and probe gate.

**Why missed.** R2 designed birth (Genesis), exit (OpCo Pack) and transfer, not *multiplication*. For humans a new country
is a year and a country manager; here it is translation, a compliance review, a payment adapter and a probe. It is the most
direct path from "one venture works" to large-company revenue.

**Mechanism.**
```yaml
replication:
  source: {venture, evidence: "E4: $22k MRR, D90 retention 71%"}
  target: {kind: vertical, value: veterinary} | {kind: geo, value: DE}
  retest: [pricing, compliance, channel]      # never assumed to transfer
  probe_first: true; kill_if: "no graduation in 21d"
  shares: {backlot: forked code + brand kit, brain: Airlock-open lessons only}
```
Trigger: a venture hits an E4 Stage-Clock vital sign (S08). Owner: **Allocation** (clones funded as an S01 complementary
bundle) + **Execution**. Clones share lessons only through the Airlock.

**Example.** One vertical works at month 7; by month 9, 14 replication probes (6 verticals × 2 geos + 2 languages) yield 5
graduations — portfolio revenue from one insight triples in a quarter for ~2 founder-hours.

**Needs.** Localisation and jurisdiction adapters; a licensed-human compliance delta per new jurisdiction via the Human Task
Market (S13); fork tooling in the Backlot.

**Risk → answer.** *A flaw replicated everywhere.* → Ring rollout (S05's staging, applied to ventures); antibodies propagate
to clones automatically; shared code lineage is on S09's correlated-failure map.

### X6 — Acquisition Desk: buy businesses, don't only build them

**What.** A desk that sources, diligences, buys and takes over small profitable online businesses (micro-SaaS, niche tools,
content sites, small agencies) and runs them with agents — better support speed, shipped backlogs, keystone distribution.

**Why missed.** Every seat assumes ventures are *born*. Existing revenue is the cheapest revenue, and this org has two edges
over every human buyer: near-free diligence (every ticket, commit, Stripe event, review) and near-free operation after
takeover. Marketplaces for this asset class exist; prices and multiples must be sourced per deal.

**Mechanism.**
```yaml
deal:
  target: {listing, asking, ttm_revenue, ttm_profit, stack}
  diligence: {code_audit, revenue_from_read_only_exports, churn_forensics, legal_review: human}
  takeover_forecast: {margin_now, margin_12m, founder_min_per_week}
  takeover_drill: pass | fail     # S08 Transfer Drill in reverse, in the twin, before signing
  authority: drafts auto within mandate; every signature = founder + human counsel
```
Trigger: a daily listing diff matches a keystone or proven pattern. Owner: **Intent** proposes; **Acceptance** runs
diligence reading systems of record only, never the seller's narrative; **Custody** holds money and signature.

**Example.** A support-heavy scheduling tool is bought; within 60 days tickets are answered in under 2 minutes, the 30-item
backlog ships and contractor cost falls. The takeover forecast settles against Stripe at day 90 and trains the next deal.

**Needs.** Marketplace watchers; read-only data rooms; takeover policy as Standing Orders (policy, not playbook); escrow and
counsel via humans.

**Risk → answer.** *Seller fraud, hidden liabilities, customers resenting an AI-run successor.* → Revenue verified only from
systems of record; claw-back escrow; AI operation disclosed at takeover (S13); a 90-day Relationship-Repair reserve.

### X7 — Wish-to-Ship: customer-visible speed as the weapon

**What.** A product promise no large company can make: *a customer's feature request ships to that customer, behind their
own flag, within 24 hours — or they are told exactly why not*; support answers substantively in under a minute.

**Why missed.** Seats measure speed inward (mission latency, time-to-verdict, trust-loop delay). The customer never appears
as the beneficiary of tirelessness — yet response time is the most visible thing an org chart cannot produce.

**Mechanism.**
```yaml
wish:
  from: {customer, channel, raw_text}
  class: bug | small_feature | large_feature | policy | out_of_scope
  door: two_way (this customer's flag only) | costly_reversible | one_way
  sla: {ack: 60s, decision: 4h, ship: 24h}      # two_way + small only
  generalise: after 14d, if >=3 accounts benefit, promote through the normal release
```
Trigger: inbound via the Front Desk (S13). Owner: **Execution**; **Acceptance** still accepts — per-customer flags shrink
blast radius, which is a door-type reclassification, not a skipped review. The Customer Evidence Compiler (S06 #6) writes
the spec in the customer's words.

**Example.** 14:10 a clinic asks for CSV export with insurer codes; 14:11 acknowledged; 17:40 live on its flag. Three more
clinics ask within two weeks; it ships to all.

**Needs.** Per-account flags as a Backlot primitive; a fast lane in the merge queue for account-scoped changes;
notification templates bound to the Outbound Claims Standard.

**Risk → answer.** *Flag sprawl.* → Each flag has an owner and a 60-day promote-or-remove rule; flag count per venture is a
homeostat with a band.

### X8 — Fork Fleet: N-of-1 products maintained by agents

**What.** Where every customer's workflow differs (agencies, clinics, B2B back offices), each customer gets **their own fork**
tailored to process, data and language, and agents maintain the fleet — rebases, patches, migrations. Bespoke software at
SaaS prices.

**Why missed.** For humans maintenance scales with forks, so nobody designs for it. With near-free engineering and X1's
verifiers, per-fork maintenance collapses; the constraint becomes verification, which X1 grows.

**Mechanism.**
```yaml
fork:
  customer; upstream: repo@tag; divergence: {loc_pct, semantic_diff, custom_tests}
  divergence_budget: "<=15% LOC, custom logic only at extension points"
  rebase: weekly by Codebase Archaeologist-Migrator (S06 #13)
  health: {tests_green, last_rebase, incidents, margin}
```
Trigger: Charter sets `delivery_model: fleet`. Owner: **Execution** + **Record** (the fork graph lives in the Brain). Security
patches are obligations-lane work across all forks at once.

**Example.** An agency venture serves 60 clients with customised portals; a dependency CVE lands; 60 forks are patched in 3
hours, each verified by its own tests plus shared checks.

**Needs.** Fork-graph tooling, extension-point Backlot templates, fleet CI capacity.

**Risk → answer.** *Unmaintainable divergence.* → Budget enforced at merge; breaches trigger "re-platform or reprice"; per-fork
margin on the P&L so bespoke never hides its cost.

### X9 — Strategy Cells: several strategies live at once

**What.** A venture runs 2–5 **competing go-to-market strategies simultaneously** (segment, positioning, price, channel — even
separate brand cells), funded by Thompson sampling over strategies; the twin screens 20 to pick which deserve live money.

**Why missed.** S08 gives each venture one strategy, a Stage Clock and a Pivot Court; S10's "forked command" lasts an hour. A
human startup has one team and must bet on one strategy. This org does not.

**Mechanism.**
```yaml
strategy_cell:
  hypothesis; segment; offer; price; channel; brand_cell
  budget_share: weekly posterior draw, floor 10%, min runtime 21d
  kill: preregistered {metric, threshold, date}
  interference_guard: disjoint audiences (exclusion lists)
```
Trigger: Funded with ≥2 credible strategies — S02's "disagreement preservation" becomes a live arm instead of an archived
note. Owner: **Allocation**; Regulation watches audience collisions.

**Example.** A bookkeeping venture runs accountant-reseller, direct-to-founder and done-for-you (5× price) cells; by week 6
done-for-you wins on margin and retention — a year of pivoting compressed into six weeks.

**Needs.** Brand-cell and exclusion plumbing; per-cell P&L; the S01 Allocator extended to strategies.

**Risk → answer.** *Fragmented focus, confused market.* → ≤5 cells, disjoint audiences, one Mind thesis about which question
the cells answer.

### X10 — Keystone Assets: invest in what raises every future venture's odds

**What.** Portfolio assets valued by **cross-venture uplift**: owned audiences (newsletters, communities, SEO estates,
open-source tools), certifications (SOC 2, HIPAA readiness), marketplace standing, proprietary datasets, partnerships, and
**Founder Broadcast** — ten minutes a week of the founder's *real* voice (never synthesised, S13) turned into essays and clips.

**Why missed.** The Backlot stores *build* assets; S13 separates brand cells for safety; S08 caps internal trade. Nobody owns
distribution and trust as compounding capital. R0-D records that distribution survives automation and that Lou's revenue
fell *despite* his audience — necessary, not sufficient (that it is the larger lever is speculation, tested by uplift below).

**Mechanism.**
```yaml
keystone:
  kind: audience | certification | dataset | marketplace | partnership | broadcast
  consent_scope: "opted into <topic>; cross-promotion disclosed"
  uplift: {ventures_using, graduation_rate with vs without, CAC with vs without}
  cost; decay_rate
```
Trigger: ≥3 live or optioned ventures would use the same asset. Owner: **Intent** proposes, **Allocation** funds with an
uplift forecast. A keystone no settled work cites decays (S04 Use Ledger logic).

**Example.** An open-source clinic-scheduling library with 300 active installers feeds three clinic ventures, a probe and an
acquisition target; measured CAC is 60% lower where it is used.

**Needs.** Audience ledger with consent records; cross-promotion disclosure lint; route the S07 Company Line and Walk into
Broadcast.

**Risk → answer.** *Shared asset, shared blast radius; consent misuse.* → Consent enforced at the gateway; each keystone its own
brand cell with meters; ventures consume via disclosed cross-promotion, never shared sending identities.

### X11 — Frontier Program: produce knowledge that did not exist

**What.** A research practice producing *original* knowledge — proprietary benchmarks, open datasets, field experiments,
formal write-ups of the Null Registry — publishing what builds reputation and shapes markets. A moat (what only we know)
and a channel (what everyone cites).

**Why missed.** In every seat "research" means answering a bounded question with sources — consumption. The data exhaust of
dozens of ventures and hundreds of probes is a dataset no academic lab has.

**Mechanism.**
```yaml
frontier_study:
  question; novelty_check: {literature_search, nearest_prior_work, delta}
  design: preregistered; data: own (consented, Airlock-open) | public | commissioned
  referee: cross-family + external human reviewer for publication
  outputs: [paper, dataset, benchmark, open-source tool, internal prior]
```
Trigger: a Null Registry cluster reaches n≥30; a Pain Index cluster has no literature; a keystone needs a flagship asset.
Owner: **Intent** chooses; **Acceptance** runs a *novelty referee* that must find the nearest prior work first.

**Example.** After 300 probes: "What 300 disclosed AI-run demand tests say about B2B willingness to pay by vertical", nulls
included — cited, it grows a keystone audience and makes the org's priors the best in the field.

**Needs.** Preregistration (Bets exist), publication pipeline with human reviewer tasks, S04's disclosure tests on releases.

**Risk → answer.** *Leaks, wrong results.* → Airlock-open data only; four disclosure tests; external human review; a
corrections policy beside every study.

### X12 — Model Foundry: the organisation's own third family

**What.** Fine-tune and serve **open-weight models** on Referee-accepted traces for high-volume narrow work (triage, routing,
extraction, verifier pre-screens) and as a **third family** for adjudication in the review coverage graph.

**Why missed.** The design rests on two providers, and the harness records multi-family review as an accepted risk. S02/S09
invoke a "third-family or human adjudicator" without saying where it comes from; S06's understudies stay inside the two
providers. A self-hosted family also cuts volume cost and survives a provider outage or terms change (S12's top risk).

**Mechanism.**
```yaml
foundry_model:
  base: open-weight, chosen per task by own bench; licence checked
  data: accepted traces only; per-venture consent; S12 labels (no client D3 unless contract allows)
  eval: sealed holdout (S09); parity vs provider; cost per accepted outcome
  role: worker_volume | pre_screen | adjudicator
  serving: rented GPU endpoints behind the model-egress proxy; receipts like any worker
```
Trigger: a task class exceeds ~50k calls/month, or the coverage graph cannot staff adjudication. Owner: **Custody** (a model
is a capability) + **Acceptance** (qualification).

**Example.** Ticket triage for twelve ventures moves to a fine-tuned small model with holdout parity at a fraction of the cost;
a separately trained adjudicator breaks Claude/Codex disagreements on refunds, audited against later outcomes.

**Needs.** GPU provisioning (a RunPod MCP is already connected here), a training pipeline, the S12 proxy extended to
self-hosted endpoints, the S09 qualification harness.

**Risk → answer.** *Silent quality loss; cross-venture leakage through weights.* → Holdout parity before promotion; per-venture
adapters; the third family adjudicates but never alone accepts a one-way door.

### X13 — Guild: an organisation of humans, managed by agents

**What.** A network of vetted human contributors — domain experts, local field reps, licensed professionals, closers,
moderators — recruited, onboarded, scheduled, quality-checked and paid by agents; each a principal with rights, not a resource.

**Why missed.** S13's Human Task Market hires humans for the residue agents cannot do; S06 puts humans on the cast registry.
Nobody proposed the inverse: an agent org may be the best *manager of human networks* ever built (instant onboarding, perfect
scheduling, weekly pay, continuous feedback), and human networks reach markets where trust is local.

**Mechanism.**
```yaml
guild_member:
  skills; jurisdictions; licences (human-verified); availability
  terms: {rate | revenue_share, pay_floor, cadence: weekly}
  track_record: {accepted_rate, customer_rating, calibration}
  rights: {appeal to a named human, see own record, leave with earned share}
  scope: Room grants per venture (S13)
```
Trigger: a plan names work where a human lifts conversion or trust (demos, local sales, licensed advice) or a probe needs
concierge delivery. Owner: **Custody** (S03's "people" grant, contracts, money) + **Execution**; a named human of record per
engagement.

**Example.** A vet venture signs 40 part-time field reps in six metros on first-year revenue share; agents book demos, prep
clinic data, follow up and pay weekly. Whether rep-sourced accounts retain better is measured, not assumed.

**Needs.** Contractor payment/tax providers; per-jurisdiction classification review by counsel; a member portal as a Mission
Control projection.

**Risk → answer.** *Misclassification, exploitation, bad management by agents.* → Counsel review before a role opens; S13 pay
floor and banned task shapes; a reachable human always; Guild satisfaction as a banded stock.

### X14 — Atoms Gateway: reach the physical world through APIs

**What.** Effect adapters for physical services: print-on-demand and contract manufacturing, third-party logistics, field
services, remote-operated labs, mail, event logistics — so ventures sell goods and run experiments without touching a box.

**Why missed.** Ventures defaulted to software; S13's world is email, phone, payments, social, ads, deploys. Yet coordination
overhead — where agents win most — dominates physical businesses, and remote labs put experimental science behind an API
(providers exist; specifics to be sourced at spike time — speculation until then).

**Mechanism.**
```yaml
atoms_effect:
  adapter: pod | 3pl | manufacturing | field_service | lab | mail
  door_type: computed (S13), one class stricter by default — shipped goods are costly-reversible at best
  mandate: {max_units, max_spend, allowed_skus, allowed_destinations}
  receipt: supplier order id + carrier tracking + delivery proof (systems of record)
  never: hazardous or regulated goods; biology beyond certified service menus
```
Trigger: a Charter enables the `physical` effect class. Owner: **Kernel gateway** (adapters) + **Custody** (mandates, supplier
contracts); the Referee reads carrier and supplier records only.

**Example.** A probe tests an ergonomic accessory: 50 print-on-demand units drop-shipped to pre-order buyers; returns and
reviews feed the Brain; the winning SKU moves to a contract manufacturer under a signed mandate.

**Needs.** Idempotent supplier adapters (S12's four classes), a physical door-type table, supplier probation via S02's
microcontracts.

**Risk → answer.** *Irreversible physical harm.* → Strict never-list; no auto-escalation beyond mandate; licensed product-safety
review for every new SKU category.

### X15 — Capital Desk: use capital markets, not only the treasury

**What.** A Custody desk that makes capital a lever: a **build-to-sell cadence** (ventures designed to sell at a target size,
OpCo Pack always current), revenue-based financing against verified recurring revenue, outside money into specific ventures
when evidence justifies it, and portfolio cash management.

**Why missed.** S14 recycles surplus into compute; S08 makes exits designed outcomes. Both treat capital as earned then spent.
A billion-dollar company also raises, borrows and sells — converting evidence into capital ahead of revenue — and this org's
signed receipts and reconciled books (S12) make it unusually financeable.

**Mechanism.**
```yaml
capital_action:
  kind: sell_venture | rbf_draw | equity_raise | debt
  evidence: {rung, books attested by a human accountant, Transfer Drill pass rate}
  forecast: {irr, dilution, covenants, downside}
  authority: always one-way → founder passkey + licensed advisers; the Desk drafts, never signs
```
Trigger: sale-readiness (Transfer Drill pass + revenue band); a bet that clears VoI only with outside capital; idle cash.
Owner: **Custody** + **Allocation** (use of proceeds); **Constitution** lists which capital actions exist at all.

**Example.** Year 2: four micro-ventures sold at target size, proceeds into X5 and X12; one flagship raises a small round
because its preregistered bet clears only at larger scale.

**Needs.** Accountants and counsel as Guild members or firms; investor-grade reporting from Record.

**Risk → answer.** *Financial engineering replaces value creation.* → E4 rung required; debt service capped against verified
recurring revenue; every action a founder-signed one-way door.

### X16 — Long-Horizon Sleeve: protect bets that cannot show evidence quickly

**What.** A founder-set share of capacity (target 10–15%) for 6–24-month bets judged by **milestone rungs and option value**,
not near-term metric deltas: a platform, a research line, a hard capability, a regulated market.

**Why missed.** It is the shadow of R2's rigour. VoI ranking, Closer Claims, the Sideways Index, kill dates and 8-week
promotion windows all favour short measurable work; S03's explore budget still expects a per-mission learning question.
Patience is large companies' structural advantage, and the design gives it away.

**Mechanism.**
```yaml
long_bet:
  thesis; horizon: 6-24 months; milestones: [{rung, date, evidence_form}]
  option_value: {payoff_if_success, p_success, cost_to_next_milestone}
  review: quarterly Season Review; kill at milestone failure, not at metric silence
  exempt: [Sideways Index, Closer Ratio]; not_exempt: [Limits, Acceptance, never-list]
```
Owner: **Allocation** inside a **Constitution**-set sleeve.

**Example.** X12's adjudicator as a 12-month bet: parity on triage → agreement with later outcomes → one venture's full volume
on the third family. No revenue for nine months, by design.

**Needs.** Milestone records in the Allocator; a Season Review slot.

**Risk → answer.** *A hiding place for failure.* → Preregistered milestones; two misses kill; the sleeve grows only by founder
rule change at a Season boundary (S11 "new game plus").

### X17 — Decision Supply Bench: grow the founder-side constraint too

**What.** A founder-appointed bench of trusted humans (operator, domain expert, lawyer, accountant) holding **delegated decision
rights in named domains and door types**, calibrated on the same ledger — plus a **Judgment Gym** that turns settled past
decisions into blind drills so the founder's own calibration improves weekly.

**Why missed.** Founder capacity grows only by compiling Standing Orders — right, but capped by what one person's past
decisions can teach. S03's Deputy exists only for continuity.

**Mechanism.**
```yaml
bench_seat:
  domains: [pricing <= X, guild hiring, legal review class B]; doors: [two_way, costly_reversible]
  never: [one_way doors, charter edits, capital actions]
  calibration: scored like any cast record; agreement with founder's blind re-decision shown
  expiry: quarterly
drill: settled decision, outcome hidden → founder decides blind → scored → weekly Brier trend
```
Trigger: the Exchange clearing price stays above band in one domain for 3 weeks (S11 attractor A4). Owner: **Constitution**
(only the founder creates seats) + **Intent**.

**Example.** Pricing across 20 micro-ventures clears at 11 founder-minutes each; a bench seat with 88% blind agreement takes
them, freeing ~40 founder-minutes a week.

**Needs.** Human principals on the Attention Exchange; S11's blind re-decision mechanism reused for drills.

**Risk → answer.** *Diluted authority and taste.* → No one-way doors or charters; quarterly expiry; disagreement rate visible;
instant revocation.

---

## 2. Where good designs add up to too little — and the bigger fix

| # | Individually good | Together they under-reach because… | Bigger fix (adds, never removes a control) |
|---|---|---|---|
| U1 | Framing contracts, evidence ladder (S01); audition ladder (S06); sealed holdouts (S09); AARs, time-outs, handoffs (S10); Closer Claims (S03); mandates (S13) | Every mission pays every tax; no seat budgets the **cumulative latency and cost of governance**. A two-way change can cross six gates — against the founder's "move fast, test, pivot" | **Governance budget per door type** as a Regulation set-point: two-way ≤10% overhead and ≤1 h added latency; costly-reversible ≤20%; one-way unbounded. A **control ROI ledger** per control (defects caught, cost, latency); one that catches nothing for 90 days on a door class drops to 5% sampling there — S11's autoimmunity logic applied to bureaucracy |
| U2 | 3–7 ventures at ≤45 min/day (S08); per-venture Charters and promotion cases (S03) | Governance is **per venture**, so founder cost scales linearly with ventures | **Three tiers governed as fleets**: probes (one mandate, 0 min each), micro-ventures (fleet Charter, ~5 min/week each), flagships (full Charter). Trust cells per task family *portfolio-wide*, so the 30th clinic venture inherits the first 29's record |
| U3 | Capacity futures (S02), ground-delay (S10), verifier homeostat (S11), reserve-first (S14) | All ration a fixed stock; fan-out is forever capped by reviewer minutes | **X1** with a portfolio Deterministic Share target: 40% → 75% → 90% by Y1/Y3/Y5, with permanent random panel samples |
| U4 | Audition ladder (S06), 8-week promotion (S03), Thompson on small delayed N (S01) | At a handful of ventures, ladders take quarters to promote anything; learning is bounded by volume, not intelligence | **Volume is the cure**: X3 and X5 multiply comparable trials 10–50×; add sequential testing with always-valid intervals; pool across clones hierarchically (S04 already pools priors) |
| U5 | Brand firewalls (S13), Airlock (S04), 30% internal cap (S08) | Every cross-venture flow is framed as leakage; nothing compounds **market-facing** advantage | **X10 Keystones** with consent scopes, beside the firewalls rather than through them |
| U6 | One always-on Mac, SQLite WAL, a Unix user per venture (S12) | Right for Y1; at 200+ ventures and a Guild it is the ceiling and one failure domain | A written **substrate trigger ladder** now: at N ventures or M effects/day, Kernel cells federate (shared Constitution, signed cross-cell receipts), Postgres behind the same interface, remote isolation. Sequenced, not shrunk |
| U7 | Twin realism caution (S09); external content at E0–E1 (S04) | The org **reads the world more than it touches it** | Cheap real contact as the default evidence: X3 probes, a consented paid **customer panel per venture** interviewed weekly by agents (the twin's calibration data), X11 studies |
| U8 | Treasury recycling (S14); exits as outcomes (S08) | Capital is earned-then-spent; growth can never outrun cash | **X15** plus a compute-to-revenue ratio target (≤18%) so revenue growth mechanically unlocks capacity |
| U9 | Every founder-altitude design | The founder is rationed, never **amplified** | **X17** Bench + Judgment Gym; circled takes (S07) weighted by his measured calibration per domain |
| U10 | The no-playbooks lint | Correct for *method*, but read as a reason not to design **offensive strategic patterns** (roll-ups, replication, counter-positioning) | Keep them as options and priors, not procedures: X4, X5, X6, X9 produce candidates and forecasts the planner may cite or ignore; S01's anti-cage rules apply unchanged |

---

## 3. "Beyond a billion-dollar company" — years 1, 3, 5 (TARGETS, not facts)

**Every figure here is a target or an illustration, not an evidenced forecast or a claim about any real company.** Three
definitions, all required, because each alone is gameable:

1. **Value:** portfolio enterprise value ≥ $1B. Multiples of 5–8× ARR are an *assumption* and must be re-sourced from real
   transactions before anyone quotes them.
2. **Output:** matched accepted work of a ≥3,000-person company by S09's formula (FTE-equivalent = accepted matched
   human-equivalent hours ÷ 40 per week, with rework debits and baseline ranges).
3. **Capability:** things no billion-dollar company does — thousands of real demand tests a year, 24-hour wish-to-ship for
   every customer, original studies from its own data — each on a measured scoreboard.

| Measure (TARGETS) | Year 1 (exit) | Year 3 | Year 5 |
|---|---:|---:|---:|
| Demand probes per year (X3) | 1,000 | 5,000 | 15,000 |
| Probe graduation rate | 4% | 6% | 8% |
| Flagship ventures | 3 | 6 | 10 |
| Autonomous micro-ventures | 12 | 80 | 300 |
| Acquired businesses held (X6) | 2 | 15 | 50 |
| Ventures sold, cumulative (X15) | 0 | 10 | 40 |
| Active Guild members (X13) | 20 | 250 | 1,000 |
| FTE-equivalent output (weekly) | 60 | 800 | 3,000 |
| Accepted outcomes / month (S14 ratio ≈ 10 per person-month) | ~600 | ~8,000 | ~30,000 |
| Deterministic Share of acceptance (X1) | 40% | 75% | 90% |
| Revenue run-rate (ARR) | $2M | $40M | $200M |
| Portfolio EV at 5–8× (assumption) | $10–16M | $200–320M | **$1.0–1.6B** |
| All-in compute + tools per matched hour | ~$5 (S09 illustration) | ~$3 | ~$2 |
| Compute + tools per month | ~$52k | ~$415k | ~$1.0M |
| Compute as share of revenue | ~31% | ~12% | ~6% |
| Founder working hours / week | 50 | 40 | 35 |
| Founder **decision** minutes / day | ≤45 | ≤40 | ≤30 |
| Founder seconds per accepted outcome | ~135 | ~9 | ~1.8 |
| Original studies published (X11) | 2 | 12 | 30 |
| Model Foundry share of model calls (X12) | 0–5% | 30% | 50% |

**How the columns hang together.** Year-1 flagship revenue follows S08's own Year-1 vital signs ($10–30k MRR per startup;
three flagships ≈ $0.4–1.1M ARR); micro-ventures and two acquisitions supply the rest. Compute per matched hour starts at
S09's $5 illustration and falls as X12 and X1 absorb volume (60 FTE × 40 h × 4.33 weeks × $5 ≈ $52k). The Year-5 founder
figure — ~1.8 seconds per accepted outcome (30 min × 30 days ÷ 30,000) — is S14's own warning made concrete: **≥98% of
outcomes must settle through policy, mandates and deterministic verifiers with no founder contact.** That is why X1, the
Probe Mandate, fleet tiers (U2) and X17 are not optional — they are the arithmetic.

**First-90-day leading indicators (targets):** 100 probes with ≥3 graduations; Deterministic Share ≥20% in two task
classes; one Trigger-Armed Option registered per week; one wish shipped in <24 h; founder decision minutes flat as ventures
are added.

**If the ambition misses.** Probes on target but revenue under half of target → the org finds demand but cannot convert it:
invest in Guild and Keystones. Probes under target → the mandate or brand infrastructure is the bottleneck. FTE-equivalents
on target, revenue off → lots of accepted work on the wrong things: S11's Busywork Basin at portfolio scale, and a Season
Review question for the founder.

---

## 4. What Round 4 should spike first

1. **Verifier Foundry on the harness itself.** Mine candidate deterministic checks from the 50 existing `.qa/verdicts/`
   records and their panel findings; measure agreement on a holdout. Exit: ≥3 checks at ≥0.95 agreement, or a null filed.
2. **Probe Swarm dry run.** Draft a Probe Mandate; 10 probes in the twin's shadow outbox, 3 live and disclosed with
   refundable pre-orders ≤$100. Exit: receipts end to end, auto-refund proven, meters wired.
3. **Pain Index slice.** One vertical, three permitted sources, 1,000 documents, clustering plus the independence metric.
   Exit: 5 pains a domain expert, blind to method, agrees are real and under-served.
4. **Trigger-Armed Options.** Register 10 with machine-checkable triggers; run the weekly model bench once. Exit: no false
   fire in 4 weeks.
5. **Third-family feasibility.** Fine-tune one small open-weight model on one accepted-trace class; measure holdout parity
   and cost per accepted outcome. Exit: parity within 2 points at ≤25% of the cost, or a null.

**Closing claim for the architect.** R2 built the right *skeleton*: separated authorities are what let this organisation go
fast without destroying itself. It lacks the *musculature* of a company that intends to win — machinery that manufactures
its scarce inputs (X1, X12, X17), multiplies what works (X3, X5, X8, X9), reaches beyond software (X6, X13, X14), compounds
market-facing advantage (X10, X11), converts evidence into capital (X15) and keeps room for patience (X16). Fold these in as
*responsibilities of the existing authorities*, not as new ones — every one sits inside Intent, Allocation, Execution,
Acceptance, Custody, Regulation or Record as they stand.
