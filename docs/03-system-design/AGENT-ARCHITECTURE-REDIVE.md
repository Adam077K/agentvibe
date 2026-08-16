# Agent Architecture Re-dive — the plan

**Owner:** ceo · **Written:** 2026-08-14 · **Repo state:** `origin/main` = `30f6c35` — **Phase 8a complete**,
all five PRs merged

The roster was never designed. It was **derived by subtraction** — 26 agents collapsed to 6 engines in Phase
4b because 26 files contradicted each other, not because six is right for the work. Nobody has asked what
agents the system actually needs. This plan asks it, and derives the answer from real work rather than from
tidiness.

Scope, in the founder's words: *what types, permissions, jobs, tasks, tools, layers, orchestration system,
decision making, thinking, critical thinking for the best outputs.*

---

## 1 · Three corrections that change the answer

Established during the boards of 2026-08-13/14. Each invalidates analysis already on disk, so the re-dive
starts from these rather than rediscovering them.

### 1.1 Token cost is not a constraint

**This project runs on a Claude Max $200 subscription, not metered API billing.**

That retires a large amount of existing analysis: the rethink board's `~$553/active working day`, and the
whole of `IMPLEMENTATION-PLAN.md` Phase 2 — dollar ceilings, model routing to reduce spend — were computed at
API list rates and do not describe this project's economics.

What is actually scarce, in order:

| Scarce | Why it binds |
|---|---|
| **Rate-limit headroom in the rolling 5-hour window** | The subscription's real ceiling. This is what the deleted budget guard measured — right instrument, wrong numbers |
| **Wall-clock time** | A 3-hour board run costs 3 hours of the founder's day whatever the tokens cost |
| **Context** | 1M is large and still finite; what reaches an agent decides what it can do |

**The rule that follows: always use the most capable model that fits the job.** Never downgrade for cost. A
cheaper model earns a slot only where it is genuinely as good *and* faster, or where it protects rate-limit
headroom a heavier model would burn for no quality gain.

### 1.2 The roster is pinned to a superseded model generation

19 declarations name `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`. Zero name the Claude 5
family. `CLAUDE.md`'s table is headed *"Models (May 2026)"*.

Current, per the `claude-api` skill — authoritative; never answer model questions from memory:

| Model | ID | Context | Notes |
|---|---|---|---|
| Claude Opus 5 | `claude-opus-5` | 1M | Strongest on agentic coding and long-horizon work. Thinking **on by default**; disabling it is capped at `high` effort. Prompt-cache minimum 512 tokens |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | Near-Opus on coding/agentic. New tokenizer: ~30% more tokens for the same text |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200K | Fast, narrow work |
| Claude Fable 5 | `claude-fable-5` | 1M | Most capable; always-on thinking; 30-day retention required |

Three capabilities the repo has no concept of, all roster-shaped:

- **`effort`** (`low`·`medium`·`high`·`xhigh`·`max`) — depth per call. The repo tiers only by model. `xhigh`
  is documented for coding and agentic work; `low` for lookups. With cost off the table this is a **quality
  and latency** dial, not a savings one.
- **The advisor tool** — a cheaper executor consults a more capable advisor mid-turn. A roster relationship
  the flat six-engine design cannot express.
- **Multiagent rosters** — a coordinator delegating to named agents in one session, threads sharing a
  filesystem but not a context. Closer to what the war room does by hand.

### 1.3 The orchestration topology rests on a false premise

The CEO's own operating instructions state: *"RUNTIME CONSTRAINT: subagents cannot spawn subagents (nested
Task is blocked). Chiefs therefore return dispatch packets; YOU do the spawning."*

**That is false, and it has been measured false twice.** `docs/08-agents_work/sessions/2026-08-13-probe-nested-spawn.md`
records a subagent spawning a child successfully: *"No block, no denial, no error. Nesting is NOT blocked in
this runtime."* `c-runtime-nested-spawn` was **Refreshed** on that evidence in PR #29.

The **entire T2 dispatch-packet tier** — the default tier, the one that routes most work in this system —
exists to work around a constraint that does not exist. A chief returns a paste-ready packet instead of
dispatching, and the orchestrator becomes a message bus for work it is not doing. Every handoff through that
bus is a place context is dropped and a turn is spent.

