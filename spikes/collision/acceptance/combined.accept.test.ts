// Hidden integration test: passes only if BOTH features landed and compose per README order of operations.
import { test, expect } from "bun:test";
import * as m from "../src/index";
const book = { sku: "BOOK", name: "Book", price: 1999 };
const cart = (qty: number, extra: object = {}): any => ({ ...m.addItem(m.emptyCart(), book, qty), ...extra });

test("combined: percent discount then NY tax on discounted subtotal", () => {
  expect(m.computeTotal(cart(3, { discountCode: "SAVE10", region: "US-NY" }))).toMatchObject({ subtotal: 5997, discount: 600, tax: 479, shipping: 0, total: 5876 });
});
test("combined: fixed discount, CA tax, flat shipping", () => {
  expect(m.computeTotal(cart(1, { discountCode: "FIVEOFF", region: "US-CA" }))).toMatchObject({ discount: 500, tax: 109, shipping: 499, total: 2107 });
});
