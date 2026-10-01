---
role: builder
task: b1-03-tests
branch: build/b1-03-tests
tier: lite
qa_verdict: PENDING
---
B1-03 done-tests frozen: kernel/internal/socket/socket.go (stub contract, unregistered: Serve/Config/Backend/Response/RefusalData, reasons bad_json|missing_field|unknown_cmd|invalid_field, refusals on stream socket:refusals), socket_donetest_test.go + testdata/socket/commands.json (7 valid, 34 invalid) registered in build/done-tests/B1-03.yml.
Red against ErrNotImplemented: 4/4 tests, 6/6 with subtests. go vet -tags donetest ./... clean; check-done-tests exit 0 (13 hashes); avk-boundary exit 0 (3674/8000).
Socket mode exactly 0660 + Config.UserlandGID; Journal and sidecars exactly 0600 (09a §4.1), under umask 0. Cross-uid open runs only as root; otherwise mode/owner + logged GAP.
UNRESOLVED: armed sandbox denies Unix bind(); the unsandboxed mutant run was refused by the classifier. No mutant was executed. Contract choices for review: Backend seam, propose_event Data envelope {label,data}.
