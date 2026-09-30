import type { Cents, DiscountCode } from "./types";
import { config } from "./config";
import { roundCents } from "./money";

export function findDiscount(code: string | undefined): DiscountCode | undefined {
  if (!code) return undefined;
  return config.discountCodes.find((d) => d.code.toLowerCase() === code.toLowerCase());
}

export function discountAmount(sub: Cents, code: string | undefined): Cents {
  const d = findDiscount(code);
  if (!d) return 0;
  return d.kind === "percent" ? roundCents((sub * d.value) / 100) : Math.min(d.value, sub);
}
