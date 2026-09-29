# Panel 1 — Serial founder, lean-startup lens (opus, read-only)

**Evidence weighed first.** The harness says outright that "no venture work has ever run through this harness" (CLAUDE.md, Known and accepted). `.claude/memory/USER-INSIGHTS.md` is an empty template. `~/VibeCoding` has 26 directories and about 15 git repos. Their last commits spread from 2026-03 to 2026-09 (beeond 09-15, agentvibe 08-31, adamos 08-26, the rest older). All 46 S1.1 capabilities are `specified-unimplemented`. The binding constraint is not machinery. It is contact with customers and focus across the portfolio.

## 1. Keep from S1.1
- **CAP-03 Opportunity discovery happy path.** Name the beneficiary, the current alternative, a rival explanation, and the *cheapest discriminating observation*. Otherwise "park with a dated trigger" and record rejected ideas. This is lean-startup discipline, so keep it word for word as the Idea-stage template.
- **CAP-04 Customer research.** Keep "separate behaviour, stated interest and interpretation" and "retain original language". Drop the sampling-frame and consent-basis ceremony until real PII exists.
- **CAP-29 Experimentation.** Keep "predeclare question, sample, stop/analysis rules" and "retain failures and inconclusive results". Pre-declared kill criteria are the most valuable single idea in S1.1.
- **CAP-28 Analytics.** Keep "original denominators". It is the cure for vanity metrics.
- **CAP-02 Portfolio direction.** Keep "reserve existing service before exploratory allocation" and "record selected/deferred/stopped with reconsideration reasons".
- **CAP-36 Pause.** Keep "restart evidence and review date" and "carrying cost". This fits a founder with 15 half-live repos.
- **CAP-38 Pivot**, in lite form: preserve the old reasoning, and classify dependent work as kept, changed or abandoned.
- **DIRECTIVE's approval list** ("contact customers or strangers", "spend money", "publish publicly"). This is already implemented as the `outbound-approval` and `founder-approval` gates in `.claude/gates.yml`.
- **F2-07's "If changing one thing".** Admission depends on a useful end-to-end case, and the first release is one research-to-decision case. Keep the idea, but tighten the bar (see Add).
- **L13 Countermodel A (records + cases, no persistent agent personas).** This is the right shape: a venture is a case file, and agents are temporary workers on it.
- **Harness assets:** the `validate-a-market` and `price-a-product` playbooks, and the customer lens rule "block and request research when no customer language exists". Also claim kind `user-language, verified_by=source`, which is the anti-hallucination spine for discovery.

## 2. Cut or defer (each with the trigger that brings it back)
| Cut / defer | Trigger to restore |
|---|---|
| The B00–B11 staged build, "freeze full contracts" (B00), and the 9-component authority architecture | Never as designed. Build per trigger below |
| C04 consequence grants, restriction epochs, controlled egress identities | First payment taken → spend/refund authority; first employee → per-person scopes |
| C05 lineage, purpose restrictions, deletion propagation | First stored customer PII beyond name/email, or the first GDPR request |
| C08 recovery envelopes and witness durability | First paying customer → a tested restore of prod DB plus repo. Until then, git and provider backups |
| CAP-39 closure as a full reconciliation | First paying customer. Before that, closure is a 10-line archive checklist (cancel subscriptions, archive repo, write a post-mortem) |
| CAP-40/41 formation and succession | Incorporation needed (first invoice, or a fundraise) |
| CAP-42 grievance, CAP-22 privacy program | First paying customer |
| CAP-24/25/26 procurement, partnerships, hiring | First $1k MRR, or the founder spending more than 5 h/wk on one function |
| CAP-35 scaling | PMF signal: a flattening retention curve or ≥40% "very disappointed" (Sean Ellis) on ≥30 users |
| CAP-43 owner-competence apparatus ("delayed unfamiliar transfer cases") | Cut. Doing your own customer calls *is* owner competence |
| CAP-46 automated self-improvement | 4+ weeks of experiment logs across ≥2 ventures (something to learn from) |
| C09 operator surfaces as a product | Replace with one weekly markdown/artifact page and one daily approval inbox |
| 2-of-3 multi-family judging for discovery/strategy work | Keep it only for irreversible code. Pivot decisions are the founder's, not a panel's |

## 3. Add (what S1.1 missed)
1. **A hard cap on harness work.** The meta-system has eaten roughly two months with zero venture output. Rule: ≤20% of subscription capacity and founder hours go to the harness until one venture has 10 real customer conversations logged. Check it weekly.
2. **A venture-vs-project split.** *Venture* runs the lean loop: stage, riskiest assumption, experiment, kill line. *Project* (research, content, client and side work) gets only a goal, a next milestone, an hours budget and a due date. S1.1 forced everything through company-grade machinery.
3. **A 7-stage ladder, with capabilities switched on by stage:** Idea → Problem-validated → Solution-validated (someone paid or pre-committed) → MVP → Launched → Growing → Operating. Parallel exits at every stage: Paused and Killed. Legal, finance and support stay dormant until "Launched + first payment".
4. **An evidence ladder on every claim of demand:** *said* < *did* (signup, calendar booked, waitlist with referral) < *paid* (deposit, pre-order, LOI). Stage gates require *did* or *paid*, never *said*.
5. **Agents do discovery logistics; the founder does the conversation.** Agents handle ICP lists, finding communities, drafting outreach (founder approves batch templates, not each message), scheduling, prep sheets, transcription, and synthesis into USER-INSIGHTS per venture. The founder takes ≥5 calls/week per venture at Problem-validation stage. LLM "synthetic interviews" are banned as evidence (claim kind `user-language` must cite a real transcript).
6. **A Mom Test transcript scorer.** It flags compliments, hypotheticals ("would you…"), future promises and pitching, and reports the ratio of past-behaviour facts per call. Cheap, and it coaches the founder.
7. **Fake-door and pre-sale kits.** A landing page (existing playbook), a Stripe Payment Link, a waitlist and PostHog events, live in under 1 day. The Solution-validated gate is a number: for example, ≥3% visitor→deposit or ≥5 LOIs.
8. **A weekly portfolio allocator.** It ranks every venture and project on stage evidence velocity, distance to its kill line, and hours/tokens consumed. It proposes this week's ≤3 active items; everything else auto-parks with a review date. Default is at most 2 ventures in active discovery at once.
9. **A founder week template:**
   - Mon: a 30-min portfolio page (one row per item: stage, assumption at risk, running experiment, metric vs kill line, spend, next action).
   - Daily: a 15-min approval inbox (outbound batches, spend, publish).
   - Tue–Thu: customer calls plus build.
   - Fri: a 30-min persevere/pivot/kill review on experiments whose window closed.
   - Target: ≤5 h/wk founder overhead, the rest on calls and product.
