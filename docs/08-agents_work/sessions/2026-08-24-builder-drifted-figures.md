---
date: 2026-08-24
role: builder
task: drifted-figures
branch: fix/pr3-figures
tier: trivial
qa_verdict: PASS
---

Documentation only. Two drifted `CLAUDE.md` figures corrected in place with superseded notes, one finding added.
**`npm run check` is 30 steps, not 29** — derived, not recalled. The builder recorded "29 of 30 pass; only `check:mc` fails" and was right; the CEO synthesis that day rendered it "29 of 29", dropping the failing step out of the denominator so a partial pass read as a clean sweep, and that version propagated into `CLAUDE.md` and two handoffs. Second instance in one week of *the orchestrator's brief is a defect surface nobody reviews*. Also recorded: `check` chains with `&&` and `check:mc` is step 21, so one invocation aborts there and the last 9 steps never run — "29 of 30" is a per-step tally, not a run's exit status.
**`check:mc` fails because of the armed sandbox, not mission-control.** Two cells, same commit and deps, Bun 1.3.10: sandboxed 344 pass · 1 fail · exit 1; sandbox disabled 345 pass · 0 fail · exit 0. Exactly one `Bun.serve` in the tree, stopped in a `finally`, on `port: 0`; `errno: 0` where a real macOS `EADDRINUSE` is 48 — a denied loopback `bind()`. `stream.test.ts` must not be edited to green it (it is a regression test found by running it), and no network allowance can fix it: the model is an outbound domain proxy with no inbound setting.
`docs/STATUS.md` repeats neither figure; its one `29` is the allow-rule count, verified still correct. **Follow-up, brief widened by the lead:** STATUS.md item 3 asserted "The OS sandbox is configured nowhere" — false (`sandbox.enabled: true`, `failIfUnavailable: true`, pinned by `test:sandbox`, 7 pass). Corrected in place with a superseded note. Its sub-claim was verified before rewriting around it and **holds**: `operator`/`instrument` are still uncreated (18 files in `.claude/agents/`, neither present; `ENGINES` names seven, neither of them). Correcting it does **not** close the item — arming does not discharge the reason, since the Bash sandbox is a guardrail with a `dangerouslyDisableSandbox` escape hatch, not containment, so it still cannot hold payment keys. Premise corrected, item left open.
Still stale and OUT of scope, for the lead: `CLAUDE.md`'s Blockers bullet lists "whether to arm the sandbox" as a pending founder decision, directly above the bullet saying it is armed — same contradiction class.
Verified: `check:memory` 0, `check:map` 0, `check:ledger` 0, each run individually with real exit codes; ledger A/B'd against the pre-edit file, identical (80 pass · 8 would_block · 0 block), zero drift.
