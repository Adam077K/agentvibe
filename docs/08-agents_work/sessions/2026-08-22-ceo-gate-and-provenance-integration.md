---
date: 2026-08-22
role: ceo
task: gate-and-provenance-integration
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: feat/gate-and-provenance-v2
session: ceo-4-1787176363
decisions:
  - "One verdict primitive: scripts/verdict.mjs. The competing .qa-gate/<diff_hash> implementation is abandoned"
  - "Refuse tier 3 under the gate rather than re-verifying the merge result — founder decision 2026-08-22"
  - "Split the sandbox allowlist and ledger waiver commits out of this PR — founder decision 2026-08-22"
corrections:
  - "SELF: the pathspec I specified was wrong — :(exclude)*.json still hides nested paths; glob magic is required"
  - "The gate bound the branch diff, not the merge result; the comment claiming otherwise was written by this work"
  - "Tier 1's comment overclaimed in the same way tier 3 did, in the file whose purpose was to stop overclaiming"
claims_touched:
  - c-qa-gate-blocks
---

# Integration — P0.5 provenance and the P0 merge gate, on one verdict primitive

An **integration**, not new authorship, plus remediation. It merges `feat/provenance-that-travels` (P0.5)
and `feat/merge-gate` (P0, local-merge route), both finished 2026-08-20 and never merged or CI-tested.

## Why this session file exists

The provenance branch's own session file carries `qa_verdict: PASS` but **no `branch:` field**, and it was
written for different work. `qa-lead-pass.yml` selects the verdict from session files in the PR diff, so
without this file the PR would pass its gate on a verdict that never covered this diff. Measured on all
three integration branches built this session; the workflow's own comment at `:80-89` names the defect
class. The durable fix is the diff-hash binding this PR introduces — a verdict bound to a diff cannot be
inherited, because a different diff has a different subject.

## Why the two branches had to land together

They were **two implementations of one primitive, and they destroyed each other.** `feat/merge-gate` hashed
the reviewed diff excluding only `.qa/verdicts/**`; `feat/verdict-diff-binding` excluded only `.qa-gate`.
Neither directory is gitignored and both tools require a *committed* record, so committing either verdict
moved the other's hash — whichever was recorded second orphaned the first, while `TARGET-ARCHITECTURE.md`
§4 requires both routes. Founder chose `verdict.mjs`; the other is abandoned and PR #77 closes with it.

Conflict resolution was a **union, not a pick**: the `check` chain carries both `test:provenance` and
`test:merge-gate` and the scripts block all four keys, because taking one side silently drops the other's
test from CI — the exact un-gating the merge-gate lane exists to prevent. `CODEBASE-MAP.md` was regenerated,
never hand-merged. `ci.yml` merged clean and both steps were **confirmed present afterwards** rather than
assumed.

## The verdict, and whose it is

**PASS**, reached over three rounds — **FAIL, then PASS, then PASS** — by an independent `reviewer` that did
not produce the work. Transcribed here by the orchestrator because someone must record it and neither the
engine that produced the work nor the engine that judged it may write this field.

**Every round was a single model family**, and the reviewer said so unprompted each time.
`risk: irreversible` nominally wants two distinct families; this runtime has none. That is a structural
limit on record, **not a satisfied bar** — the founder decides whether it suffices for harness self-edits.

The final round also checked **this file** at the same bar it applied to the code, because its author cannot.
Every checkable assertion verified true, including the `war-room/bin/PROJECT_NAME.tmpl` claim the
orchestrator had taken from a builder's report without re-deriving. That one came back **worse** than
written: `cmd_merge` is 782 lines in both the launcher and the template with only two placeholder
substitutions differing, the template holds **zero** occurrences of the verdict tool or any refusal path,
and the parity script everyone assumes guards this takes an *installed* launcher as its argument rather than
the template — while `check:warroom` only `bash -n`s the comparator and never runs it.

