// Budget ledger regressions that the frozen done-test (budget.donetest.test.ts) does not pin. Review of B1-18:
// (1) the SQLite file is a cache, never the state a grant is decided from; (2) ids and keys are well-formed
// text. Run: node --test userland/test/budget.test.ts   (Node 24; node:sqlite is built in)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openLedger } from '../src/budget.ts';
import type { Debit, JournalPort, Ledger, PortEvent, Result, TrancheSpec } from '../src/budget.ts';

class MemPort implements JournalPort {
  events = new Map<string, { seq: number; type: string; data: string }[]>();
  async propose(p: { stream: string; expect_seq: number; type: string; data: unknown }) {
    const s = this.events.get(p.stream) ?? [];
    if (p.expect_seq !== s.length) return { ok: false as const, reason: 'seq_conflict' as const };
    s.push({ seq: s.length + 1, type: p.type, data: JSON.stringify(p.data) });
    this.events.set(p.stream, s);
    return { ok: true as const, stream: p.stream, seq: s.length, hash: `h${s.length}` };
  }
  async read(stream: string, fromSeq: number): Promise<PortEvent[]> {
    return (this.events.get(stream) ?? []).filter((e) => e.seq >= fromSeq).map((e) => ({ stream, seq: e.seq, type: e.type, data: JSON.parse(e.data) }));
  }
  count(): number {
    let n = 0;
    for (const s of this.events.values()) n += s.length;
    return n;
  }
}

const USD = 'cash:USD';
const spec = (id = 't1'): TrancheSpec => ({
  id,
  venture: 'agency',
  mission: 'agency/offer-validation',
  holds: [
    { hold: 'execution', amount: { resource: 'cash', unit: USD, quantity: '6400' } },
    { hold: 'acceptance', amount: { resource: 'cash', unit: USD, quantity: '2000' } },
    { hold: 'recovery', amount: { resource: 'cash', unit: USD, quantity: '2000' } },
  ],
});
let n = 0;
const debit = (quantity: string, over: Partial<Debit> = {}): Debit => ({
  idempotency_key: `k-${++n}`,
  tranche: 't1',
  attempt: 'a1',
  purpose: 'execution',
  charged_pool: 'execution',
  amount: { resource: 'cash', unit: USD, quantity },
  ...over,
});

const path = () => join(mkdtempSync(join(tmpdir(), 'b118r-')), 'p.db');
const ok = (r: Result, what: string): number => {
  assert.equal(r.ok, true, `${what}: ${JSON.stringify(r)}`);
  return (r as { seq: number }).seq;
};
const refusedWith = (r: Result, code: string, what: string) => assert.deepEqual(r, { ok: false, code }, what);
const tamper = (p: string, ...sql: string[]) => {
  const db = new DatabaseSync(p);
  try {
    for (const s of sql) db.exec(s);
  } finally {
    db.close();
  }
};
const fileConsumed = (p: string): string => {
  const db = new DatabaseSync(p, { readOnly: true });
  try {
    db.prepare('SELECT 1').get();
    const r = db.prepare("SELECT CAST(consumed AS TEXT) AS c FROM balances WHERE tranche = 't1' AND hold = 'execution'").get() as { c: string };
    return r.c;
  } finally {
    db.close();
  }
};
// fileDump is every row of every projection table, in a fixed order, as text.
const fileDump = (p: string): string => {
  const db = new DatabaseSync(p, { readOnly: true });
  try {
    return ['meta', 'tranches', 'balances', 'idempotency']
      .map((t) =>
        db
          .prepare(`SELECT * FROM ${t} ORDER BY 1, 2, 3`)
          .all()
          .map((r) => `${t} ${JSON.stringify(r)}`)
          .join('\n'),
      )
      .join('\n');
  } finally {
    db.close();
  }
};
async function spent6400(): Promise<{ port: MemPort; p: string; L: Ledger }> {
  const port = new MemPort();
  const p = path();
  const L = await openLedger({ journal: port, projectionPath: p });
  ok(await L.openTranche(spec()), 'open');
  ok(await L.debit(debit('6400')), 'spend the whole execution hold');
  return { port, p, L };
}

test('B1_18_TamperedBalanceDoesNotOverspend', async () => {
  const { port, p, L } = await spent6400();
  await L.close();
  const events = port.count();
  tamper(p, 'UPDATE balances SET consumed = 0');
  const R = await openLedger({ journal: port, projectionPath: p });
  refusedWith(await R.debit(debit('6400')), 'insufficient', 'consumed zeroed in the file');
  assert.equal((await R.balance('t1', 'execution', 'cash')).consumed, '6400');
  assert.equal(port.count(), events, 'nothing appended');
  await R.close();
  assert.equal(fileConsumed(p), '6400', 'the file was rebuilt from the Journal');
});

test('B1_18_TamperedHoldDoesNotOverspend', async () => {
  const { port, p, L } = await spent6400();
  await L.close();
  tamper(p, 'UPDATE balances SET held = held * 1000');
  const R = await openLedger({ journal: port, projectionPath: p });
  refusedWith(await R.debit(debit('1')), 'insufficient', 'held inflated in the file');
  await R.close();
});

