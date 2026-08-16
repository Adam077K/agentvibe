---
date: 2026-08-16
role: ceo
task: mc-tier-floor
tier: irreversible
qa_verdict: PASS
---

Closes **#34·#35**. `.claude/qa-tier-floor.yml` (+84) and `scripts/classifier.test.mjs` (+104). No other file.

**The gap:** no rule mentioned mission-control, so every path there classified `tier=lite · matched: (none — default)` — including the code deciding whose programs execute on this machine. **Four PRs were tiered by a human remembering to**, which this repository's own rules table calls a wish rather than a rule.

**What the rule does, verified against every tracked path rather than a sample:** exactly **24 of 707** paths change tier, all under `mission-control/`, all **upward** — 22 `lite→full`, 2 `lite→irreversible`. Zero paths outside mission-control change. **Zero change to `resolvers`, `required_claim_kinds` or `enforcement` anywhere**, so `ledger.mjs` is provably unaffected. Resulting mission-control distribution: 2 irreversible · 22 full · 28 lite · 1 trivial.

**The split is deliberate and the tree is NOT floored wholesale.** `server/**` is `full`; `server/config.ts` and `server/trust.ts` are `irreversible`; `client/**` and `test/**` are **explicitly matched at `lite`** rather than falling through to the default — a path that matches nothing and a path deliberately assessed as low-risk look identical otherwise. Flooring `client/**` at `full` would make a CSS edit a full-tier review, and a gate that fires on everything gets routed around.

**It reproduces every human judgement by mechanism, and corrects one.** #30, #32 and #41 → `full` (#41 carried **no label at all**); #48 → `full`; **#44 → `irreversible`**, which is stricter than the `risk:full` the CEO applied by hand. #44 created `server/trust.ts`, the allowlist deciding whose code may execute — **that PR would have been blocked by this rule**, which is the rule working on the one case a human got wrong.

**Everything ships `enforcement: shadow`** — all 53 mission-control paths, zero blocking. Nothing open gains a blocking requirement: #47 is irreversible before and after; #48 moves `lite→full`, and `full` is advisory at `qa-lead-pass.yml:252`.

**Review: PASS, no p1** — single anthropic model family, **not** the `independent: true` panel the `evidence` lens requires. 14 mutants, **13 killed**, sha256-anchored, each naming specific tests; the sole survivor (deleting the two documentary `lite` rules) was **declared in the test file before the reviewer found it** and is semantically inert. Max-across-set confirmed order-independent. `npm run check` exit 0 from a full clone.

**Three text defects and two coverage gaps were found and fixed.** Two counts were wrong (16→20 files, not 20→23; #44 added four server files, not three). A reason claimed *"six of eight collectors shell out to git"* — it is **two of eight** running git and **five of eight** exec'ing anything, including `node <script-in-a-found-repo>`; the sentence **overstated the count and understated the hazard**, and the true statement is the stronger argument. And `client/**`'s reason — *"no filesystem access, no process spawn"* — was **false for `client/vite.config.ts`**, which pins the other loopback binding for exactly the reason `server/config.ts` is floored; it is now `irreversible` by name. Likewise `test/gate.ts`, which the "Tests." reason was covering while its own header calls it *"THE machine gate, one implementation, the way `scripts/lib/classifier.js` is"* — `scripts/lib/**` is floored irreversible, and it is not a `.test.` file; now `full` by name. **Both gaps were reasons that did not describe the files they covered**, which is how a gap survives a reading.

**Known consequence, tested not assumed:** classifier floor `irreversible` → `qa-lead-pass.yml` **requires** the `risk:irreversible` label → its F13 step then requires **every** session file in that PR to declare `tier: full|irreversible`. So a PR touching `server/trust.ts`, `server/config.ts` or `client/vite.config.ts` now constrains unrelated session files in the same diff. Stricter, coherent, and the collision #42 named — this rule makes it reachable more often.

**This branch floors `irreversible` against itself** (the YAML matches its own path), so it carries `risk:irreversible` and this file declares `tier: irreversible`. Founder sign-off required; it cannot merge on a reviewer PASS.

**A CEO error worth recording:** the reviewer was briefed that this branch needed rebasing onto `85a9eb9`. It did not — `merge-base == origin/main`, ahead 3 / behind 0. The local `main` ref was stale at `a3189ed`, **41 commits behind**, and a builder had flagged that hours earlier while the CEO treated it as trivia. The stale ref has been synced.
