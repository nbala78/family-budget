import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactionScope } from "@/lib/access";
import { decryptOptional } from "@/lib/crypto";
import { formatMoney, ratesOn, toUsd } from "@/lib/fx";
import { getRateHistory } from "@/lib/rates";
import { monthRange, parseMonth } from "@/lib/months";
import { Collapsible } from "@/components/Collapsible";
import { AddTransactionForm } from "./AddTransactionForm";
import { deleteTransactionAction, setCategoryAction } from "./actions";

type Search = Promise<{ month?: string; imported?: string; skipped?: string }>;

export default async function TransactionsPage({ searchParams }: { searchParams: Search }) {
  const user = await requireUser();
  const sp = await searchParams;
  const month = parseMonth(sp.month);
  const { start, end, prev, next, label } = monthRange(month);

  const [txns, categories, history] = await Promise.all([
    db.transaction.findMany({
      where: { ...transactionScope(user), date: { gte: start, lt: end } },
      include: { category: true, user: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    db.category.findMany({ where: { householdId: user.householdId }, orderBy: [{ kind: "asc" }, { name: "asc" }] }),
    getRateHistory(),
  ]);

  const rows = txns.map((t) => {
    const amount = Number(t.amount);
    return { ...t, amount, usd: history.length ? toUsd(amount, t.currency, ratesOn(t.date, history)) : null, notes: decryptOptional(t.notesEnc) };
  });
  const spentUsd = rows.reduce((s, r) => s + Math.max(r.usd ?? 0, 0), 0);
  const incomeUsd = rows.reduce((s, r) => s - Math.min(r.usd ?? 0, 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <Link href="/transactions/import" className="ml-auto text-sm text-emerald-700 hover:underline">Import CSV</Link>
      </div>
      {sp.imported && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Imported {sp.imported} transactions{Number(sp.skipped) > 0 ? `, skipped ${sp.skipped} rows that weren't transactions` : ""}.</p>}

      <Collapsible title="Add a transaction" initiallyOpen={rows.length === 0}>
        <AddTransactionForm categories={categories} today={new Date().toISOString().slice(0, 10)} />
      </Collapsible>

      <div className="flex items-center gap-3">
        <Link href={`/transactions?month=${prev}`} className="px-2 text-lg" aria-label="Previous month">‹</Link>
        <span className="font-medium">{label}</span>
        <Link href={`/transactions?month=${next}`} className="px-2 text-lg" aria-label="Next month">›</Link>
        <span className="ml-auto text-right text-sm text-slate-500">
          Spent <strong className="text-slate-900 dark:text-white">{formatMoney(spentUsd, "USD")}</strong>
          {incomeUsd > 0 && <> · Income <strong className="text-emerald-700">{formatMoney(incomeUsd, "USD")}</strong></>}
        </span>
      </div>

      <ul className="card divide-y divide-slate-200 p-0 dark:divide-slate-700">
        {rows.length === 0 && <li className="p-4 text-sm text-slate-500">Nothing this month yet.</li>}
        {rows.map((t) => (
          <li key={t.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.description}</p>
              <p className="text-xs text-slate-500">
                {t.date.toISOString().slice(0, 10)}
                {user.role === "ADMIN" && ` · ${t.user.name}`}
                {t.notes && ` · ${t.notes}`}
              </p>
              <form action={setCategoryAction} className="mt-1 flex gap-1">
                <input type="hidden" name="id" value={t.id} />
                <select name="categoryId" defaultValue={t.categoryId ?? ""} className="rounded border border-slate-200 bg-transparent px-1 py-0.5 text-xs dark:border-slate-700">
                  <option value="">Uncategorized</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="text-xs text-emerald-700 hover:underline">Set</button>
              </form>
            </div>
            <div className="text-right">
              <p className={t.amount < 0 ? "font-medium text-emerald-700" : "font-medium"}>{formatMoney(-t.amount, t.currency)}</p>
              {t.currency !== "USD" && t.usd !== null && <p className="text-xs text-slate-500">{formatMoney(-t.usd, "USD")}</p>}
              <form action={deleteTransactionAction}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-xs text-red-600 hover:underline">Delete</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
