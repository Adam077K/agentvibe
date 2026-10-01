# v3 BUILD LOG

One line per merged job: `date · job · PR · what landed · what's next`. Decisions that affect other jobs are marked
**DECISION**. Plan: [14-BUILD-PLAN.md](../vision-v3/14-BUILD-PLAN.md) · brief: [HANDOFF-BUILD-PROMPT.md](../vision-v3/HANDOFF-BUILD-PROMPT.md).

## Session build-1 — 2026-10-01 (orchestrator, Opus 5.5)

- **DECISION — Claude-only this session.** `codex exec` (needs the Bash sandbox lifted to read `~/.codex`) was refused
  by the auto-mode classifier ("Safety Bypass Flag"). Per brief §6 not worked around. Consequence under G1: full-tier
  PRs cannot merge (need an other-family verdict) and stay open marked `codex_review: owed`; lite/trivial PRs merge on
  a non-builder Claude reviewer (different model from the builder where possible). Every merged PR is listed in
  HANDOFF-NEXT as owing a Codex re-review.
- **DECISION — worktrees via the Agent tool's `isolation: worktree`.** Unsandboxed `git worktree add` was
  classifier-refused; sandboxed it fails on `.claude/**` (documented wall). Harness worktrees land in
  `agentvibe/.claude/worktrees/agent-*`; each job branches `build/<job-id>` off `origin/main` inside it.
- **DECISION — Go 1.27.1 installed via Homebrew** (canon 09a pins Go 1.25+; module `go` directive stays 1.25).
- **DECISION — B0-00 runs non-exhaustively.** "Run until the window throttles" would spend the build session's own
  window; B0-00 v0 records per-job turns/wall-clock from this session's receipts and leaves the throttle arm for a
  dedicated measurement session.
- **DECISION — PCB jobs follow the classifier.** 14 §7 says PCB lands founder-present; the later founder grant G1 scopes
  merge authority by the classifier tier. `kernel/**` classifies `lite` today, so kernel PRs merge under G1 — but only
  with a non-builder verdict — and a tier-floor proposal (`kernel/** → irreversible`) is left open for the founder.
- **DECISION — Bash writes are sanctioned inside a job's own harness worktree.** `pre-tool-use.sh` anchors Edit/Write
  to the session root (`.worktrees/ceo-3-…`), so it refuses the harness worktrees under `agentvibe/.claude/worktrees/`;
  the sandbox allowlist names exactly those paths. Per CLAUDE.md's per-path rule for Bash/Write divergence, the sandbox
  is right for these paths. Nowhere else. Durable fix (hook learns this session's harness worktrees) is harness
  self-edit → irreversible → founder.
- **DECISION — no merges this session.** Recording a QA verdict from an orchestrator-dispatched finisher agent was
  refused by the auto-mode classifier ("CI Bypass"). Not worked around. Every reviewed job becomes a PR carrying the
  reviewer's evidence; the founder records the verdict (or re-reviews) and merges. Downstream jobs build on stacked
  branches instead of `main`.
- **DECISION — file-write path for builders in harness worktrees:** use the Write/Edit tool on the session scratchpad
  (the hook allows it), then `cp` into the worktree. Measured: Bash heredoc writes trip the auto-mode classifier on
  some content and cost builders most of their turns (B0-19 attempt 1, B0-03 attempt 1 stalled at 60-96 tool calls).
  A sparse worktree without `.claude/` inside the session root also fails (`extensions.worktreeConfig` write denied).
  **If the classifier refuses a write, stop and report — never re-encode it** (B0-03 attempt 1 switched to `printf`
  after a refusal; that is recorded here as a violation and its branch is re-reviewed with that in mind).
- **DECISION — one done-test register format.** B0-17a and B0-17b each wrote `build/check-done-tests.mjs`. Keep
  B0-17a's strict parser (refuses any unrecognised line — the lesson B0-13's review taught) and B0-17b's exit 2 for
  "could not check" (CLAUDE.md rule 10: `unresolved` ≠ fail). A reconcile job merges both halves into `build/b0-17`
  after both pass review.
