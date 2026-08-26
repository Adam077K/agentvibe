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

**Verification.** Detached-HEAD clone: 87/87, before the fix 85/2. After merging `main` in (the
remote branch had moved): `Tally: 43 of 43 passed · 0 failed`, and the same 43 of 43 at the session
root. Non-vacuity: breaking `pinRefTip` to emit the tip verbatim turns both tests red on the right
assertion, and reverting the precondition half alone yields the new diagnostic, not the parse error.

**Do not measure at the session root while other lanes run.** A first reading there said `44 of 44`;
re-run twenty minutes later on the same clean commit it is `43 of 43`, and `scripts/lib/check-suite.js`
is byte-identical to this tree's. The root is shared with the other lanes of this session and one of
them was mutating it. Derive the denominator in the tree under measurement.
