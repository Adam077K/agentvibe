---
date: 2026-08-24
role: builder
task: correct-the-record
branch: docs/correct-the-record
tier: lite
qa_verdict: PENDING
---

Six documentation defects, all verified by execution 2026-08-24 (see the CEO/team-lead brief). Fixed, keeping
each superseded line beside its dated correction per house style (`TARGET-ARCHITECTURE.md:39-52`):
`MODEL-DIVERSITY.md:3` Status flipped to decided (accepted risk, cites `2026-08-23-after-p0.md §6`);
`AGENT-ARCHITECTURE.md` open decision #3 closed, its `independence: provenance` stale half noted;
`ROSTER-SIZE.md` D7 closed, dead `resolvers.js:307` pointer corrected (no such stub exists);
`review-lenses.yml:28-31` header comment updated only (lenses/`independent`/`model_families` untouched —
`npm run lint:agents` and `npm run test:lenses` both green, 10 lenses / 31 tests); two stale citations fixed
(`schema-lint.js:729-742`→`:1465-1489`, `:597`→`:1472`); handoff §4.4 items 1 and 5 corrected in place
(false premises named, old text kept). `ci.yml`/`qa-lead-pass.yml` merge-blocking contradiction reported to
team-lead, not edited (irreversible, out of scope).
