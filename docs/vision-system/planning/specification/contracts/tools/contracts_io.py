#!/usr/bin/env python3
"""Byte-stable load/save for the contract registries.

Every registry in this directory is `json.dumps(obj, indent=2, ensure_ascii=False)`
plus a trailing newline. Verified by round-tripping each file untouched before any
repair script writes: if a file does not round-trip, the script refuses rather than
reformatting 9.7 MB of registry into an unreviewable diff.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def dumps(obj) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False) + "\n"


def load(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def load_stable(name):
    """Load and assert the file already round-trips, so our diff is only our edits."""
    raw = (ROOT / name).read_text(encoding="utf-8")
    obj = json.loads(raw)
    if dumps(obj) != raw:
        raise SystemExit(f"{name}: does not round-trip; refusing to rewrite it wholesale")
    return obj


def save(name, obj):
    (ROOT / name).write_text(dumps(obj), encoding="utf-8")


UUID_REF = {"$ref": "values.schema.json#/$defs/UUID"}
REVISION_REF = {"$ref": "values.schema.json#/$defs/Revision"}


def ref_schema(record_type: str):
    return {
        "type": "object",
        "properties": {
            "record_id": dict(UUID_REF),
            "record_type": {"type": "string", "enum": [record_type]},
            "revision": dict(REVISION_REF),
        },
        "required": ["record_id", "record_type", "revision"],
        "additionalProperties": False,
    }


def business_record_types():
    """Non-intrinsic business record types, derived from `intrinsic: true` in the
    record registry -- never hand-listed. This is the CCR-03 exclusion set."""
    records = load("record-registry.json")
    return [name for name, record in sorted(records.items())
            if not record["lifecycle"].get("intrinsic")]


def any_ref_schema(record_types):
    return {
        "type": "object",
        "properties": {
            "record_id": dict(UUID_REF),
            "record_type": {"type": "string", "enum": list(record_types)},
            "revision": dict(REVISION_REF),
        },
        "required": ["record_id", "record_type", "revision"],
        "additionalProperties": False,
    }


def type_schema(declared: str, record_enum=None):
    """Schema for one entry of `argument_types`, in the shape the registry already uses."""
    optional = declared.endswith("?")
    base = declared[:-1] if optional else declared
    array = base.endswith("[]")
    if array:
        base = base[:-2]
    if base.startswith("Ref<") and base.endswith(">"):
        target = base[4:-1]
        inner = any_ref_schema(record_enum) if target == "Record" else ref_schema(target)
        if target == "Record" and record_enum is None:
            raise ValueError("Ref<Record> needs an explicit record_type enum")
    elif base[:1].isupper() or base == "string":
        # A named value type resolves straight to values.schema.json, which is how
        # every non-Ref argument in the committed registry already declares itself.
        inner = {"$ref": f"values.schema.json#/$defs/{base}"}
    else:
        raise ValueError(f"no schema shape known for argument type {declared!r}")
    return {"type": "array", "items": inner} if array else inner


def argument_schema(argument_types: dict, record_enum=None):
    return {
        "type": "object",
        "properties": {name: type_schema(declared, record_enum)
                       for name, declared in argument_types.items()},
        "required": [name for name, declared in argument_types.items() if not declared.endswith("?")],
        "additionalProperties": False,
    }
