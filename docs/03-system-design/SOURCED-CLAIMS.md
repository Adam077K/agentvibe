# Sourced claims

Append-only. Every claim below was written by `scripts/lib/claim-append.js`, which
refused to write it until `claim-source` and `claim-freshness` — the ledger's own
resolvers, not a copy of them — returned `pass` against it at that moment.

**Do not hand-edit this file.** Nothing stops you, and nothing has to: an edit that
breaks the parse makes the next append refuse with `TARGET_ALREADY_INVALID`, and an
edit that changes a quote is caught by `ledger verify` on the next PR. Hand-editing
just moves the failure to somebody who did not make it.

## c-cli-max-budget-usd-print-mode

> Claude Code's CLI provides a --max-budget-usd flag that caps dollar spend on API calls, and it is print-mode only.

Source: <https://code.claude.com/docs/en/cli-reference> · accessed 2026-09-02 · appended 2026-09-02 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:aab61d1f2e2b06d7228fad214f74c3a6bf0ec12fabb6f6e5d4652987e7068690`.

```claims
claims:
  - id: c-cli-max-budget-usd-print-mode
    assert: "Claude Code's CLI provides a --max-budget-usd flag that caps dollar spend on API calls, and it is print-mode only."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://code.claude.com/docs/en/cli-reference"
      quote: "Maximum dollar amount to spend on API calls before stopping (print mode only)"
      accessed: "2026-09-02"
    valid_until: "2027-03-01"
    confidence: 0.95
```

## c-routines-run-on-anthropic-cloud

> Claude Code routines are scheduled agents that execute on Anthropic-managed cloud infrastructure rather than on the user's machine.

Source: <https://code.claude.com/docs/en/routines> · accessed 2026-09-02 · appended 2026-09-02 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:e6d97c72b7b5c364543cee8a05123c0ea8253607ccc54a9d833eab70684e0f57`.

```claims
claims:
  - id: c-routines-run-on-anthropic-cloud
    assert: "Claude Code routines are scheduled agents that execute on Anthropic-managed cloud infrastructure rather than on the user's machine."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://code.claude.com/docs/en/routines"
      quote: "Routines execute on Anthropic-managed cloud infrastructure"
      accessed: "2026-09-02"
    valid_until: "2027-03-01"
    confidence: 0.95
```

## c-bare-deny-rule-removes-tool-from-context

> In Claude Code and the Agent SDK, a bare-name deny rule such as disallowedTools "Bash" removes the tool definition from the request so the model never sees it, whereas a scoped rule such as Bash(rm *) leaves the tool available and denies only matching calls.

Source: <https://code.claude.com/docs/en/agent-sdk/permissions> · accessed 2026-09-02 · appended 2026-09-02 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:29e5828b16d5c90afd8af833f53d3d5522addf40a38b927ba5756f3f70ba79f9`.

```claims
claims:
  - id: c-bare-deny-rule-removes-tool-from-context
    assert: "In Claude Code and the Agent SDK, a bare-name deny rule such as disallowedTools \"Bash\" removes the tool definition from the request so the model never sees it, whereas a scoped rule such as Bash(rm *) leaves the tool available and denies only matching calls."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://code.claude.com/docs/en/agent-sdk/permissions"
      quote: "Claude does not see the tool and cannot attempt it"
      accessed: "2026-09-02"
    valid_until: "2027-03-01"
    confidence: 0.95
```

## c-anthropic-api-key-wins-in-print-mode

> In Claude Code non-interactive print mode (-p), an ANTHROPIC_API_KEY present in the environment is always used as the credential, without the interactive approval prompt, so a -p process with the key set bills to the API rather than to a subscription OAuth login.

Source: <https://code.claude.com/docs/en/authentication> · accessed 2026-09-02 · appended 2026-09-02 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:b9b86755c0bf75b4beb99f2fa28145f3c484191daa57114b39df793b4891ea3b`.

```claims
claims:
  - id: c-anthropic-api-key-wins-in-print-mode
    assert: "In Claude Code non-interactive print mode (-p), an ANTHROPIC_API_KEY present in the environment is always used as the credential, without the interactive approval prompt, so a -p process with the key set bills to the API rather than to a subscription OAuth login."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://code.claude.com/docs/en/authentication"
      quote: "the key is always used when present"
      accessed: "2026-09-02"
    valid_until: "2027-03-01"
    confidence: 0.9
```

## c-bare-mode-never-reads-oauth

> Claude Code bare mode (--bare) never reads OAuth credentials or the system keychain, so a --bare worker cannot authenticate against the founder's subscription and must use ANTHROPIC_API_KEY or an apiKeyHelper.

