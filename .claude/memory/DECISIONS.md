# Architecture & Strategy Decisions
*Append-only. 50-entry cap — archive to `DECISIONS_ARCHIVE.md` when full.*

> Empty template. Every C-suite agent appends one entry per significant decision
> using the format below. Workers do not write here.

---

## Format

```markdown
## YYYY-MM-DD — [Decision title]

**Context:** Why this came up.
**Options considered:** A / B / C with one-line trade-offs.
**Decision:** What we chose.
**Rationale:** Why this option won.
**Reversibility:** reversible | hard-to-reverse | irreversible
**Owner:** [agent name]
**Affects:** [list of agents / domains downstream]
```

---

<!-- Entries below this line, most-recent first. -->

## 2026-08-12 — The reader engine becomes a script, and the roster drops to six

**Context:** Phase 6 opened with a stop-condition-7 clock running: `.claude/agents/reader.md` was created in
Phase 4b and nothing invoked it. Reading it against the decision to wire it revealed the file specified an
agent that never judges anything — its return contract (`status · window · expired · expiring_soon ·
lapsed_waivers · silent_resolvers`) is six deterministic queries, and its own anti-patterns forbid the single
judgement in scope: *"DO NOT record a disposition; that is a decision, and decisions have owners."*
**Options considered:** Wire the agent into a scheduled CI job (needs an API key and per-run billing outside
the subscription, and yields a non-deterministic report no test can pin) / Script the sweep and keep the agent
to interpret it (real but speculative value, and the trigger would be prose rather than mechanical, so §0
stays half-satisfied) / Script it and delete the agent / Record it as unconsumed and defer.
**Decision:** `node scripts/ledger.mjs sweep`, and `.claude/agents/reader.md` is deleted. Roster is six
engines. The sweep runs on a schedule ([ledger-sweep.yml](../../.github/workflows/ledger-sweep.yml)) and at
session start, where the same hook also injects the lens and playbook files.
**Rationale:** Deletion is the strongest answer to the new §0 gate criterion — the unconsumed mechanism is
removed rather than pretended-consumed. Deterministic, keyless, testable, and it makes the roster smaller,
which is the whole thesis of Phase 4. Verified safe first: no `reader.md` exists in `~/.claude/agents/`, so
unlike the eleven shimmed names, deleting this one actually removes it.
**Reversibility:** hard-to-reverse (git history holds the file; the roster count is referenced in four docs)
**Owner:** ceo
**Affects:** every engine consumer, schema-lint's ENGINES registry, AGENTS.md, README counts, the claim ledger

## 2026-08-12 — Three Phase 6 gate criteria amended, each by a measurement

**Context:** The Phase 6 gate was written in the Phase 6 handoff — by me — before any of the runtime was
measured. Three of its criteria turned out to describe mechanisms that could not fire or could not be proven.
**Options considered:** Implement the criteria literally and ship mechanisms that pass their own gate while
guarding nothing / Amend the criteria quietly / Amend them and record the measurement that forced each.
**Decision:** Amend, with the number attached. (1) *"The ceiling fires before dispatch"* → **before the next
unit of work**: measured 0 of this session's 414M tokens passed through `Task`, so a dispatch-gated budget
would never have fired once in 1,314 turns. (2) *"per session"* → **per rolling 5-hour window**, the actual
subscription constraint; peak measured across 99 transcripts and 16,900 turns is **1,961,285 output tokens**,
so warn at 2M and block at 3M. (3) *"the four memory files are generated views, proven non-lossy"* → only
`CODEBASE-MAP.md` becomes a generated view; the ledger has no field for rejected options or rationale, so
"non-lossy" fails by construction for `DECISIONS.md`, and three of the four files are empty templates anyway.
**Rationale:** A gate criterion that cannot be met honestly is worse than no criterion — it forces either a
false pass or a quiet edit. Recording the measurement makes the amendment auditable.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** Phase 6 acceptance, the budget and stall design, anyone reading the handoff's gate section

## 2026-08-11 — Claim ledger replaces the diff gate as the enforcement spine

**Context:** The system must serve any venture work, not only code. A measured diagnostic found ~1,736 stated imperative rules against 1 mechanism that can block, and 16 verified fabrications. The obvious fix — a merge gate bound to a commit SHA with CI executing compilers — gates diffs, and most venture work (pricing, market sizing, positioning, GTM) has no diff.
**Options considered:** Diff gate only (gates the recoverable class, leaves the unrecoverable class ungated) / Two gates in two homes (two classifiers will disagree during an incident) / Decision as the durable unit (loses per-claim blast radius) / Artifact + per-task criteria (criteria die with the task, so nothing can go stale) / Nothing durable (cannot answer "what do we believe and why").
**Decision:** The **claim** is the durable unit. Claims live inside the artifact they support; a generated index compiles them. Three resolvers — `source`, `command`, `judge`. Expiry via `valid_until` with a forced Refresh / Deprecate / Waive disposition.
**Rationale:** Every domain ultimately asserts things, so claim verification is domain-general where diff gating is not. It catches the exact failure class that produced all 16 fabrications, makes staleness computable, and gives blast radius free via `supports:`.
**Reversibility:** hard-to-reverse
**Owner:** ceo
**Affects:** every engine, the QA classifier, all four memory files (which become generated views), CI, Mission Control
**See:** [ADR-001](../../docs/03-system-design/adr/001-claim-ledger-as-enforcement-spine.md)

## 2026-08-11 — "Subagents cannot spawn subagents" is false; delete the dispatch-packet layer

**Context:** The operating instructions state nested Task spawning is blocked. The entire dispatch-packet ceremony and much of the CEO→C-suite→worker layering exists to route around it.
**Options considered:** Trust the stated constraint / Probe it.
**Decision:** Probed live — **false**. A subagent had `Agent` in its primary tool list, called it, and the nested agent returned `NESTED_OK` in 1.8s. Depth-2 confirmed. The dispatch-packet machinery is deleted once write-capable nesting is confirmed outside plan mode (Phase 1 task).
**Rationale:** A capability constraint not re-tested this quarter is a rumour. This one shaped the architecture. It is also the canonical example for the ledger: a global-scope claim, true once, carrying no expiry, silently rotted while the whole system obeyed it.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** topology, roster, every C-suite agent definition, CLAUDE.md layer contract

## 2026-08-11 — Fleet propagation moves from last phase to Phase 2

