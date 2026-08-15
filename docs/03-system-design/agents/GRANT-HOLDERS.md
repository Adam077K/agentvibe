# Grant holders — `sourcer` · `instrument` · `operator`

*The implementable specification for the three agents that reach outside the repository.*

**Date:** 2026-08-14 · **Status:** spec, not yet built · **Binding input:**
[ROSTER-SIZE.md](../ROSTER-SIZE.md) (decided) · **Corrects:**
[AGENT-ARCHITECTURE.md](../AGENT-ARCHITECTURE.md) §7 on `operator`

---

## 0. What this document is, and what it verified for itself

ROSTER-SIZE decided **seven** containers, on the ground that this runtime prices a capability
*denial* (settable per dispatch) differently from a capability *grant* (expressible only in
agent-file frontmatter). A business needs four grant-classes. This repository holds one. Three of
the four missing are specified here:

| Grant-class | Container | Exists today |
|---|---|---|
| Read the public web | `sourcer` | **Yes** — and dispatched zero times (§3.19 explains why, and it is a two-line defect) |
| Read the business's own systems of record | `instrument` | **No** |
| Act irreversibly on the world | `operator` | **No** |
| *See a rendered surface* | *`designer`* | *out of scope here* |

Everything load-bearing below is a `file:line` or a command run while writing this on 2026-08-14.
The commands, so they can be re-run:

```
$ V=~/.local/share/claude/versions/2.1.232
$ strings -a $V | grep -c 'allowedTools?:'                      → 0
$ strings -a $V | grep -o 'agent(prompt: string, opts?: {[^}]*}'
    agent(prompt: string, opts?: {label?: string, phase?: string, schema?: object,
                                  model?: string, effort?: string, isolation?: …, agentType?: string}
$ strings -a $V | grep -c 'bashCommandClamp'                    → 57
$ strings -a $V | grep -c 'disallowedTools'                     → 22
$ strings -a $V | grep -oE 'sandbox\.[a-zA-Z.]+' | sort -u
    sandbox.enabled · sandbox.failIfUnavailable · sandbox.workspace · sandbox.authentication
    sandbox.filesystem · sandbox.filesystem.disabled · sandbox.allowUnsandboxedCommands
    sandbox.autoAllowBashIfSandboxed · sandbox.seccomp.bpfPath
    sandbox.network.{allowedDomains,deniedDomains,allowManagedDomainsOnly,allowAllUnixSockets,tlsTerminate}
    sandbox.credentials{,.envVars,.files,.awsPairs,.sigv4,.allowPlaintextInject}
$ grep -c '"sandbox"' .claude/settings.json ~/.claude/settings.json    → 0 and 0
$ crontab -l                                                     → "no crontab for adamks"
$ ls .mcp.json                                                   → absent
$ python3 -c "…json.load(open('~/.claude.json'))['mcpServers'].keys()"
    → stitch · refero · miro · runpod · playwright · higgsfield · mem0 · pencil   (8, user scope)
```

Three things this document found that ROSTER-SIZE did not have, and each changes the design:

1. **`sandbox.credentials` has a mask mode, and it is the answer to the credential dimension.**
   §2. The agent's shell sees an opaque placeholder; the real secret is substituted at egress by
   the sandbox proxy. This is the difference between "we promise not to print the key" and a
   mechanism.
