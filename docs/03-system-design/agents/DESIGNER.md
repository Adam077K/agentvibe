# `designer` — the knowledge container

*Replaces [PRODUCERS.md](PRODUCERS.md) §4's **framing** of designer. Everything mechanical in that
document — §2 isolation, §3.7–§3.16's shared producer contract, §4.7's return schema, §6.2's loop
steps, §7's migration order — is downstream of this file and is **not** relitigated or restated here.
What changes is what designer is **for**, which skills it carries, and the per-project structure it
runs on.*

**Date:** 2026-08-14 · **Status:** specification, not yet built · **Tier of this file:** `lite`
(`docs/03-system-design/**` at [qa-tier-floor.yml:172](../../../.claude/qa-tier-floor.yml) — the
strictest match wins over the `docs/**` trivial rule at `:187`).

Every load-bearing claim is a `file:line` in this repository, a command run on this machine on
2026-08-14, or an external URL with an access date. Two claims that circulated as fact going into
this work were **wrong**, and both are corrected below with the evidence: `design-audit` is on this
machine, and `allowed-tools:` in a `SKILL.md` **restricts the model's tool set**.

---

## 0. The correction this document exists to make

The founder's words, verbatim:

> *"the designer and the builder agents are not the same. The designer still writes code while
> designing. But his knowledge is more about the designing UI, UX, user experience, animations,
> demographics, colorings, spacings, creating the actual product, while the builder can design, but
> he needs the designer to make it as good as it can get. So, like, for some prototypes, the builder
> can write the code and do everything, like the back end and the database and the front end and also
> that. But the designer is used when we need something better. So most of the time we use a
> designer, but it has a different kind of knowledge base."*

Four claims, and each contradicts something currently written down.

| # | The founder's claim | What the repo currently says |
|---|---|---|
| 1 | **Designer writes code.** It builds the actual product surface. | Agreed already, and kept. `designer.md:6` grants `Write` and `Edit`; PRODUCERS.md §4 treats it as a producer throughout. **No change.** |
| 2 | **The difference is knowledge, not capability.** | ROSTER-SIZE §2's grant rule says the opposite: *"a job distinguished only by a … **domain** … is a lens."* Domain **is** knowledge. This is a real collision and §1 resolves it rather than papering over it. |
| 3 | **Designer is the default for anything user-facing.** Builder-alone is the prototype path. | Nothing in the repo says this. `design.js` has been invoked **zero** times (PRODUCERS.md §4.14) and `grep -h 'engine:' .claude/playbooks/*.yml` gives `2 engine: designer` against `4 engine: builder` (ROSTER-SIZE §7.1). Designer is currently the exception. §2 inverts it. |
| 4 | Its domain includes **animation** and **demographics**. | Neither word appears in the `design` lens (`lenses.yml:133-147`), in `craft` (`review-lenses.yml:61-72`), or in designer's one declared skill. §3 and §4 close both gaps. |

**And one framing that must go.** ROSTER-SIZE §4.3 closes with *"If the grant is refused — delete
`designer.md` and retag `craft`, `voice`, `accessibility` to `scope: diff-only` in the same PR,"* and
PRODUCERS.md inherits it. That sentence is correct **as a statement about the grant** and wrong as a
statement about designer, because it makes the container's whole existence contingent on one MCP
server arriving. §1 shows the file is earned twice, by two independent mechanisms, and that the
second one does not depend on the browser at all.

**Kept without amendment,** because the founder's correction does not touch it and it is the best
work in PRODUCERS.md: §2 (isolation, one worktree per dispatch), §4.7 (the return schema, including
`capture_method` and `captures[].sha`), §6.2's split of the loop into a computable half and a taste
half, §6.3–§6.4 (the producer cannot close its own gate; that is a dispatch, not a role), and §7's
ordering — **the browser grant lands last, after E7.**

---

## 1. The tension, named and resolved: a container earned by capability, valued for knowledge

The team brief asked for this to be addressed directly. Here it is, without softening.

### 1.1 The rule, applied honestly, says knowledge is not a container

ROSTER-SIZE §2's grant rule is explicit:

> *"A job earns its own agent file if and only if it needs a capability that can only be **added** in
> agent-file frontmatter … Everything else is data. A job distinguished only by a denial, an effort, a
> model, an isolation mode, a return schema, a persona, a **domain**, a posture, a severity vocabulary
> or a **procedure** is a lens, a workflow option, a playbook stage or a script."*

"UI, UX, animation, colour, spacing" is a domain. "How to set a type scale" is a procedure. Run the
rule as written on the founder's sentence and it returns **lens** — designer's knowledge base would
be eight skills and a lens attached to `builder`.

I am not going to pretend the rule says something else. It says that, and the rule is good.

### 1.2 But the rule was derived against an incomplete table, and the missing row is `skills:`

ROSTER-SIZE §2's own table is where the resolution is:

| Property | Settable per dispatch? |
|---|---|
| `effort`, `model`, `isolation`, `schema`, tool **denial**, `bashCommandClamp` | **Yes** |
| Tool **grant** (additive) | **NO** — file only |
| `mcpServers:` | **NO** — file only |
| **`skills:`** | **NO — no skills option on `agent()` and none on `Agent`. File only.** |

ROSTER-SIZE lists `skills:` as file-only and then dismisses it in one line: *"a skill payload is
prose, and prose is not capability. If injected prose were container-forming, 134 skills would admit
134 containers."*

**The premise is right and the inference is too strong.** Prose is not capability — agreed, and that
is why 134 skills do not admit 134 containers. But the rule's actual question is not *"is this a
capability?"*, it is step 2's question: ***"can it ride on an existing container, and if not, name the
hazard."*** For designer's knowledge base the answer to the first half is **no**, for a mechanical
reason, and the hazard sentence is writable:

> **The hazard sentence.** `skills:` binds per file and cannot be varied at a dispatch. Attaching
> designer's eight-skill knowledge base to `builder` injects all eight before turn 1 of **every**
> builder dispatch — including migration authoring, backend routes, tests and docs, which are the
> majority. There is no per-dispatch way to withhold them, exactly as there is no per-dispatch way to
> withhold an MCP server. The combination is therefore **permanent in the same sense the browser
> grant is permanent**, and it is the same runtime asymmetry — a per-file channel with no call-site
> override — that earned every other container in the roster.

That is not an appeal to token cost. Cost is inadmissible here and is not being claimed. The claim is
about **expressiveness**: the runtime offers exactly one channel that reliably delivers a knowledge
base to a model, and that channel is file-scoped. N distinct knowledge bases require N files, for the
identical reason N distinct grants require N files.

### 1.3 The counter-argument, which is real, and why it does not win yet

PRODUCERS.md §3.4 proposes the honest workaround: **the orchestrator pastes a skill body into the
brief.** It holds `Read`, a `SKILL.md` body is text, and the prompt is a channel that binds. If that
works, per-dispatch skill selection exists after all and §1.2's mechanism argument dissolves.

Three reasons it does not dissolve it today, in descending strength:

1. **A pasted payload fails open; a declared one fails closed.** This is ROSTER-SIZE §2's own central
   asymmetry, applied to skills. An orchestrator that forgets to paste produces a designer with no
   design knowledge and no error — the same failure shape as a denial you forget to write. A
   `skills:` list cannot be forgotten.
2. **It is unmeasured.** PRODUCERS.md §8 lists it as open question **Q6** — *"does pasting a skill
   body into the brief actually change behaviour versus pointing at it?"* — with no probe run. The
   measured channel is the injection: skill bodies land as `isMeta` user messages before turn 1 in
   288 of 431 transcripts (ROSTER-SIZE §5.2). Nothing has measured the paste.
3. **It scales badly in exactly this case.** Eight skills is the largest single knowledge base in the
   roster. Pasting eight bodies per dispatch is the 42,000-character dispatch PRODUCERS.md §3.10 cites
   as superpowers' documented failure, arriving by a different door.

**If Q6 comes back positive, revisit this section, not the whole file** — because the file is earned
independently by the browser/perception grant (ROSTER-SIZE §4.3, and the hazard sentence there is
sound: an unbounded, unhookable egress channel on every code-writing dispatch, permanent because
`Agent` cannot subtract). The two arguments are independent. Killing either leaves the container
standing.

### 1.4 The answer, stated plainly

> **Designer's *container* is earned by the browser/perception grant. Designer's *value* is the
> knowledge base. These are different things and both are true.**
>
> The grant is what makes the file legal under the roster's rule. The knowledge is what makes the
> file worth dispatching. A designer with the grant and no knowledge base is `builder` with a camera
> — which is, precisely, what `designer.md` is today: it differs from `builder.md` in nothing the
> runtime reads except `color` and one skill (ROSTER-SIZE §4.3), and that one skill is the wrong one
> (§4.6 below).

The founder is not disagreeing with the roster rule. He is pointing at the half of the container the
rule does not price, and he is right that it is the half that produces the product.

---

## 2. Designer is the default; builder-alone is the prototype path

The inversion the founder asked for, as a routing rule the orchestrator can execute.

### 2.1 The rule

