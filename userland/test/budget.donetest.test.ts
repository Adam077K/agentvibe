// B1-18 done-test (docs/vision-v3/14-BUILD-PLAN.md:307, build/jobs.yml B1-18): "Budget Ledger v1 on the
// Journal: four resources, tranches with completion reserves". Acceptance: "The acceptance reserve cannot be
// spent on execution; the projection carries `journal_offset`". Hash-registered in build/done-tests/B1-18.yml;
// editing it changes the job's acceptance, which is a register change, not a fix.
//
// Canon: 09b-ECONOMICS-EVALS-SIM-IMPROVEMENT.md §1 (four resources, never interchangeable), §3 (EconomicEvent:
// idempotency_key, "fixed-precision decimal string, never float money", "corrections append; history is never
// rewritten"), §3.1 (one pool per purpose; "refuses an EconomicEvent whose charged_pool does not match its
// purpose row"), §4 (tranche holds; completion reserve = acceptance + recovery; "reserves all three together";
// admission invariant "checked atomically (compare-and-swap)"); 09a-ENGINEERING.md §4.1 ("Every projection row
// carries its (stream, seq) source offset and is rebuilt, never repaired by hand"), §4.2 (the Journal is the
// canonical store; a projection is offset-tagged).
//
// Beyond the acceptance line, the orchestrator's brief (2026-10-03) adds money-safety edges, each a test
// below: no double count on retry or replay; concurrent debits cannot overspend; negative and overflow
// amounts are refused; append-only, and the ledger survives a restart; a read error fails closed.
//
// The ledger never opens the Journal: it reaches it through a JournalPort (userland/src/budget.ts). These
// tests supply the port. MemPort keeps the Journal in memory with the Kernel's expect_seq semantics (B1-03
// propose_event; journal.ErrSeqConflict); FilePort keeps it in a file so a second OS process can share it.
// Both store event data as JSON text, so the ledger can never mutate what it appended.
//
// Orchestrator rulings 2026-10-03 (fail-safe), pinned in B1_18_OrchestratorRulingsOnUnits: (1) quantities are
// integer minor units only, so a fraction or decimal point is refused and nothing is rounded; (2) cash is spelled
// `cash:<ISO4217>` in minor units (cash:USD = cents), and a tranche holds exactly one currency; (3) a zero
// quantity, debit or hold, is refused.
//
// Not tested here: B1-27's bucket holds and invariant_violation event; the label the socket requires on
// propose_event (the port adapter's concern).
//
// Run: node --test userland/test/budget.donetest.test.ts   (Node 24 strips the types; node:sqlite is built in)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  appendFileSync,
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import * as budget from '../src/budget.ts';
import type { Debit, Hold, JournalPort, Ledger, PortEvent, Purpose, Resource, Result, TrancheSpec } from '../src/budget.ts';

const MAX = '9223372036854775807'; // 2^63-1: the largest quantity a SQLite INTEGER holds
const CHILD_ENV = 'AVK_B118_CRASH_CHILD';
const SWEEP_ENV = 'AVK_B118_SWEEP_CHILD';

// ---------------------------------------------------------------------------------------------- ports

const tick = () => new Promise<void>((r) => setImmediate(r));

// jsonSafe refuses data a Journal could not store faithfully: a bigint, undefined, a function, or a number
// that is not a safe integer (a float or a lossy big number is money the Journal would round).
function jsonSafe(v: unknown, path = 'data'): void {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return;
  if (typeof v === 'number') {
    if (!Number.isSafeInteger(v)) throw new Error(`port: ${path} is a non-integer or unsafe number ${v}`);
    return;
  }
  if (Array.isArray(v)) return v.forEach((x, i) => jsonSafe(x, `${path}[${i}]`));
  if (typeof v === 'object') {
    for (const [k, x] of Object.entries(v as object)) jsonSafe(x, `${path}.${k}`);
    return;
  }
  throw new Error(`port: ${path} has type ${typeof v}`);
}

type Stored = { seq: number; type: string; data: string };
type Fault = null | 'reply' | 'throw' | 'lost_ack' | 'conflict';

class MemPort implements JournalPort {
  streams = new Map<string, Stored[]>();
  failRead = false;
  fault: Fault = null;
  // cutIn runs once, at whichever comes first after it is armed: a read returning (its result is already taken,
  // so the reader holds a view the cut-in makes stale) or a propose starting.
  cutIn: null | (() => Promise<void>) = null;
  private async cut(): Promise<void> {
    const h = this.cutIn;
    this.cutIn = null;
    if (h) await h();
  }

  async propose(p: { stream: string; expect_seq: number; type: string; data: unknown }) {
    await this.cut();
    await tick();
    if (this.fault === 'throw') throw new Error('port: propose failed');
    if (this.fault === 'reply') return { ok: false as const, reason: 'failed' as const };
    if (this.fault === 'conflict') return { ok: false as const, reason: 'seq_conflict' as const };
    jsonSafe(p.data);
    const s = this.streams.get(p.stream) ?? [];
    if (p.expect_seq !== s.length) return { ok: false as const, reason: 'seq_conflict' as const };
    const ev = { seq: s.length + 1, type: p.type, data: JSON.stringify(p.data) };
    s.push(ev);
    this.streams.set(p.stream, s);
    if (this.fault === 'lost_ack') throw new Error('port: connection lost after the append');
    return { ok: true as const, stream: p.stream, seq: ev.seq, hash: `h${ev.seq}` };
  }

  async read(stream: string, fromSeq: number): Promise<PortEvent[]> {
    await tick();
    if (this.failRead) throw new Error('port: read failed');
    const out = (this.streams.get(stream) ?? [])
      .filter((e) => e.seq >= fromSeq)
      .map((e) => ({ stream, seq: e.seq, type: e.type, data: JSON.parse(e.data) }));
    await this.cut();
    return out;
  }

  count(): number {
    let n = 0;
    for (const s of this.streams.values()) n += s.length;
    return n;
  }

