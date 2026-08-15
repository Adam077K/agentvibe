---
date: 2026-08-15
role: ceo
task: cold-start-assertion
tier: lite
qa_verdict: PASS
---

Closes **#50**. `server/index-store.ts` gains a counting seam; `test/live.test.ts`, `test/units.test.ts` assert on it; `test/perf.test.ts` comment only.

**The assertion no longer reads the clock, because two candidate designs that did were built, measured and rejected.** A control-ratio in the repo's own `stallGateVerdict` shape gave an **8.58× ratio spread against a 1.90× raw spread** — directory sizes are skewed, so the small half stays cache-resident while the big one does not — and a fixed 0.5 GB slice rate spanned **2.07× across sessions** while averaging 330 KB/file against the corpus's 1.2 MB. The constraint both prove: *any assertion tight enough to catch a 2× code regression will also fire on machine state; any loose enough to survive machine state cannot catch 2×.* The old 10 s line sat **inside** the observed 2,158–12,610 ms spread, which is the worst of both.

**What is asserted instead is deterministic:** every transcript read exactly once, bytes read equal corpus bytes. `RefreshResult` carries `filesRead`, `distinctFilesRead` and `bytesRead`; `corpusSnapshot()` walks the filesystem separately. **The byte figure is genuinely independent** — read-side `byteLength` versus `statSync` — and the file **listing is not**, because both sides call `listTranscripts` (measured identical at 2,536, set-difference 0), so the count assertions check *traversal* and not *discovery*. That narrowing is stated in the file rather than left to a reviewer to discover.

**Three measurements justify the redesign, each executed.** Truncating reads to 64 KB took cold **2,267 → 752 ms — three times faster while reading 5% of the corpus**. Duplicating a directory landed at **982 ms/GB, inside the healthy 736–1,786 band**, because the wasted work scales the denominator too. And the compound case is sharpest: a stat-derived byte counter **plus** a 10-character reader reports **3.04 GB at 996 ms/GB — an entirely ordinary rate, over a corpus it never read.** A ceiling cannot see a reader that stopped reading.

**Review: PASS, correctness lens, no p1, single anthropic model family** — not the ≥2-model-family panel the `adversarial` lens requires, and no review in this phase has been. It re-measured the route independently (730–765 ms/GB, n=6), confirmed both stated ratios, and confirmed the warn path prints true **deltas** rather than `vm_stat`'s cumulative-since-boot totals.

**Its one unclaimed finding was the load-bearing one: the byte oracle's independence was unpinned.** Changing `index-store.ts` to `this.bytes += st.size` turned the oracle into stat-vs-stat and **nothing went red** — and with that line changed, truncating every read also passed, because the rate assertion is a ceiling and not a floor. Now pinned by a transcript containing `0x80`, a lone continuation byte that `readFileSync(…,'utf8')` renders as U+FFFD — three bytes where the file holds one — so the decoded count and `st.size` *cannot* agree. Mutations **N9** (stat-derived bytes) and **N10** (N9 plus a 10-character reader) each die on this pin **and on nothing else**.

**The calibration correction is the most transferable thing here.** The ceiling was first set at 3,000 ms/GB against `buildCold` (660–700 ms/GB), then re-measured against the **route actually being asserted on** — which also pays discovery, the slice hash and a JSON round-trip — at 736–1,786 ms/GB. **3,000 would have sat inside the noise band, the exact mistake the 10 s line made.** It is 5,000, firing at ≥6.8× the warm floor, and the comment states plainly that it does **not** catch 2×.

**A warn at 2,500 was chosen deliberately and its promotion declined.** The unexplained 12,610 ms event is ≈4,162 ms/GB; the fail line sits above it on purpose, so a pathological run prints its pageins and swapout deltas **and still passes**. Turning it red would report machine state as code quality one more time, inside the assertion built to stop doing that. The comment records that promotion was proposed and declined, and — unprompted — **the bar for revisiting it: not recurrence, but the diagnostic showing the cause is in the code.**

**Gaps recorded rather than closed:** N1, a second `readFileSync` of the same path inside `readFull`, is invisible to the counters by construction — no counter can force future code to increment it. N7, counting a failed read, is unreachable without an unreadable transcript. `bytesRead` is decoded text against `st.size` on disk; they agree only for valid UTF-8, and 0 of 2,536 real files diverge today. `perf.test.ts` is deliberately untouched, with the reason recorded so the next reader does not mistake two differently-shaped duration assertions for an oversight.

**One CEO error, corrected in the file rather than silently:** the `perf.test.ts` comment's *"a 2.5× multiplier on 12 ms is 18 ms"* was my sentence and 12.1 × 2.5 = 30, alongside "six orders of magnitude" where the real figure is ~2.5. The conclusion never changed, **which is exactly what made the numbers easy to repeat — a figure supporting the right answer gets checked least.** Separately, the builder declined an instruction of mine correctly: told to put the reviewer's two measurements in the file, it re-ran them, obtained different figures because they were different mutation shapes, and used its own.

**Merged on the `b8e12d7` review PASS without a second pass, and the justification is narrow:** `b8e12d7..d4beffc` is **92 insertions and 3 deletions across three test files with `index-store.ts` bit-identical**, and the new pin is proven by its own mutations. That is the one case where a prior PASS carries — the mechanism is unchanged — and not the general claim that test-only changes are safe.

`node mission-control/check.mjs` exit 0 · **228 pass / 0 fail**. Classifier floor `lite`.
