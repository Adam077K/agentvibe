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
