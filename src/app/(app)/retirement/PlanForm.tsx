"use client";
import { useActionState } from "react";
import { savePlanAction } from "./actions";
import { FormError } from "@/components/FormError";

export type PlanValues = {
  currentAge: number; retireAge: number; lifeExpectancy: number; annualSpendingUsd: number;
  usInflationPct: number; inInflationPct: number; withdrawalTaxPct: number; otherIncomeUsd: number; otherIncomeStartAge: number;
};

const FIELDS: [keyof PlanValues, string, string][] = [
  ["currentAge", "Current age", "1"],
  ["retireAge", "Retirement age", "1"],
  ["lifeExpectancy", "Plan until age", "1"],
  ["annualSpendingUsd", "Yearly spending in retirement (today's $)", "100"],
  ["otherIncomeUsd", "Social Security / pension per year (today's $)", "100"],
  ["otherIncomeStartAge", "…starting at age", "1"],
  ["usInflationPct", "US inflation %", "any"],
  ["inInflationPct", "India inflation %", "any"],
  ["withdrawalTaxPct", "Tax on 401(k)/IRA/NPS withdrawals %", "1"],
];

export function PlanForm({ values }: { values: PlanValues }) {
  const [state, action, pending] = useActionState(savePlanAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <div className="sm:col-span-3"><FormError message={state.error} /></div>
      {FIELDS.map(([name, label, step]) => (
        <div key={name}>
          <label className="label" htmlFor={`p-${name}`}>{label}</label>
          <input className="input" id={`p-${name}`} name={name} type="number" inputMode="decimal" step={step} defaultValue={values[name]} required />
        </div>
      ))}
      <div className="sm:col-span-3"><button className="btn" disabled={pending}>{pending ? "Saving…" : "Save & recalculate"}</button></div>
    </form>
  );
}
