# Handoff — outside review run (second model family), 2026-09-19

You are the orchestrator of this run (Astra model). Your subagents are other models. Your job is the outside point of view on a fully specified, never-built system: reason about it, challenge it, improve it, from every perspective a real company touches. Everything in the plan is open to you. After this run a new session (Astra) writes the final spec and builds it, so your output must be something that session can act on line by line.

## 1. Where the plan is

- Repo: https://github.com/Adam077K/agentvibe — branch `ceo-1-1789446032`, head `1182e9b`, on origin (pushed 2026-09-19). Local checkout: `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-1-1789446032`.
- Cut your own branch from `1182e9b`: `review/outside-2026-09-19`. Never commit to `ceo-1-1789446032` or `main`. Push your branch when you finish.
- The plan is frozen for you at that head. The only commits after `1800227` touch `docs/vision-system/state.json` and `history.jsonl` (orchestrator records); they are not review subjects.

Package root `docs/vision-system/`:

| Path | What it is |
|---|---|
| `README.md`, `state.json`, `history.jsonl` | Durable state; `next_actions` says where things stand |
| `planning/HANDOFF-2026-09-15-after-r8.md` | Last planning handoff: owed items, founder packet, rules learned |
| `planning/PLANNING-REPORT.md` | What was decided and why; disposition of every review round |
| `planning/00-executive-guide.md`, `01-understand.md`, `02-architecture-selection.md` | Purpose, constraints, architecture choice |
| `planning/specification/01..12-*.md` | The twelve specification chapters: the contract |
| `planning/specification/contracts/` | Machine contracts; `validate_contracts.py`; fixtures (121 adverse, 82 benign); MANIFEST |
| `planning/F2/` | Selection records, repair packets, decision packets (`05-selection-record.md` is the layer design) |
| `planning/reviews/` | 35 archived reviews, verbatim; never edit |
| `planning/site/explorer/data/README.md` | Schema of a generated projection of the whole package (28 JSON files: records 189, predicates 2,398, commands 105, capabilities 46, stages 12, decisions AD-001..022, founder questions Q-001..022, risks 17, attacks 33, coverage 643 answered source questions, 340 chapter sections). Use as your index; do not edit |
| `registers/` | decisions, open-questions, risks, contradictions, review-findings, claims — orchestrator-owned; do not edit |
| `research/` | L01..L04 and `research/F2/`: the sourced evidence the decisions cite |

Published views, read-only, for orientation: plan page https://claude.ai/artifact/6BjTiqfy1oimews6A3JndL ; explorer https://claude.ai/artifact/Ufucbixckde8yhiLf3JDTZ (every id clickable).

## 2. Facts to hold while reviewing

- No runtime exists. Every "closed", "answered" or "complete" is specified behaviour checked offline against written contracts, not a passing test.
- One model family (Claude) produced and reviewed everything. You are the second family; that is the point of this run. State the model family on every finding.
- Validator: `CONTRACTS_FIXTURE_RUN=1 python3 planning/specification/contracts/validate_contracts.py` is the light mode (~30 s, 305,513 checks at head). The full split suite must run on a frozen tree and takes over an hour; run it once at most, at the end.
- Build is on founder hold. You do not build, prototype, or write source of the new system. You do not fix the plan; you propose repairs with exact locations.
- Architecture S1.1: nine components C01–C09; five authority layers (L1 consequence class, L2 declared procedure, L3 typed standing interest, L4 ExistenceJustification, L5 standing accountability); twelve build stages B00–B11; planned stack Node/TypeScript + PostgreSQL; execution profiles N-CLAUDE-SUPPLIED/v1, N-CLAUDE-MEDIATED/v1, N-CODEX-SUPPLIED/v1; seven adapters IC-SEARCH (Brave), IC-MAIL-IN (Fastmail JMAP), IC-MAIL-OUT (Postmark), IC-PUBLIC (Cloudflare Workers), IC-PAY (Stripe), IC-BOOKS (hledger), IC-HUMAN (portal).
- Decisions the founder wants challenged hardest: AD-002 and AD-020 (no persistent agent roster; "specialized knowledge" refused as a reason to create a worker, on the 162-roles / 2,410-questions persona evidence, with the ChatDev counter-ablation carried); AD-015/016 (consequence class as the top routing axis, computed from records the actor cannot author); AD-017/018 (loader delivers and records the read set; acceptance criteria frozen before production); AD-021/022 (standing holders and reservations).
- Open founder decisions: recommend, do not decide. Lift the hold for B01; ratify the stack and where code lives; edge predicates as derived artifact; runner copies fixture bodies; a CapabilityId/CheckerId vocabulary; who staffs the four layer-5 holders and the absent-holder fallback (F6AA-01/02); Q-022 account entitlement on the one-concurrent-job pin; whether the six existence reasons are a closed list (TC-35).

## 3. How to run it

