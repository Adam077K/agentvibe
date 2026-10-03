// Budget Ledger v1 on the Journal (B1-18; docs/vision-v3/09b-ECONOMICS-EVALS-SIM-IMPROVEMENT.md §1, §3, §3.1,
// §4; 09a-ENGINEERING.md §4.1-§4.2). Allocation's account of the four resources (plus verifier windows) per
// tranche. This file is NOT registered in build/done-tests/B1-18.yml: it is the interface the job implements.
//
// WHERE IT LIVES. Allocation is Userland (jobs.yml B1-18 `protected_base: false`), so the ledger never opens
// the Journal: it reaches it through a JournalPort. In production the port is the command socket's
// propose_event (B1-03: expect_seq optimistic concurrency, result {stream, seq, hash}) plus a read path the
// socket does not have yet (B1-19 owns command-API reads). The Journal is the canonical store; the SQLite
// projection at `projectionPath` is rebuilt from it, never trusted over it, and every projection row carries
// the `journal_offset` it was built from (09a §4.1: "Every projection row carries its (stream, seq) source
// offset and is rebuilt, never repaired by hand").
//
// QUANTITIES are decimal strings of a positive integer in the hold's own unit, at most 2^63-1, so they fit a
// SQLite INTEGER (09b §3: "fixed-precision decimal string, never float money"). Integer minor units only: a
// fraction is refused and nothing is rounded. Cash is spelled `cash:<ISO4217>` in minor units (cash:USD =
// cents) and a tranche holds exactly one currency. Arithmetic is bigint throughout. A resource is never
// converted into another (09b §1: "admission compares component by component").
//
// HOW MONEY MOVES (fail closed)
//   - One Journal stream. A tranche opening and a debit are each ONE event, appended with expect_seq equal to
//     the head the decision was made at. Every grant is backed by a new event the Journal acknowledged: the
//     projection alone never grants. A failed read, a failed write or exhausted conflict retries is
//     `unavailable`, and nothing is granted.
//   - After a seq_conflict the ledger re-reads and decides again from the new head, so a balance another
//     ledger spent is never granted twice.
//   - Each event names the digest of the event before it (`prev`), so the head event's digest commits to the
//     whole history. Catch-up reads the stored head event back and compares its digest, not only its seq: a
//     projection built on another Journal, or a longer one the Journal has since lost, is wiped and rebuilt.
//   - The idempotency digest covers every field of the debit (key, tranche, attempt, purpose, pool, resource,
//     unit, quantity, reservation_ref): the same key with any difference is `idempotency_conflict`.
//   - Each event reaches the projection in one SQLite transaction, with its own seq as the journal_offset of
//     every row it changed. An event that does not validate on the way in (a bad digest, an overspend, a gap in
//     seq) stops catch-up: the ledger reports `unavailable` rather than guess.
//   - A lost acknowledgement (the append landed, the answer did not) is reported as `unavailable`; the retry
//     with the same key finds the event and returns it as a replay, so the money is counted once.
//
// The projection file is the ledger's own: a file that is not a budget projection is refused, never
// overwritten. Delete a budget projection and it rebuilds.
//
// B1-27 (spend-cap reservation buckets) builds on this: it adds a bucket hold checked before every debit and
// an `invariant_violation` event. Nothing here implements it; `Debit.reservation_ref` is the seam.
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

// Retained from the frozen stub's export surface; nothing in this file throws it now that B1-18 has landed.
export class ErrNotImplemented extends Error {
  constructor() {
    super('budget: not implemented');
  }
}

/** balance() cannot answer because the Journal or projection could not be read: no number is guessed. */
export class ErrUnavailable extends Error {
  constructor(why: string) {
    super(`budget: unavailable: ${why}`);
    this.name = 'ErrUnavailable';
  }
}

/** 09b §1: four resources, plus verifier windows. Never interchangeable. */
export type Resource = 'cash' | 'allowance' | 'throughput' | 'founder_minutes' | 'verifier_window';

/** 09b §4: a tranche's holds. The completion reserve is acceptance + recovery. */
export type Hold = 'execution' | 'integration_rework' | 'acceptance' | 'recovery';

/**
 * The purpose of a debit (09b §3.1). Each purpose charges exactly one hold:
 * execution → execution, integration_rework → integration_rework, judging → acceptance, recovery → recovery.
 */
