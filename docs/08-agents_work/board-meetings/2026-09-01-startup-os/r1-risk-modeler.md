# Round 1 · Risk Modeler — how it dies

**Board meeting `2026-09-01-startup-os`, sealed room 4 of 5.** Framing:
`r0-framing-risk-modeler.md`. Every position below carries evidence pointing at a real file and
section, or is labelled `INVENTED`. Every proposed rule names its mechanism or is labelled `WISH`.
Rule 10 governs everything here: **a check that could not run returns `unresolved`, never `pass`.**

---

## 0 · What I measured, first-hand, before reasoning

I did not take the census on trust. Six probes, run in this worktree 2026-09-01/02. They are the
spine of everything below, so they come first.

### 0.1 The enforcement spine is blind to the most dangerous act in the system

```
$ node scripts/classify.mjs assets/promo.mp4 posts/launch.txt
assets/promo.mp4      tier=lite · enforcement=shadow · matched: (none — default)
posts/launch.txt      tier=lite · enforcement=shadow · matched: (none — default)
floor=lite  (assets/promo.mp4 → null)
```

A video and a caption about to be published to TikTok **under the company's name, unattended, at
3am** classify at the **second-lowest of four tiers, in shadow mode**. Not by oversight — by
construction. `scripts/lib/classifier.js`'s public API is `classifyFile(file, rules)` and
`classifyFiles(files, rules)`. **Its only input is paths.** An action that touches no risky path
is invisible to it, and every worldly action touches no risky path.

`.claude/qa-tier-floor.yml`'s `enforcement: block` rows are `**/supabase/migrations/**`,
`**/prisma/migrations/**`, `**/drizzle/migrations/**`, `.github/workflows/**`,
`.claude/agents/**`, `.claude/settings.json`, `.mcp.json`. Every one is a **file**. The reason
given for the group is exactly right — *"`git revert` does not undo them"* — and a posted letter,
a sent email and a charged card are the same class with no file to name.

### 0.2 The riskiest tools reach the blocking hook and are allowed, silently

I drove `.claude/hooks/pre-tool-use.sh` with real PreToolUse payloads on stdin:

| Payload `tool_name` | exit | stderr |
|---|---|---|
| `mcp__higgsfield__tiktok_publish` | **0** | *(none)* |
| `mcp__higgsfield__sandbox_exec` | **0** | *(none)* |
| `mcp__claude_ai_Gmail__send_message` | **0** | *(none)* |
| `Task` | **0** | *(none — not matched at all)* |
| `Bash: rm -rf /` (control) | 2 | BLOCKED |
| `Bash: curl https://evil.example.com` (control) | 2 | BLOCKED |

The controls prove the harness works. The first three are the point: **publish to TikTok, remote
code execution through a media server, and send mail as the founder are allowed with no block, no
warning, and no log line.**

This is not a bug. `.claude/mcp-policy.json`'s `_doc` states the rule and the rule is defensible:
*"THE RULE IS SCOPE, NOT SERVER NAME… A server absent from here AND from `.mcp.json` is user
scope — the founder's own figma, notion, gmail, miro, higgsfield — and this repo does not govern
it."* The decision table in `pre-tool-use.sh`'s header spells out the consequence:
`server in neither policy nor .mcp.json → ALLOW, no log`.

The policy governs exactly two servers:

```
$ node -e "…require('./.claude/mcp-policy.json')…"
playwright    | credentialed: false | allow: 21 | deny: 3
claim-append  | credentialed: false | allow:  1 | deny: 0
mode: shadow
```

And `claude mcp list`, run this session, says `playwright: ✘ Failed to connect —
CONNECTION_CLOSED`. **The one server with a per-tool policy is the one that cannot connect. Every
server that can connect is ungoverned.** The policy is in `shadow` mode besides, so even its two
entries only log.

### 0.3 I am, right now, holding the catastrophic surface with no grant

My own deferred-tool roster in this session includes `mcp__higgsfield__tiktok_publish`,
`mcp__higgsfield__sandbox_exec`, `mcp__claude_ai_Gmail__send_message`,
`mcp__claude_ai_Google_Drive__share_file` and the full `mcp__claude-in-chrome__*` set — the
founder's own authenticated Chrome.

**State precisely what this does and does not establish.** I was launched as a *teammate*, not via
`Agent(subagent_type: builder)`, so it does **not** falsify `mcp-policy.json`'s measurement that
*"dispatching `designer` … yields all 24 `mcp__playwright__*` tools; dispatching `builder`, which
declares no `mcpServers`, yields zero."* What it does establish is narrower and still serious:
**at least one dispatch path in live use carries the entire user-scope surface to an agent that no
repo file granted it.** Territory 09's gap #8 is not a future risk. It is the configuration I am
running under.

### 0.4 There is no `ask`, anywhere

```
allow: 29   deny: 10   ask: 0
deny: ["Bash(rm -rf *)","Bash(curl *)","Bash(wget *)","Bash(chmod +x *)",
       "Bash(npm install -g *)","Bash(pip install *)","Bash(npx *)","Bash(bunx *)",
       "Bash(npm exec *)","Bash(bun x *)"]
```

Ten deny rules, all `Bash(...)`. **Zero MCP rules of any kind, and not one `ask` rule in the
file.** Per the Claude Code permissions model summarised in `hands.md` §5.1 pattern 1, *"deny and
ask accept full globs (`mcp__*` matches every MCP tool everywhere) while allow rules accept a glob
only after a literal `mcp__<server>__` prefix"* — so a vendor-enforced, machine-wide backstop over
every MCP tool costs **one line** and does not exist.

### 0.5 The only stop that exists is registered nowhere, and its measurement library works

