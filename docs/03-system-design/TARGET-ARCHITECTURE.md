# Target architecture — what this harness should become

| | |
|---|---|
| **Status** | Proposed · founder decisions locked 2026-08-20 · no code written |
| **Date** | 2026-08-20 |
| **Owner** | ceo (`ceo-2-1787176362`) |
| **Base** | `main` = `1f5e742` |
| **Supersedes** | Nothing. [AGENT-SYSTEM-REBUILD.md](AGENT-SYSTEM-REBUILD.md) ends at Phase 9; this document is what comes after, plus a reordering of what comes before |
| **Method** | 13 agents across two waves. Every figure below is marked verified-by-execution or read-only |

---

## 0 · The one thing to understand first

**In this repository, reading is not a verification method.**

House style deliberately preserves superseded statements beside their corrections — which is good
practice for history and makes prose an unreliable oracle **by design**. A fix comment and a live bug
are indistinguishable to `grep`.

This round produced the measurement. Two independent CEO lanes generated **seven false findings between
them**. Every single one died to *re-running*; **none** died to re-reading. Several were produced by
agents that had been explicitly warned about the exact trap they then fell into — including both
orchestrators, one layer up, while relaying the warning.

Three of those seven were mine:

| False finding | What was actually true |
|---|---|
| `qa.js:92-94` primes verifiers to assume findings are false | Fixed in **PR #42** (`d1971db`). Live prompts are refute / reproduce / steelman. I read the comment describing the fixed defect |
| The four `~/.tmux/scripts/*.sh` are not in the repo | They are templates at `war-room/tmux/PROJECT_NAME-*.tmpl`, rendered by `install-war-room.sh:78-82` |
| Lens provenance "works here, it's only a transplant issue" | True of this repo, and I generalised the mitigation wrongly — see §3 |

**The consequence is structural, not anecdotal.** `qa-lead-pass.yml` gates by grepping a verdict a human
wrote after reading a diff. In a repository where reading is not a verification method, **that gate gates
on nothing.** Every design decision below inherits this: *a control that reads is a control that guesses.*

### The rule this produces

> **A superseded statement must be marked as superseded at the point of citation, not only in the file that
> fixed it.**

The house style is not the defect — *asymmetric* application of it is. `qa.js:152-165` does it correctly:
it says *"Until 2026-08-15…"* and names what changed, so a reader of that file cannot mistake the obituary
for the corpse. `MODEL-DIVERSITY.md` does not: its §1.3 heading, its `qa.js:92-94` citation and its line
table (`122/132/180/199`; actual `222/235/283/321`) all describe pre-#42 code in the **present tense**.

**Two independent agents asserted the same false P0 from that one document, in one session.** That is a
measured defect with a reproduction, not a stylistic quibble — and left alone it re-fires on the next
reader. An implementer sent to "fix `qa.js:92-94`" will edit a comment. **Correcting it belongs in the same
PR as the gate work.**

---

## 1 · Locked founder decisions

Nine, all 2026-08-20. Recorded because several override a documented position, and an override that is
not written down becomes drift.

| # | Decision | Consequence |
|---|---|---|
| 1 | **Agentvibe is a factory, not a product** | Single-user cockpit. No auth, no onboarding, no multi-tenancy. Every feature judged by "does this make the founder faster" |
| 2 | **Build the full machine before running a real venture** | **Overrides the CEO recommendation, and it is the fourth such refusal.** See §5 for the cost, stated rather than relitigated |
| 3 | **Serve literally any company**, not only software | This is the *founding* decision (`AGENT-SYSTEM-REBUILD.md:60`), not a new one. Domains scale as lenses + playbooks; the roster stays at 7 engines |
| 4 | **Mission Control is localhost-only** on the founder's Mac | Deletes the web→local bridge problem entirely. Does **not** delete the threat model — see §6 |
| 5 | **Codex CLI is the second model family** | Chosen over Gemini despite Codex being uninstalled and Gemini being present and authenticated. The seam is built binary-agnostic |
| 6 | **The gate holes are one P0 rebuild**, sequenced first | Correct. Nothing else is trustworthy while a PASS means nothing |
| 7 | **Verify branch protection and turn it on** | Cheap and worth doing — but it covers the **PR route only**. `cmd_merge` writes to *local* `main` and never pushes, so no remote control can reach it. See §4 |
| 8 | **Local-first board; tunnel later** | The intake seam is written so a webhook receiver can be added without redesign |
| 9 | **Fix portability early; Phase 9 rollout stays last** | The reordering §3 forces |

---

## 2 · What is actually true today

The system is **twelve surfaces** (`AGENT-SYSTEM-REBUILD.md:16-19`), not a repo. Scored against the
founder's ambition:

| Surface | State | Evidence |
|---|---|---|
| Launch environment | **Forked** — two installers, two generations | §3 |
| Entry prompts | Working — 2,941 B, under the 4,096 inline threshold | verified |
| Roster | 7 engines + 11 shims. **Three contradictory definitions on record** | read-only |
| Skills | 134, two-tier routed, **barely used** — 20 MANIFEST reads vs 4 router reads | read-only |
| Commands & playbooks | 6 playbooks, 4 software-shaped. **No ops, customer, or product playbook** | verified |
| Memory | Flat markdown. **91 bytes of headroom** against a CI-blocking cap | verified |
| Gates | **Self-certified at one end, bypassed at the other** | verified, §4 |
| Observability | One log, 11,851 lines, **7 of them war-room**. **Zero carry project, session, agent, pid, worktree or branch** — the defect is attribution, not naming | verified |
| Automation | **One clock in the entire repo** — `ledger-sweep.yml`, and it runs in the cloud | verified |
| Integrations | `.mcp.json` holds exactly one server. Nothing external can trigger an agent | verified |
| Distribution | **Impossible** — see §3 | verified by execution |
| Human interface | Two surfaces, no shared contract, different answers to "is this alive?" | verified |

### The strengths, stated honestly

External research found three places this design is **ahead of the published field**:

- **Lenses-as-linted-data** matches what the 2026 coordination literature recommends — coordination as an
  architectural layer, not agent prose. Most frameworks embed it in agent text.
- **A claim ledger with enforced expiry has no equivalent in any surveyed framework.** MAST's headline
  finding is that multi-agent failures are architecture problems, not model problems; a ledger that forces
  durable claims to expire is a direct answer.
- **The ENFORCED / ADVISORY distinction** is unique among surveyed harnesses.

These are not to be traded away for features.

---

## 3 · The finding that reorders the plan

**Every project this system generates is born broken.** Verified by execution.

```
~/bin/newproject:125    rsync -a --exclude='.git' ...
              :134      rm -rf "$PROJECT_DIR/.git"
              :180      git init --quiet          ← empty object store
```

Three compounding failures:

**(a) 26 provenance citations cannot resolve.** `.claude/lenses.yml` (13) and `.claude/review-lenses.yml`
(13) cite `git:<path>@<rev>` blobs across two revs, `cda6de9` and `ac88494` — both agentvibe-only commits.
`schema-lint.js:1176` gates on `git cat-file -e` and pushes failures into the same `issues[]` array as every
other lint failure. **Hard fail, not a warning:**

```
$ GIT_OBJECT_DIRECTORY=<empty> node .claude/hooks/schema-lint.js --lenses
✗ .claude/lenses.yml — FAIL          ✗ .claude/review-lenses.yml — FAIL
Summary: 18 pass · 2 fail · 0 warnings                        exit 1
```

`fetch-depth: 0` at `ci.yml:35` is **inert by construction** — you cannot fetch an object that never
existed in that repository. Confirmed independently in a throwaway repo:
`git rev-parse --is-shallow-repository` → `false`, and `git cat-file -e cda6de9:…` → `fatal: invalid object name`.

**And the error message sends the operator the wrong way.** `schema-lint.js:1179` says *"a shallow clone
will do this; CI needs fetch-depth: 0"* — advice that cannot possibly help in the transplant case. A checker
that fails correctly but explains wrongly spends trust before it spends time.

**(b) `newproject` installs the old launcher.**

