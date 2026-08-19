# Handoff — audit the harness, challenge it, and repair three known holes

**From:** ceo (`ceo-1-1786880982`) · **Date:** 2026-08-20 · **Base:** `main` = `80a72fa`

> **You plan the how.** This document says what is true, what is broken, and what to find out.
> It deliberately does **not** prescribe your lane split, agent types, or sequencing. One
> constraint only: **no more than 7 agents.**

---

## 0 · The one thing to understand first

**This harness has never been used to build anything except itself.**

Everything below was found by the system working on its own codebase. That is why the audit
matters more than another feature: the failure modes we have found are the ones self-work
exposes, and we do not know what a real project would expose.

---

## 1 · What is actually true today

**The roster is 7 engines**, not the 20-agent C-suite most documents still describe:

```
orchestrator · framer · sourcer · builder · designer · reviewer · reviewer-readonly
```

Plus 11 shims — retired names kept occupied so a drifted copy in `~/.claude/agents/` cannot
capture them. Deleting a shim silently hands its name to the global copy, with no error.

**Enforced today (a build fails):** schema-lint · prompt standard (`PS-*`) · gate tests ·
skills manifest + curation + routers · registration · dispatch agentType · dispatch prompt size ·
memory budget · codebase map · launcher guard rails · lens + playbook lint · hooks · sandbox
armed · claim ledger · Mission Control. 25 blocking steps in `ci.yml`.

**The QA gate blocks and cannot be overridden by any agent.** Only the founder can appeal a
BLOCK, and the appeal is logged.

**The sandbox is ARMED** as of #94 — `enabled: true`, `failIfUnavailable: true` (fail-closed).
If it breaks a session: set `sandbox.enabled: false` and restart. That is the whole revert and it
is at the top of `docs/03-system-design/SANDBOX.md`.

---

## 2 · The defect class this round exists to hunt

**Documentation that reads as authoritative while nothing backs it.**

The founder found a live instance by asking a single question — *"do we still use CEO to chiefs to
workers?"*

`CLAUDE.md`'s "## The Team" block describes a 3-layer, 20-agent org. Checked against disk:

| | |
|---|---|
| **10 names have no file at all** | `cto` `cpo` `cmo` `cbo` `backend-engineer` `frontend-engineer` `devops-engineer` `data-engineer` `product-designer` `design-critic` |
| **9 are shims** | retired 2026-08-11 |
| **1 "real" one is `ceo`** | also a shim — its own header says it was collapsed into `orchestrator` in Phase 4b |

**Half the org chart in the most-read file points at nothing.** The session-start prompt carries
the same claim, so every session begins by being told to use a structure dismantled nine days ago.

`check-registration.mjs` did not catch it: it dead-path checks **repo paths** in prose, not
**agent names**.

**Assume there are more of these.** That is the job.

---

## 3 · Three known holes to repair

**A — the org chart above.** Rewrite `CLAUDE.md`'s team block (and `AGENTS.md` if it repeats the
claim) to the 7 engines and the lens model. Preserve the superseded statement beside its
correction rather than erasing it — house style, and the ledger's own argument for expiry.
Then **extend `check-registration.mjs`** so an agent name in prose must resolve to a real file.
Construct the failure first. Watch the trap that bit `check-dispatch-agenttype.mjs`: its first
version flagged its own source, because constant definitions matched real references. Do not fix
a false positive by exempting a filename — fix the predicate.

**B — issue #95.** `run-gate.mjs` prints a `HEAD`-relative ref that resolves in the *workflow's*
directory, not the caller's. Pasting it verbatim reviewed the wrong branch entirely. The gate's
own verifier caught it, but only because the wrong diff happened to be unrelated.

**C — issue #96.** `pre-tool-use.sh` has two false positives and an inconsistency: it blocks a safe
`--detach` long option; it blocks a heredoc that merely *documents* the hazardous form (this very
file tripped it twice while being written); and `Write` refuses the agent scratchpad while `Bash`
writes there freely — which now **contradicts the sandbox rule merged in #94**, where that path is
explicitly allowed.

---

## 4 · What to find out — three strands

