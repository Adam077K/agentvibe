# Board meeting · 2026-09-01 · `startup-os` · Round 0

**First convening of `/board-meeting`.** The protocol was specified 2026-05 and never run; zero of its
personas had agent files. This run uses five of the six locked personas on Opus. **Customer Voice is
not simulated:** the customer of this system is the founder, who is in the room and holds the veto.

**Topic, in the founder's words (2026-09-01):** *"After we got all the ideas, the other projects we can
learn and use — run 3–5 agents and orchestrate the thinking and planning process. All should plan the
whole agentic system. No limits, think big. We want to plan the best system that can be created."*

**Hard caps, and their status:** the spec's $3 cap is **exceeded by design and by the founder's
instruction** ("no limits"). Wall-clock target does not apply. The traceability rule stands and is
non-negotiable: every locked decision names `source_persona_round`.

---

## Shared context — every persona reads this block, by reference, before its framing

**Read, in order:**
1. `docs/02-competitive/expansion/00-TERRITORY.md` — the fourteen territories, the twelve never-named
   gaps, the measured state of this machine, the standing rules that bind any proposal
2. `docs/03-system-design/STARTUP-OS.md` — §2 nine founder decisions (not to be re-litigated),
   §3 the proposed shape, §4 packs, §5 the worker loop, §7 rules paid for, §8b the five studied systems
3. `docs/02-competitive/expansion/open-source.md` §0, §1, §16 · `hands.md` §0, §6, §8 ·
   `concepts.md` "How to read this", §15, §17 — then dip into any section your framing needs.
   These three total ~4,100 lines; the shortlists are the entry points.

**Founder decisions since the spec, session 2 (2026-09-01):**
- Balcony rows are **goal-sized** — the founder watches 2–4 rows a day, not 200.
- Cadence after planning is **continuous, no phase numbers** — small landings, each useful alone.
- The policy seam: built on the eight hook events currently unused; `pre-tool-use.sh` untouched.
- None of the three founder-only permissions (register budget-guard, run gemini, fix the hook
  bypass) is authorised yet.

**What the founder has said they want, verbatim where it matters:**
- *"recreate a company that is going to work twenty four seven"* — for a business, a product, a
  coding project, schoolwork — *"anything given as a path."*
- *"I don't want to build a system that knows exactly what is going to do, like a playbook that's
  just following. I want to create a creative moving forward system."*
- *"not all the time I'm sitting next to the models… make sure we are not burning tokens or just doing
  circles… think about it as the upper balcony, and we are controlling the workers in the factory."*
- *"walk relentlessly until they achieve the goal."*
- *"give them the tools… the way and the understanding on how to learn… push back if it's not true to
  build super-specified packs."*
- Breadth beyond code is explicit: design, video, content, social, marketing, customer, data, CI.
- *"Think big. We want to plan the best system that can be created."*

**Rules that bind every proposal** (from the territory file — restated because they are load-bearing):
Rule 10, a resolver never passes what it could not check · union never average · constrain the exit
never the path · every rule names its mechanism or is labelled WISH · built-and-never-wired is the
endemic failure, in this repo and in all five systems studied.

**Return format — Round 1.** Write your FULL reasoning as markdown to
`docs/08-agents_work/board-meetings/2026-09-01-startup-os/r1-<persona>.md`, and your structured
position as JSON to `r1-<persona>.json` with exactly this shape:

```json
{
  "persona": "visionary|strategist|architect|risk-modeler|adversary",
  "round": 1,
  "thesis": "one paragraph — your core position on what the best system is",
  "positions": [
    { "id": "P1", "claim": "…", "reasoning": "…", "evidence": ["file:section", "…"],
      "confidence": "low|med|high", "territories": ["01","09"] }
  ],
  "what_must_be_true": ["preconditions for your thesis to hold"],
  "refuse": [ { "what": "…", "why": "…" } ],
  "build_order": ["what first, and why it is forced rather than preferred"],
  "open_questions": ["…"],
  "strongest_counter": "the single best argument against your own thesis, stated fairly"
}
```
Between 6 and 14 positions. Every `evidence` entry must point at a real file and section. A position
with no evidence is allowed only if labelled `"evidence": ["INVENTED"]`. Then return to the CEO
**≤300 words**: your thesis, your three strongest positions, and your strongest counter.

---

## The five framings — each persona sees ONLY its own

### Visionary — future-backwards
It is September 2028. This system has been running for two years on one founder's Mac and wherever
else it grew to. Describe the company it has become: what it does in an ordinary week in which nobody
types anything; what it has shipped that a person would be proud of; what it learned that it did not
know on day one; how the founder relates to it. Then work backwards. What had to be true in the first
month for that company to exist? What was the first thing that ran unattended, and why that? Which of
the 420 options turned out to be the spine and which turned out to be decoration? Think in flywheels:
what compounds, and what merely accumulates.

### Strategist — the anti-roadmap
You have been handed a catalogue of roughly 420 things this system could build, adopt or connect.
The system that actually ships is the one that refuses most of them. Write the anti-roadmap. What
will this system NEVER do, and why is each refusal load-bearing rather than merely prudent? What does
it not build in the first year even though it could? What is the smallest system that still deserves
the name "company" — that runs unattended, produces something, and knows whether it worked? Be
specific about what "think big" means when the biggest thing is usually the one that never ships:
nine phases produced one venture task. Where is the ambition actually supposed to go?

### Architect — the bill of materials
You are handed a machine with fourteen territories, a set of parts (177 verified repositories, ~90
hands, 128 mechanisms) and a standing rule that every rule names its mechanism. Design the bill of
materials. Which components are load-bearing — the ones everything else sits on — and which are
leaves? What depends on what, so that the build order is forced by dependency rather than chosen by
preference? For each load-bearing choice: what does it cost to reverse, and what has to be in from
day one because it cannot be retrofitted? Where does the existing L1 truth layer (ledger, classifier,
verdict binding, 48 checks) sit in the new structure — foundation, or a component like any other?
Name the seams: the places where two subsystems meet and could disagree silently.

### Risk Modeler — how it dies
This system will run at 3am with real hands. It can publish to TikTok, send email as the founder,
spend on ad accounts, sign documents, post physical letters, register domains, and act as the
logged-in founder in their own browser. It will do this unattended, on a five-hour token window,
across several ventures at once, with a founder who watches two to four rows a day. Enumerate how it
goes wrong: the failure modes, ranked by probability × severity, from the boring (it circles and burns
the window) to the catastrophic (it spends, sends, or signs something that cannot be undone). For each:
what structural property — not policy, not prose, not a rule someone must remember — makes it
impossible or bounds it? Distinguish honestly between risks a mechanism can close and risks that must
simply be accepted and named.

### Adversary — the refutation
The thesis is that a one-founder company can run 24/7 on an agent harness and produce work worth
having, across every field a company needs, without the founder present. Argue that it cannot. Argue
that this whole rethink is a category error — that the last nine phases failed for a reason the
tenth will repeat, that "built and never wired" is not a defect but the natural state of a system
nobody uses, that the 420-option catalogue is procrastination wearing a research badge, and that
the founder should spend the effort differently. Be the strongest possible critic, not a cheap one:
attack the load-bearing assumptions, not the details. Then — and only then — say precisely what
evidence would change your mind, and what the smallest experiment is that would produce it.
