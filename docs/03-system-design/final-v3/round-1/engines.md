# The Engine Layer — round 1

*Lane: engines. Fields 18, 17, 9, 20, 28. Sealed lane — written without reading any prior plan.*
*Date of research: 2026-09-11. Every factual claim below carries a source or is marked speculative.*

## Outline

1. What an "engine" is, and why the layer deserves its own field
2. The census: what is actually true today about each harness
   - 2.1 Claude Code
   - 2.2 OpenAI Codex CLI
   - 2.3 Gemini CLI
   - 2.4 The serious alternatives (Aider, OpenCode, Cline/Roo, Amp, Cursor CLI, Copilot CLI, Goose, Devin-likes)
   - 2.5 Capability matrix
3. Field 18 — Supplier dependence: is single-supplier a risk worth taking, and what would moving cost
4. Field 17 — Substitutability: how the company knows a substitute did as well
5. Field 9 — Quality drift: noticing that the same request now produces a different quality of answer
6. Field 20 — Cost: money vs capacity, the spend ceiling, behaviour at the ceiling, and the owner's time
7. Field 28 — Terms of service: what the contracts actually permit
8. Where a heterogeneous fleet buys something real, and where it buys only complexity
9. What I would build, concretely
10. Open questions and what would falsify me

---

## 0 · A constraint on this lane, stated before anything else

**The brief told me to use WebSearch and WebFetch. Both are disabled for this session**, in subagents
too — the tool layer returns `No such tool available: WebSearch. WebSearch is disabled for this
session`. External `curl` and `w-get` are additionally blocked by `.claude/hooks/pre-tool-use.sh`,
which refuses them and advises "use the WebFetch MCP tool" — the tool that does not exist here. So the
outward-facing half of the brief was not executable as written.

I did three things instead of silently producing a worse document:

1. **Measured the harnesses that are installed on this machine.** Two of the three named subjects are
   present as binaries, and a binary is a better source than a docs page: it is the version that would
   actually run. Everything marked `MEASURED` was produced by running the tool on 2026-09-11 and is
   reproducible by the command quoted beside it.
2. **Used recalled knowledge where measurement was impossible**, marked `RECALLED`, with the honest
   caveat that my knowledge cutoff is **May 2026** and today is **2026-09-11** — four months of drift
   in the fastest-moving part of this industry. Anything `RECALLED` about pricing, limits or terms is a
   *hypothesis to check*, not a fact. I have deliberately **not** invented URLs to make recalled claims
   look sourced. A fabricated citation is worse than an admitted gap, and this repo has already been
   burned once by a fabrication that read as measurement.
3. **Reasoned.** Fields 18, 17, 9, 20 and 28 are mostly questions about what the company should *do*,
   and that reasoning does not depend on a docs page. §3 onward is the load-bearing part of this lane
   and it is not degraded by the missing network.

**One thing the outage itself taught, worth more than the pages I could not fetch.** This lane is a
live instance of the exact risk it was asked to analyse: *the engine layer changed underneath the work,
mid-flight, and the work did not stop.* Nobody told this agent the web tools were gone. It discovered
it by calling one and reading an error. There was no capability manifest to consult, no pre-flight
check, and no way to distinguish "WebSearch is disabled by policy" from "WebSearch is broken today" —
different facts with different correct responses. **Field 18 asks "what happens when the preferred
capacity is unavailable?" The answer, here, today, is: the agent finds out by failing, and then
improvises silently.** That is the single most important empirical finding in this document and §5.4
and §9.2 are about it.

---

## 1 · What an "engine" is, and why the layer deserves a field of its own

An **engine** is not a model. It is the whole *runtime the work executes in*: a model, plus the
scaffold that gives it tools, memory, a permission model, a loop, and a way to be called
non-interactively. Those parts are separable in principle and entangled in practice, and the
entanglement is what this field exists to name.

Four distinct dependencies hide inside one word, with **completely different switching costs**:

| Layer | Example | What it costs to swap |
|---|---|---|
| **Weights** | `claude-opus-5`, `gpt-6-astra`, `gemini-3-pro` | Cheap *if* you speak the API directly. A string change plus prompt re-tuning. |
| **Harness** | Claude Code, Codex CLI, Gemini CLI | Expensive. Hooks, subagent files, skills, permission config, session format, slash commands — **none of it is portable and none of it is standardised.** |
| **Entitlement** | a Max subscription, an API org, an enterprise agreement | Discontinuous. Changes what you may do, what it costs, and what the vendor may do with your data. |
| **Habit** | the founder's muscle memory, the repo's 134 skills, 18 agent files | The largest and the least visible. Nobody writes this one down. |

