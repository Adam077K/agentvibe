# The full system spec · Group B · territories 08–14

```
written: 2026-09-02 · framer, group B · brief: vision/01-SPEC-BRIEF.md
sources: vision/2026-09-02-THE-PICTURE.md (primary) · STARTUP-OS.md Part II §8–§14 + Part IV
         vision/2026-09-02-{flywheel,founder,machine}.md §2 rows 08–14, machine §5
covers: 08 Quality & truth · 09 Control & safety · 10 Surfaces · 11 Runtime
        12 Self-improvement · 13 Economics · 14 The company itself
status: a specification of the full-scale system, with the year-one slice inside it. Nothing here is
        decided beyond what Part IV already decided; nothing here authorises work.
```

**Three reading rules, and they are the whole contract of this document.**

1. **Every rule names the mechanism that enforces it, or carries `WISH`.** A `WISH` is not a defect; it is
   an honest label on a rule nothing checks yet. Fourteen appear below and each names what would make it a
   mechanism.
2. **Every number the visions supplied is labelled `[illustration]`.** It is a shape, not a measurement.
   Numbers labelled `[measured]` carry their date and their command. There is no third category, and a
   figure with neither label is a defect in this file.
3. **Year one is the Mac.** The founder deferred the always-on host on 2026-09-02 (Part IV, choice 6) until
   the first measured overnight. Every growth path below therefore has the host as a *later stage entered by
   a trigger*, never as a year-one assumption, and no section of this file uses the phrase 24/7.

**Two seams this group shares with group C, stated once so neither file claims the other's ground.**
Territory **09 owns refusal** — rings, the classifier, the kill switches, the checks the mouth performs, the
damage ceiling. Territory **16 (spec-C) owns granting** — minting, attenuation, expiry, audit, widening,
revocation. The picture created 16 precisely because *"nothing in the fourteen is about granting"*, so 09
below describes the warrant only as an object it **verifies and refuses against**, never as one it issues.
Likewise territory **10 owns the rendering of a fused card**; territory **17 owns the attention budget the
fuse spends against**. The fuse's expiry itself belongs to neither: it is one field read by both, which is
the picture's `NEW` claim that the fuse and the warrant are one object seen from two sides.

---

## 08 · Quality & truth

**At full scale — what it IS.**
The company's judgement of its own work is arithmetic over findings, and the only thing that ever produces a
number is a counter. A move's artifact passes through three stages in a fixed order, and the order is the
design: **deterministic oracle → hygiene linter → (optionally) a findings-only panel → deterministic
selection**. No model is asked anything until the first two have run and their findings are on disk, because
a model asked to look at a page with lorem ipsum on it will spend its attention on the lorem ipsum.

`scripts/loop/oracle.mjs --type <page|code|image|video|copy> --artifact <path> --json` is the first stage and
is pure: `code` runs `npm run check`; `page` takes a Playwright screenshot at 1280×800 and 390×844, asserts
non-blank, resolves every internal link and asserts zero console errors; `image` reads `sips -g pixelHeight
-g pixelWidth`; `video` reads `ffprobe` streams and duration; `copy` asserts non-empty with resolving links.
Exit 0 or 1 plus findings on stdout. **Rung 0 is defined as oracle pass and nothing else.**

`scripts/embarrass.mjs <path>` is the second and catches placeholders, TODOs, `#` hrefs, unreplaced template
variables, alt text equal to the filename, and off-palette colour against the venture's declared palette. It
is **hygiene and is rendered as hygiene**, never as taste, because a linter that reports on taste teaches the
founder to distrust the linter.

Every finding anywhere in the system, from an oracle or a judge alike, is one shape:

```yaml
# findings.yml — written beside the artifact, read by select.js and the balcony
- id:        f-4471-03
  task:      M-0007.3.1#2v4
  severity:  P1 | P2 | P3
  where:     ventures/pinefall/staged/M-0007.3.1#2v4/index.html:41
  what:      "alt text equals the filename"          # one line, no score
  found_by:  oracle:page | embarrass | judge:claude | judge:gemini
```

There is no `total`, no `score`, no `rank` and no `weight` field, at any scale, in any file. `LADDERS.yml`
at the repo root declares rungs 0–4 per artifact type, and a claim's assertion string is **generated** from
its rung by `scripts/lib/claims.js`, so a rung-0 result is structurally incapable of being phrased as a
rung-2 one:

```yaml
page:
  0: {name: "it renders",                     resolver: command, test: "node scripts/loop/oracle.mjs --type page"}
  1: {name: "a stranger understands it in 5s", resolver: human}
  2: {name: "someone clicked",                resolver: world, instrument: analytics, threshold: ">=1 click"}
  3: {name: "someone came back",              resolver: world, instrument: analytics, threshold: ">=1 return in 14d"}
  4: {name: "someone paid",                   resolver: world, instrument: stripe_ro, threshold: ">=1 paid invoice"}
```

The panel, when it exists, returns findings and nothing else. Judges compare blind: identity stripped, order
randomised, the swapped twin run, and **a pair that flips resolves `unresolved`, never to a winner**. The
panel holds ≥ 2 model families and **the second seat may be empty; empty resolves `unresolved`, never
`pass`.** Selection is `scripts/lib/select.js`, pure and total: eliminate every candidate carrying a P1,
prefer the fewest distinct P2s, tie-break on archive distance from `scripts/lib/distance.js` (trigram
Jaccard). **No judge, of any family, ever resolves a done-test.** Taste enters exactly twice and never as a
number: `TASTE.md` before MAKE, and the founder's tap after.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `scripts/loop/oracle.mjs` | deterministic per-type check, stage one | written by harness · read by `tick.mjs` |
| `scripts/embarrass.mjs` | hygiene linter, stage two | harness · `tick.mjs`, balcony |
| `LADDERS.yml` | rungs 0–4 per artifact type, thresholds, instruments | founder writes · `claims.js`, `check-donetests.mjs` read |
| `scripts/lib/select.js` | pure findings → pick | harness · `tick.mjs` |
| `scripts/lib/distance.js` | trigram Jaccard over candidate text | harness · `select.js`, `orient.mjs` |
| `scripts/panel.mjs` | dispatches judge seats, returns findings | harness · `select.js` |
| `findings.yml` per candidate | the one finding shape | oracle / embarrass / panel · `select.js`, balcony |
| `scripts/world.mjs` | deterministic parse of an instrument into a reading | harness · `EXPOSURES.yml` |
| `claim-world`, `claim-judge-external` | ledger resolvers | `resolvers.js` · `ledger.mjs` |
| `scripts/verdict.mjs --subject-kind diff\|artifact` | binds a verdict to bytes | harness · `qa-lead-pass.yml` |

**Enforced by.**

| rule | mechanism |
|---|---|
| The oracle runs before any model is dispatched | `tick.test.mjs` — a recorded move whose `panel.*` row precedes its `oracle.*` row fails |
| No summed or averaged score exists anywhere | `select.test.mjs` — no numeric `total` under `.claude/workflows/` or `packs/`; the findings schema refuses unknown keys |
| No judge resolves a done-test | `check-donetests.mjs` fails `resolver: judge` |
| A rung may not exceed what its resolver kind can establish | `schema-lint.js` predicate on `LADDERS.yml` |
| An empty judge seat resolves `unresolved`, never `pass` | `ledger.test.mjs`, which already pins `unresolved` as distinct from `pass` for every resolver (Rule 10) |
| A flipped blind pair resolves `unresolved` | `panel.test.mjs` — the swapped twin is a required second call, and disagreement is a terminal value |
| Same findings produce the same pick | `select.test.mjs` determinism case |
| An unreachable instrument reads `unresolved` | `claim-world` resolver; `ledger.test.mjs` |
| Embarrassment findings render as hygiene, never as taste | `briefing.test.mjs` — a `found_by: embarrass` finding rendered under a taste heading fails |
| A verdict binds to the artifact's bytes, not to a branch | `verdict.mjs --subject-kind artifact`, `sha256(bytes)`; `verdict.test.mjs` pins the two kinds apart |
| Below-threshold sample sizes resolve `unresolved` rather than `pass` | **WISH** — the power calculation in the resolver is designed and unbuilt. Becomes a mechanism the first time a rung-2 threshold is written with a denominator |

