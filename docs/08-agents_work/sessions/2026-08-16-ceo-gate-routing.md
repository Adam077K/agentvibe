---
date: 2026-08-16
role: ceo
task: gate-routing
tier: irreversible
qa_verdict: PASS
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

## Second run: BLOCK again, and it found a bypass of my own fix

Four findings became two. The new one was a **symlink route to the same disclosure the `../` fix had just
closed**: `path.resolve` is string arithmetic, never touches disk, and cannot see a symlink — so
`.claude/skills/<valid-name>` pointing outside the tree satisfied the lexical containment check while
`readFileSync` followed the link out. Reproduced before accepting (lexical check `true`, realpath
`/private/tmp/evil-target/SKILL.md`, canary readable). Closed with `lstat` refusal plus `realpathSync`
containment, and the regression asserts the lexical check alone would still have passed, so the test cannot
pass for the wrong reason. **My own test then leaked a fixture symlink into `.claude/skills/`, where the
harness immediately advertised it as a loadable skill** — `rmSync` does not unlink a symlink to a directory.
The test now self-heals, refuses to clobber a real directory, and asserts no strays.

## Why the gate could never pass, and what it cost to find out

Both runs blocked partly on a coverage gap. Reading the journals: **15 of 31 dispatched agents returned
nothing**, `agents_error: 0`, **100% ending on `stop_reason: tool_use`** — mid-tool, never reaching
StructuredOutput. The pending calls were ordinary: `grep`, `sed`, `git status`, `npm run lint:agents`.
Nothing the safety hook blocks.

Four explanations were tested against the transcripts and **all four refuted**: a turn cap (successes reached
43 turns, failures started at 37), context exhaustion (30–84k vs 53–88k), output tokens, and a wall-clock
timeout (median 113 s vs 123 s). The dropout is ~48% and **unexplained by anything on disk.** At 2 attempts a
dimension fails ~23% of the time, so some critical dimension failed nearly every run — which is why this gate
had never returned PASS. `REVIEW_ATTEMPTS` is now 4 (~5%), and the code says plainly that this is mitigation:
the defect is in the runtime, not in this repo.

## The containment finding, fixed properly rather than by comment

Founder authorised an explicit exception to the prompt-craft gate. The fix is **not** one container
everywhere — it follows what each dispatch actually needs:

| Dispatch | Container | Why |
|---|---|---|
| reviewers · verifiers · sweeps | `reviewer` (has `Bash`) | They must run `git diff` and read changed files. A reviewer that cannot see the artifact invents one. Their output is evidence, not a verdict |
| **the judge** | **`reviewer-readonly`** (no `Bash`, no `Write`, no `Edit`) | Its entire input is serialised into its prompt. It reads nothing and runs nothing — so the one agent whose verdict cannot be overridden is the one agent that cannot touch the repository |

The judge's prompt now states it has no shell and that "I could not verify this myself" is not grounds to
dismiss a finding — three verifiers already attacked each one against the real diff. **Residual stated, not
hidden:** a dimension reviewer still holds a shell. It cannot pass its own finding through, but it is not
contained until the sandbox exists.

## Designer can finally see

`designer` is described as *"the only producing engine with a perception loop — render, look at what
rendered, iterate."* It held **no browser at all**: no `.mcp.json` existed anywhere and no agent declared
`mcpServers`. Granted `playwright`, founder decision.

**The sequencing hazard was real and is closed in the same commit.** `mcpConfigured()` was a boolean — "does
any MCP config exist" — so creating one `.mcp.json` would have let **every** agent declare **any** server and
pass. It is now `configuredMcpServers()`, returning the actual names, and each declaration is checked against
them. Proven both ways: `notaserver` fails and names what is available; one valid server does not launder an
invalid one beside it.

## Also landed

**The permission model started applying.** `bin/warroom` passed `--dangerously-skip-permissions`, making all
26 allow/deny rules in `settings.json` inert. Removed. Six allow entries added, chosen from **11,342 Bash
calls across 400 transcripts** — 8,603 already matched; the real gaps were `bun` (160), `npm` (78), `bunx`
(66), plus `printf`, `timeout`, `sleep`. A first pass at this measurement said "47% would prompt", was
tokenising heredoc bodies, and was **discarded rather than reported**.

