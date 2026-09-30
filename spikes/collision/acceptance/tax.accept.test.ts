// Hidden acceptance test for the tax task. Copied into the target only at evaluation time.
import { test, expect } from "bun:test";
import * as m from "../src/index";
const S: any = m;
const book = { sku: "BOOK", name: "Book", price: 1999 };
const cart = (qty: number, extra: object = {}): any => ({ ...m.addItem(m.emptyCart(), book, qty), ...extra });

test("tax: US-CA, flat shipping", () => {
  expect(m.computeTotal(cart(1, { region: "US-CA" }))).toMatchObject({ subtotal: 1999, tax: 145, shipping: 499, total: 2643 });
});
test("tax: EU-DE, free shipping", () => {
  expect(m.computeTotal(cart(3, { region: "EU-DE" }))).toMatchObject({ tax: 1139, shipping: 0, total: 7136 });
});
test("tax: helpers", () => {
  expect(S.taxRate(undefined)).toBe(0);
  expect(S.taxAmount(10000, "US-NY")).toBe(888);
  expect(m.computeTotal(cart(1)).tax).toBe(0);
});
