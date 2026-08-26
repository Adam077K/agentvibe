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

**What I did not do.** I did not touch `.claude/hooks/schema-lint.js`, `scripts/lib/**`,
`.github/workflows/**`, `CLAUDE.md` or `docs/STATUS.md`. Editing the first three would have moved this PR to
`irreversible`; the last two belong to another lane. `/audit` keeps its own shape rather than collapsing onto
the gate, and the file now says why in the file itself.

Verification: `npm run check` → **46 of 46 passed · 0 failed**, in this worktree, twice. Commit 1 was checked
in isolation (`git archive HEAD~1` into a scratch tree) and is green on all five affected steps, so neither
commit lands the tree red.

**A PASS I record myself is not a review.** One author, one model family, no independent reviewer has seen
this. At `full` tier that is what the record says, not what it is.
