# Skills — the re-curation for seven engines

**Date:** 2026-08-14 · **Supersedes:** the `skills:` blocks in
[CONTROL-PLANE.md](CONTROL-PLANE.md) §2.4/§3.4, [PRODUCERS.md](PRODUCERS.md) §3.4/§4.4 and
[GRANT-HOLDERS.md](GRANT-HOLDERS.md) §3.6/§4.6/§5.6 · **Status:** proposed

---

## 0. What changed, and the two corrections the brief needs

### 0.1 The budget is superseded — say it in CLAUDE.md, not only here

[CLAUDE.md](../../../CLAUDE.md) "Context Budget — Hard Limits" reads:

> Skills per task: **3-5 for CEO/C-suite/leads · 2-3 for workers** — never preload

**Both halves are now wrong and both must be edited in the same PR as the seven agent files.**

- The **numbers** are superseded: every engine takes **5-8**. The founder has removed token cost from
  the argument (Claude Max), and the three specs each derived "three" by citing that CLAUDE.md line as
  a ceiling — GRANT-HOLDERS §3.6 says it outright: *"Three, at the ceiling for a worker (2-3 per
  CLAUDE.md)."* A budget written for a 26-agent roster of leads and workers is being applied to a
  seven-engine roster that has neither.
- The **taxonomy** is superseded: there are no "leads" and no "workers". Seven engines, one budget.
- **"Never preload" is now precisely half true, and the ambiguity is load-bearing.** `skills:`
  frontmatter *is* preloading — bodies arrive as `isMeta` user messages before turn 1. That is the one
  arrival channel measured to work (288 of 431 transcripts). The rule should read: **Layer 1 is
  preloaded on purpose; Layer 2 is loaded on demand and never preloaded.**

**What replaces cost as the admissible constraint.** Rate-limit headroom in a rolling 5h window,
wall-clock, and *whether the skill changes what the agent does*. Every justification below names a
failure the skill prevents. Where a skill is thin, unfilled or unreachable, it is cut — §5 cuts six,
three of them on evidence found while writing this, one of them a skill a live spec currently assigns.

### 0.2 Four facts in the brief that do not survive checking

| Brief says | Measured 2026-08-14 | Command |
|---|---|---|
| `.claude/skills/` holds **137** | **134** | `node -e "require('./.claude/skills/MANIFEST.json').totalSkills"` → `134`; `ls -d .claude/skills/*/ \| wc -l` → `135`, of which one is `routers/` (not a skill — it holds no `SKILL.md`, by design) |
| `radix-ui-design-system` must be **imported** from antigravity | **already in repo** | `ls .claude/skills/radix-ui-design-system/SKILL.md` → present, 21,715 B; listed in `routers/frontend-design.md` and `CURATION.yml:346` |
| `playwright-skill` is **in antigravity** (implying import) | **already in repo** | `ls .claude/skills/playwright-skill/SKILL.md` → present, 13,889 B; `CURATION.yml:366` |
| `design-audit` **not found anywhere** | **on this machine** | `ls -la ~/.claude/skills/design-audit` → `-> ../../.agents/skills/design-audit`. It is a symlinked global, which is why a `.claude/skills` walk missed it |
| antigravity holds **940** | **937 skill directories** | `ls -d ~/.gemini/antigravity/skills/*/ \| wc -l` → `937` |

None of these changes a recommendation. The `design-audit` one changes `design-lead`'s options, and is
handed over rather than acted on.

---

## 1. The `allowed-tools` hazard — resolved for every assignment below

**Eight of 134 skills declare the field. Here is the complete list, measured, not inherited:**

```
$ grep -l "^allowed-tools:" .claude/skills/*/SKILL.md
database-design           allowed-tools: Read, Write, Edit, Glob, Grep
nextjs-best-practices     allowed-tools: Read, Write, Edit, Glob, Grep
react-patterns            allowed-tools: Read, Write, Edit, Glob, Grep
tailwind-patterns         allowed-tools: Read, Write, Edit, Glob, Grep
tdd-workflow              allowed-tools: Read, Write, Edit, Glob, Grep, Bash
deployment-procedures     allowed-tools: Read, Glob, Grep, Bash
impeccable                allowed-tools: [Bash(npx impeccable *), Bash(node .claude/skills/impeccable/scripts/*)]
pitch-deck-visuals        allowed-tools: Bash(belt *)
```

Five carry `Write, Edit` — matching the brief. **Two carry a `Bash(...)` allowlist and no read tools at
all, and those two are the dangerous shape**, because if the field restricts, a container loading one is
left holding a single clamped `Bash` form and nothing else — no `Read`, no `Glob`, and no `mcp__*`.

**The rule applied throughout this document:**

> No skill declaring `allowed-tools` is assigned to `operator` or `instrument`, and none is imported
> into any engine, until probe **P6** ([CONTROL-PLANE.md §6](CONTROL-PLANE.md)) / **X4**
> ([GRANT-HOLDERS.md §8](GRANT-HOLDERS.md)) resolves. Two probes, one dispatch, and they are the same
> question.

**Result across all seven sets below: zero assigned skills declare the field, with two named exceptions.**

| Exception | Engine | Disposition |
|---|---|---|
| `deployment-procedures` | `operator` | **HELD** — already the flagged case in GRANT-HOLDERS §5.6. Its `allowed-tools: Read, Glob, Grep, Bash` would, if the field restricts, strip every `mcp__*` tool from the container that exists for them. Its slot is filled today by `deployment-pipeline-design`, which declares nothing (§4.7) |
| `impeccable` | `designer` | **FLAGGED to `design-lead`, not assigned here.** Its declaration is two `Bash(...)` forms and *no read tools*. On a container whose whole justification is `mcpServers: [playwright]`, that is the operator hazard pointed at the browser grant. Anyone putting `impeccable` in `designer.md`'s frontmatter should wait for P6 |

**A ninth hazard, and it is not about tool stripping.** `pitch-deck-visuals` declares
`allowed-tools: Bash(belt *)` and requires the `inference.sh` CLI. Measured: `command -v belt` →
**not on PATH**. That is a capability declaration nothing backs — the exact thing `schema-lint.js`
exists to refuse for agents, sitting inside a file the linter does not read. See §5.

