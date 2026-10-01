---
role: builder
task: b1-04-tests
branch: build/b1-04-tests
tier: lite
qa_verdict: PENDING
---
B1-04 done-tests frozen: kernel/internal/lease/fence.go is the unregistered stub (Coordinator, Verifier); fence_donetest_test.go plus testdata/sp2/{b0-greedy,b0-drill}.json (ported from spikes/collision @2162926) are registered in build/done-tests/B1-04.yml. check-done-tests 14 hashes/4 registers exit 0; avk-boundary exit 0.
Red: `go -C kernel test -count=1 -tags donetest -run B1_04 ./internal/lease/` gives 8 of 8 FAIL, all on ErrNotImplemented. Re-frozen after the review at 30471a9 (dated reason in the register).
Reachable: a throwaway reference impl in $TMPDIR passes 8/8 under -race -count=3. 15 of 15 mutants killed; the 5 from the review survived the old file.
Choices for the reviewer: Born orders missions; the deadlock victim loses all its leases; a released or revoked token is stale at storage; "/**" glob coverage; one outstanding wait per job, readable via the added Coordinator.Waiting; refusal names exactly the refused resources.
Not frozen: verifier expiry, hot-resource auto-add, nightly scheduling, glob-vs-symbol overlap, max_wait, verifiers other than repo://. A hook blocked `rm -rf` on a $TMPDIR copy, so fresh mktemp dirs were used instead.
