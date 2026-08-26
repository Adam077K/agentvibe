---
date: 2026-08-26
role: builder
task: 101-gh-absent-fixture
qa_verdict: PASS
tier: full
risk: full
branch: feat/cmd-merge-opens-a-pr
commits: 3
---
# The fixture could not build the condition it tested, and only one machine said so
**The defect.** `gh ABSENT is a refusal` built "gh is absent" by listing `${dir}:${NODE_DIR}:/usr/bin:/bin` — a PATH that omits `/opt/homebrew/bin/gh` (this Mac) and **includes** `/usr/bin/gh` (ubuntu-latest). So the premise was false on the only machine whose verdict blocks a merge: CI run 32943665467 → `not ok 23 … expected: ~ · actual: '/usr/bin/gh'`. Locally it had never proved anything. Third instance of one machine's layout baked into a test: `$HOME/.claude/plans`, a case-folding filesystem (#102), now gh's install path.
**The fix is a construction, not a longer list.** `mirrorWithoutGh()` symlinks the ambient PATH (plus `/usr/bin:/bin:/usr/sbin:/sbin`) into a directory we own, skipping every entry **named** `gh`. A name is removable on every machine; a location is not. Built once per process; earlier sources win, so ambient precedence is preserved. `stubGh` now asserts **both halves** of its premise before any test asserts behaviour — gh resolves to exactly the stub or to nothing, **and** `git`/`node`/`bash` still resolve, so a refusal under it cannot be about a PATH we broke. All 13 stub sites get the guard, not just the absent one.
**Not skipped on CI, and the polarity is why.** The `$HOME` precedent let an unbuildable fixture skip *off* CI because CI still fails loudly there. Here the fixture was unbuildable *on* CI, so a skip would delete the only place the assertion is real.
**The guard is proved able to fail, twice, and neither proof needs this machine to own a gh.** (a) Deleting `if (name === 'gh') continue;` → **38 pass · 3 fail**, `gh ABSENT` red with `still resolves a real gh at …/bin/gh` — the CI failure, reproduced locally, with the cause in the message. (b) Permanent: `the gh-free PATH removes a gh that IS there` plants a gh, **asserts the control directory has one**, then asserts the mirror dropped it and kept `git`/`node`. #102 shipped the opposite shape — a case-INsensitive regex asserting a case-SENSITIVE property, passing while its own premise was false.
**Simulated the runner and it holds.** A `gh` planted at the front of the ambient PATH: **41 pass · 0 fail**. A *sentinel* gh in the same position logging every call: **zero invocations** — no test in the suite can reach a real gh on any machine, which also settles the 15 tests that run `warroom` with no explicit env (the verdict gate precedes the gh check, and `gh.ghArgs() === ''` already pins that ordering).
**Sweep, 41 + 11 tests, mechanically:** one machine-dependent row (this one, fixed). `warroom-install.test.mjs` manipulates no PATH and probes no binary — 11 of 11 hermetic on an isolated `$HOME`. Two residuals reported, not fixed: bare `node`/`git`/`bash` resolution and `#!/bin/bash` in install fixtures — both *required-present*, so they fail loudly rather than passing vacuously, the opposite polarity to this defect.
Verified: `npm run test:merge-gate` → **41 pass · 0 fail** (was 39 · 1 on the runner) · `npm run check` → **Tally: 43 of 43 passed · 0 failed · 104.6s**, run in the branch worktree with `protected-write-tripwire.cjs` preloaded, which is a floor over both locations and so covers the nested-worktree deny-set trap.
