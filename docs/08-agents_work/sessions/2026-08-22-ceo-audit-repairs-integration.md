---
date: 2026-08-22
role: ceo
task: audit-repairs-integration
qa_verdict: PASS
tier: full
risk: full
branch: fix/audit-repairs
session: ceo-4-1787176363
decisions:
  - "Integrate holes A, B and C as one PR rather than three, per founder batching decision"
  - "Merge, never rebase — a rebase must check out the other side's .claude/hooks/, which git cannot write here"
corrections:
  - "The commit subject 'safe checkout long options' overstates: the discard predicate never changed"
  - "The commit message says three phantom agentTypes; there were four, and all four are fixed"
claims_touched: []
---

# Integration — audit repairs A, B and C

This branch is an **integration**, not new authorship. It merges `fix/org-chart-truth` and
`fix/gate-ref-and-hook-fp`, both finished 2026-08-20 and never pushed anywhere. Zero conflicts; the
merge-base intersection showed no overlapping files between them.

## Why this session file exists

The two source branches each carry their own session file, and both say `qa_verdict: PASS` — but their
frontmatter names `fix/org-chart-truth` and `fix/gate-ref-and-hook-fp`, **not this branch**.
`qa-lead-pass.yml` selects the verdict from session files present in the PR diff, so without this file the
PR would pass its gate on **verdicts authored for different work**. That is the defect class the workflow's
own comment names at `:80-89`, reached through the added-to-diff door rather than the merged-to-main door
the 2026-08-15 fix closed. Found by an independent reviewer on the sibling PR; it applies here equally. The
durable fix is the diff-hash binding in `scripts/verdict.mjs`, which is a different PR.

## Review

An independent `reviewer` ran `correctness`, `security` and `scope` against this branch and returned
**PASS**, with method rather than assertion: it injected a dead agent name into org-chart prose, watched
`check:registration` go red, restored it, watched it go green; and it ran `run-gate` from three different
working directories and got an identical SHA, which is what issue #95 was about.

**Single model family.** One opinion, not a panel. The `risk: high` predicate wants two distinct families
and this runtime has no non-Anthropic model — a structural limit, recorded rather than papered over.

Three findings, none blocking:

- **p2** `CLAUDE.md` still attributes `CODEBASE-MAP.md` to `code-reviewer`, which this same commit
  describes as a shim. Which engine owns that file is left unresolved.
- **p2** `.claude/workflows/design-screen.md` — the four `agentType` fields are fixed, but the surrounding
  prose, comments and prompt strings still name `product-designer`, `design-critic` and `design-polisher`.
  Runtime behaviour is unaffected; the description misleads about what runs.
- **low** Path traversal at `scripts/check-dispatch-agenttype.mjs:267` — `agentType` reaches
  `path.join(ROOT, '.claude/agents/' + name + '.md')` unsanitised. Reproduced: with the target present the
  checker **silently accepts** an agentType resolving outside `.claude/agents/`, which defeats the check's
  purpose more than the file read does. `agentInfo` is **byte-identical on `origin/main`**, so this branch
  inherits it rather than introducing it. Needs its own issue.

None was patched in. Amending after review means merging a diff nobody reviewed, which is exactly what the
verdict binding exists to prevent.

## What is still open

`fix/gate-ref-and-hook-fp` closes issue #95 fully and **#96 only partly** — the scratchpad-parity half. The
hook's discard predicate is untouched: it fires on any command carrying a `checkout` token plus a later
double-dash followed by whitespace, anywhere in the command text. It blocked four commands during this
session's own work, including one whose only offence was a heredoc quoting the predicate. Commit `78caf29`
on that branch records this rather than letting the subject line stand, which is the right instinct.
