> **HISTORICAL — superseded by [docs/STATUS.md](../../STATUS.md).** Retained for the record.
> Read STATUS.md for current state; nothing here is a live instruction.

# Handoff — the system is real now; find out what it is for

**From:** ceo (`ceo-4-1787176363`) · **Date:** 2026-08-24 · **Base:** `main` = `f5c62ba`

> This is deliberately not a plan. The last four handoffs were plans, and each was followed faithfully
> into more infrastructure. You are being given the map, the measured constraints, and the open
> questions — and the authority to decide the route yourself. Where this document says something is
> true, it was executed. Where it tells you what to *do*, there are exactly four such places and they
> are marked.

---

## 1 · Where things actually stand

**`main` moved on 2026-08-23 for the first time since before 2026-08-20** — `5b8e127` → `f5c62ba`, nine
branches in one train. Before that, eight sessions of work sat unmerged. That is the most important fact
about how this project has been operating: **it produced far faster than it landed.**

**P0 is closed except item 6.** Live on `main` now:

| Landed | What it means |
|---|---|
| `scripts/verdict.mjs` | A verdict is `sha256` of the diff it reviewed. It cannot be inherited by another branch, and it survives its own commit |
| `qa-lead-pass.yml` blocks | The author-written `qa_verdict: PASS` grep is **deleted**; a check-run signed by `GITHUB_TOKEN` replaces it |
| `qa.js` oracle phase | The deterministic suite runs **before** any review agent is dispatched. A red diff now costs 1 agent instead of dozens |
| `war-room/bin/PROJECT_NAME.tmpl` | No longer seeds a model-resolved merge into every generated project; a guard test fails if it returns |
| credential `denyRead` | `~/.gemini`, `~/.codex`, `~/.config/openai` — with the honest caveat that a filesystem deny is nothing to a keychain reader |
| `DECISIONS.md` eviction | 39,909 → 35,952 bytes. Rule 4 (leave breadcrumbs) was **literally unfollowable** at 91 bytes of headroom; it works again |

**Only P0 item 6 remains:** `claim-judge-external` (Codex CLI as a second model family). Still correctly
deferred — its non-interactive invocation is unverified, and open bug #19945 returns exit 0 with empty
stdout when detached from a TTY, which is exactly how a resolver runs. Gate on a `turn.completed` event,
never the exit code.

---

## 2 · The map

**Start here, in order:** `CLAUDE.md` (the Project State block is the only section that says where we
are) → `docs/STATUS.md` → `docs/03-system-design/TARGET-ARCHITECTURE.md` (§11 is the P0–P6 plan) → this
file.

### The roster — 7 engines, 18 files

`ls .claude/agents/*.md` gives 18. **Seven are real**; eleven are shims that exist only to keep a name
occupied, because a drifted copy in `~/.claude/agents/` would otherwise claim it.

```
orchestrator          entry point; owns state, dispatches, never implements
builder               produces an artifact in isolation, returns what landed
reviewer              read-only judgement of someone else's work; loads review lenses
reviewer-readonly     reviewer with no shell — used by the binding gate
framer                turns fuzzy into structure: specs, options, decisions
sourcer               bounded questions, sourced answers, gaps named
designer              the only engine with a perception loop
```

**Anything not on that list does not exist**, whatever an older prompt says. Dispatching a name with no
file falls through to a global copy that has drifted.

### Skills — 135, and never read the manifest

Two-tier discovery, and this matters more than it looks: reading `MANIFEST.json` whole cost **~15,000
tokens**, so every skill added made every unrelated task more expensive.

```
1. .claude/skills/routers/INDEX.md      seven namespaces, one line each   (~370 tokens)
2. the one namespace router that matches                                  (~700 tokens)
3. load 2–5 SKILL.md files
```

Routers: `ai-agents` · `business-growth` · `engineering` · `frontend-design` · `ops-delivery` ·
`quality-security` · `thinking`. Never `ls | grep`.

### The data that encodes the expertise

- **`.claude/lenses.yml`** — how to *produce* work, per domain. `evidence` is inherited by every engine.
- **`.claude/review-lenses.yml`** — how to *judge* it. **Read the `independence` field.** `security`,
  `adversarial` and `evidence` are `independence: provenance`: the reviewer must not see the producer's
  self-assessment. Every review brief written on 2026-08-23 violated that by instructing the reviewer to
  read the session file. One reviewer caught it; three did not. **A lens property that holds only when
  the brief-writer remembers it is not enforced** — that is a real, cheap thing to fix.
- **`.claude/playbooks/`** — six: `ship-feature` · `launch-landing-page` · `price-a-product` ·
  `validate-a-market` · `design-pass` · `research-question`. They declare stages and exit criteria,
  never method. The engine picks its own path inside a stage.
