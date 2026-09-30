# Review — Founder mindset (opus, web research first, read-only)

**Verdict:** Well engineered, and aimed at the wrong constraint. This plan makes the harness better at judging itself, not the founder faster at finding customers. Reverse the order: a venture goes first and the harness grows only where the venture hurts.

## Will it make him faster, and how soon?
On the plan's own schedule, not for about 9 weeks, and likely longer. J01→J29 is timeboxed at 3 weeks; M1 comes "≤6 weeks after J29". A real customer conversation is not on the critical path until week 4 at the earliest. The plan admits "no venture work has ever run through this harness", after 2 months of building it.

The repo's CLAUDE.md is the clearest symptom: thousands of words of "Superseded…" notes about sandbox denials, CI YAML shapes and verdict hash-binding; very little about a customer. The research names this failure mode: "activity confusion" (mistaking output volume for progress toward revenue) and starting from the technology, then looking for a use case. METR's RCT: experienced developers were 19% *slower* with AI tools but believed they were ~20% faster — self-assessed speed from tooling is not evidence.

Eventually faster? Yes, somewhat: the ~6 h/week overhead cap, kill lines and runner-decided status are real gains once a venture exists. But solo operators who make money (Levels ~$3M/yr on one PHP file plus Cursor; Medvi's founder on off-the-shelf AI for code, copy, ads, support) got there with thin tooling and heavy distribution. Neither ran a 30-job internal platform before selling.

## What is right
- **Status comes from the runner, not the agent** (diff exists, frozen done-test passes). The single most valuable idea: false agent success is the real tax on running several ventures.
- **The lean loop is explicit:** kill line per experiment, *did*-level evidence, ≥10 conversations, fake door + Payment Link, auto-park after 3 weeks without evidence.
- **Cuts and dormancy:** Mem0 dropped; legal/finance/support off until first payment; no persona agents; one repo per venture.
- **Money and outbound guardrails:** nothing sent or spent without the founder; email only; no LinkedIn/Reddit automation. Medvi is the cautionary tale (class action over spoofed-domain spam, per Gary Marcus).
- **Success test is a venture outcome (M1)** — right, but in the wrong place in the sequence.
- **Harness-ratio alarm ≤20%** — right instinct, but it only switches on after the build.

## Over-built or premature
- **~30 jobs before the first venture.** Should wait for a live venture: SQLite queue under launchd; continuation chains and breaker; 11 seeded failure classes; canaries; FTS5 search; drift alarms (no weeks of data to measure drift); retrieval golden sets; improvement loop with labelling.
- **Chasing 2-family review.** Codex behind a PTY wrapper is reliability work a pre-revenue venture doesn't need. At Problem-validated, a bug costs nothing; a week not talking to customers costs everything.
- **90-day targets are theatre until a venture exists** ("≥5 merged gate-passed changes per venture per week", "first-pass PASS ≥70%"). In discovery, merged PRs should be near zero; the metric rewards building.
- **Governance scaled for a team** (expiring decision inboxes, entity thresholds, helper roles). One person, one venture: a text file and a calendar.
- **CLAUDE.md is a liability** — a history log, not instructions. The 8 KB cut is right; do it this week, not as a job.

## What to do
**Next 7 days — zero harness jobs.**
1. Pick one venture (D1).
2. Write `venture.yml` by hand: beneficiary, current alternative, riskiest assumption, kill line.
3. Use plain Claude Code with the existing engines to build the ICP list, draft outreach, ship a fake door + Stripe Payment Link — a day's work.
4. Book 5 calls.
5. Keep a notebook of every place the harness hurt. That notebook is the only valid backlog.

**By day 30:** ≥10 real conversations with transcripts and a persevere/pivot/kill decision. Build only the runner pieces the notebook shows you needed — probably worktree + launch by argv, the done-test status check, and a Monday page from `venture.yml` (J01 and a few others, not J29). Freeze the rest. Cap harness work at 20% of hours starting now.

**By day 90:** one venture at Solution-validated (paid or signed LOIs), or a clean kill and venture #2 through the same loop. Only then consider the second model family, canaries, drift alarms and the improvement loop — and only if false "done" reports or rework show up in real data. Success metric: revenue or dated evidence, not jobs passed.

## The 12 decisions — founder reviewer's answers
- **D12:** Answer first. Any client code or personal data → its own repo; one hour.
- **D1:** One venture now. Keep paid client work if it pays the bills. Park the rest.
- **D2:** Problem-validated in **4 weeks**, not 9. Keep the 3-week auto-park.
- **D3:** Invert it. No build timebox before the venture; harness ≤20% of hours from today.
- **D4:** Yes to 5 calls/week ("if you won't take them, you have a hobby"). No labelling until real data.
- **D5:** Cheapest plan that doesn't throttle you; overflow off; raise only if venture work hits the cap.
- **D6:** Codex as an occasional manual second opinion on money or auth. No PTY wrapper yet.
- **D7:** Your laptop, run manually. Nothing scheduled until a venture needs a recurring job.
- **D8:** One repo per venture; the portfolio view is a Markdown table updated by hand on Monday.
- **D9:** Yes to 8 KB this week. Accept the waiver; it matters less if you build less.
- **D10:** Agree: email only, approve each batch, no social automation, nothing autonomous speaking as you.
- **D11:** Agree: Stripe Payment Links money-in only; entity at first invoice.

## Sources (accessed 2026-09-29)
- Gary Marcus on Medvi: https://garymarcus.substack.com/p/the-back-story-behind-the-first-18
- PYMNTS, one-person billion-dollar company: https://www.pymnts.com/news/artificial-intelligence/2026/the-one-person-billion-dollar-company-is-here/
- Founder Institute, why solo founders fail with AI agents: https://fi.co/insight/why-most-solo-founders-fail-to-build-a-unicorn-with-ai-agents-in-2026-and-what-the-winners-do-differently
- Indie Hackers, Photo AI case study: https://www.indiehackers.com/post/photo-ai-by-pieter-levels-complete-deep-dive-case-study-0-to-132k-mrr-in-18-months-3a9a2b1579
- Fast-SaaS, Levels: https://www.fast-saas.com/blog/pieter-levels-success-story/
- METR RCT: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
- Learning Loop, fake door testing: https://learningloop.io/plays/fake-door-testing
- Illai Gescheit, lean startup is agentic: https://illai.substack.com/p/the-future-of-lean-startup-is-agentic
- Taskade, one-person company stack (vendor source): https://www.taskade.com/blog/one-person-companies

Caveat: several revenue figures come from secondary or promotional blogs; relied only on Levels, Medvi (with the Marcus critique) and METR.
