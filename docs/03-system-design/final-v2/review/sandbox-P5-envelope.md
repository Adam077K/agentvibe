# Sandbox panel · lane P5 — Keel's own permission model, against what the runtimes can enforce

**Posture:** the layer *above* the vendor sandbox — the permission system Keel designed for itself — asked
one question: can any of it be expressed in the mechanisms that exist?

*Written 2026-09-07 on branch `ceo-1-1788609834`. **I hold no `Bash`**, so this lane measures nothing of its
own: every anchor below is a file and line in this repository, or a measurement quoted from another lane's
return (`research/close-C.md`, `research/close-M.md`, `research/close-W.md`). Where I could not find an
anchor I say so rather than reasoning to a conclusion. Single-family caveat, §9.*

---

## 0 · The finding that reorders the rest

**The only permission file in this repository binds exactly where a human is watching, and is ignored
exactly where nobody is.**

`.claude/settings.json` carries 29 allow rules and 10 deny rules (lines 3–45). That is the **project** tier.
Lane C measured, with a positive control, that `--restricted` honours `--settings <file>` and **discards the
project settings file** (`close-C.md` R28, cells D and E: the same setting delivered through the project file
moved the model with no `--restricted` and did not move it with `--restricted`). Every unattended night child
runs `--restricted` (§12.10, `parts/12-control.md:717`).

So: the deny list governs the Floor, where the founder is present and can see what happens. It governs
nothing at 3 a.m. §12.6a already deletes this tier as *"a grant nobody reviews and a place two answers can
disagree"* (`parts/12-control.md:357-360`) — correct, and one implication is not drawn there: **until `bin/run`
exists, deleting the tier removes the only permission file the system has, and replaces it with nothing.**
There is no gap between the tiers; there is only the second tier, and it is ABSENT.

---

## 1 · Each envelope band, against the settings file that would express it

§C.1's table (SPINE.md:308–313, restated `parts/12-control.md:186-191`) has five columns. The **Envelope**
column (`may-alone` · `never` · `wake-me`) has **no carrier**. The Claude Code and Codex columns name
carriers; the envelope column names a vocabulary. That is not a defect by itself — it becomes one at §3.

| Band | What it says | What expresses it | Verdict |
|---|---|---|---|
| **1 · Read and report** | `may-alone` · `plan` · `never × read-only` | `--restricted --tools Read,Glob,Grep,WebSearch,WebFetch --permission-mode plan --permission-prompts none`, plus `--settings` `denyRead` per R1 | **REACHES IT**, with one hole: nothing scopes *which* web. The sandbox `network` block is documented (`close-C.md` R2) and **unset here** — `.claude/settings.json:78-99` carries `filesystem` only. Band 1's whole job is reading the untrusted world, and its reach is unbounded |
| **2 · Build in a worktree** | `may-alone`, **inside** one venture's worktree | cwd = worktree, plus a `denyWrite` list | **APPROXIMATES IT, and the gap is structural** — see below |
| **3 · Stage an outward act** | `never` for every agent | absence of the tool from `--tools`, plus `--strict-mcp-config` | **REACHES IT for tools; DOES NOT for `Bash`** — see §4 |
| **4 · Wake the founder** | `wake-me` | not a permission at all; the Watch is a program | **N/A** — correctly not a runtime concern |

**Band 2 is the one that does not reach, and the reason is not effort.** R1 measured that
`sandbox.filesystem.allowWrite` **only widens** — additive to built-in grants, unable to take one away — and
that `denyWrite`/`denyRead` are the narrowing verbs (`close-C.md` R1: with `allowWrite` set to one directory,
writes to a directory *not* in the list still succeeded, `INSIDE_CWD RC=0 OUTSIDE_CWD RC=0`).

The band says **"inside"**. The mechanism offers **subtraction**. To express *inside* you must enumerate the
complement, and the complement of one worktree on a live Mac is unbounded and goes stale: a sibling worktree
created tomorrow is writable unless someone remembers to deny it. This is not a wording problem. It is the
difference between a whitelist and a blacklist, and R1 says the write axis only has the blacklist.

**The live file is the worked example.** `.claude/settings.json` carries **four `allowWrite` entries and zero
`denyWrite` entries** (lines 82–98). Read as confinement, it confines nothing on the write axis; it is four
grants and a read-deny list. R1's own DECIDES line says this in the general case: *"An `allowWrite`-only
policy grants and never confines, which is what the repo's own `.claude/settings.json` currently expresses."*

