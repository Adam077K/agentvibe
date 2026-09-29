# L13 — Countermodels for responsible company-scale work

Research date: 2026-09-12. Independent lane; architecture selection remains open.

**Observation:** I read only the three authorized vision inputs and routing instructions, without reading other lane reports or previous architectures. The ambition concerns responsibility across discovery, formation, production, sales, operations, maintenance, and closure. None of the alternatives below removes a lifecycle stage to appear cheaper. **Founder constraints:** preserve intent and truthful evidence, bound authority by consequence, preserve owner competence, and refuse work exceeding available attention.

**Finding, with moderate confidence:** those constraints do not establish the necessity of persistent agents, one universal business ontology, centralized execution, or internally producing every capability. The strongest challenge is that a responsible work system may primarily organize commitments, evidence, and institutional relationships. Whether that structure delivers the intended scale remains unmeasured.

## What the premise has not established

**Source claim:** Coase treats organizational boundaries as a comparison between costly internal coordination and costly market transactions, including discovery, contracting, inspection, and dispute resolution. **Inference:** falling generation costs cannot alone justify bringing every company function inside an agent organization; coordination and assurance costs may dominate. Conversely, buying services is no automatic simplification. [Coase’s 1991 lecture](https://www.nobelprize.org/prizes/economic-sciences/1991/coase/lecture/)

**Source claim:** financial auditing already distinguishes supporting and contradictory evidence, direct and indirect acquisition, and evidential quantity from quality. **Inference:** the vision’s categorical claim that nobody will sell an adversarial account is too strong. Independent assurance is an existing institutional pattern. This does not establish that an affordable, continuous, whole-company account is available, or that auditors eliminate producer incentives. [PCAOB AS 1105](https://pcaobus.org/oversight/standards/auditing-standards/details/AS1105)

**Inference:** complete documentation cannot reveal every unknown omission. A truthful account needs a declared observation boundary and an inventory of expected obligations; otherwise “nothing missing” is unfalsifiable. Similarly, preserving expressed intent is testable through promises, constraints, examples, and corrections; perfectly recovering unstated taste is not.

## Countermodel A: a company operated through records and cases

**Design proposal:** durable records hold commitments, evidence, decisions, deadlines, permissions, and exceptions. Deterministic transactions and scheduled procedures perform repeatable work. Cases organize evolving work; temporary model sessions or qualified people handle unresolved judgments. No persistent agent identities or departmental roster are required.

**Source claim:** CMMN explicitly complements predefined processes with case work that depends on evolving circumstances and discretionary decisions. **Inference:** choosing between rigid workflows and autonomous agents is a false binary; adaptive case handling is another control structure. The standard establishes representational mechanisms, not their success in this company. [OMG CMMN 1.1, scope and planning tables](https://www.omg.org/spec/CMMN/1.1/PDF)

Discovery creates experiments; formation tracks prerequisites; production assembles artifacts; sales records promises; operations reconcile observed outcomes; closure discharges refunds, retention, and supplier obligations. The same record discipline spans all stages while each keeps its own substantive standards. Execution receipts remain separate from accepted outcomes. Reviews and corrections change procedures through versioned releases, rather than through an agent’s accumulated personality.

Authority comes from narrowly scoped execution credentials and consequence limits. Memory lives in records; the owner reviews contested decisions and selected original customer evidence. Missing evidence opens an exception instead of manufacturing success.

**Wrong-design conditions:** most valuable work requires continuously changing plans, records cannot express important ambiguity, or exceptions consume attention in proportion to output. Central storage also concentrates compromise and outage risk. Portability is strong only if exports preserve meaning and executable rules. Test against adaptive planners at equal lifecycle coverage, including unfamiliar cases; measure owner time, missed obligations, and recovery effort.

## Countermodel B: an owner directing a professional service network

**Design proposal:** the company owns its purpose, promises, counterparties, and acceptance decisions, while commissioning production, distribution, bookkeeping, specialist advice, physical fulfillment, and independent assurance. Software maintains scoped mandates, deliverables, evidence access, continuity arrangements, and unresolved obligations. Model assistance is optional within each service. This changes the boundary of production, not the ambition or the owner’s responsibility.

**Source claim:** the UK nuclear regulator describes an “intelligent customer” capability that understands, specifies, oversees, challenges, and accepts contracted work. Its guidance also expects retained organizational competence and resources; it does not say one informed individual can replace them. **Inference:** owner competence needs practiced challenge and contextual understanding, and some sectors can defeat the single-person operating assumption even with excellent suppliers. This is a sector-specific comparison, not a legal applicability determination. [ONR NS-TAST-GD-049, issue 7.2](https://www.onr.org.uk/publications/regulatory-guidance/regulatory-assessment-and-permissioning/technical-assessment-guides-tags/nuclear-safety-tags/ns-tast-gd-049)

Research through winding down becomes a network of defined services with retained records and explicit acceptance boundaries. Owner participation includes reviewing raw customer exchanges, explaining consequential decisions, and challenging a supplier’s assumptions. External professional obligations coexist with the founder’s responsibility; contracting does not erase either.

**Wrong-design conditions:** scarce suppliers cannot be replaced, confidentiality prevents necessary evidence access, tacit coordination overwhelms contracts, or service costs destroy experimentation economics. Supplier independence can be weakened by payment incentives and shared subcontractors. Failure recovery requires handover rights, usable records, replacement capacity, and attention reserves. Improvement changes procurement and acceptance arrangements. Migration is contractual as well as technical. A paper comparison can identify gaps; actual feasibility needs authorized quotations and observed engagements, neither performed here.

## Countermodel C: federated tools with limited shared meaning

**Design proposal:** accounting, customer conversations, research, design, operations, and legal records remain in suitable native systems. A thin exchange layer carries references, ownership, evidence lineage, deadlines, and authority boundaries. Domain meanings are translated only where an actual cross-domain decision needs them. Local copies and independent recovery preserve access during supplier outages.

**Source claim:** the dataspaces proposal supports heterogeneous information before comprehensive semantic integration, then strengthens mappings where needed; it explicitly trades away some guarantees under administrative autonomy. Local-first prototypes investigate offline operation and ownership. Neither establishes safe distributed financial authority. [Franklin, Halevy, and Maier](https://sigmodrecord.org/publications/sigmodRecord/0512/p27-article-franklin.pdf), [Kleppmann and colleagues](https://www.inkandswitch.com/essay/local-first/)

**Source claim:** PROV provides extensible, domain-independent provenance structures. **Inference:** shared provenance does not require a universal business ontology, and provenance alone does not validate an assertion. Saltzer and colleagues’ endpoint argument provides a placement heuristic: acceptance sometimes requires application knowledge unavailable to a common transport layer. It is an analogy, not a theorem about business governance. [W3C PROV-DM](https://www.w3.org/TR/prov-dm/), [End-to-End Arguments](https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf)

All lifecycle stages remain covered through native tools and explicit cross-system obligations. Shared authority still needs strong common invariants: two applications cannot each spend the entire remaining budget. Uncoordinated native bypasses invalidate the model; consequence partitions or coordinated reservations must bound them. Provider replacement is local, but mapping maintenance and conflicting histories become standing costs.

**Wrong-design conditions:** operations routinely require atomic cross-domain decisions, integrations obscure omissions, or translations cost more than common semantics. A healthy connector can still misinterpret “customer,” currency, or cancellation. Owner comprehension may suffer from fragmented evidence. Test semantic changes, partitions, deletion propagation, and replacement of one provider without redesigning the company.

## Countermodel D: negotiated allocation and shared hypotheses

**Design proposal:** eligible workers discover bounded opportunities rather than inherit permanent roles. A shared hypothesis space supports research and competing interpretations; negotiation allocates executable tasks according to demonstrated capability, availability, and estimated cost. Allocation grants no extra authority. Evidence, permissions, and consequence limits remain externally enforced.

**Source claim:** Smith’s contract net distributes tasks through announcements, bids, and awards; its demonstration concerns distributed sensing. Hearsay-II coordinates independent knowledge sources through a blackboard and focus-of-control mechanism. **Crucial contrary evidence:** Hearsay-II’s authors report that forcing specialized internal activities into the general blackboard style failed or caused unacceptable degradation. Shared coordination and specialized internal representations can be complements. [Contract Net Protocol](https://www.reidgsmith.com/The_Contract_Net_Protocol_Dec-1980.pdf), [Hearsay-II, §4.3](https://mas.cs.umass.edu/Documents/Erman_Hearsay80.pdf)

A full lifecycle can use fixed procedures for obligations and negotiated workers for discovery, production, customer analysis, recovery, and closure exceptions. The owner judges commitments and samples evidence rather than managing a roster. Work history belongs to tasks and sources; persistent identities exist only where credentials or relationships require them. Improvement updates allocation rules against held-out workloads.

**Wrong-design conditions:** self-reported bids are unreliable, evaluation costs exceed execution savings, correlated workers manufacture agreement, or important maintenance work attracts no bids. Negotiation adds latency; shared hypotheses invite contamination; a common blackboard can concentrate sensitive data. Internal credits are scheduling signals, not evidence of genuine market discipline. Require a path for unclaimed obligations, bounded negotiation, expiration, and contested evidence. Neither cited experiment establishes company-scale reliability.

## Discriminating experiments and economic burden

**Proposals, not completed experiments:** use the same full-lifecycle scenario corpus for every candidate, with representative routine cases, ambiguous decisions, customer promises, specialist boundaries, shutdown, and missing evidence. Keep consequence budgets and owner attention limits equal. Report dimensions separately; no aggregate score hides a fatal failure.

1. **Remove the agents:** substitute records, procedures, and temporary sessions for persistent workers. Introduce an unfamiliar customer dispute and a direction change. Reject substitution if unresolved dependencies or owner minutes rise materially; reject persistence if it contributes no measurable continuity or quality benefit.
2. **Remove universal semantics:** replace one domain system, then change its definition of an active customer. Measure incorrect joins, hidden omissions, permission errors, and repair effort. Federation loses if local changes repeatedly require global reinterpretation; universal schemas lose if unrelated domains must migrate together.
3. **Remove internal production:** compare a complete internal delivery-and-closure plan with a supplier-backed plan, including oversight, evidence access, substitution, and termination costs. Unsupported prices remain unknown. No procurement or external contact occurs without separate authorization.
4. **Break allocation:** introduce unavailable workers, optimistic bids, duplicate awards, and neglected maintenance. Compare negotiation with a deterministic queue and a bounded planner. Measure deadline misses, unsafe duplicate effects, coordination effort, and time to recognize impossibility.
5. **Test the owner:** after a staged absence, ask them to explain current promises, strongest contrary customer evidence, and the stop procedure using original records. Compare comprehension and corrective action over repeated sessions. A polished summary is not a competence measure.

**Inference:** a universal system must pay for connector drift, schema migration, evaluator upkeep, security review, restoration, supplier substitution, and the owner’s calibration—not merely generation. A useful accounting identity is production plus coordination plus assurance plus recovery plus switching plus attention cost. Measure each per completed or safely terminated attempt. Subscription money and available execution capacity remain separate; this lane assumes no paid API fallback and makes no price claim.

## Retained challenges, assumptions, and open questions

**Useful mechanisms:** explicit obligations, sampled direct evidence, practice in supplier challenge, selective semantic integration, reversible component replacement, and separate allocation and authority. **Rejected as unsupported defaults:** permanent departments, universal blackboards for internal reasoning, self-reported bid quality, outsourcing as transferred responsibility, and logs presented as complete truth.

**Competing interpretations:** tighter common semantics may reduce costly ambiguity; federation may preserve necessary differences. Central execution may simplify enforcement; independently bounded executors may contain failure better. Ostrom’s research synthesis describes institutions operating at several scales, challenging a single-scale default without establishing that decentralization always wins. [Ostrom’s revised lecture draft](https://dlc.dlib.indiana.edu/dlc/bitstreams/0a7a52e6-8cf0-42c3-ae20-776095e6fd1d/download)

**Assumptions:** the owner can preserve access to primary evidence; interfaces permit meaningful restriction; some work is repeatable; qualified external capacity can sometimes be obtained. **Unknowns:** actual exception rates, acceptable attention load, supplier economics, tacit knowledge loss, and long-term competence retention. These are foundational uncertainties, not implementation details.

Questions other lanes may miss: Can the business survive closure of its assurance provider? Which records would a successor actually understand? Who identifies obligations absent from every connected source? Does independent review share the producer’s incentives or upstream evidence? When does preserving founder intent conflict with a counterparty’s understanding of a promise? Could simplification reduce auditability by hiding professional judgment inside a purchased service?

## Source register and validity

All sources were opened on 2026-09-12. Confidence below concerns the cited mechanism or text, not whole-business effectiveness. Historical sources do not expire as historical evidence; proposed transfer must be revisited after the experiments. No empirical universal business outcome is claimed.

| Source | Date, type, primary status | Conflict, confidence, expiry or invalidation |
|---|---|---|
| Coase, linked above | 1991-12-09; author’s theoretical lecture; primary | Own theory advocacy; high textual confidence, moderate transfer. Reopen make/buy inference when measured coordination costs disagree. Browser failed; official HTML opened with curl. |
| PCAOB AS 1105 | Adopted 2010; amended live standard; primary regulator | Financial-audit scope and institutional mandate; high textual confidence. Recheck before operational reliance or amendment, at latest 2027-03-12. No general certification claim. |
| OMG CMMN 1.1 | 2016-12; normative specification; primary | Consortium includes vendors; high mechanism confidence, effectiveness unproven. Revalidate version and implementation semantics at adoption. |
| ONR NS-TAST-GD-049 | 2024-07, issue 7.2; inspection guidance; primary | Nuclear-sector mandate; high text confidence, limited transfer. Official DOCX fetched and extracted after browser format failure. Recheck before sector use; stated next review July 2029. |
| Franklin et al. | 2005-12; SIGMOD Record research agenda; primary | Authors advocate proposal; one Google affiliation. High proposal confidence, low outcome confidence. Invalidate transfer if integration guarantees or measured repair costs are unacceptable. |
| Kleppmann et al. | 2019-04 essay; 2019-10 Onward paper; primary prototypes | Authors built approach; high reported-mechanism confidence, limited task scope. Product claims age; verify adopted implementation and security behavior before use. |
| W3C PROV-DM | 2013-04-30; recommendation; primary | Standards-promoting institution; high specification confidence. Revalidate conformance and provenance completeness at adoption; authenticity remains separately unproven. |
| Saltzer et al. | 1984-11; research argument, MIT author copy; primary | Authors defend placement principle; high textual confidence, moderate analogy. Invalidate business transfer where only shared infrastructure can enforce the requirement. |
| Smith | 1980-12; IEEE protocol and sensing demonstration; primary | Protocol creator; high mechanism confidence, low business transfer. Reopen on strategic bidders, uncertain side effects, or excessive negotiation costs. |
| Erman et al. | 1980-06; ACM system report, author institution copy; primary | System builders, DARPA support; high reported limitation confidence. Modern relevance needs reproduction; original results are domain-bound. |
| Ostrom | 2009 lecture, revised prepublication draft; primary research synthesis | Author synthesis, funding disclosed; draft marked “do not quote,” paraphrased here. Moderate confidence; replace with final publication before foundational reliance. Context transfer remains contested. |

Cross-source convergence supports comparing institutions, preserving specialized representations, and testing assurance separately from production. It does not establish a winning architecture. The next decisive evidence is comparative operation under identical obligations and constraints.
