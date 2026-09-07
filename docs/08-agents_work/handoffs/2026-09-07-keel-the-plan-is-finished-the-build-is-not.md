# Handoff — Keel: the plan is finished, the build is not, and the plan's own instruments were wrong three times

**From:** ceo (`ceo-1-1788609834`) · **Date:** 2026-09-07 · **Base:** local `main` = `b2cabad`, 150 commits on
top (`git rev-list --count main..HEAD`) · **Landing branch:** `docs/final-v2`, composed onto
`origin/docs/final-plan` (PR #131 head `7fe8ede` — the commit resolves locally; **the PR's own state is not
readable from here**, `~/.config/gh` is on `denyRead`) · **Pushed:** nothing. **Built:** nothing. **Spent:**
nothing.

> **This document replaces the version written earlier on 2026-09-07.** That version was written before three
> research lanes and a five-lane sandbox panel returned. **Six of its statements are false and are named where
> they stood:** *Coverage — STALE*; *Research: 39 of 41 open*; *one documentation gap*; its §I table (rows 1,
> 5, 6, 15); the spine's figures; and *30 programs, 104 store paths, 15 agent files*, which no file supports.
> Every number below carries the command that reproduces it, because four figures in this document's lineage
> have rotted inside a week.

---

## 0 · Read this first, in this order

1. `docs/03-system-design/final-v2/FINAL-PLAN-v2.md` — the plan. Assembled from `parts/`; **never edit it,
   edit a part and reassemble.**
2. `docs/03-system-design/final-v2/SPINE.md` — what binds. **The spine wins over the plan wherever they
   disagree.**
3. `docs/03-system-design/final-v2/DECISIONS.md` — the decision log. §29 is the newest, and read the
   correction struck into its own head: an orchestrator's summary compressed two accurate facts from a lane
   into one inaccurate sentence, and the file corrects itself in place.
4. `final-v2/research/close-W.md` · `close-M.md` · `close-C.md` — the research close, verbatim.
5. `final-v2/review/terms-row-1.md` · `review/codex-rehearsal.md` — the two rows that closed.
6. `final-v2/review/sandbox-P1-measure.md` through `sandbox-P5-envelope.md` — the sandbox panel, five sealed
   lanes. P1 is the only one with a shell; read its §9 and §10 before quoting its §0.
7. `docs/08-agents_work/sessions/2026-09-07-ceo-research-close-and-sandbox-panel.md`.
8. `final-v2/page/final-plan-v2.html` — the plan for a phone. `page/three-lenses-on-keel.html` — the
   criticism, presented.

Do **not** open `docs/03-system-design/round-6/`. The founder has refused it three times. It is not a
judgement about its contents; it is a decision about scope, and re-opening it re-opens a settled argument.

---

## 1 · Where the work stands

The plan is finished as a plan, the coverage gap is closed, and the gaps that remain are larger than the one
this document used to name.

| Artifact | State | Command |
|---|---|---|
| The plan | 12,344 lines · 25 sections · 36 flowcharts | `wc -l < FINAL-PLAN-v2.md` · `grep -cE '^## ' FINAL-PLAN-v2.md` · the flowchart count is in the block below, because it contains a fence |
| §A decision rows | **108** | `grep -oE '^\| \*\*v[0-9]+\*\*' SPINE.md \| wc -l` |
| §L mechanisms | **131**, of which **122 ABSENT** | `awk '/^## L ·/,/^## M ·/' SPINE.md \| grep -cE '^\| \*\*O[0-9]+\*\*'` then `\| grep -c ABSENT` |
| §M world facts | **58** | `awk '/^## M ·/,/^## N ·/' SPINE.md \| grep -cE '^\| \*\*W[0-9]+\*\*'` |
| §N research questions | **46**, of which **15 open** | `awk '/^## N ·/,0' SPINE.md \| grep -cE '^\| \*\*R[0-9]+\*\*'` · open: same, `\| sed 's/~~[^~]*~~//g' \| grep -cE '\| *\*{0,2}OPEN'` |
| §I open decisions | **19 rows**, 4 still the founder's | `awk '/^## I ·/,/^## J ·/' SPINE.md \| grep -cE '^\| [0-9]+ \|'` |
| §J losing images | **92** | `awk '/^## J ·/,/^## K ·/' SPINE.md \| grep -oE '^[0-9]+(–[0-9]+)?\.' \| tr -d '.' \| tr '–' '\n' \| sort -n \| tail -1` |
| Strike pairs | **125** in SPINE · **252** in the plan | `grep -oE '~~[^~]+~~' SPINE.md \| wc -l` |
| Coverage | **CLOSED** — `f87e943`, 147 rows amended, unsettled placements 2 → 0 | `grep -c '\| ? \|$' COVERAGE.md` → 0 |
| Pages | 2, both current · 143 tiles | `grep -c 'class="tile"' page/final-plan-v2.html` |