**Year one — the slice.**
`oracle.mjs` (rung 0), `embarrass.mjs`, `select.js`, `distance.js`, `LADDERS.yml`, `claim-world` registered
and returning its first `unresolved`. **`design.js`'s `total` is deleted.** Rung 1 is `resolver: human` and
is the founder or one stranger at the tap. **No model judge anywhere**, and this ordering is deliberate: the
deterministic selector is the durable half and the panel is an optional input to it, so building the
selector first and leaving its panel input empty is the correct sequence and should not be inverted to chase
a second family. The verdict subject generalisation is not in the thirty days, because the first artifact is
a diff. One `gemini -p` run from the harness, outside the sandbox, fail-closed on empty stdout, sits at step
14 as **a measurement of the single-family risk carried to 2026-11-17, not a mechanism.**

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| the founder's promotion disagrees with the nominated cell in 3 rounds | the findings-only panel, one seat, Claude |
| a rung ≥ 2 done-test needs a judgement no command can make | the panel becomes an input to `select.js` rather than a report |
| one `gemini -p` run from the harness returns non-empty findings on stdout | the second family becomes a real seat; empty stdout keeps resolving `unresolved` |
| the second pack family ships a non-code artifact | `verdict.mjs --subject-kind artifact` with the test pinning the two kinds apart |
| a variation round exceeds 8 candidates | blind pairwise with order randomisation and the swapped twin |
| the first rung-2 threshold is written with a denominator | the power calculation in the resolver; below threshold → `unresolved`, counted |
| 3 consecutive months of `no_data` on one venture's register | the run is reported as a finding **about the instrument**, and `AUDIENCE.yml` (spec-C §15) becomes the read |

**Would have to be true.**
1. **The world answers**, so outcomes are readings rather than `no_data`. If false, every rung above 1 is
   aspirational and the ladder should say so out loud. **Measurable in 30 days — partially**: the ratio over
   the first five exposures is suggestive and must be reported as suggestive.
2. **A deterministic oracle covers enough artifact types to be the first stage.** Measurable in 30 days: the
   page oracle depends on Playwright, which is `[measured]` failing across two scopes and is fixed at step 4.
3. **A second model family is reachable from the harness.** Measurable in 30 days: one `gemini -p` run.

**grafted_from.** picture §2/08, §6 rows 3, 11, 14 · flywheel §2/08 · founder §2/08 · machine §2/08 · frame
§8 · C1 C8 C17 C18 C19 C20 C22 C38 W1 W2 A1 T3.

---

## 09 · Control & safety

**At full scale — what it IS.**
Safety is the absence of a string, not the presence of an instruction. **Three rings, distinguished by
credential and argv, never by prompt.** A ring-0 maker cannot exfiltrate because there is no key in its
environment and no sending tool in its argv; it cannot be argued into publishing because
`mcp__ayrshare__post` is not a string in the process. Injection still works — a fetched page can absolutely
convince a maker to write a malicious file — **but a file is inert until the mouth acts on it, and the mouth
requires a warrant naming that file's hash.**

| ring | what it holds | count at night | what it can lose |
|---|---|---|---|
| **0 · makers** | `Read Write Edit Bash Glob Grep`, one worktree. No network, no credential in env, no MCP | 8 `[illustration]` | its own worktree |
| **1 · readers** | network read plus credentials read-only **by the vendor's construction** | 2–6 `[illustration]` | nothing; it cannot write |
| **2 · the mouth** | every outbound credential, single-threaded, **no model in the process** | exactly 1 | bounded, and the bound is printed |

Ring 1 is where the vendor narrows for free: a Stripe restricted key, a fine-grained PAT, a read-only MCP
endpoint, a scoped service account. **Where no read-only credential exists, the hand is not a ring-1 hand.**

**Risk has three axes on one classifier**, and there is never a second implementation, because this repo has
already paid to learn what two deciders cost. `scripts/lib/classifier.js` computes `path` (what it touches),
`reach` (`local · outbound-read · outbound-write · spends · speaks-as`) and **`rate`** (how much, how often,
in what window). **Effective tier is the max of the three.** Floors are data in `.claude/qa-tier-floor.yml`,
never constants in code.

Anything carrying `blast_radius: stranger|public` or `reversible: no` is `blocking-human` **by type, not by
policy**. A `kind: human` gate carries no `run:` key and writing one is refused at schema time, so **no mode,
no flag and no chain of reasoning can clear it** — which is the property that makes it safe to leave one
standing overnight.

**Three kill switches, none of them in a prompt**, and they stop different things on purpose: `launchctl
bootout gui/501/ai.agentvibe.tick` removes the scheduler; `touch ~/.agentvibe/STOP` is a file checked first
at every dispatch and reachable from a phone, **and if the check itself errors the dispatch refuses**;
`STEER.md`'s `stop:` halts at the next durable artifact rather than the next token.

**Maximum damage on the worst possible night is a number the founder sets and the balcony prints**, computed
as the sum of outstanding warrant caveats: *"tonight the machine may spend $X, publish to N accounts, email
M named humans and deploy K previews."* The value of that sentence is not that the numbers are small; it is
that they are **numbers**, they appear where the founder already looks, and they are edited in a file in
daylight rather than argued with at 3am.

The mouth's checks, in order, each failure a refusal plus a morning row: STOP absent · the warrant's HMAC
chain verifies · `not_before` passed and `expires` not · the named artifact exists and its sha256 matches ·
`taint: clean` or a morning release exists · every human recipient is in `people.yml`, with first contact a
strictly narrower permission than reply-in-thread · per-hand hour/day/night counters under ceiling · today's
spend plus this caveat under the daily ceiling. **Minting, attenuation and revocation of that warrant are
territory 16 and are specified in spec-C.**

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `scripts/lib/classifier.js` | the one risk decider, three axes | harness · `pack.mjs`, `tick.mjs`, `qa.js` |
| `.claude/qa-tier-floor.yml` | floors as data, including `reach_floors:` | founder · `classifier.js` |
| `.claude/gates.yml` | gate declarations; `kind: human` carries no `run:` | founder · `check-gates.mjs` |
| `~/.agentvibe/STOP` | the kill file, `touch`-created | founder or phone · every dispatch, first |
| `STEER.md` `stop:` | the andon cord, halts at next durable artifact | founder · `tick.mjs` |
| `.claude/hooks/pre-tool-use.sh` | layer two, the only blocking hook (`exit 2`) | unchanged · the runtime |
| `bin/mouth.mjs` | ring 2, eight checks, **no model** | harness · `outbound.q`, `WARRANTS.jsonl`, `people.yml` |
| `policy/rates.yml` | per-hand hour/day/night ceilings | founder · mouth, `pack.mjs` |
| `policy/humans.yml` | the named-human register | founder · mouth |
| `scripts/authority.mjs` | prints tonight's maximum damage | harness · balcony, briefing |

**Enforced by.**

| rule | mechanism |
|---|---|
| A maker cannot publish, send, spend or contact | **argv absence** — the tool name is not a string in the process. `pack.test.mjs` fails any argv containing a denied name |
| A maker cannot reach a user-scope MCP server | `--strict-mcp-config`, **`[measured]` 2026-09-02**: user-scope servers are *absent*, not denied |
| A denied built-in tool is absent | **`[measured]` 2026-09-02**: `--disallowedTools Bash` → child reports `BASH_UNAVAILABLE`, exit 0, `is_error: false`, $0.088 |
| One classifier, never two | `classifier.test.mjs` reach cases · refusal 10, `reopen: never` |
| Effective tier is the max of three axes | `classifier.test.mjs` — a `local` path with `reach: spends` must tier `irreversible` |
| An `irreversible` pack with no human gate cannot compile | `gates.test.mjs`; `tick.mjs` step 7 refuses |
| A `kind: human` gate cannot carry `run:` | **schema refusal** in `check-gates.mjs`; `gates.test.mjs` |
| STOP is checked first, and an erroring check refuses | `loop.test.mjs` |
| A second layer exists under the argv | `pre-tool-use.sh` exit 2. **`[measured]` true for `Write` under `claude -p`, 2026-09-02**; the Bash path is measured from a terminal or launchd, never from inside a session |
| Foreign content narrows the grant | **WISH** at the taint-flag level. The *argv* leg is physics and is built: a fetch enters only the `orient` grant, which holds no `Write`, `Edit`, `Bash` or outbound tool. The stamp that survives into the artifact is the wish |
| Content arriving by a path the wrapper does not mediate is tainted | **WISH**, and stated as the known hole: nothing notices |
| Tool matching on structured input rather than the command string | **WISH** — `( npx --version )` already defeats the string matcher `[measured, this repo]`. Becomes a mechanism when the hook reads `tool_input` |

