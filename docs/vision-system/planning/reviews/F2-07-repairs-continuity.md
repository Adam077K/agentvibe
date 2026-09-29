# F2-07 repairs — continuity lane (2026-09-29)

Branch `vision/f7-r-continuity` from `51fc662`. Design frozen at S1.1; named items only. Documents and contracts only — no implementation.

| Finding | Disposition | Note |
|---|---|---|
| F7-insurer-successor-01 | REPAIRED | criterion.ContinuityArrangement.accepted/active.v1 gain nonempty (alternate, trigger_predicates, reservations, channels, joint_failure_roots) and related_phases (primary+alternate accepted, reservation held/partly_consumed, channel active, exercise judgment accepted, no longer optional) OUTSIDE the bootstrap any; 03 CAP-41 paragraph states the six conditions. Independence of appointment and per-root/duty-window exercise coverage are carried by the accepted_for judgment, stated as such. Q-012 stays open. |
| F7-insurer-successor-02 | REPAIRED | 03 CAP-39/41 paragraph defines per-residual coverage over existing records (Obligation.custodian_ref accepted, review owner/date via residual_review_at <= latest_start_at, held Reservation via operation_or_work_ref); criterion.ClosurePlan.validated.v1 structurally binds non-empty duty_inventory, validated funding_ref, accepted grievance_custodian. Per-residual comparison is judgment-carried; no new record or field. |
| F7-orchestrator-01 | REPAIRED | 05 §11: both >90% and derivation-equals-floor observations trigger a simplification review, never automatic removal; removal needs a declared replacement-equivalence test over every reached gate and protected boundary; residual stratum keeps derivation. |
| F7-economist-02 | REPAIRED | 07 §6 MD-08 synced to Q-021 (class shares unchanged, lapse at 20% remaining, DESIGN PROPOSAL placeholders); minimum, entitlement (Q-022) and performer capacity remain UNKNOWN; no throughput claim. |
| F7-philosopher-01 | PARTIAL | 05 §13 MD-04 sentence and the five-packets heading carry the Q-019 answer, distinguishing answered policy from unperformed assessment and CAP-43 owner from assessor. Chapter header line 3 not edited. |
| F7-backend-03 | REPAIRED | 08 §7 B01 row: synthetic receipt/proof fixtures, no durability claim; real witness loss/ack/crash acceptance is B02. implementation-graph.json not edited. |

## Founder decisions of 2026-09-29

Recorded in `docs/vision-system/state.json` as `founder_decisions_2026_09_29`; `founder_hold.lifted` stays false. Register marking: only `AD-015` (decisions.json) matched any of the four patterns, and only by mentioning TC-35 in passing; it is the layer-contract decision, not the TC-35 decision, so it was NOT re-statused. No register entry for edge predicates, fixture snapshots or CapabilityId exists in `registers/*.json`.
