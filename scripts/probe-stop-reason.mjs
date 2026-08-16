#!/usr/bin/env node
// POSTURE: REPORTS. Read-only measurement. Not wired to CI — this answers a question, it does
// not gate anything.
//
// scripts/probe-stop-reason.mjs — what actually ends a run.
//
// THE QUESTION THIS EXISTS TO ANSWER
// `maxTurns` was long believed not to bind, on a 196-of-269 measurement taken where NO agent
// file was named. That belief is WRONG as a general statement and was refuted on 2026-08-16:
// when a dispatch names an `agentType`, that agent's `maxTurns` binds hard and silently. The
// original measurement, for context: 196 of 269 reviewer runs exceeded a cap of 20 and the
// longest reached 68 — taken on a path where the dispatch named no agent type, which is the
// condition under which it genuinely does not bind.
//
// Nothing else on disk records why a turn ended. The practical cost is specific and recurring:
// a subagent that quits early reports as "available", not "incomplete", and three sessions in a
// row were caught only by reading the agent's output against the filesystem.
//
// `message.stop_reason` is present on every assistant turn in the transcripts and was simply
// never parsed. `turnsFrom()` now carries it. This script cross-tabulates it.
//
// WHAT THE NUMBERS MEAN
//   end_turn      the model chose to stop. A completed thought.
//   tool_use      the turn ended to run a tool. Normal MID-run — but as the LAST turn of a
//                 sidechain it means the agent stopped while waiting on a tool it never got
//                 back. That is the "available while incomplete" signature.
//   max_tokens    the output ceiling truncated the turn. Real truncation, mid-sentence.
//   stop_sequence a stop sequence matched.
//   null          the line carried no stop_reason. Absent and unread must not collapse into
//                 one value, so this is counted separately and never folded into a total.
//
// USAGE
//   node scripts/probe-stop-reason.mjs            # summary
//   node scripts/probe-stop-reason.mjs --json     # machine-readable
//   AGENTVIBE_PROJECTS_DIR=/some/dir node scripts/probe-stop-reason.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const U = require(path.join(path.dirname(fileURLToPath(import.meta.url)), 'lib', 'usage.js'));

const asJson = process.argv.includes('--json');
const root = U.projectsDir();

if (!fs.existsSync(root)) {
  console.error(`No transcript directory at ${root}. Set AGENTVIBE_PROJECTS_DIR to point at one.`);
  process.exit(1);
}

const files = U.listTranscripts(root);

// Counters. `overall` counts every turn; `terminal` counts only the LAST turn of each
// transcript, which is where an early stop actually shows up.
const overall = Object.create(null);
const terminal = Object.create(null);
// Split the terminal bucket by whether the FINAL turn was itself a sidechain (subagent) turn.
// An earlier cut of this script bucketed by "the transcript contains a subagent turn anywhere",
// which is nearly every transcript and therefore measured nothing.
const terminalSide = Object.create(null);
const terminalMain = Object.create(null);
let turnsSeen = 0;
let filesWithNoTurns = 0;
let filesRead = 0;
let bytes = 0;

const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

for (const f of files) {
  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  filesRead++;
  bytes += Buffer.byteLength(text);

  const turns = U.turnsFrom(text);
  if (!turns.length) { filesWithNoTurns++; continue; }

  turnsSeen += turns.length;
  for (const t of turns) bump(overall, t.stop === null ? '(absent)' : t.stop);

  const last = turns[turns.length - 1];
  const key = last.stop === null ? '(absent)' : last.stop;
  bump(terminal, key);
  bump(last.side === 1 ? terminalSide : terminalMain, key);
}

// The headline: a sidechain whose final turn is `tool_use` stopped waiting on a tool result it
// never received. That is not a completed agent, however it reported itself.
const strandedSubagents = terminalSide['tool_use'] || 0;
const truncated = (terminal['max_tokens'] || 0);

const report = {
  scanned: { root, files: filesRead, turns: turnsSeen, megabytes: +(bytes / 1e6).toFixed(1) },
  filesWithNoParsedTurns: filesWithNoTurns,
  stopReasonAllTurns: overall,
  stopReasonFinalTurn: terminal,
  stopReasonFinalTurnSidechain: terminalSide,
  stopReasonFinalTurnMainThread: terminalMain,
  headline: {
    strandedSubagents,
    truncatedByOutputCeiling: truncated,
  },
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const table = (title, obj, total) => {
  const keys = Object.keys(obj).sort((a, b) => obj[b] - obj[a]);
  console.log(`\n${title}`);
  if (!keys.length) { console.log('  (nothing recorded)'); return; }
  const w = Math.max(...keys.map((k) => k.length));
  for (const k of keys) {
    const pct = total ? ` ${((obj[k] / total) * 100).toFixed(1).padStart(5)}%` : '';
    console.log(`  ${k.padEnd(w)}  ${String(obj[k]).padStart(7)}${pct}`);
  }
};

console.log(`Transcripts: ${filesRead} files, ${turnsSeen} usage-bearing turns, ${(bytes / 1e6).toFixed(1)} MB`);
console.log(`Root: ${root}`);
if (filesWithNoTurns) console.log(`${filesWithNoTurns} file(s) held no parseable turn — counted, not silently dropped.`);

table('stop_reason — every turn', overall, turnsSeen);
table('stop_reason — final turn of each transcript', terminal, filesRead - filesWithNoTurns);
table('stop_reason — final turn, where that turn WAS a subagent turn', terminalSide);
table('stop_reason — final turn, where that turn was the main thread', terminalMain);

console.log('\nHeadline');
console.log(`  Transcripts ending mid-tool (the "available while incomplete" signature): ${strandedSubagents}`);
console.log(`  Transcripts truncated by the output ceiling (max_tokens):                 ${truncated}`);
if (overall['(absent)']) {
  console.log(`  Turns carrying no stop_reason at all:                                     ${overall['(absent)']}`);
  console.log('  (absent is reported separately and never folded into a total — a resolver');
  console.log('   must never pass what it could not check.)');
}