| Installer | Renders | Size | Placeholders | Version |
|---|---|---|---|---|
| `install-war-room.sh:72` | `war-room/bin/PROJECT_NAME.tmpl` | 2,764 | **90** | none |
| `warroom-install.mjs:263` | `bin/warroom` | 2,837 | 0 | `2.0.0` |

`newproject` → `init-from-template.sh:124` → `install-war-room.sh`. **`warroom-install.mjs` is never
reached.** Nothing guards the fork: `grep -rn "PROJECT_NAME.tmpl" scripts/ .github/` → **0 matches**.
`warroom-parity.sh` diffs against a live *installed* launcher, never against the template.

**(c) `newproject` has no update path** — which is literally one of Phase 9's three gate conditions.

> **Why this reorders everything.** Phase 9 was scheduled last, as the victory lap. It is not a victory lap;
> it is a broken foundation scheduled last. Every mechanism built before it is fixed is a mechanism that has
> only ever run in one place — which is **stop condition 7's exact shape**. Per decision 9: fix the three
> structural blockers early, keep the 13-project rollout last.

---

## 4 · The gate — P0, and smaller than feared

Three holes were alleged; **two are real.**

| Hole | Status |
|---|---|
| `warroom merge <N>` bypasses the gate | **CONFIRMED**, three lanes. `bin/warroom:2056-2189`, three strategies, zero occurrences of `qa_verdict`/`run-gate`/`classify`. `_log_event` writes `tier=fast-forward` — a merge *strategy* in a field named for a risk *tier*, so logs read gate-aware while nothing is checked |
| Verdict is author-written | **CONFIRMED**. `qa-lead-pass.yml:124` greps a `qa_verdict: PASS` the PR author committed. ⚠ *An earlier draft said "`qa.js` is invoked by nothing" — **false**, and so is `run-gate.mjs`'s own header saying "Nothing routes to it." Verified: `.claude/workflows/coding.js:120` calls `workflow('qa', …)` with a BLOCK fail-safe.* The true, narrower statement: **no merge path and no CI job routes to it**, and `coding.js` is itself named by no slash command (0 hits across `.claude/commands/`) |
| Verifiers primed toward false negatives | **FALSE** — fixed PR #42. Do not "fix" it again |

**The founder instructs agents to run merges.** So agents merge their own work with no verdict. This is not
a founder knowingly using an escape hatch.

### `cmd_merge` never pushes — and that is worse than "no PR"

Verified by execution across all 133 lines: **the only `origin` reference in the entire function is
`git fetch origin main`. There is no `git push`.** It runs `checkout main` and merges into **local `main`**.

Three consequences that tighten the P0:

1. **Branch protection cannot cover this path.** Branch protection is a *remote* control; this merge is
   local. Whoever later pushes `main` is pushing an already-merged commit, and a non-force
   `git push origin main` is only **softwarned** by `pre-tool-use.sh:409-411` — it proceeds. So enabling
   branch protection is still worth doing, but it closes the PR route only.
2. **The two fixes are non-overlapping and both are required.** The CI-signed check-run covers the PR path;
   `run-gate --require` inside `cmd_merge` covers this one. **Neither covers the other.** Stated here so the
   P0 cannot be descoped to a single item and declared closed.
3. **`branch -D` is a force delete, at three sites, immediately after the unverified merge.** It discards
   unmerged work with no warning and destroys the record of what was merged — so this path is not merely
   unverified, it is **unauditable afterwards**: you cannot reconstruct what a gate would have judged.
   Change to `branch -d`. The force flag buys nothing here except silent data loss.

### The fix, in four parts

1. **Close `cmd_merge` — and it is NOT six lines.** ⚠ *An earlier draft of this document claimed
   "insert `run-gate --require` at `bin/warroom:2078`, ~6 lines, highest leverage in the system." **That was
   wrong and it was the author's own error**, caught by adversarial review and verified by execution. It is
   preserved here rather than deleted, per §0's own rule.*

   Why it fails, from `run-gate.mjs`'s own header:
   > *"**It cannot execute `qa.js`.** That file is a Workflow script — it closes over injected globals
   > (`agent()`, `parallel()`, `phase()`, `log()`, `args`, `budget`) that no plain node process provides."*
   > *"`--require` — **exit 1 when the gate IS required**."*

   So "exit 1 → refuse" **refuses every full/irreversible merge without reviewing anything, and waves
   through every lite merge**. It is a tier tripwire, not a gate. And it fails open — verified:
   ```
   $ node scripts/run-gate.mjs .claude/workflows/qa.js
   No changed files for origin/main...HEAD. Nothing to gate.        EXIT=0
   ```
   It ignores positionals; the default ref is `origin/main...HEAD`, which at `:2078` (pre-`checkout main`)
   is the *merging worktree's* HEAD — the wrong diff. `bin/warroom` is bash, and **there is no bash path to
   the Workflow runtime at all.**

   **The correct design, which merges this item with fix 3 rather than standing alone:** `cmd_merge` calls
   `run-gate --require --ref "main...$branch"` **only to classify**, then demands a **verdict record whose
   `subject` hash matches the diff being merged** and refuses when absent or stale. The router routes; the
   verdict record binds. Neither alone closes the path. Also fix the fake `tier=` string and `branch -D`.
2. **Oracle first.** `npm run check` is 25 deterministic blocking steps; `qa.js` at irreversible dispatched
   **79 agents** on PR #77. Order: classify → `npm run check` (any red = BLOCK, **zero agents dispatched**)
   → diff-scoped typecheck/semgrep → dimension review → 3-way verify → second family. Today nothing stops a
   full panel running on a diff that fails lint.
3. **Unforgeable verdict.** PR #77 keyed to a HEAD SHA that stopped existing the moment the record was
   committed. The primitive was right, the anchor was wrong:
   ```
   subject = sha256( git diff $(git merge-base origin/main HEAD)..HEAD
                     -- . ':(exclude).qa/verdicts/**' )
   ```
   A hash of reviewed **content**, verdict path excluded — stable across the recording commit, amend, and
   rebase, the three events that broke #77. Then post it as a **GitHub check-run signed by the workflow's
   `GITHUB_TOKEN`**, and delete the author grep. The author cannot mint one without the token.
4. **The second family as a resolver, not an agent.** `claim-judge-external` beside the existing four in
   `scripts/lib/resolvers.js`. Resolvers are plain Node run by `check:ledger`, outside the Workflow runtime —
   so the closed `agent()` contract never applies, and **`reviewer-readonly` keeps `tools: [Read, Glob, Grep]`**,
   preserving the isolation PR #47 bought. Binary configurable, default `codex`, fallback `gemini`.

### The prompt standard has the gate's disease, in a second organ

The gate gates by **reading**. The prompt standard's content rules gate by **keyword matching**. Both are
controls that report green without controlling. Constructed failures, all `VERIFIED-BY-EXECUTION`:

| Rule | Fires on | Silent on | Why |
|---|---|---|---|
| `PS-BODY-TOOL-AFFIRM` | `Run the suite with \`Bash\`…` | the same line **plus "Do not skip it."** | one negation word anywhere in the paragraph clears the whole paragraph. **84 of 215 paragraphs (39.1%) in the live seven already contain a clearing word** |
| `PS-PRIOR-BELIEF` | `The diff is believed to be correct.` | *"Two senior engineers shipped this. Findings here are usually noise."* | **this is the rule guarding the 97.2%→3.6% priming effect, and the phrasing the study actually measured is invisible to it** |
| `PS-DISPOSITION` | `Be critical of every finding.` | `Be extremely critical.` | the regex requires the words adjacent |
| `PS-JUDGE-BLOCK-CONDITION` | body with no `BLOCKED` token | any unrelated sentence containing the word | it cannot tell a named condition from the word |
| `PS-TOOL-EXISTS` | `tools: [Frobnicate]` | `tools: [mcp__nonexistent__doAnything]` | see below |