Source: <https://code.claude.com/docs/en/headless> · accessed 2026-09-02 · appended 2026-09-02 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:56813bd8b727fa93b5ed649f3e65c18f91d5fe27d263d71ff7c4a2bb3cd57f59`.

```claims
claims:
  - id: c-bare-mode-never-reads-oauth
    assert: "Claude Code bare mode (--bare) never reads OAuth credentials or the system keychain, so a --bare worker cannot authenticate against the founder's subscription and must use ANTHROPIC_API_KEY or an apiKeyHelper."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://code.claude.com/docs/en/headless"
      quote: "In bare mode, Claude Code never reads OAuth credentials or the system keychain."
      accessed: "2026-09-02"
    valid_until: "2027-03-01"
    confidence: 0.95
```

## c-sonnet-5-api-price-2-in-10-out

> Claude Sonnet 5 API list pricing is $2 per million input tokens and $10 per million output tokens, and the previously scheduled increase to $3/$15 on 2026-09-01 did not occur.

Source: <https://platform.claude.com/docs/en/about-claude/pricing> · accessed 2026-09-02 · appended 2026-09-02 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:2207c98f11e98f291010d8eca5881795aaf8a33cbcb32518a30b73058ab8170a`.

```claims
claims:
  - id: c-sonnet-5-api-price-2-in-10-out
    assert: "Claude Sonnet 5 API list pricing is $2 per million input tokens and $10 per million output tokens, and the previously scheduled increase to $3/$15 on 2026-09-01 did not occur."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://platform.claude.com/docs/en/about-claude/pricing"
      quote: "is now the standard price. The previously scheduled increase to $3/$15 per million input/output tokens on September 1, 2026 will not occur."
      accessed: "2026-09-02"
    valid_until: "2027-03-01"
    confidence: 0.95
```

## c-batch-api-half-price-both-directions

> The Anthropic Batch API discounts both input and output tokens by 50 percent, and that discount stacks with prompt-caching multipliers.

Source: <https://platform.claude.com/docs/en/about-claude/pricing> · accessed 2026-09-02 · appended 2026-09-02 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:04d370bde2fef9fa3f7d67fc48ee3a7f95f8563a52ce251cd2f8c20840c8f8d3`.

```claims
claims:
  - id: c-batch-api-half-price-both-directions
    assert: "The Anthropic Batch API discounts both input and output tokens by 50 percent, and that discount stacks with prompt-caching multipliers."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://platform.claude.com/docs/en/about-claude/pricing"
      quote: "asynchronous processing of large volumes of requests with a 50% discount on both input and output tokens"
      accessed: "2026-09-02"
    valid_until: "2027-03-01"
    confidence: 0.95
```

## c-managed-agents-session-runtime-rate

> Claude Managed Agents bills session runtime at $0.08 per session-hour on top of token charges, accruing only while the session status is running, and the Batch API discount does not apply to Managed Agents sessions.

Source: <https://platform.claude.com/docs/en/about-claude/pricing> · accessed 2026-09-02 · appended 2026-09-02 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:07d6b3d9f520bbcdae2f6c2fc4ca34680015c4f11fad0f32ec507931fc3155bd`.

```claims
claims:
  - id: c-managed-agents-session-runtime-rate
    assert: "Claude Managed Agents bills session runtime at $0.08 per session-hour on top of token charges, accruing only while the session status is running, and the Batch API discount does not apply to Managed Agents sessions."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://platform.claude.com/docs/en/about-claude/pricing"
      quote: "$0.08 per session-hour"
      accessed: "2026-09-02"
    valid_until: "2027-03-01"
    confidence: 0.9
```

## c-mcp-protocol-cannot-enforce-security

> The MCP specification states that MCP itself cannot enforce its security principles at the protocol level, so any enforcement of consent, scoping or tool safety must live in the host rather than in the protocol.

Source: <https://modelcontextprotocol.io/specification/2025-06-18> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:f0af32d2097761770f2d1eb1c4cfe384627801defad1dcce26a1e08a2e3cfa19`.

```claims
claims:
  - id: c-mcp-protocol-cannot-enforce-security
    assert: "The MCP specification states that MCP itself cannot enforce its security principles at the protocol level, so any enforcement of consent, scoping or tool safety must live in the host rather than in the protocol."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://modelcontextprotocol.io/specification/2025-06-18"
      quote: "MCP itself cannot enforce these security principles at the protocol level"
      accessed: "2026-09-11"
    valid_until: "2027-03-11"
    confidence: 0.95
```

## c-mcp-tool-descriptions-are-untrusted-input

