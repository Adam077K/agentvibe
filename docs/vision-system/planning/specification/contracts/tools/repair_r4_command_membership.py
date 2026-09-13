#!/usr/bin/env python3
"""R4 (CCR-04): every allowed_command_ids entry must be a registered command.

`validate_contracts.py` checked `bool(edge["allowed_command_ids"])` -- non-emptiness
and nothing else -- so 26 edges routed to `kernel.projection.recompute`, which was
absent from the 104-entry command registry. A route to a command that does not
exist reads exactly like a route to one that does.

`kernel.projection.recompute` is REGISTERED here rather than deleted, because it is
real: all 26 edges belong to the three records whose lifecycle carries
`projection: true` (AccessGraph, OperationStatus, OperatorProjection), and a
projection's state is recomputed rather than decided. Deleting the id would have
left those 26 edges routed through `kernel.record.transition`, which asserts an
owner decision that a recomputation does not have.

Its guard is NOT the shared `command_dispatch` body that all 104 other command
guards share. A recompute's whole obligation is that it changes the projection and
not the business bytes underneath, so the guard says that, using `same_business_bytes`
-- a primitive that until now no predicate in the corpus invoked.

Usage: python3 tools/repair_r4_command_membership.py [--dry-run]
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import contracts_io as io  # noqa: E402

COMMAND_ID = "kernel.projection.recompute"
GUARD_ID = "command.kernel.projection.recompute.v1"
# Recomputation may touch the projected view and its audit trail; everything else
# must decode to the same canonical bytes.
RECOMPUTE_ALLOWED_PATHS = [
    "/payload/projection",
    "/lifecycle_status",
    "/last_event_id",
    "/recorded_at",
    "/provenance_refs",
]


def main(dry_run: bool) -> int:
    records = io.load_stable("record-registry.json")
    commands = io.load_stable("command-registry.json")
    predicates = io.load_stable("predicate-registry.json")
    command_schema = io.load_stable("commands.schema.json")

    unregistered = {}
    for record_name, record in records.items():
        for edge in record["lifecycle"]["transitions"]:
            for command_id in edge["allowed_command_ids"]:
                if command_id not in commands:
                    unregistered.setdefault(command_id, []).append(
                        (record_name, edge["edge_id"], record["lifecycle"]["projection"]))

    routed = unregistered.get(COMMAND_ID, [])
    projection_records = sorted({name for name, _, _ in routed})
    non_projection = [edge for _, edge, is_projection in routed if not is_projection]

    if routed and non_projection:
        raise SystemExit(
            f"{COMMAND_ID} is routed from non-projection edges {non_projection}; "
            "registering it as a projection command would be wrong for those")

    if COMMAND_ID not in commands and routed:
        predicates[GUARD_ID] = {
            "version": "1.0",
            "argument_types": {
                "command": "CommandEnvelope",
                "prior_projection": "JsonValue",
                "recomputed_projection": "JsonValue",
            },
            "body": {
                "op": "all",
                "predicates": [
                    {"op": "command_dispatch", "command": {"arg": "command"}},
                    {
                        "op": "same_business_bytes",
                        "before": {"arg": "prior_projection"},
                        "after": {"arg": "recomputed_projection"},
                        "allowed_paths": list(RECOMPUTE_ALLOWED_PATHS),
                    },
                ],
            },
            "meaning": (
                f"{COMMAND_ID} exact typed command and target dispatch, plus the obligation "
                "that distinguishes a recomputation from a decision: after removing the "
                "projected view and its audit fields, the canonical business bytes before and "
                "after agree. A projection may be rebuilt; it may not rewrite what it projects."
            ),
            "owner_component": "S1-C02",
            "source": "11-schemas-state-contracts.md#registration-and-transition-routing",
            "failure": (
                "false or unresolved denies the recompute; a projection that cannot prove it "
                "left the business bytes intact is not recomputed, it is rewritten"
            ),
            "implementation_status": (
                "specified; conformance interpreter only, no production binding implemented"
            ),
            "argument_schema": {
                "type": "object",
                "properties": {
                    "command": {"$ref": "values.schema.json#/$defs/CommandEnvelope"},
                    "prior_projection": {"$ref": "values.schema.json#/$defs/JsonValue"},
                    "recomputed_projection": {"$ref": "values.schema.json#/$defs/JsonValue"},
                },
                "required": ["command", "prior_projection", "recomputed_projection"],
                "additionalProperties": False,
            },
        }

        commands[COMMAND_ID] = {
            "owner_component": "S1-C02",
            "payload": {
                "record_ref": "Ref<Record>",
                "recompute_basis_refs": "Ref<DomainEvent>[]",
                "read_position": "Position",
                "reason_ref": "Ref<ReasonRecord>",
            },
            "source": "11-schemas-state-contracts.md#registration-and-transition-routing",
            "read_only": False,
            "schema_ref": f"commands.schema.json#/$defs/{COMMAND_ID}",
            "guard_predicate_id": GUARD_ID,
            "guard_version": "1.0",
            "transaction_contract": {
                "isolation": "serializable, <=3 serialization retries, no external I/O while holding locks",
                "idempotency": (
                    "command_id with exact canonical request digest; a recompute at a different "
                    "read_position is a different command, not a retry"
                ),
                "cas": (
                    "projection lifecycle head plus every source head named in "
                    "recompute_basis_refs at the stated read_position"
                ),
                "commit": "one complete GroupBody without own future hash/proof; post-commit R independent durability before accepted",
                "external_effect": "none; a projection recompute produces no world effect",
                "on_failure": "typed reason, original result on retry, duties/holds retained",
                "discriminator_checks": [
                    "record_type is a record whose lifecycle declares projection: true",
                    "target state belongs to exact registered subject type",
                    "recomputed business bytes equal prior business bytes outside the projected view",
                    "predicate IDs/version/argument schemas admitted; unregistered arbitrary predicates fail",
                ],
            },
            "planned_module": "system/apps/witness",
            "target_types": projection_records,
        }

        template = command_schema["$defs"]["kernel.record.transition"]
        entry = json.loads(json.dumps(template))
        entry["properties"]["type"] = {"const": COMMAND_ID}
        entry["properties"]["payload"] = {
            "type": "object",
            "properties": {
                "record_ref": io.any_ref_schema(projection_records),
                "recompute_basis_refs": {"type": "array",
                                         "items": io.ref_schema("DomainEvent")},
                "read_position": {"$ref": "values.schema.json#/$defs/Position"},
                "reason_ref": io.ref_schema("ReasonRecord"),
            },
            "required": ["record_ref", "recompute_basis_refs", "read_position", "reason_ref"],
            "additionalProperties": False,
        }
        command_schema["$defs"][COMMAND_ID] = entry

    inventory = io.load_stable("coverage-inventory.json")
    inventory["canonical_commands"] = sorted(commands)
    inventory["canonical_predicates"] = sorted(predicates)

    report = {
        "unregistered_command_ids_before": {k: len(v) for k, v in unregistered.items()},
        "edges_routed_to_it": len(routed),
        "projection_records_routing_it": projection_records,
        "registered": COMMAND_ID in commands,
        "guard": GUARD_ID,
        "commands_after": len(commands),
    }
    print(json.dumps(report, indent=2))
    if dry_run:
        print("dry run; nothing written")
        return 0
    io.save("command-registry.json", commands)
    io.save("predicate-registry.json", predicates)
    io.save("commands.schema.json", command_schema)
    io.save("coverage-inventory.json", inventory)
    print("wrote command-registry.json, predicate-registry.json, commands.schema.json, "
          "coverage-inventory.json")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))
