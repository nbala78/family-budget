"use client";
import { useActionState } from "react";
import { addAccountAction } from "./actions";
import { FormError } from "@/components/FormError";

const GROUPS: [string, [string, string][]][] = [
  ["US retirement", [["RETIREMENT_401K", "401(k)"], ["IRA", "Traditional IRA"], ["ROTH_IRA", "Roth IRA"], ["HSA", "HSA"]]],
  ["India retirement", [["EPF", "EPF"], ["PPF", "PPF"], ["NPS", "NPS"]]],
  ["Everyday & investments", [["CHECKING", "Checking"], ["SAVINGS", "Savings"], ["BROKERAGE", "Brokerage / mutual funds"], ["FIXED_DEPOSIT", "Fixed deposit"], ["CASH", "Cash"], ["CREDIT_CARD", "Credit card (enter balance owed as negative)"], ["OTHER", "Other"]]],
];

export function AddAccountForm() {
  const [state, action, pending] = useActionState(addAccountAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-6">
      <div className="sm:col-span-6"><FormError message={state.error} />{state.ok && <p className="text-sm text-emerald-700">Account added.</p>}</div>
      <div className="sm:col-span-3"><label className="label" htmlFor="a-name">Name</label><input className="input" id="a-name" name="name" placeholder="e.g. Fidelity 401(k)" required /></div>
      <div className="sm:col-span-3"><label className="label" htmlFor="a-kind">Type</label>
        <select className="input" id="a-kind" name="kind" defaultValue="RETIREMENT_401K">
          {GROUPS.map(([g, opts]) => <optgroup key={g} label={g}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>)}
        </select></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="a-bal">Current balance</label><input className="input" id="a-bal" name="balance" type="number" inputMode="decimal" step="0.01" required /></div>
      <div className="sm:col-span-1"><label className="label" htmlFor="a-cur">Currency</label>
        <select className="input" id="a-cur" name="currency" defaultValue="USD"><option>USD</option><option>INR</option></select></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="a-contrib">Monthly contribution</label><input className="input" id="a-contrib" name="monthlyContribution" type="number" inputMode="decimal" step="0.01" min="0" defaultValue="0" /></div>
      <div className="sm:col-span-1"><label className="label" htmlFor="a-ret">Return %/yr</label><input className="input" id="a-ret" name="expectedReturnPct" type="number" inputMode="decimal" step="any" defaultValue="7" /></div>
      <div className="sm:col-span-6"><label className="label" htmlFor="a-details">Details (private, encrypted), e.g. institution or last 4 digits</label><input className="input" id="a-details" name="details" /></div>
      <div className="sm:col-span-6"><button className="btn" disabled={pending}>{pending ? "Adding…" : "Add account"}</button></div>
    </form>
  );
}
