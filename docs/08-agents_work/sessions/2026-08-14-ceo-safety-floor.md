---
date: 2026-08-14
role: ceo
task: safety-floor
tier: irreversible
qa_verdict: PENDING
---

Hardened `.claude/hooks/pre-tool-use.sh` and added `scripts/pre-tool-use.test.mjs` (42 cases, wired as
`test:pre-tool-use`). **12/42 → 42/42.** All 15 non-MC checks green; the one MC failure is a pre-existing
marginal timeout (`ledger verify --offline` alone burns 21.35s of that test's 30s budget) in a file I did not touch.

**The hook was blocking nothing.** `awk -F'"'` parsed `tool_name` from compact JSON — Claude Code's actual
format — landing on `session_id`'s value, so `case` fell to `*)` and every rule was skipped. Fixed by parsing
structurally once, failing CLOSED on unparseable input, normalising split flags (`rm -r -f` ≡ `rm -rf`), adding
path scoping (deny-by-default outside the project root), and blocking destruction that never spells `rm`
(`git clean -fdx`, `git checkout .`, `find -delete`, `node -e …rmSync`) plus secret READS (`cat .env` was
allowed while `Write .env` was blocked — protected one way, leaked the other).

**~~A read-only agent disarmed the permission model mid-review.~~ RETRACTED 2026-08-14 — this was wrong.**
I read `.claude/settings.json` losing `budget-guard.js` at 23:42 and concluded a read-only agent had escaped
its grant. It was **PR #29** (`5290edd`, 2026-08-13 **23:40:07 +0300**) — a founder-instructed,
`tier: irreversible`, reviewed and merged change, landing two minutes before the mtime I read as an intrusion.
There was no escape, and my "restore" re-armed a guard the founder had deliberately ordered removed; the
worktree has since been fast-forwarded to `30f6c35` and the founder's decision stands.
`c-read-only-binding-unverified` **remains genuinely unprobed** and its 2026-09-08 waiver holds.
What survives is weaker and still real: every read-only agent holds `Bash`, so the boundary is *asserted* by
tool grant and unenforced underneath — a gap in the argument, not an observed breach. The claim that only an
OS boundary will hold may still be true; **it is no longer evidenced**, and the Phase 4 / Wave D ordering
should be argued on its merits rather than on this. I inferred an intrusion from a timestamp without checking
what had merged.

**Not applied: IMPLEMENTATION-PLAN step 0-A.** Replacing `execFileSync('/bin/sh', ['-c', ev.cmd])` with an
argv allowlist would turn 6 live claims `unresolved` (`! grep -q …`, `test ! -d …`, a pipe into `grep -q`, `&&`
chaining) and take the ledger red. Executing repo-authored commands is the resolver's purpose, like an npm
script; the trust boundary is the tier gate on claim-carrying paths, not the resolver. Needs a real decision,
not a patch. **Not applied: 0-D** (launcher `--dangerously-skip-permissions`) — highest blast radius, awaiting
founder sign-off.
