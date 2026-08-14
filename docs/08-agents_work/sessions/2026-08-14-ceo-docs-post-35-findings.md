---
date: 2026-08-14
role: ceo
task: docs-post-35-findings
tier: trivial
qa_verdict: PASS
---

Documentation only; no code touched. Records three new open items (#48 the untracked-directory false positive, #49 a 380 B margin asserted against 0 bytes, #50 the repo's only Category-1 duration assertion sitting in the one file nobody audited) and four corrections to claims previously written as settled.

**The corrections are the substance, and five of the day's errors were the CEO's.** #47's stated cause ("failed under ~200% CPU load") was an attribution nobody had tried to reproduce — 81/81 pass at load average 42, and the historical failures are 43×–190× beyond what contention produces. F3's 55 s clock margin was computed from a formatter's bucket width without checking whether anything reads the clock twice — 71/71 under a clock jumping 60 s per read, with the probe itself validated for non-vacuity first. F1's severity was structural rather than measured — one fixture is 333 ms, 6.7% of a 5 s budget, and the fix is declined because it would mask the marginal cases that are the only remaining evidence about #50. #48's severity was corrected by the author *against* the CEO's stated lean: `normal` is git's own default, so the collision is pre-existing and unconditional, and the fix is to force `all`, an **endpoint** of the domain and therefore one-directional by construction.

**A figure this repo published as VERIFIED and then falsified.** The suite was recorded at 168 s; that measured ~14 orphaned `bun -e while(true){}` spinners from #47's own load probe, still running 47 minutes later at load average 47. Killed: 77.2 s, and the cold call 14,345 ms → 2,372 ms. Corpus growth against `c-mission-control-cold-start` is therefore disproved (~4× headroom) — a hypothesis that was one step from being written down. Assertion totals are removed from both headline figures: two *identical* runs give 386 and 360.

**An Origin check is not the fix for the three RCEs, and calling it "no-regret" was a CEO error caught before it shipped.** Measured in a real browser (Playwright, attacker page on `localhost:4312`, target `127.0.0.1:4311`): `Origin` is **absent** on `<img>`, `<script>`, `<link rel=stylesheet>`, form GET and no-cors `fetch`; only CORS `fetch` sends it. A check must therefore allow absent, and every drive-by subresource vector passes — a guard satisfied while the property it protects is violated. `Sec-Fetch-Site` **is** sent on all of them and discriminates correctly, so reject `cross-site` and allow `same-origin`/`same-site`/`none`. Stated as "blocks cross-site browser requests", never "blocks drive-by": `same-site` is allowed, so anything else on loopback retains all three RCEs. The first run of this probe was invalid — both servers on `127.0.0.1`, so everything read `same-site` — and was redone before reporting.

Nine rules added to the handoff, the load-bearing ones being *an instrument left running becomes part of the environment it was measuring, and a teardown that prints its own success is not a teardown*; *forcing a value that is not an extreme of its domain is a clamp in both directions*; and *independent review as evidence rather than principle* — the author and the CEO each ran a mutation matrix over the same code, both asked the same incomplete question, and both called it verified.

Verification: `npm run check` **exit 0**, `bun test` **222 pass / 0 fail in 77.2 s at load 13.7→5.9** on `28626d8`. Classifier floor: `trivial` (docs only). No independent review; documentation of already-executed measurements, each cited to the command that produced it.
