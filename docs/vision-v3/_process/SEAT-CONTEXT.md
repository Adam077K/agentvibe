# v3 seat context — read this before anything else

You hold one seat in the design of **v3 — the agentic organisation**: one founder plus an AI workforce that conceives,
builds, runs, grows and learns across startups, agencies, businesses, research and any project he can imagine. The founder
calls the practice **vibe startuping**. Binding direction: `docs/vision-v3/00-FOUNDER-DIRECTION.md` (6.6 KB — read it whole,
except in Round 0 where you read it only after your outward research).

## The ambition rules (non-negotiable)
- **Do not shrink the vision.** No MVP framing of the destination, no cutting a capability because it is hard. Hard things get
  a design, a risk and a path. Sequencing the *build* is fine; shrinking the *destination* is not.
- **Exceed what the founder described.** Every output must contain ideas he did not ask for.
- **Challenge means adding.** Disagree by proposing something bigger or better, not smaller.
- **Design for a world where research, design, engineering, sales and strategy are nearly free, parallel and tireless** — and
  the bottleneck is judgment, direction and taste.
- Concrete beats abstract: numbers, tables, mermaid diagrams, ASCII wireframes, named mechanisms, worked examples.
- Agents are named by **title and expertise, never personal names.** Claude Code and Codex are **equal workers**.
- **No playbooks as the core** of the system.

## Evidence rules
- Source external claims (URL + what it says). Mark speculation as speculation. Never invent numbers about real companies.
- Prior work is material, not answers: v1 `docs/vision-system/` (explorer data: `docs/vision-system/planning/site/explorer/data/`),
  v2 `docs/vision-v2/`, engineering specs `docs/vision-v3/engineering/` (ENGINE-SPEC 51 KB, SURFACES-SPEC 79 KB), the harness
  (`AGENTS.md`, `.claude/`, `mission-control/`, `scripts/`). You may contradict any of it — say why.

## Mechanics (these cost hours last time)
- **Write your output with the Write tool** to the exact path in your brief. Then return a **≤200-word summary** — not the doc.
- Never read a file over ~200 KB whole — grep and range-read. `CLAUDE.md` is 69 KB of history: grep it, never read it whole.
  Never open `F2-07-outside-review.md` or contract registries whole.
- Do not write backticked ids that look like `c-something` — the ledger lint treats them as claim ids.
- Do not commit, push, or touch files outside your output path unless your brief says so.
- Codex CLI (`gpt-6-astra`) is available on this machine; Claude and Codex seats run independently in their first pass.

## Layout
```
docs/vision-v3/
  _process/        this file, round logs
  r0-outward/      Round 0 — outward research briefs
  r1-concepts/     Round 1 — five whole-organisation concepts + judge scores
  r2-seats/        Round 2 — specialist designs
  r3-stretch/      Round 3 — expander + red team
  r4-spikes/       Round 4 — prototype results
  (top level)      Round 5 — the v3 package, 01-… files
```
