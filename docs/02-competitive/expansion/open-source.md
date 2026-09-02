# Open source we could adopt or steal from

**Expansion study, lane 2 of 3. Written 2026-09-01.** Sibling lanes: tools/MCPs/services (`exp-hands`),
abstract mechanisms. This lane covers **projects, codebases and frameworks** — things with a git URL, a
licence and a commit history. Not vendors, not ideas-without-code.

Nothing here is decided or recommended for adoption. It is a menu, deliberately unfiltered.

---

## 0 · How this was verified, and what to distrust

Every project below was checked against the **GitHub REST API** (`api.github.com/repos/...` and
`api.github.com/search/repositories?q=repo:...`) on **2026-09-01**. `curl` to external hosts is blocked by
`.claude/hooks/pre-tool-use.sh`, so the transport was `WebFetch`, which renders the JSON through a small
summarising model.

**What I stand behind:** the repo exists, the canonical `owner/name`, the licence, the archived flag, and
the last-push month. Those were read as discrete fields and cross-checked where a project appeared in two
batches.

**What to re-derive before quoting:** *star counts*. They passed through a summariser and several look
implausibly large — `obra/superpowers` at 280,317, `anomalyco/opencode` at 203,002, `microsoft/markitdown`
at 177,543, `firecrawl/firecrawl` at 175,147, `anthropics/skills` at 172,953. These may be real (the
ecosystem has grown since the May 2026 knowledge cutoff) or may be transport corruption. **Treat every star
figure in this document as an order-of-magnitude signal only.** Where a decision would turn on it, re-fetch.

**Nine projects have moved org since early 2026 and the old path no longer resolves in the search index.**
This bit me repeatedly and will bite anyone who pastes a URL from memory:

| Old path (does not resolve in search) | Current canonical path |
|---|---|
| `steveyegge/beads` | **`gastownhall/beads`** |
| `codelion/openevolve` | **`algorithmicsuperintelligence/openevolve`** |
| `explodinggradients/ragas` | **`vibrantlabsai/ragas`** |
| `microsoft/presidio` | **`data-privacy-stack/presidio`** |
| `ryoppippi/ccusage` | **`ccusage/ccusage`** |
| `Giskard-AI/giskard` | **`Giskard-AI/giskard-oss`** |
| `sst/opencode` | **`anomalyco/opencode`** |
| `block/goose` | **`aaif-goose/goose`** |
| `geekan/MetaGPT` | **`FoundationAgents/MetaGPT`** |
| `mendableai/firecrawl` | **`firecrawl/firecrawl`** |
| `NVIDIA/NeMo-Guardrails` | **`NVIDIA-NeMo/Guardrails`** |
| `MichaelMure/git-bug` | **`git-bug/git-bug`** |
| `All-Hands-AI/OpenHands` | **`OpenHands/OpenHands`** |
| `icaros-lab/pyribs` (never existed) | **`icaros-usc/pyribs`** |

The API follows the redirect; GitHub's *search index* does not. Anything that pins an OSS dependency by
`owner/name` string needs the current one.

**Count: 177 distinct repositories verified to exist**, each with its canonical `owner/name`, licence and
last-push month checked on 2026-09-01. Derive it rather than trusting this sentence:

```bash
grep -oE 'github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+' docs/02-competitive/expansion/open-source.md \
  | sed 's#github.com/##; s/[).,]*$//' | sort -u \
  | grep -vE '^(repos/|search/repositories)$' | wc -l
```

Grouped into the sections below, mapped onto the 14 territories. Everything in §17 is **not** verified and is
excluded from that count by having no URL.

---

## 1 · The five I would be most annoyed to see dropped

Stated up front so they are not buried. Full entries in their territory sections.

1. **`gastownhall/beads`** — a dependency-graph issue tracker that lives in git, designed for agents, not
   humans. It is the only verified project that directly answers *"nothing decides what to do next."*
2. **`temporalio/temporal`** — durable execution with deterministic replay of an event history. The one
   mature answer to "missions that outlive a session" and "blocked vs stalled", and it is 7 years old and
   boring, which is the point.
3. **`icaros-usc/pyribs` + `SakanaAI/ShinkaEvolve`** — quality-diversity search. The founder's complaint is
   that the system *loses creativity to playbooks*; QD is the branch of optimisation whose entire purpose is
   to produce a *diverse archive* of good solutions rather than one winner.
4. **`UKGovernmentBEIS/inspect_ai`** — an eval framework built by a government safety institute, with real
   scaffolding for multi-model graders. It is the credible route out of "single-family review is an accepted
   risk" without hand-rolling a panel.
5. **`riponcm/projectmem`** — small, new, unglamorous: an append-only typed event log of issues/attempts/
   fixes/decisions with **a gate that warns before the agent repeats a failed fix**. That is the missing
   twelve-things item #7 (negative knowledge) implemented, by someone else, in Python, under MIT.

---

## 2 · Territory 05 — Memory

The richest field by volume. Nineteen projects. The split that matters: **memory-as-a-service** (mem0,
Zep, Letta) vs **memory-as-a-graph** (Graphiti, cognee, LightRAG, GraphRAG) vs **memory-as-files-in-repo**
(basic-memory, projectmem). The third group is the only one that survives this repo's constraints — an
append-only, greppable, git-reviewable store is what `DECISIONS.md` already is, and the eviction tool
(`scripts/evict-memory.mjs`) is a hand-rolled version of what these do properly.

### `letta-ai/letta` — the stateful-agent OS
- **URL:** https://github.com/letta-ai/letta · **Licence:** Apache-2.0 · ~24.5k stars · pushed 2026-08-23 · created 2023-10
- **What:** the MemGPT lineage. Agents are servers with tiered memory (core / recall / archival), and the
  agent itself is given *tools to edit its own memory blocks*. Memory is a first-class database object with
  a REST API, not a prompt-stuffing convention.
- **Take:** the **tiered memory model and the self-edit tool contract** — the idea that an agent has a small
  always-in-context block it can rewrite, plus a searchable archive it must query. Not the server.
- **Cost:** taking the idea is a week. Taking the runtime is adopting a second control plane beside Claude
  Code, and Letta wants to *own* the agent loop. High.
- **Territories:** 05, 07, 02.
- **Mistake if:** we adopt the runtime. Letta's agents are Letta's agents; this repo's engines are Claude
  Code subagents with `tools:` scoping and a lint that enforces it. Two agent runtimes is the "two
  implementations of one thing disagree silently" failure this repo has already hit three times.

### `mem0ai/mem0` — the memory layer everyone reaches for first
- **URL:** https://github.com/mem0ai/mem0 · **Licence:** Apache-2.0 · ~64.5k stars · pushed 2026-09-01
- **What:** extract-and-store pipeline — an LLM pass over a conversation emits candidate memories, dedupes
  and conflict-resolves them against what is stored, then retrieves by embedding at prompt time.
- **Take:** the **conflict-resolution step**. Mem0's insight is that adding a memory is an *update* against
  existing memories (ADD / UPDATE / DELETE / NOOP), not an append. This repo's `DECISIONS.md` is append-only
  with hand-written supersession notes — which is a virtue for auditability and a defect for retrieval.
- **Cost:** low as a library (already in the stack per CLAUDE.md, via the `mem0` MCP on the founder's
  account, currently unwired). Medium if we take the pipeline shape into our own store.
- **Territories:** 05, 07.
- **Mistake if:** we let a model decide what to forget without a record. This repo's whole posture is that a
  decision is recorded with its rationale; a silent DELETE from an LLM extraction pass is the opposite.

### `getzep/graphiti` — temporally-aware knowledge graph
- **URL:** https://github.com/getzep/graphiti · **Licence:** Apache-2.0 · ~30.5k stars · pushed 2026-09-01
- **What:** builds a real-time knowledge graph where every edge carries **validity intervals** — `valid_from`
  / `valid_until` — so a fact can be superseded without being deleted, and a query can ask "what did we
  believe on date X".
- **Take:** **the bi-temporal edge model, wholesale as a design.** This repo already invented half of it:
  claims carry `valid_until` and expiry forces a disposition (rule 9). Graphiti is that idea applied to every
  fact rather than only to claims, and it is the single best structural match to how this repo already thinks.
- **Cost:** medium-high — it wants Neo4j or FalkorDB. But the *model* is portable to SQLite.
- **Territories:** 05, 04, 08.
- **Mistake if:** we stand up a graph database for a one-founder company with 2,936 transcripts. The
  operational surface is real and the corpus is small.

### `topoteretes/cognee` — memory as an ECL pipeline
- **URL:** https://github.com/topoteretes/cognee · **Licence:** Apache-2.0 · ~30.4k stars · pushed 2026-09-01
- **What:** Extract-Cognify-Load. Documents in, ontology-typed graph + vector store out, one SDK.
- **Take:** the **ontology step** — cognee makes you declare node types before ingestion, which is what stops
  a memory store degenerating into an undifferentiated blob of chunks.
- **Cost:** medium. Heavy dependency footprint.
- **Territories:** 05, 04.
- **Mistake if:** the ontology becomes a second schema to maintain beside `lenses.yml` and the ledger kinds.

### `MemTensor/MemOS` — memory as an operating system
- **URL:** https://github.com/MemTensor/MemOS · **Licence:** Apache-2.0 · ~11.1k stars · pushed 2026-09-01 · created 2025-07
- **What:** explicit scheduling between *parametric*, *activation* and *plaintext* memory, with a
  "MemCube" abstraction and a scheduler deciding what is promoted into context.
- **Take:** the **promotion/demotion scheduler** as a concept — the thing this repo does by hand every time
  someone edits `CLAUDE.md`'s Project State block.
- **Cost:** high. Research-grade.
- **Territories:** 05, 07.
- **Mistake if:** we mistake a research artifact's vocabulary for a working mechanism. It is a year old.

### `volcengine/OpenViking` — self-evolving context database
- **URL:** https://github.com/volcengine/OpenViking · **Licence:** **AGPL-3.0** · ~34.9k stars · pushed 2026-09-01 · created 2026-01
- **What:** unifies agent memory + knowledge RAG + **reusable skills** in one store, and evolves it. ByteDance.
- **Take:** the *unification claim* is the interesting bit — this repo keeps skills (`.claude/skills/`),
  memory (`.claude/memory/`) and claims (the ledger) in three stores with three retrieval paths and one
  two-tier router bolted onto the skills half.
- **Cost:** high, and **the AGPL is a real constraint** for anything the company might later ship.
- **Territories:** 05, 04, 12.
- **Mistake if:** the AGPL is not read before anyone imports a line of it.

### `riponcm/projectmem` — negative knowledge, implemented
- **URL:** https://github.com/riponcm/projectmem · **Licence:** MIT · ~794 stars · pushed 2026-09-01 · created 2026-05
- **What:** local-first, append-only plain-text event log inside the repo (`.projectmem/`), typed events —
  *issue, attempt, fix, decision, note* — deterministically projected into compact AI-readable summaries and
  served over MCP. **Plus a pre-action gate that warns the agent before it repeats a previously failed fix or
  edits a known-fragile file.** Python, ~3 dependencies, 14 MCP tools, 19 CLI commands, 37 tests. Paper:
  arXiv 2606.12329.