**A new defect, and it is the repo's own signature.** `schema-lint.js:522` skips `mcp__*` entries in `tools:`,
under a comment stating *"PS-MCP-BACKED already checks those… duplicating that here would give two
implementations of one question."* **PS-MCP-BACKED reads `fm.mcpServers` (`:921`), a different field.**
Nothing checks an `mcp__` entry in `tools:`. This is the `mcpServers` fabrication that `schema-lint` was
written to kill, **re-created one field over and hidden behind a comment asserting a delegation that does not
happen.**

> **The methodological rule this produces, which generalises past the linter:**
> **Zero-on-corpus plus fires-on-one-control is not sufficient. The missing test is *fires on a paraphrase*.**
>
> `PS-BODY-VAGUE` was withdrawn for being unable to judge. Four of the five rules above survived by the
> opposite route — narrowed until they hit zero on the corpus, which reads as "clean" and means "toothless."
> Every content rule needs a **negative control**: one restatement that means the same thing and is not on
> the list. Without it, narrowing a predicate until it stops firing is indistinguishable from fixing it.

**Correction to this document's own earlier claim:** it said the standard "gates every edit under
`.claude/agents/`." **It does not.** `schema-lint.js:824` returns early for `kind: shim`, and **11 of 18
files are shims** — they see a 7-field schema and none of the PS block. The standard gates **the seven
engines**. The plan's exposure to it is real but roughly half what was stated.

**Recommendation:** fix `PS-BODY-TOOL-AFFIRM`'s scope from paragraph to sentence (the original wrap problem
is already solved by `normaliseProse` collapsing newlines), close the `mcp__`-in-`tools:` gap, and **demote
the three keyword rules to WARN while saying plainly in the standard that they are tripwires, not
judgements.** They currently sit in the FAIL table as though membership were decidable. A warning that is
honest costs an implementer nothing and stops the false assurance.

### Codex invocation — verified against source, and it contains two traps

Sourced from `openai/codex` `codex-rs/exec/src/lib.rs` and `learn.chatgpt.com/docs`, 2026-08-20.

```
codex exec - --json          # prompt on STDIN, JSON Lines on stdout
```

- **`codex exec` is a subcommand, not a flag.** There is no `--non-interactive`.
- **`-p` is `--profile`, NOT prompt.** Guessing it silently loads a config profile instead of failing —
  a wrong answer wearing the shape of a right one.
- **The trailing `-` is mandatory.** `codex exec "prompt"` with piped stdin does **not** ignore stdin;
  `resolve_root_prompt` calls `prompt_with_stdin_context` and **appends** it. Only the `-` form keeps
  LLM-authored text off `argv` entirely, which is the entire reason the prompt is piped.
- **`--json`** emits one event per state change: `thread.started`, `turn.started`, `turn.completed`,
  `turn.failed`, `item.*`, `error`. **`turn.completed` carries a `usage` object** — real token counts for
  the attestation, from the binary's own output rather than asserted.

> **TRAP — this one would have shipped a silent false verdict.** Open bug **#19945**: `codex exec` returns
> **exit 0 with 0-byte stdout when stdio is detached from a TTY** (0.124.0/0.125.0; 0.123.0 unaffected),
> triggered by long prompts. A resolver is detached and non-TTY *by construction*. Bug **#4721**: SIGINT
> returns 0, not 130.
>
> **Therefore: gate on the presence of a `turn.completed` event, never on the exit code.** Absent →
> `unresolved`. This is Rule 10 — "a resolver never passes what it could not check" — meeting a binary that
> lies about having checked.

**Credential containment is incomplete by design, and must be stated as such.** `denyRead` the **directory**
`~/.codex` (the file is `~/.codex/auth.json`) and honour the `CODEX_HOME` override. **But** the storage
backend is configurable via `cli_auth_credentials_store`: under `keyring` or `auto` the credential lives in
the **macOS Keychain**, where a filesystem deny reaches nothing. Do not describe this as containment.

**Pin a version.** Every fact above was read from `main` HEAD, not a release tag, and the two bugs prove
behaviour varies across patch releases.

**The predicate is lexical and that is the real problem.** `claims.js:425-430` dedupes a list of strings and
counts them. It cannot distinguish a real Codex invocation from someone typing `model_family: openai` into
YAML — the `c-runtime-nested-spawn` shape exactly. Fix by **attestation**: the resolver writes
`{bin, argv_sha256, prompt_sha256, stdout_sha256, subject}`, and a `risk: high` entry without one fails.
Leave `independenceIssue` itself untouched; it is shared with `schema-lint.js`, and one rule with two call
sites is the property that file protects.

**Asymmetry, from `MODEL-DIVERSITY.md:467`:** a second-family judge may only turn PASS into BLOCK, never
BLOCK into PASS. A flaky binary degrades to "no second opinion", never a false PASS. This is what makes
shipping it in shadow safe.

> **`MODEL-DIVERSITY.md` is stale and that is now its own defect.** Its line table (`122/132/180/199`;
> actual `222/235/283/321`), its §1.3 heading, and its `qa.js:92-94` citation all describe pre-#42 code. An
> implementer sent to "fix `qa.js:92-94`" will edit a comment. Fix the doc in the same PR, or it re-injects
> this false finding on every read. Its *reasoning* is sound and is used above.

**Credential containment, same PR.** `~/.gemini/oauth_creds.json` is live, mode `600`, and readable by any
in-session agent — `denyRead` covers `~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.netrc`, `**/.env*` and misses it.
Add `~/.gemini`, `~/.codex`, `~/.config/openai` as **directories**, because a rotated credential lands under
a new filename.

---

## 5 · The substrate — derive it, do not build it

The original thesis was "two surfaces, no shared substrate; build one." The evidence says that was
over-engineered. **The substrate mostly needs deriving and deleting, not constructing.**

- **All four `.task`/`.session` sidecars are empty right now**, while four agents run. Both surfaces read
  them. Two surfaces reading one empty file is a shared blind spot, not a shared substrate.
- **The typed message bus has never carried a message.** Directory created 2026-08-11; zero files.
- **The join key needs no writer.** Worktree path → transcript dir by literal `/`→`-` substitution.
  Verified live. Derive it; stop writing `.session`.
- **`Turn.stop` is already collected** by `scripts/lib/usage.js:82` and **discarded** at
  `mission-control/server/lib/usage.ts:20`, which declares `{t, out, side}`. **Restoring it is one line, and
  it is the highest-leverage edit in the system** — it makes liveness computable.

### Liveness — kill the regex

`bin/warroom:1101` captures three painted lines and greps for a shell prompt. A crashed agent and a finished
agent are byte-identical; any TUI redraw flips the answer.

| State | Signal |
|---|---|
| **running** | `now − mtime(transcript) < 90s` |
| **waiting-on-human** | stale, last `stop == "tool_use"` |
| **finished, work uncommitted** | stale >5min, `stop == "end_turn"`, `git status --porcelain` non-empty |
| **dead** | stale >5min, pid gone, `stop ∈ {null, "max_turns"}` |

Where the pid is unknowable (`ps` is sandbox-denied to agents), degrade to **`unknown-not-dead`**. An honest
`unknown` beats a confident wrong answer — that confident wrong answer is what has cost this project most.

> **This defect reproduced under observation during this very session.** Six subagents went idle
> indistinguishably from finished; recovering their reports cost two full round trips. It is not a
> hypothetical.

### The return path is a second, worse defect — and it was measured here

Liveness asks *"is it working?"* The return path asks *"did the work arrive?"* — and a silent return path is
strictly worse, because a bad liveness signal at least prompts you to go and look.

Two agents that eventually reported explained the silence themselves: *"my two prior designs were plain
text, which teammates never see"* and *"delivery error on my side, not idleness — I'd completed the research
and written the report as plain text."* **They had finished. The output evaporated.**

Measured across all 23 agents dispatched this session — an accidental but clean experiment:

| Brief | Delivered without being chased |
|---|---|
| No explicit transmit instruction | **2 of 13 (15%)** — and both were `sourcer`, whose own procedure ends in a report |
| `"Send via SendMessage to main. Do not end your turn without sending it."` | **10 of 10 (100%)** |

Two of the eleven silent agents were later chased into explaining themselves — *"my two prior designs were
plain text, which teammates never see"* and *"delivery error on my side, not idleness."* **They had
finished. The output evaporated.** Recovering the eleven cost four round trips.

