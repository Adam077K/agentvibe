#!/usr/bin/env python3
"""Offline specification checks. This is not a production predicate/authority runtime."""
from __future__ import annotations
import copy
import hashlib
import json
import re
from pathlib import Path
from decimal import Decimal
from urllib.parse import urldefrag
from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parent
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
checked(set(RECORDS) == set(INVENTORY["canonical_records"]), "record coverage")
checked(set(COMMANDS) == set(INVENTORY["canonical_commands"]), "command coverage")
checked(set(PREDICATES) == set(INVENTORY["canonical_predicates"]), "predicate coverage")
checked(set(PRIMITIVES) == set(INVENTORY["canonical_primitives"]), "primitive coverage")
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
# Source field inventory must be unique and cover every source question catalog record field.
source_fields = FILES["source-field-mappings.json"]["mappings"]
checked(len({x["source"] for x in source_fields}) == len(source_fields), "unique source field mapping")
for mapping in source_fields:
    checked(mapping["canonical_record"] in RECORDS, ("mapped canonical record", mapping))
    checked(bool(mapping["destination"]), ("missing mapped field", mapping))

# Pure synthetic cases. These helpers specify focal contracts; they are deliberately not a runtime.
U1 = "01800000-0000-7000-8000-000000000001"
U2 = "01800000-0000-7000-8000-000000000002"
def ref(kind, revision="1", rid=U1):
    return {"record_id": rid, "record_type": kind, "revision": revision}
def key(value):
    return (value["record_type"], value["record_id"], value["revision"])
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
# Shape permits response union; semantic accepted guard below requires independent proof.
def command_accepted(result, independently_verified):
    return result.get("outcome") == "accepted" and bool(result.get("committed_position")) and key(result.get("durability_receipt_ref", ref("DurabilityReceipt", "0"))) in independently_verified
pending = {"outcome":"accepted","committed_position":{"registry_generation":"1","sequence":"3","transaction_hash":"a"*64}}
checked(not command_accepted(pending, set()), "local commit is not independently durable")
pending["durability_receipt_ref"] = ref("DurabilityReceipt")
checked(not command_accepted(pending, set()), "receipt-shaped caller input is not witness verification")
checked(command_accepted(pending, {key(ref("DurabilityReceipt"))}), "exact independently verified receipt can support generic accepted")

class FocalStore:
    """Synthetic ordered-head model for the FI-12 join; no I/O, signing or real-world truth."""
    def __init__(self):
        self.business_heads = {}
        self.content = {}
        self.status = {}
        self.restrictions = set()
        self.judgments = {}
    def record(self, subject, payload):
        identity = subject["record_type"], subject["record_id"]
        self.business_heads[identity] = copy.deepcopy(subject)
        self.content[key(subject)] = copy.deepcopy(payload)
        self.status[key(subject)] = {"phase":"proposed","status_revision":1,"links":{}}
    def current(self, subject):
        return self.business_heads.get((subject["record_type"],subject["record_id"])) == subject
    def judge(self, jref, subject, predicate, outcome, closure_current=True, scope="product", criteria="config1"):
        checked(key(subject) in self.content, "future subject cannot be judged")
        self.judgments[key(jref)] = {"subject":copy.deepcopy(subject),"predicate":copy.deepcopy(predicate),"phase":outcome,"closure":closure_current,"scope":scope,"criteria":criteria}
    def exact_judgment(self, jref, subject, predicate, scope="product", criteria="config1"):
        j = self.judgments.get(key(jref))
        return bool(j and self.current(subject) and key(subject) not in self.restrictions and j["subject"] == subject and j["predicate"] == predicate and j["phase"] == "accepted" and j["closure"] and j["scope"] == scope and j["criteria"] == criteria)
    def accept(self, subject, expected_status_revision, jref, predicate):
        status = self.status.get(key(subject))
        if not status or status["status_revision"] != expected_status_revision or not self.exact_judgment(jref,subject,predicate):
            return "conflict_or_denied"
        status.update(phase="validated",status_revision=expected_status_revision+1,links={"acceptance":jref})
        return "accepted"
    def edit(self, subject, payload, expected_status_revision):
        if not self.current(subject) or self.status[key(subject)]["status_revision"] != expected_status_revision:
            return None
        successor = {**subject,"revision":str(int(subject["revision"])+1)}
        self.record(successor,payload)
        return successor