**The certain fix, owed regardless of P6** (CONTROL-PLANE §4.5 already specifies it, ~15 lines):
extend `schema-lint.js` so a member of `READ_ONLY_ENGINES` may not declare a skill whose `SKILL.md`
carries write-bearing `allowed-tools`. Add one clause for this document: **and so a credentialed engine
(`operator`, `instrument`) may not declare a skill carrying the field at all.**

---

## 2. Verification method, stated once

Everything below was checked, not assumed.

- **Name resolves:** every in-repo skill was tested against `MANIFEST.json`'s 134 names in a single
  script run. `schema-lint.js:307-316` fails the build on a name that does not resolve, so an
  unresolvable recommendation is a broken build, not a bad suggestion.
- **Size:** `wc -c` on the actual `SKILL.md`. Bundled `resources/` and `references/` are **excluded**,
  because they are not injected — only `SKILL.md` is. This is why several 1.2 kB skills below are not
  "thin": `competitive-landscape`, `startup-metrics-framework`, `sql-optimization-patterns`,
  `gdpr-data-handling`, `wcag-audit-patterns` each dispatch to a `resources/` bundle. Two do not, and
  both are handled in §5.
- **Tokens:** bytes ÷ 3.6, the divisor `scripts/build-skill-routers.mjs:165` already uses. Measured, not
  estimated.
- **`allowed-tools`:** grepped per file, per §1.
- **Import collisions:** every proposed import was checked against `CURATION.yml`'s `role_duplicate`,
  `near_duplicate`, `reconstructible` and `dead_subject` lists. A name on one of those lists cannot be
  imported without a recorded reversal — `scripts/curate-skills.mjs --check` fails if a cut skill
  reappears on disk. One proposed import (`frontend-design`) is on a cut list; its reversal is already
  pre-authorised in `CURATION.yml:285-289`.

---

## 3. The seven sets

### 3.1 `orchestrator` — 8

Was four (CONTROL-PLANE §2.4). Every addition is in repo; none declares `allowed-tools`.

| Skill | B | Status | The failure it prevents |
|---|---|---|---|
| `multi-agent-patterns` | 14,770 | keep | Dispatch topology, fan-out, quorum. The container's core job |
| `dispatching-parallel-agents` | 6,138 | keep | The "is this genuinely independent?" test. Parallelism without it is shared-state corruption |
| `writing-plans` | 3,401 | keep | Decomposition into checkable slices — the input `plan.js`'s `SLICE_SCHEMA` needs and nothing currently produces |
| `verification-before-completion` | 3,646 | keep | Validating a return against the branch/file/artifact instead of against the worker's summary |
| `subagent-driven-development` | 28,077 | **ADD** | **The largest single omission in the current spec.** PRODUCERS §3.10 cites this skill's own measurement — *a real session's dispatch reached 42,000 characters, of which 99% was pasted history* — as the failure the orchestrator will produce by default. The skill states the rule (*"a dispatch prompt describes one task, not the session's history"*) and is 28 kB of procedure for it. It was cited as evidence and then not attached |
| `brainstorming` | 5,164 | **ADD** | Inherited from `framer`, which ROSTER-SIZE §7.6 cuts. Framer's real job — fuzzy ask → validated structure — moves here, and today the only skill for it is declared on a file about to be deleted. `CURATION.yml:271-274` records that this skill survived a cut *because* framer declared it; delete framer without rehoming it and the reversal's premise evaporates |
| `product-manager-toolkit` | 8,975 | **ADD** | RICE, acceptance criteria, PRD shape. ROSTER-SIZE §5.1 assigns "head of product" to the `product` lens *plus this skill*, and §5.2 moves `product`'s `applies_to` to `[orchestrator, builder]`. The orchestrator is the container that writes the frozen spec; exit criteria written without this are prose |
| `thinking-reversibility` | 3,190 | **ADD** | One-way vs two-way doors. This is `classifier.js`'s tier model as a reasoning procedure — the orchestrator's single highest-consequence judgement is which stages halt for a human, and today that judgement has a data file and no method |

**Deleted, and the reason stands:** `context-compression` — advises on a problem the harness solves
automatically. See §5, where it is also cut from the library.

**The caveat that must ship with this list, because it is not a detail.** CONTROL-PLANE §1.1 establishes
that **a session reads no agent file**. `skills:` is file-only and arrives only on the *dispatched*
path. So until depth-2 orchestration exists, the orchestrator-as-session receives **none of these
eight**. The equivalent channel is `CLAUDE.md` + `session-start.js`, and the two lists must not diverge.
Anyone reading this table as "the orchestrator now knows these things" is reading it wrong.

| | |
|---|---|
| **Total** | **73,361 B ≈ 20,378 tokens** |

---

### 3.2 `builder` — 8 in Layer 1, plus an index. Full design in §4

Was three (PRODUCERS §3.4). Layer 1 must be **domain-neutral craft** — the whole point of the two-layer
split is that eight domains cannot fit in one frontmatter slot, so the frontmatter carries what is true
of all eight and the index carries what is true of one.

| Skill | B | Status | The failure it prevents |
|---|---|---|---|
| `verification-before-completion` | 3,646 | keep | Returning COMPLETE on an unverified claim — builder's single largest failure mode, per PRODUCERS §3.4 |
| `systematic-debugging` | 9,918 | keep | Deviation Rule caps at three fix attempts; without a method, three attempts is three guesses |
| `worktree-isolation-pattern` | 6,300 | keep | Step 1 of every dispatch, Agentvibe-authored, and rule 7's only enforcement is a lint *warning* |
| `writing-good-tests` | 8,572 | **ADD** | Bans mirror assertions and change-detector tests. Builder writes tests in every one of its eight domains, and the characteristic defect — a test that asserts the implementation back at itself — passes CI and passes review. `qa.js` grades a `tests` dimension against nothing that names this |
| `full-output-enforcement` | 2,592 | **ADD** | Bans placeholder patterns and truncation. **CLAUDE.md rule 6 — "No placeholder UI, zero tolerance for stubs/TODOs" — is marked `ADVISORY`, "no mechanism", deferred to Phase 4.** This is the nearest thing in the library to a mechanism, and unlike the rule it arrives before turn 1 rather than being hoped for. §5 shows the rule failing *inside the skills library itself*, which is how much it is currently worth |
| `requesting-code-review` | 2,956 | **ADD** | The hand-off protocol: give the reviewer *"precisely crafted context for evaluation, never your session's history"*, plus a read-only contract on the review checkout. Builder's return feeds the reviewer directly; this is what keeps the judge uncontaminated by the producer's rationalisations. `CURATION.yml:199-206` records this skill's cut being reversed for exactly this property |
| `cc-skill-coding-standards` | 11,576 | **ADD** | Universal TS/JS/React/Node standards — which is not "a stack" but *the* stack CLAUDE.md declares. The one Layer-1 skill that is craft rather than process |
| `thinking-map-territory` | 3,338 | **ADD** | *"When a claim, doc, test, metric or assumption conflicts with observed behaviour, stop theorising from the map and verify the live code."* This is the reasoning half of verify-by-running, and it is aimed at the defect class CONTROL-PLANE §6 P1 calls the repo's oldest open mystery — nine-plus silent empty returns with no established cause |

