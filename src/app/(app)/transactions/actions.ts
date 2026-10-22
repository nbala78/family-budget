"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { transactionScope } from "@/lib/access";
import { encryptOptional } from "@/lib/crypto";
import { parseStatement } from "@/lib/csv";

const txnSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  description: z.string().trim().min(1, "Description is required").max(200),
  amount: z.coerce.number().positive("Amount must be more than zero"),
  currency: z.enum(["USD", "INR"]),
  type: z.enum(["EXPENSE", "INCOME"]),
  categoryId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

async function categoryInHousehold(householdId: string, id?: string) {
  if (!id) return null;
  const c = await db.category.findFirst({ where: { id, householdId } });
  return c?.id ?? null;
}

export async function addTransactionAction(_: unknown, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const parsed = txnSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const t = parsed.data;
  await db.transaction.create({
    data: {
      householdId: user.householdId,
      userId: user.id,
      date: new Date(t.date + "T00:00:00Z"),
      description: t.description,
      amount: t.type === "EXPENSE" ? t.amount : -t.amount,
      currency: t.currency,
      categoryId: await categoryInHousehold(user.householdId, t.categoryId),
      notesEnc: encryptOptional(t.notes?.trim()),
    },
  });
  revalidatePath("/transactions");
  return { ok: true };
}

export async function deleteTransactionAction(form: FormData) {
  const user = await requireUser();
  // Scope makes sure members can only delete their own entries.
  await db.transaction.deleteMany({ where: { id: String(form.get("id")), ...transactionScope(user) } });
  revalidatePath("/transactions");
}

export async function setCategoryAction(form: FormData) {
  const user = await requireUser();
  const categoryId = await categoryInHousehold(user.householdId, String(form.get("categoryId") || "") || undefined);
  await db.transaction.updateMany({
    where: { id: String(form.get("id")), ...transactionScope(user) },
    data: { categoryId },
  });
  revalidatePath("/transactions");
}

export async function importCsvAction(_: unknown, form: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file" };
  if (file.size > 5_000_000) return { error: "That file is too large (5 MB max)" };
  const currency = form.get("currency") === "INR" ? "INR" : "USD";
  const order = form.get("dateOrder") === "DMY" ? "DMY" : "MDY";
  const negativeIsExpense = form.get("sign") !== "positive";
  const res = parseStatement(await file.text(), order, negativeIsExpense);
  if (res.error) return { error: res.error };
  if (res.rows.length === 0) return { error: "No transactions found in that file." };

  const categoryId = await categoryInHousehold(user.householdId, String(form.get("categoryId") || "") || undefined);
  await db.transaction.createMany({
    data: res.rows.map((r) => ({
      householdId: user.householdId,
      userId: user.id,
      date: r.date,
      description: r.description,
      amount: r.amount,
      currency,
      categoryId,
    })),
  });
  revalidatePath("/transactions");
  redirect(`/transactions?imported=${res.rows.length}&skipped=${res.skipped}`);
}
