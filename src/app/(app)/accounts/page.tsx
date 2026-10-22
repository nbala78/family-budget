import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountScope } from "@/lib/access";
import { decryptOptional } from "@/lib/crypto";
import { formatMoney, toUsd } from "@/lib/fx";
import { getRates } from "@/lib/rates";
import { KIND_LABEL } from "@/lib/retirement";
import { Collapsible } from "@/components/Collapsible";
import { AddAccountForm } from "./AddAccountForm";
import { deleteAccountAction, updateAccountAction } from "./actions";

export default async function AccountsPage() {
  const user = await requireUser();
  const [accounts, rates] = await Promise.all([
    db.financialAccount.findMany({ where: accountScope(user), include: { owner: { select: { name: true } } }, orderBy: [{ kind: "asc" }, { name: "asc" }] }),
    getRates().catch(() => null),
  ]);
  const netWorth = rates ? accounts.reduce((s, a) => s + toUsd(Number(a.balance), a.currency, rates), 0) : null;
  const small = "w-24 rounded border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Accounts</h1>
      <div className="card">
        <p className="text-sm text-slate-500">{user.role === "ADMIN" ? "Household net worth" : "Your net worth"} (USD)</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{netWorth === null ? "—" : formatMoney(netWorth, "USD")}</p>
      </div>
      <ul className="card divide-y divide-slate-200 p-0 dark:divide-slate-700">
        {accounts.length === 0 && <li className="p-4 text-sm text-slate-500">No accounts yet. Add your 401(k), IRA, EPF, PPF, NPS and bank accounts below.</li>}
        {accounts.map((a) => {
          const details = decryptOptional(a.detailsEnc);
          return (
            <li key={a.id} className="space-y-2 p-3">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{a.name}</span>
                <span className="text-xs text-slate-500">{KIND_LABEL[a.kind]}{user.role === "ADMIN" && ` · ${a.owner.name}`}{details && ` · ${details}`}</span>
                <span className="ml-auto tabular-nums">{formatMoney(Number(a.balance), a.currency)}</span>
              </div>
              <form action={updateAccountAction} className="flex flex-wrap items-end gap-2 text-xs text-slate-500">
                <input type="hidden" name="id" value={a.id} />
                <label>Balance<br /><input name="balance" type="number" step="0.01" defaultValue={Number(a.balance)} className={small} /></label>
                <label>Monthly add<br /><input name="monthlyContribution" type="number" step="0.01" min="0" defaultValue={Number(a.monthlyContribution)} className={small} /></label>
                <label>Return %<br /><input name="expectedReturnPct" type="number" step="any" defaultValue={Number(a.expectedReturnPct)} className="w-16 rounded border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600" /></label>
                <button className="pb-1 text-sm text-emerald-700 hover:underline">Update</button>
                <button formAction={deleteAccountAction} className="ml-auto pb-1 text-sm text-red-600 hover:underline">Delete</button>
              </form>
            </li>
          );
        })}
      </ul>
      <Collapsible title="Add an account" initiallyOpen={accounts.length === 0}><AddAccountForm /></Collapsible>
    </div>
  );
}