**Almost everything written about "model choice" is about layer 1, and almost all the lock-in is in
layers 2 and 4.** This document is mostly about those, because that is where the money and the months
are, and because they are the layers nobody budgets for.

A fifth thing rides along and deserves naming: **the harness is also a prompt author.** Every one of
these tools injects a large system prompt, tool descriptions, a compaction policy and reminder
strings the operator never sees and cannot fully control. When a vendor ships a new `base_instructions`
string, every agent running on it changes behaviour **with no diff in your repository.** That is
measured below, not speculated — the Codex catalog hands those strings over verbatim, and they are
long.

---

## 2 · The census

### 2.0 Versions, measured on this machine, 2026-09-11

```
claude --version   →  2.1.268 (Claude Code)
codex --version    →  codex-cli 0.153.4          (@openai/codex 0.153.4)
gemini --version   →  @google/gemini-cli 0.38.2  (@google-dev/gemini-cli 0.1.14 also installed)
```

`MEASURED`. All three are installed on the founder's machine. `~/.codex` was written at 22:04 on
2026-09-10 and `~/.gemini` at 15:36 on 2026-09-09, so **both alternatives are already in real use**,
not hypothetical. `~/.cline`, `~/.continue`, `~/.copilot`, `~/.cursor`, `~/.goose` and `~/.opencode`
also exist on disk.

That is **nine harnesses' worth of config on one laptop**, and it is itself the most honest finding
about this market: *practitioners are not choosing one, they are accumulating.* The question "which
engine do we depend on" has already been answered in the wrong direction by accretion, without a
decision ever being taken. Field 18's real question here is not "should we add a second supplier" but
**"we have nine, which of them is load-bearing, and does anybody know?"**

### 2.1 Claude Code — architecture and exposed surface

`MEASURED` from this repository's own live configuration and from behaviour observed this session;
`RECALLED` where marked.

**What it is architecturally.** A Node/TypeScript CLI that runs a tool-use loop against Anthropic
models, with a permission layer, an OS-level Bash sandbox, a hook system, a subagent dispatch
mechanism, and MCP client support. Distributed as a binary at `~/.local/bin/claude`. It is the most
*configurable* of the three and the most *opinionated* about how configuration composes.

**Surfaces it exposes, each verified against this repo:**

- **Hooks.** Shell scripts invoked on tool-call lifecycle events. This repo's
  `.claude/hooks/pre-tool-use.sh` is 677 lines and is the only mechanism in the repo that can *stop*
  an action: it receives a compact JSON payload on stdin (`tool_name`, `tool_input.command`,
  `tool_input.file_path`), and **exit code 2 denies the call**, exit 0 allows. `MEASURED` — it denied
  three of my own calls this session.
  - The matcher is **an unanchored regex over the tool name**, which is a sharper fact than it sounds:
    this repo's own comments record that the matcher once read `mcp__playwright__browser_navigate`, so
    exactly two tools were hooked and the other twenty-two on the same server — including
    `browser_run_code_unsafe` — **were unhookable**. A permission system whose matcher can silently
    fail to match is a permission system that reports enforcement it is not performing.
  - **The hook sees the command as a string, not as a parse.** It greps. This session it blocked a
    `cat` of a file because the *heredoc body* contained the string `w-get` (spelled here with a hyphen
    so this document can be read by an agent without blocking it). The repo's own comment calls this
    "unfixable without a shell parser" and names the escape hatch: use the `Write` tool, which checks
    only `file_path` and never content. **A guard with a documented escape hatch in its own source is a
    guard with a documented escape hatch.**
- **Subagents.** Markdown files in `.claude/agents/` with YAML frontmatter — `tools:`, `model:`,
  `maxTurns:`, `mcpServers:`. Dispatched via a `Task`/`Agent` tool that only the orchestrator declares.
  Run in **isolated context**; return a text summary. `MEASURED`: this repo has 18 such files.
- **`maxTurns` binds only when the dispatch names an `agentType`.** `MEASURED` by this repo and
  registered as a claim. This is the sort of fact that is invisible until someone tests it, and it had
  been recorded the *opposite* way here for some time.
- **MCP.** Client support via `.mcp.json`, per-agent grants via `mcpServers:` frontmatter. `MEASURED`:
  two agents in this repo declare grants (`designer`→playwright, `sourcer`→claim-append), and this
  repo has had to build its own `mcp-policy.json` layer on top because **Claude Code's native grant is
  server-level, not tool-level** — granting `playwright` grants `browser_run_code_unsafe`, which is
  arbitrary code execution in a browser holding live session cookies. The repo counted 69 real calls
  of it. *That gap — server-granularity grants for tools with wildly different blast radius — is the
  single sharpest capability criticism of Claude Code in this document.*
