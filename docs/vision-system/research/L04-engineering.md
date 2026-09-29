# L04 — Engineering, terminals, and computer use

Research date: **2026-09-12**. Mission source: `inputs/THE-VISION-AND-THE-FIELDS.md`; no other lane or architecture conclusions consulted. Scope: engineering as one capability of a company work system, especially fields 2, 5, 9, 14–17, 21, 28, 31, 36–43, 45–49.

**Evidence key:** **O** = locally observed; **D** = documented implementation/behavior, not independently tested; **R** = source authors’ reported experiment; **I** = inference; **U** = unresolved. Source dates and exact URLs appear below. Documentation describes available mechanisms; it does not establish their reliability in this deployment.

## The problem these systems actually solve

**I.** Coding agents turn instructions into changes through repeated observation, action, and feedback. For this mission, their useful output is a candidate artifact plus an inspectable account of its production. A company additionally needs to know what was authorized, omitted, independently checked, and left uncertain. Compiling software is an unusually tractable instance of that larger problem: repositories preserve differences and tests provide executable judgments. Neither property transfers automatically to customer promises, refunds, research conclusions, or business closure.

**I. Assumptions to expose:** the requested outcome is sufficiently specified; the environment can be reconstructed; the agent can observe the behavior that matters; the verifier represents the requirement; and local recovery also recovers everything consequential. Each can fail while an agent reports success. The research therefore separates execution capability, containment, continuity, and evidence of completion.

## What the principal systems contribute

**Claude Code and long-running harnesses. R.** Anthropic’s November 2025 experiment found premature completion, oversized implementation attempts, and broken handovers despite compaction. Its initializer created an executable startup procedure, feature list, progress file, and initial commit; subsequent sessions implemented incrementally and tested through a browser. This architecture assumes that explicit features and recoverable artifacts can carry intent between sessions. The useful mechanism is a fresh session checking actual application state before extending it. The feature list remains model-produced, and instructions against weakening tests are behavioral requests rather than immutable enforcement. [S1]

**R/I.** The March 2026 follow-up used planner, generator, and evaluator roles with negotiated acceptance contracts. A showcased comparison cost $200 over six hours versus $9 over twenty minutes; the planner also expanded the scope substantially. That is useful case evidence, not a controlled estimate of architectural advantage or return on investment. Later removing sprint structure as model capability improved demonstrates that scaffolding should be ablated, not fossilized. The competing interpretation is that some improvement came from extra computation and richer specifications, rather than agent separation itself. [S2]

**D/I.** Claude’s sandbox restricts Bash through filesystem and network controls, but documentation explicitly excludes several surfaces: built-in file tools use their permission system, MCP calls are separate, and computer use acts on the real desktop. Broad network allowlists and Docker sockets can undermine containment. Consequently, “sandbox enabled” cannot serve as a system-wide safety verdict. [S3]

**Codex CLI. O/D.** Read-only inspection of installed `codex-cli 0.154.0` used `--version`, `--help`, `exec --help`, and `review --help`; no inference prompts ran. The CLI exposes interactive operation, noninteractive execution, review, worktrees, resume, and explicit sandbox modes. Official documentation specifies JSONL execution events and schema-constrained final output, which make it practical to integrate the coding loop into a larger coordinator. A syntactically valid report still needs evidence behind its fields. [S4]

**D/I.** Sandbox policy and approval policy are distinct: read-only execution with approvals disabled remains constrained, whereas bypass mode removes both protections. The dedicated review path reads a selected diff and returns findings without changing the working tree. These are useful boundaries between producing and judging; the documentation does not demonstrate statistically independent errors between producer and reviewer. A separate invocation alone cannot establish that independence. [S5], [S6]

**Gemini CLI. D.** Its interface package delegates API communication, tool orchestration, and state management to a core package. Checkpointing, disabled by default, stores project snapshots in a shadow Git repository together with conversation history and the pending modifying tool call. Restore reinstates those local states. This makes the recovery unit richer than a patch. [S7], [S8]

**D/I.** Sandboxing is configurable across OS/container implementations; the macOS default profile permits broad reads and network access while restricting writes. Therefore a shared “sandbox” label conceals different exposure. Checkpoint restoration cannot be assumed to undo a remote API operation, sent message, or background process. Gemini’s description of compression as designed to preserve information is a vendor intention, not evidence that every constraint survives every compaction. [S7], [S8], [S9]

**OpenHands, formerly OpenDevin. D/R.** The research platform separates agent policy, action/observation event stream, and runtime, with shell, browser, and Python execution; its paper evaluates across fifteen benchmarks. This treats code as a general means of acting on digital environments rather than merely producing software. The current SDK further separates core, tools, workspace, and agent-server packages. Local mode runs in one process; remote/container modes provide a different execution boundary. [S10], [S11]