**Year one — the slice.**
The seam is **argv absence plus `pre-tool-use.sh` exit 2, untouched**. Every other hook is telemetry: Stop,
SubagentStop and SessionEnd registered for rows only, in the same founder settings edit as `budget-guard.js`.
No `policies.yml` — a registry whose handlers cannot refuse is enforcement-shaped prose. `classifyGrant({paths,
reach})` lands with floors as data; **every pack is `reach: local`, so the `outbound-approval` gate gets its
caller before any hand exists.** The rate axis exists in its degenerate form: `usd_per_day: null` and
`pack.mjs` refusing to compile `reach: spends` while it is null, which **is** the full-scale mechanism of
"refuse when the meter is unreadable", read at the only value it can currently hold. `warrant_kind:` is a
declared-enum label on the pack schema (`none | standing | morning`), read by nothing, refused if not in the
enum — a tested home for `artifact_sha256`, `not_before` and an attenuation chain, bought for one line and one
test. The 3am never-list stands: never publish, send, spend, contact, merge, or edit `TASTE.md`,
`MISSIONS.yml` intent, `settings.json`, workflows or a plist. **The residual eight are accepted in writing**,
and the first of them is the one to keep saying: the sandbox is a guardrail against accident, not containment
against the agent.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| `EXPOSURES.yml` shows the founder performing the same outbound act by hand 3× | the `send` verb reopens for that one act; the five-part hand admission test (spec-C) applies |
| the first `reach: outbound-write` pack is proposed | run `grep -rn 'reach' scripts/loop/ packs/` and count the deciders. **One file → the warrant is a small addition. Two → it is a rewrite** |
| the first outbound hand is admitted | ring 2 becomes a process: `bin/mouth.mjs` with its eight checks, and `policy/humans.yml` gets its first row |
| the founder writes a non-null `usd_per_day` in `LIMITS.yml` | the rate axis becomes a table keyed on (venture × hand × day), read at argv compile time |
| a fourth distinct refusal is needed at `tool_call` | the handler registry reopens — and not before, because three controls did not need a fourth thing |
| the first fetched body needs to reach a producing context | it does not. `reopen: never`. The mediated form is a fetch into a no-Write argv, which already exists |
| any hook is observed matching a command string that `( … )` defeats | matching moves to structured `tool_input` |

**Would have to be true.**
1. **`--allowedTools` produces absence, not denial, on every path — built-in, MCP, and under launchd.** If
   false, every "safe by construction" claim is denial in the costume of physics, the rings collapse into
   one, and the honest posture is that nothing runs unattended holding any credential. **Measurable in 30
   days, and it is the cheapest measurement in the document.** Half is `[measured]` true already; the
   unmeasured half is H2, what a dispatched process can actually *touch*, where the precedent finding was a
   silent no-op rather than an error.
2. **Authority stays computed in exactly one place.** **Measurable in 30 days**, trivially: count the
   deciders.
3. **A process with no model can hold the credentials** — every outbound hand has a call shape checkable
   without reasoning: a target, a hash, a recipient, a count. Not measurable in 30 days, and it does not need
   to be: **the founder is the mouth in year one**, which is exactly why this is deferrable.

**grafted_from.** picture §1 (the physics line, the process list), §2/09, §6 rows 2, 5, 10, 13 · machine
§5.1, §5.2, §5.4 · founder §2/09 · flywheel §2/09 · frame §9, §16 items 1–4, 10, 11 · R1 R2 R3 R4 R5 R6 H3
H4 RT3 S3 A5 A6.

---

## 10 · Surfaces

**At full scale — what it IS.**
**One queue, not seven views.** Three renderers sit over one event log — founder, operator, auditor — and a
test asserts all three render from the same query, because a company whose cost figures come from two
pipelines that disagree, with a third richer source nobody reads, has three numbers and no number.

The founder's renderer prints **goal-sized rows, one line each, every row carrying `say:`** — ≤ 15 words, no
paths, no hashes — **written at emission by the thing that knew what happened.** Voice reads a field; there
is no model between what happened and what the founder hears. A queue of decisions, never a dashboard of
activity:

```
RELEASES · 6 [illustration]        night of 11→12 Sep · $41.20 · 0 interruptions · rope 41%
 1 Pinefall  returning-user surface — two finalists, pick one     [A] [B] [neither]
 2 Corvid    essay "The cost of being early" — ready to publish   [go] [hold] [edit]  fuses 18:00 → hold
 3 Pinefall  pricing page copy: 3 words                           [go] [no]           fuses 20:00 → no
 6 Lantern   invoice #0091 drafted, £4,800, unsent                [send] [edit] [hold] NEVER fuses
BLOCKED · 2   SHELF · +14   ASKS · 1   NEXT · m-8802 instead of m-8814 (why: ⏎)
```

**Four verbs with deliberately unequal yields**, and the inequality is the design:

| verb | what it leaves behind | yield |
|---|---|---|
| **promote** | a preference pair — two artifacts, the pick, one sentence of why | **highest.** Attention converted into a reusable calibration example at zero marginal cost |
| **annotate** | a line in `TASTE.md` | high, and rare |
| **approve** | a disposition on one exposure | low. It gates one artifact and teaches nothing |
| **redirect** | a steer on a named task | low, **and a symptom** — a high redirect rate is a brief defect, not a worker defect |

So the surface **shows the round, not the pick**: the nominated cell plus up to three others ordered by
archive distance, each with a ≤ 60-word pitch. A founder choosing between three produces an asset; a founder
approving one produces a signature. `promote` is built to be **cheaper** than `approve`.

A decision card is one shape and **reversibility is its first line, before the recommendation**, because a
founder reading fast reads the first line:

```
CARD  v3-billing-live · irreversible · fuses Thu 09:00 → DEFAULT: do not ship
REVERSIBILITY   Money moves. A refund is possible; a chargeback is not. Not revertible by git.
THE CASE FOR    [≤4 lines, each sourced]        # written by a worker with no sight of the other
THE CASE AGAINST[≤4 lines, each sourced]        # written by a worker with no sight of the other
WHAT WOULD CHANGE MY MIND   <arithmetic where priority is computed, never a model's opinion>
COST OF WAITING $0/day. Nothing downstream is blocked.
YOU DECIDE BECAUSE  blast_radius: financial. No configuration can clear this one.
```

**Every fusable row carries a fuse: a deadline and a stated default that fires on silence, and the default is
always the reversible branch.** Silence is then recorded as a decision with reason `fused`, never as an
unread item. **Irreversible, financial and first-contact classes carry no default and cannot fuse** — the
schema refuses one. This is the only mechanical answer anyone offered to the frame's own named weakest point:
a queue with no fuse is a queue nobody has to work.

