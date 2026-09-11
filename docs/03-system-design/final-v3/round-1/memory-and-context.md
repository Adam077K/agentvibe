# Round 1 · memory-and-context

*Salvaged from the workflow journal. The lane ran as a `sourcer`, which has no Write tool,
so it could not author its own file; this is its structured return rendered as prose.*

## Headline

BLOCKED ON WRITE, CONTENT DELIVERED IN TEXT: this engine has no Write tool, so the artifact could not be placed on disk — its substance is that the company's memory is only the non-recomputable residue (decisions, promises, refusals, the owner's own words), everything else is an address or a recipe, and the decisive outward lesson is NASA-vs-Xerox: capture is not the bottleneck, delivery at the moment of the decision is.

**Fields covered:** 6, 7, 13, 44, 48, 45, 39, 50, 32, 22, 12

## Claims

### 1. [measured]

The file was NOT written. sourcer's tools are [Read, Glob, Grep, WebSearch, WebFetch] plus the single-record claim appender; there is no Write or Bash. The full artifact is in this lane's text return and needs an engine with Write to land at docs/03-system-design/final-v3/round-1/memory-and-context.md (directory does not exist yet).

**Basis:** measured — the tool set available to this agent

### 2. [reasoned]

Memory should be cut by re-derivation cost, not by cognitive analogy. Free to re-derive -> store the address only. Expensive but possible -> the recipe is the record and the number is a dated cache of it. Impossible -> that IS the memory. The impossible set is tiny and grows at the rate the company makes commitments, which is how memory stays small structurally rather than by tidying.

**Basis:** reasoned

### 3. [reasoned]

A decision is not a fact and expires on a TRIGGER, not a clock. A decision record must carry a falsifier ('what observation would make us decide differently'), the situation it binds expressed as something matchable, and a reversal cost. A decision with no falsifier is a habit and should be refused. Real ADR repos rot exactly here: 'supersession links nobody updated... entries marked Accepted that the team quietly stopped following'.

**Basis:** https://hidekazu-konishi.com/entry/architecture_decision_records_templates_and_operations.html + reasoned

### 4. [sourced]

Delivery beats capture, and this is the strongest outward finding. GAO-02-195 found NASA had 'no assurance that lessons are being applied' and lessons 'not routinely identified, collected, or shared'; Xerox Eureka worked because tips reached the technician AT THE MACHINE. So the primary memory interface is whatBindsHere(situation) called by the harness before a consequential action — push by situation, not search by topic. Topic-keyed memory is why every lessons-learned database fails.

**Basis:** https://www.gao.gov/products/gao-02-195 (fetched) + https://www.researchgate.net/publication/263185231_Communal_Knowledge_Sharing_The_Eureka_Story

### 5. [sourced]

Do not buy or copy an agent-memory product. Letta hit 74.0% on LoCoMo with a plain filesystem vs Mem0's reported 68.5% graph variant; Zep showed Mem0 losing to a full-context baseline; Zep's own 84% claim was corrected to 58.44% in an issue on its own repo. LoCoMo conversations are ~16-26k tokens, inside a modern window. Nobody has shown a specialised memory layer beating files plus a competent harness.

**Basis:** https://www.letta.com/blog/benchmarking-ai-agent-memory/ (fetched); https://blog.getzep.com/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/; https://github.com/getzep/zep-papers/issues/5

### 6. [sourced]

The instruction/data boundary must be a PROCESS boundary because it cannot be a text boundary. Per the Claude Code hooks docs, PreToolUse can block but PostToolUse/PostToolBatch can only append additionalContext — no hook can modify a tool result before the model sees it. So every 'wrap untrusted content in delimiters' scheme is unavailable here; untrusted material must be read by a worker that cannot act, with a code-validated typed egress.

**Basis:** https://code.claude.com/docs/en/hooks (fetched, single reading — flagged as needing a live probe)

### 7. [speculative]

Proposed mechanism: taint propagates and removes capability. Every context span carries an origin class; a context that has held any UNTRUSTED-FETCH span permanently loses external-communication and spend capability, no undo. That is the lethal trifecta reduced to an invariant — hold two legs, never three. Implementable via PreToolUse plus on-disk session taint. UNVERIFIED RISK: whether taint survives a subagent boundary.

**Basis:** reasoned, on https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ and CaMeL arxiv 2503.18813

### 8. [reasoned]

Grounding requirement is a property of the DESTINATION, not the speaker. If a claim leaves the building (stranger, spend, or durable memory) it needs a fetched byte-matched quote or a re-runnable command, else it is replaced by an explicit UNKNOWN. Internal scaffolding needs no lookup. This routes around verbalized confidence, which is unreliable because models are 'optimized to be good test-takers, and guessing when uncertain improves test performance'.

**Basis:** https://arxiv.org/abs/2509.04664 (fetched) + reasoned

### 9. [reasoned]

Two refusals that prevent a self-running company becoming delusional: (1) no self-citation — the company's own published output may never source the company's own belief, or it will publish a guess and cite itself into certainty six months later (citogenesis, which Wikipedia documents as an incident list); (2) source independence above a consequence threshold — two sources that do not cite each other, with the non-citation checked and recorded.

**Basis:** https://en.wikipedia.org/wiki/Wikipedia:List_of_citogenesis_incidents + reasoned

### 10. [reasoned]

