# Capability — the MCP surface, and knowing when you are out of your depth

*Two founder-directed changes to the seven-engine roster. Both are specified. One of them
contradicts the design on disk, and that contradiction is stated in §7 rather than smoothed over.*

**Date:** 2026-08-14 · **Roster:** `orchestrator · builder · designer · reviewer · sourcer ·
instrument · operator` · **Priors:**
[GRANT-HOLDERS.md](GRANT-HOLDERS.md) §7-§8 · [ROSTER-SIZE.md](../ROSTER-SIZE.md)

---

## 0. The three measurements that change the answer before any argument starts

Everything below rests on these. Each is a command run on 2026-08-14 in this repo or on this
machine, not a recollection.

**M1 — Seven of the fifteen connected MCP servers are already granted to everything, and no file
in this repo can revoke them.**

```
$ python3 -c "import json,os; d=json.load(open(os.path.expanduser('~/.claude.json'))); \
              print(list(d['mcpServers'].keys())); print(d['claudeAiMcpEverConnected'])"
['stitch', 'refero', 'miro', 'runpod', 'playwright', 'higgsfield', 'mem0', 'pencil']
["claude.ai Figma", "claude.ai n8n", "claude.ai Google Drive", "claude.ai Gmail",
 "claude.ai Google Calendar", "claude.ai Higgsfield", "claude.ai Notion"]
```

Two different mechanisms, and only one of them is a file. The eight under `mcpServers` are local
stdio/http servers declared in user-scope config — those are what an agent file's `mcpServers:`
frontmatter resolves against. The seven under `claudeAiMcpEverConnected` are **account-level OAuth
connectors**. They arrive with the session because the account authorised them. Naming one in
`mcpServers:` grants nothing new; omitting it denies nothing. `bin/warroom:235,237` launches every
pane as a **main-thread** session, so on the surface the seven engines actually run on, Gmail,
Notion, Figma, Google Calendar, Google Drive, n8n and Higgsfield are already universal today.

> **The founder's instruction is, for roughly half the surface, a description of the status quo
> rather than a change to it — and GRANT-HOLDERS §6.2's all-`never` co-residence matrix was written
> as though that were not so.** That is a defect in the prior document, found here, and it is
> independent of what the founder decides.

**M2 — The per-agent MCP grant surface that already binds is `tools:`, not `mcpServers:`.**

```
$ grep -n "mcp__" ~/.claude/agents/*.md | grep "^.*:4:tools:"
~/.claude/agents/planner.md:4:tools: Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*
~/.claude/agents/phase-researcher.md:4:tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
~/.claude/agents/project-researcher.md:4:tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
```

The harness parses those and reports them verbatim in this session's agent roster (`planner` →
*"Tools: Read, Write, Bash, Glob, Grep, WebFetch, mcp__context7__*"*). So a per-agent MCP grant is
expressible **today**, at `mcp__<server>__<tool>` granularity, in a field every agent file already
has — and `context7` is not in `~/.claude.json`, so those three files are carrying exactly the
decorative grant that `schema-lint.js` was built to refuse, in the one field it does not check.

**M3 — Both guards are bypassable by writing the grant into the other field.**

`schema-lint.js:280-282` checks only that `tools` is a YAML list. `scripts/check-registration.mjs`
never reads `tools` at all. `schema-lint.js:296-305` guards `mcpServers:` and nothing else.
Therefore `tools: [Read, Glob, Grep, Bash, mcp__supabase__*]` on `reviewer.md` — the read-only
engine — passes `npm run lint` and `check:registration` today, both green.

> Fix M3 **before** anything else in §8. A guard on one of two equivalent fields is not a guard; it
> is a convention with a lint attached.

**M4 — An agent file can also carry `disallowedTools:`, the denial is MCP-aware, and it is
fail-closed. This is new, and it is what makes the founder's instruction workable.**

GRANT-HOLDERS §1 states that *"a denial is settable per dispatch and therefore never earns a file."*
The first half is right and the second half is incomplete — a denial is settable **in the file too**.
From the same binary, verbatim:

```
agent() opts.bashCommandClamp can bind nothing: the spawned agent's resolved tool pool has no
<Bash> (removed by this spawn's disallowedTools, the agent definition's denies, or absent from
the session pool). A clamp on a Bash-less agent … refusing the spawn rather than running a
blind agent.

workflow agent(): disallowedTools mcp entry '…' covers this agent's declared frontmatter MCP
server '…' … spawn, after this check, and the deny is applied to them then

' cannot match … server. Use 'mcp__<server>' to deny one server's tools ('mcp__<server>__<tool>'
for one tool), or 'mcp__*' to deny every MCP server's tools. Refusing the spawn rather than
running it un-narrowed.

… must match the normalized server spelling exactly, mcp__ prefix and case included. Refusing the
spawn rather than running it with this deny silently dropped.
```

Four things follow, each of which the prior documents could not have known:

1. **`disallowedTools:` is an agent-file frontmatter field.** The plugin-agent loader parses it
   (`let U = c.disallowedTools !== void 0 ? …` in the decompiled loader, adjacent to the
   `permissionMode`/`hooks`/`mcpServers` warning), and the clamp error names *"the agent
   definition's denies"* as a distinct source from *"this spawn's disallowedTools."*
2. **A subagent's tool pool is the session pool minus denies** — *"absent from the session pool"* is
   the third listed cause. This is the mechanism behind M1: the account-level connectors are in the
   session pool, so they reach a subagent unless something removes them.
3. **Server-level denial exists and is stable against vendor additions.** `mcp__claude_ai_Gmail`
   denies that server's tools — all of them, including tools the vendor ships next month. This is
   the one denial form that does not fail open on a vendor release, and §2.1's argument against
   denylists does not apply to it.
4. **Both the spawn surface and the file surface refuse rather than degrade.** *"Refusing the spawn
   rather than running it un-narrowed"* appears four times; a misspelled server is refused rather
   than *"silently dropped."* A denial that cannot be applied is a failed spawn, not a quiet grant.

---

## 1. The two instructions, quoted

> *"all of them get all the MCPs to use (we need to think what to add to the mcps list: supabase,
> vercel, higgsfield, mem0, miro, playwright, notion, and more)."*

> *"it's very important that you will give the awareness for the agents — if they are doing some
> different job that they don't have any knowledge or expertise on, they can look for skills in the
> web, or send an agent to search photos and then use the skill, or do research to get more
> knowledge on the topic … They can also use playwright whenever they want to search something on
> the web."*

Part A answers the first. Part B answers the second.

---
---

# PART A — THE MCP SURFACE

## 2. The unit of grant is the tool, not the server

The instruction says *"all the MCPs"*. Taken at the server level it is one decision for fifteen
servers with wildly different consequences. Taken at the tool level it decomposes cleanly, and the
decomposition costs nothing, because **the runtime already addresses MCP at tool granularity in
both directions**:

