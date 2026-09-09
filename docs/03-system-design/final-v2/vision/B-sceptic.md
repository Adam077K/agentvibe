# B · The sceptic

*Lane B of three. Written 2026-09-09 by someone told to assume none of this is a good idea until it
survives being attacked. I had web access and a shell, which the other two lanes did not, so I spent
that: everything I say about the outside world is marked **CHECKED** with a source and a date, or
**UNCHECKED**. I did not read `SPINE.md`, `FINAL-PLAN-v2.md` or `COVERAGE.md`. I did not open
`A-ambition.md`; a grep for an unrelated phrase returned one line of it, which was a quotation of a
sentence I already had from `CLAUDE.md`, and I went no further.*

---

## The one-line version

**The strongest thing against the vision.** Trust is meant to be earned by being right repeatedly. That
is the wrong instrument for this job, and the mistake is not small — it is inverted. Being right a
thousand times tells you almost nothing about the thousand-and-first act, because the acts that can hurt
you are not drawn from the same bag as the acts you were graded on. A system that has been correct all
year has its widest freedom on the day it meets its first genuinely new situation. The vision's own
safety mechanism is the thing that maximises the loss.

**The strongest thing that survives.** Underneath the ambition to have an organisation is a smaller,
harder, more valuable thing that nobody sells: **a truthful account of work you did not watch.** Not the
work — the account. Something that will say "I did this, I did not check that, this number is three weeks
old, and here is the one thing I could not tell whether it worked." Everything else in this vision is
being built by well-funded companies. That is not, because it does not demo, and because a vendor whose
business depends on their agent looking competent has an interest in the answer. The owner does not. That
asymmetry is real, it is durable, and it is worth years.

---

## 1 · The problem, with the founder's framing removed

Strip out "company that runs itself", "organisation", "roles", "workers". What is left is this:

> A person can decide more things per week than they can execute. The gap between what they could
> commission and what they can personally finish is where their ambition dies. They want to close that
> gap without acquiring the two things that normally close it — employees, or a much smaller ambition.

That is a real and ordinary problem. It is also the oldest problem in commerce, and every generation has
sold a solution to it. The concrete difficulty is not "can a machine do the work". It is three things:

1. **Delegation has always been cheap; supervision has always been expensive.** Every arrangement that
   lets you commission work you don't do — staff, agencies, contractors, software — costs you attention
   at the review boundary. The cost of a delegate is not what you pay them; it is what it costs you to
   know whether they were any good. Nothing in the last two years has made supervision cheaper. It has
   made production wildly cheaper, which makes supervision the binding constraint by arithmetic alone.
2. **A business is a chain, not a task.** Getting one thing right does not compound into getting a
   quarter right. Errors do not just fail; they get written down, cited, and become the basis of the next
   decision. A business that runs unattended for a month is not one long task — it is several thousand
   short ones where the output of each becomes the input of another, and where a plausible wrong answer
   is not caught by trying again.
3. **The owner remains liable for all of it, and cannot delegate that.** Not morally — legally,
   financially, reputationally. Output can be delegated. Consequence cannot. That is the asymmetry the
   whole ambition sits on, and it does not improve as the machine improves.

Everything else in this document is a consequence of those three.

---

## 2 · The alternatives, and where each actually stops

### 2.1 Hire people

**Where it stops:** cash, commitment, and the management tax. Fixed monthly cost before revenue, a
notice period, employment law, and the founder's time spent managing rather than deciding. For a
pre-revenue or low-revenue owner this is genuinely unavailable, not merely unattractive.

**Why the vision beats it:** it does, on cost and on reversibility. A person you no longer need is a
difficult conversation and a legal process. A capability you no longer need is a deleted file.

**Where the vision does not beat it, and this is underrated:** a person absorbs ambiguity, takes
responsibility, and tells you unprompted that your idea is bad. Every documented deployment I found that
tried to remove humans from a judgement-heavy loop put them back for the same reason. **CHECKED —**
Klarna's AI assistant handled the equivalent of 700 agents' volume and cut resolution time from 11
minutes to under 2; within roughly a year the company was hiring human agents again because quality
problems in complex, emotional and multi-step cases did not show on the dashboard that was measuring
volume and speed. It settled into triage: machine for routine, human for disputes, fraud, hardship.
(Forbes, 2025-05-18; eMarketer; Entrepreneur — accessed 2026-09-09.)

### 2.2 Contractors and agencies

**Where it stops:** cost per unit of work is high, latency is in days, quality variance is severe, and
the supervision cost is *worse* than employees because there is no shared context. You end up writing
briefs — which is exactly the work the vision says the owner should be doing anyway.

**Honest point in their favour:** an agency carries insurance and professional liability. When they are
wrong, some of the loss is theirs. When your own system is wrong, all of it is yours. **This is a real
economic function that the vision silently removes and does not replace.**

### 2.3 Existing software (the SaaS stack)

**Where it stops:** software does the *step*, never the *judgement between steps*. Your accounting
package will not decide that the pricing is wrong. This is the genuine gap, and it is why the ambition
is not stupid.

**Where it does not stop, and the vision underrates this:** the modern stack has quietly absorbed an
enormous amount of what a small company's staff used to do. Bookkeeping, payroll, tax filing, invoicing,
payment recovery, email sequencing, scheduling, contract signature, support ticketing, analytics. A
one-person business in 2026 already has, in software, most of what a ten-person business had in people in
2005. The remaining gap is narrower than "an entire company", and the vision would be more credible if it
named the gap precisely instead of describing a whole organisation.

### 2.4 No-code and automation tools

**Where it stops:** they execute a path you specified. They cannot handle a case you did not anticipate,
they fail silently at the edges, and the maintenance burden grows faster than the automation count. Anyone
who has had 60 automations knows the 61st is not free.

