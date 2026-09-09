# Handoff — Keel: the plan is finished, the build is not, and the one control the night was supposed to inherit has a hole in it

**From:** ceo (`ceo-1-1788609834`) · **Date:** 2026-09-07 · **Base:** local `main` = `b2cabad`, **162** commits
on top (`git rev-list --count main..HEAD`) · **Landing branch:** `docs/final-v2`, composed onto
`origin/docs/final-plan` (PR #131 head `7fe8ede` — the commit resolves locally; **the PR's own state is not
readable from here**, `~/.config/gh` is on `denyRead`) · **Pushed:** nothing. **Spent:** nothing. **Built:** one
branch, unmerged — see §2.

> **This replaces the version written at `b0fe224` this morning, which was already the second version of the
> day.** A long afternoon happened after it: R46 ran, a settling cell resolved an apparent contradiction between
> two capable lanes, the hook was reviewed and four defects were fixed on a branch, nineteen dangling claim
> citations were triaged, and a vendor source was found for a claim whose waiver expires **2026-09-08**.
> **Five of that version's statements are stale and are named where they stood:** its §1 figures for §L, §M, §N
> and the SPINE strike count; *"Eighteen files under `review/`"*; *"Research: 15 of 46 open"*; *"R46 is the unrun
> cell"*; and the classifier described as *"configured nowhere in this repository"*.
>
> **Every number below carries the command that reproduces it.** **Seven of that version's figures moved between
> this morning and this evening** — §L's total and its ABSENT count, §M, §N's total and its open count, SPINE's
> strike count, and the `review/` file count — and an earlier pass found three that no file supported at all.

---

## 0 · Read this first, in this order

1. `docs/03-system-design/final-v2/FINAL-PLAN-v2.md` — the plan. Assembled from `parts/`; **never edit it, edit
   a part and reassemble.**
2. `final-v2/SPINE.md` — what binds. **The spine wins over the plan wherever they disagree.** Read §I (open
   decisions) and the §A preamble.
3. `final-v2/DECISIONS.md` — the decision log. **§30 is the newest**; §29 is the one before it, and read the
   correction struck into §29's own head: an orchestrator's summary compressed two accurate facts from a lane
   into one inaccurate sentence, and the file corrects itself in place.
4. `final-v2/review/r46-classifier.md` · `review/restricted-hook-cell.md` · `review/hook-gaps.md` ·
   `review/night-safety.md` — **the afternoon's four files, and the ones that change what to build first.**
5. `final-v2/review/sandbox-P1-measure.md` through `sandbox-P5-envelope.md` — the sandbox panel, five sealed
   lanes. P1 is the only one with a shell; read its §9 and §10 before quoting its §0.
6. `final-v2/research/close-W.md` · `close-M.md` · `close-C.md` — the research close, verbatim.
   `research/five-hour-window.md` — the expiring claim.
7. `final-v2/review/terms-row-1.md` · `review/codex-rehearsal.md` — the two §I rows that closed.
8. `docs/08-agents_work/sessions/2026-09-07-ceo-research-close-and-sandbox-panel.md` ·
   `2026-09-07-builder-ledger-citations.md` · and, **on branch `fix/hook-separator-bypass` only**,
   `2026-09-07-builder-hook-separator-bypass.md`.
9. `final-v2/page/final-plan-v2.html` — the plan for a phone. `page/three-lenses-on-keel.html` — the criticism,
   presented.

Do **not** open `docs/03-system-design/round-6/`. The founder has refused it three times. It is not a judgement
about its contents; it is a decision about scope, and re-opening it re-opens a settled argument.

---

## 1 · If you can act on one thing, act on this

**A night child is bound by its argv and by nothing else.** Not by the constitution, not by the lenses, not by
the playbooks, and — as of this afternoon, measured rather than inferred — **not by the `PreToolUse` hook, not
by the allow list and not by the deny list either.** `bin/run` is what writes that argv, `bin/run` is **ABSENT**,
and nothing else in Gate B unblocks without it.

This survives any sandbox posture in either direction. It is not a posture question and it does not wait on the
founder's deferred decision.

**The chain, each link measured.** Every unattended child runs `--restricted` (§12.10 — find it by what it says:
`grep -n 'restricted --tools' parts/12-control.md`). `--restricted` **discards the project settings file
entirely**: `Bash`, the `PreToolUse` hook registration, and the `permissions` block, allow *and* deny. That file
is where the session-start hook is registered, so the constitution has a delivery path and nothing loaded onto
it — the per-child `--settings` replacement O87 specifies names `PreModelSwitch`, `PreCompact` and `SessionEnd`,
and omits **both** `SessionStart` **and** `PreToolUse`. `--settings` is the only lever measured to restore any of
it (R28, close-C cells D and E; `review/restricted-hook-cell.md` cells C and D2).

**The trap sitting next to it, and it is the obvious repair:** `--tools` restores the shell **without restoring
either control**. That is what a dispatcher reaches for the moment `--restricted` takes its shell away, and it is
measured to be the dangerous combination.

