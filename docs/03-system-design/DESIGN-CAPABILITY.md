# Design capability — findings, not a plan

**Started:** 2026-08-28 · **Extended:** 2026-08-29 · **Session:** `ceo-4-1787566829`
**Status:** investigation COMPLETE — eleven research streams returned. **No design decided.**
Three §1 findings were withdrawn during the investigation; all three are kept in place with their corrections.

> This document records what was **measured and verified** about why design is this system's weakest
> output, plus external research. It deliberately contains **no architecture**. The founder stopped an
> earlier architecture proposal on the grounds that the thinking had not happened yet, and they were
> right — the proposal would have left every finding below untouched.

**§1–§2** were executed in this worktree on 2026-08-28. **§3** is the first three research streams.
**§6–§13 are eight further adversarial streams from 2026-08-29**, each briefed to attack our current
choice rather than justify it — substrate · perception · references/tokens · evaluation · visual
foundations · upstream (brief/IA/fidelity) · motion · design systems · domain UX · content design ·
generative assets. Eleven streams total.

**READ §14 FIRST if you want the conclusion.** It is the synthesis; everything above it is evidence.
**§15 is newer than §14 and corrects it in five places** — added 2026-08-29 during planning. Two figures in
§1 do not reconcile; §2.3's diagnosis is superseded by a deeper one (*the judge does not lack a camera,
there is no judge*); and the best design knowledge in this repository turns out to be 4,959 lines that
nothing can load. **Read §15 before acting on anything above it.**

**The single line that governs the rest:** *conformance can bind, quality can only inform* (§6.1).

**None of this is in the claim ledger** — the research agents had no `append_claim` tool and correctly
refused to assert findings as settled. Registering the durable ones is outstanding work.

> **§1 IS NOT WHOLLY CURRENT. THE TYPE-SCALE FINDING WAS WRONG THREE TIMES.** The reading that
> mission-control "has no display band" compared *marketing homepages* to a *dashboard* and was a category
> error — play.grafana.org, a real dashboard, ships `12 14` and nothing else. The replacement rule
> ("adjacent ratios below 1.125") was also wrong: every reference violates it. **The correct diagnosis is in
> §7.1** — every reference builds its UI band on integer steps of +1 or +2, and mission-control uses +0.5.
> **Read §7.1 before citing anything in §1.2 about type scale.** All three wrong versions are kept in place
> rather than deleted, because *which* finding died and *how* is the useful part — and because each wrong
> version was well-formed, which is this repository's named failure mode.

---

## 1 · The causal chain, verified end to end

Seven links. Three independent methods — file reading, adversarial review, external literature — with
no shared context between them.

| # | Link | How verified |
|---|---|---|
| 1 | **No production step instructs anyone to MANUFACTURE the design system** | reading `.claude/lenses.yml` |
| 2 | So it was never manufactured: **29 colour tokens · 0 spacing · 0 type-size** | token census of `mission-control/client/src/styles.css` |
| 3 | The `craft` lens checks *"spacing, type scale and colour"* — **2 of 3 have nothing to measure against** | lens text + census |
| 4 | `designer` is forbidden to invent a rule → should BLOCK constantly → **invented silently instead**: 10 near-duplicate sizes, heading:body ratios of **1.038** and **1.077** | source census across all seven views |
| 5 | Lens procedures are enforced by **nothing** — `lenses.test.mjs` has 20 tests, every one validates file *shape* | reading the test file |
| 6 | So *"check the small-screen rendering"* never ran — and the camera was dead anyway (`SIGTRAP`) | capture attempt, this session |
| 7 | **→ 574px horizontal overflow at 390px · 57 of 64 interactive elements fail WCAG 2.2 AA** | Playwright measurement, live app |

### 1.1 The perception loop had never worked

`designer` is defined as *"the only producing engine with a perception loop — render, look at what
rendered, iterate."* It has run twice (2026-08-17). **Both runs are labelled source-only.** Three capture
attempts photographed **Spotify** — the foreground app — because they used macOS `screencapture`.

**Root cause, found this session:** the armed sandbox `SIGTRAP`-kills Chromium. Capture succeeds with
the sandbox disabled (verified: `CAPTURE OK`, both widths). The binary is present and requireable.

This puts design capture in the same bucket as `git worktree add` and (predicted) any dev-server proxy:
**capabilities that require an unsandboxed escalation lane.** Three of them now.

### 1.2 Measured state of the one substantial design output

`mission-control`, live, real data:

| Measure | 390px | 1440px |
|---|---|---|
| Horizontal overflow | **574px** | 0 |
| Interactive elements | 64 | — |
| Fail WCAG 2.2 AA target size (24×24, SC 2.5.8) | **57 of 64** | — |
| Fail AAA (44×44, SC 2.5.5) | 64 of 64 | — |
| Distinct rendered element heights | **15, 18, 24, 43px** | — |

Nav is clipped after "Belief"; **Inbox and Dispatch are unreachable at any scroll offset**, because the
sticky header stays viewport-width while the table overflows the document. 6 of 9 table columns are
off-screen. The wide-view loading state stops at y≈375 of 900 — traced to `LoadingRows({ rows = 8 })`,
a default with no relationship to the viewport.

**The visual language is genuinely good** — 2 declared weights, disciplined colour, tabular figures,
and a written rationale in `styles.css` that is the best writing in the repository. The product is
simply unusable at mobile width. Both are true at once.

> **A caution recorded because it caught this session's own reviewer.** An early reading of
> "6 font sizes, 2 weights, 5 colours" was reported as *"genuinely disciplined restraint."* The number
> was correct and the conclusion was false: across all seven views there are **10** declared sizes —
> 10/11/11.5/12/12.5/13/13.5/14/15/20. **A distinct-value count cannot distinguish a considered 3-step
> ramp from six accidents.** This error was committed inside the review that was hunting for exactly this
> failure mode. Adding measurement does not fix it.
>
> **Partly superseded 2026-08-29 — and the correction is more interesting than the original.** This
> paragraph originally concluded the ten sizes were "near-duplicates, not a scale". Measured references
> say tight clustering is NORMAL in a UI band: Linear 1.07–1.13, Stripe 1.09–1.17, Vercel 1.09–1.17, and
> play.grafana.org ships **two sizes total**. So the tight steps are not the defect. **What survives is
> the fractional sizes** — 11.5 / 12.5 / 13.5 — which no measured reference uses, which are literally
> authored (`text-[11.5px]`), and which are not a `clamp()` artifact because mission-control contains no
> `clamp()` and no `vw` units. See §6.4.

---

## 2 · Why the apparatus could not see any of it

### 2.1 The design lens is five wishes

`.claude/lenses.yml` is *"how to **produce** work."* The `design` lens has five procedure steps and
**every one is a judging action**: look at the render, evaluate against the system, check the small
screen, express findings as measured differences, name what works. **Not one is a making action.**

Contrast — the same file, other domains:

| Lens | Steps |
|---|---|
| `engineering` | Decompose · classify risk · isolate worktrees · verify the branch · gate the merge |
| `growth` | Read customer language *before drafting a line* · block if none exists · reuse verbatim · name surface/audience/goal · check against voice rules |
| `design` | *(all five are inspection)* |

Its `refuses:` block confirms it — growth refuses *production* errors, design refuses *critique* errors.
`sources:` gives the provenance away: the design lens was rehoused from **`design-critic.md`**. **A
critic's checklist was promoted into the slot where the production procedure belonged, and nobody
noticed because the slot was full.**

Independently, an adversarial review reached the same conclusion by a different route: **"N gates, zero
generators."** `design-orchestration` — the designer's only wired skill — states in its own text:
*"This skill does not generate designs."*

### 2.2 Nothing enforces a lens

`lenses.test.mjs`: 20 tests, all structural — steps aren't vague, ≥3 of them, a `refuses` block exists,
sources resolve, the target engine exists. **No test checks that an agent ever performed a procedure.**

Against `CLAUDE.md`'s own standard — *"a rule enforced only by this sentence is a wish, not a rule"* —
the design lens is `ADVISORY` throughout. That audit was run on the repo's rules table (8 wishes, 0
enforced) and fixed. **It was never run on the lenses.**

### 2.3 The judge cannot see either

Three lenses — `craft`, `voice`, `accessibility` — declare `scope: rendered-output` and block at p1.

```
grep -n mcpServers .claude/agents/*.md
  designer.md:8:mcpServers: [playwright]
  sourcer.md:8:mcpServers: [claim-append]
```

**`reviewer` has no browser grant. `reviewer-readonly` lacks even `Bash`.** Every craft and accessibility
verdict this system has issued is a source review wearing a rendered-output label. `ROSTER-SIZE.md`
specified the grant and gave the reason — *"a judge that cannot obtain its subject is not a judge"* —
and it was never made.

### 2.4 The boundary is executed vs declared, not checkable vs uncheckable

An early hypothesis this session held that design defects are invisible because quality is uncheckable.
**That is wrong and the correction is load-bearing.** 574px of overflow and touch-target geometry are
among the most mechanically checkable properties a UI has — a published audit checked 1,590 sites for
exactly this class using Playwright and deterministic computed-style checks, explicitly *without* an
LLM judging screenshots.

The check was **specified** (design lens, step 3), **lint-clean**, and **never executed**. That is the
repo's existing `ADVISORY` vs `ENFORCED` distinction, applied to lenses for the first time.

### 2.5 `design-mirror` is unwired

`.claude/skills/design-mirror/SKILL.md` — *"Identify the full design system: colors, fonts, **spacing
scale**, border radii, shadows, component patterns"*, extracted from a real reference site. Referenced by
**no agent, no playbook, no lens, no command.**

That is the manufacturing step §1 link 1 says is missing, and it also implements the reference-corpus
method chosen as the taste anchor. The repo already contains a more workable design epistemology than
the one it is using.

---

## 3 · External research — three streams

### 3.1 What is measured to work

| Lever | Effect | Evidence |
|---|---|---|
| **Structured pre-generation specification** | beat self-revision prompting on every rated dimension, p<.001 | 16 professional designers, 3 independent raters (SpecifyUI, arXiv 2509.07334) |
| **Vision critic with external grounding** | **+9.8% to +17.8%**; visual task accomplishment **+26.3%** | 600 WebDev Arena tasks (arXiv 2604.05839) |
| *Unguided self-refinement* | **+1.5%** | same study |
| Verbalized sampling (diversity) | 1.6–2.1×, training-free | arXiv 2510.01171 — **never applied to UI; cheapest untested lever** |

**The grounding does the work, not the loop.**

### 3.2 What has NO measured evidence

- **Reference grounding** (*"make it look like Linear"*) — recommended by Anthropic, Google Labs and every
  community skill collection. **Zero published evaluation.** This is the field's largest evidentiary hole
  and it sits under its most popular answer — and under this repo's chosen taste anchor.
- **`DESIGN.md`-style constraint files** — same: universally recommended, never evaluated.
- **Group design critique** — essentially no experimental evidence it improves outcomes. The closest
  controlled study points the other way.

### 3.3 Findings that constrain any design we choose

- **Mode collapse is real and measured with no system present** — humans given one LLM idea wrote stories
  **+10.7% more similar to each other** (*Science Advances*). Its driver is **typicality bias in preference
  data**: annotators preferring the more familiar. *That is a checking action.* **The model is itself the
  output of a system that only checked** — the same failure as §2.1, one layer down.
- **Judging is mechanistically thinner than producing** — evaluation attends to context **3–5× less** than
  generation, and evaluation fine-tuning **degrades** generation (arXiv 2606.28050).
- **VLM judges cannot reach majority agreement with professional designer panels** (TASTE, arXiv
  2605.20731). An agent grading its own design grades against a rubric that does not match professional
  judgement.
- **Auto-generated multi-agent systems underperform simple approaches at up to 10× cost**; expert-*designed*
  ones did better (arXiv 2606.13003). Shape matters, not count.
- **Nobody is measuring agentic design.** The main design benchmark's *Agentic Web Dev* track had **one**
  entrant.

### 3.4 Human practice — what it corroborates and what it refuses

**Pre-specification is real, and it covers the SYSTEM only.** Refactoring UI ch.1, in order: *choose a
personality · limit your choices · establish a spacing and sizing system · establish a type scale · define
your shades up front.* Every one is a making action with a measurable output a later step consumes.

**Nobody pre-specifies the composition.** Shape Up exists to make a written spec *physically incapable* of
containing the layout: *"a fat marker sketch is a sketch made with such broad strokes that adding detail is
difficult or impossible."*

**Negation is a formal, named design move** — Shape Up's **"No Gos"** is a required pitch section; Rams #10
(*"as little design as possible"*); Jobs (*"focusing is about saying no"*). **The robust implementation bans
via instrument, not via rule: a rule can be violated, a marker width cannot.**

**Crit and review must be separated.** Figma: *"Critiques are intentionally different than formal product
reviews. They are not about making major product decisions."* Merge them and people lobby instead of
critiquing. `design-pass.yml` currently merges them.

