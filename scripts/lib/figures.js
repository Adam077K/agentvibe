'use strict';
// POSTURE: BLOCKS. `scripts/check-figures.mjs` is its entry point, it is step `check:figures` of
// `npm run check`, and `.github/workflows/ci.yml` runs it as its own step.
//
// scripts/lib/figures.js — documented figures, asserted against the values the suite already computes.
//
// ── WHY THIS EXISTS, AND WHY IT IS NOT A RECIPE RUNNER ───────────────────────────────────────
// This repo writes its numbers down: "44 steps", "43 of 43", "18 checks behind those 5 names".
// Ten of them were falsified at once on #102, and the same review found a `grep` recipe in
// docs/STATUS.md whose stated answer nobody re-derived. They are one class: NUMBERS ABOUT
// `ci.yml` AND `STEPS` THAT THE REPO ALREADY COMPUTES AND THEN RESTATES IN PROSE.
//
// The obvious cure — extract every fenced command from the docs and run it — was BUILT, and it
// destroyed its own 834-file fixture: it lifted a bulk-deletion command out of a documentation
// table, and `bfs`, which the harness shadows that command with, executed what the BSD original
// refuses. So this check EXECUTES NOTHING FROM THE CORPUS. It reads text, it calls functions
// already in this repo, and it compares two numbers. There is no destructive surface to get wrong.
//
// It also does not grep for the answer. `parseCiSteps()` and `/usr/bin/grep -c` agree at 44
// today — measured 2026-08-26, which is what makes the parser a drop-in rather than a second
// answer wearing the same name — but a parser cannot be shadowed the way that command was, and
// `node` is not wrapped. Where a parser exists, derive.
//
// ── FAIL CLOSED, AND IN WHICH DIRECTION ──────────────────────────────────────────────────────
// A documented figure with no assertion must be UNCHECKED, never falsely green. So:
//   • a locator that matches NOTHING is a finding, not a pass — the prose moved and this entry
//     silently stopped checking anything, which is the failure this check exists to prevent;
//   • a locator that matches MORE THAN ONCE is a finding — two candidates and no way to say
//     which one was checked is not an assertion;
//   • a derivation that cannot produce a finite number is a finding, never a skip.
// The one thing it cannot do is notice a figure nobody wired. That is stated in WHAT IT DOES NOT
// COVER below, and it is this check's whole maintenance cost: one registry entry per figure.
//
// ── WHAT IT DOES NOT COVER, STATED SO NOBODY OVER-READS A GREEN RUN ──────────────────────────
//   1. FIGURES NOBODY WIRED. There is no registry entry, so there is no check. `npm run
//      check:figures` prints how many it checked and in which files precisely so the coverage is
//      a number a reader can compare against the document, rather than an impression.
//   2. `gh`-DERIVED CLAIMS. Run counts, branch-protection state, "2 of 2 required status checks"
//      — the sandbox denies `~/.config/gh` by design, so nothing here can verify them. They carry
//      the `REPORTED` marker in the prose and stay outside this file.
//   3. HISTORICAL FIGURES, deliberately. `Superseded` blocks and `git show <sha>:…` pins are
//      correct AS HISTORY and must keep their old numbers. Markdown history lives in blockquotes
//      by this repo's convention, so blockquote lines are stripped before matching, and
//      `stripBlockquotes` is proved to actually remove something rather than being a comment.
//   4. WHETHER A FIGURE IS WORTH STATING, or whether the sentence around it is true. It checks a
//      number against a derivation. A true number inside a false sentence passes here — one was
//      found while this was being written, and it is in the session file rather than in this
//      comment, because a comment cannot go red.

const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

/**
 * The number a document states, whether it spelled it `44` or `Fourteen`.
 *
 * Returns null for anything else, and null is a FINDING upstream rather than a skip — a locator
 * that captured something unparseable has stopped asserting.
 */
function parseStated(text) {
  const raw = String(text).trim();
  if (/^\d+$/.test(raw)) return Number(raw);
  const word = NUMBER_WORDS[raw.toLowerCase()];
  return word === undefined ? null : word;
}

/**
 * Markdown with its history removed: every blockquote line goes.
 *
 * This repo keeps its wrong statements rather than deleting them, in a `> *Superseded …*` block
 * beside the correction. Those numbers are RIGHT as history — `30 of 30` is still the true figure
 * at `71fd58d` — so matching them would either fail the build for being accurate about the past
 * or, worse, satisfy a locator with the wrong sentence and report the live figure as checked when
 * it was not. docs/STATUS.md carries both spellings of `N of N · 0 failed`, one live and one
 * superseded, so this is load-bearing rather than defensive.
 *
 * Lines are replaced by an empty line rather than removed, so line numbers in findings still
 * point at the real file.
 */