**Mechanism classes: kernel 95 · adapter 31 · refuse 2**, with three rows carrying a class no grep matches
(O21, O128, O131). Reproduce with `awk '/^## L ·/,/^## M ·/' SPINE.md | grep -E '^\| \*\*O[0-9]+\*\*' |
grep -cE '\| kernel( ·)? '` and the same for `adapter` and `refuse`; invert with `grep -vE` to name the three.

**One figure the previous version asserted has no source anywhere and is dropped:** *30 programs, 104 store
paths, 15 agent files*. A grep of the plan and the spine finds none of the three. What is derivable is
**28 `bin/` programs**. Both commands that need a backtick or a fence, run from `final-v2/`:

~~~
grep -c '```mermaid' FINAL-PLAN-v2.md                                    # → 36
grep -ohE '`bin/[a-z-]+`' FINAL-PLAN-v2.md SPINE.md | sort -u | wc -l    # → 28
~~~

---

## 2 · The plan's own instruments were wrong three times, and how they were caught is the transferable part

**An instrument that cannot return the wrong answer is not measuring.** Three times in one round a measurement
looked clean and was structurally incapable of contradicting the thing it was asked about. None of the three
was caught by reading. Each was caught by a control cell that disagreed with an expectation.

**One — the off-hours metric could not answer its own question.** Counting sleep *episodes* gives 431 episodes
and **zero of an hour or more**, which reads as a settled answer. It is an artefact: DarkWake raises a
two-second wake about every 16 minutes and each one ends an episode, so **no episode on this machine can ever
reach an hour**. Counting contiguous spans between full `Wake` events over the same week gives **29 spans,
70.0 h, longest 11.08 h, fourteen over an hour**. Four readings, one machine, three answers; the first three
were wrong the same way.

**Two — `/goal` never runs its condition.** The evaluator is a model reading the transcript. An exit-code arm
was judged **met because the transcript narrated a file being written while the test never executed**. v12 and
O21 say the deliveries are *"judged by a program rather than by prose"*. They were not. Corrected in the plan,
not annotated.

**Three — a probe that names the path it is testing measures the model's own refusal.** P1's cell
`R1b_bypass_rep2` put the deny-listed path in the prompt; the child declined on its own reasoning —
*"the file path you've specified is in the sandbox's explicit read deny list"* — which is a model refusal, not
a sandbox denial. Scored naively it would have been **a sandbox success**, and the finding's rate would have
been wrong **in the reassuring direction**. Every other cell uses an opaque probe, where the path appears only
inside a generated script. The lane excluded the bad cell and said so rather than burying it.

The same shape appears once more, at a different layer: a lane tried to measure the credential-coverage gap
directly and **the auto-mode classifier refused the probe**, so that clause is recorded as an inference from
the list's shape rather than as a measurement (W54).

---

## 3 · What binds a night child is argv and nothing else — and it is the most important unbuilt thing in the plan

**A night child gets no constitution, no lenses and no playbooks.** This is a `bin/run` defect, not a posture
question, and **it survives any sandbox decision in either direction**.

