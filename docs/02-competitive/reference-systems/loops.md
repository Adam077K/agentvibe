# Reference systems: autonomous continuation

Two systems that solve "keep an agent working when nobody is watching." Both read in full, from
source, not README. Paths below are relative to the scratchpad clones:
`auto-company/` = github.com/nicepkg/auto-company (single squashed commit, `1252920`).
`ralph/` = github.com/vercel-labs/ralph-loop-agent (single squashed commit, `7b5acba`).
Neither repo carries real history — both are one-commit snapshots, no `CHANGELOG.md` in either.
Where that matters it's called out in §8 rather than faked.

---

## 1 · WHAT

**auto-company** is a bash `while true` loop (`auto-loop.sh`) that calls `claude -p` once per
cycle, headless, with `--dangerously-skip-permissions`. Each call is told (via `CLAUDE.md`,
auto-loaded by the Claude Code session it starts) to play CEO of a 14-persona AI company, form a
3–5-person sub-team through the Claude Code Agent Teams feature, do one unit of work, and rewrite
a single markdown file, `memories/consensus.md`, before returning. `launchd` can supervise the
shell script itself. All the "reasoning about what to do" lives in prose (`PROMPT.md`,
`CLAUDE.md`) — the shell script only handles timing, retries, and rollback of the *outer* call; it
has zero visibility into what happens inside one `claude -p` invocation.

**ralph** is a library, not a product: `RalphLoopAgent` (`packages/ralph-loop-agent/src/`) wraps
the Vercel AI SDK's `generateText`/`streamText` in an outer `while(true)` that keeps calling the
model until a `verifyCompletion` callback says the task is done or a `stopWhen` condition fires.
There is no persona system, no shell wrapper, no daemon — it's an in-process TypeScript loop
callers embed. `examples/cli/` is a full worked instance: a foreground Vercel-Sandbox-backed coding
agent with a judge model, Playwright/Postgres provisioned inside the sandbox, and a
`gh pr create` at the end. v0.0.3, marked experimental in both `README.md`s.

---

## 2 · THE LOOP, MECHANICALLY

### auto-company — one cycle of `auto-loop.sh`

1. Top of `while true` (`auto-loop.sh:263`): check `.auto-loop-stop` sentinel file
   (`check_stop_requested`, `:82-88`); if present, graceful `cleanup()` and exit.
2. `loop_count++`; log `START`; `save_state "running"` (`:270-274`).
3. `rotate_logs()` (`:107-124`): deletes oldest `cycle-*.log` beyond `MAX_LOGS=200`; rotates
   `auto-loop.log` if it exceeds 10 MiB.
4. `backup_consensus()` (`:126-130`): `cp memories/consensus.md memories/consensus.md.bak`.
5. Build the prompt (`:282-295`): `PROMPT.md` verbatim, then a `---` separator, then the **full
   text** of `memories/consensus.md` (or the literal string `"No consensus file found. This is the
   very first cycle."` on cycle 1), then a footer `"This is Cycle #$loop_count. Act decisively."`
   This concatenation is the entire hand-off — nothing else is injected by the shell.
6. `run_claude_cycle()` (`:155-199`): spawns
   `claude -p "$prompt" --model opus --dangerously-skip-permissions --output-format json` in a
   background subshell; a second subshell watchdog sleeps `CYCLE_TIMEOUT_SECONDS` (default 1800s),
   and if the claude process is still alive, sends `SIGTERM`, waits 5s, then `SIGKILL` (`:171-179`).
   `wait`s on the claude PID and captures its exit code.
7. `extract_cycle_metadata()` (`:201-218`) parses the JSON output for `.result`, `.total_cost_usd`,
   `.subtype`, `.type` via `jq`, with a `sed`-regex fallback if `jq` is absent.
8. Classify the cycle (`:306-315`): failed if timed out, non-zero exit, `subtype != "success"`, or
   `validate_consensus()` fails.