**Context:** `~/bin/<project>` is a ~2,765-line bash launcher, one standalone copy per project across 13 projects. Normalized for project name they have drifted into **5 generations**; at function level four of them have identical 47-function sets, so the divergence is content baked into the program, not capability. `adamos` is a genuine fork — renames CEO→CATO and deletes worktree isolation entirely.
**Options considered:** Build propagation last, as the source spec advises / Build it early.
**Decision:** Split the launcher into one versioned program + per-project `.warroom.yml`. Move `CEO_PREAMBLE` out of the bash literal into `.claude/entry/<role>.md`. Phase 2, immediately after enforcement is wired.
**Rationale:** Until it lands, every improvement pays back in one repo out of thirteen. The fleet is already five generations apart with no update path, so drift is compounding.
**Reversibility:** hard-to-reverse (highest blast radius in the plan — it refactors the daily driver)
**Owner:** ceo
**Affects:** all 13 projects, `newproject`, `bin/install-war-room.sh`, entry prompts

## 2026-08-11 — Roster collapses from 60 agent files to 7 engines, derived from a 38-job inventory

**Context:** 60 agent definitions exist (26 top-level, 25 war-room, 9 orphaned seeds). 15 of 26 fail the repo's own schema validator. The source spec's rule is "collapse two agents if only their skills differ; keep them separate if their procedure differs."
**Options considered:** Keep 26 and make them valid (fix-in-place one layer down) / Collapse workers, keep C-suite / Collapse to 7 engines + lens data files / Delete the roster entirely (a shipped team did this twice, on the record).
**Decision:** Seven engines — orchestrator, framer, sourcer, builder, designer, reviewer, reader — with domain expertise moved into linted data files (`lenses.yml`, `review-lenses.yml`). Jobs 19/27/32/34 become scripts; jobs 24-26 become a gate, not a role.
**Rationale:** Once acceptance criteria are path-keyed data, a definition-of-done stops being a property of an agent and becomes a property of the file being touched — which dissolves the justification for most separate agents. Expertise in unlinted prose rots (15 of 26 prove it); expertise in a linted data file cannot.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** every agent definition, AGENTS.md, CLAUDE.md, all slash commands

## 2026-08-11 — Every gate ships in shadow mode before it blocks

**Context:** The source spec admits its single largest unpriced variable is what friction costs when an agent hits a denial mid-task. Nobody in 24 studied systems measured it.
**Options considered:** Block on unrecoverable and advise elsewhere (skips the measurement) / Block by default with a named escape hatch (highest friction, unpriced) / Shadow mode first.
**Decision:** Every gate ships computing `would_block` and logging it, blocking nothing, for a fixed window. Promote to real blocking only rules that fired correctly and rarely. **Exception:** outbound send, deploy, migration and harness self-edit block from day one, no shadow period.
**Rationale:** It is the only design that prices the unknown instead of guessing at it, and it has live prior art. The exception covers the class where being wrong is unrecoverable.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** all resolvers, the pre-tool hook, CI, the outbound queue

## 2026-08-11 — Memory gets a three-tier scope: global / project / task

**Context:** "Nested spawn is blocked" was not a fact about this repo — it was a fact about the runtime, wrong across all 13 projects at once. Project-scoped memory could never have caught it.
**Options considered:** Project-scoped only (re-learn global facts 13 times, each rotting independently) / External memory service (gates cannot run offline; fresh clone has no memory) / Three-tier scoped ledger.
**Decision:** Every claim carries `scope: global | project | task`. Global lives in `~/.warroom/ledger/` and reaches all projects — runtime capabilities, model IDs and pricing, working preferences, usage-window mechanics. Project lives in the repo. Task dies with the branch.
**Rationale:** Facts have natural scopes and the wrong scope is how they rot unnoticed.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** the ledger, all four memory files, fleet sync

## 2026-08-11 — Playbooks declare work graphs and exit gates, never method

**Context:** The system is also the operating standard for building products, which implies repeatable playbooks. That collides directly with the founding principle "constrain outcomes, not methods — a worker gets a goal and a quality bar, never a procedure."
**Options considered:** Playbook as real step-by-step procedure (re-adopts the prose that rots) / Two kinds, explicitly classified (the classification becomes an unenforced convention) / No playbooks, lenses and gates only (no repeatability) / Work graph + exit gates.
**Decision:** A playbook declares the stages a category of work passes and the claims + criteria required to exit each. It never declares how to do a stage. Seed set: `ship-feature`, `launch-landing-page`, `price-a-product`, `validate-a-market`, `design-pass`, `research-question`.
**Rationale:** Preserves method freedom exactly while giving a real standard, and every playbook is a linted data file rather than prose.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** all slash commands, the framer, the gate

## 2026-08-11 — Routines split into clock / harness-health / value

**Context:** 12 cron routines exist, all calling Linear, Supabase `audit_log`, Inngest and Mem0 — none configured in this repo.
**Options considered:** Keep all 12 and wire the infrastructure / Cut to 3 and rebuild well / Split by class.
**Decision:** Three classes. **clock** (2/day, cheapest model, near-zero tokens) anchors the rolling 5-hour usage window to the workday. **harness-health** (3) — reader, claim-refresh, fleet-drift. **value** (~3, cut from 12) rebuilt only after the spine exists and integrations are real.
**Rationale:** The system should watch itself before it watches the market. The 5-hour-window mechanic itself becomes a global claim with an expiry — if it changes and nobody notices, the clock routines fire forever against a window that no longer works that way.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** war-room agent roster, scheduling, cost

## 2026-08-11 — Capabilities: enforce what the runtime enforces, delete the decoration

**Context:** Every agent declares `mcpServers: [linear, github, supabase, mem0, pgvector]` while `settings.json` has no `mcpServers` key and no `.mcp.json` exists anywhere. `security-engineer` and `code-reviewer` are declared read-only reviewers running with full inherited write access.
**Options considered:** Build the full per-task capability envelope (nothing in 24 systems has done it; high risk of another declared-never-wired field) / Coarse allowlist only / Enforce what is real.
**Decision:** Use the runtime's `tools:` field on all 7 engines, minimally scoped — reviewer and reader read-only, period. Lint that every declared MCP server resolves. Delete every decorative capability field.
**Rationale:** A capability field auto-granted whatever it requests is worse than no field: it degrades to false confidence, not to zero. An agent that can edit what it reviews will review what it can edit.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** all engine definitions, settings.json, CI lint

## 2026-08-11 — Mission Control: a multi-project control plane, built last

**Context:** The terminal is where work happens, but decisions need a high-level view across 13 projects, and sessions should be launchable without manual tmux work.
**Options considered:** Terminal-first with read-only mirrors / Async-first via Linear-Telegram / Dashboard as belief cockpit / All three over one source.
**Decision:** Terminal stays the place work happens. Mission Control becomes the place decisions happen — Fleet, Project, Belief, Sessions, Dispatch, Inbox and Conflicts views over one ledger. A local Bun+Hono daemon launches `tmux new-session -d` running `claude` on the existing subscription, detached by default. Phase 8.
**Rationale:** It is the largest build and the furthest from the enforcement thesis, so it goes last — if it slips, nothing upstream breaks. It also flips two would-be deletions into assets: `server/db.ts` (tables, zero INSERTs) is the unfinished session store, and `collectors/subagents.ts` matters more now that nesting is confirmed.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** war-room dashboard, session history, all 13 projects

