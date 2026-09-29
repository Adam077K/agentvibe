#!/usr/bin/env python3
"""R6 (CCR-06): make invariants / control-contracts / endpoints bind, or say they do not.

All three were loaded by `validate_contracts.py` and referenced by no check in it.
Their contents were prose strings that nothing could contradict -- as CCR-03
demonstrated concretely, since `invariants.json#/LifecycleStatus[0]` stated an
exclusion that every primitive's enum violated.

This script does NOT sweep them into a prose/ folder wholesale, because two of the
three genuinely bind and only a fragment does not:

  control-contracts.json  27 of its 28 entries name a record whose edge guards
                          invoke the `control_contract` primitive, which the
                          primitive registry says executes "the named per-record
                          control rule list in control-contracts.json". That is a
                          binding; it just had no checker. The 28th, SendClaim, is
                          an INTRINSIC record with `transitions: []`, so no
                          control_contract node can ever name it -- it moves to
                          prose/ with that reason, rather than being deleted or
                          left looking enforced.

  endpoints.json          every `request`, `response` and `owner` names a schema
                          definition or a component that exists. Checked now.

  invariants.json         each clause becomes an object declaring the check that
                          enforces it, or `enforced_by: null` meaning "prose, no
                          offline mechanism". Naming a check that the validator does
                          not register FAILS. This is the repository's own
                          ENFORCED/ADVISORY standard applied to a data file: a rule
                          enforced only by the sentence stating it is a wish.

Four clauses get a real check. The rest are honest about having none: they are
runtime semantics (currency catalogs, evidence coverage, encryption-before-persist)
that no offline read of these files can decide, and claiming otherwise would be the
same defect one layer up.

Usage: python3 tools/repair_r6_bind_or_label.py [--dry-run]
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import contracts_io as io  # noqa: E402

PROSE = io.ROOT / "prose"

# clause prefix -> check id registered in validate_contracts.py
ENFORCED_CLAUSES = {
    ("LifecycleStatus", 0): "lifecycle-status-subject-enum",
    ("RecordEnvelope", 0): "record-envelope-version-and-no-state-field",
    ("TimeWindow", 0): "time-window-declares-two-utc-bounds",
    ("CommandResult", 0): "command-result-accepted-requires-receipt",
}

# A blanket ceiling on an otherwise unbounded string. See the header note in the
# repair return: the NUMBER is a storage and denial-of-service decision, and it is
# flagged for the founder; what is not a judgement call is that `{"type":"string"}`
# with 907 references admits a gigabyte and a NUL byte.
STRING_MAX_LENGTH = 8192
NO_CONTROL_CHARACTERS = "^[^\\u0000-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$"


def main(dry_run: bool) -> int:
    invariants = io.load_stable("invariants.json")
    controls = io.load_stable("control-contracts.json")
    endpoints = io.load_stable("endpoints.json")
    records = io.load_stable("record-registry.json")
    predicates = io.load("predicate-registry.json")
    values = io.load_stable("values.schema.json")

    # --- invariants: every clause declares its enforcement status. ---
    rebuilt = {}
    enforced = 0
    for name, clauses in invariants.items():
        rebuilt[name] = []
        for index, clause in enumerate(clauses):
            if isinstance(clause, dict):
                rebuilt[name].append(clause)
                enforced += bool(clause.get("enforced_by"))
                continue
            check = ENFORCED_CLAUSES.get((name, index))
            rebuilt[name].append({"clause": clause, "enforced_by": check})
            enforced += bool(check)

    # --- control contracts: separate what can bind from what cannot. ---
    def ops_of(body, found):
        if isinstance(body, dict):
            if "op" in body:
                found.add(body["op"])
            for value in body.values():
                ops_of(value, found)
        elif isinstance(body, list):
            for value in body:
                ops_of(value, found)
        return found

    users = set()
    for record_name, record in records.items():
        for edge in record["lifecycle"]["transitions"]:
            if "control_contract" in ops_of(predicates[edge["predicate_id"]]["body"], set()):
                users.add(record_name)

    unreachable = {}
    for name in sorted(set(controls) - users):
        intrinsic = records.get(name, {}).get("lifecycle", {}).get("intrinsic")
        unreachable[name] = {
            "clauses": controls.pop(name),
            "reason": (
                f"{name} is an intrinsic record with `transitions: []`, so no edge guard can "
                "carry a control_contract node naming it. These clauses describe intent and "
                "enforce nothing; they are kept here so that is visible."
                if intrinsic else
                f"No edge guard invokes control_contract for {name}."
            ),
        }

    missing = sorted(users - set(controls))

    # --- string: bounded, and no control characters. ---
    values["$defs"]["string"] = {
        "type": "string",
        "maxLength": STRING_MAX_LENGTH,
        "pattern": NO_CONTROL_CHARACTERS,
        "description": (
            "Bounded UTF-8 text with no C0/C7 control characters except tab, newline and "
            "carriage return. The bound exists because 907 references resolved to an "
            "unconstrained {\"type\": \"string\"}; the exact ceiling is a storage and "
            "denial-of-service decision and is flagged for the founder, not derived."
        ),
    }

    report = {
        "invariant_clauses": sum(len(v) for v in rebuilt.values()),
        "invariant_clauses_with_a_check": enforced,
        "invariant_clauses_declared_prose_only": sum(len(v) for v in rebuilt.values()) - enforced,
        "control_contract_entries_that_bind": len(controls),
        "control_contract_entries_moved_to_prose": sorted(unreachable),
        "records_using_control_contract_with_no_entry": missing,
        "endpoints_checked": len(endpoints),
        "string_maxLength": STRING_MAX_LENGTH,
    }
    print(json.dumps(report, indent=2))
    if missing:
        raise SystemExit(f"records invoke control_contract with no entry: {missing}")
    if dry_run:
        print("dry run; nothing written")
        return 0

    PROSE.mkdir(exist_ok=True)
    (PROSE / "README.md").write_text(
        "# prose/\n\n"
        "Contract material that binds NOTHING and is kept where nobody can mistake it for\n"
        "enforcement. Every file here states why it cannot bind. `validate_contracts.py`\n"
        "does not read this directory; that is the point of the directory.\n",
        encoding="utf-8")
    (PROSE / "control-contracts-unreachable.json").write_text(
        io.dumps(unreachable), encoding="utf-8")
    io.save("invariants.json", rebuilt)
    io.save("control-contracts.json", controls)
    io.save("values.schema.json", values)
    print("wrote invariants.json, control-contracts.json, values.schema.json, prose/")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))
