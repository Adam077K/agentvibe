# Token Efficiency — where the tokens actually go

*Measured 2026-08-15 against the local transcript corpus. Every repo number below carries the command that produced it.*

> **The goal is not to make agents terse.** It is to reduce waste — over-explaining, repeated
> context, unnecessary planning loops, duplicated tool outputs, redundant subagent work — while
> preserving task quality, autonomy, and the ability to spend more tokens when the problem
> genuinely requires it. Nothing in this document recommends a global cap. This repo already tried
> that: `budget-guard.js` blocked the CEO mid-session, a builder before its first commit, and a
> probe writing its own report, and was unregistered by founder decision
> ([session](../08-agents_work/sessions/2026-08-13-ceo-remove-budget-ceiling.md)).

---

## 0. Evidence standard

| Label | Meaning |
|---|---|
| **VERIFIED** | Measured on this machine. The command is given. Re-runnable. |
| **ESTIMATED** | Derived from a verified measurement by a stated method. |
| **ASSUMED** | Neither. Stated as an assumption, with what would falsify it. |
| **VENDOR** | Published by Anthropic or a cited source. Not measured here. |

Token conversions from byte counts are **ESTIMATED at 3.7 chars/token** unless stated. No
tokenizer was available (`ant` is not installed; no `ANTHROPIC_API_KEY` in the environment), so
`count_tokens` could not be called. The corpus-derived upper bound for dispatch-correlated content
is 2.55 chars/token (§2.3), so byte→token estimates here are conservative by up to ~45%.

**The instruments used.** All scripts are in the session scratchpad and are reproduced inline where
short. Corpus root: `~/.claude/projects/**/*.jsonl`.

```
VERIFIED  corpus size: 2,532 transcripts, 3,165,462,528 bytes (~2.95 GiB)
          find ~/.claude/projects -name '*.jsonl' | wc -l ; du -sk ~/.claude/projects
```

---

## 1. The headline finding

**95.2% of every input token this system has ever spent is re-reading context it had already
read.** Not the system prompt, not skills, not tool schemas — the accumulated conversation prefix,
re-sent on every single turn.

```
VERIFIED  whole-corpus token economics (2,532 transcripts, 164,393 assistant turns)
          python3 scratchpad/econ.py     # sums message.usage across every transcript

  output tokens                  104,056,606
  raw input (uncached)             8,544,586
  cache CREATION (writes)      1,253,045,546
  cache READ (re-read context) 24,841,697,374
  ─────────────────────────────────────────────
  TOTAL input                 26,103,287,506
  cache-read share of input             95.2%
  input : output ratio                250.9 : 1
```

Two consequences follow, and they set the whole shape of this document:

1. **Output is 0.4% of all tokens** (104M of 26.2B). Any intervention that makes agents write less
   — `caveman`, terser summaries, shorter reports — is operating on 0.4% of the volume. It cannot
   be the main lever, whatever its other merits.
2. **Prompt caching is already doing the heavy lifting and is near its ceiling.** At Anthropic's
   published rates the corpus cost an API-equivalent **$22,897 as it actually ran**, against
   **$133,118** with no caching — caching saved 83%. There is no second 83% available from better
   cache placement. The remaining lever is *not re-reading so much in the first place*.

```
VERIFIED  API-equivalent cost, Opus-tier list pricing ($5/$25 per MTok; cache write 1.25x,
          cache read 0.1x — VENDOR, claude-api skill § Prompt Caching)
          as-run $22,897  |  uncached $133,118  |  output-only component $2,601
```

> **Cost framing.** This runs on a Claude Max $200 subscription, not metered API. The dollar
> figures above are for *comparison between options only* and are never the decision factor. What
> binds is rate-limit headroom in the rolling 5h window, wall-clock, and context pressure.

---

## 2. Taxonomy of token waste, with measured magnitudes

Ordered by measured size, largest first.

### 2.1 Context re-read growth — the dominant sink

Each turn re-sends the whole prefix. The prefix grows. So total context read across a session grows
**superlinearly in turn count.**

```
VERIFIED  power-law fit over 2,187 sessions with >=10 usage turns
          python3 scratchpad/quad.py

  cache_read  ~  turns ^ 1.50      (1.0 = linear, 2.0 = fully quadratic)

  turns   sessions   mean ctx/turn   median total cache_read
      8        240          39,169                   331,984
     16        677          45,167                   758,920
     32        675          61,192                 1,901,192
     64        363          86,310                 5,205,347
    128        135         129,736                15,633,695
    256         62         212,245                55,644,950
    512         24         282,477               158,872,666
   1024          8         341,848               353,095,841
   2048          3         342,135               726,570,859
```

Read the last two columns together. Going from a 32-turn session to a 2,048-turn session is **64×
the turns and 382× the context re-read.** Per-turn context grows 8.7× (39,169 → 342,135) *on top
of* there being more turns.

This is the single most important number in the document, because it means **session length is
not a linear cost — it is the compounding one**, and the fix is structural (bound how long any one
context lives) rather than restrictive (cap what agents may do).

It also explains where the fleet's tokens sit:

```
VERIFIED  top 5 sessions by cache-read (python3 scratchpad/econ.py)
  1,186,827,463 cache_read for   4,963,181 output  — agentvibe ceo-1 worktree
    936,774,485 cache_read for   2,514,466 output  — etsyc ceo-6
    814,199,278 cache_read for   3,067,306 output  — evalove ceo-4
```

One session re-read **1.19 billion tokens of context** to produce 4.96M tokens of output — a
239:1 ratio, against a corpus median that is far lower at short session lengths.

