## 10 · Codex and Claude Code, from day one

*obeys: v5, v11, v12, v32 (SPINE §H entire), **v56** (the cloud lane, 10.2a), and **v67, v78** (the rethink round of
2026-09-06, carried in 10.8); inherits: FINAL §1 row 30 as the losing image, §16.7, §14.6*

**(FOUNDER, overruling FINAL §1 row 30.)** *"I run from day one of the system to include codex and Claude code in
the system. So we will need to understand how we are doing it. If you're walking straight from codex, or straight
from Claude Claude. or we will find a solution to all of this."* And: *"I think we need to work with loops and goals
and they features the codex and Claude Code has in order to achieve the best results we can."*

FINAL's *"Codex admitted only after a headless rehearsal passes"* is the losing image and is kept by name in
section 22. **What survives from it is the rehearsal itself** — it stops being the admission gate for Codex's
existence in the system, and becomes the gate on **how wide** Codex's position is.

---

### 10.1 The four options, and the one chosen

**(NEW: each option is judged against a measured defect rather than a preference.)**

| Option | Verdict | Why |
|---|---|---|
| **Claude Code drives Codex from Bash** | **rejected as the primary shape** | it is exactly the shape openai/codex#19945 breaks — no controlling TTY plus a non-trivial prompt — and the `script -qfc` cure is, in the reporter's own words, *"incompatible with normal background / parallel job execution"*, which is what a crew is |
| **Codex drives Claude** | **rejected** | no documented mechanism in either direction, and Codex is not installed. The receiving surface is documented; the pairing is not |
| **A third program drives both** | **CHOSEN** | each vendor documents a headless invocation, a session id, resume, an instructions file, a SKILL.md bundle and MCP. A provider outage or a defect becomes a **routing change, not a rewrite**. It is also the only shape that keeps v34 true — **one thing composes argv** |
| **Hybrid** | **folded in** | the Floor is interactive Claude Code and always was; the founder may run Codex by hand there. That is the hybrid, and it needs no mechanism |

**(NEW: the chosen shape is a consequence of v34, not a taste.)** If two things compose argv, two things define what
a run may touch, and the guarantee that a checker cannot edit what it judges becomes an agreement between them. One
launcher is what makes the grant checkable by a probe.

**(FINAL §14.6, and it is the constraint the launcher exists to absorb.)** *"the capability layer is close to
neutral and the policy layer is not. The shapes are portable; the guarantees are not."* Every runtime has a headless
invocation, a session id, an instructions file, a SKILL.md bundle, MCP, a working directory as the confinement unit
and a git worktree as the isolation unit. **Only the policy tier differs**: Anthropic's managed settings outrank
argv; **OpenAI's `requirements.toml` outranks every flag** (FINAL §14.6, not re-read this session); Google has a Policy Engine (FINAL §14.6, providers lane 2026-09-04).

```mermaid
flowchart TD
    OP["The Operator emits a brief with an intent id.<br/>It never composes argv"] --> RUN["bin/run — the only thing that composes argv.<br/>It holds no model · ABSENT"]
    RUN --> PICK{"Which provider does this<br/>move's position name? (10.5)"}
    PICK -->|"builder, architect, tester, designer,<br/>product, writer, growth, steward, curator,<br/>reviewer, guard, challenger, analyst — and the Floor"| CC["claude --session-id UUID<br/>--restricted --tools LIST --strict-mcp-config<br/>--permission-mode dontAsk --max-budget-usd N<br/>-p '/goal &lt;done-test&gt; or stop after N turns'"]
    PICK -->|"a checker on a prepared diff"| CX["codex exec --json<br/>FOREGROUND, stdout redirected to a file,<br/>inheriting the parent shell's TTY"]
    PICK -->|"routine scouting and the summarising half"| GM["gemini -p --approval-mode plan<br/>installed 0.38.2, NEVER AUTHENTICATED"]
    CC --> LOG["ONE LOGBOOK: the event log.<br/>gen_ai.* attributes, the intent id on every row"]
    CX --> LOG
    GM --> LOG
    LOG --> MC["Mission control reads it.<br/>No second source of truth"]
    CC -.->|"managed settings outrank argv"| MS["Managed settings file: permissions.deny,<br/>disableBypassPermissionsMode, disableAutoMode —<br/>and NOT the two hook settings (10.4)"]
    CX -.->|"requirements.toml outranks every flag"| RQ["requirements.toml — Codex's equivalent tier"]
    RUN -.->|"asserted nightly"| PROBE["bin/probe — what a run can<br/>ACTUALLY touch · ABSENT"]
```

---

### 10.2 Codex's position on day one, and the test that widens it

**(FOUNDER: day one. NEW: the position is narrow because a measured defect makes it narrow, not because Codex is
distrusted.)**

**Day one: `codex exec` as a checker on a prepared diff**, run in the **foreground with stdout redirected to a file
while inheriting the parent shell's TTY** — the second documented workaround, which does not need `script -qfc`.

**The cost, stated once and not re-litigated: one foreground slot is not parallel, so Codex is not a night lane
yet.** That is the whole price of admitting it on day one, and it buys a second model family on the one move where
family independence pays for itself.

**(NEW, from research/cloud.md part 5 item 2: that cost governs the LOCAL `codex exec`, and it does not reach a cloud
task.)** #19945 is a defect of local `codex exec` with stdio detached from a TTY, so it cannot apply to work running
in OpenAI's hosted sandbox. Whether a *local dispatcher* hits it while minting a cloud task depends on whether
`codex cloud exec` shares the local exec code path, and that is **UNKNOWN**. The hosted lane is 10.2a, and it is a
different lane with a different position.

