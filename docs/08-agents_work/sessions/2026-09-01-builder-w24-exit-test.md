---
date: 2026-09-01
role: builder
task: w24-exit-test-memory-budget-unreadable
tier: full
qa_verdict: PASS
branch: feat/memory-budget-unreadable
base: 32b3c72
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

---

## Round 2 — the #128 review round. Four findings closed, three p3s answered.

Merged `origin/main` `32b3c72` in first (never rebased). Intersection of `merge-base..HEAD` with
`merge-base..origin/main`, both filtered of `.qa/`: **EMPTY**, operator control on inputs known to
intersect returned `b`, positive probe on my arm 1, negative probe on the base arm 0. The base move
touched `scripts/verdict.mjs`, which is what computes the subject, so the verdict is re-recorded here
rather than argued about.

**F3 — the refusal was instructing the operator to disable the check.** `archive-volume-unreadable`
ended *"or rename this entry so it no longer matches `ARCHIVE_VOLUME_RE`"*, inherited verbatim from
`archive-volume-not-a-file` where it is sound. Measured, one fixture, three states: a 50,013-byte
volume → `decisions-archive-byte-overflow`; the same file at mode 000 → `archive-volume-unreadable`;
**renamed with the mode restored → PASSES, exit 0, 50,013 bytes still on disk.** The clause is deleted
from the unreadable arm only, and a `CONTROL: the rename advice SURVIVES where it is sound` case keeps
it on the sibling — a directory holds no cappable content, so a rename there loses nothing.

**F2 — a file 13,631× over its cap was refused as a permissions problem.** Reproduced with a sparse
545,259,520-byte `DECISIONS.md` (`MAX_STRING_LENGTH` derived, 536,870,888): the remedy said *"restore
read permission"*. `entryKind` now carries `st.size`, `readGuarded` returns the `code` separately from
its prose, and `unreadableRemedy(code, size, byteCap)` branches: the size arm names the byte count,
the runtime limit, the multiple of the cap, says **SIZE PROBLEM AND NOT A PERMISSIONS ONE**, and points
at `evict-memory.mjs`. **I did not make `decisions-byte-overflow` fire from `st.size`** — that would be
a second implementation of the one cap check, disagreeing with the first the day someone changes how
bytes are counted, which is the defect class this repo names most often. **The code stays one and only
the remedy branches:** `EACCES` and `ERR_STRING_TOO_LONG` leave the checker in the identical state
(present · regular · nothing read · `bytes: null`), so a third code would split one state by its cause.
`LONG-TERM.md` is passed no `byteCap` — it is held to a line cap, and quoting a byte budget it does not
have would be the checker inventing a rule.

**F1 — the comment named a member that cannot reach the guard.** Measured with a self-referential
symlink: `statSync` throws `ELOOP` inside `entryKind`, which refuses first (`unresolvable (ELOOP)`);
at the fixed paths `existsSync` returns **false** for that shape, so it lands on `missing-file`.
**Neither route enters `readGuarded`** — the brief named one route, there are two. The conclusion
survives on `ERR_STRING_TOO_LONG` alone, which is measured to reach it and carries no errno and no
syscall, so an `access(2)` pre-check misses it entirely while adding a TOCTOU window. `EPERM` and
`EIO` are now explicitly **not asserted** rather than listed beside a verified member.

**F4 — a principle applied to one of two sites.** `--json` emitted `"bytes": 0, "entries": 0` for an
unreadable `DECISIONS.md` beside its `problem`. Both are `null` now, as is `parse_ambiguous` and
`long_term.lines`, and the pre-existing directory/FIFO false zeroes go with them. `unreadable` now
reaches `--json` on each volume, so a consumer no longer has to string-match `problem` to recover the
distinction the two stderr codes encode.

**p3 (root skips) — answered with a refusal, not a count.** Ten cases carry `skip: AS_ROOT`, and as
root the suite reported `0 failures` having measured nothing. A new always-running case asserts
`AS_ROOT === false`. Exposure measured, not assumed: `ci.yml` is `ubuntu-latest` and
`grep -nE '^\s*container:' .github/workflows/*.yml` returns **nothing** — a bare `grep container`
returns **two PROSE lines**, which is why the key form is what is quoted.

**Verification.** `npm run test:memory` **51 pass · 0 fail · 0 skipped** (was 40). Two mutation cells:
against the #128 checker at `1a5cbb7`, **44 pass · 6 fail** — exactly the six behaviour-pinning cases,
with the four premise/control cases staying green. **M8 REDUX:** the reviewer's own mutation — the
`archive-volume-unreadable` remedy replaced with `"reboot the mainframe."` — produced **zero** red
before this round and **2 failures** now. Subject read back at every swap (`unreadableRemedy` 3 → 0 →
3, `reboot` 1 → 0), `git status --porcelain` 0 lines each time. F1 has no reddening cell **and cannot
have one**: it corrects a sentence about behaviour that did not change. Its case pins the measured
behaviour instead, so a future change routing `ELOOP` through the read guard goes red.
