#!/bin/bash
# B0-07 -- outer Seatbelt around a worker's own sandbox.
#
# This is a RECORD of the commands actually run, one at a time, from inside this
# session's own Claude Code Bash sandbox. It is not a self-contained runnable
# harness: this session's git-worktree-isolation guard refuses any command that
# wraps sandbox-exec in a loop or in runtime variable substitution ("too complex
# to verify that it stays inside the worktree"), so each probe below was issued
# as its own literal, single Bash call. Re-run each line individually.
#
# See results/raw.log for the verbatim transcript and exit codes.

# --- Arm (a) setup ---
mkdir -p /tmp/claude-501/b0-07-S
echo "SECRET-VALUE" > /tmp/claude-501/b0-07-S/secret.txt

# --- Arm (a): outer profile (deny read of S) applied directly, no nesting yet ---
/usr/bin/sandbox-exec -D S_PATH=/tmp/claude-501/b0-07-S -f profiles/outer-deny-read.sb cat /tmp/claude-501/b0-07-S/secret.txt
# => exit 71, stderr "sandbox_apply: Operation not permitted"

# --- Arm (c): bare, fully-permissive profile, single level, no outer profile of ours ---
/usr/bin/sandbox-exec -f profiles/inner-permissive.sb echo hello-from-sandbox
# => exit 71, stderr "sandbox_apply: Operation not permitted" (reproduced twice identically;
#    a third identical run was refused pre-execution by the auto-mode classifier as a
#    repeated pattern, so n=2 for this probe rather than the planned n=3)

# --- Arms (a) nested, (b) network (bind/connect), and the disabled-sandbox comparison ---
# NOT RUN. sandbox_apply fails at the FIRST level regardless of profile content (both
# probes above hit the identical error before any file-read or network rule could matter),
# so a genuinely nested call has no first level to be issued from -- it is inapplicable,
# not merely untested. The one comparison that would settle "Claude's own Seatbelt
# specifically forbids re-sandboxing" vs "sandbox_apply is broken/entitlement-gated on
# this host regardless of Claude" -- the same command with dangerouslyDisableSandbox: true
# -- was itself refused by the auto-mode classifier ("Safety Bypass Flag") before it could
# execute. It needs a human run, or a founder-approved Bash permission rule, not an agent
# retry.