  dump(): string {
    return JSON.stringify([...this.streams.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  }
}

// FilePort: one JSON line per event, fsynced. Safe for one process at a time, which is how the crash test
// uses it (the child is dead before the parent reopens).
class FilePort implements JournalPort {
  readonly file: string;
  constructor(file: string) {
    this.file = file;
  }
  private all(): ({ stream: string } & Stored)[] {
    if (!existsSync(this.file)) return [];
    return readFileSync(this.file, 'utf8')
      .split('\n')
      .filter((l) => l !== '')
      .map((l) => JSON.parse(l));
  }
  async propose(p: { stream: string; expect_seq: number; type: string; data: unknown }) {
    await tick();
    jsonSafe(p.data);
    const head = this.all().filter((e) => e.stream === p.stream).length;
    if (p.expect_seq !== head) return { ok: false as const, reason: 'seq_conflict' as const };
    const line = JSON.stringify({ stream: p.stream, seq: head + 1, type: p.type, data: JSON.stringify(p.data) });
    const fd = openSync(this.file, 'a');
    try {
      appendFileSync(fd, line + '\n');
      fsyncSync(fd);
    } finally {
      closeSync(fd);
    }
    return { ok: true as const, stream: p.stream, seq: head + 1, hash: `h${head + 1}` };
  }
  async read(stream: string, fromSeq: number): Promise<PortEvent[]> {
    await tick();
    return this.all()
      .filter((e) => e.stream === stream && e.seq >= fromSeq)
      .map((e) => ({ stream, seq: e.seq, type: e.type, data: JSON.parse(e.data) }));
  }
}

// ---------------------------------------------------------------------------------------------- fixtures

const USD = 'cash:USD';
const ALLOW = 'claude-max-1/weekly';

// 09b §4's illustration tranche in cents: execution 64, integration_rework 8, acceptance 20, recovery 20 USD.
function tranche(id = 't1'): TrancheSpec {
  return {
    id,
    venture: 'agency',
    mission: 'agency/offer-validation',
    holds: [
      { hold: 'execution', amount: { resource: 'cash', unit: USD, quantity: '6400' } },
      { hold: 'integration_rework', amount: { resource: 'cash', unit: USD, quantity: '800' } },
      { hold: 'acceptance', amount: { resource: 'cash', unit: USD, quantity: '2000' } },
      { hold: 'recovery', amount: { resource: 'cash', unit: USD, quantity: '2000' } },
      { hold: 'execution', amount: { resource: 'allowance', unit: ALLOW, quantity: '100' } },
      { hold: 'acceptance', amount: { resource: 'allowance', unit: ALLOW, quantity: '40' } },
      { hold: 'recovery', amount: { resource: 'allowance', unit: ALLOW, quantity: '10' } },
      { hold: 'execution', amount: { resource: 'founder_minutes', unit: 'minute', quantity: '8' } },
      { hold: 'acceptance', amount: { resource: 'verifier_window', unit: 'window', quantity: '3' } },
    ],
  };
}

// The charging table (09b §3.1), written here and never read from the implementation.
const POOL: Record<Purpose, Hold> = {
  execution: 'execution',
  integration_rework: 'integration_rework',
  judging: 'acceptance',
  recovery: 'recovery',
};
const HOLDS: Hold[] = ['execution', 'integration_rework', 'acceptance', 'recovery'];
const PURPOSES: Purpose[] = ['execution', 'integration_rework', 'judging', 'recovery'];
const REFUSALS = ['invalid', 'pool_mismatch', 'insufficient', 'unknown_tranche', 'incomplete', 'idempotency_conflict', 'unavailable'];

let keyN = 0;
function debit(over: Partial<Debit> & { quantity?: string; resource?: Resource; unit?: string } = {}): Debit {
  const { quantity = '100', resource = 'cash', unit, ...rest } = over;
  const purpose = rest.purpose ?? 'execution';
  return {
    idempotency_key: `k-${++keyN}`,
    tranche: 't1',
    attempt: 'a1',
    purpose,
    charged_pool: POOL[purpose],
    amount: { resource, unit: unit ?? (resource === 'cash' ? USD : resource === 'allowance' ? ALLOW : 'minute'), quantity },
    ...rest,
  };
}

function dir(): string {
  return mkdtempSync(join(tmpdir(), 'b118-'));
}

async function open(port: JournalPort, projectionPath: string): Promise<Ledger> {
  return budget.openLedger({ journal: port, projectionPath });
}

async function fresh(): Promise<{ port: MemPort; d: string; L: Ledger }> {
  const port = new MemPort();
  const d = dir();
  const L = await open(port, join(d, 'p.db'));
  granted(await L.openTranche(tranche()), 'openTranche');
  return { port, d, L };
}

function granted(r: Result, what: string): number {
  assert.equal(r.ok, true, `${what}: expected granted, got ${JSON.stringify(r)}`);
  return (r as { seq: number }).seq;
}

function refused(r: Result, code: string | null, what: string): void {
  assert.equal(r.ok, false, `${what}: expected refused, got ${JSON.stringify(r)}`);
  if (code !== null) assert.equal((r as { code: string }).code, code, `${what}: refusal code`);
  else assert.ok(REFUSALS.includes((r as { code: string }).code), `${what}: unknown refusal code ${JSON.stringify(r)}`);
}

async function consumed(L: Ledger, hold: Hold, resource: Resource = 'cash', t = 't1'): Promise<string> {
  return (await L.balance(t, hold, resource)).consumed;
}

// truth rebuilds a brand-new ledger from the Journal alone, with an empty projection: 09a §4.1 "rebuilt".
async function truth(port: JournalPort, hold: Hold, resource: Resource = 'cash', t = 't1'): Promise<string> {
  const L = await open(port, join(dir(), 'rebuild.db'));
  try {
    return await consumed(L, hold, resource, t);
  } finally {
    await L.close();
  }
}

// tryOpen: a ledger that cannot read its Journal may refuse to open at all; that is also failing closed.
async function tryOpen(port: JournalPort, path: string): Promise<Ledger | null> {
  try {
    return await open(port, path);
  } catch {
    return null;
  }
}

function copyProjection(from: string, to: string): void {
  for (const f of readdirSync(dirname(from))) {
    if (f.startsWith(basename(from))) copyFileSync(join(dirname(from), f), join(dirname(to), basename(to) + f.slice(basename(from).length)));
  }
}

function removeProjection(p: string): void {
  for (const f of readdirSync(dirname(p))) if (f.startsWith(basename(p))) rmSync(join(dirname(p), f));
}

// ---------------------------------------------------------------------------------------------- crash child

async function crashChild(spec: string): Promise<void> {
  const { journal, projection } = JSON.parse(spec);
  const L = await open(new FilePort(journal), projection);
  // 300 debits: far more than any kill point needs, and bounded so a child that is never killed ends quickly.
  for (let i = 0; i < 300; i++) {
    const r = await L.debit({
      idempotency_key: `crash-${i}`,
      tranche: 't1',
      attempt: 'a1',
      purpose: 'execution',
      charged_pool: 'execution',
      amount: { resource: 'cash', unit: USD, quantity: '1' },
    });
    process.stdout.write(r.ok ? `ok ${i}\n` : `refused ${i} ${JSON.stringify(r)}\n`);
  }
}

if (process.env[CHILD_ENV]) {
  await crashChild(process.env[CHILD_ENV]!);
  process.exit(0);
}

// sweepChild SIGKILLs itself right after its Nth node:sqlite call of any kind (run, get, all, iterate, exec),
// counted from before openLedger, so every projection write boundary of open and of the first debits is hit.
async function sweepChild(spec: string): Promise<void> {
  const { journal, projection, killAt } = JSON.parse(spec);
  const sqlite: any = await import('node:sqlite');
  let calls = 0;
  const after = () => {
    if (++calls === killAt) process.kill(process.pid, 'SIGKILL');
  };
  for (const [proto, names] of [
    [sqlite.StatementSync.prototype, ['run', 'get', 'all', 'iterate']],
    [sqlite.DatabaseSync.prototype, ['exec']],
  ] as [any, string[]][]) {
    for (const name of names) {
      const orig = proto[name];
      if (typeof orig !== 'function') continue;
      proto[name] = function (this: unknown, ...a: unknown[]) {
        const r = orig.apply(this, a);
        after();
        return r;
      };
    }
  }
  await crashChild(JSON.stringify({ journal, projection }));
}

if (process.env[SWEEP_ENV]) {
  await sweepChild(process.env[SWEEP_ENV]!);
  process.exit(0);
}

// ---------------------------------------------------------------------------------------------- acceptance

test('B1_18_AcceptanceReserveCannotBeChargedForExecution', async () => {
  // Acceptance, clause 1 (09b §3.1, §4). A debit whose purpose is execution, charged to the acceptance pool, is
  // refused by the charging rule, and the acceptance hold is untouched.
  const { port, L } = await fresh();
  refused(await L.debit(debit({ purpose: 'execution', charged_pool: 'acceptance', quantity: '100' })), 'pool_mismatch', 'execution → acceptance');
  refused(await L.debit(debit({ purpose: 'execution', charged_pool: 'recovery', quantity: '100' })), 'pool_mismatch', 'execution → recovery');
  refused(
    await L.debit(debit({ purpose: 'execution', charged_pool: 'acceptance', resource: 'allowance', quantity: '1' })),
    'pool_mismatch',
    'execution → acceptance, allowance',
  );
  assert.equal(await consumed(L, 'acceptance'), '0');
  assert.equal(await consumed(L, 'acceptance', 'allowance'), '0');
  assert.equal(await consumed(L, 'execution'), '0', 'a refused debit is not charged to its purpose pool either');
  // Positive control: judging spends the acceptance reserve.
  granted(await L.debit(debit({ purpose: 'judging', quantity: '500' })), 'judging → acceptance');
  assert.equal(await consumed(L, 'acceptance'), '500');
  await L.close();
  assert.equal(await truth(port, 'acceptance'), '500');
  assert.equal(await truth(port, 'execution'), '0');
});

test('B1_18_ExecutionCannotSpillIntoTheCompletionReserve', async () => {
  // Acceptance, clause 1. Execution correctly charged to its own pool still cannot reach the acceptance or
  // recovery hold once its own hold is short, however much completion reserve is unspent.
  const { port, L } = await fresh();
  // One debit larger than the execution hold but smaller than execution + acceptance + recovery.
  refused(await L.debit(debit({ quantity: '6401' })), 'insufficient', 'oversize execution debit');
  assert.equal(await consumed(L, 'execution'), '0', 'a refused oversize debit consumes nothing');
  granted(await L.debit(debit({ quantity: '6400' })), 'exhaust execution');
  refused(await L.debit(debit({ quantity: '1' })), 'insufficient', 'execution after exhaustion');
  const acc = await L.balance('t1', 'acceptance', 'cash');
  assert.deepEqual([acc.held, acc.consumed, acc.remaining], ['2000', '0', '2000']);
  const rec = await L.balance('t1', 'recovery', 'cash');
  assert.deepEqual([rec.held, rec.consumed, rec.remaining], ['2000', '0', '2000']);
  const ex = await L.balance('t1', 'execution', 'cash');
  assert.deepEqual([ex.held, ex.consumed, ex.remaining], ['6400', '6400', '0']);
  // The completion reserve is still spendable by its own purposes after execution ran dry.
  granted(await L.debit(debit({ purpose: 'judging', quantity: '2000' })), 'judging the whole acceptance hold');
  granted(await L.debit(debit({ purpose: 'recovery', quantity: '2000' })), 'recovery the whole recovery hold');
  refused(await L.debit(debit({ purpose: 'judging', quantity: '1' })), 'insufficient', 'judging past the hold');
  await L.close();
  assert.equal(await truth(port, 'execution'), '6400');
  assert.equal(await truth(port, 'acceptance'), '2000');
});

test('B1_18_EachPurposeChargesExactlyOnePool', async () => {
  // 09b §3.1: exactly one pool per purpose. All 16 (purpose, pool) pairs: 4 granted, 12 pool_mismatch.
  const { L } = await fresh();
  for (const purpose of PURPOSES) {
    for (const pool of HOLDS) {
      const r = await L.debit(debit({ purpose, charged_pool: pool, quantity: '10' }));
      if (POOL[purpose] === pool) granted(r, `${purpose} → ${pool}`);
      else refused(r, 'pool_mismatch', `${purpose} → ${pool}`);
    }
  }
  for (const h of HOLDS) assert.equal(await consumed(L, h), '10', `${h} charged exactly once`);
  await L.close();
});

test('B1_18_ResourcesAreNeverInterchangeable', async () => {
  // 09b §1: "subscription capacity does not buy a founder-minute"; admission compares component by component.
  const { L } = await fresh();
  granted(await L.debit(debit({ resource: 'allowance', quantity: '100' })), 'exhaust execution allowance');
  refused(await L.debit(debit({ resource: 'allowance', quantity: '1' })), 'insufficient', 'allowance after exhaustion, cash unspent');
  assert.equal(await consumed(L, 'execution', 'cash'), '0');
  assert.equal(await consumed(L, 'acceptance', 'allowance'), '0', 'execution allowance never reaches acceptance allowance');
  // No hold of that resource in that pool: throughput was never reserved for execution.
  refused(await L.debit(debit({ resource: 'throughput', unit: 'rpm', quantity: '1' })), null, 'an unreserved resource');
  // Same resource, another unit: no conversion.
  refused(await L.debit(debit({ resource: 'cash', unit: 'cash:EUR', quantity: '1' })), null, 'cash in another currency');
  refused(await L.debit(debit({ resource: 'allowance', unit: 'chatgpt-1/weekly', quantity: '1' })), null, 'another allowance bucket');
  assert.equal(await consumed(L, 'execution', 'cash'), '0');
  granted(await L.debit(debit({ resource: 'founder_minutes', quantity: '8' })), 'founder minutes from their own hold');
  refused(await L.debit(debit({ resource: 'founder_minutes', quantity: '1' })), 'insufficient', 'founder minutes past the hold');
  await L.close();
});

test('B1_18_TrancheReservesItsCompletionReserve', async () => {
  // 09b §4: "its tranche reserves all three together — funding a writer without a feasible Referee is an
  // incomplete allocation". A tranche with no acceptance hold, or no recovery hold, is refused.
  const port = new MemPort();
  const L = await open(port, join(dir(), 'p.db'));
  const noAcc = tranche('t-noacc');
  noAcc.holds = noAcc.holds.filter((h) => h.hold !== 'acceptance');
  refused(await L.openTranche(noAcc), 'incomplete', 'no acceptance hold');
  const noRec = tranche('t-norec');
  noRec.holds = noRec.holds.filter((h) => h.hold !== 'recovery');
  refused(await L.openTranche(noRec), 'incomplete', 'no recovery hold');
  refused(await L.debit(debit({ tranche: 't-noacc' })), 'unknown_tranche', 'a refused tranche never opened');
  refused(await L.debit(debit({ tranche: 'nope' })), 'unknown_tranche', 'an unknown tranche');
  // Re-opening an open tranche never resets what it has consumed.
  granted(await L.openTranche(tranche()), 'open t1');
  granted(await L.debit(debit({ quantity: '6000' })), 'spend 6000');
  const again = await L.openTranche(tranche());
  if (again.ok) assert.equal(again.replayed, true, 're-opening t1 can only be a replay');
  const bigger = tranche();
  bigger.holds[0] = { hold: 'execution', amount: { resource: 'cash', unit: USD, quantity: '99999' } };
  const grown = await L.openTranche(bigger);
  assert.equal(grown.ok, false, 're-opening t1 with different holds is refused, not a silent top-up');
  assert.equal(await consumed(L, 'execution'), '6000');
  refused(await L.debit(debit({ quantity: '401' })), 'insufficient', 'still 400 left');
  await L.close();
  assert.equal(await truth(port, 'execution'), '6000');
});

test('B1_18_ProjectionCarriesJournalOffset', async () => {
  // Acceptance, clause 2 (09a §4.1, 09b mechanism register: "SQLite projection with journal_offset"). The
  // projection is a SQLite file; every table has a journal_offset column; every row carries one; it never
  // exceeds what was granted; the newest equals the last grant's seq, and balance reports that offset.
  const port = new MemPort();
  const d = dir();
  const p = join(d, 'p.db');
  const L = await open(port, p);
  const s0 = granted(await L.openTranche(tranche()), 'open');
  let b = await L.balance('t1', 'execution', 'cash');
  assert.equal(b.journal_offset, s0, 'balance after openTranche is as of its seq');
  const seqs = [s0];
  for (let i = 0; i < 5; i++) {
    const s = granted(await L.debit(debit({ quantity: '10' })), `debit ${i}`);
    seqs.push(s);
    b = await L.balance('t1', 'execution', 'cash');
    assert.equal(b.journal_offset, s, `balance after debit ${i} is as of its seq`);
    assert.equal(b.consumed, String(10 * (i + 1)));
  }
  assert.ok(seqs.every((s, i) => i === 0 || s > seqs[i - 1]), `grant seqs strictly increase: ${seqs}`);
  await L.close();

  const db = new DatabaseSync(p, { readOnly: true });
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((r: any) => r.name as string);
    assert.ok(tables.length > 0, 'the projection holds at least one table');
    let max = 0;
    let rows = 0;
    for (const t of tables) {
      const cols = db.prepare(`PRAGMA table_info("${t.replaceAll('"', '""')}")`).all().map((c: any) => c.name);
      assert.ok(cols.includes('journal_offset'), `table ${t} carries journal_offset (columns: ${cols})`);
      for (const r of db.prepare(`SELECT journal_offset AS o FROM "${t.replaceAll('"', '""')}"`).all() as any[]) {
        rows++;
        assert.equal(typeof r.o === 'number' || typeof r.o === 'bigint', true, `table ${t}: journal_offset ${r.o} is an integer`);
        const o = Number(r.o);
        assert.ok(Number.isInteger(o) && o >= 1, `table ${t}: journal_offset ${o} >= 1`);
        assert.ok(o <= seqs.at(-1)!, `table ${t}: journal_offset ${o} is not past the Journal`);
        max = Math.max(max, o);
      }
    }
    assert.ok(rows > 0, 'the projection holds rows');
    assert.equal(max, seqs.at(-1), 'the newest row is as of the last grant');
  } finally {
    db.close();
  }
});

// ---------------------------------------------------------------------------------------------- money safety

test('B1_18_RetryAndReplayAreCountedOnce', async () => {
  // 09b §3: idempotency_key. A retried debit is a replay: same seq, replayed, counted once. The same key for a
  // different debit is refused, not merged. Replays hold across a restart and across a rebuilt projection.
  const { port, d, L } = await fresh();
  const dd = debit({ idempotency_key: 'k-retry', quantity: '700' });
  const s = granted(await L.debit(dd), 'first');
  const again = await L.debit({ ...dd });
  assert.deepEqual(again, { ok: true, seq: s, replayed: true }, 'the retry is a replay of the first');
  assert.equal(await consumed(L, 'execution'), '700');
  refused(await L.debit({ ...dd, amount: { ...dd.amount, quantity: '701' } }), 'idempotency_conflict', 'same key, other amount');
  refused(await L.debit({ ...dd, purpose: 'judging', charged_pool: 'acceptance' }), 'idempotency_conflict', 'same key, other purpose');
  refused(await L.debit({ ...dd, attempt: 'a2' }), 'idempotency_conflict', 'same key, other attempt');
  refused(await L.debit({ ...dd, idempotency_key: '' }), 'invalid', 'an empty key');
  await L.close();
  // Restart over the same projection.
  const L2 = await open(port, join(d, 'p.db'));
  assert.deepEqual(await L2.debit({ ...dd }), { ok: true, seq: s, replayed: true }, 'a replay after restart');
  assert.equal(await consumed(L2, 'execution'), '700');
  await L2.close();
  // A brand-new projection, rebuilt from the Journal.
  const L3 = await open(port, join(dir(), 'p.db'));
  assert.deepEqual(await L3.debit({ ...dd }), { ok: true, seq: s, replayed: true }, 'a replay against a rebuilt projection');
  assert.equal(await consumed(L3, 'execution'), '700');
  await L3.close();
  assert.equal(await truth(port, 'execution'), '700');
});

test('B1_18_LostAckRetryIsNotDoubleCounted', async () => {
  // The Journal appended but the answer was lost (09a §6: lost mid-dispatch is Uncertain, never a definite
  // failure). Loosened 2026-10-03 (red-team r1 ruling): the first call may be refused, or, if the ledger reads
  // back and finds its own append, granted with that seq and replayed:false. Either way the retry finds the
  // append rather than making a second, and the money is counted exactly once.
  const { port, L } = await fresh();
  const dd = debit({ idempotency_key: 'k-lost', quantity: '900' });
  const n = port.count();
  port.fault = 'lost_ack';
  const first = await L.debit(dd);
  port.fault = null;
  assert.equal(port.count(), n + 1, 'the Journal holds the append whose ack was lost');
  if (first.ok) {
    assert.equal(first.replayed, false, `a read-back of its own append is not a replay: ${JSON.stringify(first)}`);
    assert.equal(first.seq, n + 1, 'granted at the seq the Journal assigned');
  } else refused(first, null, 'lost ack');
  const retry = await L.debit({ ...dd });
  assert.equal(retry.ok, true, `the retry resolves the uncertain append: ${JSON.stringify(retry)}`);
  if (first.ok) assert.deepEqual(retry, { ok: true, seq: first.seq, replayed: true }, 'after a grant, the retry is its replay');
  assert.equal(port.count(), n + 1, 'the retry appended nothing');
  assert.equal(await consumed(L, 'execution'), '900', 'counted once');
  await L.close();
  assert.equal(await truth(port, 'execution'), '900');
});

test('B1_18_ConcurrentDebitsCannotOverspend', async () => {
  // 09b §4: the admission invariant is "checked atomically (compare-and-swap)". Two ledgers (two processes in
  // production) over one Journal race 40 debits of 700 against a 6400 hold: at most 9 fit. Twenty duplicate
  // debits with shared keys, sent from both, are counted once each.
  const port = new MemPort();
  const A = await open(port, join(dir(), 'a.db'));
  const B = await open(port, join(dir(), 'b.db'));
  granted(await A.openTranche(tranche()), 'open');
  const results = await Promise.all(
    Array.from({ length: 40 }, (_, i) => (i % 2 ? A : B).debit(debit({ idempotency_key: `race-${i}`, quantity: '700' }))),
  );
  for (const r of results) if (!r.ok) assert.ok(REFUSALS.includes(r.code), `refusal code ${JSON.stringify(r)}`);
  const ok = results.filter((r) => r.ok).length;
  assert.ok(ok >= 1 && ok <= 9, `granted ${ok} debits of 700 against 6400`);
  assert.equal(await truth(port, 'execution'), String(ok * 700), 'the Journal holds exactly the granted debits');

  // Shared keys: each of 10 debits sent twice, once through each ledger, concurrently.
  const dup = Array.from({ length: 10 }, (_, i) => debit({ idempotency_key: `dup-${i}`, purpose: 'judging', quantity: '100' }));
  const dres = await Promise.all(dup.flatMap((x) => [A.debit({ ...x }), B.debit({ ...x })]));
  const dupOk = new Set(dres.filter((r) => r.ok).map((r) => (r as { seq: number }).seq));
  assert.ok(dupOk.size <= 10, `each shared key appended at most once: ${dupOk.size} distinct seqs`);
  const accepted = await truth(port, 'acceptance');
  assert.equal(accepted, String(dupOk.size * 100), 'the acceptance pool holds one charge per granted key');
  assert.ok(Number(accepted) <= 1000);

  // Same-ledger concurrency: 20 more debits of 100 against recovery (2000) from A alone, plus 5 over.
  const rres = await Promise.all(Array.from({ length: 25 }, (_, i) => A.debit(debit({ idempotency_key: `r-${i}`, purpose: 'recovery', quantity: '100' }))));
  const rok = rres.filter((r) => r.ok).length;
  assert.ok(rok <= 20, `recovery granted ${rok} × 100 against 2000`);
  assert.equal(await truth(port, 'recovery'), String(rok * 100));
  await A.close();
  await B.close();
});

test('B1_18_AConflictRechecksTheBalance', async () => {
  // Forced interleaving: ledger A reads the Journal, and right after that read returns (or, for a ledger that
  // does not read first, as its append starts) ledger B spends the rest. A's append must lose the
  // compare-and-swap, re-read, and refuse. A ledger that decides on one read and appends at a second, fresh head
  // (or retries at a fresh head without re-checking the balance) grants it and overspends.
  const port = new MemPort();
  const A = await open(port, join(dir(), 'a.db'));
  const B = await open(port, join(dir(), 'b.db'));
  granted(await A.openTranche(tranche()), 'open');
  granted(await A.debit(debit({ quantity: '6000' })), 'A spends 6000');
  let fired = false;
  port.cutIn = async () => {
    fired = true;
    granted(await B.debit(debit({ idempotency_key: 'cut-in', quantity: '400' })), 'B spends the last 400');
  };
  const r = await A.debit(debit({ idempotency_key: 'victim', quantity: '400' }));
  assert.equal(fired, true, 'the cut-in ran');
  refused(r, 'insufficient', 'A after B spent the rest');
  assert.equal(await truth(port, 'execution'), '6400');
  await A.close();
  await B.close();
});

test('B1_18_RefusesNegativeMalformedAndOverflowAmounts', async () => {
  // 09b §3: "fixed-precision decimal string, never float money". A quantity is a decimal string of a
  // non-negative integer no larger than 2^63-1. Everything else is refused as invalid and consumes nothing.
  const bad: unknown[] = [
    '-1', '-0', '+1', '1e3', '1E3', ' 1', '1 ', '', '0x10', '0b1', '1_000', '1,000', 'NaN', 'Infinity', '١٢', '１２',
    '9223372036854775808', '18446744073709551616', '99999999999999999999999999',
    '0', '00', '01', '0.0', '1.0', '1.5', '0.5', '.5', '5.', '1,5',
    -1, 1, 1.5, 0, null, undefined, 10n, ['1'], { q: '1' },
  ];
  const { port, L } = await fresh();
  for (const q of bad) {
    const d = debit({ quantity: '1' });
    (d.amount as any).quantity = q;
    refused(await L.debit(d), 'invalid', `debit quantity ${typeof q === 'bigint' ? `${q}n` : JSON.stringify(q)}`);
    const t = tranche(`bad-${keyN++}`);
    (t.holds[0].amount as any).quantity = q;
    refused(await L.openTranche(t), 'invalid', `hold quantity ${typeof q === 'bigint' ? `${q}n` : JSON.stringify(q)}`);
  }
  // Unknown enum values are malformed too.
  refused(await L.debit({ ...debit(), purpose: 'Execution' as any }), 'invalid', 'purpose case variant');
  refused(await L.debit({ ...debit(), charged_pool: 'acceptance_headroom' as any }), 'invalid', 'a pool that is not a tranche hold');
  refused(await L.debit({ ...debit(), amount: { resource: 'money' as any, unit: USD, quantity: '1' } }), 'invalid', 'unknown resource');
  // Per-resource total of a tranche over 2^63-1 is an overflow too (09b §4: cash_cap = every hold below).
  const over = tranche('t-over');
  over.holds[0] = { hold: 'execution', amount: { resource: 'cash', unit: USD, quantity: MAX } };
  refused(await L.openTranche(over), 'invalid', 'cash holds summing past 2^63-1');
  assert.equal(await consumed(L, 'execution'), '0');
  await L.close();
  assert.equal(await truth(port, 'execution'), '0');
});

test('B1_18_QuantitiesKeepFullPrecision', async () => {
  // 2^63-1 is a legal hold and is exactly exhausted; 2^53+1 is not rounded to 2^53. A ledger doing arithmetic
  // in JS numbers grants a debit past the first hold and refuses a legal one against the second.
  const port = new MemPort();
  const L = await open(port, join(dir(), 'p.db'));
  granted(
    await L.openTranche({
      id: 'big',
      venture: 'agency',
      mission: 'agency/big',
      holds: [
        { hold: 'execution', amount: { resource: 'allowance', unit: ALLOW, quantity: MAX } },
        { hold: 'execution', amount: { resource: 'cash', unit: USD, quantity: '9007199254740993' } },
        { hold: 'acceptance', amount: { resource: 'cash', unit: USD, quantity: '1' } },
        { hold: 'recovery', amount: { resource: 'cash', unit: USD, quantity: '1' } },
      ],
    }),
    'open big',
  );
  granted(await L.debit(debit({ tranche: 'big', resource: 'allowance', quantity: MAX })), 'spend 2^63-1');
  refused(await L.debit(debit({ tranche: 'big', resource: 'allowance', quantity: '1' })), 'insufficient', 'one past 2^63-1');
  const a = await L.balance('big', 'execution', 'allowance');
  assert.deepEqual([a.held, a.consumed, a.remaining], [MAX, MAX, '0']);
  granted(await L.debit(debit({ tranche: 'big', quantity: '9007199254740992' })), 'spend 2^53');
  granted(await L.debit(debit({ tranche: 'big', quantity: '1' })), 'the last cent of 2^53+1');
  refused(await L.debit(debit({ tranche: 'big', quantity: '1' })), 'insufficient', 'past 2^53+1');
  assert.equal(await consumed(L, 'execution', 'cash', 'big'), '9007199254740993');
  await L.close();
  assert.equal(await truth(port, 'execution', 'allowance', 'big'), MAX);
  assert.equal(await truth(port, 'execution', 'cash', 'big'), '9007199254740993');
});

test('B1_18_AppendOnlyAndSurvivesRestart', async () => {
  // 09a §4.1: the projection "is rebuilt, never repaired by hand"; 09b §3: "history is never rewritten".
  // Restart over the same projection, over a deleted one, and over a STALE one restored from a backup: every
  // time the balance is the Journal's, and a stale projection never re-grants spent money.
  const { port, d, L } = await fresh();
  const p = join(d, 'p.db');
  granted(await L.debit(debit({ quantity: '700' })), 'debit 1');
  await L.close();
  copyProjection(p, join(d, 'stale.db'));
  const before = port.dump();

  const L2 = await open(port, p);
  for (let i = 0; i < 8; i++) granted(await L2.debit(debit({ quantity: '700' })), `debit ${i + 2}`);
  assert.equal(await consumed(L2, 'execution'), '6300');
  await L2.close();
  const after = port.dump();
  // Append-only: every stream's earlier events are a byte-identical prefix of the later Journal.
  const pre = new Map(JSON.parse(before) as [string, Stored[]][]);
  const post = new Map(JSON.parse(after) as [string, Stored[]][]);
  for (const [s, evs] of pre) assert.deepEqual(post.get(s)!.slice(0, evs.length), evs, `stream ${s} was only appended to`);

  const L3 = await open(port, p);
  assert.equal(await consumed(L3, 'execution'), '6300', 'restart over the same projection');
  await L3.close();

  removeProjection(p);
  copyProjection(join(d, 'stale.db'), p);
  const L4 = await open(port, p);
  assert.equal(await consumed(L4, 'execution'), '6300', 'a stale projection catches up to the Journal');
  refused(await L4.debit(debit({ quantity: '700' })), 'insufficient', 'a stale projection never re-grants spent money');
  granted(await L4.debit(debit({ quantity: '100' })), 'the true remainder');
  assert.equal((await L4.balance('t1', 'execution', 'cash')).remaining, '0');
  await L4.close();

  removeProjection(p);
  const L5 = await open(port, p);
  assert.equal(await consumed(L5, 'execution'), '6400', 'a deleted projection is rebuilt');
  await L5.close();
});

test('B1_18_SurvivesSigkillMidStream', async () => {
  // A second OS process runs the ledger over a file-backed Journal and is SIGKILLed while debiting. Reopened
  // over its own (possibly half-written) projection, the ledger agrees with a rebuild from zero, which holds
  // every debit the child reported and at most the one in flight. Replaying the reported keys adds nothing.
  const d = dir();
  const journal = join(d, 'journal.jsonl');
  const projection = join(d, 'child.db');
  const port = new FilePort(journal);
  const L0 = await open(port, join(d, 'setup.db'));
  granted(await L0.openTranche(tranche()), 'open');
  await L0.close();

  const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], {
    env: { ...process.env, [CHILD_ENV]: JSON.stringify({ journal, projection }) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  let err = '';
  child.stderr.on('data', (b) => (err += b));
  const reported = await new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`child reported too few debits: ${out.slice(-400)} ${err.slice(-400)}`)), 60000);
    child.stdout.on('data', (b) => {
      out += b;
      const n = out.split('\n').filter((l) => l.startsWith('ok ')).length;
      if (n >= 25) {
        clearTimeout(timer);
        child.kill('SIGKILL');
        resolve(n);
      }
    });
    child.on('exit', () => {
      clearTimeout(timer);
      resolve(out.split('\n').filter((l) => l.startsWith('ok ')).length);
    });
  });
  await new Promise((r) => (child.exitCode !== null || child.signalCode !== null ? r(null) : child.on('exit', r)));
  assert.equal(child.signalCode, 'SIGKILL', `the child was killed, not finished: ${err.slice(-400)}`);
  const okLines = out.split('\n').filter((l) => l.startsWith('ok ')).length;
  assert.ok(okLines >= reported && reported >= 25, `the child reported ${okLines} debits`);
  assert.ok(!out.includes('refused'), `no child debit was refused: ${out.slice(-400)}`);

  const rebuilt = Number(await truth(port, 'execution'));
  assert.ok(rebuilt >= okLines && rebuilt <= okLines + 1, `rebuild holds ${rebuilt} for ${okLines} reported`);
  const L = await open(port, projection);
  assert.equal(await consumed(L, 'execution'), String(rebuilt), 'the crashed projection agrees with a rebuild');
  for (let i = 0; i < okLines; i++) {
    const r = await L.debit({
      idempotency_key: `crash-${i}`,
      tranche: 't1',
      attempt: 'a1',
      purpose: 'execution',
      charged_pool: 'execution',
      amount: { resource: 'cash', unit: USD, quantity: '1' },
    });
    assert.equal(r.ok && r.replayed, true, `crash-${i} replays: ${JSON.stringify(r)}`);
  }
  assert.equal(await consumed(L, 'execution'), String(rebuilt), 'replays added nothing');
  await L.close();
});

