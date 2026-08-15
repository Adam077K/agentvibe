---
date: 2026-08-16
role: ceo
task: gate-routing
tier: irreversible
qa_verdict: PENDING
---

Items 1–4 of the implementation handoff. Founder merged #42 and #43 first; both landed clean.
`npm run check` exits 0 — 13 test files, zero failures.

**1. The gate's reviewers could edit what they judged.** All four `agent()` sites in `qa.js` omitted
`agentType`, so the binary defaulted them to `general-purpose` with tools `*` — every dimension reviewer,
every adversarial verifier, and **the one judge whose verdict binds**. All four now run as `reviewer`
(`Read, Glob, Grep, Bash`). Honest limit, stated in the code: `tools:` is not known to bind `Bash`, so this
closes the accidental path, not the deliberate one. The deliberate one closes with the OS sandbox.

**2. Nothing routed to the gate.** [`scripts/run-gate.mjs`](../../../scripts/run-gate.mjs) computes the tier
floor through the *one* classifier and emits the exact `Workflow` invocation when the binding gate is
required. **It cannot execute `qa.js`** — that file closes over Workflow-runtime globals no node process
provides — and its own header says so, because a router nobody calls is the defect it was written to fix.
8 tests, including: an unreadable ref exits 2 rather than reporting "nothing to gate", since fail-open in a
router is indistinguishable from no router.

**3. What actually ends a run — measured, not assumed.** `message.stop_reason` sat in every transcript and
was never parsed. `turnsFrom()` now carries it, with **absent kept distinct from unread**. Across 2,538
transcripts and 166,300 turns:

| | end_turn | tool_use (mid-tool) | max_tokens |
|---|---|---|---|
| main-thread final turn | 60 (91%) | 3 | **0** |
| subagent final turn | 805 (33%) | **1,123 (46%)** | **0** |

**The output ceiling truncated 3 turns in 166,300 and ended zero transcripts** — a clean negative that
retires "raise max output tokens" as a fix for anything here. The live finding is the asymmetry: main threads
end cleanly, subagents end mid-tool nearly half the time. A transcript-flush artifact would hit both equally.
This is the on-disk signature of the defect that hit three times during the specification sessions — a
subagent reporting "available" while incomplete. **Not yet proven to be the same event**; 448 subagent
transcripts also end with no `stop_reason` at all, and that bucket is reported separately rather than folded
into a total.

**4. A skill that subtracts must not attach silently.** `allowed-tools` in a `SKILL.md` is a **ceiling, not a
grant**. Eight skills declare it. Six quietly remove `Bash` and every MCP tool; **two clamp to a single Bash
pattern** — `impeccable` to `npx impeccable *`, `pitch-deck-visuals` to `belt *` — leaving the loading agent
unable to `Read`, `Write`, or reach an MCP server. **`impeccable` is the skill the roster spec assigns to
`designer`**, whose entire reason to exist is a browser perception loop it would then be unable to reach, in
order to run a CLI not installed on this machine. `schema-lint.js` now refuses the attachment and quotes the
clamp. No agent declares one today, so the rule is currently vacuous — which is exactly when it is cheap.

**Not done, deliberately.** Removing dead `maxTurns` and `Task` declarations from the six agent files. They
live under `.claude/agents/`, which the founder's **prompt-craft gate** closes until a written prompt standard
exists and is approved. Flagged rather than quietly done or quietly skipped.

**Also found, not fixed:** `qa.js` hard-codes five review dimensions and **never reads `review-lenses.yml`**.
The two lists share only two names. So `adversarial`, `evidence` and `scope` — three lenses whose
`independent:` predicate was made satisfiable in #42 specifically so they could run — still do not run,
because the gate does not read the file they live in. `MODEL-DIVERSITY.md:293` recorded this before I did.
Fixing it changes what the gate reviews, which is a decision, not a cleanup.

## Why this says PENDING

The router added in item 2 classifies **this PR** as `irreversible` and prints that the binding gate is
required. Writing `PASS` here without running it would be the exact behaviour the router exists to refuse,
in the same commit that adds it. The verdict is left open pending either a real `qa.js` run or the founder's
explicit author-review authorisation, as on #42.
