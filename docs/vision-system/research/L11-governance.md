# L11 — Legal, privacy, governance and ethical consequences

Research date: 2026-09-12. Status: independent expansion; architecture unselected.

The bounded question is what authority, information and continuing obligations a full-company system must represent before one person can responsibly permit unattended work. Inputs were only `THE-VISION-AND-THE-FIELDS.md`, `directive-contract.json` and engine guidance; other lanes and plans were not consulted. Coverage concentrates on fields 11, 16, 22, 24–27, 30, 35, 42, 46, 47, 51 and 53, plus operating sectors, external consequences and closure.

**Finding:** governance cannot be a universal sector permission or a final compliance score. It needs decisions tied to activities, people, entities, jurisdictions, dates and evidence. **Unknown:** venture, incorporation, tax residence, customers, workforce, data locations and regulated functions. The supplied timezone establishes none of these. This report gives no jurisdiction-free compliance verdict.

**Proposal:** map each venture's establishment, management, worker locations, target markets, customer locations, processing destinations and contractual governing law. Record the nexus asserted for each obligation; do not collapse these into one “home country.”

## Authority is several different questions

**Source claims:** Delaware's electronic-transactions statute expressly permits contracts formed by electronic agents without individual review, subject to applicable substantive law. UK government guidance says directors retain responsibility for records, accounts and performance even when they engage others to handle them. Neither establishes that every founder personally bears every corporate liability. [Delaware §12A-114][S2]; [director guidance][S3].

**Inference:** distinguish operational accountability, corporate responsibility, contractual attribution, professional duties and personal liability. “One person is responsible” is a founder commitment, not an entity-structure opinion. A software role called director or lawyer supplies neither corporate office nor professional qualification. Possession of a credential does not establish permission to bind its holder.

**Design proposal:** an external-action authorization identifies legal principal, authenticated actor, capacity, represented entity, permitted activity, counterparty, amount, jurisdiction assumptions, expiry and delegation limits. Bind approval to the actual terms and payload; changed terms reopen it. Separate power to propose, execute, settle disputes and amend authority. Internal limits may not defeat a counterparty's legal claim: counsel must assess attribution and apparent authority. Preserve the distinction between an attempted transaction and confirmed acceptance.

**Professional dependency:** counsel determines formation, corporate powers, signatories, consumer obligations, insurance allocation and enforceability. An accountant determines tax residence, registration, reporting, payroll and record periods. Engagement scope, jurisdiction, credentials, professional conclusion and expiry belong in the decision packet. An unanswered professional question remains unanswered. ABA Opinion 512 illustrates competence, confidentiality, communication and supervision duties when lawyers use AI; it interprets model ethics rules, rather than licensing this system to practise law. [ABA][S4].

## Replace the source's sector shortcuts

The labels are useful prompts, but several are inaccurate as legal conclusions:

| Source label | Evidence and corrected question |
|---|---|
| Software, marketing and education `OPEN` | GDPR can attach to personal-data processing; US commercial email has CAN-SPAM duties, including business-to-business email. What activity, audience and data are involved? [S1], [S5] |
| Bookkeeping `LICENCE` at filing | IRS guidance permits active PTIN holders without professional credentials to prepare federal returns; representation rights differ. This does not resolve state rules or autonomous filing authority. [S6] |
| All finance requires a licensed human signature | SEC guidance describes registered robo-advisers with limited human interaction. Registration, fiduciary obligations and the particular financial service matter; this evidence does not support a signature on every output. [S7] |
| Health always `LICENCE` | FDA's January 2026 guidance distinguishes device functions from certain excluded clinical decision-support functions. Intended use and product classification matter alongside practitioner regulation. [S8] |
| Employment always `LICENCE` | EEOC describes discrimination and accommodation duties when covered employers use AI, not a universal hiring licence. Worker status, applicable coverage and decision effects need assessment. [S9] |
| Children `REFUSE` | COPPA specifies duties for covered online operators; it is not a universal prohibition on children's products. Blanket refusal is a conservative founder policy, requiring explicit adoption. [S10] |
| Physical commerce `PRESENCE`; services `CONSENT` | Physical execution can be outsourced; willing customers cannot waive every applicable duty. Identify fulfilment, safety, inspection, professional and contractual dependencies separately. These are design distinctions, not legal clearance. |