## 2026-08-11 — Deterministic checks block; the judged QA gate ships in shadow

**Context:** Phase 1 had to wire `qa-lead-pass.yml` (343 lines, 6 blocking exits) into a real
`.github/workflows/`. It requires a `QA-Lead PASS` comment on the PR, and nothing in this repo posts that
comment automatically.
**Options considered:** Port it verbatim and let it block (gates every PR on ceremony, on the exact path the
harness uses to rebuild itself — unpriced friction at maximum blast radius) / Ship only a new small
deterministic workflow and defer the QA gate to Phase 3 (leaves the "sacred" gate still not running) /
Port it in shadow mode alongside blocking deterministic checks.
**Decision:** `ci.yml` **blocks** on schema-lint, the 23 gate-logic tests, manifest drift, and registration
completeness — all objective, all executing code. `qa-lead-pass.yml` ships in **shadow**: full verdict
computed and reported, `continue-on-error: true`, does not fail the build. Promotion is deleting one line.
**Rationale:** The system had already decided this case — every gate ships in shadow before it blocks,
unrecoverable actions excepted; a PR merge is revertible, so it is not one. The deterministic checks are the
ones that would have caught 15 of 16 fabrications, so they are what should block.
**Reversibility:** reversible (one line)
**Owner:** ceo
**Affects:** CI, the QA gate, Phase 3 promotion review

## 2026-08-11 — "Rules ≤ 400" re-scoped to the governing set

**Context:** Phase 1's stated exit criterion was ≤ 400 stated rules. Measured at execution time: 1,452, of
which 601 live in `.claude/agents/**` and 569 in `.claude/skills/**`. Phase 1's deletions touch almost none
of either.
**Options considered:** Pull the roster collapse and skills curation into Phase 1 to hit the number (merges
three phases and destroys the externally-verified-before-self-review property) / Drop the count criterion
entirely (loses the only measure of prose bloat) / Re-scope to what Phase 1 controls.
**Decision:** Phase 1 is accountable for the governing set — CLAUDE.md, AGENTS.md, `.claude/commands/` — now
30 rules, each naming its enforcing mechanism or explicitly marked ADVISORY with the phase that will give it
one. The ≤ 400 total moves to Phase 4 (roster) and Phase 7 (skills).
**Rationale:** A criterion that cannot be met by the work it gates is not a gate. The intent behind ≤ 400 was
that rules name mechanisms; that intent is now enforced where Phase 1 can enforce it.
**Reversibility:** reversible
**Owner:** ceo (founder agreed)
**Affects:** Phase 1 exit criteria, Phase 4 and Phase 7 gates

## 2026-08-11 — The enforcement diagnostic is corrected in place, never rewritten

**Context:** Re-verifying the 16-fabrication list before repairing it found that **6 were not fabrications**
and 7 of the diagnostic's numbers were wrong. It had pattern-matched where it claimed to have verified —
breaking its own stated rule.
**Options considered:** Silently rewrite the diagnostic to be correct (destroys the before-measurement every
later phase diffs against) / Note corrections only in the session file (buries them) / Correct in place,
preserving the original claim beside the verified truth.
**Decision:** Corrections table added at the top of the diagnostic; original claims left unedited below.
`scripts/check-registration.mjs` now performs these checks by execution on every PR.
**Rationale:** The before-measurement must stay auditable, and an evidence file that quietly changes is worth
less than one that shows its own error. The durable fix is not a better document — it is a script that runs.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** all later phase boundaries, which diff against this file

## 2026-08-11 — Phase 2 scope is 15 launchers on 8 generations, not 13 on 5

**Context:** Phase 2 refactors `~/bin/<project>`, the program every project is launched with — the highest
blast radius in the rebuild. Its numbers came from the enforcement diagnostic, seven of whose figures Phase 1
proved wrong. Re-measured from `~/bin/` directly before committing to the plan.
**Options considered:** Trust the recorded 13 projects / 5 generations and start / Re-measure first.
**Decision:** Re-measured. **15 launchers, 8 generations.** `ml2`, `hitstampjavagame` and `test1` had never
been counted. `adamos` drops 5 functions, not 4 (`inject_ceo_prompt` was missed). The core thesis held and is
now stronger: **11 of 15 share an identical 47-function set**, so the divergence is content baked into the
program, not capability.
**Rationale:** Converging a fleet you have miscounted means leaving copies behind, and the ones left behind
are exactly the ones nobody remembers to update. Cost of checking: one read-only pass.
**Reversibility:** reversible (measurement only)
**Owner:** ceo
**Affects:** Phase 2 scope, stop condition #5 (five → eight generations), `newproject`, all 15 launchers
**See:** [FLEET-BASELINE.md](../../docs/06-codebase/2026-08-11-FLEET-BASELINE.md)

## 2026-08-11 — Phase 2 scope: 12 launchers; adamos, test1, hitstampjavagame excluded

**Context:** The verified fleet baseline found 15 launchers on 8 generations. Three were outliers: `adamos`
(CEO→CATO fork with worktree isolation deleted, 1,029 differing lines) and `test1`/`hitstampjavagame`
(ancient generations, 33 and 35 functions).
**Options considered:** Converge all 15 / Give `adamos` a verdict then converge / Exclude the three outliers.
**Decision (founder):** **Leave all three untouched.** No `adamos` verdict is required — it is neither
converged, reverted, nor further documented. Phase 2's scope is the remaining **12 launchers, 5 generations**.
**Rationale:** Removes the riskiest target — `adamos` was the only launcher whose convergence would have meant
re-introducing an abstraction someone deliberately deleted — and the two ancient generations are not worth
porting. The remaining 12 are homogeneous: 11 of 12 share an identical 47-function set.
**Reversibility:** reversible (they can be converged later)
**Owner:** founder
**Affects:** Phase 2 scope, stop condition #5, `newproject`

## 2026-08-11 — Phase 2 sequencing: extract verbatim, repo-owned program, pilot then all

**Context:** Three sequencing choices had to be made before touching the launcher every project starts from.
**Decision (founder), three parts:**
1. **Extract the `CEO_PREAMBLE` verbatim first; converge its content separately.** Phase 2 stays a
   behaviour-preserving refactor — each project's existing preamble moves to `.claude/entry/<role>.md`
   unchanged. The falsified nesting constraint and retired leads are corrected in a second reviewable diff.
