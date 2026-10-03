# HANDOFF — build session 3 (2026-10-03, orchestrator ceo-1), read this first

**Start the next session INSIDE `…/agentvibe/.worktrees/ceo-1-1791038798`**, e.g. `cd` there, then run `claude`. Every job worktree sits under that worktree's `.worktrees/`, and the pre-tool-use hook refuses writes outside the session's project root. This session restarted rooted in `ceo-2` and could not write there. Run `caffeinate -dis` in a separate terminal so the Mac stays awake.

## 1. PR state (verify with `gh pr list --state open`; gh needs the sandbox off)

**Merged:** #164 B1-07 · #166 B1-08 launcher · #167 kernel budget raised to 15,000 · #169 B1-14a policy compiler.

| PR | What | State | Next action |
|---|---|---|---|
| #172 | B1-08h launcher hardening | CLEAN, reviewer-recorded verdict | merge now |
| #165 | agents use only Opus 5.5 / Sonnet 5.5 | bypass re-posted (subject `37166be1a6dc`), QA re-running | merge when the required checks are green |
| #170 | B1-08d real Consume store and grant status | BEHIND, verdict recorded by reviewer | `gh pr update-branch`, then merge when green |
| #171 | B1-04r lease remainder | BEHIND, verdict recorded by reviewer | update after #170 merges, then merge |
| #173 | B1-18 Userland budget ledger | BEHIND, verdict recorded by reviewer | update, then merge |
| #168 | verdict subject `--full-index` | Opus SHIP, but hardening is unfinished | see §3; merge LAST |

**Required checks:** `Deterministic checks` and `Verify QA Lead PASS` only. The `QA verdict (diff-bound)` check-run is an audit record and not required.

**Merge gotcha:** `update-branch` can change a PR's verdict subject when main touched the same files. Diff context lines are hashed, and #170 and #171 both touch `kernel/internal/lease/lease.go`. If `Verify QA Lead PASS` then fails with `reason=absent`, the REVIEWER re-records (protocol in §4). For a bypass PR, re-post the bypass with the new subject, from the job log `BYPASS REASON: <why> <subject>`, then remove and re-add the label.

**Merging:** the founder delegated merging to the orchestrator (2026-10-03). Merge only when the required checks are green. Never use `--admin`. Auto-merge is disabled in the repo.

## 2. Usable-first track (founder decision, 2026-10-03)

