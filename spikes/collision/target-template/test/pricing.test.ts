import { test, expect } from "bun:test";
import { emptyCart, addItem, computeTotal } from "../src/index";

const book = { sku: "BOOK", name: "Book", price: 1999 };

test("flat shipping under threshold", () => {
  const t = computeTotal(addItem(emptyCart(), book));
  expect(t).toMatchObject({ subtotal: 1999, shipping: 499, total: 2498 });
});

test("free shipping at threshold", () => {
  const t = computeTotal(addItem(emptyCart(), book, 3));
  expect(t.shipping).toBe(0);
  expect(t.total).toBe(5997);
});
