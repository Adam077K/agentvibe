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

## 2026-08-23 — P0 closed and merged; single-family review accepted as a risk, not satisfied

**Context:** Nine branches had accumulated unmerged and `main` had not moved since before 2026-08-20. All
five new ones declared `qa_verdict: PENDING`, so the gate refused every one of them. Recording PASS
presumed a decision nobody had made: irreversible tier asks for 2-of-3 multi-judge and `risk: high`
requires >=2 distinct model families, and there is no non-Anthropic model inside Claude Code.

**Options considered:** accept single-family review and record PASS / hold everything until a Codex
resolver exists (P0 item 6, deferred on real grounds) / record PASS only below irreversible tier.

**Decision:** Founder accepted single-family review for harness self-edits. Verdicts were recorded by an
agent that wrote none of the code, and each session file states the limitation as an **accepted risk, not
a satisfied requirement**. All nine merged: `5b8e127` -> `413a029` -> `f5c62ba`.

**Rationale:** the alternative was an indefinite freeze on a bar this runtime cannot clear. The reviews
did real work regardless — 3 P1s and 5 P2s on code its authors had already called finished, every P1 a
claim outrunning its mechanism ("unforgeable" check-run, "invokes" model families it does not, a
"deterministic" oracle that is a model's report).

**Also recorded, because it is checked rather than assumed:** branch protection exists and did **not**
bind on the path used — the push reported "2 of 2 required status checks are expected" and succeeded
having run none. Required checks govern the PR route only.

**Reversibility:** hard-to-reverse (merged to `main`; revertible per-branch)
**Owner:** ceo (`ceo-4-1787176363`)
**Affects:** every agent that merges, reviews, or reads a QA verdict; qa-lead-pass.yml; warroom merge

## 2026-08-20 — The audit round: a pre-authorisation whose precondition never held, and three false findings caught by re-running
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed and complete. The round closed: three of its findings were false and were caught by re-running, the pre-authorisation lapsed with its precondition, and the work it commissioned is superseded by the sessions that followed.*
***Cited in prose by 3 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/TARGET-ARCHITECTURE.md:5` (date), `docs/08-agents_work/sessions/2026-08-20-ceo-audit-and-challenge.md:19` (date), `docs/08-agents_work/sessions/2026-08-24-builder-drifted-figures.md:14` (date).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

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
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-22). Phase 6 is complete; the amended criteria are now the operative status quo.*
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

## 2026-08-11 — Roster collapses from 60 agent files to 7 engines, derived from a 38-job inventory
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. The roster is seven engines of eighteen files; the operative record is CLAUDE.md, `AGENTS.md`, and the `ENGINES` list in `.claude/hooks/schema-lint.js`, none of which reads this entry.*
***Cited in prose by 3 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/IMPLEMENTATION-PLAN.md:243` (date), `docs/06-codebase/2026-08-11-FLEET-BASELINE.md:128` (date), `docs/08-agents_work/sessions/2026-08-11-ceo-agent-system-rebuild.md:61` (title-phrase).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-11 — Every gate ships in shadow mode before it blocks

**Context:** The source spec admits its single largest unpriced variable is what friction costs when an agent hits a denial mid-task. Nobody in 24 studied systems measured it.
**Options considered:** Block on unrecoverable and advise elsewhere (skips the measurement) / Block by default with a named escape hatch (highest friction, unpriced) / Shadow mode first.
**Decision:** Every gate ships computing `would_block` and logging it, blocking nothing, for a fixed window. Promote to real blocking only rules that fired correctly and rarely. **Exception:** outbound send, deploy, migration and harness self-edit block from day one, no shadow period.
**Rationale:** It is the only design that prices the unknown instead of guessing at it, and it has live prior art. The exception covers the class where being wrong is unrecoverable.
**Reversibility:** reversible
**Owner:** ceo
**Affects:** all resolvers, the pre-tool hook, CI, the outbound queue

## 2026-08-11 — Playbooks declare work graphs and exit gates, never method
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-22). Decision is implemented in `.claude/playbooks/` and CLAUDE.md. **Checked by title-phrase grep only, and none found** — the rule itself is restated in `schema-lint.js:1428` and `ci.yml:148`, but neither references this record.*
## 2026-08-11 — Capabilities: enforce what the runtime enforces, delete the decoration
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-22). Decision is implemented in schema-lint and agent definitions. **Cited, and the original stub was wrong to say otherwise:** `docs/03-system-design/TARGET-ARCHITECTURE.md` lists this entry under **Keep** for the Mem0 deletion sweep — its `Context:` line is the record that `mcpServers: [... mem0 ...]` was declared while no MCP config existed. Do not delete: a true statement the sweep must not take with it.*
## 2026-08-11 — The claim is the unit; the ledger has one classifier and one parser
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. All three sub-decisions shipped; `docs/03-system-design/adr/001-claim-ledger-as-enforcement-spine.md` and `docs/03-system-design/CLAIM-LEDGER.md` are the operative record.*
***Cited in prose by 2 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/IMPLEMENTATION-PLAN.md:243` (date), `docs/06-codebase/2026-08-11-FLEET-BASELINE.md:128` (date).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-11 — qa-lead-pass promoted to blocking; memory-file collapse deferred
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-22). Completed action; the gate is live. **Checked by title-phrase grep only, and none found** — `PHASE-3-HANDOFF.md:57` and `AGENT-SYSTEM-REBUILD.md:314` record the same promotion independently, without citing this record.*
## 2026-08-12 — Phase 8 chosen over Phase 9 and over venture work; split into 8a read plane and 8b dispatch
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-22). Phase 8a complete; scope decisions executed. **Cited by date rather than by phrase, which the title grep could not see:** `mission-control/server/projects.ts:3` reads *“Fleet scope decision (already made, see .claude/memory/DECISIONS.md 2026-08-12)”*, and the default it relies on — every git repo under the roots is a project, `.worktrees/.registry` flags it agent-active — is this entry's `Open, needed before PR3:` line, now in the archive. **Also cited:** `mission-control/test/crosscheck.test.ts:2` quotes this entry's Phase 8a gate; `docs/08-agents_work/sessions/2026-08-13-ceo-corpus-correction.md:10` names it as the record superseded; `docs/03-system-design/AGENT-ARCHITECTURE.md:608` names `projects.ts:3` as a by-date citer (second-order); `docs/08-agents_work/2026-08-13-rethink-board.md:53` calls this file's positional links a defect.*
## 2026-08-12 — Two enforcement mechanisms found green over untested capabilities
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-22). Historical defect-finding; corrections are in `scripts/`. **Cited in three live files, and the original stub was wrong to say none:** `docs/08-agents_work/2026-08-13-rethink-board.md:19` quotes this body verbatim (*“an agent must now choose to open a file — which is the definition of discretionary”*); `mission-control/test/collectors.test.ts:445` invokes it as *“the ‘two green checks over one untested capability’ pattern already in DECISIONS.md”* to justify deleting a barrier that never fired; and `mission-control/test/views.test.tsx:1961` as *“a green check over an untested capability, which is the entry already in DECISIONS.md”* to refuse a coverage percentage as evidence. Two tests reason from this record.*
## 2026-08-13 — the transcript corpus was measured 28× too small; cold-start budget raised to 10s
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. The 10s budget is one number in `mission-control/test/perf.test.ts` and the claim `c-mission-control-cold-start`, both of which fail if it drifts.*
***Cited in prose by 2 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/IMPLEMENTATION-PLAN.md:198` (date), `docs/08-agents_work/sessions/2026-08-13-ceo-phase-8a-status.md:9` (date).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-13 — Phase 8a PR4/PR5 scope, and the Founder widened rule 8 for these two PRs
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-24). Phase 8a is complete and the widening was explicitly scoped to PR4/PR5 only, so the decision is spent. **Cited by phrase in three session files**, all of which restate the widening themselves rather than relying on this record: `docs/08-agents_work/sessions/2026-08-13-ceo-phase-8a-pr4-grill.md:10`, `docs/08-agents_work/sessions/2026-08-14-ceo-mc-project-inbox.md:13`, `docs/08-agents_work/sessions/2026-08-14-ceo-mc-belief-conflicts.md:13`. Note `IMPLEMENTATION-PLAN.md:198` cites "DECISIONS.md 2026-08-13" by date, but for the cold-start budget entry, not this one.*
## 2026-08-13 — the budget ceiling is removed from the system, by Founder instruction
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. The `PreToolUse` object is gone from `.claude/settings.json`; restoring that one object is the whole reversal.*
***Cited in prose by 2 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/IMPLEMENTATION-PLAN.md:198` (date), `docs/08-agents_work/sessions/2026-08-13-ceo-phase-8a-status.md:9` (date).*
*Not checked: paraphrase, global-scope-claims, title-too-generic — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

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
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. The allowlist shipped and the Origin check was withdrawn as an error. Security history, preserved verbatim rather than summarised.*
***Cited in prose by 2 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/TARGET-ARCHITECTURE.md:428` (date), `docs/08-agents_work/sessions/2026-08-15-ceo-rce-allowlist.md:9` (date).*
*Not checked: paraphrase, global-scope-claims, title-too-generic — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-16 — The autonomy dial comes out, and the permission model starts applying
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. `--dangerously-skip-permissions` is gone from `bin/warroom`, and `scripts/launcher-permissions.test.mjs` fails if it returns.*
***Cited in prose by 1 location(s)**, which the heading above keeps resolvable: `docs/08-agents_work/sessions/2026-08-16-builder-token-efficiency.md:9` (date).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-16 — Two implementations of risk, reconciled
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. The two implementations were reconciled on 2026-08-16 and `scripts/lib/classifier.js` is the surviving one; CLAUDE.md states the narrowed claim.*
***Cited in prose by 1 location(s)**, which the heading above keeps resolvable: `docs/08-agents_work/sessions/2026-08-16-builder-token-efficiency.md:9` (date).*
*Not checked: paraphrase, global-scope-claims, title-too-generic — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-16 — Ship five engines, defer the two that hold credentials
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-22). Roster decision captured in AGENTS.md and docs. **Cited, and the original stub was wrong to say otherwise:** `docs/08-agents_work/handoffs/2026-08-15-implementation.md:112-114` — *“whether `operator`/`instrument` wait for the OS sandbox (recorded in `DECISIONS.md` as: ship five, defer two)”* — which is an item still open on the founder, not a closed one.*
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
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. The grant is `.mcp.json` plus one matcher in `.claude/hooks/pre-tool-use.sh`; the live rule is `c-mcp-matcher-names-the-prefix-and-policy-decides` — **not** `c-mcp-hook-matcher-must-name-the-tool`, which the ledger deprecated once PR #73 made the matcher a prefix.*
***Cited in prose by 1 location(s)**, which the heading above keeps resolvable: `docs/08-agents_work/sessions/2026-08-16-builder-token-efficiency.md:9` (date).*
*Not checked: paraphrase, global-scope-claims, title-too-generic — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-24 — Act on the over-build audit, but check its premises first; split PRs by tier