**A2/A5 must re-derive the topology from what the runtime actually permits, not from this sentence.** Whether
depth-2 dispatch is *desirable* is a real design question — blast radius, observability, who owns the QA gate
— but it must be argued on its merits, not assumed away.

### 1.4 Two corrections to earlier findings — do not carry these forward

Recorded because both appear in prior session files and would otherwise be inherited as fact.

**Retracted: "a read-only agent disarmed the permission model."**
`2026-08-14-ceo-safety-floor.md` reports that `.claude/settings.json` was edited at 23:42 mid-board to remove
`budget-guard.js`, and concludes the read-only binding does not hold. **It was PR #29** (`5290edd`,
2026-08-13 23:40:07 +0300) — a founder-instructed, `tier: irreversible`, reviewed and merged change, landing
two minutes before the mtime that was read as an intrusion. There was no escape.
`c-read-only-binding-unverified` **remains genuinely unprobed** and its 2026-09-08 waiver stands.

What survives the retraction is weaker and still worth A3's attention: every read-only agent holds `Bash`, so
the boundary is *asserted* by tool grant and *unenforced* underneath. That is a gap in the argument, not an
observed breach — and A3 must not be briefed as though a breach occurred.

**The budget ceiling is gone, deliberately.** `budget-guard.js` is unregistered as of PR #29 — it fired on
every tool call with no matcher, blocking the CEO mid-session, a builder before its first commit, and a probe
writing its own report. The file and its tests remain; one line reverts it. **Consequence for §1.1: the
scarcest resource now has no mechanism at all**, and stop condition 3 is unenforced. A2 owns the replacement
question — what *should* bound a session, given the binding resource is rate-limit headroom rather than
dollars.

---

## 2 · What the board must produce

Not findings. A **roster specification** precise enough to implement:

1. **The agent set** — each with: purpose, the jobs it owns, model and effort, tools and MCPs, its permission
   boundary and what enforces it, what it may decide alone, when it escalates.
2. **The topology** — who dispatches whom, how deep, how work hands off, how state survives a handoff.
3. **The job model** — how a unit of work is specified, decomposed, assigned, tracked, closed.
4. **The decision system** — how a decision is made, recorded, found again, contested, superseded.
5. **The thinking system** — the mechanisms producing critical thinking rather than agreement.
6. **A migration path** from 6 engines + 11 shims, naming what gets deleted.

---

## 3 · The board

Fourteen specialists, two hostile critics per spec, then synthesis. Read-only throughout.

### Round 1a — derive the roster from real work (5)

Each walks one **real venture process** end to end and reports the roster that process actually demanded:
step by step, who does each step, what they need, where a generalist with a lens suffices, and where it
genuinely does not.

| | Process |
|---|---|
| **P1** | **Ship a feature** — request → spec → build → review → merge → deploy → verify |
| **P2** | **Build a customer-facing surface** — brand → design → implement → visually verify → ship |
| **P3** | **Go to market** — position → price → write → launch → measure |
| **P4** | **Research and decide** — question → evidence → options → decision → record → resurface later |
| **P5** | **Operate and improve** — incident, regression, metric drift, and the system improving itself |

### Round 1b — the cross-cutting architecture (9)

| | Layer |
|---|---|
| **A1** | **Agent taxonomy** — what *kinds* exist and why. Is 6 right? Defend the number against what P1–P5 demand |
| **A2** | **Model and effort tiering** — which model, which effort, for which job, on the Claude 5 family, cost off the table |
| **A3** | **Permissions and containment** — what *binds* an agent, given §1.4: today the boundary is asserted by tool grant and unenforced underneath. OS sandbox vs hook vs tool grant vs managed sandbox |
| **A4** | **Tools, MCPs, CLIs** — the real capability surface per agent, and how a vanished capability fails loudly |
| **A5** | **Layers and topology** — depth, fan-out, handoff, coordination, and what the war room's panes map onto. **Start from §1.3:** nesting is not blocked, so re-derive the tiers rather than inheriting T1–T4 |
| **A6** | **The job model** — how work is specified, split, assigned, tracked, resumed, closed |
| **A7** | **Decision-making** — `DECISIONS.md` has no `id`, no `Supersedes`, no `Status`, is not injected at session start, and sits ~2 days from its unenforced 50-entry cap |
| **A8** | **Critical thinking and anti-sycophancy** — mechanically. Name what *fails* when an agent agrees by default |
| **A9** | **Context and memory** — what each agent knows on arrival, accumulates, and can retrieve later |

