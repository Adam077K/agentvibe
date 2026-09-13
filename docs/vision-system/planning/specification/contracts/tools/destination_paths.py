#!/usr/bin/env python3
"""The destination path grammar for source-field-mappings.json -- ONE implementation.

`validate_contracts.py` and `tools/repair_r5_destination_resolution.py` both import
this. Two implementations of one check disagree, and you find out during the
incident; this repository has already paid for that lesson twice.

GRAMMAR, declared rather than inferred:

  - A destination is dot-separated. `name[]` steps into an array's items.
  - It is rooted at `records.schema.json#/$defs/<canonical_record>`, UNLESS its
    first segment names a registered record type, in which case it is rooted there.
    A source `state` field legitimately lands on LifecycleStatus rather than in the
    business payload, and forcing it into the payload would be a wrong mapping that
    resolves.
  - `$ref` is followed, across records.schema.json and values.schema.json.
  - `oneOf` selects the branch whose `subject_ref.record_type` admits the mapping's
    canonical record. LifecycleStatus.payload is one branch per record type, and
    resolving against the first branch answers a question nobody asked.
  - Every remaining segment must be a declared property.
"""
from __future__ import annotations


def deref(node, schemas, depth=0):
    while isinstance(node, dict) and "$ref" in node and depth < 20:
        target, _, fragment = node["$ref"].partition("#")
        document = schemas.get(target.rsplit("/", 1)[-1] or "records.schema.json")
        if document is None:
            return node
        for key in [k for k in fragment.split("/") if k]:
            key = key.replace("~1", "/").replace("~0", "~")
            if not isinstance(document, dict) or key not in document:
                return node
            document = document[key]
        node, depth = document, depth + 1
    return node


def select_branch(node, record, schemas):
    if not isinstance(node, dict) or "oneOf" not in node:
        return node
    for branch in node["oneOf"]:
        branch = deref(branch, schemas)
        subject = deref(branch.get("properties", {}).get("subject_ref", {}), schemas)
        if record in subject.get("properties", {}).get("record_type", {}).get("enum", []):
            return branch
    return node


def resolve(schemas, record, destination):
    """Return None when the path resolves, else the segment that failed."""
    schema_defs = schemas["records.schema.json"]["$defs"]
    segments = destination.split(".")
    if segments[0] in schema_defs:
        node, segments = schema_defs[segments[0]], segments[1:]
    else:
        node = schema_defs.get(record)
    if node is None:
        return record
    for segment in segments:
        node = select_branch(deref(node, schemas), record, schemas)
        array = segment.endswith("[]")
        segment = segment[:-2] if array else segment
        properties = node.get("properties") if isinstance(node, dict) else None
        if not properties or segment not in properties:
            return segment + ("[]" if array else "")
        node = deref(properties[segment], schemas)
        if isinstance(node, dict) and node.get("type") == "array" and "items" in node:
            node = deref(node["items"], schemas)
    return None