**I.** The useful abstraction is portable action and observation records across deployment choices. The limitation is that a local workspace object is not proof of containment, and an event record establishes what was observed rather than whether all consequential state was observed. The paper’s evaluation breadth does not establish reliable company operation, nor the security of a particular host, network, or mounting configuration.

**SWE-agent. R/D.** Its original contribution was the agent-computer interface: bounded file views, compact search results, syntax-checking edits, and explicit acknowledgment of successful commands with empty output. The paper reports interface investigations, so tool presentation itself is an empirical design variable. Today its own documentation marks SWE-agent maintenance-only and points to mini-SWE-agent as a simpler successor. [S12], [S13]

**I.** Preserve the lesson that interface design affects behavior; do not canonize a particular hundred-line viewer or elaborate tool vocabulary. A stronger model may benefit from ordinary shell composability, while a constrained model benefits from guided primitives. Which wins is workload- and version-dependent.

## Isolation, review, and the operator’s terminal

**D/I.** Git worktrees provide separate working directories and per-worktree state, while sharing references and ordinarily repository configuration. They prevent accidental file-edit collisions; they do not isolate processes, ports, databases, network effects, or all repository administration. Separate branches can also make incompatible assumptions without textual conflicts. Integration therefore needs its own behavioral checks on the combined result. [S14]

**I.** A terminal is both an execution surface and an operator control surface. Commands, diffs, exit status, and test output support precise intervention. A useful account should preserve task identity, working directory/revision, command or tool invocation, start/end state, truncation, and artifact references. “Running,” “awaiting input,” “terminated,” and “completion unknown” must remain distinct. A successful shell exit certifies process convention, not the business outcome. Structured events such as Codex’s are preferable integration material to screen-scraping terminal prose, but raw event streams still require interpretation. [S4]

**I.** The owner should receive a reviewable change and its consequential uncertainties, with terminal detail available for investigation. Requiring them to watch scrollback recreates the supervision bottleneck the mission rejects. Whether compressed reports actually preserve owner competence remains an empirical question, not a UI feature claim.

## What the benchmarks establish—and leave out

| Evidence | Measures | Boundary of the inference |
|---|---|---|
| **D: SWE-bench Verified**, 500 human-filtered instances [S15] | Resolving repository issues under a defined evaluation | Does not measure finding worthwhile products, deployment, maintenance burden, or truthful reporting of omissions. |
| **R: OSWorld**, 369 tasks in its original release [S16] | Configured desktop/web workflows with execution-based checks | Useful for cross-application operation; task initialization and graders simplify the uncertain states of a live business. |
| **R: WebArena** [S17] | Long-horizon web tasks judged by functional correctness | Self-hosted environments enable reproducibility; permissions, changing SaaS interfaces, and real counterparties remain additional problems. |
| **R: Terminal-Bench 2.1** [S18] | Terminal task resolution after benchmark repairs | Its authors corrected 28 of 89 version-2.0 tasks for external drift, resource mismatches, or misspecification. The measuring instrument can fail. |

**I.** Compare exact task version, model, harness, resource budget, attempts, and evaluator—not a headline percentage across mismatched configurations. Grade consequential side effects as well as target completion. Include cases where the appropriate result is refusal, partial delivery, or explicit uncertainty; a success-only suite can reward concealment.

**R.** METR’s early-2025 randomized study found experienced maintainers took 19% longer with AI tools on their own repositories. Its February 2026 update explicitly calls later estimates unreliable because of selection effects and difficulty measuring concurrent-agent work. Neither supports a timeless claim that agents speed up or slow down all engineering. They do show why perceived productivity and benchmark success cannot substitute for measured accepted work and human time. [S19], [S20]

## Implications, rejected mechanisms, and open tests

**I. Candidate mechanisms worth testing:** retain durable acceptance criteria across sessions; verify a recovered environment before resuming; make task results cite immutable revisions and actual observations; place resource/access controls outside the model; and distinguish local rollback from compensating external actions. These are transferable mechanisms, not a chosen architecture.

**I. Challenge to the mission:** vendor-owned logging and separate review already exist. The stronger proposition that vendors will never supply a truthful account is not established here. Any durable differentiation must be demonstrated through the account’s independence, coverage, and usefulness, rather than assumed from who produced the work. [S6], [S11]

**I. Rejected as sufficient:** endless retry loops, producer-authored checkmarks, worktrees as security boundaries, universal human approval of terminal commands, and selecting a company platform from coding leaderboards. Each substitutes activity, local structure, or a narrow score for the mission’s accountable outcome. Per-command approval can also consume attention without revealing the eventual consequence.

**I. Competing architectures remain live:** adapt established CLIs behind a common job interface, use an SDK with controlled remote execution, or reserve deterministic automation for stable actions and invoke agents only for uncertain work. CLI adaptation minimizes duplicated capability; SDK control improves observability but adds maintenance; deterministic paths reduce variation but can miss exceptional cases. This evidence does not rank their total cost for the company.