2. **The field was surveyed for a different question than ROSTER-SIZE §3 asked.** That board counted
   *how many agents* each system ships. §13 asks *how anyone grants a credential, runs a clock, and
   keeps a human in the loop on an irreversible act* — of Cloudflare OS, the Cloudflare Agents SDK,
   YC's QM, anthropics/skills, BMAD and Supabase's MCP server. Twelve conventions are adopted, seven
   rejected with reasons, and three disagreements are recorded — one of which (Supabase's *"Don't
   connect to production"*) changed this specification.
3. **The prior board's MCP census is right about the calls and wrong about the config.**
   ROSTER-SIZE §7.2 quotes it as *"Neither project's `.mcp.json` names the server used — both
   resolved from user scope."* True as far as the server names go, but **both sibling projects
   have a `.mcp.json`** (`~/VibeCoding/adamos/.mcp.json`, `~/VibeCoding/evalove/.mcp.json`,
   verified by `ls`). So the measured evidence covers *"grant resolves from user scope in a repo
   that has some MCP config"* and says nothing about a repo with none — which is this repo. §8
   names the experiment that closes the gap.

---

## 1. The rule these three obey, stated once

> A capability **grant** exists in exactly one place: agent-file frontmatter (`tools:`
> additively, `mcpServers:`). There is no `allowedTools` on `agent()` and none on `Agent`
> (verified above). A **denial** is settable per dispatch and therefore never earns a file.
> Two grants live in separate files when their **co-residence names a reachable hazard**.

Applied to these three, the hazard sentences — each is the container's justification and must be
copied verbatim into the agent file, per ROSTER-SIZE §2 step 5:

| Pair | Hazard sentence |
|---|---|
| `sourcer` + `instrument` | `sourcer` pulls attacker-controllable web text into its own context while holding `WebFetch`. Adding a credentialed read of customer data to that file is a one-hop exfiltration chain — fetch a page, the page's text instructs a query, the answer leaves by the next fetch — and because the `Agent` dispatch path accepts no `disallowedTools`, the merge is permanent and cannot be undone at a call site. |
| `instrument` + `operator` | Every "what is our MRR" question would run in a container that can also issue a refund. The read path is high-frequency and low-ceremony; the write path must be low-frequency and gated. Merging them applies the write path's gate to every read, or the read path's absence of one to every write. Both outcomes are worse than two files. |
| `operator` + `builder` | An operator that can patch code can make its own deploy pass. The one failure BMAD names in prose — *"never edit the expectation to match the code"* — is enforceable here as a `tools:` list that demonstrably subtracts `Write` and `Edit`. |
| `operator` + `sourcer` | A container holding a production deploy token that also ingests arbitrary web text is prompt-injection with a production credential attached. |

**Four containers would be wrong.** `operator` stays one file until a credential inventory shows a
live payments key and a deploy token with different blast radii under different gate tiers
(ROSTER-SIZE D8). §6.4 states the split trigger as a testable condition rather than a feeling.

---

## 2. The credential mechanism — `sandbox.credentials` mask mode

This is the most important section in the document, because without it dimensions 3, 4 and 15 for
two of these three agents have no answer but a promise.

### 2.1 What is in the binary

Verified strings from `2.1.232`, quoted exactly:

```
"…the first-class answer is now a vault `environment_variable` credential — the agent's shell
 sees an opaque placeholder and the real secret is substituted at egress."

"this device's sandbox is configured to inject real credentials into sandboxed network requests
 (sandbox.credentials entries with mode \"mask\")…"

"[credential-mask] env var \""
"[credential-mask] extract pattern /"
"[sandbox] credential file mask for '"
"[credential-mask] Skipping masked file with non-UTF-8 content (binary credential files are not
 supported in mask mode): "

"\"allowPlaintextInject\" was degraded to an explicit false; plaintext credential injection stays
 disabled (lower-precedence values cannot enable it) until it is fixed."

"The credentials block was degraded to a fail-closed skeleton (all-deny sigv4, implicit AWS
 auto-pairing suppressed, no masking) until it is fixed."

"…its lone entry object was invalid and was degraded to mode \"deny\". The credential stays
 blocked (not masked) until it is fixed."
```

### 2.2 What that buys, in this system's terms

| Property | Consequence for `instrument` / `operator` |
|---|---|
| The shell sees a **placeholder**, the proxy substitutes at **egress** | The real secret is never in the model's context, so it is never in `~/.claude/projects/*.jsonl`. `pre-tool-use.sh:162-164` blocks reading `.env` *into* a transcript; mask mode removes the need for the secret to be readable at all. |
| Malformed entries **degrade to `deny`**, never to plaintext | Fail-closed. A typo in the credential config blocks the credential; it does not leak it. This is the same posture as `pre-tool-use.sh:86` (unparseable payload → block). |
| `allowPlaintextInject` cannot be enabled by a lower-precedence file | A project-scoped settings file cannot turn masking off. |
| File masks support an **extract pattern** | A credential inside a config file can be masked without masking the whole file. |
| Non-UTF-8 credential files are **unsupported** in mask mode | A binary keyfile (e.g. a service-account `.p12`) cannot be masked. Named limitation — such credentials stay out of this system. |

### 2.3 How this compares to the best-resourced system in the field

YC's QM is the closest production comparator — it runs YC's own accounting, legal and events — and its
`SECURITY.md` discloses the opposite property, in one sentence:

> *"Credentials and capability tokens materialized as environment variables or files are readable by
> processes in that sandbox."* — [yc-software/qm `SECURITY.md`](https://github.com/yc-software/qm/blob/main/SECURITY.md), accessed 2026-08-14

**QM's sandbox credentials are plaintext while in use.** If mask mode does what its error strings say,
this runtime is *stronger* than QM's on the single axis that matters most for `instrument` and
`operator` — and this is the one place in the whole document where we are ahead of the field rather
than behind it. **If X1 below fails, we are exactly at QM's level**, and the honest response is to
adopt QM's honesty about it rather than to claim a control we do not have.

### 2.4 The honest limit

**I verified that these strings exist in the binary. I did not run a sandbox with a mask entry
and observe a placeholder in a transcript.** The experiment is one command and belongs in the
migration ladder before any grant is made:

> **X1 — the mask proof.** Configure one throwaway credential (`FAKE_TOKEN=sk-real-value`) as a
> `sandbox.credentials.envVars` mask entry in `~/.claude/settings.json`, launch one sandboxed
> session, run `node -e 'console.log(process.env.FAKE_TOKEN)'`, and `grep -c 'sk-real-value'` the
> resulting `~/.claude/projects/*.jsonl`. **Expected: 0 hits, and a placeholder in the
> transcript.** If it is not 0, mask mode does not do what its own error strings say, and
> `instrument` and `operator` do not get credentials in this runtime at all.

Until X1 passes, the credential design below is a design, not a control.

---

## 3. `sourcer` — read the public web

Exists at [.claude/agents/sourcer.md](../../../.claude/agents/sourcer.md). Never dispatched.
This is a repair spec, not a creation spec.

### 3.1 Model and effort

| | Value | Why |
|---|---|---|
| **model** | `claude-opus-5` | Today `sourcer.md:5` pins `claude-sonnet-4-6`. The pin is not merely old — a stale pin **silently clamps `effort`**, and `effort` is the one quality dial that binds. Source discrimination (is this a primary source or a blog quoting one?) is exactly the judgement a weaker model gets wrong quietly. |
| **effort** | `high` | Not `xhigh`. Sourcer's work is breadth-shaped — many fetches, shallow reasoning per fetch — and the binding constraint is wall-clock across a fan-out of sub-questions, not depth on one. `xhigh` on a 12-way sweep buys little and costs the rolling-5h window. |

`effort` is not in `REQUIRED_FRONTMATTER` today (`schema-lint.js:66-76`), and `maxTurns` is —
which is backwards, since `maxTurns` does not bind and `sourcer.md:7` declares `25`. Both changes
are ROSTER-SIZE D6 and are a precondition for all three files.

### 3.2 Permissions, and what enforces each

| Capability | State | Enforced by |
|---|---|---|
| `Read, Glob, Grep` | granted | — |
| `WebSearch, WebFetch` | **granted (the grant)** | file-only; no dispatch surface can add it |
| `Write, Edit` | denied | **E1** `tools:`. Measured decisive on read-only engines. |
| `Bash` | **denied** | **E1**. This is the roster's one clean boundary: no interpreter to assert around. ROSTER-SIZE §4.5 records 7 runs, 284 tool calls, zero `Bash`. |
| `Agent` | denied | **E1** — sourcer must not fan out to children that lack its constraints. |
| MCP | none | absent by construction; see §8 |

`sourcer` is the only one of these three where **E1 is close to sufficient**, precisely because it
holds no `Bash` and no credential. Everything it can reach is public and everything it can do is
read. It is the container to ship first for that reason.

### 3.3 Credentials and secrets

**None. Ever. This is a boundary, not an omission.**

- No API key for a search provider, no session cookie, no `Authorization` header.
- If a source requires authentication, `sourcer` returns a **gap**, not a workaround.
- The one-hop exfiltration hazard in §1 is entirely about what happens if this rule is relaxed.

Write the rule into the file as a refusal, because the temptation is real and specific: a paywalled
competitor pricing page is exactly the thing someone will want to hand sourcer a login for.

### 3.4 Network boundary

`sourcer` is the **only** one of the three with a broad outbound posture, and it is still not
unbounded.

```jsonc
// sandbox.network for a sourcer dispatch
{
  "deniedDomains": [
    "*.stripe.com", "api.stripe.com",
    "*.supabase.co", "*.supabase.com",
    "*.vercel.com", "api.vercel.com",
    "*.github.com",                  // sourcer has no reason to reach the code host
    "169.254.169.254",               // cloud metadata endpoint
    "*.slack.com", "hooks.slack.com" // no outbound messaging
  ],
  "allowedDomains": ["*"],
  "allowAllUnixSockets": false
}
```

**Deny-list, not allow-list, and that is deliberate.** An allow-list for public research is a
research tool that cannot research anything it was not told about in advance, which defeats the
container. The deny-list exists to make one specific thing impossible: sourcer reaching a system
of record. `instrument`'s allow-list and `sourcer`'s deny-list are complements — every domain on
one is on the other.

### 3.5 Isolation

**No worktree.** `isolation: none` (already correct at `sourcer.md:9`). It produces no files, so a
worktree contains nothing and costs a `git worktree add` per dispatch. What it needs instead:

- **A fresh context per bounded question.** Injected web text is the untrusted input; a long-lived
  sourcer context accumulates attacker-controllable text across unrelated questions.
- **A sandbox** (E7) with the §3.4 network posture. This is the only isolation that matters for it.

### 3.6 Skills

| Skill | Why |
|---|---|
| `deep-research` | already declared (`sourcer.md:10-11`); the decomposition procedure |
| `competitive-landscape` | the highest-frequency sourcer question in a startup is "what do they charge and what do they claim" |
| `market-sizing-analysis` | the second-highest, and the one where an unsourced number does the most damage |

Three, at the ceiling for a worker (2-3 per CLAUDE.md; sourcer is a research-shaped worker, so 3).
All three verified present in `.claude/skills/MANIFEST.json`. `skills:` is injected before the
first turn (288 of 431 transcripts carry `<skill-format>`, per ROSTER-SIZE §5.2) and has no
dispatch-time surface — so this list is the only channel by which sourcer arrives competent.

### 3.7 MCPs

**None.** Sourcer's grant is `WebSearch`/`WebFetch`, which are first-class tools, not MCP. Adding
an MCP server here would import the untested grant path (§8) into the one container that does not
need it.

One caveat worth recording rather than assuming: ROSTER-SIZE notes sourcer's `tools:` declaration
yields 0 of 7 MCP tools, and flags "declaring `tools:` may amputate MCP" as contested. The sibling
evidence resolves it in the other direction — `adamos/.claude/agents/archivist.md:6-10` declares
`tools: [Read, Write, Edit, Bash, Glob, Grep]` with **no `mcp__*` entry** and `mcpServers: [mem0]`,
and made mem0 calls in 12 runs (AGENT-ARCHITECTURE.md:54). So the likely explanation for sourcer's
0/7 is simply that **it declares no `mcpServers:`**, not that `tools:` amputates. Confirm with X2
(§8) before relying on it either way.

### 3.8 Prompt strategy, and what makes it non-sycophantic mechanically

**File-based**, with the dispatch supplying only the bounded question. The file already carries the
discipline (`sourcer.md:29-113`) and it is well written. What makes it bind is not the prose:

| Mechanism | What it forces |
|---|---|
| **Dispatch-site `schema`** (§3.9) | The return is a typed object with a `gaps` array. A model that wants to please cannot return prose that omits the gaps — the shape has a slot for them, and an empty `gaps: []` on a question with known unknowns is a visible assertion rather than a silence. |
| **`claim-source` re-fetches the quote** (`resolvers.js:165-233`) | A flattering paraphrase fails. The resolver normalises whitespace and case (`:149-163`) and asserts the recorded quote is present in the live body. A quote that was never there returns `fail: the URL is live but the recorded quote is not present in it`. |
| **`unresolved` ≠ `pass`** (`resolvers.js:7-14`) | Offline, timeout, unreadable body → `unresolved`, which the ledger treats as a would-block. Sourcer cannot buy a pass by citing something nobody could check. |
| **The `research` lens `refuses:` list** (`lenses.yml:125-129`) | Linted for content by `schema-lint.js`; a vague step fails the lint. |

**The prose that must stay, because nothing else expresses it:** *"Findings go up; decisions come
back down"* (`sourcer.md:112`). There is no mechanism that stops a model from appending a
recommendation. The schema helps — there is no `recommendation` field — but a recommendation smuggled
into a `claim` string is undetectable. Name it as an advisory rule honestly rather than pretending
the schema catches it.

### 3.9 Return contract

`return_contract:` in frontmatter is **decorative** — nothing reads it. The binding contract is the
dispatch-site `schema` on `agent()`. Delete the frontmatter block or keep it as documentation, but
do not treat it as enforcement.

```js
const SOURCE_SCHEMA = {
  type: 'object',
  required: ['status', 'question', 'findings', 'gaps'],
  additionalProperties: false,
  properties: {
    status:   { enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
    question: { type: 'string' },              // the question AS BOUNDED, which may differ from the brief
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'source_url', 'quote', 'accessed', 'confidence', 'source_kind'],
        additionalProperties: false,
        properties: {
          claim:       { type: 'string' },
          source_url:  { type: 'string', pattern: '^https?://' },
          quote:       { type: 'string', minLength: 1 },   // VERBATIM — the resolver refetches this
          accessed:    { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          confidence:  { type: 'number', minimum: 0, maximum: 1 },
          source_kind: { enum: ['primary', 'secondary', 'tertiary'] }
        }
      }
    },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['sought', 'why_not_found'],
        additionalProperties: false,
        properties: { sought: { type: 'string' }, why_not_found: { type: 'string' } }
      }
    }
  }
};
```

**Every field is chosen so the orchestrator can mechanically transcribe a finding into a ledger
claim** without a second model call. The mapping, exactly:

```yaml
- id: c-<slug>
  assert: <finding.claim>
  kind: external-fact              # claims.js:35-43
  scope: project
  verified_by: source              # claims.js:45
  evidence: {url: <source_url>, quote: <quote>, accessed: <accessed>}
  valid_until: <accessed + 90d>    # claims.js:558-568 requires it for scope:project
  confidence: <confidence>
```

`quote` is added to sourcer's contract and is **the load-bearing change**: the current file
(`sourcer.md:96-104`) returns `{claim, source_url, accessed, confidence}` with no quote, and
`claims.js:445-455` requires `evidence.quote` for `verified_by: source`. So today's return cannot
become a claim even in principle. `source_kind` exists so "primary sources first"
(`sourcer.md:66-69`) becomes checkable by the caller rather than merely instructed.

### 3.10 Stop and exhaustion

| Ends the run | What happens | How it fails loudly |
|---|---|---|
| Question answered | `status: COMPLETE` | — |
| Three fetch failures on one source | `status: PARTIAL`, that source becomes a `gap` | The gap array is non-empty and the orchestrator's stage exit requires a decision on it |
| Question unbounded after one re-scoping | `status: BLOCKED` with a narrower question in `question` | Schema-required; a BLOCKED with an unchanged `question` is a caller-side reject |
| Context exhaustion | Whatever is gathered, as `PARTIAL` | **Honest gap:** stop reasons are unrecorded in this runtime (ROSTER-SIZE §0). A sourcer that dies silently is indistinguishable from one that returned nothing. **Mitigation: the caller treats a missing return as `unresolved`, never as "no findings"** — the same rule `resolvers.js` applies to itself. |

`maxTurns` does not bind and must be deleted rather than tuned. A limit that does not limit is worse
than none because it gets believed.

### 3.11 Autonomy and escalation

**Fully autonomous. No gate.** Sourcer is the one container here that needs no approval for
anything, because everything it does is a public read and it cannot write. This is worth stating
explicitly so nobody adds ceremony to it by symmetry with the other two.

Escalates to `orchestrator` on: unbounded question after one re-scope; a primary source that
contradicts a claim already in the ledger (this is a **finding about the ledger**, and the
orchestrator must record a disposition — `refresh`, `deprecate` or `waive` — per `claims.js:53`);
three fetch failures on one source.

### 3.12 Context on arrival

| Arrives with | Source | Budget |
|---|---|---|
| The agent file | frontmatter + body, ~110 lines | ~1.5k |
| Three skills | `skills:` injection, pre-turn-1 | ~6-9k |
| The bounded question + the decision it informs | dispatch prompt | ≤ 500 tokens |
| Prior findings on this question | **must read** — the ledger index at `.claude/ledger/index.json`, filtered to `kind: external-fact` | ~2k, filtered |

Total on arrival ≈ **12k**, leaving the whole window for fetched text. `pre_flight_reads` currently
says "prior findings on this question, so it is not researched twice" (`sourcer.md:26`) without
naming a path — make it `.claude/ledger/index.json`, which exists.

### 3.13 State and memory

Sourcer writes **nothing** and this is correct. ROSTER-SIZE §4.5 names the consequence precisely:
the two playbook stages that dispatch sourcer exit on
`claim(kind=external-fact, verified_by=source)`, and a claim is emitted by writing a fenced
` ```claims ` block — which sourcer cannot do. Measured: 31 ledger claims, exactly one
`external-fact`, and it is the deliberately-failing canary
(`docs/06-codebase/ledger-canary.md:35-43`).

**The fix is the orchestrator owning the stage exit**, transcribing §3.9's return into a claim
block using the mechanical mapping above. Granting sourcer `Write` trades the roster's one clean
boundary for a convenience, and the transcription needs no judgement — every field maps 1:1.

What the next agent inherits: the claim, in the ledger, with an expiry. Not sourcer's context.

### 3.14 Observability

| Question | Answered by | State |
|---|---|---|
| Is it running now? | Mission Control **SessionsView** / **FleetView** | Exists |
| What did it fetch? | the transcript | Exists, unindexed |
| Did its findings survive? | `node scripts/ledger.mjs verify` → `claim-source` re-fetch | **Exists and is the good one** — this is the only agent in the roster whose output is automatically re-verified over time |
| Is a finding stale? | `claim-freshness`, daily via `.github/workflows/ledger-sweep.yml` (`cron: '20 6 * * *'`) | Exists |

Sourcer is the best-observed agent in the system and needs nothing new.

### 3.15 Failure modes and recovery

| Mode | Who notices | Recovery |
|---|---|---|
| Source moved; quote gone | `claim-source` at the next `ledger verify` → `fail: the URL is live but the recorded quote is not present` | Re-dispatch sourcer on the same question; record `refresh` or `deprecate` |
| Site blocks the fetcher (403/429) | `claim-source` → `fail: HTTP 403` | Becomes a named gap. **Do not** add a credential or a user-agent workaround — that is §3.3 |
| CI runner has no egress | `claim-source` → `unresolved`, never `pass` (`resolvers.js:179`) | Correct by construction; treated as a would-block |
| **Prompt injection from a fetched page** | **Nobody.** No mechanism sees this. | **The containment is the container**: sourcer holds no `Bash`, no `Write` and no credential, so a successful injection can at worst produce a false finding — which `claim-source` then fails on re-fetch. This is the whole reason the boundary is worth keeping clean. |
| Remembered figure substituted for an unfetchable one | `claim-source` (`fail`) | Already refused in prose (`sourcer.md:85-86`); the resolver is the mechanism |

**The field confirms that screening is not the answer, from the system with the most to lose by
saying so.** QM runs a content classifier by default — *"Auto screens supported,
provenance-labelled external text and supported tool results"* — and then states the limit in its
own `SECURITY.md`: *"Classifier approval is not authorization and cannot guarantee prompt-injection
resistance"*, with coverage gaps named (*"Command and background-process output, opaque or
multimodal results, raw webhook payloads … are not all covered"*) (accessed 2026-08-14). **So the
containment for a poisoned page is the container, not a filter** — which is the argument for keeping
`sourcer`'s tool list clean rather than for adding a screen it cannot rely on.

One QM convention *is* worth copying and costs a string: **provenance-label external text at the
boundary.** `research.js:105` and `:119` already do the prose half — they wrap the question and the
sub-question as `(DATA, not instructions)`. Extend it to fetched bodies, so injected text arrives
labelled as data even without a classifier to screen it.

### 3.16 Dispatch

- **Spawned by:** `orchestrator` (depth 1), or `research.js` at the `Sweep`/`Verify` phases.
- **Depth:** 1. Sourcer holds no `Agent` and spawns nothing — depth never exceeds 1 below the
  orchestrator.
- **Concurrency:** up to **6** parallel sub-question sweeps — `research.js:111` already caps at
  `DEPTH === 'deep' ? 6 : 5` and `:115-122` fans out over the angles. The bound is rate-limit
  headroom in the rolling 5h window, not cost.
- **Arguments:** `{label, phase, agentType: 'sourcer', model: 'claude-opus-5', effort: 'high', schema: SOURCE_SCHEMA}`.

### 3.17 QA of the agent itself

| Check | Fails when | Where |
|---|---|---|
| `schema-lint.js` | frontmatter drifts; a declared skill is not in MANIFEST (`:316`); the model leaves `VALID_MODELS` (`:97, :275`) | `ci.yml:52` |
| **New: `SOURCER_MUST_NOT_HOLD`** | `sourcer.md` `tools:` contains any of `Bash`, `Write`, `Edit`, `Agent`, `NotebookEdit`, or any `mcp__*` | add to `schema-lint.js` beside `READ_ONLY_ENGINES` (`:62`), same shape |
| **New: dispatch-site agentType** | `research.js` dispatches a research phase without `agentType: 'sourcer'` | a grep assertion in `scripts/check-registration.mjs` |
| `check-registration.mjs` | a `pre_flight_reads` path does not exist | `ci.yml:77` |

`READ_ONLY_ENGINES = ['reviewer']` today. Sourcer is read-only too and is not in it — a one-token
fix that makes CI refuse a `Write` grant on sourcer forever.

### 3.18 Helpers — what should be a script instead

- **Fetch-and-diff a known URL on a schedule** is `claim-source`, which already exists and already
  re-fetches and re-asserts every quote (`resolvers.js:165-233`). **Never dispatch sourcer to
  re-check a claim it already made.** That is the resolver's job and it costs no model call.
- **"Has this already been researched?"** is a grep over `.claude/ledger/index.json`, not a turn.
- **The claim transcription** in §3.13 is a ~30-line deterministic function, not a model call.

### 3.19 Migration — from today to this spec

`sourcer` has never run, and the reason is a two-line defect, not a design problem:

> `research.js:121` and `:134` dispatch `agentType: 'researcher'`. `researcher` is a **shim**
> (`.claude/agents/researcher.md:5` `kind: shim`) **with no `tools:` field at all** — so the one
> workflow that would have executed sourcer's discipline instead runs an all-tools default agent.
> Sourcer's zero dispatch count is a routing bug wearing the costume of an unused container.

| Step | Change | Risk tier |
|---|---|---|
| S1 | `research.js:121,134` → `agentType: 'sourcer'`; add `schema: SOURCE_SCHEMA`; add `effort: 'high'` | **full** (`scripts/**` is `full`; `.claude/workflows/` is unlisted → `lite` default, but this changes dispatch identity — treat as `full`) |
| S2 | `sourcer.md`: `model: claude-opus-5`, add `effort: high`, delete `maxTurns`, add `quote` + `source_kind` to the documented contract, point `pre_flight_reads` at `.claude/ledger/index.json` | **irreversible** — `.claude/agents/**` is `tier: irreversible, enforcement: block` (`qa-tier-floor.yml:70-74`) |
| S3 | Add `sourcer` to `READ_ONLY_ENGINES` and add `SOURCER_MUST_NOT_HOLD` | **irreversible** — `.claude/hooks/**` |
| S4 | Orchestrator-side claim transcription | **full** |

S2 and S3 both require the `VALID_MODELS`/`effort` schema change (ROSTER-SIZE D6) to land first,
or the file fails its own linter.

---

## 4. `instrument` — read the business's own systems of record

**Does not exist.** Proposed by no agent in either board. Its dispatch sites are already written:
`lenses.yml:52` orders *"Pull the cohort from the system of record rather than estimating it"*, and
`docs/09-metrics/{NORTH_STAR,UNIT_ECONOMICS,GROWTH}.md` are unfilled templates sitting under a
`qa-tier-floor.yml` rule that already demands sourced claims of them.

### 4.1 Model and effort

| | Value | Why |
|---|---|---|
| **model** | `claude-sonnet-5` | Reads and arithmetic. The hard part of "what is our MRR" is knowing which table and which filter, not reasoning. |
| **effort** | `high` | Not `medium`. The characteristic instrument failure is a **subtly wrong query** — a cohort boundary off by one, a cancelled-but-not-yet-expired subscription counted as churn — and that is precisely where a shallower pass produces a confident wrong number. A wrong number that gets acted on is unrecoverable in a way a bad diff is not (`qa-tier-floor.yml`, `docs/09-metrics/**` reason string). |

Deliberately *not* Opus: instrument runs on a schedule (§9) and its volume, not its depth, is what
consumes the rolling window.

### 4.2 Permissions

| Capability | State | Enforced by |
|---|---|---|
| `Read, Glob, Grep` | granted | — |
| `mcpServers: [<analytics>, <billing-read>, <db-read>]` | **granted (the grant)** | file-only. **Unenforced until E7** — `pre-tool-use.sh:342-344` is `*) # Unknown tool — allow`, so no `mcp__*` call reaches the only mechanism in this repo that can refuse an action. |
| `Write, Edit` | denied | **E1** |
| `Bash` | **denied** | **E1**. Load-bearing: `Bash` is unbounded (`tools:` does not bind it, only E7 does), and an instrument with `Bash` and a DB credential can exfiltrate by any means it likes. |
| `WebSearch, WebFetch` | **denied** | **E1**. **This denial is the container.** Instrument holds private customer data and must have *no arbitrary egress hop*. |
| `Agent` | denied | **E1** |

**The asymmetry to notice:** instrument's denials are enforced (E1 measured decisive) and its grant
is not (E7 absent). That is the correct order of operations — a container whose *denials* bind and
whose *grant* is withheld is safe and useless; the reverse is dangerous. Ship the file, withhold
the grant. ROSTER-SIZE §2 step 4 states this as a rule and it is the rule that governs here.

### 4.3 Credentials and secrets — the core of this container

**Credential set:**

| Credential | Scope | Lives in | Never |
|---|---|---|---|
| Billing read key | Stripe **restricted key**, read-only on `charges`, `subscriptions`, `customers`, `invoices` | host env var, masked (§2) | a secret key; never `sk_live_` |
| Database read role | Supabase **anon/read role** or a dedicated `metrics_reader` Postgres role with `SELECT` on named views only | MCP server config, `${VAR}` interpolated | never the service role; never `postgres` |
| Analytics API key | read scope on the product analytics project | host env var, masked | never a write/admin key |
| Inbox read token | read + search on a support inbox, no send | host env var, masked | never a send scope |

**Where they live, precisely.** There is a working example of exactly this pattern on this machine,
and it should be copied rather than reinvented — `~/VibeCoding/evalove/.mcp.json`:

```json
{ "mcpServers": { "supabase": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest", "--read-only", "--project-ref=…"],
    "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" } } } }
```

Three properties of that file are the whole design: the server is launched `--read-only`; the
credential is `${VAR}`-interpolated so **the token is not in the committed file**; and the token is
never a tool argument, so it never appears in a tool-call record.

**The vendor's own guidance disagrees with pointing this at production, and it does not go our way.**
Supabase documents `read_only=true` as executing *"all queries as a read-only Postgres user"* and
`project_ref=<id>` as scoping the server to one project — but the same page says, plainly,
**"Don't connect to production"**, recommending *"the MCP server with a development project, not
production"* ([Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp), accessed
2026-08-14).

That is a real objection to `instrument` as specified and it is not answered by hardening. The
consequence, stated as a decision rather than argued away:

| Option | What `instrument` reads | Cost |
|---|---|---|
| **A — live production, read-only role** | truth, now | against explicit vendor guidance; a runaway read query is a production incident caused by a read |
| **B — read replica** | truth, seconds behind | needs a replica; the recommended answer if one exists |
| **C — nightly export committed to the repo** | truth as of the last dump | `lenses.yml:52` orders the opposite (*"Pull the cohort from the system of record rather than estimating it"*), and every number is as stale as the dump |

**Recommendation: B where a replica exists, C otherwise, A only with the founder's explicit
decision recorded.** This is ROSTER-SIZE **D2** ("live, or committed exports?") receiving evidence
it did not have, and the evidence pushes away from live. Note that C does **not** kill `instrument`
as ROSTER-SIZE D2 assumed: reading a dated export still needs the definitional judgement (§4.6) and
still returns the typed record; what it loses is freshness, not the container. The credential set
shrinks by one under C, which is itself an argument for it.

Also note the auth path has moved: *"personal access token (PAT) was previously required, but is no
longer needed"*, with PATs retained *"for CI environments where dynamic client registration isn't
feasible"* (same page, same date). The `${SUPABASE_ACCESS_TOKEN}` pattern in `evalove/.mcp.json`
still works and is still the right shape for an unattended run; it is no longer the only path.

**How they are kept out of a transcript — four independent layers, in order of strength:**

1. **Mask mode (§2).** The shell sees a placeholder; the proxy substitutes at egress. Strongest,
   and unproven until X1.
2. **The credential is never an agent-visible value.** It is read by the *MCP server process* from
   its own environment. The agent calls `mcp__billing-read__list_subscriptions`; the key is not a
   parameter. This holds today, without E7.
3. **`pre-tool-use.sh:162-164`** blocks `cat/head/grep/base64 … .env` — a read into a transcript is
   permanent plaintext in `~/.claude/projects/*.jsonl`.
4. **No `Bash`** (§4.2), so `printenv` is not reachable.

**Rotation.** Rotating a masked credential is a change to the host environment or the masked file
and **touches no agent file, no `.mcp.json`, and no committed content**. That is the test of whether
the credential was placed correctly: *if rotating it requires a PR, it was in the wrong place.*
Rotation cadence — 90 days routine; immediately on any transcript search hit (§4.17); immediately
when an `instrument` run returns a permission error it should not have had.

**Why these must not co-reside with `operator`'s.** A read key and a write key have different blast
radii and must have different gate tiers. If both live in one container, the read path either
inherits the write path's approval gate (and "what's our MRR" becomes a ceremony nobody performs)
or the write path inherits the read path's absence of one (and a refund is one confused turn away).
The reason this cannot be fixed at a dispatch is stated once and is the whole roster argument: the
`Agent` path accepts no `disallowedTools`.

### 4.4 Network boundary

**Allow-list, and a tight one.** Instrument reaches four named hosts and nothing else.

```jsonc
{
  "allowedDomains": [
    "api.stripe.com",
    "<project-ref>.supabase.co",
    "api.<analytics-vendor>.com",
    "api.<inbox-vendor>.com"
  ],
  "deniedDomains": ["*"],
  "allowManagedDomainsOnly": false,
  "allowAllUnixSockets": false
}
```

An allow-list is correct here for the same reason a deny-list is correct for `sourcer`: instrument's
destinations are **known and finite**, and any destination not on the list is by definition an
exfiltration attempt or a misconfiguration. `deniedDomains: ["*"]` with a four-entry allow-list is
the posture; if the precedence between the two lists is not what that assumes, **X3** (§8) settles
it before the grant is made.

### 4.5 Isolation

**No worktree.** It writes no files. `isolation: none`.

What it needs instead, and each is a real requirement:

- **A sandbox with the §4.4 network allow-list.** This is the containment. Without E7 the grant is
  a label — ROSTER-SIZE says so and it is right.
- **A fresh context per question.** Customer data accumulated across questions is a larger blast
  radius for no benefit.
- **`sandbox.filesystem` read-deny on `~/.aws`, `~/.ssh`, `~/.config`,** and write-deny everywhere
  outside the repo. The binary exposes `denyReadPaths` / `denyWritePaths` (verified §0).

### 4.6 Skills

| Skill | Why |
|---|---|
| `startup-metrics-framework` | the definitions — what counts as MRR, what counts as churn, what window. The characteristic instrument failure is a **definitional** error, not a query error. |
| `sql-optimization-patterns` | it will write read queries against production; a full-table scan on a live DB is a production incident caused by a read |
| `segment-cdp` | event-schema literacy for the analytics side |

Three. All verified in MANIFEST. Deliberately **not** `postgresql` or `supabase-rls-conventions` —
those are for someone designing schemas, and instrument does not.

### 4.7 MCPs — where this container lives or dies

**Needs:** three read-scoped servers.

| Server | Purpose | Available today |
|---|---|---|
| `<billing-read>` | Stripe read (subscriptions, charges, invoices) | **No server exists.** Must be added. |
| `<db-read>` | `@supabase/mcp-server-supabase --read-only` | **Pattern proven** in `~/VibeCoding/evalove/.mcp.json` |
| `<analytics>` | product analytics read | **No server exists** |

**What must exist for the grant to be real — all four, or the grant is decoration:**

1. **`.mcp.json` in this repo**, naming these servers with `${VAR}`-interpolated credentials.
   Today `ls .mcp.json` → absent.
2. **`schema-lint.js:294-304` must stop being a file-existence test.** Today
   `mcpConfigured()` (`:85-93`) returns true if `.mcp.json` merely *exists*. Adding one file
   therefore **flips the lint permissive for `mcpServers:` on every agent at once** — including
   `builder`, which must never hold one. This is ROSTER-SIZE D5 and it is not optional: the
   enabling change trades a working check for a capability. Required replacement:

   ```js
   // schema-lint.js — replace mcpConfigured() with a per-agent allowlist
   const MCP_ALLOWLIST = {
     instrument: ['billing-read', 'db-read', 'analytics'],
     operator:   ['deploy', 'db-admin', 'payments'],
     designer:   ['playwright'],
     reviewer:   ['playwright'],
   };
   // fail if: an agent declares mcpServers and is not a key here;
   //          a declared server is not in its list;
   //          a declared server is not present in .mcp.json OR ~/.claude.json mcpServers.
   ```
   `scripts/check-registration.mjs:165` duplicates `mcpConfigured()` and must be changed in the
   same PR or the two will disagree — the exact failure `classifier.js` was consolidated to prevent.
3. **E7 configured** (§2, §4.4). Non-negotiable: `pre-tool-use.sh` is blind to `mcp__*`.
4. **`bin/warroom:235,237` must stop passing `--dangerously-skip-permissions`**, or every allow/deny
   list in `settings.json` is inert in normal operation.

**The untested link, stated honestly.** ROSTER-SIZE §9 flags that whether an `mcpServers:` grant
reaches a *repo-declared* agent is untested here. The sibling evidence (§0, finding 2) shows grants
reaching repo-declared agents in **two repos that both have a `.mcp.json`**. It does not show what
happens with none, and it does not show whether the grant survives dispatch through the `Agent`
tool as opposed to the main thread. **X2** (§8) is the one-file, one-spawn experiment.

### 4.8 Prompt strategy

**File-based, with a typed return and no narrative surface.** The mechanical anti-sycophancy here
is different from sourcer's and stronger:

> **Instrument's return schema has no free-text field.** It returns
> `{metric, value, as_of, source, query}` and nothing else. There is nowhere to write "MRR is up
> nicely this month." A container that cannot produce a sentence cannot produce a flattering one.

Second mechanism: **`value` is `number | null`, and `null` requires a `blocked_reason` from a closed
enum.** A metric with no system of record returns `null` + `NO_SYSTEM_OF_RECORD` — which is a
founder decision about instrumentation, not a number to estimate. Estimation is not refused by
prose; it is unrepresentable in the schema.

### 4.9 Return contract

```js
const METRIC_SCHEMA = {
  type: 'object',
  required: ['status', 'metrics'],
  additionalProperties: false,
  properties: {
    status: { enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
    metrics: {
      type: 'array',
      items: {
        type: 'object',
        required: ['metric', 'value', 'unit', 'as_of', 'source', 'query', 'row_count'],
        additionalProperties: false,
        properties: {
          metric:    { type: 'string' },                       // 'mrr_usd', 'churn_30d_pct'
          value:     { type: ['number', 'null'] },
          unit:      { enum: ['usd_cents', 'count', 'pct', 'days'] },
          as_of:     { type: 'string' },                       // ISO-8601 timestamp, NOT a date
          source:    { enum: ['stripe', 'supabase', 'analytics', 'inbox'] },
          query:     { type: 'string' },                       // the exact call/SQL — reproducible
          row_count: { type: 'integer' },                      // 0 rows is a finding, not a zero
          blocked_reason: {
            enum: ['NO_SYSTEM_OF_RECORD', 'CREDENTIAL_REFUSED', 'RATE_LIMITED', 'SCHEMA_CHANGED']
          }
        }
      }
    }
  }
};
```

`row_count` earns its place: **a metric computed over zero rows is the single most dangerous
instrument output**, because `SUM()` over nothing is `0` and `0` is a plausible MRR. Separating "the
query returned nothing" from "the answer is zero" is the same discipline Mission Control already
enforces on itself — `InboxView.tsx:7-8`: *"a count of zero is only reported when the directories
were actually looked at, and the probe that looked is printed"*, backed by
`empty.ts:24-31`'s `readable?: boolean`, which exists *"never [to] let `found: false` stand in for
'I could not look' as though it meant 'I looked and found nothing.'"*

`as_of` is a timestamp, not a date, because two runs on the same day against a moving system of
record are different measurements.

### 4.10 Stop and exhaustion

| Ends the run | What happens |
|---|---|
| All requested metrics returned | `COMPLETE` |
| Some returned, some blocked | `PARTIAL` with per-metric `blocked_reason` — **never a partial number** |
| Credential refused | `BLOCKED` + `CREDENTIAL_REFUSED`. **No retry.** A refused credential is either rotated or revoked, and retrying a revoked credential is how you get locked out. |
| Third-party rate limit | `PARTIAL` + `RATE_LIMITED`, with `as_of` on what was gathered |
| Vendor schema changed | `BLOCKED` + `SCHEMA_CHANGED` — the sharpest one, §4.15 |

Instrument's reads are **idempotent by construction** (it holds no write scope), so a run that dies
mid-flight leaves nothing half-done. This is the one place where these three agents differ
categorically: instrument cannot fail dangerously, `operator` can.

### 4.11 Autonomy and escalation

**Autonomous for reads. No gate. This is the point of separating it from `operator`.**

Escalates to `orchestrator` when:
- A number **contradicts a claim already in the ledger.** The orchestrator must record a
  disposition (`claims.js:53`: refresh · deprecate · waive).
- A credential is refused → founder, immediately, via §9's escalation channel. A refused credential
  is either an expiry or a compromise, and both need a human the same day.
- A metric has **no system of record.** This is a founder decision about instrumentation. It is the
  one instrument output that a model must never fill in.

### 4.12 Context on arrival

| Arrives with | Budget |
|---|---|
| Agent file | ~1.5k |
| Three skills, injected pre-turn-1 | ~7k |
| The metric definitions — **must read** `docs/09-metrics/NORTH_STAR.md` | ~1k (templates today) |
| The prior value of each requested metric, from `.claude/ledger/index.json` | ~1k |
| The question | ≤300 tokens |

≈ **11k** on arrival. The prior value matters: an instrument that knows last month's MRR notices a
10× jump, and a 10× jump is nearly always a query bug rather than a business event.

### 4.13 State and memory — where the numbers go so they do not rot silently

**This is the dimension where the existing machinery is already correct and unused.**

`qa-tier-floor.yml` already declares:

```yaml
- pattern: "docs/09-metrics/**"
  tier: full
  resolvers: [claim-source, claim-freshness]
  required_claim_kinds: [external-fact]
  reason: "Numbers that get acted on — an invented metric is unrecoverable, unlike a bad diff"
```

So the flow is: **instrument returns → orchestrator writes a claim into `docs/09-metrics/**` →
`claim-freshness` fails the claim when `valid_until` passes → someone must record refresh,
deprecate or waive** (`claims.js:558-568`, `resolvers.js:79-100`). A metric cannot go stale
silently, because a durable claim with no expiry is refused by the schema and an expired one fails
the lint.

**One design decision, and it is a security decision, not a convenience.** The metric claim's
`verified_by` must be **`command`, not `source`**, and its `evidence.cmd` must re-read a
**committed dated snapshot** — never call the live API:

```
resolvers.js:263-268 — execFileSync('/bin/sh', ['-c', ev.cmd], { env: { ...process.env, … } })
```

`claim-command` runs arbitrary shell **with the full parent environment**, on every PR, on a
GitHub runner. If a metric claim's `cmd` hit the live billing API, then verifying the ledger would
require the production credential in CI, and every PR would make an authenticated call to Stripe
from a shared runner. The snapshot pattern keeps the credential on the founder's machine and makes
verification offline, deterministic and free:

```yaml
- id: c-mrr-2026-08
  assert: "MRR was $X on 2026-08-14"
  kind: external-fact
  scope: project
  verified_by: command
  evidence:
    cmd: "node scripts/metric.mjs read mrr_usd --at 2026-08-14"
    expect_exit: 0
    expect_stdout: "^1234500$"
  valid_until: 2026-09-14
```

`resolvers.js:359-381` (`resolversFor`) makes this work: a `verified_by: command` claim in
`docs/09-metrics/**` runs `claim-command` + `claim-freshness`, and `claim-source` is correctly
skipped because the claim carries no `evidence.url`.

### 4.14 Observability

| Question | Answered by | State |
|---|---|---|
| What did it read? | `query` in every returned metric | **new, by this spec** |
| When? | `as_of` | new |
| Is it still true? | `claim-freshness`, daily via `ledger-sweep.yml` | **exists** |
| Did a number move? | prior value in the ledger index vs. new | new, cheap |
| Live view | Mission Control **SessionsView** | exists |
| **Did a credential get used, and by whom?** | **Nothing.** No MCP call is logged anywhere this repo can read. | **Missing — the real gap** |

**The missing piece, named.** `pre-tool-use.sh` never sees `mcp__*` (`:342-344`), so there is no
per-call record of a credentialed read. The cheapest fix is not an agent: point the MCP servers at
their own vendor-side audit logs (Stripe's API request log, Supabase's `pg_stat_statements` /
audit) and have the §9 checkup script diff "reads instrument claims it made" against "reads the
vendor logged." A discrepancy in either direction is the alarm.

### 4.15 Failure modes and recovery

| Mode | Who notices | Recovery |
|---|---|---|
| **Credential expiry** | instrument → `CREDENTIAL_REFUSED`; nightly checkup (§9) if unattended | Founder rotates on the host. **No agent file changes.** If it does, the credential was in the wrong place. |
| **Third-party rate limit** | `RATE_LIMITED` | Back off; return `PARTIAL` with what was gathered. **Never** switch to an estimate. |
| **Vendor API changes shape** | `SCHEMA_CHANGED` — *if* the change is loud. **A silently renamed field is the dangerous case**: the query succeeds and returns a wrong number. | Two defences, both cheap: `row_count` (a renamed filter usually drops rows to 0) and the prior-value comparison in §4.12. Neither is complete; this is the residual risk of the container and it should be written into the file. |
| **Partial reads** | `PARTIAL`, per-metric | Idempotent; re-run |
| **A read query locks a production table** | Nobody, until customers notice | Mitigation is the credential, not the agent: the DB role has `SELECT` on **named views**, not tables, and a statement timeout set server-side |
| **Exfiltration via a poisoned record** — a customer's support-ticket text contains injection | Nobody | **The containment is the container**: no `WebFetch`, no `Bash`, and a four-host network allow-list. There is nowhere for the data to go. This is why §4.2's denials matter more than its grant. |

### 4.16 Dispatch

- **Spawned by:** `orchestrator` (depth 1), or the §9 checkup script via `claude -p` headless.
- **Concurrency:** **1.** Not a capacity limit — a correctness one. Two instrument runs against a
  moving system of record produce two `as_of` values for one question, and reconciling them is work
  nobody budgeted. One read, one timestamp, one claim.
- **Arguments:** `{agentType: 'instrument', model: 'claude-sonnet-5', effort: 'high', schema: METRIC_SCHEMA}`.

### 4.17 QA of the agent itself — real, because it is credentialed

| Check | Fails when | Where |
|---|---|---|
| `INSTRUMENT_MUST_NOT_HOLD` | `tools:` contains `Bash`, `Write`, `Edit`, `WebFetch`, `WebSearch`, `Agent` | `schema-lint.js`, beside `READ_ONLY_ENGINES:62` |
| `MCP_ALLOWLIST` | declares a server outside `['billing-read','db-read','analytics']` | `schema-lint.js` (§4.7) |
| **Credential-in-transcript canary** | `grep -rl "$CANARY" ~/.claude/projects/` returns any file | a `scripts/check-secrets.mjs`, run in `npm run check` **and** nightly. Place a known canary string in the masked credential set; if it ever appears in a transcript, masking failed. This is the check that makes §2 a control instead of a claim. |
| **`.mcp.json` has no literal secret** | any value in `.mcp.json` matches `sk_live_|sk-|ghp_|eyJ` and is not `${…}` | `check-registration.mjs`, blocking |
| Network posture present | `.claude/settings.json` has no `sandbox.network.allowedDomains` while any agent declares `mcpServers` | `check-registration.mjs`, blocking. **The grant and its containment ship together or not at all.** |

### 4.18 Helpers — prefer the script, and here the script wins most of the time

**A scheduled metric fetch should be a script, not an agent.** `scripts/metric.mjs` — deterministic,
one vendor call per metric, writes a dated snapshot, exits non-zero on a vendor error. It needs no
model: the query for "MRR on date D" does not change between runs.

**Dispatch `instrument` only when the question is new** — a metric with no existing query, a
discrepancy needing a cross-check, an ad-hoc cohort. That is a handful of runs a month against a
nightly script's 30. Getting this wrong is how a credentialed container ends up running unattended
365 times a year for work a cron job does better.

Rule of thumb, written into the file: *if you would write the same query next month, it is a
script.*

### 4.19 Migration

| Step | Change | Risk tier | Blocks on |
|---|---|---|---|
| I0 | **X1** (mask proof, §2.4) and **X2** (MCP grant reach, §8) | — | nothing |
| I1 | Configure E7 in `.claude/settings.json`: `sandbox.enabled`, `filesystem.denyWritePaths`, `network.deniedDomains` baseline, `failIfUnavailable: true` | **irreversible** (`.claude/settings.json`) | X1 |
| I2 | `bin/warroom:235,237` — drop `--dangerously-skip-permissions`, replace with `--permission-mode auto` | **full** (`bin/**`) | I1, or every session breaks |
| I3 | Replace `mcpConfigured()` with `MCP_ALLOWLIST` in `schema-lint.js` **and** `check-registration.mjs:165` | **irreversible** | — |
| I4 | Write `.claude/agents/instrument.md` **with `mcpServers:` omitted** | **irreversible** | I3 |
| I5 | Add `scripts/metric.mjs` + `scripts/check-secrets.mjs` | **full** | — |
| I6 | Add `.mcp.json` with `db-read` only (the proven pattern), `${VAR}` credential | **full** | I1-I4 |
| I7 | Add `mcpServers: [db-read]` to `instrument.md`; run one read; verify the canary check is clean | **irreversible** | I6 |
| I8 | Add `billing-read`, then `analytics`, one at a time, canary check between each | **irreversible** | I7 |

**I4 before I7 is the whole ordering argument.** The file ships with denials that bind and no grant;
the grant lands only after the sandbox that bounds it. Doing it the other way produces security
theatre — ROSTER-SIZE D4, and it is right.

---

## 5. `operator` — act irreversibly on the world

**Does not exist**, and was cut by the prior board on a premise its own §0 disproves
(`AGENT-ARCHITECTURE.md:241` cuts it for *"grants MCP through the same field it declares
non-load-bearing"*, while `AGENT-ARCHITECTURE.md:54` records two sibling agents making real MCP
calls through exactly that field). ROSTER-SIZE §7.2 locates the error; this section specifies the
fix.

This is the sharpest spec in the document because it is the only container whose failure is not
revertible by `git revert`.

### 5.1 Model and effort

| | Value | Why |
|---|---|---|
| **model** | `claude-sonnet-5` | — |
| **effort** | `medium` | **Deliberately the lowest effort in the roster, and it is a safety property, not a saving.** An operator clever enough to reason its way past a failing precondition is worse than one that is not. Its job is to execute a named procedure and report an exit code. Depth here buys creative recovery from a failed deploy, which is precisely the behaviour that must escalate instead. |

If that reasoning is wrong, it is wrong in a checkable way: raise `effort` only if a measured run
shows operator failing on *procedure comprehension* rather than on *preconditions*. Do not raise it
because a run failed.

### 5.2 Permissions

| Capability | State | Enforced by |
|---|---|---|
| `Read, Glob, Grep` | granted | — |
| `Bash` | granted | needed for `vercel`, `supabase`, `gh`. **Bounded only by E7** — `tools:` does not bind `Bash`. |
| `mcpServers: [<deploy>, <db-admin>, <payments>]` | **granted (the grant)** | file-only; unenforced until E7 |
| `Write, Edit` | **denied — and the denial is the container** | **E1**. An operator that can patch code can make its own deploy pass. |
| `WebSearch, WebFetch` | **denied** | **E1**. Production credential + arbitrary web text = prompt injection with a deploy token attached. |
| `Agent` | denied | **E1**. An operator must not spawn a child that inherits its reach and not its gate. |

**`bashCommandClamp` is the one unused primitive that belongs here** (57 occurrences in the binary,
**0** uses in this repo). It is settable on `agent()` and it *refuses the spawn if it can bind
nothing*. An operator dispatched with a clamp scoped to the deploy command form is meaningfully
narrower than one without, and it costs one dispatch-site field. Use it on every operator dispatch,
and note that it is exactly ROSTER-SIZE's own falsifier **F4** — if a clamped `builder` can do the
deploy without a credential landing in its context, `operator` is a lens with a token and the
roster is six. **Run F4 as the first operator dispatch.**

### 5.3 Credentials and secrets

**Credential set — the most dangerous in the system:**

| Credential | Blast radius | Gate tier |
|---|---|---|
| Deploy token (Vercel) | a bad production deploy; revertible in minutes via rollback | `full` for preview, `irreversible` for promote |
| DB admin (Supabase service role / migration credential) | **schema change against rows that exist**; `qa-tier-floor.yml:50-54` already rates this `irreversible`/`block` | `irreversible`, always |
| Live payments key (Stripe secret) | money moves; a created price is visible to customers; a refund is final | `irreversible`, always |
| Secret placement/rotation credential | can grant or revoke every other credential | `irreversible` + founder-present |

**Placement.** Identical mechanism to `instrument` (§4.3): masked host env / MCP server config,
`${VAR}` interpolated, never in a committed file, never a tool argument, never readable
(`pre-tool-use.sh:162-164`).

**One additional rule that is specific to `operator`:** a credential the agent *reads* is written
permanently to `~/.claude/projects/*.jsonl`. Operator must therefore **never be handed a credential
in its dispatch prompt**, not even a test-mode one. The prompt names the *action*; the credential
lives in the server. If a procedure cannot be expressed without a secret in the prompt, that
procedure is not automatable in this runtime — say so and stop.

**Rotation.** Deploy tokens: 90 days. Payments keys: 90 days, and **immediately** after any
`irreversible`-tier run that ended in an unclear state (§5.10). DB admin: per-migration, ideally —
a credential minted for one migration and revoked after is strictly better than a standing one, and
`operator` never needs a standing DB admin credential if the migration flow mints one.

**Why these must not co-reside with `instrument`'s: §4.3.** Why they must not co-reside with
`sourcer`'s: §1. Why they may co-reside *with each other*, for now: they share a gate tier
(`irreversible`) and a single approver (the founder), so splitting adds a file and no boundary. §6.4
states the trigger for splitting.

### 5.4 Network boundary

**The tightest allow-list in the system**, and one asymmetry worth naming: `operator` must reach
production, so `deniedDomains` cannot save it — the allow-list *is* the boundary.

```jsonc
{
  "allowedDomains": [
    "api.vercel.com", "vercel.com",
    "api.stripe.com",
    "<project-ref>.supabase.co", "api.supabase.com",
    "api.github.com"                      // release tags, deployment status
  ],
  "deniedDomains": ["*"],
  "allowAllUnixSockets": false,
  "tlsTerminate": true                    // so the egress proxy can substitute masked credentials
}
```

`tlsTerminate` is required for mask-mode substitution to work at all — the proxy cannot rewrite an
`Authorization` header it cannot read. That is a real trade (the proxy sees the plaintext request)
and it is the correct one here: the alternative is the credential in the agent's context.

### 5.5 Isolation

**`isolation: none`, and this is inverted from every other producing container — deliberately.**

`builder`'s entire containment story is the worktree: work in a throwaway tree, and a bad result is
discarded by deleting a directory. **That story does not transfer at all.** Operator's target is
production. A throwaway worktree offers *zero* containment for an external mutation; worse, it
offers the *appearance* of containment, which is the more dangerous failure.

What operator needs instead:

- **A gate before the act** (§5.11) — the only real containment.
- **A sandbox with the §5.4 allow-list.**
- **Idempotency keys** (§5.10) — containment *after* the act, which is the only kind available once
  the act is irreversible.
- **A recorded pre-state** — what was live before, so rollback has a target. `git rev-parse HEAD` of
  the deployed SHA, the previous deployment id, the previous price id. **Written before the act,
  not after.**

### 5.6 Skills

| Skill | Why |
|---|---|
| `deployment-procedures` | the procedure itself, plus rollback discipline |
| `verification-before-completion` | the single most load-bearing skill for this container: an operator that reports success it did not verify is the nightmare case |
| `secrets-management` | rotation and placement discipline, since it handles the most dangerous credential set |

Three. All verified in MANIFEST. `stripe-integration` and `vercel-deployment` are deliberately
**out** — they are builder's skills, about *writing* integration code. Operator does not write code.

**Blocked on X4 (§8), and this is a live hazard rather than a formality.**
`deployment-procedures/SKILL.md` declares `allowed-tools: Read, Glob, Grep, Bash`. If that field
restricts the active tool set — which is the documented behaviour of the field's name — attaching it
to `operator` would strip every `mcp__*` tool while the skill is loaded, disabling the grant this
container exists for, **silently and only at runtime**. Until X4 answers it, ship `operator` with
`verification-before-completion` and `secrets-management` only (neither declares `allowed-tools`),
and add `deployment-procedures` afterwards. The same check applies to `instrument`: none of its
three skills declares the field today — verified — and `MCP_ALLOWLIST`'s lint should refuse a
credentialed agent that attaches one until X4 resolves.

### 5.7 MCPs

**Needs:** `<deploy>`, `<db-admin>`, `<payments>`. **None exists today.** All four preconditions in
§4.7 apply, plus one more that is specific to operator:

> **A side-effecting MCP tool must be reachable only through a gated dispatch.** There is no
> mechanism for this. `disallowedTools` is MCP-aware and fail-closed on `agent()`, so the
> *workflow* surface can deny `mcp__payments` per call — but the `Agent` tool cannot, and
> `bin/warroom` bypasses permissions entirely. **Therefore: `operator` is dispatched only from
> `ship.js` on the workflow surface, never from the `Agent` tool.** That is a hard rule and it is
> checkable — see §5.17.

### 5.8 Prompt strategy

**File-based, plus a mandatory dispatch-time `purpose` argument.**

The `purpose` string is the load-bearing part and it is not decoration: **it is the only context a
human approver sees.** One sentence, naming what the act accomplishes and why now. An approval
dialog that says "operator wants to run a command" is not an approval; one that says "promote
build a1b2c3 to production to ship the pricing page approved in PR #47" is.

Mechanical non-sycophancy, in order of strength:

| Mechanism | What it forces |
|---|---|
| **`effort: medium`** (§5.1) | Structurally reduces the creative-recovery behaviour that talks itself past a failing precondition |
| **No `Write`/`Edit`** | It cannot make its own deploy pass |
| **`expect_exit` in the return** | Success is an exit code, not an opinion. `resolvers.js:243-295` already implements exactly this shape for claims; reuse it. |
| **The gate** | A model cannot approve its own irreversible act |

The prose rule that must be in the file, because nothing enforces it: **a failed rollback is a P0
escalation, not a retry.** A second automated attempt at a rollback that has already failed once is
how a bad deploy becomes an outage.

### 5.9 Return contract

```js
const OPERATION_SCHEMA = {
  type: 'object',
  required: ['status', 'action', 'purpose', 'idempotency_key', 'pre_state', 'steps', 'post_state'],
  additionalProperties: false,
  properties: {
    status: { enum: ['COMPLETE', 'PARTIAL', 'BLOCKED', 'ROLLED_BACK', 'INDETERMINATE'] },
    action: { enum: ['deploy_preview','promote_production','rollback','apply_migration',
                     'create_price','create_webhook','rotate_secret'] },
    purpose: { type: 'string', minLength: 20 },
    idempotency_key: { type: 'string' },
    pre_state:  { type: 'object' },   // deployment id, git SHA, price id — BEFORE
    post_state: { type: 'object' },   // the same fields, AFTER
    steps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['n', 'cmd', 'exit', 'reversible', 'completed'],
        additionalProperties: false,
        properties: {
          n:          { type: 'integer' },
          cmd:        { type: 'string' },
          exit:       { type: ['integer', 'null'] },  // null = STARTED, OUTCOME UNKNOWN
          reversible: { type: 'boolean' },
          completed:  { type: 'boolean' },
          undo_cmd:   { type: 'string' }
        }
      }
    },
    rollback_available: { type: 'boolean' },
    escalation: { enum: ['none', 'founder', 'p0'] }
  }
};
```

Two fields carry the whole safety design:

- **`status: INDETERMINATE`.** Distinct from `PARTIAL`. `PARTIAL` means "I know which steps
  completed." `INDETERMINATE` means **"I issued a side-effecting call and do not know whether it
  landed."** These require completely different human responses, and collapsing them is how a
  double-charge happens. This is the same `unresolved ≠ pass` invariant `resolvers.js:7-14` already
  pins for every resolver, applied to actions instead of claims.
- **`exit: null`** on a step means *started, outcome unknown*. It is the per-step form of the same
  distinction.

### 5.10 Stop and exhaustion — the sharpest case in the roster

**An operator that dies mid-action is the design problem, not an edge case.**

**Idempotency is mandatory and is not the model's job.** Every side-effecting call carries an
`idempotency_key` derived deterministically from `(action, target, git_sha, date)` — computed by a
script, never invented by the model, so a re-run of the same operation produces the same key:

| Action | Idempotency mechanism |
|---|---|
| Stripe write | Stripe's native `Idempotency-Key` header. Non-negotiable — it is the difference between a retry and a second charge. |
| Deploy | Deploy by immutable git SHA. Deploying the same SHA twice is a no-op. |
| Migration | Migration files are already immutable (`pre-tool-use.sh:317-322`) and a migration runner tracks applied versions. **Never re-run by hand.** |
| Price/webhook creation | Look up by a deterministic `lookup_key` / URL before creating. Create-if-absent, never create. |

**What a half-completed irreversible action looks like, concretely, and what happens:**

> Operator is promoting a production deploy and creating a live price. Step 3 (`stripe prices
> create`) is issued; the process dies before the response is read.
>
> 1. Nothing in the transcript records the outcome — the call was made, the answer was not received.
> 2. **Detection is not the agent's job**, because the agent is gone. The **caller** (`ship.js`)
>    observes a dispatch that returned nothing and treats it as `INDETERMINATE` — *never* as
>    "failed, retry."
> 3. `ship.js` runs a **reconciliation read**, not a retry: query Stripe for a price with that
>    `lookup_key`. Present → the step completed; record `post_state` and continue. Absent → the step
>    did not complete; it is safe to re-issue with the same idempotency key.
> 4. If the reconciliation read itself fails, escalate `p0` to the founder with the
>    `idempotency_key` and the exact query to run by hand. **The system stops.** It does not guess.
>
> **The rule, and it is the one sentence to carry out of this section: a dispatch that returns
> nothing is `INDETERMINATE`, and `INDETERMINATE` is reconciled by a read, never by a retry.**

This is why the reconciliation read belongs in `ship.js` — deterministic committed code — and not in
the operator's prompt. The agent that needs to reconcile is by definition the agent that is not
running.

**Nothing in the field solves this, and that is worth stating rather than assuming we missed it.**
The two best-resourced implementations both stop short at exactly the same place:

- **Cloudflare Agents SDK** persists scheduled work properly — *"Scheduled tasks survive agent
  restarts and are persisted to SQLite"*, woken by Durable Object alarms — and documents
  `schedule()`, `scheduleEvery()`, `getScheduleById()`, `listSchedules()` and `cancelSchedule()`
  ([Cloudflare Agents scheduling docs](https://developers.cloudflare.com/agents/api-reference/schedule-tasks/),
  accessed 2026-08-14). It does not document what happens to a task that dies **mid-execution**.
  Durability of the *schedule* is not durability of the *effect*.
- **QM** is explicit that its own controls do not close it: *"Classifier approval is not
  authorization and cannot guarantee prompt-injection resistance"*, and it *"does not promise that
  data cannot leak"* (`SECURITY.md`, accessed 2026-08-14).

So the `INDETERMINATE` state and the reconciliation read are **not inherited conventions** — they
are this document's own answer to a problem the field has left open, and they should be treated as
the least-proven part of the design. What *is* inherited is the shape of the persistence layer:
a schedule stored in a durable table with list and cancel operations, not an in-memory timer.

### 5.11 Autonomy and escalation — the founder's variable-autonomy dial

`gate: outbound-approval` exists at `launch-landing-page.yml:39` and in `schema-lint.js:623`'s
`GATES` list, and **has no consumer anywhere** (verified: those two plus documentation are the only
hits in the repo). This section gives it one.

**Three autonomy bands, keyed to `classifier.js`'s tier so the dial is data, not prose:**

| Band | Actions | Gate | Rationale |
|---|---|---|---|
| **A — alone** | Deploy to **preview**; read deployment status; run smoke tests against preview; roll back a preview; **read** live Stripe/Supabase state | none | Every one is reversible by deleting a preview. Nothing customer-visible. Requiring approval here means nobody ships. |
| **B — approve, non-blocking** | **Promote to production**; create a *test-mode* price; create a webhook endpoint; tag a release | `gate: outbound-approval`. **Queue the request, continue against the local simulation, and approve in bulk.** | Reversible within minutes (rollback exists) but customer-visible. Non-blocking is what makes autonomy usable at 02:00. |
| **C — never automated** | Apply a migration to a DB **with customer rows**; create/modify a **live** price; issue a refund; rotate a production secret; delete any resource | `gate: founder-approval`, **blocking, founder present.** Two-key: approval names the exact `idempotency_key`. | `git revert` does not undo these. `qa-tier-floor.yml:50-54, 94-105` already rates every one `irreversible`/`block`. |

**Band membership is computed, never declared by the operator.** `node scripts/classify.mjs
<paths...>` is the single implementation (`scripts/lib/classifier.js`); anything it rates
`irreversible` is band C by definition. An operator that can choose its own band is not gated.

**Band B is not invented here — it is Cloudflare's Gatekeeper design, arrived at independently.**
Cloudflare OS, open-sourced from real internal use, describes exactly this for side-effecting
actions: the Gatekeeper *"will **simulate** the outcome locally, allowing the agent to proceed and
queue up more actions"*, after which the human can *"approve or reject the actions in bulk, or
one-by-one"* ([cloudflare/cloudflare-os](https://github.com/cloudflare/cloudflare-os), accessed
2026-08-14). ROSTER-SIZE §4.7 reached the same three words — *queue, continue against a local
simulation, approve in bulk* — without citing it. Two systems converging on non-blocking approval
for reversible-but-visible acts is the strongest available evidence that the middle band is real
and not a compromise.

**The band dial must be tighten-only, and that rule is also borrowed.** QM ships three security
postures — *Strict* (every harness tool call pauses for human approval, except two no-effect turn
enders), *Auto* (default; a classifier screens provenance-labelled external data and tool results
before they reach the model), and *Dangerous* (no screening, no pauses) — under one composition
rule: **"An org picks one security posture, which narrower scopes can only tighten"**
([yc-software/qm](https://github.com/yc-software/qm), accessed 2026-08-14). Adopt the rule
verbatim: a playbook, a dispatch or a brief may raise an action's band, never lower it. Without it
the autonomy dial becomes a way to route around the gate, which is the failure the gate exists to
prevent. ROSTER-SIZE §5.2 already lists "a tighten-only composition rule" as an owed script-level
upgrade; QM is the existence proof that it is shippable.

**How a gate is actually served, since there is no approval mechanism today:**

1. `ship.js` calls `scripts/escalate.mjs`, which writes a request file into
   `~/.agentvibe/messages/` — **the directory Mission Control's InboxView already reads**
   (`mission-control/server/collectors/empty.ts:307`;
   `client/src/views/InboxView.tsx:1-8`: *"pending approvals, escalations and binary pings … nothing
   in this repository has ever written into `~/.<project>/messages/`"*).
2. It fires a local notification (`osascript -e 'display notification …'`).
3. Band B continues against the simulation. Band C blocks.
4. The founder approves by writing an approval file (Mission Control has **zero** HTTP write routes
   by design — verified: no `.post(` anywhere under `mission-control/server/`). Approval is a file
   the founder creates, which is auditable and needs no server.

**A necessary asymmetry, and it is a feature.** `pre-tool-use.sh:302-305` refuses any agent `Write`
outside the project root — which is why the prior board's `arbiter` was cut (*"measured exit 2,
BLOCKED"*). `~/.agentvibe/messages/` is outside the root. So **the escalation writer must be a
committed script invoked over `Bash`, not an agent `Write`.** The hook's Bash arm has no
path-containment rule, so `node scripts/escalate.mjs` passes. The result: the escalation channel is
reviewed code, not an agent turn — which is exactly what you want of the channel that asks a human
for permission.

### 5.12 Context on arrival

| Arrives with | Budget |
|---|---|
| Agent file | ~2k |
| Three skills | ~8k |
| The **procedure**, named and pre-written — not invented | ~1k |
| `pre_state` (current deployment id, live SHA, current price ids) — **read before the brief is written** | ~500 |
| `purpose`, `idempotency_key`, band | ~200 |

≈ **12k**, and deliberately narrow. **Operator must not arrive with the codebase in context.** It is
not deciding what to ship; it is executing a named procedure against a named artifact. Context it
does not need is context that lets it improvise.

### 5.13 State and memory

Writes **nothing to the repo** (no `Write`/`Edit`). What survives is written by `ship.js`:

- **A deployment record** — `{action, purpose, idempotency_key, pre_state, post_state, approved_by,
  at}`, appended to `docs/09-metrics/deployments.jsonl` or an equivalent committed log. This is the
  audit trail and it must be produced by the caller, not the actor — a record the actor writes is a
  record the actor can shape.
- **A claim** for anything durable: *"production runs SHA a1b2c3"*, `verified_by: command`,
  `evidence.cmd` a script that queries the live deployment, `valid_until` short (7 days — production
  moves). `claim-freshness` then makes a stale belief about production fail loudly.
- **`pre_state`, before the act**, so rollback has a target even if the run dies.

### 5.14 Observability — the nightmare case

**An operator acting on the world unobserved is the failure this whole spec exists to prevent.**
Mapped honestly against what Mission Control actually has:

| Need | Mission Control today | Verdict |
|---|---|---|
| Is an operator running right now? | **SessionsView**, **FleetView** | **Exists** |
| What is it about to do? | — | **Missing.** The `purpose` + band + `idempotency_key` need a view. |
| What is waiting for me to approve? | **InboxView** — built for exactly this, reading `~/.<project>/messages/`, **empty because nothing writes there** | **Exists, unfed.** §5.11 feeds it. This is the highest-value wiring in the document: a built view, an unwritten producer. |
| What did it do, historically? | — | **Missing.** `docs/09-metrics/deployments.jsonl` (§5.13) plus a collector. |
| Did a credential get used? | — | **Missing** — same gap as §4.14. Vendor-side audit logs are the only source. |
| Did it act **without** approval? | — | **Missing, and it is the one that matters.** The check: every entry in `deployments.jsonl` with band B or C must have a matching approval file. A run without one is an alarm, and it is a five-line script. |

**Live is not enough.** The founder is asleep during the run that matters. The after-the-fact
record plus the unapproved-action check are what make an unattended operator acceptable at all.

**QM pairs its credential model with an audit claim in the same sentence, and the pairing is the
convention:** *"the agent acts as the person it's working for, with their credentials and
permissions, and **everything it does is audited**"* (accessed 2026-08-14). A credential grant and
an audit trail arrive together or the grant is not defensible. Ours is `deployments.jsonl` plus the
unapproved-action check; QM's is per-scope and per-tool-call. The gap in ours is the one named in
the table above — **no per-call record of an MCP invocation exists anywhere this repo can read** —
and until vendor-side audit logs are wired in (§4.14), our audit covers what `ship.js` wrote, not
what the agent did.

### 5.15 Failure modes and recovery

| Mode | Who notices | Recovery |
|---|---|---|
| **Deploy succeeds, app is broken** | smoke tests in `ship.js` — **exit codes the state machine will not advance past**, never a model's opinion | Automatic rollback to `pre_state.deployment_id`. Band A. |
| **Rollback fails** | `ship.js` | **P0 to the founder. No retry.** The one hard rule of §5.8. |
| **Credential expiry mid-deploy** | operator → `BLOCKED` | Rotate on the host. Re-run: idempotent by SHA. |
| **Third-party rate limit** | vendor 429 | Back off with jitter, max 3, then `BLOCKED`. **Never** re-issue a side-effecting call without its idempotency key. |
| **Partial write** | caller sees an empty return → `INDETERMINATE` | Reconciliation read (§5.10). Never a retry. |
| **Vendor API changes shape** | non-zero exit, or a parse failure | `BLOCKED`. **The dangerous variant**: the call succeeds with different semantics (e.g. a default changes from test to live). Defence: `post_state` is *read back* after every act and compared to what was intended. A `post_state` that does not match intent is `INDETERMINATE`, not `COMPLETE`. |
| **Operator improvises past a precondition** | Nobody, in-run | `effort: medium` (§5.1), no `Write`, and `ship.js` gating on exit codes rather than on the operator's narrative |
| **Approval replayed** | Nobody | An approval file names one `idempotency_key` and is consumed once. `ship.js` refuses an approval whose key does not match, and refuses a key already present in `deployments.jsonl`. |

### 5.16 Dispatch

- **Spawned by:** `ship.js` **only** — on the workflow surface, where `disallowedTools`,
  `bashCommandClamp` and `schema` are available. **Never from the `Agent` tool**, which offers none
  of them (§5.7).
- **Depth:** 1, below the orchestrator, and it spawns nothing.
- **Concurrency: 1, globally.** Two operators acting on one production environment is a race with
  irreversible stakes. Enforce with a lockfile in `ship.js`; a second dispatch while the lock is
  held is refused, not queued.
- **Arguments:** `{agentType: 'operator', model: 'claude-sonnet-5', effort: 'medium',
  schema: OPERATION_SCHEMA, disallowedTools: [<every mcp server not needed for this action>],
  bashCommandClamp: <the deploy command form>}`.

  The per-action `disallowedTools` is what makes one file safe for three credential classes: a
  `deploy_preview` dispatch denies `mcp__payments` and `mcp__db-admin` at the call site. **This is
  the argument against splitting `operator` prematurely** — the split is only needed if this
  per-dispatch denial turns out not to work, which is testable.

### 5.17 QA of the agent itself

| Check | Fails when | Where |
|---|---|---|
| `OPERATOR_MUST_NOT_HOLD` | `tools:` contains `Write`, `Edit`, `NotebookEdit`, `WebFetch`, `WebSearch`, `Agent` | `schema-lint.js` |
| `MCP_ALLOWLIST` | declares a server outside its three | `schema-lint.js` |
| **Dispatch-surface check** | any `agentType: 'operator'` appears outside `.claude/workflows/ship.js` | grep assertion in `check-registration.mjs`, **blocking** |
| **Gate-consumer check** | a playbook stage declares `gate: outbound-approval` and no code path calls `scripts/escalate.mjs` | `check-registration.mjs`. **This is the check that stops a gate from being decoration a second time.** |
| **Unapproved-action check** | a band B/C entry in `deployments.jsonl` has no matching consumed approval | `scripts/check-approvals.mjs`, in `npm run check` **and** nightly (§9) |
| **Idempotency check** | any `OPERATION_SCHEMA` step with `reversible: false` and no `idempotency_key` | unit test on `ship.js` |
| Credential canary | as §4.17 | `scripts/check-secrets.mjs` |

`.claude/agents/**` is `tier: irreversible, enforcement: block` (`qa-tier-floor.yml:70-74`), so every
edit to `operator.md` already requires the full pipeline plus founder sign-off. That is correct and
needs no addition.

### 5.18 Helpers — and here the script does most of the job

**Most of what people imagine `operator` doing is `ship.js`, not a model.**

| Job | Owner | Why |
|---|---|---|
| preview → smoke → gate → promote → verify → rollback state machine | **`ship.js`** | It is a state machine over exit codes. A model in the loop can only make it less reliable. |
| Idempotency key derivation | **script** | Must be deterministic |
| Reconciliation read after an indeterminate step | **`ship.js`** | The agent is gone by definition (§5.10) |
| Approval file write / read / consume | **`scripts/escalate.mjs`** | Must work when no agent is running |
| Rollback | **script**, triggered by a failed smoke exit code | Rollback must not require a model to be alive |
| **Choosing which procedure applies to this situation** | **`operator`** | The residue, and the only part that is genuinely judgement |
| **Reading an unfamiliar vendor error and deciding whether it is retryable** | **`operator`** | The other residue |

If `ship.js` is written well, `operator` is dispatched for a handful of steps in a deploy and
nothing else. **That is the intended outcome, not a diminished one.** The container exists so that
those two judgement calls happen somewhere that holds the credential and cannot edit the code.

### 5.19 Migration

| Step | Change | Risk tier | Blocks on |
|---|---|---|---|
| O0 | **F4** — run one real deploy twice: once via a clamped `builder` dispatch (`bashCommandClamp` + `disallowedTools`), once via an `operator` file. If the clamped builder completes with no credential in its context, **`operator` is a lens with a token and the roster is six.** | — | I1-I2 (E7) |
| O1 | Write `.claude/workflows/ship.js` with **no `operator` dispatch at all** — every step a script, gate stubbed to always-deny | **full** | — |
| O2 | `scripts/escalate.mjs` + `scripts/check-approvals.mjs`; wire `gate: outbound-approval` to the InboxView directory | **full** | O1 |
| O3 | Prove the whole chain against a **preview deploy only**, no credential beyond a deploy token | **full** | O2 |
| O4 | Write `.claude/agents/operator.md` **with `mcpServers:` omitted**; dispatch it for band A only, via `ship.js` | **irreversible** | O3, I1-I4 |
| O5 | Add `<deploy>` MCP; band B (promote) behind a **blocking** gate for the first ten runs, non-blocking thereafter | **irreversible** | O4 |
| O6 | Add `<db-admin>`, migrations only, band C, founder present, one migration | **irreversible** | O5 + ten clean band-B runs |
| O7 | Add `<payments>`, **test mode only**, for at least one full month before any live key is considered | **irreversible** | O6 |

**O1 before O4 is the ordering that matters.** Build the state machine with no agent in it, prove
it, then add the agent for the two judgement steps. Doing it the other way produces an agent that
improvises a deploy pipeline, which is the thing this container exists to prevent.

---

## 6. Cross-cutting: the credential inventory and the co-residence matrix

### 6.1 Inventory

| # | Credential | Holder | Scope | Storage | Rotation | Blast radius |
|---|---|---|---|---|---|---|
| 1 | — | `sourcer` | **none** | — | — | none |
| 2 | Stripe restricted (read) | `instrument` | read: subscriptions, charges, invoices, customers | masked host env | 90d | customer data disclosure |
| 3 | DB read role | `instrument` | `SELECT` on named views | MCP server env, `${VAR}` | 90d | customer data disclosure |
| 4 | Analytics read key | `instrument` | read one project | masked host env | 90d | behavioural data disclosure |
| 5 | Inbox read token | `instrument` | read + search, no send | masked host env | 90d | correspondence disclosure |
| 6 | Deploy token | `operator` | one project | masked host env | 90d | bad production deploy (revertible) |
| 7 | DB admin | `operator` | migrations | per-migration if possible | per use | **schema change on live rows (irreversible)** |
| 8 | Stripe secret (live) | `operator` | writes | masked host env | 90d | **money moves (irreversible)** |

### 6.2 The co-residence matrix

|  | sourcer | instrument | operator | builder |
|---|---|---|---|---|
| **sourcer** | — | **never** (§1) | **never** (§1) | never (web egress on every code dispatch) |
| **instrument** | never | — | **never** (§1) | never (credential on every code dispatch) |
| **operator** | never | never | — | **never** (§1: can make its own deploy pass) |

Every cell is `never`. That is not four containers by preference; it is four by the absence of a
per-dispatch grant.

### 6.3 The single sentence that justifies all of it

> A denial you forget to write fails **open**. A grant you did not make fails **closed**. There is
> no additive grant on any dispatch surface in this runtime. Therefore a capability boundary is a
> file, and the number of files is the number of grant-classes that must not co-reside.

### 6.4 When `operator` splits into two — as a testable trigger, not a feeling

Split when **any** of these becomes true:

1. A per-dispatch `disallowedTools: ['mcp__payments']` on an `operator` dispatch is measured **not
   to bind** (§5.16 depends on it binding).
2. The payments credential and the deploy credential acquire **different approvers** (e.g. a
   co-founder can approve deploys but not refunds).
3. Deploys become high-frequency enough that band B is granted standing approval, while payments
   stay band C — at which point one file is carrying two autonomy bands, and the band is the thing
   the file is for.

Until one of those is true, splitting adds a file and no boundary.

### 6.5 Does anyone else separate read-credentials from write-credentials? — no, and it matters

The `instrument`/`operator` split is the load-bearing half of the seven-container number. It was
worth checking whether the field agrees. **It does not, and the finding is reported here rather
than buried, because it is the strongest available objection to this document.**

| System | Decomposes credentials by | Separates read from write? | Accessed |
|---|---|---|---|
| Cloudflare OS | **the external resource** — 11 Gatekeepers, one per service | **No.** One Gatekeeper per service holds that service's OAuth credential, whatever the verb. Read/write posture is not a boundary anywhere in the design. | 2026-08-14 |
| QM | **the principal** — per person, per room | **No.** *"the agent acts as the person it's working for, with their credentials and permissions"* — the agent inherits a human's full authority, read and write together. | 2026-08-14 |
| Cloudflare Agents SDK | **the session** | **No.** Not mentioned in the API reference. | 2026-08-14 |
| BMAD · Spec Kit · Agent OS · superpowers · anthropics/skills | nothing — no capability field exists | **N/A.** None has a field that expresses a credential at all. | ROSTER-SIZE §3 |

**Nobody separates them. Two systems that decompose credentials at all decompose by *resource* or
by *principal*, and both are defensible choices we did not make.**

**Where the separation does exist is one level down — at the MCP server — and there it binds harder
than any harness rule could.** Supabase's server takes `read_only=true`, which *"executes all
queries as a read-only Postgres user"* — enforced by a **database role**, not by a tool list or a
prompt. Stripe restricted keys are the same shape. This reframes the argument, and the reframing is
an improvement:

> **The file separates the *contexts*. The server separates the *authority*. Neither is sufficient
> alone.** A read-only server in a container that also holds a write server still means one context
> holds write authority during a read task — which is the §1 hazard exactly. A separate container
> whose servers are not scoped means a read agent with a write credential, which the vendor's own
> flag would have prevented for free.

So the honest position: **the field's silence is a genuine weakening of the read/write argument, and
the vendor flags are a genuine strengthening of it.** Concretely, three obligations follow, all
cheap and all previously implicit:

1. **Every `instrument` server must be launched read-scoped at the server** — `--read-only`,
   restricted key, `SELECT`-only role. The container is the second line, never the first.
2. **`MCP_ALLOWLIST` (§4.7) must record the scope, not just the name** — `instrument: ['db-read
   (--read-only)', …]` — and `schema-lint.js` must fail an `instrument` server declared without a
   read-scoping flag. A server named `db-read` that was launched writable is the exact defect class
   this repo keeps catching: a name asserting a property nothing checks.
3. **If a vendor offers no read-scoped mode, `instrument` does not get that server.** It reads an
   export instead (§4.3 option C). No exceptions, because the container alone cannot make an
   unscoped credential read-only.

**Does this collapse `instrument` into `operator`?** No — but it narrows the gap, and the narrowing
should be recorded. With server-side scoping in place, the residual justification for two files is
the co-residence hazard in §1 (a merged container applies one gate tier to two very different
frequencies of work) plus the absence of `disallowedTools` on the `Agent` path. Both are real and
both are measured. Neither is as strong as "the field does this and it works", and nobody in the
field does this.

---

## 7. The network boundary, all three side by side

| | `sourcer` | `instrument` | `operator` |
|---|---|---|---|
| Posture | **deny-list** | **allow-list** | **allow-list** |
| Reach | the public web, minus systems of record | 4 named hosts | 5 named hosts |
| Denies | stripe · supabase · vercel · github · slack · `169.254.169.254` | `*` | `*` |
| `tlsTerminate` | no | no | **yes** (mask substitution, §5.4) |
| Why the posture | destinations unknowable in advance; the list exists to make one thing impossible | destinations finite and known; anything else is exfiltration | same, plus the credential must be substituted at egress |

The complementarity is the design: **every domain on `sourcer`'s deny-list is on `instrument`'s or
`operator`'s allow-list, and nothing is on both an allow-list and the public-web container.**

---

## 8. The MCP grant — what must exist, and the experiment that settles it

**What must be true for a grant to be real** (all four; three exist nowhere today):

1. `.mcp.json` in this repo, or `mcpServers` in `.claude/settings.json` — `mcpConfigured()`
   (`schema-lint.js:85-93`) tests for exactly this and nothing more.
2. **A per-agent allowlist replacing that test** (§4.7). Without it, adding `.mcp.json` flips the
   lint permissive for every agent at once, including `builder`.
3. E7 configured, or the grant is unguarded — `pre-tool-use.sh:342-344` allows every `mcp__*` call.
4. `bin/warroom` not passing `--dangerously-skip-permissions`.

**The untested link.** Sibling evidence proves an `mcpServers:` grant reaches a repo-declared agent
in a repo that *has* a `.mcp.json` (`adamos`, `evalove` — both verified to have one, both making
calls to servers that file does not name, i.e. resolving from user scope). Untested here: a repo
with **no** `.mcp.json`, and dispatch through the **`Agent` tool** rather than the main thread.

> **X2 — one file, one spawn.**
> 1. Create `.claude/agents/probe-mcp.md`: minimal valid frontmatter,
>    `tools: [Read]`, `mcpServers: [playwright]` (playwright is live at user scope — verified in
>    `~/.claude.json`).
> 2. Add a one-server `.mcp.json` (any harmless server) so `mcpConfigured()` passes.
> 3. Spawn exactly once: `Agent({subagent_type: 'probe-mcp', prompt: 'Call
>    mcp__playwright__browser_navigate on about:blank. If that tool is not available to you, say
>    NOT_AVAILABLE and list the tool names you do have.'})`.
> 4. **Result A** — the call succeeds → the grant reaches a repo-declared agent through the `Agent`
>    path, and `instrument`/`operator` are buildable as specified.
>    **Result B** — `NOT_AVAILABLE` → the grant does not survive `Agent` dispatch, and **both
>    containers must be dispatched from the workflow surface or not at all** (which `operator`
>    already requires for a different reason, §5.7).
> 5. Delete `probe-mcp.md`. One file, one spawn, ~5 minutes.

> **X3 — allow/deny precedence.** With `sandbox.network.allowedDomains: ["example.com"]` and
> `deniedDomains: ["*"]`, does a fetch to `example.com` succeed? §4.4 and §5.4 both assume yes. If
> the answer is no, both allow-lists must be expressed differently. One session, one `curl`.

> **X4 — does a skill's `allowed-tools` amputate the MCP grant?** Eight of our 134 skills carry
> `allowed-tools:` (verified: `database-design`, `deployment-procedures`, `impeccable`,
> `nextjs-best-practices`, `pitch-deck-visuals`, `react-patterns`, `tdd-workflow`,
> `tailwind-patterns`). **`deployment-procedures` — the skill this document assigns to `operator`
> — declares `allowed-tools: Read, Glob, Grep, Bash`.** If that field *restricts* the active tool
> set, attaching it to `operator` may strip every `mcp__*` tool for the duration of the skill,
> silently disabling the grant the container exists for. Test: attach it to the X2 probe agent and
> re-run. **Until X4 is answered, do not attach an `allowed-tools`-bearing skill to a
> credentialed agent** — substitute `verification-before-completion` and `secrets-management`,
> neither of which declares the field.

**X1 through X4 together cost about an hour and gate every credentialed step in §10.**

### 8.1 How the field grants a credential to a specific agent, and where we cannot follow

The founder's question — *does anyone grant an MCP server or a credential to one specific agent?* —
has three different answers in the field, and none of them is our mechanism.

| System | Grant unit | How the credential arrives | Accessed |
|---|---|---|---|
| **Cloudflare OS** | **the external resource** — one "Gatekeeper" per service (GitHub, Google, Cloudflare, Supabase, Notion, Confluence, Email Workers, Home Assistant, Slack, Spotify, ZoomInfo) | Gatekeepers are *"like supercharged MCP servers"* that *"handle authorization (e.g. via OAuth)"*; *"Many Gatekeepers require configuration … including obtaining OAuth client credentials for each service."* | 2026-08-14 |
| **Cloudflare Agents SDK** | **the session** | *"When a user authenticates to your MCP server, their identity information and tokens are made available through the `props` parameter"*; *"each client session is backed by an instance of the McpAgent class"* and on reconnect *"they will start a new session, and the state will be reset."* | 2026-08-14 |
| **QM** | **the principal and the room** | *"Each person and each room has its own scoped memory, files, **keychain view**, permissions, crons, web apps, and durable sandbox"*; *"the agent acts as the person it's working for, with their credentials and permissions, and everything it does is audited."* | 2026-08-14 |
| **Agentvibe (this runtime)** | **the agent file** | `mcpServers:` frontmatter, resolving from user scope. No dispatch-time grant exists. | measured, §0 |

**Cloudflare OS's model is the closest to ours and the most instructive.** Its default is the one we
want and cannot currently express: *"Each agent, and each Gadget, by default has access to
nothing"*, and *"you must **introduce** each agent (or Gadget) to any particular resources you want
it to access."* Deny-by-default plus an explicit per-resource introduction is precisely the
grant-class argument in §1, shipped. The difference is that Cloudflare can revoke — resources arrive
as typed bindings — while we can only choose which file the dispatcher names.

**One Cloudflare OS convention is directly adoptable today and costs nothing:** *"An agent can also
request an introduction to a resource it thinks it needs, which you can then provide or deny."* Make
"I need a capability this container does not hold" a **first-class return value**, not a failure. Add
`BLOCKED_NEEDS_CAPABILITY` with a `capability_requested` field to all three return schemas. Every
such return is a candidate grant, logged — which is exactly counter #1 of ROSTER-SIZE §8's
"cheapest experiment" ("every point where an agent needed a capability no container held"), obtained
as a by-product of normal operation rather than by instrumenting a special run.

**Where the field disagrees with our measurements, our measurements win — but the disagreement is
real and is against us.** Cloudflare grants MCP *per session, from a user's OAuth identity*; QM
grants it *per principal, through a keychain view*. Both are better than a static file-level grant,
because both can be revoked without editing a definition, and both bind the credential to a human
who can be held responsible. Our runtime offers neither: `strings -a … | grep -c 'allowedTools?:'`
is 0 and there is no `mcpServers` option on `agent()`. **The seven-container roster is a workaround
for a runtime limitation, not an architecture anyone would choose given Cloudflare's primitives** —
and ROSTER-SIZE's falsifier F1 says so in its own terms. Recording it here so nobody later mistakes
the workaround for the insight.

---

## 9. The layer with no owner — scheduled work and checkups

ROSTER-SIZE §6 finds this layer has **no owner at all**. Verified independently: `crontab -l` →
*"no crontab for adamks"*; no launchd plist for this project; one Actions schedule
(`.github/workflows/ledger-sweep.yml`, `cron: '20 6 * * *'`) running with `permissions: contents:
read` and no Claude session — *"it cannot open an issue, notify, or start work"*, and its own header
admits the escalation is the job status.

### 9.1 The decision

> **Scheduled work belongs to a SCRIPT plus a real clock. No agent owns this layer.**
> `instrument` is a **callee** of the clock, never its owner. `operator` never runs on a timer
> without a human-approved window. The `orchestrator` is not involved, because the orchestrator's
> defining property is that it ends a turn on a human, and the whole point of a scheduled run is
> that no human is there.

**Why not `instrument`.** Its own §4.18 rule settles it: *if you would write the same query next
month, it is a script.* A nightly metrics fetch is the same query every night. Giving a credentialed
container 365 unattended runs a year to do work a cron job does deterministically is the largest
avoidable increase in credential exposure in this design.

**Why not `operator`.** A timer is not an approver. Band B and C both require a human (§5.11), and a
scheduled band-A action is a deployment nobody asked for.

**Why not the orchestrator.** It cannot be started by a clock — no clock in this repo can launch a
Claude session, which is exactly why `steward` was cut by the prior board.

**The field agrees, and one system has shipped exactly this.** QM — running YC's own accounting,
legal and events — states *"Crons and watches run work while nobody's watching"* and that crons are
**"scope-owned"**: they belong to a person or a room, alongside that scope's memory, files, keychain
view, permissions and sandbox — **not to an agent**
([yc-software/qm](https://github.com/yc-software/qm), accessed 2026-08-14). That is the same answer
reached above by a different route: the clock belongs to the *container of state*, and agents are
what it calls. Cloudflare's Agents SDK is the dissenting design — scheduling is a method **on** the
agent (`this.schedule()`) — but its agents are Durable Objects that hibernate and wake, so "the
agent" there is a persistent addressable object, not a model context. **Neither system puts the
clock inside a model's turn**, which is the only thing the in-session `CronCreate` could offer here.

### 9.2 The clock, named

**`launchd`, on the founder's machine.** Not cron (deprecated on macOS and it does not run for a
sleeping laptop's missed window), not the in-session `CronCreate` (session-only, in-memory,
idle-REPL-only, 7-day expiry per ROSTER-SIZE §6), and not GitHub Actions **as the primary** — because
the credentials and the repo live on the founder's machine and the runner has neither.

```xml
<!-- ~/Library/LaunchAgents/com.agentvibe.checkup.plist -->
<key>StartCalendarInterval</key> <dict><key>Hour</key><integer>7</integer>
                                      <key>Minute</key><integer>30</integer></dict>
<key>ProgramArguments</key>      <array><string>/bin/zsh</string><string>-lc</string>
  <string>cd /Users/adamks/VibeCoding/agentvibe && node scripts/checkup.mjs</string></array>
```

`launchd` runs a missed job when the machine wakes, which cron does not. **Keep `ledger-sweep.yml`**
as the independent second clock: it is the one that fires when the laptop is shut for a week, and
two clocks that fail for different reasons is the point.

### 9.3 What runs — deterministic first, agent only on residue

`scripts/checkup.mjs`, in order, **no model call**:

1. `node scripts/ledger.mjs verify` — expiring claims, dead sources, lapsed waivers
2. `node scripts/metric.mjs read <each metric>` — the nightly snapshot (§4.18)
3. `node scripts/check-approvals.mjs` — any band B/C action without a consumed approval (§5.17)
4. `node scripts/check-secrets.mjs` — the credential canary across transcripts (§4.17)
5. A production liveness probe — the shape `resolvers.js:243-295` already implements: run a command,
   assert exit code and a stdout regex. Point it at production.

**Only when a check cannot decide** does the script escalate to a model, and it does so headlessly
and narrowly: `claude -p --agents instrument` with one question and a schema. That is the escalation
from script to agent — the exception, not the schedule.

### 9.4 How a scheduled run reaches a human who has walked away

Today: *"a run that reaches `gate: founder-approval` at 02:14 exits into silence nothing detects."*
Three channels, in order, all from `scripts/escalate.mjs`:

| Channel | Reaches | Works when |
|---|---|---|
| **Message file** in `~/.agentvibe/messages/` | Mission Control **InboxView** — a built view with no producer (`empty.ts:307`, `InboxView.tsx:1-8`) | always; survives reboot; is the audit record |
| **Local notification** (`osascript -e 'display notification'`) | the founder, if awake | machine on and unlocked |
| **`ledger-sweep.yml` failing** | GitHub's own scheduled-workflow failure notification | laptop off for days |

The third channel's exact delivery behaviour is **unverified** — GitHub's notification rules for
failed scheduled workflows should be confirmed before relying on it as the last resort. It is
listed because it is the only channel that survives the machine being off, not because it is proven.

**The asymmetry from §5.11 applies to all of this**: `~/.agentvibe/messages/` is outside the project
root, so an agent cannot `Write` there (`pre-tool-use.sh:302-305`), but a committed script invoked
over `Bash` can. The escalation channel is therefore reviewed code by construction.

### 9.5 What this leaves unowned, honestly

**Intake from a non-human trigger** — a webhook, an inbound email, a failing production alert
starting work — is still unowned, and `scripts/checkup.mjs` does not fix it. It needs a listener
process, which is a daemon, which is a decision the founder has not made. Named, not solved.

**It has a name in the field, which is worth adopting even before it is built.** QM calls it a
**watch**, and treats it as a peer of a cron rather than a variant of one — *"Crons **and watches**
run work while nobody's watching"* — and QM was *"eventually extended to support things like crons,
and webhook triggers"* ([qm.ycombinator.com](https://qm.ycombinator.com/), accessed 2026-08-14).
Cloudflare's SDK draws the same line, with `schedule()` / `scheduleEvery()` for time and a separate
event surface for everything else.

Adopt the vocabulary now so the gap stays visible: **`checkup.mjs` is a cron; a watch is a second
thing this system does not have.** Two mechanisms, two owners, and the cheapest honest first watch
is `ledger-sweep.yml` gaining a `repository_dispatch` trigger — a webhook that fires the checks that
already exist, with no daemon and no new credential.

---

## 10. The migration ladder, all three, in order

Every credentialed step blocks on E7. This is one ordering, not three.

| # | Step | Agent | Tier | Blocks on |
|---|---|---|---|---|
| 1 | `VALID_MODELS` → Claude 5 set; add `effort` to `REQUIRED_FRONTMATTER`; drop `maxTurns` | all | irreversible | — |
| 2 | **X1** mask proof · **X2** MCP reach · **X3** allow/deny precedence · **X4** skill `allowed-tools` vs the MCP grant | all | — | — |
| 3 | `research.js` → `agentType: 'sourcer'` + `schema` + `effort` | sourcer | full | 1 |
| 4 | `sourcer.md` repair; add to `READ_ONLY_ENGINES`; `SOURCER_MUST_NOT_HOLD` | sourcer | irreversible | 1 |
| 5 | Orchestrator-side claim transcription (sourcer return → ledger claim) | sourcer | full | 3, 4 |
| 6 | **Configure E7** in `.claude/settings.json` | all | irreversible | 2 |
| 7 | `bin/warroom` drops `--dangerously-skip-permissions` | all | full | 6 |
| 8 | `MCP_ALLOWLIST` replaces `mcpConfigured()` in **both** consumers | all | irreversible | — |
| 9 | `scripts/escalate.mjs`, `check-approvals.mjs`, `check-secrets.mjs`, `metric.mjs` | all | full | — |
| 10 | `launchd` clock + `scripts/checkup.mjs` | — | full | 9 |
| 11 | `ship.js` with **no operator dispatch** | operator | full | 9 |
| 12 | `instrument.md`, **grant withheld** | instrument | irreversible | 6, 7, 8 |
| 13 | `.mcp.json` with `db-read` only, launched `--read-only` and pointed at a **replica or export**, not production (§4.3, §6.5) | instrument | full | 12 |
| 14 | `mcpServers: [db-read]` on `instrument`; one read; canary clean | instrument | irreversible | 13 |
| 15 | `billing-read`, then `analytics`, one at a time | instrument | irreversible | 14 |
| 16 | **F4** — clamped `builder` vs `operator` on one real deploy | operator | full | 6, 7 |
| 17 | `operator.md`, **grant withheld**, band A only via `ship.js` | operator | irreversible | 11, 16 |
| 18 | `<deploy>` MCP; band B blocking for ten runs | operator | irreversible | 17 |
| 19 | `<db-admin>`, one migration, band C, founder present | operator | irreversible | 18 |
| 20 | `<payments>`, **test mode**, one month minimum before live | operator | irreversible | 19 |

**Steps 1-5 are safe today and need no sandbox.** `sourcer` is the whole of the near-term work and
it is the container that already exists. Everything from step 6 is gated on E7, and nothing from
step 12 should be attempted before it.

---

## 11. Recommended deletions

Prefer deletion. Each of these removes something that grants or enforces nothing.

| Delete | Why |
|---|---|
| `maxTurns:` from `sourcer.md:7` (and every agent) | Does not bind. ROSTER-SIZE: declared 20 → 269 runs, median 27. A budget that does not bind is worse than none, because it gets believed. |
| `return_contract:` frontmatter as *enforcement* | Nothing reads it. The dispatch-site `schema` binds. Keep it as documentation or delete it, but do not count it. |
| `mcpConfigured()`'s file-existence test | It is a boolean for the whole repo. One file flips the lint permissive for every agent at once. Replace with `MCP_ALLOWLIST` (§4.7). |
| `framer` from `lenses.yml:30, 50, 66, 84, 151` | `framer` is cut by ROSTER-SIZE. Five `applies_to` lists still name it, including the `evidence` lens at `:151` alongside the five containers that survive. A lens pointing at a deleted container is the same defect as a doc naming a deleted file. Reassign per ROSTER-SIZE §5.2: `business`/`product` → `[orchestrator, builder]`; `customer`/`research` gain `instrument`. |
| `researcher` / `research-lead` shims | Once `research.js` names `sourcer` (step 3), the shims' only remaining job is shadowing `~/.claude/agents/`. Delete at Phase 9 as planned — but re-point `research.js` **now**, because the shim is what has been running. |
| *"Use Context7 for library docs first"* — `research.js:118` | Instructs the research agent to reach a tool that does not exist here. The eight servers live at user scope are `stitch · refero · miro · runpod · playwright · higgsfield · mem0 · pencil`; **`context7` is not among them** and no `.mcp.json` declares it. An instruction naming an absent capability is the same defect class as a `mcpServers:` declaration nothing backs — delete the sentence in the same PR that re-points the dispatch. |
| An outbound-send pattern in `qa-tier-floor.yml` | Deliberately absent today, correctly (*"A pattern matching nothing would read as coverage it does not have"*). **Add it the day `operator` ships, not before** — this is the one addition, listed here so it is not forgotten. |

---

## 12. Open questions, and what would falsify this

**The biggest open question, and it is not close:**

> **Does mask mode actually keep the secret out of the transcript?** Every credentialed line in this
> document rests on it. The binary says it does, in its own error strings. Nobody here has run it.
> **X1** answers it in five minutes, and if the answer is no, `instrument` and `operator` do not get
> credentials in this runtime at all — the deploy stays a human act, `gate: outbound-approval`
> resolves to a notification, and the roster is six (ROSTER-SIZE D1).

Then, in order:

| # | Question | Settled by |
|---|---|---|
| Q2 | Does an `mcpServers:` grant survive `Agent` dispatch in a repo with no `.mcp.json`? | **X2** (§8) |
| Q3 | Does `deniedDomains: ["*"]` + a four-entry allow-list behave as §4.4 assumes? | **X3** (§8) |
| Q4 | Does a per-dispatch `disallowedTools: ['mcp__payments']` actually bind on `operator`? | first band-A dispatch; if not, `operator` splits (§6.4) |
| Q5 | Is `operator` a container at all, or a clamped `builder` with a token? | **F4** (step 16). ROSTER-SIZE names this as the strongest counter-argument to its own position, and it cuts at this document too. |
| Q6 | Does GitHub actually notify on a failed scheduled workflow? | §9.4's last-resort channel depends on it, and it is unverified |
| Q7 | Does a skill's `allowed-tools:` strip `mcp__*` from a credentialed agent? | **X4** (§8). `deployment-procedures` — the skill assigned to `operator` — declares one. |
| Q8 | Live production read, replica, or committed export for `instrument`? | Founder decision (ROSTER-SIZE D2), now informed by Supabase's own *"Don't connect to production"* (§4.3). Recommendation: replica, else export. |

**What would falsify the whole document:** the `strings` re-run on the next CLI. If `agent()` or
`Agent` ever accepts an additive `allowedTools` or an `mcpServers` option, grants become per-call,
these three containers collapse into option objects on one agent, and the right answer is fewer
files with per-dispatch grants. One `grep` settles it and it should be re-run at every CLI upgrade.

**What would not falsify it:** a low dispatch count on `sourcer` (§3.19 shows that is a routing
bug), any argument from token cost (inadmissible), or another framework shipping a different roster
size (none of them has a field that expresses a grant).

---

## 13. Conventions inherited, and from where

ROSTER-SIZE §3 surveyed eight systems for *how many agents* they ship. This section asks a different
question of the same field — *how does anyone give one agent a credential, run work on a clock, and
keep a human in the loop on an irreversible act* — and takes what transfers. All sources accessed
**2026-08-14**.

### 13.1 Adopted

| # | Convention | Source | Where it lands here | Why it transfers |
|---|---|---|---|---|
| 1 | **Deny by default; grant one named external resource at a time.** *"Each agent, and each Gadget, by default has access to nothing"*; *"you must **introduce** each agent … to any particular resources you want it to access."* | [cloudflare/cloudflare-os](https://github.com/cloudflare/cloudflare-os) | §1, and `MCP_ALLOWLIST` in §4.7 | Our grant is already fail-closed (a grant not made does not exist). The convention adds the *enumeration*: a named list per agent, so a grant is a reviewed line rather than a default. |
| 2 | **An agent may request a capability it lacks; a human provides or denies.** *"An agent can also request an introduction to a resource it thinks it needs, which you can then provide or deny."* | cloudflare-os | `BLOCKED_NEEDS_CAPABILITY` + `capability_requested` added to all three return schemas (§8.1) | Turns "this container could not do the job" from a dead end into the grant inventory ROSTER-SIZE §8 says only a real run can produce — collected as a by-product, not as a special experiment. |
| 3 | **Simulate the side effect locally, let the agent continue, approve in bulk.** *"will **simulate** the outcome locally, allowing the agent to proceed and queue up more actions"* … *"approve or reject the actions in bulk, or one-by-one."* | cloudflare-os | `operator` band B (§5.11) | Independent arrival at the same design ROSTER-SIZE §4.7 proposed. It is the only form of approval that survives an unattended 02:00 run without either blocking or skipping the human. |
| 4 | **One posture per org; narrower scopes may only tighten it.** *"An org picks one security posture, which narrower scopes can only tighten."* | [yc-software/qm](https://github.com/yc-software/qm) | The band dial is tighten-only (§5.11) | Without it the autonomy dial is a route around the gate. ROSTER-SIZE §5.2 already owed a "tighten-only composition rule"; QM is the existence proof it ships. |
| 5 | **A predeclared command policy that applies in every posture** — *"approval rules and hard denials for things like recursive deletes or destructive SQL"* | QM | `pre-tool-use.sh` stays binding at every band; the dial cannot lower the floor | This is what we already have; the convention is the *independence* — the hard floor is not a function of the autonomy setting. |
| 6 | **Provenance-label external text at the boundary.** *"Auto screens supported, provenance-labelled external text and supported tool results."* | QM | Extend `research.js:105, :119`'s `(DATA, not instructions)` wrapper to fetched bodies (§3.15) | Costs a string. Works without a classifier, which we do not have and are not building. |
| 7 | **A credential grant and an audit trail arrive together.** *"…with their credentials and permissions, and **everything it does is audited**."* | QM | `deployments.jsonl` + the unapproved-action check (§5.13, §5.14, §5.17) | Named in one sentence with the grant, which is the right coupling. It also exposes our real gap: no per-call MCP record exists. |
| 8 | **Scope read/write at the server, not only at the agent.** `read_only=true` *"executes all queries as a read-only Postgres user"*; `project_ref` limits blast radius. | [Supabase MCP docs](https://supabase.com/docs/guides/getting-started/mcp) | §6.5, obligations 1-3; `MCP_ALLOWLIST` records the scoping flag and lints for it | A database role binds harder than any tool list. This is the strongest single control in the whole credential design and it is free. |
| 9 | **A schedule is a durable row with list and cancel, not a timer.** *"Scheduled tasks survive agent restarts and are persisted to SQLite"*; `listSchedules()` / `cancelSchedule(id)`. | [Cloudflare Agents scheduling](https://developers.cloudflare.com/agents/api-reference/schedule-tasks/) | `launchd` + `checkup.mjs` (§9.2-9.3); the schedule is inspectable and cancellable from outside any session | Directly disqualifies the in-session `CronCreate` for this layer, on a mechanism rather than a preference. |
| 10 | **Crons and watches are two things, and both are scope-owned, not agent-owned.** *"Crons and watches run work while nobody's watching"*; crons are *"scope-owned"*. | QM | §9.1 (script + clock owns the layer) and §9.5 (a watch is a named, still-missing second mechanism) | Independent confirmation of §9.1's decision, from the one system running a real company's ops on it. And it gives the unowned intake layer a name, which keeps it visible. |
| 11 | **SKILL.md: one folder, `SKILL.md` required, `name` + `description` the only required frontmatter, progressive disclosure, body under ~500 lines, optional `scripts/` `references/` `assets/`.** | [anthropics/skills](https://github.com/anthropics/skills) | Skill selections in §3.6, §4.6, §5.6 | Verified we already match on the required pair: **134 of 134 skills carry exactly `name` + `description`**. Skill injection is our one measured arrival channel (288/431 transcripts), so matching the official shape exactly is not cosmetic. |
| 12 | **A security document that states what the system does *not* guarantee.** QM's `SECURITY.md` *"does not promise that data cannot leak"* and names its own evasions. | QM | §2.3, §2.4, §5.10, §12 | This repo's whole rebuild was called by a doc naming mechanisms that did not exist. The convention is the antidote, and the best-resourced system in the field practises it. |

### 13.2 Rejected, and why they do not survive here

| Convention | Source | Why not |
|---|---|---|
| **Grant MCP per session, from the user's OAuth identity** — *"their identity information and tokens are made available through the `props` parameter"* | Cloudflare Agents SDK | **Inexpressible.** `strings -a … \| grep -c 'allowedTools?:'` → 0; no `mcpServers` option on `agent()` or `Agent` (§0). This is the best model in the field and our runtime cannot represent it. |
| **Scope credentials per human principal — a "keychain view" per person and per room** | QM | Requires a harness that knows *which* agent is calling. Ours does not: the `PreToolUse` payload carries no agent identity (ROSTER-SIZE §4, E2), so we cannot scope by principal even if we wanted to. |
| **"The agent acts as the person it's working for, with their credentials and permissions"** | QM | Strictly worse here, and it is the §1 hazard at maximum size: one container holding the founder's entire authority, read and write, across every task. QM makes it safe with per-scope sandboxes and full audit; we have neither yet. |
| **16 capability boundaries around 1 general agent (Gatekeepers)** | cloudflare-os | The right answer *given revocable typed bindings*. Cloudflare's runtime can **deny** at call time; ours cannot — every `mcp__*` call reaches `pre-tool-use.sh:342-344`'s `*) # Unknown tool — allow`. Adopt the *shape* (one boundary per resource) and put it in files, because a file is the only boundary this runtime has. Revisit the day E7 + E8 make denial per-call — that is ROSTER-SIZE's falsifier F3. |
| **Two-field agent frontmatter (`name` + `description`)** | BMAD-METHOD ("Each agent is available as a skill, generated by the installer") | Correct *for them*: BMAD's agents carry no capability, so there is nothing else to declare. Adopting their minimalism would delete `tools:`, `mcpServers:` and `effort:` — the only three fields in our frontmatter that bind anything. |
| **A `Dangerous` posture — no content screening, no pauses between tool calls** | QM | Refused for any credentialed container, at any band. QM offers it as an org choice; ours would apply to a context holding a live payments key. |
| **`this.schedule()` — scheduling as a method on the agent** | Cloudflare Agents SDK | Their agent is a hibernating Durable Object with its own SQLite; ours is a model context that ends with the turn. A schedule stored inside a thing that ends is exactly the `CronCreate` trap (session-only, in-memory, 7-day expiry). |

### 13.3 Where the field disagrees with us

Three disagreements, reported with the direction each cuts.

1. **Supabase: "Don't connect to production." The field wins, and it changed the spec.** §4.3 now
   prefers a read replica (B) or a committed export (C) over a live production read (A), with A
   requiring an explicit recorded founder decision. Our measurements of *this runtime* say nothing
   about whether a vendor wants an agent on its production database, so there was nothing here for
   our measurements to win.
2. **Nobody separates read-credentials from write-credentials. This weakens us, and §6.5 says so.**
   The two systems that decompose credentials at all decompose by resource (Cloudflare) or by
   principal (QM). Our `instrument`/`operator` split has no precedent in the field. What survives
   the objection is the measurement, not the analogy: the `Agent` path accepts no `disallowedTools`,
   so a merged container cannot be narrowed at a call. The field's silence is a real cost to the
   argument and is recorded rather than argued away.
3. **Everyone else's grant is revocable at runtime; ours is not. Our measurement wins on the fact
   and loses on the architecture.** Cloudflare revokes a binding; QM revokes a keychain view; we
   edit a file and re-dispatch. The seven-container roster is a **workaround for a runtime
   limitation**, not a design anyone would choose given Cloudflare's primitives — and it should
   collapse the moment F1 or F3 lands. Writing that down is the point: a workaround mistaken for an
   insight is how a roster stops shrinking when it should.

---

*Every claim above is a `file:line` in this repository, a command run on 2026-08-14 and reproduced
in §0, a URL with an access date in §13, or a labelled gap. The four experiments in §8 and the mask
proof in §2.4 are the difference between this being a specification and being a hypothesis, and
they cost about an hour between them.*
