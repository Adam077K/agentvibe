#!/usr/bin/env python3
"""R2 (CCR-02, FI-12 constraint 6): ground the attestation regress at a human root.

The regress, computed by tools/acceptance_chain.py rather than argued from prose:
nine criteria form a cycle with no terminator --

  Mandate:accepted, ResponsibilityAssignment:accepted, EvidenceJudgment:accepted,
  IdentityBinding:active, Principal:verified, EvaluatorProfile:admitted,
  EvidenceBaseVersion:admitted, ContinuityArrangement:accepted/active

Those nine are not chosen here; they are what the walk returns, and they coincide
with the group `11-schemas-state-contracts.md` section "Bootstrap and competent
acceptance" already names in prose: "initial identities, scoped
mandates/assignments, access/retention policies and actual key/witness
custodians", plus the "actual competent human assessor and independently
accountable custodian" that section binds through `evidence.bootstrap`.

That prose contract was never bound to anything: `bootstrap_roots` was defined in
the primitive registry and invoked by zero of 2252 predicates, and no predicate
named `evidence.bootstrap` existed at all. This script binds it.

MECHANISM DECISIONS MADE HERE (they are mechanism, and are reported as decisions):

  1. The genesis kind is a SIGNED CANDIDATE GROUP, not a 174th record type.
     `BootstrapAuthorization` and `BootstrapCandidate` already exist in
     values.schema.json and already carry `founder_signature`,
     `custodian_signature`, `scope: "initialize_preparatory_namespace"` and an
     expiry. Membership of that signed group is what makes a record genesis --
     so a `GenesisMandate` record type would be a second spelling of a
     distinction the corpus already draws, and would break both the preserved
     173-record set and R7's derived inventory.
  2. `bootstrap_roots` gains a `subject_ref` argument. Without it the primitive
     verifies signatures over a group and never asserts that THIS subject is in
     that group, which is the whole binding. It was invoked nowhere, so widening
     its arity breaks no caller.
  3. The genesis branch is a DISJUNCT (`op:"any"`), the first disjunction anywhere
     in this corpus -- the review's "conjunction-only" observation was accurate.
     Acceptance is either out of band at the root or derived; never both required,
     never neither.

WHAT IS DELIBERATELY LEFT UNKNOWN: who the founder and root custodian actually
are. `BootstrapAuthorization` requires their identity assertions, public keys and
signatures; naming the humans is a deployment act, not a contract, and this
script does not invent one.

Usage: python3 tools/repair_r2_bootstrap_root.py [--dry-run]
"""
from __future__ import annotations
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import contracts_io as io  # noqa: E402
import acceptance_chain  # noqa: E402

# Nodes that impose a further acceptance; on the genesis path the root act stands
# in for all of them. `nonempty_fields` is NOT one: a genesis record still has to
# carry its required fields.
OBLIGATION_OPS = {"accepted_for", "attested_result", "judgment_matches", "related_phases"}

AUTHORIZATION = "BootstrapAuthorization"
CANDIDATES = "BootstrapCandidate[]"


def genesis_predicate_id(record_name):
    return f"evidence.bootstrap.{record_name}.v1"


