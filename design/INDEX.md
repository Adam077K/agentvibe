# design/ — the project's design record

**The only file you must read to know what is here.** Everything below is either a decided rule, a
generated artifact, or an open question that is labelled as one. Nothing here is a placeholder.

---

## What is here today

```
design/
  INDEX.md              this file
  system/               the rules. one file per dimension
    principles.md         UNANSWERED
    palette.md            UNANSWERED
    type.md               ANSWERED — and it is the one with a generator behind it
    space.md              UNANSWERED
    motion.md             UNANSWERED
    audience.md           UNANSWERED
  tokens/
    seeds.json          AUTHORED — the only hand-edited file in tokens/
    tokens.json         GENERATED
    tokens.css          GENERATED
    tokens.ts           GENERATED
    contrast.md         GENERATED
  references/           MEASURED — five sites, one directory each
    <site>/SOURCE.yml             url, access date, surface, licence note, expiry
    <site>/measured.json          what the extractor read out of the page
    <site>/seeds.suggestion.json  a PROPOSAL a human copies into seeds.json
  rules/
    type-scale.rules.json  AUTHORED — stated rules, held against the measured corpus
```

*The reference corpus is HERE, in this commit — five sites under `references/`, each carrying a
`SOURCE.yml` with a `surface` field, plus `rules/type-scale.rules.json`, the stated rules the corpus
is held against. It changes nothing above it: it feeds `seeds.json` by proposing values a human
copies, and no build step reads it.*

> **Corrected 2026-08-29.** The paragraph above read *"is being built in a parallel lane and lands
> with it"* — future tense, in the commit that lands it — and the tree above it listed neither
> `references/` nor `rules/`. It also listed **`captures/ GITIGNORED — perception-loop output, never
> committed`**, and both halves of that were unbacked: `.gitignore` carried no `captures` entry, so
> `git check-ignore -v design/captures/x.png` reported not-ignored, and the directory did not exist
> to be ignored. The ignore rule is real now and named below; the directory is still absent, so it
> is no longer listed as something that is here.

**`captures/` is NOT here, deliberately, and this is where its rule is written down.** It is
perception-loop output — screenshots a run produces and a reviewer looks at — and it is ignored by
`.gitignore` **before** anything creates it, so the first run cannot commit a screenshot by
accident. Check it rather than trust this line: `git check-ignore -v design/captures/x.png`. By the
rule two paragraphs down, the directory itself arrives with the lane that fills it.

**The tree above is a snapshot; `ls design/` is the truth.** It is written down so a reader knows what
each path is *for*, not to assert what exists on any given day — a list of directories in prose goes
stale the first time a branch adds one, with nobody editing the sentence.

The full layout is specified in `docs/03-system-design/agents/DESIGNER.md` §7.1, which also names
`references/`, `visuals/` and `decisions/`. **The rule for all three: a directory here exists only
once work has filled it.** An empty directory is not a capability, and each needs a channel — a way
references get in, a way visuals get built — that has to be built before the folder means anything.
So each arrives with the lane that populates it rather than being seeded ahead of one.

---

## The five unanswered questions, and why they are questions

`system/` holds six dimensions and **five have not been decided**. Each file states its question and
carries `status: unanswered` in frontmatter, so the gap is machine-visible rather than a matter of
someone noticing.

This is deliberate, and it is the rule that CLAUDE.md's "no placeholder UI" has been missing a
mechanism for: **a placeholder gets shipped; a question gets answered or gets noticed.** A file that
said "Primary: blue. Secondary: grey. TODO: revisit" would read as a decision from the outside and
would survive to launch.

| File | Status | The question it holds |
|---|---|---|
| `system/type.md` | **answered** | families, ramp, leading, tracking — all derived, all sourced |
| `system/principles.md` | unanswered | what does this product look like, and what does that forbid? |
| `system/palette.md` | unanswered | what does each colour *mean*, and which of the twelve carried values are load-bearing? |
| `system/space.md` | unanswered | is Tailwind's 4px scale the spacing system, or is it an inheritance nobody chose? |
| `system/motion.md` | unanswered | what animates, what must not, and at what durations? |
| `system/audience.md` | unanswered | who is this for, what do they already use, and what does that forbid? |