**One unmeasured key would change this verdict.** `close-C.md` R2's enumeration of shipped sandbox keys
includes **`sandbox.workspace`** — never tried by any lane, and it is the name a positive-confinement
primitive would have. It is the cheapest high-value cell left in the whole panel. Alongside it,
`sandbox.enableWeakerNestedSandbox` (also enumerated, also untried) is the key that bears on nested dispatch.

**And band 2 has a second, separate blocker that is not about expressiveness at all.** A nested `claude -p`
child cannot start its own sandbox under the armed parent and **fails closed — all Bash refused**, 6 of 6
cells (`close-C.md` finding (i)); and `git worktree add` cannot complete anywhere under the armed sandbox
(`CLAUDE.md`, Git Worktree Protocol; brief evidence 9). So band 2 is not merely unenforceable today — it is
**unrunnable from inside a session**.

**It survives for a reason nobody wrote it for.** §L **O93** requires that *"`bin/probe`, `bin/run` and
`bin/send` never run inside a Claude session"* — from launchd (`parts/12-control.md:730-734`,
`SPINE.md:1107`). The stated reason is independence: *"a probe that imports the launcher asserts the
launcher's opinion of itself."* The consequence is that the launcher's children are **not nested**, and the
fail-closed finding does not touch them. O93 is load-bearing for a reason its own row does not claim, and it
should be recorded as such before someone relaxes it on the argument it was written for.

---

## 2 · Where reversibility and path-scoping disagree — two cases, both from the live file

