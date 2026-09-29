> Archival provenance — 2026-09-13: Step 4 attack review, **security and adversarial** perspective (W6, W10; the DIRECTIVE §7 Phase D attack list), on the five F2 candidates at frozen subject `c6d62a3`. Preserved verbatim from the reviewer engine's report file. The reviewer authored nothing in the round, was barred from session files, lane worktrees, `state.json`, `history.jsonl`, `PLANNING-REPORT.md`, other reviewers' scratch and every prior F2 review, and read each candidate's §11 last. Same model family as every author; independence is procedural only, and the reviewer notes that the ten mechanisms shared by all five trace to one source set (R4, R7, `02` §4/§6.2), so their agreement carries no weight. Archival is not acceptance.

# Step 4 adversarial review — security and adversarial lens (W6, W10)

## Provenance

**Subject, frozen.** Commit `c6d62a3` of `/Users/adamks/VibeCoding/agentvibe/.worktrees/ceo-4-1789314685`,
read at the repository root, read-only. This reviewer has no `Write` or `Edit` on the subject; this file is
written to a session scratch directory outside it.

**Date.** 2026-09-13. **Dimensions.** W6 (authority as boundary) and W10 (adversarial robustness of the work
layer), against the protocol frozen at `26af5d5` plus amendment AM-01. Negative controls §4 items 4, 6, 7, 8
applied; (d)-class classing per §5.

**Independence, in my own words, and it is procedural only.** I authored nothing in Steps 1–5 of this round.
I share one model family with every candidate author, every research lane and every other reviewer, so my
agreement with any of them is not corroboration — per R7 F2 relatedness alone is sufficient for
contamination, and per R7 F13 a family-shaped blind spot returns unanimity every time and the unanimity is
the failure rather than the assurance. What I did not read: `docs/08-agents_work/` in any form,
`.worktrees/`, `docs/vision-system/state.json`, `history.jsonl`, `PLANNING-REPORT.md`, anything under
`planning/F2/reviews/`, and no other reviewer's scratch directory. I read each candidate's §11 self-audit
**last**, after forming every finding below, and I have marked where a candidate had already conceded a
point — a conceded gap with a named owner is recorded as conceded rather than as discovered.

**Reads, in order.** `planning/F2/00-acceptance-protocol.md` (whole) and `-amendments.md`;
`inputs/DIRECTIVE.md` §1.5, §1.6, §7 Phase D, §8.10, §8.16, §8.22; `research/F2/R4-authority.md` (whole);
`R2` F-08/F-09, `R1` F-10, `R7` F1/F2/F9/§7/§8, `R6` F7, `R5` §7/§8/§9;
`planning/specification/02-authority-recovery.md` §4–§8.3; the five candidates in full.

**Two bounded existence checks, disclosed.** (1) I resolved the `CP-nn` identifier namespace that M1 and M2
cite as already-existing package rules. It is **not** defined anywhere under `planning/specification/`; it
resolves to `planning/F2/00-position-ledger.md`, a Step 0 artifact, which quotes the underlying `05` text.
CP-84 there reads *"Workers can read authorized peers' work projections; they cannot see all company context
merely to coordinate."* That check is load-bearing for AS-M1-02 and I carried nothing else out of the file.
(2) I read `02-authority-recovery.md` §8.1–§8.3 beyond the §4–§6 my brief named, because the C2 disclosure
construction is what AS-X-03 and AS-M4-01 turn on.

**Standing caveat.** No runtime exists. Nothing below was executed. Every "insufficient" is about specified
behaviour checked offline. No aggregate score, no ranking, no recommendation; dissent is preserved.

**Method note on claims.** Per my brief, every "the launcher closes this", "the policy object refuses this",
"C04 releases this" was treated as a claim, and I asked in each case what is checked **at the moment of the
effect** and whether it is the same object that was granted (R4 F1). Where nothing is named, the item is
recorded as **unenforced** rather than as satisfied.

---

## Summary of judgments

| Candidate | W6 authority as boundary | W10 adversarial robustness |
|---|---|---|
| M1 capability-differentiated ephemeral | **insufficient** | **insufficient** |
| M2 chartered persistent | **insufficient** | **insufficient** |
| M3 workflow-first, no agents | **sufficient**, with residuals | **insufficient**, narrowly |
| M4 hybrid by consequence class | **insufficient** | **insufficient** |
| M5 subscription-activated shared record | **insufficient** | **insufficient** |

Blocking (d)-class findings: **AS-X-01** (all but M3), **AS-M1-01**, **AS-M1-02**, **AS-M4-01**,
**AS-M5-01**, **AS-M5-02**. M2 and M3 carry no new (d) from this lane; M2's own two blocking (d) items
(d-M2-1, d-M2-2) stand as it states them and I add nothing to them.

---

## Part 0 — what landed, across all five

Recorded first because it is unusual and the next iteration should keep it. On this lane's dimensions the
five converge on ten mechanisms, each correctly sourced:

1. **Revocation is a live epoch re-read at the effect, not a property of a credential** — all five, all
   citing R4 F3 and `02` §6.2 P3. All five state that attenuation buys narrowing and does not buy
   revocation. This is the half of F-3's adverse variation the field does not solve and all five get it.
2. **`derived ⊆ parent`, decidable, checked by the enforcement point rather than asserted by the
   delegator** — M1, M2, M4, M5; M3 reaches the same place by non-composition.
3. **A skill's `allowed-tools` grant is refused** — all five name R2 F-08 / R6 F7 and refuse the path.
4. **Tool self-description and command-text matching are refused as a source of consequence class** — all
   five, per R4 F4. M4 tabulates all five rejected sources.
5. **The loader records actual delivered inputs; the caller's claimed read list is not trusted** — all five.
6. **Deterministic oracle before any model checker** — all five.
7. **AM-01's paired clean case, in the same session, both rates or neither** — all five.
8. **Union of findings; never a vote, never a mean; abstention is a verdict** — all five.
9. **The duplicate-effect detector is the idempotency record on the effect, never state in the shared
   record** — all five.
10. **No candidate presents a second invocation as independence.** Each cites R7 F9's p=0.11 same-session
    control as the thing that makes the p=0.004 separation result mean anything. Negative control §4.6 is
    passed by all five as specified.

**And the finding that follows from that convergence.** All five authors read the same lane set and the same
two specification sections. Their agreement is therefore not evidence. A defect in R4, in R7, or in `02` §4
and §6.2 propagates into all five candidates identically, and nothing in this round's structure is
positioned to catch it — I am same-family too. Treat the ten items above as one source, not as five.

---

## Part 1 — cross-candidate findings

### AS-X-01 · (d) · The acceptance criteria are an unblinded channel into the checker, and no candidate names their author
**Applies to:** M1, M2, M4, M5. **M3 is exempt** (see below). **Confidence: high.**

**The passages.** Every candidate specifies the checker's delivered inputs as the same two things and nothing
else. M1 §4.1 R6 and §7 F-4.2: *"the artifact, the acceptance criteria, and the `ConstraintSet`"*. M2 §7 F-4
step 3: *"the artifact plus the acceptance criteria, and nothing else"*. M3 §6.1 rule 1: `read_set =
{artifact_ref, criteria_ref}`. M4 §7.4: *"the artifact and the acceptance criteria"*. M5 §7 F-4: *"the
original acceptance criteria, and the artifact"*.

