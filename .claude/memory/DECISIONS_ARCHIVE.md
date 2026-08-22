# Architecture & Strategy Decisions — Archive
*Archived from DECISIONS.md on 2026-08-16. Reason: file exceeded 40,000-byte budget (was 58,166 bytes / 38 entries). Covered Phases 1-3 specifics and superseded decisions. Nothing deleted. See DECISIONS.md for current entries.*

*Second eviction 2026-08-22 (7 entries, byte cap again). **The citation check that authorised those seven was a title-phrase grep, not an exhaustive reference search.** It cannot see a citation made by date (`projects.ts:3` → “DECISIONS.md 2026-08-12”) or by paraphrase (`views.test.tsx:1961` → “the entry already in DECISIONS.md”), and four of the seven stubs asserted “no citations” when citations of exactly those kinds existed. Before deleting anything in this file — which `scripts/check-memory-budget.mjs:69-72` invites once “nothing references them any longer” — grep the entry's **date** and its distinctive **body** phrases, not only its title.*

---

## 2026-08-11 — Fleet propagation moves from last phase to Phase 2

**Context:** `~/bin/<project>` is a ~2,765-line bash launcher, one standalone copy per project across 13 projects. Normalized for project name they have drifted into **5 generations**; at function level four of them have identical 47-function sets, so the divergence is content baked into the program, not capability. `adamos` is a genuine fork — renames CEO→CATO and deletes worktree isolation entirely.
**Options considered:** Build propagation last, as the source spec advises / Build it early.
**Decision:** Split the launcher into one versioned program + per-project `.warroom.yml`. Move `CEO_PREAMBLE` out of the bash literal into `.claude/entry/<role>.md`. Phase 2, immediately after enforcement is wired.
**Rationale:** Until it lands, every improvement pays back in one repo out of thirteen. The fleet is already five generations apart with no update path, so drift is compounding.
**Reversibility:** hard-to-reverse (highest blast radius in the plan — it refactors the daily driver)
**Owner:** ceo
**Affects:** all 13 projects, `newproject`, `bin/install-war-room.sh`, entry prompts

## 2026-08-11 — Memory gets a three-tier scope: global / project / task

**Context:** "Nested spawn is blocked" was not a fact about this repo — it was a fact about the runtime, wrong across all 13 projects at once. Project-scoped memory could never have caught it.
**Options considered:** Project-scoped only (re-learn global facts 13 times, each rotting independently) / External memory service (gates cannot run offline; fresh clone has no memory) / Three-tier scoped ledger.
**Decision:** Every claim carries `scope: global | project | task`. Global lives in `~/.warroom/ledger/` and reaches all projects — runtime capabilities, model IDs and pricing, working preferences, usage-window mechanics. Project lives in the repo. Task dies with the branch.
**Rationale:** Facts have natural scopes and the wrong scope is how they rot unnoticed.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** the ledger, all four memory files, fleet sync

## 2026-08-11 — Routines split into clock / harness-health / value

**Context:** 12 cron routines exist, all calling Linear, Supabase `audit_log`, Inngest and Mem0 — none configured in this repo.
**Options considered:** Keep all 12 and wire the infrastructure / Cut to 3 and rebuild well / Split by class.
**Decision:** Three classes. **clock** (2/day, cheapest model, near-zero tokens) anchors the rolling 5-hour usage window to the workday. **harness-health** (3) — reader, claim-refresh, fleet-drift. **value** (~3, cut from 12) rebuilt only after the spine exists and integrations are real.
**Rationale:** The system should watch itself before it watches the market. The 5-hour-window mechanic itself becomes a global claim with an expiry — if it changes and nobody notices, the clock routines fire forever against a window that no longer works that way.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** war-room agent roster, scheduling, cost

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

---
*Eviction round 2026-08-22 — seven entries archived from DECISIONS.md. Criteria: reversible, Affects targets still exist but no citations by distinctive title phrase found in docs/·.claude/·scripts/·*.md.*

## 2026-08-11 — Playbooks declare work graphs and exit gates, never method

**Context:** The system is also the operating standard for building products, which implies repeatable playbooks. That collides directly with the founding principle "constrain outcomes, not methods — a worker gets a goal and a quality bar, never a procedure."
**Options considered:** Playbook as real step-by-step procedure (re-adopts the prose that rots) / Two kinds, explicitly classified (the classification becomes an unenforced convention) / No playbooks, lenses and gates only (no repeatability) / Work graph + exit gates.
**Decision:** A playbook declares the stages a category of work passes and the claims + criteria required to exit each. It never declares how to do a stage. Seed set: `ship-feature`, `launch-landing-page`, `price-a-product`, `validate-a-market`, `design-pass`, `research-question`.
**Rationale:** Preserves method freedom exactly while giving a real standard, and every playbook is a linted data file rather than prose.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** all slash commands, the framer, the gate

## 2026-08-11 — Capabilities: enforce what the runtime enforces, delete the decoration

**Context:** Every agent declares `mcpServers: [linear, github, supabase, mem0, pgvector]` while `settings.json` has no `mcpServers` key and no `.mcp.json` exists anywhere. `security-engineer` and `code-reviewer` are declared read-only reviewers running with full inherited write access.
**Options considered:** Build the full per-task capability envelope (nothing in 24 systems has done it; high risk of another declared-never-wired field) / Coarse allowlist only / Enforce what is real.
**Decision:** Use the runtime's `tools:` field on all 7 engines, minimally scoped — reviewer and reader read-only, period. Lint that every declared MCP server resolves. Delete every decorative capability field.
**Rationale:** A capability field auto-granted whatever it requests is worse than no field: it degrades to false confidence, not to zero. An agent that can edit what it reviews will review what it can edit.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** all engine definitions, settings.json, CI lint

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

