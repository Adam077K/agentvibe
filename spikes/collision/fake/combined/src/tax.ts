import type { Cents, Region } from "./types";
import { config } from "./config";
import { roundCents } from "./money";

export function taxRate(region: Region | undefined): number {
  return region ? config.taxRates[region] ?? 0 : 0;
}

export function taxAmount(taxable: Cents, region: Region | undefined): Cents {
  return roundCents(taxable * taxRate(region));
}