**Deleted, and both deletions stand:** `api-design-principles` and `error-handling-patterns` — backend
skills on a container covering eight domains. **They leave the frontmatter, not the library.** They are
the correct Layer 2 entries for the "REST endpoint" and "error handling" jobs, and `CURATION.yml`'s cut
test 1 forbids removing a skill merely because it is unused *here*. This distinction is the whole reason
Layer 2 exists.

| | |
|---|---|
| **Total, Layer 1** | **48,898 B ≈ 13,583 tokens** |
| **Layer 2 on demand** | `routers/INDEX.md` + one namespace ≈ 1,070 tokens, plus the one `SKILL.md` the row names |

---

### 3.3 `designer` — 6, and the set is `design-lead`'s to finish

A peer agent owns this container's skill set and the external packs. What follows is only **how the set
fits the roster**, plus two findings that belong to whoever writes the file.

| Skill | B | Status | Note |
|---|---|---|---|
| `ui-visual-validator` | 10,017 | keep | The judging half of the perception loop |
| `web-design-guidelines` | 1,231 | keep, **but see below** | The written rule set the loop measures against |
| `ui-typography` | 14,291 | keep | Carries an ENFORCEMENT MODE; typography is the highest-frequency measurable defect in generated UI |
| `wcag-audit-patterns` | 1,508 | **ADD** | The `accessibility` lens is p1-blocking and describes a procedure it does not carry (`grep -n 'id: accessibility' .claude/review-lenses.yml` — the line pin that stood here rotted from 124 to 181 on `integration/design-layer`) |
| `12-principles-of-animation` | 5,045 | **ADD** | 15 concrete timing values across 56 CSS blocks. Models guess easing; they do not reconstruct these (`CURATION.yml:51-54`) |
| `playwright-skill` | 13,889 | **ADD** | Already in repo. The capture half of the loop, in the container that holds the browser grant |

**Two findings for `design-lead`, neither of which this document acts on:**

1. **`impeccable` must not enter this frontmatter before P6.** §1. Its `allowed-tools` is two `Bash(...)`
   forms and *no read tools*; if the field restricts, it strips the `mcp__playwright__*` grant that is
   the container's entire justification, silently, at runtime.
2. **`web-design-guidelines` is a `WebFetch` dispatcher and `designer` holds no `WebFetch`.** Measured —
   the body is 1,231 B and its whole procedure is *"Fetch fresh guidelines before each review"* from
   `raw.githubusercontent.com/vercel-labs/web-interface-guidelines`, four times, via WebFetch. Per
   PRODUCERS §4.2 designer's tools are `Read, Write, Edit, Bash, Glob, Grep`; per CONTROL-PLANE §3.2 the
   reviewer's are `Read, Glob, Grep, Bash`. **Neither can execute this skill as written.** It either
   needs the rules vendored into the repo, or a `Bash`-based fetch step, or it is a pointer to a page
   the agent cannot open. This is not a taste question and it applies to `reviewer` too.

**Style packs are a Layer-2 problem, not a frontmatter problem.** Six sibling variants of one framework
sit in the library — `impeccable`, `high-end-visual-design`, `design-taste-frontend`,
`stitch-design-taste`, `minimalist-ui`, `industrial-brutalist-ui` — and `CURATION.yml:211-228` records,
at length, that collapsing them *"treated a menu as redundancy."* A menu is exactly what an index is
for. §4.5.

| | |
|---|---|
| **Total** | **45,981 B ≈ 12,773 tokens** |

---

### 3.4 `reviewer` — 8

Was three (CONTROL-PLANE §3.4). One import.

| Skill | B | Status | The failure it prevents |
|---|---|---|---|
| `security-audit` | 5,202 | keep | The `security` lens's workflow |
| `production-code-audit` | 15,872 | keep | Carries `correctness` and `patterns` — the two dimensions `qa.js` marks critical |
| `verification-before-completion` | 3,646 | keep | Refuse to report a check you did not run. The anti-sycophancy payload |
| `writing-good-tests` | 8,572 | **ADD** | `qa.js:72-78` runs a `tests` dimension that grades coverage against no stated standard. A diff whose tests are change-detectors currently passes that dimension; this is the only skill in the library that names the defect and gates on it |
| `thinking-red-team` | 4,154 | **ADD** | `review-lenses.yml` declares an `adversarial` lens whose procedure lives nowhere — `qa.js:91-95` carries three verifier postures as three prompt strings in an array. This is the encoded procedure, including *"report only findings with a concrete path"*, which is the discipline that keeps an adversarial pass from becoming a list of vibes |
| `wcag-audit-patterns` | 1,508 | **ADD, unconditionally** | CONTROL-PLANE §3.4 makes it conditional on the browser grant, reasoning that a procedure for evidence you cannot obtain is worse than nothing. **I disagree, and the reason is §3.8 of that same document.** The reviewer must return `BLOCKED` for an unsatisfiable rendered-output lens. A `BLOCKED` that says *"cannot obtain: focus-visible on interactive controls, contrast ratio on the three token pairs"* is actionable; a `BLOCKED` that says *"no browser"* is not. 1,508 B buys specificity in the failure message |
| `stride-analysis-patterns` | 1,085 | **IMPORT** | `security-audit` is a *workflow* — go look for these bug classes. STRIDE is *coverage* — enumerate spoofing/tampering/repudiation/disclosure/DoS/elevation per trust boundary. The difference is whether an unknown bug class can be found at all. 1,085 B, no `allowed-tools`, `~/.gemini/antigravity/skills/stride-analysis-patterns` |
| `thinking-circle-of-competence` | 2,941 | **ADD** | *"Check evidence boundary, size wrongness cost, then answer, fetch, or abstain — never confabulate."* The gate's recorded history is **34 PASS / 0 BLOCK** (ROSTER-SIZE §6). A reviewer with no abstention procedure produces exactly that distribution. This is rule 10 — *a resolver never passes what it could not check* — written for a model instead of a script |

