---
date: 2026-08-16
role: builder
task: mc-index-validation
tier: full
qa_verdict: PASS
---

Issues #53 and #54, closed together because they are one defect at two ends of the same wire. `readLedgerIndex` (`mission-control/server/projects.ts`) read `JSON.parse(raw) as { claims?: LedgerClaim[] }` — a cast that satisfies `tsc` while checking nothing, so a producer dropping a field from `KEY_ORDER` cost nothing at compile time. That already happened once, to `source_line`, and reached the UI as `file:undefined` past `tsc`, 319 tests, and the view assertions.
**Measured before touching anything:** `source_file` stripped from all 33 claims of the real `.claude/ledger/index.json` → **320 pass · 0 fail**. Measured after → **326 pass · 1 fail**, the failure being the one new test that reads the real index through the production reader. That pair is the deliverable; a test that cannot fail proves nothing, and #54 exists because 320 could not.
New `mission-control/server/lib/claim-shape.ts` holds one validator per projection and **builds** each claim from fields it read and type-checked — never `o as LedgerClaim`. `validateClaim` could not be reused unchanged: its field set is closed and `source_file` is stamped after validation, so it rejects every real index entry. The index projection is derived from `KEY_ORDER`, and a test reads that literal out of `scripts/ledger.mjs` (read-only — another agent owns it) so a `KEY_ORDER` edit fails on its own PR.
**The second half of #53, which the issue's own first comment got wrong and corrected:** `belief.ts` validated each global entry and then wrote `const claim = c as GlobalClaim`, re-asserting `source_file: string` about an object the validator had just guaranteed does not carry it. Only a literal stamp two lines down made that true and nothing forced it to stay. Both producer paths now validate and keep what was validated.
Fixtures (#54) are no longer literals: `indexClaim()` / `globalClaim()` in `test/fixtures.ts` route through the same validators and **throw** on a claim the producer could not emit. Every one of them did — the old fixtures carried no `confidence` and no `evidence.cmd`, so they described claims the ledger would have refused outright.
**Not covered, stated rather than hidden:** `LedgerIndexInfo.rejected`/`issues` are populated but not yet rendered in `BeliefView`; a total refusal degrades to `present: false` with a reason, which the view already handles. Two suite failures observed during verification (`crosscheck` ledger-verify timeout, one 5s view budget) reproduce identically on a **pristine** `origin/main` checkout at load average 15+ — machine contention from parallel agents, not this change.
