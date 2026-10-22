"use client";
import { useActionState } from "react";
import { importCsvAction } from "../actions";
import { FormError } from "@/components/FormError";

export function ImportForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(importCsvAction, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <div><label className="label" htmlFor="i-file">Statement CSV</label><input className="input" id="i-file" name="file" type="file" accept=".csv,text/csv" required /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label" htmlFor="i-cur">Currency of this account</label>
          <select className="input" id="i-cur" name="currency" defaultValue="USD"><option value="USD">USD (US bank)</option><option value="INR">INR (Indian bank)</option></select></div>
        <div><label className="label" htmlFor="i-date">Date format</label>
          <select className="input" id="i-date" name="dateOrder" defaultValue="MDY"><option value="MDY">MM/DD/YYYY (US)</option><option value="DMY">DD/MM/YYYY (India)</option></select></div>
        <div><label className="label" htmlFor="i-sign">If there is one Amount column, spending shows as</label>
          <select className="input" id="i-sign" name="sign" defaultValue="negative"><option value="negative">Negative numbers (most banks)</option><option value="positive">Positive numbers (most credit cards)</option></select></div>
        <div><label className="label" htmlFor="i-cat">Category for imported rows</label>
          <select className="input" id="i-cat" name="categoryId" defaultValue=""><option value="">Uncategorized</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      <button className="btn" disabled={pending}>{pending ? "Importing…" : "Import"}</button>
    </form>
  );
}
