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

# One walked position: the node, and the four facts about its CONTEXT a containment check
# needs. `quantifiers` is a tuple rather than a flag so the message can NAME the quantifier
# and the collection it ranges over -- "inside a forall" sends a reader looking;
# "forall(/payload/obligation_refs)" sends them to the field that admits `[]`.
Positioned = namedtuple("Positioned", "node negated disjoined quantifiers in_value where")

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
                    in_value=False, where="body"):
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
                                         in_value, where))
        return found
    if not isinstance(node, dict):
        return found
    if "op" not in node:
        # A container the AST puts between operators: {"arg": ...}, {"context": ...}, a
        # `related_phases` binding, a `call`'s argument map. It carries the context it
        # sits in and creates none of its own.
        for value in node.values():
            found.extend(polarised_nodes(value, owner, negated, disjoined, quantifiers,
                                         in_value, where))
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
    found.append(Positioned(node, negated, disjoined, quantifiers, in_value, where))
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
        found.extend(polarised_nodes(value, owner, *child))
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


# A floor, and it is a LITERAL for the same reason the sibling-collision budget is: a
# count derived from the file it measures is satisfied by the empty file. The coverage
# check below forces every registered finding to be pinned or excused, which an author
# could satisfy by moving all 25 pins into `unpinnable` one reason at a time; this is what
# stops that being quiet. Lowering these numbers is a decision, and it should read like one.
checked(len(PINNED["pins"]) >= 25 and len(PINNED["pinned_transitions"]) >= 6,
        ("the pinned table has shrunk; a pin table with no pins passes vacuously",
         {"pins": len(PINNED["pins"]), "floor": 25,
          "pinned_transitions": len(PINNED["pinned_transitions"]), "transition_floor": 6}))
checked(sum(len(pin["require"]) for pin in PINNED["pins"]) >= 44,
        ("the pinned table kept its pins and lost its requirements",
         sum(len(pin["require"]) for pin in PINNED["pins"])))
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
        # Two questions, not one, because they have two different answers and a reader who
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
        checked(demanded or not quantified,
                ("PINNED CONJUNCT ONLY UNDER A QUANTIFIER: the registry still MENTIONS what "
                 "this finding required, inside a quantifier over a collection nothing "
                 "forces to be non-empty, and so no longer DEMANDS it",
                 predicate_id, row["op"], row["why"],
                 {"findings": pin["findings"], "decisions": pin["decisions"],
                  "quantifiers": sorted({note for entry in quantified
                                         for note in entry.quantifiers}),
                  "note": "a `forall` over a field records.schema.json permits to be `[]` "
                          "is vacuously true, so a conjunct moved inside it is required of "
                          "nothing (RC3-01). Demand the collection non-empty on the same "
                          "path, or state the requirement outside the quantifier."}))
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
        checked(bool(demanded),
                ("PINNED CONJUNCT MISSING: the registry no longer says what this finding "
                 "required", predicate_id, row["op"], row["why"],
                 {"findings": pin["findings"], "decisions": pin["decisions"],
                  "note": "pinned-conjuncts.json is hand-written and is NOT derived from "
                          "tools/phase_content.py; regenerating the registry cannot "
                          "satisfy this check, only stating the requirement can"}))

# A conjunct pin holds a guard to what it demands and says nothing about whether the edge
# EXISTS. RC-01 was that shape: every guard well formed, every criterion sourced, and no
# transition at all for a delivery that fails in flight. Deleting a transition is a
# one-line edit to record-registry.json, and nothing here would have noticed it.
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
import re  # noqa: E402
REGISTER = ROOT.parents[2] / "registers" / "review-findings.json"
FINDING_ID = re.compile(r"\b(?:G\d-\d{2}[a-z]?|RC-\d{2})\b")
register_findings = set(FINDING_ID.findall(REGISTER.read_text(encoding="utf-8")))
checked(len(register_findings) >= 8,
        ("the finding sweep of review-findings.json returned almost nothing; a coverage "
         "check with an empty required set passes vacuously", sorted(register_findings)))
unpinnable = {entry["finding"]: entry["why"] for entry in PINNED["unpinnable"]}
for finding, why in unpinnable.items():
    checked(why.strip(), ("a finding declared unpinnable with no reason", finding))
covered = {finding for pin in PINNED["pins"] for finding in pin["findings"]} \
    | {finding for row in PINNED["pinned_transitions"] for finding in row["findings"]}
checked(register_findings <= covered | set(unpinnable),
        ("a registered finding is neither pinned nor declared unpinnable",
         sorted(register_findings - covered - set(unpinnable)),
         "add a pin to pinned-conjuncts.json, or an `unpinnable` entry saying why no "
         "conjunct can carry it"))
# Rule 3 at the pin layer: every finding id these pins cite RESOLVES to a document that
# names it. A pin citing a finding nobody can find is a pin justified by nothing.
for finding in sorted(covered | set(unpinnable)):
    if finding in register_findings:
        continue
    source = PINNED["finding_sources"].get(finding)
    checked(source is not None,
            ("a pin cites a finding that is in no register and names no source", finding))
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
# the verdict rather than reconstruct it with a mutation. Four facts, and the set of
# operators is the one that would have shown RC3-01 as an absence: `forall` is not in it.
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
    checked(FIXTURE_RATCHET in
            (ROOT / "tools" / "run_negative_fixtures.py").read_text(encoding="utf-8"),
            ("the ratchet headline this file branches on is not in the runner that prints "
             "it", FIXTURE_RATCHET))
    try:
        runner_said = json.loads(completed.stdout[completed.stdout.rindex("{"):])
    except ValueError:
        # No JSON at all: the runner refused before reporting -- a symlinked tree, a
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
    checked(completed.returncode == 0,
            ("a negative fixture was not rejected; the check it names is gone",
             completed.stdout[-2000:] + completed.stderr[-2000:]))
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

print(json.dumps({"status":"passed","checks":COUNT,"records":len(RECORDS),"values":len(INVENTORY["canonical_values"]),"commands":len(COMMANDS),"predicates":len(PREDICATES),"edges":len(all_edges),"conjunct_walk":CONJUNCT_WALK,"source_work_edges":len(INVENTORY["source_work_edges"]),"required_subjects":46,"negative_fixtures_rejected":FIXTURES_RUN and FIXTURES_RUN["passed_as_required"],"limits":"Offline schema/ref/AST/source-inventory/registry checks plus negative fixtures. No production handler, source truth, crypto custody, native gateway, recovery, provider or business-effect test executed; no runtime of any kind exists yet."},indent=2))
