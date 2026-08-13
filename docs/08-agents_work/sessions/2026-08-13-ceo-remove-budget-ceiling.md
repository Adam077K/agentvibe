---
date: 2026-08-13
role: ceo
task: remove-budget-ceiling
tier: irreversible
qa_verdict: PASS
---

Founder instruction: remove the BUDGET CEILING from the system. `budget-guard.js` was registered as a `PreToolUse` hook **with no matcher**, so it fired on every tool call — it blocked the CEO mid-task, blocked the PR4 builder before its first commit, and blocked a probe from writing its own report. **Unregistered, not deleted:** deleting it breaks `scripts/usage.test.mjs` (which tests that it blocks) and `mission-control/server/collectors/events.ts` (which reads the real ceilings out of the hook's own source, with a test pinning it), removing a merged Mission Control feature — more than was asked. One object removed from `.claude/settings.json`; one line to revert. `check-registration.mjs` immediately reported the file as registered nowhere and `CODEBASE-MAP.md` regenerated to `BLOCKS | not registered`; both mechanisms behaved correctly.
**The cost is stated, not hidden:** nothing now stops a session running unbounded, and stop condition 3 has no mechanism. Until the Founder instructed this, I did **not** bypass the guard via `Read`/`Edit`, which I could have at any point — routing silently around a guard that just fired is the exact failure this phase is about.
Also landed: the PR4 grill decisions; `c-runtime-nested-spawn` **Refreshed** (depth-2 nesting measured working twice — and the CEO operating instructions state the opposite, so the **T2 tier rests on a false premise**, flagged not changed); and two corrections of my own figures — the global ledger holds **4** `scope: global` claims not 5 (builder caught it), and `/api/belief` costs **10,385 ms** not the 25 ms I put in a builder's brief, because I timed a `MODULE_NOT_FOUND` crash without checking its exit code.
**`npm run check` does not pass and is not claimed to:** `crosscheck.test.ts:238` asserts a cache file's mtime is unchanged while other live sessions rewrite it continuously — it measures *change* and concludes *authorship* — and the ledger crosscheck's 30 s timeout is under the real 10–17.5 s cost. Both pre-existing and environmental. One more gate weakness observed here: with two session files in the diff, `qa-lead-pass.yml` picked one **arbitrarily** and failed on it while the other carried PASS.
Verdict is author-declared with no reviewer, on a change the Founder instructed directly — the discretion tracked as #24, and at `tier: irreversible` it is exactly the discretion #24 says the gate cannot detect.
