#!/usr/bin/env python3
"""R7 (CCR-07): write coverage-inventory.json from tools/derive_inventory.py.

The derivation, and why each list is no longer authored beside the thing it checks,
is documented in tools/derive_inventory.py. This script only applies it; the
validator recomputes the same derivation and fails on any difference, so the
committed file cannot drift from its sources without failing a build.

Usage: python3 tools/repair_r7_derive_inventory.py [--dry-run]
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import contracts_io as io  # noqa: E402
import derive_inventory  # noqa: E402


def main(dry_run: bool) -> int:
    committed = io.load_stable("coverage-inventory.json")
    differences = derive_inventory.differences(committed)
    derived = derive_inventory.derive(committed)
    print(json.dumps({
        "keys_that_differed": [d[0] for d in differences],
        "derived_sizes": {k: len(v) if isinstance(v, list) else v for k, v in derived.items()},
    }, indent=2))
    if dry_run:
        print("dry run; nothing written")
        return 0
    io.save("coverage-inventory.json", derived)
    print("wrote coverage-inventory.json")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))
