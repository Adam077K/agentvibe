# F2 acceptance protocol — the work / agents / context / authority layer

> **Provenance — 2026-09-13.** This protocol was formed **before any F2 research lane read a source and before any F2 candidate existed**. It was formed blind of the two sibling Step 0 artifacts (`00-thesis-claims.*` and `00-position-ledger.md`), which another agent was writing concurrently; neither was read. No report under `research/` was read except where cited below. What was read, in order: [`planning/reviews/G-acceptance-protocol.md`](../reviews/G-acceptance-protocol.md); [`inputs/DIRECTIVE.md`](../../inputs/DIRECTIVE.md) §1, §3, §6, §7 (Phases C and D), §8.7, §8.8, §8.9, §8.12, §8.14, §8.16, §8.21, §9, §10; [`inputs/FOUNDER-THESIS-2026-09-13-agents.md`](../../inputs/FOUNDER-THESIS-2026-09-13-agents.md); [`planning/HANDOFF-F2-agents-work-layer.md`](../HANDOFF-F2-agents-work-layer.md) §0, §2, §3, §4; [`planning/02-architecture-selection.md`](../02-architecture-selection.md) §3 and §9; [`planning/specification/05-work-agents-skills.md`](../specification/05-work-agents-skills.md) headings and §1; [`coverage/capability-requirements.json`](../../coverage/capability-requirements.json) (CAP-01…CAP-46).
>
> **This is preparation, not acceptance.** Nothing here approves a candidate, and no "sufficient" this protocol can later produce is a runtime result.

---

## 1. Scope, freeze and independence

**SPECIFICATION.** The subject is one layer of an already-specified system: **how work is admitted, typed, staffed, carried, handed over and accepted** — work orders and task state, agents and whether they should exist at all, routing, authority, tools, skills, context engineering and shared state. The founder reopened exactly this layer and called his own account of it "only a thesis" that must be researched, challenged and possibly refuted ([FOUNDER-THESIS](../../inputs/FOUNDER-THESIS-2026-09-13-agents.md)).

**SPECIFICATION — the protocol is neutral between the thesis and its negation.** A candidate that concludes "capability-differentiated ephemeral agents around shared state" earns nothing by agreeing with the founder, and a candidate that concludes "a chartered persistent roster" or "no agents at all" earns nothing by contradicting him. Both are judged on the same probes below.

**Fixed unless a lane returns a specific falsifier**, per [HANDOFF §0.5](../HANDOFF-F2-agents-work-layer.md): the consequence and release boundary; evidence and acceptance; recovery; human responsibility; the founder-competence mechanism; whole-company scope. A candidate may reopen any of these **only** with a named counterexample routed to the founder as a decision packet ([DIRECTIVE §3](../../inputs/DIRECTIVE.md)), never by preference and never silently. A candidate that quietly relaxes a fixed boundary fails dimension W2 whatever else it achieves.

**Freeze rules.** This protocol is frozen now. The review subject is frozen at a commit SHA named in each Step 6 review. A criterion is never weakened because a candidate produced an inconvenient result; any amendment is appended below the frozen text with its source requirement, its date and its reason, and reviews state which version they applied.

**Reviewer independence — disclosed, never laundered.** Every author and reviewer available to this round shares one model family. Independence here is **procedural only**: separate context; reviewers who wrote nothing in Steps 1–5; and three standing bars — reviewers may not read the producers' self-assessments, may not read session files of the producing lanes, and may not read lane worktrees. Compute rather than trust: when a register says "all joins resolve", resolve them; when a validator reports green, mutate an input and confirm it can fail ([HANDOFF §4](../HANDOFF-F2-agents-work-layer.md)). Every review says this in its own words. A review that calls itself independent without this paragraph is void.

