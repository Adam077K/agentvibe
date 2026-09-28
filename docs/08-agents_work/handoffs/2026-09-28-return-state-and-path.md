# 2026-09-28 — Return from break: where we stand, and the path to build

Author: orchestrator (ceo-1-1790613500). Sources: four read-only investigations (git forensics, session
transcripts 09-12→09-27, planning package on `review/outside-2026-09-19`, Codex outside review F2-07).

## 1. Where everything lives
| Thing | Location | State |
|---|---|---|
| Harness (agents, gate, ledger, warroom+Codex engine) | `origin/main` `c9f220a` (PR #134, 2026-09-11) | Main has not moved since 09-11 |
| Company Engine plan (S1.1), 815 KB spec, 72 MB package | `origin/review/outside-2026-09-19` `51fc662` (= `ceo-1-1789446032` + review) | **Never merged to main**; `planning_accepted:false`, founder build hold in force |
| Codex outside review | same branch, `docs/vision-system/planning/reviews/F2-07-outside-review.md` + `-findings.jsonl` | Verdict SCOPED. 1 BLOCKER · 7 HIGH · 20 MED · 9 dropped. **Untriaged** |
| Superseded plan drafts | PR #131 `docs/final-plan` (open), #130, #133 | Superseded by vision-system; #131 should be closed |
| Salvaged memory edit | `salvage/decisions-beeond-2026-08-31` `3e32e44` (pushed) | Was uncommitted in the main checkout; only copy of the "2026-08-31 Phase 9 executed against beeond" decision. Reconcile against origin/main's divergent eviction before landing |

**Nothing was lost.** All sessions of 09-12→09-19 committed before stopping; what was lost was attention.
One session (ceo-2-1789805790, 09-19) opened with no task and did nothing.

## 2. Why the process was slow (measured)
- The **design settled once** (S1.1, F2 selection 09-14). Everything after was verification of verification:
  ~34 review/recheck documents in 8 days; G-02 needed 5 rechecks, F2-06 needed 6, each finding the previous
  repair partially closed. Fixture count grew 267K → 305K checks.
- **Exit criteria were documents judging documents.** No stage exited on running code, so there was no floor
  to stop at — every review could find another gap in 815 KB of prose.
- Infra drag: full validator OOM-killed 4× in one day; register/runner collisions twice; one blind 4-hour run.
- The plan was rewritten ~4 times since 09-03 (#130 rethink → #131 final → #133 final-v2 → vision-system).
- The Codex review's one recommendation says the same: gate each scope on **an executable end-to-end case**,
  not another document loop ("another document-only loop if not tied to a runnable scoped case").

## 3. Proposed operating rules from here (founder to ratify)
1. **The design is frozen at S1.1.** No new architecture rounds. Changes only via a finding a running test exposes.
2. **Exit = executable.** Every construction batch exits on its own tests passing + one review pass. No recheck
   chains: a review's P1s are fixed and re-tested once; everything else goes to the batch backlog.
3. **Spec defects are fixed where code touches them**, not in advance. The 68 unspecified criteria and 20 MEDIUM
   findings are resolved inside the batch that implements the affected record.
4. **One pre-build repair pass only** for the 8 time-bound findings (§5), one lane each, one verifier, done.
5. **Validator runs split-suite by default**; never the monolithic run.

## 4. What only the founder can decide (to start building)
| # | Decision | Recommendation |
|---|---|---|
| D1 | Lift the build hold for B01–B04 and B08 (no real accounts/customers involved) | Yes, conditional on D2–D4 |
| D2 | Ratify Node/TypeScript + PostgreSQL, code in a `system/` workspace | Yes (review: "reasonable defaults") |
| D3 | Accept reviewer defaults: derived edge predicates (one source + generator + independent semantic cases); self-contained fixture snapshots; CapabilityId/CheckerId from existing catalogs; TC-35 six reasons closed-but-amendable | Yes to all four |
| D4 | Early S0-vs-S1 checkpoint: after B01+B04, run one internal research-to-decision case against S0; continue or rescope on the measured result | Yes — the review's #1 |
| D5 | Q-022: is the one-concurrent-job pin a provider limit or your policy? | Keep the pin until you check your plan |
| D6 | Adopt the operating rules in §3 | Yes |

**Not needed to start construction:** Q-002…Q-014 (legal entity, professionals, successor, grievance recipients,
funded remedy, infra spend, root identity, layer-5 holders). These gate B05 adapters, B06 human ops and B10
operational admission only. Answer them before those batches.

## 5. What agents do autonomously (no founder input)
- **Pre-build repair pass** (one lane each, one verifier): F7-database-01 (BLOCKER, DeletionScope determined
  criterion); F7-database-02 + F7-privacy-01; F7-distributed-01 (SendClaim/EffectIdentity atomic CAS);
  F7-accountant-01 (JournalBatch.balanced); F7-cfo-01 (refund completion); F7-orchestrator-01 (rare
  high-consequence tail); F7-insurer-successor-01/02. Plus pure-contradiction doc syncs: F7-economist-02,
  F7-philosopher-01, F7-backend-03.
- **Consolidate:** PR the planning package to main (docs only) so one branch holds the truth; close PR #131.
- **Housekeeping:** remove 30 stale worktrees (all verified landed; needs founder to run it); fix the warroom
  Codex-pane self-prohibition; disposition the two expiring claims and the silent ledger canary.

## 6. The build run (Opus 5.5, one orchestrated run)
Batch order from spec §08-7, restricted to what needs no real-world accounts:
B00 freeze → B01 kernel (schemas, identities, reducers, SERIALIZABLE Pg, outbox) → B02 authority witness/recovery
→ B03 identity/containment → B04 company work context/evidence → **S0-vs-S1 checkpoint** → B08 protected improvement.
B05 adapters, B06 human/public ops, B07 ops migration, B09 rehearsals and B10 admission follow once the §4 Q-items
are answered. Mechanism: one committed workflow in `.claude/workflows/` — a builder lane per batch in its own
worktree, exit on tests, one reviewer pass, the binding gate per PR. The orchestrator keeps state in one run-ledger file.
