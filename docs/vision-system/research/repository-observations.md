# Repository evidence

Evidence below is scoped to checkout `b2cabad` unless stated otherwise. A document describing an experiment is a historical source claim until the experiment is independently reproduced.

| ID | Kind | Observation or claim | Source | Implication and limitation |
|---|---|---|---|---|
| R01 | Direct observation | Initial branch is `ceo-3-1789160853`; working tree was clean. | `git status --short`, `git branch --show-current`, `git log -5 --oneline` | Existing branch provides isolation; no initial user modifications observed. |
| R02 | Direct observation | The requested vision filename was not found by the recorded searches. | Filename search in checkout and `/Users/adamks/VibeCoding`; `git log --all -- '*THE-PATH*'` | Absence from searched scope does not establish absence elsewhere. |
| R03 | Direct observation | `docs/01-foundation/VISION.md` contains unfilled mission, values and market template fields. | [Template vision](../../01-foundation/VISION.md) | This is not a substitute for the requested field map. |
| R04 | Direct observation | The prior re-dive's deliverable is a roster specification, topology and migration path. | [Prior re-dive, sections 2–3](../../03-system-design/AGENT-ARCHITECTURE-REDIVE.md) | Inference: the output contract itself invited narrowing to agents. Useful findings must be retained without inheriting that boundary. |
| R05 | Historical source claim | `CLAUDE.md` records an orchestrator summary turning a partial check tally into a clean sweep by losing a failed step. | `CLAUDE.md`, Project State | The new account needs explicit denominators, exclusions and unverified states. This session has not replayed that historical event. |
| R06 | Direct observation | A claim ledger, deterministic check suite, launcher, gate scripts and Mission Control code/tests exist. | `scripts/ledger.mjs`, `scripts/lib/check-suite.js`, `mission-control/`, `bin/warroom` | Existence establishes candidates for reuse, not verified correctness or coverage of the full mission. |
| R07 | Direct observation | Architecture and foundation documents include template content while separate later documents describe implemented harness behavior. | [Template architecture](../../03-system-design/ARCHITECTURE.md), `docs/STATUS.md` | Source classification must distinguish template, historical plan, historical report, implementation and measured behavior. |
| R08 | Historical source claim | The prior re-dive rejected API list-price calculations for subscription-based internal work. | [Prior re-dive, section 1.1](../../03-system-design/AGENT-ARCHITECTURE-REDIVE.md) | The new directive confirms capacity and money must be modeled separately. Historical plan/model prices are not current evidence. |
| R09 | Direct observation | Research playbook bounds one question; ship-feature handles an individual feature through review and merge. | `.claude/playbooks/research-question.yml`, `.claude/playbooks/ship-feature.yml` | The user's explicit A–H lifecycle governs this broader mission. Bounded lane tasks can use existing engine disciplines. |

## Examined areas

Read: routing table; orchestrator; CLAUDE.md; research and feature playbooks; skills router index; production and review lens definitions; template vision/architecture; prior agent re-dive. Indexed headings and file names: rebuild plan, target architecture, agent architecture, status, mission-control, scripts, war-room. Some broad command output was truncated; indexed or partially returned documents are **not** recorded as fully read. No historical result has been promoted to a new measurement.

## Do not repeat

Do not repeat the completed filename search without a new lead. Do not assume the template stack is selected. Do not report a configured guard as an enforced boundary in this Codex session. Do not edit historical claim blocks merely to make old reports read as current.

## Correction and newly located evidence

R02 is superseded: branch-tree inspection found both requested documents at `git:docs/03-system-design/final-v2/@331b4c97657c0d4c648633779eff7668503f7c06`. The original `git log --all -- '*THE-PATH*'` pattern did not match the nested path. Filename absence in the checkout did not establish absence in the repository. Both preserved input files were subsequently read in full.

R10 (direct observation): the current GitHub query returned open PR 131, `docs/final-plan`, plus issues 95 and 96. PR 131 describes earlier founder overrules; the current directive explicitly reopens architectural choices, so those historical architecture choices are not silently reimposed.

R11 (historical source claim): `git:docs/03-system-design/final-v3/round-1/autopsy.md@331b4c97657c0d4c648633779eff7668503f7c06`, read through line 200, argues that previous research fixed the prior design as a premise and treated a frozen coverage denominator as proof of completeness. This diagnosis informs the process; its measurements have not been replayed.

R12 (direct observation, 2026-09-12): inspected `SPINE.md` lines 1–22 and `rethink/L2-company.md` lines 1–22 at the preserved source commit. The former states that the earlier plan stands unless a founder overrule or research fact overturns it; the latter explicitly fixes fourteen agents plus an Operator and refuses to reopen that count. This independently confirms the presence of narrowing instructions cited by the autopsy. The causal claim that these instructions explain all later narrowing remains an inference. Current research lanes receive neither rule.