**Discipline inherited from the whole-plan protocol** ([G](../reviews/G-acceptance-protocol.md)), unchanged: judge **specified behavior**, not vocabulary; **rename every component into ordinary business terms** before judging it, so that "orchestrator", "router", "subagent" and "shared state" become "who decides what gets worked on", "who picks the worker", "who does it" and "the file everyone is supposed to trust"; **nothing gets credit for existing** — not a count of agents, not a large skill library, not a long document, not a passing check; **separate judgments per dimension, no aggregate score**, no majority-vote override, no presumed pass.

**Binding to capabilities.** Every candidate and the final synthesis must state, for each of the **46 capability ids** in [`coverage/capability-requirements.json`](../../coverage/capability-requirements.json) (CAP-01 Intent and commitments … CAP-46 Controlled system improvement), which production mode carries it and who accepts its outcome. A model that cannot say who accepts a refund (CAP-17), who signs a supplier commitment (CAP-24) or who owns a privacy request from a non-customer (CAP-22) is incomplete regardless of its elegance on software construction (CAP-10).

---

## 2. Dimensions

**SPECIFICATION.** Fifteen dimensions, each judged separately. Eleven are the minimum set this round was required to carry — the eight named in [HANDOFF §3, Step 0 item 3](../HANDOFF-F2-agents-work-layer.md) plus authority as boundary, founder attention and competence, and evidence quality. Four more (**W7**, **W10**, **W13**, **W15**) are added because the directive requires them of this layer and no other dimension reaches them; each such row states its reason in italics.

