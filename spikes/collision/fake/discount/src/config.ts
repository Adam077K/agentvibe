import type { DiscountCode } from "./types";

// Single shared configuration object for the shop.

export const config = {
  currency: "USD",
  // Orders whose subtotal is at or above this (in cents) ship free.
  freeShippingThreshold: 5000,
  shippingFlat: 499,
  maxQtyPerLine: 99,
  discountCodes: [
    { code: "SAVE10", kind: "percent", value: 10 },
    { code: "FIVEOFF", kind: "fixed", value: 500 },
  ] as DiscountCode[],
};

export type Config = typeof config;
