import { test, expect } from "bun:test";
import { emptyCart, addItem, removeItem, subtotal, formatMoney } from "../src/index";

const pen = { sku: "PEN", name: "Pen", price: 250 };
const book = { sku: "BOOK", name: "Book", price: 1999 };

test("addItem merges lines", () => {
  const c = addItem(addItem(emptyCart(), pen, 2), pen, 3);
  expect(c.items).toHaveLength(1);
  expect(c.items[0].qty).toBe(5);
});

test("removeItem and subtotal", () => {
  const c = removeItem(addItem(addItem(emptyCart(), pen, 2), book), "PEN");
  expect(subtotal(c)).toBe(1999);
});

test("formatMoney", () => {
  expect(formatMoney(1999)).toBe("USD 19.99");
  expect(formatMoney(-5)).toBe("-USD 0.05");
});
