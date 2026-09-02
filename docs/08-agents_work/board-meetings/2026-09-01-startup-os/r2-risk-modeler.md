# Round 2 — Risk Modeler · cross-critique

**Lens unchanged:** failure modes, ranked by probability × severity, and for each the *structural*
property that closes or bounds it. What changed is that four peers gave me measurements I did not
have, and one of them overturns a component three of us were relying on.

---

## 0. The one measurement that should reorder the board

Round 1 gave me a comfortable sentence in P9: *"the measurement half is already built."* The Architect's
P4 says it is not — `sinceLastArtifact` sums `recentTurns`, `recentTurns` discards every turn older than
`RETAIN_HOURS = 6`, so a stall older than six hours under-reports and the ceiling "fires less the deeper
the machine is stuck."

I went to verify it and found something simpler and worse. Measured live in this worktree, 2026-09-02:

| Quantity | Reading |
|---|---|
| `RETAIN_HOURS` | 6 |
| `WINDOW_HOURS` | 5 |
| Last durable artifact | `session-file`, **19.1 hours** old |
| `windowUsage().output_tokens` | 193,027 (ceiling 3,000,000) |
| `sinceLastArtifact().output_tokens` | **193,027** (ceiling 400,000) |

The two numbers are not merely close. They are **the same number**, and they are the same number for a
mechanical reason: the artifact is 19.1 hours old, so it predates every turn inside the 6-hour retention
window, so the filter `if (t.t >= artifact.t)` admits all of them. Past the horizon the stall counter
**degenerates into the window counter** and measures "tokens in the last six hours," full stop.

So the defect is not under-reporting on a slope. It is a **cliff**. Before six hours the stall counter
measures a stall; after six hours it measures the clock, and a machine circling for nineteen hours is
byte-indistinguishable from one that committed six hours ago. This is exactly the shape of PR #115's
finding generalised — a gate that reviewed nothing was byte-indistinguishable from one that ran every
reviewer — and exactly the shape CLAUDE.md warns about in its own supersession note: *"a derivation that
keeps working after it stops being true is worse than none."*

Two further points the Architect did not reach, and they cut in opposite directions.

**The repair is smaller than they propose.** The unbroken signal already exists and is already computed.
`budget-guard.js` calculates `const mins = Math.round((Date.now() - stall.since) / 60000)` — elapsed time
since the artifact, unbounded, correct at 19.1 hours — and uses it **only to interpolate into a warning
string**. `lastArtifactAt` has no retention horizon at all; it returns a real timestamp from `git log`, a
claim event, or a session-file mtime. The correct trigger is sitting one line away from the broken one,
serving as decoration.

**A second, opposite-signed error sits on the same counter, and it is the Adversary's.** Their P9 says the
loop and the founder share one quota with nothing allocating it. `recentTurns` says of itself *"Every turn
inside the retention horizon, **across every project**"*, while `lastArtifactAt` is anchored at
`opts.repoRoot || process.cwd()` — the Architect's P5, and it is the same defect seen from the numerator
side. The consequence for my lane: the 193,027 above was produced by ordinary founder-driven work, and it
is **96.5% of `STALL_WARN` (200,000)** before the loop has taken a single turn.

Put the two together and you get the finding I bring to this round:

> **The stall ceiling carries two errors of opposite sign. The account-wide numerator makes it fire on work
> the loop did not do; the six-hour cliff makes it stop firing on the stalls it exists to catch. A control
> with two opposite-signed errors is not a control. It is a number.**

This changes my build order. I had *"register `budget-guard.js`"* at position 1 on the grounds that it is
the only stop that exists. My own P3 says a control nothing calls is worse than absence, because the
founder believes the system is bounded when it is not. That argument does not stop at *uncalled*. A
control that **is** called and reads wrong in both directions produces the same false belief with a
timestamp on it. Registration must follow the repair, not precede it.

---

## 1. What else the peers changed

### The Architect's P10, confirmed by probe rather than by reading

Their P10 argues from the live matcher (`Bash|Edit|Write|NotebookEdit|mcp__`) that `PreToolUse` sees
neither a dispatch nor a fetch. I drove the hook with real payloads instead. All three of my Round 1
headline results reproduce, and two new rows fall out:

```
exit=2 :: npx bare              exit=0 :: tiktok_publish
exit=0 :: npx subshell          exit=0 :: gmail send_message
exit=2 :: destructive control   exit=0 :: sandbox_exec
exit=2 :: destructive subshell  exit=0 :: WebFetch
                                exit=0 :: Task dispatch
```

`WebFetch` at exit 0 is the measured form of my P6. Prompt injection's entry point is not hooked, which
means the taint has no source to be marked at. `Task` at exit 0 means a dispatch is not a policy event
either. I had asserted the injection risk from `hands.md §3.2`; it is now a local measurement.

The `npx` rows also settle a question of severity the Adversary raised. The parenthesis bypass is real and
**rule-specific**: `npx` loses to a subshell, the destructive control survives one. It is an anchoring
defect in one rule, not a general defeat of the hook — and it is not what stands between this machine and
`tiktok_publish` or Gmail send, because those never touch a shell rule at all. They take the MCP branch and
are allowed by scope.

### The Architect's P2 gives blocked-vs-stalled a third state

My P9 had two states: blocked is authored, stalled is computed, and they cannot be confused because they
come from different sources. The Architect's P2 records that the capability grant **narrows** reliably and
**arrives** unreliably, cause unknown — 24 playwright tools one day, zero across three dispatches the next,
configuration intact.

Note the direction first, because it matters for my lane and the Architect does not say it: an arrival
failure is **fail-safe**. The worker holds fewer tools than declared, so it cannot act. That is why P2 does
not undermine my P1's "reach declared on the GRANT" — the declaration is a static record on disk read by a
linter and a wrapper, not a payload delivered through the dispatch channel.

The bite is elsewhere, and it lands squarely on P9. A worker whose grant did not arrive **cannot author a
block naming what it needs**, because it may not know the tool was ever meant to be there. It produces no
durable artifact, so the clock reads *stalled*. So there is a third terminal value I did not have:
**capability-absent** — not authored, not a clock reading, and today indistinguishable from both. Same
principle as #115: it must be its own terminal value or it will be rendered as one of the others. The cure
is the Architect's grant-arrival probe, and the shape already exists in this tree —
`scripts/probe-agent-tool-inheritance.mjs` declares `UNRESOLVED` as a terminal value with its own exit code,
*"never a default and never an error dressed as an answer."* I adopt it, as a **safety** instrument.

### The Adversary's P4 is right about causality, and I was wrong about sufficiency

I ranked built-and-never-wired first and called the birth certificate *"the only proposal that PREVENTS
rather than detects."* The Adversary inverts it: a mechanism goes unwired because no task demanded it, and
`design.js` proves the point — `.claude/commands/design.md` exists, a founder can type `/design`, so a call
site was never what was missing.

The half that actually moves me is narrower and sharper than the causal argument: **wiring IS adding a
caller, so the check passes by construction.** A caller-in-the-same-diff test proves *callability*, not
*calledness*, and it is satisfied by a trivial caller written to satisfy it. That is a real hole and I did
not see it.

The Strategist's P3 closes exactly that hole: the caller must resolve to a mission in `MISSIONS.yml` with
state `in_flight` carrying a `blocked` row that names the missing capability, **authored before the diff**.
That converts callability into demand. So my P3 becomes: the birth certificate is **necessary and not
sufficient**, and the demand trigger is the sufficient half. The Architect's P8 supplies the implementation
note — four birth certificates already exist with four exemption conventions and no shared predicate, and
`check-registration.mjs` runs reference-to-existence while this needs existence-to-reference. One
`hasCaller` predicate, four call sites migrated, not a fifth instance.

### One overclaim of my own, corrected

Round 1 said `outbound-approval` has *"zero consumers."* Checked: it is named by `.claude/gates.yml`,
`.claude/playbooks/launch-landing-page.yml`, `.claude/commands/launch.md`, `scripts/check-gates.mjs` and
`scripts/gates.test.mjs`. It has a **resolver and a test**; what it lacks is a caller in any executing path.
That is still the finding, and the precise wording is the Architect's P8 distinction, so I take it.

---

## 2. The fatal critique — strategist:P1

The Strategist's P1 defines the smallest thing deserving the name company, and maps "runs unattended" to
three implementations: *"the loop plus budget-guard's rope and stall ceiling plus a kill-switch file."*
The Visionary's build order makes the same commitment at item 5, calling the stall ceiling *"the only
repetition detector anyone has,"* and the Strategist's own build order item 1 calls it *"the field's only
working anti-circling detector."*

