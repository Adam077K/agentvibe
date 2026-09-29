#!/usr/bin/env python3
"""R16: run every POSITIVE fixture and fail if any of them is REJECTED.

The negative suite proves the validator can say no. It cannot tell a checker that
refuses the seventeen adverse cases from one that refuses everything -- and a checker
that refuses everything passes every adverse row. That is the whole of the acceptance
protocol's pairing rule, and of X17's false-exclusion requirement: BOTH NUMBERS ARE
REPORTED OR NEITHER IS.

So each adverse fixture of `fixtures/negative/r16-*` ships a paired benign fixture here.
A benign fixture is the registry edit its case implies -- the legitimate thing a real
author would write -- and the validator MUST accept it. A benign fixture that is
rejected is a FALSE EXCLUSION, which is a defect of the same class as a missed adverse
case and is reported the same way.

A fixture is `fixtures/positive/<id>.json`, in the same shape the negative runner reads,
with `expect_pass: true` in place of `expect_failure_contains`:

  {"id": ..., "repair": "R16", "case": ..., "why": ..., "expect_pass": true,
   "patch": [{"file": "predicate-registry.json", "pointer": "/some.predicate.v1/body/...",
              "op": "add", "value": ...}]}

Every fixture is DECLARED in `fixtures/positive/MANIFEST.json`, with a floor. A declared
fixture that is absent is a control someone deleted; one present and undeclared is a
control the denominator does not know about. Both fail, in both directions, for the
reason RC-04 gives about the negative manifest.

The scratch tree, the symlinked registries and the validator invocation are NOT
reimplemented here: `execute_fixture` is imported from tools/run_negative_fixtures.py.
Two implementations of "build a scratch tree and run the validator in it" would disagree
exactly when it mattered, and that tree layout is where four separate
failures-for-the-wrong-reason have already been found.

Usage: python3 tools/run_positive_fixtures.py [--verbose]
Exit 0 when every declared fixture passed validation.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

_TOOLS = Path(__file__).absolute().parent
ROOT = _TOOLS.parent
FIXTURES = ROOT / "fixtures" / "positive"
MANIFEST = FIXTURES / "MANIFEST.json"

# RC2-01 and RC-05, applied to this directory for the same reason they are applied to
# `fixtures/negative`: the denominator lives INSIDE the directory it measures, so a
# symlinked `fixtures/positive` carries its own MANIFEST.json with it and every
# comparison agrees with itself while describing a tree other than this one. NOT
# `.resolve()` -- `tools/` is a symlink inside every fixture scratch tree, and resolving
# through it lands in the real contracts directory.
for _component in (_TOOLS, _TOOLS.parent, FIXTURES.parent, FIXTURES):
    if _component.is_symlink():
        sys.exit("refusing to run: %s is a symlink, so this runner would report on the "
                 "link target while naming the tree in front of it (RC-05/RC2-01)"
                 % _component)

sys.path.insert(0, str(_TOOLS))
from run_negative_fixtures import execute_fixture  # noqa: E402

# The headline validate_contracts.py branches on, asserted to exist by that file for the
# reason it asserts the negative runner's: a branch on a string the other side has
# renamed is a branch nothing takes.
FIXTURE_RATCHET = "positive fixture count ratchet (R16)"
# One failure record carries the REASON, not just the id, so the caller attaches
# something a reader can act on rather than a blind tail of a transcript (RC3-03).
FAILURE_RECORD_KEYS = ("id", "reason")
REPORT_MARKER = "--- positive fixture report (JSON follows) ---"


def discover():
    """Every fixture in the tree, by the one discovery rule. MANIFEST.json is the
    declaration and not a fixture, and is excluded BY NAME so the count it declares is
    never satisfied by itself."""
    found = []
    for path in sorted(FIXTURES.glob("*.json")):
        if path.name == MANIFEST.name:
            continue
        found.append((path.stem, json.loads(path.read_text(encoding="utf-8")), FIXTURES))
    for path in sorted(FIXTURES.glob("*/fixture.json")):
        found.append((path.parent.name, json.loads(path.read_text(encoding="utf-8")),
                      path.parent))
    return sorted(found, key=lambda entry: entry[0])


def run_fixture(fixture, base, verbose):
    """A positive fixture passes when the validator ACCEPTED it."""
    code, output = execute_fixture(fixture, base)
    if code is None:
        return False, output
    if code == 0:
        if verbose:
            print("    accepted, as a benign case must be")
        return True, "accepted as required"
    return False, ("FALSE EXCLUSION: the benign case was REJECTED. The control refuses "
                   "more than the adverse case it was written for, so its paired adverse "
                   "number cannot be read as a detection:\n" + output[-900:])


def main(verbose: bool) -> int:
    if not FIXTURES.is_dir():
        print("no fixtures/positive directory; an adverse suite with no paired benign "
              "suite reports one number of the two the pairing rule requires")
        return 1
    if not MANIFEST.exists():
        print("fixtures/positive/MANIFEST.json is missing; it declares how many benign "
              "fixtures must run, and without it a suite that lost all but one reports "
              "a pass")
        return 1
    declared_document = json.loads(MANIFEST.read_text(encoding="utf-8"))
    declared = declared_document["fixtures"]
    floor = declared_document["floor"]
    if len(declared) != len(set(declared)):
        print("MANIFEST.json declares a fixture id twice; the declared count would then "
              "be met by fewer fixtures than it names")
        return 1
    fixtures = discover()
    if not fixtures:
        print("fixtures/positive is empty; refusing to report a vacuous pass")
        return 1
    present = [identifier for identifier, _, _ in fixtures]
    absent = sorted(set(declared) - set(present))
    undeclared = sorted(set(present) - set(declared))
    if absent or undeclared or len(declared) < floor:
        print(REPORT_MARKER)
        print(json.dumps({
            "check": FIXTURE_RATCHET,
            "declared": len(declared), "present": len(present), "floor": floor,
            "declared_but_absent": absent, "present_but_undeclared": undeclared,
            "note": "every benign fixture is declared in fixtures/positive/MANIFEST.json "
                    "and the declared count may not fall below the floor; adding or "
                    "removing one is an edit to that file as well as to the tree",
        }, indent=2))
        return 1
    failures = []
    for identifier, fixture, base in fixtures:
        if fixture["id"] != identifier:
            mismatch = (f"fixture declares id {fixture['id']!r}; the manifest names "
                        "fixtures by file, so the two must agree")
            print(f"  [FAIL] {identifier}: {mismatch}")
            failures.append({"id": identifier, "reason": mismatch})
            continue
        if fixture.get("expect_pass") is not True:
            mismatch = ("a positive fixture declares `expect_pass: true`; without it "
                        "nobody reading the file can tell which suite it belongs to")
            print(f"  [FAIL] {identifier}: {mismatch}")
            failures.append({"id": identifier, "reason": mismatch})
            continue
        ok, detail = run_fixture(fixture, base, verbose)
        print(f"  [{'ok' if ok else 'FAIL'}] {fixture['repair']} {fixture['id']}: {detail}")
        if not ok:
            failures.append({"id": fixture["id"], "reason": detail})
    print(REPORT_MARKER)
    print(json.dumps({"fixtures": len(fixtures), "declared": len(declared),
                      "floor": floor,
                      "passed_as_required": len(fixtures) - len(failures),
                      "falsely_excluded": failures}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main("--verbose" in sys.argv))
