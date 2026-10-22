"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(10, "Temporary password must be at least 10 characters"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function addMemberAction(_: unknown, form: FormData): Promise<{ values?: Record<string, string>; error?: string; ok?: boolean }> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: echo(form) };
  const { name, email, password, role } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Someone already uses that email", values: echo(form) };
  await db.user.create({
    data: { householdId: admin.householdId, name, email, role, passwordHash: await hashPassword(password) },
  });
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function setRoleAction(form: FormData) {
  const admin = await requireAdmin();
  const userId = String(form.get("userId"));
  const role = form.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";
  // Never let an admin demote themselves, so the household always keeps an admin.
  if (userId === admin.id) return;
  await db.user.updateMany({ where: { id: userId, householdId: admin.householdId }, data: { role } });
  revalidatePath("/admin/members");
}

const echo = (form: FormData) =>
  Object.fromEntries(["name", "email"].map((k) => [k, String(form.get(k) ?? "")]));
