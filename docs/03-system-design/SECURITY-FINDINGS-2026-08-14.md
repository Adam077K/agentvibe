# Security findings — Mission Control, 2026-08-14

**Status: OPEN.** Found during the Full-tier review of PR #30, confirmed on `main` at `a3189ed`.
None was introduced by PR4; all pre-date it. Tracked as **#36**.

**Every finding below was executed, not reasoned.** The reviewer's repro scripts lived in a session
scratchpad under `/tmp` and are gone; what they proved is recorded here so the fix can be verified
against the same conditions.

**Operational guidance until this is closed:** Mission Control binds loopback only, so the realistic
vector is a repository you did not write sitting under `MC_PROJECT_ROOTS` (default `~/VibeCoding`).
Do not run the server against a tree containing repos you did not author.

---

## The finding behind the findings

> **"`server/**` invokes no shell" is literally true and operationally void.**
> The shell is one `execFile` away, in a program the guard does not scan, reached with data the caller
> controls.

Three PRs, four review rounds, two guards — a source-text scan and a behavioural test — defended an
invariant that was not the one protecting the system. Every subprocess call site in `server/**` is a
literal binary plus an args array with no shell, and the code is still remotely code-executing. **A guard
that is satisfied while the property it exists to protect is violated is the defect class in
[PHASE-8A-HANDOFF.md](PHASE-8A-HANDOFF.md) §0, applied to an invariant instead of a mechanism.**

Any fix must therefore change *what is claimed*, not only what is checked. The honest invariant is
something like: **`server/**` executes no program that a discovered directory can choose or influence.**

---

## F1 — `GET /api/conflicts` executes attacker code. No shell, no metacharacters.

`mission-control/server/collectors/conflicts.ts` — `changedFilesFor`

The sweep runs `git --no-optional-locks status --porcelain` with `cwd` set to a worktree path discovered
on disk. **Git reads that repository's own `.git/config`, and `core.fsmonitor` names a program git
executes** during `status`. `--no-optional-locks` does not disable it. `safe.directory` does not help —
same uid. Confirmed against git 2.50.1.

Observed: the marker file was written and captured `uid=501(adamks) gid=20(staff)`. **In the same request,
the sweep reported that worktree as `changedFiles: []` — it renders as clean while running the attacker's
program.**

The registry scoping added in PR4 is not a mitigation: the fixture writes its own `.worktrees/.registry`,
which is exactly what an attacker would do.

## F2 — `GET /api/belief` runs `node <discovered-project>/scripts/ledger.mjs`

`mission-control/server/collectors/belief.ts` — `runLedgerVerify`

`projectRoot` comes from `discoverProjects()` walking `MC_PROJECT_ROOTS`. **Any directory there containing
`scripts/ledger.mjs` has that file executed as the user.** `?project=<id>` lets the caller choose which
project supplies the code.

Observed: `marker contents: 78601 ran as adamks`.

The `--` sentinel the code documents at length guards *flag injection into `node`*. It is irrelevant here:
**the file being executed is the payload.**

## F3 — A project's claim markdown becomes `/bin/sh -c <string>`

`scripts/lib/resolvers.js:261` — `execFileSync('/bin/sh', ['-c', ev.cmd], { cwd })`

`ev.cmd` is read from a ```` ```claims ```` block in the project's own markdown. Confirmed by copying the
real, unmodified `scripts/` tree into a fixture project, adding one claim with
`evidence: {cmd: "id > $MARKER"}`, and calling `collectBelief`. Marker written.

This is reached *through* F2 and also directly by any ledger run over an untrusted project.

## F6 — No Origin/CSRF check on side-effecting GETs (severity multiplier)

`mission-control/server/routes/api.ts`

Every route is a `GET` that spawns processes, and there is no Origin validation anywhere. Loopback binding
is correct and insufficient: **a page the user visits can fire `fetch('http://127.0.0.1:4300/api/conflicts',
{mode:'no-cors'})` or an `<img>` tag** — it never needs to read the response, only to trigger the work.
Combined with F1–F3 that is drive-by local code execution once one malicious repo exists on disk.

---

## What a fix has to satisfy

The reviewer's framing, which is the useful one: **the problem is not sanitisation.** You cannot sanitise
"run this file". The directions worth costing:

1. **Stop executing programs from discovered directories.** Read their artifacts directly — the ledger
   index is JSON on disk, and `git status` has a plumbing alternative that does not honour repo-local
   config. Strongest, and it removes the class rather than narrowing it.
2. **Allowlist trusted roots**, so discovery still finds every project but subprocess execution is confined
   to repositories the user has explicitly marked. Keeps the feature, moves the decision to the user.
3. **Accept and bound it** — Origin check, a documented "own repositories only" constraint, and a claim in
   the ledger with an expiry so the acceptance is re-decided rather than forgotten.

**Whichever is chosen, F6 should be closed regardless** — an Origin check is cheap and it removes the
drive-by vector from all three.

**And the invariant must be rewritten.** Leaving *"`server/**` invokes no shell"* in the README and the
handoff while these are open teaches the next reader to check the wrong thing. Whatever guard survives
should be named from what its body actually verifies — the §0 corollary this codebase has now applied
four times.

---

*Recorded by: ceo · 2026-08-14 · found by the security lens of the PR #30 Full-tier review · single model
family, so this was one opinion rather than an independent panel*
