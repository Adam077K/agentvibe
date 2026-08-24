# Roster size — is five enough?

*Second board. Convened because the first derived its number from dispatch counts in a corpus that,
by its own §9, has never run a venture task. Its arguments are weighed on their merits below; its
conclusion is not inherited.*

**Date:** 2026-08-14 · **Subject:** [AGENT-ARCHITECTURE.md](AGENT-ARCHITECTURE.md) §1 · **Status:** decided

---

## 1. THE ANSWER

**Seven.**

```
orchestrator · builder · designer · reviewer · sourcer · instrument · operator
```

The prior board was **wrong on the number and right on nearly everything else.** Its container test
is sound and I am not reopening a single one of its collapses. Its arithmetic failed in one specific,
locatable place: **it counted capability denials and never counted capability grants**, because the
corpus it measured had only ever made one grant. That is not a small slip. It is why the two
containers a business cannot operate without were cut, one of them on a premise the same document
disproves two hundred lines earlier.

**The single strongest reason, and it is a mechanism, not a preference:**

> **This runtime prices denials and grants differently. A capability *denial* is expressible at a
> dispatch. A capability *grant* is expressible in exactly one place in the entire system —
> agent-file frontmatter.**

Verified in the installed binary, not inherited:

```
$ strings -a /Users/adamks/.local/share/claude/versions/2.1.232 | grep -o 'agent(prompt: string, opts?: {[^}]*}'
agent(prompt: string, opts?: {label?: string, phase?: string, schema?: object,
                              model?: string, effort?: string, isolation?: …}

$ strings -a /Users/adamks/.local/share/claude/versions/2.1.232 | grep -c 'allowedTools?:'
0
```

`disallowedTools` is there and is MCP-aware and fail-closed — *"Use `mcp__<server>` to deny one
server's tools (`mcp__<server>__<tool>` for one tool), or `mcp__*` to deny every MCP server's tools.
Refusing the spawn rather than running it un-narrowed."* `bashCommandClamp` is there and refuses the
spawn if it can bind nothing. `agentType` is there — and it **selects a file** (the binary's own error
string: `agent({agentType}): agent type '…'`). There is no additive `allowedTools`. There is no
`mcpServers` option. Not on `agent()`, not on the `Agent` tool, not in a `SKILL.md` frontmatter, not
in a lens.

So the roster's floor is not a matter of taste. It is **the number of capability grant-classes that
must not co-reside**, plus the containers earned by a boundary that must hold on the dispatch path
actually in use. A system whose stated job is to run real projects, startups and businesses needs
four grant-classes: read the public web, see a rendered surface, read its own systems of record, and
act irreversibly on the world. It holds **one** of them today.

**What changes from the prior board's five:**

| | |
|---|---|
| **Cut** | `framer` — kept by one adjudicator, cut here. Its only distinguishing property is a *denial* (no `Bash`), and a denial is per-call data. It needs no grant. A container with no grant is a lens. |
| **Added** | `operator` — the act-on-the-world grant. Cut by the prior board on a false premise (§7.2 below). |
| **Added** | `instrument` — the private-systems read grant. Proposed by nobody in the first board's dossier. |
| **Discharged** | `designer`'s open condition resolves **YES**. The browser grant is approved on requirements; `playwright` is live at user scope today. |
| **Unchanged** | `orchestrator`, `builder`, `sourcer`, and every one of the prior board's collapses — 5 reviewer personas → 1, 9 domain builders → 1, 9 C-suite personas → the orchestrator, `judge` → arithmetic, 11 shims → 0. |

**Seven is not "more voices."** Not one addition is a persona, a domain, a seniority level or a
posture. Every one is a credential. A CMO, a CFO, a growth lead, a data scientist, a scrum master, a
QA lead and a test engineer remain cut, and §5 shows exactly what carries their work instead.

**Sequencing is load-bearing and is stated once, here.** Two of the seven hold credentials. The
`PreToolUse` matcher in `.claude/settings.json` is `Bash|Edit|Write|NotebookEdit`, so no `mcp__*`
call ever reaches the only mechanism in this repo that can refuse an action, and `bin/warroom:235`
launches every pane with `--dangerously-skip-permissions`. `grep -c '"sandbox"'` returns **0** in both
`.claude/settings.json` and `~/.claude/settings.json`. **The `operator` and `instrument` files are
written before their grants are made, and the grants are made after E7.** Shipping a credential into
this runtime today produces a well-labelled front door beside an open window. The number is seven
either way; the grants land in order.

---

## 2. WHAT THE UNIT OF SPECIALISATION SHOULD BE

### The rule

> **THE GRANT RULE.** A job earns its own agent file if and only if it needs a capability that can
> only be **added** in agent-file frontmatter — an additive `tools:` entry or an `mcpServers:` entry
> — **and** that capability must not co-reside with the capabilities of any existing container.
>
> Everything else is data. A job distinguished only by a **denial**, an **effort**, a **model**, an
> **isolation mode**, a **return schema**, a **persona**, a **domain**, a **posture**, a **severity
> vocabulary** or a **procedure** is a lens, a workflow option, a playbook stage or a script —
> because every one of those is settable at the dispatch or injectable as a payload before the first
> turn.
>
> **One exception, and it carries an expiry.** A denial that must hold on the `Agent` dispatch path
> earns a file, because `Agent` accepts no `disallowedTools` — measured, 1,133 calls, parameter
> surface `description · prompt · subagent_type · name · model · isolation`. When dispatch moves to
> the workflow surface, re-run the test and expect the roster to shrink.

### Why this rule and not the prior board's

The prior board's test — *capability, isolation or provenance differs, and something dispatches it*
— is correct as far as it goes, and I concede it. But "capability differs" is the clause that had to
carry all the weight, and as written it is symmetric between grants and denials. That symmetry is
false in this runtime, and the asymmetry is the whole design:

| Property | Settable per dispatch? | Where it lives |
|---|---|---|
| Tool **denial** | **Yes** — `disallowedTools` on `agent()`, MCP-aware, fail-closed | dispatch, or file |
| `bashCommandClamp` | **Yes**, on `agent()` | dispatch |
| `effort` | **Yes**, on `agent()` (0 of 1,133 `Agent` calls) | dispatch, or file |
| `model` | **Yes**, both surfaces (637 of 1,133) | dispatch, or file |
| `isolation: worktree` | **Yes**, both surfaces (22 calls, 62 `worktreePath` records) | dispatch, or file |
| `schema` | **Yes**, on `agent()` | dispatch |
| Tool **grant** (additive) | **NO** — no `allowedTools?:` anywhere in the binary | **file only** |
| `mcpServers:` | **NO** — appears in the binary only as `.mcp.json` / `--mcp-config` / SDK config | **file only** |
| `skills:` | **NO** — no skills option on either surface | **file only** |

A denial you forget to write **fails open**. A grant you did not make **fails closed**. That is the
entire safety argument for expressing a capability boundary as a file rather than as a call-site
option, and it is why the count is bounded below by grants and not by denials.

`skills:` is also file-only, and the prior board drew the wrong conclusion from it — see §7.5. It
does not mint containers, for a different reason: a skill payload is prose, and prose is not
capability. If injected prose were container-forming, 134 skills would admit 134 containers.

### The decision procedure — apply this to a new job tomorrow

Five questions, in order. Stop at the first that resolves.

1. **Does the job need a tool or MCP server that no existing container holds?**
   No → it is a lens, a skill, a playbook stage or a workflow. Stop. *(This kills every persona,
   every domain specialist, every seniority tier and every review posture.)*
