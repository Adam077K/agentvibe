# Sourced claims

Append-only. Every claim below was written by `scripts/lib/claim-append.js`, which
refused to write it until `claim-source` and `claim-freshness` — the ledger's own
resolvers, not a copy of them — returned `pass` against it at that moment.

**Do not hand-edit this file.** Nothing stops you, and nothing has to: an edit that
breaks the parse makes the next append refuse with `TARGET_ALREADY_INVALID`, and an
edit that changes a quote is caught by `ledger verify` on the next PR. Hand-editing
just moves the failure to somebody who did not make it.