| # | Dimension | Concrete probe | Evidence needed · failure condition |
|---|---|---|---|
| **W1** | **Completeness for unknown future jobs** | Take a job the plan never anticipated — a customs classification dispute on a physical shipment. Follow it from the moment it becomes visible to the moment someone is accountable for its outcome. | A named admission rule, a typing rule, a staffing rule and an acceptance owner that all operate **without a human redesigning the system**. Fails if the answer is "the founder adds a new agent/skill/route", or if unowned work can rest in a queue. |
| **W2** | **Coherence with the fixed boundaries** | Hand the candidate and [`01-contract-kernel.md`](../specification/01-contract-kernel.md), [`02-authority-recovery.md`](../specification/02-authority-recovery.md) and [`06-knowledge-evidence-evaluation.md`](../specification/06-knowledge-evidence-evaluation.md) to two implementers. Ask each what "accepted" means and who may release an external effect. | Compatible answers. Fails if a local "done" in the work layer discharges an obligation, accepts an outcome, or releases an effect that [`02-architecture-selection.md` §3](../02-architecture-selection.md) assigns elsewhere — and fails harder if the candidate changed a fixed boundary without a decision packet. |
| **W3** | **Context integrity under summarization and handoff** | Summarize a run's context to a tenth of its size, hand it to a fresh attempt, and change one fact in the source after the summary was taken. | A context manifest carrying **what was omitted, what was summarized and what may have been lost**, not only what was loaded ([DIRECTIVE §8.12](../../inputs/DIRECTIVE.md)); a rule that detects the stale fact. Fails if loss is undetectable downstream, or if a summary can be trusted with no record of what it dropped. |
| **W4** | **Cost and capacity under subscription** | Price the candidate's normal week against its own comparators under roughly $200/month Claude Code plus $200/month Codex, with reset windows and a concurrency limit. Then make a lane hit a weekly cap mid-attempt. | Both **money spent and scarce capacity consumed**, separately ([DIRECTIVE §8.21](../../inputs/DIRECTIVE.md)); queued work and explicit fallback policy. Fails on any **silent fallback to a metered API**, on a token count offered as a capacity model, or on a design whose cost is only defensible at per-token prices. |
| **W5** | **Independence of verification under one model family** | Make the producer's rationale available to the checker in one arm and withhold it in the other, holding the artifact fixed. Plant a known defect. | A measurable difference between arms, and the known-defect control **failing** the always-pass checker ([`06` §6–§7](../specification/06-knowledge-evidence-evaluation.md)). Fails if "independent" means only a second prompt, a second name, or a second copy of the same context. |
| **W6** | **Authority as boundary** | Give a worker a task needing three tool permissions it does not hold. Then have it spawn a helper. | Explicit least-privilege composition and attenuation. Fails on any path where a component **grants itself greater authority** or **silently inherits all permissions of its creator** ([DIRECTIVE §8.16](../../inputs/DIRECTIVE.md)), including inheritance through a skill, an instruction bundle or a shared state record. |
| **W7** | **Reliability and durable work state** | Kill a worker mid-attempt after a partially completed external effect. Restart. Then start two attempts on one work order concurrently. | Checkpointing, idempotency, deduplication, partial-completion and compensation rules; a stated winner between concurrent attempts ([DIRECTIVE §8.17](../../inputs/DIRECTIVE.md)). Fails if resumption can duplicate an external effect or if task state can report success for work that stopped. *Added because this layer owns task state and no other dimension tests durability.* |
| **W8** | **Buildability** | Ask an implementer to construct one vertical journey — customer question to answered and recorded — using only the candidate. | Named contracts, records, transitions and module boundaries; no foundational choice left to construction. Fails when the implementer must invent who admits work, what a skill is, or how context is assembled. |
| **W9** | **Changeability** | Change the model, then the provider, then a tool's output schema, **with work in flight**. Then remove the candidate's central mechanism. | Migration path for in-flight work, retained uncertainty, rollback, and a removal criterion for every mechanism. Fails if a mechanism has no removal criterion, or if in-flight work must be abandoned or silently re-run. |
| **W10** | **Adversarial robustness of the work layer** | Poison a shared-state record; return a tool result containing an instruction; drive delegation depth and fan-out upward; corrupt a skill after it passed its test. | Trust boundaries that treat tool output as untrusted data ([DIRECTIVE §8.10](../../inputs/DIRECTIVE.md)), a delegation ceiling with a named owner, and skill provenance re-checked at use. Fails if shared state is writable by anything that can read it. *Added: [DIRECTIVE §7 Phase D](../../inputs/DIRECTIVE.md) names these attacks and this layer is their surface.* |
| **W11** | **Vision preservation** | Describe the candidate in plain language to a reader who knows business and not this architecture. Ask them what the system is. | They describe a company operating end to end. Fails if they describe a coding tool, a dashboard, a workflow product, or **a roster of digital employees** — the three narrowings named in [HANDOFF §0.1](../HANDOFF-F2-agents-work-layer.md) and the fourth the founder rejects by name. |
| **W12** | **Founder attention and competence** | Run a month of the candidate's normal operation. Count what reaches the founder and why. Then test whether he can still explain the business and detect a misleading summary. | A **designed** return of selected work, evidence and decisions to the founder, not a recommendation ([DIRECTIVE §1.6](../../inputs/DIRECTIVE.md), §8.18). Fails if the founder becomes a full-time reviewer, or if the only competence mechanism is that he may look if he wants to. |
| **W13** | **Alternative depth and comparator honesty** | Remove the candidate's defining mechanism and replace it with the simple baseline of §6. Name the problem that becomes materially worse. | A named problem, a measurable worsening, and a falsifier. Fails if the comparator was deprived of its legitimate strengths, or if at least four materially different models were not genuinely carried ([DIRECTIVE §7 Phase C](../../inputs/DIRECTIVE.md)). *Added: §9 "Alternative depth"; the founder's thesis is a candidate, not a conclusion.* |
| **W14** | **Evidence quality of this round's own claims** | Take the round's five most consequential claims. Check each against §7's rules. Change one planted influence and see whether the stated rationale changes. | Source, date, type, primary/secondary, confidence, conflicts, corroboration, expiry, invalidator ([DIRECTIVE §6](../../inputs/DIRECTIVE.md)). Fails on an inference presented as fact, on folklore cited as measurement, and on absence of evidence used as evidence of absence. |
| **W15** | **Capability binding and traceability** | Pick five capability ids at random from CAP-01…CAP-46 and one rejected alternative. Trace each into the candidate and back out. | Production mode and acceptance owner named per capability; every consequential choice traceable to a problem, evidence, alternatives and consequences ([DIRECTIVE §9](../../inputs/DIRECTIVE.md)). Fails on a link to a whole chapter in place of an operative answer. *Added: the round's outputs must bind to the 46 or the layer detaches from the company.* |