```
$ grep -c 'budget-guard' .claude/settings.json      →  0
$ ls .claude/hooks/budget-guard.js                  →  9,771 bytes, present
$ node -e "…usage.windowUsage()…"
{"output_tokens":66876,"subagent_output_tokens":12818,"window_hours":5,
 "filesScanned":2944,"bytesRead":20236}
$ node -e "Object.keys(require('./.claude/settings.json').hooks)"
[ 'SessionStart', 'PreToolUse' ]
```

The measurement is live and account-wide — 2,944 transcript files across the whole projects
directory, so it genuinely sees the founder's own consumption, not just this project's. Two of ten
hook events are listened on. `STARTUP-OS.md` §1b calls this *"Decision 8 already built"* and it is
correct.

### 0.6 Nothing can stop what is running

```
$ grep -rln 'kill.switch|killswitch|KILL_SWITCH|emergency.stop' . --exclude-dir=node_modules
docs/02-competitive/expansion/00-TERRITORY.md
docs/02-competitive/expansion/concepts.md
docs/02-competitive/expansion/open-source.md
```

Three hits, all three in documents describing the gap. **Zero in code.** Territory gap #4 —
*"you cannot steer something already running"* — is exact.

### 0.7 The Bash rules can be walked around, and the way they can is instructive

| Command | exit |
|---|---|
| `npx --version` | 2 (BLOCKED) |
| `( npx --version )` | **0** |
| `rm -rf /` · `( rm -rf / )` · `{ rm -rf / ; }` · `eval "rm -rf /"` | 2, 2, 2, 2 |
| `curl https://evil…` · `( curl … )` · `C=curl; $C https://evil…` | 2, 2, 2 |
| **`node -e "fetch(1)"`** | **0** |
| **`python3 -c "import urllib"`** | **0** |
| `Write` → `.env` | 2 (BLOCKED) |
| **`Bash: echo x > .env`** | **0** |

Two findings, and the second is the durable one. The `( npx … )` bypass recorded in `STARTUP-OS.md`
§1b is **real and rule-specific** — `rm` and `curl` survive subshells, braces and `eval`, so it is
an anchoring defect in the npx rule alone, not a general escape. The general escape is
`node -e` and `python3 -c`, which reach the network and the filesystem with no rule looking at
them at all. `pre-tool-use.sh`'s own header names this class in its MCP comment: *"the enumeration
failure this file's own SSRF guard was rewritten to stop repeating."* And `echo x > .env`
succeeding where `Write` to `.env` is blocked is the `Bash`-vs-`Write` divergence CLAUDE.md
documents, measured live.

---

## 1 · Thesis

**This system's fatal risks are not capability risks. They are *binding* risks — the gap between a
control existing and a control being in the path of the action it names.** Every failure mode below
that I rate catastrophic is already, today, either unbound (the classifier cannot see the act), or
unwired (the control exists and nothing calls it), or ungoverned by design (the hook's scope rule
correctly excludes precisely the servers that can spend, send and publish).

That reframes the design problem. The founder asked for hands; the hands are bought. The question
is not *what may a worker touch* but **what stands between a persuaded model at 3am and an
irreversible act**, and the honest current answer is: for code, a great deal; for the world,
nothing at all.

Three structural properties carry almost all of the achievable safety, and all three are cheap
because the repo already owns the mechanism:

1. **Reach is declared on the grant, not the call, and the effective tier is `max(path, reach)` in
   the one classifier.** Declared per action it is declared hundreds of times and wrong somewhere;
   declared per tool it is declared once, when someone is thinking about it.
2. **A `human` gate has no `run:` and writing one is refused.** `.claude/gates.yml` and
   `scripts/check-gates.mjs` already make "a person must decide" a *type*, not a policy — so no
   mode, config or reasoning chain can clear it. That refusal is the only structural impossibility
   in the repository and it is unused.
3. **The default branch of every outbound tool is the reversible one, and the irreversible branch
   requires a second call carrying the artifact's hash.** #116's lesson, generalised: an unknown
   flag must refuse rather than perform the non-dry action.

And one honest counterweight: **a large share of the residual risk cannot be closed and must be
named.** The sandbox is not containment, Bash is a general capability, a verdict is hash-bound and
not signed, and no reasoning-layer control survives prompt injection. Pretending otherwise is the
failure mode this repository exists to refuse.

---

## 2 · The ranked failure table

**Scales, stated so the ordering is auditable rather than atmospheric.**

*Probability* — `5` measured already true, or certain on first use · `4` near-certain within days
of the capability existing · `3` likely within weeks · `2` plausible over months · `1` needs an
unlikely conjunction.

*Severity* — `5` irreversible: money spent, a person contacted, a document signed, a letter
posted, a credential leaked · `4` external, visible, partially reversible, reputational residue ·
`3` internal damage recoverable by `git revert`, or a detection-latency amplifier · `2` a wasted
day or quota · `1` wasted tokens.

