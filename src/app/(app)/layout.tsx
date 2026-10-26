import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { NavLinks, type NavItem } from "@/components/NavLinks";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const items: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/transactions", label: "Spending", icon: "list" },
    ...(isAdmin ? [{ href: "/budgets", label: "Budgets", icon: "pie" as const }] : []),
    { href: "/reports", label: "Reports", icon: "chart" },
    { href: "/accounts", label: "Accounts", icon: "bank" },
    { href: "/retirement", label: "Retire", icon: "sun" },
  ];
  return (
    <div className="pb-20 sm:pb-0">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <nav className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
          <Link href="/dashboard" className="font-semibold text-emerald-700 dark:text-emerald-400">Family Budget</Link>
          <div className="hidden gap-4 sm:flex"><NavLinks items={items} variant="top" /></div>
          <div className="ml-auto flex items-center gap-4">
            {isAdmin && <Link href="/admin/members" className="text-slate-600 hover:text-slate-900 dark:text-slate-300">Members</Link>}
            <form action={logoutAction}><button className="text-slate-500 hover:text-slate-900 dark:hover:text-white">Sign out</button></form>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      <NavLinks items={items} variant="bottom" />
    </div>
  );
}
