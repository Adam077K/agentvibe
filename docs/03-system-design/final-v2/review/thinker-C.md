*Recorded verbatim by the orchestrator from the lane's return file (scratchpad/returns/thinker-C.md, 34,458 bytes). Sealed lane: reviewer engine on Fable, no review/, round-6/, returns/ or session files read. Findings, never fixes. Nothing in the plan changed by this record.*

# Thinker C · the strategist · Keel (THE PLAN v2) evaluated as a whole · 2026-09-06

Posture C. Read whole, in the brief's order: SPINE.md (997 lines), FINAL-PLAN-v2.md (9,968 lines), rethink/SYNTHESIS.md, research/world.md, DECISIONS.md §1–§22, then the harness (CLAUDE.md, AGENTS.md, orchestrator/builder/sourcer files, lenses.yml, ship-feature and validate-a-market playbooks, LONG-TERM.md, USER-INSIGHTS.md, MOAT.md, POSITIONING.md). Seal respected: no review/, no round-6/, no returns/, no session file. Findings first, severity-first; then what is right; then the big vision with the three decisions; then scope notes.

---

## Findings

### C1 · P1 · The build graph never reaches a stranger; the first venture is the system itself
**where:** §1.1 v64 — *"**The harness itself.** Intents are the build order; anchors are `npm run check` and the probe"*; §21.4 — *"*Worked* looks like: a venture reaches **rung 2** — a stranger did something"*.
**the problem:** The plan's own definition of *worked* requires a stranger. Its build order (§19.1) has one venture node and it is the harness; no node in the graph, and no exit criterion on `VENTURE` or `OVERNIGHT`, is a contact-rung movement. The vocabulary confirms the centre of gravity: in ~156,000 words, *founder* appears 853 times, *venture* 259, *customer* 24, *revenue* 5, *market* 7, *distribution* 3. `USER-INSIGHTS.md` is empty; `MOAT.md` and `POSITIONING.md` are unfilled templates; LONG-TERM.md records *"zero customer-facing work ever run through it"* and the session-file count has gone from 45 to 172 since.
**why it matters:** Three years from now this is the best-governed harness in the world and has never been measured against a market. The purpose paragraph (§0.1) is *"take a project … achieve it"*; every one of §21.1's six numbers is about the machine's own activity. A company optimising its own epistemics compounds provenance, not revenue.
**what would change:** A second venture, customer-facing, in the same wave as the harness, with a contact-rung-2 target as the exit of `OVERNIGHT`. The harness stays the venture whose anchors exist; the second is the venture whose *stranger* exists.
**how we would know:** The first briefing that carries a contact-rung movement (§11.9) for any venture. If wave two is written before one exists, C1 is confirmed.

### C2 · P1 · R12 is circular and cannot settle the assumption the whole architecture rests on
**where:** §11.2 — *"What fraction of a venture's real done-tests reach **rung 1 without inventing an anchor**? **Source class:** the harness venture's first thirty intents."*; §0.1a — *"the evidence for it comes from the harness — the most anchorable venture that could have been chosen"*.
**the problem:** The plan says in one paragraph that the harness is the most anchorable venture possible, and in the next that the harness's first thirty done-tests are the measurement of whether *company work* is anchorable. Measured there, R12 returns a high fraction whatever the truth for positioning, pricing, copy and design. It is *"the cheapest measurement named anywhere in the round"* because it is the least informative one. The row that says *"nothing should be built against the inverted architecture before it"* is gated on an experiment designed to pass.
**why it matters:** Contrarian assumption 1 decides the shape of the roster, the night, the trust score and the founder's role. A rigged measurement keeps the current architecture by default and the founder believes it was tested.
**what would change:** Run R12 on paper, now, at zero build cost: take the founder's own §23–§30 departments, draft thirty done-tests a real venture would need in its first month, and count how many name a deterministic anchor that is not invented. Then run it again on the second venture's real thirty.
**how we would know:** Two fractions, harness and venture, reported side by side. If they differ by more than the sample floor, the harness number was never evidence.