**Decision:** the 2026-08-24 audit (`docs/08-agents_work/handoffs/2026-08-24-continue-the-build.md` §4.4)
ranked six items. All six were re-verified against `695800e` before any was actioned, and **two rest on false
premises**: item 1's claim that the 4× retry ceiling was sized against `maxTurns=20` is refuted by
`qa.js:270-272`, which records a turn cap tested **and discarded**; item 5 names `.claude/qa-tier-floor.yml`,
which contains no mention of model families at all. Both are corrected in the handoff rather than implemented,
and the retry values stay untouched — cutting them on a refuted premise would re-break a gate that cost three
failed runs to fix.
**Why this is a decision, not a detail:** the audit is the document authorising changes to the gate, and it
carried the same citation rot it was commissioned to cure. An audit is not exempt from its own finding.
**Work splits into three PRs by TIER, not by topic.** The tier floor is per-PR, so a single irreversible file
drags a whole PR to a 17–70-agent gate. Grouping by tier makes the irreversible files pay that gate once
instead of four times; it is the largest cost lever measured this session.
**Recorded and deferred by founder decision:** `.claude/workflows/qa.js` never reads
`.claude/review-lenses.yml` (`grep -c` → 0). The gate carries five hardcoded prose dimensions; the lens file
declares ten structured lenses; they share two names. That is *why* `independence: provenance` goes
unenforced — the gate cannot honour a property it never loads. Patch-and-record chosen over unification.
**Reversibility:** reversible — documentation, lint severities, and one loop bound.
**Owner:** ceo · **founder decision** · **Affects:** the 2026-08-24 handoff, `MODEL-DIVERSITY.md`, `qa.js`, `schema-lint.js`