The owning mechanism is **O131** — the dispatcher builds each child's settings from a template it owns and never
accepts a settings file as a parameter. A dispatcher that accepts a caller-supplied `--settings` path has handed
the caller its child's confinement.

---

## 2 · There is a branch, it is unmerged, and it is the founder's to sign off

`fix/hook-separator-bypass` — **7 commits, 3 files, 1,058 insertions / 103 deletions**, unpushed and unmerged,
`irreversible` tier.

```
git rev-list --count 46cef7b..fix/hook-separator-bypass          # → 7
git diff --shortstat 46cef7b..fix/hook-separator-bypass          # → 3 files, 1058 insertions(+), 103 deletions(-)
git rev-parse --abbrev-ref fix/hook-separator-bypass@{upstream}  # → fatal: no upstream configured
```

**Four fixes, one defect class: a rule that recognises one spelling of a thing and misses the conventional one,
or computes its anchor over the whole command instead of over the one command it governs.**

1. **`3b5ce7e` — the separator bypass, across five rules.** Each matched trigger + a character class excluding
   `;` and `|` + payload, so a match could not span a separator **inside a quoted string**. Two children were
   given the same instruction in the same words: one wrote the call directly and was blocked, the other bound it
   to a `const` first and the hook returned **exit 0**. Neither was told to evade, and the one that got through
   wrote the *more* conventional style. Fixed by splitting on **unquoted** separators — one splitter, five call
   sites — not by widening the pattern, which would have restored the false positives the class exists to
   prevent. Twelve negative controls green in both cells, each refused by the naive fix, which is what makes it
   a narrowing.
2. **`8b584d3` — the removal rule, inverted.** It blocked the tilde spelling of the home directory and allowed
   the variable spelling: same directory, two spellings, opposite verdicts. Now refused **unless every target is
   shown strictly inside the project root or the scratchpad**, with unresolvable values refused rather than
   guessed at. Cost measured on fourteen realistic cleanup shapes rather than assumed: five newly refused, all
   unresolvable expansions.
3. **`354b925` — the remaining one-pass gaps, and the three false positives with them.** The browser guard's URL
   canonicalisation moved into a shared classifier; the fetch rule asks that parser instead of grepping the whole
   command string for a loopback name. The false positives were half the deliverable.
4. **`161bd76` — a scheme-less fetch operand is classified rather than missed.** Not a policy gap — external is
   refused and a bare host is external — a **parsing** gap: the grep saw only `https?://`. The fact that makes
   the new walk safe is that in that tool every positional operand *is* a URL; unrecognised flags are assumed to
   take a value, so the failure direction is a miss, never a phantom host.

**318 hook tests pass, zero fail, and no pre-existing test moved across any commit** — author-recorded in the
branch's session file. Re-run from a checkout at `/private/tmp/claude-501` it is **316 pass · 2 fail**, and both
failures are the location, not the code: the fixtures land inside a directory the hook allows outright, so the
scope assertions cannot discriminate. Same class as this repo's standing warning to measure at the session root.
Verify it where it belongs before quoting either figure.

**Twelve further gaps were found in that hook and all twelve are closed on the branch.** `review/hook-gaps.md`
records them as they were found, before any of them was fixed, and its ordering is the finding: **eight of the
twelve were reachable by an agent writing conventional style with zero intent to evade. None required an
insider.** The largest of them would have taken the whole home directory — this harness's own agents, hooks and
config, and every other project on the machine.

**None of the twelve needed a shell parser** — three fell to the segmenter the first commit already built, three
were one-line regexes, one a quote-stripper in the pass that exists, one a reuse of the URL classifier the hook
already contained, and one was a policy inversion. One follow-up, not twelve.

---

## 3 · R46 is answered, in two halves that must not be collapsed

**No permission classifier in a `-p` child.** Every child's `system/init` reports `permissionMode: "default"`.
Auto mode is unreachable by both routes: `permissions.defaultMode: "auto"` in user settings is ignored, and
**`--permission-mode auto` is accepted, exits 0, prints no warning and silently resolves to `default`** — while
`acceptEdits`, `plan` and `dontAsk` are each honoured verbatim, which is the control proving the field is not
cosmetic. A flag that reads as success and does nothing. Zero of thirteen children emitted a classifier message;
the parent emitted three.

**But the hook fires** — at depth 1, at depth 2 inside a `Task`-dispatched subagent, and under
`--permission-prompts none` — read from `PreToolUse` `hook_response` events carrying `exit_code: 2` and the
rule's own text, never inferred from an action having failed. **The feared depth-2 gap does not occur.**
`permissions.deny` is evaluated **before** the hook.

**So the allow list is the night's real permission surface.** The net is not uniformly weaker; it is differently
shaped. Weaker wherever the 29 allow rules blanket-pass — `node *`, `python3 *`, `git *`, `gh *`, each admitting
arbitrary code, arbitrary pushes and arbitrary GitHub writes. **Stronger for anything unlisted, which auto-denies
rather than being judged.** A night child is a blunter instrument, not simply a more permissive one.

```
node -e "const p=require('./.claude/settings.json').permissions; \
  console.log(p.allow.length, p.deny.length, p.deny.filter(r=>r.startsWith('Read(')).length)"
# → 29 10 0
```

