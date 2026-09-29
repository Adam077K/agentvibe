> Archival provenance — 2026-09-13: Lane R6 (Skills and knowledge) report for the F2 round, preserved verbatim. Subject package at `ffeba9c` (Step 0 committed; protocol frozen at `26af5d5`). The lane was formed blind: it read only the files named in its brief and no other lane's output. The return channel truncates at about 4,000 characters and drops drains over 16,000, so the report was **extracted in full from the sourcer engine's own session transcript** (the harness's record of the agent's final text block, 58,538 characters) rather than assembled from chunked resends; chunks that had already arrived were compared against the extracted text and matched verbatim. No edits were made. The lane shares a model family with every other lane and reviewer in this round; independence is procedural only. Archival is not acceptance of any finding.

# R6 — Skills and knowledge

## 1. Provenance header

**Lane:** R6, Skills and knowledge. **Date:** 2026-09-13. **Engine:** sourcer. **Model family disclosure:** I am Claude (Anthropic, Opus 5). Every lane in this round shares that family. A large share of the primary format sources below are Anthropic's own documentation, so on the question "does the Agent Skills design work," I am both the reporting instrument and an interested party. Those rows are marked conflicted in §3 and none of them is the sole support for a benefit claim.

**Independent formation.** I read no other lane's output. I read only what the brief named, in this order: `00-acceptance-protocol.md` §7 and §3; the R6 rows of `00-thesis-claims.json` (TC-10, TC-28, TC-33, confirmed by grep as the complete R6 set); `FOUNDER-THESIS-2026-09-13-agents.md`; `DIRECTIVE.md` §6, §8.9 and the surrounding families; `research/L05-memory.md`; `research/L12-improvement.md`; `planning/specification/05-work-agents-skills.md` (whole file, §8 is its own section); `06-knowledge-evidence-evaluation.md` (whole file, §3–§4 in detail); and the repository's own `.claude/skills/routers/INDEX.md` and `.claude/skills/CURATION.yml`. External research ran primary-source first: vendor specifications before search, then measurements.

**Tool limit, stated up front.** `mcp__claim-append__append_claim` is **not present in my tool set this session**. I could not register a single durable finding in the ledger. Everything below is therefore unregistered prose carrying its own provenance, and §3 supplies the expiry and invalidator each claim would have carried. This is a capability gap, not a refusal, and it means the `claim-source` resolver has never fetched any of these URLs.

**Standing caveat.** Nothing here is a runtime result of this system. Every number is a measurement of some other system, on some other task distribution, at some other date.

---

## 2. Findings

### F1. The unit of reusable know-how has converged on one shape across four vendors, and the shape is a directory with a two-field trigger. [Fact]

Anthropic's Agent Skills require exactly two frontmatter fields. `name`: maximum 64 characters, lowercase letters, numbers and hyphens, no XML tags, and the reserved words "anthropic" and "claude" are refused. `description`: non-empty, maximum 1,024 characters, no XML tags [S1]. The body is markdown; bundled reference files and executable scripts sit beside it. The documentation states the required field set as *"**Required fields:** `name` and `description`"* [S1].

Claude Code applies a second, tighter cap at the listing layer: *"the combined `description` and `when_to_use` text is truncated at 1,536 characters in the skill listing to reduce context usage"* [S3]. Cursor's rules take the same shape with four application modes and the same size advice, *"Keep rules under 500 lines"* [S11]. `AGENTS.md` is the degenerate case: *"No. AGENTS.md is just standard Markdown. Use any headings you like; the agent simply parses the text you provide"*, with nearest-file precedence and, in Codex, concatenation from the repository root down until `project_doc_max_bytes` (32 KiB by default) is reached [S9][S10].

**[Inference]** The convergence is on the *container*, not on the *contract*. Only Anthropic's format carries a machine-checkable trigger field. `AGENTS.md` has no schema at all, so it cannot be selected against, versioned against, tested against or deprecated by any mechanism; it is always loaded and always costs its bytes. Whatever this system adopts, a format with no required trigger metadata cannot satisfy DIRECTIVE §8.9's discovery, selection and freshness requirements.

### F2. Progressive disclosure is a context-cost mechanism, and published measurement says it is a selection-accuracy *cost* at scale. [Source claim, with a direct disagreement between vendor and academic sources]

Anthropic's design is three levels: metadata always loaded at roughly 100 tokens per skill; SKILL.md body under 5k tokens when triggered; bundled files at zero cost until read [S1]. *"At startup, the agent pre-loads the `name` and `description` of every installed skill into its system prompt"* [S4]. The stated consequence is *"you can install many Skills without context penalty"* [S1].

SkillRouter measured what that costs on the other side of the ledger. On a SkillsBench-derived benchmark of approximately 80,000 candidate skills with heavy overlap: *"Across representative dense and reranking baselines on this setting, hiding the skill body causes a 37-44 percentage point drop in routing accuracy."* The authors then rule out the obvious confound: *"body-distilled descriptions recover part of the gap, but remain 7-21 points below direct all-field routing, while a metadata-only encoder trained with the same data remains 14.0 points below its all-field counterpart"* [S17].

**[Disagreement, preserved]** Anthropic's claim (metadata-only discovery is close to free) and SkillRouter's measurement (metadata-only discovery is 37 to 44 points worse) are about different quantities and are both defensible. Anthropic is measuring *context tokens*; SkillRouter is measuring *routing accuracy* at a library size roughly 600 times larger than the "100+ available Skills" Anthropic's own authoring guide names as the regime it designs for [S2]. The two do not contradict each other so much as locate the crossover. **[Unknown]** Where the crossover sits for a library of the size this company would actually hold is not established by any source I found.

### F3. Selection accuracy against library size is a phase transition, not a slope, and semantic confusability rather than count is the driver. [Source claim, high confidence in the reported result, low transfer confidence]

The most directly on-point measurement for TC-28: *"accuracy remains high when library size is below a critical threshold, then drops sharply beyond this capacity."* At small scales (|S| ≤ 20) accuracy stayed above 90%, degrading to approximately 20% at |S| = 200. The fitted capacity threshold κ, defined as *"the library size at which accuracy drops to half its maximum"*, was 91.8 for GPT-4o-mini and 83.5 for GPT-4o [S16].

| Variable held | Condition | Selection accuracy |
|---|---|---|
| |S| = 20, no competitors | clean library | 100% |
| |S| = 20, one competitor per skill | near-duplicate added | 7 to 30 points lower |
| |S| = 20, two competitors per skill | two near-duplicates | 17 to 63 points lower |
| |S| ≥ 60, flat selection | no hierarchy | 45 to 63% |
| |S| ≥ 60, hierarchical routing | two-tier | 72 to 85% |