> The MCP specification classifies tool behaviour descriptions and annotations as untrusted unless obtained from a trusted server, which means a connected server's metadata is attacker-controlled text that enters model context before any tool is invoked.

Source: <https://modelcontextprotocol.io/specification/2025-06-18> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:f0af32d2097761770f2d1eb1c4cfe384627801defad1dcce26a1e08a2e3cfa19`.

```claims
claims:
  - id: c-mcp-tool-descriptions-are-untrusted-input
    assert: "The MCP specification classifies tool behaviour descriptions and annotations as untrusted unless obtained from a trusted server, which means a connected server's metadata is attacker-controlled text that enters model context before any tool is invoked."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://modelcontextprotocol.io/specification/2025-06-18"
      quote: "considered untrusted, unless obtained from a trusted server"
      accessed: "2026-09-11"
    valid_until: "2027-03-11"
    confidence: 0.95
    supports: [c-mcp-protocol-cannot-enforce-security]
```

## c-tool-selection-degrades-with-catalogue-size

> Retrieving a small relevant subset of tools instead of presenting the whole catalogue more than triples tool-selection accuracy on the RAG-MCP stress test, from 13.62% baseline to 43.13%, which makes catalogue size itself a first-order cause of capability-selection failure.

Source: <https://arxiv.org/abs/2505.03275> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:f9dafa427cbfc65f233783451a3f2dde8a1b29ec3e9241dc019bb7e6de69e461`.

```claims
claims:
  - id: c-tool-selection-degrades-with-catalogue-size
    assert: "Retrieving a small relevant subset of tools instead of presenting the whole catalogue more than triples tool-selection accuracy on the RAG-MCP stress test, from 13.62% baseline to 43.13%, which makes catalogue size itself a first-order cause of capability-selection failure."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://arxiv.org/abs/2505.03275"
      quote: "43.13% vs 13.62% baseline"
      accessed: "2026-09-11"
    valid_until: "2027-03-11"
    confidence: 0.9
```

## c-persona-role-prompts-no-measured-gain

> Adding a persona or role to a system prompt does not measurably improve objective task accuracy, so a roster of named "roles" cannot be justified on capability grounds alone.

Source: <https://arxiv.org/abs/2311.10054> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:e056f9ab807130902ba755b9e22ceb51c9bbf47cfd2b7265f87e6a69ba2a044c`.

```claims
claims:
  - id: c-persona-role-prompts-no-measured-gain
    assert: "Adding a persona or role to a system prompt does not measurably improve objective task accuracy, so a roster of named \"roles\" cannot be justified on capability grounds alone."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://arxiv.org/abs/2311.10054"
      quote: "adding personas in system prompts does not improve model performance across a range of questions compared to the control setting where no persona is added"
      accessed: "2026-09-11"
    valid_until: "2027-06-30"
    confidence: 0.9
```

## c-debate-alone-no-expected-gain

> In multi-agent debate the measured gain comes from ensembling (majority voting), not from the debate itself, so a second worker that merely argues with the first is not a second opinion.

Source: <https://arxiv.org/abs/2508.17536> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:a1c857f5336704d1b6a7e3f53d93831bd0f450b3c10b47a6f426f62f4f8420fb`.

```claims
claims:
  - id: c-debate-alone-no-expected-gain
    assert: "In multi-agent debate the measured gain comes from ensembling (majority voting), not from the debate itself, so a second worker that merely argues with the first is not a second opinion."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://arxiv.org/abs/2508.17536"
      quote: "Majority Voting alone accounts for most of the performance gains typically attributed to MAD"
      accessed: "2026-09-11"
    valid_until: "2027-06-30"
    confidence: 0.85
```

## c-eu-ai-act-art50-applies-2026-08-02

> EU AI Act Article 50 transparency obligations apply from 2 August 2026, requiring that people be informed they are interacting with an AI system unless it is obvious.

Source: <https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:2cf2e66e6ba629f031e8e4a8a43a294e2d73287420ced4b077a7106bf9e41167`.

```claims
claims:
  - id: c-eu-ai-act-art50-applies-2026-08-02
    assert: "EU AI Act Article 50 transparency obligations apply from 2 August 2026, requiring that people be informed they are interacting with an AI system unless it is obvious."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act"
      quote: "Article 50 of the AI Act applies as from 2 August 2026"
      accessed: "2026-09-11"
    valid_until: "2027-06-30"
    confidence: 0.95
```

## c-lethal-trifecta-not-reliably-preventable

> An agent combining access to private data, exposure to attacker-controlled content, and an outbound channel is exploitable by prompt injection, and there is no known method that prevents this 100% reliably.

Source: <https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:4c6cee8677d214cc0e489934c4fdf346f04ee6fc2d21236bd2534e5bb37757bc`.

