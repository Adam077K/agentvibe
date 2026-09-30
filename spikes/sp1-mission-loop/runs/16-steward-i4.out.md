```json
{
  "questions": [
    {
      "id": "q1",
      "text": "Which specific B2B niche(s) have an acute, currently-underserved pain point (not a nice-to-have) that a solo AI-run operator could plausibly address?",
      "voi": 2,
      "confidence": 0.7,
      "status": "resolved"
    },
    {
      "id": "q2",
      "text": "For the leading candidate niche(s), is there a concrete, reachable channel (named community, directory, forum, marketplace) where 20+ real prospects can be identified and contacted directly?",
      "voi": 3,
      "confidence": 0.65,
      "status": "resolved"
    },
    {
      "id": "q3",
      "text": "What price point and offer structure (project vs retainer vs subscription) would a first prospect in this niche actually pay within a 30-day window, without a long procurement cycle?",
      "voi": 3,
      "confidence": 0.6,
      "status": "resolved"
    },
    {
      "id": "q4",
      "text": "Is the niche already saturated with competent agencies/freelancers serving this exact pain well, i.e. is it actually underserved or just assumed to be?",
      "voi": 5,
      "confidence": 0.35,
      "status": "open"
    },
    {
      "id": "q5",
      "text": "Can a one-person operation using AI tools credibly deliver this service without existing portfolio, credentials, or case studies?",
      "voi": 3,
      "confidence": 0.15,
      "status": "open"
    },
    {
      "id": "q6",
      "text": "Are there regulatory, compliance, or trust barriers in the candidate niche that would block an unbranded solo agency from closing quickly, and do the directory/association terms of use even permit commercial solicitation of members?",
      "voi": 4,
      "confidence": 0.15,
      "status": "open"
    },
    {
      "id": "q7",
      "text": "What is the typical real-world sales cycle length for buyers in the candidate niche(s) — days, weeks, or months — independent of channel access?",
      "voi": 3,
      "confidence": 0.65,
      "status": "resolved"
    },
    {
      "id": "q8",
      "text": "For the leading candidate (PI-firm lead-response/intake), can we find ≥3 real, identifiable prospects independently describing this exact pain (missed/slow-answered leads, after-hours intake gaps) in their own words -- via forums, reviews, LinkedIn posts, bar/industry commentary -- rather than vendor marketing, and confirming it is currently unsolved or poorly solved for them specifically?",
      "voi": 10,
      "confidence": 0.4,
      "status": "open"
    },
    {
      "id": "q9",
      "text": "Has the drafted First-Offer (First-Call Guarantee, $500 pilot / $1,000/mo retainer) been put in front of at least one real, named prospect, and what was their documented response (interest, objection, or rejection)?",
      "voi": 10,
      "confidence": 0,
      "status": "open"
    }
  ],
  "decision": "continue",
  "reason": "q8's last research pass produced real evidence (e43-e46, all referee-supported) but the referee flagged genuine gaps: only 1 of the 3 sources is a named individual, one is clearly PI-specific (Utah co-founder) while another (Gutierrez) is framed as a criminal-defense engagement, and a third candidate was correctly excluded as criminal-defense-only. Confidence rises from 0.1 to 0.4, not higher, because unsupported/overreach claims can't count. This still falls short of a clean '≥3 identifiable, PI-specific, independent' bar the success test implicitly wants for criterion (1). q9 (real prospect response) is tied at voi 10 but is a real-world outreach action, not a research task these workers are built for -- it should wait until the underlying pain evidence for criterion (1) is unambiguous, so we don't put an offer in front of a prospect on shaky footing. Budget remains adequate to take one more cheap, targeted research pass at q8 before committing to outreach.",
  "next": {
    "question_id": "q8",
    "action": "research: find a third (or better-evidenced replacement) real, clearly-identifiable, clearly-PI-practice prospect independently describing unresolved missed-call/slow-lead-response pain, using non-Clutch sources this pass missed -- Reddit (r/Lawyertalk, r/paralegal), LinkedIn posts from PI intake staff/owners, state bar forums/commentary, or direct full-page loads (not just search snippets) of the Clutch profiles already found to confirm full reviewer name and practice-area tag. Goal: land on ≥3 sources that are both independent of vendor marketing AND unambiguously PI-specific AND identifiable enough to name in the First-Offer evidence pack.",
    "worker": "codex",
    "worker_reason": "Last step used claude; alternating keeps the referee/worker roles fresh and codex may pull from different indexes (LinkedIn/Reddit/forum content) than claude's prior WebSearch-heavy pass that clustered on Clutch/G2 reviews.",
    "why_this_question": "q8 is tied for the highest voi (10) and is a direct precondition of the SUCCESS TEST's criterion (1); unlike q9 it is a pure research question with a concrete, fixable gap the referee just identified, so it's the cheaper and more sequential move before spending budget on an actual outreach attempt."
  }
}
```