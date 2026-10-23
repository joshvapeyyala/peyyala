"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navLinks } from "./nav-links";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector("a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-line/60 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="text-[13px] font-semibold uppercase tracking-[0.12em] text-paper"
            onClick={() => setOpen(false)}
          >
            {name}
          </Link>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                const isContact = link.href === "/contact";
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={
                        isContact
                          ? "ml-3 inline-flex h-10 items-center rounded-full bg-accent px-5 text-[13px] font-bold uppercase tracking-[0.08em] text-ink transition hover:brightness-110"
                          : `inline-flex h-10 items-center px-3 text-[13px] font-semibold uppercase tracking-[0.1em] transition hover:text-paper ${
                              active ? "text-accent" : "text-soft"
                            }`
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            ref={toggleRef}
            type="button"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-paper md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </header>

      {/* Outside <header>: its backdrop-filter would trap a fixed child inside the 64px bar */}
      {open && (
        <nav
          ref={menuRef}
          id="mobile-menu"
          aria-label="Main"
          className="no-print fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col justify-between overflow-y-auto bg-ink px-5 pt-6 pb-10 sm:px-8 md:hidden"
        >
          <ul className="flex flex-col">
            {navLinks.map((link, index) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href} className="border-b border-line">
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className="flex items-baseline gap-4 py-4"
                  >
                    <span className="font-display text-base text-muted">0{index + 1}</span>
                    <span
                      className={`font-display text-6xl uppercase leading-none ${
                        active ? "text-accent" : "text-paper"
                      }`}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="text-sm text-muted">peyyala.com</p>
        </nav>
      )}
    </>
  );
}
