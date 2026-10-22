import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
          <Link href="/dashboard" className="font-semibold text-emerald-700 dark:text-emerald-400">Budget</Link>
          <Link href="/dashboard">Dashboard</Link>
          {user.role === "ADMIN" && <Link href="/admin/members">Members</Link>}
          <form action={logoutAction} className="ml-auto">
            <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white">Sign out</button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
