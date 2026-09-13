#!/usr/bin/env python3
"""R2 (CCR-02, FI-12 constraint 6): walk the mandate acceptance chain to its root.

`attested_result` requires an "accepted assessor mandate". `accepted_for` and
`judgment_matches` require an accepted EvidenceJudgment with a "designated
competent deciding assignment". So a criterion that uses either imposes an
obligation that is itself an acceptance -- and `criterion.Mandate.accepted.v1`
uses both. Mandate acceptance requires an accepted mandate.

This module builds that obligation graph from the registries (never from prose)
and reports whether every node reaches a bootstrap root in finitely many steps.

Obligation edges, each read off a primitive's own declared `semantics`:

  attested_result            -> Mandate:accepted        (accepted assessor mandate)
  accepted_for               -> EvidenceJudgment:accepted, Mandate:accepted
  judgment_matches           -> EvidenceJudgment:accepted, Mandate:accepted
  current_owner              -> ResponsibilityAssignment:accepted, Mandate:accepted
  related_phases[binding]    -> <type of the bound field>:<each listed state>

A node is GROUNDED when it offers a genesis disjunct -- an `any` whose branches
include a `bootstrap_roots` path that depends on no other acceptance -- or when
every obligation it imposes is grounded. A cycle with no genesis disjunct on it
is UNGROUNDED, and that is the finding this walker exists to produce.

Usage: python3 tools/acceptance_chain.py [<contracts-dir>]
Exit 0 when the chain terminates, 1 when it does not.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

_OVERRIDE = [a for a in sys.argv[1:] if not a.startswith("-")]
ROOT = Path(_OVERRIDE[0]) if _OVERRIDE and Path(_OVERRIDE[0]).is_dir() \
    else Path(__file__).resolve().parent.parent

RECORDS = json.loads((ROOT / "record-registry.json").read_text())
PREDICATES = json.loads((ROOT / "predicate-registry.json").read_text())

CHAIN_ROOT = "criterion.Mandate.accepted.v1"


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


def field_type(record_name, field_path):
    """Resolve "/payload/sponsor_ref" to its declared type, e.g. Ref<ResponsibilityAssignment>."""
    parts = [part for part in field_path.split("/") if part]
    record = RECORDS.get(record_name)
    if not record:
        return None
    if parts[:1] == ["payload"] and len(parts) == 2:
        return record["fields"]["payload"]["type_fields"].get(parts[1])
    if len(parts) == 1:
        declared = record["fields"].get(parts[0])
        return declared["type"] if isinstance(declared, dict) else None
    return None


def referenced_record(declared):
    if not isinstance(declared, str):
        return None
    base = declared.rstrip("?")
    base = base[:-2] if base.endswith("[]") else base
    return base[4:-1] if base.startswith("Ref<") and base.endswith(">") else None


def criterion_for(record_name, phase):
    name = f"criterion.{record_name}.{phase}.v1"
    return name if name in PREDICATES else None


def unconditional_obligations(criterion_id):
    """Obligations imposed on EVERY path -- those outside any `any` disjunct.

    A genesis disjunct only grounds a criterion if nothing outside it re-imposes
    the obligation. An unconditional `accepted_for` sitting beside the disjunct
    undoes the grounding while `genesis_disjunct()` still answers True, so the
    walk has to ask this question separately.
    """
    body = PREDICATES[criterion_id]["body"]
    conditional = set()
    for node in op_nodes(body):
        if node["op"] == "any":
            conditional |= {id(inner) for inner in op_nodes(node)}
    outside = [node for node in op_nodes(body) if id(node) not in conditional]
    return _obligations_of(criterion_id, outside)


def obligations(criterion_id):
    """Acceptance obligations this criterion imposes, as criterion ids."""
    return _obligations_of(criterion_id, op_nodes(PREDICATES[criterion_id]["body"]))


def _obligations_of(criterion_id, nodes):
    record_name = criterion_id.split(".")[1]
    found = set()
    for node in nodes:
        op = node["op"]
        if op == "attested_result":
            found.add(criterion_for("Mandate", "accepted"))
        elif op in ("accepted_for", "judgment_matches"):
            found.add(criterion_for("EvidenceJudgment", "accepted"))
            found.add(criterion_for("Mandate", "accepted"))
        elif op == "current_owner":
            found.add(criterion_for("ResponsibilityAssignment", "accepted"))
            found.add(criterion_for("Mandate", "accepted"))
        elif op == "related_phases":
            for binding in node["bindings"]:
                target = referenced_record(field_type(record_name, binding["field_path"]))
                if not target:
                    continue
                for state in binding["states"]:
                    found.add(criterion_for(target, state))
    return {name for name in found if name and name != criterion_id}


def genesis_disjunct(criterion_id):
    """True when this criterion offers an out-of-band branch reaching bootstrap_roots."""
    for node in op_nodes(PREDICATES[criterion_id]["body"]):
        if node["op"] != "any":
            continue
        for branch in node["predicates"]:
            for inner in op_nodes(branch):
                if inner["op"] == "bootstrap_roots":
                    return True
                if inner["op"] == "call" and _reaches_bootstrap(inner["predicate_id"]):
                    return True
    return False


def _reaches_bootstrap(predicate_id, seen=frozenset()):
    if predicate_id in seen or predicate_id not in PREDICATES:
        return False
    seen = seen | {predicate_id}
    for node in op_nodes(PREDICATES[predicate_id]["body"]):
        if node["op"] == "bootstrap_roots":
            return True
        if node["op"] == "call" and _reaches_bootstrap(node["predicate_id"], seen):
            return True
    return False


def walk(start=CHAIN_ROOT):
    """Return (grounded, trace). Grounded means finite termination at a bootstrap root."""
    state = {}

    def resolve(name, stack):
        if name in state:
            return state[name]
        if name in stack:
            return "cycle"
        if genesis_disjunct(name):
            # Grounded only if nothing OUTSIDE the disjunct re-imposes the chain.
            leftover = unconditional_obligations(name)
            if not leftover:
                state[name] = "grounded"
                return "grounded"
            results = [resolve(need, stack | {name}) for need in sorted(leftover)]
            verdict = "grounded" if all(r == "grounded" for r in results) else "ungrounded"
            state[name] = verdict
            return verdict
        needs = obligations(name)
        if not needs:
            # No acceptance obligation at all, and no genesis branch: it terminates,
            # but it terminates on nothing rather than on a recorded human act.
            state[name] = "grounded"
            return "grounded"
        results = [resolve(need, stack | {name}) for need in sorted(needs)]
        verdict = "grounded" if all(r == "grounded" for r in results) else "ungrounded"
        state[name] = verdict
        return verdict

    verdict = resolve(start, frozenset())
    return verdict == "grounded", state


def main():
    if CHAIN_ROOT not in PREDICATES:
        print(json.dumps({"error": f"{CHAIN_ROOT} absent"}))
        return 1
    grounded, state = walk()
    cycle_members = sorted(name for name, value in state.items() if value != "grounded")
    report = {
        "chain_root": CHAIN_ROOT,
        "terminates_at_a_bootstrap_root": grounded,
        "nodes_visited": len(state),
        "ungrounded_nodes": cycle_members,
        "direct_obligations_of_chain_root": sorted(obligations(CHAIN_ROOT)),
        "predicates_invoking_bootstrap_roots": sorted(
            name for name, predicate in PREDICATES.items()
            if any(node["op"] == "bootstrap_roots" for node in op_nodes(predicate["body"]))
        ),
        "criteria_offering_a_genesis_disjunct": sorted(
            name for name in PREDICATES
            if name.startswith("criterion.") and genesis_disjunct(name)
        ),
    }
    print(json.dumps(report, indent=2))
    return 0 if grounded else 1


if __name__ == "__main__":
    sys.exit(main())
