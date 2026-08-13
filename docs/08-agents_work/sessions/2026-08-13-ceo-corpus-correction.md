---
date: 2026-08-13
role: ceo
task: corpus-correction
tier: lite
qa_verdict: PASS
---

I measured `~/.claude/projects/` two levels deep and reported **72 files / 0.44 GB / 1,283 ms**. Transcripts nest deeper. Recursive count: **2,029 files / 2.83 GB**, raw full parse **9,252 ms** — wrong by 28×, and the same ~9 s Phase 6 already hit on this corpus before adopting mtime-skip. The bad figure reached `PHASE-8A-STATUS.md`, `DECISIONS.md`, `mission-control/README.md`, two PR bodies and the brief a builder worked from, and the "no database" decision was justified with it. Found by the builder measuring the real corpus instead of trusting its brief — the second time today a worker corrected me, after `finfun`.
Corrected in the status doc (§3 gate and §4 table, with the original struck through and the cause named), the prior session file, and a new `DECISIONS.md` entry that supersedes the 2026-08-12 rationale rather than editing it. Founder decision: **raise the cold-start budget to 10 s** rather than cache, lazy-load or parallelise — cold start is paid once per launch and incremental is 4 ms. The budget is bound to a new claim `c-mission-control-cold-start` with an expiry, because the corpus only grows and a budget in a comment rots silently while a claim with a date cannot. `npm run check` exit 0. Author-declared verdict, no reviewer — the discretion tracked as #24.
