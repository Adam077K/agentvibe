// server/lib/claim-shape.ts — the one runtime check on a claim's SHAPE, for both paths that
// load claims into Mission Control, and for the fixtures that stand in for them.
//
// WHY THIS EXISTS RATHER THAN A CAST (issue #53). Two loaders, one subsystem:
//
//   ~/.warroom/ledger/global.yml   parsed to `unknown`, then validateClaim  — CHECKED
//   .claude/ledger/index.json      `JSON.parse(raw) as { claims?: LedgerClaim[] }` — ASSERTED
//
// A cast to a concrete interface tells tsc the data already conforms, so tsc stops asking. That
// is precisely why dropping `source_line` from scripts/ledger.mjs's KEY_ORDER produced no type
// error anywhere and reached the UI as `file:undefined`: the cast had already promised the
// compiler the field was there. `source_file` sits in the same struct with the same legs.
//
// AND THE VALIDATED PATH STOPPED ONE LINE SHORT. belief.ts validated each entry and then wrote
// `const claim = c as GlobalClaim` — re-asserting `source_file: string` about an object
// validateClaim had just guaranteed does NOT carry it, since that schema is closed and
// `source_file` is not in it. Only a literal stamp two lines later made the assertion true, and
// nothing forced the stamp to stay. Both producer paths could therefore deliver
// `source_file: undefined` to the view, and both routed around the type system through a cast
// rather than through it.
//
// So the rule this file implements is: cast to `unknown` → validate → KEEP the validated type.
// Every exported function returns a claim BUILT from fields it read and type-checked, never one
// asserted over the input. The object literals at the bottom of each are load-bearing: add a
// required field to LedgerClaim and they stop compiling, which is the compile-time half of the
// guarantee the runtime checks give.
//
// WHY validateClaim CANNOT BE USED ALONE. Its field set is closed (scripts/lib/claims.js:586)
// and `source_file` is not in it — the ledger stamps that field AFTER validation
// (scripts/lib/claims.js:640, scripts/ledger.mjs:257). Handed a real index claim, validateClaim
// reports `unknown field "source_file" — the schema is closed` for every entry. It remains the
// authority on everything it does cover; this file adds exactly the projection layer around it,
// and never re-implements a rule it already holds.

import type { LedgerClaim } from '../projects.ts';
import { validateClaim, type ClaimDisposition } from './claims.ts';

/**
 * The index projection: KEY_ORDER at scripts/ledger.mjs:299-300, mirrored.
 *
 * It includes `source_file`, excludes `source_line` (a position, deliberately no longer
 * committed — see that file's comment) and excludes `disposition` (dispositions survive in the
 * global YAML, not in the built index). Kept in step with the producer by `test/units.test.ts`,
 * which reads the literal out of scripts/ledger.mjs and compares — a KEY_ORDER edit therefore
 * fails on its own PR instead of shipping green and surfacing as `undefined` in a tooltip.
 */
export const INDEX_KEY_ORDER = [
  'id',
  'assert',
  'kind',
  'scope',
  'verified_by',
  'evidence',
  'valid_until',
  'confidence',
  'supports',
  'first_waived',
  'source_file',
] as const;

/**
 * The KEY_ORDER fields validateClaim's closed schema does NOT know, because the ledger stamps
 * them after validation. They are withheld from validateClaim (which would call each one an
 * unknown field) and checked here instead.
 *
 * Pinned empirically by `test/units.test.ts` against the real validator rather than trusted: if
 * scripts/lib/claims.js ever adopts one of these into its schema, or drops one of the others,
 * that test goes red instead of this comment going quietly stale.
 */
export const STAMPED_FIELDS = ['source_file'] as const;

const INDEX_KEYS: ReadonlySet<string> = new Set(INDEX_KEY_ORDER);
const STAMPED_KEYS: ReadonlySet<string> = new Set(STAMPED_FIELDS);

/** A claim as the global YAML carries it — the index projection plus a disposition. */
export interface GlobalClaimShape extends LedgerClaim {
  disposition?: ClaimDisposition;
}

export type ClaimShapeResult<T> = { ok: true; claim: T } | { ok: false; problems: string[] };

/**
 * A non-null, non-array object. A type predicate, so what follows is narrowed by a check that
 * really ran — the one cast-shaped thing this file will not do is the one it exists to remove.
 */
export function isMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * The fields validateClaim owns, lifted out of a claim in the given projection. The stamped
 * fields are withheld; anything outside the projection is withheld too, so a stray key is
 * reported once by the projection check rather than twice in two different wordings.
 */
function schemaPartOf(o: Record<string, unknown>, projection: ReadonlySet<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (projection.has(k) && !STAMPED_KEYS.has(k)) out[k] = v;
  }
  return out;
}

/**
 * Every field LedgerClaim declares, read and type-checked, or the problem that stopped it.
 *
 * THIS IS THE ONE PLACE LedgerClaim'S FIELDS ARE ENUMERATED AGAINST RUNTIME TYPES. validateClaim
 * is the authority on meaning — id format, the kind/scope/verified_by vocabularies, date
 * reality, evidence, the expiry rule — and it stays that way. What it does not and cannot cover
 * is whether the object satisfies the TypeScript interface every consumer downstream is entitled
 * to trust, because `source_file` is outside its schema entirely. That is what the guard here
 * checks, which is why its failure branch is not dead code: it fires the moment LedgerClaim and
 * the schema disagree about a field, which is the drift this whole file exists to catch.
 */
