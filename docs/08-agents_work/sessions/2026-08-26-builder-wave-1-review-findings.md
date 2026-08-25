---
date: 2026-08-26
role: builder
task: wave-1-review-findings
qa_verdict: PASS
tier: irreversible
risk: irreversible
branch: fix/wave-1-review-findings
commits: 9
---
# Three unenforced claims in one file, two of them satisfied by a comment
**Operator guard.** `;` `||` `|` and a one-hop wrapper each returned **0 findings** against `auditSuite`; only `&&` returned 1. `bash -c 'false ; true'` exits 0, so a `;` step leaves no red step at all. Now checked on the **resolved** command down the whole `npm run` chain, quote-aware, plus `&` and newline.
**Then this change broke the `check:mc` guard with its own new comment.** `invokes()` matched raw ci.yml text; the header added here spelled the command, so the **comment alone** satisfied coverage. Step deleted, comment left: **33 pass · 0 fail** (silent) → **32 pass · 1 fail `['check:mc']`**.
**Third claim, same file:** *"the grep is the check."* **There was no grep** — it held by luck. Its *"does not spell the string it searches for"* clause was a workaround for a grep that would match its own comment: the hazard was seen and the prose narrowed instead of the tool fixed. The comment now spells both strings and the check stays green — that is the demonstration, and it lives in `ci.yml`.
**Five `$HOME` hook cases skipped in the gate's own shell**, including the write that disarms every hook rule; `qa.js` runs the oracle locally and sets no `CI`. Neutral base + classified rejections (*hook-allows* fails, *unwritable* skips off CI): **166 pass · 0 skipped**, was 161 · 5.
**STATUS.md was false about the tree it ships in** — six passages, each true of `main` at `71fd58d`. Corrected beside the originals; recurrence fixed with a stated ordering rule.
**That rule's price is measured, not estimated: one re-commit per late change.** I broke it one commit after writing it, caught it, paid — then found the cause: §4 cited a tree sha, so *every* later commit falsified it. A line number in a different costume, structurally unfixable because STATUS.md can never name its own commit. Sha dropped for a re-derivation command; the rule should cost a pass when a change alters what STATUS *describes*, not merely because a commit exists.
Verified: `npm run check` → **43 of 43 · 0 failed · exit 0** · `test:check-suite` **34/34** (was 27) · `test:pre-tool-use` **166 · 0 skipped**. *(8 body lines against the ≤10 cap — which nothing enforces, and precedent runs to 21; observed anyway, on a branch about rules held up only by the sentence describing them.)*