**The attack.** R7 F11 establishes that the producer's *stated preference* moves the judge independently of
the artifact, and R7's failure table names "laundered independence" — a review whose stated inputs are not
its delivered inputs. All five close the delivered-inputs half. None closes the *provenance of one of the two
members it delivers*. If the acceptance criteria for a work order are drafted by a model step under that same
work order, or by the producing path, or by anyone who read the producer's framing, then the producer's
preferred conclusion reaches the checker inside an input every candidate hands over by design. Every
blinding survives it: no rationale is passed, no shared record is read, the loader's record is accurate, and
the three-arm probe that M1, M3, M4 and M5 all propose varies the rationale, the preferred conclusion and
the shared record — never the criteria.

**Path to harm.** F-4's own adverse variation, reached by a route the fixture does not name. A producer that
can shape "accepted means X" does not need to influence the checker at all.

**Detection.** None proposed in any candidate. The loader's record shows the criteria were delivered, which
is the intended behaviour.

**Containment.** None.

**The missing decision, which is what makes this (d).** May the producing path author, or influence, the
acceptance criteria of the work it will produce against? An implementer must answer it to build F-4, and the
answer decides whether F-4's independence claim is real. M1 is least exposed — acceptance criteria sit on the
`WorkOrder` (§4.2 item 1), which C02 admits — but M1 never says who drafted the text, and a model step under
the same admission is an available answer nothing forbids.

**M3 is exempt, and the reason is structural rather than diligent.** In M3 the criteria are a `criteria_ref`
inside an immutable `Procedure` whose executability requires a passing test suite and a human capability
owner's acceptance under CAP-46 (§3). For catalogued work the criteria are fixed before the producing step
exists and cannot be authored by it. For `unclassified-work/v1` the custodian — a person — sets them. This
is the clearest case in the round of a structural property doing work that no candidate argued for.

**Required contract.** Name the author of the acceptance criteria; forbid the producing path from authoring
or amending them; version and freeze them before the producing step starts; and add a fourth arm to F-4 in
which the criteria are authored by the producing path, reported beside the existing three.

### AS-X-02 · (b) · The W6 boundary in all five rests on one unbuilt policy object, and four name no check on the launcher
**Applies to:** all five. **Confidence: high.**

R4 F7 is the load-bearing source: `PreToolUse` hooks fire inside subagents carrying `agent_id` and
`agent_type`, a hook can deny, hooks cannot override a deny, precedence is deny-then-ask-then-allow — and
*"what is missing is not capability. What is missing is a policy object, external to the agent files, that
states which agent identity may release which effect, and a check that runs on every call."*

All five adopt the conclusion. **None specifies the object.** No candidate gives it a schema, a writer, a
version, or a protected-change class — except partially: M3 makes the **grant policy** one of three versioned
policy objects external to every procedure and classes a change to one as an irreversible self-edit (§2, §6.5),
and M4 classes the derivation function, the §4.1 table, the holder set and the floors as **C5** (§6.5). M1,
M2 and M5 leave the object unnamed while resting the whole boundary on it.

The same gap in sharper form: all five say the skill-carried tool grant is *"closed at the launcher"* (M1 §4.1;
M2 §6.2; M4 §5; M5 §4 — *"M5 must close it at the launcher"*). **Nothing is named that would detect a launcher
that did not strip it.** M3 is the exception in kind: its admitted profile is
`claude -p --safe-mode --restricted --tools "" --disallowedTools "mcp__*" …` (§2), which is an inspectable
argv rather than an assertion — though whether a skill's `allowed-tools` can re-grant a tool excluded by
`--tools ""` is not established by any source in this round and M3 should not be read as having proved it.

**The asymmetry worth noticing.** M1, M4 and M5 all adopt R3 F59's rule for grant *delivery* — assume a child
holds no more than it was granted, never assume it holds what it was granted, verify arrival with a positive
control at first use. **None applies the same rule to grant *removal*.** A stripping that silently did not
happen is invisible by exactly the same mechanism that made a delivery that silently did not happen invisible.

**Required contract.** The policy object is a record with a named writer and a protected-change class; and
the launcher's stripping carries a positive control — a probe skill declaring a tool grant, whose arrival at
the enforcement point is a failure.

### AS-X-03 · (b) · The model provider is a C2 destination under the fixed boundary, and four of five never say so
**Applies to:** M1, M2, M3, M5. (For M4 this becomes AS-M4-01, a (d).) **Confidence: high.**

`02-authority-recovery.md` §4, C2 row: *"C2 external disclosure/contact | **Model-provider input**, customer
message, research outreach or upload"*. §8.2: *"A model-provider request is itself external disclosure even
when all tool command networking is disabled"*, and for each external channel one of two constructions must
be chosen and enforced — destination-clean generation, or deterministic outbound rendering — with a
`DisclosureContract` naming principal, recipient identity, purpose, allowed data categories, exact source
scope and prohibited inferences.

M1, M2, M3 and M5 treat a model call as ordinary internal work. M3's step table states plainly that a `model`
step "May release an effect: **No**". None names a `DisclosureContract` for the provider channel.

**Why this is not pedantry.** The provider channel is the single highest-frequency outbound path in every
candidate. What each candidate actually builds — a loader that delivers a narrowed, permission-filtered
projection and records it — *is in substance* destination-clean generation. But because nobody says so,
nobody will author the contract, nobody will set the allowed data categories or the prohibited inferences,
and nobody will check at release that the projection is clean *for that destination* rather than merely
narrow. §8.2's own warning applies: *"Destination allowlisting alone cannot stop a model from copying
unrelated permitted-read secrets into an allowed recipient's message"*, and *"Unknown hidden context
disqualifies this construction for protected data"* — which is precisely R1 F-02's provider-side context
editing, which four of five candidates cite for a different purpose and none connects to this one.

**Required contract.** Name the provider as a destination; carry a standing `DisclosureContract` for it;
state that the loader's narrowed projection is the destination-clean construction discharging it; class that
contract's amendment as a protected change.

### AS-X-04 · (b) · Fan-out is bounded only by budget in all five, and only M1 mentions the word
**Applies to:** all five. **Confidence: high.**