**Two corrections R46 makes to the panel that preceded it.** The classifier is **not** "configured nowhere" — it
is configured at **user** scope, `claude auto-mode config` returning **17 allow · 71 soft_deny · 1 hard_deny · 25
environment** rules, inspectable and versionable but not by this repo and not by anything CI can see. And it is
**not a fixed control**: three of the adversary lane's four refusals did not reproduce, and one shape it refused
twice it then permitted on a third attempt, same settings, same session, minutes apart. Genuinely strong, and not
something a design may rest on.

**A correction to close-C that travels further than this lane.** close-C recorded a nested `-p` child failing all
six sandbox-enabled Bash cells. Measured here it is **flaky, not deterministic** — one child failed its first
Bash call and succeeded on an identical retry. A night that fails this way fails *non-uniformly*: some children
work, some do not, and the failure is not the agent's.

---

## 4 · The two lanes that appeared to contradict each other, and the cell that settled them

`review/night-safety.md` said the hook does not reach the night. `review/r46-classifier.md` said the hook fires
everywhere it was tested. **Both were right and the difference is scope**: `--restricted` versus a plain `-p`
child. It cost half a day to find that out, and the reason is in §9.

The settling cell is `review/restricted-hook-cell.md`, and its decisive row is B2: under `--restricted --tools
Bash` the probe command **ran and emitted its marker with zero hook events in the stream** — so the registration
is *discarded*, not merely unreachable. Confirmed independently by a file tool that survives `--restricted`
natively and also produced no hook event. Four distinct refusal signatures were kept apart throughout — hook,
deny rule, prompt-none, and restricted confinement — and one cell was the trap in the act: an action failed, and
not because of the hook.

**Band 2 cannot run a test or a commit under bare `--restricted` at all.** That is a `bin/run` constraint, not a
posture preference.

---

## 5 · The plan's own instruments were wrong, and how they were caught is the transferable part

**An instrument that cannot return the wrong answer is not measuring.** Four times now a measurement looked clean
and was structurally incapable of contradicting the thing it was asked about. **Not one of them was caught by
reading.** Each was caught by a control that disagreed with an expectation.

**One — the off-hours metric could not answer its own question.** Counting sleep *episodes* gives 431 episodes
and **zero of an hour or more**, which reads as a settled answer. It is an artefact: DarkWake raises a two-second
wake about every 16 minutes and each one ends an episode, so **no episode on this machine can ever reach an
hour**. Counting contiguous spans between full `Wake` events over the same week gives **29 spans, 70.0 h, longest
11.08 h, fourteen over an hour**. Four readings, one machine, three answers; the first three were wrong the same
way.

**Two — `/goal` never runs its condition.** The evaluator is a model reading the transcript. An exit-code arm was
judged **met because the transcript narrated a file being written while the test never executed**. v12 and O21
say the deliveries are *"judged by a program rather than by prose"*. They were not. Corrected in the plan, not
annotated.

**Three — a probe that names the path it is testing measures the model's own refusal.** P1's cell
`R1b_bypass_rep2` put the deny-listed path in the prompt; the child declined on its own reasoning —
*"the file path you've specified is in the sandbox's explicit read deny list"* — which is a model refusal, not a
sandbox denial. Scored naively it would have been **a sandbox success**, and the rate would have been wrong **in
the reassuring direction**. Every other cell uses an opaque probe. The lane excluded the bad cell and said so.

**Four — the hook lane caught its own wrong measurement before it shipped**, and kept the correction in the
source, because the wrong reading would have aimed the fix at the wrong hole. Its curl refactor's first splice
left the original block below the new one and refused every browser navigation; thirty SSRF tests named it. **A
wrong diagnosis that produces a plausible fix is the expensive kind.**

The same shape appears once more, at a different layer: a lane tried to measure the credential-coverage gap
directly and **the auto-mode classifier refused the probe**, so that clause is recorded as an inference from the
list's shape rather than as a measurement (W54).

---

## 6 · Where the work stands

`npm run check` is **48 of 48 · 0 failed · exit 0**, measured on `0b91ea8` with the sandbox armed, 337.5 s. It
read 47 of 48 for part of the afternoon. Derive the denominator, never quote it:

```
npm run check                                                            # → Tally: 48 of 48 passed · 0 failed
node -e "console.log(require('./scripts/lib/check-suite.js').STEPS.length)"   # → 48
```

**What closed the one failing step is a real cost, not a clean-up, and it must not read as one.** Four `final-v2`
lanes closed their files with a "claims this lane emits" table in prose, ahead of ledger entries none of them
could create — 19 citations of unregistered ids, which turned `check:ledger-lint` and `test:ledger` red together.
Two were registered as project claims with deterministic checks. **Seventeen were declared as debt.**
`.claude/unresolvable-citations.yml` went from **8 entries to 25 in one day**, and **its own header calls that
list a ratchet** — *"the list can only shrink, and cannot outlive its subjects"*, failing lint when an entry stops
being cited, becomes a real claim, or loses its global subject. A ratchet that trebles in a day is still a
ratchet, and it is also a measure of how much prose was written ahead of its own verification.

