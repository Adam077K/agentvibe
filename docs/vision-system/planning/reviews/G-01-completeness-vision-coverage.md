> Archival provenance — 2026-09-13: Phase G review, preserved verbatim from the completed independent read-only turn on frozen subject `7ddc066`, following the frozen protocol at [G-acceptance-protocol.md](G-acceptance-protocol.md). The reviewer held three of the twelve dimensions (completeness, vision preservation, coverage) and two of the eight portfolio scenarios. It had shell access for computation and no write access; it was barred from producers' self-assessments, session files and `state.json` `completed[]`. The report arrived in four parts because the return channel truncated it; parts are concatenated in order with no edits. Archival does not establish hardened isolation; the reviewer shares a model family with every author and says so.

**Phase G — completeness, vision preservation, coverage: all three SUFFICIENT for implementation to begin; no (d)-class finding; seven (a)-class findings; three candidate findings withdrawn under tighter tests**

**Subject:** `7ddc066`

---

## Independence disclosure

I share a model family with every author of this package. My independence is procedural only: I did not read `docs/08-agents_work/`, the F-series reviews, or `state.json`'s `completed` array. **I am predisposed to agree** in three specific places: the package's register discipline flatters a reviewer who computes (every join resolves, so computing rewards the authors); its prose uses the same epistemic vocabulary I would use, which makes hedged claims read as rigorous rather than as hedges; and its self-critical registers pre-empt the findings I would otherwise author, which invites me to grade the confession instead of the gap. I mitigated by computing joins the registers do not advertise and by rejecting three of my own findings when the tighter test cleared them.

---

## Per-dimension judgment

**1. COMPLETENESS — sufficient for implementation to begin.**
24/24 directive families present in `coverage/package.json`; **0 unresolvable locations** across all `locations` entries. 46/46 capability contracts exist in `planning/specification/capabilities.json` and carry all eleven directive-§8.4-required fields (under synonymous keys: `consequence_classes`, `evidence_produced`, `evaluation.method`, `replacement_removal`). The protocol's named failure condition is not met: fulfillment (CAP-30), formation (CAP-40), maintenance (CAP-30/36), grievance (CAP-42) and closure (CAP-39) all have substantive contracts with authority, failure behavior and acceptance conditions.

The protocol's probe — *where does necessary work enter before anyone sponsors it?* — is answered concretely at `planning/specification/03-company-capabilities.md:67`: first receiver takes temporary protective custody under the intake mandate; locates promise sponsor → service mandate → designated maintenance/discovery custodian; a bounded resolver assigns provisional custody on overlap; only acknowledged transfer moves responsibility; default timer expiry activates the accepted alternate; **"the resolver assigns ownership, not new grants."** I initially recorded this as missing because the specification never uses the word "unsponsored"; that was a vocabulary miss on my side, not a gap.

F25-Q01 **is decomposed**: `capabilities.json#/source_question_contracts/61` carries a `job_routes` array of **15 entries**, one per named job, each with `intake`, `substantive_procedure`, `acceptance`, `adapter_route_ids` and `actual_availability`. Sales, bookkeeping, supplier negotiation and support are separately routed, not absorbed into orchestration.

**2. VISION PRESERVATION — sufficient for implementation to begin.**
`planning/00-executive-guide.md` (63 lines) lets an unfamiliar reader state all five required things: the company (¶7, full lifecycle from opportunity through responsible closure), beneficiaries (owner plus customers, noncustomers via CAP-42), refusals (line 9 *"A generated report about delivery is never delivery"*; line 51 *"no silent switch to metered APIs"*), the owner's day (the 7-row operator-need table, lines 15–25, plus the practice cycle at `04-human-operation.md:99`), and costs (line 53, dated estimates with explicit unknowns, plus line 63 naming affordability as the largest residual uncertainty).

