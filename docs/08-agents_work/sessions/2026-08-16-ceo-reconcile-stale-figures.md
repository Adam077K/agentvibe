---
date: 2026-08-16
role: ceo
task: reconcile stale figures and deprecate a change-detector that correctly fired
qa_verdict: PASS
tier: lite
---

Three documents stated three different numbers for one fact. `PHASE-8A-STATUS.md` pinned the ledger
baseline as absolutes ("8 would_block instead of 5") — both had drifted; restated as the delta that does
not rot. `AGENT-ARCHITECTURE.md`'s "17 agent files → 5" was a true record of its analysis and a false
statement of current state (7 engines of 18 files); annotated, not rewritten.

`c-mcp-hook-matcher-must-name-the-tool` read as a regression on `main` and was not one. PR #73 moved both
strings it pinned, which is precisely what its own comment said it existed to detect. Deprecated — the
question was retired by the fix, not re-answered — and succeeded by a claim pinning the matcher AND
`mcp_policy_check` AND the tests, because a claim running only the suite would miss a matcher revert.
#73 had registered nothing in its place; the gap was invisible because the ledger got quieter, not louder.

Found while doing this and handed to the lane that owns the file: `dispositionOutcome()` is called by
`claim-freshness` and `claim-judge` only, never by `claim-command` or `claim-source` — so `deprecate`
cannot retire a command-claim, contradicting the contract documented directly above it.

`qa_verdict: PASS` here is author-asserted. PR #77, which would make that a verified claim rather than a
typed one, is open and awaiting a founder decision.