The one sentence is the cheap half of the fix and it works. The half that lasts is the check — because a
brief can be forgotten, and an unenforced instruction is this repo's most-documented defect.

This is the same shape as the handoff's *"five lanes reported available with finished work uncommitted on
disk."* And it is the familiar defect class: **every engine in `.claude/agents/` declares a
`return_contract` with `required_fields`, and nothing checks that the return was ever transmitted** — only
what it should contain if it were. An agent that writes a flawless JSON return as prose satisfies the
contract and delivers nothing.

**Fix (P2):** the return contract must be discharged by a *tool call*, not by prose — and the dispatching
engine must treat "went idle with no transmitted return" as a distinct, reportable outcome rather than as
completion. One sentence in every engine brief is the cheap half; the check is the half that lasts.

Once the gate lands, `finished-uncommitted` splits into **`awaiting-gate`** and **`gate-blocked`**. These
demand opposite responses from the founder, and collapsing them is how blocked work reads as finished.

---

## 6 · Surfaces

**Stay on tmux.** 133 call sites, not 60. Agents cannot reach the tmux socket at all (sandbox-denied,
verified), so Zellij's superior `write-chars` lands nowhere useful — and the founder's goal is to stop
looking at terminals. Migration buys polish for a surface being demoted. Revisit only if the terminal
becomes primary again.

**Mission Control, in build order:**

1. **Kanban** — `inbox → running → review → done`. Dragging to *running* dispatches. **The `review` column
   is the gate's output, not a human judgement** — a card enters it when a verdict is written, coloured
   PASS/BLOCK. This is why the gate is P0 ahead of it.
2. **Two charts, both from fields already on disk** — cumulative `Turn.out` over `Turn.t` per lane (in
   memory today, unplotted), and a 7-day `events.jsonl` sparkline bucketed by the `ts` field nothing reads.
   **No dollar figures.** Refusing the price table was correct.
3. **Agent graph (React Flow)** — after the board. Four lanes do not need a DAG.

**Dispatch.** The "server never spawns" rule is a misquote — `crosscheck.test.ts` bans *shell literals* and
permits `execFile(bin, argv)`; the server already spawns `git` and `node` on six paths. So:
`POST /api/dispatch` → validate → `spawn('claude', argv, {detached:true, stdio:'ignore'}).unref()`.
**Delete the queue** — it has never existed on disk, and its consumer hard-filters to `agentvibe` while
recording failures as successes (`status: ok ? 'consumed' : 'consumed'`).

**Localhost is not a security boundary.** The `DECISIONS.md` entry of **2026-08-15, “RCEs closed by allowlist,
not by an Origin check; and the Origin check was a CEO error”** binds the wording — cited by date and title
because line numbers into that file rot on every eviction, and this one did: describe the control as
*"blocks cross-site browser requests"*, never *"blocks drive-by"* — `same-site` is allowed, and a non-browser
local client sends no such header. Three confirmed RCEs (2026-08-14) survive localhost untouched, because the
hostile input is a **filename**, not a request. Once the server spawns agents, **the trusted-projects
allowlist stops being defence-in-depth and becomes the primary control.** Two required changes: exact-path
equality must become canonical-prefix containment (it currently refuses `/proj/.worktrees/x` when `/proj` is
trusted — the common case, and the one that will make someone widen the list carelessly), and Mission Control
paths must stop classifying as `tier=lite, matched=(none)`.

---

## 7 · Memory

**`DECISIONS.md` has 91 bytes of headroom** — 23 entries, 39,909 bytes, 40,000-byte CI-blocking cap. The
entry cap (50) is at 46% and **will never bind**. CLAUDE.md tells every agent it has "≤50 entries (archive
when full)", so every agent believes it has 27 entries of room. **Fix the sentence in the same PR as the
mechanism**, or the next author walks into a red build holding a wrong model.

**Eviction — typed and dependency-linked, not by recency.** The type keys already exist: every entry carries
`Reversibility:` and `Affects:`. An `irreversible` entry is never archived while its subject exists; a
`reversible` entry whose `Affects:` targets are all deleted is archivable on sight. Pin anything cited by a
live claim, reusing the dangling-`supports:` check that already exists. Archival must leave a residue —
either a surviving `kind: pattern` or `superseded_by:` — or it is deletion with extra steps. **And cap the
archive**, which is currently 18,538 bytes checked by nothing; otherwise the pressure simply relocates.

**Semantic layer as a claim kind, not a new store.** `kind: pattern`, `scope: project|global`, `assert:` one
sentence, `evidence:` ≥2 episodic citations, plus `counter_evidence:`. This inherits Rule 9 expiry —
**which is consolidation-with-forgetting, already built** — Rule 10's `unresolved ≠ pass`, the index
reproducibility check, and the sweep clock. Retrieval is the two-tier cure's third application: an INDEX
emitted inline (~1.5 KB), then one record read on demand (~600 B). **The 4,096-byte inline threshold caps
this at ~25–30 patterns per project, and the cap is the feature** — it forces the eviction above.

**Mem0: DELETE.** `package.json` declares **no `dependencies` key at all**. Eight sites to change; four of
them are caught by a blocking check if missed. **Keep** `AGENTS.md:102`, the `DECISIONS.md` entry of
**2026-08-11, “Capabilities: enforce what the runtime enforces, delete the decoration”** (evicted 2026-08-22;
body now in `DECISIONS_ARCHIVE.md`, stub in place — cited by date and title, not line number), and
`.claude/workflows/research.js:134` — the last is *accurate*, describing the machine's user-scope servers
rather than a capability any agent holds. Do not let a sweep delete a true statement.

**Also true, and worth its own line: zero of the 18 agent files mention `.claude/memory/` at all.**
`session-start.js` injects lenses, playbooks and the sweep, and injects **no memory**. The memory files are
budget-enforced in CI and read by instruction only.

---

## 8 · Intake

**Linear cannot work as asked.** Both vendors document it: Linear requires *"a publicly accessible HTTPS,
non-localhost URL"*; Notion says *"Endpoints in localhost are not reachable."* And Linear's Agents API is
webhook-native by construction — delegation creates an `AgentSession` and starts a **10-second clock** for
the first activity. Polling cannot honour a deadline learned at the next poll. **So polling buys issues, not
agents** — and GitHub already provides issues, in a repo already in use, with `since` + `304` and 5,000 req/hr.

Per decision 8: **local-first board against the existing dispatch queue**, written so a webhook receiver can
be added without redesign. The queue is the seam; every intake source appends the same validated line.

**The daemon is already owed.** `consume-dispatch.ts` needs a human to run it today. One local long-lived
process is required whether or not anything external is integrated — and **nothing on this machine runs
anything** (`ledger-sweep.yml` runs in the cloud and cannot reach the Mac). Introduce it explicitly as the
repo's first daemon; do not smuggle it in.

---

## 9 · Scale to "any company"

The roster stays at 7. Domains are data. But two structural gaps make this harder than it sounds:

- **`qa-tier-floor.yml` is path-keyed.** The one classifier tiers *files in a git repo*. A supplier
  contract, a hire, a lease, a physical-goods spec — none has a path. This is the deepest structural gap.
- **The resolver registry is closed** — `source` (URL), `command` (exit code), `judge` (panel), and the
  classifier throws on anything else. A non-software company's facts are routinely verified by neither a URL
  nor an exit code. Extending the set is real design work; you cannot stub it.

**And `lenses.yml` needs the two-tier split before domains multiply.** 8,843 bytes / 8 lenses today; any
engine loading its lens reads all of it. At 20 lenses that is ~22 KB — the `MANIFEST.json` failure exactly,
which cost ~15,000 tokens across 147 entries. Split it *before* adding operations, finance, sales, legal and
people, not after.

Playbook coverage today: `ship-feature`, `design-pass`, `launch-landing-page`, `price-a-product`,
`validate-a-market`, `research-question`. **No ops, no customer, no product playbook**, and `/fix` runs
`ship-feature` unchanged — an incident has no distinct stage set.

---