9. **Success** (`:317-322`): log `OK` with cost/subtype; `error_count=0`.
   **Failure** (`:323-346`): `error_count++`; `restore_consensus()` (`:132-137`, overwrite
   `consensus.md` from the pre-cycle backup — the one piece of real rollback in the system);
   if the raw output matches `usage limit|rate limit|too many requests|resource_exhausted|overloaded`
   (case-insensitive, `check_usage_limit`, `:74-80`), sleep `LIMIT_WAIT_SECONDS` (3600s) and
   `continue` with `error_count` reset; else if `error_count >= MAX_CONSECUTIVE_ERRORS` (5), sleep
   `COOLDOWN_SECONDS` (300s) — the "circuit breaker" — and reset `error_count`.
10. `save_state "idle"`; `sleep $LOOP_INTERVAL` (30s default); loop.

**Supervisor.** Two independent layers. Inside one cycle, the bash watchdog in step 6 is the only
thing that can kill a hung `claude` process. Around the whole script, `launchd` optionally
supervises the *bash process itself* (`install-daemon.sh:72-119` generates
`~/Library/LaunchAgents/com.autocompany.loop.plist` with `RunAtLoad`, `KeepAlive.PathState` keyed
on the *absence* of `.auto-loop-paused`, and `ThrottleInterval=30`). Run via `make start`
(foreground, no `--daemon`) there is no supervisor at all — a killed shell just stays dead.
`launchd` restarts the *shell script* if it exits or crashes; it does nothing if the shell script
is alive but its `claude -p` child is hung (that's the inner watchdog's job) or looping
unproductively (nothing catches that at all — see anti-repetition below).

**Fresh-context boundary.** Every cycle is a brand-new `claude -p` call — no `--resume`, no
`--continue`. The *only* carried-over state is the literal text of `consensus.md` pasted into the
next prompt. `CLAUDE.md` (mission, safety redlines, roster, skill index) is not injected by the
shell — it is auto-loaded by the fresh Claude Code session itself, from disk, every cycle, because
that's a special filename Claude Code reads at session start. There is no token budget or
compression on the consensus file — whatever fits in the prompt is what's fed; nothing truncates
it.

**What's written at cycle end, exact format.** `PROMPT.md:26-57` gives the literal template the
cycle must reproduce:

```markdown
# Auto Company Consensus

## Last Updated
[timestamp]

## Current Phase
[Day 0 / Exploring / Building / Launching / Growing]

## What We Did This Cycle
- [做了什么]

## Key Decisions Made
- [决策 + 理由]

## Active Projects
- [项目]: [状态] — [下一步]

## Next Action
[下一轮最重要的一件事]

## Company State
- Product: [描述 or TBD]
- Tech Stack: [or TBD]
- Revenue: $X
- Users: X

## Open Questions
- [待思考的问题]
```

`validate_consensus()` (`auto-loop.sh:139-153`) only checks three of the nine required pieces
actually exist: the file is non-empty, and it contains the literal lines `# Auto Company
Consensus`, `## Next Action`, and `## Company State`. The other six sections (Last Updated,
Current Phase, What We Did, Key Decisions, Active Projects, Open Questions) are unenforced
convention — a cycle that omits them still passes validation and becomes next cycle's baton.

**What stops it.** No global run budget of any kind — no max cycles, no max spend, no wall-clock
cap. Per-cycle timeout `CYCLE_TIMEOUT_SECONDS=1800`; consecutive-failure circuit breaker
`MAX_CONSECUTIVE_ERRORS=5` → `COOLDOWN_SECONDS=300`; usage-limit detection via string match on the
raw CLI output → `LIMIT_WAIT_SECONDS=3600`. Completion detection: none — there is no concept of
"the company is done," the loop runs until a human sends `SIGTERM`/`.auto-loop-stop`
(`stop-loop.sh:18-36`, dual mechanism: signal file for graceful stop-after-current-cycle, plus a
direct `kill -TERM`) or `make pause` unloads the daemon.

