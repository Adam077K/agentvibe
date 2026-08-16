# Build brief — complete the harness, one session

**Task:** Finish the agent harness autonomously. **From:** ceo (`ceo-1-1786445435`) · **To:** the build session
**Date:** 2026-08-16 · **Against:** `main` = `c180cfe` · **Revision 2** — rewritten after PR #47 merged

> **Read [docs/STATUS.md](../../STATUS.md) first.** It is the parallel session's living status and it corrects
> at least one thing this repo recorded as measured fact. This brief is written to agree with it.

---

## The instruction

Founder, 2026-08-16, after being given and rejecting the recommendation to stop building and run a real task:

> Keep building the harness. The **processes** are overengineered, not the work. **One session completes the
> system autonomously** — as many agents as it needs, no overengineered reviews or check-ins — then test it
> and confirm quality, **without missing any part of the harness.**

**Cut the ceremony, not the coverage.** Two review rounds maximum. No status check-ins. Report once at the
end. The QA gate stays and cannot be overridden — it is the one process that now demonstrably works.

---

## Already done — do NOT rebuild these

PR #47 landed after this brief's first revision and closed most of its critical path.

| Was on the list | Status |
|---|---|
| `agentType` at qa.js's dispatch sites | **Done.** Evidence-gatherers run as `reviewer`; the judge runs as `reviewer-readonly`, which has no shell |
| `run-gate.mjs` — route something to the gate | **Done**, with `run-gate.test.mjs` |
| `stop_reason` probe | **Done** — `probe-stop-reason.mjs`, 2,538 transcripts. The output ceiling ended **zero** runs |
| `.mcp.json` + per-server allowlist | **Done, in one commit** — the trap was avoided; the old check was a boolean that would have opened MCP to every agent at once |
| `--dangerously-skip-permissions` | **Removed.** The two remaining hits in `bin/warroom` are comments recording the removal. The 26 allow/deny rules are live now |
| `designer` has no browser | **Granted `playwright`.** Policy: open web allowed, local network refused |
| `allowed-tools` subtraction hazard | `schema-lint.js` now refuses the attachment · `skill-clamp.test.mjs` |
| `pre-tool-use.sh` blocked nothing | **Fixed** — it parsed JSON with a line-oriented `awk` split, so `rm -rf /` exited 0. Structural parse, fails closed, 134 tests |

**The gate refuses now.** It ran three times against #47 and blocked every time — on its own author's work.
Three independent reviewers then returned FAIL, finding in already-"finished" work: a CWE-22 path traversal
echoing files into fork-visible CI logs, a symlink bypass of its fix, **eleven SSRF bypasses** of a guard whose
comment claimed the address was refused, two more in the rewrite that closed those eleven, an auto-approved
RCE path added in a change described as tightening, and four false claims in the docs. All reproduced by hand,
fixed, and pinned.

---

## Corrections to what this repo believes

**1 · `maxTurns` BINDS when a dispatch names an `agentType`, and not otherwise.** The repo recorded the
opposite as measured fact. That measurement came from a corpus where **no agent file was named**. Naming
`agentType` at four sites silently capped every reviewer at 20 tool calls and cost three failed gate runs.
Now at **30 — the `schema-lint` ceiling — on every engine.** Do not delete this field believing it inert; the
open question is whether 30 is enough. *Bounded honestly by the session that found it: 20 explained 13 of 20
dropouts; the other 7 exceeded the cap and are unexplained.*

**2 · MCP tool calls only reach a hook if the matcher names them.** Any sentence of the form *"the hook still
fires"* is false for MCP unless the matcher says so. That claim propagated into four files before it was caught.

**3 · A subagent that stops early reports as "available", not "incomplete".** Two of three independent
reviewers went idle without sending reports; taken at face value that reads as *"reviewed it, found nothing."*
**Never trust a subagent's silence — or its report — without checking.** Both sessions hit this independently.

**4 · Durable facts are living in prose.** Nothing from any of this was added to `CLAIM-LEDGER.md` — which is
exactly where the wrong `maxTurns` belief lived while it was wrong. Rule 9 exists for this.

---

## Critical path

```
[prompt standard] ──► FOUNDER APPROVAL ──► [roster 17→7] ──► [MCP servers] ──► done
      ▲                                          ▲
  start here                              [OS sandbox] gates operator/instrument
```

**1 · The prompt-craft standard.** Write `docs/03-system-design/agents/PROMPT-STANDARD.md` — structure,
length, word choice, anti-sycophancy, the never-appear list — **and a `schema-lint` rule that enforces it.**
A standard with no linter rule is a wish. Then stop for founder approval. **This is the only stop.**

**2 · Roster 17 → 7.** Rewrite `orchestrator, builder, designer, reviewer, sourcer` against the standard.
Create `instrument.md` and `operator.md`. Delete `framer.md` (safe — no global twin, no `agentType` refs).
**Do NOT delete the 11 shims** — see Traps.

**3 · MCP servers — "the real distance between the specification and a working system."** Six credentialed
servers are absent (`billing-read`, `analytics`, `deploy`, `db-admin`, `payments`, `db-read`), plus `context7`
and `github` which the capability matrix grants. `playwright` is the one grant actually installed.
**Wire everything; leave credential values blank** — issuing them is founder-present work with real money.

**4 · OS sandbox.** Configured nowhere. `operator` and `instrument` are deliberately uncreated until it
exists, because they would hold payment keys and deploy tokens in a container that cannot hold them. **Build
it; leave it off by default** — it binds the founder's own sessions.

---

## Parallel lanes — run concurrently, one agent each, disjoint files

