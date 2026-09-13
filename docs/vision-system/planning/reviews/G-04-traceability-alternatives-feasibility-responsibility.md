> Archival provenance — 2026-09-13: Phase G review, preserved verbatim from the completed independent read-only turn on frozen subject `7ddc066`, following the frozen protocol at [G-acceptance-protocol.md](G-acceptance-protocol.md). The reviewer held four of the twelve dimensions (traceability, alternative depth, operational feasibility, responsibility), the directive §8.21 checklist, and two of the eight portfolio scenarios plus the two required business cases. It had shell access for computation and no write access; it was barred from producers' self-assessments, session files and `state.json` `completed[]`. The report arrived in five parts because the return channel truncated it; parts are concatenated in order with no edits. Archival does not establish hardened isolation; the reviewer shares a model family with every author and says so.

**Phase G — traceability, alternative depth, operational feasibility, responsibility: all four SUFFICIENT for implementation to begin; no (d)-class finding; eight (b)/(c) findings, G4-01/02 to be fixed before B06**

**Subject:** `7ddc066`

---

I reviewed the frozen subject `7ddc066` under `docs/vision-system/`, reading only my four dimensions' named files plus the contracts registries. I did not open `docs/08-agents_work/`, any producer's review of its own draft, or `state.json.completed`. **Independence is procedural only — I am the same model family as every author, and I am predisposed to agree with this package's style of self-qualification, which is also my own; I compensated by computing every count rather than reading one.** No finding below rests on a register's self-description.

## Per-dimension judgment

| Dimension | Judgment |
|---|---|
| **Traceability** | **Sufficient for implementation to begin.** |
| **Alternative depth** | **Sufficient**, with G4-05 named. |
| **Operational feasibility** | **Sufficient**, with G4-07 named. |
| **Responsibility** | **Sufficient**, with G4-01/02 — fix before B06, not before B00. |

No class (d) finding in my four dimensions. Nothing here blocks.

**Computed, not accepted:** 566/566 `answer_location` JSON pointers resolve and the target carries the original question bytes verbatim. 3,938 `file.md#anchor` references from JSON: 0 dead files, 0 dead anchors. `validate_contracts.py` → `status: passed`, **252,511 checks**, 173 records, 2,255 predicates, 1,295 edges, 46 required subjects; 13 negative fixtures exist and the runner refuses a zero-fixture pass. Correction trace XSR-R-02/R-04 reproduces **exactly**: 56 subcases, 163 assertions, 398 bindings, 0 unbound answers, and the 7 still-unbound assertions are the 7 the register names. A claimed repair that lands in the frozen tree, with its residue preserved and its recompute command working, is the strongest traceability evidence I found.

## Findings

**G4-01 (b) · Conflict-aware grievance routing is declared and unguarded.** Requirement: directive §3/§1.6 and `03-company-capabilities.md:131` ("a complaint about the current custodian routes outside the disputed decision/incentive dependency"). `contracts/records.schema.json#/$defs/GrievanceCase` makes `disputed_custodian` required; it is read by **0 of 2,255 predicates**. `criterion.GrievanceCase.closed.v1` requires `independent_escalation_assignment_ref` be `accepted` but never that it differ from `custodian_assignment_ref` — and `neq` exists in `primitive-registry.json`. Counterexample: implicated custodian named in both fields, `disputed_custodian: true`, every guard from `received` to `closed` passes. Evidence needed: a guard calling `neq` on the two refs at `triaged`.

**G4-02 (b) · Funded remedy is unchecked at the transition that authorizes it.** `remedy_reservation_refs` is required in the payload and used in **0** predicates; `criterion.GrievanceCase.remedy_authorized.v1` carries `nonempty_fields: []`. A remedy can be authorized with no reservation, making CAP-42's "funded remedy" prose. All six intermediate grievance phases have empty field checks; only `closed` checks anything.

**G4-03 (b) · The external-burden instrument passes empty.** `Economics.external_burden_observations` is required but is an array, and `criterion.Economics.validated.v1` checks only `/payload/allocation_rule`. The protocol's required case — a profitable venture shifting work onto customers, applicants or contractors — validates with `[]`. `CandidateAssessment.candidate_burden` (required) is the better-built half.

