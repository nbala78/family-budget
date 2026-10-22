"use client";
import { useActionState } from "react";
import { addMemberAction } from "./actions";
import { FormError } from "@/components/FormError";

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMemberAction, {});
  return (
    <form key={JSON.stringify(state.values)} action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><FormError message={state.error} />{state.ok && <p className="text-sm text-emerald-700">Member added.</p>}</div>
      <div><label className="label" htmlFor="m-name">Name</label><input className="input" id="m-name" name="name" defaultValue={state.values?.name} required /></div>
      <div><label className="label" htmlFor="m-email">Email</label><input className="input" id="m-email" name="email" defaultValue={state.values?.email} type="email" required /></div>
      <div><label className="label" htmlFor="m-pw">Temporary password</label><input className="input" id="m-pw" name="password" type="text" minLength={10} required /></div>
      <div><label className="label" htmlFor="m-role">Role</label>
        <select className="input" id="m-role" name="role" defaultValue="MEMBER"><option value="MEMBER">Member (own entries only)</option><option value="ADMIN">Admin (sees everything)</option></select>
      </div>
      <div className="sm:col-span-2"><button className="btn" disabled={pending}>{pending ? "Adding…" : "Add member"}</button></div>
    </form>
  );
}