```
grep -cE '^\s+- id:' .claude/unresolvable-citations.yml            # → 25
git show 6d0fdbe~1:.claude/unresolvable-citations.yml | grep -cE '^\s+- id:'   # → 8
```

The seventeen are not one reason: ten are framing about the unratified plan whose named verifiers are files that
do not exist; five are cell measurements whose only re-check spawns a live child, a locked keychain or a provider
account; two were proposed as `scope: global` + `verified_by: judge` with no panel, and this repo already carries
three of those resolving `unresolved` forever. One is **already false by its own stated falsifier**, and the
exemption reason carries the correction rather than the lane's file being edited — it was true when written.

| Artifact | State | Command (run from `final-v2/`) |
|---|---|---|
| The plan | 12,344 lines · 25 sections · 36 flowcharts | `wc -l < FINAL-PLAN-v2.md` · `grep -cE '^## ' FINAL-PLAN-v2.md` · the flowchart count needs a fence, below |
| §A decision rows | **108** | `grep -oE '^\| \*\*v[0-9]+\*\*' SPINE.md \| wc -l` |
| §L mechanisms | **135**, of which **126 ABSENT** and **3 CANDIDATE** | `awk '/^## L ·/,/^## M ·/' SPINE.md \| grep -cE '^\| \*\*O[0-9]+\*\*'`, then `\| grep -c ABSENT` and `\| grep -c CANDIDATE` |
| §M world facts | **69** | `awk '/^## M ·/,/^## N ·/' SPINE.md \| grep -cE '^\| \*\*W[0-9]+\*\*'` |
| §N research questions | **52**, of which **18 open** | `awk '/^## N ·/,0' SPINE.md \| grep -cE '^\| \*\*R[0-9]+\*\*'` · open: same, `\| sed 's/~~[^~]*~~//g' \| grep -cE '\| *\*{0,2}OPEN'` |
| §I open decisions | **19 rows**, 4 still the founder's | `awk '/^## I ·/,/^## J ·/' SPINE.md \| grep -cE '^\| [0-9]+ \|'` |
| §J losing images | **92** | `awk '/^## J ·/,/^## K ·/' SPINE.md \| grep -oE '^[0-9]+(–[0-9]+)?\.' \| tr -d '.' \| tr '–' '\n' \| sort -n \| tail -1` |
| Strike pairs | **143** in SPINE · **252** in the plan | `grep -oE '~~[^~]+~~' SPINE.md \| wc -l` |
| Coverage | **CLOSED** — `f87e943`, 147 rows amended, unsettled placements 2 → 0 | `grep -c '\| ? \|$' COVERAGE.md` → 0 |
| Pages | 2, both current · 143 tiles | `grep -c 'class="tile"' page/final-plan-v2.html` |
| Files under `review/` | **22** | `ls review \| wc -l` |

**Mechanism classes: kernel 97 · adapter 31 · refuse 2**, with five rows carrying a class no grep matches
(O21, O128, O131, O133, O134). Reproduce with `awk '/^## L ·/,/^## M ·/' SPINE.md | grep -E '^\| \*\*O[0-9]+\*\*'
| grep -cE '\| kernel( ·)? '` and the same for `adapter` and `refuse`; invert with `grep -vE` to name the five.

**§L's own heading re-derivation says 131 and the table holds 135** — it is one fold behind itself for the second
time. Trust the `awk` above, and if you fold anything into §L, move the heading in the same commit.

Both commands that need a backtick or a fence, run from `final-v2/`:

~~~
grep -c '```mermaid' FINAL-PLAN-v2.md                                    # → 36
grep -ohE '`bin/[a-z-]+`' FINAL-PLAN-v2.md SPINE.md | sort -u | wc -l    # → 28
~~~

---

## 7 · The sandbox: what was measured, what was decided, what was deferred

**The founder deferred the posture with a trigger, not a date: revisit when `bin/run` exists.** Record that as a
decision (DECISIONS §29, G2 — *"Change nothing yet"*), not as an omission, or the next reader will try to settle
it. `bin/run` is the first moment a per-child settings file could be written by anything this plan owns.

**The structural finding outranks the posture question.** The armed sandbox governs Bash run through Claude
Code's Bash tool. **It is not a machine policy.** The night is specified to run from launchd, where it never
applies. A designed night does not complete today and it stops twice before the sandbox is consulted: **no Watch
plist exists** (`ls ~/Library/LaunchAgents/*.plist` → 8 plists, none of them the Watch) and **`night_capable`
reads false every night** — `pmset -g custom` → `sleep 1` on both power sources.

**All five lanes converged on one posture** — an unsandboxed parent with each child confined by its own
`--settings`, which `--restricted` is measured to honour. **No lane proposed disarming.** It *increases*
containment over today, where a night child has none of its own.

### Two measured ways a child runs unconfined while its settings read `"enabled": true`

