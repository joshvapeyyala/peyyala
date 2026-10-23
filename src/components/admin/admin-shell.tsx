"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SchemeToggle } from "./scheme-toggle";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/admin/appearance", label: "Appearance", icon: "M12 3a9 9 0 100 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16a5 5 0 005-5c0-4.4-4-7.8-9-7.8zM7.5 12a1 1 0 100-2 1 1 0 000 2zm3-4a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" },
  { href: "/admin/projects", label: "Projects", icon: "M3 7h18M3 7v12h18V7M3 7l2-3h14l2 3M9 12h6" },
  { href: "/admin/profile", label: "Profile & resume", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0" },
  { href: "/admin/services", label: "Services", icon: "M4 6h16M4 12h16M4 18h10" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The mobile menu stays open only on the page it was opened on, so it
  // closes by itself after navigating
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const links = (
    <ul className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                active ? "bg-sunken text-fg" : "text-muted hover:bg-sunken hover:text-fg"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const footer = (
    <div className="flex flex-col gap-3 border-t border-border pt-4 text-xs text-muted">
      {/* A plain <a>: the site has its own root layout, so this is a full page load anyway */}
      <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium hover:text-fg">
        View live site ↗
      </a>
      <SchemeToggle />
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-border bg-panel p-4 lg:flex">
        <div className="flex flex-col gap-6">
          <Link href="/admin" className="flex items-center gap-2.5 px-2 pt-1">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-fg">JP</span>
            <span className="text-sm font-semibold">Portfolio admin</span>
          </Link>
          <nav aria-label="Admin">{links}</nav>
        </div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-panel px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-fg">JP</span>
          <span className="text-sm font-semibold">Portfolio admin</span>
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpenOn(open ? null : pathname)}
          className="-mr-2 grid h-10 w-10 place-items-center rounded-lg text-fg hover:bg-sunken"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </header>
      {open && (
        <nav id="admin-mobile-nav" aria-label="Admin" className="sticky top-14 z-20 flex flex-col gap-4 border-b border-border bg-panel p-4 lg:hidden">
          {links}
          {footer}
        </nav>
      )}

      <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* Fills the space beside the sidebar; capped only on very wide screens */}
        <div className="mx-auto max-w-screen-2xl">{children}</div>
      </main>
    </div>
  );
}