**Case A · an irreversible act on an allowed path.** `.claude/settings.json` denies `Bash(curl *)` and
`Bash(wget *)` (lines 36–37) and allows `Bash(python3 *)` and `Bash(node *)` (lines 16–17). `python3 -c
"import urllib.request; urllib.request.urlopen(...)"` is an outbound HTTP request. Under Keel's axis it
reaches the world, so it is a **one-way door and `never`** (§12.2's Q2, `parts/12-control.md:87-88`). Under
the shipped axis it matches an allow rule and runs. **The two files disagree today, with nothing reconciling
them**, and the disagreement is not exotic: it is the second-most-obvious way to make an HTTP request.

I did not run this. It rests on §12.10's own statement that *"the pre-tool hook matches command strings and
is the wrong shape. It once blocked a document for mentioning a command"* (`parts/12-control.md:752-753`) and
on the glob shape of the rules themselves. **Marked as inference from the file, not measurement** — the cell
that would settle it is one `python3` one-liner under the live rules, and it is the single cheapest check in
this document.

**Case B · a trivially reversible act on a denied path.** `Bash(chmod +x *)` is denied (line 38). `chmod +x`
has a one-command drilled undo (`chmod -x`) and touches nobody. Under Keel's axis it is a **two-way door →
`may-alone`, do it, do not ask**. Under the shipped axis it is refused. Same for `Bash(npx *)` / `Bash(bunx
*)` (lines 41–44) — running a local formatter, reversible by `git checkout`.

**Which gives — plainly: the claim of enforcement gives, not the axis.**

§12.2 closes *"v28 stands and gains its mechanism"* (`parts/12-control.md:79`). That is one word too strong.
What O109 gives v28 is a **place to record reversibility and compile from it** — the verb table, read by
`bin/run` at composition. Enforcement stays path-and-verb, because that is the only thing either runtime
evaluates. The honest form, and I recommend it replaces that sentence:

> Reversibility is enforced **at composition, over tools**. It is not enforced over **acts**, and no shipped
> mechanism can make it so. A run holding `Bash` is outside the axis entirely.

That is not a retreat. It is the difference between a claim that can be checked (`bin/probe` asserts the
composed argv is inside the floor) and one that cannot (a shell one-liner nobody classified).

---

## 3 · `may-alone` — what decides it at runtime, with a path and a state

**Nothing decides it at runtime, and after O109 nothing should.** §12.2's flowchart Q1 was the one decision
this plan let a model make about itself, and O109 deleted the run-side form of it (`parts/12-control.md:72-81`).
Correct call. The consequence is that `may-alone` is a **compile-time** property of the argv, not a runtime
predicate — so the Envelope column of §C.1 is a *label on a dispatch decision*, never a mode.

| What must decide `may-alone` | Path | State |
|---|---|---|
| The verb table — `verbs: [{name, effect, reversible, undo, drilled}]`; unlisted ⇒ one-way | `keel/shared/tools/<name>.yml` | **ABSENT** — `Glob keel/**` returns **no files**; the whole `keel/` tree is unbuilt |
| The composer that reads it and emits argv | `bin/run` | **ABSENT** (same) |
| The three lists in the founder's words | `ventures/<v>/charter.md` | **ABSENT** |
| The defaults merged into every charter | `shared/never-default.yml` · `wake-me-default.yml` | **ABSENT** (`parts/12-control.md:50`) |
| The assertion that a composed argv was inside the floor | `bin/probe` | **ABSENT** |
| The floor the composer may not widen | `--restricted` · `--tools` · managed `permissions.deny` · `disableBypassPermissionsMode` · `blockReadsOutsideWorkingDirectories` | **EXISTS** — vendor flags, W7/W8; `blockReadsOutsideWorkingDirectories` ships and is **unset here** |

**State of `may-alone` as a runtime decision: WISH.** State of the *design*: coherent and, unusually for this
plan, expressible — because it compiles down to flags that exist. The `--restricted` + `--settings`
composition R28 measured is the mechanism that makes it so, and I do not think the plan noticed: §12.6's
`DEPENDS-ON-R28` (`parts/12-control.md:335`) asks whether `--restricted` ignores `--settings`, and R28
answers **no, it composes** — so a launcher can drop three settings tiers and still deliver exactly one
policy file per child. **That is the carrier the whole band table wanted and did not name.** The
`DEPENDS-ON-R28` marker can be discharged.

---

## 4 · How an outbound act is actually gated

Traced end to end: run stages a hashed artifact, unsent → founder tap, or a class the ladder widened
(§12.2b) → `bin/send` reads the ladder step, the verb table, the consent register, the disclosure line, the
provenance line, the PII gate and the taint id → recall window → the act.

**Every gate in that chain is Keel's own program. Not one of them is the vendor's permission system.** The
vendor contributes exactly one thing, and it contributes it by *absence*: the agent's `--tools` list does not
name an outward tool.

Which means the chain holds only while the trifecta split holds at dispatch (§12.7) — and it does not hold
for any agent carrying `Bash`. §12.7 counts eleven of fourteen with no shell, so three carry one. For those
three the Sender is not defeated; it is **bypassed by not being used**, and nothing observes that.

The syscall-level gate exists in the vendor's schema and is unused here:

- `sandbox.network.allowedDomains` · `strictAllowlist` · `allowManagedDomainsOnly` · `deniedDomains` · `tlsTerminate`
- `sandbox.credentials.files` · `.awsPairs` · `.sigv4` · `.allowPlaintextInject`

All enumerated from the shipped binary by lane C (`close-C.md` R2). `.claude/settings.json` has **no
`network` key at all** (lines 78–99).

**So, plainly: today the outbound gate is a sentence.** With `bin/send` built and no `network` block it
becomes *a program you can walk around*. Only with the `network` block set does it become *a program plus a
syscall boundary*, and that is the first point at which **"the Sender is the only thing that sends"** is a
checkable claim rather than a convention. §12.8a already says the right thing — *"§12.7's trifecta split
guarantees a leg is missing at dispatch; the door outward keeps it missing at the syscall"* — and the syscall
half is configuration nobody has written.

**Two costs to state before anyone sets it.** (a) R2 found **no HTTP-method allowlist** after searching five
term families; v68/D3 specifies filtering *"by domain and HTTP method"*, so **the method half has no vendor
mechanism and is ours or it is dropped**. (b) `tlsTerminate` is the *precondition* for credential injection,
not an option beside it — turning it on means the proxy sees every byte the child sends, including anything
the child already holds. That is the trade, and it should be named once rather than discovered.

---

## 5 · The hard question: is this a third instance of two implementations of one check?

This repository has been burned twice and names both. Risk classification: the `risk:irreversible` step in
`qa-lead-pass.yml` *"computed a second, stricter answer"* than `classifier.js`, and `scripts/classify.mjs`'s
own header had warned *"two implementations of risk classification will disagree, and you find out during the
incident"* (`CLAUDE.md`, QA gate section). Verdicts: PR **#77** was **closed rather than merged** because it
bound a verdict to a HEAD sha while `verdict.mjs` binds by content hash (`CLAUDE.md`, Project State).

**My answer: mostly no, and precisely one part is a third instance.**

**Not a duplicate — these answer questions the vendor never asks.** The consent register (*may we contact
this person at all*), the widening ladder (*has this class earned an untapped send*), staged-not-sent, the
world's door, the recall window, the interruption budget. No runtime has a concept for any of them. Different
question, different key space, **no disagreement is possible**. This is where most of Keel's permission layer
lives, and it is genuinely additive.

**Not a duplicate — the verb table is a front end, not a rival.** A compiler from a high-level axis
(reversibility) to the vendor's low-level one (path + verb) has **one output** and leaves the vendor as the
only enforcement. What keeps it a front end rather than a second answer is **O104**: the vendor's flags are
the floor, `bin/run` narrows and never widens, so a launcher defect yields a *narrower or refused* run, never
a wider one (`parts/12-control.md:724-729`). That property is the whole distinction, and it is worth saying
in the plan that it is *why* the layer is not a duplicate — right now O104 is filed as a safety property,
which undersells it.

**Yes, a third instance, in one place — and it is live today.** §12.2's Q2/Q3 (*reaches a person, money or
the public* · *destroys something a human made*) and §12.1's `never` list are **a second answer to the
question `permissions.deny` answers**, computed by a different mechanism over a different key space. §2's two
cases show them already disagreeing in both directions, in the file on disk. It is the qa-tier-floor shape
exactly: one file computes the class of an act, and a second, stricter-in-places answer lives somewhere else,
with nothing reconciling them and no test that would notice.

