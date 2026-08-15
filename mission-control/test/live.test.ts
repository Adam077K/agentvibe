// test/live.test.ts — the routes the views read from, against the REAL roots on this
// machine.
//
// The gate is test/gate.ts, shared with test/views.test.tsx so there is ONE implementation of
// "can this machine answer" — read its header for the rule and for the three separate live
// failures that produced it. In short: it fires only when the corpus, resolved the way the
// code under test resolves it, holds no transcripts. Once it does, everything else —
// including discovery returning zero projects — is a RESULT and gets asserted, not excused.
//
// "Cold" below means a cold INDEX. It used to add "not a cold page cache: nothing here can
// evict the OS's file cache, so the figure is what a daemon restart costs, not what a machine
// reboot costs" — AND THAT WAS AN UNMEASURED CLAIM THAT TURNED OUT TO BE FALSE. The corpus is
// 3.03 GB on a 16 GiB machine, so its residency is very much in play: evicting 8 GB of
// unrelated page cache with a pure reader moved this figure 2,154 -> 4,406 ms, and across 30
// consecutive builds it tracked OS memory reclaim at r = 0.915. The index is cold by
// construction; the page cache is whatever the machine happens to be doing. See the header on
// the cold-start test below for the full #50 result.

import { describe, test, expect } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Hono } from 'hono';
import { LiveState } from '../server/state.ts';
import { createApi } from '../server/routes/api.ts';
import type { FleetSummary } from '../server/collectors/fleet.ts';
import type { SessionsSlice } from '../server/state.ts';
import { discoverProjects } from '../server/projects.ts';
import { listTranscripts, projectsDir } from '../server/lib/usage.ts';
import { machineGate, notVerified, corpusPresent, claudeProjectsRoot } from './gate.ts';

function liveApp(): Hono {
  const app = new Hono();
  app.route('/api', createApi(new LiveState()));
  return app;
}

/**
 * Best-effort throughout: `vm_stat` is macOS-only, and diagnosing a timing failure must never
 * turn into a crash that hides the timing failure.
 */
type MachineState = Record<string, number> | null;

/** One `vm_stat` reading in pages-converted-to-MB and raw event counters. Null off macOS. */
function readMachineState(): MachineState {
  try {
    const out = execFileSync('vm_stat', { encoding: 'utf8' });
    const page = Number(/page size of (\d+)/.exec(out)?.[1] ?? 16384);
    const g = (label: string) => Number(new RegExp(`${label}:\\s+(\\d+)\\.`).exec(out)?.[1] ?? 0);
    return {
      freeMB: Math.round((g('Pages free') * page) / 1e6),
      inactiveMB: Math.round((g('Pages inactive') * page) / 1e6),
      compressorMB: Math.round((g('Pages occupied by compressor') * page) / 1e6),
      swapouts: g('Swapouts'),
      swapins: g('Swapins'),
      pageins: g('Pageins'),
      compressions: g('Compressions'),
      decompressions: g('Decompressions'),
    };
  } catch {
    return null; // not macOS, or vm_stat missing
  }
}

/**
 * The machine's memory state around the build that just failed.
 *
 * DELTAS, NOT LIFETIME TOTALS, and the first version of this got that wrong in a way that made
 * it useless: `vm_stat`'s swapouts/pageins/compressions are cumulative since boot, so it
 * printed `swapouts 7223112` — a number that says nothing whatever about the five seconds under
 * investigation. Caught by running the mutation that forces this branch (N6) and reading what
 * it actually printed. The counters that discriminated in #50 were always deltas: runs with
 * <10k pageins DURING THE BUILD had a median of 2,130 ms, runs with >20k had 3,534 ms, while
 * load average moved 3.10 -> 3.27. Absolute free/compressor are still worth printing because
 * those are levels, not counters.
 *
 * Why print any of it: #50 cost a full investigation to establish that this figure tracks OS
 * memory reclaim rather than CPU load — r(ms, pageins) = 0.915, 0.864 with load partialled out.
 * The point is that the NEXT occurrence answers the question instead of costing another one.
 * Swapouts especially: 12,610 ms was recorded once and could never be reproduced — it needs
 * ~0.24 GB/s, 2.5x worse than anything reachable by evicting cache, and ZERO swapouts were seen
 * across 30+ instrumented builds. Swap is the live hypothesis and this delta is how it gets
 * confirmed or killed.
 */
