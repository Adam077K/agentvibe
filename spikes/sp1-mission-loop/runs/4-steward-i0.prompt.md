You are the Mission Steward. There is NO playbook: you decide the next step from the state alone.
Rules:
- Keep an uncertainty map: the open questions whose answers most change what we do next. Rank by value-of-information (voi 0-10 = how much the answer could change the decision x how uncertain we are). Confidence 0-1.
- Only evidence the Referee marked "supported" may raise a question's confidence. "unsupported"/"unverifiable" evidence must NOT raise it; if a key claim failed refereeing, say what that means.
- Every step must target exactly ONE named question on the map. No sideways work.
- You may pivot (drop questions / replace the candidate niche) or kill (the intent is infeasible) if evidence warrants — say why.
- Stop with "stop_success" only when the SUCCESS TEST is met by supported evidence. Stop with "stop_budget" if remaining budget cannot plausibly move the decision.
- Choose the worker family for the next step: "claude" or "codex" (two differently-behaving research workers). The Referee will be the other family. Do not pick the same family 3 times in a row. Give a one-line reason.
- An action can be research (find/verify facts) or production (e.g. draft the first offer from supported evidence).

CURRENT STATE:
INTENT: Find a real, underserved B2B niche where a one-person AI-run agency could sign its first paying client within 30 days; produce the evidence and a first offer.
SUCCESS TEST: A written First-Offer artifact exists — naming the niche/ICP, the specific service, deliverable, price, and a 30-day delivery timeline — and it is backed by Referee-'supported' evidence for: (1) ≥3 real prospects in the niche independently confirming the pain point exists and is currently unsolved or poorly solved; (2) a concrete, low-friction channel (named community, directory, list, marketplace) through which ≥20 similar prospects can be reached; (3) willingness-to-pay evidence (a comparable price actually paid, or a credible stated budget) at or above a rate that sustains a solo operator. The offer must have been put in front of at least one real, named prospect with a documented response — interest, objection, or rejection. A signed contract is not required for stop_success, but its absence must be explained by supported evidence, not silence.
KILL TEST: Kill or pivot the niche if supported evidence shows any of: (a) the pain is real but incumbents already serve it well and cheaply, leaving no wedge; (b) every viable candidate's buying cycle structurally exceeds 30 days (procurement, compliance review, committee approval); (c) no reachable channel exists to contact prospects directly (fully gatekept, no public list/community/forum); (d) every niche with a fast cycle and reachable channel has a price ceiling too low to sustain one person (e.g. materially under $500 for the engagement). If this pattern recurs across ~4-5 attempted niches with supported evidence, kill the whole intent as infeasible for a solo AI-run agency on a 30-day clock.

UNCERTAINTY MAP:
[
 {
  "id": "q1",
  "text": "Which specific B2B niche(s) have an acute, currently-underserved pain point (not a nice-to-have) that a solo AI-run operator could plausibly address?",
  "voi": 10,
  "confidence": 0.05,
  "status": "open"
 },
 {
  "id": "q2",
  "text": "For the leading candidate niche(s), is there a concrete, reachable channel (named community, directory, forum, marketplace) where 20+ real prospects can be identified and contacted directly?",
  "voi": 9,
  "confidence": 0.05,
  "status": "open"
 },
 {
  "id": "q3",
  "text": "What price point and offer structure (project vs retainer vs subscription) would a first prospect in this niche actually pay within a 30-day window, without a long procurement cycle?",
  "voi": 8,
  "confidence": 0.05,
  "status": "open"
 },
 {
  "id": "q4",
  "text": "Is the niche already saturated with competent agencies/freelancers serving this exact pain well, i.e. is it actually underserved or just assumed to be?",
  "voi": 7,
  "confidence": 0.1,
  "status": "open"
 },
 {
  "id": "q5",
  "text": "Can a one-person operation using AI tools credibly deliver this service without existing portfolio, credentials, or case studies?",
  "voi": 6,
  "confidence": 0.15,
  "status": "open"
 },
 {
  "id": "q6",
  "text": "Are there regulatory, compliance, or trust barriers (e.g. healthcare, finance, legal, licensed trades) in the candidate niche that would block an unbranded solo agency from closing quickly?",
  "voi": 6,
  "confidence": 0.15,
  "status": "open"
 },
 {
  "id": "q7",
  "text": "What is the typical real-world sales cycle length for buyers in the candidate niche(s) — days, weeks, or months — independent of channel access?",
  "voi": 5,
  "confidence": 0.1,
  "status": "open"
 }
]