export type Purpose = 'execution' | 'integration_rework' | 'judging' | 'recovery';

export type Amount = { resource: Resource; unit: string; quantity: string };

export type TrancheSpec = {
  id: string;
  venture: string;
  mission: string;
  holds: { hold: Hold; amount: Amount }[];
};

/** A consume against one hold of one tranche (09b §3 EconomicEvent, kind 'consume'). */
export type Debit = {
  idempotency_key: string; // a retry or replay carries the same key and is counted once
  tranche: string;
  attempt: string;
  purpose: Purpose;
  charged_pool: Hold; // refused unless it is the purpose's pool (09b §3.1)
  amount: Amount;
  reservation_ref?: string; // B1-27's bucket hold; unused by B1-18
};

export type RefusalCode =
  | 'invalid' // malformed input: a bad quantity, an unknown enum value, an empty key or id
  | 'pool_mismatch' // charged_pool is not the purpose's pool
  | 'insufficient' // the hold has less remaining than the debit, in that resource and unit
  | 'unknown_tranche'
  | 'incomplete' // a tranche without its completion reserve
  | 'idempotency_conflict' // the key was used before for a different debit (or the tranche id for another spec)
  | 'unavailable'; // the Journal or projection could not be read or written: fail closed, nothing granted

export type Granted = { ok: true; seq: number; replayed: boolean };
export type Refused = { ok: false; code: RefusalCode };
export type Result = Granted | Refused;

export type Balance = { held: string; consumed: string; remaining: string; journal_offset: number };

/** One event as the Journal returns it. */
export type PortEvent = { stream: string; seq: number; type: string; data: unknown };

/** The ledger's only way to the Journal (see WHERE IT LIVES). */
export interface JournalPort {
  /** Append iff expect_seq is the stream's head seq (0 for an empty stream). */
  propose(p: { stream: string; expect_seq: number; type: string; data: unknown }): Promise<
    { ok: true; stream: string; seq: number; hash: string } | { ok: false; reason: 'seq_conflict' | 'failed' }
  >;
  /** The stream's events with seq >= fromSeq, in seq order. */
  read(stream: string, fromSeq: number): Promise<PortEvent[]>;
}

export interface Ledger {
  openTranche(spec: TrancheSpec): Promise<Result>;
  debit(d: Debit): Promise<Result>;
  balance(tranche: string, hold: Hold, resource: Resource): Promise<Balance>;
  close(): Promise<void>;
}

const STREAM = 'budget';
const TRANCHE_OPENED = 'budget.tranche_opened';
const DEBITED = 'budget.debited';

// Appends tried against a moving head before the ledger gives up and denies.
const MAX_ATTEMPTS = 16;
const MAX_QUANTITY = 9223372036854775807n; // 2^63-1: the largest quantity a SQLite INTEGER holds
const MAX_TEXT = 256;
const MAX_HOLDS = 64;
const APPLICATION_ID = 0x42314c47; // "B1LG": marks a SQLite file as this ledger's projection
const SCHEMA_VERSION = 1;

const RESOURCES: readonly Resource[] = ['cash', 'allowance', 'throughput', 'founder_minutes', 'verifier_window'];
const HOLDS: readonly Hold[] = ['execution', 'integration_rework', 'acceptance', 'recovery'];
const PURPOSES: readonly Purpose[] = ['execution', 'integration_rework', 'judging', 'recovery'];
// The charging table (09b §3.1): one pool per purpose.
const POOL: Record<Purpose, Hold> = {
  execution: 'execution',
  integration_rework: 'integration_rework',
  judging: 'acceptance',
  recovery: 'recovery',
};

const QUANTITY = /^[1-9][0-9]{0,18}$/;
const CASH_UNIT = /^cash:[A-Z]{3}$/;
const OTHER_UNIT = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;
const CONTROL = /[\x00-\x1f\x7f]/;

// ---------------------------------------------------------------------------------------------- parsing

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function member<T extends string>(list: readonly T[], v: unknown): T | null {
  return list.find((x) => x === v) ?? null;
}

// An id, key or label: a non-empty string without control characters.
function text(v: unknown): string | null {
  return typeof v === 'string' && v.length >= 1 && v.length <= MAX_TEXT && !CONTROL.test(v) ? v : null;
}

