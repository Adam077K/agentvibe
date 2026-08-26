---
date: 2026-08-26
role: builder
task: verdict-refuses-unknown-flags
qa_verdict: PASS
tier: full
risk: full
branch: fix/verdict-refuses-unknown-flags
---

# `verdict.mjs` refuses a flag it does not read, and gets the `--dry-run` the operator reached for

**The PASS is self-recorded.** One author, one model family, no external review. `tier: full` asks
for a reviewer plus a security lens; this record is the deterministic floor only.

decisions:
- **Refuse unknown FLAGS, not stray positionals**, and the boundary is written into the code rather
  than left to be discovered. Every live call site passes flags and values only — swept and pinned —
  so refusing flags breaks nothing, while refusing positionals needs a model of which tokens are
  values, and modelling is the shape of fix this repo has twice concluded is wrong.
- **Ship `--dry-run` as a real flag, not only a refusal.** I nearly cut it on the argument that
  `subject` is already the read-only preview. Measured before deciding: `subject --json` prints
  `{subject, base, bytes}` — **no tier, no tier driver, no path, no record body**. It is not a
  preview of what `record` writes, so a refusal alone would have left a writing tool on the blocking
  path with no way to look before it writes.
- **Only the two `fs` calls are gated.** `body` is built by one code path either way, so a preview
  describing a record the tool would not write is structurally impossible. A `--dry-run` that builds
  its own body reports a plan nothing executes, and nothing would notice.
- **`FLAGS` is the one list**, and `usage()` is generated from it. Two descriptions of one flag
  surface disagree silently — these already did.

corrections:
- **My first probe hashed the file LISTING and under-reported by five.** Every `record` in one repo
  writes the same path (one diff, one subject), so after the first write the names stop changing and
  real writes read as no-ops. It made the `origin/main` cell look like one bug instead of six. The
  instrument hashes bytes and mtime now, and the note is in the probe so the next reader does not
  repeat it. **Caught by disbelieving a `wrote=no` that sat beside stdout saying `recorded PASS`.**
- The header's USAGE block named **five** flags where the code read **seven**: `--evidence` and
  `--run-id` were readable and undocumented, so a reader checking whether `--run-id` was real would
  have concluded it was not.

claims_touched: none registered.

## The defect, measured

```
origin/main @ 47dbbd6:
  record --verdict PASS --by probe --dry-run   →  exit 0, WROTE .qa/verdicts/e3b0c442….json
```

`e3b0c442…` is the sha256 of the empty string — the empty-diff subject — written into a governed
directory by an operator whose entire reason for typing the flag was that it must not write.

Thirteen invocations, content-hashed, both cells. The one `wrote=YES` on this branch is the real
`record`: it is the **positive control**, and it fires in both cells, so "wrote nothing" is a fact
about the refusals and not about the instrument.

| invocation | origin/main | this branch |
|---|---|---|
| `record … --dry-run-typo` | exit 0 · **wrote** | exit 2 · nothing |
| `record … --force` | exit 0 · **wrote** | exit 2 · nothing |
| `record … --evidenc x` (misspelt) | exit 0 · **wrote** | exit 2 · nothing |
| `record … --evidence --foo` | exit 0 · **wrote** | exit 2 · nothing |
| `check --json --nope` | exit 1 · silent accept | exit 2 · named |
| `subject --verbose` | exit 0 · silent accept | exit 2 · named |
| `record … --dry-run` | exit 0 · **wrote** | exit 0 · nothing, previews |
| `record …` (REAL, control) | exit 0 · wrote | exit 0 · wrote |
| `subject` · `subject --json` · `check --json` · `check --repo --ref --json` | unchanged | unchanged |

**Six writes on `main`, one here.**

## The sweep, and what this narrows

`git grep -n "verdict.mjs"` plus the `$vtool` invocations in `bin/warroom` is the whole population.
Six live call sites, every one literal — **no dynamically built argv anywhere**, checked. Each is a
row in `CALL_SITES` carrying the string that proves it still exists, so the table cannot rot into a
list of invocations nobody makes, and a negative control asserts a non-existent string fails the
same test. `war-room/bin/PROJECT_NAME.tmpl` does not invoke it at all — the gate is deliberately not
ported there.

Refused now, silently accepted before:
1. **Any unknown `--flag`, on any command.** Nothing in the sweep passes one.
2. **A `--`-prefixed token in a value position.** `arg()` already dropped it to `null`, so the old
   behaviour never delivered the value either — this converts a silent data loss into a refusal.
3. **`subject --verbose`-shaped no-ops** that exited 0.

NOT refused, deliberately: a stray positional (`record PASS`). Named in the code, not left to be
found by making the mistake.

## Verification, by execution

- `npm run test:merge-gate` → **45 pass · 0 fail** (41 before; 4 cases added).
- **Six mutation proofs, each reddening its own case and no other:** the validator never called;
  `unknownFlag` always saying "known"; the walker swallowing a `--flag` as a value; `--dry-run`
  ungated; `--run-id` dropped from `FLAGS`; `usage()` reverted to the hand-written line.
- `npm run check` → **46 of 46 passed · 0 failed · exit 0 · 424.7s**.
- **`STEPS.length` is unchanged at 46** — the tests live where `test:merge-gate` already runs them,
  so no npm script was added and no documented figure moved. That was a constraint, not luck: the
  branch that moves those figures is `fix/ci-chain-structure-holes` and it is still open.