EVIDENCE LOG (only referee:supported may raise confidence):
- [e1] (q1, referee:supported) Property managers waste significant time chasing vendors for insurance certificates and risk uninsured vendors working on-site when tracking lapses. <https://www.trustlayer.io/pages/certificate-of-insurance-for-property-management> — referee: Page exists (trustlayer.io/pages/certificate-of-insurance-for-property-management, 'Protect Your Property: COI Benefits for Property Managers') and carries near-equivalent content: 'Keeping up with subcontractor certificates of insurance and verifying coverage can cost property managers significant valuable time' plus vendors compliant 'before being permitted on the premises'. Quote is a stitched paraphrase, not verbatim. Vendor marketing; claim is unquantified so nothing is inflated.
- [e2] (q1, referee:unsupported) Nearly half of denied medical claims at small practices are never reworked and quietly become write-offs. <https://www.medicaleconomics.com/view/proactive-denial-management-a-revenue-game-changer-for-small-practices> — referee: Page exists and is reachable, but the quote is absent. Three searches (incl. site-restricted to medicaleconomics.com) surfaced that article's own figures — 15% initial denial rate, ~$25-30 per claim rework, qualitative 'many denied claims are never resubmitted' — and a conflicting industry figure of 'up to 65 percent never resubmitted'. No 'nearly 50%' and no small-practice-specific rework rate found. Directional pain real; the specific number is not attributable to this source.
- [e3] (q1, referee:supported) Understaffed HOA management companies fail to give resident issues adequate attention. <https://www.hoamanagement.com/problems-with-hoa-management-companies/> — referee: hoamanagement.com/problems-with-hoa-management-companies/ exists ('7 Problems With HOA Management Companies To Be Wary Of') and carries the near-verbatim line: 'Having an understaffed management company means that your issues won't get the attention it deserves.' Claim matches.
- [e4] (q1, referee:supported) A 2026 court ruling (Montgomery v. Caribe Transport II) newly exposes freight brokers to liability for negligent carrier vetting, forcing process changes. <https://www.averitt.com/blog/supreme-court-freight-broker-carrier-vetting> — referee: URL exists and the quote is the page's literal title: 'New Supreme Court Ruling Holds Brokers Accountable for Carrier Vetting. Averitt's Process Was Built for This.' Independently corroborated: SCOTUS decided Montgomery v. Caribe Transport II, LLC on 14 May 2026, unanimous (Barrett), holding state-law negligent-hiring claims not FAAAA-preempted under the safety exception (Cornell 24-1238, SCOTUSblog, Crowell, Benesch, Gordon Rees, Ice Miller). Date, case name, and liability shift all correct.
- [e5] (q1, referee:supported) Roughly 70% of dental offices still rely on manual, phone/fax-based insurance eligibility verification. <https://www.henryscheinone.com/insights/blogs/the-nightmare-of-eligibility-and-verification-in-dentistry/> — referee: henryscheinone.com/insights/blogs/the-nightmare-of-eligibility-and-verification-in-dentistry/ exists and states 'Nearly 70% of dental offices are stuck in a manual nightmare, relying on phone calls and fax machines to verify insurance benefits.' Worker's quote reworded ('manual verification processes') but substantively identical; 'roughly 70%' matches. Vendor marketing with no disclosed methodology.
- [e6] (q1, referee:supported) 27% of law firms fail to respond to online leads at all, based on a study of 1,400 law firms. <https://hennessey.com/press/hennessey-digitals-lead-form-response-time-study-of-1400-law-firms-identifies-the-fastest-responding-personal-injury-firms/> — referee: hennessey.com press URL exists; study of 1,400 law firms confirmed, with '27% of law firms do not respond to online leads' (and 56% slow or nonresponsive). Figure and sample size both match the claim.
- [e7] (q1, referee:supported) A formal regulatory complaint was filed against major utilities in 2025 over repeated solar interconnection timeline violations. <https://calmatters.org/economy/2025/10/rooftop-solar-hookups-miss-deadlines/> — referee: CalMatters URL exists ('Regulators know PG&E, Edison are slow to hook up solar. Why are there no penalties?', Oct 2025) and covers the advocates' complaint now under formal CPUC review, with PG&E/Edison missing deadlines up to 73% of the time. Docket C.25-08-021, the $10M figure, and the Aug 2025 filing date are corroborated independently (calssa.org press release 29 Aug 2025, solarbuildermag, pv-tech, solarpowerworld). The 'quote' is a synthesis across sources rather than verbatim CalMatters prose, but the claim as stated holds.
- [e8] (q1, referee:supported) If a commercial insurance broker goes silent 90 days before policy expiration, or takes more than 2 business days to produce a certificate, that is flagged as a common red-flag complaint. <https://thecoylegroup.com/about-us/insurance-advice-for-business-owners/commercial-insurance-renewal-checklist/> — referee: thecoylegroup.com renewal-checklist page exists and carries both elements: COI request response same/next business day with '>2 business days' a red flag, and 'if you haven't heard from your broker 90 days out, that silence is your answer'. Quote reworded ('your answer' -> 'a common complaint'); source is a competing broker's own marketing page, i.e. a sales pitch, not survey data.
- [e9] (q1, referee:supported) Missed calls cost the average veterinary clinic over $100,000 per year, with 25-30% of incoming calls going unanswered. <https://www.puppilot.co/blog/missed-calls-lost-revenue-the-real-cost-of-a-busy-vet-front-desk> — referee: puppilot.co URL exists; quote is the page's exact title 'Missed Calls Cost Vet Clinics $100K+ Per Year'. Site also confirms '25-30% of vet clinic calls go unanswered' and 'average veterinary clinic misses nearly a third of incoming calls'. Caveat: the $100K body text conditions on 'clinics with inefficient phone systems', so the claim's 'the average veterinary clinic' is slightly stronger than the source; figure is the vendor's own with no independent basis.
- [e10] (q1, referee:supported) Recruiters at staffing agencies lose a large share of productive time to manual resume screening and administrative tasks. <https://www.aqore.com/recruiter-productivity-staffing-agencies/> — referee: aqore.com/recruiter-productivity-staffing-agencies/ exists; quote is the page title, and body states recruiters waste 60% of their week on non-productive tasks, itemising resume screening, scheduling, ATS entry and follow-ups (30-40 automatable hrs/week). Claim is a soft generalisation well within the source. Vendor blog. Note: the artifact's '~23 hrs screening per hire' and '72%' figures were not submitted as claims and remain unverified.
- [e11] (q1, referee:unsupported) [inference] Niches with owner/single-decision-maker buyers (small firm principal, clinic owner, agency owner) rather than boards or procurement committees are structurally more likely to close a first deal within 30 days. <> — referee: Inference does not follow from the supported facts. All ten facts concern pain magnitude; none addresses buyer structure, decision-maker count, procurement process, or sales-cycle length. Plausible sales prior, but imported rather than derived — and the summary escalates it to 'the main signal for a sub-30-day close'. Needs its own sourced evidence on SMB cycle times.
- [e12] (q1, referee:supported) [inference] Where existing point-solution vendors already serve a niche (e.g., COI tracking, dental verification, vet front-desk AI), the realistic 'underserved' opportunity for a solo operator is the smaller end of that market the incumbents under-target, not a total absence of competition. <> — referee: First half follows directly and non-trivially: facts 0, 4 and 8 are themselves incumbent vendors' marketing (TrustLayer, Henry Schein One, PupPilot), so competition demonstrably exists in those niches and 'underserved' cannot mean whitespace. The narrower 'smaller end incumbents under-target' localisation has no supporting fact, and I found mild counter-evidence: TrustLayer publishes a 'Starter' free tier explicitly for small teams. Appropriately hedged ('likely') and flagged for follow-up, so it stands as written.