test('B1_18_ReadAndWriteErrorsFailClosed', async () => {
  // A ledger that cannot read or write its Journal denies spend; it never grants on a guess, and a failed write
  // is never counted.
  // 1. The Journal cannot be read at open.
  {
    const port = new MemPort();
    const p = join(dir(), 'p.db');
    const L0 = await open(port, p);
    granted(await L0.openTranche(tranche()), 'open');
    await L0.close();
    port.failRead = true;
    const L = await tryOpen(port, join(dir(), 'cold.db'));
    if (L) {
      refused(await L.debit(debit({ quantity: '1' })), 'unavailable', 'unreadable Journal, cold projection');
      await L.close();
    }
    port.failRead = false;
    assert.equal(await truth(port, 'execution'), '0');
  }
  // 2. Another ledger appended, and the Journal cannot be read when the conflict is discovered.
  {
    const port = new MemPort();
    const A = await open(port, join(dir(), 'a.db'));
    const B = await open(port, join(dir(), 'b.db'));
    granted(await A.openTranche(tranche()), 'open');
    granted(await A.debit(debit({ quantity: '6000' })), 'A spends 6000');
    port.failRead = true;
    refused(await B.debit(debit({ quantity: '400' })), 'unavailable', 'B cannot read what A appended');
    port.failRead = false;
    assert.equal(await truth(port, 'execution'), '6000');
    await A.close();
    await B.close();
  }
  // 3. The append is answered `failed`, or the port throws before appending.
  {
    const { port, L } = await fresh();
    port.fault = 'reply';
    refused(await L.debit(debit({ quantity: '500' })), 'unavailable', 'propose answered failed');
    port.fault = 'throw';
    refused(await L.debit(debit({ quantity: '500' })), 'unavailable', 'propose threw');
    port.fault = null;
    assert.equal(await consumed(L, 'execution'), '0', 'a failed write is not counted');
    granted(await L.debit(debit({ quantity: '6400' })), 'the whole hold is still there');
    await L.close();
    assert.equal(await truth(port, 'execution'), '6400');
  }
  // 4. The projection file is garbage: rebuild from the Journal or refuse; never grant past the hold.
  {
    const { port, d, L } = await fresh();
    const p = join(d, 'p.db');
    granted(await L.debit(debit({ quantity: '6300' })), 'spend 6300');
    await L.close();
    removeProjection(p);
    writeFileSync(p, Buffer.alloc(8192, 0x5a));
    const L2 = await tryOpen(port, p);
    if (L2) {
      const r = await L2.debit(debit({ quantity: '700' }));
      assert.equal(r.ok, false, `a corrupt projection never grants past the hold: ${JSON.stringify(r)}`);
      await L2.close();
    }
    assert.equal(await truth(port, 'execution'), '6300');
  }
});

