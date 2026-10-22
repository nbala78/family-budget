import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMoney, ratesOn, toUsd } from "@/lib/fx";
import { getRateHistory } from "@/lib/rates";
import { monthRange, parseMonth } from "@/lib/months";
import { spendingBy } from "@/lib/summary";
import { copyPreviousMonthAction, setBudgetAction } from "./actions";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const admin = await requireAdmin();
  const m = monthRange(parseMonth((await searchParams).month));

  const [categories, budgets, txns, history] = await Promise.all([
    db.category.findMany({ where: { householdId: admin.householdId, kind: "EXPENSE" }, orderBy: { name: "asc" } }),
    db.budget.findMany({ where: { householdId: admin.householdId, month: m.start } }),
    db.transaction.findMany({ where: { householdId: admin.householdId, date: { gte: m.start, lt: m.end } } }),
    getRateHistory(),
  ]);
  const rates = history.length ? ratesOn(m.start, history) : { USD: 1, INR: 0 };
  const spent = spendingBy(txns.map((t) => ({ ...t, amount: Number(t.amount) })), history, (t) => t.categoryId ?? "none");
  const byCat = new Map(budgets.map((b) => [b.categoryId, b]));

  const rows = categories.map((c) => {
    const b = byCat.get(c.id);
    const budgetUsd = b && rates.INR ? toUsd(Number(b.amount), b.currency, rates) : null;
    return { c, b, budgetUsd, spentUsd: spent.get(c.id) ?? 0 };
  });
  const totalBudget = rows.reduce((s, r) => s + (r.budgetUsd ?? 0), 0);
  const totalSpent = [...spent.values()].reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Budgets</h1>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/budgets?month=${m.prev}`} className="px-2 text-lg" aria-label="Previous month">‹</Link>
        <span className="font-medium">{m.label}</span>
        <Link href={`/budgets?month=${m.next}`} className="px-2 text-lg" aria-label="Next month">›</Link>
        {budgets.length === 0 && (
          <form action={copyPreviousMonthAction} className="ml-auto">
            <input type="hidden" name="month" value={m.key} />
            <button className="text-sm text-emerald-700 hover:underline">Copy last month's budgets</button>
          </form>
        )}
      </div>
      <div className="card">
        <p className="text-sm text-slate-500">Household spending vs. budget (USD)</p>
        <p className="mt-1 text-2xl font-semibold">{formatMoney(totalSpent, "USD")} <span className="text-base font-normal text-slate-500">of {formatMoney(totalBudget, "USD")}</span></p>
        {(spent.get("none") ?? 0) > 0 && <p className="mt-1 text-xs text-slate-500">Includes {formatMoney(spent.get("none")!, "USD")} uncategorized.</p>}
      </div>
      <ul className="card divide-y divide-slate-200 p-0 dark:divide-slate-700">
        {rows.map(({ c, b, budgetUsd, spentUsd }) => {
          const pct = budgetUsd ? Math.min(100, (spentUsd / budgetUsd) * 100) : 0;
          const over = budgetUsd !== null && spentUsd > budgetUsd;
          return (
            <li key={c.id} className="space-y-2 p-3">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{c.name}</span>
                <span className={`ml-auto text-sm ${over ? "font-medium text-red-600" : "text-slate-500"}`}>
                  {formatMoney(spentUsd, "USD")}{budgetUsd !== null && ` / ${formatMoney(budgetUsd, "USD")}`}
                </span>
              </div>
              {budgetUsd !== null && (
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className={`h-full ${over ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                </div>
              )}
              <form action={setBudgetAction} className="flex items-center gap-2">
                <input type="hidden" name="month" value={m.key} />
                <input type="hidden" name="categoryId" value={c.id} />
                <input name="amount" type="number" inputMode="decimal" step="0.01" min="0" defaultValue={b ? Number(b.amount) : ""} placeholder="Budget" aria-label={`${c.name} budget`} className="w-28 rounded border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600" />
                <select name="currency" defaultValue={b?.currency ?? "USD"} aria-label="Currency" className="rounded border border-slate-300 bg-transparent px-1 py-1 text-sm dark:border-slate-600"><option>USD</option><option>INR</option></select>
                <button className="text-sm text-emerald-700 hover:underline">Save</button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
