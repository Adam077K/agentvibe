#!/usr/bin/env python3
"""Measure guard distinctness: the FI-11 / CCR-01 instrument.

Reports, for the committed registries:
  1. op:"call" count inside edge guards, and how many edges call their own criterion_id.
  2. Declared-but-unread arguments, per argument name, across edge predicates.
  3. Distinct effective-guard skeletons, and the collisions that matter:
     two edges leaving the SAME from_state of the SAME record whose effective guards
     (edge body + transitively called bodies, state literals erased) are equal.

"Effective guard" is the point. Distinctness of bytes is not distinctness of guard --
that error is what the independent review at cb4bf52 caught.

Usage: python3 tools/guard_distinctness.py [<contracts-dir>]

Passing a directory measures THAT snapshot -- which is how the "before" column of
the repair report was taken, from `git show HEAD:...` extracted into a temp dir,
rather than from memory.
"""
from __future__ import annotations
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

_OVERRIDE = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = Path(_OVERRIDE[0]) if _OVERRIDE and Path(_OVERRIDE[0]).is_dir() \
    else Path(__file__).resolve().parent.parent

RECORDS = json.loads((ROOT / "record-registry.json").read_text())
PREDICATES = json.loads((ROOT / "predicate-registry.json").read_text())

# The skeleton functions live in tools/skeletons.py and are shared with
# validate_contracts.py, which BLOCKS on the sibling-collision predicate this module
# only measures. Two implementations of "same shape" would disagree exactly when it
# mattered -- the instrument saying one number and the gate another.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import skeletons  # noqa: E402

STATE_LITERAL_KEYS = skeletons.STATE_LITERAL_KEYS
erase = skeletons.erase
erase_all_strings = skeletons.erase_all_strings
calls = skeletons.calls


def read_args(body):
    """Argument names actually read by {"arg": name} nodes in this body."""
    found = set()
    stack = [body]
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            if set(node) == {"arg"}:
                found.add(node["arg"])
                continue
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return found


def effective(predicate_id, seen=None, eraser=erase):
    """Edge body plus every transitively called body, as one canonical structure."""
    return skeletons.effective(PREDICATES, predicate_id, seen, eraser)


def transitive_read_args(predicate_id, seen=None):
    seen = seen or set()
    if predicate_id in seen or predicate_id not in PREDICATES:
        return set()
    seen = seen | {predicate_id}
    body = PREDICATES[predicate_id]["body"]
    found = read_args(body)
    for node in _call_nodes(body):
        target = node["predicate_id"]
        if target not in PREDICATES:
            continue
        inner = transitive_read_args(target, seen)
        # An argument the callee reads counts as read by the caller only if the caller
        # actually passes something into that parameter.
        for param, passed in node["arguments"].items():
            if param in inner:
                found |= read_args(passed)
    return found


def _call_nodes(body):
    stack, found = [body], []
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            if node.get("op") == "call":
                found.append(node)
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return found


def main():
    edges = []
    for record_name, record in RECORDS.items():
        for edge in record["lifecycle"]["transitions"]:
            edges.append((record_name, edge))

    edge_predicate_ids = {edge["predicate_id"] for _, edge in edges}
    command_predicate_ids = {
        command["guard_predicate_id"]
        for command in json.loads((ROOT / "command-registry.json").read_text()).values()
    }

    call_count = 0
    calls_own_criterion = 0
    missing_criterion_call = []
    for _, edge in edges:
        body = PREDICATES[edge["predicate_id"]]["body"]
        targets = calls(body)
        call_count += len(targets)
        if edge["criterion_id"] in targets:
            calls_own_criterion += 1
        else:
            missing_criterion_call.append(edge["edge_id"])

    unread = Counter()
    unread_examples = defaultdict(list)
    for predicate_id in sorted(edge_predicate_ids):
        declared = set(PREDICATES[predicate_id]["argument_types"])
        actually = transitive_read_args(predicate_id)
        for name in sorted(declared - actually):
            unread[name] += 1
            if len(unread_examples[name]) < 3:
                unread_examples[name].append(predicate_id)

    # named skeleton_counts, not `skeletons`: that name is the shared module above,
    # and shadowing it here made the collision call resolve to a Counter.
    skeleton_counts = Counter()
    for predicate_id in sorted(edge_predicate_ids):
        skeleton_counts[json.dumps(effective(predicate_id), sort_keys=True)] += 1

    command_skeletons = Counter()
    for predicate_id in sorted(command_predicate_ids):
        command_skeletons[json.dumps(effective(predicate_id), sort_keys=True)] += 1

    # The real test: sibling edges out of one state must not share an effective guard.
    def sibling_collisions_under(eraser):
        return [group["edge_ids"]
                for group in skeletons.sibling_collisions(RECORDS, PREDICATES, eraser)]

    sibling_collisions = sibling_collisions_under(erase)
    harsh_collisions = sibling_collisions_under(erase_all_strings)
    harsh_skeletons = Counter(
        json.dumps(effective(predicate_id, eraser=erase_all_strings), sort_keys=True)
        for predicate_id in sorted(edge_predicate_ids)
    )

    attested = sum(
        1
        for predicate_id in edge_predicate_ids
        if "attested_result" in json.dumps(effective(predicate_id))
    )

    unreachable = set(PREDICATES) - _reachable(edge_predicate_ids | command_predicate_ids)

    primitives = json.loads((ROOT / "primitive-registry.json").read_text())
    used_ops = set()
    for predicate in PREDICATES.values():
        stack = [predicate["body"]]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                if "op" in node:
                    used_ops.add(node["op"])
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)

    report = {
        "edges": len(edges),
        "edge_predicates": len(edge_predicate_ids),
        "op_call_in_edge_guards": call_count,
        "edges_calling_own_criterion": calls_own_criterion,
        "edges_not_calling_own_criterion": len(missing_criterion_call),
        "distinct_effective_edge_skeletons": len(skeleton_counts),
        "largest_edge_skeleton_share": max(skeleton_counts.values()),
        "distinct_effective_command_skeletons": len(command_skeletons),
        "sibling_guard_collisions": len(sibling_collisions),
        "sibling_collision_examples": sibling_collisions[:5],
        "distinct_effective_edge_skeletons_all_strings_erased": len(harsh_skeletons),
        "largest_edge_skeleton_share_all_strings_erased": max(harsh_skeletons.values()),
        "sibling_guard_collisions_all_strings_erased": len(harsh_collisions),
        "declared_but_unread_arguments": dict(unread),
        "unread_examples": {k: v for k, v in unread_examples.items()},
        "edge_guards_reaching_attested_result": attested,
        "predicates_unreachable_from_any_guard": len(unreachable),
        "primitives_used_by_no_predicate": sorted(set(primitives) - used_ops),
    }
    print(json.dumps(report, indent=2))
    return 0


def _reachable(roots):
    seen = set()
    stack = list(roots)
    while stack:
        name = stack.pop()
        if name in seen or name not in PREDICATES:
            continue
        seen.add(name)
        stack.extend(calls(PREDICATES[name]["body"]))
    return seen


if __name__ == "__main__":
    sys.exit(main())
