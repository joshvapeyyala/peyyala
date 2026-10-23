import type { Metadata } from "next";
import Link from "next/link";
import { ProjectShot } from "@/components/site/project-shot";
import { SectionLabel } from "@/components/site/section-label";
import { StatusBadge } from "@/components/site/status-badge";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description: "CareDeck, Xpensefy and Lineage: three live products designed, built and deployed solo.",
};

export default async function WorkPage() {
  const projects = await getProjects();
  const stats = [
    { label: "Products", value: projects.length },
    { label: "Live now", value: projects.filter((project) => project.status === "live").length },
    { label: "Team", value: "Solo" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12 pb-20 sm:px-8 lg:px-10 lg:pt-16">
      <header className="grid gap-10 border-b border-line pb-12 lg:grid-cols-2 lg:items-end lg:gap-20">
        <div>
          <SectionLabel>Work</SectionLabel>
          <h1 className="mt-4 font-display text-[clamp(3.25rem,9vw,7rem)] uppercase leading-[0.88]">
            Selected <span className="text-accent">work</span>
          </h1>
        </div>
        <div>
          <p className="max-w-xl text-lg leading-relaxed text-soft">
            Each one designed, built and deployed end to end, from the database
            schema to production.
          </p>
          <dl className="mt-8 flex gap-10 sm:gap-14">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{stat.label}</dt>
                <dd className="mt-1 font-display text-4xl uppercase">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                <StatusBadge status={project.status} />
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
              <span className="text-sm font-bold uppercase tracking-[0.1em] text-soft transition-colors group-hover:text-paper">
                Case study →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
