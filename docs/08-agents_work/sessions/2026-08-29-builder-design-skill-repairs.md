---
role: builder
task: design-skill-repairs
date: 2026-08-29
tier: full
qa_verdict: PASS
branch: fix/design-skill-repairs
---

# builder — four repairs to design skills we already own, and the two I refused to make

Brief: four verified-at-source repairs, no new skill imports. Three landed whole. One is
**half-landed on purpose**, and that half is the most useful thing in this file.

## 1 — `impeccable` was unreachable for two independent reasons. Both closed.

4,959 lines across 36 files, loadable by nobody.

- **`allowed-tools` removed.** It declared `Bash(npx impeccable *)` and
  `Bash(node .claude/skills/impeccable/scripts/*)`. The field is a **ceiling, not a grant** —
  `schema-lint.js` names this exact skill and `designer` in its own comment. Attaching it would have
  stripped the browser perception loop that is designer's whole purpose.
- **Both grants pointed at nothing.** `scripts/` does not exist (the directory holds `reference/` and
  `SKILL.md`, nothing else), and no `impeccable` package is installed in the repo's `node_modules`
  or the user's. It granted nothing and cost everything.
- **The dispatcher's dead-reference count was low by ~2.5x.** Reported "roughly 11 `.mjs` paths
  across ~13 files"; measured **27 distinct script basenames, 101 mentions, across 14 files**. Every
  one of those 14 files now opens with a note that the runner is absent and the step is to be
  performed by hand, carrying the re-derivation command rather than a frozen count. The procedure
  around the commands is untouched — it is the part with the value.
- **`live.md` and `hooks.md` get a stronger note.** Both are built almost entirely around absent
  scripts (a live-variant browser server, a hook installer) and **cannot** be followed manually.
  They are marked as documentation of a feature this repository does not have, rather than pretending
  a human can stand in for the missing binary.

## 2 — `emilkowal-animations`: the dead link is fixed, the NUMBER IS NOT CHANGED

Removed the `[metadata.json](metadata.json)` row; the file does not exist. Checked every relative
link in that SKILL.md — 46 resolve, that was the only dead one.

**I did not change `0.11 px/ms` to `0.4`, and the brief told me not to if I could not verify it.**
I could not. This tree reaches no network: the `pre-tool-use` hook refuses external HTTP, the Bash
sandbox has an empty allowed-host list, `node -e "fetch(...)"` returns `ERR fetch failed`, I have no
WebFetch tool, and no local `vaul` or `@carbon` copy exists anywhere under `/Users/adamks`. Swapping
one unverified figure for another is the defect, not the repair.

**And there is a substantive reason to doubt the comparison itself.**
`references/interact-momentum-dismiss.md` cites *Building a Toast Component* — **Sonner**, not Vaul.
Vaul is the drawer library. A toast's swipe-dismiss threshold and a drawer's are not obviously the
same constant, so `0.11` may be correct for what this rule is actually about. **Whoever verifies
should check Sonner first, then Vaul, and decide which library this rule is describing.**

## 3 — `timing-under-300ms` is redesigned, and its evidence is in-repo on purpose

The old rule: *"User-initiated animations must complete within 300ms"*, `400ms` as **Fail**,
severity **HIGH**. Wrong as a universal hard fail — the predicate cannot tell a drawer from a
dropdown. Two checks **inside this repository**, both runnable by the next reader:

- `emilkowal-animations/references/timing-drawer-500ms.md` ships **500ms** as the *correct* drawer
  duration, under the heading "Drawer components are an exception to the 300ms rule". Our two
  animation skills would have flagged each other.
- `emilkowal-animations/references/timing-300ms-max.md` — **the source of the 300ms number** —
  already scopes itself: *"150–250ms for micro UI changes, 250–400ms for larger context switches,
  longer durations only for marketing/intro animations."* The flat 300ms fail contradicted its own
  source.

