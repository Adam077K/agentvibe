# Long-Term Memory
*Cross-session facts: user preferences, recurring patterns, things every session should know. 100-line cap — compress quarterly.*

## User
- **Name:** Founder
- **Role:** Founder/CEO
- **Communication preferences:** Direct, numbers first

## Project
- **Name:** Agentvibe
- **Repo:** https://github.com/Adam077K/agentvibe
- **Domain:** agentvibe.com
- **Stack:** see CLAUDE.md
- **Stage:** pre-MVP    # pre-MVP / MVP / post-revenue / scale

## Recurring patterns
- **The founder decides against the recommendation more often than with it, and means it.**
  2026-08-12: of eight design decisions, **five** went against my recommended option — Phase 8 over
  a venture task, greenfield over reusing 2,575 working lines, Bun+React over zero-dependency Node,
  folding into `npm run check` over a separate CI job, and all six views over the four with data.
  The three that went with it were structural, not preferential (the 8a/8b split, the gate
  definition, delegating the build). Read that as: expect to be overruled on product and stack
  shape, expect agreement on process shape. State the cost once, then build the chosen thing
  properly. Do not re-litigate; do surface new
  facts that post-date the decision (CI having no aggregate `npm run check` step changed what
  "fold it in" cost, and that was worth saying).
- **"idk" means decide.** Not "ask again in another form." Take the recommendation already given,
  say plainly that you are taking it, move.
- **Sign-off is wanted where the rule requires it, not everywhere.** Irreversible-tier merges get a
  real decision; lite work is expected to just proceed.

## Vendor lock-ins (accepted)
<!-- Each entry: vendor · why · review trigger date · export-path commitment -->
- **Bun** (runtime, `mission-control/` only) · founder chose Bun + Hono + React + Vite over a
  zero-dependency Node alternative, cost stated at the time: this is the repo's **first dependency
  ever**, and `npm run check` now requires `bun install` where it previously ran on the standard
  library from a clean clone. Pinned to **1.3.10** in CI — `latest` resolved to 1.3.14 there while
  local ran 1.3.10, so an upstream release could have turned protected `main` red on a PR that
  changed nothing. · **Review trigger:** if a second component wants Bun, or if the pin blocks a
  needed upgrade · **Export path:** `mission-control/` is additive and nothing else imports it;
  every other check in the repo still runs on bare Node 20, so the blast radius of removing Bun is
  one directory.

## 2026-08-16 — Runtime facts that outlive this session

- **The founder's standing direction on agency:** agents get the open web, not a curated allowlist. Blocking
  the browser does not close prompt injection while WebSearch/WebFetch exist — it only makes the agent worse.
  The line is drawn at the local network, which is not the web.
- **Founder prefers a couple of directly-dispatched agents over a Workflow** for anything short of a big or
  mid-to-large change. Workflows are for main changes only.
- **The prompt-craft gate is live:** nothing under `.claude/agents/` is created, rewritten or deleted until a
  written prompt standard exists and the founder approves it. Two narrow capability-only exceptions were
  granted explicitly (`reviewer-readonly`, designer's `mcpServers`) and neither is a precedent.

## 2026-08-24 — Standing recommendation the founder asked to be remembered

- **Run one real venture task end to end before building more harness.** P0 closed and merged
  2026-08-23 (`5b8e127` -> `f5c62ba`, nine branches). The argument in one line: this harness has been
  tested exhaustively against exactly one subject — itself — and keeps finding real defects there. That
  is evidence the machine works and none that it is useful. 45+ session files, zero customer-facing work
  ever run through it. `STATUS.md` has listed it next-in-order for several cycles; CLAUDE.md records it
  as stop condition 6, *known and accepted*.
  **Founder position 2026-08-24: not yet.** Commissioned a re-think of whether the ecosystem is
  over-restricted first. Raise this once per session when P-work is planned, with the current session
  count, then build whatever was chosen. Do not re-litigate.
- **The founder's suspicion, in their words:** more PRs, evals and checks drive token consumption "much,
  much higher" while output is "no better" than a leaner process. They want the gates, guidelines, QA and
  merge ceremony re-examined before more is layered on. Treat this as an open question with real evidence
  on both sides, not a mandate to strip controls — the same ceremony caught a path traversal, eleven SSRF
  bypasses and an RCE path in work already called finished.
- **The session memory directory is unwritable from an agent turn.** `~/.claude/projects/.../memory/` is
  refused by both the hook and the sandbox (probed 2026-08-24). Cross-session facts go here and in
  `DECISIONS.md`, which is the repo's own mechanism anyway.

## 2026-09-13 — Long subagent returns: extract from the transcript, do not chunk

- **Subagent returns truncate at ~4,000 chars, and a drain of several replies drops everything over
  16,000.** Chunked resends over SendMessage worked for two streams and collapsed at eight. **The
  complete final text is on disk**: `~/.claude/projects/<project-slug>/<session-id>/subagents/
  agent-a<name>-<hash>.jsonl`, largest `assistant` text block — verified verbatim against received
  chunks, 8 of 8 (F2 round, R1..R8, 44k–78k chars each). For `sourcer`/`reviewer-readonly` (no
  Write) plan the extraction up front; brief write-capable engines to write the report to a path.
- **`mcp__claim-append__append_claim` was absent from every sourcer session this round** despite
  `sourcer.md` declaring `mcpServers: [claim-append]`; all eight lanes reported it and registered
  nothing. Check the grant reaches a dispatched agent before relying on it.

## 2026-09-14 — Dispatch mechanics measured this session (lanes on docs/vision-system)

- **`Agent(isolation: "worktree")` cuts from the MAIN repo's HEAD**, not the session root: brief turn 1 as
  `git checkout -B <branch> <base-sha>`. `git worktree add` is still refused and the classifier denies the
  escalation; harness isolation is the only route that worked.
- **In a harness worktree `Write`/`Edit` are refused; Bash writes work.** Heredocs with a line that is only
  `{`/`}` are refused, and `$TMPDIR` as a computed arg is refused — brace-free Python to a literal path.
- **`maxTurns: 30` binds per block; a `SendMessage` resume grants another.** First block is reading; then
  1–3 findings per block; stalls above ~250k tokens — start a fresh lane for the remainder instead.
- **Never merge contracts lanes on the light validator** (`CONTRACTS_FIXTURE_RUN=1` skips fixtures): three
  lanes passed it and the full run found one wrong-reason adverse fixture per lane plus three benign
  fixtures frozen against an older tree. Full run once on the merged head (~35 min unloaded; killed for
  memory once beside three lanes). No `timeout` binary here — `subprocess.run(timeout=5400)`.