2. **Can it ride on an existing container?** Add the grant to that container **unless you can name
   the hazard the combination creates.** The hazard must be a sentence about a specific reachable
   attack or failure, not a feeling. No hazard → add the grant, do not add a file. Stop.
   *(Worked example: adding a credentialed customer-data read to `sourcer` — which ingests
   attacker-controllable web text while holding `WebFetch` — is a one-hop exfiltration chain, and
   because the `Agent` path offers no `disallowedTools` the combination is permanent. Hazard named →
   separate file. That is exactly how `instrument` is earned.)*
3. **Do the two grants need opposite write postures?** One `tools:` line cannot be both `Write`-bearing
   and `Write`-denied. Perception-to-produce and perception-to-judge are the same grant with opposite
   postures → two files. *(This is why `designer` and `reviewer` both hold the browser and are still
   two containers.)*
4. **Is the grant enforceable today?** If the runtime cannot bound its blast radius — E7 unconfigured,
   the hook blind to `mcp__*`, the launcher bypassing permissions — **write the file, withhold the
   grant, and retag the lenses that depend on it.** Never ship an unenforceable grant. A capability
   field auto-granted whatever it requests degrades to false confidence, not to zero.
5. **Write down the hazard sentence from step 2 into the agent file.** That sentence is the
   container's justification. **If you cannot write it, you do not have a container.**

Run this on the 26 agents the prior board cut and all 26 stay cut. Run it on `framer` and it is cut —
for the right reason this time. Run it on `operator` and `instrument` and they are containers.

---

## 3. WHAT THE FIELD DOES

### The counts

| System | Agent files | What they actually are | Where specialisation lives |
|---|---|---|---|
| BMAD-METHOD v6.11.0 (51,898★) | **5** | `.claude/skills/*/SKILL.md`, frontmatter = `name` + `description`. Nothing else. | Markdown procedure + 4–5 concurrent reviewer specialists declared as `[[workflow.review_layers]]` entries in **one** TOML file |
| GitHub Spec Kit (128,044★) | **0** role agents | 26 stage procedures; the same bytes install as a *skill* on one host and an *agent* on another | Stages, plus a versioned per-project constitution |
| YC Quartermaster (13,521★) | **1** + 3 delegation labels | The three children are byte-identical in prompt and tools; only the `description` string differs | Per-scope versioned "soul" + skills + org-private layers |
| buildermethods/agent-os v3 | **0** (was 8 at v2.1.0) | Deleted every agent file; "Removed the short-lived roles system. Too complex." | Standards markdown injected into one frontier model |
| obra/superpowers (272,026★, 1.0M installs) | **0** in 314 blobs | 4 dispatched roles as versioned *prompt templates* + explicit model per call | Prompt template + model + fresh context, chosen at dispatch |
| anthropics/skills | **0** | 3 files under `skills/skill-creator/agents/` with **no frontmatter at all** | Skills, plus an A/B eval harness |
| Open GSD "GSD Pi" | **13** | **11 of 13** carry only `name` + `description` + `model: sonnet` | A TypeScript state machine with an enforced transition matrix |
| `nicobailon/pi-subagents` | **6** | Differ on `tools`, `thinking`, `inheritProjectContext`, `inheritSkills` | **Genuinely container-shaped** — the only such roster in the field |
| Cloudflare OS (8,198★) | **1** | *"a fully multi-purpose agent that can perform arbitrary tasks"* | **16 Gatekeepers** — one per external resource, each holding that service's credential |
| Production verification systems (Anthropic Research, OpenAI SDK, Meta TestGen-LLM/ACH, Magentic-One, commercial reviewers) | **median 1, max 1** verification agent | | 3–5 verification *layers*, of which at most one is an agent |

### Where they disagree with each other

They disagree loudly and it matters. GSD Pi ships 13 while Agent OS ships 0 — and neither number is
defended anywhere in either repo. No ADR in GSD names its roster; its engineering attention went to
the state machine. Agent OS did not prove agents unnecessary; it **stopped attempting the work agents
were for** (v3 has no execution layer and no verification layer, having deleted both verifiers).

The sharpest disagreement is structural, not numeric. Cloudflare decomposes by **resource**, not by
role: 16 capability boundaries and one agent. Nobody else in the field does this, and it is the
answer closest to the one derived here — with one decisive difference. Cloudflare's boundaries bind
because Dynamic Workers run with outbound networking disabled and resources arrive only as typed
bindings; its runtime can **deny**. This runtime cannot: the hook has no agent identity in its
payload, every `mcp__*` call reaches the `*) # Unknown tool — allow` arm, and the launcher bypasses
permissions. Cloudflare can put 16 boundaries around 1 agent. Until E7 lands, this system can only
express a boundary as *which file the dispatcher names*.

### How strong is this evidence — plainly

**Adoption, not outcome, almost everywhere.** 128k stars, 272k stars, 1.0M installs, 83,385 monthly
`specify-cli` downloads, 72,945 monthly `bmad-method` downloads. Downloads and contributor counts beat
stars because they cost effort. None of them measures whether the output is more correct.

**Nobody, anywhere, in any of these systems, has an A/B harness for agent rosters.** Anthropic's own
`skill-creator` ships one for *skills* — `evals.json` → per-case isolated subagent → `grading.json`
with per-assertion evidence → `benchmark.json` comparing with-X and without-X → blind A/B. Nothing
equivalent exists for containers. Both boards are reasoning without the instrument, and so is the
field.

**The two strongest pieces of evidence in the whole corpus are both negative and both about
dispatch, not roster.** Spec Kit's `FORK_CONTEXT_COMMANDS = {}` — a forked agent context added in
PR #2511, measured degrading long sessions, and reverted in issue #3185 with a reproduction. And
superpowers v6.3.0 capping nesting at one because implementers spawning their own reviewers *"was
producing duplicate reviews."* Both are dated, root-caused, mechanism-level experiments. Neither is
about how many containers a system needs; both are about how you dispatch them. Spec Kit's root cause
was **return-payload size**, not isolation, and citing it against separate contexts is a misreading.

**The revealed-preference argument is the strongest available and it is still practitioner judgment.**
BMAD went 9 → 6 → 5 under 16 months of user feedback, killing its own QA persona; Agent OS went 8 → 0.
Nobody deletes their headline feature three times in five months for fun. But BMAD's five agents have
**two frontmatter keys**. Spec Kit has **no tool subtraction anywhere** — `_allow_all()` defaults to
enabled. These systems could not have discovered that a grant-bearing container was worth having,
because they have no field that expresses a grant. **Their small rosters are the container test's
predicted answer, not a challenge to it, and their silence about grants is silence from systems that
cannot speak.**

**The empirical literature is unambiguous about roles and says nothing about grants.** 162 personas ×
2,410 questions × 4 model families: adding a persona does not beat the no-persona control
(arXiv 2311.10054, EMNLP Findings 2024). Effective team size saturates at ~1.2–1.8 agents out of 30
nominal (arXiv 2606.02646). "Disobey role specification" is the **rarest** failure mode at 0.5% of
1,600+ annotated traces, while "inter-agent misalignment" — failures that exist only because agents
talk to each other — is 36.94% (MAST, NeurIPS 2025 D&B). MetaGPT, the org-chart roster, satisfies
22.13% of DevAI requirements. mini-swe-agent — one agent, one tool, ~100 lines — scores >74% on
SWE-bench Verified.

**Take that literature seriously and it does not touch this answer.** It measures *role identity*.
Not one of those studies varied a tool grant or an MCP server. The one study that did vary capability
found the largest effect in the corpus: restricting an agent to causally-necessary tools moved success
from 0.83 to 0.99 and wrong-tool calls from 1.25 to 0.01 per task across 2,448 runs (arXiv 2606.06284).
Capability is the axis with measured effects. Identity is the axis with none. Seven containers
differing in capability is not the thing the literature punishes; seventeen differing in prose was.

