#!/usr/bin/env python3
"""R5 (CCR-05): make `destination` resolve against records.schema.json.

`validate_contracts.py` checked `bool(mapping["destination"])` -- truthiness. So a
destination could name a field that does not exist, or be a sentence
("payload.chosen_option_id via explicit option identity map"), and still pass.

The grammar is declared, not inferred, and lives in ONE place --
tools/destination_paths.py, which validate_contracts.py imports as well. Anything a
destination needs to SAY beyond the path belongs in a `note` field, which is prose
and is checked as prose.

This script reports every destination that does not resolve, repairs the ones it
can repair MECHANICALLY -- a prose suffix split into `note`, a missing `payload.`
step, an unambiguous case/spelling match -- each accepted only because inserting it
makes the path resolve, and refuses to guess the rest, listing them for a human. A
mapping invented to make a checker green is the failure this whole package is about.

Of the 56 that did not resolve, 22 were NOT data defects at all: the first resolver
written here did not follow `$ref`, so it called `payload.strategy.intent_ref` and
its siblings broken when they are real. A checker that reports a real mapping as
broken teaches people to ignore it.

Usage: python3 tools/repair_r5_destination_resolution.py [--dry-run]
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import contracts_io as io  # noqa: E402


import destination_paths  # noqa: E402

SCHEMAS = {}


def schemas():
    if not SCHEMAS:
        SCHEMAS["records.schema.json"] = io.load("records.schema.json")
        SCHEMAS["values.schema.json"] = io.load("values.schema.json")
    return SCHEMAS


def resolve(_schema_defs, record, destination):
    """Thin adapter; the grammar itself lives in tools/destination_paths.py, which
    validate_contracts.py imports too, so there is exactly one implementation."""
    return destination_paths.resolve(schemas(), record, destination)


def main(dry_run: bool) -> int:
    mappings_file = io.load_stable("source-field-mappings.json")
    schema_defs = io.load("records.schema.json")["$defs"]
    mappings = mappings_file["mappings"]

    before_unresolved = []
    for mapping in mappings:
        failed = resolve(schema_defs, mapping["canonical_record"], mapping["destination"])
        if failed is not None:
            before_unresolved.append((mapping["source"], mapping["destination"], failed))

    split_prose = []
    matched_case = []
    still_unresolved = []
    for mapping in mappings:
        destination = mapping["destination"]
        if resolve(schema_defs, mapping["canonical_record"], destination) is None:
            continue
        record = mapping["canonical_record"]

        # A destination carrying a sentence: keep the longest leading dot path that
        # resolves, move the rest to `note` verbatim. Nothing is discarded.
        head = destination.split(" ")[0]
        if head != destination and resolve(schema_defs, record, head) is None:
            mapping["destination"] = head
            mapping["note"] = destination[len(head):].strip()
            split_prose.append((mapping["source"], head, mapping["note"]))
            continue

        # A record-rooted destination that omits the `payload.` step. Mechanical:
        # only accepted when inserting it makes the path resolve, never guessed.
        segments = destination.split(".")
        if segments[0] in schema_defs and len(segments) > 1:
            candidate = ".".join([segments[0], "payload"] + segments[1:])
            if resolve(schema_defs, record, candidate) is None:
                mapping["destination"] = candidate
                matched_case.append((mapping["source"], destination, candidate))
                continue

        # An unambiguous property whose name differs only by case or separator.
        properties = schema_defs.get(record, {}).get("properties", {})
        segments = destination.split(".")
        if len(segments) == 2 and segments[0] == "payload":
            payload_properties = properties.get("payload", {}).get("properties", {})
            def normal(text):
                return text.replace("_", "").replace("-", "").lower()
            candidates = [name for name in payload_properties
                          if normal(name) == normal(segments[1])]
            if len(candidates) == 1:
                mapping["destination"] = f"payload.{candidates[0]}"
                matched_case.append((mapping["source"], destination, mapping["destination"]))
                continue

        still_unresolved.append({
            "source": mapping["source"],
            "canonical_record": record,
            "destination": destination,
            "unresolved_segment": resolve(schema_defs, record, destination),
            "record_has_payload_properties": sorted(
                schema_defs.get(record, {}).get("properties", {})
                .get("payload", {}).get("properties", {}))[:40],
        })

    report = {
        "mappings": len(mappings),
        "unresolved_before": len(before_unresolved),
        "prose_suffixes_split_into_note": split_prose,
        "spelling_matched_against_the_schema": matched_case,
        "unresolved_after": len(still_unresolved),
        "needs_a_human": still_unresolved[:60],
    }
    print(json.dumps(report, indent=2))
    if dry_run:
        print("dry run; nothing written")
        return 0
    io.save("source-field-mappings.json", mappings_file)
    print("wrote source-field-mappings.json")
    return 1 if still_unresolved else 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))
