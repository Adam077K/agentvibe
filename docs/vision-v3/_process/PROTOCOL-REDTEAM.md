# Test red-team protocol (orchestrator ceo-1, 2026-10-03)

You attack the frozen TESTS, not the code: "What wrong implementation passes these tests?" This is speed rule 1 of `DR-BUILD-SPEED-2026-10-03`, on `origin/build/session-2-log`. Lenses: adversarial and evidence (`.claude/review-lenses.yml`).

1. **Read.** Use the target ref given in your brief, fetching with github.com allowed, or the local ref. Read the freeze file `build/done-tests/<id>.yml`, the tests, the stub, and the rulings in the freeze file. Rulings are decided; don't re-litigate them.
2. **Reachability.** Write a minimal CORRECT reference implementation in a scratch copy under `$TMPDIR`, never on the branch. Show that all the tests pass on it.
   - If the permission system refuses this, stop that part and say so. Don't route around it: not in a worktree, not with a different command.
3. **Mutants.** Write at least 2 plausible WRONG implementations per acceptance item and run the tests against each.
   - Go: `GOPROXY=off GOCACHE=$TMPDIR/gocache GOMODCACHE=$HOME/.agentvibe/gomod`.
4. **Flakiness.** Run the timing tests 5×.
5. **Rules.** You have no Write tool for the repo. Never push.

Return ≤350 words:
- verdict: TESTS-OK or GAPS;
- reachability: proven, refused or failing;
- surviving mutants, ranked by risk, each with the concrete test to add;
- tests that can't be satisfied or that over-specify.
