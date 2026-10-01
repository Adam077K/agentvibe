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
- **B1-01b fix round 1** — `build/b1-01b` @ 776b72d: plain tests kill the prev_hash-link mutant (self-consistent
  middle-row rewrite), Open-skips-verify (two variants) and nil/empty Append data. A hook refused one compound shell
  command; the builder wrote the file via scratchpad + cp (the sanctioned path), not a re-encoding.
  Re-freeze of the B1-01b done-tests (+ forward merge of B1-01a) running — different builder.
- **B1-01a re-freeze** — `build/b1-01a` @ 204ffaa: frozen done-test gains `readFrom` checks; `B0-17a.yml` hash
  156d74c0 → 80292037 with a dated reason. The `fromSeq` mutant now fails it 2/3.
| 2026-10-01 | B1-01a | #151 (stacked on #147) | Journal core, review round 2 PASS at 204ffaa; hard link bypasses the lock (medium, non-blocking) | founder: verdict + merge after #147; Codex re-review owed |
- **B1-05 review — FAIL at 284fc7e** (Opus, not the builder). Seven of eight mutants caught; "Check ignores expiry"
  passes every test (p1). Medium: Release ignores the runner and tokens are guessable seqs; invalid UTF-8 ids break
  the stream forever. Low: ttl overflow. Builder fixing; a re-freeze of the frozen B1-05 tests is owed.
- **FOLLOW-UP — unowned lease scope.** Renew/heartbeat, shared mode and max_wait are assigned to B1-04 in code, but
  B1-04's plan row (14 §6) does not name them. They need an owner row in the plan.
- **B1-05 fix round 1** — `build/b1-05` @ 25f849c: Release requires holder runner + token (`ErrNotHolder`), invalid
  UTF-8 and ttl overflow refused, deterministic conflict test; each new test kills its mutant. Release's runner check
  stops a confused runner, not a hostile one; caller identity is B1-03's. B1-05 re-freeze running.
- **B1-01b re-freeze** — `build/b1-01b` @ 690d6a2 (different builder): B1-01a merged forward; frozen done-test gains
  `SelfConsistentRewriteRefused` and first-call-after-Open refusal; register 6401d663 → 7ecf4866, dated reason.
| 2026-10-01 | B1-01b | #152 (stacked on #151) | hash chain + blobs; review round 2 PASS at 690d6a2 | founder: verdict + merge after #151; Codex re-review owed |
- **FINDING — git authorship cannot prove builder separation.** Every agent commits as one author, so "a different
  builder re-froze the tests" rests on the register comment only. Per-agent commit identity is a follow-up.
- **B1-05 re-freeze 1** — `build/b1-05` @ 183320e (different builder): B1-01b merged forward; frozen tests gain the
  expiry check and one forced ExpectSeq conflict; register 8c397b8f → 79a77e01.
- **B1-05 review round 2 — FAIL at 183320e**, on tests again. Round-1 code findings fixed and covered. But mutant M1
  (decide on one read, append at a fresh head) is caught by the frozen race test only 7 of 20 runs: the cut-in fires
  after M1's second Head. Reviewer prototyped moving it after the first Head: correct 20/20 pass, M1 and M2 20/20 fail.
  Re-freeze 2 running (fresh non-implementer builder). Also fixing lease.go's pointer to BUILD-LOG, which is not on
  that branch; it will point at the plan row gap instead.
- **B1-02** — test author writing and freezing its done-tests on `build/b1-02-tests` (Go + TS round-trip, upcaster
  replay). Implementation comes after those tests are reviewed.
- **B1-05 re-freeze 2** — `build/b1-05` @ 28c3a09 (fresh non-implementer): race cut-in now fires after the first
  Head; register 79a77e01 → 5170fe93. 20 runs: real code 20/20 pass, M1 and M2 20/20 fail. Round-3 review running.
- **B1-02 tests, Go half frozen** — `build/b1-02-tests` @ 4090ea4: `kernel/internal/nouns` stub contract, 6 red
  done-tests (round-trip, malformed refusal, upcast replay keeps the decision, upcaster cannot change meaning,
  unchecked upcaster refused, kernel replays), fixtures, `build/done-tests/B1-02.yml`. A throwaway implementation
  goes 6/6 green. Under review (canon fidelity of the chosen wire format).
- **DECISION — Zod gets added in a follow-up job, B1-02-ts.** It is in no package.json. It is free and MIT, and the
  canon names it for Userland schemas, so DR-84 is met. B1-02-ts adds `zod` plus a JSON-Schema emitter, then freezes
  the TS round-trip done-tests against the same `testdata/nouns` fixtures. B1-02's implementation waits for both halves.
| 2026-10-01 | B1-05 | #153 (stacked on #152) | `job://` lease; review round 3 PASS at 28c3a09; race mutants 20/20 caught | founder: verdict + merge after #152; Codex re-review owed |
- **B1-02 Go done-tests — reviewer PASS at 4090ea4.** Fields match 09a §3 and §12.0; `decision.compiled` keys
  match canon §3; bigint carried as a decimal string contradicts nothing. 25 of 26 mutants killed; the survivor
  (Upcast aliasing `Data`) is outside the acceptance sentence. Low: an empty `business_key` is refused against
  the canon type; a comment omits the `held` disposition. Both fixed in B1-02-ts, now running (adds Zod and freezes
  the TS half on the same fixtures).