- **Phase 0 (you, alone).** Read `README.md`, `state.json`, the r8 handoff, `PLANNING-REPORT.md`, `00-executive-guide.md`, `02-architecture-selection.md` §3, the explorer data README. Write a one-page map of the system in your own words before dispatching anyone; if you cannot, that is finding #1.
- **Phase 1 (subagents, parallel, different models where possible, blind to each other).** One perspective per subagent; each reads the whole specification plus the chapters most relevant to it and returns findings in the §5 shape. Perspectives, all of them:
  founder who must live with this daily · CFO/treasury · general counsel and regulator · accountant and auditor (IC-BOOKS, close, evidence) · security engineer and red team (AC01–AC33, adapters, execution profiles, credential and egress paths) · fraud and abuse adversary (customer, supplier, insider) · SRE/operator on call (C08 recovery, continuity, backups, the one-concurrent-job pin) · distributed-systems engineer (C04 release ordering, transactional authority, idempotency, first-send semantics) · database engineer (records, lifecycles, 2,398 predicates, retention and deletion propagation in Postgres) · backend engineer who builds B01 next week (buildability, over/under-specification, stage order and completion evidence) · product manager and UX designer (C09 operator surfaces, decision packets, founder load, ParticipationPlan Q-010) · the customer, the supplier, the hired professional (C07, grievances, redress) · HR and employment law (human performers, StandingHolder, compensation Q-006) · privacy and data rights (C05 lineage, deletion, CAP-22) · ML researcher (persona evidence behind AD-020, model-as-checker calibration, acceptance strength by class, one-family review) · Claude and Codex operators (are the pinned launch flags real and sufficient; what the profiles cannot guarantee) · insurer and successor/estate (Q-012, CAP-41, CAP-39 wind-down) · small-business owner with no engineering background (company engine or engineering project?) · economist (unit cost per case, provider capacity, cost to run idle) · philosopher of accountability (nondelegable responsibilities in 01-understand; CAP-44 truthful account).
- **Phase 2 (verification, different model from the finder).** Every HIGH or BLOCKER finding is re-derived against the cited section by a fresh subagent that sees only the finding and the criteria, not the finder's reasoning. Drop or downgrade what does not survive. Keep finder and verifier model names on the record.
- **Phase 3 (you).** Synthesize and rank. Resolve nothing by preference; where perspectives disagree, carry both with the evidence.

## 4. Questions every perspective answers

a. What is wrong, contradictory, or unstated from where you stand? Cite chapter and section id (explorer ids look like `spec/05-work-agents-skills / 4-temporary-workers-model-choice-and-bounded-reasoning`) or record/predicate id.
b. What is over-specified and should be cut before build; what is under-specified and blocks B01–B03?
c. What would you change, exactly: replacement sentence, record field, predicate, or stage.
d. The smallest system that still honours 01-understand (a person directs a whole company without supervising every step): which of the 46 capabilities and nine components the first real case needs, and which can be absent at first release.
e. Is the no-roster decision right? If a founder wants to "vibe startup" (talk to a team, get a company's work done), where in this design does that live, and what would you add or reopen? AD-020's own reopen trigger is U-8 profile convergence.
f. What fails first when it runs, and what evidence would show it?
g. What does a month cost with one case a day: provider calls, human time, money?

## 5. Finding shape (JSON lines, one per finding)

```
{"id":"F7-<perspective>-<nn>","perspective":"…","severity":"BLOCKER|HIGH|MEDIUM|LOW|IMPROVEMENT","kind":"contradiction|gap|overreach|feasibility|cost|risk|improvement|question","location":["<file>#<section-id>" or "<record-or-predicate-id>"],"claim":"one sentence","evidence":"package or outside support; measured vs inferred stated","proposed_repair":"exact text or structural change","reversibility":"…","finder_model":"…","verifier_model":"…","verdict":"CONFIRMED|PLAUSIBLE|DROPPED"}
```

## 6. Deliverables (commit on your branch; nothing else changes)

1. `docs/vision-system/planning/reviews/F2-07-outside-review.md`:
   1. Verdict on buildability in one paragraph, and the one thing you would change if you could change only one.
   2. Top ten challenges, ranked, each with finding id and repair.
   3. Per-perspective sections (every perspective above; "no findings" is valid only with the sections read listed).
   4. The minimum first-release system (answer 4d): components, capabilities, records, stages.
   5. Recommendation on each open founder decision in §2, with the reason.
   6. Final-spec change list: every CONFIRMED repair as a numbered instruction the build session can apply, ordered by chapter.
   7. What you could not check and why; what remains one-family-only after this run.
2. `docs/vision-system/planning/reviews/F2-07-outside-findings.jsonl`: all findings in the §5 shape, DROPPED ones included.
3. `docs/08-agents_work/sessions/2026-09-19-codex-outside-review.md`, ten lines or fewer, models used per phase.

## 7. Rules

- Read-only on everything that exists. New files only at the three paths above. Do not edit registers, archived reviews, `state.json`, the explorer data, or any chapter. No scripts that write into the package. Push only your own branch.
- Cite, do not paraphrase from memory. Separate what the package states from what you infer. Do not restate the plan; the founder has it.
- No subagent reads another subagent's output before writing its own.
- Do not soften: a blocker is a blocker. Do not inflate: an improvement is an improvement.
- If the package is too large for your budget, say which chapters each subagent read and did not; unread is not "no finding".
- Final message: verdict, count of findings by severity, the paths of the three files, your branch name and head commit.

## 8. What happens after this run (for context, not for you to do)

Founder answers the packet in §2 → a final-spec session applies your CONFIRMED repairs plus the owed items in the r8 handoff → full suite on a frozen tree → both pages republished → hold lifted for B01 only → build in a new session.
