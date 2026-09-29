# 01 — Vision

## Who it serves
One owner (the founder), plus at most two helpers later, running **several ventures and projects at once** from one Mac on two personal subscriptions (Claude Code, Codex). Not a product for other teams.

| Kind | What it is | What the system runs for it |
|---|---|---|
| **Venture** | A startup attempt | The lean loop: stage, riskiest assumption, experiment, kill line, evidence ladder |
| **Project** | Research, content, client or side work | Goal, next milestone, hours budget, due date. No lean-loop machinery |

Each venture or project is one git repo with one `venture.yml` or `project.yml`. The harness (this repo) is shared by all of them.

## What the system does across a venture's life
| Stage | Agents do | Founder does | Exit evidence |
|---|---|---|---|
| Idea | Frame beneficiary, current alternative, rival explanation, cheapest test | Pick or park | Written test with a kill line |
| Problem-validated | ICP lists, outreach drafts, scheduling, prep sheets, transcripts, Mom-Test scoring, synthesis | Takes the calls; approves outreach batches | ≥10 real conversations; *did*-level evidence |
| Solution-validated | Fake-door page, Payment Link, waitlist, analytics | Approves publish and price | ≥3% visit→deposit or ≥5 LOIs (*paid*) |
| MVP → Launched | Spec, build, review by two model families, deploy | Approves merge of irreversible changes and launch | First payment |
| Growing / Operating | Content, SEO, CRO experiments, support drafts, books | Approves outbound, money, legal | Metric vs kill line, weekly |
| Paused / Killed (any stage) | Archive checklist, post-mortem, reopen trigger | Decides | Review date recorded |

Legal, finance and support stay **dormant until Launched + first payment**. Each switches on at a named trigger (04-KEEP-CUT).

## The founder's week (target ≤6 h system overhead, calls excluded)
| When | Time | What |
|---|---|---|
| Monday | 30 min | Portfolio page: one row per item — stage, assumption at risk, experiment, metric vs kill line, capacity used, harness-vs-venture split, next action. Pick ≤3 active items |
| Daily | ≤15 min | Inbox: ≤10 decisions, grouped by venture, each expiring to "refuse" |
| Tue–Thu | — | Customer calls (≥5/week per venture in discovery) and interactive building |
| Friday | 30 min | Persevere / pivot / kill on experiments whose window closed; 20 min labelling if the improvement loop is on |
| Urgent | rare | ntfy push only for: stop failure, security event, a decision whose deadline is today |

## "Compete with billion-dollar companies" — in numbers
These are targets for day 90 after the v2 build, measured by the runner (06-METRICS), not claims.

| Dimension | Big-company bar we match | Target |
|---|---|---|
| Speed to test an idea | A growth team runs a fake-door in a sprint | Idea → live fake door with analytics and payment link in **≤1 day** |
| Discovery throughput | A research team runs ~10 interviews per study | **≥10 logged conversations per venture in 2 weeks**, all transcribed, scored and synthesised |
| Engineering throughput | A small squad ships weekly | **≥5 merged, gate-passed changes per active venture per week** |
| Review quality | Two independent reviewers | Every irreversible change reviewed by **2 model families**; runner-verified done-tests; **0** false "done" on canaries |
| Operating load | A COO runs the portfolio | **2 ventures + 2 projects** run at **≤6 founder hours/week** of overhead |
| Discipline | Board-level kill criteria | **100%** of experiments carry a predeclared kill line; auto-park after 3 weeks without *did*-level evidence |
| Cost | Headcount | **$0 marginal model cost**: all model work on the two subscriptions; automation never exceeds **60%** of a usage window |

## What it is not
Not a department of persona agents. Not an autonomous company that spends, signs or speaks as the founder. Not a second spec. The first proof is one real venture reaching Problem-validated through this system.
