# HANDOFF — build session 3 (2026-10-03, orchestrator ceo-1), read this first

**Worktree rule (learned the hard way).** The pre-tool-use hook refuses `Write`/`Edit` outside the session's OWN project root. So every job worktree must live under `<your session root>/.worktrees/`.
- Older job worktrees under `ceo-1-…/.worktrees/` and `ceo-2-…/.worktrees/` are NOT writable from a new session. Don't reuse them.
- Every branch is on origin. Make a fresh one with `git worktree add --detach "$(git rev-parse --show-toplevel)/.worktrees/<slug>" origin/<branch>`, then push with `git push origin HEAD:<branch>`. Use `--detach` when the branch is already checked out elsewhere. This needs the sandbox off; the classifier usually allows it.
- Inside nested worktrees, sandboxed git writes and `bun install` fail with EPERM. Run them with the sandbox off.

**Protocol texts** are on this branch: `docs/vision-v3/_process/PROTOCOL-{SHIP,REDTEAM,RECORD-VERDICT}.md`.

Run `caffeinate -dis` in a separate terminal so the Mac stays awake.

## 1. PR state, FINAL for this session (verify with `gh pr list --state open`; gh needs the sandbox off)

**Merged 2026-10-03:**
- #166 B1-08 launcher
- #167 Kernel budget raised to 15,000
- #169 B1-14a policy compiler
- #172 B1-08h launcher hardening
- #165 agents use only Opus 5.5 / Sonnet 5.5
- #170 B1-08d real Consume store and grant status
- #173 B1-18 Userland budget ledger
- #171 B1-04r lease remainder
- #168 verdict subject hardening, merged LAST (main = 6d331a6).

**After #168, verdicts no longer need the `core.abbrev=8` env.** Record with plain `node scripts/verdict.mjs record …`.

Kernel: 12,653 of 15,000 lines after #171.

**Still open from earlier sessions:**
- #139 (B0-01 mission-control v3 slice), #145 (B0-03), #149 (B0-20), #150 (B0-12): see §2.
- #144 (B0-16, CI runs the Kernel Go tests): founder decision.

**Required checks:** `Deterministic checks` and `Verify QA Lead PASS` only. The `QA verdict (diff-bound)` check-run is an audit record and not required.

**Merge gotcha:** `update-branch` can change a PR's verdict subject when main touched the same files. Diff context lines are hashed, and #170 and #171 both touch `kernel/internal/lease/lease.go`. If `Verify QA Lead PASS` then fails with `reason=absent`, the REVIEWER re-records (protocol in §4). For a bypass PR, re-post the bypass with the new subject, from the job log `BYPASS REASON: <why> <subject>`, then remove and re-add the label.

**Merging:** the founder delegated merging to the orchestrator (2026-10-03). Merge only when the required checks are green. Never use `--admin`. Auto-merge is disabled in the repo.

## 2. Usable-first track (founder decision, 2026-10-03)

The founder wants to USE the system: the mission-control UI plus agents. The **Board, Launch an agent, Stop an agent, Decisions**, "and more". Autonomy and isolation can wait.
- The plan routes the Board (B1-19) behind B1-16a/b, B1-11a/b and founder host setup. **Drop that dependency for v0.** Build the Board straight from the Journal; verification and isolation follow later.
### What a scout found (2026-10-03)

**On main today:** mission-control runs with `cd mission-control && bun install && bun run trust seed`, then `bun run server` (port 4300) and `bun run dev` (port 4301).
- Views: Fleet, Sessions, Belief, Conflicts, Inbox, Project, Dispatch.
- Dispatch = `POST /api/dispatch` appends to `~/.agentvibe/dispatch-queue.jsonl`. The founder runs `bun mission-control/scripts/consume-dispatch.ts`, which launches an orchestrator Claude session in the agentvibe repo.
- There is NO Board, NO Stop (the only `kill` is a `kill(pid,0)` probe), NO Decisions action (Inbox is read-only), and NO Kernel link (the socket has no read verb).

