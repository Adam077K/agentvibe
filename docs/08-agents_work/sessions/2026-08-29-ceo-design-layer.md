---
date: 2026-08-29
role: ceo
task: design-layer
qa_verdict: PASS
tier: full
risk: full
branch: integration/design-layer
commits: 100
---
# The design layer, and nine p1 classes the green suite could not see

**Merged at `eca1c68`.** 100 commits off `origin/main`, `floor=full`, `scripts/lib/check-suite.js` and
`.github/workflows/**` byte-identical to `origin/main`, `STEPS.length` 48.

**What was built.** The `design` lens had five procedure steps and every one was a judging action — the
production procedure had never been written, only the checking procedure. That is the root cause of weak
design output and it is fixed: twelve steps, the first seven making actions. Around it: a token generator
(`build-tokens.mjs`) whose four artifacts are derived from `seeds.json` and whose drift is caught by an
assertion inside `test:lenses`; a conformance probe (`design-probe.mjs`) with a four-state verdict; a
reference extractor (`extract-reference.mjs`) with a falsification harness; five captured references with
provenance and expiry.

**What the review found, and this is the load-bearing half.** The branch was 48-of-48 green and had passed
two blinded review rounds. A third round of four blinded lenses found **nine p1 classes**, all closed and
each re-verified at this single sha by the lens that raised it:

| Class | Closed by |
|---|---|
| A colour NAME in `seeds.json` reached four sinks unvalidated — CSS block escape and **TypeScript code execution**, confirmed by executing it | grammar at the seeds boundary |
| SSRF: redirect-to-internal issued before the robots re-check, and a chain returning to its origin evading every check | one request policy on both request surfaces |
| The probe counted `<title>`, `<style>` and `<script>` text as rendered type — a false p1 on **every real page** — and, because `:1025` breaks after the first failing pair, an invisible failure consumed the slot and **suppressed a real visible one** | the visibility filter at the walk |
| A page that rendered nothing returned `exit 0, MEASURED — passed` | `mustObserve` → INCOMPLETE |
| A 3% black scrim made a real 1.083:1 AA failure emit zero findings | translucency → gap, never a pass |
| A caller-supplied `ok: true` rode inside a passing artifact | `ok` derived in the constructor |
| Three documents asserted increment figures their own corpus refuted, at four sites including a **live runtime refusal message** | tables deleted, commands written |
| `verdict.mjs` spawned git with no `maxBuffer`, so **no branch over 1 MB of diff could bind a QA verdict at all** | 64 MiB, plus two sibling helpers |
| `probe-readonly.test.mjs` fixtures based at the ambient `TMPDIR` | repo-root base |

**The authoritative measurement**, valid at both ends, real worktree, exit from `$?`:

```
sha eca1c68 · PRE/MID/POST HEAD=eca1c68 DIRTY=0
CELL A  TMPDIR=session scratchpad   48 of 48 · 0 failed · exit 0 · 254.9s
CELL B  TMPDIR=macOS default        26 of 48 · 22 failed · exit 1 · 32.9s
```

**The standing caveat applies and this verdict does not discharge it.** `PASS` here rests on three
independent blinded lenses — adversarial (76 checks), probe-security (PASS, six escalated real-browser
runs), evidence (every item closed, zero live sites by classification) — all one model family.
`irreversible` asks for 2-of-3 multi-judge across ≥2 distinct model families; no non-Anthropic model is
reachable inside Claude Code. Accepted risk, exit condition **2026-11-17**.

**Two items go forward as open and neither is this branch's doing.** The suite is not reproducible across
environments — 30 test files use `os.tmpdir()` and 24 are pre-existing and untouched here. And a class
nobody in this repo checks for: a figure compared against a cap **in the wrong unit** (`.length` counts
characters, `maxBuffer` counts bytes), which no amount of re-measuring either operand finds.

**The sentence this session earned.** Not one of the nine was found by reading. Every one came from a
control disagreeing with an expectation — and three of the orchestrator's own errors were caught by lanes
sent to check something else.