**Deleted, and it stands:** `agent-evaluation` — agent benchmarking, not diff review. §5 cuts it from the
library too.

| | |
|---|---|
| **Total** | **42,980 B ≈ 11,939 tokens** |

---

### 3.5 `sourcer` — 7

Was three (GRANT-HOLDERS §3.6). All in repo. Seven, not eight, and the empty slot is deliberate — see
the closing note.

| Skill | B | Status | The failure it prevents |
|---|---|---|---|
| `deep-research` | 2,934 | keep | The decomposition procedure |
| `competitive-landscape` | 1,203 (+`resources/`) | keep | The highest-frequency sourcer question in a startup |
| `market-sizing-analysis` | 12,844 | keep | The second-highest, and the one where an unsourced number does the most damage |
| `thinking-circle-of-competence` | 2,941 | **ADD** | The engine's entire contract is *never assert without checking*, and today that contract is a sentence in a file body. This is the procedure: evidence boundary → wrongness cost → answer, fetch, or abstain |
| `thinking-probabilistic` | 4,516 | **ADD** | GRANT-HOLDERS §3.9 requires every finding to carry a `confidence`. Nothing anywhere says how to produce one, so it is currently a vibe rendered as a number. Base rates, ranges, prior→likelihood→posterior is how it stops being one |
| `thinking-bounded-rationality` | 2,815 | **ADD** | *"Use when search or investigation could run forever. Set an explicit good-enough threshold first."* This is §3.10 "stop and exhaustion" for a research container, and it is the failure mode of an engine whose escalation trigger is *"the question stays unbounded after one re-scoping"* |
| `thinking-steel-manning` | 3,384 | **ADD** | Sourcer summarises contested markets and competitor claims. Building the strongest opposing case before concluding is the anti-cherry-pick procedure, and it is the difference between a source list and a finding |