The chain: every unattended child runs `--restricted` (§12.10 — find it by what it says, not by a line number:
`grep -n 'restricted --tools' parts/12-control.md`). `--restricted` discards the project settings file, which
is where the session-start hook is registered. `--settings <file>`
still applies under `--restricted` — measured, with a positive control (R28, close-C cells D and E) — but the
per-child replacement the plan specifies names **`PreModelSwitch`, `PreCompact`, `SessionEnd`** and omits
`SessionStart`. The constitution is sized to session-start's payload budget. So the delivery path exists and
nothing is loaded onto it.

A second measurement lands on the same seam: **`SessionStart` hooks fail in a nested child under the armed
sandbox** (`EPERM … mkdir '~/.claude/session-env/<sid>'`) while every other hook event runs (close-C).

The owning mechanism is **O131** — the dispatcher builds each child's settings from a fixed template it owns
and never accepts a settings file as a parameter. `bin/run` is **ABSENT**; `keel/` does not exist on this
branch. That absence is also the trigger in §4 below.

---

## 4 · The sandbox: what was measured, what was decided, what was deferred

**The founder deferred the posture with a trigger, not a date: revisit when `bin/run` exists.** Record that as
a decision (DECISIONS §29, G2 — *"Change nothing yet"*), not as an omission, or the next reader will try to
settle it. `bin/run` is the first moment a per-child settings file could be written by anything this plan owns.

**The structural finding outranks the posture question.** The armed sandbox governs Bash run through Claude
Code's Bash tool. **It is not a machine policy.** The night is specified to run from launchd, where it never
applies. A designed night does not complete today and it stops twice before the sandbox is consulted: **no
Watch plist exists** (`ls ~/Library/LaunchAgents/*.plist` → eight plists, none of them the Watch) and
**`night_capable` reads false every night** on `pmset -g custom` → `sleep 1` on both power sources.

**All five lanes converged on one posture** — an unsandboxed parent with each child confined by its own
`--settings`, which `--restricted` is measured to honour. **No lane proposed disarming.** It *increases*
containment over today, where a night child has none of its own.

### Two measured ways a child runs unconfined while its settings read `"enabled": true`

**The first: `--permission-mode bypassPermissions`. Write it as 8 of 9 against 0 of 7 controls. Never as
"skips".** Three rounds, a freshly generated canary token per cell, and an opaque probe. Nine `bypassPermissions`
cells, eight read a `denyRead` canary; **one failed closed and is unexplained**, failing with the same `srt-mux`
`EPERM` as a control. Controls: default 5 cells, 0 reads; `acceptEdits` 2 cells, 0 reads. The effect is real and
large; **the mechanism is not deterministic**. Nothing anywhere reports that confinement was skipped — the cell
looks like the sandbox working. This **reconciles** close-C's *6 of 6 fail closed* rather than overturning it:
close-C is correct for the modes it used, and those modes fail closed here too. Mitigation, measured:
`--restricted` refuses the mode, `exit 1` in 0.1 s before any model call — and it also removes Bash, so it is
not a drop-in for a dispatcher whose child must run commands.

**The second: `filesystem.disabled: true` delivered through `--settings`.** This is **documented behaviour**,
and the only reportable part is its **tier placement**. The binary states verbatim that these keys are *"only
honored from user, managed/policy, or CLI (`--settings`)"*; the cell measures that `--settings` **is** the CLI
tier and is honoured. `READ_CANARY` flipped to the canary value and `READ_CODEX_AUTH` became readable while
network isolation held.

Both travel through **a settings file someone else supplies**, which is what makes them one class and what
O131 exists to close.

**A reproduction is drafted (`review/sandbox-P1-measure.md` §10.1 and §10.4) and nothing has been sent.**
Sending it is the founder's act. The recommendation they took was replicate first, then send: a security
report on one unreplicated cell is worth less than no report.

### What the panel found that the posture question does not touch

