---
date: 2026-08-11
role: ceo
task: rollback-self-heal
tier: irreversible
qa_verdict: PASS
status: Complete
---

# Session Log: CEO — Rollback self-heal, and the testing lesson behind it

I told the founder rollback was safe. It wasn't: it restored their launcher without the executable bit, and
`agentvibe` stopped working. Then the re-install captured that broken state, so a second rollback would have
repeated it.

## Two failures, one root cause

1. **Asserted instead of tested.** I reasoned that `copyFileSync` truncates in place and the destination
   keeps its mode. On macOS Node uses `fcopyfile`, which copies the *source's* metadata — the stored `0644`
   landed on the destination. I wrote "rollback safe → yes" from reasoning about a syscall I had not run.
2. **Fixed forward, not backward.** The mode-preservation fix covered future backups. I extrapolated that the
   pre-fix manifest entry was harmless. It was the one that broke.

## Fix

`warroom` manages exactly two kinds of file and both are executables. Rollback now restores the recorded
mode, then adds `+x` when the result is a shebang script that cannot run, and prints why.

## The lesson worth keeping

**Every guard rail was verified by hand before the first install, and all six passed.** The bug shipped
anyway. The sandbox seeded its launcher at `0755`, so the mode mismatch the bug required was never
constructed — the tests exercised the happy path of each guard and never the artifact those guards produce.

Testing that a backup is *taken* is not testing that what comes out of it *runs*.

11 tests now run against a temporary HOME on every PR, including the exact regression. The mode cases assert
executability of the restored file, not the existence of the backup.

## State

`~/bin/agentvibe` is the shim and works. The founder's original launcher is preserved in two backups; the
newer one records `0644`, and rollback now heals that on restore rather than handing back a broken file.

---

*Session by: ceo | 2026-08-11*
