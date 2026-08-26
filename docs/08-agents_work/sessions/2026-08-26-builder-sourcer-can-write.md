---
date: 2026-08-26
role: builder
task: sourcer-can-write
branch: feat/sourcer-claim-append
worktree: .worktrees/sourcer-can-write
base: 244e8db
tier: irreversible
qa_verdict: PASS
---

# sourcer can write one thing, and only after the evidence holds

`sourcer` is the only engine with network reach and held no write tool at all, so the claim ledger had no
producer for its domain-general half and `claim-source` ran in shadow with almost nothing to resolve. The
gap is now closed by an MCP grant, not by a write tool: **`sourcer`'s `tools:` line is unchanged**, and
`scripts/claim-append.test.mjs` fails if `Write`, `Edit` or `Bash` ever appears there.

The design decision that carries everything else: **the append gate does not implement a check resembling
the resolver — it calls the resolver.** `resolvers.run('claim-source', …)` and `run('claim-freshness', …)`
must both return `pass` at the moment of the call, or nothing is written. `unresolved` is refused, so no
egress means no append rather than a queued one (rule 10). A record that would fail `ledger verify` cannot
be created in the first place, and there is exactly one predicate rather than two that agree until the
incident.

## decisions

- **MCP grant, not `Write` and not `Bash`.** `Bash` behind a permission prefix is outflanked by a
  semicolon. The grant is the one mechanism this repo has *measured* to bind and narrow across an Agent
  dispatch (`c-mcp-grant-binds-through-agent-dispatch`).
- **`verified_by: source` only.** A `command` claim would let the network-capable engine choose a string a
  runner later executes. A `judge` claim with an empty panel resolves `unresolved` forever — the shape of
  three claims this repo already carries.
- **`scope: project` only.** `global` is machine state outside this repo's diff and CI; `task` dies with
  the branch, so nothing durably checks it.
- **Expiry capped at 365 days.** `validateClaim` asks the date be real and `claim-freshness` asks it be
  future; neither caps it, so `valid_until: 2099` satisfies rule 9's letter and defeats its purpose.
- **Injection closed by round trip, not by care.** Control characters are refused rather than escaped, then
  the whole emitted file is re-parsed with `parseClaimsFromText` and compared field by field — twice, once
  before the fetch and once on the exact bytes written.
- **SSRF closed by DNS, not by string matching.** `new URL()` then classify every resolved address, per
  redirect hop. Deliberately *not* shared with the guard in `pre-tool-use.sh`: that one answers "what will
  Chromium do with this string" and allows every hostname; this one answers "where will Node's fetch
  connect". Sharing would make one of them wrong.

## corrections

- **My own gate refused everything, and looked like it worked.** It read `r.verdict`; the resolver returns
  `status`. `undefined !== 'pass'`, so every append refused — with a TypeError, not a refusal. Caught by
  running the tests, never by reading them.
- **The team lead's premise on `checkCitations` is correct but its fix is not cheap — measured, then
  backed out.** I implemented the hard failure and ran it: it fires on four live sites and **three of the
  four are correct prose** (`DECISIONS.md:217` names the retired id *to say it was retired*; two session
  files are the historical record of the retirement). The machine-readable half is no cleaner — the one
  `supports:` edge pointing at the one deprecated claim is the **successor citing its predecessor**. So
  "cites a deprecated claim" is not the predicate, and closing this needs a decision nobody has made
  (most likely a `supersedes:` field). Left unfixed **in `ledger.mjs`**, with the measurement written into
  the function; enforced **in the append path**, where the semantics are unambiguous — a claim minted right
  now cannot be superseding anything.
- **A real defect found while measuring the above, in a file another lane holds:** `CLAUDE.md:634` asserts
  `c-mcp-hook-matcher-must-name-the-tool`'s content as live fact. PR #73 falsified it and the ledger
  deprecated it. Not touched — reported.