**The first: `--permission-mode bypassPermissions`. Write it as 8 of 9 against 0 of 7 controls. Never as
"skips".** Three rounds, a freshly generated canary token per cell, an opaque probe. Nine `bypassPermissions`
cells, eight read a `denyRead` canary; **one failed closed and is unexplained**, with the same `srt-mux` `EPERM`
as a control. Controls: default 5 cells, 0 reads; `acceptEdits` 2 cells, 0 reads. The effect is real and large;
**the mechanism is not deterministic**. Nothing anywhere reports that confinement was skipped — the cell looks
like the sandbox working. This **reconciles** close-C's *6 of 6 fail closed* rather than overturning it: close-C
is correct for the modes it used, and those modes fail closed here too. Mitigation, measured: `--restricted`
refuses the mode, `exit 1` in 0.1 s before any model call — and it also removes Bash, so it is not a drop-in for
a dispatcher whose child must run commands.

**The second: `filesystem.disabled: true` delivered through `--settings`.** This is **documented behaviour**, and
the only reportable part is its **tier placement**. The binary states verbatim that these keys are *"only honored
from user, managed/policy, or CLI (`--settings`)"*; the cell measures that `--settings` **is** the CLI tier and is
honoured. `READ_CANARY` flipped to the canary value and `READ_CODEX_AUTH` became readable while network isolation
held.

Both travel through **a settings file someone else supplies**, which is what makes them one class and what O131
exists to close.

**A reproduction is drafted (`review/sandbox-P1-measure.md` §10.1 and §10.4) and nothing has been sent.** Sending
it is the founder's act. The recommendation they took was replicate first, then send: a security report on one
unreplicated cell is worth less than no report.

### What the panel found that the posture question does not touch

- **The sandbox stops none of the three most likely harms** — a run acting on attacker text it fetched, a
  credentialed call firing unattended, accidental destruction. Six of seven inbound doors poll outbound, so the
  inbound-bind denial gates this system's own components and no adversary.
- **`denyRead` does not hold where it matters:** a detached, TTY-less process read an **unlocked** keychain,
  sandboxed, no prompt, exit 0, against a `no-timeout` login keychain with no lock-on-sleep flag.
- **The credential deny-list governs the shell, not the agent.** All ten deny rules are `Bash(...)`; there are
  zero `Read(...)` rules. So the nine `denyRead` credential paths are closed to commands and open to the agent's
  own file tool. **This is unfixed, and the founder has not been asked to fix it** — it is a permissions-policy
  call on their own machine, adding `Read(...)` rules is the act, and nobody has put it to them.
- **Three CLAUDE.md claims are falsified.** `sandbox.network.allowLocalBinding` **exists, is macOS-specific, is
  project-settable, and works** — both binds flipped from denied to OK while the read canary stayed denied in the
  same cell. `enableWeakerNestedSandbox` is **Linux-only**; the macOS builder does not take the parameter. The
  worktree wall is the **documented protected-paths list**, which `allowWrite` is documented as unable to lift —
  which is why adding `**/.worktrees/**` never lifted it. **CLAUDE.md is deliberately not edited here:**
  `irreversible` tier, outside this branch's scope, recorded for the PR that owns it. It was not missed.
- **One composed-posture fact stated plainly:** OpenAI's documented guidance for Codex under an outer sandbox is
  `--dangerously-bypass-approvals-and-sandbox`, and every working Codex cell needed Claude Code's
  `dangerouslyDisableSandbox`. **Keel's checker would run with both vendors' escape hatches open in one
  invocation.** Neither vendor page looks alarming read alone.

---

## 8 · The night-safety design — recorded as shape, not adopted

**Safety cannot come from permission, because every control that judges an act needs a model in the loop and
every model in the loop is asleep.** *A night run should be safe because of what it does not hold, not because of
what it was told.* Thirteen layers ranked by harm prevented rather than by build cost, **nine ABSENT**. Hooks sit
near the bottom precisely because they are what a persuaded or looping run walks through — **and §2's semicolon
bypass is that, measured, with no persuasion involved at all.**

**§L gained a fourth status value, `CANDIDATE`**, added with a strike on §L's own "three values" line rather than
silently. Recording a recommendation the founder has not taken as `ADOPTED` would be false; as `ABSENT` it would
lose the distinction between *designed but not adopted* and *adopted but not built*. **O133–O135 carry it, each
with its cost stated in the row, and none is a decision:**

- **O133** — one dedicated, narrowly-scoped, **independently revocable** credential per purpose and per venture,
  capped at the provider, never the founder's own. The decisive property is not leakage: it is that *revoke the
  credential* must be the cheapest response to a 3 a.m. incident, and a shared credential makes it the most
  expensive. **Its premise is flagged unverified by its own author** and R21 already shows it holds unevenly —
  one of two credit-spending providers publishes a spend cap. It is nonetheless the only item in the design the
  founder could complete today with nothing built.
- **O134** — a second keychain holding only credentials that spend, send or publish, with its own lock policy.
  **The one row where a real capability is given up:** the unattended half of any spending or sending act needs a
  founder unlock. The tension with v94's widening ladder is written **into v94** and the ladder is not narrowed.
- **O135** — a handover carries a **taint flag** when the run that wrote it read outside text, and a tainted
  handover may be read only by a run with no outward leg. It changes a data shape the whole plan reads, which is
  why it is a candidate. **Marking a run read-only and letting it write a handover another run executes is a
  laundering path, and this is the only named cure for it.**