**Anti-repetition: prose only, zero code.** `PROMPT.md:59-65`, rule 5: *"同一个 Next Action 连续出
现 2 轮 → 卡住了，换方向或缩范围直接 ship"* ("If the same Next Action appears for 2 consecutive
cycles → stuck, change direction or scope down and ship"). Nothing in `auto-loop.sh` reads,
diffs, or persists the previous cycle's `## Next Action` field outside of the giant text blob
handed back to the *next* fresh LLM instance. The rule is entirely dependent on that instance
choosing, unprompted by any check, to notice its own predecessor's text said the same thing. No
test, no grep, no state file enforces it.

**Work selection / persona selection.** `PROMPT.md`'s step 3 says: read
`.claude/skills/team/SKILL.md`, and "each round pick the 3-5 most relevant agents, don't pull in
everyone." That skill file (`team/SKILL.md:37-61`) is pure instruction to the LLM — "select 2-5
based on task nature," "avoid redundant roles" — no code picks agents. Six fixed collaboration
chains are given as defaults in `CLAUDE.md:88-97` (e.g. new-product-eval:
`research-thompson → ceo-bezos → critic-munger → product-norman → cto-vogels → cfo-campbell`), but
which chain applies, and who actually gets spawned, is the fresh LLM's judgment call every time.

### ralph — one call to `RalphLoopAgent.loop()`

1. `contextManager?.clear()` unless `preserveContext` (`ralph-loop-agent.ts:238-240`) — wipes
   tracked files, change log, iteration summaries.
2. Build `initialUserMessage` from `prompt`; build `systemMessages` from `instructions`
   (`:243-249`, `:666-682`).
3. `while (true)`: if `abortSignal.aborted`, `completionReason='aborted'`, break (`:254-257`).
4. `iteration++`; `onIterationStart({iteration})` (`:259-263`).
5. Assemble `messagesToSend`. With `contextManager` configured, call
   `contextManager.prepareMessagesForIteration(currentMessages, iteration, model, lastResult)`
   (`:271-276`) — see compression below — then splice in `buildContextInjection()`, the rendered
   change-log/summaries block (`:296-310`). Without a context manager, messages are concatenated
   raw and unbounded forever (`:312-318`).
6. If `iteration > 1`, push one hardcoded user message, verbatim every time:
   `"Continue working on the task. The previous attempt was not complete."` (`:320-331`,
   identically at `:545-555` in `stream()`). This is a fixed string, not derived from what actually
   went wrong.
7. Token estimate; `console.warn` if `estimatedTokens > budget.total * 0.9` (`:334-347`) — logging
   only, does not throttle or truncate.
8. For Anthropic models, wrap `prepareStep` to tag the *last* message with
   `providerOptions.anthropic.cacheControl: {type:'ephemeral'}` (`:349-384`) — prompt-cache
   optimization, not a correctness mechanism.
9. `generateText(...)` — the **inner** tool loop, bounded by
   `toolStopWhen ?? stepCountIs(20)` (`:392`, default from `ralph-loop-agent-settings.ts:107`).
10. Push result to `allResults`; `totalUsage += aggregateStepUsage(result)` (sums per-step usage,
    then takes `Math.max` against `result.usage` for the top-level counts —
    `ralph-stop-condition.ts:204-244`); append `result.response.messages` to `currentMessages`
    (`:410-417`).
11. `onIterationEnd({iteration, duration, result})` (`:419-426`).
12. Check **outer** stop conditions — `isRalphStopConditionMet` — *after* the iteration ran
    (`:428-439`). Any condition true (`Promise.all` + `.some()`,
    `ralph-stop-condition.ts:378-389`) → `completionReason='max-iterations'`, break. (Misleading
    name: this fires identically for a token or cost cap, not only an iteration cap — the result
    object gives no way to tell which condition actually tripped.)
13. If `verifyCompletion` is set, call it with `{result, iteration, allResults, originalPrompt}`
    (`:442-448`). `complete: true` → `completionReason='verified'`, capture `reason`, break
    (`:450-454`). `complete: false` with a `reason` → push `"Feedback: ${reason}"` as a user
    message (`:456-466`) and log a `changeLogEntry` (`:469-473`) — this is the *real*,
    situation-specific feedback; the generic "Continue working…" nudge from step 6 is separate and
    always present on top of it.
