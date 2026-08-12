# Agent System Rebuild — from org-chart to claim-verified operating standard

| Field | Value |
|---|---|
| **Status** | Accepted · **Phases 1–5 complete** · **Phase 6 next** — see [PHASE-6-HANDOFF.md](PHASE-6-HANDOFF.md). Phase 5 was brought forward ahead of 4b; see the phase table |
| **Date** | 2026-08-11 |
| **Owner** | ceo |
| **Evidence** | [2026-08-11-ENFORCEMENT-DIAGNOSTIC.md](../06-codebase/2026-08-11-ENFORCEMENT-DIAGNOSTIC.md) |
| **Decision record** | [ADR-001](adr/001-claim-ledger-as-enforcement-spine.md) |
| **Proof case** | The harness rebuilds itself. Phase 1 is verified externally |

---

## 1 · Why

The "agent system" is **twelve surfaces**, not a repo:

launch environment · entry prompts · roster · skills · commands & playbooks · memory · gates ·
observability · automation · integrations · distribution across a **13-project fleet** · human interface.

A measured diagnostic found the system's documentation describes a machine that does not exist, and its
distribution mechanism is copy-paste. Headline **as originally reported**: ~1,736 stated imperative rules,
1 mechanism that can block, 16 verified fabrications, 5 launcher generations across 13 projects.

> **Corrected during execution — the diagnostic was wrong in seven places.** Re-verified: **1,452 rules**
> (its own reproduce script never yielded 1,736), **9 real fabrications** of the 16 reported (six were
> miscounts, one was resolved by probe), and **8 launcher generations across 15 launchers**, not 5 across 13.
> The direction was right and every corrected number is worse or larger, not better. Corrections are recorded
> in place in [the diagnostic](../06-codebase/2026-08-11-ENFORCEMENT-DIAGNOSTIC.md) and
> [the fleet baseline](../06-codebase/2026-08-11-FLEET-BASELINE.md). **Treat any number in this document that
> post-dates neither file as unverified.**

Five findings shape everything below.

1. **The QA gate has never run.** `qa-lead-pass.yml` — **343 lines, 6 blocking `exit 1`s** (not the 176/4
   originally reported) — lived in a directory GitHub does not read. *Resolved in Phase 1: it now runs on
   every PR in shadow mode. Phase 3 promotes it to blocking.*
2. **The best asset is unwired.** `schema-lint.js` — 360 lines, correct, blocking — is registered nowhere. Run
   today it exits 1: 11 pass, 15 fail.
3. **The system is code-shaped; the work is not.** The target is *any* venture work. A verdict bound to a
   commit plus CI executing compilers gates diffs. Most of this work has no diff.
4. **Distribution is copy-paste and the fleet has diverged.** The launcher is ~97% universal program and ~3%
   project config, distributed as 100% copy.
5. **The architecture routes around a limitation that no longer exists.** "Subagents cannot spawn subagents"
   was probed and is false. The dispatch-packet ceremony exists to work around a rumour.

Finding 5 is the design argument for everything below: *"nested spawn is blocked"* was **a claim about the
world that was true once, carried no expiry, and silently rotted while the whole system kept obeying it.**

**Outcome sought:** one enforcement spine covering code and business work identically; a roster derived from
jobs; a repeatable operating standard; one control plane across all projects; and a fleet where one
improvement reaches thirteen repos. Every surviving rule names a hook, CI job, resolver, or data file — and
every rule that cannot is deleted, not demoted to a comment.

---

## 2 · Locked decisions

| Surface | Decision |
|---|---|
| Scope | Domain-general venture harness — any project category, must digest any challenge |
| Demolition | Strip to spine, rebuild outward |
| Durable unit | **The claim** |
| Claim storage | Git is truth; DB is a strictly derived index |
| Memory scope | Three-tier: `global` / `project` / `task` |
| Outer loop (framing, options, decisions) | In scope |
| Outbound (deploy/publish/send) | In scope, **gated** — approval queue; agent turn ends at request |
| Unattended runs | In scope, first-class — budgets + stall detection required |
| Blocking posture | **Shadow mode first**, promote on evidence. Unrecoverable actions block day one |
| Topology | **Hybrid** — war room for human attention, nested subagents for fan-out |
| Roster | 6 engines, derived from a 38-job inventory (7 in Phase 4b; `reader` became a script in Phase 6) |
| Playbooks | **Work graph + exit gates, never method** |
| Skills | Curate the **best ~70 in the world**, not the best 70 of what exists here |
| Capabilities | Enforce what the runtime really enforces; delete decorative fields |
| Routines | Three classes: **clock**, **harness-health**, **value** (cut to ~3) |
| Interface | Terminal for work + **multi-project control plane** for decisions |

