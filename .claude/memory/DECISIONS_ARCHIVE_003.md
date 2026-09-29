# Architecture & Strategy Decisions — Archive, volume 3

*Opened 2026-09-29 by `node scripts/evict-memory.mjs apply`. This is an archive VOLUME: it is
capped at 40,000 bytes by `scripts/check-memory-budget.mjs`, which globs every
`DECISIONS_ARCHIVE*.md` rather than naming one file. When this volume fills, the eviction tool opens the
next one — the cap bounds what a reader must load, never the lifetime total, because a cap on the lifetime
total of an append-only decision log is a mechanism for losing decisions.*

*Every entry below was moved here by the typed eviction in `scripts/lib/memory-entries.js`, leaving a stub
in `DECISIONS.md` under the same heading. Before deleting anything from this file: grep the entry's **date**
and its distinctive **body** phrases, not only its title. The 2026-08-22 eviction ran a title grep alone and
four of its seven stubs claimed "no citations" while citations by date and by paraphrase existed.*

---

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
