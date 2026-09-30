You are working in a small TypeScript repo (shop-core) in the current directory. Read README.md first — it defines the order of operations in `computeTotal`.

TASK: add regional sales tax.

1. In `src/types.ts`: add `export type Region = "US-CA" | "US-NY" | "EU-DE"` and add an optional `region?: Region` field to `Cart`. Add a `tax: Cents` field to `Totals`.
2. In `src/config.ts`: add a `taxRates` entry to the existing `config` object: `US-CA` 0.0725, `US-NY` 0.08875, `EU-DE` 0.19.
3. Create `src/tax.ts` exporting `taxRate(region: Region | undefined): number` (0 when absent) and `taxAmount(taxable: Cents, region: Region | undefined): Cents` = `roundCents(taxable * rate)`.
4. In `src/pricing.ts`: make `computeTotal` compute and return `tax`, and add it to `total`, following README's order of operations (tax applies to `subtotal - discount`; if no discount feature exists yet, discount is 0). Keep any other components of the total that already exist.
5. In `src/index.ts`: export `taxRate` and `taxAmount`.
6. Add tests for the feature to `test/pricing.test.ts`.

Run `bun test` and make sure everything passes. Do NOT run any git commands and do not commit. When finished, reply with one line: DONE or FAILED plus a short reason.
