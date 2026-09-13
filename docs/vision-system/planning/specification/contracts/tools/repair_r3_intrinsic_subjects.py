#!/usr/bin/env python3
"""R3 (CCR-03, FI-12 constraint 2): make the intrinsic subject exclusion enforceable.

`invariants.json#/LifecycleStatus[0]` said "subject is neither LifecycleStatus nor
intrinsic/derived record" -- in prose, binding nothing. Every subject-taking
primitive's `subject_ref.record_type` enum listed all 173 records, so
`judgment_matches(subject_ref.record_type = "LifecycleStatus")` validated: a status
accepted by a judgment about that status.

The exclusion set is DERIVED from `intrinsic: true` in record-registry.json and is
never hand-listed here, so a record that becomes intrinsic later leaves these enums
in the same commit.

Usage: python3 tools/repair_r3_intrinsic_subjects.py [--dry-run]
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import contracts_io as io  # noqa: E402

SUBJECT_TAKING = [
    "subject_unchanged", "status_edge", "current_owner", "accepted_for",
    "judgment_matches", "attested_result", "due_preserved", "transition_basis",
]


def main(dry_run: bool) -> int:
    records = io.load_stable("record-registry.json")
    primitives = io.load_stable("primitive-registry.json")

    intrinsic = sorted(name for name, record in records.items()
                       if record["lifecycle"].get("intrinsic"))
    business = io.business_record_types()

    changed = {}
    for name in SUBJECT_TAKING:
        primitive = primitives[name]
        enum_node = primitive["argument_schema"]["properties"]["subject_ref"]["properties"]["record_type"]
        before = list(enum_node["enum"])
        enum_node["enum"] = list(business)
        changed[name] = {"before": len(before), "after": len(business),
                         "removed": sorted(set(before) - set(business))}

    # The prose invariant now names the mechanism that enforces it, rather than
    # standing alone as the only thing that says so.
    invariants = io.load_stable("invariants.json")
    invariants["LifecycleStatus"] = [
        ("subject is neither LifecycleStatus nor an intrinsic record; ENFORCED by the "
         "subject_ref.record_type enum of every subject-taking primitive in "
         "primitive-registry.json, derived from `intrinsic: true` in record-registry.json "
         "by tools/repair_r3_intrinsic_subjects.py and re-checked by validate_contracts.py")
        if index == 0 else clause
        for index, clause in enumerate(invariants["LifecycleStatus"])
    ]

    # The six intrinsic criteria ARE the review's counterexample, sitting in the
    # registry: `criterion.LifecycleStatus.current.v1` puts a Ref<LifecycleStatus>
    # through `attested_result` -- a status attested by a judgment about that status.
    # Each intrinsic record has `transitions: []`, so no edge reaches these and the
    # only thing they do is contradict the invariant above. Restricting the enum
    # without removing them would leave the counterexample declared and unreachable
    # rather than gone.
    predicates = io.load_stable("predicate-registry.json")
    reachable_subjects = {name: predicate["argument_types"].get("subject_ref", "")
                          for name, predicate in predicates.items()}
    contradictory = sorted(
        name for name, declared in reachable_subjects.items()
        if declared.startswith("Ref<") and declared[4:-1] in set(intrinsic)
    )
    for name in contradictory:
        del predicates[name]

    # A predicate declaring a generic Ref<Record> argument carries its OWN enum, and
    # that enum is what a caller may pass. Narrowing only the primitives would leave
    # the intrinsics admitted one level up -- `evidence.exact_acceptance.v1` passes a
    # Ref<Record> straight into judgment_matches, so its enum is the live one.
    widened = []
    for name, predicate in predicates.items():
        for argument, declared in predicate["argument_types"].items():
            if "Ref<Record>" not in declared:
                continue
            schema = predicate["argument_schema"]["properties"][argument]
            node = schema.get("items", schema).get("properties", {}).get("record_type", {})
            if set(node.get("enum", [])) - set(business):
                node["enum"] = list(business)
                widened.append(f"{name}#{argument}")

    inventory = io.load_stable("coverage-inventory.json")
    inventory["canonical_predicates"] = sorted(predicates)

    report = {
        "intrinsic_records_excluded": intrinsic,
        "business_records_admitted": len(business),
        "primitives_restricted": changed,
        "predicates_removed_as_intrinsic_subjects": contradictory,
        "generic_ref_record_enums_narrowed": widened,
        "predicates_after": len(predicates),
    }
    print(json.dumps(report, indent=2))
    if dry_run:
        print("dry run; nothing written")
        return 0
    io.save("primitive-registry.json", primitives)
    io.save("invariants.json", invariants)
    io.save("predicate-registry.json", predicates)
    io.save("coverage-inventory.json", inventory)
    print("wrote primitive-registry.json, invariants.json, predicate-registry.json, "
          "coverage-inventory.json")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))
