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

# ── MCP policy: this repo governs the servers this REPO configures ────────────
#
# THE RULE IS SCOPE, NOT SERVER NAME. The carve-out at the bottom of this file allowed every
# MCP tool, and defended it by saying those servers are the founder's own (figma, notion,
# gmail, miro, higgsfield, …). That is true of the user-scope servers in ~/.claude.json and
# FALSE of anything this repo configures in its own .mcp.json — which, since 2026-08-16, is
# playwright, granted to `designer`, carrying `browser_run_code_unsafe`: arbitrary code in a
# browser holding live session cookies, 69 real calls of it on this machine. The sentence that
# comment MEANT is "founder-owned servers are not this hook's business". This function is that
# sentence with a mechanism under it, and the mechanism draws the line by scope.
#
# DECISION TABLE — .claude/mcp-policy.json:
#   file absent                        ALLOW, no log. The mechanism is off, which is exactly the
#                                      behaviour before the policy existed. A checkout without
#                                      the file is neither silently hardened nor silently opened.
#   file unreadable or invalid         BLOCK every MCP call. "I could not look" is not "nothing
#                                      to see" — the same posture as the payload parse at L86.
#   server in neither policy nor
#     .mcp.json                        ALLOW, no log. User scope. Not this repo's business.
#   server in .mcp.json, not in policy BLOCK. An ungoverned project server. Deciding scope from
#                                      .mcp.json — the same file schema-lint.js:104 reads to
#                                      judge whether an agent's `mcpServers` grant is real —
#                                      means adding a server there cannot silently outflank this
#                                      policy. Two sources of "is this ours" would disagree, and
#                                      you find out during the incident.
#   credentialed: true                 BLOCK, regardless of mode. See below.
#   tool on the server's allow list    ALLOW + one events.jsonl line.
#   tool on deny, or on NEITHER list   mode=block → BLOCK; mode=shadow → ALLOW + events line +
#                                      stderr. Unlisted is treated as denied because a tool
#                                      absent from both lists is one that did not exist when the
#                                      policy was written — the enumeration failure this file's
#                                      own SSRF guard was rewritten to stop repeating.
#
# WHY ONE RULE IGNORES `mode`. ADR-001:123-125 ships every gate in shadow EXCEPT outbound send,
# deploy, migration and harness self-edit, because `git revert` does not undo those. A
# credentialed server is all four at once — a sent mail is sent — so `credentialed: true` blocks
# from day one and `mode` cannot soften it. The asymmetry lives in the mechanism, not in a review
# process that has to remember it.
#
# WHERE THE LOG GOES. Every governed call appends one line to events.jsonl, which
# mission-control/server/collectors/events.ts already reads and buckets by `event`. stderr is
# reserved for would_block and block: designer's perception loop made 154 `browser_evaluate`
# calls on this machine, and 154 lines of stderr per session is how a guard gets switched off.
mcp_policy_check() {
  local _root _policy _v
  _root="${CLAUDE_PROJECT_DIR:-$PWD}"
  _policy="$_root/.claude/mcp-policy.json"

  [ -f "$_policy" ] || return 0

  # Declared and assigned on separate lines on purpose: `local _v=$(...)` reports the exit status
  # of `local`, which is always 0, so the `||` below would never fire and a crashed policy check
  # would read as success.
  _v=$(python3 -c "
import sys, json, os, time

pol_path, mcp_path, proj, tool = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

def out(s):
    print(s)
    raise SystemExit(0)

try:
    with open(pol_path) as f:
        pol = json.load(f)
    if not isinstance(pol, dict): raise ValueError('policy is not a JSON object')
    mode = pol.get('mode')
    if mode not in ('shadow', 'block'): raise ValueError('mode must be exactly shadow or block')
    servers = pol.get('servers')
    if not isinstance(servers, dict): raise ValueError('servers must be a JSON object')
except Exception as e:
    out('BLOCK|.claude/mcp-policy.json is unreadable or invalid (' + str(e) + '). Every MCP call is refused until it parses. Fix the policy, or delete it to return to ungoverned MCP.')

rest = tool[5:] if tool.startswith('mcp__') else tool
server, _sep, name = rest.partition('__')

entry = servers.get(server)

if entry is None:
    # Project scope is decided by .mcp.json, so an unreadable .mcp.json means scope is UNKNOWN —
    # and a bare try/except around this read would swallow that into 'not configured', i.e. into
    # 'user scope', i.e. into allow. Absent and corrupt are different answers and only one of them
    # is safe. os.path.exists separates them before json.load can blur them together.
    m = None
    if os.path.exists(mcp_path):
        try:
            with open(mcp_path) as f:
                m = json.load(f)
            if not isinstance(m, dict): raise ValueError('.mcp.json is not a JSON object')
        except Exception as e:
            out('BLOCK|.mcp.json is present but unreadable (' + str(e) + '). Project scope cannot be determined, so this hook cannot tell a founder-owned server from one this repo configures. Refusing rather than guessing.')
    if m is not None and server in (m.get('mcpServers') or {}):
        out('BLOCK|' + server + ' is configured in .mcp.json but has no entry in .claude/mcp-policy.json. A project-scope server with no policy is ungoverned. Add it — credentialed, allow, deny — rather than leaving the gap open.')
    out('ALLOW|')

if not isinstance(entry, dict):
    out('BLOCK|the .claude/mcp-policy.json entry for ' + server + ' is not a JSON object.')

cred = entry.get('credentialed')
if not isinstance(cred, bool):
    out('BLOCK|the .claude/mcp-policy.json entry for ' + server + ' does not declare credentialed as true or false. A server whose credential status is unknown is treated as credentialed.')

allow = entry.get('allow')
deny = entry.get('deny')
if not isinstance(allow, list) or not isinstance(deny, list):
    out('BLOCK|the .claude/mcp-policy.json entry for ' + server + ' must carry allow and deny as JSON lists.')

if cred:
    rule, decision = 'credentialed', 'block'
elif name in deny:
    rule, decision = 'deny', ('block' if mode == 'block' else 'would_block')
elif name in allow:
    rule, decision = 'allow', 'allow'
else:
    rule, decision = 'unlisted', ('block' if mode == 'block' else 'would_block')

def events_path():
    p = os.environ.get('WARROOM_EVENTS')
    if p:
        return p
    try:
        with open(os.path.join(proj, '.warroom.yml')) as f:
            lines = [l.strip() for l in f]
        for l in lines:
            if l.startswith('state_dir:'):
                return os.path.join(os.path.expanduser(l.split(':', 1)[1].strip()), 'events.jsonl')
        for l in lines:
            if l.startswith('session:'):
                return os.path.join(os.path.expanduser('~'), '.' + l.split(':', 1)[1].strip(), 'events.jsonl')
    except Exception:
        pass
    return os.path.join(proj, '.ledger-events.jsonl')

try:
    ep = events_path()
    d = os.path.dirname(ep)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(ep, 'a') as f:
        f.write(json.dumps({'ts': int(time.time()), 'event': 'mcp.call', 'server': server,
                            'tool': name, 'rule': rule, 'decision': decision, 'mode': mode}) + chr(10))
except Exception:
    pass

if decision == 'block':
    if rule == 'credentialed':
        out('BLOCK|' + server + ' is marked credentialed: true in .claude/mcp-policy.json, so ' + server + '/' + name + ' is refused REGARDLESS of mode. A credentialed call is outbound send: git revert does not undo it, and ADR-001:123-125 blocks that class from day one.')
    out('BLOCK|' + server + '/' + name + ' is refused by .claude/mcp-policy.json (rule=' + rule + ', mode=block).')

if decision == 'would_block':
    out('LOG|would_block ' + server + '/' + name + ' rule=' + rule + ' mode=shadow — the call PROCEEDS and the verdict is recorded. Set mode to block in .claude/mcp-policy.json to refuse it.')

out('ALLOW|')
" "$_policy" "$_root/.mcp.json" "$_root" "$tool_name" 2>/dev/null) \
    || block "the MCP policy at .claude/mcp-policy.json could not be evaluated — refusing. This hook fails closed."

  case "$_v" in
    ALLOW*) : ;;
    LOG*)   echo "[pre-tool-use] mcp: ${_v#LOG|}" >&2 ;;
    BLOCK*) block "${_v#BLOCK|}" ;;
    *)      block "the MCP policy returned nothing readable — refusing. This hook fails closed." ;;
  esac
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

    # -- BLOCK: fetch-and-run a remote package --------------------------------
    #
    # npx, bunx, "npm exec", "bun x" and "pnpm dlx" each download an arbitrary package from a
    # registry and execute it. That is the same capability the HTTP-client rules further down
    # exist to refuse, reached through a package manager instead.
    #
    # Found by an independent reviewer of PR #47: that PR widened the allow list to cover the
    # package managers wholesale -- auto-approving exactly this -- in the same change that
    # removed the skip-permissions flag and was described as tightening. The allow entries are
    # now narrowed to the verbs actually measured (npm run, bun test, ...) and the fetch-and-run
    # verbs are denied in settings.json. This rule is the second half of that fix: a settings
    # deny can be bypassed by a launch flag, and this hook is the backstop that cannot.
    if printf '%s' "$command" | grep -qE '(^|[;&|]\s*)(npx|bunx)\b|\bnpm\s+exec\b|\bbun\s+x\b|\bpnpm\s+dlx\b'; then
      block "npx / bunx / npm exec / bun x / pnpm dlx download and execute a remote package - the same capability the HTTP-client rules refuse. Add the dependency to package.json and run it from node_modules, or ask the founder."
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

  mcp__playwright__browser_navigate|mcp__playwright__browser_navigate_back)
    # ── BLOCK: browser navigation into the local network ──────────────────────
    #
    # THE OPEN WEB IS ALLOWED. Denylist, not allowlist — founder decision, overruling a
    # localhost-only proposal. `sourcer` answers questions with sourced evidence and WebFetch
    # returns almost nothing on a JS-rendered site; agents already hold WebSearch and WebFetch,
    # so blocking the browser closes no prompt-injection risk and only makes the agent worse.
    # Loopback IS allowed — that is designer's perception loop.
    #
    # THE FIRST VERSION OF THIS GUARD WAS BYPASSABLE FIVE WAYS AND AN INDEPENDENT REVIEWER
    # FOUND ALL OF THEM. It pattern-matched ONE SPELLING of each address with shell globs
    # (`169.254.*`), so every other textual form Chromium accepts walked past a guard whose own
    # comment claimed the address was refused. All five verified against this hook before fixing:
    #   http://2852039166/            decimal    -> 169.254.169.254   ALLOWED
    #   http://0xa9fea9fe/            hex        -> 169.254.169.254   ALLOWED
    #   http://169.254.43518/         3-part     -> 169.254.169.254   ALLOWED
    #   http://0251.0376.0251.0376/   octal      -> 169.254.169.254   ALLOWED
    #   http://[fd00:ec2::254]/       IPv6 IMDS  ->                   ALLOWED
    #
    # An address is now CANONICALISED and then classified rather than compared against a list of
    # spellings. `ipaddress` decides private / loopback / link-local / reserved, so IPv4 in any
    # encoding and every IPv6 private range are covered by construction instead of by
    # enumeration — which is what the glob version was attempting, and failing.
    _verdict=$(printf '%s' "$payload" | python3 -c "
import sys, json, ipaddress, unicodedata

def canon(host):
    # Return an ip_address for any textual IPv4/IPv6 form a browser accepts, else None.
    # NFKC first: Chromium applies UTS-46 before parsing the host, so the fullwidth digits in
    # http://１６９．２５４．１６９．２５４/ become 169.254.169.254 before it ever resolves. Without this the
    # string splits on no ASCII dot, int() raises, canon returns None, and the guard reads it as
    # an ordinary hostname. Found by an independent reviewer against the rewritten guard.
    h = unicodedata.normalize('NFKC', host).strip().rstrip('.').lower()
    if h.startswith('[') and h.endswith(']'):
        try: return ipaddress.ip_address(h[1:-1])
        except ValueError: return None
    parts = h.split('.')
    if 1 <= len(parts) <= 4 and all(parts):
        nums = []
        for p in parts:
            try:
                if p.startswith('0x'): nums.append(int(p, 16))
                elif p.startswith('0') and len(p) > 1: nums.append(int(p, 8))
                else: nums.append(int(p, 10))
            except ValueError:
                return None
        try:
            n = 0
            for i, v in enumerate(nums[:-1]):
                if v > 255: return None
                n |= v << (8 * (3 - i))
            if nums[-1] >= (1 << (8 * (5 - len(nums)))): return None
            n |= nums[-1]
            return ipaddress.ip_address(n)
        except (ValueError, IndexError):
            return None
    try: return ipaddress.ip_address(h)
    except ValueError: return None

try:
    d = json.load(sys.stdin)
    url = (d.get('tool_input') or {}).get('url') or ''
except Exception:
    print('BLOCK|payload unreadable'); raise SystemExit(0)

if not url:
    print('BLOCK|no url given'); raise SystemExit(0)

low = url.strip().lower()
if low == 'about:blank':
    print('ALLOW|'); raise SystemExit(0)
scheme = low.split(':', 1)[0] if ':' in low else ''
if scheme not in ('http', 'https'):
    print('BLOCK|' + url + ' - only http and https reach the network'); raise SystemExit(0)

rest = url.split('://', 1)[1] if '://' in url else url
# WHATWG treats a backslash as a path delimiter for special schemes (http/https), so the
# authority ENDS at the first backslash. Without this substitution the guard was wrong in BOTH
# directions, verified against Node's own URL parser:
#   169.254.169.254 [backslash] @evil.com   browser -> 169.254.169.254   guard said ALLOW
#   evil.com [backslash] @169.254.169.254   browser -> evil.com          guard said BLOCK
# Found by an independent reviewer against the rewritten guard. The literal is written as
# chr(92) below because this python is embedded in a double-quoted bash string, where a
# backslash literal is consumed by the shell before python ever sees it -- which is exactly
# how the first attempt at this fix broke the guard into failing closed on everything.
rest = rest.replace(chr(92), '/')   # chr(92) is a backslash; a literal here is eaten by bash
authority = rest.split('/', 1)[0].split('?', 1)[0].split('#', 1)[0]
if '@' in authority:
    authority = authority.rsplit('@', 1)[1]
if authority.startswith('['):
    host = authority[:authority.find(']') + 1] if ']' in authority else authority
else:
    host = authority.split(':', 1)[0]

if not host:
    print('BLOCK|' + url + ' - host could not be parsed'); raise SystemExit(0)

ip = canon(host)
if ip is None or ip.is_loopback:
    print('ALLOW|')
elif ip.is_private or ip.is_link_local or ip.is_reserved or ip.is_unspecified or ip.is_multicast:
    print('BLOCK|' + url + ' resolves to ' + str(ip) + ', which is the local network, not the web')
else:
    print('ALLOW|')
" 2>/dev/null) || block "browser navigation could not be evaluated — refusing. This hook fails closed."

    case "$_verdict" in
      ALLOW*) : ;;
      BLOCK*) block "browser navigation refused: ${_verdict#BLOCK|}" ;;
      *)      block "browser navigation guard returned nothing readable — refusing. This hook fails closed." ;;
    esac

    # The URL guard runs FIRST and the policy second, because they answer different questions:
    # the guard asks where this navigation goes, the policy asks whether this tool may be called
    # at all. A `case` arm does not fall through in bash 3.2 (`;;&` is bash 4+, and this hook runs
    # under /bin/bash on macOS), so the shared rule is a function called from both arms rather
    # than a pattern that matches twice.
    mcp_policy_check
    ;;

  mcp__*)
    # EVERY OTHER MCP TOOL. Until 2026-08-16 nothing reached here: the PreToolUse matcher in
    # .claude/settings.json named `mcp__playwright__browser_navigate`, so exactly two tools were
    # routed to this hook and the other twenty-two on the same server — `browser_run_code_unsafe`
    # among them — were unhookable. The matcher now reads `mcp__`, which subsumes the old entry
    # (it is an unanchored regex over the tool name; that is already why `..._back` matched, and
    # scripts/pre-tool-use.test.mjs:406 pins it).
    mcp_policy_check
    ;;

  *)
    # Unknown tool — allow.
    #
    # STATED LIMIT, RESTATED: this no longer includes MCP tools. It used to, and the comment here
    # defended that by saying those servers are the founder's own — true of the user-scope servers
    # in ~/.claude.json, false of anything this repo configures in its own .mcp.json. MCP tools go
    # to `mcp_policy_check` above, which tells the two apart by SCOPE rather than by name.
    #
    # What still lands here is every non-MCP tool this hook has no rules for: Read, Glob, Grep,
    # Task and the rest. They run no commands and write no files, which is what this hook is about.
    ;;
esac

exit 0
