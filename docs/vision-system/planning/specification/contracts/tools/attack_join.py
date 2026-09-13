#!/usr/bin/env python3
"""G3-01/G3-02: check the attack-case -> specification -> falsifier join.

`research/attack-coverage.json` used to name, for each of the 33 directive attack
cases, only the Phase D review that discussed it and the risk groups it belongs to.
It referred to no specification passage and to no named test, so deleting the
default-deny forward chain of 02 section 7.2 left both registers green. This script
is the mechanism that stops that: every case must name the passage that answers it
and the falsifier that would catch it, and every such name must resolve.

Three failures, each reported with the case it belongs to:

  MISSING-REFS   a case carries no `specification_refs`, and no `gap` explaining why
  DEAD-ANCHOR    a `specification_refs` entry names a file that does not exist, or an
                 anchor that is not a heading in that file
  DEAD-FALSIFIER a `falsifier_refs` id is outside every declared test range

Anchors are GitHub heading slugs, which is the form the specification already uses
in its own cross-links (07 section 9.1 links `02-authority-recovery.md#72-gate-and-
connector-profile`). The slug is derived from the heading text, so it moves when the
heading is rewritten and this check goes red -- which is the point. A line number
would rot silently.

Falsifier ids are NOT hardcoded here. Each namespace is read from the artifact that
declares it, so adding A-T19 to 02 section 14 makes A-T19 referenceable with no edit
to this file, and deleting A-T12 makes every case citing it fail:

  K-T##     table rows under `## 12. Required verification, not claimed execution`
  A-T##     table rows under `## 14. Required adversarial and useful-progress tests`
  IC-T##    the declared range `IC-T01...12` in 07 section 8
  MAIL-T##  the declared range `MAIL-T01...08` in 07 section 9.7
  WK-T##    planned_tests[].id in work-knowledge-contracts.json
  WK-V##    verification_subcases[].id in the same file

Usage:  python3 tools/attack_join.py [<vision-system-dir>]
Exit 0 when every case joins, 1 on any finding.
"""
from __future__ import annotations

import json
import os
import re
import sys

# tools/ -> contracts/ -> specification/ -> planning/ -> vision-system/
DEFAULT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..")
)

SPEC = "planning/specification"
COVERAGE = "research/attack-coverage.json"
WK = SPEC + "/work-knowledge-contracts.json"

EXPECTED_CASES = 33


def slug(heading: str) -> str:
    """GitHub's heading-anchor slug, as the specification's own cross-links use it."""
    text = heading.strip().lower()
    text = re.sub(r"[`*_\[\]()]", "", text)
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"\s", "-", text)


def anchors_of(path: str) -> set:
    with open(path, encoding="utf-8") as handle:
        return {
            slug(line.lstrip("#").strip())
            for line in handle
            if line.startswith("#")
        }


def section(lines, heading_prefix):
    """Lines from the heading starting with `heading_prefix` to the next heading of
    the same or higher level. Returns [] when the heading is gone, which makes the
    ids it declared unresolvable rather than silently empty-but-passing."""
    start = None
    level = 0
    for i, line in enumerate(lines):
        if start is None:
            if line.startswith("#") and line.lstrip("#").strip().startswith(heading_prefix):
                start = i
                level = len(line) - len(line.lstrip("#"))
            continue
        if line.startswith("#") and (len(line) - len(line.lstrip("#"))) <= level:
            return lines[start:i]
    return lines[start:] if start is not None else []


def ids_in_table(lines, pattern):
    found = set()
    for line in lines:
        if line.startswith("|"):
            found.update(re.findall(pattern, line))
    return found