The authors conclude *"semantic similarity—not library size alone—drives selection errors"* [S16]. Their own declared limitations are severe and I record them in full: synthetic skill libraries that *"may not capture the full complexity of real-world skill distributions"*; *"Selection-only evaluation: We measure selection accuracy but not end-to-end task performance"*; two OpenAI models only; and deliberately simple hierarchy designs [S16].

Two independent measurements point the same way. RAG-MCP reports *"MCP positions below 30 exhibit predominantly yellow regions, indicating success rates above 90% when the candidate pool is minimal"*, and *"Beyond position ~100, purple dominates, signifying that retrieval precision diminishes when handling very large tool registries"*, concluding that retrieval *"greatly mitigates prompt bloat and maintains high performance in small to moderate pools"* while precision and throughput *"degrade as the tool registry scales to thousands of MCPs"* [S14]. The "How Many Tools" paper attacks the same problem from the shortlist side and validates downstream with a Claude model: *"shorter adaptive lists also improve the LLM's ability to select the right tool: 93.1% versus 87.1% when always shown 5 tools, widening to 76.8% vs 60.9% on medium-difficulty queries where the correct tool is present but not ranked first"* [S15].

**[Inference]** Three separate research groups, three different registries (synthetic skills, MCP servers, BFCL and ToolBench tools), two different model families, one shape: selection is reliable in a small pool, degrades non-linearly, and near-duplicates degrade it far faster than count does. The founder constraint in TC-28 is therefore not a warning about a hypothetical; it names a measured effect.

### F4. A tested skill measurably raises task success, and measurably causes failures, and the failing skills are the *relevant-looking* ones. [Source claim]

SkillsBench: 87 tasks across 8 domains, 18 model-harness configurations. Average pass rate rises from 33.9% without skills to 50.5% with curated skills, +16.6 percentage points [S18]. Per-configuration deltas include Claude Opus 4.5 at 22.0% → 45.3%, Claude Haiku 4.5 at 11.0% → 27.7% [S18b]. Dose response matters: *"2-3 Skills per task provides optimal benefit (+20.0pp). Going to 4+ Skills shows diminishing returns (+5.2pp)"*, and *"Compact Skills (+18.9pp delta) outperform comprehensive documentation (+5.7pp) by nearly 4x"* [S18b].

The same benchmark records the downside: *"16 of 84 evaluated tasks exhibit negative Skills effects"*, worst case −39.3 percentage points on one task [S18b].

The dedicated failure study is the most important single finding in this lane. Across SkillsBench and SWE-Skills-Bench it attributes *"307 skill-induced failures, including 125 functional failures and 182 efficiency regressions"*, and reports: *"(1) Skill induced functional failures are rarely caused by obviously irrelevant skills; instead, seemingly relevant skills often make the agent incorrectly implement or omit task-required implementation elements. (2) Skill-induced efficiency regressions are not explained by prompt length alone. (3) The largest sources within Excessive Procedure are excessive verification and heavy implementation pipelines, contributing 67 and 30 cases, respectively. This shows that skills often turn validation checklists and construction recipes into mandatory work"* [S22].

**[Inference]** Finding (1) breaks the assumption that better selection prevents skill-induced harm. If wrong selections were the cause, improving the router would fix it. The measured cause is correctly selected, plausibly relevant skills that displace a task-required element. A selection metric alone cannot detect that class, which means DIRECTIVE §8.9's "prevent an expanding library from making selection progressively worse" is necessary and not sufficient: a library can pass every selection test and still degrade outcomes.

Finding (3) is the specific mechanism by which this company's own governance instincts could hurt it. The two largest sources of efficiency regression are excessive verification and heavy implementation pipelines. A skill library authored around this package's evidence and acceptance discipline is at elevated risk of exactly that failure.

### F5. Retrieval quality is not the binding constraint; corpus quality is. [Source claim]

SkillFlow indexes 35,866 SKILL.md definitions harvested from GitHub and runs a four-stage pipeline (dense bi-encoder, two rerank rounds, LLM selection). On SkillsBench it lifts Pass@1 from 9.2% to 16.4%. On Terminal-Bench agents used the retrieved skills at a 70.1% rate and showed *no performance gain*, which the authors read as *"corpus quality—not retrieval—is the limiting factor"* [S19]. Their declared limit: a single agent model and two benchmarks [S19].

The repository's own curation file reaches the same conclusion by a different route and records the test it used. Its ENCODED-PROCEDURE TEST is *"keep only what a frontier model will not reconstruct unaided. A file explaining what a README is fails. A file carrying a specific tool's non-obvious API, a measured threshold, or a procedure someone paid to learn passes"* [S27]. It then measured candidates by counting concrete anchors, and reversed cuts when the survivor scored zero concrete markers against the cut file's 154 [S27].

### F6. The evidence separates a skill from an agent on context boundary, tool grant and model choice, and does *not* separate them on knowledge. [Direct observation of the harness; Source claim for the negative half]

Anthropic's own operational guidance draws the line without reference to expertise: use a subagent when *"The task produces verbose output you don't need in your main context"*, when *"You want to enforce specific tool restrictions or permissions"*, or when *"The work is self-contained and can return a summary"*; and *"Consider Skills instead when you want reusable prompts or workflows that run in the main conversation context rather than isolated subagent context"* [S8]. *"Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent permissions"* [S8]. Not one of those three separators is knowledge.

The negative half is measured. A study of 162 roles across 6 relationship types and 8 expertise domains, 4 LLM families, 2,410 factual questions, found *"adding personas in system prompts does not improve model performance across a range of questions compared to the control setting where no persona is added"*, and that automatically identifying the best persona performs *"no better than random selection"* [S25].

The formal definition in the 2026 survey makes the overlap explicit rather than accidental: *"An agent skill is a structured package 𝒮=(C,π,T,ℛ), where C:𝒪×𝒢→{0,1} is the condition, mapping the agent observation (𝒪) and goal (𝒢) to the skill relevance; π is the execution policy to encode the procedures; T is the termination criterion, specifying when skill execution is completed; and ℛ is the reusable interface to indicate the composition with other skills"* [S21]. A condition, a policy, a termination criterion and an interface is, field for field, what an agent template is.

And the compilation result closes the loop from the other side: *"a multi-agent system can be compiled into an equivalent single-agent system, trading inter-agent communication for skill selection"*, measured at 53.7% average token reduction, 49.5% average latency reduction and +0.7% average accuracy across GSM8K, HotpotQA and HumanEval [S16].

