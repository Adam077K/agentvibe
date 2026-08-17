---
date: 2026-08-17
role: designer
task: mission-control-craft-pass
branch: feat/mission-control-craft-pass
qa_verdict: PASS
tier: lite
---

Craft pass across all seven Mission Control views (Fleet, Sessions, Belief, Conflicts, Inbox, Project, Dispatch).

Source-only evidence (three screencapture attempts returned Spotify — the active app — not the browser; per deviation rules, evidence is labeled source-only throughout).

**What was fixed:**

1. `DispatchView` — form controls now use `.control` class. `select` and `textarea` were using ad-hoc inline styles (`bg-ink`, `border-line`, `focus:ring-*`) that diverged from the written system. `styles.css` states: "ONE control surface for the select and the text input." SessionsView applied `.control` correctly; Dispatch did not. Measured differences: background `#0d0e11` vs correct `#1e222b`, border `1.438:1` vs correct `1.971:1`, no hover transition, ring-based focus vs border-based focus.

2. `DispatchView` — "New dispatch" section label replaced with `.label` class. Was inline `text-[12px] font-medium uppercase tracking-wider text-muted` — wrong size (12px vs 10px), wrong letter-spacing (0.05em vs 0.09em), wrong color (`--color-muted` 7.422:1 vs `--color-dim` 5.120:1, making it visually heavier than every other section label). All other views use `.label` for this role.

3. `DispatchView` — `Figure` value changed from `String(headline.total)` to `formatCount(headline.total)`, and sub from bare template literal to `formatCount(headline.pending)`. Every other `Figure` in the codebase uses `formatCount` — the locale-aware formatter with grouping separators. Added `formatCount` to the import.

4. `ConflictsView` — removed duplicate comment block. The comment "THE NARROWING, STATED UNDER THE HEADER" appeared twice consecutively; the first (shorter) copy was vestigial from an edit that extended it.

**Things already right, no change needed:**

- `HeadlineBar` is uniform across all 7 views — same height, same divide-x pattern. The earlier tab-switching reflow (#39) is fixed.
- Loading/pending states all share the same layout (`border-t border-line px-6 py-14`, breathe dot, 15px headline, 13px muted explanation). Consistent across Belief, Conflicts, Inbox, Project.
- Error states all use `EmptyState` with matching hierarchy.
- `EmptyState`, `RefreshButton`, `StatusDot`, `Footnote`, `LoadingRows` — shared primitives applied consistently. No view rolls its own version.
- `label` class applied correctly in BeliefView, ProjectView, ConflictsView.
- All fetched views clearly distinguish loading/failed/stale states via `FetchedBadge` — not collapsed into one appearance.

**Checks run:**
- `bun tsc --noEmit` — clean (before and after edits)
- `bun test` (mission-control suite) — 345 pass, 0 fail
- `node scripts/classify.mjs <changed paths>` — tier: lite

**Did not cover:** narrow-width rendering (screencapture blocked). Source analysis confirms no `sm:` / responsive breakpoints in `HeadlineBar` or table containers, which is consistent with the declared design approach (dense instrument, no responsive reflow). The table overflow behavior at narrow widths is unverified by eye.