| # | Failure mode | P | S | P×S | Status |
|---|---|---|---|---|---|
| 1 | **The mitigation ships and nothing calls it** | 5 | 5 | 25 | BUILDABLE |
| 2 | **A worldly act is tiered `lite`/`shadow` because it touched no path** | 5 | 5 | 25 | BUILDABLE |
| 3 | **The catastrophic MCP surface is ungoverned and unlogged** | 5 | 5 | 25 | BUILDABLE |
| 4 | **Publishing / sending under the company's name in one hop** | 4 | 4 | 16 | BUILDABLE |
| 5 | **Nothing can stop what is already running** | 4 | 4 | 16 | BUILDABLE |
| 6 | **Balcony flood — the row that mattered was row 137** | 4 | 4 | 16 | BUILDABLE |
| 7 | **Prompt injection turns a grant into the attacker's grant** | 3 | 5 | 15 | PARTLY — accept at the reasoning layer |
| 8 | **Runaway spend on a metered hand** | 3 | 5 | 15 | BUILDABLE — and nothing here can express a rate |
| 9 | **The wrong human is contacted** | 3 | 5 | 15 | BUILDABLE |
| 10 | **Blocked and stalled are indistinguishable, so escalation never fires** | 5 | 3 | 15 | BUILDABLE, near-free |
| 11 | **`dangerouslyDisableSandbox` — the guardrail is not containment** | 5 | 3 | 15 | **ACCEPT AND NAME** |
| 12 | **Bash is a general capability; enumerate-the-bad cannot be completed** | 5 | 3 | 15 | **ACCEPT AND NAME** |
| 13 | **It circles and burns the five-hour window** | 5 | 2 | 10 | BUILT, unregistered |
| 14 | **The multi-family panel is structurally unresolvable** | 5 | 2 | 10 | **ACCEPT**, Rule 10 already honest |
| 15 | **The founder's own quota is eaten by the loop** | 4 | 2 | 8 | BUILT, unregistered |
| 16 | **A stale worktree publishes correct-looking wrong facts** | 4 | 2 | 8 | PARTLY BUILT |
| 17 | **Cross-venture contamination of facts or credentials** | 2 | 4 | 8 | BUILDABLE |
| 18 | **A physical or legal act — sign, post, register** | 1 | 5 | 5 | Must never rise above P=1 |
| 19 | **A verdict is forged** | 1 | 4 | 4 | **ACCEPT AND NAME** |

Rows 1–3 tie at 25. Row 1 leads because **it disarms the fix for every other row**: a reach axis
that nothing calls, a wrapper nothing routes through and a gate nothing resolves are indistinguishable
from an absence, and this repository's measured rate of producing exactly that is high.

---

## 3 · Each mode, and the structural property that bounds it

### 1 · The mitigation ships and nothing calls it — P5 × S5

**Why it is first.** `STARTUP-OS.md` §1b's census is nine rows and **six exist unwired**. Add the
independent counts: `budget-guard` registered 0 times · `outbound-approval` with 0 consumers in
`workflows/`, `scripts/`, `.github/` and `bin/` (`ROSTER-SIZE.md`:341, re-derived) · `design.js`
zero invocations ever · 1 of 4 workflows runs · 1 of 7 mission-control views acts · 0 of 18 agents
cite a mental model · 0 of 8 board personas have agent files. `00-TERRITORY.md` closes with
*"built-and-never-wired is the endemic failure mode — in this repo and in all five systems
studied."* This is not a tendency, it is the base rate.

**The structural property.** *Nothing merges without a caller in the same diff* — `concepts.md`
§17 item 1, X1, the birth certificate. It is the only proposal in the source material that
**prevents** rather than detects, and it is a CI check, so it is a mechanism and not a wish.

**Mechanism:** a new step in `scripts/lib/check-suite.js` (which owns the one step list, and
`test:check-suite` fails when `package.json` drifts from it), asserting that every newly-added
executable declaration — a gate id, a hook file, a workflow, a resolver — is referenced by
something that runs. The existing `scripts/check-registration.mjs` dead-path check is the same
shape pointed the other way and is the model to extend.

**What it cannot close.** A caller that exists and is never reached at runtime — reachability is
not callability. `probe-workflow-reach.mjs` is the repo's existing answer to that narrower
question and the pattern generalises, but a probe is evidence, not proof.

---

### 2 · A worldly act is tiered `lite`/`shadow` — P5 × S5

**Measured in §0.1.** The whole enforcement spine — classifier, tier floor, QA gate, verdict
binding — is a function of *paths*, and the acts that end a company are functions of *effects*.

**The structural property.** `reach` as a **second axis on the one classifier**, with the effective
tier the **max** of the two. `concepts.md` §7 R1. And, critically, R2: **reach is declared on the
grant, not on the call.** A pack granting a tool with no `reversible:` / `blast_radius:`
declaration is invalid; the action's reach is then *derived* from the tools it used rather than
asserted by the actor.

**Mechanism:** extend `scripts/lib/classifier.js` and add rows to `.claude/qa-tier-floor.yml`.
`schema-lint.js` already fails an agent declaring `mcpServers` that no configuration backs — the
identical shape refuses a grant carrying no risk declaration.

**Refuse the alternative.** `concepts.md` §15 A5 and `scripts/classify.mjs`'s own header:
*"Two implementations of risk classification will disagree, and you find out during the incident."*
It has already happened here once. **Extend the one file; never parallel it.**

**What it cannot close.** A tool whose blast radius depends on its arguments — a browser can read a
page or submit a form. Declare the *maximum* radius and split dual-purpose tools where the server
allows. Where it does not — and `higgsfield` does not, see mode 3 — the maximum is what binds, and
that will feel too strict. It is the correct direction to be wrong in.

---

### 3 · The catastrophic MCP surface is ungoverned and unlogged — P5 × S5

**Measured in §0.2 and §0.3.** Three tools with `S=5` consequences return exit 0 from the only
blocking mechanism in the repository, and write nothing to any log.

**The hard part, stated honestly: the obvious fix is the wrong fix.** CLAUDE.md's Git Worktree
section records the general lesson from issue #96.3 — when `Bash` and `Write` disagree about a
path, *"decide which one is right for that path and move the other to meet it"*, and notes that
applying the widen-the-hook template in the wrong instance inverts it. Here, `pre-tool-use.sh`'s
scope rule is **right**: this repo should not govern the founder's own Gmail during the founder's
own interactive session. Widening it to do so is the inverted resolution.

**Three layers, and they are not interchangeable.**

- **Per-worker — the grant.** `mcpServers:` in agent frontmatter, lint-enforced, and **measured to
  narrow across dispatch**: `mcp-policy.json`'s own `_scope` note records `designer` receiving all
  24 playwright tools and `builder` receiving zero. This is the mechanism that already works and
  the one to extend. `sourcer` holding `mcpServers: [claim-append]` with **no `Write` and no
  `Edit`** on its `tools:` line is the exemplar of a narrow grant done properly.