### F7. A skill can carry a permission grant, which makes the knowledge unit an authority unit in the current harness. [Direct observation]

Claude Code's SKILL.md frontmatter includes `allowed-tools`: *"Tools Claude can use without permission during the turn that invokes this skill"*, and `context`: *"Set to `fork` to run in a forked subagent context"* [S3]. So a file whose stated job is reusable know-how can, by a frontmatter line, both widen the permission surface for a turn and create an isolated execution context.

This is not theoretical exposure. SkillInject evaluates *"202 injection-task pairs with attacks ranging from obviously malicious injections to subtle, context-dependent attacks hidden in otherwise legitimate instructions"* and reports *"today's agents are highly vulnerable with up to 80% attack success rate with frontier models, often executing extremely harmful instructions including data exfiltration, destructive action, and ransomware-like behavior"*, concluding *"this problem will not be solved through model scaling or simple input filtering, but that robust agent security will require context-aware authorization frameworks"* [S20]. The 2026 survey names three poisoning paths: *"direct instruction poisoning embeds harmful instructions into the skill... Second, prompt injection occurs when a benign skill pulls content from untrusted external sources... Third, uncontrolled skill self-evolution can silently strip existing safety constraints"* [S21].

Anthropic's own documentation is candid about the trust model: *"Use Skills only from trusted sources"*, *"a malicious Skill can direct Claude to invoke tools or execute code in ways that don't match the Skill's stated purpose"*, and *"Treat like installing software"* [S1].

### F8. Testing a skill has moved from advice to tooling, and the tooling encodes a negative-control discipline. [Direct observation]

Anthropic's authoring guide prescribes evaluation-driven development: run the task without the skill, document failures, build three scenarios, establish a baseline, write minimal instructions, iterate. It then states plainly: *"There is not currently a built-in way to run these evaluations. Users can create their own evaluation system"* [S2]. That gap has since been filled at the harness level. `claude plugin eval` *"runs your plugin against a suite of test cases and scores the results"*, and *"Each case runs three times with your plugin and three times without it, so one case is six runs"* [S6].

Three properties of that tool are load-bearing for §8.14 and for this round's own W5 dimension:

- **The no-plugin baseline is the default arm.** Δ is the with-arm score minus the without-arm score; `--ablation none` is opt-in [S6].
- **Graders that cannot fail in the baseline are excluded from both arms.** *"A check like 'the skill was invoked' can never pass without the plugin, so counting it would push the without-arm toward zero and inflate Δ"* [S6]. That is a built-in refusal of a self-flattering metric, and it is the same defect class this repository's own history keeps rediscovering.
- **The model must be pinned or the instrument lies.** *"Pin it in CI so a model rollout isn't mistaken for a plugin regression"* [S6].

And the honest boundary: *"a suite that passes says nothing about whether the plugin is safe"* [S6].

### F9. Versioning, ownership and distribution exist as mechanism only at the plugin layer, not the skill layer. [Direct observation]

A SKILL.md has no version field in its required set [S1]. A plugin manifest does: `name` (which is also the skill namespace), `description`, optional `version`, optional `author`, and *"If set, users only receive updates when you bump this field"* [S5]. Namespacing is the conflict mechanism: *"Plugin skills are always namespaced (like `/my-first-plugin:hello`) to prevent conflicts when multiple plugins have skills with the same name"* [S5]. Precedence for same-named skills is *"Enterprise over personal, and personal over project"* [S3]. Community-marketplace plugins are *"pinned to a specific commit SHA"* [S5].

**[Inference]** Version, owner, provenance and deprecation are properties of the *distribution unit*, not the knowledge unit, in every system examined. A skill inherits them or has none. The package's `SkillVersion` requirement list in `05` §8 is therefore ahead of every shipping format on this axis, and nothing in the ecosystem will supply those fields for it.

### F10. The repository's own library is a live instance of the two-tier answer, with its cost and its cuts recorded. [Direct observation]

`.claude/skills/routers/INDEX.md` records: *"Reading the full manifest cost ~15,000 tokens across 147 entries and grew with every skill added, so a good new skill made every unrelated task more expensive."* Discovery is six namespace lines, then one namespace, then the skill; the file states 134 skills total across 7 namespaces [S27]. I counted 134 `SKILL.md` files under `.claude/skills/` as a direct check of that number, and it matches.

`CURATION.yml` records four tests, and the one that matters most for a company library is the first: *"CUT TEST — delete only what is useless in EVERY project, never what is unused HERE."* It also records four reversals of its own near-duplicate cuts and names the shared cause: *"name adjacency is not evidence of duplication, and this file now carries two instances of that error."* And it records a chain defect found by re-screening: six cuts folded into a survivor that was itself cut, so *"The content did not move anywhere; it vanished"* [S27].

**[Inference, not a judgement of the file]** The reversals are evidence for F3's mechanism from a second direction. Four of the cuts that had to be reversed were made because two skills had adjacent names and similar descriptions. Semantic confusability defeated a *human-supervised* deduplication pass in the same way S16 measures it defeating a model's selection pass. The problem is not specific to model routing.

### F11. Set-compatibility, not pairwise relevance, is the composition failure. [Source claim]

*"Skill retrieval, however, is not ordinary document retrieval: a useful top-K result must contain individually relevant skills that also form an executable set for the current query"*, because *"retrieved skills are acted upon rather than merely read"*; two individually plausible skills may be *"redundant, contradictory, or impossible to compose"* [S23]. Measured on a 10,246-skill benchmark, their pipeline reaches 75.39% Hit@1 and 81.97% NDCG@10, but Set-Compat, the measure of returning a *complete and composable* set, reaches only 33.27%, a 36.6% relative gain over the strongest reranking baseline [S23].

### F12. When instructions conflict, models resolve the hierarchy badly. [Source claim]

IHEval: 3,538 examples, 9 tasks, covering system messages, user messages, conversation history and tool outputs. *"All evaluated models experience a sharp performance decline when facing conflicting instructions, compared to their original instruction-following performance. Moreover, the most competitive open-source model only achieves 48% accuracy in resolving such conflicts"* [S24]. Date 2025-02, so this is a fact about that model generation.

**[Inference]** `05` §11 and `05` §8 already forbid resolving skill conflict by concatenation and require authenticated authority to outrank retrieved content. F12 is the measurement showing why that rule cannot be enforced by the model reading the instructions: a deterministic boundary is required because the interpreter fails at the job about half the time in the best open case measured.

---

## 3. Source table

