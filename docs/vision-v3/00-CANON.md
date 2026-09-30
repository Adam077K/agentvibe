# 00 — CANON: the single source of truth for v3

*Chief architect, Round 5, 2026-09-30. Every v3 section file obeys this document. Where a seat, spike, engineering spec or
earlier round disagrees with it, this file wins until the founder changes it. Binding above it: `00-FOUNDER-DIRECTION.md`.*

## 0. How to use this file

- **Reading budget.** Read §0–§4, §8 and §10 whole (~25 KB). The glossary (§5, ~180 terms) and the decisions register
  (§6, 83 entries incl. the R5 fix-pass rulings DR-56–DR-83) are reference: search them for your topic's terms rather than reading them end to end.
- **Terms.** Use the words in §4–§5 exactly. If you need a new term, define it in your file's glossary box and say which
  §5 entry it refines; never re-define a §5 term.
- **Conflicts.** §6 settles every conflict the rounds raised. Do not reopen one. If your topic exposes a *new* conflict,
  resolve it upward (bigger, not smaller), mark it `NEW DECISION` in your file, and the architect folds it back here.
- **Numbers.** Every number is a **target**, an **illustration**, a **measurement** (with its source) or a **parameter**
  (initial value, to be tuned). Say which. Never invent a number about a real company.
- **Ownership.** §8 says which file owns each topic. Mention another file's topic in one line and link to it; do not
  re-specify it. Two descriptions of one mechanism disagree silently — the harness learned this the hard way.
- **Ambition.** The destination is not shrunk. Sequencing belongs in `14-BUILD-PLAN.md`; the other files describe the
  full organisation and mark what is Year 1 versus later only where it matters.

## 1. The organising principle

> **Separate the powers, compile them into one answer, and grow the scarce inputs.**
>
> 1. **Separate** — no agent both *wants* something, *funds* it, *does* it, *checks* it, *records it as true*, *holds the
>    keys* for it, and *brakes* it. Seven authorities each hold one of those powers, under one founder-written
>    Constitution.
> 2. **Compile** — separation must not become paralysis. Every consequential action is compiled, against one policy
>    snapshot, into one **Decision Contract** with a fixed precedence order. The founder sees one answer, never eight.
> 3. **Grow** — the binding constraints (verification capacity, founder judgment, capability, trust, cash) are not only
>    rationed; each has an owner whose job is to *manufacture more of it* every week.
>
> Everything learned flows back as tested policy, reusable assets, verifiers and calibrated priors — **the Compounding
> Organisation**. The practice it enables is **vibe startuping**.

Why three clauses. Round 1 gave clause 1 (four authorities; R1-SYNTHESIS). Round 2 grew it to eight candidate powers.
The red team (R3, C01 and X02) showed that eight separated powers with no compiler produce unexecutable decisions and a
truth-forging Custody. The expander (R3 §0) showed the whole design guarded well and under-reached on winning. Clause 2
answers the first; clause 3 answers the second.

## 2. The authority stack

**One founder. One Constitution. Seven authorities.** The Constitution is not an agent: it is signed data plus a
compiler in the Kernel, and only the founder's passkey writes it. The seven authorities are *roles held by records and
stores*; any Claude Code or Codex session launched into a role gets exactly that role's powers and no others. No
authority is a standing process.

The founder remembers them as seven verbs: **Want · Fund · Do · Check · Know · Hold · Brake**.

| # | Authority (verb) | Owns | May | May never | Overruled by |
|---|---|---|---|---|---|
| 0 | **Constitution** (the law) — founder's pen | Charters, autonomy levels and grant vectors, the never-list, the decision-rights matrix, the Continuity Will, precedence order, set-point ceilings, the protected computing base and its release authority | Define and amend every limit and right (founder passkey only, bound to a displayed canonical action); compile the Decision Contract; name deputies | Fund, start, execute, accept, or change itself without the founder's fresh passkey | **Founder only.** No authority, level, deputy or continuity tier may widen it; succession can only narrow it |
| 1 | **Intent** (Want) — Venture Minds, Portfolio Mind; the Co-founder seat loads them | Thesis, root goal (proposes), goal tree below intent, opportunity order, wagers, dissent register, proposed Standing Orders, Keystone and Frontier agendas | Propose missions and Initiative Proposals with Closer Claims; open investment missions at ≥A2 inside its envelope; disagree with the founder via wagers; run the weekly board | Fund beyond its envelope; accept or settle anything (including its own wagers); write canonical facts; move money; hold credentials; edit its own charter | Founder; Constitution bounds it; Allocation may decline to fund; Regulation may throttle initiative |
| 2 | **Allocation** (Fund) — the Allocator; the Founder Attention Exchange | The four resources (cash, subscription allowance, API throughput, founder minutes) plus verifier windows; the lanes and sleeves; tranches; reserves; shadow prices | Reserve obligations, acceptance and recovery first; rank question-shaped work by value of information; size tranches by Thompson sampling; clear the Attention Exchange; hold launch admission when verification cannot absorb output | Launch or execute; accept; set its own limits; widen an envelope; spend money directly (Custody disburses) | Founder (envelopes); Constitution (ceilings); Regulation (narrows); Acceptance verdicts it cannot revise |
| 3 | **Execution** (Do) — missions, teams, Mission Leads, workers of both families | Missions in flight, team shape and composition, leases, integration queue proposals, the blackboard, Wrap Deposits | Choose shape, cast and model family inside the funded tranche; propose effects; acquire fenced leases; call any admitted tool in its Loadout; declare a mission novel and run recipe-blind | Hold credentials; perform an external effect itself; accept its own work (self-review never counts); write canonical facts; extend its own tool lease | Acceptance (rejects); Regulation (stops); Custody (refuses effects); Allocation (defunds); founder |
| 4 | **Acceptance** (Check) — the Referee function, the Verifier Foundry, the observation broker | Acceptance Coverage Contracts, verdicts, merge decisions, settlement of Closer Claims, wagers and forecasts, the Calibration and Progress Ledgers, the verifier registry | Run deterministic verifiers first, then cross-family judges; read systems of record through its *own* credential-less observation broker; move a board card to Done; demand adjudication; mine new verifiers from panel decisions | Produce the work it judges; fund; write effects; let a producing lineage choose or shop for its reviewer; rank across generating models by absolute score | **Nobody can turn a FAIL into a PASS.** The founder may *overrule* (logged as overrule, counted by the deviance monitor, never as acceptance); material disagreement goes to adjudication |
| 5 | **Record** (Know) — the Brain, the Journal, the Use Ledger, Sleep | What the organisation believes is true (typed facts with provenance, bi-temporal), the event journal, metric mirrors, the Priors Library and Null Registry, lineage, retention and forgetting | Accept deposits as proposals; promote through Sleep with cross-family supersession checks; propagate labels transitively; decay, invalidate, redact, forget, quarantine under retention class; run the Lesson Airlock | Intend, fund or execute; declassify tainted data by citing it; let a settled citation raise a source's authority; delete an obligation | Acceptance settles disputed facts; founder may order governed forgetting (an effect), never rewrite history |
| 6 | **Custody** (Hold) — isolated effectors under one policy: Treasury, Key Vault, Capability Registry, Effect Gateway, Front Desk | Money and books, signatures and legal identity, credentials, capability admission and tool grants, Effect Mandates, outward identities and reputation meters, inbound quarantine | Execute an effect **only** against a compiled Decision Contract whose mandate covers it; admit capabilities per model family on measured uplift; issue per-mission tool leases (allowed *and* forbidden tools); refuse | Decide what to do; allocate; accept; observe on Acceptance's behalf (its receipts are its own assertion, never proof of external state); change a mandate | Founder only (mandates, grants); Regulation may freeze any effector; Constitution caps it |
| 7 | **Regulation** (Brake) — the Governor; the Limits Book; the immune system | Set-points and bands for the stocks, the exposure book, stop-losses, SCRAM safe states, breakers, antibodies, the governance budget and control ROI ledger | Throttle, pause, freeze, page, trip SCRAM; drop autonomy a level on correlated alarms; hold admission; issue *typed proposals* to Allocation | Start, fund, accept or widen anything; demote a Halt; put a constitutional hard control on probation; abandon an obligation | Founder; restart after an automatic trip needs Incident Lead + Acceptance; the Constitution sets its ceilings |

**Three houses, for legibility.** The founder reads the stack as three houses, not eight boxes:

```
DIRECTION     Founder ─ Constitution ─ Intent            "what we want, within what law"
MOTION        Allocation ─ Execution                     "what we fund and do"
TRUTH & SAFETY  Acceptance ─ Record ─ Custody ─ Regulation  "what is true, what is held, what is braked"
```

**Five rules that make the stack hold.**
1. **Only the owner says yes; any authority may say no inside its domain.** A yes needs every applicable authority's
   clearance, compiled once (§3).
2. **Narrowing is cheap, widening is expensive.** Any authority may narrow (stop, throttle, refuse) instantly and without
   permission. Only the Constitution widens — through the founder.
3. **Separation of credentials, not only of roles** (red team X02, §3.4). Custody's effectors run as isolated OS users with
   separate keys; Acceptance observes through its own credential-less broker; Journal checkpoints are anchored offsite,
   outside Custody's write domain. A gateway that lies consistently about dispatch and receipt still cannot fabricate an
   accepted settlement.
4. **Authorities are logically distinct, not eight serial sessions.** Most checks are deterministic Kernel code that runs
   in milliseconds and in parallel; only Intent, Execution and parts of Acceptance need model sessions.
5. **The founder is inside the system, not above its records.** His actions pass the gateway and leave receipts; his
   overrules are counted; he alone can write the Constitution and he alone can cross the never-list.


