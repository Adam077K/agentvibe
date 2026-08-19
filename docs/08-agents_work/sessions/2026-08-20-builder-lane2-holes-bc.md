---
date: 2026-08-20
role: builder
task: lane2-holes-bc
branch: fix/gate-ref-and-hook-fp
worktree: .worktrees/lane2-holes-bc
qa_verdict: PASS
tier: full
---

Fix B and Fix C for issues #95 and #96.

Fix B: run-gate.mjs emitted origin/main...HEAD by default. HEAD resolves in the
workflow cwd, not the caller's. Pasting into a different session reviewed the wrong
diff (PR #77, 2026-08-17). Replaced with resolvedRef() that calls git rev-parse HEAD
and emits origin/main...<sha>. Also refuses --ref args containing bare HEAD at exit 2.
Three new tests (all RED-first, now GREEN). 16 run-gate tests total, all pass.

Fix C (issue #96):
- C1: git checkout --detach, --track, --orphan were alleged false positives. Verified
  the current predicate (--\s+) never matched long options. Added 5 regression tests
  pinning correct behaviour so any future widening fails loudly.
- C2: heredoc-body false positive is unfixable without a shell parser. Documented in
  hook source with escape hatch (Write tool checks file_path only, not content).
  Pinned as BLOCK with a test that names the escape hatch.
- C3: Write refused /private/tmp/claude-<uid> while Bash wrote there freely. Sandbox
  (PR #94) explicitly grants that path. Added UID-scoped scratchpad root to the allowed
  list, unchanged .claude/plans exemption. 3 new tests (C3 ALLOWS was RED, now GREEN;
  two boundary tests confirm the exemption is narrow). 158 pre-tool-use tests, all pass.

Verification: node --test scripts/run-gate.test.mjs -> 16 pass, 0 fail.
             node --test scripts/pre-tool-use.test.mjs -> 158 pass, 0 fail.
             npm run check -> exit 0.