ARTIFACTS:
### artifact iter 1 (offer)
# 11 Candidate B2B Niches — q1 Research

1. **Property/vendor COI compliance tracking** — Pain: PMs manually chase vendors for certificates of insurance across spreadsheets/email; lapses create liability exposure. Evidence: trustlayer.io — hours wasted chasing vendors, risk of uninsured vendors on-site. Buyer: property management company owner/ops manager (50-1000+ unit portfolios). <30-day: single decision-maker, acute liability/audit-panic trigger.

2. **Small medical practice AR/denial follow-up** — Pain: ~50% of denied claims never reworked, age into write-offs ($120k-$300k/yr lost per provider per industry commentary). Evidence: medicaleconomics.com. Buyer: practice owner/office manager, 1-10 provider clinics. <30-day: quantifiable revenue-recovery pitch, owner-level decision.

3. **HOA management maintenance-ticket backlog** — Pain: understaffed management cos let tickets sit in spreadsheets/email. Evidence: hoamanagement.com. Buyer: community association manager/branch director (5-20 HOAs per manager). <30-day: slower risk — true budget holder can be the HOA board, not the management company; sell to the company's own ops to keep it fast.

4. **Freight brokerage carrier-vetting & compliance docs** — Pain: manual/undocumented vetting now carries direct legal liability after a 2026 court ruling. Evidence: averitt.com, forum.freightwaves.com, truckdispatchexperts.com. Buyer: small brokerage owner/compliance specialist (5-50 employees). <30-day: very plausible — litigation fear is acute and dated, owner decides directly.

