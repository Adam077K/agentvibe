---
date: 2026-08-23
role: builder
task: ledger-dispositions-v2
branch: chore/ledger-dispositions-v2
tier: lite
qa_verdict: PENDING
---

Carries three claim-ledger dispositions dated 2026-08-20, all due 2026-09-08, recorded early rather than at
the deadline. Touches `.claude/ledger/index.json` and `docs/03-system-design/CLAIM-LEDGER.md` only —
`node scripts/classify.mjs` on both paths returns floor=lite, enforcement=shadow.

**`c-shadow-window-open` — waived from 2026-09-08 to 2026-11-17.** The promotion review ran early and found
the corpus does not fit the decision it would drive: 11,930 events in `~/.agentvibe/events.jsonl`, 9,837 of
them `claim.would_block`, over 42 distinct claims across 9 days (2026-08-11 to 2026-08-20), and 100% harness
self-description — no venture workload has ever run through the harness (stop condition 6). The top four
claims are 83% of every would_block event; the largest single one is the deliberate `example.invalid` canary
at 36.0%. The corpus also **grew while being measured**: the quoted count moved 9,790 to 9,806 to 9,837 in one
day, every increment caused by someone inspecting the ledger, not by product work. Per resolver, against the
promotion table already in `CLAIM-LEDGER.md`: `claim-freshness` has a clean record and is promotable;
`claim-source` is unchanged and still not promotable; `claim-judge` is unexercised and may be *structurally*
unresolvable (`risk: high` needs ≥2 distinct model families and this runtime has one); `claim-command` fails
its own bar — `c-run-log-has-a-reader`'s evidence command's exit code depends on whether `ledger verify`
already wrote to the events log in this run, so its would_block measures bookkeeping order, not a broken
command. Exit condition recorded for the next review: one real sourced claim from non-harness work, plus a
two-model-family judge panel.

**`c-effort-frontmatter-binding-unverified` — waived from 2026-09-08 to 2026-11-17.** Still unverified, but
the reason changed: when the claim was written zero agent files declared `effort:`; measured 2026-08-20, all
7 non-shim engines now declare it. The declaration side is populated; whether the runtime *reads* it has still
never been observed, and nothing in this repo can currently tell "read and used" apart from "ignored" (both
produce a dispatch that runs). Discharge condition: two dispatches identical except for `effort:` showing a
measurable turn/token difference, or vendor documentation stating the field is consumed.

**`c-read-only-binding-unverified` — deliberately NOT waived.** `valid_until` alone moves, 2026-09-08 to
2026-11-17; `disposition.action` stays `refresh`. A waiver was drafted and withdrawn: waiving would have made
`claim-judge` report `waived` against an empty judge panel, taking `ledger verify` from 5 would_block to 4 by
silencing this claim's line rather than resolving it — trading Rule 10 ("a resolver never passes what it
could not check", one of the few `ENFORCED` rules in CLAUDE.md and pinned by `ledger.test.mjs`) for a smaller
number. `dispositionOutcome` returns null for `action: refresh` (`scripts/lib/resolvers.js:82`), so only the
`valid_until` line — not the disposition — could clear the deadline; the diff bumps that line and states this
in an inline comment so a later reader does not mistake 5 would_block for a regression and "fix" it back to 4.
What the claim does and does not cover is restated: the Agent-tool surface is discharged
(`c-read-only-binding-verified-by-attempt`, measured 2026-08-16); the Workflow surface `qa.js` dispatches its
judge through is not, and `npm run test:probe-readonly` proves the reporting harness is unforgeable, not that
the binding holds on that surface.

**Not yet run: any review.** `qa_verdict: PENDING` because no reviewer has looked at this branch — the
dispositions above are reported as what the diff contains, not as verified correct. This branch was
time-sensitive (claims due 2026-09-08, 16 days out) and had no session file, so it could not pass
`qa-lead-pass.yml`; this file exists so it can be reviewed and merged before that date.
