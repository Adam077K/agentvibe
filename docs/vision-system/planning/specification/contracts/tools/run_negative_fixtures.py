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

ROOT = Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "fixtures" / "negative"


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


def run_fixture(fixture, verbose):
    with tempfile.TemporaryDirectory() as scratch:
        directory = Path(scratch)
        for source in sorted(ROOT.glob("*.json")):
            os.symlink(source, directory / source.name)
        shutil.copy2(ROOT / "validate_contracts.py", directory / "validate_contracts.py")
        apply_patch(directory, fixture["patch"])
        completed = subprocess.run(
            [sys.executable, "validate_contracts.py"], cwd=directory,
            capture_output=True, text=True)
    output = completed.stdout + completed.stderr
    if completed.returncode == 0:
        return False, "fixture PASSED validation; the check that should reject it is absent"
    wanted = fixture["expect_failure_contains"]
    if wanted not in output:
        return False, f"failed for the wrong reason; expected {wanted!r} in:\n{output[-900:]}"
    if verbose:
        print(f"    rejected with: {wanted}")
    return True, "rejected as required"


def main(verbose: bool) -> int:
    if not FIXTURES.is_dir():
        print("no fixtures/negative directory; a validator with no negative control "
              "is the defect this runner exists to prevent")
        return 1
    fixtures = sorted(FIXTURES.glob("*.json"))
    if not fixtures:
        print("fixtures/negative is empty; refusing to report a vacuous pass")
        return 1
    failures = []
    for path in fixtures:
        fixture = json.loads(path.read_text(encoding="utf-8"))
        ok, detail = run_fixture(fixture, verbose)
        print(f"  [{'ok' if ok else 'FAIL'}] {fixture['repair']} {fixture['id']}: {detail}")
        if not ok:
            failures.append(fixture["id"])
    print(json.dumps({"fixtures": len(fixtures), "passed_as_required": len(fixtures) - len(failures),
                      "leaked": failures}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main("--verbose" in sys.argv))