**The four open PRs are stacked branches.** Order: `build/b0-01` (#139), then `build/b0-03` (#145), then `build/b0-20` (#149) and `build/b0-12` (#150) in either order. All four have `qa_verdict: PENDING` and no verdict recorded.
- **#139:** adds the Missions Board (`client/src/views/MissionsView.tsx`: Waiting/Working/Done, a Launch button) and `server/routes/missions.ts` + `server/missions.ts`. It also adds `scripts/run-missions.ts`, which spawns a Claude Builder (`claude -p`) and a Codex Referee (`codex exec -s read-only`). The founder runs it; the server never spawns.
- **#145:** a refused Builder now goes back to Waiting, instead of reading as success.

**#139 Opus review** (findings only; NOT recorded, because `bun install` was sandbox-blocked and the unsandboxed retry was refused, so tests never ran). It meets the ship bar on findings, but fix these before relying on the Board:
- **MED** `run-missions.ts:194-207` parseVerdict accepts any `VERDICT:` line at any position. A Builder-echoed PASS can spoof the Referee. Accept only the last non-empty line, anchored `^VERDICT:`.
- **MED** `:163`/`:185` count a Write/Edit as written at tool call, before the result, so a refused write gets a `by: builder` receipt. Also on b0-03.
- **MED** `:265`/`:288` have no runner lock, so two runners launch one mission twice. A crashed runner leaves the card `working` forever; runnerPid is never read.
- **LOW:**
  - the result subtype is ignored;
  - at b0-01 the Builder blocks only `Bash` (`Bash,Agent,Task` arrives on b0-03);
  - the Builder may write `.claude/hooks` and `.git`;
  - the full env is inherited, where B1-07 has an env allowlist;
  - launches are logged to a tracked CSV;
  - the trust list isn't checked for `--workdir`.

**Shortest path to all four screens:**
- **J1:** land #139 (with the 3 MED fixes) then #145. Unblocks Board + Launch + Live.
- **J2:** Stop (S). The runner tracks child pids and stops on a `stop` line; a `stopped` fold; a button. Depends on J1.
- **J3:** Decisions v0 (M). `~/.agentvibe/decisions.jsonl` `decision_needed` records, `GET/POST /api/decisions`, `DecisionsView`; the runner waits on the answer. The server may append but never spawn. Parallel with J1, except for the `App.tsx` registry edit.
- **J4:** a single-port serve of `client/dist` plus a README run section (S). Independent.
- **J5:** land #149 and #150 (S, optional). After J1.

**Minimum for all four usable: J1 + J2 + J3.** mission-control tests need `bun install`. The founder should allow `Bash(bun install*)` and `Bash(bun test*)`, or run those unsandboxed.

**Risk:** agents run unisolated under the founder's user, with only the Claude Code sandbox. Fine for attended use; never leave them unattended.

### B1-09a (runner + real Exec), later on the Launch path

- **Tests:** frozen at `build/b1-09a-tests-r1` @ `6a31de0` (hybrid exec ruling).
- **Red-team r1 (2026-10-03): GAPS.** A correct reference passes 8/8, so reachability is proven, but 7 wrong implementations pass. Its proposed probes are saved in `docs/vision-v3/_process/B1-09a-REDTEAM-R1-PROBES.go.txt` on this branch.
- **Gaps to close:**
  - the writability check reads only the binary or its parent, and cases 4–5 compare `$0` unresolved (`/tmp` vs `/private/tmp`), so use EvalSymlinks;
  - in place skips the digest check;
  - the runner ignores Limits and Stdout, and never records exited/killed;
  - Reconcile skips a job whose leader died first;
  - a leader that exits 0 leaves its group alive;
  - SIGINT goes to the leader only, or SIGKILL comes at 2× the wall (tighten the slack);
  - hash-then-re-read copy;
  - no pid-reuse guard (needs a seam).
- **Test fixes:**
  - case 6's `Skipf` makes the test report ok wherever there's a world-writable ancestor (all of `$TMPDIR`, maybe CI); make it Fatal, or fixture outside `/tmp`;
  - ACLs are unpinned;
  - DaemonKilledMidJob fails under the sandbox (no TMPDIR in `d.Env`);
  - case 3 accepts any error.
- **Also:** `reap` cleanup doesn't run when a test dies by signal or timeout, so strays are left.
- **Next:** an Opus test builder closes the gaps and re-freezes, then a Sonnet implementer, then an Opus review.

## 3. #168, the verdict subject hardening (DONE, SHIP, reviewer-recorded at aa7626f)

It pins every diff option and scrubs the git env, so the subject is now a function of content only. merge-gate passed 224/224.

**Follow-ups (LOW):**
- add `--ignore-submodules=none --submodule=short`, because a committed `.gitmodules ignore=all` can make two trees share a subject;
- add `--no-replace-objects` (local refs/replace);
- `record` must refuse an empty diff; running from a subdir or with `GIT_WORK_TREE=/` hashes e3b0c…;
- the scrub drops `safe.directory`, so a foreign-owned checkout fails closed;
- the header should list every attribute source.

`origin/wip/verdict-hardening` can be deleted once #168 is merged.

## 4. Process rules in force (all decided 2026-10-03)

- **Models:** agents use ONLY Opus 5.5 or Sonnet 5.5. **Opus** for test builders, red-teams and reviewers. **Sonnet** for implementers, shippers, scans and mechanical work. A Sonnet implementer that fails the same job twice escalates to Opus.
- **Pipeline:** tests (Opus) → red-team of the TESTS (Opus) → implement (Sonnet) → ship review (Opus).
  - Red-team only for jobs that decide what workers may do, or that touch money. Housekeeping skips it.
  - Ship bar: no HIGH and no MED-security. LOW and fail-safe MED go to follow-ups.
- **The REVIEWER records the verdict, never the builder** (founder ruling; the classifier also refuses builder self-approval). Until #168 merges, record with `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.abbrev GIT_CONFIG_VALUE_0=8 node scripts/verdict.mjs record --verdict PASS --by "<reviewer> (opus-5.5)"`. Commit the record before running `check`.
- **Never two agents in one worktree.** A re-freeze goes in a different worktree from the implementer's.
- **Hook or classifier refusal:** stop and report. Never route around it: not with another command, another directory, or a copy.
- **Protocol texts** (SHIP, REDTEAM, RECORD-VERDICT) are in `docs/vision-v3/_process (PROTOCOL-*.md)/`, which is gitignored and local.

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
