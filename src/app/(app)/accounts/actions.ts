"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccountKind } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { accountScope } from "@/lib/access";
import { encryptOptional } from "@/lib/crypto";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  kind: z.nativeEnum(AccountKind),
  currency: z.enum(["USD", "INR"]),
  balance: z.coerce.number(),
  monthlyContribution: z.coerce.number().min(0).default(0),
  expectedReturnPct: z.coerce.number().min(-20).max(30).default(7),
  details: z.string().max(500).optional(),
});

export async function addAccountAction(_: unknown, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { details, ...a } = parsed.data;
  await db.financialAccount.create({
    data: { ...a, householdId: user.householdId, ownerId: user.id, detailsEnc: encryptOptional(details?.trim()) },
  });
  revalidatePath("/accounts");
  return { ok: true };
}

export async function updateAccountAction(form: FormData) {
  const user = await requireUser();
  const num = (k: string) => (form.get(k) === null || form.get(k) === "" ? undefined : Number(form.get(k)));
  const data = { balance: num("balance"), monthlyContribution: num("monthlyContribution"), expectedReturnPct: num("expectedReturnPct") };
  if (Object.values(data).some((v) => v !== undefined && !Number.isFinite(v))) return;
  await db.financialAccount.updateMany({ where: { id: String(form.get("id")), ...accountScope(user) }, data });
  revalidatePath("/accounts");
  revalidatePath("/retirement");
}

export async function deleteAccountAction(form: FormData) {
  const user = await requireUser();
  await db.financialAccount.deleteMany({ where: { id: String(form.get("id")), ...accountScope(user) } });
  revalidatePath("/accounts");
}