### C3 · P1 · The vendors are shipping the plan's mechanisms faster than the plan can be built, and the plan has no rule for not building
**where:** §13a.7 — *"nothing in the system reads the plan cold, so nine lanes had to be dispatched by hand, and the round found thirty-two facts that had moved under rows nobody had touched."*
**the problem:** In seventeen days of changelog (world.md, 2.1.238→2.1.263, Codex 0.150→0.153) the vendors shipped: cross-session messaging (W11), `/schedule` (W13), per-agent cache TTL (W6), a blocking model-switch hook (W17), read narrowing as a settings field (W8), four machine-readable cost fields including contracted pricing (W4), Codex interrupt hooks (W22) and a third control axis (W21), Gemini named subagents (W25), Devin automations with per-automation concurrency caps and cost attribution (W28). Against that velocity §L designs eighty mechanisms — a wake reconciler beside `claude agents --json --all`, a bell beside Remote Control push and task notifications (§14.13 already lists both as *ships*), a price file beside `modelPricing`, a session ceiling beside the vendor's concurrency cap, `catch_up:` beside a scheduler whose semantics returned 404. v81 detects a moved fact and opens a Decide item; nothing in the doctrine says *do not build what a vendor has announced*. The plan names *two implementations of one check disagree silently* as its recurring defect in five places and is about to commit it at the scale of the runtime.
**why it matters:** Every mechanism built where a vendor surface lands within a year is a second implementation to maintain, a second place to be wrong, and founder attention spent on a layer that will be free. The moat is not here (see the big vision).
**what would change:** Add `vendor_wins_if:` beside every §L row, mirroring `wins_if:`, and one doctrine line: a mechanism is built only where no vendor surface exists or is announced, or where it is one of the kernel four (direction, record, truth, taste). Sort §L by that line before §19 orders it.
**how we would know:** When the first `bin/` program lands, count the functions a vendor field or command now provides. If it is more than a third, C3 was the cheapest finding in this report.

### C4 · P1 · The founder's attention is the scarcest resource and the plan spends it before any venture does
**where:** §2.7 — *"The complete list. If the system needs more than this, the design has failed."*
**the problem:** That list has ten rows. The plan as written requires of the founder, before the first night: five founder-act nodes (managed file, Gemini auth, Codex install, teams flag, one licence fetch), the hook rewrite and `pmset` deferred to build time, a keychain token and a tunnel, twenty-six research questions of which at least eight need a founder act or an install (R1–R5, R7, R9, R10), thirty onboarding-pack artifacts for wave one (v71), fifteen mutation cases (v73), fifty-four `wins_if:` lines (written), sixteen-decision interview rounds, and every *which* the night stages. LONG-TERM.md records the founder's own suspicion that more checks drive tokens *"much, much higher"* while output is *"no better"* — and the rethink round answered with eighty more mechanisms. §21.1 measures founder-minutes per finished intent after the fact; nothing budgets the founder's hours for building the harness at all.
**why it matters:** By the plan's own doctrine a rule with no mechanism is a wish, and §2.7 is a wish. The founder is misled about what this costs them, and the cost is the one resource nothing in the system can buy back.
**what would change:** The harness venture's charter gets a ceiling in founder-hours per week, set by the founder, read by the Desk exactly like a token ceiling; harness intents stop starting when it is spent, ventures do not. And one founder act per week is the intake rate for founder-act nodes.
**how we would know:** Founder-minutes per week split harness / venture, on the briefing from the first week. If harness minutes are not falling by month two, the harness is the founder's job.

### C5 · P2 · A charter carries no outcome, so the company has no scoreboard except its own activity
**where:** §2.1 — *"weight:    1–5, the founder's priority, read by the Desk"*; §16.8 — *"cost per finished intent | must fall"*.
**the problem:** The charter has tempo, envelope, ceiling, weight, horizon, entity and cloud — and no outcome. Nothing in the system knows what a venture is *for* in a number the world sets (users, paying customers, a reply rate). The Desk ranks by obligation, unblocking, weight band and cost; the weekly lines reward finishing intents and moving rungs. §16.8 line 7 admits line 1 *"can be gamed by finishing small things"*. Wind-down (O63) has to choose continue · park · wind down at a horizon with nothing to compare against.
**why it matters:** A company without a scoreboard optimises throughput. Ten ventures at `driven` tempo with no outcome is a very expensive way to be busy.
**what would change:** `outcome:` on the charter — one contact-rung target by the horizon, in the founder's words, checkable by a record the company does not write (§11.9's ladder already supplies the anchors). The Desk reads it as the tie-break inside a weight band; O63 reads it at the horizon.
**how we would know:** The first horizon disposition that cites the outcome row rather than the founder's mood.

