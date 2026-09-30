// Hidden acceptance test for the discount task. Copied into the target only at evaluation time.
import { test, expect } from "bun:test";
import * as m from "../src/index";
const S: any = m;
const book = { sku: "BOOK", name: "Book", price: 1999 };
const cart = (qty: number, extra: object = {}): any => ({ ...m.addItem(m.emptyCart(), book, qty), ...extra });

test("discount: percent code, flat shipping", () => {
  expect(m.computeTotal(cart(1, { discountCode: "SAVE10" }))).toMatchObject({ subtotal: 1999, discount: 200, shipping: 499, total: 2298 });
});
test("discount: fixed code, threshold uses pre-discount subtotal", () => {
  expect(m.computeTotal(cart(3, { discountCode: "FIVEOFF" }))).toMatchObject({ discount: 500, shipping: 0, total: 5497 });
});
test("discount: helpers", () => {
  expect(S.findDiscount("save10")?.kind).toBe("percent");
  expect(S.discountAmount(300, "FIVEOFF")).toBe(300);
  expect(S.discountAmount(1000, "NOPE")).toBe(0);
  expect(m.computeTotal(cart(1)).discount).toBe(0);
});
