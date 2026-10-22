import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/site/button-link";
import { SectionLabel } from "@/components/site/section-label";
import { getProject, getProjects } from "@/lib/content";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(props: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProject(slug);
  if (!project) return {};
  return { title: `${project.name} — ${project.category}`, description: project.summary };
}

export default function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  return (
    <article className="mx-auto max-w-7xl px-5 pt-10 pb-20 sm:px-8 lg:px-10 lg:pt-14">
      <Link href="/work" className="text-[13px] font-semibold uppercase tracking-[0.1em] text-muted hover:text-paper">
        ← All work
      </Link>
      {/* The slug is URL data, so it is read inside Suspense to keep the route's shell instant */}
      <Suspense fallback={<CaseStudySkeleton />}>
        <CaseStudy params={props.params} />
      </Suspense>
    </article>
  );
}

function CaseStudySkeleton() {
  return (
    <div className="mt-10 animate-pulse" aria-hidden="true">
      <div className="h-4 w-48 rounded bg-line" />
      <div className="mt-4 h-[clamp(4rem,15vw,11rem)] w-3/4 rounded-2xl bg-ink-2" />
      <div className="mt-8 h-6 w-2/3 rounded bg-line" />
    </div>
  );
}

async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [project, projects] = await Promise.all([getProject(slug), getProjects()]);
  if (!project) notFound();

  const index = projects.findIndex((item) => item.slug === project.slug);
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  const facts = [
    { label: "Role", value: project.role },
    { label: "Status", value: "Live in production" },
    { label: "Website", value: project.urlLabel },
  ];

  return (
    <>
      <p className="mt-10 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-soft">
        <span className="font-display text-lg tracking-normal text-accent">
          {String(index + 1).padStart(2, "0")}
        </span>
        {project.category}
      </p>
      <h1 className="mt-3 font-display text-[clamp(4.5rem,17vw,13rem)] uppercase leading-[0.85]">
        {project.name}
      </h1>
      <p className="mt-8 max-w-3xl text-xl leading-relaxed text-soft sm:text-2xl">
        {project.summary}
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href={project.url} target="_blank" rel="noreferrer">
          Visit {project.urlLabel} ↗
        </ButtonLink>
      </div>

      <dl className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-ink p-6">
            <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{fact.label}</dt>
            <dd className="mt-2 text-lg font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-20 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20">
        <div>
          <SectionLabel>Stack</SectionLabel>
          <ul className="mt-5 flex flex-wrap gap-2">
            {project.stack.map((item) => (
              <li key={item} className="rounded-full border border-line px-4 py-2 text-sm text-soft">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionLabel>What I built</SectionLabel>
          <ol className="mt-5 flex flex-col">
            {project.highlights.map((point, i) => (
              <li key={point} className="flex gap-5 border-t border-line py-6 last:border-b">
                <span className="font-display text-2xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-lg leading-relaxed text-soft">{point}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <nav aria-label="More projects" className="mt-24 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
        <Link href={`/work/${previous.slug}`} className="group bg-ink p-6 sm:p-8">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">← Previous</span>
          <span className="mt-2 block font-display text-4xl uppercase transition-colors group-hover:text-accent sm:text-5xl">
            {previous.name}
          </span>
        </Link>
        <Link href={`/work/${next.slug}`} className="group bg-ink p-6 text-right sm:p-8">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">Next →</span>
          <span className="mt-2 block font-display text-4xl uppercase transition-colors group-hover:text-accent sm:text-5xl">
            {next.name}
          </span>
        </Link>
      </nav>
    </>
  );
}
