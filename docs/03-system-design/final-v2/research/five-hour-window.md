# `c-rolling-five-hour-window` — the vendor source, found 2026-09-07

*The claim's waiver expires **2026-09-08**, tomorrow. It was waived in August for one stated reason:
"the window length is a vendor fact needing an external source". **That source now exists.** This file
is the evidence and the recommended disposition; the ledger entry itself lives at
`~/.warroom/ledger/global.yml:54`, **outside the project root, where no agent in this session can
write** — the disposition is a founder act or needs an escalation.*

## The claim as written

> `assert:` *"Subscription usage is governed by a rolling 5-hour window, which is why the budget ceiling
> is denominated per-window rather than per-session or in dollars"*
> `kind: external-fact` · `scope: global` · `verified_by: judge` · `judged_by: []` · `valid_until: 2026-09-08`

## The source

**support.claude.com, "What is the Max plan?", article dated 2026-08-07**, accessed 2026-09-07:

- *"Your session-based usage limit will reset every five hours."*
- *"Max plans also have a weekly usage limit that applies across all models. The weekly limit resets at a
  fixed time each week that is assigned to your account."*
- *"Your reset day and time stay the same regardless of when you start using Claude or when your
  subscription begins, and you receive your full weekly allowance each cycle."*
- *"In addition, to manage capacity and ensure fair access to all users, we may limit your usage in other
  ways, such as weekly and monthly caps or model and feature usage, at our discretion."*

**code.claude.com / support.claude.com, "Models, usage, and limits in Claude Code", dated 2026-04-15**,
accessed 2026-09-07: an Enterprise seat draws on *"A pool of usage included in your organization's plan,
reset on a rolling window."* **That page carries no five-hour figure at all**, and "rolling window" is
its word for the *Enterprise pool*, not for the consumer session.

## What the source does to the claim — three findings, and only the first is a simple confirmation

**1 · Five hours is CONFIRMED and no longer an unsourced assumption.** The waiver's stated reason is
discharged.

**2 · "Rolling" is not the vendor's word, and the difference is behavioural, not cosmetic.** They say
**session-based, reset every five hours**. A session that begins on first use and resets five hours
later is not the same object as a sliding five-hour window, and a clock routine written against the
wrong one fires at the wrong time. **The plan's own §3.8 rationale for registering this claim was
precisely that "if it changes and nobody notices, the clock routines fire forever against a window that
no longer works that way." The word was wrong from the start.**

**3 · The claim is incomplete in the way that matters most, and this is the finding.** There is **also a
weekly limit**, applying across all models, **resetting at a fixed time assigned to the account** — and
for a heavy user *that* is the binding constraint, not the five-hour one. Lane M measured this seat at
**0.68 of the seven-day window with overage rejected**. So a ceiling denominated per five-hour window is
metering the constraint that does **not** bind. A fixed weekly reset is also **schedulable** in a way a
rolling window is not, which is a design opportunity the plan has never considered.

Note also the vendor's reserved discretion — *"we may limit your usage in other ways … at our
discretion"* — which means no claim of this kind can ever be more than current.

## Recommended disposition

**REFRESH, with the assertion amended**, rather than a second waiver. Three changes:

- Re-assert as **session-based, resetting every five hours**, dropping "rolling".
- **Name the weekly limit** and record that it is the binding one for this seat, citing v22, v74 and
  Lane M's 0.68 measurement.
- Move `verified_by:` from **`judge` to `source`** if the schema allows it. **A `judge` claim with an
  empty panel resolves `unresolved` forever, and this repo already carries three of those** — this one
  need not be a fourth now that a primary vendor page states the fact.

**What would reverse it:** the vendor changing either interval, or the weekly limit ceasing to be the
binding one on this seat. Both are watchable; neither is watched today.
