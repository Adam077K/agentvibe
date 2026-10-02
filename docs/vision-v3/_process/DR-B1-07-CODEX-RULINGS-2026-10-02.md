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