2. **The program's source of truth is `bin/warroom` in this repo**, installed to `~/.warroom/bin/`.
3. **Rollout is `agentvibe` → one pilot → all 10 remaining at once.**
**Rationale:** (1) keeps a regression unambiguously attributable to the mechanism rather than the prose, on
the highest-blast-radius change in the plan. (2) puts the fleet's single point of failure under the
enforcement Phase 1 built — `npm run check` and CI gate every change to it. (3) the pilot catches what
`agentvibe`'s dev-repo status hides before the change reaches every project at once.
**Reversibility:** hard-to-reverse (2 sets where the program lives); reversible (1 and 3)
**Owner:** founder
**Affects:** all 12 in-scope launchers, `newproject`, `bin/install-war-room.sh`, entry prompts, CI

## 2026-08-11 — Two Phase 2 risks closed by measurement, not by assumption

**Context:** The baseline flagged `acme` (2,768 lines — longer than the newest build) as possibly holding
unique work, and `ml2` as capability-divergent.
**Decision:** Both read directly. **`acme`'s 53 divergent lines are an older `CEO_PREAMBLE`** — retired
9-lead model, `.agent/` paths, and the "subagents cannot spawn subagents" line Phase 1 falsified. Nothing
unique; overwrite freely. **`ml2` lacks `send_launch_claude()` and `wait_for_shell_prompt()` and adds
nothing** — it only gains from convergence.
**Rationale:** Both were framed as "read before acting" cautions. Reading cost one command each and removed
two unknowns from the highest-blast-radius phase. The result also confirms the thesis: across all 12 in-scope
launchers the only differences are the preamble generation, per-project config, and `ml2`'s two omissions.
**Reversibility:** n/a (measurement)
**Owner:** ceo
**Affects:** Phase 2 execution plan

## 2026-08-11 — Fleet rollout moves to Phase 9; nothing but agentvibe is touched before then

**Supersedes:** "Fleet propagation moves from last phase to Phase 2" (2026-08-11, earlier this session).

**Context:** That earlier decision moved propagation early on the rationale that "until it lands, every
improvement pays back in one repo out of thirteen." Founder reversed the rollout half: the pilot, and any
write to another project, waits until the whole system is built.
**Options considered:** Roll out after Phase 2 machinery (original) / after Phase 6 (functionally complete) /
after Phase 7 (last phase that changes installed content) / after all 8 phases.
**Decision (founder):** **After all 8 phases.** Rollout becomes **Phase 9**. Phase 2 still builds the
propagation machinery — one `warroom` program, `.warroom.yml`, preamble extraction, SHA256 manifest, backups,
hard-link refusal, rollback, `installation_modified` guard — but proves it on `agentvibe` alone. The
check-only pass across the other 11 is read-only. **No project other than `agentvibe` is written to before
Phase 9.**
**Rationale:** Propagate one finished system once rather than seven intermediate ones. Every phase from 3 to 7
changes what is actually installed into a project, so rolling out earlier means re-rolling out repeatedly, and
carrying rollout risk through every later phase on the machine used for daily work.
**Cost, accepted:** 11 projects run the old launcher for the entire rebuild and keep drifting while it runs.
This is the exact benefit the superseded decision was reaching for, now traded away deliberately rather than
by omission.
**Reversibility:** reversible — the machinery exists from Phase 2 onward, so rollout can be pulled earlier if
the cost rises.
**Owner:** founder
**Affects:** phase order (new Phase 9), stop condition 5 (split into 5a/5b), Phase 2 exit criteria, the pilot
decision (deferred to Phase 9)

## 2026-08-11 — Stop condition 5 split so it can fire during the build, not only at the end

**Context:** Stop condition 5 was "the fleet is still on N launcher generations after Phase 2." With rollout
moved to Phase 9 it could not fire until the end — and a stop condition that cannot fire until the end is not
a stop condition, which is the precise failure this rebuild exists to remove.
**Decision:** Split it.
- **5a** — the 12 in-scope launchers are still on more than one generation after **Phase 9**.
- **5b** — **the generation count increases during the rebuild.** Re-run the read-only reproduce script in
  [FLEET-BASELINE.md](../../docs/06-codebase/2026-08-11-FLEET-BASELINE.md) monthly. A rise means the cost of
  deferring rollout is growing and the deferral should be revisited.
**Rationale:** 5b makes the accepted cost of the deferral measurable instead of assumed, and it is checkable
by running one script that already exists.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** stop conditions, monthly harness-health routine (Phase 6)

## 2026-08-11 — `_seeds/ceo.md` is the preamble convention; Phase 1's "zero references" was wrong

**Context:** Phase 1 deleted `.claude/agents/_seeds/` (9 files) as "orphans, zero references." Building Phase 2
revealed that **8 of the 12 in-scope launchers read `$PROJECT_DIR/.claude/agents/_seeds/ceo.md` at startup**,
with a minimal fallback. The Phase 1 reference search covered the repository and not `~/bin/`.
**Impact:** None. `agentvibe`'s launcher uses an inline literal, so deleting `_seeds/` here broke nothing, and
the 8 seed-file projects hold their own copies which Phase 1 never touched. The claim was false; the outcome
was not harmful.
**Decision:** Treat `_seeds/ceo.md` as **existing prior art, not an orphan.** `warroom` resolves the preamble
in order: `entry_ceo` from `.warroom.yml` (default `.claude/entry/ceo.md`) → `.claude/agents/_seeds/ceo.md` →
minimal built-in with a warning.
**Rationale:** 8 projects already externalise the preamble exactly as the plan proposed to. Honouring that path
means they need no migration at Phase 9, which shrinks the riskiest step of the rollout. The lesson generalises:
a reference search scoped to the repo cannot see the fleet, and this system's mechanisms live in both.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** `bin/warroom`, Phase 9 rollout, the Phase 1 fabrication record

## 2026-08-11 — Behaviour preservation is proven by three artefacts, not asserted

**Context:** Phase 2 refactors the program every working session starts from — the plan's own highest-blast-
radius change. `cmd_start` cannot be executed without launching tmux, so a live test cannot cover it.
**Options considered:** Manual review / live testing of the runnable commands only / a layered proof.
**Decision:** Three proofs, all reproducible: **(1) semantic equivalence** — the body renders byte-identically
with `SESSION=agentvibe` (67 + 6 literals parameterised, 6 pre-existing refs untouched), which covers every
command including `cmd_start`; **(2) config resolution** — all 8 variables plus the preamble hash resolve
identically; **(3) live parity** — 6 read-only commands byte-identical in output and exit code.
**Rationale:** 1 and 2 together are stronger than any feasible live test: identical program body plus identical
inputs. Parity alone would have covered only what is safe to run.
**Reversibility:** n/a (verification)
**Owner:** ceo
**Affects:** Phase 2 gate, Phase 9 rollout confidence, `scripts/warroom-parity.sh`