test('B1_18_ProjectionIsDisposable', async () => {
  // Orchestrator 2026-10-03 (1): the SQLite projection is disposable. Deleted and rebuilt from the Journal alone,
  // every balance of every (hold, resource), its journal_offset included, is identical to the live one, and
  // every granted key replays at its original seq.
  const { port, d, L } = await fresh();
  const p = join(d, 'p.db');
  const grants: [Debit, number][] = [];
  const ops: Debit[] = [
    debit({ quantity: '1234' }),
    debit({ purpose: 'judging', quantity: '777' }),
    debit({ purpose: 'recovery', quantity: '5' }),
    debit({ purpose: 'integration_rework', quantity: '800' }),
    debit({ resource: 'allowance', quantity: '99' }),
    debit({ purpose: 'judging', resource: 'allowance', quantity: '40' }),
    debit({ resource: 'founder_minutes', quantity: '3' }),
    debit({ purpose: 'judging', resource: 'verifier_window', unit: 'window', quantity: '2' }),
  ];
  for (const o of ops) grants.push([o, granted(await L.debit(o), `debit ${o.idempotency_key}`)]);
  refused(await L.debit(debit({ quantity: '999999' })), 'insufficient', 'a refusal leaves no trace in the state');
  const cells = tranche().holds.map((h) => [h.hold, h.amount.resource] as [Hold, Resource]);
  const snap = async (X: Ledger) => {
    const out: Record<string, unknown> = {};
    for (const [h, r] of cells) out[`${h}/${r}`] = await X.balance('t1', h, r);
    return out;
  };
  const live = await snap(L);
  await L.close();
  removeProjection(p);
  assert.equal(existsSync(p), false, 'the projection is gone');
  const R = await open(port, p);
  assert.deepEqual(await snap(R), live, 'rebuilt from the Journal alone, the state is identical');
  for (const [o, seq] of grants) assert.deepEqual(await R.debit({ ...o }), { ok: true, seq, replayed: true }, `${o.idempotency_key} replays`);
  assert.deepEqual(await snap(R), live, 'replays changed nothing');
  await R.close();
  // A second, independent projection path agrees too.
  const R2 = await open(port, join(dir(), 'other.db'));
  assert.deepEqual(await snap(R2), live, 'any empty projection rebuilds to the same state');
  await R2.close();
});

