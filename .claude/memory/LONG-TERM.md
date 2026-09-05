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
<!-- Things the user has corrected you on more than once. -->
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

- **`maxTurns` binds when, and only when, a dispatch names an `agentType`.** With no agent file named the
  runtime ignores it (196 of 269 runs once exceeded a cap of 20, which is where the repo's "it does not bind"
  belief came from). Name an `agentType` and its frontmatter `maxTurns` cuts the agent off mid-tool with no
  error and `agents_error: 0`. Cost three failed gate runs before it was found. **Check the agent file's
  `maxTurns` before blaming the runtime**, and read `journal.jsonl` before trusting any multi-agent result.
- **A `SKILL.md` carrying `allowed-tools` SUBTRACTS from the agent that loads it.** Two shipped skills clamp
  to a single Bash pattern. `schema-lint.js` now refuses the attachment; the rule is vacuous today, which is
  why it was cheap to add.
- **MCP tool calls only reach a hook if the matcher names them.** `Bash|Edit|Write|NotebookEdit` matches no
  MCP tool. Any claim of the form "the hook still fires" is false for MCP unless the matcher says otherwise.
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

## 2026-09-03 — the rethink: WATCH is the frame, and how to run design rounds
- Founder: voice-transcribed ("contacts"=context); wants the WHOLE system envisioned; reads pages, taps widgets, decides via AskUserQuestion once they have the page; "idk" = decide; overrules and means it ("envision again" is not "graft"); "we are doing big, changing the future".
- Method, measured twice: a brief of only the founder's words, no floor; sealed Opus minds; **each writes a spine before reading anything**, then learns from prior systems as context; one Fable merge that decides and keeps losing images; provenance per paragraph with `blind` for spine-level agreement; parts bin last. Anchored rounds produced safety machines; never run one again.
- **The frame is WATCH** (`docs/03-system-design/envision/2026-09-02-THE-SYSTEM.md`, decided 2026-09-03). WAKE (`dream/`) is round one's record. Two atoms bet/debt; keel and weather; the escapement; postures Drive·Walk·Serve·Tend·Dark; the Second buys silence never action; desk·bay·room·dailies; the five-hour watch with a two-way relief; the World Ledger; the refusal ledger. §29 maps every existing part to a fate.
- Measured: `--allowedTools` restricts nothing; `--restricted --tools … --strict-mcp-config` is the seam; a `-p` child binds an inbox socket unless `--bare`; only managed settings survive a child's argv; the hook matches command strings; the five-hour limit stops every agent at once (have them write as they go, resume by name); tick 240 s not 300.
- Next: re-derive `STARTUP-OS.md` v3 from WATCH (§29 migration table, §25 build order), v2 preserved under `designs/`. Start from `handoffs/2026-09-03-after-round-two.md`. Pending with the founder: widget decisions, the first move, the terms question, the managed settings file.

## 2026-09-04/05 — The final plan and the founder's verdict

- **The final plan is `docs/03-system-design/final/FINAL-PLAN.md`** (with COVERAGE, CENSUS, DECISIONS, page/): Keel
  (round six, mind-1) as the base, v3's measured facts inserted, thirty decisions with losing images in §1.
- **The founder chose "Keel only" as input against the recommendation, and on 2026-09-05 overruled rows 6, 8, 10,
  15, 30**: ten to fifteen expert agents with an operator, mission control back as the working surface, a learned
  skill library plus a skill creator, Codex from day one. Authority:
  `docs/08-agents_work/handoffs/2026-09-05-THE-PLAN-NEXT-TEAM-PROMPT.md`. Overruled and meant it; do not re-litigate.
- **A second model family is still unreachable** (`gemini` unauthenticated, `codex` absent): every review is single-family.
