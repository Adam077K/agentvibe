---
date: 2026-09-01
role: builder
task: w24-exit-test-memory-budget-unreadable
tier: full
qa_verdict: PASS
branch: feat/memory-budget-unreadable
base: e8c8ae5
---

# builder — the memory-budget checker refused a stack trace where it promised a name

**What.** `scripts/check-memory-budget.mjs` guarded both of its read sites on KIND (`statSync` via
`entryKind`) and then read them bare. `stat(2)` needs no read permission, so a **regular file at
mode 0000** passed the kind guard and threw raw `EACCES` out of `readFileSync` — at `:316`
(`loadMemoryFile`) and `:332` (`archiveVolumes`) — where the file's own header reserves `problem`
for *"present, and nothing could be read from it"* and the volume loop's comment promises *"a named
refusal, not a stack trace"*. Third member of the class whose directory / FIFO / dangling-symlink
members were already closed; the one `stat` was always going to miss.

**Measured before any change**, `origin/main` e8c8ae5, uid 501, one bad entry per constructed tree:
both arms → `Error: EACCES`, unhandled, stack trace, exit 1, naming no memory file. Controls: a
healthy fixture exits 0; a DIRECTORY at the same path still produced the named
`memory-file-not-a-file` refusal, so the named-refusal path existed and simply did not cover this.

**Change.** One `readGuarded(abs)` — the read IS the test, because `EPERM`, `EIO`, `ELOOP` and
`ERR_STRING_TOO_LONG` reach the same place and an `access(2)` pre-check would answer only `EACCES`
while adding a TOCTOU window. Two new failure codes, `memory-file-unreadable` and
`archive-volume-unreadable`, because reporting an unreadable regular file as `*-not-a-file` is a
false statement about it and the remedies are opposite (restore permission vs move something aside).
An unreadable volume reports `bytes: null`, never `0` — a consumer seeing 0 would report 40,000
bytes of room in a file it never read.

**Verification.** `npm run test:memory` — **40 pass · 0 fail** (was 35). Mutation table: the fixed
subject swapped for `origin/main`'s and the same suite re-run gave **36 pass · 4 fail**, exactly the
four new cases, with the `CONTROL: the guard does not fire on a readable file` case staying green —
a mutation that must NOT fire. Subject read back after each swap (`readGuarded` 3 → 0 → 3),
`git status --porcelain` 0 lines. `node --check` on both files. Root skips itself with a stated
reason: as root `chmod 000` does not deny reads, and each case asserts the denial holds first.

**Tier `full`, by command:** `git diff --name-only origin/main..HEAD | node scripts/classify.mjs
--stdin` → `floor=full (scripts/check-memory-budget.mjs → scripts/**)`. `full` does not demand the
multi-judge panel, so this item's tier is satisfiable here. The standing caveat still applies: this
PASS is author-recorded against a deterministic floor, one agent, one model family — *the checks ran
and are green*, not *a panel judged it*.
