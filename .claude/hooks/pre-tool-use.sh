#!/usr/bin/env bash
# POSTURE: BLOCKS — exit 2 at L38 denies the tool call. The only mechanism in this repo that can
# stop an action. Soft-warn rules deliberately exit 0 so the call proceeds.
# PreToolUse safety gate — Agentvibe Phase 6 (2026-05-16)
#
# PURPOSE: Block genuinely dangerous commands and file edits before they run.
#          This hook fires on EVERY tool call, so it MUST be fast (<200ms).
#
# BLOCKING RULES (exit non-zero → Claude Code refuses the tool call):
#   Bash: rm -rf *, rm -rf /, rm -rf ~, chmod +x, npm install -g,
#         pip install, wget, curl to external URLs, git --no-verify,
#         git push --force to main/master, git reset --hard (non-HEAD),
#         git checkout --
#   Edit/Write: .env* files, existing supabase migration files
#
# SOFT-WARN RULES (exit 1 → Claude Code logs warning but still executes):
#   NOTE: Claude Code PreToolUse exit semantics: 0 = allow, non-zero = BLOCK.
#   For soft-warns we emit stderr and exit 0 — this surfaces the message in
#   Claude's next turn but does NOT block execution.
#
# STDIN: Claude Code PreToolUse JSON payload:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#   { "tool_name": "Edit", "tool_input": { "file_path": "...", "old_string": "..." }, ... }
#   { "tool_name": "Write", "tool_input": { "file_path": "..." }, ... }
#
# EXIT CODES:
#   0           = allow (or soft-warn — message on stderr, execution continues)
#   non-zero    = BLOCK — Claude Code refuses the call; stderr message shown to agent
#
# STYLE: Mirrors post-edit-typecheck.sh — read payload via `cat`, parse with awk/grep.
#        No external deps; pure bash + coreutils only.

set -uo pipefail

# ── Helpers ───────────────────────────────────────────────────────────────────

block() {
  local reason="$1"
  echo "[pre-tool-use] BLOCKED: $reason" >&2
  exit 2
}

softwarn() {
  local reason="$1"
  echo "[pre-tool-use] WARNING: $reason" >&2
  # exit 0 so Claude Code still executes — warning surfaces in next turn
}

# ── Read payload ──────────────────────────────────────────────────────────────

payload=$(cat)

