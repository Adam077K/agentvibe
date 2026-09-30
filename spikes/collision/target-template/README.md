# shop-core

Tiny cart/pricing module. Amounts are integer cents. Run tests with `bun test`.

## Product spec: order of operations in `computeTotal`

1. `subtotal` — sum of line prices.
2. `discount` — from a discount code on the cart, if any (0 otherwise).
3. `tax` — rate for the cart's region applied to `subtotal - discount`, rounded with `roundCents` (0 if no region).
4. `shipping` — decided on the pre-discount `subtotal` against `freeShippingThreshold`.
5. `total = subtotal - discount + tax + shipping`.

Features 2 and 3 may not be implemented yet; when a feature is absent its amount is 0.
