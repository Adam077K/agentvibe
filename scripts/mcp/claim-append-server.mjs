#!/usr/bin/env node
// POSTURE: it is a TRANSPORT and nothing else. Every refusal in this file is a
// JSON-RPC-shaped one; every refusal that matters happens in
// scripts/lib/claim-append.js, which this file calls and does not second-guess.
// If a check ever appears here that is not in the library, there are two gates and they
// will disagree — which is the failure mode this repo has now paid for three times
// (two risk classifiers, two waiver-date rules, two event-log paths).
//
// scripts/mcp/claim-append-server.mjs — the one tool `sourcer` is granted.
//
// ── WHY AN MCP SERVER AND NOT `Write` ───────────────────────────────────────────────
// `sourcer` is the only engine with network reach — `WebSearch`, `WebFetch` — and it
// deliberately holds no write tool at all. Its value is exactly that combination: the
// engine that talks to the internet cannot change the repository. Granting it `Write` to
// let it record a finding would trade the whole property for the convenience, and
// granting it `Bash` would be worse, because a permission rule on a Bash prefix is
// outflanked by a semicolon.
//
// So the capability arrives the way `designer` got the browser: as an MCP grant. That is
// the one mechanism in this repo measured to BIND and to NARROW across an Agent dispatch
// — `c-mcp-grant-binds-through-agent-dispatch`, measured 2026-08-16: `designer` yields all
// 24 mcp__playwright__* tools, `builder`, which declares no mcpServers, yields zero.
//
// **`sourcer`'s `tools:` line is not modified by this work.** That is the check on whether
// the design held: if a later edit adds `Write` there, this server has no reason to exist.
//
// ── WHAT GOVERNS THIS SERVER, HONESTLY ──────────────────────────────────────────────
// `.claude/mcp-policy.json` names it and allows exactly `append_claim`, and every other
// tool name on it is `unlisted`, which that file treats as denied. But the policy is in
// `mode: shadow`, so today it LOGS and lets the call through. **The enforcement is the
// library, not the policy.** Saying otherwise would be a sentence that reads as a gate
// while nothing behind it refuses — which is the thing this repo's rules table was
// rewritten to stop doing.
//
// The transport is newline-delimited JSON-RPC 2.0 over stdio, hand-written against the
// three methods a tool server needs. That is deliberate: adding an SDK dependency to
// carry ~120 lines of framing would put a network-installed package in the path of the
// one write the least-trusted engine is allowed to make.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { appendClaim, Refusal, TARGET_REL, MAX_VALID_DAYS } = require('../lib/claim-append.js');

const SERVER = { name: 'claim-append', version: '1.0.0' };
const DEFAULT_PROTOCOL = '2025-06-18';

const TOOL = {
  name: 'append_claim',
  description:
    `Append one SOURCED claim to the project claim ledger (${TARGET_REL}). This is the only write ` +
    'available to this agent and it writes nothing else: no other file, no other record shape, and it ' +
    'never edits or removes an existing claim.\n\n' +
    'It REFUSES, rather than writing something for a later lint to catch:\n' +
    '  · verified_by must be "source" — a "command" claim is code a runner would execute; a "judge" ' +
    'claim with no panel resolves unresolved forever.\n' +
    '  · scope must be "project" — "global" is machine state outside this repo, "task" dies with the branch.\n' +
    `  · valid_until is required, must be in the future, and at most ${MAX_VALID_DAYS} days out.\n` +
    '  · THE URL IS FETCHED NOW and evidence.quote must be present in it. The check is the ledger\'s own ' +
    '`claim-source` resolver, so a claim that would fail `ledger verify` cannot be written in the first ' +
    'place. If the fetch cannot be made at all — no network — the append is REFUSED, not queued.\n' +
    '  · the id must not already exist; supports: targets must exist and must not be deprecated.\n\n' +
    'On refusal you get a named code (VERIFIER_NOT_SOURCE, RESOLVER_FAIL, EXPIRY_TOO_FAR, DUPLICATE_ID, …) ' +
    'and a reason. Fix the record or drop the claim — do not restate it as prose somewhere else.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'assert', 'kind', 'scope', 'verified_by', 'evidence', 'valid_until', 'confidence'],
    properties: {
      id: { type: 'string', pattern: '^c-[a-z0-9][a-z0-9-]*$', description: 'c-kebab-case, unique across the ledger' },
      assert: { type: 'string', description: 'One sentence that is either true or false. No newlines.' },
      kind: {
        type: 'string',
        enum: ['external-fact', 'internal-fact', 'behavior', 'user-language', 'judgment', 'runtime-capability', 'preference'],
      },
      scope: { type: 'string', enum: ['project'], description: 'project only — see the refusals above' },
      verified_by: { type: 'string', enum: ['source'], description: 'source only — see the refusals above' },
      evidence: {
        type: 'object',
        additionalProperties: false,
        required: ['url', 'quote', 'accessed'],
        properties: {
          url: { type: 'string', description: 'http(s). Fetched at append time; must be on the public internet.' },
          quote: { type: 'string', description: 'Text that must be present at the URL right now. Verbatim.' },
          accessed: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        },
      },
      valid_until: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      supports: {
        type: 'array',
        items: { type: 'string', pattern: '^(d-\\d{3}|c-[a-z0-9][a-z0-9-]*)$' },
        description: 'ADR ids (d-NNN) or claim ids. Must exist and must not be deprecated.',
      },
    },
  },
};

