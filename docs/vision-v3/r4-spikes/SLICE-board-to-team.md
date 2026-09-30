# SLICE — board card → two-family team → live page

Round 4 thin working slice, 2026-09-30, branch `vision/v3-slice`. This is a proof that the design can be built. It is not the build.

## 1. Hypothesis and pass/fail criteria (written before the run)

**Hypothesis.** v3's smallest end-to-end loop fits inside Mission Control's existing invariants: a server that never spawns and whose only writes are appends from `index-cache.ts`, plus a runner the founder starts. The loop is: a mission card on a board, a launch, a Claude Code Builder, a Codex Referee from a different model family, and a live team view. The Referee's verdict comes back to the card as data.

| # | Criterion | PASS if |
|---|---|---|
| C1 | Card → queue | A card created **in the page** and dragged Waiting → Working produces exactly one `queued` line. The server spawns nothing. |
| C2 | Real two-family team | One real `claude -p` run and one real `codex exec` run, launched by the runner and not by the server, each exiting 0. |
| C3 | Live visibility | While the Builder is still running, the page shows each agent's title, model, status and latest events. |
| C4 | Verdict on the card | The card reaches Done with the Referee's verdict and reasons, and the verdict comes from a parsed line, not a guess. |
| C5 | Receipts | The events JSONL carries session and thread ids, the sha256 of each file written, cost, exit codes and durations. |
| C6 | No regressions | `crosscheck.test.ts` still reports zero write or shell exceptions in `server/**`. The rest of the suite passes, apart from the known sandbox and load artefacts. The new route tests pass. |

FAIL means any of C1–C4 is missing. PARTIAL means C5 or C6 is incomplete.

## 2. Setup — what was built

| File | Role |
|---|---|
| `mission-control/server/missions.ts` | The read side: file paths, UUID-gated `eventsPath`, `foldBoard()` and `foldTeam()`. This is **one fold, used by two readers**: the routes use it to draw the board and the runner uses it to pick work. |
| `mission-control/server/index-cache.ts` (+`appendMissionLine`) | The only write. It sits in the one file that crosscheck already allows to write. The runner uses the same function. |
| `mission-control/server/routes/missions.ts` | `GET /api/missions`, `POST /api/missions`, `POST /api/missions/:id/launch` (Waiting only, otherwise 409), `GET /api/missions/:id/team`. |
| `mission-control/server/app.ts` | Mounts the routes under the existing cross-site guard. |
| `mission-control/client/src/views/MissionsView.tsx` (+ App/api registration) | Waiting / Working / Done columns, a create form, HTML5 drag into Working (with a Launch button as fallback), and a team panel. The board is polled every 1.5s and the team every 1s. |
| `mission-control/scripts/run-missions.ts` (`bun run missions`) | Runner. It claims a `queued` mission (appends `working` plus its pid), runs the Builder, then the Referee, streams each worker's stdout line by line into `<id>/events.jsonl`, and appends `done` (with the verdict) or `failed`. |
| `mission-control/test/missions.test.ts` | 6 route tests (listed under C6). |
| `spikes/slice/launches.csv` | Launch log: worker, model, seconds, cost, exit code. |

State lives in `~/.agentvibe/missions/board.jsonl` and `~/.agentvibe/missions/<id>/events.jsonl`. `MC_MISSIONS_DIR` overrides the location; this run used `~/.agentvibe/missions-slice`.

**Team shape: Builder + Referee, chosen instead of two equal builders on split subtasks.** v3 does not doubt that two models can write in parallel. What it doubts is whether a separated verification authority works: a party from a different model family judges the work, and its verdict lands on the board as data. Split builders would only have exercised parallelism and would have left the Referee untested.

- **Builder:** `claude -p <prompt> --model claude-sonnet-5 --output-format stream-json --verbose --permission-mode acceptEdits --allowedTools Read,Write,Edit,Glob,Grep --disallowedTools Bash --max-budget-usd 2`, run in the worktree.
- **Referee:** `codex exec --json --skip-git-repo-check -s read-only -m gpt-6-astra -C <worktree> -o <file> <prompt>`. The prompt ends with the required line `VERDICT: {"verdict":"PASS"|"FAIL","reasons":[…]}`.

**Mission (created in the UI):** "Write docs/demo/hello-mission.md: a summary (under 200 words, then 3 bullets) of the 'Trusted projects' section of mission-control/README.md. Every claim must be supported by that section. Have it reviewed."