- **Per-machine — the vendor's own deny/ask globs.** Zero exist (§0.4). `deny` accepts `mcp__*`;
  it is enforced above this repo's hook and therefore above this repo's bugs. One line for the
  handful of tools that must never fire from an agent session: `tiktok_publish`, `sandbox_exec`,
  Gmail `send_message`, Drive `share_file`.
- **Per-action — a repo-owned wrapper.** See mode 4. The genuinely catastrophic tools should not be
  reached through the MCP directly at all.

**The granularity gap, named because it has no clean existing answer.** `higgsfield` is **one
server carrying 84 tools**, spanning `generate_image` (benign) and `tiktok_publish` +
`sandbox_exec` (`S=5`) — `hands.md` §1.1. Frontmatter grants are **per server**. So the grant
granularity available is *coarser than the risk granularity required*, and no amount of careful
pack authoring fixes that. `mcp-policy.json` solves it for project servers with per-tool
allow/deny lists, and its scope rule excludes user-scope servers by design. Either that scope rule
gains a third case — *credentialed user-scope servers explicitly named by a pack are governed* —
or the catastrophic tools are denied at the settings layer and reached only through a wrapper.
**I recommend both. Neither alone is sufficient, and this is the sharpest unresolved design
question in my lane.**

**And the mode is `shadow`.** Even the two governed servers only log. `ADR-001`'s carve-out is
already the right principle — outbound send, deploy, migration and harness self-edit block from
day one *because `git revert` does not undo them* — and `credentialed: true` already blocks
regardless of mode. **Every credentialed outbound server must carry `credentialed: true`.** That
is a data edit to one file, and the asymmetry is already hard-coded in the hook so no review
process has to remember it.

---

### 4 · Publishing or sending in one hop — P4 × S4

**The structural property.** `concepts.md` §7 R4: **the default branch of every outbound tool
produces the artifact** — the draft, the unpublished post, the unsigned document — and the send is
a **separate, explicit call carrying the artifact's hash**. The default is always reversible.

**Mechanism:** the wrapper, plus #116's rule that an unknown flag **refuses** rather than
performing the non-dry action. The failure direction is asymmetric — a missed send costs nothing,
a wrong send cannot be recalled — so the refusal must be on the side of not sending.

**Why the hash matters and is not ceremony.** R4's own "fails when" is that workers learn to chain
both calls immediately. Requiring the hash means the second call must reference an artifact that
**already exists on disk and is inspectable**. That is what converts a two-step protocol into a
review surface. Without the hash it is two keystrokes.

**A free oracle worth taking.** `higgsfield` exposes `virality_predictor` — `hands.md` §1.1 point
2 calls it *"a verdict from the world, or the nearest thing we own"*, a pre-publication score that
is not a code test. It is the first non-code oracle available without building anything. It is a
**done-test input**, never a done-test resolver: `concepts.md` §15 A3 forbids a model scoring its
own work, and the local measurement is a design judge at 0.543 against a panel only 0.741
self-consistent.

---

### 5 · Nothing can stop what is running — P4 × S4

**Measured in §0.6: zero code references to any stop mechanism.**

**The structural property, and the placement is the whole content of the position: the check lives
in the supervisor, not in the prompt.** A stop instruction in an agent's context is a request. A
stop-file the *runner* stats before each iteration is a fact the model does not participate in.

**Mechanism, using only what is installed** (`hands.md` §3.1, all `[M]`): `launchd` with
`KeepAlive` is the supervisor, `launchctl unload` is the true kill, and `WatchPaths` makes a
directory both the inbox and the stop-file. The loop body is `claude -p --allowedTools <narrow
list>` — headless, with a per-invocation grant. §3.1 says it plainly: *"A launchd job that runs
`claude -p` with a narrowed `--allowedTools` list is a complete, working, 24/7 worker with a
per-run capability grant, using only what is installed today."*

**Do not build the loop on `CronCreate`.** Its own schema, quoted in §3.1: jobs *"live only in this
Claude session — nothing is written to disk, and the job is gone when Claude exits"*, `durable`
*"has no effect"*, jobs *"only fire while the REPL is idle"*, and recurring tasks auto-expire after
7 days. It is a within-session heartbeat. A 24/7 company built on it dies at the first exit and
reports nothing.

**The steering half, beyond stop.** `hands.md` §5.1 pattern 9 names LangGraph's third verb:
approve / **edit** / reject. *Edit the arguments* is a strictly better founder verb than yes/no and
is the direct answer to gap #4. MCP **elicitation** (`elicitation/create`) is the standard's own
wire format for it — and note the caveat §5.1 flags loudly: `roots`, `sampling` and `logging` are
deprecated as of protocol 2026-07-28 and scheduled for removal; **elicitation is not on that
list.** Do not build a filesystem boundary on `roots`.

---

### 6 · Balcony flood — the row that mattered was row 137 — P4 × S4

**Why this is a safety mode and not a UX mode.** The founder watches 2–4 rows a day (session-2
decision). Every control above ends in an escalation, and an escalation that arrives in a feed of
200 is an escalation that did not arrive. This mode is how modes 2, 3, 4, 8 and 9 fail *silently*
after they have been correctly built.

**The structural property.** A refusal is a **distinct terminal value**, not a log line — the
pattern PR #115 already established for the gate, where *"a gate that reviewed nothing was
byte-indistinguishable from one that ran every reviewer and found defects."* The escalation
channel must be a different channel from the activity log, and rows are goal-sized rather than
event-sized.

**Mechanism:** typed `events.jsonl` already exists (`scripts/lib/events.js`) and
`mission-control/server/collectors/events.ts` already buckets by `event`. The missing piece is that
**an escalation must be a type the balcony cannot render as a row** — it must occupy a queue with a
count the founder sees before anything else. `hands.md` §3.3 names the zero-cost half of the voice
answer: `say` and `afplay` are installed, so a spoken escalation costs nothing and is offline.