14. Loop to step 3. On any exit, return `{text, iterations, completionReason, reason, result,
    allResults, totalUsage}` (`:478-488`).

**Supervisor: none.** `RalphLoopAgent` is an in-process async function call. If the host process
crashes, the loop simply stops — there is no daemon, no restart, no persisted checkpoint anywhere
in the package. The CLI example (`examples/cli/index.ts`) adds an `AbortController` the host
program can trigger (SIGINT handler, see §4) but that is caller-built UX, not something the
library provides.

**Fresh-context boundary: none, by default — it's cumulative, not fresh.** Unlike auto-company,
each iteration is *not* a new session; `currentMessages` accumulates across the whole `loop()`
call. The only compaction is `prepareMessagesForIteration`
(`ralph-context-manager.ts:467-521`), and it only activates once `iteration >
recentIterationsToKeep` (default 2) *and* `enableSummarization` is true (default true,
`:137`) *and* the running token estimate — `estimateTokens = Math.ceil(text.length / 3.5)`
(`:86-88`) — exceeds `maxContextTokens * 0.7` (default `150_000 * 0.7 = 105,000`, `:490`). When it
fires: it spends a *separate* `generateText` call (default same model, or
`config.summarizationModel`) with a 200-output-token cap to summarize the *previous* iteration's
messages into 2-3 sentences (`:356-422`, falls back to a templated string on error), then
hard-truncates `currentMessages` to the last `recentIterationsToKeep * 10` messages — a rough
"10 messages per iteration" guess, not an actual message-to-iteration mapping (`:509-515`).
Anything older than that window, not captured by a summary, is gone. The only true fresh-context
reset is `contextManager.clear()` at the top of `loop()`, which the *caller* controls via
`preserveContext` — the CLI example passes `preserveContext: true` when resuming after a
Ctrl+C abort (`examples/cli/index.ts` main resume loop, ~`:806-833`), so an interrupted run's
tracked files/change-log survive the abort.

**Baton format:** none — there is no persisted cross-run state file at all. State lives only
inside one `loop()` call's closures (`trackedFiles: Map`, `changeLog: ChangeLogEntry[]`,
`iterationSummaries: IterationSummary[]`, all in-memory, `RalphContextManager` fields
`ralph-context-manager.ts:126-129`). Nothing is written to disk by the core package between runs.

**What stops it, exact constants.**
- Default outer `stopWhen`: `iterationCountIs(10)` (`ralph-loop-agent.ts:192`,
  `ralph-loop-agent-settings.ts:87`).
- Default inner `toolStopWhen`: `stepCountIs(20)` (`ralph-loop-agent.ts:392`, settings `:107`).
- `iterationCountIs(count)` → `iteration >= count` (`ralph-stop-condition.ts:285-287`).
- `tokenCountIs(maxTokens)` → `(totalUsage.totalTokens ?? 0) >= maxTokens` (`:297-299`).
- `costIs(maxCostDollars, ratesOrModel?)` (`:345-373`) looks up a hardcoded
  `MODEL_PRICING` table (`:50-141`) keyed by exact AI-Gateway string, e.g.
  `'anthropic/claude-opus-4.5': { inputCostPerMillionTokens: 5.0, outputCostPerMillionTokens: 25.0,
  cacheReadCostPerMillionTokens: 0.50, cacheWriteCostPerMillionTokens: 6.25 }`; **throws** if the
  model string isn't in the table and no explicit rates were passed (`:360-365`); cache-aware cost
  calc in `calculateCost()` (`:250-275`); stops when `currentCost >= maxCostDollars`.
- Multiple `stopWhen` entries are OR'd (`isRalphStopConditionMet`, `:378-389`).
- The CLI example sets only `stopWhen: iterationCountIs(20)` (`examples/cli/index.ts:671`) — no
  token or cost cap, despite the library supporting `costIs()`; cost is logged
  (`logUsageReport`) but never enforced.
- Judge model hardcoded `anthropic/claude-opus-4.5` (`examples/cli/lib/judge.ts:9`), judge's own
  inner loop capped `stepCountIs(10)` (`:27`).
