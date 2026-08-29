---
role: builder
task: design-skill-repairs
date: 2026-08-29
tier: full
qa_verdict: PASS
branch: fix/design-skill-repairs
---

# builder — four repairs to design skills we already own

Brief: four repairs, no new skill imports. Two rounds. In round 1 I refused the two numeric changes
because I could not reach a network to verify them; `sourcer-motion` returned the figures and round 2
applied them. **Refusing first was worth it — the sourcing falsified something in each of the two
places it touched, including a row of my own new rule.**

## 1 — `impeccable` was unreachable for two independent reasons. Both closed.

- **`allowed-tools` removed.** It declared `Bash(npx impeccable *)` and
  `Bash(node .claude/skills/impeccable/scripts/*)`. The field is a **ceiling, not a grant** —
  `schema-lint.js` names this exact skill and `designer` in its own comment. Attaching it would have
  stripped the browser perception loop that is designer's whole purpose.
- **Both grants pointed at nothing.** `scripts/` does not exist; no `impeccable` package is installed
  in the repo's `node_modules` or the user's.
- **The brief's dead-reference count was low by ~2.5x.** Reported "roughly 11 `.mjs` paths across ~13
  files"; measured **27 distinct basenames, 101 mentions, across 14 files**. All 14 now open with a
  note that the runner is absent, carrying the re-derivation command rather than a frozen count.

**How much of the 4,959 lines survives the discount — the number the lead asked for.**

| File | Lines | Depends on |
|---|---:|---|
| `reference/live.md` | 323 | a live-variant browser server |
| `reference/hooks.md` | 111 | a design-detector hook installer |
| `reference/live-setup.md` | 102 | the same server's config handshake |
| `reference/doctor.md` | 53 | an INSTALLED Impeccable to reconcile against |
| **dead** | **589** | |

**4,370 of 4,959 lines — 88% — are usable prose an agent can follow by hand.** `doctor.md` was found
in round 2 and is the correction that matters: I had given it the ordinary "do it by hand" note, and
it cannot be done by hand — it reconciles a project against an installed Impeccable's `.impeccable/`
sidecars, so with nothing installed there is nothing to compare against. All four now carry the
stronger "documents an absent feature" note. `visualize.md` (49 lines) is named as a partial rather
than folded silently into the 88%: its art direction is usable, its asset pipeline is not.

## 2 — the velocity threshold: 0.11 → 0.4 px/ms, and the unit was checked FIRST

```ts
// vaul 1.1.2 · src/constants.ts
export const VELOCITY_THRESHOLD = 0.4;
```

**The unit question was the right one to ask and it came back negative — the units match.** Vaul's
`src/index.tsx` computes `Math.abs(distMoved) / timeTaken` where `timeTaken` is a `getTime()` delta in
milliseconds, so px/ms. The skill's own example computes `Math.abs(dragDistance) / dragDuration` — the
identical formula. Same unit both sides, so the 3.6x gap is a defect, not a convention difference. Had
they differed, the repair would have been to state the unit and leave `0.11` alone.

**Still open, and marked so it cannot read as finished.** This rule's `Reference` line points at
*Building a Toast Component* — **Sonner**, a toast library — while `0.4` is verified from **Vaul**, a
drawer library. Nobody has read Sonner's shipped threshold. So `0.11` may have been right *for a
toast*, and the rule may have been conflating two components — the same mistake §3 repairs for
duration. The file carries a loud block naming what would close it, saying `0.4` is **sourced for
drawers and assumed for toasts**, and stating that deleting the block is the regression. Per the
lead's instruction it is written to be impossible to mistake for finished prose; it is honest that
**no mechanism enforces it** (a step in `scripts/lib/check-suite.js` would, and that file is out of
scope here).

Also sourced `timing-drawer-500ms.md`, since §3 leans on it: vaul ships `DURATION: 0.5` — **seconds**,
consumed as `${DURATION}s` in CSS and `DURATION * 1000` in a `setTimeout`. 500ms is the correct
derived value, not a literal in the file.

## 3 — `timing-under-300ms` → `timing-duration-by-class`

Old rule: *"User-initiated animations must complete within 300ms"*, `400ms` as **Fail**, severity
**HIGH**. Wrong as a universal hard fail — the predicate cannot tell a drawer from a dropdown.

**Two in-repo citations carry it, and they are the load-bearing evidence because anyone can check them
offline:** `timing-drawer-500ms.md` ships 500ms as the *correct* drawer duration under the heading
"Drawer components are an exception to the 300ms rule"; and `timing-300ms-max.md` — **the source of
the 300ms number** — already scopes itself to "150–250ms micro, 250–400ms context switches, longer for
marketing". The flat fail contradicted its own source.

