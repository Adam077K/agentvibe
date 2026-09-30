You are working in a small TypeScript repo (shop-core) in the current directory. Read README.md first — it defines the order of operations in `computeTotal`.

TASK: add discount codes.

1. In `src/types.ts`: add `export interface DiscountCode { code: string; kind: "percent" | "fixed"; value: number }` and add an optional `discountCode?: string` field to `Cart`. Add a `discount: Cents` field to `Totals`.
2. In `src/config.ts`: add a `discountCodes` entry to the existing `config` object holding two codes: `SAVE10` (percent, value 10 = 10%) and `FIVEOFF` (fixed, value 500 cents).
3. Create `src/discounts.ts` exporting `findDiscount(code: string | undefined): DiscountCode | undefined` (case-insensitive lookup in config) and `discountAmount(sub: Cents, code: string | undefined): Cents` — percent is `roundCents(sub * value / 100)`, fixed is `min(value, sub)`, unknown/absent code is 0.
4. In `src/pricing.ts`: make `computeTotal` compute and return `discount`, and subtract it from `total`, following README's order of operations (shipping threshold uses the PRE-discount subtotal). Keep any other components of the total that already exist.
5. In `src/index.ts`: export `findDiscount` and `discountAmount`.
6. Add tests for the feature to `test/pricing.test.ts`.

Run `bun test` and make sure everything passes. Do NOT run any git commands and do not commit. When finished, reply with one line: DONE or FAILED plus a short reason.
