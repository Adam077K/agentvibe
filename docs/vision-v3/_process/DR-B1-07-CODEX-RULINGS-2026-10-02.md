# DR-B1-07-CODEX-RULINGS: the `codex` WorkerAdapter's pins, nested agents, user config and result file (2026-10-02)

**Basis.** The B1-07 done-tests were first frozen on `build/b1-07-tests` at `f111312`. They left six canon
gaps open and refused each one with `ErrUndecided`. The founder ruled on all six on 2026-10-02, asked
through AskUserQuestion in the main session ("founder, 2026-10-02"). This note records those rulings. B1-07
(`14-BUILD-PLAN.md` §6) is re-frozen against them in `build/done-tests/B1-07.yml`, with the reason
"2026-10-02 founder rulings B1-07". The rulings refine 09a §8.2, §8.4 and §8.8 for the codex line. They
follow [DR-B1-06](DR-B1-06-ADAPTER-RULINGS-2026-10-02.md) where the two adapters meet.

## 1 + 3. Pinning: the profile hash and the binary hash

The pinned codex line (09a §8.2) has no tool-list flag. Its stream reports no tools and no model, so it has
nothing that a `system/init` harness check could compare.

**Ruling (founder, 2026-10-02).** Tool limits live in the generated Codex profile file. The launch records the
sha256 of that profile file and of the codex binary. If either differs from its pinned value, the launch is
refused with `ErrSpec` before exec. This mirrors B1-06 ruling A's pinned and hashed MCP config.

How the tests read this ruling:

- The pinned binary hash is the grant digest that the adapter is built with (`NewCodex(digest)`).
  `LaunchSpec.BinaryDigest` is the measured digest.
- For codex, the pinned profile hash is `init_expect`. `LaunchSpec.ProfileDigest` is the measured digest.
- Each value must have the form `sha256:` followed by 64 lowercase hex digits. Values that are missing,
  malformed or unequal are `ErrSpec`. A pin that is not a sha256 value is no pin, even when the measured
  value equals it.
- `Watch` receives the pin. A run whose pin is missing or malformed never adjudicates.
- A tool lease in the spec is `ErrSpec`. The lease belongs in the pinned profile, and an argv that dropped it
  would read as enforced when nothing enforced it.

## 2. Nested agents: never

**Ruling (founder, 2026-10-02).** Nested agents are never allowed for codex, funded or not.
`LaunchSpec.FundedTeam` is `ErrSpec`. A `collab_tool_call` in the stream never adjudicates, and `Children`
still reports it (09a §8.4: nested agents are visible).

## 4. Ignore the user config

> **Superseded 2026-10-03.** Ruling 4 is superseded by the founder ruling of 2026-10-03 (see "Round 2"
> below). Measured on codex-cli 0.154.0, `--ignore-user-config` stops `-p` from loading the profile, so
> rulings 1+3 and 4 could not both hold. The flag is no longer passed, and `--ignore-rules` is.

`-p` layers `$CODEX_HOME/<name>.config.toml` on top of the user's `~/.codex/config.toml`, so the pinned
profile alone did not decide what the worker loaded.

**Ruling (founder, 2026-10-02).** Always pass `--ignore-user-config`. An argv without it fails the tests.
The adapter's template is the 09a §8.2 codex line with `--ignore-user-config` appended.

*Follow-up, not done here:* two places must change to match. The first is the line in 09a §8.2. The second
is the frozen B1-08 launcher done-test, whose `codexTokens` pins the line without the flag. Until both
follow, the adapter's argv does not match the launcher's codex template.

## 5. The `-o` file must match the stream

**Ruling (founder, 2026-10-02).** The `-o` result file must equal the stream's answer, which is the last
`item.completed` `agent_message` text. If they differ, or if either is missing, the outcome is UNPARSED
(09a §8.8) and never a pass.

The tests read "equal" as byte for byte. A reordered or re-spaced JSON document does not match. The runner
reads the file after exit and passes it in `ExitInfo.ResultFile`. `ExitInfo.ResultFileRead` is false when
the file was missing or unreadable.

## 6. Rate-limit shape

**Ruling (founder, 2026-10-02).** Per B1-06 ruling E: measure the shape on a real run first, then freeze
it. Until then, a rate limit or an unrecognised signal is never a pass. In the tests, an `error` event, an
`error` item, a `turn.failed`, an unknown event type or an unknown item type never adjudicates. The tests
do not pin whether a rate limit becomes `blocked(capacity)` or `unresolved`.