**G4-04 (b) · Overlapping-mandate tie-break unspecified.** `03-company-capabilities.md:67` gives a real ordered resolver (promise sponsor → service mandate → designated maintenance/discovery custodian) and then says "a bounded resolver assigns provisional custody when mandates overlap" without the rule. Two implementers derive different owners for the same harm. **Not (d):** whichever is chosen, custody exists, `unresolved_scope` is required on `ResponsibilityAssignment`, and timer expiry activates the accepted alternate — the guarantee survives the invented policy.

**G4-05 (c, deficient) · Two of EAS-R1's four comparisons are unreachable inside the plan.** Comparison 3 (the same C2 rights implemented through a shared-hypothesis representation) and comparison 4 (C2 versus adaptive A) both require building what `02-architecture-selection.md` §8 explicitly defers — "Defer C2 general charter jurisdiction and blackboard". The construction graph B00–B11 in `08-improvement-implementation.md` §7 budgets only "matched S0 comparison" at B09; no stage carries a second representation or C2 machinery. No entry in `registers/claims.json` owns the comparison, and all 8 claim owners are "orchestrator", a planning role that will not exist at B11. The reopening trigger stated for C2 — "if C2 reveals valuable neglected work that scheduled review systematically misses" — depends on evidence only a built C2 can produce, so the falsifier is circular. Protocol, baseline, measurement rules and stopping conditions all exist (`06` §8, `02` §9), which keeps this at (c) rather than (d); what is missing is an owner, a stage and a budget. Evidence needed: either those three, or a recorded decision that comparisons 3–4 are deferred indefinitely with that consequence stated.

**G4-06 (b) · Stale consolidation claims.** `07-integrations-capacity.md` §8 and `08-improvement-implementation.md` §8 both state that the nine-component 19-attribute matrix "remains a separate consolidation obligation". Computed at the frozen subject: `components-authority.json` holds 9 components × 19 attributes = 171 entries, none empty and none under 60 characters, matching `10-components-authority-traceability.md`'s stated 171. Both 07 and 08 were authored at base `e9201fa`, before `10`'s base `c3519f5`, so the claim was true when written and is false now. A reader following `08` §8 redoes finished work or understates the package.

**G4-07 (b) · No provider-side ceiling on metered adapters.** Postmark's published overage ($1.80/1,000 above 10,000) and Brave's $5/1,000 are bounded company-side only: `IntegrationInvocation.reservation_refs` is required, `BillingProfile` requires `allowed_paid_actions`, `maximum_exposure` and `auto_reload_observation_ref`, and `07` §6 reconciles daily. Nothing at the provider caps spend, so a misconfigured company cap is detected at the next reconciliation rather than prevented. Counterexample: an admitted send cap set above 10,000/month bills overage silently until daily reconciliation. Evidence needed: a provider-side plan/quota setting recorded as an admission check, or an explicit statement that this exposure is accepted and bounded by reconciliation latency.

**G4-08 (b) · Schema and guard disagree on `competence_requirement_ref`.** `records.schema.json#/$defs/DecisionPacket` omits the field from `required`; `criterion.DecisionPacket.ready.v1` lists `/payload/competence_requirement_ref` in `nonempty_fields`, so a packet cannot reach `ready` without it. Two implementers derive different packets from the same contract. It also over-constrains the case the directive §1.6 most wants preserved — a pure taste decision, which has no competence prerequisite to name. Evidence needed: one of the two moved to match the other, with the taste case stated.

## Directive §8.21 item checklist

| Item | Specified? | Mechanism or sentence |
|---|---|---|
| Provider | yes | `AdapterProfile` + `IntegrationConnection` records |
| Account identity | yes | mechanism — `principal_ref` plus actual provider account identity, admission-verified |
| Allowed usage | yes | mechanism — `allowed_paid_actions`, profile `allowed methods/actions` |
| Authentication method | yes | mechanism — per-connection credential selector, connector-held token |
| Current allowance | yes | mechanism — `CapacityObservation.measurement` permits explicit unknown; unknown never reads as available |
| Reset windows | yes | mechanism — `reset_at` optional *by design* (provider may not report); conservative single-launch scheduling when absent |
| Weekly or session limits | partial | generic buckets, no concrete 5-hour/weekly structure; unavailable-state behavior is a mechanism ("missing or stale billing evidence stops new launches") |
| Concurrency | yes | mechanism — CP1 = 1 N + 1 X; increase needs a reviewed CapacityPlan revision |
| Capacity pressure | yes | mechanism — max-of-dimensions, never blended; stop at 85%, restore below 65% |
| Queued work | yes | mechanism — deadline-then-age dispatch, reserved due-service share |
| Expected workload | yes | estimate with declared unknowns |
| Fallback behavior | yes | mechanism — outage pauses that queue, local staging, qualified substitute |
| Provider switching | yes | mechanism — requires equivalent task evaluation and compatible disclosure |
| Interruption | yes | mechanism — SIGINT/SIGTERM/SIGKILL; gate deadline independent of process cooperation |
| Resume | yes | mechanism — job-bound session ID only; `--last`/ambient selection forbidden |
| Additional credits or API spending | yes | mechanism — `BillingProfile.allowed_paid_actions` allowlist + required `maximum_exposure` |
| **No silent subscription→metered fallback** | yes | **mechanism** — no API key in N, `--bare` forbidden, `AuthAttestation` records API-key-override absence, no upgrade-capable operator token, fail-closed free quotas, IC-T07. Residual: G4-07 |

