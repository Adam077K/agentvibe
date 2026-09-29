#!/usr/bin/env python3
"""Guard skeletons and sibling collisions. ONE implementation, three callers.

`tools/guard_distinctness.py` measures with these functions, `validate_contracts.py`
BLOCKS with them, and `tools/author_phase_content.py` reports residual collisions with
them. Two implementations of "do these guards have the same shape" would disagree
exactly when it mattered -- the instrument would say one number and the gate another,
and this repository has already paid for that class of mistake more than once.

Everything here is pure: state is passed in, nothing is read from disk, and no module
resolves its own path. That is deliberate. `guard_distinctness.py` resolves ROOT from
`__file__`, and `tools/` is a SYMLINK inside every negative-fixture scratch tree, so a
check that imported the oracle's module-level registries would cheerfully measure the
real committed contracts while claiming to check the mutated copy in front of it.
"""
from __future__ import annotations

# Erased so a guard cannot earn distinctness by restating its own transition.
STATE_LITERAL_KEYS = ("from_state", "to_state", "target_state", "states", "event_kind")


def erase(node, drop_state_literals=True):
    """Canonical skeleton: structure kept, state literals erased, other strings kept."""
    if isinstance(node, dict):
        out = {}
        for key, value in sorted(node.items()):
            if drop_state_literals and key in STATE_LITERAL_KEYS:
                out[key] = "<state>"
            else:
                out[key] = erase(value, drop_state_literals)
        return out
    if isinstance(node, list):
        return [erase(item, drop_state_literals) for item in node]
    return node


def erase_all_strings(node):
    """The reviewer's harsher method: every string leaf erased, structure only.

    This is how F-canonical-01 computed 19 skeletons where the author's inspection
    computed 1295 distinct bytes. It answers a different question from erase():
    erase() asks whether two sibling guards demand different evidence; this asks
    whether they have different SHAPE.
    """
    if isinstance(node, dict):
        return {key: erase_all_strings(value) for key, value in sorted(node.items())}
    if isinstance(node, list):
        return [erase_all_strings(item) for item in node]
    if isinstance(node, str):
        return "<s>"
    return node


def calls(body):
    found, stack = [], [body]
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            if node.get("op") == "call":
                found.append(node["predicate_id"])
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return found


def effective(predicates, predicate_id, seen=None, eraser=erase):
    """Edge body plus every transitively called body, as one canonical structure."""
    seen = seen or set()
    if predicate_id in seen or predicate_id not in predicates:
        return {"unresolved": predicate_id if eraser is erase else "<s>"}
    seen = seen | {predicate_id}
    body = predicates[predicate_id]["body"]
    return {
        "body": eraser(body),
        "calls": [effective(predicates, target, seen, eraser)
                  for target in sorted(set(calls(body)))],
    }


def edges_by_from_state(records):
    groups = {}
    for record, body in records.items():
        for edge in body["lifecycle"]["transitions"]:
            groups.setdefault((record, edge["from"]), []).append(edge)
    return groups


def sibling_collisions(records, predicates, eraser=erase):
    """Groups of edges leaving ONE state of ONE record with equal effective guards.

    Each group is {record, from_state, edge_ids, to_phases}. Two edges out of the same
    state whose guards are the same shape cannot be told apart by anything executable,
    which is FI-11 stated as a predicate rather than as a count.
    """
    import json as _json
    found = []
    for (record, from_state), group in sorted(edges_by_from_state(records).items()):
        if len(group) < 2:
            continue
        seen = {}
        for edge in group:
            key = _json.dumps(effective(predicates, edge["predicate_id"], eraser=eraser),
                              sort_keys=True)
            seen.setdefault(key, []).append(edge)
        for members in seen.values():
            if len(members) > 1:
                found.append({
                    "record": record,
                    "from_state": from_state,
                    "edge_ids": [edge["edge_id"] for edge in members],
                    "to_phases": [edge["to"] for edge in members],
                })
    return found