## 9.5 · Second wave — the surfaces the first plan left empty

A first draft of this document covered the spine and left roughly half the system unplanned. Eight lanes
were dispatched to close it. What follows is what changed; all findings `VERIFIED-BY-EXECUTION`.

### The roster is not an open question — it is a documentation problem

`schema-lint.js:59` (`ENGINES`) plus `checkEngineRoster()` (`:770`) **already fail a build in both
directions** on roster drift. Disk truth is seven engines + eleven shims, and it is enforced. The "three
contradictory definitions" are **superseded text, not live policy**.

- **`framer` survives.** `git log --follow` shows two commits, no deletion. `schema-lint.js:753-761` records
  why: *"the founder's decision of 2026-08-16 keeps `framer`; this check is what makes any future
  disagreement fail a build."* The brief ordering its deletion was **superseded, not ignored**. Two further
  reasons: `ROSTER-SIZE.md` §7.6 cuts framer for holding only a *denial*, while its own §2 states the
  exception that a denial which must hold on the `Agent` path earns a file — §7.6 ignores the clause §2
  wrote. And deleting it **orphans the `product` lens** (`lenses.yml:84`, `applies_to: [framer]`), which
  `schema-lint.js:1256` then fails.
- **`operator` and `instrument`: do NOT create them.** PR #94 armed **half** of the precondition. There is
  **no `network` block** in `.claude/settings.json`, and `scripts/sandbox-config.test.mjs:140` asserts
  `network.allowedDomains` **must not be set without founder input** — egress control is deliberately
  withheld *and tested for its absence*. Filesystem containment landed; egress did not. A credentialed
  container today is a well-labelled front door beside an open window. Also, `operator`'s sole gate has no
  consumer: `grep -rIl outbound-approval` across workflows, scripts, `.github` and `bin` returns **nothing**.

**The grant rule, worth preserving as doctrine:** a job earns its own file only if it needs a capability that
can only be *added* in frontmatter. Verified against the binary — `disallowedTools` and `bashCommandClamp`
exist on `agent()`; **there is no additive `allowedTools` anywhere.** So: *a denial you forget fails open; a
grant you did not make fails closed.* Everything else — model, effort, isolation, persona, domain, procedure
— is dispatch data, which is why domain is a lens.

### Two landmines, both dormant until the migration

**A skill's `allowed-tools` SUBTRACTS from the agent that loads it.** It is a ceiling, not a grant
(`schema-lint.js:961-975`). `impeccable` clamps to `Bash(npx impeccable *)` — no Read, no Write, no MCP —
and **`impeccable` is the skill the roster spec assigns to `designer`**, whose whole purpose is a perception
loop it would then be unable to reach. No agent declares one today, so it costs nothing now and **fires
exactly when the roster migration attaches them.** Strip the field from the skill first.

**Three agentTypes already resolve to nothing.** `check-dispatch-agenttype.mjs` parses only
`.claude/workflows/*.js`; **`design-screen.md` is `.md`** and is not parsed. It names `product-designer`,
`design-critic` and `design-polisher` — verified absent from both `.claude/agents/` and `~/.claude/agents/`,
so all three **fall back to `general-purpose` with tools `*`**. The un-shadowing hazard the eleven shims
exist to prevent is **already live, in a file no shim covers.** Close the parser gap before touching a shim.

### Skills: the router is not underused, it is bypassed by design

Measured by spawning a real engine and having it introspect: **an engine sees only its declared skills, as
full bodies.** `builder` saw 2, not 134. Injection does not compete with the router — it *replaces the
catalogue*, so "20 MANIFEST reads vs 4 router reads" is the expected output of the design, not a usage
failure.

```
orchestrator  3 skills  30,583 B   8,266 tokens   ← paid EVERY session; it is the entry point
framer        2          8,565     2,315
reviewer      2          7,303     1,974
reviewer-ro   2          7,303     1,974
designer      1          3,591       971
sourcer       1          2,934       793
builder       2          2,803       758
                                  17,051 total
```

**The unlinted container now outweighs every linted one combined** — 30,583 B of skills on `orchestrator`
against 25,294 B for all lenses and playbooks together. And the content fails the library's own test 2:
`multi-agent-patterns` explains multi-agent systems *to the multi-agent orchestrator*, at 5.5× the size of
`orchestrator.md` itself.

**Recommendation: cut the injected set, keep the 134 on disk** (an unread file costs zero, and deleting
breaks two passing checks). **Gate the cut on one A/B run of a real playbook** — measuring bytes rather than
behaviour is precisely how the `near_duplicate` error happened, and nine of 37 cuts were wrong that way.

Both mechanisms are right for different jobs: **injection for the 1–3 skills an engine needs every run;
the router for the rare miss.** A skill earns injection only by clearing an anchor floor *and* being needed
every run.

### Documents: delete three, generate one, arm three claims

- **`PRD.md` (65 placeholders) and `BACKLOG.md` (29) — DELETE.** Both are unfilled templates presenting as
  sources of truth. `PRD.md` also instructs `product-lead`, an agent the Phase 4b collapse superseded — a
  document naming an owner who cannot produce it will not be produced. GitHub issues are the live tracker.
- **`ENGINEERING_PRINCIPLES.md` — split.** Principles 1–8 are genuinely written; move them into
  `review-lenses.yml`, where a lens can carry them (principle 2 *is* CLAUDE.md rule 6, currently ADVISORY).
  Delete the remaining 27 placeholders, including a Tech Stack table that duplicates CLAUDE.md's.
- **`docs/08-agents_work/INDEX.md` — generate it.** Frontmatter is present in **90 of 91** session files;
  generate with `--check` in CI, the `gen-codebase-map.mjs` pattern.
- **`MODEL-DIVERSITY.md:591-593` authored three claims — id, assertion, exact command, expected exit — and
  registered none of them.** `ledger locate` returns "no claim" for all three. All three still **pass**
  today, so registering them costs nothing and is binding from that moment. **Design the lint that fails
  when a document defines something claim-shaped the ledger cannot resolve** — the exact analogue of the
  existing rule that a *citation* of a nonexistent claim fails, extended from citation to definition.

**The session-file cap is wrong and 89% violated.** 81 of 91 files exceed CLAUDE.md's "≤10 lines", and
`check-memory-budget.mjs` never looks at sessions. The largest, at 312 lines, is **the most valuable file in
the directory** — it carries the finding that false claims die to execution and never to re-reading. A
10-line rule would have deleted it. Replace the line cap with a **content contract**: require
`decisions:`, `corrections:`, `claims_touched:` in frontmatter, cap prose at ~40 lines. A session file exists
to record *what a future session would otherwise re-derive wrongly*; everything else is in git.

**And one honest limit on §0's rule.** "A superseded statement must be marked as superseded at the point of
citation" is **half mechanisable**: the `git:<path>@<rev>` form makes the old text retrievable without
keeping it present-tense, and that part is enforceable. The other half — that such a citation may not be
*phrased* in the present tense — is not mechanisable by any linter. Stated plainly rather than pretended.

### The engines: one is unreachable, one is blindfolded, one class has no procedure

- **`framer` is dispatched by nothing.** `grep -rn framer .claude/playbooks/ .claude/workflows/` → **zero hits.**
  Stage-engine counts across all six playbooks: `builder` 4, `sourcer` 4, `designer` 2, **`framer` 0** — while
  **five of eight lenses name it in `applies_to`**, more than any other engine. `price-a-product.yml` has a
  `frame` stage *and* a `model` stage — framer's exact job, and `framer.md:41` names "a pricing case" as its
  canonical output — and **neither carries a `dispatch:` block.** So the framing work silently falls to the
  orchestrator, *which never implements.* **The playbooks are the defect, not the engine.** This is also the
  strongest argument that framer survives.
- **The designer's perception loop WORKS — and its own file recommends the path that doesn't.** Dispatched
  live: 24 `mcp__playwright__*` tools arrived, `browser_navigate` returned a snapshot,
  `browser_take_screenshot` wrote a PNG. So `c-mcp-grant-binds-through-agent-dispatch` **reproduces as PASS**;
  issue #90 is non-determinism, not a config break. But the documented Bash workaround at `designer.md:82-98`
  **fails under the armed sandbox** — Chromium dies with `mach_port_rendezvous ... Permission denied (1100)`
  and succeeds only with `dangerouslyDisableSandbox`.