- **My own mistake, recorded because the recovery is the useful part.** To control-test whether `check:map`
  was already stale on the base, I ran `git stash -u` + `git checkout 244e8db` **in the shared worktree**.
  The stash did not take, the checkout detached HEAD, and the tree came back as base content plus two
  popped fragments. Nothing was lost — the branch ref held all four commits, both modified files were
  proved byte-identical to their committed versions with `cmp` before being discarded, and the three
  stashes belonging to other sessions were untouched. `git stash` is **repo-level state shared across
  every worktree**; the correct control was `git show <sha>:<path>`, which the standing rules already say.

## claims_touched

None registered. `docs/03-system-design/SOURCED-CLAIMS.md` ships as an append-only file with **zero**
claims, which is its correct initial state, and the tests plus a live dry-run prove it fills.

I deliberately did **not** seed it with a demonstration claim, though there is an argument for one:
`ledger verify` today has no *passing* `claim-source` claim at all — the only source claim is the canary,
which must fail — so "can this resolver ever pass?" is unanswered by the repo's own verify run. A positive
control would close that and would cost one extra `would_block` in no-egress environments. That is the
lead's call, not mine.

## verification

Everything below was executed. `npm run check` → **46 of 46 passed · 0 failed · exit 0 · 292.9s**, sandbox
armed, at `0c50c6a`. Derive the denominator rather than quoting it:
`node -e "console.log(require('./scripts/lib/check-suite.js').STEPS.length)"` → 46.

The first run of the suite was **45 of 46**, failing `check:map` — `CODEBASE-MAP.md` is generated and this
branch adds a file it enumerates, so the check was doing its job. `npm run build:map` regenerated it (one
line) and the re-run is clean.

`npm run test:ledger` → **197 pass · 0 fail** (149 existing plus the 48 new, registered by an import rather
than a new npm step, because `package.json` and `scripts/lib/check-suite.js` are held by L4-floor).
`check:ledger-verify` → exit 0, 78 pass · 10 would_block · 0 block. Four of those ten are
`mission-control` `claim-command` failures from `bun install` not having been run in this tree, which this
branch does not touch. `lint:agents` → 18 pass · 0 fail · **0 warnings**, unchanged.

`pre-tool-use.sh` driven directly, with a control that must fire:

| tool | hook |
|---|---|
| `mcp__claim-append__append_claim` | exit 0, allowed by the policy |
| `mcp__claim-append__delete_everything` | exit 0 + `would_block … rule=unlisted mode=shadow` |
| `mcp__playwright__browser_navigate` at `169.254.169.254` (control) | exit 2, BLOCKED |

Row two is the honest reading of where enforcement lives: an unlisted tool **proceeds** while the policy is
in shadow. The server exposes exactly one tool and refuses `UNKNOWN_TOOL` itself, which is why that is
acceptable — but the policy is not what stops it.

End to end against the live internet, sandbox disabled for those three commands only (the armed sandbox
denies DNS — `ENOTFOUND example.com`, which is the fail-closed path working):

| input | result |
|---|---|
| real URL, real quote | `APPENDED`, both resolvers `pass`, exit 0 |
| same live URL, fabricated quote | `REFUSED[RESOLVER_FAIL]` — quote not present, exit 1 |
| `http://169.254.169.254/latest/meta-data/` | `REFUSED[URL_NOT_PUBLIC]`, exit 1, no socket opened |

The refusal tests are not vacuous: the file opens with controls that must **append**, and the YAML
injection payload is proved to *be* a payload — fed to the same parser through a hand-written block it
forges a second claim.

## what this does not stop, stated plainly

**A URL the agent controls.** `sourcer` can publish text and then cite it. The ledger's model of a source
is "a URL containing this string"; it has no model of authority and this path cannot invent one. A host
denylist would be enumeration — what the SSRF guard in `pre-tool-use.sh` was rewritten to stop relying on.
The mitigation is not mechanical: the record lands in a tracked file, in the PR diff, under the QA gate,
with its host and fetched-body digest in the run log. **Source authority is a review question.** Also
unstopped: `confidence`, and volume.

## tier

`irreversible` (`.claude/agents/**`, `.mcp.json`). **One author, one model family.** The 2-of-3 multi-judge
and the ≥2-distinct-families requirement are **not** met by this record, per the accepted risk of
2026-08-23. The `PASS` above is my own and is not the tier being satisfied.
