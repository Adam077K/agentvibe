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
  "voi": 5,
  "confidence": 0.7,
  "status": "open"
 },
 {
  "id": "q2",
  "text": "For the leading candidate niche(s), is there a concrete, reachable channel (named community, directory, forum, marketplace) where 20+ real prospects can be identified and contacted directly?",
  "voi": 4,
  "confidence": 0.65,
  "status": "open"
 },
 {
  "id": "q3",
  "text": "What price point and offer structure (project vs retainer vs subscription) would a first prospect in this niche actually pay within a 30-day window, without a long procurement cycle?",
  "voi": 9,
  "confidence": 0.05,
  "status": "open"
 },
 {
  "id": "q4",
  "text": "Is the niche already saturated with competent agencies/freelancers serving this exact pain well, i.e. is it actually underserved or just assumed to be?",
  "voi": 6,
  "confidence": 0.3,
  "status": "open"
 },
 {
  "id": "q5",
  "text": "Can a one-person operation using AI tools credibly deliver this service without existing portfolio, credentials, or case studies?",
  "voi": 5,
  "confidence": 0.15,
  "status": "open"
 },
 {
  "id": "q6",
  "text": "Are there regulatory, compliance, or trust barriers (e.g. healthcare, finance, legal, licensed trades) in the candidate niche that would block an unbranded solo agency from closing quickly, and do the directory/association terms of use even permit commercial solicitation of members?",
  "voi": 6,
  "confidence": 0.15,
  "status": "open"
 },
 {
  "id": "q7",
  "text": "What is the typical real-world sales cycle length for buyers in the candidate niche(s) — days, weeks, or months — independent of channel access?",
  "voi": 6,
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
- [e13] (q2, referee:supported) The TIA Member Directory is a searchable public directory of 3PL members whose principal business is arranging freight transportation, making it a direct enumeration channel for freight brokers. <https://tianet.org/TIA/TIAnetOrg/TIA-Member-Directory.aspx> — referee: tianet.org directory page confirmed via search: near-verbatim match for '3PL members whose principal business is arranging transportation of freight.'
- [e14] (q2, referee:unsupported) TIA has more than 1,800 third-party logistics members, and 70% of them are small family-owned businesses — i.e. the directory is dense with solo-operator-sized buyers, not just enterprises. <https://www.ctlogistics.com/tia> — referee: Quote ('70% of TIA members are small family owned businesses') checks out on ctlogistics.com/tia, but that same page states TIA has 'more than 1,700' members, not 1,800 as claimed — the 1,800 figure isn't in the quote and isn't supported by the cited source.
- [e15] (q2, referee:unsupported) FMCSA's public Licensing & Insurance database registers every licensed US freight broker, and there were roughly 25,087 active brokerages as of April 2025 — an exhaustive fallback list far beyond 20 prospects. <https://www.freightcaviar.com/freight-broker-statistics/> — referee: Searched freightcaviar.com/freight-broker-statistics/ directly — that page's actual content is ~30,000 active brokerages registered / 28,943 with active bonds, no '25,087' figure. The 25,087 number traces instead to Brush Pass Research's April 2025 post (via magazine.factoring.org), a different, uncited source. Wrong source attribution for this quote.
- [e16] (q2, referee:supported) FreightRun is a verifiable named TIA member freight brokerage reachable via the TIA directory. <https://www.freightrun.com/blog/post/freightrun-officially-a-member-of-the-the-transportation-intermediaries-association-tia> — referee: freightrun.com blog post confirmed, titled 'FreightRun is a Member of TIA.' Note: post is dated 2017, so it's stale evidence of current membership, but the claim as worded is technically supported.
- [e17] (q2, referee:supported) The Florida Justice Association maintains a member directory searchable by practice area and location, giving a filtered list of Florida personal-injury firms; FJA also publishes a list of local trial lawyer associations for chapter-level targeting. <https://www.myfja.org/member-benefits/> — referee: myfja.org/member-benefits confirmed: directory searchable by practice area and location, near-verbatim to quote.
- [e18] (q2, referee:unsupported) AAHA's public hospital locator covers nearly 5,000 accredited practices searchable by location, and only ~15% of US/Canada animal hospitals are accredited — so the locator is a quality-filtered slice, while state VMA directories (e.g. SCVMA's 1,000+ vets in LA/Orange County) cover the rest. <https://www.aaha.org/for-pet-parents/find-an-aaha-accredited-animal-hospital-near-me/> — referee: Quote about the AAHA locator's purpose is accurate, but the attached figure 'nearly 5,000 accredited practices' overstates the actual reported numbers: 'more than 4,500' (2025) / 'nearly 4,600' (2026 AAHA Day content). The 15% accreditation-rate figure is correctly stated, but the headline count is inflated ~8-10%.
- [e19] (q2, referee:supported) VHMA's MemberConnect community and member directory reach veterinary practice managers and office managers directly — the buyer role for front-desk/missed-call operations, not the veterinarian. <https://www.vhma.org/member-connect> — referee: vhma.org/members confirmed: 'MemberConnect Community allows members to network with fellow practice managers' matches near-verbatim.
- [e20] (q2, referee:supported) The Big 'I' federation spans 51 state associations and nearly 25,000 independent agency locations, and single state bodies are large enough to sub-segment: Big I New York alone represents 1,450+ agencies across 8 local associations. <https://www.independentagent.com/about/> — referee: independentagent.com/about confirmed 'nearly 25,000 independent agency locations' and 51 state associations; separately confirmed Big I New York's '1,450+ agencies... 8 local associations' via biginy.org fact sheet.
- [e21] (q2, referee:supported) Named independent insurance agencies are directly listed on Big 'I' local chapter sites, e.g. Big I Southern Tier NY lists Keegan Independent Agency Inc., Kolcun Insurance Agency Inc. and Kriner & Furlong Insurance Agency Inc. <https://www.bigistny.org/about> — referee: bigistny.org/about confirmed all three named agencies (Keegan, Kolcun, Kriner & Furlong) listed as Big I Southern Tier NY members.
- [e22] (q2, referee:supported) [inference] These directories yield firm names, locations and phone/web contacts but generally not named decision-maker email addresses, so the realistic first touch is phone or website form — which conveniently doubles as the diagnostic for the PI lead-response and vet missed-call niches (submitting a form or calling measures the exact failure being sold against). <> — referee: Inference follows reasonably from the supported facts: the verified directories (TIA, FJA, AAHA, Big I chapters) surface firm names/URLs/phone but no confirmed per-decision-maker emails, so phone/web-form as first touch is a fair conclusion, not an unsupported leap.
- [e23] (q3, referee:supported) Entry-tier AI receptionist for veterinary clinics starts at $49/month for unlimited simultaneous 24/7 calls. <https://dialiq.ai/ai-receptionist-veterinary-clinics> — referee: dialiq.ai vet page carries the $49/mo 'unlimited simultaneous calls, 24/7' framing verbatim; caveat that 'unlimited' = concurrency, the tier is capped at 50 calls/mo with $1.50 overage
- [e24] (q3, referee:supported) A leading AI receptionist vendor sells month-to-month with no long-term contract and mid-tier pricing around $150/month for 75 calls. <https://smith.ai/pricing/ai-receptionist> — referee: smith.ai/pricing/ai-receptionist confirms Pro at $150/mo for 75 calls, month-to-month, no long-term contract
- [e25] (q3, referee:supported) Legal-specialized answering/intake services price roughly $199-$360+/month for small firms (flat unlimited or per-minute). <https://www.getnextphone.com/blog/best-answering-service-for-law-firms> — referee: quote verified on the cited getnextphone page ($199/mo flat unlimited); the $360+ upper bound is not in the quote but page's adjacent per-minute figures ($200-$400 base) keep the range from being inflated. Vendor blog ranking itself #1
- [e26] (q3, referee:unsupported) Certificate-of-insurance tracking software follows a three-tier price ladder from $29/mo self-serve up to $7,500-$10,000+/year for full-service review. <https://www.vertikalrms.com/article/how-much-does-coi-tracking-software-cost-2026-pricing-guide/> — referee: quote is misattributed - the three-tier ladder ($29-50 / $80-300 / $7,500-10,000+) appears on coverwarden.com, not the cited Vertikal RMS page, which prices per vendor per year ($3-$10 self-service, $10-$30 full-service, CertFocus $13-$19/vendor/yr)
- [e27] (q3, referee:unsupported) Outsourced dental insurance verification is commonly priced per verification, in the $6.50-$8.25 range, which nets out to a several-hundred-dollar monthly retainer for a typical small practice. <https://dentalbilling.com/pricing-dental-insurance-verification/> — referee: quote is verbatim from dentalclaimsupport.com, not the cited dentalbilling.com pricing page, which publishes $4.25/$6.75/$7.25/$8.25 per verification plus $250/$650/$825 monthly plans
- [e28] (q3, referee:supported) A dedicated freight carrier-vetting/compliance platform is priced at $99/month, the low end of the broker software category. <https://www.carrier411.com/> — referee: carrier411.com confirms $99.00/mo flat to monitor all carriers, no contracts, 30-day trial; quote is a paraphrase and the 'most affordable' editorial is the worker's, not the site's
- [e29] (q3, referee:unsupported) The standard structure for AI-agency-delivered local-business services is a one-time setup fee plus a recurring monthly retainer, not a pure project fee. <https://taskip.net/ai-automation-agency-pricing/> — referee: cited taskip page says one-time setup fees of $3,000-$10,000 (quote says $500-$3,000) and small-business retainers $500-$1,500 (quote says $500-$2,000); page also presents project-based as one of six co-existing models, contradicting 'not a pure project fee'
- [e30] (q3, referee:unsupported) SMBs in the 2-100 employee range have no formal procurement process and typically make a software purchase decision within a week of first contact, with the owner as sole decision-maker in most cases. <https://fitsmallbusiness.com/tech-buying-in-smb/> — referee: quote is from pipeline.zoominfo.com; the cited fitsmallbusiness.com page advises forming a multi-departmental tech purchasing committee including IT - close to the opposite of 'no formal procurement, sole decision-maker'. The '2-100 employees' band and 'no formal procurement' are not in the quote
- [e31] (q3, referee:unsupported) [inference] Given buyers already anchor on $97-$300/mo self-serve tools in these categories, a solo operator's best first offer is a near-zero-setup, cancel-anytime monthly retainer priced at or slightly above that anchor rather than a larger project fee or agency-standard setup-plus-retainer combo — matching the existing mental price and removing the contract-lock objection maximizes odds of a same-week yes. <> — referee: rests on claim 7 (misattributed) for decision speed and on a '$97-$300/mo' anchor no verified source produces - supported anchors are $49, $99, $150, $199. The narrower no-contract-is-normal point does follow from claims 1 and 5, but the inference as written exceeds its base

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
### artifact iter 2 (offer)
# q2 — Reachable Channels & Named Example Prospects (4 leading niches)