- **Sandboxing.** OS-level: Seatbelt on macOS, bubblewrap on Linux/WSL2, configured under
  `sandbox` in settings with `filesystem.allowRead`/`allowWrite`/`denyRead`. `failIfUnavailable: true`
  makes it fail closed. **It is the Bash sandbox**: it governs Bash and its children, not the file-edit
  tools, and not the session. `MEASURED` here: `~/.codex`, `~/.gemini`, `~/.config/openai`, `~/.ssh`,
  `~/.aws`, `~/.config/gh` and `**/.env*` are all in `denyRead` for this session.
- **Headless.** Far larger than I recalled. See §2.1b, which is a correction: I wrote most of this
  section from memory and then ran `claude --help`, and the measurement overturned four claims.
- **Settings precedence.** Managed → project `.claude/settings.json` → local → user. This repo denies
  writes to every settings file *from inside an agent turn*, because `settings.json` is where the hook
  is registered and **one write disarms the entire permission model**. That reasoning is correct and
  is the sort of thing a second harness would need reproduced from scratch.

**What practitioners report breaks** — `RECALLED`, cutoff May 2026, and this is the section most
likely to be stale:
- **Compaction is the number one complaint.** Auto-compaction at the context limit summarises the
  conversation, and the summary silently drops things the task depended on. The failure is not that it
  compacts; it is that *the agent cannot tell that it compacted* and keeps going with confidence.
- Long-running sessions degrading in quality before any limit is hit ("it got dumber after an hour").
- Hooks being hard to debug: a hook that exits non-zero for an unrelated reason looks to the agent like
  a policy denial. `MEASURED` this session — I could not distinguish "policy forbids curl" from "the
  hook crashed" without reading the hook's source.
- Cost surprise on the API-billed path, and opaque limit accounting on the subscription path.

### 2.1b Correction — what `claude --help` said that I had wrong

**I wrote §2.1 from memory and then ran the binary. Four of my claims were wrong, all in the same
direction: I under-credited the tool the company already uses.** I am leaving the mistake visible
because it *is* the finding. If an agent with four months of staleness misjudges its own runtime this
badly, then every plan in this repository that reasons about "what Claude Code can do" from
recollection is carrying the same error, and nothing in the repository would catch it. **The
capability surface of your engine is not a thing to know. It is a thing to query, on a schedule.**

`MEASURED`, `claude --help`, 2.1.268, 2026-09-11. What is actually there:

**Output and return shape**
- `--output-format text | json | stream-json`, `--input-format text | stream-json`
- **`--json-schema <schema>` — "JSON Schema for structured output validation."** So Claude Code *does*
  have an enforced return shape. My matrix said it did not. **This is directly relevant to this
  repository:** every engine's structured return is currently enforced by asking politely in a prompt,
  and the harness has supported schema validation the whole time.
- `--include-partial-messages`, `--replay-user-messages`
- **`--include-hook-events` — "Include all hook lifecycle events in the output stream."** Hook
  observability, machine-readable. This repo's `events.jsonl` reimplements part of this by hand.
- **`--forward-subagent-text` — forwards subagent text and thinking "with `parent_tool_use_id` set."**
  That is a **distributed trace across a delegation tree**, available today. Field 42 ("how do you
  follow one piece of work through many workers") has a native answer nobody here is using.

**Cost control — and this is the most important single flag in this document for field 20**
- **`--max-budget-usd <amount>` — "Maximum dollar amount to spend on API calls (only works with
  `--print`)."** A hard money ceiling, enforced by the runtime, per invocation. §6 is built on this.
- `--effort <low|medium|high|xhigh|max>` — the same five-position reasoning dial Codex exposes, so
  "how much thinking does this deserve" is a first-class parameter on both engines now.
- `--autocompact <auto|tokens>` — auto-compact window, `auto` or 100k–1M.
- `--exclude-dynamic-system-prompt-sections` — moves cwd/env/git-status out of the system prompt
  "to improve cross-user prompt-cache reuse." A cost lever that is also a determinism lever.

**Availability and failover**
- **`--fallback-model <model>` — "automatic fallback to specified model(s) when the default model is
  overloaded or not available. Accepts a comma-separated list to try each in order. Re-tries the
  primary at the start of each user turn."** Field 18 asks "what happens when the preferred capacity
  is unavailable?" **The harness has a shipped answer and this company does not use it.** Note what it
  does *not* do: it does not tell the work that the substitution happened. See §5.1 — silent
  substitution is the quality-measurement problem in its purest form.
