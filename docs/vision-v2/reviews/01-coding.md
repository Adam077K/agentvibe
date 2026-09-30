# Review — Coding mindset (opus, web research first, read-only)

**Verdict: build with changes.** The core idea is right: a runner that decides job status itself rather than trusting the agent. But several launch-level assumptions will break on the first real headless run, and the job order spends the 3-week timebox on venture tooling M1 does not need.

## Research (accessed 2026-09-29)
1. Claude Agent SDK, agent loop — https://code.claude.com/docs/en/agent-sdk/agent-loop (result subtypes `error_max_turns`, `error_max_budget_usd`, `error_during_execution`, `error_max_structured_output_retries`; on error subtypes the result has no `result` field; `dontAsk`/`acceptEdits` for headless; `session_id` for resume).
2. Claude Code worktrees — https://code.claude.com/docs/en/worktrees (`-w/--worktree` built in).
3. anthropics/claude-code #80848 "Workflow subagent killed by maxTurns is misreported as completed" — https://github.com/anthropics/claude-code/issues/80848; UiPath/coder_eval #193 (221 turns against a cap of 75, reported success) — https://github.com/UiPath/coder_eval/issues/193.
4. claude-code #23463 / #38868: silent subagent context overflow; silent Explore failures — https://github.com/anthropics/claude-code/issues/23463
5. Addy Osmani, "The Code Agent Orchestra" — https://addyosmani.com/blog/code-agent-orchestra/ (3–5 agents is the useful range; "the bottleneck is no longer generation. It's verification.")
6. "69% of my coding agent's 'done' claims weren't" — https://dev.to/raimondasl/69-of-my-coding-agents-done-claims-werent-here-is-the-gate-i-put-in-front-of-them-lho
7. Augment, 9 open-source agent orchestrators — https://www.augmentcode.com/tools/open-source-agent-orchestrators ; awesome-agent-orchestrators — https://github.com/andyrewlee/awesome-agent-orchestrators
8. Codex CLI worktree parallelism — https://codex.danielvaughan.com/2026/03/26/codex-cli-worktree-parallel-development/

Consensus: worktree + headless CLI is standard. Common failures: silent turn caps, silent context overflow, headless permission denials, false "done". Teams verify with executable done-criteria plus an independent check. The plan matches on verification and is weakest on launch mechanics.

## Strong
- Runner decides status; agent claim logged, not trusted; uncheckable → `unresolved`. The best idea in the package.
- Read-only fan-out, one writer per repo; concurrency 2 Claude + 1 Codex, raised from data.
- Extends existing code; no LangGraph/CrewAI/personas; lane UIs cut.
- Seeded failure classes and replay fixtures; limit error = `blocked`; CLI pinned and checked nightly; no subscription credentials in CI.
- Thin end-to-end path first (J01); acceptance is a real venture.

## Wrong or will break
1. **Headless permissions not addressed.** The launch line sets no `--permission-mode` and no allow list. The repo's 39 settings rules are live ("a command that used to pass silently may prompt"). In `-p` a prompt with nobody to answer is a denial → jobs end `partial`/`unresolved` for unrelated reasons. Each engine needs an explicit permission mode and tool allow list; J01's done-test should cover it.
2. **A turn-capped job cannot return its own continuation.** `error_max_turns` carries no `result`, so no structured output. The runner must build the continuation (`session_id` + `--resume`, or a fresh job fed the diff). "`maxTurns` binds through the agent file" is verified only for dispatched subagents, not for `claude --agent … -p` main sessions; caps are known to be ignored/misreported. J01 needs a `maxTurns: 2` fixture; use `--max-budget-usd` (exists in 2.1.284) and a wall-clock timeout as backstops.
3. **No wall-clock timeout or process-group kill.** `consume-dispatch.ts:972` is synchronous `execFileSync('claude', …, {stdio:'inherit'})` — no timeout, no output capture; it cannot become a concurrent runner by extension. Write `runner/` fresh: async spawn, `--output-format stream-json --verbose` (liveness + partial transcript), timeout, process-group kill. Keep only consume-dispatch's outcome classification.
4. **Harness-edit jobs cannot run as runner jobs.** J06, J10, J12, J13, J14 write runtime-protected paths (`.claude/agents/**`, hooks, settings, commands, `.mcp.json`); a runner worktree is the worker's session root, so headless writes are refused. Run lane H and J06 as interactive founder sessions.
5. **Venture isolation claimed, not enforced.** The loader limits what is handed over, not what can be read; sandbox read policy is deny-only, so a worker can `cat ~/VibeCoding/<other-venture>`. Needs a per-job `--settings` denying reads of other venture roots; seeded class 7 should test a Bash `cat`.
6. **Worktree placement adds context.** Worktrees nested under the main checkout inherit ancestor CLAUDE.md (69,338 bytes) in every worker. Put runner worktrees outside the repo tree (e.g. `~/.agentvibe/wt/<job>`). Install dependencies per worktree (`bun install` in mission-control) or clean-checkout done-tests fail spuriously.
7. **Done-tests can be gamed; read-only jobs have nothing checkable.** Restore test paths from the base commit or refuse diffs touching done-test inputs. The runner should commit, not the agent. For sourcer/framer, "schema-valid and non-empty" is the whole check — say so and require a reviewer pass for `done`.
8. **The Codex PTY wrapper may be the wrong fix.** `codex exec` 0.154.0 has `-o/--output-last-message <FILE>`, `--output-schema`, `--ephemeral`. Writing the verdict to a file may sidestep #19945 without node-pty. Test `-o` detached first.
9. **Capacity estimation is guesswork.** ccusage counts tokens but doesn't know the 5-hour or weekly caps; "founder session active" detection unspecified; limit errors likely text-matched — add a canary; plan for the weekly cap.
10. **Job sizes unrealistic.** J01 (worktree, argv launch, schema, capture, clean-checkout test, SQLite, CLI, reading a 1,122-line consumer) is not ≤30 turns; a measured reviewer run needed 68 tool calls. Until J03 lands every "job" is a founder session — budget lane R as interactive in week 1.
11. **J29 depends on live services** (Vercel, PostHog, Stripe, Resend, test domain) → flaky acceptance. Keep the 11 classes replay-only and deterministic; make the live path a separate smoke check allowed to report `unresolved`.