### C6 · P2 · A second model family is available today at zero cost and the plan treats it as blocked
**where:** §5.7 — *"there is no non-Anthropic model reachable from inside Claude Code"*; SYNTHESIS §6 — *"the standing *"no non-Anthropic model inside Claude Code"* reason is about the wrong boundary"*.
**the problem:** The cross-model architecture hinges on R10 (a Codex TTY bug open 130 days) while Gemini CLI is installed, one terminal act from authenticated, and carried as *"scout, once authenticated"* plus the summarising half of the curator. §11.3's rung-2 table gives it *"routine checking"*. The synthesis itself notes that `bin/run` is a no-model launcher outside any Claude session, which dissolves the *inside Claude Code* constraint. Meanwhile the metered-key question (row 17) is chained behind the Anthropic terms reading (row 1), though a Gemini or OpenAI API key for a *checker* is not the Anthropic clause at all. One legal footnote about one vendor's seat is holding the company's entire rung-2 capability hostage, and the plan's `reviewer` and `challenger` sit at rung 4 for it.
**why it matters:** Every review behind this plan is single-family; the plan says so and accepts it to 2026-11-17. It need not be accepted for a day.
**what would change:** Authenticate Gemini now (already decided) and route `reviewer` and `challenger` to it as the second family for every diff, not scout only. Decouple a checker-family API key from row 1: a few dollars a month, scoped to checking, on a vendor whose terms are not the open question.
**how we would know:** R11's twenty-five paired checks run within a month of the key existing. O7's four provenance fields are the prerequisite and are free today.

### C7 · P2 · The capacity model is a business decision carried as a legal footnote
**where:** §16.2a — *"A ceiling is stated in **window share: tokens against an observed high-water mark**, because **no denominator is published**"*.
**the problem:** The company's throughput ceiling is unknowable by construction: one Max seat, two windows, shared with the founder's chat and Cowork, no published quota, teams at 7x, builders on Fable. The plan never estimates finished intents per window for the roster it designs, and defers the only alternative (metered or gateway) behind a terms reading that four fetches could not obtain (row 17: *"unanswerable before it"*). Ten ventures, two driven, on a seat whose capacity is measurable *"only from an account"* is a company whose size is decided by a rate limit nobody has read.
**why it matters:** Whether Keel can run more than one venture is an economic fact, not a legal one, and it decides the roster, the night and the reserve.
**what would change:** Treat the capacity model as its own decision, answerable now on economics: seat for the Floor and the Operator; metered or gateway for the night and the checkers, priced from R7 and the first overnight. Row 1 then governs only what the *seat* may do unattended.
**how we would know:** After the first measured week, finished intents per window on the briefing, and the dollar shadow price beside it. If the seat's high-water mark is reached before two driven ventures are busy, the capacity model is the plan's real ceiling.

### C8 · P2 · Only taste crosses ventures; what the market taught venture A never reaches venture B
**where:** §13.2 — *"`FACTS`, `NEGATIVES`, `ALREADY-BUILT` and `OPEN` are per venture and do not cross without a promotion."*
**the problem:** TASTE and CRAFT are cross-venture, and O43 makes tooling dead ends house scope. But the compounding asset of a multi-venture company is what happened *in the world*: a price that converted, a channel that replied, a positioning a stranger understood. Those are per-venture FACTS with contact rungs, and their only path across is a founder-reviewed promotion. The word *playbook* is refused (§0.7) on mission-command grounds, which is right for method inside a stage and wrong for the record of outcomes. Rehearsal cases are mined from the founder's 3,116 transcripts — taste, not market.
**why it matters:** Ten ventures that each learn pricing from scratch is ten times the cost of one that learned it once. The plan's own §13.6 calls negatives *"the highest-value store"* and then scopes them to the venture.
**what would change:** A house-scope market record — one row per contact-rung movement with the intent, the venture, the channel and the record that proved it, written by `bin/reconcile` (a program, so the rung is rung 1) — readable by every venture's Desk and slice.
**how we would know:** The second venture's first thirty intents cite the first venture's ship-log rows, or they do not.

