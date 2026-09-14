#!/usr/bin/env python3
"""Offline specification checks. This is not a production predicate/authority runtime."""
from __future__ import annotations
import json
import os
import sys
from pathlib import Path
from decimal import Decimal
from urllib.parse import urldefrag
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "tools"))
import destination_paths  # noqa: E402  one implementation of the path grammar, shared
import derive_inventory  # noqa: E402  one implementation of the inventory derivation
# Anchor the derivation at THIS validator's directory. derive_inventory resolves its
# own __file__, and tools/ may be a symlink -- under which the validator would
# cheerfully derive from the real registries while claiming to check the tree in
# front of it. That is a validator reporting on a file it is not reading.
derive_inventory.CONTRACTS = ROOT
derive_inventory.SOURCES = ROOT.parent
import acceptance_chain  # noqa: E402  the FI-12 chain walk, shared with the repair tools
COUNT = 0

def checked(condition, detail):
    global COUNT
    if not condition:
        raise AssertionError(detail)
    COUNT += 1

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result

def no_float(value):
    raise ValueError(f"noncanonical JSON numeric token: {value}; quantities use decimal strings")

def read(name):
    return json.loads((ROOT / name).read_text(), object_pairs_hook=unique_object,
                      parse_float=no_float, parse_constant=no_float)

FILES = {p.name: read(p.name) for p in ROOT.glob("*.json")}
SCHEMAS = {n: s for n, s in FILES.items() if n.endswith(".schema.json")}
REG = Registry().with_resources((s["$id"], Resource.from_contents(s)) for s in SCHEMAS.values())
RECORDS = FILES["record-registry.json"]
PREDICATES = FILES["predicate-registry.json"]
PRIMITIVES = FILES["primitive-registry.json"]
COMMANDS = FILES["command-registry.json"]
INVENTORY = FILES["coverage-inventory.json"]
BINDINGS = FILES["subject-bindings.json"]

def walk(value):
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

def schema_for(file, name):
    return {"$schema": "https://json-schema.org/draft/2020-12/schema",
            "$ref": SCHEMAS[file]["$id"] + "#/$defs/" + name}

def validate_shape(file, name, instance):
    Draft202012Validator(schema_for(file, name), registry=REG,
                         format_checker=FormatChecker()).validate(instance)

def shape_case(file, name, instance, expected):
    try:
        validate_shape(file, name, instance)
        actual = True
    except Exception as error:
        from jsonschema.exceptions import ValidationError
        if not isinstance(error, ValidationError):
            raise
        actual = False
    checked(actual == expected, ("shape", name, expected, instance))

# Closed-schema/ref/registry checks inspect every definition and every source work edge.
for file, schema in SCHEMAS.items():
    Draft202012Validator.check_schema(schema)
    for node in walk(schema):
        if isinstance(node, dict) and "$ref" in node:
            target_file, fragment = urldefrag(node["$ref"])
            target_file = target_file.rsplit("/", 1)[-1] if target_file else file
            checked(target_file in SCHEMAS, ("external/unresolved schema", file, node["$ref"]))
            target = SCHEMAS[target_file]
            for key in fragment.strip("/").split("/") if fragment else []:
                key = key.replace("~1", "/").replace("~0", "~")
                checked(key in target, ("schema pointer", file, node["$ref"], key))
                target = target[key]
# CCR-07: the inventory is DERIVED, not authored beside the thing it checks. At
# a7b2c5c `source_fields` was a byte-for-byte copy of source-field-mappings.json --
# a tautology wearing the costume of a coverage test.
inventory_drift = derive_inventory.differences(INVENTORY)
checked(not inventory_drift, ("coverage inventory differs from its derivation", inventory_drift))
# And the claim that derivation makes real: every declared source field is mapped
# exactly once. 864 derived, 864 mapped, zero either way.
mapped_sources = [m["source"] for m in FILES["source-field-mappings.json"]["mappings"]]
checked(sorted(mapped_sources) == INVENTORY["source_fields"],
        ("source fields and mappings disagree",
         sorted(set(INVENTORY["source_fields"]) ^ set(mapped_sources))[:10]))
checked(set(RECORDS) == set(INVENTORY["canonical_records"]), "record coverage")
checked(set(COMMANDS) == set(INVENTORY["canonical_commands"]), "command coverage")
checked(set(PREDICATES) == set(INVENTORY["canonical_predicates"]), "predicate coverage")
checked(set(PRIMITIVES) == set(INVENTORY["canonical_primitives"]), "primitive coverage")
# GR-04. values.schema.json's PredicateId enum is DERIVED here rather than compared to
# nothing. Two hand-kept lists of the same 2273 ids drift in silence, and this pair had:
# measured 2026-09-13, 9 registered predicates were missing from the enum and 6 enum
# entries named predicates R3 had deleted. Neither direction is cosmetic -- an enum
# entry with no predicate lets a TypedPredicate reference nothing and still validate,
# and a registered predicate absent from the enum cannot be cited at all. The expected
# value is `sorted(PREDICATES)`, which is what the committed file already was, so the
# order is the derivation's rather than an accident someone must preserve by hand.
predicate_id_enum = SCHEMAS["values.schema.json"]["$defs"]["PredicateId"]["enum"]
checked(predicate_id_enum == sorted(PREDICATES),
        ("PredicateId enum differs from its derivation from predicate-registry.json",
         {"registered_but_absent_from_enum":
              sorted(set(PREDICATES) - set(predicate_id_enum))[:10],
          "in_enum_but_no_such_predicate":
              sorted(set(predicate_id_enum) - set(PREDICATES))[:10],
          "order_differs": sorted(predicate_id_enum) != predicate_id_enum}))
checked(set(FILES["value-registry.json"]) == set(INVENTORY["canonical_values"]), "value metadata coverage")
checked(set(INVENTORY["required_subjects"]) <= set(BINDINGS), "46 directive subjects")
checked(len(INVENTORY["required_subjects"]) == len(set(INVENTORY["required_subjects"])) == 46,
        "unique directive subject set")
for name, binding in BINDINGS.items():
    checked(set(binding["canonical_types"]) <= set(RECORDS), ("subject refs", name))
    if "value_type" in binding:
        checked(binding["value_type"] in SCHEMAS["values.schema.json"]["$defs"], ("subject value", name))
for forbidden in ("Budget", "Handoff", "Evaluation", "RecoveryFrontier", "RawCapture", "Attempt"):
    checked(forbidden not in RECORDS, ("duplicate alias authority", forbidden))
all_edges = set()
for name, record in RECORDS.items():
    checked(record["schema_ref"].endswith("/" + name), ("record schema", name))
    phases = record["lifecycle"]["phases"]
    checked(record["lifecycle"]["initial_phase"] in phases, ("initial phase", name))
    for edge in record["lifecycle"]["transitions"]:
        checked(edge["edge_id"] not in all_edges, ("duplicate edge", edge["edge_id"]))
        all_edges.add(edge["edge_id"])
        checked(edge["from"] in phases and edge["to"] in phases, ("phase edge", edge))
        checked(edge["predicate_id"] in PREDICATES, ("edge predicate", edge))
        checked(bool(edge["allowed_command_ids"]), ("unrouted edge", edge))
        # CCR-04: non-emptiness is not membership. 26 edges routed to
        # kernel.projection.recompute, which was in no registry, and a route to a
        # command that does not exist reads exactly like a route to one that does.
        for routed_command in edge["allowed_command_ids"]:
            checked(routed_command in COMMANDS, ("unregistered routed command", edge["edge_id"], routed_command))
            checked(name in COMMANDS[routed_command]["target_types"],
                    ("command does not target this record", edge["edge_id"], routed_command, name))
        checked(edge["mutates"].startswith("LifecycleStatus") or record["lifecycle"]["projection"],
                ("unexpected business mutation", edge))
    for relation in record["relations"]:
        checked(set(relation["targets"]) <= set(RECORDS), ("typed relation", name, relation))
checked(set(INVENTORY["source_work_edges"]) <= all_edges, "all 373 source work edges preserved")
for name, command in COMMANDS.items():
    checked(command["guard_predicate_id"] in PREDICATES, ("command guard", name))
    checked(set(command["target_types"]) <= set(RECORDS), ("command target", name))
    checked(name in SCHEMAS["commands.schema.json"]["$defs"], ("command schema", name))
checked(set(INVENTORY["source_work_commands"]) <= set(COMMANDS), "source command coverage")

# CCR-06: invariants.json, control-contracts.json and endpoints.json were loaded
# above and referenced by no check below, so nothing failed when they were
# contradicted -- which is exactly how CCR-03 survived. They bind here.
#
# REGISTERED_CHECKS is the closed set an invariant clause may name. A clause naming
# a check that is not in it fails, so "enforced_by" cannot drift into decoration.
REGISTERED_CHECKS = {
    "lifecycle-status-subject-enum",
    "record-envelope-version-and-no-state-field",
    "time-window-declares-two-utc-bounds",
    "command-result-accepted-requires-receipt",
}
INVARIANTS = FILES["invariants.json"]
CONTROLS = FILES["control-contracts.json"]
ENDPOINTS = FILES["endpoints.json"]
claimed_checks = set()
for subject, clauses in INVARIANTS.items():
    for clause in clauses:
        checked(isinstance(clause, dict) and set(clause) == {"clause", "enforced_by"},
                ("invariant clause shape", subject, clause))
        checked(isinstance(clause["clause"], str) and clause["clause"].strip(),
                ("empty invariant clause", subject))
        if clause["enforced_by"] is not None:
            checked(clause["enforced_by"] in REGISTERED_CHECKS,
                    ("invariant names an unregistered check", subject, clause["enforced_by"]))
            claimed_checks.add(clause["enforced_by"])
# And the converse: a registered check nobody claims is a check that drifted loose.
checked(claimed_checks == REGISTERED_CHECKS,
        ("registered checks not claimed by any invariant", sorted(REGISTERED_CHECKS - claimed_checks)))

# record-envelope-version-and-no-state-field
def payload_properties(record_name):
    payload = SCHEMAS["records.schema.json"]["$defs"][record_name]["properties"].get("payload", {})
    names = set(payload.get("properties", {}))
    for branch in payload.get("oneOf", []):
        names |= set(branch.get("properties", {}))
    return names
for name in RECORDS:
    definition = SCHEMAS["records.schema.json"]["$defs"][name]
    checked(definition["properties"].get("schema_version", {}).get("const") == "2.0",
            ("record envelope schema_version", name))
    # FI-12's whole design: state lives in LifecycleStatus, never in business bytes.
    checked("state" not in payload_properties(name), ("payload declares a state field", name))

# --- F6A-07: THE REGISTRY AND THE SCHEMA MUST AGREE ABOUT A RECORD'S PAYLOAD. ---
#
# `05` section 10 names record-registry.json "the authority for which transitions exist",
# and this file read the SCHEMA's payload for every field question and never compared the
# two. Measured at bcfd658: all FIFTEEN records the WORK-1.1 amendment adds declared
# `ContextManifest`'s fifteen payload fields, verbatim, as their own `type_fields` and all
# fifteen as `required_fields` -- so the declared authority said `StandingHolder` must
# carry a `work_order_ref` and an `expires_at`, and said `ConsequenceDerivation` need not
# carry `declared_floor_ref`, `reached_class_ids` or `frozen_payload_digest`. The schema
# was right in every case and nothing compared it to the registry, so a copy-paste of one
# record's payload into fifteen others was invisible to a full run.
#
# The registry states a payload in two places for a REASON, and the check reads both:
# `type_fields`/`required_fields` is the record's payload as it stood, and `fields` is what
# an amendment added to it, with `added_by` and a note per field. For the 165 records no
# amendment touched, `fields` is absent. For the 8 it extended, the two partition the
# payload. For the 15 it created, the whole payload is `fields`. All three shapes satisfy
# one rule: the UNION is the schema's property set, and the union of the required halves is
# the schema's `required`.
#
# LifecycleStatus is the one record this cannot ask about -- `kind: lifecycle-decision`,
# and its schema payload declares no `properties` at all -- so the rule is stated over
# records whose schema payload HAS a property set, which is 187 of 188. Narrowing it by
# `kind` instead would have excused a record by a field its own author writes.
for name, record in RECORDS.items():
    schema_payload = SCHEMAS["records.schema.json"]["$defs"][name]["properties"].get("payload", {})
    if "properties" not in schema_payload:
        continue
    payload = record["fields"]["payload"]
    added = payload.get("fields") or {}
    declared = set(payload.get("type_fields") or {}) | set(added)
    declared_required = set(payload.get("required_fields") or []) | {
        field for field, body in added.items() if body.get("required")}
    checked(declared == set(schema_payload["properties"]),
            ("REGISTRY AND SCHEMA DISAGREE ABOUT A RECORD'S PAYLOAD: record-registry.json "
             "is the declared authority and records.schema.json is what is enforced, so a "
             "field one names and the other does not is a rule with two answers (F6A-07)",
             name,
             {"in schema, not in registry": sorted(set(schema_payload["properties"]) - declared)[:8],
              "in registry, not in schema": sorted(declared - set(schema_payload["properties"]))[:8]}))
    checked(declared_required == set(schema_payload.get("required", [])),
            ("REGISTRY AND SCHEMA DISAGREE ABOUT WHICH PAYLOAD FIELDS ARE REQUIRED. This "
             "is the half that carried the defect: fifteen records declared another "
             "record's fifteen fields required and their own optional (F6A-07)",
             name,
             {"required by schema only": sorted(set(schema_payload.get("required", [])) - declared_required)[:8],
              "required by registry only": sorted(declared_required - set(schema_payload.get("required", [])))[:8]}))
    # And the two halves must agree with each other where they overlap, which they do for
    # all fifteen new records by construction: a type written twice drifts once.
    for field, declared_type in (payload.get("type_fields") or {}).items():
        if field in added:
            checked(added[field]["type"] == declared_type,
                    ("one record declares one payload field at two types", name, field,
                     {"type_fields": declared_type, "fields": added[field]["type"]}))

# --- F6C-10: THE ATTEMPT CEILING IS ON THE WORK ORDER AND IS COMPARED. ---------
#
# `05` section 6 R-X10: "A work order carries a maximum attempt count with a named owner,
# C02, and a stated behaviour at the ceiling: park." `attempt_ceiling` existed on
# `FailureRecord` ALONE, optional, and appeared in ZERO predicates -- so a work order
# carried no ceiling until it had already failed, and `observed -> retry_admitted` carried
# no guard comparing attempts against it. AE-M1-04, AE-M2-06 and AE-M4-04 each asked for
# this in near-identical words against three different candidates.
checked("attempt_ceiling" in SCHEMAS["records.schema.json"]["$defs"]["WorkOrder"]["properties"]["payload"]["required"],
        ("THE WORK ORDER CARRIES NO ATTEMPT CEILING: R-X10 puts the maximum attempt count "
         "on the work order, and it lived on `FailureRecord` alone -- so the bound existed "
         "only after the thing it bounds had already happened (F6C-10)",
         {"required": len(SCHEMAS["records.schema.json"]["$defs"]["WorkOrder"]["properties"]["payload"]["required"])}))
_retry_body = json.dumps(PREDICATES["criterion.FailureRecord.retry_admitted.v1"]["body"])
checked('"op": "count"' in _retry_body and '"/payload/attempt_ceiling"' in _retry_body
        and '"op": "lt"' in _retry_body,
        ("A RETRY IS ADMITTED WITHOUT COMPARING ATTEMPTS AGAINST THE CEILING: the ceiling "
         "is recorded and the transition into `retry_admitted` does not read it, which is "
         "the same anti-shape as F6C-11 one record over -- the evidence for a ceiling "
         "collected and never applied (F6C-10)",
         {"needs": ["count(/payload/attempt_refs)", "lt", "/payload/attempt_ceiling"]}))
# OWED, and instrumented rather than noted. R-X10's third clause is "a stated behaviour at
# the ceiling: park", and `FailureRecord` has no phase in which to record it. This lane
# WROTE that phase and WITHDREW it: adding it needs three `edge.FailureRecord.*.parked.v1`
# predicates, and tools/author_phase_content.py authors criteria and not edge predicates,
# so the validator refused all three transitions at `edge predicate`. Authoring an edge
# predicate by hand is the move this package's oracles exist to catch. The check below
# fails when the phase arrives, so the owed clause cannot land half-done and silent.
checked("parked" not in RECORDS["FailureRecord"]["lifecycle"]["phases"],
        ("FAILURERECORD NOW HAS A PARK PHASE and F6C-10's third clause can be finished: "
         "each `* -> parked` transition needs its own `edge.FailureRecord.*.parked.v1` "
         "predicate, and the criterion spec that belongs with it is written out in full in "
         "tools/phase_content.py beside the FailureRecord overrides. Restore it, then "
         "delete this check (F6C-10, owed clause)",
         {"phases": RECORDS["FailureRecord"]["lifecycle"]["phases"]}))

# --- F6C-11: A RULE THAT STATES A COMPARISON MAKES ONE. ------------------------
#
# `05` section 6's silent-drop counter (3) reads: "retention on any holding destination
# EXCEEDS the longest plausible outage, and the outage figure is stated, not assumed."
# `criterion.UnmatchedPoolEntry.landed.v1` demanded `work_record_ref`, `retention_until`,
# `longest_plausible_outage`, `alarm_reader_ref`, `alarm_raised_at` and `residue_note` all
# nonempty and contained NO COMPARISON OPERATOR AT ALL -- so an entry with a one-day
# retention and a thirty-day stated outage satisfied it. The package names that exact
# anti-shape in its own fixture r16-08: "a guard that collects the evidence for the ceiling
# and never applies it."
#
# Read HERE, off the criterion body, and deliberately BEFORE the derivation oracle further
# down. F6R-04 is the reason: a hand edit of a criterion surfaces as DRIFT first, and drift
# tells a reader a table moved rather than which rule stopped being checked. On a mutation
# that trips both, the reader should be told the concrete thing.
_pool_body = json.dumps(PREDICATES["criterion.UnmatchedPoolEntry.landed.v1"]["body"])
checked('"op": "lt"' in _pool_body
        and '"/payload/longest_plausible_outage"' in _pool_body
        and '"/payload/retention_span"' in _pool_body,
        ("THE RETENTION CEILING IS COLLECTED AND NEVER APPLIED: the rule this criterion "
         "carries states that retention EXCEEDS the longest plausible outage, and the "
         "criterion holds both operands and compares neither -- which admits a one-day "
         "retention beside a thirty-day stated outage. Requiring the outage per entry is "
         "the right answer to `stated, not assumed`; it is not the comparison (F6C-11)",
         {"needs": ["lt", "/payload/longest_plausible_outage", "/payload/retention_span"],
          "note": "the conjunct is authored by tools/phase_content.py as "
                  "('ltF', '/payload/longest_plausible_outage', '/payload/retention_span'); "
                  "weakening the derivation and regenerating does not satisfy this."}))
# And both operands are SPANS in one unit. `lt` is a checked comparison of the same operand
# type, so this is what makes the comparison meaningful rather than merely present: an
# instant compared against a duration is exactly the incomparable-units case `lt` fails on,
# and `retention_until` is an instant.
for _field in ("longest_plausible_outage", "retention_span"):
    checked(str(SCHEMAS["records.schema.json"]["$defs"]["UnmatchedPoolEntry"]["properties"]
                ["payload"]["properties"][_field].get("$ref", "")).endswith("/Duration"),
            ("AN OPERAND OF THE RETENTION COMPARISON IS NOT A DURATION: the two sides are "
             "compared as spans in one unit, and a comparison between two free strings is "
             "not a comparison (F6C-11)", _field))

# --- F6D-09: A FIELD THAT NAMES A PREDICATE IS TYPED AS ONE. -------------------
#
# `values.schema.json` defines `PredicateId` as an enum of all registry keys. It is derived
# and ratcheted -- tools/run_negative_fixtures.py re-derives it inside every scratch tree
# and r12-predicate-id-enum-drifts-from-the-registry proves the drift check works. And
# ZERO record fields used it: thirty-two predicate-bearing fields are typed
# `TypedPredicate` and the two WORK-1.1 added were `values.schema.json#/$defs/string`.
#
# The consequence was not theoretical. `guard.admission.refusal_names_failed_predicate`
# asserts the field is nonempty and `!= ""`, so a refusal whose `failed_predicate_id` is
# the text `unfamiliar wording` SATISFIED the guard -- and the guard's own `meaning` says
# "unfamiliar wording is not a predicate". Adverse case 13 and its paired benign case 17
# turn on exactly that distinction and the type did not carry it. `05` section 2's F-7
# narrowing accepted a higher `no_match` rate to buy DETERMINISTIC refusal; the determinism
# has to be in the contract to have been bought.
#
# `precondition_evaluator_kind` is closed here too, and it is the same defect one field
# over: `guard.interest.precondition_invokes_no_model` compares it to `"deterministic"` and
# to `"model"`, and the field admitted every other string in the world -- so an interest
# declaring `precondition_evaluator_kind: "heuristic"` passed a guard whose whole subject
# is that value. The two members are read off the guard's own body, not invented.
PREDICATE_BEARING_FIELDS = {
    ("AdmissionRecord", "failed_predicate_id"): "PredicateId",
    ("StandingInterest", "precondition_predicate_ids"): "PredicateId[]",
}
for (_record, _field), _wanted in sorted(PREDICATE_BEARING_FIELDS.items()):
    _body = SCHEMAS["records.schema.json"]["$defs"][_record]["properties"]["payload"]["properties"][_field]
    _leaf = _body.get("items", _body)
    checked(str(_leaf.get("$ref", "")).endswith("/PredicateId"),
            ("A FIELD THAT NAMES A PREDICATE IS A FREE STRING: `PredicateId` is a derived, "
             "ratcheted enum of every registry key and this field does not use it, so the "
             "text `unfamiliar wording` is an admissible predicate id -- which is the "
             "phrase `guard.admission.refusal_names_failed_predicate`'s own meaning says "
             "is NOT a predicate. A nonempty check cannot tell the two apart and the type "
             "can (F6D-09)",
             _record, _field, {"declared": _body, "required": _wanted}))
checked(set(SCHEMAS["records.schema.json"]["$defs"]["StandingInterest"]["properties"]["payload"]
            ["properties"]["precondition_evaluator_kind"].get("enum") or [])
        == {"deterministic", "model"},
        ("THE EVALUATOR KIND A GUARD COMPARES IS AN OPEN STRING: "
         "`guard.interest.precondition_invokes_no_model` reads this field and compares it "
         "to `deterministic` and to `model`, and every other string in the world satisfied "
         "the field's type -- so Layer 3's foundational rule was held by a declaration "
         "beside the thing it describes, and the declaration was unconstrained (F6D-09). "
         "The two members are the guard's own two comparands",
         SCHEMAS["records.schema.json"]["$defs"]["StandingInterest"]["properties"]["payload"]
         ["properties"]["precondition_evaluator_kind"].get("enum")))
# OWED, and recorded rather than faked. The review also asked for "a conjunct asserting
# each named predicate's registered `implementation_status` is deterministic". Measured
# here before writing it: `implementation_status` takes exactly ONE value across all 2,397
# registered predicates -- "specified; conformance interpreter only, no production binding
# implemented". There is no deterministic/model classification in the registry to read, so
# that conjunct would be TRUE OF EVERY PREDICATE by construction: a guard that collects the
# evidence for the ceiling and never applies it, which is the anti-shape fixture r16-08
# exists to name. The classification has to exist before the conjunct can mean anything.
# This assertion is what makes the absence visible instead of silent.
#
# IT MEASURES THE CONTRACT, NOT A SCRATCH TREE. A negative fixture runs this file over a
# patched copy of the registries, and a fixture that ADDS a predicate must give it a
# status. `r3-lifecycle-status-as-judgment-subject` does exactly that, and its status
# literal says what it is -- the sentinel below, whose own words are "never part of the
# contract". Without the exclusion, that fixture -- which exists to exercise the
# primitive-argument record-type comparison -- was refused HERE instead, and a negative
# fixture refused by a check other than its own is a wrong_reason leak: the suite reports
# a rejection while the control it was written to prove is never reached. The exclusion is
# keyed on the STATUS VALUE and not on where the predicate came from, so a fixture that
# introduces a genuine second classification still trips this, which is what
# fixtures/negative/r25-predicate-status-gains-a-second-classification exists to show and
# what fixtures/positive/r25-predicate-status-fixture-sentinel-ignored-benign holds the
# exclusion itself to.
#
# And it is an EQUALITY against a named literal now, not a count. `len(_statuses) == 1`
# is satisfied by any single value, so a registry-wide rewrite of the status to some other
# single string would have passed the tripwire whose entire subject is what that string
# says -- the same defect shape as counting a set instead of comparing its members, which
# F6A-10 is about two hundred lines below.
FIXTURE_ONLY_PREDICATE_STATUS = "negative fixture; never part of the contract"
CONTRACT_PREDICATE_STATUS = ("specified; conformance interpreter only, "
                             "no production binding implemented")
_statuses = {predicate.get("implementation_status") for predicate in PREDICATES.values()
             if predicate.get("implementation_status") != FIXTURE_ONLY_PREDICATE_STATUS}