---

## 4. THE ROSTER

Enforcement primitives referenced below are the prior board's, unchanged: **E1** `tools:` (subtracts,
does not bind `Bash`) · **E2** `pre-tool-use.sh` (blocks, blind to agent identity, `Bash` paths and all
`mcp__*`) · **E3** `schema-lint.js` (blocks CI on declaration shape) · **E4** branch protection ·
**E5** `isolation: worktree` (real, git) · **E6** caller-side dropout checks · **E7** OS sandbox
(available, configured nowhere) · **E8** `disallowedTools` / `bashCommandClamp` (real in the binary,
used zero times here).

Two schema changes are prerequisites for all seven and are stated once: `schema-lint.js:97`
`VALID_MODELS` still pins the 4.x set and must be moved to `claude-opus-5 · claude-sonnet-5 ·
claude-haiku-4-5 · claude-fable-5`; and `REQUIRED_FRONTMATTER` must **add `effort`** (binds) and
**drop `maxTurns`** (does not bind — 196 of 269 runs exceeded a declared cap of 20). A stale pin
silently clamps effort, and `claude-sonnet-4-6` — pinned in all five current engines — has 23,404
turns on this machine and **not one at `xhigh`**.

---

### 4.1 `orchestrator`

| | |
|---|---|
| **Purpose** | Hold run state, the campaign goal and the human boundary. Pick the playbook, decompose, dispatch, verify every return against the branch/file/artifact, stop at every gate. |
| **Earns its container by** | **Capability (grant)** — sole holder of `Agent`, an additive `tools:` entry no other file carries. **Provenance** — the only context that ends a turn on a human, which is what makes a `gate:` mean anything. |
| **Model / effort** | `claude-opus-5` / `xhigh`. It decides what every other agent does. Not `max`: rate-limit headroom is the first admissible scarcity and there is no single binding call here to protect. |
| **Tools / MCP** | `Read, Write, Edit, Bash, Glob, Grep, Agent`. No MCP. `Task` deleted — 0 calls in 1,133 dispatches. |
| **Boundary** | May write `docs/**`, `.claude/memory/**`. May **not** write source, `.claude/agents/**`, `.claude/hooks/**`, `.github/workflows/**`. May not merge. May not override a gate verdict. |
| **Enforced by** | **E2** for the hard floor (nothing outside the project root, no `.env`, no existing-migration edits). **E4** at the git edge — `.claude/agents/**`, `.claude/hooks/**`, `.claude/settings.json` are `irreversible`/`block` in `qa-tier-floor.yml`. **Honest gap: the project-scoped half is unenforced in-session**, because E2 cannot tell orchestrator from builder. |
| **Escalates** | To the founder: any `irreversible` classification, any `gate:` stage, any BLOCK it disagrees with — escalate, never route around. It is the root; it escalates to nobody else. |

### 4.2 `builder`

| | |
|---|---|
| **Purpose** | Produce a repo artifact in isolation and return exactly what landed. Code, schema, migration authoring, tests, docs, copy. Nine former domain engineers. |
| **Earns its container by** | **Capability, negatively** — it is the *named absence of every grant*: the exact repo-local write+execute set and nothing more. On the `Agent` path a denial can only be expressed by naming a file that lacks the grant, so "the producer that holds no credential, no browser and no network" is only expressible as a file. Isolation (`worktree`) is real but is settable per call and does not, by itself, earn the file. |
| **Model / effort** | `claude-sonnet-5` / `high`. Highest-volume container in the system; per-call escalation to `xhigh` is available on the workflow surface for a hard slice. |
| **Tools / MCP** | `Read, Write, Edit, Bash, Glob, Grep`. **No MCP, ever.** `isolation: worktree`. |
| **Boundary** | Writes confined to its worktree and the files named in its brief. Must not touch `.claude/agents/**`, `.claude/hooks/**`, `.github/workflows/**`, `.env`, or an existing migration. Must not merge. Must not spawn subagents. |
| **Enforced by** | **E5** (git worktree, real). **E2** for `.env` and existing-migration edits (`pre-tool-use.sh:163`, `:308-312` — both bind for every agent, which is why migration discipline and secrets hygiene need no container). **E4** at the merge edge. **Honest gap:** `Bash` is unbounded — any agent holding it can write anywhere. Only **E7** closes that. |
| **Escalates** | An architectural decision the brief does not settle → BLOCKED, never invent. A file outside scope needs changing. A test it did not write fails. |

### 4.3 `designer`

| | |
|---|---|
| **Purpose** | Build a customer-facing surface and close the perception loop on it: render, look at the render, change, re-render. |
| **Earns its container by** | **Capability (grant)** — `mcpServers: [playwright]` with `Write`. The prior board's condition is discharged **YES** on requirements, not on dispatch counts: three review lenses declare `scope: rendered-output` at `blocking_severities: [p1]` (`review-lenses.yml:69, 95, 108`) and no container can obtain the subject. **The hazard sentence, per §2 step 2:** granting the browser to the general `builder` puts an unbounded, unhookable egress channel on every code-writing dispatch — `mcp__playwright__browser_navigate` to an external host returns exit 0, and `browser_evaluate` / `browser_run_code_unsafe` have 154 and 69 real calls on this machine. Because the `Agent` path cannot subtract, that merge would be permanent. |
| **Model / effort** | `claude-opus-5` / `xhigh`. The perception loop is the highest-iteration work in the roster and wall-clock is an admissible scarcity; depth per call reduces render cycles. |
| **Tools / MCP** | `Read, Write, Edit, Bash, Glob, Grep` + `mcpServers: [playwright]`. `isolation: worktree`. |
| **Boundary** | Worktree-scoped writes. **Must not call `browser_evaluate` or `browser_run_code_unsafe`.** Navigation loopback-only. A failed capture is BLOCKED, never a source read relabelled as rendering. Evidence manifests carry the **git SHA** captured against, never an mtime. |
| **Enforced by** | **E5** for writes. **The browser restrictions are unenforced and must ship saying so** — the `PreToolUse` matcher is `Bash\|Edit\|Write\|NotebookEdit`, and widening it does not help because the hook has no `mcp__` arm and no URL field. Egress belongs in **E7** (`sandbox.network.deniedDomains`); per-tool denial belongs in **E8** at a workflow dispatch. Neither is configured. |
| **Escalates** | The design system has no rule for the decision. Three failed captures. |
| **If the grant is refused** | Delete `designer.md` and retag `craft`, `voice`, `accessibility` to `scope: diff-only` **in the same PR**. Keeping it without the grant is the worst of the three options: it is `builder` with a different colour, and today `designer.md:5-11` differs from `builder.md:5-11` in nothing the runtime reads except `color` and `skills`. |

### 4.4 `reviewer`

