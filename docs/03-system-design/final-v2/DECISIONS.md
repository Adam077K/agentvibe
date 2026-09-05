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
