# Hands — what a worker could physically touch

**Expansion study, lane 3 of 3. Written 2026-09-01.** Companion to
[`00-TERRITORY.md`](00-TERRITORY.md). Two sibling studies cover open-source projects to adopt and
abstract mechanisms; this one covers **capability**: MCP servers, CLIs, APIs, browsers, OS automation,
models as tools, physical-world services, and the patterns other systems use to decide who gets which
hand.

**This is not a plan and nothing here is decided.** It is deliberately unfiltered — the founder filters,
later, with the lead. An option omitted because I judged it unlikely is an option nobody gets to consider.

---

## How to read this — verification legend

Rule 3 of this repo is *no agent invents data*, and a hallucinated server name would poison the filtering
conversation more than an omission would. Every entry carries a verification mark:

| Mark | Means |
|---|---|
| **`[M]`** | **Measured on this machine**, 2026-09-01, by a command shown in the entry. The strongest class. |
| **`[F]`** | **Vendor doc fetched** — I pulled the vendor's own page and the quoted URL/tools are from it. Access date 2026-09-01. |
| **`[S]`** | **Search-verified** — the vendor's own domain appeared in web-search results with matching title/URL. Weaker: the URL is real, the detail may be a secondary source's summary. |
| **`[R]`** | **Reported by a third party only** — an aggregator, directory or blog. Treated as a lead, not a fact. All `[R]` items are quarantined in §7. |

Prices are as reported on the access date, in USD, and move. Treat every figure as an order of magnitude.

---

## 0 · What this machine can reach TODAY — measured, not surveyed

This section is `[M]` throughout. It matters because the territory file's headline — *"the hands are
already bought"* — is true but **generous**. Bought is not the same as reachable.

### 0.1 The MCP roster, with health

`claude mcp list`, run in this worktree 2026-09-01:

| Server | Endpoint | Health |
|---|---|---|
| claude.ai Notion | `https://mcp.notion.com/mcp` | ✔ Connected |
| claude.ai Google Drive | `https://drivemcp.googleapis.com/mcp/v1` | ✔ Connected |
| claude.ai Google Calendar | `https://calendarmcp.googleapis.com/mcp/v1` | ✔ Connected |
| claude.ai Gmail | `https://gmailmcp.googleapis.com/mcp/v1` | ✔ Connected |
| claude.ai Figma | `https://mcp.figma.com/mcp` | ✔ Connected |
| stitch | `https://stitch.googleapis.com/mcp` | ✔ Connected |
| refero | `https://api.refero.design/mcp` | ✔ Connected |
| higgsfield | `https://mcp.higgsfield.ai/mcp` | ✔ Connected |
| pencil | local binary, `~/.pencil/mcp/antigravity/…` | ✔ Connected |
| **claude.ai n8n** | `https://beamixai.app.n8n.cloud/mcp-server/http` | **! Needs authentication** |
| **miro** | `https://mcp.miro.com` | **! Needs authentication** |
| **mem0** | `https://mcp.mem0.ai/mcp` | **! Needs authentication** |
| **runpod** | `npx -y @runpod/mcp-server@latest` | **✘ Failed to connect — CONNECTION_CLOSED** |
| **playwright** | `npx @playwright/mcp@latest` (user scope) | **✘ Failed to connect — CONNECTION_CLOSED** |
| claim-append | `node scripts/mcp/claim-append-server.mjs` | ⏸ Pending approval |

**Nine connected · three unauthenticated · two failing · one unapproved.** The three most
under-considered servers in the lead's brief — `n8n`, `mem0`, `miro` — are exactly the three sitting in
`Needs authentication`. **The reason nobody has used them may be simply that nobody could.**

`claude mcp list` also emits a diagnostic worth carrying: `playwright` is **defined in two scopes with
different endpoints** (`user`: `npx @playwright/mcp@latest`; `project`: `npx -y @playwright/mcp@latest
--isolated`), and the tool warns that "OAuth tokens are stored per endpoint, so authenticating in one
context will not carry over." The repo's one working browser grant has a duplicate-definition footgun
under it.

**A capability audit is a one-command daily check and nothing runs it.** `claude mcp list` returns health
per server. Territory 03 has no oracle today; this is the cheapest possible one.

### 0.2 The command line that already exists here

`command -v` sweep, same session:

**Present:** `gemini` (0.38.2) · `ollama` · `ffmpeg` 8.1.1 · `gh` · `vercel` · `supabase` · `wrangler` ·
`pdftotext` · `jq` · `curl` · `python3` · `uv` · `bun` · `node` v24.11.1 · `npm` 11.10.0 · `osascript` ·
`shortcuts` · `launchctl` · `crontab`. macOS 26.5.2 (build 25F84), Apple silicon.

**Absent:** `codex` · `stripe` · `yt-dlp` · `pandoc` · `magick` (ImageMagick) · `tesseract` · `sox` ·
`yq` · `rclone` · `docker` · `aws` · `terraform` · `flyctl` · `doctl` · `railway` · `twilio` · `llm`.

Two of those absences are load-bearing and cheap to fix: **`codex`** (`npm i -g @openai/codex` `[S]`) is
the missing second model family the repo has declared structurally unreachable in four places; and
**`ffmpeg` being present** means every video capability below is already one shell command from working.

### 0.3 The second model family is reachable, and the sandbox is what hides it

Three measurements, in order:

```
$ gemini --version                    # sandboxed
Error in /Users/adamks/.gemini/settings.json: EPERM: operation not permitted
$ gemini --version                    # sandbox disabled
0.38.2

$ ollama list                         # sandboxed
Error: dial tcp 127.0.0.1:11434: connect: operation not permitted
$ ollama list                         # sandbox disabled
NAME               ID              SIZE    MODIFIED
kimi-k2.5:cloud    6d1c3246c608    -       6 months ago
glm-5:cloud        c313cd065935    -       6 months ago
```

**Both second-family runtimes are installed and both are invisible to a sandboxed agent, for two
*different* reasons.** `~/.gemini` is in the sandbox's `denyRead` list, so `gemini` cannot read its own
config and dies before it reaches the network. `ollama` talks to a loopback daemon on `127.0.0.1:11434`,
and the sandbox denies loopback — **the identical mechanism that makes `check:mc` fail**, already
documented in CLAUDE.md as `EADDRINUSE` with `errno: 0`. That is now two capabilities lost to one
sandbox behaviour, which makes it a design question rather than a quirk.

Third measurement, and it is the sting:

```
$ ollama run glm-5:cloud "…"
Error: glm-5 was retired at 2026-07-15
$ ollama run kimi-k2.5:cloud "…"
Error: kimi-k2.5 was retired at 2026-07-31
```

**Both pulled models are retired.** Note what that error proves: the request *reached Ollama's cloud and
was authenticated* — a retirement notice is not an auth failure. So the account works, the runtime works,
and the only thing wrong is that the two model pins are six months stale and nothing ever checked. There
are **zero local weights on disk** (both entries show size `-`, i.e. cloud-hosted).

**This is `built-and-never-wired` in its purest form, in the capability layer**: a second and third model
family (Moonshot Kimi, Zhipu GLM), paid for, authenticated, reachable — and dead on a version pin nobody
watched. A `ollama pull <current model>` plus one sandbox exemption is the whole distance between here and
the multi-family panel that CLAUDE.md calls an accepted risk running to 2026-11-17.

> **Territories: 03 hands · 08 quality (second family) · 09 control (the sandbox seam) · 11 runtime.**

---

## 1 · The ~15 already connected — what a 24/7 company could actually do with them

For each: what it is, the **exact tool names** it exposes (taken from this session's own tool roster, so
`[M]`), and the uses nobody in two sessions has named. I have skipped restating what is obvious.

### 1.1 `higgsfield` — the most under-used asset on the machine, by a distance

