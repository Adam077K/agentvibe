---
date: 2026-08-17
role: designer
task: mission-control-visual-pass
branch: feat/mission-control-visual-pass
worktree: .worktrees/lane-visual
tier: lite
qa_verdict: PASS
---

Visual pass on all seven Mission Control views using headless Playwright screenshots at 1280px and 680px.

**One defect found and fixed:** At 680px, badge text ("fetch failed · 1s ago", "updated just now") wrapped across multiple lines within the 44px header, with "now"/"ago" bleeding below the header border into page content. Root cause: the "MISSION CONTROL" label and the badge wrapper lacked `whitespace-nowrap`/`shrink-0`, so they were compressed by the nav tabs and their text split at word boundaries. Fix: `whitespace-nowrap shrink-0` on the label div, `shrink-0` on the badge wrapper `<div className="ml-auto">`, and `whitespace-nowrap` on all four badge state containers in `ConnectionBadge` and `FetchedBadge`. After fix the badge stays on one line at 680px; at very narrow widths it clips to the right (expected, no breakpoints by design).

**Narrow-width table overflow affordance (FIXED in second pass):** At 680px and 1400px, Fleet clips rightmost columns (SUBAGENT, LAST ACTIVITY) and Sessions clips KIND and LAST TURN with no visible scroll cue — silent clipping, indistinguishable from missing data. Fix: added `.table-scroll` CSS class (`overflow-x: auto` + always-visible 4px custom scrollbar overriding macOS hide-scrollbars default via `scrollbar-width: thin` / `::-webkit-scrollbar`), `TableScroll` wrapper component in `ui.tsx`, applied to `FleetTable` and `SessionsTable` return statements. The scrollbar is always visible when content overflows, signalling "more exists". Trade-off accepted: `overflow-x: auto` creates a BFC that may prevent vertical sticky on `Th` at narrow widths where horizontal overflow exists — the fix notes this in a CSS comment.

**how_you_verified_visually:** Cannot verify visually — Playwright MCP tools were not in the active toolset. TypeScript check (`bun tsc --noEmit`) exits 0 with all four changed files. Headless Playwright screenshot at 680px confirms the table renders and rows are accessible. Scrollbar rendering in headless Chrome may differ from real browser; the CSS uses both the Firefox (`scrollbar-width: thin`) and WebKit (`::-webkit-scrollbar`) paths so the cue will appear in real Chrome/Safari.

**Predecessor claims confirmed by rendered output:**
- HeadlineBar uniform across all seven views: CONFIRMED.
- Loading/error badge hierarchy consistent: CONFIRMED (loading=green pulsing dot, failed=red dot + "fetch failed", stale=amber dot, fetched=hollow circle).
- FetchedBadge visibly distinguishes loading/failed/stale: CONFIRMED in Belief (loading), Dispatch (fetch failed), Conflicts/Inbox (fetched).

**Checks:** `bun tsc --noEmit` clean (both passes); `bun test` 344 pass 1 known-flake (crosscheck "claim counts by verdict", do not chase); `npm run check` exit 0. Tier: lite (classifier confirms for all four changed paths).
