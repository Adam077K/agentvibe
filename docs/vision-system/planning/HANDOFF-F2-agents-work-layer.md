# Handoff — the agents / work layer rethink (Steps 0–6)

**Written:** 2026-09-13 by the orchestrator of session `ceo-2-1789160976`, at commit `53dcc92` or later (check `git log`).
**For:** the next team, starting fresh, with no prior context.
**Your job:** run Steps 0–6 below, end to end, on the work / agents / authority / tools / skills / context / shared-state / routing / task-state layer of an already-planned system — and produce a re-specified layer that an independent review can accept as part of the whole. You will receive this document together with the founder's original directive (the "mega prompt"). **Read the directive in full first; it governs everything here.** Then read this.

You are expected to be creative and open-minded. The founder has said, in his own words, that the current answer for this layer may be wrong, that his own thesis about it "is not gold", and that he wants "a super high quality run". Design boldly; prove honestly.

---

## 0. Orientation in ten lines

1. The system being planned: one responsible person or a small founding team directs an entire company — discovery, product, build, launch, sales, support, money, legal, operations, learning, pause, and responsible closure — at a scale they cannot personally perform or observe, while keeping intent, truth, competence, control, evidence and responsibility. Not a coding tool. Not a dashboard. Not a roster of digital employees.
2. Everything lives under `docs/vision-system/`. Start at `state.json`, then `README.md`, then `planning/PLANNING-REPORT.md` (the founder-facing report), then `planning/02-architecture-selection.md` (the chosen architecture, S1.0).
3. The plan is otherwise complete and independently reviewed: eleven of twelve review dimensions judged sufficient; the twelfth (internal coherence) was repaired and rechecked. The written "accepted" disposition is **deferred** until your round completes, because your layer is part of that whole.
4. The founder has reopened **one layer**: work, agents, routing, layers, authority, tools, skills, context engineering, shared state, tasks, task states. His words are at `inputs/FOUNDER-THESIS-2026-09-13-agents.md` — read them verbatim; treat them as a thesis to test, not a constraint to satisfy.
5. Everything else is **fixed unless a lane returns a specific falsifier**: the consequence/release boundary, evidence and acceptance, recovery, human responsibility, the founder-competence mechanism, whole-company scope. You may reopen any of them — with a counterexample, not a preference — via a decision packet to the founder.
6. **The founder has placed a hold on building.** No implementation stage (B01…B11) may be dispatched. Your output is planning: research, candidates, attacks, a synthesized design, amended specification, independent review. Nothing else.
7. The founder decides only what only he can decide (directive §3). Thirteen such decisions are already queued in `registers/open-questions.json` (Q-002…Q-014); do not ask him to redecide them, and add to that queue only through a proper packet.
8. Every reviewer and author available to you shares one model family. Independence is procedural (separate context, no reading of producers' self-assessments, compute rather than trust). Say so in every review; never launder it.
9. No runtime exists. Every "sufficient", "closed" or "repaired" in the package is about specified behavior checked offline. Keep that distinction in every sentence you write.
10. The founder's short answer to "how do you want me to think": *"agents that are different by the work, the authority, the tools, the skills, the context"* — and *"agents should be added only when they introduce a real capability: parallel work, distinct tools or permissions, isolated context, specialized knowledge, or independent verification."* Test that. Do not assume it.

---

## 1. Where everything is

| What | Where |
|---|---|
| Durable state, next actions, risks, founder hold | `docs/vision-system/state.json` (read `founder_hold`, `founder_reopen`, `active_risks`, `next_actions`) |
| Change history, one line per checkpoint | `docs/vision-system/history.jsonl` |
| The founder's directive, verbatim | `docs/vision-system/inputs/DIRECTIVE.md` (you will also receive it directly) |
| The founder's thesis for THIS round, verbatim | `docs/vision-system/inputs/FOUNDER-THESIS-2026-09-13-agents.md` |
| Original vision and its 53-field / 566-question map | `inputs/THE-PATH-TO-THE-VISION.md`, `inputs/THE-VISION-AND-THE-FIELDS.md`, `coverage/questions.json` |
| Founder-facing report and published page | `planning/PLANNING-REPORT.md`; `planning/site/index.html` (published privately at https://claude.ai/code/artifact/29fd4c60-48ec-49e6-a6f6-a347e3384d37 — republish it when your round lands) |
| The selected architecture, alternatives, reopen conditions | `planning/02-architecture-selection.md` (§3 nine components; §2 and §8 alternatives and retained mechanisms; §9 what would reopen it) |
| **The layer you are reopening** | `planning/specification/05-work-agents-skills.md` (agent operating model, skills); `06-knowledge-evidence-evaluation.md` (context, memory, evaluation); the parts of `01`, `02`, `04`, `07` (§6 capacity, native execution profiles), `08`, `11` that bind them; `planning/specification/work-knowledge-contracts.json` (268 answered questions with verification cases) |
| Machine contracts (records, transitions, predicates) | `planning/specification/contracts/` — run `python3 validate_contracts.py` from that directory (≈5 min, ~270k checks, 31 negative fixtures that must all be rejected; needs `jsonschema`, `referencing`). `tools/guard_distinctness.py` is the oracle for guard quality. `pinned-conjuncts.json` pins the review-class guards. Records most relevant to you: `Mandate`, `WorkOrder`, `ResponsibilityAssignment`, `Continuation`, `HandoffAcceptance`, `SkillVersion`, `InstructionBundle`, `AgentTemplate`, `EvaluatorProfile`, `CapacityPlan`, `ResourceAccount`, `ContextManifest`-class values |
| Prior research (14 lanes) and the ten unresolved axes | `research/L01…L14.md`, `research/cross-lane-comparison.json` — **X03 (coordination control), X07 (participation/competence), X10 (improvement) are your axes**; read what was already found before you research again |
| Prior candidates and the attacks on them | `planning/candidates/` (A records-and-cases, B federated responsibility, C adaptive coordination, C2 inquiry charters), `planning/reviews/D-*.md`, `D2-*.md` |
| The frozen acceptance protocol used for the whole-plan review | `planning/reviews/G-acceptance-protocol.md` — your round needs its own, frozen the same way |
| The four whole-plan reviews and the coherence recheck | `planning/reviews/G-01…G-04*.md`, `G-02-recheck-01.md` |
| Registers: decisions, findings, risks, claims, contradictions, founder queue | `registers/decisions.json` (AD-001…014), `registers/review-findings.json`, `registers/specification-findings.json`, `registers/risks.json`, `registers/claims.json`, `registers/contradictions.json`, `registers/open-questions.json` |
| Coverage of all 24 directive deliverable families | `coverage/package.json`; status rule and distribution `coverage/status-rule.json` |
| Build graph (all stages not started, on hold) | `planning/implementation-graph.json` |

---

## 2. What the package currently says about your layer (so you can disagree with it precisely)

Read these before forming any view; then state, with citations, what you accept and what you reject.

- **No permanent roster.** *"Persistent model identities require demonstrated benefit over portable work records and temporary sessions. Existing roster names do not supply that justification."* (`02-architecture-selection.md` §3). Agents exist per **work order** (outcome, input versions, permitted read set, expected evidence, executor/method constraints, budgets, checkpoint, stop rule, acceptance owner — §4). The 46 capabilities are *"required capabilities, not future departments"* (§6).
- **Production rule** (§3): deterministic computation for arithmetic/validation/known predicates; durable procedures for waiting/schedules/routing/repetition; bounded model work for interpretation and generation; capable people for relationships and consequential judgment; qualified professionals for specialist or physical performance.
- **Sponsors, not departments** (§3): each customer journey has one accepted outcome sponsor; sub-work feeds evidence to it; unsponsored necessary work gets a custodian by rule (`03-company-capabilities.md`, ownership resolver and tie-break), never a queue.
- **Context** (§5): attempt-local working context; episodes; semantic claims as scoped derivatives of evidence; skills as versioned instructions with applicability, exclusions, provenance, test and retirement; start with record queries and permission-filtered lexical retrieval; graph/vector memory only for a named problem with measured benefit; the loader captures all input lineage; outputs stage immutably and become usable only through atomic validity checking.
- **Skills** (`05`): unit of know-how, versioned, with provenance and retirement; selection must not degrade as the library grows (directive §8.9).
- **Capacity** (`07` §6, native profiles N-CLAUDE-SUPPLIED / N-CLAUDE-MEDIATED / N-CODEX-SUPPLIED): subscription allowance measured, not assumed; no silent fallback to metered APIs; concurrency CP1 = 1 native + 1 external unless a reviewed CapacityPlan revises it.
- **Evaluation** (`06`): producer never accepts its own work; independent interpretation required where surviving a shared-parser failure is claimed; the always-pass reviewer must fail the known-defect control.
- **Deferred with a reopen trigger** (§8 table): persistent identities, adaptive competence modeling, graph memory, independent internal issuers (candidate B), C2 inquiry charters. *"Each needs its own comparator and removal trigger; no benefit inherited from selecting S1."*
- **What the existing harness taught** (repo `CLAUDE.md`): it began with 21 named roles; ten had no agent file, eleven were shims, zero resolved to a real engine; it collapsed to seven generic engines — *"domain expertise is a lens, not an agent."* That is evidence about one harness, not a law.

Your round may confirm all of this, overturn part of it, or replace the framing. What it may not do is leave any of it implicit.

---

## 3. The run — Steps 0 to 6

Follow the directive's phase discipline (§7) applied to this layer. Do not skip a step because a plausible answer already exists — that is the failure mode the founder is paying to avoid.

### Step 0 — Frame and freeze (framer engine; before any research)

Produce, and commit, three artifacts:
1. **The thesis decomposed into testable claims.** e.g. "a separate agent per small task adds handoffs, token cost, latency and context loss" → what would be measured, in what unit, against what baseline. Mark each claim: founder constraint / hypothesis / already-evidenced (cite) / contested.
2. **The current-position ledger** for this layer: every statement in §2 above and in `05`, tagged decided / assumed / deferred, with its citation.
3. **The acceptance protocol for this round, frozen before Step 1 begins** — modeled on `planning/reviews/G-acceptance-protocol.md`: the dimensions it will be judged on (at minimum: completeness for unknown future jobs; coherence with the fixed boundaries; context integrity under summarization and handoff; cost and capacity under subscription; independence of verification; buildability; changeability; vision preservation), the probes, the negative controls, and what a (d)-class missing decision means here. Commit it before any lane reads a source.

### Step 1 — Eight independent research lanes (sourcer engine; formed blind, nothing shared until all are in)

| Lane | Bounded question |
|---|---|
| **R1 Context engineering and shared state** | What does one source of truth — goals, current decisions, canonical files, verified knowledge, "what should happen next" — look like at company scale? Context manifests, loss under summarization, contamination, freshness. What is measured, what is folklore. |
| **R2 When does an agent earn its existence** | Evidence for and against the founder's five criteria (parallel work, distinct tools/permissions, isolated context, specialized knowledge, independent verification) and for the costs he names (handoffs, tokens, latency, context loss). Which are real, which are assumed, which depend on the model generation. |
| **R3 Frameworks and harnesses as evidence** | Claude Code subagents and long-running harnesses, Codex/Codex CLI, Gemini CLI, OpenAI Agents SDK, Google ADK, Microsoft Agent Framework, LangGraph, AutoGen, CrewAI, MetaGPT, CAMEL, OpenHands, SWE-agent, Swarm, durable workflow engines (Temporal-class), MCP registries — per directive §4: what each was built to solve, assumptions, mechanisms, failure modes, what is claimed vs shown, what transfers. |
| **R4 Authority as the boundary** | Capability-based design: do tools, permissions and consequence class define agent boundaries better than job titles? Least privilege; delegation and attenuation; "no component inherits all permissions of its creator" (directive §8.16). |
| **R5 Work discovery and routing** | Work orders, routers, queues, state machines; deterministic vs model routing; and the founder's hard case — **jobs nobody anticipated appearing mid-project**: how a system admits, types, staffs and accepts a new kind of work without a human redesign. |
| **R6 Skills and knowledge** | The unit of reusable know-how; discovery and selection that does not degrade as the library grows; composition and conflict; drift; testing; retirement; relationship of skills to prompts, tools, workflows, policies, code (directive §8.9). |
| **R7 Independent verification under one model family** | What "independent" can honestly mean when producer and evaluator share a family; known-defect controls; evaluator drift; evaluation of evaluators (directive §8.14). |
| **R8 Contrarian** | Steelman both ends: a company of chartered persistent agents (why it might be right after all), and zero agents — pure durable workflow with model calls as steps. Economics of each under the subscription-capacity model (directive §8.21). |

Each lane returns: findings, sources (URL, access date, primary/secondary, confidence, expiry, invalidator — directive §6), assumptions, unknowns, competing interpretations, useful mechanisms, rejected mechanisms, failure cases, implications, and questions it believes other lanes missed. Archive each verbatim under `research/F2/`.

### Step 2 — Compare the lanes; keep disagreements

A cross-lane comparison (`research/F2/cross-lane-comparison.json`) that names agreements, disagreements, and the discriminating questions — and explicitly reconciles with the ten existing axes in `research/cross-lane-comparison.json`. Do not force consensus.

### Step 3 — At least four materially different work/agent models (framer engine)

Minimum set — add more if research produces them:
- **M1 Capability-differentiated ephemeral agents around shared state** (the founder's thesis, made concrete).
- **M2 Chartered persistent agents** (standing mandates, identity, memory scope, reserved capacity, evaluation, suspension/retirement).
- **M3 Workflow-first, no agents** (durable state machine; model calls are steps).
- **M4 Hybrid by consequence class** (persistent where continuity or relationship matters; ephemeral elsewhere; workflow where deterministic).
Each on the directive §7 Phase C dimensions (primitives, control, execution, information flow, memory, evidence, authority, user, failure, self-improvement, strengths, weaknesses, scalability, operational complexity, security, provider dependence, migration, when it is the wrong design). Each worked through the same fixtures: an unknown kind of job appears mid-build; demand 4×; a task needing three distinct tool permissions; a verification the producer must not influence; a handoff across a capacity reset; the founder absent for a week. Archive under `planning/F2/candidates/`.

### Step 4 — Attack (reviewer engine; independent; never shown the authors' self-assessments)

Technical, human/company, economic, context-loss, security, and the directive §7 Phase D list (prompt injection, memory poisoning, runaway delegation, runaway cost, summary distortion, owner deskilling, provider change, self-modification drift…). Archive under `planning/F2/reviews/`. Repair what is repairable; keep dissent visible.

### Step 5 — Synthesize and re-specify (framer for the decision; builder for the amendment)

Select, combine, or replace — and explain why, which mechanisms were kept from each candidate, what evidence decided it, what remains uncertain, what would reopen it (directive §7 Phase E). Then amend the specification: `05` (rewrite as needed), the joins into `01/02/04/06/07/08/11`, the machine contracts (records, transitions, predicates — through `tools/phase_content.py` with citations; the validator must pass and every negative fixture must still be rejected; add fixtures for every new guarantee), `coverage/questions.json` for the affected fields, `registers/decisions.json` (new AD entries), and `coverage/package.json`. State exactly what changed elsewhere in the package and why. Version the architecture (S1.1 or S2.0 — say which and why).

### Step 6 — Independent review against the Step 0 protocol → disposition

Reviewers who wrote nothing in Steps 1–5. Separate judgments per dimension; no aggregate score; (d)-class findings block. Then record the scoped planning disposition for the **whole package** (the deferred one), replace the PENDING block in `planning/PLANNING-REPORT.md`, update `README.md`, republish the founder page, and present per directive §15. **Do not dispatch B01.** The founder's hold stands until he lifts it in his own words.

---

## 4. Quality bar — what "super high quality" means here, operationally

- **Evidence over assertion.** Every consequential claim carries a source with date, type, confidence, expiry and invalidator, or is labelled hypothesis. Directive §6's fourteen statement kinds are in use across the package (labels like **SPECIFICATION** / **SOURCE CLAIM** / **INFERENCE** / **DESIGN PROPOSAL** / **DECISION** / **UNKNOWN (admission check)**); use them.
- **Compute, don't read.** When a register says "all joins resolve", resolve them. When a validator says "passed", mutate something and confirm it can fail. Reviewers in this package have repeatedly caught the orchestrator, the authors and each other this way; it is the mechanism that works.
- **Nothing gets credit for existing.** A large registry, a long document, a check count, a list of agent names — none is evidence. The whole-plan review protocol says so and it applies to you.
- **No false closure.** "Repaired, pending independent recheck" is a status; "closed" is a reviewer's word, not an author's.
- **Preserve dissent.** A disagreement the evidence cannot settle is a design input, not a defect.
- **Whole-system relevance.** Every output must say how it binds to the fixed boundaries and to the 46 capabilities. A brilliant agent model that cannot say who accepts a refund is incomplete.
- **Write from the founder's side.** He will read the result. Plain sentences; every number traceable.

---

## 5. Working method and hard-won lessons (do not relearn these)

- **Worktrees.** Every producing lane works in its own worktree under `<your-root>/.worktrees/<slug>` on branch `docs/vision-f2-<slug>`. `git worktree add` **fails under the armed sandbox** (refused on `.claude/commands/**`, `.mcp.json`); the orchestrator creates the worktree itself with the sandbox escalated for that one command and hands the path to the agent. Reviewers need no worktree; they read a frozen commit SHA at the root, and the root is not edited while a review runs.
- **Commit at every checkpoint.** The previous run lost 38 MB of work by committing only at task close. On resumption, scan every lane worktree with `git status --porcelain` before trusting `state.json`.
- **Memory is tight.** The contracts validator is heavy; never run `run_negative_fixtures.py` and `validate_contracts.py` concurrently, and run the validator once per lane, in the background, with a long timeout. The validator's internal fixture pass reports `negative_fixtures_rejected`; the standalone runner is a second opinion, not a requirement.
- **Return channels truncate.** Agent returns over ~4,000 characters arrive cut; ask for the remainder in bounded chunks and archive the concatenation verbatim, noting the parts.
- **Partition lanes by file.** No two concurrent lanes may write one file; reviewers must not read lane worktrees; authors must not read reviews of their own drafts before the review is archived.
- **Every archive gets a provenance header** stating subject SHA, reviewer independence limits, and truncation, and is preserved verbatim.
- **`state.json` and `history.jsonl` are the durable record** (directive §14). Update them at every meaningful checkpoint so a fresh agent can resume. Do not rely on your own conversation memory.
- **Repo mechanics.** `node scripts/classify.mjs <paths>` tiers risk; everything under `docs/**` is `trivial` and skips the binding QA gate; CI still runs. Existing verifiers you should keep green: `node scripts/vision-wk-bindings.mjs verify`, `node scripts/vision-record-registry.mjs verify`, `node scripts/vision-capability-requirements.mjs verify`, `node scripts/vision-coverage-registers.mjs verify`, `python3 docs/vision-system/planning/specification/contracts/validate_contracts.py`.

---

## 6. State at handoff — read `state.json` for the current truth; this is the snapshot

- Branch `ceo-2-1789160976` at `53dcc92`+; tree clean.
- One lane may still be unmerged: `docs/vision-ratchet-pin` (branch, 7 commits; repairs RC-01…RC-08 from the coherence recheck; author-verified at 269,559 checks with 31/31 fixtures rejected; the orchestrator's own single validator run was still in progress at handoff). **First action for you:** check `git branch --list 'docs/vision-*'` and `git log --oneline main..docs/vision-ratchet-pin`; if unmerged, run the validator in that worktree once, merge with `--no-ff`, and record it in `history.jsonl`. Then dispatch a narrow independent recheck that repeats the "weaken `tools/phase_content.py` and regenerate" attack against `pinned-conjuncts.json` (see `planning/reviews/G-02-recheck-01.md`, G2-06). Archive it as `G-02-recheck-02.md`.
- Open register items not on your critical path (leave them registered; repair if convenient): `RP-01` (TypedPredicate branch drift), `G1-04` (verification dilution), `XSR-R-04` (seven deliberately unbound assertions), `G4-05` (two EAS-R1 comparisons need an owner/stage or a recorded deferral), `G4-07` (no provider-side spend ceiling), `G2-04` (invariant boilerplate).
- Founder decision queue: Q-002…Q-014 queued, none due before B02. Q-015 superseded by this round.
- Founder hold on building: **in force**.

---

## 7. What to hand back when you are done

1. `research/F2/` — eight verbatim lane reports + cross-lane comparison.
2. `planning/F2/` — Step 0 artifacts (claims, ledger, frozen protocol), ≥4 candidates, attack reviews, the selection record.
3. Amended specification and contracts, validator green with new fixtures, all existing verifiers green.
4. New `AD-` decisions; updated registers; `coverage/questions.json` rows for the affected fields; `coverage/package.json`.
5. `planning/reviews/F2-*.md` — the Step 6 reviews, verbatim, and the whole-package disposition.
6. `planning/PLANNING-REPORT.md` with the disposition block replaced; `README.md`; the founder page republished with an "Agents, work and context" section that a non-technical reader can follow.
7. `state.json`, `history.jsonl` current; a session file under `docs/08-agents_work/sessions/`.
8. A plain-language note to the founder: what was decided, what was rejected and why, what remains uncertain, what would reopen it, what he must decide — and a clear statement that building has **not** started.
