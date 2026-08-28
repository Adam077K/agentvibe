# Sweep reporting — the three-bucket rule

**Status:** standard · **Applies to:** every checker that partitions a universe and reports a verdict
**Instances on this tree:** `scripts/check-dispatch-agenttype.mjs`, `scripts/check-citations.mjs`,
`scripts/probe-workflow-reach.mjs`

---

## The rule

> A sweep must report what it could not classify, separately from what it found clean — and its
> universe count must be cross-checked against a counter it did not write.

`unclassified` empty must mean **"nothing was ambiguous"**, never **"nothing was looked at"**.

---

## Why two buckets are not enough

A sweep partitions a universe. Two buckets — `found` and everything else — silently merge *this is
clean* with *I could not decide about this*, and the second is not a result. That is the same defect
the claim ledger forbids in a resolver: **Rule 10, "a resolver never passes what it could not
check"**, pinned by `scripts/ledger.test.mjs`, which holds `unresolved` distinct from `pass` for
every resolver.

The generalisation is: **an unmeasurable state must not be spellable as a measurement.**

**Two further instances have SHIPPED and are now true of this tree.**
`scripts/probe-workflow-reach.mjs` reports `UNRESOLVED` (exit 2) rather than `CONTAINED` (exit 0) when
its control does not fire — check it with `grep -n UNRESOLVED scripts/probe-workflow-reach.mjs`. And
`.claude/workflows/qa.js` no longer spells a refusal *as a `BLOCK`*: `REFUSED` is a value of the frozen
`VERDICT` object every caller reads, not a word inside a summary string — check it with
`grep -nE '^const VERDICT' .claude/workflows/qa.js`. Both arrived from outside this branch, which is the
point of having named them: the rule was written down before either landed, and neither was evidence
until it did.

> **Superseded 2026-08-28.** This paragraph read *"Two further instances are IN FLIGHT and are not true
> of this tree — do not read them as shipped"*, marked `probe-workflow-reach.mjs` as **"does not exist
> here"**, and described the `qa.js` refusal as a defect *"PR #115 fixes"*. Both PRs merged to `main` on
> 2026-08-26 and this branch merged `main` on 2026-08-28, so every clause of it became false about the
> tree it lives in. It is kept because *which* statement went stale is the useful part, and because the
> instruction it carried — fix the marking when the base moves, and not before — is what made this
> correction mechanical rather than a matter of anyone remembering.

---

## Why the cross-count is a SEPARATE guarantee

It is not a refinement of the third bucket. A third bucket catches only what the sweep's own
predicate can detect it failed to classify. **An item the sweep never ENUMERATED is in no bucket at
all** — it is missing from the denominator, so every ratio computed from it is right about the wrong
set.

Measured while writing this on the branch of PR #115, and **reproducible on this tree since that branch
merged**: `node --test scripts/run-gate.test.mjs` reports **101** test cases, where a name-anchored
parser of the same file — `grep -cE '^test\(' scripts/run-gate.test.mjs` — sees **91** blocks. The ten
it misses are indented `test(` calls inside two `for` loops of five iterations each; they are invisible
to every bucket that parser has, because they were never enumerated. Only a counter written by someone
else finds those. Re-derive both numbers from those two commands rather than trusting the ones printed
here — the corpus moves, and the gap of ten is not obliged to move with it.

> **Superseded 2026-08-28.** This read *"not reproducible on this tree"* and closed with a parenthetical
> — *"that file holds **87** tests on this base; the figure is provenance for the argument, not a
> measurement anyone can repeat here"* — whose entire job was to warn a reader off repeating it. PR #115
> merged, and it is now an ordinary repeatable measurement. The **87** is left unre-derived rather than
> quietly restated: it was a reading of a base this tree no longer holds, and the name-anchored count at
> that base (`0c78fa2`) was **77**.

**Where no independent counter exists, say so. Do not invent one and call it a check.**

---

## What "a counter you did not write" means in practice