### Round 2 — hostile critique

Two per spec, mandated to attack:

- **Feasibility** — will the mechanism work, or is it another guard reporting success about what it did not
  measure? Open the files. Check the effort estimates.
- **YAGNI** — which steps are mechanism for its own sake, the failure mode this repo names as its worst? What
  should be deleted instead of built?

### Round 3 — synthesis

One `framer` produces the roster spec, the topology, the migration path, and the decisions only the founder
can make.

---

## 4 · Non-negotiables

Earned in the two prior boards.

- **Read-only must name its enforcement.** Not because it was breached — it was not, see §1.4 — but because
  nothing underneath the tool grant would stop a breach, and `Bash` is granted to every read-only agent.
- **A runtime constraint is a measurement, not a sentence in a prompt.** §1.3 is the cost of the alternative:
  a design tier built on an unverified assertion, load-bearing for months.
- **~~Turn caps must fit the job.~~ CORRECTED 2026-08-14 — `maxTurns` does not bind at all.** I claimed
  `reviewer`'s `maxTurns: 20` truncated ten finders. Measured against the corpus: **196 of 269 `reviewer` runs
  exceeded 20 turns, maximum observed 68.** The cap never fires, so it explains nothing and raising it would
  have fixed nothing. What *does* bind is `effort` — and `claude-sonnet-4-6`, pinned in all five
  producing/reviewing engines, is hard-clamped to `high` and cannot reach `xhigh` (A2). **The real cause of
  those empty returns is still unknown and is now an open question**, not a solved one.
- **Silent empty returns must be impossible** — whatever causes them. Exhaustion or failure that reads as
  success is the repo's named defect class, and I reproduced it by mis-diagnosing it: a wrong cause, asserted
  confidently, closed the investigation.
- **Every guard needs a second, independent barrier** — `PHASE-8A-HANDOFF.md §0`.
- **Prefer deletion.** This repo's biggest wins were subtractions.
- **Cost arguments are inadmissible** — §1.1. Rate-limit headroom, latency, and context pressure are
  admissible and should be argued explicitly.

---

## 5 · Execution constraints

- **Read-only.** No writes outside the two output files.
- **`mission-control/` is now readable and should be read.** Phase 8a closed at `30f6c35`; the parallel team
  is done. Seven views, ~2,000 sessions and 19 projects of real observability — A5 and A6 should treat it as
  evidence of what the system actually does, not as a no-go zone. Still do not *write* there.
- **Editing files that carry claim blocks is now safe.** The index no longer records `source_line`, so
  prose edits to `PHASE-8A-STATUS.md`, `mission-control/README.md`, `CLAIM-LEDGER.md` and
  `ledger-canary.md` no longer fail `ledger build --check`. Changing a *claim* still does, by design.
- **Never edit generated files** — `.claude/ledger/index.json`, `CODEBASE-MAP.md`.
- Sync to `origin/main` before starting; re-check at synthesis.
- Use `Explore` for finders — read-only by tool grant, and free of `reviewer`'s 20-turn cap.

## 6 · Deliverables

- `docs/03-system-design/AGENT-ARCHITECTURE.md` — the roster spec.
- `docs/08-agents_work/sessions/2026-08-14-ceo-agent-redive.md` — session file.

## 7 · Verification

1. `git status` — clean apart from the new files; nothing under `mission-control/` modified.
2. `npm run check` exits 0 after `bun install` in `mission-control/`.
3. `node scripts/ledger.mjs build --check` exits 0 — no claim line numbers moved.
4. Every proposed agent names its model, effort, tools, permission boundary, **what enforces that boundary**,
   turn budget, and escalation path. An agent missing any of these is not specified.
