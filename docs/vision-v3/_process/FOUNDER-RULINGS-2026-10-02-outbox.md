# Founder rulings — B1-12a outbox, 2026-10-02

**Source.** The founder answered two questions through AskUserQuestion in the main orchestrator session on 2026-10-02.
The coordinator relayed his answers to the B1-12a builder. This note records them as relayed. The builder did not see the
exchange itself. Canon gave no number for either point ([14-BUILD-PLAN](../14-BUILD-PLAN.md) B1-12;
[09a](../09a-ENGINEERING.md) §7, §7.2), and the round-3 done-tests marked both OPEN.

## A. Visibility lag

> Each provider declares its own `visibility_lag`, with a default of 2 minutes. The **outbox** enforces it: an Absent
> result within the lag window after a timed-out or uncertain attempt is not trusted, and no re-send happens until the
> window has passed.

Canon: 09a §7.2, `check_before`: "A measured `visibility_lag_s`; a query inside it returns `unknown`, not `absent`".

**As implemented** (`kernel/internal/outbox/store.go`, `DefaultVisibilityLag`, `VisibilityLagger`):
- A Provider declares its lag through the `VisibilityLagger` interface. The default is 2 minutes.
- The window runs from the later of two times: the attempt's `sent` record, or its latest `uncertain` record.
- The outbox journals a `sent` record immediately before the provider call. An attempt with no `sent` record provably
  never reached the provider, so the window does not apply to it. The frozen round-1 done-test needs exactly this case:
  an attempt killed before its provider call must be retryable on an Absent read 70 seconds later. That is shorter than
  the 2-minute default.

## B. Hung effect

> If an effect gets no answer at all, mark it uncertain, never retry it, and escalate to Human (a Decide card) after
> 15 minutes.

**Correction, 2026-10-02 (coordinator, round 4).** This quote previously ended "Make that the `UncertainDeadline`
default." That sentence came from the orchestrator's brief, not from the founder. The founder's ruling covers **hung
calls only**: an effect with no answer at all. `UncertainDeadline` stays at 24 hours for answered-but-unclear outcomes
(a timeout that returned at once, an ambiguous error). The "deviation, flagged for decision" below is therefore not a
deviation; it is the ruling.

A call silent for more than 15 minutes is hung **however the silence ends**: if it later times out, or its worker dies,
it is still never re-sent and goes to Human. Pinned by the round-4 done-test
`TestB112R4SilentPastFifteenMinutesIsNeverResent` (`kernel/internal/outbox/outbox_r4_donetest_test.go`).

Canon: 09a §7 diagram, "uncertain --> human: at_most_once, or deadline before proof".

**As implemented:**
- `HungDeadline` is 15 minutes. A provider call that has not returned by then is recorded `human` and is never re-sent. A
  Receipt that arrives later still confirms it.
- **Deviation, flagged for decision:** `UncertainDeadline` stays at 24 hours. It covers an attempt whose call did return,
  or whose worker died, without proof. The frozen r2 done-test `TestB112R2LookupErrorIsNotProofOfAbsence` requires such
  an attempt to stay `uncertain` for 18 hours, so a 15-minute `UncertainDeadline` would fail a frozen test.
- Applying the 15 minutes to every unproven attempt needs one of two things: a re-freeze of that r2 test, or a ruling
  that "no answer at all" means only a call that has not returned. The second is what is implemented here.

## C. Dead worker before 15 minutes

**Source.** The founder answered through AskUserQuestion in the main orchestrator session on 2026-10-02. The
coordinator relayed the answer to the B1-12 test builder in its round-5 brief; the builder did not see the exchange.

> A worker dies before 15 minutes on a call that never answered. Once the 2-minute lag has passed, a provider lookup
> of Absent allows ONE retry. Past 15 minutes the attempt goes to Human.

Canon: 09a §7 diagram, "uncertain --> failed: proven absent → next attempt, same Operation" and "uncertain --> human:
at_most_once, or deadline before proof"; 09a §7.2, `visibility_lag_s`. Rulings A and B above.

**Pinned by** `TestB112R5DeadWorkerRetriesOnce` (`kernel/internal/outbox/outbox_r5_donetest_test.go`):
- a death at 5 minutes, then Absent after the lag: exactly one re-send;
- a second unanswered death on that re-send: no third send, ever; the Operation goes to Human;
- a death at 16 minutes: Human, no re-send.

`TestB112R5FifteenMinuteBoundary` pins "past 15 minutes" as reaching 15 minutes: Human at exactly 15m and at 15m+1ns,
not at 15m-1ns, both for a call that finally times out and for a dead worker found by the reconciler.

**Not yet implemented at 87059ac:** the second death re-sends a third time. That subtest fails there by design.