| Surface | Syntax | Fails | Evidence |
|---|---|---|---|
| **Grant** — agent file `tools:` | `mcp__server__*`, or an exact tool name | **closed** (an allowlist) | M2 |
| **Denial** — agent file `disallowedTools:` | `mcp__server`, `mcp__server__tool`, `mcp__*` | **closed at the spawn**; open against servers added later | M4 |
| **Denial** — dispatch `disallowedTools` | same | **closed at the spawn** | ROSTER-SIZE §1; M4 |
| **Denial** — workflow surface | same, and it *"covers this agent's declared frontmatter MCP server"* | closed | M4, verbatim |
| Permission rule in `settings.json` | `mcp__server`, `mcp__server__*` — **parenthesised patterns refused** | inert under `--dangerously-skip-permissions` | binary: *"MCP rules do not support patterns in parentheses … use `mcp__…__*` for all tools"* |

Three consequences follow, and they decide the whole of Part A.

**2.1 — A tool-name denylist fails open on every vendor release; a server-name denylist does not.**
`mcp__higgsfield__confirm_billing_purchase` denies one tool and nothing else, so when Higgsfield
ships a ninety-first tool it arrives allowed. `mcp__higgsfield` denies the server, including
everything shipped later. Higgsfield exposes ~90 tools in this session, Notion ~28, Gmail ~28,
runpod ~45 — enumerating those is a maintenance surface with a fail-open failure mode; naming the
server is one line that stays correct. **Where a whole server must be withheld, withhold the server.
Reserve tool-name granularity for the servers an engine genuinely needs half of** (Higgsfield for
`designer`, Gmail for `operator`).

**2.2 — A denial that cannot be applied is a refused spawn, not a quiet grant.** Four separate
error strings end *"Refusing the spawn rather than running it un-narrowed"*, and a misspelled server
name is refused rather than *"silently dropped"* (M4). This matters more than it looks: it means a
capability boundary expressed as a denial is auditable — it either binds or the spawn fails loudly —
which is the property GRANT-HOLDERS §6.3 assumed only a grant had.

**2.3 — Read-scoped vs write-scoped is the real line, and only three servers can enforce it
server-side.** Supabase (`--read-only` → *"executes all queries as a read-only Postgres user"*),
Stripe (restricted keys), GitHub (`--read-only`). For every other server the read/write split exists
only as a tool-name partition, enforced by our allowlist and by nothing else. That is a weaker
control and must be labelled as one wherever it is used.

---

## 3. The inventory — everything connected today

Blast radius is stated as what happens if this container is fully compromised, not as what the tool
is nominally for. "Reversible?" means: can `git revert`, a delete, or an undo restore the prior
state within minutes.

### 3.1 Class A — capability with no dangerous secret. Grant universally.

| Server | For | Credential | Blast radius | Reversible? |
|---|---|---|---|---|
| `playwright` | Fresh isolated browser: navigate, snapshot, screenshot, read console/network | **none** | Reads the public web. `browser_run_code_unsafe`, `browser_evaluate` and `browser_network_request` can execute JS and issue arbitrary HTTP from the browser context — real, but no credential attached, and bounded by sandbox egress if E7 lands | yes |
| `refero` | Design-reference search: screens, flows, styles | read-only API | none — every tool is a read | n/a |
| `pencil` | Local `.pen` design files | local editor | overwrites local design files | yes (git) |
| `context7` *(proposed, §5)* | Library and API documentation | none | none | n/a |

These four are the founder's instruction, honoured in full, at zero risk. Every engine gets them.

### 3.2 Class B — carries a credential; reads are safe, a small named set of writes is not

| Server | For | Credential | The tools that are not safe | Reversible? |
|---|---|---|---|---|
| `Figma` | Read designs, variables, screenshots; write files | OAuth, workspace-wide | `create_new_file`, `use_figma`, `upload_assets`, `send_code_connect_mappings`, `weave_run_tool` | mostly (version history) |
| `Notion` | Read/search the workspace; write pages | OAuth, workspace-wide | the 14 `notion-create-*` / `notion-update-*` / `notion-move-pages` tools | mostly (page history) |
| `miro` | Boards, diagrams, docs, canvases | OAuth | `board_trash`, `board_share`, `board_move_to_team`, `board_role_update`, `space_delete`, `space_share`, `space_role_update` — **the share/role tools grant access to people outside the org** | trash yes; a share is not un-shared |
| `mem0` | Agent long-term memory | API key | `add_memory`, `update_memory`, `delete_memory`, `delete_entities`, **`delete_all_memories`** | **no** — and a poisoned memory propagates silently into every future agent's context |
| `stitch` | UI screen and design-system generation | OAuth | `delete_project`, `update_design_system`, `upload_design_md` | partly |
| `Google Drive` | File access — **not yet authorised**, only `authenticate` is exposed in this session | OAuth | unknown until authorised | — |

The reads in this class are the founder's instruction and are safe to grant universally. The write
tools are a bounded, enumerable set and belong to whichever engine owns that artifact — Figma and
stitch writes to `designer`, Notion and miro writes to `orchestrator`, mem0 writes to
`orchestrator` alone.

**`mem0` deserves its own sentence.** It is the only server in the inventory whose blast radius is
*this system's own future reasoning*. An agent that can write memory can plant a fact that every
later agent reads as established. `delete_all_memories` is a single call that destroys shared state
with no undo. It is nominally low-stakes and is in fact the highest-leverage write on the list.

### 3.3 Class C — never universal, under any reading of the instruction

| Server | For | Credential | Blast radius | Reversible? |
|---|---|---|---|---|
| `claude-in-chrome` | Drives **the user's real Chrome, with the user's live cookies** | the human's entire authenticated identity | Every action the human is logged into: Gmail, GitHub, the Stripe dashboard, the bank. There is no credential to rotate, because the credential is the browser session. `javascript_tool`, `computer`, `form_input`, `file_upload` all act inside it | **no** |
| `Gmail` | Read/search mail; send | OAuth | `send_message`, `reply`, `forward` put text in front of real people under the founder's name. `trash_*`, `mark_*_spam` destructive | **no** for sends |
| `Google Calendar` | Read/write events | OAuth | `create_event`, `update_event`, `delete_event`, `respond_to_event` all mail real invitees | **no** for invites |
| `higgsfield` | Media generation, websites, TikTok | API key + **billing** | `confirm_billing_purchase` spends money; `tiktok_publish` publishes to a public account; `deploy_website` / `publish_website` ship to the public internet; `website_secrets` reads and writes secrets; `sandbox_exec` executes code | **no** for spend, publish, secrets |
| `runpod` | GPU pods and endpoints | API key + **billing** | `create-pod` / `create-endpoint` accrue hourly spend with no ceiling; `delete-*` destroys volumes and endpoints | delete: no; spend: no |
| `n8n` | Workflow automation — **not yet authorised** | OAuth | A **meta-credential**: n8n workflows already hold credentials for other systems, so granting n8n grants transitively everything n8n is connected to, invisibly | depends on the workflow |