**openai/codex#19945, read 2026-09-05:** *"codex exec silently crashes with no output when stdio is detached from
TTY (0.124.0+)"*, opened 2026-04-28, labels `CLI`, `bug`, `exec`. **Open 130 days with no comments and no
maintainer reply.** Mechanism: *"the process produces no error, no panic message, no log entry — just an empty
result."* Piping through `tee` or `tail` in a detached process group does **not** resolve it. **A silent empty
result is the worst failure shape there is** — a smoke test passes and the real workload returns nothing, which is
why the rehearsal must be headless or it proves nothing.

**The admission test that widens the position** — and it is specifiable from primary text now, which it was not when
FINAL was written:

| Condition | Value |
|---|---|
| Command | `codex exec --json` |
| TTY | **no controlling TTY** |
| Prompt | **non-trivial** — a smoke prompt does not exercise the defect |
| Version | ~~**≥ 0.124.0**~~ **the installed version, recorded** (moved 2026-09-06: W19 — Codex is at 0.153.4, so the old floor is satisfied by anything installed and discriminates nothing; §10.8) |
| Judged against | known-answer cases |

**Pass** and Codex becomes a night checker and a maker on mid-to-hard work. **Fail** and it stays in the foreground
slot. **The test is the plan, not the issue closing** — 130 days of silence is not a schedule.