**The cure is the one this repo already found: one file computes it.** Make the verb table the source and
**generate** the night child's `--tools` list and its `--settings` deny lists from it. Nothing hand-writes a
deny rule for an unattended run. Then there is one answer with two renderings — which is what
`scripts/lib/classifier.js` is to path tiers, and what `check-suite.js` is to the step list. §12.6a already
deleted the project tier on exactly this reasoning (*"a place two answers can disagree"*); it simply has not
been applied to *allow/deny versus the verb table*, which is the same collision one level up.

---

## 6 · What I would do — ranked by what it protects against and what it prevents

The founder is one person on one Mac. I have ranked accordingly and named the daily cost of each.

| # | Act | Protects against | Prevents / costs | Who |
|---|---|---|---|---|
| **1** | **Set `sandbox.network` for night children only, delivered by `--settings` — `allowedDomains` per venture, `strictAllowlist: true`.** Not on the Floor. | Exfiltration by a persuaded agent, and the `python3` hole that makes the `curl` deny vacuous. It is the *only* item here that converts the Sender from convention to boundary | Blocks a night scout fetching a domain nobody listed — real friction, and scout's list must be wide. **Config, not code.** Zero lines written | Founder (it is a settings edit; this lane may not make it) |
| **2** | **Generate the night child's grant from the verb table; hand-write no deny rule for an unattended run.** | The third-instance collision, *before* it exists | Requires the verb table to be complete. An unlisted verb is one-way (O109) — so it **fails closed**, which is the right direction | `bin/run` at build time |
| **3** | **Say plainly in §12.2 that reversibility is enforced at composition over tools, not over acts.** Replace *"v28 gains its mechanism."* | A checkable claim being read as a stronger uncheckable one — the failure this repository documents more than any other | Nothing. One sentence | Whoever writes §12 (**not this lane** — another lane holds SPINE) |
| **4** | **Add a `denyWrite` list; stop reading the four `allowWrite` entries as confinement.** | The belief that `isolation: worktree` is enforced when R1 shows it is declared | Needs an author, and the complement is unbounded — so it is mitigation, not a fix. Item 5 may replace it | Founder / build time |
| **5** | **Two cells: `sandbox.workspace`, and `sandbox.enableWeakerNestedSandbox`.** Both keys ship; neither has ever been tried | Building a `denyWrite` complement by hand when a positive-confinement primitive may exist; and treating nested dispatch as impossible when one flag may lift it | Two `claude -p` invocations. This is the highest value-per-minute act in the panel | A lane with `Bash` |
| **6** | **Discharge §12.6's `DEPENDS-ON-R28` — the answer is *they compose*.** | A build blocked on a question already answered | Nothing. One edit | Whoever writes §12 |
| **7** | **Record on O93's row that it is what makes the nested fail-closed finding survivable.** | Someone relaxing O93 on the independence argument alone and silently breaking every night child | Nothing. One clause | Whoever writes §L |