**Is this "context degradation"?** Partly. The corpus shows the *cost* of long sessions clearly.
It shows the *quality* cost only indirectly: `Read` falls from 33.2% of tool calls in the first
decile of a session to 9.1% in the last, while `Bash` holds at ~50% — agents front-load reading
and then work, which is healthy, not a re-reading loop. Median output per turn rises sharply in
the final decile (8 → 178 tokens) as the agent writes its summary. I did **not** find aggregate
evidence of re-planning loops; see §8 for what I could not measure.

```
VERIFIED  python3 scratchpad/degrade.py   (1,757 sessions with >=20 usage turns)
  decile 0: Read 33.2% of tool calls, median cache_read 35,618
  decile 9: Read  9.1% of tool calls, median cache_read 154,055
  sessions showing a compaction record: 42 of 1,757 (2.4%)
```

That last line matters: **compaction is essentially unused here** — 2.4% of long sessions.

### 2.2 Tool-result volume — what fills the context that then gets re-read

Context does not grow by itself. It grows because tool results land in it. 215 million characters
of tool output across the corpus, and two tools produce 91.4% of it.

```
VERIFIED  python3 scratchpad/tools.py   (89,132 tool calls parsed across 2,532 transcripts)

  tool          calls    share    result chars       share
  Bash         45,482    51.0%      75,421,288      35.1%
  Read         18,321    20.6%     121,127,777      56.3%
  WebSearch     2,909     3.3%       7,279,345       3.4%
  WebFetch      2,986     3.4%       3,969,619       1.8%
  Edit          6,992     7.8%       1,421,529       0.7%
  ─────────────────────────────────────────────────────────
  TOTAL                            215,074,775   (~58.1M tokens ESTIMATED @3.7)

  per-call size:  Read  median 3,287  p90 16,289  p99 51,583  max 72,803 chars
                  Bash  median   558  p90  4,335  p99 15,366  max 29,613 chars
```

**Read is 20.6% of calls but 56.3% of the bytes.** And the distribution has a fat head:

```
VERIFIED  483 Read calls returned >40,000 chars, totalling 23,655,974 chars
          = 2.6% of reads carrying 19.5% of all Read volume
          largest repeat offender: docs/03-system-design/ROSTER-SIZE.md at 67,499 chars,
          read 5+ times in the corpus
```

### 2.3 Duplicated tool output — the same file, read again

```
VERIFIED  python3 scratchpad/tools.py § repeated reads
  sessions with >=1 repeat read:   554 of 2,532
  redundant Read calls:            2,725 of 10,704 reads in those sessions  (25.5%)
  median repeats/session 2 · p90 12 · max 91
  worst: 91 redundant of 138 reads — agentvibe ceo-1 worktree
```

A quarter of the reads in affected sessions are the *same path a second time*. Some of that is
legitimate (re-read after edit). None of it is free: every re-read is added to the prefix, which
is then re-sent on every subsequent turn — so a redundant 67KB read early in a 200-turn session is
paid ~200 times.

### 2.4 Dispatch-prompt bloat — small median, catastrophic tail

The `subagent-driven-development` skill (`.claude/skills/subagent-driven-development/SKILL.md:223`)
claims: *"a real session's dispatch hit 42k chars of which 99% was pasted history."*

**Verdict: the magnitude claim is VERIFIED and understated. The stated mechanism is wrong.**

```
VERIFIED  python3 scratchpad/dispatch.py   (2,412 subagent dispatch prompts)

  p50       3,518 chars
  p75       5,084
  p90      11,161
  p95      28,855
  p99     212,282
  max   1,069,297

  >= 42,000 chars:   69 prompts (2.9%)
  >=100,000 chars:   42 prompts (1.7%)
  the top 1% of dispatch prompts carry 37.7% of all 26,017,236 dispatch chars
```

42k chars is not the ceiling — it is roughly p95. The largest dispatch prompt measured is **1.07
million characters**, and the three largest were issued **by this very session's own team**
(`03e6a15c-…/subagents/`).

But the mechanism is not pasted conversation history:

```
VERIFIED  python3 scratchpad/tailcontent.py — inspecting the 3 largest dispatch prompts
  1,069,297 chars — tool_use_id occurrences: 0 · "system-reminder" occurrences: 0
    941,297 chars — tool_use_id occurrences: 0 · "system-reminder" occurrences: 0
```

