# Handoff — after the design layer

**Merged: `integration/design-layer` at `eca1c68`, 100 commits, `floor=full`.**
Written 2026-08-30. Read [the session file](../sessions/2026-08-29-ceo-design-layer.md) for what shipped;
this document is for what you should do next and what will mislead you if you do not.

---

## 1. Start here: three things that are true and will not look it

**The suite is not reproducible across environments, and this predates us.**
`npm run check` is **48 of 48** with `TMPDIR` pointing at a session scratchpad and **26 of 48** under the
macOS default, on identical bytes, because 30 test files call `os.tmpdir()` and the armed sandbox denies
`/var/folders/…/T`. **24 of those 30 are pre-existing.** Every `48 of 48` in `CLAUDE.md`, in every session
file, in every handoff including this one, was taken in the passing cell. If you run the suite on a Mac and
see 22 failures, **they are not your change.** Derive it, do not trust this paragraph:

```bash
TMPDIR=/tmp/claude-501 npm run check          # cell A
TMPDIR=$(getconf DARWIN_USER_TEMP_DIR) npm run check   # cell B
```

Fixing it is ~24 one-line edits basing fixtures at the repo root, the cure already used in
`lenses.test.mjs`, `design-probe.test.mjs` and `probe-readonly.test.mjs`. **Founder's call, not a merge
blocker.** Nobody has decided whether the suite should be portable or whether the scratchpad is the
supported environment; until someone does, a green tally means less than it appears to.

**A `git archive` export is not a git repository.** Eight git-dependent steps fail there falsely. Use an
export for reading content and pure computation; use a **clone or a worktree** for any suite number.
Two lanes discovered this independently after the orchestrator had handed the export method to three
reviewers.

**`check:mc` is excluded and still fails under the armed sandbox.** Unchanged, and documented in
`docs/03-system-design/SANDBOX.md`.

## 2. The design layer: built, verified, and pointed at nothing

This is the honest state and it is a good position, not a gap.

**ENFORCED** — reached by a blocking step: `build-tokens.test.mjs` (drift, via `test:lenses`),
`design-probe.test.mjs` (via `test:probe-readonly`), `extract-reference.test.mjs` (via `test:merge-gate`),
`design-lib.test.mjs`. The instruments' own tests block. **The instruments run on nothing.**
`design-probe`'s CLI is not a step — it needs a live page — and it has never left a committed artifact.

**Not yet done, in the order I would do it:**

1. **`design/system/` is 5 of 6 `status: unanswered`.** Only `type.md` is answered. `palette.md`,
   `space.md`, `motion.md`, `principles.md`, `audience.md` are skeletons.
2. **Motion tokens do not exist.** `tokens.json` declares no `duration` and no `easing`, so a real probe
   run against this repo returns **exit 3, INCOMPLETE** — by design, and with a mechanical exit condition:
   declare the tokens. Do not "fix" this by weakening the verdict.
3. **`designer` declares the wrong skill.** `.claude/agents/designer.md` carries
   `skills: [design-orchestration]`, whose own text says *"This skill does not generate designs."* All
   eight design-relevant skills are attachable (none declares `allowed-tools`); `ui-typography` is the
   highest-value attachment available and is unattached. `pre_flight_reads` says "the written design
   system" in the abstract rather than naming `design/INDEX.md`. **`.claude/agents/**` is
   `irreversible` tier — founder sign-off, and it will raise the floor of whatever PR carries it.**
4. **Stages 4–6 have never run** — breadboard, style tile, one developed direction. No `design/visuals/`,
   no `design/decisions/`. **The loop has never gone end to end on a real surface.**

## 3. Open, named, and nobody's yet

**A figure compared against a cap in the wrong unit.** `verdict.mjs` carried `1,026,873` — the *character*
count of a utf8-decoded diff — against a *byte* cap of 1,048,576. Both numbers correct, the comparison
between them meaningless, and **no amount of re-measuring either operand finds it.** It survived a
bisection, two reports, a relay and a reviewer's re-derivation, because all of those verify the operands.
Fixed at that site (`Buffer.byteLength`); **every other `X < Y` in this repo is exposed and nothing checks
it.**

