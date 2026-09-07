---
date: 2026-09-07
role: builder
task: hook-separator-bypass
qa_verdict: PASS
tier: irreversible
branch: fix/hook-separator-bypass
pushed: false
---
Two commits, one class of defect twice: **an enumeration of spellings, defeated by the conventional spelling.**
**`3b5ce7e` — the separator bypass.** Five rules matched `<trigger>[^|;]*<payload>`, and that class cannot span a semicolon *inside a quoted string*. `node -e "require('fs').rmSync(…)"` blocked; `node -e "const fs = require('fs'); fs.rmSync(…)"` exit 0. Fix: `segment_command` splits once on `;`/`|` outside quotes and outside a backslash escape; `seg_match` runs each rule per segment. Not widened to `.*` — that refuses `node --version; echo rmSync`. Free second close: `^`/`$` are per-segment, so `git checkout .; ls` is refused. 10 red before / 0 after, 20 negative controls identical in both cells.
**`8b584d3` — `rm -rf` inverted.** `rm -rf ~` exit 2 but `rm -rf $HOME` exit 0, same directory. The list is not extended, it is inverted: `rm` with both `-r` and `-f` is refused unless every target is shown strictly inside the project root or scratchpad; `$VAR`, `$(…)`, backtick and `~` are unresolvable and refused. One character of the old rule changed — `\/[^a-zA-Z]?` → `\/([^a-zA-Z]|$)`, whose optional class refused *every* absolute path and would have made the new allowlist's absolute branch unobservable. 14 red before / 0 after; two of those were pre-existing FALSE POSITIVES fixed (`$PROJECT_ROOT/build`, the scratchpad). Also closed: `rm --recursive --force /etc` and `find … | xargs rm -rf`.
**A wrong measurement was caught before it shipped and is kept as a correction in the source:** the fix was first written claiming `rm -rf /opt/data` was ALLOWED. It was not (exit 2) — that same optional class. The real hole is expanded/relative forms, not paths the list forgot.
**Cost, measured on 14 realistic cleanup shapes, pinned as tests.** Five newly refused, all unresolvable expansions; `$TMPDIR/x` is the one that will bite and the literal scratchpad path is allowed. A blanket glob refusal was implemented, measured, then **narrowed on purpose** — it refused `rm -rf build/*`, and a control people route around is worse than no control.
**Suite: 46 of 48**, both failures `test:ledger`/`check:ledger-lint` — 19 prose citations under `final-v2/`, identical id set with and without this change (`diff` clean), not from these files. Hook tests 245 pass · 0 fail; 21 then 20 red against the respective pre-fix hooks; no pre-existing test moved. Latency 111.8 ms worst case against a 200 ms budget.
**Reported, not fixed — 12 pre-existing gaps** of the same class, byte-identical before/after: the `curl` localhost exclusion is whole-command (`-o /tmp/localhost.txt` → exit 0); `npx` behind `FOO=1` or `bash -c`; `chmod a+x`; `npm install --global`. None needs a shell parser; one follow-up closes them.
**Heredoc, named not loosened:** no heredoc rule exists — the hook has no shell parser, so every Bash rule reads the body as command text. This change widens it by one shape, pinned as `[C2b]`. It refused two of my own commit messages, which went through a file.
Standing caveat: author-recorded, one agent, one model family; `irreversible` asks 2-of-3 multi-judge and ≥2 families, unmet. Unpushed, unmerged, for founder sign-off.