Remembering needs a subscription fee. Every durable claim is a standing re-verification liability, so: named re-check owner, mandatory shelf life, a VISIBLE running re-check cost, and a HARD CAP on live claims where admitting N+1 requires retiring one. When budget is exceeded, deprecate claims rather than skip checks. Scarcity is the only thing that has ever kept a knowledge base small; 'compress quarterly' never works.

**Basis:** reasoned, informed by ISO 15489 retention/disposition practice and over-retention cost literature

### 11. [speculative]

Three instruments nobody appears to run, all cheap: a CONTEXT CANARY (a planted verbatim item checked at intervals; failure means split the run — sufficient evidence of rot, not necessary, since reasoning degrades before verbatim recall); a DISAGREEMENT PROBE (re-ask a settled question with a worker not shown the old answer; the disagreement rate measures drift and is the only detector for 'wrong for a long time'); and a frozen CAPABILITY PROBE hashed into every attestation, which turns silent model change under a stable name into a diff.

**Basis:** reasoned, on https://www.trychroma.com/research/context-rot (fetched)

### 12. [reasoned]

Reproducibility: give up bit-exact replay (batch non-invariance breaks it and no commercial endpoint sells invariance) and aim at defensible reconstruction. The minimum for L1 — the floor for anything that reached a stranger or spent money — is the INPUT SET: request verbatim, instruction set by CONTENT HASH not name, every fetch with URL + timestamp + response-bytes hash, the binding block injected, the EVICTION RECEIPTS, option sets at each decision, and the terminal disposition including refusals and unknowns. Shape borrowed from SLSA/in-toto: provenance is about inputs, and everyone logs outputs instead.

**Basis:** https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/ + https://slsa.dev/attestation-model + reasoned

## Refusals — what this lane says NOT to do

- Do NOT buy or build a specialised agent-memory product or a knowledge-graph construction pipeline. Take bi-temporality (four timestamp columns, 1990s database practice, SQL:2011) and refuse the extraction pipeline: graph construction runs 10-100x standard RAG indexing and needs an ontology owner forever.
- Do NOT admit a claim to durable memory without a fetched byte-matched quote or a re-runnable command. Unverified citations are worse than none — 50-90% of citations in a studied long-form domain did not support their claims, and fabrication runs 11-57%. Verification at WRITE time is the product; Wikipedia's requirement of verifiability-without-verification is exactly the loophole citogenesis walks through.
- Do NOT let the producer of work write the durable record of that work's conclusions. Emit candidates; admit deterministically first (quote fetches? expiry set? supports resolve? key collision?); judge in a different context. This converts a poisoned agent's write into a proposal, which is a far worse attack primitive.
- Do NOT let a lesson from n=1 change a rule. It may add a CHECK. Rules change at n>=k with k named per class in advance. This is how organisations over-correct from one incident and carry the scar tissue for a decade.
- Do NOT auto-retract downstream conclusions when an input is invalidated. Keep the TMS justification links, mark stale, queue for decision. Take the dependency graph, drop the automated belief revision — silent position-reversal in an operating company is worse than a known-stale conclusion.
- Do NOT put personal data in embeddings, summaries, or free-text memory. You cannot unlearn from weights or reliably from an index; deletion must be enumerable. One keyed store, referenced by id, adopted on day one because it cannot be retrofitted.
- Do NOT let a good track record widen what a memory write can reach. Permission follows consequence. A record estimates a frequency over the acts you sampled and the write that ruins you is not from that bag — let it change how OFTEN you check, never what a bad write can touch.
- Do NOT summarise the customer's own words for the owner, and do NOT let an inferred preference about the owner become binding without their confirmation. Both are the mechanism by which the owner's picture goes stale while feeling fresh, and the system cannot detect it because the owner is the instrument.

## Unknowns — could not determine

- Where OUR tasks actually degrade. Chroma's curves are theirs; every context-budget number in the artifact is a placeholder until measured on this work. Highest-value unknown and about a day of effort.
- Whether taint survives a subagent boundary in this runtime — i.e. whether a parent's PreToolUse hook observes a child's tool calls. The entire enforcement of the capability-drop design rests on this and it is unprobed.
- Whether PostToolUse truly cannot alter a tool result before the model reads it. One documentation fetch, one reading, and it changes a design decision — deserves a live experiment.
- Whether push-by-situation retrieval (whatBindsHere) has been tried at scale anywhere. Found nothing; Xerox Eureka is the nearest analogue and predates all of this. May mean novel, may mean wrong search vocabulary.
- Unverified figures, deliberately NOT registered as claims and flagged in the artifact: the 61-62% post-retrieval error rate (PDF fetch returned metadata only), the 50-90% citation-support figure, the 10-100x graph indexing cost, the OWASP ASI06 listing, and the widely-repeated 'Claude Code removed vector search' story (no primary source found).
- Sycophancy in agent memory. MemSyco-Bench (arxiv 2607.01071) exists and bears directly on the owner-preference rule — a memory that learns what the owner likes to hear is a specific and nasty failure. Not read; search budget hit 200/200.
- Three lines closed by the same budget exhaustion: TMS scaling limits from primary sources, LLM verbalized-confidence calibration studies (bear on the grounding rule), and de Holan & Phillips on organisational forgetting, which is the one management literature specifically about deliberate knowledge loss and probably has more to say about the forgetting design than anything I did read.
- GAO-02-195 contains NO usage statistics — no '% of lessons ever read' figure exists in it. The NASA failure is documented qualitatively only, so the delivery-beats-capture argument rests on a qualitative finding plus a contrasting case, not on a measured comparison.
