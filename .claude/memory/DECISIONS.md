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