## 3. The Decision Contract — how eight voices become one answer

Answer to red team C01 ("eight authorities disagree about one action"). The Kernel's **policy compiler** takes a proposed
action and one **policy snapshot** (Constitution version, mandate versions, limits, labels, obligation register, verdicts,
freshness of every input) and returns one versioned record:

```yaml
decision_contract:
  action: {operation_id: op_7f3…, verb: refund, target: cust_812, amount_usd: 49, audience: 1, identity: brand:keel}
  snapshot: {constitution: v14, mandate: m_refund_v3, limits: l_2026-10-02T09:00, journal_offset: 88213}
  effect_class: R4            # computed, never declared
  door: costly_reversible     # computed from action × target × money × audience × identity
  disposition: auto | notify | ask | co_sign | never
  satisfied: [charter.grants.spend, mandate.refund.cap, label.untainted, acceptance.coverage]
  blockers:  [{rule: limits.refunds_per_day, owner: Regulation, remedy: "wait 3h or founder raise", expires: 2026-10-02T12:00}]
  precedence_applied: P3 over P6
  valid_until: 2026-10-02T09:15   # stale contracts are recompiled, never reused
```

**Precedence (highest wins; a rule may block only if it is typed as an authority invariant or a consequence constraint).**

| P | Class | Held by | Example |
|---|---|---|---|
| P1 | **Never-list and constitutional prohibitions** | Constitution | Sign as the founder; move money across a venture boundary |
| P2 | **Safety narrowing in force** — SCRAM, freeze, kill switch, breaker, narrowing overlays | Regulation / anyone who trips SCRAM | Payments frozen after a fraud alarm |
| P3 | **Existing obligations**, within real resources and their funded fallbacks | Allocation (reserve) + Custody (execute) | A refund due to a customer continues under a freeze via its pre-authorised continuity route |

**P2 × P3, made executable (R5, walker C2/B10).** P2 still outranks P3: obligations never override a freeze. Instead,
every SCRAM safe state and freeze scope carries an explicit **`continuity:` list** — pre-authorised, bounded routes per
obligation class (e.g. `refund ≤ original charge`, `sms_manual_confirm`, `notify customer of delay`), signed with the
Charter. The compiler evaluates a P2 deny as "deny within scope **except** actions matching a listed continuity route";
a matching action then proceeds to P3–P8 as normal. An obligation with no listed route stays pending, and its latest safe
start opens a continuity decision. Obligations never gain precedence over safety. Safety states must name how duties
continue.
| P4 | **Mandates, grants and limits** | Custody (mandate), Regulation (limit) | Refund cap $200; ≤30 cold emails/day/cell |
| P5 | **Acceptance requirements** | Acceptance | Coverage contract unmet → no merge, no settlement |
| P6 | **Funding decisions** | Allocation | Tranche exhausted → checkpoint and reroute |
| P7 | **Discretionary goals** | Intent | "Raise activation 5 pts this month" |
| P8 | **Optional methods** — recipes, precedents, skills, patterns | nobody (advice) | A learned onboarding recipe — may be cited or ignored, never blocks |

**Rules of the compiler.**
- **Rule typing** (red team D03): every rule is an *authority invariant*, a *consequence constraint* or an *optional
  method*. The compiler rejects any admission predicate that requires a method. Learned detectors start as observations and
  become blocking only by proving they enforce an authorised consequence.
- **Obligations have priority within real resources; they never manufacture resources** (R3 §3.13, T03). Every material
  promise names a funded fallback and a latest safe decision time. A deficit produces an explicit service-continuity
  decision (substitute, negotiate an extension, refund), never silent abandonment or unauthorised spend.
- **Fog is explicit** (C05). Every input has freshness, completeness and an unknown branch. Consequential *positive*
  permission requires fresh evidence; existing obligations continue under pre-authorised bounded continuity.
- **One answer to the founder.** Blockers come back with owner, remedy and expiry. Only a blocker whose remedy is a
  Constitution change or a never-list crossing reaches the founder; everything else is remedied by its owner.
- **Governance budget** (expander U1, red team C06): two-way doors ≤10% overhead and ≤1 h added latency; costly-reversible
  ≤20%; one-way unbounded. Routine in-envelope effects cross ≤3 *serial* gates; independent checks run concurrently.
  Every control has a line in the **control ROI ledger**; one that catches nothing for 90 days on a door class drops to 5%
  sampling there (constitutional hard controls excepted).
- **Same action, same answer on every channel** (R3 §3.2): chat, checkout, API and phone compile to the same contract.
- **Consequence and disposition come from one rule source (R5, walker C1).** **16 owns classification**: effect class
  R0 read/think · R1 internal reversible · R2 internal significant · R3 external reversible · R4 external one-way, money
  out, legal or identity. Door type is derived from action × target × money × audience × identity; blast radius moves the
  **door**, never the R-class. **05 owns disposition**: one table of level × grant × door → auto · notify · ask · co-sign
  · never. **09a composes them once**, and every other file links rather than restating either table. **A signed Effect
  Mandate covering the exact class lowers disposition one step** (ask → notify, notify → auto), **never below notify for a
  one-way door**, and never changes the door. Paid probes, ads and task procurement are one-way money: they run inside a
  founder-signed mandate as *notify*, or they ask.
- **Narrowing overlays (R5, walker C5).** Automatic narrowing — by Regulation, SCRAM, a tripwire, a continuity tier or
  a demotion — is written as a **narrowing overlay**: a Journal event the compiler applies on top of the signed
  Constitution, with scope, reason and expiry. Nothing but the founder's passkey ever rewrites signed Constitution files.
  An overlay can be folded into a signed amendment later. Lifting an overlay early is widening and follows the widening
  rules.