- **And the one workflow that dispatches `designer` cannot use the loop even when it works.**
  `.claude/workflows/design.js` comments that Explore "has to produce a rendered artifact and then look at
  what rendered" — while `VARIATION_SCHEMA` (`:33-44`) admits only `angle, concept, layout, rationale, risks`.
  All prose. Critique then scores `JSON.stringify(variation)`. **It is a panel of engines describing designs
  none of them has seen.** A schema that cannot hold a screenshot guarantees there will be no screenshot.
- **Migrations have no production procedure anywhere.** `ship-feature.yml` routes "Schema change or
  migration" to `builder` with *identical* engine, isolation and exit criteria to "Server logic" and "User
  interface". Absent everywhere: expand/contract sequencing, backfill, lock duration, a written DOWN,
  testing the rollback. `builder` Step 4 is "verify by running" — but running a migration forward once proves
  nothing about reversibility, and this is the **one artifact class `git revert` does not undo**, which is why
  it is `enforcement: block` from day one. Review catches it; production procedure never existed. Fix is a
  `migration` lens, not a tenth agent.

### Evaluation: the labels have collapsed, at a second layer

**88 of 91 session files say `qa_verdict: PASS`. Zero say FAIL.** A 97%-positive label set cannot train or
test a discriminator — the identical pathology to the gate's "34 PASS, 0 refusals," one layer up.

