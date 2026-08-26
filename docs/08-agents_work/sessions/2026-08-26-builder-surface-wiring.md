---
date: 2026-08-26
role: builder
task: surface-wiring
qa_verdict: PASS
tier: full
engines: [builder]
claims_touched: []
decisions:
  - "Gates become a data file with a `kind:` — `command` (a process decides, `run:` is the argv) or `human` (a person decides, and no `run:` is permitted). The two were one string in one array before, so 'a human must approve' and 'nothing implements this' were indistinguishable."
  - "`.claude/hooks/schema-lint.js` is NOT edited. It is irreversible tier and would have raised this PR's floor. The cost is two lists of one thing, paid for with a drift finding that fails in both directions — the treatment package.json already gets from scripts/lib/check-suite.js."
  - "The blocking assertions ride `test:playbooks` rather than taking a step of their own. A new suite step means editing scripts/lib/check-suite.js and .github/workflows/ci.yml, both irreversible."
  - "`/audit` deliberately names no playbook. Collapsing it onto the gate would be wrong: the gate is diff-scoped end to end and an audit has no diff."
  - "framer gets 5 dispatch sites, not 6. launch-landing-page/positioning was considered and refused — the stage's exits are two source-verified claims, which is sourcer work."
corrections:
  - "REFUTED — the brief's tier. It said `lite`; the diff floors at `full`, because (a) cannot be done without a file under `scripts/**`. Measured: `node scripts/classify.mjs` on the 17 changed paths → floor=full, set by scripts/check-gates.mjs."
  - "REFUTED — 'no resolver' was stated too broadly. `scripts/run-gate.mjs` and `scripts/verdict.mjs` both exist and both execute. What did not exist was anything that reads a playbook's `gate:` and routes it anywhere."
  - "FOUND, not briefed — `/ship` declared `playbook: ship-feature` while ship-feature's triggers listed only `/build` and `/fix`. Found by running the checker, not by reading."
  - "FOUND, not briefed — `scripts/playbooks.test.mjs` writes fixtures into the live `.claude/playbooks/`, so any concurrent reader of that directory races it. Measured 5 of 10 runs failing."
  - "SELF-CORRECTED — I wrote a relayed discriminator (`agents dispatched == 0`) into two files and a test before it was refuted. It separates nothing: an entry refusal dispatches none, an oracle dropout dispatches four and establishes nothing, a real failing check establishes something with one. Replaced by `was anything established about this diff`, the phrasing qa.js itself emits."
  - "REFUTED — the replacement instruction. I was told PR #115 had landed a terminal `REFUSED` value distinct from `BLOCK` and to name it. Measured: #115 is OPEN and DRAFT, merged=null; origin/main is 47dbbd6 carrying only #108; `grep -c gateBlock .claude/workflows/qa.js` is 5 on both refs and the refusal path returns `gateBlock` in both. Documented as pending, with a test that fails when it lands."
---

# `gate:` was a spelling allowlist and `triggers:` was decoration

**The measured state at 244e8db.** `.claude/hooks/schema-lint.js` held a four-name array, refused any other
spelling of `gate:`, and that was the whole mechanism. The three names in use appear seven times across the
six playbooks; grepping them under `scripts/` and `.claude/workflows/` returns the array and two test
fixtures. Nothing executed. `triggers:` was worse: one playbook of six carried it, and `grep -rn triggers
scripts .claude` found no reader anywhere in the repository. A stage could declare `gate: qa-verdict`, exit
having run nothing, and every check stayed green.

**What was already there.** The brief said there was no resolver. Two exist and both work — `run-gate.mjs`
routes a diff to the binding gate, `verdict.mjs check` exits non-zero unless a committed verdict is bound to
the exact diff. What was missing was never the mechanism; it was the sentence joining the playbook to it.
That is the same finding `run-gate.mjs`'s own header records about `qa.js`, one layer up.