checked(_statuses == {CONTRACT_PREDICATE_STATUS},
        ("THE PREDICATE REGISTRY NOW CLASSIFIES IMPLEMENTATION STATUS and F6D-09's third "
         "clause is no longer unwritable: it asked for a conjunct asserting each named "
         "precondition predicate's registered `implementation_status` is deterministic, "
         "and that was declined because the field held ONE value across all of them, which "
         "would have made the conjunct vacuous. More than one value exists now -- write "
         "the conjunct, type `precondition_predicate_ids` against the deterministic subset, "
         "and delete this check (F6D-09, owed clause)",
         {"distinct_statuses": sorted(_statuses)[:6], "predicates": len(PREDICATES),
          "the one contract status": CONTRACT_PREDICATE_STATUS,
          "excluded fixture sentinel": FIXTURE_ONLY_PREDICATE_STATUS}))

# --- F6D-12: THE SIX ADMITTED REASONS, AS A LITERAL, AND THE PAIRING. -----------
#
# `ExistenceJustification.reason_kind` and `reason_unit` were `values.schema.json#/$defs/
# string`, and `criterion.ExistenceJustification.admitted.v1` -- five conjuncts, three of
# them structural -- never constrained either. So `reason_kind: "specialized marketing
# knowledge"`, `reason_unit: "the marketing function"`, `decidable_test: "does the worker
# know marketing"`, `test_can_return_false: true` was ADMISSIBLE: negative control 8, a
# job-title roster relabelled as capabilities, passing the record built to catch it, on a
# chapter whose own words are "Specialized knowledge is refused as a reason".
#
# `05` section 4 states the six as a two-column table -- the reason and THE UNIT IT
# PREDICATES ON -- so the contract is six PAIRS and not two independent enums. Two enums
# alone admit `consequence_class` predicating on `a partition`, which is a reason applied
# to a unit where it returns undecidable, and R2 F-20's finding is that undecidable reads
# as satisfied. The pairing is a conjunct on the load-bearing transition, authored through
# tools/phase_content.py like every other criterion body; this literal is what that
# derivation is held to, and it is hand-written HERE for the reason every other literal in
# this file is: a table derived from the file it measures is satisfied by the empty file.
EXISTENCE_REASON_PAIRS = {
    "permission_scope": "permission_scope",
    "input_provenance": "input_set",
    "consequence_class": "effect_class",
    "confidentiality_boundary": "context_boundary",
    "named_partition": "partition",
    "verification_relation": "attempt_relation",
}
_ej_payload = SCHEMAS["records.schema.json"]["$defs"]["ExistenceJustification"]["properties"]["payload"]["properties"]
checked(set(_ej_payload["reason_kind"].get("enum") or []) == set(EXISTENCE_REASON_PAIRS),
        ("A SEVENTH ADMITTED REASON IS WRITABLE, or one of the six is not: `05` section 4 "
         "admits exactly six reasons and refuses a seventh by name -- specialized "
         "knowledge, attributable identity, provider or account separation are each "
         "refused in that section's own words -- so this enum is the six and nothing else "
         "(F6D-12)",
         {"declared": sorted(_ej_payload["reason_kind"].get("enum") or []),
          "the six": sorted(EXISTENCE_REASON_PAIRS)}))
checked(set(_ej_payload["reason_unit"].get("enum") or []) == set(EXISTENCE_REASON_PAIRS.values()),
        ("THE UNIT AN ADMITTED REASON PREDICATES ON IS NOT ONE OF THE SIX `05` section 4 "
         "names (F6D-12)",
         {"declared": sorted(_ej_payload["reason_unit"].get("enum") or []),
          "the six": sorted(set(EXISTENCE_REASON_PAIRS.values()))}))
# And the PAIRING, in the criterion, by reading the body rather than by trusting the
# derivation: every one of the six pairs is stated somewhere under the criterion's
# disjunction, and a pair that is not is a reason admitted with no unit it can predicate
# on. This is the clause neither enum can carry alone.
_ej_body = json.dumps(PREDICATES["criterion.ExistenceJustification.admitted.v1"]["body"])
for _kind, _unit in sorted(EXISTENCE_REASON_PAIRS.items()):
    checked('"%s"' % _kind in _ej_body and '"%s"' % _unit in _ej_body,
            ("AN ADMITTED REASON IS NOT PAIRED WITH ITS UNIT IN THE CRITERION: `05` "
             "section 4 is a two-column table, so the contract is six PAIRS. Two "
             "independent enums admit `consequence_class` predicating on `a partition` -- "
             "a criterion applied to a unit where it returns undecidable, which R2 F-20 "
             "names and which reads as SATISFIED (F6D-12)",
             {"reason": _kind, "unit": _unit}))

# --- F6X-01: EVERY EXCLUSIVE FACTORY RESOLVES, AND THE KERNEL SURFACE IS A LITERAL. ---
#
# `registration.exclusive_factory` says: this record has exactly one creation path and nothing
# else may make one. Nine records declare it. Before this check `exclusive_factory` was read
# ZERO TIMES by this file -- the string was never resolved against anything -- so a record could
# name a creation path that does not exist and the containment it claims to state was a comment.
# Three of the nine do exactly that: DomainEvent names `kernel.commit_group`, DurabilityReceipt
# names `witness.store_group`, LifecycleStatus names `kernel.apply_transition`, and none of the
# three is in command-registry.json's 105.
#
# THE REVIEW OFFERED TWO OPTIONS AND BOTH ARE WRONG, WHICH IS WHY THIS TOOK THREE LANES.
# "Register the commands" means authoring three command contracts -- argument schema, guard,
# authority, destination -- for paths nobody has specified, which is inventing contract and is the
# thing every refusal in this package exists to prevent. "Retire the declarations" means deleting
# the sentence `only the kernel may create a DomainEvent`, which is a REAL containment and one of
# the load-bearing ones: a domain event a record-level command can forge is not an audit trail.
# Taking either option to make a check pass would have traded a true statement for a green run.
#
# So the third thing, and it is the narrow one: the kernel and witness surfaces are declared HERE,
# by name, as a CLOSED literal of exactly three paths, and an exclusive factory resolves if it is
# a registered command OR a member of that literal. The declarations keep saying what is true; no
# command contract is invented; and every one of the nine now resolves to something a reader can
# find. What this does NOT do is specify those three paths -- see the names contract, where it is
# recorded as the open question it still is.
#
# The literal is what keeps this from being an escape hatch. Without "exactly these three", the
# exemption is a hole any record can climb through by naming something kernel-shaped, so the
# membership test is EXACT and not a `kernel.` PREFIX: `kernel.anything_at_all` is refused, and
# fixtures/negative/r29-exclusive-factory-invents-a-kernel-path is what holds that open.
KERNEL_FACTORY_PATHS = {
    "kernel.commit_group": "DomainEvent -- the commit that makes a group of events durable as one",
    "witness.store_group": "DurabilityReceipt -- the witness side of that same commit",
    "kernel.apply_transition": "LifecycleStatus -- the transition applier every edge guard runs through",
}
_factories = []
for _name, _record in sorted(RECORDS.items()):
    _factory = (_record.get("registration") or {}).get("exclusive_factory")
    if _factory is None:
        continue
    _factories.append((_name, _factory))
    checked(_factory in COMMANDS or _factory in KERNEL_FACTORY_PATHS,
            ("AN EXCLUSIVE FACTORY RESOLVES TO NOTHING: `registration.exclusive_factory` says "
             "this record has exactly ONE creation path and nothing else may make one, and the "
             "path it names is in neither command-registry.json nor the declared kernel surface. "
             "An unresolvable creation path is a containment written as a comment -- it reads "
             "like a rule and constrains nobody, which is worse than no declaration because a "
             "reader stops looking (F6X-01)",
             _name, {"names": _factory, "registered commands": len(COMMANDS),
                     "declared kernel paths": sorted(KERNEL_FACTORY_PATHS)}))
checked(len(_factories) >= 9,
        ("THE EXCLUSIVE-FACTORY WALK MET ALMOST NO DECLARATIONS: nine records declare one, and a "
         "walk that reached none of them reports a pass over an empty required set. The loop is "
         "guarded by a `continue` that a narrowing edit could widen into a skip of everything "
         "(F6X-01)", {"declarations": len(_factories), "floor": 9}))
checked(not (set(KERNEL_FACTORY_PATHS) & set(COMMANDS)),
        ("A DECLARED KERNEL PATH IS ALSO A REGISTERED COMMAND, so the exemption is now hiding a "
         "path that HAS a command contract and should be held to it. The two surfaces are "
         "disjoint by construction: the literal exists only for paths command-registry.json does "
         "not carry, and a path it does carry must resolve the ordinary way (F6X-01)",
         {"in both": sorted(set(KERNEL_FACTORY_PATHS) & set(COMMANDS))}))
checked(set(KERNEL_FACTORY_PATHS) == {"kernel.commit_group", "witness.store_group",
                                      "kernel.apply_transition"},
        ("THE KERNEL FACTORY SURFACE WAS WIDENED: it is exactly three paths, and it is a literal "
         "rather than a `kernel.` prefix rule precisely so that adding a fourth is an edit to "
         "this line that a reviewer sees. A prefix rule would let any record exempt itself from "
         "the command registry by choosing a name (F6X-01)", sorted(KERNEL_FACTORY_PATHS)))
# --- F6X-02: THE EIGHT BOUNDARY KINDS, AND THE FACT THAT NOTHING WAS CONTESTED. ------
#
# F6X-02 sat unrepaired through two lanes with the same reason recorded each time, and the
# reason was a good one: `registers/review-findings.json` says the members "would have been
# INVENTED rather than derived -- needs the chapter to state them first", and
# pinned-conjuncts.json repeats it, "a pin over an enum this package has not been given would
# be exactly that invention". `05` section 5 states them now, and
# planning/F2/08-repair-names-prose-b.md lists all eight with the transfer each is derived
# from. These are those eight and no others: a member not on that list is a member the
# chapter did not state, which is the thing both refusals were protecting against.
#
# `ConstraintSet.boundary_kind` was `values.schema.json#/$defs/string`, so `boundary_kind:
# "whatever"` validated on the record whose entire subject is WHICH BOUNDARY WAS CROSSED --
# and a constraint set is what says what may not be done with what was handed over. The set
# is CLOSED and a transfer outside it is REFUSED, never defaulted, so the schema must carry
# no `default` beside the enum: a default turns every unrecognised transfer into a silently
# admitted one of the eight, which is worse than the free string it replaces because it reads
# as a constrained field. That absence is asserted below rather than assumed.
BOUNDARY_KINDS = ["delegation", "machine_handoff", "consultation_return", "continuation",
                  "acceptance_submission", "founder_brief", "custody_transfer", "stage_import"]
_cs_bk = SCHEMAS["records.schema.json"]["$defs"]["ConstraintSet"]["properties"]["payload"]["properties"]["boundary_kind"]
checked(set(_cs_bk.get("enum") or []) == set(BOUNDARY_KINDS),
        ("A BOUNDARY KIND OUTSIDE THE EIGHT `05` section 5 STATES IS WRITABLE, or one of the "
         "eight is not: the set is closed and a transfer whose kind is not a member is refused "
         "at the boundary. Before this repair the field was a free string, so a constraint set "
         "could name a boundary nothing in the specification describes and still validate "
         "(F6X-02)",
         {"declared": sorted(_cs_bk.get("enum") or []), "the eight": sorted(BOUNDARY_KINDS),
          "stated by": "05-work-agents-skills.md section 5; derivations in "
                        "planning/F2/08-repair-names-prose-b.md"}))
checked("default" not in _cs_bk,
        ("THE CLOSED BOUNDARY-KIND SET HAS A DEFAULT, which is the one way to reopen it "
         "without adding a member: a default admits every unrecognised transfer as one of the "
         "eight instead of refusing it, and does so on a field that now READS as constrained. "
         "`05` section 5 says refused, never defaulted (F6X-02)", _cs_bk))
_cs_reg = RECORDS["ConstraintSet"]["fields"]["payload"]["fields"]["boundary_kind"]["type"]
checked(_cs_reg.startswith("Enum<"),
        ("THE REGISTRY STILL DECLARES `boundary_kind` AS A FREE STRING while the schema closes "
         "it: two declarations of one field, one of which admits anything. The member-by-member "
         "comparison below only runs on fields the REGISTRY declares as an enum, so a registry "
         "left as `string` does not fail that walk -- it leaves it (F6X-02)", _cs_reg))
#
# And the second limb. `04` DELTA 1 asks an operator projection to carry "what was omitted AND
# WHAT WAS CONTESTED"; `omission_manifest_ref` carried the first limb and nothing carried the
# second. `contested_refs` is REQUIRED and not optional, and that is the whole of the design:
# an EMPTY ARRAY states that nothing was contested, and an ABSENT FIELD states that nobody
# looked. Optional collapses those two into one absence, and the operator reading the
# projection -- who is the person this record exists for -- cannot tell them apart. Asserted in
# BOTH declarations, because F6A-10 is the finding about a field that is right in one of them.
_op_schema = SCHEMAS["records.schema.json"]["$defs"]["OperatorProjection"]["properties"]["payload"]
_op_reg = RECORDS["OperatorProjection"]["fields"]["payload"]
_op_reg_required = set(_op_reg.get("required_fields") or []) | {
    _f for _f, _b in (_op_reg.get("fields") or {}).items() if _b.get("required")}
checked("contested_refs" in (_op_schema.get("required") or [])
        and "contested_refs" in _op_reg_required,
        ("`contested_refs` IS OPTIONAL ON AN OPERATOR PROJECTION, so `nothing was contested` "
         "and `nobody looked` are the same absence. `04` DELTA 1 asks for what was omitted AND "
         "what was contested; the empty array is the answer to the first question and the "
         "missing field is the answer to no question at all (F6X-02)",
         {"schema required": "contested_refs" in (_op_schema.get("required") or []),
          "registry required": "contested_refs" in _op_reg_required}))
_cr = _op_schema["properties"].get("contested_refs", {})
checked(_cr.get("type") == "array" and "record_type" in ((_cr.get("items") or {}).get("properties") or {}),
        ("`contested_refs` IS NOT A LIST OF RECORD REFERENCES: the field names WHICH refs were "
         "contested, so an untyped or scalar declaration answers `how many` and not `which` "
         "(F6X-02)", {"declared": _cr}))
# --- F6A-10: A CLOSED ENUM IS DECLARED TWICE, AND THE TWO DECLARATIONS ARE COMPARED. ---
#
# The rule above compares the registry's payload to the schema's as SETS OF FIELD NAMES,
# and says nothing about a field's admissible VALUES. F6A-10 walked through that gap.
# `05-work-agents-skills.md` section 7 (R-X06) and `11-schemas-state-contracts.md` both
# instruct the ordered custody resolver to skip the admitting identity "recording
# `custody_tie_break_reason = admitter_excluded`" -- and BOTH declarations of that enum,
# record-registry.json's `Enum<...>` and records.schema.json's closed `enum`, held four
# values, none of them that one. `edge.ResponsibilityAssignment.proposed.accepted.v1`
# already compares the enum, so the chapters instructed an author to write a record the
# guard rejects. A full run said nothing, because nothing read an enum's members.
#
# FIFTY-SEVEN payload fields carry a closed enum and the pairs agreed on every one of them
# before this check existed -- which is the argument for the check rather than against it:
# the invariant was true and unguarded, so the first drift would have been silent, and one
# of the 57 had already drifted from the CHAPTERS in the direction no field comparison can
# see.
#
# Compared as SETS, not as sequences. An enum's members are a set; `in` does not read
# order, and no predicate in the registry does. A byte-comparison would refuse a
# reordering that changes no admissible value, and a control that refuses harmless edits
# is a control contributors learn to route around --
# fixtures/positive/r20-custody-tie-break-enum-reordered-benign reorders one and MUST
# pass, fixtures/negative/r20-custody-tie-break-enum-omits-the-admitter-exclusion removes
# a member and must be refused.
ENUM_PAIRS = 0
for name, record in RECORDS.items():
    schema_payload = SCHEMAS["records.schema.json"]["$defs"][name]["properties"].get("payload", {})
    if "properties" not in schema_payload:
        continue
    payload = record["fields"]["payload"]
    declared_types = dict(payload.get("type_fields") or {})
    for field, body in (payload.get("fields") or {}).items():
        declared_types[field] = body["type"]
    for field, declared_type in declared_types.items():
        text = declared_type[:-1] if str(declared_type).endswith("?") else str(declared_type)
        if not (text.startswith("Enum<") and text.endswith(">")):
            continue
        ENUM_PAIRS += 1
        members = {value.strip() for value in text[len("Enum<"):-1].split(",")}
        subschema = schema_payload["properties"].get(field, {})
        schema_members = subschema.get("enum")
        checked(isinstance(schema_members, list) and set(schema_members) == members,
                ("REGISTRY AND SCHEMA DISAGREE ABOUT A CLOSED ENUM'S MEMBERS: the payload "
                 "rule above compares FIELD NAMES and is satisfied by two declarations of "
                 "one field that admit different values. That is how F6A-10 happened -- "
                 "the chapters instructed `custody_tie_break_reason = admitter_excluded` "
                 "and neither declaration admitted it, so the instruction produced a "
                 "record the edge guard rejects and nothing compared the members (F6A-10)",
                 name, field,
                 {"registry": sorted(members),
                  "schema": sorted(schema_members) if isinstance(schema_members, list)
                            else schema_members,
                  "in registry only": sorted(members - set(schema_members or [])),
                  "in schema only": sorted(set(schema_members or []) - members),
                  "note": "an enum is declared in record-registry.json AND in "
                          "records.schema.json; a value admitted by one and not the other "
                          "is a rule with two answers. Edit both."}))
# A floor under the walk, for the reason every floor here is a literal: a comparison that
# met no enum passes exactly as loudly as one that met all of them, and the loop above is
# guarded by two `continue`s that a narrowing edit could widen into a skip of everything.
checked(ENUM_PAIRS >= 57,
        ("THE CLOSED-ENUM COMPARISON MET ALMOST NO ENUMS: 57 payload fields declare one, "
         "and a walk that reached none of them reports a pass over an empty required set "
         "(F6A-10)", {"pairs": ENUM_PAIRS, "floor": 57}))
# And the member this finding is about, by NAME, against a hand-written literal. The walk
# above proves the two declarations AGREE; it cannot prove they agree with the chapters.
# Both declarations losing `admitter_excluded` in one edit is exactly the shape the pin
# floors exist to catch elsewhere: one hand writes both and the pair agrees with itself.
CUSTODY_TIE_BREAK_REASONS = {"narrowest_sufficient_scope", "alternate_available",
                             "earliest_acceptance", "no_overlap", "admitter_excluded"}
checked(set(SCHEMAS["records.schema.json"]["$defs"]["ResponsibilityAssignment"]["properties"]
            ["payload"]["properties"]["custody_tie_break_reason"]["enum"])
        == CUSTODY_TIE_BREAK_REASONS,
        ("THE ORDERED CUSTODY RESOLVER CANNOT RECORD A REASON THE CHAPTERS INSTRUCT: "
         "`05` section 7 (R-X06) and `11-schemas-state-contracts.md` name the reasons this "
         "enum must admit, and `admitter_excluded` -- the one recorded when the resolver "
         "skips the admitting identity and continues to the next tier -- is the one that "
         "was missing from both declarations (F6A-10). `guard.custody.admitter_excluded` "
         "enforces the BEHAVIOUR; this enum is what lets the record say so",
         {"declared": sorted(SCHEMAS["records.schema.json"]["$defs"]["ResponsibilityAssignment"]
                             ["properties"]["payload"]["properties"]
                             ["custody_tie_break_reason"]["enum"]),
          "required": sorted(CUSTODY_TIE_BREAK_REASONS)}))

# time-window-declares-two-utc-bounds
time_window = SCHEMAS["values.schema.json"]["$defs"]["TimeWindow"]["properties"]
for bound in ("starts_at", "ends_at"):
    checked(time_window[bound].get("$ref", "").endswith("/UTC"), ("TimeWindow bound", bound))

# command-result-accepted-requires-receipt
command_result = SCHEMAS["values.schema.json"]["$defs"]["CommandResult"]
checked("durability_receipt_ref" in json.dumps(command_result),
        "CommandResult must be able to carry an independent durability receipt")

# control-contracts.json binds through the control_contract primitive.
def ops_in(body, found):
    if isinstance(body, dict):
        if "op" in body:
            found.add(body["op"])
        for value in body.values():
            ops_in(value, found)
    elif isinstance(body, list):
        for value in body:
            ops_in(value, found)
    return found
control_users = set()
for name, record in RECORDS.items():
    for edge in record["lifecycle"]["transitions"]:
        if "control_contract" in ops_in(PREDICATES[edge["predicate_id"]]["body"], set()):
            control_users.add(name)
checked(control_users == set(CONTROLS),
        ("control-contracts.json must name exactly the records whose guards invoke it",
         sorted(control_users ^ set(CONTROLS))))
for name, clauses in CONTROLS.items():
    checked(bool(clauses) and all(isinstance(c, str) and c.strip() for c in clauses),
            ("empty control contract", name))

# endpoints.json binds: every named request/response resolves, every owner exists.
components = {record["owner_component"] for record in RECORDS.values()}
for endpoint in ENDPOINTS:
    checked(endpoint["owner"] in components, ("endpoint owner component", endpoint["path"]))
    for role in ("request", "response"):
        named = endpoint[role]
        target = named[4:-1] if named.startswith("Ref<") and named.endswith(">") else named
        checked(target == "Record" or any(target in schema["$defs"] for schema in SCHEMAS.values()),
                ("endpoint names an undefined type", endpoint["path"], role, named))
# The AST has no opaque eval/code/prompt escape. World-facing primitives have typed named contracts.
call_graph = {name: set() for name in PREDICATES}

def ref_target(declared):
    """Record type named by a Ref<X>, Ref<X>[] or Ref<X>? argument declaration."""
    if not isinstance(declared, str):
        return None
    base = declared[:-1] if declared.endswith("?") else declared
    base = base[:-2] if base.endswith("[]") else base
    return base[4:-1] if base.startswith("Ref<") and base.endswith(">") else None

def admitted_record_types(schema):
    """The record_type enum a primitive parameter admits, or None if it constrains none."""
    if schema.get("type") == "array":
        schema = schema.get("items", {})
    return schema.get("properties", {}).get("record_type", {}).get("enum")

def ast_check(node, env, predicate_name):
    if isinstance(node, list):
        for item in node:
            ast_check(item, env, predicate_name)
        return
    if not isinstance(node, dict):
        return
    if "arg" in node:
        checked(set(node) == {"arg"}, ("arg node shape", node))
        checked(node["arg"] in env, ("unbound predicate arg", predicate_name, node))
        return
    if "context" in node:
        checked(set(node) == {"context"}, ("context node shape", node))
        checked(node["context"] in SCHEMAS["values.schema.json"]["$defs"]["TrustContext"]["properties"],
                ("unknown trusted input", predicate_name, node))
        return
    if "op" in node:
        operator = node["op"]
        checked(operator in PRIMITIVES, ("undefined operator", predicate_name, operator))
        checked(set(node) == {"op", *PRIMITIVES[operator]["args"]}, ("operator args", predicate_name, node))
        if operator == "call":
            target = node["predicate_id"]
            checked(target in PREDICATES, ("undefined predicate call", target))
            checked(set(node["arguments"]) == set(PREDICATES[target]["argument_types"]),
                    ("predicate call args", target))
            call_graph[predicate_name].add(target)
        # CCR-03: a primitive's record_type enum is enforcement, not documentation.
        # Before this, judgment_matches(subject_ref = Ref<LifecycleStatus>) validated --
        # a status accepted by a judgment about that status -- because nothing ever
        # compared an argument's declared type against the enum the primitive names.
        parameter_schemas = PRIMITIVES[operator].get("argument_schema", {}).get("properties", {})
        for parameter, value in node.items():
            if parameter == "op" or parameter not in parameter_schemas:
                continue
            if not (isinstance(value, dict) and set(value) == {"arg"}):
                continue
            wanted = admitted_record_types(parameter_schemas[parameter])
            declared = PREDICATES[predicate_name]["argument_types"].get(value["arg"])
            if wanted is None or ref_target(declared) is None:
                continue
            # Compare enum to enum, so a generic Ref<Record> argument is checked by
            # what its own argument_schema admits rather than by the word "Record".
            offered = admitted_record_types(
                PREDICATES[predicate_name]["argument_schema"]["properties"][value["arg"]])
            checked(offered is not None and set(offered) <= set(wanted),
                    ("primitive argument record type", predicate_name, operator, parameter,
                     sorted(set(offered or []) - set(wanted))))
        for key, value in node.items():
            if key not in ("op", "predicate_id"):
                ast_check(value, env, predicate_name)
        return
    for item in node.values():
        ast_check(item, env, predicate_name)
for name, predicate in PREDICATES.items():
    checked(predicate["version"] == "1.0", ("predicate version", name))
    ast_check(predicate["body"], set(predicate["argument_types"]), name)