```claims
claims:
  - id: c-lethal-trifecta-not-reliably-preventable
    assert: "An agent combining access to private data, exposure to attacker-controlled content, and an outbound channel is exploitable by prompt injection, and there is no known method that prevents this 100% reliably."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/"
      quote: "100% reliably prevent this from happening"
      accessed: "2026-09-11"
    valid_until: "2027-06-30"
    confidence: 0.9
```

## c-ai-output-copyright-needs-human-expression

> The US Copyright Office concluded that generative AI outputs are protectable by copyright only where a human author determined sufficient expressive elements, so purely machine-determined output is unprotected.

Source: <https://www.copyright.gov/newsnet/2025/1060.html> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:b508523831f07b8a37357d062391482d40238b527643e83e38dbc79e9739a88c`.

```claims
claims:
  - id: c-ai-output-copyright-needs-human-expression
    assert: "The US Copyright Office concluded that generative AI outputs are protectable by copyright only where a human author determined sufficient expressive elements, so purely machine-determined output is unprotected."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://www.copyright.gov/newsnet/2025/1060.html"
      quote: "only where a human author has determined sufficient expressive elements"
      accessed: "2026-09-11"
    valid_until: "2027-06-30"
    confidence: 0.9
```

## c-ai-exposure-measurably-deskills-experts

> Routine AI assistance measurably degrades unaided expert performance: experienced endoscopists' unassisted adenoma detection fell 20% relative and 6% absolute after exposure to AI-assisted colonoscopy.

Source: <https://www.eurekalert.org/news-releases/1094223> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:518879bc345d3890b823ef8ff511f28831cc64c5be2164a443c9b1459da3c22e`.

```claims
claims:
  - id: c-ai-exposure-measurably-deskills-experts
    assert: "Routine AI assistance measurably degrades unaided expert performance: experienced endoscopists' unassisted adenoma detection fell 20% relative and 6% absolute after exposure to AI-assisted colonoscopy."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://www.eurekalert.org/news-releases/1094223"
      quote: "corresponding to a 20% relative and 6% absolute reduction in adenoma detection rate"
      accessed: "2026-09-11"
    valid_until: "2027-06-30"
    confidence: 0.85
```

## c-self-report-of-ai-speedup-is-inverted

> Self-assessment of AI-assisted productivity can invert the measured sign: experienced developers took 19% longer with AI tools in an RCT while believing afterwards that AI had sped them up by 20%.

Source: <https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:9fb07c2db32ed9915e15827ef5b604baa04542de08fd410b184cf6863a6a96d7`.

```claims
claims:
  - id: c-self-report-of-ai-speedup-is-inverted
    assert: "Self-assessment of AI-assisted productivity can invert the measured sign: experienced developers took 19% longer with AI tools in an RCT while believing afterwards that AI had sped them up by 20%."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/"
      quote: "take 19% longer to complete issues"
      accessed: "2026-09-11"
    valid_until: "2027-06-30"
    confidence: 0.9
```

## c-llm-judges-favor-similar-models

> LLM-as-a-judge scores are biased toward models functionally similar to the judge, so agreement between two similar model judges is correlation rather than independent corroboration.

Source: <https://arxiv.org/abs/2502.04313> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:8cb1205d68ad73633359f1abad71aa7eaae3b3b64aad89a86bcb3efa89a83463`.

```claims
claims:
  - id: c-llm-judges-favor-similar-models
    assert: "LLM-as-a-judge scores are biased toward models functionally similar to the judge, so agreement between two similar model judges is correlation rather than independent corroboration."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://arxiv.org/abs/2502.04313"
      quote: "LLM-as-a-judge scores favor models similar to the judge"
      accessed: "2026-09-11"
    valid_until: "2027-09-01"
    confidence: 0.9
```

## c-models-detect-being-evaluated

> Frontier models can substantially distinguish evaluation contexts from real deployment, so an evaluation set that looks like a test measures test-taking rather than working behaviour.

Source: <https://arxiv.org/abs/2505.23836> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:2e1ead9f3af05bc23eff74dfd48f7b2aca784c3a1e2493041a5de96bc1692776`.

```claims
claims:
  - id: c-models-detect-being-evaluated
    assert: "Frontier models can substantially distinguish evaluation contexts from real deployment, so an evaluation set that looks like a test measures test-taking rather than working behaviour."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://arxiv.org/abs/2505.23836"
      quote: "frontier models already exhibit a substantial, though not yet superhuman, level of evaluation-awareness"
      accessed: "2026-09-11"
    valid_until: "2027-09-01"
    confidence: 0.88
```

