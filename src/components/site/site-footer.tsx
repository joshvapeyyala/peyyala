import { cacheLife } from "next/cache";
import type { Profile } from "@/content/types";
import { FooterCta } from "./footer-cta";

// Cached so the footer stays in the static shell; refreshes daily to roll over the year
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export function SiteFooter({ profile }: { profile: Profile }) {
  return (
    <footer className="no-print mt-auto border-t border-line">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <FooterCta />
        <div className="flex flex-col gap-6 text-[13px] font-semibold uppercase tracking-[0.1em] text-muted sm:flex-row sm:items-center sm:justify-between">
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
        <p className="mt-10 text-xs text-muted">© <CurrentYear /> {profile.name} · peyyala.com</p>
      </div>
    </footer>
  );
}