visiting, done = set(), set()
def visit(name):
    checked(name not in visiting, ("recursive predicate call", name))
    if name in done:
        return
    visiting.add(name)
    for child in call_graph[name]:
        visit(child)
    visiting.remove(name)
    done.add(name)
for name in call_graph:
    visit(name)

def transitively_read(predicate_name, seen=frozenset()):
    """Argument names a predicate actually reads, following calls into callees."""
    if predicate_name in seen:
        return set()
    seen = seen | {predicate_name}
    body = PREDICATES[predicate_name]["body"]
    def arg_names(node):
        found = set()
        for item in walk(node):
            if isinstance(item, dict) and set(item) == {"arg"}:
                found.add(item["arg"])
        return found
    found = arg_names(body)
    for node in walk(body):
        if isinstance(node, dict) and node.get("op") == "call":
            inner = transitively_read(node["predicate_id"], seen)
            for parameter, passed in node["arguments"].items():
                if parameter in inner:
                    found |= arg_names(passed)
    return found
# Source field inventory must be unique and cover every source question catalog record field.
source_fields = FILES["source-field-mappings.json"]["mappings"]
checked(len({x["source"] for x in source_fields}) == len(source_fields), "unique source field mapping")
for mapping in source_fields:
    checked(mapping["canonical_record"] in RECORDS, ("mapped canonical record", mapping))
    # CCR-05: truthiness is not resolution. A destination naming a field that does
    # not exist, or carrying a whole sentence, passed `bool(...)` exactly as a real
    # one did. The grammar has one implementation, in tools/destination_paths.py.
    # Prose first, because a sentence and a typo both fail resolution and only one
    # of them has an obvious remedy; the message should say which.
    checked(" " not in mapping["destination"],
            ("destination carries prose; put it in `note`", mapping["source"],
             mapping["destination"]))
    unresolved = destination_paths.resolve(SCHEMAS, mapping["canonical_record"],
                                           mapping["destination"])
    checked(unresolved is None,
            ("unresolvable destination", mapping["source"], mapping["destination"], unresolved))

# Schema shape cases, positive AND negative. These read values.schema.json, so an
# edit to it moves them -- unlike the synthetic domain models deleted below.
U1 = "01800000-0000-7000-8000-000000000001"
def ref(kind, revision="1", rid=U1):
    return {"record_id": rid, "record_type": kind, "revision": revision}
for valid in ("0", "1", "18446744073709551615"):
    shape_case("values.schema.json", "UInt64", valid, True)
for invalid in ("01", "-1", 1, "1.0"):
    shape_case("values.schema.json", "UInt64", invalid, False)
shape_case("values.schema.json", "Money", {"currency":"USD","minor_units":"0","exponent":2}, True)
shape_case("values.schema.json", "Money", {"currency":"USD","minor_units":"0"}, False)
shape_case("values.schema.json", "Money", {"currency":"USD","minor_units":"-0","exponent":2}, False)
shape_case("values.schema.json", "UTC", "2026-09-12T12:00:00Z", True)
shape_case("values.schema.json", "UTC", "2026-09-12T14:00:00+02:00", False)
shape_case("values.schema.json", "UTC", "2026-02-31T12:00:00Z", False)
shape_case("values.schema.json", "RecoveryFrontier", ref("RecoveryFrontier"), False)
shape_case("values.schema.json", "StageRef", ref("ArtifactVersion"), False)
shape_case("values.schema.json", "BudgetBinding", ref("Budget"), False)
shape_case("values.schema.json", "MoneyKnowledge", {"knowledge":"unknown","reason":"no receipts yet","evidence_refs":[],"responsible_assignment":ref("ResponsibilityAssignment")}, True)
shape_case("values.schema.json", "MoneyKnowledge", {"knowledge":"unknown","reason":"unobserved","amount":{"currency":"USD","minor_units":"0","exponent":2},"evidence_refs":[],"responsible_assignment":ref("ResponsibilityAssignment")}, False)
shape_case("values.schema.json", "CommandResult", {"command_id":U1,"outcome":"accepted","result_refs":[],"event_ids":[],"reason_codes":[],"retry":"never","status_url":"/v1/commands/x","obligation_refs":[]}, True)
# --- FI-11 and FI-12, read off the registries. -------------------------------
#
# What stood here was an author-written 33-line `FocalStore`, plus synthetic models
# of launch readiness, pre-sale capacity, pricing, recovery freshness and deletion.
# F-canonical-01 measured what they cost: they read ZERO bytes of any registry, so
# not one of them could fail for any edit to the contracts. A validator's evidence
# block that cannot respond to the artifact is decoration.
#
# Every check below reads the committed registries instead. The FI-12 design they
# enforce is the accepted one: `mutates: "LifecycleStatus only; exact immutable
# business subject retained"`, with LifecycleStatus carrying no lifecycle of itself.

checked(RECORDS["LifecycleStatus"]["lifecycle"]["intrinsic"] is True,
        "FI-12: LifecycleStatus is intrinsic")
checked(RECORDS["LifecycleStatus"]["lifecycle"]["transitions"] == [],
        "FI-12: LifecycleStatus has no lifecycle of its own")

ACCEPTED_MUTATES = "LifecycleStatus only; exact immutable business subject retained"
for name, record in RECORDS.items():
    for edge in record["lifecycle"]["transitions"]:
        if not record["lifecycle"]["projection"]:
            checked(edge["mutates"] == ACCEPTED_MUTATES, ("FI-12 mutates shape", edge["edge_id"]))
        guard = PREDICATES[edge["predicate_id"]]
        nodes = [n for n in walk(guard["body"]) if isinstance(n, dict) and "op" in n]
        ops = {n["op"] for n in nodes}
        # The judged business bytes do not move when the status does.
        checked("subject_unchanged" in ops, ("FI-12: guard omits subject_unchanged", edge["edge_id"]))
        # The guard must restate THIS transition, not some other one. The restatement
        # is tautological -- F-canonical-01 said so and was right -- but an unchecked
        # tautology is worse than a checked one: it can be wrong and nothing notices.
        status_edges = [n for n in nodes if n["op"] == "status_edge"]
        checked(len(status_edges) == 1, ("FI-12: one status_edge per guard", edge["edge_id"]))
        checked(status_edges[0]["from_state"] == edge["from"]
                and status_edges[0]["to_state"] == edge["to"],
                ("FI-12: guard states a different transition than its edge", edge["edge_id"]))
        # FI-11 / CCR-01: the edge evaluates its own criterion, passing exactly the
        # arguments that criterion declares.
        calls = [n for n in nodes if n["op"] == "call"]
        checked(any(n["predicate_id"] == edge["criterion_id"] for n in calls),
                ("FI-11: edge does not call its criterion_id", edge["edge_id"]))
        # FI-11: no argument is declared and left unread, transitively.
        checked(set(guard["argument_types"]) == transitively_read(edge["predicate_id"]),
                ("FI-11: declared arguments that nothing reads", edge["edge_id"],
                 sorted(set(guard["argument_types"]) - transitively_read(edge["predicate_id"]))))

# FI-12: a criterion's acceptance and attestation bind to THAT criterion by id and
# version. A judgment accepted for one criterion cannot license another transition.
for name, predicate in PREDICATES.items():
    if not name.startswith("criterion."):
        continue
    for node in walk(predicate["body"]):
        if isinstance(node, dict) and node.get("op") in ("accepted_for", "attested_result"):
            checked(node["predicate_id"] == name,
                    ("FI-12: criterion evidence names another predicate", name, node["predicate_id"]))

# --- FI-11 CONTENT: every criterion states a sourced requirement, or a visible gap.
#
# The canonical repair closed FI-11's mechanism and left its content open: for 167 of
# 173 records the corpus stated no per-phase evidence requirement, so two criteria of
# one record differed only in the criterion a judgment had to name. The content is
# authored in tools/phase_content.py. These checks are what stop it drifting back:
#
#   a criterion either carries `derived_from` -- citations that RESOLVE to files in
#   this tree -- or it carries `content_unspecified` with a gap_id registered in
#   phase-content-gaps.json. It cannot carry both, and it cannot carry neither. An
#   unsourced body is the failure mode this package exists to refuse, and "plausible"
#   is indistinguishable from "derived" once it is written down.
_CITED_TEXT = {}


def _cited_text(relative_path):
    if relative_path not in _CITED_TEXT:
        _CITED_TEXT[relative_path] = (ROOT.parent / relative_path).read_text(
            encoding="utf-8")
    return _CITED_TEXT[relative_path]


GAPS = FILES["phase-content-gaps.json"]
gap_ids = [entry["gap_id"] for entry in GAPS["gaps"]]
checked(len(gap_ids) == len(set(gap_ids)), ("duplicate gap_id", sorted(gap_ids)))
registered_gaps, claimed_gaps = set(gap_ids), set()
content_criteria = unspecified_criteria = 0
for name, predicate in PREDICATES.items():
    if not name.startswith("criterion."):
        continue
    marks = [node for node in walk(predicate["body"])
             if isinstance(node, dict) and node.get("op") == "content_unspecified"]
    if marks:
        unspecified_criteria += 1
        checked(len(marks) == 1, ("one content_unspecified per criterion", name))
        gap_id = marks[0]["gap_id"]
        checked(gap_id in registered_gaps,
                ("content_unspecified with no registered gap", name, gap_id))
        checked(predicate.get("content_gap_id") == gap_id,
                ("criterion gap_id disagrees with its body", name))
        checked("derived_from" not in predicate,
                ("a gap cannot also cite a source for content it does not state", name))
        claimed_gaps.add(gap_id)
        continue
    content_criteria += 1
    citations = predicate.get("derived_from")
    checked(isinstance(citations, list) and citations,
            ("criterion states content with no derived_from", name))
    for citation in citations:
        checked(set(citation) == {"file", "anchor_or_quote"},
                ("citation shape", name, citation))
        checked(isinstance(citation["anchor_or_quote"], str)
                and citation["anchor_or_quote"].strip(),
                ("empty citation", name))
        checked((ROOT.parent / citation["file"]).exists(),
                ("derived_from names a file that does not exist", name,
                 citation["file"]))
        # And the half that makes a citation more than a filename: the quoted text
        # must actually BE in the file it names. Rule 3 is enforced for repo paths
        # elsewhere in this repository and was not enforced here -- a criterion could
        # cite any sentence at all, and a quote that has drifted from its source reads
        # exactly like one that has not. `...` marks an elision; each side of it is
        # checked separately. An ANCHOR -- `#/pointer` -- is resolved instead, as an
        # RFC6901 pointer into the cited JSON, so the entries taken from
        # `capabilities.json#/domain_validators` are held to the same standard as the
        # quoted ones rather than exempted for being short.
        anchor = citation["anchor_or_quote"]
        if anchor.startswith("#/"):
            checked(citation["file"].endswith(".json"),
                    ("anchor citation into a non-JSON file", name, citation["file"]))
            target = json.loads(_cited_text(citation["file"]))
            for key in anchor[2:].split("/"):
                key = key.replace("~1", "/").replace("~0", "~")
                checked(isinstance(target, dict) and key in target,
                        ("derived_from anchor does not resolve", name, anchor, key))
                target = target[key]
            continue
        for segment in filter(None, (part.strip() for part in anchor.split("..."))):
            checked(segment in _cited_text(citation["file"]),
                    ("derived_from quotes text that is not in the file it cites",
                     name, citation["file"], segment[:120]))
    checked(isinstance(predicate.get("requires"), str) and predicate["requires"].strip(),
            ("criterion states content with no `requires` sentence", name))
# The converse: a gap registered for a criterion that does not carry it would let the
# count of open work drift upward with nothing behind it.
checked(claimed_gaps == registered_gaps,
        ("gaps registered for no criterion", sorted(registered_gaps - claimed_gaps)))
for entry in GAPS["gaps"]:
    checked(entry["criterion_id"] in PREDICATES,
            ("gap names a predicate that does not exist", entry["gap_id"]))
    checked(entry["what_the_prose_would_need_to_say"].strip(),
            ("gap with no statement of what is missing", entry["gap_id"]))

# And the predicate FI-11 actually asserts: two edges leaving ONE state of ONE record
# must not have the same effective guard SHAPE. Where they still do, the pair is
# declared in phase-content-gaps.json with a reason -- and the declaration is checked
# in BOTH directions, so a residual cannot be added silently and one cannot be removed
# from the file while it is still live. Shape is computed by tools/skeletons.py, the
# same implementation tools/guard_distinctness.py measures with.
import skeletons  # noqa: E402
residual = {(group["record"], group["from_state"], tuple(sorted(group["to_phases"])))
            for group in skeletons.sibling_collisions(RECORDS, PREDICATES,
                                                      skeletons.erase_all_strings)}
declared_residual = {(entry["record"], entry["from_state"],
                      tuple(sorted(entry["to_phases"])))
                     for entry in GAPS["residual_sibling_collisions"]}
checked(residual == declared_residual,
        ("sibling guards share a shape that phase-content-gaps.json does not declare",
         sorted(residual - declared_residual),
         "or declares one that does not collide",
         sorted(declared_residual - residual)))
for entry in GAPS["residual_sibling_collisions"]:
    checked(entry["why"].strip(), ("residual collision with no reason", entry))

# FI-12 constraint 6 / CCR-02: the acceptance chain terminates at a recorded human
# root in finitely many steps. One implementation, in tools/acceptance_chain.py.
acceptance_chain.RECORDS = RECORDS
acceptance_chain.PREDICATES = PREDICATES
grounded, chain_state = acceptance_chain.walk()
checked(grounded, ("FI-12: mandate acceptance chain does not terminate at a bootstrap root",
                   sorted(n for n, v in chain_state.items() if v != "grounded")))
checked(any("bootstrap_roots" in json.dumps(p["body"]) for p in PREDICATES.values()),
        "FI-12: bootstrap_roots is invoked by at least one predicate")

# GroupBody may name its predecessor, never its own future proof. Read off the
# schema rather than off a helper written three lines above the assertion.
group_body = SCHEMAS["values.schema.json"]["$defs"]["GroupBody"].get("properties", {})
for forbidden_field in ("transaction_hash", "committed_position", "durability_receipt_ref",
                        "signature"):
    checked(forbidden_field not in group_body, ("GroupBody carries its own proof", forbidden_field))

try:
    json.loads('{"same":1,"same":2}',object_pairs_hook=unique_object)
    checked(False,"duplicate keys must be rejected")
except ValueError:
    checked(True,"duplicate keys rejected before canonicalization")
checked(Decimal("0.1")+Decimal("0.2")==Decimal("0.3"),"exact decimal resource arithmetic")

# --- The two oracles that can fail on CONTENT rather than on shape. ------------
#
# Both are run as subprocesses with THIS directory passed explicitly, because `tools/` is
# a symlink inside every fixture scratch tree and a module that resolved its own root
# would check the committed registries while claiming to check the mutation in front of
# it. The ratchet runs BEFORE the drift check on purpose: a fixture that adds a declared
# collision drifts the gaps file too, and the message a reader gets should name the
# control that is actually doing the refusing.
import subprocess  # noqa: E402
for oracle_argv, oracle_name in (
    ([sys.executable, str(ROOT / "tools" / "guard_distinctness.py"), str(ROOT)],
     "guard distinctness ratchet"),
    ([sys.executable, str(ROOT / "tools" / "author_phase_content.py"), "--check", str(ROOT)],
     "criterion content drifts from its derivation"),
):
    oracle = subprocess.run(oracle_argv, capture_output=True, text=True)
    checked(oracle.returncode == 0,
            (oracle_name, oracle.stdout[-2500:] + oracle.stderr[-2500:]))

# ORDER MATTERS, and it was measured rather than reasoned about. These checks sit
# AFTER the two oracles on purpose: a HAND edit of a criterion drifts from the
# derivation and the drift oracle is the check that should name it, while a
# WEAKENED derivation regenerates cleanly and only these pins can. Placed before the
# oracles, the pins fired first and three fixtures that exist to prove the drift
# oracle still works -- r10-criterion-field-paths-erased, -repointed, and
# -demands-less-than-its-predecessor -- were rejected for the wrong reason, which the
# runner reports as a leak. It found this; reading the file did not.
# --- PINNED CONJUNCTS: what a Phase G finding requires the registry to SAY. ----
#
# RC-02, and it is the reason this block reads a JSON file rather than carrying its own
# literal table. Criterion CONTENT has an oracle below -- `author_phase_content.py --check`
# -- and that oracle compares predicate-registry.json to tools/phase_content.py. A HAND
# edit of a criterion is therefore a failing build, and a DERIVATION edit is invisible:
# the recheck replaced one spec in phase_content.py, regenerated, and put the entire G2-01
# defect back at exit 0 with 27 of 27 negative fixtures still rejecting. A checker that
# compares an artifact to a source the same author controls is not a checker.
#
# pinned-conjuncts.json is written by hand, is generated by nothing, and is read by
# nothing that writes the registry. These checks compare the LIVE predicate registry to it
# directly. Structural containment only -- a body may say more than is pinned, never less.
#
# This block also absorbs what was REQUIRED_GUARD_OPS, a literal dict of the same kind of
# assertion about edge guards, so there is ONE pinned table rather than two that drift.
# Its four generated SalesAgreement pairs missed the fifth closure edge,
# `terminated_with_residuals -> terminated`; the nine are listed one by one in the file.
PINNED = FILES["pinned-conjuncts.json"]
PIN_VALUE_KEYS = ("result", "right", "event_kind", "target_state", "pointer")
PIN_ROW_KEYS = {"op", "why", "negated", "disjoined", "disjoined_why",
                "field_paths_include", "bindings", "contains_pointers", *PIN_VALUE_KEYS}
PIN_KEYS = {"predicate_id", "kind", "findings", "decisions", "why", "require"}
PIN_BINDING_KEYS = {"field_path", "states_exactly", "optional"}


# --- WHERE A CONJUNCT IS DEMANDED. The table is DERIVED; the unrecognised is REFUSED. ---
#
# RC3-01 and RC3-02 are one defect with two faces, and the face is not the operator name.
# This walker used to decide whether a position DEMANDS its conjunct by matching three
# hard-coded names -- `all`, `any`, `not` -- and to descend into every other key of every
# node regardless of what that key is for. Two consequences, both measured at exit 0 with
# pinned-conjuncts.json and the `requires` prose untouched:
#
#   RC3-01  The three pinned conjuncts of criterion.SalesAgreement.performed.v1, moved
#           verbatim inside `forall(items=path(/payload/obligation_refs), bind, ...)`,
#           each reported negated=False disjoined=False -- DEMANDED -- by a walker that
#           had never heard of `forall`. records.schema.json declares `obligation_refs`
#           an array with no `minItems`, so `[]` is schema-valid and the quantifier is
#           vacuous: the sale reaches `performed` naming no Fulfillment, with nothing
#           `delivered` and no Obligation discharged. G2-01's counterexample, restored,
#           at 269,708 checks with 33 of 33 negative fixtures still rejecting.
#   RC3-02  The same conjuncts buried in `present`'s `value` -- a `JsonValue` slot, not a
#           predicate position at all -- were also reported DEMANDED, because the walk
#           visited every dict value it could reach.
#
# So the demanding positions are read off primitive-registry.json at check time and the
# table is CLOSED: an operator it does not declare, or a slot of a declared operator it
# does not classify, fails this file naming both rather than being walked as if it were
# `all`. That is the rule this file already applies to operator nodes -- `set(node) ==
# {"op", *args}` -- and to pin row keys -- "Declare what is read and REFUSE the rest".
# The walker was the one place that did not, and a hard-coded triple is how the FOURTH
# boolean-child primitive got through. The fifth cannot.
#
# `argument_positions` in primitive-registry.json is the declaration. Five roles:
#
#   value       NOT a predicate position. A conjunct here is not evaluated as a conjunct
#               of the body, so a pinned op found here is NOT PRESENT (RC3-02) rather
#               than demanded. Value content underneath is still read -- a `path` pointer
#               inside a demanded `eq` is demanded -- which is why the walk continues
#               into it and marks what it finds.
#   demanded    `all`: the child's truth is the parent's.
#   disjoined   `any`: contained, not demanded. A pin row may opt in (`disjoined: true`).
#   negated     `not`: demanded, with polarity flipped.
#   quantified  `forall`: demanded only if something outside the quantifier forces its
#               collection to be non-empty, and nothing in this corpus does. Treated as
#               NON-DEMANDING unconditionally -- the conservative reading, and it costs
#               nothing today: zero `forall` nodes exist (guard_distinctness.py lists it
#               under `primitives_used_by_no_predicate`). No pinned row needs an opt-in
#               either: measured, 0 of 44 rows match under a quantifier, so no
#               `quantified: true` key exists to be set by mistake.
DEMAND_ROLES = {"demanded", "disjoined", "negated", "quantified"}
POSITION_ROLES = DEMAND_ROLES | {"value"}
BOOLEAN_ARGUMENT_TYPES = ("boolean", "boolean[]")
for _name, _primitive in PRIMITIVES.items():
    _positions = _primitive.get("argument_positions")
    checked(isinstance(_positions, dict),
            ("a primitive declares no `argument_positions`, so nothing can say whether a "
             "conjunct written inside it is DEMANDED by the body or merely contained by "
             "it, and this walker refuses to guess (RC3-01)", _name, _primitive["args"]))
    checked(set(_positions) == set(_primitive["args"]),
            ("a primitive's `argument_positions` do not classify exactly its arguments: "
             "an unclassified slot is a place a conjunct can hide", _name,
             sorted(set(_positions) ^ set(_primitive["args"]))))
    for _argument, _role in _positions.items():
        checked(_role in POSITION_ROLES,
                ("a primitive declares an argument position this walker does not know",
                 _name, _argument, _role, sorted(POSITION_ROLES)))
        # The declaration cannot lie about the type it describes, and this cross-check is
        # what makes it a DERIVATION rather than a second hand-kept list. A `boolean`
        # argument is a place a conjunct nests; declaring one `value` would hide exactly
        # the class RC3-01 came from, and declaring a JsonValue slot a predicate position
        # would walk straight into the one RC3-02 came from.
        checked((_primitive["argument_types"][_argument] in BOOLEAN_ARGUMENT_TYPES)
                == (_role in DEMAND_ROLES),
                ("a primitive's argument position contradicts its argument type: every "
                 "`boolean`/`boolean[]` argument is a predicate position with a declared "
                 "demand, and every other argument is `value`",
                 _name, _argument, _primitive["argument_types"][_argument], _role))

from collections import namedtuple  # noqa: E402

# One walked position: the node, and the five facts about its CONTEXT a containment check
# needs. `quantifiers` is a tuple rather than a flag so the message can NAME the quantifier
# and the collection it ranges over -- "inside a forall" sends a reader looking;
# "forall(/payload/obligation_refs)" sends them to the field that admits `[]`.
#
# `ancestors` is RC4-02's field and it is a tuple of OPERATOR NAMES, outermost first: every
# operator this node sits inside through a slot the table calls a predicate position. The
# other four fields say what the TABLE decided about this position; `ancestors` says which
# operators the table was asked about, so a rule may refuse an operator the table approved.
# Value-slot descent stops it growing -- `eq.left` is not a demand-bearing ancestry, and
# four live pin rows reach a `path` through exactly that slot.
Positioned = namedtuple("Positioned",
                        "node negated disjoined quantifiers in_value where ancestors")

# An instrument reports its own coverage. A demand walk that quietly stopped walking would
# leave every pin MISSING, which is loud -- and would leave RC-03's phase rule asserting
# nothing at all, which is silent. Asserted against floors below the RC-03 loop.
WALK_CENSUS = {"predicate_positions": 0, "value_positions": 0, "slots_classified": 0,
               "refused": 0, "under_quantifier": 0, "under_disjunction": 0,
               "under_negation": 0, "operators": set()}


def refuse(condition, detail):
    """A refusal the census counts. `refused` is 0 on any tree this file passes -- the
    point is that it is REPORTED, so a reader can see the closed table did its work
    rather than trusting that it would have."""
    if not condition:
        WALK_CENSUS["refused"] += 1
    checked(condition, detail)


def walk_nodes(value):
    """Every dict anywhere inside a value, in any position. Structural, not semantic."""
    return (n for n in walk(value) if isinstance(n, dict))


def pointers_in(value):
    """Every `path` pointer anywhere inside a node, in ANY position.

    Deliberately not the demand walk. Containment of a POINTER is a question about the
    whole value: a `contains_pointers` row asks whether an `eq` compares the field its
    finding named, and that field read lives in `eq`'s `left` -- a JsonValue slot. Four
    live pin rows depend on reaching into value slots this way, so narrowing THIS to
    predicate positions would break the rows RC3-02's narrowing exists to protect.
    """
    return {n["pointer"] for n in walk_nodes(value)
            if n.get("op") == "path" and isinstance(n.get("pointer"), str)}


def quantifier_note(node, positions):
    """`forall(/payload/obligation_refs)` -- the collection whose emptiness makes the
    quantifier vacuous. Read off the node's VALUE slots only: pointers inside the
    quantified child are what the conjunct reads, not what it ranges over."""
    pointers = sorted({pointer for argument, role in positions.items() if role == "value"
                       for pointer in pointers_in(node[argument])})
    return "%s(%s)" % (node["op"], ", ".join(pointers) or "no literal path")