### 3.4 Named by the founder, not connected today

| Server | Read-scoped mode | Unscoped blast radius | Verdict |
|---|---|---|---|
| `supabase` | **Yes — `--read-only`**, enforced by a Postgres role, not by a tool list | Schema change on live rows; full customer-data write; storage and auth admin | Read-scoped instance → `instrument`. Unscoped → `operator` only. **Two entries in `.mcp.json`, never one** |
| `vercel` | No read-only mode in the MCP; scope the **token** by project instead | Production deploy (revertible) — **and env-var read, which is not**, because reading a secret cannot be un-read. One Vercel grant is a grant to every other secret in the project | `operator` only. Never `instrument`, despite "read" being available: the env-var read makes it a credential-disclosure surface, not a metrics surface |

---

## 4. What is genuinely missing for a system that runs real businesses

Grouped by the gap it closes. Each line states which engine needs it, so the list stays a
requirements list and not a wishlist.

| Server | Closes | Engine | Credential | Read-scoped mode | Recommend |
|---|---|---|---|---|---|
| **Stripe** (official MCP) | GRANT-HOLDERS §4.7's `<billing-read>`, which it records as *"No server exists"*. Revenue, churn and MRR have no system of record today | `instrument` (restricted read key) · `operator` (live secret) | yes | **yes — restricted keys** | **Add.** Two instances, two keys |
| **GitHub** (official MCP, `--read-only`) | PR state, CI status, issue history. `gh` via Bash covers it but is unauditable at tool granularity | `reviewer`, `orchestrator` | yes | **yes** | **Add**, read-only |
| **Sentry** or equivalent | Production error truth. Nothing in the inventory can tell the system its own software is broken | `instrument` | yes | yes | **Add** |
| **PostHog** or equivalent | GRANT-HOLDERS §4.7's `<analytics>`, also *"No server exists"* | `instrument` | yes | yes (project read key) | **Add** |
| **Context7** | Library-docs lookup — rung 1 of Part B's ladder, and already referenced by three agent files that no config backs (M2) | all | **none** | n/a | **Add.** Highest value per unit of risk on this list |
| **Slack** | Team comms; the ledger's escalation path is a human today | `operator` (send) | yes | yes | Add **only if** the team is on Slack. A send is irreversible outbound |
| **Resend / Postmark** | Transactional email for shipped products | `operator` | yes | no | Add when a product actually sends mail, not before |
| **Linear / Jira** | Issue tracker | `orchestrator` | yes | yes | Add only if one is actually in use |

**Recommended against, explicitly**, because a long unvetted list is worse than a short vetted one:

- **A second web-search MCP** (Exa, Brave, Perplexity). `WebSearch` and `WebFetch` are built in and
  `sourcer` already holds them; a search MCP adds a credential and an egress path to buy a
  capability the roster has. No.
- **n8n and Google Drive, until authorised with a named purpose.** n8n in particular is a
  meta-credential (§3.3); granting it is granting everything behind it, and nothing here needs it.
- **AWS, Cloudflare, or any cloud-admin MCP.** Not in the stack. Adding one is adding `operator`'s
  most dangerous credential class for no current task.

---

## 5. Three specifications. The founder chooses; the tradeoff is on the table.

### 5.1 Recommendation, stated once

**Option U+D (§5.4) — grant every server to every engine as instructed, and withhold the dangerous
ones per agent with a server-level `disallowedTools:` in the same file.** M4 makes this possible and
it was not available to GRANT-HOLDERS, which is why that document reached a stricter answer. It gives
the founder the instruction almost verbatim — every engine's `tools:` names every server — while
keeping a boundary that is auditable, refuses loudly when it cannot bind, and stays correct when a
vendor ships new tools.

**Where I recommend against the literal instruction, in one paragraph.** Universal grant *with no
denial* makes every one of GRANT-HOLDERS §1's four hazard sentences true at once. A `sourcer` that
ingests attacker-controllable web text while holding `mcp__higgsfield__website_secrets` and
`mcp__claude_ai_Gmail__send_message` is a one-hop exfiltration chain with an outbound channel
attached: fetch a page, the page's text instructs a call, the answer leaves by the next one. The same
container would hold `claude-in-chrome`, whose credential is the founder's own logged-in browser and
therefore cannot be rotated, scoped, or audited — there is no key to revoke, because the key is a
person. And a `builder` holding `mcp__vercel__*` can make its own deploy pass, which is the one
failure this repo's whole review apparatus exists to prevent. None of that is an argument about
roster size; it is that a grant with no matching denial has no revocation surface at all. **So: grant
every server, as instructed. Deny the Class C set per agent, which the instruction did not rule out
and which M4 shows is one line per file.** Option S (§5.3) remains the strictest form if the founder
wants it; Option U (§5.5) is the literal instruction with no denial, specified in full, and §7 is
honest about what it costs.

### 5.2 The withheld set — the same list under every option, differing only in how it is expressed

Every option below withholds the same thing from the same engines. The list is short enough to read
in one sitting, which is the point: this is what "not universal" actually costs.

| Withheld | From | Because |
|---|---|---|
| `mcp__claude-in-chrome` | **every engine** | The credential is a person (§6) |
| `mcp__claude_ai_n8n` | **every engine** | Meta-credential: grants transitively whatever n8n is wired to |
| `mcp__vercel`, `mcp__supabase` (unscoped), `mcp__stripe` (live) | all but `operator` | Production deploy, schema change on live rows, money moves. Vercel additionally discloses every other project secret through env-var read |
| `mcp__claude_ai_Gmail__send_message`, `__reply`, `__forward` · `mcp__claude_ai_Google_Calendar__create_event`, `__update_event`, `__delete_event`, `__respond_to_event` | all but `operator` | Irreversible outbound to real people under the founder's name |
| `mcp__higgsfield__confirm_billing_purchase`, `__deploy_website`, `__publish_website`, `__website_secrets`, `__sandbox_exec`, `__tiktok_publish`, `__tiktok_connect` | all but `operator` | Spend, public publish, secret read, code execution |
| `mcp__runpod` (create/delete/update/start/stop) | all but `operator` | Uncapped hourly spend; destructive deletes |
| `mcp__mem0__add_memory`, `__update_memory`, `__delete_memory`, `__delete_entities`, `__delete_all_memories` | all but `orchestrator` | The only write whose blast radius is this system's own future reasoning |
| `mcp__miro__board_share`, `__board_role_update`, `__space_share`, `__space_role_update`, `__board_trash`, `__space_delete` | all but `orchestrator` | Grants access to people outside the org; a share is not un-shared |
| `mcp__playwright` | `sourcer` only | A headless browser with JS execution is an egress channel, and `sourcer` is the container that ingests attacker-controllable text |
| every `mcp__*` write | `reviewer` | Read-only engine. An agent that can change what it reviews will review what it can change |