## R13 — Local isolation-tool availability

**Direct observation, 2026-09-12:** Python platform/command-path discovery reported Darwin 25.5.0 on arm64, `/usr/bin/sandbox-exec`, Node, Bun and Git. Docker, Podman, Lima and bubblewrap commands were absent from PATH; `/var/run/docker.sock` did not exist. This was read-only command discovery, not a sandbox escape test, daemon inventory or proof that any present tool enforces the required boundaries. Architecture remains unconstrained by the current machine; an implementation may justify installing or targeting another supported substrate. Recheck before a runner depends on these observations.


## R14 — Published Ostrom source replaces draft for future reliance

**Direct observation, 2026-09-12:** L13 and L14 cited a revised draft; L13 explicitly requested a published replacement before foundational use. The [official published Nobel lecture](https://www.nobelprize.org/uploads/2018/06/ostrom_lecture.pdf) was retrieved with curl using ordinary certificate verification after the browser returned 403 and Python urllib lacked a working local certificate chain. The PDF has 37 pages, title date 8 December 2009, and SHA-256 `5d11eb59b78e94bef479e66216078231dc803aa9bedd907314a96aba0e53c5f1`. Only the title/introduction and PDF page 15 (printed page 422) were read here; no full-text or complete draft-to-final comparison is claimed. Page 422 supports the narrower statements about monitoring, conflict resolution, recognized local rule-making rights and governance at multiple scales. It describes human institutions; application to automated company work remains an inference. The three candidate authors received this source correction. Historical reports remain intact. A local evidence copy is `.worktrees/vision-evidence/ostrom-final-lecture.pdf`.

## R15 — Reuse boundaries in the existing local control plane

**Direct observation, 2026-09-12, unchanged runtime files at `b2cabad`:** read root and Mission Control package manifests; all of `mission-control/server/app.ts`, `server/routes/guard.ts` and `server/lib/claim-shape.ts`; `server/state.ts` lines 1–120; `server/routes/api.ts` lines 254–368; `scripts/lib/usage.js` lines 1–82; and Mission Control README lines 1–160. Other runtime paths were indexed, not fully reviewed. No new runtime test or exploit was executed.

- The README and package description call Mission Control read-only, while the current API contains a POST dispatch endpoint and the state implementation documents a persisted index cache. The README's early-PR status is historical documentation, not the current write contract. `app.ts` applies a shared browser-origin/site middleware before its routes; the middleware explicitly allows absent site headers and same-site callers. This is not an authenticated owner identity boundary.
- The dispatch route validates discovered project identity and nonempty goal text, appends a pending record, and returns its ID. Those checks do not by themselves demonstrate consequence authorization, complete input lineage, independently durable external-effect history or business-outcome completion. A comment equating synchronous append with on-disk confirmation is not a verified recovery guarantee; the append implementation was not examined in this pass.
- The claim projection validates unknown data, rejects unexpected fields and constructs the output type from checked fields. This is a useful contract-validation pattern, while its existing claim vocabulary and source-file schema address the current harness and do not define the new company evidence ontology.
- The live-state implementation keeps one shared index and explicit change-detection projections. These are possible reusable mechanisms for authoritative UI projections; the current transcript-derived state is not itself an authoritative company obligation or permission store.
- The usage code fixes a five-hour window and reads transcript output-token records. This may supply measured workload observations within its parser scope; it cannot establish remaining provider allowance, current policy, total money spent, or a universal unit of subscription capacity.

**Inference for implementation planning:** reuse individual patterns or modules only after mapping their inputs, trust boundary, persistence and semantics to the selected contracts. Neither replacing the entire repository nor extending the old dashboard in place is justified by file existence. Existing tests and the separately recorded baseline remain useful regression evidence, with the two Mission Control failures still unresolved.


## R16 — Local construction resource envelope

**Direct observation, 2026-09-12, before 12:03 UTC:** read-only `sysctl hw.memsize hw.ncpu hw.physicalcpu hw.logicalcpu` reported 17,179,869,184 bytes (16 GiB) of memory and 10 physical/logical CPUs. `df -h .` reported a 460 GiB data volume with 367 GiB used and 45 GiB available (89% capacity). These are volatile host observations, not performance, isolation or independent-fault-domain evidence. R13's absent isolation tools were not rechecked.

**Implementation implication:** construction and local recovery fixtures must fit the available memory/disk or justify a supported alternative. The operational multi-host profile cannot be treated as validated or fully reproduced on this laptop. This observation does not narrow the final system's scope, authorize paid infrastructure or establish a deployment. No software or VM was installed by this probe.