| id | URL | accessed | source date | type | P/S | confidence | conflict of interest | corroborated by | expiry | invalidator |
|---|---|---|---|---|---|---|---|---|---|---|
| S1 | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview | 2026-09-13 | undated, current | vendor spec | P | high for format, low for benefit | **Anthropic product doc; I am an Anthropic model** | S3, S4, S5 | 2026-12-13 | field limits change; progressive-disclosure levels change |
| S2 | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices | 2026-09-13 | undated, current | vendor guidance | P | high for stated guidance | same as S1 | S18b on compact vs comprehensive | 2026-12-13 | the "no built-in way to run evaluations" line is already superseded by S6 for plugins |
| S3 | https://code.claude.com/docs/en/skills | 2026-09-13 | undated, current | vendor spec | P | high | same as S1 | S5 | 2026-12-13 | 1,536-char truncation or precedence order changes |
| S4 | https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills | 2026-09-13 | 2025 | vendor engineering post | P | high for mechanism, none for benefit | **vendor self-report** | S1 | 2026-12-13 | startup metadata pre-load changes |
| S5 | https://code.claude.com/docs/en/plugins | 2026-09-13 | undated, current | vendor spec | P | high | same as S1 | S3 | 2026-12-13 | manifest schema or namespacing changes |
| S6 | https://code.claude.com/docs/en/plugin-evals | 2026-09-13 | undated, current | vendor spec | P | high for documented behavior | same as S1 | none found | 2026-12-13 | default run count, threshold default or ablation semantics change |
| S7 | https://www.anthropic.com/engineering/code-execution-with-mcp | 2026-09-13 | 2025-11 | vendor engineering post | P | medium; single unaudited example | **vendor self-report, promotional** | S14, S15 on direction only | 2026-12-13 | independent reproduction contradicting the 98.7% figure |
| S8 | https://code.claude.com/docs/en/sub-agents | 2026-09-13 | undated, current | vendor spec | P | high | same as S1 | S16 | 2026-12-13 | subagent isolation semantics change |
| S9 | https://agents.md/ | 2026-09-13 | undated | open format site | P | high for format, medium for the 60k figure | format promoters | S10 | 2027-09-13 | schema introduced; adoption figure is self-reported |
| S10 | https://learn.chatgpt.com/docs/agent-configuration/agents-md | 2026-09-13 | undated, current | vendor spec | P | high | OpenAI product doc | S9 | 2026-12-13 | `project_doc_max_bytes` default or merge order changes |
| S11 | https://cursor.com/docs/context/rules | 2026-09-13 | undated, current | vendor spec | P | high | Cursor product doc | S1, S9 | 2026-12-13 | rule-type set or precedence changes |
| S12 | https://modelcontextprotocol.io/specification/2025-06-18/server/prompts | 2026-09-13 | 2025-06-18 | open standard | P | high | spec authors | S13 | 2027-06-18 | superseded spec revision |
| S13 | https://modelcontextprotocol.io/specification/2025-06-18/server/tools | 2026-09-13 | 2025-06-18 | open standard | P | high | spec authors | S12, S20 | 2027-06-18 | superseded spec revision |
| S14 | https://arxiv.org/abs/2505.03275 and /html/2505.03275v1 | 2026-09-13 | 2025-05-06 | academic preprint | P | medium; method authors, single base model (qwen-max-0125) | authors advance the method | S15, S16 | 2026-12-13 | replication with a different retriever or model |
| S15 | https://arxiv.org/abs/2605.24660 | 2026-09-13 | 2026-05-23 | academic preprint | P | high for reported results | method authors | S14, S16 | 2027-05-23 | corrected benchmark protocol; BFCL/ToolBench revision |
| S16 | https://arxiv.org/abs/2601.04748 and /html/2601.04748v2 | 2026-09-13 | 2026-01-08, v2 01-14 | academic preprint, self-described preliminary | P | medium; **synthetic libraries, selection-only, two OpenAI models** | author advances the framing | S14, S17, S23 | 2026-12-13 | replication on a real SKILL.md corpus or on a Claude-family model |
| S17 | https://arxiv.org/abs/2603.22455 | 2026-09-13 | 2026-03-23, v5 07-21 | academic preprint | P | medium-high for the ablation, medium for transfer | method authors ship a competing router | S16, S23 | 2026-12-13 | the 37–44 pp gap failing to reproduce at smaller registry sizes |
| S18 | https://arxiv.org/abs/2602.12670 | 2026-09-13 | 2026-02-13, v4 06-14 | academic benchmark, 77 authors | P | high for reported results | large multi-party consortium; skill-ecosystem interest | S19, S22 | 2026-12-13 | task set revision; model rollout changes deltas |
| S18b | https://www.skillsbench.ai/blogs/introducing-skillsbench | 2026-09-13 | 2026 | benchmark authors' site | P | medium-high | same as S18 | S18 | 2026-12-13 | per-model figures move on every model release |
| S19 | https://arxiv.org/html/2504.06188v2 | 2026-09-13 | v2 2026-03-27 | academic preprint | P | medium; single agent model, two benchmarks | method authors | S18, S22 | 2026-12-13 | corpus-quality conclusion failing on a curated corpus |
| S20 | https://arxiv.org/abs/2602.20156 | 2026-09-13 | 2026-02-23 | academic security benchmark | P | high for demonstrated attack class | security researchers | S21, S1 | 2027-02-23 | frontier models hardening; ASR is generation-dependent |
| S21 | https://arxiv.org/html/2606.11435v1 | 2026-09-13 | 2026-06 | academic survey | P for its own taxonomy, S for results it cites | medium | survey authors | S16, S17, S20 | 2026-12-13 | superseding survey |
| S22 | https://arxiv.org/abs/2608.11888 | 2026-09-13 | 2026-08-12 | academic empirical study | P | high for reported attribution counts | authors propose tooling | S18b negative cases | 2027-08-12 | attribution framework shown to misattribute |
| S23 | https://arxiv.org/html/2606.03565 | 2026-09-13 | v5 2026-08-04 | academic preprint | P | medium-high | Tencent authors ship the method | S16, S21 | 2026-12-13 | Set-Compat shown to be gameable |
| S24 | https://arxiv.org/abs/2502.08745 | 2026-09-13 | 2025-02-12 | academic benchmark, NAACL 2025 | P | high for historical result | Amazon-affiliated authors | S21 | 2026-12-13 | **already generation-stale**; needs re-measurement on current models |
| S25 | https://arxiv.org/abs/2311.10054 (EMNLP Findings 2024) | 2026-09-13 | 2024 | peer-reviewed study | P | high for historical result | none identified | S16 indirectly | 2026-12-13 | **generation-stale**; persona effects may differ on current models |
| S26 | https://arxiv.org/abs/2305.16291 | 2026-09-13 | 2023 | academic paper | P | high for mechanism, historical for results | authors | S21 | 2027-09-13 | historical; do not cite its rates as current |
| S27 | repo: `.claude/skills/routers/INDEX.md`, `.claude/skills/CURATION.yml` | 2026-09-13 | 2026-08-12 | internal record | P | high for what it records | **authored by this system about itself** | my own count of 134 SKILL.md files | on next curation pass | the directory drifting from the file, which `check:curation` is stated to catch |