Roughly **forty tool names across nine servers, plus two whole servers.** That is the entire
disagreement between "all of them get all the MCPs" and every option below.

### 5.3 Option S — scoped allowlist (strictest)

| Engine | MCP grant, as it would appear in `tools:` |
|---|---|
| `orchestrator` | `mcp__playwright__*`, `mcp__context7__*`, `mcp__refero__*`, `mcp__mem0__*`, `mcp__claude_ai_Notion__*`, `mcp__miro__*` — the only engine with mem0 write, because it is the only one that owns durable state |
| `builder` | `mcp__context7__*`, `mcp__playwright__*` — docs and a browser to check its own work. **No credential of any kind** (GRANT-HOLDERS §1: an operator that can patch code can make its own deploy pass) |
| `designer` | `mcp__playwright__*`, `mcp__refero__*`, `mcp__pencil__*`, `mcp__stitch__*`, `mcp__claude_ai_Figma__*`, `mcp__higgsfield__generate_image`, `mcp__higgsfield__generate_video`, `mcp__higgsfield__job_status` — media generation without `confirm_billing_purchase`, `tiktok_*`, `*_website`, `website_secrets` or `sandbox_exec` |
| `reviewer` | `mcp__playwright__*`, `mcp__context7__*`, `mcp__github__get_*` (read-only instance) — read-only engine, so **no `Write`, no `Edit`, and no server that can write anything** |
| `sourcer` | `mcp__context7__*`, `mcp__refero__*` and `WebSearch`/`WebFetch` it already holds. **Deliberately no `playwright`**: a headless browser is an egress channel with JS execution, and this is the container that ingests attacker-controllable text |
| `instrument` | `mcp__stripe_read__*`, `mcp__supabase_read__*`, `mcp__posthog__*`, `mcp__sentry__*`, `mcp__github__get_*` — **every one launched read-scoped at the server**, per GRANT-HOLDERS §6.5 obligation 1 |
| `operator` | `mcp__vercel__*`, `mcp__supabase__*` (unscoped), `mcp__stripe__*` (live), `mcp__higgsfield__deploy_website`, `mcp__higgsfield__publish_website`, `mcp__claude_ai_Gmail__send_message`, `mcp__runpod__*` — and nothing that reads the public web |

`claude-in-chrome` and `n8n` appear in no engine's list. They are human-operated, in a human's
session, or not granted.

**The one change to Option S the founder's instruction should still produce**, because it is right:
`playwright` moves from a `designer`/`reviewer` grant to a near-universal one (all but `sourcer`).
It carries no credential, and Part B's ladder needs it.

**What Option S costs.** Seven `tools:` lists to keep current, and a new server has to be added to
each engine that should have it — the grant is enumerated, so it is also seven edits. That is the
price of failing closed, and it is the reason Option U+D exists.

### 5.4 Option U+D — universal grant, per-agent denial (recommended)

The founder's instruction, honoured at the grant layer. Every engine file carries the **same**
`tools:` line naming every server; the engines differ only in a `disallowedTools:` line beneath it.

```yaml
# identical in all seven engine files
tools: [Read, Write, Edit, Bash, Glob, Grep,
        mcp__playwright__*, mcp__refero__*, mcp__pencil__*, mcp__context7__*,
        mcp__mem0__*, mcp__miro__*, mcp__stitch__*,
        mcp__claude_ai_Figma__*, mcp__claude_ai_Notion__*,
        mcp__claude_ai_Gmail__*, mcp__claude_ai_Google_Calendar__*,
        mcp__higgsfield__*, mcp__runpod__*,
        mcp__supabase_read__*, mcp__stripe_read__*, mcp__posthog__*, mcp__sentry__*,
        mcp__github__*, mcp__supabase__*, mcp__vercel__*, mcp__stripe__*]
```

| Engine | `disallowedTools:` |
|---|---|
| `orchestrator` | `[mcp__claude-in-chrome, mcp__claude_ai_n8n, mcp__vercel, mcp__supabase, mcp__stripe, mcp__runpod, mcp__higgsfield__confirm_billing_purchase, mcp__higgsfield__deploy_website, mcp__higgsfield__publish_website, mcp__higgsfield__website_secrets, mcp__higgsfield__sandbox_exec, mcp__higgsfield__tiktok_publish, mcp__claude_ai_Gmail__send_message, mcp__claude_ai_Gmail__reply, mcp__claude_ai_Gmail__forward]` |
| `builder` | the above, **plus** `mcp__mem0`, `mcp__claude_ai_Gmail`, `mcp__claude_ai_Google_Calendar`, `mcp__miro`, `mcp__stripe_read`, `mcp__supabase_read`, `mcp__sentry`, `mcp__posthog` — a code container holds documentation and a browser, nothing else |
| `designer` | as `builder`, **minus** the Higgsfield generation tools, `mcp__stitch`, `mcp__claude_ai_Figma`, `mcp__pencil`, `mcp__refero` — which it keeps |
| `reviewer` | as `builder`, **plus every write**: `mcp__claude_ai_Figma`, `mcp__claude_ai_Notion`, `mcp__stitch`, `mcp__pencil`, `mcp__higgsfield` — leaving `mcp__playwright`, `mcp__context7`, `mcp__github` |
| `sourcer` | as `builder`, **plus `mcp__playwright`** — this is the injection-ingesting container and it gets no browser and no egress beyond `WebFetch` |
| `instrument` | everything unscoped and everything that writes: `mcp__supabase`, `mcp__vercel`, `mcp__stripe`, `mcp__higgsfield`, `mcp__runpod`, `mcp__claude_ai_Gmail`, `mcp__playwright`, `mcp__claude-in-chrome`, `mcp__claude_ai_n8n` — leaving the four read-scoped servers |
| `operator` | `mcp__playwright`, `mcp__claude-in-chrome`, `mcp__claude_ai_n8n`, `mcp__refero`, `mcp__context7` — **it does not read the public web, full stop** |

**Why this is the recommendation and not a compromise.**

| Property | Option S | **Option U+D** | Option U |
|---|---|---|---|
| Matches the founder's instruction at the grant layer | no | **yes** | yes |
| A new server reaches every engine without seven edits | no | **yes** | yes |
| A new *tool* on a denied server is auto-denied | yes | **yes** (server-level denies, §2.1) | n/a |
| A new *server* added to config reaches credentialed engines un-denied | no | **no — this is its one hole** | n/a |
| Misspelled boundary | lint catches | **spawn refuses** (M4) | n/a |
| Boundary is auditable in one place | seven `tools:` lists | **seven `disallowedTools:` lists** | nowhere |

