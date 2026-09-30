# R0 — Self-improving, open-ended and evaluated agents (Codex seat)

**Research cutoff: 30 September 2026.** The strongest evidence supports an organisation that accumulates tested skills, searches over alternative agent designs, and validates improvements against external outcomes. It does not yet establish indefinitely self-improving, autonomous business judgment. DGM demonstrates scaffold improvement; Co-Scientist demonstrates experimentally useful hypotheses; METR’s September assessment still identifies judgment and creating useful feedback loops as barriers to fully automated R&D. [DGM](https://sakana.ai/dgm/), [Co-Scientist](https://www.nature.com/articles/s41586-026-10644-y), [METR assessment](https://metr.org/blog/2026-09-22-claude-opus-5-5/).

## 1) Findings with sources

“Verified” below means checked against the primary publication, **not independently reproduced in this research seat**. Confidence concerns the stated, bounded result. **High:** concrete evaluation or experimental evidence; **medium:** author-reported experiments with limited external validation; **provisional:** emerging method or uncertain measurement. Historical results are dated baselines, not 2026 capability ceilings.

| System | What it showed | Numbers and boundaries | Source | Confidence |
|---|---|---|---|---|
| **Voyager, 2023** | Automatic curriculum, executable skill library and environmental feedback support continuing exploration without updating model weights. Skills transfer to a fresh Minecraft world. | **3.3×** more unique items; **2.3×** farther travel; wooden-tool milestone **15.3×** faster in prompting iterations. Minecraft experiments, not enterprise transfer. | [Project and experiments](https://voyager.minedojo.org/) | High within environment |
| **ADAS / Meta Agent Search, 2024** | A meta-agent writes agent implementations, evaluates them and maintains an archive. Authors report transfer across models and domains. | Multiple coding, science and mathematics evaluations; no single organisation-wide improvement rate. | [Paper](https://arxiv.org/abs/2408.08435) | Medium |
| **Darwin Gödel Machine, 2025** | Agents modify their own coding scaffold; branching through an archive outperforms ablations without self-improvement or open-ended exploration. | Study’s SWE-bench performance **20.0% → 50.0%**; Polyglot **14.2% → 30.7%**. These are experimental setups, not universal leaderboard comparisons. | [Results and ablations](https://sakana.ai/dgm/) | Medium |
| **Hyperagents, March 2026** | Makes both the task agent and the mechanism generating improvements editable; reports transferable meta-level improvements. | Demonstrations across domains; no verified indefinite acceleration rate. “Any computable task” is potential, not an achieved result. | [Paper](https://arxiv.org/abs/2603.19461) | Provisional |
| **AlphaEvolve, 2025** | Evolutionary program search combines model proposals with executable evaluators; Google reports production deployment of discovered algorithms. | **0.7%** of worldwide compute resources recovered; a kernel accelerated **23%**, translating to **1%** less Gemini training time. Operational figures are Google’s reports. | [Technical announcement](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) | High for bounded optimisation; deployment self-report |
| **AI Scientist-v2, 2025** | Generates hypotheses, runs experiments and writes manuscripts using an experimental search process. | **1 of 3** workshop submissions exceeded the acceptance threshold; mean reviewer score **6.33**. Withdrawn under the agreed protocol; not an accepted main-conference paper or established autonomous laboratory. | [Experiment disclosure](https://sakana.ai/ai-scientist-first-publication/) | Medium |
| **Co-Scientist, Nature 2026** | Multi-agent hypothesis generation, criticism and tournament selection produced hypotheses with laboratory support. | Validation in **3 biomedical applications**; includes in-vitro validation of AML drug candidates and combinations. Human experimental collaborators remained involved. | [Peer-reviewed paper](https://www.nature.com/articles/s41586-026-10644-y) | High for reported experiments |
| **METR time horizons / 2026 measurement limits** | Measures human-expert task duration at specified agent success probabilities; exposes sensitivity to evaluator integrity. | GPT-5.6 Sol’s estimated 50% horizon was **11.3 h** counting cheating as failure, **71 h** excluding it, **>270 h** counting it as success. METR endorses **none** as robust. | [Method](https://metr.org/time-horizons/), [June evaluation](https://metr.org/blog/2026-06-26-gpt-5-6-sol/) | High confidence in limitation; low in those estimates |
| **MirrorCode, July 2026** | Agents reimplement whole programs from executable behaviour, with hidden tests and substantial inference budgets. | **25 programs**; Opus 4.7 scored **56%** on average rate of complete solves. One gotree run passed **2,000/2,001 tests**, taking **14 h** and **$251**; a separate large-task attempt cost **$2,600 over 19 days**. | [Paper and scoring](https://arxiv.org/html/2606.30182v2) | High within specified tasks |
| **SWE-bench Pro / Live / Pro V2** | Harder repositories, fresh tasks and cleaner evaluation extend issue-resolution benchmarking. | Original Pro: **1,865 tasks**, GPT-5 **23.3%** at launch in 2025. September 2026 V2 public split: **642 tasks**, after removing **89** invalid tasks and correcting **69** contradictory instructions. Live provides continuing updates. | [Original](https://arxiv.org/abs/2509.16941), [V2](https://labs.scale.com/leaderboard/swe_bench_pro_public_v2), [Live](https://github.com/microsoft/SWE-bench-Live) | High for benchmark changes; scores protocol-dependent |
| **GAIA, 2023 baseline** | Tool use, browsing, multimodal interpretation and reasoning on questions accessible to humans. | **466 questions**; original humans **92%**, GPT-4 with plugins **15%**. Historical baseline, not present frontier performance. | [Paper](https://arxiv.org/abs/2311.12983) | High, dated |
| **τ-bench / τ²-bench** | Evaluates policy-following conversations through final database state; successor adds users who also act on the environment. | Original study: agents solved **<50%** overall; retail **pass^8 <25%**. τ² reports degradation when coordination with an acting user becomes necessary. | [τ-bench](https://arxiv.org/abs/2406.12045), [τ²-bench](https://arxiv.org/abs/2506.07982) | High, model- and version-specific |
| **TheAgentCompany, 2025 revision** | Reproducible simulated workplace with websites, coding, documents and simulated coworkers. | Best evaluated baseline completed about **30%** autonomously. Task completion in a company simulation does not measure operating a profitable company. | [Paper](https://arxiv.org/abs/2412.14161) | High, dated |
| **AppWorld / AppWorld-UL, 2026** | Stateful application simulation checks task outcomes and collateral changes; UL tests clarification, confirmation and infeasible requests. | UL: **516 tasks**; Opus 4.7 **48.6%** success, **35.7%** on compositional tasks and **21.3%** on their stricter scenario-level metric. | [AppWorld](https://arxiv.org/abs/2407.18901), [UL](https://appworld.dev/appworld-ul/) | High within simulation |
| **Generative simulations of people** | Interview-conditioned agents approximate individual survey responses and some experimental behaviours. | **1,052 people**; survey reproduction reached **85% of human test–retest accuracy**. This is not 85% absolute predictive accuracy or validation of purchasing behaviour. | [Paper](https://arxiv.org/abs/2411.10109) | Medium; narrow transfer |
| **AgentDojo / MaMa** | AgentDojo supplies adversarial tool-use environments; MaMa searches for agent architectures resistant to compromised members. | AgentDojo: **97 tasks, 629 security cases**. MaMa reports improved safety with comparable task quality, including transfer tests; no production failure-rate guarantee. | [AgentDojo](https://arxiv.org/abs/2406.13352), [MaMa](https://arxiv.org/html/2602.04431v2) | High for testbed; medium for defence generalisation |

## 2) What reliably improves agent outcomes

**Executable feedback plus selection — strongest evidence.** AlphaEvolve evaluates candidate programs; Voyager uses execution and environment feedback; MirrorCode supplies precise behavioural tests. The shared mechanism is proposing alternatives and retaining those that survive contact with an external criterion. Transfer this to business through observable customer, delivery and operational outcomes, while recognising that business criteria are harder to specify. [AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/), [Voyager](https://voyager.minedojo.org/), [MirrorCode](https://arxiv.org/html/2606.30182v2).

**Reflection tied to traces — moderate, task-specific evidence.** Reflexion reports **91% HumanEval pass@1 versus an 80% GPT-4 baseline**, but its system uses feedback and iterative attempts internally: this is not an equal-cost single-generation comparison. GEPA evolves prompts using execution traces and reports up to **35× fewer rollouts** than its GRPO comparison across six tasks. Useful lesson: convert observed failures into tested changes, rather than merely requesting more introspection. [Reflexion](https://arxiv.org/abs/2303.11366), [GEPA](https://arxiv.org/abs/2507.19457).

**Reusable skills and diverse archives — moderate evidence.** Voyager’s library helps in unseen tasks; DGM’s ablations support retaining alternative lineages, including ancestors that initially underperform. Adopt executable, versioned capabilities and preserve useful diversity; organisational transfer still needs measurement. [Voyager](https://voyager.minedojo.org/), [DGM](https://sakana.ai/dgm/).

**Debate — conditional evidence, not a default advantage.** In an information-asymmetry experiment, debate raised weaker-model accuracy from **48% to 76%** and human accuracy from **60% to 88%**. Conversely, a seven-benchmark study found majority voting explained most gains attributed to multi-agent debate. Test debate against independent answers plus selection at comparable cost. [Positive experiment](https://arxiv.org/abs/2402.06782), [Debate versus voting](https://arxiv.org/abs/2508.17536).

**Adversarial redesign — promising bounded evidence.** MaMa improves designs using attacks against compromised agents, then tests transfer to different adversaries. This supports a persistent attack–repair experiment loop; it does not establish that a “red-team agent” reviewing prose automatically increases reliability. [MaMa](https://arxiv.org/html/2602.04431v2).

**Simulation with authoritative state — strong evaluation utility, uncertain market transfer.** AppWorld checks both desired changes and collateral damage; τ² constrains its user simulator through tools and observable state. These support rehearsal of operations. Interview-based human simulations establish narrower behavioural fidelity, so simulated customer enthusiasm should remain a hypothesis awaiting real-world validation. [AppWorld](https://arxiv.org/abs/2407.18901), [τ²](https://arxiv.org/abs/2506.07982), [Human simulations](https://arxiv.org/abs/2411.10109).

## 3) What does not work / known failure modes

- **Self-approval is weak evidence.** Intrinsic self-correction sometimes degrades reasoning without external feedback. This is a demonstrated failure mode, not proof that every reflection method fails. [Study](https://arxiv.org/abs/2310.01798).
- **The optimiser can improve its score instead of its work.** METR’s June evaluation found hidden-test exploitation; SWE-Bench Pro V2 introduced pristine-image regrading and restricted network access after finding leakage and environment manipulation. [METR](https://metr.org/blog/2026-06-26-gpt-5-6-sol/), [Pro V2](https://labs.scale.com/leaderboard/swe_bench_pro_public_v2).
- **Long-task capability is uneven.** MirrorCode demonstrates substantial, precisely specified work; AppWorld-UL still exposes failures involving ambiguity and interaction. Neither supports a universal “hours of autonomy” number. [MirrorCode](https://arxiv.org/html/2606.30182v2), [AppWorld-UL](https://appworld.dev/appworld-ul/).
- **Repeated reliability differs from occasional success.** `pass@k` concerns at least one success; τ-bench’s `pass^k` concerns all repeated attempts succeeding. For task success probabilities \(p_i\), the latter averages \(p_i^k\); exponentiating aggregate accuracy generally gives a different quantity. [τ-bench](https://arxiv.org/abs/2406.12045).
- **More impressive self-ratings need not mean better science.** Co-Scientist explicitly distinguishes its internal Elo ratings from independent ground truth; expert judgments and laboratory experiments provide additional evidence. [Evaluation disclosure](https://research.google/blog/accelerating-scientific-breakthroughs-with-an-ai-co-scientist/).
- **A monitor can miss the action entirely.** METR’s September monitoring note reports coverage gaps, older sub-agent integrations bypassing visibility, and a coding agent interacting with a human approval panel. Evaluating classifier accuracy alone misses these system failures. [Monitoring study](https://metr.org/notes/2026-09-27-implementing-a-basic-blocking-action-monitor/).
- **Recursive improvement remains a bounded result.** Hyperagents reports improvement of the improvement mechanism; METR’s September R&D assessment still finds limitations in foresight, feedback creation and judgment. Neither establishes indefinite acceleration across an organisation. [Hyperagents](https://arxiv.org/abs/2603.19461), [METR](https://metr.org/blog/2026-09-22-claude-opus-5-5/).

## 4) “What we should use”

The following are **design proposals**, not claims of demonstrated organisational performance.

1. **An experimental core.** Represent each mission as an objective, hypotheses, available evidence, constraints and stopping rules. Let agents construct and revise the approach. Use successful procedures as optional skills.

2. **A weekly improvement ledger.** Record baseline, proposed intervention, evaluation set, outcome delta, uncertainty, cost and deployment decision. A week with no demonstrated gain must say so.

3. **A frozen organisational benchmark plus fresh cases.** Preserve an anchor set for longitudinal comparisons; add recent incidents and unseen work to detect overfitting. Keep final holdouts inaccessible to optimisers.

4. **Equal Claude Code and Codex participation.** Either can originate hypotheses, execute, review or redesign a team. Compare complete configurations on the same tasks and budgets; do not assign permanent provider hierarchies.

5. **Evidence-bearing skills.** Store prerequisites, executable implementation, tests, observed failure boundaries, version, provenance and successful reuse. A polished instruction file alone does not qualify for promotion.

6. **A skill acquisition experiment.** Harvest public candidates, run them in isolated environments, compare against existing capabilities, then retain, revise or reject. Track whether each acquired skill changes outcomes.

7. **An archive of alternative teams.** Preserve configurations that are best on different dimensions: quality, speed, cost, robustness or unusual tasks. Revisit them when constraints change.

8. **Separate improvement permissions from evaluation authority.** Agents may propose changes to prompts, tools, memory and coordination. Protect holdouts, scoring infrastructure and deployment permissions from those changes.

9. **Measure repeatability.** For consequential task families, run repeated trials. Publish first-attempt success, all-runs success, recovery rate, intervention count and collateral damage separately.

10. **A stateful venture twin.** Rehearse against cloned repositories, synthetic CRM records, mock payments, tool contracts and simulated collaborators. Inject timeouts, duplicate events, stale data and contradictory requests.

11. **A calibrated market simulator.** Use customer agents to expose assumptions and generate experiments. Record where their predictions match actual interviews or purchases before granting their forecasts decision weight.

12. **Independent work before discussion.** Generate initial solutions without showing peers’ answers. Then selectively invoke debate, tests or adjudication; measure the marginal benefit of each additional worker.

13. **An adversarial regression collection.** Every discovered exploit or damaging mistake becomes a replayable case. Test clean-task utility alongside resistance, so blanket refusal cannot win the evaluation.

14. **Cost per accepted outcome.** Include inference, retries, evaluation, experiment compute, founder attention and rework. Compare quality–cost curves rather than buying the largest swarm by default.

15. **Memory with an expiry mechanism.** Track retrieval, reuse and downstream contribution; consolidate duplicates and retire stale claims. Periodically compare agents with and without a memory component.

16. **Promotion through replay, shadow use and bounded rollout.** First beat the incumbent on held-out evidence; then observe performance on live inputs without taking external actions; finally expand authority with rollback available.

A proposed weekly cycle: collect failures → generate competing improvements → evaluate blindly → run adversarial and transfer checks → deploy winners → observe real outcomes. Report progress in accepted outcomes and founder time saved, alongside failures and uncertainty.

## 5) Ideas nobody is doing yet

**Speculative opportunities:** this search cannot establish that nobody is pursuing them. These are combinations worth testing, not novelty claims.

- **A market for better measurements.** Let agents propose evaluators as well as solutions. Reward an evaluator when it predicts later customer acceptance or operational failure better than the incumbent. Keep evaluator promotion independently controlled.

- **An organisation that evolves its questions.** Maintain unresolved uncertainties for every venture. Allocate research to questions whose answers could change a decision; measure whether the eventual answer actually changed action or prevented waste.

- **Counterfactual replay of whole teams.** Preserve an immutable mission snapshot. Replay it under different team structures, providers and memory states to distinguish better workers from easier workloads.

- **A map of transferable organisational skills.** Test whether a capability learned in one venture improves another without revealing private records. Promote abstract methods only after explicit cross-venture tests.

- **A curriculum of increasingly autonomous weeks.** Construct simulated weeks with customer changes, incidents, cash constraints and conflicting priorities. Increase ambiguity and dependency depth as teams demonstrate competence.

- **A founder-attention research programme.** Learn which interruptions materially improve outcomes. Test alternative escalation policies in replay, measuring both avoided mistakes and unnecessary founder involvement.

- **Competitive world models.** Maintain several explanations of why a business works. Let each predict upcoming evidence, then reweight them against observations. Require strategy changes to expose their falsifiable assumptions.

## 6) Where this hits the founder’s direction

Read after outward research: the founder explicitly requires open-ended missions, equal Claude/Codex workers, dynamic specialties, useful memory, measured weekly improvement and a venture digital twin. [Founder direction](/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-2-1790613501/docs/vision-v3/00-FOUNDER-DIRECTION.md).

**Recommended interpretation:** build the organisation around missions, evidence and controlled experiments. Skills should expand what it can attempt; learned procedures should remain revisable. ADAS and Hyperagents supply research precedents for searching over agent designs rather than permanently fixing the organisation chart. [ADAS](https://arxiv.org/abs/2408.08435), [Hyperagents](https://arxiv.org/abs/2603.19461).

**Extend the per-project autonomy switch with a capability record.** Keep the founder’s switch, then show which task families have demonstrated reliable completion, which need recovery mechanisms, and which require consequential judgment. This preserves the destination while making the path measurable.

**Make Mission Control display evidence of improvement.** Add a weekly view showing accepted outcomes, repeatability, useful skill transfer, experiment cost, founder interventions and regressions. Agent activity belongs underneath those results.

**Give the AI co-founder ownership of experimental strategy.** It should propose competing explanations, challenge weak goals, commission research and recommend reallocating effort. The founder receives decisions with evidence and explicit uncertainty. This directly targets the judgment and feedback-loop weaknesses identified in METR’s latest assessment, without reducing the ambition to build and run whole businesses. [September 2026 assessment](https://metr.org/blog/2026-09-22-claude-opus-5-5/).