def ids_from_range(lines, prefix):
    """Read a declared range such as `IC-T01...12` or `MAIL-T01...08` and expand it.

    The specification writes these as a range rather than as 12 or 8 separate ids,
    so the range declaration is the artifact of record and expanding it here keeps
    this script from becoming a second, drifting copy of the list."""
    body = "\n".join(lines)
    match = re.search(
        re.escape(prefix) + r"(\d{2})\s*(?:…|\.\.\.|-)\s*(\d{1,2})\b", body
    )
    if not match:
        return set()
    first, last = int(match.group(1)), int(match.group(2))
    return {"%s%02d" % (prefix, n) for n in range(first, last + 1)}


def main(root: str) -> int:
    coverage_path = os.path.join(root, COVERAGE)
    with open(coverage_path, encoding="utf-8") as handle:
        coverage = json.load(handle)

    def read(rel):
        with open(os.path.join(root, rel), encoding="utf-8") as handle:
            return handle.read().splitlines()

    kernel = read(SPEC + "/01-contract-kernel.md")
    authority = read(SPEC + "/02-authority-recovery.md")
    integrations = read(SPEC + "/07-integrations-capacity.md")
    with open(os.path.join(root, WK), encoding="utf-8") as handle:
        wk = json.load(handle)

    falsifiers = set()
    falsifiers |= ids_in_table(section(kernel, "12."), r"\bK-T\d{2}\b")
    falsifiers |= ids_in_table(section(authority, "14."), r"\bA-T\d{2}\b")
    falsifiers |= ids_from_range(section(integrations, "8."), "IC-T")
    falsifiers |= ids_from_range(section(integrations, "9.7"), "MAIL-T")
    falsifiers |= {t["id"] for t in wk.get("planned_tests", [])}
    falsifiers |= {v["id"] for v in wk.get("verification_subcases", [])}

    anchor_cache = {}
    findings = []
    cases = coverage.get("cases", [])

    if len(cases) != EXPECTED_CASES:
        findings.append(
            ("COUNT", "-", "expected %d cases, found %d" % (EXPECTED_CASES, len(cases)))
        )

    for case in cases:
        cid = case.get("id", "?")
        refs = case.get("specification_refs")
        if refs is None:
            findings.append(("MISSING-REFS", cid, "no specification_refs key"))
        elif not refs and not case.get("gap"):
            findings.append(
                ("MISSING-REFS", cid, "empty specification_refs and no gap explaining it")
            )

        for ref in refs or []:
            rel = ref.get("file", "")
            path = os.path.join(root, rel)
            if not os.path.isfile(path):
                findings.append(("DEAD-ANCHOR", cid, "no such file: %s" % rel))
                continue
            if rel not in anchor_cache:
                anchor_cache[rel] = anchors_of(path)
            anchor = (ref.get("anchor") or "").lstrip("#")
            if anchor not in anchor_cache[rel]:
                findings.append(
                    ("DEAD-ANCHOR", cid, "%s has no heading anchor '%s'" % (rel, anchor))
                )

        fals = case.get("falsifier_refs") or []
        if not fals:
            findings.append(("MISSING-REFS", cid, "no falsifier_refs"))
        for fid in fals:
            if fid not in falsifiers:
                findings.append(
                    ("DEAD-FALSIFIER", cid, "%s is declared by no specification range" % fid)
                )

        if case.get("enforcement") == "rule-only" and not case.get("gap"):
            findings.append(
                ("MISSING-REFS", cid, "enforcement rule-only with no gap naming what is missing")
            )

    print("attack_join: %d cases, %d resolvable falsifier ids" % (len(cases), len(falsifiers)))
    print(
        "attack_join: %d specification refs, %d falsifier refs, %d rule-only"
        % (
            sum(len(c.get("specification_refs") or []) for c in cases),
            sum(len(c.get("falsifier_refs") or []) for c in cases),
            sum(1 for c in cases if c.get("enforcement") == "rule-only"),
        )
    )
    for kind, cid, detail in findings:
        print("attack_join: %s %s: %s" % (kind, cid, detail))
    if findings:
        print("attack_join: FAIL (%d findings)" % len(findings))
        return 1
    print("attack_join: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main(os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_ROOT))