Zero tool results and zero system-reminders means this is **not** a replayed transcript. It is
hand-composed briefs carrying **verbatim peer-agent output** — a board/debate pattern where each
round pastes the previous round's full text into the next dispatch. That is the
**broadcast-induced triply-multiplicative overhead** described in the multi-agent literature:
synchronization cost scaling as O(n × S × |D|) in agents, steps, and artifact size under naive
broadcast ([arXiv 2603.15183](https://arxiv.org/abs/2603.15183), accessed 2026-08-15).

The correction matters for the fix: trimming conversation history would do nothing here. Passing
**file paths instead of bodies** would do everything.

Context for proportion — for the *median* subagent, dispatch is not the problem:

```
VERIFIED  dispatch prompt as a share of the subagent's first-turn context
  median 3.2%  ·  p90 9.3%
```

### 2.5 Fixed startup overhead — real, bounded, and already partly solved

See §3 for the full decomposition. Headline: median **60,342 tokens** for a main session,
**35,769** for a subagent. Across 2,412 subagent launches that is 86.3M tokens of pure startup
(2,412 × 35,769), or **0.33% of the 26.1B total.** Startup overhead is real and worth trimming,
but it is not where the tokens are.

### 2.6 Skills discovery — a rounding error (see §5 for the router adjudication)

```
VERIFIED  actual Read tool calls against discovery files, whole corpus
          python3 scratchpad/tools.py § skills discovery
  MANIFEST.json          20 Read calls   (12 in 2026-07, 8 in 2026-08)
  CURATION.yml           15
  routers/INDEX.md        4              (all 2026-08)
  routers/<namespace>.md  2
```

Twenty manifest reads. Ever. Across 2,532 transcripts.

---

## 3. Per-agent startup overhead — measured

**Method.** For each transcript, take the **first assistant message carrying `usage`**. Its
`input_tokens + cache_creation_input_tokens + cache_read_input_tokens` is the entire context the
model was charged for before emitting its first token: system prompt, tool schemas, project
context, memory, and the first user/dispatch message. This is exact, not estimated — it is what
the API billed.

```
VERIFIED  python3 scratchpad/prefill.py
  class                      n      median      p10      p90        max
  main session              66      60,342   52,266   72,659     86,613
  subagent               2,412      35,769   13,782   45,770    452,012

  classification cross-check: isSidechain flag and the /subagents/ path agree on
  all 2,478 transcripts — 0 disagreements.
```

### 3.1 Separating fixed overhead from payload

Regressing prefill against first-message size isolates the constant:

```
VERIFIED  least squares, prefill = a + b·chars
  agentvibe subagents   n=  512   intercept 19,188 tok   slope 0.392 tok/char   R² 0.897
  all subagents         n=2,412   intercept 31,413 tok   slope 0.374 tok/char   R² 0.650
  main sessions         n=   66   intercept 64,901 tok   slope −1.247           R² 0.122  ← noise
```

The agentvibe-subagent fit is tight (R² 0.897): **~19,200 tokens of fixed harness overhead**, plus
~0.39 tokens per character of brief. The main-session fit is noise (n=66, heterogeneous tool
surfaces) — for main sessions use the distribution, not the intercept.

### 3.2 Component decomposition

Byte sizes are VERIFIED (`wc -c`). Token columns are ESTIMATED at 3.7 chars/token.

| Component | Bytes | ~Tokens | Reaches | Evidence |
|---|---:|---:|---|---|
| Tool schemas — **deferred** (names only) | ~6,900 | ~1,900 | main | ESTIMATED, §4 |
| Tool schemas — **if fully loaded** | ~296,800 | ~80,200 | main | ESTIMATED, §4 |
| Global `~/CLAUDE.md` | 5,119 | 1,384 | all | VERIFIED |
| Repo `CLAUDE.md` | 16,502 | 4,460 | all | VERIFIED |
| `AGENTS.md` | 6,587 | 1,780 | on read | VERIFIED |
| `session-start.js` emission | 25,613 | — | main | reused from lead; ~2 KB inlines, rest is a file pointer |
| Agent definition (engine) | 3,961–5,722 | 1,070–1,546 | subagent | VERIFIED, `.claude/agents/*.md` |
| Agent definition (shim) | 1,057–1,085 | ~290 | subagent | VERIFIED |
| Injected skill (median) | 4,462 | 1,206 | subagent | VERIFIED, n=134 |
| Injected skill (p90 / max) | 14,438 / 33,168 | 3,902 / 8,964 | subagent | VERIFIED |
| `DECISIONS.md` if read | 46,655 | 12,610 | on read | VERIFIED — **exceeds its own 50-entry budget in bytes** |
| Dispatch prompt (median) | 3,518 | ~1,380 | subagent | VERIFIED (@2.55 ch/tok) |

**Skills injection dominates the controllable part of subagent startup.** Skills are *injected*
pre-turn-1 via agent frontmatter, not discovered through the router — which is exactly why the
router is unread (§5). The lead's figure of **288 of 431 measured cases** receiving `skills:`
injection pre-turn-1 is reused here without re-derivation; independently, `<skill` appears in 845
transcripts corpus-wide (VERIFIED, `grep -rl '<skill' --include='*.jsonl'`).

A subagent carrying three median skills pays ~3,600 tokens; one carrying `skill-creator` (33,168 B)
plus `subagent-driven-development` (28,077 B) pays ~16,500 tokens before reading its brief.

### 3.3 Reproducing this

```bash
python3 scratchpad/prefill.py prefill.json   # per-transcript prefill + classification
python3 scratchpad/decomp.py                 # class stats + regression
python3 scratchpad/dispatch.py               # dispatch prompt distribution
python3 scratchpad/tools.py                  # tool calls, result sizes, duplicate reads
python3 scratchpad/degrade.py                # per-decile context growth
python3 scratchpad/quad.py                   # power-law fit + tool result sizes
python3 scratchpad/econ.py                   # whole-corpus token economics
```

---

## 4. The tool-schema surface — the largest single controllable fixed cost

This session has ~385 MCP tool names available (figure supplied by the lead; **ASSUMED**, not
independently counted) and a deferred-loading mechanism (`ToolSearch`) that fetches schemas on
demand. Transcripts record tool *names*, never schemas, so the surface had to be measured against
a live server:

```
VERIFIED  live MCP tools/list against @playwright/mcp@latest (node scratchpad/mcpsize.mjs)
  tools = 24
  full schema JSON   : 18,502 chars   →   771 chars/tool   (median 865, min 294, max 1,590)
  names only         :    433 chars   →    18 chars/tool
  name + 200ch desc  :  2,592 chars   →   108 chars/tool
```

A second data point from `@runpod/mcp-server` **could not be obtained** — the process did not
respond to `tools/list` within 150 s (likely awaiting credentials). So `771 chars/tool` rests on
one server. Treat it as indicative, not as a fleet constant.

**Arithmetic at N = 385 tools (ESTIMATED):**

| Mode | Chars | ~Tokens @3.7 |
|---|---:|---:|
| Full schemas resident | 296,835 | **80,225** |
| Names only (deferred) | 6,930 | **1,873** |
| **Difference** | | **~78,350 tokens per session** |

**The measurement corroborates itself.** Median main-session prefill is 60,342 tokens — *lower*
than the ~80,200 tokens the full schema surface alone would cost. Deferred loading is therefore
demonstrably already active; without it, prefill could not be that small. This is the largest
efficiency win in the system and **it is already won.**

Two implications:

- **Do not undo it.** Any change that resident-loads MCP schemas adds ~78k tokens to every main
  session's prefix — which is then re-read on every turn, so the true cost multiplies by turn
  count (§2.1).
- **VENDOR corroboration:** the API's own `tool_search_tool_regex_20251119` / `..._bm25_...`
  server tools with `defer_loading: true` implement the same pattern, and are documented to
  *append* schemas rather than swap them, preserving the prompt cache (claude-api skill,
  § Server Tools; § Caching for Agents).

---

## 5. Router verdict — adjudicated by measurement

**The claim under dispute.** `CLAUDE.md` defends the two-tier router
(`.claude/skills/routers/`) on the grounds that reading `MANIFEST.json` whole cost ~15,000 tokens
and the router path costs ~1,070. A peer document recommends **deleting** the router on the
grounds that the saving is inadmissible as cost and marginal as context (1.2% of a 1M window).

**Both sides are arguing about a rounding error, and both are missing the actual finding.**

### The per-lookup saving is real and slightly overstated

```
VERIFIED  wc -c
  MANIFEST.json              49,254 B   →  ~13,300 tokens ESTIMATED  (CLAUDE.md says ~15,000)
  routers/INDEX.md            1,539 B   →     ~416 tokens
  routers/*.md (6 namespaces) 2,477–5,310 B, mean ~3,400 B → ~919 tokens
  router path (INDEX + 1 ns)  ~4,939 B  →   ~1,335 tokens  (CLAUDE.md says ~1,070)

  saving per lookup ≈ 11,977 tokens
```

The mechanism works as advertised. CLAUDE.md's numbers are close enough (~13.3k not 15k;
~1,335 not 1,070).

### The lookup rate makes it irrelevant either way

```
VERIFIED  actual Read tool calls, whole corpus (python3 scratchpad/tools.py)
  MANIFEST.json      20 reads      routers/INDEX.md   4 reads
```

**Lifetime realized saving ≈ 4 × 11,965 ≈ 48,000 tokens.** Against 26,103,287,506 input tokens
that is **0.0002%.** The router has saved, across its entire existence, about what one 1.5-turn
main session costs.

Note also that a naive `grep -rl 'MANIFEST.json'` returns **595 transcripts** — 30× the true read
count, because the string appears in the old CEO prompt text. Anyone arguing this from grep counts
is arguing from a number that is 30× wrong.

### Why the rate is so low: skills are injected, not discovered

The router optimizes a path that is almost never taken, because the actual delivery mechanism is
**frontmatter injection** (§3.2) — 845 transcripts carry `<skill` markers against 26 discovery-file
reads. Discovery is the fallback; injection is the norm.

### Verdict

**Keep it. Stop defending it as a token-efficiency measure, and do not spend effort deleting it.**

- **Keep**, because an unread file costs exactly zero tokens. Deletion saves nothing measurable,
  costs migration effort, and `npm run check:curation` plus the manifest check are wired to the
  current structure. The router's real value is *discovery correctness* — a cheap, correct path
  for the rare case where an agent must find a skill it wasn't given.
- **Stop defending it on cost**, because 0.0002% is not a cost argument, and CLAUDE.md's framing
  ("a good new skill made every unrelated task more expensive") describes a harm that the corpus
  shows happening 20 times in 2,532 sessions.
- **The real finding** is that skills discovery is not where tokens go. `Read` + `Bash` results are
  91.4% of tool-result volume; discovery files are 26 reads. Effort spent on the router is effort
  not spent on §2.1–2.4.

---

## 6. Environment comparison

| Environment | Startup context | Output share | Concurrency | Constraint that binds | Source |
|---|---:|---:|---|---|---|
| **Main session** (CEO pane) | median 60,342 tok, p90 72,659, max 86,613 | 43.5% of corpus output | 1 per pane; user runs several panes | Context growth at turns^1.5; wall-clock | VERIFIED |
| **Subagent** (`Task`/`Agent`) | median 35,769 tok, p90 45,770, max 452,012 | 56.5% of corpus output; 66.0% of input | Parallel fan-out; unbounded in practice | Dispatch fan-in (p99 212k chars); per-launch fixed cost | VERIFIED |
| **Workflow agent** (`subagents/workflows/`) | not separately measured | included in subagent | declared `tools:` lists of 4–10 tools | Same as subagent | VERIFIED (exists); ASSUMED (profile) |
| **War-room pane** | not measured — no distinguishing marker in transcripts | — | — | — | Could not measure (§8) |
| **Mission Control** | read-only collector over the corpus; issues no model calls | 0 | n/a | Disk I/O, not tokens | VERIFIED by inspection |

### Model split

```
VERIFIED  python3 scratchpad/econ.py § by model
  claude-opus-5       input 10,359,349,758   output 44,205,124
  claude-sonnet-5     input  5,457,739,760   output 18,955,995
  claude-opus-4-8     input  5,198,600,976   output 21,498,729
  claude-fable-5      input  3,166,418,927   output  9,332,665
  claude-sonnet-4-6   input  1,536,772,733   output  7,984,771
  claude-opus-4-7     input    286,132,075   output  1,774,185
```

The Opus line (5 + 4.8 + 4.7) carries **60.7%** of input tokens; adding Fable 5, the
above-Opus-tier models carry **72.8%**. That is the model-routing headroom (§7.9).

### Limits

| Limit | Value | Label |
|---|---|---|
| Context window, Opus 5 / Sonnet 5 / Fable 5 | 1M tokens (default and max on Opus 5) | **VENDOR** (claude-api skill § Current Models) |
| Context window, Haiku 4.5 | 200K | **VENDOR** |
| Max output | 128K (64K Haiku 4.5) | **VENDOR** |
| Prompt-cache minimum prefix | 512 tok (Opus 5) · 1024 (Opus 4.8, Sonnet 5) · 4096 (Opus 4.6, Haiku 4.5) | **VENDOR** |
| Cache read / write pricing | 0.1× / 1.25× (5m TTL), 2× (1h TTL) | **VENDOR** |
| Cache TTL | 5 min default, 1 h optional | **VENDOR** |
| Cache breakpoints per request | max 4; 20-block lookback window | **VENDOR** |
| Max 20x ($200) 5-hour window | ~900 prompts/5h; Sonnet and Opus draw from **separate** buckets | **VENDOR** (third-party summaries, [truefoundry](https://www.truefoundry.com/blog/claude-code-limits-explained), [morphllm](https://www.morphllm.com/claude-code-usage-limits), accessed 2026-08-15) — *not* an Anthropic primary source; treat as indicative |
| 5-hour limits doubled; peak-hour reduction removed | 2026-05-06 | **VENDOR**, same caveat |
| Weekly 7-day cap | exists on Max plans | **VENDOR**, same caveat |
| Current local 5h window usage | 50,039 output tokens | **VERIFIED** — `npm run usage` |

> The subscription limit figures are the weakest evidence in this document. They come from
> third-party trackers, not Anthropic documentation. `scripts/lib/usage.js` measures **output
> tokens** in the rolling 5h window as a proxy for work produced; whether the subscription meters
> on output tokens, input tokens, or request count is **ASSUMED unknown**. This matters for §9 —
> it is the one place where a different answer would change a recommendation.

---

## 7. Ranked interventions

Each carries: expected impact, quality risk, effort, and **how success is measured**.

### Quick wins

**7.1 — Cap tool-result size at the source, with range-continuation**
`Read` returns median 3,287 chars but p99 51,583 and max 72,803; 483 reads >40k chars carry 19.5%
of all Read volume. Default a line `limit` on `Read` for large files and head/tail defaults on
verbose `Bash` output, always with an explicit "N more lines — re-read with offset" marker so the
agent can pull more.
- **Impact:** up to ~19.5% of Read volume, multiplied by turn count because it never enters the
  prefix. Largest cheap win available.
- **Quality risk:** *low, conditional on the continuation marker.* Silent truncation is a
  correctness bug; a marked, resumable range is not. VENDOR precedent: Claude Code restricts tool
  responses to 25,000 tokens by default, and Anthropic recommends pagination/range/filter defaults
  for tool responses ([Anthropic, Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), accessed 2026-08-15).
- **Effort:** low — hook or tool-wrapper level.
- **Success metric:** p99 `Read` result size; total tool-result chars per session at fixed task
  difficulty; **no increase** in re-read rate (which would mean the cap is too tight).

**7.2 — Session-scoped read deduplication**
2,725 redundant reads measured; 25.5% of reads in affected sessions.
- **Impact:** directly removes duplicated bytes from the prefix; compounding via §2.1.
- **Quality risk:** *very low* — return `unchanged since your read at turn N` with the file's
  mtime/hash rather than the body. If changed, return the body.
- **Effort:** low.
- **Success metric:** redundant-read count per session (re-run `scratchpad/tools.py`); target
  <5% from 25.5%.

**7.3 — Dispatch by reference, not by value**
The top 1% of dispatch prompts carry 37.7% of all dispatch text, and the mechanism is verbatim
peer-output paste (§2.4), not history replay.
- **Impact:** very large on the tail (p99 212,282 → single-digit thousands), zero on the median —
  which is exactly the shape wanted: it never constrains a normal dispatch.
- **Quality risk:** *low-moderate.* The subagent must read the referenced file, costing a turn.
  Mitigate by referencing paths for anything over ~8,000 chars and inlining below that.
- **Effort:** low — a convention plus a warning in the dispatch path.
- **Success metric:** p99 and max dispatch-prompt chars; share of dispatch text held by the top 1%.

**7.4 — Trim `DECISIONS.md`**
46,655 bytes (~12,600 tokens) for a file capped at 50 entries. Any agent following rule 4 pays it.
- **Impact:** ~12,600 tokens per reading agent.
- **Quality risk:** *low* if archived rather than deleted.
- **Effort:** trivial.
- **Success metric:** file size; count of transcripts reading it × size.

### Medium effort

**7.5 — Bound session length by offloading to subagents (the big structural lever)**
Because cache_read ~ turns^1.50, splitting work across shorter contexts beats one long one:
```
VERIFIED, from the §2.1 table
  one 512-turn session:        158,872,666 median cache_read
  four 128-turn sessions:  4 ×  15,633,695  =  62,534,780
  reduction:                          60.6%
```
- **Impact:** ~60% of context re-read on long tasks — the largest single lever in the document.
- **Quality risk:** *moderate and real.* Multi-agent handoffs introduce error propagation:
  upstream errors compound downstream and token consumption is cumulative as each agent receives
  growing context from prior agents ([arXiv 2603.15183](https://arxiv.org/abs/2603.15183);
  documented 3.5× cost multipliers in 4-agent document workflows). Offloading is not free — it
  trades context growth for coordination overhead. It pays when the sub-task is genuinely
  independent, and loses when it is not.
- **Effort:** medium — orchestration convention, not code.
- **Success metric:** per-session turn-count distribution (p90); total corpus cache_read per unit
  of delivered work; **watch for a rise in rework/contradiction rate**, which is the failure mode.

**7.6 — Turn on context editing and compaction**
Only 2.4% of long sessions show a compaction record. VENDOR features exist and are unused:
`context_management.edits` with `clear_tool_uses_20250919` (clears stale tool results) and
`clear_thinking_20251015`; server-side compaction via `compact_20260112` (claude-api skill).
- **Impact:** targets exactly the §2.2 accumulation. Tool results are the bulk of what could be
  cleared.
- **Quality risk:** *moderate.* Compaction is lossy by construction and blocks inference while it
  runs ([Zylos](https://zylos.ai/research/2026-04-21-agent-context-compaction-long-running-sessions/), accessed 2026-08-15). Clearing *tool results* is far safer than summarizing *reasoning* — prefer
  `clear_tool_uses` over compaction where both apply.
- **Effort:** medium — harness-level, and Claude Code manages its own context, so this may not be
  directly settable from here (see §8).
- **Success metric:** mean context-per-turn in the top three deciles; task success rate held
  constant.

**7.7 — Externalize state to files**
Corroborated by both the corpus (agents already write session files) and vendor guidance: agents
perform notably better when they can write learnings to a file and consult it later, and memory
survives context loss (claude-api skill, Fable 5 § Give it a memory surface).
- **Impact:** indirect but compounding — moves state out of the re-read prefix.
- **Quality risk:** low; positive on long-horizon coherence.
- **Effort:** medium.
- **Success metric:** context-per-turn growth slope; re-derivation rate.

### Architectural

**7.8 — Adopt outcomes-per-token as the metric, and stop counting tokens**
This is the recommendation that governs all the others. The evidence is unambiguous that raw token
count is the wrong target: *"improvements to accuracy on agentic benchmarks are usually not
accompanied by greater token efficiency, with a positive correlation between token usage and
accuracy on 6 of 9 benchmarks"* ([Holistic Agent Leaderboard, arXiv 2510.11977](https://arxiv.org/pdf/2510.11977), accessed 2026-08-15). Cutting tokens cuts accuracy *by default*; the
whole game is finding the cuts that don't.
- The same work finds the accuracy/cost Pareto frontier is **steep and sparse** — under a third of
  models sit on it for a given benchmark — and CLEAR reports **accuracy-optimal configurations
  cost 4.4–10.8× more than Pareto-efficient alternatives with comparable real-world performance.**
- **Impact:** reframes every other decision. Prevents the failure mode this repo already hit once.
- **Effort:** medium — needs §10's baseline harness.
- **Success metric:** tokens per *completed, QA-passed* task, tracked over time. Never tokens alone.

**7.9 — Model routing by task shape**
The Opus line carries 60.7% of input tokens (72.8% counting Fable 5). Reading-heavy subagent work
(search, extract, summarize) is many input tokens and little hard reasoning.
- **Impact:** cost and rate-limit headroom, not token count. Note Sonnet and Opus draw from
  **separate** 5h buckets on Max plans (VENDOR, caveated) — so routing shifts load between buckets
  rather than merely reducing it, which is the more valuable property here.
- **Quality risk:** *moderate* — the wrong split degrades exactly the judgement steps that matter.
  Route by task shape (reading vs. deciding), never by cost alone.
- **Effort:** medium.
- **Success metric:** input tokens by model; QA-pass rate per model class held constant.

**7.10 — Effort routing**
`output_config.effort` is the vendor-documented lever for token spend, and Opus 5 is documented as
unusually strong at `low`/`medium` (claude-api skill § Migrating to Claude Opus 5). Lower effort
means fewer, more consolidated tool calls and less preamble.
- **Impact:** unmeasured here; vendor-documented as the primary control.
- **Quality risk:** *moderate* — effort is respected strictly at the low end, with under-thinking
  risk on complex tasks at `low`.
- **Effort:** low to set, medium to tune.
- **Success metric:** an effort sweep (§10.3) on a fixed task set.

---

## 8. What I could not measure

Stated plainly, because the brief demands the distinction:

- **The exact deferred-tool count (~385).** Supplied by the lead; I could not enumerate the
  system-reminder list programmatically. All §4 arithmetic is parameterised on N and shown.
- **Tool schema size beyond one server.** Playwright answered (`771 chars/tool`); runpod timed out
  at 150 s. One data point.
- **War-room pane as a distinct environment.** Transcripts carry no marker distinguishing a
  war-room pane from any other main session. The §6 row is honest about this.
- **Token counts, exactly.** No tokenizer available (`ant` absent, no API key). All byte→token
  conversions are ESTIMATED at 3.7 chars/token, conservative against the corpus-derived 2.55.
- **Quality-side context degradation.** The corpus shows cost growth clearly and shows no
  aggregate re-planning loop, but transcripts carry no task-success label, so I cannot show whether
  *answer quality* degrades with session length on this workload. The external evidence is strong
  — Chroma's *Context Rot* across 18 frontier models finds non-uniform degradation well before the
  window limit, and reports acceleration beyond ~30,000 tokens ([Chroma](https://www.trychroma.com/research/context-rot), accessed 2026-08-15) — but that is VENDOR/third-party, not measured here. Given that the
  median long session in this corpus runs at 154,055 tokens of context per turn in its last decile,
  this repo is operating **5× past** the point that research flags. That is a hypothesis about this
  system, not a measurement of it.
- **Whether §7.6's context-editing knobs are reachable.** They are Messages-API parameters; Claude
  Code manages its own context and may not expose them. Flagged rather than assumed.
- **The `caveman` 75% claim.** Not verified — see §9.

---

## 9. What not to do, and why

**9.1 — Do not add a global token ceiling.** This repo ran the experiment. `budget-guard.js` was a
`PreToolUse` hook with no matcher; it fired on every tool call and blocked the CEO mid-task, a
builder before its first commit, and a probe writing its own report. It was unregistered by founder
decision. The failure was structural, not a tuning error: a ceiling that cannot distinguish
*productive* spend from *wasted* spend blocks the former, because productive work is what generates
volume. Every recommendation in §7 targets a *specific measured waste mechanism* instead.

**9.2 — Do not treat response compression as the solution.** The `caveman` skill
(`~/.claude/skills/caveman/SKILL.md`, 1,916 B) claims ~75% token reduction. Assessed as **one
tactic, not the answer**:
- Its 75% figure is **unverified** — no measurement accompanies it, and I did not reproduce it.
- Even granting it: output is 104,056,606 of 26,207,344,112 total tokens = **0.397%**. A 75% cut on
  output saves **0.298% of total token volume.** It cannot move the number that matters.
- **It may matter more than that for rate limits**, because `scripts/lib/usage.js` meters *output*
  tokens — but whether the subscription itself meters on output is **ASSUMED unknown** (§6). If it
  does, caveman's relevance rises sharply. That is the single most valuable unknown in this
  document and §10.5 proposes how to settle it.
- **It does trade away debuggability, and the skill knows it.** Dropping articles, conjunctions and
  hedging, and compressing causality into `X -> Y` arrows, removes exactly the qualifiers that let
  a reader tell a confident claim from a tentative one. The skill's own *Auto-Clarity Exception*
  concedes this by carving out security warnings, irreversible-action confirmations, and multi-step
  sequences "where fragment order risks misread." An agent system whose central discipline is
  sourced claims and auditable verdicts should not compress the audit trail to save 0.3%.
- **Verdict:** fine as a user-invoked mode for interactive chat. Not a system default. Never for
  session files, QA verdicts, or claim text.

**9.3 — Do not adopt learned prompt compression (LLMLingua-style).** It sounds ideal and the
headline numbers are strong (up to 20× compression, <2% quality loss on CoQA/HotpotQA/TriviaQA).
The problems are specific:
- **It breaks evidence grounding, which is this repo's whole thesis.** Compression that preserves
  *answer* quality does not preserve *citation* grounding — a documented mismatch. A harness whose
  rule 3 is "source claims," enforced by a resolver that fetches a URL and asserts the quote is
  present, cannot run on compressed evidence.
- Larger models with longer contexts show **greater** degradation under compression.
- It **adds latency** without quality improvement in some scenarios — moving cost rather than
  removing it.
- Sources: [Prompt Compression in the Wild, arXiv 2604.02985](https://arxiv.org/html/2604.02985);
  [LLMLingua](https://github.com/microsoft/LLMLingua) (accessed 2026-08-15).

**9.4 — Do not delete the two-tier router to save tokens.** §5. Lifetime saving ~48,000 tokens =
0.0002% of input. An unread file costs zero. Deleting it is not a saving; it is a migration.

**9.5 — Do not resident-load MCP tool schemas.** §4. That is ~78,350 tokens added to every main
session's *prefix*, which is re-read every turn — so on a 128-turn session the true cost is that
figure multiplied by turn count, not paid once.

**9.6 — Do not reduce subagent use in order to reduce tokens.** Subagents are 66.0% of input
tokens, which makes them look like the problem. They are partly the *solution* to the problem
(§7.5): the alternative is one long context on the turns^1.50 curve. The real subagent waste is
**dispatch fan-in** (§2.4) and **redundant work**, both of which are fixable without spawning
fewer agents. Cutting fan-out to cut tokens would trade a 60% structural saving for a 38% tail
saving, and lose.

**9.7 — Do not chase cache-hit optimisation.** Caching already captures 83% of the available
saving (§1). The remaining headroom is small, and effort spent on breakpoint placement is effort
not spent on §7.1–7.5. *Do* keep the hygiene: never interpolate timestamps or UUIDs into a system
prompt, keep tool lists deterministically ordered, and never switch models mid-session — each
silently invalidates the whole prefix (VENDOR, claude-api skill § Silent invalidators).

**9.8 — Do not report token counts as the efficiency metric.** §7.8. Token usage correlates
*positively* with accuracy on 6 of 9 agentic benchmarks. A dashboard that rewards low tokens
rewards giving up early.

---

## 10. Experiment plan

Everything below can actually run here, against the existing corpus and instruments.

### 10.1 Baseline (run before any change)

| Metric | Instrument | Current value |
|---|---|---|
| Corpus input/output/cache split | `scratchpad/econ.py` | 26.10B / 104.06M / 95.2% |
| Prefill by class | `scratchpad/prefill.py` | 60,342 / 35,769 median |
| Context growth exponent | `scratchpad/quad.py` | turns^1.50 |
| Tool-result chars by tool | `scratchpad/tools.py` | Read 121.1M / Bash 75.4M |
| Redundant reads | `scratchpad/tools.py` | 2,725 (25.5%) |
| Dispatch p99 / max | `scratchpad/dispatch.py` | 212,282 / 1,069,297 |
| 5h window output | `npm run usage` | 50,039 |

Freeze these as `baseline-2026-08-15`. Every intervention is measured as a delta against it.

### 10.2 A/B: tool-result caps (tests 7.1)

Take 20 representative tasks from the corpus. Run each twice — once with current defaults, once
with `Read` limited to 800 lines and `Bash` to 400 lines, both with explicit continuation markers.
- **Primary:** total tool-result chars per task.
- **Guardrail:** re-read rate (a rise means the cap is too tight); QA verdict unchanged.
- **Kill criterion:** any task that passed QA at baseline and fails with caps.

### 10.3 Effort sweep (tests 7.10)

Same 20 tasks × `effort ∈ {low, medium, high, xhigh}`. Plot outcomes-per-token; find this
workload's Pareto frontier rather than assuming the vendor default is right for it.
- **Primary:** QA-pass rate ÷ total tokens.
- Expect the frontier to be steep and sparse (§7.8), so expect one or two settings to dominate.

### 10.4 Session-length A/B (tests 7.5 — the highest-value experiment)

Take 5 tasks that historically ran >256 turns. Run each as (a) one long session, (b) an orchestrator
plus 4 bounded subagents.
- **Primary:** total cache_read tokens. Predicted ~60% reduction from the §2.1 table.
- **Guardrail — this is the one that decides it:** rework rate, contradiction rate between
  subagent outputs, and QA verdict. The multi-agent literature predicts error propagation and
  cumulative context growth as the counter-effect; this experiment is precisely the test of whether
  it dominates the 60%.

### 10.5 Settle the rate-limit metering question (unblocks §9.2)

Drive a session with high output and low input, and a second with high input and low output, of
comparable wall-clock. Watch when the 5h limit warning appears relative to `npm run usage`. This
determines whether the subscription meters output, input, or requests — the single unknown that
most changes the recommendations.

### 10.6 Dispatch-reference A/B (tests 7.3)

Re-run a board-pattern task (the one that produced the 1,069,297-char dispatch) passing file paths
instead of pasted peer output.
- **Primary:** dispatch chars, subagent prefill.
- **Guardrail:** does the subagent actually read the referenced files? Quality of synthesis
  unchanged?

---

## 11. Default policy

Proposed defaults. Each is overridable with a stated reason — that is the point.

### Output
- No length caps on deliverables. Lead with the outcome; put supporting detail after.
- Session files stay ≤10 lines (existing rule, unchanged).
- **No `caveman` by default.** Available as a user-invoked interactive mode. Never for session
  files, QA verdicts, claim text, or anything a reviewer must audit.

### Context
- **Bound session length, not agent behaviour.** Past ~150 turns, prefer offloading the next
  independent unit of work to a subagent over continuing in place (§7.5) — subject to 10.4.
- Tool results carry range defaults with explicit continuation markers; never silent truncation.
- Read the same file twice only when it may have changed.
- Keep `DECISIONS.md` under its byte budget as well as its entry budget.

### Tools
- **Deferred loading stays on.** Batch `ToolSearch` selections into one call.
- Prefer `Grep`/`Glob` over `Bash` for search: `Bash` is 51.0% of calls and 35.1% of returned bytes,
  much of it `cd`-prefixed compound commands whose output is incidental.
- Promote an action to a dedicated tool when it needs gating, rendering, auditing, or parallel-safe
  scheduling; otherwise `bash` is fine (VENDOR, claude-api skill § Designing Your Tool Surface).

### Coordination
- **Dispatch by reference above ~8,000 chars.** Inline below it.
- One focused task per subagent; a self-contained brief carrying paths, constraints, and the
  required return shape — subagents share the filesystem, not the conversation.
- Prefer asynchronous fan-out to spawn-and-block where the harness allows.
- Never re-derive a subagent's findings after it reports.

### Model routing
- Opus-class for orchestration, synthesis, design, and final judgement.
- Sonnet-class for bounded implementation.
- Haiku-class for reading-heavy extraction, lint, log parsing, classification.
- Never switch models mid-session — it invalidates the entire prompt cache.

### Measurement
- Report **tokens per QA-passed task**, never tokens alone.
- Re-run §10.1 monthly and after any harness change.

---

## Sources

Repo measurements are VERIFIED with commands inline. External sources, all accessed **2026-08-15**:

- [Context Rot: How Increasing Input Tokens Impacts LLM Performance — Chroma](https://www.trychroma.com/research/context-rot)
- [Holistic Agent Leaderboard: The Missing Infrastructure for AI Agent Evaluation — arXiv 2510.11977](https://arxiv.org/pdf/2510.11977)
- [Token Coherence: Adapting MESI Cache Protocols to Minimize Synchronization Overhead in Multi-Agent LLM Systems — arXiv 2603.15183](https://arxiv.org/abs/2603.15183)
- [Prompt Compression in the Wild: Measuring Latency, Rate Adherence, and Quality — arXiv 2604.02985](https://arxiv.org/html/2604.02985)
- [LLMLingua — Microsoft Research](https://github.com/microsoft/LLMLingua)
- [Effective context engineering for AI agents — Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Writing effective tools for AI agents — Anthropic](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Agent Context Compaction for Long-Running Sessions — Zylos Research](https://zylos.ai/research/2026-04-21-agent-context-compaction-long-running-sessions/)
- [Claude Code Rate Limits & Usage Quotas Explained — TrueFoundry](https://www.truefoundry.com/blog/claude-code-limits-explained) *(third-party; not an Anthropic primary source)*
- [Claude Code Usage Limits 2026 — Morph](https://www.morphllm.com/claude-code-usage-limits) *(third-party)*
- Anthropic model/pricing/caching specifics: the `claude-api` skill bundled with this harness
  (cached 2026-06-24), §§ Current Models, Prompt Caching, Server Tools, Compaction, Context Editing.
