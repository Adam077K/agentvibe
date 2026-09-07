---
date: 2026-09-07
role: builder
task: hook-separator-bypass
qa_verdict: PASS
tier: irreversible
branch: fix/hook-separator-bypass
pushed: false
---
Three fix commits, one class of defect three times: **a rule that enumerates spellings, or computes its anchor over the whole command instead of the one command it governs.**
**`3b5ce7e` — the separator bypass.** Five rules matched `<trigger>[^|;]*<payload>`; that class cannot span a semicolon *inside a quoted string*. `node -e "const fs = require('fs'); fs.rmSync(…)"` exit 0, the direct form exit 2. `segment_command` splits once on `;`/`|` outside quotes and outside a backslash escape; `seg_match` applies each rule per segment. Not widened to `.*` — that refuses `node --version; echo rmSync`. 10 red / 0 after, 20 controls identical in both cells.
**`8b584d3` — `rm -rf` inverted.** `rm -rf ~` exit 2 but `rm -rf $HOME` exit 0. Refused now unless every target is shown strictly inside the project root or scratchpad; `$VAR`, `$(…)`, backtick, `~` are unresolvable. One character of the old rule changed — `\/[^a-zA-Z]?` → `\/([^a-zA-Z]|$)` — whose optional class refused *every* absolute path and would have left the new allowlist's absolute branch untestable. 14 red / 0 after, two of them pre-existing FALSE POSITIVES fixed.
**`354b925` — the remaining eleven.** The browser guard's URL canonicalisation moved into `url_class`; the curl rule now asks the *same* parser per URL instead of grepping the whole command for the word `localhost`. One parser, two opposite policies. Closed: localhost-in-a-filename, loopback-then-external, IMDS in decimal, the LAN, `FOO=1 npx`, `bash -c 'npx'`, `chmod a+x`, `npm install --global`, `git checkout --`. **And the three false positives, which are half the deliverable** — `git reset --hard HEAD && npm test` and two more. 21 red / 0 after.
**Every instrument failure this session was caught by a control, not by reading.** The curl refactor's first splice left the original `case` block below the new one and refused every browser navigation; 30 SSRF tests found it. A wrong measurement of mine — claiming `rm -rf /opt/data` was allowed pre-change — was caught by a control run and is kept in the source as a correction, because it would have aimed the fix at "paths the list forgot".
**Costs, measured and pinned as tests, never assumed.** Five `$VAR` cleanup shapes newly refused (`$TMPDIR/x` will bite; the refusal message names the literal scratchpad path). A blanket glob refusal was implemented, measured, then narrowed — `rm -rf build/*` is ordinary cleanup. The curl rule is bounded at 12 URLs and refuses past it rather than checking some.
**Suite 46 of 48** — `test:ledger`/`check:ledger-lint`, 19 prose citations under `final-v2/`, id set `diff`-identical with and without this branch. Hook tests **287 pass · 0 fail**; 21, 20 then 21 red against each pre-fix hook; no pre-existing test ever moved. Latency 136 ms worst case against a 200 ms budget.
**Reported, not fixed:** `curl example.com` with no scheme still reaches the network — same family, but closing it needs a decision about whether curl gets its own allowlist. **Heredoc:** no heredoc rule exists to loosen; every Bash rule reads the body as command text. This branch widens that by one shape, pinned `[C2b]`. It refused three of my own commands, which went through files.
Standing caveat: author-recorded, one agent, one model family; `irreversible` asks 2-of-3 multi-judge and ≥2 families, unmet. Unpushed, unmerged, for founder sign-off.
