#!/usr/bin/env python3
"""R8: run every negative fixture and fail if any of them PASSES.

A validator that cannot fail is the defect this package names in four places. The
committed registries passing proves nothing on its own -- `validate_contracts.py`
returned `{"status":"passed"}` on the tree the independent review then found seven
defects in, and its entire FI-12 evidence block exercised a 33-line in-file stub
that read zero bytes of any registry.

So each repair ships a counterexample: a minimal mutation of the real registries
that the repaired validator MUST reject. If a fixture passes, the check that was
supposed to catch it is gone, and this runner fails the build saying which one.

A fixture is `fixtures/negative/<id>.json`:

  {"id": ..., "repair": "R3", "why": ...,
   "expect_failure_contains": "primitive argument record type",
   "patch": [{"file": "predicate-registry.json", "pointer": "/some.predicate.v1",
              "op": "add"|"replace"|"remove", "value": ...}]}

The mutation is applied to a scratch directory in which every untouched file is a
SYMLINK to the real one, so a fixture cannot accidentally measure a stale copy and
16 MB of schema is not duplicated eight times.

Every fixture is DECLARED in `fixtures/negative/MANIFEST.json`. A declared fixture that is
absent fails, and a fixture present that nothing declares fails: the first is a control
someone deleted, the second is a control the denominator does not know about.

Usage: python3 tools/run_negative_fixtures.py [--verbose]
Exit 0 when every fixture failed as required.
"""
from __future__ import annotations
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# RC-05: NOT `.resolve()`. `tools/` is a symlink inside every fixture scratch tree, and
# `Path(__file__).resolve()` follows it -- so a runner invoked through a symlinked `tools/`
# counted the REAL tree's fixtures while claiming to measure the tree in front of it. The
# recheck demonstrated it: a scratch tree holding ONE fixture reported 27. `absolute()`
# prepends the cwd and follows nothing, and the two directories this runner derives its
# root from are then asserted to be real, because an un-resolved path through a symlinked
# parent is the same defect one level up.
_TOOLS = Path(__file__).absolute().parent
for _component in (_TOOLS, _TOOLS.parent):
    if _component.is_symlink():
        sys.exit("refusing to run: %s is a symlink, so this runner would report on the "
                 "link target while naming the tree in front of it (RC-05)" % _component)
ROOT = _TOOLS.parent
FIXTURES = ROOT / "fixtures" / "negative"
# RC-04: the fixture suite declares its own denominator, in the tree, beside the fixtures.
# Without it, deleting 26 of 27 fixtures left `negative_fixtures_rejected: 1` and exit 0 --
# a suite that reports a verdict it has no coverage for. `if not fixtures` catches only the
# empty directory, which is the one case nobody reaches by accident.
MANIFEST = FIXTURES / "MANIFEST.json"


def resolve(document, pointer):
    """Return (container, key) for an RFC6901 pointer, creating nothing."""
    parts = [p.replace("~1", "/").replace("~0", "~") for p in pointer.split("/") if p]
    container = document
    for part in parts[:-1]:
        container = container[int(part)] if isinstance(container, list) else container[part]
    return container, parts[-1]


def apply_patch(directory, patch):
    for step in patch:
        target = directory / step["file"]
        document = json.loads(target.read_text(encoding="utf-8"))
        container, key = resolve(document, step["pointer"])
        if isinstance(container, list):
            index = int(key)
            if step["op"] == "remove":
                del container[index]
            elif step["op"] == "add":
                container.insert(index, step["value"])
            else:
                container[index] = step["value"]
        elif step["op"] == "remove":
            container.pop(key)
        else:
            container[key] = step["value"]
        if target.is_symlink():
            target.unlink()
        target.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n",
                          encoding="utf-8")


