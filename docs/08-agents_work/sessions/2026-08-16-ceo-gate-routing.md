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

## The gate ran, and it blocked its own author

Founder authorised the run. **`qa.js` judged a pull request for the first time in its existence** — 37
agents, 2.24M tokens, 26 minutes — and returned **BLOCK** on PR #47, the PR that added the router pointing
at it. Four findings survived 3-way adversarial verification. I reproduced the most serious one by hand
before accepting it.

**1 · CWE-22 path traversal in my own security-hardening change.** `schema-lint.js`'s clamp loop ran over
every declared skill name *before* any had been checked against the manifest, so `skills: ["../.."]` reached
`path.join` + `readFileSync`. Confirmed first-hand with a canary at the repo root: the file was read **and
its contents echoed into the issue text**, which lands in CI logs — in a linter that runs on every
`pull_request`, including from forks. Fixed three ways: the loop is now inside the manifest guard and skips
unknown names; `skillToolClamp` refuses any name that is not a lowercase slug; and the resolved path is
asserted to sit under `.claude/skills/`. Five traversal shapes pinned, plus a test that a bad name still
gets its ordinary "not in MANIFEST.json" complaint — silently ignoring it would trade one defect for another.

**2 · The probe shipped with zero tests.** 135 lines, absent from `npm run check`. The objection was not
procedural: **this file's bucketing had already been silently wrong once** — it split on "contains a subagent
turn anywhere" rather than "the final turn was one" — and was caught by reading output, not by a test.
9 tests now, including the discriminating fixture (a transcript holding a subagent turn but ending on the
main thread) and a pin that a *missing* corpus exits non-zero rather than reporting zero stranded subagents,
which would read as good news.

**3 · Half the tier boundary was unasserted.** `GATE_REQUIRED_TIERS` has two members; my suite exercised only
`irreversible`. Narrowing it to `['irreversible']` passed every test while silently un-gating the common
API/DB/auth case. Now pinned from both sides — all four tiers, `full` included.

**4 · The reviewer still holds `Bash`.** True, and not fixed here. My original comment deferred to "the OS
sandbox", which is **configured nowhere**. Citing a backstop that does not exist is worse than citing none.
The comment now names the real state and the two available fixes, both of which need a founder decision:
dropping `Bash` from the reviewer touches `.claude/agents/**`, closed by the prompt-craft gate; the hook
alternative assumes the hook can see the agent type, which is **unverified**.

**Also: three of five dimensions failed to complete** — `correctness`, `patterns`, `tests` — which is an
automatic coverage-gap BLOCK independent of the findings. 20 of 37 agents returned empty. **That is the
defect item 3 measured, occurring live inside the gate that was measuring it.**

Two P3 advisories were recorded as non-blocking. One is fixed anyway (`--ref` beginning with `-` reaches
`git diff` as an option; refused now, with the reachable single-dash form pinned). The other — the probe's
unbounded synchronous scan — is left: it is a manual measurement tool, ~40 s over 3 GB, and a cache would add
a staleness failure mode to buy nothing.

`npm run check` exits 0 — **14 test files**, zero failures.

## Why the verdict still says PENDING

The fixes above are not self-certified. The gate must run again and pass on its own terms before anything
here says `PASS`.
