"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string };

// Top links on wide screens; a fixed bottom tab bar on phones.
export function NavLinks({ items, variant }: { items: NavItem[]; variant: "top" | "bottom" }) {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(href + "/");
  if (variant === "top") {
    return (
      <>
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={active(i.href) ? "font-medium text-emerald-700 dark:text-emerald-400" : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"}>{i.label}</Link>
        ))}
      </>
    );
  }
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <ul className="flex">
        {items.map((i) => (
          <li key={i.href} className="flex-1">
            <Link href={i.href} className={`flex flex-col items-center py-2 text-[11px] ${active(i.href) ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>
              <span className="text-lg leading-none" aria-hidden>{i.icon}</span>{i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