test('B1_18_NoSpendOnProjectionAlone', { timeout: 60000 }, async () => {
  // Orchestrator 2026-10-03 (2), (3). Fixture control first: the test port enforces real expect_seq
  // compare-and-swap, so a ledger cannot pass these tests against a port that accepts any append.
  {
    const port = new MemPort();
    assert.deepEqual(await port.propose({ stream: 's', expect_seq: 1, type: 'x', data: {} }), { ok: false, reason: 'seq_conflict' });
    assert.equal(port.count(), 0, 'a stale expect_seq appends nothing');
    assert.equal((await port.propose({ stream: 's', expect_seq: 0, type: 'x', data: {} })).ok, true);
    assert.deepEqual(await port.propose({ stream: 's', expect_seq: 0, type: 'x', data: {} }), { ok: false, reason: 'seq_conflict' });
    assert.equal((await port.propose({ stream: 's', expect_seq: 1, type: 'x', data: {} })).ok, true);
    assert.equal(port.count(), 2);
  }
  // Every grant that is not a replay is backed by a new Journal event: the projection never grants on its own.
  const { port, L } = await fresh();
  const before = port.count();
  granted(await L.debit(debit({ quantity: '100' })), 'a normal debit');
  assert.ok(port.count() > before, 'a grant appended to the Journal');
  // The Journal answers seq_conflict to every append, forever: after whatever retries it makes, the ledger denies.
  port.fault = 'conflict';
  for (const [purpose, q] of [['execution', '1'], ['judging', '1'], ['recovery', '2000']] as [Purpose, string][]) {
    const n = port.count();
    const r = await L.debit(debit({ purpose, quantity: q }));
    assert.equal(r.ok, false, `${purpose}: an append that never wins is denied: ${JSON.stringify(r)}`);
    assert.ok(REFUSALS.includes((r as { code: string }).code), `refusal code ${JSON.stringify(r)}`);
    assert.equal(port.count(), n, 'nothing appended');
  }
  port.fault = null;
  assert.equal(await consumed(L, 'execution'), '100', 'denied debits were not counted');
  assert.equal(await consumed(L, 'acceptance'), '0');
  // The port is unavailable for both reads and writes: denied, even for a debit the projection says fits.
  port.failRead = true;
  port.fault = 'throw';
  refused(await L.debit(debit({ quantity: '1' })), 'unavailable', 'no Journal at all');
  port.failRead = false;
  port.fault = null;
  await L.close();
  assert.equal(await truth(port, 'execution'), '100');
  assert.equal(await truth(port, 'recovery'), '0');
});