---

## 4. Per-claim verdicts

### TC-10 — "For work needing domain competence, a dedicated specialist executor produces better accepted outcomes than a general executor loading a tested domain skill." (contested)

**Verdict: still contested, and the contest has narrowed. The strong form of "specialist" is now poorly supported; the weak form is untested.**

Against a specialist defined by *role, persona or encoded SOP*: S25 finds no improvement from 162 personas across 4 model families on 2,410 factual questions, and that picking the best persona is no better than random. S16 compiles a multi-agent system into a single agent selecting from skills and reports 53.7% fewer tokens, 49.5% lower latency and +0.7% accuracy on three reasoning and coding benchmarks. S18 shows curated skills lifting pass rate 33.9% → 50.5% and *"smaller models enhanced with Skills achieved performance comparable to larger models without Skills"*.

For a specialist defined by *isolated context, restricted tools or a different model*: S8 names exactly those three as the reasons to use a subagent, and none of them is knowledge. That form of specialist is not what TC-10 puts in contest, and R1 and R4 own it.

Against the general-plus-skill arm: S22's 125 functional failures attributed to *seemingly relevant* skills, and S19's Terminal-Bench result where skills were used at 70.1% and produced no gain, both show that "loading a tested domain skill" has its own defect mode that a specialist would fail differently.

**The discriminating fixture has not been run by anyone.** TC-10 names conformance case 6 from `05` §9: a stale borrowed skill that passes shape checks but whose example omits a cancellation duty. No published work I found tests an omitted *duty* in an otherwise valid skill. S22 is the closest and it studies omitted *implementation elements* on software tasks, not obligations with an acceptance owner.

**Model-generation dependence: yes**, and it is the axis that could flip the answer. S18b's deltas differ by 9 percentage points across Claude Opus 4.5 and Claude Opus 4.6 on the same benchmark.

### TC-28 — "Selection quality and selection cost must not worsen as the skill library grows." (founder constraint)

**Verdict: the constraint is correct, unmet by default in every published system, and the package's specified mechanism is the one measured as costly at scale.**

The degradation is measured, not hypothesised: accuracy above 90% at |S| ≤ 20 falling to about 20% at |S| = 200, with fitted capacity κ near 84 to 92 [S16]; above 90% below position 30 and precision loss beyond position 100 in an MCP registry [S14]. The dominant variable is confusability, not count: one near-duplicate per skill costs 7 to 30 points, two cost 17 to 63 [S16]. The 10/100/1000 sweep `05` §8 specifies is therefore well-posed, and the "adversarial near-duplicates" clause in it is the load-bearing half, not decoration.

Three consequences for the specified mechanism, stated as findings:

1. `05` §8 specifies *"Search only eligible metadata; fetch a small candidate set, compare one-line applicability and known limits, then load the selected procedure."* That is metadata-first selection, which S17 measures at 37 to 44 points below all-field routing on an 80,000-skill overlapping registry, with body-distilled descriptions still 7 to 21 points short. The specification is not refuted at the scale it will operate at, and no source establishes the crossover. This is the sharpest open question in the lane.
2. `05` §8's limits of *"at most five candidates and two full skill bodies per selection"* have empirical company. S18b measures 2 to 3 skills per task as optimal (+20.0pp) with 4+ showing diminishing returns (+5.2pp), and S15 shows an adaptive shortlist averaging 7 tools matching a fixed 50 on coverage while improving downstream selection 93.1% versus 87.1%. The specified numbers are plausible; they remain UNKNOWN as the specification already says.
3. S16's hierarchical routing result (72 to 85% versus flat 45 to 63% at |S| ≥ 60, +37 to 40 points absolute for GPT-4o-mini) is the mechanism this repository already built and measured for itself: two-tier routers replacing a 15,000-token manifest read [S27]. Independent academic measurement and internal practice agree on the shape.

**A necessary-but-insufficient finding.** TC-28's measure counts *wrong selections* and *accepted outcomes*. S22 shows a library can degrade outcomes through correctly selected skills. A sweep that measures only selection would pass a library that is making the company worse.

**Model-generation dependence: yes**, as the claim already states. Every degradation curve I found was measured on GPT-4o, GPT-4o-mini, qwen-max-0125 or retrieval encoders. **No published curve exists for a Claude-family model over a real SKILL.md library.**

### TC-33 — "The thesis lists specialized knowledge as a reason an agent earns existence; the package treats know-how as a versioned skill loaded by a general executor. Which unit carries specialization is undecided." (unknown)

**Verdict: still formally unknown, but the evidence now discriminates. Specialized knowledge is the weakest of the founder's five criteria, and it is the only one of the five that no source separates from a skill.**

The bounded sub-question the brief asks, "is specialized knowledge a skill or an agent, and what evidence separates the two," has an answer supported from four directions:

- **Operational**: the vendor's own decision rule for subagent versus skill names verbose output, tool restriction and self-containment. Knowledge is absent from it [S8].
- **Formal**: the survey's skill definition (condition, policy, termination, interface) is field-for-field an agent template [S21].
- **Constructive**: a multi-agent system compiles into a single agent plus skill selection with a measured net gain [S16].
- **Negative**: role identity in a system prompt produces no measurable competence gain [S25].

What *does* separate them, on evidence: a separate context window, an independent permission set, and a different model [S8]. Those map onto the founder's other four criteria (parallel work, distinct tools or permissions, isolated context, independent verification) and not onto the fifth.

**The complication, and it cuts the other way.** F7 shows the separation is already leaking in the harness this company runs on. `allowed-tools` in SKILL.md frontmatter grants tool use without permission for the invoking turn, and `context: fork` creates an isolated subagent context, both declared in a knowledge artifact [S3]. So "which unit carries specialization" is partly moot in the current runtime: the skill unit can carry two of the three things that were supposed to distinguish an agent.

