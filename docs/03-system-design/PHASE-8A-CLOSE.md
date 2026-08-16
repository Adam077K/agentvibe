# Phase 8a — Close

**Closed:** 2026-08-16 · **`main` = `08e7981`** · **For:** whoever picks this up next
**Supersedes the state lines in** [PHASE-8A-STATUS.md](PHASE-8A-STATUS.md) **and** [PHASE-8A-HANDOFF.md](PHASE-8A-HANDOFF.md)

---

## 0 · The founder decision this document records

[AGENT-SYSTEM-REBUILD.md](AGENT-SYSTEM-REBUILD.md) §6 stop condition 4:

> *"The build extends past Phase 6 without an explicit decision to continue."*

The build reached Phase 8a with **no such decision recorded**. On 2026-08-16 the founder instructed the work
to continue, faster, with steps merged. **That is the decision.** Recorded here so condition 4 is satisfied by
a written act rather than by nobody noticing it had tripped.

Two conditions remain live and are **knowingly accepted, not discharged**:

- **§6.6 — "No user-facing venture work ships during the rebuild."** Still true. **No venture work has ever
  run through this harness.** Eight phases of control plane exist and none has been opened against real work.
- **§6.7 — "A new mechanism is added that nothing invokes within two weeks"** — the condition that catches
  *"building mechanisms because they are satisfying to build."*

The recommendation on the table was to stop building and run one real task. **The founder's decision, made
2026-08-16 after that recommendation was put and argued, is to finish the harness first**, in a single
autonomous pass with the heavy review process cut back. Recorded this way so that it reads as a choice with
its cost known, which is what it is — not as a condition nobody noticed.

**§6.7 gets one concession that costs nothing and settles the argument:** PR #47 clears by a **real `qa.js`
run**, not by authorisation. The gate's first genuine invocation is the change that makes the gate real. A
mechanism that has run 8 times and gated nothing stops being hypothetical at that moment.

---

## 1 · State, measured

| | |
|---|---|
| `main` | `08e7981` |
| Tests | `npm run check` exit 0 · 338 pass · 0 fail · 0 skipped |
| Ledger | **69 pass · 5 would_block (shadow) · 0 block** |
| Sweep | CLEAN — 37 claims over 30d |
| Open PRs | **#47 only** (another session's; BEHIND main with a failing QA check) |
| Branches | 4 remote (was 44), 6 local (was 48) — every deletion verified merged first |

**⚠ Before trusting any local ledger number:** `cd mission-control && bun install`. Without it, `verify`
reports **8** would_block, not 5, because `c-mission-control-rail`, `-trusted-roots` and `-cross-site-refused`
shell out to `bun` and fail for missing dependencies. They look exactly like three regressions. Measure from a
**clean detached worktree at `origin/main`**, never from a working tree that may be parked on a stale branch —
that mistake produced two wrong readings during this close-out alone.