def polarised_nodes(node, owner, negated=False, disjoined=False, quantifiers=(),
                    in_value=False, where="body", ancestors=()):
    """Every `op` node of a body, with the CONTEXT that decides whether the body's truth
    depends on it: beneath a `not`, beneath a disjunction, beneath a quantifier, or inside
    an argument that is not a predicate position at all.

    Polarity is the half a containment check forgets first. `not(native_correlated
    delivered)` CONTAINS `native_correlated(result: delivered)`, so a pin that only asked
    whether the op appears would accept the inversion of the requirement it exists to hold.
    RC2-02 was that sentence one operator over -- a conjunct disjoined with a trivially
    true alternative -- and RC3-01 was it one operator further, under a `forall` over a
    collection the record schema permits to be empty. Each was found by running a
    mutation, never by reading this function, which is why the operator set is no longer
    written here at all.

    Disjunction is read THROUGH the negation rather than beside it: `not(any(A, B))`
    demands `not A`, and `not(all(A, B))` demands neither, so which role branches depends
    on the parity of the `not`s above it. No node in the committed corpus sits that way --
    2,169 `all` and 13 `any`, none beneath a `not` -- so that half is untested here and is
    written correctly anyway, because a rule that is right by accident stops being right
    silently.

    `in_value` is STICKY. Once the walk enters a JsonValue slot, every predicate position
    below it is a predicate position of something being read as a value, and nothing under
    it is a conjunct of this body (RC3-02). `where` is the enclosing `operator.slot`, so a
    refusal can say `present.value` rather than "somewhere in the body".
    """
    found = []
    if isinstance(node, list):
        for value in node:
            found.extend(polarised_nodes(value, owner, negated, disjoined, quantifiers,
                                         in_value, where, ancestors))
        return found
    if not isinstance(node, dict):
        return found
    if "op" not in node:
        # A container the AST puts between operators: {"arg": ...}, {"context": ...}, a
        # `related_phases` binding, a `call`'s argument map. It carries the context it
        # sits in and creates none of its own.
        for value in node.values():
            found.extend(polarised_nodes(value, owner, negated, disjoined, quantifiers,
                                         in_value, where, ancestors))
        return found
    operator = node["op"]
    # ast_check refuses an undefined operator in any predicate body before this runs, so
    # this refusal is a backstop rather than the live control -- stated plainly, because a
    # comment claiming otherwise is how a control nobody exercises reads as one that works.
    refuse(operator in PRIMITIVES,
           ("a body uses an operator the demand table does not declare, so whether the "
            "conjuncts under it are DEMANDED cannot be decided, and this walker refuses "
            "rather than treating it as `all` (RC3-01)", owner, operator))
    primitive = PRIMITIVES[operator]
    positions = primitive["argument_positions"]
    WALK_CENSUS["operators"].add(operator)
    if in_value:
        WALK_CENSUS["value_positions"] += 1
    else:
        WALK_CENSUS["predicate_positions"] += 1
        # The converse of RC3-02, and free: an independent sweep of all 2,276 predicate
        # bodies found 0 of 12,684 predicate positions holding a value-returning operator
        # (and 0 of 45 value positions holding a boolean one, which is the other
        # direction). A `path` where a conjunct belongs is a body whose truth depends on
        # a JsonValue.
        refuse(primitive["result_type"].startswith("boolean"),
               ("an operator that returns a value sits in a predicate position, where the "
                "body's truth is supposed to depend on it", owner, operator,
                primitive["result_type"]))
    if quantifiers:
        WALK_CENSUS["under_quantifier"] += 1
    if disjoined:
        WALK_CENSUS["under_disjunction"] += 1
    if negated:
        WALK_CENSUS["under_negation"] += 1
    found.append(Positioned(node, negated, disjoined, quantifiers, in_value, where,
                            ancestors))
    for key, value in node.items():
        if key == "op":
            continue
        WALK_CENSUS["slots_classified"] += 1
        role = positions.get(key)
        refuse(role is not None,
               ("an operator node carries a slot the demand table does not classify, so "
                "a conjunct written there would be walked with no declared demand",
                owner, operator, key, sorted(positions)))
        slot = "%s.%s" % (operator, key)
        # RC4-02. The ancestry grows exactly where the table says a conjunct NESTS -- a
        # predicate position of an operator, entered from outside a value slot. That is
        # the ancestry a demand rule is entitled to reason about, and it is the one the
        # admissible-ancestor rule beside the pin loop refuses over. It deliberately does
        # NOT grow through a value slot: `eq.left` holds a field read, not a conjunct, and
        # four live pin rows match a `path` reached that way.
        nested = () if (in_value or role == "value") else (operator,)
        if in_value or role == "value":
            child = (negated, disjoined, quantifiers, True, slot)
        elif role == "negated":
            child = (not negated, disjoined, quantifiers, False, slot)
        elif role == "quantified":
            child = (negated, disjoined,
                     quantifiers + (quantifier_note(node, positions),), False, slot)
        else:
            child = (negated, disjoined or ((role == "disjoined") != negated),
                     quantifiers, False, slot)
        found.extend(polarised_nodes(value, owner, *child, ancestors + nested))
    return found


def pin_row_matches(node, row):
    """SHAPE only: does this node say what the row describes. Whether the body DEMANDS it
    is a question about the node's POSITION, decided once beside the pin loop below rather
    than here -- RC2-02 answered it here, and RC3-01/RC3-02 then needed two more context
    facts that a boolean parameter could not carry without becoming three."""
    if set(row.get("field_paths_include", [])) - set(node.get("field_paths") or []):
        return False
    for wanted in row.get("bindings", []):
        if not any(binding.get("field_path") == wanted["field_path"]
                   and sorted(binding.get("states") or []) == sorted(wanted["states_exactly"])
                   and bool(binding.get("optional")) == bool(wanted["optional"])
                   for binding in node.get("bindings") or []):
            return False
    if set(row.get("contains_pointers", [])) - pointers_in(node):
        return False
    for key in PIN_VALUE_KEYS:
        if key in row and node.get(key) != row[key]:
            return False
    return True


# --- RC4-02: WHICH OPERATORS A PINNED CONJUNCT MAY SIT INSIDE. HAND-WRITTEN. ----
#
# The structural rule, and it is the one sentence to keep: A REGISTRY MAY CLASSIFY
# POSITIONS; ONLY THE PIN MAY SAY WHAT SATISFIES ONE.
#
# RC3-01's repair took the demand definition out of a hard-coded triple here and put it in
# primitive-registry.json. That closed the table against an operator declaring NOTHING and
# opened it to one declaring the WRONG thing, and the fourth recheck measured the price:
# `every_linked_obligation`, registered with `argument_types.predicate: "boolean"` and
# `argument_positions.predicate: "demanded"`, wrapping the three pinned conjuncts of
# criterion.SalesAgreement.performed.v1 -- exit 0, 288,665 checks, 36 of 36 negative
# fixtures still rejecting, over a registry that requires none of AD-013. The walker's own
# sentence, "a hard-coded triple is how the FOURTH boolean-child primitive got through; the
# fifth cannot", was false: the fifth gets through by declaring itself demanding.
#
# So the demand table still decides WHERE a conjunct nests -- that half is derived and must
# stay derived, or an unregistered operator is walked as if it were `all` again -- and this
# hand-written set decides WHICH of those nestings a pin may be satisfied through. The two
# authors are different by construction: tools/author_phase_content.py writes
# primitive-registry.json and can neither read nor write pinned-conjuncts.json.
#
# Membership is by NAME, not by role, and that is the whole point. A rule phrased over
# roles ("any operator whose slot is `demanded`") reads the same file the attack edits.
#
# --- RC5-01: AND THE SET ITSELF IS A CLOSED LITERAL HERE, NOT A JSON BLOCK. -----
#
# The fifth recheck measured the price of leaving it in JSON. ONE hunk -- register
# `every_linked_obligation` with `argument_positions.predicate: "demanded"`, add it to
# `#/admissible_ancestors` with a plausible sentence, re-pin `argument_positions_digest`
# -- put G2-01's counterexample back at exit 0 and 299,409 checks, thirty MORE than the
# baseline, with every pin satisfied. Three edits, one commit, one author, and the whole
# defence was "a reviewer sees the diff". That is the answer this lineage rejected for the
# `disjoined` ceiling, for the pin floors, for the fixture manifests and for the census.
#
# So the live table is the LITERAL BELOW and the JSON block is DOCUMENTATION that must
# agree with it. Widening what may satisfy a pin is now an edit to validate_contracts.py,
# which is the expensive act by construction: the table a pin consults cannot be reached
# by any patch to the data this package derives, registers or hand-writes.
#
# Both directions fail, and that is deliberate: a JSON block that says LESS than the
# literal is as bad as one that says more, because a reader who opens
# pinned-conjuncts.json to learn what may satisfy a pin must not be shown a smaller table
# than the one running. One truth, stated twice, compared.
ADMISSIBLE_LITERAL = {
    "all": {"registry_role": "demanded", "admits": "always"},
    "not": {"registry_role": "negated", "admits": "row_polarity"},
    "any": {"registry_role": "disjoined", "admits": "row_disjoined"},
}
# The walker reads THIS. `PINNED["admissible_ancestors"]` is never consulted for a verdict.
ADMISSIBLE = ADMISSIBLE_LITERAL
ADMISSIBLE_DECLARED = PINNED["admissible_ancestors"]
ADMISSIBLE_KEYS = {"registry_role", "admits", "why"}
# Declare what is read and REFUSE the rest, at the CONDITION rather than at the value: an
# `admits` string this file does not evaluate would be a condition that reads as a
# restriction and restricts nothing, which is the RC4 class one layer up.
ADMITS_CONDITIONS = {"always", "row_polarity", "row_disjoined"}
checked(isinstance(ADMISSIBLE_DECLARED, dict) and ADMISSIBLE_DECLARED,
        "pinned-conjuncts.json declares no `admissible_ancestors`; an empty set would "
        "refuse every pin rather than passing vacuously, but it is still not a table")
checked({_operator: {"registry_role": _entry.get("registry_role"),
                     "admits": _entry.get("admits")}
         for _operator, _entry in ADMISSIBLE_DECLARED.items()} == ADMISSIBLE_LITERAL,
        ("THE ADMISSIBLE-ANCESTOR TABLE IS NOT THE LITERAL IN validate_contracts.py: "
         "`pinned-conjuncts.json#/admissible_ancestors` is the DECLARATION of which "
         "operators a pinned conjunct may be satisfied through, and the walker reads the "
         "literal `ADMISSIBLE_LITERAL` in this file instead -- so an entry added to the "
         "JSON block grants nothing and an entry removed from it hides something that is "
         "still granted. Either way the two disagree and one of them is what a reviewer "
         "reads (RC5-01)",
         {"literal in validate_contracts.py":
             {_operator: _rule["admits"] for _operator, _rule in ADMISSIBLE_LITERAL.items()},
          "declared in pinned-conjuncts.json":
             {_operator: _entry.get("admits")
              for _operator, _entry in ADMISSIBLE_DECLARED.items()},
          "widened by": sorted(set(ADMISSIBLE_DECLARED) - set(ADMISSIBLE_LITERAL)),
          "narrowed by": sorted(set(ADMISSIBLE_LITERAL) - set(ADMISSIBLE_DECLARED)),
          "note": "WIDENING WHAT SATISFIES A PIN IS AN EDIT TO validate_contracts.py. "
                  "Add the operator to ADMISSIBLE_LITERAL with its condition, and to "
                  "pinned-conjuncts.json#/admissible_ancestors with its reason, in one "
                  "commit -- and expect the checker edit to be reviewed as one. Adding it "
                  "to the JSON alone is the RC5-01 hunk and is what this refuses."}))
for _operator, _entry in ADMISSIBLE_DECLARED.items():
    checked(set(_entry) == ADMISSIBLE_KEYS,
            ("admissible ancestor shape", _operator, sorted(set(_entry) ^ ADMISSIBLE_KEYS)))
    checked(_entry["admits"] in ADMITS_CONDITIONS,
            ("an admissible ancestor names a condition this file does not evaluate, so the "
             "restriction it reads as is one nothing applies", _operator, _entry["admits"],
             sorted(ADMITS_CONDITIONS)))
    checked(_entry["why"].strip(), ("an admissible ancestor states no reason", _operator))
for _operator, _rule in ADMISSIBLE_LITERAL.items():
    checked(_rule["admits"] in ADMITS_CONDITIONS,
            ("the literal admits a condition this file does not evaluate", _operator,
             _rule["admits"], sorted(ADMITS_CONDITIONS)))
    checked(_operator in PRIMITIVES,
            ("validate_contracts.py admits an operator the registry does not define",
             _operator))
    # The hand-written name and the derived role must agree about the SAME operator. They
    # are two files with two authors, which is the design; two files with two authors that
    # never meet is how a hand-written table goes stale beside a registry that moved.
    checked(_rule["registry_role"] in set(PRIMITIVES[_operator]["argument_positions"].values()),
            ("an admissible ancestor claims a role primitive-registry.json no longer gives "
             "that operator anywhere, so this table and the demand table describe different "
             "things", _operator, _rule["registry_role"],
             sorted(set(PRIMITIVES[_operator]["argument_positions"].values()))))

# --- RC5-03: THE SIBLING KEY THAT NAMED THE ATTACK AND RESTRICTED NOTHING. ------
#
# `#/admissible_ancestors_not_admitted` names `forall` and "anything else" -- including,
# verbatim, "one registered tomorrow that declares its own `boolean` child `demanded`",
# which is RC4-02 -- and `grep -c not_admitted validate_contracts.py` returned 0. The
# fifth recheck added `forall` to the ADMITTING key while the NOT-admitting key still
# forbade it, at exit 0, with nothing comparing the two. Prose inside a JSON file whose
# whole premise is that prose rots and data does not.
#
# Read, therefore, in the two ways that make it data: nothing is both admitted and not
# admitted, and every name here other than the literal "anything else" is an operator that
# exists. The block is kept rather than deleted because of the third rule below, which is
# what gives it force: the `quantified` escape must be declared here BY NAME.
NOT_ADMITTED = PINNED["admissible_ancestors_not_admitted"]
NOT_ADMITTED_CATCH_ALL = "anything else"
checked(isinstance(NOT_ADMITTED, dict) and NOT_ADMITTED_CATCH_ALL in NOT_ADMITTED,
        ("`admissible_ancestors_not_admitted` must exist and must carry its catch-all row; "
         "a table of named exceptions with no catch-all reads as exhaustive and is not",
         sorted(NOT_ADMITTED) if isinstance(NOT_ADMITTED, dict) else type(NOT_ADMITTED).__name__))
checked(not (set(NOT_ADMITTED) & set(ADMISSIBLE_LITERAL)),
        ("AN OPERATOR IS BOTH ADMITTED AND NOT ADMITTED: `admissible_ancestors_not_admitted` "
         "names an operator `ADMISSIBLE_LITERAL` admits, so pinned-conjuncts.json states "
         "two incompatible things about the same name and a reader is told whichever one "
         "they opened first (RC5-03)",
         {"in both": sorted(set(NOT_ADMITTED) & set(ADMISSIBLE_LITERAL)),
          "admitted": sorted(ADMISSIBLE_LITERAL),
          "note": "if the operator really is admissible, delete its not_admitted row in "
                  "the same commit that adds it to ADMISSIBLE_LITERAL; if it is not, it "
                  "does not belong in the admitting table."}))
for _name, _why in NOT_ADMITTED.items():
    checked(str(_why).strip(), ("a not-admitted operator states no reason", _name))
    checked(_name == NOT_ADMITTED_CATCH_ALL or _name in PRIMITIVES,
            ("`admissible_ancestors_not_admitted` names something that is not a registered "
             "primitive and is not the catch-all row, so it forbids an operator no body "
             "could carry -- a restriction over nothing reads as a restriction (RC5-03)",
             _name, NOT_ADMITTED_CATCH_ALL))


def inadmissible_ancestor(entry, row, boolean_op):
    """The first ancestor operator this row may NOT be satisfied through, or None.

    Deliberately NOT folded into pin_row_matches(): that function is SHAPE only by
    contract -- RC3-01 and RC3-02 moved context out of it precisely because a third
    context fact could not ride along as a boolean parameter, and putting one back would
    undo that. Position is decided beside the pin loop, where the other three position
    questions are decided, and this is the fourth.

    `entry.ancestors` is every operator the node sits inside through a slot the registry
    calls a predicate position, outermost first. An operator absent from ADMISSIBLE is
    refused REGARDLESS of what `argument_positions` says about it -- that is RC4-02 -- and
    an operator present is refused when its declared condition does not hold of this row.

    Which half is the live control, stated rather than implied: MEMBERSHIP is. Both named
    conditions -- `row_polarity` and `row_disjoined` -- are backstops over filters that
    already shaped the set this runs on, so neither can fail on a tree the checks above it
    passed. They are evaluated anyway and they are declared in pinned-conjuncts.json
    anyway, because the alternative is a table whose conditions are prose, and a condition
    nothing evaluates is what RC4 is about.
    """
    for operator in entry.ancestors:
        rule = ADMISSIBLE.get(operator)
        if rule is None:
            return operator
        condition = rule["admits"]
        if condition == "always":
            continue
        if condition == "row_polarity":
            # A backstop over the containment filter, which compared these two before this
            # ran; for a pinned value op polarity is not a question and the filter says so.
            if not boolean_op or entry.negated == bool(row.get("negated", False)):
                continue
            return operator
        if condition == "row_disjoined":
            # `not entry.disjoined` is not slack: `not(any(A, B))` DEMANDS `not A`, so the
            # parity of the `not`s above the `any` decides whether this ancestor disjoins
            # anything, and the walker already computed that into `entry.disjoined`. A rule
            # that read only the row would refuse a conjunct the body genuinely demands.
            if row.get("disjoined", False) or not entry.disjoined:
                continue
            return operator
        # Unreachable while ADMITS_CONDITIONS is enforced above, and it raises rather than
        # falling through to "admissible": a condition nobody evaluates must not read as a
        # permission granted.
        raise AssertionError(("an admissible-ancestor condition reached the walker "
                              "unevaluated", operator, condition))
    return None


# --- RC5-02: WHICH FINDING LOST ITS LAST PIN. NAMED, AND BEFORE ANY COUNT. ------
#
# The floors below are the bulk control and they were the ONLY control over 32 of 57 pins:
# the coverage check reads finding ids out of registers/review-findings.json, its regex
# matched `G#-##` and `RC-##` alone, and every one of those 32 pins cites `AT-M2-03`,
# `AC-M4-05`, `AS-M5-01` and the rest of the F2 selection-record work, which that regex has
# no opinion about. p6a of the fifth recheck deleted all 32 and 72 of 119 require rows:
# exit 0, 297,520 checks, 0.6% below the baseline.
#
# A count cannot say WHICH finding went dark, and the count is what a reader gets from a
# floor. `#/finding_sources` is the pin file's own declaration that this package answers a
# finding and where that finding is stated -- 106 of them -- so the set of declared
# findings that no pin cites and no `unpinnable` row excuses is a number this file can
# hold, and every pin deletion moves it by name. 37 today.
#
# THIS COMMENT USED TO CLAIM WHAT THE 37 WERE: "all F6A/F6B/F6C/F6D and G2-06: Step 6
# findings whose repair landed as a check rather than as a conjunct." F6R-01 opened them
# and found three -- F6A-10, F6D-09, F6D-12 -- with no repair anywhere, so the sentence
# told a reader the list was repairs delivered elsewhere and it was not. The causal clause
# is gone from here and the claim is made per finding, in data, by the partition below.
#
# This sits ABOVE the floors deliberately, for the reason RC4-01's block states about its
# own ordering: on a mutation that trips both, the reader should be told the concrete
# thing -- which finding is now carried by nothing -- and not merely that a table moved.
FINDING_SOURCES = PINNED["finding_sources"]
covered = {finding for pin in PINNED["pins"] for finding in pin["findings"]} \
    | {finding for row in PINNED["pinned_transitions"] for finding in row["findings"]}
unpinnable = {entry["finding"]: entry["why"] for entry in PINNED["unpinnable"]}
UNANSWERED_CEILING = 37
unanswered = sorted(set(FINDING_SOURCES) - covered - set(unpinnable))
checked(len(unanswered) <= UNANSWERED_CEILING,
        ("A PINNED FINDING LOST ITS LAST PIN: a finding declared in "
         "`pinned-conjuncts.json#/finding_sources` is cited by no pin, no pinned "
         "transition and no `unpinnable` row, so this package still names the review that "
         "stated it and no longer states anything about it. Deleting a pin whose findings "
         "are cited nowhere else is exactly the move the pin FLOOR cannot name and the "
         "coverage check below cannot see, because the coverage check reads the register "
         "and these findings are stated in the F2 reviews (RC5-02)",
         {"unanswered": unanswered, "count": len(unanswered), "ceiling": UNANSWERED_CEILING,
          "note": "every name in `unanswered` is a finding this package declares a source "
                  "for and says nothing about; the one that is not in the committed 37 is "
                  "the pin that was just deleted. "
                  "Retiring a pin is a decision: cite its findings on another pin, or add "
                  "an `unpinnable` row saying why no conjunct can carry it. LOWERING this "
                  "ceiling is free and is the direction to move it; raising it is an edit "
                  "to validate_contracts.py."}))

# --- F6R-01: `unanswered` IS A PARTITION, AND THE TWO HALVES MEAN DIFFERENT THINGS. ----
#
# The ceiling above counts correctly and the sentence beside it said something the count
# does not support: "Step 6 findings whose repair landed as a check rather than as a
# conjunct". The recheck opened the 37 and found F6A-10, F6D-09 and F6D-12 with no repair
# ANYWHERE -- not a pin, not a check, not a chapter amendment -- while the gloss told a
# reader the whole list was repairs delivered elsewhere. A count that carries two meanings
# reports the safer one.
#
# So the set is DECLARED, as a partition, in pinned-conjuncts.json:
#   `answered_elsewhere` -- the finding is answered, and the row NAMES the file and the
#       check, so the claim is falsifiable by opening the file rather than by trusting a
#       sentence. `file` must exist.
#   `not_answered`       -- nothing here answers it, and the row says why not.
# Each half carries its OWN bound. One ceiling over both would let an entry move from
# "answered" to "not answered" at zero cost, which is exactly the ambiguity F6R-01 is
# about; two ceilings make the crossing an edit to this file.
#
# `not_answered` is the CONSERVATIVE half: a finding whose answering file and check nobody
# has named sits here, not in `answered_elsewhere`. That is deliberately pessimistic --
# the failure this repair exists to prevent is a list of unverified entries wearing the
# word "answered", and the cheap direction of error must be the one that understates.
ANSWERED_ELSEWHERE = PINNED["answered_elsewhere"]
NOT_ANSWERED = PINNED["not_answered"]
checked(set(ANSWERED_ELSEWHERE) | set(NOT_ANSWERED) == set(unanswered),
        ("THE UNANSWERED SET IS NOT PARTITIONED: a finding that no pin, no pinned "
         "transition and no `unpinnable` row carries is either answered somewhere this "
         "package can name or it is not answered, and every one of them must say which. "
         "A finding in neither half is back in the single undifferentiated count F6R-01 "
         "is about (F6R-01)",
         {"unanswered": unanswered,
          "in neither half": sorted(set(unanswered) - set(ANSWERED_ELSEWHERE) - set(NOT_ANSWERED)),
          "declared but not unanswered": sorted((set(ANSWERED_ELSEWHERE) | set(NOT_ANSWERED))
                                                - set(unanswered)),
          "note": "add the finding to `#/answered_elsewhere` with the file and the check "
                  "that answers it, or to `#/not_answered` with the reason nothing does."}))
checked(not (set(ANSWERED_ELSEWHERE) & set(NOT_ANSWERED)),
        ("a finding is declared BOTH answered elsewhere and not answered (F6R-01)",
         sorted(set(ANSWERED_ELSEWHERE) & set(NOT_ANSWERED))))
for _finding, _row in sorted(ANSWERED_ELSEWHERE.items()):
    checked(isinstance(_row, dict) and str(_row.get("file", "")).strip()
            and str(_row.get("check", "")).strip(),
            ("A FINDING IS DECLARED ANSWERED WITH NO FILE AND NO CHECK NAMED: that is the "
             "unfalsifiable sentence F6R-01 removed from the comment, moved into the data "
             "(F6R-01)", _finding, _row))
    _answering = ROOT.parents[2] / _row["file"] if "/" in _row["file"] else ROOT / _row["file"]
    checked(_answering.exists(),
            ("a finding is declared answered by a file that does not exist (F6R-01)",
             _finding, _row["file"]))
for _finding, _why in sorted(NOT_ANSWERED.items()):
    checked(str(_why).strip(),
            ("a finding is declared not answered with no reason (F6R-01)", _finding))
