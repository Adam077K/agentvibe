    if kind == "not":
        inner = build_conjunct(item[1], record, criterion_id, required_fields)
        if inner is None or inner is NOT_APPLICABLE:
            return inner
        return {"op": "not", "predicate": inner}
    if kind == "elo":
        # `every_linked_obligation`: a NEW primitive, registered by this fixture's JSON
        # patch with `argument_types.predicate: "boolean"` and
        # `argument_positions.predicate: "demanded"`. That is the ordinary declaration an
        # author adding "every linked Obligation satisfies X" would write -- nobody sets
        # out to register a vacuous quantifier -- and it is what makes RC4-02 cheap rather
        # than adversarial.
        inner = build_conjunct(item[2], record, criterion_id, required_fields)
        if inner is None or inner is NOT_APPLICABLE:
            return inner
        return {"op": "every_linked_obligation", "items": _subject_path(item[1]),
                "bind": "item", "predicate": inner}
