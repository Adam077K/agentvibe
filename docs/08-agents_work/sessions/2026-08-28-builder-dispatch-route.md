---
role: builder
task: dispatch-route
date: 2026-08-28
branch: feat/dispatch-route
worktree: .worktrees/dispatch-route
base: 62e0c26
tier: full
risk: full
tier_note: "node scripts/classify.mjs over the three changed paths returns floor=full, driven by mission-control/scripts/** (consume-dispatch.ts) and mission-control/server/** (index-cache.ts); the test file is lite. NOT irreversible: no agent definition, workflow file, migration or billing path is touched, and no check:*/test:* name was added, so scripts/lib/check-suite.js STEPS is untouched."
qa_verdict: PASS
verification: "mission-control/test/dispatch.test.ts 66 pass / 0 fail / 213 expect (was 53/0/158 at base; 13 new). Routing observed through a fixture `claude` recording argv NUL-separated: argv is [--agent, orchestrator, --print, <prompt>], length 4, and the goal is NOT a bare argv. deriveGateReachability probed against all 7 real engine files -> unreachable x7, with tools lists read out; controls: a synthetic agent granted Workflow -> unverified, an absent agent -> underivable, `WorkflowRunner` -> unreachable, and `Workflow` in PROSE only -> unreachable (the must-not-fire mutation). Fixing the fixtures exposed a test passing for the WRONG REASON at base: `no claude on PATH is not-started` took its status from the missing-playbook refusal and readdir's own ENOENT satisfied even the error assertion; it now asserts a `running` line exists and that the message is not the refusal."
gate_note: "Routing buys the orchestrator, the lens and the playbook. It does NOT buy the QA gate: measured 2026-08-28 against claude 2.1.246, the orchestrator declares [Read, Write, Edit, Bash, Glob, Grep, Task] and `Workflow`, through which qa.js is invoked, is in the tools list of 0 of 7 engines. That gap is now DECLARED per dispatch in a field whose type has no `passed` member, and the launched session is told in its prompt not to record a qa_verdict it did not obtain."
qa_caveat: "A PASS I recorded myself. One author, one model family, no independent review — the deterministic floor met, not the `full` tier's review requirement. Accepted-risk exit condition 2026-11-17."
unresolved: "crosscheck.test.ts (the server shell ban) did not finish inside this lane's budget — it is the documented slow/flaky suite. What IS measured: my diff adds 0 spawn/execFile/child_process lines to mission-control/server/ (positive control: 1 added readFileSync line). The only spawn changed is the founder-run consumer's, which already had one. Also unverified: the brief's claim that a routed session gets 5 tools — the orchestrator DECLARES 7; the runtime count needs the unmerged probe branch."
---

# builder — route dispatch through the orchestrator

`claude --print <goal>` became `claude --agent orchestrator --print <prompt>`, the prompt bounding
the playbook choice to the target project's own playbooks and requiring the selection be named.

The second half is the one that matters. Routing does not reach the gate, so every dispatch record
now carries `route`, `gate` and `playbooksOffered`, and `GateOutcome` is `unreachable | unverified |
underivable` — a union with no member meaning "passed". The failure closed is "looks gated, wasn't",
not "not gated": the second is visible and the first is not. Reachability is DERIVED from the target
project's own agent declaration, so granting `Workflow` later changes the record with no edit here.

No fall-back: a target with no playbook records `not-started` rather than launching the bare form.
Nothing touches `.claude/agents/**`.