> **Any artifact a customer will look at is designer's, unless the work is explicitly a throwaway
> prototype. Builder-alone is the exception and it must be named as such in the brief.**

`builder` remains capable of the whole stack — backend, database, frontend, AI, devops, data, tests,
docs, copy (ROSTER-SIZE §4.2). Nothing is taken away. What changes is the **default assignment** for
one slice class.

### 2.2 The routing table

| The slice produces | Engine | Why |
|---|---|---|
| A screen, page, component or flow a customer reaches | **designer** | The surface is the product |
| A landing page, pricing page, onboarding, empty/error states | **designer** | `page-cro`, `form-cro`, `onboarding-cro` all resolve to a rendered surface, and `voice` + `craft` + `accessibility` all block at p1 on `rendered-output` (`review-lenses.yml:69, 95, 108`) |
| Marketing visuals — OG images, social cards, deck art | **designer** | §7.6 |
| A throwaway prototype, to answer a question and then be deleted | **builder** | Named `disposable: true` in the brief. If it survives the week it was not a prototype and it gets a design pass before anyone sees it |
| Internal-only tooling nobody outside the team opens | **builder** | Mission Control is the live example, and its design system is already written (§6.1) |
| API routes, schema, migrations, jobs, tests, docs, ADRs | **builder** | No rendered surface |
| Anything that mutates state outside git | **operator** | ROSTER-SIZE §4.7 |

### 2.3 The trigger the orchestrator can actually compute

The tier classifier already reads paths (`scripts/lib/classifier.js`, queried by
`node scripts/classify.mjs`). The same input answers this question. A slice whose `files` array
contains a route, page, component or stylesheet under the app's client tree is user-facing. **This
belongs in `plan.js` alongside the §2.4 overlap pre-check**, as a default the brief may override with
an explicit `disposable: true`, never as a judgement made fresh each time.

**Honest limit:** a path heuristic will miscall the ambiguous cases (an internal admin screen that
becomes customer-facing). The override exists for that, and the failure is visible — a customer-facing
surface that skipped designer arrives at `reviewer` with three p1 lenses scoped `rendered-output` and
no captures, which is a BLOCK, not a silent pass. The gate catches the miscall.

---

## 3. Designer's domain — the seven things the founder named

Each with the failure it prevents and where the knowledge lives. This is what makes the knowledge
base a list rather than a mood.

| Domain | The failure it prevents | Carried by |
|---|---|---|
| **UI** — surfaces, elevation, borders, component structure | Every container gets a border and a shadow, so nothing is elevated relative to anything; the AI-default look | `better-ui` (§4.3), `impeccable` |
| **UX / user experience** — flow, disclosure, cognitive load, states | The happy path works and empty, loading and error do not exist. `craft`'s second check is literally *"All states are handled: empty, loading, error, populated"* (`review-lenses.yml:66`) | `impeccable`, `better-layout` |
| **Animation** | Motion added because it can be, at the wrong duration, with the wrong easing, on properties that force layout. **This domain is currently uncovered:** the `design` lens says nothing about motion (`lenses.yml:136-146`), and neither does `craft` | `emilkowal-animations`, `12-principles-of-animation` (§4.5) |
| **Demographics** — who this is for | Design for a persona nobody named, so every taste argument is unfalsifiable. **This is not a skill and no skill will fix it** — see §3.1 | `design/system/audience.md` (§7.2) + `USER-INSIGHTS.md` |
| **Colour** | A palette invented per screen; contrast asserted by eye. This repo has the receipt: `mission-control/client/src/styles.css:24-25` records that **every measured contrast figure in the file was wrong — by 0.06 to 0.3, in both directions** | `better-colors` (OKLCH), `design/tokens/` + the generated contrast table (§7.3) |
| **Spacing** | A spacing scale that is whatever number was typed. `craft`'s first check is *"Spacing, type scale and colour match the written system"* (`review-lenses.yml:65`) — which presumes a written system exists | `better-layout`, `ui-typography`, `design/system/space.md` |
| **Shipping the actual product** | A design that is a document. Designer holds `Write` and `Edit` and produces the surface itself — this is the founder's first point and it is already true in the file | `tools:` in `designer.md:6` |

### 3.1 Demographics is data, not procedure — say so rather than inventing a skill

The founder named demographics alongside six things that are procedures. It is not one. "Who is this
for" is a **project fact**, it differs per project, and a skill that teaches an agent *how to think
about audiences* would be generic advice standing where a specific answer belongs.