Replaced with **`timing-duration-by-class`**: a five-row budget keyed on element class (micro
feedback · local transition · context switch · full-surface · ambient), with the checkable procedure
— identify the class, compare against that row **only**, frequency breaks ties — and severity
dropped HIGH → MEDIUM, because a duration outside budget is craft, not correctness. A 400ms drawer
passes; a 400ms button still fails. **Renamed rather than retuned** so a finding quoting the rule id
cannot re-imply a universal ceiling. All three sites updated.

**Carbon `slow01`/`slow02`, Vaul's drawer duration and Material's upper bound are deliberately NOT
quoted in the skill.** Same reason as §2. Their URLs are named in the skill so the next person can
check them; the two in-repo citations carry the rule on their own.

## 4 — `design-orchestration`'s dead route

It referenced `multi-agent-brainstorming` at **five** sites, including the branch that *REQUIRES* it
for a high-risk design decision. That skill does not exist: `CURATION.yml:209` records the cut and
names the replacement on the same line (`# → multi-agent-patterns`). This matters more than a broken
link usually would — `design-orchestration` is the only skill `designer` declares, and its own text
says *"This skill does not generate designs"*, so routing is its entire value and the escalation
branch routed nowhere.

Repointed all five, and stated plainly that the substitution **is not a drop-in**:
`multi-agent-patterns` describes architectures and carries the debate protocol this step needs, but
is not a packaged validation run. Named the concrete in-repo route — the `reviewer` engine against
`.claude/review-lenses.yml`. Skill not deleted; `.claude/agents/**` untouched.

## The one thing I broke, and why the fix is not a repoint

Stripping `allowed-tools` turned **three tests red in `scripts/skill-clamp.test.mjs`**. They used
`impeccable` as a live positive control against the shipped skill — correct design, and the failure
is the test working.

**Repointing them at `pitch-deck-visuals` alone would have been the trap.** `impeccable` was the
only **shipped** skill declaring `allowed-tools` in the **block-list** form; `pitch-deck-visuals`
and `react-patterns` are both inline. A pure repoint leaves schema-lint's block-list parse branch
exercised by nothing, while every test stays green — the class this repo names in five other places,
introduced by the fix for an instance of it.

So: the single-pattern control moved to `pitch-deck-visuals`; a **new test** covers the block-list
form with a fixture skill installed into the throwaway root and registered in the throwaway
`MANIFEST.json` (schema-lint skips any skill the manifest does not know), restored in `finally`; and
a **new regression guard** asserts `impeccable` now attaches cleanly, so the field returning is a red
test rather than a silent re-clamping of `designer`. Header census corrected 8 → 7 skills, 2 → 1
single-pattern clamp.

**Mutation-checked, not assumed:** re-adding `allowed-tools: Bash(npx impeccable *)` makes the new
guard the only failure and the suite exit **1**; removing it exits **0**. 21 tests → 23, all pass.

## Verification

| Command | Result |
|---|---|
| `npm run check` | **48 of 48 passed · 0 failed · exit 0 · every step ran** (222.1s) |
| `node .claude/hooks/schema-lint.js` | **18 pass · 0 fail · 0 warnings** · exit 0 |
| `npm run check:curation` | exit 0 |
| `npm run check:manifest` | exit 0 |
| `npm run check:routers` | exit 0 |
| `npm run check:citations-exist` | exit 0 |
| `npm run test:skill-clamp` | 23 pass · 0 fail |

The first `npm run check` was **47 of 48**, failing `test:skill-clamp`. That is recorded because the
failure was mine and real, not because the suite was flaky.

Removing `allowed-tools` left `MANIFEST.json` valid with no rebuild, as the brief predicted — the
manifest stores name, description, tags and path, and neither was touched. Verified rather than
trusted.

## Blockers

**One, and it is not mine to clear:** the velocity threshold (§2) and the external motion figures
(§3) need a source fetch this session cannot perform. Both are reported to the dispatcher with the
exact URLs. Nothing is encoded from recollection in either place.

**Standing caveat.** Author-recorded against a deterministic floor: one agent, one model family. The
checks ran and are green; that is not the `tier: full` review being satisfied.