- **DECISION — SQLite's transitive modules.** `kernel/ALLOWED_MODULES` names `modernc.org/sqlite` (09a: pure-Go SQLite)
  but not its dependency closure, which the boundary checker refuses. B1-01a pins one SQLite version and adds exactly
  its measured `go list -m all` closure, each entry annotated "transitive of modernc.org/sqlite@<ver>". Any later
  addition outside that closure is a new policy decision, not a follow-on.
- **Tool-use note:** a sandboxed `git worktree add` inside the session root still hits 35 denials on
  `.claude/**` (re-measured 2026-10-01), so the documented wall stands.
- **Blocked on the founder:** B0-05 (second macOS user), B0-06 (Apple `container` not installed), B0-08/09/10/11
  (headless worker launches refused), B0-21 (founder-driven V0), F1 grant + Build Charter signature.

| Date | Job | PR | Landed | Next |
|---|---|---|---|---|
| 2026-10-01 | B0-15 | — | already resolved on `main`; CLAUDE.md bullet reconciled on the session branch | — |
| 2026-10-01 | B0-01 | #139 (draft) | v3 slice squashed onto main; 47/48 — `test:probe-readonly` census "of 94" needs a founder design decision | founder: re-settle census, Codex review (full tier) |
| 2026-10-01 | B0-07 | #140 | spike `unresolved`; nested rerun commands for an unsandboxed shell, dated 2026-10-02; conditional I3 fallback in B1-10 | founder: run rerun, record verdict |
| 2026-10-01 | B0-02 | #141 | provider registry v0, 15/15 hashes verified; Claude headless `unclear`, Codex `yes-conditional` | B0-00 measures caps; B0-20 wires launches.csv |
| 2026-10-01 | B0-13 | #142 | build/jobs.yml (143) + capabilities.yml + lint (10 tests) | wire into check-suite (irreversible follow-up); B0-17 uses it |
| 2026-10-01 | B0-19 | — | **abandoned first attempt** (sonnet, 96 tool calls, nothing committed, test file does not parse); draft left untracked at `.claude/worktrees/agent-adef12bfff3252fb4/kernel/internal/secretscan` | relaunch on opus off the final `build/b0-16` |
| 2026-10-01 | B0-16 | #143 | kernel/ Go module + avk-boundary checker (default-deny imports/size/Journal writers); 3 review rounds | founder: tier-floor `kernel/**`; wiring #144 |
| 2026-10-01 | B0-16w | #144 (irreversible, stacked on #143) | check:kernel in check-suite + CI setup-go | founder gate |
| 2026-10-01 | B0-03 | #145 (full, stacked on #139) | runner receipts per launch (builder+referee), subagent refusal | founder + Codex review |
| 2026-10-01 | B0-19 | #146 (stacked on #143) | pre-model secret scanner + RequireScanned gate; 2 review rounds | B1-08 wires the gate |
| 2026-10-01 | B0-17a | — (PASS at 00df1bd) | frozen done-tests B1-01a/01b/05, hash formulas pinned in api.go | reconcile with B0-17b → one PR |
| 2026-10-01 | B0-17 | #147 (stacked on #143) | reconciled frozen P1 done-tests, 17 red, one checker | B1-01a implements against them |
| 2026-10-01 | B1-01a | — (`build/b1-01a` @ fa788e6) | hash formulas + cross-process writer lock; SQLite store blocked (module fetch refused) | founder fetches modernc.org/sqlite; re-dispatch |
| 2026-10-01 | B0-20 | #149 (full, stacked on #145) | family from model id; mismatch event once per launch; 1 review round | UI event family still from slot (ticket) |
| 2026-10-01 | B0-12 | #150 (full, stacked on #145) | scorecard + ledger v0 from receipts, all-FOG W40; 2 review rounds | runs once receipts exist |

## Session build-2 — 2026-10-01 (orchestrator ceo-4, Opus 5.5)