---

## Tokens — one authored file, four generated ones

```
design/tokens/seeds.json
        |
        +-> tokens.json     DTCG-shaped values
        +-> tokens.css      Tailwind v4 @theme block
        +-> tokens.ts       typed export
        +-> contrast.md     every pair, computed, dated
```

```
npm run build:tokens     write the four generated files
node scripts/build-tokens.mjs --check     exit 1 on drift, naming what drifted
```

**Type is DERIVED. Colour is CARRIED. Contrast is COMPUTED.** Read that literally:

- **Derived** — no type size, line-height or letter-spacing is typed anywhere. They are arithmetic
  over four numbers in `seeds.json`, and `scripts/build-tokens.mjs` refuses seed values that would
  produce a ramp no measured reference uses. A fractional step is *inexpressible*, not forbidden.
- **Carried** — the twelve colours pass through unchanged. Nothing about the palette is generated,
  and `system/palette.md` is where colour is decided. It is unanswered.
- **Computed** — every contrast figure is recalculated on every run. `mission-control/client/src/styles.css`
  is the reason: its figures were re-measured in 2026 after review found *every one of them wrong*,
  and **two are still off by 0.001** — `--color-warn` (`#d9a441`, documented 8.582:1, computes
  8.581:1) and the rejected `#6a7280` (documented 3.982:1, computes 3.981:1). Both are pinned in
  `scripts/build-tokens.test.mjs`, in the test named *"every hex-against-ink figure in styles.css
  reproduces, except the TWO named here"* — `node --test scripts/build-tokens.test.mjs` re-derives
  them. A generator cannot carry a figure forward; a comment can.

  > **Superseded 2026-08-29.** This read *"one is **still** off by 0.001 (`--color-warn` …)"*. There
  > are **two**, same sign and same magnitude: styles.css rounded up where nearest-rounding gives
  > down, twice. `#6a7280` was simply absent from the map the test iterates while the test's own title
  > asserted completeness over the file, so the second discrepancy could not be seen from either
  > place. Two figures wrong the same way is a rounding *habit* and is worth more than "one figure is
  > off"; stating it needed the second one to be in the map.

**Never hand-edit a generated file.** Each carries a header saying so, and the drift check fails a
build if one departs from `seeds.json` — it is an assertion in `scripts/build-tokens.test.mjs`, which
runs on every `npm run check`. `node scripts/build-tokens.mjs --check` is the same comparison for a
human at a terminal.

---

## The status of all of this

**These tokens are a PROPOSAL, not a migration.** `seeds.json` is seeded from mission-control's own
values — its twelve colours verbatim, and a five-step UI band plus one display step that its nine
authored sizes collapse to. **No mission-control source file has been changed.** Remapping its
93 hand-written `text-[Npx]` values onto this ramp is a separate design pass that has not happened.

Why this exists at all: `.claude/lenses.yml`'s `design` lens **used to have five procedure steps, and
every one was a judging action**. The production procedure was never written, so the design system was
never manufactured. `docs/03-system-design/DESIGN-CAPABILITY.md` traces that chain end to end; §7.1 is
the part this directory implements.

> **Superseded 2026-08-29 — this sentence described the state its own diff had already repaired.**
> The `design` lens carries **12 procedure steps**, of which the **first 7 are making actions** (fix
> the three seeds · build the UI band · derive the display band · set the line-height curve and
> tracking · assign colour by role · compose in greyscale · give every animation a token) and the last
> 5 are the original judging ones. Count it without `js-yaml`, which is not installed here:
>
> ```bash
> awk '/^  - id: design$/{f=1;next} f&&/^  - id: /{exit}
>      f&&/^    procedure:/{p=1;next} f&&p&&/^    [a-z_]+:/{p=0}
>      f&&p&&/^      - /{n++} END{print n}' .claude/lenses.yml
> # -> 12   (and: git diff --stat origin/main..HEAD -- .claude/lenses.yml)
> ```
>
> The sentence is kept rather than deleted because the *chain* it names is still why this directory
> exists — a lens that can only judge produces no artifact to judge. What changed is that the missing
> half was written, in the same diff that still claimed it was missing.
