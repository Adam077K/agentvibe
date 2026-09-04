# Final plan · the decisions of this session, as they were made · 2026-09-04

*Kept here because `.claude/memory/DECISIONS.md` sits at 39,543 of 40,000 bytes with nothing evictable at net gain
(`node scripts/evict-memory.mjs plan` → every candidate already archived). Fold into the main log when the merge
lands. Each entry: the question, the answer in the founder's words where they gave them, what it changes.*

## 1 · Which round-6 files count as input — "Keel only, as the handoff names"
**Asked** with the recommendation to include THE-PLAN.md, round six's own merge, and its decisions file. **The founder
chose Keel only.** So the final plan merges exactly two documents — Keel (mind-1) and StartupOS v3 — plus the measured
facts. `THE-PLAN.md`, `mind-2/DESIGN.md`, `fable/DESIGN.md`, `research/what-to-buy.md` and round six's `DECISIONS.md`
were **not read** by this session. Consequence: any founder answer recorded only in those files is not in the final
plan; the eight answers Keel carries inline (three subscriptions, no metered key, two driven, no roster, all fifteen
tools through the door, staged-not-sent, transcripts mined locally, three interruptions a day) are.

## 2 · Go — "Go (Recommended)"
Synthesis in this session, writing as it went, one commit per section; a read-only census lane; an Anthropic reviewer
lane. The second model family was not reachable: `gemini` is installed and never authenticated, `codex` is absent.

## 3 · The branch base stays where it is
This branch (ceo-3) is local main at `b2cabad`. The census measured that ceo-1 is a **strict descendant** of it, 75
commits ahead, missing nothing it has; a merge of origin/main into this branch conflicts in five files including
`scripts/verdict.mjs`, which is not a docs-session move. The plan names the tree each measurement was taken on and
lists where this branch is behind. Landing order is open decision §19.14 of the plan.

## 4 · The coverage map is a companion file, not an appendix
743 rows do not belong inside a document the founder reads on a phone. `final/COVERAGE.md` holds them, written by a
lane against §1's decisions; `?` marks the seven placements the lane could not settle, and the reviewer read those
first.

## 5 · The thirty decisions
Every place v3 and Keel differed is one row of `FINAL-PLAN.md` §1, with provenance, one line of why, and the losing
image by name. That table is the whole merge; nothing else in this session decided anything the founder had not.