The 5 shadow failures are all known: 2 are the canary (built to fail — that is its job),
`c-lenses-and-playbooks-are-loaded` fails for real (issue #56), and two are `unresolved`, not failed —
`c-sessionstart-injection-unverified` and `c-runtime-nested-spawn`, both unjudged.

**`NOT VERIFIED` and `would_block` are different meters and both were reported under the wrong name during
this phase.** `would_block` is the union of `fail` and `unresolved` and comes from `ledger verify`.
`NOT VERIFIED` comes from `mission-control/test/gate.ts:98` and is currently **0**. A resolver that could not
check has not found a problem; collapsing the two reports unjudged claims as failures.

---

## 2 · The finding that outlasts the code

Phase 8a's defect class — **a mechanism reporting success about something it did not measure** — recurred
**eight more times inside PR #52, which existed to fix it.** Four of those were introduced by the fixes for
the previous ones.

**Family A — *the check looked somewhere the answer was always yes*:**

| # | Instance |
|---|---|
| 1 | A test selector filtering rows by the content under test — drop the field, the list empties, the loop never runs, the test passes for the reason it exists to catch |
| 2 | `locate`'s correctness test whose regex hardcoded `docs/06-codebase/ledger-canary\.md`, so **no global claim could enter the sample even in principle** |
| 3 | A proposed fix that would have asserted over the real global ledger — which CI does not have. 37 claims locally, **33 on a runner**. Green for the wrong reason, where nobody looks |
| 4 | Test fixtures hand-supplying `source_line: 12` while the producer had stopped emitting it. **Every claim in the real index lost a required field and all 320 mission-control tests passed** |

**Family B — the evidence could not differ:** the original error printed `on disk: 19749 bytes ·
regenerated: 19749 bytes`. A one-line shift rewrites `295` as `296` — the same width — so the byte count was
**guaranteed equal for the entire class of failure it existed to explain.**

**Family C — the instrument was fine and the report was short:** the search returned six hits and the commit
accounted for five. Not a scope hole, not a vocabulary gap. *The accounting was complete over a set the
search itself exceeded.*

**Two were the author's own**, and are recorded because omitting them would be the same defect: a diagnostic
rule specified as a single-cause inference over a two-cause observation (the builder declined to apply it and
added the leg that separated them), and a figure published under another instrument's name.

> **"Three-for-three on the deliberately-left calls is not worth much when the set I was judging over was
> smaller than the set I had."** — builder, PR #52
>
> Judgement and accounting fail **independently**, and the second is invisible from inside the first. That is
> why reconciliation must be computed, not felt.

---

## 3 · Standing rules (earned, not invented)

1. **Ambiguous probe → add the disambiguating leg and report both.** Never resolve it on the specifier's
   say-so. A test that fails to fail has more than one cause.
2. **Report searched / found / dispositioned** — with *found* emitted by the tool, not the writer. A
   hand-written count is a second assertion of one fact.
3. **Never let one fact be stated twice without something checking the two against each other.** This
   appeared at three levels in one PR: fixture vs file, footer components vs total, report count vs hits.
4. **Assert the edit landed before scoring the result.** A revert that does not apply is indistinguishable
   from a guard that works — and an *unfaithful* revert understates the pin while looking like proof of it.
5. **An idle agent and a finished agent emit the same signal. Ask, never infer.**
6. **Measure from a clean checkout.** Twice in this close-out a stale tree produced a wrong number.
7. **Vocabulary search has no completion criterion** — you can never say you are done, only that you
   stopped. It belongs *behind* registration, never instead of it (issue #59).

---

## 4 · Open issues — three PRs, not seven

| PR | Issues | Why grouped |
|---|---|---|
| **A** | **#53 · #57 · #58** (+#55) | One pattern: **two implementations of one concept, only one carrying the check.** `readGlobalLedger` validates a closed schema / `readLedgerIndex` casts and checks nothing · `lint` and `verify` report an absent global ledger / `sweep` does not · the project path rejects duplicate ids / the global path accepts them. Fixing one alone leaves the shape intact |
| **B** | **#59** | Prose→claim citation validation, ~20 lines. Highest leverage in the list: **had it existed, PR #52's stale-belief hunt would have been one claim edit instead of seven sites across five rounds** |
| **C** | **#54 · #56** | #54 binds test fixtures to producer shape. **#56 needs a founder judgment** — is 4,096 bytes the right session-start budget? It fails 6.6× over (27,069 B) and carries no `disposition`, so Rule 9 is forcing none of its three outcomes |

Also open, founder's call, untouched: **`--dangerously-skip-permissions` at `bin/warroom:235,237`.**

---

## 5 · What does not travel with a clone

All four fail safely — the risk is confusion, not breakage.

1. `~/.warroom/ledger/global.yml` — 4 global claims. Absence is reported loudly (`0 global claims checked`),
   never silently. Transfer it or accept the loss knowingly.
2. `~/.warroom/trusted-projects` — Mission Control's RCE allowlist (PR #44). A fresh clone trusts nothing and
   shows every project degraded **with the reason**. Seed with `bun run trust add`.
3. `~/.warroom/bin/warroom` + manifest + backups — reproducible via `scripts/warroom-install.mjs`.
4. `cd mission-control && bun install` — and `bun run build` for `client/dist/`.

---

## 6 · Review protocol for what comes next

Six review rounds for one small PR was **not six reviews' worth of depth — it was one review's depth
serialised six times.** Each fix was dispatched, reviewed fresh, found to have introduced a new defect, and
re-anchored.

- **One enumerating review** — report *everything* found, not just the first blocker.
- **One fix pass** addressing all findings together.
- **One delta verification.** If production code is untouched, carry prior results **by identity**
  (`git diff --quiet <a> <b> -- <paths>`) and say so. Never re-run a matrix for a docs change.
- **Hard cap: 2 rounds.** A third means the change is bigger than it looked — **split the PR.** Do not merge
  on a tired PASS.
- **Every verdict states what it did not cover.** Non-negotiable — it is the only reason this phase's numbers
  are worth believing.

**Not one review in this phase was independent.** All single model family. `independence: true` requires two
distinct families, and that bar was never met.

---

*Written by: ceo · 2026-08-16 · against `main` = `08e7981` · every figure above measured, not recalled*