# Two bounds, both CEILINGS, both literals. `not_answered` may only fall: a repair moves a
# finding out of it. `answered_elsewhere` has a ceiling rather than a floor for the reason
# every other ceiling here does -- a table where everything is declared answered passes as
# loudly as one where nothing is, and the rows are the evidence, not the count.
ANSWERED_ELSEWHERE_CEILING = 2
NOT_ANSWERED_CEILING = 32
checked(len(ANSWERED_ELSEWHERE) <= ANSWERED_ELSEWHERE_CEILING,
        ("more findings are declared answered outside the pin machinery than when this "
         "ceiling was set; each one is a claim that a named file and a named check carry "
         "it, and raising this is an edit to validate_contracts.py (F6R-01)",
         {"answered_elsewhere": len(ANSWERED_ELSEWHERE),
          "ceiling": ANSWERED_ELSEWHERE_CEILING}))
checked(len(NOT_ANSWERED) <= NOT_ANSWERED_CEILING,
        ("MORE FINDINGS ARE DECLARED NOT ANSWERED than when this ceiling was set. This "
         "number may only FALL: a finding leaves by being pinned or by being answered "
         "with a file and a check named. It grows only when a new finding is declared in "
         "`#/finding_sources` and nothing carries it (F6R-01)",
         {"not_answered": len(NOT_ANSWERED), "ceiling": NOT_ANSWERED_CEILING,
          "not_answered_findings": sorted(NOT_ANSWERED)}))

# A floor, and it is a LITERAL for the same reason the sibling-collision budget is: a
# count derived from the file it measures is satisfied by the empty file. The coverage
# check below forces every registered finding to be pinned or excused, which an author
# could satisfy by moving the pins into `unpinnable` one reason at a time; this is what
# stops that being quiet. Lowering these numbers is a decision, and it should read like one.
# The transition floor was 6 and is 32 (F6D-04). The six were all on `Fulfillment` and
# `SalesAgreement`; not one of the fifteen WORK-1.1 records had a pinned transition, and
# three measured edge deletions on those records passed at exit 0.
#
# RC5-02 RAISED ALL FOUR TO THE COMMITTED COUNTS, and that is the whole finding: 25/44 were
# set when the table held 25 pins and 44 rows, the table grew to 67 and 148, and the floors
# tracked neither -- so more than half the pin table sat below no control at all. A floor
# that does not move with the table it budgets is the denominator again, which is the rule
# NEGATIVE_FIXTURE_FLOOR's own comment states and this file did not apply to itself.
# RAISE THESE WHENEVER A PIN IS ADDED. Never lower one without writing the reason here.
PIN_FLOOR = 70           # 69 -> 70 (F6C-10): the attempt-ceiling pin
PIN_ROW_FLOOR = 154      # 152 -> 154 (F6C-10): two rows on the attempt-ceiling pin
PIN_TRANSITION_FLOOR = 50  # 32 -> 50 (RC5-02)
FINDING_SOURCE_FLOOR = 106  # new (RC5-02): the declaration the ceiling above reads
checked(len(PINNED["pins"]) >= PIN_FLOOR
        and len(PINNED["pinned_transitions"]) >= PIN_TRANSITION_FLOOR,
        ("the pinned table has shrunk; a pin table with no pins passes vacuously",
         {"pins": len(PINNED["pins"]), "floor": PIN_FLOOR,
          "pinned_transitions": len(PINNED["pinned_transitions"]),
          "transition_floor": PIN_TRANSITION_FLOOR}))
checked(sum(len(pin["require"]) for pin in PINNED["pins"]) >= PIN_ROW_FLOOR,
        ("the pinned table kept its pins and lost its requirements",
         {"rows": sum(len(pin["require"]) for pin in PINNED["pins"]),
          "floor": PIN_ROW_FLOOR}))
checked(len(FINDING_SOURCES) >= FINDING_SOURCE_FLOOR,
        ("the finding-source table has shrunk, and it is the denominator the unanswered "
         "ceiling above is measured against: deleting a pin AND the `finding_sources` row "
         "that declares its finding keeps that ceiling satisfied while answering one "
         "finding fewer (RC5-02)",
         {"finding_sources": len(FINDING_SOURCES), "floor": FINDING_SOURCE_FLOOR}))
# And a CEILING, for the mirror-image reason. `disjoined: true` excuses a row from demanding
# its conjunct, so a table where every row is excused passes as loudly as one where none is
# -- the floors above cannot tell 44 rows from 44 inert ones, which is precisely the gap
# RC2-02 walked through. Four rows are excused today, each naming its branch. Raising this
# is a decision and should read like one.
disjoined_rows = [row for pin in PINNED["pins"] for row in pin["require"] if row.get("disjoined")]
checked(len(disjoined_rows) <= 4,
        ("more pinned rows are excused from DEMANDING their conjunct than when this ceiling "
         "was set; each `disjoined: true` is a row that accepts a match inside an `any`",
         {"disjoined": len(disjoined_rows), "ceiling": 4,
          "rows": [(pin["predicate_id"], row["op"]) for pin in PINNED["pins"]
                   for row in pin["require"] if row.get("disjoined")]}))

pinned_predicates = set()
for pin in PINNED["pins"]:
    checked(set(pin) == PIN_KEYS, ("pin shape", pin.get("predicate_id"), sorted(set(pin) ^ PIN_KEYS)))
    predicate_id = pin["predicate_id"]
    checked(predicate_id not in pinned_predicates, ("predicate pinned twice", predicate_id))
    pinned_predicates.add(predicate_id)
    checked(predicate_id in PREDICATES,
            ("a pinned predicate no longer exists", predicate_id, pin["why"]))
    checked(bool(pin["findings"]) and bool(pin["why"].strip()),
            ("a pin states no finding or no reason", predicate_id))
    nodes = polarised_nodes(PREDICATES[predicate_id]["body"], predicate_id)
    for row in pin["require"]:
        # Declare what is read and REFUSE the rest: a constraint key this checker does
        # not know would otherwise be a pin that reads as enforcement and checks nothing.
        checked(set(row) <= PIN_ROW_KEYS,
                ("unknown key in a pinned requirement", predicate_id, sorted(set(row) - PIN_ROW_KEYS)))
        checked("op" in row and row.get("why", "").strip(),
                ("a pinned requirement states no op or no reason", predicate_id, row))
        # RC2-02: an opt-out of the demand rule states its condition, and a row that is not
        # opted out carries no excuse. Both directions, because an orphaned `disjoined_why`
        # reads as an excuse that is in force while nothing is excused by it.
        checked(isinstance(row.get("disjoined", False), bool),
                ("`disjoined` is a boolean: a row either demands its conjunct or names the "
                 "branch it may sit in", predicate_id, row["op"], row.get("disjoined")))
        checked(bool(row.get("disjoined_why", "").strip()) == bool(row.get("disjoined", False)),
                ("`disjoined: true` with no `disjoined_why`, or a `disjoined_why` on a row "
                 "that demands its conjunct unconditionally: an excuse nobody had to write "
                 "is an excuse nobody reads", predicate_id, row["op"]))
        for binding in row.get("bindings", []):
            checked(set(binding) == PIN_BINDING_KEYS,
                    ("pinned binding shape", predicate_id, sorted(set(binding) ^ PIN_BINDING_KEYS)))
        # Polarity is a property of a PREDICATE. `path` and `resolve` return a JsonValue,
        # and asking whether a field read sits beneath a `not` is a category error -- the
        # `disputed_custodian` read that G4-01 requires lives inside `not(eq(...))` and is
        # exactly as present there. The result type decides, read off the primitive
        # registry rather than from a list kept here, and a `negated` row on a value op is
        # refused rather than quietly ignored.
        checked(row["op"] in PRIMITIVES, ("a pinned op is not a registered primitive",
                                          predicate_id, row["op"]))
        boolean_op = PRIMITIVES[row["op"]]["result_type"].startswith("boolean")
        checked(boolean_op or "negated" not in row,
                ("`negated` on a pinned value op: polarity is a property of a predicate, "
                 "and this op returns a value", predicate_id, row["op"]))
        wanted_negated = bool(row.get("negated", False))
        # FOUR questions, not one, because they have four different answers and a reader
        # told the wrong one looks in the wrong place. CONTAINED: does the body carry this
        # conjunct anywhere at all. POSITIONED: does it carry it where a conjunct is
        # evaluated, rather than inside a value another operator reads (RC3-02).
        # QUANTIFIED: does the body's truth depend on it, or only on a collection nothing
        # requires to be non-empty (RC3-01). DEMANDED: is what is left actually required.
        # Probes 4 and 4b of G-02-recheck-03 are the difference between the first three --
        # every one of them contained, none of them demanded, all of them at exit 0.
        contained = [entry for entry in nodes
                     if entry.node.get("op") == row["op"]
                     and (entry.negated == wanted_negated or not boolean_op)
                     and pin_row_matches(entry.node, row)]
        # A value op is SUPPOSED to live in a value slot -- `path` reads a field inside an
        # `eq`, and one live pin row pins exactly that -- so the position rule applies to
        # boolean ops, which are the only ops a body's truth can depend on.
        positioned = [entry for entry in contained
                      if not (boolean_op and entry.in_value)]
        quantified = [entry for entry in positioned if entry.quantifiers]
        demanded = [entry for entry in positioned
                    if not entry.quantifiers
                    and (not entry.disjoined or row.get("disjoined", False))]
        # RC4-02, and it is the FIFTH question. It is asked over `demanded` -- the entries
        # that WOULD satisfy this row -- and it is checked AFTER the three below, and both
        # of those are the result of running the suite rather than reading it.
        #
        # Over `demanded` rather than `positioned`, because a quantified copy sitting
        # beside a demanded one is not a defect: `all(X, forall(items, bind, X))` is
        # satisfied by the demanded copy, and refusing it would be a false refusal over a
        # body that requires what the pin asks. Over `demanded`, the question is exactly
        # "is every entry that satisfies this row satisfied through admitted ancestry".
        #
        # AFTER the three, because ordering it first made it steal their sentences: the
        # vacuous-`forall` fixture and the disjoined-with-a-tautology fixture both failed
        # FOR THE WRONG REASON, naming an inadmissible ancestor where the reader needed
        # "ONLY UNDER A QUANTIFIER" and "ONLY UNDER A DISJUNCTION". The runner caught it,
        # which is what it is for. A specific message beats a general one wherever both are
        # true, and this one is the general case of all three.
        foreign = [(entry, inadmissible_ancestor(entry, row, boolean_op))
                   for entry in demanded]
        foreign = [(entry, operator) for entry, operator in foreign if operator is not None]
        # RC4-04. This message used to close "Demand the collection non-empty on the same
        # path, or state the requirement outside the quantifier" -- and the first of those
        # two is not accepted. The recheck wrote the body the note asks for: a sibling
        # `nonempty_fields` on the SAME pointer the message itself prints, outside the
        # quantifier, so the collection cannot be empty and the conjuncts under the
        # `forall` really are required. Refused, with the same words. An author who follows
        # a remedy that does not exist writes it, is refused again, and learns to route
        # around the checker -- which is the outcome this package cites as its reason for
        # REFUSING to widen the RC-03 phase rule, so paying it here would be incoherent.
        #
        # The choice made, and it is the message rather than the rule: `quantified` stays
        # unconditionally non-demanding. Implementing the sibling case means deciding when
        # one conjunct forces another's collection non-empty, and `nonempty_fields` on a
        # pointer of the SUBJECT is not the same claim as a lower bound on the collection a
        # quantifier resolves and ranges over -- a satisfiability question, decided by a
        # checker, over a population of zero. This file's own rule is that a narrowing that
        # fails nothing may be a narrowing that does nothing; a WIDENING that passes
        # something is worse, and RC4-02 is what a widening of exactly this kind costs. So
        # the note now states the one remedy that works and says plainly that the sibling
        # does not lift the rule. The headline moved too: it claimed the collection is one
        # "nothing forces to be non-empty", which was false about the tree in front of it.
        checked(demanded or not quantified,
                ("PINNED CONJUNCT ONLY UNDER A QUANTIFIER: the registry still MENTIONS what "
                 "this finding required, inside a quantifier, and a quantifier is treated "
                 "here as DEMANDING NOTHING -- unconditionally, whatever else the body says "
                 "about the collection it ranges over",
                 predicate_id, row["op"], row["why"],
                 {"findings": pin["findings"], "decisions": pin["decisions"],
                  "quantifiers": sorted({note for entry in quantified
                                         for note in entry.quantifiers}),
                  "accepted": "ONE remedy: state the requirement OUTSIDE the quantifier. A "
                              "demanded copy beside the quantified one satisfies this row "
                              "-- the quantified copy is then free to stay.",
                  "not_accepted": "Demanding the collection non-empty on the same path does "
                                  "NOT lift this rule, and adding such a sibling conjunct "
                                  "will be refused with this same message (RC4-04). The "
                                  "rule does not reason about which conjunct bounds which "
                                  "collection: `nonempty_fields` on a pointer of the "
                                  "subject is not a lower bound on the collection this "
                                  "quantifier resolves and ranges over, and a checker that "
                                  "guessed they were the same would be widening the demand "
                                  "rule, which is the defect class RC4-02 came from.",
                  "why_at_all": "a `forall` over a field records.schema.json permits to be "
                                "`[]` is vacuously true, so a conjunct moved inside it is "
                                "required of nothing (RC3-01). Zero `forall` nodes exist in "
                                "this corpus, so the conservative reading costs no live "
                                "criterion today."}))
        checked(demanded or not positioned,
                ("PINNED CONJUNCT ONLY UNDER A DISJUNCTION: the registry still MENTIONS what "
                 "this finding required, inside one branch of an `any`, and so no longer "
                 "DEMANDS it", predicate_id, row["op"], row["why"],
                 {"findings": pin["findings"], "decisions": pin["decisions"],
                  "note": "a conjunct kept verbatim and disjoined with a trivially-true "
                          "alternative satisfies a containment check while requiring "
                          "nothing (RC2-02). If this requirement really is conditional, "
                          "set `disjoined: true` on the row and name the branch in "
                          "`disjoined_why`; four rows do."}))
        checked(demanded or not contained,
                ("PINNED CONJUNCT IN A NON-PREDICATE POSITION: the registry carries this op "
                 "inside an argument that is not a predicate position, where it is a value "
                 "the enclosing operator reads rather than a conjunct the body's truth can "
                 "depend on -- so as a requirement it is NOT PRESENT",
                 predicate_id, row["op"], row["why"],
                 {"findings": pin["findings"], "decisions": pin["decisions"],
                  "sits_in": sorted({entry.where for entry in contained}),
                  "note": "`present(value: <the conjunct>)` type-checks and asserts "
                          "nothing about it (RC3-02). primitive-registry.json declares "
                          "which arguments are predicate positions in "
                          "`argument_positions`; only those carry a demand."}))
        checked(not foreign,
                ("PINNED CONJUNCT UNDER AN OPERATOR THE PIN TABLE DOES NOT ADMIT: the "
                 "registry carries this conjunct inside an operator that primitive-"
                 "registry.json classifies as a predicate position and pinned-conjuncts.json "
                 "does not admit, so whether the body DEMANDS it is decided by the same "
                 "author who wrote the demand table",
                 predicate_id, row["op"], row["why"],
                 {"findings": pin["findings"], "decisions": pin["decisions"],
                  "ancestor_operator": sorted({operator for _entry, operator in foreign}),
                  "ancestor_chains": sorted({entry.ancestors for entry, _op in foreign}),
                  "admissible_ancestors": sorted(ADMISSIBLE),
                  "note": "a primitive registered with `argument_positions.<child>: "
                          "\"demanded\"` wraps a pinned conjunct and every pin still passes "
                          "(RC4-02). A REGISTRY MAY CLASSIFY POSITIONS; ONLY THE PIN MAY SAY "
                          "WHAT SATISFIES ONE. If this operator really demands its child "
                          "unconditionally, add it to pinned-conjuncts.json#/"
                          "admissible_ancestors BY HAND, with the reason -- and re-pin "
                          "`argument_positions_digest` in the same edit."}))
        checked(bool(demanded),
                ("PINNED CONJUNCT MISSING: the registry no longer says what this finding "
                 "required", predicate_id, row["op"], row["why"],
                 {"findings": pin["findings"], "decisions": pin["decisions"],
                  "note": "pinned-conjuncts.json is hand-written and is NOT derived from "
                          "tools/phase_content.py; regenerating the registry cannot "
                          "satisfy this check, only stating the requirement can"}))

# --- RC4-01: THE DEMAND TABLE IS PINNED TO A HAND-WRITTEN DIGEST. ---------------
#
# ORDER MATTERS HERE AND IT WAS CHOSEN, not inherited. This block sits AFTER the pin loop
# on purpose, and the two negative fixtures are what the choice is for. A mutation that
# registers a demanding primitive AND USES IT changes the digest and wraps a pin, so both
# controls fire; the reader should be told the concrete thing -- which conjunct is now
# satisfied through which operator -- and not merely that a table moved
# (r17-self-declared-demanding-primitive-wraps-a-pin). A mutation that edits the table and
# does not yet use it trips nothing in the pin loop, because no pinned conjunct sits under
# the operator it re-classified, and this is the only thing that refuses it
# (r17-registry-flips-forall-to-demanded). Placed the other way round, the ancestor rule
# above would be a control no fixture reaches.
#
# The recheck's measurement is the whole argument: `/forall/argument_positions/predicate`
# from "quantified" to "demanded" -- one string, in a file written by the derivation tools
# and asserted by nothing -- and the vacuous-`forall` body validated at 288,646 checks with
# every pin satisfied and `under_quantifier: 0`, because the census reads the same table.
# `grep -n 'sha256\|hashlib\|digest' validate_contracts.py` returned nothing at the time.
import hashlib  # noqa: E402
ARGUMENT_POSITIONS = {name: primitive["argument_positions"]
                      for name, primitive in sorted(PRIMITIVES.items())}
ARGUMENT_POSITIONS_DIGEST = hashlib.sha256(
    json.dumps(ARGUMENT_POSITIONS, sort_keys=True, separators=(",", ":")).encode("utf-8")
).hexdigest()
checked(ARGUMENT_POSITIONS_DIGEST == PINNED["argument_positions_digest"],
        ("THE DEMAND TABLE MOVED: primitive-registry.json's `argument_positions` map no "
         "longer hashes to the digest pinned by hand in pinned-conjuncts.json. That map is "
         "the whole demand vocabulary of this package -- four strings across 57 primitives "
         "-- it is written by the derivation tools, and before RC4-01 nothing in the tree "
         "asserted a byte of it",
         {"primitive-registry.json": ARGUMENT_POSITIONS_DIGEST,
          "pinned-conjuncts.json": PINNED["argument_positions_digest"],
          "primitives": len(ARGUMENT_POSITIONS),
          "note": "RE-PIN DELIBERATELY. Decide what the edit does to the demand rule, then "
                  "write the new digest into pinned-conjuncts.json#/"
                  "argument_positions_digest in the same commit as the registry edit, so "
                  "the two are one line apart in one diff. Recompute it with the command "
                  "in #/argument_positions_digest_why. Re-pinning is not the whole job: an "
                  "operator that now declares a DEMANDING role must also be added by hand "
                  "to ADMISSIBLE_LITERAL in validate_contracts.py and to "
                  "#/admissible_ancestors, which are compared (RC5-01), or no pinned "
                  "conjunct may be satisfied through it."}))
# And what a deliberate re-pin must then survive. Reachable only AFTER someone re-pins the
# digest -- the check above fires first on any table edit -- so no negative fixture
# expresses it, and that is stated rather than implied: a fixture would have to carry a
# hand-computed digest of its own mutated registry and would rot on the next primitive
# added. This is the second half of RC4-01's required contract and it is what turns RC4-02
# into a refusal at the DECLARATION rather than at the first body that uses it.
for _name, _primitive in PRIMITIVES.items():
    _demanding = sorted(argument for argument, role
                        in _primitive["argument_positions"].items()
                        if role in ("demanded", "disjoined", "negated"))
    checked(not _demanding or _name in ADMISSIBLE,
            ("A PRIMITIVE DECLARES ITS OWN CHILD DEMANDING AND THE PIN TABLE DOES NOT "
             "ADMIT IT: primitive-registry.json is written by the derivation's author, so "
             "an operator that classifies its own predicate child `demanded` would decide, "
             "unilaterally, that a pinned conjunct written inside it is required (RC4-02)",
             _name, _demanding,
             {"admissible_ancestors": sorted(ADMISSIBLE),
              "note": "either add this operator to ADMISSIBLE_LITERAL in "
                      "validate_contracts.py with its condition AND to pinned-"
                      "conjuncts.json#/admissible_ancestors with its reason -- the two are "
                      "compared (RC5-01) -- or declare the argument `quantified`, which is "
                      "non-demanding, is the conservative reading for any operator whose "
                      "child may be evaluated zero times, and must then be named in "
                      "#/admissible_ancestors_not_admitted."}))
    # RC5-01 asked whether the `quantified` opt-in should be DELETED as "the only escape
    # and it demands nothing". It is not deleted, because it has a caller: `forall`
    # declares its predicate child `quantified`, and deleting the escape would force
    # `forall` into ADMISSIBLE_LITERAL -- admitting, to close a hole, exactly the operator
    # the whole lineage exists to refuse. What was free about the escape is now priced:
    # an operator that takes it must be named in #/admissible_ancestors_not_admitted,
    # which is the block RC5-03 made data. So the escape costs a hand-written declaration
    # in the pin file, and it is the declaration that says why the operator demands
    # nothing. `quantified` remains non-demanding in the walker; this adds no route in.
    _quantified = sorted(argument for argument, role
                         in _primitive["argument_positions"].items()
                         if role == "quantified")
    checked(not _quantified or _name in NOT_ADMITTED,
            ("A PRIMITIVE TAKES THE `quantified` ESCAPE AND IS NOT DECLARED NON-ADMISSIBLE: "
             "`quantified` is the one demand role that does not require an entry in the "
             "admissible-ancestor table, because a child evaluated zero times demands "
             "nothing -- so it is the cheapest way to register a boolean-child operator "
             "this package never has to argue about. It is declared, by name, in "
             "pinned-conjuncts.json#/admissible_ancestors_not_admitted, with the reason "
             "(RC5-01, RC5-03)",
             _name, _quantified,
             {"declared not admissible": sorted(set(NOT_ADMITTED) - {NOT_ADMITTED_CATCH_ALL}),
              "note": "add a row to #/admissible_ancestors_not_admitted naming this "
                      "operator and saying why its quantified child demands nothing -- as "
                      "`forall`'s row does: a quantifier over a collection nothing forces "
                      "non-empty is vacuously true."}))

# A conjunct pin holds a guard to what it demands and says nothing about whether the edge
# EXISTS. RC-01 was that shape: every guard well formed, every criterion sourced, and no
# transition at all for a delivery that fails in flight. Deleting a transition is a
# one-line edit to record-registry.json, and nothing here would have noticed it.
# --- F6D-01: WHERE A GUARD IS ATTACHED. HAND-WRITTEN, AND THE SECOND HALF OF A PIN. ---
#
# A conjunct pin holds a guard to what its BODY demands. It says nothing about whether any
# edge CALLS it, and the measurement is not close: one detachment fixture per guard, every
# call site removed, thirty runs, THIRTY UNDETECTED AND ZERO CAUGHT. The guard definition
# survives byte for byte, every conjunct pin still passes over it, and the whole apparatus
# reports green over a boundary that is no longer evaluated anywhere.
#
# Derived from nothing, for the same reason `pinned_transitions` is derived from nothing: a
# table computed from the registry it checks agrees with every edit to that registry.
#
# The call must be DEMANDED, not merely present. A call inside a value slot, under a `not`,
# under a disjunction or under a quantifier is a call the edge's truth does not depend on --
# RC3-01 and RC3-02 one layer out -- so the same `polarised_nodes` walk that decides a pin
# row decides this, rather than a `predicate_id in json.dumps(body)` that would accept all
# four.
# --- F6C-09: A TERMINAL ERROR CLASS WITH NO RECIPIENT IS A SILENT DROP. ---
#
# PS-NO-PROGRESS-RECIPIENT. `no_progress` was an `error_class` enum member with an OPTIONAL
# recipient that nothing demanded: `no_progress_recipient_ref` and `no_progress_terminal`
# occurred zero times in predicate-registry.json, and all eleven FailureRecord transitions
# called no guard at all. So a record with `error_class: "no_progress"` and no recipient
# passed schema validation and every registered edge -- the silent drop R-X10 names, reachable
# through the rule's own record. The rule binds on a VALUE, so it is a payload conditional.
_failure = SCHEMAS["records.schema.json"]["$defs"]["FailureRecord"]["properties"]["payload"]
_no_progress = [branch for branch in _failure.get("allOf", [])
                if branch.get("if", {}).get("properties", {})
                .get("error_class", {}).get("const") == "no_progress"]
checked(len(_no_progress) == 1,
        ("A TERMINAL ERROR CLASS MAY BE RECORDED WITH NO RECIPIENT. `no_progress` with nobody "
         "named is the silent drop, and it is reachable through the record the rule is "
         "written on (F6C-09)", {"branches": len(_no_progress)}))
checked({"no_progress_recipient_ref", "no_progress_terminal"}
        <= set(_no_progress[0]["then"].get("required", [])),
        ("the no-progress conditional no longer demands a named recipient", _no_progress[0]))