function readLedgerClaim(o: Record<string, unknown>, where: string): ClaimShapeResult<LedgerClaim> {
  const { id, assert, kind, scope, verified_by, evidence, valid_until, confidence, supports, first_waived, source_file } = o;
  if (
    typeof id !== 'string' ||
    typeof assert !== 'string' ||
    typeof kind !== 'string' ||
    typeof scope !== 'string' ||
    typeof verified_by !== 'string' ||
    typeof source_file !== 'string' ||
    (valid_until !== undefined && typeof valid_until !== 'string') ||
    (confidence !== undefined && typeof confidence !== 'number') ||
    (supports !== undefined && !isStringArray(supports)) ||
    (first_waived !== undefined && typeof first_waived !== 'string')
  ) {
    return {
      ok: false,
      problems: [
        `${where}: does not satisfy LedgerClaim — id/assert/kind/scope/verified_by/source_file must ` +
          'be strings, valid_until/first_waived strings when present, confidence a number, supports a list of ' +
          'strings. Every consumer of this claim is typed on that and would read undefined instead.',
      ],
    };
  }
  return {
    ok: true,
    // Built field by field from values that were read and checked — NOT `o as LedgerClaim`.
    // Adding a required field to LedgerClaim breaks this literal at compile time, which is the
    // point: the next person is made to check it rather than allowed to assert it.
    claim: {
      id,
      assert,
      kind,
      scope,
      verified_by,
      source_file,
      ...(evidence === undefined ? {} : { evidence }),
      ...(valid_until === undefined ? {} : { valid_until }),
      ...(confidence === undefined ? {} : { confidence }),
      ...(supports === undefined ? {} : { supports }),
      ...(first_waived === undefined ? {} : { first_waived }),
    },
  };
}

/**
 * Validate one entry of `.claude/ledger/index.json` and return it typed, or say why not.
 *
 * Three checks, all reported together so a caller sees every problem with an entry rather than
 * the first:
 *
 *   1. the projection is CLOSED — `disposition` and `source_line` are real fields on a claim
 *      somewhere and neither belongs in the built index, so a producer emitting one is a
 *      producer this reader does not understand;
 *   2. the artifact schema, via validateClaim, over the fields it owns;
 *   3. the stamped fields, which check 2 structurally cannot see.
 */
export function validateIndexClaim(value: unknown, where: string): ClaimShapeResult<LedgerClaim> {
  if (!isMapping(value)) return { ok: false, problems: [`${where}: claim must be a mapping`] };

  const problems: string[] = [];
  for (const k of Object.keys(value)) {
    if (!INDEX_KEYS.has(k)) {
      problems.push(
        `${where}: unknown field "${k}" — the index projection is closed (KEY_ORDER, scripts/ledger.mjs)`
      );
    }
  }
  problems.push(...validateClaim(schemaPartOf(value, INDEX_KEYS), where));
  const sourceFile = value.source_file;
  if (typeof sourceFile !== 'string' || sourceFile.trim() === '') {
    problems.push(
      `${where}: source_file must be a non-empty string — scripts/ledger.mjs stamps it onto every ` +
        'indexed claim (KEY_ORDER) and the Belief view renders it as the claim origin, so an index ' +
        'without it puts "undefined" in front of a reader'
    );
  }
  if (problems.length > 0) return { ok: false, problems };

  return readLedgerClaim(value, where);
}

/**
 * The same discipline for `~/.warroom/ledger/global.yml`: validate, then KEEP what was validated.
 *
 * `sourceFile` is supplied by the CALLER because the ledger stamps it as a literal after
 * validation (scripts/ledger.mjs:257) — it is not in the file, must not be read from it, and the
 * closed schema would refuse it if it were. Passing it in is what lets the returned claim satisfy
 * `source_file: string` by construction instead of by a cast plus a stamp nothing enforces.
 *
 * `disposition` is carried through because the global ledger is where dispositions survive. Its
 * contents have already been judged in full by validateClaim (action vocabulary, the `until`
 * requirement on waive, reason, closed field set), so it is read for TYPE here and not re-judged.
 */
export function validateGlobalClaim(
  value: unknown,
  where: string,
  sourceFile: string
): ClaimShapeResult<GlobalClaimShape> {
  if (!isMapping(value)) return { ok: false, problems: [`${where}: claim must be a mapping`] };

  const problems = validateClaim(value, where);
  if (problems.length > 0) return { ok: false, problems };

  const base = readLedgerClaim({ ...value, source_file: sourceFile }, where);
  if (!base.ok) return base;

  const disposition = value.disposition;
  if (disposition === undefined || disposition === null) return { ok: true, claim: base.claim };
  if (!isMapping(disposition)) {
    return { ok: false, problems: [`${where}: disposition must be a mapping — {action, until, reason}`] };
  }
  const { action, until, reason } = disposition;
  if (
    (action !== 'refresh' && action !== 'deprecate' && action !== 'waive') ||
    (until !== undefined && typeof until !== 'string') ||
    (reason !== undefined && typeof reason !== 'string')
  ) {
    return {
      ok: false,
      problems: [`${where}: disposition does not satisfy ClaimDisposition — {action, until?, reason?}`],
    };
  }
  return {
    ok: true,
    claim: {
      ...base.claim,
      disposition: {
        action,
        ...(until === undefined ? {} : { until }),
        ...(reason === undefined ? {} : { reason }),
      },
    },
  };
}
