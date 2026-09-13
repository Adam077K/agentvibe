> Archival provenance — 2026-09-13: Phase G review, preserved verbatim from the completed independent read-only turn on frozen subject `7ddc066`, following the frozen protocol at [G-acceptance-protocol.md](G-acceptance-protocol.md). The reviewer held three of the twelve dimensions (evidence quality, unknown integrity, adversarial robustness), the negative-control list, and two of the eight portfolio scenarios. It had shell access for computation and no write access; it was barred from producers' self-assessments, session files and `state.json` `completed[]`. The report arrived in four parts because the return channel truncated it; parts are concatenated in order with no edits. Archival does not establish hardened isolation; the reviewer shares a model family with every author and says so.

**Phase G — evidence quality, unknown integrity, adversarial robustness: all three SUFFICIENT for implementation to begin; no (d)-class finding; six (a)/(b) findings**

**Subject:** `7ddc066`

---

## Independence disclosure

Same model family as every author; **procedural** independence only — no reading of producer self-reviews, `docs/08-agents_work/`, or `state.json.completed`. I am predisposed to agree with (i) this package's prose style, which resembles my own, and (ii) documents that pre-empt an objection by naming it — a well-named limitation reads as a discharged one. I compensated by computing register distributions rather than reading their self-descriptions.

---

## Per-dimension judgment

| Dimension | Judgment |
|---|---|
| **Evidence quality** | **Sufficient for implementation to begin.** No (d). The *design* separates observation / endorsement / rationale / causal hypothesis with named records (`RawCapture`, `ReasonRecord`, `EvidenceBaseVersion`, `EvidenceJudgment`) and specifies the exact probes my brief names. The *package's own* evidence hygiene is the weaker half: two (a) findings. |
| **Unknown integrity** | **Sufficient for implementation to begin.** No (d). Deferrals are overwhelmingly class (b) with named admission checks and a non-permissive default. One (a): the founder-decision queue is structurally empty. |
| **Adversarial robustness** | **Sufficient for implementation to begin**, with one (a) finding severe enough that the package may not be *called* a threat model until it lands: the threat registers were frozen against a Phase C commit and contain zero references into the Phase F specification they purport to cover. |

---

## Findings

**G3-01 · (a) · Threat registers are bound to a pre-specification subject.**
`docs/vision-system/research/attack-coverage.json` declares `review_subject_commit: "595f931"`. That commit is *"docs(vision): propose adaptive coordination candidate C"* — **105 commits before** the frozen subject `7ddc066`, and before `planning/specification/` existed. `grep -c 'planning/specification' registers/risks.json research/attack-coverage.json` → **0 and 0**. `implementation_test` is `null` for **33/33** cases, and all 33 carry a byte-identical `status`. Expected: each attack case names the specification passage and the falsifier that answers it. Counterexample: delete `02 §7.2`'s default-deny forward chain and both registers stay green, because neither refers to it. Evidence needed: an AC→spec-section→A-T join, machine-checked.

**G3-02 · (a) · Adversarial falsifiers exist and are orphaned.**
`02-authority-recovery.md §14` specifies **A-T01…A-T18** with explicit fail conditions — including A-T12, which *is* my hostile-noise scenario. The `A-T##` and `AC##` namespaces are **disjoint**: `grep -rl 'A-T0[1-9]'` returns only `02` and `07`; `grep -rl AC01` returns only registers and D-reviews. The work is done; the link is not.

**G3-03 · (a) · Six of nineteen risk-register fields are constant across all 17 groups.**
`design_evidence`, `escalation_requirement`, `implementation_evidence`, `revalidation`, `likelihood_or_uncertainty`, `status` each have **1 distinct value across 17 rows**. `design_evidence` is the same five-file list for "Untrusted content becomes authority" and "Owner overload." This is the protocol's own failure mode — *"merely assigning many IDs to one chapter is not coverage."* Mitigating and real: `cause/consequence/prevention/detection/containment/rollback/residual` **are** per-risk and substantive, and §8.15's ten required fields are all present.

**G3-04 · (a) · Directive §6 statement kinds are used in 1 of 12 specification files.**
`grep -c 'SPECIFICATION\|SOURCE CLAIM\|INFERENCE\|ASSUMPTION\|UNKNOWN (admission check)'` over `planning/specification/*.md` → **33 in `07`, 0 in the other eleven.** The research lanes use a different convention (`**Source claim:** / **Inference:**`, 77 instances across 14 files). So the discipline exists and `07 §9` demonstrates it works; the ten documents an implementer actually reads carry only a per-file header disclaimer. I found **no inference presented as fact** in what I read — the failure is uniform labelling, not misrepresentation.

**G3-05 · (a) · ~50% of sources carry §6 per-source metadata.** Of **305** entries in `research/source-index.json`, exactly **1** carries `source_date/type/confidence/expiry/invalidation`; the index self-describes as *"locator index only ... no blanket verification"* and defers metadata to cited lanes. Resolving reference-style links into per-lane source tables: **154/305 covered, 151 not.** `L03-architectures.md` has **zero** table lines and 19 uncovered sources. `52/305` carry `claim_maintenance_refs`. My 15-source sample confirmed the split. Where metadata exists it is good (`L12`: *"Primary paper; method authors; high mechanism, moderate gain transfer | 2026-12-12; altered critic, task distribution, or version"*).

**G3-06 · (b) · The founder-decision queue is empty; its contents live in prose.** `registers/open-questions.json` holds **1** entry, `Q-001`, status `Answered`, resolved. Meanwhile `02 §2` requires a custodian R independent of A, `CAP-42` requires a *"competent grievance recipient outside disputed dependency"*, `08 §1` requires an independent assessor, and `07 §9` carries 6+ `UNKNOWN (admission check)` items. Each has named bounded interim behavior and a dependent admission restriction — *"If independent competence is unavailable, the protected change waits"*; *"a profile whose endpoint field is empty cannot be admitted"* — so these are (b), **not** (d). But a founder reading the register concludes nothing is owed. Needed: promote every admission check with a *human* dependency into the register with owner and latest-responsible-time.

