---
date: 2026-08-16
role: builder
task: readonly-binding-claim
tier: lite
qa_verdict: PASS
---

Registers `c-read-only-binding-verified-by-attempt` and gives `c-read-only-binding-unverified` a `refresh` disposition. The old claim's assert is **left unedited** — both its halves are now false, and a stale assert preserved beside its correction is the ledger's own argument for expiry.

**Attempt, not introspection.** `reviewer-readonly` was dispatched and told to *try* the forbidden actions: Write, Bash and Edit all returned `NOT_PRESENT` — absent, not present-and-refused — with the control Read succeeding and the tool list exactly `["Read","Glob","Grep"]`. Absence matters: a refusal would mean the capability exists and only a hook stands in front of it, and hooks fall through on tools their matcher does not name.

**The bound is in the assert, not a footnote.** The probe ran on the `Agent` tool path. `qa.js:321-324` dispatches its judge through `agent()` on the Workflow surface, which was **not** measured. Certifying the gate's containment from an unexercised path would be the defect this ledger exists to catch.

**`verified_by: command` pins the declaration side only** — tool list exactly `[Read, Glob, Grep]`, `JUDGE_AGENT` routing to it, and the judge dispatch naming an `agentType`. No resolver can dispatch an agent. All three conjuncts mutation-tested; each fails alone.

**`refresh`, not `deprecate`, and it costs one `would_block`.** Refresh does not short-circuit, so the old claim's `claim-judge` now reports `unresolved` against its empty panel instead of passing under the lapsed-in-spirit waiver. That is the correct state: the question was answered elsewhere, on a path the old claim never named.

Rebased onto `d76f1e3`. `lint` clean · `build --check` matches · the new claim passes both resolvers · `verify` **80 pass · 6 would_block · 0 block**. Every would_block is named and attributable: `c-lenses-and-playbooks-are-loaded` (#56, open), `c-sessionstart-injection-unverified` and `c-runtime-nested-spawn` (empty judge panels), the `c-canary-unresolvable` pair (the canary, by design), and `c-read-only-binding-unverified` — **the one this change adds**, exactly as the `refresh` disposition intends.