### C9 · P2 · The night is built first and the vendor's own measurement says the unit of work is forty-five minutes
**where:** §3.3 — *"**Forty-five minutes is the outer measured unattended stretch, and this mode is designed for a night.**"*
**the problem:** The plan reads W31 and W14 as costs of the mode and answers with more mechanism: O15 orphan reconciler, O16 lease, O52 catch-up, `pmset`, the cloud lane, the power assertions. Meanwhile the only measurement that says whether a night pays — §20.2 row 12, *"one week overnight against one week bounded on the same venture"* — is the last node in the graph. Roughly a third of §L exists to survive a regime the vendor's own data puts at the 99.9th percentile of anyone's practice.
**why it matters:** If bounded beats overnight, that third of §L is sunk before the comparison runs, and the founder's hours with it (C4).
**what would change:** Invert the order: build the bounded-day company first — Floor, Desk, launcher, Sender, reconciliation, one venture — run row 12's comparison as the first measurement, and put the night machinery behind its result.
**how we would know:** Row 12's own number: rung movement per window spent, overnight against bounded.

### C10 · P2 · Growth is bounded by the founder's tap rate, and the plan does not say so
**where:** §5.3 growth — *"**It never sends.** First contact with a stranger is on the default `never` list"*.
**the problem:** The trifecta split is correct and every outward act to a person routes through the Sender after a founder tap or a widened class. The plan designs widening for *tools* (drill the undo, then night) and nothing equivalent for *outward classes* as a growth ladder: reply-to-existing-thread, follow-up-to-a-consented-contact, publish-to-a-preview. So contact rung 1 and 2 — the plan's own definition of *worked* — arrive at the founder's tap rate, which contradicts §0's promise that the founder is not the bottleneck.
**why it matters:** A company whose every first contact is a founder tap grows at the founder's speed, which is the thing the company exists to escape.
**what would change:** A widening ladder per outward class with a measured undo and a recall count — after N recall-free sends inside a class the class widens by one step, and a recall narrows it — decided per venture in the charter like the envelope.
**how we would know:** Sends per week that needed no tap, and recalls per hundred sends, on the briefing.

### C11 · P2 · There is no null hypothesis: Keel is never compared against the vanilla runtime
**where:** §20.2 row 12 — *"one week overnight against one week bounded on the same venture"*.
**the problem:** The only comparison in the plan is between two modes of Keel. Nothing compares Keel to a single Claude Code session with a good CLAUDE.md, `/goal`, agent teams, `/schedule` and Routines — which, by the plan's own W-list, now supplies teams, messaging, scheduling, goals, cost fields and read narrowing. The plan's own doctrine (*every rule names its mechanism*) has no falsifier for the rule *build Keel*.
**why it matters:** If the vanilla runtime achieves most of the founder's purpose paragraph for none of the build, the founder should know before wave one, not after.
**what would change:** One venture-week on vanilla, one on Keel's kernel, same done-tests, judged by rung movement and founder-minutes. It is row 12's shape with a different pair.
**how we would know:** The two numbers, side by side, before `bin/run` exists.

### C12 · P2 · Every carrier is one vendor's experimental surface, and only that vendor's argv is designed
**where:** §17.7 — *"**Claude Code** (subscription) | every agent of 17.1; **the Floor, always**; the Operator"*.
**the problem:** v78 gives every agent a model fallback; nothing gives the company a runtime fallback. Fifteen agents, the Floor, page 2, cross-session messaging, `/goal`, the cache economics and the Operator itself are Claude Code — and page 2 stands on agent teams, *"repaired four times in the window and never promoted out of experimental"*. `bin/run` composing argv for three providers is the right shape, and only `<agent>.claude-code.argv` is specified; Codex is absent and Gemini unauthenticated. A terms change, a seat change, or a teams regression stops the company.
**why it matters:** Platform risk is the one risk the plan's rethink lanes did not have a lane for.
**what would change:** Specify and exercise one wave-one agent's Gemini argv (scout is already decided) so the launcher is a real two-provider launcher before the roster grows; run v78's outage drill with the *Claude carrier* denied, not only the model.
**how we would know:** Does anything finish that night.

### C13 · P2 · Identity and autonomy share one machine, and the machine that would separate them is bought last
**where:** §15.1 — *"The box is bought after the first measured overnight, not before."*
**the problem:** The founder's signed-in Chrome, the OAuth grants for mail and calendar, the keychain and the ventures' credentials sit on the Mac that runs unattended agents holding Bash. The plan calls the sandbox *"a guardrail against accident, not containment"* and is right; the trifecta is structural and good. But the always-on box (§15.1) is the one purchase that separates the founder's identity from the company's autonomy, and it is deferred behind the first overnight.
**why it matters:** One prompt injection on the founder's machine is a loss of the founder's identity, not only of a venture's.
**what would change:** Buy the box first; the founder's Mac stays the Floor and the client. The Watch, the Sender, the log and the night move there on day one.
**how we would know:** The probe attempts a keychain read from a night run on the box and fails.

