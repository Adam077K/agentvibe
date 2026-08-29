# Contrast — every pair, computed

> GENERATED — do not edit, run `npm run build:tokens`.
> Source: `design/tokens/seeds.json`. WCAG 2.x relative-luminance ratio, rounded to 3dp.

**Computed:** 2026-08-29

Every figure below is recomputed on every run. `mission-control/client/src/styles.css` records what happens otherwise: its contrast figures were "all re-measured on 2026-08-13 after review found every one of them wrong — by 0.06 to 0.3, in both directions". A generator cannot carry a figure forward.

**The AA and AAA columns apply to TEXT** (WCAG SC 1.4.3, 4.5:1 · SC 1.4.6, 7:1, normal weight). For a pair of surfaces the ratio is the wrong metric entirely — contrast ratio is defined for legibility, and comparing a 1px rule to a full-row fill is a category error. The `note` column says which kind each row is; read it before reading the verdict.

| fg | bg | fg hex | bg hex | ratio | AA | AAA | note |
|---|---|---|---|---|---|---|---|
| `text` | `ink` | `#e6e8ec` | `#0d0e11` | **15.734:1** | pass | pass | body copy |
| `muted` | `ink` | `#9aa1ad` | `#0d0e11` | **7.422:1** | pass | pass | secondary text |
| `dim` | `ink` | `#7b8494` | `#0d0e11` | **5.120:1** | pass | fail | column headers, footnotes, placeholders — the lowest-contrast thing allowed to carry meaning |
| `live` | `ink` | `#3fbf8f` | `#0d0e11` | **8.327:1** | pass | pass | status text, healthy |
| `warn` | `ink` | `#d9a441` | `#0d0e11` | **8.581:1** | pass | pass | status text, warning |
| `bad` | `ink` | `#e2727a` | `#0d0e11` | **6.362:1** | pass | fail | status text, failing |
| `text` | `raised` | `#e6e8ec` | `#1e222b` | **12.979:1** | pass | pass | input text on the raised surface |
| `muted` | `raised` | `#9aa1ad` | `#1e222b` | **6.123:1** | pass | fail | secondary text on the raised surface |
| `divider` | `ink` | `#5a6270` | `#0d0e11` | **3.139:1** | fail | fail | SURFACE PAIR — the one horizontal rule in the app. A ratio is the wrong metric for a rule; this row exists to show it is a line you can see |
| `line-strong` | `ink` | `#3d4451` | `#0d0e11` | **1.971:1** | fail | fail | SURFACE PAIR — borders and rules, never text |
| `line` | `ink` | `#2a2f39` | `#0d0e11` | **1.438:1** | fail | fail | SURFACE PAIR — hairline separators |
| `raised` | `ink` | `#1e222b` | `#0d0e11` | **1.212:1** | fail | fail | SURFACE PAIR — hover fill, never the sole carrier of anything |
| `row-alt` | `ink` | `#15171d` | `#0d0e11` | **1.077:1** | fail | fail | SURFACE PAIR — row banding. styles.css argues at length that ΔE76 (4.82) is the right metric here and the ratio is not |

13 pair(s) over 12 colour(s).