**Why seven and not eight.** Sourcer's real deficit is not a missing skill. It is that a claim is emitted
by writing a fenced ` ```claims ` block into a git-tracked file, and sourcer cannot write — so
`claim(kind=external-fact, verified_by=source)`, the literal exit of the two stages that dispatch it,
cannot be produced by the engine dispatched to produce it (GRANT-HOLDERS §3.19). Measured: 31 ledger
claims, exactly one `external-fact`, and it is the deliberately-failing canary. **No skill fixes that.**
Filling the eighth slot to reach a number would be decoration on a capability gap, which is the thing
this repo names as its worst failure mode.

Candidates deliberately rejected: `exa-search`, `tavily-web`, `firecrawl-scraper`, `context7-auto-research`
— all four are in antigravity and all four are procedures for APIs sourcer does not hold. A skill for a
tool the container lacks is noise at any price.

| | |
|---|---|
| **Total** | **30,637 B ≈ 8,510 tokens** |

---

### 3.6 `instrument` — 7, and one of its current three is deleted

Was three (GRANT-HOLDERS §4.6). **One of those three, `segment-cdp`, is an unfilled template and is cut
in §5.** Three imports. None declares `allowed-tools`, and per §1 none ever may.

| Skill | B | Status | The failure it prevents |
|---|---|---|---|
| `startup-metrics-framework` | 1,209 (+`resources/`) | keep | The definitions. The characteristic instrument failure is definitional — what counts as MRR, what window — not a query error |
| `sql-optimization-patterns` | 1,255 (+`resources/`) | keep | A full-table scan on a live DB is a production incident caused by a *read* |
| ~~`segment-cdp`~~ | 1,451 | **CUT — §5** | Nine `\| Issue \| medium \| See docs \|` rows. It is a template nobody filled in |
| `thinking-map-territory` | 3,338 | **ADD** | Instrument *is* the map/territory reconciler — its named escalation trigger is *"a number contradicts a recorded claim"* (GRANT-HOLDERS §4.11). This is the procedure for that exact moment, and it resolves in favour of the territory |
| `gdpr-data-handling` | 1,154 (+`resources/`) | **ADD** | The only container that holds private customer data, in a runtime where everything an agent reads is written permanently to `~/.claude/projects/*.jsonl`. Data minimisation is what keeps a PII row out of a transcript that cannot be un-written. `pre-tool-use.sh:163` blocks `.env` for everyone; nothing blocks a customer table |
| `data-quality-frameworks` | 1,440 | **IMPORT** | Great Expectations, dbt tests, **data contracts**. Replaces `segment-cdp`'s intended job — event-schema literacy — with a version that is actually written. `~/.gemini/antigravity/skills/data-quality-frameworks` |
| `postgres-best-practices` | 2,015 | **IMPORT** | Supabase-authored Postgres performance guidance. `sql-optimization-patterns`' body is 1,255 B of dispatcher; this is the vendor-specific complement for the vendor CLAUDE.md declares. `~/.gemini/antigravity/skills/postgres-best-practices` |
| `kpi-dashboard-design` | 17,837 | **IMPORT** | `docs/09-metrics/{NORTH_STAR,UNIT_ECONOMICS,GROWTH}.md` are unfilled templates (ROSTER-SIZE §4.6). This is metric selection and definition — which number, computed how, refreshed when. The heaviest import proposed and the one with the clearest empty artifact waiting for it |

**Deliberately excluded, and GRANT-HOLDERS §4.6 is right about why:** `postgresql` (16,948 B) and
`supabase-rls-conventions` — both are for someone *designing* schemas. Instrument does not.

**Why seven.** The eighth slot waits on **which analytics system of record exists**. GRANT-HOLDERS §4.7
records that none of the three needed MCP servers exists today. `posthog-automation`, `mixpanel-automation`
and `amplitude-automation` are all in antigravity, all ~8 kB, all clean of `allowed-tools` — and picking
one before the credential is picked is guessing at a vendor. Import the one that matches the server, when
there is a server.

| | |
|---|---|
| **Total** | **28,248 B ≈ 7,847 tokens** |

---

### 3.7 `operator` — 8, of which 7 ship today

Was three, of which GRANT-HOLDERS §5.6 already holds one back. Three imports, all clean of
`allowed-tools`, which is the property that makes them shippable to a credentialed container.

| Skill | B | Status | The failure it prevents |
|---|---|---|---|
| `verification-before-completion` | 3,646 | keep | *"An operator that reports success it did not verify is the nightmare case"* — GRANT-HOLDERS' own words, and the correct emphasis |
| `secrets-management` | 8,124 | keep | Rotation and placement, for the most dangerous credential set in the system |
| `thinking-reversibility` | 3,190 | **ADD** | Two-way doors fast, one-way doors staged. This *is* operator's gate model as a reasoning procedure. `gate: outbound-approval` currently has zero consumers; when it gets one, this is what decides which side of it a step falls on |
| `thinking-margin-of-safety` | 3,423 | **ADD** | *"Size a buffer to residual error and the cost of breach — not to the estimate."* Deploy timeouts, rollback windows, canary percentages, rate limits. Every one of those is a number an operator commits under uncertainty, and every one is currently picked by feel |
| `incident-runbook-templates` | 11,037 | **IMPORT** | **The most on-thesis import in this document.** Operator is pinned `claude-sonnet-5` / `medium` and *deliberately shallow* — *"an operator clever enough to reason its way past a failing precondition is worse than one that is not."* A deliberately shallow executor with no runbook is not shallow, it is guessing. This is the artifact that makes shallowness safe. `~/.gemini/antigravity/skills/incident-runbook-templates` |
| `deployment-pipeline-design` | 8,888 | **IMPORT** | Multi-stage pipelines with approval gates. `ship.js` — preview → smoke → gate → promote → verify → rollback — does not exist and must be written (ROSTER-SIZE §5.2). **This is `deployment-procedures`' slot, filled by a skill that declares no `allowed-tools`**, so it can ship to a credentialed container today rather than after a probe. `~/.gemini/antigravity/skills/deployment-pipeline-design` |
| `database-migration` | 11,099 | **IMPORT** | Zero-downtime strategies and rollback procedures. `qa-tier-floor.yml:50-64` tiers `**/supabase/migrations/**` at `irreversible`/`block`, and ROSTER-SIZE §5.1 assigns migration *application* to operator explicitly. Someone wrote the rule for an act no container had the procedure for. `~/.gemini/antigravity/skills/database-migration` |
| `deployment-procedures` | 5,845 | **HELD — P6/X4** | §1. Add after the probe, not before |

**One import refused, and it is the clearest illustration of §1.** Antigravity ships
`database-migrations-migration-observability` (13,293 B) — genuinely relevant to operator, and it
declares `allowed-tools: Read Write Edit Bash WebFetch`. Attaching it to `operator` would, if the field
restricts, hand a container that is **denied `Write` and `Edit` by design** a skill that names both,
while stripping the `mcp__*` grant it exists for. Refused until P6.

**One import refused for a different and better reason.** `postmortem-writing` (12,515 B) is a good skill
for a real gap — GRANT-HOLDERS §5.15 says a failed rollback is a P0 escalation and nothing records what
happened. But **operator is denied `Write` and `Edit`**, so it cannot produce a postmortem. A skill for
an artifact the container cannot emit is exactly the noise the founder's rule bans. The postmortem is the
orchestrator's, and it should be added there when a `watch.js` exists to trigger one.

| | |
|---|---|
| **Total, 7 shipped** | **49,407 B ≈ 13,724 tokens** |
| **With `deployment-procedures`, post-P6** | 55,252 B ≈ 15,348 tokens |

---

## 4. The builder's two layers, in full

> *"Give him mastery skills, which is like an overall skill zone — coding, creating, all the jobs that
> he does — but then give him another list with the LOCATION of the skills. This is like giving him
> another layer of expertise and knowledge on different jobs that he not usually do... so we're not just
> throwing him into the water because he does a lot of jobs."*

### 4.1 Why the second layer is structural, not a nicety

Three measured facts make this the only available shape:

1. **`skills:` is per-file.** No `skills` option on `agent()`, none on `Agent` (ROSTER-SIZE §2). One
   builder file carries **one** skill set for **nine** former domain engineers.
2. **The prose pointer is the weak channel, and it has been tried.** `design.js:80` carries craft
   specialisation as an instruction — *"MANDATORY: before designing, Read … SKILL.md"* — which is a
   pointer an agent may ignore in place of an injection it cannot refuse. PRODUCERS §3.4 names this
   directly.
3. **92% of the library is unreachable.** 10 of 134 skills are attached to any container (ROSTER-SIZE
   §6). The 124 that are not include every skill that would make an unfamiliar job go well.

Layer 2 is not a way to load more skills. It is a way to make the **selection** deterministic, so that
the strong channel (paste) can be driven by a table lookup instead of by an agent's recall.

### 4.2 What it is

**`.claude/skills/routers/JOBS.md`** — a third discovery tier, generated by extending
**`scripts/build-skill-routers.mjs`**, not by a new script.

One row per job the builder's briefs actually name. Four columns, because the founder asked for
job → skill → *location*:

```markdown
| Job | Load first | Then, if needed | Path |
|---|---|---|---|
| REST or GraphQL endpoint | `api-design-principles` | `error-handling-patterns`, `nodejs-backend-patterns` | `.claude/skills/api-design-principles/SKILL.md` |
| Postgres schema | `database-design` ⚠ | `postgresql`, `supabase-rls-conventions` | `.claude/skills/database-design/SKILL.md` |
| Migration authoring | `postgresql` | `supabase-rls-conventions` | `.claude/skills/postgresql/SKILL.md` |
| React component | `react-patterns` ⚠ | `vercel-composition-patterns`, `tailwind-patterns` ⚠ | `.claude/skills/react-patterns/SKILL.md` |
| Next.js route | `nextjs-app-router-patterns` | `nextjs-best-practices` ⚠ | `.claude/skills/nextjs-app-router-patterns/SKILL.md` |
| Auth flow | `auth-implementation-patterns` | `nextjs-supabase-auth` | … |
| Payments | `stripe-integration` | `payment-integration` | … |
| Background job | `inngest` | — | … |
| CI workflow | `github-actions-templates` | — | … |
| RAG pipeline | `embedding-strategies` | `pgvector-rag-conventions`, `llm-app-patterns` | … |
| MCP server | `mcp-builder` | `tool-design` | … |
| E2E test | `e2e-testing-patterns` | `playwright-skill` | … |
| Technical doc | `doc-coauthoring` | `architecture-decision-records` | … |
| Landing-page copy | `page-cro` | `marketing-psychology`, `seo-content-writer` | … |
```

`⚠` marks a row whose target declares `allowed-tools` (§1). It is rendered by the generator from the
file, not typed by a human, and it exists so that a builder reading the index sees the hazard at the
moment it would load the skill.

**Source of truth:** a new `jobs:` block in `CURATION.yml`, sibling to `namespaces:`. **Data, not a
regex over names** — for the reason the generator already records at line 311: *"A regex that infers
'security' from a filename works until `sharp-edges` or `trust-spec-contracts`, and then it is silently
wrong."*

### 4.3 Why it lives in `routers/` and reuses that generator

`build-skill-routers.mjs` already does four things this index needs, and reusing it means none of them is
written twice:

- It **writes** `.claude/skills/routers/` and **deletes** any file there with no source entry
  (`for (const f of readdirSync(ROUTERS)) if (!want.has(f)) rmSync(...)`). Add `JOBS.md` to the `want`
  map and it is generated, pruned and owned.
- It **`--check`s byte-for-byte in CI** (`npm run check:routers`, blocking in `ci.yml`). Drift between
  the table and the directory becomes a build failure for free.
- It already computes `onDisk`, and already builds a `describe` map from `MANIFEST.json` (line 63) — the
  two inputs every path and every name must be validated against.
- **`routers/` is deliberately outside the skill directories.** The generator's own header explains why:
  a router implemented *as* a skill would land in `MANIFEST.json` and *"inflate the exact file it exists
  to avoid reading."* `JOBS.md` inherits that property. It costs zero tokens on any lookup that does not
  open it.

**Four refuse-to-generate rules**, three of which are the existing checks pointed at new data:

1. **Every `path:` resolves to an existing `SKILL.md`.** Reuses `onDisk`. A dead pointer here is the same
   defect `check-registration.mjs` blocks one directory over.
2. **Every named skill is in `MANIFEST.json`.** Reuses `describe`.
3. **Every job names ≥1 skill, and every skill appears in ≥1 job or in an explicit `jobs_exempt:` list.**
   This is the orphan check from line 79, pointed at jobs instead of namespaces — and it is the rule that
   turns the index into a **coverage instrument**. The `jobs_exempt:` list *is* the answer to "which of
   the 134 does no job reach", which is the 92% number, computed instead of asserted.
4. **NEW, ~10 lines: a job may not point at an `allowed-tools`-declaring skill without `hazard: allowed-tools`
   on the row.** Layer 2 is read on demand by a container that may hold credentials, and P6 is open.
   Forcing the hazard to be typed is what renders the `⚠`.

### 4.4 How the builder is actually told to consult it — three mechanisms, because a pointer is not one

Fact 2 in §4.1 is the whole problem: telling an agent to read a file is the channel that was already
measured to be weak. So the answer is not "put a sentence in `builder.md`."

**(a) A halt condition in the file body, not advice.**

> **Step 0.** If the brief's domain is not one your injected skills cover, open
> `.claude/skills/routers/JOBS.md`, find the row whose **Job** matches the brief, and `Read` the path in
> **Load first**. If no row matches your brief's domain, return **`NEEDS_CONTEXT`** naming the domain.
> Do not proceed on a guess.

The difference from `design.js:80` is that this terminates in a **return value the schema validates**.
An exhortation is ignorable; a `NEEDS_CONTEXT` the orchestrator receives is not.

**(b) The orchestrator pastes; it does not point.** PRODUCERS §3.4 already reached this: the orchestrator
holds `Read`, a `SKILL.md` body is text, and the prompt is a channel that binds. What was missing was
*how the orchestrator knows which skill* — which was left as judgement. `JOBS.md` makes it a table
lookup: match the job, read the `Load first` path, paste the body into the brief. ~500–2,000 orchestrator
tokens per dispatch, and the builder cannot refuse an injection.

**(c) The lookup rides the dispatch schema, so a gap fails at decompose time.** `plan.js`'s
`SLICE_SCHEMA` is specified as `{id, agentType, brief, files}` (ROSTER-SIZE §5.2). **Add one field:
`skills: string[]`, populated from `JOBS.md`.** Then a slice naming a job with no matching row is a
*schema* failure during decomposition — visible at minute one — rather than a silent competence gap
discovered at turn thirty. This is the difference between an index that helps and an index that binds,
and it costs one field.

Ship (a) and (b) with the file. (c) lands with `plan.js`, which `coding.js:20` already refuses to run
without.

### 4.5 Which other engines need a second layer

The pattern generalises exactly as far as job-surface breadth, and no further.

| Engine | Layer 2? | Why |
|---|---|---|
| **`builder`** | **Yes** | Nine former domain engineers, one frontmatter slot. The founder's case, unchanged |
| **`operator`** | **Yes — more urgently than builder** | Its capability set is *per target* (deploy vs db-admin vs payments), it is pinned deliberately shallow, and shallow-plus-unfamiliar is the worst combination in the roster. Its index is a **runbook** index — job → runbook → precondition → rollback → gate tier — not a skill index. Same generator, a second `jobs:` block, and it should be written **before** the credential grant, not after |
| **`orchestrator`** | **Yes, but it reads builder's** | It needs no index of its own. It needs builder's, for the paste in (b). One file, two readers, and that is the point |
| **`designer`** | **Borderline — `design-lead`'s call** | Six sibling style variants that `CURATION.yml:211-228` insists are a menu rather than duplicates, plus mobile/web/dashboard surfaces. That is index-shaped. Deferred, not decided |
| **`reviewer`** | **No** | One job — judge a diff — run through ten lenses, and the lenses are *already* a data file a stage names. A second index would be a second description of one thing, and CLAUDE.md names that as the failure that had `/build` restating the pipeline in 50 lines |
| **`sourcer`** | **No** | One job, bounded questions. Its deficit is a capability, not a lookup (§3.5) |
| **`instrument`** | **No** | Its surface is bounded by which MCP servers exist, and that number is currently **zero**. An index over an empty capability set is a table with no rows |

---

## 5. What to delete from the 134

Prefer deletion — mechanism for its own sake is this repo's named worst failure mode. Six cuts. Three
were found while writing this and are new; three ratify deletions the specs already made in frontmatter
and extend them to the library.

### 5.1 A new test the library needs: UNFILLED-TEMPLATE

`CURATION.yml` has four tests. It needs a fifth, because three skills passed all four while containing no
content at all.

> **UNFILLED-TEMPLATE TEST — a skill whose body still contains the generator's placeholders is not a
> thin skill, it is an empty one.** Detector: a `## ⚠️ Sharp Edges` table whose *Issue* column reads
> literally `Issue`.

```
$ grep -c '| Issue |' .claude/skills/*/SKILL.md
segment-cdp           9 rows, 8 of them "| Issue | <sev> | See docs |"
clerk-auth            9 rows, 8 of them "| Issue | <sev> | See docs |"
agent-memory-systems  8 rows, 7 with "Issue" as the issue and a leaked heading as the solution
```

All three come from `vibeship-spawner-skills`. Six other skills from that source
(`vercel-deployment`, `email-systems`, `prompt-caching`, `agent-evaluation`, `inngest`,
`nextjs-supabase-auth`) were checked individually and their tables carry **real** issue text — they are
thin, not empty, and they stay.

**This is CLAUDE.md rule 6 failing inside the skills library.** *"No placeholder UI — zero tolerance for
stubs/TODOs in deliverables"*, marked `ADVISORY`, "no mechanism". The mechanism is one `grep` in
`curate-skills.mjs`, and it should land in the same PR as the cuts so the class cannot recur.

### 5.2 The six cuts

| Cut | B | Test | Evidence |
|---|---|---|---|
| **`segment-cdp`** | 1,451 | UNFILLED-TEMPLATE | Eight `\| Issue \| <sev> \| See docs \|` rows; "When to Use" reads *"This skill is applicable to execute the workflow or actions described in the overview."* **`GRANT-HOLDERS.md:644` assigns this to `instrument` today**, calling it *"event-schema literacy for the analytics side."* It carries none. Replaced by `data-quality-frameworks` (§3.6) |
| **`clerk-auth`** | 1,623 | UNFILLED-TEMPLATE | Eight `\| Issue \| <sev> \| See docs \|` rows. No `resources/`. Nothing else in the row |
| **`agent-memory-systems`** | 2,134 | UNFILLED-TEMPLATE | Seven rows with `Issue` as the issue and leaked markdown headings (`## Test different sizes`) as the solutions. A broken template, not a thin one |
| **`trust-spec-contracts`** | 7,216 | dead_subject | *"The Agentvibe R3.x security model for agent-to-agent trust: HMAC signature verification, nonce replay prevention, sentinel-bracketed spec parsing."* `grep -rl "sentinel-bracketed\|nonce replay" scripts .claude bin mission-control` → **no hit outside the skill itself and `node_modules`**. R3.x is retired the same way `war-room-orchestration` was, and that one is already a recorded `dead_subject` cut |
| **`design-orchestration`** | 3,591 | role_duplicate | *"Orchestrates design workflows by routing work through brainstorming, multi-agent review, and execution readiness."* PRODUCERS §4.4 removes it from `designer.md` because that is the orchestrator's job injected into a producer. It is a **role_duplicate** by the repo's own test — orchestrator engine + playbooks — and with `designer` no longer declaring it, **no container in the seven-roster will ever load it** |
| **`context-compression`** | 12,412 | reconstructible / dead_subject | *"Design and evaluate compression strategies for long-running sessions."* CONTROL-PLANE §5 removes it from `orchestrator.md` because the harness now does this automatically — a fact stated in this very session's system prompt. 12.4 kB advising on how to spend context is context spent |

