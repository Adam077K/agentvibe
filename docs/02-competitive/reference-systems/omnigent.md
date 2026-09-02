# Reference system: Omnigent

Repo studied: `omnigent-ai/omnigent` (local checkout, single squashed commit `07a5d5b2`,
dated 2026-09-01, ~4,283 files). Code read directly; docs cited only where the code
agreed with them, and one place noted below where it doesn't.

---

## 1 · WHAT

Omnigent is an open-source "meta-harness" maintained by **Databricks, Inc.**
(`NOTICE`, `pyproject.toml` author, Apache 2.0) — one control-plane server that drives
Claude Code, Codex, Cursor, OpenCode, Hermes, Pi, Antigravity (Gemini), Kimi, Qwen,
Copilot, Goose, Kiro, and custom YAML/ACP agents as interchangeable back ends, reachable
from terminal, browser, phone, and a native desktop app. It carries a `status: alpha`
badge (`README.md`) but is not small: **420,836 lines of Python** under `omnigent/`,
**1,552 test files**, and a `CHANGELOG.md` with **15 tagged releases** in ~10 weeks
(v0.1.0 2026-06-13 → v0.11.0 2026-08-24) referencing PRs up to **#5377** — a large,
fast-moving team, not a side project. Current dev version `0.12.0.dev0`.

---

## 2 · THE AGENT YAML SPEC

Full field-by-field schema, from `docs/AGENT_YAML_SPEC.md` (the doc), cross-checked
against `omnigent/spec/types.py` and `omnigent/spec/parser.py` (the enforcement — a
147KB parser, so the spec is genuinely parsed and validated, not just documented).

| Field | Required? | Purpose | Enforced by |
|---|---|---|---|
| `name` | recommended | stable identifier shown in sessions/logs | `spec/parser.py` |
| `prompt` | usually | inline agent-owned system instructions | parser; composed with framework instructions in `omnigent/runtime/prompt.py` (agent-authored text stays separate from and precedes framework-appended lifecycle text — `AGENTS.md` "Framework-owned instructions") |
| `instructions` | optional | inline text or a path to an instructions file; **takes precedence over `prompt`** when set | parser |
| `executor` | recommended | harness id, model, `reasoning_effort`, `auth` block | parser; `reasoning_effort` is validated against the chosen harness's own effort vocabulary at launch |
| `tools` | optional | MCP servers, Python function tools, sub-agents (`type: agent`), `inherit`/`self` | parser + `omnigent/tools/` |
| `policies` | optional | named guardrails gating request/response/tool_call/tool_result/llm_request/llm_response | `omnigent/policies/` — see §3 |
| `params` | optional | typed user parameters exposed to tools/skills | parser |
| `os_env` | optional | enables local file/shell tools; carries the `sandbox:` block | `omnigent/inner/` — see §6 |
| `terminals` | optional | named interactive shell environments the agent can launch | parser |
| `async` | optional, default `true` | whether async work tools are exposed | parser |
| `cancellable` | optional, default `true` | whether the session can be cancelled | parser |
| `timers` | optional, default `false` | whether timer tools are exposed | parser |

`executor.harness` is an open enum (`claude-sdk`, `openai-agents`, `codex`, `cursor`,
`kiro-native`, `pi`, `antigravity`, `qwen`, `kimi`, `copilot`, `hermes`, `acp:<slug>`,
…) — see §4 for what's actually registered. Auth resolution differs per harness:
`cursor`/`antigravity`/`copilot`/`kimi` each talk to their own vendor backend and
explicitly do **not** accept `auth.type: databricks`; the doc calls this out per-harness
rather than leaving it implicit.

**Real definition, `examples/polly/config.yaml`** (an orchestrator agent that is itself
dogfooded — it delegates all coding to 7 sub-agent harnesses and never edits code
itself):

```yaml
spec_version: 1
name: polly
description: >-
  A coding orchestrator that breaks your goal into pieces and hands them
  to a team of Claude Code, Codex, OpenCode, Cursor, Hermes, Pi, and
  Antigravity sub-agents to build. ...
spawn: true          # registers sys_session_create — polly can author and
                      # launch NEW agent configs at runtime, not just its
                      # declared sub-agents
executor:
  type: omnigent
  context_window: 1000000
  config:
    harness: claude-sdk
    smart_routing_harness: auto   # a pinned brain would strand codex/pi workers
prompt: |
  You are polly, a multi-agent CODING orchestrator. ... your one hard rule:
  you do NOT write code — ALL coding work gets delegated. ...
```