## 2026-08-25 — Four founder decisions: scope, review weight, venture work, one living status

**Context:** Twelve days produced 15 handoff documents, 117 session files and four plan documents on disk
at once, while the QA gate has still never written a verdict and CI has been red since 2026-08-24 on one
environment-dependent test. Four open questions were settled in a single pass.

**Options considered:** finish the harness vs. start venture work now / keep the full 49-agent gate on
every PR vs. tier it by reversibility / continue the handoff chain vs. one living document.

**Decision — 1 · Scope:** complete Waves 1–4 of the target architecture. **Phase 9 fleet rollout is
excluded** — the plan's own P6, and no other project is touched.
**Decision — 2 · Review weight:** lean by default — 3 blinded reviewers plus the deterministic floor. The
full `qa.js` gate runs only where `git revert` does not undo the damage: `.github/workflows/`,
`.claude/agents/`, `.claude/hooks/`, the gate itself, credentials.
**Decision — 3 · Venture work: not yet.** The harness is finished first. Founder position, restated
2026-08-25 after being raised with the session count.
**Decision — 4 · Documentation:** one living `docs/STATUS.md`. The handoff chain retires — bannered
HISTORICAL, not deleted.

**Rationale:** (2) rests on this repo's own measurement, not on preference: a 49-agent gate run cost ~3.3M
tokens and found 3 P1s while missing the largest defect of the session; 3 blinded reviewers found 7 P1s at
a fraction of that. Panel size was never the signal — two reviewers converging independently was.
(4) a handoff is a snapshot addressed to one reader at one moment, and snapshots are superseded rather than
corrected, so a stale one is indistinguishable from a current one until both have been read. A living
document is corrected in place, which makes being wrong a bug someone fixes instead of a file someone adds.

