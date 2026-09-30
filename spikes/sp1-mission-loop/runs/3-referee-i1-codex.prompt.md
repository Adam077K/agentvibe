You are the Referee. A worker running on a different model from you (Claude Sonnet) produced the claims below. Your job is acceptance, not agreement.
For EACH claim of type "fact": verify it yourself (open or search for the source_url) and check (a) the page exists, (b) the quote (or a near-verbatim equivalent) appears, (c) the quote actually supports the claim as stated (no inflated numbers, wrong dates, wrong entity, overgeneralisation).
Verdict per claim: "supported" | "unsupported" (quote absent, or does not support the claim) | "unverifiable" (page unreachable/paywalled after a real attempt). For "inference" claims judge only whether they follow from the supported facts: "supported" or "unsupported".
TOOLING NOTE: you have WebSearch only. Search for the quote and the source; "supported" requires that search results show that URL/domain carrying that content. If you cannot find it, say unverifiable, not supported.
Also judge the answer_summary: does it claim more than the supported claims show?

WORKER OUTPUT:
{
 "question_id": "q1",
 "answer_summary": "Found 11 candidate B2B niches with acute, quantified pain points: property-management COI tracking, small-practice medical billing denial follow-up, HOA maintenance backlogs, freight-broker carrier-vetting liability, dental insurance verification, PI law firm lead response, solar permitting/interconnection paperwork, CPA tax-season document collection, commercial insurance renewal communication, vet-clinic front-desk call handling, and staffing-agency resume screening. Each has documented cost/complaint evidence and an owner-level (not committee) buyer, which is the main signal for a sub-30-day close; freight-broker liability, PI lead response, and vet missed-calls stand out as most acute and fastest to close given direct revenue/legal exposure felt personally by the decision-maker. Some niches (COI tracking, dental verification, vet calls) already have point-solution vendors, so 'underserved' there likely means underserved at the smaller end of the market, not total whitespace — flagged for follow-up screening.",
 "claims": [
  {
   "claim": "Property managers waste significant time chasing vendors for insurance certificates and risk uninsured vendors working on-site when tracking lapses.",
   "type": "fact",
   "source_url": "https://www.trustlayer.io/pages/certificate-of-insurance-for-property-management",
   "quote": "hours wasted chasing vendors for renewals, risk of uninsured vendors working on-site"
  },
  {
   "claim": "Nearly half of denied medical claims at small practices are never reworked and quietly become write-offs.",
   "type": "fact",
   "source_url": "https://www.medicaleconomics.com/view/proactive-denial-management-a-revenue-game-changer-for-small-practices",
   "quote": "Nearly 50% of denied claims in small practices are never followed up on and age quietly into write-offs"
  },
  {
   "claim": "Understaffed HOA management companies fail to give resident issues adequate attention.",
   "type": "fact",
   "source_url": "https://www.hoamanagement.com/problems-with-hoa-management-companies/",
   "quote": "Having an understaffed management company means that issues won't get the attention they deserve."
  },
  {
   "claim": "A 2026 court ruling (Montgomery v. Caribe Transport II) newly exposes freight brokers to liability for negligent carrier vetting, forcing process changes.",
   "type": "fact",
   "source_url": "https://www.averitt.com/blog/supreme-court-freight-broker-carrier-vetting",
   "quote": "New Supreme Court Ruling Holds Brokers Accountable for Carrier..."
  },
  {
   "claim": "Roughly 70% of dental offices still rely on manual, phone/fax-based insurance eligibility verification.",
   "type": "fact",
   "source_url": "https://www.henryscheinone.com/insights/blogs/the-nightmare-of-eligibility-and-verification-in-dentistry/",
   "quote": "Nearly 70% of dental offices are stuck in manual verification processes, relying on phone calls and fax machines"
  },
  {
   "claim": "27% of law firms fail to respond to online leads at all, based on a study of 1,400 law firms.",
   "type": "fact",
   "source_url": "https://hennessey.com/press/hennessey-digitals-lead-form-response-time-study-of-1400-law-firms-identifies-the-fastest-responding-personal-injury-firms/",
   "quote": "27% of law firms do not respond to online leads at all"
  },
  {
   "claim": "A formal regulatory complaint was filed against major utilities in 2025 over repeated solar interconnection timeline violations.",
   "type": "fact",
   "source_url": "https://calmatters.org/economy/2025/10/rooftop-solar-hookups-miss-deadlines/",
   "quote": "CALSSA filed a formal complaint (C.25-08-021) with the CPUC in August 2025 seeking $10 million in fines against PG&E and SCE for repeated Rule 21 timeline violations."
  },
  {
   "claim": "If a commercial insurance broker goes silent 90 days before policy expiration, or takes more than 2 business days to produce a certificate, that is flagged as a common red-flag complaint.",
   "type": "fact",
   "source_url": "https://thecoylegroup.com/about-us/insurance-advice-for-business-owners/commercial-insurance-renewal-checklist/",
   "quote": "If you have not heard from your broker 90 days before expiration, that silence is a common complaint"
  },
  {
   "claim": "Missed calls cost the average veterinary clinic over $100,000 per year, with 25-30% of incoming calls going unanswered.",
   "type": "fact",
   "source_url": "https://www.puppilot.co/blog/missed-calls-lost-revenue-the-real-cost-of-a-busy-vet-front-desk",
   "quote": "Missed Calls Cost Vet Clinics $100K+ Per Year"
  },
  {
   "claim": "Recruiters at staffing agencies lose a large share of productive time to manual resume screening and administrative tasks.",
   "type": "fact",
   "source_url": "https://www.aqore.com/recruiter-productivity-staffing-agencies/",
   "quote": "Recruiter Productivity: The Real Reason Recruiters Waste 60% of ..."
  },
  {
   "claim": "Niches with owner/single-decision-maker buyers (small firm principal, clinic owner, agency owner) rather than boards or procurement committees are structurally more likely to close a first deal within 30 days.",
   "type": "inference"
  },
  {
   "claim": "Where existing point-solution vendors already serve a niche (e.g., COI tracking, dental verification, vet front-desk AI), the realistic 'underserved' opportunity for a solo operator is the smaller end of that market the incumbents under-target, not a total absence of competition.",
   "type": "inference"
  }
 ],
 "artifact": "# 11 Candidate B2B Niches — q1 Research\n\n1. **Property/vendor COI compliance tracking** — Pain: PMs manually chase vendors for certificates of insurance across spreadsheets/email; lapses create liability exposure. Evidence: trustlayer.io — hours wasted chasing vendors, risk of uninsured vendors on-site. Buyer: property management company owner/ops manager (50-1000+ unit portfolios). <30-day: single decision-maker, acute liability/audit-panic trigger.\n\n2. **Small medical practice AR/denial follow-up** — Pain: ~50% of denied claims never reworked, age into write-offs ($120k-$300k/yr lost per provider per industry commentary). Evidence: medicaleconomics.com. Buyer: practice owner/office manager, 1-10 provider clinics. <30-day: quantifiable revenue-recovery pitch, owner-level decision.\n\n3. **HOA management maintenance-ticket backlog** — Pain: understaffed management cos let tickets sit in spreadsheets/email. Evidence: hoamanagement.com. Buyer: community association manager/branch director (5-20 HOAs per manager). <30-day: slower risk — true budget holder can be the HOA board, not the management company; sell to the company's own ops to keep it fast.\n\n4. **Freight brokerage carrier-vetting & compliance docs** — Pain: manual/undocumented vetting now carries direct legal liability after a 2026 court ruling. Evidence: averitt.com, forum.freightwaves.com, truckdispatchexperts.com. Buyer: small brokerage owner/compliance specialist (5-50 employees). <30-day: very plausible — litigation fear is acute and dated, owner decides directly.\n\n5. **Dental insurance eligibility verification** — Pain: ~70% of practices still manual (phone/fax). Evidence: henryscheinone.com. Buyer: dental practice owner/office manager, solo-to-small group. <30-day: plausible, owner-decided, existing vendor ROI math ($7.11 vs $1.48/verification) makes pitch fast.\n\n6. **Personal-injury law firm lead response/intake** — Pain: 27% of firms never respond to online leads; 5-min vs 30-min response = ~21x qualification odds. Evidence: hennessey.com (1,400-firm study), pixelrush.io. Buyer: solo/small PI firm owner or intake coordinator. <30-day: strong — revenue-tied, visceral ROI, single decision-maker.\n\n7. **Solar installer permitting & interconnection paperwork** — Pain: utility interconnection queues run 8-12 weeks; >90% of applications have errors causing revision cycles and ~$475 truck rolls. Evidence: calmatters.org (CPUC complaint C.25-08-021), skyfiresd.com. Buyer: solar EPC/installer ops manager (10-50 employees). <30-day: plausible if pitched around truck-roll cost/PTO speed; may need trust-building given liability of errors.\n\n8. **CPA/accounting firm tax-season document collection** — Pain: 'late and unprepared clients' ranked #1 challenge in a ~2,000-firm Wolters Kluwer survey; CPAs lose 6-10 hrs/week chasing documents. Evidence: mangopractice.com. Buyer: CPA firm partner/office manager, 2-20 preparer firms. <30-day: timing-dependent — Sept 2026 is the natural pre-season evaluation window before Jan ramp-up.\n\n9. **Commercial insurance agency renewal/COI communication** — Pain: agencies go silent near renewal; silence 90 days out, or >2 business days for a COI, are flagged red flags. Evidence: thecoylegroup.com. Buyer: independent agency principal/account manager (1-20 producers). <30-day: plausible — E&O liability exposure is owner-felt and acute.\n\n10. **Veterinary clinic front-desk call handling** — Pain: 25-30% of calls unanswered (spikes to 60%); 85% of those callers never call back, over half call a competitor. Evidence: puppilot.co ('$100K+ Per Year' cost). Buyer: vet clinic owner/practice manager, independent or small multi-location. <30-day: plausible — quantified loss, owner-decided, market already educated by existing vendors (Peerlogic, PetDesk, Puppilot).\n\n11. **Staffing agency resume screening bottleneck** — Pain: recruiters spend ~23 hrs screening resumes per hire; 72% cite high-volume irrelevant applications as a top slowdown. Evidence: aqore.com. Buyer: staffing agency owner/branch manager, 5-50 recruiter agencies. <30-day: plausible — competitive pressure ('losing candidates to a faster agency'), branch-level decision.\n\n**Caveat:** COI tracking, dental verification, and vet front-desk calling already have point-solution incumbents (TrustLayer, SmartCompliance, Videa.ai, Puppilot, PetDesk). 'Underserved' there likely means the smaller end of the market those vendors under-target, not true whitespace — needs a follow-up screen (channel/price, explicitly out of scope for q1).",
 "confidence_after": 0.62,
 "new_questions": [
  "Which of these 11 niches has a documented existing willingness-to-pay/spend benchmark (e.g. current outsourcing rates or software spend) a solo operator could price against?",
  "Which niches are true whitespace (no existing point-solution vendor) vs. underserved segments of an already-served category?",
  "For the fastest-close candidates (freight-broker vetting, PI lead response, vet missed-calls), what does the actual outbound channel and cold-response rate look like for reaching an owner-operator within 30 days?"
 ]
}

End with ONLY this json block:
```json
{"verdicts":[{"i":0,"verdict":"supported|unsupported|unverifiable","note":"what you checked / what was wrong"}],"summary_overreach":"none | description"}
```