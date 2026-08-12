---
role: ceo
task: phase-7-skills
date: 2026-08-12
branch: feat/phase-7-skills
tier: irreversible
qa_verdict: PASS
---

**Phase 7.** 147 skills cut to 84 by the four tests in §3.10, then rebuilt to **134** as the cuts were
audited and better sources found. Discovery went from **~15,000 tokens to ~1,070** per lookup.

**Every cut names the test it failed** in `.claude/skills/CURATION.yml`, and `check:curation` fails when the
directory drifts from that decision. Deleting half a library by taste is unauditable; "I curated it" is the
unfalsifiable claim this repo exists to stop. That file is the only reason the errors below were findable.

**Nine of 37 `near_duplicate` cuts were wrong — a 24% error rate on the least-verified part of the work.**
Every one failed identically: judged from adjacent names rather than from reading both files.

- **Six folded into a survivor that was itself cut.** `documentation` → `documentation-templates` → also
  cut. `api-documentation` → `api-documentation-generator` → also cut. The content did not move, it
  vanished — which is why the documentation category emptied and nothing replaced it. *"Kept the one
  carrying the most procedure"* is only true if the one kept was kept, and nothing checked that.
  `curate-skills.mjs` now refuses any cut whose named survivor is absent; **it fired six times the moment it
  was written.** All six re-pointed at survivors that exist and are better.
- **Three were the `taste-skill` family** — `design-taste-frontend`, `stitch-design-taste`, `minimalist-ui`
  are sibling *style variants* of one framework (Notion/Linear, Swiss/military, premium). Picking the
  direction is the entire point; the collapse treated a menu as redundancy.
- **`skill-creator` vs `writing-skills`** — the same error made one commit after correcting it. One is the
  eval harness, one is the authoring discipline.
- **`requesting-code-review`** encodes a dispatch protocol nothing here had: hand the reviewer the diff,
  *never your session history*, so the reviewer is not contaminated by the implementer's rationalisations.

**Three richness inversions restored**, where the survivor scored **zero** concrete markers against the cut
file: `tailwind-patterns` (154 vs 0 — v4 moved config from JS into CSS), `broken-authentication` (65 vs 0),
`nextjs-best-practices` (57 vs 0). Eight further cases remain flagged and unresolved; they need reading,
not scoring.

**Additions carry provenance** because they did not come from the curated 147: `impeccable` (85-line body,
36 verified reference files), `industrial-brutalist-ui`, `ui-typography`, `12-principles-of-animation`,
`design-mirror`, `web-design-guidelines`, `verification-before-completion`, `subagent-driven-development`,
`writing-skills`, `skill-creator`, `receiving-code-review`, `doc-coauthoring`, `writing-good-tests`,
`react19-test-patterns`, `object-calisthenics`, and 28 `thinking-*` mental models with a router.

**Not done, and named rather than implied:** the 803 external candidates across 11 public corpora were never
evaluated. No claim of "best ~70 in the world" is made anywhere; `c-external-skill-corpora-not-evaluated`
pins that.

**On method:** every one of the nine errors was caught by someone else reading the files — the founder, then
two research agents, then a mechanical re-screen. That is the honest limit on unattended curation.

**Verified:** `npm run check` exit 0 · 215 tests · `ledger verify` 64 pass · 2 would_block (canary) · 0 block.
