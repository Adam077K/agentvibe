---
date: 2026-08-11
role: ceo
task: warroom-backup-mode
tier: lite
qa_verdict: PASS
status: Complete
---

# Session Log: CEO — Live install, and the bug it found

**Phase 2's gate is met.** The founder ran the install; `~/bin/agentvibe` is now a 7-line shim over
`~/.warroom/bin/warroom`, and the original 2,765-line launcher is backed up.

**Live verification:** all 6 read-only commands are byte-identical — output *and* exit code — between the new
installed launcher and the backed-up original. That is the real gate, measured after the swap rather than
predicted before it.

## The bug the real install found

The first parity run after installing reported all 6 commands failing with exit 126. They were not parity
failures: every one was `permission denied` **on the backup**. `fs.writeFileSync` does not preserve the
executable bit, so backups were stored 0644 — a backup of a launcher that cannot itself be executed.

Rollback still worked, by luck: `copyFileSync` truncates an existing destination in place, so the shim's 0755
survived. Had the origin been deleted first, restore would have produced a non-executable launcher.

Fixed: `backup()` records and applies the source mode; `rollback` reapplies it and prints it. Older manifest
entries have no `mode`, and are handled by leaving the destination's mode alone — the behaviour that
accidentally saved the first install.

Verified end to end: backup stored 0755, executable, runs directly; rollback restores content and mode.

**The lesson worth keeping:** six safety guards were each verified by executing their failure in a sandbox,
and all six passed. The bug was in the path nobody thought to assert on — whether the artifact those guards
produce is *usable*. Testing that a backup is *taken* is not testing that it can be *restored*.

---

*Session by: ceo | 2026-08-11*
