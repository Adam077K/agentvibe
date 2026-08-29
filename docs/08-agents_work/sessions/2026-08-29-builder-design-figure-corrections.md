---
date: 2026-08-29
role: builder
task: design-figure-corrections
qa_verdict: PASS
tier: full
risk: full
branch: integration/design-layer
---

# Nine figures in the design system's own rule documents, re-derived

**Every number below came from a command that was run, and the command is now next to the number in
the file.** Where a figure was wrong and its argument was sound, the figure moved and the argument
stayed. Corrections are marked in place, not overwritten.

| File | Was | Is | Derived by |
|---|---|---|---|
| `design/system/type.md` | reference increment table, 4 of 5 rows false, docs.stripe.com omitted | **no table at all** — the section states commands and carries no measured figure | `node -e "…measured.json…bands[b].sizes"` per slug |
| `design/system/type.md` | "+0.5 **seven** times consecutively" | **six** | `node -e "[10,…,15] increments; filter(0.5).length"` → 6 |
| `design/system/type.md` | "the reference band … bottoms out at **1.067**" | not restated — one command reads both sides and prints the verdict | `node -e` over `type.uiSteps` + mission-control's ramp → `ALL BELOW FLOOR true` |
| `design/system/type.md` | "every measured reference visibly decreases" | scoped to "within every constant-increment run" — grafana increases, stripe is non-monotone | ratios per slug from `measured.json` |
| `design/system/motion.md` | `emilkowal-animations` "carries 0.11 where the source uses 0.4 — 3.6× off" | `0.11` is correct (Sonner); `0.4` is Vaul, a drawer — category error | `git log … grep f3d0165`, `c8c1e53` |
| `design/INDEX.md` | "one is still off by 0.001 (`--color-warn`)" | **two** — `#d9a441` 8.582→8.581 and `#6a7280` 3.982→3.981 | `node --test scripts/build-tokens.test.mjs` (51 pass) |
| `design/INDEX.md` | "the `design` lens has five procedure steps, every one a judging action" | **12** steps, first **7** are making actions | `awk` walk of `.claude/lenses.yml` → 12 |
| `design/system/space.md` | "136 Tailwind-scale spacing utilities" with no counting rule | 136 **is** reproducible — padding+margin prefixes under `mission-control/client/src`; rule and command now stated | two `grep -rhoE … \| wc -l` → 136 and `2 py-[7px]` |
| `design/rules/type-scale.rules.json` | `min-step-ratio-1125.expected` named 3 refuting references | names **4** — play.grafana.org added (1.05, 1.111) | `extract-reference.mjs --against … --json` |

**One row of the brief was wrong and is recorded as such:** 136 was called "not reproducible". It is —
`(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-[0-9]+(\.5)?` under `mission-control/client/src` returns
exactly 136, and the same prefix set returns exactly the 2 `py-[7px]` arbitrary values, which is what
makes "136 against 2" a single measurement. The *defect* named in the brief was real and is what was
fixed: the counting rule was unstated, and three defensible readings give 136, 168 and 174.

**`expected_verdict` values are untouched and all six still reproduce** — CONTESTED ×5, HELD ×1.
Only `expected_verdict` is asserted by the harness test, which is precisely why a wrong reason could
sit beside a right verdict undetected.

## No corrected table — the commands are the statement

The first repair replaced the false table with a true one. That was rejected and reversed: a corrected
table is a second copy of the evidence, which `scripts/build-tokens.mjs` says of itself in
`referenceIncrements()` — *"a second copy of evidence is a thing that drifts from it silently."* The
rot rate is measured, not feared: `git log --oneline origin/main..HEAD -- design/references/` returns
**five** commits on this branch alone, and the stripe.com re-capture plus the docs.stripe.com addition
are exactly what falsified the old table. Every `SOURCE.yml` carries `expires: "2026-11-27"`.
`design/system/type.md` now carries **no measured figure** in that section — only the old, false ones,
because a record of an error cannot drift.

## Citation drift this branch introduced

Moving the `design`-related content in `.claude/review-lenses.yml` pushed `craft` from line 83 to 138,
`evidence` 96 → 153, `voice` 111 → 168 and `accessibility` 124 → 181. Three prose line pins were
replaced with lens-`id` pointers and greps, per the same rule as the table:

| Site | Was | Now |
|---|---|---|
| `CONTROL-PLANE.md:776` | `` `review-lenses.yml:100-111` `` | `grep -n 'id: accessibility' .claude/review-lenses.yml` |
| `CONTROL-PLANE.md:784` | `craft` `:69` · `voice` `:95` · `accessibility` `:108` | the three names plus a grep that checks the whole claim (`scope: rendered-output` ×3, all `[p1]`) |
| `SKILLS.md:191` | `` `review-lenses.yml:100-111` `` | `grep -n 'id: accessibility' …` |

