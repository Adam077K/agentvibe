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
