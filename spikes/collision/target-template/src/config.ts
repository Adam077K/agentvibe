// Single shared configuration object for the shop.

export const config = {
  currency: "USD",
  // Orders whose subtotal is at or above this (in cents) ship free.
  freeShippingThreshold: 5000,
  shippingFlat: 499,
  maxQtyPerLine: 99,
};

export type Config = typeof config;