### C14 · P2 · FOUNDER ROW (v71) · The onboarding pack deadlocks its own bootstrap
**where:** §17.1 pack table — *"Exemplar of its own good output | … | the curator, from a real handover, **with provenance** | it carries no provenance, or was written rather than harvested"*.
**the problem:** An agent is not routable without a pack; the pack's rehearsal case and exemplar are written by the curator; the curator is a wave-one agent that needs its own pack before it is routable; the exemplar must come *"from a real handover"* and fails if *"written rather than harvested"*, but no handover exists before the first run, which cannot happen before the pack. The founder's decision is sound; the mechanism as specified cannot start.
**why it matters:** The first day of the build stalls on a rule that refuses the only thing that could satisfy it.
**what would change:** A `seed:` state for wave-one packs — rehearsal case and demonstration required, exemplar harvested after the first N anchored handovers, with the seed marked as such on the roster.
**how we would know:** Attempt to write the curator's pack on day one under the rule as written.

### C15 · P2 · FOUNDER ROW (v1, v31) · The roster's cost compounds per provider and per mechanism, not per file
**where:** v71 — *"three artifacts per agent — **thirty for a ten-agent wave one**"*; §17.8 — *"shared/argv/<agent>.<provider>.argv"*.
**the problem:** Fourteen was decided as one file per agent. Since then each agent carries: an argv file per provider (up to 45), a pack of three, a `valid_until` disposition, a three-deep fallback, a routing row, a `cacheTtl`, a calibration number, a trust score per move class, and a mutation case per anchor. The marginal agent is now a dozen artifacts across three providers, and the founder's evidence for the band is *"unoccupied"* (§5.6). The world's running rosters are 5–6, and in 2027 the vendors' own subagent primitives make a *name* a one-line frontmatter — the name is cheap, the company around it is not.
**why it matters:** The cost of fourteen was stated once as a band nobody publishes evidence for; the cost is now multiplied by the rethink round and not restated.
**what would move it:** The plan's own falsifier is right — routing counts per agent per month. Add the per-agent artifact count beside it so the founder sees what each name costs to keep. R20 if it ever returns.

### C16 · P3 · FOUNDER ROW (v3) · The skills import is already mostly refused by the plan's own content rule
**where:** §7.7 — *"**The distribution is the finding, not the total:** the largest class is the one the content rule refuses"*.
**the problem:** 73 of 134 skills on disk are PROCEDURE and cannot enter as written; the 2,111 upstream are written to a spec that recommends procedure; the vendor now bundles skills with the runtime (W16). The founder's instruction *"take all the skills that the biggest systems use"* survives as a container standard, an eval loop and a budget, with most of the corpus rewritten or refused. That is the right outcome and the founder should hear it plainly: the library's value in 2027 is the company's own anchors, exemplars and negatives, not an import.
**what would move it:** The first admission cycle's ratio of admitted to refused among the 134, and R8/R15.

### C17 · P3 · FOUNDER ROW (v4) · Five of seven pages are commodity within a year; page 4 is the one that is ours
**where:** §14.7 — *"**nothing found gives a card a *team*.**"*
**the problem:** The office is pixel-agents; page 2 is the vendor's agent view; page 3 is `/cost` and `/usage` fields; page 6 is a renderer with no extractor; page 7 is a Langflow idiom. Page 4 — a card that launches a team against an intent with a done-test — is the single surface with no prior art, and it is the only one that touches a venture's actual work. The plan builds seven and puts the moat fourth.
**what would move it:** The plan's own `wins_if:` #4 (a quarter of visits that end in reading). Build page 4 first and buy the rest.

### C18 · P3 · The plan is its own bottleneck: nothing reads 156,000 words cold, including its agents
**where:** §0.3 — *"Four things in that diagram are the design."*
**the problem:** §0.3 states the four invariants in four sentences; the rest is 625 ABSENT marks, 82 rows, 80 mechanisms, 26 questions and 72 losing images. The plan concedes that no agent reads it cold. A plan that binds is one an Operator can carry as standing context; this one is a research record.
**what would change:** Split: a short constitution — the four invariants, the doctrine, the envelope, the open rows — that is the Operator's pre-flight read and is byte-identical for the cache; and the record, which is what this document already is.
**how we would know:** A fresh agent given the constitution alone writes a brief that passes the store check.