test('B1_18_TamperWhileOpenDoesNotOverspend', async () => {
  const port = new MemPort();
  const p = path();
  const L = await openLedger({ journal: port, projectionPath: p });
  ok(await L.openTranche(spec()), 'open');
  ok(await L.debit(debit('6000')), 'spend 6000');
  tamper(p, 'UPDATE balances SET consumed = 0');
  refusedWith(await L.debit(debit('6400')), 'insufficient', 'file edited under an open ledger');
  assert.equal(fileConsumed(p), '6000', 'the next catch-up repaired the file');
  ok(await L.debit(debit('400')), 'the true remainder');
  refusedWith(await L.debit(debit('1')), 'insufficient', 'then nothing is left');
  assert.equal(fileConsumed(p), '6400');
  await L.close();
});

test('B1_18_TamperedKeysAndHeadAreRebuiltAndNothingIsRegranted', async () => {
  const port = new MemPort();
  const p = path();
  const L0 = await openLedger({ journal: port, projectionPath: p });
  ok(await L0.openTranche(spec()), 'open');
  const spend = debit('6400');
  const seq = ok(await L0.debit(spend), 'spend the whole execution hold');
  await L0.close();
  const events = port.count();
  tamper(p, 'DELETE FROM idempotency', "UPDATE meta SET head_digest = 'forged'", 'UPDATE balances SET consumed = 0');
  const R = await openLedger({ journal: port, projectionPath: p });
  refusedWith(await R.debit(debit('6400')), 'insufficient', 'the overspend is refused');
  assert.deepEqual(await R.debit({ ...spend }), { ok: true, seq, replayed: true }, 'the forgotten key replays, not re-granted');
  assert.equal((await R.balance('t1', 'execution', 'cash')).consumed, '6400');
  assert.equal(port.count(), events, 'nothing appended');
  await R.close();
  assert.equal(fileConsumed(p), '6400', 'the file was rebuilt from the Journal');
  const fresh = path();
  const F = await openLedger({ journal: port, projectionPath: fresh });
  await F.balance('t1', 'execution', 'cash'); // the catch-up that fills a new file
  await F.close();
  assert.equal(fileDump(p), fileDump(fresh), 'the rebuilt projection equals a fresh rebuild');
});

test('B1_18_ForgedRowsAreNotTrusted', async () => {
  const port = new MemPort();
  const p = path();
  const L0 = await openLedger({ journal: port, projectionPath: p });
  ok(await L0.openTranche(spec()), 'open');
  const key = debit('100');
  const seq = ok(await L0.debit(key), 'debit');
  await L0.close();
  tamper(
    p,
    'DELETE FROM idempotency',
    "UPDATE meta SET head_digest = 'forged'",
    "INSERT INTO tranches VALUES ('ghost', 'v', 'm', 'd', 1)",
    "INSERT INTO balances VALUES ('ghost', 'execution', 'cash', 'cash:USD', 1000000, 0, 1)",
  );
  const events = port.count();
  const R = await openLedger({ journal: port, projectionPath: p });
  refusedWith(await R.debit(debit('1', { tranche: 'ghost' })), 'unknown_tranche', 'a tranche only the file knows');
  assert.deepEqual(await R.debit({ ...key }), { ok: true, seq, replayed: true }, 'a key the file forgot still replays');
  assert.equal((await R.balance('t1', 'execution', 'cash')).consumed, '100');
  assert.equal(port.count(), events, 'nothing appended');
  await R.close();
});

test('B1_18_LoneSurrogatesAreInvalid', async () => {
  const port = new MemPort();
  const L = await openLedger({ journal: port, projectionPath: path() });
  ok(await L.openTranche(spec()), 'open');
  const events = port.count();
  for (const bad of ['\ud800', 'k\udc00', 'a\ud83dz', '\udc00\ud800']) {
    refusedWith(await L.debit(debit('1', { attempt: bad })), 'invalid', `attempt ${JSON.stringify(bad)}`);
    refusedWith(await L.debit(debit('1', { idempotency_key: bad })), 'invalid', `key ${JSON.stringify(bad)}`);
    refusedWith(await L.debit(debit('1', { tranche: bad })), 'invalid', `tranche ${JSON.stringify(bad)}`);
    refusedWith(await L.debit(debit('1', { reservation_ref: bad })), 'invalid', `reservation_ref ${JSON.stringify(bad)}`);
    refusedWith(await L.openTranche({ ...spec('t2'), id: bad }), 'invalid', `tranche id ${JSON.stringify(bad)}`);
    refusedWith(await L.openTranche({ ...spec('t3'), mission: bad }), 'invalid', `mission ${JSON.stringify(bad)}`);
  }
  assert.equal(port.count(), events, 'nothing appended');
  // Control: a well-formed surrogate pair is ordinary text.
  ok(await L.debit(debit('1', { attempt: 'a\u{1f600}' })), 'a well-formed astral character');
  await L.close();
});