# ── Parse the payload ONCE, structurally, and FAIL CLOSED ─────────────────────
#
# The previous implementation used `awk -F'"' '/"tool_name"/{print $4; exit}'`, which is
# line-oriented text matching over a JSON document. Claude Code sends COMPACT single-line JSON
# (documented in the STDIN contract above), so `session_id` precedes `tool_name` on the same
# line and field 4 resolved to the session-id VALUE. `tool_name` was therefore never "Bash",
# the case statement fell through to `*)`, and EVERY rule in this file was skipped. Verified
# 2026-08-13: a compact payload carrying `rm -rf /` exited 0.
#
# Three properties now hold, and scripts/pre-tool-use.test.mjs asserts each:
#   1. Parsing is structural (json.load), so payload FORMATTING cannot change the verdict.
#   2. One python3 process extracts all three fields — the hook must stay under 200ms.
#   3. An unparseable payload BLOCKS. "I could not look" is not "nothing to see": a guard that
#      waves through what it cannot read is the failure mode this repo has catalogued nine times.
parsed=$(printf '%s' "$payload" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if not isinstance(d, dict): raise ValueError('payload is not an object')
    ti = d.get('tool_input') or {}
    if not isinstance(ti, dict): ti = {}
    # A field that is PRESENT but not a string is malformed, not absent. Coercing it to ''
    # would hand the rules an empty command and every pattern below would miss — so a
    # {'command': {'\$': 'rm -rf /'}} payload would sail through. Fail closed instead.
    for k in ('command', 'file_path'):
        if k in ti and not isinstance(ti[k], str):
            raise ValueError(k + ' is present but not a string')
    def flat(v): return v if isinstance(v, str) else ''
    print(flat(d.get('tool_name')))
    print(flat(ti.get('command')).replace(chr(10), ' '))
    print(flat(ti.get('file_path')))
except Exception:
    sys.exit(1)
" 2>/dev/null) || block "payload could not be parsed as JSON. Refusing the call: a guard that cannot read its input must not allow it."

tool_name=$(printf '%s\n' "$parsed" | sed -n '1p')
raw_command=$(printf '%s\n' "$parsed" | sed -n '2p')
file_path=$(printf '%s\n' "$parsed" | sed -n '3p')

[ -n "$tool_name" ] || block "payload carried no tool_name. Refusing the call rather than guessing which rules apply."

# ── Normalise the command before matching ─────────────────────────────────────
#
# Rules below are regexes over the command text, so `rm -rf /` and `rm -r -f /` were two
# different strings to them and only the first was blocked. Normalisation collapses the
# spelling variants an attacker (or a careless agent) reaches for first: split short flags are
# merged, so `-r -f` becomes `-rf`, and repeated whitespace collapses. Matching happens against
# `command`; `raw_command` is preserved for the message so the founder sees what they typed.
command=$(printf '%s' "$raw_command" | awk '{
  out = ""
  for (i = 1; i <= NF; i++) {
    tok = $i
    # merge a bare short-flag cluster into the previous one: "rm -r -f" -> "rm -rf"
    if (tok ~ /^-[a-zA-Z]+$/ && out ~ /-[a-zA-Z]+$/) { sub(/^-/, "", tok); printf ""; out = out tok }
    else { out = (out == "" ? tok : out " " tok) }
  }
  print out
}' | tr -s ' ')

# ── Route by tool type ────────────────────────────────────────────────────────

case "$tool_name" in
  Bash)

    # ── BLOCK: rm -rf dangerous variants ─────────────────────────────────────
    # Flag letters are matched case-insensitively: `rm -fR /` is the same command as `rm -rf /`
    # and was allowed because the class filler accepted any case while the r and f themselves
    # were literal lowercase.
    if printf '%s' "$command" | grep -qE 'rm\s+-[a-zA-Z]*[rR][a-zA-Z]*[fF]|rm\s+-[a-zA-Z]*[fF][a-zA-Z]*[rR]'; then
      # Specifically block rm -rf targeting /, ~, *, /tmp broad, etc.
      if printf '%s' "$command" | grep -qE 'rm\s+(-[a-zA-Z]+\s+)*(\/[^a-zA-Z]?|~|\.\.\/|\*|\/tmp\/?\*|\/var|\/etc|\/home|\/usr)'; then
        block "rm -rf on a dangerous path. Use targeted removal instead: rm -f <specific-file>."
      fi
      # rm -rf with no path (bare) or trailing space = block
      if printf '%s' "$command" | grep -qE 'rm\s+-rf\s*$'; then
        block "Bare rm -rf with no path. Specify the exact file or directory."
      fi
    fi

    # ── BLOCK: destruction that never spells "rm" ────────────────────────────
    #
    # The rm rules above match the word `rm`. These four commands destroy just as much and
    # were all auto-approved, three of them by the blanket `Bash(git *)` allow entry:
    #   git clean -fdx   removes .worktrees/.registry, the per-CEO task files, AND
    #                    .claude/memory/sessions/ — which is the directory qa-lead-pass.yml
    #                    greps for its verdict, so it destroys the coordination state and the
    #                    audit evidence in one auto-approved turn.
    #   git checkout . / git restore .   discard every uncommitted change in the tree.
    #   find <path> -delete              deletes without naming rm.
    #   node -e "...rmSync..."           destruction through an allowlisted interpreter.
    if printf '%s' "$command" | grep -qE '\bgit\b[^|;]*\bclean\b[^|;]*-[a-zA-Z]*[fdx]'; then
      block "git clean removes untracked files, including .worktrees/.registry and .claude/memory/sessions/ (the session files the QA gate reads). Remove specific paths instead."
    fi
    if printf '%s' "$command" | grep -qE '\bgit\b[^|;]*\b(checkout|restore)\b\s+\.\s*$'; then
      block "git ${command#*git } discards every uncommitted change in the tree. Use 'git stash' to save work first, or name the specific file."
    fi
    if printf '%s' "$command" | grep -qE '\bfind\b[^|;]*\s-(delete|exec\s+rm)\b'; then
      block "find with -delete/-exec rm removes files in bulk with no confirmation. List them first, then remove the specific paths."
    fi
    if printf '%s' "$command" | grep -qE '\b(node|python3?|ruby|perl)\b[^|;]*(rmSync|rmdirSync|unlinkSync|shutil\.rmtree|os\.remove|FileUtils\.rm_r)'; then
      block "filesystem destruction through an interpreter (-e / -c) bypasses every rule in this hook. Use the file tools, or a script committed to the repo."
    fi

    # ── BLOCK: reading secrets into the transcript ───────────────────────────
    #
    # `Write .env` was blocked while `cat .env` was allowed via Bash(cat *) — the file was
    # protected in one direction and leaked in the other. A read is the more damaging half:
    # the contents land in ~/.claude/projects/*.jsonl as permanent plaintext (2,126 such files
    # on this machine), and every agent that later reads that transcript sees the keys.
    if printf '%s' "$command" | grep -qE '\b(cat|less|more|head|tail|sed|awk|grep|xxd|od|strings|cp|mv|base64)\b[^|;]*(^|[ /"'"'"'=])\.env($|[ ."'"'"'/])'; then
      block "reading a .env file into the transcript is refused — its contents would be written to ~/.claude/projects/*.jsonl in plaintext, permanently. Read the specific variable from the environment instead, or open the file in your own editor."
    fi

    # ── BLOCK: chmod +x ──────────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'chmod\s+\+x'; then
      block "chmod +x is blocked. Use 'chmod 755 <file>' for explicit permissions, or ask the CEO to approve."
    fi

    # ── BLOCK: npm install -g ────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'npm\s+install\s+-g|npm\s+i\s+-g'; then
      block "Global npm install (npm install -g) is blocked. Use project-local deps via pnpm add --save-dev."
    fi

    # ── BLOCK: pip install ───────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'pip\s+install|pip3\s+install'; then
      block "pip install is blocked. Python deps are not part of the Agentvibe stack. Confirm with the CEO if this is intentional."
    fi

    # ── BLOCK: wget ──────────────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE '\bwget\b'; then
      block "wget is blocked. Use 'curl -fsSL <url>' for controlled downloads, or ask the CEO to approve wget usage."
    fi

    # ── BLOCK: curl to external URLs (allow localhost / 127.0.0.1) ───────────
    # Strategy (no lookaheads — macOS grep doesn't support them):
    # 1. If curl is present AND the command contains http:// or https://
    # 2. AND the command does NOT contain localhost or 127.0.0.1
    # 3. → BLOCK (external curl)
    if printf '%s' "$command" | grep -qE '\bcurl\b'; then
      if printf '%s' "$command" | grep -qE 'https?://'; then
        if ! printf '%s' "$command" | grep -qE '(localhost|127\.0\.0\.1)'; then
          block "curl to external URL is blocked. Only curl localhost/127.0.0.1 is allowed. Wrap external HTTP calls in Next.js API routes or use the WebFetch MCP tool."
        fi
      fi
    fi

    # ── BLOCK: git --no-verify ───────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'git\b.*--no-verify'; then
      block "--no-verify skips pre-commit hooks (lint + typecheck). Remove --no-verify and fix the underlying hook failure instead."
    fi

    # ── BLOCK: git push --force to main/master ────────────────────────────────
    # Both orderings need the trailing \b. Without it the second pattern matches `-f` inside
    # any hyphenated word following the literal "main" — `--body-file`, `risk-full` — so a
    # `git push` sharing a command line with `gh pr create --base main` was refused as a
    # force-push. The first pattern always had the boundary; the second did not.
    if printf '%s' "$command" | grep -qE 'git\b.*push\b.*(--force|-f)\b.*(main|master)' || \
       printf '%s' "$command" | grep -qE 'git\b.*push\b.*(main|master).*(--force|-f)\b'; then
      block "Force-push to main/master is blocked. Create a PR instead, or ask the CEO to approve the force-push explicitly."
    fi

    # ── BLOCK: git reset --hard (allow git reset HEAD for staging) ────────────
    if printf '%s' "$command" | grep -qE 'git\b.*reset\b.*--hard'; then
      # Allow: git reset --hard HEAD (no-op relative to current commit)
      # Block: git reset --hard with anything other than HEAD or HEAD~0
      if ! printf '%s' "$command" | grep -qE 'git\b.*reset\b.*--hard\s+HEAD\s*$'; then
        block "git reset --hard is blocked (destroys uncommitted work). Use 'git stash' to save work, or 'git reset HEAD <file>' to unstage specific files."
      fi
    fi

    # ── BLOCK: git checkout -- (discards uncommitted changes) ────────────────
    if printf '%s' "$command" | grep -qE 'git\b.*checkout\b.*--\s+'; then
      block "git checkout -- <file> discards uncommitted changes permanently. Use 'git stash' to temporarily save work instead."
    fi

    # ── SOFT-WARN: git push origin main (non-force) ──────────────────────────
    if printf '%s' "$command" | grep -qE 'git\b.*push\b.*origin\b.*(main|master)' && \
       ! printf '%s' "$command" | grep -qE '(--force|-f)\b'; then
      softwarn "Pushing directly to main/master. Prefer a PR via 'gh pr create' for code review. Proceeding with push."
    fi

    # ── SOFT-WARN: gh pr merge ────────────────────────────────────────────────
    if printf '%s' "$command" | grep -qE 'gh\s+pr\s+merge'; then
      softwarn "gh pr merge bypasses the local QA Lead review step. Ensure QA verdict PASS is in the session file before merging."
    fi

    ;;

  Edit|Write|NotebookEdit)
    # file_path comes from the single structural parse at the top of this file.

    # ── BLOCK: anything outside the project root ─────────────────────────────
    #
    # Until now this hook had no concept of WHERE a write landed — only of what the filename
    # looked like. `Write ~/.ssh/id_rsa`, `Write ~/.aws/credentials` and `Write
    # ~/.claude/settings.json` all exited 0. The last of those is the one that matters most:
    # settings.json is where this hook is registered, so a single write disarms every rule in
    # it and makes the whole permission model advisory. (An earlier version of this comment
    # cited a 2026-08-13 read-only agent doing exactly that; that was a misreading of PR #29's
    # merge — see docs/08-agents_work/sessions/2026-08-14-ceo-safety-floor.md. The reason the
    # rule exists is structural, not anecdotal, and does not depend on the retracted incident.)
    #
    # Deny-by-default outside the project. Resolve symlinks first so `proj/link-to-home/.ssh`
    # cannot walk out; resolve the PARENT for files that do not exist yet, since a new file has
    # no realpath of its own.
    if [ -n "$file_path" ]; then
      # A symlink's final component: the write follows the link, so scope the TARGET, not the link.
      _target="$file_path"
      if [ -L "$_target" ]; then
        _link=$(readlink "$_target" 2>/dev/null) || _link=""
        case "$_link" in
          /*) _target="$_link" ;;
          ?*) _target="$(dirname "$_target")/$_link" ;;
        esac
      fi

      # Resolve the nearest EXISTING ancestor: a new file in a new subdirectory has no realpath
      # of its own, and neither does its parent.
      _dir=$(dirname "$_target")
      while [ ! -d "$_dir" ]; do
        _parent=$(dirname "$_dir")
        [ "$_parent" = "$_dir" ] && break
        _dir="$_parent"
      done
      _abs=$(cd "$_dir" 2>/dev/null && pwd -P) || _abs=""
      _root=$(cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null && pwd -P) || _root=""

      # Containment is decided by device+inode identity, NOT string prefix. A case-insensitive
      # filesystem reaches one directory under many spellings — `agentvibe` and `Agentvibe` are
      # the same directory on macOS, and this repo is routinely opened under both — so a
      # case-sensitive glob refuses writes that are genuinely inside the project. `-ef` compares
      # what the filesystem itself considers identical, leaving case folding and symlink
      # resolution to the kernel rather than guessing at either here.
      #
      # There is exactly ONE allowed root outside the project: $HOME/.claude/plans/, where the
      # harness stores plan-mode plans. Without it plan mode cannot be used in this repo at all —
      # the agent is asked to write a plan and its own guard refuses. The exemption is the
      # DIRECTORY plans/, never its parent: $HOME/.claude/settings.json registers this hook, so
      # opening $HOME/.claude/ would let a turn disarm every rule in this file, which is the single
      # thing this check exists to prevent. Siblings — agents/, hooks/ — stay refused.
      _inside=no
      for _allowed in "$_root" "${HOME:-/nonexistent}/.claude/plans"; do
        [ -n "$_abs" ] && [ -n "$_allowed" ] && [ -d "$_allowed" ] || continue
        _probe="$_abs"
        while : ; do
          if [ "$_probe" -ef "$_allowed" ]; then _inside=yes; break; fi
          _parent=$(dirname "$_probe")
          [ "$_parent" = "$_probe" ] && break
          _probe="$_parent"
        done
        [ "$_inside" = yes ] && break
      done
      # Fails CLOSED: an unresolvable path stays `no` and is refused.
      [ "$_inside" = yes ] || block "write outside the project root is refused: $file_path
   The project root is $_root. Nothing outside it — credentials, SSH keys, shell profiles, or
   the hook configuration that enforces this rule — is writable from an agent turn."
    fi

    # ── BLOCK: .env* files ───────────────────────────────────────────────────
    if printf '%s' "$file_path" | grep -qE '(^|/)\.(env)(\.|$|local|production|staging|test|development)'; then
      block ".env files must be edited via your system editor (not Claude). These files may contain secrets. Path: $file_path"
    fi
    # Also catch plain .env
    if printf '%s' "$file_path" | grep -qE '(^|/)\.env$'; then
      block ".env file must be edited via your system editor (not Claude). This file may contain secrets."
    fi

    # ── BLOCK: existing supabase migration files ─────────────────────────────
    if printf '%s' "$file_path" | grep -qE 'supabase/migrations/[^/]+\.sql$'; then
      # Block only if the file already exists (migrations are immutable once authored)
      if [ -f "$file_path" ]; then
        block "Supabase migration files are immutable once authored. Create a NEW migration file instead of editing '$file_path'. Editing migrations breaks the audit trail."
      fi
    fi

    # ── SOFT-WARN: DECISIONS.md edits (prefer append-only) ─────────────────
    if printf '%s' "$file_path" | grep -qE '(^|/)\.claude/memory/DECISIONS\.md$'; then
      old_string=$(python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('old_string', ''))
except Exception:
    print('')
" 2>/dev/null <<< "$payload" || echo "")
      # If old_string is non-empty, this is a replacement (not an append)
      if [ -n "$old_string" ]; then
        softwarn "DECISIONS.md edit detected (non-append). DECISIONS.md should be append-only — add new entries at the bottom rather than modifying existing ones. Proceeding."
      fi
    fi

    ;;

  mcp__playwright__browser_navigate)
    # ── BLOCK: browser navigation outside the local machine ───────────────────
    #
    # `designer` was granted the playwright MCP on 2026-08-16 — the first live MCP capability in
    # this repo. The binding QA gate immediately found that MCP tool calls reached NO safety
    # control at all: this hook was registered with `"matcher": "Bash|Edit|Write|NotebookEdit"`,
    # and `mcp__playwright__browser_navigate` matches none of those. Verified by running the
    # matcher as a regex against real tool names. So the curl-to-external-URL block, the .env
    # read block and the write-outside-project-root block all applied to Bash and to nothing
    # else — while DECISIONS.md justified removing --dangerously-skip-permissions partly on the
    # claim that "the PreToolUse hook still fired". True for Bash. False for this.
    #
    # SCOPE: LOCALHOST ONLY, AND THAT IS NOT A COMPROMISE.
    # designer's perception loop is "render, look at what rendered, iterate" — that is localhost
    # by definition. Visual references come from the refero / figma / stitch / higgsfield MCP
    # servers, which are better at it than driving a browser; documentation comes from WebFetch.
    # The one genuine future need is a deployed preview URL, and nothing is deployed yet. When
    # something is, add its host to EXTRA_BROWSER_HOSTS below — one line, not an allowlist to
    # maintain.
    #
    # Deliberately narrow: ONLY this tool. Every other MCP server the founder has configured
    # (figma, notion, miro, gmail, higgsfield, …) is untouched, because a guard that only
    # understands playwright must not silently gate tools it cannot reason about.
    url=$(printf '%s' "$payload" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print((d.get('tool_input') or {}).get('url', ''))
except Exception:
    print('')
" 2>/dev/null)

    # Fail CLOSED: an unparseable or absent URL is refused, matching this hook's posture
    # everywhere else. A navigation we could not inspect is not a navigation we may allow.
    if [ -z "$url" ]; then
      block "browser_navigate with no readable url — refused. This hook fails closed: a navigation it cannot inspect is not one it can allow."
    fi

    # Add a deployed preview host here when one exists, space-separated. Keep it short; if this
    # ever grows into a real list, that is the signal the browser is being used for something
    # other than looking at our own output.
    EXTRA_BROWSER_HOSTS="${AGENTVIBE_BROWSER_HOSTS:-}"

    _allowed=no
    case "$url" in
      http://localhost|http://localhost:*|http://localhost/*|https://localhost|https://localhost:*|https://localhost/*) _allowed=yes ;;
      http://127.0.0.1|http://127.0.0.1:*|http://127.0.0.1/*|https://127.0.0.1|https://127.0.0.1:*|https://127.0.0.1/*) _allowed=yes ;;
      "http://[::1]"*|"https://[::1]"*) _allowed=yes ;;
      about:blank) _allowed=yes ;;
    esac

    if [ "$_allowed" = no ] && [ -n "$EXTRA_BROWSER_HOSTS" ]; then
      for _h in $EXTRA_BROWSER_HOSTS; do
        case "$url" in
          "http://$_h"|"http://$_h/"*|"http://$_h:"*|"https://$_h"|"https://$_h/"*|"https://$_h:"*) _allowed=yes; break ;;
        esac
      done
    fi

    if [ "$_allowed" = no ]; then
      block "browser navigation to '$url' is refused — the browser grant is localhost-only. designer's perception loop looks at what it just rendered. Use the refero/figma/stitch MCP servers for visual references and WebFetch for documentation. To allow a deployed preview host, set AGENTVIBE_BROWSER_HOSTS."
    fi
    ;;

  *)
    # Unknown tool — allow.
    #
    # STATED LIMIT: this includes every MCP tool other than the one cased above. Those servers
    # are the founder's own (figma, notion, gmail, miro, higgsfield, …) and this hook has no
    # rules that would mean anything for them; gating them here would be theatre with an outage
    # attached. The boundary that matters — a browser reaching off the machine — is closed above.
    ;;
esac

exit 0