**(NEW: this test is R10, and R10 is the hinge of the whole cross-model design.)** The table above is not one
open question among several — **v5, v32, v78, v82 and §I row 15 all read differently depending on its answer.**
Pass and rung 2 becomes parallel and a second family is a lane; fail and the second family is one foreground slot
forever, at 1/N availability. **(R26, OPEN)** is the cheap route to it *(mark added 2026-09-06 · challenge C
P3-2 — the hinge's cheapest route was the one open question carried nowhere as open)*: reading the unread Codex
June–August window would settle whether #19945 was fixed without installing anything. Both are stated in full at 10.8.

**(NEW: the prerequisite is a founder act.)** Codex is **not installed** on this machine. Installing it and running
the rehearsal is section 20 row 5.

---

### 10.2a The cloud lane — Codex off the Mac

**(FOUNDER, one answer of the interview of 2026-09-05, DECISIONS §15.)** *"When my Mac is not on, and then we need
to use not the regular Claude code or codex in terminal, then you can use codex or Gemini I think they don't bun
those. But still keep it open"* — clarified in the next round as **"Yes — a cloud lane for when the Mac is off"**, with
research on **Codex cloud tasks** and nothing else. That is v56, and it gives FINAL's *everything runs on the Mac* its
one stated exception (§15.1a).

**(NEW: what the lane found, and the position it supports is narrower than the founder's sentence.)** Every fact below
is from `research/cloud.md`, all URLs accessed 2026-09-05, with the confidence that lane marked — `H` documented and
quoted, `M` weaker, `L` inference. Nothing here was run.

**What a cloud task is.** Hosted, off this machine, and bound to a saved **environment** rather than to a command.
*"Run tasks in isolated cloud environments."* — and that sentence is the entire vendor claim about the runtime:
**no container or sandbox technology is named on the page**, which is itself the finding.
<https://learn.chatgpt.com/docs/cloud> · H on the quote. Repository access is chosen once, per environment —
*"Connect GitHub or GitLab"*, and for GitHub you *"choose the repositories Codex can access"* · H. So is setup:
*"Configure any dependencies, tools, environment variables, or secrets the task needs."* · H — dependencies and
secrets are environment configuration, never per-task arguments. **How long one may run is documented nowhere the
lane reached — UNKNOWN**; the page distinguishes *"longer tasks"* as receiving *"dedicated environments"* and states
no maximum. What it produces is a summary and a diff, with the pull request an optional next step rather than the
default artifact: *"Review the summary and diff. Ask Codex to make follow-up changes, or open a pull request."* · H.
Newer pages call these *"cloud chats"* · M.

**The key negative finding, and it is what fixes the position.** **No OpenAI page the lane reached documents an HTTP
endpoint for creating a cloud task, and none prints a non-interactive CLI invocation for one.** The vendor CLI
reference describes the entry point as a browser: `codex cloud` lets you *"Browse active and completed chats, submit
work to a configured environment, and apply the result to your local repository from the terminal."*
<https://learn.chatgpt.com/docs/codex/cli> · H on the quote, H on the absence across the six pages fetched. A
non-interactive form does appear — `codex cloud exec --env ENV_ID "..."`, with `list --env ENV_ID --json`, `status`,
`diff` and `apply` — but **only inside an open feature request**: openai/codex#24777, created 2026-05-27, labels `CLI`
and `enhancement`, whose own complaint is this problem exactly, that automation *"currently has to open the
interactive `codex cloud` TUI or web UI, find an environment manually, copy an opaque ID, and paste it into
scripts."* <https://github.com/openai/codex/issues/24777> · **M, not H** — the author is not a confirmed maintainer,
no maintainer has replied, and the command list is their assertion about the binary rather than documentation.

**The one human-free path carrying vendor documentation is the pull-request trigger.** Manual: *"In a pull request
comment, mention `@codex review`. Wait for Codex to react (👀) and post a review."* Automatic, enabled in settings:
*"Codex will post a review whenever someone opens a new PR for review, without needing an `@codex review` comment"*,
which needs *"GitHub push or admin permission for its settings."* <https://learn.chatgpt.com/docs/third-party/github>
· H. **No label trigger is documented** — the lane looked and found none. Slack is the second documented trigger:
*"Mention `@Codex` and include your prompt."* <https://learn.chatgpt.com/docs/third-party/slack> · H. And one thing
that looks like this lane and is not: `openai/codex-action@v1` *"installs the Codex CLI, starts the Responses API
proxy when you provide an API key, and runs `codex exec`"* — that is CI compute on a GitHub runner against an API
key, **not OpenAI's hosted sandbox** · H. The distinction matters because the two are billed and governed
differently.

**Plans, quota and network.** Cloud chats are **not on Free or Go**, and the narrowest quote is the one to hold:
*"You need a Plus, Pro, Business, Enterprise, or Edu plan...a connected GitHub account, and at least one
environment."* <https://learn.chatgpt.com/docs/third-party/slack> · H. **No numeric cloud quota is published
anywhere.** The single sentence bearing on it is qualitative: *"Cloud chats on ChatGPT plans use GPT-5.6 Sol and may
use more of your allowance than local messages."* <https://learn.chatgpt.com/docs/pricing> · M. The numbers that page
does publish are per five-hour window for **local** messages and do not govern this lane. Network is the sharp fact,
and it is a default rather than a setting someone chose: *"By default, Codex blocks internet access during the agent
phase."* <https://learn.chatgpt.com/docs/cloud/internet-access> · H — with three allowlist presets (None · Common
dependencies · *"All (unrestricted)"*), set per environment, and an option to *"restrict network requests to `GET`,
`HEAD`, and `OPTIONS`"* · H. The same page names the vendor's own threat model, quoted because it reads as one:
*"Prompt injection from untrusted web content"*, *"Code or secret exfiltration"*, *"Downloading malware or vulnerable
dependencies"*, *"Pulling in content with license restrictions"* · H.

**Resume, cancel and poll — where the shape of the evidence matters more than the list.** Three read operations appear
in the same issue — `codex cloud status TASK_ID`, `codex cloud diff TASK_ID`, and `codex cloud list --env ENV_ID
--json`, whose `--json` is the flag a driver would need — so polling **appears** possible · M. `codex cloud apply
TASK_ID` is how a result would reach this Mac · M, corroborated without the command by the CLI page's *"apply the
result to your local repository from the terminal"* · H. **Blocking wait, log streaming, follow-up messaging and
structured output are absent**: they are what #24777 asks for, and a feature request is the firmer half of that
source · M to H. **Cancel is UNKNOWN** — no cancel command appears in either the existing list or the requested one,
and no vendor page mentions cancelling a cloud task. And `codex exec resume` is **not applicable until shown
otherwise**: that page is about local non-interactive sessions, the two surfaces use `SESSION_ID` and `TASK_ID`
throughout, and nothing connects them · M on the negative.

**The terms, and the refusal is the finding.** Every OpenAI policy URL refused the fetch —
`openai.com/policies/row-terms-of-use`, `.../eu-terms-of-use/` and `.../business-terms/`, all **HTTP 403**, which with
the prior lane's 403 on `.../terms-of-use` is **four refusals against one host across two dates**. The lane stopped at
three by its own rule and returned the gap rather than substituting a remembered clause. **The OpenAI half of §I row 1
is therefore UNKNOWN, and unread is not permissive.** What can be said factually is only this: OpenAI documents and
ships automation surfaces that run on a subscription rather than a key — the Slack app, the `@codex` mention, and
automatic review on PR open — and separately documents an API-key path billed at API pricing. **Documented product
behaviour is not a terms clause**, and reading it as one is exactly the substitution the lane refused · L on any
inference, H only on the fact that the features are documented. Anthropic's clause is already on file from the
runtimes lane and was not re-fetched: access *"through automated or non-human means"* is prohibited except via an API
key or *"where we otherwise explicitly permit it."*

**v56's position, stated once and not re-argued.**

| The lane | Verdict | Why |
|---|---|---|
| **Codex cloud as a PR reviewer** | **admitted** | `@codex review` is vendor-documented, needs no local Codex, and runs in OpenAI's sandbox — so it **sidesteps #19945 entirely**, that defect being local `codex exec` with stdio detached from a TTY |
| **Codex cloud as a maker** | **UNVERIFIED** | the only non-interactive creation path is issue-only (#24777, M). A night maker cannot rest on an unconfirmed assertion about a binary that is **not installed on this Mac** |
| **Which hosted lane may MAKE** | **the founder's — §I row 15, raised by v56 and open** | Anthropic's is the only fully documented driver today and costs no extra compute; it is also the **same seat as the Floor and the same terms clause as §I row 1**. Codex cloud is the founder's named preference and has no driver yet. Jules is a third family, and its API says of itself *"The Jules API is in an alpha release, which means it is experimental"* |

**The mechanism, orchestrator's and reopenable — and every part of it is ABSENT.**

| Rule | Mechanism | State |
|---|---|---|
| A hosted run never writes into the house directly | its output lands as a **pull request or a staged artifact**, which the Mac reconciles **on wake** | **ABSENT** |
| Minting a cloud task is not a run | `bin/run` gains a `cloud` carrier that **mints a task and records its id, and does nothing else** | **ABSENT** |
| A night's cloud work is read, not trusted | the Watch reads the pull requests on wake | **ABSENT** |

**(NEW: the cost, stated once and not re-litigated.)** The lane the founder named has **no documented driver today**,
and the lanes that do have one run on the Claude seat whose terms clause is the open question. Both halves of that
sentence are why §I row 15 exists rather than a decision. The losing image is kept by name in section 22: *the Mac as
the only runtime; Routines refused wholesale; Codex cloud as a full night maker on issue-only evidence* (§J.45).

---

### 10.3 Where `/goal` and `/loop` sit

**(NEW: `/goal` is the feature the founder's phrase points at, and it was absent from FINAL entirely.)**

**`/goal` sits on the run, and the done-test is the goal condition.** *"The `/goal` command sets a completion
condition and Claude keeps working toward it without you prompting each step. After each turn, a small fast model
checks whether the condition holds."* Three verdicts: **Not yet met · Met · Impossible**.

| Property | Value, quoted |
|---|---|
| Headless | *"Setting a goal with `-p` runs the loop to completion in a single invocation"* |
| Streaming | *"Add `--output-format stream-json --verbose` to emit each message as the loop runs"* |
| Condition limit | **4,000 characters** |
| Bounding it | *"include a turn or time clause in the condition, such as `or stop after 20 turns`"* |
| Terminates on | Met · Impossible · `/goal clear` · four unrecoverable errors (auth failure, exhausted credit balance, unclearable context overflow, unavailable model) |
| Survives | *"After any other failure, including transient errors such as rate limits and overloaded servers, Claude Code leaves the goal active"* |
| Deferral | evaluation is skipped while a subagent or background shell is running |
| Check-ins | *"In a non-interactive session, such as one started with `-p`, this is the only way Claude Code delivers check-ins"* |
| Evaluator | Haiku by default; `ANTHROPIC_DEFAULT_HAIKU_MODEL` changes it **everywhere the small fast model is used** |

**(NEW: leaving a goal active through a rate limit is exactly the behaviour a night wants**, and it is the reason
`/goal` and not a shell loop is the run-level primitive: a shell loop that re-invokes on a rate limit burns the
window it is waiting for.)

**`/loop` is refused in production and stays a Floor convenience.** *"Tasks are session-scoped: they live in the
current conversation and stop when you start a new one"*, with a **7-day expiry** and the hard limit *"Tasks only
fire while Claude Code is running and idle."* **A tier that requires a session already open cannot be the
always-on tier. The Watch is the loop.** The vendor's own three scheduling tiers make the trade explicit:

| Tier | Needs | Minimum interval | Local files |
|---|---|---|---|
| Cloud Routines | no machine, no open session | **1 hour** | **no** — a fresh clone |
| Desktop scheduled tasks | the machine on, no open session | 1 minute | yes |
| `/loop` | the machine on **and** a session open | 1 minute | yes; inherits the session's MCP servers and permission mode |

**(FINAL §16.7, standing.)** Routines stay **refused for the Watch** — cloud-only, cannot reach local files.

**Codex `/goal` is not used, and it is a gap line rather than a description** (SYNTHESIS §7 deletion 28, applied
2026-09-06). ~~Four sentences on its states, its two tracker items and its unestablished headless behaviour~~ — a
feature described at length reads as one relied upon, and this one is `C`-confidence off two 308-redirected sources
and is used by no row. **It survives as gap 1 of 10.6.**

---

### 10.4 The managed-settings collision, resolved

**(NEW: two design choices land in one file, and one of them silently kills the other.)** The managed settings file
is the tier a running process cannot clear — it is what makes the grant real rather than advisory. But **`/goal` is
a session-scoped prompt-based Stop hook**, and it is *"unavailable when `disableAllHooks` is `true` after settings
precedence applies, or when `allowManagedHooksOnly` is set in managed settings."* Locking hooks in the managed file
therefore removes the goal loop the founder asked for.

**Resolved, once, and repeated here because this is where a reader trips:**

| The managed file carries | The managed file does NOT carry |
|---|---|
| `permissions.deny` | `disableAllHooks` |
| `permissions.disableBypassPermissionsMode: "disable"` | `allowManagedHooksOnly` |
| `disableAutoMode` | — |

**The cost, stated once: a run can therefore register its own Stop hook.** That is a smaller hole than losing the
goal loop, and **the nightly probe is what keeps it a known hole rather than an unknown one**. Narrowing is carried
by `--restricted` plus an explicit `--tools` list, **which does not touch hooks** — so the narrowing and the goal
loop stop competing for the same file.

**(NEW: two facts make the permission bands binding rather than descriptive.)** Deny rules bind in **every** mode
including `bypassPermissions`, and a subagent's own `permissionMode` frontmatter **is ignored**, so a child cannot
widen its own grant. `auto` mode's classifier is a cheap guardrail against accident and **is not the envelope** —
it can be switched off, and nothing in it keys on reversibility.

---

### 10.5 What each runtime is documented to offer

**(NEW, from the runtimes research of 2026-09-05. `D` = documented and quoted; `C` = claimed, third-party. Nothing
in that lane was measured — no runtime was run.)**

| | Claude Code | Codex CLI |
|---|---|---|
| Installed here | **M** yes, 2.1.261 | **M** no |
| Headless | `-p`, text / json / stream-json | `codex exec`; *"streams progress to `stderr` and prints only the final agent message to `stdout`"*; `--json` emits `thread.started`, `turn.started`, `turn.completed`, `turn.failed`, `item.*` |
| Structured out | `--output-format`, `--output-schema` on the goal loop | `--output-schema`, `-o` / `--output-last-message` |
| Session and resume | `--session-id` *"must be a valid UUID"*; `--continue` | `codex exec resume --last` or `<SESSION_ID>` |
| Narrowing by argv | `--restricted` (v2.1.248+) *"removes the built-in tools that run commands or code, and WebFetch, unless you name them individually in `--tools`"*; `--strict-mcp-config`. **`--allowedTools` restricts nothing** | `--sandbox`, `--ignore-user-config`, `--ignore-rules`, `--skip-git-repo-check`, `--ephemeral`. **No per-tool flag.** `--full-auto` is **deprecated** — *"use `--sandbox workspace-write` instead"* |
| Sandbox axes | Seatbelt / bubblewrap, **Bash only**, filesystem and network layers | Seatbelt / Landlock; `approval_policy` × `sandbox_mode` — three modes, **network off by default** (FINAL §14.6, providers lane 2026-09-04) |
| Policy tier | **34 hook events, 10 documented as blocking** (`D`, medium — the fetch merged two lists, §15.6); managed settings outrank argv | **`requirements.toml` outranks every flag** (FINAL §14.6, providers lane 2026-09-04, not re-read this session) |
| Hooks, sharp edge | **PermissionRequest is non-blocking** — *"Exit code 2 isn't honored for this event and the permission flow proceeds unchanged. Deny through the `decision` object instead"* | hooks behind `codex_hooks = true` |
| Subagents | depth **3** default, **20** concurrent, *"Concurrent subagent limit reached"* on overflow. **`Workflow` is removed from all of them** — *"via the first filter applied to subagent tool sets"* | TOML files with their own sandbox mode |
| Teams | agent teams: a lead plus named teammates, each a full session. **Experimental, off by default; no nested teams; one team per session; `/resume` does not restore them; `-p` never forms a team.** *"approximately 7x more tokens … when teammates run in plan mode"* | none documented |
| Fleet view | `claude agents --json` prints active background sessions for scripting; *"Opening agent view requires an interactive terminal"* | none documented |
| Channels | *"A channel is an MCP server that pushes events into your running Claude Code session."* Research preview. Gated twice: *"Being in `.mcp.json` isn't enough … a server also has to be named in `--channels`"*. Anthropic auth only | none documented |
| Scheduling | three tiers (10.3), plus `ScheduleWakeup` and `Monitor` | *"Automations"*, or a shell loop around `codex exec` (`C`) |
| Goals | `/goal`, `D`, **headless-capable** | `/goal` 0.128+, `C`, **headless status unknown** |
| Per-run spend | `--max-budget-usd`; subagent spend counts toward it | included in every ChatGPT plan (FINAL §14.6, providers lane 2026-09-04) |
| Shared config | `CLAUDE.md`, `SKILL.md`, `.mcp.json`; imports Codex and Gemini config | `AGENTS.md`, `SKILL.md`, `config.toml`, `mcp_servers` |
| **Cloud lane** *(NEW, cloud.md parts 2 and 5 — the row this table did not have)* | **documented argv, not a UI.** `claude --cloud "<task>"`, where *"each session runs in an isolated, Anthropic-managed VM"* and *"The cloud VM clones your current directory's GitHub remote at your current branch, not your local checkout"*; follow up from any machine with `claude -p "your message" --cloud <session-id>`; pull the session back with `claude --teleport <session-id>`. **Routines add the thing Codex lacks, a fire endpoint**: `POST https://api.anthropic.com/v1/claude_code/routines/trig_.../fire`. Quota *"shares rate limits with all other Claude and Claude Code usage within your account"* | **a TUI, plus two chat triggers.** `codex cloud` is *"Browse active and completed chats, submit work to a configured environment, and apply the result to your local repository from the terminal"*; the human-free triggers are `@codex review` on a pull request and `@Codex` in Slack. **No endpoint and no printed non-interactive command** — `codex cloud exec` appears only in open issue #24777 (M). Internet off by default *"during the agent phase"*; Plus and above only |
| Second checker family | **no** — it cannot check itself | **yes, and narrower than "blocked" (cloud.md part 5 item 3).** The `@codex review` route needs no local Codex, so #19945 cannot reach it — it is admitted today (10.2a). What 10.2's test widens is the **local** foreground checker |

**(NEW: one trap worth naming, because it collides with a setting this repository plausibly wants.)** `Monitor` —
*"Runs a command in the background and feeds each output line back to Claude … Can also open a WebSocket and treat
each incoming message as an event"* — is *"not available when `DISABLE_TELEMETRY` or
`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set."* A privacy setting silently removes a capability.

**(FINAL §16.7, re-decided against the roster.)** Which provider may stand which position:

| Provider | Which of the fifteen may run on it | Window | State today |
|---|---|---|---|
| **Claude Code** (subscription) | all fifteen, **and the Floor, always** | rolling five-hour **and weekly**, per seat, shared with Claude chat and Cowork | installed 2.1.261, measured |
| **Codex CLI** (subscription) | **`reviewer` and `guard` only, on a prepared diff, in the foreground.** Widens to `builder` on mid-to-hard work if 10.2's test passes | its own 5-hour window; the only one publishing numeric quotas | **not installed**; #19945 open |
| **Gemini CLI** (subscription) | **`scout`**, and the summarising half of `curator` | 60 rpm / 1,000 rpd free on a personal account | installed 0.38.2, **never authenticated** |
| **Local models** | no agent — moves, not positions: embeddings, classification, dedup, PII detection | electricity | **ABSENT** |
| **Routines** (cloud) | **refused for the Watch** — it cannot reach anything this system stores on the Mac. **Read *no local files* narrowly (cloud.md part 5 item 5):** it is right about the laptop and wrong if read as *no repository* — a routine clones every selected repo per run and pushes `claude/`-prefixed branches | **1-hour minimum, now confirmed verbatim**: *"The minimum interval is one hour; expressions that run more frequently are rejected."* The **daily cap exists and is published as no number** — which supersedes this cell's earlier *unverified*, because what was unverified was the cap's existence and what is unknown is its size | exists; its **API fire endpoint is documented** (10.2a), and it is the documented off-Mac maker path — §I row 15 |

---

### 10.6 What the research could not establish

**(NEW: these are the ten gaps the runtimes lane named about itself. They are listed because a plan that hides its
own unknowns spends them later at a worse price.)**

1. **Codex `/goal` has no primary citation, is `C`-confidence, and is used by no row** — it exists at 0.128.0 with
   a `budget_limited` state it cannot resume from (#34215), its own tracker asks for it to be documented at all
   (#20536), whether it runs under `codex exec` is unestablished, and the two primary URLs 308-redirected.
   **Two fetches close it** (deletion 28: this is the whole of Codex `/goal` in this plan).
2. **OpenAI's terms are unread** (HTTP 403). The whole OpenAI half of the terms question of section 9.10 is open.
3. **Whether Codex `/goal` runs under `codex exec` is unestablished** — and it is the hinge for using Codex's goal
   feature from a driver at all.
4. **Whether Anthropic's documented headless features constitute the *"explicitly permit"* carve-out** on a
   subscription. Section 9.10; the founder's decision.
5. **The trailing Yes/No column in the tools reference** (`Monitor` Yes, `Workflow` Yes, `ScheduleWakeup` No,
   `Agent` No) — the header was not captured and the lane refused to guess it.
6. **`-w`, `--worktree` and `--tmux` did not appear** in the CLI-reference fetch. A prior lane has them as measured;
   treat as unconfirmed here.
7. **Routines' own page, desktop scheduled tasks, `/schedule`, Remote Control, agent teams and the workflows page
   were not fetched.** The agent-teams facts used above come from the surfaces lane, not this one.
8. **Codex config reference, `requirements.toml`, `codex mcp`, Automations, and whether Codex can serve as an MCP
   server** — all carry a prior lane's marks; nothing was added.
9. **Third-party routers** (Amp's two-family runtime, OpenCode) were not researched.
10. **Nothing was measured.** No runtime ran. **Codex remains uninstalled and no install was attempted.**

**(NEW: ten more, and these belong to the cloud lane of 2026-09-05 — `research/cloud.md` part 5b — rather than the
runtimes lane above. They are numbered on from ten so that neither lane's count is claimed for the other. The lane
named fifteen; several are folded here where they are the same hole seen from two sides.)**

11. **OpenAI's terms are unread after four refusals against one host across two dates** — `row-terms-of-use`,
    `eu-terms-of-use/` and `business-terms/` returned HTTP 403 this session, on top of the prior lane's 403 on
    `terms-of-use`. This restates gap 2 with the count, because *"one fetch failed"* and *"four fetches failed on two
    days"* argue differently about whether a fifth is worth spending. The gap stays open at §I row 1.
12. **A cloud task's maximum duration is undocumented.** No page states one; *"longer tasks"* get *"dedicated
    environments"* and no number follows. A night lane with an unknown ceiling is a night lane whose failure mode is
    unknown.
13. **No vendor page prints `codex cloud exec` or any other non-interactive creation command.** The only source is an
    open feature request whose author is not a confirmed maintainer (#24777, M). **Two things close this: a vendor
    page, or `codex cloud exec --help` on an installed binary** — and Codex is not installed (§I row 5).
14. **Cancelling a cloud task is UNKNOWN.** It appears in neither the commands the issue says exist nor the ones it
    requests, and no vendor page mentions it. A lane the cord cannot stop is a lane the cord does not govern, which
    is a real hole in §12's stop guarantee and is named here rather than assumed away.
15. **No REST endpoint for creating a cloud task was found, and that is absence of evidence across six fetched
    pages — not a vendor denial.** A private or undocumented endpoint may exist. The distinction is kept because
    *"we could not find one"* and *"there is none"* license different plans, and only the first is what happened.
16. **No numeric quota is published for either hosted lane, at the point where it would bind.** OpenAI's only cloud
    statement is qualitative; Anthropic publishes **no numeric inactivity timeout** for a cloud session and **no
    numeric daily routine cap**, both described only in words. A night lane whose budget is unpublished cannot be
    budgeted — only observed after the fact.
17. **No GitHub label trigger is documented for Codex** — the two documented triggers are the `@codex` mention and
    automatic review on PR open. A label is exactly what a card-driven board (§14.7) would reach for, and it is not
    there.
18. **Whether `codex exec resume` reaches a cloud task is unknown.** Nothing links the two surfaces and they use
    different nouns throughout — `SESSION_ID` locally, `TASK_ID` in the cloud.
19. **Two things about the hosted sandbox rest on nothing.** Its container technology is **unnamed** —
    *"isolated cloud environments"* is the entire vendor claim — and the **two-phase network model is the lane's own
    inference** from the phrase *"during the agent phase"*, stated by no page. Both matter to anyone deciding what a
    cloud task may be trusted with.
20. **Fetch fidelity bounds every `M` in 10.2a, and two things were not fetched at all.** The `learn.chatgpt.com`
    pages were **summarized by the fetch rather than returned whole**: short quoted strings are H, reconstructed
    tables and figures are M. **Jules' task quotas and its CLI were not fetched.** And **no claim was registered in
    the ledger** — that lane had no `claim-append` tool, so every durable fact in 10.2a is **unregistered prose**.
    The lane names its own minimum for whoever does hold the tool: the internet-access default, the Routines fire
    endpoint with its one-hour floor, and the absence of a documented Codex cloud creation API, each with a
    `valid_until`.

---

### 10.7 What enforces this section

| Rule | Mechanism | State |
|---|---|---|
| One program composes every provider's argv | `bin/run` | **ABSENT** |
| A grant is what a run can actually touch | `bin/probe`, nightly | **ABSENT** |
| `bypassPermissions` cannot be entered | `permissions.disableBypassPermissionsMode: "disable"` in managed settings | **ABSENT** — a founder act on a machine-wide file, section 20 row 8 |
| A child cannot widen its own grant | a subagent's `permissionMode` frontmatter **is ignored** by the runtime | **shipped** |
| A dispatched engine cannot invoke its own gate | `Workflow` is removed from every subagent by the runtime, and `PS-WORKFLOW-CONTAINMENT` in `.claude/hooks/schema-lint.js` refuses the declaration | **EXISTS**, branch `ceo-1-1788609834`; **independently confirmed** by the vendor |
| A run has a completion condition, not a turn budget alone | `/goal <done-test> or stop after N turns` under `-p` | **shipped**; the composition is **ABSENT** |
| `/goal` is not killed by the managed file | the file omits `disableAllHooks` and `allowManagedHooksOnly` (10.4) | **ABSENT** until the file exists |
| A run cannot stall forever | `--max-budget-usd` as a stall fuse, not a billing control | **shipped** (v2.1.217+) |
| Codex only widens on evidence | the headless admission test of 10.2 | **ABSENT** — Codex is not installed |
| One logbook, no second source of truth | the event log, with the intent id on every row | **ABSENT**; `~/.agentvibe/events.jsonl` is the spine on this branch |
| **A hosted run never writes into the house directly** — a pull request or a staged artifact, never the working tree (v56, 10.2a) | reconciliation on wake, against the PR or the staged artifact | **ABSENT** |
| **Minting a cloud task is not a run** | `bin/run`'s `cloud` carrier — it mints a task and records its id, and does nothing else | **ABSENT** |
| **A night's cloud work is read, not trusted** | the Watch reads the pull requests on wake | **ABSENT** |
| **No unattended work is minted on a carrier that cannot be stopped** (v67) | `bin/run` reads the carrier's `stop:` column and refuses `UNKNOWN`; the launcher records each child's process group and the cord signals it | **ABSENT**. Per carrier: Claude `-p` → the process group · **local Codex → the `Interrupt` hook (W22)** · **Codex cloud → UNKNOWN, so the maker lane stays shut** (10.6 gap 14) |
| **A reroute off a limited or unreachable family is bounded and labelled** (v78) | a three-deep `fallback:` ending in stop-and-stage; a rung demotion unless rehearsed for that move class | **ABSENT** — and Codex's one foreground slot is why a chain naming it must end in stop-and-stage (§9.4a) |
| **The Codex version in play is a recorded fact, not a floor** (W19, O35) | the admitted-tool file records the binary's version string and sha256 at admission (§8.1) | **ABSENT** — Codex is not installed |

---

### 10.8 What moved under this section on 2026-09-06

**(NEW: SPINE §H.5, carried whole. Nothing above is deleted.)** Seven facts and one absence land here, from
`research/world.md` accessed 2026-09-06, and one of them is a whole missing row. **None of them was decided by
anyone** — each moved a statement in this section without a decision attached, which is why they sit together
rather than being scattered as corrections.

**(FACT: world.md 19 — W19. The rehearsal floor no longer discriminates.)** Codex is at **0.153.4 (2026-09-04)**;
the window also shows 0.153.3, 0.153.2, 0.153.0, 0.152.0, 0.151.0, 0.150.1 and 0.150.0. 10.2's condition
~~*"version ≥ 0.124.0"*~~ is **twenty-nine minor versions stale** and is satisfied by anything installed, so it
tests nothing. **Restate it as *the installed version, recorded*** (moved 2026-09-06: W19), which is a fact the
admission record can hold and a floor cannot — §8's O35 records a binary's version string and sha256 at admission,
so the mechanism already exists in this plan and this row is what it is for.

**(FACT: world.md 24 — W24. On the two questions this section most needs answered, the finding is *absence*.)**
Nothing in the Codex entries readable for **2026-08-26 → 2026-09-04** mentions `codex cloud exec`, a cloud REST
API, cloud task creation, cancel or poll, goal mode, or **#19945**. **10.2 stands and v56(b) stands.** Read the
shape of this precisely: it is four weeks of release notes with no mention, against questions that would be
answered on a documentation page rather than in a changelog. **Absence is not denial** — no vendor page states that
Codex cloud lacks a creation API. The **June–August window is unread** after three fetch failures, and reading it
is **R26**. One correction inward: **0.152.0 adds credential-refresh progress to `codex exec`**, which *adds output
to the stream 10.2 depends on being clean* — the only `codex exec` change in the window, and it moves in the wrong
direction for a parser.

**(FACT: world.md 21 — W21. Codex has a third control axis, Guardian, and §C.1's cell models two.)** *"Full Access
skips Guardian reviews for confirmation-only actions. User approval mode skips background Guardian scoring and
prewarming, while sensitive-action checks and requests for user input retain their existing handling."* So
Guardian is a **background scoring layer whose behaviour changes with the approval mode** — the band table's
`approval_policy` × `sandbox_mode` pair understates what governs a Codex run, and the correction lands in §C.1
rather than here. Also: *"Guardian review history survives compaction, restarts, and user-created forks while
respecting rollback boundaries and **isolating subagent history**"* — Codex subagents keep their own review
history, which 10.5's subagent row does not describe.

**(FACT: world.md 22 — W22. The cord has a Codex-side receiver and no row named it.)** Codex 0.150.0 shipped
`Interrupt` hooks: *"run commands or MCP handlers when an active top-level turn is interrupted"*. **v67 is what
this answers to** — the launcher records each child's process group and the cord signals it, and `bin/run` refuses
to mint unattended work on a carrier whose `stop:` reads **UNKNOWN**. `Interrupt` is what a Codex carrier's `stop:`
column would name, and it is the reason the *local* Codex carrier can plausibly carry a value at all. **The cloud
carrier still cannot:** cancelling a hosted task is UNKNOWN (10.6 gap 14), which under v67 means the Codex-cloud
maker lane stays shut — not as a new refusal, but as §I row 15's state stated in the cord's own terms.

**(FACT: world.md 20 — W20. Codex ships `@` mentions between tasks.)** Agents can *"read, create, or message tasks
from terminal"* (0.150.0). **Two providers shipped agent-to-agent messaging inside one window** — this and Claude
Code's cross-session `SendMessage`/`ListAgents` — and the plan modelled neither. The shape is decided in **v80**
(§3): a message is a **handover or an objection**, on the handover schema, and the vendor transport's ids are
recorded as attributes and never as a join key. What that decision buys here is that Codex's `@` mention and
Anthropic's socket are **one shape in the ledger**, not two.

**(FACT: world.md 23 — W23. An admitted tool's output can be rewritten before the model sees it.)** A Codex
extension can *"inspect or replace MCP tool results before reaching the model"* (0.151.0). §8's door tests a tool's
*input* surface; this is the return path, and it pairs with **O65**'s taint id and per-venture canary. Named here
because it is a property of **this runtime**, not of the tool: the same server is safer under the Claude carrier
than under the Codex one, which is a routing fact.

**(FACT: world.md 25, 27 — W25 and W27. §10 has no Gemini row of any kind, and that is now a hole with a name.)**
Gemini CLI ships **named subagents** with *"their own set of tools, MCP servers, system instructions, and context
window"*, delegated by `@agent`, defined in `~/.gemini/agents` (personal) or `.gemini/agents` (project) — ~~**a third
agent-file location beside `.claude/agents/` and Codex TOML**, which v42 decided one home without contemplating~~
**(corrected 2026-09-06 · challenge C P1-4)**: it is **a generated view of `keel/shared/roster.yml` (§L O2) for the
agents Gemini may stand**, not a third home. **v42 stands unamended** — the one home an agent file is *written* in is
`.claude/agents/<name>.md`; `.gemini/agents/` is regenerated from the roster like `.agents/skills/` and
`.claude/skills/` already are under v48, so nothing is authored twice and no second path can drift. §17.8 carries the
path and the generator.
And its releases since 0.30 are dominated by security hardening, including *"enforce fail-closed workspace trust
and filter mcpServers in restricted mode"* — **the nearest analogue to `--restricted` in any third runtime**, and
the thing a Gemini row in 10.5 would be written against. Gemini is carried in this plan as a price and as
*"scout, once authenticated"*; that is thinner than the evidence now supports. ~~The gap is recorded rather than
filled here.~~ **(corrected 2026-09-06 · challenge C P1-4)** **The agent-file half of the gap is filled and its owner
is named:** `.gemini/agents/` is generated from `roster.yml` by **O2**'s generator pass (ABSENT), for the agents the
§17.8 table says Gemini may stand — `scout` on routine work and the summarising half of the `curator`. Recorded as
the orchestrator's reading of **W25** under **v42**, reopenable by name. What stays open is the *row* — §10.5 has no
Gemini entry and no `--restricted` analogue written against it.

**(NEW: v78 lands on this section as the thing that makes a one-slot family survivable.)** 9.4a decides a
three-deep `fallback:` per agent ending in *stop and stage*, a **rung demotion** on any cross-family reroute not
rehearsed for that move class, a frozen `class: calibration` set, and one provider-outage drill. Read against 10.2:
Codex is **one foreground slot**, so it is not a fallback destination for parallel work, and a chain naming it must
end in stop-and-stage rather than pretending a second lane exists.

**(R10 — the hinge, and it is this section's hinge more than anyone's.)** Does `codex exec --json` return output
with **no controlling TTY**, on a current version, with a non-trivial prompt? **Source class:** five known-answer
cases on an installed binary. **What it decides:** pass and rung 2 becomes **parallel** and a second family is a
lane; fail and the second family is **one foreground slot forever, at 1/N availability**. **v5, v32, v78, v82 and
§I row 15 all read differently depending on it** — which is why it is named as the hinge rather than as one more
open question. Its prerequisite is a founder act: Codex is not installed.

**(R26, OPEN — the only cheap route to R10.)** Was **#19945** fixed between Codex 0.125 and 0.153? **Source class:** the
unread June–August changelog window, against which three fetches already failed. It would settle R10 **without a
local install**, which is the entire reason it is worth naming separately from R10.