**The discriminating fixture, "the domain that changes," has not been run by anyone.** No source I found compares what must be edited, retested and revalidated when a domain rule changes, under a specialist unit versus a skill unit. S9 supplies the nearest structural fact: version, owner, provenance and deprecation live at the distribution unit, so under either answer the maintenance question resolves at the plugin or package layer, not at the knowledge layer.

**Model-generation dependence: yes**, as the claim states, and S18b's spread across Claude Opus 4.5 and 4.6 is direct evidence that the gap a skill closes moves between generations.

---

## 5. Assumptions · Unknowns · Competing interpretations

**Assumptions.**
1. Measurements on tool registries (MCP servers, BFCL, ToolBench) transfer qualitatively to skill libraries. Justified by S16 and S17 reproducing the same curve shape on skill corpora, but the magnitudes should not be carried across.
2. Public GitHub skill corpora resemble what this company would author. S19's corpus-quality finding and S27's curation tests both argue they do not, so this assumption is weak and I have not relied on it for any verdict.
3. Benchmarks measuring *task pass rate* are a usable proxy for this package's *accepted outcome*. They are not the same predicate. `06` §6 requires acceptance by someone with no stake; no cited benchmark has an acceptance owner.

**Unknowns.**
1. The crossover library size at which metadata-only selection stops being adequate for a Claude-family model. Nothing establishes it.
2. Selection accuracy over a real SKILL.md library at 10, 100 and 1000 with adversarial near-duplicates, on any current model. The exact test `05` §8 specifies has not been published by anyone.
3. Whether the 1,536-character listing truncation [S3] binds before or after semantic confusability does, in a library authored to this package's metadata requirements. `SkillVersion`'s required content in `05` §8 is far longer than 1,536 characters, so what reaches the selection surface is a projection of it, and nothing specifies that projection.
4. What "selection cost" should be denominated in. TC-28 asks for selection time, candidates inspected and bytes loaded; TC-26 forbids dollars-per-token as a primary unit. No source reports selection cost in subscription-capacity units.
5. Whether a skill's *ignored steps* (named in `05` §8's measure list) can be detected at all. `05` §8 already states the problem: *"a skill can be loaded but ignored, or followed while producing a bad result."* S6's `tool_used` grader detects invocation, not adherence.

**Competing interpretations, preserved.**
- **On progressive disclosure.** Reading A (vendor, S1, S4): metadata-only discovery is the design that makes large libraries affordable. Reading B (S17): metadata-only discovery is the choice that costs 37 to 44 points of routing accuracy at scale. Both are supported; they measure different quantities at different library sizes. I decline to resolve this and record it as a design input, per §7 of the protocol.
- **On whether skills help.** Reading A (S18): curated skills add 16.6 points on average across 18 configurations. Reading B (S22, S18b): 16 of 84 tasks regress, worst case −39.3 points, and 307 attributed failures exist. These are the same data read at different granularities. The mean and the tail are both true; a design that cites only the mean is citing half the evidence.
- **On what an agent is.** Reading A (S16, S25): specialization is a skill; agents are a communication overhead to be compiled away. Reading B (S8): agents are a *context and permission* construct, and skills were never their competitor on that axis. These do not conflict; they answer different questions, and TC-33 is sharper if it is read as Reading B.

---

## 6. Useful mechanisms · Rejected mechanisms

**Useful mechanisms, each with the named problem it solves.**

| Mechanism | Problem it solves | Evidence |
|---|---|---|
| Hierarchical or namespaced routing before flat selection | Selection collapse past the capacity threshold | 72–85% versus 45–63% at |S| ≥ 60 [S16]; the repo's own two-tier router [S27] |
| Adaptive shortlist depth per query, rather than a fixed K | Short lists miss hard cases, long lists degrade choice | 7 tools average matching 50 on coverage; 93.1% vs 87.1% downstream [S15] |
| Body-aware or body-distilled routing signals | Metadata alone underdetermines selection in an overlapping registry | 37–44 pp, and 14.0 pp for a trained metadata-only encoder [S17] |
| Set-compatibility as a retrieval objective, not pairwise relevance | Two relevant skills that cannot compose | Set-Compat 33.27% against Hit@1 75.39% [S23] |
| Near-duplicate control as a first-class library operation | Confusability, not count, drives selection error | 7–30 points for one competitor, 17–63 for two [S16]; four reversed cuts in the repo's own curation [S27] |
| A no-skill baseline arm run by default, with invocation-only graders excluded from the score | A skill evaluation that can only flatter itself | `claude plugin eval`, 3 with and 3 without per case, and the explicit `scored: false` rule [S6] |
| Pinning the model in the evaluation harness | Mistaking a model rollout for a skill regression | *"Pin it in CI so a model rollout isn't mistaken for a plugin regression"* [S6] |
| Distribution-unit versioning with SHA pinning and namespacing | Skill identity, update control and same-name conflict | plugin manifest `version`, `/plugin:skill` namespacing, commit-SHA pinning [S5] |
| Recording each cut with the test that made it | Unauditable curation, and chained cuts that delete content silently | the six-instance chain defect the repo's own checker caught [S27] |
| Deterministic scripts inside a skill instead of generated code | Fragile steps and voodoo constants | *"pre-made scripts offer advantages... More reliable than generated code"* [S2] |

**Rejected mechanisms, with why.**

- **Loading the whole library, or the whole manifest, into context.** Directly measured as the failure it causes: ~15,000 tokens per lookup growing with every addition [S27]; *"they'll need to process hundreds of thousands of tokens before reading a request"* [S7]. `05` §8 already forbids it.
- **A role, persona or job title as the carrier of domain competence.** No measurable gain across 162 roles and 2,410 questions, and best-persona selection no better than random [S25]. This is also negative control 8 in the protocol.
- **Concatenating conflicting skills and letting the model sort it out.** Best open-source model resolves hierarchy conflicts at 48% [S24]. `05` §8 already refuses this; F12 is the measurement behind the refusal.
- **Access popularity as a freshness signal.** `05` §8 and `06` §3 both refuse it; L05 independently proposes *"Separate freshness from popularity. Frequent retrieval should not renew a claim's verification date."* No external source contradicts this.
- **Treating a passing skill test suite as a safety verdict.** *"a suite that passes says nothing about whether the plugin is safe"* [S6], and up to 80% attack success rate through skill files [S20].
- **Trusting skill or tool metadata from outside the trust boundary.** *"clients MUST consider tool annotations to be untrusted unless they come from trusted servers"* [S13]; *"Treat like installing software"* [S1].
- **Selection metrics as the sole health measure of a library.** S22's finding (1) defeats this: the failures come from correctly selected, plausibly relevant skills.