function send(msg) {
  process.stdout.write(`${JSON.stringify(msg)}\n`);
}

const ok = (id, result) => send({ jsonrpc: '2.0', id, result });
const err = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

// A tool-level failure is `isError: true` with the reason in the content, NOT a JSON-RPC
// error: the model has to be able to read why it was refused and fix the record. A
// protocol error is invisible to it.
const toolError = (id, text) => ok(id, { content: [{ type: 'text', text }], isError: true });

async function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;

  switch (method) {
    case 'initialize': {
      const wanted = params && typeof params.protocolVersion === 'string' ? params.protocolVersion : DEFAULT_PROTOCOL;
      return ok(id, { protocolVersion: wanted, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER });
    }
    case 'notifications/initialized':
    case 'initialized':
      return; // a notification carries no id and takes no reply
    case 'ping':
      return isRequest ? ok(id, {}) : undefined;
    case 'tools/list':
      return ok(id, { tools: [TOOL] });
    case 'tools/call': {
      const name = params && params.name;
      if (name !== TOOL.name) {
        // The registry is closed. An unknown tool name is refused rather than ignored,
        // because ignoring it is how `mcp__` pass-throughs went unchecked for a week.
        return toolError(id, `REFUSED[UNKNOWN_TOOL] this server exposes exactly one tool, "${TOOL.name}"`);
      }
      const args = (params && params.arguments) || {};
      try {
        const out = await appendClaim(args, { by: 'mcp:claim-append' });
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        if (e instanceof Refusal) return toolError(id, `REFUSED[${e.code}] ${e.message}`);
        return toolError(id, `REFUSED[INTERNAL] ${e.message}`);
      }
    }
    default:
      return isRequest ? err(id, -32601, `method not found: ${method}`) : undefined;
  }
}

let chain = Promise.resolve();
function enqueue(msg) {
  chain = chain
    .then(() => handle(msg))
    .catch((e) => {
      if (msg && msg.id !== undefined && msg.id !== null) err(msg.id, -32603, `internal error: ${e.message}`);
      else process.stderr.write(`claim-append: ${e.message}\n`);
    });
  return chain;
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      // No id is recoverable from unparseable input, so there is nobody to answer.
      process.stderr.write('claim-append: dropped an unparseable JSON-RPC line\n');
      continue;
    }
    // SERIALISED on purpose, through one promise chain. Two appends in flight at once
    // would contend on the O_EXCL lock in claim-append.js and the loser would be refused
    // with LOCKED — a refusal naming nothing the caller did wrong and nothing it can fix.
    // Correctness does not depend on this (the lock does); usability does.
    enqueue(msg);
  }
});
process.stdin.on('end', () => process.exit(0));

export { TOOL, handle };
