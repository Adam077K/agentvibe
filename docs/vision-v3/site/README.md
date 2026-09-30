# v3 Explorer

A single-page explorer for `docs/vision-v3/`, built from `template.html` by `build.js`. It keeps the v2
explorer's design (same tokens, fonts, rail/canvas/TOC layout) and adds four views: Overview, Rounds,
Diagrams and Wireframes.

## Rebuild

```bash
node docs/vision-v3/site/build.js "$PWD" docs/vision-v3/site $(git rev-parse --short HEAD)
```

This writes `docs/vision-v3/site/index.html` (gitignored) and prints the doc, mermaid and wireframe counts.
Docs are discovered by glob, so new files show up on the next build with no code change:

| Group | Files |
|---|---|
| The v3 package | `docs/vision-v3/0*.md`, `1*.md` (`00-CANON`, `01`…`17`, `09a`/`09b`), natural sort, except `00-FOUNDER-DIRECTION.md` |
| How it was made | `00-FOUNDER-DIRECTION.md`, `r0-outward/`, `r1-concepts/`, `r2-seats/`, `_process/R2-CHALLENGES.md`, `r3-stretch/`, `r4-spikes/*.md` |
| Engineering inputs | `engineering/*.md` |

Titles come from each file's first `# ` heading. A filename containing `codex` is labelled Codex; everything
else is labelled Claude. Rounds come from the folder (`rN-…` → RN; package and engineering → R5).

## Republish

Publish `docs/vision-v3/site/index.html` as an Artifact. On a later rebuild, republish the same file to the
same URL. The file has no doctype/html/head/body tags because the publisher adds them.

## Things to know

- **Mermaid.** The Diagrams gallery is written into the page as static `<pre class="mermaid">` blocks so
  that the host's native mermaid rendering sees them when the page loads. The gallery is laid out
  off-screen, not `display:none`, so diagrams render at real sizes before anyone opens the view. Mermaid
  blocks inside the doc reader are inserted after load. If `window.mermaid` exists, the page calls
  `mermaid.run` on them. If the host renders only at load time, those blocks show as source text and the
  Diagrams view still shows them rendered. The page does not load its own mermaid library.
- **Wireframes** are fenced blocks that contain a box-drawing corner, at least three box-drawing
  characters, or `wireframe` in the fence info string. Mermaid blocks are excluded.
- **Deep links** are bare hash tokens only: `#home`, `#rounds`, `#diagrams`, `#wireframes`, or a doc id
  (the lowercased filename without `.md`, for example `#s07-surfaces-voice`).
- **Embedded data** is JSON with every `<` escaped as `<`, so no `</script` inside a doc can end the
  data block.
- The only external script is `marked` 12.0.2 from cdnjs. Fonts come from Google Fonts. The theme choice
  is kept in `localStorage` under `v3x-theme`, wrapped in try/catch.

Published at https://claude.ai/artifact/Lw6qgjWGAAz6YgV7t1JAoD (private).
