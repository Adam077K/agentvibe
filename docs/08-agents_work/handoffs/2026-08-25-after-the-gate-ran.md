> **HISTORICAL — superseded by [docs/STATUS.md](../../STATUS.md).** Retained for the record.
> Read STATUS.md for current state; nothing here is a live instruction.

# Handoff — the gate can complete now, and the review layer is carrying everything

**From:** ceo (`ceo-1-1787566829`) · **Date:** 2026-08-24 · **Base:** `main` = `b72042a`

---

## 1 · What changed

**`main` moved `695800e` -> `b72042a`, five PRs, split by TIER rather than topic** so irreversible files
paid the expensive gate once instead of four times. That split was the largest cost lever measured.

| SHA | What |
|---|---|
| `c0e52dc` | Doc corrections; memory breadcrumb + one eviction (headroom 333 -> 2,941 bytes) |
| `17bba08` | The citation-range checker — the audit's top unbuilt item |
| `60d64b0` | `mcp__*` fabrication hole closed · sweep verifiers bounded · blinding obligation stated |
| `181f153` | Worktree protocol corrected · gate self-review announced |
| `494c95b` | Test fixture seam · protected-write tripwire |

**`npm run check` is 29 of 29 with the sandbox armed, measured at the session root.** It was 26 of 29 at
session start, and the binding gate could not complete at all.

---

## 2 · The gate — first real data

`.qa/verdicts/` was empty. **No gate run had ever completed in this repo.** Two blockers, in layers:

1. `test:skill-clamp` and `test:registration` built fixtures inside `.claude/agents/` and `.claude/hooks/`,
   which the armed sandbox denies — so the oracle BLOCKed every diff before dispatching a reviewer.
   **FIXED** (`494c95b`). Neither test was wrong and neither change that caused it was wrong: arming the
   sandbox (#94) and oracle-first ordering each landed correctly, collided, and nothing watched the seam.
2. `check:mc` fails on `mission-control/test/stream.test.ts:249` — EADDRINUSE despite `port: 0`.
   **STILL OPEN.** Deterministic across two runs and in isolation. Pre-existing; no PR in this series
   touched mission-control. CI is green because it runs unsandboxed. This is the last gate blocker.

Three gate runs, three oracle BLOCKs, **zero reviewers ever dispatched.** Two of those blocks were my own
invocation errors; one was a genuine stale generated file. The oracle-first design works — it refuses for
one agent instead of thirty.

---

## 3 · REQUIRED follow-ups, with exit criteria

**(a) `builder.md` and `designer.md` still teach a command that exits 128.** Step 1 of a builder's
operating procedure is `MAIN_REPO=$(git worktree list …)`, unmarked, and `schema-lint.js:1068` still
REQUIRES that block — `lint:agents` is green only because those files still contain what CLAUDE.md now
calls wrong. Both irreversible tier, which is why PR-5 could not touch them.
**Exit criterion:** a builder reading only its own file gets the correction. Bundle with the lint predicate.

**(b) `ci.yml:77` bypasses the tripwire.** It invokes `node --test .claude/workflows/lib/gate-logic.test.mjs`
directly rather than via `npm run test:gate`, so it runs unpreloaded on a runner. And `test:protected-write`
is not in `ci.yml` at all, so its six assertions never run in CI. 14 of 25 preloaded scripts are named there.
**Exit criterion:** every guarded script reaches CI through its npm script.

**(c) The 64KB silent-truncation pattern.** `process.exit()` does not flush an async pipe write.
`check-dispatch-agenttype.mjs` and `check-dispatch-prompt-size.mjs` use `console.log(JSON.stringify(...))`
then `process.exit()`. Under 64KB today; one is wired into a blocking check.

**(d) `check:mc`'s EADDRINUSE.** The last gate blocker. `port: 0` should never collide — the failure may not
be what it says. Suspect a leaked server from an earlier test in the same file.

---

## 4 · Findings that outlive the PRs

- **5 of 5 subagents went idle without reporting.** Every verdict this session came from chasing. Any design
  needing N reviewers to self-report is unreliable at N=1; the 79-agent panel presumes it works at N=79.
  `Workflow` enforces a return schema at the tool layer; direct `Agent` dispatches have no such contract.
- **`allowWrite`'s `**/.worktrees` entries do not do what they were added for.** `git worktree add` still
  exits 128 there — 32 denials across `.claude/agents/**`, `.claude/commands/**`, `.mcp.json`. This answers
  `SANDBOX.md:229-240`'s "someone must actually run this" and `:250`'s "STILL UNVERIFIED". **Both closed.**
- **The sandbox deny-set is PER SESSION ROOT.** `.claude/hooks`, `.claude/skills` and `.claude/workflows` are
  denied at the session root and writable in a nested worktree. This hid half a finding THREE times, and
  produced four false "regressions" I nearly reported. Always measure at the session root.
- **The push route accepts commits having run 0 of 2 required checks.** Confirmed four times.
- **`c-read-only-binding-unverified` is unresolvable twice over** — empty judge panel, AND its probe protocol
  has only FAIL and UNRESOLVED outcomes. It can never resolve, only expire. Founder decision, not a bug.
- **A shipped test was vacuous.** `skill-clamp`'s symlink case asserted the absence of a leak nothing was
  attempting — gated on `MANIFEST.json` membership a runtime fixture never has. Confirmed by a four-cell
  experiment. Green and meaningless for as long as it existed.

---

## 5 · The process question, answered with this session's numbers

**Six blinded reviews. Four FAIL verdicts. Ten P1s. Not one found by a deterministic check** — every suite
was green on every branch when each review began. The panel was never dispatched.

What the reviews caught: a fail-open path *I ordered into the gate*; a second copy of the verdict arithmetic
left un-synced so `test:gate` pinned the pre-fix behaviour as correct; a linter demotion that moved
enforcement from an irreversible file to a shadow one; a checker reporting `✓ passed` over a dead pointer;
and a documented protocol whose command exits 128.

**Eight defects of mine, every one caught by an agent receiving my instructions, never by me.** Recorded by
number in the session file. The most expensive was an enumeration narrower than the diff it described — the
session's worst P1 lived in the file my list omitted. **The orchestrator's brief is a defect surface nobody
reviews, and it produced errors at a higher rate than the code did.**

**Keep:** one blinded independent pass per diff; deterministic checks; tier-splitting; oracle-first.
**Cut:** sweep rounds and 3-vote verification — no defect in the record is attributable to either.
**Add:** review the brief, not just the diff. Convert recurring findings into scripts — the citation checker
repaid its build cost on first run and has already closed one loop in the wild.

---

## 6 · Next

**One real venture task, end to end.** Founder decision 2026-08-24: fixes this session, venture task next,
no further harness work in between. 110 session files, zero customer-facing work.
