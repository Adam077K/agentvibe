---
role: builder
task: b1-26-tests
branch: build/b1-26-tests
tier: lite
qa_verdict: PENDING
---
B1-26 done-tests frozen, not implemented. New package kernel/internal/label (stub label.go, unregistered) + userland/src/label.ts (stub, unregistered); tests label_donetest_test.go (7 tests, 241 subtests) and userland/test/label.donetest.test.ts (7 top-level, 380 with subtests) over five shared fixtures (60 valid, 80 invalid, 52 mapping rows, 28 origin cases, 13 joins), each case citing its canon line. Registered in build/done-tests/B1-26.yml; check-done-tests exit 0 (26 hashes, 6 registers).
Red against stubs: Go 7/7, Userland 380/380. Green against a $TMPDIR-only reference; 29 of 29 mutants killed (16 Go, 13 TS). Reference never committed.
OPEN: nouns.Label (B1-02, frozen) keeps the pre-DR shape (provenance array, confidence number) - re-pointing it at label.V1 re-freezes B1-02; join of dclass/origin/venture/retention/exportable/consent_scope beyond "join" is undefined in canon (untested); a customer's or customer-proxy's non-participant HumanTask: customer (E/I) or counterparty (C)? (untested); origin `participant`/`external` stragglers (13, 02) have no row in 09a's table.
Refusals: pre-tool-use hook blocked `rm -rf` in $TMPDIR (used a fresh dir instead); git worktree add needed sandbox escalation (known wall).