**The one hole, named.** Adding a new server to `.mcp.json` grants it to every engine, because the
grant is a wildcard and the denial is an enumeration. The fix is a lint, not a redesign: **`MCP_ALLOWLIST`
(§8 step 2) inverts — it lists, per agent, the servers that must appear in `disallowedTools:`,
and fails the build when a server exists in config and is named in neither list.** A new server then
cannot land without a decision recorded for all seven engines. That is one script change and it turns
the hole into a blocking check.

### 5.5 Option U — universal, no denial, as literally instructed

Option U is Option U+D with every `disallowedTools:` line deleted — the same `tools:` block in §5.4,
and nothing withheld from anyone. The specification is therefore one line long; what follows is the
set of conditions under which it is survivable, and they are not optional.

Non-negotiable conditions, all four, or Option U is not survivable:

1. **E7 first.** `sandbox.credentials` mask mode proven by X1 (GRANT-HOLDERS §2.4), and
   `sandbox.network` configured. Without it every credential is plaintext in a transcript, and
   `grep -c '"sandbox"'` returns 0 in both settings files today.
2. **`bin/warroom:235,237` drops `--dangerously-skip-permissions`**, and `.claude/settings.json`
   `permissions.deny` carries the Class C tool names. Under Option U the denylist is the *only*
   remaining boundary, so it must actually be consulted — today it is inert.
3. **`pre-tool-use.sh` gains an `mcp__*` branch and the settings matcher is widened** (§8, step 5).
   Under Options S and U+D the hook's blindness is a gap; under Option U it is the whole gate.
4. **Every write, publish, spend and send goes to `ask`, not `allow`** — which means Option U buys
   universality and pays for it with a permission prompt on every consequential call. That is the
   honest cost, and it is worth saying plainly: **Option U does not remove the boundary, it moves it
   from a file the founder edits once to a prompt the founder answers every time.**

---

## 6. The `claude-in-chrome` exception, stated separately because it is not like the others

`claude-in-chrome` is the only entry in the inventory whose credential is a **person**. There is no
token to scope, no key to rotate, no read-only flag, and no blast-radius bound short of "everything
the founder is logged into". It should not appear in any engine's `tools:` under either option. Its
correct place is the main thread, driven by the founder, with the extension's own site-level
permissions as the control. `playwright` covers every legitimate agent browser need with a fresh
profile and no cookies, which is the entire difference.

---

## 7. Does the roster number survive? — S yes, U+D yes on an amended premise, U no

ROSTER-SIZE §1 derives seven from one sentence: *"the roster's floor is … the number of capability
grant-classes that must not co-reside."* Apply that sentence to each option.

**Option S: seven stands, narrowed.** The four grant-classes remain in four containers. §6.2's
matrix stays all-`never` for the credentialed pairs. One correction is owed regardless of the
founder's choice: **M1 shows the matrix is already false in practice** for the seven account-level
connectors, which co-reside in every main-thread session. Option S does not fix that — only per-agent
`tools:` lists on the `Agent` dispatch path do, and only if X5 (§8) passes. Until then, seven is the
number the *files* express and four is the number the *runtime* enforces.

**Option U+D: seven stands, but the premise underneath it changes and the change should be recorded.**
ROSTER-SIZE's derivation rests on *"a capability grant is expressible in exactly one place — agent-file
frontmatter"* and *"a denial is settable per dispatch and therefore never earns a file."* M4 shows the
second half is incomplete: a denial is settable in the file too, it is MCP-aware, and it refuses rather
than degrades. So under U+D the containers are no longer separated by **which grant each holds** — they
all hold the same grant — but by **which denial each carries**. The number is still seven and the
boundary is still a file, but the sentence justifying it must be rewritten:

> The roster's floor is the number of **capability postures** that must not co-reside. A posture is a
> grant minus a denial. Seven files, because seven denial sets are meaningfully different — not
> because seven grants are.

That is a weaker argument than the original, and the weakening is honest: a denial set can be edited
by anyone who can edit the file, whereas a grant that was never made needed a credential to be
provisioned before it could be misused. **Anyone adopting U+D should record that ROSTER-SIZE §1's
grant/denial asymmetry no longer holds as stated**, and that the roster now rests on §6.2's
co-residence hazards directly rather than on the asymmetry that motivated them. The hazards are
unchanged and remain the real argument.

**Option U: seven collapses to three, and I will not pretend otherwise.** If every engine holds every
capability, then by ROSTER-SIZE's own test — *"A container with no grant is a lens"* — `instrument`,
`operator` and `sourcer` stop being containers. What survives is:

| Survives | Because |
|---|---|
| `orchestrator` | It is the only engine that ends a turn on human approval, and it owns state. That is a role, not a grant |
| One producing engine (`builder` absorbing `designer`) | Produces artifacts. `designer`'s separation was always the browser grant, which Option U universalises |
| `reviewer` | Survives on a **denial** — no `Write`, no `Edit`. Under Option U that denial has to come from the workflow surface, because by definition the file carries none. This is ROSTER-SIZE falsifier F2, arriving by a different road |

**Three.** That is an acceptable finding and the founder should see it before choosing. It is also
not a disaster: three well-gated containers with a working permission prompt may be a better system
than seven well-separated containers with `--dangerously-skip-permissions` on every launch. The
choice is between **separation the founder configures once** and **approval the founder gives
repeatedly**. Options S and U+D are the first. Option U is the second. Neither is free, and the
current state —
seven files, no sandbox, a bypassing launcher, seven already-universal connectors — is neither.

---

## 8. The mechanics. What must exist, in what order.

Ordered so that no step makes the system less safe than the step before it. Steps 1-3 are one PR;
shipping any of them alone regresses a working check.