## 3. What happened

**Launches (from `spikes/slice/launches.csv`). The budget used was 2 of 40 launches and $1.08 of $25.**

| Worker | Model | Seconds | Cost | Exit |
|---|---|---|---|---|
| claude (Builder) | claude-sonnet-5 | 152.9 | $1.0819 | 0 |
| codex (Referee) | gpt-6-astra | 23.7 | not reported (89,326 tokens in / 400 out) | 0 |

**Board transitions** (`slice-proof/board.jsonl`, 4 lines): `waiting` (from the UI form) → `queued` (UI drag; +13.4s) → `working` (runner claim; +0.8s) → `done` with `verdict: FAIL` (+176.6s).

**Live view.** The mid-run screenshot `slice-proof/01-working.png` and a page fetch taken 20s after launch showed status `working`, the Builder as `claude-sonnet-5 · working` with 5 events, and its latest event `tool: Read …/mission-control/README.md`. The Referee card appeared when the Referee started. The final state is `slice-proof/02-done-referee-fail.png`.

**Receipts** (from `slice-proof/events.jsonl`, 29 events):
```
file docs/demo/hello-mission.md  sha256 bfa5f05c05ed9b0b…12bcfd012   (matches `shasum -a 256` of the committed file)
builder exit 0, 152.9s, $1.0819   session d4335d54-a08f-4c44-8020-b1d8374d80ee
referee exit 0, 23.7s             thread  01a0f1f1-663d-7920-9109-c5297a43e727
```

**The Referee FAILed the work, and it was right.** From `slice-proof/referee-last-message.txt`:

> The file exists and contains a 173-word summary followed by exactly three bullets. However, "only by that CLI" is unsupported: the source explicitly says the trust list is hand-editable. […] VERDICT: {"verdict":"FAIL", …}

The README says the list is "hand-editable" and that the server does not write it. The Builder's "never written by the server itself — only by that CLI" is a real overstatement.

**The Builder reviewed its own work inside its own session, and that review passed the same error.** `Agent` was not in `--allowedTools`, yet the Builder spawned a subagent anyway: event `tool: Agent` at +46s. The subagent was a same-family "read-only reviewer (evidence lens)" loaded from this repo's `.claude/`. The Builder's final message reports that review as "verdict PASS; one p2 finding … was fixed". So on the same file, the same-family reviewer said PASS and the cross-family Referee said FAIL with a correct reason. This is one data point, an anecdote and not a rate. It is also exactly the failure that separating the Referee is meant to catch.

**C6 (tests).**
- `bun test test/missions.test.ts`: **6 pass, 0 fail.** The tests cover: create → launch → fold; a double launch returns 409 and appends nothing; validation, including a path-traversal id returning 400 before `path.join`; the team fold ignoring a torn line; `done` carrying the verdict; mounting under the cross-site guard (a cross-site POST gets 403 and writes nothing).
- The full suite **sandboxed** gave **491 pass, 3 fail**. All three failures are known or unrelated:
  - `stream.test.ts` hits the sandbox-denied loopback bind (documented in CLAUDE.md).
  - `live.test.ts` perf fails on `filesScanned 1511 ≥ 1518`, because the live transcript corpus changed during the run while real agents were writing.
  - The crosscheck ledger test hit its 120s timeout under load.
- Every `crosscheck.test.ts` write and shell scan passed.
- The unsandboxed result is under §6.

**Friction found while building:**
1. The sandbox refuses loopback `bind()` **and** `connect()`. So the server, the Vite client and any HTTP probe (`curl` is also permission-denied) had to run outside the sandbox. The page was driven and all API responses were captured through the Playwright MCP browser.
2. Unsandboxed commands get a different `$TMPDIR`, so their logs went somewhere else. Use absolute paths.

## 4. Verdict — **PASS on C1–C5. C6 PASS for the new tests and crosscheck; the full-suite result is in §6.**

The loop works end to end with real workers, and the design survived contact with the existing invariants. The server gained **no spawn and no write outside `index-cache.ts`**, and the Referee's verdict reached the card as data. The strongest result was not planned: the cross-family Referee caught an unsupported claim that the Builder's own same-family review had passed.

## 5. What this changes in the design