def rederive_predicate_id_enum(directory):
    """Recompute values.schema.json's PredicateId enum inside the scratch tree.

    GR-04 made that enum DERIVED -- it must equal sorted(predicate-registry.json.keys())
    and validate_contracts.py fails on any difference. So it belongs here beside the
    inventory for exactly the same reason and it was found the same way: adding the R3
    fixture's one predicate left the committed enum one short, the derivation check fires
    early, and R3 was rejected saying `PredicateId enum differs` rather than
    `primitive argument record type`. Right answer, wrong question -- which this runner
    counts as a leak, correctly, and that is how the omission surfaced.

    Anything derived from a registry must move with the registry inside the scratch tree,
    or a fixture that touches the registry can never reach the check it names.
    """
    values = directory / "values.schema.json"
    schema = json.loads(values.read_text(encoding="utf-8"))
    predicates = json.loads((directory / "predicate-registry.json").read_text(encoding="utf-8"))
    schema["$defs"]["PredicateId"]["enum"] = sorted(predicates)
    if values.is_symlink():
        values.unlink()
    values.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n",
                      encoding="utf-8")


def rederive_inventory(directory):
    """Recompute coverage-inventory.json inside the scratch tree, the same way
    tools/derive_inventory.py does for the real one. Run as a subprocess so the
    module's ROOT resolves to the scratch copy, not to the committed directory."""
    script = (
        "import sys, json, pathlib;"
        "sys.path.insert(0, 'tools');"
        "import derive_inventory as d;"
        "here = pathlib.Path('.').resolve();"
        "d.CONTRACTS = here;"
        "d.SOURCES = here.parent;"
        "c = json.loads(pathlib.Path('coverage-inventory.json').read_text());"
        "pathlib.Path('coverage-inventory.json').write_text("
        "json.dumps(d.derive(c), indent=2, ensure_ascii=False) + '\\n')"
    )
    (directory / "coverage-inventory.json").unlink()
    shutil.copy2(ROOT / "coverage-inventory.json", directory / "coverage-inventory.json")
    subprocess.run([sys.executable, "-c", script], cwd=directory, check=True,
                   capture_output=True, text=True)


def run_fixture(fixture, verbose):
    with tempfile.TemporaryDirectory() as scratch:
        # Mirror the real layout: <scratch>/planning/specification/contracts/, beside
        # the source documents the inventory derivation reads from ROOT.parent and the
        # PROSE CONTRACTS the criterion content cites. A flat scratch dir would make
        # the validator derive against sources that are not there.
        #
        # Two levels, not one, and the second is load-bearing: criteria cite
        # `../02-architecture-selection.md`, which lives one directory ABOVE the
        # specification. With the old single-level layout that resolved to the system
        # temp root, so `derived_from names a file that does not exist` fired inside
        # every fixture and four of them then "failed for the wrong reason" -- the
        # runner caught it, which is what it is for.
        planning = Path(scratch) / "planning"
        specification = planning / "specification"
        directory = specification / "contracts"
        directory.mkdir(parents=True)
        for source_document in sorted(ROOT.parent.glob("*.json")):
            os.symlink(source_document, specification / source_document.name)
        for prose in sorted(ROOT.parent.glob("*.md")):
            os.symlink(prose, specification / prose.name)
        for prose in sorted(ROOT.parent.parent.glob("*.md")):
            os.symlink(prose, planning / prose.name)
        # Three levels, because a criterion may cite the DIRECTIVE itself:
        # `../../inputs/DIRECTIVE.md` resolves above `planning/`, and without this every
        # fixture would fail on "derived_from names a file that does not exist" -- the
        # wrong reason, which this runner counts as a leak. Same defect the two-level
        # layout above was written to fix, one directory further out.
        for sibling in sorted(ROOT.parent.parent.parent.glob("*")):
            if sibling.is_dir() and sibling.name != "planning":
                os.symlink(sibling, Path(scratch) / sibling.name)
        for source in sorted(ROOT.glob("*.json")):
            os.symlink(source, directory / source.name)
        shutil.copy2(ROOT / "validate_contracts.py", directory / "validate_contracts.py")
        # The validator imports the one shared path grammar from tools/; without this
        # every fixture "fails" on ModuleNotFoundError, which is a failure for the
        # wrong reason -- and this runner counts that as a leak, correctly.
        os.symlink(ROOT / "tools", directory / "tools")
        apply_patch(directory, fixture["patch"])
        if fixture.get("rederive_from_registries"):
            # A fixture that adds or removes a registry entry would otherwise trip a
            # DERIVATION check first and never reach the check it names: R7's inventory
            # drift, or GR-04's PredicateId enum drift. Re-deriving keeps each fixture
            # pointed at ITS OWN check -- a fixture that fails for the wrong reason
            # proves nothing, and this runner already treats that as a leak.
            #
            # Every derived file goes in here. The key was `rederive_inventory` while
            # the inventory was the only one; a name that says which registry changed,
            # rather than which file happens to be derived from it today, does not have
            # to be renamed again when the next derivation lands.
            rederive_inventory(directory)
            rederive_predicate_id_enum(directory)
        completed = subprocess.run(
            [sys.executable, "validate_contracts.py"], cwd=directory,
            capture_output=True, text=True,
            # Set here, not only by the validator that spawns this runner. Running
            # this runner directly from a shell otherwise lets each fixture's
            # validator start the whole fixture suite again, and the real failure
            # gets buried inside a nested transcript of itself.
            env={**os.environ, "CONTRACTS_FIXTURE_RUN": "1"})
    output = completed.stdout + completed.stderr
    if completed.returncode == 0:
        return False, "fixture PASSED validation; the check that should reject it is absent"
    wanted = fixture["expect_failure_contains"]
    if wanted not in output:
        return False, f"failed for the wrong reason; expected {wanted!r} in:\n{output[-900:]}"
    if verbose:
        print(f"    rejected with: {wanted}")
    return True, "rejected as required"


