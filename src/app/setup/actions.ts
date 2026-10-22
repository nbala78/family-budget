"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/defaults";

const schema = z.object({
  household: z.string().trim().min(1, "Household name is required"),
  name: z.string().trim().min(1, "Your name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

export async function setupAction(_: unknown, form: FormData): Promise<{ values?: Record<string, string>; error?: string }> {
  // Setup only works once: when the database has no users.
  if ((await db.user.count()) > 0) redirect("/login");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: echo(form) };
  const { household, name, email, password } = parsed.data;

  const user = await db.$transaction(async (tx) => {
    const h = await tx.household.create({ data: { name: household } });
    await tx.category.createMany({
      data: [
        ...DEFAULT_EXPENSE_CATEGORIES.map((n) => ({ householdId: h.id, name: n, kind: "EXPENSE" as const })),
        ...DEFAULT_INCOME_CATEGORIES.map((n) => ({ householdId: h.id, name: n, kind: "INCOME" as const })),
      ],
    });
    return tx.user.create({
      data: { householdId: h.id, name, email, role: "ADMIN", passwordHash: await hashPassword(password) },
    });
  });
  await createSession(user.id);
  redirect("/dashboard");
}

const echo = (form: FormData) =>
  Object.fromEntries(["household", "name", "email"].map((k) => [k, String(form.get(k) ?? "")]));
