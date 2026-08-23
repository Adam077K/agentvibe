---
role: builder
task: template-merge-gate
date: 2026-08-23
branch: fix/template-merge-gate
tier: irreversible
qa_verdict: PASS
---

**Closed the tier-3 "AI-assisted merge" hole in `war-room/bin/PROJECT_NAME.tmpl`** — the same
finding `feat/gate-and-provenance-v2` closed in `bin/warroom`, still present in the template that
`bin/install-war-room.sh:72` seeds into every generated project's launcher.

`cmd_merge`'s tier 3 piped each conflicted file to the `claude` CLI's non-interactive print mode,
wrote its stdout straight back over the file, `git add`ed it, committed, and deleted the branch —
guarded only by a 2000-line size cap and a grep for leftover conflict markers. Nothing reviewed the
result, and it logged `merge_complete` as though something had.

**Fix: refuse, not resolve.** Tier 3 now explains the refusal, aborts the merge, points the
operator at resolving on the branch, and logs `merge_refused`. Also fixed the strategy-in-tier-field
bug in tiers 1-2 (`tier=fast-forward` / `tier=auto-merge` → `strategy=`), matching the split
`bin/warroom` made.

**Verdict gate NOT ported — by design, not oversight.** `bin/warroom`'s QA-verdict gate
(`scripts/verdict.mjs`, hash-bound to the branch diff) can't bind here: `BIN_DIR="$HOME/bin"` in
the installed launcher resolves `_verdict_tool` against the installer's home directory rather than
the project's, and `bin/install-war-room.sh` never ships `scripts/lib/classifier.js`, which
`verdict.mjs` requires. That's P1's "one launcher generation"
(`docs/03-system-design/TARGET-ARCHITECTURE.md` §11), not this fix. Refusing needs none of that
machinery and closes the same hole. Documented in `war-room/README.md`.

**Divergence check added** — `scripts/warroom-template-guard.test.mjs`, wired into
`check:warroom` alongside a `bash -n` syntax check on the template (neither template check existed
before). Asserts three properties, not byte-parity with `bin/warroom` (different generations):
no model-invocation merge route, no strategy logged in a field named `tier`, and an unmergeable
conflict is refused/explained/left for a human. **Verified failing on the pre-fix template** (via
`git stash` of the fix commit, all 3 assertions fail with the exact pre-fix defects) **and passing
after** — both directions confirmed by hand, not asserted from one observation.

**Verification:**
- `npm run check:warroom` → 14 pass · 0 fail (10 pre-existing warroom-install cases + 3 new guard
  tests + template `bash -n`).
- `npm run test:tier-gate` → 17 pass · 0 fail.
- `npm run check` (run per-script past the `&&` chain, since it stops at the first failure):
  every script passes except three collapsing to the **same pre-existing, out-of-scope cause** —
  `.mcp.json` deliberately absent (per lane brief) makes `designer.md`'s `mcpServers` declaration
  look ungranted in `lint:agents`, `check:prompt-standard`, and `test:skill-clamp`.
  `git diff --stat origin/main..HEAD -- .claude/agents/designer.md` is empty: this branch never
  touches that file. `check:mc` fails on one SSE stream test (`EADDRINUSE`, port conflict from
  concurrent lanes in this session) — not a code defect. `check:map` failed once (my new test file
  + `check:warroom` command line drifted `.claude/memory/CODEBASE-MAP.md`) and is fixed by
  `npm run build:map`, committed. `check:ledger` → 78 pass · 10 would_block (shadow, pre-existing,
  none from this change) · 0 block.
- `bash -n war-room/bin/PROJECT_NAME.tmpl` → passes (the `{{project_name}}` placeholders only ever
  appear inside quoted strings, so they don't affect shell syntax).

**Files changed:** `war-room/bin/PROJECT_NAME.tmpl`, `scripts/warroom-template-guard.test.mjs`
(new), `package.json` (`check:warroom` gains the template syntax check;  `test:warroom` runs the
new guard test), `war-room/README.md` (new "Merge gate" section), `.claude/memory/CODEBASE-MAP.md`
(regenerated).

**Not done / left for the sequence this depends on:** porting `bin/warroom`'s actual QA-verdict
gate into the template — needs P1's single launcher generation, not a template patch.

## QA verdict — recorded 2026-08-23

**PASS**, returned by an out-of-band `reviewer` engine (`review-lane4`) that did not produce this work and
holds no Write or Edit tools. Lenses applied: see that review's own report. History: **PASS on first pass, no corrections required**.

**This review was a single model family.** Irreversible tier nominally asks for 2-of-3 multi-judge, and the
`risk: high` predicate requires ≥2 distinct model families — there is no non-Anthropic model inside Claude
Code, so that bar is not reachable in this runtime today. **The founder accepted single-family review for
harness self-edits on 2026-08-23**, after the limitation was raised unprompted on every review round across
two sessions. It is recorded here as an accepted risk, not as a satisfied requirement.

**This PASS was recorded by the orchestrator from the reviewer's return, not by the author of the code.**
Under the gate as it stands on `main`, the verdict is an author-writable line in a file — which is exactly
the defect `feat/gate-pr-route` replaces with a verdict bound to the diff hash and posted as a check-run.
Until that lands, this line is a convention, and the separation above is the only thing behind it.
