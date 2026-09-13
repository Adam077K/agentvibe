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

    if "content_unspecified" not in primitives:
        primitives["content_unspecified"] = CONTENT_UNSPECIFIED
        primitives = dict(sorted(primitives.items()))
        dump("primitive-registry.json", primitives)

    # criterion id -> (record, phase), taken from the edges that actually use it, so
    # a criterion nothing routes to is not silently given content.
    used = {}
    for record, body in records.items():
        for edge in body["lifecycle"]["transitions"]:
            used.setdefault(edge["criterion_id"], (record, edge["to"]))

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
        body, meta, reason = pc.compose(record, phase, criterion_id,
                                        records_schema, declared)

        if body is None:
            gap_id = "gap-%s-%s" % (record, phase)
            predicates[criterion_id] = _gap_predicate(predicate, criterion_id, gap_id,
                                                      declared, record, phase)
            gaps.append(_gap_entry(gap_id, record, phase, reason, records_schema))
            unspecified += 1
            continue

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
    return {
        "gap_id": gap_id,
        "record": record,
        "phase": phase,
        "criterion_id": "criterion.%s.%s.v1" % (record, phase),
        "reason": reason,
        "what_the_prose_would_need_to_say": (
            "What evidence a transition into `%s` requires for %s, stated so that it "
            "differs from what the same record's other phases require -- which records, "
            "in which lifecycle phase, and which of %s's own fields must carry it."
            % (phase, record, record)),
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