---

## 7. Failure cases

**FC-1. Wrong skill selected.** The measured shape is a cliff, not a slope: above 90% below roughly 20 to 30 candidates, about 20% at 200, with the half-accuracy point fitted at 83.5 to 91.8 [S16][S14]. The trigger is a near-duplicate, not a large count. *Detection:* a fixed question set replayed at growing library sizes with seeded near-duplicates. *Why it is easy to miss:* a library can grow past the cliff between two curation passes, and every individual skill will still look good.

**FC-2. Right skill selected, wrong outcome.** 125 functional failures attributed to loaded skills, and *"rarely caused by obviously irrelevant skills; instead, seemingly relevant skills often make the agent incorrectly implement or omit task-required implementation elements"* [S22]. *Detection:* the differential attribution S22 describes, comparing a skill-guided run against a no-skill or matched-skill run on the same task. This is the same two-arm shape as `claude plugin eval` [S6]. *Why it is easy to miss:* every selection metric reports success.

**FC-3. Right skill selected, work inflated.** 182 efficiency regressions, *"not explained by prompt length alone"*, with excessive verification (67 cases) and heavy implementation pipelines (30 cases) as the largest sources [S22]. *Why this system is exposed:* its skills will encode verification and acceptance procedure by design. Under TC-26's units this shows up as consumed subscription capacity, not as dollars, so a token-priced cost model would not surface it.

**FC-4. Conflicting skills.** Two individually relevant skills that are *"redundant, contradictory, or impossible to compose"* [S23], compounded by a measured 48% conflict-resolution accuracy at the instruction-hierarchy level [S24]. *Detection:* Set-Compat style measurement of the returned set, not of its members. *Why it is easy to miss:* both skills pass their own tests.

**FC-5. Stale skill.** `05` §9 case 6 names it: shape checks pass, the example omits a cancellation duty. The nearest published evidence is S22's omission class on software tasks and L05's Memora finding of *"recurring invalid-memory reuse among four models and six memory agents"*. *Detection:* the adversarial case must test the *duty*, not the shape. Nothing in any format examined checks a duty. **This is a real gap, not a covered case.**

**FC-6. A skill that silently grants authority.** Two independent paths. First, declared: `allowed-tools` grants tool use without permission for the invoking turn, and `context: fork` creates an isolated context, both from frontmatter in a knowledge file [S3]. Second, injected: 202 injection-task pairs, up to 80% attack success with frontier models, including data exfiltration and destructive action, with the authors concluding that filtering will not fix it and *"robust agent security will require context-aware authorization frameworks"* [S20]. The survey adds the third path, *"uncontrolled skill self-evolution can silently strip existing safety constraints"* [S21]. *Detection:* re-check provenance and the declared grant at *use*, not at admission, which is what W10 already probes. `05` §1's rule that no skill acquires authority by containing instructions to do so is correct and is contradicted by the runtime's own frontmatter field.

**FC-7. A curation pass that deletes content by chaining.** Six cuts folded into survivors that were themselves cut, so *"The content did not move anywhere; it vanished"*, and the documentation category emptied [S27]. *Detection:* refuse any cut whose named survivor is absent. That check *"fired exactly six times the moment it was written"* [S27].

**FC-8. Retrieval works and nothing improves.** 70.1% skill usage rate with no performance gain, attributed to corpus quality rather than retrieval [S19]. *Why it is easy to miss:* usage rate and selection accuracy both look healthy.

---

## 8. Implications for this system

Bound to the fixed boundaries and the six fixtures. These are consequences of the evidence, not recommendations; the decisions belong elsewhere.

**Against the fixed boundaries.** Nothing in this lane requires reopening a fixed boundary. One finding pushes on one: F7 shows the runtime's skill format can carry a tool grant, which sits against `05` §1's rule that no skill acquires authority by containing instructions to do so. That is a conformance problem for the implementation, not a change to the boundary, and it routes to R4.

**F-1, an unknown kind of job appears mid-build.** The admission and typing rules must work when *no skill applies*. `05` §10 already registers `SkillSelection.no_match` and `SkillSelection.budget_exhausted` as distinct phases, and distinguishes them correctly: *"`no_match` is a searched answer, this is an unfinished search, and neither is a selection."* The evidence supports that distinction being load-bearing rather than pedantic, because S16 shows selection accuracy collapsing without the model reporting difficulty. A selection surface that cannot say "I searched and found nothing" will fabricate a match at scale. The spurious-job refusal path in F-1's adverse variation is unaffected by skills; skills are not an admission mechanism.

**F-2, demand at 4×.** Selection cost is charged per WorkOrder in `05` §8. At 4× concurrent work, selection is run 4× more often over one shared library, so library growth multiplies against demand. S18b's 2-to-3-skill optimum and S15's 7-versus-50 result both say the per-selection load should stay small under pressure; S22's efficiency regressions say the *selected* skill can inflate the work itself, which under TC-26's units consumes subscription allowance rather than dollars. A capacity model that prices context tokens and not skill-induced procedure will underpredict F-2.

**F-3, three distinct tool permissions.** F7 is the direct hit. If a knowledge artifact can declare `allowed-tools`, then least-privilege composition and attenuation on delegation must be computed somewhere that a skill cannot write to. The protocol's W6 failure condition, *"silently inherits all permissions of its creator... including inheritance through a skill"*, is measured live rather than hypothetical: 80% attack success through skill files [S20].

**F-4, a verification the producer must not influence.** `claude plugin eval`'s exclusion rule is the cleanest external instance of the discipline `06` §7 requires: a grader that cannot fail in the baseline arm is excluded from both arms, because *"counting it would push the without-arm toward zero and inflate Δ"* [S6]. That is negative control 3 implemented in a shipping tool. Its limit is equally clear and belongs in any citation of it: *"a suite that passes says nothing about whether the plugin is safe."*

**F-5, a handoff across a capacity reset.** Two mechanisms bear. First, skill *pinning*: `05` §8 requires accepted runs to pin exact `SkillVersion`, `InstructionBundle`, `AgentTemplate` and `RuntimeProfile` refs, which is what makes "what may the resumed attempt trust" answerable for procedural knowledge. Second, the model pin: S6's *"Pin it in CI so a model rollout isn't mistaken for a plugin regression"* generalises to the resumed attempt. A capacity reset is exactly when a model rollout can land between two halves of one job, and S18b's 9-point spread between two adjacent Claude versions on the same benchmark is the size of that effect.