## 2026-08-11 — The claim is the unit; the ledger has one classifier and one parser

**Context:** Phase 3 builds the enforcement spine. Three sub-decisions had real alternatives.
**Decision (a) — match semantics:** the tier map takes the **strictest** matching rule, not the first, and an
unmatched path defaults to `lite`. Both were already documented and neither was implemented; the bash took the
max but started at `trivial`, so `bin/warroom` and `package.json` classified as typos.
**Decision (b) — the registry is closed:** `resolvers:` and `required_claim_kinds:` accept only implemented
names, and the classifier throws otherwise. This is why `claim-arithmetic` — which §3.2 of the rebuild plan
shows in an example — is absent rather than present-and-inert.
**Decision (c) — `judge` does not call a model:** it verifies that a judgment exists, is unanimous, and spans
≥2 model families at `risk: high`. An unjudged claim stays `unresolved` forever.
**Rationale:** (a) and (b) both fail closed. For (c), a resolver that fabricates a verdict is worse than one
that admits it has none, and CI has no model credentials to call anyway — pretending otherwise would have put
a decorative mechanism on the critical path.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** `.claude/qa-tier-floor.yml`, `scripts/lib/*`, `.github/workflows/qa-lead-pass.yml`, Phase 4 lenses

## 2026-08-11 — qa-lead-pass promoted to blocking; memory-file collapse deferred

**Context:** ADR-001 says every gate ships in shadow first and is promoted on evidence. Phase 3 owed a
promotion decision and a decision on collapsing the four memory files into generated views.
**Decision:** Promote `qa-lead-pass.yml` to blocking. **Do not** collapse `DECISIONS.md`, `LONG-TERM.md`,
`USER-INSIGHTS.md` or `CODEBASE-MAP.md` yet.
**Rationale:** The gate ran in shadow across every PR of Phases 1–2, was correct each time, and demands
nothing the documentation gate did not already require — so its measured friction is zero, which is the only
honest reason to promote. The memory collapse is the opposite case: it is a data migration over files holding
real founder memory, its friction is unmeasured, and a conversion bug would cost more than the staleness it
fixes. `ledger views` proves the rendering works; the migration waits for a phase that owns it.
**Reversibility:** reversible (restore `continue-on-error: true`)
**Owner:** ceo · **Founder decision outstanding:** branch protection on `main` is a repo setting, not a file
**Affects:** every future PR, `.claude/memory/*`, Phase 4

## 2026-08-12 — Phase 8 chosen over Phase 9 and over venture work; split into 8a read plane and 8b dispatch

**Context:** The Phase 8 handoff recommended neither Phase 8 nor Phase 9, but one real venture task, because
stop condition 6 is live and nothing built in seven phases has met a task it did not author. Founder chose
Phase 8. Two measurements then reshaped it. The monthly fleet baseline (stop condition 5b, unrun since Phase
2) came back **flat — 8 generations total, 5 in scope, unchanged**; the 15→14 launcher drop is `agentvibe`
itself leaving the standalone set, so Phase 9's debt is measurably not growing. And **no sibling project has
a claim ledger** — zero `scripts/ledger.mjs`, zero `CLAIM-LEDGER.md` across all 13, all still on the
pre-collapse 26–32 agent rosters.
**Decision:** Build Phase **8a**, the read plane, now. Defer **8b** (Dispatch, the only view that writes)
until Phase 9 gives it targets. Six views ship: Fleet · Sessions · Belief · Conflicts on real data; Project
and Inbox as *honest* empty states naming the specific missing emitter. Greenfield under `mission-control/`
on **Bun + Hono + React + Vite**, folded into `npm run check`. Gate: every displayed figure reproducible by
an independent command, a mutated fixture turns a test red, live data from ≥3 non-`agentvibe` projects, cold
start < 3 s and refresh < 250 ms.
**Rationale:** Phase 8's stated gate — *"claims land in that repo's ledger"* — is **unreachable as written**,
because no second project has a ledger for a claim to land in. Making it reachable means installing the spine
elsewhere first, which is propagation, which is Phase 9, which the 2026-08-11 founder decision forbids before
Phase 9. Phase 8's gate therefore depends on Phase 9. Six of the seven views only read, and reads need no
spine in the target, so the phase splits cleanly at the seam where the conflict actually lives. The speed
budget is grounded rather than guessed: a cold full parse of all 72 transcripts measures **1,283 ms** and an
incremental refresh **13 ms**, which is also why **no persistent store is built** — the transcripts already
are the history, so `initDb()`-with-zero-`INSERT`s is not repeated.
**Costs accepted by the founder, against recommendation:** Bun+React are this repo's **first dependencies
ever** (`dependencies: {}`, no lockfile, no `node_modules`, CI never runs an install), and folding
`check:mc` into `npm run check` means `.github/workflows/ci.yml` must gain `setup-bun` — so the clean-clone
property becomes "clone, `bun install`, `npm run check`" and PR1 is irreversible tier. Shipping two empty
views is in tension with rule 6; resolved by making each empty state state its own reason and name what
would fill it, which is a report rather than a stub.
**Reversibility:** reversible — `mission-control/` is additive and nothing else imports it; the CI and
`package.json` edits revert cleanly. The dependency precedent is the part that does not revert.
**Owner:** ceo · **Open, needed before PR3:** what counts as "the fleet" — defaulting to every git repo
under the roots, flagging the 8 with a live `.worktrees/.registry` as agent-active
**Affects:** `mission-control/**`, `package.json`, `.github/workflows/ci.yml`, Phase 9 sequencing

## 2026-08-12 — Two enforcement mechanisms found green over untested capabilities