### Map it
Trace every connection: file to agent, agent to skill, claim to artifact, hook to rule, workflow
to script. Find every dangling reference, in both directions — a doc naming something absent, and
something present that nothing names. The second half matters: a mechanism nobody invokes is this
repo's most-repeated defect.

### Falsify it
Hunt misleading and false information. Specifically: statements that read as enforcement while
nothing checks them; numbers that have drifted; two documents describing one thing differently.
Precedent — this repo has already found a claim that was **green while its assertion was false**
(#90), a check that **could not fail on CI** (#69), and a change that **hid the primary row of the
primary table while passing all 25 blocking checks** (#92).

### Challenge it
Argue against the design, not just the implementation. What assumptions has nobody examined? Where
would this break under a real product deadline rather than self-work? What do other agent harnesses,
papers, or open-source systems do differently — and is any of it better? What is missing entirely
that a fresh expert would add on day one?

**And trace it end to end:** could a person actually take this to a new project tomorrow? Walk the
real path from "I have an idea" to "shipped," and report where it stops. Note that `.mcp.json`
contains exactly one server — Playwright. GitHub, Supabase and Vercel connections were asked for on
day one and do not exist.

---

## 5 · How to work here

**Verify, never believe.** Every deliverable gets checked by reading the branch, running the
command, or diffing the file. **Five lanes across recent sessions reported "available" with
finished work uncommitted on disk** — an idle agent and a finished agent emit the identical signal
in this runtime. Ask; do not infer.

**Construct the failure first.** A test that cannot fail proves nothing.

**State what you did not cover.** Every verdict names its own limits. That is the only reason the
numbers in this repo are worth believing.

---

## 6 · Traps — every one of these cost real time

1. `bun install --frozen-lockfile` in `mission-control/` **before** any measurement, or the ledger
   reads 8 would_block instead of 5 and three claims look like regressions. This has produced wrong
   readings five times.
2. Never restore a file using the git discard form that takes a path separator — the safety hook
   blocks it, correctly. Use `git stash`.
3. Never `WARROOM_EVENTS=$(mktemp)` — mktemp *creates* the file, the run log reads present-but-empty,
   and every resolver silently files as "silent". Use a path inside `$(mktemp -d)`.
4. `CODEBASE-MAP.md` is generated from disk **and the ledger** — regenerate with `npm run build:map`
   **last**, after all file changes, or CI goes red. This caught four lanes.
5. Worktrees belong at `<project-root>/.worktrees/<lane>`. Writes outside the project root are
   refused by the hook.
6. The repo is registered under two path casings (`agentvibe` / `Agentvibe`). macOS sees one
   directory, git sees two worktrees. It is why some refusals look arbitrary.
7. Known flakes — do NOT chase and do NOT loosen a budget to silence: `crosscheck.test.ts`
   "claim counts by verdict", and `c-mission-control-cold-start` (wall-clock, load-gated).

---

## 7 · Baselines — measure against these

```
npm run check                                  exit 0
node scripts/ledger.mjs verify                 83 pass · 5 would_block · 0 block
node .claude/hooks/schema-lint.js              18 pass · 0 fail · 0 warnings
node .claude/hooks/session-start.js | wc -c    2941   (budget 4096)
```

The 5 would_block contain **zero real defects**: two are one deliberate canary (`example.invalid`,
deliberately expired, proving a resolver reports `unresolved` rather than passing — **do not
"fix" it**), and three are `verified_by: judge` claims with empty panels, structurally unresolvable
without a second model family.

---

## 8 · Open, and why

- **PR #77** — BLOCKED by the gate. 79 agents, 18 confirmed findings, 4 P1. The gate found the
  feature **could never have worked**: the record is keyed to a HEAD SHA that stops existing the
  moment the record is committed. 13 tests were green; the judge named why they missed it —
  *"the current suite never commits."* Rework, do not abandon: binding a verdict to a hash of the
  reviewed diff is the right primitive.
- **#95**, **#96** — described in §3.

---

*Written by ceo, 2026-08-20. Every figure measured, not recalled. Where something was not
measured, it says so.*
