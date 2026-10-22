import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ImportForm } from "./ImportForm";

export default async function ImportPage() {
  const user = await requireUser();
  const categories = await db.category.findMany({ where: { householdId: user.householdId, kind: "EXPENSE" }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Import a bank statement</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Download a CSV from your bank's website and upload it here. US statements with a single Amount column and
        Indian statements with Withdrawal and Deposit columns both work. Nothing is sent to your bank.
      </p>
      <div className="card"><ImportForm categories={categories} /></div>
    </div>
  );
}
