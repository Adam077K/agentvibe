---
date: 2026-08-24
role: builder
task: test-fixture-seam
branch: fix/test-fixture-seam
tier: full
qa_verdict: PENDING
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