The briefing has four sections **always in one order** — *what changed · what is blocked · what needs you ·
what I would do next* — with the money line first. Each may say "nothing", and **"nothing" is spoken, because
silence is indistinguishable from failure.** Explanation is a **replay, not a generation**: `explain.mjs
<task>` reconstructs the chain from rows and invents no connective tissue, and **an explanation with a hole
says so** and prints `[no record]`. Early on most explanations are mostly holes, which is the surface
reporting honestly that the instrumentation is thin — exactly what you want to know before you trust it.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `scripts/balcony.mjs` | the founder renderer over `events.jsonl`, grouped by task id | harness · founder; writes a `balcony.open` row per invocation |
| `scripts/render/{operator,auditor}.mjs` | the other two renderers, same query | harness · operator, auditor |
| `ventures/<slug>/BRIEFING.md` | four sections plus the money line, generated | briefing job · founder, `say` |
| `scripts/explain.mjs <task>` | replay; `[no record]` at a gap | harness · founder |
| `scripts/promote.mjs <task> <cell>` | the highest-yield verb | **sole writer** of `taste/PAIRS.jsonl` |
| `scripts/expose.mjs <task> --url --check-on` | the approve verb; row 1 of the authority record | harness · `EXPOSURES.yml` |
| `scripts/steer.mjs <task> "…"` | the redirect verb; refused without a task id | founder · `STEER.md` |
| `say:` column on every row | the spoken form, minted at emission | every emitter · voice, balcony, briefing |
| `default_if_unanswered:` on every fusable block | the fuse | worker authors · `tick.mjs` fires it |

**Enforced by.**

| rule | mechanism |
|---|---|
| No row without a task id | `balcony.test.mjs`; `check:taskid` fails any row after the cutover lacking `task` |
| Three renderers, one query | `renderers.test.mjs` — all three must resolve from the same query function; divergence fails |
| `say:` is ≤ 15 words, no `/`, no 7+ hex run | the `say` lint, a suite step |
| The briefing has all sections, in order, "nothing" permitted | `briefing.test.mjs` — a missing section fails |
| `explain.mjs` never bridges a gap with narrative | `explain.test.mjs` asserts `[no record]` on a synthetic hole |
| Only `promote.mjs` writes `PAIRS.jsonl` | a single-writer test over the path |
| `redirect` without a task id is refused | `steer.mjs` argv check |
| A fusable block without `default_if_unanswered:` is refused | **schema refusal**, `missions.test.mjs` |
| An irreversible, financial or first-contact class carrying a default is refused | **schema refusal**, `missions.test.mjs` |
| Reversibility is the card's first line | `card.test.mjs` on the rendered card | 
| The case for and the case against are written by workers with no sight of each other | **WISH** at full scale — it is a dispatch property, and nothing checks that two dispatches did not share a context. Becomes a mechanism when the two are minted as separate task ids and the check is that neither's transcript contains the other's artifact hash |
| The balcony is actually opened | its own done-test: **opened twice unprompted, more than 48 hours apart**, read from `balcony.open` rows |

**Year one — the slice.**
Terminal only. `npm run balcony` prints goal-sized rows; four verbs are four CLI acts; `say:` lands **in the
same change as the task id, on day 3**, because a row emitted without it can never be spoken and backfilling
rewrites every emitter. The 08:00 briefing writes `BRIEFING.md` with the money line first and the four
sections, and `say` speaks its first 200 words. `explain.mjs` replays with `[no record]`. **The fuse lands at
step 6**, in the block schema, with the `fused` disposition as a fourth alongside cleared, escalated and
waived. The phone has exactly one verb, `touch STOP` via a Shortcut. A web UI, voice input and further
notifications are refused, protecting an attention record that reads seven balcony views with one that acts
and eleven mockups unlooked at. **The balcony's own done-test runs in month one**, and if it fails the
approve tap moves to a surface the founder already opens — a `gh pr` comment or the terminal prompt — before
month two. A first `BRIEFING.md` writer over whatever rows exist is handed to the founder **on day 5**, so
the assumption everything rests on is tested before days 6 to 19 are spent on it.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| the balcony passes its own done-test twice over | the operator and auditor renderers, and the test that all three share one query |
| the founder gives the same instruction twice in a form the terminal could not take | the next surface, chosen by what that instruction was — not a web UI by default |
| the first variation round produces > 3 candidates the founder wants to compare | the round view: nominated cell plus three, each with a ≤ 60-word pitch |
| the first `blocking-human` card on an irreversible class | the full card shape, reversibility first, both cases argued separately |
| any card class fuses 11 times running with zero reversals | the machine proposes retiring that class as a card, showing all 11 instances |
| any card class is reversed after fusing, once | **that class can never be auto-retired.** Reversals are counted separately from non-answers |
| `notify_per_day` is hit on 3 days in one week | the cap becomes a meter in `monthly.mjs`, and `DAY.yml` (spec-C §17) follows |

**Would have to be true.**
1. **The founder looks, and looking is cheap enough to keep doing.** All three visions and the frame rank
   this first, and the **`[measured]` base rate of this founder looking is zero**. If false, everything
   collapses, and the correct machine is smaller and stranger: it stages, it does not ask, it keeps no
   register and no rungs, and its value is entirely in the shelf. **That is a real design and it is not this
   one, and a failure here should stop the vision rather than be worked around.** **Measurable in 30 days**,
   twice: the day-8 numbers recorded without chasing, and `BRIEFING.md` opened twice unprompted 48 hours
   apart, from day 5.
2. **A fused default is genuinely the reversible branch**, class by class. Not measurable in 30 days; the
   guard is that the classes which may never fuse are named by type.
3. **`say:` written at emission is better than a summary written at render.** Not measurable in 30 days.

**grafted_from.** picture §1 (07:52), §2/10, §3 row 10, §7 rows 2, 7 · founder §0 (the Deck), §2/10 ·
machine §2/10, §0.4 · flywheel §2/10 · frame §10 · V1 V2 V5 E1 E2 E3 E4 E5 C37 W5.

---

## 11 · Runtime

**At full scale — what it IS.**
One always-on host that is not the founder's laptop, one cloud twin, and **the laptop is a client**. This is
the one place all three visions depart from Decision 4 and all three say so plainly. **It is a purchase, not
a redesign**: the same `tick.mjs`, the same plists, the same paths, because the loop was always crash-only —
read state from disk, take one move, write, exit; recovery is the next tick.

**`launchd` `KeepAlive` supervises the long-lived processes and never the tick.** The mouth, the minter and
the bailiff are long-lived and are kept alive. The tick is a body that exits, so there is nothing to keep
alive, and **a line-1 crash under `KeepAlive` relaunches forever** against a circuit breaker that the
reference implementation everyone copies does not actually contain. Supervision is dual-layer — an inner
watchdog that kills a hung call and records it, an outer daemon that restarts a dead loop — and **neither
supervises the other's failure, which is the point.**

**Every move declares `idempotent: true|false` with no default**, because a default is silently wrong for the
dangerous half. A non-idempotent move takes a lease that survives its death and **is never auto-restarted; it
escalates.**

Models are pinned by id and chosen by job, never globally: Haiku for probes, oracles and triage; Sonnet for
MAKE; Opus for a genuinely novel field and for synthesis; a second family for judge seats and nothing else.
**The model is recorded on the row, because a done-test passed on a cheaper model is a different fact.**

**An absent night is reported as absent, never as quiet.** If both hosts die, the morning queue says
*"nothing ran: unreachable since 01:14"* — Rule 10 applied to the loop itself, and the difference between a
machine that had nothing to do and a machine that was dead.

The loop lives beside the control plane and never inside it. **The zero-exception ban on shell calls under
`mission-control/server/` survives untouched**, because it closed three RCEs.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `~/Library/LaunchAgents/ai.agentvibe.tick.plist` | `caffeinate -i node <abs>/scripts/loop/tick.mjs`, `StartInterval 300`, **no `KeepAlive`** | founder installs · launchd |
| `…ai.agentvibe.watch.plist` | `WatchPaths [STEER.md, ~/.agentvibe/STOP]` → fires a tick | founder · launchd |
| `…ai.agentvibe.briefing.plist` | `StartCalendarInterval 08:00`; also runs `claude mcp list` | founder · launchd |
| `~/.agentvibe/tick.lock` | `openSync 'wx'`, pid inside, stale after 30 min | `tick.mjs` · `tick.mjs` |
| inner watchdog | a node spawn timer sending SIGTERM at `timeout_s` — macOS has no `timeout` binary `[measured]` | `tick.mjs` · outcome `timeout` on the row |
| `sentinel` (later stage) | `launchd KeepAlive` over mouth, minter, bailiff, **never over the tick** | founder · launchd |
| `~/.agentvibe/{tasks,events}.jsonl` | `session_id`, `total_cost_usd`, `num_turns`, `stop_reason`, model id | `logEvent`, `tick.mjs` · balcony, monthly, brakes |
| `scripts/probe-headless.mjs` | the runtime facts, as a suite step | harness · the build |

