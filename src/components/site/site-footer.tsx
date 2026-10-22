import Link from "next/link";
import type { Profile } from "@/content/types";

export function SiteFooter({ profile }: { profile: Profile }) {
  return (
    <footer className="no-print mt-auto border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <Link
          href="/contact"
          className="group inline-flex flex-wrap items-baseline gap-x-4 font-display text-[clamp(3rem,10vw,7.5rem)] uppercase leading-[0.9]"
        >
          Let&apos;s talk
          <span className="text-accent transition-transform group-hover:translate-x-2">
            →
          </span>
        </Link>
        <div className="mt-10 flex flex-col gap-6 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted sm:flex-row sm:items-center sm:justify-between">
          <a href={`mailto:${profile.email}`} className="normal-case tracking-normal text-soft hover:text-paper">
            {profile.email}
          </a>
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            <li>
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-paper">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-paper">
                GitHub
              </a>
            </li>
            <li>
              <a href={profile.resumePdf} target="_blank" rel="noreferrer" className="hover:text-paper">
                Resume PDF
              </a>
            </li>
          </ul>
        </div>
        <p className="mt-10 text-xs text-muted">© 2026 {profile.name} · peyyala.com</p>
      </div>
    </footer>
  );
}