**What I would NOT do.** Do not widen the sandbox to make band 2 runnable in-session. The escalation path
(`bin/run` from launchd, O93) is already the correct answer and is already decided. Do not add a hook that
re-checks reversibility at tool time: it would be the third implementation, it matches command strings, and
§12.10 already documents that shape failing.

---

## 7 · What would prove me wrong

- **`sandbox.workspace` expresses positive confinement.** Then §1's complement problem dissolves, band 2's
  word *inside* becomes literal, and recommendation 4 is withdrawn in favour of 5.
- **`permissions.deny` evaluates structured tool input rather than the command string.** Then §2 Case A is
  wrong and the third-instance argument loses its live example — though not its structure, since Case B is
  about a rule that exists rather than one that is evaded.
- **A measured cell shows `strictAllowlist` breaking the child's own model traffic.** Then recommendation 1 is
  unaffordable as stated and must be narrowed to `deniedDomains`, which is much weaker.
- **The founder decides the Floor and the night share one settings file.** Then §5's third instance gets
  *worse*, not better, and recommendation 2 becomes urgent rather than preventive.
- **A year of `bin/probe` runs in which every composed argv was inside the floor anyway** (O104's own
  `wins_if:`). Then the whole compile-time layer was ceremony and the vendor floor was the system.

## 8 · What I could not determine

1. **Whether `permissions.deny` matches command strings or parsed input.** Inferred from §12.10 and the glob
   shape of the live rules. Not measured. It is the load-bearing assumption under §2 Case A.
2. **Whether managed settings can pin a `denyWrite` a child cannot widen** — R1's own residue; the binary
   carries `allowManagedReadPathsOnly` and states managed settings can take exclusive ownership of
   `sandbox.filesystem`. One cell closes it, and it decides whether the two-tier grant model of §12.6a is real.
3. **Whether `plan` mode denies `AskUserQuestion`** — `parts/12-control.md:261` marks it UNVERIFIED and it
   still is. Band 1's behaviour when a read-only run hits a question is therefore unknown.
4. **Whether `strictAllowlist` / `allowedDomains` govern the sandboxed shell's network and WebFetch
   separately.** R2's vendor string hints they are distinct surfaces; nothing measured it.
5. **Anything about Codex's Guardian axis from our side.** W21 describes its behaviour; no lane has measured
   whether it is configurable at all, so the Codex column of every band is two axes we can set and one we
   cannot.
6. **Whether any of this composes with the Codex sandbox.** The bands claim `never × read-only` and
   `never × workspace-write`; no cell in any lane has run a Codex child under those axes. `codex exec` needed
   the sandbox lifted in every working cell (brief evidence 3), so the band's Codex column is untested end to
   end.

## 9 · Single-family caveat

One model family reading its own system, one agent, one pass, and **no measurements of my own** — this lane
holds no `Bash` and every anchor is a file read or another lane's number. That is weaker than lane C's
position, not stronger: where lane C's negatives mean *"not found by these cells"*, mine mean *"not found by
these reads"*. This is not an independent panel, and §5's answer to the hardest question is a judgement, not
a measurement. It should be put to a second family before it moves a row.

---

## Claims this lane would register (proposed — nothing appended; this lane holds no `claim-append`)

| id | claim | kind | verified_by | valid_until |
|---|---|---|---|---|
| `c-project-tier-binds-only-the-floor` | The project settings tier governs attended sessions and is discarded under `--restricted`, so it binds where a human is present and not where none is | project | command (`close-C.md` R28 cells D/E, re-run) | 2026-12-07 |
| `c-allowwrite-only-widens` | `sandbox.filesystem.allowWrite` cannot confine; `denyWrite` is the narrowing verb, and this repo's live file carries zero `denyWrite` entries | project | command (R1 driver3 cells F/G) | 2026-12-07 |
| `c-reversibility-compiles-not-enforces` | Reversibility is enforceable at composition over tools and is not enforceable over acts in either shipped runtime | global | judge (≥2 families) | 2027-03-07 |
| `c-restricted-composes-with-settings` | `--restricted` honours `--settings <file>` while discarding user/project/local tiers — discharges §12.6's `DEPENDS-ON-R28` | project | command (R28, five cells) | 2026-12-07 |