**The shape of the fix.** `.claude/gates.yml` declares four gates as data. `qa-verdict` is `kind: command`
and carries `run: node scripts/verdict.mjs check`; `node scripts/check-gates.mjs resolve qa-verdict` runs it
and returns pass on exit 0, fail on exit 1, and **unresolved on anything else** — a spawn failure, a signal,
or exit 2. Unresolved is a third exit code, not a synonym for fail, because "the gate said no" and "the gate
could not be asked" take different remedies. `founder-approval`, `outbound-approval` and `migration-approval`
are `kind: human`; resolving one returns `unresolved` with reason `human-stop`, always, and the checker
refuses a `human` gate that carries a `run:`. That refusal is the load-bearing half of (b): faking a human
stop into a script is the direction this ambiguity would have resolved in on its own.

**`migration-approval` is named by no playbook** — zero occurrences, checked. It survives with an
`unused_reason` of 787 characters carrying its own falsification condition, the mechanism `EXCLUDED` uses in
`scripts/lib/check-suite.js`. A declared gate that nothing names and nothing explains is the original defect
in miniature.

**The non-vacuity proof, which is the part worth reading.** Six mutations, each run against
`npm run test:playbooks`: gates.yml stops declaring a gate a playbook names → **exit 1**; the gate's `run:`
points at a script that does not exist → **exit 1**, `run names scripts/gone.mjs, which does not exist — the
gate resolves to nothing`; a playbook loses its `triggers:` → **exit 1**; a command names a playbook that
does not exist → **exit 1**; a human gate gains a `run:` → **exit 1**; framer's dispatch sites drop from 5
to 2 → **exit 1**. Then the one that matters: with `gates.test.mjs` taken out of the step and the gate and
the triggers **both** broken, the step exits **0**. Put the assertions back against that same broken tree and
it exits **1**. The greenness is bought by the assertions, not by luck.

**A race, found by execution.** `scripts/playbooks.test.mjs` lints by writing
`.claude/playbooks/fixture.yml` into the live tree and unlinking it. Run concurrently with a file that reads
that directory, it throws ENOENT — 5 of 10 runs, against 0 of 10 with `--test-concurrency=1`. The flag is the
narrow fix and it is named in the test header, because the hazard is the shared directory and the next
concurrent reader meets it again.

## The boundary of what this buys, stated so nobody has to discover it

**A playbook can now VERIFY that the gate passed. PRODUCING the verdict still requires the session to
invoke the panel.** Those are different acts and this change closes only the first.

`gate: qa-verdict` resolves to `node scripts/verdict.mjs check`, which asks one question — is a PASS
committed and bound by sha256 to this exact diff — and answers it deterministically, from a file, with no
model in the loop. That is why it is safe to put behind an exit code. What it does **not** do is run five
dimension reviewers, three adversarial verifiers per finding, and an Opus judge. Nothing in
`scripts/check-gates.mjs` can: `Workflow` is a main-session tool, the gate schema here admits only
`node scripts/...`, and a dispatched engine that tried would silently no-op.

So the loop is: **session runs the panel → session records the verdict → anyone can check the binding.**
The third step is now mechanical and the first two are not. A stage declaring `gate: qa-verdict` is
asserting the third, and a reader who takes it for the first has read it wrong.

This is a real narrowing and it is the honest one. The alternative — having the checker claim to run the
gate — would produce exactly the failure the parallel lane measured: a verdict that looks like review and
is not.

## Constraints on the gate route, re-checked against this wiring

A parallel lane measured `qa.js`'s entry contract and sent five constraints. **This route satisfies all of
them, and the measurement is that it never enters that contract at all.** `git diff origin/main...HEAD |
grep` for `Workflow`, `scriptPath`, `args.tree` and `tree:` returns **zero** additions — against a control
of 20 for `qa-verdict`, so the instrument was pointed at the right tree. The gate declaration schema forbids
it structurally: a `kind: command` gate's `run:` must begin with `node` and name a script under `scripts/`,
so a `Workflow` invocation cannot be declared as a gate here even by accident. `qa-verdict` reads a
**recorded** verdict (`node scripts/verdict.mjs check`); it does not run the panel.

