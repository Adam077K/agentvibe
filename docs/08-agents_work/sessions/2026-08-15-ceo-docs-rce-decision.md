---
date: 2026-08-15
role: ceo
task: docs-rce-decision
tier: trivial
qa_verdict: PASS
---

Memory file only; no code. Records the Founder's decision on the three confirmed RCEs in `.claude/memory/DECISIONS.md` (34 of 50 entries): **allowlist trusted roots**, seeded from the 19 discovered projects, **plus** reject `Sec-Fetch-Site: cross-site`. Implementation is in flight separately on `feat/rce-allowlist`, tiered `full` by CEO judgement — the classifier floors every mission-control path at `lite` (`matched: (none — default)`), which is #34·#35 and means security work classifies as lite today.

Rejected with reasons recorded: stop-shelling entirely (`conflicts.ts` cannot survive it — `git status` has no honest in-process equivalent; `worktrees`/`belief`/`fleet` could convert), and accept-and-bound alone (closes the cross-site browser vector only).

**The measurement that changed the design, and it was a CEO error caught before it shipped.** An `Origin` check was proposed as "no-regret" and flagged for checking rather than assumption. Checked twice, independently, in a real browser: `Origin` is **absent** on `<img>`, `<script>`, `<link rel=stylesheet>`, form GET and no-cors `fetch` — only CORS `fetch` sends it. A check must therefore treat absent as allowed, since the app's own requests send none either, and every drive-by subresource vector passes. That is a guard satisfied while the property it protects is violated, proposed while quoting the section that names that class. `Sec-Fetch-Site` is sent on all of them and discriminates correctly (`cross-site` / `same-site` / `same-origin`).

Two constraints recorded as binding on the implementation: the control is **"blocks cross-site browser requests", never "blocks drive-by"** — `same-site` is allowed, so any other loopback service retains all three RCEs and a non-browser client sends no such header; and **an unlisted project must never render as absent**, reusing `EXCLUDED_REASON`, because a security control that silently hides data is a new instance of the defect class.

Also recorded: the suspected **fourth** vector at `fleet.ts:131` is not one. `script` resolves to `REPO_ROOT` from `import.meta.url`, and both reachable entry points — `/api/fleet` and `routes/stream.ts:86`, the second omitted from the first write-up — hard-pass it; enumeration independently confirmed exhaustive at exactly two. Resolved by call-site trace rather than execution, deliberately: **execution proves existence, enumeration proves absence**, and a payload could only have shown that one chosen input fails to reach the sink. Latent shape kept: `fleetSlice(repoRoot: string = REPO_ROOT)` is a defaulted parameter, so the seam for a future caller to pass a discovered root exists though none does.

Verification: no code changed; `.claude/memory/DECISIONS.md` is append-only and remains under its 50-entry cap. Classifier floor `trivial`. No independent review — a decision record, whose every factual claim was executed or traced before being written here.
