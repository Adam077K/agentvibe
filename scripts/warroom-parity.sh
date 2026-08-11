#!/bin/bash
# POSTURE: BLOCKS (when run with a reference launcher available).
#
# warroom-parity.sh — prove `bin/warroom` behaves identically to the standalone
# launcher it replaces.
#
# Phase 2 is a behaviour-preserving refactor of the program used to start every
# working session. "It looked right" is not evidence. This runs the same
# read-only commands through both programs and diffs the output byte-for-byte.
#
# Only read-only commands are exercised. Nothing here starts tmux, creates a
# worktree, or writes to a project.
#
# Usage:
#   scripts/warroom-parity.sh <reference-launcher> <config> [session]
#   scripts/warroom-parity.sh ~/bin/agentvibe .warroom.yml
#
# Exit 0 = identical. Exit 1 = a difference, printed.

set -uo pipefail

REF="${1:?usage: warroom-parity.sh <reference-launcher> <config>}"
CFG="${2:?usage: warroom-parity.sh <reference-launcher> <config>}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NEW="$ROOT/bin/warroom"

[ -x "$REF" ] || { echo "✗ reference launcher not executable: $REF" >&2; exit 1; }
[ -x "$NEW" ] || { echo "✗ bin/warroom not executable" >&2; exit 1; }

# Read-only commands only. `ls` and `cost` inspect live state; `help` and the
# unknown-command path exercise the usage text where 67 of the 74 project-name
# literals lived.
CASES=( "help" "ls" "cost" "events" "history" "definitely-not-a-command" )

fails=0
for c in "${CASES[@]}"; do
  # shellcheck disable=SC2086
  out_ref="$("$REF" $c 2>&1)"; rc_ref=$?
  out_new="$("$NEW" --config "$CFG" $c 2>&1)"; rc_new=$?

  # The new program warns once if no entry preamble is present; that line is
  # emitted before any command output and is not part of command behaviour.
  out_new="$(printf '%s\n' "$out_new" | grep -v '^Warning: no entry preamble')"

  if [ "$out_ref" != "$out_new" ] || [ "$rc_ref" -ne "$rc_new" ]; then
    echo "✗ parity FAILED for: $c   (exit ref=$rc_ref new=$rc_new)"
    diff <(printf '%s\n' "$out_ref") <(printf '%s\n' "$out_new") | head -20
    fails=$((fails + 1))
  else
    echo "✓ $c — identical (exit $rc_ref, $(printf '%s\n' "$out_ref" | wc -l | tr -d ' ') lines)"
  fi
done

echo
if [ "$fails" -gt 0 ]; then
  echo "✗ $fails of ${#CASES[@]} commands differ."
  exit 1
fi
echo "✓ all ${#CASES[@]} read-only commands byte-identical to $REF"
