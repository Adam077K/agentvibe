    if kind == "not":
        inner = build_conjunct(item[1], record, criterion_id, required_fields)
        if inner is None or inner is NOT_APPLICABLE:
            return inner
        return {"op": "not", "predicate": inner}
    if kind == "bury":
        # `present`'s `value` is typed JsonValue in primitive-registry.json -- a VALUE
        # slot, not a predicate position. A conjunct written here type-checks, satisfies
        # any containment walk that descends into every dict value, and asserts nothing
        # whatever about what it contains.
        inner = build_conjunct(item[1], record, criterion_id, required_fields)
        if inner is None or inner is NOT_APPLICABLE:
            return inner
        return {"op": "present", "value": inner}