test('B1_18_OrchestratorRulingsOnUnits', async () => {
  // Orchestrator rulings 2026-10-03, all fail-safe. Each refusal is `invalid` and consumes nothing.
  const { port, L } = await fresh();
  // (1) Integer minor units only: no fraction, no decimal point, so no rounding.
  for (const q of ['1.0', '100.00', '0.01', '99.5', '6400.0']) {
    refused(await L.debit(debit({ quantity: q })), 'invalid', `fractional debit ${q}`);
    const t = tranche(`frac-${keyN++}`);
    t.holds[0].amount.quantity = q;
    refused(await L.openTranche(t), 'invalid', `fractional hold ${q}`);
  }
  // (3) Zero is refused, for a debit and for a hold of any pool or resource.
  refused(await L.debit(debit({ quantity: '0' })), 'invalid', 'zero cash debit');
  refused(await L.debit(debit({ purpose: 'judging', resource: 'verifier_window', unit: 'window', quantity: '0' })), 'invalid', 'zero window debit');
  for (let i = 0; i < tranche().holds.length; i++) {
    const t = tranche(`zero-${i}`);
    t.holds[i].amount.quantity = '0';
    refused(await L.openTranche(t), 'invalid', `zero hold ${t.holds[i].hold}/${t.holds[i].amount.resource}`);
  }
  // (2) Cash is spelled cash:<ISO4217>; any other spelling, on a hold or a debit, is refused.
  for (const unit of ['USD', 'usd', 'USD_cents', 'cash:usd', 'cash:US', 'cash:USDX', 'cash: USD', 'cash:USD ', 'Cash:USD', 'cash:', 'cash:U$D', 'money:USD']) {
    const t = tranche(`unit-${keyN++}`);
    for (const h of t.holds) if (h.amount.resource === 'cash') h.amount.unit = unit;
    refused(await L.openTranche(t), 'invalid', `cash hold spelled ${JSON.stringify(unit)}`);
    refused(await L.debit(debit({ unit, quantity: '1' })), 'invalid', `cash debit spelled ${JSON.stringify(unit)}`);
  }
  // (2) A tranche holds exactly one currency: a second currency in any hold is refused.
  for (let i = 1; i < 4; i++) {
    const t = tranche(`fx-${i}`);
    t.holds[i].amount.unit = 'cash:EUR';
    refused(await L.openTranche(t), 'invalid', `${t.holds[i].hold} in cash:EUR beside cash:USD`);
  }
  const extra = tranche('fx-extra');
  extra.holds.push({ hold: 'acceptance', amount: { resource: 'cash', unit: 'cash:EUR', quantity: '1' } });
  assert.equal((await L.openTranche(extra)).ok, false, 'a second cash hold in another currency is refused');
  // Positive control: a whole tranche in one other currency is fine, and its cash is spent in that currency only.
  const eur = tranche('eur');
  for (const h of eur.holds) if (h.amount.resource === 'cash') h.amount.unit = 'cash:EUR';
  granted(await L.openTranche(eur), 'an all-EUR tranche');
  granted(await L.debit(debit({ tranche: 'eur', unit: 'cash:EUR', quantity: '1' })), 'EUR from an EUR tranche');
  refused(await L.debit(debit({ tranche: 'eur', unit: 'cash:USD', quantity: '1' })), null, 'USD from an EUR tranche');
  granted(await L.debit(debit({ quantity: '1' })), 'the minimum legal debit: 1 minor unit');
  assert.equal(await consumed(L, 'execution'), '1');
  await L.close();
  assert.equal(await truth(port, 'execution'), '1');
  assert.equal(await truth(port, 'execution', 'cash', 'eur'), '1');
});

