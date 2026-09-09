# §I row 1 — the terms · Lane W's answer, recorded verbatim

*Open decision row 1 is the founder's and has been open since the first round: whether automated
access on a subscription is permitted. The plan's §G.5 quotes one clause of the Consumer Terms and
stops. Lane W (`sourcer`) was asked to fetch and quote the governing documents and lay out the readings
the text supports **without recommending one**, because the decision is the founder's.*

*The lane returned in two messages, 2026-09-07. Both are recorded here in arrival order, unedited.
The lane took no position. Neither do I; the dispositions in DECISIONS.md §29 record only what §G.5
must correct regardless of which reading the founder takes.*

**The lane's own caveat, kept at the top where it belongs:** *one agent, one model family, one pass.
This is a terms reading that gates a live route and I am not a lawyer; the quotes are exact and the
readings are mine.*

---

## Part 1 of 2 — the sources and the clauses

Row 1 · the terms — part 1 of 2, the sources and the clauses. Part 2 has the readings side by side and the gaps.

STATUS:   ANSWERED. No fetch failed; every document below returned content on 2026-09-07. Nothing here is from memory.
FINDING:  The plan's quote is verbatim correct and still current, but it is one clause of five that bear on this, and it is not where the answer lives. The carve-out it names — "where we otherwise explicitly permit it" — is cashed out in a separate Anthropic document that permits ordinary subscription use of the unmodified Claude Code binary by the account holder, and forbids something different from what the plan has been guarding against: developers routing OTHER people's requests through Free, Pro or Max credentials.

EVIDENCE, five documents, all accessed 2026-09-07.

**1. Consumer Terms of Service — effective date shown as October 8, 2025.** https://www.anthropic.com/legal/consumer-terms and https://www.anthropic.com/legal/terms return the same document.
Section 3 prohibited conduct, item 7, verbatim and complete — this is the plan's quote and it matches character for character: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise."
Item 4: "To crawl, scrape, or otherwise harvest data or information from our Services other than as permitted under these Terms."
Item 2: "To develop any products or services that compete with our Services, including to develop or train any artificial intelligence or machine learning algorithms or models or resell the Services."
Item 8: "To engage in any other conduct that restricts or inhibits any person from using or enjoying our Services, or that we reasonably believe exposes us—or any of our users, affiliates, or any other third party—to any liability, damages, or detriment of any type, including reputational harms."
Section 2: "You may not share your Account login information, Anthropic API key, or Account credentials with anyone else. You also may not make your Account available to anyone else."

**2. Claude Code legal and compliance — this is where the carve-out is spent.** https://code.claude.com/docs/en/legal-and-compliance
Which terms govern: "Consumer Terms of Service - for Free, Pro, and Max users".
The volume qualifier, and it is the load-bearing sentence for us: "Claude Code usage is subject to the Anthropic Usage Policy. Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK."
The permission: "OAuth authentication is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications."
The prohibition, quoted in full because its subject matters: "Developers building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider. Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow."
The explicit narrowing of that prohibition: "This does not restrict how customers provision and manage their own API keys or third-party inference provider credentials — for example, configuring an API key in a development environment, secrets manager, or machine image for use by the customer's own authorized users — provided the resulting usage is billed to the key owner under their agreement with Anthropic (or the applicable provider) and is not resold or intermediated as described above. Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code as described under Can customers offer Claude Code in their products? above."
Enforcement: "Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice."
And on modification, which bears on any wrapper: "The Claude Code binary must not be modified. Claude Code must be installed and run as published by Anthropic, and customers may not remove, disable, or restrict any authentication method built into it (including methods that permit signing in with a Claude account or the user's own API key)."

**3. Agent SDK overview — Anthropic documents scripting the CLI itself.** https://code.claude.com/docs/en/agent-sdk/overview
"The SDK is available as a library for Python and TypeScript only. To drive the same agent loop from another language, run the CLI as a subprocess with the `-p` flag and `--output-format json`."
And the third-party restriction restated: "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK. Use the API key authentication methods described in the Quickstart instead."
"Use of the Claude Agent SDK is governed by Anthropic's Commercial Terms of Service."

**4. The metering history, and it is currently PAUSED.** https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
Page header: "As of June 15, 2026, Anthropic paused the previously announced changes to Claude Agent SDK usage and monthly credits." The page states its content "is no longer in effect."
The paused proposal is still evidence of Anthropic's own classification, because it named the surface rather than banning it. It would have covered "Claude Agent SDK usage in your own projects (Python or TypeScript), the `claude -p` command in Claude Code (non-interactive mode), the Claude Code GitHub Actions integration, [and] third-party apps that authenticate with your Claude subscription", with credits of $20 Pro, $100 Max 5x, $200 Max 20x, and: "When your monthly credit runs out, additional Agent SDK usage flows to usage credits at standard API rates—but only if you've enabled usage credits. If usage credits aren't enabled, Agent SDK requests stop until your credit refreshes."
Net effect today: `claude -p` on a subscription draws on ordinary plan limits, not on a separate credit.

**5. Usage Policy — effective date shown as September 15, 2025.** https://www.anthropic.com/legal/aup
"Agentic use cases must still comply with the Usage Policy. We provide examples of Usage Policy prohibitions in the context of agentic use in this Help Center article."
Nothing in it requires human oversight of an agentic run. The automation clauses it does carry target other conduct: "Utilize automation in account creation or to engage in spammy behavior" and "Coordinate malicious activity across multiple accounts to avoid detection or circumvent product guardrails".