### C19 · P3 · FOUNDER ROW (v56, v79) · The cloud lane is designed against a tail measured at zero
**where:** v79 — *"The Mac was never off long enough for a cloud lane to have bought anything back this week."*
**the problem:** Two rows, a carrier, a charter field, a §10.2a of research and a `CLOUD` node stand behind a lane whose measured value is zero over 156 hours, whose driver is an issue-only claim, and whose cancel path is unknown. The measurement is honest and the plan keeps the lane open on the founder's word, which is the founder's right. The strategic reading of R5 is the reverse of a cloud lane: the Mac is never off because the founder is always on it, which is C4 again.
**what would move it:** A longer `pmset` span with whole days off, or a documented cloud driver with cancel (the plan's own `wins_if:` #68).

### C20 · P3 · The founder's hour has no price, so a *which* cannot be traded against autonomous work
**where:** §21.1 — *"**founder-minutes per finished intent**, falling."*
**the problem:** The reserve is 30%, the interruption budget is three a day, both options are built before a which is asked — every one of those rules spends founder attention without a price for it. The Desk cannot ask *is this which worth more than the two builds it cost* because nothing says what an hour of the founder is worth against a window.
**what would change:** One charter number, the founder's hour in window share, read by v76's away predicate and by the Desk when it decides to stage a which rather than pick the default.
**how we would know:** Whiches staged per week and whiches answered per week; if the second falls while the first rises, the price was too low.

---

## What is right

- **Every rule names its mechanism or is marked, and ABSENT is not WISH (v50).** Most plans never separate designed-unbuilt from wished; this one lints the difference.
- **The anchor ladder's sharpest rule** — *a check that reads a record the company does not write outranks one that reads its own* — is the single idea that makes an autonomous company measurable rather than self-reporting, and the contact rungs (§11.9) carry it outside the machine.
- **Staged-not-sent with a no-model Sender, and the trifecta as a table (§5.2), not a policy.** It is the only shape that survives an agent being fully persuaded, and the plan knows why.
- **Losing images with `wins_if:` (v81).** Decisions that can be wrong out loud; seventy-two of them, each with the observation that would revive it.
- **The world lane.** Thirty-two vendor facts re-fetched against the plan in one round and applied in place, with confidence marks and *absence is not denial*. Most plans never re-read the vendor; this one moved.

---

## The big vision

**What this system is for in three years.** Not a harness. A company kernel that runs on whatever runtime is current, with four things that are Keel's and nothing else: **direction** (charters with an outcome, intents with a done-test), **the record** (a hash-chained, provenance-carrying, append-only log of what the company did and what the world said back, across every venture), **truth** (anchors, mutation cases, reconciliation against records the company does not write, contact rungs), and **taste** (the founder's, derived from decisions, scored on a held-out slice). Everything else in the plan — launcher, watch, reconciler, bell, pages, messaging, scheduling, cost fields — is an adapter to a vendor surface that will exist within a year, and should be written as one. The vendors are converging on the company-OS layer from below; Keel's durable layer is above it.

**What it says versus what it optimises for.** It says *take a project, achieve it, walk with agents relentlessly until the perfect result*. It optimises for the self-consistency and provenance of its own design: contradictions closed, counts generated, rows sourced, marks linted. That is an epistemic engine of real quality, and it has been pointed at exactly one subject, itself, for a hundred and seventy-two sessions. The plan knows this (v64's cost, LONG-TERM's standing recommendation) and defers it again.

**What is entirely missing.** A customer. A stranger in the build graph. Money in — revenue appears five times, as a thing to reconcile, never as a thing to earn. A venture scoreboard. Distribution, or any growth ladder that is not the founder's tap. Cross-venture market learning. A budget for the founder's own hours. A price for the founder's hour. A null hypothesis against the vanilla runtime. A stop condition for building the harness. Platform risk as a lane. And a runtime other than one vendor's experimental features.