**Constraint 1 — the session invokes, not a dispatched engine — holds in the data.** All seven gated stages
carry **zero** `dispatch:` entries; the five framer sites I added all went into ungated stages. I considered
making that a lint rule and **rejected it**: the obvious spelling, "a stage carrying `gate:` may not carry
`dispatch:`", refuses a legitimate shape already in use — dispatch a reviewer for findings, then have the
session resolve the gate — and `scripts/playbooks.test.mjs`'s own fixture is exactly that shape. It is
documented in `.claude/gates.yml` instead.

**Constraint 4, re-measured here on this branch rather than taken on trust:** `run-gate.mjs --json` →
`floor: full`, `gateRequired: true`, exit **0**; with `--require`, exit **1**. Its emitted `args` are row 6,
the safe shape: `tree` absolute, `ref` sha-tipped, all three keys present.

**The discriminator I was handed was wrong, and I had already written it down.** I was told the two
distinguishers between a refused gate and a real block were `agents dispatched == 0` and the literal
`REFUSED`; I put both into `recording_hazard` and `/review`, and pinned the first in a test. **The count
separates nothing in either direction** — there is more than one refusal class: an entry refusal dispatches
none, an oracle dropout can dispatch four and establish nothing, and a real failing check can establish
something with one. The cut is **whether anything was established about this diff**, which is the phrasing
`qa.js` already emits in its own refusal summary. All three sites are corrected and the assertion now
demands the refutation be present in place, so the bad discriminator cannot come back quietly.

**And the replacement I was handed was also wrong, which is why I measured it.** The instruction was to
"name the value" because PR #115 had landed a terminal `REFUSED` distinct from `BLOCK`. Verified in this
tree: **#115 is OPEN and DRAFT, `merged=null`**; `origin/main` is `47dbbd6` and carries only PR #108;
`grep -c gateBlock .claude/workflows/qa.js` returns **5** on both `origin/main` and this branch, and the
entry-refusal path ends in `return gateBlock(...)` in both. A refusal is still spelled as a block. Naming a
value that does not exist would have been the third relayed-mechanism error of the day and the first to
reach a file as an instruction. The pending change is recorded as pending, and
`scripts/gates.test.mjs` carries a tripwire that **fails when #115 lands**, which is the signal to replace
the reading with the value. A hazard notice that outlives its hazard teaches the past.

**The BLOCK-vs-REFUSED distinguisher is handled where a person meets it**, in `.claude/gates.yml`'s
`recording_hazard` and in `/review`. `verdict.mjs` independently refuses the word: `--verdict BLOCK` exits 2,
`must be PASS or FAIL`, so a BLOCK cannot be recorded verbatim. **That field is documentation, and the test
asserts it says so** — nothing here reads `qa.js` output. What *is* enforced is the same distinction one
layer down, where this checker does have reach: `resolveGate` returns `unresolved`, not `fail`, for a spawn
failure, a signal, and every exit code other than 0 and 1.

**Residual, recorded because it cannot be fixed here.** Neither invocation spelling fixes *which copy* of the
gate reviews a PR: `scriptPath` is relative and `name:` resolves against the `.claude/workflows/` of whichever
tree, so a route run from a PR worktree has **the PR's own possibly-modified gate review the PR**.
`run-gate.mjs` states in its own header that it cannot fix this and does not change its exit code on it. A
human closes it by launching from a `main` checkout. Not attempted.

**What I did not do.** I did not touch `.claude/hooks/schema-lint.js`, `scripts/lib/**`,
`.github/workflows/**`, `CLAUDE.md` or `docs/STATUS.md`. Editing the first three would have moved this PR to
`irreversible`; the last two belong to another lane. `/audit` keeps its own shape rather than collapsing onto
the gate, and the file now says why in the file itself.

Verification: `npm run check` → **46 of 46 passed · 0 failed**, in this worktree, twice. Commit 1 was checked
in isolation (`git archive HEAD~1` into a scratch tree) and is green on all five affected steps, so neither
commit lands the tree red.

**A PASS I record myself is not a review.** One author, one model family, no independent reviewer has seen
this. At `full` tier that is what the record says, not what it is.
