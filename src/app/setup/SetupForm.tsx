"use client";
import { useActionState } from "react";
import { setupAction } from "./actions";
import { FormError } from "@/components/FormError";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAction, {});
  return (
    <form key={JSON.stringify(state.values)} action={action} className="space-y-4">
      <FormError message={state.error} />
      <div><label className="label" htmlFor="household">Household name</label><input className="input" id="household" name="household" defaultValue={state.values?.household} placeholder="e.g. The Kumar family" required /></div>
      <div><label className="label" htmlFor="name">Your name</label><input className="input" id="name" name="name" defaultValue={state.values?.name} required /></div>
      <div><label className="label" htmlFor="email">Email</label><input className="input" id="email" name="email" defaultValue={state.values?.email} type="email" autoComplete="email" required /></div>
      <div><label className="label" htmlFor="password">Password (10+ characters)</label><input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={10} required /></div>
      <button className="btn w-full" disabled={pending}>{pending ? "Creating…" : "Create household"}</button>
    </form>
  );
}
