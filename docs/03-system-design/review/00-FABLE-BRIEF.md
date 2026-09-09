# The Fable review · brief · 2026-09-02

**Founder's instruction, verbatim in substance.** Two Fable agents go over the spec, the plans and the framing of
the whole agentic company system. Completely open. Research the open-source projects we found, get the context of
the sessions, dive into your creative minds, suggest any ideas. Think outside the box and outside the things the
founder has said; think about the whole agentic company system; think beyond what a human can see and plan.
Message each other, exchange ideas, move forward, work relentlessly, and achieve the task: the complete, perfect
system. Use as many subagents as you need, Opus or Sonnet, for context, research, new ideas, second opinions. The
CEO is not in the process except to orchestrate. At the end, report the things to fix, change, do differently,
improve, think again, add, and every other option.

## You are
`fable-1` and `fable-2`. Same brief, two minds. You can reach each other with `SendMessage` by name; do it early
(share your reading plan and first hypotheses), in the middle (trade your strongest findings and attack each
other's), and at the end (agree the joint report, and record what you could not agree on). You can spawn
subagents with the `Agent` tool — `sourcer` for sourced evidence, `Explore` for codebase sweeps, `framer` for a
structured second opinion, `general-purpose` with `model: opus` or `sonnet` for anything else. Dispatch by
reference (paths), never by pasting bodies. Depth two is permitted.

## Hard limits — the only ones
- **Read-only on the repository** except your own output files under `docs/03-system-design/review/`.
  No edits to specs, scripts, agents, hooks, settings. No commits.
- **No outbound act of any kind**: nothing published, sent, spent, posted, shared, or deployed. Do not call any
  MCP tool that acts on the world (publish, send, share, exec, deploy). Research is `WebSearch`, `WebFetch`, and
  reading. If a tool would leave the machine, it is not yours.
- Cite what you assert: a file and line, a URL with the date you read it, a measurement you ran, or say
  `SPECULATION`. A claim about this repo that a grep contradicts is a defect in your report.

## What to read — by reference, in this order
1. `docs/03-system-design/STARTUP-OS.md` — **the full system spec, v2** (2,826 lines): Part I why and the
   census · Part II the 22 territories at full scale, each with its year-one slice and growth path · Part III
   the six maps · Part IV the build path in stages · Part V provenance and the founder's decisions of 2026-09-02.
   **This is the object under review.**
2. `docs/03-system-design/vision/2026-09-02-THE-PICTURE.md` — the merged vision, and the three visions beside it
   (`-flywheel.md`, `-founder.md`, `-machine.md`), plus `2026-09-02-ceo-position.md`.
3. `docs/03-system-design/designs/` — the four whole-system designs and `00-BRIEF.md`; the year-one frame v1.
4. `docs/08-agents_work/board-meetings/2026-09-01-startup-os-r01.md` — the fifteen decisions, seventeen dissents,
   and "what the CEO got wrong".
5. `docs/02-competitive/expansion/` — the catalogue: `open-source.md` (177 repos and what to steal),
   `hands.md` (every MCP, CLI and hand, measured), `concepts.md` (128 mechanisms), `00-TERRITORY.md`.
   `docs/02-competitive/reference-systems/` — five systems studied in full.
6. Session context: `docs/08-agents_work/sessions/` (newest first), `docs/STATUS.md`, `CLAUDE.md` Project State,
   `.claude/memory/DECISIONS.md`. The repo itself — `scripts/`, `.claude/` — for whether a thing the spec
   assumes actually exists and behaves as claimed.
7. The world: the open-source projects in the catalogue (go to the repos), the Claude Code docs
   (`https://code.claude.com/docs`), the Agent SDK, anything else your questions lead to.

## What we want from you
Everything. But especially the things nobody in this building can see: what a company run by machines looks like
from outside the founder's framing; mechanisms from fields that are not software (operations research, control
theory, aviation, medicine, finance, biology, law); what the open-source projects actually do that the catalogue
missed; where the spec is elegant but wrong, where it is right but unbuildable, where it is small out of habit;
what the machine should be allowed to do that the spec never considered; what the founder should stop doing;
what "the complete, perfect system" would have that this one lacks. Attack the thesis. Attack the argv-as-seam
claim. Attack the exposure register as the centre. Attack the fork at Stage 1. Then defend what survives.

## Output
Each of you: `docs/03-system-design/review/2026-09-02-fable-<n>.md` — your own full findings, any length.
Together: **`docs/03-system-design/review/2026-09-02-FABLE-REPORT.md`** — the joint report to the CEO, ≤ 900
lines, in this shape:

```
0. VERDICT            five sentences: is this the system, and what is the single largest thing wrong with it
1. FIX                defects — things that are wrong, contradictory, unbuildable, or unsafe as written
2. CHANGE             do differently — same goal, better mechanism
3. IMPROVE            keep, but make stronger
4. RETHINK            the assumptions the founder and the CEO should reconsider, with the alternative stated
5. ADD                new ideas — mechanisms, territories, hands, stores, roles, anything — beyond what anyone said
6. OPTIONS            alternatives at forks the spec closed without stating the alternative
7. FROM THE WORLD     what the open-source projects and other fields offer that the spec does not use, concretely
8. DISAGREEMENTS      what the two of you could not agree on, both positions stated fairly
9. WHAT WE RAN        every subagent dispatched (name, model, question, one-line answer), every measurement
```
Every item: what · why (evidence, with source) · where in the spec (§ or line) · cost to do · confidence
(high / medium / low) · endorsed by (fable-1 · fable-2 · both). Rank within each section by consequence.

Work until the report is the best thing either of you can produce. Then message `main` that it is written.
