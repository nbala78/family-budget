import { requireUser } from "@/lib/auth";
import { Stat } from "@/components/Stat";
import { db } from "@/lib/db";
import { transactionScope } from "@/lib/access";
import { formatMoney } from "@/lib/fx";
import { getRateHistory } from "@/lib/rates";
import { monthRange, parseMonth } from "@/lib/months";
import { incomeUsd, spendingBy, type TxnLike } from "@/lib/summary";

const MONTHS = 12;

export default async function ReportsPage() {
  const user = await requireUser();
  const thisMonth = parseMonth();
  const from = new Date(Date.UTC(thisMonth.getUTCFullYear(), thisMonth.getUTCMonth() - (MONTHS - 1), 1));

  const [raw, categories, members, history] = await Promise.all([
    db.transaction.findMany({ where: { ...transactionScope(user), date: { gte: from } } }),
    db.category.findMany({ where: { householdId: user.householdId } }),
    user.role === "ADMIN" ? db.user.findMany({ where: { householdId: user.householdId } }) : Promise.resolve([]),
    getRateHistory(),
  ]);
  if (history.length === 0) return <p>Exchange rates aren't available yet, so reports can't be shown.</p>;

  const txns: TxnLike[] = raw.map((t) => ({ ...t, amount: Number(t.amount) }));
  const monthKey = (t: TxnLike) => t.date.toISOString().slice(0, 7);
  const byMonth = spendingBy(txns, history, monthKey);
  const months = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1));
    const r = monthRange(d);
    return { key: r.key, short: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }), label: r.label, usd: byMonth.get(r.key) ?? 0 };
  });
  const max = Math.max(1, ...months.map((m) => m.usd));
  const total = months.reduce((s, m) => s + m.usd, 0);

  const current = txns.filter((t) => monthKey(t) === months[MONTHS - 1].key);
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const byCat = [...spendingBy(current, history, (t) => t.categoryId ?? "none")]
    .map(([id, usd]) => ({ name: catName.get(id) ?? "Uncategorized", usd }))
    .sort((a, b) => b.usd - a.usd);
  const catMax = Math.max(1, ...byCat.map((c) => c.usd));
  const memberName = new Map(members.map((m) => [m.id, m.name]));
  const byMember = user.role === "ADMIN" ? [...spendingBy(current, history, (t) => t.userId)].sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Reports <span className="text-base font-normal text-slate-500">· all amounts in USD</span></h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Spent this month" value={formatMoney(months[MONTHS - 1].usd, "USD")} />
        <Stat label="Income this month" value={formatMoney(incomeUsd(current, history), "USD")} />
        <Stat label="Monthly average (12 mo)" value={formatMoney(total / MONTHS, "USD")} />
      </div>

      <section className="card">
        <h2 className="mb-4 font-medium">Spending by month</h2>
        <div className="flex h-44 items-end gap-1" role="img" aria-label="Monthly spending, last 12 months">
          {months.map((m) => (
            <div key={m.key} className="group relative flex h-full flex-1 flex-col justify-end">
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-slate-100 dark:text-slate-900">
                {m.label}: {formatMoney(m.usd, "USD")}
              </span>
              <div className="rounded-t bg-emerald-600 dark:bg-emerald-400" style={{ height: `${(m.usd / max) * 100}%`, minHeight: m.usd > 0 ? 2 : 0 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1 border-t border-slate-200 pt-1 text-[10px] text-slate-500 dark:border-slate-700">
          {months.map((m) => <span key={m.key} className="flex-1 text-center">{m.short}</span>)}
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-slate-500">Show as table</summary>
          <table className="mt-2 w-full">
            <tbody>{months.map((m) => <tr key={m.key}><td>{m.label}</td><td className="text-right tabular-nums">{formatMoney(m.usd, "USD")}</td></tr>)}</tbody>
          </table>
        </details>
      </section>

      <section className="card">
        <h2 className="mb-3 font-medium">This month by category</h2>
        {byCat.length === 0 && <p className="text-sm text-slate-500">No spending yet this month.</p>}
        <ul className="space-y-2">
          {byCat.map((c) => (
            <li key={c.name} className="text-sm">
              <div className="flex justify-between"><span>{c.name}</span><span className="tabular-nums">{formatMoney(c.usd, "USD")}</span></div>
              <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400" style={{ width: `${(c.usd / catMax) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>

      {byMember.length > 0 && (
        <section className="card">
          <h2 className="mb-3 font-medium">This month by member</h2>
          <ul className="space-y-1 text-sm">
            {byMember.map(([id, usd]) => <li key={id} className="flex justify-between"><span>{memberName.get(id)}</span><span className="tabular-nums">{formatMoney(usd, "USD")}</span></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