function machineStateReport(before: MachineState, after: MachineState): string {
  let vm = '    vm_stat unavailable on this platform';
  if (before && after) {
    const d = (k: string) => after[k]! - before[k]!;
    vm =
      `    levels now: free ${after.freeMB}MB · inactive ${after.inactiveMB}MB · compressor ${after.compressorMB}MB\n` +
      `    DURING THIS BUILD: pageins +${d('pageins')} · swapouts +${d('swapouts')} · swapins +${d('swapins')} · ` +
      `compressions +${d('compressions')} · decompressions +${d('decompressions')}\n` +
      '    (#50 reference: <10k pageins => ~2,130ms median, >20k => ~3,534ms; swapouts were never once observed)';
  }
  return `${vm}\n    load ${os.loadavg().map((l) => l.toFixed(2)).join(' ')} · ${os.cpus().length} cpus · ${(os.totalmem() / 1e9).toFixed(1)}GB ram`;
}

/**
 * The corpus's size and how fast it is growing — PRINTED, NEVER ASSERTED.
 *
 * The growth term crosses any fixed millisecond budget eventually, and the remedy is sampling
 * or an incremental cold path inside `buildCold`, which is a product decision this test cannot
 * take. Asserting a product budget here would produce a red nobody reading this file can
 * action, and a red nobody can action teaches people to ignore red. So the figure goes where
 * whoever CAN act will see it.
 *
 * Growth is reconstructed from mtimes and is a LOWER BOUND: a transcript whose mtime is older
 * than the cutoff has not changed since, so its current size is its size then, but one that
 * was appended to after the cutoff contributes its whole current size to "now" and nothing to
 * "then". Good enough to show a trend, not a precise history — and said here rather than
 * implied.
 */
function corpusGrowthNote(now: { files: number; bytes: number }): string {
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  let thenBytes = 0;
  for (const f of listTranscripts(claudeProjectsRoot())) {
    try {
      const st = fs.statSync(f);
      if (st.mtimeMs <= cutoff) thenBytes += st.size;
    } catch {
      /* vanished */
    }
  }
  const grewGB = (now.bytes - thenBytes) / 1e9;
  return (
    `corpus ${(now.bytes / 1e9).toFixed(2)}GB across ${now.files} transcripts; ` +
    `grew >=${grewGB.toFixed(2)}GB in 7d (lower bound from mtimes). ` +
    'buildCold reads all of it every time — no sampling, no early exit — so this figure is a ' +
    'product budget, not a test threshold, and it is printed rather than asserted.'
  );
}