function stripBlockquotes(text) {
  return String(text).split('\n').map((line) => (/^\s*>/.test(line) ? '' : line)).join('\n');
}

/**
 * Every figure this check knows how to derive, computed once from the three inputs.
 *
 * Pure over its arguments — no filesystem — so a test can drive it against MUTATED workflow text
 * and watch a documented figure go red from the CODE side, which is the half of non-vacuity that
 * editing a document cannot prove.
 */
function derive({ ci, pkg, suite }) {
  const steps = suite.parseCiSteps(ci);

  // `run != null`, NOT `run !== undefined`. parseCiSteps returns `{ run: null }` for a step that
  // carries no `run:` key at all, so `!== undefined` counts every step — 47 here — and hands back
  // a plausible number for a question whose answer is 44. Measured 2026-08-26; the 3 are the
  // `uses:` setup steps, and this exact confusion was nearly filed as a parser defect.
  const runSteps = steps.filter((s) => s.run != null);
  const guarded = runSteps.filter((s) => s.if === suite.CI_GUARD);
  const setupWithoutIf = steps.filter((s) => s.uses != null && s.if == null);

  const governed = Object.entries(pkg.scripts).filter(([name]) => suite.GOVERNED.test(name));
  const chains = governed.filter(([, body]) => String(body).includes('&&'));
  // A PURE delegation alias — every link is `npm run <name>` — is the only kind whose links this
  // repo can go and check by name. `check:citations` is an `&&` chain and is NOT one of these,
  // which is why the two counts below are 6 and 5 rather than one number used twice.
  const aliases = governed.filter(([, body]) => suite.aliasLinks(body) !== null);
  const linksOf = (name) => {
    const links = suite.aliasLinks(pkg.scripts[name]);
    return links ? links.length : NaN;
  };

  return {
    suiteSteps: suite.STEPS.length,
    ciRunSteps: runSteps.length,
    ciRunStepsLessOne: runSteps.length - 1,
    ciRunStepsPlusOne: runSteps.length + 1,
    ciGuardedSteps: guarded.length,
    ciSetupStepsWithoutIf: setupWithoutIf.length,
    governedChains: chains.length,
    governedChainsInSteps: chains.filter(([name]) => suite.STEPS.includes(name)).length,
    governedChainsExcluded: chains.filter(([name]) => name in suite.EXCLUDED).length,
    aliasCount: aliases.length,
    aliasLinkTotal: aliases.reduce((n, [name]) => n + linksOf(name), 0),
    dispatchAliasLinks: linksOf('check:dispatch'),
    warroomAliasLinks: linksOf('check:warroom'),
    ledgerAliasLinks: linksOf('check:ledger'),
  };
}

/**
 * The registry. One entry per documented figure; adding a figure to a document costs one line here.
 *
 * `locator` must carry at least one capture group, and EVERY group is compared against the same
 * derived value — that is what lets one entry cover `43 of 43` and `6 of 6` without pretending the
 * two halves are independent claims.
 *
 * `history: 'blockquote'` strips markdown history before matching. It is left off for YAML, where
 * the convention does not exist and superseded figures live in ordinary `#` comments — those are
 * kept out by writing locators that pin a whole sentence, and by the ambiguity rule that fails when
 * a locator turns out to match two of them.
 */