**Proposal:** retain multiple independent statuses: activity unclassified, prohibited by applicable law, professional determination pending, legally conditioned, contractually restricted, founder-refused, or authorized within stated conditions. “No restriction found” must include search boundaries and is never equivalent to lawful. A licensed participant cannot cure an unlawful product, inadequate data rights or missing organizational authorization merely by signing.

## Privacy must survive the entire information lifecycle

**Source claim:** where applicable, GDPR distinguishes controller and processor roles; requires purpose limitation, minimization, lawful basis and storage limitation; provides information, access, correction and erasure rights; regulates processors, security and international transfers. Erasure has exceptions, including legal obligations and legal claims. Territorial scope includes specified activities involving people in the Union by organizations established elsewhere. [GDPR, arts. 3–6, 12–22, 28, 32, 44–49][S1].

**Proposal:** establish a processing inventory before collecting customer, contractor or founder information. Each use records purpose, people affected, sources, data categories, controller/processor role, approved basis, recipients, permitted secondary uses, retention rule, access roles and deletion destinations. Cover prompts, attachments, transcripts, logs, summaries, embeddings, derived profiles, exports and vendor copies. A permission to read for support does not itself authorize training, sales profiling or cross-venture memory sharing.

GDPR special-category data also requires an applicable Article 9 condition; a generic lawful basis alone is insufficient. [S1]

**Source claim:** EDPB consent guidance requires meaningful choice and addresses employment power imbalance; consent is not interchangeable with accepting commercial terms. Its transfer guidance distinguishes adequacy, safeguards and exceptional derogations, and warns that safeguards may require additional measures and country-specific assessment. [Consent][S11]; [transfers][S12].

**Proposal:** record notice version, purpose and withdrawal for consent-based uses; keep legal basis separate from owner approval and customer preference. Never infer consent from silence. Evaluate founder profiling separately, including inferred health, finances and habits. Vendor region settings alone are insufficient evidence of every recipient or access location: capture subprocessors, remote access, onward transfers, contract scope and changes.

**Source claim:** ICO erasure guidance addresses backup copies, scheduled overwrite and preventing their further use while awaiting overwrite; it also requires honest explanation of what happens. The page warns that it is under review following UK legislative changes. This is UK regulator guidance, not a universal backup exception. [ICO][S13].

**Proposal:** represent deletion as requested → scoped → exception-assessed → live-erased → downstream-pending → backup-expired → verified, with partial outcomes visible. Restore must reapply deletion restrictions before data becomes usable. Legal holds require reason, custodian, scope, review date and restricted access. Do not claim that hashing, encrypting or removing a search result necessarily anonymizes or erases the underlying information. A deletion receipt should name inaccessible vendor copies and unverified destruction rather than certify the unknowable.

## Consequential decisions and disclosures

**Source claim:** GDPR Article 22 addresses solely automated decisions producing legal or similarly significant effects, with defined exceptions and safeguards; it is not a ban on all automation. EDPB-endorsed guidance supplies the relevant interpretation. [S1], [S14].

**Proposal:** classify decisions by effect on a person: recruitment, pay, eligibility, credit, service denial, disciplinary action or clinical reliance. Capture evidence, alternatives, uncertainty, reviewer authority and contestability. A human click is weak evidence of deliberation; a review process needs time, ability to change the outcome and access to relevant facts. Give affected people a reachable correction and appeal path. Treat uncertain classification as a professional dependency; do not hide it behind “advice only” when the output actually drives a decision.

**Source claims:** EU AI Act Article 50 differentiates interactive-system notices, synthetic-content marking and particular disclosure duties; it does not require a universal label on every AI-assisted sentence. The enacted July 2026 amendment postpones specified high-risk provisions to 2 December 2027 for Annex III systems and 2 August 2028 for Annex I systems. It also supplies a 2 December 2026 transition for Article 50(2) marking by providers of systems placed on the market before 2 August 2026. Applicability is role- and provision-specific. [AI Act][S15]; [2026 amendment][S16].

**Implication:** record provider/deployer role, intended purpose, market date, significant changes and exact applicable provision. Existing privacy, discrimination and consumer duties do not disappear during an AI-specific transition. Transparent identity can also be a founder policy beyond legal minimums; preserve that distinction. Disclosure does not make a false product claim true or validate an unwanted marketing contact.

