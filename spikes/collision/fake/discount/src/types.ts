// Shared domain types. Amounts are integer cents.

export type Cents = number;

export interface Product {
  sku: string;
  name: string;
  price: Cents;
}

export interface LineItem {
  product: Product;
  qty: number;
}

export interface Cart {
  items: LineItem[];
  discountCode?: string;
}

export interface Totals {
  subtotal: Cents;
  shipping: Cents;
  discount: Cents;
  total: Cents;
}

export interface DiscountCode {
  code: string;
  kind: "percent" | "fixed";
  value: number;
}