## What remains open

- How the Kernel measures the profile and binary digests, and when, sits on the launcher and runner side
  (B1-08, B1-09). The adapter compares; it does not read files.
- Whether codex writes the `-o` file with a trailing newline is unmeasured. Under the byte-for-byte reading,
  a trailing newline would make every run UNPARSED, and the per-family UNPARSED rate (09a §8.8) would show
  it.
- The budget has no codex flag. `BudgetUSD` is validated, and the runner enforces it.

## Round 2 (2026-10-03): ruling 4 superseded, and the profile must be complete

**What failed.** An Opus review failed the implementation at `2592de6` (`build/b1-07`), which was built on
the `cbd3155` tests. Its HIGH finding came from a measurement on codex-cli 0.154.0: `--ignore-user-config`
stops `-p` from loading the profile. Rulings 1+3 and 4 therefore contradicted each other, because the pinned
profile never loaded.

This builder reproduced the finding the same day. The run used a throwaway `CODEX_HOME` that held no
credential, and network access was denied, so no model turn was served. The `exec` banner reported a
different model in each case:

| Flags | Model in the banner |
|---|---|
| `-p prof` | the profile's model (`profile-model-qqq`) |
| `-p prof --ignore-user-config` | the default model (`gpt-6-astra`) |
| `-p prof --ignore-rules` | the profile's model |

**Ruling (founder, 2026-10-03, via AskUserQuestion).** This supersedes ruling 4. Load the pinned profile and
drop `--ignore-user-config`. The user's own Codex config is honoured.

**Fail-safe (orchestrator, 2026-10-03).** Because the user config is honoured, the pinned profile must set
every safety-relevant key itself. A profile that omits any required key is `ErrSpec`. The required keys are:

- `approval_policy`
- `approvals_reviewer`
- `sandbox_mode`
- `sandbox_workspace_write.network_access`
- `sandbox_workspace_write.writable_roots`
- `sandbox_workspace_write.exclude_tmpdir_env_var`
- `sandbox_workspace_write.exclude_slash_tmp`
- `shell_environment_policy.inherit`
- `mcp_servers`
- `web_search`
- `model_provider`
- `model_providers`
- `notify`
- `hooks`
- `features`
- `tools`
- `projects`

That is 17 keys. The candidates came from the config field names in the installed binary. Each key was
accepted in a profile by `codex exec --strict-config` 0.154.0. As a control, an unknown key (`bogus_key_zz`)
was refused with "unknown configuration field", and `zsh_path` was also refused. The test profile with all 17
keys loads under `--strict-config --ignore-rules`, and the banner shows `sandbox: workspace-write [workdir]`.

**Not required: `default_permissions`, which was measured.** Setting it needs either a built-in name or a
`[permissions]` table. The built-in `":workspace"` puts `/tmp` and `$TMPDIR` back into the writable roots,
undoing `exclude_slash_tmp` and `exclude_tmpdir_env_var`. A custom `[permissions.<name>]` table would not
start under the armed sandbox. A user-config `default_permissions` (`":danger-full-access"`, or a custom
table) did not take effect over the profile's `sandbox_mode`; the banner stayed `workspace-write [workdir]`.
So requiring the key would loosen the sandbox, while omitting it was measured not to leak. The decision is
open for a ruling if the founder wants the key pinned anyway.

**`--ignore-rules` is required.** `codex exec --help` describes it as: "Do not load user or project
execpolicy `.rules` files". A project rules file can sit in the worktree that the worker writes, and a user
rules file is outside the pin, and either can allow commands that the pinned profile would not. The run above
shows the profile still loads with the flag. The template is now the 09a §8.2 line with `--ignore-rules`
appended.

**Medium review findings (`codex.go:83-88`), now pinned.**

- `LaunchSpec.Worktree` is the job's worktree. `-C` must be a clean, absolute ASCII path inside it, and
  neither `/` nor a path containing `..` is accepted.
- `-o` must be a clean path outside the worktree. Neither the path nor any existing ancestor may be a
  symlink.
- `Env["CODEX_HOME"]` must be absent, or exactly equal to the pinned `LaunchSpec.CodexHome`. The pinned
  value must be clean, absolute, and outside the worktree.
