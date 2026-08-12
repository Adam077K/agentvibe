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
