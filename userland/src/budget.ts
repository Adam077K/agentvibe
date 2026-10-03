// Budget Ledger v1 on the Journal (B1-18; docs/vision-v3/09b-ECONOMICS-EVALS-SIM-IMPROVEMENT.md §1, §3, §3.1,
// §4; 09a-ENGINEERING.md §4.1-§4.2). Allocation's account of the four resources (plus verifier windows) per
// tranche. This file is NOT registered in build/done-tests/B1-18.yml: it is the interface the job implements.
// Every entry point throws ErrNotImplemented until B1-18 lands.
//
// WHERE IT LIVES. Allocation is Userland (jobs.yml B1-18 `protected_base: false`), so the ledger never opens
// the Journal: it reaches it through a JournalPort. In production the port is the command socket's
// propose_event (B1-03: expect_seq optimistic concurrency, result {stream, seq, hash}) plus a read path the
// socket does not have yet (B1-19 owns command-API reads). The Journal is the canonical store; the SQLite
// projection at `projectionPath` is rebuilt from it, never trusted over it, and every projection row carries
// the `journal_offset` it was built from (09a §4.1: "Every projection row carries its (stream, seq) source
// offset and is rebuilt, never repaired by hand").
//
// QUANTITIES are decimal strings of a non-negative integer in the hold's own unit, at most 2^63-1, so they
// fit a SQLite INTEGER (09b §3: "fixed-precision decimal string, never float money"). A resource is never
// converted into another (09b §1: "admission compares component by component").
//
// B1-27 (spend-cap reservation buckets) builds on this: it adds a bucket hold checked before every debit and
// an `invariant_violation` event. Nothing here implements it; `Debit.reservation_ref` is the seam.

export class ErrNotImplemented extends Error {
  constructor() {
    super('budget: not implemented');
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
  | 'idempotency_conflict' // the key was used before for a different debit
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

export async function openLedger(_opts: { journal: JournalPort; projectionPath: string }): Promise<Ledger> {
  throw new ErrNotImplemented();
}