## Procurement, intellectual property and continuing promises

**Source claim:** the US Copyright Office's 2025 report distinguishes protectable human expression from purely generated material and finds prompts alone insufficient under then-current technology. Its position is jurisdiction- and fact-dependent; a vendor's ownership clause cannot by itself establish statutory copyright. [Copyright Office][S17].

**Proposal:** track borrowed assets, code licences, dataset rights, human contributions, assignments, attribution duties and restrictions separately from vendor output ownership. Counsel resolves infringement, trademark, publicity, database-right and confidentiality questions for the selected business. Nothing here settles training-data litigation.

**Proposal:** procurement review attaches exact supplier, product, account type, terms version, allowed automation, permitted recipients, resale/embedding permissions, data-use settings, processing agreement, retention/deletion promises, termination, indemnities and liability caps. No subscription-to-API, credential-sharing or customer-product permission is inferred. Changed terms, subprocessors or authentication paths reopen affected permissions. Keep actual negotiated terms as evidence; generic public pages cannot verify a private contract.

**Source claim:** IRS closure guidance requires final filings and payment before account closure and continued retention of relevant records. Abandoning an application is therefore not equivalent to ending its business obligations. [IRS closure][S18].

**Proposal:** wind-down inventories refunds, warranties, customer exports, creditor claims, taxes, worker payments, notices, cancellation dates, legal holds and residual support. Assign every surviving obligation a responsible person and funded means of completion. Succession separates temporary absence, incapacity, death and sale. Counsel establishes lawful substitute authority; possession of recovery keys cannot establish it. Rehearse successor access and restricted continuity, including complaints and urgent incidents, without giving the substitute unlimited founder identity. Preserve a usable exit package across provider shutdowns.

## Competing interpretations, failures and ethical consequences

**Disagreement retained:** extensive records can support accountability but expand privacy exposure; immediate destruction can frustrate legal preservation. Bounded, purpose-specific evidence with explicit exceptions is a candidate mechanism, not a resolved universal retention period. A conservative refusal policy reduces some exposures while excluding potentially beneficial services. Founder values must decide that trade-off openly.

**Useful mechanisms retained; overclaims rejected:** activity-specific gates retain the sector map's caution; universal `OPEN` is rejected. Professional review retains specialist judgment; a ceremonial signature is rejected. Immutable evidence retains integrity checks; indefinite personal-data retention is rejected. Human review retains intervention; universal approval queues that induce rubber-stamping are rejected. NIST AI RMF provides a voluntary risk-management vocabulary; neither its adoption nor a checklist constitutes legal certification. [NIST][S19].

**Hypotheses to test:** cheap experimentation may externalize costs through unsolicited contact, confusing cancellations, inaccessible interfaces and abandoned services. Founder competence can improve while recipients bear verification work. Optimization may amplify exclusion through proxies even without explicitly using protected traits. Proposed measures include unwanted-contact rates, appeal reversals, unresolved refunds, accessibility failures, harmful subgroup outcomes, owner review load and closure debt. Distributional effects and displacement remain open empirical questions, not established benefits or harms of this unbuilt system.

**Proposed failure fixtures, not executed tests:** revoke a signatory mid-run; change terms after approval; restore deleted profiles; receive withdrawal through support; swap a vendor region; let a licence expire; overload a consequential reviewer; lose the founder during refunds; restore an old policy after a model update. Expected behavior is bounded execution, visible uncertainty, preserved obligations and an authorized escalation route. General software can implement these contracts safely without deciding substantive law.

**Missed questions and limits:** who may challenge the founder; who funds redress; whose evidence is missing; what happens when duties conflict across jurisdictions; and which accessibility, sanctions, export, sector-safety, insurance or employment rules attach? None was exhaustively surveyed. The source's unnamed chatbot-liability case was not verified: attempted tribunal and CanLII fetches failed, so it is not used as evidence. Sector examples disprove blanket assumptions; they do not clear a launch. Actual operation still depends on a jurisdiction map and scoped professional determinations.

## Evidence register and invalidation