| | |
|---|---|
| **Purpose** | Out-of-band judgement of work someone else produced, along whichever lenses the stage names. Runs the artifact, reads the diff from a recorded baseline, sees the rendered surface, returns findings — never fixes. Absorbs the dossier's `prover`, `visual-referee`, `refuter`, `judge` and `qa-lead`. |
| **Earns its container by** | **Both directions at once, which no other file needs.** *Denial:* no `Write`, no `Edit` — measured 0 and 0 across 269 runs and 4,373 tool calls, hard-failed in CI by `schema-lint.js:62` `READ_ONLY_ENGINES`. On the `Agent` path this is only expressible as a file. *Grant:* `mcpServers: [playwright]` **read-only**, because a judge that cannot obtain its subject is not a judge. **The hazard sentence:** an agent that can edit what it reviews will review what it can edit — and this repo has documented the consequence (`PHASE-8A-STATUS.md:172`: *"It cannot prove a review happened — any artifact a reviewer writes, a builder can write."*). A screenshot taken by the producer is such an artifact; a screenshot the judge took is not. |
| **Model / effort** | `claude-opus-5` / `xhigh`. The final reviewer runs on the most capable available model. Today 269 of 269 reviewer runs executed `claude-sonnet-4-6` at `high` inside runs whose default was `claude-opus-5[1m]` — the deepest job in the system, on the weakest settings, by a stale pin. |
| **Tools / MCP** | `Read, Glob, Grep, Bash` + `mcpServers: [playwright]`. `isolation: none` on the judging path; `isolation: worktree` at the PR SHA when it runs the product, so "works on my branch" is checked against the commit and not a dirty tree. |
| **Boundary** | No writes of any kind. No merge. Reads the diff from a **recorded baseline commit**, never from the producer's summary. **Findings from context-starved children; severity assigned by the context-holding parent** — today `qa.js:152` filters on a `severity` field the child sets, which lets a blind child decide what blocks. |
| **Enforced by** | **E1** (measured decisive) + **E3**. **Requires the four-word fix first:** all four `agent()` sites in `qa.js` (`:122, :132, :179, :199`) pass `{label, phase, model, schema}` with **no `agentType`**, so every dimension reviewer and the judge currently run as default general-purpose agents holding `Write` and `Edit` on the diff they judge. The container that justified the whole five-into-one collapse is bypassed at the only place it binds. |
| **Escalates** | A lens it cannot satisfy (missing capture, missing baseline) → BLOCKED, never a pass on evidence nothing checked. Two rounds without convergence → HALT with a named non-convergence condition. |

### 4.5 `sourcer`