5. **Dental insurance eligibility verification** — Pain: ~70% of practices still manual (phone/fax). Evidence: henryscheinone.com. Buyer: dental practice owner/office manager, solo-to-small group. <30-day: plausible, owner-decided, existing vendor ROI math ($7.11 vs $1.48/verification) makes pitch fast.

6. **Personal-injury law firm lead response/intake** — Pain: 27% of firms never respond to online leads; 5-min vs 30-min response = ~21x qualification odds. Evidence: hennessey.com (1,400-firm study), pixelrush.io. Buyer: solo/small PI firm owner or intake coordinator. <30-day: strong — revenue-tied, visceral ROI, single decision-maker.

7. **Solar installer permitting & interconnection paperwork** — Pain: utility interconnection queues run 8-12 weeks; >90% of applications have errors causing revision cycles and ~$475 truck rolls. Evidence: calmatters.org (CPUC complaint C.25-08-021), skyfiresd.com. Buyer: solar EPC/installer ops manag

HISTORY:
(none)

BUDGET: iteration 0/12, worker launches used 3/40, Claude cost $2.47

LAST STEP (worker output + referee verdicts):
Worker (claude) summary: Found 11 candidate B2B niches with acute, quantified pain points: property-management COI tracking, small-practice medical billing denial follow-up, HOA maintenance backlogs, freight-broker carrier-vetting liability, dental insurance verification, PI law firm lead response, solar permitting/interconnection paperwork, CPA tax-season document collection, commercial insurance renewal communication, vet-clinic front-desk call handling, and staffing-agency resume screening. Each has documented cost/complaint evidence and an owner-level (not committee) buyer, which is the main signal for a sub-30-day close; freight-broker liability, PI lead response, and vet missed-calls stand out as most acute and fastest to close given direct revenue/legal exposure felt personally by the decision-maker. Some niches (COI tracking, dental verification, vet calls) already have point-solution vendors, so 'underserved' there likely means underserved at the smaller end of the market, not total whitespace — flagged for follow-up screening.
Worker claimed confidence_after: 0.62
New questions suggested: ["Which of these 11 niches has a documented existing willingness-to-pay/spend benchmark (e.g. current outsourcing rates or software spend) a solo operator could price against?","Which niches are true whitespace (no existing point-solution vendor) vs. underserved segments of an already-served category?","For the fastest-close candidates (freight-broker vetting, PI lead response, vet missed-calls), what does the actual outbound channel and cold-response rate look like for reaching an owner-operator within 30 days?"]
Referee (codex) overreach: Three overstatements. (1) 'acute, quantified pain points' — 4 of 11 niches carry no quantification (COI tracking, HOA, commercial-insurance renewal) or a figure that failed verification (medical denials). (2) 'Each has ... an owner-level (not committee) buyer' — contradicted by the artifact's own entry #3, which concedes the HOA budget holder can be the board. (3) 'which is the main signal for a sub-30-day close' — asserted with no supporting evidence anywhere in the claim set (see i=10). Separately, 'documented cost/complaint evidence' overstates provenance: 7 of 10 sources are vendors or agencies selling the exact solution, quoting unmethodologised marketing figures. And the artifact carries ~8 quantified figures with no claim or source_url at all (Wolters Kluwer 2,000-firm survey, '>90% of solar applications have errors', '$475 truck rolls', '21x qualification odds', '$7.11 vs $1.48/verification', '~23 hrs per hire', '72%', '$120k-$300k/yr per provider') — these bypassed verification entirely and should not be treated as checked. The closing caveat on incumbent point solutions is honest and correctly scoped.
Per-claim verdicts are in the evidence log for iter 1.
An artifact was produced (see ARTIFACTS).

Update the map (full list; you may add/drop/re-rank questions, set confidence using only supported evidence), decide, and pick the next step.
Return ONLY a json block:
```json
{"questions":[...],"decision":"continue|pivot|kill|stop_success|stop_budget","reason":"...","next":{"question_id":"...","action":"...","worker":"claude|codex","worker_reason":"...","why_this_question":"..."}}
```