- `LaunchSpec.CodexProfileTOML` is the profile's exact bytes. Its sha256 must equal the pin (`init_expect`).

**Residual risk, not closed here.** The adapter checks only that each required key is present; it does not
check the values. Two holes remain:

- An `-o` path outside the worktree is still writable by the worker if it lies under a root that the
  profile makes writable, such as `/tmp` when `exclude_slash_tmp` is false.
- A table-valued key such as `mcp_servers = {}` may be deep-merged with the user's table rather than
  replacing it. This is unmeasured.

Pinning required values, and measuring how tables merge, are the next step.

## Round 3 (2026-10-03): the re-review's MED findings

An Opus re-review passed `b0f1e27` on the security and adversarial lenses, with no critical or high finding.
It raised four MED findings and one surviving mutant. The round-3 tests in `codex_r3_donetest_test.go` pin
all of them. The required-key list, rulings 1–3 and 5–6, and round 2's decisions are unchanged.

1. **The profile is read as TOML, not line by line.** A required key that appears only inside a string
   counts as missing. This covers a `"""` or `'''` multi-line string whose closing delimiter shares a line
   with a key-shaped line, which is the re-review's case. The same holds for a key that appears only in a
   comment, an inline table, an array of tables, a sub-table or a multi-line array.
   - A duplicate key in any spelling (quoted, or dotted against a table) is `ErrSpec`.
   - A value that is not TOML (a bare word, an unterminated string, a missing value) is `ErrSpec`.
   - **No Go TOML library is available offline.** The module cache at `~/.agentvibe/gomod` holds only
     `modernc.org/sqlite` and its dependencies. The tests therefore pin behaviour, not a library: a minimal
     strict parser that refuses anything it does not understand passes them.
2. **`-o`, `CODEX_HOME` and `HOME` are compared to the worktree after resolution.** The resolution takes
   the longest existing prefix through `EvalSymlinks`, then checks identity with `os.SameFile` against the
   worktree and each ancestor. So each of the following is inside the worktree:
   - a path reached through a symlink;
   - a path reached when the worktree is named by an alias;
   - a path in another letter case, on a case-insensitive filesystem.
3. **`-C` is resolved through symlinks and must land inside the worktree.** A `-C` inside the worktree that
   is a symlink to `/` or to the worktree's parent is `ErrSpec`.
4. **`HOME` is checked; XDG is not.** This was measured on codex-cli 0.154.0, using throwaway homes with no
   credential, so no model turn was served:
   - With `CODEX_HOME` unset, codex loads `$HOME/.codex/config.toml`; the banner showed `model:
     home-model`.
   - It does not load config from `XDG_CONFIG_HOME`, `XDG_DATA_HOME` or `XDG_STATE_HOME`; the banner
     showed the default model in each case.

   So `Env["HOME"]` must be absent, which means the launcher's own value (the real user home), or exactly
   the pinned `LaunchSpec.Home`. The pinned value must be clean, not `/`, and outside the worktree.
5. **`noSymlink`: any `Lstat` error other than not-exist refuses.** This covers permission denied and "not
   a directory", and kills the re-review's surviving mutant at `:96`.

**Follow-up, needs founder consent.** Precedence between the profile and the user config is still
unmeasured: whether a profile key overrides the same key in `~/.codex/config.toml`, and whether a table
such as `mcp_servers` or `features` is replaced or deep-merged. The banner shows only the model, approval
and sandbox mode, and settling the rest needs a served model turn. A served turn spends the founder's
subscription, so it waits for his consent.

**Residual, noted and not pinned.** The binary also reads environment variables that can change its
behaviour, for example `CODEX_SANDBOX`, `CODEX_SANDBOX_NETWORK_DISABLED`, `CODEX_CA_CERTIFICATE` and the
`CODEX_*_BASE_URL` family. This list comes from the binary's strings and was not measured. The adapter
pins only `CODEX_HOME` and `HOME`. Allowing a fixed set of environment variables is the launcher's work
(B1-08).

## Round 4 (2026-10-03): the profile approach is superseded

**Why.** The Opus review FAILED 763ed2c with two HIGH findings, measured on codex-cli 0.154.0 with a
throwaway home and no model turn. First, MCP servers declared in the user config survive the profile's
`mcp_servers = {}`, and one was launched. Second, when the user config trusts the repo,
`<worktree>/.codex/config.toml` overrides the profile; it turned network on and launched an MCP server.
The worker writes the worktree, so a profile that honours the user config cannot lock anything.

