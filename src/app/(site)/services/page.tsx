import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/site/button-link";
import { SectionLabel } from "@/components/site/section-label";
import { getProjects, getServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description: "Freelance web apps, backends and MVPs, built end to end by Joshva Peyyala.",
};

export default async function ServicesPage() {
  const [{ services, process }, projects] = await Promise.all([getServices(), getProjects()]);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12 pb-20 sm:px-8 lg:px-10 lg:pt-16">
      <SectionLabel>Freelance · Services</SectionLabel>
      <h1 className="mt-4 font-display text-[clamp(3.6rem,12vw,10rem)] uppercase leading-[0.88]">
        Need it <span className="text-outline">built?</span>
        <br />
        I&apos;ll <span className="text-accent">ship</span> it.
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-soft">
        Web apps, backends and first versions for small businesses and founders.
        The same way I built CareDeck, Xpensefy and Lineage: end to end, live in
        production.
      </p>

      <ul className="mt-16 grid gap-5 lg:grid-cols-3">
        {services.map((service, index) => (
          <li key={service.title} className="flex flex-col gap-4 rounded-3xl border border-line bg-ink-2 p-6 sm:p-7">
            <span className="font-display text-xl text-accent">{String(index + 1).padStart(2, "0")}</span>
            <h2 className="font-display text-4xl uppercase leading-none">{service.title}</h2>
            <p className="leading-relaxed text-soft">{service.description}</p>
            <ul className="mt-auto flex flex-col gap-2 border-t border-line pt-4 text-sm text-muted">
              {service.examples.map((example) => (
                <li key={example}>— {example}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <section className="mt-24">
        <SectionLabel>How I work</SectionLabel>
        <ol className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {process.map((item) => (
            <li key={item.step} className="flex flex-col gap-2 bg-ink p-6 sm:p-7">
              <span className="font-display text-5xl text-accent">{item.step}</span>
              <h3 className="font-display text-3xl uppercase">{item.title}</h3>
              <p className="text-soft">{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-24 grid gap-10 lg:grid-cols-2 lg:items-end">
        <div>
          <SectionLabel>Proof</SectionLabel>
          <ul className="mt-6 flex flex-col">
            {projects.map((project) => (
              <li key={project.slug} className="border-t border-line last:border-b">
                <Link href={`/work/${project.slug}`} className="group flex items-baseline justify-between gap-4 py-4">
                  <span className="font-display text-4xl uppercase transition-colors group-hover:text-accent sm:text-5xl">
                    {project.name}
                  </span>
                  <span className="text-right text-sm text-muted">{project.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-6 rounded-3xl bg-accent p-7 text-ink sm:p-10">
          <p className="font-display text-5xl uppercase leading-[0.95] sm:text-6xl">
            Pricing on request
          </p>
          <p className="text-lg font-medium">
            Tell me what you need and I&apos;ll send a written scope with a fixed quote.
          </p>
          <ButtonLink href="/contact" className="self-start !bg-ink !text-paper">
            Start a project →
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
