---
date: 2026-08-28
role: builder
task: sweeps-report-what-they-could-not-classify-onto-main
qa_verdict: PASS
tier: full
risk: full
branch: fix/sweeps-report-what-they-could-not-classify
commits: 8
---
# Updated onto `main`, and the document stopped being false about the tree it lives in
**The markings this PR was held open for are now the wrong way round.** `SWEEP-REPORTING.md` marked two instances as IN FLIGHT — `probe-workflow-reach.mjs` as *"does not exist here"* (#111) and the `qa.js` refusal as a defect *"PR #115 fixes"*. Both merged to `main` on 2026-08-26; `git merge origin/main` here on 2026-08-28 was clean (rc=0, no conflicts). Verified by content with a negative control, not by trusting the PR list: the probe file is tracked and reports `UNRESOLVED` at exit 2, and `REFUSED` is a value of qa.js's frozen `VERDICT` object rather than a word in a summary string.
**Swept the class mechanically rather than fixing the three I was told about.** One 18-alternative pattern over all 7 files this PR touches: **7 hits before, all in one file**; 4 sites rewritten; **9 after, 8 of them quotations inside `> Superseded` blocks and 1 a now-true provenance line.** Positive control on the arm that fails silently — every file proved readable and token-matched; negative control found nothing. The fourth site was not in the brief: **875 of 876** had drifted to 880 of 881 with the corpus, and *"a founder decision in flight"* overstated what was open — the existence half was already a blocking step at this branch's own base. Superseded readings kept in place, per house style.
**Both postures unchanged, each with a control that could have caught the opposite.** Existence **blocks**: clean run exits 0, and a tracked fixture citing a nonexistent path exits **1** and names it — fixture removed, tree clean. Drift **WARNs**: exits **0 while holding 1 existence + 87 drift findings**, so the zero is a posture and not an empty run. Neither `STEPS` nor `EXCLUDED` moved: 48 steps at the base and 48 on `main`, `check:citations-exist` in `STEPS`, `check:citations` in `EXCLUDED`, both sides of the merge.
**Three buckets survive the merge, and one new unclassified item arrived with it.** Dispatch: **26 occurrences → 17 sites + 9 unclassified** (masked ×6, md-prose-mention ×3), identity intact across both halves. Citations: **881 locators, 21 unchecked** (ambiguous ×20, external ×1), every item carrying a reason. The one new item — an ambiguous `DECISIONS.md` locator in a session file that came in with the merge — is **reported, not fixed**, as are the `RESOLUTION:` off-by-one and all 30 pre-existing unclassified items.
**Also found, reported, not fixed:** the citation checker harvests **tracked** markdown only — the same dead-citation fixture exits **0** while untracked and **1** once `git add`ed. A dead pointer in an unstaged doc is invisible to a blocking step.
**Verified:** `node --test` on both PR test files → **62/62** and **30/30**, exit 0. Suite: `npm run check` → **48 of 48 passed · 0 failed · exit 0**, sandbox armed. Tier from `node scripts/classify.mjs`, not assumed: floor **full**. Standing caveat — this PASS means the checks ran green, not that the tier was satisfied; single model family, accepted risk to 2026-11-17.