**Enforced by.**

| rule | mechanism |
|---|---|
| No `KeepAlive` on the tick | `plist.test.mjs` fails the presence of the key |
| Absolute paths and declared log paths in every plist | `plist.test.mjs` |
| Two concurrent ticks produce one move | `tick.test.mjs` via `tick.lock` |
| A hung call is killed and recorded | the inner watchdog; outcome `timeout` on the row |
| A truncated move is never `done` | `return.test.mjs` — `done` with a truncating `stop_reason` becomes `truncated` |
| Compaction is designed out | the process exits. A move that would need it records `truncated`, and the founder splits the leaf |
| A flag that changes meaning fails a build rather than a night | `probe-headless.mjs` as a suite step |
| The control plane cannot spawn a shell | `crosscheck.test.ts`, zero exceptions |
| The sandbox is armed and stays armed | `npm run test:sandbox` fails if `enabled` or `failIfUnavailable` is flipped |
| A non-idempotent move is never auto-restarted | **WISH** until the field exists. Becomes a mechanism the day `idempotent:` is added with no default and the dispatcher reads it |
| An absent night is reported as absent | **WISH** — it needs a liveness row the tick writes and the briefing reads. One row and one branch |
| The phrase 24/7 appears in no artifact | **WISH by discipline, and it is the highest-compliance wish here.** It becomes a mechanism as a one-line grep in the suite over `docs/**` and `.claude/**` |