**Net: 134 → 128.**

### 5.3 Two flagged, not cut

| Skill | Why flagged | Recommendation |
|---|---|---|
| `pitch-deck-visuals` | Declares `allowed-tools: Bash(belt *)` and requires the `inference.sh` CLI. `command -v belt` → **not on PATH**. A capability declaration nothing backs — precisely what `schema-lint.js` exists to refuse for agents, inside a file the linter does not read | **Strip the `allowed-tools` line** (it grants nothing and, if the field restricts, it is destructive). Keep the skill — deck structure and chart-type guidance survive without the CLI |
| `web-design-guidelines` | 1,231 B, no bundle, and its entire procedure is four WebFetch calls to a GitHub raw URL. **Neither `designer` nor `reviewer` holds `WebFetch`** | Not a curation cut. Either vendor the Vercel rules into `resources/` or rewrite the fetch step for `Bash`. Until then it is a pointer to a page no assigned container can open |

**Explicitly NOT cut, and the reasoning matters.** `api-design-principles` and `error-handling-patterns`
leave `builder.md`'s frontmatter and stay in the library — they are the correct Layer 2 rows for backend
jobs, and `CURATION.yml` test 1 forbids cutting what is merely unused *here*. The same protection keeps
the three `aws-*` skills, `vercel-react-native-skills`, `paddle-integration`, `pgvector-rag-conventions`
and `mem0-patterns`: the last three describe a planned stack, which is not the same thing as a retired
one. `trust-spec-contracts` is cut because R3.x is retired, not because it is unused.

