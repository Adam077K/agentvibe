#!/usr/bin/env python3
"""R7 (CCR-07): derive coverage-inventory.json instead of authoring it.

The coverage checks compared the registries to an inventory authored in the same
run by the same author. `source_fields` was, at a7b2c5c, a BYTE-FOR-BYTE copy of
`source-field-mappings.json#/mappings` -- the inventory duplicated the very file it
was meant to be an independent check on, which is a tautology wearing the costume
of a coverage test.

Every list here is now computed from something upstream:

  source_work_records     work-knowledge-contracts.json#/records                40
  source_company_records  capabilities.json#/record_types                       51
  source_work_commands    work-knowledge-contracts.json#/commands               38
  source_work_edges       <Record>:<from>-><to> over every transition_edges    373
  source_fields           every declared source field id, capabilities +
                          work-knowledge payloads (461 + 403)                  864
  required_subjects       subject-bindings.json, `required_directive_subject`   46
  canonical_*             the registries themselves

`source_fields` is the one that changed meaning, and it is the load-bearing change:
it is now the list of SOURCE FIELD IDS, so "every source field is mapped exactly
once" is a claim with two independent sides. It holds exactly -- 864 derived, 864
mapped, zero unmapped, zero extra -- which also settles the item F-canonical-01
listed under "Not checked" because its derivation errored on the source's shape.

`source_commit` and `component_source_commit` are provenance and are preserved, not
derived; a commit id is not computable from the tree it names.

This module is imported by validate_contracts.py, which fails if the committed
inventory differs from what this returns. One implementation, two callers.
"""
from __future__ import annotations
import json
from pathlib import Path

CONTRACTS = Path(__file__).resolve().parent.parent
SOURCES = CONTRACTS.parent

PRESERVED = ("source_commit", "component_source_commit")


def _load(directory, name):
    return json.loads((directory / name).read_text(encoding="utf-8"))


def source_field_ids(capabilities, work_knowledge):
    ids = [f"capabilities.json#/record_types/{record}/{field}"
           for record, fields in capabilities["record_types"].items() for field in fields]
    ids += [f"work-knowledge-contracts.json#/records/{record}/payload/{field}"
            for record, body in work_knowledge["records"].items()
            for field in body.get("payload", {})]
    return sorted(ids)


def derive(committed):
    """Return the inventory as computed from the sources and the registries."""
    capabilities = _load(SOURCES, "capabilities.json")
    work_knowledge = _load(SOURCES, "work-knowledge-contracts.json")
    bindings = _load(CONTRACTS, "subject-bindings.json")

    derived = {key: committed[key] for key in PRESERVED}
    derived["required_subjects"] = sorted(
        name for name, binding in bindings.items() if binding["required_directive_subject"])
    derived["source_work_records"] = sorted(work_knowledge["records"])
    derived["source_company_records"] = sorted(capabilities["record_types"])
    derived["source_work_commands"] = sorted(work_knowledge["commands"])
    derived["source_work_edges"] = sorted(
        f"{record}:{edge['from']}->{edge['to']}"
        for record, body in work_knowledge["records"].items()
        for edge in body.get("transition_edges", []))
    derived["canonical_records"] = sorted(_load(CONTRACTS, "record-registry.json"))
    derived["canonical_commands"] = sorted(_load(CONTRACTS, "command-registry.json"))
    derived["canonical_predicates"] = sorted(_load(CONTRACTS, "predicate-registry.json"))
    derived["canonical_primitives"] = sorted(_load(CONTRACTS, "primitive-registry.json"))
    derived["canonical_values"] = sorted(_load(CONTRACTS, "value-registry.json"))
    derived["source_fields"] = source_field_ids(capabilities, work_knowledge)
    return derived


def differences(committed):
    derived = derive(committed)
    found = []
    for key in sorted(set(derived) | set(committed)):
        if key not in committed:
            found.append((key, "absent from the committed inventory", len(derived[key])))
        elif key not in derived:
            found.append((key, "in the committed inventory and derived from nothing", None))
        elif committed[key] != derived[key]:
            extra = sorted(set(map(str, committed[key])) - set(map(str, derived[key])))[:5] \
                if isinstance(derived[key], list) else committed[key]
            missing = sorted(set(map(str, derived[key])) - set(map(str, committed[key])))[:5] \
                if isinstance(derived[key], list) else derived[key]
            found.append((key, {"committed_only": extra, "derived_only": missing}, None))
    return found


if __name__ == "__main__":
    committed = _load(CONTRACTS, "coverage-inventory.json")
    print(json.dumps({"differences": differences(committed)}, indent=2))