| Sweep | Universe | Cross-counted against |
|---|---|---|
| `check-dispatch-agenttype.mjs` | `agent(` occurrences in unmasked `.js` workflow source, **plus** `agentType` mentions in `.md` | the site scanner's own output, asserted as `universe === sites + unclassified` across **both** halves |
| `check-citations.mjs` | harvested locators | the **seven** dispositions, written at independent call sites; and separately the `unchecked` **array length** against the `stats` **integer counters** |

Two properties make a cross-count worth having:

1. **A different mechanism.** An array accumulated by `push` at call sites that never touch `stats`
   is independent of an integer incremented in `stats`. A sum of counters can come out right for the
   wrong reason; a list cannot be pushed without an item existing.
2. **A wider predicate than the classifier's**, so the delta is exactly what the classifier
   excluded — and then each excluded item is *listed*, not counted.

### Aligning the two predicates is not tidiness

`check-dispatch-agenttype.mjs`'s first cut counted its universe with `/\bagent\s*\(/`, which is
**wider** than the site scanner's `(^|[^\w$.])agent\s*\(` — `\b` matches after a dot. So
`this.agent(p)` and `obj.agent(p)`, ordinary method calls, would have landed in the universe, never
matched a site, and raised a **blocking** `parser-gap` failure on correct code. Zero such calls exist
in those files today, so it passed: a false positive waiting for the first contributor to write one.

The mirror error is as easy, and was also made here. `check-citations.mjs`'s identity first asserted
that **six** resolution counters partition the locators. A citation declared external via
`--external-prefix` is harvested (so it counts as a locator) and then excused from checking by design
(so it increments none of the six). The assertion fired on correct code, on a **blocking** step. The
universe has **seven** dispositions, not six.

**A miscalibrated identity check on a blocking step is worse than none.**

### The measurement that found it was nearly lost to shell quoting

Three separate readings said the identity held. All three ran
`node scripts/check-citations.mjs $A --json` with `A="--no-anchors --strict --external-prefix adamos"`.
This shell is zsh, which **does not word-split an unquoted parameter expansion** — the repo has a
ledger claim for exactly that, `c-zsh-no-word-split-on-expansion`. So the script received **one
43-character argument**, matched no flag, and silently ran a *different posture* with no external
prefix at all, where the six-term identity does hold. Pass the flags literally, or as separate array
elements, whenever a measurement depends on them.

---

## Known, reported, and deliberately not fixed

`check-citations.mjs`'s `RESOLUTION:` line prints the six resolution counters as a partition of the
locator total. With an external citation present it therefore accounts for **one fewer than the locator
total**, while the headline directly above it counts that same item among the *"could not check"* total.
Two lines of one block, disagreeing by one. The off-by-one is the durable part and the corpus is not:
read the live figures off the run — `node scripts/check-citations.mjs --no-anchors --strict
--external-prefix adamos` printed **880 of 881** on 2026-08-28. Reported rather than changed, because
changing it moves what the checker reports about its corpus, and the posture of this check is only half
settled: the **existence** half blocks (`check:citations-exist` is in `STEPS`), while whether the
**drift** half ever blocks is a founder decision still open (`check:citations` is in `EXCLUDED`).

> **Superseded 2026-08-28.** This froze the figure at **875 of 876** and called the whole reporting
> posture *"a founder decision in flight"*. The count moved to 880 of 881 across the merge train without
> the defect itself changing at all — which is the case against frozen arithmetic in prose. And half the
> posture was never in flight: `check:citations-exist` was already a blocking step at this branch's own
> base, so the sentence overstated what was undecided on the day it was written.

---

## The layer this does NOT reach

Three buckets and a cross-count both live inside **one method**. They answer *did the instrument
move* and *was it aimed at everything* — not *is the predicate itself right*. A predicate that is
wrong in the same way in both the classifier and the universe scan is invisible to both. That needs a
genuinely different method — parsing rather than masking, for instance — which is not mechanisable
from inside the sweep, and is why each sweep carries a written blind-spot list instead of a claim of
completeness.