- **The strongest control in a session is the auto-mode permission classifier** — a model deciding per call,
  configured nowhere in this repository and modelled nowhere in the plan. Six adversarial probes, **four
  refused, none of the four by the sandbox**. It is an interactive control, so a `-p` child at 3 a.m. probably
  does not have it. **That last clause is an inference, not a measurement. R46 is the unrun cell.**
- **The sandbox stops none of the three most likely harms** — a run acting on attacker text it fetched, a
  credentialed call firing unattended, accidental destruction. Six of seven inbound doors poll outbound, so
  the inbound-bind denial gates this system's own components and no adversary.
- **`denyRead` does not hold where it matters:** a detached, TTY-less process read an **unlocked keychain,
  sandboxed, no prompt, exit 0**, against a `no-timeout` login keychain.

### The credential deny-list governs the shell, not the agent

**All ten deny rules are `Bash(...)`; there are zero `Read(...)` rules.** So the nine `denyRead` credential
paths are closed to commands and open to the agent's own file tool.

```
node -e "const d=require('./.claude/settings.json').permissions.deny; \
  console.log(d.length, d.filter(r=>r.startsWith('Bash(')).length, d.filter(r=>r.startsWith('Read(')).length)"
# → 10 10 0
node -e "console.log(require('./.claude/settings.json').sandbox.filesystem.denyRead.length)"   # → 9
```

**This is unfixed, and the founder has not been asked to fix it.** It is a permissions-policy call on their
own machine, so it is theirs; adding `Read(...)` rules is the act, and nobody has put it to them.

### Three CLAUDE.md claims are falsified, and CLAUDE.md is deliberately not edited

`sandbox.network.allowLocalBinding` **exists, is macOS-specific, is project-settable, and works** — both binds
flipped from denied to OK while the read canary stayed denied in the same cell. `enableWeakerNestedSandbox` is
**Linux-only**; the macOS builder does not take the parameter. The worktree wall is the **documented
protected-paths list**, which `allowWrite` is documented as unable to lift — which is why adding
`**/.worktrees/**` never lifted it.

**Not edited here on purpose:** CLAUDE.md is `irreversible` tier and outside this branch's scope. It is
recorded for the PR that owns it. It was not missed.

**One composed-posture fact stated plainly:** OpenAI's documented guidance for Codex under an outer sandbox is
`--dangerously-bypass-approvals-and-sandbox`, and every working Codex cell needed Claude Code's
`dangerouslyDisableSandbox`. **Keel's checker would run with both vendors' escape hatches open in one
invocation.** Neither vendor page looks alarming read alone.

---

## 5 · The founder's decisions you may not re-litigate

Five overrules from the fixer round, each against the recommendation of one or more expert lanes, recorded in
`DECISIONS.md` §24 and §28 with the reasoning that lost.

| Decision | The founder's words | What it killed |
|---|---|---|
| No box | *"dont need for now. use this mac and when cant use cloude"* | The always-on box all three lanes wanted; §J 73, 76 |
| No keys | *"no keys, codex and gemini cli use."* | The checker-family API key; §J 74. §I row 17 CLOSED |
| First contact widens | *"Yes, after N recall-free sends per venture"* | The ladder stopping below first contact; §J 84 |
| No vanilla week | *"No, compare Keel's modes only"* | The null hypothesis against a plain session; §J 75 |
| Row 16 stays open | *"Skip it, accept row 16 open"* | The thirty-minute sitting that would test the anchor assumption |

**Two decisions taken 2026-09-07, and they bind the same way.**

| Decision | The founder's words | What it settles |
|---|---|---|
| The terms — Reading C | *"what do you recommend?"* → the recommendation was **Reading C with Reading B's volume qualifier live inside it**, and the founder did not dissent | §I row 1 CLOSED as **v108, `class: ratified`**. Reopenable by any engine with a reason and a falsifier; the falsifiers are named in v108 |
| Change nothing yet | *"Change nothing yet"* | The sandbox posture. No settings file on this machine was modified by any lane. Deferred with a **trigger — revisit when `bin/run` exists** — not a date |