`node scripts/check-citations.mjs`: **92 → 89 drift findings.** The blocking half,
`npm run check:citations-exist`, was and remains 0 findings, exit 0 — this was WARN throughout.

**The first version of that superseded note re-created the defect it recorded:** writing the old pins
as `` `review-lenses.yml:69` `` made them live citations again and the checker flagged one. They are
prose now. A record of a rotted pointer must not itself be a pointer.

**Left alone, deliberately, and measured rather than assumed:**

| Finding | This branch's doing? |
|---|---|
| `DESIGNER.md:39` — `:61-72` for `craft` | **worsened** (11 → 66 lines off; it was already a finding on `main`) |
| `2026-08-13-rethink-board.md:36` — `:87-96` for `blocking_severities: [p1]` | **created** (0 → 11 lines off) |
| `CONTROL-PLANE.md:1006` — `:44-45` for `adversarial` | no — 24 off on `main` and 24 off now |
| `ROSTER-SIZE.md:362` — `:35` for `security` | no — 20 off on `main` and 20 off now |

The first two are this branch's and are **not fixed**, because the brief scoped the repair to three
named locators and warned against a sweep. They are recorded here so the decision is visible.

## The origin: DESIGN-CAPABILITY.md §7.1 and §10.1

`design/system/type.md` copied its table from §7.1, where the same figures stood under the words
**"VERIFIED HERE, five ramps"**. That is why it survived review in two places: a false table wearing
"verified" is a defect that supplies a reason not to check it. §7 s preamble compounded it — *"the
central finding was re-derived independently … see the verification block below"* pointed the reader
at the transcription as evidence of its own independence.

| §7.1 figure | Was | Is | Derived by |
|---|---|---|---|
| the increment table | 4 of 5 rows false, docs.stripe.com absent from a table captioned "five ramps" | commands first, dated table second | per-slug `measured.json` increments |
| "+0.5, **seven** times" | seven | **six** | the verdict command below |
| "bottoms out at **1.067**" | 1.067 (linear 15→16, read off the refuted table) | **1.048** (stripe 21→22) | `Math.min` over `type.uiSteps` |
| "the **1.07–1.17** band measured on linear/stripe/vercel" | 1.07–1.17 | **[1.048, 1.167]** | `Math.min`/`Math.max` over the corpus |
| "fourth and **finally correct**" | finally | struck — §15.16 falsified the integer half | cross-reference, not restated |
| §10.1 `136` | unlabelled | rule + command stated | `grep … \| wc -l` → 136 · `2 py-[7px]` · `9` |

`1.07–1.17` was not in the brief. It is the same class, in the same section, and the correction
**confirms** the mechanism rather than damaging it: 1.048 is stripe.com's 21→22, which is `1 + 1/21`
exactly — a `d=1` step above the 12→20 range the arithmetic considered, because stripe's UI band runs
to 26px. The sentence compared a union over 12→20 against a corpus wider than 12→20.

### Does the argument survive 1.048? Yes — and its margin does not

`ALL BELOW FLOOR true`: 1.045 is below 1.048. But the gap between mission-control's highest +0.5 ratio
and the corpus floor fell from **0.022 to 0.003**, so the claim is seven times thinner than the refuted
figure made it look and now turns on one step of one reference. **It also turns on band membership:**
the corpus already contains an adjacent ratio of **1.008** — play.grafana.org 11.9→12, present in
`type.steps` and absent from `type.uiSteps` because 11.9 falls outside that reference s UI band.
Minimise over `type.steps` and the finding evaporates. The UI-band comparison is the like-for-like one
and is correct — every mission-control authored size is a UI-band size — but it is stated with that
dependency out loud rather than quoted as a clean margin.

### Not fixed, and measured rather than assumed

`DESIGN-CAPABILITY.md:95-100`, in §1.2, carries three more figures of this class inside a superseded
blockquote: *"Linear 1.07–1.13, Stripe 1.09–1.17, Vercel 1.09–1.17"* (true: `[1.067,1.1]`,
`[1.048,1.125]`, `[1.143,1.167]`), *"play.grafana.org ships **two sizes total**"* (it ships eight), and
*"the fractional sizes … which no measured reference uses"* (grafana uses five). All three are already
refuted by §15.16. Left alone deliberately: it is outside the two sections the brief named, it is a
*record of a correction* rather than a live rule, and adding a third account of the grafana measurement
is the "two accounts of one event" failure this document keeps finding.