store=FocalStore();product=ref("ProductSpec");judgment=ref("EvidenceJudgment")
predicate={"predicate_id":"criterion.ProductSpec.validated.v1","version":"1.0","arguments":{"subject_ref":product,"observation_refs":[]}}
store.record(product,{"requirement":"real usable delivery"})
original=copy.deepcopy(store.content[key(product)])
store.judge(judgment,product,predicate,"accepted")
checked(store.accept(product,1,judgment,predicate)=="accepted", "ordinary immutable-subject acceptance")
checked(store.content[key(product)]==original and store.current(product), "acceptance changes status only")
checked(store.accept(product,1,judgment,predicate)=="conflict_or_denied", "status CAS prevents replay")
new=store.edit(product,{"requirement":"changed delivery"},2)
checked(new and store.status[key(new)]["phase"]=="proposed", "content edit initializes fresh unaccepted revision")
checked(not store.exact_judgment(judgment,new,predicate), "old exact judgment cannot accept changed subject")
checked(store.accept(product,2,judgment,predicate)=="conflict_or_denied", "old accepted projection cannot restore old head")
# Edit-first race.
race=FocalStore();race.record(product,original);race.judge(judgment,product,predicate,"accepted")
checked(bool(race.edit(product,{"requirement":"raced"},1)), "edit can win head CAS")
checked(race.accept(product,1,judgment,predicate)=="conflict_or_denied", "edit-first rejects stale acceptance")
# Inconclusive/contested/unknown closure and wrong args cannot accept a subject.
for outcome, closure in [("proposed",True),("inconclusive",True),("contested",True),("rejected",True),("accepted",False)]:
    s=FocalStore();s.record(product,original);s.judge(judgment,product,predicate,outcome,closure)
    checked(s.accept(product,1,judgment,predicate)=="conflict_or_denied", ("no false acceptance",outcome,closure))
s=FocalStore();s.record(product,original);s.judge(judgment,product,{**predicate,"arguments":{"subject_ref":product,"observation_refs":[ref("Observation")]}},"accepted")
checked(not s.exact_judgment(judgment,product,predicate), "same predicate ID with different arguments fails")
s=FocalStore();s.record(product,original);s.judge(judgment,product,predicate,"accepted");s.restrictions.add(key(product))
checked(not s.exact_judgment(judgment,product,predicate), "live restriction defeats stale accepted cache")
# Exact launch child bijection uses distinct subjects and predicates; no self-support.
def launch_children(requirements, bindings, launch_ref, valid_child):
    required={r["id"]:r for r in requirements}
    if len(required)!=len(requirements) or len(bindings)!=len(required) or len({b["id"] for b in bindings})!=len(bindings):
        return False
    for binding in bindings:
        r=required.get(binding["id"])
        if not r or binding["subject"]==launch_ref or r["subject"]!=binding["subject"] or r["predicate"]!=binding["predicate"] or not valid_child(binding):
            return False
    return True
launch=ref("LaunchReadiness")
requirements=[{"id":"product","subject":product,"predicate":"product.usable"},{"id":"delivery","subject":ref("DeliveryCapacity"),"predicate":"capacity.actual"},{"id":"support","subject":ref("DeliveryCapacity",rid=U2),"predicate":"support.actual"}]
checked(launch_children(requirements,copy.deepcopy(requirements),launch,lambda _:True),"distinct launch child subjects work")
for broken in [requirements[:-1],requirements+[requirements[0]],[requirements[0],requirements[0],requirements[2]],[{**requirements[0],"predicate":"uncertainty.report"},*requirements[1:]],[{**requirements[0],"subject":launch},*requirements[1:]]]:
    checked(not launch_children(requirements,broken,launch,lambda _:True),"missing/duplicate/wrong/self child fails")
checked(not launch_children(requirements,requirements,launch,lambda b:b["id"]!="delivery"),"stale child fails whole launch")
# Real-world facts below are synthetic boundary inputs, not evidence those facts exist.
def pre_sale_capacity(check):
    return all(check[k] for k in ("performer_accepted","competence","access","materials","window","reservations","continuity"))