- **`.claude/ledger/`** + `docs/03-system-design/CLAIM-LEDGER.md` — 40 project claims. A durable claim
  carries an expiry and a resolver, so a fact that stops being true fails a check instead of sitting in
  a paragraph.

### Enforcement

`npm run check` is **29 steps**. It and `.github/workflows/ci.yml` are *different sets* — the real
condition is their union. `.claude/hooks/pre-tool-use.sh` blocks in-session.

**105 session files in `docs/08-agents_work/sessions/`. Every one is infrastructure.**

---

## 3 · The four things this document does tell you to do

**(1) Read §4 before planning anything.** Two agents were commissioned on 2026-08-24 to answer whether
this ecosystem is over-built. Acting on their answer — including changing the plan or the system — is
explicitly in scope.

**(2) Do not re-derive what is already measured.** §5 lists traps that each cost a previous session real
time. Reading it costs two minutes.

**(3) Land things.** Nine branches sat unmerged for four days across two sessions, one of them carrying
claims with a deadline. Whatever you build, merge it or say plainly why you did not.

**(4) When you assert something, name the command that produced it.** The question is not "am I
confident" but "which command produced this clause." Every false finding this project has recorded had
the *shape* of a measurement without being one.

Everything else is yours. **You are not required to follow P1–P6 in order, or at all**, if §4 says the
shape is wrong. `TARGET-ARCHITECTURE.md` §11 is a plan, not a contract.

---

## 4 · Is this system over-built? — answered 2026-08-24, and the answer is actionable

Two agents were commissioned: one to test the external research, one to measure this repo's own record.
They worked independently and converged. **The founder's suspicion is partly right and precisely
mis-aimed**, in a way that makes it more useful than if it had been simply right.

### 4.1 · The currency is wrong, and that changes the question

`docs/03-system-design/agents/CONTROL-PLANE.md:203-206` states it outright: **"token cost is
inadmissible — Claude Max $200."** Flat rate. So "more tokens" is not the cost that binds. What binds is
**rate-limit headroom in the rolling 5-hour window, wall-clock latency, and founder/reviewer attention** —
review rounds and PR count. Cost every proposal against those three, not against a token total nobody
pays per-token.

### 4.2 · The literature: the variable is correlation, not count

Non-monotonic curves everywhere — nobody found "more verification always helps," nobody found "never
helps." The sharpest result, and it lands directly on this repo's design:

> **"Nine Judges, Two Effective Votes"** (arXiv:2605.29800, accessed 2026-08-24) — nine frontier models
> across **seven distinct vendors**, Kish effective sample size: the panel supplies **≈2 independent
> votes**. Three-quarters of nominal independence is lost to shared mistakes on shared items. *"The best
> single judge matches or outperforms the full panel across all conditions. Neither adding more judges
> nor smarter aggregation helps. The bottleneck is correlated judges."*

Across **seven vendors**. This repo's panel is **one family**. Corroborating: multi-agent systems use
**~15×** the tokens of chat (Anthropic engineering); in an agentic SDLC study **Code Review alone was
59.4% of all tokens** vs Coding at 8.6% (arXiv:2601.14470); across 8 models on SWE-bench Verified,
*"accuracy often peaks at intermediate cost and saturates at higher costs"* (arXiv:2604.22750).

What the evidence says **does** pay: deterministic checks (zero correlation risk, zero marginal model
cost); **one** properly-blinded independent pass; and **selective escalation** — adding a layer only
where confidence is already low, never uniformly. Sampling for *recall* still scales; voting for
*precision* on a homogeneous panel does not.

**Named gaps, not papered over:** nobody has published a controlled layer-count ablation on a
code-review task, and nobody measures cost-per-defect-found. Those two numbers would turn "it depends"
into a decision, and this repo is one of the few places they could actually be measured.

### 4.3 · This repo's own record

**The expensive layer is not what has been catching things.**

- The 79-agent panel figure is real (`TARGET-ARCHITECTURE.md:220`), but **the review actually used for
  the last two days was single independent reviewer dispatches** — 8 rounds/3 PRs, then 9 rounds/5 PRs.
- **The highest-value fix in this repo's history was a deterministic test.** The gate's 34-PASS-0-refusal
  record existed because *nothing routed to it* (`ci.yml:168-177`). A router plus unit tests found that.
  The 79-agent panel was worthless while nothing invoked it. **Wiring tests outrank the panel.**
- PR #47's traversal, 11+2 SSRF bypasses and RCE path were caught by **three independent dimension
  reviewers** (`STATUS.md:75-84`) — not by the verify/sweep/judge apparatus stacked above them.
