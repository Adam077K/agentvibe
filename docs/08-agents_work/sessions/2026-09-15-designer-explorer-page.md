---
date: 2026-09-15
engine: designer
lane: explorer-page
branch: docs/vision-explorer-page
task: The Company Engine Explorer page
qa_verdict: PASS
tier: trivial
---
Built docs/vision-system/planning/site/explorer/ (index.html + app.css + app.js, 69 KB) over the 28 committed data files, each fetched lazily with a per-panel loading state; tokens copied verbatim from the founder page.
Hash routes reach every registry: component, layer, record (lifecycle edges clickable to the guard predicate), predicate, command, value, primitive, control contract, endpoint, subject binding, pin, class map, capability, source-question, stage, decision, question, risk, attack, adapter, profile, review, finding, coverage, chapter, status.
Hand-drawn SVG only: system map over the 14 declared flows, the L1-L5 precedence ladder, per-record lifecycle state diagrams, the B00-B11 build DAG.
Looked at the rendered page at 1440 px, at 400 px and in dark theme: home map, a record lifecycle (edge click opened the guard meaning), the build DAG, a chapter section, search (60 hits). Zero page errors; zero horizontal overflow at 400 px.
Fixed two defects found by looking: mojibake where no charset header is set (the script is pure ASCII now) and chips overflowing the detail panel.
Local HTTP serving is refused by the armed sandbox (socket.bind: Operation not permitted), so the folder was served to Chromium through Playwright request interception.
