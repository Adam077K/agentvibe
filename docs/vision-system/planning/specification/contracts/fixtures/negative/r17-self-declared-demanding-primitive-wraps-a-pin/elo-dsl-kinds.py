RECORD_SPECIFIC_KINDS = ("nfp", "rpp", "neF", "prF", "eqF", "elo")


def literal_paths(item):
    """Every field path this conjunct names, recursively; () when it names none."""
    if item[0] == "nfp":
        return tuple(item[1])
    if item[0] == "rpp":
        return tuple(path for path, _states, _optional in item[1])
    if item[0] in ("neF", "prF", "eqF"):
        return (item[1],)
    if item[0] == "not":
        return literal_paths(item[1])
    if item[0] == "elo":
        # The collection path is a claim about this record's schema exactly as `nfp`'s is,
        # and the quantified child may name more.
        return (item[1],) + literal_paths(item[2])
    if item[0] in ("either", "every"):
        return tuple(p for inner in item[1] for p in literal_paths(inner))
    return ()