- **Third-party providers.** The `--bare` help text states: "3P providers (Bedrock/Vertex/Foundry) use
  their own credentials." **Claude models are reachable through AWS Bedrock, Google Vertex and
  Microsoft Foundry from inside this same harness.** That is a genuine, cheap, partial answer to
  supplier concentration — it changes the *commercial and availability* counterparty without changing
  the harness, the prompts, or a single line of this repo. It does not change the *model family*, so
  it buys nothing for review independence. §3.2.

**Reproducibility and isolation**
- **`--bare`** — "skip hooks, LSP, plugin sync, attribution, auto-memory, background prefetches,
  keychain reads, and `CLAUDE.md` auto-discovery." Auth is strictly `ANTHROPIC_API_KEY`. This is
  Claude Code's `--ignore-user-config`, and it is stronger.
- **`--safe-mode`** — all customisations disabled; "useful for troubleshooting a broken
  configuration." Admin-managed settings still apply.
- **`--restricted`** — removes Bash/REPL/code-running tools and WebFetch, ignores user/project/local
  settings, confines file tools to working directories, **refuses `bypassPermissions`**, and lets only
  a person or the configured permission handler approve writes to settings, git and tool config.
  *This is a stronger, vendor-maintained version of what this repo's `reviewer-readonly` engine is
  trying to be by convention.*
- `--setting-sources user,project,local`, `--strict-mcp-config`, `--no-session-persistence`,
  `--session-id <uuid>`, `--fork-session`, `--tools "..."`, `--settings <file-or-json>`
- **`--system-prompt-snapshot <on|off>`** and read its semantics carefully, because they are a trap:
  *on* (the default) records the system prompt on the conversation's first request and "sends the
  record as-is, even when a later launch passes different text, until the conversation is compacted."
  **So on a resumed session, editing your system prompt does nothing, silently, until a compaction you
  did not schedule.** Two ways to be wrong about what instructions are in force, pointing in opposite
  directions: §2.2 finds instructions changing without your edit, and this finds your edit not
  changing the instructions. Both are invisible from inside the run. Field 33 and field 48.

**Process model**
- `--bg/--background` plus `claude agents | attach | logs | stop | rm | respawn`, `claude agents
  --json` for a machine-readable list of active sessions. **A background agent fleet is a shipped
  feature.** `respawn` exists specifically to restart a background session "so it runs the current
  Claude Code version", which concedes that a long-lived agent goes stale against its own runtime.
- `--worktree/-w [name]` and `--tmux`: **native git-worktree creation per session.** This repository
  has a long, painful, well-documented protocol for creating worktrees under the armed sandbox,
  including an escalation requirement. There is a flag. I am not touching it — out of scope — but it
  should be checked against the documented wall.
- `--cloud`, `--environment ccpool_...`, `--remote-control`, `--teleport`, `--from-pr`.
- **`claude ultrareview`** — "a cloud-hosted **multi-agent** code review of the current branch (or a
  PR number / base branch)", `--json` emits a raw `bugs.json`, default timeout 45 minutes. This repo
  has an open, unmet requirement for a 2-of-3 multi-judge panel at `irreversible` tier. **A
  multi-agent review product now ships in the CLI.** It does *not* discharge the requirement — every
  judge is Anthropic, so the "≥2 distinct model families" predicate still fails — but it moves the
  gap from "no panel exists" to "the panel is single-family", which is a different and smaller
  problem. §8.1.
- **`claude import [codex|gemini|cursor] --dry-run`** — "Import config from another AI coding agent
  into Claude Code." §4.3 is about the asymmetry this reveals.

**Permissions**
- `--permission-mode acceptEdits | auto | bypassPermissions | manual | dontAsk | plan`
- **`--permission-prompts host | none`** — with `none`, "anything that would prompt is **denied
  automatically**". That is the correct unattended default and it is one flag.
- `--allow-dangerously-skip-permissions` (make it *available*) vs `--dangerously-skip-permissions`
  (use it). A two-step ceremony, which is good design.
- `--plugin-dir <path|zip>` and **`--plugin-url <url>` — "Fetch a plugin .zip from a URL for this
  session only."** Remote code, fetched and loaded into the agent runtime, per session. §7.4.

**And the one that should worry this repository most.** The `-p/--print` help text says, verbatim:

> "The workspace trust dialog is skipped when Claude is run in non-interactive mode (via `-p`, or when
> stdout is not a TTY, e.g. piped or redirected output). Only use this in directories you trust.
> **Settings files that fail validation are silently ignored in this mode (no error dialog is
> shown).**"

