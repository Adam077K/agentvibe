# Handoff — four branches ready, one settings key away from the first gate run

**From:** ceo (`ceo-2-1787566829`) · **Date:** 2026-08-24 · **Base:** `main` = `6db92ff`

---

## 1 · State in one paragraph

The four REQUIRED follow-ups from [the previous handoff](2026-08-25-after-the-gate-ran.md) are **closed**, across
**24 commits on four disjoint branches**. They merge cleanly in every pairing and as a set
(`integration/all-four`, verified). On the merged tree `npm run check` is **30 of 31**, the only failure being
`check:mc`. **Nothing has merged.** The binding gate has not run, there is no PASS, and rule 8 is not
negotiable — so this handoff ends with work finished and unlanded, which is the exact condition the previous
handoff told me to avoid. The reason is a single un-applied config key, below.

| Branch | Commits | What |
|---|---|---|
| `fix/pr1-sandbox-worktree-ci` | 4 | worktree protocol + lint predicate together · 2 CI wiring gaps · 3 sourced sandbox findings |
| `fix/pr2-flush` | 6 | 64KB truncation in **6** emitters · canary · `ledger.mjs` documented not changed |
| `fix/pr3-figures` | 9 | drifted figures · STATUS.md item 3 · 2 discharged decisions · rotted pin |
| `fix/pr4-checkrunner` | 5 | `npm run check` runs all 31 steps and names every failure · drift guard |

---

## 2 · The one blocker, and it is a founder action not an engineering one

`check:mc` fails **only under the armed sandbox**. Two cells, same commit, same deps, Bun 1.3.10 both:

| cell | result |
|---|---|
| sandboxed | 344 pass · **1 fail** · `EADDRINUSE` at `mission-control/test/stream.test.ts:249` · exit 1 |
| sandbox off | **345 pass · 0 fail** · exit 0 |

`errno: 0` is the tell — a genuine macOS `EADDRINUSE` is **48**. There is exactly one `Bun.serve` in the tree
and it is stopped in a `finally`, and `port: 0` cannot collide. It is a **denied loopback `bind()` wearing a
misleading errno**. The previous handoff's "leaked server from an earlier test" hypothesis is **refuted**.

**Do not edit `stream.test.ts`.** It is a regression test for a real bug found by running it; removing its
real socket makes it vacuous, which is a defect class this repo found and fixed in the session before last.

**No network setting can fix it.** The sandbox's network model is an outbound domain proxy
(`allowedDomains`, `deniedDomains`, `strictAllowlist`, `tlsTerminate`); there is no inbound/loopback binding
option. Source: <https://code.claude.com/docs/en/sandboxing>, accessed 2026-08-24.

**The decided fix, not yet applied** — add to the `sandbox` block of `.claude/settings.json`:

```json
"excludedCommands": ["git merge*", "git checkout*", "git restore*", "npm run check:mc"]
```

Verified safe: `test:sandbox` asserts by **inclusion** (enabled, failIfUnavailable, denyRead/allowWrite
coverage, no `network.allowedDomains`, no `permissions`/`hooks` keys) — `excludedCommands` breaks none of them.

**Unresolved, and measure it rather than assuming:** the gate's oracle runs `npm run check` as ONE command
with `check:mc` inside it, so the entry only helps if exclusions reach **child processes**. The docs page
truncates on that anchor. If it does not reach children, the fallback the founder already approved is to pull
`check:mc` out of the local chain — **CI already runs it as its own step** (`ci.yml`), so that also removes a
real local/CI structural divergence.

**Why this could not be delegated:** the permission classifier refuses an agent editing the live sandbox
policy, and the orchestrator does not implement. That refusal is arguably correct — this repo marks
*harness self-edit* `enforcement: block` because `git revert` does not undo it.

---

## 3 · The finding that outlives these branches

**`npm run check` chained 30 steps with `&&`, and `check:mc` was step 21.** So a single invocation never
reached steps 22-30: `test:probe-readonly`, `test:pre-tool-use`, `test:run-gate`, `test:tier-gate`,
`test:merge-gate`, `test:skill-clamp`, `test:probe-stop-reason`, `test:launcher-permissions`, `test:sandbox`.

That is the safety-hook tests, **the gate's own tests**, and the check that makes "the sandbox is armed" a
fact rather than a comment. **`qa.js`'s oracle runs `npm run check` as one command and treats it as the
deterministic floor before any reviewer is dispatched.** So the floor had a nine-step hole in it, behind a
failure that was never a real defect. CI was unaffected — it runs each script individually — which is exactly
why nobody saw it. PR-4 fixes the class: all 31 run, every failure named, exit still nonzero.

**And the fix is one level deep — the same defect survives inside the steps.** Found by pr4, verified here:
**six `check:`/`test:` scripts are themselves `&&` chains, 19 links** (five of them inside the suite, 17
links). The worst is `check:ledger`:

```
test:claims && test:classifier && test:ledger && ledger lint && ledger build --check && ledger verify
```

If `test:claims` fails, **`ledger lint`, `build --check` and `verify` never run** — the ledger's own
enforcement, which CLAUDE.md lists as blocking — and the new runner reports exactly one line,
`✗ check:ledger — exit 1`. Honest about the step, blind inside it, in precisely the way the top level was
blind. Correctly left unfixed: collapsing those links into `STEPS` changes what each CI job runs
(`ci.yml` names `check:ledger`, not its parts), which is a workflow decision at irreversible tier, not a
builder's call. **This is the next session's cheapest high-value fix.**

Two smaller gaps from the same return: **`test:check-suite` and `test:protected-write` do not run in CI**
under their own names — both bind locally and in the oracle via `npm run check`, but naming them in
`ci.yml` is an irreversible-tier workflow edit. And `check:mc` on a **fresh checkout fails in 0.1s**, not
the ~3 minutes assumed, because the deps are absent — so the chain was aborting almost instantly. Nobody had
to wait to lose the nine steps, which makes the defect cheaper to hit and therefore worse.

---

## 4 · Two open questions closed, with sources

- **`allowWrite` can never lift `.claude/**` protection.** Vendor, verbatim: *"There is no way to exempt one
  of these paths: an `allowWrite` entry or an `Edit` allow rule that covers the path doesn't lift the
  protection. The only way to turn the protection off is `filesystem.disabled`."* The `**/.worktrees` entries
  were added for something they cannot do. This also explains `git worktree add` exit 128.
- **A long-lived session worktree cannot be synced to `main`** once `main` touches `.claude/**` — `git merge`
  fails with `unable to unlink old`. **This worktree was 170 commits behind for that reason**, and the
  previous session shipped a line cite (`schema-lint.js:1068`) read from a stale tree; the predicate was at
  `:1186` at its own stated base. Documented remedy is `excludedCommands`; the same key above covers it.

---

## 5 · Method, and it is the session's real output

**The failure is silent because the wrong answer is well-formed — a wrong path errors, a wrong tree does not.**
(pr3's phrasing.) Every defect found today is an instance:

- `EADDRINUSE` meaning a denied `bind()` · `errno: 0` was the only tell
- `check-citations.mjs`'s `writeSync` "fix" returning a **short count without throwing** — at 288,412 bytes it
  was one `console.log` from silently failing again
- "29 of 29" dropping its own failing step out of the denominator
- `npm run check` reporting a floor it never reached
- `STATUS.md` saying the sandbox was configured nowhere while armed; `CLAUDE.md` asking the founder to decide
  two things already decided
- **Mine:** `$?` read through a pipe (returns the pipe's status); `set -- $pair` under zsh (does not
  word-split) producing three bogus CONFLICT results; misreading a peer's mid-A/B worktree as unfinished work
- **A verification method that lies to observers:** pr3's ledger A/B wrote a historical `CLAUDE.md` over the
  tracked file for the duration of each run. Four runs, four windows in which the worktree presented a false
  state — I sampled one and reported a peer's finished work as unfinished. **Evaluate a copy; never mutate a
  tracked file to measure it.**
- **The shell cwd resets between calls.** Three separate agents hit this today, one per branch. pr4 ran
  `npm run check:mc` without a `cd` prefix, executed it in *another builder's worktree*, and got a
  plausible "dependencies missing" from the wrong tree. **Use absolute paths; re-derive state, never carry it.**

None errored. All returned well-formed answers to questions nobody asked, and **not one was caught by a
check** — which is the argument for what PR-2 and PR-4 actually built: a canary and a drift guard, each of
which fails when the thing it guards stops being true.

**The orchestrator's brief remains the noisiest defect surface.** Four of my errors this session, every one
caught by the builder receiving it, none by any check. Second consecutive session with that finding.

---

## 6 · Next

1. **Apply the key (or the fallback), run the gate, land the four branches.** They are ready and verified.
2. **Then the venture task — and `framer` defines it first.** Founder decision 2026-08-24: nobody has ever
   written down what Agentvibe is, who pays, or what the first customer-facing artifact would be. **112
   session files, zero customer-facing work.** A playbook cannot run without that spec.
3. **`DECISIONS.md` has room for one entry, then it needs an eviction** — 26 entries, 37,058 bytes against
   40,000, real entries averaging ~1,849. Check with `node scripts/check-memory-budget.mjs` before appending.
4. **Reconcile `CLAUDE.md`'s "Known contradiction" bullet after the merges.** PR-3 deliberately did not claim
   resolution because PR-1 had not landed; that reconciliation is the next orchestrator's, and it should be
   done in the same PR that merges them.