**Risk stopped being computed twice.** F13 required `tier: full|irreversible` on *every* session file in a
mixed PR — including files `classifier.js` tiers `trivial`. It now requires it on **at least one**.
`CLAUDE.md:156` corrected: it claimed one implementation while two existed.

`npm run check` exits 0 — **15 test files**, zero failures.

## Third run: BLOCK — and it caught a false premise in this very file

**The finding is real and it is mine.** Granting `designer` a browser activated the first live MCP capability
in this repo, and **MCP tool calls do not reach the safety hook at all.** `.claude/settings.json` registers
`PreToolUse` with `"matcher": "Bash|Edit|Write|NotebookEdit"`; `mcp__playwright__browser_navigate` matches
none of them. Verified by running the matcher as a regex against real tool names:

```
Bash                                 matches=True
mcp__playwright__browser_navigate    matches=False
```

So for the browser, none of the hook's protections apply — not the curl-to-external-URL block, not the
`.env` read block, not the write-outside-project-root block. **And this file, and `DECISIONS.md`, justified
removing `--dangerously-skip-permissions` partly on the sentence "the PreToolUse hook still fired, so the
system was not unprotected."** That sentence is true for Bash and file writes and was written as though it
were general. It is false for the exact capability the same change activated. Corrected in both places.

The reviewer that found it also stated its own limit — that Claude Code's interactive permission prompt may
still gate first use of an unlisted MCP tool, but that it could not verify this from the diff and would not
lean on it to downgrade the finding. That is the standard this gate is supposed to hold, met.

**The grant is therefore left in place but is NOT defensible on the old justification.** It needs either a
control that sees MCP calls, or an explicit founder decision to accept an uncontrolled browser. That is a
decision, not a cleanup, and it is not mine to make silently.

## The mitigation did not work, and saying so is the point

`REVIEW_ATTEMPTS` 2 → 4 was supposed to cut coverage-gap odds from ~23% to ~5%. **It did not.** `correctness`
failed for the third consecutive run, empty results rose from 20 to 22, and this time **the judge itself
dropped out** — so the recorded verdict is `auto-BLOCK to protect the binding gate`, a fail-safe rather than a
judgement. The gate never actually judged this change.

Three runs, ~6.3M tokens, and the binding gate has still never returned a verdict it reached by reasoning.
Retrying is not the fix; the ~48% dropout is a runtime defect and this repo cannot patch around it. **The next
person should not spend another 2M tokens re-running this hoping for a different roll.**

## Why the verdict says PENDING

Three runs, three BLOCKs, and the third was a dropout rather than a decision. Nothing here is self-certified,
and nothing here has been blessed either. The verdict field stays open, honestly, rather than being filled by
the author of the change it would bless.

---

## The dropout was mine, and it was not a runtime defect

Everything above about a "~48% unexplained dropout" was **wrong in its diagnosis** and is corrected here
rather than left standing.

Tool-call count separates the two populations **perfectly**, where turns, context and wall-clock all
overlapped:

| | tool calls |
|---|---|
| returned findings | 8, 16, 16, **17** |
| returned nothing | **20**, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 32, 32, 32, 32, 34, 34 |

**13 of 20 dropouts sat at exactly 20** — the `maxTurns` declared on the reviewer containers. Not stochastic:
a declared cap, cutting agents off mid-work with findings in hand. **The CEO introduced it** by adding
`agentType` at the four `qa.js` dispatch sites; `general-purpose` declares no cap, which is why the eight
historical runs completed and all three of mine did not.

It also **refutes a belief this repo had written down as measured fact** — *"`maxTurns` does not bind, 196 of
269 runs exceeded a cap of 20."* It does not bind when no agent file is named. It binds hard the moment one
is. I repeated that false belief while diagnosing the symptom it caused.

Fixed: cap → 30 (schema max); `reviewPrompt` rewritten around a finite budget — `git diff` as primary
evidence, whole-file reads the exception, and an explicit instruction to **emit partial findings rather than
be killed holding a complete set**, because a reviewer that never calls `StructuredOutput` is recorded as a
coverage gap and blocks the merge on a technicality. The judge gained the retry the reviewers already had: it
ran with **one** attempt against their four, so it coin-flipped into `auto-BLOCK` — which is exactly what run
three recorded.