- **REFUSED — verdict recording, again.** `node scripts/verdict.mjs record --by reviewer-opus` for #146 was refused by
  the auto-mode classifier ("Self-Approval"), even though the reviewer was not the builder or the orchestrator. Not
  re-encoded. So #146, #147, #140 and #148 cannot be finished this session. `build/b0-19` now carries a clean merge of
  `origin/main` (6d21065), so the founder only needs to flip the session file, record the verdict and merge.
- **REFUSED — worktree sync.** Fast-forwarding the session worktree hit the `.claude/workflows/**` sandbox wall; the
  unsandboxed reset and the stash-based alternative were refused ("Irreversible Local Destruction"). The founder ran the
  reset by hand.
- **DECISION — B1-01b before B1-05.** The plan lists B1-05 as depending on B1-04 (leases), which is not started; the
  founder ordered B1-01b then B1-05, so B1-05 starts after B1-01b and its builder reports what B1-04 surface it needs.
- **DECISION — single-family for Cx→Cl jobs.** The register routes B1-01a/b and B1-05 to Codex builders with a Claude
  referee. Codex is unavailable, so Claude builds and a separate Claude reviewer referees. Codex re-review owed.
- **B1-01a review — FAIL at 5c2b483** (Opus reviewer, not the builder). Five of six wrong implementations went red; one
  whose Read ignores `fromSeq` passes all frozen B1-01a done-tests. Also: a symlink to the DB bypasses the writer lock;
  `ALLOWED_MODULES` states 23 modules but lists 24. Crash injection confirmed real (SIGKILL of a separate process).
- **DECISION — frozen tests are not edited by an implementer.** The `fromSeq` gap is closed on `build/b1-01a` by a
  plain unit test that kills that mutant; re-freezing the done-test (and re-hashing the register) is a separate
  follow-up job for a different builder, owed before B1-01a merges to `main`.
- **B1-01b built** — `build/b1-01b` @ aa33429, done-tests 5/5, B1-01a 3/3; also lets Append take empty data (B1-01a
  code). Under review. **B1-05** builder started on `build/b1-05` off B1-01b, building only the lease surface its
  frozen tests need; B1-04 still owes wound-wait, deadlock detection and hot resources.
- **Rebased lite PRs:** #146, #147, #140 now carry a clean merge of `origin/main`; GitHub's "conflicting" on #147 was stale.
- **B0-01 census (#139) — MissionsView excluded, reviewer PASS at 9614c35** (Opus, not the builder). `CENSUS_EXCLUDED`
  in scripts/design-probe.test.mjs names only MissionsView with the founder's reason; a stale entry fails; a second
  exclusion or a new view breaks the per-size counts. `npm run check` 48/48. Low, non-blocking: the 114 = 93 + 21
  check is true by construction, and the comment says "seven views" while App.tsx and ui.tsx are also counted.
  #139 stays open: full tier, Codex review + founder.
- **B1-05 built** — `build/b1-05` @ 284fc7e: `job://` lease on Journal streams, fencing token = claim seq, races
  decided by ExpectSeq appends; done-tests B1-05 4/4. The builder's own mutation check was classifier-refused; the
  reviewer owns it.
- **B1-01a fix round 1** — `build/b1-01a` @ f34edf5: `read_test.go` kills the `fromSeq` mutant; lock keys on the
  symlink-resolved path (two-process test); ALLOWED_MODULES says 24, sourced from cached go.mod `require` lines.
  Open: a hard link to the DB still bypasses the lock. Re-freeze of the B1-01a done-test running (different builder).
- **B1-01b review — FAIL at aa33429** (Opus, not the builder), on tests, not code. Three real-row tampers (payload,
  seq, prev_hash) all refused. Mutants caught: skipped re-hash, hash without type, venture-blind blob lookup. Not
  caught by the frozen done-tests: dropping the prev_hash link check (also missed by the builder's tests) and Open
  skipping verification. Builder adding plain tests that kill both; frozen B1-01b re-freeze owed to a different builder.