---

## 3. The six shared fixtures

**SPECIFICATION.** Every candidate is worked through all six, in the same words, with the same fixed boundaries. These are **review fixtures and required future evaluation cases, not executed results**. Each carries a required useful outcome **and** a matched adverse variation, so that refusing service cannot look like safety.

| Fixture | Required useful outcome | Matched adverse variation | What a candidate must show |
|---|---|---|---|
| **F-1 An unknown kind of job appears mid-build** | A supplier's contract obliges a data-deletion procedure nobody planned. It is admitted, typed, staffed and completed, with an acceptance owner. | The same job arrives as a malformed, partly false report from an untrusted external channel; and a second, genuinely spurious job arrives which must be refused with a reason. | The admission rule, the typing rule, the staffing rule, the acceptance owner, and the refusal path — all without a human editing the system. |
| **F-2 Demand at 4×** | Four ventures' worth of ordinary work proceeds at matched scope, with 1× and 2× measured under the same controls. | Two providers' allowances are consumed at 3×; one lane must be shed. | What is shed, by whose authority, what the founder sees, and what the added coordination cost per unit of work is at each level. |
| **F-3 A task needing three distinct tool permissions** | The task completes with least privilege — payment read, customer record write, outbound message send. | One permission is revoked mid-attempt; a helper is spawned that must not receive all three. | Permission composition, attenuation on delegation, behavior on revocation, and the record of which identity performed which effect. |
| **F-4 A verification the producer must not influence** | An artifact is accepted on evidence, by someone with no stake in it. | The producer's rationale and preferred conclusion are made available to the checker; and a known defect is planted. | The checker's stated inputs, the known-defect control failing, and an honest account of what "independent" can mean in one model family. |
| **F-5 A handoff across a capacity reset** | Work stops at a weekly limit and resumes days later, in a new session with no conversational memory, and completes correctly. | The pre-reset summary omits a decision; a source fact changed during the gap; one external effect was already released. | What context the resumed attempt may trust, what it must re-derive, how the released effect is detected, and who accepts the resumed work. |
| **F-6 The founder absent for a week** | Authorized work continues and useful outcomes are delivered; nothing irreversible is done in his name. | A decision needing only him arrives on day one, with a deadline on day four; an incident occurs on day five. | The queue rule, the latest-responsible-decision-time behavior, what proceeds, what parks, and the re-entry brief that restores his competence — not only his awareness. |

---

## 4. Negative controls

**SPECIFICATION.** A candidate is not accepted until the round has run these. Each adverse control is paired with a benign case it must **not** catch, so the protocol rewards discrimination rather than suspicion.

1. **Rename-only candidate.** Today's components relabelled — the same routing, renamed as "capability-differentiated agents". Must be detected as producing no behavioral difference. *Paired with:* a genuine change that happens to reuse existing vocabulary, which must pass.
2. **A shared source of truth nobody is forced to read.** A canonical document with no mechanism binding any attempt to it. Must fail. *Paired with:* a record whose loading is verified in the context manifest, which must pass.
3. **A checker that passes without checking.** Must fail the planted known-defect control. *Paired with:* a correct artifact, which it must still pass.
4. **An agent justified by a capability the fixtures never exercise.** "Isolated context" claimed where no fixture ever puts conflicting context in one window. Must be flagged as unjustified.
5. **A context manifest that lists inputs but not omissions.** Must fail W3 even if every listed input is accurate.
6. **An "independent" reviewer fed the producer's rationale.** Must be detected by the two-arm comparison in W5.
7. **A cost comparison that counts tokens but not scarce subscription capacity.** Must fail W4 even if the token arithmetic is correct.
8. **A job-title roster relabelled as capabilities.** "Marketing agent" renamed "content capability" with unchanged boundaries. Must fail; the test is whether the boundary follows work, authority, tools, context and knowledge, or follows a human department name.
9. **A router that admits everything.** Handles F-1 by accepting all work, including the spurious job. Must fail: admission without refusal is not admission.
10. **A fixture authored after the candidate.** Any fixture or measurement rule written once a candidate's result was known is void; fixtures are frozen with this document.