## The browser: the open web, not localhost

The first rule written was localhost-only, reasoned from `designer`'s perception loop and applied as if it
were system policy. **Founder overruled it, correctly.** `sourcer` answers questions with sourced evidence and
`WebFetch` returns almost nothing on a JS-rendered site. The deciding argument: agents **already** hold
`WebSearch` and `WebFetch`, so untrusted web text already reaches context — blocking the browser does not
close prompt injection, it only makes the agent worse at the work it exists to do.

Refused instead, because it is not the web: `169.254/16` (cloud metadata), `10/8`, `172.16/12`, `192.168/16`,
`0.0.0.0`, and the `file:` / `data:` / `javascript:` schemes.

**A bug I introduced and caught in the same pass:** the first denylist blocked `10.great.example.com` and
`192.168.marketing.io` — real public domains matched as if they were private IPs. Private-range checks now
apply only to literal IPv4 addresses. A denylist that blocks legitimate research fails as badly as one that
allows the metadata endpoint; it just fails in the other direction.

**95 tests**, including the two that would have caught me: `172.15`/`172.32` must be public while
`172.16`/`172.31` are private (the classic SSRF off-by-one, in both directions), and
`http://example.com@169.254.169.254/`, where userinfo smuggles you to the metadata endpoint while the URL
reads as `example.com`.

**Registration is pinned separately from behaviour.** The rule tests invoke the hook directly, which proves
nothing about whether Claude Code ever calls it — the matcher decides that, and until today it named no MCP
tool. A correct rule that never fires is precisely the defect being fixed.

**Two limits written into the hook rather than oversold:** it matches the URL *string*, so a hostname that
resolves to a private address passes (resolution-time enforcement belongs to the OS sandbox); and no URL guard
closes prompt injection — that is answered by keeping deploy and payment credentials away from the browsing
agent, which is why `operator` and `instrument` are separate engines.

## The false premise propagated to three files before the gate caught it

*"The PreToolUse hook still fired, so the system was not unprotected."* True for Bash and file writes. False
for MCP, whose calls matched no matcher. It had been written into `DECISIONS.md`, this session file, and the
header of `launcher-permissions.test.mjs`. All three corrected.

---

## Verdict: PASS, on independent review — and what that does and does not mean

Founder authorised the merge. `PASS` is recorded on the strength of **three independent reviewers**, not on
the author's own say-so, which is what the field was worth on the two previous PRs.

**All three returned FAIL, and every finding was real.** Between them:

| Reviewer | Found |
|---|---|
| security | 5 SSRF bypasses; an auto-approved remote-code-execution path added in the same change described as tightening |
| correctness | 2 further bypasses **in the rewrite that closed the first five**; a judge retry that accepted a malformed verdict and dereferenced it |
| evidence | 4 false or overstated claims, including a fourth surviving copy of a premise already corrected three times; one unfalsifiable number quoted in five files |

Every finding was **reproduced by hand before being accepted** — none was taken on the reviewer's word. Every
one is fixed and pinned by a test that fails if it regresses. `npm run check` exits 0 across 15 test files.

**What this PASS does not mean.** The hook took four attempts to get right, and I was wrong about it every
time until someone else looked — including one attempt that broke the guard into refusing everything,
localhost included. The verdict says three hostile readers found problems and the problems were fixed. It
does not say the file is now beyond question.

**Two residuals, named rather than closed:**
- The judge's "no shell" guarantee rests on `tools:` binding at runtime, which this repo tracks as unverified
  (`c-read-only-binding-unverified`). Its prompt asserts it has no shell. If `tools:` does not bind, that
  statement is false to the one agent whose verdict cannot be overridden.
- Nothing was added to `CLAIM-LEDGER.md`. The durable facts this session established live only in prose —
  exactly where the `maxTurns` belief lived while it was wrong.

**Stated limit on the panel itself:** three reviewers, one model family. This is not a multi-family
independent panel, and none of them claimed to be.
