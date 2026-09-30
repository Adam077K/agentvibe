# R0-B — How great organisations delegated, coordinated and learned

*Round 0 outward research seat · 2026-09-30 · researched on the web before reading any repo document. Sources accessed 2026-09-30.
Figures are quoted from the source named; **[spec]** marks speculation.*

## 1. Mechanism table

| Organisation | Mechanism | Evidence it worked | Failure mode | Agent analogue | Source |
|---|---|---|---|---|---|
| Prussian army (Moltke) | **Auftragstaktik**: give the goal and the reason, not the method; subordinates act on intent when orders fail | Moltke's 1869 Instructions: commanders "do not order more than what is absolutely necessary but ensure the goal is clear"; used across 1870–71; US Army adopted mission orders in 1986 | Without shared doctrine, intent becomes licence; Bungay's knowledge, alignment and effects gaps persist | Briefs carry **intent, purpose, constraints, end-state**, never steps; deviation allowed if declared | [army.gov.au](https://researchcentre.army.gov.au/library/australian-army-journal-aaj/auftragstaktik-mission-command); [Bungay/PMI](https://www.pmi.org/-/media/pmi/microsites/disciplined-agile/bungay_artofaction_chapterrecaps_article.pdf) |
| Incident Command System | Modular org that grows with the incident; span of control 3–7 (5 optimal); unity of command; single set of incident objectives | Born of FIRESCOPE after 1970s California fires; now national standard (NIMS) | Katrina: in Louisiana "a true unified command was never established"; officials bypassed the structure | Team **expands and collapses with load**; ≤5 lanes per lead; one shared **action plan** | [AIHA](https://publications.aiha.org/202104-taking-command-emergency-response); [Moynihan/Katrina](https://www.businessofgovernment.org/sites/default/files/MoynihanKatrina.pdf) |
| Film production | Temporary crew of department heads assembled per film; 1st AD runs the day; **call sheet** each day; **dailies** reviewed every day | Industry-wide standard for coordinating 100+ strangers against a fixed date | Burnout when the date is fixed and the story is not | Daily **call sheet** per venture (who, where, on what); **dailies** = founder reviews raw output | [StudioBinder](https://www.studiobinder.com/blog/what-does-an-assistant-director-do/) |
| Toyota (TPS) | **Jidoka** (stop automatically on defect), **andon** (anyone stops the line), kaizen | NUMMI: GM's worst workforce became its best within a year once the human system was built | Copying the cord without the culture: GM plants had cords that were not pulled | Any agent may **pull andon**, halting its lane and downstream consumers; every stop is root-caused | [Wikipedia: Andon](https://en.wikipedia.org/wiki/Andon_(manufacturing)); [Psych Safety](https://psychsafety.com/psychological-safety-79-the-andon-cord/) |
| Bell Labs | Critical mass of disciplines; buildings designed so labs and offices forced corridor encounters; long horizon | Transistor, information theory and more (Gertner, *The Idea Factory*) | Depended on monopoly funding **[spec]** | **Collision engine**: route findings past agents of unrelated fields on purpose | [Gertner summary](https://sts10.github.io/2015/09/14/bell-labs-the-idea-factory.html) |
| Lockheed Skunk Works | Kelly Johnson's 14 rules: manager gets "practically complete control"; team kept small "in an almost vicious manner"; minimal reporting | U-2 and SR-71 built by small teams | Does not scale; depends on one exceptional leader | **Small-team cap**; mission lead with budget and full authority; one-page reporting | [Good Science Project](https://goodscienceproject.org/articles/managing-lockheeds-skunk-works/) |
| Apollo (Mueller) | **All-up testing** — test the whole stack as flown; configuration control boards | Saturn V flew crewed after few flights; Moon by 1969 | Apollo 1 fire (1967) under schedule pressure **[not re-sourced here]** | **Whole-system rehearsal** in a twin before acting; one configuration record of what is deployed | [heroicrelics](http://heroicrelics.org/info/all-up/reflections-mueller.html) |
| Amazon | Single-threaded leaders; six-page narrative read silently for ~30 minutes; Type 1 / Type 2 (one-way / two-way doors); decide at ~70% information; disagree and commit | Practices sustained across two decades of shareholder letters | Type 1 process creeping onto Type 2 decisions (Bezos's own warning) | Decisions tagged **door type**; only one-way doors reach the founder, as a memo | [2015 letter](https://s2.q4cdn.com/299287126/files/doc_financials/annual/2015-Letter-to-Shareholders.PDF); [2016 letter](https://www.aboutamazon.com/news/company-news/2016-letter-to-shareholders) |
| Bridgewater | Believability-weighted decisions; public "baseball cards"; everything recorded | Idea meritocracy claimed as source of returns (Dalio) | Copeland's *The Fund*: surveillance, shaming, high turnover within 18 months | **Believability ledger** per identity × domain, computed from outcomes | [Principles](https://www.principles.com/principles/88eaccff-925f-4571-aafe-b6668c007464/); [Westport Journal](https://westportjournal.com/community/book-scrutinizes-culture-of-radical-transparency-at-bridgewater/) |
| Renaissance (Medallion) | **One single model** everyone improves; shared fund, no competing bonuses | ~200 of ~400 staff on Medallion; single model since 1988 | Opaque; bottleneck on data access and secrecy | All agents improve **one shared world model** per venture | [Wikipedia](https://en.wikipedia.org/wiki/Renaissance_Technologies); [Acquired](https://www.acquired.fm/episodes/renaissance-technologies) |
| Linux kernel | MAINTAINERS file maps path → owner; patches flow up a trust tree of lieutenants to Linus | Largest collaborative codebase in history | "Maintainers don't scale" — bottleneck on individuals | **Ownership map**: every artefact path resolves to one owner role and one reviewer | [kernel.org](https://docs.kernel.org/maintainer/index.html); [ffwll](https://blog.ffwll.ch/2017/01/maintainers-dont-scale.html) |
| Apache | Lazy consensus (silence = assent after a window); a -1 on code is a veto **only with a technical justification** | Hundreds of projects governed this way | Stalled vetoes; slow on contested change | Agents proceed after a **silence window**; objections must carry evidence or they are void | [ASF voting](https://www.apache.org/foundation/voting.html) |
| Hospitals | WHO checklist; I-PASS structured handoff; M&M conferences | Checklist: complications 11%→7%, deaths 1.5%→0.8% (Haynes 2009); I-PASS: errors −23%, preventable adverse events −30% (NEJM 2014) | Ontario: no mortality drop; M&M drifts to blame — 7.6% of residents say issues "always" lead to change | **Handoff schema** at every agent boundary; **M&M** that must output a changed mechanism | [NEJM 2009](https://www.nejm.org/doi/full/10.1056/NEJMsa0810119); [NEJM 2014](https://www.nejm.org/doi/full/10.1056/NEJMsa1405556); [Ontario](https://www.nejm.org/doi/full/10.1056/NEJMsa1308261); [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4865106/) |
| Haier (RenDanHeYi) | ~4,000 micro-enterprises of ~10 people; pay from the user, not the boss; cut ~12,000 middle managers | Cited as the world's largest appliance maker's operating model | Units cannibalised each other, forcing a new coordination layer; hard to export abroad | Each venture is a **micro-enterprise with its own P&L and user**, plus an anti-cannibalism layer | [Corporate Rebels](https://www.corporate-rebels.com/blog/rendanheyi-forum); [LBS case](https://publishing.london.edu/cases/the-haier-cases-c/) |
| Valve | No managers; people pick projects ("desks on wheels") | Produced hit products | Ellsworth: "a hidden layer of powerful management"; cliques "like high school" | **Make authority explicit and inspectable**, even when fluid | [GeekWire](https://www.geekwire.com/2013/valves-company-structure-felt-lot-high-school-employee/) |
| Venture studios | Shared team spins up many companies | GSSN-associated: 72% reach Series A vs 42%; 25.2 vs 56 months — industry self-report, **directional only** | Attention spread thin **[spec]** | The system *is* a studio: shared services, per-venture teams, portfolio view | [Bundl](https://www.bundl.com/articles/why-venture-studio-startups-have-higher-long-term-success-rates) |
| Pixar Braintrust | Peers critique a film in progress; **no power to mandate** changes | Toy Story 2 story rebuilt with under a year to go | Crunch: Catmull reports ~30% of staff got repetitive stress injuries in the final nine months | **Critic agents** with advisory notes only; the owner logs why each was taken or declined | [Fast Company](https://www.fastcompany.com/3027135/inside-the-pixar-braintrust); [Wikipedia](https://en.wikipedia.org/wiki/Toy_Story_2) |

## 2. Cross-cutting laws of delegation under pressure

1. **Intent travels; instructions rot.** Moltke, ICS, Amazon memos: the *why* survives contact; method stays local.
2. **Authority must be legible.** Valve and Katrina failed alike — nobody could say who decides. ICS and MAINTAINERS work because the answer is looked up, not negotiated.
3. **Span is bounded by attention.** 3–7 (ICS), two pizzas, "vicious" smallness: the limit is how much state a leader holds.
4. **Anyone can stop; few can start the irreversible.** Andon and justified vetoes spread *stop*; Type 1 doors concentrate *go*.
5. **Critique needs separation from power.** Braintrust, Apache, M&M: candour dies when feedback carries rank.
6. **Structure at the seams beats heroics in the middle.** Checklists and I-PASS live at handoffs; film formalises the call sheet, not the craft.
7. **Learning counts only if it changes a mechanism.** M&M's 7.6% and Ontario's null result vs NUMMI, where the system changed.
8. **Autonomous units need a market rule.** Haier's cannibalism vs Renaissance's single model: shared goals must beat local incentives.
9. **Test the whole thing as it will run.** All-up testing; dailies. Component green ≠ system green.
10. **Transparency without dignity collapses** (Bridgewater) — for humans.

## 3. What dies when workers are tireless, parallel and near-free

| Human-org assumption | Why it existed | Status for agents |
|---|---|---|
| Span of control 3–7 | Supervisor attention | **Dies for workers** (an orchestrator tracks many lanes via structured state); **survives for the founder** — design for ≈5 open founder decisions |
| Pick one option, then execute | Execution is expensive | **Dies.** Build 3 variants in parallel; critique finished options, not drafts |
| Stable teams build trust over years | Trust accrues slowly | **Dies** — trust is a ledger read at launch; teams are minted and dissolved per mission |
| Measurement costs dignity | Humans resent surveillance | **Dies.** Record and score everything |
| Meetings synchronise knowledge | Brains can't share memory | **Mostly dies**; the silent read survives as a founder forcing function |
| Experience lives in people | Tacit knowledge | **Inverts**: lost when *not written*, not when someone quits |
| Checklists fight fatigue | Tired humans skip steps | **Shifts**: agents drift, claim false completion, forget across sessions — checklist becomes **evidence of done** |
| Hierarchy is needed to scale | O(n²) communication | **Survives**: n² still bites context windows and merge conflicts |
| Incentives align people | Self-interest | **Becomes objective functions** — bad metrics breed busywork like bad bonuses **[spec]** |
| Crunch is a choice | Burnout | **Moves**: founder attention and token budget are what crunch |

## 4. What we should use (16 mechanisms)

1. **Intent brief** (Moltke): intent · purpose · end-state · constraints · don'ts · authority to deviate. No step lists.
2. **Backbrief**: agent restates intent and plan before starting — mismatch caught at minute one, not hour six.
3. **Door-typed decisions** (Amazon): every decision carries door type, reversal cost, blast radius; only one-way doors reach the founder.
4. **Escalation memo**: one-way doors arrive as a ≤2-page memo — recommendation, options, evidence, dissent.
5. **Andon** (Toyota): any agent halts its lane and dependents; every pull yields a five-whys record.
6. **Action plan object** (ICS): one versioned objectives doc per mission; splits into branches past 5 lanes.
7. **Call sheet + dailies** (film): daily per venture; founder dailies are raw artefacts, not summaries.
8. **Ownership map** (MAINTAINERS): path/domain → owner role → reviewer, with expiring leases.
9. **Lazy consensus, justified veto** (Apache): proceed after a silence window; a block without evidence is void.
10. **Braintrust** (Pixar): critics without mandate; owner logs taken/declined/why per note.
11. **Believability ledger** (Bridgewater): identity × domain, from outcomes; weights votes and launch choice.
12. **One model per venture** (Renaissance): all agents improve one world model; credit = how far they move it.
13. **All-up rehearsal** (Apollo): whole mission run in the twin before any one-way door.
14. **I-PASS handoff**: severity · summary · actions · situation · receiver read-back.
15. **M&M with closure**: weekly; only valid output is a changed mechanism with owner and date.
16. **Micro-enterprise P&L** (Haier): per-venture budget, user, scoreboard, plus an anti-cannibalism rule.

## 5. Ideas no organisation could try with humans

- **Fork the commander.** Run three copies of a lead under different intents for an hour; keep the best trajectory.
- **Replay the org.** Re-run last week's mission with another team composition on recorded inputs — A/B testing organisation design itself.
- **Handoffs by construction.** Receiver loads the sender's full trace; read-back becomes a machine diff of sent vs understood.
- **Believability without cruelty.** Score every claim against outcomes at zero human cost.
- **Braintrust at production speed.** Critique every draft, not one screening every few months.
- **Adversarial twin org.** A standing red team playing competitor, regulator and angry customer against each plan.
- **Dissolve-and-distil teams.** A team lives one mission, leaving only lessons and believability updates — no fiefdoms, so Valve's cliques cannot form.
- **Hybrid specialists.** A regulatory-engineer-copywriter tested against a classic three-role split **[spec]**.
- **Intent drift detector.** Compare actions to the intent brief continuously; auto-pull andon past a threshold.
- **Time-shifted founder.** Decisions queue with a default and deadline; on silence, two-way doors execute the recommendation.

## 6. Where this hits the founder's direction

| Founder direction | Hit |
|---|---|
| **#2 Right altitude** | Door types + intent make altitude mechanical: founder owns intent and one-way doors; two-way doors are delegated. |
| **#3 Autonomy switch** | Haier: autonomy is a per-venture *contract* (budget, user, scoreboard, escalation list), not a toggle — autonomous ventures get stricter andon and M&M. |
| **#4 Acts as founder** | The AI co-founder seat = Braintrust member + single-threaded leader, itself scored on the believability ledger. |
| **#5 No playbooks** | Auftragstaktik *is* the anti-playbook — but evidence says keep **checklists at seams** (handoff, launch, one-way door) as protocols, not method. |
| **#6 Claude = Codex** | Believability per identity × model family picks who launches; Braintrust critics cross families deliberately. |
| **#7–9 Titles, hybrids, swarms** | Film crews and ICS prove temporary role-teams work; Valve proves swarms need inspectable authority. |
| **#10 Memory** | M&M's 7.6% is the graveyard warning: a lesson must name the mechanism it changed, or it is noise. |
| **Alignment / coordination / twin** | Intent drift detector; MAINTAINERS map + leases + lazy consensus + one action plan; all-up rehearsal and org replay as the twin's basis. |
| **Self-improvement** | NUMMI: change the system, not the cord. KPI = M&M closure rate. |

**Challenge (adding, not cutting):** Katrina, Valve, Bridgewater and the Toy Story 2 crunch all failed where authority or the bottleneck was invisible. v3 should add a **Founder Attention Budget** as a first-class resource beside tokens — measured, forecast and protected like money — because the founder is the one thing in this organisation that cannot be parallelised.