**What cannot be closed.** If the founder is asleep, a `blocking-human` gate stops the work. That
is the correct trade and R3 says so. **Measure it rather than argue about it:** count human-gate
stops per night, and if it is high, change *what the loop attempts overnight* — never weaken the
gate.

---

### 7 · Prompt injection turns a grant into the attacker's grant — P3 × S5

Probability is 3 only because inbound does not exist yet (`hands.md` §3.2: *"Today: it cannot"*).
It becomes 5 the day an RSS poller, a Gmail label watcher, a `Monitor` on a `ws:` source or a web
page enters the loop, and every one of those is on the roadmap.

**The structural property, and it is the only one that survives.** `hands.md` §5.1 pattern 5:
**credential-scoped grants are the only pattern on the list that survives prompt injection**,
because the grant lives in the *token* rather than in the model's cooperation. A restricted Stripe
key, a fine-grained PAT, a read-only Linear endpoint — these hold when the model is fully
persuaded.

**The second structural property, available today at zero cost: separate the reader from the
sender.** An engine that reads the world holds no outbound tool at all. This is not a new idea
here — it is exactly `sourcer`: `tools: [Read, Glob, Grep, WebSearch, WebFetch]`, **no `Write`, no
`Edit`**, with one narrow MCP grant. **Refuse any pack that grants a world-reading tool and a
world-acting tool together.** The two capabilities in one context is the injection path; in two
contexts with a hash-bound artifact between them, the artifact is a review surface.

**Take the vendor's narrowing for free** (`hands.md` §5.1 pattern 4): Linear publishes a
`/readonly` endpoint beside its full one; Supabase groups tools with storage off by default;
Cloudflare ships 17 servers rather than one; Google's Ads MCP is read-only **by construction**
while Meta's writes. §2.3 makes that contrast the design lesson: *"the same category, two vendors,
and one of them narrowed the grant for you."*

**Accept and name:** no reasoning-layer control survives injection. Instructions in a prompt,
review lenses, and a persona told to be suspicious are all defeated by a sufficiently good
injection. Only the credential and the wrapper hold.

---

### 8 · Runaway spend on a metered hand — P3 × S5

**The gap is precise and `hands.md` §5.2B states it exactly:** every risk dimension this repo needs
is already in its vocabulary except one — **money, because it is the only one with a *rate*.**
*"'$X per day' cannot be expressed by any tier this repo has"*, and Meta Ads, RunPod pods and Lob
all need it. Anthropic Managed Agents' dollar-denominated session budgets are the only *enforced*
example found in the whole study.

**Meta Ads is the sharpest instance in the source material** (§2.3): read **and write** on a real
ad account, first-party and OAuth-gated, so *"an agent can create a campaign, set a budget, launch
creative made by `higgsfield`, read the result, and iterate — the whole loop, no human… it spends
real money at the agent's discretion, continuously, at 3am."* Meta ships a "Rules best practices"
page, which tells you the vendor expects this problem.

**The structural property.** `concepts.md` §7 R5: **absolute rate ceilings enforced at the wrapper,
independent of reasoning.** N outbound-public actions per hour, M per day, per project — not
advisory, not arguable. *"Every reasoning-based control can be reasoned around. A cap that binds
regardless of argument is the only control that survives a persuasive plan."*

**Mechanism:** count from the event log at the wrapper. `budget-guard.js` is the working precedent
for a ceiling with a safelist and a logged, reasoned override.

**The standing rule that makes this binary.** `STARTUP-OS.md` §4: *"If `budget:` is not enforced by
something that can stop a worker, the field is not written. Sixteen war-room routines once declared
budgets that nothing read."* So a pack's `budget:` field is a **`WISH` until a counter exists**, and
should not be written until then.

`higgsfield` exposing `balance` / `show_plans_and_credits` / `transactions` in-band is genuinely
useful — an agent can check its budget before spending — but **"can check" is not a mechanism.**
The mechanism is the wrapper refusing.

---

### 9 · The wrong human is contacted — P3 × S5

`concepts.md` §7 R6 states the case and I agree with it without reservation: *"The worst available
autonomous mistake is contacting a real person wrongly: the wrong person, the wrong tone, a
fabricated premise. It is unrecoverable in a way no code change is."*

**The structural property.** An approved-contacts register, checked by the outbound wrapper before
the send call, **fail-closed by construction: an unparseable recipient is not on the list.**
Deterministic string matching, no model in the loop. Adding someone is a founder act.

**The failure R6 names and the fix I would keep.** Replies. Answering an inbound message means
contacting someone never pre-approved. **Reply-in-thread is a distinct, narrower permission — never
a general send** — and first contact is the thing requiring approval.

**The rate limits are a design constraint, not a footnote** (`hands.md` §2.3): LinkedIn ~100 API
calls/day/member; Reddit 100 QPM, **1 post per 10 minutes for new accounts**, karma and age rules,
and $0.24/1,000 calls once commercial under a hand-reviewed contract. *"A 'post everywhere
continuously' design dies on these two; a 'post thoughtfully, rarely, per platform' design does
not."* The platforms have already decided this argument.

---

### 10 · Blocked and stalled are indistinguishable — P5 × S3

Territory gap #6. Severity is 3 because it is a **detection-latency amplifier**: it does not cause
the S=5 event, it delays the founder finding out about one.

**The structural property, and it is one sentence.** `concepts.md` §17 item 5: **blocked is
authored, stalled is computed.** A worker *writes* a blocker record naming what it needs; stalled
is a clock reading no durable artifact in N minutes. Two different sources — a file the agent
wrote, and a filesystem timestamp — so they are not confusable by construction.