# --- F6C-01: AN EXHAUSTIBLE DUTY WITH NO PERFORMER IS REFUSED AT ADMISSION. ---
#
# PS-EXHAUSTIBLE-DUTY-CONDITIONAL. 07 section 6's exhaustion rule is not the pressure rule --
# the pressure rule governs a FILLING bucket and this one governs an EMPTY one, and fifty
# percent of an empty bucket is zero. The rule turns on a VALUE rather than on a presence, so
# it is a payload conditional and not a guard row, for the same reason the control-object rule
# is split: writing "mode is not `none` OR the class cannot exhaust" as a disjunction would
# need rows excused from demanding their own conjunct, and an excused row is what the
# disjoined ceiling exists to keep rare.
_obligation = SCHEMAS["records.schema.json"]["$defs"]["Obligation"]["properties"]["payload"]
_exhaustible = [branch for branch in _obligation.get("allOf", [])
                if branch.get("if", {}).get("properties", {})
                .get("duty_class_can_exhaust", {}).get("const") is True]
checked(len(_exhaustible) == 1,
        ("THE EXHAUSTION RULE HAS NO CONDITIONAL BEHIND IT. `production_mode` may then be "
         "`none` on a duty class that can empty, which is a promise with nobody behind it, "
         "and the moment it is discovered is the moment the bucket empties (F6C-01)",
         {"branches": len(_exhaustible)}))
_then = _exhaustible[0]["then"]
checked(_then.get("properties", {}).get("production_mode", {}).get("not", {}).get("const")
        == "none",
        ("the exhaustible-duty conditional no longer refuses `production_mode: none`, which "
         "is the one value 07 section 6 names as inadmissible there (F6C-01)", _then))
checked("production_performer_ref" in _then.get("required", []),
        ("an exhaustible duty may name a production mode and no performer to carry it. "
         "`named explicitly on the obligation` is about the performer as much as the mode "
         "(F6C-01, MD-02)", _then.get("required")))
checked(set(_obligation["properties"]["production_mode"]["enum"])
        == {"manual_founder", "contracted_professional", "other_provider", "none"},
        ("the production-mode enum is not the closed four of 07 section 6; an open mode is "
         "the free-text state the field was added to leave (F6C-01)",
         _obligation["properties"]["production_mode"].get("enum")))

# --- F6A-06: THE DECLARED FLOOR HAS A SOURCE, AND THE SOURCE IS A CHECKED TABLE. ---
#
# `ConsequenceDerivation.declared_floor_ref` is REQUIRED, and 05 section 11 says the class
# set is computed from four inputs including "the owning capability contract's declared
# floor, and from nothing else". capabilities.json had NO floor field of any name, ZERO
# occurrences of any C0-C5 token, and a 53-term free-text vocabulary that nothing mapped
# onto the six classes. The mapping table was named three times across two chapters and did
# not exist -- so an implementer populating that required field for CAP-17 (who accepts a
# refund), CAP-22 (a privacy request from a non-customer) or CAP-24 (who signs a supplier
# commitment) had no rule, and two implementers mapping 53 terms onto six classes
# differently decide WHO MAY ACT differently.
#
# class-mapping-table.json is that table and is hand-authored, one reason per term. These
# checks are what make it a contract rather than a document: every term is mapped, every
# mapping is used, and every capability's floor is the maximum of its own terms rather than
# a number someone typed.
#
# The `max` here is a FLOOR over a design-time vocabulary and is NOT the total rank 02
# section 4 refuses. That prohibition is about collapsing a REACHED SET at evaluation time
# and applying one row, which drops C2's human requirement on an action that is both C2 and
# C3 (AT-M4-02). This produces one of the four INPUTS to the derivation; the derivation's
# output is still a set and every member's gates still apply.
MAPPING = FILES["class-mapping-table.json"]
CAPABILITIES = json.loads((ROOT.parent / "capabilities.json").read_text(encoding="utf-8"))
CLASS_IDS = ["C0", "C1", "C2", "C3", "C4", "C5"]
checked(list(MAPPING["classes"]) == CLASS_IDS,
        ("the mapping table's class set is not the six routing classes of 02 section 4; a "
         "seventh class is refused there by name", list(MAPPING["classes"])))
declared_terms = {term for capability in CAPABILITIES["capabilities"]
                  for term in capability["consequence_classes"]}
checked(declared_terms == set(MAPPING["mappings"]),
        ("A CAPABILITY DECLARES A CONSEQUENCE TERM THE MAPPING TABLE DOES NOT MAP, or the "
         "table maps a term no capability uses. An unmapped term is a capability whose floor "
         "cannot be computed, which is the state every one of the 53 was in (F6A-06)",
         {"declared, unmapped": sorted(declared_terms - set(MAPPING["mappings"])),
          "mapped, undeclared": sorted(set(MAPPING["mappings"]) - declared_terms)}))
for _term, _entry in MAPPING["mappings"].items():
    checked(set(_entry) == {"class", "reason"}, ("mapping entry shape", _term, sorted(_entry)))
    checked(_entry["class"] in CLASS_IDS, ("a term maps to no routing class", _term))
    checked(_entry["reason"].strip(),
            ("a term is mapped with no reason. The mapping decides who may act and a row "
             "nobody can evaluate is a row nobody can argue with", _term))
for _capability in CAPABILITIES["capabilities"]:
    _computed = max(MAPPING["mappings"][term]["class"]
                    for term in _capability["consequence_classes"])
    checked(_capability.get("declared_floor") == _computed,
            ("A CAPABILITY'S DECLARED FLOOR IS NOT WHAT ITS OWN TERMS MAP TO. The floor is "
             "derived from the table or it is a number someone typed, and a typed number is "
             "the thing this repair replaced (F6A-06)",
             _capability["id"],
             {"declared": _capability.get("declared_floor"), "from the table": _computed,
              "terms": _capability["consequence_classes"]}))
    checked(_capability.get("declared_floor_source") == "class-mapping-table.json",
            ("a capability declares a floor and does not name where it came from",
             _capability["id"]))
# And the one place the chapters state a floor in prose, checked against the table rather
# than trusted: 05 section 11, "It is therefore floored by the capability: CAP-13, CAP-14,
# CAP-15 and CAP-16 floor at the economic/contractual class."
for _promise_capability in ("CAP-13", "CAP-14", "CAP-15", "CAP-16"):
    _row = next(c for c in CAPABILITIES["capabilities"] if c["id"] == _promise_capability)
    checked(_row["declared_floor"] == "C3",
            ("05 section 11 states that this capability floors at the economic/contractual "
             "class and the mapping table computes something else. One of the two is wrong "
             "and the prose cannot be the thing that gives way silently (F6A-06, MD-21)",
             _promise_capability, _row["declared_floor"]))
# The floor a derivation points at is a ConsequenceClassDefinition, and that record's
# class_id is drawn from the same six -- which is what makes `declared_floor_ref` resolve to
# this table's output rather than to an unrelated vocabulary.
checked(RECORDS["ConsequenceDerivation"]["fields"]["payload"]["fields"]
        ["declared_floor_ref"]["type"] == "Ref<ConsequenceClassDefinition>",
        "the derivation's declared floor no longer points at a class definition")
checked(set(SCHEMAS["records.schema.json"]["$defs"]["ConsequenceClassDefinition"]
            ["properties"]["payload"]["properties"]["class_id"]["enum"]) == set(CLASS_IDS),
        ("the class definition's own class_id is not the six this table maps onto, so a "
         "capability's floor and the record its derivation points at would be drawn from "
         "two different vocabularies (F6A-06)"))

# --- F6D-11 / F6C-08: A BUSINESS IDENTITY THAT IS A NATURAL KEY SAYS SO, AND IS CHECKED. --
#
# `EffectIdentity`'s registry identity is the surrogate `(company_id, record_id, revision)`
# while 05 section 6 declares the identity as `(effect_class, counterparty, payload_digest)`
# -- so the triple the design calls the identity was three ordinary payload fields with no
# constraint of any kind, and the strings `natural_key`, `unique` and `uniqueness` occurred
# NOWHERE in record-registry.json. The protocol's tenth (d)-class example is exactly the
# choice that leaves: a unique-index conflict, a read-then-join, or two rows. The chapter
# answers it and the contract did not carry the answer.
#
# `identity.natural_key` is that answer, and these checks are what stop it being another
# declaration nothing backs. Every named field must be a payload property AND `required`: a
# key over a field that may be absent is not a key. The surrogate `key` stays as it is -- a
# natural key is an ADDITIONAL constraint, never a replacement for the revision identity the
# kernel is built on.
for _record, _body in RECORDS.items():
    _natural = _body["identity"].get("natural_key")
    if _natural is None:
        checked("natural_key_rule" not in _body["identity"],
                ("a record states a natural-key RULE and declares no natural key, which is "
                 "an identity constraint that reads as one and constrains nothing", _record))
        continue
    _payload = SCHEMAS["records.schema.json"]["$defs"][_record]["properties"]["payload"]
    checked(bool(_natural) and bool(str(_body["identity"].get("natural_key_rule", "")).strip()),
            ("a natural key with no fields or no stated rule; 'resolve-or-create' and "
             "'conflict' are different systems and the rule is where the choice is recorded",
             _record))
    for _field in _natural:
        checked(_field in _payload.get("properties", {}),
                ("a natural key names a payload field the schema does not have",
                 _record, _field))
        checked(_field in _payload.get("required", []),
                ("A NATURAL KEY OVER AN OPTIONAL FIELD IS NOT A KEY: two records may then "
                 "differ only by an absence and both be admitted", _record, _field))
    checked(_body["identity"]["key"] == ["company_id", "record_id", "revision"],
            ("a natural key replaced the surrogate identity rather than constraining it",
             _record, _body["identity"]["key"]))
checked(RECORDS["EffectIdentity"]["identity"].get("natural_key")
        == ["effect_class_id", "counterparty_id", "payload_digest"],
        ("`EffectIdentity` DOES NOT CONSTRAIN ITS BUSINESS TRIPLE. It is the one record in "
         "the registry whose entire purpose is convergence under concurrency, and without "
         "the constraint two concurrent allocations both validate and both release: "
         "guard.effect.identity_allocated_before_release is true of each racer "
         "independently, and criterion.EffectIdentity.claimed.v1 is true of each racer "
         "naming itself (F6D-11, F6C-08)",
         RECORDS["EffectIdentity"]["identity"].get("natural_key")))

# --- F6D-07: THE PRESENCE HALF OF THE CONTROL-OBJECT RULE, WHICH LIVES IN THE SCHEMA. ---
#
# `guard.protected.control_object_change_authorized` carries the PHASE half -- a named
# protected change stands at `authorized` or later -- with `optional: true`, because 08
# section 1 states the benign case in as many words: a `ConfigurationVersion` with no
# `control_object_kind` is an ordinary configuration and its admission requires no protected
# change. A guard binding cannot be optional on one record and mandatory on three, so the
# PRESENCE half is stated in records.schema.json and asserted here. Without this check the
# guard's `optional: true` would be an escape hatch on every one of the nine edges, which is
# the state the finding measured: the objects that decide who may act changed through
# ordinary transitions, and `ProtectedChange` was referenced by none of them.
#
# PS-CONTROL-OBJECT-CONDITIONAL.
CONTROL_OBJECT_RECORDS = ("ConsequenceClassDefinition", "FieldAuthority", "StandingHolder")
for _record in CONTROL_OBJECT_RECORDS:
    _payload = SCHEMAS["records.schema.json"]["$defs"][_record]["properties"]["payload"]
    checked("protected_change_ref" in _payload.get("required", []),
            ("A CONTROL OBJECT MAY CHANGE WITH NO PROTECTED CHANGE NAMED. Every listed "
             "transition of this record is a change to one of the six control objects of "
             "08 section 1, so `protected_change_ref` is not optional on it, and the guard "
             "on those edges is written with `optional: true` because ConfigurationVersion "
             "needs it -- so this is the only thing demanding presence (F6D-07)", _record))
_configuration = SCHEMAS["records.schema.json"]["$defs"]["ConfigurationVersion"]["properties"]["payload"]
checked(_configuration.get("dependentRequired", {}).get("control_object_kind")
        == ["protected_change_ref"],
        ("THE CONDITIONAL THAT MAKES A DECLARED CONTROL OBJECT NEED AN AUTHORIZATION IS "
         "GONE. `control_object_kind` is optional on purpose -- an ordinary configuration is "
         "the paired benign case and must not be refused -- so declaring the kind is the "
         "thing that makes `protected_change_ref` mandatory. Without the dependency, the "
         "class mapping table, the derivation function and the external policy object are "
         "changed by an ordinary configuration admission again (F6D-07)",
         {"dependentRequired": _configuration.get("dependentRequired")}))
checked(set(_configuration["properties"]["control_object_kind"]["enum"])
        == {"derivation_function", "class_mapping_table", "external_policy_object"},
        ("the ConfigurationVersion control-object enum is not the three of 08 section 1's "
         "table that this record carries; an open or widened enum admits a control object "
         "nobody named (F6D-07)",
         _configuration["properties"]["control_object_kind"].get("enum")))
checked(len(SCHEMAS["records.schema.json"]["$defs"]["ProtectedChange"]["properties"]["payload"]
            ["properties"]["protected_subject_kind"]["enum"]) == 6,
        ("`ProtectedChange.protected_subject_kind` is not a closed enum over the SIX control "
         "objects. A seventh subject kind is a control object nobody enumerated, and the "
         "whole reason 08 section 1 lists them is that each reads as configuration rather "
         "than as a change (F6D-07)"))

PIN_ATTACHMENT_KEYS = {"guard", "edges", "findings", "why"}
checked(bool(str(PINNED.get("pinned_attachments_why", "")).strip()),
        "pinned-conjuncts.json declares attachments with no reason")
ATTACHMENTS = PINNED["pinned_attachments"]
# A floor, a LITERAL, and the same argument as every other floor here: a table derived from
# what it measures is satisfied by the empty table, and the completeness rule below could be
# satisfied by deleting guards rather than by attaching them.
# RC5-02 raised it from 30 to the committed 39, for the reason the pin floors were raised:
# the table grew by nine and the budget did not, so nine attachments sat below no control.
PIN_ATTACHMENT_FLOOR = 39  # 30 -> 39 (RC5-02)
checked(len(ATTACHMENTS) >= PIN_ATTACHMENT_FLOOR,
        ("the attachment table has shrunk; it is the only control that catches a guard "
         "DETACHED from the edge it guards, and 30 of 30 were undetected before it existed",
         {"rows": len(ATTACHMENTS), "floor": PIN_ATTACHMENT_FLOOR}))
attached_guards = set()
for row in ATTACHMENTS:
    checked(set(row) == PIN_ATTACHMENT_KEYS,
            ("pinned attachment shape", row.get("guard"),
             sorted(set(row) ^ PIN_ATTACHMENT_KEYS)))
    guard_id = row["guard"]
    checked(guard_id not in attached_guards, ("guard attached twice", guard_id))
    attached_guards.add(guard_id)
    checked(guard_id in PREDICATES, ("a pinned attachment names no such guard", guard_id))
    checked(bool(row["findings"]) and row["why"].strip(),
            ("a pinned attachment states no finding or no reason", guard_id))
    checked(bool(row["edges"]),
            ("a guard is pinned to NO edge, which is the detached state this table exists "
             "to refuse, written down", guard_id))
    for edge_id in row["edges"]:
        checked(edge_id in PREDICATES,
                ("a pinned attachment names an edge predicate that does not exist",
                 guard_id, edge_id))
        calls = [entry for entry in polarised_nodes(PREDICATES[edge_id]["body"], edge_id)
                 if entry.node.get("op") == "call"
                 and entry.node.get("predicate_id") == guard_id]
        demanded = [entry for entry in calls
                    if not entry.in_value and not entry.negated
                    and not entry.disjoined and not entry.quantifiers]
        checked(demanded,
                ("GUARD DETACHED FROM ITS EDGE: the edge no longer demands this guard, so "
                 "the boundary it enforces is not evaluated on this transition. The guard "
                 "definition is untouched and every conjunct pin over it still passes "
                 "(F6D-01)",
                 {"guard": guard_id, "edge": edge_id,
                  "calls_found": len(calls), "demanded": len(demanded),
                  "note": ("present but not demanded" if calls else "no call at all"),
                  "why_it_matters": row["why"]}))
# Completeness in the other direction: a guard registered with no attachment row is a guard
# nobody has said where to find. The rule is stated over `guard.*` because that is the
# prefix the amendment registers its boundaries under and the one 11-schemas-state-contracts
# enumerates; an edge or a criterion is attached by the record registry, which is checked
# elsewhere.
registered_guards = {name for name in PREDICATES if name.startswith("guard.")}
checked(registered_guards == attached_guards,
        ("a registered guard has no pinned attachment, or an attachment names a guard the "
         "registry no longer has. A guard nobody says where to attach is detachable by "
         "construction (F6D-01)",
         {"registered but unattached": sorted(registered_guards - attached_guards),
          "attached but unregistered": sorted(attached_guards - registered_guards)}))

PIN_TRANSITION_KEYS = {"record", "from", "to", "findings", "why"}
for row in PINNED["pinned_transitions"]:
    checked(set(row) == PIN_TRANSITION_KEYS,
            ("pinned transition shape", row, sorted(set(row) ^ PIN_TRANSITION_KEYS)))
    checked(row["record"] in RECORDS, ("a pinned transition names no such record", row))
    checked(bool(row["findings"]) and row["why"].strip(),
            ("a pinned transition states no finding or no reason", row))
    checked(any(edge["from"] == row["from"] and edge["to"] == row["to"]
                for edge in RECORDS[row["record"]]["lifecycle"]["transitions"]),
            ("PINNED TRANSITION MISSING: a route a finding required no longer exists",
             f"{row['record']}:{row['from']}->{row['to']}", row["why"],
             {"findings": row["findings"]}))

# Coverage: a finding the register knows about is pinned here, or is declared unpinnable
# WITH A REASON. Derived from registers/review-findings.json at check time, so a finding
# added to the register tomorrow cannot be silently unpinned today.
#
# --- RC5-02: THE REGEX IS THE COVERAGE CHECK'S REAL DENOMINATOR. ----------------
#
# It matched `G#-##` and `RC-##` and nothing else, so it saw 10 findings in a register of
# 71 entries and had no opinion about `RC2-*`, `RC3-*`, `RC4-*`, `RC5-*`, `GR-*`, `RP-*`,
# `F6X-*` or `XSR-R-*` -- 29 more, every one of them a finding with a REQUIRED CONTRACT
# somebody wrote. A coverage check is exactly as wide as the pattern that builds its
# required set, and that pattern is the least visible line in the block.
#
# Widened to every family a pin may cite. The families are listed rather than collapsed
# into `[A-Z]+-\d+` on purpose: a pattern that matches any capitalised token would sweep
# record names, component ids and section labels out of the prose around a finding and
# demand pins for them, and a required set that is wrong is abandoned rather than fixed.
import re  # noqa: E402
REGISTER = ROOT.parents[2] / "registers" / "review-findings.json"
FINDING_ID = re.compile(
    r"\b(?:G\d-\d{2}[a-z]?"          # G-01 .. G-04 review findings
    r"|RC\d?-\d{2}"                  # the recheck lineage: RC-, RC2- .. RC5-
    r"|A[TCEXS]-(?:M[1-5]|X|ALL|ROUND)-\d{2}"  # F2 selection-record attack cases
    r"|F6[A-D]-\d{2}|F6X-\d{2}"      # Step 6 lane findings and the residue lane
    r"|RP-\d{2}|GR-\d{2}|XSR-R-\d{2}"  # repair, gap-review and cross-scope rechecks
    r")\b")
# And the sweep is over the register AND the review documents the pins cite, because the
# 32 pins this finding is about cite ids that are STATED in the F2 reviews and never
# entered the register. A pin's citation resolves against the same corpus its coverage is
# measured against, or the two disagree about what a finding is.
FINDING_CORPUS = [REGISTER]
FINDING_CORPUS += sorted((ROOT.parents[2] / "planning" / "F2" / "reviews").glob("*.md"))
FINDING_CORPUS += sorted((ROOT.parents[2] / "planning" / "reviews").glob("F2-06-*.md"))
FINDING_CORPUS += sorted((ROOT.parents[2] / "planning" / "reviews").glob("G-02-recheck-0*.md"))
checked(len(FINDING_CORPUS) >= 15,
        ("the finding corpus is smaller than the documents this package cites; a sweep "
         "over a corpus that lost its reviews resolves nothing and refuses nothing "
         "(RC5-02)",
         {"documents": len(FINDING_CORPUS), "floor": 15,
          "found": [str(path.name) for path in FINDING_CORPUS]}))
swept_findings = {}
for _document in FINDING_CORPUS:
    for _finding in FINDING_ID.findall(_document.read_text(encoding="utf-8")):
        swept_findings.setdefault(_finding, str(_document.name))
register_findings = set(FINDING_ID.findall(REGISTER.read_text(encoding="utf-8")))
checked(len(register_findings) >= 30,
        ("the finding sweep of review-findings.json returned almost nothing; a coverage "
         "check with an empty required set passes vacuously. The floor is 30 because the "
         "widened pattern finds 39 in the committed register and the narrow one found 10 "
         "-- a floor under 10 would have passed the whole of RC5-02",
         {"found": sorted(register_findings), "floor": 30}))
for finding, why in unpinnable.items():
    checked(why.strip(), ("a finding declared unpinnable with no reason", finding))
checked(register_findings <= covered | set(unpinnable),
        ("a registered finding is neither pinned nor declared unpinnable",
         sorted(register_findings - covered - set(unpinnable)),
         "add a pin to pinned-conjuncts.json, or an `unpinnable` entry saying why no "
         "conjunct can carry it"))
# And what `unpinnable` may say. A finding whose REQUIRED CONTRACT names a record or a
# guard this package registers is a finding about DATA HELD HERE, so "this one is prose"
# is not available for it: that reason is reserved for the findings whose contract asks
# for a sentence in a chapter, and a reason that fits everything excuses everything.
PROSE_CONTRACT_REASON = "prose contract"
_register_entries = json.loads(REGISTER.read_text(encoding="utf-8"))
_guard_names = {name for name in PREDICATES if name.startswith("guard.")}
# Which entries this rule reaches, stated rather than left to the regex. An entry is in
# reach when a pin could cite its id (the families above) OR when its required contract
# names a record or a guard this package registers -- the second clause is what makes the
# rule about the CONTRACT rather than about the id family, so a finding recorded under a
# family no pin uses is still demanded if it asks for something held here.
#
# Everything else is OUT OF REACH and is COUNTED. The D-review repair families
# (`EAS-R*`, `T-R*`, `FIR-*`, `EPT-*`, `XSR-*`) ask for separations and reconciliations in
# documents this package does not register, and a silent `continue` over them is the
# vacuous pass this finding is about. Thirteen today; a fourteenth is a decision.
OUT_OF_REACH_CEILING = 13
out_of_reach = []
for _entry in _register_entries:
    _contract = _entry.get("required_contract")
    if not _contract:
        continue
    _names_data = sorted({record for record in RECORDS
                          if re.search(r"\b%s\b" % re.escape(record), _contract)}
                         | {guard for guard in _guard_names if guard in _contract})
    if not _names_data and not FINDING_ID.fullmatch(_entry["id"]):
        out_of_reach.append(_entry["id"])
        continue
    checked(_entry["id"] in covered or _entry["id"] in unpinnable,
            ("A REGISTERED FINDING WITH A REQUIRED CONTRACT IS NEITHER PINNED NOR DECLARED "
             "UNPINNABLE: the register states what this finding requires and the pin file "
             "says nothing about it either way, so whether the contracts answer it is not "
             "recorded anywhere (RC5-02)",
             _entry["id"], _contract[:160],
             {"names records or guards": _names_data,
              "note": "pin it, or add an `unpinnable` row. A finding whose required "
                      "contract asks for prose in a chapter is unpinnable BY NATURE and "
                      "its reason may say so -- `%s` -- which is why that reason is "
                      "refused for the ones that name data." % PROSE_CONTRACT_REASON}))
    if _names_data and _entry["id"] not in covered:
        checked(not unpinnable[_entry["id"]].strip().lower().startswith(PROSE_CONTRACT_REASON),
                ("A FINDING WHOSE CONTRACT NAMES REGISTERED DATA IS EXCUSED AS PROSE: the "
                 "required contract names a record or guard this package registers, so "
                 "the reason it cannot be pinned is not that it is prose. `%s` is the "
                 "cheap reason and it must not fit everything (RC5-02)"
                 % PROSE_CONTRACT_REASON,
                 _entry["id"], _names_data, unpinnable[_entry["id"]][:160]))
checked(len(out_of_reach) <= OUT_OF_REACH_CEILING,
        ("A REGISTERED FINDING WITH A REQUIRED CONTRACT IS OUT OF THIS RULE'S REACH: its id "
         "is in no family a pin may cite and its contract names no record and no guard this "
         "package registers, so the coverage rule above says nothing about it. That is a "
         "real boundary and it is COUNTED rather than skipped, because a `continue` is how "
         "a coverage check comes to have an empty required set (RC5-02)",
         {"out_of_reach": sorted(out_of_reach), "count": len(out_of_reach),
          "ceiling": OUT_OF_REACH_CEILING,
          "note": "if the new finding does ask for something this package holds, its "
                  "required contract should name the record or the guard and the rule "
                  "picks it up; if it does not, raise this ceiling deliberately."}))
