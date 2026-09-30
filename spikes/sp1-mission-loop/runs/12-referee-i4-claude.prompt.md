You are the Referee. A worker running on a different model from you (Claude Opus) produced the claims below. Your job is acceptance, not agreement.
For EACH claim of type "fact": verify it yourself (open or search for the source_url) and check (a) the page exists, (b) the quote (or a near-verbatim equivalent) appears, (c) the quote actually supports the claim as stated (no inflated numbers, wrong dates, wrong entity, overgeneralisation).
Verdict per claim: "supported" | "unsupported" (quote absent, or does not support the claim) | "unverifiable" (page unreachable/paywalled after a real attempt). For "inference" claims judge only whether they follow from the supported facts: "supported" or "unsupported".
TOOLING NOTE: you have WebSearch only. Search for the quote and the source; "supported" requires that search results show that URL/domain carrying that content. If you cannot find it, say unverifiable, not supported.
Also judge the answer_summary: does it claim more than the supported claims show?

WORKER OUTPUT:
{
 "question_id": "q3",
 "answer_summary": "The 30-day-closable shape is not a project and not an annual subscription: it is a sub-$1,000 single-signature first step (paid pilot or fixed-fee review) converting to a month-to-month retainer of roughly $850-$1,000/mo, priced between the $99/mo software floor and the $1,299/mo human-VA or $300-$2,500/mo human-intake substitute it displaces. PI intake is the stronger first target because it has a public per-unit value anchor -- PI firms average $284 per lead and $468 per signed case -- so a $1,000/mo fee pays back on ~3.5 recovered leads, an ROI you can state in one sentence. Freight carrier vetting supports a $1,500 fixed review plus $850/mo monitoring, and the space is demonstrably not procurement-bound (the incumbent consultancy sends its agreement within 24 hours and starts within two weeks), but it lacks a public per-unit value number so ROI must be argued rather than calculated. Critical structural finding: never sell the build -- an AI voice receptionist build is publicly transacting at $500 fixed price on Upwork with gigs from $35, so revenue must come from ongoing outcome, not implementation.",
 "claims": [
  {
   "claim": "Human legal intake services are priced at $1.50-$4.00 per minute or $300-$2,500 per month on retainer, and legal intake is sold in four models: per-minute, per-qualified-lead, monthly retainer, and per-signed-case.",
   "type": "fact",
   "source_url": "https://www.layer3labs.io/guides/legal-intake-services",
   "quote": "Human legal intake services cost $1.50-$4.00 per minute or $300-$2,500 per month on retainer."
  },
  {
   "claim": "Buyer-side guidance recommends a hybrid structure -- low fixed retainer plus a per-qualified-lead bonus against a firm-controlled written rubric -- as the cleanest setup for most law firms, with per-qualified-lead pricing benchmarked at $25-$150 per lead.",
   "type": "fact",
   "source_url": "https://www.layer3labs.io/guides/legal-intake-services",
   "quote": "The cleanest setup for most firms is a hybrid: low fixed retainer for availability plus a per-qualified-lead bonus tied to a written qualification rubric you control."
  },
  {
   "claim": "Personal injury firms pay an average of about $284 per lead across paid channels in 2026, with cost per signed case around $468 -- giving a hard per-unit value anchor for pricing a lead-recovery service.",
   "type": "fact",
   "source_url": "https://rankings.io/blog/personal-injury-lead-costs/",
   "quote": "the average PI firm pays around $284 per lead across paid channels in 2026, with a cost per signed case closer to $468"
  },
  {
   "claim": "Freight carrier onboarding/monitoring platforms charge roughly $2-$10 per carrier per month plus $50-$500 per broker seat per month, setting the software price envelope a done-for-you vetting service must sit above.",
   "type": "fact",
   "source_url": "https://carrieratlas.com/carrier-packets.php",
   "quote": "Most carrier onboarding platforms charge per broker seat plus per monitored carrier, with typical pricing around $2–$10 per carrier per month for monitoring and $50–$500 per seat per month for the platform."
  },
  {
   "claim": "Small brokerages already pay published rates of $1,299/month (part-time) to $1,999/month (full-time) for an outsourced freight-broker virtual assistant doing back-office and compliance document work -- the human-labour substitute a vetting retainer must undercut.",
   "type": "fact",
   "source_url": "https://www.wishup.co/blog/freight-broker-virtual-assistant/",
   "quote": "The Prime VA plan costs $1,999 per month for full-time and $1,299 per month for part-time."
  },
  {
   "claim": "The incumbent consultancy selling exactly a freight-broker carrier vetting and compliance audit prices it as custom time-and-materials scoped after a call, sends its agreement within 24 hours of mutual interest, and can begin within two weeks of signature -- confirming the space transacts without a long procurement cycle and leaving no published fixed SMB price point.",
   "type": "fact",
   "source_url": "https://www.3plogistics.com/consulting-expert-witness/freight-broker-carrier-vetting-compliance-audit/",
   "quote": "the engagement can begin within two weeks of execution of the consulting agreement"
  },
  {
   "claim": "A live posted job with a stated budget shows the build of an AI voice receptionist transacting at $500 fixed price, meaning implementation is a commodity and cannot be the revenue basis.",
   "type": "fact",
   "source_url": "https://www.upwork.com/freelance-jobs/apply/Voice-Receptionist-for-Service-Company_~022056519076716738893/",
   "quote": "AI Voice Receptionist for Service Company - Freelance Job in Customer Service & Tech Support - $500.00 Fixed Price, posted May 18, 2026"
  },
  {
   "claim": "Deals under $1,000 ACV average 25 days to close, versus an 84-day median across all B2B SaaS deal sizes -- so a 30-day first close requires keeping the initial commitment small rather than selling an annual contract up front.",
   "type": "fact",
   "source_url": "https://b2bsalestraining.org/average-sales-cycle-length",
   "quote": "The sales cycle for deals under $1,000 ACV averages 25 days"
  },
  {
   "claim": "A published founder case study in this exact niche shape priced a build-and-run retainer at $8,000 upfront implementation plus $3,000/month ongoing, and identified the winning positioning as 'AI-powered intake and follow-up systems for solo attorneys' -- though this is vendor-published, not an audited transaction record.",
   "type": "fact",
   "source_url": "https://www.mindstudio.ai/blog/start-ai-automation-business-case-studies",
   "quote": "One successful founder priced her AI automation business as a build-and-run retainer: $8,000 upfront implementation plus $3,000/month ongoing."
  },
  {
   "claim": "Because the incumbent human service costs $300-$2,500/mo and the incumbent software costs $99-$499/mo, a solo operator's defensible retainer band is roughly $850-$1,500/mo: high enough to be a service rather than a tool, low enough to read as substitution for labour the buyer already pays for.",
   "type": "inference",
   "source_url": "",
   "quote": ""
  },
  {
   "claim": "The PI offer should lead because its ROI is arithmetic rather than argument -- at $284/lead a $1,000/mo retainer breaks even on 3.5 recovered leads -- whereas the freight offer sells against liability exposure with no public per-unit value number, which lengthens the conversation even though the contracting mechanics are demonstrably fast.",
   "type": "inference",
   "source_url": "",
   "quote": ""
  }
 ],
 "artifact": "# First Offer — Price Point & Structure\n\n## PRIMARY: \"First-Call Guarantee\" for small PI firms\n\n**Claim:** You will never lose another case to a slow phone or an unanswered web form. If you do, you don't pay that month.\n\n### Three steps, each signable by the owner alone\n\n**1. Free diagnostic (day 0-2)** — Submit their own web form and call their own line after hours. Deliver a one-page timestamped record: time-to-first-response, calls unanswered, forms never replied to. Self-verifying evidence, not a pitch deck. (27% of firms never respond to online leads at all.)\n\n**2. 21-day paid pilot — $500 fixed, credited to month 1** — Live 24/7 capture on one number + one form, <5-minute callback SLA, qualified-lead summaries into inbox or case management. Single invoice, card payment, no contract beyond the pilot.\n\n**3. Month-to-month retainer — $1,000/mo**, cancel anytime, **plus $75 per qualified lead above 15/mo** against a written qualification rubric the firm controls.\n\n### Why these numbers\n- $1,000/mo sits inside the $300–$2,500 human-intake retainer band and replaces a service also billing $1.50–$4.00/min → reads as substitution, not a new line item.\n- At $284/lead, break-even is 3.5 recovered leads/month; at $468/signed case, ~2 signings.\n- Low fixed retainer + per-qualified-lead is the structure buyer-side guidance itself calls cleanest — you propose what an informed buyer would ask for.\n- $500 first commitment stays under the sub-$1,000 fast-close threshold and under any plausible owner signature limit.\n\n### What NOT to sell\nThe build. Fixed-price \"build me an AI receptionist\" jobs transact publicly at $500; gigs start at $35. Never quote a build fee.\n\n### 30-day path\nDays 1-10: run diagnostics on 30 FJA-directory firms. Days 8-20: send each firm its own timestamped failure record + pilot offer. Days 15-30: close 1-2 pilots at $500. Target: first dollar by day 30, first retainer by day 45.\n\n---\n\n## ALTERNATE: Freight-broker carrier vetting (run second)\n\n**Structure:** $1,500 fixed **Carrier Vetting Readiness Review** (14 days; deliverable = written gap assessment against the post-*Montgomery* standard of care + remediation checklist) → **$850/mo continuous monitoring retainer** (weekly re-check of every active carrier's authority/insurance/fraud signals, lapse alerts, monthly evidence file for insurer or defence counsel).\n\n**Why:** $850/mo undercuts the $1,299/mo part-time VA doing this manually today, while sitting far above the $99/mo software floor because the deliverable is a defensible evidence file, not a dashboard. The $1,500 review mirrors the incumbent consultancy's audit product at a price a 70%-family-owned TIA membership can approve without a scoping cycle — the incumbent quotes custom time-and-materials, which is precisely the gap a fixed-fee solo offer fills.\n\n**Why second:** liability sale with no public per-unit value number → ROI must be argued, not calculated. Slower to first yes.\n\n---\n\n## Source-quality caveat\nMost price *ranges* above come from vendor/aggregator buyer's-guide pages, not audited transaction records. The two hardest datapoints are the live $500 Upwork posting and Wishup's published VA rate card. No invoice or named-client case study of a consultant billing a specific small brokerage or small PI firm was found.",
 "confidence_after": 0.6,
 "new_questions": [
  "Can we obtain one verified transaction record -- an Upwork/RFP posting with a stated budget for carrier vetting or legal intake, or a named-client invoice -- to replace the aggregator ranges with a real paid price?",
  "Does a small PI firm owner have unilateral authority to approve a $1,000/mo month-to-month service on a card, or does anything above a threshold trigger a bookkeeper/PO step that breaks the 30-day window?",
  "Is per-qualified-lead billing actually enforceable and auditable without read access to the firm's case management system, and if not, should month 1 be flat-fee only?"
 ]
}

End with ONLY this json block:
```json
{"verdicts":[{"i":0,"verdict":"supported|unsupported|unverifiable","note":"what you checked / what was wrong"}],"summary_overreach":"none | description"}
```