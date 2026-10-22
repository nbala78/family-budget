"use client";
import { useActionState } from "react";
import { addTransactionAction } from "./actions";
import { FormError } from "@/components/FormError";

type Category = { id: string; name: string; kind: string };

export function AddTransactionForm({ categories, today }: { categories: Category[]; today: string }) {
  const [state, action, pending] = useActionState(addTransactionAction, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-6">
      <div className="sm:col-span-6"><FormError message={state.error} />{state.ok && <p className="text-sm text-emerald-700">Saved.</p>}</div>
      <div className="sm:col-span-2"><label className="label" htmlFor="t-type">Type</label>
        <select className="input" id="t-type" name="type" defaultValue="EXPENSE"><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="t-date">Date</label><input className="input" id="t-date" name="date" type="date" defaultValue={today} required /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="t-cat">Category</label>
        <select className="input" id="t-cat" name="categoryId" defaultValue="">
          <option value="">Uncategorized</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.kind === "INCOME" ? " (income)" : ""}</option>)}
        </select></div>
      <div className="sm:col-span-3"><label className="label" htmlFor="t-desc">Description</label><input className="input" id="t-desc" name="description" required /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="t-amt">Amount</label><input className="input" id="t-amt" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required /></div>
      <div className="sm:col-span-1"><label className="label" htmlFor="t-cur">Currency</label>
        <select className="input" id="t-cur" name="currency" defaultValue="USD"><option>USD</option><option>INR</option></select></div>
      <div className="sm:col-span-6"><label className="label" htmlFor="t-notes">Notes (private, encrypted)</label><input className="input" id="t-notes" name="notes" /></div>
      <div className="sm:col-span-6"><button className="btn" disabled={pending}>{pending ? "Saving…" : "Add"}</button></div>
    </form>
  );
}