**Mechanism:** the measurement half is already built. `budget-guard.js`'s stall ceiling is counted
*since the last durable artifact on disk* — a commit, a claim event, or a session file — and
**never the agent's own claim to be done** (`STARTUP-OS.md` §1b). That "never the agent's claim" is
the load-bearing clause and it is the same principle as A3.

Near-free, and it makes an entire class of confusion structurally impossible.

---

### 11 · `dangerouslyDisableSandbox` — **ACCEPT AND NAME** — P5 × S3

`SANDBOX.md` Finding 2 is unambiguous: when a Bash command fails on a sandbox restriction, Claude
Code may analyse the failure and retry with the sandbox disabled. **"The sandbox is therefore a
guardrail against accident, not a containment boundary against the agent itself. Do not describe
it as containment."**

Probability is 5 by measurement, not by theory: CLAUDE.md records that **every worktree created in
that session needed the escalation**, because Finding 3 establishes the agent-config paths *cannot*
be exempted — the vendor documents that an `allowWrite` entry does not lift the protection, and
`filesystem.disabled` is the only switch, which lifts everything.

**Nothing closes this.** It is a vendor escape hatch by design, and the design reason is sound:
exempting the agent-config paths would make the sandbox self-disabling on request.

**What can be bounded:** log every escalation as an event, so the *rate* is visible even though the
*capability* is not removable. And keep `failIfUnavailable: true` — verified live, and pinned by
`npm run test:sandbox` so a flip fails CI. A sandbox that silently falls back to unsandboxed is
worse than none.

---

### 12 · Bash is a general capability — **ACCEPT AND NAME** — P5 × S3

Measured in §0.7: `node -e` and `python3 -c` return exit 0 and reach the network and the filesystem
with no rule looking at them.

**Why this cannot be fixed by adding rules.** An enumerate-the-bad list can never be completed, and
this repository has already written that lesson down twice — `pre-tool-use.sh`'s own MCP comment
calls unlisted-is-denied the cure for *"the enumeration failure this file's own SSRF guard was
rewritten to stop repeating."* Adding a `node -e` rule buys `perl -e`, `ruby -e`, `bun -e`, a
heredoc into `sh`, and a script written to disk and executed.

**So do not fix it there.** The boundary that matters for a 24/7 company is **the credential and
the outbound wrapper**, not the shell rule. A shell that can do anything on a machine holding no
usable outbound credential is a bounded blast radius; a perfectly-ruled shell on a machine holding
a live ad-account token is not.

**What is worth fixing:** the `( npx … )` anchoring defect is narrow, real and cheap, and it is
also a **canary** — its existence is evidence about the class, and the one rule that fails to
survive a subshell when three others do is worth understanding before writing more rules of that
kind.

---

### 13 · It circles and burns the window — P5 × S2

The founder's own stated complaint: *"make sure we are not burning tokens or just doing circles."*

**Two structural properties, and both are already stated in the source material.**

- **The done-test is external and the producing model never resolves it.** `concepts.md` §15 A3:
  *"Refuse any done-test whose resolver is the producing model. The done-test must be
  deterministic, external, or human."* The local measurement — a design PASS/BLOCK judge at 0.543
  against a panel only 0.741 self-consistent — is why. `STARTUP-OS.md` §4 places the authorship
  correctly: **the agent proposes the done-test after researching the field, the founder approves
  it once, and then it binds.** Taste enters once.
- **The stall ceiling counts artifacts, not assertions.** As in mode 10.

**Status: BUILT and registered nowhere.** `budget-guard.js` exists, its measurement library runs
(§0.5), it applies a safelist so *landing work is never blocked*, it demands a written reason for
an override and logs it with the numbers, and **it announces its own fail-open rather than
pretending** — which is Rule 10 applied to itself. Registering it edits `.claude/settings.json`,
which is `irreversible` tier and denied to the write tools, so **it is a founder act and one of the
three not yet authorised.**

---

### 14 · The multi-family panel is structurally unresolvable — **ACCEPT** — P5 × S2

`irreversible` tier asks for 2-of-3 multi-judge and `risk: high` requires ≥2 distinct model
families. `hands.md` §0.3 measured why it fails, and the diagnosis is better than the four places
in CLAUDE.md that call it impossible: **both second-family runtimes are installed and both are
invisible to a sandboxed agent, for two different reasons.** `~/.gemini` is in `denyRead`, so
`gemini` dies reading its own config; `ollama` talks to loopback `127.0.0.1:11434` and the sandbox
denies loopback — *the identical mechanism that makes `check:mc` fail*. And the sting: both pulled
models are **retired** (`glm-5` 2026-07-15, `kimi-k2.5` 2026-07-31), which proves the request
reached the cloud and authenticated. A retirement notice is not an auth failure.

**So the real status is not "impossible" but "unwired, on a six-month-stale version pin nobody
watched"** — mode 1 again, in the capability layer.

**Rule 10 is already handling this correctly and honestly.** Three `verified_by: judge` claims with
empty panels resolve `unresolved` forever, and `unresolved` is not `pass`. `scripts/ledger.test.mjs`
pins that distinction for every resolver. The system is blocked and truthful, which is the right
failure direction.

**Accept, with the existing exit condition of 2026-11-17** — and note that the distance to closing
it is `ollama pull <current model>` plus one sandbox exemption, not a research programme.

---

### 15 · The founder's own quota is eaten — P4 × S2

Decision 8, "the rope". **The structural property that makes it work is that the measurement is
account-wide:** `windowUsage()` scanned **2,944 transcript files across the whole projects
directory** in my run, not this project's. A ceiling computed per project would let three ventures
each stay under their own limit and jointly consume the founder's window.

Same status as mode 13: built, verified by execution, registered nowhere.

---

### 16 · A stale worktree publishes correct-looking wrong facts — P4 × S2