A fourth item landed after that PASS and was accepted **without another round**: three comment-only
corrections proven by stripping comments and blanks from both revisions and diffing — **zero differing
executable lines** in all three files. The sharpest of them is worth keeping visible: `verdict.mjs:24`
stated the subject anchor one way while `verdict.mjs:17` stated it another, **eight lines apart in the same
file**, introduced by the very commit that fixed that class one file over. It was found because the builder
did not stop at the single instance it was handed.

## Review history — FAIL, then remediation, then PASS

**Round 1: FAIL.** An independent reviewer found the gate bound the **branch diff**, not the **merge
result**. When tiers 1 and 2 failed, tier 3 piped the conflicted file to `claude --print`, wrote stdout
back, committed it to `main`, and logged `merge_complete … tier=full`. Reproduction showed worse than
alleged: the model's resolution kept only `main`'s side, **silently discarding the branch's reviewed line**,
then deleted the branch with `-d` because git considered it merged. The comment claiming the verdict bound
"the exact diff being merged" was written by this very work — the defect class CLAUDE.md names as
*a sentence that reads as enforcement while nothing checks it.*

**Remediation.** Tier 3 refuses unconditionally while the gate is in force — verified there is no ungated
path, so a conditional would be one that can never be false. `merge_complete` is now emitted only by tiers
1 and 2. The claim is narrowed at the point of citation. Three tests drive the real launcher and assert
`main` does not move; reverting the source fails exactly those three.

**Round 2: PASS**, with three new findings, all closed rather than filed because a gate PR should not ship
a known bypass:

1. **A total gate bypass.** `bin/warroom` let the *project being merged* supply `scripts/verdict.mjs`,
   contradicting its own comment. A three-line rubber stamp merged cleanly with **no verdict record at all**
   and `tier=rubber-stamp` logged — a value the classifier can never produce. Fallback deleted.
2. **The exclusion pathspec was too broad** — `.qa/verdicts/**` hid arbitrary files from both the subject
   hash and the tier classifier. Narrowed.
3. **Tier 1 overclaimed** when local `main` is behind `origin/main`: a fast-forward also lands the upstream
   range. Ancestral to `origin/main` and therefore already gated by the PR route, so the sentence was
   narrowed rather than a refusal added.

## The correction that matters most, because it was mine

I specified the narrowed pathspec as `:(exclude).qa/verdicts/*.json`. **That is wrong**, and the builder
measured it rather than following it:

```
:(exclude).qa/verdicts/*.json      -> .qa/verdicts/payload.sh keep.txt
:(exclude,glob).qa/verdicts/*.json -> .qa/verdicts/nested/deep.json .qa/verdicts/payload.sh keep.txt
```

Git's default pathspec wildcard matches `/`, so my spelling left `nested/deep.json` invisible to the subject
hash — **the same hole one directory down, inside the fix for that hole.** Only `glob` magic makes `*` stop
at a slash. Reproduced independently before acceptance. The deviation is pinned by its own test, so removing
`glob` fails exactly one named case.

## Honest limits

- **The verdict is hash-bound, not signed.** Anyone with repo write can author one. It cannot be moved to
  another diff or survive an edit to the one it approved; that is all it buys.
- **This route is the local merge only.** The PR route carries a *shadow* check that cannot fail the job.
  Promoting it, signing the check-run, and deleting the author grep is P0's remaining item.
- **Every review was a single model family**, and each said so unprompted. `risk: irreversible` nominally
  wants ≥2 distinct families; this runtime has no non-Anthropic model. Structural, and a founder decision.
- **Tier 3's body is retained but unreachable** — ~60 lines of dead code, deliberately left so that closing
  a security hole and deleting dead code stay separate reviewable acts.
- **`war-room/bin/PROJECT_NAME.tmpl` still carries the original tier 3 verbatim**, including the
  strategy-in-the-tier-field bug. Nothing compares the two launchers, so every generated project is still
  born with the hole this PR closes here.
