# SYNTHESIS · the rethink round · 2026-09-06

```
what:    one ranked de-duplicated decision list from eight thinking lanes and one research lane, plus a ledger of
         everything else they found, so nothing a lane wrote is lost
fixed:   founder rows v1–v5 and v54–v65. Nothing below reverses one. Where a proposal moves a founder row it moves
         its IMPLEMENTATION and says so
codes:   (Lx) the lane that raised it · (FACT: world.md N) a fact from the research lane · (NEW) this synthesis
rule:    no schedule, no durations. Nothing here is built, installed, spent, published or pushed
counts:  16 FOUNDER DECISIONS in 4 rounds · 80 ORCHESTRATOR FIXES + 32 world-fact fixes · 26 RESEARCH FIRST ·
         6 REFUSED · 22 contradictions · 3 load-bearing assumptions · 21 deletions
```

---

## 0 · What the round found, in three sentences

**(NEW)** Coverage is not the problem and was never the problem: across roughly 640 keywords the lanes found **one**
absent from v2's own text (consent — may we contact this person at all), and everything else is placed, refused with
a reason, or renamed. What the lanes found instead is one shape repeated in every field — **a rule that names a
mechanism nothing has built, or names no mechanism at all, sitting beside a measurement that would have caught it**:
the trust score nothing reads (L2), the anchor nobody has ever shown to fail (L5), the second family nothing records
(L7), the cord that stops dispatch rather than work (L3), the "resume, not restart" with no carrier (L6), the queue
the Desk ranks that has no store (L1), and every bound in the plan bounding what the system *starts* while nothing
bounds what *arrives* (L8). The decisions below are therefore mostly not about what to build but about **what to
measure, what to refuse, and which fields to write down before the first row exists** — because six of them are free
today and impossible to backfill afterwards.

---

## 1 · The founder's decisions — ranked, in rounds of four

*Ranked by impact on §0.1 × how much of the plan they move × how cheap they are to build. Each round is one
AskUserQuestion. The recommended option is first and carries `(Recommended)`.*

### Round 1 — The control plane: who may touch the machine, and what stops it

**D1 · Mission control's identity, and the phone**

> **Ask:** Mission control is the only surface that dispatches — page 4's drag launches a session with a team, page 7
> launches one with a chosen worktree, provider, model and agent, and every tap opens a terminal on your Mac. No line
> in §14, §15 or §D says who may call it. How should it authenticate, and how should the phone reach it?

| Option | Why | Cost |
|---|---|---|
| **A · Loopback bind, one keychain-held token on every write route, phone through an authenticated tunnel (Recommended)** | Keeps every tap you asked for and puts one identity check under the one surface that can dispatch (L6) | One config line, one middleware, one tunnel to choose and keep working |
| **B · Loopback only; the phone reads and decides through the published artifact pages and writes requests the Watch reads** | The seed already pins `127.0.0.1` and its own guard file records that anything else on the loopback reaches everything (L3) | Nothing to build; the phone loses instant taps and the cord becomes one tick |
| **C · v39 as written — bind to your own network** | It is what v39 says today | Zero build; an unauthenticated dispatch plane on any network the Mac joins |

