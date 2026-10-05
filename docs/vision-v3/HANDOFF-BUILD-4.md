# HANDOFF — build session 4 (2026-10-04/05, orchestrator ceo-1), read this first

Supersedes HANDOFF-BUILD-3 §1–§2 (PR state, usable-first track). §4 process rules and §5 rulings there still hold, plus the rulings below.

## 1. Merged this session (all required checks green, never --admin, merge commits pinned to the reviewed head)

| PR | What | Rulings |
|---|---|---|
| #139 | Missions Board + Launch, run-missions runner (3 MED fixed: anchored verdict, receipts on tool_result, per-mission lock + dead-pid reconcile) | — |
| #145 | Runner receipts, subagent refusal → Waiting | — |
| #174 | **B1-09a** Kernel runner + real Exec (hybrid exec, group kill, pid-reuse guard) | ACL = writable, fail closed |
| #175 | J4 single-port serve (`bun run start` → :4300) + README "Run it" | — |
| #176 | J3 Decisions v0 (store `<missions>/decisions.jsonl`, GET/POST, runner `DECISION:` wait, view) | — |
| #177 | J2 Stop (group kill, shutdown on INT/TERM/HUP, reaper by pgid+lstart identity) | Stop during a decision wait expires it |
| #150 | B0-12 Sunday scorecard + budget ledger v0 | — |
| #149 | B0-20 launch family from model id, `model ≠ slot` marker | — |
| #178 | **LC-1** lease fence: canonical touched names only, byte-exact, `repo://**` covers nothing | R1–R5, `#*` literal (per SP2) |
| #179 | MC-CLEAN: shared pidAlive (alive on doubt), interrupted value, stale marker/cost clear | — |
| #180 | **HG-1** Host-header guard vs DNS rebinding: 421 before any route/static/SSE | exact loopback set, no env allowlist, no forwarding headers, no exemptions |
| #181 | **LC-2** overlapping grants across jobs conflict (queue like identical names); Acquire refuses non-canonical; journal type `lease.granted_displacing` | R6 (`#*`/bare file overlap symbols, Acquire only), R7 (Detect/cycleResources use overlap) |

Rulings R1–R7 are recorded in `build/done-tests/B1-04r.yml`, attributed orchestrator ceo-1.

## 2. How verdicts get recorded (founder ruling this session)

The classifier refuses agent verdict-recording (`[CI Bypass]`). The founder runs a one-line command per PR after an Opus reviewer returns SHIP. **Order matters:** record → `git add .qa && commit` → `verdict.mjs check` → push. `check` reads the committed record.

To make it autonomous, the founder must add an allow rule for `Bash(node scripts/verdict.mjs *)` and the session-file `qa_verdict` edit.

## 3. Open — founder decisions

- **Irreversible tier, needs sign-off:**
  - `verdict.mjs` hardening (#168 follow-ups): empty-diff refusal, `--no-replace-objects`, submodule pins;
  - a kernel tier-floor rule in `.claude/qa-tier-floor.yml`. Kernel paths currently classify `lite`, and LC-1/LC-2 recorded as `lite` though reviewed at full.
- **#144:** CI runs the Kernel Go tests.
- **Host setup:** per-venture users + container. Blocks B1-10/11/13/16.
- **B1-09a ACL test,** founder-run: `AGENTVIBE_ACL_TESTS=1 go -C kernel test -count=1 -tags donetest -run 'TestB1_09a_ExecACLWritable' -v ./internal/runner/`

## 4. Follow-ups (not blocking)

- **Lease:**
  - overlap scan cost: index rows by repo, cache glob prefixes (30 ms at 5k rows);
  - glob-waiter fairness;
  - "reclaim every expired row" (item 7, unruled);
  - non-canonical rows in pre-LC journals;
  - LC-1's R5 branch should require `!HasPrefix(t, "repo://")`.
- **B1-09a:**
  - the ACL `ls` stderr limit;
  - surviving freeze/5s-wait mutants;
  - ESRCH + crash + pid reuse wedges Reconcile (fails closed).
- **mission-control:**
  - routes/decisions.ts calls missions.get twice;
  - consume-dispatch's third isAlive;
  - serial-loop wait behind a Decision (up to 30 min);
  - killed-runner-never-restarted leaves cards `working`;
  - a forged `children.jsonl` copying a real lstart (needs `ps`; Builder has no Bash);
  - setpgid escape and leaderless orphan groups;
  - load-sensitive tests: perf corpus, ledger 120 s, a dispatch 5 s timeout.
- **Harness:** pre-tool-use.sh matches words inside PR bodies (a builder reworded "curl").
- **Cleanup by founder:**
  - `~/.agentvibe/decisions.jsonl` (old test fixtures);
  - stash `ceo-ff-debris-1791061809`;
  - `~/.agentvibe/rt-b109a-*`.
- **Cross-family (Codex) review** is owed on every PR above. The single-family risk is accepted until 2026-11-17.

## 5. Use it

```
cd mission-control && bun install && bun run trust list && bun run trust add <path>
bun run start          # http://localhost:4300 — Board, Launch, Stop, Decisions
bun run missions       # runner, second terminal; attended use only
```
