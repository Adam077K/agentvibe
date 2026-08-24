---
role: builder
task: worktree-ci-sandbox-docs
date: 2026-08-24
branch: fix/pr1-sandbox-worktree-ci
tier: irreversible
qa_verdict: SELF-CHECKS-PASS-NO-INDEPENDENT-REVIEW
gate_run: false
gate_note: "Deterministic checks run individually and recorded below. No reviewer dispatched and no verdict bound to this diff — a builder cannot pass its own work. Independent review and the gate are the lead's to run."
---

# Session — worktree protocol, CI wiring, sandbox findings

Closed REQUIRED follow-ups (a) and (b) from `docs/08-agents_work/handoffs/2026-08-25-after-the-gate-ran.md`.

**(a)** `builder.md`, `designer.md` and `worktree-isolation-pattern/SKILL.md` now teach
`PROJECT_ROOT=$(git rev-parse --show-toplevel)` with the honest caveat that the command still exits 128
under the armed sandbox; `schema-lint.js` requires the new literal instead of the superseded one. Bodies and
predicate moved in one commit — separately, `lint:agents` goes 0 warnings to 2. Still **18 pass · 0 fail · 0 warnings**.

**(b)** `ci.yml`'s gate-logic step ran the test runner directly, unpreloaded; it now runs `npm run test:gate`.
`test:protected-write` had **zero** hits under `.github/` and is now the first check step. Measured: 25
tripwire-preloaded scripts, **16 direct / 7 transitive / 2 unreached** before, **18 / 7 / 0** after;
`grep -c 'node --test' .github/workflows/ci.yml` 1 → 0.

**(c)** SANDBOX.md: both `allowWrite` acceptance questions closed FAIL, with Finding 3 (agent-config paths
are unexemptable by vendor design), Finding 4 (`unable to unlink old` — why a session worktree cannot sync;
`excludedCommands` noted, not applied) and Finding 5 (no inbound/loopback setting; `check:mc` measured
first-hand at **344/1 sandboxed vs 345/0 unsandboxed**, a denied `bind()` with `errno: 0`).

Verified individually, all exit 0: `lint:agents` · `test:gate` (30) · `test:protected-write` (6) ·
`check:registration` · `check:map` · `check:manifest` · `check:curation` · `check:ledger` (83 pass · 5 shadow · 0 block).
**Left undone, out of scope:** CLAUDE.md still says these three files are deliberately unchanged, and the
skill's frontmatter `description` still says "main-repo-root" (changing it requires regenerating MANIFEST.json).