All links were opened on **2026-09-12**; all are primary institutional publications. **H** means high confidence in the stated source content, not applicability. **M** marks interpretive or changing guidance. **30/90** means proposed recheck within that many days and always before relying on it for a material external action. Every entry is invalidated by amendment, supersession, contrary controlling authority, or a changed activity/jurisdiction; additional triggers appear below. Undated means no publication date was established, not recent publication.

| Source | Date/version; type; confidence/recheck; additional trigger |
|---|---|
| [S1 GDPR][S1] | 2016-04-27; regulation; H/30; territorial facts or processing purpose changes. |
| [S2 Delaware UETA][S2] | Live code, §12A-114; statute; H/90; transaction exclusions or governing law changes. |
| [S3 UK directors][S3] | Undated live guidance; government; H/90; entity/officer changes. |
| [S4 ABA 512][S4] | 2024-07-29; professional opinion; M/90; local bar rule or engagement changes. |
| [S5 CAN-SPAM][S5] | Undated live guide; regulator; H/30; channel, audience or message-purpose changes. |
| [S6 IRS preparers][S6] | Undated live guidance; regulator; H/90; credential, filing year or state changes. |
| [S7 SEC robo-advisers][S7] | 2017-02-23, updated 2022-11-04; regulator release; H/90 for example only; service changes. |
| [S8 FDA CDS][S8] | January 2026 final guidance; regulator; H/30; intended-use changes. |
| [S9 EEOC AI][S9] | 2024-04-29 publication; regulator; H/30; employment-law coverage changes. |
| [S10 COPPA FAQ][S10] | Notes 2025-04-22 amendment; regulator; M/30; amended rule or audience changes. |
| [S11 EDPB consent][S11] | 2020-05-04, v1.1; regulator guidance; H/90; purpose or power imbalance changes. |
| [S12 EDPB transfers][S12] | Undated live guide; regulator; H/30; adequacy, recipient or location changes. |
| [S13 ICO erasure][S13] | Undated, expressly under review; regulator; M/30; updated UK guidance. |
| [S14 automated decisions][S14] | WP251rev.01, endorsed 2018-05-25; regulator guidance; M/30; decision effects change. |
| [S15 AI Act][S15] | 2024-06-13 original act; regulation; H/30 with S16; role/classification changes. |
| [S16 AI amendment][S16] | 2026-07-08; OJ 2026-07-24; regulation; H/30; transition conditions change. |
| [S17 copyright][S17] | Part 2, 2025-01-29; government report; M/90; technology/case-law changes. |
| [S18 IRS closure][S18] | Undated live guidance; regulator; H/90; entity, tax year or unpaid obligations change. |
| [S19 NIST][S19] | RMF 1.0, 2023-01-26; voluntary framework; H/90; revision announced on current page. |

**Incentives and corroboration:** legislatures state enacted rules; regulators emphasize enforceability and protected interests, and their guidance may simplify exceptions. ABA represents the legal profession and interprets model rules; it is not a legislature. NIST promotes usable voluntary standards. Copyright Office administers registration and advances its interpretation. No vendor marketing supports the findings. S16's operative dates were checked against the Commission's [2026-08-03 overview](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai); agreement corroborates the reading, not institutional independence. Other examples are deliberately narrow single-primary-source findings requiring professional application.

[S1]: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng
[S2]: https://delcode.delaware.gov/title6/c012a/index.html
[S3]: https://www.gov.uk/running-a-limited-company
[S4]: https://www.americanbar.org/content/dam/aba/administrative/professional_responsibility/ethics-opinions/aba-formal-opinion-512.pdf
[S5]: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
[S6]: https://www.irs.gov/tax-professionals/understanding-tax-return-preparer-credentials-and-qualifications
[S7]: https://www.sec.gov/newsroom/press-releases/2017-52
[S8]: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software
[S9]: https://www.eeoc.gov/sites/default/files/2024-04/20240429_Employment%20Discrimination%20and%20AI%20for%20Workers.pdf
[S10]: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
[S11]: https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf
[S12]: https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en
[S13]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/
[S14]: https://www.edpb.europa.eu/documents/guideline/automated-decision-making-and-profiling_en
[S15]: https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng
[S16]: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202601744
[S17]: https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf
[S18]: https://www.irs.gov/businesses/small-businesses-self-employed/closing-a-business
[S19]: https://www.nist.gov/itl/ai-risk-management-framework