const FIGURES = [
  // ── docs/STATUS.md ─────────────────────────────────────────────────────────────────────────
  {
    id: 'status-ci-run-steps',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'ciRunSteps',
    what: 'ci.yml steps carrying a `run:`',
    locator: /now runs \*\*(\d+) steps in a single job/,
  },
  {
    id: 'status-ci-guarded-steps',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'ciGuardedSteps',
    what: 'ci.yml `run:` steps carrying the `!cancelled()` guard',
    locator: /and all (\d+) carry\s*\n?`if: \$\{\{ !cancelled\(\) \}\}`/,
  },
  {
    // The recipe the reviewer found unre-derived. Its stated answer is asserted; the command itself
    // is NEVER executed, which is the whole difference from the runner that was rejected.
    //
    // RE-AIMED 2026-08-26, when six merges landed. The recipe used to be two `grep -c` lines; `main`
    // replaced it with a `parseCiSteps` derivation — the same argument this file makes — and both
    // locators then reported `unmatched`. That is the fail-closed rule working, not a defect: the
    // prose moved and the check said the figure was now UNCHECKED rather than passing over it in
    // silence. Re-aimed, never deleted. The recipe now prints both numbers on one line and they stay
    // two entries: equal today, and not the same question.
    id: 'status-recipe-run-count',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'ciRunSteps',
    what: 'the first number the parseCiSteps recipe says it prints',
    locator: /^→ +(\d+) +\d+$/m,
  },
  {
    id: 'status-recipe-guard-count',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'ciGuardedSteps',
    what: 'the second number the parseCiSteps recipe says it prints',
    locator: /^→ +\d+ +(\d+)$/m,
  },
  {
    id: 'status-setup-steps',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'ciSetupStepsWithoutIf',
    what: 'ci.yml `uses:` setup steps carrying no `if:`',
    locator: /^(\w+) further `uses:` setup steps/m,
  },
  {
    // Found unwired while this check was being written, and it had ALREADY gone stale in the same
    // change: adding two steps moved it from 44 to 46 and nothing said so. Wired for that reason.
    // Its neighbour, "~45 red steps", was DELETED rather than wired — a tilde is a promise not to
    // be checked, and a figure that cannot be asserted should not be written as a number.
    id: 'status-empty-workspace-checks',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'ciRunSteps',
    what: 'checks that would run against an empty workspace if the setup steps were guarded',
    locator: /would run all (\d+) checks against an empty/,
  },
  {
    // `main` KEPT this figure and updated it to "~46 red steps" while this branch had DELETED it
    // for being unassertable. Wiring it is better than either side: guarding the setup steps would
    // run every check plus the failed checkout, so it is exactly `ciRunSteps + 1` and the tilde was
    // hedging an exact quantity. The hedge is gone and the number is checked.
    id: 'status-empty-workspace-red-steps',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'ciRunStepsPlusOne',
    what: 'red steps produced if the setup steps were guarded and checkout failed',
    locator: /workspace and produce (\d+) red steps instead of one/,
  },
  {
    id: 'status-governed-chains',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'governedChains',
    what: 'governed package.json scripts whose body contains `&&`',
    locator: /Derived here: (\d+)\s*\ngoverned `&&` chains/,
  },
  {
    id: 'status-chains-in-steps',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'governedChainsInSteps',
    what: 'those `&&` chains that are also suite STEPS',
    locator: /governed `&&` chains, (\d+) of them in `STEPS`/,
  },
  {
    id: 'status-chains-excluded',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'governedChainsExcluded',
    what: 'those `&&` chains carrying an EXCLUDED entry',
    locator: /(\d+) of (\d+) carrying an `EXCLUDED` entry/,
  },
  {
    id: 'status-steps-length-derivation',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'suiteSteps',
    what: 'STEPS.length, as the document tells the reader to derive it',
    locator: /\.STEPS\.length\)"` → \*\*(\d+)\*\*/,
  },
  {
    id: 'status-floor-tally',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'suiteSteps',
    what: 'the local floor tally, in the fenced block of §4',
    locator: /npm run check +→ +(\d+) of (\d+) passed/,
  },
  {
    // THE SAME FIGURE, STATED A SECOND TIME 230 LINES EARLIER — and this check reported green over
    // it for a whole PR. Found 2026-08-26 by reading the document during a merge resolution, not by
    // running anything, which is the limitation in the header made concrete: one figure, two
    // sentences, and the registry only knew about one of them. Wiring the second one is the entire
    // fix available, and it is why coverage is printed as a number rather than implied by a tick.
    id: 'status-floor-tally-summary',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'suiteSteps',
    what: 'the local floor tally, restated in the summary at the top of the file',
    locator: /local floor is GREEN — `(\d+) of (\d+) passed/,
  },
  {
    id: 'status-figure-is',
    file: 'docs/STATUS.md', history: 'blockquote', derive: 'suiteSteps',
    what: 'the pinned floor figure ("it is not 42 and it is not 44")',
    locator: /\*\*`(\d+) of (\d+) · 0 failed` is the figure\./,
  },

  // ── .github/workflows/ci.yml ───────────────────────────────────────────────────────────────
  {
    id: 'ci-sequential-checks',
    file: '.github/workflows/ci.yml', derive: 'ciRunSteps',
    what: 'ci.yml steps carrying a `run:`',
    locator: /This is one job of (\d+) sequential checks/,
  },
  {
    id: 'ci-other-checks-still-run',
    file: '.github/workflows/ci.yml', derive: 'ciRunStepsLessOne',
    what: 'the checks that still produce a result when one of them fails',
    locator: /the other (\d+) checks now produce a result instead of a skip/,
  },
  {
    id: 'ci-alias-link-total',
    file: '.github/workflows/ci.yml', derive: 'aliasLinkTotal',
    what: 'checks hidden behind the pure-delegation aliases',
    locator: /bodies chained\s*\n#\s*(\d+) checks behind those \d+ names/,
  },
  {
    id: 'ci-alias-count',
    file: '.github/workflows/ci.yml', derive: 'aliasCount',
    what: 'pure-delegation aliases in package.json',
    locator: /\d+ checks behind those (\d+) names/,
  },
  {
    id: 'ci-alias-links-now-steps',
    file: '.github/workflows/ci.yml', derive: 'aliasLinkTotal',
    what: 'those hidden checks, now steps of their own',
    locator: /They are (\d+) steps here/,
  },
  {
    id: 'ci-steps-behind-one-exit',
    file: '.github/workflows/ci.yml', derive: 'suiteSteps',
    what: 'STEPS.length — what `npm run check` as a ci.yml step would put behind one exit code',
    locator: /would put all (\d+) steps back behind one exit/,
  },
  {
    id: 'ci-guards-count',
    file: '.github/workflows/ci.yml', derive: 'ciGuardedSteps',
    what: 'ci.yml `if:` guards',
    locator: /the defect the (\d+) `if:` guards exist to remove/,
  },
  {
    id: 'ci-dispatch-alias-links',
    file: '.github/workflows/ci.yml', derive: 'dispatchAliasLinks',
    what: 'links of the `check:dispatch` alias',
    locator: /^\s*#\s*(\w+) steps, because `check:dispatch` chained them/m,
  },
  {
    id: 'ci-warroom-alias-links',
    file: '.github/workflows/ci.yml', derive: 'warroomAliasLinks',
    what: 'links of the `check:warroom` alias',
    locator: /^\s*#\s*(\w+) steps, because `check:warroom` chained them/m,
  },
  {
    id: 'ci-ledger-alias-links',
    file: '.github/workflows/ci.yml', derive: 'ledgerAliasLinks',
    what: 'links of the `check:ledger` alias',
    locator: /^\s*#\s*(\w+) steps, because `check:ledger` chained them/m,
  },
];

const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/**
 * Every disagreement between a stated figure and a derived one — plus every entry that has stopped
 * asserting anything at all.
 *
 * Pure over `files` (path → text) and `derived` (name → number). Nothing is read and nothing is run.
 */
function figureFindings({ files, derived, figures = FIGURES }) {
  if (!figures.length) {
    return [{ kind: 'empty-registry', message: 'the figure registry is empty, so a green run would mean nothing was checked' }];
  }
  const findings = [];

  for (const fig of figures) {
    const raw = files[fig.file];
    if (typeof raw !== 'string') {
      findings.push({ kind: 'missing-file', id: fig.id, file: fig.file, message: `${fig.file} was not supplied, so ${fig.id} checked nothing` });
      continue;
    }
    const text = fig.history === 'blockquote' ? stripBlockquotes(raw) : raw;

    const expected = derived[fig.derive];
    if (!Number.isFinite(expected)) {
      findings.push({ kind: 'underivable', id: fig.id, file: fig.file, message: `${fig.id} derives \`${fig.derive}\`, which is ${expected} rather than a number — it cannot assert anything` });
      continue;
    }

    const flags = fig.locator.flags.includes('g') ? fig.locator.flags : `${fig.locator.flags}g`;
    const matches = [...text.matchAll(new RegExp(fig.locator.source, flags))];
    if (matches.length === 0) {
      findings.push({ kind: 'unmatched', id: fig.id, file: fig.file, message: `${fig.id}: the locator matches nothing in ${fig.file}. The prose moved and this figure is now UNCHECKED — re-aim the locator, never delete it` });
      continue;
    }
    if (matches.length > 1) {
      const lines = matches.map((m) => lineOf(text, m.index));
      findings.push({ kind: 'ambiguous', id: fig.id, file: fig.file, lines, message: `${fig.id}: the locator matches ${matches.length} places in ${fig.file} (lines ${lines.join(', ')}); which one was checked is undefined, so none of them is` });
      continue;
    }

    const [match] = matches;
    const groups = match.slice(1);
    if (!groups.length) {
      findings.push({ kind: 'no-capture', id: fig.id, file: fig.file, message: `${fig.id}: the locator has no capture group, so it read no figure` });
      continue;
    }
    const line = lineOf(text, match.index);
    groups.forEach((groupText, i) => {
      const stated = parseStated(groupText);
      if (stated === null) {
        findings.push({ kind: 'unparseable', id: fig.id, file: fig.file, line, message: `${fig.file}:${line} — ${fig.id} captured "${groupText}", which is not a number this check can read` });
        return;
      }
      if (stated !== expected) {
        findings.push({
          kind: 'mismatch', id: fig.id, file: fig.file, line, stated, expected, derive: fig.derive, what: fig.what, group: i + 1,
          message: `${fig.file}:${line} — ${fig.id} states ${stated}, derived ${expected}  (${fig.what}; \`${fig.derive}\`)`,
        });
      }
    });
  }
  return findings;
}

module.exports = { FIGURES, NUMBER_WORDS, parseStated, stripBlockquotes, derive, figureFindings, lineOf };