| # | Change | Why this position | Evidence it is needed |
|---|---|---|---|
| **1** | **`schema-lint.js` validates `tools:` and `disallowedTools:` entries, not just list shape.** Every `mcp__*` entry in either field is subject to the allowlist | `tools:` is the field that *already binds* (M2) and is unguarded; `disallowedTools:` is the boundary under Option U+D and is not validated at all | `schema-lint.js:280-282` checks shape only; `check-registration.mjs` never reads either field |
| **2** | **Replace `mcpConfigured()` with `MCP_ALLOWLIST`, keyed per agent, covering `tools:`, `disallowedTools:` and `mcpServers:`.** Under U+D it inverts: it lists the servers each agent must *deny*, and fails when a configured server appears in neither list | A per-agent list is what makes step 4 safe. Covering one field only is bypassable by writing the grant into another (M3). The inverted form closes U+D's one hole (§5.4) | `schema-lint.js:85-93` is a repo-wide boolean; GRANT-HOLDERS §4.7 and ROSTER-SIZE D5 |
| **3** | **`check-registration.mjs:165` changed in the same PR** — it duplicates `mcpConfigured()` verbatim | Two implementations of one rule disagree silently; this is exactly what `classifier.js` was consolidated to prevent | `check-registration.mjs:165` |
| **4** | **`.mcp.json` added, with `supabase` present twice** — `supabase-read` (`--read-only`) and `supabase` — never once | Adding it before steps 1-3 flips the lint permissive for every agent at once | `mcpConfigured()` returns true on file existence alone |
| **5** | **`pre-tool-use.sh` gains an `mcp__*)` branch, and `.claude/settings.json:51`'s matcher widens from `Bash\|Edit\|Write\|NotebookEdit`** | Both are required. The hook has three branches — `Bash)`, `Edit\|Write\|NotebookEdit)`, `*)` → allow — and the matcher means it is never invoked for an MCP call at all | `pre-tool-use.sh:115, :237, :342`; `.claude/settings.json:51` |
| **6** | **`bin/warroom:235,237` drops `--dangerously-skip-permissions`** | Until this, every allow/deny rule in `settings.json` is inert in normal operation | `bin/warroom:235,237` |
| **7** | **X1 (mask proof) passes before any credentialed server is added** | Without it a credential is plaintext in `~/.claude/projects/*.jsonl` | GRANT-HOLDERS §2.4 |
| **8** | **X4 answered before any `allowed-tools`-bearing skill attaches to a credentialed engine** | If `allowed-tools` *restricts*, loading such a skill silently strips the MCP grant mid-task | 8 skills carry the field: `database-design`, `deployment-procedures`, `impeccable`, `nextjs-best-practices`, `pitch-deck-visuals`, `react-patterns`, `tdd-workflow`, `tailwind-patterns` |

### 8.1 X5 — the new experiment, and it is the load-bearing one

GRANT-HOLDERS §8 proposes X2: does an `mcpServers:` grant reach a repo-declared agent through the
`Agent` path? M1 and M2 change the question that matters.

> **X5 — does an explicit `tools:` list *exclude* MCP tools in a subagent?**
> Dispatch `reviewer` (`tools: [Read, Glob, Grep, Bash]`, no MCP entry, no `.mcp.json` in repo) with:
> *"List every tool name available to you. Then attempt `mcp__mem0__search_memories`. Report the
> exact error verbatim, or NOT_AVAILABLE."*
> **Result A — `NOT_AVAILABLE` and no `mcp__*` in the list:** `tools:` is the working per-agent MCP
> denial, Option S is buildable exactly as specified in §5.3, and M1's universality is confined to
> the main thread.
> **Result B — the connectors are present anyway:** there is **no per-agent MCP denial on the `Agent`
> path via `tools:`**. Option S is unbuildable as written, Option U+D becomes the only workable
> scoped form, and if X6 also fails, Option U is not a choice the founder is making — it is the state
> the system is already in.

> **X6 — does `disallowedTools:` in an agent file bind?** Same sitting, second spawn. Add
> `disallowedTools: [mcp__mem0]` to the same probe and re-run the identical prompt. **Pass:** the
> tool is gone. **Fail:** M4's *"the agent definition's denies"* refers to something else, and
> Option U+D collapses into Option U.

Two spawns, no files written beyond one throwaway probe. Together they cost less than X2 and decide
more: X5 decides whether Option S exists, X6 decides whether Option U+D exists, and if both fail the
founder's instruction is not a decision but a description. `schema-lint.js:52-58` records the same
limit for `Write`/`Edit` and notes the probe *"has to be run by hand"* because subagent spawning is
disabled in these sessions by founder instruction — X5 and X6 are the same probe with different tool
names and belong in that sitting.

### 8.2 Two more capabilities in the binary that nobody here has used

```
$ strings -a /Users/adamks/.local/share/claude/versions/2.1.232 | grep -B4 "which is ignored for plugin agents"
380901-permissionMode
380902-hooks
380903-mcpServers
380904- sets
380905:, which is ignored for plugin agents. Use .claude/agents/ for this level of control.
```

In the decompiled loader those three are iterated together —
`for (let G of ["permissionMode","hooks","mcpServers"]) if (c[G] !== void 0) warn(…)` — and the
message says where they *are* honoured. So `.claude/agents/` frontmatter accepts **`permissionMode:`
and `hooks:`** as well as `mcpServers:`, `tools:` and `disallowedTools:`.

| Field | What it would buy | Status |
|---|---|---|
| `permissionMode:` per agent | A `default` mode on `operator` may restore permission prompting for that engine **even under a launcher passing `--dangerously-skip-permissions`**. If it binds, §8 step 6 stops being a prerequisite and becomes a cleanup | **Untested.** No command run demonstrates the binding |
| `hooks:` per agent | A `PreToolUse` block scoped to `operator` — the `mcp__*` gate §8 step 5 needs, without widening the repo-wide matcher for everyone | **Untested** |
| `disallowedTools:` per agent | The boundary Option U+D rests on | **M4** — parsed by the loader, named in the clamp error as *"the agent definition's denies"*, but not demonstrated. X6 |

All three are leads, not findings. Any of them binding makes Option U materially more survivable and
makes Option U+D strictly better than Option S on maintenance cost with no loss of boundary. They are
worth an hour before any of the seven files is edited.

---
---

# PART B — KNOWING WHEN YOU ARE OUT OF YOUR DEPTH

## 9. Why this cannot be an instruction

*"Notice when you lack the expertise and go get it"* is a sentence in a prompt. This repo's own rule
table names eight such sentences and marks five of them `ADVISORY — no mechanism`. CLAUDE.md states
the test: *"A rule enforced only by this sentence is a wish, not a rule."*

So the design below is four checkable triggers, a ladder with per-rung costs, a per-engine
permission table, a record written through the mechanism that already exists, and a bound that is
validated rather than hoped for. Nothing in it is new machinery except one integer in the return
contract.

---

## 10. The trigger — four of them, each checkable

An agent does not need to *feel* out of depth. It needs a lookup to come back empty. All four fire
before the work starts, except T3 which fires after exactly one attempt.

| # | Trigger | How it is checked | Strength |
|---|---|---|---|
| **T1** | **Router miss.** The namespace router returns no skill covering the task's domain | `.claude/skills/routers/INDEX.md` names seven namespaces; the agent opens the one that matches and finds nothing. **`NONE` becomes a required return value for every router**, not only `thinking-model-router`, which already *"may return NONE"* (`routers/INDEX.md:17`) | Strong. A literal token, not a judgement |
| **T2** | **Lens miss.** No lens in `.claude/lenses.yml` whose `applies_to:` includes this engine has a procedure for this domain | A data lookup over `applies_to:` (`lenses.yml:30, 101, 151`). Eight lenses, each listing its engines explicitly. `node -e` answers it in one line | **Strongest.** Pure data, no model judgement anywhere in the check |
| **T3** | **First-attempt failure with a domain cause.** The artifact was produced and a review lens rejected it citing a rule the agent never loaded | The `reviewer` return names the lens and the rule. One failure is the trigger; three is the *stop* (§14) | Strong |
| **T4** | **A claim it cannot emit.** The lens declares `requires_claims: [external-fact]` and the agent has no `evidence.url` to attach | `scripts/ledger.mjs` at `lint` refuses it, so the agent knows before it returns. `resolvers.js:374` requires `typeof ev.url === 'string'` for `claim-source` to be applicable at all | **Sharpest.** "I am out of my depth" is detectable as "I am about to assert something I cannot source" |