**Lanes:** L3 (P10) · L6 (P2, *surface authentication*, the lane's only ADD in §10) · L8 (F).
**Row:** moves **v39**'s implementation; new row under §D. **Falsified by:** `lsof -nP -iTCP -sTCP:LISTEN` showing a
non-loopback bind, or a tap accepted from a device that presented no token.

**D2 · What the cord actually stops**

> **Ask:** §12.9 says the cord *"cancels running work"*; the mechanism is a file read at the next tick, which stops
> the next dispatch and nothing in flight. Separately, cancelling a Codex cloud task is documented nowhere.
> Should the cord signal running children, and should unattended work be refused on a carrier whose stop path is
> unknown?

| Option | Why | Cost |
|---|---|---|
| **A · Both — the launcher records each child's process group and the cord signals it; `bin/run` refuses to mint unattended work on a carrier whose `stop:` reads UNKNOWN (Recommended)** | The cord is your only emergency control and cannot do what its own section claims; `SIGTERM` is measured to give exit 143 and a resumable turn, so it stops without destroying (L3) | One field, one signal path; the Codex cloud *maker* lane stays shut until cancellation is documented — which is §I row 15's state anyway |
| **B · Signal only; mint unattended work on every carrier** | Cheaper, and the in-flight hole is the one that bites | One field; an uncancellable hosted task is possible |
| **C · As designed — the cord stops dispatch, and the plan says so plainly** | Honest, and costs nothing | None; your stop is bounded by the tick period and does not reach a running child |

**Lanes:** L3 (P4, P5) · L7 (P5) · L8 (F). (FACT: world.md 22 — Codex shipped `Interrupt` hooks, the natural
Codex-side receiver, and no row names it.)
**Row:** moves **v13**'s carrier table and **v56**; a new `stop:` column on §C.4. **Falsified by:** pulling the cord
mid-run, measuring time to quiescence, and whether the run resumes.

**D3 · One egress program**

> **Ask:** Three paths leave a run's process and each is governed differently — the open web (the trifecta only), an
> MCP call (a hook that cannot see it, because a matcher must name the exact tool), an outward act (the Sender, which
> is right). Should everything leaving a run pass through one no-model program that logs every call, filters by
> domain **and HTTP method**, and injects credentials the agent never sees?

| Option | Why | Cost |
|---|---|---|
| **A · Build `bin/egress`; `--strict-mcp-config` names only the proxy; the MCP policy file becomes its configuration (Recommended)** | The trifecta guarantees a leg is missing at dispatch; this keeps it missing at the syscall, and it is the only proposal that survives an agent being *fully* persuaded (L3) | One program, one hop of latency, each server declared twice |
| **B · Configuration only — measure the sandbox's `credentials` (`mask`, `injectHosts`) and `network` blocks first, both documented and unused here** | If they behave as their schema suggests, half of A is a config change | One measurement (R2), then possibly nothing |
| **C · As designed — structural prevention, no detection** | The trifecta is genuinely strong | None; *"every call logged"* stays unenforceable and nothing tells you an injection was attempted |

**Lanes:** L3 (P1 — *tool audit log*, *credential read denial*, *prompt injection defense*, *fetched-content taint*).
**Row:** **v33** gains a mechanism; new row in §F. **Falsified by:** a deliberate exfiltration attempt failing at the
proxy rather than at the prompt, and the proxy's call count matching the runtime's for one night.

**D4 · An erasable data path, and the consent register**

> **Ask:** Three sentences in v2 cannot all hold — the log is never edited (§15.3), eviction archives and never
> deletes (§13), and a deletion request is honoured (§16). And *"may we contact this person at all"* appears only in
> COVERAGE, in no part of the plan. Do we make the data path erasable by construction now?

| Option | Why | Cost |
|---|---|---|
| **A · Both — no personal datum enters the log or memory (both hold a hash), one erasable per-subject store holds the body, erasure deletes that row and the hash becomes *a known absence*; the consent register is a store with one writer, read by the Sender before any contact (Recommended)** | It is the only version of the rule a venture with real customers can keep, and it turns a legal exposure into a file layout (L3) | One indirection per inbound row, one store, one checklist line |
| **B · The consent register now; the erasable path when a venture has customers** | Cheapest thing that stops a contact to a person who never consented | One store; the erasure exception stays a sentence with no path |
| **C · As designed** | No work | None; a person's data inside the log is structurally unerasable, and COVERAGE names a mechanism §12 does not carry |

**Lanes:** L3 (P2, the field's single ADD, *data classification tags*, *data retention schedule*).
**Row:** §13 and §15.3 move; new rows under §16. **Falsified by:** run one erasure end to end, then grep the whole
tree for the subject and find nothing but hashes.

---

### Round 2 — Evidence: what an agent must show before it is trusted

**D5 · Curator and challenger in wave one**

> **Ask:** v54 starts with the eight agents that have *"a seed file or a code path today"*. Wave one therefore has no
> writer of memory or skills, and nothing that attacks a plan before it binds. The curator's code paths are on this
> branch now — `evict-memory.mjs`, `ledger.mjs`, `check-citations.mjs`, `check-memory-budget.mjs`. v64 makes the
> harness the first venture, and its work is irreversible-tier by this repo's own classifier. Should either join wave
> one?

| Option | Why | Cost |
|---|---|---|
| **A · Both (Recommended)** | The curator meets v54's own stated test with four verified code paths, and mining with no curator produces candidates nobody may write (L4); the challenger is one read-only file, the cheapest in the roster, and wave one's only gap with a *measured* harm behind it (L7) | Two agent files; the challenger runs single-family until Codex or Gemini lands, labelled rung 4 rather than hidden |
| **B · Curator only** | The knowledge loop is the one that makes every other part better on the day it lands | One file; plans still bind with no external attack until wave two |
| **C · Wave one as decided; promote when founder-minutes per finished intent crosses a line you set** | Keeps the wave a bar rather than a date, and §21.1 already measures the number (L5) | None now; the nightly loop, the negatives store, the taste store and the sighting counter are offline in the only wave that exists |

**Lanes:** L4 (P2) · L7 (§35 *contrarian-review agent*) · L5 (*taste review panel*) · L6 (§19 — the support chain
names three agents and none exists in wave one).
**Row:** moves **v54**'s implementation, reverses nothing. **Falsified by:** the harness venture producing handovers
nobody reads, and a count of memory proposals with no writer.

**D6 · An agent is not routable without an onboarding pack**

> **Ask:** §5 calls the agent file *"the onboarding"*. It onboards the runtime. Should an agent become routable only
> when it also carries at least one rehearsal case with a known answer, one exemplar of its own good output with
> provenance, one end-to-end demonstration that its anchor actually fires, and namespaces that resolve?

| Option | Why | Cost |
|---|---|---|
| **A · Yes, for every agent, wave one included (Recommended)** | The pack is what distinguishes `writer` from `builder-with-a-different-prompt`; in a band nobody publishes evidence for (v31), evidence is the only thing that can settle the design (L2) | Three artifacts per agent, once — twenty-four for wave one |
| **B · Wave two only** | Wave one's eight are demonstrated by the harness's own work | Eight fewer packs; the wave-one agents stay unmeasured, which is where the roster's cost is actually paid |
| **C · No pack — the file is the onboarding** | No work | None; the roster's benefit stays a belief and v31's cost is paid with nothing bought |

**Lanes:** L2 (P1; *onboarding checklist per agent*, *agent onboarding doc*, *apprenticeship pattern*).
**Row:** new row under §5, using `bin/run`'s existing refusal of a brief naming a missing file. **Falsified by:** pack
against no-pack on the same known-answer cases with the §E.2 runner — if the packed agent does not win, the pack is
ceremony and the proposal is refuted by its own test.

**D7 · Agents expire, like every other durable thing**

> **Ask:** Skills expire with a forced disposition, claims carry one, charters carry a horizon, a memory item is
> refused without a falsifier. Agents alone are declared and then permanent — and they are the costliest of the five.
> Should every agent file carry `valid_until`, with exactly one recorded disposition at expiry: Refresh, Merge, or
> Retire, with the anchored evidence attached?

| Option | Why | Cost |
|---|---|---|
| **A · Yes, all fifteen (Recommended)** | v31 puts fourteen in a band nobody has evidence for and §5.6 calls the claim falsifiable while nothing schedules the moment anyone looks (L2); the machinery is `scripts/ledger.mjs`, already blocking on this branch | One frontmatter field; a small number of your answers a year |
| **B · The six wave-two business agents only** | They are the roster entries with the least outside evidence — no fetched roster ships a sales, CRM or legal agent at all | Half the field, half the answers |
| **C · No expiry** | The count is yours and already decided | None; the roster becomes the one object in the system that can only grow |

**Lanes:** L2 (P3, *worker retirement*) · L7 (§35 *sunset-candidate review*, which extends the same idea to a
**provider position**: nothing retires Codex's foreground slot if it returns rung 4 on most checks).
**Row:** extends **v19**'s idiom to §B.2. It does not reopen v1 or v54's count. **Falsified by:** the first expiry
producing a Merge or a Retire — or a cycle where every agent Refreshes on real evidence, which is the strongest
defence of fourteen available.

**D8 · Rate the anchors, or mark them unrated**

> **Ask:** The plan's whole architecture is that belief traces to something outside a model, and §11.11 lists fifteen
> anchors — **none of which has ever been shown to fail when it should**. This repository has already shipped a change
> that removed a control while every test stayed green. Should every anchor carry a mutation case, a known-bad input
> it must fail, or be marked `unrated`?

| Option | Why | Cost |
|---|---|---|
| **A · Every anchor, and §21's rung-1 share splits into rated and unrated (Recommended)** | An uncalibrated anchor is a rung-4 belief wearing a rung-1 label — the error §11.7 built the reconciliation to catch, one level up (L5) | One case per anchor, written by whoever writes the anchor, as a rehearsal-case body under v18 so it inherits admission and forced expiry free |
| **B · Only the anchors that gate irreversible work** | Concentrates the effort where a false pass is unrecoverable | Fewer cases; the rung-1 share stays flattering everywhere else |
| **C · No rating** | No work | None; a green check keeps meaning *nothing complained*, and the plan's central claim stays an assumption |

**Lanes:** L5 (P1, *false-positive rate*, *false-negative rate*) · L4 (*golden output archive* — the same set must not
ship into the runtime, which is orchestrator fix **O11**).
**Row:** new row extending §11.2 and v45. **Falsified by:** an anchor that passes its known-bad input is unrated by
definition; the first rung-1 share that falls is the system telling the truth for the first time.

---

### Round 3 — The window, the queue, and what accumulates

**D9 · Budget in window share, not in dollars**

> **Ask:** Three ceilings are denominated in dollars, and on a subscription the dollar is a locally computed shadow of
> a bill nobody sends — the vendor's own words are *"the session cost figure isn't relevant for billing purposes"*.
> Meanwhile *"idle capacity is bounded by being free"* was true of one rolling five-hour fuse and **v22 made it
> false**: the weekly window is per seat and shared with Claude chat and Cowork, so a night of exploration is
> subtracted from your next day. Change the currency?

| Option | Why | Cost |
|---|---|---|
| **A · Ceilings read a window gauge (tokens against an observed high-water mark, since no denominator is published) with wall-clock beside them and USD kept as a shadow price; exploration-class intents route to Gemini, local models or the Codex seat, and the Desk refuses an exploratory dispatch onto the Claude seat past a fraction you set (Recommended)** | The system stops budgeting in play money and starts budgeting in the thing that runs out (L5) | One high-water file, one rule in the Desk, one class on the intent |
| **B · The gauge only; leave exploration where it is** | Metering forward beats learning the wall by hitting it | One file; the night still spends the morning |
| **C · As designed** | No work | None; and the reserve stays a percentage of a quantity nobody has counted |

**Lanes:** L5 (P3; *budget in money*, *exploration spend*, *rate-limit cost impact*) · L6 (§31 *cross-venture resource
pool* — per-venture ceilings do not compose, so two ventures inside their ceilings can jointly exhaust the seat) ·
L8 (B) · L2 (*worker cost cap* — the cap is per run and a standing intent has no aggregate).
**Row:** new rows beside **v22** and **v23**. **Falsified by:** split one weekly window between driven and
exploratory work — if exploration is invisible there, the old sentence was right and this is over-built.

**D10 · How the Desk ranks**

> **Ask:** The Desk ranks `Weight × Decay ÷ Cost`. Dividing by measured cost means cheap work permanently outranks
> expensive work, and v55's standing intents supply an endless stream of cheap work. `Decay` is also undefined for an
> intent that never expires, which is most of a ten-venture queue. Replace the formula?

| Option | Why | Cost |
|---|---|---|
| **A · A lexicographic order — obligations (ranked among themselves by consequence and the world's own deadline) · work that unblocks other work · your weight band · cheapest inside the band; `Decay` split into its two facts and defined for a standing intent as time-since-last-move normalised by its own cadence (Recommended)** | Explainable on the board with no tuning, cannot invert your weight, and is *less* code than the formula it replaces (L1, L8) | One comparator, one branch, no new store |
| **B · Keep the formula; fix `Decay` and add a standing-work share cap per window** | Smallest change that stops the starvation | One counter; the cheap-beats-expensive inversion stays |
| **C · As designed** | No work | None; an expensive high-weight intent can starve at any weight you set |

**Lanes:** L1 (P4; *priority queue*, *goal conflict resolver*, *ticket aging*, *goal window cap*) · L8 (A — the
obligation tide, standing-intent decay, the staged-output tide) · L2.
**Row:** moves §4.5 and **v55**'s implementation. **Falsified by:** replay `logbook/desk/<tick>.json` over a simulated
month under both orders and count dispatches of the top-weight intent — the replayer is deterministic, free, and
reads a file nothing reads today.

**D11 · What happens while you are away**

> **Ask:** Nothing in the system can compute whether you are here. The reserve holds 30% of every window for someone
> who may be on a plane; a *which* sits in a queue with a stated default nothing executes; the briefing is a morning
> page, and a month is not a paragraph. Add one derived value — **the last founder event** — and let four things read
> it?

| Option | Why | Cost |
|---|---|---|
| **A · Yes: release the reserve to autonomous work when your last event is older than the reserve's own horizon and snap it back on the first tap; execute a which's stated default at its intent's expiry, archiving both built options; build one option instead of two when you have been absent; give page 5 a *since you were last here* view keyed on the event, never on a date (Recommended)** | §0.1 asks for a *"self-adjusting"* system, and adjusting to your absence is the one adjustment it currently cannot make (L8) | One predicate and one field, shared by four call sites |
| **B · The which expiry and the return view only** | Fixes the queue growth without touching your reserve | Less; 30% of every window sits idle for a month |
| **C · As designed** | Your 30% and 3/day stand as decided | None; a month away reads as a fault and costs a third of the capacity |

**Lanes:** L8 (P1, F) · L1 (*clarifying question trigger*, and the unbounded which queue at fifty sessions) · L5.
**Row:** inside your own *"Keep 30% and 3/day; evidence moves them"* (DECISIONS §15); new row under §4.4. Note that
option A does **not** reintroduce an approve verb and does not reverse v9 — a silent run still cannot ask.
**Falsified by:** the reserve hit rate §21.1 already measures moving off *expired-unused*, and the count of second
options built and never chosen falling.

**D12 · How big the skill library may get**

> **Ask:** The published standard loads roughly 100 tokens of metadata at startup **for every installed skill**, so
> each admitted skill taxes every unrelated run — the same shape as the manifest defect this repo already paid for at
> ~15,000 tokens a lookup. The upstream advertises 2,111. Should the binding constraint be a measured budget rather
> than taste?

| Option | Why | Cost |
|---|---|---|
| **A · A per-agent startup metadata budget enforced by the checker that already exists, plus one generated directory per namespace so an agent loads only what its file declares (Recommended)** | Converts an open-ended library into a budgeted one, which is what v3's ambition needs to stay affordable (L4, L5) | One script modelled on `check-memory-budget.mjs`, one generator pass; the import stops when the budget binds |
| **B · Namespace directories only, no number** | Most of the saving, none of the argument | One generator; the tax is reduced and unbounded |
| **C · As designed — count is an output of admission and expiry does the rest** | v3 as written | None; a good new skill makes every unrelated task dearer, forever |

**Lanes:** L4 (P3; *skill count*, *skill lookup cost*) · L5 (*skill discovery cost*).
**Row:** **v3** gains one clause; extends v48 and §E.4. **Falsified by:** R8 — two trees, one with the full house
library installed and one carrying only one agent's namespaces, identical prompt, comparing input tokens. If the tax
scales with declared namespaces rather than the installed library, the budget is unnecessary.

---

### Round 4 — Vendors, families, and noticing when the world moves

**D13 · What happens when a family is limited, unreachable or wrong**

> **Ask:** v22 says a family limit is a reroute and a seat limit is a stop, and never says **where a reroute goes** —
> and because Codex is one foreground slot and Gemini is scout-only, a seat-limit stop stops the whole company.
> Separately, the plan asserts in six places that a second family buys error independence and measures it nowhere.
> Build the fallback and the instrument?

| Option | Why | Cost |
|---|---|---|
| **A · A three-deep `fallback:` per agent ending in *stop and stage*; a cross-family reroute recorded as a **rung demotion** unless that family passed the rehearsal for that move class; a `class: calibration` rehearsal set that is never edited; and one provider-outage drill with the primary family denied at the launcher (Recommended)** | A fallback without the demotion clause silently trades correctness for availability, and an instrument refreshed by the rule that refreshes its subject cannot detect drift — a ruler that is re-cut measures nothing (L7) | One frontmatter field × fifteen files, one `class:` field, one deny switch, one drilled night |
| **B · Fallback chains only** | Cheapest thing that stops a company-wide stop | One field; vendor independence stays an architecture claim with no anchor |
| **C · As designed** | No work | None; the first seat limit is a company-wide stop nobody has rehearsed |

**Lanes:** L7 (P3; *model fallback chain*, *model-drift detection*, *vendor-lock-in avoidance*, *multiple-model second
opinion*). (FACT: world.md 19 — v32's *"version ≥ 0.124.0"* floor is 29 minor versions stale against 0.153.4 and no
longer discriminates.)
**Row:** moves **v22** and §11.10; a new field on the agent schema. **Falsified by:** the drill's completion count
against a normal night, and calibration results moving when a model id changes.

**D14 · Which hosted lane may make — and per venture**

> **Ask:** §I row 15 is still yours. Codex cloud is your named preference and has no documented driver; Anthropic's
> `claude --cloud` and Routines are documented and run on **the same seat as your Floor**, under the same terms clause
> you kept open. A hosted run also clones the repository into someone else's VM, which contradicts *local-first*, and
> nothing lets you choose per venture.

| Option | Why | Cost |
|---|---|---|
| **A · Decide the lane after one measurement — how many hours the Mac is actually off and where they fall — and add the charter field `cloud: allow \| deny`, default `deny`, now, whichever lane wins (Recommended)** | A lane buying back a small tail is not worth the terms question of §I row 1; one buying back most of the week is, and nobody has counted (L6) | One field now; one local read of the sleep log |
| **B · Codex cloud as a PR reviewer only — already admitted by v56(a) — no maker lane, plus the field** | Sidesteps #19945 entirely and needs no local Codex | None beyond the field; the night stops when the Mac does |
| **C · Anthropic's documented drivers as the maker lane, plus the field** | The only fully documented off-Mac driver today | The same seat as the Floor and the same open terms clause |

**Lanes:** L6 (*local-first privacy mode*, RQ2) · L7 (*interrupt-hook handling* — cancelling a cloud task is UNKNOWN,
which is D2's refusal) · L3 (§18). (FACT: world.md 24 — four weeks of Codex release notes mention no cloud exec, no
cancel, and no #19945; absence is not denial, and the June–August window is unread.)
**Row:** **§I row 15**; **v56** gains a per-venture switch. **Falsified by:** the hours-off measurement.

**D15 · Agent-to-agent messaging**

> **Ask:** COVERAGE marks *worker-to-worker request* and *peer help request* with a `?`, and v13 names three
> **dispatch** mechanisms and no channel between sessions that are already running. Two vendors shipped one in the
> same window. What shape should a message between agents take?

| Option | Why | Cost |
|---|---|---|
| **A · A message is a handover or an objection, on the handover schema, one append-only file per message; an ask carries a deadline and the asker's stated fallback if unanswered; page 2's message control posts through the shipped transport, whose ids are recorded as attributes and never as a join key (Recommended)** | Free-form agent chat is evidence with no provenance and no ledger row, and the teams mailbox is a mutable document *"overwritten on the next state update"* — a lost-update surface where a vanished message looks exactly like one never sent (L5) | No new schema; three required fields |
| **B · Adopt the vendor transport directly for teammates, files for `-p` children** | Least code | Two shapes for one thing, and the lost-update surface stays |
| **C · No agent-to-agent messaging; everything routes through the Operator** | Fewest moving parts | None; the `?` stays open and page 2's message control has nothing to post to |

**Lanes:** L5 (*worker-to-worker request*, *peer help request*) · L2 (§20 *conflict resolution* — fourteen agents make
ninety-one pairs and v7 designs one of them). (FACT: world.md 11 — Claude Code shipped `SendMessage`/`ListAgents`
between sessions on one machine, with a 30-second inbox-socket rule; **FACT: world.md 20** — Codex shipped `@` task
mentions, so two providers shipped this in one window and the plan models neither.)
**Row:** new row under §C.4; resolves a COVERAGE `?`. **Falsified by:** a run whose only input was a peer message
still reconstructing from files alone, and killing the responder mid-run — the asker must still hand over.

**D16 · Noticing when the world moves**

> **Ask:** 13a.7's four rethink conditions are internal, lagging and all blocked on the same absent briefing
> generator, while the facts most likely to invalidate this plan are external and already written down — a retirement
> date, a deprecated flag, a substrate's licence, an issue that could close. And §J holds **fifty-four alternative
> architectures** with no way to notice when one starts winning.

| Option | Why | Cost |
|---|---|---|
| **A · Every SPINE row resting on a fetched fact carries `source:` and `valid_until`; a `scout` standing intent re-fetches them on the free Gemini window; a changed fact opens a Decide item **naming the row it invalidates**. Plus one `wins_if:` line per §J entry (Recommended)** | This round is what the alternative looks like: nothing in the system reads the plan cold, so eight lanes had to be dispatched by hand (L7) | One field per load-bearing row, one standing intent (v55's shape, already decided), fifty-four lines written once by the people who already wrote the reasons |
| **B · The `source:` / `valid_until` half only** | The rot detection without the alternative register | Less; the graveyard stays decoration |
| **C · As designed** | No work | None; the plan cannot notice its own premises expiring |

**Lanes:** L7 (P4; *periodic architecture rethink*, *alternative-architecture proposal*, *assumption-challenge
prompt*) · L4 (*knowledge freshness check* — for a vendor fact the falsifier beats the date, and the `claim-source`
resolver already fetches a URL and asserts the quote).
**Row:** moves 13a.7 and §J's format. **Falsified by:** re-fetch this plan's external facts once and count how many
moved; and after the next change, whether any `wins_if:` matched. If none ever does, the losing images are decoration
and should be argued down rather than stored.

---

## 2 · Orchestrator fixes

*Decided by the orchestrator, not the founder: each follows from a rule already on the page, a measured fact, or an
internal contradiction — the class DECISIONS §10 and §12 settled without the founder.*

### 2.1 · Stores and schemas the one-writer rule already implies

| id | Fix | From |
|---|---|---|
| **O1** | **The work-item store.** `keel/ventures/<v>/work/w-*.yml` with `intent`, `purpose`, `ceiling`, `blocked_on`, `attempts`, `last_failure`, `card`; proposals land in `work-draft/` and the Watch materialises them after the store check — v44's obligation pattern reused. A board card becomes a **view** of a work row, not a second object. `bin/check-stores` refuses a live intent with zero work rows | L1 (P1; goal tree, sub-goal chain, sub-task decomposition, ticket generation/template/dependency/status/aging, epic-to-ticket, cross-ticket linking, duplicate detection, blocked state, blocked reason, mission dependency graph, relentless-retry, give-up) · L2 |
| **O2** | **`keel/shared/roster.yml`**, with frontmatter, argv files, §17.1 and page 2 generated or checked against it. Carries `color:` (closing a COVERAGE `?`), `wave`, `valid_until` (D7), `maxTurns`, `isolation`, anchor. Resolves the shell-count drift | L2 (P2; agent registry, agent color tag, skill-to-role mapping) |
| **O3** | **`keel/shared/schemas/charter.yml`** — §2.1 enforces six lines, COVERAGE §14 says five, v63 requires a seventh. A six-line charter with no entity both loads and is refused today, and **the founder's row is the one that loses**. The schema generates the prose | L2 (P5) |
| **O4** | **`keel/shared/schemas/brief.yml`** — §13a.5 says the brief has ten fields; **v45 decided eleven**, and the correction-attribution table is built on the wrong count | L4 · L5 · v45 |
| **O5** | **`keel/shared/routing.yml`** — *which agent, which model, which band* is answered by §B.2's routing column, §C.1's bands and §9.2's per-move rows, with nothing checking that they agree. `scripts/classify.mjs`'s own header says why that ends badly. Generate all three | L7 (P1) |
| **O6** | **`keel/shared/schemas/event.yml`**, a `schema_version` on every row, and `bin/log` refusing a row that fails it — four consumers already infer four contracts. A reader **refuses** an unknown version rather than guessing, which is v26's posture toward the vendor's format turned on our own | L6 (P5) · L8 |
| **O7** | **The handover schema gains five fields:** `objection:` (L2, v7 generalised to all ninety-one pairs), `brief_sha` (L5), `maker_family`/`maker_model`/`checker_family`/`checker_model` (L7 P2), `actor:` with exactly one legal value today (L8, inside v65), and an **idempotency key on the staged artifact** rather than only on the resume path (L8). **All are free before the first run and a full backfill afterwards** | L2 · L5 · L7 · L8 |
| **O8** | **`keel/shared/prices.yml`** with `fetched_at` and `valid_until` per row; a stale row **refuses routing** rather than mis-pricing. Gemini's quota is carried as a **count** (60/min, 1,000/day), not a price | L5 · L6 |
| **O9** | **One house-level decide queue** (`keel/logbook/decide.jsonl`) replacing ten per-venture `open.md` stores; rendered by page 4 and page 5; a row with no intent id is refused | L6 · L8 |
| **O10** | **`keel/host/`** — the plist, the managed-settings template, the env file (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `ANTHROPIC_DEFAULT_HAIKU_MODEL`), the sandbox block, the `denyRead` list and the expected macOS grants, with `bin/probe` asserting the live machine matches **by attempting the operation**, not by reading a database | L6 (P1) |
| **O11** | **`keel/golden/` and eval-only rehearsal bodies.** v18 makes *exemplar* and *rehearsal case* two of four admissible SKILL.md bodies and §7.1 generates every admitted skill into the two directories an agent loads from — **so the case that will judge a run can be read by that run**. One frontmatter field, one generator rule, `check:manifest` re-pointed | L4 (P1) |
| **O12** | **`keel/surfaces/pages/<n>.yml`** — every element resolves to a store path (`fact:`) or a `bin/` verb (`tap:`), and the renderer builds only from the manifest. Page 1 loses the venture toggle and the portfolio moves to page 3's strip: §14.4 forbids page 1 being where a decision is made, and *"a beautiful surface will always win the argument against a useful one"* is how that argument gets won | L6 (P5, §31) |

### 2.2 · Programs the design needs and does not name

| id | Fix | From |
|---|---|---|
| **O13** | **`bin/embed` and `bin/classify`** — the local tier has **no reachable carrier**: the armed sandbox denies a loopback `bind()` and the tier's consumer `curator` carries no `Bash` and no MCP. Make it no-model programs in the Watch's launchd context handing the curator a file — v47's shape | L6 (P4) · L4 · L5 |
| **O14** | **`bin/worktree`** — v41 gives four agents `isolation: worktree` and `git worktree add` cannot complete under the armed sandbox; interactive escalation is unavailable to an unattended run by construction. A run never creates its own and is handed one in its argv | L6 |
| **O15** | **The wake reconciler.** `bin/run` writes `run.started` before exec; the Watch reconciles `sessions.jsonl` against `claude agents --json --all`, the tmux session list and the process table, writing **`orphaned`, never `finished`**, then resuming by id or closing with a reason; and it refuses a night lane the power assertions cannot promise to keep awake. *"Resume, not restart"* is asserted and nothing performs it | L6 (P3) · L5 (*silent failure detection*) |
| **O16** | **The Watch/Sender lease.** `logbook/watch.lease` holds a host id and a heartbeat; the Watch refuses to tick without it and the Sender refuses to act without it, so the restore drill's clone can never tick and never send. This is the only failure in the whole round that ends in a **duplicated outward act** | L8 (P3) |
| **O17** | **`bin/redact`** — redaction is implemented twice, in the mining pass and as a `gitleaks`-class scan, and two implementations of one check disagree | L4 |
| **O18** | **`bin/bell`** — the interruption budget is designed and its transport is named nowhere. One no-model program is the only thing that may ring, reading the wake-me classes, the budget and the per-channel acted-on rate | L6 |
| **O19** | **The same-failure predicate** — the anchor's exit signature where there is one, cosine over local MiniLM embeddings of normalised failure text where there is not, calibrated on labelled pairs. **Three named mechanisms sit on top of this gap**: the fast loop's stop on a second identical failure, the sighting counter, and memory dedup | L4 (P5) · L1 (*retry ladder*, one hash shared with §4.5's repetition tripwire) |
| **O20** | **A replayable Desk** — the Desk already writes its ranking and the gate that stopped each candidate and nothing reads it. A no-model replayer is the only way to tune scheduling without living a month. In the same move those fields become **event-log rows** rather than a file per tick, the highest-volume artifact in the design holding an answer whose value decays in hours | L1 · L8 |
| **O78** | **A scratch house** — `keel/fixtures/` and `bin/drill`: the Sender, Watch, door and launcher have **no test seam**, and a Sender defect is an outward act that cannot be recalled | L6 |
| **O79** | **Blue-green at a tick boundary** for `bin/watch` and `bin/send` — free, because every tick is already crash-only | L6 |

### 2.3 · Rules already written that acquire a mechanism

| id | Fix | From |
|---|---|---|
| **O21** | `/goal`'s condition is composed from v45's existing `anchor:` field — *"`<anchor>` exits 0, and `<done-test>`"* — turning the most frequently executed judgement in the system from a small model reading prose into an exit code. It is also the mid-run external critique wave one otherwise lacks entirely | L1 (P2) |
| **O22** | `bin/run` refuses a brief whose `done-test:` is not **byte-identical** to the intent's; brief and handover are logged as adjacent hashed rows. §6.2 mandates a verbatim copy and nothing checks it, and §3.8 records this repo losing a measurement in synthesis **twice** | L5 (P5) · L2 |
| **O23** | **Forced disposition at expiry for intents and charters**, plus a **lapse record** — one row per thing that expired unactioned, ordered by what it stopped. `bin/horizon` is the single pass over every durable store that 13a.6 marks a WISH | L1 (P5) · L6 (*venture wind-down*, *reactivation checklist*) · L8 (F) |
| **O24** | Every anchor declares `effect: none \| metered \| reaches-the-world`; the unattended re-run executes only `none`. **An anchor with a side effect turns the regression suite into a Sender** — a v33 breach arriving through the one mechanism the plan calls free | L5 |
| **O25** | One shared **sample-floor predicate** for the trust score, skill admission and the error rates — §11.10 prints `insufficient` below a floor while §E.2 admits a skill on 2–3 cases | L5 |
| **O26** | The trust score gets **three named consumers** and a **model dimension**: the launcher (below floor on a move class, that class is unroutable until a rehearsal passes), the briefing, and §5.6's falsifiability claim. Today nothing reads it | L2 (P4) · L7 |
| **O27** | Cross-venture isolation is **probed, not asserted**: `bin/run` refuses a brief naming two ventures, `bin/probe` attempts the cross-venture read nightly, and the store check refuses a memory write whose venture scope differs from the writing run's | L3 · L8 · L4 |
| **O28** | Route `tester` and `challenger` on the `-p` carrier only until `bin/probe` asserts read-denial on subagents and teams — blindness is argv there and UNVERIFIED elsewhere | L5 |
| **O29** | Promote the `claim-source` resolver from SHADOW to **blocking on `scout` handovers only**, so the friction lands on the one agent whose entire anchor is that check | L5 |
| **O30** | `bin/verdict` signs with a key under a path every agent's grant excludes and `denyRead` covers, stated honestly: this raises forging from a file write to defeating a checked deny rule — a guardrail, not containment | L5 |
| **O31** | **Hash-chain the event log** (each row carries the sha256 of the previous), and **every sandbox escalation writes an event row** and appears in the briefing. Both escape hatches are used and recorded nowhere, in a log editable without trace | L3 (P4, P6) |
| **O32** | A **`provider_cap`** is required on any credit-spending tool at the door and `bin/run` refuses a grant whose recorded cap is null. §F refuses RunPod for *"spending money at a rate under an uncapped key"* and admits Higgsfield, which spends credits, on a rate cap no named program enforces — one rule, two answers | L2 (§26) · L3 (P1) |
| **O33** | Bulk collection of personal data passes the §F door with `guard` and a data-classification row **before** it runs. Lead scraping is the only item in the departments both unprecedented in every fetched roster and legally exposed | L2 (§27) |
| **O34** | Three **data classes** on every store row — ours · a third party's · a named person's — assigned by the writing program, with the never-list keying on the class rather than on paths; and **retention declared per store**, where a store declaring *forever* may not hold a body | L3 |
| **O35** | Record `scopes_observed` read back from the provider beside `scopes_requested`; record a binary's version string and sha256 at admission, since version pinning is defined for MCP descriptions and undefined for the binaries that actually run at night | L3 |
| **O36** | Refuse `/import` and `claude import` inside the house with a `UserPromptSubmit` hook. §9.3's door governs tools and v53 governs pages; **nothing governs a config import that carries over MCP servers, commands, subagents and skills** | L7 |
| **O37** | Delete the project-`settings.json` tier of tool grants — grants live in exactly two places, the argv the launcher composes and the managed file a running process cannot clear | L3 |
| **O38** | Deny through the `decision` object on non-blocking hook events and keep exit 2 for the documented blocking ones. *The founder deferred the hook rewrite to build time (DECISIONS §15), so this is the specification, not the act* | L3 |
| **O39** | **Hash the standing prefix** (system prompt, tool definitions, skill metadata) at dispatch, record it, treat a change as an event, and turn on `--exclude-dynamic-system-prompt-sections` and `--system-prompt-snapshot on`, which §9.5 names shipped and unused. The hit rate is a lagging indicator on a bill; the prefix hash is a leading indicator on a dispatch | L5 (P2) |
| **O40** | **Rotate** into `logbook/events/YYYY-MM.jsonl` with a rebuildable rollup per period; no surface reads the raw file; the index partitions by the same period so a corrupt period costs a period. Nothing is deleted and the rollup stands to the log exactly as memory already does | L8 (P2) · L5 · L6 |
| **O41** | Log **skill activation** and join it to outcomes; a skill that never fired defaults to **Deprecate** at expiry and a founder waiver is what keeps it. v19 stays whole — retirement is still date-forced — only what the disposition *reads* changes | L4 (P4); depends on **R14** |
| **O42** | A **watermark** on the mining pass (`bin/mine --since`), so the backlog pass and the steady pass are one program; *"unread transcript count"* becomes **watermark lag**, which stays meaningful in year two | L4 |
| **O43** | **Negatives scope split** — a negative whose reproducing command names no venture path is a fact about the world and is **house scope**. Today a tooling dead end is relearned once per venture | L4 |
| **O44** | Memory dedup's *near-duplicate* threshold is **calibrated on labelled mined pairs**, not guessed; a conflict pair becomes an item with its own **owner and expiry** and reaches the founder as a *which* at expiry | L4 |
| **O45** | **Slice precision**, derived by the curator from the artifact and handover and never self-reported, incrementing ACE's helpfulness counters. §13.5 says *"the Desk is itself measured"* and names no measurement, so the ranker cannot be wrong | L4 |
| **O46** | The improvement backlog is a **filter over the intent store** where `kind: improvement`; delete `keel/logbook/backlog.jsonl` — COVERAGE says twice that improvements are intents | L4 |
| **O47** | The skill admission record carries the **body hash**; a changed hash voids admission until re-eval. A failed candidate is written to `CURATION.yml` (house scope, exists, already checked), **not** to the per-venture negatives store | L4 |
| **O48** | A **`skill.miss` event** when a brief's namespace resolves to zero unexpired skills — uncovered-field detection today has no trigger and is something the Operator notices | L4 |
| **O49** | Night escalation is **a queue row plus the wake-me test, never the Operator**. 13a.1 says *"the Operator is the escalation"* and §4.4 says the Operator is not always on, so a run that stops at 03:00 escalates to something that is not running | L1 |
| **O50** | Register `.claude/hooks/budget-guard.js` in settings. **The stall fuse exists on this branch and is registered nowhere** — a fuse that is not wired is a memory of a fuse | L1 |
| **O51** | Idle work must serve a live intent, a standing intent, or the negatives/knowledge stores, or it is a leak with a cheap price tag — gate 4 reads the same provenance test as gate 5 | L1 |
| **O52** | `catch_up: yes \| no` on a standing intent — `StartInterval` **coalesces**, which is right for a tick and wrong for a cadence: v55's `every:` intents vanish silently across a sleep and nothing says so | L6 |
| **O53** | The *edit-arguments* verb writes **a new brief, never argv**; `bin/run` recomposes and may narrow, never widen beyond the band, and refuses surface-supplied argv | L6 |
| **O54** | A Q&A answer renders **only** with the log-row or memory-item ids it rests on; zero citations renders as *I cannot answer that from the log*. It is the one element a model writes | L6 |
| **O55** | A **`statutory` wake-me class exempt from the interruption budget**, declared on the obligation rather than judged in the moment | L8 (C, F) |
| **O56** | A support obligation whose promised response time falls inside the next window **promotes past the interruption budget**, and demotion never applies to obligations — the budget is founder-shaped and a waiting customer has a clock it does not know about | L2 (§28) |
| **O57** | `writer`'s **split model default** becomes a §G.1 row with a named trigger — one file declaring two models puts a routing decision in the one copy no table reviews; and `analyst` **loses `Bash`**, which contradicts §C.1's placement of it in *read and report*, overtaken by v47 giving every comparison to `bin/reconcile` | L2 |
| **O58** | A **deterministic accessibility check** through the designer's existing `playwright` grant is the rung-1 anchor; the designer's judgement is rung 2. §5 claims accessibility is *"computable rather than judged"* and names no program | L2 (§23) |
| **O59** | A legal flag carries **the clause quoted verbatim** with its source and location, never a summary, and its anchor is that the quote resolves — `scout`'s own rule, checked the way `check-citations.mjs` checks a quote | L2 (§29) |
| **O60** | **Bug intake:** an anchor that fails twice writes a card whose done-test is the **reproducing command**; with no reproduction it is a bounded question for `scout`, not a ticket | L2 (§24) |
| **O61** | Brand-voice work is **unroutable while the taste store is empty** — the anchor names a file that does not exist until the mining pass runs; until it fills, the anchor is the founder's pick between two staged drafts | L2 (§26) · L5 |
| **O62** | Any taste or brand check must first pass a **held-out discrimination test** — rank labelled approved artifacts above rejected ones — and its measured rate prints beside every verdict; below chance the check is **deleted rather than tuned** | L6 (§19) · L4 (§11.6's held-out fraction that produces no number) |
| **O63** | **Wind-down:** at a charter's horizon exactly one disposition — continue · park · wind down; `bin/check-stores` refuses `tempo: parked` with an undischarged obligation, and refuses promotion to `driven` while any relied-on date has passed | L6 · L2 |
| **O64** | A **provenance line on the Sender's checklist** beside v63's disclosure — source, licence, date read. Inbound licences are read exceptionally well and **outbound is unchecked**: nothing records the licence of a third-party asset embedded in a published artifact | L2 (§14) · L3 (§18) |
| **O65** | A **taint id** on every inbound row, carried by any handover derived from it, with the Sender refusing a staged artifact whose lineage names an uncleared id — plus a per-venture **canary string** in every inbound row's provenance that `bin/send` refuses, making an injection attempt a `wake-me` | L3 (P5) |
| **O66** | PII detection becomes a **gate on two paths** — the Sender's checklist and the mining pass — where a positive blocks and an override is a *which*; its false-positive rate is measured for a week **before** it blocks | L3 |
| **O67** | **Rotation is an obligation** — one row per credential in `obligations.yml`, surfaced by the briefing. Rotation *"at the horizon"* is a promise with no clock and needs no new mechanism | L3 |
| **O68** | `bin/curate` takes a **venture argument**: *one writer* is a property of a store, not of a process, and the two readings are identical at one venture and diverge at ten | L8 |
| **O69** | State the parallelism axis: **parallel is legal where the unit is a store row and refused where it is a file.** v6 is right about artifacts and is being read as a rule about agents — `steward` over ten ventures' obligations is independent in scout's exact sense. This restates v6 and never widens it to one artifact | L2 |
| **O70** | Page 2's census is `claude agents --json --all` joined to **our** `sessions.jsonl`; the vendor's `config.json` enriches with tmux pane ids only, because it is *"overwritten on the next state update"* and a page polling fifty rewriting files shows a different fleet every render | L6 · L8 · L5 |
| **O71** | A **`sessions` ceiling** in settings: `bin/run` refuses to mint past N live rows and `bin/supervise` refuses to restart into a full table, so a crash loop cannot become the concurrency event. §14.12 names three bounds and **none is a session count** | L8 |
| **O72** | **The file lease** — the Desk refuses a run whose declared scope intersects a live run's worktree scope. v6 removes the intra-artifact case and is silent on two intents, one file, conflict found at landing | L5 |
| **O73** | **A terminal state for a run that cannot resume:** after N failures it becomes a `blocked` card in *waiting on you* carrying the exact failure text, written to negatives so the next brief carries it | L5 |
| **O74** | **One control chart** over each shape's own history for cache-read share, tokens per run and trust pass rate, replacing three thresholds someone would otherwise invent at 3am | L5 |
| **O75** | **Cost per rung movement, per venture**, on the briefing beside cost per finished intent — the only ROI computable honestly, because the numerator is measured and the denominator is set by the world | L5 |
| **O76** | The restore drill's number goes on the briefing beside the two non-numeric lines §16.8 already has | L8 |
| **O77** | Every ceiling carries `tokenizer:` and `bin/run` refuses to enforce a legacy cap on a current-tokenizer model — Opus 5 and Fable 5.x produce *"approximately 30% more tokens for the same text"*, and **a ceiling that fires early is indistinguishable from a stuck run** | L5 |
| **O80** | A **calibration number per agent** — how often an empty `uncertain:` preceded a defect found later. `uncertain` is written by the run about itself and nothing ever checks it, so a confidently wrong run pays nothing | L1 |

### 2.4 · World-lane facts that move a row with no decision attached

*(All from research/world.md, accessed 2026-09-06. Each names the exact row and the exact change.)*

| id | Fact | Row · change |
|---|---|---|
| **W1** | Fable 5.1 shipped: `claude-fable-5-1`, 1M context, $10/$50 per Mtok, **$0.25/Mtok cache reads** (FACT: world.md 1) | **v57** — the id and the 0.025x read are confirmed; the subscription-seat UNVERIFIED **stands** |
| **W2** | *"`fable` and `best` … keep resolving to Fable 5 for now … pick Fable 5.1 in `/model`"* (FACT: world.md 2) | **v57 · §G.1** — an agent file naming `fable` and one naming `claude-fable-5-1` are **not the same routing**. Write the full id, and admit it in `scripts/prompt-standard.test.mjs` in the same change |
| **W3** | Sonnet 5 is **$2/$10 as standard list price**, not a promo (FACT: world.md 3) | **§G.6 / O8** — drop any promo caveat on the Sonnet row |
| **W4** | The vendor now emits `prompt_cache` (hit ratio, misses, re-cached, warm/cold), `rate_limits.spend_limit`, a per-loop `/usage` breakdown, and a `modelPricing` managed setting (FACT: world.md 4) | **§D page 3 · v14** — page 3 is specified over a hand-kept price table; four of its numbers are now structured vendor fields it can read instead of compute |
| **W5** | `--max-budget-usd` now includes a **1.1× US-only-inference premium** for data-residency workspaces (FACT: world.md 5) | **v23** — still a local estimate, now with a residency multiplier |
| **W6** | `experimental.cacheTtl` (`5m`/`1h`) is **per-agent frontmatter**; `promptCacheTtl` and `subagentPromptCacheTtl` are settings (FACT: world.md 6) | **§B.2 gains a column · §G.3 gains a row** — v57 justifies Fable on the 0.025x read, and TTL decides whether that cache is warm. Pairs with **O39** |
| **W7** | `--restricted` *"refuses `bypassPermissions`, and ignores user, project and local settings files"* (FACT: world.md 7) | **v10 gains a second mechanism** (the flag refuses bypass by itself) and **v11 narrows** — on the `-p` carrier the project tier is ignored outright, which is independent support for **O37** |
| **W8** | `permissions.blockReadsOutsideWorkingDirectories` (FACT: world.md 8) | **v43** — a **read** narrowing expressible in settings: exactly the carrier v43 could not name for the subagent and team mechanisms, and the thing **O28** is waiting on |
| **W9** | `--add-dir` refuses network paths (FACT: world.md 9) | **v34, minor** — a grant composed by `bin/run` cannot point at a share |
| **W10** | `CLAUDE_CODE_SUBAGENT_MODEL` no longer overrides an agent's own `model:` (FACT: world.md 10) | **§B.2 · v59** — before it, one env var silently flattened fourteen per-agent model choices |
| **W11** | Cross-session `SendMessage`/`ListAgents` shipped, with a 30-second inbox-socket rule (FACT: world.md 11) | **v13 · §C.4 need a fourth row** — see **D15** |
| **W12** | Agent teams repaired four times in the window and never promoted out of experimental; the failure class is **lost teammate output** (FACT: world.md 12) | **v59** — the risk of the founder's *teams on* decision is exactly what page 2 renders. Pairs with **O70** |
| **W13** | `/schedule` exists and drives routines; `code.claude.com/docs/en/schedule` returned **HTTP 404** (FACT: world.md 13) | **v12 · v55** — a fourth scheduling surface inside the CLI. Semantics UNKNOWN → **R25** |
| **W14** | `/goal` check-ins now back off 30 min → 1 h → every 2 h, and **an idle session gets at most three check-ins per goal** until someone messages it (FACT: world.md 14) | **v12 — the sharpest fact of the round.** Under `-p`, check-ins are the only way the runtime delivers anything, and nobody is there to message it. A night goal loop therefore delivers three times and then goes quiet. **v12's mechanism must be re-specified against this**, and it strengthens **O21** and **O15** |
| **W15** | `/loop` gained a self-paced dynamic mode and an autonomous default (FACT: world.md 15) | **v12 unchanged** — still session-scoped, still refused in production; the losing image got stronger, not the decision |
| **W16** | The `Workflow` tool's prompt footprint fell from ~5.7k to ~1k tokens, with a bundled `workflow-authoring` skill (FACT: world.md 16) | **v35 unchanged and cheaper**; §E's thirteen namespaces do not list the bundled skill |
| **W17** | `PreModelSwitch` / `PostModelSwitch` hook events, both able to **block** (FACT: world.md 17) | **§12 · v57** — a blocking gate that could enforce v57's default or v21's escalation, and no row uses it. The *"34 events, 10 blocking"* count is at least 36 |
| **W18** | `bashOutputMaxChars` and `taskOutputMaxChars`, up to 128K (FACT: world.md 18) | **§16's context budget gains a row** — a vendor-enforced ceiling on the largest single source of unplanned context, against a ≤500-token handoff convention |
| **W19** | Codex is at **0.153.4 (2026-09-04)** (FACT: world.md 19) | **v32** — its rehearsal floor of *"≥ 0.124.0"* is 29 minor versions stale and no longer discriminates. Restate the floor as *the installed version, recorded* |
| **W20** | Codex ships `@` mentions between tasks (FACT: world.md 20) | **§H · v13** — the second vendor to ship agent-to-agent messaging in one window; feeds **D15** |
| **W21** | **Guardian** is a third Codex control axis, background-scoring, whose behaviour changes with the approval mode; review history *"isolat[es] subagent history"* (FACT: world.md 21) | **§C.1** — the band table models Codex as two axes (`approval_policy` × `sandbox_mode`) and the cell understates what governs a Codex run |
| **W22** | Codex `Interrupt` hooks (FACT: world.md 22) | **§H · D2** — the cord's natural Codex-side receiver, named by no row |
| **W23** | Codex extensions can *"inspect or replace MCP tool results before reaching the model"* (FACT: world.md 23) | **§F · v53** — an admitted tool's **output** can be rewritten before the model sees it: a taint path the door does not test for. Pairs with **O65** |
| **W24** | No Codex entry read mentions `codex cloud exec`, a cloud API, cancel, poll, goal mode or #19945; the June–August window is **unread** (FACT: world.md 24) | **v32 and v56(b) stand.** Absence is not denial — record it as such |
| **W25** | Gemini CLI ships **named subagents** with their own tools, MCP servers and context windows, delegated by `@agent`, defined in `.gemini/agents` (FACT: world.md 25) | **roster.md fact 1 gains an eighth system** (v2's evidence strengthens); **v42 gains a case it did not contemplate** — a third agent-file location, per provider |
| **W26** | Google states v6's rule in its own words and adds a second reason: parallel subagents consume the rate limit faster (FACT: world.md 26) | **v6 strengthened** — three independent vendors now, and the second reason is v22's window |
| **W27** | Gemini CLI's releases are dominated by security hardening, including *"enforce fail-closed workspace trust and filter mcpServers in restricted mode"* (FACT: world.md 27) | **§H lacks a Gemini row of any kind** — this is the nearest third-runtime analogue to `--restricted` |
| **W28** | Devin's automations ship a **max-concurrent-runs cap per automation** and **per-automation cost attribution** (FACT: world.md 28) | **v55** — Devin ships v55's exact shape plus two ceilings v55 has no mechanism for; the store check refuses `every:` without a ceiling **per run**, which is a different cut. Feeds **D10** and **O32** |
| **W29** | Factory's named droid taxonomy is **NOT FOUND** on a second, different page (FACT: world.md 29) | roster.md's UNVERIFIED becomes NOT FOUND; **v1 and v2 unaffected** |
| **W30** | TheAgentCompany: *"The most competitive agent can complete **30%** of tasks autonomously"*, over six job functions (FACT: world.md 30a) | **roster.md's open gap CLOSES**, and **§21 gains an outside floor** — the only external comparator a fourteen-agent design has |
| **W31** | Anthropic's own measurement: the **99.9th-percentile turn duration is over 45 minutes**; ~20% of sessions use full auto-approve, rising above 40% with experience (FACT: world.md 30b) | **§C.2** — fully autonomous mode is designed above a measured unattended ceiling of forty-five minutes, not a night. State it as the cost of the mode, beside **W14**, which is the mechanism that produces it |
| **W32** | *"Claude tended to mark a feature as complete without proper testing"*; testing tools *"dramatically improved performance"* (FACT: world.md 30c) | **v8 gains vendor support** for splitting the self-check from the blind anchor test |

---

## 3 · Research first

*Each is a bounded question with a source class. Nothing below can be decided without it.*

| id | Question | Source class | What it decides |
|---|---|---|---|
| **R1** | Is the Bash sandbox's `filesystem.allowWrite` settable **per `claude -p` invocation**, or project-scoped only? | Vendor sandboxing/settings reference, then one measured cell (L3 RQ1) | Whether the shell can be narrowed to a run's worktree, making `isolation: worktree` enforced rather than declared |
| **R2** | Does the sandbox `credentials` block inject a secret at egress without the child being able to read it, and does `network` support an HTTP-method allowlist and TLS inspection? | Same reference, then one cell (L3 RQ2) | Whether **D3** is one config change or a program we write |
| **R3** | Can a non-interactive background process read a macOS keychain item without an interactive unlock, and under what ACL? | Apple platform documentation, then one detached measurement (L3 RQ3) | Whether §15.4's credential plan works at 3 a.m. at all — the unattended half rests on it and nothing has tested it |
| **R4** | Can a sandboxed run reach a local model, and in which shape — server inside, server outside, or in-process? | Measurement on this Mac, plus the vendor's network model (L6 RQ1) | Whether the local tier is a service or a program (**O13**). Inbound `bind()` is measured denied; **outbound connect to loopback is unmeasured** |
| **R5** | How many hours is the Mac actually off, when, and what is the longest single gap? | `pmset -g log` on this machine (L6 RQ2) | Prices **D14** — a cloud lane buying back a small tail is not worth §I row 1 |
| **R6** | Which inbound sources document a **polling** read with a cursor, and which need a listening socket? | Vendor API docs, one page per source (L6 RQ3) | Whether the world's door wakes and reads or must be reachable from the internet — nothing lifts an inbound `bind` under the armed sandbox |
| **R7** | What is the cache-read share per dispatch shape, and do `--exclude-dynamic-system-prompt-sections` and `--system-prompt-snapshot on` move it? | Ten real moves per shape, read from each run's own token fields, not `/usage` (L5 RQ1) | The premise under **v57**, under §16.3's formula, and under the tenfold reviewer divergence §16.3 records |
| **R8** | Does the skill metadata tax scale with the **installed library** or with the agent's **declared namespaces**? | Two trees, identical prompt, input tokens from `--output-format json` (L5 RQ2) | **D12** |
| **R9** | Does an unattended `-p` run **auto-compact**, and does it emit anything the log can see? | One long `-p` run with `stream-json --verbose`, plus vendor docs (L5 RQ3) | Whether v24's strongest memory rule is being broken where it cannot see. If unobservable, the answer is to bound run length |
| **R10** | Does `codex exec --json` return output with **no controlling TTY**, on a current version, with a non-trivial prompt? | Five known-answer cases on an installed binary (L7 RQ2 / H.2) | **The single hinge of the cross-model architecture.** Pass and rung 2 becomes parallel; fail and the second family is one foreground slot forever, at 1/N availability. Note **W19**: the version floor must be restated |
| **R11** | Does a second model family reduce escaped defects on **our** move classes, and by how much? | Twenty-five paired checks from our own event log (L7 RQ1) | Whether rung 2 outranks rung 4 on any given class. **Blocked on O7's four provenance fields** — cheap now, unreconstructable later |
| **R12** | What fraction of a venture's real done-tests reach rung 1 **without inventing an anchor**? | The harness venture's first thirty intents (L7 RQ3) | Contrarian assumption 1, and with it the shape of the whole architecture |
| **R13** | Does `LICENSE-CONTENT` permit **derivative** skill bodies, not merely redistribution? | The licence file, read raw (L4 RQ1) | Narrower than §I row 4 and decisive: under v18 we would **rewrite** imported bodies, which is a derivative work MIT-on-the-code says nothing about |
| **R14** | Do any of the three CLIs emit a **skill-activation event** we can read? | The three vendors' hook and telemetry docs (L4 RQ2) | Whether **O41** is instrumentation or a field lookup |
| **R15** | Is there any published measurement of **selection accuracy as installed-skill count rises**? | Spec authors, vendor engineering posts, the harness showcase (L4 RQ3) | The real risk of importing thousands. If nobody has measured it, **D12**'s budget is what bounds the exposure |
| **R16** | Does any shipped agent system carry a **scheduling object between the goal and the run** — two objects or three? | Symphony, Linear's agent session model, Copilot's task object; source read (L1 RQ1) | **O1**'s shape; cognition.md's ticket table is explicitly incomplete here |
| **R17** | What does `/goal`'s evaluator accept as a condition, and does an **exit-code** condition behave differently from a prose one? | Vendor doc plus one measured pair of runs (L1 RQ2) | **O21**, which is otherwise a design argument. Now also bounded by **W14**'s three-check-in cap |
| **R18** | Is there measured evidence for a **re-attempt ceiling across sessions**? | Vendor docs and any measured paper on repeated-attempt yield (L1 RQ3) | The N in the attempt counter, which is otherwise taste |
| **R19** | Does an **onboarding pack** change an agent's anchored pass rate? | Our own `skill-creator` with-against-baseline runner, run locally (L2 RQ1) | **D6**, and whether wave two should be gated on evidence at all |
| **R20** | Has anyone published a **roster-size ablation between six and one hundred and fifty**? | Google ADK, LangGraph templates, Sakana, Cognition's and Factory's rosters, TheAgentCompany's leaderboard (L2 RQ2) | The only fact that could responsibly move **v31** in either direction. **W30** closed the headline; the leaderboard remains unobtained |
| **R21** | Does any **credit-spending server expose a spend or balance read**? | Vendor API docs, one fetch each (L2 RQ3) | **O32**: with a balance read a program can hold an absolute ceiling and Higgsfield stays in WRITES; without one it belongs in REACHES-THE-WORLD |
| **R22** | What does **page 3 cost to render at a year of rows**, and where is the knee? | Synthesised `events.jsonl` at this Mac's own emission rate, measured against the real server (L8 RQ1) | Whether **O40** is a day-one shape or a later migration touching the one store the design says is never edited |
| **R23** | Is there a **concurrency ceiling on `claude -p` children**, and does the N+1th fail loudly, queue, or degrade silently? | Vendor docs first, then one measurement (L8 RQ2) | **O71** — the board refuses a drag that would breach a bound, and no bound is a session count |
| **R24** | Does **pixel-agents** render ten venture areas and fifty live agents, and what is its `AgentEvent` schema and ingest rate? | The project's own source and tracker, then one local run (L8 RQ3) | v62's UNVERIFIED, and the writer §14.4 says is ours to build |
| **R25** | What are **`/schedule`**'s semantics — interval floor, storage, headless status? | The vendor doc page, which returned **404** on 2026-09-06 (FACT: world.md gap 2) | Whether v55's Watch-dispatched standing intents should route through it or ignore it |
| **R26** | Was **#19945** fixed between Codex 0.125 and 0.153? | The unread June–August changelog window; three fetch failures recorded (FACT: world.md gap 3) | It would settle **R10** without a local install, and it is the only cheap route to it |

---

## 4 · Refused by this synthesis

*Named, with the reason in one line. Nothing was silently dropped.*

| id | Proposal | Why refused |
|---|---|---|
| **X1** | **An outward identity per (venture × outward class), with an account per venture per channel** (L3 P9) | Aspiration ahead of its subject: v64 makes the harness the first venture and it has no outward channel, and v63 puts the legal entity at intake. **The receipt half is kept** as **O64**/§12; account creation waits for the first venture with an entity |
| **X2** | **An expiry and a forced disposition on §I row 1, the terms** (L3 P11) | The founder kept that row open **by their own word** in DECISIONS §15; attaching a deadline decides something they deliberately did not. Its useful half — confining automated seat access to the harness venture — is already discharged for free by **v64** |
| **X3** | **One Sender process per venture, credentials scoped to it** (L3, ten-venture row) | No mechanism named, and it multiplies the credential problem it is meant to bound. **O16**'s lease and **O27**'s two-venture refusal are what exist today; revisit when a second venture holds a credential |
| **X4** | **Delete the phrase *"resume, not restart"* unless the reconciler is built** (L6 delete 3) | Deleting the rule while building its carrier is the wrong order. **O15** builds the carrier; the rule stays, and if O15 does not land, then the deletion returns |
| **X5** | **Shadow admission — a new agent runs the incumbent's brief, both face the same anchor** (L2, *apprenticeship pattern*) | It doubles the cost of every new agent to buy the evidence **D6**'s onboarding pack buys for three artifacts. Refused as stated, kept as D6 |
| **X6** | **Delete §11.3's three-family panel row** (L7 delete 2) | Correct about the plan's row and dangerous as written: this repository has **three live `verified_by: judge` claims** and a founder waiver running to 2026-11-17 that reason about exactly that panel. The row moves to the **deletions list as a founder decision** (§7), not a synthesis fix |

---

## 5 · Contradictions inside v2

| # | Where | What | Fix |
|---|---|---|---|
| 1 | §B.2 vs §5.2 (L2) | *"eight of the fourteen carry no shell"* vs *"Ten"*; the `tools` column gives ten | **generate** (O2) |
| 2 | §2.1 vs COVERAGE §14 vs v63 (L2) | six charter lines vs five fields vs a required seventh — a six-line charter with no entity both loads and is refused | **schema** (O3) |
| 3 | §13a.5 vs v45 (L4) | *"the brief has ten named fields"* vs eleven; the attribution table is built on it | **schema** (O4) |
| 4 | §C.1 vs §B.2 (L2) | `analyst` is placed in *read and report* and holds `Bash` | **strike** (O57) |
| 5 | 13a.1 vs §4.4 (L1) | *"the Operator is the escalation"* vs *the Operator is not always on* | **queue** (O49) |
| 6 | §12.9 vs its mechanism (L3) | the cord *"cancels running work"* vs a file read at the next tick | **signal** (D2) |
| 7 | §16 vs §15.3 vs §13 (L3) | a deletion request is honoured vs the log is never edited vs eviction never deletes | **hash** (D4) |
| 8 | §F internally (L2, L3) | RunPod refused for uncapped spend; Higgsfield admitted while spending credits under an unenforced cap | **cap** (O32) |
| 9 | §14.4 vs §14/§31 (L6) | page 1 is *never where a decision is made* and carries the venture toggle | **move** (O12) |
| 10 | §7.5 step 4 vs v48/§13.2 (L4) | a failed skill candidate is written to the **per-venture** negatives store; skills are house scope | **CURATION** (O47) |
| 11 | v18 vs §7.1 (L4) | rehearsal-case bodies ship into the two directories an agent loads from | **eval-only** (O11) |
| 12 | §11.10 vs §E.2 (L5) | `insufficient` below a sample floor vs admission on 2–3 cases | **share** (O25) |
| 13 | §6 vs nothing (L6, L5) | *"resume, not restart"* asserted with no carrier | **reconcile** (O15) |
| 14 | §13.7 vs §13.2 (L4) | redaction implemented twice | **one** (O17) |
| 15 | §9.6 vs §16.3 (L5) | the cost formula carried twice with the same coefficients | **cite** (O49 / deletions) |
| 16 | v39 vs §14.13 vs the seed's loopback pin (L3, L6, L8) | the phone reaches *"the local server over your own network"*; every page writes *"nothing but the inbox file and the intent log"*; the server pins `127.0.0.1` | **authenticate** (D1) |
| 17 | §B.2 vs §C.1 vs §9.2 (L7) | routing decided in three places with no generator | **generate** (O5) |
| 18 | §16.7 vs v22 (L5) | exploration *"bounded by being free"* vs a weekly window shared with chat and Cowork | **meter** (D9) |
| 19 | §F vs §8.2 vs §17.3 vs COVERAGE (L3) | four copies of the four-class hands table | **one** (deletions) |
| 20 | §B.4 vs §5.5 vs COVERAGE §23–30 (L2) | three department tables, already drifted on customer service | **generate** (deletions) |
| 21 | v55 vs §4 (L1) | a standing intent is bounded per run and unbounded per window | **aggregate** (D9/D10) |
| 22 | §4.5 vs v55 (L8) | `Decay` is *closeness to expiry* and a standing intent never expires | **define** (D10) |

---

## 6 · The contrarian pass

*(L7's whole section, carried for the founder to read rather than to decide. All three are treated as settled
everywhere in v2 and none carries a falsifier — which is what **D16** would fix.)*

**Assumption 1 — a deterministic anchor exists for most company work.** (FINAL §11.2.) Rung 1, the trust score,
regression-for-free, unattended night work, the refusal of consensus voting and the promise that the founder is not
the bottleneck all hang here. **(L7)** The evidence for it comes from the harness — the most anchorable venture that
could have been chosen, whose anchors are `npm run check` and the probe. What a real venture is made of —
positioning, a price, copy that converts, a design someone likes, whether to pivot — is exactly what §11.2's own
table answers with *taste* or *the founder*. **If false, the architecture inverts:** the night's product stops being
finished work and becomes **built options with their costs**, the morning becomes an adjudication queue with a
throughput target, the **taste store becomes the primary asset**, the trust score measures agreement with the
founder's past taps rather than anchor pass rate (which §11.6 already designed and never let decide anything),
mission control's centre of gravity moves off pages 3 and 5 onto a decision queue, and **the roster shrinks**,
because judgement work cannot be delegated to fourteen specialists however well anchored. **Settled by R12** — the
cheapest measurement named anywhere in this round.

**Assumption 2 — a different vendor's model is a different failure mode.** **(L7)** The cited evidence establishes
the direction and never the magnitude, and never for our move classes: *a model prefers its own generations and its
own family* is a real bias, but it does not follow that three vendors trained on overlapping public corpora fail
**independently** on the errors that matter here. A shared wrong belief about a library's API is shared by all three,
and a cross-family check on it buys correlated noise at twice the price. **If false, diversity is bought on inputs,
not on vendors — and v2 already contains the proof of concept.** v8's blind tester is an **input**-diversity
mechanism: it is rung 1 *because the tester never read the implementation*, its blindness is a property of
`--add-dir` rather than of whose weights it runs on, and its own anchor is deterministic. That is the best-anchored
idea in §11 and it costs no second subscription, no foreground slot and no #19945. **Settled by R11**, which is
blocked on O7's four fields. **(NEW, and it belongs beside this:** L5 records that the plan's own shape dissolves the
constraint the repo has accepted as permanent — `bin/run` is a **no-model launcher driving both providers**, so a
two-family panel need not run *inside* a Claude session at all. That does not make a second family reachable today;
it means the standing *"no non-Anthropic model inside Claude Code"* reason is about the wrong boundary.**)**

**Assumption 3 — routing is correct by construction.** **(L7)** Nothing anchors the Operator's dispatch. §11.11
anchors its read-back and its store check and nothing about *which of the fourteen, on which model, in which band* —
and the decision has three homes (contradiction 17). **A mis-route produces an artifact that passes its done-test,
the blind test and CI while answering the wrong question: the one defect class the anchor ladder is structurally
blind to.** **If false, routing becomes an artifact with a done-test like everything else** — one machine-readable
table (O5), three generated views, ten to fifteen routing rehearsal cases with known answers, and a trust score for
the Operator on routing the way every other agent has one for its move class. Below the sample floor it prints
`insufficient`, and the founder learns the fleet's dispatcher is the least-measured thing in the fleet.

**A fourth, named because the plan already knows it is making it.** Whether Anthropic's shipped headless features
constitute the *"where we otherwise explicitly permit it"* carve-out on a subscription (§G.5, §I row 1, **open by the
founder's word**). If the answer is no, the architecture moves to a metered key and the economics change shape:
batch discounts arrive, v22's two windows stop mattering, and the reserve is redesigned. Listed rather than argued,
because an open decision with both sides written is the correct state for it — see **X2**.

---

## 7 · What the lanes would delete

*Marked **[F]** where the deletion is a founder decision rather than the orchestrator's.*

| # | Delete | Lane · why |
|---|---|---|
| 1 | The rank formula `Weight × Decay ÷ Cost` | L1 — three crude numbers combined into a fourth with no dimensional meaning **[F, = D10]** |
| 2 | `Decay` as a single 0–1 number | L1 — it fuses closeness to expiry with time since it moved, which point at opposite dispositions **[F, = D10]** |
| 3 | The intent's *own urgency* as a second priority scale | L1 — one person, two dials for one decision, and the second is derivable **[F, = D10]** |
| 4 | The sentence *"the Desk decomposes"* | L1 — it assigns a model's job to a no-model program (→ O1) |
| 5 | *"The Operator is the escalation"* for night runs (13a.1) | L1 — §4.4 contradicts it in the same plan (→ O49) |
| 6 | `analyst`'s `Bash` | L2 — the only read-class agent holding a shell, overtaken by v47 (→ O57) |
| 7 | `writer`'s split model default | L2 — a routing decision in the one copy no table reviews (→ O57) |
| 8 | Two of the three department tables | L2 — three renderings of eight rows, already drifted (→ O2's generator) |
| 9 | The phrase *"the agent file is the onboarding"* | L2 — true about the runtime, false about the company **[F, = D6]** |
| 10 | `.claude/mcp-policy.json` as an **independent** control | L3 — a policy whose calls no hook can see; keep it as the egress proxy's configuration **[F, = D3]** |
| 11 | The project-`settings.json` tier of tool grants | L3 — a third tier neither the argv nor the managed file owns (→ O37, and **W7**) |
| 12 | Three of the four copies of the four-class hands table | L3 — keep §F as the decision and §17.3 as the inventory |
| 13 | `--max-budget-usd` from the control section; and its three other restatements | L3, L5 — a stall fuse explained four times invites a fifth misreading; §16.5 owns it |
| 14 | The `Night?` column of the four-class table | L3 — the admitted-tool file already carries a horizon, and the door's is the enforced one |
| 15 | `keel/logbook/backlog.jsonl` | L4 — an improvement is an intent, said twice in COVERAGE (→ O46) |
| 16 | The venture-side write of a failed skill candidate | L4 — `CURATION.yml` exists, records every cut with its test, and is checked (→ O47) |
| 17 | *"Unread transcript count"* as a surfaced number | L4 — a progress bar for a backlog that clears once (→ O42) |
| 18 | The *Pareto prompt archive* as a distinct artifact | L4 — git history is the archive; two numbers on `scores.jsonl` are the frontier |
| 19 | The dependency on `skills-ref validate` | L4 — its licence is **UNKNOWN and was never fetched**, and its four checks are re-implementable from the spec text. Keep the checks |
| 20 | The duplicate cost formula (§16.3's copy) | L5 — two implementations of one check; §9.6 owns it, §16.3 keeps only its tenfold-divergence argument |
| 21 | Dollar ceilings **as ceilings**; every token budget inherited from a Sonnet-4.6-era measurement | L5 — an absent ceiling is visible and a wrong one is not **[F, = D9]** |
| 22 | The message priority tag, before it is built | L5 — a second ranking that will disagree with the Desk's |
| 23 | The menu-bar glyph | L6 — no substrate named, a new dependency if built, and a status living in two places is one that disagrees |
| 24 | Page 1's **second job** (the portfolio and the toggle, not the room) | L6 — §14.4's own guard rails forbid it (→ O12) |
| 25 | The blanket OUTSIDE on §17 for the **house** | L6 — v64 makes the harness the venture, and it deploys by editing the programs that dispatch and send |
| 26 | Five of the six occurrences of *"a second family whenever one is reachable"* | L7 — stated six times, enforced zero; keep it once in §11.3 where its honest state is written |
| 27 | §11.3's three-family panel row | L7 — it reads as capability and needs Gemini authenticated *and* Codex detached-capable *and* panel machinery **[F — see X6; the repo's three live judge claims are untouched either way]** |
| 28 | Codex `/goal`'s four sentences, down to one line in §10.6's gap list | L7 — `C`/medium confidence, two 308-redirected sources, unused by the plan, and a feature described at length reads as one relied upon |
| 29 | The renamed *model specialization map*; and *"on a cadence"* in the model-drift row | L7 — a renamed thing gets rebuilt, and a cadence is a schedule the SPINE forbids; the trigger is an event |
| 30 | `logbook/desk/<tick>.json` as a file per tick | L8 — the highest-volume artifact in the design holding an answer whose value decays in hours (→ O20) |
| 31 | The per-venture `open.md` store | L8 — ten queues, one founder, nine writer-contention points (→ O9) |
| 32 | The **reason** under COVERAGE §11's refusal, not the refusal | L8 — *"one founder, one Mac"* is falsified by §15.4's own restore drill; cite the lease instead (→ O16) |
| 33 | The name *venture health score* | L8 — it survives on two pages and invites the composite the plan refuses; keep the three raw numbers and add an ordering by the worst one |

---

## 8 · Lane ledger — nothing lost

*Every proposal a lane made, by its lane id, mapped to the merged id and its class. Table rows are grouped by the
merged proposal they folded into and their keywords are named, so each of the ~640 keywords remains traceable. Lane
`KEEP` and `REFUSE-STANDS` rows are verdicts on v2, not proposals, and are carried by the lane files.*

### L1 · drive (83 keywords · 39 KEEP · 23 IMPROVE · 5 RETHINK · 4 ADD · 12 REFUSE-STANDS)

| Lane id | Merged | Class |
|---|---|---|
| P1 work-item store; T: goal tree, sub-goal chain, sub-task decomposition, ticket generation, blocked state, mission dependency graph, cross-ticket linking, epic-to-ticket, duplicate detection, ticket template, ticket blocked reason | **O1** | ORCHESTRATOR FIX |
| P2 `/goal` condition is the anchor; T: done-test criteria, plan critique pass | **O21** | ORCHESTRATOR FIX |
| P3 attempt counter and the which at attempt N; T: relentless-retry, persistence policy, give-up condition, backlog grooming | **O1** (field) + **D10** | ORCHESTRATOR FIX + FOUNDER |
| P4 lexicographic dispatch order; T: priority queue, goal conflict resolver, ticket aging, ticket priority field | **D10** | FOUNDER DECISION |
| P5 forced disposition at expiry; T: abandonment criteria | **O23** | ORCHESTRATOR FIX |
| T retry ladder (failure-sameness hash) | **O19** | ORCHESTRATOR FIX |
| T escalation ladder (13a.1 vs §4.4) | **O49** | ORCHESTRATOR FIX |
| T stalled state (`budget-guard.js` registered nowhere) | **O50** | ORCHESTRATOR FIX |
| T goal window cap (standing share per window) | **D9** | FOUNDER DECISION |
| T wrong-goal detection (*Impossible* terminates the run, never the intent) | **O23** | ORCHESTRATOR FIX |
| T idle-time trigger (bounded by provenance) | **O51** | ORCHESTRATOR FIX |
| T assumption logging (a measured calibration number per agent) | **O80** | ORCHESTRATOR FIX |
| T clarifying question trigger (both-options bounded by a share of the ceiling) | **D11** | FOUNDER DECISION |
| T chain-of-thought log (retention) | **O34**/**O40** | ORCHESTRATOR FIX |
| T plan draft (sharpen the reason: `plan` is a shipped mode; the refusal is of *mandated method*) | **O5** note | ORCHESTRATOR FIX |
| Scale: interruption budget global at ten ventures; whiches unbounded at fifty; a year of stream logs | **D11**, **O40** | FOUNDER + FIX |
| "Best system lacks": replayable Desk · cost of delay on the intent · intent-level post-mortem | **O20**, **D10**, **O1** | FIX + FOUNDER |
| RQ1/RQ2/RQ3 | **R16**/**R17**/**R18** | RESEARCH FIRST |
| Deletes 1–5 | §7 rows 1–5 | FOUNDER (1–3) · FIX (4–5) |

### L2 · company (131 keywords · 83 KEEP · 25 IMPROVE · 4 RETHINK · 2 ADD · 17 REFUSE-STANDS)

| Lane id | Merged | Class |
|---|---|---|
| P1 onboarding pack; T: onboarding checklist per agent, agent onboarding doc | **D6** | FOUNDER DECISION |
| P2 `roster.yml` generated; T: agent registry, agent color tag, skill-to-role mapping, maxTurns cap | **O2** | ORCHESTRATOR FIX |
| P3 agents expire; T: worker retirement | **D7** | FOUNDER DECISION |
| P4 trust score gets consumers; T: trust score, capability revoke | **O26** | ORCHESTRATOR FIX |
| P5 charter schema; T: venture intake protocol | **O3** | ORCHESTRATOR FIX |
| T apprenticeship pattern (shadow admission) | **X5** | REFUSED (kept as D6) |
| T parallelism limit (the axis is subtask independence) | **O69** | ORCHESTRATOR FIX |
| T worker heartbeat (progress, not liveness) | **O15** | ORCHESTRATOR FIX |
| T worker cost cap per agent per window | **D9** | FOUNDER DECISION |
| T model-per-move policy (`writer`'s split); delete `analyst`'s Bash | **O57** | ORCHESTRATOR FIX |
| T mission-scoped pod (`bin/run --reform`) | **O15** | ORCHESTRATOR FIX |
| T single-operator model (the brief is unreviewed work) | **O22** | ORCHESTRATOR FIX |
| T wind-down protocol | **O63** | ORCHESTRATOR FIX |
| T IP ownership (input provenance on the Sender's checklist) | **O64** | ORCHESTRATOR FIX |
| T knowledge-transfer protocol (promotion needs a second venture) | deferred to L4 · **O43** | ORCHESTRATOR FIX |
| T conflict resolution (`objection:` for all 91 pairs) | **O7** | ORCHESTRATOR FIX |
| T UX research agent (inbound rows as the reception anchor) | **O60**/§F | ORCHESTRATOR FIX |
| T design system maintenance (tokens are architect-class) | **O5**/v7 | ORCHESTRATOR FIX |
| T accessibility review (a deterministic check) | **O58** | ORCHESTRATOR FIX |
| T bug triage (intake and the reproducing command) | **O60** | ORCHESTRATOR FIX |
| T A/B stopping rule as an intent field | **O24**-adjacent store check | ORCHESTRATOR FIX |
| T video generation agent (Higgsfield's uncapped credits) | **O32** | ORCHESTRATOR FIX |
| T brand voice enforcement (an empty taste store) | **O61** | ORCHESTRATOR FIX |
| T lead scraping (a privacy act, through the door) | **O33** | ORCHESTRATOR FIX |
| T escalation-to-human (a customer's clock vs the budget) | **O56** | ORCHESTRATOR FIX |
| T legal risk flagging (the clause verbatim) | **O59** | ORCHESTRATOR FIX |
| RQ1/RQ2/RQ3 | **R19**/**R20**/**R21** | RESEARCH FIRST |
| Deletes 1–4 | §7 rows 6–9 | FIX (6–8) · FOUNDER (9) |
| Claims c-roster-shell-count-drifted · c-charter-field-count-three-ways · c-agents-have-no-expiry · c-trust-score-has-no-consumer · c-analyst-band-contradiction | contradictions 1, 2, 4 · **D7** · **O26** | mixed |

### L3 · guard (97 keywords · 57 KEEP · 26 IMPROVE · 8 RETHINK · 1 ADD · 5 REFUSE-STANDS)

| Lane id | Merged | Class |
|---|---|---|
| P1 egress program; T: tool audit log, MCP policy file, credential read denial, prompt injection defense, fetched-content taint, spend rate limit | **D3** (+ **O32**, **O65**) | FOUNDER DECISION |
| P2 erasable data path; T: data deletion request, data retention schedule, data classification tags, consent management (the field's only ADD) | **D4** (+ **O34**) | FOUNDER DECISION |
| P3 narrow the shell; T: Bash tool, tool sandbox isolation | **R1**, then a fix | RESEARCH FIRST |
| P4 incident drills + hash-chained log; T: incident response plan, privilege escalation audit, audit-readiness, sandbox exec escalations | **O31** (+ **O78**) | ORCHESTRATOR FIX |
| P5 the cord stops a run; the phone's route; T: kill switch, remote kill access, human identity verification | **D2** + **D1** | FOUNDER DECISIONS |
| T pre-tool-use hook (`decision` object vs exit 2) | **O38** | ORCHESTRATOR FIX |
| T two-scope auth; macOS binary tools | **O35** | ORCHESTRATOR FIX |
| T tool denylist (delete the project tier) | **O37** | ORCHESTRATOR FIX |
| T multi-tenant / cross-venture isolation | **O27** | ORCHESTRATOR FIX |
| T service account management; secrets vault; API key rotation | **R3**, **O67**, `bin/secrets` | RESEARCH + FIX |
| T PII detection as a gate | **O66** | ORCHESTRATOR FIX |
| T agent identity token (identity per venture × channel) | **X1** | REFUSED (receipt kept) |
| T model usage licence (an expiry on §I row 1) | **X2** | REFUSED |
| T IP infringement check (outbound provenance) | **O64** | ORCHESTRATOR FIX |
| Scale: one Sender per venture · 50-writer fsync · second human's own seat · a year of inbound personal data · second Mac · rotation while away | **X3**, **O6**, v65 note, **D4**, **O16**, **O67** | mixed |
| RQ1/RQ2/RQ3 | **R1**/**R2**/**R3** | RESEARCH FIRST |
| Deletes 1–5 | §7 rows 10–14 | FIX, one FOUNDER (10) |

### L4 · knowledge (76 keywords · 35 KEEP · 29 IMPROVE · 4 RETHINK · 1 ADD · 7 REFUSE-STANDS)

| Lane id | Merged | Class |
|---|---|---|
| P1 exemplar/rehearsal leak; T: examples library, golden output archive | **O11** | ORCHESTRATOR FIX |
| P2 curator into wave one; T: skill ownership | **D5** | FOUNDER DECISION |
| P3 skill budget per agent; T: skill count, skill lookup cost | **D12** | FOUNDER DECISION |
| P4 skill activation logged and joined; T: skill retirement, skill test coverage | **O41** | ORCHESTRATOR FIX |
| P5 same-failure predicate (the lane's only ADD); T: sighting count trigger, pattern promotion | **O19** | ORCHESTRATOR FIX |
| T review lens (point §11 at the two linted files) | **O5**-adjacent | ORCHESTRATOR FIX |
| T curation manifest / cut list (venture vs house scope) | **O47** | ORCHESTRATOR FIX |
| T uncovered-field detection (`skill.miss`) | **O48** | ORCHESTRATOR FIX |
| T taste profile / brand voice / customer voice (a number, a seed, `empty` not synthesised) | **O62**, **O61** | ORCHESTRATOR FIX |
| T negative knowledge log (house vs venture scope) | **O43** | ORCHESTRATOR FIX |
| T already-built registry (derived, not curated) | **O1**-adjacent | ORCHESTRATOR FIX |
| T skill versioning (body hash voids admission) | **O47** | ORCHESTRATOR FIX |
| T knowledge freshness (the falsifier beats the date) | **D16** | FOUNDER DECISION |
| T tacit knowledge capture / unread transcript count (watermark) | **O42** | ORCHESTRATOR FIX |
| T memory budget checker extended; retrieval slice precision; memory dedup threshold; memory conflict owner+expiry; memory redaction one program | **O34**, **O45**, **O44**, **O17** | ORCHESTRATOR FIX |
| T correction learning (§13a.5's ten vs v45's eleven) | **O4** | ORCHESTRATOR FIX |
| T blocked improvement metric; feedback loop closure ratio; Pareto frontier on `scores.jsonl` | **O26**/**O75** | ORCHESTRATOR FIX |
| T improvement backlog (a filter, not a store) | **O46** | ORCHESTRATOR FIX |
| RQ1/RQ2/RQ3 | **R13**/**R14**/**R15** | RESEARCH FIRST |
| Deletes 1–5 | §7 rows 15–19 | ORCHESTRATOR FIX |

### L5 · truth and cost (91 keywords · 47 KEEP · 21 IMPROVE · 11 RETHINK · 12 REFUSE-STANDS)

| Lane id | Merged | Class |
|---|---|---|
| P1 anchor mutation cases; T: false-positive rate, false-negative rate | **D8** | FOUNDER DECISION |
| P2 hash the standing prefix; T: cache hit measurement, cache-hit cost rate, prompt caching strategy | **O39** (+ **R7**) | FIX + RESEARCH |
| P3 window-share budgets; T: budget in money, exploration spend, mission budget cap, rate-limit cost impact | **D9** | FOUNDER DECISION |
| P4 cost per rung movement; T: cost-vs-value, ROI per mission | **O75** | ORCHESTRATOR FIX |
| P5 brief binding by hash; T: orchestrator brief, communication audit trail | **O22** | ORCHESTRATOR FIX |
| T worker-to-worker request; peer help request | **D15** | FOUNDER DECISION |
| T file lease | **O72** | ORCHESTRATOR FIX |
| T dead-letter queue; silent failure detection | **O73**, **O15** | ORCHESTRATOR FIX |
| T handoff token limit; token budget per agent (`tokenizer:`) | **O77** | ORCHESTRATOR FIX |
| T skill discovery cost (namespace directories) | **D12** | FOUNDER DECISION |
| T context monitor / cost anomaly (one control chart) | **O74** | ORCHESTRATOR FIX |
| T cost per session / cost attribution (teams may be unjoinable) | **O70** | ORCHESTRATOR FIX |
| T context compression (does `-p` auto-compact) | **R9** | RESEARCH FIRST |
| T per-model cost table (`prices.yml` with expiry) | **O8** | ORCHESTRATOR FIX |
| T verdict-diff binding (sign it) | **O30** | ORCHESTRATOR FIX |
| T blind reviewer pool (route onto `-p` until probed) | **O28** (+ **W8**) | ORCHESTRATOR FIX |
| T regression detection (`effect:` on every anchor) | **O24** | ORCHESTRATOR FIX |
| T statistical quality method (one sample floor) | **O25** | ORCHESTRATOR FIX |
| T hallucination detection (block on `scout` only) | **O29** | ORCHESTRATOR FIX |
| T taste review panel (founder-minutes as the promotion trigger) | **D5** option C | FOUNDER DECISION |
| T council review — the note that `bin/run` dissolves the in-session constraint | §6 assumption 2 | CONTRARIAN |
| RQ1/RQ2/RQ3 | **R7**/**R8**/**R9** | RESEARCH FIRST |
| Deletes 1–5 | §7 rows 13, 20–22 | FIX, one FOUNDER (21) |

### L6 · surfaces and runtime (96 rows · 49 KEEP · 27 IMPROVE · 10 RETHINK · 4 ADD · 6 REFUSE-STANDS)

| Lane id | Merged | Class |
|---|---|---|
| P1 `keel/host/`; T: infra-as-code, environment parity, macOS permission grants | **O10** | ORCHESTRATOR FIX |
| P2 loopback + authenticate; T: surface authentication (lane-added ADD) | **D1** | FOUNDER DECISION |
| P3 wake reconciler; T: shutdown behavior, sleep/wake, sleep-prevention, battery-aware, runtime health | **O15** | ORCHESTRATOR FIX |
| P4 local tier carrier; T: loopback-only model, low-power tier, local model runner | **O13** (+ **R4**) | FIX + RESEARCH |
| P5 event schema + page manifest; T: API surface, actionable dashboard views | **O6**, **O12** | ORCHESTRATOR FIX |
| T inbox surface (one decide store) | **O9** | ORCHESTRATOR FIX |
| T office floor / venture toggle / portfolio dashboard / venture activity toggle | **O12** | ORCHESTRATOR FIX |
| T phone notifications (`bin/bell`) | **O18** | ORCHESTRATOR FIX |
| T voice output (`say` behind `bin/brief --speak`) | **O18**-adjacent | ORCHESTRATOR FIX |
| T Q&A surface (cite or refuse) | **O54** | ORCHESTRATOR FIX |
| T edit-arguments verb | **O53** | ORCHESTRATOR FIX |
| T webhook surface / the door's transport | **R6** | RESEARCH FIRST |
| T scheduler gap (`catch_up:`) | **O52** | ORCHESTRATOR FIX |
| T container isolation (`bin/worktree`) | **O14** | ORCHESTRATOR FIX |
| T active workflow count (census order) | **O70** | ORCHESTRATOR FIX |
| T cost-ascending tiers (cache-read share per agent) | **O39** | ORCHESTRATOR FIX |
| T staging environment; blue-green | **O78**, **O79** | ORCHESTRATOR FIX |
| T public changelog (generated from the ledger) | **O75**-adjacent | ORCHESTRATOR FIX |
| T support escalation path (no owner in wave one) | **D5** | FOUNDER DECISION |
| T brand guideline enforcement (a discrimination test) | **O62** | ORCHESTRATOR FIX |
| T cross-venture resource pool; per-venture budget isolation | **D9** | FOUNDER DECISION |
| T venture reactivation checklist; venture wind-down (lane-added) | **O63** | ORCHESTRATOR FIX |
| T Gemini quota as a count | **O8** | ORCHESTRATOR FIX |
| T multi-terminal (name the target terminal; settle `-w`/`--worktree`/`--tmux`) | **O12** + one command | ORCHESTRATOR FIX |
| T local-first privacy (`cloud: allow \| deny`) | **D14** | FOUNDER DECISION |
| T multi-host failover (narrow the refusal) | **O16** | ORCHESTRATOR FIX |
| RQ1/RQ2/RQ3 | **R4**/**R5**/**R6** | RESEARCH FIRST |
| Deletes 1–5 | §7 rows 23–25, **X4**, and the Slack caveat (a dispatch seam, never an inbox) | FIX + REFUSED |

### L7 · cross-model (38 keywords · 13 KEEP · 16 IMPROVE · 4 RETHINK · 2 ADD · 3 REFUSE-STANDS)

| Lane id | Merged | Class |
|---|---|---|
| P1 one routing table + routing rehearsal cases; T: model-per-task routing, model specialization map | **O5** (+ §6 assumption 3) | ORCHESTRATOR FIX |
| P2 four family/model provenance fields; T: cross-model review pass, multiple-model second opinion | **O7** (+ **R11**) | FIX + RESEARCH |
| P3 fallback chains, per-model trust, frozen calibration set, outage drill; T: model fallback chain, model-drift detection, vendor lock-in | **D13** | FOUNDER DECISION |
| P4 rethink fires on the world + `wins_if:`; T: periodic architecture rethink, alternative-architecture proposal, assumption-challenge prompt | **D16** | FOUNDER DECISION |
| P5 `stop:` per carrier; T: interrupt-hook handling | **D2** | FOUNDER DECISION |
| T Codex-reviews-Claude as a leased singleton (rung-4 stamp on starvation) | **D13**/**O5** | FOUNDER + FIX |
| T Gemini as a narrow judge for non-code checks | **O5** row | ORCHESTRATOR FIX |
| T sandbox mode per CLI (a provider axis on taint) | **O5**/**O65** | ORCHESTRATOR FIX |
| T subagent support per CLI (per-provider concurrency) | **O71** | ORCHESTRATOR FIX |
| T MCP sharing across CLIs (v43's matrix gains a provider axis) | **O5**/**O27** | ORCHESTRATOR FIX |
| T AGENTS.md shared config → refuse `/import` (ADD) | **O36** | ORCHESTRATOR FIX |
| T session-resume across tools (a run does not resume across providers) | **O6** attribute | ORCHESTRATOR FIX |
| T parallel CLI sessions (one concurrency budget, naming the binding limit) | **O71** | ORCHESTRATOR FIX |
| T sunset-candidate review extended to a **provider position** | **D7** note | FOUNDER DECISION |
| T fresh-eyes onboarding review (a cold read with §J hidden) | **D16**-adjacent | FOUNDER DECISION |
| Contrarian assumptions 1–3, plus the fourth | §6 | CONTRARIAN |
| RQ1/RQ2/RQ3 | **R11**/**R10**/**R12** | RESEARCH FIRST |
| Deletes 1–5 | §7 rows 26–29; delete 2 → **X6** | FIX + REFUSED |
| Claims c-l7-family-provenance-absent · c-l7-routing-has-three-homes · c-l7-rung2-unmeasured · c-l7-calibration-set-expires · c-l7-cloud-cancel-unknown | **O7** · **O5** · **R11** · **D13** · **D2** | mixed |

### L8 · scale (six scenarios, ~40 rows)

| Lane id | Merged | Class |
|---|---|---|
| P1 the last-founder-event predicate; T: reserve unused, which queue unbounded, no *since you were last here* | **D11** | FOUNDER DECISION |
| P2 rotate the log, derive rollups; T: page 3 joins the whole log, index partitioning | **O40** | ORCHESTRATOR FIX |
| P3 the Watch/Sender lease; T: two clones, the drill machine, idempotency keys | **O16** (+ **O7**) | ORCHESTRATOR FIX |
| P4 one writer means one *store*; the log's append discipline | **O68**, **O6** | ORCHESTRATOR FIX |
| P5 obligation ranking + `Decay` for standing intents; T: obligation tide, standing-intent decay, staged-output tide | **D10** | FOUNDER DECISION |
| Runner-up: `actor:` on every event and read-back confirmation; taste items carry an owner | **O7** | ORCHESTRATOR FIX |
| T ten `open.md` queues → one | **O9** | ORCHESTRATOR FIX |
| T portfolio health ordering (not a composite) | **O12** | ORCHESTRATOR FIX |
| T cross-venture read isolation probed | **O27** | ORCHESTRATOR FIX |
| T session ceiling; supervise refuses into a full table | **O71** | ORCHESTRATOR FIX |
| T page 2's substrate rewrites under it | **O70** | ORCHESTRATOR FIX |
| T the reserve in founder-minutes-to-first-token | **D9**/**D11** | FOUNDER DECISION |
| T `v:` on every log row, refusing an unknown version | **O6** | ORCHESTRATOR FIX |
| T `desk/<tick>.json` becomes log rows | **O20** | ORCHESTRATOR FIX |
| T the restore drill's number on the briefing | **O76** | ORCHESTRATOR FIX |
| T statutory wake-me exempt from the budget | **O55** | ORCHESTRATOR FIX |
| T a lapse record for everything that expired unactioned | **O23** | ORCHESTRATOR FIX |
| T the cord from a phone off the network | **D1**/**D2** | FOUNDER DECISION |
| "Best system lacks": backpressure as a named concept (rate, not level) · measure our own seat and publish it to ourselves · a budget for the surface itself | **D9**, **D10**, **O74** | FOUNDER + FIX |
| RQ1/RQ2/RQ3 | **R22**/**R23**/**R24** | RESEARCH FIRST |
| Deletes (4) | §7 rows 30–33 | ORCHESTRATOR FIX |

### L9 · world (30 numbered findings + 7 gaps)

| Lane id | Merged | Class |
|---|---|---|
| 1–6 models and cost | **W1–W6** | ORCHESTRATOR FIX |
| 7–12 grants, teams, cross-session messaging | **W7–W12** (11 → **D15**) | FIX + FOUNDER |
| 13–18 scheduling, `/goal`, hooks | **W13–W18** (13 → **R25**) | FIX + RESEARCH |
| 19–24 Codex | **W19–W24** (24 → **R26**) | FIX + RESEARCH |
| 25–29 Gemini CLI, Devin, Factory | **W25–W29** | ORCHESTRATOR FIX |
| 30(a)(b)(c) the measured-company question | **W30–W32** | ORCHESTRATOR FIX |
| Gap 1 no claim registered — the claim-append server is in no lane's tool set | build-time task, as in DECISIONS §16 | ORCHESTRATOR FIX |
| Gaps 2–4 `/schedule` 404 · the Codex June–August window · `docs.factory.ai/droids` 404 | **R25**, **R26**, **W29** | RESEARCH FIRST |
| Gaps 5–7 fetch fidelity · absence is not denial · nothing was measured | carried as confidence marks on W19–W24, W28 | — |

---

*Written by the framer engine for the rethink round. Every founder row v1–v5 and v54–v65 stands. Nothing here was
built, installed, run, spent, published, committed or pushed, and no file outside this one was edited.*
