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
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-09-14). F2 round breadcrumb needs ~1.8KB; both entries are superseded by later ones and their bodies are in the archive*
***Cited in prose by 8 location(s)**, which the heading above keeps resolvable: `.claude/memory/LONG-TERM.md:19` (date), `docs/03-system-design/AGENT-SYSTEM-REBUILD.md:317` (date), `docs/08-agents_work/2026-08-13-rethink-board.md:19` (date), `docs/08-agents_work/2026-08-13-rethink-board.md:53` (date), `docs/08-agents_work/2026-08-13-rethink-board.md:82` (date), `docs/08-agents_work/sessions/2026-08-13-ceo-corpus-correction.md:10` (date), and 2 more.*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-12 — Three Phase 6 gate criteria amended, each by a measurement
*Archived to `DECISIONS_ARCHIVE.md` (2026-08-22). Phase 6 is complete; the amended criteria are now the operative status quo.*
## 2026-08-11 — Claim ledger replaces the diff gate as the enforcement spine
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-09-14). F2 round breadcrumb needs ~1.8KB; both entries are superseded by later ones and their bodies are in the archive*
***Cited in prose by 4 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/IMPLEMENTATION-PLAN.md:243` (date), `docs/06-codebase/2026-08-11-FLEET-BASELINE.md:128` (date), `docs/08-agents_work/sessions/2026-08-16-builder-false-spawn-constraint.md:9` (date), `docs/08-agents_work/sessions/2026-08-25-builder-memory-eviction.md:55` (title-phrase).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-11 — "Subagents cannot spawn subagents" is false; delete the dispatch-packet layer
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-09-14). Archived 2026-09-14 to stay under the 40,000-byte cap after the F2 founder-decisions entry; each subject is recorded in CLAUDE.md or the claim ledger*
***Cited in prose by 23 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/AGENT-ARCHITECTURE-REDIVE.md:67` (title-phrase), `docs/03-system-design/AGENT-ARCHITECTURE.md:396` (title-phrase), `docs/03-system-design/AGENT-SYSTEM-REBUILD.md:44` (title-phrase), `docs/03-system-design/CLAIM-LEDGER.md:19` (title-phrase), `docs/03-system-design/CLAIM-LEDGER.md:904` (title-phrase), `docs/03-system-design/IMPLEMENTATION-PLAN.md:243` (date), and 17 more.*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-11 — Roster collapses from 60 agent files to 7 engines, derived from a 38-job inventory
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. The roster is seven engines of eighteen files; the operative record is CLAUDE.md, `AGENTS.md`, and the `ENGINES` list in `.claude/hooks/schema-lint.js`, none of which reads this entry.*
***Cited in prose by 3 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/IMPLEMENTATION-PLAN.md:243` (date), `docs/06-codebase/2026-08-11-FLEET-BASELINE.md:128` (date), `docs/08-agents_work/sessions/2026-08-11-ceo-agent-system-rebuild.md:61` (title-phrase).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-11 — Every gate ships in shadow mode before it blocks
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-09-14). Archived 2026-09-14 to stay under the 40,000-byte cap after the F2 founder-decisions entry; each subject is recorded in CLAUDE.md or the claim ledger*
***Cited in prose by 9 location(s)**, which the heading above keeps resolvable: `.claude/mcp-policy.json:4` (title-phrase), `.claude/qa-tier-floor.yml:45` (title-phrase), `.github/workflows/qa-lead-pass.yml:5` (title-phrase), `docs/03-system-design/CLAIM-LEDGER.md:84` (title-phrase), `docs/03-system-design/IMPLEMENTATION-PLAN.md:243` (date), `docs/06-codebase/2026-08-11-FLEET-BASELINE.md:128` (date), and 3 more.*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

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
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-09-14). Archived 2026-09-14 to stay under the 40,000-byte cap after the F2 founder-decisions entry; each subject is recorded in CLAUDE.md or the claim ledger*
***Cited in prose by 2 location(s)**, which the heading above keeps resolvable: `docs/03-system-design/IMPLEMENTATION-PLAN.md:198` (date), `docs/08-agents_work/sessions/2026-08-13-ceo-phase-8a-status.md:9` (date).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

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
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-09-14). Archived 2026-09-14 to stay under the 40,000-byte cap after the F2 founder-decisions entry; each subject is recorded in CLAUDE.md or the claim ledger*
***Cited in prose by 1 location(s)**, which the heading above keeps resolvable: `docs/08-agents_work/sessions/2026-08-16-builder-token-efficiency.md:9` (date).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-16 — `maxTurns` does bind, and the belief that it did not cost three gate runs
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-09-15). room for the 2026-09-15 r8 breadcrumb*
***Cited in prose by 4 location(s)**, which the heading above keeps resolvable: `docs/08-agents_work/sessions/2026-08-16-builder-token-efficiency.md:9` (date), `scripts/lib/memory-entries.js:507` (title-phrase), `scripts/lib/memory-entries.js:508` (title-phrase), `scripts/lib/memory-entries.js:509` (title-phrase).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-16 — The browser reaches the open web; the local network is refused
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-08-26). Executed. The grant is `.mcp.json` plus one matcher in `.claude/hooks/pre-tool-use.sh`; the live rule is `c-mcp-matcher-names-the-prefix-and-policy-decides` — **not** `c-mcp-hook-matcher-must-name-the-tool`, which the ledger deprecated once PR #73 made the matcher a prefix.*
***Cited in prose by 1 location(s)**, which the heading above keeps resolvable: `docs/08-agents_work/sessions/2026-08-16-builder-token-efficiency.md:9` (date).*
*Not checked: paraphrase, global-scope-claims, title-too-generic — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

## 2026-08-24 — Act on the over-build audit, but check its premises first; split PRs by tier
*Archived to `DECISIONS_ARCHIVE_002.md` (2026-09-15). room for the 2026-09-15 r8 breadcrumb*
***Cited in prose by 2 location(s)**, which the heading above keeps resolvable: `CLAUDE.md:856` (date), `docs/03-system-design/AGENT-ARCHITECTURE.md:244` (date).*
*Not checked: paraphrase, global-scope-claims — a citation that names neither the date nor the title cannot be found by a scan, so read this as "two scans found nothing", not as "nothing cites it".*

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

## 2026-08-25 — Branch protection: fix `cmd_merge` first, then flip `enforce_admins`; CODEOWNERS dropped

**Context:** Branch protection exists on `main` and does not bind on the path actually used. Required
status checks govern the **pull-request route only** — a direct push prints *"Bypassed rule violations for
refs/heads/main: 2 of 2 required status checks are expected"* and succeeds having run none. Observed
2026-08-23 and twice on 2026-08-25. So every claim of the form "nothing merges without the gate" is true
only of the route people choose to take, which makes the gate's authority a convention rather than a
control.

**Options considered:** flip `enforce_admins` now (the obvious fix, and it bricks the merge path that
exists today) / add CODEOWNERS as a second control / fix the merge path first, then flip.

**Decision — order matters, and this is the whole decision.** Fix `cmd_merge` in `bin/warroom` to push a
branch and open a PR, **then** flip `enforce_admins`. Flipping first breaks the repo two ways, both
following from one fact verified in-worktree: `.github/workflows/qa-lead-pass.yml` triggers on
`pull_request` only — its `on:` block names `pull_request` and the file contains **zero** `push:` triggers
— while being a *required* check. So (1) with admins enforced, a direct push to `main` could never satisfy
a check that only ever runs on pull requests; and (2) `cmd_merge` merges into **local** `main` and never
pushes, so it would produce commits that can never reach `origin`.

**CODEOWNERS was dropped from the plan, not deferred.** Branch protection carries no
`required_pull_request_reviews` at all, so `require_code_owner_reviews` is unset and a CODEOWNERS file
would gate **nothing** — and on a solo repository, enabling code-owner review would deadlock the only
reviewer. A control that reports green while controlling nothing is the class this repo exists to refuse,
so adding one to look safer would have been the defect, not the fix.

**Provenance, kept separate because the two halves have different standing.** The API readings —
`enforce_admins: {enabled: false}`, `rulesets: []`, required checks `["Deterministic checks", "Verify QA
Lead PASS"]` with `strict: true`, no CODEOWNERS — are **reported by the team lead and not verified in a
worktree**: `gh` is denied by the sandbox's `denyRead` on `~/.config/gh`, which is working as intended. The
workflow trigger, the absence of a tracked CODEOWNERS, and `cmd_merge`'s never-pushes behaviour **are**
verified here. Do not promote the first group to "verified" without re-running it against the API.

**Reversibility:** reversible — `enforce_admins` is one repository setting and `cmd_merge` is one function.
Note that only the Founder can change the setting; it is not a file in this repo.
**Owner:** ceo · **founder decision 2026-08-25**
**Affects:** `bin/warroom` (`cmd_merge`), `.github/workflows/qa-lead-pass.yml`, `docs/STATUS.md`, and every
agent that believes the QA gate is binding on all routes

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

## 2026-08-26 — Done is "the loop runs itself"; nine PRs wired the circulation and did not start the heart

**Context:** the wave needed a definition of done a reader could check rather than argue about. Rule 4
requires a choice affecting others to be appended here, and the choice that defined this entire wave never
was — `grep 'loop runs itself'` returns **0** against a control of 51 for `decision`. The 2026-08-25 entry
above records the reaffirmation half only.

**Options considered:** done = every specified surface is built / done = the loop runs itself / done = one
venture task shipped end to end.

**Decision (founder, 2026-08-26): done = *the loop runs itself*.** Waves A+B+C in scope. **Mission-control
surfaces and P1 portability are deferred** — real work, deliberately not on the path to that definition.
The companion decision, *proof = harness work only*, **reaffirms** the 2026-08-25 entry above rather than
replacing it; read it there rather than here.

**What it produced:** nine PRs, `47dbbd6` → `d1294a4`, **127 commits**, main CI **57/57 · 0 failed · 0
skipped**, **50 verdict records**. The closures, compactly: six chain-guard bypasses (#114) · `sourcer`
granted a narrow `mcpServers: [claim-append]` and **not a `Write` tool** (#112) · an honest dispatch signal
(#110) · `verdict.mjs` refusing unknown flags (#116) · a refusal made a terminal value distinct from a block
(#115) · fixture-position sweeps (#117) · `gate:` made executable, 6 of 6 triggers, `framer` 0 → 5 (#113) ·
the orchestrator reaching the gate, **and only the orchestrator, by design** (#111) · the QA bypass bound to
its diff, its failure path observed on the runner (#109).

**What it did NOT establish, stated as plainly as the wins:**
- **The circulation is wired; the heart has not started.** The orchestrator *is* the session, and
  `bin/warroom` sends a bare `claude`. The loop still begins where a person types.
- **`gate: qa-verdict` runs `verdict.mjs check`: it VERIFIES that a verdict exists and binds, and does not
  PRODUCE one.** So the loop can check the gate autonomously and still cannot pass it without a session
  invoking the panel.
- **All nine verdicts are author-recorded — one agent, one model family.** `irreversible` asks 2-of-3 and
  >=2 model families; neither is met. *The checks ran and are green* is not *the tier was satisfied*.
  Accepted risk, exit **2026-11-17**.
- **"Built" must not be read as "the gate met."** This repo has made that error twice — Phase 8b's exit gate
  and P0 item 6.

**One reversal, recorded because a decision was taken on bad evidence and then unwound:** the orchestrator
retired the `parseYamlSubset` backlog item on **plain-scalar** evidence and told three lanes to stand down.
The defect's real shape is a **block scalar**, where our parser and real YAML do disagree. **The item
stands** (durable record A55.1). A parallel session has since measured the root cause as `scanLines()`, a
whole-document pre-pass — **six losses, not one** — with the live corruption in `.claude/skills/CURATION.yml`
rather than in the `#` case the orchestrator named.

**Provenance, because the two halves have different standing:** the commit count, the 50 verdict records,
`framer`'s 5 dispatch sites, 6-of-6 triggers and `sourcer`'s grant were **re-derived in a worktree at
`d1294a4`**. Main's **57/57 CI result is reported by the team lead and is not verified here** — this sandbox
has no network.

**Reversibility:** hard-to-reverse — the definition reorders every remaining wave and the nine PRs are
merged; the deferrals themselves are reversible.
**Owner:** builder (`builder-one-living-status`) · **founder decision 2026-08-26**
**Affects:** `docs/STATUS.md`, `.claude/gates.yml`, `.claude/playbooks/`, `bin/warroom`, and every agent
that reads "built" as "gated"

## 2026-08-29 — Design: conformance binds, quality informs; taste enters once, as references

**CONFORMANCE CAN BIND. QUALITY CAN ONLY INFORM.** A design-quality PASS/BLOCK judge is ~0.543 accurate
against a designer panel only 0.741 self-consistent — a biased coin on the merge path, *reproducible
while invalid*, which looks exactly like a working mechanism. Corollary: evaluators agree with each other
5-17% of the time while each finds 18-60% of the real problems. **Weak judges are excellent FINDERS and
useless SCORERS — union, never average.** A panel returns findings, never a score. This explains a result
already measured here: three blinded reviewers found 7 P1s where a 49-agent gate found 3.

**Division of labour, founder direction 2026-08-29** (*"agents can do those small decisions or learn from
context, references"*): founder supplies **references, brand adjectives, no-gos**; the agent **derives
every value**. Taste enters once and nowhere else — no downstream judge can recover it. Also founder-set:
**1-3 outputs at high quality, not 40+**, which the evidence supports *against* the three-directions
ritual nobody in the corpus defends.

**Root cause was not taste.** The `design` lens — in a file whose job is "how to PRODUCE work" — has five
steps and every one is a judging action; `sources:` show it was rehoused from `design-critic.md`. **A
critic's checklist sat in the production procedure's slot.** Found three independent ways.

**What binds is a short list.** Only `npm run check` steps and `qa-lead-pass.yml`. Grep of `origin/main`
confirms **no code path loads a lens `procedure:` or a playbook's stages**, `qa.js` has five hardcoded
dimensions excluding `craft`, and `blocking_severities` is read by nothing outside the linter. **Design
conformance binds by being a test and by nothing else**; the lens and playbook are ADVISORY, labelled so.

**Reversibility:** reversible — additive scripts only; no agent file, workflow or STEP touched, floor `full`.
**Owner:** orchestrator (`ceo-4-1787566829`) · **founder direction 2026-08-29**
**Affects:** `.claude/lenses.yml`, `.claude/review-lenses.yml`, `.claude/playbooks/design-pass.yml`,
`scripts/build-tokens.mjs`, `scripts/design-probe.mjs`, `design/`, every future design dispatch

## 2026-09-14 — F2 round: the agents/work layer re-specified as five layers (S1.1); the pin lesson

**Decision (founder-reopened layer, run per `docs/vision-system/planning/HANDOFF-F2-agents-work-layer.md`).**
Eight blind research lanes, five materially different candidates, five independent attacks (111 findings,
28 (d)), then a synthesis: **consequence class decides who may act; a declared procedure decides how work
runs and what each step sees; a typed standing interest decides when work is due; an existence record
decides whether a worker may exist; exactly one standing party holds each duty that outlives its case —
lower layer governs.** Zero falsifiers against the six fixed boundaries, so **S1.1**, not S2.0. No
persistent roster; specialized knowledge is a skill version, never a reason for an agent; attributable
identity is mandatory and never a reason. Six founder packets (Q-016…Q-021). Record:
`docs/vision-system/planning/F2/05-selection-record.md`.

**Two mechanisms learned the hard way, recorded for every future session.** (1) Long subagent returns
truncate at ~4k chars and a drain over 16k is dropped; the full text is in the subagent transcript on disk
(LONG-TERM.md has the path). (2) **A registry may classify; only the pin may say what satisfies it.** Four
rechecks of one defect (RC-02 → RC2-02 → RC3-01/02 → RC4-01/02): a hand-written pin was defeated in turn by
`any`, by `forall`, by a value slot, then by editing the primitive table the walker trusted. Each repair
closed the named attack and the next sibling leaked. The structural fix is a pin-side allowlist of
admissible ancestors plus a pinned digest of the table.

**Reversibility:** reversible — planning only; founder hold on building in force. **Owner:** orchestrator
`ceo-4-1789314685` · **Affects:** `docs/vision-system/**`, every future dispatch that expects a long return

## 2026-09-14 — Founder decisions on the agent layer; the F2 findings closed at specification level

**Decisions (founder, 2026-09-14, via decision prompts; recorded in `registers/open-questions.json` and
`inputs/FOUNDER-INPUT-2026-09-14-addendum.md`).** The five-reason list for creating an agent is **not
closed** — consequence class is admitted, so S1.1/WORK-1.1 stands on the founder's own gate (TC-35). Q-016
(d) founder as terminal owner, explicit exception. Q-017 (d) then, on the strict re-run that cut 46
acceptance roles to **3 standing** (personal data/deletion, grievance/rights, continuity day-five arm): staff
the three with the founder as declared exception; six flagged roles need a paired conformance case each
before admission; 32 dissolve into per-case acceptance. Q-018 (b) parks. Q-019 (d) then (b). Q-020 (a).
Q-021 placeholders. Q-022 stays with the founder (account read). The multi-field-agent thought is a dated
founder input now.

**State of the 54 Step 6 findings after five repair lanes and two independent rechecks** (recheck-02 on 18
older repairs: 13 closed / 5 partial; recheck-03 on 15 prose repairs: 12 closed / 1 partial): 33 closed by
recheck, 5 confirmed by reading, 6 author-recorded, 10 partial with named residues, **0 with no repair**.
Contracts-side repairs of the day await recheck-04 on the validated merged head. Nothing here lifts the
founder's hold; B01 not dispatched; one model family; no runtime exists.

**Reversibility:** reversible — planning only. **Owner:** orchestrator `ceo-4-1789314685` ·
**Affects:** `docs/vision-system/**`, `registers/open-questions.json`, every future lane's dispatch brief
(see LONG-TERM.md 2026-09-14 for the mechanics)