**Credit, not a finding:** the probe words resolve honestly. `configurable` appears **once** in the whole specification; `TBD`/`TODO`/`choose later` appear **zero** times; `professional` is a typed record (`ProfessionalRequest`: named provider, fee authority, due result) with *"Preparing or delivering the packet does not complete the requested professional work"*; `admission check` is a defined kind that *"never defaults to the permissive branch."*

## Negative controls

| Control | Where caught | Verdict |
|---|---|---|
| Checker passes without checking | `06 §6` *"An always-pass reviewer must fail the known-defect control"*; `§7` injections; `10` routes F31-Q03 here | Caught; independent acceptance owner named |
| Omitted failed attempts | `08 §1` `improvement.trial.record` — *"missing attempts remain missing, never silently dropped"*; `06 §9` | Caught, enforced |
| Changed denominator | `K09` names selection **and denominator** in the acceptance closure; `A-T11` | Caught, enforced |
| Correct output without required authority | `K05`, `K07`; `06 §9` *"a passing artifact with unauthorized process"* | Caught, enforced |
| Duplicated evidence as independence | `02 §13` *"A second model sharing the same corrupt parser, prompt, log owner or reward does not supply independence"* | **Rule only** — no refusal predicate when roots are *unknown*; `06 §7` says unknown roots *"remain unknown"* and nothing bars counting that panel as independent |
| Unchanged rationale despite changed influence | `ReasonRecord` separates endorsed reason / executor report / causal hypothesis / unknown influence; `06 §5` investigator eval with *"planted unobserved influences"*; `06 §6` sham wording change | Caught |
| Blanket refusal as safety success | `06 §6` Safety row *"blanket refusal cannot pass usefulness"*; `01 §9` *"a blanket stop cannot be treated as successful complaint handling"*; `07 §9.3` *"an implementation on which no form can complete has failed this contract as surely as one that sends what it should not"* | Caught, with a positive path specified |

## Scenario — Honor rights under hostile noise

| Step | Governing contract | Adverse variation caught | Not specified |
|---|---|---|---|
| Noncustomer reaches company | `CAP-42`; `07 §4` independent mail address on receipts, static page, offline packets | Custodian outage cannot suppress intake | — |
| Standing without account | `CAP-42` accessible intake | — | — |
| Complaint names the custodian | `CAP-42` role: recipient outside disputed dependency; `CAP-17` routes to alternate | — | **Who the alternate is, who appoints, by when** (b) |
| Severe harm + sustained false reports | `01 §9` grievance gets separately reserved finite allocation, not charged to adversary's episode | Flood cannot commandeer service budget | — |
| Across provider resets | `K10` bounded causal totals survive resets; `A-T12` fail conditions | Reset cannot refill an episode | — |
| Clustering the noise | `CAP-42` evaluation: clustering cannot erase identity, deadline or route | Exactly the probe | `status: unexecuted` |
| Remedy | `CAP-42` + `R-REMEDY`; `06 §6` no override of a lawful mandate | Blanket stop ≠ handling | Funded remedy capacity is an admission input |

## Scenario — Recover actual responsibilities

| Step | Governing contract | Adverse variation caught | Not specified |
|---|---|---|---|
| Primary lost after refund | `02 §1` zero loss of acknowledged transitions; `A-T01` | Release from an A row alone fails (`02 §6.3`) | Recovery *time* — operator-dependent, unbounded |
| Zero-immediate-cost promise | `Grant.consequence_bounds`; `potential_obligation_refs`; `K07` | No-cash promise still carries a potential obligation | — |
| Inbound acceptance during gap | `02 §3` D1 staging; receipt not promised, duty-may-exist surfaced | Offline intake cannot hide an arisen duty | — |
| Hidden destination history | `02 §6.3` unknown-effect rows; `§7.4` zero observed packets ≠ no effect | Absence of a log is insufficient evidence | — |
| Producer's own logs | `02 §13` producer-selected logs are reported, not complete capture | Self-report cannot close the unknown | — |
| Incomplete handoff | `K11`; `06 §6` handoff row; `A-T15` | Parking/closure/absence never discharge standing; honest incapacity fails delivery | — |
| Dispose of survivors | `CAP-39`; `02 §10` rollback is a forward migration carrying unknown holds | Old snapshot never restores old permission | Closure funding is an admission input |

## 33-case tally

- **Enforcement point named: 29** — AC01–06, AC08–19, AC21–22, AC25–33.
- **Rule only: 4** — **AC07** (model collusion: measurement obligation, no refusal predicate when trust roots are unknown), **AC20** (goal drift: review cadence), **AC23** (owner overload), **AC24** (owner deskilling).

## Not checked

Completeness, traceability, internal coherence, alternative depth, vision preservation, operational feasibility, buildability, responsibility, changeability — other reviewers' dimensions · the other six portfolio scenarios · the 566-question denominator and `coverage/*.json` · `work-knowledge-contracts.json` and the XSR-02 amendment's 394 bindings (`vision-wk-bindings.mjs verify` not run) · `contracts/validate_contracts.py` and its 14 negative fixtures not executed · specification files `01`, `03`, `04`, `05`, `09`, `10`, `11`, `12` read only by targeted grep, not in full · **no URL was fetched**, so every reported source access date is unverified · EAS-R1 comparators and `baseline-results.json` · `decisions.json`, `review-findings.json`, `specification-findings.json` · no runtime, model, isolation or deployment test of any kind.
