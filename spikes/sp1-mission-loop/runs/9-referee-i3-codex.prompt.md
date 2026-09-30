You are the Referee. A worker running on a different model from you (Claude Sonnet) produced the claims below. Your job is acceptance, not agreement.
For EACH claim of type "fact": verify it yourself (open or search for the source_url) and check (a) the page exists, (b) the quote (or a near-verbatim equivalent) appears, (c) the quote actually supports the claim as stated (no inflated numbers, wrong dates, wrong entity, overgeneralisation).
Verdict per claim: "supported" | "unsupported" (quote absent, or does not support the claim) | "unverifiable" (page unreachable/paywalled after a real attempt). For "inference" claims judge only whether they follow from the supported facts: "supported" or "unsupported".
TOOLING NOTE: you have WebSearch only. Search for the quote and the source; "supported" requires that search results show that URL/domain carrying that content. If you cannot find it, say unverifiable, not supported.
Also judge the answer_summary: does it claim more than the supported claims show?

WORKER OUTPUT:
{
 "question_id": "q3",
 "answer_summary": "Across all five niches, buyers already benchmark against $49-$300/mo self-serve tools and $250-$800+/mo done-for-service retainers, all sold month-to-month with no annual contract — this is the price/structure ceiling a solo operator can credibly match without procurement friction. SMBs in this size band (2-100 employees) decide fast, usually within a week, with the owner as sole decision-maker, so a low/no-setup-fee, cancel-anytime monthly retainer priced at $97-$497/mo (scaled by niche stakes) is the structure most likely to close within 30 days.",
 "claims": [
  {
   "claim": "Entry-tier AI receptionist for veterinary clinics starts at $49/month for unlimited simultaneous 24/7 calls.",
   "type": "fact",
   "source_url": "https://dialiq.ai/ai-receptionist-veterinary-clinics",
   "quote": "DialIQ starts at $49/month for unlimited simultaneous calls, 24/7"
  },
  {
   "claim": "A leading AI receptionist vendor sells month-to-month with no long-term contract and mid-tier pricing around $150/month for 75 calls.",
   "type": "fact",
   "source_url": "https://smith.ai/pricing/ai-receptionist",
   "quote": "There aren't any long-term contracts, you pay for the AI Receptionist service each month, and if you cancel, they need 30 days' notice. ... Pro plans start at $150 per month for 75 calls with month-to-month, no contract."
  },
  {
   "claim": "Legal-specialized answering/intake services price roughly $199-$360+/month for small firms (flat unlimited or per-minute).",
   "type": "fact",
   "source_url": "https://www.getnextphone.com/blog/best-answering-service-for-law-firms",
   "quote": "NextPhone handles unlimited inbound calls for a flat $199/month."
  },
  {
   "claim": "Certificate-of-insurance tracking software follows a three-tier price ladder from $29/mo self-serve up to $7,500-$10,000+/year for full-service review.",
   "type": "fact",
   "source_url": "https://www.vertikalrms.com/article/how-much-does-coi-tracking-software-cost-2026-pricing-guide/",
   "quote": "Tier 1 basic trackers cost $29–$50/month, Tier 2 software with real verification costs roughly $80 to $300 a month, and Tier 3 full-service review costs $7,500–$10,000+ per year."
  },
  {
   "claim": "Outsourced dental insurance verification is commonly priced per verification, in the $6.50-$8.25 range, which nets out to a several-hundred-dollar monthly retainer for a typical small practice.",
   "type": "fact",
   "source_url": "https://dentalbilling.com/pricing-dental-insurance-verification/",
   "quote": "Outsourced dental verification companies typically charge rates ranging from $6.50 – $8.25 per verification"
  },
  {
   "claim": "A dedicated freight carrier-vetting/compliance platform is priced at $99/month, the low end of the broker software category.",
   "type": "fact",
   "source_url": "https://www.carrier411.com/",
   "quote": "Carrier411 offers carrier compliance management for $99 per month, making it one of the most affordable dedicated carrier vetting platforms for freight brokers."
  },
  {
   "claim": "The standard structure for AI-agency-delivered local-business services is a one-time setup fee plus a recurring monthly retainer, not a pure project fee.",
   "type": "fact",
   "source_url": "https://taskip.net/ai-automation-agency-pricing/",
   "quote": "Agencies selling done-for-you local services usually price in two parts: a one-time setup fee to get the client live, and a recurring monthly retainer to keep the service running, with reported monthly retainers commonly around $500 to $2,000 a month and one-time setup fees in the range of roughly $500 to $3,000"
  },
  {
   "claim": "SMBs in the 2-100 employee range have no formal procurement process and typically make a software purchase decision within a week of first contact, with the owner as sole decision-maker in most cases.",
   "type": "fact",
   "source_url": "https://fitsmallbusiness.com/tech-buying-in-smb/",
   "quote": "SMB buying involves one or two decision-makers, a short evaluation window, and a purchase decision that often happens within a week of first contact."
  },
  {
   "claim": "Given buyers already anchor on $97-$300/mo self-serve tools in these categories, a solo operator's best first offer is a near-zero-setup, cancel-anytime monthly retainer priced at or slightly above that anchor rather than a larger project fee or agency-standard setup-plus-retainer combo — matching the existing mental price and removing the contract-lock objection maximizes odds of a same-week yes.",
   "type": "inference",
   "source_url": "",
   "quote": ""
  }
 ],
 "artifact": null,
 "confidence_after": 0.68,
 "new_questions": [
  "Would a performance/contingency structure (e.g., % of recovered no-show or claim revenue) close faster than a flat retainer for risk-averse first-time SMB buyers in any of these niches?",
  "At what monthly price point does a solo practice/small firm owner shift from 'impulse yes' to 'let me think about it' — is there a hard ceiling below $300/mo across niches?",
  "Do any of these niches have a common free-trial or pilot-week norm that would let a first prospect say yes without even a monthly commitment?"
 ]
}

End with ONLY this json block:
```json
{"verdicts":[{"i":0,"verdict":"supported|unsupported|unverifiable","note":"what you checked / what was wrong"}],"summary_overreach":"none | description"}
```