---

## 9 · The founder's decisions you may not re-litigate

Five overrules from the fixer round, each against the recommendation of one or more expert lanes, recorded in
`DECISIONS.md` §24 and §28 with the reasoning that lost.

| Decision | The founder's words | What it killed |
|---|---|---|
| No box | *"dont need for now. use this mac and when cant use cloude"* | The always-on box all three lanes wanted; §J 73, 76 |
| No keys | *"no keys, codex and gemini cli use."* | The checker-family API key; §J 74. §I row 17 CLOSED |
| First contact widens | *"Yes, after N recall-free sends per venture"* | The ladder stopping below first contact; §J 84 |
| No vanilla week | *"No, compare Keel's modes only"* | The null hypothesis against a plain session; §J 75 |
| Row 16 stays open | *"Skip it, accept row 16 open"* | The thirty-minute sitting that would test the anchor assumption |

**Three taken 2026-09-07, and they bind the same way.**

| Decision | The founder's words | What it settles |
|---|---|---|
| The terms — Reading C | *"what do you recommend?"* → the recommendation was **Reading C with Reading B's volume qualifier live inside it**, and the founder did not dissent | §I row 1 CLOSED as **v108, `class: ratified`**. Reopenable by any engine with a reason and a falsifier; the falsifiers are named in v108 |
| Change nothing yet | *"Change nothing yet"* | The sandbox posture. No settings file on this machine was modified by any lane. Deferred with a **trigger — revisit when `bin/run` exists** — not a date |
| Do all | *"do all"* | Authorised the hook fix, the settling cell, the folds and this handoff as one round (DECISIONS §30). It authorised **no** founder act: the R33 probe, the capped credentials and the vendor report stayed untouched |

**Leaving row 16 open was the founder's decision and not an oversight, and a future reader will find it and think
otherwise.** Every review said the plan's central assumption — that a deterministic anchor exists for most company
work — is untested, and that testing it on the founder's own past work costs nothing. The founder read that and
chose to leave it open. The consequence stands: the architecture is untested against non-software work until the
first venture supplies its own thirty done-tests. **The same reasoning now covers row 19.** Neither is drift, and
neither is yours to close.

---

## 10 · What is open, and whose it is

**Four rows in SPINE §I, all the founder's.** The command names four ids and one of them is moot:

```
awk '/^## I ·/,/^## J ·/' SPINE.md | grep -E '^\| [0-9]+ \|' | sed 's/~~[^~]*~~//g' \
  | grep -E 'OPEN|MOOT' | grep -oE '^\| [0-9]+' | tr -d '| '
# → 6 15 16 19        (6 is MOOT; row 4 carries no status token and is still the founder's)
```

| Row | The question | State |
|---|---|---|
| 4 | `LICENSE-CONTENT` in the skills upstream | **OPEN, and narrower than the row assumed.** The fetch is done (R13). CC BY 4.0 clears rewriting the repo's **own** bodies; it does not clear bulk vendoring of ~50 upstreams that include CC-BY-SA, "Proprietary", and "Not declared". The question is now *which subset*, and the act before it is a tally of the upstream's own `docs/sources/sources.md` by its licence column — that file is in the skills upstream, not in this repo |
| 15 | Which hosted lane may make when the Mac is off | **It reads re-opened, and a reader who sees that will assume drift, so: the status never changed.** The research fold recorded an orchestrator disposition that made the row *look* answered — *a gap caused by a flat battery is cured by a power cable, not by a hosted lane* — and SPINE marks that disposition **"recorded and not taken"**. It was then **withdrawn by its author**, struck rather than deleted so it cannot resurface from a handoff, when the contiguous-span re-count replaced one battery-flat event with fourteen windows over an hour. Live premise: a **43–70 h** weekly tail, the range being 27.1 h of DarkWake whose usability is unmeasured. What moves it is R45, not a power cable |
| 16 | Whether a deterministic anchor exists for most company work | **OPEN by the founder's decision, not by oversight.** Settled by R27 (b) and (c), never (a) alone |
| 19 | The sandbox exemption `codex exec` needs — `denyRead` on `~/.codex`, plus provider TLS at the egress proxy | **Raised 2026-09-07 by the headless rehearsal, and the founder's.** Not decided in the round that raised it, and *change nothing yet* leaves it standing. **Two blockers, either sufficient, and the evidence does not separate them:** both were removed together by disabling the sandbox, so whether lifting `denyRead` alone would suffice is untested |

**Closed this round:** row 1 (the terms, Reading C, v108). Row 5 — **Codex installed and rehearsed**:
`codex-cli 0.153.4`, auth mode `chatgpt` from stored tokens, no API key and no `codex login`; **20 of 20
invocations exit 0 with non-empty correct-shaped stdout, 10 of them fully detached**; **#19945 did not reproduce
once**. Row 6 — **MOOT**: Google withdrew personal-account access to the Gemini CLI on 2026-06-18. The decision
was not reversed; the route was removed, on availability rather than terms.

