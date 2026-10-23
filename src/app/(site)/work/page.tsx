import type { Metadata } from "next";
import Link from "next/link";
import { ProjectShot } from "@/components/site/project-shot";
import { SectionLabel } from "@/components/site/section-label";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description: "CareDeck, Xpensefy and Lineage: three live products designed, built and deployed solo.",
};

export default async function WorkPage() {
  const projects = await getProjects();

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12 pb-20 sm:px-8 lg:px-10 lg:pt-16">
      <SectionLabel>Work · {projects.length} live products</SectionLabel>
      <h1 className="mt-4 font-display text-[clamp(4rem,14vw,11rem)] uppercase leading-[0.86]">
        Built <span className="text-outline">solo.</span>
        <br />
        Shipped <span className="text-accent">live.</span>
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-soft">
        Each one designed, built and deployed end to end, from the database schema
        to production.
      </p>

      <ul className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <li key={project.slug}>
            <Link
              href={`/work/${project.slug}`}
              className="group flex h-full flex-col gap-5 rounded-3xl border border-line bg-ink-2 p-6 transition hover:border-accent sm:p-7"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-display text-xl text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-bold uppercase tracking-[0.08em] text-live">● Live</span>
              </div>
              <ProjectShot
                project={project}
                sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
                preload={index === 0}
                className="rounded-2xl border border-line"
              />
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-5xl uppercase leading-none transition-colors group-hover:text-accent">
                  {project.name}
                </h2>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
                  {project.category}
                </p>
              </div>
              <p className="leading-relaxed text-soft">{project.summary}</p>
              <ul className="mt-auto flex flex-wrap gap-1.5">
                {project.stack.map((item) => (
                  <li key={item} className="rounded-full bg-line px-3 py-1 text-xs text-soft">
                    {item}
                  </li>
                ))}
              </ul>
              <span className="text-sm font-bold uppercase tracking-[0.1em] text-accent">
                Case study →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