## Scenario: find and repair unsponsored work

| Step | Governing contract | Adverse variation caught | Not specified |
|---|---|---|---|
| Discovery, no requester | `02` §4; `07` §6 reserved discovery share | yes — share cannot be borrowed away | detection rate (c) |
| Protective custody | `03`:67 ordered resolver; `ResponsibilityAssignment` requires competence/authority-limit/continuity/`unresolved_scope` | yes | **G4-04** tie-break |
| Dispute first assignment | only acknowledged transfer moves duty; timer expiry → accepted alternate | partly | no `disputed` state on the lifecycle |
| Founder removed | `04` absence mode; AuthorityMatrix absence behavior; domain with no valid rule refuses new consequential work | yes | — |
| Cross-boundary repair | `03`:103 one coordinating case, explicit final criterion | yes — accepted subtasks cannot close a failed journey | — |
| Invoice/refund | `ConflictClaim` on entitlement identity; refund is its own OperationIntent | yes — cannot pay twice | — |
| Advertising correction | CAP-16/17 affected-audience correction proposal | yes | reach of the correction |

## Scenario: sustain and change operations at 1×/2×/4×

| Step | Governing contract | Adverse variation caught | Not specified |
|---|---|---|---|
| Demand scaling | CP1 concurrency; revision requires measured evidence | yes — no silent scale-up | actual provider concurrency ceiling (b) |
| Pressure | `07` §6 max-of-dimensions | yes | — |
| Procurement | CAP-24 incl. minimums, renewals, termination, replacement | yes | — |
| Pricing | CAP-18 `PriceProposal` | yes — a proposal is not a sale | — |
| Hiring/contractor onboarding | CAP-26; `CandidateAssessment.candidate_burden` required; contestable decision | yes | — |
| Departure | `human.departure.request`; descendants revoked; duties transfer on acknowledgment | yes | — |
| Professional minimums | `07` §7 Bench $399/$599 as eligibility-limited reference | yes — explicitly not a quote | jurisdiction quote (b) |
| Repair/coordination/burden count | CAP-35 1×/2×/4×; `Economics.owner_minutes` required | partly | **G4-03**; S1's semantic-maintenance labor unestimated — symmetric with S0's, so fair |

**Competent losing venture:** representable — `06` §105 removes any mandatory positive revenue for an endorsed subsidy, `03`:79 keeps negative contribution visible, CAP-39 gives `closed-with-residuals` an actual custodian, funding and review date; subsidy is a values decision, not an optimization output.

**Profitable venture shifting work outward:** instrumented but defeasible — `Economics.external_burden_observations` is a required payload field yet is an array that validates empty, because `criterion.Economics.validated.v1` checks only `/payload/allocation_rule` (**G4-03**). `CandidateAssessment.candidate_burden`, also required, is the better-built half. So applicant and contractor burden is captured; customer burden can be recorded as `[]` and still pass.

**Not checked:** full `run_negative_fixtures.py` execution (13 fixtures × full validator ≈ 25 min) — I confirmed the 13 files exist and that the runner refuses a zero-fixture pass, but did not observe 13 rejections. Dimensions 1, 2, 5–9, 11–12 (other reviewers). Specification files `01/02/05/11/12` read only where my four dimensions cited them. `D-company-human.md` read only for finding structure. Any runtime, provider, account, isolation, restore or cost measurement — none exists and the package says so. Whether `07`/`08`'s admission-check UNKNOWNs (Postmark absolute endpoint, auth header name, idempotency contract) are closable. Actual accessibility and usability of the `04` surfaces. Whether S0's coordination labor would in fact dominate — deferred with S1's, symmetrically.
