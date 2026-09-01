// The producer is plain JS with no declaration file, and the anti-drift test in dispatch.test.ts
// imports its REAL tables on purpose — a fixture built from the consumer's own reader cannot fail.
//
// TYPED, NOT SUPPRESSED. A `@ts-ignore` at the import would have silenced this in one line and
// also silenced every future mistake at that call site; `bun test` does not typecheck, so the
// import was green in the suite and red only under `tsc --noEmit`. What is declared here is
// exactly what the test reads, so a producer that stops exporting either one still goes red.
declare module '*/produce-verdict.mjs' {
  /** The producer's four terminal state names, keyed by themselves. */
  export const OUTCOME: Readonly<Record<string, string>>;
  /** The exit code each terminal state exits with. */
  export const EXIT: Readonly<Record<string, number>>;
}
