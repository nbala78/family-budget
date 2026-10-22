import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if ((await db.user.count()) > 0) redirect("/login");
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-semibold">Set up your household</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">This creates the first admin account. You can add family members afterwards.</p>
      <div className="card"><SetupForm /></div>
    </main>
  );
}