| | |
|---|---|
| **Purpose** | Answer one bounded question against the outside world with sourced evidence, and answer "has this already been decided here?" against the repo's own record. |
| **Earns its container by** | **Capability (grant)** — `WebSearch, WebFetch`, additive, file-only. **The hazard sentence:** full repo read plus unrestricted network egress is an exfiltration surface; repo read plus `git` is not. It holds the *only* clean boundary in the roster — 7 runs, 284 tool calls, **zero `Bash`** — and there is no interpreter to assert around. |
| **Model / effort** | `claude-opus-5` / `high`. |
| **Tools / MCP** | `Read, Glob, Grep, WebSearch, WebFetch`. **No `Bash`. No MCP. No credentials, ever** — see `instrument`. |
| **Boundary** | Read-only over the repo, network read only, no repo write. Every finding carries URL, access date, verbatim quote and confidence. Gaps named explicitly. |
| **Enforced by** | **E1**, and this is the one grant where E1 is close to sufficient. |
| **Escalates** | The question stays unbounded after one re-scoping. A primary source contradicts a live decision. Three fetch failures on one source. |
| **Known defect it does not fix** | Sourcer cannot write, and a claim is emitted by writing a fenced ` ```claims ` block into a git-tracked file. So `claim(kind=external-fact, verified_by=source)` — the literal exit of the two stages that dispatch it — cannot be produced by the engine dispatched to produce it. Measured: 31 ledger claims, exactly one `external-fact`, and it is the deliberately-failing canary. **Fixed by the orchestrator owning the stage exit, not by granting `sourcer` `Write`.** Widening the grant trades this roster's one clean boundary for a convenience. |

### 4.6 `instrument` — NEW

| | |
|---|---|
| **Purpose** | Read the business's own systems of record and return numbers with provenance: MRR, cohort retention, which plan a customer is on, whether the webhook fired, what the support thread actually said, whether the site is up. |
| **Earns its container by** | **Capability (grant)** — credentialed read MCP servers, and `mcpServers:` is the only additive channel in this runtime. **Plus isolation of a context**: it holds private customer data and is **denied `WebSearch`/`WebFetch`**, so the data has no egress hop. **The hazard sentence, and it is why this cannot ride on `sourcer`:** `sourcer`'s job is pulling attacker-controllable web text into its own context while holding `WebFetch`; adding a credentialed read of customer data to that file builds a one-hop exfiltration chain, and because the `Agent` path offers no `disallowedTools`, **that merge is permanent — there is no way to take either half back at a call.** It cannot ride on `operator` either: every "what is our MRR" question would then run a container that can also issue a refund. |
| **Reachability** | `lenses.yml:52` already orders *"Pull the cohort from the system of record rather than estimating it."* `price-a-product.yml` and `validate-a-market.yml` both exit on `claim(kind=external-fact, verified_by=source)`. `docs/09-metrics/{NORTH_STAR,UNIT_ECONOMICS,GROWTH}.md` are unfilled templates. The dispatch site is written; the container is not. |
| **Model / effort** | `claude-sonnet-5` / `high`. Reads and arithmetic, not deep reasoning. |
| **Tools / MCP** | `Read, Glob, Grep` + `mcpServers: [<analytics>, <billing-read>, <inbox-read>]`, **read-scoped credentials only** (Stripe restricted keys, Supabase anon/read role — not service role). **No `Bash`. No `Write`. No `WebFetch`.** |
| **Boundary** | May not write the repo. May not mutate any external system. May not fetch an arbitrary URL. Returns a typed record `{metric, value, as_of, source, query}` — never a narrative. |
| **Enforced by** | **E1** for the `Bash`/`WebFetch` denial (measured decisive on `sourcer` and `framer`). **The MCP half is unenforced until E7** — no `mcp__*` call reaches the hook. **Do not make the grant before E7.** |
| **Escalates** | A number contradicts a recorded claim. A credential is refused. A metric has no system of record — that is a founder decision about instrumentation, not a number to estimate. |

### 4.7 `operator` — NEW (reinstated)

| | |
|---|---|
| **Purpose** | Mutate state outside git, under a gate. Deploy to preview and promote to production, roll back, apply a migration to a database with customer rows in it, create a live price or webhook endpoint, place and rotate a secret, publish. |
| **Earns its container by** | **All three.** *Capability (grant):* credentialed side-effecting MCP servers, file-only, held by nothing else. *Isolation, inverted and load-bearing:* `isolation: none` — its target is production, and a throwaway worktree offers **zero** containment for an external mutation, so `builder`'s entire containment story does not transfer. *Provenance:* its dispatch is the sole consumer that `gate: outbound-approval` has ever needed; who spawned it does not merely change whether its output is trusted, it changes whether it may act at all. |
| **Reachability** | `launch-landing-page.yml:35-39` declares a `ship` stage carrying `gate: outbound-approval` and **no `dispatch:` block**. `qa-tier-floor.yml:50-105` already tiers `**/supabase/migrations/**`, `**/api/billing/**`, `**/api/payments/**`, `**/api/webhooks/**` at `irreversible`/`block`. Someone wrote the money-flow rules for a business this roster has no container capable of operating. |
| **Model / effort** | `claude-sonnet-5` / `medium`. **Deliberately shallow.** An operator clever enough to reason its way past a failing precondition is worse than one that is not. Its job is to execute a procedure and report the exit code. |
| **Tools / MCP** | `Read, Glob, Grep, Bash` + `mcpServers: [<deploy>, <db-admin>, <payments>]`. **Denied `Write` and `Edit` — and that denial is the point:** an operator that can patch code can make its own deploy "work," which is the one failure BMAD names (*"never edit the expectation to match the code"*) and enforces with a sentence, and which this repo can enforce with a tool list that demonstrably subtracts. |
| **Boundary** | Every side-effecting call carries a required **`purpose`** string — one sentence on what it accomplishes and why now, because that is the only context a human approver sees. Never reads `.env` (blocked for everyone at `pre-tool-use.sh:163`; a credential an agent reads is written permanently to `~/.claude/projects/*.jsonl`). The credential lives in the MCP server's own configured auth, never in an agent's context. |
| **Enforced by** | **E1** for the `Write`/`Edit` denial. **E7 is a hard precondition for the MCP grant** — until the sandbox is configured with `sandbox.network.deniedDomains` and `bin/warroom` stops passing `--dangerously-skip-permissions`, this container is a label. **`gate: outbound-approval` must gain a consumer** — today `grep -rl outbound-approval .claude/workflows/ scripts/ .github/ bin/` returns **nothing**. |
| **Escalates** | Always, before any irreversible act, to the founder via `gate: outbound-approval` — non-blocking where possible (queue the request, continue against a local simulation, approve in bulk), blocking on anything `classifier.js` rates `irreversible`. A failed rollback is a P0 escalation, not a retry. |
| **When it splits** | One file today. It becomes two when a credential's compromise has a **different blast radius under a different gate tier** — i.e. when a live payments key and a deploy token stop being governed identically. Decide that from a credential inventory, not from taste. |

---

## 5. WHAT IS CARRIED BY SKILLS, WORKFLOWS AND LENSES INSTEAD

This is the section that answers "complicated system, complicated tasks" without inflating the roster.
The claim is not that these jobs are unimportant. It is that **not one of them needs a capability
grant**, so by the rule in §2 not one of them is a container.

### 5.1 The roles a founder's intuition reaches for, and what actually carries them

| The role you would hire | Carried by | Named artifact |
|---|---|---|
| CFO / financial modelling | `business` lens (`lenses.yml:28`) + skills `startup-financial-modeling`, `startup-metrics-framework`, `pricing-strategy` | `price-a-product.yml` stages `frame → model → review → commit` |
| CMO / growth lead | `growth` lens (`:64`) + skills `marketing-psychology`, `launch-strategy`, `page-cro`, `form-cro`, `onboarding-cro`, `email-systems`, `social-content`, `seo-content-writer` | `launch-landing-page.yml` |
| Head of product / PM | `product` lens (`:82`) + skills `product-manager-toolkit`, `writing-plans`, `brainstorming` | the frozen spec artifact + `plan.js` (§6) |
| Customer researcher | `customer` lens (`:48`) + `USER-INSIGHTS.md` + `deep-research` skill | `validate-a-market.yml` |
| Data scientist | `evidence` lens (`:149`, inherited by every engine) + `instrument`'s typed returns + skills `sql-optimization-patterns`, `segment-cdp` | `docs/09-metrics/**` |
| Security engineer | `security` review lens (`review-lenses.yml:35`) + skills `security-audit`, `web-security-testing`, `xss-html-injection`, `broken-authentication`, `secrets-management` | `qa.js` dimension, tier-gated |
| QA lead | **Deleted, correctly.** The verdict is `gate-logic.mjs` arithmetic; the gate is `qa-lead-pass.yml`; the tier is `classifier.js`. BMAD deleted its QA persona on 2026-04-09 and never replaced it. | `qa.js` |
| Test engineer | Writing tests is `builder`; running them is `reviewer`; grading coverage is the `tests` dimension | `qa.js:72-78` |
| Adversary / red team | `adversarial` review lens (`:48`) + the three verifier postures already carried as three prompt strings in one array at `qa.js:91-95` | `qa.js` verify phase |
| Design critic | `craft` (`:61`), `voice` (`:87`), `accessibility` (`:100`) lenses on `reviewer`, now with a subject | `design-pass.yml` |
| Technical writer | `builder` + skills `writing-guidelines`, `doc-coauthoring` | `docs/**` |
| Scrum master / project manager | The orchestrator's job file (`state`, `checkpoint`, stage edges) | §6 |
| SRE / incident commander | `operator` under an incident playbook + `auto_supervisor`-style wall-clock tiers in the launch profile | missing stage — §6 |
| DBA | Migration *authoring* is `builder`; migration *application* is `operator`; migration *immutability* is a script (`pre-tool-use.sh:308-312`, binds for everyone) | `qa-tier-floor.yml:50-64` |
| Second opinion / oracle / counter-judge | **Not an agent.** Model family is a property of the executor. `gemini` 0.38.2 and `ollama` (kimi-k2.5, glm-5) are on the PATH; `claims.js:482-495` already validates a `{model_family, model_id, verdict, at}` record and `claims.js:425-430` already computes the independence predicate. **~20 lines in `resolvers.js:307`.** | the claim ledger |

**Sixteen roles, zero containers.** Every one is a lens, a skill, a stage or a script — and each is
already declared, or is a named line change in a file that already exists.

### 5.2 The four carriers, and what each is for

**Lenses — how to produce (8) and how to judge (10).** `.claude/lenses.yml` carries `business`,
`customer`, `growth`, `product`, `engineering`, `research`, `design`, `evidence`.
`.claude/review-lenses.yml` carries `correctness`, `security`, `adversarial`, `craft`, `evidence`,
`voice`, `accessibility`, `risk`, `customer-value`, `scope`. Both are linted for *content*, not only
shape. BMAD reached the same shape independently at 51,898 stars, collapsing five review skills into
one skill carrying five files it calls **`lens-*.md`**.

Four changes are owed here and none is a roster change:
1. **`applies_to:` must be rewritten for the seven.** `lenses.yml:30, 50, 84` still name `framer`.
   `business` and `product` move to `[orchestrator, builder]`; `customer` and `research` gain
   `instrument`.
2. **`qa.js` must read `review-lenses.yml`.** `grep -c 'review-lenses' .claude/workflows/qa.js` → **0**.
   The binding gate hardcodes five code dimensions; every quality lens lives in a file the gate that
   binds does not open. Correctness has a binding path; quality has none.
3. **Lenses need an applicability predicate and a dependency edge** — BMAD's `applies_to` / `when` /
   `after`, so a lens that depends on another's findings runs second and receives them.
4. **`independent: true` needs an executor, not a sentence.** Three lenses declare it with
   `model_families: [anthropic, openai]` and every review in this repo's history has been
   single-model.

**Skills — 134 procedures in 7 namespaces, injected before the first turn.** This is the *measured*
arrival channel: skill bodies land as `isMeta` user messages before turn 1 (288 of 431 transcripts
carry `<skill-format>`). Discovery is two-tier (`routers/INDEX.md` → one namespace → 3–5 files, ~1,070
tokens against ~15,000 for the whole manifest).

**Name the real constraint, because the prior board did not:** `skills:` binds **per file**. There is
no skills option on `agent()` and none on `Agent`. Only **10 of 134** skills are attached to any
container, and `design.js:80` proves the workflow surface cannot fix this — it carries craft
specialisation as a prose instruction (*"MANDATORY: before designing, Read … SKILL.md"*), which is a
pointer an agent may ignore in place of an injection it cannot receive. **92% of the library is
unreachable through the one channel measured to work.** That is a real deficit and the fix is skill
selection per container plus per-stage skill lists in the playbook — not more containers.

**Workflows — deterministic orchestration, in committed JavaScript.** Four exist: `qa.js`, `coding.js`,
`research.js`, `design.js`. Their value is that arithmetic, fan-out, quorum, retry-on-dropout,
coverage-gap detection and the verdict itself live in code an agent cannot argue with. `qa.js` proves
all of it in 232 lines. This is also the surface that accepts `schema`, `effort`, `agentType`,
`disallowedTools` and `bashCommandClamp` — the last two used **zero** times.

Three workflows are missing and each closes a named hole:
- **`plan.js`** — a `Decompose` phase with a `SLICE_SCHEMA` producing exactly `{id, agentType, brief,
  files}`. `coding.js:20` **refuses to run without it** and nothing in this repo produces it;
  `research.js:100-111` already implements the identical twelve-line shape for sub-questions.
- **`ship.js`** — preview → smoke → `gate: outbound-approval` → promote → verify → rollback, with the
  verification bound to shell exit codes the state machine will not advance past, and a bounded
  `retry-with-autofix-then-halt`.
- **`watch.js`** — post-launch checkup. `resolvers.js:243-293` already shells out and asserts exit code
  plus stdout regex; `claim-source` already re-fetches a URL and asserts the quote is still present.
  Point them at production. **This one needs a clock it does not have — see §6.**

**Playbooks — stages and exit criteria, never method.** Six exist, all delivery-shaped. The gap is
business discovery, and Spec Kit shipped exactly the missing stages under user pressure:
`intake → research → define → shape → decide` with a **go / needs-clarification / kill** gate. Add
them as a playbook. Also missing: a `campaign` playbook that sequences several playbooks against one
clock, because `orchestrator.md` Step 2 matches work to **one** playbook and calls anything else
unroutable — so "land 10 paying customers in 60 days" breaks at step zero.

Three further mechanisms belong here, all data, all named:
- **The artifact-existence gate.** A stage cannot open until the prior stage's named artifact exists at
  a resolvable path, checked by a script the agent did not author. Spec Kit's
  `check-prerequisites.sh` (`set -e`, `exit 1`) runs this under 83,385 installs a month.
- **The frozen spec.** `<frozen-after-approval>` plus a `baseline_commit` written into the spec before
  any change, so review runs over `git diff` from a recorded point and never over the producer's
  report. This is what carries producer-cannot-close, and it is stronger than a `framer` container
  because it binds the *artifact* rather than one author's tool list.
- **The autonomy dial.** Six config keys in a policy file read by a deterministic driver, keyed on
  `classifier.js`'s tier: which stages halt, max review cycles, verification commands, parallelism,
  wall-clock supervision tiers, cost ceiling. **No roster size answers this question.**

**Scripts — the things that actually bind.** `classifier.js` (one implementation, the only one),
`gate-logic.mjs` (`decideVerdict`, 6 lines, unit-tested), `ledger.mjs` + `resolvers.js` + `claims.js`,
`schema-lint.js`, `check-registration.mjs`, `pre-tool-use.sh`. Two script-level upgrades outrank any
container: a **de-obfuscating command policy** (normalise heredocs and quoting *before* matching —
today `pre-tool-use.sh` matches raw text and is evaded by quoting), and a **tighten-only composition
rule** so a narrower scope may only tighten the floor, never loosen it.

---

## 6. THE LAYERS, AND WHO OWNS EACH

| Layer | Owner | State |
|---|---|---|
| **Orchestration** | `orchestrator` (agent) + the **launch profile** (`--permission-mode`, the `autoMode` policy of 17 allow / 66 soft_deny / 1 hard_deny / 20 environment rules, `--disallowedTools`, `--max-budget-usd`, `--json-schema`, `--settings`) + a launcher script | **Partial.** Every property separating an unattended run from an attended one is a launch flag or a settings section, and **none is readable from an agent file** — which is why no second orchestrator container is proposed. Live defect: the machine default is `defaultMode: auto`, but `bin/warroom:235,237` overrides it with `--dangerously-skip-permissions`, which turns the 66-rule classifier off. The single unwaivable `hard_deny` rule is Data Exfiltration, evaluated against a trust boundary that prints **"None configured."** |
| **Planning** | `orchestrator` holds the campaign goal in the **job file**; `plan.js` produces the decomposition under a schema; the spec is a **frozen artifact**; `product` / `business` lenses shape it; `risk` and `customer-value` review lenses critique it | **Owner assigned, mechanism missing.** `plan.js` does not exist and `coding.js:20` refuses to run without its output. No campaign sequencing exists. |
| **Execution** | `builder` (repo artifacts) · `designer` (rendered surfaces) · `operator` (state outside git) | **Two of three exist.** No playbook in this repo can make anything live: `ship-feature.yml` ends at merge and `launch-landing-page.yml:38` explicitly refuses production. `grep -rn "vercel\|stripe\|supabase db push\|terraform" bin/ scripts/ .claude/hooks/ .claude/workflows/` → **zero hits.** |
| **Verification / quality** | `reviewer` (one container, ten lenses, two postures) + `qa.js` (fan-out, verify, arithmetic verdict) + `gate-logic.mjs` + `qa-lead-pass.yml` + branch protection + the claim ledger | **Structurally right, empirically uncalibrated.** The verdict is deterministic and the LLM judge cannot grant a pass the rule denies — genuinely ahead of every framework surveyed. But: **34 PASS / 2 PENDING / 2 N/A / 0 BLOCK** across the entire recorded history, no execution in the loop, no cross-family independence despite three lenses declaring it, no seeded-defect corpus, and the merge gate reads a `qa_verdict:` string the author writes about their own work. |
| **Skills** | `.claude/skills/**` + `routers/INDEX.md`, injected via `skills:` frontmatter | **Works, and is 92% unreached.** 10 of 134 attached. |
| **MCP** | `mcpServers:` frontmatter, resolving from user scope | **Blocked by its own linter.** Zero declarations across 17 files; `.mcp.json` absent; `mcpConfigured()` (`schema-lint.js:85-93`) fails the build for any declaration. Eight servers are live at user scope right now: `higgsfield, mem0, miro, pencil, playwright, refero, runpod, stitch`. |
| **Tools** | `tools:` (subtracts, never binds `Bash`) + **E8** `disallowedTools` / `bashCommandClamp` at a workflow dispatch + **E7** OS sandbox | **The largest hole in the system.** E8 used zero times; E7 configured zero times. Any agent holding `Bash` can write anywhere on the filesystem. |
| **Workflows** | `.claude/workflows/*.js` | **Four exist, three missing** (`plan.js`, `ship.js`, `watch.js`). |
| **Processes** | `.claude/playbooks/*.yml` — stages and exit criteria, method forbidden by the linter | **Six exist, all delivery-shaped.** 16 of 23 stages carry no `dispatch:` block at all. Business discovery and campaign sequencing missing. |
| **QA gate** | `classifier.js` → `qa.js` → `gate-logic.mjs` → `qa-lead-pass.yml` → **E4** | **Blocking since 2026-08-11**, and its input is one uncalibrated opinion source. In-run tier is `A.tier \|\| 'full'` — caller-declared prose — while `classify.mjs` exists and has **zero in-run call sites**. |
| **Checkups (post-merge, scheduled)** | **NOBODY. This layer has no owner today.** | `crontab -l` → none. No launchd entry for this project. The one clock, `ledger-sweep.yml`, runs `node` on a runner with `permissions: contents: read` and no Claude session — it cannot open an issue, notify, or start work. The in-session `CronCreate` is session-only, in-memory, idle-REPL-only, and auto-expires after 7 days. **Three required jobs — intake from a non-human trigger, park a gate durably, reach a human who has walked away — do not exist in any form.** There is no escalation channel: `grep -rn 'gh issue create\|osascript\|terminal-notifier\|slack\|sendmail'` across `bin/`, `scripts/`, `.claude/hooks/`, `.github/` and `mission-control/server` returns **zero**, and Mission Control has **zero HTTP write routes** by design. A run that reaches `gate: founder-approval` at 02:14 exits into silence nothing detects. **This is a launcher, a queue and a notifier — not an agent, and no roster size fixes it.** |
| **Tests** | `npm run check` / `ci.yml` — schema-lint, gate-logic, manifest, registration, launcher guard rails, claim ledger | **Real and blocking.** Missing one class entirely: a **behavioural** test that a playbook, when actually run, does what it says. superpowers has a working template (`claude -p` headless, assert behaviour). |

---

## 7. WHERE THE PRIOR BOARD WAS RIGHT AND WHERE IT WAS WRONG

`AGENT-ARCHITECTURE.md` should be **edited, not discarded.** Section 0 is the best measurement work in
this repository and every finding in it survives.

### Right, and kept without amendment

1. **The container test itself.** Conceded in full. A persona differs only in prose, and prose is the
   one thing in this runtime that binds nothing.
2. **Five reviewer personas → one engine carrying lenses** (`reviewer.md:3`). Independently confirmed
   three times: BMAD v6.11.0 collapsed five review skills into one skill carrying five `lens-*.md`
   files; superpowers went two reviewers → zero → **one reviewer returning two verdicts** (v6.0.0);
   `qa.js:72-78` already runs the shape as five strings in one array.
3. **Nine domain builders → one**, and nine C-suite personas → the orchestrator.
4. **`judge` cut on `mustBlock ≡ confirmed`.** Reproduced. BMAD reached the identical arithmetic
   independently (`followup_review_recommended` = any high, or 3×medium + 1×low ≥ 5). Two projects,
   two corpora, one answer: an LLM judge standing next to a computed verdict contributes a summary
   string.
5. **The 11 shims cut**, `maxTurns` deleted, `Task` deleted (0 of 1,133 calls).
6. **§0's binding table.** `effort` binds, `maxTurns` does not, `skills:` is injected before turn 1,
   `isolation: worktree` is git, and the `model:` pin governs on the workflow path. This corrected the
   brief that convened it, and it is why every recommendation here names a field rather than a wish.
7. **The designer condition, correctly framed as conditional on a capability rather than on taste.**
8. **§9.** It disclosed the weakness that made this board necessary. That is the behaviour the system
   is being built to produce.

### Wrong, specifically

**7.1 — Clause (b) is circular, and its own roster refutes it.**
> *"and (b) something dispatches it."*

Reproduced 2026-08-14:
```
$ grep -h 'engine:' .claude/playbooks/*.yml | sort | uniq -c
   4  engine: builder
   2  engine: designer
   4  engine: sourcer
```
`framer` 0 — **and `reviewer` 0, and `orchestrator` 0.** A test that scores at zero the two containers
the same document calls its strongest is not measuring roles; it is measuring playbook completeness.
The denominator confirms it: **7 `dispatch:` blocks across 23 stages** — 16 stages dispatch nothing,
and those 16 include every planning stage in the system. Clause (b) is a fine tool for pruning what
exists and an invalid one for deciding what should exist. **Strike it.** Replace it with the
co-residence hazard test in §2 step 2, which is not circular because it reasons about capability
combinations rather than about a history.

**7.2 — The `operator` cut rests on a premise the same document disproves.**
`AGENT-ARCHITECTURE.md:241` cuts `operator` because *"it grants MCP through the same field it declares
non-load-bearing."* But `AGENT-ARCHITECTURE.md`'s own binding table, 120 lines earlier, reads:

> `mcpServers:` — **YES — and this refutes A4's central claim.** `archivist` declares
> `mcpServers: [mem0]` and made mem0 calls in **12** runs. `design-critic` declares
> `mcpServers: [playwright, refero]` and made playwright calls in **6**. Neither lists any `mcp__*`
> name in `tools:`.

Both sentences are in one file. One is measured; the other is the load-bearing clause in the cut of
**the only production-capable container in the entire dossier**, and it is false against that
measurement. This is the single most consequential error in the document and it is a one-line fix
with a seven-line consequence.

**7.3 — Clause (a) was applied to denials only, and never once to a grant.**
Read the four surviving justifications: `builder` — isolation. `reviewer` — no `Write`/`Edit`.
`sourcer` — no `Bash`. `framer` — no `Bash`. Every container in the five is earned by a subtraction or
an isolation mode. **Not one grant was evaluated**, because `WebSearch`/`WebFetch` on `sourcer` is the
only grant this repo has ever made: `grep -rn mcpServers .claude/agents/` → **0**, `.mcp.json` absent.
A roster derived from a corpus that never left the repo will never contain the container that leaves
the repo. That is §9's own error, and it landed on the two cuts where it is fatal.

**7.4 — `prover` and `visual-referee` were cut with the disqualified method.**
`prover`: *"No application exists here (`package.json` is `gsa-startup-kit`, a template installer; zero
dependencies; no `src/`)."* `visual-referee`: *"there is no rendered surface in this repo to referee."*
Both are true statements about a harness that has only ever been pointed at itself. For a business the
application **is** the product. Neither returns as a separate file — both are absorbed into `reviewer`,
which is the right answer — but the *reason* they were cut cannot stand, and the absorption requires
the browser grant the same document declined to make.

**7.5 — §1 inverts its own premises on `skills` and `effort`.**
> *"`effort` and `skills` are now also container-forming (both bind, measured), which strengthens the
> case for **fewer** agents, not more."*

Both premises are true; the inference is invalid. `skills:` has no option on `agent()` and none on
`Agent` — it is a **per-file** field. If injection is the arrival mechanism, N distinct payloads
require N files, which argues for *more*. `effort` is worse for the argument: it exists on `agent()`
and appears in **0 of 1,133** `Agent` calls, so on the roster's normal dispatch path it too is
file-only. The conclusion happens to survive on a different ground — a skill payload is prose, and
prose is not capability — but the sentence as written should be deleted rather than inherited.

**7.6 — `framer` was cut for the wrong reason. The cut stands.**
It was cut on clause (b), which is broken. Cut it on the rule instead: **it needs no grant.** Its only
distinguishing property is the denial of `Bash`, and a denial is per-call data. Producer-cannot-close
— the real thing `framer` was reaching for — is carried better by a **frozen artifact plus a recorded
baseline commit** than by one author's tool list, because `framer` holds `Write` and `Edit` and can
therefore amend a spec after seeing the build. Same outcome, sound reasoning, and now the reasoning
generalises.

### The adjudicators, and the decision between them

Both steelmanned honestly and **both named their own weaknesses at length. Neither is discounted.**
The five-adjudicator conceded that grants are file-only, that this is "the founder's intuition arriving
by the correct route," and that "the moment E7 is configured, my argument for five stops working." The
seven-adjudicator conceded that two of its seven are earned by denials rather than grants, that its two
additions have never run anywhere, and that its own container "does not contain" before E7.

**They converge on the rule and differ on scope: are grants the system has not yet made in scope for
the count?** I decide **yes**, for one reason that is not an appeal to ambition-as-preference. The
repository has *already written the rules for those grants*: `qa-tier-floor.yml:50-105` tiers
migrations, billing, payments and webhooks at `irreversible`/`block`; `launch-landing-page.yml:39`
declares `gate: outbound-approval`; `lenses.yml:52` orders that cohorts come from the system of
record. The obligations are on disk and no container can discharge them. A roster that omits them is
not smaller — it is a roster that has decided those stages will never run, and nothing in the repo
records that decision.

The five-adjudicator's own closing line is worth recording: *"if the board's synthesis chooses six or
seven with a named grant per container and a stated E7 precondition, I would not fight it."* That is
what this is.

One disagreement resolved against **both**: neither should keep `framer`, and the seven-adjudicator's
seventh slot and the five-adjudicator's fifth slot were different files. The membership matters as much
as the count, and both got one member wrong.

---

## 8. WHAT WOULD FALSIFY THIS ANSWER

Ordered by how fast each resolves. Each is a measurement or a decision, not an argument.

**F1 — One `strings` re-run on the next CLI. This is the cleanest kill and it is one command.**
```
strings -a <binary> | grep -c 'allowedTools?:'          # today: 0
strings -a <binary> | grep 'agent(prompt: string, opts' # today: no mcpServers, no tools
```
If `agent()` or `Agent` ever accepts an additive `allowedTools` or an `mcpServers` option, grants
become per-call, containers 3 through 7 collapse into option objects, and the answer is **three or
fewer**. The entire derivation in §1 dies with that one grep.

**F2 — Route all dispatch through the `Workflow` surface.** Then denials are per-call too, `reviewer`
collapses into a dispatch entry carrying `disallowedTools: [Write, Edit]` plus a lens — exactly BMAD's
`[[workflow.review_layers]]` shape — and the answer is **six**. Note that 1,452 of 2,435 subagent
transcripts already run on that path.

**F3 — E7 lands and the launcher stops bypassing permissions.** If `sandbox.network.deniedDomains` and
`sandbox.filesystem.denyWrite` are configured per launch and `bin/warroom` drops
`--dangerously-skip-permissions`, blast radius is bound by the process rather than by which file the
dispatcher named, and the roster degrades toward a naming convention. I would expect **four** and would
say so.

**F4 — The narrowed-dispatch control.** Run one real deploy two ways: (i) an `operator` file with
`mcpServers`, and (ii) a `builder` dispatched through `agent()` with `bashCommandClamp` scoped to the
deploy command form and `disallowedTools` on everything else. If (ii) completes without a credential
landing in a builder context and without the clamp being bypassed, **`operator` is a lens with a token
and the answer is six.** This has never been tried: `bashCommandClamp` appears **zero** times in this
repo, so the strongest counter-argument to my own position is currently an untested CLI claim rather
than a demonstration — which is exactly the claims-versus-demonstrates line, and it cuts at me.

**F5 — A seeded-defect corpus pointed at the browser grant.** Plant twenty known rendered defects
(contrast failure, keyboard trap, broken empty state, small-screen overflow) and compare a
browser-holding `reviewer` against a source-reading one. No detection lift → retag `craft`, `voice`,
`accessibility` to `scope: diff-only`, delete `designer.md`, and the answer is **five**.

**F6 — A role ablation on real venture work.** Anthropic's own `skill-creator` ships the instrument:
`evals.json` → one isolated subagent per case → `grading.json` with per-assertion evidence →
`benchmark.json` comparing with-X and without-X → blind A/B. Point it at one container at a time. It
can kill `instrument`, `designer` and `sourcer` as easily as it can vindicate them, and I would accept
either result.

**What would NOT falsify this, stated so it cannot be smuggled in:** more stars, more installs, another
framework shipping a different count, a vendor percentage from an internal eval, an appeal to how human
companies are organised, or any argument from a *low* dispatch count in this corpus — that test scores
`reviewer` at zero and is therefore unavailable to every party here, including me. Token cost is
inadmissible in both directions.

### The cheapest experiment that would settle it

**Run one real venture task end to end and count what was missing.** Not a file walk — a run.

The smallest task that touches all four grant-classes: **price Mission Control as a paid tier, publish
a landing page to preview, promote it, take one test-mode payment, and read the result back.** Roughly
one afternoon of wall-clock.

Instrument it with two counters and nothing else:
1. **Every point where an agent needed a capability no container held.** Each one is a candidate grant.
2. **Every point where a capability was held by a container that did not need it for that step.** Each
   one is a candidate merge or a candidate denial.

That produces the grant inventory directly, which is the only input the rule in §2 requires. Run F4 as
a control inside the same task — do the promote step once through an `operator` file and once through a
clamped `builder` dispatch. Two runs, one afternoon, and the number stops being a matter of argument.

The prior board's §9 said this in its own words: *"Every process finding in the dossier traced files
rather than running the playbook."* That is still true of this board. **This document is the best
answer available from measurement of the runtime and static analysis of the repo, and it is not
validated against one real customer-facing task.** Two boards have now reasoned about roster size
without running the job. The third should not be a board.

---

## 9. OPEN DECISIONS FOR THE FOUNDER

Each is a decision only the founder can make, with the consequence for the number stated.

**D1 — Will this harness ever hold a production credential?**
Yes → `operator` is real and the roster is seven. No — deploys, migrations against live data and money
configuration stay human acts, with the agent producing the command and a person running it → `operator`
dies, `gate: outbound-approval` resolves to a notification, and the roster is **six**. This is a policy
question, not an architecture question.

**D2 — Will the system read its own systems of record live, or only committed exports?**
Live → `instrument` is real. Exports only (a nightly dump into the repo, read by `builder`) →
`instrument` dies and the roster drops by one. Note the cost of the export path: every number is as
stale as the last dump, and `lenses.yml:52` currently orders the opposite.

**D3 — The browser grant.** Approve → `designer` and `reviewer` both take
`mcpServers: [playwright]`, and `craft` / `voice` / `accessibility` become satisfiable for the first
time. Refuse → delete `designer.md` and retag those three lenses to `scope: diff-only` **in the same
PR**. Keeping `designer` without the grant is the worst option: three p1-blocking gates that no
container can satisfy means every design gate either deadlocks or passes on evidence nothing checked.

**D4 — E7, and it gates D1 and D2.** The sandbox is available and configured nowhere. Until
`sandbox.network.deniedDomains` is set **and** `bin/warroom:235,237` stops passing
`--dangerously-skip-permissions`, a credentialed container is a label. Sequence: sandbox first, grants
second. Doing it the other way produces security theatre.

**D5 — `.mcp.json` and the lint.** `mcpConfigured()` tests only that the file *exists*, so adding one
flips the lint permissive for `mcpServers:` on **every** agent at once. Decision: add `.mcp.json`
together with a per-agent server allowlist in `schema-lint.js`, or the enabling change trades a working
check for a capability.

**D6 — Model and effort, and this is the cheapest correction in the document.** Unpin
`claude-sonnet-4-6` everywhere (23,404 turns on this machine, zero at `xhigh`); update
`VALID_MODELS` to the Claude 5 set; **add `effort` to `REQUIRED_FRONTMATTER` and remove `maxTurns`.**
The deepest job in the system currently runs on the weakest settings by omission.

**D7 — The second model family.** `gemini` 0.38.2 and `ollama` (kimi-k2.5, glm-5) are on this machine's
PATH today. The record schema, the independence predicate and the resolver stub all already exist.
Decision: build the resolver (~20 lines at `resolvers.js:307`) or keep the human paste-back errand.
Diverse-family generators plus a judge win 0.810 of head-to-heads; same-family, 0.512 — indistinguishable
from a single agent. This is worth more than any additional container.

**CLOSED 2026-08-23** (kept beside the original for the record, per house style): the founder
accepted single-family review for harness self-edits as an **ACCEPTED RISK, not a satisfied
requirement** — see [2026-08-23-after-p0.md §6](../08-agents_work/handoffs/2026-08-23-after-p0.md)
and [MODEL-DIVERSITY.md](MODEL-DIVERSITY.md). Two things above do not hold: `resolvers.js:307` is
not a resolver stub — as of this correction that line sits inside the `command` resolver's exit/stdout
handling, and a search of the file for a second-family stub (`gemini`, `ollama`, "second.family")
finds none. "The resolver stub all already exist[s]" was never true of that line; no such stub exists
in `resolvers.js` today. If the Codex resolver (P0 item 6) ever lands, build it fresh rather than
looking for this pointer.

**D8 — Does `operator` split?** One file today. It becomes two when a live payments key and a deploy
token stop sharing a blast radius and a gate tier. Decide from a credential inventory, after D1.

**D9 — Which experiment runs first.** My recommendation, and it is not neutral: the venture task in §8,
before any of the seven files is written. It is the only instrument that can tell you that this
document is wrong.

---

*Every claim here is a file:line in this repository, a command run while writing it on 2026-08-14, a
URL with an access date carried from the studies, or a labelled gap. Where the adjudicators disagreed,
the disagreement is stated and then decided — see §7. The one thing this board could not do is the one
thing that would settle it: run the job.*
