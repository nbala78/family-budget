"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const pct = z.coerce.number().min(0).max(30);
const schema = z
  .object({
    currentAge: z.coerce.number().int().min(18).max(100),
    retireAge: z.coerce.number().int().min(18).max(100),
    lifeExpectancy: z.coerce.number().int().min(50).max(110),
    annualSpendingUsd: z.coerce.number().min(0),
    usInflationPct: pct,
    inInflationPct: pct,
    withdrawalTaxPct: z.coerce.number().min(0).max(60),
    otherIncomeUsd: z.coerce.number().min(0),
    otherIncomeStartAge: z.coerce.number().int().min(18).max(110),
  })
  .refine((p) => p.currentAge <= p.retireAge && p.retireAge < p.lifeExpectancy, {
    message: "Ages must go current ≤ retirement < life expectancy",
  });

export async function savePlanAction(_: unknown, form: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.retirementPlan.upsert({ where: { userId: user.id }, create: { userId: user.id, ...parsed.data }, update: parsed.data });
  revalidatePath("/retirement");
  return {};
}
