#!/usr/bin/env python3
"""R1 (CCR-01, FI-11 core): make an edge guard evaluate its own criterion.

Before this repair `criterion_id` was named on all 1295 edges and read by nothing:
`op:"call"` appeared zero times in any edge guard, the 843-member `criterion.*`
family was unreachable from every guard, and four declared arguments
(`judgment_refs` x1077, `continuation_ref` x963, `decision_refs` x295,
`observation_refs` x253) appeared in `argument_types` and in no body.

The contract this script implements:

  1. Every edge guard ends with `{"op":"call","predicate_id": <its criterion_id>,
     "arguments": {...}}`, passing exactly the arguments that criterion declares.
  2. The criterion is the sole home of target-phase content. The `accepted_for`
     node that 218 edges carried inline moves into the criterion it already named,
     so `judgment_refs` is read *through the criterion*, on all 1295 edges rather
     than 218 -- and it is read against the criterion's own id, so a judgment
     accepted for `criterion.Goal.achieved.v1` cannot license `endorsed->parked`.
  3. Edge-local nodes stay on the edge: `status_edge` and `transition_basis` carry
     an `event_kind` that varies per edge, `due_preserved` a `target_state`, and
     `control_contract` / `lease_current` / `native_correlated` / `assess_predicate`
     are authority and world-correlation checks, not criteria.
  4. `argument_types` is recomputed to exactly the set each predicate transitively
     reads. An argument that nothing reads is removed rather than left declared.

What this script does NOT do, stated so it is not mistaken for done: it does not
author per-phase evidence content. Where the source corpus determines no material
difference between two target phases of one record, the two criteria still differ
only by the criterion they demand a judgment for. See tools/guard_distinctness.py
for both measurements -- the permissive one and the reviewer's harsher all-strings
erased one -- and the R1 decision packet in the repair return.

Usage: python3 tools/repair_r1_criterion_calls.py [--dry-run]
"""
from __future__ import annotations
import sys
from collections import Counter

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
import contracts_io as io  # noqa: E402

# Nodes whose meaning is fixed by the target phase, not by the individual edge.
CRITERION_OWNED_OPS = {"accepted_for"}
OBSERVATION = "Ref<Observation>[]"
JUDGMENT = "Ref<EvidenceJudgment>[]"
DECISION = "Ref<DecisionRecord>[]"
CONTINUATION = "Ref<Continuation>?"


def op_nodes(body):
    stack, found = [body], []
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            if "op" in node:
                found.append(node)
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return found


def reads(body):
    stack, found = [body], set()
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


def main(dry_run: bool) -> int:
    predicates = io.load_stable("predicate-registry.json")
    records = io.load_stable("record-registry.json")

    edges = [(name, edge) for name, record in records.items()
             for edge in record["lifecycle"]["transitions"]]

    # --- Step 1: criteria gain the acceptance node and the judgment argument. ---
    criteria_used = {edge["criterion_id"] for _, edge in edges}
    touched_criteria = 0
    for criterion_id in sorted(criteria_used):
        criterion = predicates[criterion_id]
        children = criterion["body"]["predicates"]
        if any(child.get("op") == "accepted_for" for child in children):
            continue
        acceptance = {
            "op": "accepted_for",
            "subject_ref": {"arg": "subject_ref"},
            "predicate_id": criterion_id,
            "judgment_refs": {"arg": "judgment_refs"},
        }
        # Placed before attested_result: an independent judgment of this exact
        # criterion, then the attested observation that grounds it.
        index = next((i for i, child in enumerate(children)
                      if child.get("op") == "attested_result"), len(children))
        children.insert(index, acceptance)
        criterion["argument_types"]["judgment_refs"] = JUDGMENT
        criterion["argument_schema"] = io.argument_schema(criterion["argument_types"])
        touched_criteria += 1

    # --- Step 2: edges shed criterion-owned nodes and gain the call. ---
    call_added = 0
    inline_acceptance_removed = 0
    for record_name, edge in edges:
        predicate = predicates[edge["predicate_id"]]
        children = predicate["body"]["predicates"]
        kept = []
        for child in children:
            if child.get("op") in CRITERION_OWNED_OPS:
                inline_acceptance_removed += 1
                continue
            if child.get("op") == "call":
                continue  # idempotent re-run
            kept.append(child)
        criterion_id = edge["criterion_id"]
        criterion_args = predicates[criterion_id]["argument_types"]
        kept.append({
            "op": "call",
            "predicate_id": criterion_id,
            "arguments": {name: {"arg": name} for name in criterion_args},
        })
        predicate["body"]["predicates"] = kept
        call_added += 1

    # --- Step 3: argument_types is exactly what is transitively read. ---
    def transitive_reads(predicate_id, seen=frozenset()):
        if predicate_id in seen:
            return set()
        seen = seen | {predicate_id}
        body = predicates[predicate_id]["body"]
        found = reads(body)
        for node in op_nodes(body):
            if node["op"] != "call":
                continue
            inner = transitive_reads(node["predicate_id"], seen)
            for param, passed in node["arguments"].items():
                if param in inner:
                    found |= reads(passed)
        return found

    declared_types = {
        "subject_ref": None,  # record-specific; kept from the existing declaration
        "observation_refs": OBSERVATION,
        "judgment_refs": JUDGMENT,
        "decision_refs": DECISION,
        "continuation_ref": CONTINUATION,
    }
    removed = Counter()
    for _, edge in edges:
        predicate = predicates[edge["predicate_id"]]
        used = transitive_reads(edge["predicate_id"])
        rebuilt = {}
        for name, declared in predicate["argument_types"].items():
            if name in used:
                rebuilt[name] = declared
            else:
                removed[name] += 1
        for name in used - set(rebuilt):
            if declared_types.get(name) is None:
                raise SystemExit(f"{edge['edge_id']}: reads undeclared argument {name}")
            rebuilt[name] = declared_types[name]
        predicate["argument_types"] = rebuilt
        predicate["argument_schema"] = io.argument_schema(rebuilt)

    report = {
        "criteria_given_an_acceptance_node": touched_criteria,
        "inline_edge_acceptance_nodes_moved_into_criteria": inline_acceptance_removed,
        "edges_given_a_call_to_their_criterion": call_added,
        "edge_arguments_removed_as_unread": dict(removed),
    }
    for key, value in report.items():
        print(f"{key}: {value}")

    if dry_run:
        print("dry run; nothing written")
        return 0
    io.save("predicate-registry.json", predicates)
    print("wrote predicate-registry.json")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))