Bar: one named channel per niche through which 20+ real prospects can be identified AND contacted directly, plus real named examples.

---

## 1. Freight-broker carrier vetting / compliance

**Primary channel — TIA Member Directory**
- URL: https://tianet.org/TIA/TIAnetOrg/TIA-Member-Directory.aspx (associate/marketplace directory: https://tianet.org/TIA/Shared_Content/BuyersGuide/Associates.aspx)
- Scale: 1,800+ member companies; 70% small family-owned businesses
- Fit: buyer (brokerage owner / compliance lead) is reachable at company level; TIA itself publishes carrier-vetting resource guides, so members are pre-sensitised to the pain

**Secondary channel — FMCSA Licensing & Insurance (L&I) public register + SAFER**
- URL: https://li-public.fmcsa.dot.gov/LIVIEW/pkg_li_std_routines.prc_help?pn_pageid=5 , https://safer.fmcsa.dot.gov/
- Bulk download: https://catalog.data.gov/dataset/licensing-and-insurance
- Scale: ~25,000 active broker authorities (Apr 2025). Exhaustive, not opt-in. Filterable by state and authority status.
- Also noted: brushpassresearch.blog sells sales intel on freight brokerages (third-party list source)

**Named example prospects (verified TIA members / broker authorities)**
| Company | URL | Evidence |
|---|---|---|
| FreightRun | freightrun.com | published post announcing TIA membership |
| CT Logistics | ctlogistics.com/tia | dedicated "TIA Member" page |
| Freightline Group | freightlinegroup.com/credentials | credentials page listing broker authority |