It did **not** narrow. Coding is CAP-10 of 46; the agent roster is explicitly refused (`00-executive-guide.md:29` — *"this does not require nine agents"*; F25-Q01's answer — *"not a permanent worker roster"*); account-only is refused at `12-scope-lifecycle-traceability.md` — *"A document about a service cannot satisfy that service's acceptance predicate."* Directive §1.1's 32 named work areas all map onto the 46 capabilities.

**3. COVERAGE — sufficient for implementation to begin, with the qualifications in G1-02/03/04.**
I sampled **64 rows across all 53 fields** (stratified one-per-field plus 11 random), following source concern → answer → contract → verification for each. Computed joins: **566/566** `answer_location` JSON pointers resolve; **566 distinct targets**, max reuse 1 — no chapter-pointing. 2636/2636 `evidence` paths exist. 566/566 `decision` files exist; 116 sampled markdown decision anchors resolve. 354 distinct `verification_refs`: all 172 ID-style refs are defined in the specification, all 182 path-style refs resolve. Answers answer the question's meaning, not a chapter: F27-Q06 returns protected-slot resolution from currently accepted facts with named non-inventable claims; F51-Q08 requires exercised unfamiliar duty handling and rejects "a successor packet or spare login". Direction 2 (contract → justifying requirement) is the weakest leg — see G1-06. **Judgment: sufficient for implementation to begin**, qualified by G1-02/03/04.

**566-row status distribution.** `status`: **566 of 566 = "Requires further evidence"**. Zero rows in Answered, Intentionally refused, Unresolved but non-blocking, Requires founder decision, Requires external professional, Superseded by a better framing, Not applicable. **No status appears that §8.24 does not allow; no silences.** Two further columns are likewise single-valued: `answer_status` (566× "substantive specification authored; complete-plan independent review pending") and `implementation_status` (566× "planned-not-existing"). Supplemental (62): 35 Superseded by a better framing / 27 Requires further evidence. Discovered (15): 15 Requires further evidence. `coverage/capability-requirements.json` (46): no status field at all.

## Findings

**G1-01 (a).** `coverage/capability-requirements.json` reports `contract_location`, `implementation_location` and `evaluation_evidence` as **null on all 46 capabilities**, and its own `status` reads "Awaiting Phase F … contracts" — while `planning/specification/capabilities.json` holds all 46 complete contracts carrying every one of the eleven directive-§8.4 fields. Counterexample: a reviewer navigating §8.4 through the register concludes zero capabilities have contracts. Evidence needed: regenerate the register from `capabilities.json`.

**G1-02 (a).** Two incompatible answer-node schemas sit behind one `answer_location` column. 384 rows expose the substantive text as `answer`; **182 rows** — every row pointing into `integrations-capacity-build.json` or `components-authority.json` — expose it as `decision` and carry **no `answer` key**. Any consumer reading `.answer` gets null for 32% of the matrix. Expected: one field name, or a declared `answer_field` per row.

**G1-03 (a).** Three status columns each carry exactly one value across all 566 rows, so the matrix carries zero discriminating bits at the status level. Nothing disallowed appears, but "Requires founder decision" and "Intentionally refused" are used zero times, so the register structurally cannot surface a (d)-class item or a deliberate refusal. Evidence needed: at least one row whose status distinguishes a specified answer from a genuinely open one.

**G1-04 (a).** Verification dilution: 268 work-knowledge answers bind only **156 distinct (subcase, assertion) pairs**; `WK-V43-A2` is the sole planned verification for **8 questions across 6 fields**. The sharpest instance is already repaired — F50-Q08 now also binds `WK-V55-A1/A2` (challenge supply without a standing adversary), confirmed present among 56 subcases. Residual is real but bounded.

**G1-05 (a).** Seven assertions are defined and bound by nothing: `WK-V04-A3, WK-V09-A3, WK-V20-A3, WK-V23-A3, WK-V26-A2, WK-V33-A3, WK-V43-A1`. I computed this before reading `registers/review-findings.json`, which independently reports the same seven as deliberately open.

**G1-06 (a).** Eleven of 173 canonical record types are named nowhere outside `contracts/`: `ExternalAttempt`, `GenerationSeal`, `RollbackPlan`, `DecisionChallenge`, `Principle`, `AccessPolicy`, `RetentionPolicy`, `DeletionReceipt`, `DependencyClosure`, `ConfigurationVersion`, `ConsequenceClassDefinition`. Each carries a `source_contract` that resolves to a real specification section, so each is justified by a *contract* — but by **no source concern**: none appears in any of the 566 answers, the 62 supplemental concerns, the 15 discovered concerns, or the twelve specification prose documents. That is the protocol's direction 2 failing (mechanism → the requirement and problem justifying it), and it is the package's weakest coverage leg. Evidence needed: for each of the eleven, the source question or concern that requires it, or an explicit note that it is control machinery derived from another record's obligations.

**G1-07 (a).** `record-registry.json` → `ScopeRegistry.source_contract` = `02-authority-recovery.md#10-conflict-scope-and-participant-migrations--t-r1`; the actual heading is `## 10. Conflict, scope and participant migrations — T-R1`, whose slug carries a single hyphen. 1 of 173 `source_contract` refs fails to resolve; the other 172 resolve.

**No G1-08+. No (d)-class finding in my three dimensions.** Three candidates cleared under tighter tests: unsponsored-work entry (`03-company-capabilities.md:67`); absent-founder grievance custody (`03-company-capabilities.md:142`, refused rather than faked); the 35 "Superseded" supplemental rows (one shared reason at `12-scope-lifecycle-traceability.md#scope-decision`, each row keeping its own answer).

## Scenario 1 — Discover, choose and reach customers

| Step | Contract | Outcome | Adverse caught | Not specified |
|---|---|---|---|---|
| Compare problems | CAP-03 | Opportunity + stop/reopen rule | Weak demand → "weak evidence stays a hypothesis" | Discovery custodian identity |
| Customer research | CAP-04 | Observations + recruitment denominator | Omitted cohorts = its `evaluation.method` verbatim; invented evidence → "no generated participant substitutes" | Lawful contact basis |
| Strategy | CAP-06 | Build/buy/partner/defer + opportunity cost | False market hypothesis vs poor execution | — |
| Offer + brand | CAP-07, CAP-09 | BrandGuide within rights limits | Unsupported claim → CAP-09 authority, F27-Q06 decision, test CHT-F29-Q02 | Rights-clearance performer |
| Distribution + sales | CAP-14, CAP-15 | Send receipts under real denominator; exact-term agreement | Off-route acceptance creates a duty "software refusal cannot erase" | Channel accounts (prerequisite) |

## Scenario 2 — Pause, pivot, transfer and close

| Step | Contract | Outcome | Adverse caught | Not specified |
|---|---|---|---|---|
| Pause | CAP-36 | New work stops, duties funded | "pause cannot become indefinite invisible abandonment" | Carrying-cost funding source |
| Pivot | CAP-38 | Old reasons kept, promises inventoried | "rollback of plans cannot undo external statements" | — |
| Owner + supplier fail | CAP-41, CAP-24, `02-authority-recovery.md:456` (A-T15) | Fallback performs or disposes | "backup depending on owner appointment/payment must not count as available continuity"; supplier sharing backup failure root not counted twice | Who the alternate is — (b) prerequisite |
| Successor | CAP-41 | Exercised unfamiliar work, fenced cutover | "possessing recovery keys is insufficient"; "no timeout acceptance" | Successor's existence |
| Close | CAP-39, CAP-42 | Closed-with-residuals until each residual is owned | "Unavailable lawful capacity remains explicit failure … never a completed closure label"; post-closure noncustomer complaint is CAP-42's evaluation | Remedy funding named, not sized |

## Not checked

- **Nine of the twelve dimensions**, judged by no one in my pass: traceability, internal coherence, evidence quality, alternative depth, unknown integrity, adversarial robustness, operational feasibility, buildability, responsibility, changeability.
- **The six unassigned scenarios** from the portfolio (take money and fulfill; find and repair unsponsored work; sustain and change operations; honor rights under hostile noise; recover actual responsibilities; protect meaning through change).
- **EAS-R1's four comparisons and the S0 baseline** — not exercised at all.
- **`validate_contracts.py` and `run_negative_fixtures.py`** — started, exceeded 120s, no output captured. The 13 negative fixtures under `contracts/fixtures/negative/` are unexecuted by me; I cannot say whether the package's own checker passes without checking.
- **`research/L01–L14` content quality** and `history.jsonl`.
- **Excluded by brief:** the F-series reviews, all producer session files under `docs/08-agents_work/`, and `state.json`'s `completed` array.
