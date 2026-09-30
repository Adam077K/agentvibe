import type { Cart, Cents, Totals } from "./types";
import { config } from "./config";
import { subtotal } from "./cart";
import { discountAmount } from "./discounts";

export function shipping(sub: Cents): Cents {
  if (sub === 0) return 0;
  return sub >= config.freeShippingThreshold ? 0 : config.shippingFlat;
}

export function computeTotal(cart: Cart): Totals {
  const sub = subtotal(cart);
  const discount = discountAmount(sub, cart.discountCode);
  const ship = shipping(sub);
  return { subtotal: sub, discount, shipping: ship, total: sub - discount + ship };
}
