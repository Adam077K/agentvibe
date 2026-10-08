# 15 — Execution plan: from build session 4 to P0–P5 complete

*Framer (Opus 5.5), 2026-10-08, for orchestrator ceo-1. Lenses: engineering, product. This file sequences the
remaining jobs of [14 §6](14-BUILD-PLAN.md#6-the-job-register--every-phase-in-jobs-of-30-turns). It does not change
any job, acceptance test or gate. Where it departs from 14, it says so and names who decides. It uses no dates, only
waves and gates (founder direction 7).*

**Status basis.** The analyst sweep of `main`'s merge history (2026-10-08), [HANDOFF-BUILD-4](HANDOFF-BUILD-4.md) §1 and
[HANDOFF-BUILD-3](HANDOFF-BUILD-3.md) §1. `build/jobs.yml` says `not_started` for every row, so it is stale (W1 fixes
that). **Unverified:** the merged list was not re-derived from `git log` in this pass.

---

## 0. Recommendation and reversibility, first

**Recommendation.** Run 11 waves through one orchestrator with **at most 4 jobs in flight**. Use three check
tiers instead of the red-team stage, and auto-merge on a reviewer-recorded verdict plus green required checks.

**Reversibility.**
- **Cheap to undo:** the tiers, the models, the wave order and the cap. They are conventions held in briefs, so
  changing them costs one handoff edit.
- **Not cheap to undo:** auto-merge. A weak verdict merged automatically is already on `main` when anyone notices,
  which is the ADR-001 argument quoted in `qa-tier-floor.yml`. For that reason auto-merge is **off for kernel PRs
  until #144 lands** and **off for irreversible-tier paths, permanently**. Both enablers go to the founder (§3).

**Options considered for the review regime.**

| Option | Wins if | Verdict |
|---|---|---|
| A. Keep the HANDOFF-3 §4 pipeline: tests → red-team of the tests → implement → review | Mutation-surviving tests stay common after the test writer self-checks | Rejected by founder direction 1 |
| **B. Tiered self-checks:** the test writer proves its tests fail against mutants; the reviewer gets a scoped brief; depth follows risk | The mutant floor catches what red-team r1 caught on B1-09a (7 wrong implementations passing, HANDOFF-3 §2) | **Recommended** |
| C. One uniform Opus review for every PR | Most PRs are deep | Rejected: it over-reviews light work (founder direction 1, 6) |

**What would make B lose.** Option B is exposed if a deep-tier PR merges and a defect turns up later that one of
its own registered mutants would have caught. That case is a process failure, not a code bug. **Two such cases
inside one phase re-open option A for deep jobs only.** This is the falsifiable tripwire (§4).

---

## 1. Operating model

### 1.1 Roles × models (founder direction 2)

| Role | Light | Standard | Deep | Notes |
|---|---|---|---|---|
| Test writer (freezes the done-tests and kills the mutants) | — (the implementer writes tests) | Sonnet 5.5 | **Opus 5.5** | Always a different agent from the implementer (B0-17a.yml re-freeze practice) |
| Implementer | Sonnet 5.5 (Haiku 4.5 for mechanical jobs) | Sonnet 5.5 | Sonnet 5.5 | Escalates to Opus after two failures on the same job (HANDOFF-3 §4) |
| Shipper: update-branch, offline re-verify, PR | Haiku 4.5 | Sonnet 5.5 | Sonnet 5.5 | Follows PROTOCOL-SHIP and never records a verdict |
| Reviewer, which also records the verdict | Sonnet 5.5 | **Opus 5.5** | **Opus 5.5** | The reviewer records, never the builder (HANDOFF-3 §4) |
| Merge clerk: CI parsing, merge-train order, conflict-free update-branch, jobs.yml status | Haiku 4.5 | Haiku 4.5 | Haiku 4.5 | Stops on any conflict or `reason=absent` |
| Design judgement (threat model, ruling drafts) | — | — | Opus 5.5 | Only when a brief hits an unruled question |

**Haiku caveat (unverified, enabler).** `scripts/prompt-standard.test.mjs` pins agent frontmatter to
`[claude-opus-5-5, claude-sonnet-5-5]` (PS-MODEL-ENUM, #165). Two routes to Haiku:
- a dispatch-time `model` override on an existing engine. Whether the harness honours that has not been verified.
- a Haiku clerk agent file. That needs PS-MODEL-ENUM widened, which is an irreversible-tier edit.

Until one of these is confirmed, clerk work runs on Sonnet.

### 1.2 Check-depth tiers

| Tier | Criteria (any one is enough; never downgrade, per the engineering lens) |
|---|---|
| **Deep** | The job decides **what workers may do**: launcher, leases, runner admission, policy compiler, Constitution, release authority, kill path, isolation, inference proxy, tool-lease policy, label rules. Or it touches **money**: budget, spend caps, Allocator, Treasury, Books, effectors, gateway, broker, capital, pay. Or it touches **security**: secrets, presence/approvals, verdict or `VERDICT:` parsers, acceptance and coverage, inbound quarantine, honeytokens. **Or** it is `PCB` in 14 §6 |
| **Standard** | Any other executable code, including `mission-control/server/**` (classifier `full`), Userland features, measurement studies, and venture tooling |
| **Light** | Register and status upkeep, docs, census, `mission-control/client/**` views (classifier `lite`), batches of LOW follow-ups with no behaviour change, and briefs to lawyers or accountants |

**Light is not ungated.** It still gets a review and the required checks. The engineering lens forbids "skipping the
gate because the diff looks small".

### 1.3 Pipeline per tier

| Step | Light | Standard | Deep |
|---|---|---|---|
| 1. Tests | The implementer writes them first, in the same PR | The implementer writes them first; the PR body lists **≥3 named mutants**, each killed | The **Opus test writer** freezes `build/done-tests/<id>.yml` with sha256 per file, red against a stub, and **≥10 named mutants, each killed**, covering the failure classes in §4. This mirrors B1-12b.yml's 24-mutant practice |
| 2. Implement | Sonnet or Haiku | Sonnet | Sonnet, in a different worktree from the test writer |
| 3. Self-check | `npm run check` tally | Tally plus the touched package with `-race` | Tally, `-race -count=50` on concurrent packages, `check-done-tests.mjs`, `avk-boundary` line count |
| 4. Review | Sonnet, correctness lens | Opus, correctness + security lenses | Opus, correctness + security + adversarial lenses, plus the job's threat model or rulings file |
| 5. Ship bar | No HIGH | No HIGH, no MED-security | No HIGH, no MED-security, and the reviewer **re-applies 2 of the registered mutants itself** and sees them fail |
| 6. Merge | Auto | Auto | Auto (non-kernel). Kernel: auto only after #144; until then the orchestrator merges by hand on the reviewer's test re-run |
| Cross-family | — | — | One **batched Codex read per gate** over that gate's deep PRs (DR-11; G1(a) needs the other family). This is a review with the same scoped brief, not a red team |

Ship bar source: HANDOFF-3 §4. LOW findings and fail-safe MED findings become follow-ups and ride in the next PR
that touches the same package (§1.6).

### 1.4 Auto-merge pipeline (founder direction 3)

1. The **shipper** pushes and opens the PR with a `risk:` label. It does not record a verdict (PROTOCOL-SHIP §4).
2. The **reviewer** is dispatched with the scoped brief (§1.6) and returns SHIP, or FIX with findings.
3. On SHIP, at the exact reviewed head, the reviewer records the verdict in the order from HANDOFF-4 §2:
   `verdict.mjs record` → set the session file's `qa_verdict: PASS` → `git add .qa <session>` → commit →
   `verdict.mjs check` reports `ok:true` → push.
4. The **merge clerk** runs `gh pr merge <n> --auto --merge --match-head-commit <reviewed sha>`. Whether `--auto`
   accepts `--match-head-commit` is **unverified**; if it does not, the clerk merges by hand once checks are green.
5. Required checks: `Deterministic checks` and `Verify QA Lead PASS` (HANDOFF-3 §1). Kernel Go tests and
   `avk-boundary` join them once #144 lands.
6. **Merge-train ordering.** Within a wave, merge PRs with disjoint file sets first, in any order. Updating the
   branch of a disjoint PR leaves its diff, and so its verdict subject, unchanged.
   - PRs that overlap on a file (as #170 and #171 did on `lease.go`) merge **in dependency order, one at a time**.
   - After each overlapping merge, the next PR is updated and its **reviewer reviews only the delta and
     re-records** (HANDOFF-3 §1 "merge gotcha").
   - The clerk computes overlap from `gh pr diff --name-only` before the wave's first merge and posts the order as
     one line.
7. **Never auto-merged:** paths the classifier tiers `irreversible` (`.github/workflows/**`, `.claude/agents/**`,
   `.claude/settings.json`, `.claude/hooks/**`, `qa-tier-floor.yml`, `scripts/lib/**` and the others in that file).
   These need founder sign-off.

**Founder one-time enablers (§3, F-EN):**
- allow `Bash(node scripts/verdict.mjs *)` and the session-file `qa_verdict` edit (HANDOFF-4 §2);
- `gh repo edit --enable-auto-merge`, because auto-merge is disabled today (HANDOFF-3 §1, §7);
- allow `Bash(gh pr merge *)` (unverified whether it is needed);
- allow `Bash(git worktree add *)`, `Bash(bun install*)`, `Bash(bun test*)` and writes under `/private/tmp/claude-501/`
  (HANDOFF-3 §2, §7).

### 1.5 Parallelism cap (founder direction 5)

**At most 4 jobs in flight, and at most 2 of them in `kernel/`, with never two in the same Go package.** Each job is a
builder/reviewer sequence, so at most about 5 agents run at once, counting the clerk.

Rationale:
1. **Orchestrator context.** Each job returns about 5 times (test, implement, ship, review, merge), each ≤150 words.
   Four jobs × 5 returns is about 20 returns per wave cycle. That is what one context can track without re-reading
   diffs. Context re-reading is 95.2% of all input tokens (TOKEN-EFFICIENCY §1), so orchestrator turns are the cost.
2. **The merge train serialises anyway.** Overlapping PRs force re-records, so a fifth PR mostly waits.
3. **14 §5** caps attended sessions at ≤8 across both families before the Handover. Four pairs fit under that and
   leave room for V0 and the founder.
4. **Kernel line arithmetic, run before every kernel dispatch:**
   - `go -C kernel run ./cmd/avk-boundary` gives N of 15,000. The cap is 15,000 per the DR-KERNEL-BUDGET amendment
     (founder); G1(d)'s 11,000 is stale.
   - Headroom H = 15,000 − N − 200 (reserve). The sum of the line allowances of kernel jobs in flight must be ≤ H.
   - Allowance estimate: **about 450 non-test lines per K-lane job.** This is derived, not measured per job:
     10,518 → 12,653 across B1-08d/08h/14a/04r, then about 1,150 across B1-09a, LC-1 and LC-2.
   - Today H ≈ 1,000, which fits two jobs. **Remaining K/PCB-resident jobs come to about 14 × 450 ≈ 6,300 lines**
     (unverified which rows land in `kernel/`). The budget therefore binds during W3; see KB in §3.

### 1.6 Knowledge and context rules (founder direction 4)

**Where durable knowledge lives.** Each kind of knowledge has exactly one home.

| Knowledge | Home | Writer |
|---|---|---|
| Job status | `build/jobs.yml` `status:` is the **single status source** | Merge clerk, after each merge |
| Frozen tests, mutants, per-job rulings | `build/done-tests/<id>.yml` (tracked; checked by `check-done-tests.mjs`) | Test writer; the orchestrator adds rulings with attribution (as R1–R7 in B1-04r.yml) |
| Cross-job rulings | `.claude/memory/DECISIONS.md` (append-only; byte cap binds) | Orchestrator |
| Founder rulings and threat models | `docs/vision-v3/_process/DR-*.md` | Orchestrator |
| Session state | `docs/vision-v3/HANDOFF-BUILD-N.md`, one page, superseding the last one's §1–2 | Orchestrator, at each wave close |
| Per-job record | `docs/08-agents_work/sessions/…` (the documentation gate) | Implementer; the reviewer flips `qa_verdict` |

`_process/` is partly gitignored (HANDOFF-3 §4). **A ruling that lives only there is lost.** Copy it into a tracked
done-test file or into DECISIONS.md.

**Brief assembly: dispatch by reference** (TOKEN-EFFICIENCY §7.3). Every brief carries:
- job id, role, model, tier;
- worktree `$(git rev-parse --show-toplevel)/.worktrees/<slug>` and branch (HANDOFF-3 worktree rule);
- **write scope** as path globs;
- a **read list of paths and anchors only**: the 14 §6 row, `done-tests/<id>.yml`, the canon section that row cites,
  and any `DR-*` file;
- one lens id from `.claude/lenses.yml` (engineering for K/A/G/X/C/R lanes; product for S/V; design for client views)
  and at most 2–3 skills;
- the kernel line allowance, where one applies;
- the return contract, ≤150 words.

Never paste a file body over about 8,000 characters. Handoffs stay ≤500 tokens (CLAUDE.md).

**Reviewer context.** The reviewer gets the base..head sha, the acceptance text, `done-tests/<id>.yml`, the rulings
and threat-model paths, the review lenses and the ship bar. It is **not** given the PR body narrative, the
implementer's session file or the implementer's return. Those are the producer's self-assessment. The reviewer may
read the PR body's "deviations" list only after writing its findings.

**Keeping the orchestrator small.**
- It never reads diffs or code; it reads returns.
- CI logs go to the Haiku clerk, which returns pass/fail and the failing step's name.
- State lives in `jobs.yml` and the handoff, not in the conversation.
- **Each wave close ends the session:** write the handoff, then `/clear`. Long sessions can also be split at about
  120 turns. Splitting is the largest single lever: four 128-turn sessions re-read 60.6% less than one 512-turn
  session (TOKEN-EFFICIENCY §7.5).

**Batching (founder direction 6).**
- Follow-ups ride in the next PR that touches the same package.
- `a`/`b` split rows share a branch and land as **one PR** when the combined diff is ≤800 lines (parameter).
  Otherwise they land as two.
- Light jobs that touch disjoint docs or register files are bundled into one PR.

---

## 2. The job sequence, P0 → P5, in 11 waves

**Notation.**
- `[L]`, `[S]`, `[D]` mark the tier; models follow §1.1.
- `✂` marks a row of ≥26 turns that must be **split at admission** (14 §1 rule 3; enforced by B0-13's lint). This
  file does not invent the split content.
- `⚑X` marks a founder gate from §3.
- **Pull-forward rule:** when a slot idles, take the next job whose dependencies are met, in this priority order:
  ★ critical path > gate evidence > V/V0 > the reverse of 14 §5's slip order.

### W1 — Clean floor and host-free P1. No founder input needed.

Dependencies: all met (B1-09a, B1-14a, B1-18, B0-03 and B0-19 are merged).

| PR | Jobs | Tier | Lines |
|---|---|---|---|
| W1-a | **REG-1**: `jobs.yml` status sync plus a mapping of split and extra IDs (B0-17a/b, B1-04r, B1-08d/h, B1-12a/b, LC-1/2, HG-1, J1–J4) | [L] Haiku | — |
| W1-b | **B1-04f**: lease follow-ups. Receive accepts any covering token ("do this one first", HANDOFF-3 §6); LC-1 R5 `!HasPrefix`; the `TestRaceIsDecidedInStorage` flake (4 of 40) | [D] | ~100 |
| W1-c | **B1-09b** ★ plus the B1-09a follow-ups: surviving freeze/5 s mutants, the ESRCH wedge, the ACL `ls` stderr limit | [D] | ~450 |
| W1-d | **B1-14b** ★ plus the B1-14a follow-ups: mid-pattern `*`, contract binds the rule set, loader sets Admission, an untagged test | [D] | ~450 |
| W1-e | **B1-27** plus the B1-18 follow-ups: correction event, budget-stream access control. This is Userland TS | [D] | 0 kernel |
| W1-f | **B0-14** census, read-only, scanner first | [L] Haiku build, Sonnet review | — |
| W1-g | **B0-04** context profile | [S] | unverified whether it lands in `kernel/` |
| W1-h | **MC-FU**: mission-control follow-ups (HANDOFF-4 §4) — `missions.get` called twice, the third `isAlive`, killed-runner cards left `working`, the serial wait behind a Decision | [S] | — |

**Parallelism.** W1-b and W1-c run first. W1-d starts once W1-b merges, because only 2 kernel jobs may run at once.
W1-e, W1-f and W1-g fill the remaining slots, and W1-a, W1-h trail.

**Checkpoint C1.**
- All PRs merged on green.
- `check-done-tests.mjs` passes.
- `avk-boundary` ≤ 15,000, with H reported.
- `jobs.yml` matches merge history.

### W2 — G0 evidence

Dependencies: W1 merged.

**Jobs.**
- **B0-00** [S]. It needs the founder to confirm seats and read the plan usage pages (14 §9).
- **B0-10✂** [S]. Opus writes the pre-registration.
- **B0-11✂** [S]. It needs 10 founder labels plus V0 missions.
- **B0-08** [S] ⚑D1.
- **B0-09✂** [S] ⚑D1.
- **B0-18** [S], after B0-08 through B0-11 have launched.
- **B0-05, B0-06, B0-07 spike runs** [S] ⚑HOST.
- **B0-21** [S] ⚑ the founder picks the V0 ventures.
- **B1-22** [S], after B0-14.
- **IRR batch** ⚑IRR, prepared by builders and held for founder sign-off: verdict hardening, the kernel tier floor,
  B0-15, and the revival of #144.

**Parallelism.** B0-10 and B0-00 can run at once with B1-22, while the IRR PRs are prepared.

**Gate G0** (14 §4): clauses (0), (a), (b), (c) and (d), and then the founder's review (⚑G0R).
- **(d) needs framing:** see §6.
- Evidence: the B0-00 table filed to [12](12-SPIKE-RESULTS.md); the signed `launcher_grant` record; filed results for
  B0-05, 06 and 07, or named fallbacks; a scorecard rendered from receipts (B0-12 is merged).

### W3 — P1 isolation and acceptance, plus host-free P2 preparation

Dependencies: ⚑HOST, B0-05/06/07 filed, B0-09 filed, ⚑KB.

**Jobs.**
- **B1-10** [D]
- **B1-11a+b** ★ [D], one PR
- **B1-13** [D], after B1-09b and B1-11
- **B1-16a+b** ★ [D], one PR
- **B1-17** [D]. It needs an observer OS user (⚑HOST, unverified)
- **B1-24** [D], after B0-18
- **B1-25** [D]
- **B1-15** [D] ⚑ Secure Enclave enrolment
- **B1-23** [S]
- Host-free preparation: **B2-05✂** [S], **B2-09✂** [S], **B2-08** [D], **B3-14✂** [D]. B3-14 is pulled forward
  because its dependencies (B1-14a/b) are met; it is policy's compensating check (§4).

**Parallelism.** At most 2 kernel jobs at a time, chosen from B1-11, B1-16, B1-13, B1-25 and B3-14, in ★ order.
B2-05, B2-09 and B1-23 fill the other slots.

**Checkpoint C3.**
- Q3 subset green (B1-12 is merged).
- The kill drill reaches p99 ≤5 s (target).
- The SP2 fixtures run nightly (G1(e)).
- Kernel N is reported against the KB ruling.

### W4 — P1 surfaces and Spine Night

Dependencies: B1-16 and B1-13 merged.

**Jobs.**
- **B1-19✂** [S]. It extends J1–J4, which already shipped.
- **B1-20** [S]
- **B1-21** [D], approvals bound to a hash
- The **Spine Night** run
- Preparation alongside: **B2-06** [S], **B2-07✂** [S], **B2-10✂** [D] (label rules are PCB), **B2-11** [S],
  **B2-12✂** [D] (tool-lease policy), **B2-28** ★ [S], **B2-29** ★ [S]. B2-28 and B2-29 follow B0-21 and B0-11.

**Gate G1**, clauses (a) through (e).
- Evidence: the unattended 03:00 Journal receipts, the Q3 subset, the kill drill, kernel lines ≤ the ruled budget,
  and the nightly SP2 runs.
- The batched Codex read of the P1 deep PRs.
- ⚑ The founder signs G1.

### W5 — P2 core

Dependencies: G1.

**Jobs.** **B2-01** ★ [S], **B2-02** [S], **B2-23✂** [S], **B2-04✂** [D], **B2-13a+b** ★ [D], **B2-18** ★ [D],
**B2-19** [S], **B2-24** [D] (pricing and Referee), **B2-16** [S], **B2-25** [D], **B2-26** [D].

**Parallelism.**
- B2-01, then B2-02, B2-23 and B2-04 in parallel.
- B2-13 alongside them, then B2-25 and B2-26 as one PR if ≤800 lines.

**Checkpoint C5.** Handover entry conditions 1–5 (14 §7) hold. ⚑ The founder signs Constitution v1 (14 §9 P2).

### W6 — Handover and the first imported venture

Dependencies: C5.

**Jobs.** **B2-03a+b** [S], **B2-14✂** [D], **B2-15✂** [S], **B2-27** [S], **B2-17** ★ [D], **B2-20✂** [S] ⚑F8 Probe
Mandate, **B2-21** ★ [S] ⚑ A2 Charter, **B2-22** [S].

**From B2-17 onward**, Userland jobs are launched by the Kernel (14 §7). This file's tiers become the seed of B1-16b's
coverage contract. The orchestrator pipeline remains only for PCB landings, which are founder-present.

**Gate G2**, clauses (a) through (e).

### W7 — P3 rails

Dependencies: G2. B3-01 through B3-05 may be pulled forward from W4 once ⚑F3 is done.

**Jobs.** **B3-01a+b** ★ [D] ⚑F3, **B3-02✂** ★ [D], **B3-03** ★ [D], **B3-05a+b** ★ [D], **B3-04✂** [D], **B3-06** [D],
**B3-07✂** [D], **B3-08✂** [D], **B3-13** [D], **B3-15** [L] ⚑F7/F9.

**Checkpoint C7.** Q1, Q2, Q3 and Q5 green, including the legitimate paired cases (G3(c)).

### W8 — P3 human surfaces, suites, and the first A3

**Jobs.** **B3-09** [S], **B3-10✂** [S], **B3-11✂** [D], **B3-12✂** [S], **B3-18** [S], **B3-19a+b** ★ [D],
**B3-20a+b** ★ [D]. Then **B3-16** ★ [S] ⚑D5 (the founder's launch), and **B3-17** [S] only if the founder names a
second venture.

**Gate G3**, clauses (a) through (e).
- It includes the four weekly kill drills, which are a calendar-bound clause (14 §1).
- The Codex batched read covers the P3 deep PRs.

### W9 — P4 measurement

**Jobs.** **B4-01✂** [D], **B4-02✂** [S], **B4-03** [S], **B4-04✂** [S], **B4-05✂** [S], **B4-06** [S], **B4-19✂** [D],
then **B4-11✂** [D] (after B4-19, per its own acceptance text), and **B4-12** [S].

**Checkpoint C9.** Q6 is green, and the Calibration Ledger v1 scores are rendered.

### W10 — P4 capability, governance and fleet

**Jobs.** **B4-07✂** [S], **B4-08** [S], **B4-09✂** [D], **B4-10** [S], **B4-13✂** [D], **B4-14** [S], **B4-15✂** [S],
**B4-16** [S], **B4-17✂** [S] ⚑ Fleet Charters, **B4-18✂** [S].

**Gate G4**, clauses (a) through (d). Four consecutive scorecards are calendar-bound.

### W11 — P5 scale

**Jobs.** **B5-01✂** [S], **B5-02✂** [D], **B5-03✂** [D] (pay), **B5-15** [D], **B5-04✂** [S], **B5-05** [S],
**B5-06✂** [S] ⚑D10, **B5-07✂** [D], **B5-08✂** [S], **B5-09** [S], **B5-10✂** [S], **B5-11** [D], **B5-12** [D],
**B5-13** [D], **B5-14** [S]. B5-14 needs ≥8 weeks at A3 (DR-29).

**Gate G5.**

**Coverage.** Every remaining row of 14 §6 appears once above. The P0 and P1 merged rows are excluded per the status
basis. B1-19, B1-20 and B1-21 are listed in full; the v0 surfaces that already shipped do not discharge them.

---

## 3. The founder-gated track

**D1, quoted from canon §9:** *"Standing launch permission for the Kernel's dispatcher — **Yes** (as recommended):
launcher-only, binaries pinned by digest, argv templates, forbidden flags, per-launch tool lease, isolation ≥ I2 if
headless, budget cap, fenced lease; 12 concurrent / 120 per hour (parameters); a Receipt per launch (DR-53)."*

The decision is taken. What may still be open is the **signed `launcher_grant` Constitution record** that G0(a)
requires. Whether it has been signed is unverified.

| ID | Founder action | Unblocks | Built meanwhile, so nothing idles |
|---|---|---|---|
| ⚑HOST | Per-venture macOS users, the Apple `container` setup, and a second user's `setup-token` (HANDOFF-4 §3; 14 §9 P0/P1) | The B0-05/06/07 runs → B1-10, B1-11, B1-13, B1-16, B1-17 → B1-19/20/21 full → G1 → all of P2 | W1; W2's non-host jobs; and W3's prep, B2-05, B2-08, B2-09 and B3-14 |
| ⚑D1 | Sign or confirm the `launcher_grant` record | G0(a), B0-08, B0-09, and so B0-18 and B1-24 | W1, B0-10, B0-00 |
| ⚑#144 | Approve the PR that makes CI run the Kernel Go tests and `avk-boundary` (irreversible: `.github/workflows/**`) | **Auto-merge for kernel PRs.** Until then the orchestrator merges kernel PRs by hand on the reviewer's re-run | All non-kernel work auto-merges |
| ⚑IRR-1 | Sign `verdict.mjs` hardening: empty-diff refusal, `--no-replace-objects`, submodule pins (HANDOFF-3 §3) | Trust in auto-merge. An empty diff currently hashes `e3b0c…`, which is a vacuous PASS subject | The PR is prepared in W2; merges continue under reviewer-recorded verdicts |
| ⚑IRR-2 | Sign a kernel tier-floor rule in `qa-tier-floor.yml`. `kernel/**` matches no rule and defaults to `lite` (HANDOFF-4 §3) | Labels that match the tier the work was reviewed at | Briefs assign `[D]` by hand (§1.2) |
| ⚑IRR-3 | Sign **B0-15** (agent bodies plus the lint predicate, one PR) | `schema-lint` at 0 warnings, and builders taught the right worktree command | Builders follow HANDOFF-3's worktree rule |
| ⚑KB | **Kernel budget for P1–P5.** About 1,000 lines of headroom against about 6,300 needed (§1.5). Options: raise to a measured figure; move overflow to Userland (14 §11 "overflow moves to Userland or is refused"); or refactor. Framer does not decide this | W3+ kernel jobs beyond the first two | Non-kernel jobs in every wave |
| ⚑G0R | Review the G0 pack | The formal G0 pass | P1 work already ran ahead of G0; it continues |
| ⚑EN | The enablers in §1.4, plus a decision on the Haiku route in §1.1 | Autonomous verdicts and auto-merge | The founder runs the one-line record (HANDOFF-4 §2) |
| ⚑later | F3 free-tier cloud accounts (B3-01a); Secure Enclave enrolment (B1-15); census sort and V0 picks (B0-21); 10 labels (B0-11); `enforce_admins`/CODEOWNERS (CLAUDE.md 2.7); Constitution v1 and the A2 Charter (W5/W6); F4, F8; Continuity Will; D5 (B3-16); F7/F9 (B3-15); Fleet Charters; D10; the A4 case (B5-14). All per 14 §9 | Named waves | Earlier waves |

**Ask order for the founder:** EN, then D1, then HOST, then #144, then IRR-1, IRR-2, IRR-3 in one sitting, then KB,
then G0R.

---

## 4. Risks of dropping the red-team stage, and the compensating checks

The red-team stage paid for itself once: B1-09a r1 found 7 wrong implementations passing (HANDOFF-3 §2). Every row
below turns a known failure class into **registered mutants**, which are cheaper and run on every future change.

| Area | Where it is most dangerous | Compensating check |
|---|---|---|
| **Leases** (B1-04f, B2-08, B3-02) | Cover and symbol holes (Receive accepts any covering token), expiry checks, CAS losers counted as wins (the B0-17a.yml history) | Deep tier. Mutants for each of those classes. `-race -count=50`, because the 4/40 flake shows one run proves nothing. SP2 fixtures nightly (G1(e)). The reviewer gets B1-04r.yml R1–R7 |
| **Launcher** (B0-08, B1-08 use) | Forbidden flags, argv digests, caps; the weakened `launcher_test.go` :205/:267 (HANDOFF-3 §6) | Restore those assertions in the first launcher-touching PR. The reviewer gets DR-B1-08-THREAT-MODEL. Spine Night is the integration proof |
| **Runner** (B1-09b, B1-13) | pgid escape, pid reuse, a leader that exits 0, Reconcile wedges | B1-09b's register must include **HANDOFF-3 §2's seven wrong implementations as mutants**. Orphan count = 0 in every kill drill |
| **Policy** (B1-14b, B1-25, B2-13, B2-25/26) | A rule that widens authority silently | 100% table tests on the seed matrix (B1-14a acceptance). **B3-14 model checking pulled forward to W3** as the structural replacement. A property test that the most restrictive rule wins (HANDOFF-3 §5) |
| **Budget** (B1-27, B2-04, B3-08) | Execution consuming acceptance headroom, double debit | Integer minor units; decide from the Journal only (B1-18 rulings); an invariant property test (Σ reserved ≥ Σ debited per bucket); replay of S10 (B1-27 acceptance) |
| **Effectors and money** (B3-01..05) | A lying gateway, `uncertain` retried, a double spend | Q3 crash-point mutants (B1-12b.yml has 24). Broker-read settlement before any money (G3(b)). **The Q8 and Q9 suites stay mandatory before A3** (G3(c)); they are product acceptance, not a red-team stage. The Codex read at G3 |
| **Auto-merge itself** | A lite-labelled kernel PR, a vacuous verdict, a verdict computed on a context-starved review | ⚑#144, ⚑IRR-1 and ⚑IRR-2 come first. Reviewer briefs are assembled by template (§1.6). Kernel PRs stay on hand-merge until #144 |
| **Single family** | Correlated blind spots | The batched Codex read per gate. The accepted-risk exit condition stands (HANDOFF-4 §4) |

**Tripwire.** If two post-merge defects in one phase were catchable by a registered-mutant class, deep jobs regain a
test-review step for that phase (§0).

---

## 5. Wave 1: ready-to-dispatch briefs

Every brief:
- uses a fresh worktree under `$(git rev-parse --show-toplevel)/.worktrees/<slug>` with branch `build/<slug>`;
- reads by reference: `docs/vision-v3/14-BUILD-PLAN.md` §6 row `<id>`, `build/done-tests/<id>.yml`, and the HANDOFF
  sections named;
- returns ≤150 words: PR URL, test tally, kernel N, deviations;
- stops on any hook or classifier refusal (HANDOFF-3 §4).

**W1-a REG-1 · Haiku implementer (Sonnet until §1.1 is resolved) · Sonnet reviewer · [L].**
- Scope: `build/jobs.yml`, the `status:` fields only. Add split and extra IDs only if `node build/lint-jobs.mjs`
  accepts them; otherwise record the mapping in the file header comment.
- Never touch `acceptance` or `acceptance_hash`.
- Source: the merged list in this file's status basis, checked against `git log origin/main --merges`.
- Lens: engineering. Done when lint passes and every merged ID reads `merged` (or the closest value the lint
  permits; the allowed status values are unverified).

**W1-b B1-04f · Opus test writer → Sonnet implementer → Opus reviewer · [D] · ~100 lines.**
- Scope: `kernel/internal/lease/**` and `build/done-tests/B1-04r.yml`.
- Read: HANDOFF-3 §6 (B1-04r follow-ups), HANDOFF-4 §4 (LC-1 R5), and B1-04r.yml R1–R7.
- Tests first: a covering-token mutant, a `repo://` R5 mutant, and the race test at `-count=50`, all red before the
  fix. Ship bar per §1.3. Lens: engineering.

**W1-c B1-09b · Opus test writer → Sonnet → Opus · [D] · ~450 lines.**
- Scope: `kernel/internal/runner/**` and `build/done-tests/B1-09b.yml` (new).
- Read: 14 §6 B1-09b, B1-09a.yml, DR-B1-09a-MEASURE, HANDOFF-3 §2 and the addendum, HANDOFF-4 §4 B1-09a.
- The register must carry the seven HANDOFF-3 §2 wrong implementations plus the surviving freeze/5 s mutants.
- Acceptance: a self-editing test reaches `blocked`; 20 jobs give 0 status mismatches.
- Batch in the ESRCH wedge and the ACL stderr limit.

**W1-d B1-14b · Opus test writer → Sonnet → Opus · [D] · ~450 lines.**
- Scope: `kernel/internal/policy/**`, `build/done-tests/B1-14b.yml`, and read-only `scripts/lib/classifier.js` and
  `.claude/gates.yml`.
- Acceptance: every QA tier maps to one door type; a stale contract is recompiled.
- Batch in the B1-14a follow-ups from HANDOFF-3 §6.
- Starts only after W1-b merges (the kernel cap).

**W1-e B1-27 · Opus test writer → Sonnet → Opus · [D] · Userland.**
- Scope: `userland/src/budget*.ts`, `userland/test/**` and `build/done-tests/B1-27.yml`.
- Read: B1-18.yml rulings (integer minor units, Journal-only decisions) and DR-81.
- Acceptance: a bucket is held before every debit; execution cannot consume acceptance headroom; the S10 replay passes.
- Batch in the B1-18 correction-event and access-control follow-ups.

**W1-f B0-14 · Haiku builder (14 §6 says `h`) → Sonnet reviewer · [L].**
- Read-only census of the 26 directories. Only repos that B0-19's scanner has already passed may be opened.
- Output: a census table under `docs/vision-v3/`; a committed secret opens a Hygiene item rather than being read
  further.
- The founder's sort grants no authority (DR-76).

**W1-g B0-04 · Sonnet (tests and implementation) → Opus reviewer · [S].**
- Scope: the adapter's context-profile argv. Paths are unverified, probably `kernel/internal/adapter/**`; if so, count
  it as a kernel job under the cap.
- Acceptance: SLICE's hello mission re-run, with turns and seconds recorded against 152.9 s; target ≤40% of SLICE's
  turns.

**W1-h MC-FU · Sonnet → Opus · [S].**
- Scope: `mission-control/server/**`, `mission-control/scripts/**` and their tests.
- Items from HANDOFF-4 §4 "mission-control": `missions.get` called twice, the third `isAlive`, killed-runner cards
  left `working`, the serial wait behind a Decision. Leave out the setpgid and forged-`children.jsonl` items; they
  are runner-side and go to W1-c.
- `crosscheck.test.ts` must stay at 0 exceptions.

---

## 6. Needs framing: not invented here

1. **G0(d)** requires every P1 done-test frozen up front. In practice they have been frozen one job at a time (for
   example B1-12b, frozen 2026-10-03). Should G0(d) accept "frozen before each implementer"? This is the founder's
   call at G0R.
2. **B1-19 depends on B1-16**, which is host-gated. The founder dropped that dependency for v0 only (HANDOFF-3 §2).
   It is unruled whether the full B1-19 keeps it. Framer's lean: keep it, and use W4.
3. **B5-05's dependency is normalised to B5-03** (Human Task Market) in `jobs.yml`. That looks like a parser
   artefact, since judge reconciliation is unrelated to the market.
4. **Which K/PCB rows land in `kernel/`** (B1-15 Swift, B1-16, B1-17, B3-01 `effectors/**`). This decides the
   arithmetic behind KB.
5. **Codex availability** for the batched gate read in this runtime. Unverified.
6. **The status vocabulary** that `lint-jobs.mjs` accepts. Unverified.

---

## Claims

`yaml` fence on purpose: these are not yet registered in the ledger, so `ledger lint` does not parse an unvetted block.

```yaml
claims:
  - id: c-exec-plan-kernel-headroom
    assert: "Kernel headroom is ~1,000 lines against ~6,300 needed for remaining K/PCB jobs; budget binds in W3"
    kind: behavior
    verified_by: command   # go -C kernel run ./cmd/avk-boundary
    valid_until: G1        # re-derive at every wave close
  - id: c-exec-plan-parallel-cap
    assert: "≤4 jobs in flight, ≤2 in kernel/, never two in one Go package"
    kind: decision
    valid_until: Handover  # superseded by Kernel launcher caps (14 §5)
  - id: c-exec-plan-tripwire
    assert: "Two post-merge defects in one phase catchable by a registered mutant class restore a test-review step for deep jobs"
    kind: decision
    valid_until: G2
```