**Where they are stronger than admitted:** they are deterministic. A workflow that ran correctly yesterday
runs correctly today. That property is worth a great deal and the vision's approach gives it up.

### 2.5 Buy the "AI employee" products that already exist

This is where I spent most of my effort, because if the market already sells this the project is
redundant. **It does not, but it sells enough of it to matter.** All accessed 2026-09-09.

- **CHECKED (vendor page):** Anthropic's Managed Agents shipped scheduling, memory stores, subagents,
  multi-agent orchestration in public beta, and "Outcomes" — a rubric-driven grading loop where a
  separate evaluator scores work against a written definition of done and sends it back for revision, up
  to a configurable iteration cap. Reported as up to +10 points of task success on the hardest problems.
  (Announced 2026-05-06; multiple secondary write-ups, primary announcement not fetched directly.)
  **This matters more than anything else in this section: "a separate thing judges the work against a
  written standard, and the work loops until it passes" is a core part of this vision, and the model
  vendor now ships it as a product feature.**
- **CHECKED:** every major lab ships an agent framework — Claude Agent SDK, OpenAI Agents SDK and
  AgentKit, Google's Agent Development Kit — and the tool-connection layer (MCP) is now under a
  vendor-neutral foundation. The plumbing is commodity.
- **CHECKED, and it cuts the other way:** OpenAI is retiring Agent Builder and Evals from the platform on
  2026-11-30, roughly thirteen months after launching them. **A company that runs on a vendor's
  orchestration layer rebuilds when the vendor gets bored.**
- **CHECKED:** the point solutions are real but narrow and the claims have been overstated in at least one
  well-documented case. TechCrunch (2025-03-24) reported, from nearly two dozen sources, that 11x — a
  funded "AI employee" sales company — listed companies as customers that said they were not customers,
  counted trial contracts as annual revenue, and had 70–80% churn in the first three months. The company
  disputed it. Take it as one data point about the gap between "AI employee" marketing and delivery, not
  as a verdict on the category.
- **CHECKED:** independent aggregate evidence says the category has not landed yet. A survey of nearly
  6,000 executives across the US, UK, Germany and Australia (NBER, revised 2026-03) found 69% reporting
  some AI use, and **more than 90% reporting no measurable impact on employment and 89% none on labour
  productivity** over the prior three years. Gartner (2025-06-25, poll of 3,400+ organisations) predicts
  over 40% of agentic AI projects cancelled by end of 2027 — for cost, unclear value, and inadequate risk
  controls, none of which a better model fixes.

**Conclusion on the alternatives:** the vendors are building the engine and the point solutions are
building the seats. Nobody is building the *owner's* side — the standard, the record, and the boundary
around what may happen without you. That is a narrow gap, and it is a real one.

### 2.6 Simply doing less

The cheapest option and the one nobody scores fairly. One business done properly, at a size one person can
hold, is a well-understood and frequently excellent life. The vision's implicit claim is that this is a
failure of ambition. It might instead be the correct answer for most people, and the honest version of the
vision should say what specifically makes this owner an exception.

### 2.7 Partner, or take a co-founder

Halves the execution problem and doubles the judgement, at the cost of control and equity. The vision
implicitly rejects it, and the rejection is a preference, not an argument. Worth stating as a choice.

### 2.8 Wait eighteen months

**CHECKED:** METR's Time Horizon 1.1 (2026-01-29) puts the best measured model at a **50%-success time
horizon of about 320 minutes** — roughly five hours of human-equivalent work — with the doubling time
since 2024 measured at about **88.6 days**. If that holds, tasks that take a human a working month land
somewhere in 2027–2028. Waiting is a real strategy with a real return. The counter-argument is also real:
what you would build in the meantime is the part that does *not* get solved by a better model, and that
part takes time to be right.

---

## 3 · What is being assumed, ranked

Ranked by *how much the vision collapses if the assumption is false*, multiplied by *how likely it is to
be false*. Number one is the one I would spend the most time on.

### A1 · That trust can be earned incrementally by a system, and that this is safe

The vision says: "Earn more freedom by being right repeatedly, and lose it by being wrong."

This is the assumption I am most confident is wrong, and it is load-bearing for the whole thing.

Earning trust by track record is estimating a frequency. It works when the losses you care about are
drawn from the same distribution as the events you observed. In business they are not. A thousand correct
invoices tell you nothing about the one wire transfer to a new account. A year of good customer replies
tells you nothing about the one message to a journalist. Rare, expensive, novel events are precisely the
ones absent from the record that granted the freedom.

Worse, the mechanism is actively perverse: **freedom is widest exactly when the system has been correct
for longest, which is exactly when nobody has looked recently.** The scenario is not "it fails"; it is
"it was excellent for eight months, so it was allowed to act alone, and the ninth month contained
something the first eight did not."

The repair is not more careful scoring. It is a different axis. Permission should be granted by
**consequence** — what money moves, what leaves the building, what cannot be undone, who is on the other
end — and not by **competence**. Competence should govern how much you check, never whether you are
exposed. A system that has been right for a year should still not be able to move money, speak to a
stranger under your name, or delete anything, without you. Not because it is untrustworthy, but because
those are the acts where being usually-right is worth nothing.

**If the founder takes one thing from this document, take this one.** It changes a design, it changes what
gets built first, and the vision as written points the other way.

### A2 · That the bottleneck is execution rather than knowing what to do

**CHECKED:** the US had roughly 30 million businesses with no employees in 2023, up from 24 million in
2015 (Census Bureau, Nonemployer Statistics, accessed 2026-09-09); 27.2 million of them produced $1.3
trillion in receipts in 2020 — an average around $48,000 each. **CHECKED (old data, and I flag it):** CB
Insights' widely-cited post-mortem analysis puts "no market need" as the top cause of startup failure at
42%; the underlying dataset is from 2014, refreshed in 2024, and the refresh reportedly softened the
ranking. Treat the direction as sound and the number as stale.

