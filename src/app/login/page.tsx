import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if ((await db.user.count()) === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-semibold">Family Budget</h1>
      <div className="card"><LoginForm /></div>
    </main>
  );
}