- **B1-02-ts frozen** — `build/b1-02-ts` @ cbd1787 (test author, not the implementer): `userland/` package with zod
  4.6.5 pinned exactly (built-in `z.toJSONSchema`, no second dep; classifier: lite); stub `src/nouns.ts`; TS
  done-tests on the shared fixtures, 99/99 subtests red; Go-half low fixes re-hashed. Six mutants killed against a
  throwaway implementation. Open, under review: `userland/` location chosen (none existed); npm lockfile vs the
  canon's pnpm; JSON Schema check validates via `z.fromJSONSchema`, not an independent validator.
- **B1-02-ts — reviewer PASS at cbd1787.** TS tests read the Go fixtures; reviewer's own implementation 99/99;
  every mutant red (incl. 4 emitted-schema mutants), so the `z.fromJSONSchema` check is not circular in practice.
  `userland/` accepted (canon names no folder).
- **DECISION — pnpm, per canon** (09a:59, :657). The npm lockfile from B1-02-ts is replaced by a pnpm lockfile in
  the Userland implementation job; `packageManager: pnpm@9.12.3`.
- **B1-02 implementation started** — two Opus builders in parallel off `build/b1-02-ts`: `build/b1-02-go` (kernel
  nouns + upcasters, plus a unit test that Upcast does not alias `Data`) and `build/b1-02-userland` (Zod schemas +
  pnpm). Each gets its own reviewer; they merge into one PR.
- **B1-02 Userland built** — `build/b1-02-userland` @ e6af4d4: Zod schemas 99/99; npm lock → pnpm lock (zod 4.6.5, same
  sha512), register Run line moved to pnpm by a non-implementer. **Review round 1 FAIL**: Userland accepts null/''
  where the contract forbids it (rationale, retention.deadline, provider_ref), accepts `subjects:[]`, and drops a
  `__proto__` key inside raw JSON. Builder fixing.
- **B1-02 Go built** — `build/b1-02-go` @ d62714f: 6/6 done-tests, no-alias unit test kills 4 mutants. Under review.
- **DECISION — JSON integers capped at 2^53−1 in both languages** (I-JSON safe range); Go aligns after its review.
  `1.0`/`1e0`/`-0` are value-equal after JSON.parse: accepted, documented mismatch.
- **FOLLOW-UP — `.pnpm-store/` lands in the repo root** on every install and the hook blocks removing it. Add it to
  `.gitignore` or set pnpm's store-dir outside the repo.
- **B1-02 Userland fix round 1** — `build/b1-02-userland` @ b0adb6b: raw JSON passed through uncopied (keeps
  `__proto__`), null/'' refused on rationale, retention.deadline, provider_ref; `subjects:[]` refused; 33 unit tests,
  15 of which fail on the pre-fix code. Re-review running.
- **VIOLATION (recorded, not repeated)** — during the pre-fix proof the hook refused `git checkout --`; the builder
  restored `userland/src/nouns.ts` by `cp` from its scratchpad instead. Only its own temporary mutation was discarded,
  but it reached the refused outcome by another route. Re-review checks the file matches the commits. Briefs now
  say: prove pre-fix failure in a `$TMPDIR` copy, never by mutating the worktree.
- **B1-02 Go review — FAIL at d62714f.** High: the decision reader matches keys case-insensitively (encoding/json
  default), so `"Disposition":"auto"` beside `"disposition":"never"` reads as auto — a past decision's meaning can
  flip. High: integers above 2^53−1 accepted. Builder fixing.
- **DECISION — the Kernel is the strict gate.** Go decodes exact-case keys and refuses duplicate and case-variant
  keys. JSON.parse cannot see either, so Userland stays laxer there; that mismatch fails closed at the Kernel and is
  accepted. Open risk for the Userland re-review: numbers above 2^53 inside raw `data` re-encoded with changed bytes.
- **B1-02 Userland review round 2 — FAIL at b0adb6b.** Round-1 items fixed and byte-identical to Go. New p1: a big
  integer inside raw `data` is rounded by JSON.parse before the schema sees it, so re-encoded bytes differ from what
  the Kernel hashes. Low: decode returns its input, not a copy.
- **DECISION — I-JSON integers everywhere.** Integers outside ±(2^53−1) are refused anywhere on the wire, raw fields
  included, in both languages. Userland gains a text entry point whose JSON.parse reviver reads `context.source`;
  Go scans raw fields with UseNumber. Both builders fixing.
- **B1-02 Go fix round 1** — `build/b1-02-go` @ a4bb380: exact-case keys, duplicate/case-variant keys refused at any
  depth, I-JSON integers refused everywhere incl. raw data. **Review round 2 PASS** (probes refused, no
  over-refusal, mutants killed except one judged equivalent by reasoning, not run).