1. **Workers inherit repo context, and the Builder boundary did not hold.** Launched inside the repo, the Builder loaded `CLAUDE.md`, the agents and the review lenses. It then used `Agent`, a tool that `--allowedTools` does not gate in `-p` mode, to run its own review. Two changes follow:
   - Mission launches must deny `Agent`/`Task` explicitly, or run with a minimal `--setting-sources`.
   - A lease must list the tools that are *forbidden*, not only the tools that are allowed.
   
   Tool whitelists alone do not bound a Claude Code worker.
2. **Nested agents must be team members, not hidden inside the Builder.** The subagent's tool calls reached the events file as Builder events. That hid a reviewer from the page, which is a mild form of the invisibility this whole system exists to prevent. The fix is in the runner, which should key events on stream-json `parent_tool_use_id` and draw a "Builder › subagent" card. Receipts then need a parent link as well.
3. **The Referee must be structurally cross-family, and self-review must not count toward the verdict.** A same-family PASS contradicted by a correct cross-family FAIL, even once, is the argument for the rule: "reviewed" in a Builder's own summary must never be read as a verdict. Only the Referee's parsed line moves a card.
4. **"Done" and "passed" are separate facts.** The card sits in Done with a red "Referee FAIL", and the board must never merge the two. The next mechanism is the loop back: a FAIL should offer "re-queue with the Referee's reasons". That is a new `waiting` line whose goal includes the reasons, which keeps the board append-only.
5. **Cost is lopsided and inheritance drives it.** A 173-word summary cost $1.08 and 153s on the Builder, mostly from loading repo context and the self-review, against 24s for the Referee. Missions need a context profile: which settings, CLAUDE.md and agents a worker loads. It should be chosen per mission and not inherited from wherever the runner happens to stand.
6. **The live channel: polling a folded file was enough at human speed.** The page lagged about 1s. SSE on the existing `/events` stream is not needed for this; if push is ever wanted, it should be a per-mission tail with its own contract.
7. **The verification environment is part of the design.** The armed sandbox cannot host a loopback web app, not even as a client. Any "watch it live" claim from an agent needs an out-of-sandbox browser (Playwright MCP here), which should be stated as a requirement.

## 6. What we still don't know

- **Base rates.** This is n=1. How often does the cross-family Referee disagree with the Builder's self-review, and how often is the Referee the one that is wrong? That needs the evidence-ladder run: tens of missions with a labelled truth.
- **Codex cost.** It reported tokens only (89k in / 400 out). Budgeting in dollars across both families needs a price table on the runner side.
- **Concurrency.** There was one runner and one mission. Two runners racing to claim one `queued` line would both win, because the append-only claim has no lease. v3's lease mechanism, not yet built, is what closes this.
- **The Referee's own reads.** It ran `zsh -lc sed/rg` under `-s read-only`. Read-only held here, but no attempted write was observed that would test it.
- **Unsandboxed full suite: 492 pass, 2 fail (494 tests, 216.6s).** `stream.test.ts` passes once the sandbox is lifted. The two failures that remain touch no code in this slice:
  - `live.test.ts` perf: `filesScanned 1512 ≥ 1519`. It asserts over the machine's *live* transcript corpus, and that corpus shrank or rotated during the run while other sessions were active.
  - The crosscheck ledger-equality test hit its 120s timeout. It spawns `node scripts/ledger.mjs verify`, which is load-sensitive, as CLAUDE.md warns.
  
  Neither is proven pre-existing on this exact commit, because no control run on the base commit was done. The first one fails on a corpus count taken from outside the tree.

Proof artefacts: `docs/vision-v3/r4-spikes/slice-proof/` (`01-working.png`, `02-done-referee-fail.png`, `events.jsonl`, `board.jsonl`, `referee-last-message.txt`), `docs/demo/hello-mission.md` (the Builder's output, left as the Referee failed it), and `spikes/slice/launches.csv`.

## How to run it

```bash
cd mission-control && bun install
bun run server            # 4300 (outside the Bash sandbox: loopback bind is denied inside)
bun run dev               # 4301 → open http://127.0.0.1:4301, tab "Missions"
bun run missions          # the runner (founder-run; launches claude + codex; needs their auth under ~)
#   --once  --workdir <dir>  --launch-log <csv>   env: MC_MISSIONS_DIR, MC_CLAUDE_MODEL, MC_CODEX_MODEL, MC_CLAUDE_BUDGET_USD
```
Create a card, drag it to Working (or press Launch), and watch the team panel.