T4 is the one to emphasise to the founder: the system already has a mechanism that refuses an
unsourced assertion. Part B is largely the work of making an agent *consult* that refusal before it
writes rather than after.

---

## 11. The ladder — cheapest first, with the cost of each rung stated

| Rung | Action | Token cost | Wall-clock | Stop climbing when |
|---|---|---|---|---|
| **0** | Re-read the open namespace router; check the near-miss entry in `MANIFEST.json` | ~700 | < 5 s | a skill matches |
| **1** | **Load a skill not in `skills:` frontmatter** — a plain `Read` of `.claude/skills/<name>/SKILL.md` | ~2k | < 10 s | the skill's procedure covers the step |
| **2** | `mcp__context7__*` — library and API docs, no credential, no egress judgement needed | ~1.5k | 5-15 s | the documented answer is found |
| **3** | `WebSearch` — one query, results only, no fetch | ~1.5k | 5-20 s | a primary source URL is identified |
| **4** | `WebFetch` the one primary source; extract ≤ 3 quoted spans | ~3k | 10-30 s | a quote answers the question |
| **5** | **Dispatch `sourcer`** with a bounded question and a named decision it informs | isolated — costs the parent ~500 | 2-8 min | `sourcer` returns `COMPLETE`, or returns its `gaps` |
| **6** | **Dispatch a visual-reference search** — `mcp__refero__refero_search_screens`, `mcp__playwright__browser_take_screenshot`, `mcp__claude_ai_Figma__search_design_system` | isolated | 1-4 min | 3-5 references gathered |
| **7** | **Ask the human** | — | unbounded | — |

Rung 1 is free of any grant: every engine holds `Read`, so loading an unlisted skill needs no
capability at all. That is the rung most tasks should end on, and it is the rung the current system
does not tell agents they may use.

Rungs 5 and 6 are the founder's *"send an agent to do a search"* and *"send an agent to search
photos"*, exactly.

---

## 12. Who may climb it

The founder's instruction is *"they can use playwright whenever they want."* Here is the one place
in Part B where I recommend a narrower reading, and the reason is Part A's §1 hazard sentences.

> **The rung is climbed by the engine that holds the grant, not by the engine that has the
> question.** A `builder` that needs a fact does not fetch it — it returns
> `BLOCKED_NEEDS_KNOWLEDGE` and the `orchestrator` climbs on its behalf, then re-dispatches with the
> answer in the brief. The requesting engine gets the *answer*, not the *tool*.

This costs one extra hop and preserves everything: an engine that writes code never ingests
attacker-controllable web text, and a credentialed engine never ingests it at all.

| Engine | May climb, unaided | Must delegate | Reason |
|---|---|---|---|
| `orchestrator` | 0-7 (all) | — | It already dispatches; it is the only engine that can ask the human |
| `sourcer` | 0-4 | 5 (it is rung 5) | This is its job. Contained by holding no `Bash`, no `Write`, no credential |
| `reviewer` | 0-2 | 3-7 | **Read-only, and that must include its inputs.** A reviewer that fetches the web can be told by a page what to conclude, and its conclusion is a merge gate. Docs (rung 2) are safe; open web is not |
| `builder` | 0-2 | 3-7 | Holds `Write` and `Edit`. Rungs 3-4 in a writing container is the injection-to-commit path |
| `designer` | 0-2, plus 6 | 3-5 | Rung 6 is its own domain and its references are visual, not instructional. Open-web text is still delegated |
| `instrument` | 0-2 | 3-7 | Holds read credentials. GRANT-HOLDERS §7: allow-list posture, four named hosts. Public-web fetch is not on it |
| `operator` | 0-1 | 2-7 | Holds production credentials. **It does not read the public web, full stop** — GRANT-HOLDERS §1: *"a container holding a production deploy token that also ingests arbitrary web text is prompt-injection with a production credential attached"* |

**The literal instruction, specified as asked.** If the founder wants every engine to climb every
rung unaided, the change is one line per file — add `WebSearch, WebFetch, mcp__playwright__*` to
every `tools:` list. The consequence, stated once so it is not a surprise: `reviewer`, `builder`,
`instrument` and `operator` become injection-reachable, and for `operator` that means a fetched page
can influence a container that can deploy and move money. If that version is chosen, **rung 3-4
results must be quarantined**: an engine may quote a fetched page but may not *act* on an
instruction found in one, and the only enforcement available is §13's claim record plus a `reviewer`
lens that fails a diff whose justification traces to a fetched source with no claim behind it.

---

## 13. The record — no new path, the ledger already has one

Three writes, all through existing mechanisms.

**13.1 — Every rung ≥ 3 answer that becomes an assertion is a claim, not a sentence.**
`kind: external-fact`, `verified_by: source`, `evidence: {url, quote, accessed}`. The `claim-source`
resolver fetches the URL and asserts the quote is present in the response body
(`scripts/lib/resolvers.js:219-233`). It returns `fail` when *"the URL is live but the recorded quote
is not present in it"* (`:223-225`) and `unresolved` — never `pass` — when offline (`:179`) or when
no fetch implementation exists (`:182`). Rule 10 pins `unresolved` as distinct from `pass`.

> **This is the mechanism that stops a fetched, unverified web answer from becoming an asserted
> fact.** It is already built, already in CI via `npm run check:ledger`, and already re-verified
> daily by `.github/workflows/ledger-sweep.yml`. Part B adds no parallel path and should not.

**13.2 — Scope and expiry decide whether the next agent re-learns it.** `scope: task` for a fact
used once and discarded. `scope: project` with `valid_until: +90d` for a fact the next agent should
inherit — and Rule 9 makes that binding: `scripts/ledger.mjs` at `lint` fails a `global`/`project`
claim with no expiry, and `claim-freshness` fails it once the date passes. A researched answer
therefore cannot fossilise; it comes back for a disposition.

**13.3 — Every gap is returned in the shape the skills curator consumes.** Add to all engine return
contracts:

```yaml
knowledge_gap:            # present only when the ladder was climbed
  trigger: T1|T2|T3|T4
  namespace: <one of the seven router namespaces, or "none">
  domain: <the noun the router was queried with>
  highest_rung: 0-7
  resolved_by: <skill name | claim id | sourcer dispatch id | human>
  skill_that_would_have_helped: <proposed name, or null>
```

This is GRANT-HOLDERS §8.1's adoption of Cloudflare OS's *"An agent can also request an introduction
to a resource it thinks it needs"* — a gap is a first-class return value, not a failure. It is also
ROSTER-SIZE §8's counter #1 (*"every point where an agent needed a capability no container held"*)
obtained as a by-product of normal operation instead of from a special instrumented run.

---

## 14. The stop condition — an agent that researches forever has failed differently

Three bounds, each with a named mechanism and an honest label.

| Bound | Value | Mechanism | Status |
|---|---|---|---|
| **Attempts on one source** | 3 | `lenses.yml:157` (`evidence` lens): *"Stop after three failed attempts and report partial progress rather than looping"*; `sourcer.md:17` already escalates on *"Three fetch failures on the same source"* | **ENFORCED** by lens + escalation, both existing |
| **Rungs above entry** | **2 per task, and the ladder is climbed once.** A second climb on the same task is the stop, not a retry | `research_rungs_climbed: integer` in the return contract; the `orchestrator` refuses a return exceeding the tier cap — `trivial/lite: 2`, `full: 4`, `irreversible: 7` | **ENFORCED at validation**, in the one place that already validates returns (CLAUDE.md Layer Contract: *"Validate C-suite returns … Accept returns missing required fields"* → reject) |
| **Wall-clock** | 10 min on `lite`, 30 min on `full`/`irreversible` | **None.** `budget-guard` was unregistered in `5290edd` — *"unregister budget-guard — remove the ceiling from the system"* | **ADVISORY, and honestly so.** The rung cap above is the enforceable proxy; do not claim a time ceiling that no hook computes |

The rung cap is the real bound, and it is deliberate that it is expressed as an integer in a return
contract rather than as a token budget: the orchestrator already validates returns, so the check
costs nothing new, and an integer is auditable after the fact in a way a token count in a deleted
hook was not.

**What "stop" means, so it is not silence.** Reaching the bound produces a return, never a guess:
`status: PARTIAL` with the `knowledge_gap` block filled in and `resolved_by: null`. The orchestrator
then has exactly two moves — dispatch `sourcer` at rung 5 with a narrower question, or ask the human
at rung 7. **A stopped ladder is a decision handed upward, not a task abandoned.**

---

## 15. The contract with the two-tier skill index

`skills-curator` owns the router design. This document does not restate it and depends on it in two
places only. Both are stated as an interface so the two designs can land independently.

| Direction | What Part B needs | Why |
|---|---|---|
| **Curator → here** | **Every router must be able to return the literal `NONE`.** One router already does (`routers/INDEX.md:17`, `thinking-model-router`); the property has to be universal | `NONE` is trigger T1. Without it, "no skill matched" is indistinguishable from "the closest skill matched badly", and the ladder never fires |
| **Here → curator** | **Every `knowledge_gap` return with `namespace` + `domain` + `skill_that_would_have_helped` is a proposed router line**, delivered in the curator's own vocabulary | The curation record is `CURATION.yml`, where *"every cut and every reversal is recorded … with the test that made it"*. A logged gap is exactly such a test, generated by real work rather than by a review pass |

The loop closes: a router miss triggers research, research produces a gap record, the gap record
proposes the skill whose absence caused the miss, and the next agent hits rung 0 instead of rung 5.
That is the mechanism the founder's second instruction is actually asking for — not awareness, but a
system that gets less ignorant each time it notices it was.

---

## 16. Open questions, and what would falsify this

| # | Question | Who decides | Consequence |
|---|---|---|---|
| **Q1** | **Option S, U+D, or U?** | Founder | S: seven, strictest, seven edits per new server. **U+D: seven, the instruction honoured at the grant layer, one shared `tools:` line** — recommended. U: roster is three (§7), and consequential calls need a prompt each time |
| **Q2** | **X5 (§8.1) — does `tools:` exclude MCP in a subagent?** | One spawn | Result B makes Option S unbuildable as specified and leaves U+D as the only scoped form |
| **Q3** | **X6 (§8.1) — does `disallowedTools:` bind in an agent file?** | Same sitting | If not, Option U+D collapses into Option U and Q1 has two answers, not three |
| **Q4** | **Is `claude-in-chrome` ever granted to an agent?** | Founder | My recommendation is never (§6). It is the one credential that is a person and cannot be rotated |
| **Q5** | **Do `permissionMode:` and `hooks:` bind in `.claude/agents/` frontmatter?** (§8.2) | One test | If yes, per-agent gating exists today and step 6 of §8 becomes a cleanup rather than a prerequisite |
| **Q6** | **Does `allowed-tools` in a `SKILL.md` restrict or merely hint?** (X4) | One test | If it restricts, eight skills can silently amputate an MCP grant mid-task |
| **Q7** | **Do the seven account-level connectors reach a subagent?** (M1 + Q2) | Same spawn as Q2 | Decides whether §6.2's co-residence matrix is a design or a wish |
| **Q8** | **Does ROSTER-SIZE §1's grant/denial asymmetry need amending?** (§7, M4) | Whoever owns ROSTER-SIZE | It is stated as *"a denial … never earns a file"*, and a denial does live in a file. The roster number is unaffected; the argument for it is not |

**What would falsify Part B.** Run twenty tasks with the ladder instrumented and count how many
`knowledge_gap` returns are produced. **If it is near zero, the triggers are not firing and the
design is decoration** — the same failure as the eight unenforced rules in CLAUDE.md, arriving in a
new field. If it is very high, the trigger is too sensitive and T2 should be narrowed from
"no lens covers this domain" to "no lens covers this domain **and** T4 also fires."

**What would falsify Part A.** One `strings` re-run: if `agent()` ever accepts an `mcpServers`
option or an additive `allowedTools`, every grant becomes per-call, `tools:` stops being the
boundary, and all three options converge — the founder gets universal grant *and* per-dispatch
narrowing, and the whole of §5 becomes a dispatch-time argument instead of a file-layout one.
ROSTER-SIZE F1 says the same thing about the roster; it is the same grep. Note that M4 already moved
the answer halfway there without anyone re-running it: per-call *denial* of a frontmatter-declared
MCP server is documented in the binary today, which is why Option U+D exists at all.

---

*Every claim here is a file:line in this repository, a command run on 2026-08-14, or a labelled gap.
Where this document recommends against a founder instruction it says so once, in §5.1 and §12, gives
the reason, and then specifies the instructed version anyway. Where it disagrees with
GRANT-HOLDERS.md — §6.2's co-residence matrix, and §8's choice of X2 over X5 — the disagreement is in
§0 and §8.1 with the measurement that produced it.*