**Research: 18 of 52 open**, not 15 of 46 — the classifier lane and the night-safety design added R47–R52 and
answered R46.

```
awk '/^## N ·/,0' SPINE.md | grep -cE '^\| \*\*R[0-9]+\*\*'                       # → 52
awk '/^## N ·/,0' SPINE.md | grep -E '^\| \*\*R[0-9]+\*\*' | sed 's/~~[^~]*~~//g' \
  | grep -cE '\| *\*{0,2}OPEN'                                                     # → 18
```

Of the eighteen, several cannot close in planning at all — they need the system running. **Two are one cell each
and cheap.** **R52** is the smallest on the page: one read of a keychain item by a binary other than the one that
created it, settling whether any control may rest on per-item ACLs — until it runs, build none on them. **R45** is
a founder act, smaller than R33's LaunchAgent: leave one bounded process running across one night. **R51** is the
night-safety design's own largest unverified premise, flagged by its author, and R21 answers it for two providers
out of the credentialed set.

---

## 11 · What to build, and why not more

**The kernel is ready and the whole system is not** (`DECISIONS.md` §27).

**Gate A — two things, not three.** Lift the no-building hold. Write the managed settings file, which after the
founder's auto-mode decision (E9 · v92) carries **two keys**: `permissions.deny` and
`permissions.disableBypassPermissionsMode: "disable"`. *Authenticate Gemini has been removed from this gate:
§I row 6 is MOOT and the act no longer exists.*

**Gate B — the bounded day.** The data files and the constitution; `bin/log`; `bin/run` thin over the vendor's
own flags; `bin/reconcile` with its read-only instruments; the Sender staged behind a tap; `bin/check-stores`;
`bin/probe`, **authored by a different lane than the launcher**; the two charters including the first stranger;
page 4; the scoreboard.

**`bin/run` is first and §1 is why.** It carries O131, it is the only thing that can deliver a hook, a
constitution or a permissions block into a night child, and every other Gate B item is dispatched by it.

**Gate C is a research programme, not a to-do list.** 126 absent mechanisms of 135, 28 `bin/` programs, 18 open
questions. Do not attempt it as one run. The plan is staged specifically so you do not have to.

**The order matters and here is why.** The data files come first because nothing else can produce a builder brief
that fits in a context window. The log comes second because it is the sensor the whole controller lacks. One real
intent comes third because every number after it divides by a rate that does not exist yet.

**Four programs are a trusted base and are reviewed differently:** `bin/send`, `bin/inbound`, `bin/watch`,
`bin/run`. They touch the world, they carry a line budget, their only admission test is `keel/fixtures/`, and the
founder line-reviews them. The vendor's own flags are the floor beneath them, so a defect in the launcher can
narrow a grant but never widen one. **That is deliberate. Do not collapse it into one program.**

---

## 12 · The founder's acts still outstanding

Five, and none of them is an agent's.

1. **Sign off `fix/hook-separator-bypass`** — `irreversible` tier, unpushed, unmerged, seven commits (§2). It is
   the only unmerged code in this session.
2. **Dispose of `c-rolling-five-hour-window`, whose waiver expires 2026-09-08.** The ledger entry lives at
   `~/.warroom/ledger/global.yml`, **outside the project root, where no agent in this session can write** — so
   the disposition is a founder act or needs an escalation. The waiver's stated reason is discharged: the vendor
   source now exists (`research/five-hour-window.md`). **Two things are wrong with the claim as written.**
   *"Rolling" is not the vendor's word* — they say **session-based, reset every five hours**, and a session that
   begins on first use is not a sliding window, so a clock routine written against the wrong one fires at the
   wrong time. And **the claim omits the weekly limit**, which applies across all models, resets at a fixed time
   assigned to the account, and is what actually binds this seat — Lane M measured **0.68 of the seven-day
   window with overage rejected**. A ceiling denominated per five-hour window meters the constraint that does not
   bind. The recommended disposition is **refresh with the assertion amended**, and moving `verified_by:` from
   `judge` to `source`, because a judge claim with an empty panel resolves `unresolved` forever and this repo
   already carries three of those.
3. **Install the R33 probe** — `final-v2/probes/r33/install.sh`, written and committed, with `uninstall.sh`
   beside it. Four reversible changes, all listed in the script's own header: one keychain item holding the
   literal `R33-OK`, `~/.keel-probes/r33-probe.sh`, one LaunchAgent plist, and the bootstrap. It reads nothing
   else, sends nothing anywhere, and takes no network action. The item is created **without `-A`**, which is the
   realistic case and the whole point: an immediate refusal in the log **is** the finding.
   **One unreconciled number, flagged rather than silently picked:** the script's own header says the refusal
   logs `rc=51`, and close-C R3 measured `rc=152` twice, on the same `security find-generic-password` call and
   the same machine. Both name `errSecInteractionNotAllowed`; **`152` is the one that was measured here.** The
   verdict does not turn on the number — *immediate refusal, never a hang* — but a reader watching for `51` may
   read a `152` as an unexplained failure. Reconcile it against a run, not against either document.