**Confidence/freshness:** high that the cited mechanisms are documented and the local CLI exposes the observed options; medium that artifact continuity and independent behavioral checks transfer usefully; low that any reviewed system supplies sufficient organizational assurance. Product claims require rechecking after upgrades or policy changes. Historical experiments remain evidence about their recorded configurations. Local tests that show missed external effects, lost constraints after resumption, or correlated review failures invalidate stronger transfer claims.

**U. Missed questions to carry forward:** Who protects the acceptance criteria from the worker? Can interruption stop descendants and pending external actions? How is success checked after an ambiguous timeout without duplicating a transaction? What evidence survives host loss or vendor retirement? Can a reviewer detect an omitted requirement the producer never mentioned? Who notices a stale environment or a grader that always passes? Does reporting uncertainty reduce owner decision time, or merely relocate it? How are credentials, customer data, and retained terminal output separated? What is the cost per accepted outcome including review, rework, operation, and shutdown?

**Research limitation:** this lane performed source review and CLI help inspection, not sandbox penetration tests, benchmark reruns, or production trials. It inspected no credentials or real transcripts. Vendor examples, author-run experiments, and independently administered measurements remain explicitly separate.

## Source index

All sources accessed **2026-09-12**. “Undated” means the fetched page supplies no reliable publication date; it does not mean unchanged.

| ID | Primary source; publication/version date | Exact URL |
|---|---|---|
| S1 | Anthropic, effective harnesses; 2025-11-26 | <https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents> |
| S2 | Anthropic, harness design; 2026-03-24 | <https://www.anthropic.com/engineering/harness-design-long-running-apps> |
| S3 | Claude Code, sandboxing; undated | <https://code.claude.com/docs/en/sandboxing> |
| S4 | OpenAI, noninteractive Codex; undated | <https://learn.chatgpt.com/docs/non-interactive-mode> |
| S5 | OpenAI, agent approvals/security; undated | <https://learn.chatgpt.com/docs/agent-approvals-security> |
| S6 | OpenAI, code review; undated | <https://learn.chatgpt.com/docs/code-review> |
| S7 | Google, Gemini CLI core; undated | <https://geminicli.com/docs/core/> |
| S8 | Google, checkpointing; undated | <https://geminicli.com/docs/cli/checkpointing/> |
| S9 | Google, sandboxing; undated | <https://geminicli.com/docs/cli/sandbox/> |
| S10 | Wang et al., OpenHands; v3 2025-04-18 | <https://arxiv.org/html/2407.16741v3> |
| S11 | OpenHands SDK architecture; undated | <https://docs.openhands.dev/sdk/arch/overview> |
| S12 | Yang et al., SWE-agent; v3 2024-11-11 | <https://arxiv.org/abs/2405.15793v3> |
| S13 | SWE-agent, agent-computer interface; undated | <https://swe-agent.com/latest/background/aci/> |
| S14 | Git worktree manual; 2.54.0, 2026-04-20 | <https://git-scm.com/docs/git-worktree> |
| S15 | SWE-bench benchmark definitions; undated | <https://www.swebench.com/> |
| S16 | Xie et al., OSWorld; v2 2024-05-30 | <https://arxiv.org/abs/2404.07972v2> |
| S17 | Zhou et al., WebArena; v4 2024-04-16 | <https://arxiv.org/abs/2307.13854v4> |
| S18 | Terminal-Bench 2.1 correction report; undated | <https://www.tbench.ai/news/terminal-bench-2-1> |
| S19 | METR, developer productivity trial; 2025-07-10 | <https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/> |
| S20 | METR, experiment redesign; 2026-02-24 | <https://metr.org/blog/2026-02-24-uplift-update/> |

[S1]: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
[S2]: https://www.anthropic.com/engineering/harness-design-long-running-apps
[S3]: https://code.claude.com/docs/en/sandboxing
[S4]: https://learn.chatgpt.com/docs/non-interactive-mode
[S5]: https://learn.chatgpt.com/docs/agent-approvals-security
[S6]: https://learn.chatgpt.com/docs/code-review
[S7]: https://geminicli.com/docs/core/
[S8]: https://geminicli.com/docs/cli/checkpointing/
[S9]: https://geminicli.com/docs/cli/sandbox/
[S10]: https://arxiv.org/html/2407.16741v3
[S11]: https://docs.openhands.dev/sdk/arch/overview
[S12]: https://arxiv.org/abs/2405.15793v3
[S13]: https://swe-agent.com/latest/background/aci/
[S14]: https://git-scm.com/docs/git-worktree
[S15]: https://www.swebench.com/
[S16]: https://arxiv.org/abs/2404.07972v2
[S17]: https://arxiv.org/abs/2307.13854v4
[S18]: https://www.tbench.ai/news/terminal-bench-2-1
[S19]: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
[S20]: https://metr.org/blog/2026-02-24-uplift-update/
