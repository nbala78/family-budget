"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavIcon = "home" | "list" | "pie" | "chart" | "bank" | "sun";
export type NavItem = { href: string; label: string; icon: NavIcon };

// Simple outline icons (24×24, stroke = currentColor); system fonts lack reliable glyphs for these.
const ICON_PATHS: Record<NavIcon, string> = {
  home: "M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  pie: "M12 3v9h9A9 9 0 1112 3zM15 3.5A9 9 0 0120.5 9H15z",
  chart: "M4 20h16M7 16v-5M12 16V6M17 16v-8",
  bank: "M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
  sun: "M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
};

function Icon({ name }: { name: NavIcon }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

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
            <Link href={i.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active(i.href) ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>
              <Icon name={i.icon} />{i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