- **Activation timing (R5, walker B01/B24; accepts 05's NEW DECISION).** Narrowing takes effect instantly. Widening
  takes effect after a withdrawable **12 h cooling-off** (parameter; 0 h for a Standing Order codifying a default he
  accepted ≥8/10 times). There are two exceptions, both signed in advance. (1) A **Genesis Charter** at A0–A2 inside the
  default genesis caps activates on the signature that ends Genesis. (2) A pre-signed **emergency-capacity envelope**
  (per venture, bounded in money, duration and purpose) may be *drawn* immediately by an Incident Lead or the founder,
  because drawing it widens nothing.
- **Model-checked.** The compiler's transition rules are checked for both safety (nothing forbidden is reachable) and
  progress (every blocked obligation has a reachable remedy) before each Constitution release.

## 4. Vocabulary choices (one word per thing)

| Topic | Chosen vocabulary | Retired / renamed | Why |
|---|---|---|---|
| Authorities | Constitution + Intent, Allocation, Execution, Acceptance, Record, Custody, Regulation (verbs: Want, Fund, Do, Check, Know, Hold, Brake) | "Limits" (S10) → the **Limits Book** inside Regulation; "Learning layer" → Record; "Exposure authority" (S13), "Capability Custody" (S05) → Custody | One word per power; the founder can hold seven verbs |
| Founder contact | **Class × Reach.** Class (what he must do): **Halt · Decide · Circle · Know · Log**. Reach (how hard a surface reaches): **Ring · Buzz · Tap · Reel · Shelf** | S03's Demand/Altitude and Interrupt/Nudge/Brief/Record; S07's class "Record" → **Log** (collides with the Record authority); ENGINE-SPEC interrupt/ask/tell/log; SURFACES-SPEC nudges | S07's structure and names are the more complete (Circle and Halt are distinct); one rename avoids a collision. Autonomy (05) owns classes, Surfaces (08) owns reach, a deterministic **Reach Router** joins them |
| Attention | **Founder Attention Exchange**, priced in **minutes**; Halt never budgeted; Circle has its own small supply | "≤10 asks/day", "3 nudges/day" | One currency |
| Autonomy | **A0–A4 presets** over a signed **Charter envelope** (level × six grants × mode × **Charter terms**). *Renamed R5: the envelope's fourth field was "mandate", which collided with Effect Mandates (16). Charter terms = capital, pre-listed one-way doors, packet quota, kill trigger;* **principal modes** Instrument · Staff · Partner · Proxy; **modes** Episodic · Series; **states** Active · Paused · Caretaker · Wind-down · Obligation Keeper | C5's A0–A3 + Series as a separate scale | S03's synthesis keeps every earlier scale inside one envelope |
| Consequence | **Door type** (two-way · costly-reversible · one-way) is what humans read; **effect class R0–R4** is what the Kernel computes; **disposition** auto · notify · ask · co-sign · never | "declared risk" | Derived, never declared (S13) |
| Evidence | **Rungs E0–E5** (opinion, desk, simulated, behaviour, commitment, retention) × door type; **evidence debt** | — | S01 |
| Review | **Acceptance Coverage Contract** and the **review coverage graph** | "the other model family from the builder" (R1) | Mixed-family artifacts broke the binary rule (S02, S09, R3 §3.9) |
| Ventures by tier | **Probe · Micro-venture · Flagship** (plus founder-driven ventures at A0–A1) | "3–7 ventures" as the portfolio shape | Expander U2: govern as fleets |
| Economic records | **Books** (double-entry accounting, Custody), **Budget Ledger** (four resources, Allocation), **Calibration Ledger** and **Progress Ledger** (Acceptance), **Use Ledger** (Record). The harness's claim ledger keeps its name and meaning | "the Ledger" (R1) | S14 naming clash with `scripts/ledger.mjs` |
| Identity | **Identity record** = title + fused procedure + knowledge bindings + pre-registered claim + track record | "agent persona" | SP3: the edge came from the procedure |
| Hybrid tested in SP3 | **Conversion Scientist** | "Conversion Econometrist" (S06 #1) | Name the thing that was measured |
| Coordination | **Responsibility** (durable owner) vs **execution lease** (expiring, fenced) | "non-expiring handoff lease" (S10) | R3 §3.1, T04 |
| Kernel nouns | **Event · Job · Lease · Effect · Receipt · Label** (+ **Operation** as the stable business identity of an effect) | job-derived effect keys | R3 X05 |


## 5. Glossary

One definition per term. **Owner** = the file that specifies it; everyone else links there.

**Organisation and authority**

| Term | Definition | Owner |
|---|---|---|
| Vibe startuping | One founder plus an agentic organisation conceiving, building, running, growing and learning across any kind of venture, competing with billion-dollar companies | 01 |
| Compounding Organisation | The whole system: seven authorities under one Constitution, compiling one Decision Contract per action, feeding learning back as policy, assets, verifiers and priors | 02 |
| Venture | Any project: startup, agency, business, research, learning. Has a Charter. Tier: Probe, Micro-venture or Flagship | 02 / 17 |
| Probe | A disposable demand test run under one Probe Mandate; zero founder minutes each | 03 / 17 |
| Micro-venture | An autonomous small venture governed under a fleet Charter; ~5 founder minutes a week | 17 |
| Flagship | A venture with its own full Charter and board meeting | 17 |
| Constitution | Founder-signed law: charters, levels, grants, never-list, decision rights, Continuity Will, precedence, ceilings, release authority. Writable only by founder passkey | 02 / 05 |
| Charter | A venture's signed envelope: intent, autonomy level, grant vector, mode, **Charter terms** (capital, pre-listed one-way doors, packet quota, kill trigger — never called "mandate"), budget, baseline CCIR, continuity routes, never-list reference, data boundary, SCRAM safe state, founder-minute quota | 05 |
| Never-list | Seven non-delegable action classes (change authority; be the founder's person; create/end a legal person or liability; move money across a boundary; destroy the unrestorable; edit the judges; employ/dismiss or act on health/safety/legal standing) | 05 |
| Decision-rights matrix | 22 decisions × holders, one D per row, enforced by gateway, merge queue, Referee or admission code — never by prompt | 05 |
| Decision Contract | The compiled answer for one action against one policy snapshot: disposition, satisfied rules, blockers with owner/remedy/expiry | 00 §3 / 09a |
| Policy snapshot | The versioned set of inputs a Decision Contract was compiled from | 09a |
| Three houses | Direction (founder, Constitution, Intent) · Motion (Allocation, Execution) · Truth & Safety (Acceptance, Record, Custody, Regulation) | 02 |
| Protected computing base | Everything that can change acceptance or grant semantics — policy compiler, adapters, graders, parsers, build inputs, migrations. Changes need the release authority | 09a |
| Release authority | Constitution-held right to activate a change to the protected computing base: founder + independent evidence from both families; a candidate never evaluates its own promotion | 09a |

**Intent and founder**

| Term | Definition | Owner |
|---|---|---|
| Venture Mind | Versioned record of a venture's theses, goal tree, taste, Standing Orders, wagers, commitments, dissent register | 05 |
| Portfolio Mind | The Venture Mind across ventures: Keystones, correlation, fleet strategy | 05 |
| Co-founder seat | Any Claude Code or Codex session that loads a Venture Mind; owns thesis, opportunity order, weekly board, dissent. A role, not a process | 05 |
| Founder-model view / own view | Every Co-founder packet states what it predicts the founder would choose and what it would choose | 05 |
| Wager | A dated, settled-by-Referee prediction the Co-founder uses to disagree with the founder | 05 |
| Standing Order | A decision *policy* (never a method) with `valid_until`, compiled from repeated decisions; promoted only by founder signature | 05 |
| Goal tree | Root intent (founder) → nodes with metrics and causal links (Mind edits below intent at A4, proposes at A3) | 05 |
| Initiative Proposal | Self-generated work citing a goal node and carrying a Closer Claim | 05 |
| Closer Claim | A predicted, dated change in a goal node's metric; settled by Acceptance | 05 |
| Progress Ledger | Settled Closer Claims and the four busywork ratios (Closer Ratio, Goal-delta per $, Sideways Index, Consumer-less Artifact Ratio) | 05 |
| Sideways Review | A mission opened by a busywork tripwire; returns re-aim, kill, push through or escalate | 05 |
| CCIR ("wake me if") | The founder's pre-declared list of conditions that always reach him | 05 |
| Founder State | available · focus · travel · offline_planned · overloaded · unreachable · incapacitated; scales minute supply and reach | 05 |
| Continuity | Deadline-driven measures per obligation (latest safe start) plus presence tiers: Reach 24 h → Caretaker 72 h → Deputy 7 d → Continuity Will 14 d; succession only narrows | 05 |
| Deputy | A named human who has accepted a scoped grant (stop, caretaker, wind-down, pay due bills) and passed a drill | 05 / 16 |
| Decision Supply Bench | Expander X17: grows founder-side judgment — a Judgment Gym, calibrated circle weights per domain, trusted human reviewers for delegated taste | 05 |
| Class / Reach / Reach Router | See §4. Router is deterministic, picks the lowest reach that meets the deadline given Founder State and remaining minutes | 05 (class) / 08 (reach) |
| Founder Attention Exchange | Clears Decide packets by priority per minute at decision windows; supply set by founder, scaled by Founder State | 05 |
| DecisionPacket | A Decide item: options, default-on-silence, dissent, steelman of the loser, best rejected alternative, material downside, minutes estimate | 05 |
| Silence rule | On expiry a packet takes its default only if that default is a two-way action inside the charter; otherwise it refuses | 05 |
| Dailies Reel / circled take | Raw artifacts shown to the founder; a circle (≈2 s) is taste data that may propose — never authorise — policy | 08 |
| Board meeting | Weekly per Flagship (fleet review for Micro-ventures): Co-founder's pack, wagers, dissent, kill/pivot packets | 05 |

**Allocation and economics**

| Term | Definition | Owner |
|---|---|---|
| Allocator | Ranks question-shaped work by value of information; sizes tranches across arm-shaped work by Thompson sampling; candidates must clear VoI > cost | 03 |
| Lanes | **Obligations lane** (reserved first, attention-ordered, never waits for a bet cycle) and **Investment lane** | 03 |
| Sleeves (inside Investment) | **Probe** (X3), **Replication** (X5), **Strategy Cells** (X9), **Option Pool** (X4 trigger-armed options), **Long-Horizon** (X16, protected patience), **Improvement** (≤15% discretionary self-improvement, D04) | 03 |
| Tranche | A funded slice of a mission's budget across the four resources | 03 |
| Four resources | Cash, subscription allowance, API throughput, founder minutes — never interchangeable; plus reserved **verifier windows** | 09b |
| Shadow price | The internal price of a scarce resource used for ranking, not for payment | 09b |
| Reserve order | Obligations → acceptance → recovery → investment | 09b |
| Budget Ledger | Allocations and burn of the four resources per mission, venture and portfolio | 09b |
| Books | Double-entry accounting per legal entity, reconciled from bank and processor systems of record | 16 |
| Treasury Standing Order | Recycles collected surplus into compute and reserves by rule | 09b |
| Complementary bundle | Superadditive bets funded all-or-none with joint kill criteria | 03 |
| Inter-venture economy | Ventures buying from each other at list price, disclosed, capped at 30% of revenue, never PMF evidence; circular flows eliminated before signals | 17 |
| Degraded mode | Checkpoint and reroute within authority when a resource is exhausted; never relaxes acceptance | 09b |
| Leverage | Matched accepted human-equivalent hours per founder-hour | 09b |
| FTE-equivalent | Accepted matched human-equivalent hours ÷ 40 per week, with rework debits | 09b |

**Missions and execution**

| Term | Definition | Owner |
|---|---|---|
| Mission | The unit of funded work: a question, a measure, stop/pivot/kill rules, a tranche, an evidence position, a forecast. A record, not a procedure | 03 |
| Mission lifecycle | Draft → Framing → Funded → Active → Settling → Wrapped; plus Frozen, AwaitingFounder, Pivoted, Killed, WindDown | 03 |
| Mission facets | Delivery, acceptance, settlement, learning and obligation states tracked separately; Wrapped may leave funded **residuals** that hold no leases | 03 |
| Cycle | Inner loop: fresh-context planner proposes K=3 moves → engine picks by EV under guards → run → score → stop-check | 03 |
| Move | A typed step from the move vocabulary (research, hypothesise, build, test, challenge, ask…) | 03 |
| Framing Contract | When no measure exists, the first mission buys one; no measure, no money | 03 |
| Bet | A preregistered hypothesis with success and kill criteria and a kill date; required when a result enters the Priors Library, buys a tranche or crosses a door | 03 |
| Forecast | Every mission's registered prediction at funding, scored at settlement | 03 |
| Evidence ladder / rung / evidence debt | See §4; debt is owed when committing below the required rung | 03 |
| Self-challenge | Sample-and-vote across families for accuracy; red team and pre-mortem only to *generate objections*; each objection ends as a test or an owned accepted risk | 03 |
| Novel declaration | Any mission may run recipe-blind; learned patterns are never gates | 03 |
| Mission shape | Solo · lead+workers · swarm · audition — chosen from dependency structure, uncertainty, interference and verification need | 04 |
| Mission Lead | The Execution session that composes and runs a team inside a tranche | 04 |
| Launch Sheet | The one-screen cast, shape, lane, budget and coverage contract shown when a card is launched (skipped inside Standing Orders, with honest undo) | 08 |
| Launch Pack | The budgeted, hashed context compiled for one launched agent: always a null check and a not-searched list | 06 |
| Context profile | Which settings, instructions and agent definitions a worker loads; chosen per mission, never inherited from where the runner stands (SLICE) | 04 / 09a |
| Loadout | ≤8 skills compiled for a mission, per family | 07 |
| Tool lease | Per-mission grant naming allowed **and forbidden** tools (e.g. nested-agent tools denied unless the team shape includes them) | 07 / 09a |
| Blackboard | Typed contributions with provenance and read versions, backed by the Brain | 04 |
| Resource footprint | The semantic resources a job declares; storage recomputes what it actually touched | 04 |
| Hot resource | Imports, appends, registries and config objects nobody declares; auto-added to every footprint that touches the file (SP2) | 04 |
| Fenced lease | An expiring execution right with a monotonically increasing token; **the storage/resource verifies the token**, not the coordinator | 04 / 09a |
| Responsibility | The durable owner of an obligation or task; survives worker loss; transfers by prepare/accept with a new fencing epoch | 04 |
| Integration queue | Fetch main, merge, re-test, compare-and-swap land; conflicts and red tests return to the same worker as a priced **integration rework** | 04 |
| Receipt | One signed, hash-chained record per landed change or effect: base, result, resources, tokens, cost, parent link | 09a |
| Incident Lead | Takes scoped, expiring incident authority and returns it; restart needs a safe-envelope proof and Acceptance | 04 / 05 |
| SCRAM safe state | Per-Charter definition of "shut down safely", reachable by any agent that sees a trip condition | 05 |
| AAR | Four-question after-action review that must name a mechanism change | 09b |
| Forced leave | Series ventures periodically run by a fresh configuration reading only systems of record | 04 |
| Wish-to-Ship | Customer wishes turned into accepted shipped changes in <24 h (X7) | 17 |
| Fork Fleet | N-of-1 product forks maintained by agents per customer (X8) | 17 |

**Agents and identity**

| Term | Definition | Owner |
|---|---|---|
| Identity record | Title, fused procedure, knowledge bindings, pinned skills, memory scopes, tools, per-family model preference, sandbox, risk ceiling, track record, calibration, lineage, pre-registered claim | 04 |
| Hybrid specialty | An identity fusing fields no human holds at once, with a **Fusion Thesis** (the handoff it kills) and a pre-registered claim | 04 |
| Generalist Null | Every hybrid must beat a generic engine with the same lenses and bindings | 04 |
| Audition Ladder | Screen (3/5) → Paired Trial (≥15/20 or posterior ≥0.9, cost ≤1.1×) → Shadow (10 live) → Bounded Rollout (≤25%) → Promoted; experiment families preregistered, selection-aware statistics, sealed confirmation set | 04 |
| Cast registry | Identity records with per-family, per-task-class evidence; composite records for fixed cross-family pairs | 04 |
| Casting | Thompson sampling per record × task class × family under exposure caps and ≥10% exploration | 04 |
| Seam Miner | Proposes hybrids from measured handoff failures | 04 |
| Equal workers | Claude Code and Codex have identical eligibility for every role; routing by matched outcome evidence | 04 |

**Acceptance**

| Term | Definition | Owner |
|---|---|---|
| Referee | The Acceptance function in a mission: deterministic verifiers plus fresh judges assigned by the coverage contract, outside the worker sandbox. Its **parsed verdict** is the only thing that moves a card to Done | 04 / 09b |
| Acceptance Coverage Contract | Per artifact: components, dependencies, required observations, deterministic checks and independent judgments; reserved before launch | 09b |
| Review coverage graph | Component-level opposite-family review + end-to-end acceptance by fresh judges of both families for mixed-family work; material disagreement → third route (third family or human adjudicator) | 09b |
| Within-generator rule | Quality comparisons and rankings are made only within one generating model; absolute cross-family scores never rank agents (SP3: self-preference +1.1 Claude, +3.2 Codex) | 09b |
| Verifier Foundry | Acceptance programme that mines deterministic verifiers from panel decisions; promoted advisory → pre-screen → decide against later real outcomes; permanent 5% panel sample | 09b |
| Deterministic Share | Share of acceptance decisions settled with no model | 09b |
| Observation broker | Acceptance's own credential-less read path to systems of record, distinct from Custody's write gateway | 09a |
| Calibration Ledger | Forecast scores (calibration, sharpness, resolution, difficulty, abstention, utility) per config, team, Mind and founder | 09b |
| Trust | A stock earned by calibrated, sharp prediction and drained 3× faster by surprise; it *proposes* autonomy, never grants it — promotion needs a signed authority change | 05 / 09b |
| Digital twin | Versioned per-venture simulation run *from* the Brain; fidelity scoped per decision; production contracts with a shadow outbox | 09b |
| Eval tiers | Historical regression · fresh capability · sealed promotion holdouts · later real outcomes | 09b |
| Model-Release Reflex | Every new model re-scores every configuration and capability and runs "what is now possible" probes | 07 / 09b |

**Record and memory**

| Term | Definition | Owner |
|---|---|---|
| Brain | Per-venture world model: typed records (Entity, Fact, Explanation, Question, Decision, Obligation, Prior, Null, Lesson), bi-temporal, evidence-linked, runnable | 06 |
| Journal | The Kernel's append-only, hash-chained event log; canonical for events, authority transitions, leases, effects, receipts, verdicts | 09a |
| Record map | Journal = events and authority; versioned files = signed policy, Minds, curated Brain, identity and capability records; databases and indexes = projections with source offsets; external systems of record = canonical for external state | 06 / 09a |
| Use Ledger | read → cited → settled → counterfactual events proving influence | 06 |
| Orphan lint | Any store or record class with no reader and no settled citation in 30 days fails | 06 |
| Sleep | Nightly consolidation producing Brain vN+1 as a reviewable diff; cross-family supersession check | 06 |
| Forgetting verbs | Decay · invalidate · redact · forget (governed erasure with lineage proof) · quarantine; obligations never decay | 06 |
| Wrap Deposit | The structured write-back a mission owes; bounded deadline; minimal checkpoint if a worker dies | 06 |
| Label | Origin, data class, venture on every datum; transitive over data and control dependencies; confidence, provenance and permission are separate fields | 06 / 09a |
| Lesson Airlock | Cross-venture sharing: sealed/guarded/open boundaries, closed lesson grammar, disclosure tests, cumulative disclosure budget per recipient, revocation with taint trace | 06 |
| Priors Library / Null Registry | What the organisation believes with evidence level, pooled hierarchically; nulls kept | 06 |
| Pain Index | X2: permitted-source corpus of the world's complaints, clustered, feeding Intent | 06 / 17 |
| Customer panel | A consented paid panel per venture interviewed weekly; calibration data for the twin (U7) | 17 |

**Custody and the outside world**

| Term | Definition | Owner |
|---|---|---|
| Kernel | Small trusted Go process: journal, leases, fencing, effect gateway, credential custody, kill switches, policy compiler | 09a |
| Userland | TypeScript/Node everything-else: mission engine, Minds, Allocator, memory, skills, surfaces | 09a |
| Effect Gateway | The only door out; idempotent, mandate- and limit-checked; leaves receipts | 16 / 09a |
| Front Desk | The only door in; labels, quarantines, identifies counterparties | 16 |
| Operation ID | Immutable business identity of an effect, assigned before dispatch; attempts stored beneath it | 09a |
| Honest undo | States: held-for-dispatch · cancel-requested · cancel-confirmed · compensating; undo is advertised only when dispatch is actually held | 08 / 16 |
| Effect Mandate | Signed intent → cart → execution bound on a class of effects; inside flows, first outside asks | 16 |
| Offer object | Authorised commercial terms from which all offers, quotes and checkouts compile; speech with foreseeable reliance is an effect | 16 |
| Outbound Claims Standard | Every factual outward claim binds to Brain evidence with claim-specific freshness, checked through the coverage graph | 16 |
| Brand cell / reputation meters | Per-venture outward identities and accounts, never shared; meters trip breakers; portfolio-wide contact and consent controls | 16 |
| Kill switch | Five levels: effect → channel → identity → venture → world | 16 |
| Obligation Keeper | Mode that honours commitments of a killed or frozen venture | 16 |
| Room / Principal | A scoped space for a human collaborator; delegated jobs inherit the intersection of principal, Room, mission and capability authority; revocation epochs | 16 |
| Human Task Market | Human-only work priced, contracted (pay, deadline, paid revisions, appeal) and paid on the same ledgers | 16 |
| Guild | X13: a standing network of humans organised and paid by agents | 16 |
| Negotiation Envelope | Bounds for talking to counterparty agents; content quarantined | 16 |
| Atoms Gateway | X14: physical-world effects through API adapters, each with reversal evidence | 16 |
| Capability Registry | Canonical library of skills, MCP servers, CLIs, recipes; projected per worktree and per family with hash lockfile | 07 |
| Capability pipeline | discover → fetch → scan (3 independent passes) → normalise → sandbox → score (per-family uplift) → admit → observe → retire | 07 |
| Tool Surface Lock | Pins tool descriptions **and** executable/dependency digests, endpoint identity and egress policy | 07 |
| Skill Foundry / Gap Radar | Agents author skills from settled missions (one family drafts, the other evaluates); Gap Radar finds skills we don't know we need | 07 |
| Model Foundry | X12: the organisation's own fine-tuned open-weight family, a third route for acceptance and cheap volume | 07 |
| Backlot | Versioned reusable assets (code, brand kits, infra); merged with the Capability Registry; missions strike improvements back on wrap | 07 |
| Keystone Asset | X10: a portfolio asset that raises every future venture's odds, shared with consent scopes beside the firewalls | 17 |

**Regulation**

| Term | Definition | Owner |
|---|---|---|
| Governor | The Regulation session; issues constraints and typed proposals, never funds | 02 / 09b |
| Stocks | Founder Attention, Trust, Capability, Knowledge, Cash+Compute, Reputation, Obligations, Verifier Capacity, Debt, Option Pool | 09b |
| Homeostat | Set-point and band per stock; may slow, stop or reroute | 09b |
| Pairing rule | A reinforcing loop cannot activate without a named balancing loop with a live sensor | 09b |
| Limits Book / exposure book | One exposure model over loss-weighted dependency groups (outbound volume, open promises, money at risk, irreversible effects in flight, configuration concentration) with named quantity, window, scope and enforcement level | 09b |
| Immune system | Innate (gateway, leases, lint) + adaptive antibodies (detector, test, false-block budget, expiry); alarms grouped by causal dependency | 09b |
| Near-miss register / deviance monitor | Events the Referee passed that nearly failed; waiver and overrule *rates* forcing rule change | 09b |
| The Map | One legible view of stocks and loops, lit only off-band; unknown drawn as fog | 08 |
| Honest Scoreboard | Every number resolves to a system of record; no points, streaks or badges | 08 |

**Added in the R5 fix pass** (each refines or replaces nothing above unless it says so)

| Term | Definition | Owner |
|---|---|---|
| Charter terms | The Charter envelope's fourth field: capital, pre-listed one-way doors, packet quota, kill trigger. Replaces "mandate" inside a Charter; "mandate" now means only an Effect Mandate | 05 |
| Narrowing overlay | A Journal-recorded, scoped, expiring narrowing applied by the compiler on top of the signed Constitution; never rewrites it | 05 / 09a |
| Cooling-off | The withdrawable delay (12 h, parameter) before a widening activates | 05 |
| Emergency-capacity envelope | A pre-signed, bounded (money, duration, purpose) allowance per venture that an Incident Lead or the founder may draw immediately | 05 |
| Continuity route | A pre-authorised bounded action listed in a safe state's `continuity:` list; the only thing a P2 deny lets through | 05 / 09a |
| Presence proof | A device-bound, signed founder gesture (passkey, or registered-watch signed tap) that resets the continuity clock. It proves presence only and never authorises an effect | 05 |
| Baseline CCIR | The CCIR lines every Charter carries from Genesis, from a Kind template, signed with the Charter | 05 |
| Reach floor / ceiling | Floor: the lowest reach a contact may get (class, door, CCIR line, deadline). Ceiling: the highest Founder State allows. One ordered table in 08 resolves conflicts | 08 |
| UNPARSED | Verdict state when a judge's output cannot be parsed. Never PASS; it counts against verifier capacity | 08 / 09b |
| Claims Register | 16's register of outward claims and their evidence; distinct from the harness's claim ledger. Replaces "Claims Ledger" | 16 |
| Capability epoch | Monotonic version on an admitted capability. Revocation bumps it, and every job, cache and pending effect bound to the old epoch is rechecked | 07 |
| Capability Custodian | Title of the model session that *drafts* admission cases and grant decisions for the Capability Registry effector; the effector's deterministic policy admits | 07 |
| Qualification key | Capabilities, judges and identities are qualified per **model version × capability × route**, never per family name | 07 / 09b |
| `support_bucket` | Coarse count of independent supporting observations on a prior or lesson (e.g. "2-3"), beside rungs E0–E5, not a seventh rung | 06 |
| Typed null | A null result labelled powered, underpowered or confounded; only a powered null settles a hypothesis | 06 / 03 |
| `awaiting_gate` | Mission stop state: the next step is a named human gate or an unavailable capability. The mission stops rather than keep researching | 03 |
| Capability-checked success test | Every clause of a success or kill test maps to an available worker capability or a named human gate at framing time | 03 |
| Veto question | A question class (legal, regulatory, safety) exempt from VoI ranking that must be resolved before `stop_success` | 03 |
| Diminishing-returns stop | If the top question's value moves <0.1 over two consecutive cycles, force a decision (pivot, gate or accept). Replaces method-named "no three Research moves" guards | 03 |
| Re-scope Review | Triggered at tranche burn ≥80% with settlement forecast ≥30% below admission (parameters); led by a fresh other-lineage Mission Lead from the mission's reserve | 03 |
| Staging integration vs publication | Workers integrate on a staging branch; **publication** (CAS land to main or deploy) happens only after the coverage contract's required verdicts | 04 / 09b |
| Settlement edges | Separate facts: artifact accepted · deployment confirmed by independent production observation · promise fulfilled | 09b |
| Time-out Confirmer | A named coverage edge — a second-lineage check of the target card before each R3/R4 effect, reserved with the coverage contract | 04 / 09b |
| Build Charter | Founder-signed envelope that funds construction of the organisation until Handover; afterwards residual tuning moves to the Improvement sleeve | 14 |
| Charging rule | Every spend is charged by purpose to exactly one pool (DR-60) | 09b |
| Participant | A human-subject research principal with protocol, consent scope, pay, withdrawal and approved sample | 16 |
| Release (of sealed data) | Governed effect that reclassifies a derivative out of `sealed`: consent-scope check, disclosure test, founder signature; never implied by de-identification | 06 |


## 6. Decisions register

Binding for all section writers. Source codes: S01–S14 Round 2 seats; R3-X expander; R3-RT red team (§ number or failure
id); SP2, SP3, SLICE spikes; R1 synthesis.

**Architecture and authority**

| # | Decision | Rationale | Source |
|---|---|---|---|
| DR-01 | Seven authorities under one founder-written Constitution (§2); Regulation and Limits merged; Custody unified as **policy**, split as **isolated effectors** | Every seat that argued for a power was right about the conflict of interest; C01/X02 were right that separation needs a compiler and separated credentials | S03, S04, S05, S08, S10, S11, S12, S13; R3-RT C01, X02 |
| DR-02 | One Decision Contract per action with precedence P1–P8 (§3) | Eight rows cannot each hold a "D" on one action | R3-RT C01 |
| DR-03 | Acceptance observes through its own credential-less broker; Custody receipts are assertions, not proof | A compromised gateway must not be able to forge settlement | R3-RT X02, §3.4 |
| DR-04 | Regulation proposes; only Allocation funds and only Execution launches | "Governor cannot fund, but its table funds" | R3-RT §3.6 |
| DR-05 | Rules are typed (invariant · consequence · method); only the first two block; learned patterns never gate | Stops playbooks reappearing as admission dependencies | S01; R3-RT D03, §3.7 |
| DR-06 | Proposing a control change is free; activating one needs the release authority; the protected computing base is defined transitively | Self-improvement must not edit the machinery that proves improvement | S03, S12; R3-RT C03, §3.12 |
| DR-07 | Record map: Journal (events, authority), versioned files (policy, Minds, curated Brain, records), projections (databases, indexes) with source offsets; external systems canonical for external state | Three stores competed to be truth | S04, S07, S12; R3-RT C02, §3.11 |
| DR-08 | Two-tier stack: Go Kernel (six nouns + Operation) and TypeScript/Node 24 Userland | The only credential holder must have the smallest dependency surface | S12 |
| DR-09 | Kernel on a dedicated always-on Mac; Front Desk and outbound effectors on a small cloud host with an **external fencing authority** and exclusive gateway epoch; alternate host tested | Resolves S12 vs S13 host conflict; host failure must not defeat the kill path | S12, S13; R3-RT T07 |
| DR-10 | Governance budget per door type, ≤3 serial gates for routine effects, control ROI ledger | Controls must not eat the speed that is the point | R3-X U1; R3-RT C06 |

**Acceptance and evaluation**

| # | Decision | Rationale | Source |
|---|---|---|---|
| DR-11 | "The other family from the builder" is replaced by the **Acceptance Coverage Contract** and **review coverage graph**; cross-family review is **mandatory**; self-review never counts | Mixed-family artifacts break the binary rule; SLICE's same-family self-review passed an error the cross-family Referee caught | S02, S09; R3-RT §3.9; SLICE |
| DR-12 | Quality comparisons stay within one generating model; absolute cross-family scores never rank | SP3 self-preference +1.1 (Claude) and +3.2 (Codex) exceeded the effect measured; family scores correlated r = −0.37 | SP3 |
| DR-13 | Only the Referee's **parsed** verdict moves a card to Done; Done and passed are separate facts; a founder drag to Done is a logged overrule; FAIL offers re-queue with reasons | Board truth must come from Acceptance | S07; SLICE |
| DR-14 | Deterministic checks run before any judge; the Verifier Foundry grows Deterministic Share 40% → 75% → 90% (targets) with a permanent 5% panel sample | Verification capacity is manufactured, not only rationed | R3-X X1, U3; harness oracle-first |
| DR-15 | Verifier windows are reserved as **qualified service windows**; admission holds at a 70% utilisation ceiling (parameter) | Correlated fan-in saturates review | S02, S10; R3-RT T01 |
| DR-16 | Audition Ladder with preregistered experiment families, selection-aware statistics, sealed confirmation sets; ≥10 paired items with replicates per identity test | 3-of-5 passes ~50% of no-better hybrids; single-task noise ≈ effect size | S06; R3-RT D02; SP3 |
| DR-17 | Calibration is scored with sharpness, resolution, difficulty, abstention and utility; trust proposes autonomy, a signed change grants it | Calibrated mediocrity must not buy authority | S11; R3-RT D05 |
| DR-18 | Twin results list inherited assumptions and falsifiers; prospective validation before simulation changes money or autonomy limits | The twin must not certify its own assumptions | S09; R3-RT D07 |
| DR-19 | A power/duration calculator and a claim-sourcing check are deterministic tools every identity can call and the Referee recomputes | SP3's edge was mostly statistics; its hybrid made an unsourced fear claim | SP3 |

**Execution and coordination**

| # | Decision | Rationale | Source |
|---|---|---|---|
| DR-20 | Fences are verified **by storage** (repo ref, database, gateway), which also recomputes touched resources | A zombie holder ignores the coordinator's table | SP2 |
| DR-21 | Lease acquisition is all-or-nothing (or wound-wait by mission age) with a deadlock detector; hot resources auto-added; leases are optimistic (first-ready wins) except for resources with irreversible effects | Lazy acquisition deadlocked on first run; leases blocked the fast worker 13.2 of 21.6 s | SP2 |
| DR-22 | Leases buy ordering, scope detection and staleness rejection — **not** conflict-free integration; every overlapping pair budgets one integration rework | 4-file conflict under exclusive symbol leases | SP2 |
| DR-23 | Responsibility persists; execution leases expire; transfer by prepare/accept with a new fencing epoch; abandoned transfers return to a recovery queue | Non-expiring handoff vs fenced expiry | S10, S12; R3-RT §3.1, T04 |
| DR-24 | Per-mission **tool leases** list forbidden tools; nested agents are visible team members keyed by parent link; context profile chosen per mission | SLICE's Builder spawned a hidden same-family reviewer through an ungated tool; inherited context drove cost | SLICE |
| DR-25 | Mission shape chosen from dependency, uncertainty, interference, verification need; team composition is a funded, measured decision; fan-out bounded by verifier capacity, not span of control | No shape wins everywhere | S02; R1 |
| DR-26 | Effects carry an immutable Operation ID; `uncertain` never auto-retries; reconcile before another attempt | Retry across jobs duplicated payments in the red team's trace | S12; R3-RT X05 |
| DR-27 | Incident grants are scoped, expiring, replaceable; restart needs safe-envelope evidence + Acceptance + authorised actuation; repeated declarations trigger integrity review | Incident authority must not become permanent or a weapon | S10; R3-RT T05 |
| DR-28 | Mission states are faceted (delivery, acceptance, settlement, learning, obligation); residuals hold no leases | Closure must not depend on work that cannot close | R3-RT T08 |

**Intent, autonomy and founder**

| # | Decision | Rationale | Source |
|---|---|---|---|
| DR-29 | A0–A4 presets over a signed Charter envelope; six grants; Episodic/Series; A4 exists in the schema from day one and is earned by a Promotion Case (≥8 weeks at A3) | Keeps every earlier scale; evidence first | S03 |
| DR-30 | Contact vocabulary: Class (Halt · Decide · Circle · Know · Log) × Reach (Ring · Buzz · Tap · Reel · Shelf) | §4 | S03, S07 |
| DR-31 | The Exchange estimates burden independently of the requester, shows material downside and best rejected alternative, keeps an age/deadline floor, and audits what the founder was *not* shown | Requesters learn to win attention | R3-RT D06 |
| DR-32 | Observed dismissal may *propose* demotion; it never suppresses an obligation or a safety reach floor | Ignoring a hazard must not train silence | S03, S07, S10; R3-RT §3.8 |
| DR-33 | Goal and metric versions freeze at mission admission; every goal-tree amendment shows abandoned outcomes; independent customer and harm guardrails | Closer Claims can reward wrong-direction motion | S03; R3-RT D01 |
| DR-34 | Continuity is deadline-driven per obligation, not only calendar tiers; deputies must accept and drill; planned absence expires | A duty may expire tonight | S03; R3-RT T02 |
| DR-35 | Presence, narrow stop and positive authorisation are separate; approvals bind the canonical displayed action (what you see is what you sign); voice proposes, passkey disposes | Authentic identity ≠ informed authority | S03, S07, S13; R3-RT X08 |
| DR-36 | Human-signed delegation, per-instance approval and legally required human execution are three different things | Same action, same disposition on every channel | S03, S13; R3-RT §3.2 |
| DR-37 | Task procurement is autonomous within signed terms; creating/changing employment is never-list; task-splitting triggers classification review | Hiring was allowed and forbidden at once | S03, S13; R3-RT §3.3 |
| DR-38 | Ventures run in three tiers (Probe, Micro-venture, Flagship) governed as fleets; trust cells per task family portfolio-wide | Founder cost must not scale linearly with ventures | R3-X U2 |

**Memory, capability, economics, outside world**

| # | Decision | Rationale | Source |
|---|---|---|---|
| DR-39 | Versioned files canonical for the Brain, derived SQLite FTS5 + vector index; Graphiti on measured trigger; **Mem0 is not primary** (the root CLAUDE.md stack line is stale) | Never configured, no temporal model | S04 |
| DR-40 | Labels are transitive; confidence, provenance and permission are separate; a settled citation cannot declassify; quarantine invalidates downstream packs, pending effects and learned assets | Rank-1 red-team failure: evidence laundering | S12; R3-RT X01 |
| DR-41 | Immutable metadata, separately encrypted payloads, governed erasure as an authorised effect; deletion receipts never claim to erase uncontrolled copies | Audit vs forgetting | S04, S12; R3-RT §3.5, H03 |
| DR-42 | Lesson Airlock budgets cumulative disclosure per recipient; default boundary class `guarded` | Safe lessons compose into disclosure | S04; R3-RT X07 |
| DR-43 | Capability counts: ~340 trusted-first skills in 10 vendor libraries; aggregators are discovery only; Snyk's 13.4% critical / 36.8% any-flaw figures cover **3,984 ClawHub skills only** (corrects R0-C) | Verified by the skills seat against GitHub API | S05 |
| DR-44 | Capabilities admitted **per family** on measured uplift; blast-radius rings; ≤8 skills per Loadout; admission pins executable digests and egress, and never substitutes for containment | Tool behaviour changes under a pinned description | S05; R3-RT X03 |
| DR-45 | Credential routing by provider terms: API keys for autonomous ventures, customer/client data and all unattended Codex; subscriptions only for founder-initiated interactive work. **Amended R5 → DR-61** (the one billing rule) | Terms fetched 2026-09-30 | S12 |
| DR-46 | Concentration limits live in one exposure model with explicit denominators (S01 30% of funded work, S06 40% of task-class casting, S07/S10 60% signals become named rows) | Three caps measured different things | R3-RT C04, §3.10 |
| DR-47 | Self-improvement is charged to root purposes; discretionary Improvement sleeve ≤15%; beneficiary + 30-day outcome check or the tranche returns | Self-improvement must not become the main customer | R3-RT D04 |
| DR-48 | Speech with foreseeable reliance is an effect; offers compile from an authorised Offer object; checkout reserves fulfilment capacity | Formatted words still create reliance | S13; R3-RT H01, §3.2 |
| DR-49 | Undo is advertised only when dispatch is actually held or cancellation guaranteed; UI names what remains irreversible | Undo implied reversibility the world lacks | S07, S13; R3-RT H02 |
| DR-50 | Synthetic canaries carry non-exportable labels enforced below semantics; twin credentials lack production capability | Canaries must not contaminate business | R3-RT H06 |
| DR-51 | Voice: Twilio ConversationRelay primary (our brain, both families), OpenAI Realtime SIP as measured fallback | Keeps the brain ours | S07 (overrides SURFACES-SPEC) |
| DR-52 | The seventeen expander additions are **responsibilities of existing authorities**, not new authorities (table in `02-ORGANISATION.md` §6) | Keeps the stack at seven | R3-X §1 |
| DR-53 | The dispatcher needs a **standing launch permission** scoped to the Kernel launcher; per-session human approval of each launch cannot run a merge queue | SP2's live arms were blocked by the permission layer | SP2 (founder decision F1) |
| DR-54 | Hybrid specialties are fused *procedures* with pre-registered claims, routed by task class (mixed copy+measurement, not pure copy); title-vs-procedure is the next spike | SP3 narrow pass: +1.01 vs +1.0 bar; zero on pure copy | SP3 |
| DR-55 | ~~SP1 still running~~ **SP1 landed PARTIAL**: steering held, but the loop never stopped by itself (ran to the cost cap at 23× the control's cost). Its fixes are DR-73 | Measurement in | SP1 |

**Round 5 fix pass** — rulings on R5-ISSUES (#), the Codex scenario walk (B, C), scenario gaps (G, G-B) and 15's open
gaps (OG). The execution list is `_process/R5-FIX-PLAN.md`.

| # | Decision | Rationale | Source |
|---|---|---|---|
| DR-56 | P2 × P3: safe states carry an explicit `continuity:` list; a P2 deny passes only listed continuity routes; obligations never outrank safety (§3) | The compiler terminated at P2 before the promised continuity path | C2, B10 |
| DR-57 | One consequence source: 16 classifies (R-class, door), 05 disposes (one table), 09a composes. A covering mandate lowers disposition one step, never below notify for one-way | Same effect got different dispositions in 05 and 16 | C1, B04 |
| DR-58 | Automatic narrowing is a Journal **overlay**, never a rewrite of signed Constitution files | Automatic narrowing vs founder-only writes | C5 |
| DR-59 | Widening activates after a 12 h cooling-off (**accepts 05's NEW DECISION**, #14). Exceptions: a Genesis Charter at A0–A2 within default caps; draws on a pre-signed emergency-capacity envelope | Stolen-passkey defence without killing speed | #14, B01, B24 |
| DR-60 | **The charging rule — one pool per purpose.** (1) Delivering obligations → obligations reserve. (2) Judging funded work → acceptance reserve. (3) Recovery → recovery reserve. (4) *Manufacturing* acceptance capacity (Verifier Foundry) → the acceptance reserve's **uncommitted** headroom only, ≤25% of it per month (parameter), never windows already reserved for admitted missions. (5) Improving how the organisation works — auditions, Forge, config trials, Skill Foundry, reflex re-runs, residual harness tuning → Improvement sleeve (floor 6%, 12% for the 30 days after a model release, cap 15% of investment-lane capacity; all parameters). (6) Constructing the organisation until Handover → the **Build Charter**. (7) Everything else → its investment sleeve. Every draw names a beneficiary and faces the 30-day outcome check (DR-47) | Accepts #10 (ND-04-1) as written, #11 modified (headroom-only, capped), #18 modified (ends at Handover) | #10, #11, #18 |
| DR-61 | **The billing rule** (replaces DR-45's wording, pending founder decision D2). Default **until D2 is signed: every headless run uses an API key.** Recommended for D2: attended headless on the **subscription for Claude only**, when the job was launched by the founder's command *and* a presence proof is <30 min old (parameter), at A0–A1, on D0–D1 data. **All Codex headless → API key.** Autonomous ventures, customer/client data (D2+), and initiative-generated jobs → API key. Subscription work carries an API shadow price. A terms change flips to strict. 09a's `providerMode` must match | 09a and 15 disagreed; strict-until-signed is the safe default | #7, #21, OG G2 |
| DR-62 | Fencing authority and anchors live in a **third failure domain** (accepts 09a's NEW DECISION, refines DR-09) | No host can grant itself the epoch | #6, D3 |
| DR-63 | `support_bucket` beside rungs E0–E5 (accepts 06's NEW DECISION) | One ladder, one meaning | #3 |
| DR-64 | UNPARSED verdict state (accepts 08); driving → `travel`, asleep → quiet hours (accepts 08). "Know at Tap only by founder override" is **superseded** by DR-65 | Strictly safer | #13 |
| DR-65 | **Reach resolution is one ordered table owned by 08.** Floors: Halt ≥ Buzz (Ring after 5 min unacked); Decide on a one-way door ≥ Tap; a CCIR line carries its own signed floor (default Tap; `wake` lines may exceed quiet hours); Know about an executed one-way effect ≥ Reel unless a CCIR line raises it. Ceilings come from Founder State, focus, quiet hours and budget. If floor > ceiling: Halt, `wake` CCIR lines, and one-way Decides whose deadline precedes the next permitted window take the floor. Otherwise delivery is **deferred** to the first permitted moment, and if that is after the deadline the silence rule applies. Property test: reach ≥ floor, or deferred-and-deadline-safe. 05, 09b and 16 supply inputs and never choose reach | Reach rules produced several answers | C4, G2, G-B4, B21 |
| DR-66 | A venture **pivot** (new intent) is a new Charter: founder passkey, never silence, never automatic. A strategy change inside existing intent is a goal-tree change (A3 proposes, A4 decides) | 17 allowed autonomous pivots | C3 |
| DR-67 | No rule may name a method. Method-named guards in 03 are rewritten as invariants that accept equivalent evidence-producing methods | P8 vs 03's G2/G4 | C6 |
| DR-68 | One versioned wire schema for labels, owned by 09a, with a published mapping. 06 owns semantics and uses the wire names. Classification, boundary, retention class, retention deadline, permission, taint and origin stay distinct. Human provenance is a provenance field, not a new origin | 06 and 09a schemas differed | C7, B16 |
| DR-69 | Single-family mode yields **provisional** verdicts that never satisfy a missing coverage edge. A human may substitute for a missing edge only if the coverage contract named a qualified human alternative before launch | Degraded mode must not manufacture acceptance | C8, B25 |
| DR-70 | Nothing is *published* (main, deploy, outbound) before the coverage contract's required verdicts. Staging integration may precede them. R3/R4 effects need a Time-out Confirmer edge. Settlement has three separate edges (artifact accepted, deployment observed, promise fulfilled) | Landing preceded acceptance in S3/S9 | B07, B09, B38 |
| DR-71 | When the producer accepts a FAIL's defect and reworks, the old candidate stays FAIL and no adjudication is needed. Adjudication is required only to accept a candidate over an unrefuted FAIL. Independence is judged per component *and lineage*, not family name | Material-disagreement path was skipped | B08, B17 |
| DR-72 | Immediate scoped SCRAM (containment, extendable to siblings with recorded applicability evidence) is separate from an antibody's observe → warn → block lifecycle | Containment ≠ promoting a detector | B11 |
| DR-73 | **SP1 fixes into 03**: capability-checked success tests; `awaiting_gate` stop state; diminishing-returns stop; `veto` question class exempt from VoI; Referee fetches pages (claim-source fetch + quote match before any model); loop only when the decision is worth ~20× a single run, else single run + one Referee pass; cheaper steward with compact state | PARTIAL: steering held, stopping failed | SP1, OG G6 |
| DR-74 | Completion guarantor: the Re-scope Review trigger in 03 | No role re-scoped failing missions | OG G9 |
| DR-75 | Qualification is per model version × capability × route. Retirement or replacement is scoped to exact configurations. Reports show partial completion. Capability tests are within-model pairs | Model-release reflex over-generalised | B35, B36, B37 |
| DR-76 | Classification consent (e.g. a Fleet Import sort) never grants authority. Member and imported Charters activate only by signature (DR-59). Secret scanning is deterministic and precedes any model reading a repo | Import silently promoted repos | B33, B34, G-B6 |
| DR-77 | Evidence debt has durable identity, a successor owner and a frozen question. A pivot neither erases it nor lets an underpowered result count as repayment. Rung-bearing evidence must match the exact proposition | Debt and proposition drift | G6, B02, B18 |
| DR-78 | Wagers recuse interested **records and lineages**, not only families. The wager query is frozen at registration and evaluated at its resolution date | Family switch did not remove the interest | G-B2, B14 |
| DR-79 | Sealed derivatives stay local unless a governed **Release** effect clears them (consent scope, disclosure test, founder signature). De-identification alone changes nothing | S12 exported sealed study data | B30, G-B3 |
| DR-80 | Concession exposure is the full commitment value (e.g. 2 months × 20% × MRR), checked against grants. The wrist never approves offers or outbound | $960 was booked as $80 | B19 |
| DR-81 | Provider spend caps are reservation buckets held before every debit. Acceptance headroom cannot be consumed by execution | S10 judge cap exhausted | B23 |
| DR-83 | Launch logs derive the worker **family from the model id**, never from the slot it was launched into (accepts 12's ND-12-2). DR-73 is 12's ND-12-1, accepted | Slot-derived family mislabels cross-family evidence | 12 ND-12-1, ND-12-2 |
| DR-82 | Package reading paths live in canon §11; every file's links are relative siblings (`05-…md`, not `../05-…md`) | #5, #9, B40 | #5, #9, B40 |



## 7. Numeric targets (TARGETS, not facts)

**Every figure below is a target or an assumption, not a forecast or a claim about any real company.** Adopted from the
expander (R3-X §3) with the founder-side rows reconciled against S03, S07 and S08. "Beyond a billion-dollar company" has
three definitions, all required, because each alone can be gamed: **value**, **output**, **capability**.

| Measure (TARGET) | Year 1 | Year 3 | Year 5 |
|---|---:|---:|---:|
| Portfolio enterprise value (at an *assumed* 5–8× ARR, to be re-sourced) | $10–16M | $200–320M | **$1.0–1.6B** |
| Revenue run-rate (ARR) | $2M | $40M | $200M |
| FTE-equivalent output (weekly, matched, accepted) | 60 | 800 | **3,000** |
| Accepted outcomes per month | ~600 | ~8,000 | ~30,000 |
| Demand probes per year | 1,000 | 5,000 | 15,000 |
| Probe graduation rate | 4% | 6% | 8% |
| Flagship ventures | 3 | 6 | 10 |
| Autonomous micro-ventures | 12 | 80 | 300 |
| Acquired businesses held | 2 | 15 | 50 |
| Ventures sold, cumulative | 0 | 10 | 40 |
| Active Guild members | 20 | 250 | 1,000 |
| Deterministic Share of acceptance | 40% | 75% | 90% |
| Model Foundry share of model calls | 0–5% | 30% | 50% |
| Original studies published | 2 | 12 | 30 |
| All-in compute + tools per matched hour (illustration) | ~$5 | ~$3 | ~$2 |
| Compute + tools as share of revenue | ~31% | ~12% | ~6% (standing ceiling target ≤18% after Year 2) |
| Founder working hours / week | 50 | 40 | 35 |
| Founder **decision** minutes / day | ≤45 | ≤40 | ≤30 |
| Founder seconds per accepted outcome | ~135 | ~9 | ~1.8 |
| Outcomes settled with no founder contact | ≥90% | ≥97% | ≥98% |
| Governance overhead on two-way doors | ≤10% | ≤10% | ≤5% |

**First-90-day leading indicators (targets):** 100 probes with ≥3 graduations; Deterministic Share ≥20% in two task
classes; one Trigger-Armed Option registered per week; one customer wish shipped in <24 h; founder decision minutes flat
as ventures are added; one venture from Fleet Import running at A2; the first cross-family Referee FAIL caught before a
customer saw it (SLICE did this once on day zero).

**Per-venture parameters (initial, tunable):** venture genesis ≈8 min and ≈$3 with 3 founder confirmations (S08);
default minute supply 45 weekday / 10 weekend + 30-min weekly board (§9 F4); Closer Ratio healthy ≥0.45, tripwire <0.25
for 3 weeks (S03); Referee utilisation ceiling 70%; Improvement sleeve ≤15%; exploration ≥10% of casting; internal
revenue ≤30% and 0% toward PMF.

## 8. File map — who owns which topic

Writers own their topic fully and **link** for everything else. "Not here" lists the most likely overlaps.

| File | Owns | Not here (link instead) |
|---|---|---|
| **00-CANON** | Principle, authority stack, Decision Contract, vocabulary, glossary, decisions register, targets, file map, draft founder decisions | — |
| **01-VISION** | What vibe startuping is; principles; the three definitions of "beyond a billion-dollar company"; what is genuinely new; the founder's week in the destination | Mechanisms (all other files) |
| **02-ORGANISATION** | The chosen organisation and the road from five concepts; system map; each authority drilled down; interactions; one action end to end; where the expander's additions live | Mission internals (03), identity records (04), autonomy levels (05) |
| **03-MISSION-ENGINE** | Mission record, lifecycle and facets, cycle and moves, Framing Contracts, Bets, forecasts, evidence ladder and debt, self-challenge, stop/pivot/kill, the Allocator (VoI + Thompson), lanes and sleeves (Probe, Replication, Strategy Cells, Option Pool, Long-Horizon, Improvement), complementary bundles, pattern miner, SP1 | Team composition (04), founder packets (05), economics maths (09b) |
| **04-AGENT-ORGANISATION** | Identity records, hybrid specialties and the 19 candidates, Generalist Null, Audition Ladder, cast registry and casting, Seam Miner, mission shapes, team composition and dissolution, equal-worker routing, blackboard, leases, responsibility, hot resources, integration queue, nested-agent visibility, context profiles, incident roles, forced leave, swarm patterns, protocols (MCP/A2A) | Acceptance procedure (09b), capability admission (07) |
| **05-AUTONOMY-INITIATIVE-FOUNDER** | Constitution content, Charters, A0–A4, grants, modes and states, principal modes, never-list, decision-rights matrix, initiative engine, Closer Claims, Progress Ledger and busywork, Co-founder seat and board, wagers, Standing Orders, contact **classes**, Attention Exchange, silence rule, CCIR, Founder State, continuity and succession, Decision Supply Bench | Reach rendering (08), mandates (16) |
| **06-MEMORY** | Brain, record map (with 09a), typed records, Use Ledger, Orphan lint, Sleep, forgetting verbs, Launch Pack, Wrap Deposit, labels (semantics), Lesson Airlock, Priors/Null, Pain Index store, portfolio store, founder memory | Journal internals (09a) |
| **07-SKILLS-TOOLS-MCP** | Capability Registry and pipeline, harvest sources and counts (DR-43), per-family projection, Loadout, tool leases (policy), Tool Surface Lock, Skill Foundry, Gap Radar, Model-Release Reflex, Backlot, Model Foundry, retirement | Gateway mechanics (09a/16) |
| **08-SURFACES** | Mission Control page by page with wireframes, board and Launch Sheet, **reach** and Reach Router, Dailies Reel, Map, Traces and "why", terminal, chat, mobile, voice/phone, Office Window, Wrist Grammar, Office Hours, honest undo in UI, founder-state sensing | Contact classes (05) |
| **09a-ENGINEERING** | Kernel/Userland, six nouns + Operation, Decision Contract compiler and policy snapshot, journal, leases and storage fencing, effect identity and idempotency, WorkerAdapter, isolation ladder, credential routing and provider terms, labels (mechanics), protected computing base and release train, hosts and external fencing, data policy, observability, substrate trigger ladder | Evals (09b) |
| **09b-ECONOMICS-EVALS-SIM-IMPROVEMENT** | Four resources, reserves, Budget Ledger, forecasting whole missions, degraded modes, treasury, correlated-failure budget; Acceptance Coverage Contract and coverage graph, Verifier Foundry, eval tiers, twin, calibration, leverage and FTE-equivalent; Regulation's stocks, homeostats, exposure book, immune system, governance budget and control ROI; weekly scorecard; self-improvement loop | — |
| **10-INSPIRATION-MAP** | Every system studied: what it does well, what we take (use, fork, learn), licence | Our design |
| **11-CONCEPTS-AND-JUDGES** | C1–C5, J1/J2 scores, why the synthesis chose four then seven authorities; the road not taken | — |
| **12-SPIKE-RESULTS** | SP1, SP2, SP3, SLICE: hypothesis, result, design change, open questions | — |
| **13-WORKED-SCENARIOS** | ≥12 end-to-end walkthroughs (agents by title and family, time, budget, skills, memory writes, approvals, surfaces) | Mechanism definitions |
| **14-BUILD-PLAN** | Phases, jobs ≤30 turns, lanes, how the organisation builds itself, what is Year 1 | — |
| **15-RISKS-AND-DECISIONS** | Risk register (every red-team failure with its design answer and test), final ≤10 founder decisions | — |
| **16-EXTERNAL-WORLD-HUMANS** | Effect Gateway and Front Desk behaviour, mandates, Offer objects, claims standard, identity and disclosure, brand cells, kill levels, Obligation Keeper, legal body (entities, Books, contracts, tax), Rooms, Human Task Market, Guild, counterparty agents, Atoms Gateway, Acquisition Desk and Capital Desk mechanics, relationship repair | Venture strategy (17) |
| **17-VIBE-STARTUPING-IN-PRACTICE** | Genesis, Fleet Import, Stage Clock and Vital Signs, the seven operating loops, venture tiers and fleets, Probe Swarm, Replication Engine, Wish-to-Ship, Fork Fleet, Keystones, Frontier Program, inter-venture economy, exits and OpCo Packs, Pivot Court, a founder's day and week | Mechanism internals |

## 9. Founder decisions (D1–D10, aligned with 15)

Final wording, options and deadlines live in [15 §8](15-RISKS-AND-DECISIONS.md). The canon's draft F1–F10 map one-to-one
onto D1–D10. Milestones M0–M5 are 15's build-milestone deadlines (targets).

| # | Decision | Recommendation | Deadline |
|---|---|---|---|
| D1 | Standing launch permission for the Kernel's dispatcher | Yes: launcher-only, binaries pinned by digest, argv templates, forbidden flags, per-launch tool lease with forbidden list, isolation ≥ I2 if headless, budget cap, fenced lease; 12 concurrent / 120 per hour (parameters); a Receipt per launch | M0 |
| D2 | Paying for model work: API caps; headless runs on the subscription | Caps $150 Anthropic / $50 OpenAI per autonomous venture per month, raised only by the Treasury rule. Attended headless on the subscription for **Claude only** (founder-launched, presence proof <30 min, A0–A1, D0–D1). **Codex headless always API.** Until signed: all headless on API (DR-61) | M1 / M2 |
| D3 | Hosts, third failure domain, residual host risk | Dedicated always-on Mac (Kernel) + small cloud host (Front Desk, effectors) + third-domain fencing and anchors (DR-62); alternate host drilled quarterly; Kernel-host admin compromise acknowledged, mitigated per 09a | M2 |
| D4 | Founder minute supply and reach | 45 min weekdays / 10 weekends + 30-min board; windows 08:00 and 17:00; Ring for Halt and for Decide above $200/h cost of delay, ≤2 calls/day; wrist only for two-way doors <$50 with 1-h held undo, never offers, outbound or publishing | M2 |
| D5 | First autonomous ventures | Two: an imported live-revenue venture A2 → A3 and a new agency at A2; A4 only by Promotion Case after ≥8 weeks at A3; he names them | M0 / M2 |
| D6 | Deputy and Continuity Will | A named human Deputy who accepts a scoped grant and passes a drill (a professional Deputy acceptable), plus an alternate; per-venture Will; required before any A3+ venture with live customers | M3 / M4 |
| D7 | Legal holding structure and insurance | Holding entity + DBAs pre-revenue; own entity on 16's triggers; lawyer and accountant confirm; broker opinion per entity before its first A3 money mandate; until then commitment mandates capped at the Repair Budget | M3 |
| D8 | Who sells; outbound rules | First 10 sales calls per Flagship are his; 1:1 disclosed cold outreach ≤30/day/cell, US and consenting B2B, under an A2+ mandate; EU/IL per-batch approval; bulk cold email never | M2 |
| D9 | Acquisition Desk, Capital Desk, Guild | Approve as destination capabilities; fund legal review (incl. contractor classification) in Year 1; he signs the first acquisition and first Guild contracts | M5 |
| D10 | A third acceptance route | Paid human adjudicator pool (3, ≤5% of acceptance spend) now; Model Foundry spike (parity within 2 points at ≤25% cost, or a null) | M3 / M5 |

Not founder decisions (mechanism changes inside Allocation's or an owner's envelope): DR-56 to DR-82.

## 10. Rules for section writers

1. Obey §2–§6; use §4–§5 words; say "target", "illustration", "measured (source)" or "parameter" for every number.
2. Agents are named by **title and expertise**; Claude Code and Codex are **equal workers** in every example; every worked
   example names which family did which job and who judged it.
3. **Never write playbooks as the core.** Describe records, authorities, stores, loops and tests; methods are optional.
4. **Add, don't shrink.** Each file carries a section of ideas the founder did not ask for.
5. Every mechanism names its authority (§2), its store (record map, DR-07), its failure mode and its test.
6. Every founder touchpoint names its class and reach (§4).
7. Do not write backticked identifiers shaped like claim ids (a lowercase `c` followed by a hyphen); the ledger lint
   treats them as claims.
8. Mermaid diagrams, tables, YAML/TypeScript shapes and ASCII wireframes beat paragraphs.

## 11. Reading paths (R5-ISSUES #5)

- **Founder, 45 minutes:** 01 → 02 §1 and §7 → 00 §2–§3 → 05 §1 → 13 (S1, S8, S11) → 15 §8.
- **Build team:** 00 whole → 02 → 09a → 03 → 04 → 09b → 07 → 06 → 16 → 08 → 14 → 12 → 15.
- **Reviewer or red team:** 00 §3 and §6 → 15 → 13 → the owner file of any row.