describe('GET /api/fleet against the real roots', () => {
  test(
    'returns at least 3 projects other than agentvibe carrying real session or worktree data',
    async () => {
      const blocked = machineGate();
      if (blocked) {
        notVerified('real-fleet content check', blocked);
        return;
      }

      const payload = (await (await liveApp().fetch(new Request('http://127.0.0.1/api/fleet'))).json()) as FleetSummary;
      const others = payload.projects.filter((p) => p.id.toLowerCase() !== 'agentvibe');
      const withData = others.filter((p) => p.sessionCount > 0 || p.worktreeCount > 0);
      const withSessions = others.filter((p) => p.sessionCount > 0);

      // eslint-disable-next-line no-console
      console.log(
        `  [fleet] ${payload.projects.length} projects discovered; ${withData.length} non-agentvibe with data (${withSessions.length} with sessions): ${withData
          .map((p) => `${p.id}(${p.sessionCount}s/${p.worktreeCount}w)`)
          .join(', ')}`
      );

      // Asserted, never skipped: with the corpus present, "discovery returned nothing" is a
      // failure of the thing under test. Pointing MC_PROJECT_ROOTS at an empty or missing
      // directory turns this suite RED, which is the whole point.
      expect(payload.projects.length).toBeGreaterThan(0);
      expect(withData.length).toBeGreaterThanOrEqual(3);
      // THE CORPUS MUST BE LOAD-BEARING IN A TEST THE CORPUS GATES. `withData` is an `||`,
      // and `worktreeCount` comes from git, not from transcripts — so under a decoy corpus
      // (one unrelated transcript, enough to open the gate) this test passed while printing
      // every project at zero sessions: Beamix(0s/65w), etsyc(0s/62w), evalove(0s/104w).
      // The gate certified the corpus and the assertion did not need it. The `||` above is
      // kept because the test's name promises "session OR worktree data" and that reading is
      // honest; this line is what the gate is actually standing behind.
      //
      // One, not three: one is the whole claim — that the corpus reached the figures. A
      // higher bar would encode this machine's particular project mix (6 of 10 today) into
      // the pass condition without making the guarantee any stronger.
      expect(withSessions.length).toBeGreaterThanOrEqual(1);
      // Discovered, never configured: the fleet must not be a list someone typed.
      for (const project of payload.projects) {
        expect(fs.existsSync(path.join(project.root, '.git'))).toBe(true);
      }
    },
    120_000
  );
});