Protocol §5 item 7 names *"depth **and fan-out**"*. Four candidates answer only depth: M1 §3.4 and M2 §4
("one child layer by default, a second by explicit admission rationale, deeper only by reviewed template
change"), M4 §4.5 (same, owner C02, checkpoint at subagent start), M5 §4 ("one child layer by default … the
ceiling is a safety property with a named owner"). M1 is the only one that uses the word "fan-out" — in its
§6.4 failure table — and the mechanism it names against it is the depth ceiling. M3 has no delegation between
models at all; its sub-procedure breadth is declared in the graph and reviewed at admission, which is better
in kind, but M3 states no width ceiling either.

**Why budget is not the answer.** All five bound an attempt by a budget in launches and wall clock. A budget
bounds cost. Fifty sequential consultations, each reading a different partition and each individually cheap,
sits inside one work order's budget and is a fan-out incident — the blast radius is the union of fifty read
sets, not the sum of fifty costs. At CP1 concurrency pins simultaneous width to two, which is the real
containment today and is a property of the capacity pin rather than of any candidate; R8 TC-39 records that
raising the pin is circular to measure, so a candidate that relies on it has tied its delegation ceiling to a
number nobody in this round can evaluate.

**Required contract.** A width ceiling per attempt with the same owner and the same checkpoint as the depth
ceiling, expressed over distinct read sets rather than over cost.

---

## Part 2 — per candidate

### M1 — capability-differentiated ephemeral agents around shared state

**W6: insufficient. W10: insufficient.**

#### What landed
M1 §3.4 carries the round's best single sentence on this dimension and sources it correctly: *"A boundary is
real only if the thing checked at the moment of the effect is the same thing that was granted"* (R4 F1). It
is the only candidate to make grant **arrival** a record (`GrantDeliveryReceipt`) rather than an assumption,
and the only one to state R4 §9 Q5 — an approval with no lifetime is a grant, and grants expire — as a named
refusal of the repository-wide permanent allow rule. It raises the shared-record leakage channel against its
own central mechanism in §11 O-2 rather than waiting for a reviewer, and it declines to claim metered-path
prevention in §11 O-1, correctly distinguishing a stated decision with an absent mechanism from a missing
decision. Its F-3 absorbs R4 F8's counter-objection and commits to a measure that can distinguish the two
failure shapes.

#### AS-M1-01 · (d) · The consultation return is an unfiltered model-to-model channel into the identity holding the effect grants
**Confidence: high.**

**The passages.** §4.4 makes consultation the default for obligation-bearing work: *"The obligation-holder
stays in the turn, sends a `ConsultationRequest`, receives an `AttemptReport`, and remains accountable
throughout. There is no compressed artifact for a duty to fall out of."* §2.2's `ConstraintSet` rule:
*"a receiver may act only on members it can restate as typed values. Prose accompanying a `ConstraintSet` is
evidence, never a substitute for a member."* §4.2 specifies the **dispatch** payload as exactly four things
assembled by the C05 loader; it does not say a consultation return passes through the loader, and no other
passage does.

**The attack.** F-1's adverse variation and F-3 composed. The R2-provenance executor is created to read the
untrusted counterparty document and holds no effect-bearing grant — correct, and it is the CaMeL shape M1
cites. It returns an `AttemptReport` to the obligation-holder, which by §7 F-3 is the identity that holds
payment-read, customer-write or outbound-send. The injected instruction travels in the report's prose. The
rule that stops it is a rule the *receiving model* must obey.

**M1 refutes its own rule, in its own text.** §6.4, last row: *"models resolve instruction-hierarchy conflicts
at 48% accuracy in the best open case measured, so this cannot be enforced by the model reading the
instructions (R6 F12)."* M1 states this about tool output and then places the identical burden on the
obligation-holder for a consultation return.

**Path to harm.** Untrusted document → provenance-isolated reader (no grant) → `AttemptReport` prose →
obligation-holder (three grants) → `OperationIntent`. The consequential *parameters* are protected:
`ParameterAuthority` resolves payee, amount and recipient from trusted selectors (`02` §8.1), and M1 keeps
that. What is not protected is everything the class does not compute from — which action is proposed at all,
against which subject, on what schedule, and the body of an outward artifact where the channel has not chosen
deterministic rendering.

**This is exactly R4 F8's warning, which M1 quotes and does not close.** §7 F-3: *"A split design can move
blast radius from 'one holder has three permissions' to 'three holders share a poisoned channel' and score
better on the stated metric while being no safer."* M1's response is to **measure** which shape it got —
counting released operations and recording whether the release was reached through a `WorkMessage`. A
measurement is not a boundary.

**Detection.** After the fact, by the `WorkMessage` flag on the release record. There is no detection at the
moment of the effect.

**Containment.** None named.

**The missing decision.** Does a consultation return cross the C05 loader, and what is the receiving
obligation-holder's read set? An implementer will either build a schema validator — which validates the typed
members and cannot stop the prose beside them from entering the window — or nothing.

**Required contract.** The return crosses the loader; the obligation-holder's delivered inputs are the typed
`ConstraintSet` members and typed outputs only; prose is stored as evidence at a Ref and is **not delivered**.
That is M3's and M5's property, obtained in M1 by extending a loader it already has.

#### AS-M1-02 · (d) · `ProjectionGrant` has no issuing authority, and M1 calls `Projection` its highest-risk object
**Confidence: high.**

**The passages.** §2.2: *"**NEW · `Projection` and `ProjectionGrant`.** A permission-filtered derivative of
another executor's or another venture's work, with `recipient_scope`, `purpose`, `granted_at`, `expires_at`,
`derived_from` and `revocation_epoch`."* The entry gives an identity, a lifecycle-free rule (filtered at
write, again at read, invalidated on revocation including derivatives already written) and **no writer**.
M1 declares writers for exactly two of its twelve new records: `ExistenceJustification` (*"Writer: C02 at
admission"*) and `FieldAuthority` (*"Writer: C01 declares the authority"*). §2.2 closes the `Projection` entry
with *"So the projection is the highest-risk object in this candidate and carries the tightest rule"* — and
the tightest rule is about filtering, not about who may grant.

**Why the citation does not rescue it.** M1 grounds the object in CP-84. CP-84 is not defined under
`planning/specification/`; it resolves to the Step 0 position ledger, quoting `05` §4: *"Workers can read
authorized peers' work projections; they cannot see all company context merely to coordinate."* That is a
statement of what a worker may read. It names no issuing authority either.

**Why §11 does not close it.** M1's §11 answers (d)-example 8 — "no writer authority on shared state" — with
`FieldAuthority`, which governs canonical cross-boundary **field values**. A `ProjectionGrant` is not a field
value; it is an authority object whose subject is disclosure across a venture boundary, which is C2 under
`02` §4.

**The attack.** Worker A, in venture 1, having read untrusted material, issues a `ProjectionGrant` over its
own work to worker B in venture 2, choosing `recipient_scope` and `purpose` itself. Nothing in M1 forbids it,
because nothing in M1 says who may issue one.

**Path to harm.** Cross-venture disclosure, self-granted — §8.16's first clause ("no agent may grant itself
greater authority") reached by the exact route R4 F5 note 5 and CVE-2025-54135 describe: authority arriving
from an object the actor could create. M1 §4.2 states the right principle three sections earlier — an
executor receives *"no authority derived from a file it or a peer could write"* — and then introduces a record
that is authority and names no author.

**Detection.** `revocation_epoch` and the derivative-invalidation rule assume someone revokes, which assumes
someone noticed.

**Missing decision.** Who issues a `ProjectionGrant`, at what consequence class, and where does
`recipient_scope` come from.

**Required contract.** Issuance is a C2 act released by C04; `recipient_scope` and `purpose` are resolved from
a `ParameterAuthority`, never from the granting executor's own text; the grant carries the three epochs and is
re-read at every read of the derived `Projection`, not only at write.

#### AS-M1-03 · (b) · `InstrumentCalibration` has no named writer, and it is evidence history
**Confidence: high.**

DIRECTIVE §8.22 forbids unreviewed self-modification of *"audit records; evidence history; … or the mechanism
that decides whether a self-change is safe."* `InstrumentCalibration` (§2.2) holds every checker's
planted-defect result, its paired clean-case refusal rate, its chance-corrected agreement, its rubric version
and its next re-run date. §11 item 9 makes a model change invalidate it, so it is the object that decides
whether a stored verdict may still be trusted. **No writer is named.** M1 is alone in this: M2 assigns the
equivalent to `CT-INSTRUMENT` and states *"no evaluated desk may write to them"*; M3 makes the acceptance
policy a versioned artifact external to every procedure, changeable only by an irreversible-class self-edit;
M4 classes instrument change C5. Classed (b) rather than (d) because the intended writer (C06) is inferable
from M1's own §7 F-4.5, where C06 owns the judgment.

**Required contract.** The calibration writer is C06 or a dedicated instrument custodian, excluded from every
producing path; a calibration write is a protected change.

#### AS-M1-04 · (b) · Six reasons multiply the channels AS-M1-01 travels on, and M1 concedes the direction
**Confidence: high.** §10: *"Negative on surface area: more executors means more inter-executor channels, and
the channel is a documented propagation path (R4 F8)."* §10 also concedes that the R3 consequence-class reason
*"will create more executors than the founder's five would, because it fires on a common shape — draft versus
release."* Not a defect standing alone; it is the multiplier on AS-M1-01 and the two must be read together.
Recorded so that a reader who fixes AS-M1-01 knows the fix must scale with executor count.

---

### M2 — chartered persistent agents

**W6: insufficient. W10: insufficient.** The narrowest new attack surface of the three agent-bearing
candidates, and the most honest accounting of the surface it does add.

#### What landed
M2's carried-memory design is the only structural answer to R1 F-10 among the candidates that carry standing
memory at all, and its argument is exact: every entry is a `Ref` plus typed fields plus `valid_until`, there
is **no free-text field in any class**, each class has one writer, writes are append-only, and the cap is
checked **at write** rather than trimmed at read (§5.4, against R1 F-03). *"Because every entry is a Ref,
there is nowhere for a plausible false statement to land"* is correct as stated, and M2 names the residual
honestly — an attacker who can file a real complaint creates a real standing entry, which is a false
complaint rather than poisoning. R-2 makes `eligibility_ceiling` a permissions boundary in the AWS sense that
grants nothing, sourced to R4 F2. And M2 **refuses the tempting charter**: no standing reviewer, because its
carried record would be a contamination channel; no standing admitter, because it could defend its own mandate
against admission narrowing. Both refusals cut against the design's own instinct and both are correct.

#### AS-M2-01 · (b) · The published reachability route is an attacker-reachable write path into a capped store, and volume is the unaddressed axis
**Confidence: medium-high.**

**The passages.** §2.1 makes `reachability` a mandatory charter field: *"How an outside party contacts this
desk **without knowing the company's internal topology**."* §10 concedes the surface: *"a charter's published
reachability route is an inbound attack surface — it is, deliberately, a channel an untrusted party can
reach. Its intake path is where R1 F-10's poisoning case actually arrives, and it is why no model may author a
standing entry."* §5.2's counterparty-standing class names its sole writer as *"the admitted intake path
only"*. §5.4 makes each class carry a hard entry and byte cap checked at write, and *"a write that would
exceed it is refused, and the holder must dispose of an entry explicitly."*

**The attack, which is not poisoning.** M2 has closed content. It has not closed volume. An adversary filing
many well-formed complaints through the published route creates many genuine standing entries, each of which
is legitimately written. When the cap is reached, the next write — from a legitimate complainant — is
**refused** until the holder explicitly disposes of an existing entry. M2's design choice here is correct
against the failure it was aimed at (an index trimmed on read is an index whose omissions nobody observes) and
it converts a silent-loss failure into a refused-write failure at exactly the object whose purpose is to
guarantee an outside party can always reach someone.

**Path to harm.** CAP-42's guarantee — the reachable party six months after closure — is the single capability
M2 says most justifies its existence, and it is the one an adversary can exhaust.

**Detection.** The refused write is visible, which is why this is (b) and not worse.

**Containment.** None stated.

**Required contract.** A per-counterparty and per-origin-channel sub-cap so no single party can consume the
class; and a stated behaviour on cap exhaustion that preserves intake (overflow to a named destination with an
alarm and a reader, which M2 already specifies for other queues via R5-10).

#### AS-M2-02 · (b) · The ratchet is closed against the charter's record and left open against the approval set
**Confidence: high.**

M2's mechanism half is good and specific: *"the `Charter` record has no field that a performance result can
write"*; `eligibility_ceiling` is writable only by the capability owner through an amended grant; and the
monotonic-exposure check is *"the set of actions instances under a charter may take without approval in month
12 must be identical to month 1 unless an amended grant with a named approver exists."*

**What it misses is the arm R4 names explicitly.** R4's TC-25 verdict: *"The gap it leaves: the accumulated
**approval set** can move an action into a lower supervision class without the executor's record changing at
all."* R4 failure case 8 is the mechanism — repeated "don't ask again" answers accumulating repository-wide
allow rules with no expiry, *"driven by prompt fatigue"*. **M2 nowhere states that an approval expires.** M1
§3.4 does (*"Approvals expire. An approval with no lifetime is a grant, and grants expire"*), and M4 §6.2 does
(*"Every approval in M4 carries an expiry"*).

**Path to harm, and it lands on M2's own F-6.** A week of founder absence is, in R4's words, *"a week in which
the approval ratchet of TC-25 cannot be corrected by the only person who can correct it."* M2's F-6 parks
three classes and says nothing about approvals granted during the absence. M1 §7 F-6 item 6 carries exactly
this rule; M2 does not.

**Required contract.** Approvals carry an expiry. The monotonic-exposure diff is over *effects releasable
without a human*, not over the charter's declared ceiling — the ceiling is precisely what the ratchet does not
touch.

#### AS-M2-03 · (b) · No metered-path observer — the rule is inherited and unenforced
**Confidence: high.** §10: *"Provider dependence. Identical to S1.0."* Per R8 W-5 / FAL-10 the
subscription-to-metered path is one in-product setting away at both providers, surfaced at the moment of
exhaustion, and *the package's no-silent-fallback rule currently has no mechanism*. M1 §11 O-1 names an
observation point and declines to claim prevention; M3 §10 makes the account setting an observed fact with a
named observer and a journal entry on change; M5 makes it the `credit-setting` interest and states honestly
that *"it observes; it does not prevent a person from flipping the setting."* M2 names nothing. Recorded as
**unenforced**: a documented rule with no mechanism, reaching unauthorised spending (DIRECTIVE §7 Phase D)
and W4's no-silent-fallback condition, which is another reviewer's dimension.

#### Note on M2's own blocking items
M2's §11 raises two (d)-class items against itself — whether a model may hold a desk carrying external
standing, and the size and lapse point of each reserved lane — and routes both as founder decision packets
with triggers and failure modes. From this lane's dimensions both are correctly classed and I add nothing to
them. The first is the security-relevant one: an acknowledgment issued in the company's name with no standing
behind it is, as M2 says, worse than a delay.

---

### M3 — workflow-first, no agents

**W6: sufficient, with residuals. W10: insufficient, narrowly.**

This is the only candidate on which I return **sufficient** for W6, and the reason is structural rather than
diligent: M3 removes the subjects of the failures rather than defending against them.

#### What landed
- **Non-composition rather than attenuation.** §6.2: *"A task needing three permissions is three effect steps,
  and the union never exists anywhere. There is no helper, so nothing inherits. The four default inheritance
  paths documented in this runtime are all properties of subagent spawn [R4 F5] and none of them has a subject
  in M3."* This is the correct reading of R4 F5 and it answers protocol §5 item 6 with *refused, not minted*.
- **Credentials only at the gate**, and the `model` step kind holds none by declaration in the step table.
- **Control flow trusted, model output data** (invariant 1), which is the CaMeL shape whose price M3 pays
  openly: *"M3 pays that price by construction and does not hide it"* — 77% against 84% undefended, R2 F-09.
  M3 is the only candidate for which the 7-point cost is a structural commitment rather than a quotation.
- **The only candidate that closes R4 §9 Q2 outright** — who owns the file that grants the next worker its
  tools. §3: a model step may *draft* a procedure; *"the draft is not executable. It becomes executable only
  when its test suite passes and a human capability owner accepts it, which is an irreversible-class workflow
  under CAP-46."* CVE-2025-54135's create-versus-edit asymmetry has no analogue here.
- **The decorative-declaration loophole closed at admission**, written against this repository's own history of
  44 unbacked capability declarations (R3 F60). No other candidate names an admission-time resolution of a
  declared grant against the grant policy.
- **The promotion boundary rather than a screen**, which is the correct response to R1 F-10, and M3 states what
  it does not buy.

#### AS-M3-01 · (b) · The declared branch set is a producer-selectable channel, and M3's strongest claim does not cover it
**Confidence: high.**

**The passages.** Invariant 1 (§2): *"No value produced by a model can select a branch **outside the declared
branch set**, name a destination, author a parameter the consequence class is computed from, or cause another
model call."* §3 step 3: *"The guard, a pure function, selects the next step from the branch set the procedure
declares."* §10 strength 1: *"The verification boundary is a record, not a claim. Checker inputs are delivered
by a loader and recorded. No other arrangement in this round can make 'the checker did not read the rationale'
a fact."*

**The gap.** Inside the declared set, a model-authored typed value *is* the selector. Where a procedure declares
`{review-lite, review-full}`, or `{escalate, auto-accept}`, or two acceptance strengths for one artifact, the
producing step selects its own downstream treatment through a typed field. M3's claim about checker **inputs**
survives intact; the natural reading of it — that checker **selection** is also a record rather than a producer
choice — does not. R5 §8 states the governing rule: *"if a router selects the verifier, the router is inside the
verification boundary, and a candidate whose routing component can choose who checks its own work has not
achieved procedural independence."* In M3 the router is a pure function over a producer-authored value.

**Detection.** The journal records which branch was taken, so this is diagnosable and bounded by the declared
set — hence (b).

**Required contract.** Procedure admission refuses a branch set in which a model-authored value selects between
different acceptance strengths for the same artifact. Acceptance-strength selection is a guard over journal
state and over the consequence class, never over a model output.

#### AS-M3-02 · (b) · The unclassified custodian may authorise effects one at a time, with no stated ceiling, on evidence assembled from untrusted input
**Confidence: medium-high.**

**The passages.** §7 F-1 step 3: `no_match` routes to `unclassified-work/v1`, whose steps are *"bound the
question → gather evidence through model steps that hold no credentials → produce a typed decision packet →
route to the named triage custodian → the custodian either accepts a one-off disposition, **authorises a
bounded sequence of effect steps one at a time**, or commissions a new procedure under CAP-46."* §11 open item
2 leaves *who* the custodian is as a founder decision. Nothing states *what* the custodian may authorise.

**The attack.** F-1's adverse variation: the malformed, partly false report from an untrusted channel. M3's
parameter path is closed — a model step *"may never supply a value that the consequence class is computed
from"* — and that is the right boundary. What is not closed is the **narrative** path: the decision packet is
assembled by model steps that read the attacker's document, and the human custodian's authorisation is the
thing M3 leans on hardest for exactly the work M3 is weakest at. R7 F15 puts the human anchor at 5–65% any-two
agreement, which M3 itself calls *"its own weakest point on evidence"* (§6.1).

**Why it matters more in M3 than elsewhere.** M3 routes **every** unknown job through this one path and
concedes it: §10 weakness 1, *"Unknown work costs a person. M3's F-1 answer has a human in the loop for every
effect on unclassified work."* The concession is framed as a throughput cost. It is also a concentration of
authority: one custodian, unbounded in class, on the highest-variance and lowest-evidence work in the system.

**Required contract.** A stated per-class ceiling on what one unclassified-path custodian may authorise without
a second party — at minimum, that C4/C5-equivalent effects out of `unclassified-work/v1` require the founder or
a professional, which M3's own §3 rule for irreversible no-answer behaviour already implies and does not state
for this path.

#### AS-M3-03 · (b) · A false journal entry's blast radius is stated and unmeasured; the containment is a person
**Confidence: high.** §5: *"a wrong fact accepted by a person is still wrong, and the blast radius of a false
journal entry in M3 is every later step that reads that field. The measurement that would size it is unrun."*
Correctly stated by M3; recorded here because it is the residual that survives M3's strongest mechanism, and
because M3's containment for it is the instrument M3 itself measures at 5–65%.

#### AS-M3-04 · (b) · AS-X-03 in reverse: M3 has the mechanism and declines the claim
**Confidence: high.** M3's step table marks `model` as *"May release an effect: **No**"*, while `02` §4 classes
model-provider input as C2 and §8.2 calls a provider request external disclosure in its own right. M3's
per-step declared read set delivered by the loader **is** the destination-clean construction §8.2 requires —
M3 is the candidate best placed to claim it and the only one whose step table denies it outright. Correcting
the row costs M3 nothing and gains it the one place where its architecture is strictly stronger than its text.

---

### M4 — hybrid by consequence class

**W6: insufficient** — sufficient on the composition half and defeated by an internal contradiction at the
gate. **W10: insufficient.**

#### What landed
M4 carries the strongest single idea in the round on W6. `ConsequenceDerivation` (§2.2) computes the class from
four kinds of input *"the acting executor cannot author"* — resolved parameters from `parameter_authority_refs`,
the destination as the gate sees it, selector closure over conflict claims and deletion scopes and open
obligations, and a declared floor that *"may only raise the derived class, never lower it"* — over the **frozen
bytes** rather than a description of them, and **recomputed at the effect** inside the ordered release
transaction, where *"a mismatch **parks** and never resolves downward."* That is R4 F1 and R4's tightening of
TC-24 (refusal observed at the effect, not at the spawn) implemented rather than quoted. The rejected-source
table is R4 F4's test applied in full. Four further firsts, each unique to M4 in this round:

- It is the **only** candidate that carries `02` §4's classification of provider input forward (§2.2 rule 2).
- It is the **only** candidate whose **checker selection** is derived rather than producer-influenced: the
  verification floor is the right-hand column of §4.1, keyed on a class the producer cannot author. This is
  the structural answer to AS-X-01's neighbouring problem, and M4 gets it without arguing for it.
- It is the **only** candidate that carries R4 TC-25's *approval-set* arm: *"Every approval in M4 carries an
  expiry"*, with the week-one/week-four measurement registered rather than discovered (§6.2).
- It classes its own routing table, floors, holder set and derivation function as **C5** (§6.5) — the clearest
  §8.22 protected-set answer in the round.

It also cites this repository's own `scripts/classify.mjs` warning against itself — *"Two implementations of
risk classification will disagree, and you find out during the incident"* — and states the invariant that
follows: one function computes the class or the guarantee is void.

#### AS-M4-01 · (d) · M4's derivation makes every model call a C2 effect, and M4's mapping table then requires C04 to release it
**Confidence: high.**

**The two passages, in M4's own text.** §2.2 rule 2: *"**The destination** — `destination_contract_ref` and the
egress identity as the gate sees it. **Any non-company destination reaches C2**, including **provider prompts**,
search queries, URLs and telemetry, which the specification already names as disclosure destinations."* §4.1,
C2 row: *"May RELEASE: **C04 only**, on destination-clean context or deterministic rendering of permitted
fields."*

**The consequence.** Every **E** in M4 is a model call. Every model call has a provider prompt. Every provider
prompt is a non-company destination, therefore C2, therefore releasable only by C04 on a destination-clean or
deterministically-rendered payload. Read literally, **every ephemeral worker's every turn is a C04 release**.
M4's own fixtures dispatch E workers freely — §7.3 has a helper E preparing an outbound message, §7.1 has E
steps on unknown work — and none of them mentions a C04 release for the model call itself.

**Why the obvious escape is closed.** The available exemption is "a model call is *preparation*, and §4.1's C2
row governs *release*". `02` §8.2 forecloses it: *"A model-provider request **is itself external disclosure**
even when all tool command networking is disabled."* Taking the exemption relaxes a fixed boundary without a
decision packet, which W2 fails harder for than for anything else. Refusing the exemption makes the system
unbuildable as specified.

**Path to harm.** Not an exploit; a boundary that an implementer must resolve by inventing policy, at the
highest-frequency outbound path in the system. Whichever way it is invented, one of M4's two central claims —
that the class is computed from what the actor cannot author, or that C2 releases only through C04 — stops
being true, and nothing in the candidate says which.

**Missing decision.** Whether the provider channel is a pre-authorised C2 release against a standing
`DisclosureContract`, or an exemption, or a sixth thing.

**Required contract, and M4 is one sentence from it.** State that the provider channel carries a standing
`DisclosureContract` under `02` §8.2; that the loader's class-narrowed projection is the destination-clean
construction discharging it; that a model call is therefore a pre-authorised C2 release whose per-call gate is
the projection's conformance to that contract rather than a C04 transaction; and that amending the contract is
C5. M4 already has every part of that except the sentence.

#### AS-M4-02 · (b) · The `ConsequenceDerivation` record names no writer
**Confidence: high.** §2.2's payload carries `derived_class`, `derived_at`, `derivation_fn_version`,
`recomputed_at_release` and `mismatch_disposition?`. §6.5 protects the derivation **function**, the §4.1 table,
the holder set and the floors at C5; it does not protect the per-operation **record**. M4 has zero occurrences
of "audit", "append-only", "immutable" or "tamper" anywhere in the candidate. Classed (b) rather than (d)
because the recompute-and-park rule contains the exposure: a prepare-time `derived_class` that was authored
cannot survive the release-time recomputation, which parks on mismatch and never resolves downward. The
residual is `mismatch_disposition`, which is the one field whose value decides what happens *after* the park.
**Required contract:** the record is written only inside the release path; `mismatch_disposition` is writable
only by the party owning the park, never by the preparing structure; and the record is append-only, which M4
should say because it says it nowhere.

#### AS-M4-03 · (b) · Composition across unjoined records is unsolved, and M4 is the candidate for which that matters most
**Confidence: high.** §4.1 catches composition **within one causal episode** (the episode carries the maximum
class reached) and **across a shared entitlement or population** (the `ConflictClaim` join on canonical
business keys). *"Across unrelated episodes with no shared key, M4 does not detect composition"*, and §10 calls
it *"M4's sharpest weakness and it is stated rather than mitigated."* R4 §9 Q4 records it as open for the field:
read plus read plus send is three low-class actions and one disclosure, and nothing in a per-action class
detects the composition. M4's honesty is correct and the consequence is specific to M4: its headline sentence
— *"what an action can do to somebody decides who carries it"* — is true per action and false per campaign,
and M4 is the only candidate whose entire guarantee is per action. Its §11 concedes this as one of three open
(d) items; I agree with the concession and record that it is the one an adversary uses.

#### AS-M4-04 · (b) · No metered-path observer
**Confidence: high.** §10: *"M4 depends on no provider feature not already in the specification, and on no
second model family."* Nothing observes the account setting. Same finding and same reasoning as AS-M2-03.

#### AS-M4-05 · (b) · Nine intake addresses are nine published inbound channels, and M4 does not say so
**Confidence: medium.** `StandingHolder.payload` carries `intake_address` (§2.5) and the existence test's part
(b) is *"an outside party has a right to reach the company about it."* §10's weaknesses name the Conway risk —
*"Nine holders is a roster shape"* — and say nothing about the inbound attack surface that M2 names for the
identical object. The volume argument of AS-M2-01 transfers, and M4 has no stated cap at all on what an intake
may write, where M2 at least has a write-time cap to be exhausted.

---

### M5 — subscription-activated capabilities around a shared record

**W6: insufficient. W10: insufficient.** M5 carries the sharpest containment idea in the round and the two
sharpest unclosed holes.

#### What landed
- **Trust class is a gate on what an entry may *activate*, never a weight on a ranking** (§2.1, §5.3). This is
  the correct reading of R1 F-10, which measures provenance ranking as indistinguishable from no defence at its
  shipped weight and utility-destroying at the weight that works. M5 is the only candidate that states the
  gate-versus-weight distinction explicitly, and it names the price: seven points of task utility plus an
  unmeasured false-exclusion rate, measured in the same session.
- **No direct model-to-model channel exists.** Activations do not message each other; they write entries under
  writer keys and other interests arm on them. AS-M1-01 has no subject in M5. Together with M3 this is the
  round's clearest structural divide.
- **Eleven entry kinds, one sole writer each, append-only, single-writer-keyed**, with the founder's five
  constituents refuted as sufficient and authorization-and-recipient-scope named as the dominant measured gap.
- **`Question` and `Contradiction` as first-class entries with custodians**, and a `ContradictionSet` that
  retains both claims rather than picking a winner.
- **The sharpest self-falsifier in the round**, stated in §1 and §7 F-2: *"no arming condition may call a
  model"*, and *"if that rule were relaxed for even one precondition class, M5 would become the most expensive
  candidate here."*

#### AS-M5-01 · (d) · The untrusted-input gate contradicts the investigation path meant to discharge it, and the contradiction is the laundering route
**Confidence: high.**

**The passages, which cannot both hold.** §5.3 rule 1: *"An `untrusted-external` Fact may be a precondition
only for interests of `effect_class: read_only`. It can never gate an outward effect and can never serve as a
discriminator."* §7 F-1 adverse A: *"The entry is written with trust class `untrusted-external`. It arms
`investigate-untrusted-report` and **nothing else**, because §5.3's gate forbids an untrusted entry from gating
anything above `read_only`. The investigation seeks an out-of-band corroborant; **on success a new attested
Fact is written** and the untrusted entry is linked as `prompted_by`, never promoted."*

`effect_class` is a closed ordered enum (§2.2): `read_only` · `internal_artifact` · `outward_draft` ·
`outward_release`. Writing an entry is not `read_only`. And per §2.1's table the sole writer of an
`attested-external` Fact is *"the capture identity of the adapter or person who observed it"* — which an
activation is not.

**The fork an implementer faces.** Either (i) untrusted entries really may arm only interests that write
nothing, in which case no investigation can ever be armed by an untrusted report and untrusted external
material is inert and unhandled — which contradicts F-1's own worked adverse variation; or (ii) the
investigation writes, in which case §5.3's gate carries an unstated exception, and that exception **is** the
promotion path from untrusted to attested.

**Path to harm under (ii), which is the reading F-1 actually uses.** The attacker's report arms
`investigate-untrusted-report`. Its production mode is bounded model work over the attacker's text. The model
judges whether an out-of-band corroborant was found. On that judgement a new `attested-external` Fact is
written. That Fact's trust class now clears §5.3's gate, so it may serve as a precondition for interests at any
effect class including `outward_release`. **§5.3 rule 2 requires a discriminator only for entries gating above
`internal_artifact`** — so the promotion event itself carries no required discriminator, and the discriminator
that would eventually run does so on the laundered entry, which now looks attested.

**Why the `prompted_by` link does not close it.** Lineage makes the promotion diagnosable after the fact. It
does not prevent it, and R1 F-10's whole point is that the poisoned entry carries no attack signature to
diagnose.

**Detection.** `prompted_by` lineage, after the fact.

**Containment.** The `read_only` gate, which is the thing in contradiction.

**Missing decision.** May an activation promote an entry's trust class, and if so under what authority and
against what non-model discriminator.

**Required contract.** A promotion from `untrusted-external` to any higher class is an **effect** with its own
class, its own named non-model discriminator that runs before the write, and a writer that is not the
investigating activation. And state the rule M5 currently lacks entirely: **a `derived` entry's trust class is
the floor of its inputs' trust classes.** Without that rule, any activation reading one untrusted input can
emit a `derived` entry that outranks its own evidence.

#### AS-M5-02 · (d) · A self-admitted trial interest declares `writer_keys`, and nothing says they must be disjoint from the existing sole-writer assignments
**Confidence: medium-high.**

**The passages.** §2.2 makes `writer_keys` — *"what it will write"* — a mandatory field of every standing
interest, alongside `precondition`, `effect_class`, `production_mode`, `requires_grant` and `budget`. §7 F-1
step 8: *"**DECISION, graduated:** proposals at `read_only` and `internal_artifact` are admitted **under a
standing mandate as an expiring bounded trial with mandatory review**; proposals at `outward_draft` and
`outward_release` require a human approval."* The proposal itself is emitted by the `triage` interest as an
`InterestProposal`. §2.1's table assigns exactly one sole writer per entry kind.

**The gap.** An `InterestProposal` is a model-authored control-flow object: a precondition over the Record, a
production mode, a budget, and a declaration of what it will write. At `read_only` and `internal_artifact` it
becomes live and executing with **no human in the loop**. Nothing in M5 states that the admission check
refuses a proposal whose `writer_keys` collide with, or extend, the sole-writer assignments of §2.1. M5's own
§10 identifies this as the irreversible part of the whole design: *"**High for the assignment of authority over
each record field**, and that assignment is the irreversible part."*

**Why this is §8.22's protected set.** DIRECTIVE §8.22 forbids unreviewed self-modification of *"permission
boundaries"* and of *"the mechanism that decides whether a self-change is safe"*. In M5 the writer-key
assignment **is** the permission boundary over the Record, and the armed-set computation over preconditions
**is** the mechanism that decides what runs. A model-authored object that can acquire either, without human
approval, reaches both.

**A second reach on the same path.** Even without a writer key, a trial interest at `internal_artifact` with
`production_mode: bounded model work` decides *when* content is sent to a provider and *which* projection goes
with it. Under AS-X-03 that is an outward disclosure. So a model-authored object with no human approval governs
a disclosure channel.

**Detection.** `interest-review` retires unused interests and re-tests pinned ones (§11 item 5), which is a
review cadence rather than an admission check.

**Missing decision.** May a trial interest declare a `writer_key`, and what does the admission check refuse.
M5's §11 open item 2 half-sees this — it asks whether a trial may **auto-renew** — and does not ask what a
trial may **claim**.

**Required contract.** `writer_keys` are assigned only by the authority that assigns them in §2.1 and are
refused to any proposal; a trial interest may write only into kinds whose writer is already "any activation"
(`Question`); the admission check is deterministic and its refusal names the failed predicate, as every other
refusal in M5 does.

#### AS-M5-03 · (c) · Arming is unstoppable by design, which is also the amplifier an adversary rides
**Confidence: high.**

**The passages.** §3.1: *"No component may prevent an interest from arming. The Admission Authority holds no
write access to `Fact`, `Constraint` or `Obligation` entries, so it cannot make a precondition false."* §3.2:
it may not *"decide an interest is wrong"* — *"refusal is by closed predicate set; a refusal with no named
failed predicate is invalid"*. §7 F-2: the Authority *"may never shed the 50% due-service floor or the 15%
continuity, security and grievance reserve."*

**The composed consequence.** There is no component in M5 with authority to stop a correctly-armed,
correctly-predicated activation in a protected class, and no predicate on which "this arrival pattern is an
attack" can be refused. The design is deliberate and its reason is good — §3.1 is written against R5-02's
measured cost, a monitor acquiring *"broad executive power … the power to violate … opportunistic problem
solving"*. Against an adversary, the same clause removes the only place a stop could be applied.

**M5's three bounds and their attacker-facing weakness.** §3.4: a per-cause allowance *"fingerprinted by stable
cause and scope rather than by wording or by a new identity"*; the non-borrowable protected due-service share;
and a counted unmatched pool. The first is the whole defence against a determined party, and its key — the
"stable cause and scope" — is chosen from attacker-supplied material. The second is the class an adversary
rides precisely because it cannot be shed.

**M5 states the residual honestly and I do not improve on it.** §3.4: *"T07's own assessment of C's equivalent
bounds is that they 'defeat simple infinite recursion. They do not yet establish useful progress under
sustained novel disturbance.' That is true of M5's bounds too."*

**Class (c) rather than (d), and the qualification.** M5 incorporates a falsifying test by reference —
*"The falsifying test is T07's, unchanged"* — without restating it. Protocol §5 requires a (c) to carry an
adequate evaluation protocol: baseline, unit, repetition, stopping rule, owner. None of those is legible from
M5 alone, so the classing rests on a document this review did not read. Recorded as (c) with that limit stated.

**Required contract.** Restate the protocol in the candidate, and give the Admission Authority one refusal
predicate it currently lacks — a per-origin arming rate — so that refusal-by-closed-predicate remains possible
under attack without reintroducing the monitor R5-02 warns about.

#### AS-M5-04 · (b) · The producer's own write arms its checker, and the tie-break selects the weakest one
**Confidence: medium-high.**

**The passages.** §7 F-4: *"The producer writes `submitted`. That transition arms `check`."* §2.1's
`AcceptanceState` row limits producers correctly: *"producers may write `submitted` and nothing else"*. §3.3
item 5: *"Ties: **narrowest sufficient effect class**, then earliest latest-responsible-time, then earliest
arming instant, then entry id."*

**The gap.** A precondition is *"a conjunction of typed predicates over entry fields"*, and the producer
authored the artifact and the entry fields describing it. Where more than one check interest exists — which
M5's own catalogue implies, since `check` serves CAP-10 and CAP-11 among others — the producer's typed output
determines which arms. On a tie, §3.3 selects the *narrowest sufficient effect class*, which for checking
means the **weakest** check. R5 §8 is directly on point: a component that can choose who checks its own work
has not achieved procedural independence.

**Contrast.** M4 derives the verification floor from a class the producer cannot author; M3 fixes the review
step in an immutable, human-accepted procedure (subject to AS-M3-01's branch-set residual).

**Required contract.** A `check` interest's precondition reads only fields the producer could not author —
the same rule §5.3 already applies to consequential preconditions — and the tie-break for check interests
inverts to *strongest sufficient*, not narrowest.

#### AS-M5-05 · (b) · The metered-path interest observes and does not prevent, correctly stated
**Confidence: high.** §7 F-2: the `credit-setting` interest arms on a changed or stale-beyond-24h observation
and *"halts new launches in that class"*, and M5 says plainly *"It observes; it does not prevent a person from
flipping the setting."* This is the strongest treatment of R8 W-5 / FAL-10 in the round and is recorded as a
strength with a correctly disclosed limit, not as a finding against M5.

---

## Part 3 — S9, cross-candidate

### The attack surface each candidate adds that the others do not

| Candidate | Surface unique to it |
|---|---|
| **M1** | The inter-executor consultation channel (unfiltered prose between model instances, one of which holds effect grants), and the `Projection` / `ProjectionGrant` pair — which M1 itself names as its highest-risk object and leaves without an issuer |
| **M2** | A **published inbound route per desk**, deliberately reachable by untrusted parties, and the round's only standing carried memory. M2 is the only candidate that names its own new surface in its own §10 |
| **M3** | A growing catalogue of **executable procedures**, each of which is control flow a model may draft; and one human custodian at the unclassified path with no stated class ceiling |
| **M4** | **One derivation function** on which every authority decision depends, correlated across the whole company — M4 names this itself — plus nine intake addresses with no stated write cap |
| **M5** | The **Record as a write surface** reachable by every adapter capture identity and every published channel, plus a self-admitting trial-interest path that can reach the permission boundary over that Record |

### The single most exploitable path in each

- **M1 — AS-M1-01.** Injected prose crosses from a provenance-isolated reader into the identity holding three
  grants, through a channel M1 declares typed and does not filter, defended by a rule M1 itself proves cannot
  be model-enforced.
- **M2 — AS-M2-01.** Not content but volume: the published route plus a write-time cap turns an adversary's
  legitimate-looking complaints into refused writes at the one object whose purpose is guaranteed reachability.
- **M3 — AS-M3-02.** Not the parameters, which are closed, but the **narrative** into a single human
  custodian's effect authorisation on the least-evidenced work in the system.
- **M4 — AS-M4-03.** Composition across unjoined records. M4's guarantee is per action; an adversary works per
  campaign. (AS-M4-01 is graver but is a coherence failure, not an exploit.)
- **M5 — AS-M5-01.** The untrusted-to-attested promotion, judged by a model that read the attacker's text, at
  the one boundary M5's whole containment argument rests on.

### Mechanisms shared by three or more, and why the sharing is not corroboration

Ten mechanisms are shared by all five and are listed in Part 0. Every one traces to R4 (F1–F7), to R7 (F9,
F13, F15, AM-01) or to `02-authority-recovery.md` §4 and §6.2. Five authors of one model family read one lane
set and agreed. Per R7 F2, relatedness alone is sufficient for contamination; per R7 F13, three same-family
checkers return unanimous agreement on a family-shaped blind spot **every time**, and the unanimity is the
failure rather than the assurance. I am the same family. **The correct reading of the convergence in Part 0 is
one source with five copies, and a defect in R4, in R7, or in `02` §4 and §6.2 propagates into all five
candidates with nothing in this round positioned to catch it.**

Three consequences follow, and the first is the one I would act on:

1. **The divide that is structural rather than agreed.** Two candidates (M3, M5) have **no model-to-model
   channel**; three (M1, M2, M4) have one. That divide is not inherited from any lane — it falls out of each
   candidate's own shape — so unlike the ten shared mechanisms it carries independent information. Every
   propagation finding in this review lands on the side that has the channel.
2. **The gap none of the five inherited and none found.** AS-X-01. R7 named three channels into a checker —
   the rationale, the preferred conclusion, the shared record. All five closed all three. None closed the
   fourth, because no lane named it. That is what a single shared source set costs.
3. **What no candidate can supply and all five say so.** A second model family. Every one states the
   influence/error split and names the residual; none launders it. That is the round's cleanest collective
   result on this lane and it should survive into the synthesis verbatim.

---

## Out-of-scope notes

1. **Single model family, procedural independence only.** I authored nothing in this round and read no
   producer's self-assessment, session file or scratch directory. This is not an independent panel. Per R7 F13
   my errors are correlated with the authors' by construction.
2. **The `CP-nn` namespace does not resolve under `planning/specification/`.** M1 and M2 cite CP ids as
   already-existing package rules (CP-22, CP-74, CP-76, CP-77, CP-84, CP-99, CP-104, CP-109, CP-128, CP-132,
   CP-142, CP-153, CP-159, CP-167, CP-171). `grep -rl` finds them only in `research/F2/R8-contrarian.md`,
   `planning/F2/00-position-ledger.md` and the two candidates. They resolve to the position ledger, a Step 0
   artifact that quotes the underlying `05`/`06`/`07` text. I performed one bounded existence check (CP-84),
   which was load-bearing for AS-M1-02, and carried nothing else out. Whether the namespace's indirection is
   itself a traceability finding belongs to W14/W15, not to this lane.
3. **I read `02-authority-recovery.md` §8.1–§8.3** beyond the §4–§6 my brief named, because AS-X-03 and
   AS-M4-01 turn on §8.2's two admissible outbound constructions. Recorded so the extra read is visible.
4. **Out of scope and not pursued.** W4's cost dimension owns the metered-path findings' economic half; I
   recorded them only as unenforced-rule findings under W10. The CP-namespace traceability question, the
   novel-work base rate, and the concurrency-pin question are other dimensions' and I make no finding on them.
5. **Each candidate's §11 was read last**, after all findings above were formed. Where a candidate had already
   conceded a point I have said so and classed it as conceded — M1 O-1/O-2, M2 d-M2-1/d-M2-2, M3's three open
   items, M4's three open items, M5's two. None of my six (d)-class findings appears in any candidate's §11.
6. **No aggregate score, no ranking, no recommendation.** Dissent is preserved: M3's W6 **sufficient** rests on
   removing the subjects of the failures rather than on better defences, and a reviewer who holds that the
   unclassified-work custodian concentration (AS-M3-02) is an authority defect rather than a throughput cost
   would reasonably return **insufficient** for M3 on W6 as well. I record that reading rather than resolving it.