# Rule 3 at the pin layer: every finding id these pins cite RESOLVES to a document that
# names it. A pin citing a finding nobody can find is a pin justified by nothing. Two
# resolvers, and neither is weaker than the rule this replaced: the swept corpus above, or
# an explicit `finding_sources` row whose file exists and mentions the id. Every declared
# row is checked whether or not the sweep already found it, so a source that rots is a
# failure even when the finding resolves elsewhere.
for finding in sorted(covered | set(unpinnable)):
    source = FINDING_SOURCES.get(finding)
    if source is None:
        checked(finding in swept_findings,
                ("a pin cites a finding that no swept document names and that names no "
                 "source of its own (RC5-02)", finding,
                 {"documents swept": len(FINDING_CORPUS),
                  "note": "add the id to `#/finding_sources` with the path of the review "
                          "that states it, or cite the finding the register actually "
                          "carries."}))
        continue
    document = ROOT.parents[2] / source
    checked(document.exists(), ("finding_sources names a file that does not exist", finding, source))
    checked(finding in document.read_text(encoding="utf-8"),
            ("finding_sources names a file that does not mention this finding", finding, source))

# --- RC-03: a criterion's `requires` sentence and its conjuncts must agree. ----
#
# They are independent fields of one spec and nothing compared them, so a criterion could
# state one requirement and demand another -- which is exactly what the recheck's weakened
# derivation produced: `requires` still read "that Fulfillment is currently `delivered`"
# over a body demanding none of it. Two halves of one statement, disagreeing, with every
# control green.
#
# Two rules, both mechanical:
#   PATHS  -- every field path the sentence names is named by some conjunct.
#   PHASES -- every phase name the sentence backticks that belongs to a RELATED record and
#             not to the subject's own lifecycle is bound by some `related_phases` state.
# The phase rule is narrowed to related records on purpose: a criterion's own phase is what
# the sentence is ABOUT, and a rule that flagged it would fire on the noun in every
# sentence. Waivers live in pinned-conjuncts.json, name the exact tokens they excuse, and
# so cannot cover the next one.
#
# RC2-03: WHAT THIS RULE READS IS A FORMATTING-DEPENDENT SUBSET OF THE SENTENCE, and the
# numbers belong beside the rule rather than in a review nobody re-opens. Re-derived on the
# committed corpus with the disjunction-aware walker above:
#
#   774  criteria examined
#     0  (0.0%) name a field path in `requires`  -> the PATHS rule, which is the half
#            RC-03's required contract named, has an applicable population of ZERO here.
#            It is not vacuous by construction -- r13-requires-promises-what-the-body-does-
#            not-demand adds a path and it fires -- but it asserts nothing about this tree.
#    19  (2.5%) name a backticked phase of a RELATED record, 22 tokens in all
#    17  of those 19 rely on a waiver, and all 17 waivers are in use
#     5  tokens across 2 criteria are bound by a conjunct: this is the rule's live force
#
# So PHASES carries RC-03 and PATHS carries none of it, and PHASES only sees BACKTICKED
# tokens. The recheck switched it off with three pairs of backticks: same sentence, same
# promise to a reader, invisible to the rule.
#
# Widening it was measured, not argued, and REJECTED: matching the phase vocabulary of
# related records unbackticked produces 425 findings across 266 of the 774 criteria (34%)
# over 62 tokens, already excluding every token a conjunct binds or a waiver excuses. They
# are English past participles used as verbs -- `recorded` 104, `required` 43, `current`
# 37, `admitted` 34, `assigned` 30 -- as in "the subject's own declared identity/scope
# fields are recorded". A waiver list of that size is a second corpus, and a rule that
# needs one teaches contributors to route around the checker. The narrow scope is recorded
# as the accepted limit in pinned-conjuncts.json#/requires_waivers_why, with the number,
# and the live half gets the negative control it never had:
# fixtures/negative/r14-requires-names-a-related-phase-no-conjunct-binds. The fixture that
# existed before it tested the half with zero population.
REQUIRES_WAIVERS = {entry["criterion"]: entry for entry in PINNED["requires_waivers"]}
for entry in PINNED["requires_waivers"]:
    checked(set(entry) == {"criterion", "phases", "why"}, ("requires waiver shape", entry))
    checked(entry["why"].strip() and entry["criterion"] in PREDICATES,
            ("a requires waiver with no reason, or for no such criterion", entry["criterion"]))

PROSE_PATH = re.compile(r"`(/[A-Za-z0-9_./\-]+)`|(?<![`\w])(/payload/[a-z_]+)")
PROSE_TOKEN = re.compile(r"`([a-z][a-z_\-]*)`")


def stated_paths_and_states(body, owner):
    """What the body DEMANDS -- not what it mentions.

    RC2-02's blind spot, second site, and it is why RC-03 was silent on the same mutation
    the pins were silent on: this walked every node regardless of context, so a
    `related_phases` binding moved inside an `any` still counted as a promise kept. It
    reads the same walker the pins do -- the SAME declaration table, not a copy of it --
    so the two halves of RC-03 and the pin table answer to one definition of "demanded"
    rather than to two that can drift.

    That sharing is why RC3-01 disabled BOTH controls with one mutation, and it is kept
    anyway: one definition that is wrong somewhere is repairable, and two definitions that
    disagree are the defect this package names in four other places. The repair goes into
    the definition.

    Measured on the committed corpus before changing it, because a narrowing that fails
    nothing may be a narrowing that does nothing: 774 criteria examined, the same 0
    failures under the disjunction rule, the quantifier rule and the value-slot rule
    alike. The 13 `any` nodes sit in bodies whose `requires` sentence names nothing only
    they carry, there are zero `forall` nodes, and zero boolean ops in value slots -- so
    all three buy no live assertion today and close the three routes probes 9, 4 and 4b
    took. The negative fixtures are what keep them from being narrowings that do nothing.
    """
    paths, states = set(), set()
    for entry in polarised_nodes(body, owner):
        if entry.disjoined or entry.quantifiers:
            continue
        # RC4-02, the same rule the pin loop applies, on the same walk. There is no row
        # here, so the condition is membership alone: a node sitting inside an operator
        # pinned-conjuncts.json does not admit says nothing this sentence may rely on.
        # Measured before adding it -- every ancestor chain the committed corpus reaches
        # this line with is drawn from `('all',)`, `('all','not')` and `('all','all')` --
        # so it refuses nothing today and closes the route a misdeclared primitive opens.
        if any(operator not in ADMISSIBLE for operator in entry.ancestors):
            continue
        if not entry.in_value:
            # RC3-02: `field_paths` and `bindings` belong to boolean ops, and one inside a
            # JsonValue slot is read as a value, not evaluated. Its bindings promise
            # nothing, so counting them would let `requires` name a phase that no conjunct
            # binds -- which is the whole of RC-03.
            paths.update(entry.node.get("field_paths") or [])
            for binding in entry.node.get("bindings") or []:
                paths.add(binding["field_path"])
                states.update(binding["states"])
        # A `path` read is a VALUE op and lives in a value slot by construction; the field
        # it names is demanded exactly when the predicate reading it is.
        if entry.node.get("op") == "path" and isinstance(entry.node.get("pointer"), str):
            paths.add(entry.node["pointer"])
    return paths, states


requires_examined = 0
for name, predicate in PREDICATES.items():
    if not name.startswith("criterion.") or predicate.get("content_gap_id"):
        continue
    sentence = predicate.get("requires")
    record_name = name.split(".")[1]
    if not sentence or record_name not in RECORDS:
        continue
    requires_examined += 1
    body_paths, body_states = stated_paths_and_states(predicate["body"], name)
    own_phases = set(RECORDS[record_name]["lifecycle"]["phases"])
    related_phases = set()
    for relation in RECORDS[record_name]["relations"]:
        for target in relation["targets"]:
            related_phases.update(RECORDS[target]["lifecycle"]["phases"])
    for match in PROSE_PATH.finditer(sentence):
        stated = match.group(1) or match.group(2)
        # Prefix either way: a sentence may name `/payload/external_burden_account` where
        # the conjunct reaches inside it, and naming the leaf is not naming less.
        checked(any(stated == known or known.startswith(stated + "/")
                    or stated.startswith(known + "/") for known in body_paths),
                ("RC-03: `requires` names a field path no conjunct demands", name, stated,
                 sorted(body_paths)))
    waived = set(REQUIRES_WAIVERS.get(name, {}).get("phases", []))
    for token in PROSE_TOKEN.findall(sentence):
        if token not in related_phases or token in own_phases or token in body_states:
            continue
        checked(token in waived,
                ("RC-03: `requires` names a related record's phase that no conjunct binds",
                 name, token,
                 "bind it in `related_phases`, or waive it by name in "
                 "pinned-conjuncts.json#/requires_waivers"))
# An instrument reports its denominator before its verdict: a narrowing that quietly
# examined six criteria would pass exactly as loudly as one that examined all of them.
checked(requires_examined >= 700,
        ("RC-03 examined almost no criteria; the rule cannot pass vacuously",
         requires_examined))

# --- THE WALKER'S OWN COVERAGE, AS A NUMBER. -----------------------------------
# Every rule above that says "demanded" means whatever this walk decided, so the walk's
# reach is the reach of the pin table and of RC-03 together. RC3-01 got through a walker
# that was RUNNING, reporting three conjuncts as demanded and saying nothing about the one
# operator it did not know -- so a future reviewer should be able to read the coverage off
# the verdict rather than reconstruct it with a mutation. Eight numbers and one set, and
# the SET is the one that would have shown RC3-01 as an absence: `forall` is not in it.
#
# The floors are LITERALS, well under the measured values, for the reason the pin floors
# are: a floor derived from the walk it measures is satisfied by a walk that stopped.
# Measured on the committed corpus: 4,282 predicate positions, 48 value positions, 9,882
# slots classified against the table, 34 distinct operators, 0 refused, 0 under a
# quantifier. The walk covers the 25 pinned bodies and the 774 criteria RC-03 examines,
# not all 2,276 predicates -- which is why these numbers are a third of the whole-registry
# sweep quoted in the walker above, and the two are not the same measurement.
CONJUNCT_WALK = {key: (sorted(value) if isinstance(value, set) else value)
                 for key, value in WALK_CENSUS.items()}
checked(WALK_CENSUS["predicate_positions"] >= 3500,
        ("the demand walk covered almost no predicate positions; every 'demanded' above "
         "is a claim about what this walk reached, and a walk that reached nothing leaves "
         "RC-03's phase rule asserting nothing AT ALL -- quietly, unlike the pins",
         {"predicate_positions": WALK_CENSUS["predicate_positions"], "floor": 3500}))
checked(WALK_CENSUS["slots_classified"] >= 8000,
        ("the demand walk classified almost no argument slots against the table; the "
         "closed table is only closed over what it is asked about",
         {"slots_classified": WALK_CENSUS["slots_classified"], "floor": 8000}))
checked(len(WALK_CENSUS["operators"]) >= 20,
        ("the demand walk met almost no distinct operators", sorted(WALK_CENSUS["operators"])))

# --- R-X02: the alias table, and the refusal that makes it a contract. ---------
#
# Four of the five F2 candidates proposed RENAMING existing registry records. Nothing is
# renamed; aliases.json publishes every candidate-era name against its registry name, and
# the load-bearing half is the refusal: a candidate-era name is never admitted AS a record
# name. Both directions are checked, because a table whose keys drifted into the registry
# would read as a migration while naming records that exist, and a table whose values
# drifted out would resolve a candidate name to nothing.
ALIASES = FILES["aliases.json"]
checked(set(ALIASES) == {"schema_version", "kind", "why", "how_to_read", "checked_by",
                         "not_aliases", "floor", "floor_why", "aliases", "sources"},
        ("alias table shape", sorted(ALIASES)))
alias_table = ALIASES["aliases"]
checked(isinstance(alias_table, dict) and alias_table, "the alias table is empty")
checked(len(alias_table) >= ALIASES["floor"],
        ("the alias table has shrunk below its declared floor; a table with no aliases "
         "refuses nothing and passes exactly as loudly as a full one",
         {"aliases": len(alias_table), "floor": ALIASES["floor"]}))
# F6A-09 extends the refusal below to the VALUE registry, and the reason is the whole
# finding: the declared check compared alias keys against RECORD names only, so
# `ConsequenceVector -> ConsequenceDerivation` passed it -- `ConsequenceVector` is a
# registered VALUE type, live in a fixed-boundary chapter, and the row pointed a reader at a
# per-operation derivation record when they were looking up a grant's consequence bounds.
# Two different objects, and the table said they were one. A name this package HAS is not a
# candidate-era name whatever registry holds it.
#
# The finding's other option -- extend the check to backticked identifiers in the
# specification prose -- is NOT taken, and this is a judgement, not an omission. It would
# refuse `CapacityState`, which `05` section 7 uses normatively; and `CapacityState`'s row
# must stay, because its mapping is substantively correct and F6D-10 withdrew half a finding
# on the ground that the row exists. So the two halves of that required contract point in
# opposite directions on the only two keys it was raised about. The false sentence in
# `how_to_read` is what is repaired for that key --- the prose claimed something untrue of
# its own table, which is the defect a reader actually hits.
ALIAS_VALUE_NAMES = set(FILES["value-registry.json"])
for candidate_name, registry_name in alias_table.items():
    checked(candidate_name not in RECORDS,
            ("a candidate-era name is ALSO a record name, so the registry admits the very "
             "name this table exists to refuse (R-X02)", candidate_name))
    checked(candidate_name not in ALIAS_VALUE_NAMES,
            ("A CANDIDATE-ERA NAME IS A REGISTERED VALUE TYPE: the refusal below compares "
             "alias keys against RECORD names and is satisfied by a key that names a live "
             "VALUE. That is how F6A-09 happened -- `ConsequenceVector` is declared by "
             "`Grant.payload.consequence_bounds` and defined in a fixed-boundary chapter, and "
             "the table mapped it to a per-operation derivation record, a DIFFERENT OBJECT. "
             "A name this package HAS is not a candidate-era name, whichever registry holds "
             "it (F6A-09)", candidate_name,
             {"maps to": registry_name,
              "note": "if the name is genuinely not an alias, it belongs in `not_aliases` "
                      "with the reason, not in the table with a mapping"}))
    checked(registry_name in RECORDS,
            ("an alias resolves to no registry record, so reading through it reaches "
             "nothing", candidate_name, registry_name))
    checked(candidate_name != registry_name, ("alias maps to itself", candidate_name))
for excluded, reason in ALIASES["not_aliases"].items():
    checked(excluded not in alias_table and reason.strip(),
            ("a name is both excluded from the table and in it, or excluded with no "
             "reason", excluded))

# --- capabilities.json records the chapter contract versions, and they must AGREE. ---
#
# The F2 join bumped eight chapter contract versions and capabilities.json still carried
# the versions before them, so the same contract had two version numbers in two files and
# nothing compared them. That is the defect this package names in four other places, in
# its smallest possible form. The chapter header is the authority; capabilities.json's
# `selected_contracts` rows follow it.
CHAPTER_VERSION_HEAD = re.compile(
    r"\*\*(?:Contract|Specification version):\*\*\s*(.+?)\s*(?:·|—|\n)")
# A closed exemption table, for the one row whose `version` is not a chapter version at
# all. Declare what is read and refuse the rest: a file this checker cannot parse and
# cannot excuse is a failure, not a silent skip.
CHAPTER_VERSION_EXEMPT = {
    "03-company-capabilities.md":
        "the row's `version` is the CAP-01–46 record-and-procedure contract id "
        "(`company.cap01–46.v1`), not this chapter's specification version, which is "
        "COMPANY-1.0 in its own header. Two different objects; comparing them would be "
        "a false equality.",
}


def chapter_contract_version(relative_path):
    """The contract version a chapter's own header declares, or None."""
    document = ROOT.parent / relative_path
    if not document.exists():
        return None
    head = "\n".join(document.read_text(encoding="utf-8").splitlines()[:8])
    found = CHAPTER_VERSION_HEAD.search(head)
    return found.group(1).strip() if found else None


CAPABILITIES = json.loads((ROOT.parent / "capabilities.json").read_text(encoding="utf-8"))
version_rows, exemptions_used = 0, set()
for route in CAPABILITIES["fulfillment_routes"].values():
    for row in route.get("selected_contracts", []):
        chapter = row["location"].split("#")[0]
        if chapter in CHAPTER_VERSION_EXEMPT:
            exemptions_used.add(chapter)
            continue
        declared = chapter_contract_version(chapter)
        checked(declared is not None,
                ("capabilities.json names a contract whose chapter header this checker "
                 "cannot read, and it is not excused", chapter, row["version"]))
        # A compound row (`IC1.0.1 / N-CLAUDE-SUPPLIED/v1`) records the chapter contract
        # FIRST and a native profile after it; the chapter half is the half this compares.
        checked(row["version"].split(" / ")[0] == declared,
                ("capabilities.json records a contract version its chapter does not "
                 "declare", chapter,
                 {"capabilities.json": row["version"], "chapter header": declared}))
        version_rows += 1
checked(exemptions_used == set(CHAPTER_VERSION_EXEMPT),
        ("a chapter is excused from the version comparison and no row uses the "
         "exemption", sorted(set(CHAPTER_VERSION_EXEMPT) - exemptions_used)))
checked(version_rows >= 14,
        ("the chapter-version comparison examined almost no rows; a comparison with an "
         "empty population passes vacuously", version_rows))


# --- RC4-03: THE FIXTURE SUITE'S FLOORS. LITERALS, AND CHECKED IN EVERY RUN. ---
#
# RC-04 gave the negative suite a DECLARED denominator, so a fixture deleted from the tree
# alone fails. It did not give it a FLOOR, so a fixture deleted from the tree AND the
# manifest passes -- one hand writes both and the pair agrees with itself. The fourth
# recheck measured it: 34 of 36 fixtures moved out of `fixtures/negative/` and removed from
# MANIFEST.json in one edit, full run, exit 0 at 50.6 s, `checks: 288620` -- byte-identical
# to the baseline and to every `conjunct_walk` field. The only number that moved was
# `negative_fixtures_rejected: 36 -> 2`, and nothing compared it to anything. That matters
# most here of all places, because the control that catches RC4-01 IS a fixture.
#
# This is the argument pinned-conjuncts.json's own floors are written from, applied to the
# other table: literal floors of 25/44/6 exist because "an author could satisfy [the
# coverage check] by moving all 25 pins into `unpinnable` one reason at a time". Replace
# "pins" with "fixtures" and "unpinnable" with "MANIFEST.json" and the sentence is
# unchanged.
#
# RAISE THESE WHENEVER FIXTURES ARE ADDED. Never lower one without writing the reason in
# this comment; a floor that drifts down with the suite is the denominator again.
#   negative: 53 at the fourth recheck, 56 before R18, 91 now -- +35 for the Step 6 repair
#             of the F2 layer, one adverse case per contracts finding of the four reviews
#             plus one per guard that had no adverse fixture of its own.
#   negative: 92 -> 94 and positive 53 -> 55 (RC5-01, RC5-03): one adverse and one
#             benign fixture for the admissible-ancestor literal and for the
#             not-admitted block.
#   negative: 94 -> 95 and positive 55 -> 56 (RC5-02): the pin-coverage pair.
#   negative: 95 -> 96 and positive 56 -> 57 (F6A-10): the closed-enum membership
#             pair -- one adverse removing a member, one benign reordering them.
#   negative: 96 -> 97 and positive 57 -> 58 (F6D-12): the seventh-reason pair.
#   negative: 97 -> 98 and positive 58 -> 59 (F6D-09): the predicate-bearing type
#             pair -- one adverse untyping a field, one benign reordering an enum.
#   negative: 98 -> 99 and positive 59 -> 60 (F6C-11): the retention-comparison pair.
#   negative: 99 -> 100 and positive 60 -> 61 (F6C-10): the attempt-ceiling pair.
#   negative: 100 -> 101 and positive 61 -> 62 (F6D-09, the wrong_reason repair):
#   the predicate-implementation-status pair. The adverse case gives one predicate a
#   genuine second classification and must trip the F6D-09 tripwire; the benign case
#   gives one predicate the NEGATIVE-FIXTURE SENTINEL and must not, because that is
#   the exclusion which stopped r3-lifecycle-status-as-judgment-subject being refused
#   by a check it was not written for.
#   negative: 101 -> 103 and positive 62 -> 64 (F6X-02): the boundary-kind pair and the
#   contested-refs pair. Both adverse cases are a one-line edit to a JSON list -- a ninth
#   member added, a required field struck -- and both benign twins are a reordering of the
#   same list, because a control that cannot tell a widening from a reordering is one
#   contributors learn to route around.
#   negative: 103 -> 105 and positive 64 -> 66 (F6X-01): the exclusive-factory resolution
#   pair and the kernel-exemption pair. The second pair is not optional -- the repair adds an
#   exemption, and an exemption whose edge no fixture holds is the hole it was meant to close.
#   negative: 105 -> 106 and positive 66 -> 67 (F6A-09): the alias-key-is-a-value-type pair.
#   The adverse case is the real row the review found, restored.
#   positive: 17 before R18, 52 now. The pairing rule that set 17 -- one benign case per
#             adverse case of selection-record section 12.5 -- now also covers every guard,
#             because F6C-16 measured 14 of 30 with a pair and a suite that refuses
#             everything passes every adverse row.
NEGATIVE_FIXTURE_FLOOR = 106
POSITIVE_FIXTURE_FLOOR = 67
# Read OUTSIDE the fixture-run guard below, so a negative fixture can express this. The
# recheck said one could not -- "it is a property of the tree the runner is invoked in" --
# and that is true of the RATCHET, which compares the tree to the manifest and needs both.
# It is not true of the FLOOR, which is a property of the manifest alone. The scratch tree
# each fixture runs in now carries the two MANIFEST.json files as symlinks for exactly this
# reason, and r17-manifest-shrunk-below-floor patches one of them.
for _kind, _floor in (("negative", NEGATIVE_FIXTURE_FLOOR), ("positive", POSITIVE_FIXTURE_FLOOR)):
    _manifest_path = ROOT / "fixtures" / _kind / "MANIFEST.json"
    checked(_manifest_path.exists(),
            ("a fixture manifest is missing; it declares how many controls must run, and "
             "without it a suite that lost all but one of them reports a pass (RC-04)",
             str(_manifest_path)))
    _manifest = json.loads(_manifest_path.read_text(encoding="utf-8"))
    # The floor is a LITERAL here AND in the manifest, and the two are compared. A ratchet
    # whose budget is read only from the file it measures moves when that file moves, which
    # is the defect the pin floors are written as literals to avoid.
    checked(_manifest.get("floor") == _floor,
            ("a fixture manifest's declared floor differs from the literal in "
             "validate_contracts.py; one of the two was edited alone, and the whole point "
             "of keeping both is that lowering a floor takes two edits a reviewer sees",
             _kind, {"manifest_floor": _manifest.get("floor"), "validator_floor": _floor}))
    checked(bool(str(_manifest.get("floor_why", "")).strip()),
            ("a fixture manifest declares a floor with no reason", _kind))
    checked(len(_manifest["fixtures"]) >= _floor,
            ("THE FIXTURE SUITE HAS SHRUNK BELOW ITS FLOOR: fixtures removed from the tree "
             "AND from MANIFEST.json in one edit leave the declared count agreeing with "
             "itself, and the verdict byte-identical except for one integer nothing "
             "compares (RC4-03). The control that catches a mutation of the demand table "
             "is itself a fixture",
             _kind, {"declared": len(_manifest["fixtures"]), "floor": _floor,
                     "note": "raising a floor is an edit to MANIFEST.json and to "
                             "validate_contracts.py; lowering one is that plus a written "
                             "reason in the constant's comment."}))
NEGATIVE_FIXTURES_DECLARED = len(json.loads(
    (ROOT / "fixtures" / "negative" / "MANIFEST.json").read_text(encoding="utf-8"))["fixtures"])
POSITIVE_FIXTURES_DECLARED = len(json.loads(
    (ROOT / "fixtures" / "positive" / "MANIFEST.json").read_text(encoding="utf-8"))["fixtures"])

