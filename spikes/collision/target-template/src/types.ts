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
}

export interface Totals {
  subtotal: Cents;
  shipping: Cents;
  total: Cents;
}