### 5.4 What `CURATION.yml` must record — or CI fails

`npm run check:curation` proves the directory matches the file; `npm run check:routers` fails on a skill
in **no** namespace. So each change has two mandatory entries and no optional ones.

**Per cut:** a name under its test bucket (a new `unfilled_template:` block for three of them), and
removal from the `namespaces:` block. `curate-skills.mjs` also refuses a `near_duplicate` cut whose named
survivor is absent — the chain defect that fired six times — so `segment-cdp`'s survivor
(`data-quality-frameworks`) must land in the **same commit**.

**Per import:** an entry under `added:` with `source:`, `fetched: 2026-08-14` and a `why:` naming the
test it passes, **plus** a namespace assignment:

| Import | Namespace | `allowed-tools` |
|---|---|---|
| `stride-analysis-patterns` | `quality-security` | none |
| `incident-runbook-templates` | `ops-delivery` | none |
| `deployment-pipeline-design` | `ops-delivery` | none |
| `database-migration` | `ops-delivery` | none |
| `postgres-best-practices` | `engineering` | none |
| `data-quality-frameworks` | `engineering` | none |
| `kpi-dashboard-design` | `business-growth` | none |

All seven were checked against the `role_duplicate`, `near_duplicate`, `reconstructible` and
`dead_subject` lists: **no collisions.** One further import belongs to `design-lead` and does collide —
`frontend-design` is a recorded `reconstructible` cut — but `CURATION.yml:285-289` **already
pre-authorises the reversal**, naming the machine-local 8,260 B copy specifically and giving the reason
(*"a model does not reconstruct a critique of its own default aesthetic"*). That reversal is written and
unexecuted.