function parseAmount(v: unknown): Amount | null {
  if (!isRecord(v)) return null;
  const resource = member(RESOURCES, v.resource);
  if (resource === null) return null;
  const unit = v.unit;
  if (typeof unit !== 'string' || !(resource === 'cash' ? CASH_UNIT : OTHER_UNIT).test(unit)) return null;
  const quantity = v.quantity;
  if (typeof quantity !== 'string' || !QUANTITY.test(quantity) || BigInt(quantity) > MAX_QUANTITY) return null;
  return { resource, unit, quantity };
}

// parseDebit returns the debit in its one canonical shape, or null if anything is malformed.
function parseDebit(v: unknown): Debit | null {
  if (!isRecord(v)) return null;
  const idempotency_key = text(v.idempotency_key);
  const tranche = text(v.tranche);
  const attempt = text(v.attempt);
  const purpose = member(PURPOSES, v.purpose);
  const charged_pool = member(HOLDS, v.charged_pool);
  const amount = parseAmount(v.amount);
  if (idempotency_key === null || tranche === null || attempt === null) return null;
  if (purpose === null || charged_pool === null || amount === null) return null;
  const d: Debit = { idempotency_key, tranche, attempt, purpose, charged_pool, amount };
  if (v.reservation_ref !== undefined) {
    const ref = text(v.reservation_ref);
    if (ref === null) return null;
    d.reservation_ref = ref;
  }
  return d;
}

// parseTranche returns the spec in its canonical shape (holds in a fixed order), or null if malformed. Beyond
// shape it enforces: no hold twice for one resource, one currency per tranche, and the per-resource total of
// the holds within 2^63-1 (09b §4: cash_cap = every hold below).
function parseTranche(v: unknown): TrancheSpec | null {
  if (!isRecord(v)) return null;
  const id = text(v.id);
  const venture = text(v.venture);
  const mission = text(v.mission);
  if (id === null || venture === null || mission === null) return null;
  if (!Array.isArray(v.holds) || v.holds.length > MAX_HOLDS) return null;
  const holds: TrancheSpec['holds'] = [];
  const seen = new Set<string>();
  const totals = new Map<Resource, bigint>();
  let currency: string | null = null;
  for (const raw of v.holds as unknown[]) {
    if (!isRecord(raw)) return null;
    const hold = member(HOLDS, raw.hold);
    const amount = parseAmount(raw.amount);
    if (hold === null || amount === null) return null;
    if (seen.has(`${hold}/${amount.resource}`)) return null;
    seen.add(`${hold}/${amount.resource}`);
    if (amount.resource === 'cash') {
      if (currency !== null && currency !== amount.unit) return null;
      currency = amount.unit;
    }
    const total = (totals.get(amount.resource) ?? 0n) + BigInt(amount.quantity);
    if (total > MAX_QUANTITY) return null;
    totals.set(amount.resource, total);
    holds.push({ hold, amount });
  }
  holds.sort((a, b) => HOLDS.indexOf(a.hold) - HOLDS.indexOf(b.hold) || RESOURCES.indexOf(a.amount.resource) - RESOURCES.indexOf(b.amount.resource));
  return { id, venture, mission, holds };
}

// 09b §4: a tranche reserves its completion reserve (acceptance and recovery) together with execution.
const incomplete = (t: TrancheSpec): boolean =>
  !t.holds.some((h) => h.hold === 'acceptance') || !t.holds.some((h) => h.hold === 'recovery');

// ---------------------------------------------------------------------------------------------- digests