---

## 3 · The design

### 3.1 Spine — the claim ledger

Code, pricing, research and copy all ultimately **assert things**. A harness that gates diffs is
code-specific; a harness that verifies claims is domain-general by construction.

A claim lives **inside the artifact it supports** — frontmatter or a fenced ` ```claims ` block in a doc, a
test-name binding in code. A script compiles all claims into a generated index. **The index is never
hand-edited**, so a claim cannot drift from its artifact.

```yaml
claims:
  - id: c-runtime-nested-spawn
    assert: "Subagents can spawn subagents (depth-2 confirmed)"
    kind: runtime-capability   # external-fact | internal-fact | behavior | user-language
                               # | judgment | runtime-capability | preference
    scope: global              # global | project | task
    verified_by: command
    evidence: {cmd: "scripts/probe-nested-spawn.sh", expect_exit: 0, accessed: 2026-08-11}
    valid_until: 2026-11-09    # 90d — runtime capabilities rot
    confidence: 0.95
    supports: [d-topology-hybrid, d-delete-dispatch-packets]
```

| `verified_by` | Resolver |
|---|---|
| `source` | URL returns 2xx · `quote` present in fetched text · `accessed` within window · `valid_until` unpassed |
| `command` | Runs it, asserts exit code / stdout match |
| `judge` | Dispatches reviewer lenses; at `risk: high` requires **≥2 distinct model families** |

On expiry, exactly one disposition is recorded — **Refresh · Deprecate · Waive(new deadline)**.

**Three scopes.** `global` lives in `~/.warroom/ledger/` and reaches all 13 projects (runtime capabilities,
model IDs and pricing, working preferences, usage-window mechanics). `project` lives in the repo. `task` dies
with the branch. The nested-spawn fabrication was a global claim with no expiry; under this design it carries
90 days and forces a Refresh.

**What it replaces.** `DECISIONS.md`, `LONG-TERM.md`, `USER-INSIGHTS.md`, `CODEBASE-MAP.md` are claim
collections that go stale invisibly. They become generated views, and staleness becomes computable.

**What it enforces that prose never did.** Rule 3 — *"no agent invents data"* — becomes a build failure.

### 3.2 One classifier, many consumers

Extend `.claude/qa-tier-floor.yml` from `path → tier` to `path → {tier, resolvers[], required_claim_kinds[]}`.
Read by the merge gate, the pre-tool hook, the outbound gate, and the escalation trigger. **One file computes
risk.** Two files computing risk will disagree, and you find out during the incident.

```yaml
- pattern: "docs/02-competitive/**"
  tier: lite
  resolvers: [claim-source, claim-freshness]
  required_claim_kinds: [external-fact]
- pattern: "docs/09-metrics/**"
  tier: full
  resolvers: [claim-source, claim-arithmetic]
- pattern: ".claude/agents/**"
  tier: irreversible
  resolvers: [schema-lint]
