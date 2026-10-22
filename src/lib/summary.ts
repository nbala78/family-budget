import type { Currency } from "@prisma/client";
import { ratesOn, round2, toUsd, type RatePoint } from "./fx";

export type TxnLike = { date: Date; amount: number; currency: Currency; categoryId: string | null; userId: string };

/** Spending (positive amounts) in USD grouped by a key; income (negative amounts) is ignored. */
export function spendingBy<K extends string>(txns: TxnLike[], history: RatePoint[], key: (t: TxnLike) => K): Map<K, number> {
  const out = new Map<K, number>();
  for (const t of txns) {
    if (t.amount <= 0) continue;
    const usd = toUsd(t.amount, t.currency, ratesOn(t.date, history));
    out.set(key(t), round2((out.get(key(t)) ?? 0) + usd));
  }
  return out;
}

export function incomeUsd(txns: TxnLike[], history: RatePoint[]): number {
  return round2(txns.reduce((s, t) => (t.amount < 0 ? s - toUsd(t.amount, t.currency, ratesOn(t.date, history)) : s), 0));
}