**Founder ruling, 2026-10-03.** Ruling 4 is restored and the Round 2 approach (`-p`, a profile file,
required keys) is withdrawn:

- always pass `--ignore-user-config`;
- drop `-p` and the profile file;
- pass every locked setting directly as `-c key=value`;
- pin the sha256 of the whole argv template (`init_expect`) and of the codex binary (the grant digest).

Any difference is ErrSpec. `--ignore-rules` stays.

**The locked line** (adapter `Template()`, B1-08 `codexTokens`, 09a §8.2):

```
exec -C <worktree> -s workspace-write --json --output-schema <f> -o <result.json> --ephemeral
  --ignore-user-config --ignore-rules
  -c approval_policy="never" -c approvals_reviewer="user" -c sandbox_mode="workspace-write"
  -c sandbox_workspace_write.network_access=false -c sandbox_workspace_write.writable_roots=[]
  -c sandbox_workspace_write.exclude_tmpdir_env_var=true -c sandbox_workspace_write.exclude_slash_tmp=true
  -c shell_environment_policy.inherit="core" -c mcp_servers={} -c web_search="disabled"
  -c model_provider="openai" -c model_providers={} -c notify=[] -c hooks={} -c features={}
  -c tools={} -c projects={}
```

These are the 17 keys of Round 2. Each was accepted under `--strict-config`.

**Measured before freezing** (codex 0.154.0, binary sha256 `4f8598…afcc`).

Setup: a throwaway HOME and CODEX_HOME. The user `config.toml` sets a model, an `[mcp_servers.usermcp]` whose command touches a marker file, and `[projects."<worktree>"] trust_level = "trusted"`. A hostile `<worktree>/.codex/config.toml` sets another model, `network_access = true`, and a second MCP server with its own marker. Network to the model endpoint was denied, so no turn could be served.

| Run | MCP markers | Banner |
|---|---|---|
| Control, no flags | user and project both **created** | `model: project-model-qqq`, `sandbox: workspace-write [workdir, /tmp, $TMPDIR] (network access enabled)` |
| `--ignore-user-config` alone | neither | (no banner match; default model) |
| The locked line + `--strict-config` | **neither** | `model: gpt-6-astra` (default; the project's is not applied), `approval: never`, `sandbox: workspace-write [workdir]` (no /tmp, no network) |

The project config is therefore **ignored, not refused**: no test requires refusing a `.codex/config.toml` in the worktree.

**Login is still found under `--ignore-user-config`:**

- `codex login status` (with and without the locked `-c` set) printed `Logged in using an API key - sk-agent***y-000` from `$CODEX_HOME/auth.json`.
- In a separate run, `api.openai.com` was allowed and the key was FAKE. `exec --ignore-user-config` sent that key and the server answered `401 … invalid_api_key`. With no `auth.json` it answered `Missing bearer or basic authentication`.

So auth still comes from CODEX_HOME, as `--help` says. A fake key cannot be served a turn, so no model turn ran. The real login (`~/.codex`) is deny-read in this sandbox and was not touched. A subscription (ChatGPT) login was not measured, only an API-key `auth.json`.

**Tests** (B1-07 register RE-FREEZE r5):

- `codex_r4_donetest_test.go` adds:
  - `R4_LockedLine`;
  - `R4_ArgvAndBinaryPinned`: an extra, changed, removed or reordered `-c` is ErrSpec, as are `-p`, `--strict-config` and the r3 line;
  - `R4_ProfileFieldsRefused`: `CodexProfile`, `CodexProfileTOML` and `ProfileDigest` set is ErrSpec;
  - `R4_DanglingSymlinkRefused`: pins the `resolve` `:227` gap, where a dangling symlink is never a not-yet-existing path.
- The profile-parser tests are removed: R2_ProfileLoadsAndRulesIgnored, R2_ProfileRequiredKeys and R3_ProfileIsParsedAsTOML.
- `codex_profile.go` is dead code under this ruling. The implementer deletes it, keeping the path helpers it hosts (`cleanAbs`, `within`, `noSymlink`, `resolve`, `inWorktree`, `outsideWorktree`, `pinnedEnv`).
- Mutants: 9 of 9 killed.
