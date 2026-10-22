import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactionScope } from "@/lib/access";
import { getRates } from "@/lib/rates";
import { formatMoney, toUsd } from "@/lib/fx";

export default async function Dashboard() {
  const user = await requireUser();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [rates, txns] = await Promise.all([
    getRates().catch(() => null),
    db.transaction.findMany({
      where: { ...transactionScope(user), date: { gte: monthStart } },
      select: { amount: true, currency: true },
    }),
  ]);

  const spentUsd = rates
    ? txns.reduce((sum, t) => sum + toUsd(Number(t.amount), t.currency, rates), 0)
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Hi {user.name}</h1>
      <p className="text-sm text-slate-500">{user.role === "ADMIN" ? "Showing the whole household." : "Showing your own entries."}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-slate-500">Net spending this month (USD)</p>
          <p className="mt-1 text-2xl font-semibold">{spentUsd === null ? "—" : formatMoney(spentUsd, "USD")}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Exchange rate</p>
          <p className="mt-1 text-2xl font-semibold">{rates ? `1 USD = ₹${rates.INR.toFixed(2)}` : "Unavailable"}</p>
          {rates?.asOf && <p className="text-xs text-slate-500">as of {rates.asOf.toISOString().slice(0, 10)}</p>}
        </div>
      </div>
    </div>
  );
}