One provenance note. The Consumer Terms still show an October 2025 effective date, so the February 2026 tightening that was reported externally landed in the Claude Code legal-and-compliance page rather than in the Consumer Terms. That is consistent with the reported aim of making existing language consistent across documentation, and it means document 2, not document 1, is the one to re-read when this is revisited.

---

## Part 2 of 2 — three readings, side by side

Row 1 · the terms — part 2 of 2. Three readings the text supports, laid out side by side. I take no position; the founder decides.

THE THREE READINGS

**Reading A — the clause alone.** Item 7 is read on its own: automated access is banned except by API key or explicit permission, and nothing else is consulted.
Permits: interactive Claude Code on a subscription, because signing in is the ordinary use OAuth is "designed to support".
Forbids: every scripted invocation on a subscription seat, including `claude -p`, because a script is exactly what the clause names.
What it costs: this reading also forbids Anthropic's own shipped features on a subscription — `/loop`, Routines, scheduled tasks, agent teams — all of which are scripts by any plain meaning. It has to treat those as the "explicitly permit" branch, at which point it is no longer reading the clause alone.

**Reading B — the volume qualifier binds.** Item 7 is satisfied by Anthropic's explicit permission for Claude Code, but that permission is bounded by "ordinary, individual usage".
Permits: a person at a keyboard, occasional `-p`, the shipped scheduling features at their documented cadence.
Forbids: nothing by name, but treats a fourteen-agent fleet running unattended overnight as outside "ordinary, individual usage", so the permission lapses and item 7 reattaches.
What it costs: "ordinary, individual usage" is undefined in every Anthropic document I fetched, so this reading cannot say where the line is, only that one exists. Its exposure is the enforcement sentence, which is explicit that action may come "without prior notice".

**Reading C — the boundary is first-party versus third-party.** Read across documents 1, 2 and 3 together, every prohibition Anthropic actually writes down has the same subject: developers routing other people's requests through subscription credentials.
Permits: the account holder automating their own seat with the unmodified binary. The text says so twice — the narrowing sentence expressly does not "prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription", and the Agent SDK page instructs anyone wanting the agent loop from another language to "run the CLI as a subprocess with the `-p` flag".
Forbids: offering claude.ai login in your own product, routing requests on behalf of users, collecting or intermediating credentials or session tokens, modifying the binary, reselling.
What it costs: it leans on the absence of a clause about self-automation rather than on a clause permitting it. Absence is not permission, and Reading B's volume qualifier survives inside it untouched.

WHERE THE READINGS AGREE, which may be more useful than where they differ
- All three forbid the same four things: offering Claude sign-in in a product, routing another person's work through this seat, storing or intermediating credentials, and modifying the binary.
- All three permit interactive use.
- None of them turns on whether a run is attended. Not one document I fetched distinguishes a supervised session from an unattended one, or mentions night, sleep, or absence of a human. The attended/unattended axis this plan has been organised around does not appear in Anthropic's text at all.
- The one axis the text does draw sharply is whose usage it is, and by that axis this harness sits on the permitted side, with the volume qualifier as the live question rather than the automation.

WHAT I COULD NOT OBTAIN, and why
- **No quantitative definition of "ordinary, individual usage."** Searched the legal-and-compliance page, the Usage Policy, the costs page and the extra-usage support article. Not found in any of them. This is the single gap that decides Reading B, and it is unanswerable from public documents.
- **The successor to the paused credit plan is unpublished.** Anthropic paused the June 15 change and said it would rework it with advance notice. No replacement document exists as of 2026-09-07, so the current metering of `claude -p` on a subscription is "ordinary plan limits, until further notice" rather than a settled state.
- **The Usage Policy's agentic help-center article.** The policy refers to "this Help Center article" for agentic examples; the fetched text carries no resolvable URL for it, so I did not read it. One more fetch if someone can surface the link.
- **The legal-and-compliance page shows no last-updated date**, so I can date its content only to my access, not to its publication. Given that it is now the document carrying the operative language, an undated operative document is itself worth recording.
- No status-code failure this round. Every URL in part 1 returned content on first or second attempt.

CONFIDENCE: high on all quoted text, which is verbatim from primary Anthropic sources. Medium on the reading structure, which is my framing rather than Anthropic's.
DECIDES: open decision row 1, and with it §G.5, which currently states the clause and stops. Two corrections §G.5 needs regardless of which reading the founder takes: the clause is not the whole governing text, and the document that spends its carve-out is the Claude Code legal-and-compliance page, which §G.5 does not cite. §G.5's sentence that "nothing narrowing it was found" is now false — the narrowing exists, it is quoted in part 1, and it narrows toward permission rather than away from it.
RESIDUE: only the founder's choice among the three readings, plus the undefined volume qualifier, which no amount of further reading will settle. If they want it settled rather than reasoned, the act is a written question to Anthropic sales or support describing this exact setup and asking whether it is ordinary individual usage. That is a founder act, not an agent one, and it is the only route to certainty here.

SINGLE-FAMILY CAVEAT: one agent, one model family, one pass. This is a terms reading that gates a live route and I am not a lawyer; the quotes are exact and the readings are mine.
