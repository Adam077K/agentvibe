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