**`.claude/skills/agent-evaluation/SKILL.md` is a truncated stub** — its body cuts off mid-sentence ("the
goal isn't 100% test pass rate—it"), its Sharp Edges "Solution" column holds comment placeholders
(`// Bridge benchmark and production evaluation`), and its `## When to Use` refers to an overview that does
not exist. **It is attached to `reviewer`** — the engine that judges everything — costing tokens every run to
load a truncated sentence. Delete or rewrite; do not leave it attached.

**Two corpus measurements that reframe earlier sections:**
- **1,297 transcripts end on `tool_use`** — the "available while incomplete" signature. §5's return-path
  defect is not a session anecdote; it is the corpus-wide default.
- **`general-purpose` (69 dispatches) outnumbers every named engine** — `reviewer` 40, `builder` 32,
  `designer` 4, `orchestrator` 1. **Most work bypasses the roster entirely.** Any plan that improves the
  engines is improving a path most work does not take.

**Design:** the unit is *the dispatch*, not the task. Golden negatives come from the **blocked PRs** (#47,
#77) — the only labeled failures in the repo — plus injected mutations of classes actually shipped here
(SSRF, path traversal). Deterministic layer costs **$0 and ~1.7s** and may fail the build; the recall layer
runs nightly, records its floor as a ledger claim with `valid_until`, and **only opens an issue** — one flaky
red build is how eval suites get disabled. Measured cost: p50 **$0.69**/run, p90 **$4.70**, full suite ≈ $25–35.
**Anti-metric: never score turns or speed.** The shared failure mode of all four engines is asserting instead
of checking, and asserting is fast.

### Telemetry: the defect is attribution, and the DAG cannot be built yet

**Zero of 11,851 event lines carry project, session, agent, pid, worktree or branch.** Naming is the small
problem; attribution is the real one. Also present: two spellings of one concept each — `detail` (3,488) vs
`details` (7), `reason` vs `reason_given` — and `ts` in whole seconds, which is why five real window blocks
share one timestamp and cannot be ordered.

**Recommendation: our own envelope, mapping to OTel later** — `{v, ts_ms, stream, project, session_id,
agent, parent_session_id, branch, data:{…}}`, using `gen_ai.usage.*` names *inside* `data` for token fields
only, since that is the one part that maps cleanly. OTel GenAI is experimental at v1.42.0 and just changed
repos; adopting an unstable vocabulary into an unversioned 3.7 MB JSONL means a rename breaks the reader
silently. **Keep one file** — separate streams force a join on `ts`.

**Do not move the log into the repo.** Telemetry is machine-scoped; the claim ledger is repo-scoped and
already versioned. That is the reconciliation §3 was missing. **But `state_dir` must become mandatory in the
template**, because the path is keyed by *session name* — so any two rolled-out projects both named
`agentvibe` collide in one log, and with no `project` field they cannot be separated afterwards. Rotate
daily: `summarizeEvents` currently does `readFileSync` whole plus `JSON.parse` per line **on every API
request**.

**The agent DAG cannot be built today and must not be faked.** No spawn parentage is recorded and
`isSidechain` is a boolean — **a boolean yields a star, not a tree, and would look authoritative.** Ship the
burn sparkline and the session swimlane first; both draw on fields that already exist.

**Cost, honestly:** keep refusing dollars until a `prices.yml` exists where each entry carries `source_url`,
`retrieved` and `valid_until` — **which makes a price a claim**, subject to Rule 9 and `claim-freshness`, so
an expired price renders `Unavailable` rather than a stale number. ~30 lines, and it is this repo's own
mechanism for facts that go stale silently.

**And do not add a fourth `eventsPath()`** — three already exist (`ledger.mjs:94`, `budget-guard.js:57`,
`projects.ts:224`) with a documented deliberate divergence. Extract; do not add.

### Authority: three of six enforced, and the reviewer holds a shell

Probed live, `VERIFIED-BY-EXECUTION`:

| Authority | Enforced? |
|---|---|
| Only `orchestrator` dispatches | **ENFORCED** — `reviewer-readonly` reported its complete tool list as exactly `Read, Glob, Grep`; no Agent/Task function present |
| The binding judge cannot touch what it judges | **ENFORCED** — Write/Edit/Bash report "tool not present in my schema": *absent*, not refused |
| `reviewer` is read-only | **REFUTED** — see below |
| CEO cannot override QA | **PARTLY** — `gate-logic.mjs:43-48`'s deterministic P1 override is real code and binds *inside* `qa.js`. Nothing forces the orchestrator to run `qa.js` or honour its return |
| Irreversible → founder | **ADVISORY** — prose only |
| Anyone can stop a run | **ABSENT** — no engine or workflow shape can halt another |

**`reviewer` declares `tools: [Read, Glob, Grep, Bash]`.** A live probe executed a shell write and
`probe-readonly-engine.sh --report` now prints **FAIL**. `reviewer-readonly` correctly holds no shell — the
isolation PR #47 bought is real, but only for the binding judge.

⚠ **Correction to the probing lane, and to the probe script itself.** The lane reported that
`sandbox.filesystem.allowWrite` "includes `.`, the worktree under review." **It does not** — measured, it is
exactly `["~/.agentvibe", "/private/tmp/claude-501"]`, and the probe wrote to the second. And the probe
script's own FAIL text says *"the `tools:` field does not bind and the declaration is decorative"* — **also
wrong.** The field binds *exactly as declared*; `reviewer` wrote because it was **granted** `Bash`. **The
defect is the grant, not the mechanism**, and a script whose failure message misdiagnoses its own finding
will send an implementer to fix the wrong thing.

The residual risk is nonetheless real: the sandbox is a *Bash* sandbox with a documented escape hatch, which
CLAUDE.md itself calls **"a guardrail against accident, not containment against the agent."** Fix by
dropping `Bash` from `reviewer` and serialising the diff into its prompt — exactly as `qa.js` already does
for the judge — or by hook-refusing mutating shell for review engines.

**Retire a caveat:** nested spawn is now confirmed **write-capable and outside plan mode** (a depth-2 child
executed a shell write). Note separately that a teammate **cannot** spawn a *named* teammate — the roster is
flat; unnamed subagents work.

### Loops: the shape the founder asked for does not exist

Six loop shapes exist in the workflows — fan-out+join, retry-until-shaped, per-item pipeline, judge panel,
loop-until-dry (`qa.js:279`, the only real loop), and sub-workflow chaining. **All six are one-shot
production plus judgement. No verdict ever feeds back to a producer.** `qa.js` BLOCKs and stops;
`coding.js` returns `BLOCKED_BY_QA` and stops. **Loop-until-converged — build → review → fix → re-review — exists
in one engine's prose (`designer`) and zero workflows.** That is the gap, and it is what "agent loops" means.

**Terminate on evidence, not turns.** Measured across 2,694 transcripts / 179,808 turns: **1,298 subagent
runs end on `tool_use` against 794 on `end_turn` — 50.3% end mid-tool.** Main threads finish cleanly ~94%;
subagents ~31%. `max_tokens` at terminal: **zero** — the output ceiling is not the killer. And **there is no
`stop_reason` for a `maxTurns` cut; it is not in the enum. `maxTurns` binds, and binds silently.**

So caps are not termination conditions — they are timers with no signal. Declare a **dryness predicate**
before the loop runs (two consecutive rounds yielding zero new ids, as `qa.js` already does), and return
**`stopped_by: dry | rounds | budget | dropout`**. `qa.js` logs which fired but does not *return* it, so a
caller cannot distinguish a converged sweep from an exhausted one. **That one-line difference is the
difference between a loop and a timer.**

### The return contract, and why shared state beats messaging

**`return_contract.required_fields` is declared on all seven engines and nothing validates a return against
it.** `schema-lint.js:583` admits this in its own comment. Worse, the two can already disagree unnoticed:
`builder.md` requires `verification` and `claims_emitted`; `SLICE_SCHEMA` requires neither.

The enforcement exists one layer down and is proven — `agent(…, {schema})` plus an explicit shape check, as
at `qa.js:223` and `coding.js:94-98`. Three parts to generalise it:

1. **Make `schema:` mandatory at every `agent()` site**, checked by extending `check-dispatch-agenttype.mjs`
   (already blocking in CI, already parses every dispatch site), deriving required fields from the target
   engine's own `return_contract` — one declaration, both uses.
2. **Three outcomes, never two: `COMPLETE` · `BLOCKED` · `NO_RETURN`** — carrying `attempts` and
   `stopped_by`, so "went idle without transmitting" is a **datum the caller receives**, not an absence it
   must infer.
3. **Write a dispatch record.** Nothing today logs *"I dispatched X at T expecting fields F"*, so a silent
   dropout is indistinguishable from a dispatch never made.

**And do not rebuild messaging.** The measured argument is decisive: messaging requires both ends live, and
**50.3% of subagent runs end mid-tool.** A message to an already-dropped agent is lost silently; **a file
written before the drop survives.** The dispatcher is the bus — it reads returns and composes the next
prompt — which is precisely why `Task` belongs to `orchestrator` alone, and that monopoly now enforces.

---

## 9.6 · Thinking above the plan — seven additions

Three lanes were sent to find what the plan did not contain at all, rather than what it got wrong. Seven
items were adopted. All findings `VERIFIED-BY-EXECUTION`.

### The foundation that does not hold

```
40 claims  ·  verified_by:  command 37 · source 1 · judge 2
           ·  kind:  external-fact 1  ← the deliberate canary
```

**92.5% of the claim ledger is a shell command run against this repository.** ADR-001 rejected a diff gate
because it *"gates the recoverable class and leaves the unrecoverable class entirely ungated."* Nine phases
and ~5,880 lines of machinery later, **the ledger gates the recoverable class and leaves the unrecoverable
class entirely ungated.** It did not escape the diff gate's domain limit; it re-derived it under a new name.

It is **structurally blocked, not late**: a claim is emitted by writing a fenced block into a git-tracked
file, and `sourcer` — the only engine with network reach — **has no `Write`**. The ledger's domain-general
half has no producer.

**And the tax is a selection effect.** 854 bytes per claim, ~147 LOC of machinery per claim, 0.4 claims per
commit — all low, and *that* is the finding. *The tax is not paid in what gets decomposed; it is paid in what
does not.* Zero pricing decisions carry a claim. It reads as near-zero until the first real venture claim,
when it arrives at once.

### Adopted — containment

1. **Egress control.** The system holds all three legs of the lethal trifecta — private data, untrusted
   content, external communication — and isolates only **writes**. `sourcer` exists to fetch untrusted web
   content in a process holding an API key and push rights. `SANDBOX.md:75` already documents
   `network.allowedDomains` as *"Requires Founder input — not set here"*, and `sandbox-config.test.mjs:140`
   asserts its absence. **The knob exists and was waiting on a decision.** Deny-by-default allowlist.
2. **Kill switch and undo.** Two independent lanes converged: zero hits for `rollback|revert|undo` in
   `bin/warroom`, and nothing halts a running subagent mid-flight. `warroom halt <N>` (SIGINT to the pane)
   and `warroom undo <N>` (`git reset --hard @{1}` in the worktree). Five Eyes guidance directs operators to
   design for reversibility and containment from the outset.
3. **Skills supply-chain scan**, recorded as a ledger claim with expiry. 134 skills were vendored from a
   public upstream and never scanned; an external scan of 3,984 agent skills found 36.8% carrying at least
   one security flaw and 13.4% a critical one. **One vector is already clear** — measured here, 349 files
   under `.claude/skills/` contain **zero** Unicode Tag characters (U+E0000–U+E007F) and zero zero-width or
   bidi controls. That clears the invisible-character attack, not the corpus: 91% of confirmed malicious
   samples used prompt injection, which lives in readable text. **`CURATION.yml` records why each skill was
   *kept* — a curation decision, not a safety verdict.**

### Adopted — the resource that actually binds

4. **Meter founder attention the way tokens are metered.** This is the finding no document contained.
   The system has a precise, enforced, event-logged meter on **tokens** — cheap and elastic — and **no meter,
   no claim, no lens and no plan item** for **founder attention**, which is fixed at one person and is the
   denominator of every scaling item here. Three of seven playbook gates are `founder-approval`; nine
   decisions are locked and several pending. **P3 adds surfaces that request attention, P5 adds domains that
   request approval, P6 multiplies projects.** Ten agents do not need ten times the tokens as much as ten
   times the approvals, and there is one approver.

   Measure: approvals requested per week, time-to-approval, and runs blocked waiting. Approvals are already
   discrete events and the log already exists, so this is nearly free alongside the P2 envelope. Then **every
   plan item declares what it adds to that draw**, exactly as it already declares its enforcing mechanism.

   Its sibling, stated once: **nothing in this system has ever been read by anyone who did not write it.**

### Adopted — the foundations

5. **Give `sourcer` a write path** — a narrow append, or a checksummed handoff. Transcription is precisely
   where a character-for-character quote drifts, so the checksum is required either way. This is the single
   change that unblocks the ledger's domain-general half.
6. **Name the transaction gap honestly.** A lens is `procedure[] + refuses[]` — an ordered single-pass
   checklist with no state and no addressee. It carries **analysis**, not **transaction**: a negotiation has
   a counterparty who responds, a BATNA that moves, and state that survives between turns. The config
   already admits the consequence — *"this repository has no outbound-send path to name"* — while
   `launch-landing-page.yml:39` carries `gate: outbound-approval`, gating a channel that does not exist.
   **17 of 22 playbook `criterion()` exits carry no `verified_by`.** `price-a-product.yml` has six criteria
   and one claim, and that claim is dispatched to the engine that cannot write claims — **every one of its
   exits is unenforced or unproducible.** Stop claiming "any company is cheap"; it is demonstrated only for
   companies whose work is *documents about decisions*.
7. **An oracle for quality, not only correctness — scope before committing.** Every lens is a refusal list.
   The system can prove an artifact is *not wrong*; it has no mechanism that says an artifact is *good*.
   `customer-value` exists as a review lens with **no claim kind and no resolver**. For pricing, copy and
   product, "not wrong" is a floor, not a deliverable. Deepest gap here, and the hardest — it is adopted as a
   scoping task, not a build task.

### Considered and not adopted

**Scoped short-lived credentials.** Correct by external guidance, and deferred: it is a larger change than
the other three and it interacts with the `operator`/`instrument` decision that is itself blocked on egress.
Revisit once item 1 lands.

### Decision 10 — the early-evidence hedge was declined

A lane proposed the cheapest hedge available: write **one** real `kind: external-fact, verified_by: source`
claim about a live decision this week, and push it through CI unchanged. ~30 minutes, no venture, no
violation of decision 02.

**Declined; the sequence stands.** Recorded with its cost rather than argued again, because this is the
third refusal of an early-evidence move. What is deferred to P5/P6 rather than learned now: whether `sourcer`
can produce the artifact both business playbooks demand of it; whether `claim-source` has ever resolved a
non-canary payload; and whether the shadow corpus contains any instance of the class being promoted.

**One consequence is dated and does not wait for the plan.** The shadow-mode promotion review falls
**2026-09-08**. Measured: 9,790 `claim.would_block` events over nine days, 42 distinct claims, four
artifacts — **100% harness self-description, and 36% of the corpus is the canary firing.** Promotion to
blocking will therefore be calibrated against a workload sharing no properties with the one it governs.
That review is a date on the calendar, not a plan item, and it arrives whatever the build order is.

---

## 10 · Killed, with reasons

| Item | Verdict |
|---|---|
| **Ghostty embedding** | `libghostty` is alpha; only `libghostty-vt` (parsing, no rendering, no input) exists. Author says not for production. **2027+** |
| **Zellij migration** | 133 call sites for pane control agents cannot reach, on a surface being demoted |
| **3D graphs** | Interpretation accuracy *declines* vs 2D. An agent DAG is a 2D hierarchy; a Z-axis encodes nothing |
| **xterm.js + node-pty** | On localhost, `tail -f` on the transcript renders the same content with no PTY lifecycle. `tmux attach` is one keystroke |
| **The typed message bus** | Zero messages since 2026-08-11. Replace with the card comment thread |
| **Pixel-art office** | **Not killed — SPECULATIVE.** `pixel-agents` is MIT, Kenney assets CC0. A glance-check on real telemetry, never the telemetry. **Avoid LPC assets — the copyleft propagates** |
| **Linear / Notion now** | Vendor-documented "no" for localhost. Revisit with a tunnel if remote filing becomes real |

---

## 11 · Sequence

**P0 — the gate.** `run-gate --require` in `cmd_merge` **and** the CI-signed check-run — **both, because
neither covers the other's route** · `branch -D` → `branch -d` · verify and enable branch protection
(PR route only) · oracle-first ordering · unforgeable `subject`-hash verdict · `claim-judge-external` with
attestation · credential `denyRead` as directories · fix stale `MODEL-DIVERSITY.md` in the same PR.

**P0.5 — provenance, promoted out of P1 by adversarial review.** P0 *adds* `judged_by` and attestation
entries, i.e. **more citations into the very files whose provenance cannot travel.** Fixing provenance to a
content hash first means everything P0 adds is born portable; doing it after means P0 spends a week making
P1 more expensive.

**P1 — the rest of portability** (decision 9). One launcher generation · `newproject` update path · fix the
misleading `schema-lint` message · template substitutions.

> **`newproject` is not in this repository.** Verified: `git ls-files | grep -c newproject` → **0**; it
> lives at `/Users/adamks/bin/newproject`. So P1's first deliverable **cannot be tested by any CI here or
> reviewed by any PR here** — which is the "control that gates nothing" class §0 is about. Either vendor it
> into the repo or state plainly that this deliverable ships ungated.

> **`warroom-install.mjs` cannot render a per-project launcher.** `:53` `PROGRAM_SRC = REPO/bin/warroom`,
> `:263` `fs.readFileSync(PROGRAM_SRC)` — a **byte copy, not a render**. Its "0 placeholders" is not
> modernisation; it does no templating at all. So "one launcher generation" is unbudgeted build work, not a
> consolidation of two existing renderers.

**P2 — substrate.** Restore `Turn.stop` (one line) · derive the join key · delete the sidecars and the
message bus · real liveness · split the event log · **stop tests writing to the live log**.

**P3 — surfaces.** Kanban · dispatch spawns detached · trust allowlist containment · two charts · MC risk
tiering. Then the agent graph.

**P4 — memory.** Eviction · `DECISIONS.md` cap truth · semantic patterns · delete Mem0.

**P5 — scale.** Two-tier lenses · new domain lenses · ops/customer/product playbooks · resolver extension.

**P6 — Phase 9 rollout**, unchanged and last.

---

## 12 · What this plan does not settle

- **Decision 2's cost.** Stop condition 6 ("no venture work during the rebuild") becomes permanent by
  design, and stop condition 7 ("a mechanism nothing invokes within two weeks") is at maximum exposure —
  every mechanism built pre-venture has no invoker by construction. The plan's own line is *"a stop
  condition written as a sentence is not a stop condition."* **Retire both explicitly with the cost stated,
  or they become decoration.** This is the fourth refusal of the same recommendation; the previous three
  failed to record it as a decision.
- **The roster number.** `ROSTER-SIZE.md:676-678` gates whether `operator` is real — and therefore whether
  the roster is seven or six — on a policy question about deploys, migrations and money. No real venture, no
  answer.
- **The shadow-mode promotion review**, due 2026-09-08, will rest on a corpus of one atypical
  self-building project.
- **Three contradictory roster definitions** remain on record; `framer.md` is still on disk despite a brief
  instructing its deletion.

**Named by adversarial review as things this plan leaves untouched — §12 was the comfortable subset:**

- **The prompt-craft standard.** `check:prompt-standard` is a blocking step in `npm run check`, it gates
  **every** edit under `.claude/agents/`, and **P0, P2 and P3 all edit agent surfaces.** This document
  mentioned it exactly once, in §13's "not read" list. That is the plan's largest unbudgeted constraint.
- **Skills are barely used** — 20 `MANIFEST.json` reads against 4 router reads, because skills inject via
  frontmatter pre-turn-1, which is *why* the router nobody asked for goes unread. No P-item addresses it.
- **The second risk classifier** in `qa-lead-pass.yml` was reconciled once, never de-duplicated — against
  ADR-001's "one file computes the tier of a path."

## 13 · Not covered

Two of thirteen agents did not report: `adversary-architecture` (the adversarial pass on this document's own
thesis) and `design-interop` (verified Codex CLI invocation flags). **Codex's actual non-interactive
invocation is therefore UNVERIFIED** — it is a contract to confirm at provisioning, not a measured fact, and
nothing here should be implemented against a guessed flag.

**The expensive limit, which an earlier draft hid behind cheap ones:** nobody measured whether this repo is
**green right now**. Every P0–P6 estimate assumes a clean baseline that was never established. (`npm run
check` is **26** blocking steps, not the 25 stated elsewhere in this repo's documentation.)

**Two further corrections from adversarial review, both material:**
- **`Turn.stop` is not one line.** `mission-control/server/index-store.ts:31` persists `turns: Turn[]` in an
  on-disk store keyed by `size + mtimeMs + boundaryHash`. Entries restored from that cache predate the field
  and `needsVerify` will not fire, because the *file* did not change. One line in the interface; a **cache
  migration** in the store. This was the document's archetypal "highest-leverage one-liner" and it was wrong.
- **`events.jsonl` lives at `~/.agentvibe/`, outside any repository** (11,845 lines, not 11,818). P2's
  "split the event log" and "stop tests writing to the live log" both operate on a file that travels with no
  project — which silently contradicts §3's portability thesis and is nowhere reconciled.

No agent ran `npm run check` to completion; the sandbox refuses `.git` creation, so no true fresh-clone test
was performed. **The adversarial pass was a single model family and is therefore not an independent panel** —
the exact deficiency §4 exists to fix, applied to this document's own review. §§6–11 received a lighter pass
than §§3–5. Not read in full: `ROSTER-SIZE.md`, `PROMPT-STANDARD.md`, `ORCHESTRATION.md`, `CAPABILITY.md`,
`GRANT-HOLDERS.md`, `CONTROL-PLANE.md`, and 90 session files. Mission Control test *assertion quality* is
unverified beyond test names.

---

*Written by ceo (`ceo-2-1787176362`), 2026-08-20. Every figure marked verified-by-execution was executed.
Where something was not measured, it says so.*