**Evidence favours parallel, rough, silent exploration before critique** — production blocking (*"the
inability to generate ideas while listening to others"*) accounts for most of the loss in groups; and
*"with only one option, there is no separation between designer and design."* **Nobody in the corpus
defends "generate three polished directions and pick one."** That ritual has zero named defenders.

**The boundary condition, recorded because it cuts against the above:** pre-spec evidence is strongest for
**novices**; the strongest individual practitioners do it least and say so. **No study has measured expert
humans with vs. without pre-specification.** The defensible version of the claim is therefore narrow: our
generator has no taste to bootstrap from, so it needs the external spec — not "this is how good design is
made."

**The bootstrap problem, which decides where taste enters:** *"you need taste to pick the right curators to
trust... you need taste to judge taste."* **The reference set is itself a taste judgment and no procedure
produces it.** With VLM judges unable to match designer panels (§3.3), the founder's reference corpus and
occasional pairwise ranking are **the only place taste can enter this system.** Everything downstream is
narrowing.

---

## 4 · Open questions — genuinely undecided

1. **Where does the taste bootstrap come from, concretely?** Named corpus + anti-corpus is chosen; it has
   no measured evidence behind it (§3.2) and is still the best available option. Label it reasoned, not
   measured.
2. **Instrument or rule?** Shape Up's fat marker suggests the design layer should constrain by *tool*
   rather than by *lens text*. No instrument of that kind exists here yet.
3. **Does `designer` survive?** `ROSTER-SIZE.md:291` states that keeping it without a working browser grant
   is *"the worst of the three options"* — it is `builder` with a different colour. Either make the grant
   work on the dispatch path, or delete it and retag three lenses `scope: diff-only`. The middle has been
   held since 2026-08-17.
4. **Is the composition step writable at all?** Everything above is narrowing. Nothing in the corpus
   specifies how to *have* the idea, and the author of the most-cited design procedure in software
   disclaims it as a procedure: *"Atomic design is not a linear process, but rather a mental model."*

---

## 5 · Process note — three silent subagent failures

All three research agents completed their work and **returned nothing**. Each reported as *idle/available*,
which is indistinguishable from *reviewed it, found nothing*. All three delivered in full when chased.

**The cause was diagnosed wrongly first.** A documented mechanism (`maxTurns` binds when a dispatch names an
`agentType`; `sourcer` is capped at 25) fit the evidence and was stated confidently. The agent then reported:
*"No turn cap was hit... I ended my turn with plain text output instead of calling SendMessage."* It was a
**delivery** failure, not truncation.

Recorded because it is this repo's named signature — *the failure is silent because the wrong answer is
well-formed* — committed twice in one session **by the orchestrator, while investigating that exact
pattern.** Knowing the pattern by name does not prevent committing it. This is the third consecutive session
in which the orchestrator's own output is the largest defect surface, and it still has no mechanism.

---

## 6 · Deep research, 2026-08-29 — four infrastructure streams

Four adversarial research streams, each briefed to attack our current choice rather than justify it. Seven
craft streams were still running when this section was written. **Load-bearing numbers below were verified
against extracted primary text, not against a summariser** — the Hertzum figures were re-checked in
`hertzum2003.txt` (`pdftotext` output) and match verbatim.

### 6.1 Can design quality be measured? Partially, and the line is precise

**The limit is not model capability. The human signal being approximated is itself mostly noise.**

| Measure | Value | Source |
|---|---|---|
| Designer agreeing with a 5-designer panel majority | **0.741** | TASTE, arXiv 2605.20731 |
| Best of 9 VLM judges (HPSv2.1) | **0.543** | same, 4,320 pairs/system |
| Chance | 0.50 | — |
| Trained in-domain pairwise head | 0.611 | same |
| Any-two evaluator agreement on *which problems exist* | **5%–65%** | Hertzum & Jacobsen 2003, verified |
| Any-two evaluator agreement on *severity* (Spearman) | **0.23 · 0.24 · 0.31** | same, verified |

Off-the-shelf models capture **18% of the available signal**; trained in-domain, 46%. Nothing captures more
than half of a signal that is itself only 74% reliable. *"Not a single problem was unanimously judged as
severe in these two studies"* — verified verbatim.

**THE TRAP, and it is the one this repo is most likely to walk into.** A design-quality judge emitting
PASS/BLOCK would be ~0.54 accurate against a panel that is 0.741 self-consistent. That is not measuring
quality; it is **a biased coin on the merge path** — and per a 541,000-judgment study (arXiv 2606.19544) it
would be **highly reproducible while invalid**, which is the worst failure mode because it looks exactly like
a working mechanism. The correctness gate works because it is oracle-first. **There is no oracle for design
quality.**

> **CONFORMANCE CAN BIND. QUALITY CAN ONLY INFORM.** This is the architectural line.

**The twelve-dimension scoring rubric is evidenced against.** TASTE *is* that experiment — nine criteria,
two disjoint panels of five professional designers, 1,600 ratings per dimension. **Every dimension landed in
the same 0.50–0.55 band; decomposition did not help.** Note the direction: typography (most deterministically
checkable) had the *highest* designer agreement, colour harmony (most purely aesthetic) the *lowest*.
**Agreement tracks checkability.**

**THE ASYMMETRY — the most actionable finding in the whole sweep.** Hertzum's evaluators agreed with each
other 5–17% of the time while each finding 18–60% of the collective problem set. They were not producing
noise; **they were finding different real problems.**

> **Multiple weak judges are excellent FINDERS and useless SCORERS. The union of a panel is valuable; the
> average is nearly meaningless.**

A design panel must return **findings, never a score**. This also explains this repo's own measured result —
three blinded reviewers finding 7 P1s where a 49-agent gate found 3. We had the evidence and not the reason.

**A design agent cannot get a reliable per-iteration reward signal.** Both routes are closed: the judge route
by resolution (UI-Bench's 4,075 expert judgments buy only **three** distinguishable buckets across ten
artifacts; ranks 4–8 are statistically inseparable), and the business route by base rate (Kohavi: ⅓ positive,
⅓ flat, ⅓ **negative**, typical effects 0.1–1%). **So the loop cannot self-terminate on quality, and human
termination is load-bearing rather than a preference.** Max honest resolution is three buckets.

**No validated agent-as-usability-oracle exists.** UXAgent's own authors state agents are not meant to replace
human participants, and their UX researchers disagreed that they could (M = −0.57 on a −2..+2 scale).

### 6.2 Substrate — do not move, change three things

The stream tried to kill Claude Code as the substrate and could not. Nobody credible is on a framework: Uber
and Ramp both built thin orchestration over a coding harness plus sandboxes, which is architecturally our
shape. Uber independently converged on our packaging substrate — a managed registry of 2,500 markdown skills
with automated lint, 20,000+ executions/day.

**But the hardest evidence found anywhere in the sweep is aimed at us.** ETH Zurich (arXiv 2602.11988):
repository context files **do not improve task success and cost >20% more**, across multiple LLMs and agents,
for both AI-generated and developer-committed files. The decisive detail: *"instructions ... are well
followed"* but *"repository overviews ... are not helpful."* That is `CLAUDE.md`'s genre exactly. The parts of
this repo that work are the parts that are **code, not prose** — which the repo concluded independently and
now has an outside study for.

**Anthropic's own multi-agent paper excludes our use case.** The +90.2% headline carries the caveat everyone
omits: *"most coding tasks involve fewer truly parallelizable tasks than research, and LLM agents are not yet
great at coordinating and delegating to other agents in real time"*, plus domains with "many dependencies
between agents". And **80% of the variance is token count**. Read honestly it is evidence *against* fan-out
for write-heavy work.

**Runtime facts that correct our own beliefs:** subagents nest to **depth 3** by default
(`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), concurrency default 20, `maxBudgetUsd` exists and terminates on
spend, and there is a **`Workflow` tool** for fan-out past a handful of agents that we do not use. Checkpoints
persist across sessions. Managed Agents (Apr 2026) provide a durable append-only session log at ~$0.08/session-hour.

**Three changes instead of a migration:** a durable session log; the `Workflow` primitive for real fan-out;
and a second model family reached by calling an external API from inside the gate — which unblocks the three
permanently-`unresolved` judge claims far more cheaply than a framework migration would.

**MAST** (arXiv 2503.13657, 150 annotated traces, κ=0.88): multi-agent failures are **44.2% system design,
32.3% inter-agent misalignment**; *"Unaware of Termination Conditions"* is 12.4% — the mode design work is
most exposed to, and the one our return contracts and QA gate genuinely mitigate.

### 6.3 Perception — the instrument survives; four things about it are wrong

The anti-case against automated visual QA is devastating **against pixel-diffing** and does not touch
deterministic in-page assertion. *"This button's hit target is 31×31px"* does not flake on font rendering,
does not degrade into rubber-stamping, and is true or false independent of taste. Pixel-diffing is out for us
regardless: Playwright's own docs warn rendering varies with OS, headless mode, hardware **and power source**
— battery versus mains changes the result. Visual regression also cannot judge *new* design by construction:
it requires an approved baseline, and new design is 100% change.

**Where our probe is wrong:**

1. **The "no model judgement" rule over-shoots.** It correctly bans *a model scoring a screenshot* (35–38%
   exact agreement with humans, arXiv 2510.08783) but also bans **blinded pairwise comparison**, which is the
   method the literature actually uses. Scoring and ranking are different mechanisms.
2. **We hand-rolled axe-core** — reimplementing versioned rules with worse coverage, no citable rule IDs, and
   WCAG 2's contrast algorithm is known-broken in dark mode, so we inherited a flawed spec *and* added
   implementation risk.
3. **We check where the defects are not.** Deque's own data: focus order **100% manual**, focus visible
   **100%**, meaningful sequence **100%**, keyboard **97.5%** — all top criteria by issue volume, none of
   which we touch. Also missing and fully deterministic: **WCAG 1.4.10 reflow at 320px / 400% zoom**.
4. **Motion is measurable and we assumed it was not.** Verified live: `document.getAnimations()` returned
   **546 animations on linear.app** with duration, easing, delay and iterations readable. Roughly two-thirds
   of Emil Kowalski's own animation-review checklist is static analysis — durations <300ms, animate only
   `transform`/`opacity`, `ease-out` for UI, no `transition: all`, never `scale(0)`, hover gated behind
   `@media (hover: hover)`. *(Caveat: an in-session count of `transition: all` did not gate on duration and
   is therefore unreliable — recorded because it is the same class of error this document catalogues.)*

**The accessibility coverage number is contested and both sides are right:** Deque says **57%** (by issue
*volume*), W3C/Roselli says **31%** (by *Success Criteria*), and Roselli's head-to-head found manual review
caught **7.5× more issues** than the best tool.

**What craft teams actually run:** Shopify Polaris and GitHub Primer run visual regression **on their design
systems** — bounded, enumerable, stable baselines — and Polaris auto-accepts on main. Vercel and Linear
publish their processes and neither contains an automated design gate; Vercel's is *"Slack messages,
screenshots, videos, preview links, and Zoom calls."* **Automated checks on design systems; humans on
products.** Nobody with a craft reputation has published an automated design-quality gate.

### 6.4 References and tokens

**A category error of ours, found and confirmed.** The 2026-08-28 finding that mission-control "has no display
band (max 20px)" compared **marketing homepages** to a **dashboard**. Tested on product surfaces:
docs.stripe.com max 32px, github.com max 64px, and **play.grafana.org — a real dashboard — has a type ramp of
`12 14`, max 14px.** Mission-control has *more* typographic range than Grafana. **That finding is withdrawn.**

**What survives:** the fractional sizes are real and authored. The proposed refutation — that `clamp()`
resolved to arbitrary px — is refuted in turn: **no `clamp()` and no `vw` units exist anywhere in
mission-control**, and the values are literal (`text-[11.5px]`, `text-[12.5px]`, `text-[13.5px]`). Also
accepted: **n=3, maximally correlated** — Linear/Stripe/Vercel are the most-imitated design language in
developer SaaS, so the rule was falsified against the canon, not against the range of legitimate practice.

**Do not build the extractor.** dembrandt and design-extract are MIT, Playwright-based, DTCG-emitting, with
MCP servers; designlang samples 5,000 elements × 25 properties. **What nobody has is the falsification
harness** — holding a stated rule against measured references and letting the measurement kill the rule. That
is on-thesis for this repo and it is what actually produced value here.

**Token format has no real ambiguity: DTCG 2025.10 → Style Dictionary v5 → Tailwind v4 `@theme`.** DTCG
reached first stable version 2025-10-28, backed by 24+ organisations. Note `@theme` is a *consumer* of tokens,
not a token format — authoring there does not travel.

**The composition problem is genuinely open.** SpecifyUI (arXiv 2509.07334) is the closest published work and
its SPEC schema has **no typography and no motion** — the two dimensions we most need — and **no composition
algorithm**: blending references is a manual drag-and-drop step performed by a human, with only a subset
constraint preventing sections from contradicting the global spec. Its buried result matters more than its
headline: SpecifyUI was **slower on initial generation (380s vs 250s)** and designers found the unstructured
baseline "faster to spark inspiration". **Structure costs divergence and buys control — so the extractor
belongs in the convergent phase, not the front of the process.**

**What extraction systematically misses:** one viewport, one state, one theme; computed ≠ authored
(`1.5rem`, `24px`, `var(--space-3)` and a resolved `clamp()` are four decisions with one value); frequency ≠
importance; no primary/secondary distinction; and **near-total blindness to motion** in the static-CSS tools.
Semantic intent is destroyed — extraction recovers `#12B76A` and cannot recover whether it was
`color.feedback.success`.

**Legal posture:** the CFAA is not the risk; the *contract* is. hiQ won on the CFAA and then **lost on breach
of LinkedIn's User Agreement, paid damages and destroyed the data**. Meta v. Bright Data (2024) found
logged-off scraping of public data did not breach terms. **Logged-out, robots-respecting, low-volume reading
of public pages is low risk; logging into a reference library and pulling its corpus is not.** Verified
directly: **godly.website name-blocks `ClaudeBot` with `Disallow: /`**, awwwards disallows `/gallery/`,
land-book and mobbin return 403; linear.app, stripe.com and vercel.com all permitted what we did.

**`refero` is dead for us** — `NO_SUBSCRIPTION`. It was reported as "live" in-session because the tools loaded
and were callable. Tools loading is not capability.

---

## 7 · Visual foundations — the production procedure, and it is writable

Fifth research stream, 2026-08-29. **The central finding was re-derived independently in this worktree
before being recorded here** — see the verification block below.

### 7.1 Type ramps are built by ARITHMETIC INCREMENT, not by modular ratio

For a ramp with constant absolute increment `d` at size `s`, the adjacent ratio is exactly `1 + d/s`. At
`d=2` over 12→20 that gives 1.167, 1.143, 1.125, 1.111, 1.100; at `d=1`, 1.083 down to 1.050. The union is
**[1.05, 1.167]** — which is the 1.07–1.17 band measured on linear.app, stripe.com and vercel.com.

**So the "compressed ratio band" is not a compressed modular scale. It is the arithmetic signature of a
constant +1/+2px step.** A modular scale holds its ratio constant by definition; these visibly decrease.

**VERIFIED HERE, five ramps, `ratio = 1 + d/s` exact to three decimals and monotonically decreasing within
every constant-increment run:**

| Ramp | UI-band increments | Display-band increments |
|---|---|---|
| linear.app | `1 1 1 1 1 1 2` | `6 8 16 16` |
| stripe.com | `1 1 1 1 2 2 2` | `4 4 6 16` |
| vercel.com | `1 2 2 2 2 2 2` | `32 8` |
| play.grafana.org | `2` | *(none — two sizes is the whole ramp)* |
| **mission-control** | **`1 0.5 0.5 0.5 0.5 0.5 0.5 1`** | `5` |

**THE DEFECT, fourth and finally correct version: every reference builds its UI band on integer steps of +1
or +2; mission-control uses +0.5, seven times consecutively.** Its adjacent ratios (1.045 … 1.037) sit
entirely *below* the reference band, which bottoms out at 1.067.

> **This diagnosis was wrong three times before it was right, and every wrong version was well-formed.**
> (1) *"6 sizes = disciplined restraint"* — a distinct-value count cannot see structure. (2) *"near-duplicates,
> adjacent ratios below 1.125"* — an invented rule that all three references violate. (3) *"no display band"* —
> a category error; Grafana has none either. (4) *"+0.5px increments where every reference uses +1 or +2"* —
> correct, and derivable only once the construction rule was known. **The lesson is not that measurement is
> unreliable. It is that a measurement without a construction model produces confident nonsense.**

**The production rule:** build the UI band by absolute increment (+1 or +2 across 12–20px); build the display
band separately, also by increment (+4 to +16); **join them with a jump, never interpolate**; never derive one
band from the other.

Two rules no one writes down that Radix and Tailwind both obey: **line-height is a curve** peaking near
1.5–1.56 at 16–18px and reaching exactly 1.0 at display sizes; **tracking is monotone with size**, positive
below ~14px and increasingly negative above.

### 7.2 Hierarchy — the mechanism set, and which one to reach for

The only source found that answers *which* mechanism rather than listing mechanisms is Erik Kennedy's
**up-pop / down-pop** rule: emphasise on one axis while **restraining on another**, and *"page titles are the
only element to style all-out up-pop."*

**Diagnosis of mission-control: four greys is pure down-pop on a single axis, with zero up-pop anywhere.**

The full mechanism set, assembled across sources — no single source enumerates it: size · weight ·
colour/contrast · case · letter-spacing · whitespace · position · surface · border · fill · shadow ·
optical alignment.

**Radix Colors is the most transplantable artefact found**: a 12-step scale with each step's job assigned —
1–2 app/subtle backgrounds, 3–5 component backgrounds (normal/hover/pressed), 6–8 borders
(subtle/interactive/strong+focus), 9–10 solid fills, 11–12 text. **Mission-control uses 2 of those 12 slots.**
Steps 11 and 12 carry a guaranteed Lc 60 / Lc 90 APCA contrast on a step-2 background.

Also decidable, from Refactoring UI and Ian Storm Taylor: greys get **8–10 shades**; neutrals are **tinted,
with saturation rising from ~2% at the lightest to ~22% at the darkest** — *"the amount of colour you can add
is proportional to how dark the colour is."*

### 7.3 A new capability that landed this month

**`text-box-trim` reached Baseline in August 2026.** It removes half-leading, so `padding: 10px` becomes
optically correct rather than needing per-font asymmetric compensation chosen by eye. Consequence worth
noting: **every spacing token authored before now has hand-tuned optical correction baked into its values.**

### 7.4 Received wisdom that did not survive checking

| Belief | What checking found |
|---|---|
| "Real design systems use modular scales" | Vercel, Radix and Tailwind all build the UI band by constant absolute increment |
| "Modular scales have a mathematical basis" | Their founding web article grounds them in Renaissance aesthetics and says *"modular scales are a tool, they're not magic"* |
| "The 8pt grid is evidence-based" | Its canonical source argues consistency, decision-reduction and screen dimensions — and offers **no study** |
| "NN/g says use no more than 3 sizes" | That article cites **two textbooks and no NN/g research** |
| "Jen Simmons said breakpoints are dead" | She described staged responsiveness needing no media queries. Not the same claim. **Misattribution** |
| "APCA is the new standard" | **It is in no standard.** WCAG 3.0's 2026-03-03 Working Draft specifies no contrast method; APCA's licence is restrictive and self-described early beta — while Radix ships Lc guarantees anyway |
| "Vertical rhythm works with discipline" | Its originating author documented in 2006 that **a 2px border breaks it** |
| "Variable fonts always cut bytes" | The 88% figure is one vendor experiment at 48 styles; Google's own doc says single-weight uses may see no gain |

**Recommended posture on contrast:** APCA as a *design-time instrument* for relative judgement, especially in
dark mode where WCAG 2 is admitted to fail; **WCAG 2 as the compliance artefact**. Do not build a
licence-encumbered beta constant into an enforcement gate.

### 7.5 The residue is three seed judgements

Practitioners conceding limits **against their own interest** — the strongest form of evidence for
irreducibility:

- **Base colour** — Refactoring UI: *"There's no real scientific way to do this"*; *"You can't rely purely on math."*
- **The ratio or increment** — Tim Brown: *"Math is no substitute for an experienced designer's eye, but it can provide both hints and constraints."*
- **Brand adjectives → typeface** — Kennedy's steps 1–2 carry no observable criterion; step 3 (x-height, open counters) is the first that does.

**Everything downstream is stated procedure in at least one primary source**: the full ramp from the base, the
12-step role assignment, the line-height curve, the tracking curve, the two-band split, the up-pop/down-pop
pairing, the neutral-tinting function, the spacing scale.

> **This is the answer to §4's open question 4.** The production procedure IS writable, and it takes **three
> human seeds as input**. That is a far smaller and more tractable artefact than "encode design taste" — and
> it is the shape §3.4 predicted: strong practice pre-specifies the SYSTEM and never the COMPOSITION.

**Ordering note worth keeping:** Butterick ranks the four decisions that determine typographic quality as
**(1) point size, (2) line spacing, (3) line length, (4) font choice — font is LAST.** Kennedy's Rule 2 is
*"design black and white first; add colour last, and even then only with purpose"* — an ordering rule that
would have caught the four-greys failure on the first pass, because greyscale hierarchy forces
size/weight/space/containment rather than hue.

---

## 8 · Upstream — brief, references, IA, fidelity, handoff

Sixth stream, 2026-08-29.

### 8.1 The system/composition line has a name, and two orthogonal halves

**Style Tiles** (Samantha Warren, ~2012) — *"for when a moodboard is too vague and a comp is too literal"*; they
establish *"a direct connection with actual interface elements **without defining layout**"* and *"don't imply
dimensions nor device."*

**Shape Up breadboards** — the same line mirrored: structure fully specified, visual entirely absent.
*"We'll use words for everything instead of pictures."* Places / Affordances / Connection lines.

**Two pre-specs, orthogonal axes, and composition is precisely the intersection both deliberately leave
open. No source found pre-specifies composition and defends it.** This corroborates §3.4 from an independent
direction.

Warren also lands on the three-directions ritual: *"An interior designer doesn't design three different rooms
for a client at the first kick-off meeting, so why do Web designers design three different webpage mockups?"*

### 8.2 No agency publishes a brief template

Checked directly: Pentagram, Wolff Olins, Koto, Instrument, Basic/DEPT, Metalab — **none publishes an intake
method or question order.** The APG's "Tips & Tools" is personal-habit anecdotes, not a standard.

**The only published, respected format is Shape Up's pitch:** Problem · Appetite · Solution · Rabbit Holes ·
**No-gos** (*"anything specifically excluded... functionality or use cases we intentionally aren't
covering"*). The No-gos field is the one most briefs lack, and it is the negation move §3.4 found is formally
institutionalised.

Instrument, arguing *against* briefs, gives the best definition of what one is for: *"A brief does more than
define a problem. It creates accountability. It gives a team direction, deadlines, and a reason to follow
through."* Three functions — direction, boundary, accountability — and **only the first is about design.**

### 8.3 The composition method, from a practitioner

Dan Mall, *Stealing Your Way to Original Designs* — the answer to "one reference has the visual language,
another the motion":

- **Per-element sourcing, never per-page:** *"Rather than try to use a whole page as a reference, I'll pick a
  few different designs to source different elements from."*
- Ladder: **Imitate → Remix → Invent**
- Choose sources **distant from the category** — explicitly avoid competitors
- Then systematically alter colour, typeface, orientation and treatment until each borrowed element is
  unrecognisable

His originality claim — more and obscurer sources yields more originality — is **asserted, never tested.**
The per-element rule is the mechanism that stops multi-reference blending from producing pastiche.

**A conflation worth avoiding:** NN/g warns mood boards are *"about the visuals, not about the features"* and
that product screenshots risk *"prematurely focusing on specific outcomes."* Mall's method is built on lifting
elements from other products. Both are right — they are **two different activities that both get called
moodboarding**, and merging them is a real failure mode.

### 8.4 Feedback: ask bounded questions, not open ones

The most transplantable technique found anywhere in the sweep. Mall: put **the three specific things you want
feedback on** as both the first and last slide. Not *"what do you think?"* but *"Do the colours communicate
trust?"*, *"Does the layout make it look easy to subscribe?"*

Mechanism: *"having specific questions implies that some comments are 'in-bounds' and others are
'out-of-bounds'."* And the reframe: *"treat it like a usability test. Don't ask what people like; uncover what
they can or can't do."*

Supported by Nielsen: stated preference correlates with measured performance at **0.44 (PC apps) / 0.53
(websites)** — *"you can only predict about a quarter of how well a design works from knowing how much users
say they like it."* Underlying mechanism is Nisbett & Wilson 1977 (11,362 citations, not read this session).

### 8.5 FIDELITY — a correction to this repository's own briefing

**The orchestrator asserted, in a research brief, that the fidelity literature shows "fidelity affects the
KIND of feedback." The named paper says the opposite.**

Walker, Takayama & Landay (2002), HFES 46(5): *"low- and high-fidelity prototypes are equally good at
uncovering usability issues"*, and results were *"independent of medium."* **A null result on both axes.**
Conclusion: *"Designers should choose whichever medium and level of fidelity suit their practical needs."*

**The distinction that matters, and it was missed the first time:** the fidelity literature answers a
**TESTING** question (which artifact surfaces more usability problems). Shape Up's anti-wireframe argument is
a **SPECIFICATION** question (*"we'll get stuck on unnecessary details"*). **They do not meet.** What the null
result establishes is that *nothing is lost in evaluation quality by skipping low-fi* — removing the usual
counter-argument to Shape Up without confirming its reasoning.

**And the parallel-prototyping evidence is weaker than this repository has been treating it.** Dow et al.
(2010) and Tohidi et al. (2006) — the two papers most load-bearing for a "generate alternatives" stage —
**were both unreachable to two separate research streams.** Every citation of them here and in §3.4 runs
through secondaries with **sample sizes and effect sizes unknown**. Treat the direction as plausible and every
number as uncited.

### 8.6 Received wisdom that did not survive checking

| Belief | What checking found |
|---|---|
| "Low-fi gets better/more honest feedback" | The best-known study found **no difference**, on fidelity *and* medium |
| "15 users is enough for a card sort" | Traces to a **single 2004 conference talk**, one org, one dataset, unreplicated |
| Tree testing as validation | NN/g's own page cites **no evidence or benchmarks whatsoever** |
| ODI's "86% success rate, 5× industry average" | **n=21**, self-rated by the sponsoring companies, vendor-published, no control |
| Product Reaction Cards' "118 words, 60/40" | Repeated everywhere; **no primary source reachable** |
| "Handoff is a defect" (Vercel, Mall, Frost) | All three **argue**; none measures |

---

## 9 · Motion — and two verified defects in our own skills library

Seventh stream, 2026-08-29. **Both repo-facing claims were verified here against shipped source.**

### 9.1 Two skills carry values that shipped code contradicts

| Our skill | Shipped source |
|---|---|
| `emilkowal-animations`: **`0.11 px/ms`** velocity threshold, attributed to Emil Kowalski | `vaul/src/constants.ts`: **`VELOCITY_THRESHOLD = 0.4`** — 3.6× off |
| `12-principles-of-animation`: `timing-under-300ms`, *"Exit animation 400ms exceeds 300ms limit"*, **HIGH severity** | Carbon **`slow01` = 400ms**, **`slow02` = 700ms**; Vaul ships **500ms**; Material runs to **1000ms** |

**The skill named after Emil Kowalski would fail his own most-used component.** The 300ms figure is a
heuristic for *small, local, frequently-repeated* transitions, encoded as a universal hard fail — a rule whose
predicate cannot tell a drawer from a dropdown. **Third instance of the `PS-BODY-VAGUE` class this session,
and the first one located in the skills library rather than the lenses.**

### 9.2 Motion conformance is gate-able. Motion quality is not.

**Checkable deterministically today** — `document.getAnimations()` is **Baseline since September 2020** and
covers CSS animations, transitions and Web Animations alike; the CDP `Animation` domain exposes per-element
`duration`, `delay`, `easing`, `iterations`, `fill`, `keyframesRule`; Chrome's Performance panel already flags
non-composited animations **with the reason**. So *"the declared token is the token that ran, and it ran on the
compositor"* is a binding check.

**Not checkable by anyone** — whether the motion is good. A GitHub search for motion-quality testing returned
repos with 1, 1 and 0 stars, the third being a demo of *how to disable* animations.

**The industry's position is explicit and damning.** Playwright's `screenshot({animations: 'disabled'})`
fast-forwards finite animations to completion; Chromatic *"pause[s] CSS animations at the end of their
animation cycle"* by default. **Both dominant visual-QA tools delete motion so a static assertion can pass.**

**One hard hole:** `requestAnimationFrame`-driven animations — much of GSAP, every custom spring loop — are
invisible to `getAnimations()` and to the Animations panel. **The animations most likely to be badly tuned are
the least introspectable.** A concrete argument for preferring libraries that use WAAPI.

### 9.3 The anti-case, from motion's leading advocate

Emil Kowalski: *"I use Raycast hundreds of times a day. If it animated every time I opened it, it would be
very annoying... Sometimes the best animation is no animation."* **The structure is frequency, not taste** —
an animation's value divides by how often it is seen, so a once-per-session transition and a once-per-second
one are not the same object.

**The cost argument is stronger than any aesthetic one:** motion spends from budgets built to catch
*slowness* — Miller's 1-second flow-of-thought limit, INP's 200ms threshold, LoAF's 50ms. **An animation is
latency you chose.**

### 9.4 Accessibility corrections

- **WCAG 2.2 SC 2.3.3 (Animation from Interactions) is Level AAA, not AA** — most compliance programmes stop
  at AA and do not require it. Auto-starting motion is a different criterion, **SC 2.2.2, Level A**.
- **The universal `animation-duration: 0.01ms !important` reset is wrong.** It kills loading indicators and
  state-change feedback, which are themselves accessibility aids. The correct move is **substitution** — swap
  a bounce for a fade *"while maintaining the same duration and easing."*
- WebKit's six harm categories are the real taxonomy: scaling/zooming · spinning/vortex · multi-speed or
  multi-directional (parallax) · dimensionality · **peripheral motion** · animated blurring.
- **JS animations do not respond to the media query on their own** — CSS-only reduced-motion handling silently
  misses every Framer Motion / GSAP animation on the page.

### 9.5 Scroll-driven animation is not Baseline

`animation-timeline` — Chrome/Edge 115, Safari 26, **Firefox not shipped in stable**. MDN: *"Limited
availability — not Baseline."* Chrome's own doc claims Safari 16 and **contradicts MDN's compat data**; the
compat data is the more reliable artifact. GSAP ScrollTrigger remains required for pinning, smoothed scrub,
velocity-aware snapping and lifecycle callbacks — CSS has no equivalent for any of the four.

### 9.6 Every motion number in every design system traces to craft consensus, not measurement

NN/g's 100–500ms range cites no peer-reviewed research and gestures at *"a century's experience with animated
cartoons."* Material's 16-step duration scale, Carbon's two-mode system and Apple's spring presets are all
published without supporting studies. **Recorded so that nobody in this repository cites a millisecond figure
as evidence.**

---

## 10 · Design systems — ours is Tailwind's shape, not an original failure

Eighth stream. **A repo-facing claim was checked here and is WRONG on provenance, and the correction matters.**

**Claimed:** our 29-colour/0-spacing/0-type system *is* the shadcn/ui default (28 colour vars + radius, "no spacing or typography tokens in the core theming system").

**Checked:** mission-control has **no shadcn, no Radix, no cva, no tailwind-merge** — deps are hono/react/tailwind/vite — and its token names are bespoke (`--color-ink`, not `--background`). **Not shadcn.**

**But the shape convergence is real, and the mechanism is Tailwind itself.** You author colour because Tailwind gives you none; you inherit spacing and type because Tailwind gives you both. **The tool shapes the system.**

### 10.1 TWO LINKS OF §1's CAUSAL CHAIN ARE WITHDRAWN

Measured here: **136 Tailwind scale spacing utilities vs 2 arbitrary values** (both `7px`).

| Axis | §1 said | Measured | Status |
|---|---|---|---|
| Spacing | "0 tokens → nothing to measure against" | **136/138 on Tailwind's 4px scale** | **WITHDRAWN — the system exists, inherited** |
| Type | same | **9 arbitrary `text-[Npx]` values**, bypassing Tailwind's scale | **SURVIVES** |

**The team kept Tailwind's spacing scale and abandoned its type scale.** That is a deliberate opt-out and it is exactly why the ramp drifted to +0.5px increments (§7.1) — they left the only scale they had. The token census was accurate; the *inference* from it was wrong. **Third self-correction in this document.**

### 10.2 What the evidence says about design systems generally

- **Only 5% of design system teams measure ROI** (zeroheight 2026, n=147, **vendor-published** — but a vendor with an ROI calculator reporting 5% is evidence against its own interest). 7% report full adoption; 61% report insufficient staffing.
- **NN/g's "Design Systems 101" makes five benefit claims and cites no empirical research for any of them.** There is no academic literature measuring design systems' effect on development.
- **Frost concedes the ceiling-lowering outright:** *"The job of the design system team is not to innovate, but to curate."* So it is the mechanism working, not a defect — provided there is a named place where the ceiling may be higher (his "recipe layer").
- **Amy Hupe on contribution:** structurally doomed on *incentives*, not process — the system team gains more power building infrastructure than enabling contributors, and only already-privileged people can afford to contribute.
- **Homogenization predates shadcn.** Goree et al., CHI 2021: designs significantly more similar since 2007, average layout distance down **>30%**, cause named as shared code libraries generically. **Layout convergence is most of perceived sameness; colour tokens are not where it lives** — which is another argument that our type/layout vocabulary matters more than our palette.
- **Substrate half-life ≈ 5 years:** Polaris React archived, Uber Base Web on "limited engagement", shadcn swapped Radix → Base UI (July 2026).
- **DTCG has two stable modules**, and reading only one misleads: the **Format** module carries no theming, and **theming lives in the separate Resolver module** (Set / Modifier / Permutation / Resolution Order).

### 10.3 What a design system should be when the consumer is an agent

Four artifacts, in descending value — and only the first two are scarce:

1. **Machine-checkable constraints.** Adobe's `spectrum-design-data` is the only one doing it properly: JSON schemas over component APIs plus a validation `rules.yaml`, with the naming taxonomy versioned separately from values. **An agent that can validate its output does not need a component to copy.**
2. **A verification loop, not a bigger prompt.** Storybook's MCP has agents run interaction *and accessibility* tests and fix their own failures. Their framing of the problem: *"much of it is unmergable slop: wrong props, bogus states, and render errors."* **This is the only mechanism in the landscape that closes the loop** — and it is precisely this repo's own thesis about mechanisms versus wishes.
3. **Tokens as structured data with explicit `$token` references** — DTCG Format + Resolver. Kaelig's field report: token extraction is reliable from structured data and unreliable from design-tool introspection.
4. **A cheap index plus retrievable detail** — `llms.txt` + per-page `.md` + version/filter params. **Structurally identical to the two-tier cure this repo already applied to skills discovery and `session-start.js`. Same disease, same cure, third instance.** Note the index file is contested (Astro removed theirs); the `.md` mirror and MCP server are not.

Base UI's `llms.txt` shows a fifth possibility nobody has explored: **the artifact can carry behavioural instructions to the agent**, not just facts — *"If `package.json` uses Tailwind CSS v3, automatically convert unsupported styles."*

---

## 11 · Domain UX — and the finding that should shape the whole system

Ninth stream.

**The only hard law in the field:** the Cleveland & McGill encoding hierarchy — position beats length beats angle/area beats colour — **replicated by Heer & Bostock 26 years later under a different method.** Everything else is heuristic with a confidence level.

### 11.1 AI interfaces — the objective is CALIBRATED trust, not maximal trust

Lee & See (4,030 citations): *"automation is often problematic because people fail to rely upon it appropriately."* **Anyone designing an AI surface to maximise confidence is optimising the wrong variable.**

**The central design tension, measured:** Buçinca et al. (n=199) — cognitive forcing functions *significantly reduced overreliance* versus explanations, **and participants rated those interventions LESS favourably.** The interaction that produces better decisions is the one users dislike. No product has resolved this.

**And the signal you would need to display is being trained out of the model.** Kalai et al.: models hallucinate because *"training and evaluation procedures reward guessing over acknowledging uncertainty"*; they name an *"epidemic of penalizing uncertain responses."*

Measured in the wild — Tow Center, 8 generative search tools, 1,600 queries: **>60% incorrect**, *"presented inaccurate answers with alarming confidence"*, and **premium tiers were worse** on this axis, giving *"definitive, but wrong, answers."* **Citations are an affordance for verification, not evidence of accuracy** — presenting them as the latter is the most common trust-calibration failure in AI products.

**The perception gap.** METR RCT: 16 experienced developers, 246 real issues from their own repos — **19% SLOWER with AI**, having forecast a 24% speedup, and **still believing afterwards that they were 20% faster.** Corroborated by Stack Overflow 2025 (n=48,945): the top frustration for **66%** is *"AI solutions that are almost right, but not quite"*, and **45.2%** say debugging AI code takes longer.

> **The dangerous output is not the wrong answer. It is the nearly-right one** — it passes casual inspection and costs more to repair than to have written. **UI that optimises for fluent, confident, complete-looking output optimises directly for that failure.** This is the strongest available argument for diff-first, verification-first agent interfaces.

Converged conventions worth knowing: session + typed activity stream (Linear's Thought / Action / Response / Elicitation / Error, first Thought within 10s) · inspectable tool surfaces · **boundary-queued steering** (Cursor: *"Follow-up messages wait for next tool call rather than interrupting"*) · diff/PR as the review artifact · explicit stopping conditions.

### 11.2 Conversion, onboarding, commerce — mostly folklore

**The base rate that invalidates most CRO content** (Kohavi, KDD 2013): *"Only one third of the ideas tested at Microsoft improved the metric(s) they were designed to improve."* Google ~10% led to changes; Netflix considers **90%** of what they try wrong. GoodUI's public tally of 641 tests: 166 winning · **284 insignificant positive · 146 insignificant negative** · 43 losing.

Named as marketing-masquerading-as-research: **the "$300 million button"** (unnamed retailer, no N, no method, 2009 blog post — the recommendation is right, the evidence is an anecdote) · **"aha moment" thresholds** (vendor content citing other blog posts; correlational findings presented as causal) · **Baymard's "35% uplift available"** (modelled from benchmark scores, not measured) · **social proof as a general multiplier** (the flagship hotel-towel paradigm **failed to beat a plain appeal at N=724**) · **the three-tier pricing decoy** (attraction effect's boundary conditions contested) · **the tricolour thumb-zone heat map** (an illustrative diagram that acquired the authority of measurement; Hoober's underlying grip data — 49% one-handed — is real).

**What is evidenced:** endowed progress and the goal gradient (both replicated, both field-tested) · empty states beat tours · guest checkout · WCAG 2.5.8's 24×24 floor **with its spacing exception** · Parhi et al.'s 9.2mm thumb target, which is where 44pt/48dp came from.

**Legal status changed recently enough that stale guidance is wrong:** the FTC click-to-cancel rule was **vacated on procedure, not substance** (8th Cir. 2025), the FTC is actively rebuilding it (ANPRM March 2026), and **EU DSA Article 25 independently prohibits** making cancellation *"substantially more burdensome than the subscription process."* Also: Mathur et al. found **22 third-party vendors selling dark patterns as turnkey products** — most are not designed, they are **installed**. The countermeasure is procurement review, not design review.

### 11.3 The architectural instruction

> **Encode the EVIDENCE TIER, not the tactic** — replicated experiment / single study / large qualitative corpus / vendor claim / anecdote. That distinction separates good from mediocre far more than any individual pattern, and it is the one thing a design system can carry that a pattern library cannot.

---

## 12 · Content design — the voice lens is unsatisfiable, not strict

Tenth stream.

`USER-INSIGHTS.md` is **18 lines, every one a heading or comment. Zero data.** The `voice` lens blocks at **p1** on *"at least one phrase drawn verbatim from captured customer language."* That is not a strict gate; it is an **undefined** one — this harness has no users whose words could be captured. And the file states a *second*, unenforceable copy of the same rule in prose (*"CMO will block any copy/positioning task until research populates it"*). **One rule, two notations, no mechanism — a third instance of the failure the rules table exists to stop.**

**The fix is native:** require every customer-sounding phrase to declare a **source tier** — interview · support ticket · sales call · product review · competitor review · analytics · **assumption** — where `assumption` **passes but stays visible**. That is the `block` / `would_block` distinction already running here. **Precedent: GOV.UK requires evidence and then enumerates what counts — analytics, call-centre data, prior research, third-party data. Not one is a customer interview.** They gate on *provenance*, not primary contact.

**Our banned-word list checks the wrong signature.** *leverage / unlock / seamless / robust / best-in-class / synergy* are 2015 marketing buzzwords — GOV.UK bans most of them as **government jargon**. The **measured** AI tell (Kobak et al., *Science Advances*, 15M PubMed abstracts, ≥13.5% of 2024 abstracts LLM-processed) is *delve, underscore, pivotal, intricate, tapestry, testament, showcase, boasts, garner* — **plus the structural tells, which matter more**: negative parallelism (*"not just X, but Y"*), the rule of three, and **copula avoidance** (*"serves as," "stands as," "represents"* — a measured **>10% drop in "is"/"are"** in 2023 academic writing).

**Never gate on a detector.** They systematically misclassify **non-native English writers** as AI-generated. That is a fairness failure, not an accuracy one.

**Optimise for trustworthiness, not friendliness** — NN/g: trust explains **52%** of desirability variance, friendliness **8%**, and the humour condition *backfired* (friendlier, less trusted, no lift in recommendation).

The transferable artifact is **Podmajersky's voice chart** — Concepts / Vocabulary / Verbosity / Grammar / Punctuation × your principles. Every cell is a rule at the level a writer decides at. **Adjective lists emit no decisions.** And **do not build a positioning statement** — Dunford demolishes her own field's template: *"an awkward franken-statement of gobbledygook"* that *"gives you the false sense that you are 'done'."*

**Localisation is cheap now, structural later:** strings ≤10 chars expand **200–300%** — buttons and labels are the worst case. Pseudo-localisation (`en-XA`, `ar-XB`) catches hardcoded strings, expansion, concatenation and RTL mirroring **with zero translators**. Logical properties (`margin-inline-start`) cost nothing on day one and are a codebase-wide sweep to retrofit.

---

## 13 · Generative assets — and the finding that decides the container

Eleventh stream. **The founder deferred the asset grant on 2026-08-29. The evidence says that was right, and for a reason nobody raised at the time.**

### 13.1 The decisive constraint is legal, not aesthetic

**In the US, purely AI-generated output is not copyrightable.** *Thaler v. Perlmutter* (D.C. Cir., 18 Mar 2025), **cert denied March 2026** — settled law. The Copyright Office: *"prompts may reflect a user's mental conception or idea, but they do not control the way that idea is expressed"*; sweat-of-the-brow explicitly rejected; **"standalone AI outputs cannot be copyrighted, leaving them free for competitors to copy."**

**A brand asset a competitor may legally copy pixel-for-pixel is a weak brand asset.** For anything meant to function as ownable brand equity, this is close to disqualifying. (Trademark still protects marks in commerce, and human *selection and arrangement* may be protectable — the asset itself is not.)

### 13.2 Cost is not the constraint, and the gap is a trap

40 finished assets at 8–15 generations per keeper: **$4–$7** (FLUX.2 dev) to **$68–$127** (GPT Image 2). Commissioned: **$8,000–$80,000**.

**Three to four orders of magnitude, and it is a trap.** What commissioning buys is a *defined visual grammar*, an *owner*, *phased iteration with testing between phases*, and a *copyrightable result*. Slack's illustration library needed all four. **Generation supplies none of them** — it supplies pixels, and moves the entire cost into art direction, selection labour and legal review, none of which appears on the invoice.

### 13.3 The generic tell has a peer-reviewed mechanism, and it is two-stage

**The Algorithmic Gaze** (FAccT 2026) audits the LAION-Aesthetics Predictor used to curate training data: across **330,000 artworks** it scores highest for *"realistic images of landscapes, cityscapes, and portraits from western and Japanese artists"*, and its own training scores came *"primarily from English-speaking photographers and western AI-enthusiasts."*

**So: curation narrows the data, then preference alignment narrows the sampling.** "Preference Mode Collapse" (CVPR 2026) and **diversity collapse** are named, active 2026 research problems — and **none of the inference-time fixes is exposed in any commercial API. You cannot buy diversity restoration today.**

### 13.4 Set coherence has no instrument

Every consistency metric (CLIP-I, DINO, CSD, CLIP-T) measures **similarity-to-a-reference**, not *"does this set read as one brand."* **No benchmark measures set-level brand coherence**, and no independent test of vendor style-reference features across a multi-asset set exists. Midjourney's own docs call the multi-reference case *"somewhat untested"* — the vendor conceding the brand case is uncharacterised.

**And the best tool is not agent-accessible:** Midjourney has no public API and prohibits third-party wrappers. The API-reachable models are the ones weaker at style adherence.

### 13.5 Icons are the clearest "do not generate"

Vector systems need pixel-grid alignment, optical correction and stroke consistency at 16px. Raster diffusion reasons about none of it; text-to-SVG is research-stage and SVGDreamer's own abstract names *"low sample diversity."* Lucide's published spec is the transplantable artifact: 24×24 canvas, 2px centred strokes, ≥1px padding, 2px element spacing, 2px corner radius above 8px, **optical centring by centre of gravity**, and the precedence rule that *technical rules outrank within-group uniformity*.

**Slack's illustration consistency comes from governance, not style:** a modular component grammar, a named owner, three phased iterations with testing between each, and a quarterly review ritual. **None of those four is a generation problem.**

### 13.6 The alternative, argued

**Code-native visuals are the exact inverse failure profile:** deterministic (no selection labour), parametric (rebrand by changing tokens), weightless, theme-aware for free, agent-*writable* — an agent can author CSS/SVG and see it render — and **copyrightable, because a human authored them in code.**

Other provenance controls are weaker than assumed: **C2PA fails its own stated security goals** per the first independent formal analysis (arXiv 2604.24890), and Google's **SynthID watermarks all Nano Banana output**, with a *visible* sparkle below the AI Ultra tier — a straightforward disqualifier for brand hero assets.

**Honest on the trust question:** the claim that AI imagery destroys trust is **not established** — the best-powered study (n=900, Ehrenberg-Bass) found **no performance penalty from AI disclosure**. What is better supported is narrower: AI-labelled work loses on *perceived authenticity and meaning*, which matters most where the brand's promise is craft.

### 13.7 A method finding that bears on the whole system

The stream reports that **the searchable web on this topic is dominated by AI-generated SEO content with fabricated numbers** — one page asserted an Elo of 1512/+242 where the actual leaderboard reads 1370/+18. **An agent with credentials and a research loop would be researching into that contaminated layer.** Primary-source discipline is not a nicety for a `sourcer` engine; it is the difference between research and laundering.

---

## 14 · Synthesis — what eleven streams settled

### 14.1 Why design was the weakest output

**Not taste. The production procedure was never written — only the checking procedure.** Reached three
independent ways with no shared context: reading `lenses.yml` (§2.1), an adversarial review arriving at
*"N gates, zero generators"* (§2.1), and mechanistic interpretability showing judging **attends to context
3–5× less** than generating, with evaluation fine-tuning **degrading** generation (§6.2).

**And it is writable.** The irreducible residue is **three seed judgements** — base colour, increment
choice, brand adjectives (§7.5). Everything downstream is stated procedure in a primary source. That is a
far smaller artefact than "encode design taste", and it is the shape practitioner research independently
predicted: **pre-specify the SYSTEM, never the COMPOSITION** (§3.4, §8.1).

### 14.2 The line that governs everything

> **CONFORMANCE CAN BIND. QUALITY CAN ONLY INFORM.**

Human-to-human ceiling on design preference: **0.741**. Best of nine VLM judges: **0.543**. Chance: 0.50.
Models capture **18% of the available signal** (§6.1). A PASS/BLOCK design judge would be a biased coin that
is *highly reproducible while invalid* — the worst failure mode, because it looks like a working mechanism.

**Corollary, and the most actionable finding in the sweep:** evaluators agree with each other 5–17% of the
time while each finds 18–60% of the real problems. **Weak judges are excellent FINDERS and useless SCORERS.**
Union, never average. A design panel returns **findings, never a score** (§6.1).

**Corollary two:** there is **no per-iteration reward signal** — the judge route is closed by resolution, the
business route by base rates. **Human termination is load-bearing, and that is now measured rather than
asserted** (§6.1).

### 14.3 What to encode

**The evidence tier, not the tactic** (§11.3): replicated experiment / single study / large qualitative
corpus / vendor claim / anecdote. This sweep found the field's load-bearing claims are routinely anecdotes
with citations attached — the $300M button, the aha moment, the thumb-zone heat map, the 8pt grid, "15 users
for a card sort", NN/g's "no more than 3 sizes", ODI's 86%, StoryBrand. **A design system that carries the
tier outperforms one that carries more patterns.**

### 14.4 The self-correction record

Eleven findings were produced and then falsified *inside this investigation*, most of them the
orchestrator's: the 12→8 agent architecture · N-directions-with-a-distance-metric · the flat 1.125 type
ratio rule · the "no model judgement" ban (it wrongly caught blinded pairwise, the one method that works) ·
"no display band" · the `maxTurns` diagnosis of silent agents · "0 spacing tokens" · "44px is the minimum" ·
"6 sizes = restraint" · "not primarily mode collapse" · and a fidelity claim asserted in a research brief
that the cited paper contradicts.

**Every one was well-formed.** That is this repository's named signature, and the rate at which it recurred
here — under active watch, by the person who had just written the warning — is the strongest argument in this
document for mechanisms over intentions.

### 14.5 Open, and owned by the founder

1. **The `reviewer` browser grant** — three p1 lenses declare `scope: rendered-output` and the judge cannot
   render (§2.3). `irreversible` tier.
2. **The reference corpus** — the research established it is the **only** route by which taste enters this
   system (§3.4, §6.1). No procedure produces it.
3. **Whether the design probe becomes a CI step** — requires a workflow edit, `irreversible` tier.
4. **Whether the asset container is ever granted** — deferred 2026-08-29, and §13.1 supplies a ground nobody
   raised at the time: purely AI-generated output is **not copyrightable** in the US.

---

## 15 · Corrections and new findings — 2026-08-29, planning session

Eight items. Five correct something above; three are new. **Every one was measured in this worktree at
`4ddc5c6`, not recalled.** The pattern the document already names held again: most of what follows was
found while trying to *build on* a finding above, not while auditing it.

### 15.1 Two figures in §1 do not reconcile — flagged, not asserted wrong

| §1 says | Measured 2026-08-29 |
|---|---|
| "29 colour tokens" | **12** declared `--color-*` · **14** `@theme` entries · **23** distinct colour utility classes |
| §2.2: "`lenses.test.mjs`: 20 tests, every one validates file shape" | **31 tests**, and at least two are content tests, not shape |

Neither is called wrong here, because the original derivation is not recorded and 29 may have counted
something legitimate. **They are marked re-derive-before-citing**, which is the standard this file is
held to. On the second: test 1 lints the *shipped* lens files and test 25 checks that every lens marked
`independent` actually is, against the live file — those are content assertions. **The load-bearing half
of §2.2 survives untouched: no test checks that an agent ever performed a procedure.**

### 15.2 A third type defect, and nobody had named it

`leading-relaxed` — a **constant 1.625** — is applied **27 times** across sizes 10–15px. `tracking-*`
utilities: **zero**. §7.1's rule is that line-height is a **curve** peaking near 1.5–1.56 at 16–18px,
and that tracking is monotone with size, positive below ~14px.

At 12px, 1.625 produces a **19.5px line box** — in a dense nine-column operational table.

**So the type defect is three-dimensional, not one:** size increments (§7.1), the line-height curve, and
tracking. All three are deterministic and all three have a stated production rule in a primary source.
This was found while verifying §7.1, not while looking for it.

### 15.3 THE CRAFT LENS REACHES NOTHING. This supersedes §2.3's diagnosis.

§2.3 concluded that `reviewer` has no browser grant, so *"every craft and accessibility verdict this
system has issued is a source review wearing a rendered-output label."* **That is true and it is not the
deepest version of the problem.**

`review(lens=craft)` and `review(lens=accessibility)` in `design-pass.yml` resolve at **lint** time and
execute **nowhere**. `.claude/workflows/qa.js:407-413` carries five hardcoded dimensions —
`correctness · security · patterns · tests · perf`. **Craft, accessibility and voice are not among
them.** `qa.js` does not read `review-lenses.yml` at all, and `blocking_severities` is read by nothing
outside the linter.

> **The judge does not lack a camera. There is no judge.**

Confirmed by exhaustive grep of `origin/main` across `*.js *.mjs *.ts`: **no code path loads a lens's
`procedure:` or a playbook's stages and acts on them.** The only readers are `schema-lint.js` (lint),
`session-start.js` (an index row), `check-gates.mjs` (lint plus a manual `resolve`), and
`consume-dispatch.ts`, which lists playbook *filenames* and never opens one.

**Consequence, and it simplifies the architecture rather than complicating it.** The only things that
bind in this repository are `npm run check` steps and `qa-lead-pass.yml`. **Design conformance can
therefore bind by being a test, and by nothing else.** Which is where §6.1's line was pointing anyway.

### 15.4 An impossible remedy in the linter

`.claude/hooks/schema-lint.js:1666-1667`. The message reads *"blocking_severities is required — a lens
that blocks nothing is advisory, **say so explicitly with an empty list**"*, and the predicate is
`l.blocking_severities.length === 0`. **The empty list it instructs you to write is exactly what it
refuses.** There is currently no way to express an advisory review lens.

Same class as the `gate:` spelling-allowlist defect that `.claude/gates.yml` was written to close, and
as the `PS-BODY-VAGUE` rule whose own message admitted it could not judge. **Third instance.**

### 15.5 `DESIGNER.md` §8.4's argument against the browser grant is STALE

§8.4 (2026-08-14) argues an MCP grant *"lands outside every guard in this repository"*, on the evidence
that the `PreToolUse` matcher is `Bash|Edit|Write|NotebookEdit` and `grep -c "mcp__"
.claude/hooks/pre-tool-use.sh` returns **0**.

Measured 2026-08-29: the matcher is **`Bash|Edit|Write|NotebookEdit|mcp__`**, the hook carries **5**
`mcp__` references, and `.claude/settings.json` has a `sandbox` block where §8.4 measured none. **Two of
its three cited gaps have closed.** The grant is more governable than that section says.

This does not reverse the recommendation, it **re-bases** it: the case for giving `reviewer` the
measurement rather than the camera rests on *architecture* — conformance binds, quality informs — not on
danger. A conformance review reads the probe's JSON artifact and needs no shell, so it runs in
`reviewer-readonly` and can sit on the binding gate. A quality review needs the render and must never
bind.

### 15.6 The best design knowledge in this repository is unreachable, for two independent reasons

`.claude/skills/impeccable/` — **36 markdown files, 4,959 lines** — covers the brief (`shape.md`),
palette roles (`colorize.md`), type (`typeset.md`), motion (`animate.md`), responsive behaviour
(`adapt.md`, 312 lines) and critique (`critique.md`, 788 lines). No agent loads it, and none can:

1. It declares `allowed-tools`, which **subtracts** from the loading agent. Attaching it to `designer`
   would remove the browser loop that is designer's entire purpose. `schema-lint.js` names this skill in
   its own comment as the motivating case.
2. **Both grants point at things that do not exist.** `Bash(node .claude/skills/impeccable/scripts/*)` —
   `scripts/` is not there; the directory holds only `reference/` and `SKILL.md`. `Bash(npx impeccable
   *)` — no such package is installed.

So the grant costs the agent its capabilities and buys nothing. **Removing four lines of frontmatter
makes 4,959 lines reachable**, which is the cheapest large improvement available anywhere in this
investigation.

### 15.7 Two more dead routes in the design skill surface

- **`design-orchestration`** is the ONLY skill `designer` declares, its own text says *"This skill does
  not generate designs"*, and it routes to **`multi-agent-brainstorming` — a skill CURATION deliberately
  cut.** A dead reference inside the only wired design skill.
- **`design-mirror`**, the reference-extraction skill the whole taste-input path would depend on,
  requires `BRIGHTDATA_API_KEY` and `BRIGHTDATA_UNLOCKER_ZONE` — **neither appears anywhere else in this
  repository** — and both its scripts call **`curl -k`**, TLS verification disabled. It is orphaned,
  credential-blocked and unsafe, in that order.

### 15.8 Information architecture is a genuine zero

The word **"breadboard" appears nowhere in 134 skills.** Nothing produces a sitemap, a navigation model,
a URL strategy or a flow map. This matters more than a missing skill usually would, because
breadboarding is one of the two instruments §8.1 identifies for constraining a generator **by medium
rather than by rule** — and *"constrain by instrument, not by rule"* is the mechanism this whole
document argues for.

### 15.9 Method note — the honest limit on §15's skills findings

The ecosystem sweep behind 15.6–15.8 **exhausted its search budget before its first search** and is
therefore direct fetches against four packs named in its brief, not a survey of the field. It said so
rather than presenting four checks as coverage. Two candidate packs could not be verified at all.
**Recorded because a sweep that names its own ceiling is the only kind whose silence means anything** —
which is §5's lesson, applied by an agent that had not read §5.

### 15.10 A fourth observation of the unexplained MCP-grant behaviour — and the first on a second server

A `sourcer` dispatched in this session reported: *"No claims emitted — `mcp__claim-append` is not among
my tools in this session."* Configuration checked immediately afterwards and **intact in every respect**:

```
.mcp.json                 claim-append -> node scripts/mcp/claim-append-server.mjs   (present, 9,543 bytes)
.claude/agents/sourcer.md:8   mcpServers: [claim-append]
schema-lint.js                18 pass · 0 fail · 0 warnings
```

This is the behaviour already registered as **`c-mcp-grant-binds-through-agent-dispatch`**, whose own
assertion says the arriving half is uncertain: *"on 2026-08-16 a designer probe held 24
`mcp__playwright__*` tools; on 2026-08-17 three independent designer dispatches held zero, with
configuration intact. Cause unknown. The command verifies only configuration, not live behaviour."*

**What is new here is the server.** All prior observations were `playwright`. This is `claim-append`, a
different server with a different transport and a local script rather than an `npx` fetch — and it fails
the same way. **So the cause is not specific to `playwright`**, which is the one hypothesis the earlier
three observations could not rule out.

**The consequence is worse than a missing tool.** `sourcer` is the engine whose entire purpose is sourced
evidence, and CLAUDE.md rule 3 makes claim-sourcing `ENFORCED`. A `sourcer` that cannot reach
`claim-append` **produces excellent research that never becomes a claim** — it degrades silently to prose,
which is the one outcome the ledger exists to prevent. It did the right thing and said so; nothing would
have caught it if it had not.

**Also stale, and found the same way:** CLAUDE.md states *"Exactly one agent declares `mcpServers`:
`designer`."* **Two do** — `designer.md:8` and `sourcer.md:8`. The sentence was true when written and the
`sourcer` grant landed afterwards.

### 15.11 The session-start budget costs less than briefed, and the error would have rationed the wrong thing

I briefed a builder that the session-start payload has **~1,025 bytes of headroom** and that *"each new
lens/playbook row costs 70-120 bytes."* The headroom is right. **The cost model is wrong in a way that
would have made a builder ration something free.**

`session-start.js` emits only each lens's and playbook's **`summary`** field. It never emits stages, never
emits `procedure:` steps. Measured by the builder that added a stage and seven procedure steps:

| Change | Briefed cost | Actual |
|---|---|---|
| A new playbook **stage** | 70-120 bytes | **0** |
| A new **procedure step** | 70-120 bytes | **0** |
| A rewritten lens **summary** | — | the whole +78 observed |
| A new lens or a new playbook **file** | 70-120 bytes | correct |

So the budget constrains **how many lenses and playbooks exist**, not how much procedure they carry — and
the design lens went from 5 steps to 12, the ceiling, for nothing. Payload moved 3,071 → 3,149 of 4,096.

**Recorded because of the direction of the error.** A wrong cost model that *overstates* a budget makes a
careful agent write less procedure into the one file whose emptiness is this document's root cause. The
brief would have produced a thinner fix and the number would never have been checked, because nothing
fails when an agent is merely too cautious.

### 15.12 Two builders reached for a GOVERNED script name and it silently raised the tier

`scripts/lib/check-suite.js` classifies as **`irreversible`**, and
`GOVERNED = /^(?:check|test|lint|verify|audit):/` decides which npm script names force an entry in it:

```
GOVERNED   check:tokens · test:design-probe
free       build:tokens · tokens:check · design-probe
```

Both builders independently chose a `check:`/`test:` name, which is the natural naming convention here,
and each therefore had to add an `EXCLUDED` entry — **raising a `full`-tier PR to `irreversible` for a
naming choice, with founder sign-off landing on the critical path.** Neither builder did anything wrong;
the convention points one way and the tier system prices it the other.

**The cure is cheaper than the exclusion and buys more.** An `EXCLUDED` script runs in **no automated
lane** — the entry purchases a written explanation for zero coverage. Appending the test *file* to an
existing step's argv (precedent: commit `b1ab4ce`) and moving a drift check into an assertion inside that
test file leaves `check-suite.js` untouched, `STEPS.length` at 48, `ci.yml` untouched, and the check
actually running. **Strictly more coverage at a strictly lower tier.**

Worth naming as a class: **the tier of a change was set by what a script was called.** That is not
visible at the point of naming, and nothing warns.

### 15.13 §9.1's first defect IS NOT A DEFECT — WITHDRAWN. I compared two different libraries

**§9.1 asserts:** `emilkowal-animations` carries `0.11 px/ms` while *"`vaul/src/constants.ts`:
`VELOCITY_THRESHOLD = 0.4` — 3.6x off."* A sourcer verified Vaul's `0.4` at source, confirmed the unit
really is px/ms by quoting the arithmetic, and the ratio is arithmetically 3.64.

**The comparison is still probably void, and a builder found it by reading the citation I never read.**
`references/interact-momentum-dismiss.md` attributes itself to Kowalski's **"Building a Toast
Component"** — that is **Sonner**, the toast library. Vaul is the **drawer** library. *A toast
swipe-dismiss threshold and a drawer dismiss threshold are different components with different
affordances and no obligation to share a constant.*

So `0.4` can be correct for Vaul **and** `0.11` correct for the toast the rule is actually about, in
which case **there is no defect here — only my category error.** Re-dispatched at Sonner, with the rule
that the cited article outranks a library that has moved on since. `0.11` is held unchanged until it
resolves, and the three outcomes are pre-committed: the finding is withdrawn, survives with a corrected
number and attribution, or resolves to *state the unit* rather than change the value.

**Note what the sourcing did and did not buy.** It verified the number, the unit, the version and three
corroborating implementations — and none of that touched the question of whether the two numbers describe
the same thing. **Rigour about a figure is not rigour about its referent**, and the more thorough the
verification, the more confidently the category error travels. §7.1's type-scale finding was wrong three
times by the same mechanism: a measurement without a construction model produces confident nonsense.

**§9.1's second defect is unaffected and got stronger.** The `timing-under-300ms` rule was repaired on
**in-repo evidence needing no network**: `timing-300ms-max.md` — the source of the 300ms figure itself —
already scopes it to *"150-250ms micro, 250-400ms context switches, longer for marketing"*, and
`timing-drawer-500ms.md` ships 500ms as correct under a heading calling drawers an exception. **The flat
rule contradicted its own source inside the same skill.** That is checkable by anyone here, and it is
strictly better evidence than the three external figures I sent a sourcer to fetch.

### 15.14 A deletion that would have removed a control while every test stayed green

Stripping `allowed-tools` from `impeccable` turned three tests red in `scripts/skill-clamp.test.mjs`,
which used it as a live positive control. **The obvious repair was a trap.** `impeccable` was the only
*shipped* skill using the **block-list** form of the field, so repointing the control at
`pitch-deck-visuals` would have left `schema-lint`'s block-list parse branch **exercised by nothing,
while the whole suite went green.**

That is the class this repository names in five separate places — and it would have been committed by the
fix for it, which is exactly how the eighth CI-chain bypass was introduced. The builder instead moved the
control, added a fixture skill covering the block-list form, and added a guard asserting `impeccable` now
attaches cleanly so the field's return is a red test. Mutation-checked both directions. 21 → 23 tests.

**It also reported that its first full run was 47 of 48 — the one it broke — rather than only the green
re-run.** That is why the green one is worth reading.

### 15.15 The velocity finding is WITHDRAWN — and a better one was underneath it

Resolved at source, 2026-08-29. **Sonner ships `0.11`, the skill is correct, and §9.1's first row is
withdrawn.**

| | Verbatim |
|---|---|
| Sonner's condition | `if (isAllowedDirection && (Math.abs(swipeAmount) >= SWIPE_THRESHOLD \|\| velocity > 0.11))` |
| Its unit, established the same way as Vaul's | `const velocity = Math.abs(swipeAmount) / timeTaken;` over a `getTime()` difference → **px/ms** |
| The article the skill cites | `if (Math.abs(swipeAmount) >= SWIPE_THRESHOLD \|\| velocity > 0.11) {` |
| The author on his own number | **`"0.11 is just a number that I ended up on through trial and error"`** |

Sonner 2.0.8, corroborated three ways. **The skill was right on the value and on the attribution. The
error was entirely mine**, and a careful sourcing of the wrong library made it look better founded.

**But a narrower finding survives, and it is the one worth having.** Line 36 states *"The velocity
threshold of ~0.11 pixels/millisecond works well for **most** swipe-to-dismiss interactions."* Its own
source does not support "most": the author calls it trial and error for **one** component, and the **same
author** ships **`0.4`** for Vaul's drawer — same unit, same arithmetic, 3.6x higher.

> **A component-specific constant encoded as a general rule.** Which is *precisely* the shape of the
> other defect in the same section — `timing-under-300ms`, a heuristic for small frequent transitions
> encoded as a universal hard fail. **Two instances, one class, one skills library.** The class is the
> finding; neither number was.

**And a third number, unsourced, that nobody was looking for.** Line 29 reads `Math.abs(dragDistance) >
100`. **Sonner ships `SWIPE_THRESHOLD = 45`** and the article states no figure. The `100` is attributable
to nothing, and it sits in a block labelled *"Correct (momentum-based)"* — which reads as quoted.

**Do not over-withdraw.** The **duration** strand is independent and stands on its own sources: Vaul
500ms, Carbon `slow-01` 400ms and `slow-02` 700ms, Material to 1000ms. Only the velocity comparison died.

**The method lesson, and it is the sharpest one in this document.** I verified a number to four decimal
places of confidence — value, unit, version, three corroborating implementations — while never checking
*what it was a number about*. **The verification made the error more credible, not less.** §7.1 failed
three times by the same mechanism. The cure is not more rigour on the figure; it is one cheap question
asked earlier: *what is this the measurement of?*

### 15.16 §7.1 IS WRONG A FOURTH TIME — and the error is the one §1.2 warned about, committed inside the correction to it

§7.1's fourth and "finally correct" version states: *"every reference builds its UI band on integer steps
of +1 or +2; mission-control uses +0.5, seven times consecutively"*, and cites **play.grafana.org** as
shipping `12 14` and nothing else. **Measured live 2026-08-29** by `extract-reference.mjs`, logged out,
robots-checked, with usage counts:

| Size | 11.9 | 12 | 12.6 | **14** | 15.4 | 16.8 | 18.2 | 28 |
|---|---|---|---|---|---|---|---|---|
| = 14 x | 0.85 | 0.857 | 0.90 | **1.00** | 1.10 | 1.20 | 1.30 | 2.00 |
| share | 1.6% | 1.6% | 1.6% | **85.5%** | 1.6% | 4.8% | 1.6% | 1.6% |

**Eight sizes, five of them fractional, max 28px — not `12 14`, max 14.** Grafana runs a
**multiplicative** scale off a 14px base (0.85 · 0.9 · 1.0 · 1.1 · 1.2 · 1.3 · 2.0), which produces
fractional pixels *by construction*.

> **So "every reference builds its UI band on integer steps" is FALSE as written.** A real production
> dashboard ships fractional sizes, from a ratio applied to a base — the exact mechanism §7.1 declared
> was "the wrong model".

**What survives is better than what died, and it is a dimension nobody measured until now: SHARE.**

| | fractional sizes | usage |
|---|---|---|
| play.grafana.org | 11.9 · 12.6 · 15.4 · 16.8 · 18.2 | **one occurrence each** — 1.6% |
| mission-control | 12.5 · 11.5 · 13.5 | **12.5px is 30 usages, 31.9%** — the second most-used size in the app |

**Corrected rule:** a fractional size that carries a third of your text is authored and load-bearing; a
fractional size that appears once is a rounding artefact of a ratio scale. **The defect was never
"fractional". It was "fractional AND load-bearing".**

**The method error is this repository's own, and this is its fourth instance — committed inside the
correction to its third.** §1.2 already records: *"A distinct-value count cannot distinguish a considered
3-step ramp from six accidents."* §7.1 v4 counted distinct values across the references and **never
counted how often each was used**, which is the same blindness one level up. The document warned about it,
in writing, above the section that then repeated it.

**Linear, Stripe and Vercel hold** — measured live, every size an integer, and with far richer ramps than
the secondhand list in §7.1 (linear: 10-16 then 18/20/24/32/48/64/72; stripe: 8-26 then 32/48/56;
vercel: 11/12/14/16/24/56/64). So the integer half of the claim is true of three of four references, and
the fourth is not a counterexample to *authored* fractional sizes — it is a counterexample to the claim
as stated.

**Why this was found at all:** an instrument was built that could return the answer its author did not
want, and pointed at the same sites. The falsification harness's load-bearing test is named
`falsifier can kill a rule this repo enforces` — and the first rule it killed was its author's.

### 15.17 The GOVERNED trap has no cheap middle, and prior art prescribes the expensive spelling

15.12 recorded that "the tier of a change was set by what a script was called." **The mechanism is worse
than a naming preference, and a builder measured it rather than arguing it.**

A `check:`-prefixed name is GOVERNED. If it is not in `STEPS`, the drift guard **refuses** it — it must be
classified, and the only place to classify it is `EXCLUDED` in `scripts/lib/check-suite.js`, which is
`irreversible · enforcement=block`. Measured: **adding the script alone produced 8 failing assertions in
`test:check-suite` naming it.** So there is no cheap middle. Either the name is not `check:`, or the PR is
irreversible.

**And `DESIGNER.md` §7.3 prescribes exactly the expensive spelling** — `npm run check:tokens = node
scripts/build-tokens.mjs --check` — written 2026-08-24, before anyone had hit this. **Prior art is not
wrong here so much as priced**, and the price is invisible at the point of writing it.

**The resolution costs nothing and gains coverage.** An `EXCLUDED` script runs in **no automated lane**;
the entry purchases a written explanation for zero coverage. The same drift check as an assertion inside
a test file that rides an existing step's argv runs on every `npm run check` and every CI run. **Strictly
more coverage at a strictly lower tier**, which is the rare case where the cheaper option is also the
stronger one.

### 15.18 An eleventh contrast figure in `styles.css` is still wrong

Recomputed independently here, all seven text pairs:

```
warn     documented 8.582   computed 8.58149308  ->  8.581     OFF BY 0.0005
text 15.734 · divider 3.139 · dim 5.120 · live 8.327 · bad 6.362 · muted 7.422    ALL EXACT
```

**Six of seven reproduce to three decimals. `--color-warn` does not.** The discrepancy is 0.0005 and
changes no verdict — 8.581 and 8.582 both pass everything.

**The size of the error is not the point.** `styles.css:24-25` states: *"CONTRAST FIGURES IN THIS FILE ARE
MEASURED, and were all re-measured on 2026-08-13 after review found every one of them wrong — by 0.06 to
0.3, in both directions."* **A sweep that found and fixed eleven wrong figures left one wrong**, and it
stayed wrong for sixteen days in the file this repository holds up as its best writing.

That is the argument for computing the table rather than typing it, made by the file itself, twice. The
figure is now pinned by a test, so "correcting" the generator to match the prose goes red.

### 15.19 The band-join rule refused its own author's fixture

A test fixture of `ui base 12 / increment 2` — sizes `12 14 16 18`, joined to a 20px display band — was
**refused by the generator**: the join ratio is 1.111, *narrower* than the 1.167 step inside the band, so
it is an interpolation wearing a jump's clothes. Valid numbers, plausible list, refused by arithmetic.

**An instrument that has never refused its author is not an instrument.** This is the second time today
that has happened — the other was the falsification harness killing the `1.125` rule its own repository
enforces (15.16) — and both were designed in, not discovered by luck.

Related, and the standard worth citing: the same builder's first mutation sweep caught 17 of 18. Rather
than shipping that, it identified that the survivor — a monotonic-ratio refusal — was **unreachable from
any valid seeds file**, so deleting it turned nothing red. *"An assertion nobody can prove is load-bearing
is an assertion somebody deletes."* It was extracted as a pure function, driven with inputs the schema
cannot express, and re-swept to 18 of 18.

### 15.20 A wrong value was nearly committed BY the process that was correcting a wrong value

Sequence, all on 2026-08-29:

1. Orchestrator asserts `0.11 px/ms` is wrong; cites Vaul's `0.4`. **Category error — Vaul is a drawer,
   the rule is a toast.**
2. Builder refuses to change it unsourced. Correct.
3. Sourcer verifies **Vaul** at source. `0.4` confirmed, unit confirmed px/ms. **Answering the wrong
   question, rigorously.**
4. Builder reads the citation nobody had read, identifies the library mismatch, flags it.
5. Orchestrator re-dispatches at **Sonner**. Returns **Outcome 1** — Sonner ships `0.11`, the article
   states `0.11`, **the skill was right all along.**
6. **Builder — not having received step 5 — applies `0.11` → `0.4` at three sites, correctly citing
   step 3, and reports COMPLETE.**

**The verified-but-wrong value was committed by the agent that had refused to commit an unverified one,
using a source quote, at the end of a process designed to prevent exactly this.** Every individual step
was defensible and the composition failed.

**What actually caught it:** the builder's report was detailed enough that the mismatch was visible — it
said *"the sourcer verified Vaul but not Sonner"* while a Sonner result already existed. **A terser
"COMPLETE, 4 repairs landed, 48 of 48" would have shipped it.** Verbosity in a return was the control.

**The failure mode, named:** an agent finishing correctly on evidence that a *later* dispatch has already
superseded, with no way to know a correction is in flight. Nothing in this repository's return contract
carries "what I believed when I acted", and a message that arrives after a turn ends is not read before
the work is reported. **This is a coordination defect, not an agent defect**, and it has no mechanism —
`ADVISORY`, like most of the design layer.

### 15.21 A builder's own new rule was falsified by the sourcing it commissioned

Repairing `timing-under-300ms`, the builder drafted a replacement row: full-surface transitions
**400-600ms**. Carbon's `slow-02` is **700ms**, and its own `$description` reads *"background dimming,
large hero transitions"* — a full-surface case.

> **The replacement rule would have failed a shipped Carbon token while citing Carbon as its authority.**
> The same defect it was written to repair, one row over, inside the fix for it.

Caught only because the figures were fetched rather than recalled. The row was widened to 400-700ms,
dimming added to its element list, and — the durable half — **the skill now states that every figure in
its evidence block must land inside a row**, so retuning a row forces a re-check against the evidence.

Two further recall-traps avoided the same way: **`$duration-slow-01` does not exist** (Carbon's
`_motion.scss` has no `$duration-*` variables at all; the verified spellings are `'slow-01'`,
`durationSlow01`, `duration.slow.01`), and **Material's `1000.0` is a bare Float** whose unit is settled
by Flutter's `Duration(milliseconds: 1000)` rather than by the androidx line alone.

### 15.22 `impeccable` is 88% usable, and the 12% was found by asking for a number

Asked what fraction of the 4,959 lines is usable once the absent-runner files are discounted:
**4,370 of 4,959 — 88%.** Dead: `live.md` 323 · `hooks.md` 111 · `live-setup.md` 102 · `doctor.md` 53 =
**589 lines**.

**`doctor.md` was found by the act of computing the fraction.** It had been given an ordinary "follow it
by hand" note, and it cannot be followed by hand — it reconciles a project against an **installed**
Impeccable's `.impeccable/` sidecars, so with nothing installed there is nothing to compare against.
`visualize.md` (49 lines) is named a partial rather than folded silently into the 88%: its art direction
is usable, its asset pipeline is not.

**Recorded because the question produced the finding.** "Is it usable?" gets a yes. "What fraction, and
which lines?" gets a fourth dead file.

### 15.23 §9.2 is right that motion is checkable and WRONG about how — the naive read is wrong for half of all motion

§9.2 states that `document.getAnimations()` makes *"the declared token is the token that ran"* a binding
check, citing per-element `duration`, `delay`, `easing`. **True, and the obvious implementation of it
returns a plausible wrong answer for roughly half of what runs.**

Measured in Chromium, one page, one `getAnimations()` call, by a builder implementing the check:

| Object | `getTiming().easing` | `getKeyframes()[].easing` |
|---|---|---|
| **CSSAnimation** | `"linear"` | **the authored easing** |
| **CSSTransition** | **the authored easing** | `"linear"` |

**The authored easing is not in one place, and the two cases are exact inverses.** Read either accessor
alone and every animation of the other kind reports `"linear"` — not an error, not a gap, a **confident
wrong value** that would pass a conformance check while measuring nothing. The builder's first
implementation had this bug and found it by running the instrument against a real page.

> **Same failure shape as §7.1's type scale and §15.13's velocity comparison, in a third domain: a
> measurement taken without a model of what is being measured.** The API was read correctly; what it
> *means* was assumed. Three instances now, all in this document, all found by building rather than by
> reviewing.

**The structural response is the transferable part.** Interpretation was moved out of the function
serialised into the browser — where it cannot be unit-tested — into `resolveMotion()` /
`authoredEasings()` in node, and the raw Chromium capture is pinned as a fixture. **Anything running
inside `page.evaluate()` is untestable by construction; keep it to collection and do the reasoning where
a test can reach it.**

### 15.24 Motion is now measurable and there is nothing to measure it against

The probe checks that every running animation's duration and easing appear in the token file.
**`seeds.json` declares no motion tokens at all** — no duration, no easing — so motion conformance is
**unchecked** against the system as it stands.

It does not silently pass. An absent token group produces **no finding AND an `unchecked` entry** reading
*"silence here is absence of a standard, not conformance to one"* — the same discipline as the probe's
exit-2 refusal, one level up. **A check with nothing to check against reports that, rather than green.**

Closing it is a design decision nobody has made: someone must choose duration and easing seeds. Inventing
them to turn a check green would be precisely the defect this layer exists to prevent. **Open item,
founder-owned, and the first one this layer surfaced by running rather than by argument.**

### 15.25 The reference corpus is SCROLL-STATE-DEPENDENT, and that dissolves a contradiction rather than settling it

15.16 recorded that play.grafana.org ships eight sizes, five fractional, refuting §7.1's `12 14`.
**Both measurements are correct and they are of different renderings of one page.**

| Capture | Result |
|---|---|
| **Unscrolled** | reproduces `12 14` exactly — §7.1's figure |
| **Scrolled** | eight sizes, including 11.9 / 12.6 / 15.4 / 16.8 / 18.2 — rem multipliers off a 14px root |

> **A reference's measured system depends on how far down the page you went**, and no static extractor
> captures that — not dembrandt, not design-extract, not designlang, none of which scroll. Every published
> extractor measures one viewport of one state, and the reference corpus this whole layer depends on
> inherits that. **A reference nobody can reproduce is a screenshot, not a reference**, so `SOURCE.yml`
> must record scroll state alongside url and date.

### 15.26 The 1.125 refutation is weaker than §7.1 claims, and the verdict turns on band-splitting

§7.1 asserts the invented `1.125` floor is falsified because *"every reference violates it."* Re-measured:

| Site | UI band as extracted | Verdict |
|---|---|---|
| linear.app | 10 11 12 13 14 15 16 — all `+1` | **violates** |
| stripe.com | 15 sizes, 8..26 — all integer | **violates** |
| mission-control | six consecutive `+0.5` | **violates** |
| **vercel.com** | **12 14 16** — ratios 1.167, 1.143 | **CONFORMS** |

**Three of four, not four of four.** And vercel's verdict is not stable: an earlier capture of the same
site found `11 12 14 16 24 56 64`, where including the 11 (10 usages, 6.1% share) yields a 1.091 ratio
that *violates*, and excluding it *conforms*. **The answer turns entirely on where the UI band is judged
to end** — which is a judgement, not a measurement.

The instrument refuses to make that call silently, and records the disagreement rather than resolving it.
**That is the correct behaviour and it is also the finding**: a rule whose refutation depends on an
unstated band-splitting heuristic was never as falsified as the prose said.

**Also corrected: mission-control is SIX consecutive `+0.5` increments, not seven.** §7.1 says seven. The
rest of `1 · 0.5x6 · 1` reproduces exactly.

### 15.27 A refusal that told the truth about itself and a lie about a third party

Under the armed sandbox the network is denied, so `extract-reference.mjs` could not fetch
`linear.app/robots.txt`. **It failed closed — correct — and then printed:**

> *"linear.app disallows this path"*

**Which is a false statement about a third party, written into an artifact this repository keeps.** The
truth was *"I could not reach robots.txt."* One refusal, two utterly different meanings, wearing one
sentence.

`checkRobots` now carries a reason — `disallowed` / `unknown` / `no-robots-published` — and both cases
still exit 2. **The refusal did not change; only the sentence became true.** Found by running the tool
under the sandbox, not by reading it.

> This is the exit-code lesson one level up. The repo already knows that *a resolver never passes what it
> could not check* (rule 10). Here the resolver correctly did not pass — **and misattributed why**, which
> a caller reading only the message would have propagated as a fact about someone else's website.

### 15.28 The orchestrator wrote two sections of THIS FILE into a child worktree and did not notice

While a builder worked in `.worktrees/design-probe`, the orchestrator ran one command as
`cd <that worktree> && npm run test:check-suite` to verify something. **Shell cwd persists between tool
calls.** The next two appends to this document used a *relative* path — `docs/03-system-design/…` — and
landed in the child worktree, creating a **43-line orphan file starting at `### 15.23`**: a document
whose first line is a subsection of something that is not there.

**Nothing detected it.** Not the append, which succeeded. Not the section counter, which happily printed
"§15 now has 24 items" about a file it had never opened. Not the citation check, which passed on a
document missing two sections. **The builder found it** — its `git add -A` swept the orphan into a
commit, it amended it back out, and it reported the anomaly rather than deleting it quietly.

**Three things this is an instance of, all already in this repository's record:**

1. **The cwd trap.** CLAUDE.md's own worktree section says use absolute paths, and says why. The
   orchestrator wrote that instruction into three builder briefs the same afternoon and then violated it.
2. **Cross-worktree writes are a convention, not a rule.** CLAUDE.md states it plainly: *"isolation
   between agents inside a session is a convention they keep, not a rule anything enforces."* Here the
   convention was broken by the session that owns the convention — writing *into* a subagent's tree, the
   direction nobody guards against.
3. **A counter that reports on a file it never read.** `echo "§15 now has 24 items"` was a hardcoded
   string, not a measurement. **Had it been `grep -c '^### 15\.'` against the absolute path, it would have
   printed the wrong number and the error surfaces immediately.** A status line that cannot be wrong is a
   status line that cannot be right.

Recovered by splicing the orphan back before §15.25 and re-deriving the section list from the file
itself. **The recovery is not the point.** The point is that a document arguing that mechanisms beat
intentions lost two of its own sections to an intention, on the day it was written, and was rescued by a
subagent noticing an unexplained file.

### 15.29 THE RULE THIS WHOLE DOCUMENT WAS LOOKING FOR

Derived by a builder, from the wreckage of the `0.11` episode:

> **Write the scope beside the number, in the same sentence. A number scoped only by its surrounding
> context gets read unscoped by whoever carries it somewhere else.**

That is precisely the mechanism that nearly replaced a correct value with a wrong one. `0.11 px/ms` sat
in a sentence that did not name the component it described, so the orchestrator read a **toast**
threshold, found a **drawer** constant, and compared them. A rigorous sourcing of the wrong library then
made the error look better-founded rather than worse. **The rule stops it before any fetching happens.**

**It is the same defect as everything else this investigation found, which is why it is recorded as the
general form:**

| Instance | The number | The scope that was not written beside it |
|---|---|---|
| `emilkowal-animations` | `0.11 px/ms` "works well for **most**" | one component — the author calls it *"trial and error"*, and ships `0.4` for a drawer |
| same skill, three lines away | `300ms \| Maximum duration for UI animations` | its own reference files allow 250-400ms and ship 500ms |
| `12-principles-of-animation` | `timing-under-300ms`, HIGH severity | small, local, frequently-repeated transitions — not drawers |
| §7.1 here, invented by the orchestrator | adjacent ratios below `1.125` are a defect | a band measured on three maximally-correlated references |
| §7.1 v4, also here | `+0.5` increments are the defect | **load-bearing** `+0.5` — Grafana ships fractionals that appear once each |

**Five instances, one class, all inside one layer's work in one day.** Four of the five are this
repository's own writing, and two are the orchestrator's.

**Why it belongs at the end of this document rather than in a skill.** Every other finding here is about
a mechanism — a lint predicate, an exit code, a token file, a governed name. This one is about a
sentence, and it has no mechanism and probably cannot have one: no linter can tell whether a number's
scope is stated, because the scope is prose. It is `ADVISORY` in the strongest sense — **and it would
have prevented more damage today than any of the mechanisms did.**

That is not an argument against mechanisms. It is the honest boundary of the thesis: *conformance can
bind, quality can only inform* — and **the scope of a number is a quality property.**

### 15.30 §6.4's WITHDRAWAL IS ITSELF WITHDRAWN — a rule killed by a bad measurement is alive again

§6.4 withdrew the finding *"mission-control has no display band"* as a **category error**, on the evidence
that play.grafana.org — a real dashboard — *"has a type ramp of `12 14`, max 14px."*

**That evidence was an incomplete measurement.** With a scroll pass, grafana renders **15.4 · 16.8 · 18.2 ·
28** above its UI band. `must-have-display-band` now **HOLDS at 5 of 5 references.**

| | reading | verdict |
|---|---|---|
| `--no-scroll` | `12 14`, max 14 | grafana has no display band — §6.4's basis |
| scrolled | + 15.4 · 16.8 · 18.2 · **28** | grafana has a display band, max 28 |

**The withdrawal rested on the same defect it accused the original finding of.** Both readings are
recorded at the rule itself with the command to reproduce each. **Of the three rules this investigation
killed, this is the one to stop citing as settled.**

> **A rule killed by one measurement lives again when the instrument improves.** That is the harness
> working against the interests of every agent that touched it — including the two that killed the rule.
> It is the only available evidence that the thing is not a confirmation machine.

### 15.31 The five-ramp table §7.1 rests on is NOT REPRODUCIBLE from what was recorded

§7.1's central table lists UI-band increments for five sites, and every downstream claim about integer
increments rests on it.

**The absolute sizes behind four of those five rows exist nowhere in this repository.** Only increments
and 2dp ratio bands were written down, and **a ratio band does not determine a ramp**: base 9 and base 10
both fit Linear's recorded 1.07-1.13 and share no low-end size. Inverting the record is underdetermined.

**So §7.1 cannot be re-derived, only re-measured.** The live captures in `design/references/` are now the
only reproducible measurements of those sites that exist here — which is why the extractor fixtures its
own captures rather than the published table, and why §15.26's vercel disagreement cannot be settled from
the record and needs a capture.

**The lesson is about what a census records, not about who was careless.** An increment is a *derived*
quantity; recording it instead of the values discards the ability to check the derivation. Every
`SOURCE.yml` now carries `surface` · `viewport` · `scrolled` alongside url and date, because **a census
that does not say where it was taken cannot be reproduced** — and three references in this corpus now
have verdicts that depend on exactly those fields.

### 15.32 `docs.stripe.com` closes the standing objection to the 1.125 refutation

§15.26 narrowed the refutation to three of four references. The obvious defence of the rule — *"those are
marketing pages, product surfaces are different"* — is now answered directly. Measured, product surface,
scrolled and recorded:

```
docs.stripe.com   UI band 12 / 13 / 14   ratios 1.083 and 1.077   BOTH UNDER 1.125
```

**A documentation surface for a developer product violates the rule as plainly as the landing pages do.**

### 15.33 THE ORCHESTRATOR DESTROYED THREE SECTIONS OF THIS FILE, HAVING ALREADY DOCUMENTED THE MECHANISM AT §15.28

§15.28 records the orchestrator writing two sections into a child worktree because shell cwd persists
between tool calls and the append used a relative path. **Roughly ninety minutes later, the same
orchestrator, having written that section, did it again — and this time it deleted rather than
misplaced.**

1. cwd had moved into the integration worktree by an earlier `cd`.
2. §15.30-15.32 were appended with a **relative** path and landed in the integration copy. Verified at
   the time: *"32 sections, 1,636 lines."*
3. The session-root copy — still at 29 sections — was then copied **over** the integration copy, to
   "sync" it.
4. `git commit` reported **"nothing to commit, working tree clean"**, because the overwrite had restored
   the file to exactly its last committed state. **The success message was produced by the data loss.**

Never committed, absent from every tree, no stash. Recovered only because the text existed in a
conversation transcript. **Nothing in the repository would have surfaced it** — not the citation check,
which passes on a file missing three sections; not the suite, which does not read this file; not
`git status`, which correctly reported a clean tree.

**Three things this is, and the third is the one that matters:**

1. **The same defect as §15.28**, by the same mechanism, committed by the same agent after documenting it.
   *Knowing the pattern by name does not prevent committing it* — §5 said that about a different pattern
   this same day.
2. **A `cp` in the wrong direction is unrecoverable in a way an append is not.** §15.28's orphan was
   sitting in a child worktree and a builder found it. This left no artifact at all.
3. **The clean-tree report was the failure surface.** A confident, correct, reassuring message —
   *"nothing to commit, working tree clean"* — was the direct output of destroying three sections. **This
   document's own §11.1 names the class: the dangerous output is not the wrong answer, it is the
   nearly-right one.** Here it was not even nearly-right; it was *exactly* right, about the wrong thing.

**The mechanism that would prevent it does not exist and is cheap:** every write to a shared path uses an
absolute path, and every count is `grep -c` against that absolute path rather than an echoed constant.
Both were written into builder briefs today by the agent that then did neither.

### 15.34 A deduplication refused to unify two functions, and the refusal is the finding

Three copies of the colour maths existed because three lanes built in parallel against untracked
neighbours. Collapsing them into `scripts/design-lib.mjs` moved **no number**: 21 · 15.734 · 3.139 ·
8.581 · 5.120 identical before and after, across all four modules.

**`parseRgb` was NOT unified.** The two copies genuinely differ, one-directionally — verified here:

| input | `design-probe` | `design-lib` |
|---|---|---|
| `rgb(13, 14, 17)` | `[13,14,17]` | `[13,14,17]` |
| **`rgb(0 0 0)`** | **`null`** | `[0,0,0]` |
| **`rgb(11 12 14 / 0.5)`** | **`null`** | `[11,12,14]` |
| **`rgba(0, 0, 0, var(--a))`** | **`null`** | `[0,0,0]` |

Those three shapes are **CSS Color 4 serialization, which Chromium already emits for some computed
colours and emits for more over time.** In the probe, `null` means *a colour I could not read*, and a
colour it cannot read is **a contrast check that does not run**.

> **The instrument fails closed on a syntax the browser is adopting, and the hole widens on its own.**

Refusing the unification was right: widening acceptance changes what the instrument *measures*, on live
pages, in a direction nobody reviewed — **a decision about the probe, not a side effect a deduplication
gets to make.** Both behaviours are pinned by tests, so the fork can neither drift nor be tidied away.

1. **A dedupe that finds a behavioural difference has found a defect, not a merge conflict.** All three
   copies agreed on every number; the disagreement was in what each *declined to answer*.
2. **Silent under-measurement is invisible to every check here.** Nothing counts the colours the probe
   skipped, and *"I measured fewer things this month"* is not a finding any test emits.

### 15.35 The line-height curve fits 0 of 5 references — and it was tested against the wrong population

§7.1: *"Two rules no one writes down that **Radix and Tailwind** both obey: line-height is a curve…"*

| control / reference | residual |
|---|---|
| **synthetic data from the formula itself** | **0 — all four parameters recovered exactly** |
| linear.app · stripe.com | 0.134 · 0.106 |
| vercel · grafana · docs.stripe | too few off-peak points to fit at all |

**0 of 5 fit inside a 0.1 RMS residual, and the positive control proves the fitter is correct.**
**linear.app's leading is not monotone in distance from its peak** — 12px sits further below the peak
than 10px while being nearer to it — so no curve of that family can pass through its points.

**The rule is not falsified. It was tested against the wrong population.** Radix and Tailwind are
**design systems**, which *prescribe*. linear.app and stripe.com are **sites**, which set whatever each
component needed. A prescription is not refuted by people not following it — **and cannot be derived from
them either.** *Fourth instance of a measurement taken without a model of what is being measured, and the
first where the wrong population is a category rather than a component.*

So `falloff`/`exponent` are **not extractable in principle**. The extractor emits permanent `null` with
that reason rather than a residual: *"I could not fit this"* and *"this is not a fittable quantity"* are
different statements and only the second stops someone trying harder.

**Without the positive control, 0-of-5 is indistinguishable from a broken fitter** — and that is the
reading a tired reviewer takes.

### 15.36 "No agent could register a claim" WAS FALSE, and it was recorded twice

§15.10 records a `sourcer` unable to reach `mcp__claim-append`. Three agents reported the same and this
document recorded it twice as a capability gap. **A CLI existed the whole time**: `scripts/claim-append.mjs`,
3,456 bytes, present since 2026-08-28. One builder found it and registered a claim that resolves green.

**The MCP finding stands** — the grant is not arriving, now on a second server. **The conclusion drawn
from it was false.** Four agents hit a missing tool; three concluded the capability was absent; one
checked.

> **A missing tool is not a missing capability, and the difference is one `ls`.** Same shape as `refero`
> reported "live" because its tools loaded — *tools loading is not capability* — run backwards.

Also, so nobody re-reports it: `ledger verify` shows **8 would_block** in a fresh worktree against
CLAUDE.md's **5**. The three extra are mission-control claims that fail without `bun install`, which
CLAUDE.md names. **5 + 3 = 8; the new claim adds zero.**

### 15.37 A merge resolution kept the newer TEST and the older IMPLEMENTATION, and only luck made that loud

Resolving one conflict in `scripts/extract-reference.mjs`, the orchestrator took its own side wholesale
after grepping for **two** things it expected to differ. Both greps matched, so the resolution looked
safe. It was not: that side predated a **75-line** `fitLeading` implementation, replacing it with a
40-line stub returning `null`.

**The test file was not in conflict, so it merged cleanly to the newer version.** Result: new tests
against an old implementation → `test:merge-gate` exit 1, four named failures, `47 of 48`.

> **The regression was loud only because the two halves desynchronised.** Had the conflict covered the
> test file too, taking "ours" for both would have produced an old implementation with old tests —
> **green, consistent, and silently missing a feature.**

**The check that would have caught it is not a grep for what you expect to differ; it is a diff of what
each side actually contains.** `sum('function fitLeading' in l)` over both sides answers in one line what
two targeted greps missed. Recorded as the third orchestrator error of the day on the same theme:
**a verification aimed at the failure you predicted cannot see the one you did not.**
