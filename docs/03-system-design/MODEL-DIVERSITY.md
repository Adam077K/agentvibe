# Model diversity — does a second family buy independent judgement, and is Codex worth $20/month?

**Date:** 2026-08-15 · **Status:** recommendation, not yet decided

**Subject:** `review-lenses.yml:44, 57, 83` · the `full` tier's "Codex CLI second opinion"
(`CLAUDE.md:152`) · and the open decision that appears twice under two numbers —
**[AGENT-ARCHITECTURE.md:990-996](AGENT-ARCHITECTURE.md) open decision #3** ("Second model family, or
delete the independence claim?") and **[ROSTER-SIZE.md:707-712](ROSTER-SIZE.md) D7** ("The second
model family"). They are the same question and they reach opposite recommendations — D7 says *build
the resolver*, #3 says *decide*. §1.4 below settles it by measurement rather than by argument.

> This file carries **no `claims` block**. Every measurement below was taken by running a command on
> this machine on 2026-08-15 and the command is printed next to its output, so the assertions are
> reproducible. A claim block would require regenerating `.claude/ledger/index.json`, which is a
> generated file outside this document's write scope. The three claims that should be added when
> someone regenerates it are named in §11.

---

## 0. THE ANSWER

**Do not buy Codex. Not now, and the reason is not money.**

**Strike `independent: true` from the three lenses — and in the same change, replace the predicate
with one this repo can actually enforce.** Independence by **provenance** (the judge did not see the
producer's reasoning or the producer's claims about its own work), not independence by **vendor**.

The one-sentence disagreement rule, since a rule that ends at "ask the founder" is not a rule:

> **A second judge may only turn `PASS` into `BLOCK`, never `BLOCK` into `PASS`; disagreement
> therefore resolves to the stricter verdict with no adjudication round, and the founder is reached
> only through the false-positive appeal path the gate already has.**

The strongest single piece of evidence, and it points *away* from buying a vendor:

