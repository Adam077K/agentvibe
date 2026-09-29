    if kind == "not":
        inner = build_conjunct(item[1], record, criterion_id, required_fields)
        if inner is None or inner is NOT_APPLICABLE:
            return inner
        return {"op": "not", "predicate": inner}
    if kind == "fa":
        # `forall`: the registry's fourth boolean-child primitive, registered since the
        # first predicate set and invoked by nothing -- guard_distinctness.py lists it
        # under `primitives_used_by_no_predicate`. This is the builder the first author
        # who needs "every linked Obligation satisfies X" reaches for, written the way
        # they would write it.
        inner = build_conjunct(item[2], record, criterion_id, required_fields)
        if inner is None or inner is NOT_APPLICABLE:
            return inner
        return {"op": "forall", "items": _subject_path(item[1]), "bind": "item",
                "predicate": inner}
