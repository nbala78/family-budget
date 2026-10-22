import Link from "next/link";
import type { AccountKind } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { Stat } from "@/components/Stat";
import { db } from "@/lib/db";
import { accountScope } from "@/lib/access";
import { formatMoney, toUsd } from "@/lib/fx";
import { getRates } from "@/lib/rates";
import { KIND_LABEL, project } from "@/lib/retirement";
import { PlanForm, type PlanValues } from "./PlanForm";

// Everyday spending accounts aren't counted as retirement savings.
const EXCLUDED: AccountKind[] = ["CHECKING", "CREDIT_CARD", "CASH"];

const DEFAULTS: PlanValues = {
  currentAge: 45, retireAge: 60, lifeExpectancy: 90, annualSpendingUsd: 60000,
  usInflationPct: 2.5, inInflationPct: 5, withdrawalTaxPct: 20, otherIncomeUsd: 0, otherIncomeStartAge: 67,
};

export default async function RetirementPage() {
  const user = await requireUser();
  const [plan, accounts, rates] = await Promise.all([
    db.retirementPlan.findUnique({ where: { userId: user.id } }),
    db.financialAccount.findMany({ where: { ...accountScope(user), kind: { notIn: EXCLUDED } }, orderBy: { name: "asc" } }),
    getRates().catch(() => null),
  ]);

  const values: PlanValues = plan
    ? {
        currentAge: plan.currentAge, retireAge: plan.retireAge, lifeExpectancy: plan.lifeExpectancy,
        annualSpendingUsd: Number(plan.annualSpendingUsd), usInflationPct: Number(plan.usInflationPct),
        inInflationPct: Number(plan.inInflationPct), withdrawalTaxPct: Number(plan.withdrawalTaxPct),
        otherIncomeUsd: Number(plan.otherIncomeUsd), otherIncomeStartAge: plan.otherIncomeStartAge,
      }
    : DEFAULTS;

  const result = rates && accounts.length
    ? project(
        accounts.map((a) => ({ kind: a.kind, currency: a.currency, balance: Number(a.balance), monthlyContribution: Number(a.monthlyContribution), expectedReturnPct: Number(a.expectedReturnPct) })),
        { ...values, inrPerUsd: rates.INR },
      )
    : null;
  const max = result ? Math.max(1, ...result.years.map((y) => y.realUsd)) : 1;
  const todayUsd = rates ? accounts.reduce((s, a) => s + toUsd(Number(a.balance), a.currency, rates), 0) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Retirement planner</h1>
      {!plan && <p className="text-sm text-slate-500">These are example assumptions. Adjust them below and save.</p>}

      {accounts.length === 0 ? (
        <p className="card text-sm">Add your retirement and investment accounts on the <Link href="/accounts" className="text-emerald-700 underline">Accounts</Link> page to see a projection.</p>
      ) : result && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Savings today" value={formatMoney(todayUsd, "USD")} />
            <Stat label={`At age ${values.retireAge} (today's $)`} value={formatMoney(result.atRetirementRealUsd, "USD")} sub={`${formatMoney(result.atRetirementNominalUsd, "USD")} in future dollars`} />
            <Stat label="Safe yearly income (4% rule, today's $)" value={formatMoney(result.safeWithdrawalRealUsd, "USD")} sub={`You plan to spend ${formatMoney(values.annualSpendingUsd, "USD")}`} />
          </div>

          <p className={`rounded-md px-3 py-2 text-sm font-medium ${result.runsOutAt === null ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200"}`}>
            {result.runsOutAt === null
              ? `✓ On track: savings last past age ${values.lifeExpectancy} with these assumptions.`
              : `⚠ Savings run out at age ${result.runsOutAt}. Try saving more, retiring later or spending less.`}
          </p>

          <section className="card">
            <h2 className="mb-4 font-medium">Projected savings by age (today's dollars)</h2>
            <div className="flex h-48 items-end gap-px" role="img" aria-label="Projected savings by age">
              {result.years.map((y) => (
                <div key={y.age} className="group relative flex h-full flex-1 flex-col justify-end">
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-slate-100 dark:text-slate-900">
                    Age {y.age}: {formatMoney(y.realUsd, "USD")}
                  </span>
                  <div className={`rounded-t-sm ${y.age < values.retireAge ? "bg-emerald-600 dark:bg-emerald-400" : "bg-emerald-300 dark:bg-emerald-700"}`} style={{ height: `${(y.realUsd / max) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-xs text-slate-500 dark:border-slate-700">
              <span>{values.currentAge}</span><span>Retire at {values.retireAge}</span><span>{values.lifeExpectancy}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Darker bars: saving years. Lighter bars: retirement years.</p>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-slate-500">Show as table</summary>
              <table className="mt-2 w-full tabular-nums">
                <thead><tr className="text-left text-slate-500"><th>Age</th><th className="text-right">Balance (today's $)</th><th className="text-right">Withdrawn (future $)</th></tr></thead>
                <tbody>{result.years.map((y) => <tr key={y.age}><td>{y.age}</td><td className="text-right">{formatMoney(y.realUsd, "USD")}</td><td className="text-right">{y.withdrawalUsd ? formatMoney(y.withdrawalUsd, "USD") : "—"}</td></tr>)}</tbody>
              </table>
            </details>
          </section>

          <section className="card text-sm">
            <h2 className="mb-2 font-medium">Included accounts</h2>
            <ul className="space-y-1">
              {accounts.map((a) => <li key={a.id} className="flex justify-between gap-2"><span>{a.name} <span className="text-slate-500">· {KIND_LABEL[a.kind]} · {Number(a.expectedReturnPct)}%/yr</span></span><span className="tabular-nums">{formatMoney(Number(a.balance), a.currency)}</span></li>)}
            </ul>
          </section>
        </>
      )}

      <section className="card">
        <h2 className="mb-3 font-medium">Assumptions</h2>
        <PlanForm values={values} />
        <p className="mt-3 text-xs text-slate-500">
          INR savings are converted to USD with the rupee weakening each year by the gap between Indian and US inflation.
          Roth, HSA, EPF and PPF withdrawals are treated as tax-free. This is an estimate to help you plan, not financial advice.
        </p>
      </section>
    </div>
  );
}

