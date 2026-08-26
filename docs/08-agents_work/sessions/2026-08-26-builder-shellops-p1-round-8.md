---
date: 2026-08-26
role: builder
task: shellops-p1-round-8
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: fix/shellops-comment-procsub-yaml
commits: 3
---
# Four P1 bypasses in the guard the QA gate depends on, and one verdict per construct
**All four reproduced against `main` (`7f7bddd`) before building.** `shellOperators("npm run test:foo # don't forget this\nnpm run bad ; npm run worse")` → `[]`; `shellOperators('npm run good <(npm run bad)')` → `[]`; `ciChainFindings` on `run: "npm run a && npm run b"` → no finding while the unquoted spelling gives one; `parseCiSteps` dropped a plain multi-line `run:` continuation whole.
**Impact measured BEFORE building: 0 of 114 governed commands** (70 package.json scripts + 44 ci.yml `run:` values) contains `#`, `<(` or `>(`; **0 of 44** `run:` values is a quoted scalar or plain multi-line. No live verdict moves — the same zero-of-114 shape that made last round's `$` change safe.
**Four constructs, four verdicts, each re-derived — I did not apply one to the class.** `#` MODEL (fail-closed fires on every ordinary comment, and would not fix the defect: the bug is an apostrophe opening a real quote frame). `<(`/`>(` MODEL **and REPORT** — the judge's proposal (a) as literally written would have left `npm run good <(npm run bad)` at `[]`; mutation F2-b proves it. Quoted scalar MODEL with a bounded escape table and the residue FAIL-CLOSED as its own finding kind. Plain continuation MODEL — the one reachable by accident, so a refusal fires on a correct reflow.
**Checked against a real YAML parser, not against what the assertions wanted.** 42 workflow shapes vs PyYAML 6.0.3: **37 parse identically, 41 of 42 give the identical shell verdict**. The one that differs is a single-line block scalar whose trailing newline this parser trims, reporting `[]` where PyYAML's string reports `\n` — and a trailing newline is not a second command.
**Attacking my own fix found two false positives, both fixed here.** `run: "npm run a" # note` is valid YAML that the first cut refused as undecodable, and `run: | # note` is a block scalar whose indicator the regex missed — which the new fold then swallowed the body into.
**Fifteen mutations; three survived and all three are resolved in the code, not in prose.** `!escaped.has(i)` was provably dead (`escaped` only holds indices the loop skips) and is deleted. Two fold resets were mutually redundant — singly inert, jointly load-bearing — so one is gone and the other now fails a test when removed. One guard is labelled tidiness rather than correctness because 45 inputs could not tell.
**Two existing assertions pinning the OLD `#` over-report are rewritten, not deleted.** The "every unmodelled construct over-reports" claim was FALSE for `#`: it over-reports on the shape the test chose and under-reports to nothing on the shape a person writes.
Verified: `npm run check` → **43 of 43 · 0 failed · 91.2s · exit 0**, sandbox armed (denominator derived, not recalled) · `test:check-suite` **56 pass · 0 fail** (was 52) · `check:ci-chains` clean, and its failing branch executed by hand.