**Year one — the slice.**
**The Mac, and the founder deferred the host on 2026-09-02 until the first measured overnight** (Part IV,
choice 6). Three plists: tick under `caffeinate -i` at `StartInterval 300` with no `KeepAlive`, watch on
`WatchPaths`, briefing at 08:00. `tick.lock` with a 30-minute staleness. The inner watchdog is a node spawn
timer, because macOS has no `timeout` binary `[measured]`. `tick.mjs` creates the move's worktree itself,
unsandboxed, because **the armed sandbox cannot complete `git worktree add` anywhere** `[measured
2026-08-24: exit 128, 32 denials across `.claude/agents/**`, `.claude/commands/**` and `.mcp.json`]`. Models
pinned by `prompt-standard.test.mjs`: `claude-haiku-4-5` for probes and oracles, `claude-sonnet-5` for MAKE,
`claude-opus-5` for a genuinely novel field, `gemini` from the harness only. **Lid shut, nothing runs, and
the frame says so.** The sentence the company is allowed to say is *"wakes on a schedule, works, sleeps"*,
and it may not say more until `pmset -g` and one measured overnight are on disk. **First unattended run is
daytime, founder present, `reach: local`** — 24 hours of supervision before any unsupervised hour.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| `pmset -g` plus one measured overnight are recorded | the sentence the company may say about its night is rewritten to match the measurement, and only then |
| that measurement shows the usable night below the length one mission needs | the always-on host is purchased. **Same `tick.mjs`, same plists, same paths**; the balcony becomes a client that reads files |
| the host exists and has run 30 days | the cloud twin, as failover only |
| the first long-lived process exists (the mouth) | `sentinel`: `launchd KeepAlive` over it, with the outer circuit breaker written before the process it supervises |
| the first non-idempotent move is authored | `idempotent:` with no default, the lease, and the refusal to auto-restart |
| `probe-headless.mjs` shows process startup dominating a five-minute cycle | `KeepAlive` reopens for the tick — **and only then**, which is the one reopen refusal 14 permits |
| a second lane runs | per-lane locking and per-lane stall scoping via `tasks.jsonl` |
| both hosts are unreachable for one tick interval | the absent-night row and the briefing branch that prints it |

**Would have to be true.**
1. **An always-on host is affordable and the loop is portable to it.** **Measurable in 30 days**: `pmset -g`
   and one measured overnight, both in step 2. If false the picture does not die, it stops being about the
   night: the night is between zero and eight hours and a mission spanning two nights spans an unknown gap.
2. **PreToolUse and Stop hooks fire under `claude -p`, including under launchd.** **Measurable in 30 days**,
   and half is `[measured]` true for `Write`. The Bash path must be measured **from a terminal or from
   launchd, never from inside a session** — a child spawned inside a sandboxed session cannot start its own
   sandbox `[measured 2026-09-02: EPERM on the socket, $0.096]`.
3. **A crash-only body is genuinely portable.** Not measurable in 30 days; it is tested by the move itself.

**grafted_from.** picture §1 (the process list), §2/11, §6 rows 7, 10 · machine §2/11 · founder §2/11 ·
flywheel §2/11 · frame §11, §16 item 14, CONFLICTS RESOLVED (KeepAlive, 24/7 honesty) · RT1 RT2 RT3 S4.

---

## 12 · Self-improvement

**At full scale — what it IS.**
**`scripts/monthly.mjs` is the only self-improvement mechanism in the company, and it is a report, not a
loop**, because every studied system's self-improvement loop was prose that nothing checked ran. It is a
suite step, it always exits 0, and it always prints. What it prints:

- **Last-use per governed artifact**, keyed on task id: skills read, packs dispatched, hands called, check
  steps run, renderers opened. **Zero calls in 90 days computes a retirement candidate** — archival with a
  resolvable stub, never deletion.
- **Founder interventions per surviving exposure**, `undefined` until the denominator is non-zero, **paired
  with the engagement count**, so a fall caused by fewer surviving artifacts cannot read as a win.
- **Archive coverage and promotion rate**, and the archive's own falsifier.
- **Corrections mined from transcripts by regex, not by a model** — a mechanical detector cannot decide that
  something was unimportant, and a model asked to will. Candidates the founder confirms into `TASTE.md`, or
  counts as `none`.
- **Every standing refusal with the command that reads its reopen trigger, and that trigger's current
  reading.** This is the line that makes every other refusal in the system survivable. A refusal with a
  countable trigger and a monthly reader is a decision that expires on schedule; a refusal without one is a
  permanent opinion in a mechanism's clothes.
- **The unspent question budget and the waiver count**, both reported as findings about the machine. Three
  waivers on one block is a decision being avoided.

```yaml
# .out-of-scope/<date>-<slug>.md — frontmatter. The file that makes a refusal a mechanism.
refused:     "any publish, send, spend or contact tool in any argv"
protects:    "the act git revert cannot undo"
reopen_when: "EXPOSURES.yml shows the founder performing the same outbound act by hand 3 times"
reading:     "node scripts/count-hand-acts.mjs --act publish"   # a command, never a description
```

**Nothing merges without a caller in the same diff.** Not a plan to wire it — the wire. This is the one
mechanism that *prevents* the defect that defined the 2026 system rather than detecting it afterwards, and it
matters because six of ten things the founder asked for already existed, connected to nothing, and every
other cure in the building is a detector that runs after the fact.

Everything carries `retire_on`, **staggered at creation**, so a quiet month does not produce fifty
simultaneous decisions. A post-mortem ends in one row with a **Mechanism** column, tags from a closed enum
(wrong target · missing capability · unclear brief · hallucinated fact · budget exhausted · external block ·
tooling defect), and **`none` is permitted and counted**, so a class with three `none`s escalates by the
count rather than by someone remembering. Patterns promote at three independent sightings **to candidacy,
never to an automatic write.** A/B testing of the company's own prompts stays refused at this volume, because
an underpowered comparison read as a result is worse than no comparison.

**Procedure is a depreciating asset; evidence and taste are appreciating ones.** Every model release writes
down the value of accumulated step lists, templates and rubrics, and writes *up* the value of accumulated
exemplars, outcomes and preference pairs. The mechanism already exists and needs only a new target: the
schema predicate refusing `steps:`, `how:`, `method:` and `implementation:`, pointed at packs, briefs and
field notes alike.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `scripts/monthly.mjs` | the report; a suite step, always exits 0, always prints | harness · founder |
| `.out-of-scope/<date>-<slug>.md` | one refusal per file with `reopen_when` and `reading` | any agent refusing · `monthly.mjs` |
| `scripts/mine-corrections.mjs` | ~50-line regex classifier over transcripts | harness · `monthly.mjs`, founder |
| `scripts/check-registration.mjs` | extended with last-use; the retirement computation | harness · `monthly.mjs` |
| `retire_on:` on every governed artifact | staggered sunset | author · `monthly.mjs` |
| post-mortem row with a `Mechanism` column | closed enum, `none` counted | any agent · `monthly.mjs` |
| the `steps:`/`how:`/`method:`/`implementation:` predicate | the anti-procedure brake | `schema-lint.js` · every schema it is pointed at |

**Enforced by.**

| rule | mechanism |
|---|---|
| The report runs and prints | `monthly.mjs` is a suite step; the run fails if any `.out-of-scope` file lacks `reading:` |
| A trigger whose command fails prints `unresolved`, never `pass` | `monthly.mjs`; Rule 10 |
| Retirement is computed, never proposed | `check-registration.mjs` last-use; zero calls in 90 days |
| Nothing is deleted to meet a cap | `evict-memory.mjs` refuses; archival leaves a stub under the original heading |
| Corrections are mined by regex, never by a model | the script holds no model call; a positive control on every extractor so format drift cannot silently take a number to zero |
| A `none` mechanism is counted, not waved through | the closed enum; three `none`s on one class escalates by count |
| A pattern may reach candidacy but never an automatic write | `monthly.mjs` prints candidates; no path writes from them |
| Procedure cannot accumulate in a pack, a brief or a field note | **schema refusal** — the existing predicate, pointed at each |
| Nothing merges without a caller in the same diff | **WISH at full scale, and it is the most consequential wish in this file.** The existing `check-registration.mjs` dead-path check is the detector half. The *preventive* half needs a diff-scoped check in CI that a newly added governed artifact has a caller **in the same diff**, which nothing implements today |
| A/B on the company's own prompts stays refused | refusal, `reopen: none` — under-powered at this volume |

**Year one — the slice.**
`monthly.mjs` runs on day 30 and monthly thereafter. It prints the D15 ratio (harness versus venture session
files, through `classifier.js`), X2 last-use per governed artifact with the 90-day retirement candidate,
SI4 interventions per surviving exposure paired with the balcony-open count, archive coverage and promotion
rate, corrections mined by regex, and **every `.out-of-scope` trigger with its current reading**. Post-mortems
carry the Mechanism column with the closed enum and counted `none`. SI2's promotion at three sightings is
refused, reopening when one approach appears in three missions' rows. SI3's A/B is refused with no reopen.
D8's unification of the four birth-certificate checks is refused: **keep the telemetry, refuse the refactor**,
and unify when a fifth instance is wanted rather than writing one to justify the abstraction.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| `monthly.mjs` has run 3 times | the retirement queue is acted on for the first time; archival with a stub, never deletion |
| one approach appears in three missions' rows | SI2 promotion to **candidacy** reopens |
| a fifth birth-certificate check is wanted | D8's unification into one `hasCaller`, and not before |
| the first governed artifact merges with no caller | the diff-scoped caller check in CI; the wish becomes a mechanism |
| any `.out-of-scope` file's `reading` command fails twice running | that trigger is `unresolved` and the refusal is escalated to the founder as un-monitored |
| a failure class reaches three `none`s | it escalates by the count, into the Friday reckoning |
| a model release changes what MAKE produces at fixed prompt | the depreciation pass: every accumulated rubric and step list is re-valued and the `steps:` predicate is pointed at one more schema |
| the archive has 30 days of cards and zero founder promotions of a non-nominated cell **and** zero ships from one | `archive/` is deleted; `distance.js` and `select.js` are kept. **No round having run is itself the finding** |

**Would have to be true.**
1. **A monthly report the founder reads is enough to make refusals expire on schedule.** This is the same
   assumption as territory 10's, one step removed, and it inherits its risk. **Measurable in 30 days**:
   `monthly.mjs` runs on day 30 and either is read or is not.
2. **A regex classifier catches enough corrections to be worth its positive control.** Not measurable in 30
   days; needs volume.
3. **Retirement by zero-calls-in-90-days does not retire something load-bearing but rarely called.** Not
   measurable in 30 days. The guard is that retirement is archival with a resolvable stub, so the failure is
   recoverable rather than terminal.

**grafted_from.** picture §2/12, §5 (the anti-flywheels), §6 · flywheel §2/12 · founder §2/12 · machine
§2/12 · frame §12, §17 (D8 row) · SI1 SI2 SI4 X1 X2 X3 M1 M2 N4.

---

## 13 · Economics

**At full scale — what it IS.**
Three files, and each holds one constraint: **the rope holds the token window, the rails hold the money, the
limits hold the clock.** The binding constraint changes across the company's life and **naming the change is
the point**: in year one it is a rolling token window shared with the founder, so the mechanism is a reserved
fraction; later it is dollars, so the mechanism is a table of rates. A design that hard-codes the window as
*the* constraint gets rebuilt on the day billing changes.

**The rope never competes with the founder for their own quota.** At the ceiling a safelist still permits
**landing** work — commit, push, `npm run check`, PR, ledger and session writes — because only *starting* new
work is blocked. A machine that cannot land what it already made converts a budget ceiling into lost work.

A hard cost ceiling **downgrades the model rather than stopping the work**, and **fails closed when a model
has no catalogue price** rather than scoring that spend at zero. The model used is recorded on the artifact,
because a done-test passed on a downgraded model is a different fact.

Rates are per **(venture × hand × day)**, read at **argv compile time**, and **the compiler refuses when the
meter is unreadable** — Rule 10 applied to money, and the reason autonomous spend is defensible at all:

```yaml
# policy/rates.yml
pinefall:
  vercel.promote: {per_day: 12, per_night: 4, usd_per_day: 0}
  ads.spend:      {per_day: 1,  per_night: 0, usd_per_day: 40, meter: adwords_ro, max_meter_latency_s: 3600}
```

`ventures/<slug>/PL.md`, monthly, machine-generated by `scripts/pl.mjs`: model spend from `tasks.jsonl` ·
outbound spend from the rails · **revenue read from Stripe as a claim with a `valid_until`, never typed by a
human** · exposures made · exposures at rung ≥ 2 · cost per surviving exposure · founder interventions per
surviving exposure. **An unreachable instrument reads `unresolved`, and `unresolved` months are counted.**
Rung 4 is the strongest evidence this company will ever have, and a rung-4 reading with human provenance is
not one.

**Two numbers drive allocation and neither can be gamed by working harder.** **Cost per surviving exposure**,
printed `undefined` at a zero denominator and never a flattering low number — a month of cheap runs producing
nothing has an undefined cost per surviving exposure, never an excellent one. And **cost to falsify**: the
price of the company's option on being right, which is what makes killing a venture cheap.

Every dispatch records **`instead_of:`**, free when priority is computed, which makes what the company
systematically never gets to visible after six months instead of invisible forever. Portfolio shares carry a
floor and a ceiling reviewed on a cadence, because continuous reallocation is how the loudest venture wins.
**10% of the window is reserved for work with no requested outcome — spent or lost, never banked, never asked
to pay off.**

**Money in is a declared gap in this territory and is named as one.** Nothing in the fourteen covers pricing,
offers, billing, dunning, churn or cohorts, which is to say nothing covers the only rung-4 signal the company
has. The reservation: it enters as **`ventures/<slug>/OFFER.yml`** — price, terms, the dunning path, the
cohort key — read by `pl.mjs` and by the rung-4 resolver, and it lands with the first dollar, not before.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `LIMITS.yml` | rope fraction, stall hours, `usd_per_day`, `notify_per_day`, attempts | founder only, `irreversible` tier · `tick.mjs`, `pack.mjs` |
| `policy/rates.yml` | the rails: per (venture × hand × day), with a meter and a latency bound | founder · `pack.mjs` at compile time, the mouth at execution |
| `scripts/lib/usage.js` `windowUsage()` | the rope's reading, account-wide on purpose | harness · `tick.mjs` |
| `sinceLastArtifact()` | the clock brake; `unresolved` past `RETAIN_HOURS` | harness · `tick.mjs` |
| `.claude/hooks/budget-guard.js` | the registered brake, after the repair | founder registers · the runtime |
| `~/.agentvibe/tasks.jsonl` | `total_cost_usd` per task; prefix sums | `tick.mjs` · `pl.mjs`, `monthly.mjs` |
| `ventures/<slug>/PL.md` | monthly, machine-generated | `pl.mjs` · founder |
| `ventures/<slug>/OFFER.yml` | **reserved**: price, terms, dunning, cohort key | founder · `pl.mjs`, rung-4 resolver |
| `instead_of:` on every dispatch row | opportunity cost, free where priority is computed | `tick.mjs` · `monthly.mjs` |

**Enforced by.**

| rule | mechanism |
|---|---|
| The loop stops itself below the founder's share of the window | `tick.mjs` refuses to dispatch above `rope_fraction`; `usage.test.mjs` |
| A stall is measured, not guessed | `usage.test.mjs` — **a 19h stall and a 6h stall must return different values**, and past-horizon returns `unresolved` |
| Landing work survives the ceiling | the safelist in `tick.mjs`; a test that commit, push, check, PR and ledger writes are permitted at the ceiling |
| Nothing spends while the meter is null | `pack.mjs` refuses `reach: spends` while `usd_per_day` is null; `pack.test.mjs` |
| The compiler refuses when a meter is unreadable | **the same predicate, generalised.** `pack.test.mjs` — an unreadable meter is not a zero |
| A zero denominator prints `undefined` | `pl.mjs`; a test that it never prints `0` or `0.00` for cost per surviving exposure |
| Revenue is never typed by a human | `claim-source`/Stripe resolver with a `valid_until`; a check that `PL.md`'s revenue line carries a claim id |
| `unresolved` months are counted | `pl.mjs` prints the count; `monthly.mjs` carries it |
| A ceiling downgrades rather than stops | **WISH** in year one — EC1 is refused, reopening when a mission is killed by the ceiling twice |
| The explore reservation is spent or lost, never banked | **WISH** — C33 is refused in year one, reopening when the archive passes its falsifier |
| Portfolio shares have a floor and a ceiling | **WISH** — CY2 is refused, reopening with venture two |

**Year one — the slice.**
`LIMITS.yml` at the repo root, founder-only, `irreversible` tier: `rope_fraction: 0.6 · stall_hours: 4 ·
usd_per_day: null · notify_per_day: 3 · attempts_default: 3`. The rope refuses dispatch above its fraction of
the rolling 5-hour window, account-wide on purpose, and the safelist at the ceiling permits landing work. The
circling brake is a **clock**: hours since `lastArtifactAt()` exceeding `stall_hours` brakes and writes a row.
**The stall repair lands before `budget-guard.js` is registered**, because registration before repair is a
believed brake — the most expensive kind. The rate ceiling is the refusal itself: `pack.mjs` refuses `reach:
spends` while `usd_per_day` is null, **nothing spends in year one, and the refusal is the mechanism.** `PL.md`
is generated monthly with revenue read from Stripe as a claim landing with the first dollar. Cost per
surviving exposure prints `undefined` while the denominator is zero. **EC1's downgrade, C33's explore
reservation, C23's boredom detector and CY2's venture shares are all refused**, each with a countable reopen.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| the founder writes a non-null `usd_per_day` in `LIMITS.yml` | money hands become discussable; the rate axis becomes a table |
| a mission is killed by the cost ceiling twice | EC1: the ceiling downgrades the model instead of stopping the work, failing closed on an uncatalogued price |
| the archive passes its own falsifier | C33: 10% of the window reserved for work with no requested outcome |
| venture two exists | CY2: portfolio shares with a floor and a ceiling, reviewed on a cadence, never continuously |
| the first dollar arrives | the Stripe claim resolver, and `OFFER.yml` with price, terms, the dunning path and the cohort key |
| the first hand with a spend caveat is admitted | `policy/rates.yml` with `meter:` and `max_meter_latency_s:`; **above one hour of meter latency it is not a rail and the hand is not admitted** |
| billing moves off the rolling token window | the rope is re-derived against dollars; **the file changes, the mechanism does not** |
| cost per surviving exposure rises for two consecutive quarters on one venture | that venture becomes a wind-down candidate whether or not it is still growing |

**Would have to be true.**
1. **A rate can be enforced *before* the spend.** Some vendors expose a balance in-band; ad platforms
   generally do not expose today's spend with useful latency. If false, autonomous spend is off the table and
   paid distribution stays the founder's hand permanently. Not measurable in 30 days, **and it does not need
   to be: nothing spends in year one, which is why refusal-while-null is the honest year-one mechanism.**
2. **Revenue is readable as a claim rather than typed.** Not measurable in 30 days; there is no dollar. It
   costs nothing today and every month before it is permanently the strongest evidence recorded at the
   weakest standard.
3. **Cost per surviving exposure has a non-zero denominator within a useful horizon.** Partially measurable
   in 30 days: whether *any* exposure reaches rung ≥ 2.

**grafted_from.** picture §2/13, §1 (what it costs), §6 row 9, §7 rows 5, 9 · flywheel §2/13 · founder
§2/13 · machine §2/13, §5.3 · frame §13 · EC1 EC2 EC3 EC4 C33 CY2 R5.

---

## 14 · The company itself

**At full scale — what it IS.**
Four live ventures, one in intake, and a graveyard `[illustration]`. One flagship carrying the revenue, one
media property that **is** the distribution, one experiment run falsifier-first, one services line for
cashflow. **Venture zero is the harness itself, and it gets a declared share of the window with a floor and a
ceiling like any other** — because the alternative, the harness taking everything because it is nearest, is
the exact failure of 2026, when 171 session files were about the harness and none about a customer
`[measured, this repo]`.

**Intake produces exactly three artifacts and stops**: a taste file, one mission with a falsifier, and one
approved done-test at a declared rung. **No move dispatches against a venture missing any of the three**,
which forces the founder's one unavoidable contribution to happen at the only moment it is cheap. One
sitting, machine-drafted and founder-edited. At nine intakes a year that is under six hours annually for the
entire top of the funnel `[illustration]`.

**Wind-down is a harvest, not a cleanup**, and its being compulsory is what makes it an asset rather than a
loss: stop dispatch · resolve every open claim to a disposition, with bulk `deprecate` under one shared reason
allowed and honest · write one dead-end for the venture **as a whole** · archive with a stub. **Field notes
and archive cells survive the venture and stay global**, which is the strongest argument for Decision 9's
split: a dead venture still pays. Twenty-three wound-down ventures at a median of ~$2,400, so $55,000 spent on
being wrong `[illustration]`, buys markets' worth of evidence and a functioning appetite for killing things.

A **second human** is a role with declared decision rights **per decision type**, exactly one accountable, and
a human gate names **which** human. For one founder that field is ceremony, and its entire value is making the
exception visible on the day it arrives rather than on the day after.

**A good year is not revenue up.** It is **founder minutes per week falling while exposures at rung ≥ 2
rise.** Those two moving in opposite directions is the only definition of "the founder stopped being the
bottleneck" that cannot be faked by working harder. Revenue up, exposures up, founder minutes up is a
services business with extra steps, and it does not compound.

**Components.**

| path or process | what it is | writes / reads |
|---|---|---|
| `ventures/<slug>/TASTE.md` | intake artifact 1; founder-only, ≤ 20 lines, `irreversible` tier | founder · MAKE prompt |
| `ventures/<slug>/MISSIONS.yml` | intake artifact 2: one mission with a `falsifier:` | founder (intent), `tick.mjs` (state) · `next.mjs` |
| the approved done-test at a declared rung | intake artifact 3 | founder approves · `check-donetests.mjs` |
| `tick.mjs` intake refusal | refuses to dispatch against a venture missing any of the three | harness · every dispatch |
| `ventures/<slug>/dead-ends/venture.md` | the wind-down harvest, one per venture | wind-down · `orient.mjs`, globally |
| `~/.agentvibe/fields/` | survives the venture, stays global | harness · every MAKE prompt in every venture |
| `decided_by:` / `who:` on every human gate | the second-human seam, ceremony at n=1 | founder · `check-gates.mjs` |
| venture zero's window share | the harness competing for allocation like anything else | founder · the allocator |

**Enforced by.**

| rule | mechanism |
|---|---|
| No dispatch against a venture missing any of the three intake artifacts | `tick.mjs` intake refusal, checked before the pack compiles |
| A mission without a `falsifier:` is refused; `none` is allowed and **counted** | **schema refusal**, `missions.test.mjs`; the count on `monthly.mjs` |
| A done-test with no `rung`, no `approved_by`, or `resolver: judge` is refused | `check-donetests.mjs` |
| A wound-down venture has no unresolved claim and no exposure past `check_on` | a suite check; `check-exposures.mjs` |
| Field notes and archive cells survive wind-down | they live under `~/.agentvibe/` and `archive/`, outside the venture directory. **Geometry, not policy** |
| Every human gate names its decider | `check-gates.mjs` requires `decided_by:` |
| The harness cannot take the whole window by being nearest | **WISH** in year one — D15's ratio is a *report*. It becomes a mechanism when venture shares land with a floor and a ceiling |
| A good year is measured as minutes-down and rung-2-up | **WISH** — both components exist as numbers on `monthly.mjs`; nothing yet asserts the direction. It becomes a mechanism as a two-line check the day both denominators are non-zero |

**Year one — the slice.**
**One venture.** Intake produces the three artifacts and stops; `tick.mjs` refuses to dispatch without them.
Second human: none, and every human gate carries `decided_by: founder`. Wind-down is specified before it is
needed. **Two first missions, answering two questions.** Outside: the founder's demand test on day 1 — one
real page, a real URL, analytics, posted once, with the pass threshold **and the uninformative threshold
written down first**, and the numbers recorded on day 8 without chasing. It is a finding, not a gate. Inside:
the synthetic landing page, rungs 0 to 1, staged, never published. **Then mission 2 is real, made by the
machine and published by the founder's hand inside the thirty days, or the machine has only tested itself.**
That sentence is worth more than any mechanism in this section. **No venture work has ever run through this
harness** — the census reads 171 session files, essentially all about the harness, `ls
docs/08-agents_work/sessions` `[measured, this repo]` — and the founder's decision to finish the harness
first is recorded so that it is a choice rather than an oversight.

**Growth path.**

| trigger (countable) | what lands |
|---|---|
| the first venture has a rung ≥ 2 reading | **venture two.** Not before — a portfolio of unmeasured ventures is not a portfolio |
| venture two exists | portfolio shares with a floor and a ceiling; venture zero declares its own share |
| the same intake question is asked in three intakes | the intake draft is generated, and the founder edits rather than writes |
| a venture's cost per surviving exposure rises for two consecutive quarters | wind-down candidacy, computed rather than felt |
| the first wind-down completes | the harvest checks run for real: claims resolved, one venture dead-end, stub archived |
| someone other than the founder holds a credential this system uses | the second human becomes a role with declared decision rights per decision type |
| a human gate is cleared by someone who is not the founder | `decided_by:` stops being ceremony and starts being read |
| the harness and the ventures compete for the same window in one week | venture zero's floor and ceiling bind, and D15's ratio becomes an input rather than a report |

**Would have to be true.**
1. **Field knowledge transfers across ventures.** If false, the fields are a private diary, four ventures are
   four small companies sharing a host, and the right move is to concentrate rather than diversify. Not
   measurable in 30 days; the frame already dates its falsifier to 2026-12-02 — a field note read by a task
   outside the mission that wrote it.
2. **Mission 2 is real.** **Measurable in 30 days**, and it is the acceptance test of the whole company: an
   artifact the machine made, published by the founder's hand, with a row in the register and a `check_on`.
3. **Nothing under the company's name blows up.** One bad exposure destroys reputational capital faster than
   three years of good ones build it, and the embarrassment linter catches hygiene rather than judgement.
   **There is no good forward test**, which is precisely why this is handled by the physics line and the rails
   rather than by measurement — and it is the assumption most deserving a second pair of eyes before any
   outbound hand is granted.

**grafted_from.** picture §1 (what it makes), §2/14, §6 rows 12, 13 · flywheel §2/14, §1 · founder §2/14 ·
machine §2/14, §1.1 · frame §14, §15 steps 1, 9, 14 · CY1 CY2 CY3 CY4 C36 D5 D7 D15.

---

## Appendix B1 — every `WISH` in this group, and what turns it into a mechanism

Fourteen. A wish is not a defect; an *unlabelled* wish is.

| # | territory | the wish | what turns it into a mechanism |
|---|---|---|---|
| 1 | 08 | below-threshold samples resolve `unresolved` | a power calculation inside the resolver; first rung-2 threshold with a denominator |
| 2 | 09 | foreign content stamps `taint:` into the artifact | the wrapper that fetches writes the stamp. The **argv** leg is already physics and is built |
| 3 | 09 | unmediated foreign content is noticed | nothing notices it today. Stated as the known hole |
| 4 | 09 | tool matching on structured input | the hook reads `tool_input` instead of the command string. `( npx --version )` already defeats the string matcher `[measured]` |
| 5 | 10 | the two cases are argued without sight of each other | mint them as two task ids; assert neither transcript contains the other's artifact hash |
| 6 | 11 | a non-idempotent move is never auto-restarted | the `idempotent:` field with no default, plus the lease |
| 7 | 11 | an absent night is reported as absent | one liveness row and one briefing branch |
| 8 | 11 | the phrase 24/7 appears in no artifact | a one-line grep over `docs/**` and `.claude/**` in the suite |
| 9 | 12 | nothing merges without a caller **in the same diff** | a diff-scoped check in CI. The dead-path check is only the detector half |
| 10 | 13 | a ceiling downgrades rather than stops | EC1 reopens when a mission is killed by the ceiling twice |
| 11 | 13 | the explore reservation is spent or lost | C33 reopens when the archive passes its falsifier |
| 12 | 13 | portfolio shares carry a floor and a ceiling | CY2 reopens with venture two |
| 13 | 14 | the harness cannot take the window by being nearest | venture zero's declared share, with the same floor and ceiling |
| 14 | 14 | a good year is minutes-down and rung-2-up | a two-line check, the day both denominators are non-zero |

## Appendix B2 — the number this group refused to invent

**N, in the standing-warrant rule.** The picture's gate on lever two reads: a class of act earns a standing
warrant when the founder has performed it by hand **N** times through the queue, the machine's nomination
matched the founder's choice on the last **N** occasions, and the exposures of that class resolved at rung
≥ 2 with zero incidents. The machine vision writes 40 `[illustration]`; the frame writes 3 for the narrower
case of a single outbound act repeated by hand. **There is no measurement behind any value of N**, and N is
the single parameter that sets how big the unattended machine may become.

So N is **not written down here**. It goes in `policy/warrants.yml` as `promotion_n: null`, and **the minter
refuses to mint a standing warrant while it is null** — the identical shape as `usd_per_day: null` with
`pack.mjs` refusing `reach: spends`, which is already the frame's honest year-one mechanism for money. The
founder sets N in daylight, in a file, on the day the first class is nominated, with that class's actual
by-hand count in front of them. A number invented today would be a ceiling on the company's autonomy chosen
by an agent with no evidence, disguised as a specification.

Everything else numeric in this file is labelled: `[illustration]` for a vision's shape, `[measured]` with a
date and a command for anything else.