def discover():
    """Every fixture in the tree, as (id, document), by the one discovery rule.

    `MANIFEST.json` is the declaration, not a fixture, and is excluded by name here so
    that the count it declares is never satisfied by itself.
    """
    found = []
    for path in sorted(FIXTURES.glob("*.json")):
        if path.name == MANIFEST.name:
            continue
        found.append((path.stem, json.loads(path.read_text(encoding="utf-8"))))
    return found


def main(verbose: bool) -> int:
    if not FIXTURES.is_dir():
        print("no fixtures/negative directory; a validator with no negative control "
              "is the defect this runner exists to prevent")
        return 1
    if not MANIFEST.exists():
        print("fixtures/negative/MANIFEST.json is missing; it declares how many fixtures "
              "must run, and without it a suite that lost 26 of 27 reports a pass (RC-04)")
        return 1
    declared = json.loads(MANIFEST.read_text(encoding="utf-8"))["fixtures"]
    if len(declared) != len(set(declared)):
        print("MANIFEST.json declares a fixture id twice; the declared count would then "
              "be met by fewer fixtures than it names")
        return 1
    fixtures = discover()
    if not fixtures:
        print("fixtures/negative is empty; refusing to report a vacuous pass")
        return 1
    present = [identifier for identifier, _ in fixtures]
    absent = sorted(set(declared) - set(present))
    undeclared = sorted(set(present) - set(declared))
    if absent or undeclared:
        # Both directions, and both of them matter. A declared fixture that is gone is a
        # control someone deleted; a fixture present and undeclared is a control the
        # denominator does not know about, so deleting it later would be silent.
        print(json.dumps({
            "check": "negative fixture count ratchet (RC-04)",
            "declared": len(declared), "present": len(present),
            "declared_but_absent": absent, "present_but_undeclared": undeclared,
            "note": "every fixture is declared in fixtures/negative/MANIFEST.json; adding "
                    "or removing one is an edit to that file as well as to the tree",
        }, indent=2))
        return 1
    failures = []
    for identifier, fixture in fixtures:
        if fixture["id"] != identifier:
            print(f"  [FAIL] {identifier}: fixture declares id {fixture['id']!r}; the "
                  "manifest names fixtures by file, so the two must agree")
            failures.append(identifier)
            continue
        ok, detail = run_fixture(fixture, verbose)
        print(f"  [{'ok' if ok else 'FAIL'}] {fixture['repair']} {fixture['id']}: {detail}")
        if not ok:
            failures.append(fixture["id"])
    print(json.dumps({"fixtures": len(fixtures), "declared": len(declared),
                      "passed_as_required": len(fixtures) - len(failures),
                      "leaked": failures}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main("--verbose" in sys.argv))
