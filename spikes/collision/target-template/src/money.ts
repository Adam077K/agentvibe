import type { Cents } from "./types";
import { config } from "./config";

export function roundCents(x: number): Cents {
  return Math.round(x);
}

export function formatMoney(c: Cents): string {
  const sign = c < 0 ? "-" : "";
  const abs = Math.abs(c);
  return `${sign}${config.currency} ${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