**Cost, recorded once and not to be re-litigated:** (3) means every mechanism built in Waves 1–4 stays
untested against work that is not the harness itself, and stop conditions 6 and 7 stand at maximum
exposure — 117 session files, zero customer-facing work. (2) accepts that a lean panel will miss findings a
49-agent panel would catch, on the measured ground that the larger panel missed more.

**Reversibility:** reversible — four process decisions; (4) deletes no file and no history.
**Owner:** ceo · **founder decision** · **Affects:** `docs/STATUS.md`,
`docs/08-agents_work/handoffs/`, `qa.js` gate routing, and every future session's pre-flight read

## 2026-08-26 — Memory eviction is typed and mechanised; the archive rotates rather than being pruned

**Context:** `DECISIONS.md` stood at 39,675 of a blocking 40,000 while rule 4 tells every agent to append
here, so rule 4 was unfollowable. The same condition occurred at 91 bytes of headroom, was relieved by a
manual eviction, and the mechanism was never built.

**Options considered:** raise the cap (moves the wall, keeps the file unreadable) / evict by recency (the
oldest entries are the ones two test files and the ledger still reason from) / evict by type, keyed on
`Reversibility:` and `Affects:`, which every entry already carries.

**Decision:** typed eviction — `scripts/lib/memory-entries.js` classifies, `scripts/evict-memory.mjs`
applies, with no override flag. Irreversible-with-a-live-subject is never archived; all-`Affects:`-deleted
is archivable on sight; anything cited by a live claim is pinned; every archival leaves a stub under the
original heading. **The archive rotates into sequence-numbered volumes**, each capped independently.

**Rationale:** one capped archive relocates the pressure instead of relieving it — it stood at 34,472 of
its own 40,000 — and the only way to meet that cap is to delete history, which the overflow message
literally advised. A per-volume cap bounds what one reader must load and leaves the lifetime total free to
grow. Sequence keys, not period keys: a period key needs a second rule the moment one period overflows.

**Also recorded, because it changed a selection:** the number to act on is **net** — entry minus stub — not
size and not age. A 1,035-byte entry cited in 24 places nets 31 bytes and was left alone.

**Reversibility:** reversible — the volumes are files, the stubs name what moved, no byte was deleted.
**Owner:** builder (`builder-memory-eviction`)
**Affects:** `scripts/check-memory-budget.mjs`, `scripts/lib/memory-entries.js`, `scripts/evict-memory.mjs`,
`.claude/memory/DECISIONS.md`, `CLAUDE.md`