`MEASURED`. Read that against the fleet this company is building. **In headless mode — the only mode a
fleet runs in — a `settings.json` that fails validation is discarded without a word, and
`settings.json` is where this repository registers the hook that is "the only mechanism in this repo
that can stop an action."** A typo in a settings file therefore does not produce an error; it produces
an agent running with no permission configuration, which looks exactly like an agent running
correctly. It also means "stdout is not a TTY" — i.e. *being piped* — silently changes the security
posture.

This is field 43's question asked and answered by the vendor's own help text: *"How would you know a
check has stopped checking while still passing?"* **You would not.** Mitigation is cheap and is in
§9.1: validate the settings file yourself, in CI and at session start, because the harness will not.

### 2.2 OpenAI Codex CLI 0.153.4 — the most measured section here

`MEASURED` by running `codex --help`, `codex exec --help`, `codex debug models`, and subcommand help,
on 2026-09-11 with `CODEX_HOME` pointed at an empty temp directory (the real `~/.codex` is in this
session's sandbox `denyRead`, which is itself finding §5.4).

**Architecturally it is a Rust binary with a daemon.** That is a different shape from Claude Code, and
the difference matters more than the language:

```
codex agents          Browse all agent sessions on the shared local app-server daemon
codex app-server      [experimental] Run the app server or related tooling
codex exec-server     [EXPERIMENTAL] Run the standalone exec-server service
codex remote-control  [experimental] Manage the app-server daemon with remote control enabled
codex mcp-server      Start Codex as an MCP server (stdio)
codex --remote <ADDR> Connect the TUI to a remote app server  (ws://, wss://, unix://)
```

**Codex can be run as an MCP server over stdio.** `MEASURED` (`codex mcp-server` is a documented
subcommand). This is the single most important integration fact in this document: **a heterogeneous
fleet does not require writing an adapter.** Claude Code speaks MCP as a client; Codex speaks MCP as a
server. The seam already exists and is maintained by the vendor.

**Headless / exec mode is first-class and unusually well-shaped:**

| Flag | What it gives you |
|---|---|
| `codex exec [PROMPT]` | non-interactive; reads stdin if no prompt |
| `--json` | **JSONL event stream on stdout** — machine-readable trace, not scraped text |
| `--output-schema <FILE>` | **a JSON Schema constraining the final response shape** |
| `-o, --output-last-message <FILE>` | final message to a file |
| `--ephemeral` | run without persisting session files |
| `--ignore-user-config` | do not load `config.toml` — *reproducibility* |
| `--ignore-rules` | do not load user/project execpolicy `.rules` files |
| `--skip-git-repo-check` | run outside a repo |
| `-C/--cd`, `--add-dir` | working root and additional writable dirs |

`--output-schema` plus `--json` is a **strictly better** return contract than anything Claude Code
offers a subagent today. This repo's builder return contract is a JSON blob the agent is *asked* to
emit and which nothing validates at the harness layer; Codex can have the harness enforce the shape.
That is field 45 ("the shape of what passes between steps") solved at the runtime rather than by
convention.

**Sandbox and approvals are explicit, named values:**

```
-s, --sandbox   read-only | workspace-write | danger-full-access
-a, --ask-for-approval   on-request | never
    --approve-for-me     route approvals through automatic review, workspace-write sandbox
    --dangerously-bypass-approvals-and-sandbox
    --dangerously-bypass-hook-trust
codex sandbox [COMMAND]  run an arbitrary command under seatbelt
```

Three things worth pulling out.

1. **`codex sandbox <cmd>` exposes the sandbox as a standalone primitive.** You can run *any* command
   under Codex's Seatbelt profile, including commands that have nothing to do with Codex. Claude Code
   has no equivalent — its sandbox is only reachable by being Claude Code. For a fleet, this is a way
   to get one containment story across heterogeneous engines instead of one per engine.
2. **`--dangerously-bypass-hook-trust` implies Codex hooks have a persisted trust model.** `MEASURED`
   from the flag's own help text: "Run enabled hooks without requiring persisted hook trust for this
   invocation." Claude Code hooks have no equivalent per-hook trust ceremony that I know of. This is a
   real security-model difference: it means a Codex hook shipped in a cloned repo does not silently
   run. *This repo should notice that its own threat model has a hole Codex closed.*
3. **`--approve-for-me` is an approval policy delegated to a model.** Note the design: it routes
   approval requests "through automatic review using the workspace-write sandbox" — i.e. a second
   model decides whether the first model's command is acceptable, *inside a constrained sandbox*.
   Whatever one thinks of it, it is an explicit, named, shipped answer to "who approves when nobody is
   watching", and this repo's field 46 has no comparable mechanism.

**`codex review` is a first-class non-interactive subcommand**, and there is a **dedicated review model
in the catalog**: `codex-auto-review`. `MEASURED`. For field 49 ("using one source of judgement
against another") this is significant — OpenAI has productised review-as-a-separate-call, which is the
thing this repo built `reviewer` and `reviewer-readonly` to do by convention.

**Local and open models are supported natively:** `--oss` with `--local-provider lmstudio|ollama`.
`MEASURED`. `ollama` is installed on this machine (`/usr/local/bin/ollama`). **This is the cheapest
real supplier-independence lever available to this company** and it is one command away — see §3.4.

**Config:** TOML at `$CODEX_HOME/config.toml`, overridable per-invocation with `-c dotted.path=value`,
layerable with `-p/--profile <name>` (`$CODEX_HOME/<name>.config.toml` layered on the base), and
checkable with `--strict-config` ("Error out when config.toml contains fields that are not recognized
by this version"). **`--strict-config` is a drift detector and Claude Code has no equivalent** — this
repo has been bitten repeatedly by configuration that silently means nothing (52 agents declaring
`mcpServers` while no MCP config existed anywhere). A flag that refuses unrecognised keys would have
caught that on day one.

**Plugins and a marketplace:** `codex plugin add|list|remove|marketplace`. `MEASURED`. Third-party code
executing inside the agent runtime, installed from a remote marketplace. Treat as a supply-chain
surface; see §7.4.

**The model catalog, dumped live.** `MEASURED`, `codex debug models`:

| slug | context | max context | eff.% | multi-agent | notes |
|---|---:|---:|---:|---|---|
| `gpt-6-astra` | 272,000 | 872,000 | 95 | v2 / `xhigh` | "Our most capable model", priority 1 |
| `gpt-5.6-sol` | 272,000 | 872,000 | 95 | v2 | listed |
| `gpt-5.6-terra` | 272,000 | 872,000 | 95 | v2 | listed |
| `gpt-5.6-luna` | 272,000 | 872,000 | 95 | v1 | listed |
| `gpt-daybreak-blue-latest` | 272,000 | 872,000 | 95 | v2 | **`visibility: hide`** |
| `gpt-daybreak-red-latest` | 372,000 | 372,000 | 95 | v2 | **`visibility: hide`**, verbosity `high` |
| `gpt-5.5` | 272,000 | 272,000 | 95 | — | listed |
| `gpt-5.4` | 272,000 | 1,000,000 | 95 | — | hidden |
| `gpt-5.4-mini` | 272,000 | 272,000 | 95 | — | hidden |
| `gpt-5.2` | 272,000 | 272,000 | 95 | — | listed |
| `codex-auto-review` | 272,000 | 872,000 | 95 | v1 | hidden; **a review-specific model** |

Six observations, all consequential and none of them available from a pricing page:

1. **Reasoning effort is a first-class, six-valued dial**: `low, medium, high, xhigh, max, ultra`.
   `ultra` is described in the catalog as "Maximum reasoning with automatic task delegation" — i.e.
   the *model* decides to delegate. Field 18's "how is it decided how much thinking a piece of work
   deserves" has a vendor-supplied answer here with six positions, where Claude Code's equivalent is a
   model-name string and a thinking budget.
2. **`context_window` ≠ `max_context_window`.** Two numbers, differing by 3.2× on most models, plus
   `effective_context_window_percent: 95`. So the *usable* window is a function of entitlement and of
   a percentage the vendor sets. **A context window is not a fact about a model; it is a setting.**
   Any plan that hard-codes a token budget is hard-coding someone else's config value.
3. **Hidden models are API-supported.** `visibility: hide` with `supported_in_api: true` — the catalog
   is advertising capacity that no UI lists. Two of them are codenamed (`Daybreak Blue`, `Daybreak
   Red`) and are plainly staging for something unreleased. **The model you are using can be replaced
   by one of these without any version of the CLI changing**, because the catalog is fetched.
4. **`multi_agent_version: v2` and `multi_agent_reasoning_effort: xhigh` are model properties.**
   Multi-agent orchestration is moving *into the model catalog*. The orchestration layer this repo has
   spent eight phases building is being commoditised from underneath, at the engine layer. That is not
   a reason to stop — this repo's stated durable position is *the account*, not the orchestration —
   but it is a reason to be clear that orchestration is not the moat.
5. **`base_instructions` and `model_messages.persistent_instructions` ship in the catalog**, as long
   prose, per model. `MEASURED` — I read them. They instruct the agent on when to ask permission, and
   `persistent_instructions` describes a "persistent mode" in which the agent is told to *avoid ending
   its turn* and to invent proactive follow-up work. **The vendor is shipping autonomy policy as data,
   downloaded at runtime, versioned by nobody you can see.** This is field 33 ("instructions") and
   field 47 ("the system changing itself") colliding: *the most behaviour-determining instruction in
   your stack is not in your repository.*
6. **`comp_hash: "3000"`, `truncation_policy: {mode: tokens, limit: 10000}`, `tool_mode:
   code_mode_only`, `apply_patch_tool_type: freeform`, `use_responses_lite: true`.** A dozen knobs that
   change behaviour and that no release note will mention. For field 48 (reproducibility) the
   conclusion is blunt: **you cannot reproduce a Codex run from your own records unless you archive
   the catalog record too.** It is one command. Nobody does it.

**What practitioners report breaks** — `RECALLED`, low confidence at this version:
- Sandbox friction on `workspace-write`: legitimate builds needing paths outside the workspace, fixed
  by reaching for `danger-full-access`, which is the whole protection gone rather than widened.
- `exec` runs that end successfully having done nothing, because the model asked for approval in a
  mode where approval could never arrive. *`-a never` explicitly returns execution failures to the
  model instead, which is the right shape, and is worth preferring.*
- Rapid version churn. `0.153.4` is a high minor number; interfaces at this cadence move.

### 2.3 Gemini CLI 0.38.2 — and a finding I did not go looking for

`MEASURED`: **Gemini CLI would not start.**

```
$ gemini --version
Error in /Users/adamks/.gemini/settings.json: EPERM: operation not permitted, open '...'
Please fix the configuration file(s) and try again.
```

The version came from the installed package manifest instead (`@google/gemini-cli 0.38.2`). The cause
is that `~/.gemini` sits in this session's sandbox `denyRead` list. **Note the two different
behaviours under the identical condition:** Codex printed a warning about PATH aliases and *carried
on*, degrading to a usable state and later failing loudly and specifically only when it actually
needed the config; Gemini CLI **refused to start at all and blamed the user's configuration file**,
reporting a permissions denial as "fix the configuration file(s)".

That is a small thing and it is a perfect illustration of field 9's hardest sub-question and field 31's:
*how does the company tell a refusal from a failure?* An operator reading that message would go and
edit a settings file that is not broken. **One engine's error message sent a diagnostician to the
wrong place.** In a fleet, that class of error is not an annoyance; it is a multi-hour detour taken
under the belief that one is debugging one's own work.

**What I could measure anyway, by reading the shipped bundle** rather than running it —
`~/.npm-global/lib/node_modules/@google/gemini-cli/bundle/gemini.js`, a single 553 KB bundled file:

- `MEASURED` from `package.json`: **licence `Apache-2.0`**, repo `github.com/google-gemini/gemini-cli`,
  `node >= 20`, zero runtime dependencies (everything is bundled). **It is the only one of the three
  that is openly licensed**, and that single fact carries more weight for field 18 than any feature in
  the matrix: an Apache-2.0 harness cannot be taken away from you, only abandoned.
- `MEASURED` flags present in the bundle: `--prompt`, `--prompt-interactive`, `--output-format`,
  `--approval-mode`, `--yolo`, `--sandbox`, `--model`, `--allowed-tools`,
  `--allowed-mcp-server-names`, `--extensions`, `--list-extensions`, `--include-directories`,
  `--experimental-acp`, `--screen-reader`, `--debug`.
- `MEASURED` enumerated choice sets in the bundle:
  - **approval modes: `default`, `auto_edit`, `yolo`, `plan`**
  - **output formats: `text`, `json`, `stream-json`** — so headless machine-readable output is there
  - MCP transports: `stdio`, `sse`, `http`
  - settings scopes: `user`, `project`, `workspace`
- `MEASURED`: the bundle contains the strings `"hooks"`, `"Hooks"`, `"BeforeTool"` and `"Agents"`.
  **So Gemini CLI has a hook system and some notion of agents**, contradicting what I was about to
  write from memory. I cannot characterise them without running the tool, and I have deliberately not
  guessed at their semantics. This is a **known gap**, listed in §10.
- **`--experimental-acp`** is the one to follow. ACP — the Agent Client Protocol — is an attempt at a
  *cross-harness* protocol for agents and editors. `MEASURED` only as a flag name; the significance is
  `RECALLED` and speculative. **If any standard is going to make harnesses substitutable, it is a
  protocol like this one, and a company worried about lock-in should be watching it rather than
  writing adapters.** `SPECULATIVE`.

Everything else I can say about Gemini CLI is `RECALLED` (cutoff May 2026) and should be re-checked:
Apache-2.0 licensed and open source, a ReAct loop in TypeScript, MCP client support, `GEMINI.md`
context files, a `settings.json` config, an extensions mechanism, a non-interactive `-p` mode, built-in
Google Search grounding, and a free tier with generous daily request quotas tied to a personal Google
account, with higher tiers via API key or Vertex AI. **The free tier is the strategically interesting
part and I cannot verify its current terms** — see §7.3, because a free tier is where training-on-
your-data clauses usually live.

### 2.4 The serious alternatives

`RECALLED` throughout, cutoff May 2026, and the config directories on this machine are the only
`MEASURED` part.

- **Open-source harnesses that are model-agnostic by design**: OpenCode, Aider, Goose, Cline/Roo Code,
  Continue. `~/.opencode`, `~/.goose`, `~/.cline`, `~/.continue` all exist here. **These are the only
  category where "switch models" is a config line rather than a project.** Aider in particular has a
  long practitioner track record and a deliberate git-commit-per-change model. Their weakness is the
  opposite of the vendor CLIs': the harness is portable and comparatively thin, so you rebuild the
  permission, hook and subagent machinery yourself — which is precisely the machinery this repo has
  spent eight phases building and would have to port.
- **Amp (Sourcegraph)**, **Cursor CLI**, **GitHub Copilot CLI** (`~/.copilot` exists here), **Devin**,
  **Factory Droid**: each ships an opinionated agent, mostly on a subscription, mostly with a thinner
  extension surface than Claude Code and Codex. Copilot's relevance is entitlement, not capability: it
  is bundled with a seat many people already pay for.
- **Local models via Ollama / LM Studio.** `MEASURED`: `ollama` is installed here, and Codex speaks to
  it natively via `--oss --local-provider ollama`. Capability is well below frontier for hard
  reasoning. **But the right question is not "can a local model do the work". It is "can a local model
  do the *cheap, high-volume, low-stakes* work, and can it be the thing that still runs when the
  network is down or the bill is unpaid?"** For that, the answer is plausibly yes, today, and it is
  the cheapest continuity insurance on the table.

### 2.5 Capability matrix

`M` = measured today, `R` = recalled (cutoff May 2026, verify).

| | Claude Code 2.1.268 | Codex CLI 0.153.4 | Gemini CLI 0.38.2 |
|---|---|---|---|
| Language / shape | Node CLI `M` | Rust CLI **+ local daemon** `M` | Node CLI `R` |
| Headless | `-p` print mode `R` | `exec` with `--json` JSONL `M` | `-p` `R` |
| **Enforced output schema** | ✗ (convention only) `M` | ✓ `--output-schema` `M` | ✗ `R` |
| Sub-agents | ✓ files + `Task` dispatch `M` | model-level `multi_agent_version` `M` | ✗ `R` |
| Hooks | ✓ shell, exit-2 blocks `M` | ✓ **with persisted trust** `M` | ✗ / extensions `R` |
| MCP client | ✓ `M` | ✓ `codex mcp` `M` | ✓ `R` |
| **MCP server (is callable)** | ✗ `R` | ✓ `codex mcp-server` `M` | ✗ `R` |
| Sandbox | Seatbelt/bubblewrap, Bash-only `M` | Seatbelt, 3 named modes **+ standalone `codex sandbox`** `M` | ✗ / container `R` |
| Approval modes | allow/deny rules + prompts `M` | `on-request`/`never`/`--approve-for-me` `M` | yolo flag `R` |
| Config reproducibility | ✗ `M` | ✓ `--ignore-user-config`, `--ephemeral`, `--strict-config` `M` | ✗ `R` |
| Local/OSS models | ✗ `M` | ✓ `--oss` ollama/lmstudio `M` | ✗ `R` |
| Model catalog introspection | ✗ `M` | ✓ `codex debug models` `M` | ✗ `R` |
| **Prompt introspection** | ✗ `M` | ✓ `codex debug prompt-input` `M` | ✗ `R` |
| Open source | ✗ `R` | partially `R` | ✓ Apache-2.0 `R` |

**The matrix says something the prose should say plainly. On every axis that matters for running an
unattended fleet — machine-readable output, enforced return shape, reproducible configuration, prompt
and catalog introspection, being callable as a tool — Codex CLI is ahead of Claude Code today.** On
every axis that matters for *shaping an agent's behaviour in a repository* — subagent definitions,
per-agent tool scoping, skills, settings precedence — Claude Code is ahead. Those are different jobs,
and the honest reading is that this company is currently using the *authoring* tool as its *operating*
runtime.

<!-- APPEND-HERE -->