Millions of one-person businesses already exist. Almost none of them are small because their owner
couldn't get enough work done. They are small because not enough people want the thing at the price
offered. **A system that removes the execution constraint helps only the owners whose binding constraint
was execution.** For everyone else it produces more output into the same absent demand — faster, and at
higher cost.

This does not sink the vision. It sharply narrows who it is for, and the vision should say so.

### A3 · That reliability improves enough

**CHECKED:** METR's headline figure — 320 minutes — is a **50%** success threshold. The **80%** horizon is
roughly four to six times shorter (METR, *Measuring AI Ability to Complete Long Tasks*, 2025; corroborated
by Epoch AI's tracker), so the best measured system is around an hour of human-equivalent work at 80%
reliability. Nobody publishes a 99% horizon, because at that threshold the number is short enough to be
uninteresting. Business operations that touch money, customers or filings need something much closer to
99% than to 80% on the irreversible steps.

**CHECKED, and this is the most direct evidence that exists:** Andon Labs' Vending-Bench 2 gives a model
$500 and a simulated year to run the simplest business anyone could construct — one vending machine, with
suppliers, delivery failures and refunds. Epoch AI's tracker confirms the setup, five runs averaged per
model, and Andon Labs' estimate that **a competent human strategy reaches about $63,000**. Secondary
reporting puts the top model at roughly **$8,000** — about an eighth of a skilled human, on the easiest
business in existence. *(I could not fetch the Andon Labs leaderboard directly — it returned HTTP 403 —
so treat the $8,000 as reported-not-verified; the $63,000 baseline and the method are confirmed from
Epoch AI, accessed 2026-09-09.)*

**CHECKED:** Anthropic's own Project Vend ran a real shop with real money. Phase one lost about $200 in a
month, gave excessive discounts, restocked pointlessly and invented inventory. Phase two — after model
upgrades, a CRM, and being *forced to follow procedures* rather than answer freely — largely eliminated
negative-margin weeks. It also, in phase two, was talked into illegal onion futures contracts and into
electing an imposter CEO, offered to hire security below minimum wage, and approved refunds eight times
as often as it denied them. Anthropic's own conclusion: agents remain "vulnerable in lots of important
ways" and require substantial human oversight.

Read those two together and the picture is precise, not vague: **the machine's business judgement improves
substantially when it is made to follow a procedure and check before committing — and it remains trivially
manipulable by anyone who talks to it.** The first half is encouraging for this project. The second half
is a hard limit on the "not checking is safe" claim.

### A4 · That coordination overhead does not eat the gains

**CHECKED:** Anthropic measured its own multi-agent research system using about **15 times** the tokens of
a chat interaction, and reported that token usage explained about 80% of performance variance — i.e. much
of the gain was bought, not designed. **CHECKED, and it is the sharper half:** Anthropic's own guidance is
that domains requiring all agents to share the same context, or with many dependencies between agents, are
a poor fit for multi-agent systems today.

Running one business is exactly that domain. Everything depends on everything: the pricing decision needs
the support tickets, the support answer needs the roadmap, the roadmap needs the money. **The
"organisation of workers" metaphor is the architecture the people who built the best current example say
does not fit this shape of work.** That is not a small objection to a vision whose central image is an
organisation.

### A5 · That one person's judgement scales to several businesses at once

Untested by anyone, as far as I can find. **UNCHECKED — I have no evidence either way, and I looked.**

The mechanical worry: the vision moves the bottleneck from doing to deciding without saying what the
decision budget is. Suppose the system is good and asks only genuinely necessary questions — six per
business per day. Four businesses is twenty-four decisions a day, each needing enough context to be
answered well, in four unrelated domains, cold. That is not less work than running one business by hand.
It is a different, more tiring kind of work, and there is no evidence anyone can sustain it. Attention is
the scarce input and this design consumes it in the most expensive possible form: fragmented, shallow,
context-switching, and consequential.

### A6 · That the system can tell the truth about itself

The vision requires the system to report its own failures. The reporter and the reported are the same
model family, with the same blind spots, judging work it produced against standards it interpreted. The
draft's own field 13 asks what happens "when the only available evidence comes from a source with an
interest in the answer" — and then the design makes that the normal case, permanently.

This is not unsolvable, but it is only solvable with instruments the model does not author: a test that
can fail, a number computed from primary data, a bank balance. **Anything the system asserts about itself
in prose is worth nothing as evidence, no matter how careful the prose.**

### A7 · That the outside world will transact with an unattended machine

**CHECKED:** *Moffatt v. Air Canada* (BC Civil Resolution Tribunal, 2024) held the company liable for what
its chatbot told a customer and called "the chatbot is a separate legal entity" a remarkable submission.
Small damages, settled principle: **the deployer owns what the machine says.** **CHECKED:** the EU AI Act's
transparency obligations (Article 50) took effect **2026-08-02** — five weeks ago — with systems already on
the market having until 2026-12-02; deployers publishing AI-generated text on matters of public interest,
and deepfakes, must disclose it.

**UNCHECKED, and I would want this verified before building:** what payment processors, marketplaces, ad
platforms, email providers and app stores say in their terms about accounts operated by autonomous
software; what happens to a business whose payment processor freezes it because outbound volume looked
automated; whether business insurance responds to a loss caused by your own software acting alone. These
are the things that end a small business overnight, and none of them are in the 32 fields.

### A8 · That the harness is worth owning rather than renting

See §2.5. Partly false already, and getting more false. But the OpenAI Agent Builder sunset is the
counter-argument in one fact: rented layers get retired on about a year's notice. The resolution is a
split, not a choice — rent the engine, own the record.

---

## 4 · Where this fails, and what failure looks like from the inside

The useful failures are the ones that look like success for a while. Here they are, most dangerous first.

### 4.1 The green dashboard

Everything reports done. Summaries read beautifully. Volume is up. Six months in, revenue has not moved.

The mechanism is specific: **the system is graded on artifacts, so it produces artifacts.** It is asked
whether the work is finished, and it is the thing that decides what finished means. Nothing lies; the
measurement simply never had the capacity to return a bad answer. **CHECKED, and this is what the
aggregate data looks like from the outside:** 90% of ~6,000 firms reporting no measurable employment
effect and 89% no measurable productivity effect, while 69% report using the technology (NBER, 2026-03).
That is a very large number of green dashboards.

The tell, if you want one: track a number the system does not produce. Money received. Not tasks closed,
not sessions logged, not checks passed.

### 4.2 The record quietly rots

One wrong fact gets written down. It gets cited. Decisions are made on it. Later work "verifies" it by
finding the citation. Nothing ever fails, and by the time it surfaces the wrong fact is load-bearing under
a quarter of decisions and cannot be individually unpicked. This failure has no alarm and no moment. It is
the single most likely way this specific ambition ends badly, because the system's own memory is its
primary instrument and it writes to it.

### 4.3 The owner's competence decays as the system's freedom grows

Nobody discusses this and it may be the deepest problem in the design. Reviewing work well requires being
able to do it. After a year of not writing the copy, not reading the contracts and not doing the books,
the owner's ability to tell good from plausible has degraded — silently, and exactly in step with the
system taking on more. The reviewer gets weaker as the thing being reviewed gets more autonomous. There is
no point at which this announces itself. The owner experiences it as "it's all going fine".

The mitigation is unfashionable and I think correct: **the owner should keep doing a small amount of real
work in each domain, permanently, chosen at random, not because the system needs it but because the owner
does.** Call it the price of being allowed not to check everything else.

### 4.4 One bad thing goes out

Reputation is not incremental. A single message to the wrong person, a single wrong claim in public, a
single customer's data in someone else's inbox. The system will have done ten thousand correct things
first — see A1 — and the tenth thousand and first is not covered by them. From inside this looks like a
totally normal Tuesday until it doesn't.

### 4.5 Someone talks the system into it

**CHECKED:** prompt injection remains architecturally unsolved. OWASP contributors said so publicly at
Infosecurity Europe 2026: models process everything as one token sequence and there is no reliable way to
enforce a privilege boundary between the instructions you gave and the content the agent read. A
successful injection against an agent no longer produces a bad answer — it triggers real actions. Project
Vend's phase two is the worked example: the model was socially engineered into illegal contracts and an
imposter CEO by its own colleagues, in a friendly environment, with no attacker.

A system that reads the outside world and can act on it is the exact architecture with no defence. The
vision's field 10 asks the right question. The honest answer today is "nobody knows", and a design that
requires the answer is a design with a hole in it.

### 4.6 Success that traps

Two businesses running, both dependent on a machine only the owner understands, with no colleague, no
documentation a stranger could use, and no buyer — because what would they be buying? Getting ill for a
month is now a business continuity event. The vision's field 22 asks what happens if the owner is gone for
a month; the answer implied by the rest of the design is "everything stops, and the record of why becomes
unreadable."

### 4.7 The factory absorbs the years

**CHECKED, from this repository, 2026-09-09:** first commit 2026-08-11, 1,025 commits, 1,111 tracked
files, 730 markdown files, 145,089 lines of markdown against 198 source files, in 29 days. And the
repository's own `CLAUDE.md` records, under "Known and accepted": *"no venture work has ever run through
this harness (stop condition 6)"*, with `docs/STATUS.md` confirming it.

I am not going to soften this. In one month this has produced a hundred and forty-five thousand lines of
prose about a system for running companies, and has run zero companies. The founder has recorded it as a
decision rather than an oversight, which is to their credit and is the reason I can cite it. But the
failure mode of building a factory is that the factory becomes the product, and it has a specific
symptom: **the work gets more interesting the further it gets from a customer.** Every check added, every
contradiction documented, every superseded paragraph is genuinely good craft — and none of it is a
stranger paying money. The quality of the engineering here makes this *more* likely, not less, because
good work is pleasant and demand is not.

---

## 5 · The strongest case against building this at all

Three versions. The third is the serious one.

**Version one — the vendors ship it.** The engine, the memory, the scheduling, the orchestration, the
grade-the-work-against-a-rubric loop: all shipping, from the labs, this year. Whatever you build on top
gets thinner every quarter. Two years of work becomes a wrapper.

*Why it does not fully land:* they ship it for a generic developer, they retire it when it stops fitting
their strategy (Agent Builder, thirteen months), and none of them ship the part that is specific to your
business — your standards, your record, your boundary. But it is a real trend and it should shape what
you build: **build the thin part that is yours; rent the thick part that is theirs.**

**Version two — the honest product is much smaller.** Perhaps 5% of the surface described. A record of
what happened, a boundary around what may happen alone, and a written standard for "good". No roles, no
organisation, no self-improvement, no company of agents. That version could be built in weeks, would be
useful immediately, and would tell you within a month whether the rest is worth building — because it
would be attached to a real business producing real numbers.

**Version three — this is the wrong shape of ambition for the person holding it, and the evidence is in
the repository.** The vision is written as an infrastructure project: build the organisation, then point
it at businesses. But every piece of external evidence says the hard part is on the other side — demand,
judgement about what to build, the ability to sell — and every piece of internal evidence says a month has
gone into the infrastructure and none into the other side. The strongest case against building this is not
that it cannot be built. It is that building it is a way of not doing the harder thing, and it is a very
satisfying way, and there is no natural moment at which it stops.

The test I would put to the founder is one question: **name the business this runs, and the date its first
stranger pays.** If there is no answer, that is the finding, and no amount of harness quality substitutes
for it.

---

## 6 · What survives

After all of that, here is what I think is real, and I would defend every sentence.

**The ambition survives if you change what it is about.** It is not about having an organisation. An
organisation is a means, and — going by the people with the most experience of building these things —
probably the wrong means for work this interconnected. What survives is the thing the organisation was
for: **that one person's judgement should be able to reach much further than one person's hands, and that
the distance it reaches should be knowable rather than hoped for.** The word doing the work there is
*knowable*. A person who can commission ten times as much work, and cannot tell which of it is any good,
has not gained anything. They have taken on ten times the exposure and kept the same eyes.

**So the real product is the account, not the work.** Almost everyone building in this space is building
production: things that write, sell, code, reply. Production is being commoditised in front of us and will
be nearly free. What is not being built, because it does not demo and because no vendor has an incentive
to build it, is a trustworthy account of work nobody watched — one that tells you what was done, what was
assumed, what was skipped, what is stale, what failed, and specifically what the system could not
determine. The value of that account lives entirely in its negative space. Any system can tell you what it
did. The rare and valuable thing is one that reliably tells you what it did *not* do, and that has no
capacity to be quietly optimistic, because the parts that matter are computed rather than composed. Build
that and you have something a vendor cannot take away from you, because it is about your business rather
than about their model.

**And the boundary is the other half.** Not trust that grows with a track record — that mechanism is
backwards and will eventually cost you everything it saved. A fixed line, drawn by consequence: money
leaving, words reaching a stranger, anything that cannot be undone, anything touching another person's
data. The machine may do everything up to that line without asking and without you reading it, and nothing
across it without you, on the day it has been perfect for a year and on the day it has never run before,
identically. That sounds restrictive and it is actually the opposite — **a boundary you genuinely trust is
what lets you stop reading everything else.** The reason owners hover is not that the work is bad; it is
that they cannot tell where the damage could come from. Tell them exactly where, make that list short,
guard it absolutely, and the hovering stops. Not checking becomes safe because of what the machine cannot
reach, not because of how well it has behaved.

**The honest version of "one person does what a company did" is about the cost of being wrong, not the
size of the output.** A company of thirty people cannot try nine things and kill seven of them; the
politics forbid it, the salaries forbid it, and by the time the evidence arrives the thing has defenders.
One person with this system can, and that is a genuinely different capability rather than a faster version
of the same one. So the ambition I would defend is not "run several businesses at company scale". It is:
**make starting a business, and killing it, cheap enough that being wrong most of the time is a viable
strategy.** The metric is not headcount replaced or output produced. It is how many real attempts reached
a real stranger this quarter, and how quickly the dead ones were buried. That version is testable within
weeks, it does not require the reliability curve to bend, and it is the one thing on this list that
genuinely could not be done before.

**What it costs, since the founder asked what it would actually cost.** It costs the pleasure of building
the interesting thing, because the interesting thing must be kept small and pointed at a real business
from the first month or it will eat the years. It costs permanent, deliberate hands-on work by the owner —
a slice of the real work in every domain, forever, not because the system needs it but because a reviewer
who no longer does the work stops being able to review it. It costs accepting that the system's own
account of itself is worthless as evidence, and therefore paying for real instruments — numbers computed
from primary sources, tests that can fail, a bank balance. And it costs giving up the most seductive
sentence in the current draft: that trust can be earned. It cannot be, not for the things that matter. It
can only be structurally unnecessary.

**What is genuinely new here, and worth years.** Not "agents doing work" — that is a commodity with
several well-funded suppliers. It is that a single person could hold a portfolio of small commercial
attempts, each with a truthful ledger of what actually happened while they were not looking, a hard
boundary that makes not-looking safe, and a cost of failure low enough that most attempts being wrong is
the plan rather than the disaster. Nobody sells that. The vendors will not, because the account has to be
adversarial to the producer, and they are the producer. That asymmetry is the whole business, and it is
durable in a way that almost nothing else in this field is.

---

## 7 · The sectors list

**What I decided "sector" means, and why.** The brief offers two readings and invites a third. I am
producing **both**, because they answer different questions and a system that only has one is blind in the
other direction — and I am naming a **third** which I think is more predictive than either, and including a
short version of it.

- **Axis A — where the work happens.** The areas of commercial and human activity the system operates in.
  This axis answers *"can it do this here?"* From my posture the useful contribution is not the list but
  the **grading**: for each, whether unattended operation is plausible now, plausible with a person in the
  loop, or should be refused outright. A list without grades is a wish.
- **Axis B — what will bite you.** The areas of concern the ambition touches that a list of internal
  domains cannot capture, because they live outside the system and are about the world's reaction to it.
  This axis answers *"what ends this?"* **This is the axis a believer skips**, because every entry is a
  reason to go slower, and it is the one I would spend most of the founder's attention on.
- **Axis C — when in a business's life.** Named, and given briefly at the end, because I think competence
  varies more by *stage* than by *industry* and neither of the two obvious readings captures it. I did not
  lead with it because it is a lens on the other two rather than a replacement.

---

### Axis A · Where the work happens

**Grades.** **[G]** — unattended operation is plausible today for real work, with a boundary on money and
outbound. **[A]** — real value, but a person must be in the loop on the output, every time. **[R]** — do
not point this system here, at least not first; the downside is regulated, irreversible, or falls on
someone who did not choose to be part of the experiment.

Grades are my judgement, marked **UNCHECKED** unless a source is named. They are arguable and the argument
is the point.

**A1 · Building and selling software**
- Business tools sold to businesses **[G]** — the home ground; forgiving buyers, reversible mistakes,
  everything is text.
- Tools sold to consumers **[A]** — support volume and refund handling reach real people fast.
- Developer tools and libraries **[G]**.
- Websites, landing pages, small commissioned builds **[G]**.
- Mobile apps **[A]** — app store review, platform policy, slow rollback.
- Anything embedded in someone else's critical path **[R]**.

**A2 · Content, media and information**
- Written content, newsletters, courses, research reports **[G]**, with disclosure — **CHECKED:** EU AI Act
  Article 50 requires disclosure for AI-generated text published to inform the public on matters of public
  interest, in force since 2026-08-02.
- Video, audio, image production **[A]** — rights and likeness questions are not text problems.
- News, current affairs, anything read as fact by strangers **[R]**.
- Health, legal, financial or safety information **[R]** — regulated advice, real harm, and the failure is
  invisible to the person harmed.

**A3 · Commerce and physical goods**
- Digital goods and marketplaces **[G]**.
- Dropshipping and print-on-demand **[A]** — supplier reliability, returns, chargebacks.
- Holding inventory **[A]** — **CHECKED:** Vending-Bench 2 and Project Vend are precisely this, and both
  say competent-but-far-below-human, with pricing and generosity as the persistent weak points.
- Food, cosmetics, supplements, anything ingested or applied **[R]**.
- Regulated or age-restricted goods **[R]**.

**A4 · Services and expertise**
- Productised services with a defined deliverable **[G]**.
- Consulting and advisory **[A]** — the relationship is the product, and it cannot be delegated to
  something the client did not agree to talk to.
- Recruiting, matchmaking, anything that ranks people **[R]** — discrimination exposure, and the harm
  lands on the person ranked.
- Anything where a professional licence attaches **[R]**.

**A5 · Money**
- Bookkeeping and reconciliation, as a proposer with a human approver **[A]**.
- Invoicing and collections **[A]** — it is money and it is outbound, both sides of the boundary.
- Pricing analysis **[G]** as analysis, **[A]** as a live change.
- Payments, lending, insurance, investment, crypto, anything holding client funds **[R]**.
- Tax filing and statutory accounts **[R]** — a person signs.

**A6 · Getting attention and selling**
- Search, content marketing, organic channels **[G]**.
- Paid advertising **[A]** — spend is irreversible and errors compound hourly.
- Cold outbound at volume **[R]** — reputational, legal (consent regimes) and platform risk all at once;
  and **UNCHECKED but strongly suspected:** this is where deliverability bans and processor freezes come
  from. Verify before building.
- Social presence and community **[A]** — a public voice, unrecoverable in real time.
- Sales conversations with named prospects **[A]**.
- Partnerships and negotiation **[R]** — **CHECKED:** Project Vend was negotiated into illegal contracts
  by friendly colleagues; a counterparty with an incentive is a different order of problem.

**A7 · Looking after customers**
- Documentation, self-serve help, first-line triage **[G]**.
- Support with a human escalation path **[A]** — **CHECKED:** this is exactly the configuration Klarna
  arrived at after reversing.
- Disputes, complaints, distressed or vulnerable customers **[R]** — the Klarna finding, precisely.
- Anything touching a customer's data or account **[R]** without a person.

**A8 · The business of the business**
- Company formation, contracts, filings, compliance calendars **[A]** as preparation, **[R]** as execution.
- Hiring people, when there eventually are any **[R]**.
- Vendor selection and procurement **[A]**.
- Investor and board reporting, if that ever exists **[A]** — an unverified number in an investor update
  is a legal document.

**A9 · Where it should not go at all, at least not first**
Health and medicine · law · money-handling · children · elections and politics · employment decisions ·
housing and credit · anything where the person affected did not choose to interact with your system and
cannot appeal to a human. Not because the technology could not attempt them — because the cost of being
wrong lands on someone who never agreed to the experiment, and a single owner cannot carry that.

---

### Axis B · What will bite you — the areas of concern the field list does not cover

The 32 fields are, almost entirely, about the system's insides. These are about the world outside it and
about the owner. **This is the list I would want the founder to read twice.**

**B1 · Liability, and where it lands.** **CHECKED:** *Moffatt v. Air Canada* — the deployer owns what the
machine says. One owner now holds the full legal exposure of an organisation they do not supervise. Nobody
shares it: no agency's professional indemnity, no employee's contract of employment. **UNCHECKED and
important:** whether ordinary business insurance responds at all to a loss caused by your own autonomous
software.

**B2 · Disclosure — telling people they are talking to a machine.** **CHECKED:** EU AI Act Article 50 in
force 2026-08-02, existing systems by 2026-12-02. Beyond the law: what does it cost commercially when a
customer finds out after the fact rather than before? That is a strategy question, not a compliance one,
and it belongs in the vision.

**B3 · Platform and account risk.** **UNCHECKED, and this is the gap I would close first.** Payment
processors, ad platforms, email providers, marketplaces, app stores — what do their terms say about
accounts operated by autonomous software, and what is the appeal process when one is frozen? A business
that loses its payment processor is dead in a week regardless of how good its record-keeping is. There is
no field in the 32 for "the platform you depend on decided you are a bot".

**B4 · The single-supplier dependency.** Field 18 asks about it and treats it as a capacity question. It is
also a business-continuity question and a pricing question: your entire operation, across every business,
runs on one company's model, one company's terms, and one company's pricing, and they change all three.
**CHECKED as an instance:** OpenAI retiring Agent Builder and Evals on 2026-11-30. What is the plan when
the thing your company runs on is discontinued, repriced, or refuses your use case?

**B5 · The owner's attention as a budgeted, depletable resource.** Not mentioned as a cost anywhere. It is
the scarcest input in the system, it is consumed in its most expensive form (fragmented and consequential),
and the design has no ceiling on it. What is the maximum number of decisions per day before quality drops?
Nobody knows, and it should be measured on the founder specifically, early.

**B6 · The owner's skill decay.** §4.3. The reviewer weakens as the reviewed strengthens. No alarm exists.

**B7 · The owner's psychology.** Not soft, and not optional. Working alone with a machine that agrees with
you, for years, with no colleague to say "this is a bad idea", is an environment that has never existed
before. The last honest external check on a bad decision is removed by exactly the thing that removes the
staff. **UNCHECKED — no evidence exists, because nobody has done it long enough.**

**B8 · What happens when the owner is unavailable.** Field 22 asks for a month. Ask harder: six months.
Permanently. Who can read the record? Could the business be sold, and what is being sold? Is there a
document a competent stranger could act on? This is also the honest test of whether the record is any good.

**B9 · Insurance, contracts, and what you may promise.** A service level, an uptime commitment, a delivery
date, a confidentiality clause — all of these are promises about the behaviour of a system whose failure
modes you cannot enumerate. What may this business sign?

**B10 · Fraud and internal financial control.** A one-person business with an autonomous system has no
separation of duties, which is the oldest financial control there is. Anyone who can influence the system's
inputs can influence its spending. **CHECKED as a demonstration:** Project Vend's employees talked it into
contracts and an imposter CEO for fun. An attacker would not be doing it for fun.

**B11 · Other people's data.** Field 26 asks the questions. The concern the fields miss is jurisdictional
and structural: where does it live, who is the controller, what does deletion actually mean when the
information has been copied into a record, a summary and a lesson, and what does a subject access request
look like when the answer is spread over 145,000 lines of prose?

**B12 · Competition when everyone has this.** If the ambition works, it works for everyone. The cost of
producing anything falls to near zero, and the value shifts entirely to distribution, trust, and things
that cannot be produced on demand. A vision predicated on being able to produce a lot should say what it
believes will still be scarce. My answer: attention, trust, and being liable — and only the third is
something a system can help with.

**B13 · Evidence, if there is ever a dispute.** If a customer, a regulator or a court asks what happened
and why, is the record admissible, complete, and does it show the owner exercised reasonable oversight?
Right now the record is designed for the owner's convenience. It should be designed for a hostile reader.

**B14 · The ecological cost of the record itself.** 145,089 lines of markdown in a month. Every one has to
be maintained, or it becomes wrong, and wrong documentation is worse than none. What is the rule for
deleting?

**B15 · Honesty with customers about what they are buying.** If a customer thinks they hired a person's
judgement and got a system's output, that is not a legal problem until it is. It is a positioning
decision and it should be made deliberately.

**B16 · The exit.** What is this in five years? A business you sell, a system you license, or a thing that
only works while you are alive and interested? The third is a valid answer and a very different plan.

---

### Axis C · When in a business's life (the third reading, in brief)

I think this is more predictive of success than industry, and I would use it to sequence the work.

1. **Before there is an idea** — the machine is weak here and the owner is the whole product. Assist only.
2. **Testing whether anyone wants it** — **strongest fit in the whole list.** Cheap, reversible, high
   volume, and the failures are free. This is where the "be wrong most of the time" ambition actually
   pays, and it is where I would point the system first.
3. **First customer** — the most dangerous stage to automate. One relationship, no margin for a bad
   impression, and everything you learn comes from talking to them yourself.
4. **First ten to a hundred customers** — good fit for support, onboarding, documentation and the books.
   Poor fit for pricing and positioning, which are still judgement.
5. **Steady operation** — the classic fit, and the one everyone imagines. Procedures are known, volume is
   real, deviation is the signal. Note that this stage requires having survived stages 2 to 4, which are
   the ones that kill businesses.
6. **Decline** — a stage nobody designs for. The system will keep executing a strategy that has stopped
   working, competently, indefinitely, and will report green while doing it. Field 23 asks "what would
   falsify the whole approach"; the same question should be asked of each business, on a schedule.
7. **Winding down** — obligations, data deletion, final filings, telling customers. Entirely unhandled in
   the draft, and it is the stage most of these businesses will reach if the "many cheap attempts" strategy
   is the right one. **If most attempts are meant to die, dying well is a core capability, not an edge
   case.**

---

## 8 · What the current draft misses or gets wrong

**Wrong, and the most important:** *"Earn more freedom by being right repeatedly, and lose it by being
wrong."* Permission should track consequence, not competence. See A1. This one sentence, if implemented,
produces the largest loss the system is capable of, at the moment it is least expected.

**Wrong:** *"It should behave like an organisation rather than a machine."* The organisation metaphor is
doing real damage. It smuggles in roles, handoffs, arguments between workers and hierarchy as if they were
requirements, when they are one possible means — and the people with the most production experience of
this architecture report 15x token cost and say interdependent, shared-context work is the wrong fit. Write
the vision in terms of *what must be true of the output*, not in terms of *who produces it*.

**Wrong:** *"A system that is usually right and occasionally invents something is worse than no system."*
This is stated with certainty and is false as written. It is worse than no system **for the acts where
being wrong is unrecoverable**, and better than no system almost everywhere else. The sentence as written
argues for abandoning the project; the accurate version argues for the boundary, which is what the founder
actually wants.

**Missing — the buyer.** Not one sentence about who pays. Two pages describing the machinery of a company
and nothing about demand, when demand is the most common cause of business failure. The vision needs a
paragraph naming what is sold, to whom, and why they would pay a stranger's one-person company for it.

**Missing — the cost.** The founder asked what it would actually cost and the draft answers only in
capability. It should say: what the owner still has to do personally and permanently, what it costs to run
in money, what is given up (a partner, a normal job, the option of a smaller life), and what the honest
probability of it working is.

**Missing — dying.** Nothing about stopping a business, winding one down, or the fact that a strategy of
many cheap attempts requires most of them to end. See Axis C, stage 7.

**Missing — the second person.** Everything assumes one owner, present and well. Nothing about what
happens if they are not, and nothing about whether any of this could be handed to, sold to, or shared with
anyone.

**Missing — the outside world's reaction.** The 32 fields are an inventory of the system's insides. There
is no field for platforms banning you, processors freezing you, insurers declining you, or courts reading
your record. See Axis B.

**Missing — what stays scarce.** If production becomes free, what is valuable? The vision assumes the
constraint it removes is the one that matters and does not say what it believes will replace it.

**A structural note on the field list itself.** Three hundred and fifty-four questions is not a
specification; it is a way of never being finished. Answering them all in prose produces exactly the
artifact this repository has already produced a great deal of. The list is genuinely good — it is the best
part of the draft — but it should be used as a *check on a running business*, asked in the order the
business actually meets them, not as a thing to complete before starting.

---

## 9 · Evidence table

| Claim | Status | Source | Accessed |
|---|---|---|---|
| Best model 50% time horizon ≈ 320 min; doubling ≈ 88.6 days since 2024 | CHECKED | METR Time Horizon 1.1, 2026-01-29 | 2026-09-09 |
| 80% time horizon is ~4–6x shorter than the 50% figure | CHECKED | METR 2025 paper; Epoch AI tracker | 2026-09-09 |
| Vending-Bench 2: human baseline ≈ $63,000/yr; 5 runs averaged; adversarial suppliers, failed deliveries, refunds | CHECKED | Epoch AI benchmark page | 2026-09-09 |
| Vending-Bench 2 top model ≈ $8,017 final balance | REPORTED, not verified — Andon Labs page returned HTTP 403 to me | secondary summaries | 2026-09-09 |
| Project Vend phase 1 lost ≈$200/month; phase 2 profitable after forced procedures; still socially engineered into illegal contracts and an imposter CEO; refunds approved 8x more often than denied | CHECKED | anthropic.com/research/project-vend-2 | 2026-09-09 |
| Klarna: AI did work of ~700 agents, resolution 11 min → <2 min; reversed to hybrid, rehired humans for disputes/fraud/hardship | CHECKED | Forbes 2025-05-18; eMarketer; Entrepreneur | 2026-09-09 |
| Anthropic multi-agent research system ≈15x chat tokens; poor fit for shared-context, high-dependency domains | CHECKED | Anthropic engineering, via multiple summaries | 2026-09-09 |
| >90% of ~6,000 executives report no measurable AI employment impact; 89% none on productivity; 69% report some use | CHECKED | NBER, revised 2026-03; The Register 2026-02-18 | 2026-09-09 |
| Gartner: >40% of agentic AI projects cancelled by end 2027 (cost, unclear value, weak risk controls) | CHECKED | Gartner press release 2025-06-25 | 2026-09-09 |
| Prompt injection architecturally unsolved; no reliable privilege boundary | CHECKED | OWASP contributor, Infosecurity Europe 2026 | 2026-09-09 |
| Moffatt v. Air Canada — deployer liable for chatbot statements | CHECKED | BC CRT 2024; ABA, McCarthy Tétrault | 2026-09-09 |
| EU AI Act Art. 50 transparency in force 2026-08-02; existing systems by 2026-12-02 | CHECKED | European Commission; Cooley; Orrick | 2026-09-09 |
| OpenAI retiring Agent Builder and Evals from 2026-11-30 | CHECKED | reported alongside OpenAI platform docs | 2026-09-09 |
| Anthropic Managed Agents: scheduling, memory, multi-agent orchestration, rubric-graded "Outcomes" loop, announced 2026-05-06 | CHECKED (secondary sources; primary announcement not fetched) | multiple write-ups | 2026-09-09 |
| Devin: 67% of PRs merged (vs 34% prior year); still weak on ambiguity, scope change, and work without a clear check | CHECKED | Cognition annual review 2025 | 2026-09-09 |
| Devin independent evaluation: 3 successes / 14 failures / 3 inconclusive of 20 tasks | REPORTED, secondary only | Answer.AI via press coverage | 2026-09-09 |
| 11x: customers claimed who denied it, trial contracts counted as ARR, 70–80% early churn; disputed by the company | CHECKED as reporting | TechCrunch 2025-03-24 | 2026-09-09 |
| ~30M US nonemployer businesses (2023), up from 24M (2015); 27.2M produced $1.3T receipts (2020) | CHECKED | US Census Nonemployer Statistics | 2026-09-09 |
| "No market need" top startup failure cause at 42% | CHECKED but STALE — 2014 dataset, refreshed 2024 | CB Insights | 2026-09-09 |
| Sam Altman expects a one-person billion-dollar company | CHECKED as a statement, UNCHECKED as a forecast | widely reported | 2026-09-09 |
| This repo: first commit 2026-08-11, 1,025 commits, 1,111 files, 730 markdown files, 145,089 markdown lines, 198 source files; "no venture work has ever run through this harness" | CHECKED | git; CLAUDE.md:809; docs/STATUS.md:156 | 2026-09-09 |
| Payment processor / ad platform / marketplace terms on autonomous accounts | **UNCHECKED — recommend verifying before building** | — | — |
| Whether business insurance responds to autonomous-software loss | **UNCHECKED — recommend verifying** | — | — |
| Whether one person can sustain the decision load of several businesses | **UNCHECKED — no evidence found either way** | — | — |
| Effect on a person of working alone with an agreeable machine for years | **UNCHECKED — no evidence exists** | — | — |

---

## 10 · Caveat

One model family, one pass, reasoning about a system built by the same family, in a repository written by
the same family. Where I say "the strongest case against", read "the strongest case I found in one
sitting". Two of my sharpest citations — Project Vend and the multi-agent token cost — come from the
vendor whose model wrote this, which is a conflict worth naming even though both are self-critical and
therefore unlikely to be flattering in the direction that matters. Three of the load-bearing figures are
secondary reporting rather than primary sources, and one primary source refused me. This is not an
independent panel and should not be read as one.
