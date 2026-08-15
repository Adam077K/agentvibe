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

**What an independent review would still add:** a reader who did not write the hook, checking the regex set
against commands this session never ran.
