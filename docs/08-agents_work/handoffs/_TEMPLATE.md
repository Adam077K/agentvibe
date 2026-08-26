# STOP — the per-session handoff is a retired practice

**Do not copy this file to start a new handoff document. Update
[docs/STATUS.md](../../STATUS.md) instead.**

## Why this template stopped inviting a new document

Fourteen handoffs accumulated here in twelve days — `ls | wc -l` says fifteen, and the fifteenth is this
file, which is not a handoff. Derive it as `ls | grep -c '^2026-'`. Several superseded each other; at least one was written
mid-session and patched three times as its own claims went stale while it was being written. Four plan
documents sat on disk at once. That churn is a large fraction of this project's total output, and every
future session paid to read the whole pile in order to find the two paragraphs still true.

A handoff is a **snapshot addressed to one reader at one moment**. Snapshots do not get corrected — they get
superseded, and a superseded snapshot is indistinguishable from a current one until you have read both. A
living document gets corrected in place, so being wrong is a bug someone can fix rather than a new file
someone must write.

**Founder decision, 2026-08-25: one living status. The handoff chain retires.** Recorded in
[.claude/memory/DECISIONS.md](../../../.claude/memory/DECISIONS.md).

## What to do instead

| You want to | Do this |
|---|---|
| Record where the project stands | Edit [docs/STATUS.md](../../STATUS.md) **in place**. Correct the stale line; do not append a new section beside it |
| Record a decision and its rationale | Append one entry to [.claude/memory/DECISIONS.md](../../../.claude/memory/DECISIONS.md), in that file's format. Watch the byte cap |
| Record what a task did | Write the session file at `docs/08-agents_work/sessions/YYYY-MM-DD-[role]-[task-slug].md`, ≤ 10 lines. This is still required — no task is COMPLETE without it |
| Register a durable fact so it fails a check when it stops being true | Add a claim — [docs/03-system-design/CLAIM-LEDGER.md](../../03-system-design/CLAIM-LEDGER.md) |
| Hand work to another agent **inside** a live task | Put it in the dispatch brief. That is what a brief is for |

## The one narrow case that is still a document

A task is being **paused across sessions** with work genuinely in flight, and the state does not fit in
STATUS.md or a dispatch brief. Then, and only then, write one — short, dated, and superseding by name. When
it lands, fold the durable part into STATUS.md and banner this one historical.

If you cannot say which of the rows above your document is *not*, you do not need a document.

## Existing files in this directory

Every **handoff** here except the newest is bannered **HISTORICAL** and is retained for the record — 13 of
the 14, verified 2026-08-26 — because this repo keeps its superseded statements rather than deleting them:
the reasoning that produced a wrong answer is worth more than the absence of the wrong answer. Read them
for method and rationale. **Never read them for current state.**

This file is the exception, and the sentence used to read "every file here", which made it a
counter-example to itself. It carries no HISTORICAL banner because it is not superseded — it is the live
instruction not to write another handoff, and bannering it would retire the retirement notice.