**`produce-verdict.mjs:279`** now sets `maxBuffer` too, so its own comment's "five bounded sites" reads as
six to anyone running the command today. The sentence scopes itself correctly with "already in use". One
word, whenever someone next edits that block.

**Two source-derived, not measured, both recorded:** with two *visible* failing contrast pairs only the
first is reported per viewport (`design-probe.mjs:1025`), and a fully-transparent `color(srgb …)` backdrop
is not recognised by the walk's alpha regex — it fails safe, becoming a gap rather than a wrong reading.

**`writeArtifact` has no path containment.** `--out ../../x.json` escapes cwd and `--out victim.mjs`
clobbers a source file, exit 0. Reachable **only from operator argv** — every path input was traced and no
page-derived or url-derived string reaches a path. Deliberately not fixed.

**Single-family review.** Accepted risk, exit condition **2026-11-17**.

## 4. The rules this session produced — every one from a lane or a lens, none from the orchestrator

These are cheap, they are all mechanised somewhere in the tree, and each was earned by a failure:

- **Assert at the start and *refuse*; assert at the end and *discard*.** And the refinement: discard if
  **what you measured** could have moved, not if HEAD moved. A docs commit does not invalidate a code
  measurement; a dirty working tree does.
- **An assertion travels; a gate does not. Put the gate where the action is.** No sender-side freshness
  check can be current when the receiver acts. State it anyway — a divergence between the sender's belief
  and the receiver's gate is what locates a still-moving lane.
- **A mutation runner must assert the post-state it intended** — not that bytes differ, not that something
  went red. Three harnesses failed this today in three different ways, all caught by *reading the mutated
  source*.
- **A sign-off names a sha and is void if the file moves under it.** `build-tokens.mjs` moved four times
  under one sign-off; the reviewer re-ran the full battery each time.
- **A sweep states its predicate before it runs — what it must match *and what it must not* — validates
  against a known decoy, and reports a classification, not a tally.** Three sweeps failed three different
  ways from that one root.
- **Two materials, two rules.** In prose: quote the figure with its correction attached in the same
  sentence. In code and data: **derive at the point of use, or pin it in a test that re-derives it
  independently of the thing under test.** Confusing them licenses a comment saying the right thing above
  a constant saying the wrong one.
- **A record of an error cannot drift** — keep the false figure in the superseded note, never the true one.
- **Test the premise, not just the effect** (`PALETTE_NAME.test('__proto__') === true` is pinned so nobody
  reads a live clause as dead code).
- **Never `git commit -a` in this worktree.** Several lanes share it; commit path-scoped or you sweep up
  work with no commit to recover it from.

## 5. What the orchestrator got wrong, because you will be the orchestrator

Recorded because `CLAUDE.md` already names the orchestrator's brief as *a defect surface nobody reviews*,
and this session is the third and fourth instances:

- **Asserted a clean tree, released a sha to three reviewers, and started a measurement on it.** True when
  read, false minutes later. A reviewer refused at the gate. The run was voided.
- **Concluded a lane had finished from a clean `git status`** and dispatched a second builder into its
  file. That builder found the work in flight and refused to write. **A status line at one instant cannot
  distinguish "done" from "between writes"** — and it can return a *false dirty* line too, from stat-only
  staleness. Sample twice; confirm a lane stopped **by its report**.
- **Relayed three figures without asking what they counted.** All three were wrong or unfounded.
  **Relaying is asserting** — the original caveats do not travel with the number.
- **Wrote an instruction that would have introduced the defect it was fixing** ("fix the band, keep the
  argument" — under the corrected band the argument's example is false). A builder computed before
  substituting and refused. **Six builders refused an instruction today and all six were right.**

The generalisation, from the lens that caught the summary error: it was caught because the summary
**carried a checkable particular** — not because anything watches this layer. Nothing does. A vague summary
would have been unfalsifiable, and *that is not a virtue*. **A summary that quotes a figure names where the
figure came from.**

## 6. Where to pick up

Wave the design layer at something. The instruments are built and verified; the cheapest high-information
move is **stages 1–3 on one real surface**, then the probe against it. That is the first time the loop runs
at all, and it is the only thing that will tell you whether the layer is any good — everything so far tells
you only that it is correct.
