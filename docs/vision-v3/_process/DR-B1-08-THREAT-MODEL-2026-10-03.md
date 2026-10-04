# DR-B1-08-THREAT-MODEL: what the launcher defends against (2026-10-03)

**Source.** The founder ruled by AskUserQuestion on 2026-10-03, and the coordinator relayed the ruling to the
B1-08 test builder for round 7. The builder did not see the exchange. It follows the Opus review that FAILED
build/b1-08 @ 160381f, the implementation on the r6 done-tests at 468548b.

## Ruling

The launcher defends against **workers and bugs**. It does **not** defend against someone who can edit the
launcher's own State directory: that principal already has the Kernel's write access, and a local file cannot
stop it.

## Accepted findings, out of scope

Each is recorded here so that no later round re-opens it as a defect:

1. **The receipt log truncated to its genesis, with `.head` rewritten to match.** The chain from the pinned
   genesis stays valid for the shorter prefix, so the trailing-hour count drops. Only a writer of the State
   directory can do this.
2. **`state.json` and the lock deleted, then re-initialised.** The local running-job record is lost. Lease
   consumption stays authoritative in the lease store (r6, `LeaseVerifier.Consume`), so a consumed lease is
   still refused. Only a writer of the State directory can do this.

## What the ruling makes binding instead (round 7)

Each item is the orchestrator's call, fail-safe:

1. **The State directory is out of every worker's reach.** `New` refuses a State directory that lies inside, or
   contains, any writable root a worker is handed: the job worktree root, `CODEX_HOME`, the `-o` and job-file
   directory, and every TMPDIR root given to workers. This is what makes the ruling's premise true.
2. **`CODEX_HOME`, `HOME` and `PATH` take only their pinned values** (launcher.go:528). Any other value is
   ErrSpec.
3. **`ReceiptGenesis` is checked** against the log's actual genesis. Until now it was only declared
   (launcher.go:191).
4. **A cheap anchor.** Each admitted launch also appends a launch record to the main journal (the import is
   allowed: `internal/journal` is an internal package, not a third-party module). The receipt log's count and
   the journal's launch count must agree, and a mismatch fails closed.

## Status

The round-7 done-tests are **not yet written**. The test builder stopped at its context budget, so this note is
the only r7 artifact on build/b1-08-tests-r7. A fresh test builder should write the r7 tests for items 1–4 and
re-freeze them with the reason "2026-10-03 re-freeze r7 threat-model ruling".
