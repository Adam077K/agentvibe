---
date: 2026-08-26
role: builder
task: wave-1-review-findings
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: fix/wave-1-review-findings
---
# Two P1s, and both of them were a comment satisfying a check

**The `&&` guard was depth-1 and operator-narrow.** Measured against `auditSuite`: `;`, `||`, `|` and a
one-hop wrapper each returned **0 findings**; only `&&` returned 1. `;` is the dangerous one — `bash -c
'false ; true'` exits 0, so a `;` step leaves no red step at all where `&&` at least reddens one. Now checked
on the **resolved** command, following the whole `npm run` chain, quote-aware (package.json's `usage` is a
`node -e "…;…"` one-liner whose semicolons separate nothing).
**Then this change broke the guard protecting `check:mc`, using its own new comment.** `invokes()` matched
the whole ci.yml text; the header paragraph added here spelled out `npm run check:mc`, so occurrences went
1 → 2 and the **comment alone** satisfied coverage. Scratch-copy proof, Mission Control STEP deleted and the
comment left: **33 pass · 0 fail** (silent) → **32 pass · 1 fail, actual `['check:mc']`** after the fix.
The self-proof was what hid it — it scrubbed the comment too, proving the guard bites on the wrong deletion.
**Five `$HOME` hook cases skipped in the gate's own shell**, including the write that disarms every hook
rule. `qa.js` runs `npm run check` as its oracle in a local agent shell and sets no `CI`. Fixed with a
neutral base (`~/.agentvibe`) and by classifying rejections: *hook-already-allows* fails, *unwritable* stays
a skip off CI. **166 pass · 0 fail · 0 skipped**, was 161 · 5 skipped.
**STATUS.md was false about the tree it ships in** — six passages, each correct for `main` at `71fd58d`.
Corrected in place beside the originals, every figure re-derived here, and the recurrence fixed with a
stated ordering rule: STATUS is written in the **last** commit, after the merges.
Verified: `npm run check` → **43 of 43 passed · 0 failed · exit 0**; `test:check-suite` **33/33** (was 27).