- PR #77's SHA-binding flaw *was* found by the full panel and 13 green unit tests missed it — a genuine
  catch. But whether it needed 79 agents or one `correctness` reviewer **is not determinable from the
  record.** Left explicitly uncertain rather than resolved in either direction.

### 4.4 · Ranked, evidenced, and none of it touches what works

1. **Re-measure the 4× retry ceiling** (`qa.js:215-218`). The single largest fan-out multiplier in the
   panel. Sized against a **~48% dropout caused by `maxTurns=20`** — which was later raised to 30. The
   file's own comment admits *"no post-fix run has yet confirmed the diagnosis."* Ceremony by inertia:
   correct when written, never re-justified after its cause changed.
   **CORRECTION, verified 2026-08-24: this item's premise is false, and its line cite is wrong.**
   `REVIEW_ATTEMPTS = 4` lives at `qa.js:281`, not `:215-218` (that range is inside
   `verifyPrompt()`'s template literal, unrelated to the retry ceiling). And the 4x ceiling was not
   sized against a turn cap: `qa.js:270-272` says a turn cap was one of four explanations for the
   ~48% dropout, "tested against the transcripts and all four were refuted" — "successes reached 43
   turns, failures started at 37." The dropout is unexplained, not `maxTurns`-caused. What IS real is
   the *contradiction*: `qa.js:180-198` still blames `maxTurns` for 13 of 20 dropouts (a separate,
   earlier measurement) while `qa.js:264-280` refutes a turn cap as an explanation for a later,
   different dropout. Two incompatible accounts of the same failure mode sit in one file. That
   contradiction is being fixed in a separate PR — not fixed here.
2. **Build the citation-range checker.** **Five of eight findings** over two days were locators pointing
   at real content that did not say what was claimed. `ledger lint` verifies a cited ID *exists*, never
   that the range supports the sentence. This repo has recommended the fix to itself twice and never
   built it. **Highest-value not-yet-built thing in the audit** — it converts recurring review-round cost
   into a script.
3. **Close the `mcp__*` gap** (`schema-lint.js:522`). It skips `mcp__*` entries in `tools:`, commenting
   that `PS-MCP-BACKED` covers them — but that rule reads `fm.mcpServers`, a *different field*
   (`:919-935`). A fabricated `mcp__nonexistent__doAnything` in `tools:` is unchecked today. That is the
   exact fabrication pattern this linter was built to kill, recreated one field over.
4. **Demote five `PS-*` rules from FAIL to WARN.** `TARGET-ARCHITECTURE.md:242-274` constructs negative
   controls proving they are defeated by paraphrase, and recommends exactly this. Verified **not done** —
   all five still take the failing path at `schema-lint.js:625-674`.
5. **Stop re-litigating the settled model-family question.** Every irreversible session re-raises it
   unprompted; the founder **closed it on 2026-08-23** (single-family accepted as a risk). Update
   `qa-tier-floor.yml` / `review-lenses.yml` so reviewers stop spending output on a decided question.
   **CORRECTION, verified 2026-08-24: `qa-tier-floor.yml` is not part of the fix.** It never mentions
   model families at all (`grep -icE 'model|famil|diversity' .claude/qa-tier-floor.yml` → 0). The real
   surface reviewers actually read is `MODEL-DIVERSITY.md:3` plus `AGENT-ARCHITECTURE.md` open
   decision #3 and `ROSTER-SIZE.md` D7 — all three corrected in this PR (docs/correct-the-record) to
   say the question is closed, rather than leaving `qa-tier-floor.yml` untouched as this item implied.
6. **Sweep rounds** (up to 15 extra dispatches at irreversible tier): no defect in the record is
   attributable to a sweep round alone. Weakly evidenced either way — **re-measure, do not cut blind.**

### 4.5 · Do not cut these — the same record says so

- **Independent, non-self-graded review.** Every serious catch came from a reviewer that did not produce
  the work. The founding failure — 34 PASS, 0 refusals — was self-grading plus a dead router. This is
  the one change that provably regresses to theatre.
- **Evidence-blinding (`independence: provenance`) and the skeptic/neutral/steelman split.** This is the
  *correct* answer to single-model-family: the measured collapse was **framing bias** (defect detection
  97.2%→3.6%), not vendor identity. The repo built the cheap fix rather than the unbuildable one. Costs
  nothing — it is config, not agents.
- **Deterministic wiring/routing tests.** Cheapest things in the chain; they caught the dead gate router
  and 8 of 12 dispatch sites silently defaulting to unrestricted `general-purpose` agents holding Write,
  Edit and Bash. Do not trade these for panel capacity.
- **The ledger's expiry mechanism.** It caught the *"subagents cannot spawn subagents"* false belief that
  had silently shaped the whole topology — a defect class no diff-gate can reach.

**The through-line:** cut fan-out and correlated repetition; keep independence, blinding, and cheap
deterministic checks; and convert recurring review findings into scripts. **The property to preserve is
that the gate refused its own author.** Any lighter process that keeps that is an improvement; any that
loses it regresses to 34-PASS-0-BLOCK. Changing the plan or the system on this basis is authorised.

---

## 5 · Traps, each one measured

1. **`npm run check` never completes here.** In a session's own worktree it dies at step 8
   (`test:registration`, EPERM on `.claude/hooks/`); in a scratchpad clone it dies at step 1 (the
   deliberately-absent `.mcp.json`). Either way the `&&` chain hides every later step. **Run steps
   individually.** Full-tree baseline: 23 pass, 3 environment-only fails (`test:registration`,
   `check:mc`, `test:skill-clamp`). `check:mc` takes ~3 minutes and looks hung.
2. **`git worktree add` is denied by the sandbox.** Use a sparse clone into the scratchpad
   (`/private/tmp/claude-501/…`, which `allowWrite` grants). Exclude `.mcp.json` — writing that basename
   is refused anywhere, and **restoring it by rename is a bypass, not a workaround.** Exonerate the
   resulting lint failure by showing the diff cannot contribute to it.
3. **zsh does not word-split unquoted parameter expansions; bash does.** `node scripts/classify.mjs
   $FILES` passes the whole list as ONE argument and answers for the wrong path — it reported an
   `irreversible` branch as `lite`. **Always pipe through `xargs`.** Three separate agents tripped on
   this in one session, each *after* reading a warning about it. It wants a wrapper script, not another
   paragraph.
4. **Three hooks match command text instead of parsing it.** The git-discard rule is evaluated against
   the whole multi-line command flattened into one line, so any script containing a `checkout` token
   anywhere and a bare double-dash-then-space anywhere is refused, at any distance — **this very
   handoff tripped it while describing it.** The `npx` rule blocks the word appearing in a *string you
   are writing*. And `Write`/`Edit` refuse paths outside the project root while Bash writes there
   freely: **two controls disagreeing about the same path.** Unresolved; see §6.
5. **`git switch -c` in a session's own worktree partially fails.** It creates the branch, stages
   deletion of files unique to the current branch, and leaves HEAD unmoved. Recover with `git restore`
   naming the paths explicitly. Do docs work in a clone.
6. **Inside a scratchpad clone, `origin` is the local repo, not GitHub.** Three branches were stranded
   this way. Add a second remote, and verify with `ls-remote` that the pushed SHA matches HEAD.
7. **An idle notification is not a completion report.** An agent that stops early reports as
   *available*, which reads as finished. **Ask what moved, not what was said** — check the remote SHA.
8. **`gh` does not work** (`denyRead` covers `~/.config/gh`); `git push` does, via the keychain. You can
   push branches and cannot open PRs.

---

## 6 · Open, and only the founder can close

- **CODEOWNERS + branch protection on `.github/workflows/`.** Measured 2026-08-23: protection exists and
  did **not** bind — the push reported *"2 of 2 required status checks are expected"* and succeeded
  having run none. Required checks govern the PR route only. Until "do not allow bypassing" is set, a
  same-repo PR can rewrite the verdict step that judges it.
- **`c-rolling-five-hour-window`, due 2026-09-08.** In `~/.warroom/ledger/global.yml`, outside the
  project root; writes are refused by **both** the hook and the sandbox (probed 2026-08-24). It is
  `verified_by: judge`, `risk: high`, empty panel — so it can never resolve, only expire, and it has
  been waived twice. The real fix is re-registering it as `verified_by: source` with a vendor URL,
  making it a claim that checks itself.
- **The `Write`-vs-Bash contradiction** (trap 4). One decision, either direction.

---

## 7 · The recommendation on the table, recorded because it keeps being deferred

**Run one real venture task end to end.** This harness has been tested exhaustively against exactly one
subject — itself — and keeps finding real defects there. That is evidence the machine works and none
that it is useful. 105 session files, zero customers. `STATUS.md` has listed it next-in-order for
several cycles; `CLAUDE.md` records it as stop condition 6, *known and accepted*.

The founder's position on 2026-08-24 is **not yet** — the §4 review comes first. That is a legitimate
sequencing call, and this note is not an argument against it. It is here so the choice stays visible
instead of quietly becoming the default. Also recorded in `.claude/memory/LONG-TERM.md`.

---

*Every figure here was executed. Where something was reasoned rather than measured, it says so.*
