// scripts/trust.ts — read and edit the trusted-projects list.
//
//   bun run trust list             what is trusted, what was discovered and is not
//   bun run trust add <path>       trust one project
//   bun run trust remove <path>    stop trusting one
//   bun run trust seed             write the list from what is discovered right now
//
// The file is plain text and hand-editable on purpose (see server/trust.ts for the format and
// for why it lives at ~/.warroom/trusted-projects). This exists so the common case — "why is
// this project excluded, and how do I include it" — is one command, and so `list` shows BOTH
// halves: what is trusted and what was discovered and is not. A tool that could only show the
// first half would answer "which projects do I have?" with the allowlist, which is the silent
// narrowing the allowlist itself is written to avoid.

import { discoverFleet } from '../server/projects.ts';
import { trustFilePath } from '../server/trust.ts';
import { addTrustedRoot, removeTrustedRoot, seedTrustList } from './trust-store.ts';

const [, , command, argument] = process.argv;
const file = trustFilePath();

function usage(): never {
  console.error('usage: bun run trust <list|add <path>|remove <path>|seed>');
  process.exit(2);
}

switch (command) {
  case 'list': {
    const { projects, trustList } = discoverFleet();
    console.log(`trust file: ${trustList.path}${trustList.present ? '' : '  (does not exist)'}`);
    if (!trustList.present) console.log(`  ${trustList.reason as string}`);
    for (const issue of trustList.issues) console.log(`  REFUSED ${issue}`);
    const trusted = projects.filter((p) => p.trust.trusted);
    const untrusted = projects.filter((p) => !p.trust.trusted);
    console.log(`\n${trusted.length} of ${projects.length} discovered projects are trusted:`);
    for (const p of trusted) console.log(`  ✓ ${p.root}`);
    if (untrusted.length > 0) {
      console.log(`\n${untrusted.length} discovered and NOT trusted — shown in the UI, with no program run for them:`);
      for (const p of untrusted) console.log(`  · ${p.root}`);
    }
    // Listed but not discovered: a path that was renamed, deleted or is outside the roots.
    // Reported because a trust line pointing at nothing is a decision that has quietly stopped
    // meaning anything, and nothing else would ever say so.
    const discoveredRoots = new Set(projects.map((p) => p.root));
    const orphans = trustList.roots.filter((r) => !discoveredRoots.has(r));
    if (orphans.length > 0) {
      console.log(`\n${orphans.length} trusted path${orphans.length === 1 ? '' : 's'} that discovery did not find (renamed, deleted, or outside MC_PROJECT_ROOTS):`);
      for (const r of orphans) console.log(`  ? ${r}`);
    }
    break;
  }
  case 'add': {
    if (!argument) usage();
    const result = addTrustedRoot(file, argument);
    console.log(result.added ? `added ${result.canonical} to ${result.path}` : `${result.canonical} was already trusted in ${result.path}`);
    break;
  }
  case 'remove': {
    if (!argument) usage();
    const result = removeTrustedRoot(file, argument);
    console.log(result.removed ? `removed ${result.canonical} from ${result.path}` : `${result.canonical} was not in ${result.path}`);
    break;
  }
  case 'seed': {
    const result = seedTrustList(file, discoverFleet().projects.map((p) => p.root));
    console.log(result.reason);
    break;
  }
  default:
    usage();
}
