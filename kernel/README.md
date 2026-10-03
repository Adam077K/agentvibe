# kernel/ — `avk`

The Kernel's Go module (docs/vision-v3/09a-ENGINEERING.md §2). Protected base (09a §14).

Check it, from the repository root:

```sh
go -C kernel test -count=1 ./...
```

That runs `avk-boundary` against the real tree and the negative fixtures proving each check fails.
The principle is default-deny on what the checker cannot see:

- **Modules:** `go.mod` and `go.sum` are read directly. Only `module`, `go`, `toolchain` and a
  `require` of a module in `ALLOWED_MODULES` are permitted, so `replace`, `tool` and unknown
  directives all fail. Every import in every `.go` file is parsed, whatever its build constraints.
  The build is also resolved with `go list` on {darwin,linux}×{arm64,amd64}, with and without every
  build tag the sources use.
- **Tree:** no symlink, cgo, non-Go source (`.c .h .s .m .cc .syso …`), nested `go.mod`, `go.work`
  or `vendor/` anywhere under `kernel/`.
- **Size:** at most 15,000 lines (`-max-lines`) of `.go` outside `_test.go` files. That covers every
  directory, including `testdata`, `_` and `.` directories and anything behind a link.
- **Journal:** no file outside `kernel/` names the Journal (`internal/journal.Path`). The scan
  covers every file whatever its name or encoding: raw bytes, with NULs dropped so UTF-16 reads.
  It is case-insensitive and matches the file name, the directory as separate tokens, and globs
  aimed at it. Only regular `docs/**/*.md` files are exempt, as prose; a script under `docs/` is
  scanned.

**The Journal scan is a tripwire, not the boundary.** A path assembled at run time from pieces that
never spell a token defeats any static scan. What actually keeps Userland out is the OS: the Journal
is owned by `avk` with mode 600. Userland reaches the Kernel only through the command socket, mode
660 (09a §2, §4.1; B1-03).

`-count=1` is required, because a cached pass would not rescan the repository. For readable
findings, run `go -C kernel run ./cmd/avk-boundary` (exit 0 clean · 1 finding · 2 could not check).

## Done-tests (B0-17)

Acceptance tests for P1 jobs are frozen before the jobs are built (14-BUILD-PLAN.md §6, B0-17).
They sit behind the **`donetest` build tag**, so the default `go test ./...` above does not compile
them and stays green while they are red:

```sh
go -C kernel test -tags donetest -count=1 ./...
```

Against today's empty implementations every one of them FAILS, it does not skip. A job is done
when its tests pass unmodified. Each test file's sha256 is registered in `build/done-tests/*.yml`
and checked by `node build/check-done-tests.mjs`; editing a done-test changes the job's acceptance
and must be re-registered as a reviewed decision.

| Job | Test file | Contract it runs against |
|---|---|---|
| B1-01a | `internal/journal/core_donetest_test.go` | `journal.Journal`, `journal.Open` |
| B1-01b | `internal/journal/chain_donetest_test.go` | same |
| B1-05 | `internal/lease/lease_donetest_test.go` | `lease.Claimer`, `lease.New(journal.Journal)` |

The B1-01a crash test re-executes the test binary as a child (`AVK_DONETEST_CRASH_CHILD`) and
SIGKILLs it. The B1-01b tamper test rewrites a row's bytes in `journal.db`/`-wal` after `Close`, so
event data must be stored verbatim.
