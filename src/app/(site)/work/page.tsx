import type { Metadata } from "next";
import Link from "next/link";
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
              {/* Stand-in until real screenshots are added (via the future admin) */}
              <div className="flex aspect-[16/10] flex-col overflow-hidden rounded-2xl border border-line bg-ink" aria-hidden="true">
                <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-line" />
                  <span className="h-2 w-2 rounded-full bg-line" />
                  <span className="h-2 w-2 rounded-full bg-line" />
                  <span className="ml-2 truncate text-[11px] text-muted">{project.urlLabel}</span>
                </div>
                <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                  <span className="text-outline font-display text-[clamp(3rem,9vw,5.5rem)] uppercase leading-none opacity-60 transition group-hover:opacity-100">
                    {project.name}
                  </span>
                  <span className="absolute bottom-0 left-0 h-1 w-1/3 bg-accent transition-all duration-500 group-hover:w-full" />
                </div>
              </div>
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