## c-context-is-a-finite-budget-not-storage

> Anthropic's published context-engineering guidance treats the context window as a finite resource with diminishing marginal returns, not as storage to be filled.

Source: <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:c4d8e8ac3a7c74245306b3c3be90a4a7815e48591476a5cc5e8df7a4b32117e9`.

```claims
claims:
  - id: c-context-is-a-finite-budget-not-storage
    assert: "Anthropic's published context-engineering guidance treats the context window as a finite resource with diminishing marginal returns, not as storage to be filled."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents"
      quote: "Context, therefore, must be treated as a finite resource with diminishing marginal returns"
      accessed: "2026-09-11"
    valid_until: "2027-03-11"
    confidence: 0.95
```

## c-verifiability-burden-sits-with-the-writer

> Wikipedia's Verifiability policy places the burden of demonstrating verifiability on the editor who adds or restores material, which is the human precedent for making a claim's author pay the sourcing cost at write time rather than at review time.

Source: <https://en.wikipedia.org/wiki/Wikipedia:Verifiability> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:f5378c7c5ddce531ab1d0b9938d0681f0ddacf00a4b7605533103792d03ad378`.

```claims
claims:
  - id: c-verifiability-burden-sits-with-the-writer
    assert: "Wikipedia's Verifiability policy places the burden of demonstrating verifiability on the editor who adds or restores material, which is the human precedent for making a claim's author pay the sourcing cost at write time rather than at review time."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://en.wikipedia.org/wiki/Wikipedia:Verifiability"
      quote: "The burden to demonstrate verifiability lies with the editor who adds or restores material"
      accessed: "2026-09-11"
    valid_until: "2027-09-01"
    confidence: 0.93
```

## c-longer-input-degrades-model-reliability

> Chroma's context-rot study across 18 models found that model performance degrades as input length increases in non-uniform ways, so a context budget must be set well below the advertised window.

Source: <https://www.trychroma.com/research/context-rot> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:983a1686d839a2b7cdb60d2a6508161c6ec12e7094458cc4277433b449ffb209`.

```claims
claims:
  - id: c-longer-input-degrades-model-reliability
    assert: "Chroma's context-rot study across 18 models found that model performance degrades as input length increases in non-uniform ways, so a context budget must be set well below the advertised window."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://www.trychroma.com/research/context-rot"
      quote: "model performance degrades as input length increases, often in surprising and non-uniform ways"
      accessed: "2026-09-11"
    valid_until: "2027-06-01"
    confidence: 0.9
```

## c-aggressive-memory-writes-widen-attack-surface

> A systematic study of memory poisoning in LLM agents found that agents designed to write and retrieve memory more aggressively are more exploitable, so memory capability and memory security trade against each other by construction.

Source: <https://arxiv.org/html/2606.04329v1> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:b37832f46a9154f0ef0ad3b0a0fcb21659893338b8a3e5dd6bf8fd657b41870c`.

```claims
claims:
  - id: c-aggressive-memory-writes-widen-attack-surface
    assert: "A systematic study of memory poisoning in LLM agents found that agents designed to write and retrieve memory more aggressively are more exploitable, so memory capability and memory security trade against each other by construction."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://arxiv.org/html/2606.04329v1"
      quote: "agents designed to write and retrieve memory more aggressively are more exploitable"
      accessed: "2026-09-11"
    valid_until: "2027-06-01"
    confidence: 0.88
```

## c-harness-dominates-retrieval-mechanism

> In agentic retrieval evaluation, changing the agent harness around a fixed model moves accuracy by margins comparable to swapping the retriever itself, so harness design dominates choice of retrieval mechanism.

Source: <https://arxiv.org/html/2605.15184v1> · accessed 2026-09-11 · appended 2026-09-11 by `mcp:claim-append`.
Verified at append time by `claim-source` and `claim-freshness`; body digest `sha256:7a73970cfacdc2c62524513555032031ebf3bc6ef0d965d4ee69fdbd0bc26c2c`.

```claims
claims:
  - id: c-harness-dominates-retrieval-mechanism
    assert: "In agentic retrieval evaluation, changing the agent harness around a fixed model moves accuracy by margins comparable to swapping the retriever itself, so harness design dominates choice of retrieval mechanism."
    kind: external-fact
    scope: project
    verified_by: source
    evidence:
      url: "https://arxiv.org/html/2605.15184v1"
      quote: "changes accuracy by margins comparable to swapping retrievers inside a fixed harness"
      accessed: "2026-09-11"
    valid_until: "2027-06-01"
    confidence: 0.85
```
