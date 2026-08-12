---
role: ceo
task: phase-7-skills
date: 2026-08-12
branch: feat/phase-7-skills
tier: irreversible
qa_verdict: PASS
---

**Phase 7 — skills curated and the discovery tier made two-tier.** 147 → **84**, every cut recorded in
`.claude/skills/CURATION.yml` with the test it failed, and `check:curation` failing when the directory drifts
from that decision. Deleting half a library by taste is unauditable; "I curated it" is exactly the
unfalsifiable claim this repo exists to stop.

| Test | Cuts |
|---|---|
| role-duplicate | 11 — agent personas wearing a skill's clothes |
| near-duplicate | 37 — same subject, kept the one carrying most procedure |
| reconstructible | 10 — a frontier model produces these unaided and better |
| dead-subject | 5 — war-room, board meetings, routines, Linear |

**The fourth instance of "a checker's coverage is not its subject."** `code-reviewer`,
`frontend-developer`, `data-engineer`, `ai-engineer`, `rag-engineer`, `debugger`, `search-specialist` and
`vector-database-engineer` were agent personas — the exact shape Phase 4b collapsed into six engines. They
survived because that phase walked `.claude/agents/` and these live in `.claude/skills/`.

**Discovery went from ~15,000 tokens to ~1,070.** `MANIFEST.json` was read whole on every lookup and grew
linearly, so a good new skill made every unrelated task more expensive. Now: `routers/INDEX.md` (~370) → one
of six namespaces (~700) → the skill. Routers live outside the skill directories deliberately — implemented
as skills they would land in the manifest and inflate the file they exist to avoid.

**Seven cuts did not remove the name, and five of those now mean something else.** `~/.claude/skills/` holds
42 skill directories, 32 of them symlinks. Deleting a repo skill un-shadows the global copy — the agent
hazard, one directory over, and it went unnoticed until the runtime kept offering five deleted skills. Not
shimmed, and the reasoning is recorded: a drifted global *agent* changes who does the work and what tools it
holds; a drifted global *skill* changes what reference text gets read. Left to Phase 9 with the rest of the
global reconciliation, reported by `check-registration` check 10 so it stays measured.

**My first measurement of that was wrong** — it used `readdir withFileTypes` + `isDirectory()`, which returns
false for a symlink, and confidently reported zero collisions where there are seven. `statSync` follows them.
It took a contradicting bash `-d` check to catch. A fast wrong number is worse than a slow right one.

**One cut reversed by the tool refusing it.** `brainstorming` is declared by `framer.md`; that declaration is
evidence, not an obstacle, and a skill an engine loads on every framing task is not "useless in every
project" — the only bar test 1 allows.

**Not done, and named rather than implied:** the 803 external candidates across 11 public corpora were not
evaluated. This is the local 147 honestly cut. **84, not ~70** — the tests yield 84 and cutting 14 more that
pass them to hit an estimate made before the tests ran is the fabrication pattern.

**Verified:** `npm run check` exit 0 · 215 tests · `ledger verify` 64 pass · 2 would_block (canary) · 0 block.