**What it is `[M]`:** a media-generation MCP server exposing **84 tools** in this session (counted from this session's own roster). Not a
text-to-image toy. The tool list includes, verbatim:

- **Generation:** `generate_image` · `generate_video` · `generate_audio` · `generate_3d` · each with a
  `_batch` variant plus `jobs_wait` · `upscale_image` / `upscale_video` (2K/4K) · `outpaint_image` ·
  `reframe` · `remove_background` · `motion_control` · `voice_change` · `dubbing`
- **Identity:** `create_voice` · `create_voice_from_confirmed_audio` · `list_voices` · `show_characters` ·
  Soul-ID character training via the bundled skills
- **Distribution — and this is the part nobody has noticed:** `tiktok_connect` · `tiktok_accounts` ·
  `tiktok_prepare_publish` · **`tiktok_publish`** · `tiktok_publish_status` · `tiktok_reconnect` ·
  `tiktok_music_trending` · `tiktok_music_tune`
- **Judgement:** **`virality_predictor`** · `video_analysis_create` / `_jobs` / `_status` ·
  `show_marketing_studio_generations` · `participate_in_contest`
- **Production lines:** `shorts_studio_create` (+ presets, sessions, status) · `personal_clipper_create` ·
  `get_explainer_presets` / `resolve_explainer_preset` · `get_workflow_instructions` (ad-multiplier,
  character-sheet, website-builder-flow, explainer)
- **Hosting:** `create_website` · `deploy_website` · `publish_website` · `website_db` · `website_secrets` ·
  `website_repo_access` · `website_status` · `list_websites` · `rename_website`
- **Money:** `balance` · `show_plans_and_credits` · `transactions` · `confirm_billing_purchase`
- **Escape hatch:** **`sandbox_exec`**

**What nobody has considered:**

1. **It can publish to TikTok without a human.** `tiktok_publish` is a *worldly* action — content leaves
   the building under the company's name. Territory 09 has no tier for that and the territory file says
   so (gap #8). This is the single most concrete instance of the gap: the capability is live, connected,
   and ungoverned, today.
2. **`virality_predictor` is a verdict from the world, or the nearest thing we own.** Territory gap #5 is
   *"nothing asks did it work, only is it right."* A predicted-engagement score on a produced asset is a
   pre-publication oracle that is not a code test — the first non-code oracle available to this company
   without building anything.
3. **`create_website` + `deploy_website` + `website_db` is a second, entirely separate deployment
   substrate** to Vercel — with its own database and secrets store. A landing page for a validation
   experiment need not touch the main repo, CI, or the QA gate at all. That changes what "ship a test"
   costs.
4. **`sandbox_exec` is remote code execution through a media server.** Whatever else is decided, this one
   tool deserves an explicit grant decision. It is the widest capability in the connected set and it is
   attached to the server everyone thinks of as "the video one."
5. **`generate_audio` + `create_voice` + `dubbing` makes the founder's voice a company asset** — a cloned
   narration voice used across explainers, and localisation of any asset into other languages, with no
   second recording session.
6. **Batch + `jobs_wait` is the shape of overnight work.** Twenty ad variants queued at 2am, judged by
   `virality_predictor` at 6am, top three in the morning briefing. That is a mission, not a session, and
   the tools for it are already authorised.

**Cost:** credits, queryable in-band (`balance`, `show_plans_and_credits`, `transactions`) — which is
rare and useful: an agent can check its own budget before spending. **Risk:** `tiktok_publish` and
`sandbox_exec` are both irreversible-class. **Territories:** 03 · 05 (media as memory) · 08 · 09 · 13.

### 1.2 `n8n` — the general-purpose limb, currently unauthenticated

**What it is `[M]`:** the connected server is a **self-hosted n8n cloud instance**
(`beamixai.app.n8n.cloud`), exposing only `authenticate` and `complete_authentication` in this session —
because it is unauthenticated. Once authorised, an n8n instance is an execution surface for hundreds of
service integrations that will never each have an MCP server.

**What nobody has considered:** n8n solves the *inbound* half of the company, which MCP does not touch.
MCP is a way for an agent to **call out**. Nothing in the current design lets the world **call in**.
n8n gives, in one already-paid-for hop:

- **Webhook receivers** — a Stripe payment, a form submission, a GitHub event, a customer reply becomes a
  row a mission can wake on.
- **Schedules** that are not this Mac's `launchd` — they run when the laptop is shut.
- **A long tail of services** with no MCP server, reachable through one authenticated hop instead of N.
- **A queue and a retry policy** that outlive a Claude session, which is the literal definition of
  "missions that outlive a session" in territory 01.

**Cost:** an n8n cloud plan already being paid for; setup is an OAuth click. **Risk:** it is a *very* wide
grant — n8n can reach anything its credentials reach, and an agent driving n8n inherits all of it. This is
the strongest argument in the whole study for a per-worker grant model rather than a per-account one.
**Territories:** 01 · 03 · 06 · 09 · 11.

### 1.3 `mem0` — the memory store the memory design forgot

**What it is `[M]`:** hosted memory-as-a-service at `https://mcp.mem0.ai/mcp`; unauthenticated here, so
only `authenticate` / `complete_authentication` are exposed. CLAUDE.md's Stack block already names it:
*"Memory: Mem0 (primary) + Anthropic Memory Tool (auto-fallback after 3 retries)"* — a documented primary
memory system, connected, unauthenticated, and **not referenced by any of the four memory files** the same
document describes.

**What nobody has considered:** territory 05 asks for episodic/semantic/procedural memory, retrieval,
conflict and forgetting. Those are mem0's product surface, not a thing to design from scratch — it
does extraction, deduplication, contradiction handling and scoped recall. Two specific uses:

- **Per-venture scoping.** Territory 14 asks how several ventures run at once. A memory store with user/
  agent/run scopes answers "what does the company know about *this* venture" without a file convention.
- **The 2,936 unread transcripts (gap #2) have a destination.** Whatever mines them needs somewhere to put
  what it finds that is not another markdown file with a byte cap.

**Cost:** mem0 has a free tier and paid plans; the authenticated grant is one click. **Risk:** memory
poisoning — anything that writes memories becomes an injection surface for everything that reads them, so
the *writer* grant matters far more than the reader. **Territories:** 04 · 05 · 12 · 14.

### 1.4 `Miro` — the balcony that already exists, unauthenticated

**What it is `[M]`:** `https://mcp.miro.com`, needs auth. A `miro-diagram` and a `miro-doc` skill are
already installed in this session's skill list.

**What nobody has considered:** the rethink wants a **balcony** — a surface the founder watches and steers
from — and has been imagining it as mission-control views. A Miro board is a shared spatial canvas that
**both** the founder and the workers can write to, that persists between sessions, that is readable on a
phone, and that requires no code. Concretely: a board per venture; missions as cards moving across lanes;
a worker posting its artifact as a frame; the founder dragging a card to redirect (gap #4 — *you cannot
steer something already running*). Sticky-note position is a legitimate control channel and it needs no
new UI. **Cost:** a Miro plan; OAuth. **Risk:** low; it is a whiteboard. **Territories:** 01 · 06 · 10 · 14.

### 1.5 `RunPod` — a compute budget with no job

**What it is `[M]`:** **54 tools**, currently failing to connect (`CONNECTION_CLOSED`). The tool surface
is a full GPU cloud control plane, not a model endpoint: `create-pod` · `start-pod` / `stop-pod` /
`restart-pod` · `create-endpoint` / `update-endpoint` / `delete-endpoint` · `run-endpoint` ·
`runsync-endpoint` · `stream-job` · `get-job-status` · `cancel-job` / `retry-job` · `create-template` ·
`create-network-volume` · `deploy-hub-repo` · `list-gpu-types` · `get-capacity` · **`get-billing`** ·
`stream-pod-logs` · `stream-worker-logs` · container-registry auth and delegation tools.

**What nobody has considered:** RunPod is the answer to "where does work run that is not a Claude turn."
Four uses, none of which anyone has named:

1. **A durable host for the 24/7 loop.** The territory file's "runs 24/7" is currently bounded by this
   laptop being awake. A pod is not.
2. **Open-weight models on our own terms** — a serverless endpoint running Qwen/Llama/DeepSeek weights
   gives a second model family that is *ours*, priced per second, with no vendor able to retire it out
   from under us (which is exactly what just happened to the two Ollama pins in §0.3).
3. **Bulk, embarrassingly-parallel jobs** that should never burn Opus tokens: embedding 2,936 transcripts,
   transcribing a back catalogue, rendering a hundred video variants, running an eval suite.
4. **`get-billing` in-band** — like higgsfield's `balance`, the agent can read its own spend. Territory 13
   wants the company's own P&L; two connected servers already report their side of it.

**Cost:** per-second GPU, from cents to dollars per hour; **the meter runs whether or not anyone is
watching**, which is the real risk — a pod left up is a silent, unbounded spend, and this repo's
budget-guard counts *output tokens*, not dollars on someone else's cloud. **Fix the connection first:**
`CONNECTION_CLOSED` on `npx -y @runpod/mcp-server@latest` is likely a missing `RUNPOD_API_KEY` in the
server's env. **Territories:** 03 · 11 · 12 · 13.

### 1.6 `Figma` (official) — bidirectional, and the reverse direction is unused

**What it is `[M]`:** 33 tools including `get_design_context` · `get_screenshot` · `get_metadata` ·
`get_variable_defs` · `search_design_system` · `get_figjam` · **`create_new_file`** · **`use_figma`** ·
**`generate_diagram`** · `upload_assets` / `download_assets` · **`export_video`** · Code Connect
(`get_code_connect_map`, `add_code_connect_map`, `send_code_connect_mappings`) · shader tools · and a
**`weave_*`** family (`weave_list_tools`, `weave_run_tool`, `weave_get_tool_run_output`,
`weave_cancel_tool_run`) — an async job runner inside Figma.

**What nobody has considered:** everyone reads Figma **into** code. The unused direction is
**code → Figma**: after a build, push the shipped screens back as a Figma file so design and code stop
diverging, with `add_code_connect_map` making the correspondence machine-checkable. And `generate_diagram`
into FigJam means the architecture diagrams in `docs/03-system-design/` could be generated from the code
rather than drawn once and left to rot — the same disease the supersession blocks in CLAUDE.md fight in
prose. **Cost:** included with the Figma plan. **Territories:** 03 · 04 · 10 · 12.

### 1.7 `Pencil` · `Stitch` · `Refero` — three design hands with three different jobs

- **`Pencil` `[M]`** — a local, encrypted `.pen` design editor: `batch_design` · `batch_get` ·
  `snapshot_layout` · `get_screenshot` · `get_variables` / `set_variables` ·
  `replace_all_matching_properties` · `search_all_unique_properties` · `export_nodes` ·
  `find_empty_space_on_canvas`. **Unconsidered:** `replace_all_matching_properties` +
  `search_all_unique_properties` is a **design-system linter** — enumerate every unique value in a
  document, find the 14 near-identical greys, replace them all. That is a mechanical taste check, the kind
  territory 08 says it lacks.
- **`Stitch` `[M]`** (Google, `stitch.googleapis.com/mcp`) — `generate_screen_from_text` ·
  `generate_variants` · `create_design_system` / `apply_design_system` / `update_design_system` ·
  `create_design_system_from_design_md` · `upload_design_md` · `edit_screens`. **Unconsidered:**
  `generate_variants` is the *blind variations* half of `design.js` — the workflow with zero invocations
  ever — available as a hosted call. And `create_design_system_from_design_md` means a written design
  system in markdown becomes an enforceable artifact.
- **`Refero` `[M]`** — a searchable corpus of real product screens: `refero_search_screens` ·
  `refero_search_flows` · `refero_search_styles` · `refero_get_screen_image` · `refero_get_similar_screens`
  · `refero_get_flow` · `refero_get_style`. **Unconsidered:** this is **evidence for design**, which is
  exactly what `sourcer` is for and has never been pointed at. "Show me 20 real onboarding flows in this
  category" is a sourced claim, not a taste assertion. It also answers the *examples* clause of territory
  04 for a non-code domain.

### 1.8 `Gmail` · `Google Calendar` · `Google Drive` — the founder's own surfaces

**What they are `[M]`:** Gmail exposes 29 tools including `send_message`, `reply`, `forward`,
`create_draft`, `search_threads`, label management and `apply_sensitive_message_label`. Calendar exposes
`create_event`, `update_event`, `delete_event`, `respond_to_event`, `suggest_time`, `search_events`. Drive
exposes `create_file`, `update_file`, `read_file_content`, `search_files`, **`share_file`**,
`get_file_permissions`, `trash_file`.

**What nobody has considered:**

- **Email-in is the cheapest inbound channel that exists and it is already connected.** `search_threads`
  polled on a label is a task queue: the founder forwards something to a label from a phone, a mission
  picks it up. No app, no API, no new surface — and it answers gap #9 (*the founder talks to this system
  by voice; nothing is designed for that*) halfway, because dictated email is voice-in.
- **`send_message` is the worldly-risk boundary in its clearest form.** Reading mail is one grant; sending
  mail as the founder is a completely different one, and today they are the same connector. Any tiering
  scheme should be tested against this pair first, because the split is obvious and the current model
  cannot express it.
- **Calendar is where 24/7 becomes legible.** A mission that books its own review slot, or blocks the
  founder's Tuesday for the decision it needs, is steering without interrupting.
- **`share_file` is an outbound publication act** wearing the costume of a file operation. It is the
  quietest irreversible action in the connected set.

### 1.9 `Notion` — and the part of it that is not a wiki

**What it is `[M]`:** 38 tools. The document half is expected (`notion-create-pages`,
`notion-update-page`, `notion-search`, `notion-query-data-sources`, `notion-create-database`,
`notion-create-comment`). **The unexpected half:** `notion-spawn-session` · `notion-send-message-to-session`
· `notion-stop-session` · `notion-wait-session` · `notion-query-sessions` · `notion-search-agents` ·
`notion-list-session-events` · `notion-read-session-event` · `notion-convert-page-to-skill` ·
`notion-search-skills`.

**What nobody has considered:** **Notion ships an agent-session control plane and it is connected here.**
`spawn` / `send-message` / `stop` / `wait` / `list-events` is a supervision API — the same shape as the
balcony being designed from scratch, reachable today, with a phone client and a mobile app already built.
Whether to *use* it is a real question (it is someone else's runtime), but "we would have to build the
mobile surface" is not currently true, and `notion-convert-page-to-skill` means a founder-written page
becomes a loadable skill without a commit. **Territories:** 02 · 04 · 06 · 10 · 14.

### 1.10 `Playwright` — connected, failing, and duplicated

**What it is `[M]`:** 24 tools — `browser_navigate` · `browser_click` · `browser_type` ·
`browser_fill_form` · `browser_snapshot` · `browser_take_screenshot` · `browser_evaluate` ·
`browser_network_requests` · `browser_console_messages` · `browser_file_upload` · `browser_tabs` ·
`browser_run_code_unsafe` · `browser_wait_for` · `browser_handle_dialog`.

**Status `[M]`: the user-scope definition fails to connect and conflicts with the project-scope one.**
The repo's single most important non-code hand is in a broken state right now and nothing reports it.

**What nobody has considered:** `browser_network_requests` + `browser_console_messages` turn the browser
into a **verification instrument, not just a driver** — "the page rendered" is weak; "no console errors,
no 4xx, LCP element present" is an oracle. And a headed browser is the **only** hand that reaches services
with no API at all: an ad platform's UI, a marketplace seller console, a partner's dashboard. That is a
capability with an obvious, serious governance question attached, which is the point of naming it here.

### 1.11 Also present in this session, and not in the territory file's ~15

- **`claude-in-chrome` `[M]`** — 22 tools driving the founder's **own logged-in Chrome**
  (`mcp__claude-in-chrome__navigate`, `computer`, `read_page`, `form_input`, `file_upload`,
  `javascript_tool`, `read_network_requests`, `shortcuts_execute`, `gif_creator`, …). This is a
  categorically different grant from Playwright: Playwright drives an *isolated* browser, this drives the
  **authenticated human's session** — every service the founder is logged into, with their cookies. It is
  the widest hand on the machine and the territory file does not list it.
- **`claim-append` `[M]`** — the repo's own MCP server, ⏸ pending approval. Proof that **writing a server
  is a normal-sized task here** (one `.mjs` file), which is the premise for everything in §2.10.

---

## 2 · MCP servers that exist in the world and are NOT connected here

All URLs accessed **2026-09-01**. Marks per §0's legend. "Unlocks" is written for *this* company — a
one-founder, multi-venture, 24/7 shop — not in general.

### 2.1 Money — the territory with the most first-party servers and the least coverage here

| Server | URL | Unlocks | Cost · risk | Terr. |
|---|---|---|---|---|
| **Stripe** `[F]` | `https://mcp.stripe.com` — docs <https://docs.stripe.com/mcp> | The largest verified tool surface I found anywhere. Not just "create a payment link": `stripe_api_read` / `stripe_api_write` cover ~150 documented API methods, plus **`stripe_analytics`** (private preview) which *runs SQL against reporting tables*, `list_metrics`, `metric_drilldown`, `show_metric_app`, `create_refund`, `get_balance_summary`, `stripe_report`. A worker can answer "what is MRR by cohort" without a warehouse. | Free; OAuth or restricted API key. **Risk: the highest of any entry** — `stripe_api_write` is unbounded POST/PATCH/DELETE across the account. Stripe's own page says to "enable human confirmation of tools." Restricted keys are the narrowing mechanism and they are per-key, not per-agent. | 08 · 09 · 13 · 14 |
| **Shopify — Storefront MCP** `[S]` | `https://{shop}.myshopify.com/api/mcp` — <https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront> | **Every Shopify store on earth exposes this with no key and no auth.** That makes it a *competitive research* instrument, not only a seller tool: catalogue, pricing and policies of any competitor store, queryable. | Free, unauthenticated. Risk: reputational if used at scale — it is polite scraping with a blessed endpoint. | 08 · 13 |
| **Shopify — Dev / AI Toolkit** `[S]` | <https://shopify.dev> (open-sourced 2026-04-09) | Admin API schemas + live store ops for building a storefront venture. | Free. | 03 |
| **Xero** `[S]` | <https://devblog.xero.com> (vendor blog announcing it) · <https://github.com/XeroAPI/xero-agent-toolkit> | The company's own books readable by an agent — territory 13's "the company's own P&L" without a spreadsheet. | Xero subscription. Risk: write access to ledgers is an audit problem, keep read-only. | 13 · 14 |
| **PayPal, Square, Adyen, Coinbase** `[R]` | — | Alternative rails. Quarantined to §7 until vendor-verified. | — | 13 |

**No Paddle MCP server was found** in a targeted search `[S-negative]` — notable because CLAUDE.md's
stack block names Paddle in the GSA template. If Paddle is the biller, that hand must be built (§2.10).

### 2.2 The world's verdict — analytics, flags, errors, monitoring

This cluster is the direct answer to territory gap #5, *"no verdict from the world — nothing asks did it
work, only is it right."* Every one of these is a *did it work* instrument.

| Server | URL | Unlocks | Cost · risk | Terr. |
|---|---|---|---|---|
| **PostHog** `[F]` | `npx @posthog/wizard mcp add` — <https://posthog.com/docs/model-context-protocol> | The single highest-value unconnected server for this company. One free hosted endpoint gives **product analytics + feature flags + session replay + error tracking + a SQL dialect (HogQL)**. PostHog's own examples: "ship a feature flag from a prompt", "dig into a stack trace", "run a HogQL query". A mission can ship behind a flag, measure the cohort, and roll back — **without a human in the loop and without five vendors.** | Free hosted endpoint; PostHog's generous free tier. Risk: flag flips are production changes. | 08 · 12 · 13 |
| **Sentry** `[F]` | `https://mcp.sentry.dev/mcp` | "Searching errors, analyzing performance, triaging issues… managing projects." An agent that watches its own shipped work's error rate is the missing half of `/ship`. | Free tier. Low risk (read-dominant). | 08 · 12 |
| **Grafana** `[S]` | <https://grafana.com/docs/grafana/latest/developer-resources/mcp/> · Cloud: <https://grafana.com/docs/grafana-cloud/ai-tools/mcp-servers/cloud-mcp/> | Dashboards, Prometheus/Loki/Pyroscope queries, alerting, incidents, on-call. | OSS free. | 08 · 11 |
| **Datadog** `[S]` | <https://docs.datadoghq.com/mcp_server/> (GA March 2026) | Logs, metrics, APM traces, RUM, monitors, incidents, plus opt-in toolsets for CI visibility, feature flags, synthetics, error tracking. | Expensive at scale. | 08 · 11 |
| **LaunchDarkly** `[R]` | existence reported only by directories (pulsemcp, lobehub) — **verify on launchdarkly.com before relying on it** | Flags, targeting rules, gradual rollouts as agent-callable operations. | Paid. **Risk: a flag change is a production change with no diff and no PR** — the QA gate cannot see it. | 09 · 12 |
| **Better Stack, Honeycomb, New Relic** `[R]` | — | Alternatives; §7. | — | 08 |

### 2.3 Growth — social, ads, SEO, email, community

**The ads finding is the most consequential single item in §2**, and it splits by vendor:

| Server | URL | Unlocks | Cost · risk | Terr. |
|---|---|---|---|---|
| **Meta Ads MCP** `[S]` | <https://developers.facebook.com/documentation/ads-commerce/ads-ai-connectors/ads-mcp-server/ads-mcp-server-overview> (+ `/ads-mcp-server-tools`, `/ads-mcp-server-tools-ad-creation-and-management`, `/ads-mcp-server-get-started`, `/ads-mcp-server-rules-best-practices`) | **Read *and write* on a real ad account, first-party, OAuth-gated.** An agent can create a campaign, set a budget, launch creative made by `higgsfield`, read the result, and iterate — the whole loop, no human. This is the sharpest instance of *worldly risk* in the entire study: it spends real money at the agent's discretion, continuously, at 3am. Meta publishes a "Rules best practices" page, which tells you they expect exactly this problem. | Ad spend. **Risk: unbounded financial, irreversible, external.** Nothing in this repo's tiering can currently express "may spend up to $X/day." | 09 · 13 · 03 |
| **Google Ads MCP** `[S]` | <https://github.com/googleads/google-ads-mcp> · <https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server> | Official, open source, maintained by the Google Ads API team. Tools: `search` (GAQL), `get_resource_metadata`, `list_accessible_customers`. **Read-only** — it cannot change bids or pause campaigns. | Free. Low risk by construction. **The contrast with Meta is the design lesson: the same category, two vendors, and one of them narrowed the grant for you.** | 08 · 13 |
| **Ayrshare** `[S]` | <https://www.ayrshare.com/docs/apis/overview> | One REST API posting to **13 networks**: Bluesky, Facebook, Google Business Profile, Instagram, LinkedIn, Pinterest, Reddit, Snapchat, Telegram, Threads, TikTok, X, YouTube — plus analytics, comments, DMs, and Facebook ad creation. Replaces thirteen OAuth integrations, thirteen rate-limit models and thirteen review processes with one. | Paid tiers. **Risk: it is a single credential that can speak as the company on 13 platforms.** The narrowest useful grant is per-platform, which this API does not enforce — you would enforce it. | 03 · 09 |
| **Ahrefs · Semrush · DataForSEO · SE Ranking** `[R]` | four independent 2026 round-ups (mcp.directory, seoprofy, serpstat, contextbolt) agree all four run **first-party** remote MCP servers and that DataForSEO is the raw pay-per-use data layer under the others. **No vendor page opened by me — check each before buying.** | Keyword demand, SERP position, backlinks, competitor content gaps — the evidence base for `sourcer` in a domain where it currently has none. This is how *validate-a-market* stops being an opinion. | Ahrefs/Semrush: included with paid plans. DataForSEO: per-call, cheap. | 04 · 08 |
| **Resend** `[F/S]` | <https://github.com/resend/resend-mcp> · <https://resend.com/changelog/mcp> | Official. Ten tool groups: emails, contacts, broadcasts, domains, webhooks, segments, topics, contact properties, API keys, **received emails**. `received emails` matters — it is an *inbound* channel, not just outbound. | Free tier. **Risk: sending as the company's domain is worldly and irreversible.** | 03 · 06 · 09 |
| **Slack** `[S]` | <https://docs.slack.dev/ai/slack-mcp-server/> | Official first-party: search, read/send messages, canvases, users, file upload, lists. Streamable HTTP + JSON-RPC 2.0. Would give worker↔founder messaging on a surface that already has a phone client. | Free/paid Slack. | 06 · 10 |
| **Intercom · Plain · Pylon** `[S]` | <https://www.plain.com/blog/mcp-customer-support-2026> | Support-platform MCP. **Plain writes** (reply, assign, label, snooze, prioritise); **Intercom is read-only**; Pylon writes. Zendesk has none. Customer language straight into `USER-INSIGHTS.md`. | Paid. | 04 · 05 |
| **HubSpot** `[F]` | `mcp.hubspot.com` — <https://developers.hubspot.com/mcp> | CRM objects (contacts, companies, deals, tickets, products, orders) + engagements (calls, emails, meetings, notes, tasks). | Free CRM tier exists. | 13 · 14 |
| **Canva** `[S]` | `https://mcp.canva.com/mcp` — <https://www.canva.dev/docs/mcp/> | Create designs, **autofill brand templates**, export to PDF/image/video. Brand-template autofill is the piece: 200 localized ad variants from one template without a designer or a model. | Canva plan. | 03 |
| **Beehiiv · Ghost** `[S]` | <https://developers.beehiiv.com/welcome/getting-started> · Ghost Admin API | Create posts, trigger sends, manage subscribers, pull analytics — programmatic publishing. REST, not MCP. | Platform fees. | 03 |
| **Discord · Telegram Bot API** `[S]` | <https://docs.discord.com/developers/bots/overview> · Telegram Bot API | Community presence and, more usefully, **a control channel the founder already has on their phone.** A Telegram bot is the cheapest voice/text remote for the balcony that exists. | Free. | 06 · 10 |

**Two hard platform limits worth knowing before designing anything social** `[S]`:
**LinkedIn** — roughly **100 API calls/day/member**, requires the verified "Share on LinkedIn" product and
`w_member_social` / `w_organization_social` scopes. **Reddit** — 100 QPM authenticated, **1 post per 10
minutes for new accounts**, 1 comment per 10 seconds, subreddit-level karma/age/flair rules, and it is
**$0.24 per 1,000 calls once the use is commercial**, under a hand-reviewed contract. A "post everywhere
continuously" design dies on these two; a "post thoughtfully, rarely, per platform" design does not.

### 2.4 Engineering — code, deploy, data, infrastructure

| Server | URL | Unlocks | Cost · risk | Terr. |
|---|---|---|---|---|
| **GitHub** `[F]` | `https://api.githubcopilot.com/mcp/` — <https://github.com/github/github-mcp-server> | Official, and **toolset-scoped**, which is the interesting part: `context, actions, code_quality, code_security, copilot, discussions, gists, git, issues, labels, notifications, orgs, projects, pull_requests, repos, secret_protection, security_advisories, stargazers, users, dependabot`. Today this repo drives GitHub through the `gh` CLI with no scoping at all. **The toolset list is a ready-made grant vocabulary** — see §5. | Free. | 02 · 09 · 12 |
| **Supabase** `[F]` | `https://mcp.supabase.com/mcp` — <https://supabase.com/docs/guides/getting-started/mcp> | Feature groups, again scoped: `database`, `debugging`, `development`, `edge functions`, `account`, `docs`, `branching` (paid, experimental), `storage` (**disabled by default**). Branching gives an agent a *disposable database* per mission. | Free tier. Risk: `database` includes migrations — this repo's `enforcement: block` tier. | 03 · 09 · 11 |
| **Vercel** `[F]` | `https://mcp.vercel.com` — <https://vercel.com/docs/agent-resources/vercel-mcp> | Docs search, projects, deployments, **deployment logs**, and **Web Analytics queries** (visitors, page views, custom events). Changelog entries confirm it "can now deploy code" and "supports purchases". Vercel restricts connections to clients it has reviewed; Claude Code is on the list. | Free tier. Risk: deploy + purchase are both worldly. | 08 · 11 · 13 |
| **Cloudflare — 17 servers** `[F]` | <https://developers.cloudflare.com/agents/model-context-protocol/mcp-servers-for-cloudflare/> | Cloudflare ships **one server per concern**, which is itself the best real-world example of narrow grants: `docs.mcp` · `bindings.mcp` · `builds.mcp` · `observability.mcp` · `radar.mcp` · **`containers.mcp` (spin up a sandbox dev environment)** · **`browser.mcp` (fetch pages → markdown + screenshots)** · `logs.mcp` · `ai-gateway.mcp` · `autorag.mcp` · `auditlogs.mcp` · `dns-analytics.mcp` · `dex.mcp` · `casb.mcp` · `graphql.mcp` · `agents.cloudflare.com/mcp` · and `https://mcp.cloudflare.com/mcp` exposing **"the entire Cloudflare API — over 2,500 endpoints" through two tools.** | Free tiers throughout. Risk: the API server is the widest single grant in this document after `sandbox_exec`. | 03 · 09 · 11 |
| **Cloudflare Registrar API** `[S]` | <https://developers.cloudflare.com/registrar/registrar-api/> (beta, 2026-04-15) | **Search, price-check and register a domain programmatically** — and Cloudflare says the endpoints are "available through Cloudflare MCP by default." A venture-launch mission can acquire its own domain. Free API access for all users, unlike GoDaddy (50+ domains) or Namecheap ($50 balance). | Domain cost. **Risk: irreversible purchase, external, and it creates a public artifact bearing the company's registrant data.** | 09 · 13 · 14 |
| **Neon** `[S]` | `mcp.neon.tech` — <https://neon.com/docs/ai/neon-mcp-server> | Postgres with **branching** — a database branch per agent, thrown away after. | Free tier. | 11 |
| **Snowflake · BigQuery · ClickHouse · MotherDuck/DuckDB · Databricks · Redshift** `[S]` | e.g. <https://motherduck.com/learn/motherduck-ai-agent-data-layer/> | Warehouse-scale question answering. MotherDuck is the right size here: local DuckDB *or* cloud, per-agent compute isolation, zero-copy clones. **A DuckDB file is also the cheapest possible home for the 2,936 transcripts** (gap #2) — no server, no schema migration, SQL over JSONL today. | MotherDuck free tier; DuckDB free. | 05 · 12 · 13 |
| **Linear** `[F]` | `https://mcp.linear.app/mcp` — and a **`/mcp/readonly` variant** | Issues, projects, comments. Note the design: the vendor ships a *separate read-only URL*. That is a grant primitive, free, today. | Free tier. | 01 · 02 |
| **Sentry / PostHog** — see §2.2. **Jira · Asana · ClickUp · Notion** `[R]`/connected. | | | | |

### 2.5 Web data — the eyes

| Server | URL | Unlocks | Cost · risk | Terr. |
|---|---|---|---|---|
| **Firecrawl** `[F]` | `https://mcp.firecrawl.dev/v2/mcp` — <https://docs.firecrawl.dev/mcp-server> | Search, scrape, crawl, parse → clean markdown. The default hand for "read this whole competitor site." | Paid, cheap. | 04 · 08 |
| **Bright Data** `[S]` | `https://mcp.brightdata.com/mcp?token=…` — <https://docs.brightdata.com/ai/mcp-server/overview> | **69 tools**, unblocked access to sites that refuse ordinary clients, **5,000 requests/month free**. | Free tier then paid. **Risk: it exists to defeat anti-bot measures; that is a policy decision, not a technical one.** | 04 · 09 |
| **Apify** `[S]` | `https://mcp.apify.com` — <https://docs.apify.com/integrations/mcp> | Runs **Actors** — thousands of pre-built, maintained scrapers (Instagram, TikTok, Maps, Amazon, LinkedIn…). Buying a scraper beats writing one, and beats maintaining one by more. | Per-run credits. | 04 · 08 |
| **Exa** `[R]` | reported as `exa-labs/exa-mcp-server` by directories; exa.ai not opened by me | Neural web search + content fetch + multi-step research; ~1,000 searches/month free. Built for agents rather than humans. | Free tier. | 04 |
| **Tavily · Perplexity Sonar** `[S]` | <https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server> | Agent search APIs; Perplexity returns **synthesised, cited** answers — which fits `sourcer`'s contract (URL + quote + access date) better than a link list does. | Per-call. | 04 |
| **Browserbase / Stagehand** `[S]` | <https://docs.browserbase.com/integrations/mcp/introduction> · <https://github.com/browserbase/mcp-server-browserbase> | **Cloud browsers, in parallel, off this laptop** — natural-language page actions via Stagehand. The missing piece for concurrent browser work: local Playwright is one machine and one profile. | Per-session. | 03 · 11 |
| **Cloudflare Browser Run** `[F]` | `https://browser.mcp.cloudflare.com/mcp` | Page → markdown + screenshot, free tier, no browser to install. The cheapest possible "look at this page." | Free tier. | 03 |

### 2.6 Media, voice and the physical/legal edge

| Server / API | URL | Unlocks | Cost · risk | Terr. |
|---|---|---|---|---|
| **ElevenLabs** `[S]` | <https://elevenlabs.io/blog/introducing-elevenlabs-mcp> (vendor announcement; repo path not opened by me) | TTS, voice cloning/design, STT, voice conversion, audio isolation, soundscapes — **and outbound phone calls with a conversational agent.** The last one is a hand nobody has named: the company can *phone a customer*. | Per-character/minute. **Risk: outbound calling as the company is a legal surface (consent, recording law) before it is a technical one.** | 03 · 09 |
| **Deepgram** `[S]` | <https://cli.deepgram.com/> — the official CLI **runs as an MCP server** | Transcription with diarization, TTS, sentiment/topic/intent analysis. Sub-300ms streaming. | Per-minute, cheap. | 03 · 05 |
| **Twilio** `[R]` | reported as `twilio-labs/mcp` by MCP directories, with a hosted remote server — **not confirmed on twilio.com by me** | SMS/WhatsApp send+receive, voice calls, **number lookup**, and **buying and provisioning phone numbers**. A venture can acquire its own phone number and answer it. | Per-message/minute + number rental. **Risk: worldly, regulated, irreversible.** | 03 · 09 · 14 |
| **DocuSign** `[R]` for the endpoint | the endpoint `mcp-d.docusign.com` comes from a third-party guide, not from docusign.com — **check it**. Also `[S]` <https://developers.hellosign.com/> for Dropbox Sign | Send envelopes, check signing status, query agreements, trigger workflows. Contracts without a human courier. | Paid. **Risk: legally binding artifacts. This is `blocking-human` by nature, not by policy.** | 09 · 14 |
| **Lob** `[S]` | <https://docs.lob.com/> · <https://www.lob.com/pricing> | **Physical mail from an API** — postcards, letters, cheques, with address verification. Developer plan $0/mo, **$0.77/postcard, $0.89/letter**; Startup $260/mo brings it to $0.51/$0.72. A 24/7 company that can post a physical letter is a different kind of company. | Per-piece. **Risk: irreversible in the most literal sense — you cannot unsend a letter.** | 09 · 14 |
| **DeepL** `[S]` | <https://developers.deepl.com/docs> · `https://api.deepl.com/v2/translate` | Text and **document** translation; free developer tier ~1M characters. Every asset the company makes, in every market it tests. | Free tier then per-character. | 03 · 14 |
| **App Store Connect API · Google Play Publishing API v3** `[S]` | <https://developer.apple.com/help/glossary/app-store-connect-api> · <https://android-developers.googleblog.com/2018/06/automating-your-app-releases-with-google-play.html> | Automated build upload, release creation, **webhook notification when processing completes**. If a venture is ever an app, the release path is already automatable. | Developer program fees. Risk: store review is a human gate that cannot be automated away — design for it. | 11 · 14 |
| **YouTube Data API v3** `[S]` | <https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota> | Upload, metadata, analytics. **The quota story changed twice recently and it matters:** `videos.insert` cost ~1,600 units of a 10,000/day project quota; reported cut to ~100 units on 2025-12-04, then moved to **its own bucket on 2026-06-01 — 1 unit against a dedicated limit of ~100 uploads/day.** Video publishing went from quota-bound to effectively free. | Free. Risk: publishing is worldly. **Re-verify before relying on it** — this figure moved twice in nine months. | 03 · 13 |

### 2.7 Identity, auth and the agent's own credentials

`[S]` — <https://workos.com/mcp> · <https://auth0.com/ai/docs/mcp/intro/overview> (Auth for MCP GA May
2026) · <https://clerk.com/articles/authentication-for-ai-applications>. **Not products to buy so much as
evidence of a pattern:** three identity vendors have built MCP-specific OAuth products, meaning
*"which agent is calling, and with whose delegated authority"* is now a solved commercial problem rather
than something to invent. WorkOS AuthKit becomes an MCP-compliant OAuth 2.1 authorization server with one
config value. If this company ever runs its own MCP servers for its own ventures — and §2.10 says it
should — this is the auth layer, and it is the mechanism behind §5's per-worker grants. **Territories:
09 · 02.**

### 2.8 What does NOT exist and would have to be built

Searched for and **not found as a first-party MCP server**: **Paddle** (this repo's documented biller) ·
**Zendesk** (confirmed absent by a 2026 survey `[S]`) · **Product Hunt** · **Mercury / Brex / Ramp** ·
**Companies House / Stripe Atlas / company formation** · **Trustpilot / G2 / review platforms** ·
**Printful / Printify** · **Deel / Gusto / Rippling** (HR) · **any legal-advice or contract-review
first-party server**.

More important than any single gap: **five things this company specifically needs that no vendor will ever
ship**, because they are about *its own operation*:

1. **A transcript server.** 2,936 conversations on disk, unreadable by anything. `search_transcripts`,
   `find_corrections`, `get_session`. Metaswarm's regex classifier — *~50 lines, an afternoon* per the
   reference study — is the whole prototype. Territories 05 · 12.
2. **A mission/goal server.** Territory 01 has nothing: no vendor sells "what should this company do
   next." `list_missions`, `claim_mission`, `block_mission`, `stall_check`. The **stall ceiling already
   built in `budget-guard.js`** is the hard part and it exists.
3. **A capability-registry server.** What hands exist, which are healthy, who may use which, when the
   grant expires. §0.1 shows the health check is one command and nothing runs it. This is also where §5's
   grants would live as *data*, which is this repo's whole idiom.
4. **A cost-and-worth server.** Territory 13. Note that `higgsfield.balance`, `runpod.get-billing` and
   `stripe.get_balance_summary` are three vendor-side halves of it that already exist — the missing piece
   is the join, and CAST's failure (§8b of STARTUP-OS) says **the task id has to be on the row from day
   one or it can never be joined at all.**
5. **A negative-knowledge server.** Gap #7: nothing records what failed. `record_failure`,
   `check_before_trying`. The claim ledger is the right shape and records only successes.

**And the meta-point: writing one is small.** `scripts/mcp/claim-append-server.mjs` is one file in this
repo, already registered, already narrow-granted to exactly one engine. The precedent for all five exists
and works. **Territories: 01 · 03 · 05 · 12 · 13.**

---

## 3 · Non-MCP hands — the ones you cannot see from a server list

MCP is one calling convention. It is not the boundary of what a worker can touch, and treating it as the
boundary is how a company ends up with fifteen connectors and no way to be *reached*.

### 3.1 Scheduling and liveness — four mechanisms, and only one of them survives a reboot

| Mechanism | What it is | Verdict for a 24/7 company |
|---|---|---|
| **`CronCreate` / `CronList` / `CronDelete`** `[M]` | Available as tools **in this very session**. Standard 5-field cron, local timezone; returns a job id. | **Read the fine print before designing on it.** Its own schema says: *"Jobs live only in this Claude session — nothing is written to disk, and the job is gone when Claude exits"*; the `durable` parameter *"has no effect"*; jobs *"only fire while the REPL is idle"*; and recurring tasks **auto-expire after 7 days**. It is a within-session heartbeat, **not** a 24/7 scheduler. |
| **`Monitor`** `[M]` | Also available here. Streams stdout lines from a long-running command as notifications — **and takes a `ws:` WebSocket source**, so a server can *push* an event into a running session. | **The most under-considered scheduling primitive on the machine.** It is the difference between polling and being woken. A `persistent: true` monitor on a webhook relay is a live inbound channel into an agent that is already thinking. Territory 01's "what keeps going at 3am" and territory 06's "help requests" both land here. |
| **`launchd`** `[M]` (`launchctl` present) | macOS's native supervisor: `StartCalendarInterval` for schedules, **`KeepAlive` to restart a dead process**, `WatchPaths` to fire on file change. | This is Auto-Co's *"outer daemon that restarts the script if the script dies"* (STARTUP-OS §8b) — already on the machine, no install. Bounded by the laptop being awake: pair with `caffeinate` `[M]`. |
| **`crontab` / `at`** `[M]` | Both present. | Simpler than launchd, no restart-on-death, no path watching. Use launchd. |

**And the runner underneath all of them:** `claude -p` — headless Claude Code `[S]`
(<https://code.claude.com/docs/en/headless>), with `--allowedTools` for per-invocation tool scoping and
`--bare` as *"the recommended mode for scripted and SDK calls."* **A launchd job that runs `claude -p` with
a narrowed `--allowedTools` list is a complete, working, 24/7 worker with a per-run capability grant, using
only what is installed today.** That sentence is the shortest path from the current state to the thing
being designed.

### 3.2 Inbound — how the world reaches this company

Today: **it cannot.** Every hand in §1 and §2 is outbound. Five inbound channels, ordered by cost to build:

1. **Email-in** `[M]` — Gmail MCP is connected. Poll a label with `search_threads`; the founder forwards
   from a phone. Zero build. Also **Resend's `received emails` tool group** `[S]` for a company address.
2. **`Monitor` with `ws:`** `[M]` — push, not poll. Needs a WebSocket source, which n8n or a tiny Worker
   provides.
3. **Webhooks via n8n** `[M]` — already paid for, already connected, needs one OAuth click (§1.2).
4. **`launchd` `WatchPaths`** `[M]` — a directory becomes an inbox. Drop a file, a mission starts. The
   crudest and most reliable interface in this whole document, and it needs nothing installed.
5. **SMS / voice in** — Twilio `[S]`, ElevenLabs agents `[S]`. Real cost, real regulatory surface, and the
   only channel that works when the founder is driving.

**RSS deserves a line of its own:** it is a free, universal, rate-limit-free change feed for competitors'
blogs, changelogs, job boards, funding announcements, and Product Hunt. A polling loop over ~50 feeds is a
competitive-intelligence system that costs nothing and needs no vendor. Territory 04, 08.

### 3.3 macOS-level automation — measured present, and mostly unconsidered

All `[M]`, all already installed:

`osascript` (AppleScript/JXA — drives any scriptable Mac app: Notes, Reminders, Messages, Mail, Music,
Finder) · **`shortcuts run`** (`shortcuts` CLI confirmed, subcommands `run`, `list`, `view`, `sign` — every
Shortcut the founder has, callable from a shell, **including ones that run on their iPhone via iCloud
sync**) · `screencapture` (screenshot any window or region, headlessly) · **`say`** (system TTS to a file
or aloud — the zero-cost voice channel) · `afplay` (play audio) · `sips` and `textutil` (image and
document conversion, no ImageMagick needed) · `pbcopy`/`pbpaste` (the clipboard as an IPC channel) ·
`mdfind` (Spotlight from the shell — full-text search over every document on the machine, including the
2,936 transcripts) · `caffeinate` (keep the machine awake for a long mission) · `pmset` (wake the machine
on a schedule) · `open` (hand a URL or file to the GUI) · `automator` · `defaults` / `plutil`.

**The three that change what is possible:**

- **`shortcuts run <name>`** is a bridge to iOS. A Shortcut can send an iMessage, post to social apps that
  have no API, control HomeKit, or run on the founder's phone. It is the escape hatch for every service
  that refuses to be automated.
- **`say` + `afplay`** make a spoken morning briefing free and offline. Gap #9 (*the founder talks to this
  system by voice; nothing is designed for that*) has a zero-cost half-answer already installed.
- **`mdfind`** searches the transcripts *today*, with no embedding, no index build, no server. It is the
  five-minute version of the transcript server in §2.10, and it would settle whether the full one is worth
  building.

**`screencapture` + a vision model** is also worth naming: it makes any GUI on the machine
machine-readable, including apps with no API at all.

### 3.4 CLIs worth installing, ranked by what they unlock

| CLI | Install | Unlocks | Terr. |
|---|---|---|---|
| **`codex`** `[S]` | global npm install of `@openai/codex` — <https://github.com/openai/codex> | The second model family, as a subprocess — GSD's shipped answer to the problem this repo has called structurally impossible. **Note the known trap already in CLAUDE.md: Codex bug #19945, exit 0 with empty stdout when detached from a TTY, which is exactly how a resolver runs.** Test the TTY case first or Rule 10 is violated silently. | 08 · 11 |
| **`stripe`** `[F]` | global npm install of `@stripe/cli`, then `stripe agent setup` | **Stripe's own agent-plugin installer** — it configures the MCP server *and* installs Stripe's skills, keeping both current. A vendor shipping "set up my agent" as one command is a pattern worth noticing. | 13 |
| **`yt-dlp`** | `brew install yt-dlp` | Fetch any video/audio for analysis — competitor ads, conference talks, a podcast to transcribe. Pairs with `ffmpeg` (already present) and Deepgram. | 04 · 08 |
| **`pandoc`** | `brew install pandoc` | Markdown → DOCX/PDF/EPUB. The company's documents become deliverables. | 03 |
| **`tesseract`** | `brew install tesseract` | Offline OCR — screenshots and scanned PDFs become text without an API call. | 04 |
| **`gh`** `[M]` present | — | Already the repo's GitHub hand. Worth stating: **it is unscoped**, unlike the GitHub MCP server's 20 named toolsets (§2.4). | 09 |
| **`rclone`** | `brew install rclone` | Sync to/from 70+ storage backends; the backup story for anything generated. | 11 |
| **`fswatch`** | `brew install fswatch` | File-change events without launchd XML. | 01 |

### 3.5 Browsers — three tiers, three different grants

1. **`playwright` MCP** `[M]` — isolated browser, no cookies. Currently failing (§0.1). Safe; sees only
   the public web.
2. **`claude-in-chrome`** `[M]` — **the founder's own authenticated Chrome.** Every service they are
   logged into, with their session. This is the widest hand documented anywhere in this study, and it is
   already available to this session. It reaches services that have no API and never will.
3. **Browserbase / Cloudflare Browser Run** `[S]`/`[F]` — cloud browsers, parallel, off-machine, no local
   profile. The right tier for volume.

**These are not interchangeable and should never share one grant.** Tier 1 is `risk:lite`; tier 2 is
`risk:irreversible` by any honest reading, because "act as the logged-in founder" is not a capability that
can be undone by `git revert`.

### 3.6 The physical world

`[S]` throughout, with URLs in §2.6: **Lob** (postcards $0.77, letters $0.89 on the free developer plan) ·
**Twilio** (buy a phone number, send SMS, place calls) · **ElevenLabs** (an agent that *makes* the call) ·
**DocuSign** (binding signatures) · **Cloudflare Registrar** (own a domain). Print-on-demand (Printful,
Printify) and delivery APIs exist but were not verified here — §7.

**Why this matters beyond novelty:** every one of these is *irreversible by physics*, not by policy. They
are the honest test of a risk tier. A tiering scheme that cannot distinguish "run the test suite" from
"post a letter" is not a tiering scheme. And this repo already has the right instinct written down —
**migration · deploy · harness self-edit block from day one "because `git revert` does not undo them."**
A letter is the same class, and there is no reason the vocabulary cannot extend.

---

## 4 · Models and runtimes as capabilities

A model is a hand. Choosing one is a capability decision and a cost decision at the same time, and this
company currently makes it once, globally, in `CLAUDE.md`.

### 4.1 What is on this machine now `[M]`

| Runtime | State |
|---|---|
| Claude, via Claude Code | Working. The only family actually used. |
| `gemini` 0.38.2 | Installed. **Blocked by the sandbox** (`~/.gemini` in `denyRead`). Never executed — the territory file says so and it is still true. |
| `ollama` | Installed, authenticated to Ollama Cloud, **both pulled models retired** (§0.3). Zero local weights. |
| `codex` | **Not installed.** |

### 4.2 Claude's own prices, for comparison — `[F]`, from the bundled `claude-api` skill (cached 2026-06-24)

| Model | ID | Context | In $/1M | Out $/1M |
|---|---|---|---|---|
| Claude Fable 5 | `claude-fable-5` | 1M | $10.00 | $50.00 |
| Claude Opus 5 | `claude-opus-5` | 1M | $5.00 | $25.00 |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | $2.00 | $10.00 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | 200K | $1.00 | $5.00 |

**Two discounts that are pure margin and neither is used here** `[F]`: the **Batch API runs
asynchronously at 50% cost**, and **prompt caching reads at ~0.1× input cost** (writes ~1.25×). A 24/7
company that does overnight work is the exact shape the Batch API was built for. `CLAUDE.md` already warns
that mid-session re-reads "break 90% of prompt-cache savings" — the savings are real and quantified, and
nothing measures whether they are being captured (`usage.cache_read_input_tokens` is the check).

### 4.3 Other families, prices as reported `[S]`

| Family | Reported price | Genuinely better at |
|---|---|---|
| **Gemini 3 Pro** | $2.00/$12.00 per 1M ≤200K context; $4.00/$18.00 beyond — <https://ai.google.dev/gemini-api/docs/pricing> | **Being a different model family.** That is its entire value here and it is a large value: it is the only thing standing between this repo and its `risk: high` ≥2-model-family requirement. Also strong on long-context and native multimodal input. |
| **Gemini 3 Flash** | $0.50/$3.00 per 1M | Bulk classification, triage, first-pass filtering at a tenth of Opus. |
| **Groq** | ~$0.05–$0.59 in / $0.08–$0.79 out per 1M on open models; **Batch API halves it**; 280–1,000 tokens/sec | **Latency.** Anything interactive or in a tight loop. Speed is a capability, not just a cost — a 1,000 tok/s judge can run on every candidate instead of a sample. |
| **Cerebras** | ~$0.35/$0.75 for `gpt-oss-120b`, ~3,000 tok/s | Same argument, further. |
| **DeepSeek** | V4-Flash $0.14/$0.28 per 1M (**$0.0028 on cache hits**); V4-Pro $0.435/$0.87 | The cheapest serious reasoning available. Cache-hit input at $0.0028/1M is orders of magnitude below Opus input. |
| **Ollama Cloud (Kimi, GLM)** `[M]` | Included in the Ollama plan already being paid for | Two more model families, one `ollama pull` away — and **already authenticated on this machine.** |
| **Local weights via Ollama/RunPod** | Hardware only | Privacy, no rate limit, no vendor retirement. The retirement of both cloud pins on 2026-07 is the argument for owning weights. |

**Job → model, stated as an opinion the founder can overrule:**

| Job | Use | Why not Opus |
|---|---|---|
| Orchestration, judgement, design, synthesis, ambiguous work | **Opus 5** | Nothing else is better; this is the work worth paying for |
| **A second opinion on anything** | **Gemini 3 / Codex / Kimi / GLM** | *A second Opus is not a second opinion.* Family diversity is the requirement, not capability |
| Classification, triage, tagging 2,936 transcripts, label extraction | **Haiku 4.5 / Gemini Flash / Groq**, batched | 10–100× cheaper, indistinguishable output on this class |
| Anything overnight and non-interactive | **Batch API, any family** | **50% off for free**, and 24/7 work is by definition non-interactive |
| Bulk embedding | a dedicated embedding model (§4.4) | Chat models are the wrong tool and far more expensive |
| Tight loops, live judging, interactive | **Groq / Cerebras** | Latency is the product |

### 4.4 Modality models — where Opus is not in the running at all

| Modality | Options `[S]`/`[M]` | Note |
|---|---|---|
| **Image / video / 3D / audio generation** | **`higgsfield`** `[M]` (connected, 84 tools) · fal.ai (**600+ models**, Flux Dev ~$0.025/image, Wan 2.1 i2v ~$0.05/sec) · Replicate (~200 models, hardware-per-second or per-output billing) | fal.ai reported 30–50% cheaper than Replicate for the same models. higgsfield is already paid for. |
| **Speech → text** | Deepgram `[S]` (official CLI **runs as an MCP server**, diarization, sub-300ms) · AssemblyAI · Whisper locally via `ffmpeg` + a local model | The 2,936 transcripts are text already; this is for *audio* the company consumes — calls, podcasts, competitor videos. |
| **Text → speech** | ElevenLabs `[S]` (cloning, dubbing) · `higgsfield.generate_audio` + `create_voice` `[M]` · **`say`** `[M]` (free, offline, installed) | Three tiers: free/local, already-paid, best-quality. |
| **Voice agents (two-way)** | ElevenLabs agent + outbound calling `[S]` · Twilio `[S]` | The only path to *conversation* rather than narration. |
| **Embeddings** | Voyage, OpenAI, Cohere, local via Ollama/RunPod | Needed by mem0, by any transcript search beyond `mdfind`, and by pgvector — which CLAUDE.md's stack block already names. |

### 4.5 The runtime question, stated plainly

**This company currently exists only while a laptop is open.** Four ways out, in ascending cost:
`launchd` + `caffeinate` on this Mac `[M]` (free, fragile) → a RunPod pod `[M]` (per-second, full control)
→ Cloudflare Containers via `containers.mcp.cloudflare.com` `[F]` (sandboxed, cheap) → **Anthropic Managed
Agents** `[F]`, which per the bundled `claude-api` skill supplies *"the harness **and** hosts a per-session
sandbox"*, with **scheduled deployments that "fire sessions autonomously" on a cron cadence** and
**dollar-denominated, platform-enforced session budgets**. That last one is worth reading twice: a hard
spend cap enforced by the platform is exactly what §1.5 says RunPod lacks and what `budget-guard.js`
approximates in output tokens.

---

## 5 · The permissions question — a survey, not a design

The brief asks how other systems decide *which worker gets which hand*, and how a grant is narrowed. Ten
patterns, each with where it is really used, and what it would cost here. **This is deliberately a menu.**

### 5.1 The ten patterns

**1 · Allowlist by tool name, evaluated deny → ask → allow.** `[S]`
<https://code.claude.com/docs/en/permissions>. This is Claude Code's own model and this repo already runs
it — 29 allow, 10 deny per CLAUDE.md. Four details worth having in front of the founder:
rules evaluate **deny, then ask, then allow, first match wins, and specificity does not change the
order**; MCP tools are named `mcp__<server>__<tool>`; **deny and ask accept full globs (`mcp__*` matches
every MCP tool everywhere) while allow rules accept a glob only *after* a literal `mcp__<server>__`
prefix** — so you can revoke wholesale but must grant per named server; and the space in
`Bash(ls *)` vs `Bash(ls*)` changes what matches. *Cheap, already working, and blunt: it is per-machine,
not per-worker.*

**2 · Capability declared in the agent's own definition.** `[M]` This repo, today:
`tools: [Read, Glob, Grep, WebSearch, WebFetch]` on `sourcer`, `mcpServers: [playwright]` on `designer`,
and — the sharpest example anywhere in this codebase — **`sourcer` was granted `mcpServers:
[claim-append]` while its `tools:` line kept no `Write` and no `Edit`.** It can append a claim through one
audited server and still cannot edit a file. That is a narrow grant done properly, it is already lint-
enforced (`schema-lint.js` fails a declaration no configuration backs), and **it is the pattern to extend
rather than replace.**

**3 · Per-invocation grants.** `[S]` `claude -p --allowedTools "Read,Edit,Bash"`. The grant lives on the
*call*, not the identity. Composes with pattern 2: a worker's definition sets the ceiling, the dispatch
sets the actual. Free, today.

**4 · The vendor ships the narrow version.** `[F]` The most under-appreciated option, because it costs
nothing to adopt: **Linear publishes `https://mcp.linear.app/mcp/readonly`** beside its full endpoint;
**Supabase groups tools into `database` / `debugging` / `development` / `edge functions` / `account` /
`docs` / `branching` / `storage`, with storage off by default**; **GitHub names 20 toolsets**;
**Cloudflare ships 17 separate servers rather than one**; **Google's Ads MCP is read-only by
construction**; **Intercom's is read-only while Plain's writes**. Before designing a grant language, read
what the vendor already offers — half the narrowing is free.

**5 · Credential-scoped grants.** `[F]` Stripe restricted API keys; GitHub fine-grained PATs; Google
service accounts. The grant lives in the *token*, so it holds even if the agent is compromised or the
harness has a bug. **This is the only pattern on the list that survives prompt injection**, which is the
argument for it. Cost: key management, rotation, and a place to put secrets.

**6 · Delegated OAuth with per-client consent.** `[F]` Stripe's MCP OAuth sessions are individually
listable and revocable in the dashboard; Vercel documents **confused-deputy protection by requiring
explicit user consent per client connection**. WorkOS/Auth0/Clerk have all shipped MCP-specific OAuth
products `[S]`, so this is commercially solved rather than something to invent.

**7 · Policy as code — typed handlers, phases, levels, strictest wins.** From Omnigent, already summarised
in STARTUP-OS §8b: `PolicyEvent → PolicyResponse | None`, six phases, three declaration levels, **first
DENY short-circuits, ASK accumulates, side effects apply only on final ALLOW**. The strongest pattern on
this list and the sibling study owns it; I note only the *capability* consequence — with this seam, a new
hand is a policy entry rather than a subsystem, which is what makes a fifty-server roster governable at
all.

**8 · Two-tier gates: `blocking` vs `blocking-human`.** From GSD. The second class is **never
auto-approved even in full-auto mode.** For this study's purposes it is the only pattern that answers
"what may run at 3am": `tiktok_publish`, `send_message` as the founder, Meta Ads spend, `create_refund`,
DocuSign, Lob, domain registration, `sandbox_exec`, and Chrome-as-the-founder all belong to a class the
machine structurally cannot clear alone.

**9 · Approval as a protocol, not a UI.** `[S]` **MCP elicitation** (`elicitation/create`) is the
standard's own mid-operation request-for-input, with a URL mode for out-of-band OAuth
(<https://modelcontextprotocol.io/docs/2026-07-28/learn/client-concepts>). Omnigent uses it as its approval
wire format. **A caveat this study found and should be flagged loudly: `roots`, `sampling` and `logging`
are deprecated as of protocol version 2026-07-28** and scheduled for removal, per the MCP SEP at
<https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/seps/2577-deprecate-roots-sampling-and-logging.md>.
**Elicitation is not on that list.** Do not design a filesystem boundary on `roots`; do design an approval
channel on elicitation. Framework equivalents, for reference: OpenAI Agents SDK `needs_approval` on a tool
(run pauses, `RunResult.interruptions` surfaces the pending call, `state.approve()` resumes) `[S]`, and
LangGraph `interrupt()` / `HumanInTheLoopMiddleware` with an `interrupt_on` policy and
approve / **edit** / reject outcomes `[S]`. Note LangGraph's third option: *edit the arguments* — a
strictly better founder verb than yes/no, and the one that answers gap #4, "you cannot steer something
already running."

**10 · Attenuable bearer tokens — macaroons.** `[S]`
<https://research.google.com/pubs/archive/41892.pdf> (NDSS 2014, Birgisson et al.). A credential that
**any holder can narrow but nobody can widen**, by appending caveats — time, target, purpose, budget —
verified by chained HMACs. An orchestrator holding a broad token could hand a worker a copy attenuated to
*"the Meta Ads account, spend ≤ $50, expires in 2 hours, this mission id only"* **without asking any
central authority.** Nothing on this list fits "delegation down a spawn tree" as well, and this repo's
existing habit — sha256-bound verdicts, expiry-forced claims — is the same instinct already. Cost: it is
the only pattern here with no off-the-shelf product; it would be built.

### 5.2 Three observations the founder may want, that fall out of the survey

**A · The riskiest hands are already granted and the safest ones are not.** `tiktok_publish`,
`sandbox_exec`, Gmail `send_message`, Drive `share_file` and an authenticated Chrome are live in this
session right now. Stripe read-only, PostHog, Sentry, Firecrawl — cheap, reversible, and useful — are not
connected. **The current grant surface is not the result of a risk decision; it is the result of which
OAuth buttons happened to be clicked.**

**B · Every proposed dimension is already in this repo's vocabulary, and one is missing.**
`.claude/qa-tier-floor.yml` tiers by *path*. Grants need tiering by **effect**: reversible /
externally-visible / spends money / speaks as a person / physically irreversible. `enforcement: block` for
migration · deploy · harness self-edit is the same idea, one axis short. **The missing axis is money**,
because it is the only one with a *rate*: "$X per day" cannot be expressed by any tier this repo has, and
Meta Ads, RunPod pods and Lob all need it. Anthropic Managed Agents' dollar-denominated session budgets
`[F]` are the only enforced example of it found in this study.

**C · The narrowing must be per *worker*, and the machine-level tools cannot express that.**
`settings.json` is per machine; agent frontmatter is per role; neither is per *mission*. The vocabulary
that fits is **grant = (worker × hand × scope × budget × expiry)**, which is the same shape as this repo's
claims — and claims already have forced expiry, which is the hard part and it is built.

---

## 6 · If the founder wants a ranked list

Ordered by **capability gained per unit of effort and risk**, not by excitement. Nothing here is a
recommendation to act; it is the list I would want in front of me during the filtering conversation.

**Free, today, no new vendor, minutes each:**

1. **Re-authenticate `n8n`, `mem0`, `miro`** — three of the five most-discussed servers are simply logged
   out (§0.1).
2. **Fix `runpod` and `playwright`** — one is probably a missing API key, one is a duplicate definition
   the tool itself warns about.
3. **`ollama pull` a current model** — restores a second and third model family that is already paid for
   and already authenticated (§0.3).
4. **Run `mdfind` over the transcripts** — the five-minute test of whether gap #2 needs a real system.
5. **Add `claude mcp list` to a daily check** — the only capability oracle available, and it is one line.

**Small, high leverage:**

6. **PostHog** — analytics + flags + replay + errors + SQL in one free hosted endpoint; the largest single
   step toward "a verdict from the world."
7. **Stripe MCP, restricted key, read-only** — MRR, cohorts, disputes as a query; the credential does the
   narrowing.
8. **`launchd` + `claude -p --allowedTools`** — a real 24/7 worker with a real per-run grant, out of parts
   already installed.
9. **A transcript MCP server** — the `claim-append` server is the template and it is one file.
10. **`codex`, tested for the TTY bug first** — retires an accepted risk that runs to 2026-11-17.

**Bigger, and genuinely new capability:**

11. **higgsfield's publish + virality + batch pipeline**, behind a `blocking-human` gate.
12. **Ayrshare** — 13 networks, one credential, one rate-limit model.
13. **Meta Ads MCP** — a full write loop on real money. The best possible forcing function for the risk
    tier, and the worst possible thing to connect before that tier exists.
14. **Browserbase or Cloudflare Browser Run** — parallel browsers off this laptop.
15. **A grant model** — because 5 and 6 above make the roster large enough that "everyone can reach
    everything" stops being tenable.

---

## 7 · UNVERIFIED / worth checking

**Everything in this section is `[R]` — reported by a third party, not confirmed against a vendor page.**
None of it should be presented as real without a check. It is kept because the brief asked for breadth and
an unverified lead is still a lead.

**Reported to have official MCP servers, vendor page not opened by me:** Klaviyo · Brevo · Kit
(ConvertKit) · ActiveCampaign · Iterable · Customer.io · Omnisend · Mailgun · Bird/SparkPost (all from one
2026 email-tooling survey) · Snowflake (Cortex Analyst/Search) · ClickHouse · Databricks · Amazon Redshift
· Google BigQuery via "MCP Toolbox" · MongoDB · Turso · Better Stack · Honeycomb · New Relic · Statsig ·
Pylon · Drag · TikTok Ads · Calendly (`mcp.calendly.com`, reported GA 2026-02-17; `developer.calendly.com/calendly-mcp-server` appeared as a vendor URL) · Cal.com (`mcp.cal.com/mcp`; `cal.com/docs/mcp-server` appeared as a vendor URL — both are closer to `[S]` than the rest of this list) · Workato-hosted Stripe/Shopify connectors.

**Named in the brief, not investigated for want of time:** podcast hosting (Transistor, Buzzsprout,
Spotify for Creators) · Mux and Cloudflare Stream for video hosting · Vimeo · print-on-demand (Printful,
Printify) · delivery APIs (DoorDash, Instacart) · HR (Deel, Gusto, Rippling) · legal/contract review ·
compliance (Vanta, Drata) · maps (Google Maps, Mapbox) · localisation (Lokalise, Crowdin) · community
(Circle, Discourse) · data enrichment (Clay, Apollo, Clearbit) · review platforms (G2, Capterra,
Trustpilot) · Product Hunt · banking (Mercury, Brex, Ramp) · CI (CircleCI, Buildkite) · package registries.

**Claims that moved recently and should be re-checked before anyone relies on them:**

- **YouTube `videos.insert` quota.** Reported ~1,600 units → ~100 (2025-12-04) → **its own bucket, 1 unit
  against ~100 uploads/day (2026-06-01)**. Three values in nine months, all from secondary sources. Check
  Google's own quota page before designing a publishing cadence.
- **Meta Ads MCP endpoint.** The doc pages on `developers.facebook.com` are verified `[S]`; a secondary
  source gives the endpoint as `mcp.facebook.com/ads` and I could not open it. **Get the endpoint from
  Meta's own "Get started" page.**
- **Gemini 3 pricing tiers.** The context-tiered structure ($2/$12 under 200K, $4/$18 above) came from
  secondary sources; `ai.google.dev/gemini-api/docs/pricing` is the authority.
- **The `claude-api` skill's model table** is marked *cached 2026-06-24* in the skill itself. Prices there
  are two months old at the time of writing.

**Two negative results, recorded because an absence is also information:**

- **No Paddle MCP server** was found in a targeted search. CLAUDE.md's stack block names Paddle.
- **The official MCP registry API was unreachable from here** — `https://registry.modelcontextprotocol.io`
  returned `ECONNREFUSED` through WebFetch and `curl` to external URLs is blocked by
  `.claude/hooks/pre-tool-use.sh`. **So this study could not enumerate the registry**, and its breadth is
  therefore the breadth of what I could reach vendor-by-vendor. A capability-discovery mechanism that
  can read the registry is itself a small missing hand.

---

## 8 · The three sentences I would not want lost

1. **The hands are not merely unused — several are broken, and nothing looks.** Three connected servers
   need re-auth, two fail outright, both second-family model pins are retired, and the one command that
   reports all of it (`claude mcp list`) is run by nothing.
2. **The riskiest capabilities are already granted and the cheapest safe ones are not.** Publishing to
   TikTok, sending mail as the founder, remote code execution and an authenticated Chrome are live right
   now; PostHog, Sentry and a read-only Stripe key are not connected.
3. **Money is the missing axis.** Every tier this repo has is about reversibility or blast radius; ad
   spend, GPU-seconds and postage need a *rate* limit, and no mechanism here can express one.
