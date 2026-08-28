---
title: "W3-instruments — verdict buffer ceiling, refusal diagnosis, judge-dir reclamation"
date: 2026-08-29
engine: builder
task: w3-instruments
branch: feat/w3-instruments
base: 4ddc5c6a22c799f7b868f26545c507b03719944b
tier: full
qa_verdict: PASS
verification: "VERIFIED-BY-EXECUTION. Fixture repo, git diff 1,530,571 bytes, control 120 bytes on the same repo. Before: 1.5MB diff exits 2, stdout 0 bytes, stderr 'spawnSync git ENOBUFS'; control exits 0 with a subject. After: 1.5MB exits 0. Input constructed to defeat the fix — VERDICT_MAX_BUFFER_BYTES=1024 against the same 1.5MB diff — still refuses, exit 2, now naming the ceiling, that nothing is established about the diff, and the variable that raises it; must-not-fire cell at 99000000 exits 0. Four malformed ceilings (abc, 0, -5, 3.5) each refused naming themselves; negative control with origin/main deleted still reports 'cannot resolve'. Judge-dir cleanup, 3 cells: armed dir removed, QA_KEEP_JUDGE_DIR dir kept (must-not-fire), unarmed operator dir kept. readVerdictArtifact evidence went from {exit:2,stdout:''} to the same record carrying verdict.mjs's full stderr. npm run test:merge-gate — the suite that loads both changed files — 126 pass / 0 fail."
finding_brief_premise_3_false: "The brief routed three defects and stated all three are in scripts/**. deriveGateReachability is defined at mission-control/server/index-cache.ts:761 and called only from mission-control/scripts/consume-dispatch.ts. Zero occurrences under scripts/** (negative control empty; positive control on the same arm found produceVerdict/PRODUCED in 3 files). mission-control/** belongs to another lane by the same brief, so item 3 was stopped on rather than substituted."
finding_brief_premise_1b_false: "The brief said the ENOBUFS failure 'accuses the gate session of moving the reviewed bytes'. It does not, at this base: produce-verdict.mjs guards that branch behind a !pre.subject check that fires first, landed with #125. Measured, the real diagnosis was 'produced no readable JSON (exit 2)' with an empty stdout excerpt and stderr discarded — the cause was deleted rather than misattributed."
finding_self_inflicted: "The first cut of the ceiling refusal was masked by mergeBase's bare catch, which re-labelled it 'cannot resolve origin/main' on a repo where origin/main resolves. Exit code was 2 throughout, which is what let it pass a first reading."
not_done: "run-gate.mjs still sets no maxBuffer (6 exec sites, grep -c maxBuffer = 0). Identified, out of the two fixed items, not changed."
---

Three routed instrument defects; two fixed, one refused on a false premise.

1. `verdict.mjs` `git()` buffered git's stdout at Node's 1 MiB default, so a diff past a megabyte
   made the subject unreadable. It failed safe — exit 2, never a false pass — and diagnosed wrong,
   which was the live half. Ceiling raised to 256 MiB, overridable, and the ENOBUFS refusal now
   names what happened instead of reading as a fault in git.
2. `produce-verdict.mjs` materialised a judge tree per run and never removed it. Ours are reclaimed
   at exit; an operator's `--judge-dir` never is. What exit-time cleanup misses — SIGKILL, a harness
   timeout — is written in the source, not left to be discovered.
3. `deriveGateReachability` is in `mission-control/**`, another lane's surface. Stopped, not substituted.