- **Take:** potentially **the whole thing**, or the event taxonomy + the gate. It is small enough to read in
  an afternoon and vendor if we disagree with a decision.
- **Cost:** low. It is a Python package and an MCP server, and this repo already runs two MCP servers.
- **Territories:** 05, 12, 08, 01.
- **Mistake if:** we adopt it and the gate has no teeth — a *warning* that nothing fails on is exactly the
  `ADVISORY` rule class this repo has spent four phases eliminating. If we take it, the gate must `exit 2`.

### `basicmachines-co/basic-memory` — markdown memory over MCP
- **URL:** https://github.com/basicmachines-co/basic-memory · **Licence:** **AGPL-3.0** · ~3.8k stars · pushed 2026-09-01
- **What:** memory as human-readable markdown files with wiki-links, indexed into SQLite, served over MCP.
  Obsidian-compatible.
- **Take:** the shape — **this is what `.claude/memory/` already is, done by people who kept going.** The
  bidirectional-link index is the part we lack.
- **Cost:** low to steal, medium to adopt. **AGPL.**
- **Territories:** 05, 04.
- **Mistake if:** AGPL again, and if we end up with two markdown memory conventions in one repo.

### `langchain-ai/langmem` — episodic/semantic/procedural, as a library
- **URL:** https://github.com/langchain-ai/langmem · **Licence:** MIT · ~1.6k stars · pushed 2026-08-11
- **What:** the cleanest small implementation of the three-scope split, with a *background* extraction process
  that runs off the hot path.
- **Take:** the **background extraction** pattern — memory formation as an async job, not a turn tax.
- **Cost:** low, but it drags LangGraph in.
- **Territories:** 05, 12.
- **Mistake if:** we take the LangChain dependency tree for a 300-line idea.

### `joonspk-research/generative_agents` — the retrieval scoring function
- **URL:** https://github.com/joonspk-research/generative_agents · **Licence:** Apache-2.0 · ~22k stars · **last push 2024-08 (dormant)**
- **What:** the Stanford "Smallville" paper code. Memory stream + **retrieval scored as
  recency × importance × relevance**, plus periodic *reflection* that synthesises higher-level observations
  from raw ones.
- **Take:** **the scoring function and the reflection trigger, as an idea.** It is three years old, dormant,
  and still the clearest statement of "not everything remembered is equally worth retrieving."
- **Cost:** nil — it is a formula.
- **Territories:** 05, 12.
- **Mistake if:** anyone tries to run the code. It is a research artifact from 2023 tied to a simulation.