**Working** is the word that fails, and §0 is the measurement. Past six hours the stall ceiling is the
window ceiling with a tighter threshold. A 24/7 loop crosses six hours on night one by construction, so the
detector is inoperative for precisely the regime it was nominated to govern. Registering it in that state
does not give the loop a brake; it gives the founder a reason to believe there is one.

**What would have to be true for the position to survive.** Two repairs, both small, both before
registration rather than after:

1. **Trigger on elapsed time, or return `unresolved`.** `lastArtifactAt` has no horizon and is correct at
   19.1 hours; `budget-guard.js` already computes the elapsed minutes and discards them into a warning
   string. Either promote that to the trigger, or have `sinceLastArtifact` return `unresolved` when the
   artifact predates the retention horizon. Rule 10 in its own words: a resolver never passes what it
   could not check, and past the horizon this one cannot check.
2. **Scope the numerator to the denominator.** An account-wide token count against a repo-local artifact
   is two different populations. At present ordinary founder work sits at 96.5% of the warn threshold with
   the loop idle.

With both, P1 stands as written. Without them it names a working component that is not working, which is
the failure class this repo has cured four times elsewhere and would here be re-importing into the one
mechanism nominated to make 24/7 safe.

---

## 3. Dissent that holds

**Against `adversary:P1` and `adversary:P4` — the outbound controls precede the loop's SUCCESS branch, not
the demand test.** I concede more to the Adversary than any other peer, and I still hold this. Their build
order is: demand test, tripwire, parenthesis fix, register budget-guard, **then** *"IF AND ONLY IF step 1
returns a non-zero number: build the loop, the missions file and the packs."* The demand test itself is
founder-executed — a person posts the page — so it needs nothing from my lane, and that is a point in its
favour, not against it. But **the branch where it succeeds is the branch where the machine is armed**, and
that branch carries no outbound control at all. Their own `strongest_counter` concedes the premise in
terms I could not improve on: *"an unattended system with an authenticated Chrome, publishing rights and
mail-send and no gate that can refuse is exactly the configuration hands.md §8 warns about. I could not
defeat this argument."* I am not asking for thirteen controls before the demand test. I am asking for three
before step 5: the reach axis, the outbound wrapper, `blocking-human` by type.

**Against `strategist:P5` — the birth certificate is a check-suite step and lands first.** P5 refuses any
new suite step *"unless it fails on a defect found in work that is not about the harness."* Applied
faithfully, that refuses the one check whose subject is the suite's own growth — so P5 forbids the
mechanism that would make P2's ceiling checkable, and the ceiling then rests on the same footing as the
eight unenforced rules CLAUDE.md had to relabel as wishes. I accept the spirit entirely: L1 should not grow
for its own sake. The exception is narrow and I will name it rather than widen it — a step whose subject is
the growth of the governed set is the one step a growth ceiling cannot consistently refuse.

**Against `visionary:P1` — inbound stays last, and the world resolver is inbound.** Their build order puts
`verified_by: world` at position 3, ahead of any outbound control, and the resolver's job is to pull
third-party payloads into context. `WebFetch` returns exit 0 from the only blocking hook, measured above,
so there is no point at which a fetched body is marked as foreign. I hold this at `serious`, not fatal,
because the cure is cheap and does not disturb their sequencing: have the world resolver write a
**deterministic parse into a data file**, and never let a fetched body reach a producing context. That
preserves position 3 and closes the hop. What I will not concede is the general rule: inbound plus outbound
with nothing between them is injection-to-irreversible-action in one hop, and that holds whether the board
builds three controls or thirty.

---

## 4. Where the board has actually converged

Stated as claims, with the ids that carry them. I have tried not to round agreement up.

1. **Money is the axis with no mechanism, and spending grants wait for a counter enforced at the wrapper.**
   `risk-modeler:P7`, `strategist:P10`, `visionary:P12`, `adversary:P10`. Four of five, independently
   framed, all landing on `hands.md §5.2B`. This is the strongest agreement in the room.
2. **The classifier's input domain widens from path to action, on the ONE classifier.** `risk-modeler:P1`,
   `architect:P6` carry the positive claim; **all five** refuse lists refuse a second implementation. Five
   of five on the refusal is the only unanimity here.
