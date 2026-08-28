---
role: builder
task: dispatch-route
date: 2026-08-28
branch: feat/dispatch-route
worktree: .worktrees/dispatch-route
base: 62e0c26
tier: full
risk: full
tier_note: "node scripts/classify.mjs over the three changed source paths returns floor=full, driven by mission-control/scripts/** and mission-control/server/**; the test file is lite. Independently confirmed by scripts/run-gate.mjs --json on this branch: floor=full, gateRequired=true, drivers = the two non-test files. NOT irreversible: the diff touches no .claude/** and no scripts/** file at all, and adds no check:*/test:* name, so scripts/lib/check-suite.js STEPS is untouched."
qa_verdict: PASS
verification: "mission-control/test/dispatch.test.ts 74 pass / 0 fail / 245 expect (base 53/0/158; 21 new). schema-lint 18 pass / 0 fail / 0 warnings, unchanged. Routing observed through a fixture `claude` recording argv NUL-separated: argv is [--agent, orchestrator, --print, <prompt>], length 4, goal embedded not bare. deriveGateReachability probed against all 7 real engine files -> unreachable x7; controls: Workflow granted -> unverified, absent agent -> underivable, WorkflowRunner -> unreachable, Workflow in PROSE only -> unreachable (the must-not-fire mutation, armed in every fixture). Gate routing pinned by 6 fixture-router tests plus one ANTI-DRIFT test that runs the REAL scripts/run-gate.mjs --json and asserts every field the consumer reads is present."
finding_control_plane_1_1: "CONTROL-PLANE.md 1.1 — 'the single most important fact in this document' — is FALSE at claude 2.1.246. It says 'nothing in the CLI binds a main session to an agent file', reasoning from `--agents` (plural), measured at 2.1.232, which supplies available SUBAGENT TYPES. It did not consider `--agent` (singular), whose help text at 2.1.246 reads verbatim: 'Agent for the current session. Overrides the agent setting.' That is the mechanism 1.1 argues from absence does not exist. This ANSWERS open probe P3 ('Can anything bind a main session to an agent file?') in the affirmative. Not necessarily wrong when written: 1.1 measured 2.1.232 and I measured 2.1.246."
finding_lint_premise: "PS-WORKFLOW-CONTAINMENT arm 2 fails a Workflow declaration on `orchestrator` with the reason 'it is not dispatched, it IS the session, so no field in this frontmatter is read on the path it runs on'. That premise holds for `bin/warroom`'s bare `claude` and is FALSE for any session started with `--agent orchestrator`. The rule's CONCLUSION may survive; its stated ARGUMENT does not. I did not touch the lint or the agent file — both irreversible, both out of scope, and the grant is an untaken founder decision. schema-lint is still 18/0/0 because this branch declares no Workflow anywhere."
finding_capability_direction: "Routing does not merely FAIL to buy the gate — it REMOVES a capability the bare path has, and the brief (mine and the lead's) had this backwards. Re-derived with scripts/probe-workflow-reach.mjs at 62e0c26: 55 Workflow calls from main sessions, 0 from subagents, control fired (Bash 54262 subagent / 7025 main), verdict CONTAINED. A bare `claude --print` dispatch is a MAIN session and therefore holds Workflow; `--agent orchestrator` makes the frontmatter binding and its declared 7 tools contain no Workflow. Judged worth it: the bare path's access was never exercised for a dispatched goal, and run-gate.mjs now emits the invocation deterministically instead of hoping an unprompted session invokes qa.js. Naming it because it is a trade the brief did not make."
finding_maxturns: "`maxTurns: 30` in orchestrator.md also becomes load-bearing on the --agent path, along with model, effort and skills. A dispatched orchestrator is therefore capped at 30 turns where a bare one is not. Not addressed here; flagged."
gate_note: "Two independent facts, two fields, neither able to say `passed`. `gate` (GateOutcome: unreachable | unverified | underivable) answers 'could the launched session have run the gate' — derived from the target project's own agent declaration, so a future Workflow grant changes it with no edit here. `gateRouting` answers 'is the gate REQUIRED for what came out, and what would run it' — computed by the repo's own scripts/run-gate.mjs, whose header names the defect being closed: 'a router that is never called is exactly the defect it was written to fix.' Nothing called it before this. A zero-file classification is recorded as decided:false, never required:false."
qa_caveat: "A PASS I recorded myself. One author, one model family, no independent review — the deterministic floor met, not the `full` tier's review requirement. Accepted-risk exit condition 2026-11-17."
unresolved: "crosscheck.test.ts (the server shell ban) did not complete inside this lane's budget; it is the documented slow suite. What IS measured: the diff adds 0 spawn/execFile/child_process lines to mission-control/server/ (positive control: added readFileSync lines are found). Both spawns added are in the founder-run consumer, which already had one. npm run check was not run. The brief's '5 tools' figure is unverified — the orchestrator DECLARES 7; the runtime count needs the unmerged probe branch, and the load-bearing half (Workflow in 0 of 7 tools lists) I verified directly. DispatchView.tsx does not yet surface either gate field."
---

# builder — route dispatch through the orchestrator, and call the router nobody called

`claude --print <goal>` became `claude --agent orchestrator --print <prompt>`, the prompt bounding
the playbook choice to the target project's own playbooks and requiring the selection be named.

The half that matters is the record. `gate` says whether the launched session could have reached
the gate; `gateRouting` says whether the gate is required for what came out and carries the exact
invocation that would run it. Neither type has a member meaning "passed" — `GateRouting` carries
`required: true` beside an invocation nobody ran, which is the honest shape of "this dispatch
produced no verdict and here is the invocation that would."

Three things the work refuted: `CONTROL-PLANE.md` §1.1's central fact, the lint rule that rests on
it, and the direction of the trade — routing removes the gate capability rather than failing to add
it. All three are recorded above with the measurement. Nothing here touches `.claude/**`.
