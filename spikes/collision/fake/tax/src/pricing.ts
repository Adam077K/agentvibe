import type { Cart, Cents, Totals } from "./types";
import { config } from "./config";
import { subtotal } from "./cart";
import { taxAmount } from "./tax";

export function shipping(sub: Cents): Cents {
  if (sub === 0) return 0;
  return sub >= config.freeShippingThreshold ? 0 : config.shippingFlat;
}

export function computeTotal(cart: Cart): Totals {
  const sub = subtotal(cart);
  const tax = taxAmount(sub - 0, cart.region);
  const ship = shipping(sub);
  return { subtotal: sub, tax, shipping: ship, total: sub + tax + ship };
}