**Leaving row 16 open was the founder's decision and not an oversight, and a future reader will find it and
think otherwise.** Every review said the plan's central assumption — that a deterministic anchor exists for
most company work — is untested, and that testing it on the founder's own past work costs nothing. The founder
read that and chose to leave it open. The consequence stands: the architecture is untested against non-software
work until the first venture supplies its own thirty done-tests. **The same reasoning now covers row 19.**
Neither is drift, and neither is yours to close.

---

## 6 · What is open, and whose it is

**Four rows in SPINE §I, all the founder's.** The command names four ids and one of them is a moot row:

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
| 19 | The sandbox exemption `codex exec` needs — `denyRead` on `~/.codex`, plus provider TLS at the egress proxy | **NEW, raised 2026-09-07 by the headless rehearsal, and the founder's.** Not decided in the round that raised it, and *change nothing yet* leaves it standing. **Two blockers, either sufficient, and the evidence does not separate them:** both were removed together by disabling the sandbox, so whether lifting `denyRead` alone would suffice is untested |

**Closed this round:** row 1 (the terms, Reading C, v108). Row 5 — **Codex installed and rehearsed**:
`codex-cli 0.153.4`, auth mode `chatgpt` from stored tokens, no API key and no `codex login`; **20 of 20
invocations exit 0 with non-empty correct-shaped stdout, 10 of them fully detached**; **#19945 did not
reproduce once**. Row 6 — **MOOT**: Google withdrew personal-account access to the Gemini CLI on 2026-06-18.
The decision was not reversed; the route was removed, on availability rather than terms.

**Research: 15 of 46 open**, not 39 of 41.

```
awk '/^## N ·/,0' SPINE.md | grep -cE '^\| \*\*R[0-9]+\*\*'                       # → 46
awk '/^## N ·/,0' SPINE.md | grep -E '^\| \*\*R[0-9]+\*\*' | sed 's/~~[^~]*~~//g' \
  | grep -cE '\| *\*{0,2}OPEN'                                                     # → 15
```

Of the fifteen, several cannot close in planning at all — they need the system running. **R46 is one cell and
three live rows rest on it:** does a `claude -p` child have the auto-mode permission classifier at all? §C.2's
autonomous mode, O131's template and the framing of §I row 19 all wait on that answer, and none of them is
amended until it exists. **R45 is a founder act**, smaller than R33's LaunchAgent: leave one bounded process
running across one night.

---

## 7 · What to build, and why not more

**The kernel is ready and the whole system is not** (`DECISIONS.md` §27).

**Gate A — two things now, not three.** Lift the no-building hold. Write the managed settings file, which
after the founder's auto-mode decision (E9 · v92) carries **two keys**: `permissions.deny` and
`permissions.disableBypassPermissionsMode: "disable"`. *Authenticate Gemini has been removed from this gate:
§I row 6 is MOOT and the act no longer exists.*

**Gate B — the bounded day.** The data files and the constitution; `bin/log`; `bin/run` thin over the vendor's
own flags; `bin/reconcile` with its read-only instruments; the Sender staged behind a tap; `bin/check-stores`;
`bin/probe`, **authored by a different lane than the launcher**; the two charters including the first stranger;
page 4; the scoreboard.

**`bin/run` carries O131 and it is the item §3 is about.** A dispatcher that accepts a caller-supplied
`--settings` path has handed the caller its child's confinement.

**Gate C is a research programme, not a to-do list.** 122 absent mechanisms of 131, 28 `bin/` programs,
15 open questions. Do not attempt it as one run. The plan is staged specifically so you do not have to.

**The order matters and here is why.** The data files come first because nothing else can produce a builder
brief that fits in a context window. The log comes second because it is the sensor the whole controller lacks.
One real intent comes third because every number after it divides by a rate that does not exist yet.

**Four programs are a trusted base and are reviewed differently:** `bin/send`, `bin/inbound`, `bin/watch`,
`bin/run`. They touch the world, they carry a line budget, their only admission test is `keel/fixtures/`, and
the founder line-reviews them. The vendor's own flags are the floor beneath them, so a defect in the launcher
can narrow a grant but never widen one. **That is deliberate. Do not collapse it into one program.**