**Nothing was restructured.** The heading list is byte-identical before and after — 114 headings,
`diff` clean — because other documents cite this file by section number.

## I BROKE `test:run-gate`, and it is not about any figure in this session

`npm run check` is **47 of 48** as of `a5584d4`. The failure is `test:run-gate`, and **commit
`489e5e0` — mine — is the commit that caused it.** Not "a pre-existing condition my work surfaced":
the tipping point is identifiable to one commit and it is mine.

```
git log 4ddc5c6..HEAD, running verdict.mjs's exact git call at each commit:
  3b64a9a  OK   1,026,873 bytes
  489e5e0  ENOBUFS  <- mine
  25693b0  ENOBUFS
  a5584d4  ENOBUFS  <- mine
```

**Root cause, and it is one line outside my scope.** `scripts/verdict.mjs:97` spawns git with no
`maxBuffer`:

```js
return execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
```

`computeSubject()` calls it with `git diff <base>..<ref>` to hash the diff into `subject`. Once the
branch diff passes Node's default buffer the call throws `ENOBUFS` and no verdict can be bound at all.
**The control is decisive — same args, same cwd, only `maxBuffer` differs:**

```
EXACT CALL (as written)  -> FAILED ENOBUFS, stdout truncated at 1,098,928
same + maxBuffer 64MB    -> OK 1,100,001 bytes
```

**Six other call sites in this repo already set it** — `ledger.mjs` ×2, `evict-memory.mjs`,
`vendor-provenance.mjs`, `lib/claim-append.js`, `lib/resolvers.js`, at 32–64MB. `verdict.mjs` is the
one that does not, and it is the one on the blocking path of `qa-lead-pass.yml`.

**It fails CLOSED, which is the only good news here.** `verdict.mjs` exits 2 — a refusal — where the
test expects 0. It does not hash a truncated diff and call it a subject, so no verdict was bound to
the wrong bytes. Rule 10 held.

**FIXED — `maxBuffer: 64 * 1024 * 1024`, matching the six existing call sites.** `npm run check` is
48 of 48. What the source now says, because it is the honest framing and not the flattering one: 64
MiB **moves** the cliff, it does not remove it, and past it the failure is still a refusal rather
than a truncation.

### The audit: one defect, three helpers

**For a diff BODY, `verdict.mjs:130` is the only production call site — there is no seventh.** Every other sync git call in `scripts/` and `scripts/lib/` reads something
bounded by *file count*, not by diff size: `diff --name-only`, `ls-files`, `ls-tree -r --name-only`,
`rev-parse`, `hash-object`, or `archive -o <file>` which writes to a file rather than stdout.
`produce-verdict.mjs:269` looked like a seventh and is not — its nine call sites are all in that
list. `vendor-provenance.mjs` reads blob contents and already sets 64 MiB. Measured headroom on this
repo today: `ls-files` **51,765 bytes** and `diff --name-only` **3,566 bytes** against the 1,048,576
default, versus a diff body of **1,174,921**. Twenty-fold and 290-fold headroom against one that is
already over.

### The test went vacuous first, and the vacuity is worth more than the fix

The mutant is a copy of `verdict.mjs` in a temp tree. Its first version **exited 0 having done
nothing** and the test read that as "the mutant computed a subject over the cliff". Cause:
`verdict.mjs` guards its CLI with `path.resolve(process.argv[1]) === path.resolve(fileURLToPath(...))`,
`path.resolve` does not resolve symlinks, and `os.tmpdir()` on macOS is `/tmp/…` symlinked to
`/private/tmp/…`. The guard failed, the module was imported and never ran, and a silent no-op wore a
pass. `fs.realpathSync` fixes it; a **proof-of-life assertion runs before every mutation assertion**
now, and the under-cliff case is checked *first* so a mutant that never ran fails on that rather
than being mistaken for evidence.

RED/GREEN, measured both ways: revert the option and 3 of 64 tests in `merge-gate.test.mjs` fail;
restore it and 64 of 64 pass.

## "seven" had four sites and the fourth was a live refusal message

`scripts/build-tokens.mjs:907` emits a refusal a user reads at the moment the generator blocks them,
and it said *"steps by +0.5 **seven** times consecutively … below the reference band, which bottoms
out at **1.067**"*. Two false figures, user-facing, on a terminal path.

