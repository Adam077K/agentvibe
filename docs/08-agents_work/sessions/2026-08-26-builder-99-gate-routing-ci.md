---
date: 2026-08-26
role: builder
task: 99-gate-routing-ci
qa_verdict: PASS
tier: full
engines: [builder]
claims_touched: []
---

# `--abbrev-ref HEAD` returns "HEAD" on a detached checkout, and the router refuses that ref

**Cause, proven not assumed.** CI run 32943661820 failed `test:run-gate` 85 pass · 2 fail, both
`Unexpected end of JSON input`. `ci.yml` triggers on `pull_request`, where `actions/checkout` checks
out the merge commit in **detached HEAD**; `git rev-parse --abbrev-ref HEAD` — used by exactly those
two tests, and nowhere else in the repo — then returns the literal `HEAD`, so the ref became
`origin/main...HEAD`, which `run-gate.mjs` refuses at exit 2 with an empty stdout.

**The shallow-clone hypothesis is dead.** `ci.yml`'s only job already sets `fetch-depth: 0`, and a
detached clone with `origin/main` present reproduces the failure exactly — 85 pass · 2 fail, same
two tests. Depth was never the variable.

**Fix.** The precondition, not the assertion: the tests now create a per-pid branch at HEAD, assert
it points there, and delete it in `t.after` — a symbolic tip that exists whether or not HEAD is
attached. Nothing skips on CI. The `json()` helper no longer parses blind; empty or non-JSON stdout
now fails naming the command, cwd, exit code and the stderr reason the script already wrote.

**Verification.** Detached-HEAD clone: 87/87 (was 85/2). `npm run check`: `Tally: 30 of 30 passed`
in this tree, `44 of 44` at the session root. Non-vacuity: breaking `pinRefTip` to emit the tip
verbatim turns both tests red on the right assertion, and reverting the precondition half alone
yields the new diagnostic instead of the parse error.
