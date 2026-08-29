---
date: 2026-08-29
role: builder
task: probe-verdict-p1s
qa_verdict: PASS
tier: full
risk: full
branch: integration/design-layer
commits: 4
---
# The probe found the defect and its own verdict could not read it

**Both P1s were the same shape and both are measured before and after, not asserted.** (1) Every conformance finding carried `severity: p2` while `ok` gated on `p1`. Against the shipped `design/tokens/tokens.json` and the census this layer exists for — `fontSize {12.5:30, 11.5:13, 13.5:1}`, `lineHeight {1.625:27}` — the probe emitted **2 findings, both p2, ok:true, exit 0, "MEASURED — passed"** with 45 of 94 usages off-system. After: **2 findings, both p1, ok:false, exit 1, "MEASURED — failed"**. (2) `--tokens design/tokens/NOPE.json` produced zero findings and exit 0; `probe()` now throws `ENOTOKENS` before it resolves a browser, and the real CLI exits **2** with `state: REFUSED` in the artifact.
**The severity decision was taken deliberately, not defaulted.** A rendered value that appears in no token blocks: it is deterministic, it names the token to change to, and this layer's claim is that conformance can bind. The rejected alternative — keep p2 and widen the verdict — leaves p2 on a finding that blocks. Its consequence (every emitted check is now p1, so `rank()` sorts one class) is written into the header and is deliberately **not** pinned by a test, because that would pin a rule the file expects to retire.
**The transparent sentinel was wrong in both directions and both are pinned.** `rgb(51,51,51)` on an undeclared canvas read **1.662:1** against black where the truth is 12.635:1 — a false blocker; `rgb(240,240,240)` emitted **nothing** where the truth is 1.14:1 — a missed blocker. The canvas resolves to white in a light scheme, and to **null in a dark one**, because Chromium's dark canvas is a number nobody here has measured and guessing it rebuilds the defect facing the other way. Skipped pairs now reach `unchecked` with a count and a denominator.
**Three stated claims were narrowed to what is true, rather than patched to look true.** The `parseRgb` fork's "one-directional, strict superset" bound is false twice over — `rgb(1 2, 3, 4)` gives different triples and `rgb(1 x, 2, 3)` makes the *probe* the permissive one. The `craft` lens blocked at p1 on spacing and motion tokens that `tokens.json` does not declare. `design/INDEX.md` claimed `captures/` was gitignored with no rule and no directory; the rule exists now, before the directory, and `git check-ignore -v design/captures/x.png` resolves.
**Verified:** `npm run check` → **48 of 48 · 0 failed · exit 0** (199.4s, `$?` read directly, sandbox armed). `design-probe.test.mjs` 43 → **60 tests**, `design-lib.test.mjs` 17, `schema-lint` **18 pass · 0 fail · 0 warnings**, `classify.mjs` → **floor=full**. The sentinel rot-check was mutation-tested in a throwaway copy: changing `TRANSPARENT` alone turns it red.
**The standing caveat applies and this verdict does not discharge it.** `qa_verdict: PASS` here is author-recorded against a deterministic floor, one agent, one model family. The blinded reviewer who raised these three findings has **not** re-reviewed the fixes.