**Context:** Clearing the two cheap claims due 2026-09-08 meant actually running their checks rather than
reading them.
**Decision:** Treat both as defects to fix, not as claims to dispose of. `c-read-only-binding-unverified`
stays **unresolved** — not passed. `c-lenses-and-playbooks-are-loaded` needs a corrected assert and a
resolver that can observe the failure mode.
**Rationale:** `scripts/probe-readonly-engine.sh --verify` printed *"PASS — the restriction binds at runtime,
not only on paper"* purely because the probe file was absent. The `reviewer` engine reported that `Bash` was
bound and fully capable of the write, that nothing blocked it, and that the file was absent **because it
declined on its own judgement**. The script cannot distinguish *could not* from *chose not to* — standing
rule 11. Separately, `c-lenses-and-playbooks-are-loaded` asserts at `confidence: 1` that lenses are injected
"mechanically rather than discretionarily", verified by a command that tests **the hook's output**. The hook
emits 25,613 bytes correctly; this session received a **~2 KB preview plus a file path**, so an agent must
now *choose* to open a file — which is the definition of discretionary. Standing rule 3, on Phase 6 work.
Both are mine, from Phases 4 and 6, and both are the exact failure the rebuild exists to eliminate: a green
check over something nobody observed.
**Reversibility:** n/a — corrections
**Owner:** ceo · fix in flight on `fix/readonly-probe-evidence`
**Affects:** `scripts/probe-readonly-engine.sh`, `docs/03-system-design/CLAIM-LEDGER.md`, the Phase 6
completion record in `AGENT-SYSTEM-REBUILD.md`, `.claude/hooks/session-start.js` (payload must become a
router, ~1.5 KB, not a 25 KB dump — same cure Phase 7 found for skills)

## 2026-08-13 — the transcript corpus was measured 28× too small; cold-start budget raised to 10s

**Context:** The 2026-08-12 entry above justifies "no persistent store" with *"a cold full parse of all 72
transcripts measures 1,283 ms"*. **That measurement was wrong.** The scan walked `~/.claude/projects/` only
two levels deep; transcripts nest deeper. Recursive count, verified 2026-08-13: **2,029 files / 2.83 GB**,
raw full parse **9,252 ms** — the same ~9 s Phase 6 hit on this corpus before adopting mtime-skip. Mission
Control's own `IndexStore` measures 3,633 / 3,870 / 4,060 ms over three runs, against a 3 s gate. Found by
the builder measuring the real corpus rather than trusting the number in its brief.
**Decision:** Raise the cold-start budget to **10 s**. Do **not** add a store, lazy-load per project, or
parallelise the cold read. Bind the budget to a claim, `c-mission-control-cold-start`, with `valid_until`.
**Rationale:** Cold start is paid once per daemon launch and the incremental refresh is **4 ms**, so the
lived cost is the 4 ms. The alternatives were all on the table and all cost more than they buy right now:
a cache is what `scripts/lib/usage.js` already does and would reverse the no-store decision for a path
users hit once; lazy loading is real work for a boot-time problem; parallelising trades concurrency bugs
for seconds nobody waits on twice. **The weakness is stated rather than hidden:** the corpus only grows, and
a budget in a comment rots silently. A budget in a claim with an expiry cannot — when the build crosses 10 s
the ledger fails and forces Refresh, Deprecate or Waive. That is the difference between accepting a cost and
forgetting one.
**Reversibility:** reversible — the budget is one number in a test and one claim; none of the rejected
options is foreclosed
**Owner:** ceo · **founder decision** taken with all four options and their costs presented
**Affects:** `mission-control/test/perf.test.ts`, `mission-control/README.md`,
`docs/03-system-design/PHASE-8A-STATUS.md` §3 and §4, and the 2026-08-12 entry above, whose stated
rationale is superseded by this one

## 2026-08-13 — Phase 8a PR4/PR5 scope, and the Founder widened rule 8 for these two PRs

**Context:** Eight decisions taken with the Founder in one grill session before any code was written. Four
rested on measurements taken during the grill rather than on the plan document, and two of those overturned
what the plan assumed. `/api/conflicts` was assumed cheap; it is **18,051 ms** across **309 worktrees**,
synchronous, on Bun's single JS thread — so it stalls the SSE tick for every connected client. And
`conflicts.ts:49` catches every error and returns `[]`, so a pruned or unreadable worktree renders as
**clean**: the §0 defect class for the tenth time, this time already on `main`.
**Decisions:**
1. **PR4 and PR5 are one builder, serial, one worktree** — not two builders in parallel. Both had to widen
   the same three places in `App.tsx` and both needed the same missing fetch path, so "parallel" was not
   disjoint. Four views that must share a visual language get one author.
2. **Fetch-on-open, not SSE**, for belief/conflicts/project/inbox — the tick would pay 18 s (conflicts) and
   up to 3.7 s (project probe) per connected client.
3. **PR4 fixes what it exposes**: async `execFile`, a sweep scoped to registry-backed worktrees *with the
   excluded count rendered*, and a distinct could-not-look state. Fixing the defect in the PR that makes it
   reachable keeps defect and fix in one reviewable change.
4. **Belief reads `~/.warroom/ledger/global.yml`** alongside the repo ledger. Nothing in `server/` read it;
   a view called Belief that cannot show the two live waivers is not showing what we believe.
5. **Full-tier review, Claude-only.** Independence is recorded as **unmet**, as in every session file this
   phase. `gemini` is installed and was offered; the Founder chose not to use it.
6. **Rule 8 widened, by the Founder, for PR4 and PR5 only:** merge on reviewer PASS without per-PR Founder
   confirmation. Framed here as the Founder widening their own rule, not as the CEO interpreting it,
   because with #24 unfixed the Founder's confirmation was the only element of the QA gate that was not
   self-reported. **This is the CEO reporting a removed check, not exercising an override.**