- Vercel Sandbox lifetime: `SANDBOX_TIMEOUT_MS = 30 * 60 * 1000` (`examples/cli/lib/constants.ts:9`),
  passed straight through as `timeout: SANDBOX_TIMEOUT_MS` to sandbox creation
  (`examples/cli/lib/sandbox.ts:118`).

**Anti-repetition: none.** The only feedback that varies between iterations is
`verifyCompletion`'s own `reason` string (step 13 above) — entirely the *caller's* responsibility
to make specific. The library's own built-in nudge (step 6) is the fixed string
`"Continue working on the task. The previous attempt was not complete."`, identical whether this
is iteration 2 or iteration 19, whether the model just made progress or has been stuck on the same
error for ten rounds. Nothing in the package detects a repeated tool call, a repeated error, or a
stalled diff.

**Work/persona selection:** not applicable — there is exactly one agent per `RalphLoopAgent`
instance and one model per settings object. Multi-agent composition (coding agent + judge) is
built entirely by the caller in `examples/cli/index.ts` — two separate `generateText`/
`RalphLoopAgent` configurations wired together by hand, not a library feature.

---

## 3 · PERSONAS (auto-company)

14, one file each in `.claude/agents/*.md`, 67–104 lines apiece
(`wc -l .claude/agents/*.md` → 1222 total). Structure per file: YAML frontmatter (`name`,
`description` — a Chinese one-line trigger condition — `model: inherit`), then `## Role`,
`## Persona` (a named real person: Bezos, Vogels, Munger, Norman, Duarte, Cooper, DHH, Bach,
Hightower, Godin, Graham, Ross, Campbell, Thompson), `## Core Principles`, `## Decision Framework`,
`## Communication Style`, `## Output Format`. All 14 declare `model: inherit` — there is no model
diversity; every persona is the same underlying model (whatever `--model opus` set for the cycle)
role-playing a different voice via system-prompt text.

**Selection per cycle:** `.claude/skills/team/SKILL.md:37-46` — the acting orchestrator (whichever
agent the fresh cycle spins up as "team lead," normally `ceo-bezos` per `CLAUDE.md`) reads a
markdown table of all 14 and picks "2-5 most relevant," explicitly told "avoid redundant roles."
This is a judgment call made by the same LLM instance that will then play some of those roles —
there's no separate selector, no scoring, no external tool.

**Mechanism ensuring actual disagreement: none.** `critic-munger.md` is framed as the structural
check — `CLAUDE.md:15`: *"Munger is the sole brake — must be consulted before major decisions, and
can only veto, not stall."* But this "must" is prose in a persona file
(`critic-munger.md:3,10,45`: *"必须咨询"* / "must be consulted"), not a gate any code enforces.
Nothing checks that `critic-munger` was actually invoked before a decision is acted on, nothing
diffs the critic's output against the proposer's to confirm they're not just agreeing with each
other, and nothing stops the "team lead" (itself an LLM instance) from skipping the consult
entirely — `team/SKILL.md`'s own selection step says pick "2-5 *most relevant*," and Munger is not
hardcoded as always-included. `team/SKILL.md:56-59` says *"如有分歧，列出各方观点供创始人决策"*
("if there's disagreement, list each side's view for the founder to decide") — but the founder is
not in the loop during autonomous cycles (`CLAUDE.md:11-17`: no waiting for human approval), so in
practice a listed disagreement with nobody present to adjudicate it just becomes more text in
`consensus.md` for the next cycle's fresh LLM to resolve however it likes. There is no
model-family diversity (all 14 are `model: inherit`, same weights), no structured red-team pass,
no vote count, no independent verifier — the entire "adversarial" design is a single persona file
whose text says to be skeptical.

---

## 4 · HUMAN CONTROL