**What would make it the best system in each of the founder's fields.**
- *Engineering:* it nearly is. Blind tester, argv grants, mutation-rated anchors, the checker with no pen. Add the second family today via Gemini and the routing rehearsal cases (SYNTHESIS assumption 3), and the rest is build.
- *Product and design:* a taste store fed by strangers' reactions, not only by the founder's past transcripts; the perception loop already exists; give it a stranger to look at the render.
- *Marketing, sales and growth:* the anchors are exactly right — a reply from a real person, recorded by a program. What is missing is the widening ladder that lets the company reach rung 2 without a founder tap per contact, and the cross-venture market record so the second venture starts where the first ended.
- *Finance, legal, operations:* steward's *"discharged only by a record the company does not write"* and instruments-before-hands are the best two sentences in the plan; the consent register and the erasable path make a venture with customers legal by file layout. Build those first, they are cheap and they are the kernel.
- *Knowledge:* the negatives store is the moat, and the plan says so. Make it house scope for market facts as well as tooling facts, and it compounds across ventures.

**What would make it merely adequate.** Build the eighty mechanisms in §19's order. The founder governs an exquisitely instrumented harness that runs one venture, itself, at a founder-hours cost the plan does not count, while the vendors ship the bottom half of it for free.

**The moat, in one sentence.** A year of records — anchored, hash-chained, cross-venture, with the world's own replies attached — plus a taste store scored against held-out decisions and a negatives store that makes every next venture cheaper. No vendor ships that and no competitor can copy it, because it is made of what happened.

**The three decisions that matter most and are not on the open list.**
1. **Who the first stranger is.** Name the first customer-facing venture and its rung-2 target, in the same wave as the harness. v64 chose the harness as the venture whose anchors exist; the company still needs the venture whose stranger exists. Nothing in §I asks this.
2. **The commodity line.** A standing rule for what Keel refuses to build because a vendor has shipped or announced it — `vendor_wins_if:` on every §L row, a kernel-of-four test, and §19 re-ordered by it. v81 notices the world moving; this decides what to do when it does.
3. **The capacity model, as economics.** Seat for the Floor, metered or gateway for the checkers and the night — decided from R7 and the first overnight, not from the Anthropic terms reading. Row 17 exists and is chained behind row 1; the chain is the mistake. Whether this company can run two driven ventures is a number, and the plan has arranged never to learn it.

---

## Scope notes

**Read, whole:** `docs/03-system-design/final-v2/SPINE.md` (all 997 lines); `FINAL-PLAN-v2.md` (all 9,968 lines, §0–§23, in order); `rethink/SYNTHESIS.md` (all 893 lines); `research/world.md`; `DECISIONS.md` §1–§22; `CLAUDE.md` (as loaded); `AGENTS.md`; `.claude/agents/orchestrator.md`, `builder.md`, `sourcer.md`; `.claude/lenses.yml`; `.claude/playbooks/ship-feature.yml` and `validate-a-market.yml`; `.claude/memory/LONG-TERM.md` and `USER-INSIGHTS.md`; `docs/02-competitive/MOAT.md` and `POSITIONING.md`.
**Not read, per the seal:** `final-v2/review/`, `round-6/`, the scratchpad `returns/` directory, any session file. No producer's or reviewer's account of this work reached me.
**Measured on this Mac, 2026-09-06:** `claude` 2.1.263 (the plan's 2.1.261/2.1.263 both stale-or-current by the hour, as it says); `codex` ABSENT; `gemini` present; `tmux` present; 18 agent files, 7 with a `tools:` line; `.mcp.json` declares `playwright` and `claim-append`; 172 session files (the plan counts 171); 68 verdict records; `~/.agentvibe/events.jsonl` 3,843 lines (matches); 62 project directories and 3,116 transcripts (the plan says 60 and 3,060 — the corpus grew); no `keel/` directory (matches ABSENT); first commit 2026-08-11, 954 commits. Word counts over the plan: 155,990 words; ABSENT 625, EXISTS 175, WISH 41, UNVERIFIED 65, UNKNOWN 51; founder 853, venture 259, customer 24, revenue 5, market 7, distribution 3.
**Could not settle from here:** anything the R-list gates (terms, quotas, keychain ACLs, `/schedule`, #19945), whether the changelog features behave as stated, and any figure about the market for any venture, because no venture has one.
**Single model family, single agent.** This report is one Anthropic model (Claude, Fable 5.1) in one sealed context. It is not an independent panel; the other two lanes are the same family. Read every finding as rung 4 by the plan's own ladder.