```

**Test it by execution against a path list, never by reading it.**

### 3.3 Fleet — one program, many configs

The change that makes every other improvement propagate. Until it lands, work pays back in one repo of thirteen.

```
~/.warroom/bin/warroom      # the one program, versioned
~/.warroom/manifest.json    # per-file SHA256 of everything installed, per project
~/.warroom/ledger/          # global-scope claims
<repo>/.warroom.yml         # project-owned config — updates NEVER write here
~/bin/<project>             # 10-line shim: exec warroom --config <repo>/.warroom.yml
```

**The entry preamble becomes a repo artifact.** The ~30-line `CEO_PREAMBLE` currently pasted via `send-keys`
from a bash literal — duplicated across twelve launchers, no version control, no lint — moves to
`.claude/entry/<role>.md`. It is the highest-leverage prose in the system and currently the least governed.

**Propagation mechanisms:** per-file SHA256 manifest as a conflict *detector*; the structural boundary as the
*protection* (never write generated content into a customized directory); content-hash + uuid backups;
symlink preservation; **refuse outright to update a hard-linked file**; rollback that fails loudly on a
missing backup; an `installation_modified` guard; and on apply, re-run linter + classifier against the
**receiving** project and refuse on failure.

~~**`adamos` needs a verdict** — adopt, revert, or document.~~ **Superseded 2026-08-11:** the founder
excluded `adamos`, `test1` and `hitstampjavagame` from Phase 2 entirely. They are left untouched and no
verdict is required. Scope is the remaining **12 launchers, 5 generations** — see
[FLEET-BASELINE.md §4b](../06-codebase/2026-08-11-FLEET-BASELINE.md).

**Sequencing, decided 2026-08-11:** extract the preamble **verbatim** first so Phase 2 stays a
behaviour-preserving refactor, and converge its content in a separate diff · the program's source of truth
is **`bin/warroom` in this repo**, installed to `~/.warroom/bin/`, so `npm run check` and CI gate every
change to it · rollout is **`agentvibe` → one pilot → all 10 remaining at once**, and it happens in
**Phase 9, after the whole system is built** — not in Phase 2.

**What Phase 2 therefore is:** build the one program, extract `.warroom.yml`, move each preamble verbatim to
`.claude/entry/<role>.md`, and build the propagation machinery (per-file SHA256 manifest, content-hash
backups, symlink preservation, hard-link refusal, loud rollback, `installation_modified` guard). Prove all of
it on `agentvibe`. Run the check-only pass across the other 11 **read-only**. Write to nothing else.

**The cost of deferring, stated plainly:** 11 projects run the old launcher for the whole rebuild, and they
keep drifting while it runs. That is the price of propagating a finished system once instead of an
intermediate one seven times. Stop condition 5b tracks whether that price is rising.

### 3.4 Roster — derived from 38 jobs

Jobs enumerated across intake, truth, decision, production, verification, release, observation,
self-maintenance and human interface, then grouped by **procedure** — the only thing that justifies a separate
agent, since skills are data.

- Jobs 19, 27, 32, 34 → **scripts** (resolvers, log writer, schema-lint, drift check)
- Jobs 24–26 → a **gate** (deploy/publish invariants are path-keyed criteria)
- Jobs 13–18 → **one procedure**, five artifact types, differing only in what verifies them

| Engine | Jobs | Distinct because |
|---|---|---|
| **orchestrator** | 3, 36–38 | Owns state and the human boundary; the only thing that ends a turn on approval |
| **framer** | 1–2, 4, 9–11 | fuzzy → structure → options → decision. Domain lenses are data |
| **sourcer** | 5–8 | "Never assert without evidence" is a discipline, not a skill |
| **builder** | 13–14, 16–18 | Artifact in isolation → structured return |
| **designer** | 15, 23 | The only production job with a perception loop: render → look → iterate |
| **reviewer** | 20–22 | Read-only, out-of-band. Objective **and model family** per lens |
| **reader** | 12, 28–31, 35 | Not task-triggered — a periodic sweep over ledger + log |

**The move that makes it work:** encoded expertise ("pull live numbers, run a sensitivity analysis, flag
reversibility") is real and must survive — as a **linted lens file**, not unlinted agent prose. Evidence: 15
of 26 current agent files fail their own validator. Prose rots; a linted data file cannot.

New data files, all schema-linted: `lenses.yml`, `review-lenses.yml`, `playbooks/*.yml`.

**Concrete win:** the linter asserts any panel declared "independent" carries ≥2 distinct model families.

### 3.5 Playbooks — the operating standard

A playbook declares the **stages** a category of work passes and the **claims + criteria required to exit
each**. It never declares method — the agent picks its own path inside every stage.

```yaml
playbook: launch-landing-page
stages:
  - id: positioning
    exit: [claim(kind=user-language, verified_by=judge), claim(kind=external-fact, verified_by=source)]
  - id: copy
    exit: [criterion(no-unsourced-number), review(lens=voice)]
  - id: design
    exit: [review(lens=craft), review(lens=a11y)]
  - id: ship
    exit: [criterion(cwv-budget, verified_by=command), criterion(analytics-firing, verified_by=command)]
    gate: outbound-approval
```

Seed set: `ship-feature`, `launch-landing-page`, `price-a-product`, `validate-a-market`, `design-pass`,
`research-question`.

### 3.6 Topology — war room for attention, nesting for fan-out

N terminals exist because a **human** needs to watch, steer and interrupt independent streams — a
human-attention feature, not a parallelism feature. Worktrees stay: they make parallel streams safe. Fan-out
inside a stream uses nested subagents. The dispatch-packet ceremony is deleted once write-capable nesting is
confirmed outside plan mode.

### 3.7 Capabilities — enforce what's real, delete the rest

Every agent declares `mcpServers: [...]` while `settings.json` has no `mcpServers` key and no `.mcp.json`
exists. A capability field auto-granted whatever it requests is worse than no field — it degrades to false
confidence, not to zero.

- Use the runtime's `tools:` field on all 6 engines, **minimally scoped**. Reviewer is read-only,
  period. (Today `security-engineer` and `code-reviewer` are declared read-only reviewers running with full
  inherited write access. An agent that can edit what it reviews will review what it can edit.)
- Declare MCP servers per engine and **lint that every declared server resolves**; an unresolvable declaration
  fails the build.
- **Delete every decorative capability field.** Refuse syntax that implies a boundary you have not built.

### 3.8 Automation — three routine classes

| Class | Purpose | Model |
|---|---|---|
| **clock** (2/day) | Anchor the rolling 5-hour usage window to the workday — start, and +5h. Near-zero tokens; the point is starting the counter, not the output | cheapest |
| **harness-health** (3) | `reader` (consumes log + ledger, escalates) · `claim-refresh` (forces Refresh/Deprecate/Waive on expiry) · `fleet-drift` (are the 13 projects in sync?) | cheap → mid |
| **value** (~3) | Cut from 12. Rebuilt only after the spine exists and integrations are real | per task |

The 5-hour-window mechanic itself becomes a `scope: global` claim with `valid_until` and a judge refresh —
because if it changes and nobody notices, the clock routines fire forever against a window that no longer
works that way. That is the fabrication pattern; this time it has an expiry date.

### 3.9 Mission Control — the multi-project control plane

Not a dashboard mirror. A place to **run the company from**, across every project at once.

| View | Shows |
|---|---|
| **Fleet** | All projects: health, launcher generation, active sessions, burn today, drift alerts |
| **Project** | Goals, playbook stage progress, open claims, expired claims, blocked items |
| **Belief** | The ledger, browsable and filterable: what we believe, confidence, expiry, `supports:` graph. Expired and refuted surfaced loudly |
| **Sessions** | Live and historical, across projects. Cost, tokens, artifacts, claims emitted, replay |
| **Dispatch** | Pick project → pick playbook or write a free goal → choose N streams → **launch** |
| **Inbox** | Pending outbound approvals, escalations, binary pings |
| **Conflicts** | Cross-project file-conflict map |

**Architecture.** A local daemon (Bun + Hono — the stack already there) launching `tmux new-session -d`
running `claude` on the existing subscription. **Detached by default**, so nothing needs to be visible;
attach from the terminal any time to watch or steer. Reads `events.jsonl` per project,
`~/.claude/projects/*.jsonl` for real cost, git for worktrees and conflicts, and each repo's claim index.
Writes only its own store and tmux commands — **never into a project repo except through an agent.**

**This flips two would-be deletions into assets.** `server/db.ts` `initDb()` (tables, zero `INSERT`s) is the
unfinished session-history store, not dead code. `server/collectors/subagents.ts` (never imported) becomes
more important now that nesting is confirmed. Both are kept.

### 3.10 Skills — best ~70 in the world

Candidate pool is measured: **803 real skill files** across 11 public corpora (NVIDIA 331, google 104, daymade
90, LambdaTest 72, phuryn 68, Jeffallan 67, akin-ozer 31, Anthropic 18, …) plus the local 143.

1. **Cut test** — delete only what is useless in *every* project, never what is unused *here*.
2. **Encoded-procedure test** — keep only what a frontier model will not reconstruct unaided.
3. **Size discipline** — metadata ~100 words · body under 500 lines · everything else in bundled references ·
   ToC over 300 lines.
4. **Lint only what is universal** — `name` and `description` are the only near-universal frontmatter fields
   across 803 files. Requiring more fails on contact with any corpus we did not author.

Add ~6 namespace router skills so the discovery tier stops growing linearly.

---

## 4 · Phases

| # | Phase | Gate to proceed |
|---|---|---|
| 1 | **Subtract and wire** · *externally verified* — ✅ **DONE** | ~~Rules ≤ 400~~ *(re-scoped — see below)* · blocking mechanisms ≥ 4 → **5** · fabrications = 0 → **0** · schema-lint exit 0 → **✅** · one PR observed RED then GREEN → **✅ runs `31505991227` → `31506094985`** |
| 2 | **Fleet machinery** — ✅ **DONE** (`agentvibe` only, no rollout) | Launcher behaviour unchanged on `agentvibe` → **verified live, byte-identical to the backed-up original** · `.warroom.yml` extracted (3 values) · manifest / backup / hard-link refusal / rollback **each verified by executing the failure** · read-only fleet scan reports **12 in scope, 5 generations**. No other project written to. [FLEET-BASELINE.md](../06-codebase/2026-08-11-FLEET-BASELINE.md) |
| 3 | **Spine** — claims, resolvers, ledger, shadow mode — ✅ **DONE** | All three met by execution. Dead URL + expired `valid_until` → **both** resolvers fire as `claim.would_block` in `events.jsonl` ([canary](../06-codebase/ledger-canary.md), reproduced on a CI runner against real DNS) · `ledger rebuild` byte-identical from a clean clone (sha256 `58dc7d47…` before and after) · `qa-lead-pass.yml` promoted to blocking and observed **red twice, then green** on [PR #9](https://github.com/Adam077K/agentvibe/pull/9) — once for a missing session file, once for a missing `risk:irreversible` label found by the new classifier. Reference: [CLAIM-LEDGER.md](CLAIM-LEDGER.md) |
| 4 | **Roster collapse** — 7 engines + lenses — ✅ **DONE** | **26 agents / 6,487 lines → 7 engines + 11 shims / 1,099 lines.** Gate: `schema-lint` exit 0 across the roster → **✅** · a single-model "independent" panel fails the lint → **✅ tested by constructing it** · *read-only engine cannot write, verified by attempt* → **DECLARATION verified and enforced; the runtime BINDING is not**, because the probe needs subagent spawning. Recorded as `c-read-only-binding-unverified`, waived to 2026-09-08, with `scripts/probe-readonly-engine.sh` to run by hand. **Eleven names kept as shims** — deleting them would not remove them, it would un-shadow drifted copies in `~/.claude/agents/`, so `@ceo` would keep working and quietly mean a 313-line Sonnet definition routing to four retired agents |
| 5 | **Playbooks** — ✅ **DONE** *(brought forward before Phase 4b)* | Six seed playbooks lint clean → **✅** · `/build` `/fix` `/ship` `/design` `/research` are invocations → **✅ 891 lines of command prose → 140**. Reordered ahead of 4b because the lenses carry procedure and deliberately carry no routing, while **8 of 26 agents held worker-dispatch tables** — deleting them with nothing holding the hand-offs was the gap. Playbooks now hold them. Also repaired a fabrication class Phase 1 missed: **23 references to 5 agents that never existed**, now blocked by `check-registration.mjs` |
| 6 | **Reader, budgets, stall detection, routines** — *also owns the memory-file collapse* — ✅ **DONE** | **Reader:** it is `ledger sweep`, not an agent — six deterministic queries and its own anti-patterns forbade the one judgement in scope, so the file was deleted and the roster is **6 engines**. **The repo's first clock:** measured beforehand — no crontab, no launchd, no Actions `schedule:`, no Inngest config, while 12 routines declared cron strings. **Budgets + stall:** ceiling on the rolling 5-hour window (2M warn / 3M block output tokens, against a measured peak of 1,961,285), stall at 200k/400k since the last durable artifact; measurement went 9,023ms → 13ms by using append-only. **Routines:** war-room deleted entirely — 25 files / 3,256 lines in three populations, all with existing homes; all three `harness-health` routines turned out to be scripts. **Memory:** only `CODEBASE-MAP.md` is generated, non-lossy provably (the pre-migration file was empty); `DECISIONS.md` cannot be a view because the schema has no field for a rejected option. **Three gate criteria amended, each with the measurement that forced it.** §0 closed: lenses and playbooks are injected at session start |
| 7 | **Skills** *(parallelizable with 3–6)* | ~70 curated by the stated method; routers in place |
| 8 | **Mission Control** | Dispatch a goal into a second project with no terminal attached; session appears in history with real cost; claims land in that repo's ledger |
| 9 | **Fleet rollout** — *the only phase that touches another project* | Pilot converged and behaviour-identical; then all 10 remaining; every launcher on one generation; `newproject` has an update path |

> **No project other than `agentvibe` is touched before Phase 9.** Founder decision, 2026-08-11. Phase 2
> builds the propagation *machinery* and proves it on `agentvibe` alone; propagation itself happens once, at
> the end, carrying a finished system rather than seven intermediate ones. This **supersedes the earlier
> decision that moved fleet propagation to Phase 2** — the machinery stays in Phase 2, the rollout moves to
> Phase 9.

### Phase 1 detail — the only phase not self-reviewed

The proof case is the harness rebuilding itself, so the gate must be real and externally confirmed **before**
self-review begins. Sixteen fabrications got in because an immature system reviewed its own work.

**Delete:** `.agent/` (695 tracked files, byte-identical mirror) · `new agents-skills-workflows-system/`
(700 files, after salvaging its 2 CI workflows) · `.claude/agents/_seeds/` (9 orphans, zero references) ·
`.claude/hooks/post-edit-typecheck.sh` (gates on `*/apps/web/*`, absent).

**Gitignore, do not delete:** `war-room-dashboard/` (55 files, generated output of `war-room/dashboard/`).

**Keep:** `war-room/dashboard/server/db.ts`, `server/collectors/subagents.ts` — Phase 8 foundations.

**Repair all 16 fabrications** — each made true or deleted, never softened. Full list in the diagnostic.

**Wire what already works:**
- Create a real `.github/workflows/`; move `qa-lead-pass.yml` there so GitHub sees it for the first time
- Register `schema-lint.js` in `.claude/settings.json` **and** CI. It exits 1 today — fix or delete the 15
  failing agents rather than relaxing the schema
- Wire `gate-logic.mjs`'s 23 tests into CI
- **Registration-completeness test** — every shipped capability-bearing file resolves to a registration, and
  every registration points at a file that exists. Converts this exact failure class into a build failure
- Every hook declares its **enforcement posture in its first five lines** (`BLOCKS` / `ADVISES`)
- **Confirm write-capable nested spawning outside plan mode**, then delete the dispatch-packet machinery

#### Phase 1 outcome — 2026-08-11, [PR #1](https://github.com/Adam077K/agentvibe/pull/1)

All criteria met except the rule count, which was **re-scoped rather than met**. Measured at execution time,
601 of 1,353 imperatives live in `.claude/agents/**` (collapsed in Phase 4) and 569 in `.claude/skills/**`
(curated in Phase 7) — Phase 1's deletions touch almost neither, so ≤ 400 was unreachable by this phase's own
work. Phase 1 is instead accountable for the **governing set** (CLAUDE.md, AGENTS.md, `.claude/commands/`):
**30 rules, each now naming its enforcing mechanism** or explicitly marked ADVISORY with the phase that will
give it one. The ≤ 400 total is inherited by Phases 4 and 7.

Blocking mechanisms **1 → 5** · tracked files **2,290 → 644** · schema-lint **exit 1 (11 pass / 15 fail) →
exit 0 (26 / 0)** · CI runs ever **0 → every PR** · red-then-green proven on runs `31505991227` →
`31506094985`.

**Six of the sixteen fabrications were not fabrications.** The diagnostic pattern-matched where it claimed to
verify — its own stated failure mode. Real count: 9 repaired, 1 resolved by probe; corrections recorded in
place in the diagnostic.

> **Re-verify the assets table below before Phase 2 relies on it.** Two of its rows were wrong:
> `qa-lead-pass.yml` is 343 lines with 6 blocking exits, not 176 with 4; and `.agent/` was not an inert
> mirror — every one of MANIFEST's 154 paths pointed into it, so deleting it in the stated order would have
> broken the skills system in the same commit.

---

## 5 · Assets to reuse — do not rebuild

| Asset | State | Use |
|---|---|---|
| `.claude/hooks/schema-lint.js` | 360L, correct, blocking, **unwired** | The linter. Extend to lenses/playbooks/claims |
| `.claude/hooks/pre-tool-use.sh` | Live, `exit 2` | The depth-invariant enforcement point. Extend |
| `.claude/workflows/lib/gate-logic.mjs` | 23/23 tests pass, unrun | The gate |
| `.claude/workflows/{qa,coding,design,research}.js` | Executable fan-out, binding `PASS\|BLOCK` | The engines |
| `new agents-.../qa-lead-pass.yml` | 176L, 4 blocking exits, invisible to GitHub | Move to real `.github/` |
| `.claude/qa-tier-floor.yml` | Data file, one dead consumer | Extend to the one classifier |
| `~/bin/<project>` (47 shared functions) | 12 drifted copies | Extract to one program + config |
| `~/bin/newproject` | v2, clone-and-substitute | Add the update path it lacks |
| `war-room/dashboard/server/collectors/{cost,git,events}.ts` | Live, 2s loop | Mission Control's data layer |
| `war-room/dashboard/server/db.ts` | Tables, zero INSERTs | Session-history store |
| `~/.<project>/events.jsonl` | Live, written by launcher | The run log |
| `.claude/skills/MANIFEST.json` | Exists, decorative | Make machine-consumed |

---

## 6 · Stop conditions

Each needs a checker and a date. A stop condition written as a sentence is not a stop condition.

1. Any component declared done while its enforcement is prose rather than a named hook, CI job, resolver, or data file.
2. The run log exists four weeks with no reader.
3. A run burns > 200k tokens and returns no structured output *after* the stall envelope ships.
4. The build extends past Phase 6 without an explicit decision to continue.
5. ~~The fleet is still on eight launcher generations after Phase 2.~~ **Restated 2026-08-11.** Rollout moved
   to Phase 9, so this can no longer fire at Phase 2 — a stop condition that cannot fire until the end is not
   a stop condition. It splits in two, both checkable during the build:
   - **5a** — the 12 in-scope launchers are still on more than one generation after **Phase 9**.
   - **5b** — *the generation count increases during the rebuild.* The 11 untouched projects keep drifting
     while Phase 2–8 run. Re-run the read-only baseline script monthly; if generations go up, the cost of
     deferring rollout is growing and the decision should be revisited.
6. No user-facing venture work ships during the rebuild.
7. **A new mechanism is added that nothing invokes within two weeks** — the condition that catches this plan's
   own worst failure mode: building mechanisms because they are satisfying to build.

---

## 7 · Known soft spots

- **Friction is unpriced.** Nobody in 24 studied systems measured what a mid-task denial costs. Shadow mode
  prices the variable instead of guessing, but it delays real enforcement.
- **The claim-decomposition tax is unmeasured.** No studied system has built a per-task claim envelope both
  checked against behaviour and on by default. The enforcement half is open work, not a port.
- **`judge` resolvers are only as good as the model tier.** One studied system documents its cheapest tier
  *"degrades toward confident false-pass"* on exactly this task. Label every judged claim; re-validate on tier change.
- **Lens files are prose in YAML.** They rot exactly as agent definitions did unless the linter checks their
  content, not only their shape.
- **Self-review is circular by design.** Mitigation: Phase 1 is externally verified before self-review begins.
  A mitigation, not a solution.
- **Splitting the launcher is a behaviour-preserving refactor of the thing used every day.** Highest blast
  radius here. It runs against `agentvibe` first; no other project is touched until that is proven.
- **Mission Control is a real application** — the largest single build and the furthest from the enforcement
  thesis. If Phase 8 slips, nothing upstream breaks. That is why it is last.
- **The source spec is not fully verified.** Its comparative section contains at least six overstatements
  confirmed against its own worker files — a sampled ~120-file scan reported as a whole-corpus grep of 803, an
  "enforced" registry resting on an unread script, and a "nothing reads it" claim its source directly
  contradicts. Treat every number carried from it as a hypothesis and re-verify before repeating.

---

*Owner: ceo · Created 2026-08-11 · Supersedes the 3-layer CEO→C-suite→worker topology described in
[AGENTS.md](../../AGENTS.md) and [CLAUDE.md](../../CLAUDE.md), which are updated as each phase lands.*