---

## 5. What a (d)-class missing decision means here

**SPECIFICATION.** Following [G](../reviews/G-acceptance-protocol.md), four classes are distinguished: **(a)** a specification concrete enough to implement and test; **(b)** a documented mechanism whose deployment is unverified; **(c)** an empirical hypothesis carrying an adequate evaluation protocol — baseline, unit, repetition, stopping rule, owner; **(d)** a **missing decision** without which an implementer would choose the system's meaning by inventing policy. Only **(d)** blocks.

Concrete (d)-class examples for this layer:

1. **No rule for who admits a job of an unknown kind.** F-1 has no named authority, or the named authority has no criterion, so the first implementer decides what the company will and will not take on.
2. **No authority named for a handoff's acceptance.** Work transfers, and nothing says who is accountable for the outcome afterwards — the giver, the receiver, or neither.
3. **Incompatible meanings of "done."** A work order's completion predicate and its acceptance owner's criterion can both be satisfied while the customer, the obligation or the external effect is not.
4. **No rule for what context a resumed attempt may trust after a capacity reset.** F-5 leaves it to the implementer whether a stale summary is authoritative, which decides whether the system can lie to itself.
5. **Skill selection with no removal criterion.** The library grows, selection degrades, and nothing specifies when a skill is retired or who decides — the failure [DIRECTIVE §8.9](../../inputs/DIRECTIVE.md) names explicitly.
6. **Permission composition undefined.** F-3's three-permission task has no rule for whether a composite grant is minted, borrowed or refused.
7. **No delegation ceiling with an owner.** Depth and fan-out are unbounded, or bounded by a number no component owns or can change accountably.
8. **No writer authority on shared state.** Two components may write one canonical field with no conflict rule, so "shared source of truth" means "last writer wins" in practice.
9. **No rule for in-flight work at a provider or model change.** W9's probe resolves only by an implementer's choice between abandoning and re-running.
10. **No stated winner between concurrent attempts on one work order**, so duplicate external effects are decided by timing.

A (d)-class finding is reported with its exact trigger, the resulting failure, the affected requirement, the missing decision and the evidence that discriminates. It cannot be offset by excellence on another dimension.

---

## 6. Comparators — every candidate is compared against both

**SPECIFICATION.** No candidate is judged alone. Each is compared, on the same six fixtures and the same fifteen dimensions, against:

**(i) The current S1.0 position** — no permanent roster; agents exist per work order; the production rule of [`02-architecture-selection.md` §3](../02-architecture-selection.md); sponsors rather than departments; attempt-local context with skills as versioned instructions; concurrency CP1 as specified in [`07-integrations-capacity.md` §5–§6](../specification/07-integrations-capacity.md). S1.0 receives no credit for being the incumbent and no penalty for being reopened.

**(ii) A deliberately simple baseline, B0** — one long-context session, plus deterministic scripts, plus one shared record in version control. **B0 is given its legitimate strengths and must not be strawmanned:** no handoff loss because there is no handoff; no routing error because there is no router; one context window that a person can read; the lowest plausible consumption of scarce subscription capacity; trivially buildable; trivially changeable, since removing a script is a deletion; and a record the founder can read end to end, which serves W12 better than any projection. B0 also gets its own retrieval scripts, its own checklists and its own human review. Its real weaknesses — context exhaustion, no parallelism, no permission separation, no independent verification — must be demonstrated on the fixtures, not asserted.

