#!/usr/bin/env python3
"""Apply tools/phase_content.py to the criterion family, and record every gap.

Writes, in the contracts directory:
  predicate-registry.json    criterion.* bodies, `meaning`, `requires`, `derived_from`
  phase-content-gaps.json    one entry per criterion whose content the prose omits
  primitive-registry.json    registers `content_unspecified` if it is absent
  coverage-inventory.json    re-derived, because the primitive set changed

Three rules this tool will not break, each of which a committed check enforces:

  1. A criterion may only read arguments it declares, and must read ALL of them --
     `validate_contracts.py` fails an edge whose declared argument nothing
     transitively reads, and the edge reads through its criterion. So a gap body is
     still a conjunction that reads them; `content_unspecified` never returns true,
     so nothing is smuggled past the gap by the conjuncts that keep it honest.
  2. `accepted_for` and `attested_result` inside a criterion name THAT criterion.
  3. The ten criteria whose bodies carry an `op: "call"` are left exactly as they
     are. Nine join the bootstrap root that `tools/acceptance_chain.py` walks and
     `validate_contracts.py` requires to terminate; one joins the closure predicate.
     Rewriting them would break FI-12 constraint 6 to improve an FI-11 number.

Usage: python3 tools/author_phase_content.py [--dry-run]
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import phase_content as pc  # noqa: E402

DRY = "--dry-run" in sys.argv

CONTENT_UNSPECIFIED = {
    "args": ["subject_ref", "gap_id"],
    "semantics": (
        "EXPLICIT GAP. The source corpus states no evidence requirement for the phase "
        "this criterion assesses, so no requirement is expressed here. Never true and "
        "never false: it resolves unresolved, and a conjunction containing it is "
        "unresolved whatever its other conjuncts establish. gap_id names the entry in "
        "phase-content-gaps.json that records what the prose would have to say, and "
        "validate_contracts.py fails a body using this primitive with no matching entry. "
        "The alternative was a plausible body with no source, which reads exactly like a "
        "requirement and is the false closure this package refuses."),
    "version": "1.0",
    "argument_types": {"subject_ref": "Ref<Record>", "gap_id": "string"},
    "result_type": "boolean",
    "failure": (
        "unresolved: denies the dependent transition and preserves the typed reason and "
        "all surviving duties, exactly as a false criterion does"),
    "planned_module": "system/packages/contracts/src/predicates/content-gap.ts",
}


def load(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def dump(name, value):
    if DRY:
        return
    (ROOT / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n",
                             encoding="utf-8")


def calls(body):
    stack, found = [body], []
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            if node.get("op") == "call":
                found.append(node["predicate_id"])
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return found


BASE_OPS = {"all", "nonempty_fields", "related_phases", "accepted_for",
            "attested_result"}

# Written onto every criterion this tool authors. It is what makes a second run
# idempotent: without it, run two read run one's OWN output as "pre-existing
# record-specific content" and carried it forward again -- 114 criteria came back
# "preserved" and all 104 gaps vanished, on a tree that had not changed. A tool whose
# second run disagrees with its first is not a derivation, it is a drift.
CONTENT_SOURCE = "tools/phase_content.py"


def ops_in(node, found=None):
    found = set() if found is None else found
    if isinstance(node, dict):
        if "op" in node:
            found.add(node["op"])
        for value in node.values():
            ops_in(value, found)
    elif isinstance(node, list):
        for value in node:
            ops_in(value, found)
    return found


def record_specific_conjuncts(body):
    """Top-level conjuncts of an existing criterion that already carry content.

    The canonical repair gave eleven criteria a record-specific primitive --
    `resource_equation` on ResourceAccount, `launch_children` on LaunchReadiness,
    `epochs_current` on ContextManifest and so on. That is real content, authored
    against those records, and this tool would otherwise delete it to install a
    phase-kind body. Rule 5: iterate, do not overwrite. They are carried forward and
    the authored conjuncts are added around them.
    """
    if not isinstance(body, dict) or body.get("op") != "all":
        return []
    return [node for node in body.get("predicates", [])
            if isinstance(node, dict) and ops_in(node) - BASE_OPS]


def read_args(body):
    stack, found = [body], set()
    while stack:
        node = stack.pop()
        if isinstance(node, dict):
            if set(node) == {"arg"}:
                found.add(node["arg"])
                continue
            stack.extend(node.values())
        elif isinstance(node, list):
            stack.extend(node)
    return found


def main():
    records = load("record-registry.json")
    predicates = load("predicate-registry.json")
    primitives = load("primitive-registry.json")
    records_schema = load("records.schema.json")
    pc.set_primitives(primitives)

    if "content_unspecified" not in primitives:
        # Appended, NOT re-sorted. Sorting the registry to add one entry produced a
        # 4437-line diff for a 12-line addition, which hides the change inside the
        # noise of moving everything else.
        primitives["content_unspecified"] = CONTENT_UNSPECIFIED
        dump("primitive-registry.json", primitives)

    # criterion id -> (record, phase). Edges first, because an edge's `criterion_id` is
    # the authoritative binding. Then every OTHER phase the record declares: 157
    # criteria are named by no edge -- they are the records' initial phases, which no
    # transition enters -- and leaving those alone would leave an asymmetry that reads
    # like an oversight. They gain the same content; being unrouted is separate from
    # being unstated, and `predicates_unreachable_from_any_guard` still reports them.
    used = {}
    for record, body in records.items():
        for edge in body["lifecycle"]["transitions"]:
            used.setdefault(edge["criterion_id"], (record, edge["to"]))
    for record, body in records.items():
        for phase in body["lifecycle"]["phases"]:
            criterion_id = "criterion.%s.%s.v1" % (record, phase)
            if criterion_id in predicates:
                used.setdefault(criterion_id, (record, phase))

    gaps, enriched, unspecified, preserved, contradiction_hits = [], 0, 0, 0, []
    dropped_report = {}

    for criterion_id, predicate in predicates.items():
        if not criterion_id.startswith("criterion."):
            continue
        if criterion_id not in used:
            continue
        if calls(predicate["body"]):
            preserved += 1
            predicate.setdefault("derived_from", [{
                "file": "11-schemas-state-contracts.md",
                "anchor_or_quote": (
                    "A first evaluator cannot be admitted by an infinite chain of model "
                    "evaluators. `evidence.bootstrap` binds an actual competent human "
                    "assessor and independently accountable custodian to a narrowly "
                    "described evaluation scope"),
            }])
            predicate.setdefault(
                "requires",
                "Preserved from the canonical repair: this criterion joins the bootstrap "
                "root (or the closure predicate) that the FI-12 acceptance chain walk "
                "requires to terminate. Its per-phase content is deliberately not "
                "rewritten here.")
            continue

        record, phase = used[criterion_id]
        declared = set(predicate["argument_types"])
        carried = (predicate.get("carried_conjuncts", [])
                   if predicate.get("content_source") == CONTENT_SOURCE
                   else record_specific_conjuncts(predicate["body"]))
        predicate["content_source"] = CONTENT_SOURCE
        if carried:
            predicate["carried_conjuncts"] = carried
        else:
            predicate.pop("carried_conjuncts", None)
        body, meta, reason = pc.compose(record, phase, criterion_id,
                                        records_schema, declared)

        if body is None:
            if carried:
                # The repair already authored record-specific content here. It stands
                # on its own; a gap entry over it would report an absence that is not
                # there.
                predicate["requires"] = (
                    "Carried from the canonical repair: this criterion already composes "
                    "a record-specific primitive (%s). No phase-kind requirement is "
                    "added, because the corpus states none for `%s`."
                    % (", ".join(sorted(ops_in(predicate["body"]) - BASE_OPS)), phase))
                preserved += 1
                continue
            gap_id = "gap-%s-%s" % (record, phase)
            predicates[criterion_id] = _gap_predicate(predicate, criterion_id, gap_id,
                                                      declared, record, phase)
            gaps.append(_gap_entry(gap_id, record, phase, reason, records_schema))
            unspecified += 1
            continue

        if carried:
            existing = {json.dumps(n, sort_keys=True) for n in body["predicates"]}
            for node in reversed(carried):
                if json.dumps(node, sort_keys=True) not in existing:
                    body["predicates"].insert(0, node)
            meta["requires"] = (
                meta["requires"] + " Carried from the canonical repair for this record: "
                + ", ".join(sorted(ops_in({"predicates": carried}) - BASE_OPS)) + ".")

        # Every declared argument must stay read: the edge that calls this criterion
        # declares the same names, and an unread declaration fails the validator.
        missing = declared - read_args(body)
        if "judgment_refs" in missing:
            body["predicates"].append(
                pc.build_conjunct(("af",), record, criterion_id, []))
            missing = declared - read_args(body)
        if missing:
            gap_id = "gap-%s-%s" % (record, phase)
            predicates[criterion_id] = _gap_predicate(
                predicate, criterion_id, gap_id, declared, record, phase)
            gaps.append(_gap_entry(
                gap_id, record, phase,
                "the stated requirement does not read every argument this criterion "
                "declares (%s); expressing it would need an argument shape change, "
                "which this package does not make" % ", ".join(sorted(missing)),
                records_schema))
            unspecified += 1
            continue

        predicate["body"] = body
        predicate["requires"] = meta["requires"]
        predicate["derived_from"] = meta["derived_from"]
        predicate["meaning"] = "%s Phase assessed: %s." % (meta["requires"], phase)
        predicate.pop("content_gap_id", None)
        if meta["dropped_conjuncts"]:
            dropped_report.setdefault(record, {})[phase] = meta["dropped_conjuncts"]
        enriched += 1

    for entry in pc.CONTRADICTIONS:
        contradiction_hits.append(entry["id"])

    gaps_document = {
        "schema_version": "1.0",
        "kind": "explicit per-phase content gaps",
        "why": (
            "A criterion whose body uses `content_unspecified` states no requirement "
            "because no source states one. Each entry below names what the prose would "
            "have to say for that criterion to carry content. validate_contracts.py "
            "fails a `content_unspecified` body with no entry here, and fails an entry "
            "here with no such body -- so the count cannot drift in either direction."),
        "counts": {
            "criteria_with_content": enriched,
            "criteria_content_unspecified": unspecified,
            "criteria_preserved_from_repair": preserved,
        },
        "gaps": sorted(gaps, key=lambda g: g["gap_id"]),
        "residual_sibling_collisions": _residual_collisions(records, predicates),
        "contradictions": pc.CONTRADICTIONS,
        "conjuncts_dropped_for_absent_fields": dropped_report,
        "limits": (
            "`due_preserved` expresses 11-schemas-state-contracts.md's 'restrictive "
            "action preserves duties' directly, and is NOT used anywhere here: its "
            "`continuation_ref` parameter takes a Ref<Continuation> and no criterion "
            "declares that argument. Changing criterion argument shapes was out of "
            "scope for this package, so restrictive phases encode the duty half through "
            "`nonempty_fields` over the record's own duty fields and `related_phases` "
            "over its custodian instead. That is weaker than the primitive, and saying "
            "so is the point."),
    }
    dump("phase-content-gaps.json", gaps_document)
    dump("predicate-registry.json", predicates)

    if not DRY:
        inventory = load("coverage-inventory.json")
        derived = _derive_inventory(inventory)
        dump("coverage-inventory.json", derived)

    print(json.dumps({
        "criteria_enriched": enriched,
        "criteria_content_unspecified": unspecified,
        "criteria_preserved_from_repair": preserved,
        "gaps_registered": len(gaps),
        "contradictions_recorded": contradiction_hits,
        "dry_run": DRY,
    }, indent=2))
    return 0


def _gap_predicate(predicate, criterion_id, gap_id, declared, record, phase):
    conjuncts = [{"op": "content_unspecified", "subject_ref": {"arg": "subject_ref"},
                  "gap_id": gap_id}]
    if "observation_refs" in declared:
        conjuncts.append(pc.build_conjunct(("ar",), record, criterion_id, []))
    if "judgment_refs" in declared:
        conjuncts.append(pc.build_conjunct(("af",), record, criterion_id, []))
    predicate = dict(predicate)
    predicate["body"] = {"op": "all", "predicates": conjuncts}
    predicate["content_gap_id"] = gap_id
    predicate["requires"] = (
        "NOT STATED. The source corpus carries no evidence requirement for a transition "
        "into `%s` on %s. See phase-content-gaps.json#/gaps for what it would have to "
        "say." % (phase, record))
    predicate["meaning"] = (
        "Per-phase content unspecified; see %s. Phase assessed: %s." % (gap_id, phase))
    predicate.pop("derived_from", None)
    return predicate


def _gap_entry(gap_id, record, phase, reason, records_schema):
    nearest = pc.PHASE_SPECS.get(phase)
    related = sorted(
        p for p in pc.PHASE_SPECS
        if p != phase and (p.startswith(phase[:4]) or phase.startswith(p[:4])))
    if nearest is None:
        kind = "prose_silent"
        needed = (
            "What evidence a transition into `%s` requires -- for %s or for any record "
            "carrying that phase. The corpus names `%s` in a state list and never says "
            "what entering it demands." % (phase, record, phase))
    else:
        kind = "record_has_no_field_for_the_stated_requirement"
        needed = (
            "Which of %s's own fields carries the evidence `%s` requires. The "
            "requirement IS stated -- %s -- and %s declares no field it can bind to, so "
            "the criterion cannot express it. Either %s gains that field, or the "
            "corpus states what %s's `%s` requires INSTEAD of the general rule."
            % (record, phase, nearest["requires"], record, record, record, phase))
    return {
        "gap_id": gap_id,
        "record": record,
        "phase": phase,
        "criterion_id": "criterion.%s.%s.v1" % (record, phase),
        "kind": kind,
        "reason": reason,
        "what_the_prose_would_need_to_say": needed,
        "nearest_related_passage": (
            {"phase_kind_entry": phase, "requires": nearest["requires"],
             "cites": nearest["cites"]}
            if nearest else
            {"phase_kind_entry": None,
             "nearest_named_phases": related,
             "note": "no phase-kind entry exists for this name; the corpus names the "
                     "phase in a state list without saying what entering it requires"}),
        "record_required_payload_fields": pc.payload_required(records_schema, record),
    }


def _residual_collisions(records, predicates):
    """Sibling edges whose effective guards still share a shape, with WHY.

    Reported here rather than left to the oracle alone, because each of these is a
    statement about the corpus that a reader should be able to check without running
    anything: two phases of one record that the sources do not distinguish.
    """
    import skeletons
    found = []
    for group in skeletons.sibling_collisions(records, predicates,
                                              skeletons.erase_all_strings):
        record, phases = group["record"], group["to_phases"]
        gapped = [p for p in phases
                  if "content_gap_id" in predicates["criterion.%s.%s.v1" % (record, p)]]
        found.append({
                "record": record,
                "from_state": group["from_state"],
                "to_phases": phases,
                "why": (
                    "both criteria are explicit gaps, so both bodies are the same "
                    "`content_unspecified` conjunction; the oracle is right that they "
                    "are indistinguishable and this is what a visible gap looks like"
                    if len(gapped) == len(phases) else
                    "the stated requirements differ only in a VALUE the "
                    "all-strings-erased method erases -- the evidence demanded is the "
                    "same in kind, and what differs is what that evidence says"
                    if _same_shape_different_value(predicates, record, phases) else
                    "the stated requirements differ only in a field role this record "
                    "declares no field for, so the difference drops out on this record"),
                "gapped_phases": gapped,
            })
    return found


def _same_shape_different_value(predicates, record, phases):
    values = set()
    for phase in phases:
        body = predicates["criterion.%s.%s.v1" % (record, phase)]["body"]
        for node in body.get("predicates", []):
            if isinstance(node, dict) and node.get("op") == "native_correlated":
                values.add(node["result"])
    return len(values) > 1


def _derive_inventory(committed):
    script = (
        "import sys, json, pathlib;"
        "sys.path.insert(0, 'tools');"
        "import derive_inventory as d;"
        "here = pathlib.Path('.').resolve();"
        "d.CONTRACTS = here;"
        "d.SOURCES = here.parent;"
        "c = json.loads(pathlib.Path('coverage-inventory.json').read_text());"
        "print(json.dumps(d.derive(c)))"
    )
    done = subprocess.run([sys.executable, "-c", script], cwd=ROOT,
                          capture_output=True, text=True, check=True)
    return json.loads(done.stdout)


if __name__ == "__main__":
    sys.exit(main())
