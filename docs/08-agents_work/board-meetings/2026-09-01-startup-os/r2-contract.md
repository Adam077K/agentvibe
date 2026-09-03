# Round 2 — cross-critique contract

Each persona now reads the OTHER four Round-1 JSON files (not its own framing's siblings — the four
sealed rooms are open to each other for the first time). It returns `r2-<persona>.json`:

```json
{
  "persona": "…", "round": 2,
  "changed_mind_on": [ { "position_id": "P3", "from": "…", "to": "…", "because_of": "architect:P5" } ],
  "peer_critiques":  [ { "persona": "visionary", "position_id": "P2", "critique": "…", "severity": "fatal|serious|minor" } ],
  "remaining_dissent": [ { "position_id": "P1", "holds_because": "…", "against": ["strategist:P4"] } ],
  "convergence": [ "what the board appears to agree on, stated as a claim with the persona:position ids that support it" ],
  "updated_positions": [ …same shape as R1 positions, with any revisions… ],
  "strongest_counter": "updated"
}
```

Rules: a `changed_mind_on` entry must name the peer position that caused it. A `peer_critique` with
severity `fatal` must say what would have to be true for the position to survive. `remaining_dissent`
is expected to be non-empty — a persona that dissents on nothing has converged politely, and the
synthesizer will note it. Metaswarm's rule applies: this is the one cross-visibility round; there is no
Round 2b.
