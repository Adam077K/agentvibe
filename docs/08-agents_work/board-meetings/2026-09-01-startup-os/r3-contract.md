# Round 3 — synthesizer contract

Fresh context. Reads all ten R1+R2 JSON files and the five R1 markdown reasonings. Returns
`r3-synthesis.json`:

```json
{
  "locked_decisions": [
    { "id": "D1", "decision": "…", "source_persona_round": "architect:R1:P2",
      "supported_by": ["visionary:R2:P1", "…"], "dissented_by": ["adversary:R2:P4"],
      "confidence": "low|med|high", "reversal_cost": "…", "needs_founder": true|false }
  ],
  "preserved_dissents": [ { "from": "adversary:R2:P4", "dissent": "…", "why_not_resolved": "…" } ],
  "founder_action_items": [ { "item": "…", "because": "…", "source": "risk-modeler:R1:P6" } ],
  "could_not_resolve": [ "questions the board split on with no majority and no decisive evidence" ],
  "roster_assessment": "did the personas meaningfully diverge in R1; did dissent shrink artificially in R2"
}
```

Hard rule, Zod-grade: **every `source_persona_round` must match a real persona:round:position id in
the ten files.** A decision the synthesizer cannot trace to a persona's stated position is a
fabrication and is refused. Union, never average: a locked decision is one a persona actually held,
not a blend nobody argued for. Every `preserved_dissent` is kept verbatim in the final artifact.