The sub-agent tool form (`docs/AGENT_YAML_SPEC.md`, confirmed against `omnigent/tools/`):

```yaml
tools:
  reviewer:
    type: agent
    description: Review proposed code changes.
    prompt: |
      You are a careful code reviewer. Focus on correctness, tests, security,
      and maintainability.
    executor:
      harness: claude-sdk
      model: databricks-claude-sonnet-4-6
    os_env: inherit
    pass_history: true
    max_sessions: 2
```

Each sub-agent tool picks its **own** `executor.harness`, so one spec can mix vendors —
polly's `coder` sub-agent runs `harness: cursor` beside a `claude-sdk` brain.
`max_sessions` caps how many live children of that tool one parent may hold open —
this is the one true "sub-agent fan-out cap" in the spec (distinct from the
tool-call-count policy in §3).

---

## 3 · POLICY AS CODE

Central finding: policies are typed Python callables (`omnigent/policies/schema.py`)
registered by dotted import path, declared at three YAML levels, and composed by one
engine (`omnigent/runtime/policies/engine.py`) with a fixed, explicit precedence.

### Where they live and how they're declared

`.omnigent/policies/` is not a real directory in this repo — policies are Python
modules under `omnigent/policies/builtins/` (`safety.py`, `cost.py`, `github.py`,
`google.py`, `working_dir.py`, `risk_score.py`, `routing.py`, `orchestration.py`,
`prompt.py`, `cel.py`, `_shell.py`) referenced from YAML by `handler:` dotted path:

```yaml
policies:
  budget:
    type: function
    handler: omnigent.policies.builtins.cost.cost_budget
    factory_params:
      max_cost_usd: 5.00
      ask_thresholds_usd: [1.00, 3.00]
      expensive_models: ["opus", "gpt-5"]
```
(`docs/POLICIES.md:246-260`)

A policy is either a **direct callable** (no params) or a **factory** (called once at
build time with `factory_params:` to produce the evaluator closure) — the registry
(`omnigent/policies/registry.py`) tells them apart by inspecting the handler's
signature, and `omnigent/policies/function.py` is what actually invokes it per event
and coerces its return into a typed `PolicyResult`.

### The event/response contract (`omnigent/policies/schema.py`)

Every policy is a function `PolicyEvent -> PolicyResponse | None`:

- `PolicyEvent.type`: one of `request`, `tool_call`, `tool_result`, `response`,
  `llm_request`, `llm_response` — six distinct enforcement phases, not just "before a
  tool call."
- `PolicyEvent.context`: `actor` (who), `usage`/`subtree_usage` (cumulative token/cost
  counters, session-only vs. whole spawn-tree), `user_daily_cost`, `model`, `harness`,
  `labels`.
- `PolicyEvent.session_state`: a mutable per-session dict a policy can read; it never
  writes this dict directly — it returns `state_updates` (`set`/`increment`/`delete`/
  `append` ops) and the engine applies them.
- `PolicyResponse.result`: `ALLOW | DENY | ASK` (`None` return = abstain = ALLOW).
  `reason` (shown to the user on ASK, logged on DENY), `data` (a replacement payload —
  e.g. a PII-redacted version of the same tool call, fed forward to the next policy in
  the chain), `state_updates`, `set_labels` (filtered through a per-policy label
  whitelist).

### Composition and precedence — the actual mechanism

`omnigent/runtime/policies/builder.py:290-301` states it in the docstring, and the
ordering is literally the order the list is built in:

> "Policy run order: session policies (from the CRUD API) first, then agent spec
> policies, then default_policies (server-wide admin policies). This lets
> user-configured session policies short-circuit on DENY before agent or admin
> policies... For sub-agent conversations, session policies from the ROOT conversation
> are always applied first ... before any child-specific session policies."

So precedence when levels disagree is **not** "most restrictive wins" or "server
overrides agent" — it's strict declaration order, session-first:

```
[session policies (root conversation's, then this conversation's)]
  → [agent-spec policies, YAML declaration order]
    → [server-wide default policies]
```

and the loop that walks this list (`omnigent/runtime/policies/engine.py:283-406`,
`_evaluate_composed`) is a **first-DENY-wins** short-circuit:

```python
for policy in self.policies:
    if not self._should_fire(policy.spec, ctx):
        continue
    result = await _dispatch_policy(policy, ctx, context)
    ...
    if result.action == PolicyAction.DENY:
        return self._compose_deny(policy.spec.name, result.reason,
                                   accumulated, accumulated_state, read_only=read_only)
    ...
    if result.action == PolicyAction.ASK:
        ask_reasons.append(f"{policy.spec.name}: {result.reason or 'approval required'}")
        deciding_ask_policies.append(policy.spec.name)
```

DENY stops the loop immediately (a session policy can veto before the agent's own
policies even run). ASK doesn't short-circuit — it **accumulates**: every remaining
policy still evaluates, and if any later one DENYs, that DENY wins outright over the
earlier ASK. Only if nothing DENYs does the composed result become ASK (all accumulated
reasons joined) or, if nothing ASKed either, ALLOW. Label/state writes from ASK-ing
policies are **withheld** until the human approves (`engine.py:378-383` — "DO NOT apply
label writes or state updates here... preserving the 'no side effects from a denied
ASK' invariant").

### Cost/spend budget — `omnigent/policies/builtins/cost.py`, factory `cost_budget`

Fires on two phases: `request` (before the LLM turn even starts, so a text-only turn
with no tool call is still budgeted) and `tool_call` (the point a native `PreToolUse`
hook can still block before the action runs). Two independent gates in one policy:

- `ask_thresholds_usd` (soft): the first time cumulative `total_cost_usd` crosses each
  checkpoint, ASK; approving records the highest-approved checkpoint in
  `session_state` so it never re-asks below that point, and a decline blocks just that
  one turn/call without recording anything (next call over the same line re-asks).
- `max_cost_usd` (hard): once crossed, it does **not** stop the session — it DENYs
  *only while the session is on an "expensive" model* (`expensive_models`, default
  substring-matches Opus/GPT-5-non-mini/Fable), telling the user to `/model` down.
  Once switched to a cheap model it's allowed again — "a downgrade gate, not a hard
  stop" (module docstring, `cost.py:1-30`).
- **Fail-closed on unpriced models**: `_usage_is_unpriced()` (`cost.py:118-135`) — if
  token counters are non-zero but `total_cost_usd` is absent (model has no catalog
  price), the gate can't score spend at all, so instead of silently allowing unbounded
  spend at `$0` it returns an `ASK` demanding the user switch models or explicitly
  approve running unmetered.

A second variant, `user_daily_cost_budget`, applies the identical ASK/downgrade logic
but against the session **owner's** cross-session UTC-day spend, meant to be declared
once server-wide as a per-user daily cap.

### Max-tool-calls cap — `omnigent/policies/builtins/safety.py:100-133`

```python
def max_tool_calls_per_session(limit: int = 100) -> PolicyCallable:
    def evaluate(event: PolicyEvent) -> PolicyResponse:
        if event.get("type") != "tool_call":
            return _ALLOW
        state = event.get("session_state") or {}
        count = int(state.get("_policy_tool_call_count", 0) or 0)
        if count >= limit:
            return {"result": "DENY",
                    "reason": f"Exceeded {limit} tool calls this session"}
        return {"result": "ALLOW",
                "state_updates": [{"key": "_policy_tool_call_count",
                                    "action": "increment", "value": 1}]}
    return evaluate
```

Purely session-scoped, in-memory counter, no per-turn reset (that variant is a
documented pattern in `examples/_shared/rate_limit_policy.py`, mentioned but not
built in, per `omnigent/policies/base.py:76-80`). A companion `detect_loop()` factory
(`safety.py:143+`) hashes `(tool_name, arguments)` and ASKs when the same call repeats
`threshold` times within a sliding `window` — "the #1 token-waste pattern" per its
docstring, something a raw call-count cap can't catch.

### Approval gate — `omnigent/runtime/policies/approval.py`

An ASK result is handed to `_await_elicitation()`, which speaks **MCP's elicitation
primitive verbatim** rather than inventing a bespoke approval wire format:

1. Registers a row in the same `pending_tool_calls` table client-side tool calls use,
   tagged with sentinel `tool_name = "__elicitation__"` so the dispatch route doesn't
   try to hand it to a tool.
2. Emits an SSE event `response.elicitation_request` on the session's stream, whose
   `params` shape mirrors MCP's `ElicitRequestFormParams` field-for-field
   (`approval.py:12-16`) — any MCP-aware client can render the approval UI without a
   translation layer.
3. Parks on the `tool_result` topic, honoring a per-policy or spec-wide
   `ask_timeout` (`spec.types.DEFAULT_ASK_TIMEOUT`).
4. Verdict parsing is strict: `_is_accept()`/`_is_decline()` (`approval.py:301-347`)
   only return `True` on an **exact** `action == "accept"` / `action == "decline"`
   string; anything else — malformed JSON, a missing field, timeout, a stray value —
   resolves to declined/DENY. Fail-closed by construction, not by convention.
5. `state_updates`/`set_labels` accumulated during the ASK are applied **only** on
   accept (§ above).

**Net effect on precedence**: because DENY short-circuits before ASK is even reached
for later policies, a session-level DENY always beats an agent-level ASK; but an
agent-level ASK that nobody later DENYs still blocks on human approval even if the
server-wide default policies would have ALLOWed it outright — the human is asked
whenever *any* policy in the chain wants to ask, unless a stricter one further down
vetoes first.

---

## 4 · THE HARNESS ABSTRACTION

Two abstraction layers, not one.

**Layer 1 — the executor contract**, `omnigent/inner/executor.py`, abstract class
`Executor` (no `ABC`/`Protocol` decorator, plain subclass-and-override):

```python
async def run_turn(self, messages, tools, system_prompt, config=None) -> AsyncIterator[ExecutorEvent]
def supports_streaming(self) -> bool
def supports_tool_calling(self) -> bool
def handles_tools_internally(self) -> bool
def max_context_tokens(self) -> int | None
async def close_session(self, session_key: str) -> None
async def interrupt_session(self, session_key: str) -> bool
async def enqueue_session_message(self, session_key, content) -> bool
def supports_live_message_queue/tool_boundary_interrupt/stepwise_internal_turns() -> bool
async def close(self) -> None
```

`run_turn` yields a typed `ExecutorEvent` union (`TextChunk`, `ReasoningChunk`,
`ToolCallRequest`, `ToolCallComplete`, `TurnComplete`, `CompactionStarted/Complete`,
`SubAgentStarted/Completed`, `ExecutorError`, …). `MockExecutor` is the reference
implementation used in tests. An `Executor` is then wrapped into a FastAPI process by
`ExecutorAdapter` (`omnigent/runtime/harnesses/_executor_adapter.py`), which is the
second, process-boundary contract every SDK/CLI/ACP adapter must actually satisfy:
export a module-level `create_app() -> FastAPI`.

**Layer 2 — the registry**, `omnigent/harness_plugins.py`: `_BUILTIN_CAPABILITIES`
declares one `HarnessCapabilities` row per harness id, keyed by an `IntegrationMode`
enum (`omnigent/harness_capabilities.py`) with four values: `SDK_IN_PROCESS`,
`CLI_SUBPROCESS`, `ACP_SUBPROCESS`, `NATIVE_TUI` (plus `NATIVE_SERVER`). ~21 harness ids
are registered. `harness_modules()` maps each id to a Python module path (e.g.
`"antigravity": "omnigent.inner.antigravity_harness"`).

**Dispatch path**: for a server-backed harness, `HarnessProcessManager`
(`omnigent/runtime/harnesses/process_manager.py`) resolves the id through
`_HARNESS_MODULES` and spawns a child process
(`python -m omnigent.runtime.harnesses._runner --harness <name> --module <path>
--socket <unix-sock> --conversation-id <id>`); the child imports the module, calls
`create_app()`, and binds it to a per-conversation Unix socket the parent talks to over
httpx. Native-TUI harnesses (the `*-native` ids) instead go through
`omnigent/native_dispatch.py` into a runner-owned tmux terminal rather than a socket —
the point being a resident vendor CLI (Claude Code, Codex) is treated as a driven
terminal, not a service.

**Shipped adapter pattern by integration mode** (one file family per vendor, counted
via `find omnigent -name "*_native*.py"`): `<vendor>_native.py` ×12,
`<vendor>_native_bridge.py` ×11, `<vendor>_native_forwarder.py` ×8,
`<vendor>_native_permissions.py` ×6 — adding a vendor means filling the same slots
(an `Executor` subclass or ACP shim, a bridge/forwarder/permissions triple, and one
`HarnessCapabilities` row), never a bespoke pipeline:

- **SDK-in-process**: `claude-sdk`, `antigravity`, `openai-agents` — direct Python SDK
  wrapped by an `Executor` subclass, e.g. `omnigent/inner/claude_sdk_executor.py`.
- **CLI-subprocess**: `codex`, `pi` — drives the vendor CLI's own app-server/JSON-RPC
  protocol per turn.
- **ACP-subprocess**: generic `acp:<slug>` plus `goose`, `qwen`, `hermes`, `kimi`,
  `opencode` — bridged through one shared `omnigent/inner/acp_executor.py` +
  `acp_harness.py`, vendor list in `omnigent/acp_cli_harnesses.py`.
- **Native-TUI** (`*-native`): wraps a resident terminal program the human can also
  attach to and take over, rather than a headless service.

**Gemini specifically is already shipped, as two separate adapters** — this directly
answers "could this drive gemini":

1. `antigravity` (SDK-in-process): `AntigravityExecutor(Executor)`
   (`omnigent/inner/antigravity_executor.py`) wraps the `google-antigravity` SDK
   in-process, `handles_tools_internally() -> True`, streams
   `agent.conversation.receive_steps()` into `ExecutorEvent`s, auth via a Gemini API
   key or Vertex AI project/location — Gemini-native, no OpenAI-compatible gateway.
2. `antigravity-native` (NATIVE_TUI): treats the `agy` CLI as a resident terminal like
   `omnigent codex`; read path via connect-RPC trajectory steps
   (`omnigent/antigravity_native_reader.py`), write path via the connect-RPC
   `SendUserCascadeMessage` method (`omnigent/inner/antigravity_native_executor.py`),
   not tmux keystroke injection.

For a **new** model family that has no CLI at all, the SDK-in-process path is the
template: subclass `Executor`, implement `run_turn` over that vendor's SDK, wrap in
`ExecutorAdapter`, add one `HarnessCapabilities` row. For a vendor that ships only a
CLI, the ACP-subprocess path (already generic) is the template if that CLI speaks ACP,
otherwise CLI-subprocess if it has its own app-server protocol worth wrapping.

---

## 5 · CONTROL PLANE

**Server**: `omnigent/server/app.py`, `create_app(agent_store, file_store,
conversation_store, artifact_store, agent_cache, ...)` — a **FastAPI** (Starlette)
factory wiring routers to stores. Actual process entry is `omnigent/cli.py`, which
configures `uvicorn.Config` and a custom `_ShutdownSignalingServer` that signals SSE
subscribers before shutdown. Routes are split by concern under
`omnigent/server/routes/` (`sessions/` sub-package: `routes_core.py`,
`routes_events.py`, `routes_items.py`, `routes_permissions.py`, `routes_hooks.py`,
`routes_elicitations.py`, …).

**Session/conversation model**: `omnigent/stores/conversation_store/` (interface +
`sqlalchemy_store.py`), ORM models in `omnigent/db/db_models.py`, documented in
`omnigent/server/DBSPEC.md` as 17 tables — `agents`, `conversations`,
`conversation_items`, `conversation_labels`, `policies`, `session_permissions`,
`projects`, `hosts`, `users`, `user_daily_cost`, `scheduled_tasks`, etc.
`SqlConversation` carries `parent_conversation_id`/`root_conversation_id` (this is the
literal DB shape of the sub-agent spawn tree the cost/session policies in §3 route
through) and a `session_overrides` JSON blob. Schema is Alembic-migrated
(`omnigent/db/migrations/`). Default engine is **SQLite** (`omnigent/db/utils.py`,
WAL mode); production paths use **Postgres**, including a Databricks-managed-Postgres
("Lakebase") variant with per-connection OAuth refresh. `cloudflare_d1` is also
recognized for feature-gating. One documented dropped table: `tasks` (a DBOS-backed
workflow-execution table, removed by migration `b9c1d2e3f4a5_drop_tasks_table`) — live
turn/steering state now lives **in-memory in the runner process**, only a coarse
`live_status` mirror persists to the DB.

**Transport**: confirmed **SSE** for the session event feed —
`GET /sessions/{session_id}/stream` (`omnigent/server/routes/sessions/routes_events.py`)
returns a `text/event-stream` `StreamingResponse`; the approval flow's own doc-comment
(`omnigent/runtime/policies/approval.py:26-30`) cites `designs/SERVER_HARNESS_CONTRACT.md`
for the wire contract, but **that file does not exist in this checkout** — a dead
citation, code and docs disagree here, trust the code. Separate **WebSocket**
endpoints (`terminal_attach.py`, `runner_tunnel.py`, `host_tunnel.py`) carry PTY
attach and host-tunnel traffic, distinct from the per-session SSE feed.

**Reaching a session from a phone**: `web/ios/` is a native Swift/SwiftUI app
(`Omnigent.xcodeproj`), `web/android/` a native Kotlin/Gradle app — both separate
codebases from the browser client, all three (plus `web/electron` desktop) talking to
the same REST + SSE + WebSocket surface on one FastAPI server. `web/src` is React
18 + Vite, shared between browser and Electron.

**Deployment targets** (`deploy/`, 18 subdirs): `blaxel`, `boxlite`, `cloudflare`,
`cwsandbox`, `databricks`, `daytona`, `docker`, `e2b`, `fly`, `hf-spaces`, `islo`,
`kubernetes`, `modal`, `openshell`, `railway`, `render`, `tailscale` — the control
plane is designed to be self-hosted essentially anywhere.

---

## 6 · SANDBOXING

Two distinct axes that are easy to conflate:

**Axis 1 — OS-level tool-call isolation** (`os_env.sandbox.type`), one backend per
platform, `omnigent/inner/{bwrap_sandbox,seatbelt_sandbox,windows_jobobject_sandbox}.py`:

- `linux_bwrap` — bubblewrap + a hardened seccomp profile; `resolve()` hard-fails off
  Linux (`bwrap_sandbox.py:312-314`) and if the `bwrap` binary is missing from `PATH`.
- `darwin_seatbelt` — writes an SBPL profile to a mode-0600 tempfile, runs under
  `sandbox-exec -f`; macOS only.
- `windows_jobobject` — Job Object process-tree containment **only**; its own
  docstring says `read_paths`/`write_paths`/`allow_network` are "advisory... not
  enforced" on this backend — the one place the sandbox story is honestly weaker.

`type: auto` (or omitted) resolves at **parse time**
(`omnigent/inner/sandbox.py:1172-1231`, `_default_sandbox_for_platform`) to
Linux→bwrap, macOS→seatbelt, Windows→jobobject — never by probing for the binary; a
missing binary fails later, inside that backend's own `resolve()`.

**Axis 2 — where the whole agent host runs** (`deploy/{e2b,daytona,modal,cwsandbox,
blaxel,boxlite,islo,openshell}`): each provisions a disposable cloud machine running an
entire Omnigent host process, CLI-launched (`omnigent sandbox create`) or
server-managed. `deploy/modal/README.md` states the distinction explicitly: Modal is
both a server-deploy target and a sandbox provider, "independent" of each other. The
OS-level bwrap/seatbelt/jobobject sandbox in Axis 1 still runs *inside* whichever host —
local laptop or cloud machine — actually executes the tool calls.

**Credential proxy** (`sandbox.credential_proxy`, `designs/SANDBOX_CREDENTIAL_PROXY.md`,
`omnigent/inner/credential_proxy.py`): a mandatory L7 egress proxy that attaches real
credentials on the way out rather than putting them inside the sandbox. Default mode
swaps in the real `Authorization` header on an unauthenticated request to a bound host;
an opt-in placeholder mode mints random `oa_cred_*` tokens that 403 if presented to any
host other than the one they're bound to. Requires `egress_rules` and a
network-isolating backend — only `linux_bwrap`/`darwin_seatbelt` qualify;
`credential_proxy` is rejected outright on `windows_jobobject`/`none`
(`omnigent/inner/loader.py:774,803`). One vendor-specific hard rule:
`credential_proxy: databricks_cli` requires `linux_bwrap` specifically — "the Go CLI
ignores `SSL_CERT_FILE` on macOS, so `darwin_seatbelt` is rejected"
(`docs/AGENT_YAML_SPEC.md:257-262`).

---

## 7 · STEAL

1. **Session-first, then-agent, then-server policy precedence with first-DENY-wins,
   ASK-accumulates composition.** `omnigent/runtime/policies/builder.py:290-301` (order)
   + `omnigent/runtime/policies/engine.py:283-406` (`_evaluate_composed`, the loop).
   Mechanically: build one ordered list — root session policies, then this session's
   own, then agent-spec policies in YAML order, then server defaults — walk it once per
   event, return immediately on the first `DENY`, collect `ASK` reasons but keep
   walking (a later DENY still wins), apply accumulated label/state writes only on the
   final ALLOW or on human-approved ASK. This gives you exactly the composability
   `.claude/qa-tier-floor.yml` wants without a bespoke merge function per gate.

2. **The `PolicyEvent`/`PolicyResponse` typed contract as the one seam all guardrails
   share.** `omnigent/policies/schema.py`. Six phases (`request`, `tool_call`,
   `tool_result`, `response`, `llm_request`, `llm_response`), one `ALLOW|DENY|ASK`
   response shape carrying `reason`, `data` (a replacement payload, chained forward to
   the next policy — this is how a PII-redaction policy and a cost policy compose
   without knowing about each other), `state_updates` (four ops: set/increment/
   delete/append, applied by the engine, never mutated directly), `set_labels`
   (filtered through a declared whitelist). Every builtin — cost, rate-limit,
   loop-detection, GitHub/Google scoping, PII — is *one function* against this same
   contract; reimplementing this contract is more valuable than any single builtin.

3. **Fail-closed on the thing you can't measure, not fail-open.** `cost_budget`'s
   `_usage_is_unpriced()` (`omnigent/policies/builtins/cost.py:118-135`): if a model has
   no catalog price, cost would silently score `$0` forever — instead of allowing that,
   it ASKs the user to either switch to a priced model or explicitly approve running
   unmetered. Same instinct as this repo's Rule 10 ("a resolver never passes what it
   could not check") — worth stealing the specific pattern of *detecting* the
   un-measurable case, not just documenting that it exists.

4. **MCP elicitation as the approval wire format, not a bespoke one.**
   `omnigent/runtime/policies/approval.py`. An ASK parks a row in the same table
   client-tool-calls use (tagged with a sentinel name so the dispatcher skips it),
   emits an SSE event whose params match MCP's `ElicitRequestFormParams` field-for-
   field, and resolves strictly — only an exact `action == "accept"` string is a yes;
   everything else (malformed JSON, timeout, missing field) is a no
   (`approval.py:301-347`). Reusing an existing protocol's shape means any MCP-aware
   client renders the approval UI with no translation layer, and the strict-string
   check is the cheap, auditable way to make "ambiguous means deny."

5. **One naming convention makes "add a new harness" mechanical.** Confirmed by
   counting: `<vendor>_native.py` ×12, `_bridge.py` ×11, `_forwarder.py` ×8,
   `_permissions.py` ×6 across `omnigent/`. A contributor adding vendor #13 fills the
   same slots every prior vendor filled (one `Executor` subclass or ACP shim, a
   bridge/forwarder/permissions triple, one `HarnessCapabilities` row in
   `omnigent/harness_plugins.py`) rather than inventing a new pipeline shape. Worth
   stealing as a structural discipline even at much smaller scale — it's what makes
   "could this drive a new CLI" answerable by pattern-matching instead of design work.

---

## 8 · REJECT

We are one founder on one Mac. Refuse:

- **The multi-cloud sandbox-provider matrix** (`deploy/{e2b,daytona,modal,blaxel,
  boxlite,islo,openshell,cwsandbox}`, 8 providers). This exists because Databricks
  customers need disposable enterprise compute for agent sessions at scale. A solo
  founder needs zero of these — `os_env.sandbox: darwin_seatbelt` (already Agentvibe's
  situation, see `SANDBOX.md`) is the whole story.
- **Three separate native client codebases** (iOS/Swift, Android/Kotlin, plus the React
  web/Electron app) to reach a session "from a phone." That's a real mobile engineering
  team's output. If phone access is ever wanted, a responsive web session view is the
  entire budget for it — not a native app per platform.
- **The 17-table conversation/policy/host/scheduling schema with Alembic migrations
  and a Postgres/SQLite/Cloudflare-D1 dialect abstraction.** Built for multi-tenant,
  always-on hosting (`omnigent/server/README.md`: "the managed, multi-tenant, always-on
  way to deploy agents"). A single-operator harness has no multi-tenancy to schema for.
- **The `ACP_SUBPROCESS`/`SDK_IN_PROCESS`/`CLI_SUBPROCESS`/`NATIVE_TUI` four-mode
  registry supporting 21 harness ids simultaneously.** Steal the *naming convention*
  (§7.5), not the breadth — Agentvibe drives one harness (Claude Code) today; building
  out unused adapter slots for Codex/Cursor/Goose/Kimi/Qwen/Copilot/Hermes ahead of
  actual need is exactly the kind of scope this repo's own `CLAUDE.md` keeps calling out
  as "declared and unconnected."
- **Scheduled-task infrastructure with per-firing cost budgets, device-grant OAuth
  flows, org-wide SSO/OIDC.** All enterprise-deployment weight; irrelevant until there
  are other people to grant access to.

---

## 9 · ABANDONED

Only one git commit exists in this checkout (a squashed snapshot), so real history has
to come from `CHANGELOG.md` (971 lines, 15 tagged releases, v0.1.0 2026-06-13 →
v0.11.0 2026-08-24). No entry describes dropping an entire CLI-harness vendor —
removals are narrower: CLI subcommands, env vars, packaging extras, and one UI feature
that was added and then reverted.

- **The `omnigent[memory]` package extra** — a multi-release saga. Dropped by an
  earlier PR (#2605, undated in this file), restored in v0.6.0 as "a backwards-compat
  alias" with an explicit warning it "will be removed in 0.70" (`CHANGELOG.md:861`),
  then actually removed in **v0.11.0** (2026-08-24, `CHANGELOG.md:68`), replaced by
  `omnigent[hindsight]`. Even a deprecation with a stated target version took 5+
  releases to actually clear.
- **`OMNIGENT_ACCOUNTS_ENABLED`** env var removed in favor of `OMNIGENT_AUTH_ENABLED`
  (v0.7.0, `CHANGELOG.md:703`).
- **Shared-session approval authority + message attribution**: shipped (#2150 stack),
  then **reverted** by #4318 — "session approvals are once again available to any
  shared editor" — reported at both v0.9.0 (`CHANGELOG.md:386`) and again at v0.10.0
  (`CHANGELOG.md:140`), i.e. the revert itself needed a follow-up note. The one clear
  case of a shipped feature actually being pulled back out, not just deprecated.
  Note for us: even Databricks' team shipped a permission-model feature that turned out
  wrong in production and had to revert it — evidence that access-control UX is easy to
  get wrong even with resources.
- **`omni server start` removed**, replaced by `omni server --background` (v0.7.0,
  `CHANGELOG.md:651`) — then **partially un-abandoned**: v0.9.0 restores it as "a
  deprecated alias... fixing 'Start locally' on desktop clients older than v0.7.0"
  (`CHANGELOG.md:294`). A removal that broke an older client shipped separately, so it
  came back as a compat shim.
- **`omni integration slack start`** removed for `--background` (v0.7.0,
  `CHANGELOG.md:667`), same pattern as the server command.
- **Per-harness `<x>_args` config keys** deprecated in favor of one uniform
  `extra_args`, explicitly "slated for removal in 0.9.0" (v0.8.0, `CHANGELOG.md:411`).
- **Browser PWA install support** removed, along with its "new version available"
  prompt — desktop/mobile native apps are now the only installable clients (v0.10.0,
  `CHANGELOG.md:229`).

No "Phase N rewrite" language appears anywhere in the changelog — unlike this repo's
own phase-numbered history, Omnigent's public log reads as continuous incremental
delivery rather than named replatforming events.
