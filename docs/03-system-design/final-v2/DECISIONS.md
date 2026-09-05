# Final plan v2 · the decisions of this session, as they were made · 2026-09-05

*Side file, same convention as `final/DECISIONS.md`: `.claude/memory/DECISIONS.md` sits within 500 bytes of its
40,000-byte cap. Fold in when the merge lands. Each entry: the question, the founder's answer in their words, what
it changes.*

## 1 · Go — "go. no builing yet."
Four research lanes (sourcer), a framer spine, builders per section, a designer page, a census lane, two challenge
lanes, a fix round, a session file. Nothing built, installed, authenticated, spent, published or pushed. Widened the
same minute by the founder's next message: *"You can take it a couple of steps forward and add more to the research
or more to the thinking so we will get the best system that we can ever plan"* — read as licence for more lanes than
the handoff named; the founder's 35-section list was re-sent verbatim with it and is identical to
`round-5/FOUNDER-LIST.md` §01–§35.

## 2 · Round-6 input — "Keel only, again"
Asked with the recommendation to read THE-PLAN.md, mind-2, fable and what-to-buy on ceo-2. **The founder chose Keel
only, again.** Those four files stay unread by this session. Consequence: any answer they hold to the founder's
2026-09-05 direction is not in v2, and v2 says so where it would have mattered.

