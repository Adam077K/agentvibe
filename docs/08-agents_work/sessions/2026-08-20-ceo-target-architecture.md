---
date: 2026-08-20
role: ceo
task: target architecture — challenge the harness, plan what it becomes
qa_verdict: PASS
tier: trivial
---

The founder asked for the system to be challenged and replanned. Thirteen agents across two waves;
deliverable is [TARGET-ARCHITECTURE.md](../../03-system-design/TARGET-ARCHITECTURE.md). No code written.

**The finding that reorders the plan:** every project this system generates is born broken. `newproject`
strips git history (`rsync --exclude='.git'`, then a fresh `git init`), so the **26 lens provenance
citations** across two agentvibe-only revs cannot resolve — `schema-lint` hard-fails, exit 1, and
`fetch-depth: 0` is inert because the object never existed there. Separately, `newproject` installs the
**v1 launcher** (2,764 lines, 90 placeholders) while `warroom-install.mjs` (v2.0.0) is never reached, and
nothing guards the fork. Phase 9 is not a victory lap scheduled last; it is a broken foundation scheduled
last. Founder decision: fix portability early, keep the rollout last.

**The gate:** two real holes, not three. `warroom merge <N>` never opens a PR so CI never runs, and
`qa-lead-pass.yml:124` greps a verdict the author committed. The alleged verifier-priming defect was
**already fixed in PR #42** — I relayed it as live and was wrong.

**Method finding, and the most durable thing this round produced:** two CEO lanes generated seven false
findings between them. Every one died to re-running; **none** to re-reading. Three were mine. In this
repository, house style preserves superseded statements beside their corrections, which makes prose an
unreliable oracle by design — so any control that gates on review-by-reading gates on nothing. That is
what `qa-lead-pass.yml` does.

Nine founder decisions locked, recorded in §1 because several override a documented position. Decision 2
(build the machine before running a real venture) is the **fourth refusal** of the same recommendation and
collides with stop conditions 6 and 7; §12 states the cost rather than relitigating it.

**The adversarial pass ran, and killed the document's own keystone.** An earlier draft called
`run-gate --require` in `cmd_merge` "~6 lines, the highest leverage change in the system" — twice, to the
founder. `run-gate.mjs`'s own header says **it cannot execute `qa.js`**, and `--require` exits 1 *when the
gate is required*, so that fix would have refused every irreversible merge unreviewed and waved through
every lite one. It also fails open on the default ref (verified: `EXIT=0`, "Nothing to gate"). I read the
USAGE block and not the disclaimer ten lines above it — the same failure this session documented, committed
by its author, in its highest-priority item. Also false and corrected: "`qa.js` is invoked by nothing"
(`coding.js:120` calls it), and "`Turn.stop` is one line" (it is a cache migration in `index-store.ts:31`).
Provenance promoted to P0.5 because P0 adds citations to the files that cannot travel.

**Codex invocation is now verified from source**, and it carried two traps: `-p` is `--profile` not prompt,
and open bug #19945 makes `codex exec` return **exit 0 with empty stdout when detached from a TTY** — which
is exactly how a resolver runs. Gate on a `turn.completed` event, never the exit code.

**Second wave — eight lanes closed the surfaces the first draft left empty.** Twelve of twelve surfaces now
carry a plan item. What it found, all verified by execution: **`reviewer` declares `Bash`** and a live probe
wrote a file, so the engine that reviews code holds a shell (`probe-readonly-engine.sh --report` now prints
FAIL — and the script's own failure text misdiagnoses the cause as "the tools field is decorative", when the
field binds exactly as declared and the defect is the grant). **50.3% of subagent runs end mid-tool** —
1,298 `tool_use` against 794 `end_turn` across 2,694 transcripts — so §5's return-path defect is the
corpus-wide default, not a session anecdote, and **there is no `stop_reason` for a `maxTurns` cut at all.**
**`framer` is dispatched by nothing** (zero hits across playbooks and workflows) while five of eight lenses
name it — the playbooks are the defect. **`design.js`'s schema cannot hold a screenshot**, so the one
workflow dispatching `designer` cannot use the perception loop that *does* work. **88 of 91 session files
say `qa_verdict: PASS` and zero say FAIL** — the labels have collapsed a second layer up. **`general-purpose`
(69 dispatches) outnumbers every named engine.** Two dormant landmines: a skill's `allowed-tools`
**subtracts**, and `impeccable` would clamp `designer` out of its own perception loop; and three agentTypes
in `design-screen.md` already resolve to nothing, falling back to `general-purpose` with tools `*`.

**A correction I nearly shipped as a deletion:** the draft said 688 `budget.block` rows were test output.
**Thirteen are real** — eight stall blocks and five window blocks at 4,991,457 against a 3,000,000 ceiling.
They are the only real budget evidence in the repo, and "cleaning up the 688" would have destroyed it.

**Third wave — three lanes sent to find what the plan did not contain at all.** Seven additions adopted
(§9.6), and **the walk finally happened.**

**The walk stops at step one, and not where anyone expected.** `init-from-template.sh` runs 21 substitutions
against **one** surviving placeholder, because `CLAUDE.md` was correctly filled in with Agentvibe's own
Project State and no pristine copy was kept — so every generated project inherits a Project State describing
PR #47, and `.template.env` ships pre-filled with this repo's identity. Further along: **nothing reads
`.claude/playbooks/` at runtime** (the only references build an index), **three of six playbooks are
referenced by zero commands**, **exit-criterion names are unvalidated free text** — proved by swapping one
for `criterion(vibes-are-good-trust-me)` and getting 18 pass · 0 fail from both the playbook tests and
schema-lint — and **two of four gates exist only as strings in a `GATES` array**. `grep -ci "vercel|deploy"
.claude/settings.json` → **0**. Nothing deploys. Also found: `check-registration.test.mjs:93,115` writes into
the live tracked security hook and restores in a `finally`, so a Ctrl-C mid-test leaves `pre-tool-use.sh`
modified on disk.

**Two of four foundations came back weaker than believed.** The claim ledger is **40 claims — 37 command, 1
source, 2 judge; exactly one `external-fact`, and it is the canary**. It re-derived the diff gate's domain
limit under a new name, and is structurally blocked: `sourcer` has network reach and no `Write`, so the
domain-general half has no producer. Domain-as-lens carries analysis but not transaction — **17 of 22
playbook exits carry no verifier**, and the config itself admits *"this repository has no outbound-send path
to name."*

**The thing no document named:** the founder is the only unmodelled resource, metered nowhere, while tokens
are metered precisely — and P3, P5 and P6 each increase the draw on it.

**Founder decisions 10–13:** keep the sequence (early-evidence hedge declined, third time, recorded with its
cost) · adopt egress control, halt/undo and a skills scan · meter founder attention · name the transaction
gap. Scoped credentials deferred with a reason.

**Not covered:** nobody measured whether this repo is green right now — every estimate assumes an
unestablished baseline. No fresh-clone test (sandbox refuses `.git` creation). The adversarial pass was a
single model family and so is **not an independent panel** — the deficiency §4 exists to fix, reproduced in
this document's own review. **And one item is dated rather than planned: the shadow-to-blocking promotion
review falls 2026-09-08 against a corpus that is 100% harness self-description, 36% of it one canary.**

`qa_verdict: PASS` is **author-asserted**, and this session is the reason that is a defect: the gate that
would make it a verified claim has the two holes described above. Recorded as an instance, not an exception.