// ---------------------------------------------------------------------------------------------- red-team r1

// rows reads every projection row as (table, body without journal_offset, journal_offset).
function rows(p: string): { body: string; o: number }[] {
  const db = new DatabaseSync(p, { readOnly: true });
  try {
    const out: { body: string; o: number }[] = [];
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((r: any) => r.name as string);
    for (const t of tables) {
      for (const r of db.prepare(`SELECT * FROM "${t.replaceAll('"', '""')}"`).all() as any[]) {
        const { journal_offset, ...rest } = r;
        out.push({ body: t + JSON.stringify(rest, (_k, v) => (typeof v === 'bigint' ? String(v) : v)), o: Number(journal_offset) });
      }
    }
    return out;
  } finally {
    db.close();
  }
}

test('B1_18_IdempotencyKeyCoversTrancheResourceAndUnit', async () => {
  // Red-team r1 gap 1. The key's digest covers the tranche, the resource and the unit: reusing a key for a debit
  // that differs only there is a conflict, never a replay that silently drops the second debit.
  const { port, L } = await fresh();
  granted(await L.openTranche(tranche('t2')), 'open t2');
  const dd = debit({ idempotency_key: 'k-x', quantity: '40' });
  const s = granted(await L.debit(dd), 'first');
  refused(await L.debit({ ...dd, tranche: 't2' }), 'idempotency_conflict', 'same key, other tranche');
  refused(await L.debit({ ...dd, amount: { resource: 'allowance', unit: ALLOW, quantity: '40' } }), 'idempotency_conflict', 'same key, allowance');
  const k2 = debit({ idempotency_key: 'k-y', resource: 'allowance', quantity: '5' });
  granted(await L.debit(k2), 'an allowance debit');
  const otherUnit = await L.debit({ ...k2, amount: { ...k2.amount, unit: 'chatgpt-1/weekly' } });
  assert.equal(otherUnit.ok, false, `same key, other unit, is never a replay: ${JSON.stringify(otherUnit)}`);
  assert.deepEqual(await L.debit({ ...dd }), { ok: true, seq: s, replayed: true }, 'the true retry still replays');
  assert.equal(await consumed(L, 'execution', 'cash', 't2'), '0');
  assert.equal(await consumed(L, 'execution', 'allowance'), '5');
  await L.close();
  // The same holds for a second ledger that learns the keys only from the Journal.
  const B = await open(port, join(dir(), 'b.db'));
  refused(await B.debit({ ...dd, tranche: 't2' }), 'idempotency_conflict', 'other tranche, from another ledger');
  assert.equal(await consumed(B, 'execution', 'cash', 't2'), '0');
  await B.close();
});

