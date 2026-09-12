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