**Two antigravity skills to refuse explicitly, so nobody re-proposes them:**
`database-migrations-migration-observability` (`allowed-tools: Read Write Edit Bash WebFetch` → operator
is denied `Write`/`Edit` by design) and `frontend-dev-guidelines` (already a recorded `near_duplicate`
cut folding into `impeccable`; re-importing it without a reversal fails `check:curation`).

---

## 6. The context arithmetic

Measured with `wc -c` on each `SKILL.md`. Bundled `resources/` and `references/` are excluded because
they are not injected. Tokens are bytes ÷ 3.6 — the divisor `build-skill-routers.mjs:165` already uses.

| Engine | Skills | Bytes | ≈ tokens | % of 1M | % of 200k |
|---|---:|---:|---:|---:|---:|
| `orchestrator` | 8 | 73,361 | **20,378** | 2.0% | 10.2% |
| `builder` (Layer 1) | 8 | 48,898 | **13,583** | 1.4% | 6.8% |
| `operator` (7 shipped) | 7 | 49,407 | **13,724** | 1.4% | 6.9% |
| `designer` | 6 | 45,981 | **12,773** | 1.3% | 6.4% |
| `reviewer` | 8 | 42,980 | **11,939** | 1.2% | 6.0% |
| `sourcer` | 7 | 30,637 | **8,510** | 0.9% | 4.3% |
| `instrument` | 7 | 28,248 | **7,847** | 0.8% | 3.9% |

**Peak per dispatch: ~20.4k tokens, on `orchestrator`.** That is 2.0% of a 1M window and 10.2% of a
200k one. The founder's ~24k estimate was close and slightly high; the real spread is 7.8k–20.4k, because
skill bodies range from 1.1 kB to 28 kB rather than clustering at 2–3 kB.

**Where it goes if measured differently.**

- **Against the previous allocation** (3–4 skills), the increase is roughly **2.5×** on average and
  **5.0×** on `orchestrator` — driven by one file, `subagent-driven-development` at 28,077 B, which is
  38% of that engine's whole payload and is the single addition with the most direct evidence behind it.
- **Layer 2 adds nothing until read.** `JOBS.md` lives in `routers/`, so it is absent from
  `MANIFEST.json` and costs zero on any dispatch that does not open it. When it is opened: the table
  itself (~30 rows ≈ 1k tokens), plus one `SKILL.md` — measured median across all 134 is **4,489 B
  ≈ 1.2k tokens**, mean 7,141 B. A builder that consults the index for an unfamiliar job pays roughly
  **+2–2.5k tokens once**, against a Layer 1 of 13.6k.
- **The paste channel (§4.4b) is charged to the orchestrator, not the builder**: ~500–2,000 tokens per
  dispatch, on the engine whose budget is already the largest. Worth stating because it is the one cost
  that scales with dispatch count rather than with roster size.
- **Prompt caching survives this.** Skill bodies arrive pre-turn-1 as a stable block, and PRODUCERS §3.6
  identifies the agent file as the surface caching depends on. Larger *stable* prefixes cache better, not
  worse. The thing that would break caching is per-dispatch skill variation — which the runtime does not
  offer, and which §4.4 therefore routes through the *brief* instead.

**The one honest caveat on all of these numbers.** They are ÷3.6 approximations, not tokeniser output. If
a number here is load-bearing for a decision, run the real tokeniser on the file. Nothing in this document
turns on the third significant figure, and the ranking of the seven does not change under any plausible
divisor.

---

## 7. What would falsify this

**F1 — P6/X4 resolves "yes, `allowed-tools` restricts."** Then §1's held items are correct and the check
in §1 must ship. It also means eight skills are quietly narrowing every container that loads them today,
and the `⚠` column in `JOBS.md` becomes mandatory rather than informational. **One dispatch settles it:**
an agent whose `tools:` omits `Write`, carrying a skill whose `allowed-tools` includes it, attempting one
write.

**F2 — P6/X4 resolves "no, it is decoration."** Then `deployment-procedures` joins `operator`,
`impeccable` becomes available to `designer`, and the field should be **deleted from all eight files**
rather than left looking like a boundary.

**F3 — a skill-level A/B.** `skill-creator` (33,168 B, already in the library) ships the instrument:
`evals.json` → paired with-skill/baseline subagents dispatched in the same turn → `grading.json` with
per-assertion evidence → `benchmark.json`. **Nothing in this document has been run through it.** Every
justification above is an argument that a skill changes behaviour; none is a measurement that it does.
Point it at the three cheapest claims — `writing-good-tests` on `reviewer`, `thinking-circle-of-competence`
on `sourcer`, `full-output-enforcement` on `builder` — and it can kill any of them.

**F4 — a per-dispatch `skills` option appears in the CLI.** Then Layer 1 collapses into a dispatch
argument, `JOBS.md` becomes the lookup table feeding it directly, and §4.4's three mechanisms reduce to
one. Same check as ROSTER-SIZE F1: `strings -a <binary> | grep -c 'skills?:'`.

**What would not falsify it:** a token-cost argument in either direction, a larger library, or another
framework shipping a different skill count.

---

*Every count, byte size and `allowed-tools` finding above is a command run in this worktree on
2026-08-14. Where a claim rests on a spec rather than a command, the spec and section are named. The
three UNFILLED-TEMPLATE cuts and the `belt`, `WebFetch` and `segment-cdp`-is-assigned findings were
discovered while writing this and are not inherited from any prior document.*
