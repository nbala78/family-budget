import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactionScope } from "@/lib/access";
import { getRateHistory, getRates } from "@/lib/rates";
import { formatMoney } from "@/lib/fx";
import { incomeUsd, spendingBy } from "@/lib/summary";
import { parseMonth } from "@/lib/months";
import { Stat } from "@/components/Stat";

export default async function Dashboard() {
  const user = await requireUser();
  const monthStart = parseMonth();

  const [rates, history, raw] = await Promise.all([
    getRates().catch(() => null),
    getRateHistory(),
    db.transaction.findMany({
      where: { ...transactionScope(user), date: { gte: monthStart } },
      select: { amount: true, currency: true, date: true, categoryId: true, userId: true },
    }),
  ]);
  const txns = raw.map((t) => ({ ...t, amount: Number(t.amount) }));
  // Each transaction converts at the rate in effect on its own date.
  const spent = history.length ? spendingBy(txns, history, () => "all").get("all") ?? 0 : null;
  const income = history.length ? incomeUsd(txns, history) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Hi {user.name}</h1>
      <p className="text-sm text-slate-500">{user.role === "ADMIN" ? "Showing the whole household." : "Showing your own entries."}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Spent this month (USD)" value={spent === null ? "—" : formatMoney(spent, "USD")} />
        <Stat label="Income this month (USD)" value={income === null ? "—" : formatMoney(income, "USD")} />
        <Stat
          label="Exchange rate"
          value={rates ? `1 USD = ₹${rates.INR.toFixed(2)}` : "Unavailable"}
          sub={rates?.asOf ? `as of ${rates.asOf.toISOString().slice(0, 10)}` : undefined}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/transactions" className="btn">Add an expense</Link>
        <Link href="/transactions/import" className="rounded-md border border-slate-300 px-4 py-2 font-medium dark:border-slate-600">Import a statement</Link>
      </div>
    </div>
  );
}
