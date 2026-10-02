---
role: builder
task: secretscan-mutants
branch: fix/secretscan-flake
tier: lite
qa_verdict: PENDING
---
Tests only, on a36f1b9. The scanner rule is unchanged; the rules.go diff is comment-only (checked: no non-comment +/- line). New `kernel/internal/secretscan/floor_test.go` adds four tests. NeverAboveOldFlatFloors checks n=15..4096, hex<=2.5 and text<=3.2, non-decreasing, ending at the old floor. PinnedTable checks 14 lengths x 2 classes at eps 1e-9. BoundaryValues uses fixed count-vector values within 0.05 bits on each side of the pinned floor (hex, alnum, base64) and checks detect vs miss via matchLine. ExactEqualityIsReported uses dyadic values whose float64 entropy equals the floor exactly (hex@24, hex@40/64, text@24).
Mutation run (scratchpad mutrun/main.go, a fresh temp copy per mutant, `-run TestFloor` only): baseline PASS and 27/27 KILLED. M1 `>=`→`>` is killed only by ExactEquality. M2-M7 are every knot lowered by 0.02, plus every raise by 0.02 that stays <=old. Also M9, M11a/M11b (both wrong-direction forms), M13, and M15/16/18/19/20/20t (knots raised above the old floor, down to +0.0001). M8 was not applied; the dispatcher declared it equivalent, and I did not verify that.
rules.go comment: 27,000 distinct per set is measured (54,000 drawn per set). The dispatcher's "1-2 per 5M" did not hold for decimal. Measured per 5M over 3 seeds: base32 2/3/1, decimal 4/5/7 (decimal is hex-classified). The comment records the measurement.
Verified: `go test -count=50 ./internal/secretscan/` exit ok (69.9s), `-tags donetest -count=50` exit ok (64.4s), and the `-json` count=50 run had 0 fail events. gofmt is clean.
Hook refusals, recorded. (1) pre-tool-use.sh blocked `chmod +x`; not retried as chmod. (2) The worktree-isolation guard refused compound commands (a git pipeline, an `export GOCACHE=$TMPDIR`, a `zsh script.sh`). These were re-run as plain single commands with `go -C <dir>`, as the refusal text directs. (3) A permission denial stopped a compound `rm -rf`+heredoc; I did not retry it. Disclosure: the mutation harness is a Go program that execs `cp -R` and `go test` in /tmp/claude-501/mutwork1; it runs no git.
Local `fix/secretscan-flake` is checked out in another worktree (agent-a0e017d5392b16ced). This work is on local branch `test/secretscan-mutants` and was pushed to origin `fix/secretscan-flake`; see the return for the push result. origin/fix/secretscan-flake (8f763d4) is an ancestor of a36f1b9.