**auto-company.** No in-loop pause point — the running cycle is opaque from outside until it
returns. Interrupt mechanisms, all external to the cycle itself:
- `stop-loop.sh` (no args): touches `.auto-loop-stop` (checked at top of next loop iteration,
  `auto-loop.sh:82-88` — graceful, finishes the current cycle first) **and** sends `SIGTERM`
  directly to the PID in `.auto-loop.pid` (`stop-loop.sh:18-36`) — belt and suspenders, the signal
  handler (`trap cleanup SIGTERM SIGINT SIGHUP`, `auto-loop.sh:251`) runs mid-cycle regardless of
  where the shell is, but the underlying `claude -p` child is not itself killed by that trap unless
  the watchdog also fires — so "stop" can still be delayed until the in-flight `claude` call
  returns or the 30-minute per-cycle timeout expires.
- `stop-loop.sh --pause-daemon` / `--resume-daemon`: touches/removes `.auto-loop-paused`, which
  `launchd`'s `KeepAlive.PathState` watches (`install-daemon.sh:90-97`) — pausing stops
  auto-restart, it doesn't just stop the current run.
- Redirect direction: edit the `## Next Action` field of `memories/consensus.md` by hand
  (`README.md`: *"改方向: 修改 consensus.md 的 Next Action"*) — this is the only sanctioned steering
  input, and it works because the whole prompt is rebuilt from that file every cycle (§2 step 5).
- `make reset-consensus` (`Makefile:59-63`): `git checkout -- memories/consensus.md`, i.e. reverts
  to whatever was last committed — a 3-second `sleep` "confirmation" is the only guard.
- Notification: none, pull-only. `monitor.sh --status` / `--last` / `--cycles` /
  bare-tail-the-log (`monitor.sh:22-97`) are the only visibility tools; nothing pushes to a human
  (no webhook, no email, no Slack). A human finds out something went wrong by choosing to look.
- Escalation path: none beyond the hardcoded safety redlines in `CLAUDE.md:19-31` (never delete a
  GitHub repo / Cloudflare project / system files, no `force push` to main, no credential leaks) —
  these are prose instructions inside the same untrusted, autonomously-running prompt, not an
  external enforcement layer. Nothing pages a human when a redline is approached; the only backstop
  is the fresh LLM choosing to obey its own system prompt each cycle.

**ralph.** Two layers, cleanly separated. The *library* offers exactly one primitive:
`abortSignal` on `loop()`/`stream()`, checked once per outer iteration
(`ralph-loop-agent.ts:254-257`) — the caller owns triggering it. The *CLI example* builds real UX
on top: a SIGINT handler (`examples/cli/index.ts`, `handleInterrupt`) that on first Ctrl+C aborts
the in-flight `AbortController` immediately, creates a `pausePromise` the running
`verifyCompletion` will `await` before proceeding, and shows an interactive menu — Continue /
Follow-up / Save & exit / Quit (keys `1234`/`c/f/s/q`, Enter defaults to Continue). "Follow-up"
(`handleFollowUp`) prompts for free text and injects it as the next `verifyCompletion` `reason`,
i.e. becomes next-iteration feedback exactly like judge feedback does. This is synchronous,
foreground, terminal-based — there is no background/daemon mode, so "notification" isn't a
separate concept: the human is watching the process directly. Escalation at the *end* of a
successful run is a `gh pr create` (`examples/cli/lib/git.ts:185-219`) — the agent's output
becomes a PR for a human to review normally; there is no in-run approval gate before that PR is
opened.

---

## 5 · COST

**auto-company:** measured, not capped. `extract_cycle_metadata()` pulls `total_cost_usd` out of
each cycle's JSON output (`auto-loop.sh:209`) purely for the log line — nothing compares it to any
threshold, there is no daily/total spend cap, no per-cycle dollar limit. The only volume control is
time-based: `LOOP_INTERVAL` (30s) between cycles and `CYCLE_TIMEOUT_SECONDS` (1800s) per cycle,
both about wall clock, not spend. A runaway 24/7 loop on a paid model is bounded only by however
long a human lets it run.