10. **A graveyard ritual.** Triage the 26 directories once into active / parked-with-trigger / archived. Killed ideas are kept with a reason and a re-open trigger (CAP-03's "without infinite retries").

## 4. ADOPT / ADAPT / LEARN / BUILD
| Component | Mode | Tool / source | Note |
|---|---|---|---|
| Venture canvas | LEARN | Lean Canvas (Maurya), Strategyzer Test/Learning Cards | One YAML per venture (`venture.yml`: stage, canvas, riskiest assumption, experiments[], kill_line, hours_budget) |
| Product analytics, flags, surveys | ADOPT | PostHog (MIT core, free cloud tier) | One project per venture. Replaces most of CAP-28 |
| A/B and experiment stats | ADOPT | PostHog experiments; GrowthBook (MIT) if needed | Predeclared hypothesis goes in `venture.yml` |
| Web analytics (content projects) | ADOPT | Plausible CE or Umami (MIT) | Privacy-light, no cookie banner |
| Interview scheduling | ADOPT | Cal.com (AGPL, free tier) | |
| Transcription | ADOPT | whisper.cpp (MIT), run locally | No SaaS dependency, no PII leaving the machine |
| Contacts / outreach log | ADOPT | Twenty CRM (AGPL), or a CSV in the venture repo until >100 contacts | |
| Newsletter / waitlist | ADOPT | Listmonk (AGPL), or Resend (already in stack) | |
| Pre-sales | ADOPT | Stripe Payment Links | Money-in only. Refunds need approval |
| Landing pages | ADAPT | Existing `launch-landing-page` playbook + Vercel | Add a PostHog snippet and a fake-door variant |
| Discovery and validation workflow | ADAPT | Existing `validate-a-market` playbook + sourcer + framer | Add stage `talk` (founder calls) and exit `claim(kind=user-language)` from transcripts only. Add an `evidence-ladder` criterion |
| Mom Test scorer | BUILD (small) | Review lens entry in `review-lenses.yml` | Nothing open-source scores discovery transcripts. About one session to write |
| Portfolio allocator + weekly page | BUILD (small) | Script that reads every `venture.yml`/`project.yml` + git activity + PostHog API → one artifact page | No tool reads per-venture kill lines across repos. ≤2 jobs |
| Venture template | BUILD (tiny) | `/new-venture` command scaffolding repo, `venture.yml`, USER-INSIGHTS, PostHog project | Reuse the war-room launcher |
| Portfolio board | ADOPT | GitHub Projects (free) | One board across repos. No custom UI |
| Decision log per venture | ADAPT | DECISIONS.md pattern + claim ledger | Pivot/kill entries carry the predeclared criteria and the observed number |

## 5. Top 3 risks
1. **The founder builds the machine instead of the companies.** It has already happened: 815 KB of spec, harness phases 1–8b, zero ventures run. v2 can repeat it at a smaller scale. Mitigation: the harness cap (Add 1). The v2 integrated test *is* a live venture reaching Problem-validated with real transcripts, not a synthetic rehearsal.
2. **Synthetic validation.** Agents are fast at producing plausible personas, scraped "pain" quotes and market-size numbers, and they feel like evidence. Mitigation: claim-ledger rule (user-language needs a transcript or a sourced verbatim quote); stage gates require *did*/*paid*; the Mom Test scorer.
3. **Portfolio thrash and outbound blow-back.** Agents make starting free, so everything starts and nothing reaches customers. Automated outreach can get the founder's LinkedIn, Reddit or email domain banned (automation terms, spam reputation). Mitigation: ≤2 ventures in discovery; weekly auto-park; outbound in founder-approved batches with rate limits; a separate sending domain per venture.

## 6. Founder-only questions
1. Which ≤2 ventures are *active* for the next 90 days, and does everything else in `~/VibeCoding` get parked with a review date?
2. Will you personally take ≥5 customer calls/week per venture in discovery? If not, discovery must run through async channels (surveys, fake doors), and the plan changes.
3. Should harness work be capped (I suggest 20% of hours and subscription) until one venture has 10 logged conversations?
4. What is the default kill line: $ and hours per experiment, and weeks without *did*-level evidence before auto-park (I suggest 3)?
5. Which channels may agents send outbound on under your name, and do you approve per batch template or per message?
6. Does non-startup client or side work that earns money outrank ventures in the weekly allocator?
7. What is the 90-day success bar: first paying customer in one named venture, or validated/killed verdicts on N ideas?
