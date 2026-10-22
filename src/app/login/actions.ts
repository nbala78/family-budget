"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export async function loginAction(_: unknown, form: FormData): Promise<{ error?: string; email?: string }> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  // Same message either way so the form doesn't reveal which emails exist.
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Incorrect email or password", email };
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