**Honest gap:** web search surfaces few small brokerages by name. The 20+ list must be built by paging the TIA directory or filtering the L&I bulk dataset by state — both are open, both work, but neither is searchable from outside. Budget 1-2 hours of directory work, not search.

---

## 2. Personal-injury law firm lead response / intake

**Primary channel — state trial lawyer association member directories**
- Florida Justice Association: https://www.myfja.org/member-benefits/ — online member directory, searchable by practice area + location
- FJA local TLA list (city-level chapters): https://www.myfja.org/local-tlas/
- National AAJ public directory: https://directory.justice.org/Listing.asp?access=public&MDSID=AAJ-7118
- Bulk backup: https://www.justia.com/lawyers/personal-injury/florida , lawyers.lawyerlegion.com/florida/tampa/personal-injury

**Qualification channel — Hennessey Digital annual response-tim

HISTORY:
- iter 1: q1 via claude (refereed by codex) — Generate 8-12 candidate B2B niches for a one-person AI-run agency's first paying client. For each candidate: (1) name the specific, acute pain point (not a vagu → supported 10/unsupported 2/unverifiable 0
- iter 2: q2 via codex (refereed by claude) — research: for the 4 most acute, best-evidenced candidates (freight-broker carrier vetting/compliance, PI law-firm lead response, vet-clinic missed-call handling → supported 7/unsupported 3/unverifiable 0

BUDGET: iteration 2/12, worker launches used 9/40, Claude cost $6.61

LAST STEP (worker output + referee verdicts):
Worker (claude) summary: Across all five niches, buyers already benchmark against $49-$300/mo self-serve tools and $250-$800+/mo done-for-service retainers, all sold month-to-month with no annual contract — this is the price/structure ceiling a solo operator can credibly match without procurement friction. SMBs in this size band (2-100 employees) decide fast, usually within a week, with the owner as sole decision-maker, so a low/no-setup-fee, cancel-anytime monthly retainer priced at $97-$497/mo (scaled by niche stakes) is the structure most likely to close within 30 days.
Worker claimed confidence_after: 0.68
New questions suggested: ["Would a performance/contingency structure (e.g., % of recovered no-show or claim revenue) close faster than a flat retainer for risk-averse first-time SMB buyers in any of these niches?","At what monthly price point does a solo practice/small firm owner shift from 'impulse yes' to 'let me think about it' — is there a hard ceiling below $300/mo across niches?","Do any of these niches have a common free-trial or pilot-week norm that would let a first prospect say yes without even a monthly commitment?"]
Referee (codex) overreach: Overreaches on three counts. (1) 'All sold month-to-month with no annual contract' is verified only for Smith.ai and Carrier411; the COI full-service tier the worker cites is priced per year, and no contract terms were established for the dental or agency categories. (2) 'SMBs (2-100 employees) decide fast, usually within a week, with the owner as sole decision-maker' rests entirely on claim 7, whose quote belongs to ZoomInfo while the page actually cited recommends a multi-departmental purchasing committee. (3) The '$97-$497/mo' recommended band and the '$97-$300/mo' anchor have no verified source behind either endpoint. Four of eight facts verified clean, one with caveats, three misattributed to pages that do not carry the quote - the summary is stated with the confidence of eight.
Per-claim verdicts are in the evidence log for iter 3.

Update the map (full list; you may add/drop/re-rank questions, set confidence using only supported evidence), decide, and pick the next step.
Return ONLY a json block:
```json
{"questions":[...],"decision":"continue|pivot|kill|stop_success|stop_budget","reason":"...","next":{"question_id":"...","action":"...","worker":"claude|codex","worker_reason":"...","why_this_question":"..."}}
```