**F-6, the founder absent for a week.** The relevant exposure is FC-3, not FC-1. A skill library encoding this company's verification discipline can turn checklists into mandatory work (67 of 182 efficiency regressions) with nobody watching the consumption. `05` §8's periodic review rule, *"Periodic review uses use/failure evidence and changed dependencies, not access popularity as a freshness signal,"* is the right predicate and it needs a custodian who is not the founder.

**On the comparator B0.** The simple baseline is entitled to its retrieval scripts and checklists. F5 and F8 are the findings that matter here: retrieval was not the limiting factor in S19, and curated compact content beat comprehensive documentation by nearly 4× in S18b. A small, curated, human-maintained set of procedures is the arrangement that the evidence favours at small library sizes, and it is B0's natural shape. The candidate that needs a large library must show, on the 10/100/1000 sweep, that its selection machinery still pays at the size it actually reaches. Nothing I found establishes that it does.

**On the founder's five criteria.** The lane's evidence bears on one of them. "Specialized knowledge" is the criterion that no source separates from a versioned skill, while the other four map onto separations that S8 names operationally and S16 measures. Whether that makes the fifth criterion non-load-bearing is a founder decision under TC-35 and not a research finding, and I do not make it.

---

## 9. Questions other lanes may have missed

1. **Who owns a skill's `valid_until`?** `05` §8 requires a review date and invalidation triggers; no shipping format has a field for either, and `06` §4's knowledge custodian owns claims, not procedures. If procedural knowledge expires on the same rules as factual claims, the ledger's resolvers would need to run against a skill body, and nothing does that today.
2. **What reaches the selection surface?** `SkillVersion`'s required content in `05` §8 is far larger than any listing budget (1,024 characters in the API format, 1,536 in the Claude Code listing). The projection from the full package to the selectable description is an unspecified lossy transformation, and S17 measures that exact transformation costing 7 to 21 points even when done well. R1 owns context manifests; this is a context manifest for the selection step, and nobody has claimed it.
3. **Is skill selection itself a significant run under TC-27?** If a selection inspects five candidates and loads two bodies, that is a context assembly with omissions. If it gets no manifest, the system cannot later answer which skill it *did not* load, which is the difference between `no_match` and `budget_exhausted` after the fact.
4. **Does a skill count as an external effect when it grants a tool?** R4's F-3 fixture assumes permissions arrive through a grant. F7 shows a second path through a knowledge artifact. Which component refuses that, and at what boundary, is unassigned.
5. **How does a skill get retired when it is cited by a live claim?** The repo's own eviction rules for `DECISIONS.md` pin anything cited by a live claim. `05` §8's retirement rule requires dependency and obligation checks but names no citation check. A skill retired out from under an accepted run breaks that run's pinned refs.
6. **What is the unit of the selection budget under a subscription?** TC-26 forbids dollars-per-token as a primary unit and TC-28's measure asks for selection time and bytes. Neither is subscription allowance. R8 owns the units; R6 owns the quantity; nobody owns the conversion.
7. **Who authors the adversarial near-duplicates?** The sweep in `05` §8 requires them, and negative control 10 voids any fixture written after a candidate's result is known. Near-duplicates authored by the same process that authors the library will not be adversarial in the way S16 measures.

---

## Gaps

Named, per the protocol's rule that an omitted gap reads as coverage.

- **No claim was registered.** `mcp__claim-append__append_claim` is absent from my tool set. Nothing here has been through the `claim-source` resolver, so no quote in this report has been machine-verified against its URL.
- **Three PDFs would not extract.** `arxiv.org/pdf/2603.22455` (SkillRouter), `arxiv.org/pdf/2601.04748` and `arxiv.org/pdf/2606.10388`. For the first two I used the arXiv abstract and HTML renderings instead, and every number I attribute to them comes from those. For the third I have nothing: the retrieved metadata gave the title as "Right Family, Wrong Skill: Benchmarking Risk Exposure in Agent Skill Retrieval", which does not match the title the search returned, so I cite it nowhere.
- **MetaTool (arXiv 2310.03128) was not opened.** A search summary reported 4,287 queries over 199 tools with about 10 candidates each. I did not fetch the primary and therefore do not cite it as evidence anywhere above.
- **No Claude-family measurement of skill-library selection degradation exists that I could find.** Every curve in §2 comes from GPT-4o, GPT-4o-mini, qwen-max-0125 or retrieval encoders. The single Claude-family datapoint is S15's downstream validation with Claude Sonnet 4.6 on *tools*, not skills.
- **No source tests an omitted duty in a valid skill.** The discriminating fixture for TC-10 and conformance case 6 of `05` §9 has no published analogue.
- **No source measures maintenance cost.** TC-10's measure charges maintenance to both arms and TC-33's measure asks what must be edited when the domain changes. Not one source reports authoring or maintenance effort in any unit.
- **I did not verify the repository's curation claims by re-measuring.** I counted 134 `SKILL.md` files, matching the router's stated total. I did not re-derive the ~15,000-token manifest figure, the 54,001-byte manifest size, or any per-skill marker count; those are reported as what the file records.

Sources: [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) · [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) · [Claude Code skills](https://code.claude.com/docs/en/skills) · [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) · [Create plugins](https://code.claude.com/docs/en/plugins) · [Test plugins with evals](https://code.claude.com/docs/en/plugin-evals) · [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) · [Subagents](https://code.claude.com/docs/en/sub-agents) · [AGENTS.md](https://agents.md/) · [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) · [Cursor rules](https://cursor.com/docs/context/rules) · [MCP prompts](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts) · [MCP tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) · [RAG-MCP](https://arxiv.org/abs/2505.03275) · [How Many Tools Should an LLM Agent See?](https://arxiv.org/abs/2605.24660) · [When Single-Agent with Skills Replace Multi-Agent Systems](https://arxiv.org/abs/2601.04748) · [SkillRouter](https://arxiv.org/abs/2603.22455) · [SkillsBench](https://arxiv.org/abs/2602.12670) · [SkillsBench blog](https://www.skillsbench.ai/blogs/introducing-skillsbench) · [SkillFlow](https://arxiv.org/html/2504.06188v2) · [Skill-Inject](https://arxiv.org/abs/2602.20156) · [Agent Skill Evaluation and Evolution](https://arxiv.org/html/2606.11435v1) · [Agent Skills Can Be Harmful](https://arxiv.org/abs/2608.11888) · [Skill Is Not Document](https://arxiv.org/html/2606.03565) · [IHEval](https://arxiv.org/abs/2502.08745) · [Personas in System Prompts](https://arxiv.org/abs/2311.10054) · [Voyager](https://arxiv.org/abs/2305.16291)