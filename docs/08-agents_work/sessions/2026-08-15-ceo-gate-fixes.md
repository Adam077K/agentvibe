---
date: 2026-08-15
role: ceo
task: gate-fixes
tier: irreversible
qa_verdict: PASS
---

Three fixes, all aimed at one measured fact: **the QA gate has returned 34 PASS and 0 refusals across its
entire recorded history.** Founder-directed. `npm run check` exits 0; 193 tests across 8 files.

**1. The gate could inherit a verdict written for other work.** `qa-lead-pass.yml` resolved the branch name
against session files **already merged to main**, and `sort | tail -1` picked one arbitrarily when several
matched — so a branch whose slug happened to collide with an earlier phase inherited that phase's
`qa_verdict: PASS`. The PR-diff path beneath it was already correct; deleting the glob makes it
unconditional. A pure subtraction, at both sites, including the irreversible-tier check where inheriting a
merged PASS matters more rather than less. Also corrected: the file's own header stated the old contract, and
three failure messages told the reader the gate searches for `*-<slug>.md`, which it no longer does — a
failure message that instructs you to create a file the gate will not look for is worse than none. The now-dead
slug derivation is removed rather than left as decoration.

**2. Two of three adversarial verifiers were told to assume the finding was false.** `qa.js` ran
*"default to is_real=false"*, a neutral reproduction lens, and *"assume the finding is a false positive"* —
and none that looked for the ways a defect bites. That is a measured failure mode, not a stylistic quibble:
framing alone collapsed defect detection from **97.2% to 3.6%** on one model and 68.4% to 8.5% on another
across 250 CVE patch pairs, recovering to 94–100% when the framing was redacted (arXiv:2603.18740). **The
skeptical posture is kept** — false positives that flood a gate teach people to route around it, which is the
failure the panel was built against. What changed is that it no longer holds two of three votes: one refutes,
one reproduces neutrally, one steelmans. A panel that can only argue one direction is not a panel.

