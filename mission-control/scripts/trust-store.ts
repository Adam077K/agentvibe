// scripts/trust-store.ts — the WRITING half of the trusted-projects list.
//
// SEPARATE FROM server/trust.ts, AND THE SEPARATION IS THE POINT. Mission Control's server
// mutates no disk — test/crosscheck.test.ts greps every file under server/** for a write call
// site and fails on one. That invariant is real and this feature does not get to erode it, so
// nothing the server process runs writes this file: seeding, adding and removing are things a
// USER does, with `bun run trust`, and they live out here where the server never reaches them.
//
// That also makes the trust decision an act rather than a side effect. A list seeded silently
// at first boot would trust nineteen directories on the user's behalf without their having
// been asked, and the one thing a trust list must not do is decide trust quietly.
//
// See server/trust.ts for the format, the location and the three RCEs behind all of it.

import fs from 'node:fs';
import path from 'node:path';
import { canonicalRoot, readTrustList } from '../server/trust.ts';


export interface SeedResult {
  path: string;
  /** False when the file already existed — seeding NEVER overwrites an existing decision. */
  written: boolean;
  count: number;
  reason: string;
}

/**
 * The header written above the seeded list. Kept as a function of the roots it seeded so the
 * file states what it did, including the part that is uncomfortable.
 */
export function seedFileContents(roots: string[], now: Date): string {
  const stamp = now.toISOString().slice(0, 10);
  return [
    '# Mission Control — trusted project roots.',
    '#',
    '# Listing a directory here says: Mission Control may RUN PROGRAMS for this project.',
    '# That means git executing with this repository\'s own .git/config in force (where',
    '# core.fsmonitor names a program git runs), and node executing this project\'s own',
    '# scripts/ledger.mjs. A line here is a statement that you wrote or audited that code',
    '# and accept it running as you.',
    '#',
    '# One absolute path per line. "#" starts a comment. No globs and no prefixes — a prefix',
    '# rule would say "everything under ~/VibeCoding is trusted", which is the assumption',
    '# this file exists to replace.',
    '#',
    '# A project that is NOT listed is still discovered and still shown. It renders with the',
    '# reason it was excluded, next to the figures that did not need a subprocess. It never',
    '# disappears — a security control that hides data silently is a worse defect than the',
    '# one it closes.',
    '#',
    '#   bun run trust list            what is trusted, and what was discovered and is not',
    '#   bun run trust add <path>      add one project',
    '#   bun run trust remove <path>   remove one',
    '#',
    `# SEEDED ${stamp} FROM THE ${roots.length} PROJECT${roots.length === 1 ? '' : 'S'} DISCOVERED ON THIS MACHINE AT THAT MOMENT.`,
    '# Read that plainly: the seed trusted whatever was already on disk, and checked nothing.',
    '# If a repository you did not write was already here, it is on this list. What the list',
    '# buys from now on is that every project appearing AFTER this line is a decision — which',
    '# is when a clone you did not audit actually arrives. Read the paths below once.',
    '',
    ...roots,
    '',
  ].join('\n');
}

/**
 * Writes the list, seeded from the roots given. NEVER overwrites: an existing file is a
 * decision the user has already made (possibly by deleting lines), and a "seed" that silently
 * re-trusts what they removed would be the control quietly undoing itself.
 */
export function seedTrustList(file: string, roots: string[], now: Date = new Date()): SeedResult {
  if (fs.existsSync(file)) {
    const list = readTrustList(file);
    return {
      path: file,
      written: false,
      count: list.roots.length,
      reason: `${file} already exists and holds ${list.roots.length} trusted project${list.roots.length === 1 ? '' : 's'} — left untouched. Seeding never overwrites: an existing list is a decision, including the lines somebody deleted from it.`,
    };
  }
  const canonical = [...new Set(roots.map(canonicalRoot))].sort();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, seedFileContents(canonical, now), { mode: 0o600 });
  return {
    path: file,
    written: true,
    count: canonical.length,
    reason: `Seeded ${file} with the ${canonical.length} project${canonical.length === 1 ? '' : 's'} discovered on this machine. Everything discovered after this is excluded until it is added.`,
  };
}

/**
 * Adds one root, preserving the file's comments. Returns false when it was already there.
 * Creates the file if it does not exist — with the same header, seeded from just this path,
 * so `trust add` on a fresh machine does not silently produce a headerless file.
 */
export function addTrustedRoot(file: string, root: string, now: Date = new Date()): { added: boolean; path: string; canonical: string } {
  const canonical = canonicalRoot(root);
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, seedFileContents([canonical], now), { mode: 0o600 });
    return { added: true, path: file, canonical };
  }
  const list = readTrustList(file);
  if (list.roots.includes(canonical)) return { added: false, path: file, canonical };
  const existing = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, existing.endsWith('\n') ? `${existing}${canonical}\n` : `${existing}\n${canonical}\n`);
  return { added: true, path: file, canonical };
}

/**
 * Removes one root. Comments are preserved; only lines whose path canonicalises to the target
 * are dropped, so a comment mentioning the path survives.
 */
export function removeTrustedRoot(file: string, root: string): { removed: boolean; path: string; canonical: string } {
  const canonical = canonicalRoot(root);
  if (!fs.existsSync(file)) return { removed: false, path: file, canonical };
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let removed = false;
  const kept = lines.filter((raw) => {
    const line = raw.split('#')[0]?.trim() ?? '';
    if (!line) return true;
    if (canonicalRoot(line) !== canonical) return true;
    removed = true;
    return false;
  });
  if (removed) fs.writeFileSync(file, kept.join('\n'));
  return { removed, path: file, canonical };
}