`SANDBOX.md` Finding 4, and it has **already produced one wrong published fact**: a session cited
`schema-lint.js:1068` for the worktree lint predicate from a worktree measured **170 commits behind
`main`**, describing a layout that no longer existed. *"A stale worktree gives correct-looking
answers about a tree that has moved."*

**Partly mechanised already:** the dead-path check refuses a pinned line number, and CLAUDE.md's
operational rule is to name a symbol, heading or literal string rather than a line — a `grep`
survives a restructure and a line number does not. The remedy the vendor names,
`excludedCommands` for `git`, is correctly **not** applied: it exempts a command that can write
anywhere, a wider hole than the one it closes.

**The residue is a discipline, therefore a `WISH` unless mechanised.** The mechanisable half: a
check that fails when the working tree is more than N commits behind `main` and a measurement is
being published. I have not seen that built and do not claim it exists.

---

### 17 · Cross-venture contamination — P2 × S4

Several ventures at once under Decision 9, *global facts, project taste*. Two failure shapes: a
fact learned in venture A applied in B where it is false, and — worse — venture A's credential used
for a B action.

**The first is already governed.** `FIELDS/` is global **and expiry-bound through the claim
ledger**, with the same forced disposition: refresh, deprecate, or waive (`STARTUP-OS.md` §6). That
is the ledger finally doing a job worth doing.

**The second is not, and the vocabulary that fits is named in `hands.md` §5.2C:** *"grant = (worker
× hand × scope × budget × expiry), which is the same shape as this repo's claims — and claims
already have forced expiry, which is the hard part and it is built."* `settings.json` is per
machine; frontmatter is per role; **neither is per mission.**

**Macaroons** (§5.1 pattern 10, Birgisson et al., NDSS 2014) fit delegation down a spawn tree
better than anything else on that list — a credential any holder can **narrow but nobody can
widen**, so an orchestrator can hand a worker a copy attenuated to *"this ad account, ≤$50, 2
hours, this mission id"* without a central authority. It is also **the only pattern on the list
with no off-the-shelf product**, so it would be built. I would not build it first, and I would not
pretend a per-mission grant exists before it does.

---

### 18 · A physical or legal act — P1 today × S5

Sign (DocuSign), post a letter (Lob, $0.77/postcard), register a domain (Cloudflare Registrar),
place a call (Twilio, ElevenLabs). None connected today, which is the only reason P is 1.

**`hands.md` §3.6 states the test better than I would:** every one of these is *"irreversible by
physics, not by policy… A tiering scheme that cannot distinguish 'run the test suite' from 'post a
letter' is not a tiering scheme."*

**The structural property, and this is the class where accepting is not an option.**
`concepts.md` §7 R3 / GSD's two-tier gates: `blocking-human` **by type, not by policy**. Anything
with `blast_radius: stranger|public` or `reversible: no` is a `human` gate *because of what it is*,
so no configuration, mode or reasoning chain can clear it.

**The mechanism is built and unused.** `.claude/gates.yml` declares four gates — one `kind:
command` and three `kind: human` — and `scripts/check-gates.mjs` resolves them; `gates.test.mjs` is
a blocking assertion in `npm run test:playbooks`. **A `human` gate has no `run:` and writing one is
refused.** A `command` gate treats any exit other than 0 or 1 as `unresolved`, never as pass.

**Its consumer count is zero.** `outbound-approval` is named by exactly one playbook stage —
`launch-landing-page.yml:40` — which carries **no `dispatch:` block**, and by
`schema-lint.js`'s allowlist. Mode 1, again, on the single most important gate in the design.

**Read `gate: qa-verdict` correctly while you are here.** `gates.yml` warns at length that a
command gate **verifies and does not produce**: it asks whether a PASS is committed and sha256-bound
to this exact diff, a file lookup and a hash compare. It does not run the panel, and **nothing in
`gates.yml` can**. A stage naming it asserts the third step of *session runs the panel → session
records the verdict → anyone checks the binding*.

---

### 19 · A verdict is forged — **ACCEPT AND NAME** — P1 × S4

`qa-lead-pass.yml` documents the bound honestly: a verdict record is **hash-bound, not signed**, so
anyone with repo-write can author a `.qa/verdicts/*.json`. **Hash-binding stops an *inherited*
verdict, not a *forged* one.**

Related and worth naming in the same breath: `mcp-policy.json`'s own `_deleting_this_file` note —
deleting the file turns the mechanism off, *"which is exactly the behaviour before this policy
existed. That is a stated limit, not a hidden one."* Both are ordinary files inside a project root
the agent can write.

**Accept on a single-operator machine**, and re-open the moment a second human or a shared runner
exists. Signing is the answer and it is not free.

---

## 4 · What must be accepted and named, in one place

Rule 10's discipline applied to my own lane: these do not get a mechanism, and a design that
implies they do is worse than one that admits they do not.

1. **The sandbox is a guardrail against accident, not containment.** `dangerouslyDisableSandbox`
   is a vendor escape hatch and the agent-config paths cannot be exempted by any setting.
   (`SANDBOX.md` Findings 2 and 3.)
2. **Bash is a general capability.** `node -e` and `python3 -c` are measured to pass. Enumerating
   the bad cannot be completed; move the boundary to the credential.
3. **No reasoning-layer control survives prompt injection.** Only credential scoping and a wrapper
   hold. (`hands.md` §5.1 pattern 5.)
4. **A verdict is hash-bound, not signed.** Forgery is available to anyone with repo-write.
5. **The panel is single-family until a second family is reachable.** Rule 10 keeps it honest by
   returning `unresolved`; the exit condition is 2026-11-17.
6. **A policy file is an ordinary file.** Deleting `mcp-policy.json` disarms it.
7. **A `blocking-human` gate stops overnight work when the founder is asleep.** That is the correct
   trade. Measure the stop count; change what the loop attempts, never the gate.