### The rest of the memory field, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`HKUDS/LightRAG`](https://github.com/HKUDS/LightRAG) | MIT | ~39k ★, pushed 2026-09-01 | Graph+vector RAG, much lighter than GraphRAG; dual-level retrieval |
| [`microsoft/graphrag`](https://github.com/microsoft/graphrag) | MIT | ~35.8k ★, pushed 2026-08-31 | Community-detection over an entity graph, then summarise per community. Expensive to index |
| [`getzep/zep`](https://github.com/getzep/zep) | Apache-2.0 | ~4.9k ★, pushed 2026-08-30 | Now mostly examples/integrations; the engine moved to Graphiti |
| [`agiresearch/A-mem`](https://github.com/agiresearch/A-mem) | MIT | ~1.2k ★, pushed 2025-12 | Zettelkasten-style agentic memory: notes link themselves and evolve |
| [`caspianmoon/memoripy`](https://github.com/caspianmoon/memoripy) | Apache-2.0 | ~694 ★, pushed 2026-08-17 | "Evidence-first local memory with temporal versions" — small, on-theme |
| [`kingjulio8238/Memary`](https://github.com/kingjulio8238/Memary) | MIT | ~2.6k ★, **dormant since 2024-10** | Knowledge-graph memory for autonomous agents |
| [`asg017/sqlite-vec`](https://github.com/asg017/sqlite-vec) | Apache-2.0 | ~8.1k ★, pushed 2026-05-18 | Vector search as a single SQLite extension. The zero-ops substrate if we build our own |
| [`TsinghuaC3I/Awesome-Memory-for-Agents`](https://github.com/TsinghuaC3I/Awesome-Memory-for-Agents) | MIT | ~647 ★, pushed 2026-08-31 | Curated paper list — a map of the field, not a dependency |
| [`TeleAI-UAGI/Awesome-Agent-Memory`](https://github.com/TeleAI-UAGI/Awesome-Agent-Memory) | Apache-2.0 | ~617 ★, pushed 2026-09-01 | Second curated list, systems + benchmarks |

---

## 3 · Territory 12 — Self-improvement

Two distinct families, and conflating them is a mistake this field makes constantly.

**(a) Optimise the prompt/program against a metric** — DSPy, GEPA, TextGrad, Trace. These need a *scorer*.
This repo has one — `npm run check` is 48 deterministic steps, and `qa.js` runs a deterministic oracle
before any panel agent. That is an unusually good fitness function to already own.

**(b) Optimise the agent's own code** — DGM, ADAS, RD-Agent. These are self-modifying systems, and this
repo classifies "harness self-edit" as `enforcement: block` from day one.

### `stanfordnlp/dspy` — programs, not prompts
- **URL:** https://github.com/stanfordnlp/dspy · **Licence:** MIT · ~37.7k stars · pushed 2026-09-01 · created 2023-01
- **What:** declare a module's *signature* (inputs → outputs), supply a metric, and an optimiser
  (BootstrapFewShot, MIPROv2, GEPA) searches instructions and demonstrations for you. Compiles, doesn't prompt.
- **Take:** the **optimiser-plus-metric contract**, and possibly the optimisers themselves against our lens
  and review prompts. `PROMPT-STANDARD.md` + `PS-*` lint rules are a hand-maintained approximation of what
  DSPy automates. The repo already found that `PS-BODY-VAGUE` "cannot tell a perception loop from a
  hand-wave" — a metric-driven optimiser is the principled version of that fix.
- **Cost:** medium-high. Python; our engines are markdown files loaded by Claude Code. The integration is not
  obvious and might be "run DSPy offline to *produce* the markdown".
- **Territories:** 12, 08, 04.
- **Mistake if:** we optimise prompts against a metric that does not measure what we care about. This repo's
  own warning applies verbatim — greening a rule that cannot judge makes the prompts worse and the output cleaner.

### `gepa-ai/gepa` — reflective prompt evolution
- **URL:** https://github.com/gepa-ai/gepa · **Licence:** MIT · ~6.3k stars · pushed 2026-08-30 · created 2025-08
- **What:** Genetic-Pareto optimisation. Runs the system, **reads the trace in natural language, reflects on
  what went wrong, mutates the prompt**, keeps a *Pareto frontier* of candidates rather than a single best —
  so it preserves diversity instead of collapsing onto one winner.
- **Take:** the **reflect-on-trace-then-mutate loop**, and specifically the Pareto archive. It is the bridge
  between self-improvement and the creativity problem: it does not converge to one playbook.
- **Cost:** low-medium. Standalone (not tied to DSPy, though DSPy uses it). Needs a metric and rollouts.
- **Territories:** 12, 08.
- **Mistake if:** each rollout is a full `npm run check` (90–480s wall clock). The optimiser needs hundreds of
  evaluations; ours cost minutes. Budget it before starting, or it dies at cell 20.

### `microsoft/RD-Agent` — R&D as an automated loop
- **URL:** https://github.com/microsoft/RD-Agent · **Licence:** MIT · ~14.4k stars · pushed 2026-09-01 · created 2024-04
- **What:** splits "propose a hypothesis" from "implement and evaluate it", loops, and keeps what beat the
  baseline. Aimed at data/model R&D, but the loop is domain-agnostic.
- **Take:** the **hypothesis/implementation split with an evidence ledger between them.** That is startlingly
  close to `framer` → `builder` with a claim in between, which is what this repo already has and does not run.
- **Cost:** medium. Studying it is cheap; adopting is a second orchestrator.
- **Territories:** 12, 01, 08.
- **Mistake if:** we adopt its loop instead of noticing that we built the same shape and never wired it.

### `microsoft/agent-lightning` · `OpenPipe/ART` — RL on agent trajectories
- **URLs:** https://github.com/microsoft/agent-lightning (MIT, ~17.9k ★, pushed 2026-08-28) ·
  https://github.com/OpenPipe/ART (Apache-2.0, ~10.7k ★, pushed 2026-09-01)
- **What:** take the trajectories your agent already produced, score them, and train a model. ART's
  "RULER" component notably scores trajectories with an LLM judge so you need no hand-written reward.
- **Take:** almost certainly **only the trajectory-scoring idea**, not the training. We do not train models.
  But "score the runs you already have, and use the score to pick which trajectory becomes the example" is
  usable without any GPU.
- **Cost:** idea = low. Training = a different company.
- **Territories:** 12, 08, 02.
- **Mistake if:** anyone reads "RL" and starts thinking about fine-tuning a model for a one-founder company.

### `zou-group/textgrad` · `microsoft/Trace` — backprop through text
- **URLs:** https://github.com/zou-group/textgrad (MIT, ~3.7k ★, **pushed 2025-07, dormant**) ·
  https://github.com/microsoft/Trace (MIT, ~755 ★, pushed 2026-06-17)
- **What:** treat an LLM critique as a "gradient" and propagate it backwards through a computation graph of
  prompts and tools.
- **Take:** the **framing** — a review finding is a gradient with an address. This repo's reviewer returns
  findings against lenses; nothing routes a finding back to the prompt that caused it.
- **Cost:** low as an idea; both are research code.
- **Territories:** 12, 08.
- **Mistake if:** treated as production-ready. TextGrad has not moved in over a year.

### `jennyzzt/dgm` — Darwin Gödel Machine
- **URL:** https://github.com/jennyzzt/dgm · **Licence:** Apache-2.0 · ~2.3k stars · pushed 2025-08
- **What:** an agent that **rewrites its own codebase**, keeps an archive of all variants (not just the best),
  and benchmarks each on SWE-bench/Polyglot. Self-improvement with an explicit open-endedness archive.
- **Take:** the **archive-of-all-variants** discipline, and the honesty of its own safety section.
- **Cost:** as a system, very high and probably unwise. As a read, an afternoon.
- **Territories:** 12, 09.
- **Mistake if:** we let anything self-modify the harness. `qa-tier-floor.yml` already marks harness self-edit
  `enforcement: block` because `git revert` does not undo it. DGM is that risk as a product.

### `ShengranHu/ADAS` — automated design of agentic systems
- **URL:** https://github.com/ShengranHu/ADAS · **Licence:** Apache-2.0 · ~1.6k stars · pushed 2025-01 · ICLR 2025
- **What:** a meta-agent writes *new agent architectures as code*, evaluates them, archives them. The paper's
  finding — discovered agents transfer across domains — is the interesting claim.
- **Take:** the idea that **the roster itself is a search space**. This repo collapsed 21 roles to 7 engines
  by hand, and the reasoning was excellent; ADAS is the argument that the hand is not the only tool.
- **Cost:** research code, dormant since Jan 2025. Read it, don't run it.
- **Territories:** 12, 02.
- **Mistake if:** we search for agent architectures using a fitness function as narrow as `npm run check` —
  we would evolve something that games the suite. This repo has already caught a change that *removed a
  control while every test stayed green*.

### `SakanaAI/AI-Scientist` and `-v2` — full autonomous research loop
- **URLs:** https://github.com/SakanaAI/AI-Scientist (~14.5k ★, licence NOASSERTION, pushed 2025-12) ·
  https://github.com/SakanaAI/AI-Scientist-v2 (~7.1k ★, NOASSERTION, pushed 2025-12)
- **What:** idea generation → experiment → write-up → **automated peer review**, end to end. v2 adds agentic
  tree search over the experiment space.
- **Take:** the **automated-reviewer calibration work** — they measured their LLM reviewer against human
  reviewers rather than asserting it worked. That is exactly the evidence this repo lacks for its own panel.
- **Cost:** medium to read, high to run. **Both licences are NOASSERTION — check before touching.**
- **Territories:** 12, 08, 04.
- **Mistake if:** the licence is not read.

---

## 4 · Territory 12/08 — Creativity: variation and selection

**This section exists because of one sentence in the territory map:** the founder's core complaint is that
the system *loses creativity to playbooks*, and that almost everything built is a *stopping* mechanism
rather than a *producing* one. Quality-diversity is the only mature body of code whose explicit objective is
**"produce many different good things"** rather than "produce the best thing". None of the five reference
systems touched it. I think this is the biggest genuinely unexplored territory in the whole study.

### `icaros-usc/pyribs` — quality diversity, bare-bones
- **URL:** https://github.com/icaros-usc/pyribs · **Licence:** MIT · ~262 stars · pushed 2026-07-22 · created 2020-09 · paper GECCO 2023
- **What:** the reference implementation of MAP-Elites and the CMA-ME family. You define **measures** (the
  axes of diversity you care about) and an **objective** (quality). It maintains an *archive*: a grid over
  measure space, each cell holding the best solution found *for that region*. Output is a heatmap of
  distinct good solutions, not a single winner.
- **Take:** **the archive abstraction, applied to work products rather than to genomes.** Concretely: ask for
  a landing page; the measures are (tone: earnest↔playful) × (density: sparse↔dense); the archive keeps the
  best page in each cell; the founder browses a grid of genuinely different good options instead of three
  variations on one idea. That is a *producing* mechanism, which is what the map says is missing.
- **Cost:** low. It is a small, well-documented, dependency-light Python library with a clean
  `ask()`/`tell()` loop. The work is in defining measures, and defining measures is a design conversation, not
  an engineering one.
- **Territories:** 12, 08, 04, 01.
- **Mistake if:** the measures are chosen badly. MAP-Elites is only as good as its behaviour descriptors, and
  a bad descriptor produces an archive of things that differ in ways nobody cares about. Also: it is a small
  library with 262 stars — mature in the academic sense, not the ecosystem sense.

### `SakanaAI/ShinkaEvolve` — LLM-driven program evolution, sample-efficient
- **URL:** https://github.com/SakanaAI/ShinkaEvolve · **Licence:** Apache-2.0 · ~1.4k stars · pushed 2026-08-21 · created 2025-09
- **What:** an evolutionary loop where the *mutation operator is an LLM*, with explicit machinery for
  sample-efficiency — novelty-based rejection of near-duplicate candidates, adaptive selection of which
  parent to mutate, and a bandit over which LLM does the mutating.
- **Take:** the **novelty rejection filter and the LLM-ensemble bandit.** The filter is the answer to "we
  generated 20 options and they're all the same option"; the bandit is a live, working instance of using
  more than one model family — which this repo wants and cannot get.
- **Cost:** medium. Real research code, recent, actively maintained, Apache-2.0.
- **Territories:** 12, 08, 11.
- **Mistake if:** the evaluation is expensive and noisy. Evolution needs many cheap evaluations; our
  verdicts are slow and partly human.

### `algorithmicsuperintelligence/openevolve` — open AlphaEvolve
- **URL:** https://github.com/algorithmicsuperintelligence/openevolve · **Licence:** Apache-2.0 · ~7.3k stars · pushed 2026-07-18 · **(was `codelion/openevolve`)**
- **What:** an open implementation of DeepMind's AlphaEvolve — evolve *whole programs* against an evaluator,
  with an island model and MAP-Elites-style archives.
- **Take:** the **island model** — several sub-populations evolving separately with occasional migration,
  which is how evolutionary computation prevents premature convergence. Directly analogous to running four
  parallel orchestrators that occasionally exchange findings.
- **Cost:** medium.
- **Territories:** 12, 02, 06.
- **Mistake if:** we adopt it for work that has no automatic evaluator. AlphaEvolve worked on problems with
  exact scoring. Marketing copy has no exact scoring.

### `google-deepmind/funsearch` · `adaptive-intelligent-robotics/QDax`
- **URLs:** https://github.com/google-deepmind/funsearch (Apache-2.0, ~1.1k ★, **dormant since 2024-02**) ·
  https://github.com/adaptive-intelligent-robotics/QDax (MIT, ~361 ★, pushed 2025-10)
- **What:** FunSearch is the original "LLM proposes programs, evaluator scores, best go back in the prompt"
  loop, released as reference code for the Nature paper. QDax is JAX-accelerated QD — MAP-Elites at scale.
- **Take:** FunSearch for the **minimal loop** (it is small and readable and shows how little scaffolding the
  idea needs); QDax if we ever need throughput.
- **Cost:** nil to read.
- **Territories:** 12, 08.
- **Mistake if:** treated as maintained software. FunSearch has not moved in over two years.

---

## 5 · Territory 08 — Evaluation, judging and red-teaming

The repo's standing constraint: **union never average, panels return findings not scores, a resolver never
passes what it could not check.** Most eval frameworks in this field do the opposite — they average scores.
Read every entry below against that.

### `UKGovernmentBEIS/inspect_ai` — the one built by a safety institute
- **URL:** https://github.com/UKGovernmentBEIS/inspect_ai · **Licence:** MIT · ~2.7k stars · pushed 2026-09-01 · created 2023-11
- **What:** UK AI Safety Institute's eval framework. Datasets → solvers → **scorers**, with first-class
  multi-model support, a real log format, and a viewer. Built for the case where you must *defend the
  evaluation to a sceptic*, which is precisely this repo's posture.
- **Take:** **the scorer abstraction and the log format**, and plausibly the whole harness for the QA panel.
  Its model-abstraction layer is the credible path to "≥2 distinct model families" *if* a non-Anthropic model
  ever becomes reachable — and unlike a hand-rolled seam, it already handles the plumbing.
- **Cost:** medium. Python, and our gate is JS. But the gate already shells out.
- **Territories:** 08, 12, 09.
- **Mistake if:** it is adopted as a *solution* to the single-family problem. It is a mechanism, not a model —
  the same distinction #103 taught: landing the seam is not satisfying the requirement. Adopting Inspect
  while still having one model family available changes nothing about the accepted risk that runs to
  2026-11-17.

### `promptfoo/promptfoo` — declarative prompt/agent testing + red team
- **URL:** https://github.com/promptfoo/promptfoo · **Licence:** MIT · ~24.7k stars · pushed 2026-09-01
- **What:** YAML-declared test cases with **assertions** — `contains`, `javascript`, `python`, `llm-rubric`,
  and a large red-team plugin set that generates adversarial inputs per vulnerability class.
- **Take:** **the assertion taxonomy**, and specifically the discipline that a deterministic assert is
  preferred and an `llm-rubric` is a fallback. That is this repo's oracle-first ordering, expressed as config.
  The red-team generator is the strongest verified candidate for automated adversarial testing.
- **Cost:** low. Node, config-driven, runs in CI, no service required.
- **Territories:** 08, 09, 12.
- **Mistake if:** we let its scoring model in. promptfoo reports pass rates; this repo returns findings.
  Take the asserts, leave the scoreboard.

### `NVIDIA/garak` — LLM vulnerability scanner
- **URL:** https://github.com/NVIDIA/garak · **Licence:** Apache-2.0 · ~9.1k stars · pushed 2026-08-25
- **What:** `nmap` for LLMs. Probes for prompt injection, data leakage, jailbreak, toxicity, encoding
  attacks, with detectors per probe.
- **Take:** **the probe/detector separation** and the probe corpus. Twelve-things item #8 is worldly risk with
  no tier; garak is the closest verified thing to a standing adversarial suite.
- **Cost:** low-medium. CLI, runs against any endpoint.
- **Territories:** 09, 08.
- **Mistake if:** we scan the *model* when our exposure is the *harness*. Our injection surface is
  `session-start.js` output and tool results, not raw model behaviour. Garak would need custom probes.

### `confident-ai/deepeval` · `vibrantlabsai/ragas` · `Giskard-AI/giskard-oss`
| Project | Licence | Signal | Take |
|---|---|---|---|
| [`confident-ai/deepeval`](https://github.com/confident-ai/deepeval) | Apache-2.0 | ~18k ★, pushed 2026-08-31 | pytest-shaped LLM asserts — the ergonomics are right; 50+ metrics, most of which are scores we would not use |
| [`vibrantlabsai/ragas`](https://github.com/vibrantlabsai/ragas) | Apache-2.0 | ~15.6k ★, **pushed 2026-02-24** | Reference-free RAG metrics (faithfulness, answer-relevancy). Note the six-month gap since last push |
| [`Giskard-AI/giskard-oss`](https://github.com/Giskard-AI/giskard-oss) | Apache-2.0 | ~5.8k ★, pushed 2026-09-01 | **Automatic vulnerability scanning that generates its own test cases** from a model description — the "finder" half done well |

### `Azure/PyRIT` — **archived, and this matters**
- **URL:** https://github.com/Azure/PyRIT · **Licence:** MIT · **archived: yes** · the record returned shows
  ~116 stars and `created_at` 2026-03-25, which is inconsistent with the widely-cited Microsoft red-teaming
  tool and suggests the project was moved and the old path re-created as a stub.
- **Do not adopt on this evidence.** If PyRIT is wanted, find the live path first. Recorded here because a
  stale recommendation of an archived security tool is worse than no recommendation.

### The rest of the eval field, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`meta-llama/PurpleLlama`](https://github.com/meta-llama/PurpleLlama) | Other | ~4.4k ★, pushed 2026-08-18 | CyberSecEval + LlamaFirewall + PromptGuard — injection classifiers you can run locally |
| [`SWE-bench/SWE-bench`](https://github.com/SWE-bench/SWE-bench) | MIT | ~5.8k ★, pushed 2026-09-01 | The benchmark. Take the *harness design* — real repos, real tests, no rubric |
| [`openai/evals`](https://github.com/openai/evals) | Other | ~19.4k ★, pushed 2026-04-14 | Historic; largely superseded by the above |
| [`METR/vivaria`](https://github.com/METR/vivaria) | MIT | ~141 ★, pushed 2026-05-18 | METR's own agent-elicitation runner — small, but built by people who evaluate agents for a living |
| [`braintrustdata/autoevals`](https://github.com/braintrustdata/autoevals) | MIT | ~1k ★, pushed 2026-07-29 | A small library of ready-made scorers, usable without the Braintrust service |
| [`mlflow/mlflow`](https://github.com/mlflow/mlflow) | Apache-2.0 | ~27.8k ★, pushed 2026-09-01 | Now carries LLM eval + tracing; heavy, but the run/experiment model is battle-tested |
| [`wandb/weave`](https://github.com/wandb/weave) | Apache-2.0 | ~1.1k ★, pushed 2026-09-01 | Trace + eval toolkit; ties to W&B |

---

## 6 · Territory 07/13 — Observability, tracing and cost

**The specific gap this addresses: 2,936 transcripts on disk and nothing reads them.** Two very different
answers below — general LLM observability platforms (which want you to instrument your app) and
Claude-Code-specific transcript readers (which read what already exists). **For this repo, the second family
is the immediately actionable one**, because the data is already on disk and no instrumentation is needed.

### `ccusage/ccusage` — cost from transcripts, zero instrumentation
- **URL:** https://github.com/ccusage/ccusage · **Licence:** NOASSERTION (check) · ~18.3k stars · pushed 2026-09-01 · **Rust** · (was `ryoppippi/ccusage`)
- **What:** `npx ccusage`. Parses `~/.claude/projects/**/*.jsonl` and reports token usage and dollar cost by
  day, month, session and model. No hooks, no proxy, no account.
- **Take:** **the JSONL parsing layer**, at minimum. Territory 13 (economics) is currently unmeasured here,
  and this measures it from data we already have, today.
- **Cost:** trivial to *use*. If we vendor the parser, it is Rust — read it, reimplement the schema knowledge.
- **Territories:** 13, 07, 05.
- **Mistake if:** we treat cost-per-session as cost-per-mission. CAST already hit exactly this — its study
  records that "what did this task cost" vs "what did this session cost" is *not answerable as asked*.
  ccusage answers the session question. The mission question needs a task id that survives a session, which
  is our work, not theirs.

### `daaain/claude-code-log` · `simonw/claude-code-transcripts`
- **URLs:** https://github.com/daaain/claude-code-log (MIT, ~1.2k ★, pushed 2026-08-31) ·
  https://github.com/simonw/claude-code-transcripts (Apache-2.0, ~1.7k ★, pushed 2026-02-12)
- **What:** both convert Claude Code session JSONL into browseable HTML.
- **Take:** the **transcript schema knowledge** — what fields exist, what a sidechain looks like, how tool
  calls are recorded. That knowledge is *already load-bearing in this repo*: the `Workflow`-containment
  probe (#111) scanned 55 recorded `Workflow` calls and 57,590 subagent `Bash` calls, which means someone
  here already wrote a transcript parser. These are the maintained versions of it.
- **Cost:** low.
- **Territories:** 07, 05, 10, 12.
- **Mistake if:** we build a third parser instead of consolidating on one.

### `langfuse/langfuse` — the most complete OSS LLM platform
- **URL:** https://github.com/langfuse/langfuse · **Licence:** Other (MIT core + EE dirs — read it) · ~34k stars · pushed 2026-09-01
- **What:** tracing, sessions, prompt management with versioning, datasets, evals, cost. Self-hostable.
- **Take:** the **prompt-versioning-with-deployment-labels** model, and sessions as a first-class grouping.
  Our prompts are agent markdown files in git, which is better for review and worse for "which version
  produced this run".
- **Cost:** medium-high — Postgres + ClickHouse + Redis to self-host. **Licence is mixed; the EE directories
  are not open.**
- **Territories:** 07, 08, 13, 10.
- **Mistake if:** we run a three-database observability stack for one founder. And it requires
  instrumenting the calls — which we do not make, Claude Code does.

### The rest, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`comet-ml/opik`](https://github.com/comet-ml/opik) | Apache-2.0 | ~21.7k ★, pushed 2026-09-01 | Trace + eval + guardrails; genuinely Apache-2.0, unlike some peers |
| [`Arize-ai/phoenix`](https://github.com/Arize-ai/phoenix) | Other | ~11.3k ★, pushed 2026-09-01 | OTel-native; **the OpenInference semantic conventions are the transferable part** |
| [`traceloop/openllmetry`](https://github.com/traceloop/openllmetry) | Apache-2.0 | ~7.4k ★, pushed 2026-08-10 | Pure OpenTelemetry instrumentation — no platform lock-in |
| [`Helicone/helicone`](https://github.com/Helicone/helicone) | Apache-2.0 | ~6.1k ★, pushed 2026-08-31 | Proxy-based; one line of config, but it sits in the request path |
| [`AgentOps-AI/agentops`](https://github.com/AgentOps-AI/agentops) | MIT | ~5.8k ★, pushed 2026-06-25 | Session replay for agents; the replay UX is the idea |
| [`lmnr-ai/lmnr`](https://github.com/lmnr-ai/lmnr) | Apache-2.0 | ~3.2k ★, pushed 2026-09-01 | Rust-backed, purpose-built for agents |
| [`simonw/llm`](https://github.com/simonw/llm) + [`simonw/datasette`](https://github.com/simonw/datasette) | Apache-2.0 | ~12.4k / ~11.4k ★ | **Every LLM call logged to SQLite, then explored with Datasette.** The lowest-ceremony observability stack that exists |
| [`microsoft/LLMLingua`](https://github.com/microsoft/LLMLingua) | MIT | ~6.6k ★, pushed 2026-04-08 | Prompt compression (claimed up to 20x). Directly serves territory 07 |
| [`VILA-Lab/Dive-into-Claude-Code`](https://github.com/VILA-Lab/Dive-into-Claude-Code) | NOASSERTION | ~2.1k ★, pushed 2026-08-19 | A systematic analysis *of Claude Code itself* as an agent system. Not a dependency — a reading |

---

## 7 · Territory 01/11 — Orchestration, durability and human-in-the-loop

**The gap: "missions that outlive a session", "you cannot steer something already running", "blocked and
stalled look identical".** This is the most mature field in the whole study — durable execution has been
solved in industry for a decade and the agent world is only now noticing.

### `temporalio/temporal` — durable execution, deterministic replay
- **URL:** https://github.com/temporalio/temporal · **Licence:** MIT · ~22.7k stars · pushed 2026-09-01 · created 2019-10
- **What:** you write a workflow as ordinary code; Temporal persists an **event history** of every step, and
  on any crash or restart it *replays the history* to reconstruct state exactly. Activities retry with
  policy. **Signals** let an outside party send input into a running workflow. **Queries** read its state
  without disturbing it. Timers survive process death and can run for months.
- **Take:** several distinct things, separable:
  - **Signals** are literally "you cannot steer something already running", solved. A running mission
    receives a redirect.
  - **Queries** are "blocked vs stalled" — you can ask a live workflow what it is waiting on.
  - **Event-history replay** is run replay, done properly, and it is the same mechanism as deterministic
    verification: the history is the evidence.
  - **Heartbeats + activity timeouts** distinguish *making progress* from *hung*.
- **Cost:** **high, and honestly so.** It is a server (or Temporal Cloud), an SDK, and a genuine mental model
  — workflow code must be deterministic, which is a real constraint. The TypeScript SDK is good. Expect
  weeks, not days.
- **Territories:** 01, 11, 06, 10, 09.
- **Mistake if:** we adopt the server for a one-founder company's five concurrent missions. The honest
  alternative is to **steal the four ideas above and implement them over SQLite**, and only reach for
  Temporal if the mission count justifies an operational dependency. Also: agent work is *inherently*
  non-deterministic, and Temporal's model puts the non-determinism in activities, not workflows — get that
  boundary wrong and you get replay corruption that is very hard to debug.

### `dbos-inc/dbos-transact-py` — durable execution as a library, not a server
- **URL:** https://github.com/dbos-inc/dbos-transact-py · **Licence:** MIT · ~1.6k stars · pushed 2026-09-01 · (TS sibling exists)
- **What:** the same durable-workflow guarantees as Temporal, but the state lives in **your Postgres** and it
  is a library in your process. No separate cluster.
- **Take:** possibly the whole thing. **This is the pragmatic version of the Temporal idea** — decorators over
  functions, checkpoints in a table you can query with SQL, and the recovery story is "restart the process".
- **Cost:** **low-medium — by far the best cost/benefit in this section.** Needs Postgres, which the stack
  already has (Supabase).
- **Territories:** 01, 11, 13.
- **Mistake if:** we need cross-language or long-lived (months) timers at scale, where Temporal's maturity
  earns its operational cost. Also much younger and smaller.

### `restatedev/restate` — durable execution with a Rust single binary
- **URL:** https://github.com/restatedev/restate · **Licence:** Other (BSL — check carefully) · ~4.4k stars · pushed 2026-09-01
- **What:** Temporal-class guarantees, one self-contained binary, built-in durable promises and awakeables
  (an external event resumes a suspended workflow — exactly the shape of "wait for founder approval").
- **Take:** **awakeables** as the model for a human gate that costs nothing while it waits. This repo's
  `gates.yml` has three `kind: human` gates with no `run:`; awakeables are what makes a human gate a first-class
  suspended state rather than a stopped session.
- **Cost:** medium. **Licence needs reading before anything else — it is not a plain OSI licence.**
- **Territories:** 01, 09, 10.
- **Mistake if:** the licence is skimmed.

### `humanlayer/humanlayer` — approvals as an API
- **URL:** https://github.com/humanlayer/humanlayer · **Licence:** Other · ~11.4k stars · **pushed 2026-06-19**
- **What:** wraps a function so that calling it *requests human approval* through Slack, email or a web UI,
  and blocks until answered. Plus `12-factor-agents` (same org, ~25.6k ★, NOASSERTION, pushed 2025-09) — the
  principles doc, which is prose not code.
- **Take:** **the approval-request contract**: a tool call becomes a durable request with an id, a channel, a
  requester, and a decision record. Twelve-things item: *the escalation Inbox has been empty on every project
  ever* — this is the machinery that would put something in it, over a channel the founder actually reads.
- **Cost:** low-medium as a pattern; the hosted service is the product.
- **Territories:** 09, 10, 01.
- **Mistake if:** approvals route through a third-party service for a system whose entire safety posture is
  local. And the repo has not moved since June.

### `langchain-ai/langgraph` — checkpointed state machines with interrupts
- **URL:** https://github.com/langchain-ai/langgraph · **Licence:** MIT · ~40.9k stars · pushed 2026-09-01
- **What:** agents as explicit graphs with **checkpointers** (persist state after each node), **interrupts**
  (pause for human input mid-graph and resume later), and time-travel (resume from any past checkpoint).
- **Take:** the **interrupt-and-resume** primitive and the checkpointer interface. Time-travel debugging of
  an agent run is a genuinely good idea we do not have.
- **Cost:** medium — but adopting LangGraph means adopting an agent runtime that competes with Claude Code's.
- **Territories:** 01, 09, 10, 11.
- **Mistake if:** we end up running agents in two runtimes. Same argument as Letta.

### The rest, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`hatchet-dev/hatchet`](https://github.com/hatchet-dev/hatchet) | MIT | ~7.8k ★, pushed 2026-09-01 | Postgres-backed task queue with DAGs, concurrency limits and fairness — the "which mission runs now" primitive |
| [`resonatehq/resonate`](https://github.com/resonatehq/resonate) | Apache-2.0 | ~657 ★, pushed 2026-09-01 | Distributed async-await; the smallest durable-execution mental model of the lot |
| [`windmill-labs/windmill`](https://github.com/windmill-labs/windmill) | Other | ~17.8k ★, pushed 2026-09-01 | Scripts → workflows → auto-generated UIs. **The auto-UI is the interesting part for mission control** |
| [`PrefectHQ/prefect`](https://github.com/PrefectHQ/prefect) | Apache-2.0 | ~23.8k ★, pushed 2026-09-01 | Mature Python orchestration; retries/observability for free |
| [`dagster-io/dagster`](https://github.com/dagster-io/dagster) | Apache-2.0 | ~16.1k ★, pushed 2026-09-01 | **Software-defined assets** — you declare the artifact that should exist, not the task. Maps onto "missions produce deliverables" better than any task-DAG model |
| [`kestra-io/kestra`](https://github.com/kestra-io/kestra) | Apache-2.0 | ~28k ★, pushed 2026-09-01 | Declarative YAML orchestration, event-driven |
| [`inngest/inngest`](https://github.com/inngest/inngest) | NOASSERTION | ~5.8k ★, pushed 2026-09-01 | Already the declared stack default. Durable steps, no infra |
| [`triggerdotdev/trigger.dev`](https://github.com/triggerdotdev/trigger.dev) | Apache-2.0 | ~16.2k ★, pushed 2026-09-01 | Same niche as Inngest, self-hostable, now explicitly agent-shaped |
| [`langchain-ai/agent-inbox`](https://github.com/langchain-ai/agent-inbox) | MIT | ~1.1k ★, pushed 2026-08-31 | **An inbox UX for human-in-the-loop agents.** Small, and it is the shape the empty escalation Inbox needs |
| [`n8n-io/n8n`](https://github.com/n8n-io/n8n) | Other (fair-code) | ~203k ★, pushed 2026-09-01 | Already connected on the founder's account as an MCP. Fair-code, not OSI |
| [`activepieces/activepieces`](https://github.com/activepieces/activepieces) | Other | ~24.2k ★, pushed 2026-09-01 | n8n-alike that ships MCP servers for agents |

---

## 8 · Territory 01 — Missions, goals and task graphs

**The gap: "nothing decides what to do next — five goals, one window."** This is the thinnest field
relative to its importance, and `beads` dominates it.

### `gastownhall/beads` — a graph issue tracker built for agents
- **URL:** https://github.com/gastownhall/beads · **Licence:** MIT · ~26.8k stars · **Go** · pushed 2026-09-01 · created 2025-10 · (was `steveyegge/beads`)
- **What:** issues as a **dependency graph**, stored as JSONL in git (`.beads/beads.jsonl`), cached in SQLite
  for query speed, with hash-based ids (`bd-a1b2`) chosen so parallel agents do not collide on id assignment.
  `bd ready` returns the issues whose dependencies are satisfied — i.e. **it answers "what should I work on
  next" mechanically**. Steve Yegge's framing is the "50 First Dates" problem: agents have no memory between
  sessions and replace it with a swamp of conflicting markdown plans.
- **Take:** **plausibly the whole thing.** Note the fit with what this repo already is: git-native, plain-text,
  reviewable in a PR, no service, one binary. The `bd ready` query is the missing scheduler; the dependency
  edges are the missing goal tree; the hash ids are the missing collision story for parallel orchestrators.
  Metaswarm delegates its entire issue/knowledge layer to it, which is prior art that it composes.
- **Cost:** **low.** A Go binary and a directory. Reversible — the data is JSONL in your repo.
- **Territories:** 01, 06, 05, 02.
- **Mistake if:** (a) it becomes a *third* state store beside `DECISIONS.md` and the claim ledger without
  anything reconciling them — this repo's characteristic failure is two implementations of one thing; (b) the
  JSONL merge story does not survive several worktrees writing at once, which is our actual topology and
  should be tested before adoption, not after; (c) we adopt the tracker and still have nothing that *decides*
  — `bd ready` returns a set, and picking from the set is the judgement we have not built.

### `MrLesk/Backlog.md` — markdown task management in git
- **URL:** https://github.com/MrLesk/Backlog.md · **Licence:** MIT · ~6.6k stars · pushed 2026-09-01
- **What:** tasks as markdown files in the repo, with a CLI and a web/kanban view, explicitly designed for
  humans and agents to share.
- **Take:** the lighter alternative to beads if the graph is overkill. Its **acceptance-criteria-per-task**
  convention is a good fit for our playbook exit criteria.
- **Cost:** very low.
- **Territories:** 01, 10.
- **Mistake if:** we need dependencies and scheduling — it is a list, not a graph.

### `github/spec-kit` — spec-driven development, from GitHub
- **URL:** https://github.com/github/spec-kit · **Licence:** MIT · ~132.8k stars (verify) · pushed 2026-09-01 · created 2025-08
- **What:** a workflow of `/specify` → `/plan` → `/tasks` → `/implement`, with the *spec* as the durable
  artifact and the code as its output. Ships as slash commands for several agent CLIs.
- **Take:** the **constitution** concept — a project-level document of non-negotiable principles that every
  generated plan is checked against. That is `CLAUDE.md`'s Rules table with an enforcement story attached.
- **Cost:** low. It is markdown and scripts.
- **Territories:** 01, 04, 08.
- **Mistake if:** we add a fourth planning vocabulary. This repo already has playbooks with stages and exit
  claims, and GSD (already studied) has a five-step phase loop. Adding spec-kit's four is not free.

### The rest, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`git-bug/git-bug`](https://github.com/git-bug/git-bug) | GPL-3.0 | ~10k ★, pushed 2026-07-06 | Distributed bug tracker embedded **in git objects** — no files, offline-first, bridges to GitHub. GPL |
| [`BloopAI/vibe-kanban`](https://github.com/BloopAI/vibe-kanban) | Apache-2.0 | ~28k ★, **pushed 2026-04-24** | Kanban board over running coding agents. Four months quiet |
| [`eyaltoledano/claude-task-master`](https://github.com/eyaltoledano/claude-task-master) | NOASSERTION | ~28k ★, **pushed 2026-04-28** | PRD → task graph with complexity scoring. Licence is non-standard |
| [`Significant-Gravitas/AutoGPT`](https://github.com/Significant-Gravitas/AutoGPT) | NOASSERTION | ~187k ★, pushed 2026-09-01 | Now a visual agent-builder platform. Historically the origin of the goal-loop idea |
| [`yoheinakajima/babyagi`](https://github.com/yoheinakajima/babyagi) | **no licence** | ~22.4k ★, pushed 2026-01-31 | The original task-creation/prioritisation loop. Read the 140 lines; do not depend on it |

---

## 9 · Territory 04 — Knowledge and research

### `assafelovic/gpt-researcher` — research with citations, as a working agent
- **URL:** https://github.com/assafelovic/gpt-researcher · **Licence:** Apache-2.0 · ~29.2k stars · pushed 2026-08-27
- **What:** plan sub-queries → search in parallel → scrape → **aggregate with citations** → write a report,
  with a deep-research mode that recurses.
- **Take:** the **citation-carrying aggregation step**. This repo's `sourcer` must return URL + access date +
  confidence + gaps; gpt-researcher is that contract implemented with parallelism.
- **Cost:** low-medium.
- **Territories:** 04, 08.
- **Mistake if:** it replaces `sourcer` rather than informing it. Our `claim-source` resolver *fetches the URL
  and asserts the quote is present* — a stricter standard than any of these meet.

### `stanford-oval/storm` — outline-first long-form research
- **URL:** https://github.com/stanford-oval/storm · **Licence:** MIT · ~31.2k stars · **pushed 2025-09-30 (a year quiet)**
- **What:** generates a Wikipedia-style article by first **simulating multi-perspective interviews** between a
  writer and topic experts, using the conversation to build an outline, then writing to the outline.
- **Take:** **perspective-guided question generation** — the mechanism that stops research being one
  viewpoint's search history. Directly relevant to the creativity complaint.
- **Cost:** the idea is free; the code is a year stale.
- **Territories:** 04, 12.
- **Mistake if:** we depend on a dormant research repo.

### The rest, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`infiniflow/ragflow`](https://github.com/infiniflow/ragflow) | Apache-2.0 | ~89.8k ★, pushed 2026-09-01 | Deep document understanding first, retrieval second. Heavy but serious |
| [`docling-project/docling`](https://github.com/docling-project/docling) | MIT | ~65.9k ★, pushed 2026-09-01 | IBM's document→structured converter. Best-in-class PDF/table handling |
| [`microsoft/markitdown`](https://github.com/microsoft/markitdown) | MIT | ~177k ★ (verify), pushed 2026-08-31 | Anything → markdown. The trivial-cost ingestion default |
| [`Unstructured-IO/unstructured`](https://github.com/Unstructured-IO/unstructured) | Apache-2.0 | ~15.4k ★, pushed 2026-08-28 | The workhorse partitioner |
| [`firecrawl/firecrawl`](https://github.com/firecrawl/firecrawl) | **AGPL-3.0** | ~175k ★ (verify), pushed 2026-09-01 | Scrape/crawl/search API, self-hostable. AGPL matters |
| [`jina-ai/reader`](https://github.com/jina-ai/reader) | Apache-2.0 | ~11.9k ★, pushed 2026-05-22 | `r.jina.ai/<url>` → clean markdown. One-line web reading |
| [`SciPhi-AI/R2R`](https://github.com/SciPhi-AI/R2R) | MIT | ~8k ★, **pushed 2025-11** | Production agentic RAG with graphs + auth. Going quiet |
| [`langchain-ai/open_deep_research`](https://github.com/langchain-ai/open_deep_research) | MIT | ~12.7k ★, **ARCHIVED** | Read it as a reference implementation; do not depend on it |
| [`deepset-ai/haystack`](https://github.com/deepset-ai/haystack) | Apache-2.0 | ~26.4k ★, pushed 2026-09-01 | Composable pipelines; the most sober of the orchestration libraries |
| [`qdrant/qdrant`](https://github.com/qdrant/qdrant) · [`chroma-core/chroma`](https://github.com/chroma-core/chroma) · [`lancedb/lancedb`](https://github.com/lancedb/lancedb) | Apache-2.0 ×3 | ~34.3k / ~29.2k / ~11.3k ★, all pushed 2026-09-01 | Vector stores. **LanceDB is embedded and file-based — the only one that adds no service** |

---

## 10 · Territory 06 — Communication and shared workspaces

Weakest field relative to its importance. The big multi-agent frameworks all solve *their own* internal
messaging and none of it is extractable; the dedicated blackboard projects are tiny.

### `FoundationAgents/MetaGPT` — the AI software company, as a codebase
- **URL:** https://github.com/FoundationAgents/MetaGPT · **Licence:** MIT · ~70.2k stars · **pushed 2026-01-21** · (was `geekan/MetaGPT`)
- **What:** roles (PM, architect, engineer, QA) communicating through a **shared message pool with a
  publish/subscribe model** — agents publish structured messages and subscribe to the types they care about,
  rather than being handed a conversation. SOPs are encoded as the artifacts each role must produce.
- **Take:** **the message pool with typed subscription.** It is the one production-scale implementation of a
  blackboard in this space, and it is the direct answer to "worker↔worker, the baton, collisions".
- **Cost:** high to adopt (it is a whole framework, Python, opinionated); low to read the pool implementation.
- **Territories:** 06, 02, 14.
- **Mistake if:** we take the roles. This repo *already collapsed* 21 role-agents into 7 engines and the
  argument was that domain is a lens, not an agent. MetaGPT is the system that argument rejects. Take the
  transport, refuse the org chart. Also: eight months since last push.

### `OpenBMB/ChatDev` — the same idea, chained
- **URL:** https://github.com/OpenBMB/ChatDev · **Licence:** Apache-2.0 · ~34.2k stars · pushed 2026-07-24
- **What:** a "chat chain" decomposes work into sequential two-agent dialogues, each with a defined
  role-pair and exit condition.
- **Take:** the **two-agent-dialogue-with-exit-condition** primitive — pair work, which the territory map
  names and nothing here has.
- **Cost:** medium.
- **Territories:** 06, 02.
- **Mistake if:** we believe the demos. ChatDev builds toy apps.

### `a2aproject/A2A` — the agent-to-agent protocol
- **URL:** https://github.com/a2aproject/A2A · **Licence:** Apache-2.0 · ~25.6k stars · pushed 2026-09-01 · created 2025-03
- **What:** an open protocol (Google-originated, now Linux Foundation) for agents to discover each other via
  **Agent Cards**, exchange tasks with a defined lifecycle (submitted → working → input-required → completed),
  and stream updates.
- **Take:** the **task lifecycle states** — and specifically `input-required` as a distinct state from
  `working`. That is "blocked vs stalled look identical", named in a public protocol.
- **Cost:** low to steal the state machine; high and premature to implement the protocol.
- **Territories:** 06, 01, 10.
- **Mistake if:** we implement a cross-org interop protocol for a company with one org.

### The rest, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`microsoft/autogen`](https://github.com/microsoft/autogen) | CC-BY-4.0 | ~60.7k ★, **pushed 2026-04-15** | GroupChat + a selector deciding who speaks next. The selector is the takeaway |
| [`camel-ai/camel`](https://github.com/camel-ai/camel) | Apache-2.0 | ~17.7k ★, pushed 2026-08-31 | Role-playing with **inception prompting**; large body of multi-agent research |
| [`crewAIInc/crewAI`](https://github.com/crewAIInc/crewAI) | MIT | ~57.9k ★, pushed 2026-09-01 | Crews + flows; the delegation-as-a-tool pattern |
| [`openai/openai-agents-python`](https://github.com/openai/openai-agents-python) | MIT | ~29.1k ★, pushed 2026-09-01 | **Handoffs as a first-class primitive** — the cleanest small statement of the baton |
| [`google/adk-python`](https://github.com/google/adk-python) | Apache-2.0 | ~21.4k ★, pushed 2026-09-01 | Hierarchical agents + built-in eval; Google's take |
| [`agno-agi/agno`](https://github.com/agno-agi/agno) | Apache-2.0 | ~42k ★, pushed 2026-09-01 | Fast, batteries-included; teams with shared session state |
| [`2FastLabs/agent-squad`](https://github.com/2FastLabs/agent-squad) | Apache-2.0 | ~7.8k ★, pushed 2026-08-27 | Was AWS's multi-agent orchestrator; classifier routes to the right agent |
| [`modelcontextprotocol/servers`](https://github.com/modelcontextprotocol/servers) | NOASSERTION | ~90k ★, pushed 2026-08-31 | The reference MCP server corpus. Mostly the hands lane's business |
| [`whiteducksoftware/flock`](https://github.com/whiteducksoftware/flock) | MIT | ~117 ★, pushed 2026-08-27 | Explicitly a declarative **blackboard** multi-agent system. Small but the only one that names the pattern and is maintained |
| [`Icyoung/ufoo`](https://github.com/Icyoung/ufoo) | Other | ~19 ★, pushed 2026-09-01 | Project-scoped workspace for Claude Code/Codex with an event bus, shared decisions, agent registry. **Tiny — read for the design, do not depend** |

---

## 11 · Territory 09 — Safety, policy and sandboxing

### `anthropic-experimental/sandbox-runtime` — the sandbox, as a library
- **URL:** https://github.com/anthropic-experimental/sandbox-runtime · **Licence:** Apache-2.0 · ~5.1k stars · pushed 2026-09-01 · created 2025-10
- **What:** Anthropic's own filesystem+network sandboxing tool — Seatbelt on macOS, bubblewrap on Linux —
  packaged standalone, with a proxy-based network allowlist.
- **Take:** **this is the most operationally relevant single entry in the document.** `docs/03-system-design/SANDBOX.md`
  and the CLAUDE.md worktree section record real, measured, unresolved sandbox problems here: `git worktree add`
  fails with exit 128 and 32 `Operation not permitted` denials anywhere under the armed sandbox; `allowWrite`
  entries that match the refused path do not lift it; `check:mc` fails on a denied loopback `bind()` reported
  as a synthetic `EADDRINUSE` with `errno: 0`; and the docs record that the sandbox exposes *no setting for
  inbound or loopback binding*. This repo is the *only* one of these projects with a documented, reproduced
  reading of those failures. **Reading this source is the cheapest available path to understanding why**, and
  possibly to a configuration that works — or to a well-evidenced upstream issue.
- **Cost:** nil to read. Low to run standalone for the one command that needs escalation.
- **Territories:** 09, 11, 03.
- **Mistake if:** we assume it is the *same build* Claude Code embeds. It is `anthropic-experimental` — treat
  behavioural agreement as a hypothesis to test, not a given. And the repo's own framing stands: the sandbox
  is a guardrail against accident, not containment against the agent.

### `open-policy-agent/opa` — policy as data, decided outside the code
- **URL:** https://github.com/open-policy-agent/opa · **Licence:** Apache-2.0 · ~12.2k stars · pushed 2026-09-01 · created 2015 · CNCF graduated
- **What:** a general policy engine. Policies in Rego, evaluated against a JSON input, returning a decision
  plus (importantly) **a decision log**.
- **Take:** **the decision-log discipline** and the input/policy/data separation. This repo already believes
  policy should be data — `qa-tier-floor.yml`, `lenses.yml`, `gates.yml`, `CURATION.yml`. OPA is the mature
  version, including the parts we lack: a policy *test* framework, coverage reporting, and a bundle format.
- **Cost:** medium. Rego is a genuine learning curve and is widely disliked on first contact.
- **Territories:** 09, 08.
- **Mistake if:** we replace a linted YAML file that a founder can read with Rego that only one agent can
  write. This repo's entire argument for data-over-prose is *readability under review*.

### `cerbos/cerbos` · `openfga/openfga` — the lighter policy options
- **URLs:** https://github.com/cerbos/cerbos (Apache-2.0, ~4.6k ★, pushed 2026-09-01) ·
  https://github.com/openfga/openfga (Apache-2.0, ~5.7k ★, pushed 2026-08-31)
- **What:** Cerbos is **YAML** policies with a test framework — much closer to this repo's existing idiom than
  Rego. OpenFGA is Google-Zanzibar relationship-based authorization.
- **Take:** Cerbos's **policy-test format** is directly stealable for `qa-tier-floor.yml`; OpenFGA's
  relationship model is the right shape if "which worker may touch which mission" ever becomes real.
- **Cost:** low-medium.
- **Territories:** 09, 02.
- **Mistake if:** we add a permission service before we have permissions worth guarding. Today the tool grants
  are a `tools:` line in eighteen files, and a lint checks it.

### `dagger/container-use` — a container per agent
- **URL:** https://github.com/dagger/container-use · **Licence:** Apache-2.0 · ~4k stars · **pushed 2026-08-17**
- **What:** gives each coding agent its own containerised environment **and its own git branch**, so several
  agents work in parallel without stepping on each other, with full command history per environment.
- **Take:** the model is *exactly* our worktree protocol with the isolation actually enforced. Our own
  CLAUDE.md concedes that "isolation between agents inside a session is a convention they keep, not a rule
  anything enforces." This enforces it.
- **Cost:** medium — Docker per agent, and it changes how a builder is launched.
- **Territories:** 09, 11, 02.
- **Mistake if:** container startup cost per builder dominates, or MCP servers and credentials that live on
  the host become unreachable inside the container.

### The rest, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`e2b-dev/E2B`](https://github.com/e2b-dev/E2B) | Apache-2.0 | ~13.6k ★, pushed 2026-08-31 | Firecracker microVM sandboxes for agent code execution. Self-hostable but non-trivially |
| [`NVIDIA-NeMo/Guardrails`](https://github.com/NVIDIA-NeMo/Guardrails) | NOASSERTION | ~7k ★, pushed 2026-09-01 | Colang-scripted conversational rails; dialogue-shaped, not tool-shaped |
| [`guardrails-ai/guardrails`](https://github.com/guardrails-ai/guardrails) | Apache-2.0 | ~7.3k ★, pushed 2026-08-27 | Validators over LLM output with a hub of pre-built ones |
| [`protectai/llm-guard`](https://github.com/protectai/llm-guard) | MIT | ~3.2k ★, **ARCHIVED** | Good scanner set; **archived — vendor the scanners or skip** |
| [`invariantlabs-ai/invariant`](https://github.com/invariantlabs-ai/invariant) | Apache-2.0 | ~453 ★, **pushed 2026-01-12** | Guardrails expressed as *trace* policies — "no tool X after untrusted content Y". The right abstraction for injection; nearly dormant |
| [`data-privacy-stack/presidio`](https://github.com/data-privacy-stack/presidio) | MIT | ~10.7k ★, pushed 2026-08-31 | PII detection/redaction. Needed the moment an agent touches customer data |
| [`trufflesecurity/trufflehog`](https://github.com/trufflesecurity/trufflehog) | AGPL-3.0 | ~27.6k ★, pushed 2026-09-01 | Finds **and verifies** leaked credentials — verification is the differentiator |
| [`semgrep/semgrep`](https://github.com/semgrep/semgrep) | LGPL-2.1 | ~16.5k ★, pushed 2026-09-01 | Already used by the Lite tier. Worth knowing the custom-rule path |

---

## 12 · Territory 10/11 — Surfaces, runtime and model plurality

**Two gaps here: "the founder talks to this system by voice; nothing is designed for that", and
"single-family review is an accepted risk".**

### `musistudio/claude-code-router` — Claude Code against other models
- **URL:** https://github.com/musistudio/claude-code-router · **Licence:** MIT · ~37k stars · pushed 2026-09-01
- **What:** a local control plane that intercepts Claude Code's API calls and routes them to other providers,
  with per-scenario routing (background / think / long-context / web-search).
- **Take:** **this is the most direct verified route to a second model family inside Claude Code**, which is
  the thing the repo has recorded as structurally unavailable since 2026-08-20 and which blocks three judge
  claims, the `risk: high` predicate, and the `irreversible` tier's 2-of-3 requirement.
- **Cost:** low to trial, and the trial is the point — **it either works or it does not, and one afternoon
  settles a question that has been open for six weeks.**
- **Territories:** 11, 08, 13.
- **Mistake if:** we treat "another model answered" as "an independent judge answered" without checking what
  the router actually did — a misconfigured route that silently falls back to the same family would produce
  a *fake* second opinion, which is worse than an honest single-family one. The repo's own rule 10 governs:
  a resolver never passes what it could not check. Also: intercepting the harness's own API calls is a
  security surface, and this is a third-party binary in the credential path.

### `BerriAI/litellm` — one API over 100+ providers
- **URL:** https://github.com/BerriAI/litellm · **Licence:** Other · ~57.8k stars · pushed 2026-09-01
- **What:** unified OpenAI-shaped interface across providers, plus a proxy with keys, budgets, rate limits,
  fallbacks and spend tracking per team/user.
- **Take:** **the budget/spend-per-key feature** is territory 13 done properly — a per-mission budget that the
  gateway enforces, rather than a number in a document. And it is the model-plurality substrate underneath
  any judge panel.
- **Cost:** low-medium as a proxy.
- **Territories:** 11, 13, 08.
- **Mistake if:** everything routes through one process that can be misconfigured, and the licence is not
  plain OSI — read it.

### `livekit/agents` · `pipecat-ai/pipecat` — voice, properly
- **URLs:** https://github.com/livekit/agents (Apache-2.0, ~13.9k ★, pushed 2026-09-01) ·
  https://github.com/pipecat-ai/pipecat (BSD-2-Clause, ~15.1k ★, pushed 2026-09-01)
- **What:** real-time voice agent frameworks — STT/LLM/TTS pipelines with turn detection, interruption
  handling and telephony. Pipecat is a frame-based pipeline; LiveKit is WebRTC-native.
- **Take:** the **interruption/turn-taking machinery**, which is the hard part and is nobody's side project.
  Twelve-things item #9: the founder talks to this system by voice and nothing is designed for it. Steering a
  running mission by voice is a real product, and these are the two credible substrates.
- **Cost:** medium-high. Real-time audio is its own discipline.
- **Territories:** 10, 01.
- **Mistake if:** we build voice before there is anything worth steering, or before the "steer a running
  thing" primitive (§7) exists — voice into a system that cannot be redirected is a demo.

### The rest, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`OpenHands/OpenHands`](https://github.com/OpenHands/OpenHands) | MIT | ~85.9k ★, pushed 2026-09-01 | The most complete OSS coding-agent platform. **Its `condenser` (context compaction) and `microagents` (triggered knowledge injection) are the two extractable subsystems** |
| [`anomalyco/opencode`](https://github.com/anomalyco/opencode) | MIT | ~203k ★ (verify), pushed 2026-09-01 | Terminal coding agent, provider-agnostic, client/server split. Was `sst/opencode` |
| [`aaif-goose/goose`](https://github.com/aaif-goose/goose) | Apache-2.0 | ~53.8k ★, pushed 2026-09-01 | Rust agent with **recipes** (shareable parameterised task definitions) — a good model for packaged missions |
| [`openai/codex`](https://github.com/openai/codex) | Apache-2.0 | ~120.6k ★, pushed 2026-09-01 | **Not installed on this machine** per the territory map. The second-family question again |
| [`google-gemini/gemini-cli`](https://github.com/google-gemini/gemini-cli) | Apache-2.0 | ~106.8k ★, pushed 2026-09-01 | **Installed here and never executed.** A free second family sitting unused |
| [`cline/cline`](https://github.com/cline/cline) | Apache-2.0 | ~67.3k ★, pushed 2026-09-01 | Now an SDK/CLI too. The "memory bank" convention originated here |
| [`Aider-AI/aider`](https://github.com/Aider-AI/aider) | Apache-2.0 | ~48.6k ★, **pushed 2026-05-22** | Repo-map-from-tree-sitter is the durable idea |
| [`charmbracelet/crush`](https://github.com/charmbracelet/crush) | Other | ~27.8k ★, pushed 2026-09-01 | Best-looking terminal agent; Charm's TUI stack is separately stealable for mission control |
| [`continuedev/continue`](https://github.com/continuedev/continue) | Apache-2.0 | ~35.7k ★, pushed 2026-09-01 | Open coding agent + a rules/config format |
| [`slopus/happy`](https://github.com/slopus/happy) | MIT | ~23.6k ★, pushed 2026-08-28 | **Mobile + web client for Claude Code with realtime sync.** Territory 10's phone surface, already built |
| [`omnara-ai/omnara`](https://github.com/omnara-ai/omnara) | Apache-2.0 | ~2.8k ★, pushed 2026-09-01 | "Open-source alternative to Claude Managed Agents" — launch/monitor/respond from anywhere |
| [`smtg-ai/claude-squad`](https://github.com/smtg-ai/claude-squad) | AGPL-3.0 | ~8.4k ★, pushed 2026-08-20 | Multiple terminal agents in tmux+worktrees. **Closest existing thing to our parallel-orchestrator topology** |
| [`stravu/crystal`](https://github.com/stravu/crystal) | MIT | ~3.1k ★, **pushed 2026-02-26** | Desktop multi-session manager; renamed to Nimbalyst, going quiet |
| [`coder/agentapi`](https://github.com/coder/agentapi) | MIT | ~1.5k ★, **pushed 2026-05-27** | **HTTP API in front of Claude Code/Goose/Aider/Gemini.** The cleanest verified answer to "control a running agent programmatically" |
| [`open-webui/open-webui`](https://github.com/open-webui/open-webui) | Other | ~150.6k ★, pushed 2026-09-01 | A finished chat surface. Licence has a branding clause — read it |
| [`vercel/ai`](https://github.com/vercel/ai) | Other | ~26.5k ★, pushed 2026-09-01 | The TS SDK the Ralph loop (already studied) is built on |
| [`mastra-ai/mastra`](https://github.com/mastra-ai/mastra) | NOASSERTION | ~27.6k ★, pushed 2026-09-01 | TS agent framework with workflows, evals and memory in one place — the TS-native alternative to the Python field |
| [`BoundaryML/baml`](https://github.com/BoundaryML/baml) | Apache-2.0 | ~9.1k ★, pushed 2026-09-01 | Typed LLM functions with **tests in the language itself**. Structured returns with a compiler behind them |
| [`567-labs/instructor`](https://github.com/567-labs/instructor) | MIT | ~13.8k ★, pushed 2026-08-31 | Pydantic-validated structured outputs with retries |
| [`ggml-org/whisper.cpp`](https://github.com/ggml-org/whisper.cpp) | MIT | ~53.4k ★, pushed 2026-08-31 | Local STT, no API |
| [`KoljaB/RealtimeSTT`](https://github.com/KoljaB/RealtimeSTT) | MIT | ~10.1k ★, pushed 2026-08-30 | Low-latency STT with VAD and wake words |

---

## 13 · Territory 08/14 — The world's verdict, and the company's own organs

**The gap this addresses is #5 in the twelve-things list, and I think it is the most under-served:
"No verdict from the world — nothing asks *did it work*, only *is it right*."** Every reference system
studied, and this repo, measures correctness. None measures consequence. These projects measure consequence,
they are all mature, and none of them is an agent framework — which is probably why nobody looked.

### `PostHog/posthog` — the world's verdict as a queryable API
- **URL:** https://github.com/PostHog/posthog · **Licence:** MIT-core (with a proprietary `ee/` directory — read it) · ~39.5k stars · pushed 2026-01-23 onward, pushed 2026-09-01
- **What:** product analytics, session replay, feature flags, experiments and surveys in one self-hostable
  platform, all reachable over an API.
- **Take:** **the feedback edge.** A mission that ships a landing page can, a week later, *ask whether anyone
  converted* — and that answer can be a claim in the ledger with a `verified_by: command` resolver, which is
  the strongest verification class this repo has. It converts "did it work" from a question nobody asks into
  a query with a number.
- **Cost:** medium — self-hosting is heavy (ClickHouse), but the cloud free tier plus an API key is a day.
- **Territories:** 08, 14, 12, 13.
- **Mistake if:** we install analytics before anything ships. The territory map records that **no venture
  work has ever run through this harness** — a verdict mechanism with nothing to judge is another
  built-and-never-wired entry, which the map names as the endemic failure mode.

### `growthbook/growthbook` — experiments with a real statistics engine
- **URL:** https://github.com/growthbook/growthbook · **Licence:** Other (MIT core + commercial) · ~8.2k stars · pushed 2026-09-01
- **What:** feature flags plus A/B testing, where the **statistics engine (Bayesian and frequentist,
  sequential testing, CUPED variance reduction) runs against your existing data warehouse** — it does not
  need its own event pipeline.
- **Take:** **the stats engine.** Territory 12 names A/B testing as part of self-improvement, and this repo's
  standing rule is that a resolver never passes what it could not check. A difference that is not
  statistically significant is exactly a thing that could not be checked — and this is the verified OSS that
  makes that determination properly, including for the harness's own changes.
- **Cost:** low-medium. Self-hostable, and the SDK is small.
- **Territories:** 12, 08, 14.
- **Mistake if:** we run experiments at a sample size where nothing can reach significance, and then act on
  the point estimate anyway. That is worse than not measuring, because it launders a guess as evidence.

### The rest, verified

| Project | Licence | Signal | One line |
|---|---|---|---|
| [`getsentry/sentry`](https://github.com/getsentry/sentry) | NOASSERTION (BSL) | ~44.7k ★, pushed 2026-09-01 | Errors from the world, with stack traces. The most direct "it broke in production" signal |
| [`Unleash/unleash`](https://github.com/Unleash/unleash) | AGPL-3.0 | ~13.8k ★, pushed 2026-09-01 | Feature flags with a strong kill-switch story — **a flag is a kill switch for shipped work, which territory 09 names and we do not have** |
| [`plausible/analytics`](https://github.com/plausible/analytics) | AGPL-3.0 | ~28.8k ★, pushed 2026-09-01 | Simple, privacy-first traffic numbers. Trivial to run |
| [`matomo-org/matomo`](https://github.com/matomo-org/matomo) | GPL-3.0 | ~21.8k ★, pushed 2026-09-01 | Full-fat self-hosted analytics |
| [`openreplay/openreplay`](https://github.com/openreplay/openreplay) | Other | ~12.6k ★, pushed 2026-09-01 | Session replay — **watching a real person fail at the thing we built is a verdict no metric gives** |
| [`chatwoot/chatwoot`](https://github.com/chatwoot/chatwoot) | Other | ~36.4k ★, pushed 2026-09-01 | Customer conversations, self-hosted. The raw material for `USER-INSIGHTS.md`, which currently has one authorized writer and no input source |
| [`twentyhq/twenty`](https://github.com/twentyhq/twenty) | Other | ~56k ★, pushed 2026-09-01 | Open CRM "designed for AI" — the customer half of territory 14 |
| [`microsoft/TinyTroupe`](https://github.com/microsoft/TinyTroupe) | MIT | ~7.6k ★, pushed 2026-07-03 | **Persona simulation for business insight** — synthetic focus groups, ad testing, brainstorming. A *cheap, fake* verdict from the world, useful before there is a real one, dangerous if confused with one |

---

## 14 · Territory 04 — Skills ecosystems and prompt-craft corpora

The repo has 134 curated skills and 28 mental models, and **0 of 18 agents cite one.** The projects below
are the largest bodies of prior art on packaging and routing agent knowledge.

| Project | Licence | Signal | Take · Mistake |
|---|---|---|---|
| [`anthropics/skills`](https://github.com/anthropics/skills) | none stated (**check**) | ~173k ★ (verify), pushed 2026-08-21 | The canonical Agent Skills corpus and format from the vendor. **Take:** format conformance and the reference skills. **Mistake:** no licence stated — verify before vendoring |
| [`obra/superpowers`](https://github.com/obra/superpowers) | MIT | ~280k ★ (verify), pushed 2026-08-31 | The skills framework Metaswarm (already studied) builds on, but **Metaswarm was studied and superpowers itself was not.** **Take:** its skill-composition and methodology layer. **Mistake:** adopting a second methodology on top of playbooks |
| [`danielmiessler/Fabric`](https://github.com/danielmiessler/Fabric) | MIT | ~43.7k ★, pushed 2026-08-29 | ~200 crisp single-purpose patterns, each a plain markdown prompt. **Take:** the pattern *corpus* — it is the best library of "one prompt that does one thing well" in existence. **Mistake:** confusing patterns with skills; there is no routing |
| [`wshobson/agents`](https://github.com/wshobson/agents) | MIT | ~39.3k ★, pushed 2026-09-01 | Multi-harness agent/plugin marketplace. **Take:** the packaging and distribution model, which is Phase 9's problem. **Mistake:** importing 80 agent definitions into a repo that just spent four phases collapsing to seven |
| [`hesreallyhim/awesome-claude-code`](https://github.com/hesreallyhim/awesome-claude-code) | Other | ~53.3k ★, pushed 2026-09-01 | The index of the whole ecosystem. **Take:** use it as the map for anything this study missed |
| [`davila7/claude-code-templates`](https://github.com/davila7/claude-code-templates) | MIT | ~30.5k ★, pushed 2026-09-01 | CLI for configuring **and monitoring** Claude Code. **Take:** the monitoring half |
| [`SuperClaude-Org/SuperClaude_Framework`](https://github.com/SuperClaude-Org/SuperClaude_Framework) | MIT | ~23.9k ★, pushed 2026-08-21 | Personas + commands + MCP wiring as one install. **Mistake:** it is the "cognitive personas" model this repo explicitly rejected in Phase 4b |
| [`disler/claude-code-hooks-mastery`](https://github.com/disler/claude-code-hooks-mastery) | none stated | ~3.9k ★, **pushed 2026-03-04** | **Worked examples of all hook events.** The repo listens on 2 of 10 hooks; this is the reference for the other 8. **Mistake:** no licence, and six months stale |

---

## 15 · Transcript mining — the 2,936 files

Called out separately because it is the cheapest high-value item in the entire study: **the data already
exists, on disk, and nothing reads it.** All four below are small and specific.

| Project | Licence | Signal | What it does |
|---|---|---|---|
| [`coleam00/claude-memory-compiler`](https://github.com/coleam00/claude-memory-compiler) | **unspecified** | ~1.3k ★, pushed 2026-04-06 | Captures sessions via hooks, uses the Agent SDK to **extract decisions, lessons and patterns**, organises them into structured knowledge articles. The closest verified thing to "turn transcripts into skills" |
| [`obra/claude-memory-extractor`](https://github.com/obra/claude-memory-extractor) | MIT | ~117 ★, **pushed 2025-09-30** | Multi-dimensional extraction from conversation history — technical lessons, working-style preferences, debugging methodology. Small, MIT, dormant, readable in an hour |
| [`Digital-Process-Tools/claude-remember`](https://github.com/Digital-Process-Tools/claude-remember) | NOASSERTION | ~163 ★, pushed 2026-08-29 | Hooks the lifecycle: saves sessions, **compresses them through Haiku into layered daily summaries**, reloads at SessionStart. Directly relevant — the repo already fought a 27,069-byte SessionStart payload down to 2,941 |
| [`accidentalrebel/claude-skill-session-retrospective`](https://github.com/accidentalrebel/claude-skill-session-retrospective) | unspecified | ~12 ★, pushed 2026-02-01 | A skill that generates a lessons-learned retrospective for the current session. Twelve lines of idea |

**What would make any of these a mistake:** three of the four have no clear licence, two are effectively one
person's weekend, and an extraction pass that writes to memory without a human in the loop is an
unreviewed writer into the one file the repo treats as append-only and audited. If we take one, take the
*extraction*, and land its output as a PR.

---

## 16 · What I went looking for and did NOT find

Stated so the gaps are visible rather than silently absent. In each case I searched and either found nothing
verifiable, or found only papers.

1. **Worker trust, apprenticeship and retirement (territory 02).** Twelve-things items #10 and #11. There is
   no OSS project that models an agent's *earned* trust level, promotes it, or retires it. The nearest
   things are RL trainers (which change weights, not permissions) and static `tools:` scoping (which is what
   we already have). **This is a genuine build, not a buy.**
2. **Priority and scheduling across concurrent missions (territory 01).** `bd ready` returns the *set* of
   unblocked work; Hatchet gives concurrency limits and fairness. Nothing verified *decides* which of five
   goals deserves the next window. The decision procedure is ours to invent.
3. **Statistical regression detection for agent quality.** The literature exists (AgentAssay, arXiv
   2603.02601, proposes Wilson intervals + Fisher's exact test + CUSUM drift detection for non-deterministic
   agent workflows) but I found no verified OSS implementation. GrowthBook's engine is the closest
   *reusable* statistics, aimed at product experiments rather than agent runs.
4. **A blackboard at production scale.** MetaGPT's message pool is the only mature one and it comes attached
   to a whole framework; every dedicated blackboard project I verified has under 120 stars.
5. **Negative knowledge beyond `projectmem`.** The idea has a 2026 literature ("Negative Knowledge as
   Failure-aware Shared Memory", arXiv 2606.21024) and essentially one small implementation.
6. **Cost attributed to a mission rather than a session.** ccusage answers per-session; the CAST study
   already established the mission question is not answerable from Claude Code's own data without a task id
   that survives a session. Nobody has built that.

---

## 17 · UNVERIFIED / worth checking

**Nothing in this section was confirmed to exist as a repository. Do not treat any of it as real.**

- **`Trace2Skill`** — a 2026 framework (arXiv 2603.25158, HuggingFace papers page) for distilling
  trajectory-local lessons into transferable declarative agent skills via parallel error-analyst and
  success-analyst sub-agents, with reported large gains on WikiTableQuestions. **Paper found; no repository
  verified.** If it has code, it is the most on-target thing in the entire self-improvement territory for a
  system with 2,936 transcripts and 134 skills. Worth one search.
- **`AgentAssay`** — token-efficient regression testing for non-deterministic agent workflows (arXiv
  2603.02601). Paper only.
- **`Network-AI`** — a TypeScript shared-blackboard library with atomic commits, budget tracking and
  token-scoped security, surfaced only as a discussion thread in the `2FastLabs/agent-squad` repo
  (discussion #436). Not verified as an independent repo.
- **`Dicklesworthstone/beads_rust`** — a Rust port of beads, mentioned in search results. Unverified.
- **`riponcm/projectmem`'s claims** — the repo, licence and activity are verified; the *evaluation* (a
  two-month self-study across 10 projects, 207 events) comes from the paper's abstract and was not checked.
- **`duckdb/duckdb`** for transcript analytics — plainly real, but I did not verify it in this pass and it
  should not be cited from this document as verified.
- **Star counts flagged in §0** — `obra/superpowers`, `anomalyco/opencode`, `microsoft/markitdown`,
  `firecrawl/firecrawl`, `anthropics/skills`, `github/spec-kit`, `n8n-io/n8n`, `open-webui/open-webui`,
  `browser-use/browser-use`. Existence and licence are verified; the magnitudes are not.

---

## 18 · Adjacent to another lane

Flagged rather than developed, because `exp-hands` owns tools and services:

- [`browser-use/browser-use`](https://github.com/browser-use/browser-use) — MIT, ~112k ★ (verify), pushed
  2026-09-01. Web hands for agents.
- [`Skyvern-AI/skyvern`](https://github.com/Skyvern-AI/skyvern) — **AGPL-3.0**, ~22.9k ★, pushed 2026-09-01.
  Browser workflows with computer vision.
- [`modelcontextprotocol/servers`](https://github.com/modelcontextprotocol/servers) — the reference server
  corpus. Territory 03's map.
- [`SWE-agent/SWE-agent`](https://github.com/SWE-agent/SWE-agent) — MIT, ~20.2k ★, pushed 2026-08-31. The
  **agent-computer-interface** thesis: tool design determines agent performance more than the model does.
  Relevant to whoever owns hands.

---

## 19 · Method, and what a filtering conversation should distrust about this document

- Discovery was my own recall plus eight WebSearch queries aimed at the post-cutoff window (my knowledge
  ends May 2026; today is 2026-09-01). Verification was ~20 GitHub API calls.
- **Selection bias:** I searched in English, on GitHub, for things I could name. Chinese-ecosystem projects
  (OpenViking was found only incidentally) and non-GitHub hosting are almost certainly under-represented.
- **The `Other` / `NOASSERTION` licence values are a real risk surface.** They appear on Langfuse, Helicone's
  peers, humanlayer, restate, mastra, n8n, inngest, PostHog, GrowthBook, Sentry, open-webui, crush and
  several Claude Code tools. Some are dual licences, some are BSL, some are fair-code. **No project in that
  class should be adopted without someone reading its LICENSE file.** Six projects here are AGPL
  (`basic-memory`, `OpenViking`, `firecrawl`, `Skyvern`, `Unleash`, `plausible`, `matomo` is GPL,
  `claude-squad` is AGPL, `trufflehog` is AGPL) which is a specific and consequential choice for anything the
  company might later distribute.
- **Dormancy was checked and is called out inline.** Nine projects here have not been pushed to in six
  months or more, and two are archived. That is stated per-entry rather than hidden in an appendix.
