"use client";
import { useActionState } from "react";
import { loginAction } from "./actions";
import { FormError } from "@/components/FormError";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <FormError message={state.error} />
      <div><label className="label" htmlFor="email">Email</label><input key={state.email} className="input" id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} required /></div>
      <div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <button className="btn w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
