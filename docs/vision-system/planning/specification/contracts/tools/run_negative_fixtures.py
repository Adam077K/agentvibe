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
       python3 tools/run_negative_fixtures.py --self-test   (RC2-01; runs no fixture)
Exit 0 when every fixture failed as required.
"""
from __future__ import annotations
import json
import os
import shutil
import subprocess
import sys
import tempfile
import traceback
from pathlib import Path

_TOOLS = Path(__file__).absolute().parent
ROOT = _TOOLS.parent
FIXTURES = ROOT / "fixtures" / "negative"
# RC-04: the fixture suite declares its own denominator, in the tree, beside the fixtures.
# Without it, deleting 26 of 27 fixtures left `negative_fixtures_rejected: 1` and exit 0 --
# a suite that reports a verdict it has no coverage for. `if not fixtures` catches only the
# empty directory, which is the one case nobody reaches by accident.
MANIFEST = FIXTURES / "MANIFEST.json"

# RC2-01 extends the loop below to `fixtures/negative` and its parent, and the reason is
# the RC-04 comment two lines up: the denominator lives INSIDE the directory it measures,
# so a symlinked `fixtures/negative` carries its own MANIFEST.json with it and every
# comparison agrees with itself. Measured by the recheck -- `fixtures/negative` pointed at
# a directory holding one fixture and a manifest declaring one printed
# `{"fixtures": 1, "declared": 1, "passed_as_required": 1, "leaked": []}` at EXIT 0. One of
# thirty-one, which is RC-04's original defect walked back in through the path rather than
# through the count. Pointed the other way it reported 31 fixtures for a tree holding none
# of its own: the exact sentence in this refusal message.
#
# RC-05: NOT `.resolve()`. `tools/` is a symlink inside every fixture scratch tree, and
# `Path(__file__).resolve()` follows it -- so a runner invoked through a symlinked `tools/`
# counted the REAL tree's fixtures while claiming to measure the tree in front of it. The
# recheck demonstrated it: a scratch tree holding ONE fixture reported 27. `absolute()`
# prepends the cwd and follows nothing, and every directory this runner derives a COUNT
# from is then asserted to be real, because an un-resolved path through a symlinked parent
# is the same defect one level up.
#
# A negative fixture cannot express this one -- a fixture is a mutation of the registries
# judged by validate_contracts.py, and this is a property of the tree the RUNNER is invoked
# in. `--self-test` builds it instead; validate_contracts.py runs that.
for _component in (_TOOLS, _TOOLS.parent, FIXTURES.parent, FIXTURES):
    if _component.is_symlink():
        sys.exit("refusing to run: %s is a symlink, so this runner would report on the "
                 "link target while naming the tree in front of it (RC-05, extended to "
                 "fixtures/ by RC2-01)" % _component)


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


# Everything tools/author_phase_content.py writes. A fixture that REGENERATES must
# materialise these first: they are symlinks in the scratch tree, and writing through a
# symlink would rewrite the committed registry from inside a negative fixture.
AUTHORED = ("predicate-registry.json", "phase-content-gaps.json",
            "primitive-registry.json", "coverage-inventory.json")


def materialise(directory, names):
    for name in names:
        target = directory / name
        if target.is_symlink():
            target.unlink()
            shutil.copy2(ROOT / name, target)


def apply_tools_patch(directory, base, steps):
    """Replace a named block of a tools/ module with a hunk shipped by the fixture.

    RC-02 is the reason this exists. The criterion-content oracle compares the registry
    to tools/phase_content.py, so the mutation that matters is not a mutation of the
    REGISTRY at all -- it is one hunk of the derivation, regenerated. A fixture suite that
    can only patch JSON cannot express the defect its own oracle is blind to.
    """
    for step in steps:
        target = directory / step["file"]
        text = target.read_text(encoding="utf-8")
        start = text.find(step["block_start"])
        if start < 0:
            raise ValueError("tools_patch anchor not found: %r in %s"
                             % (step["block_start"], step["file"]))
        end = text.find(step["block_end"], start + len(step["block_start"]))
        if end < 0:
            raise ValueError("tools_patch end anchor not found: %r in %s"
                             % (step["block_end"], step["file"]))
        replacement = (base / step["replacement"]).read_text(encoding="utf-8")
        target.write_text(text[:start] + replacement + text[end:], encoding="utf-8")


def regenerate(directory):
    """Run the authoring tool inside the scratch tree, exactly as an author would."""
    materialise(directory, AUTHORED)
    return subprocess.run(
        [sys.executable, "tools/author_phase_content.py", "."], cwd=directory,
        capture_output=True, text=True)


def execute_fixture(fixture, base):
    """Build the scratch tree, apply the fixture, run the validator in it.

    Returns (returncode, output). `returncode is None` means the fixture never reached
    the validator -- its regeneration step failed -- and `output` is the reason.

    Split out of run_fixture() so tools/run_positive_fixtures.py can judge the SAME
    execution the other way round. Two implementations of "build a scratch tree and run
    the validator in it" would disagree exactly when it mattered, and the tree layout
    below is where four separate failures-for-the-wrong-reason have already been found.
    """
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
        # And planning's own subdirectories, `reviews/` above all: pinned-conjuncts.json
        # cites the review that states each finding, and the validator READS those files to
        # check the citation resolves. Without this the check fires inside every fixture
        # that gets far enough to reach it -- `finding_sources names a file that does not
        # exist` -- which is a failure for the wrong reason, and this runner counts that as
        # a leak. Found by the positive control for r13, not by reading.
        for child in sorted(ROOT.parent.parent.glob("*")):
            if child.is_dir() and child.name != "specification":
                os.symlink(child, planning / child.name)
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
        # RC4-03. The two fixture MANIFESTs, and NOT the fixtures themselves. The suite
        # does not run inside a fixture's tree -- CONTRACTS_FIXTURE_RUN=1 skips it, or this
        # would recurse -- but the FLOOR is a property of the manifest alone rather than of
        # the tree, so validate_contracts.py checks it outside that guard and a fixture can
        # therefore express it. Symlinks, so an unpatched fixture measures the real
        # declaration; apply_patch materialises the file it writes through.
        for kind in ("negative", "positive"):
            (directory / "fixtures" / kind).mkdir(parents=True)
            os.symlink(ROOT / "fixtures" / kind / "MANIFEST.json",
                       directory / "fixtures" / kind / "MANIFEST.json")
        shutil.copy2(ROOT / "validate_contracts.py", directory / "validate_contracts.py")
        # The validator imports the one shared path grammar from tools/; without this
        # every fixture "fails" on ModuleNotFoundError, which is a failure for the
        # wrong reason -- and this runner counts that as a leak, correctly.
        #
        # A fixture that patches tools/ gets a COPY instead: a symlinked directory cannot
        # hold a mutation, and a patch written through it would edit the real tools.
        if fixture.get("tools_patch"):
            shutil.copytree(ROOT / "tools", directory / "tools")
            apply_tools_patch(directory, base, fixture["tools_patch"])
        else:
            os.symlink(ROOT / "tools", directory / "tools")
        apply_patch(directory, fixture["patch"])
        if fixture.get("regenerate_from_derivation"):
            authored = regenerate(directory)
            if authored.returncode != 0:
                return None, ("the fixture's regeneration step failed, so the mutation "
                              "never reached the validator:\n"
                              + (authored.stdout + authored.stderr)[-900:])
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
    return completed.returncode, completed.stdout + completed.stderr


def run_fixture(fixture, base, verbose):
    """A negative fixture passes when the validator REJECTED it, for the stated reason.

    Returns (ok, kind, detail). `kind` is one of LEAK_KINDS and is RC4-05's field: the
    three ways a negative fixture fails are three different things and the caller printed
    one sentence over all of them. The runner has always known which; only the sentence
    did not.
    """
    code, output = execute_fixture(fixture, base)
    if code is None:
        return False, "never_ran", output
    if code == 0:
        return False, "passed", ("fixture PASSED validation; the check that should reject "
                                 "it is absent")
    wanted = fixture["expect_failure_contains"]
    if wanted not in output:
        return False, "wrong_reason", (f"failed for the wrong reason; expected {wanted!r} "
                                       f"in:\n{output[-900:]}")
    if verbose:
        print(f"    rejected with: {wanted}")
    return True, "rejected", "rejected as required"


# RC3-03. A leak entry carries the REASON, not just the id, and the caller reads the
# structured list instead of slicing a transcript. validate_contracts.py used to attach
# `stdout[-2000:]` to its generic wrapper -- one line per fixture, so with 33 fixtures the
# FIRST fixture's `failed for the wrong reason; expected ...` line fell outside the tail
# and was gone. Measured by the recheck on its probe 7c: `failed for the wrong reason`
# occurred ZERO times in the validator's entire output, while the headline said the fixture
# "was not rejected" -- it WAS rejected, by a different check, and the sentence that would
# have corrected that is the one the slice threw away. The reason existed here the whole
# time. This constant is what the validator asserts still exists, for the same reason it
# asserts FIXTURE_RATCHET does: a reader on the other side of a rename gets the wrong
# message rather than an error.
#
# RC4-05 adds `kind`, and the reason it is a KEY rather than a prefix of `reason` is the
# same reason the report is found by a marker rather than by the last `{`: the caller must
# not have to parse prose to learn which of four things happened. The recheck measured two
# leaks of two different kinds printed under one sentence -- "a negative fixture was not
# rejected; the check it names is gone" -- over a fixture that WAS rejected, by a check
# that is not gone. RC2-04 had already split COUNT MISMATCH out of that headline for
# exactly this reason; the leak arm still carried the rest.
LEAK_RECORD_KEYS = ("id", "kind", "reason")

# The closed set, declared here and asserted by validate_contracts.py, which refuses a kind
# it does not have a sentence for rather than printing a generic one over it.
#
#   passed        the validator accepted the mutation: the check is GONE.
#   wrong_reason  the validator rejected it, by a different check: the check the fixture
#                 names is UNPROVEN. Not the same fact, and the opposite instruction to
#                 the reader.
#   never_ran     the fixture never reached the validator -- its regeneration step failed,
#                 or run_fixture raised. A control that did not execute (RC4-06).
#   id_mismatch   the document's own id disagrees with the file the manifest names it by.
LEAK_KINDS = ("passed", "wrong_reason", "never_ran", "id_mismatch")

# And the marker that DELIMITS the report, because attaching the reason is what broke the
# caller's way of finding it. validate_contracts.py located this JSON with
# `stdout[stdout.rindex("{"):]` -- the last `{` in the transcript -- which worked only
# while every value in the report was a scalar or a list of scalars. A `reason` is a
# validator AssertionError, and those carry dicts: `{'findings': [...], 'decisions': ...}`.
# So the last `{` became one inside a leak record's own text, the slice decoded to
# nothing, and the caller fell through to its "the runner reported no per-fixture result"
# arm -- reporting the absence of a list that was right there. Measured on a probe 7c
# reproduction, which is the only way it was going to be found.
#
# Both JSON reports this module prints for that caller carry the marker, and the report is
# the last thing printed in both branches, so "from the marker to the end" is exact.
REPORT_MARKER = "--- negative fixture report (JSON follows) ---"


def discover():
    """Every fixture in the tree, as (id, document, base), by the one discovery rule.

    Two shapes: `<id>.json`, and `<id>/fixture.json` for a fixture that ships files
    alongside its declaration -- a patched hunk of a tools/ module, which is what RC-02
    needs and what a single JSON file cannot carry readably. `base` is the directory a
    fixture's own auxiliary files are read from.

    `MANIFEST.json` is the declaration, not a fixture, and is excluded by name here so
    that the count it declares is never satisfied by itself.
    """
    found = []
    for path in sorted(FIXTURES.glob("*.json")):
        if path.name == MANIFEST.name:
            continue
        found.append((path.stem, json.loads(path.read_text(encoding="utf-8")), FIXTURES))
    for path in sorted(FIXTURES.glob("*/fixture.json")):
        found.append((path.parent.name, json.loads(path.read_text(encoding="utf-8")),
                      path.parent))
    return sorted(found, key=lambda entry: entry[0])


def self_test(verbose: bool) -> int:
    """RC2-01: prove the symlink guard covers `fixtures/negative`, in a tree built here.

    Every other control in this package is a negative fixture, and this one cannot be. A
    fixture is a mutation of the registries judged by validate_contracts.py; a symlinked
    fixtures directory is a property of the tree THIS RUNNER is invoked in, which no
    fixture can set up for itself. So the control is built: two scratch trees differing in
    exactly one thing.

    Both halves are asserted, and the second is the one that makes the first mean
    anything. A guard that refuses the symlinked tree AND the real one refuses everything
    and proves nothing -- which is how a control degrades into a control-shaped constant.

    The guard runs at IMPORT, so importing the module is the whole probe: no fixture is
    ever run, and a broken guard costs a failed import rather than half an hour of
    validator subprocesses.
    """
    probe = ("import sys; sys.path.insert(0, 'tools'); "
             "import run_negative_fixtures")
    results = {}
    with tempfile.TemporaryDirectory() as scratch:
        for case, symlinked in (("real_directory", False), ("symlinked_directory", True)):
            contracts = Path(scratch) / case / "contracts"
            (contracts / "tools").mkdir(parents=True)
            shutil.copy2(Path(__file__).absolute(), contracts / "tools" / Path(__file__).name)
            (contracts / "fixtures").mkdir()
            if symlinked:
                os.symlink(FIXTURES, contracts / "fixtures" / "negative")
            else:
                (contracts / "fixtures" / "negative").mkdir()
            completed = subprocess.run([sys.executable, "-c", probe], cwd=contracts,
                                       capture_output=True, text=True)
            results[case] = {"exit": completed.returncode,
                             "said": (completed.stdout + completed.stderr).strip()[-300:]}
    refusal = results["symlinked_directory"]
    control = results["real_directory"]
    failures = []
    if refusal["exit"] == 0:
        failures.append("a symlinked fixtures/negative was ACCEPTED: the runner would "
                        "report a count for a tree that holds none of its own (RC2-01)")
    elif "fixtures/negative" not in refusal["said"] or "symlink" not in refusal["said"]:
        failures.append("the refusal does not name the symlinked fixtures directory, so a "
                        "reader cannot tell which guard fired: " + refusal["said"])
    if control["exit"] != 0:
        failures.append("the POSITIVE CONTROL failed: a real fixtures/negative was "
                        "refused too, so the refusal above distinguishes nothing: "
                        + control["said"])
    if verbose or failures:
        print(json.dumps(results, indent=2))
    print(json.dumps({"check": "symlink guard covers fixtures/negative (RC2-01)",
                      "refused_symlinked": refusal["exit"] != 0,
                      "accepted_real": control["exit"] == 0,
                      "failures": failures}, indent=2))
    return 1 if failures else 0


def main(verbose: bool) -> int:
    if not FIXTURES.is_dir():
        print("no fixtures/negative directory; a validator with no negative control "
              "is the defect this runner exists to prevent")
        return 1
    if not MANIFEST.exists():
        print("fixtures/negative/MANIFEST.json is missing; it declares how many fixtures "
              "must run, and without it a suite that lost 26 of 27 reports a pass (RC-04)")
        return 1
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    declared = manifest["fixtures"]
    # RC4-03: the declared count is a denominator and it needs a FLOOR, because a fixture
    # struck from the tree and from the manifest in one edit leaves the two agreeing with
    # each other. The floor is stated here, stated again as a literal in
    # validate_contracts.py, and the two are compared there. Mirrors the positive runner,
    # which has had this since R16 and is where the shape is from.
    floor = manifest["floor"]
    if len(declared) != len(set(declared)):
        print("MANIFEST.json declares a fixture id twice; the declared count would then "
              "be met by fewer fixtures than it names")
        return 1
    fixtures = discover()
    if not fixtures:
        print("fixtures/negative is empty; refusing to report a vacuous pass")
        return 1
    present = [identifier for identifier, _, _ in fixtures]
    absent = sorted(set(declared) - set(present))
    undeclared = sorted(set(present) - set(declared))
    if absent or undeclared or len(declared) < floor:
        # Three directions, and each of them matters. A declared fixture that is gone is a
        # control someone deleted; a fixture present and undeclared is a control the
        # denominator does not know about, so deleting it later would be silent; and a
        # declared count below the floor is both of them done in one edit (RC4-03).
        print(REPORT_MARKER)
        print(json.dumps({
            "check": "negative fixture count ratchet (RC-04)",
            "declared": len(declared), "present": len(present), "floor": floor,
            "declared_but_absent": absent, "present_but_undeclared": undeclared,
            "note": "every fixture is declared in fixtures/negative/MANIFEST.json; adding "
                    "or removing one is an edit to that file as well as to the tree, and "
                    "the declared count may not fall below the floor",
        }, indent=2))
        return 1
    failures = []
    for identifier, fixture, base in fixtures:
        if fixture["id"] != identifier:
            mismatch = (f"fixture declares id {fixture['id']!r}; the manifest names "
                        "fixtures by file, so the two must agree")
            print(f"  [FAIL] {identifier}: {mismatch}")
            failures.append({"id": identifier, "kind": "id_mismatch", "reason": mismatch})
            continue
        try:
            ok, kind, detail = run_fixture(fixture, base, verbose)
        except Exception as error:  # noqa: BLE001 -- see below; the breadth is the point
            # RC4-06, and it was found by accident, which is the part worth keeping. A
            # derivation edit rewrote a line three fixtures use as a `tools_patch` anchor;
            # apply_tools_patch raised ValueError out of run_fixture and out of main(); the
            # runner died without printing REPORT_MARKER; and validate_contracts.py took
            # its no-report arm and attached "the runner reported no per-fixture result; it
            # refused before running a fixture, or died" -- after SEVENTEEN fixtures had
            # already reported [ok]. The sentence said the opposite of what happened, and
            # the 2,000-character transcript tail beside it is the blind tail RC3-03 exists
            # to replace. One malformed or stale fixture put the whole suite back on the
            # path RC3-03 removed, for every fixture rather than for itself.
            #
            # So an exception is THIS fixture's failure and nothing else's: an unrunnable
            # fixture is a control that is not working, which is what the leak list is for.
            # The breadth of the except is deliberate -- the caller must learn which fixture
            # raised and what it said, and narrowing it to the exception types seen so far
            # is how the next unanticipated one re-enters the blind-tail path.
            ok, kind = False, "never_ran"
            frames = traceback.extract_tb(error.__traceback__)
            where = ("%s:%d in %s" % (os.path.basename(frames[-1].filename),
                                      frames[-1].lineno, frames[-1].name)
                     if frames else "no traceback")
            detail = ("the fixture could not be RUN, so it judged nothing: "
                      "%s: %s (raised at %s)" % (type(error).__name__, error, where))
        print(f"  [{'ok' if ok else 'FAIL'}] {fixture['repair']} {fixture['id']}: {detail}")
        if not ok:
            failures.append({"id": fixture["id"], "kind": kind, "reason": detail})
    print(REPORT_MARKER)
    print(json.dumps({"fixtures": len(fixtures), "declared": len(declared),
                      "passed_as_required": len(fixtures) - len(failures),
                      "leaked": failures}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        sys.exit(self_test("--verbose" in sys.argv))
    sys.exit(main("--verbose" in sys.argv))