The repo already has the right container and it is empty: `.claude/memory/USER-INSIGHTS.md`
("Customer language, pain phrases, JTBD", per CLAUDE.md's memory table). What is missing is the
**design-facing** half — what the audience forbids. That is `design/system/audience.md` (§7.2), and it
is authored, per project, and read before every design pass.

Naming this honestly is the point: five of the seven domains are closed by attaching a skill, one is
closed by attaching two, and **one is closed by writing down a project fact**. Pretending the seventh
is a skill is how a knowledge base fills with plausible generic prose.

---

## 4. Skills — the knowledge base, eight of them

Designer reads **5–8**, and the founder's instruction that token cost is inadmissible is honoured:
none of what follows is argued on budget. Each entry names the failure it prevents, per the brief.

`skills:` is file-only, is injected as `isMeta` user messages **before turn 1**, and
`check-registration.mjs` check #4 (`:178`) fails the build if a declared skill is absent from
`MANIFEST.json` — so every name below must be vendored into `.claude/skills/` and rebuilt into the
manifest before it can be declared. **Availability is stated per skill and was checked on disk on
2026-08-14.**

```yaml
skills:
  - impeccable            # RESTRICTS TOOLS — see §5. Ships only after the allowed-tools field is stripped
  - better-ui
  - better-colors
  - better-layout
  - ui-typography
  - emilkowal-animations
  - design-tokens
  - ui-visual-validator
```

`web-design-guidelines` and `design-audit` are **deliberately not on this list** and §4.9 says why —
they belong to `reviewer`, not to the producer.

### 4.1 `impeccable` — the spine

**In this repo:** `.claude/skills/impeccable/SKILL.md`, 11,005 bytes, plus a 37-file `reference/`
directory (`audit.md`, `craft-floor.md`, `animate.md`, `colorize.md`, `layout.md`, `typeset.md`,
`polish.md`, `distill.md`, `harden.md`, `onboard.md`, `optimize.md`, `extract.md`, and 25 more).

**The failure it prevents:** a design pass with no named mode. Its own `argument-hint` enumerates
nineteen distinct operations — `shape · audit|critique · animate|bolder|colorize|delight|layout|
overdrive|quieter|typeset · adapt|clarify|distill · harden|onboard|optimize|polish · init|document|
extract|live` — which is the closest thing in the library to a design *procedure* rather than design
*advice*. It is the only skill in the repo whose scope matches the founder's list end to end
(its description names "typography, fonts, spacing, layout, alignment, color, motion,
micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens").

**It carries the hazard in §5 and must not be attached until the field is stripped.** It is the only
skill on this list that does.

### 4.2 — 4.4 The Krehel `better-*` triad — the measurable layer

**Source: https://github.com/jakubkrehel/skills — accessed 2026-08-14.** MIT, not archived, 61
commits, latest commit **2026-08-14** (`ba35986`, "Merge pull request #13 from
jakubkrehel/improve-better-colors"). Eight skills at `skills/`: `better-accessibility`,
`better-colors`, `better-interface`, `better-layout`, `better-typography`, `better-ui`,
`better-writing`, `interface-review`. **No `allowed-tools:` in any of the four checked.** Prose plus
linked reference `.md` files; no runnable script. Star count reported ~3.8k but read from a
JS-hydrated page — treated here as lower confidence than everything else in this paragraph, and
nothing depends on it. Contributor count could not be verified.

**`better-ui`** — *"Design engineering principles for making interfaces feel polished. Use when
building UI components, reviewing frontend code, implementing animations, hover states, shadows,
borders, micro-interactions, enter/exit animations, choosing or reviewing icons, or any visual detail
work."* Reference files: `surfaces.md`, `animations.md`, `enter-exit.md`, `icon-transitions.md`,
`icons.md`, `performance.md`.

> **The failure it prevents:** everything gets a border and a shadow, so nothing is elevated relative
> to anything. Its rule is stated as *"Shadows for Elevation, Borders for Structure"* and *"For
> buttons, cards, and containers whose border exists only to create depth, prefer layered transparent
> `box-shadow` values."* That is a rule with a decision procedure, which is what the `design` lens
> demands and what taste cannot supply.

**`better-colors`** — *"Color systems for digital products, from building and naming a palette to
applying it with meaning and verifying contrast."* Carries `color-formats.md` ("Choosing a notation,
converting, gamut and P3 fallbacks") and states *"For a genuinely new system, `oklch()` is the best
default because its numbers behave the way the ramp rules below describe."* Its trigger list contains
the literal string `"oklch"`.

> **The failure it prevents, and it is the one this repo has already paid for.**
> `styles.css:24-25` records every hand-measured contrast figure in the file as wrong. A palette built
> in hex and checked by eye produces exactly that; a palette built in a perceptually-uniform space
> produces ramps whose steps are actually even, and it makes the generated contrast table (§7.3)
> checkable rather than decorative. **This is the single highest-value external skill in this
> document**, because it is the one whose absence has a measured, dated defect in this repository.

**`better-layout`** — *"Layout structure for web interfaces, from grouping and alignment to reading
order, progressive disclosure, and adaptive breakpoints … handling RTL layout direction."* States
*"Use logical properties (`padding-inline-start`, `margin-inline-end`) for direction-dependent layout;
reserve physical left/right for genuinely physical geometry"* and *"Think in leading/trailing, not
left/right."*

> **The failure it prevents:** a layout that is correct at 1440px and broken at 375px, and a layout
> that cannot be internationalised without a rewrite. `craft` requires *"Small-screen rendering
> checked, not only wide"* (`review-lenses.yml:67`) and nothing in the current skill set teaches how
> to build for it. Logical properties are also the cheapest RTL insurance there is — they cost
> nothing at author time and are unaffordable to retrofit.

**Not taken, and named so nobody re-proposes them:** `better-typography` is covered by
`ui-typography`, which carries an ENFORCEMENT MODE the Krehel skill does not (§4.4);
`better-accessibility` and `interface-review` are **judging** skills and belong to `reviewer` (§4.9);
`better-writing` is `voice`, which is the orchestrator's and `reviewer`'s; `better-interface` overlaps
`impeccable` without adding a mechanism.

### 4.4 `ui-typography` — the enforcement one

**In this repo:** `.claude/skills/ui-typography/SKILL.md`, 14,291 bytes, plus `css-templates.md` and
`html-entities.md`. No `allowed-tools:`.

**The failure it prevents:** the highest-frequency measurable defect class in generated UI — straight
quotes, hyphens standing in for en and em dashes, no non-breaking spaces, a type hierarchy with four
sizes that are all 16px. It is kept over `better-typography` for one mechanical reason: it declares
**ENFORCEMENT MODE** — *"When generating ANY HTML, CSS, React, JSX, or UI code containing visible
text, auto-apply every rule in this skill silently — do not ask, do not explain."* That is an
instruction to act, not an instruction to consider, and it maps directly onto designer's auto-fix
authority (PRODUCERS.md §4.9).

### 4.5 `emilkowal-animations` — the domain that is currently uncovered

**In this repo:** `.claude/skills/emilkowal-animations/SKILL.md`. No `allowed-tools:`. Description:
*"Emil Kowalski's animation best practices for web interfaces. Use when writing, reviewing, or
implementing animations in React, CSS, or Framer Motion. Triggers on tasks involving transitions,
easing, gestures, toasts, drawers, or motion."*

**The failure it prevents:** the founder named animation and **nothing in the current design stack
mentions motion.** Not the `design` lens (`lenses.yml:136-146`), not `craft`
(`review-lenses.yml:63-72`), not `designer.md`. An uncovered domain does not produce no animation; it
produces animation chosen by default — 300ms `ease`, on `top`/`left`, with no reduced-motion
fallback.

**Its companion, and why it is not also attached:** `12-principles-of-animation` is in the repo and
its description is *"**Audit** animation code against Disney's 12 principles … Outputs file:line
findings."* That is a review skill. It goes to `reviewer` under `craft` (§4.9) — attaching an auditor
to the producer is the same layer violation as `design-orchestration` (§4.6), one level down.

### 4.6 `design-tokens` — the artifact the whole system measures against

**Source: https://github.com/julianoczkowski/designer-skills — accessed 2026-08-14.** Full assessment
of the pack is §6.1; this is the one skill from it taken for designer.

Verbatim `description:` — *"Generate a design tokens file (CSS variables or Tailwind config) based on
a chosen aesthetic philosophy, with light and dark mode palettes, spacing scale, type ramp, and
component-level tokens. Use when starting a new project, establishing a visual system, setting up
tokens, or mentions 'tokens' or 'design system'."* No `allowed-tools:`.

**The failure it prevents:** `craft` blocks at p1 on *"Spacing, type scale and colour match the
written system"* — against a written system that, for a new project, **does not exist**. Every gate in
the design path presumes an artifact nothing produces. This skill is the procedure for producing it,
and §7.3 is where its output lands.

**Named tension, and it is deliberate:** this skill's output and `better-colors`' method disagree on
notation — the Oczkowski skill offers "CSS variables or Tailwind config", the Krehel skill argues
OKLCH. **Resolve it in favour of OKLCH in `design/system/palette.md`**, once, per project, as a
written decision — which is exactly what a design system is for. Two skills that disagree about a
choice the project has already made are not a conflict; they are two inputs to a decision that is
recorded. A knowledge base whose skills never disagree is a knowledge base with one opinion in it.

### 4.7 `ui-visual-validator` — the judging half of the loop the producer is allowed to run

**In this repo:** `.claude/skills/ui-visual-validator/SKILL.md`. No `allowed-tools:` (it carries a
`metadata: model: sonnet` key, which the runtime reads as metadata, not as a model pin on this
agent). Description: *"Rigorous visual validation expert … Masters screenshot analysis, visual
regression testing, and component validation. Use PROACTIVELY to verify UI modifications have
achieved their intended goals through comprehensive visual analysis."*

**The failure it prevents:** a capture that is taken and not read. It is the only skill in the library
written for an agent that has **already** captured a render, and it is step 5 of the loop (§8). Kept
from PRODUCERS.md §4.4 unchanged.

**This does not make designer its own judge.** PRODUCERS.md §6.3–§6.4 settles that: the self-check
runs, and is structurally incapable of closing the gate, because the verdict is `gate-logic.mjs`
arithmetic over `reviewer` findings and designer cannot write into it. Superpowers reached the same
answer — *"Implementer self-review never replaces the task review; both are needed"* (accessed
2026-08-14).

### 4.8 Deleted from `designer.md`

**`design-orchestration`** (`designer.md:11`) — the only skill designer currently declares, and it is
the wrong one. Its description: *"Orchestrates design workflows by routing work through brainstorming,
multi-agent review, and execution readiness in the correct order."* That is the orchestrator's job,
injected before turn 1 into a producing container, inviting it to route, plan and review — the layer
violation the roster exists to prevent. PRODUCERS.md §9 already lists this deletion; it is restated
here only because §4's list replaces the line it sits on.

### 4.9 What goes to `reviewer` instead, and why the split is not arbitrary

The founder's list is a **producing** knowledge base. Four strong skills are deliberately routed away
from it:

| Skill | Where | Why not designer |
|---|---|---|
| `web-design-guidelines` | `reviewer` (`craft`) | Its own description is *"**Review** UI code for Web Interface Guidelines compliance"* — it is a checklist for judging, and PRODUCERS.md §4.4 attaching it to the producer put a judge inside the thing being judged |
| `design-audit` | `reviewer` (`craft`) | *"Conducts systematic visual **audits** of existing apps and produces phased, implementation-ready design plans"* — an auditor. §6.3 |
| `12-principles-of-animation` | `reviewer` (`craft`) | *"**Audit** animation code … Outputs file:line findings"* |
| `better-accessibility`, `interface-review` | `reviewer` (`accessibility`, `craft`) | Judging postures |

**The principle, and it is the one that keeps the roster honest:** a producer carries skills that say
*how to make it*; a reviewer carries skills that say *how to check it*. Both containers may hold
design knowledge — that was never the boundary. The boundary is `Write`, and it is measured:
`reviewer` made 0 writes across 4,373 tool calls and CI hard-fails a `reviewer` declaring one
(`schema-lint.js:62`, `READ_ONLY_ENGINES`).

### 4.10 Availability and the work each name costs

| Skill | Where it is now | To declare it |
|---|---|---|
| `impeccable` | `.claude/skills/impeccable/` ✅ | **Strip `allowed-tools:` (§5)**, then nothing |
| `ui-typography` | `.claude/skills/ui-typography/` ✅ | Nothing |
| `emilkowal-animations` | `.claude/skills/emilkowal-animations/` ✅ | Nothing |
| `ui-visual-validator` | `.claude/skills/ui-visual-validator/` ✅ | Nothing |
| `better-ui`, `better-colors`, `better-layout` | github.com/jakubkrehel/skills, MIT | Vendor 3 dirs → `CURATION.yml` entry each → `npm run build:manifest` |
| `design-tokens` | github.com/julianoczkowski/designer-skills, Apache-2.0 | Vendor 1 dir → `CURATION.yml` → rebuild manifest |

**A name collision that will bite if unhandled.** `frontend-design` exists in **four** places on this
machine with **three different bodies**: `~/.gemini/antigravity/skills/frontend-design`
(6,745 bytes), `~/.agents/skills/frontend-design` and `~/.claude/skills/frontend-design` (both 8,260
bytes, identical), and a fourth inside the Oczkowski pack. `check-registration.mjs` check #10 already
warns when a skill name resolves to `~/.claude/skills` and is absent from this repo. **Do not vendor
anything named `frontend-design`** without deciding which body wins and recording it in
`CURATION.yml` — the same reasoning that keeps the retired agent-name shims in place. `grill-me`
collides the same way.

---

## 5. The `allowed-tools:` hazard — real, binary-confirmed, and already inside this repo

The team brief asked whether a `SKILL.md`'s `allowed-tools` field restricts the tool set, and flagged
that attaching such a skill could silently strip designer's browser. **It does restrict, the field is
live in the installed binary, and two skills in this repository declare it.**

### 5.1 The evidence

The frontmatter schema, extracted from `/Users/adamks/.local/share/claude/versions/2.1.232` on
2026-08-14. These are the binary's own `describe()` strings, verbatim:

```
"allowed-tools":    .describe("Tools available to the model while this file is active.
                               Comma-separated string or YAML list.")
"disallowed-tools": .describe("Tools removed from the model while this file is active.
                               Comma-separated string or YAML list.
                               Cleared when the user sends the next message.")
```

Set that beside the **agent** frontmatter schema from the same binary:

```
tools:            .describe("Tools available to this agent. Replaces the default set.")
disallowedTools:  .describe("Tools removed from the default set. Ignored if `tools` is set.")
```

**The wording is the same wording.** `tools:` on an agent is the field ROSTER-SIZE proved subtracts,
with the strongest measured evidence in the corpus (`sourcer`: 0 Bash calls in 284; `reviewer`: 0
Write and 0 Edit across 4,373). `allowed-tools:` on a skill is described in the same terms, scoped to
*"while this file is active."*

Three further confirmations from the same binary:

- It is **parsed and validated**, not ignored: `allowed-tools must be a string or array of strings,
  got …` and `allowed-tools array must contain only strings.`
- The loader reads it into a live field: `…allowedTools: XPe(e["allowed-tools"]), disallowedTools:
  XPe(e["disallowed-tools"] ?? e.disallowedTools)…`
- The binary calls it **capability frontmatter**, and names the one case where it is dropped:
  *"When a shared memory skill loads, capability frontmatter (`allowed-tools`, `hooks`, `model`,
  `shell`) is ignored."* **A field documented as ignored in one load path is honoured in the
  others.**

### 5.2 The correction this forces

PRODUCERS.md §10.2 rejects the field on this reasoning:

> *"`allowed-tools:` in `SKILL.md` frontmatter … Grants nothing: there is no skills-level tool grant
> in this runtime. It is decoration of the exact kind `schema-lint.js` exists to kill."*

**The premise is right and the conclusion is dangerously wrong.** It grants nothing — correct, and
consistent with ROSTER-SIZE's finding that there is no additive `allowedTools?:` on either dispatch
surface. But it is not decoration. It **subtracts**, and subtraction is the one thing this runtime
does with strong measured force. The recommended action changes from *"strip it on the next curation
pass, it does nothing"* to **"strip it before attaching the skill, because it does something."**

### 5.3 What is affected here, checked file by file

Eight skills in `.claude/skills/` declare the field. Grouped by blast radius:

| Skill | Declared value | Effect if honoured while active |
|---|---|---|
| **`impeccable`** | `- Bash(npx impeccable *)`<br>`- Bash(node .claude/skills/impeccable/scripts/*)` | **Catastrophic for designer.** Reduces the tool set to two Bash patterns: **no `Read`, no `Write`, no `Edit`, no `Glob`, no `Grep`, and no `mcp__playwright__*`.** The producer cannot produce and the perception loop cannot capture |
| `pitch-deck-visuals` | `Bash(belt *)` | Same shape, one pattern |
| `react-patterns`, `database-design`, `nextjs-best-practices`, `tailwind-patterns` | `Read, Write, Edit, Glob, Grep` | **Strips `Bash` and every MCP server.** Silent — the loop simply stops being able to render |
| `deployment-procedures` | `Read, Glob, Grep, Bash` | Strips `Write`/`Edit` — a producer that cannot produce |
| `tdd-workflow` | `Read, Write, Edit, Glob, Grep, Bash` | Strips MCP only. The mildest, and still fatal to the browser |

**`impeccable` is on designer's skill list and it is the worst case on this table.** Its second
pattern also references `.claude/skills/impeccable/scripts/*`, **a directory that does not exist** —
the skill ships `SKILL.md` and `reference/` only, verified 2026-08-14. And `npx impeccable` is a
network fetch of an npm package, unmatched by any rule in `pre-tool-use.sh` (the same gap
PRODUCERS.md §4.5 names for `npx playwright install`).

### 5.4 The fix, and it is three lines of policy

1. **Strip `allowed-tools:` from any skill before it is attached via `skills:` frontmatter.** Record
   the strip in `CURATION.yml` with the reason, which is what that file is for.
2. **Make `schema-lint.js` fail a `SKILL.md` that declares `allowed-tools:` or `disallowed-tools:`.**
   The linter reads agent files and does not read skills; this is the gap that let eight of them in.
   A capability field that silently narrows a container is precisely what that linter exists to catch,
   and it is currently sitting in a tree the linter does not open.
3. **Never vendor a pack without grepping for the field first.** Of the external packs assessed in §6,
   Krehel's four and Oczkowski's eight declare **none** — checked individually, and confirmed for the
   Oczkowski pack by a repo-wide code search returning *"Your search did not match any code," 0
   files*. **`vercel-labs/agent-browser`'s shipped skill declares
   `allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*)`** — which is §6.4's decisive
   objection to it.

**One honest uncertainty, stated rather than buried.** The binary proves the field is parsed, stored
and described as narrowing while the file is active. It does **not** prove the narrowing is applied
identically on all three load paths — slash-command invocation, model-invoked `Skill` tool, and the
pre-turn-1 `isMeta` injection that `skills:` frontmatter uses. The measured arrival channel is the
third (288 of 431 transcripts). **The probe is cheap and should run before designer ships:** attach a
skill declaring `allowed-tools: Read` to a throwaway agent holding `Bash`, dispatch it, ask it to run
one Bash command, and record whether the call is refused. Until it runs, treat the field as binding on
all three paths — that is the direction that fails closed.

---

## 6. External packs — what is real, what it contains, and what earns a slot

All four assessed on 2026-08-14. Two of the four earn slots on designer; one earns a slot on
`reviewer`; one is rejected with a named reason.

### 6.1 Design Process Pack — Julian Oczkowski · **REAL** · one skill taken

**https://github.com/julianoczkowski/designer-skills** — accessed 2026-08-14. Apache-2.0, **not
archived**, 509 stars / 37 forks / 0 open issues, created 2026-03-28, last push **2026-07-06**
(`c259656`, "Add Author section to README"). **Sole contributor: `julianoczkowski`, 15 contributions.**
Repo description: *"A collection of agent skills for designers who prototype and build with AI coding
tools. These skills encode design process so AI follows a structured path instead of producing random
output."* Companion write-up: *"7 Claude Code Design Skills That Follow a Real Design Process"*
(medium.com/@julian.oczkowski, Jul 2026).

**The real names — the pipeline the founder described, confirmed exactly.** Eight directories, each
containing **exactly one file, `SKILL.md`** — no scripts, no references, no templates. Pure prose.

| Stage | Actual skill name | Assessment |
|---|---|---|
| Requirements / references | `grill-me` | **Not for designer.** It is an interview loop with a human; designer has no channel to one (PRODUCERS.md §3.9 — the escalation gap). Belongs to the orchestrator, and a body of it is already at `~/.agents/skills/grill-me` |
| Design brief | `design-brief` | **Not a skill here — it is the brief.** PRODUCERS.md §3.14 already adopted superpowers' generated-brief-as-a-file, and `plan.js` is where it is produced. Two mechanisms for one artifact disagree silently |
| Information architecture | `information-architecture` | **Not for designer.** IA is a *framing* artifact — with `framer` cut, it is builder's or the orchestrator's (PRODUCERS.md §5). It settles what the screen must achieve, which `designer.md:50` already lists as the boundary it does not cross |
| Design tokens | **`design-tokens`** | **TAKEN — §4.6.** The only one that fills a real gap |
| Task decomposition | `brief-to-tasks` | **Not for designer.** This is `plan.js`'s `SLICE_SCHEMA`, and `coding.js:22` refuses to run without it. A producer that decomposes its own work is the layer violation `design-orchestration` was deleted for |
| Frontend generation | `frontend-design` | **Not taken — §4.10's collision.** Three different bodies of this name are already on this machine |
| Review | `design-review` | **Not for designer — §4.9.** Judging posture |
| (orchestrator) | `design-flow` | **Not taken.** *"Orchestrates all designer skills in order"* — the same objection as `design-orchestration` |

**How the pack relates to §7's per-project process — and this is the useful finding.** They are the
same pipeline at two different layers, and the repo's own linter has already ruled on which layer wins.
`schema-lint.js` **refuses a playbook stage carrying `steps:`, `how:`, `method:` or
`implementation:`** (CLAUDE.md, Playbooks). A playbook declares stages and exit criteria; the engine
picks its own path inside a stage. Oczkowski's pack is a **method**, hard-coded as a fixed chain
(`design-flow` runs all seven in order).

> **So: adopt the pack's *stages* as a `design-pass` playbook — which already exists at
> `.claude/playbooks/design-pass.yml` — and adopt exactly one of its *methods*, `design-tokens`,
> because that is the stage where this repo has no procedure at all.** Taking the whole chain would
> import a second pipeline description alongside the playbook, and CLAUDE.md is explicit that two
> descriptions of one pipeline disagree silently.

The other six stages are not gaps — each already has a home in this system that binds harder than a
prose skill (the brief file, `plan.js`, the review lenses). That is the honest assessment: **a good
pack, correctly identified by the founder, of which this system needs one-eighth.**

### 6.2 Better UI / Typography / Colors / Layout — Jakub Krehel · **REAL** · three taken

Full sourcing in §4.2–§4.4. **https://github.com/jakubkrehel/skills**, accessed 2026-08-14, MIT, not
archived, latest commit 2026-08-14. Every claim the founder made about the contents checked out
against the source: OKLCH in `better-colors` (with a dedicated `color-formats.md` on gamut and P3
fallbacks), RTL in `better-layout` (logical properties, leading/trailing), surfaces and shadows in
`better-ui` (with `surfaces.md`), type scales in `better-typography`.

**Earns three slots: `better-ui`, `better-colors`, `better-layout`.** `better-typography` loses to
`ui-typography` on ENFORCEMENT MODE (§4.4); `better-accessibility`, `interface-review` and
`better-writing` go to `reviewer` or the orchestrator (§4.9).

**This is the most actively maintained pack of the three** — a commit on the day it was assessed —
which is a double-edged fact worth naming: a vendored copy in `.claude/skills/` is a **fork frozen at
a date**. Record the upstream SHA in `CURATION.yml` so the drift is visible, exactly as
`SKILLS_SOURCE.md` does for the wider library.

### 6.3 `design-audit` — **FOUND ON THIS MACHINE.** The brief's "NOT FOUND ANYWHERE" is wrong

```
/Users/adamks/.agents/skills/design-audit/
    SKILL.md            6,201 bytes
    audit-template.md   3,272 bytes
    design-principles.md 2,047 bytes
```

Verified 2026-08-14. It is also **live in this session** — `design-audit` appears in the available-skills
list with the same description. Frontmatter is `name` + `description` only; **no `allowed-tools:`**.
Its opening line: *"You are a UI/UX architect. You do not write features or touch functionality."*

**Upstream:** https://github.com/bencium/bencium-marketplace at
`design-audit/skills/design-audit/SKILL.md` — accessed 2026-08-14, 390 stars, **no LICENSE file**
(`license: null`), pushed 2026-08-14. The local copy's description is a verbatim match. Three
independent, differently-authored `design-audit` skills also exist publicly
(`wonjyou/design-audit` — 4 stars, carries a `references/` dir with `mobile-app.md`, `web-app.md`,
`marketing-site.md`; `Ashutos1997/claude-design-auditor-skill`; `mistyhx/frontend-design-audit`).

**Two consequences.**

1. **It does not go on designer.** Its own first sentence disqualifies it — *"you do not write
   features or touch functionality"* is a read-only posture, and it *"is purely visual — it does not
   touch functionality, logic, or features. It elevates what exists."* That is `reviewer` under
   `craft`. §4.9.
2. **Vendoring it needs a licence decision.** The upstream repo has no LICENSE file, so the local copy
   at `~/.agents/skills/` has no stated terms. `CURATION.yml` records provenance for every skill in
   this repo; a skill with no licence cannot be recorded honestly. **Prefer `wonjyou/design-audit`
   after checking its licence, or write the audit checklist locally** — it is a checklist, and this
   repo already has `review-lenses.yml` as the place a judging checklist lives, linted for content.

### 6.4 Agent Browser (Vercel Labs), `webapp-testing`, and Playwright — the testing side

**All three are real. None of them changes §8's recommendation, and one of them demonstrates §5's
hazard in the wild.**

**Agent Browser — vercel-labs/agent-browser.** https://github.com/vercel-labs/agent-browser, accessed
2026-08-14. Apache-2.0, **not archived**, **40,629 stars**, npm `agent-browser` **v0.34.0**, pushed
2026-08-13. README tagline: *"Browser automation CLI for AI agents. Fast native Rust CLI."* It is a
**CLI**, not an MCP server — a Rust daemon driving a **local** Chrome over CDP by default, with
opt-in cloud providers and a separate sibling project (`vercel-labs/remote-agent-browser`) for people
who want the hosted path. No API key for local use. It writes accessibility-tree snapshots with
`@eN` element refs alongside screenshots.

> **Genuinely impressive and still rejected, for two named reasons.** (a) Its shipped skill declares
> **`allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*)`** — §5's hazard, in the exact
> shape that would strip designer's tool set. (b) It is a third-party binary whose command surface we
> do not control, and the whole argument for a script over the MCP path (PRODUCERS.md §4.5) is that
> **the URL lands in `tool_input.command` where E2 can see it.** A rule in the `Bash` arm of
> `pre-tool-use.sh` must match a stable command form; a CLI that ships new subcommands on a weekly
> cadence is a moving target for a matcher that matches raw text. **Revisit if the loop's own script
> proves too slow to maintain** — the star count and the local-CDP default are real advantages and
> this is a close call, not a dismissal.

**`webapp-testing` — anthropics/skills.** https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md,
accessed 2026-08-14. Verbatim frontmatter, fetched raw: `name: webapp-testing`, `description: Toolkit
for interacting with and testing local web applications using Playwright. Supports verifying frontend
functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.`,
`license: Complete terms in LICENSE.txt`. **No `allowed-tools:` — checked explicitly.** Contents: prose
plus one helper script, `scripts/with_server.py` (server lifecycle), plus `examples/`. It instructs the
agent to **write its own Playwright scripts on the fly** rather than shipping a driver, uses
`page.screenshot(path=…, full_page=True)`, and mandates headless chromium. **No accessibility-tree
snapshot anywhere in it** — it is screenshot-and-DOM.

> **Earns a slot on `reviewer`, not on designer, and only after §8's script exists.** Its server
> lifecycle pattern (`with_server.py`) is directly useful and is the shape §8 step 2 needs. But its
> core instruction — *the agent writes the script each time* — is precisely what §8 rejects: a script
> the producer writes fresh is not re-runnable by the judge, which is the entire provenance argument
> (PRODUCERS.md §6.3). **Take the pattern, not the skill.**

**Playwright — and one correction that will otherwise be written wrong.**

- `@playwright/mcp` (npm 0.0.79) — https://github.com/microsoft/playwright-mcp, accessed 2026-08-14.
  It **does** carry origin controls: `--allowed-origins` (*"semicolon-separated list of TRUSTED
  origins to allow the browser to request. Default is to allow all"*), `--blocked-origins`
  (*"Blocklist is evaluated before allowlist"*), `--allowed-hosts`, `--host`, `--isolated`.
  **And its own README disclaims them:** they are documented as **not a security boundary** and as
  **not affecting redirects**, with users told to rely on *"client-level permissions for true
  security"*. That is worth knowing before anyone treats `--allowed-origins` as E7's substitute — it
  is intent-scoping, not containment, and Microsoft says so.
- `@playwright/cli` (npm **0.1.18**, invoked as `playwright-cli`) is a **separate package** from the
  MCP server. https://playwright.dev/agent-cli/snapshots, accessed 2026-08-14: *"After each command,
  `playwright-cli` outputs a snapshot of the current browser state — an accessibility tree with
  element refs for interaction,"* saved as YAML. Screenshots are a separate command; PRODUCERS.md
  §10.1 records these as written "alongside" each other, which overstates it — **both are available
  from one tool, but you must invoke both.**
- **The correction.** `page.accessibility.snapshot()` is **removed**, not deprecated. Playwright
  release notes for **1.57**: *"After 3 years of being deprecated, we removed `page.accessibility`
  from our API."* Current `playwright` is **1.62.1**. The replacement is **`page.ariaSnapshot()`** /
  `locator.ariaSnapshot()`, added in 1.59, producing a YAML "textual screenshot" of the accessibility
  tree. PRODUCERS.md §4.16 helper 7 and §6.2 step 3 both specify "an accessibility-tree snapshot"
  without naming an API — so nothing is wrong on disk yet, and the next person to write it would have
  written the removed call. **The loop's script calls `page.ariaSnapshot()`.**

---

## 7. The per-project design process — `design/`

The founder's second ask:

> *"we want to add for the designer process for each project: so space for references, visuals,
> styles, design tokens, explanations — in order to create the most quality designs in product,
> marketing visuals, or any design that is needed."*

This is a **persistent per-project structure**, and every design of it must answer one question: *how
does an agent that did not create it find it and trust it six weeks later?*

### 7.1 The layout

```
design/                          ← repo root, a peer of docs/ and mission-control/
  INDEX.md                       ← AUTHORED. the only file designer must read to know what is here
  system/                        ← AUTHORED. the rules. rule first, reasoning after
    principles.md                ←   what this product looks like, and why. the locked decisions
    palette.md                   ←   colour, in OKLCH, with the meaning of each token
    type.md                      ←   families, scale, measure, the enforcement rules
    space.md                     ←   the spacing scale, and what may deviate from it
    motion.md                    ←   duration, easing, what animates and what must not
    audience.md                  ←   DEMOGRAPHICS. who this is for, and what that forbids (§3.1)
  tokens/
    tokens.json                  ← AUTHORED. the source of truth for values. one flat map
    tokens.css                   ← GENERATED. @theme / custom properties. never hand-edited
    tokens.ts                    ← GENERATED. typed export
    contrast.md                  ← GENERATED. every pair, computed, dated
  references/                    ← what we looked at, and what we take from it
    <slug>/
      SOURCE.yml                 ←   url · access_date · captured_by · attribution · expires
      capture.png                ←   the image
      notes.md                   ← AUTHORED. what we take, what we reject, and why
    inbox/                       ←   drop zone. a script slugs and files whatever lands here
  visuals/                       ← OUTPUT. marketing visuals, OG images, deck art, social cards
    <campaign>/
      BRIEF.md · *.html · *.png · SOURCE.yml
  decisions/                     ← AUTHORED. NNN-<slug>.md, same shape as docs/03-system-design/adr/
  captures/                      ← GITIGNORED. the perception loop's output. never committed
```

### 7.2 Where it lives, and why not under `docs/`

**Repo root, `design/`.** Three reasons, and the first is enforcement, not aesthetics.

1. **Tier.** `qa-tier-floor.yml:187` puts `docs/**` at `trivial` — *"Documentation — schema-lint
   sufficient."* A design token file is **code's input**: a wrong value ships to a customer, and
   `trivial` means it merges on schema-lint alone. Living under `docs/` would mis-tier the one file in
   this structure that is not documentation. **Add two patterns to `qa-tier-floor.yml`:
   `design/tokens/**` at `lite` (values that reach customers) and `design/system/**` at `lite` (the
   rules every gate measures against). `design/references/**` and `design/visuals/**` stay `trivial`.**
2. **Discoverability is a path, not a search.** The mechanisms in this repo that make a file findable
   are: CLAUDE.md names it, an agent's `pre_flight_reads:` names it, or a router indexes it.
   `designer.md:27` currently says *"the written design system"* in the abstract — which is why
   PRODUCERS.md §6.1 had to go looking and found it buried at
   `mission-control/client/src/styles.css`. **`pre_flight_reads:` names `design/INDEX.md`**, and
   CLAUDE.md's memory table gains one row. A path in frontmatter is found by an agent that has read
   nothing else.
3. **It is not one product's.** `mission-control/client/src/styles.css` is Mission Control's system
   and should stay where the code that imports it lives. `design/` is the **project's** design
   record, and a repo that grows a second surface gets `design/system/` shared and a per-product token
   file — which is only expressible if the directory is not nested inside one product.

**On `styles.css`:** it is not moved and not deprecated. It is the reference implementation of what
`design/system/palette.md` should read like — *"the whole design system, as tokens"*, with the
dark-only decision argued, one accent meaning exactly one thing, and every contrast figure carrying
the date it was measured. **Migration is one-way and mechanical:** its token values become
`design/tokens/tokens.json`, its prose becomes `design/system/*.md`, and `styles.css` imports the
generated `tokens.css`. Do it when the second surface arrives, not before — until then it is one
system in one file, which is correct.

### 7.3 Design tokens code can actually consume

**Not a mood board. A build step with a `--check` mode**, which is the pattern this repo already uses
for every generated file it trusts: `build-skills-manifest.mjs --check` and `gen-codebase-map.mjs
--check` both run in `npm run check` (`package.json:9, 28, 37`) and fail CI on drift.

```
design/tokens/tokens.json          →  node scripts/build-tokens.mjs
                                      ├→ design/tokens/tokens.css     (@theme block)
                                      ├→ design/tokens/tokens.ts      (typed export)
                                      └→ design/tokens/contrast.md    (every pair, computed)
npm run check:tokens = node scripts/build-tokens.mjs --check
```

Four properties that make this the answer rather than a directory of hex codes:

- **One source, three consumers.** CSS for the app, TypeScript for anything that needs a token in
  logic, Markdown for the human reading the system. Three hand-maintained copies of one palette are
  three palettes.
- **The contrast table is computed, never typed.** This is not a preference — it is the correction to
  a dated defect in this repository. `styles.css:24-25`: *"CONTRAST FIGURES IN THIS FILE ARE MEASURED,
  and were all re-measured on 2026-08-13 after review found **every one of them wrong** — by 0.06 to
  0.3, in both directions … Re-measure before changing a colour; do not carry a figure forward because
  it was in the comment."* A generator cannot carry a figure forward. PRODUCERS.md §4.16 helper 8
  reaches the same conclusion from the same evidence and calls it *"the strongest available argument
  for a script over a judge."*
- **OKLCH is the notation** (§4.3), so a ramp's steps are perceptually even by construction and the
  generator can emit sRGB fallbacks rather than a designer hand-picking them.
- **No file is half-generated.** Authored and generated never mix in one file. `contrast.md` is
  generated *whole*; `palette.md` is authored *whole* and links to it. This repo already learned this
  the expensive way — `check:map` fails on a hand edit of `CODEBASE-MAP.md`, and CLAUDE.md's own rules
  forbid hand-editing generated files.

### 7.4 How references get in — four channels, and the tool that does the searching

The founder wants *"the ability to send an agent to search for images and visual references."* There
are four real channels on this machine today, and they are **not equally good**.

**Channel 1 — `refero`, and it is the right tool.** Eight tools are live at user scope right now
(ROSTER-SIZE §6), and one of them is a searchable corpus of product screenshots:
`mcp__refero__refero_search_screens`, `refero_get_screen_image`, `refero_search_styles`,
`refero_search_flows`, `refero_get_similar_screens`. That is literally "send an agent to search for
visual references."

> **It goes to `sourcer`, not to designer**, and the grant rule decides it rather than taste. Run
> ROSTER-SIZE §2's step 2 — *add the grant to an existing container unless you can name the hazard the
> combination creates.* `sourcer` already holds `WebSearch` + `WebFetch`, already ingests
> attacker-controllable external text, already holds no `Bash`, no `Write`, and no credential over
> customer data. Adding a read of a public design corpus adds **no new egress class and no new
> credential**. **No hazard sentence is available → by the rule, add the grant, do not add a file.**
> On designer it would be a second permanent grant on a `Write`-bearing container, which is exactly
> the hazard ROSTER-SIZE §4.3 already named for the browser.

> **And this reverses one of PRODUCERS.md's refusals, on its own stated terms.** §4.5 refused
> `refero` among eight servers because *"none has an artifact in this repository to act on (no `.pen`
> file, no Figma file, **no design corpus**). A grant with no subject is decoration with a blast
> radius."* `design/references/` **is** that corpus. The refusal was conditional on an absence this
> section removes, so the reason lapses — for `refero`, on `sourcer`, and for no other server on that
> list. `figma`, `pencil`, `stitch`, `mem0`, `miro`, `higgsfield` and `runpod` stay refused; nothing
> here creates a subject for them. **The sequencing does not lapse:** E7 first, then the grant
> (§8.4).

`sourcer` cannot `Write` — the known defect at ROSTER-SIZE §4.5 — so it returns records, not files.
The write is the **orchestrator's**, which is the same fix that section already prescribes for the
claims defect. The image bytes are fetched by a script (**Channel 3**), because a script's URL lands
in `tool_input.command` where E2 can see it.

**Channel 2 — `sourcer` with `WebSearch`/`WebFetch`,** for anything outside refero's corpus. Every
return already carries *"URL, access date, verbatim quote and confidence"* (ROSTER-SIZE §4.5), which
is `SOURCE.yml`'s schema already written.

**Channel 3 — the capture script, pointed outward.** `scripts/design-ref.mjs <url> <slug>` screenshots
a live page into `design/references/<slug>/` and writes `SOURCE.yml`.

> **A conflict that must be resolved in the command surface, not in prose.** PRODUCERS.md §4.5
> proposes a **loopback-only rule in the `Bash` arm of `pre-tool-use.sh`** — buildable today, and
> strictly stronger than anything the MCP path can carry. "Screenshot this reference site" is a
> direct violation of it. Because E2 sees only `tool_name` and `tool_input.command`
> (`pre-tool-use.sh:67-90`) and has no agent identity, the hook cannot distinguish intent — **it can
> only distinguish command text.** So there must be **two scripts, not one flag**:
>
> | Script | May navigate to | Writes to |
> |---|---|---|
> | `scripts/capture.mjs` | **loopback only** — the hook enforces it | `design/captures/` (gitignored) |
> | `scripts/design-ref.mjs` | external, against a written allowlist in the script | `design/references/<slug>/` only |
>
> Two entry points is not redundancy; it is the only way a text-matching hook can hold two different
> network policies. **`design-ref.mjs` is the weaker of the two and should say so in its header:** the
> allowlist lives in the script, and a `Bash`-holding agent can edit the script. Only E7 closes that,
> and it is the same gap PRODUCERS.md §1.3 names for `Bash` generally.

**Channel 4 — `design/references/inbox/`.** The founder drops a screenshot in; `scripts/design-ref.mjs
--inbox` slugs it, moves it, and stubs `SOURCE.yml` with `captured_by: founder` and the fields it
cannot infer left blank and marked. **This is the lowest-tech channel and the one most likely to
carry the highest-value references,** because the founder's own eye is the input the system has no
other way to receive. Do not skip it because it is unglamorous.

**Credit, in `SOURCE.yml`, for every reference regardless of channel:**

```yaml
url: https://…
access_date: 2026-08-14
captured_by: sourcer | design-ref.mjs | founder
attribution: "Company/product name, and the licence if one is stated"
expires: 2027-02-14          # references rot — §7.7
why: "one sentence: what we are looking at this for"
```

### 7.5 What is generated, what is authored

| Path | Authored / Generated | What stops it rotting |
|---|---|---|
| `design/INDEX.md` | Authored | Named in `pre_flight_reads:` — an unread index is a dead index, and this one is read every dispatch |
| `design/system/*.md` | **Authored** | The artifact-existence gate (§7.6). A design stage cannot open while a file in scope is `status: unanswered` |
| `design/tokens/tokens.json` | **Authored** | It is the only hand-edited file in `tokens/`, so there is exactly one place to change a value |
| `design/tokens/{tokens.css,tokens.ts,contrast.md}` | **Generated** | `npm run check:tokens` fails CI on drift — the `check:manifest` / `check:map` pattern |
| `design/references/*/SOURCE.yml` | Generated stub, authored fields | `claim-source` re-fetches the URL; `claim-freshness` forces a disposition at `expires` |
| `design/references/*/notes.md` | **Authored** | A reference with no notes is a screenshot, not a reference. §7.7 |
| `design/visuals/**` | Mixed — see §7.6 | The campaign's own gate |
| `design/decisions/*.md` | **Authored** | `ledger.mjs` at `lint` fails a claim citing a nonexistent ADR (CLAUDE.md rule 3) |
| `design/captures/**` | **Generated, gitignored** | Derived from a SHA; re-derivable; never committed |

**The binary rule, stated once:** *a binary file is committed only if it is the deliverable, never if
it is evidence.* `design/visuals/**` and `design/references/*/capture.png` are deliverables and
inputs — they ship, or they are the record of what we looked at. `design/captures/**` is evidence and
is gitignored (PRODUCERS.md §2.7). This repo has **8 committed binaries** and **no `.gitattributes`,
so no LFS** — if `design/visuals/` grows past a few dozen files, that decision needs making
deliberately rather than discovering itself in a slow clone.

### 7.6 Covering all three outputs

| Output | Reads | Lands in | Judged by |
|---|---|---|---|
| **Product UI** | `system/`, `tokens/`, `references/` | the worktree's source | The perception loop (§8) + `reviewer` under `craft`, `voice`, `accessibility` |
| **Marketing visuals** — OG images, social cards, ads | same | `design/visuals/<campaign>/` | See below |
| **Anything else** — deck art, diagrams, email headers | same | `design/visuals/<campaign>/` | Same |

**The honest problem with the second and third rows, and the fix.** A PNG has no accessibility tree
and no computed styles. PRODUCERS.md §6.2's whole split depends on the measurable half being *text*,
citing digitalapplied (accessed 2026-08-14): text-and-DOM output is *"the only rung where verification
fully closes without human intervention"*, and beyond it, *"keep taste-level review only"* and, where
a check does not close, *"name the person."* **For a flat exported image, the measurable half does not
exist and the person is the founder.**

> **The fix, and it is worth doing: build marketing visuals as an HTML route, then screenshot it.**
> An OG image authored as `design/visuals/<campaign>/og.html`, rendered by the same
> `scripts/capture.mjs` at 1200×630, has a DOM — so contrast is computed, the type scale is checked
> against `tokens.json`, and the copy goes through `voice` as text rather than as pixels. The measurable
> half comes back, the visual reads from the same tokens as the product (which is what makes a brand
> look like one brand), and the export is reproducible from a commit rather than from someone's
> laptop.
>
> Where a visual genuinely cannot be HTML — photography, illustration, a generated image — it is
> **founder-gated, always**, and `SOURCE.yml` records the tool, the prompt, the date and the licence.
> That is not a weakness to hide; it is digitalapplied's own prescription followed exactly.

### 7.7 Seeding a new project, and stopping it going stale

**Seeding.** `node scripts/design-init.mjs` writes the tree with three deliberate properties:

1. **Every `system/*.md` is seeded as a question, never as a placeholder,** and carries
   `status: unanswered` in frontmatter. `audience.md` seeds as *"Who is this for? What do they
   already use? What does that forbid?"* — not as a persona template. **A placeholder gets shipped; a
   question gets answered or gets noticed.** CLAUDE.md's rule 6 — no placeholder UI — with a
   mechanism for once.
2. **`tokens.json` seeds with a deliberately provisional palette** — flat greys and one obviously
   wrong accent — for the same reason. A plausible default palette survives to launch. An implausible
   one does not survive the first screenshot.
3. **`INDEX.md` seeds with the directory map and the unanswered list**, so the first agent to open it
   learns what is missing rather than what exists.

**The gate that makes seeding matter.** Spec Kit's artifact-existence precondition is already adopted
(PRODUCERS.md §10.1) — *a stage cannot open until the prior stage's named artifact exists at a
resolvable path, checked by a script the agent did not author.* Apply it here:
**`node scripts/check-design.mjs` fails a `design-pass` stage while any `system/` file in scope is
`status: unanswered`.** It fails the *stage*, not the build — a repo with no design work in flight
should not fail CI for having no design system. That is the difference between a gate and an
obstacle.

**Staleness, by the two mechanisms this repo already has:**

1. **Rule 9 — claims expire, and expiry forces a decision.** `design/system/palette.md`'s contrast
   assertions are `claim(kind=internal-fact, verified_by=command)` where the command is
   `npm run check:tokens`. `ledger.mjs` at `lint` fails a claim with no expiry; `claim-freshness`
   fails it once the date passes; and exactly one disposition is recordable — Refresh, Deprecate, or
   Waive with a new deadline. **This is precisely the mechanism `styles.css` did not have**, and its
   own comment says why it needed one: figures went unchecked because *"a human (or a model) reading a
   comment cannot tell."*
2. **Rule 3 — `claim-source` re-fetches.** A reference's `SOURCE.yml` carries a `url` and an
   `access_date`; the resolver fetches the URL and asserts the quote is still present (currently
   `SHADOW`, logging `claim.would_block`). A reference site redesigns and the reference becomes a
   picture of something that no longer exists — which is worse than no reference, because it is
   invisible. `expires` on every `SOURCE.yml` forces the disposition.

**And one anti-rot rule that is not a script.** A reference with no `notes.md` is deleted at the next
sweep. The screenshot is not the reference — *what we take from it and what we reject* is the
reference, and a folder of uncommented screenshots is a mood board, which is the thing §7.3 says this
must not become.

---

## 8. Closing the perception loop — concretely

`designer.md:34` claims the loop — *"render, look, iterate"* — and `designer.md:6` grants no browser.
**It has never once closed.** PRODUCERS.md §6.2 specifies the eight steps and they stand. This section
answers the four questions the team brief asked — what renders, what captures, what judges, how it
terminates — as tool choices, given the research in §6.4.

### 8.1 What renders

The project's own dev server, on a port **derived from the slice id** and passed in the brief.
`mission-control/package.json` runs `vite`, which **auto-increments on a busy port** — so two
designers rendering concurrently silently capture each other's app (PRODUCERS.md §2.7, §4.13 mode 10).
`bun install` runs first on every dispatch, because `node_modules/` is gitignored and `check.mjs:36`
already detects the condition. The capture asserts the served build's git SHA equals its own HEAD
**before it believes a pixel**.

### 8.2 What captures — and the three-way choice, decided

| Candidate | Verdict |
|---|---|
| `mcp__playwright__*` directly | **Exploration only, and only after E7.** Its URL is invisible to every guard in the repo (§8.4) |
| `agent-browser` (Vercel Labs) CLI | **Rejected — §6.4.** Ships `allowed-tools` that would clamp the agent; third-party command surface a text-matching hook cannot track |
| `@playwright/cli` | **Rejected for the loop, useful for exploration.** Writes the aria snapshot, but is another third-party command surface |
| **A committed script driving the Playwright Node library** | **This one** |

`scripts/capture.mjs`, ours, committed. Four properties, and the first is the one that matters:

1. **The reviewer re-runs it.** A screenshot the producer took proves nothing; the same script re-run
   at the same SHA by a container holding no `Write` is evidence. This is the entire provenance answer
   (PRODUCERS.md §6.3) and it is why capture must not be an interactive MCP session.
2. **Deterministic** across runs, and runnable in CI.
3. **Its URL lands in `tool_input.command`, which E2 can see** — so the loopback-only rule is
   buildable today, in the `Bash` arm, and is strictly stronger than any rule the MCP path can carry.
4. **The API is ours to pin.** `page.screenshot()` and — **`page.ariaSnapshot()`, not
   `page.accessibility.snapshot()`**, which was removed in Playwright 1.57 (§6.4). A third-party CLI
   would have absorbed that migration invisibly and then changed its output format under us.

Per route × {empty, loading, error, populated} × {375, 1440}: drive to the state, write
`<screen>-<state>-<width>.png` **and** the aria snapshot, record HEAD's SHA. Both artifacts, always
— because a run that captured the snapshot and failed the screenshot has lost its *taste* evidence,
not its *measurable* evidence, and the return schema can say exactly that (PRODUCERS.md §4.7).

Take `webapp-testing`'s `with_server.py` **pattern** for the server lifecycle (§6.4), not the skill.

### 8.3 What judges, in three layers that must not be collapsed

| Layer | Does what | By what |
|---|---|---|
| **Compute** | Contrast ratios, tap-target sizes, overflow at 375px, missing states, focus order | **A script**, from the *text* snapshot. No model. This is most of what a design pass gets wrong, and `styles.css:24-25` is the proof that a reader — human or model — cannot catch it |
| **Look** | Read the PNGs. Findings as `{rule, expected, measured}` against `design/system/` | The model, with `ui-visual-validator`. **The step that has never happened** |
| **Gate** | The verdict | `reviewer` under `craft`/`voice`/`accessibility`, dispatched by the orchestrator, over `gate-logic.mjs` arithmetic designer cannot write into |

**"Good" is not a feeling:** zero unresolved `rule_deltas`, and `captures` covering four states at two
widths. Both are computable from the return object.

**Termination:** three iterations without the unresolved count decreasing ⇒ PARTIAL. Three failed
captures ⇒ PARTIAL with `capture_method: 'source-fallback'`, **which must force the three
`rendered-output` lenses to `unresolved`, never `pass`** — the same rule CLAUDE.md rule 10 applies to
every resolver.

### 8.4 The sequencing hazard, stated once and not softened

> **An MCP grant lands outside every guard in this repository.**
>
> Verified 2026-08-14: the `PreToolUse` matcher in `.claude/settings.json:51` is
> `Bash|Edit|Write|NotebookEdit`, so the hook is **never invoked** for an `mcp__*` call. Widening it
> does not help — `grep -c "mcp__" .claude/hooks/pre-tool-use.sh` returns **0**, and
> `pre-tool-use.sh:343` is `# Unknown tool — allow`. There is no `mcp__` arm and no URL field to match
> on. `mcp__playwright__browser_navigate` to an external host returns **exit 0**
> (AGENT-ARCHITECTURE.md:125).
>
> Granting `playwright` to a `Write`-bearing container that has read the whole repo therefore adds
> **unbounded network egress** and **arbitrary code execution in the page** (`browser_evaluate`,
> `browser_run_code_unsafe` — 154 and 69 real calls on this machine, so this is used, not
> theoretical). Because the `Agent` dispatch path accepts no `disallowedTools`, **once it is in the
> file there is no way to take it back at a call.**

Designer's stated browser boundaries — no `browser_evaluate`, no `browser_run_code_unsafe`,
loopback-only navigation — are **prose enforced by nothing**, and the agent file must ship saying so
in those words. Their real homes are E7 (`sandbox.network.deniedDomains`) and E8 (`disallowedTools` at
a workflow dispatch). Neither is configured: `grep -c '"sandbox"'` → **0** in both settings files, and
E8 has been used **zero** times.

**PRODUCERS.md §7's order stands and nothing here moves it.** Steps 0–6 first; then E7 plus dropping
`--dangerously-skip-permissions` from `bin/warroom:235,237` plus `.mcp.json` with a per-agent server
allowlist in `schema-lint.js`; **then** the grant. The loop closes on the script long before the grant
arrives — which is the point, and is why this specification does not depend on it.

---

## 9. The builder/designer handoff

### 9.1 When builder calls designer — it does not

**Builder cannot spawn anything.** It holds no `Agent` in `tools:`, and subtraction is the denial with
the strongest measured evidence in the corpus. Superpowers states the reason this is also written into
the brief as a sentence: *"every reviewer a worker spawned duplicated the task review the controller
dispatched anyway — a full extra review seat per task"* (PRODUCERS.md §3.14).

**The orchestrator sequences both.** That is not a limitation being worked around; it is
PRODUCERS.md §6.4's finding — *the separation that matters is who dispatches and with what context,
not how many role files exist.*

### 9.2 The three real sequences

**A · Designer alone — the default for user-facing work (§2).** One dispatch. Designer builds the
surface, runs the loop, returns. Most design slices are this, and a builder is never involved.

**B · Builder → designer, sequential, two slices.** The surface needs data that does not exist yet.
Builder's slice lands the route, the schema, the query; designer's slice lands what it looks like.
**They are two slices with disjoint `files` arrays**, which the §2.4 overlap pre-check enforces before
either is dispatched. What passes between them is what passes between any two slices:
`{branch, base, head, files_changed}` — enough to compute the diff — **and not the builder's
reasoning**. The orchestrator carries the campaign context; neither producer sees the other's brief
(PRODUCERS.md §3.10).

**C · Builder alone — the prototype path.** Named `disposable: true` in the brief. If it survives, it
gets a design pass before a customer sees it (§2.2).

### 9.3 What designer needs in the brief that builder does not

Four things, or the loop cannot start (PRODUCERS.md §4.10), plus one this document adds:

1. **`design/INDEX.md`** — the path, named, not "the design system" in the abstract (§7.2).
2. **The run command and the assigned port** (§8.1).
3. **The routes in scope.**
4. **The base commit.**
5. **`design/system/audience.md`'s answer, or an explicit `unanswered`** — because a design pass
   against an unnamed audience is where taste re-enters through the door the `design` lens closed
   (`lenses.yml:143` refuses *"feedback such as 'the spacing looks off' with no measurement"*, and an
   unnamed audience makes every rule unmeasurable).

### 9.4 What designer hands back

`DESIGNER_RETURN` (PRODUCERS.md §4.7) unchanged, with one field this document makes load-bearing:
**`proposed_rules`**. `designer.md:115` says *"DO NOT invent a design rule. Return BLOCKED and let the
system gain one deliberately"* — and there is **no path by which the system gains one**. With
`design/system/` existing, the path is concrete: designer proposes, the orchestrator writes the
accepted proposal into the named file, the tokens regenerate, and the loop terminates. **Proposal is
not authorship**, so the container boundary holds, and the design system gets better every time it is
found insufficient instead of once when someone remembers.

---

## 10. What I could not determine

Stated plainly, because a labelled gap is worth more than a confident guess.

1. **Whether `allowed-tools:` binds on the `skills:` frontmatter injection path specifically.** The
   binary proves the field is parsed, stored and described as narrowing *"while this file is active."*
   It does not prove identical behaviour across all three load paths. §5.4 names the one-afternoon
   probe. **Until it runs, treat it as binding** — that direction fails closed.
2. **The Krehel repo's star count and contributor list.** GitHub renders both from JavaScript and the
   fetch could not resolve past the loader. The MIT licence, the 61 commits, the 2026-08-14 last
   commit and the four skills' contents are all first-party verified; the popularity figure is not,
   and nothing in §4 depends on it.
3. **Whether `playwright-cli` writes the screenshot and the aria snapshot as one artifact or two.**
   The docs describe them as separate commands. PRODUCERS.md §10.1 records them as written
   "alongside" each other; that overstates what the docs say. It does not matter for §8.2, which
   drives the library and writes both explicitly.
4. **Whether an eight-skill knowledge base actually produces better surfaces than three.** Nobody in
   the field has an A/B harness for skill sets any more than for rosters (ROSTER-SIZE §3). Anthropic's
   `skill-creator` ships the instrument — `evals.json` → isolated subagent per case → `grading.json` →
   `benchmark.json` comparing with-X and without-X. **Point it at this list one skill at a time.** It
   can kill any of the eight as easily as vindicate it, and either result is worth having.
5. **Whether the design pass produces a better product at all**, which is ROSTER-SIZE's own **F5** and
   remains unrun: twenty seeded rendered defects, a browser-holding reviewer against a source-reading
   one. That probe governs the browser grant. **This document adds a second one that governs the
   knowledge base and is independent of it** — because §1.4's two arguments stand or fall separately,
   and a system that cannot tell which one failed will fix the wrong thing.

---

*Written 2026-08-14 against commit `ca27022`. Every `file:line` was opened while writing it; every
command output quoted was run on this machine on that date; every external URL carries the same access
date. Two claims that arrived as established fact were checked and found wrong — `design-audit`'s
absence (§6.3) and `allowed-tools:`'s harmlessness (§5.2) — and both corrections are load-bearing. The
parts that are judgements rather than measurements are §2's routing default, §4's cut at eight skills,
and §7's directory shape; each is labelled where it is made, and §10 lists what would settle it.*