// canon: JSON with object keys sorted, so a digest does not depend on the order a Journal returns keys in.
function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (isRecord(v)) {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canon(v[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(v);
}

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

/** The digest an idempotency key (or a tranche id) is bound to. */
const contentDigest = (kind: 'debit' | 'tranche', v: unknown): string => sha256(canon([kind, v]));

/** An event's digest: its type and data, and through `prev` in the data, every event before it. */
const eventDigest = (e: { type: string; data: unknown }): string => sha256(canon([e.type, e.data]));

// ---------------------------------------------------------------------------------------------- projection

type Head = { seq: number; digest: string };
type BalanceRow = { unit: string; held: bigint; consumed: bigint; journal_offset: number };

const EMPTY: Head = { seq: 0, digest: '' };

const SCHEMA = `
BEGIN;
DROP TABLE IF EXISTS meta;
DROP TABLE IF EXISTS tranches;
DROP TABLE IF EXISTS balances;
DROP TABLE IF EXISTS idempotency;
CREATE TABLE meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  head_digest TEXT NOT NULL,
  journal_offset INTEGER NOT NULL CHECK (journal_offset >= 1)
);
CREATE TABLE tranches (
  id TEXT PRIMARY KEY,
  venture TEXT NOT NULL,
  mission TEXT NOT NULL,
  digest TEXT NOT NULL,
  journal_offset INTEGER NOT NULL CHECK (journal_offset >= 1)
) WITHOUT ROWID;
CREATE TABLE balances (
  tranche TEXT NOT NULL,
  hold TEXT NOT NULL,
  resource TEXT NOT NULL,
  unit TEXT NOT NULL,
  held INTEGER NOT NULL CHECK (held >= 1),
  consumed INTEGER NOT NULL CHECK (consumed >= 0 AND consumed <= held),
  journal_offset INTEGER NOT NULL CHECK (journal_offset >= 1),
  PRIMARY KEY (tranche, hold, resource)
) WITHOUT ROWID;
CREATE TABLE idempotency (
  idempotency_key TEXT PRIMARY KEY,
  digest TEXT NOT NULL,
  journal_offset INTEGER NOT NULL CHECK (journal_offset >= 1)
) WITHOUT ROWID;
PRAGMA application_id = ${APPLICATION_ID};
PRAGMA user_version = ${SCHEMA_VERSION};
COMMIT;
`;

// openStore opens the projection. A fresh or deleted file is initialised in one transaction; a file that is
// not this ledger's projection (another database, or not a database) throws and is left untouched.
function openStore(path: string) {
  const db = new DatabaseSync(path);
  const query = (sql: string) => {
    const s = db.prepare(sql);
    s.setReadBigInts(true);
    return s;
  };
  try {
    const pragma = (name: string) => Number((query(`PRAGMA ${name}`).get() as Record<string, bigint>)[name]);
    const appId = pragma('application_id');
    const version = pragma('user_version');
    if (appId !== APPLICATION_ID || version !== SCHEMA_VERSION) {
      const objects = (query('SELECT count(*) AS n FROM sqlite_master').get() as { n: bigint }).n;
      if (appId !== APPLICATION_ID && (appId !== 0 || objects !== 0n)) {
        throw new Error(`budget: ${path} is not a budget projection; refusing to open it`);
      }
      db.exec(SCHEMA); // new, or this ledger's own older schema: disposable, rebuilt from the Journal
    }
  } catch (e) {
    db.close();
    throw e;
  }

  const selectHead = query('SELECT head_digest, journal_offset FROM meta WHERE id = 1');
  const selectKey = query('SELECT digest, journal_offset FROM idempotency WHERE idempotency_key = ?');
  const selectTranche = query('SELECT digest, journal_offset FROM tranches WHERE id = ?');
  const selectBalance = query('SELECT unit, held, consumed, journal_offset FROM balances WHERE tranche = ? AND hold = ? AND resource = ?');
  const putHead = db.prepare('INSERT OR REPLACE INTO meta (id, head_digest, journal_offset) VALUES (1, ?, ?)');
  const putTranche = db.prepare('INSERT INTO tranches (id, venture, mission, digest, journal_offset) VALUES (?, ?, ?, ?, ?)');
  const putBalance = db.prepare(
    'INSERT INTO balances (tranche, hold, resource, unit, held, consumed, journal_offset) VALUES (?, ?, ?, ?, ?, 0, ?)',
  );
  const putConsumed = db.prepare('UPDATE balances SET consumed = ?, journal_offset = ? WHERE tranche = ? AND hold = ? AND resource = ?');
  const putKey = db.prepare('INSERT INTO idempotency (idempotency_key, digest, journal_offset) VALUES (?, ?, ?)');

  // atomic runs fn in one transaction: all of an event's rows land, or none do.
  function atomic<T>(fn: () => T): T {
    db.exec('BEGIN IMMEDIATE');
    try {
      const r = fn();
      db.exec('COMMIT');
      return r;
    } catch (e) {
      try {
        db.exec('ROLLBACK');
      } catch {
        // the original error is the one to report
      }
      throw e;
    }
  }

  function head(): Head {
    const r = selectHead.get() as { head_digest: string; journal_offset: bigint } | undefined;
    return r === undefined ? EMPTY : { seq: Number(r.journal_offset), digest: r.head_digest };
  }

  function balance(tranche: string, hold: string, resource: string): BalanceRow | null {
    const r = selectBalance.get(tranche, hold, resource) as
      | { unit: string; held: bigint; consumed: bigint; journal_offset: bigint }
      | undefined;
    return r === undefined ? null : { unit: r.unit, held: r.held, consumed: r.consumed, journal_offset: Number(r.journal_offset) };
  }

  function claim(kind: 'key' | 'tranche', id: string): { digest: string; seq: number } | null {
    const r = (kind === 'key' ? selectKey : selectTranche).get(id) as { digest: string; journal_offset: bigint } | undefined;
    return r === undefined ? null : { digest: r.digest, seq: Number(r.journal_offset) };
  }

  // applyEvent folds one Journal event into the projection, atomically. It throws on anything that does not
  // validate: an event out of sequence, one whose `prev` is not the head, a malformed or mis-digested payload,
  // a duplicate id, or a debit the hold cannot cover. The caller stops catching up and denies.
  function applyEvent(e: PortEvent, at: Head): Head {
    if (!isRecord(e) || e.stream !== STREAM || e.seq !== at.seq + 1) throw new Error(`budget: journal event out of sequence after ${at.seq}`);
    const data = e.data;
    if (!isRecord(data) || data.prev !== at.digest) throw new Error(`budget: event ${e.seq} does not follow event ${at.seq}`);
    const next: Head = { seq: e.seq, digest: eventDigest(e) };
    atomic(() => {
      if (e.type === TRANCHE_OPENED) {
        const t = parseTranche(data.tranche);
        if (t === null || incomplete(t) || data.digest !== contentDigest('tranche', t)) throw new Error(`budget: event ${e.seq} is not a valid tranche`);
        putTranche.run(t.id, t.venture, t.mission, data.digest as string, e.seq);
        for (const h of t.holds) putBalance.run(t.id, h.hold, h.amount.resource, h.amount.unit, BigInt(h.amount.quantity), e.seq);
      } else if (e.type === DEBITED) {
        const d = parseDebit(data.debit);
        if (d === null || d.charged_pool !== POOL[d.purpose] || data.digest !== contentDigest('debit', d)) {
          throw new Error(`budget: event ${e.seq} is not a valid debit`);
        }
        const row = balance(d.tranche, d.charged_pool, d.amount.resource);
        const consumed = row === null ? 0n : row.consumed + BigInt(d.amount.quantity);
        if (row === null || row.unit !== d.amount.unit || consumed > row.held) throw new Error(`budget: event ${e.seq} overspends its hold`);
        putConsumed.run(consumed, e.seq, d.tranche, d.charged_pool, d.amount.resource);
        putKey.run(d.idempotency_key, data.digest as string, e.seq);
      } else {
        throw new Error(`budget: event ${e.seq} has unknown type ${JSON.stringify(e.type)}`);
      }
      putHead.run(next.digest, next.seq);
    });
    return next;
  }

  return {
    head,
    balance,
    claim,
    apply(events: PortEvent[], from: Head): Head {
      let at = from;
      for (const e of events) at = applyEvent(e, at);
      return at;
    },
    // reset empties the projection (the ledger reads the Journal again from the start).
    reset(): void {
      atomic(() => {
        for (const t of ['meta', 'tranches', 'balances', 'idempotency']) db.exec(`DELETE FROM ${t}`);
      });
    },
    close(): void {
      db.close();
    },
  };
}

// ---------------------------------------------------------------------------------------------- ledger

const refuse = (code: RefusalCode): Refused => ({ ok: false, code });
const granted = (seq: number, replayed: boolean): Granted => ({ ok: true, seq, replayed });

type Append = { type: string; data: Record<string, unknown> };

export async function openLedger(opts: { journal: JournalPort; projectionPath: string }): Promise<Ledger> {
  const { journal } = opts;
  const store = openStore(opts.projectionPath);
  let closed = false;

  // One operation at a time per ledger: the head a decision is made at must not move under it except by
  // another ledger, which the append's compare-and-swap catches.
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn);
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };

  async function readFrom(fromSeq: number): Promise<PortEvent[]> {
    const events = await journal.read(STREAM, fromSeq);
    if (!Array.isArray(events)) throw new Error('budget: journal read did not return a list');
    return events;
  }

  // catchUp brings the projection to the Journal's head and returns it. It reads the stored head event back
  // and compares its digest: a projection that is not a prefix of this Journal is emptied and rebuilt. A
  // read that fails throws.
  async function catchUp(): Promise<Head> {
    const at = store.head();
    if (at.seq > 0) {
      const [tip, ...fresh] = await readFrom(at.seq);
      if (tip !== undefined && tip.seq === at.seq && tip.stream === STREAM && eventDigest(tip) === at.digest) return store.apply(fresh, at);
      store.reset();
    }
    return store.apply(await readFrom(1), EMPTY);
  }

  // admit decides from the Journal's head and appends. `decide` returns a final answer (a refusal or a
  // replay) or the event to append. A lost compare-and-swap re-reads and decides again from the new head.
  async function admit(decide: (head: Head) => Result | Append): Promise<Result> {
    try {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const head = await catchUp();
        const verdict = decide(head);
        if ('ok' in verdict) return verdict;
        const r = await journal.propose({
          stream: STREAM,
          expect_seq: head.seq,
          type: verdict.type,
          data: { prev: head.digest, ...verdict.data },
        });
        if (r.ok === true) {
          if (r.seq !== head.seq + 1) return refuse('unavailable');
          // The acknowledged event is the grant. Folding it into the projection now is a courtesy: if that
          // read fails, the next call catches up.
          await catchUp().catch(() => undefined);
          return granted(r.seq, false);
        }
        if (r.reason !== 'seq_conflict') return refuse('unavailable');
      }
    } catch {
      // The Journal or the projection could not be read or written: deny.
    }
    return refuse('unavailable');
  }

  return {
    openTranche: (raw) =>
      serial(async () => {
        if (closed) return refuse('unavailable');
        const spec = parseTranche(raw);
        if (spec === null) return refuse('invalid');
        if (incomplete(spec)) return refuse('incomplete');
        const digest = contentDigest('tranche', spec);
        return admit(() => {
          const open = store.claim('tranche', spec.id);
          if (open !== null) return open.digest === digest ? granted(open.seq, true) : refuse('idempotency_conflict');
          return { type: TRANCHE_OPENED, data: { digest, tranche: spec } };
        });
      }),

    debit: (raw) =>
      serial(async () => {
        if (closed) return refuse('unavailable');
        const d = parseDebit(raw);
        if (d === null) return refuse('invalid');
        if (d.charged_pool !== POOL[d.purpose]) return refuse('pool_mismatch');
        const digest = contentDigest('debit', d);
        return admit(() => {
          const seen = store.claim('key', d.idempotency_key);
          if (seen !== null) return seen.digest === digest ? granted(seen.seq, true) : refuse('idempotency_conflict');
          if (store.claim('tranche', d.tranche) === null) return refuse('unknown_tranche');
          const row = store.balance(d.tranche, d.charged_pool, d.amount.resource);
          if (row === null || row.unit !== d.amount.unit || BigInt(d.amount.quantity) > row.held - row.consumed) return refuse('insufficient');
          return { type: DEBITED, data: { digest, debit: d } };
        });
      }),

    balance: (tranche, hold, resource) =>
      serial(async () => {
        if (closed) throw new ErrUnavailable('the ledger is closed');
        try {
          const head = await catchUp();
          const row = store.balance(tranche, hold, resource);
          if (row === null) return { held: '0', consumed: '0', remaining: '0', journal_offset: head.seq };
          return {
            held: String(row.held),
            consumed: String(row.consumed),
            remaining: String(row.held - row.consumed),
            journal_offset: row.journal_offset,
          };
        } catch (e) {
          throw new ErrUnavailable(e instanceof Error ? e.message : 'the Journal or projection could not be read');
        }
      }),

    close: () =>
      serial(async () => {
        if (closed) return;
        closed = true;
        store.close();
      }),
  };
}