def main(dry_run: bool) -> int:
    predicates = io.load_stable("predicate-registry.json")
    primitives = io.load_stable("primitive-registry.json")

    chain = sorted(acceptance_chain.walk()[1])
    ungrounded = [name for name in chain
                  if acceptance_chain.walk()[1][name] != "grounded"]
    if not ungrounded:
        print("chain already terminates; nothing to ground")
        return 0

    # --- 1. bootstrap_roots binds the subject it admits. ---
    primitive = primitives["bootstrap_roots"]
    if "subject_ref" not in primitive["args"]:
        primitive["args"] = ["subject_ref"] + primitive["args"]
        primitive["argument_types"] = {
            "subject_ref": "Ref<Record>",
            **primitive["argument_types"],
        }
        primitive["semantics"] = (
            "Verify independent current root key/custodian signatures over the exact "
            "bounded preparatory namespace and initial records, and require subject_ref "
            "to be one of those exact initial records by record_id and record_type. "
            "Acceptance established here is OUT OF BAND: it is a recorded human root act "
            "under an expiring authorization scoped to initialize_preparatory_namespace, "
            "derived from no other predicate, and it is the only terminator of the "
            "acceptance chain. Crossrefs may resolve only this initialization group; no "
            "grant to spend/contact/disclose or simulated professional standing is created."
        )
        primitive["argument_schema"] = io.argument_schema(
            primitive["argument_types"], record_enum=io.business_record_types()
        )

    # --- 2. one named genesis predicate per chain record, correctly typed. ---
    added_predicates = []
    chain_records = sorted({name.split(".")[1] for name in ungrounded})
    for record_name in chain_records:
        predicate_id = genesis_predicate_id(record_name)
        if predicate_id in predicates:
            continue
        argument_types = {
            "subject_ref": f"Ref<{record_name}>",
            "authorization": AUTHORIZATION,
            "records": CANDIDATES,
        }
        predicates[predicate_id] = {
            "version": "1.0",
            "argument_types": argument_types,
            "body": {
                "op": "bootstrap_roots",
                "subject_ref": {"arg": "subject_ref"},
                "authorization": {"arg": "authorization"},
                "records": {"arg": "records"},
            },
            "meaning": (
                f"{record_name} is admitted as a member of the signed genesis group. The "
                "actual founder and root custodian authenticated this exact bounded "
                "preparatory namespace and its initial records; acceptance here derives "
                "from that recorded human act and from no predicate. The identities of "
                "those humans are a deployment prerequisite and are not supplied by any "
                "contract in this directory."
            ),
            "owner_component": "S1-C01",
            "source": "11-schemas-state-contracts.md#bootstrap-and-competent-acceptance",
            "failure": (
                "false or unresolved denies the genesis path; the derived acceptance path "
                "remains available and an ungrounded chain must deny rather than assume"
            ),
            "implementation_status": (
                "specified; conformance interpreter only, no production binding implemented"
            ),
            "argument_schema": io.argument_schema(argument_types),
        }
        added_predicates.append(predicate_id)

    # --- 3. each chain criterion offers the genesis branch. ---
    rewritten = []
    for criterion_id in ungrounded:
        criterion = predicates[criterion_id]
        record_name = criterion_id.split(".")[1]
        children = criterion["body"]["predicates"]
        if any(child.get("op") == "any" for child in children):
            continue
        structural = [c for c in children if c.get("op") not in OBLIGATION_OPS]
        derived = [c for c in children if c.get("op") in OBLIGATION_OPS]
        if not derived:
            continue
        criterion["argument_types"]["bootstrap_authorization"] = AUTHORIZATION
        criterion["argument_types"]["bootstrap_records"] = CANDIDATES
        criterion["argument_schema"] = io.argument_schema(criterion["argument_types"])
        criterion["body"]["predicates"] = structural + [{
            "op": "any",
            "predicates": [
                {
                    "op": "call",
                    "predicate_id": genesis_predicate_id(record_name),
                    "arguments": {
                        "subject_ref": {"arg": "subject_ref"},
                        "authorization": {"arg": "bootstrap_authorization"},
                        "records": {"arg": "bootstrap_records"},
                    },
                },
                {"op": "all", "predicates": derived},
            ],
        }]
        rewritten.append(criterion_id)

    report = {
        "ungrounded_chain_nodes_found": ungrounded,
        "genesis_predicates_added": added_predicates,
        "criteria_given_a_genesis_disjunct": rewritten,
        "bootstrap_roots_args": primitives["bootstrap_roots"]["args"],
    }
    print(json.dumps(report, indent=2))
    if dry_run:
        print("dry run; nothing written")
        return 0
    io.save("predicate-registry.json", predicates)
    io.save("primitive-registry.json", primitives)
    # The inventory tracks the registry. R7 makes this derivation the validator's
    # job rather than an author's; until then the eight new predicates are synced
    # here so the coverage check measures the registry and not a stale list.
    inventory = io.load_stable("coverage-inventory.json")
    inventory["canonical_predicates"] = sorted(predicates)
    io.save("coverage-inventory.json", inventory)
    print("wrote predicate-registry.json, primitive-registry.json, coverage-inventory.json")
    # R1 recomputes argument_types from what is transitively read; the two new
    # criterion arguments have to reach the edges that call those criteria.
    subprocess.run([sys.executable, str(HERE / "repair_r1_criterion_calls.py")], check=True)
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))
