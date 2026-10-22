import type { Currency } from "@prisma/client";

export const CURRENCIES = ["USD", "INR"] as const satisfies readonly Currency[];
export const REPORT_CURRENCY: Currency = "USD";

/** rates[c] = how many units of c equal 1 USD. USD is always 1. */
export type UsdRates = Record<Currency, number>;

export function convert(amount: number, from: Currency, to: Currency, rates: UsdRates): number {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) throw new Error(`Missing exchange rate for ${from}->${to}`);
  return round2((amount / fromRate) * toRate);
}

export function toUsd(amount: number, from: Currency, rates: UsdRates): number {
  return convert(amount, from, "USD", rates);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

type Source = { name: string; url: string; parse: (body: unknown) => number | undefined };

// Free, keyless public sources, tried in order. Frankfurter publishes ECB reference rates.
export const FX_SOURCES: Source[] = [
  {
    name: "frankfurter",
    url: "https://api.frankfurter.app/latest?from=USD&to=INR",
    parse: (b) => (b as { rates?: { INR?: number } }).rates?.INR,
  },
  {
    name: "open.er-api",
    url: "https://open.er-api.com/v6/latest/USD",
    parse: (b) => (b as { rates?: { INR?: number } }).rates?.INR,
  },
];

export async function fetchUsdInr(fetchImpl: typeof fetch = fetch): Promise<{ rate: number; source: string }> {
  const errors: string[] = [];
  for (const src of FX_SOURCES) {
    try {
      const res = await fetchImpl(src.url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rate = src.parse(await res.json());
      if (typeof rate !== "number" || !(rate > 0)) throw new Error("no INR rate in response");
      return { rate, source: src.name };
    } catch (e) {
      errors.push(`${src.name}: ${(e as Error).message}`);
    }
  }
  throw new Error(`All FX sources failed (${errors.join("; ")})`);
}
