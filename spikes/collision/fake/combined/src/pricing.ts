import type { Cart, Cents, Totals } from "./types";
import { config } from "./config";
import { subtotal } from "./cart";
import { taxAmount } from "./tax";
import { discountAmount } from "./discounts";

export function shipping(sub: Cents): Cents {
  if (sub === 0) return 0;
  return sub >= config.freeShippingThreshold ? 0 : config.shippingFlat;
}

export function computeTotal(cart: Cart): Totals {
  const sub = subtotal(cart);
  const discount = discountAmount(sub, cart.discountCode);
  const tax = taxAmount(sub - discount, cart.region);
  const ship = shipping(sub);
  return { subtotal: sub, discount, tax, shipping: ship, total: sub - discount + tax + ship };
}