// ── WHAT A COLD CALL IS ALLOWED TO COST, AND WHY IT IS NO LONGER A STOPWATCH ──────────
//
// `expect(coldMs).toBeLessThan(10_000)` reported MACHINE STATE as though it were code quality.
// Nine measurements spanned 2,158–12,610 ms and the 10 s line sat INSIDE that spread, so the
// same code passed or failed depending on the afternoon. #50 measured why:
//
//   · THE COST IS LINEAR IN CORPUS BYTES, and the corpus grows. `buildCold` reads every
//     transcript in full — no sampling, no early exit — and the corpus went 1.01 GB -> 3.03 GB
//     in 21 days on this machine. Measured across cumulative subsets: 0.71 GB 442 ms, 1.39 GB
//     813 ms, 1.87 GB 1,076 ms, 2.29 GB 1,463 ms, 3.03 GB 2,024 ms — ~1.5 GB/s, dead linear.
//     ANY fixed millisecond budget is therefore a date, not a threshold.
//   · AT A FIXED CORPUS SIZE THE FIGURE TRACKS OS MEMORY RECLAIM, NOT LOAD. 30 consecutive
//     builds, corpus constant at 3.034 GB: runs with <10k pageins had a median of 2,130 ms,
//     runs with >20k had 3,534 ms, while load average moved 3.10 -> 3.27. r(ms, pageins) =
//     0.915, and 0.864 partialling load out. Confirmed causally rather than by correlation:
//     evicting 8 GB of unrelated page cache with a pure reader took 2,154 -> 4,406 ms, against
//     a 0 GB control at ratio 0.87.
//
// AND THE SUITE IS NOT THE VARIABLE, which is what everyone assumed including me. n=11 per
// condition, interleaved: this file alone had a median of 2,077 ms, inside the full suite
// 2,100 ms. 23 ms apart.
//
// THE CONSTRAINT THAT FOLLOWS, AND IT IS WHY THIS TEST NO LONGER CLAIMS PRECISION:
//
//   The same code doing the same work varies 2–2.5x from reclaim alone. So any assertion tight
//   enough to catch a 2x code regression will also fire on machine state, and any assertion
//   loose enough to survive machine state cannot catch a 2x regression.
//
// TWO DESIGNS WERE BUILT AND MEASURED BEFORE SETTLING HERE, both rejected on their own numbers:
//   · A CONTROL RATIO — the shape test/gate.ts's stallGateVerdict already uses: read half the
//     corpus as a control, index the other half, assert the ratio. Ratio spread 8.58x against a
//     raw spread of 1.90x with a hash split (0.53 GB vs 2.51 GB — the small half stays
//     resident), and still 1.89x vs 1.71x once the halves were byte-balanced. That pattern
//     works on millisecond, megabyte rounds; here the subject's own multi-GB working set
//     perturbs the very state the control exists to measure.
//   · A FIXED 0.5 GB SLICE, rate, minimum of k=3. Growth-immune and cheaper than today, but the
//     minimum still spanned 2.07x across sessions (1,184–2,449 ms/GB) and a pressured minimum
//     landed below a calm one.
//
// SO THE BLOCKING ASSERTION IS DETERMINISTIC AND HAS NO CLOCK IN IT. A cold build must open
// each scanned transcript exactly once and read the bytes that are on disk. That catches the
// regressions worth catching — a re-read, a retry loop, an O(n^2), a lost early exit — and it
// gives the same answer on a quiet laptop and a thrashing CI box.
describe('GET /api/sessions performance against the real corpus', () => {
  /** Every transcript the corpus holds right now, with sizes — the independent oracle. */
  function corpusSnapshot(): { files: number; bytes: number } {
    const list = listTranscripts(claudeProjectsRoot());
    let bytes = 0;
    for (const f of list) {
      try {
        bytes += fs.statSync(f).size;
      } catch {
        /* vanished between listing and stat — a live corpus does that */
      }
    }
    return { files: list.length, bytes };
  }

  /**
   * A COARSE ceiling on how long a byte may take, calibrated ABOVE the machine-state band
   * rather than through it — which is the single thing the 10 s line got wrong.
   *
   * CALIBRATED AGAINST THIS ROUTE, NOT AGAINST `buildCold`, and the first two versions of this
   * constant were wrong in opposite directions. The bare cold build runs at 660–700 ms/GB, but
   * the figure measured HERE also pays `discoverProjects`, the slice hash over every session
   * and this test's own JSON round-trip. Measured through this exact test, n=8, load 2.0–3.3:
   *
   *   736 · 764 · 1,430 · 1,481 · 1,485 · 1,496 · 1,772 · 1,786 ms/GB
   *
   * So the warm floor is ~740 and the observed ceiling ~1,790 — a 2.4x spread with no code
   * change, which is the #50 reclaim band showing up in the exact figure being asserted on.
   *
   * WHERE 5,000 COMES FROM, AND IT IS NOT ROUNDING. The one historical outlier, 12,610 ms,
   * works out at ~4,162 ms/GB against a 3.03 GB corpus. That event was never reproduced and is
   * the open question at the end of #50 — most likely swap. The line sits deliberately ABOVE
   * it: turning that red would be reporting machine state as code quality one more time, which
   * is the whole thing this rewrite exists to stop. `WARN_MS_PER_GB` is what captures it
   * instead, printing the machine state needed to settle the question without failing the run.
   *
   * WHAT IT DOES AND DOES NOT CATCH, stated because the old assertion implied a precision it
   * never had: against a ~740 ms/GB warm floor this fires at **>=6.8x**, and against the worst
   * observed reading at 2.8x. It catches a per-line JSON.parse, an accidental second pass, an
   * O(n^2). IT DOES NOT CATCH A 2x REGRESSION — 2x is inside this machine's noise band and no
   * statistic tried in #50 reduced that band below ~2x. The deterministic assertions above are
   * what protect against subtler changes; this is a backstop, not a measurement.
   */
  const MAX_MS_PER_GB = 5_000;
  /**
   * Print the machine state, but do NOT fail, above this. Sits above the observed 736–1,786
   * band and below the assertion, so a genuinely pathological run — the 4,162 ms/GB class —
   * is captured with its pageins and swapout deltas attached rather than passing silently and
   * costing another investigation. Evidence without a flaky red.
   *
   * THIS IS NOT AN UNFINISHED ASSERTION, AND PROMOTING IT TO ONE WAS PROPOSED AND DECLINED —
   * written down here because the next person to read a threshold that does not fail anything
   * will reasonably assume someone forgot, and "fixing" it would undo the whole point of this
   * rewrite. The reasoning, in full:
   *
   *   The only run known to exceed this level is the 12,610 ms outlier, ~4,162 ms/GB. #50
   *   could not reproduce it and could not attribute it — it needs ~0.24 GB/s, 2.5x worse
   *   than anything reachable by evicting page cache, and zero swapouts were seen across 30+
   *   instrumented builds. So it is machine state that nobody has yet explained. Failing on
   *   it would be this assertion reporting machine state as code quality ONE MORE TIME, in
   *   the file rewritten to stop doing exactly that. Warning on it produces the pageins and
   *   swapout deltas that would settle the question, at the cost of nothing.
   *
   * The bar for turning this red is not "it fired again". It is "the diagnostic below shows
   * the cause is in the code" — at which point the deterministic assertions above should be
   * catching it instead, and this constant is still not the right instrument.
   */
  const WARN_MS_PER_GB = 2_500;
  /** Below this the divisor dominates and a ms/GB figure means nothing; the rate is withheld. */
  const RATE_RESOLVES_ABOVE_BYTES = 100e6;

  test(
    'a cold call reads each transcript exactly once, and the second call is under 250ms',
    async () => {
      const blocked = machineGate();
      if (blocked) {
        notVerified('real-corpus /api/sessions perf', blocked);
        return;
      }

      // Snapshotted either side of the build because THE CORPUS IS LIVE: other agents append to
      // transcripts while this runs, so an exact comparison against a single before-reading
      // would flake for a reason that has nothing to do with the code. The build's own figures
      // must land inside the interval the two snapshots bracket.
      const before = corpusSnapshot();
      const vmBefore = readMachineState();

      const state = new LiveState(); // a genuinely unbuilt index — this app has served nothing
      const app = new Hono();
      app.route('/api', createApi(state));

      const t0 = performance.now();
      const coldRes = await app.fetch(new Request('http://127.0.0.1/api/sessions'));
      const coldMs = performance.now() - t0;
      const cold = (await coldRes.json()) as SessionsSlice;
      const build = state.index.lastResult;
      const vmAfter = readMachineState();

      const after = corpusSnapshot();

      const t1 = performance.now();
      const warmRes = await app.fetch(new Request('http://127.0.0.1/api/sessions'));
      const warmMs = performance.now() - t1;
      const warm = (await warmRes.json()) as SessionsSlice;

      expect(build).not.toBeNull();
      const gb = build!.bytesRead / 1e9;
      const msPerGB = gb > 0 ? coldMs / gb : NaN;
      // eslint-disable-next-line no-console
      console.log(
        `  [perf] /api/sessions cold ${coldMs.toFixed(0)}ms (${cold.sessions.length} sessions, ` +
          `${build!.filesRead} files, ${gb.toFixed(2)}GB, ${msPerGB.toFixed(0)}ms/GB), second call ${warmMs.toFixed(0)}ms`
      );

      expect(cold.sessions.length).toBeGreaterThan(0); // it measured a real read, not an empty one
      expect(warm.sessions.length).toBe(cold.sessions.length);

      // ── THE DETERMINISTIC PART. No clock; the same answer on any machine. ──
      // EXACTLY ONCE, AND IT TAKES BOTH EQUALITIES. `filesRead === filesScanned` alone says
      // every scanned file was read and none skipped; it does NOT catch a re-read, because a
      // directory listed twice in `transcriptDirs` moves both counters together. The
      // distinct-path count closes that one — executed, mutation N4.
      //
      // WHAT THESE DO NOT CATCH, from the mutation matrix rather than from reasoning, because
      // an earlier version of this comment claimed one of them and was wrong:
      //   · N1 SURVIVED — a second `fs.readFileSync` of the same path inside `readFull`. The
      //     counter sits beside the read, so a read that does not go through it is invisible;
      //     no counter can force future code to increment it. The wasted work roughly doubles
      //     the clock, which the coarse rate below would only notice at >=3.5x. Real gap.
      //   · N5 survived HERE — counters never reset between builds — because this test performs
      //     exactly one cold build, so it cannot reach that at all. Closed in test/units.test.ts
      //     ("a second build reports its own reads"), where it now dies. Noted rather than left
      //     as a gap in this file's own matrix.
      //   · N7 SURVIVED — counting a read that threw. Unreachable without a corpus holding an
      //     unreadable transcript, which this machine does not have.
      expect(build!.filesRead).toBe(build!.filesScanned);
      expect(build!.distinctFilesRead).toBe(build!.filesRead);
      // …and the build really did walk the whole corpus rather than a subset of it. Bracketed
      // rather than pinned, because transcripts legitimately appear mid-build.
      expect(build!.filesScanned).toBeGreaterThanOrEqual(Math.min(before.files, after.files));
      expect(build!.filesScanned).toBeLessThanOrEqual(Math.max(before.files, after.files));
      // BYTES FROM AN INDEPENDENT WALK, which is the half a counter cannot fake: the store
      // reports what it read, `corpusSnapshot` reports what is on disk, and neither figure is
      // derived from the other. A sampling read or a truncated read shows up here and nowhere
      // else — including in the timing, which would simply get faster and look like a win.
      expect(build!.bytesRead).toBeGreaterThanOrEqual(Math.min(before.bytes, after.bytes));
      expect(build!.bytesRead).toBeLessThanOrEqual(Math.max(before.bytes, after.bytes));

      // ── THE COARSE PART. A backstop, and labelled as one. ──
      if (build!.bytesRead < RATE_RESOLVES_ABOVE_BYTES) {
        notVerified(
          'cold-start rate',
          `the corpus is ${gb.toFixed(3)}GB, below the ${(RATE_RESOLVES_ABOVE_BYTES / 1e6).toFixed(0)}MB a ` +
            'ms/GB figure needs before the divisor dominates it'
        );
      } else {
        // `Math.min` so a FAILURE ALWAYS DIAGNOSES, whatever the two constants are set to.
        // Found by running N6, which lowers the fail line to 1 ms/GB: the run went red and
        // printed nothing at all, because 735 was under the 2,500 warn level. Today's values
        // make that unreachable — but a diagnostic that depends on one constant staying above
        // another is a diagnostic that will be missing on the day someone edits the wrong one.
        if (msPerGB >= Math.min(WARN_MS_PER_GB, MAX_MS_PER_GB)) {
          // PART 1 — DIAGNOSABLE AT THE MOMENT IT HAPPENS, WHICH IS THE ONLY MOMENT IT CAN BE.
          // #50 cost a whole investigation to establish that this figure tracks memory reclaim
          // rather than load; the next person must not have to re-derive it. Printed BEFORE the
          // expect() below, because an assertion that throws first prints nothing — and printed
          // at the WARN level rather than only on failure, so the rare pathological run leaves
          // evidence behind instead of passing silently a hair under the line.
          // eslint-disable-next-line no-console
          console.log(
            `  [perf] cold-start rate ${msPerGB >= MAX_MS_PER_GB ? 'EXCEEDED' : 'HIGH'}: ${msPerGB.toFixed(0)}ms/GB ` +
              `(warn ${WARN_MS_PER_GB}, fail ${MAX_MS_PER_GB}). Machine state AT THIS MOMENT:\n` +
              machineStateReport(vmBefore, vmAfter)
          );
        }
        expect(msPerGB).toBeLessThan(MAX_MS_PER_GB);
      }

      // The warm call reuses the in-memory index and re-stats only. It was stable across every
      // #50 measurement — 16–30 ms against a 250 ms line — because it does no bulk reading, so
      // it is left exactly as it was.
      expect(warmMs).toBeLessThan(250);

      // eslint-disable-next-line no-console
      console.log(`  [perf] ${corpusGrowthNote(after)}`);
    },
    120_000
  );
});

