/**
 * warroom-template-guard.test.mjs — the template must not regain an unreviewed-merge route.
 *
 * POSTURE: BLOCKS. Wired into `check:warroom`.
 *
 * war-room/bin/PROJECT_NAME.tmpl is a separate GENERATION of the launcher from bin/warroom, not a
 * drifted copy of it — see the comment above cmd_merge in the template for why byte-parity cannot
 * be asserted here: BIN_DIR resolves to $HOME/bin (not the project directory the template runs
 * against), so bin/warroom's verdict gate would resolve scripts/verdict.mjs against the wrong
 * tree, and bin/install-war-room.sh does not ship scripts/lib/classifier.js, which verdict.mjs
 * requires. Porting the gate is P1's "one launcher generation," not this fix.
 *
 * What CAN be asserted, and is asserted here, is the property that must hold regardless of
 * generation: no merge route commits model output into main without a human reviewing it first.
 *
 * Before this test existed, `check:warroom` ran four commands and none of them read the template
 * at all — bin/warroom's tier 3 ("AI-assisted merge": pipe a conflicted file to `claude --print`,
 * write its stdout back, commit, delete the branch, log it merge_complete) was closed on its own
 * branch while war-room/bin/PROJECT_NAME.tmpl carried the identical route into every project the
 * installer generates. This test is the mechanism that stops that regressing silently a second
 * time — it fails on the pre-fix template and passes on the current one (both directions verified
 * by hand while writing it; see the session file for the transcript).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = path.join(REPO, 'war-room', 'bin', 'PROJECT_NAME.tmpl');

const src = fs.readFileSync(TEMPLATE, 'utf8');

test('template carries no model-invocation merge route', () => {
  assert.doesNotMatch(
    src,
    /claude\s+--print/,
    'the template must not pipe a conflicted file to a model and write its stdout back over ' +
      'the file — that is the unreviewed-merge route this check exists to catch. See bin/warroom ' +
      "cmd_merge (branch feat/gate-and-provenance-v2) for why: a conflict resolution is content " +
      'no diff any review ever covered.'
  );
});

test('template does not put a merge strategy in a field named tier', () => {
  // "tier" is a RISK classification (trivial/lite/full/irreversible, from scripts/classify.mjs).
  // "strategy" is HOW the merge was performed (fast-forward/auto-merge/ai-assisted/none). The two
  // were conflated in the original template — every merge_complete/merge_refused event wrote a
  // strategy value into a field named tier — so anything reading events.jsonl for risk data got a
  // value the classifier can never produce.
  assert.doesNotMatch(
    src,
    /tier=(fast-forward|auto-merge|ai-assisted)/,
    'a merge strategy must never be logged in a field named tier — use strategy= instead'
  );
});

test('a merge that cannot apply cleanly is refused, explained, and left for a human', () => {
  assert.match(
    src,
    /merge_refused/,
    'cmd_merge must log a refusal (merge_refused) when tiers 1-2 (fast-forward, no-ff auto-merge) ' +
      'cannot apply the branch cleanly, rather than falling through to an unreviewed resolution'
  );
  assert.match(
    src,
    /Refusing to merge/,
    'the refusal must be explained to the operator on stdout, not silent'
  );
  assert.match(
    src,
    /git switch \$branch/,
    'the refusal must point the operator at resolving on the branch — the conflict must be left ' +
      'for a human, not dropped'
  );
});