**ralph:** the only system of the two with an actual spend-based stop condition —
`costIs(maxCostDollars, ratesOrModel?)` (`ralph-stop-condition.ts:345-373`), driven by the
hardcoded `MODEL_PRICING` table (`:50-141`) and cache-aware `calculateCost()` (`:250-275`). It is
opt-in per agent instance (`stopWhen: [iterationCountIs(50), tokenCountIs(100_000), costIs(5.00)]`
per `README.md:242`) and the shipped CLI example does **not** enable it — only
`iterationCountIs(20)` (`examples/cli/index.ts:671`); cost is logged every iteration
(`logUsageReport`, e.g. `:783`, `:790`) but never enforced. `tokenCountIs`/`inputTokenCountIs`/
`outputTokenCountIs` are the token-based siblings (`:297-323`). Usage aggregation itself is
careful — `aggregateStepUsage` sums every inner tool-loop step and takes `Math.max` against the
SDK's own top-level `result.usage` to avoid undercounting (`:204-244`) — but that accuracy only
matters to a caller who actually wires a `costIs`/`tokenCountIs` condition in.

---

## 6 · STEAL

1. **`costIs()`'s exact mechanism** (`ralph/packages/ralph-loop-agent/src/ralph-stop-condition.ts:250-373`).
   A per-model USD-per-million-token table keyed by exact model string, cache-read/cache-write
   rates included, computed against a `LanguageModelUsage` object that's been reconciled via
   `Math.max(summed-per-step, top-level-result)`. Reimplement as: maintain a small
   `{model: {in, out, cacheRead, cacheWrite}}` table; after every model call, sum usage across all
   sub-steps *and* take the max against whatever aggregate figure the SDK/CLI itself reports (they
   can disagree); multiply by the table; compare running total to a caller-supplied dollar ceiling;
   throw loudly if the model isn't in the table and no explicit rate was given — don't silently
   treat unknown-cost as zero-cost.
2. **Two-tier stop-condition composition** (`ralph-stop-condition.ts:378-389` +
   `ralph-loop-agent.ts:189-195,392`). Outer loop stop conditions are an *array*, OR'd via
   `Promise.all(...).some(...)`, checked once per full iteration; inner tool loop gets its own
   independent, tighter stop (`stepCountIs(20)`) so a single "iteration" can't itself run away
   inside `generateText`. Two independent caps at two different granularities, composable, each
   swappable.
3. **Dual-layer supervision with two different jobs** (`auto-company/auto-loop.sh:155-199` +
   `install-daemon.sh:72-119`). Inner watchdog subshell (`sleep TIMEOUT; SIGTERM; sleep 5; SIGKILL`)
   kills a hung *single call*; outer OS supervisor (`launchd` `KeepAlive`) restarts the *loop
   process* if it dies outright. Don't conflate "the current unit of work hung" with "the
   supervising process crashed" — they need different detectors and different remedies.
   `KeepAlive.PathState` keyed on a sentinel file's *absence* (`install-daemon.sh:90-97`) is a
   clean pause/resume primitive: touch the file to stop auto-restart without touching the plist.
4. **Backup-then-restore around the one piece of durable state**
   (`auto-loop.sh:126-137,279-280,327-328`). `cp consensus.md consensus.md.bak` before every cycle;
   on any failure classification, restore from that backup before retrying. Cheap, effective
   against a cycle that corrupts its own baton — cost is one extra file copy per cycle.
5. **Schema-check the baton before trusting it** (`auto-loop.sh:139-153`,
   `validate_consensus()`). A cheap `grep -q` for required section headers, run as part of
   pass/fail classification (not just on read) — a cycle that produced a malformed consensus file
   is itself treated as a *failed cycle* (triggers the restore-from-backup path), not silently
   accepted. Worth doing more completely than the original does (see §7).

---

## 7 · REJECT

1. **The anti-repetition mechanism in both systems is fiction.** auto-company's rule 5
   (`PROMPT.md:59-65`) — "same Next Action twice in a row means stuck" — is enforced by nothing;
   it depends on a brand-new LLM instance every cycle voluntarily comparing its own predecessor's
   free-text field to itself. Ralph's built-in nudge is a hardcoded, context-free string repeated
   verbatim every iteration (`ralph-loop-agent.ts:320-331,545-555`). Neither system can actually
   detect "I am trying the same failing thing again." For a system meant to work a goal tree
   unattended for hours, this is the single biggest gap in both references — don't inherit it.
   Real fingerprinting (hash of the diff/tool-call sequence, or a structured "last N attempts"
   comparison) is required, not sourced from either repo.