The founder wants to USE the system: the mission-control UI plus agents. The **Board, Launch an agent, Stop an agent, Decisions**, "and more". Autonomy and isolation can wait.
- The plan routes the Board (B1-19) behind B1-16a/b, B1-11a/b and founder host setup. **Drop that dependency for v0.** Build the Board straight from the Journal; verification and isolation follow later.
- mission-control already exists. Unmerged v3 work: #139 (v3 slice, B0-01, ~1,050 lines), #145 (runner receipts, B0-03), #149 (launch family, B0-20, CLEAN), #150 (scorecard and budget v0, B0-12, CLEAN). Their review/verdict status is UNKNOWN.
- **Step 1 is not done.** A scout to map mission-control (what works, the four PRs, each screen's gaps) was lost to the restart. Re-run it, then fan out 4–6 build jobs: Board, Launch (wire launcher B1-08 + runner B1-09a into mission-control dispatch), Stop, Decisions.
- Agents will run unisolated under the founder's user, with only the Claude Code sandbox. That's acceptable for attended use; never leave them unattended.
- **B1-09a** (runner + real Exec) is on the Launch path. Its tests are frozen at `build/b1-09a-tests-r1` @ `6a31de0` (hybrid exec ruling). **Its red-team never completed** (lost twice to restarts). Next: red-team → Sonnet implement → Opus review.

## 3. #168, the verdict subject hardening (unfinished)

The Opus review was SHIP. It found that user git config and env (color.ui, diff.noprefix, diff.external, textconv, GIT_DIFF_OPTS, GIT_EXTERNAL_DIFF, …) still change the subject, so a PASS for branch b1 could pass `check` on b2 under a hostile local config (LOW).
- **Builder WIP, uncommitted at the restart:** saved untested at `origin/wip/verdict-hardening` @ `e0a707a`.
- **Next:** Sonnet builder finishes it on `fix/verdict-full-index`: pinned flags plus env scrub, tests for each config, `npm run test:merge-gate`, `check:ledger`. Then an Opus delta re-review and a reviewer-recorded verdict.
- **Merge LAST.** It changes every subject, so re-record any verdict still open afterwards.

## 4. Process rules in force (all decided 2026-10-03)

- **Models:** agents use ONLY Opus 5.5 or Sonnet 5.5. **Opus** for test builders, red-teams and reviewers. **Sonnet** for implementers, shippers, scans and mechanical work. A Sonnet implementer that fails the same job twice escalates to Opus.
- **Pipeline:** tests (Opus) → red-team of the TESTS (Opus) → implement (Sonnet) → ship review (Opus).
  - Red-team only for jobs that decide what workers may do, or that touch money. Housekeeping skips it.
  - Ship bar: no HIGH and no MED-security. LOW and fail-safe MED go to follow-ups.
- **The REVIEWER records the verdict, never the builder** (founder ruling; the classifier also refuses builder self-approval). Until #168 merges, record with `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.abbrev GIT_CONFIG_VALUE_0=8 node scripts/verdict.mjs record --verdict PASS --by "<reviewer> (opus-5.5)"`. Commit the record before running `check`.
- **Never two agents in one worktree.** A re-freeze goes in a different worktree from the implementer's.
- **Hook or classifier refusal:** stop and report. Never route around it: not with another command, another directory, or a copy.
- **Protocol texts** (SHIP, REDTEAM, RECORD-VERDICT) are in `ceo-1-1791038798/.worktrees/_protocols/`, which is gitignored and local.

## 5. Rulings this session (detail is in each job's `build/done-tests/<id>.yml`)

- **Kernel budget 15,000** (founder).
- **HOME:** HOME is required in every launch request, and New refuses a grant with no HOME pin (founder + orchestrator).
- **Leases and grants:**
  - grants expire;
  - a revoke is final;
  - only the B1-05 claim lease admits a launch;
  - canonical lease encoding is `job://<id>#<decimal>`;
  - consume is a CAS on the claim stream.
- **Policy (B1-14a):**
  - P3–P8: the most restrictive wins (founder);
  - an empty decider means the founder (founder);
  - held > co_sign;
  - on a tie, Applied = 0;
  - the seed is compiled into Go;
  - wildcards only in rules;
  - canonical name grammar.
- **Runner (B1-09a):**
  - hybrid exec (founder);
  - an interrupted job stays terminal;
  - Run before Reconcile → ErrState;
  - capacity defaults to 4, max 12.
- **Budget (B1-18):**
  - Userland TS;
  - integer minor units;
  - `cash:<ISO4217>`, one currency per tranche;
  - zero amounts refused;
  - decide from the Journal only, never the projection.
- **Leases (B1-04r):**
  - max_wait 0 → 120 s;
  - negative refused;
  - starve even an older waiter;
  - a grant resets only the granted resources' clocks (accepted: the clock persists across non-waiting gaps, fail-safe; follow-up);
  - renew/heartbeat/shared deferred.

## 6. Follow-ups (not blocking)

- **B1-08h:**
  - a symlink inside a worker root is compared only after resolving;
  - launcher_test.go :205/:267 are weakened;
  - pin M3 and M21c;
  - F5 case/firmlink compare;
  - F8 incremental journal read.
- **B1-08d:**
  - ReleaseGrant uses time.Now;
  - the lease clock guard is unpinned and accepts the year 1700;
  - load doesn't validate superseded events.
- **B1-14a:**
  - a mid-pattern `*` matches one segment only;
  - one venture grammar shared with journal blob.go:43;
  - overlay blockers have no owner or remedy;
  - the contract doesn't bind the rule set;
  - the loader must set Admission;
  - add an untagged test.
- **B1-04r:**
  - the max_wait clock rule across gaps;
  - no MaxWait ceiling;
  - st.cycles is never pruned;
  - a running night is reported as failed;
  - Receive accepts any covering token (pre-existing glob/symbol hole; do this one first);
  - `TestRaceIsDecidedInStorage` flakes on main (4/40).
- **B1-18:**
  - the full-dump compare costs O(Journal) per call (16 ms at 5k events);
  - budget stream access control;
  - a correction event;
  - the production read path depends on B1-19;
  - a repo-local tsc;
  - the session file is over its cap.
- **CI does not run the Kernel Go tests.** PR #144 (B0-16) would fix that. Irreversible tier, founder sign-off; revive it.
- **Cross-family (Codex) review is owed** for #158–#173. The single-family risk is accepted until 2026-11-17.

## 7. Founder-only

- **Host setup** for B0-05, B0-06 and B0-09 (per-venture Unix users, container). It blocks B1-10, B1-11, B1-13 and B1-16, i.e. the isolation and autonomy track.
- **Permissions that would remove most stalls:** allow `Bash(git worktree add *)` and writes under `/private/tmp/claude-501/`. Already added: `Bash(node --test *)`.
- **Decision:** revive #144.
- **Optionally** enable repo auto-merge with `gh repo edit --enable-auto-merge`.
