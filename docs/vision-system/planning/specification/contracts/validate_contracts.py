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
PIN_ROW_KEYS = {"op", "why", "negated", "field_paths_include", "bindings",
                "contains_pointers", *PIN_VALUE_KEYS}
PIN_KEYS = {"predicate_id", "kind", "findings", "decisions", "why", "require"}
PIN_BINDING_KEYS = {"field_path", "states_exactly", "optional"}


def polarised_nodes(node, negated=False):
    """Every `op` node of a body, paired with whether it sits beneath a `not`.

    Polarity is the half a containment check forgets. `not(native_correlated delivered)`
    CONTAINS `native_correlated(result: delivered)`, so a pin that only asked whether the
    op appears would accept the inversion of the requirement it exists to hold.
    """
    found = []
    if isinstance(node, dict):
        if "op" in node:
            found.append((node, negated))
        inner = negated != (node.get("op") == "not")
        for key, value in node.items():
            if key != "op":
                found.extend(polarised_nodes(value, inner))
    elif isinstance(node, list):
        for value in node:
            found.extend(polarised_nodes(value, negated))
    return found


def pointers_in(node):
    return {n["pointer"] for n, _ in polarised_nodes(node)
            if n.get("op") == "path" and isinstance(n.get("pointer"), str)}


def pin_row_matches(node, row):
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
    nodes = polarised_nodes(PREDICATES[predicate_id]["body"])
    for row in pin["require"]:
        # Declare what is read and REFUSE the rest: a constraint key this checker does
        # not know would otherwise be a pin that reads as enforcement and checks nothing.
        checked(set(row) <= PIN_ROW_KEYS,
                ("unknown key in a pinned requirement", predicate_id, sorted(set(row) - PIN_ROW_KEYS)))
        checked("op" in row and row.get("why", "").strip(),
                ("a pinned requirement states no op or no reason", predicate_id, row))
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
        checked(any(node.get("op") == row["op"]
                    and (negated == wanted_negated or not boolean_op)
                    and pin_row_matches(node, row)
                    for node, negated in nodes),
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
REQUIRES_WAIVERS = {entry["criterion"]: entry for entry in PINNED["requires_waivers"]}
for entry in PINNED["requires_waivers"]:
    checked(set(entry) == {"criterion", "phases", "why"}, ("requires waiver shape", entry))
    checked(entry["why"].strip() and entry["criterion"] in PREDICATES,
            ("a requires waiver with no reason, or for no such criterion", entry["criterion"]))

PROSE_PATH = re.compile(r"`(/[A-Za-z0-9_./\-]+)`|(?<![`\w])(/payload/[a-z_]+)")
PROSE_TOKEN = re.compile(r"`([a-z][a-z_\-]*)`")


def stated_paths_and_states(body):
    paths, states = set(), set()
    for node in walk(body):
        if not isinstance(node, dict):
            continue
        paths.update(node.get("field_paths") or [])
        for binding in node.get("bindings") or []:
            paths.add(binding["field_path"])
            states.update(binding["states"])
        if node.get("op") == "path" and isinstance(node.get("pointer"), str):
            paths.add(node["pointer"])
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
    body_paths, body_states = stated_paths_and_states(predicate["body"])
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
    completed = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "run_negative_fixtures.py")],
        capture_output=True, text=True,
        env={**os.environ, "CONTRACTS_FIXTURE_RUN": "1"})
    checked(completed.returncode == 0,
            ("a negative fixture was not rejected; the check it names is gone",
             completed.stdout[-2000:] + completed.stderr[-2000:]))
    FIXTURES_RUN = json.loads(completed.stdout[completed.stdout.rindex("{"):])
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

print(json.dumps({"status":"passed","checks":COUNT,"records":len(RECORDS),"values":len(INVENTORY["canonical_values"]),"commands":len(COMMANDS),"predicates":len(PREDICATES),"edges":len(all_edges),"source_work_edges":len(INVENTORY["source_work_edges"]),"required_subjects":46,"negative_fixtures_rejected":FIXTURES_RUN and FIXTURES_RUN["passed_as_required"],"limits":"Offline schema/ref/AST/source-inventory/registry checks plus negative fixtures. No production handler, source truth, crypto custody, native gateway, recovery, provider or business-effect test executed; no runtime of any kind exists yet."},indent=2))
