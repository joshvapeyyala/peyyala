"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Hidden on /contact, where it would only link to the page itself
export function FooterCta() {
  const pathname = usePathname();
  if (pathname === "/contact") return null;

  return (
    <Link
      href="/contact"
      className="group mb-10 inline-flex flex-wrap items-baseline gap-x-4 font-display text-[clamp(3rem,10vw,7.5rem)] uppercase leading-[0.9]"
    >
      Let&apos;s talk
      <span className="text-accent transition-transform group-hover:translate-x-2">
        →
      </span>
    </Link>
  );
}
