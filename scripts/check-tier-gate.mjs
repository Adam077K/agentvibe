#!/usr/bin/env node
// POSTURE: BLOCKS in qa-lead-pass.yml. This script itself exits non-zero when the tier
// gate is not satisfied; it does not emit warnings and hope — it decides.
//
// scripts/check-tier-gate.mjs — enforce tier-floor requirements against session files.
//
// This is the single place where "floor=irreversible → session must declare
// tier: full|irreversible" is implemented. It replaced an identical check in
// qa-lead-pass.yml that triggered on the `risk:irreversible` label, and a label is a
// second statement of a fact `scripts/lib/classifier.js` already owns. Issue #78 showed
// why: the correct label changed mid-review when two `run:` steps raised the floor from
// `full` to `irreversible`, and a human applying it once up front cannot get that right.
//
// THE ONE RULE THIS ENFORCES
//
//   If the classifier floor is `irreversible`, at least one session file added or
//   modified in this PR must declare `tier: full` or `tier: irreversible`.
//
// A session file declaring a lower tier is fine — it describes different (lower-risk)
// work in the same PR. The requirement is that ONE session attests to the irreversible
// work being reviewed at that tier. See the comment in qa-lead-pass.yml's
// "Enforce tier" step for the reconciliation that made this "at least one" rather than "all".
//
// THE RULE THIS INTENTIONALLY DOES NOT ENFORCE
//
//   It never lowers a floor. Given floor=irreversible it will not pass a PR with only
//   tier:lite sessions. Given floor=full it is advisory only (mechanical enforcement is
//   Phase 6). Given floor=trivial|lite it exits 0 immediately. The tier order cannot
//   be reversed by anything the caller passes.
//
// USAGE
//
//   node scripts/check-tier-gate.mjs --floor irreversible --sessions path/a.md path/b.md
//   node scripts/check-tier-gate.mjs --floor full --sessions path/a.md
//   node scripts/check-tier-gate.mjs --floor trivial   # always exits 0
//
// LIBRARY
//
//   import { checkTierGate } from './scripts/check-tier-gate.mjs';
//   const result = checkTierGate('irreversible', ['docs/.../session.md']);
//   // result: { pass: boolean, reason: string, accepted?: string }

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The tiers in ascending severity order. The gate only raises, never lowers.
const TIER_RANK = { trivial: 0, lite: 1, full: 2, irreversible: 3 };
// Tiers accepted as satisfying an `irreversible` floor requirement.
const ACCEPTABLE_FOR_IRREVERSIBLE = new Set(['full', 'irreversible']);

/**
 * Parse the `tier:` value from a session file's YAML frontmatter.
 * Returns null when the file cannot be read or has no tier declaration.
 *
 * Matches the same pattern qa-lead-pass.yml uses:
 *   grep -iE 'tier:[[:space:]]+"?(full|irreversible)"?[[:space:]]*$'
 * but in JS, and for all tier values (not just the two the workflow cared about).
 */
function parseTier(filePath) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  // Frontmatter must start the file with ---
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const fm = text.slice(3, end);
  const m = fm.match(/^tier:\s*"?(\w+)"?\s*$/im);
  if (!m) return null;
  return m[1].toLowerCase();
}

/**
 * Check whether the tier gate is satisfied.
 *
 * @param {string} floor - The classifier floor tier ('trivial'|'lite'|'full'|'irreversible')
 * @param {string[]} sessionFiles - Paths to session files added/modified in this PR
 * @returns {{ pass: boolean, reason: string, accepted?: string }}
 */
export function checkTierGate(floor, sessionFiles) {
  // Validate the floor value — an unknown tier is a caller error, not a gate failure.
  if (!(floor in TIER_RANK)) {
    return { pass: false, reason: `Unknown floor tier: "${floor}". Expected one of: trivial, lite, full, irreversible.` };
  }

  // Tiers below `full` have no session-tier requirement.
  if (TIER_RANK[floor] < TIER_RANK['full']) {
    return { pass: true, reason: `Floor is "${floor}" — no session-tier requirement applies.` };
  }

  // `full` is advisory (Phase 6 will enforce it mechanically). Report but do not block.
  if (floor === 'full') {
    return { pass: true, reason: 'Floor is "full" — session-tier check is advisory only (Phase 6 enforcement).' };
  }

  // `irreversible` — at least one session must declare tier: full|irreversible.
  //
  // This is the constraint the issue states must never be lowerable: no combination
  // of caller arguments can make this branch exit pass=true when no session file
  // declares an acceptable tier. A PR with floor=irreversible and only tier:lite
  // sessions is BLOCKED, even if the caller passes many sessions.
  if (floor === 'irreversible') {
    if (sessionFiles.length === 0) {
      return {
        pass: false,
        reason: 'Floor is "irreversible" but no session files were provided. At least one session must declare tier: full or tier: irreversible.',
      };
    }

    for (const f of sessionFiles) {
      const tier = parseTier(f);
      if (tier && ACCEPTABLE_FOR_IRREVERSIBLE.has(tier)) {
        return { pass: true, reason: `Floor "irreversible" satisfied by ${f} (tier: ${tier}).`, accepted: f };
      }
    }

    // Build a diagnostic list of what was found.
    const found = sessionFiles.map((f) => {
      const t = parseTier(f);
      return `  ${f}: tier=${t ?? '(none or unreadable)'}`;
    }).join('\n');

    return {
      pass: false,
      reason: [
        'Floor is "irreversible" and NONE of the session files declares tier: full or tier: irreversible.',
        'At least one session must attest that the irreversible work was reviewed at that tier.',
        'Session files describing lower-tier work keep their own honest tier.',
        '',
        'Session files checked:',
        found,
      ].join('\n'),
    };
  }

  // Should be unreachable given the TIER_RANK check above, but be defensive.
  return { pass: false, reason: `Unhandled floor tier: "${floor}".` };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write([
      'Usage: node scripts/check-tier-gate.mjs --floor <tier> [--sessions <file...>]',
      '',
      'Exits 0 if the tier gate is satisfied, 1 if blocked, 2 on usage error.',
      '',
      'Options:',
      '  --floor <tier>        Required. The classifier floor tier.',
      '  --sessions <file...>  Session file paths to check (one or more).',
      '',
    ].join('\n'));
    return;
  }

  const floorIdx = argv.indexOf('--floor');
  if (floorIdx === -1 || !argv[floorIdx + 1]) {
    process.stderr.write('check-tier-gate: --floor <tier> is required\n');
    process.exit(2);
  }
  const floor = argv[floorIdx + 1];

  // Collect everything after --sessions until the next flag (or end).
  const sessions = [];
  const sessIdx = argv.indexOf('--sessions');
  if (sessIdx !== -1) {
    for (let i = sessIdx + 1; i < argv.length; i++) {
      if (argv[i].startsWith('--')) break;
      sessions.push(argv[i]);
    }
  }

  const result = checkTierGate(floor, sessions);

  if (result.pass) {
    process.stdout.write(`PASS: ${result.reason}\n`);
    process.exit(0);
  } else {
    process.stderr.write(`BLOCKED: ${result.reason}\n`);
    process.exit(1);
  }
}

// Run main only when invoked directly, not when imported as a library.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main();
}
