import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { SectionLabel } from "@/components/site/section-label";
import { getProfile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Hiring, or have a project? Get in touch with Joshva Peyyala.",
};

export default async function ContactPage() {
  const profile = await getProfile();

  const channels = [
    { label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    { label: "LinkedIn", value: "in/joshva-peyyala", href: profile.linkedin },
    { label: "GitHub", value: "joshvapeyyala", href: profile.github },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12 pb-20 sm:px-8 lg:px-10 lg:pt-16">
      <SectionLabel>Contact</SectionLabel>
      <h1 className="mt-4 font-display text-[clamp(4rem,14vw,11rem)] uppercase leading-[0.86]">
        Let&apos;s <span className="text-accent">talk.</span>
      </h1>

      <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-20">
        <ContactForm email={profile.email} />

        <aside className="flex flex-col gap-8">
          <div className="rounded-3xl border border-line bg-ink-2 p-6 sm:p-7">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-accent">
              <span className="blink" aria-hidden="true">●</span> {profile.openToWorkLabel}
            </p>
            <p className="mt-3 text-soft">
              Based in {profile.location}. Freelance projects welcome too.
            </p>
          </div>
          <div>
            <SectionLabel>Or reach me directly</SectionLabel>
            <ul className="mt-4 flex flex-col">
              {channels.map((channel) => (
                <li key={channel.label} className="border-t border-line last:border-b">
                  <a
                    href={channel.href}
                    target={channel.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group flex items-baseline justify-between gap-4 py-4"
                  >
                    <span className="font-display text-3xl uppercase transition-colors group-hover:text-accent">
                      {channel.label}
                    </span>
                    <span className="truncate text-sm text-soft">{channel.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