# --- Negative control. --------------------------------------------------------
# Everything above passing proves nothing on its own: this file returned
# {"status":"passed"} on the tree an independent review then found seven defects in.
# Each repair ships a counterexample that MUST be rejected, and a fixture that
# passes fails the build here.
#
# CONTRACTS_FIXTURE_RUN is set by the runner in each scratch tree. Without it this
# stage would recurse: the validator runs the fixtures, each of which runs the
# validator, forever.
FIXTURES_RUN = None
FIXTURES_PASSED = None
if not os.environ.get("CONTRACTS_FIXTURE_RUN"):
    import subprocess
    # RC2-01, asked BEFORE the suite runs because it is a question about the TREE rather
    # than about the registries: is `fixtures/negative` -- the directory this file takes
    # both its count and, three checks down, its declared denominator from -- actually in
    # the tree this file is in. The recheck measured what happens when it is not: pointed
    # at a directory holding one fixture and a manifest declaring one, the suite printed
    # `{"fixtures": 1, "declared": 1, "passed_as_required": 1}` and exited 0, and both
    # comparisons below agreed with themselves because MANIFEST.json travels with the
    # directory it measures.
    #
    # The assertion is made in two places on purpose, and they are not the same assertion:
    # this one is about the tree validate_contracts.py was pointed at, the runner's own
    # guard is about the tree the RUNNER was pointed at, and a symlinked `tools/` is
    # exactly how those two come apart (RC-05).
    for component in (ROOT / "fixtures", ROOT / "fixtures" / "negative"):
        checked(not component.is_symlink(),
                ("RC2-01: a fixture directory is a symlink, so the negative-control count "
                 "and the MANIFEST.json declaring it both describe a tree other than this "
                 "one", str(component)))
    # And the guard itself is asserted rather than assumed. It cannot be a negative
    # fixture -- a fixture is a mutation of the registries judged by this file, and this is
    # a property of the directory layout the runner is invoked in -- so the runner builds
    # the two trees itself and reports on both. Costs ~0.1 s and runs no fixture.
    guard = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "run_negative_fixtures.py"), "--self-test"],
        capture_output=True, text=True)
    checked(guard.returncode == 0,
            ("the negative-fixture runner's symlink guard does not refuse a symlinked "
             "fixtures/negative, or refuses a real one too (RC2-01)",
             guard.stdout[-1500:] + guard.stderr[-1500:]))
    completed = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "run_negative_fixtures.py")],
        capture_output=True, text=True,
        env={**os.environ, "CONTRACTS_FIXTURE_RUN": "1"})
    # RC2-04. The runner exits 1 for two unrelated reasons and both used to surface under
    # the message for one of them. A COUNT MISMATCH -- a fixture deleted while
    # MANIFEST.json still declares it, or present and undeclared -- was reported as "a
    # negative fixture was not rejected; the check it names is gone", which sends a reader
    # to look for a control that stopped working when what happened is that a control is
    # missing. The dedicated comparison below cannot correct it, because it is unreachable
    # in that case: the runner refuses BEFORE running a single fixture, so the generic
    # wrapper fires first and the ratchet message never renders. The correct detail was
    # attached and nothing was lost -- but the first line named the wrong failure, and
    # this file argues in four other places that a message should name the control that
    # actually did the refusing.
    #
    # The headline is declared here and asserted to still exist in the runner that prints
    # it. A branch on a string the other side has renamed is a branch nothing takes, and
    # it fails by falling back to exactly the wrong message this check exists to stop.
    FIXTURE_RATCHET = "negative fixture count ratchet (RC-04)"
    runner_source = (ROOT / "tools" / "run_negative_fixtures.py").read_text(encoding="utf-8")
    checked(FIXTURE_RATCHET in runner_source,
            ("the ratchet headline this file branches on is not in the runner that prints "
             "it", FIXTURE_RATCHET))
    # RC3-03, and asserted for exactly the reason above: the leak detail below reads a
    # STRUCTURED per-fixture reason out of the runner, and a runner that stopped emitting
    # one would leave this file attaching nothing at all -- which is worse than the blind
    # tail it replaces, because it would be silent rather than truncated.
    LEAK_RECORD = 'LEAK_RECORD_KEYS = ("id", "kind", "reason")'
    checked(LEAK_RECORD in runner_source,
            ("the runner no longer declares a per-fixture leak reason, so the detail this "
             "file attaches when a fixture leaks would name the fixture and not the "
             "reason (RC3-03), or no longer declares the KIND this file chooses its "
             "headline by (RC4-05)", LEAK_RECORD))
    LEAK_KINDS_DECLARED = ('LEAK_KINDS = ("passed", "wrong_reason", "never_ran", '
                           '"id_mismatch")')
    checked(LEAK_KINDS_DECLARED in runner_source,
            ("the runner no longer declares the closed set of leak kinds this file has "
             "sentences for (RC4-05)", LEAK_KINDS_DECLARED))
    # The report is found by a declared MARKER, not by the last `{` in the transcript.
    # `stdout.rindex("{")` worked only while every value in the report was a scalar: a
    # leak `reason` is a validator AssertionError and those carry dicts, so the last `{`
    # became one inside a leak record and the decode failed. This file then reported that
    # the runner had produced no per-fixture result -- about a list it was holding. Caught
    # by reproducing the recheck's probe 7c against the repair, not by reading it.
    REPORT_MARKER = "--- negative fixture report (JSON follows) ---"
    checked(REPORT_MARKER in runner_source,
            ("the report marker this file parses by is not in the runner that prints it, "
             "so every branch below would take the no-report arm", REPORT_MARKER))
    marker_at = completed.stdout.rfind(REPORT_MARKER)
    try:
        runner_said = (None if marker_at < 0 else
                       json.loads(completed.stdout[marker_at + len(REPORT_MARKER):]))
    except ValueError:
        # No report at all: the runner refused before reporting -- a symlinked tree, a
        # missing manifest, a duplicate id. The generic check below names it, which is
        # right, because those refusals print their own sentence.
        runner_said = None
    ratchet = (runner_said if isinstance(runner_said, dict)
               and runner_said.get("check") == FIXTURE_RATCHET else None)
    checked(ratchet is None,
            ("the tree and fixtures/negative/MANIFEST.json disagree about which negative "
             "fixtures exist (RC-04), and NO fixture was run: a declared fixture that is "
             "absent is a control someone deleted, and one present but undeclared is a "
             "control the denominator does not know about", ratchet))
    # RC3-03. This detail used to be `completed.stdout[-2000:]` -- a blind tail of a
    # transcript carrying one line per fixture. With 33 fixtures the FIRST fixture's
    # `[FAIL] ... failed for the wrong reason; expected ...` line falls outside 2,000
    # characters and is gone: measured by the recheck on its probe 7c, `failed for the
    # wrong reason` occurred ZERO times in this file's entire output while the headline
    # said the fixture "was not rejected". It WAS rejected, by a different check, and the
    # sentence that would have corrected that is the one the slice threw away. That is the
    # same defect RC2-04 was written to fix -- a message naming the wrong control -- one
    # layer down. The runner has carried the reason per fixture all along; this reads it
    # rather than slicing bytes, so the detail cannot depend on where a fixture sorts.
    #
    # RC4-05 is the layer above that, and it is the same defect once more: the DETAIL was
    # corrected and the HEADLINE was not. Two measured leaks, two different truths, one
    # sentence -- a fixture that passed validation (the check IS gone) and a fixture that
    # was rejected by a different check (it was NOT "not rejected", and the check it names
    # is NOT gone) both printed "a negative fixture was not rejected; the check it names is
    # gone". RC2-04 split COUNT MISMATCH out of this same headline for this same reason and
    # gave it a dedicated branch; the leak arm still carried the rest. The runner knows
    # which kind each leak is and always did. These are its sentences, one per kind, and an
    # unknown kind is refused rather than printed over.
    LEAK_HEADLINES = {
        "passed": "A NEGATIVE FIXTURE WAS NOT REJECTED: the validator accepted the "
                  "mutation, so the check that fixture exists to exercise is GONE",
        "wrong_reason": "A NEGATIVE FIXTURE WAS REJECTED BY A DIFFERENT CHECK than the one "
                        "it exists to exercise, so THAT CHECK IS UNPROVEN. It WAS rejected "
                        "and the check it names is not necessarily gone -- read the "
                        "`reason` below, which carries what actually fired",
        "never_ran": "A NEGATIVE FIXTURE COULD NOT BE RUN: it never reached the validator, "
                     "so it is a control that did not execute rather than one that passed. "
                     "Other fixtures in the same run may have reported [ok]; this says "
                     "nothing about them (RC4-06)",
        "id_mismatch": "A NEGATIVE FIXTURE'S OWN ID DISAGREES with the file the manifest "
                       "names it by, so the denominator and the tree are counting "
                       "different things",
    }
    if isinstance(runner_said, dict) and runner_said.get("leaked"):
        leaked = runner_said["leaked"]
        kinds = [kind for kind in LEAK_HEADLINES if any(record.get("kind") == kind
                                                        for record in leaked)]
        unknown = sorted({record.get("kind") for record in leaked} - set(LEAK_HEADLINES))
        # A kind with no sentence must not borrow another kind's. Refused here, loudly,
        # rather than folded into whichever headline happened to be first.
        checked(not unknown,
                ("the runner reported a leak kind this file has no sentence for, so the "
                 "headline below would describe it as something else (RC4-05)", unknown,
                 sorted(LEAK_HEADLINES)))
        headline = " || ".join(LEAK_HEADLINES[kind] for kind in kinds)
        leak_detail = {"leaked": leaked,
                       "kinds": kinds,
                       "fixtures": runner_said.get("fixtures"),
                       "passed_as_required": runner_said.get("passed_as_required")}
    else:
        # The runner exited non-zero without naming a fixture, so there is no per-fixture
        # reason to read: it refused before running one, or it died. Its own sentence is
        # the only thing there is, and it is the LAST thing printed rather than the first.
        #
        # RC4-06 narrowed what reaches here. An exception inside run_fixture used to kill
        # the suite mid-run and land on this arm, so this sentence was printed over a run
        # in which seventeen fixtures had already reported [ok] -- and the transcript tail
        # beside it is the blind tail RC3-03 exists to replace. The runner now records a
        # raise as that fixture's own `never_ran` leak and keeps going, so this arm is once
        # again only the refusal-before-any-fixture case its sentence describes.
        headline = ("THE NEGATIVE SUITE PRODUCED NO PER-FIXTURE RESULT: it refused before "
                    "running a fixture, or it died in a way the per-fixture handler does "
                    "not cover. No fixture's verdict can be read from this run")
        leak_detail = {"leaked": None,
                       "why_no_leak_list": "the runner reported no per-fixture result; it "
                                           "refused before running a fixture, or died",
                       "runner_tail": completed.stdout[-2000:] + completed.stderr[-2000:]}
    checked(completed.returncode == 0, (headline, leak_detail))
    FIXTURES_RUN = runner_said
    checked(FIXTURES_RUN["fixtures"] > 0, "refusing a vacuous pass with zero negative fixtures")
    # RC-04: `> 0` is not a count. With 1 of 27 fixtures present this block reported
    # `negative_fixtures_rejected: 1` and exited 0 -- the suite lost 96% of its coverage
    # and the verdict did not move. The denominator is DECLARED, in the tree, and read
    # here rather than taken from the runner's own tally, so a runner that miscounts and
    # a tree that lost a fixture are two different failures with two different messages.
    declared_fixtures = json.loads(
        (ROOT / "fixtures" / "negative" / "MANIFEST.json").read_text())["fixtures"]
    checked(FIXTURES_RUN["fixtures"] == len(declared_fixtures),
            ("negative fixture count differs from fixtures/negative/MANIFEST.json",
             {"declared": len(declared_fixtures), "ran": FIXTURES_RUN["fixtures"]}))
    checked(FIXTURES_RUN["passed_as_required"] == len(declared_fixtures),
            ("a declared negative fixture was not rejected",
             {"declared": len(declared_fixtures),
              "rejected": FIXTURES_RUN["passed_as_required"]}))

    # --- Positive control. The other half of the pairing rule. ------------------
    #
    # Everything above proves this file can say NO. It cannot distinguish a checker that
    # refuses the seventeen adverse cases from one that refuses everything, and a checker
    # that refuses everything passes every adverse row -- so an adverse count read on its
    # own is not a detection rate. The acceptance protocol's pairing rule and X17's
    # false-exclusion requirement say it plainly: BOTH NUMBERS ARE REPORTED OR NEITHER IS.
    #
    # Each benign fixture is the registry edit its paired adverse case's benign column
    # implies, and this file fails when one of them is REJECTED.
    for component in (ROOT / "fixtures" / "positive",):
        checked(not component.is_symlink(),
                ("a positive-fixture directory is a symlink, so the benign count and the "
                 "MANIFEST.json declaring it both describe a tree other than this one",
                 str(component)))
    POSITIVE_RATCHET = "positive fixture count ratchet (R16)"
    POSITIVE_MARKER = "--- positive fixture report (JSON follows) ---"
    positive_source = (ROOT / "tools" / "run_positive_fixtures.py").read_text(encoding="utf-8")
    for declared_constant in (POSITIVE_RATCHET, POSITIVE_MARKER,
                              'FAILURE_RECORD_KEYS = ("id", "reason")'):
        checked(declared_constant in positive_source,
                ("a constant this file branches on is not in the positive runner that "
                 "prints it, so the branch below is one nothing takes", declared_constant))
    positive = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "run_positive_fixtures.py")],
        capture_output=True, text=True,
        env={**os.environ, "CONTRACTS_FIXTURE_RUN": "1"})
    positive_at = positive.stdout.rfind(POSITIVE_MARKER)
    try:
        positive_said = (None if positive_at < 0 else
                         json.loads(positive.stdout[positive_at + len(POSITIVE_MARKER):]))
    except ValueError:
        positive_said = None
    positive_ratchet = (positive_said if isinstance(positive_said, dict)
                        and positive_said.get("check") == POSITIVE_RATCHET else None)
    checked(positive_ratchet is None,
            ("the tree and fixtures/positive/MANIFEST.json disagree about which benign "
             "fixtures exist, or the declared count fell below its floor, and NO benign "
             "fixture was run", positive_ratchet))
    positive_detail = ({"falsely_excluded": positive_said["falsely_excluded"],
                        "fixtures": positive_said.get("fixtures")}
                       if isinstance(positive_said, dict)
                       and positive_said.get("falsely_excluded")
                       else {"falsely_excluded": None,
                             "why_no_list": "the positive runner reported no per-fixture "
                                            "result; it refused before running one, or died",
                             "runner_tail": positive.stdout[-2000:] + positive.stderr[-2000:]})
    checked(positive.returncode == 0,
            ("A BENIGN FIXTURE WAS REJECTED. This is a FALSE EXCLUSION: the control "
             "refuses more than the adverse case it was written for, so the adverse count "
             "above cannot be read as a detection rate", positive_detail))
    POSITIVE_RUN = positive_said
    declared_positive = json.loads(
        (ROOT / "fixtures" / "positive" / "MANIFEST.json").read_text())
    checked(POSITIVE_RUN["fixtures"] == len(declared_positive["fixtures"]),
            ("positive fixture count differs from fixtures/positive/MANIFEST.json",
             {"declared": len(declared_positive["fixtures"]),
              "ran": POSITIVE_RUN["fixtures"]}))
    checked(POSITIVE_RUN["passed_as_required"] == len(declared_positive["fixtures"]),
            ("a declared benign fixture did not pass",
             {"declared": len(declared_positive["fixtures"]),
              "passed": POSITIVE_RUN["passed_as_required"]}))
    # The floor itself is checked above, outside this guard, beside the negative one --
    # RC4-03 gave the two suites one rule and one place, because the argument for a literal
    # floor beside a hand-written denominator is the same argument in both directions. This
    # line is what remains of it here: the pairing rule that SETS 17 is about this suite in
    # particular, so it is stated where the benign run is judged.
    checked(len(declared_positive["fixtures"]) >= POSITIVE_FIXTURE_FLOOR,
            ("the benign suite has shrunk below one paired case per adverse case of "
             "selection-record section 12.5; a pairing rule with fewer benign cases than "
             "adverse ones reports one number of the two it requires",
             {"declared": len(declared_positive["fixtures"]),
              "manifest_floor": declared_positive["floor"],
              "floor": POSITIVE_FIXTURE_FLOOR}))
    FIXTURES_PASSED = POSITIVE_RUN["passed_as_required"]

# --- RC4-07: THE VERDICT MUST CARRY ITS OWN INSTRUMENT. -----------------------
#
# Probe 5b of the fourth recheck replaced the whole CONJUNCT_WALK block and its three
# floors with a literal, in the copy of this file the scratch tree runs. Exit 0, 288,606
# checks -- exactly 3 below the null control, which is the three floors -- and the verdict
# printed `"conjunct_walk": {"DELETED": ...}`. Nothing in this package reads this file's
# own text, and the asymmetry is the point: this file asserts three strings in
# run_negative_fixtures.py precisely so a rename there cannot silently disarm a branch it
# takes, and no assertion ran in the other direction.
#
# Checked HERE, on the object about to be printed, and deliberately NOT inside the block
# it is about: a check that sits inside what it measures is removed by the same edit. The
# census is offered as evidence that the closed table did its work -- it is evidence only
# while it is there, and the verdict is where a reader looks for it. This does not make the
# file self-verifying and does not pretend to: anyone editing the checker is editing the
# checker. It makes ONE deletion cost more than three checks and a plausible-looking pass.
CENSUS_KEYS = {"predicate_positions", "value_positions", "slots_classified", "refused",
               "under_quantifier", "under_disjunction", "under_negation", "operators"}

# --- RC5-01 + RC5-02: EVERY HAND-WRITTEN CONTROL, COUNTED, IN ONE BLOCK. --------
#
# The fifth recheck found two unbudgeted hand-written tables by reading the file for them.
# It found them because they were the two that DID NOT APPEAR IN THE VERDICT -- every other
# budget in the package prints its count beside its floor, and those two printed nothing.
# So the honest instrument is not another floor: it is one block naming EVERY hand-written
# control, its count, the literal that bounds it and the file it lives in, so a reviewer
# reads a list rather than reconstructs one. A control absent from this block is a control
# nobody was told to look for, and a missing key FAILS below.
#
# `floor` is a lower bound, `ceiling` an upper one, `literal` an exact set. `file` is where
# the DATA is; every bound named here is a literal in validate_contracts.py, which is the
# terminal rule of this lineage -- widening any of them is an edit to the checker.
HAND_WRITTEN_CONTROL_KEYS = {"pins", "require_rows", "pinned_transitions",
                             "pinned_attachments", "finding_sources", "unanswered_findings",
                             "out_of_reach_findings", "disjoined_rows", "admissible_ancestors",
                             "argument_positions_digest", "negative_fixtures",
                             "positive_fixtures", "demand_walk_census"}
HAND_WRITTEN_CONTROLS = {
    "pins": {"count": len(PINNED["pins"]), "floor": PIN_FLOOR,
             "file": "pinned-conjuncts.json#/pins"},
    "require_rows": {"count": sum(len(pin["require"]) for pin in PINNED["pins"]),
                     "floor": PIN_ROW_FLOOR, "file": "pinned-conjuncts.json#/pins/*/require"},
    "pinned_transitions": {"count": len(PINNED["pinned_transitions"]),
                           "floor": PIN_TRANSITION_FLOOR,
                           "file": "pinned-conjuncts.json#/pinned_transitions"},
    "pinned_attachments": {"count": len(ATTACHMENTS), "floor": PIN_ATTACHMENT_FLOOR,
                           "file": "pinned-conjuncts.json#/pinned_attachments"},
    "finding_sources": {"count": len(FINDING_SOURCES), "floor": FINDING_SOURCE_FLOOR,
                        "file": "pinned-conjuncts.json#/finding_sources"},
    "unanswered_findings": {"count": len(unanswered), "ceiling": UNANSWERED_CEILING,
                            "file": "pinned-conjuncts.json#/finding_sources minus the pins"},
    "out_of_reach_findings": {"count": len(out_of_reach), "ceiling": OUT_OF_REACH_CEILING,
                              "file": "registers/review-findings.json"},
    "disjoined_rows": {"count": len(disjoined_rows), "ceiling": 4,
                       "file": "pinned-conjuncts.json#/pins/*/require/*/disjoined"},
    "admissible_ancestors": {"count": len(ADMISSIBLE_LITERAL),
                             "literal": {_operator: _rule["admits"]
                                         for _operator, _rule in sorted(ADMISSIBLE_LITERAL.items())},
                             "file": "validate_contracts.py#ADMISSIBLE_LITERAL, declared in "
                                     "pinned-conjuncts.json#/admissible_ancestors"},
    "argument_positions_digest": {"count": len(ARGUMENT_POSITIONS),
                                  "literal": PINNED["argument_positions_digest"],
                                  "file": "pinned-conjuncts.json#/argument_positions_digest"},
    "negative_fixtures": {"count": NEGATIVE_FIXTURES_DECLARED, "floor": NEGATIVE_FIXTURE_FLOOR,
                          "file": "fixtures/negative/MANIFEST.json"},
    "positive_fixtures": {"count": POSITIVE_FIXTURES_DECLARED, "floor": POSITIVE_FIXTURE_FLOOR,
                          "file": "fixtures/positive/MANIFEST.json"},
    "demand_walk_census": {"count": WALK_CENSUS["slots_classified"], "floor": 8000,
                           "file": "validate_contracts.py#WALK_CENSUS, printed as "
                                   "`conjunct_walk`"},
}
VERDICT = {"status":"passed","hand_written_controls":HAND_WRITTEN_CONTROLS,"checks":COUNT,"records":len(RECORDS),"values":len(INVENTORY["canonical_values"]),"commands":len(COMMANDS),"predicates":len(PREDICATES),"edges":len(all_edges),"conjunct_walk":CONJUNCT_WALK,"source_work_edges":len(INVENTORY["source_work_edges"]),"required_subjects":46,"negative_fixtures_rejected":FIXTURES_RUN and FIXTURES_RUN["passed_as_required"],"negative_fixtures_declared":NEGATIVE_FIXTURES_DECLARED,"negative_fixture_floor":NEGATIVE_FIXTURE_FLOOR,"positive_fixtures_passed":FIXTURES_PASSED,"positive_fixtures_declared":POSITIVE_FIXTURES_DECLARED,"positive_fixture_floor":POSITIVE_FIXTURE_FLOOR,"limits":"Offline schema/ref/AST/source-inventory/registry checks plus paired negative and positive fixtures. No production handler, source truth, crypto custody, native gateway, recovery, provider or business-effect test executed; no runtime of any kind exists yet."}
_controls = VERDICT.get("hand_written_controls")
checked(isinstance(_controls, dict) and set(_controls) == HAND_WRITTEN_CONTROL_KEYS,
        ("THE VERDICT DOES NOT CARRY EVERY HAND-WRITTEN CONTROL: the two tables the fifth "
         "recheck walked through -- the admissible-ancestor set and the pin floors -- were "
         "found by reading, and what made them findable-only-by-reading is that neither "
         "appeared in the verdict. A control that prints no count is a control a reviewer "
         "has to know to go looking for (RC5-01, RC5-02)",
         {"present": sorted(_controls) if isinstance(_controls, dict) else type(_controls).__name__,
          "required": sorted(HAND_WRITTEN_CONTROL_KEYS),
          "missing": sorted(HAND_WRITTEN_CONTROL_KEYS - set(_controls))
                     if isinstance(_controls, dict) else sorted(HAND_WRITTEN_CONTROL_KEYS)}))
for _control, _row in _controls.items():
    checked(isinstance(_row, dict) and "count" in _row and "file" in _row
            and ("floor" in _row or "ceiling" in _row or "literal" in _row),
            ("a hand-written control is reported without its count, its bound or the file "
             "it lives in; the block is only an instrument while every row carries all "
             "three (RC5-01, RC5-02)", _control, sorted(_row) if isinstance(_row, dict) else _row))
    if "floor" in _row:
        checked(_row["count"] >= _row["floor"],
                ("a hand-written control is reported below its own floor", _control, _row))
    if "ceiling" in _row:
        checked(_row["count"] <= _row["ceiling"],
                ("a hand-written control is reported above its own ceiling", _control, _row))
_census = VERDICT.get("conjunct_walk")
checked(isinstance(_census, dict) and set(_census) == CENSUS_KEYS,
        ("THE VERDICT DOES NOT CARRY THE DEMAND WALK'S CENSUS: every `demanded` in this "
         "file means whatever that walk decided, and the census is the only thing in the "
         "verdict that says how far it reached. A verdict printed without it is a pass "
         "whose coverage a reader would have to reconstruct with a mutation (RC4-07)",
         {"present": sorted(_census) if isinstance(_census, dict) else type(_census).__name__,
          "required": sorted(CENSUS_KEYS)}))
checked(isinstance(_census["slots_classified"], int) and _census["slots_classified"] > 0,
        ("THE DEMAND WALK CLASSIFIED NO ARGUMENT SLOT AT ALL: the closed table is only "
         "closed over what it was asked about, and a walk that asked nothing leaves every "
         "pin and the whole of RC-03 asserting nothing -- quietly (RC4-07). The floor of "
         "8,000 above is the live budget; this is the floor under the FIELD, so removing "
         "the counter is not cheaper than emptying it",
         {"slots_classified": _census["slots_classified"]}))
checked(isinstance(_census["operators"], list) and _census["operators"],
        ("THE DEMAND WALK MET NO OPERATOR: `operators` is the census field that would have "
         "shown RC3-01 as an absence -- `forall` was missing from it -- so an empty or "
         "absent set is the one reading a reviewer must never be given silently (RC4-07)",
         _census["operators"]))
print(json.dumps(VERDICT, indent=2))