## 3 · Landing — "Beside PR #131"
Commit on this branch (`ceo-1-1788609834`, at `b2cabad` = local main) as the session goes; at close, compose a
branch `docs/final-v2` on top of `origin/docs/final-plan` (PR #131's head, `7fe8ede`) so `final-v2/` sits beside
`final/` on origin/main's history. Landing order of the four branches stays §19.14, the founder's. Nothing pushed.

## 4 · Second family — "Proceed single-family"
`codex` absent (measured `command -v`), `gemini` 0.38.2 present with auth state unreadable from the sandbox
(`~/.gemini` is `denyRead`). Every challenge lane runs on Anthropic with sealed contexts and different briefs; v2
states it plainly. §19.10 stays open.

## Measured at session start, 2026-09-05
- `claude` 2.1.261 (the final plan measured 2.1.259). `codex` ABSENT. `gemini` present.
- PR #131 `docs/final-plan` → `main` is open (`gh pr list`, sandbox lifted for the one read).
- Branch topology: `origin/main 4770d39` · `docs/final-plan` = origin/main + 15 (final docs, handoff, LONG-TERM
  compress) · `ceo-3-1788468144 7286420` = `b2cabad` + 12 (same final docs, no origin/main) ·
  `ceo-1-1788468144 280b5e7` ⊇ origin/main ∪ b2cabad + round-5 corpus, no `final/` · this branch = `b2cabad`.
- The handoff file is byte-identical on `docs/final-plan` (52fa1f1) and `ceo-3` (7286420).

## 5 · Seven research lanes, direct `Agent` dispatch, not a `Workflow`
The handoff named four lanes; the founder's widening ("add more to the research or more to the thinking") added
three: cognition and tickets (§21–§22), memory and knowledge (§04–§05), models and quotas. All seven ran as
`sourcer` engines in parallel by direct dispatch. Fan-out wider than three is supposed to go through a committed
workflow script, but the `Workflow` tool needs the founder's explicit words and the founder's standing preference
is direct agents for anything short of a main change (LONG-TERM.md). Cost of the choice: no enforced return
schema; the return format was carried in each brief instead and checked by reading.

## 6 · Lane returns are delivered in 3,500-character parts
The idle-notification drain that delivers a subagent's result truncates near 4,000 characters per message and
16,000 per drain, and `sourcer` has no `Write`. Every report came back in numbered parts, requested one at a time,
and was recorded verbatim under `final-v2/research/` by the orchestrator — recording, not authoring. Seven lanes,
fifty-one parts, one commit per round. A lane engine with `Write` would remove this ceremony; noted for the plan.

## 7 · The spine lane runs on Opus, not the framer's default Sonnet
`framer.md` declares `claude-sonnet-5`. The decision spine is the highest-leverage document of the session — every
builder writes from it — so the dispatch overrode the model to `opus`. Cost: roughly 2.5× the token price for
one lane. Recorded so the override is a choice and not drift.

## 8 · v36 — a tainted read is held by `scout` and the world's door, never by an agent with a pen
Builder 2 returned BLOCKED on section 8: SPINE §F says tainted READ-ONLY (Gmail, Calendar, Drive, Notion read, the
open web) is `scout` only; SPINE §B.2 row 12 granted `steward` those reads while it also holds `Write`. One grant,
two §A rules. Resolved by the orchestrator without the founder, because FINAL §9.4 already decides it and v33 says
the trifecta split survives intact: any run that reads outside content is born without the tools that act, and a
maker never reads a raw inbound row. So the world's door (a program) writes one inbound row per mail or calendar
event, `scout` reads rows and returns facts, and `steward` writes obligations from that handover. SPINE §B.2 row 12
and a new row v36 carry it; every builder was told. Cost: one more hop between a mail arriving and an obligation
existing — the same hop FINAL §9.5 already required.

## 9 · v37 — the brief gains a tenth field, `agent:`
Builder 1 returned BLOCKED on §6: fourteen named agents mean the brief must carry which agent runs it, and SPINE §A
decided neither a tenth field nor a widened `window+model:`. Decided by the orchestrator: a tenth field `agent:`,
because it leaves FINAL's nine untouched and the launcher can refuse a name that is not a roster file. Row v37.

## 10 · v38–v41 — four placements builder 4 found undecided, decided by the orchestrator
Builder 4 returned six BLOCKED rows. A was v36; B was the namespace miscount (§E.4 now reads thirteen). The other
four were absent from §A and are decided here because each follows from a measured fact or an existing setting,
not from a preference the founder holds: **v38** the read-back is the intent-creation form on pages 4 and 7 and
stays a phone page, the briefing is page 5's top strip and a phone page; **v39** the website is served on the
Mac by the existing `mission-control/` server because a terminal pop needs tmux on the same machine — the phone
keeps the published pages for reading and deciding (cost: two renderers over one state, accepted); **v40**
`maxTurns` 30 for producing agents, 25 for read-only ones, copying the measured seeds; **v41** `isolation:
worktree` for the four that touch venture source, `none` elsewhere. Each is reopenable by name in §20.

## 11 · Section 13a — self-improvement had no home in the section plan
The coverage lane, placing "Improvement backlog", found that SPINE §K's twenty-four sections carry no
self-improvement section: FINAL §12 (three loops at three speeds, horizons on everything durable, corrections
logged as defects in the brief, the refusal line, the rethink trigger) inherited nowhere. Added as §13a between
memory and mission control rather than renumbering fourteen cross-referenced sections. A hole found by a
mechanical placement pass, not by reading — the pattern this repo keeps recording.

## 12 · v42–v52 — eleven decisions the review round forced, decided by the orchestrator for the fix round
Census, challenge A and challenge B returned 4 + 32 + 23 findings. Eleven needed a decision §A did not carry; each
is decided from a rule already on the page or a measured fact, and each is reopenable by name: v42 agent files in
`.claude/agents/`, argv in `keel/shared/argv/`; v43 a grant carrier per dispatch mechanism, night work on `-p` only;
v44 the Watch is the sole writer of obligations, steward proposes; v45 eleven brief fields (`anchor:` added); v46
the Operator is the interactive session started as `claude --agent operator` (one measurement UNVERIFIED); v47
`bin/reconcile` computes, analyst interprets; v48 skills at the house root only; v49 `bin/skill` does not dispatch;
v50 ABSENT vs WISH defined; v51 the curator's five questions are the second admitted step list; v52 the founder's
door writes the card. Every other finding is applied as written, or re-attributed: challenge B's six P1s are facts
inherited from FINAL's measured seam (§7.5, §9.7, §14.6, §14.7, §13.8) mis-tagged as this session's research.

## §14 — Close: reassembly, the page, the landing branch

The fix round landed in `aac18d8` (24 parts). Reassembled to 6,337 lines · 35 flowcharts · 53 rows in §1 · zero
`round-6/` references. Two things the orchestrator did by hand rather than through a lane, both recorded so they can
be judged: §1's preamble still read "v6–v41" after the fix round and now names v42–v53 as the review round; the
page's six stale figures (line count, row count and grouping, "ten of the fourteen carry no shell", seven `?`, the
companion byte count) were substituted in place — figures only, no prose or layout touched, because a designer round
for six substitutions costs more than it checks. `docs/final-v2` is composed by plumbing onto `origin/docs/final-plan`
(7fe8ede, the head of PR #131): the whole of `final-v2/` plus the session file, 42 files. The LONG-TERM note is NOT
on that branch — PR #131's LONG-TERM.md stands at 99 of its 100-line cap and the note is three lines; it lives on
`ceo-1-1788609834` only, for the founder to place. Nothing pushed.