- **DECISION — unsafe integers are judged by exact value, not notation.** `9007199254740993.0`, `9.007199254740993e15`
  and `1e300` are refused like `9007199254740993`; 1.5 stays accepted. Small follow-up on both halves.
- **B1-02 Go — PASS at 18a9d4d.** Unsafe integers refused by exact value from decimal digits (not math/big: a huge
  exponent would be a memory DoS). 23 probes correct; 1 MB literals decide in ≤6.4 ms; the "exponent ignored" mutant
  is killed. Waiting on the Userland half for one B1-02 PR.
- **B1-02 Userland fix round 2** — `build/b1-02-userland` @ 0531c37: text entry point reads number source via the
  JSON.parse reviver; unsafe integers refused by value from digits (200k-literal fuzz, 0 mismatches); decode returns
  a fresh object and refuses Proxy/getter/sparse. Unit 116/116, done 99/99. Round-3 review running.
- **FOLLOW-UP — float round-trip.** Non-integers that exceed double precision (9007199254740993.5) or underflow
  (1e-99999999999999999999) re-encode with different bytes in Userland. The Kernel hashes what it receives, so the
  chain stays consistent; Userland's re-encode promise does not. Proposed rule for both languages: refuse any number
  whose decimal value does not round-trip exactly through float64. New job, not blocking B1-02.
- **B1-02 Userland — round 3 PASS at 0531c37.** Go agreement 46/49 on number probes. The 3 differences fall under
  accepted rules or the float follow-up, which now also covers Userland normalising spellings inside raw data
  (`1E2` → `100`). Fix direction: carry raw fields as original text.
| 2026-10-01 | B1-02 | #154 (stacked on #153) | six nouns + Operation, Go + Userland (pnpm, zod 4.6.5), upcasters, shared wire rules; Go PASS at 18a9d4d, Userland PASS at 0531c37 | founder: verdict + merge after #153; Codex re-review owed |
- **`.pnpm-store/` fix found:** `--store-dir $TMPDIR/pnpm-store` keeps it out of the repo. Briefs use it from now on.
- **B1-03 tests written, NOT proven** — `build/b1-03-tests` @ 2b64920: stub `kernel/internal/socket`, 4 red done-tests,
  fixtures (7 valid / 34 invalid commands), `build/done-tests/B1-03.yml`. **BLOCKED:** every test binds a Unix socket;
  the Bash sandbox denies the bind and the classifier refused the unsandboxed run. Not re-encoded, not delegated.
  No mutant has been run, so non-vacuity is unproven and B1-03 cannot be built or verified locally. Founder: allow
  local socket binding for this repo (the `/sandbox` settings), or accept CI-only verification. The cross-uid open
  test only runs as root. To review: the Backend interface and the `{label,data}` wrapper for propose_event.
- **B1-04 tests frozen** — `build/b1-04-tests` @ 30471a9: stub `kernel/internal/lease/fence.go`, 7 red done-tests
  (all-or-nothing, wound-wait, deadlock, storage-side stale-token rejection, touched ≠ declared, SP2 B0-greedy and
  drill as JSON data from spike commit 2162926), `build/done-tests/B1-04.yml`. A throwaway implementation goes 7/7
  under -race; 10/10 mutants killed. Not tested: hot-resource auto-add, nightly scheduling, glob-vs-symbol overlap,
  non-`repo://` verifiers. Under review.
- **Founder approved the lite merges; verdict recording refused again ("Self-Approval").** Not retried. #146's session
  file is flipped to PASS and pushed (dcf95f5); its verdict must be recorded by the founder.
- **CORRECTION** — the verdict command written into HANDOFF-NEXT earlier this session passed `--ref origin/main`,
  which diffs main against itself and records an empty-diff subject (`e3b0c442…`, the sha256 of nothing). The
  default `--ref` is HEAD, which is correct; the flag is removed from the handoff. A wrong file was created once and
  deleted before any commit.
| 2026-10-01 | B0-19 | #146 → main (2d89879) | secret scanner + RequireScanned; verdict recorded by the founder, CI + QA green | B1-08 wires the gate; Codex re-review owed |
- **#147 brought up to `main` after #146** (23da862); session file flipped. Waiting on the founder's verdict command.
- **B1-04 tests — reviewer PASS at 30471a9**, with gaps to close before implementation: the mixed wound-wait case,
  release/replace of a wait, and exact SP2 drill refusals. Test author strengthening. Follow-ups (not in this job):
  verifier has no clock, so an expired unre-acquired token is still accepted (09a:287); hot-resource auto-add API;
  glob-vs-symbol overlap; nightly wiring; non-`repo://` verifiers; `max_wait` placement (09a:270).
| 2026-10-01 | B0-17 | #147 → main (3174d6c) | frozen P1 done-tests + hash register; verdict by the founder; CI + QA green | B1 jobs build on it; Codex re-review owed |
| 2026-10-01 | B0-07 | #140 → main (59dbe01) | Seatbelt nesting spike write-up, still `unresolved` | founder runs the nested rerun (12 §10) |
- **B1-04 tests — re-check PASS at a5e242d** (8 red; reviewer's 3 surviving mutants now fail). **B1-04 implementation
  started** on `build/b1-04` off the frozen tests.
