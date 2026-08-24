---
date: 2026-08-24
role: builder
task: test-fixture-seam
branch: fix/test-fixture-seam
tier: full
qa_verdict: REVIEWED-PASS-GATE-NOT-RUN
gate_run: "attempted 2026-08-24 — BLOCKed on its own oracle, twice"
gate_blocked_by: "npm run check does not pass on main — check:mc fails on mission-control/test/stream.test.ts:249 (EADDRINUSE), deterministic in isolation; zero mission-control files in this diff"
review_rounds: 1
deviation_authorised_by: founder, 2026-08-24
---

`npm run check` — the binding gate's own oracle — could not pass in an armed session: `skill-clamp.test.mjs` wrote
fixtures into `.claude/agents/` and `check-registration.test.mjs` into `.claude/hooks/`, both EPERM under the sandbox
armed by #94, so the gate BLOCKed on its oracle for every diff before any reviewer ran. CI was unaffected (unsandboxed).
Both now build in a throwaway root under `os.tmpdir()` — schema-lint resolves `REPO_ROOT` from `cwd`, check-registration
from `import.meta.url`, so a copy in tmp checks the copy — with no production change and no assertion weakened. Two
strengthenings fell out: the symlink case was **vacuous** (the clamp read is gated on `MANIFEST.json` membership, which a
runtime fixture never has) and now carries a registered name plus a positive control; and the registration copy is built
from the tracked-file list with its own index, so `tracked()` is live rather than empty. Durable half:
`protected-write-tripwire.cjs`, preloaded by all 25 `node --test` steps of `npm run check`, refuses any write into
`.claude/{agents,hooks,skills}`. Red-then-green shown for all three (disarm the symlink guard → canary leaks; disarm the
clamp rule → 6 fail; strip one preload → the wiring case names it). 29 of 30 `check` steps pass; only `check:mc` fails.

**This PR unblocked the gate's first layer and the gate still could not run.** Before it, `npm run check`
could not pass in an armed session at all, so the oracle BLOCKed every diff before dispatching a
reviewer — `.qa/verdicts/` was empty, no gate run had ever completed in this repo. After it, 29 of 30
steps pass; the remaining failure is a pre-existing mission-control SSE test this diff does not touch.

**A shipped test was vacuous, and that is the finding worth keeping.** `skill-clamp`'s symlink case
asserted the absence of a leak nothing was attempting: the clamp read is gated on `MANIFEST.json`
membership, which a runtime-planted fixture never has, so `schema-lint.js`'s `if (!live.has(s)) continue`
short-circuited before the guard was reached. Confirmed independently by a four-cell experiment holding
manifest-registration and guard-presence independent: with the fixture unregistered, deleting the guard
changes nothing. The fix restored a guarantee rather than relocating fixtures.

`qa_verdict` is deliberately NOT `PASS` — no gate run produced one.
