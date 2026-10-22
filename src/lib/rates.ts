import { db } from "./db";
import { fetchUsdInr, type RatePoint, type UsdRates } from "./fx";

function today(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Fetches today's USD→INR rate and stores it. Called by the daily cron. */
export async function refreshRates() {
  const { rate, source } = await fetchUsdInr();
  const date = today();
  return db.exchangeRate.upsert({
    where: { date_base_quote: { date, base: "USD", quote: "INR" } },
    create: { date, base: "USD", quote: "INR", rate, source },
    update: { rate, source },
  });
}

/** Rates in effect on a date: the latest stored rate on or before it. */
export async function getRates(onOrBefore: Date = new Date()): Promise<UsdRates & { asOf: Date | null }> {
  let row = await db.exchangeRate.findFirst({
    where: { base: "USD", quote: "INR", date: { lte: onOrBefore } },
    orderBy: { date: "desc" },
  });
  if (!row) {
    // Nothing cached yet (fresh install) — fetch now.
    row = await refreshRates().catch(() => null);
  }
  if (!row) throw new Error("No exchange rate available yet");
  return { USD: 1, INR: Number(row.rate), asOf: row.date };
}

/** All stored USD→INR rates, oldest first, for converting many dated rows at once. */
export async function getRateHistory(): Promise<RatePoint[]> {
  const rows = await db.exchangeRate.findMany({
    where: { base: "USD", quote: "INR" },
    orderBy: { date: "asc" },
    select: { date: true, rate: true },
  });
  if (rows.length === 0) {
    const r = await refreshRates().catch(() => null);
    return r ? [{ date: r.date, inr: Number(r.rate) }] : [];
  }
  return rows.map((r) => ({ date: r.date, inr: Number(r.rate) }));
}