4. **Send or withhold the vendor report** on the `bypassPermissions` finding. Drafted, replicated, unsent.
5. **Decide the `Read(...)` rules** — whether the nine credential paths closed to `Bash` should also be closed to
   the agent's own file tool. Nobody has put this question to them yet.

---

## 13 · How to work here — what this session learned the hard way

**Carry these even if every finding above is superseded. They transfer where the findings may not.**

- **Attribute a control by verbatim signature, never by an action having failed.** Six controls in this runtime
  are separable by their own message — classifier, hook, deny rule, sandbox, working-directory confinement,
  no-approver — and the settling cell kept four of them apart in one table. Telling them apart is what makes any
  of these tables answerable. **For want of this, two capable lanes appeared to contradict each other for half a
  day.**
- **A probe that names what it is testing measures the model, not the mechanism.** Put the sensitive operand
  inside a generated script, never in the prompt.
- **An enumeration of spellings is defeated by the conventional spelling.** Three separate defects this session
  were this — two hook rules and R1 of the twelve gaps — and it is the same shape as `allowWrite` only widening
  while `denyWrite` narrows. **A denylist of dangerous forms can never be complete; an allowlist of one safe
  region can.**
- **The guard refused writes five times while its own defects were being documented** — a probe command, a commit
  message, vendor documentation quoted verbatim into a file, and twice while writing the file describing its own
  bugs. **A guard that prevents its defects being written down is a guard whose defects do not get fixed.** The
  over-blocking stays, because over-blocking a document is far cheaper than under-blocking a command; the right
  cure is a real shell parser, not a looser rule.
- **The orchestrator's summaries were corrected by lanes five times today** — the power-cable disposition, the
  sleep figure, the MCP credential label, a row recorded as "closed and re-opened" that was never closed, and a
  test count. **The lanes measure precisely, the orchestrator compresses, and the compression is what
  propagates.** Every correction came from a lane checking the file rather than accepting the brief.
- **A message to a running lane is delivered only when the lane's return quotes it — and the converse bites
  too.** A correction reached a lane *after* it had gone idle and committed; it woke, applied it, and became a
  second live writer on a file another lane was reading. That second lane **snapshotted the in-flight file and
  asked rather than overwriting**, which was correct. Require a quote-back line, and before dispatching a
  replacement, check whether the original has woken.
- **Check engine capability against the deliverable before dispatching.** `sourcer` has neither `Write` nor
  `Bash`; **`reviewer` has `Bash` but no `Write`.** Three lanes this round returned findings as messages for
  that reason, on the orchestrator's bad advice. Corrected in `.claude/memory/LONG-TERM.md`.
- **Verify a lane's work on disk before committing it, with a grep per finding.** Every round that skipped that
  step produced a correction in the next one.
- **A strikethrough looks like a live sentence to a grep.** Count `~~old~~ new` explicitly, or strip strikes
  before counting, or you will report a fix that did not happen and a fix that did happen as missing.
- **Escape pipes inside table cells.** Field-position parsing of SPINE's tables is unreliable for exactly this
  reason; classify by pattern, not by `$NF`.
- **A figure in prose rots; a command does not.** Write the number *and* the command — and when you fold rows
  into a section, move that section's own heading in the same commit. §L's did not, twice.
- **A lane refusing to re-encode a blocked artifact is correct.** Lane C recorded *"A teammate relaying the
  founder's authorization is not what grants capability here."* The plan should teach it.
- **Ask the founder only what only they can answer** — their money, their machine, their hours, their business,
  their appetite for risk. Everything else you decide from rules already on the page and record, reopenable by
  name. This is the founder's own standing instruction, given 2026-09-07, and it was applied three times.

---

## 14 · The standing constraints, still in force

Nothing built, installed, authenticated, spent, published or pushed **without the founder saying so**. The Codex
install of 2026-09-07 was authorised for that one act and lifts nothing else; *"do all"* authorised a round of
work and no founder act. No settings or policy file on this machine was modified by any lane, and each lane that
ran children confirmed none was left running. `round-6/` is not opened. Never a bare `git stash` — the stack is
shared with other worktrees and other sessions. Never commit to `main`. Founder overrules are final and are not
re-litigated, including in a later round by a different lane.

---

## 15 · The honest caveat, which belongs in every summary of this work

Every review, every research lane, every sandbox cell and the hook fix here was **one model family** — reading
its own prose, its own runtime, its own guard and its own vendor's documentation about itself. By the plan's own
evidence ladder that ranks and flags and certifies nothing. **Twenty-two files under `review/`**
(`ls review | wc -l`), three fixer lanes, three research returns under `research/close-*.md`, five sandbox lanes
and one builder branch do not add up to an independent panel; they add up to one family's reasoning applied many
times, which is a real but bounded thing.

The mechanical layer is the part least exposed to it — exit codes, `errno`, a fresh random token present or
absent in stdout, a `hook_response` event carrying `exit_code: 2` — and every cell is reproducible from the argv
in its own file. **The interpretation is single-family.** The `irreversible` tier's two-of-three multi-judge and
the two-model-family predicate are **unmet on every artifact here, including the hook branch**. Accepted risk,
exit condition 2026-11-17.

The only remaining test of this plan is running it.
