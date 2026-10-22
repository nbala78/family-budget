import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { setRoleAction } from "./actions";
import { AddMemberForm } from "./AddMemberForm";

export default async function MembersPage() {
  const admin = await requireAdmin();
  const members = await db.user.findMany({ where: { householdId: admin.householdId }, orderBy: { createdAt: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Household members</h1>
      <ul className="card divide-y divide-slate-200 dark:divide-slate-700">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2 py-2">
            <span className="font-medium">{m.name}</span>
            <span className="text-sm text-slate-500">{m.email}</span>
            <span className="ml-auto text-xs uppercase tracking-wide text-slate-500">{m.role}</span>
            {m.id !== admin.id && (
              <form action={setRoleAction}>
                <input type="hidden" name="userId" value={m.id} />
                <input type="hidden" name="role" value={m.role === "ADMIN" ? "MEMBER" : "ADMIN"} />
                <button className="text-xs text-emerald-700 hover:underline">{m.role === "ADMIN" ? "Make member" : "Make admin"}</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <section className="card">
        <h2 className="mb-3 font-medium">Add a member</h2>
        <AddMemberForm />
      </section>
    </div>
  );
}
