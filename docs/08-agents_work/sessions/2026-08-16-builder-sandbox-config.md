---
date: 2026-08-16
role: builder
task: sandbox-config-unarmed
branch: feat/sandbox-config-unarmed
qa_verdict: PASS
tier: irreversible
---

Built the OS sandbox configuration for this repo — built, not armed, per Founder standing instruction.

- Added `sandbox` block to `.claude/settings.json` with `enabled: false`; block contains `denyRead` for credential paths (`~/.ssh`, `~/.aws`, `~/.config/gh`, `~/.netrc`, `**/.env`, `**/.env.*`) and `allowWrite: ["~/.agentvibe"]` justified from `scripts/lib/usage.js`
- Created `scripts/sandbox-config.test.mjs` (7 assertions); test fails if `enabled` is `true` — guards against accidental arming; wired to `npm run test:sandbox` in `package.json` and the `ci.yml` `Sandbox config unarmed` step
- Created `docs/03-system-design/SANDBOX.md` recording all keys, path-rule precedence, the two research findings (fail-open default, `dangerouslyDisableSandbox` escape hatch), scope correction (Bash sandbox only, not session-wide), write-path justification table, and the arming procedure
- Regenerated `CODEBASE-MAP.md` to include new files
- Did not add `network.allowedDomains` — requires Founder input as stated in brief
- Tier is `irreversible` because `.claude/settings.json` is `irreversible`; `ci.yml` is also `irreversible` and was touched to add the CI step
