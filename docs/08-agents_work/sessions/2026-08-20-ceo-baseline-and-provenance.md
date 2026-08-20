---
date: 2026-08-20
role: ceo
task: establish the green baseline, then P0.5 — provenance that travels
qa_verdict: PASS
tier: irreversible
---

Two deliverables: the baseline nobody had measured, and P0.5.

**The repo is green — 28 of 28.** Measured by running every blocking step individually, because
`npm run check` is `&&`-chained and fail-fast: one invocation answers "is it green?" and never "how
green?". The union is **28 steps, not 26** — `check` omits `test:tier-gate` (CI runs it), CI omits
`test:probe-readonly` and `test:pre-tool-use` (`check` runs them). Neither alone establishes green.
Corroborated by CI on `origin/main` = success. Baseline commands and per-step results: this file's PR.

**The sandbox armed in #94 broke three things nobody had measured.** Not defects — containment doing its
job — but unbudgeted, and they landed with `enforcement: block`:
1. **3 of 28 checks fail inside an agent session**: `test:registration`, `test:skill-clamp` (`EPERM`
   writing under `.claude/`) and `check:mc` (`EADDRINUSE`). An agent verifying its own work sees red CI
   does not, with no hint the cause is its own containment. All three pass with the sandbox off.
2. **`gh` is dead in-session** — `denyRead` covers `~/.config/gh`.
3. **The Git Worktree Protocol is unexecutable.** Worktrees go under `$MAIN_REPO/.worktrees/`, outside any
   agent's project root; a spawned worker cannot write to a sibling worktree either. **Rule 7 cannot be
   followed by a sandboxed agent.** Founder decision 2026-08-20: add `**/.worktrees` to
   `sandbox.filesystem.allowWrite`, pinned by a new assertion in `sandbox-config.test.mjs` so the decision
   cannot silently vanish the way it silently arrived. **The fix is UNVERIFIED at runtime** — settings are
   read at session start, so this session can only verify its shape. Acceptance test is in `SANDBOX.md`;
   treat Rule 7 as still blocked until someone runs `git worktree add` from a fresh session.

**P0.5 — provenance that travels.** 26 `sources:` citations over 15 blobs at two agentvibe-only revs were
validated with `git cat-file -e`, so every generated project failed `schema-lint` before anyone touched it.
Now validated against a vendored content-addressed manifest (`.claude/provenance/sources.json`, 15 records,
15,976 B standing in for 186,938 B of source). Objects absent → pass; objects present → byte-checked.
The 26 citations were **not** edited: the manifest key *is* `path@rev`.

Proved by executing the same transplant twice — `rsync --exclude=.git` + `git init`, per `newproject`:
**pre-fix exit 1, 26 citation failures, `18 pass · 2 fail`; post-fix exit 0, `18 pass · 0 fail`.**

**The review caught what I did not.** I verified the headline claim and stopped. The reviewer asked the
user's question — *is a generated project green?* — and found it still red, moved from step 1 to step 17,
because the CI step this PR **adds** (`test:provenance`) itself needs the object store. Fixed by skipping
the object-dependent cases with a visible reason. Two further findings taken: nothing bound the manifest's
`commit` to its `rev` (a fake 40-hex sha silently disabled the byte check even where objects were present),
and `gitBlob` collapsed `unresolved` into `pass` — with `git` off `PATH`, lint read `18 pass · 0 fail` while
byte-verifying **0 of 15**, a direct breach of Rule 10. The label now reports
`N byte-verified · M shape-only` and names the reason.

**Accepted residue, not fixed:** `bytes`/`lines`/`headings` are recorded but never cross-checked by the lint
(F4); no `.gitattributes`, so a CRLF checkout would false-red the byte comparison (F7); `~/bin/newproject`
is outside the repo, so P0.5's actual beneficiary ships ungated — that is P1.

**The 2026-09-08 dispositions — two waivers and one refresh.** Founder decision: waive, with the cost
written down, because a bare waiver changes nothing (P2/K — the deadline enforces that a waiver was *filed*,
not that enforcement advanced). `c-shadow-window-open` and `c-effort-frontmatter-binding-unverified` waived
to **2026-11-17** — not the 2026-12-08 first proposed, which is 110 days from `first_waived` and would have
tripped the 90-day waiver cap and turned `ledger lint` red three weeks *before* the waiver lapsed.

**`c-read-only-binding-unverified` is deliberately NOT waived.** Waiving it took `ledger verify` from 5
would_block to 4, and the line that vanished was that claim's own `claim-judge` result — judged against the
same empty panel it could not judge the day before. That trades **Rule 10** ("a resolver never passes what
it could not check", one of the few CLAUDE.md marks `ENFORCED`) for a smaller number. It stays on `refresh`
with `valid_until` bumped instead — the disposition keeps the claim honest, the date clears the deadline,
and they are different mechanisms. **5 is the intended outcome; a later reader who tidies it to 4 will have
reverted a founder decision.**

**Still open:** `c-rolling-five-hour-window` lives in `~/.warroom/ledger/global.yml` — outside the project
root, outside git, unreachable from any PR. Its waiver **lapses 2026-09-09**, and a lapsed waiver fails
harder than none. The PreToolUse hook refused the write, correctly, and it was not routed around. Founder
must apply it by hand; the text is prepared.

**Corrections to this repo's own record**, each found by running something: `ledger verify` reports **5**
would_block, and the 6th I first saw was my own artifact — `sweep` exits 1 when the log **exists but is
empty** and 0 when it is **absent**, so `c-run-log-has-a-reader` measures the harness's bookkeeping, not the
property it asserts, and it is order-dependent inside `verify`. **Three** claims carry an undisposed
`valid_until: 2026-09-08` (`c-shadow-window-open`, `c-effort-frontmatter-binding-unverified`,
`c-read-only-binding-unverified`), plus `c-rolling-five-hour-window` whose waiver lapses that day — which is
why the documents variously say three, four and five without saying what they counted.