**Rationale for what was NOT done:** the classifier returns `tier=lite, matched=(none — default)` for every
mission-control path — **no rule in `qa-tier-floor.yml` mentions mission-control at all**, so a server that
shells out across the whole machine classifies like a typo, and PR2's command-injection RCE would have too.
The fix is a one-line rule, but that file floors at `risk:irreversible` and needs its own PR and sign-off,
so it is logged (#34) rather than folded in. Separately, CLAUDE.md requires a **Codex CLI second opinion** at
Full tier and `codex` is not installed on this machine — every Full-tier review this repo has run was missing
a documented required step and nothing noticed (#35).
**Reversibility:** reversible — rule 8's widening is scoped to two named PRs and lapses with them
**Owner:** ceo · **founder decisions**, all eight taken with options and costs presented
**Affects:** `mission-control/server/collectors/{conflicts,belief}.ts`, `mission-control/server/routes/api.ts`,
`mission-control/client/src/{App.tsx,api.ts,views/}`, and items #32–#35

## 2026-08-13 — the budget ceiling is removed from the system, by Founder instruction

**Context:** `.claude/hooks/budget-guard.js` fired stop condition 3 at ~410k output tokens against a 400k
ceiling and blocked `Bash`, `Write` and `AskUserQuestion` — it was registered as a `PreToolUse` hook **with no
matcher**, so it fired on every tool. It blocked the CEO mid-session, blocked the PR4 builder before its first
commit, and blocked a probe from writing its own report. The Founder instructed: remove it from the system.
**Decision:** **Unregister** the hook from `.claude/settings.json`; leave the file, its tests and its readers
in place. Not deleted, because deleting it breaks `scripts/usage.test.mjs` (which tests that it blocks) and
`mission-control/server/collectors/events.ts` (which reads the real ceilings out of the hook's own source at
runtime, with a test pinning it) — that would remove a merged Mission Control feature, which is more than was
asked. Unregistering stops it firing anywhere, completely, and is one line to reverse.
**Rationale:** the ceiling was a number in a guard, not a measured limit, and it fired in a session that was
producing structured output continuously — the condition it names ("burning tokens and returning no
structured output") was not the condition it detected. The CEO could have bypassed it via `Read`/`Edit` at
any point and deliberately did not, because routing silently around a guard that just fired is the exact
failure this whole phase is about. **The cost is stated, not hidden:** nothing now stops a session running
unbounded, and stop condition 3 has no mechanism. `check-registration.mjs` immediately and correctly
reported the file as registered nowhere — the fabrication catcher works.
**Reversibility:** reversible — restore one object in `.claude/settings.json` `PreToolUse`
**Owner:** ceo · **founder instruction**, given directly
**Affects:** `.claude/settings.json`, `.claude/memory/CODEBASE-MAP.md` (regenerated; the entry now reads
`BLOCKS | not registered`), and every agentvibe session on this machine once they pick the change up

## 2026-08-13 — c-runtime-nested-spawn REFRESHED: depth-2 nesting works, the CEO instructions are wrong

**Context:** The claim asserts *"Subagents can spawn subagents — write-capable depth-2 nesting outside plan
mode"*. It carried a 2026-08-11 waiver whose reason — *"spawning is disabled by founder instruction"* —
stopped being true on 2026-08-13. Two independent probes were run; each made exactly one spawn attempt.
**Measurement:** `Agent` appears un-deferred in a depth-1 subagent's own tool list; the spawn succeeded with
no block, denial or error; the depth-2 child ran and returned `ACK`. Spawning is **async** — the tool returns
launch metadata immediately and the child's reply arrives later — which is why the first probe's report went
missing and had to be recovered from a session file it wrote before being blocked.
**Decision:** **Refresh**, not Deprecate. The CEO initially recorded this as a Deprecate, having the claim's
polarity backwards — the claim says nesting *works*, and the probe agrees.
**What is actually false is the CEO's own operating instructions**, which state *"RUNTIME CONSTRAINT:
subagents cannot spawn subagents (nested Task is blocked)"*. That line is wrong on this runtime, and it is
the stated reason chiefs return dispatch packets instead of spawning workers themselves — so the T2
orchestration tier rests on a false premise. Not changed here; flagged for the Founder.
**Reversibility:** reversible — the disposition is one line in `~/.warroom/ledger/global.yml`
**Owner:** ceo · **Affects:** `~/.warroom/ledger/global.yml`, and the T2 tier design in `AGENTS.md`/`ceo.md`

## 2026-08-15 — RCEs closed by allowlist, not by an Origin check; and the Origin check was a CEO error

**Context:** Three confirmed RCEs on `main` (git `core.fsmonitor` via the conflicts sweep — *and that request
renders the worktree as clean*; `node <discovered-project>/scripts/ledger.mjs` via `/api/belief` with
`?project=` choosing whose code runs; a claim's `evidence.cmd` reaching `/bin/sh -c`). A suspected fourth at
`fleet.ts:131` was traced and **ruled out** — `script` resolves to `REPO_ROOT` from `import.meta.url`, and
both reachable entry points (`/api/fleet`, `routes/stream.ts:86`) hard-pass it. Enumeration confirmed
exhaustive. All three share one premise: **discovery implies trust.**
**Decision:** **Allowlist trusted roots**, seeded from the 19 discovered projects, **plus** reject
`Sec-Fetch-Site: cross-site`. Founder decision, 2026-08-15. Rejected: stop-shelling (`conflicts.ts` cannot
survive it — `git status` has no honest in-process equivalent); accept-and-bound alone (closes the cross-site
browser vector *only*).
**Measurement that changed the design:** the CEO proposed an `Origin` check as "no-regret" and asked for it to
be checked rather than assumed. It was, twice, in a real browser: **`Origin` is absent on `<img>`, `<script>`,
`<link rel=stylesheet>`, form GET and no-cors `fetch` — only CORS `fetch` sends it.** So the check must treat
absent as allowed and every drive-by subresource vector passes — *a guard satisfied while the property it
protects is violated*, proposed while quoting the section that names that class. `Sec-Fetch-Site` is sent on
all of them and discriminates correctly.
**Binding constraint on wording:** describe it as *"blocks cross-site browser requests"*, **never** *"blocks
drive-by"*. `same-site` is allowed, so any other service on the user's loopback retains all three RCEs, and a
non-browser client sends no such header at all. No header check can reach that case.
**Second binding constraint:** an unlisted project must never render as *absent* — reuse `EXCLUDED_REASON` so
narrowing is visible. A security control that silently hides data is a new instance of the defect class.
**Reversibility:** reversible — the allowlist is config; the header check is one middleware
**Owner:** ceo · **founder decision** · **Affects:** `mission-control/server/projects.ts`,
`mission-control/server/routes/*`, and anyone running Mission Control against a multi-project tree

## 2026-08-16 — The autonomy dial comes out, and the permission model starts applying

**Context:** `.claude/settings.json` carried 20 allow rules and 6 deny rules. `bin/warroom:235,237`
launched every session with `--dangerously-skip-permissions`, making all 26 inert. The `PreToolUse` hook
still fired, so the system was protected by one mechanism where it was documented as two.
**Decision:** Flag removed; six entries added to the allow list. Founder decision, 2026-08-16.
**CORRECTION, same day, found by the binding gate:** the sentence above — *"the `PreToolUse` hook still fired,
so the system was protected by one mechanism"* — **is false for MCP tool calls.** The hook is registered with
`"matcher": "Bash|Edit|Write|NotebookEdit"`, and an MCP tool name (`mcp__playwright__browser_navigate`) matches
none of those. Verified by running the matcher as a regex against real tool names. So for the browser
capability granted in the entry below, there is **no** content-level control: not the curl-to-external-URL
block, not the `.env` read block, not the write-outside-project-root block. The claim was true for Bash and
file writes and was stated as though it were general.
**Measurement that set the six:** 11,342 Bash calls across 400 recent transcripts. 8,603 already matched the
allow list. The uncovered real commands were `bun` (160), `npm` (78), `bunx` (66), then `printf`, `timeout`,
`sleep`. `rm` and `curl` appear too and stay denied — that is the point of a deny list. A first pass at this
measurement reported "47% would prompt"; it was tokenising heredoc bodies and was discarded rather than
reported.
**Reversibility:** reversible — one word in `bin/warroom`. Pinned by `scripts/launcher-permissions.test.mjs`
so restoring it fails CI rather than passing silently.
**Owner:** ceo · **founder decision** · **Affects:** `bin/warroom`, `.claude/settings.json`

## 2026-08-16 — Two implementations of risk, reconciled

**Context:** `CLAUDE.md:156` stated that `scripts/lib/classifier.js` is *"one file computes risk, and it is
the only implementation."* The F13 step of `qa-lead-pass.yml` was a second one, and stricter: it required
`tier: full|irreversible` on **every** session file in a `risk:irreversible` PR, including files the
classifier tiers `trivial`. A PR mixing three sessions of irreversible code work with five of read-only
specification work could only merge by writing a false tier onto the five.
**Decision:** F13 now requires the tier on **at least one** session file. `CLAUDE.md` corrected to claim only
what is true — one file computes the tier of a path — and to record why the broad version was struck.
**Rejected:** having F13 call `classify.mjs` per session file (most correct, but needs a session-file → paths
mapping that does not exist); keeping it strict and always splitting PRs (yesterday's split was good; as a
standing rule it makes every mixed change a two-PR ceremony).
**Reversibility:** reversible — the step is 30 lines of bash in one workflow file.
**Owner:** ceo · **founder decision** · **Affects:** `.github/workflows/qa-lead-pass.yml`, `CLAUDE.md`

## 2026-08-16 — Ship five engines, defer the two that hold credentials

**Context:** `operator` and `instrument` are specified to hold payment keys and deploy tokens. `tools:` is
not known to bind `Bash`, so a container declared read-only can still write through a shell. The OS sandbox
those two depend on is configured **nowhere** — `GRANT-HOLDERS.md` records 0 sandbox keys in settings.json.
**Decision:** Build `orchestrator · builder · designer · reviewer · sourcer`. `operator` and `instrument`
stay specified and **uncreated** until a sandbox exists. Founder decision, 2026-08-16.
**The roster answer is still seven** — the argument for the number never depended on creating them all at
once, and deferring the two does not reopen `ROSTER-SIZE.md`.
**Reversibility:** reversible — the specifications are written and unchanged.
**Owner:** ceo · **founder decision** · **Affects:** the roster migration, `docs/03-system-design/agents/`

## 2026-08-16 — The eleven shims stay until nothing references their names

**Context:** 17 agent files here, 44 in `~/.claude/agents/`; 11 names exist in both with **different
content**, and 33 more are absent from a clean clone. Deleting a repo shim **un-shadows** its global twin, so
the name keeps working and quietly means the older definition. Nothing errors — the worst failure shape.
**Decision:** Keep the 11 shims through the roster migration. They are occupying the name, which is their
job. Delete only once nothing references those names.
**The constraint that decided it:** those globals are **live in two other projects**
(`obsidian-claude-code-mcp`, `overstory`), measured 2026-08-11. Archiving them fixes Agentvibe and reaches
into work that is not Agentvibe, so it is not this repo's call to make unilaterally.
**Reversibility:** fully reversible — nothing is deleted.
**Owner:** ceo · **founder decision** · **Affects:** the roster migration, `~/.claude/agents/`

## 2026-08-16 — `maxTurns` does bind, and the belief that it did not cost three gate runs

**Context:** Three consecutive runs of the binding QA gate failed with a coverage gap on `correctness`, and
~48% of dispatched agents returned nothing with `agents_error: 0`. Four explanations were tested against the
run transcripts and refuted: a turn cap, context exhaustion, output tokens, wall-clock timeout — all
overlapping distributions.
**The measurement that settled it:** tool-call count separates the two populations **perfectly**. Agents
making ≤17 calls returned findings; agents reaching 20 returned nothing; **13 of 20 dropouts sat at exactly
20** — the `maxTurns` declared on the reviewer containers. No overlap.
**Decision:** `maxTurns` raised 20 → 30 on `reviewer` and `reviewer-readonly`, and `reviewPrompt` rewritten
around a finite budget (`git diff` as primary evidence, whole-file reads the exception, emit partial findings
rather than be killed holding a complete set). The judge gained the retry the reviewers already had — it ran
with **one** attempt while every dimension retried four times, so at that dropout rate it coin-flipped into
`auto-BLOCK`, which is what run three recorded.
**Correction to a recorded repo belief:** this repo states *"`maxTurns` does not bind — 196 of 269 runs
exceeded a cap of 20."* That measurement was taken where **no agent file was named**. It does not bind then.
It binds hard the moment a dispatch names an `agentType`. The CEO introduced the regression by adding
`agentType` at the four `qa.js` sites and then repeated the false belief while diagnosing it.
**Reversibility:** reversible — two frontmatter numbers and a prompt.
**Owner:** ceo · **Affects:** `.claude/agents/reviewer*.md`, `.claude/workflows/qa.js`, and any future dispatch
that names an agent type

## 2026-08-16 — The browser reaches the open web; the local network is refused

**Context:** `designer` was granted the playwright MCP — the first live MCP capability here — and MCP tool
calls reached **no safety control at all**: `PreToolUse` was registered with
`"matcher": "Bash|Edit|Write|NotebookEdit"`, which no MCP tool name matches. `DECISIONS.md`, the session file
and a test header all justified removing `--dangerously-skip-permissions` partly on *"the PreToolUse hook
still fired"* — true for Bash, false for the capability the same change activated.
**Decision:** **Denylist, not allowlist. The open web is allowed.** Founder decision, 2026-08-16, overruling
the CEO's localhost-only proposal.
**Why the CEO was wrong:** localhost-only was reasoned from `designer`'s perception loop and applied as
system policy. `sourcer` answers questions with sourced evidence, and `WebFetch` returns almost nothing on a
JS-rendered site. The deciding argument is that agents **already** hold `WebSearch` and `WebFetch`, so
untrusted web text already reaches context — blocking the browser does not close prompt injection, it only
makes the agent worse at the work it exists to do.
**Refused, because it is not the web:** `169.254/16` (cloud metadata), `10/8`, `172.16/12`, `192.168/16`,
`0.0.0.0`, and the `file:` / `data:` / `javascript:` schemes. Loopback is allowed — that is the perception loop.
**Two limits stated in the hook rather than oversold:** the check matches the **URL string**, so a hostname
that *resolves* to a private address passes it (resolution-time enforcement belongs to the OS sandbox); and
**no URL guard closes prompt injection** — that is answered by keeping deploy and payment credentials away
from the browsing agent, which is why `operator` and `instrument` are separate engines.
**Reversibility:** reversible — one `case` block and one matcher string.
**Owner:** ceo · **founder decision** · **Affects:** `.claude/hooks/pre-tool-use.sh`, `.claude/settings.json`