> Framing alone — telling a reviewer the code is believed correct — collapsed vulnerability detection
> from **97.2% to 3.6%** on GPT-4o-mini and **68.4% to 8.5%** on Claude 3.5 Haiku across 250 CVE
> patch pairs. Redacting that framing recovered detection to **94–100%**.
> ([arXiv:2603.18740](https://arxiv.org/html/2603.18740v1), accessed 2026-08-15)

`qa.js:92-94` instructs **two of this repo's three adversarial verifiers to assume the finding is
false**. That is the measured 60–94-point failure mode, written into the gate as its design, on one
model family, three times. Buying a second vendor without deleting those two prompts is buying a
second opinion about a question the panel has already been told the answer to.

---

## 1. What is true in this repo today — measured, not recalled

All commands run 2026-08-15 in `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-2-1786445435`.

### 1.1 The predicate, and the three lenses that cannot satisfy it

| Fact | Evidence |
|---|---|
| `independent: true` on `security`, `adversarial`, `evidence` | `.claude/review-lenses.yml:44, 57, 83` |
| Each declares `model_families: [anthropic, openai]` | `.claude/review-lenses.yml:45, 58, 84` |
| The predicate: ≥2 **distinct model families**, "one family agreeing with itself is one opinion" | `scripts/lib/claims.js:425-430` |
| Enforced for lenses at lint time | `.claude/hooks/schema-lint.js:595-598` |
| The same function enforces `risk: high` claim panels | `scripts/lib/claims.js:498-501`, `scripts/lib/resolvers.js:~336` |
| The lint **passes today** — because it reads the *declaration*, not the runtime | `schema-lint.js:593` reads `l.model_families`, which is a string list nothing cross-checks against a configured runtime |

That last row is the defect. The predicate is satisfied by *writing the word `openai` in a YAML
list*. There is no configured OpenAI runtime, so the lens advertises a property the system cannot
deliver and the linter certifies it. This is the same class as the `mcpServers:` declaration that
[CLAUDE.md](../../CLAUDE.md) records all 52 agents making against zero MCP configuration.

### 1.2 Judge claims

```
$ node -e '...' .claude/ledger/index.json
judge claims: 2
  c-read-only-binding-unverified        risk=high judged_by=[]  docs/03-system-design/CLAIM-LEDGER.md
  c-sessionstart-injection-unverified   risk=high judged_by=[]  docs/03-system-design/CLAIM-LEDGER.md
total claims in index: 31
```

**Correction to [AGENT-ARCHITECTURE.md:990](AGENT-ARCHITECTURE.md)**, which says "all four judge
claims": the built index holds **two**, both `risk: high`, both `judged_by: []`. The other two
`verified_by: judge` blocks are in `docs/03-system-design/IMPLEMENTATION-PLAN.md:554, 568` — an
untracked file not in the index. The substantive point is unchanged and stronger than the count
suggests: **the independence guard at `claims.js:498` has never executed once**, because it only
fires when `judged_by` is non-empty.

### 1.3 The QA gate is one family, three times, and two-thirds of it is instructed to dismiss

```
$ grep -n "model: '" .claude/workflows/qa.js
122:  reviewDim       … model: 'sonnet'
132:  verifyFinding   … model: 'sonnet'   ← ×3 per finding
180:  sweep round     … model: 'sonnet'
199:  judge           … model: 'opus'
```

Five dimension reviewers, three adversarial verifiers per block-eligible finding, one binding judge.
**Every one is Anthropic.** The `full` tier's advertised "Codex CLI second opinion"
([CLAUDE.md:152](../../CLAUDE.md)) has no dispatch anywhere in `.claude/workflows/`.

And the three verifier prompts (`qa.js:92-94`) are not three perspectives — they are one perspective
and two instructions to dismiss:

```js
'Try hard to REFUTE this finding. Default to is_real=false unless the defect is unambiguous…'
'Reproduce the claim against the real diff. … Is the defect actually present and reachable?'
'Assume the finding is a false positive. Look for the guard, validation, or context that makes it a non-issue.'
```

`verifyFinding` (`qa.js:135-137`) requires a **strict majority real out of ≥2 votes**. So a genuine P1
must win 2-of-3 from a panel where two members were told to start at "not real", on a model family
whose sibling loses ~60 points of detection under exactly that framing (§0). This is a
mechanism-level explanation for **34 PASS, 0 BLOCK** ([CONTROL-PLANE.md:120, :975](agents/CONTROL-PLANE.md))
that is more specific, and more fixable, than "the gate is uncalibrated".

**This defect is free to fix and a second vendor does not fix it.**

### 1.4 What is actually installed — and this overturns [ROSTER-SIZE.md:707-712](ROSTER-SIZE.md)

D7 states: *"`gemini` 0.38.2 and `ollama` (kimi-k2.5, glm-5) are on this machine's PATH today… build
the resolver (~20 lines at `resolvers.js:307`)."* On PATH, yes. **Callable, no — all three refuse to
serve, as of 2026-08-15:**

```
$ which codex
codex not found

$ gemini -p "Reply with exactly: PONG"
IneligibleTierError: This client is no longer supported for Gemini Code Assist for individuals.
To continue using Gemini, please migrate to the Antigravity suite of products.

$ echo "…" | ollama run glm-5:cloud
Error: glm-5 was retired at 2026-07-15 00:00:00 -0700 PDT

$ echo "…" | ollama run kimi-k2.5:cloud
Error: kimi-k2.5 was retired at 2026-07-31 00:00:00 -0700 PDT

$ env | grep -c '^\(OPENAI\|GOOGLE\|GEMINI\|OLLAMA\|DEEPSEEK\)_API_KEY='
0
```

`Antigravity.app` is installed in `/Applications`, but it is a GUI IDE — there is no `antigravity`
binary on PATH, so it cannot be a CI or workflow dispatch target.

**Therefore:** building D7's resolver against the runtimes D7 names would produce a resolver that
returns `unresolved` on every call. That is at least honest under Rule 10 — but it is a day of work
for a mechanism that cannot fire. **D7's premise expired between it being written on 2026-08-14 and
being checked on 2026-08-15.** Any second family is a *new purchase*, not an existing asset.

---

## 2. Correlated errors — does sampling one model N times give N pieces of evidence?

**No. This is the best-supported finding in the whole review.**

### STRONG — [Correlated Errors in Large Language Models](https://arxiv.org/abs/2506.07962) · ICML 2025 · accessed 2026-08-15

Over **350 LLMs**, two leaderboards plus a resume-screening task. Findings:

- "on one leaderboard dataset, models agree 60% of the time when both models err"
- "larger and more accurate models have highly correlated errors, **even with distinct architectures
  and providers**"
- Correlation is higher for same-developer and same-base-architecture models
- Explicitly evaluates the downstream effect on **LLM-as-judge evaluation**, and frames the general
  risk as **algorithmic monoculture**

**The uncomfortable implication for the buy-a-vendor plan.** The strongest non-Claude coding model is
the *most correlated* non-Claude coding model, because correlation rises with accuracy. Purchasing
frontier-vs-frontier buys the smallest diversity increment available at that price. A weaker,
architecturally distant model is a *better* independence purchase and a worse reviewer — that tension
is not resolvable by spending more.

### STRONG — [Too Consistent to Detect](https://arxiv.org/abs/2505.17656) · EMNLP 2025 Main · accessed 2026-08-15

Self-consistent errors — "LLMs repeatedly generate the same incorrect response across multiple
stochastic samples":

- "the frequency of self-consistent errors **remains stable or even increases**" with scale, unlike
  inconsistent errors which diminish
- "All four types of detection methods significantly struggle to detect self-consistent errors"
- The fix that worked: a **cross-model probe** fusing evidence from an external verifier LLM

This is the precise shape of the failure a same-family panel cannot see: the errors that survive
scaling are exactly the ones every instance of the family makes identically. Three Sonnets voting on
a Sonnet-shaped blind spot return 3–0 with high confidence, every time.

### MODERATE — [When Agents Disagree](https://arxiv.org/html/2603.20324v1) · arXiv, 2026-03-20 · accessed 2026-08-15

42 tasks × 7 categories, N=210 trials. Generators: Claude Opus / GPT-5.4 / Gemini 2.5 Pro (diverse)
vs Claude Opus ×3 (homogeneous). Judges: Claude Sonnet, GPT-5-mini, DeepSeek-V3p2.

| Condition | Win rate vs single-model baseline |
|---|---|
| Diverse team + judge selection | **0.810** [0.768, 0.851] |
| Homogeneous team + judge selection | **0.512** [0.500, 0.530] — indistinguishable from chance |

Δ = +0.298, Hedges' g = 2.71. And the detail that matters more than the headline:

> "When three copies of the same model receive the same prompt at T=0.7, they generate functionally
> identical outputs." Independent judges returned **ties on all 756 pairwise verdicts** for the
> homogeneous cell.

**Weigh this carefully.** Single-author preprint, N=210, and g=2.71 is an implausibly large effect
that usually signals a ceiling or a floor rather than a phenomenon. It is also *about generator
diversity feeding a judge*, not about judge diversity — this repo's question is the latter. Treat
"756 ties" as the durable part: within-model sampling produced nothing for a selector to select
between. Treat 0.810 vs 0.512 as directionally right and numerically unreliable.

This is also the source of the "0.810 / 0.512" figure quoted at [ROSTER-SIZE.md:710](ROSTER-SIZE.md)
without attribution — it is worth attaching the citation and the caveat there.

### Verdict on §2

**Sampling one model N times is not N pieces of evidence.** Between 60% co-error among frontier
models, self-consistent errors that grow with scale, and 756/756 ties in the homogeneous cell, the
repo's own sentence — *"one family agreeing with itself is one opinion"* (`claims.js:429`) — is
correct and well supported. The predicate is right about the disease. **It is wrong about the cure**,
because vendor identity is a weak proxy for error independence when correlation persists across
providers.

---

## 3. Multi-agent debate and LLM-as-judge — where it helps, where it hurts

### Where it demonstrably helps

- **Cross-model verification, not self-verification.** [When Does Verification Pay Off?](https://arxiv.org/pdf/2512.02304)
  (Lu, Teehan, Jin, Ren; accessed 2026-08-15): verification helps in an intermediate accuracy regime;
  "using a **weaker verifier can sometimes outperform stronger ones**" because capable models
  overestimate their own correctness; cross-model verification beats self-verification. It also warns
  that "blind application can degrade overall system performance" — verification is not free upside.
- **Repeated independent passes with an aggregator, for recall.** The "Multi-Review" line of work
  (Sept 2025, reported via [Zylos Research](https://zylos.ai/research/2026-03-01-multi-model-ai-code-review-convergence/),
  accessed 2026-08-15) measured Gemini-2.5-Flash at n=10 independent passes reaching +43.67% F1 and
  **+118.83% recall** over single-pass, plateauing at n≈5–10. Note the shape: this is *same*-model
  repetition helping **recall** (finding more candidates), which is a different job from
  **precision** (deciding whether a candidate is real). Same-model repetition is defensible for the
  first and near-useless for the second — which is precisely the split this repo has backwards.

### Where it is neutral

- **Debate among identical models.** Homogeneous debate behaves as a martingale over expressed
  beliefs and "cannot surpass the accuracy of majority vote in expectation"
  ([Demystifying Multi-Agent Debate](https://arxiv.org/html/2601.19921v3), accessed 2026-08-15). If
  debate cannot beat voting, the debate machinery is pure cost.

### Where it actively hurts

- **Confirmation bias from framing** — [Measuring and Exploiting Confirmation Bias in LLM-Assisted
  Security Code Review](https://arxiv.org/html/2603.18740v1) (arXiv 2026-03-19, accessed 2026-08-15).
  250 CVE vulnerability/patch pairs; XSS, SQLi, buffer read/write.

  | Model | Neutral framing | "Believed secure" framing | Drop |
  |---|---|---|---|
  | GPT-4o-mini | 97.2% | 3.6% | **−93.5pp** |
  | Claude 3.5 Haiku | 68.4% | 8.5% | −59.9pp |
  | DeepSeek V3 | 96.8% | 53.8% | −42.9pp |
  | Gemini 2.0 Flash | 95.5% | 79.4% | −16.2pp |

  Asymmetric: false negatives explode, false positives barely move. Against an autonomous agent
  (Claude Code) the attack succeeded **88%** of the time. **Metadata redaction and explicit
  instructions to ignore contextual signals recovered detection to 94–100%.**

  Read the last row of that table and the last sentence together. Gemini lost 16 points where
  GPT-4o-mini lost 93 — a **six-fold spread across vendors** — yet redaction recovered *every* model
  to near-ceiling. **The intervention that works is on the input, not on the vendor.**

- **Judge biases.** Self-preference adds roughly 10–25% uniform bias
  ([arXiv:2410.21819](https://arxiv.org/pdf/2410.21819)); position, verbosity, format and
  calibration drift are the other four named biases, and position bias is fixed mechanically by
  shuffling rather than by adding judges ([Justice or Prejudice?](https://arxiv.org/pdf/2410.02736),
  both accessed 2026-08-15).

- **Multi-agent systems in general.** [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657)
  (NeurIPS 2025 D&B; 150 traces, κ=0.88; MAST-Data 1600+ traces, 7 frameworks): "**Despite enthusiasm
  for Multi-Agent LLM Systems, their performance gains on popular benchmarks are often minimal.**"
  14 failure modes in 3 categories — system design, inter-agent misalignment, and **task
  verification**. The third category is this repo's entire QA gate.

---

## 4. The distinction the founder asked for: theatre vs. evidence

This is the core of the report, so it gets a test rather than an adjective.

**A panel produces genuinely independent evidence only where the second opinion could have been
wrong for a *different reason* than the first.** Everything else is one opinion with more voters.

Four sources of genuine independence, ranked by what this repo can actually get:

| # | Source of independence | What it breaks | Enforceable here? | Cost |
|---|---|---|---|---|
| **P** | **Provenance** — the judge never saw the producer's reasoning, framing, or self-assessment | Anchoring, sycophancy, self-preference, confirmation bias | **Yes, today** — fresh `agent()` spawn, findings as `JSON.stringify` data (`qa.js:100`), no producer claims in the prompt | **$0** |
| **M** | **Method** — the check is executed, not judged: exit codes, greps, type checks, fetched quotes | *All* LLM correlation, because no model is in the loop | **Yes, today** — `resolvers.js:243-293` already does this; `CONTROL-PLANE.md:3.16` lists four more | $0 |
| **F** | **Framing** — the same artifact judged against a different rubric with a different failure definition | Rubric blind spots | **Yes** — this is what `review-lenses.yml` is *for*, and `qa.js:72-78` currently ignores it | $0 |
| **V** | **Vendor** — a different pretraining corpus and RLHF regime | Family-specific self-consistent errors (§2) | **No** — nothing is provisioned (§1.4) | $20/mo + ops |

**P, M and F are all unbought, all enforceable, and all larger in measured effect than V.** V is real
— §2 establishes that — but it is the fourth-best independence available here and the only one that
costs money.

**The tell for theatre**, stated as a check anyone can run against a proposed panel: *if I change one
judge's vote at random, does the verdict change for a reason connected to the artifact?* Three Sonnets
voting on a Sonnet blind spot fail this — their votes are one draw, replicated. Two of three verifiers
told to assume "not real" fail it worse: their votes are one *instruction*, replicated.

**And the honest limit on P.** Provenance independence does **not** break family-level self-consistent
errors. A blinded Sonnet still shares Sonnet's blind spots with the Sonnet that wrote the code
(§2, EMNLP 2025). Anyone claiming otherwise is overselling the cheap fix. What P buys is the
60–94-point framing loss back, which is a bigger number than any measured cross-vendor delta —
and it buys it for nothing.

### MODERATE-to-WEAK — [Cross-Context Review](https://arxiv.org/html/2603.12123) · arXiv 2026-03-12 · accessed 2026-08-15

The only direct measurement of P I found. 30 artifacts, 150 injected errors, 360 reviews, Claude
Opus 4.6 throughout.

| Condition | F1 | vs CCR |
|---|---|---|
| Cross-Context Review (fresh session, artifact only) | 28.6% | — |
| Self-Review (same session) | 24.6% | p=0.008, d=0.52 |
| Repeated same-session review | 21.7% | p<0.001, d=0.72 |

Critical errors: **40% detected vs 29%** for self-review. Its own stated limitation, which I am not
going to hide: single author, one model, no cross-vendor arm — the paper cannot tell you whether a
blinded same-family reviewer matches a different-family one. **Nobody has published that comparison.**
It is the experiment this repo is unusually well placed to run (§9).

Note also the absolute numbers: **28.6% F1 is not a gate you trust unsupervised.** The best
provenance-independent reviewer in that study missed most injected defects. That is an argument for
the seeded-defect corpus, and against believing any of this without one.

---

## 5. Codex specifically

### What it is genuinely good at, as of 2026

Sourced from vendor and comparison publications — **weaker evidence than §2–§4**, since benchmark
comparisons are marketing-adjacent and I could not reproduce any of them. All accessed 2026-08-15.

- Terminal-Bench 2.0: GPT-5.5 **82.7%** vs Claude **69.4%** — Codex leads clearly on shell and
  system-level work ([morphllm comparison](https://www.morphllm.com/comparisons/codex-vs-claude-code))
- SWE-bench Verified: **88.7% vs 88.6%** — a tie
- SWE-bench Pro: Claude Opus 4.8 **69.2%** vs **58.6%** — Claude leads on harder multi-file reasoning
- GPT-5-Codex "is the default for cloud tasks and **code review**" ([OpenAI](https://openai.com/index/introducing-upgrades-to-codex/))
- Reported ~40% more token-efficient on Codex-shaped tasks; blind preference studies reported
  favouring Claude's code quality ~2:1

**Read as a purchase decision:** Codex is roughly at parity on the axis this repo needs (judging a
diff) and ahead on an axis it does not (terminal throughput). Nothing here suggests Codex catches a
*class* of defect Claude misses — only that it is a different draw. Which is the whole question.

### Different training, or merely different sampling?

**Different training, and it matters — but less than the predicate assumes.** §2's ICML result is
decisive on this: error correlation persists "even with distinct architectures and providers", and
*rises* with accuracy. Different training buys a genuinely different draw; it does not buy an
independent one. The honest expected value of adding GPT-5.x to a Claude panel is *some* decorrelation,
unmeasured on this repo's actual defect distribution, on an instrument (§1.3) that has never refused
anything and therefore has no baseline against which the improvement could be seen.

**Spending $240/year to improve an unmeasured number by an unmeasured amount is the defect class this
repo exists to eliminate.** It is the same shape as `model_families: [anthropic, openai]` itself: a
declared capability with nothing behind it. Buying the capability without building the measurement
converts a documentation defect into a subscription.

### The narrow role it *would* play, if provisioned

Not "review the diff" — that is where correlation is highest and where Claude is already ahead
(SWE-bench Pro). The defensible role is the one the panel cannot do for itself:

> **Adjudicate the confirmed-findings set at `irreversible` tier only, reading the diff and the
> findings but never the producer's reasoning, with authority to add a BLOCK and none to remove one.**

That is one call per irreversible PR — a handful per month — and it targets the one number that is
provably broken (0 BLOCK in 38 verdicts) rather than adding capacity to a stage that already works.

### Operational cost beyond the money

| Cost | Reality here |
|---|---|
| Second key | This machine currently has **zero** model API keys in env (§1.4). The first one is a new secret-handling posture, and `pre-tool-use.sh` blocks `.env` writes — deliberately |
| Second CLI | `codex` not installed; a new binary in the workflow's critical path |
| Second failure mode | Must resolve to `unresolved`, never `pass` (Rule 10, `ledger.test.mjs`). An outage at 2am on an irreversible PR must not silently downgrade the gate |
| Data egress | Full diffs to a second vendor. Currently a one-vendor decision; becomes a two-vendor decision, and reversing it does not un-send |
| Latency | +60–120s serial at irreversible tier. Acceptable at that frequency |
| Disagreement | Solved by §7's asymmetry, at the price of a higher BLOCK rate |
| Rot | §1.4 is the warning: three candidate runtimes died within ~5 months. A second family is a **maintained dependency**, not a purchase |

### Money, precisely

- **Codex:** ChatGPT Plus **$20/mo** covers Codex CLI, web, IDE. CLI and web draw the same 5h pool —
  the CLI is not a side door ([UI Bakery](https://uibakery.io/blog/openai-codex-pricing),
  [CloudZero](https://www.cloudzero.com/blog/openai-codex-pricing/), accessed 2026-08-15). API-key
  sign-in bills pay-as-you-go instead.
- **Ollama Cloud:** Free = 1 concurrent cloud model, light usage; Pro **$20/mo**
  ([pooyagolchian](https://pooyagolchian.com/blog/ollama-cloud-pricing-hardware-requirements-2026/),
  [devtoolhub](https://devtoolhub.com/ollama-cloud-free-vs-pro-limits-pricing-2026/), accessed
  2026-08-15). **The free tier is plausibly sufficient for a gate firing a few times a month** — and
  it is the cheapest way to satisfy vendor-independence if the founder wants it anyway. Its cost is
  reviewer quality: an open-weights model at the `security` lens will produce more noise than
  GPT-5.x, and §1.3 says this gate's problem is a panel that dismisses too much, not too little.

### The rate-limit argument from [AGENT-ARCHITECTURE.md:990-996](AGENT-ARCHITECTURE.md)

*"a non-Claude call consumes zero headroom in the rolling 5h window."* **True, and it is the only
admissible pro-vendor argument, but it argues for the wrong thing.** Headroom pressure comes from
*volume* — the five dimension reviewers and up to 40×3 verifier calls — not from the one binding
judgement. Offloading judgement saves one call. Offloading volume would save a hundred, and would put
the weaker model exactly where §5 says it is worst. If headroom is the binding constraint, the fix is
`CONTROL-PLANE.md:3.16`'s deterministic helpers — run lint and typecheck *before* the reviewers so
they stop spending model calls on what `tsc` already said — not a second subscription.

---

## 6. The recommended workflow

Ordered by measured effect per dollar. **Steps 1–3 cost nothing and are the whole recommendation.**

### Step 1 — Fix the verifier panel (`qa.js:92-94`) · **the single highest-value change in this document**

Replace two dismiss-by-default lenses with three genuinely different failure definitions, none of
which pre-commits to a verdict:

```
0. Reproduce it. Read the cited file and line. Is the defect present and reachable on a real path?
1. Reach it. Name a concrete input and call path that triggers it, or state that none exists.
2. Guard it. Name the specific validation, type, or invariant that already prevents it — by file:line — or state that none exists.
```

Every lens now demands a **locatable artifact** — a path, an input, a guard at a line — instead of a
prior. Lens 2 keeps the false-positive pressure the current design wanted, but makes it *pay* for the
dismissal. Per §3's 60–94pp framing effect, this is the largest available improvement to detection in
the entire system and it is a prompt edit.

**Tier:** `.claude/workflows/**` currently falls to `DEFAULT_TIER` — see `CONTROL-PLANE.md:3.17` Step 1,
which flags this as wrong. Classify before editing: `node scripts/classify.mjs .claude/workflows/qa.js`.

### Step 2 — Make provenance independence a checkable predicate (§8)

### Step 3 — Build the seeded-defect corpus (`CONTROL-PLANE.md:3.15`)

Twenty planted defects; measure detection before and after Step 1. **This is the precondition for
every later decision in this document**, including whether §5 was right. Without it, the second-vendor
question is unanswerable in principle: you cannot detect a lift in a number you have never measured.
`CONTROL-PLANE.md:975` already says no code change fixes this. It is right.

### Step 4 — Deterministic checks before model checks (`CONTROL-PLANE.md:3.16`)

Lint, typecheck and tests run *before* reviewers. Source **M** independence at zero correlation and
zero cost, and reclaims the rate-limit headroom §5 discusses.

### Step 5 — Read `DIMENSIONS` from `review-lenses.yml` (`CONTROL-PLANE.md:3.16`)

Six lenses currently have no binding path. This is source **F** independence, already written, not
wired. It also makes `independent:` mean something at runtime for the first time.

### Step 6 — *Only after Step 3 produces a baseline* — evaluate a second family

Re-run the corpus with a non-Claude adjudicator on the confirmed set. **Ship it only if it finds
defects the Claude panel missed, at a false-positive rate the founder will actually tolerate.**
Given §1.4, provision on the day of the experiment, not before — runtimes rot in months here.

---

## 7. The disagreement-resolution rule

> **A second-family judge may only turn `PASS` into `BLOCK`, never `BLOCK` into `PASS`. Disagreement
> resolves to the stricter verdict immediately, with no adjudication round and no third model.**

**Why an asymmetry and not a vote.** A tie-break by majority needs a third judge, and a third judge
needs its own independence argument — the problem recurses. The asymmetry terminates it: no tie is
possible, because agreement is not required for a decision. This is also not a new invention here —
it is the rule `qa.js:210-217` already applies to the Opus judge, recorded at
[CONTROL-PLANE.md:339](agents/CONTROL-PLANE.md): *"the judge can only turn a PASS into a BLOCK, never
the reverse."* Extending the existing asymmetry costs one line and no new concept.

**Why strictness is the right default here specifically.** The failure costs are asymmetric by two
orders of magnitude. A false BLOCK costs one logged appeal. A false PASS on an `irreversible` change —
a migration, a workflow file, an agent definition — is the class this repo carves out from shadow
mode precisely because `git revert` does not undo it ([CLAUDE.md](../../CLAUDE.md), Shadow mode). And
the empirical prior is one-directional: **38 verdicts, 0 refusals.** A rule that can only add refusals
is aimed at the only error this gate has ever demonstrably made.

**The founder is reached exactly once, through a path that already exists:** the logged,
finding-by-finding false-positive appeal at `qa.js:116` — never a blanket override. Escalation is
therefore rare by construction, and every use of it leaves a record that feeds the corpus in Step 3.

**When confidence is low rather than split**, prefer cascaded selective evaluation over a bigger
panel: [Trust or Escalate](https://arxiv.org/abs/2407.18370) (Jung, Brahman, Choi; ICLR 2025, accessed
2026-08-15) guarantees >80% human agreement at ~80% coverage by estimating judge confidence and
escalating only the unconfident remainder — using models as cheap as Mistral-7B, beating unguided
GPT-4. The lesson for this repo: **escalate on low confidence, not on disagreement.** Disagreement is
already handled, for free, by the asymmetry.

---

## 8. The three lenses: **strike, and replace the predicate**

**Strike.** `independent: true` comes out of `security` (`:44`), `adversarial` (`:57`) and `evidence`
(`:83`) — and it must not be replaced by silence, or the repo loses the one true idea in the current
design.

Concretely, in one change:

1. **`security`, `adversarial`, `evidence`:** `independent: true` → `independent: provenance`.
2. **`model_families:`** stops being the independence predicate. It becomes an optional, descriptive
   record of which families *actually ran* — written by the runtime, not asserted by the author.
   Delete `openai` from all three: nothing has ever dispatched it (§1.3).
3. **`schema-lint.js:595-598`:** when `independent: provenance`, assert the *mechanism*, not a string
   list —
   - every reviewer dispatch for that lens is a fresh `agent()` spawn (no forked producer transcript);
   - findings reach verifiers as `JSON.stringify` data, not interpolated prose (`qa.js:100` already
     does this and says so);
   - the reviewer prompt interpolates **no producer-authored assertion of correctness**;
   - the panel roster comes from committed code, not a runtime choice by the party under review.

   This is a ~10-line static check over `.claude/workflows/*.js`, the same shape as the proposed
   `check-dispatch-agenttype.mjs` (`CONTROL-PLANE.md:3.16`). It is `ENFORCED`, not `ADVISORY`.
4. **`claims.js:425-430`:** `independenceIssue()` stays exactly as it is and keeps governing
   `risk: high` claim panels, where the vendor question is genuinely different — a durable global
   claim outlives any single model, so a two-family record is worth its cost there. **One rule, two
   predicates, each named for what it checks.** Do not collapse them; that is how you get a
   provenance check quietly certifying a vendor claim.

### Why redefinition is not a hedge

The brief allowed "provision or strike" and warned that "it depends" is not a deliverable. This is not
"it depends" — it is a different, cheaper, *stronger* enforcement, and here is why it is not a
softening:

- Today the flag is enforced against **a string in a YAML file** (§1.1). Vendor independence is not
  actually checked by anything; it is asserted. Redefining to provenance replaces an unenforced
  assertion with an executed check. **This is a net increase in enforcement, not a decrease.**
- §4 establishes provenance is worth more measured points (up to 94pp recovered) than any published
  cross-vendor delta on this task.
- Four independence sources exist (§4). The current predicate names the only one that costs money and
  the only one this repo cannot enforce.

**If the founder rejects the redefinition**, the fallback is the plain strike: `independent: false` on
all three lenses, `model_families: [anthropic]`, and a comment naming this document. That is honest
and it is strictly better than today. But it discards a mechanism that is already 80% built.

**What must not happen:** leaving `independent: true` in place while nothing dispatches a second
family. `AGENT-ARCHITECTURE.md:744-751` states the reason better than I can — *"A declared property
with no mechanism is worse than an absent one: it makes a single-model pass read as a panel."*

---

## 9. When a second model should be invoked, tied to the real tiers

| Tier | Second family | Rationale |
|---|---|---|
| `trivial` | **Never** | CI-only path. A model call here is pure cost |
| `lite` | **Never** | `git revert` fully undoes it. Correlated-error risk is priced correctly by reverting |
| `full` | **Never by default.** Strike the phantom "Codex CLI second opinion" from `CLAUDE.md:152` today | Reversible. The tier map has advertised an uninstalled tool since inception (`DECISIONS.md:505-506`) — that line is a live documentation defect regardless of this decision |
| `irreversible` | **Yes — one call, adjudicating the confirmed-findings set only** | The `enforcement: block` carve-out exists here precisely because `git revert` does not undo migration · deploy · harness self-edit. This is the only place the correlated-error risk is not priced by reversibility |

**What it reviews:** the diff plus the confirmed findings **and nothing else** — no producer session,
no CEO brief, no session file, no PR description. Per §3, the framing in those artifacts is worth
16–93 points of detection, in the wrong direction. Redaction is not an optimisation; it is the
intervention.

**What it does not do:** re-run the five dimension reviews. That is where correlation is highest, where
Claude leads on benchmark (§5), and where the marginal call buys least.

---

## 10. What would falsify this recommendation

Stated so the next reader can check rather than re-argue:

1. **The seeded-defect corpus shows the fixed Claude panel (Step 1) still misses a defect class that a
   non-Claude adjudicator catches.** Then buy — and the corpus will name the class, so the role can be
   scoped to it rather than to "second opinion".
2. **Step 1 produces no detection lift.** Then the framing diagnosis in §1.3 is wrong, the problem is
   elsewhere, and §6's ordering should be reconsidered from the corpus data.
3. **Rate-limit headroom becomes the binding constraint after Step 4.** Then a second family for
   *volume* becomes reasonable on grounds this document rejects for *judgement* — and the cheap
   reviewer goes on the non-critical dimensions, never on `security`.
4. **A published cross-vendor-vs-blinded-same-vendor reviewer comparison appears.** It does not exist
   today (§4). It is the missing experiment, and this repo's corpus would be a real contribution to it.

---

## 11. Claims to record when `.claude/ledger/index.json` is next regenerated

Three `verified_by: command` claims, all reproducible, none requiring a model:

| id | assert | cmd | expect |
|---|---|---|---|
| `c-no-second-family-runtime` | No non-Claude model runtime is callable on this machine | `command -v codex` | exit ≠ 0 |<!-- ledger:unregistered: proposed by this section, not yet compiled -->
| `c-qa-panel-single-family` | Every model dispatch in `qa.js` is Anthropic | `grep -c "model: 'sonnet'\|model: 'opus'" .claude/workflows/qa.js` | equals total `agent(` dispatches |<!-- ledger:unregistered: proposed by this section, not yet compiled -->
| `c-lens-independence-unbacked` | No workflow dispatches a non-Anthropic family for any `independent` lens | `grep -rn "openai\|gemini\|codex" .claude/workflows/` | exit ≠ 0 |<!-- ledger:unregistered: proposed by this section, not yet compiled -->

All three are `scope: project` and therefore require `valid_until`. Set it to **2026-11-15**: §1.4
shows three runtimes changing eligibility in under five months, so a one-year expiry on any statement
about model availability is a claim that will be false long before it is rechecked.

---

## Sources

**Strong (peer-reviewed venue, large N, reproducible method)**
- [Correlated Errors in Large Language Models](https://arxiv.org/abs/2506.07962) — ICML 2025 · 350+ LLMs · accessed 2026-08-15
- [Too Consistent to Detect: Self-Consistent Errors in LLMs](https://arxiv.org/abs/2505.17656) — EMNLP 2025 Main · accessed 2026-08-15
- [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — NeurIPS 2025 D&B · MAST, κ=0.88 · accessed 2026-08-15
- [Trust or Escalate: LLM Judges with Provable Human Agreement Guarantees](https://arxiv.org/abs/2407.18370) — ICLR 2025 · accessed 2026-08-15

**Moderate (arXiv preprint, sound method, effect size large enough to survive discounting)**
- [Measuring and Exploiting Confirmation Bias in LLM-Assisted Security Code Review](https://arxiv.org/html/2603.18740v1) — 250 CVE pairs, 4 models · accessed 2026-08-15
- [When Does Verification Pay Off?](https://arxiv.org/pdf/2512.02304) — accessed 2026-08-15
- [Self-Preference Bias in LLM-as-a-Judge](https://arxiv.org/pdf/2410.21819) · [Justice or Prejudice?](https://arxiv.org/pdf/2410.02736) — accessed 2026-08-15
- [Demystifying Multi-Agent Debate: Confidence and Diversity](https://arxiv.org/html/2601.19921v3) — accessed 2026-08-15

**Weak (single author, small N, or unreproduced — cited for direction only)**
- [When Agents Disagree: The Selection Bottleneck](https://arxiv.org/html/2603.20324v1) — N=210, g=2.71 · accessed 2026-08-15
- [Cross-Context Review](https://arxiv.org/html/2603.12123) — N=30 artifacts, one model · accessed 2026-08-15

**Commercial / marketing-adjacent (pricing and benchmark claims, unreproduced)**
- [OpenAI: Codex upgrades](https://openai.com/index/introducing-upgrades-to-codex/) · [Codex vs Claude Code (morphllm)](https://www.morphllm.com/comparisons/codex-vs-claude-code) · [Codex pricing (UI Bakery)](https://uibakery.io/blog/openai-codex-pricing) · [Codex pricing (CloudZero)](https://www.cloudzero.com/blog/openai-codex-pricing/) · [Ollama Cloud pricing](https://pooyagolchian.com/blog/ollama-cloud-pricing-hardware-requirements-2026/) · [Ollama free vs Pro](https://devtoolhub.com/ollama-cloud-free-vs-pro-limits-pricing-2026/) · [Multi-model code review convergence (Zylos)](https://zylos.ai/research/2026-03-01-multi-model-ai-code-review-convergence/) — all accessed 2026-08-15

---

*Every repo assertion above is a `file:line` in this repository or a command run on 2026-08-15 with
its output printed. Every external assertion carries a URL, an access date, and an evidence grade.
Where I could not verify — the absence of any published blinded-same-vendor vs cross-vendor reviewer
comparison, and the true correlation between Claude and GPT-5.x on this repo's defect distribution —
the gap is named rather than filled. Both are closed by the same instrument: the seeded-defect corpus.*