**The simple baseline wins, and the round must say so, when any of these holds:** B0 matches the candidate on all six fixtures at equal or lower founder attention and equal or lower capacity consumption; or the candidate's advantage appears only at a demand level these ventures will not reach, and F-2 at 1× and 2× shows no material difference; or the candidate's named advantage disappears once B0 is given the deterministic scripts it is entitled to; or the candidate's added coordination cost per unit of delivered work exceeds the loss it prevents. **INFERENCE.** If B0 wins, the correct output of this round is a smaller system, not a defense of the larger one — [`02-architecture-selection.md` §9](../02-architecture-selection.md) already commits to reducing the system in exactly that case.

---

## 7. Evidence rules for this round's research

**SPECIFICATION.** Every consequential claim in Steps 1–5 carries: source; source date; source type; primary or secondary; confidence; possible conflicts of interest; whether another source agrees; expiry; and what would invalidate it ([DIRECTIVE §6](../../inputs/DIRECTIVE.md)). A claim missing any of these is labelled a hypothesis, not cited as evidence.

Four additional rules specific to this layer:

- **Model-generation dependence is flagged.** A measurement of handoff cost, context loss or token overhead is a fact about the model generation and harness that produced it. Cited without its generation and date, it is folklore. Claims of the form "multi-agent systems cost N× more tokens" are **source claims** unless the method is published and reproducible, in which case they are measurements with a stated task distribution.
- **Folklore and measurement are distinguished in the label, not in the prose.** A widely repeated practitioner belief is recorded as a source claim with its propagation noted, never upgraded by repetition.
- **Vendor self-reports are flagged as conflicted** and may not be the only support for a mechanism's benefit.
- **Disagreements are preserved.** Where sources conflict, investigate definitions and contexts, prefer primary evidence, and if no conclusion is justified, retain the disagreement as a design input. Forced consensus is a finding against the round.

**UNKNOWN.** Whether the founder's five criteria for when an agent earns its existence are individually load-bearing is not established by this protocol and must not be assumed by any lane; W13 and fixture F-1 are where it is tested.

---

## 8. Disposition rules

**SPECIFICATION — what Step 6 reviewers may write.** For each of the fifteen dimensions, one word — **sufficient** or **insufficient** — plus findings. Each finding is classed **(a)**, **(b)**, **(c)** or **(d)** as defined in §5, with its governing requirement, the precise passage, the expected behavior, the counterexample, the evidence needed and the disposition. Reviewers state the subject SHA, their independence limits in their own words, and any truncation of their own return channel.

**What blocks.** Any **(d)**-class finding blocks acceptance of the layer. So does an insufficient judgment on W2 caused by a fixed boundary changed without a founder decision packet, and a failure of any negative control in §4. **(b)** and **(c)** do not block: a documented-but-unverified mechanism is recorded with its verification owed, and an empirical hypothesis is recorded with its protocol, baseline, unit, stopping rule and owner. No aggregate score exists, no dimension outvotes another, and excellence on fourteen dimensions does not offset a blocker on one.

**What the whole-package disposition may then say.** Only after the layer's own review may the deferred whole-package disposition be recorded. It may state that the package is a **scoped planning disposition**: that the specified behavior of the layer was checked offline against this protocol, that named findings remain open with owners, and that the fixed boundaries were preserved or explicitly reopened. It may not state that the system works, that the design is validated, that the architecture is proven, or that implementation may begin — the founder's hold on building stands until he lifts it in his own words ([HANDOFF §3, Step 6](../HANDOFF-F2-agents-work-layer.md)).

**Standing caveat, to appear in every review and in the disposition.** No runtime exists. Every "sufficient", "closed" and "repaired" is about **specified behavior checked offline** by reviewers of one model family with procedural independence only. Nothing in this round establishes runtime conformance, deployment readiness, actual fulfillment, or the business value of the intended system.

---

*Frozen 2026-09-13, before Step 1. Amendments append below with source requirement, date and reason; the text above is not edited.*