test('B1_18_ForeignProjectionIsNotTrusted', async () => {
  // Red-team r1 gap 2. A projection built on Journal X is opened against Journal Y whose head has the SAME seq
  // but different events. Catch-up must check the head event itself, not only its seq: the ledger rebuilds
  // from Y or refuses, and never grants on X's balances.
  const X = new MemPort();
  const px = join(dir(), 'p.db');
  const LX = await open(X, px);
  granted(await LX.openTranche(tranche()), 'X open');
  granted(await LX.debit(debit({ quantity: '10' })), 'X spends 10');
  await LX.close();
  const Y = new MemPort();
  const LY = await open(Y, join(dir(), 'y.db'));
  granted(await LY.openTranche(tranche()), 'Y open');
  granted(await LY.debit(debit({ quantity: '6000' })), 'Y spends 6000');
  await LY.close();
  assert.equal(X.count(), Y.count(), 'the two Journals are the same length');
  const n = Y.count();
  const L = await tryOpen(Y, px);
  if (L) {
    const r = await L.debit(debit({ quantity: '1000' }));
    assert.equal(r.ok, false, `a projection built on another Journal never grants past this one: ${JSON.stringify(r)}`);
    let b: budget.Balance | null = null;
    try {
      b = await L.balance('t1', 'execution', 'cash');
    } catch {
      // refusing to answer is failing closed
    }
    if (b) assert.equal(b.consumed, '6000', 'any balance it reports is Y\'s');
    await L.close();
  }
  assert.equal(Y.count(), n, 'nothing appended to Y');
  assert.equal(await truth(Y, 'execution'), '6000');
});

test('B1_18_CrashAtEveryProjectionWrite', { timeout: 180000 }, async () => {
  // Red-team r1 gap 3. The projection write is atomic: a child SIGKILLs itself right after its Nth node:sqlite
  // call, N = 1..16. Reopened over that projection, the ledger equals a rebuild from zero, and every appended
  // key replays (strictly replayed for every debit the child reported).
  for (let killAt = 1; killAt <= 16; killAt++) {
    const d = dir();
    const journal = join(d, 'journal.jsonl');
    const projection = join(d, 'child.db');
    const port = new FilePort(journal);
    const L0 = await open(port, join(d, 'setup.db'));
    granted(await L0.openTranche(tranche()), 'open');
    await L0.close();
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], {
      env: { ...process.env, [SWEEP_ENV]: JSON.stringify({ journal, projection, killAt }) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (b) => (out += b));
    child.stderr.on('data', (b) => (err += b));
    await new Promise((r) => (child.exitCode !== null || child.signalCode !== null ? r(null) : child.on('exit', r)));
    assert.equal(child.signalCode, 'SIGKILL', `killAt ${killAt}: the child killed itself: ${err.slice(-400)}`);
    assert.ok(!out.includes('refused'), `killAt ${killAt}: no child debit was refused: ${out.slice(-300)}`);
    const reported = out.split('\n').filter((l) => l.startsWith('ok ')).length;
    const rebuilt = Number(await truth(port, 'execution'));
    assert.ok(rebuilt >= reported && rebuilt <= reported + 1, `killAt ${killAt}: rebuild ${rebuilt} for ${reported} reported`);
    const L = await open(port, projection);
    assert.equal(await consumed(L, 'execution'), String(rebuilt), `killAt ${killAt}: the crashed projection agrees with a rebuild`);
    for (let i = 0; i < rebuilt; i++) {
      const r = await L.debit({
        idempotency_key: `crash-${i}`,
        tranche: 't1',
        attempt: 'a1',
        purpose: 'execution',
        charged_pool: 'execution',
        amount: { resource: 'cash', unit: USD, quantity: '1' },
      });
      assert.equal(r.ok, true, `killAt ${killAt}: crash-${i} is found: ${JSON.stringify(r)}`);
      if (i < reported) assert.equal((r as { replayed: boolean }).replayed, true, `killAt ${killAt}: crash-${i} replays`);
    }
    assert.equal(await consumed(L, 'execution'), String(rebuilt), `killAt ${killAt}: replays added nothing`);
    await L.close();
  }
});

test('B1_18_ReadFailureDeniesWithAWarmProjection', async () => {
  // Red-team r1 gap 4. The projection is warm and the append path is healthy, but the Journal cannot be read:
  // the debit is `unavailable` and nothing is appended. The ledger never debits on projection state alone.
  const { port, L } = await fresh();
  granted(await L.debit(debit({ quantity: '10' })), 'warm');
  const n = port.count();
  port.failRead = true;
  refused(await L.debit(debit({ quantity: '1' })), 'unavailable', 'unreadable Journal, healthy appends');
  refused(await L.debit(debit({ purpose: 'judging', quantity: '1' })), 'unavailable', 'the same for judging');
  port.failRead = false;
  assert.equal(port.count(), n, 'nothing appended');
  assert.equal(await consumed(L, 'execution'), '10');
  await L.close();
  // Same after a restart over the warm projection file.
  const { port: p2, d, L: L2 } = await fresh();
  granted(await L2.debit(debit({ quantity: '10' })), 'warm');
  await L2.close();
  const m = p2.count();
  p2.failRead = true;
  const L3 = await tryOpen(p2, join(d, 'p.db'));
  if (L3) {
    refused(await L3.debit(debit({ quantity: '1' })), 'unavailable', 'unreadable Journal after restart');
    await L3.close();
  }
  p2.failRead = false;
  assert.equal(p2.count(), m, 'nothing appended after restart');
});

test('B1_18_TrancheOpenRaceRechecks', async () => {
  // Red-team r1 gap 5. B is opening t1 with bigger holds; after B's first read, A opens t1 and spends 6000.
  // B's append loses the compare-and-swap and must re-check: t1 now exists with other holds, so B is refused.
  // Exactly A's two events are appended; B never appends a second open that would top the tranche up.
  const port = new MemPort();
  const A = await open(port, join(dir(), 'a.db'));
  const B = await open(port, join(dir(), 'b.db'));
  let fired = false;
  port.cutIn = async () => {
    fired = true;
    granted(await A.openTranche(tranche()), 'A opens');
    granted(await A.debit(debit({ quantity: '6000' })), 'A spends 6000');
  };
  const bigger = tranche();
  bigger.holds[0] = { hold: 'execution', amount: { resource: 'cash', unit: USD, quantity: '99999' } };
  const n0 = port.count();
  const r = await B.openTranche(bigger);
  assert.equal(fired, true, 'the cut-in ran');
  assert.equal(r.ok, false, `B lost the race with a different spec: ${JSON.stringify(r)}`);
  assert.equal(port.count(), n0 + 2, 'only A appended');
  refused(await B.debit(debit({ quantity: '401' })), 'insufficient', 'still 400 left');
  assert.equal(await truth(port, 'execution'), '6000');
  await A.close();
  await B.close();
});

test('B1_18_ChangedRowsCarryTheirDebitSeq', async () => {
  // Red-team r1 gap 6 (09a §4.1: every projection row carries its source offset). After each debit, every row
  // whose content that debit changed carries that debit's seq as journal_offset, across pools and resources.
  const { port, d, L } = await fresh();
  const p = join(d, 'p.db');
  granted(await L.debit(debit({ quantity: '10' })), 'warm');
  await L.close();
  const steps: Debit[] = [
    debit({ purpose: 'judging', quantity: '7' }),
    debit({ quantity: '3' }),
    debit({ resource: 'allowance', quantity: '2' }),
    debit({ purpose: 'judging', resource: 'verifier_window', unit: 'window', quantity: '1' }),
  ];
  for (const st of steps) {
    const before = new Set(rows(p).map((r) => r.body));
    const X = await open(port, p);
    const s = granted(await X.debit(st), `debit ${st.idempotency_key}`);
    await X.close();
    const changed = rows(p).filter((r) => !before.has(r.body));
    assert.ok(changed.length > 0, `debit ${st.idempotency_key} changed some row`);
    for (const r of changed) assert.equal(r.o, s, `changed row ${r.body} carries seq ${s}`);
  }
});