3. **No done-test whose resolver is the producing model, and no summed judge scores anywhere.**
   `strategist:P14`, `architect` refuse-list, `visionary` refuse-list, `risk-modeler` refuse-list.
   `adversary:P8` attacks the founder-approval clause of §4 and not this one, so it is four for and one
   not-opposed.
4. **`blocking-human` gates by TYPE are what make unattended operation possible at all.**
   `risk-modeler:P4`, `visionary:P9`, `strategist:P1`. Three of five, and none of the other two argues
   against it.
5. **`budget-guard.js` is registered nowhere, registration is founder-gated, and it is on the critical
   path.** `risk-modeler:P3`, `architect:P14`, plus the build orders of `strategist`, `visionary` and
   `adversary`. Five of five on the *fact*. The board splits on whether it works as-is, and §0 settles that
   it does not.
6. **The dangerous hands are granted and the safe instruments are not.** `risk-modeler:P2`,
   `adversary:P10`, `visionary:P12`.
7. **Built-and-never-wired needs a structural cure, and caller-in-diff is necessary but not sufficient.**
   `risk-modeler:P3`, `visionary:P10`, `architect:P8` for the cure; `strategist:P3` supplies the sufficient
   half; `adversary:P4` supplies the falsification that forced it. This is the one place where the
   dissenter's objection improved the majority position rather than defeating it, which is the best
   outcome this round could have produced.

---

## 5. Revised build order

Changes from Round 1 are marked.

```
0  Birth certificate + demand trigger, as ONE check-suite step, via one hasCaller predicate with
   the four existing call sites migrated.                    [REVISED — adversary:P4, strategist:P3,
                                                              architect:P8]
1  REPAIR the stall counter, THEN register budget-guard.js.  [REVISED ORDER — was "register" alone;
   Elapsed-time trigger or `unresolved` past the horizon;     architect:P4, architect:P5, adversary:P9]
   numerator scoped to the denominator.
2  `reach` as a second axis on scripts/lib/classifier.js,     [unchanged]
   declared on the grant.
2b Grant-arrival probe, generalised, on a schedule —          [NEW — architect:P2]
   capability-absent as its own terminal value.
3  The outbound wrapper as ONE artifact: dry-run default,     [unchanged]
   hash-bound send, named-human register, rate ceiling.
4  Kill file + launchd supervisor. The check lives in the     [unchanged]
   wrapper script, never in a prompt.
5  Inbound LAST.                                              [unchanged — the sequencing claim I
                                                               will not trade]
```

Steps 0 through 2b cost days, not weeks, and none of them blocks the Adversary's demand test, which is
founder-executed and needs no control from this lane. Step 3 blocks their step 5, deliberately.

---

## 6. Strongest counter — updated

Round 1's counter was that every control I propose is a stopping mechanism, and the founder's complaint is
that the system is already all stopping mechanisms. I conceded volume and kept ordering. That answer is now
weaker, and the Adversary is the reason.

The sharper form: my top-ranked risk is that controls get built and never wired, and my response to it is to
build more controls. This round I have raised that from thirteen to fifteen positions and added a probe.
The Adversary's P4 supplies the mechanism by which my own answer defeats itself — the birth certificate
passes by construction, so the guard I placed at position 0 to protect everything after it is satisfiable by
a caller written to satisfy it. I have patched that with the Strategist's demand trigger, but the patch has
a cost the Strategist states honestly and I inherit: the trigger only fires for capabilities the system
already has enough of to *notice* missing, and nothing has ever tested whether workers reliably author
`blocked` rows rather than improvising around gaps.

So the honest conditional form of my position: **the ordering is right and the volume is still probably
wrong.** If the board must choose, take the sequence and cut the count — reach axis, outbound wrapper,
`blocking-human` by type, and the stall-counter repair, which is four items and roughly a week. Everything
else on my table, including my own P8 kill switch and P10 contact register, can wait for a mission that is
blocked on its absence.

And one thing I would defend to the end, because it is the cheapest item in this document and the one most
likely to be dropped as bookkeeping: **§0's finding must be written down before anyone registers
`budget-guard.js`.** Three of five personas nominated that ceiling as the loop's brake. If the synthesizer
carries that forward unqualified, this board will have installed a control it measured broken, in the same
meeting where it measured it.