describe('the machine gate reads the same corpus the code under test reads', () => {
  // THE FOURTH TIME THIS CLASS SHIPPED, and the first three fixes could not have caught it.
  // The gate held one implementation of the RULE and a second implementation of the VALUE
  // that rule consumes: it recomputed `~/.claude/projects`, while every collector resolves
  // the corpus through scripts/lib/usage.js's projectsDir(), which honours
  // AGENTVIBE_PROJECTS_DIR. Point that at an empty directory and the gate inspected the real
  // corpus, opened, and the real-fleet parity test compared nineteen rows of zeros to
  // nineteen rows of zeros: 25 pass, 0 fail, no NOT VERIFIED printed.
  test('the path is projectsDir() itself, not a second copy of its default', () => {
    expect(claudeProjectsRoot()).toBe(projectsDir());
  });

  test('AGENTVIBE_PROJECTS_DIR moves the gate, because it moves the corpus', () => {
    const previous = process.env.AGENTVIBE_PROJECTS_DIR;
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-gate-empty-'));
    try {
      process.env.AGENTVIBE_PROJECTS_DIR = empty;
      expect(claudeProjectsRoot()).toBe(empty);
      expect(corpusPresent()).toBe(false); // the directory exists; it holds no transcripts
      expect(machineGate()).not.toBeNull();
      expect(machineGate()).toContain(empty);
    } finally {
      if (previous === undefined) delete process.env.AGENTVIBE_PROJECTS_DIR;
      else process.env.AGENTVIBE_PROJECTS_DIR = previous;
      fs.rmSync(empty, { recursive: true, force: true });
    }
  });

  test('a directory that exists but holds no transcript is not a corpus', () => {
    // Existence alone was the old predicate, and it is exactly what let an empty override
    // through — the directory was there, so the gate opened on nothing.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-gate-shape-'));
    try {
      expect(fs.existsSync(dir)).toBe(true);
      expect(listTranscripts(dir)).toHaveLength(0);
      fs.mkdirSync(path.join(dir, 'someproject'));
      fs.writeFileSync(path.join(dir, 'someproject', 's.jsonl'), '{}\n');
      expect(listTranscripts(dir)).toHaveLength(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('the machine gate itself', () => {
  // The gate is the component most likely to rot into "always skips", so its predicate is
  // pinned AGAINST THE FILESYSTEM rather than against the wording of its own excuse. An
  // earlier version asserted `reason.toMatch(/does not exist|found 0 git repositories/)`,
  // which validated the excuse and passed happily while every real test was being skipped.
  test('a reason exists only when the corpus really holds nothing', () => {
    const reason = machineGate();
    const present = listTranscripts(claudeProjectsRoot()).length > 0;

    expect(corpusPresent()).toBe(present); // the helper reads the same disk fact
    expect(reason === null).toBe(present); // skipping and absence are the same condition

    if (reason !== null) {
      expect(present).toBe(false);
      expect(reason).toContain(claudeProjectsRoot());
    }
  });

  test('the gate does not consult discovery — an empty root fails the suite, it does not excuse it', () => {
    if (!corpusPresent()) {
      notVerified('machine-gate independence check', `${claudeProjectsRoot()} holds no transcripts on this machine`);
      return;
    }
    // Point discovery at a directory that cannot exist. The gate must STILL be open (the
    // corpus is what it looks at), even though discovery now returns nothing — so the real
    // tests above would run their assertions and go red rather than print a skip.
    const previous = process.env.MC_PROJECT_ROOTS;
    process.env.MC_PROJECT_ROOTS = path.join(path.sep, 'mission-control-no-such-root');
    try {
      expect(discoverProjects()).toHaveLength(0);
      expect(machineGate()).toBeNull();
    } finally {
      if (previous === undefined) delete process.env.MC_PROJECT_ROOTS;
      else process.env.MC_PROJECT_ROOTS = previous;
    }
  });
});
