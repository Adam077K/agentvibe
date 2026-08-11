---
date: 2026-08-11
role: ceo
task: phase-4b-engines
tier: irreversible
qa_verdict: PASS
status: Complete
---

# Session Log: CEO — Phase 4b, the roster collapse

**26 agents / 6,487 lines → 7 engines + 11 shims / 1,099 lines.** The 26 were never distinct procedures —
they were one procedure per shape of work, repeated once per domain, with the domain knowledge in prose that
rotted. That knowledge is now lenses and playbooks, both linted.

**Eleven names kept as shims, and this is the part worth remembering.** Deleting a repo agent does not remove
the name — it un-shadows the copy in `~/.claude/agents/`. For `ceo` that meant swapping a 226-line Opus
definition for a 313-line Sonnet one routing to `build-lead`, `product-lead`, `growth-lead` and
`business-lead`, four agents this repo retired. `@ceo` would not have broken; it would have kept working and
quietly meant something else. **A failure that keeps working is worse than one that stops.** The other 15 had
no global twin, so their deletion fails loudly and they went.

**A correction to what I shipped in Phase 4a.** I wrote that the drifted globals are "the only copy in every
other project on this machine". False, and inferred rather than checked: 14 of 16 projects carry their own
`.claude/agents/`. The globals are live in two. Corrected in the fabrication catcher itself.

**Provenance that survives deletion.** The lens `sources:` check fired the moment the agents were deleted —
correctly. The tempting fixes were both dishonest: re-point at the replacing engine (the expertise did not
come from there) or archive 6,487 lines of superseded prose to keep a path resolving. Sources may now name
git history as `git:<path>@<rev>`, verified with `git cat-file`. A second rule refuses a lens citing a
**shim**, which fired on eight lenses the moment the shims landed.

**A bug the ledger found in itself.** A `verified_by: judge` claim under a path whose tier rule lists
`claim-command` had the command resolver run against an absent `cmd` — it shelled out to nothing and reported
"exit 127, expected 0", which reads as a real command failing. A tier-map resolver is now attached only when
the claim carries evidence it can use.

**The zsh word-split bug bit me again** — `for a in $VAR` ran once with the whole string, exactly the failure
`c-zsh-no-word-split-on-expansion` in the global ledger describes. The safety check I wrote to run per-agent
silently ran once. Redone with an inline list.

**Gate: 2 of 3 met.** `schema-lint` exit 0 across the roster; a single-model "independent" panel fails the
lint, tested by constructing it. The third — *read-only engine cannot write, verified by attempt* — is
**declaration-verified only**. `schema-lint` now fails if `reviewer` or `reader` declares `Write`, but proving
the field *binds* needs a spawn, which is disabled here. Recorded as `c-read-only-binding-unverified`, waived
to 2026-09-08, probe at `scripts/probe-readonly-engine.sh`. Calling the lint the gate would be exactly the
decorative-capability failure §3.7 names.

**QA verdict basis:** no independent QA-Lead — spawning is off. PASS rests on 155 tests and `npm run check`
exit 0.

---

*Session by: ceo | 2026-08-11*