8. **The founder is a single point of failure for every human gate**, and watches 2–4 rows a day.
   Escalation design is therefore a safety mechanism, not an interface preference.

---

## 5 · Build order — what is forced, not preferred

**0. The birth certificate — nothing merges without a caller in the same diff.**
Forced first because it changes the survival rate of every item after it, and the measured base
rate of building the alternative is high. It is a CI step in `check-suite.js`.

**1. Register `budget-guard.js`.**
Forced second because it is the only stop that exists, it is already built and verified by
execution, and every mitigation below runs inside a window nothing currently bounds. It is a
founder act (`.claude/settings.json`, `irreversible`), and it is one of the three permissions not
yet authorised.

**2. `reach` on the classifier, declared on the grant.**
Forced third because until it exists every outbound grant classifies `lite`/`shadow` — measured —
so every gate, tier and review downstream is computing the wrong answer confidently.

**3. The outbound wrapper: dry-run default · hash-bound send · named-human register · rate ceiling.**
One artifact, because the four are the same code path and splitting them ships three of four and a
gap. Forced fourth because it is what `blocking-human` gates *attach to*.

**4. The kill file and the supervisor.**
`launchd` + `WatchPaths` + `claude -p --allowedTools`. Forced before any unattended run, because a
loop you cannot stop is not a loop you may start.

**5. Inbound — last, and deliberately.**
RSS, Gmail polling, `Monitor` on `ws:`. **Do not build inbound before the wrapper exists.** Inbound
plus outbound with nothing between them is injection-to-irreversible-action in one hop, and that
ordering is the single most consequential sequencing decision in my lane.

---

## 6 · What I refuse

- **A second implementation of risk classification.** Extend `classifier.js`; never parallel it.
  (`concepts.md` §15 A5; `classify.mjs`'s own header; it has already happened here once.)
- **A done-test resolved by the producing model.** (A3; 0.543 vs 0.741 self-consistency.)
- **A `budget:` field nothing counts.** (`STARTUP-OS.md` §4; sixteen war-room routines.)
- **A pack granting a world-reading tool and a world-acting tool together.** That pairing is the
  injection path.
- **`ask:` rules as the primary 3am control.** An unanswered `ask` fails closed, which is fine, but
  it converts every autonomous run into a stall. `blocking-human` by type is the right primitive;
  `ask` is a machine-wide backstop.
- **Widening `pre-tool-use.sh` to govern the founder's own user-scope servers.** Wrong layer, and
  the inverted resolution of the #96.3 template. Narrow at the grant; backstop at the vendor's
  deny globs.
- **Describing the sandbox as containment.**
- **`CronCreate` as the 24/7 scheduler.** Its own schema forbids it.
- **Averaging panel scores, and weights on voices.** (A1, A2 — carried, not re-argued.)

---

## 7 · Open questions I could not settle

1. **Do `permissions.deny` rules bind inside a dispatched subagent?** The frontmatter grant is
   measured to bind across `Agent` dispatch (`c-mcp-grant-binds-through-agent-dispatch`); the
   settings-layer deny is not, and my whole "vendor-enforced backstop" position rests on it.
   **Probe:** add a deny for one harmless MCP tool, dispatch an engine that would otherwise hold
   it, record the result as a claim. Until then this is `unresolved`, not `pass`.
2. **How is `higgsfield` narrowed at all?** One server, 84 tools, spanning benign and `S=5`.
   Frontmatter grants are per server. Extending `mcp-policy.json`'s scope rule to credentialed
   user-scope servers is the cleanest answer available and it contradicts that file's stated
   design principle. This needs a decision, not a preference.
3. **What is the founder's actual risk appetite for money?** Every rate ceiling needs a number and
   I will not invent one. It is the only axis with a rate and the only one where the mechanism is
   trivial once the number exists.
4. **Which dispatch path gave me the full user-scope tool roster (§0.3)?** Teammate launch versus
   `Agent(subagent_type:)` may differ, and the answer determines whether the frontmatter grant is a
   real boundary or one path's boundary.
5. **Is there a check that fails a published measurement taken from a stale worktree?** Mode 16's
   residue. I did not find one and did not look exhaustively.

---

## 8 · The strongest argument against my own thesis

**Every control I propose is a stopping mechanism, and the founder's stated complaint is that
almost everything built here is a stopping mechanism rather than a producing one.**

`00-TERRITORY.md` puts it in the founder's terms: the system *"loses creativity to playbooks"*, and
the census's central illustration is a design capability that existed, was never invoked, and cost
a design round — **a wiring failure, not a safety failure.** Read my table against that and the
risk is plain: a reach axis, a human gate, a dry-run wrapper, a contact register and a rate ceiling
compose into a machine that is safe because it does nothing at 3am. `hands.md` §5.1 pattern 8
concedes the same point in R3's own "fails when": *"Overnight work stops constantly at human gates
and the loop's autonomy is theatre."*

There is a sharper version still. My own mode 1 says the base rate of a control being wired is
poor. If that is true, then five new controls mostly produce **five new unwired mechanisms and a
false sense of safety** — which is strictly worse than none, because the founder will believe the
system is bounded when it is not. On my own evidence, that is the likeliest outcome of adopting my
list wholesale.

**What I would concede to it, and what I would not.** I would concede scope: build **three**
controls, not thirteen — the reach axis, the outbound wrapper, and `blocking-human` by type — and
accept a measurably slower night. I would concede that the human-gate stop count must be measured
from day one, and that a high count is a signal to change what the loop attempts overnight rather
than to add a fourth control.

I would not concede the ordering. The counter-argument attacks *volume*, and my answer to it is
volume. It does not touch the sequence, and the sequence is where the irreversible mistakes live:
**inbound before the outbound wrapper is injection-to-action in one hop, and that is true whether
you build three controls or thirty.**
