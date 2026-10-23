import Link from "next/link";
import { ButtonLink } from "@/components/site/button-link";
import { DepartureBoard } from "@/components/site/departure-board";
import { Marquee } from "@/components/site/marquee";
import { SectionLabel } from "@/components/site/section-label";
import { getExperience, getProfile, getProjects, getSkills } from "@/lib/content";

export default async function HomePage() {
  const [profile, projects, experience, skills] = await Promise.all([
    getProfile(),
    getProjects(),
    getExperience(),
    getSkills(),
  ]);
  const tilli = experience[0];

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pt-10 pb-12 sm:px-8 sm:pt-14 lg:px-10 lg:pt-16">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-soft">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-live" aria-hidden="true" />
            {profile.openToWorkLabel}
          </span>
          <span className="text-muted">·</span>
          <span className="text-muted">{profile.location}</span>
        </p>

        <h1 className="mt-6 font-display text-[clamp(3.5rem,15vw,10rem)] uppercase leading-[0.9] tracking-[-0.01em]">
          I build{" "}
          <span
            aria-hidden="true"
            className="relative inline-flex h-[0.72em] w-[1.45em] translate-y-[-0.06em] items-center justify-center overflow-hidden rounded-full border-2 border-edge bg-ink-2 align-middle"
          >
            <span className="text-[0.3em] tracking-[0.04em] text-soft">JP</span>
          </span>
          <br />
          <span className="text-outline">backends</span>
          <br />
          that <span className="text-accent">ship</span> real
          <br className="hidden sm:block" /> products.
        </h1>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-xl text-lg leading-relaxed text-soft sm:text-xl">
            I&apos;m {profile.name}, a {profile.tagline.toLowerCase()}.{" "}
            {profile.yearsOfExperience} years at {tilli.company}, and three live
            products I designed, built and deployed on my own.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/resume">View resume ↗</ButtonLink>
            <ButtonLink href="/contact" variant="outline">
              Get in touch
            </ButtonLink>
          </div>
        </div>
      </section>

      <Marquee
        items={[...skills.marquee, "Learning AI + RAG"]}
        label={`Tech stack: ${skills.marquee.join(", ")}, learning AI and RAG`}
      />

      <section className="mx-auto max-w-7xl px-5 pt-20 pb-6 sm:px-8 lg:px-10 lg:pt-28">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <SectionLabel>Selected work · Departures</SectionLabel>
            <h2 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">
              Shipped &amp; live
            </h2>
          </div>
          <p className="hidden text-sm text-muted lg:pointer-fine:block" aria-hidden="true">
            Hover a row to preview
          </p>
        </div>
        <DepartureBoard projects={projects} boardingLabel="Full-time role" />
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-20">
          <div>
            <SectionLabel>Experience</SectionLabel>
            <p className="mt-4 font-display text-[clamp(5rem,16vw,11rem)] uppercase leading-[0.85]">
              {profile.yearsOfExperience}
              <span className="text-accent"> yrs</span>
            </p>
            <p className="mt-4 max-w-sm text-soft">
              Building production REST APIs and web apps with Node.js, Express and
              Next.js.
            </p>
          </div>
          <div className="flex flex-col">
            {tilli.roles.map((role) => (
              <div key={role.title} className="border-t border-line py-6 last:border-b">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <h3 className="text-xl font-semibold">{role.title}</h3>
                  <p className="shrink-0 text-sm text-muted">
                    {role.start} – {role.end}
                  </p>
                </div>
                <p className="mt-1 text-soft">
                  {tilli.company} · {tilli.location}
                </p>
              </div>
            ))}
            <Link
              href="/resume"
              className="mt-6 self-start text-sm font-bold uppercase tracking-[0.1em] text-soft transition-colors hover:text-paper"
            >
              Full resume →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
