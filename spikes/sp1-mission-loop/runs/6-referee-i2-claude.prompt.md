You are the Referee. A worker running on a different model from you (Claude Opus) produced the claims below. Your job is acceptance, not agreement.
For EACH claim of type "fact": verify it yourself (open or search for the source_url) and check (a) the page exists, (b) the quote (or a near-verbatim equivalent) appears, (c) the quote actually supports the claim as stated (no inflated numbers, wrong dates, wrong entity, overgeneralisation).
Verdict per claim: "supported" | "unsupported" (quote absent, or does not support the claim) | "unverifiable" (page unreachable/paywalled after a real attempt). For "inference" claims judge only whether they follow from the supported facts: "supported" or "unsupported".
TOOLING NOTE: you have WebSearch only. Search for the quote and the source; "supported" requires that search results show that URL/domain carrying that content. If you cannot find it, say unverifiable, not supported.
Also judge the answer_summary: does it claim more than the supported claims show?

WORKER OUTPUT:
{
 "question_id": "q2",
 "answer_summary": "Yes — all four candidate niches have concrete, named, reachable channels that comfortably clear the 20-prospect bar, and in each case a real named example prospect was verified. Strongest are trade-association member directories (TIA for freight brokers; state trial-lawyer associations like the Florida Justice Association for PI firms; VHMA MemberConnect and AAHA's locator for vet practices; Big 'I' state/local chapters for insurance agencies), backed in the freight case by FMCSA's exhaustive public Licensing & Insurance register of ~25,000 active brokers. The insurance and vet niches have the cleanest buyer-level reach: Big 'I' local chapters are 20-80 agencies each, and VHMA reaches practice managers (the actual front-desk decision-maker) rather than veterinarians. The freight niche has the largest addressable list but the thinnest set of names findable via search alone — enumeration there requires working the TIA directory and FMCSA L&I database directly rather than web search.",
 "claims": [
  {
   "claim": "The TIA Member Directory is a searchable public directory of 3PL members whose principal business is arranging freight transportation, making it a direct enumeration channel for freight brokers.",
   "type": "fact",
   "source_url": "https://tianet.org/TIA/TIAnetOrg/TIA-Member-Directory.aspx",
   "quote": "The TIA Member Directory allows you to search 3PL members whose principal business is arranging transportation of freight"
  },
  {
   "claim": "TIA has more than 1,800 third-party logistics members, and 70% of them are small family-owned businesses — i.e. the directory is dense with solo-operator-sized buyers, not just enterprises.",
   "type": "fact",
   "source_url": "https://www.ctlogistics.com/tia",
   "quote": "70% of TIA members are small family owned businesses"
  },
  {
   "claim": "FMCSA's public Licensing & Insurance database registers every licensed US freight broker, and there were roughly 25,087 active brokerages as of April 2025 — an exhaustive fallback list far beyond 20 prospects.",
   "type": "fact",
   "source_url": "https://www.freightcaviar.com/freight-broker-statistics/",
   "quote": "As of April 2025, there were approximately 25,087 active freight brokerages with MC numbers"
  },
  {
   "claim": "FreightRun is a verifiable named TIA member freight brokerage reachable via the TIA directory.",
   "type": "fact",
   "source_url": "https://www.freightrun.com/blog/post/freightrun-officially-a-member-of-the-the-transportation-intermediaries-association-tia",
   "quote": "FreightRun is a Member of TIA"
  },
  {
   "claim": "The Florida Justice Association maintains a member directory searchable by practice area and location, giving a filtered list of Florida personal-injury firms; FJA also publishes a list of local trial lawyer associations for chapter-level targeting.",
   "type": "fact",
   "source_url": "https://www.myfja.org/member-benefits/",
   "quote": "The Florida Justice Association offers a printed and online member directory where you can search by practice area and location"
  },
  {
   "claim": "AAHA's public hospital locator covers nearly 5,000 accredited practices searchable by location, and only ~15% of US/Canada animal hospitals are accredited — so the locator is a quality-filtered slice, while state VMA directories (e.g. SCVMA's 1,000+ vets in LA/Orange County) cover the rest.",
   "type": "fact",
   "source_url": "https://www.aaha.org/for-pet-parents/find-an-aaha-accredited-animal-hospital-near-me/",
   "quote": "AAHA offers an animal hospital directory that helps you find a veterinarian near you who has met or exceeded voluntary standards of excellence"
  },
  {
   "claim": "VHMA's MemberConnect community and member directory reach veterinary practice managers and office managers directly — the buyer role for front-desk/missed-call operations, not the veterinarian.",
   "type": "fact",
   "source_url": "https://www.vhma.org/member-connect",
   "quote": "The MemberConnect Community allows members to network with fellow practice managers"
  },
  {
   "claim": "The Big 'I' federation spans 51 state associations and nearly 25,000 independent agency locations, and single state bodies are large enough to sub-segment: Big I New York alone represents 1,450+ agencies across 8 local associations.",
   "type": "fact",
   "source_url": "https://www.independentagent.com/about/",
   "quote": "nearly 25,000 independent agency locations nationwide"
  },
  {
   "claim": "Named independent insurance agencies are directly listed on Big 'I' local chapter sites, e.g. Big I Southern Tier NY lists Keegan Independent Agency Inc., Kolcun Insurance Agency Inc. and Kriner & Furlong Insurance Agency Inc.",
   "type": "fact",
   "source_url": "https://www.bigistny.org/about",
   "quote": "Keegan Independent Agency Inc., Kolcun Insurance Agency Inc., and Kriner & Furlong Insurance Agency Inc."
  },
  {
   "claim": "These directories yield firm names, locations and phone/web contacts but generally not named decision-maker email addresses, so the realistic first touch is phone or website form — which conveniently doubles as the diagnostic for the PI lead-response and vet missed-call niches (submitting a form or calling measures the exact failure being sold against).",
   "type": "inference",
   "source_url": "",
   "quote": ""
  }
 ],
 "artifact": "# q2 — Reachable Channels & Named Example Prospects (4 leading niches)\n\nBar: one named channel per niche through which 20+ real prospects can be identified AND contacted directly, plus real named examples.\n\n---\n\n## 1. Freight-broker carrier vetting / compliance\n\n**Primary channel — TIA Member Directory**\n- URL: https://tianet.org/TIA/TIAnetOrg/TIA-Member-Directory.aspx (associate/marketplace directory: https://tianet.org/TIA/Shared_Content/BuyersGuide/Associates.aspx)\n- Scale: 1,800+ member companies; 70% small family-owned businesses\n- Fit: buyer (brokerage owner / compliance lead) is reachable at company level; TIA itself publishes carrier-vetting resource guides, so members are pre-sensitised to the pain\n\n**Secondary channel — FMCSA Licensing & Insurance (L&I) public register + SAFER**\n- URL: https://li-public.fmcsa.dot.gov/LIVIEW/pkg_li_std_routines.prc_help?pn_pageid=5 , https://safer.fmcsa.dot.gov/\n- Bulk download: https://catalog.data.gov/dataset/licensing-and-insurance\n- Scale: ~25,000 active broker authorities (Apr 2025). Exhaustive, not opt-in. Filterable by state and authority status.\n- Also noted: brushpassresearch.blog sells sales intel on freight brokerages (third-party list source)\n\n**Named example prospects (verified TIA members / broker authorities)**\n| Company | URL | Evidence |\n|---|---|---|\n| FreightRun | freightrun.com | published post announcing TIA membership |\n| CT Logistics | ctlogistics.com/tia | dedicated \"TIA Member\" page |\n| Freightline Group | freightlinegroup.com/credentials | credentials page listing broker authority |\n\n**Honest gap:** web search surfaces few small brokerages by name. The 20+ list must be built by paging the TIA directory or filtering the L&I bulk dataset by state — both are open, both work, but neither is searchable from outside. Budget 1-2 hours of directory work, not search.\n\n---\n\n## 2. Personal-injury law firm lead response / intake\n\n**Primary channel — state trial lawyer association member directories**\n- Florida Justice Association: https://www.myfja.org/member-benefits/ — online member directory, searchable by practice area + location\n- FJA local TLA list (city-level chapters): https://www.myfja.org/local-tlas/\n- National AAJ public directory: https://directory.justice.org/Listing.asp?access=public&MDSID=AAJ-7118\n- Bulk backup: https://www.justia.com/lawyers/personal-injury/florida , lawyers.lawyerlegion.com/florida/tampa/personal-injury\n\n**Qualification channel — Hennessey Digital annual response-time study**\n- https://hennessey.com/2025-lead-form-response-time-study/ , https://hennessey.com/press/2025-list-of-fastest-responding-personal-injury-firms/\n- Publishes the FAST responders by name. The complement — firms absent from the honour roll — is a pre-qualified prospect set. 56% of the ~1,400 studied are slow or nonresponsive.\n- Self-serve qualification: submit a form to any directory-listed firm and time the response. Every non-response IS the pitch.\n\n**Named example prospects (FJA-affiliated, Tampa metro)**\n| Firm | URL |\n|---|---|\n| Swope, Rodante, Newsome & Steinberg | swoperodante.com |\n| Vanguard Attorneys | vanguardinjuryattorneys.com |\n| Fernandez Law Group | fernandezvinaslaw.com |\n| The Fran Haasch Law Group | franhaaschlaw.com |\n\n---\n\n## 3. Vet-clinic missed-call handling\n\n**Primary channel — VHMA (buyer-role targeting)**\n- MemberConnect community + member directory: https://www.vhma.org/member-connect , https://www.vhma.org/page/membership\n- Membership = hospital administrators, practice managers, office managers, veterinarians, consultants. This is the exact person who owns front-desk call handling.\n- Why this beats clinic directories: the practice manager is the budget holder for front-desk ops; a clinic directory gets you a receptionist.\n\n**Secondary channel — AAHA hospital locator**\n- https://www.aaha.org/for-pet-parents/find-an-aaha-accredited-animal-hospital-near-me/\n- ~5,000 accredited practices, searchable by location; only ~15% of US/Canada hospitals accredited → quality-filtered, likelier to invest in ops\n\n**Tertiary channel — state VMA member directories**\n- MVMA (MA): https://www.massvet.org/find-a-veterinarian-directory\n- WSVMA (WA): https://mycommunity.wsvma.org/search/\n- SCVMA (LA/Orange County): https://www.scvma.org/find-a-local-veterinarian/ — 1,000+ vets in one metro\n- Full state list: https://www.avma.org/about/state-and-allied-groups\n\n**Named example prospects (AAHA-accredited independents)**\n| Clinic | Location | URL |\n|---|---|---|\n| West Loop Veterinary Care | Chicago, IL | westloopvet.com |\n| Cowtown Vet | Fort Worth / Arlington Heights, TX | cowtownvet.com |\n| Bridgton Veterinary Hospital | Bridgton, ME | bridgtonvets.com |\n\n---\n\n## 4. Commercial insurance renewal communication\n\n**Primary channel — Big \"I\" state + local association chapters**\n- State association finder: https://www.independentagent.com/find-your-state/\n- Scale: 51 state associations, ~25,000 independent agency locations nationally\n- Best granularity is LOCAL chapters — each is 20-80 agencies, i.e. exactly one campaign:\n  - Big I New York (1,450+ agencies, 8 locals): https://www.biginy.org/networking/locals/\n  - Big I Southern Tier NY: https://www.bigistny.org/about\n  - Big I Suffolk: https://bigisuffolk.org/\n  - Big I Central NY: http://bigicny.com/\n  - Big I Greater Rochester: https://www.bigiroc.com/\n  - Big I Illinois \"Search For an Agency\": https://www.ilbigi.org/\n\n**Named example prospects (Big I Southern Tier NY members)**\n| Agency | Source |\n|---|---|\n| Keegan Independent Agency Inc. | bigistny.org/about |\n| Kolcun Insurance Agency Inc. | bigistny.org/about |\n| Kriner & Furlong Insurance Agency Inc. | bigistny.org/about |\n\n**Open positioning question (carried to q3):** the renewal-communication pain was evidenced from the *insured's* side (broker goes silent 90 days out). Selling to the agency means selling the fix to the party causing the pain — a retention/E&O pitch, not a relief pitch. Selling to insured businesses instead means abandoning this channel. Needs resolving before outreach copy is written.\n\n---\n\n## Channel ranking for <30-day first client\n\n1. **Big \"I\" local chapters** — smallest, most walkable list; named members already public; single owner-operator decision-maker\n2. **VHMA MemberConnect** — buyer-role precision is unmatched; community norms require value-first participation, so ramp is ~1-2 weeks\n3. **State TLA directories + form-response test** — the qualification step doubles as the demo; highest pitch potency\n4. **TIA directory / FMCSA L&I** — largest list and most acute (litigation) trigger, but requires manual enumeration and brokers are in a contraction cycle (3,100+ closed in 2024), so list hygiene matters\n",
 "confidence_after": 0.82,
 "new_questions": [
  "For the commercial-insurance niche, is the buyer the agency (retention/E&O framing) or the insured business (relief framing)? The channel evidence only supports reaching agencies.",
  "Do the AAJ/FJA/VHMA directory terms of use permit commercial solicitation of listed members, and does cold outreach risk chapter-level reputational blowback that would burn the channel?",
  "Can the PI form-response test be run at scale (e.g. 50 firms) without being deceptive, given Hennessey's method uses a fictitious alias and story — and what is the honest version of that test?",
  "Which single local Big 'I' chapter or VHMA sub-segment should be the first 20-prospect campaign, and what is the cheapest way to verify a named decision-maker and direct phone/email for each?"
 ]
}

End with ONLY this json block:
```json
{"verdicts":[{"i":0,"verdict":"supported|unsupported|unverifiable","note":"what you checked / what was wrong"}],"summary_overreach":"none | description"}
```