capacity={k:True for k in ("performer_accepted","competence","access","materials","window","reservations","continuity")}
checked(pre_sale_capacity(capacity),"pre-sale verification needs no customer agreement")
checked(not pre_sale_capacity({**capacity,"continuity":False}),"unavailable continuity not a performed service")
def price_acceptance(scope,demand,grant=False,capacity=False):
    return scope=="internal_provisional" or (scope=="bounded_validation" and grant and capacity) or (scope in ("demand_supported_offer","scale_recommendation") and demand and capacity)
checked(price_acceptance("internal_provisional",False),"honest unknown-demand preparation works")
checked(not price_acceptance("scale_recommendation",False,True,True),"unknown demand cannot become scale evidence")
checked(price_acceptance("bounded_validation",False,True,True),"authorized bounded validation path works")
# Fresh recovery and first-send windows are not satisfied by old signed-looking data.
def frontier_ok(reply,nonce,current_membership,verified_signature):
    return verified_signature and reply.get("query_nonce")==nonce and reply.get("membership")==current_membership and reply.get("complete") is True
checked(not frontier_ok({"query_nonce":"old","membership":"m1","complete":True},"new","m1",True),"old frontier evidence is not fresh recovery authority")
checked(frontier_ok({"query_nonce":"new","membership":"m1","complete":True},"new","m1",True),"current verified frontier can be used")
def first_send(claim, now, boot, used, receipt_verified, restriction_current):
    return now<claim["deadline"] and boot==claim["boot"] and not used and receipt_verified and restriction_current
claim={"deadline":100,"boot":"b1"}
checked(first_send(claim,99,"b1",False,True,True),"bounded first-send positive case")
for parameters in [(100,"b1",False,True,True),(99,"b0",False,True,True),(99,"b1",True,True,True),(99,"b1",False,False,True),(99,"b1",False,True,False)]:
    checked(not first_send(claim,*parameters),"late/wrong-boot/duplicate/unwitnessed/restricted first send fails")
# Protected type/size alone never licenses a plaintext copy or complete deletion.
def deletion_complete(copies):
    return all(c["purged"] or (c["authorized_retention"] and c["status"]=="residual") for c in copies) and all(c["status"]!="residual" for c in copies)
checked(not deletion_complete([{"purged":False,"authorized_retention":False,"status":"unknown_offline"}]),"late/offline unknown copy keeps deletion incomplete")
checked(not deletion_complete([{"purged":False,"authorized_retention":True,"status":"residual"}]),"lawful retention is residual, not complete erasure")
checked(deletion_complete([{"purged":True,"authorized_retention":False,"status":"verified"}]),"actual all-copy purge can close scope")
# Canonical lexemes and own-proof exclusion: these checks do not implement the production serializer.
def no_own_proof(body):
    forbidden={"transaction_hash","committed_position","durability_receipt_ref","signature"}
    return not forbidden.intersection(body)
checked(no_own_proof({"sequence":"1","predecessor_transaction_hash":"a"*64}),"GroupBody may name predecessor, not its own proof")
checked(not no_own_proof({"sequence":"1","transaction_hash":"a"*64}),"own future group hash rejected")
try:
    json.loads('{"same":1,"same":2}',object_pairs_hook=unique_object)
    checked(False,"duplicate keys must be rejected")
except ValueError:
    checked(True,"duplicate keys rejected before canonicalization")
checked(Decimal("0.1")+Decimal("0.2")==Decimal("0.3"),"exact decimal resource arithmetic")
print(json.dumps({"status":"passed","checks":COUNT,"records":len(RECORDS),"values":len(INVENTORY["canonical_values"]),"commands":len(COMMANDS),"predicates":len(PREDICATES),"edges":len(all_edges),"source_work_edges":len(INVENTORY["source_work_edges"]),"required_subjects":46,"limits":"Offline schema/ref/AST/source-inventory checks and synthetic focal contracts. No production handler, source truth, crypto custody, native gateway, recovery, provider or business-effect test executed."},indent=2))
