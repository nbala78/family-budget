"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { monthRange, parseMonth } from "@/lib/months";

export async function setBudgetAction(form: FormData) {
  const admin = await requireAdmin();
  const month = parseMonth(String(form.get("month")));
  const categoryId = String(form.get("categoryId"));
  const currency = form.get("currency") === "INR" ? "INR" : "USD";
  const amount = Number(form.get("amount"));
  const category = await db.category.findFirst({ where: { id: categoryId, householdId: admin.householdId } });
  if (!category) return;
  if (!form.get("amount") || !(amount > 0)) {
    await db.budget.deleteMany({ where: { categoryId, month } });
  } else {
    await db.budget.upsert({
      where: { categoryId_month: { categoryId, month } },
      create: { householdId: admin.householdId, categoryId, month, amount, currency },
      update: { amount, currency },
    });
  }
  revalidatePath("/budgets");
}

export async function copyPreviousMonthAction(form: FormData) {
  const admin = await requireAdmin();
  const month = parseMonth(String(form.get("month")));
  const prev = parseMonth(monthRange(month).prev);
  const previous = await db.budget.findMany({ where: { householdId: admin.householdId, month: prev } });
  await db.budget.createMany({
    data: previous.map((b) => ({ householdId: b.householdId, categoryId: b.categoryId, month, amount: b.amount, currency: b.currency })),
    skipDuplicates: true,
  });
  revalidatePath("/budgets");
}