New rule: a five-row budget by element class, checkable ("compare against that row **only**"),
frequency as tie-breaker, severity HIGH → MEDIUM. A 400ms drawer passes; a 400ms button still fails.
Renamed rather than retuned so a finding quoting the id cannot re-imply a universal ceiling.

**Three sourced systems, all shipping durations the old rule called a HIGH failure:** Carbon
`slow-01` 400ms and `slow-02` 700ms; Vaul 500ms; Material `DurationExtraLong4` 1000ms.

**The sourcing falsified a row of my own rule, which is why it was worth fetching.** I drafted
full-surface as 400–600ms. Carbon's `slow-02` is **700ms**, described by Carbon as "background
dimming, large hero transitions" — a full-surface use. The new rule would have failed a shipped Carbon
token *while citing Carbon as its authority*: the exact defect being repaired, one row over. Row
widened to **400–700ms**, and the skill now states that every figure in its evidence block must land
inside a row, so retuning a row requires re-checking against it.

Two more things recall would have got wrong, both from the sourcer: **`$duration-slow-01` does not
exist** (Carbon's `_motion.scss` uses `$transition-base: 250ms` and has no `$duration-*` variables at
all — three verified spellings are named instead), and **Material's `1000.0` is a bare Float** whose
unit is settled by Flutter's `Duration(milliseconds: 1000)`, not by the androidx line alone.

## 4 — `design-orchestration`'s dead route

Referenced `multi-agent-brainstorming` at **five** sites, including the branch that *REQUIRES* it for a
high-risk design decision. That skill does not exist; `CURATION.yml:209` records the cut and names the
replacement on the same line (`# → multi-agent-patterns`). It matters more than a broken link usually
would: `design-orchestration` is the only skill `designer` declares and its own text says *"This skill
does not generate designs"* — routing is its entire value, and the escalation branch routed nowhere.

Repointed all five, stated that the substitution **is not a drop-in**, and named the concrete in-repo
route: the `reviewer` engine against `.claude/review-lenses.yml`. Skill not deleted;
`.claude/agents/**` untouched.

## The one thing I broke, and why the fix was not a repoint

Stripping `allowed-tools` turned **three tests red in `scripts/skill-clamp.test.mjs`** — it used
`impeccable` as a live positive control. The failure was the test working.

**Repointing at `pitch-deck-visuals` alone was the trap.** `impeccable` was the only **shipped** skill
declaring `allowed-tools` in the **block-list** form, so a pure repoint leaves schema-lint's
block-list parse branch exercised by nothing while every test goes green — the class this repo names
in five places, introduced by the fix for an instance of it. Instead: control moved to
`pitch-deck-visuals`; a **new test** covers the block-list form via a fixture skill installed into the
throwaway root and registered in the throwaway `MANIFEST.json` (schema-lint skips unknown skills),
restored in `finally`; a **new guard** asserts `impeccable` attaches cleanly. Header census corrected
8 → 7 skills, 2 → 1 single-pattern clamp.

**Mutation-checked, not assumed:** re-adding `allowed-tools: Bash(npx impeccable *)` makes the new
guard the sole failure, suite exit **1**; removing it, exit **0**. 21 → 23 tests.

## Verification

| Command | Result |
|---|---|
| `npm run check` | **48 of 48 passed · 0 failed · exit 0 · every step ran** |
| `node .claude/hooks/schema-lint.js` | **18 pass · 0 fail · 0 warnings** · exit 0 |
| `check:curation` / `check:manifest` / `check:routers` / `check:citations-exist` | exit 0 each, read from `$?` |
| `npm run test:skill-clamp` | 23 pass · 0 fail |

The first full run of round 1 was **47 of 48**, failing `test:skill-clamp`. Recorded because the
failure was mine and real, not because the suite was flaky. Removing `allowed-tools` left
`MANIFEST.json` valid with no rebuild, as the brief predicted — verified, not trusted.

## Blockers

**One, and it is marked in the file rather than only here:** Sonner's shipped swipe threshold is
unread, so `0.4 px/ms` is sourced for drawers and assumed for toasts. Everything else is closed.

**Not emitted: ledger claims.** The sourcer reported no `mcp__claim-append` tool in its session and I
have none either. Vaul `VELOCITY_THRESHOLD`, the Carbon duration tokens and Material's
`DurationExtraLong4` are durable, re-checkable facts and should be registered by someone who can.

**Standing caveat.** Author-recorded against a deterministic floor: one agent, one model family. The
checks ran and are green; that is not the `tier: full` review being satisfied.
