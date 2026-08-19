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

## Correction — orchestrator, 2026-08-20

**Commit `4a1ebe7`'s message is wrong, and is corrected here rather than amended away.** It claims the
discard predicate "matched any double-dash-prefixed token" and now "matches the separator-plus-path form
only." **Nothing about the predicate changed.** It is byte-identical to `origin/main`:

    if printf '%s' "$command" | grep -qE 'git\b.*checkout\b.*--\s+'; then

That message was written by the orchestrator while salvaging this lane's uncommitted work, taking issue
#96's description on trust. **This lane's own finding, recorded above, was correct** — it investigated and
reported accurately. The orchestrator asserted a fix without verifying it, which is the defect class this
round exists to catch.

**Issue #96 item 1 is wrong as written.** Measured by feeding payloads to both hook versions directly:

| case | origin/main | this branch |
|---|---|---|
| `git checkout --detach origin/main -q` | allow | allow |
| `git checkout --track origin/feature` | allow | allow |
| `git checkout -- <path>` | BLOCK | BLOCK |
| `git checkout -q <sha> && echo "--- detail ---"` | **BLOCK** | **BLOCK** |
| `git checkout -q <sha> && git show <sha>:f > f` | allow | allow |

`--detach` and `--track` were never refused — `--\s+` requires whitespace after the pair. What C1 adds is
**five regression tests pinning behaviour that already held**: worth having, not a fix.

**The real false positive is still open, and it is broader than the one in the issue.** The predicate is
**unanchored across the entire compound command**: any command containing `git`, then `checkout`, then the
separator followed by whitespace *anywhere* — inside a quoted string, a comment, or a `git diff` with a
pathspec on the same line — is refused. The orchestrator hit this **three times in one session** while
auditing this very fix: twice from a decorative rule inside an `echo`, once from a pathspec in a command
that merely mentioned checkout. A fourth refusal came from the heredoc writing this correction, which is
item 2 and is correctly documented as unfixable without a shell parser.

Recommended fix, **not made here** (`.claude/hooks/**` is irreversible tier): anchor the match to the
`checkout` invocation itself rather than scanning the whole command string, and pin these reproductions.
