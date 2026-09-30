import type { Cart, Product, Cents } from "./types";
import { config } from "./config";

export function emptyCart(): Cart {
  return { items: [] };
}

export function addItem(cart: Cart, product: Product, qty = 1): Cart {
  const items = cart.items.map((l) => ({ ...l }));
  const existing = items.find((l) => l.product.sku === product.sku);
  if (existing) existing.qty = Math.min(existing.qty + qty, config.maxQtyPerLine);
  else items.push({ product, qty: Math.min(qty, config.maxQtyPerLine) });
  return { ...cart, items };
}

export function removeItem(cart: Cart, sku: string): Cart {
  return { ...cart, items: cart.items.filter((l) => l.product.sku !== sku) };
}

export function subtotal(cart: Cart): Cents {
  return cart.items.reduce((s, l) => s + l.product.price * l.qty, 0);
}