## Missing
- Per-engine permission mode and allow list.
- Launch contract: timeout, process-group kill, full result-subtype mapping.
- Harness-loaded check via the `system/init` stream event (lists tools, agents, MCP servers, plugins) instead of a token-writing hook — J06 shrinks to parsing init and comparing hashes.
- SQLite WAL mode and `busy_timeout`.
- Venture work starts now — calls need nothing from the runner; start the M1 clock in week 1.

## Reorder / split / merge / cut
- Split J01 → J01a (launch + capture + result-subtype mapping, permission and turn-cap fixtures) and J01b (worktree, dependency install, runner commit, clean-checkout done-test, SQLite).
- Merge J03 into J01b and J02.
- Move lane H (J06/J10/J12/J13/J14) to interactive founder sessions; run J10 (CLAUDE.md → 8 KB) first.
- Cut from pre-M1: J22 fake door and J23 outbound (Solution-validated), J12 plugin distribution, J18 FTS (ripgrep suffices), J26 ntfy beyond stop-failure, J11 (only needed for J14).
- Keep for M1: J19, J20, J21 (whisper), thin J24 inbox, J25 Monday page as a markdown script.
- J07: try `codex exec -o` first. J27 replay: build from J01a's stream-json transcripts.

## Top 5 changes
1. **Pin the launch contract** in `runner/launch.ts`: `claude -p --agent E --model M --permission-mode <per-engine> --allowedTools <per-engine> --output-format stream-json --verbose --json-schema F --max-budget-usd B --session-id <uuid>`, plus wall-clock timeout, process-group kill, every result subtype mapped; fixtures: `maxTurns: 2` ends `partial`; a denied tool is visible in the log.
2. **Continuations are the runner's job** (record `session_id` + diff; enqueue `--resume` or a fresh job).
3. **Worktrees outside the repo tree, dependencies installed, runner commits, done-test inputs protected.**
4. **Isolation via sandbox, not loader** (per-job `--settings` `denyRead` on other venture roots; class 7 is a Bash read).
5. **Re-sequence around M1:** week 1 J10 interactive, J01a/b, J02, J07 (`-o` first), founder starts calls; week 2 J04, J05, J19–J21, J24; week 3 J17, J25, J27–J29 replay-only. Defer J12, J18, J22, J23, J26. Harness self-edits out of the queue.

**Checked:** `mission-control/runner/` does not exist; `consume-dispatch.ts` is synchronous `execFileSync` with `stdio:'inherit'`; 18 agent files with `maxTurns` 25/30; `claude` 2.1.284 has no `--max-turns` but has `--max-budget-usd`, `--permission-mode`, `--session-id`, `-w`; `codex-cli` 0.154.0 has `-o`, `--output-schema`, `--ephemeral`. **Not tested:** whether `maxTurns` binds for a main session with `--agent`; whether `codex exec -o` avoids #19945.