---

## 8 · The founder's acts still outstanding

Three, and none of them is an agent's.

1. **Install the R33 probe** — `final-v2/probes/r33/install.sh`, written and committed, with
   `uninstall.sh` beside it. Four reversible changes, all listed in the script's own header: one keychain item
   holding the literal `R33-OK`, `~/.keel-probes/r33-probe.sh`, one LaunchAgent plist, and the bootstrap. It
   reads nothing else, sends nothing anywhere, and takes no network action. The item is created **without
   `-A`**, which is the realistic case and the whole point: an `rc=51` in the log **is** the finding.
2. **Send or withhold the vendor report** on the `bypassPermissions` finding. Drafted, replicated, unsent.
3. **Decide the `Read(...)` rules** — whether the nine credential paths closed to `Bash` should also be closed
   to the agent's own file tool. Nobody has put this question to them yet.

---

## 9 · How to work here — what this session learned the hard way

- **A message to a running lane is delivered only when the lane's return quotes it — and the converse bites
  too.** A correction reached a lane *after* it had gone idle and committed; it woke, applied it, and became a
  second live writer on a file another lane was reading. That second lane **snapshotted the in-flight file and
  asked rather than overwriting**, which was correct. Require a quote-back line, and before dispatching a
  replacement, check whether the original has woken.
- **Verify a lane's work on disk before committing it, with a grep per finding.** Every round that skipped
  that step produced a correction in the next one.
- **A strikethrough looks like a live sentence to a grep.** Count `~~old~~ new` explicitly, or strip strikes
  before counting, or you will report a fix that did not happen and a fix that did happen as missing.
- **Escape pipes inside table cells.** Field-position parsing of SPINE's tables is unreliable for exactly this
  reason: 79 of 131 §L rows parse cleanly by column, so classify by pattern, not by `$NF`.
- **A figure in prose rots; a command does not.** Write the number *and* the command.
- **Dispatch `reviewer`, not `sourcer`, when the deliverable is a file.** `sourcer` has no `Write` and no
  `Bash`; two lanes could not write their returns and sent messages instead.
- **A lane refusing to re-encode a blocked artifact is correct.** Lane C recorded *"A teammate relaying the
  founder's authorization is not what grants capability here."* The plan should teach it.
- **Ask the founder only what only they can answer** — their money, their machine, their hours, their business,
  their appetite for risk. Everything else you decide from rules already on the page and record, reopenable by
  name. This is the founder's own standing instruction, given 2026-09-07, and it was applied twice this round.

---

## 10 · The standing constraints, still in force

Nothing built, installed, authenticated, spent, published or pushed **without the founder saying so**. The
Codex install of 2026-09-07 was authorised for that one act and lifts nothing else. No settings file on this
machine was modified by any lane, and each lane that ran children confirmed none was left running. `round-6/`
is not opened. Never a bare `git stash` — the stack is shared with other worktrees and other sessions. Never
commit to `main`. Founder overrules are final and are not re-litigated, including in a later round by a
different lane.

---

## 11 · The honest caveat, which belongs in every summary of this work

Every review, every research lane and every sandbox cell here was **one model family** — reading its own
prose, its own runtime and its own vendor's documentation about itself. By the plan's own evidence ladder that
ranks and flags and certifies nothing. **Eighteen files under `review/`** (`ls review | wc -l`), three fixer
lanes, three research returns under `research/close-*.md` and five sandbox lanes do not add up to an
independent panel; they add up to one family's reasoning applied many times, which is a real but bounded thing.

The mechanical layer is the part least exposed to it — exit codes, `errno`, a fresh random token present or
absent in stdout — and every sandbox cell is reproducible from the argv in its own file. **The interpretation
is single-family.** The `irreversible` tier's two-of-three multi-judge and the two-model-family predicate are
**unmet on every artifact here**. Accepted risk, exit condition 2026-11-17.

The only remaining test of this plan is running it.