| Lane | Work | Owns |
|---|---|---|
| **A · ledger** | #55 · #57 (`sweep` never consults `glob.present`; `ledger.mjs:916`) · #58 · #59 · promote `warn('unregistered')` → `fail` | `scripts/ledger.mjs`, `scripts/check-registration.mjs`, `.github/workflows/ledger-sweep.yml` |
| **B · mission-control** | #53 (`readLedgerIndex` casts instead of validating) · #54 (fixtures unbound to producer shape) | `mission-control/server/projects.ts`, `mission-control/test/**` |
| **C · claim ledger debt** | Register the durable facts above as claims — `maxTurns` binding, the MCP matcher rule, `tools:` binding | `CLAIM-LEDGER.md`, `.claude/ledger/**` |
| **D · safety floor** | `execFileSync('/bin/sh', ['-c', ev.cmd])` at `resolvers.js:261` — command injection in the resolver that runs claim evidence · register `budget-guard.js` | `scripts/lib/resolvers.js`, `.claude/settings.json` |
| **E · truth** | Delete the false *"subagents cannot spawn subagents"* constraint (measured false 2026-08-13) · resolve F13 vs `classifier.js` | `.claude/entry/ceo.md`, `docs/03-system-design/**` |
| **F · phantom dispatch** | `design.js` and `coding.js` dispatch six `agentType`s that exist nowhere; `research.js` dispatches `researcher`, the one shim a workflow uses. Repoint **before** the roster moves | `.claude/workflows/design.js`, `coding.js`, `research.js` |
| **SOLO** | prompt standard, then roster + `schema-lint.js` | `.claude/agents/**`, `.claude/hooks/schema-lint.js` |

`.claude/hooks/schema-lint.js` is the contention point — **one owner, never concurrent.**

---

## Traps — measured, not theoretical

1. **Deleting the 11 shims is a silent substitution, not a removal.** Each has a drifted twin in
   `~/.claude/agents/` (`ceo` is 313 lines, routing to four retired agents). Deletion un-shadows them and
   **nothing reports an error.** Blocked on Phase 9, which is out of scope. **Leave them.**
2. **`maxTurns` is in `REQUIRED_FRONTMATTER` and capped 5–30 by lint.** It binds. See correction 1.
3. **Repoint workflow `agentType`s before the roster changes under them**, not after.
4. **The permission model is live now.** A command that passed silently before #47 may prompt. If a lane
   stalls, check for a permission prompt before assuming a hang.
5. **Measure from a clean checkout with `bun install` run.** Without it the ledger reports 8 would_block
   instead of 5 and three mission-control claims look like regressions. This produced two wrong readings.
6. **A string count is not a behaviour count.** `grep -c dangerously-skip-permissions bin/warroom` returns 2
   on current `main`; both are comments recording its removal. Check context before concluding.
7. **zsh does not word-split unquoted expansions.** Use `xargs`; `xargs -a` is GNU-only, BSD needs `<`.

---

## Batch for the founder — do not stall

Do everything around these, then present them **once**, at the end, with a recommendation:

| Decision |
|---|
| Credential scopes for `instrument`/`operator` — Stripe restricted vs live, Supabase anon vs service role, and whether `operator` touches live payments at all |
| OS sandbox: egress policy, and whether to enable it (it binds founder sessions) |
| **#56** — the 4,096-byte session-start budget: Refresh, Deprecate, or Waive |
| **#55** — index churn vs extension counter vs sweep report vs hard cap |
| F13 vs `classifier.js` — two mechanisms compute risk and disagree while CLAUDE.md claims one |
| The 44 files in `~/.claude/agents/` — affects two other live projects |
| Codex: install it, or delete CLAUDE.md's Full-tier requirement |

---

## Definition of done

**A dispatch runs through a container that actually constrains it, a gate that can actually refuse, and a
grant that actually exists.** The middle one is now true. The other two are the work.

- [ ] `npm run check` exit 0 from a **clean detached worktree** at `origin/main`, after `bun install`
- [ ] `node scripts/ledger.mjs verify` → `0 block`, every `would_block` carrying a recorded `disposition`
- [ ] 7 agent files, each conforming to the approved prompt standard, each passing its new lint rule
- [ ] Every `agentType` dispatched anywhere resolves to a file in `.claude/agents/`
- [ ] An un-allowlisted `mcpServers:` declaration fails lint
- [ ] An `mcp__*` payload through `pre-tool-use.sh` exits 2 rather than falling through to `allow`
- [ ] `tools:` binding **verified by attempt**, not by lint — the judge's "no shell" guarantee rests on it and
      its own prompt asserts it. Tracked as `c-read-only-binding-unverified`
- [ ] The corrections above exist as claims in `CLAIM-LEDGER.md`, not as prose
- [ ] `git grep "subagents cannot spawn"` returns only historical records
- [ ] Session file with `qa_verdict: PASS` per merged PR, tier declared

**Report once, at the end. State what you did not cover and what you could not verify.** Both sessions
independently learned that a report which reads uniformly confident is worth less than one that marks its own
soft spots.

---

## The thing both sessions agree on, recorded because the founder overruled it

`docs/STATUS.md` and this brief independently concluded the next step should be **one real venture task, end
to end**. Every one of the 44 session files is infrastructure; no venture work has ever run through this
harness. The founder's decision on 2026-08-16 — made after that recommendation was put and argued — is to
finish the harness first. Recorded so it reads as a choice with its cost known.

---

*Written by: ceo · 2026-08-16 · against `main` = `c180cfe` · revision 2, reconciled with `docs/STATUS.md`*