**The count is dropped, not corrected.** It carries none of the refusal's force, and "six" rots the
next time mission-control's type changes. **The floor is derived**, via a new `uiRatioFloor` on
`referenceIncrements()` and a `citeUiFloor()` beside the `citeUi()`/`citeDisplay()`/`uiSplit()`
helpers that already read the corpus on every call. The message closes by claiming its figures "are
read from measured.json on each call, never typed here" — that claim was false for the floor, and is
now true. It emits `1.048, the lowest adjacent UI-band ratio across 5 reference(s) under
design/references`.

### A CONTROL WAS PINNING THE FALSE FIGURE

`build-tokens.test.mjs:329` asserted `msg.includes('1.067')`. So correcting the user-facing message
would have turned a test red, and the test's failure message read *"the refusal does not carry the
reference floor the defect fell below"* — it would have looked like the fix was the defect. **A false
constant inside an assertion is worse than the same constant in prose, because prose does not fight
back.** It now re-derives the floor from the corpus independently of the module under test, with two
controls: the minimum must be finite, and it must not be 1.067.

`build-tokens.test.mjs:141-143`'s comment carried the same two figures (`1.07-1.17`, `1.067`). Fixed.
**The assertion bound `[1.05, 1.167]` is deliberately unchanged** — it is the *arithmetic* union over
12→20, not the measured band, and loosening a live assertion to agree with a comment would be fixing
the wrong half. The comment now says which is which.

## Trap 1: the fifth ramp was the subject, not a reference

§7.1's table had five rows under the caption "five ramps" — four references plus **mission-control**,
the thing being critiqued, in the same column as its own evidence. That is how docs.stripe.com went
missing without the arithmetic ever looking wrong: the caption said five and there were five rows.
The table now carries an explicit `reference` / `SUBJECT` column and says `ls design/references/`
returns exactly five names, none of them mission-control.

## Citation drift: 92 → 86

Five locators, all of them pointers this branch moved. Beyond the three in the original brief and the
two approved after it, `CAPABILITY.md:663` was a third one **created** by this branch — the `evidence`
lens moved 152 → 187 in `.claude/lenses.yml`, which was 5 lines off on `main` (inside the checker's
slack, so not a finding) and 30 off at HEAD. Same rule, same shape, one line.

Left alone as genuinely pre-existing, each measured on both sides — CONTROL-PLANE.md at line 1006
(24 off on `main`, 24 now), ROSTER-SIZE.md at line 362 (20 / 20), and AGENT-ARCHITECTURE.md at line
195, which pins the `business` lens to line 84 of `.claude/lenses.yml` where it sits at line 31 on
**both** `main` and HEAD — so 53 lines off either way.

> **Those four are written as prose rather than as `path:line`, and this is the THIRD time this
> session that rule had to be applied.** The first version of this paragraph spelled them normally,
> which made a record of four rotted pointers into four live citations, and
> `scripts/check-citations.mjs` returned three fresh drift findings against this very file — 86 → 89,
> caught on the authoritative run rather than by reading. The same shape had already been caught in
> `CONTROL-PLANE.md`'s superseded note earlier today, and its fix is stated one section up. Knowing
> the rule did not stop me applying it late: **a record of a rotted pointer must not itself be a
> pointer**, and the control is what enforces that, not the intention.

## The same defect was latent in two more helpers

`scripts/produce-verdict.mjs:268` and `scripts/run-gate.mjs:371` were **byte-identical** to the
defective helper — `execFileSync('git', args, { cwd, encoding: 'utf8', stdio: [...] })`, no
`maxBuffer`. Both are guarded now, in the same shape and with the same constant.

**They were safe by their CALLERS, not by themselves**, and that distinction is the whole reason to
fix them. Verified call site by call site rather than assumed:

| helper | call sites | largest output |
|---|---|---|
| `produce-verdict.mjs` `git()` | 8 | `diff --name-only` ×2, `ls-tree -r --name-only`, `rev-parse` ×3, `hash-object`, `archive -o <file>` (writes to a file, not stdout) |
| `run-gate.mjs` `resolveTree` `git()` | 2 | `rev-parse` ×2 |

Neither pipes a diff body today. Each is **one `git diff` away** from needing the guard rather than
one bug away, in a file nobody is reading. Already guarded elsewhere and left alone:
`.claude/hooks/schema-lint.js:1460` and `scripts/vendor-provenance.mjs:74`, both at 64 MiB.

## The 47 → 48 transition, measured

| commit | `npm run check` | the one failure |
|---|---|---|
| `5b7dbb2` | **47 of 48**, exit 1 | `test:run-gate` — `spawnSync git ENOBUFS` |
| `222d641` | **48 of 48**, exit 0 | — |

Both read from `$?` directly with output redirected to a file, never through a pipe, in the worktree
rather than an export. HEAD and `git status --porcelain` were identical before and after the run.
