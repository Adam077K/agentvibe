---
date: 2026-08-29
role: builder
task: probe-visibility-and-empty-measure
qa_verdict: PASS
tier: full
risk: full
branch: integration/design-layer
commits: 3
---
# The probe measured what the browser never painted, and passed a page it never measured

**Both p1s were reproduced before the fix and re-run after it, in the conditions each one needs.** p1-1 required a real browser and got one — the armed sandbox SIGTRAPs Chromium, confirmed here (`exit 2`, the ENOLAUNCH refusal), so that one command ran escalated. p1-2 needs no browser at all. Nothing below is source-derived: every figure is from a run.

**p1-1 · the type/colour walk kept elements Chromium does not paint.** It filtered empty text and elements with children and nothing else, while the interactive-targets walk 24 lines above it in the same function already tested both the rect and the computed style — an inconsistency inside one function. Measured end to end against a page whose only visible text is one 14px paragraph: **before, `fontSize {"14":1,"16":3,"77":1,"88":1,"99":1}` and a p1 reading "4 of 5 rendered font-size value(s) appear in no token"; after, `{"14":1}` and exit 0.** The 16px x3 is `<title>`, `<style>` and `<script>` at the UA default, and no token file carries a size for `<title>` — so every run against every real page emitted a blocking finding naming a value nobody can act on.

**THE BRIEF SAID FIVE CASES AND THE STYLE GUARD ALONE COVERS FOUR OF THEM. The sixth element on that page is the one that matters and it was not in the brief.** Per-element computed style, measured in Chromium: `<title>`/`<style>`/`<script>` are `display: none` with a 0x0 rect — so the brief's assumption held and is now checked rather than assumed; `visibility: hidden` is `hidden` with a **390x180** rect; `display: none` is both. But **a child of a `display:none` parent computes `display: block`, `visibility: visible`, rect 0x0** — computed style inside a display:none subtree resolves to the element's own value, so the style test cannot see it and only the zero rect can. Neither half closes this alone, in either direction, and each is mutation-tested on its own. "Apply the same guard" was right; the same guard is two lines, not one.

**The negative control the brief required, run end to end in a real browser rather than argued.** The same page with its visible paragraph at 12.5px still produces the finding, and names **only** 12.5 with `nearest token 14px` — `1 of 1`, not `1 of 5`. A guard that had eaten the page would have reported nothing.

**p1-2 · a run that measured nothing reported `exit 0`, `"MEASURED — passed"`.** `conform()`'s `checked` flag reported only whether the token group was DECLARED. Against a token file declaring all five groups: a viewport that rendered nothing gave **findings 0 · gaps 0 · exit 0**, and `probe(url, { viewports: [] })` gave the same, with the artifact stating `{"fontSize":{},"lineHeight":{},"letterSpacing":{}}` in its own body. Both are **exit 3, INCOMPLETE** now: 3 gaps for the first, 1 for the second, which names the cause once (`axis: viewports`) instead of five times as its consequences.

**This is the fourth instance of one class in this file, so the fix extends the existing mechanism rather than standing a fourth one beside it.** `observed()` is one predicate, used by `conform()`, by `conformStrings()` and by `coverageGaps()`, so the finder and the verdict cannot disagree about what was checked. `buildArtifact`'s `unchecked` fallback now reads the run's own measurements too — it always read `{}`, so the prose could describe a different run from the one the gaps came from.

**Motion is deliberately excluded, and the line comes from this file rather than from me.** `GROUPS.mustObserve` is data, one word per axis. A gap is a hole this run could have closed: a page rendering no text means the walk kept nothing, which is closeable and is exactly what a bad render guard would cause; a page with no running animation is ordinary, and `getAnimations()` returns a transition only while it is mid-flight, so no re-run closes it — that is `UNCHECKED_ALWAYS`'s class, where it is already declared. Making it a gap would put every motionless page permanently at exit 3, and a near-constant verdict carries no information. Both directions are pinned, so flipping either is a red test.

**THE TWO DEFECTS COMPOSE, AND THE COMPOSITION WAS MEASURED, NOT REASONED ABOUT.** With the render guard in and the coverage fix reverted, a page that renders nothing visible reported **`✓ no blocking findings, and every axis was measured`, exit 0**, in a real browser. With both fixed it is exit 3. That is why they are one commit: the intermediate state is worse than either defect.

**Six surviving mutations closed, no source behaviour changed by them — the predicates were right and nothing was asking.** The WCAG bold branch had zero coverage in any direction (no fixture anywhere set `bold: true`); `floor = large ? 3.0 : 4.5` -> 2.5 survived because nothing sat between those values; `t.h < AA || t.w < AA` -> `t.h < AA` produced a byte-identical message because both of MC_NARROW's failures are height failures, so a 20x44 target would have been missed — the third instance of the two-alternative-predicate class here, and each alternative now has its own fixture; `EPS.em` and `EPS.ms` were pinned by nothing; `raw === ''` reads as redundant beside the isFinite test and is not, because `Number('')` is 0 and the letterSpacing token `ui-3` IS 0; `schema: 3` was asserted by nothing.

**Three figures the brief or the file carried were wrong, and are corrected in place.** The target-size count is **2 of 6**, not 4 — MC_NARROW's failures are `agentvibe` 44x18 and `no launcher` 81x15, both on height, and the comment claiming the 43px-tall nav items "fail on WIDTH (40px wide)" is wrong twice, since 40 is not below 24 and they fail nothing. The contrast fixture measures **4.415:1**, not the "2.85:1" its own assertion message claimed. And the count now sits inside the pattern: `/^2 of 6 below 24x24/`.

**`collect()` can be run in Node now, which nothing could do before.** It is serialised into the browser by `page.evaluate`, so it references nothing from module scope and the only assertion this file ever made about it read its source for a string. Its source is read and executed against a hand-built document, which turns "the guard is spelled correctly" into "the guard filters what it claims and keeps what it must". What that cannot prove — what Chromium computes for a `<title>` — is a browser fact, measured separately and carried into the fixtures rather than assumed by them.

**Verified:** `npm run check` -> **48 of 48 · 0 failed · exit 0** (248.7s, sandbox armed, `$?` read directly, not through a pipe). `design-probe.test.mjs` 66 -> **80 tests, 0 failed**. **28 mutants applied one at a time, 28 killed, 0 survivors**, source restored byte-identical after each; the battery includes the negative control where the guard filters everything, killed by the positive control. `scripts/lib/check-suite.js`, `.github/workflows/**` and `package.json` are untouched by this diff.

**The standing caveat applies and this verdict does not discharge it.** `qa_verdict: PASS` is author-recorded against a deterministic floor: one agent, one model family. No independent reviewer has seen these fixes.
