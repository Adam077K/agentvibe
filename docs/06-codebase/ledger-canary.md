# Ledger canary — a claim that is permanently supposed to fail

This file exists to be wrong.

It carries one claim with **a deliberately dead URL** and **an expired `valid_until`**.
Every time `node scripts/ledger.mjs verify` runs — which is every PR — that single claim
must fire **both** resolvers and write two `claim.would_block` lines to `events.jsonl`:

```
claim.would_block  c-canary-unresolvable  [claim-source]     fail: fetch failed …
claim.would_block  c-canary-unresolvable  [claim-freshness]  fail: expired … days ago
```

**If `ledger verify` ever reports zero would_blocks, the resolvers have stopped firing** and
the ledger has quietly become decoration. That is the failure this file is here to make
loud, and it is the reason the fixture is committed rather than run once and deleted.

Both failures are deterministic and offline-safe:

- `example.invalid` is reserved by RFC 2606 and can never resolve, so the fetch fails
  identically on every machine and on a CI runner with no egress. No third-party server is
  contacted.
- The expiry is a fixed date in the past, so freshness fails without reference to any clock
  but the calendar.

The claim sits on a `shadow` path, so both failures are logged and the build stays green.
That is the point: this is what shadow mode is supposed to look like from the outside.

**Do not "fix" this file.** Repairing the URL or extending the date disables the canary.

```claims
claims:
  - id: c-canary-unresolvable
    assert: "This claim cites a source that cannot be reached and expired long ago — both resolvers must fire on it"
    kind: external-fact
    scope: project
    verified_by: source
    evidence: {url: "https://example.invalid/phase-3-canary", quote: "this text can never be fetched", accessed: 2026-01-01}
    valid_until: 2026-01-02
    confidence: 0.01
```

---

*Added by: ceo · Phase 3 · 2026-08-11 · gate evidence for [PHASE-3-HANDOFF.md](../03-system-design/PHASE-3-HANDOFF.md)*
