---
date: 2026-08-26
role: builder
task: sourcer-can-write
branch: feat/sourcer-claim-append
worktree: .worktrees/sourcer-can-write
base: 47dbbd6
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
- **Injection closed by `checkText`; the round trip is a second line.** Control characters are refused
  rather than escaped. The emitted file is then re-parsed with `parseClaimsFromText` and compared field by
  field, twice — but see F4 below: that second pass catches nothing reachable today, and this bullet
  originally claimed more for it than the mutations support.
- **SSRF decided on the ADDRESS VALUE, after `new URL()` and DNS.** This bullet first read "closed by DNS,
  not by string matching" and **it was wrong in exactly the way the review found**: the classifier still
  matched a textual tail, so every IPv4-embedded IPv6 spelling walked through. Now the host is parsed to
  bytes and ranges of the 128-bit value decide. Still deliberately *not* shared with the guard in
  `pre-tool-use.sh`: that one answers "what will Chromium do with this string" and allows every hostname;
  this one answers "where will Node's fetch connect". Sharing would make one of them wrong.

## review round 2 — PR #112 came back FAIL on three lenses, and it was right

**F1 · HIGH · the SSRF guard I wrote to stop adversary #10 was bypassed with a URL string.**
`addressIsPublic` looked for a *dotted* IPv4 tail to spot an address embedded in an IPv6 one. Its caller
takes the host from `new URL(u).hostname`, and the WHATWG serialiser has already compressed the dotted form
to hex by then. Reproduced myself, control in the same run:

| URL | `hostname` | old verdict |
|---|---|---|
| `http://[::ffff:169.254.169.254]/` | `::ffff:a9fe:a9fe` | **public** |
| `http://[::ffff:127.0.0.1]/` | `::ffff:7f00:1` | **public** |
| `http://[::127.0.0.1]/` | `::7f00:1` | **public** |
| `http://[64:ff9b::127.0.0.1]/` | `64:ff9b::7f00:1` | **public** (not in the review — found sweeping the class) |
| `http://[2002:7f00:1::]/` | `2002:7f00:1::` | **public** (same) |
| `http://127.0.0.1/` | `127.0.0.1` | refused — control fires |

The reviewer took the first end to end against a real loopback server; the claim landed in the tracked file.
Since `evidence.quote` is a substring test and `APPENDED` differs from `REFUSED[RESOLVER_FAIL]`, that is a
content oracle over anything the runner reaches on loopback, link-local or RFC1918 — and it was the only
gate, because `pre-tool-use.sh` URL-guards browser tools only and the MCP policy is `mode: shadow`.

**The instructive part is that the right instinct produced it.** `pre-tool-use.sh` carries a comment saying
its first browser guard *"was bypassable five ways and an independent reviewer found all of them… It
pattern-matched ONE SPELLING of each address."* I reproduced that class one layer down — and my header's
argument for using `new URL()`, *"the very parser `fetch` uses"*, is precisely what strips the spelling my
check depended on. Fixed by parsing to bytes and classifying ranges of the **value**, so every spelling of
one address collapses to one byte array before any decision is taken.

**F5 · why 48 green tests did not see it.** My test asserted
`addressIsPublic('::ffff:169.254.169.254') === false` and passed — against a dotted literal **the production
path can never deliver**. A fixture built from the fix, in the exact shape the standing rules name. Every
address case now takes its input from `new URL(...).hostname` through one helper, and there is no other way
in. Both new tests go **red against the old predicate and green against the new one**, verified by mutation.

**F3 · a successful append reddened a blocking CI step and `sourcer` could not repair it.** Measured: one
append → `ledger build --check` fails; `ledger lint` stays exit 0, so nothing warns until CI. The agent has
no `Bash` and no `Write`. A gate whose success state needs a privilege the caller lacks is a trap, not a
gate. The append now rebuilds the index inside the same lock and **rolls the claim back** if that fails;
where no index exists the return carries a `remedy` naming the command, and `sourcer.md` says to surface it.

**F2 · two comments asserted a fix a third said was backed out.** `claim-append.js` said the deprecated-
citation gap was "fixed at the source" and `claims.js` said "ONE PREDICATE, TWO CALLERS, ON PURPOSE". One
caller. The back-out was right; the comments did not follow it. Two sentences asserting an unchecked state,
inside the mechanism whose purpose is to stop exactly that.

**F4 · five refusals survived deletion, including the one I called strongest.** Both `roundTrip` calls
delete with the suite green, so *"STOPPED TWICE… proved on every single call"* was stronger than the
evidence. It is genuine defence-in-depth and is now described as the second line it is, with its predicate
exercised directly. `LOCKED` and `TARGET_CHANGED` were reachable and are now tested — the latter by a
`fetchImpl` that races the file in the one window the `O_EXCL` lock cannot cover. `NO_FETCH` and
`RESOLVER_SET` are labelled unreachable-and-deliberate rather than left implying they fire.

**Residuals, recorded not chased:** DNS-rebinding TOCTOU (needs a pinned dispatcher, and needs an attacker
running authoritative DNS — strictly smaller than F1, which needed a string) and U+202E / zero-width
characters passing `checkText`.

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

Everything below was executed. `npm run check` → **46 of 46 passed · 0 failed · exit 0**, sandbox armed —
292.9s before the review fixes, 356.8s after, and that spread is lane load rather than the suite, exactly as
`docs/STATUS.md` §4 warns. Derive the denominator rather than quoting it:
`node -e "console.log(require('./scripts/lib/check-suite.js').STEPS.length)"` → 46.

`npm run test:ledger` after the review fixes → **206 tests · 205 pass · 0 fail · 1 skipped**; the skip is the real-socket
SSRF regression test, which the armed sandbox denies `listen()` and which binds for real on CI. I ran it
unsandboxed to confirm it passes, and mutated the classifier back to the shipped bug to confirm it fails —
a test I had never seen fail is a test I do not have.

Live, on the real repo, after the fixes: `ledger build --check` **exit 0 before and after a real append**
with `index_rebuilt: true`, and `http://[::ffff:169.254.169.254]/latest/meta-data/` →
`REFUSED[URL_NOT_PUBLIC] … points at ::ffff:a9fe:a9fe`.

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