**3. `independent: true` was unsatisfiable, so three lenses could not run.** `security`, `adversarial` and
`evidence` each required ≥2 model families; none is configured. Rather than delete the concept, the rule now
names its mode: `independence: vendor` (≥2 families, unchanged, still enforced by the shared
`independenceIssue()` that also governs `risk: high` claim panels) or `independence: provenance` (one family
permitted, but the judge must not see the producer's reasoning or its claims about its own work).
`schema-lint.js` refuses a lens claiming independence without saying how, refuses an unknown mode, refuses
`independence` declared without `independent: true`, and refuses `provenance` over `scope: whole-artifact` —
judging a whole artifact requires the producer's own account of it, which is the priming the mode exists to
prevent. **An unstated mode still defaults to `vendor`**, so a one-family lens that forgets to declare cannot
slip through the satisfiable door. Four tests replace the one that pinned the old rule; the lens suite is
27/27.

**The second-family question is deferred, not closed.** Founder decision: revisit after this gate has actually
refused something. `independence: vendor` remains valid and is what a lens should declare if Codex or another
family is ever provisioned. The research recommending against it is at
[MODEL-DIVERSITY.md](../../03-system-design/MODEL-DIVERSITY.md).

**Not done, and deliberately:** the roster migration (17 agent files → 7) and the OS sandbox. Both are
irreversible and large, and both would be better informed by first running one real venture task end to end —
which no work in this repo has ever done.

**A false positive in my own safety floor, recorded because it will recur:** `pre-tool-use.sh` scans the whole
Bash command string, including heredoc bodies, so a commit message *describing* a destructive command is
blocked as if it were one. Worked around by writing the message to a file; not overridden.

---

## QA verdict provenance — read this before trusting the PASS

**The gate refused this PR, and it was right to.** PR #40 ran `Verify QA Lead PASS` and blocked: six session
files carried `qa_verdict: PENDING`, and the fix in this very commit made it read *this PR's own* session
files rather than inherit a verdict from merged work. **A gate with 34 PASS and 0 refusals refused for the
first time, and the first thing it caught was its author's own change.**

`PASS` was then recorded on **founder authorisation**, after the **author's own review** — not an independent
one. Stated plainly, because the first fix in this commit exists to stop a verdict meaning less than it looks
like it means. Marking it silently would have made the fix theatre.

**What the verdict actually rests on:**
- The hardened hook fails CLOSED, and its failure mode is refusing legitimate work rather than permitting
  dangerous work. 49 tests, red-first, every dangerous case through both payload encodings. It replaces a hook
  that blocked **nothing**, so the change is strictly protective even where it misfires.
- The lens change keeps `vendor` as the default for an unstated mode, so no one-family lens slips through the
  newly satisfiable door.
- The gate change is strictly stricter, and was **observed** refusing this PR.
- `npm run check` exits 0 — 193 tests across 8 files.

**The unreviewed residual, named rather than hidden:** false-positive friction in `pre-tool-use.sh`. Three
instances were hit during this session — the harness plan directory, the session scratchpad, and a heredoc
*describing* a destructive command. Each cost friction; none permitted anything. A fourth class almost
certainly exists and has not been found.

**The fourth class was found, one turn after that sentence was written.** `git checkout <branch> -- <paths>`
restores files *from a branch*; the rule matches the `git checkout --` form and blocks it as if it were
`git checkout -- <paths>`, which discards. The two differ by one argument and by everything that matters. Hit
while splitting this very PR, on a clean tree where nothing could be discarded. Worked around with
`git restore --source=<branch>`, not overridden.

**And a fifth, which was not a scoping artefact but an outright bug in the rule — fixed here, red-first.**
The force-push guard is written twice, once per argument order, and only the first carried `\b` after the
`-f` alternation:

```
'git\b.*push\b.*(--force|-f)\b.*(main|master)'   ← bounded
'git\b.*push\b.*(main|master).*(--force|-f)'     ← not
```

So the second matched `-f` inside **any** hyphenated word following the literal `main` — `--body-file`,
`risk-full`, `notes-final`. A `git push` sharing a command line with `gh pr create --base main --body-file`
was refused as *"Force-push to main/master is blocked."* Three red tests reproduce it, seven pin that every
genuine force-push to `main`/`master` still blocks in both argument orders, and six pin the legitimate
shapes. **62/62.** Both orderings are now pinned, because fixing one and leaving the other is precisely how
this survived.

**The tally is five for five: every false positive so far has been the rule reading a command's *shape*
rather than its *effect*.** Four remain unfixed and are scoping artefacts of scanning the whole command
string; this one was a missing character and is gone.

**What an independent review would still add:** a reader who did not write the hook, checking the regex set
against commands this session never ran.

---

## The gate refused a second time, and the second reason is the more serious one

PR #40 was labelled `risk:irreversible` — truthfully; it touched `.claude/hooks/**`. The F13 step
(`qa-lead-pass.yml:339-351`) then required **every** session file in the PR diff to declare
`tier: full|irreversible`. Five of the eight declared `trivial` or `lite`, because five of the eight describe
read-only boards, planning and specification work. **They were tiered correctly.**

**Two mechanisms in this repo compute risk, and they disagree.** The classifier says:

```
$ node scripts/classify.mjs docs/08-agents_work/sessions/2026-08-13-ceo-rethink-board.md
    tier=trivial · matched: docs/** | **/*.md
```

F13 demands `full|irreversible` for that same file. `CLAUDE.md:156` states that
`scripts/lib/classifier.js` is *"one file computes risk, and it is the only implementation."* **It is not.**
F13 is a second implementation, it is stricter, and it is the one that blocks merges.

The available moves were: write `tier: irreversible` on five files describing read-only work; edit the
enforcement rule so it stops blocking the PR that its author is trying to land; or split the PR. **The first
spends exactly what fix 1 above was for** — a verdict that means less than it appears to. The second is the
thing gates exist to prevent, whatever its merits. Founder chose the third: this PR is the code half, and the
specification documents ship separately at their own honest tier.

**Left for a session that is not this one:** F13 should require the tier of the paths it *classifies* as
irreversible, not a uniform tier across every session bundled into the PR. Not fixed here, deliberately — an
author must not rewrite the rule that is refusing them. Recorded so the next reader inherits the finding
rather than the workaround.
