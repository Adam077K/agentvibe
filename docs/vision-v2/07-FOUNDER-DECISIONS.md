# 07 — Founder decisions (12)

Answer D12 first — it can move every trigger. D1, D2 and D9 block J00; nothing else blocks the start of the build.

| # | Question | Recommendation | Blocks |
|---|---|---|---|
| **D1** | Which ventures and projects are active for the next 90 days, and does paid client work outrank ventures? | One venture in discovery (it becomes the M1 venture) + at most one paid project. Park the rest from the fleet census (J11) with review dates | J00 (M1 criteria), J25 |
| **D2** | 90-day success bar and default kill line? | M1 venture at Problem-validated with ≥10 logged real conversations; auto-park proposal after 3 weeks without *did*-level evidence; default experiment budget set per venture | J00, J19 |
| **D3** | Timebox the v2 build, then cap harness work? | Build timebox 3 weeks (J01→J29). After it, harness ≤20% of jobs and founder hours until M1 | J25 alarm thresholds |
| **D4** | Will you take ≥5 calls/week in discovery; daily decision budget; labelling time? | Yes to calls (otherwise re-plan discovery as async fake doors + surveys). ≤10 decisions/day. 20 min/week labelling once the improvement loop triggers; until then none | J20, J24, loop trigger |
| **D5** | Which plans exactly (Claude Max 5x/20x; ChatGPT Plus/Pro), paid overflow, hard stop vs alert? | Reading your billing pages is a 10-minute task for you. Overflow **off**, hard stop. Start at 2 Claude writers + 1 Codex reviewer, founder floor reserved; raise after 2 weeks of runner data | J05 settings |
| **D6** | Codex's role? | Reviewer and judge only, behind the PTY wrapper; empty output = `unresolved`. Not a builder until it can be tool-scoped | J07 |
| **D7** | Where do scheduled jobs run? | An always-on Mac with FileVault, Time Machine or equivalent backup, `runner stop --all`. No subscription credentials in CI or cloud routines until provider terms for headless use are confirmed | J08 |
| **D8** | Repo layout and memory sharing across ventures? | One repo per venture/project, separated by default; one portfolio view with a declared read set (`venture.yml` + outcome summaries); auto memory as an inbox; paused ventures archived read-only | J15, J19, J25 |
| **D9** | Cut harness `CLAUDE.md` to 8 KB, and the gate policy for the build? | Yes to 8 KB (history archived, not deleted). One dated waiver: build PRs at Full tier + Codex once live; you merge harness self-edits in ≈6 lane batches; waiver ends at J29 or 2026-11-17 | J00, J10, every harness PR |
| **D10** | Outbound: channels, batch vs message, the never-without-you list, what is urgent? | Email only, one sending domain per venture, approve list + template per batch. No LinkedIn/Reddit automation. Never autonomous: money, legal, publishing as you (full list in 02 §7). ntfy only for stop failure, security, same-day deadline | J23, J26 |
| **D11** | Money and entity thresholds; shared or separate accounts? | Agents move no money and issue no refunds until the first payment. Decide entity, accounts and a named accountant at the first invoice; until then Stripe Payment Links money-in only | hledger/cost-split trigger |
| **D12** | Current exposure: any customer personal data or NDA/client code today, any other credential holder, any third party using this system? | Answer first. If yes: that work gets its own repo, excluded from the portfolio read set; backups + RUNBOOK move ahead in lane R; client code is never sent through a consumer subscription without checking the provider's data-use terms | Every trigger; J08 order |