2. **`--dangerously-skip-permissions` as the entire safety model**
   (`auto-company/auto-loop.sh:166`, `.claude/settings.json:
   "defaultMode": "bypassPermissions"`). Every safety rule auto-company has is prose inside
   `CLAUDE.md` — "don't delete the GitHub repo," "don't force-push main" — trusted to the same
   untrusted, fully-autonomous model that's making every other decision. There is no tool-level
   enforcement, no separate reviewer, no dry-run. A model that mis-executes doesn't hit a wall; it
   hits nothing.
3. **The judge in the ralph CLI example fails open, twice.** If the judge model errors, the
   `catch` block auto-approves the task (`examples/cli/lib/judge.ts:104-121`, comment reads "auto-
   approve to avoid infinite loop"). If the judge runs its tools but never calls `approveTask` or
   `requestChanges`, that *also* auto-approves (`:94-103`). A verification gate whose failure mode
   is "ship it" is worse than no gate, because it looks like a gate. Any QA/judge mechanism this
   project builds must fail closed — an unresolved verdict is `unresolved`, never `pass`.
4. **A shell loop with no run budget driving spend-worthy actions.** auto-company logs cost per
   cycle but enforces no ceiling on it (§5) — 24/7 by design, on a paid model, with no dollar or
   cycle-count stop condition anywhere in the script. Combined with #2, a mis-set safety redline
   plus an unbounded loop is a genuinely bad pairing.
5. **Munger-as-brake is a naming exercise, not a mechanism** (§3). Calling one persona "the sole
   veto" in `CLAUDE.md` while the actual selection logic (`team/SKILL.md`) treats every persona,
   Munger included, as optional-if-not-"relevant," and while all 14 personas share one model
   family, produces the appearance of adversarial review with none of the substance. If a review
   step matters, it needs to be structurally mandatory (always dispatched, its absence a hard
   failure) and ideally from a genuinely different judge, not merely differently-prompted.
6. **auto-company's own `.gitignore` names mechanisms that don't exist in the code** —
   `.circuit_breaker_history`, `.circuit_breaker_state`, `.exit_signals`, `.ralph_session`,
   `.response_analysis`, `.call_count`, `.last_reset` (`auto-company/.gitignore`) appear nowhere in
   any `.sh` or `.md` file in the repo (`grep -rn` across the tree returns nothing). These are
   fossils from whichever credited ancestor (`README.md`'s acknowledgments: `continuous-claude`,
   `ralph-claude-code`, `claude-auto-resume`) the loop script was adapted from — a reminder that
   the actually-shipped implementation (single `error_count` int, single `MAX_CONSECUTIVE_ERRORS`
   threshold) is much thinner than the vocabulary around it suggests. Read the code, not the
   file list.

---

## 8 · ABANDONED

Both repos are **single-commit snapshots** — `git log --oneline` returns exactly one commit in
each (`auto-company`: `1252920 docs: add macOS sleep prevention guide and make targets`; `ralph`:
`7b5acba update agents.md`). Neither has a `CHANGELOG.md` anywhere in the tree. There is no real
git history to mine for what was built and removed — that question can't be answered from either
repo as cloned; both were squashed before being made available here.

The one piece of genuine "abandoned" evidence is indirect: auto-company's `.gitignore` (see §7,
finding 6) lists seven state-file names — circuit-breaker history/state, exit signals, a "ralph
session" file, response analysis, call count, last reset — that correspond to nothing in the live
`.sh` scripts. The shipped `auto-loop.sh` reimplements the same *concepts* (circuit breaker, error
threshold, cooldown) far more simply, as two shell integers (`error_count`,
`MAX_CONSECUTIVE_ERRORS`) and a `sleep`, rather than as the file-backed state machine the ignored
names imply. Whatever fuller mechanism those names came from (most plausibly one of the three
credited ancestor projects) was stripped down to this before the single commit in this repo was
made — the ignore-list is the only surviving trace of it.
