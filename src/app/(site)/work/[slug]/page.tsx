import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/site/button-link";
import { ProjectShot } from "@/components/site/project-shot";
import { SectionLabel } from "@/components/site/section-label";
import { statusMeta } from "@/components/site/status-badge";
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
    { label: "Status", value: statusMeta[project.status].detail },
    { label: "Website", value: project.urlLabel },
  ];

  const story = project.caseStudy ?? {};
  const sections = [
    { title: "The problem", paragraphs: story.problem },
    { title: "Approach", paragraphs: story.approach },
    { title: "Architecture", paragraphs: story.architecture },
    { title: "Outcome", paragraphs: story.outcome },
  ].filter((section) => section.paragraphs?.length);
  const metrics = story.metrics ?? [];

  return (
    <>
      <p className="mt-10 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-soft">
        <span className="font-display text-lg tracking-normal text-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
        {project.category}
      </p>
      <h1 className="mega-title mt-3 font-display text-[clamp(4.5rem,17vw,13rem)] uppercase leading-[0.85]">
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

      <a
        href={project.url}
        target="_blank"
        rel="noreferrer"
        className="group mt-16 block"
        aria-label={`Open ${project.urlLabel}`}
      >
        <ProjectShot
          project={project}
          sizes="(min-width: 1280px) 1200px, 100vw"
          preload
          className="card rounded-3xl border border-line transition-colors group-hover:border-accent"
        />
      </a>

      <dl className="card mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="bg-ink p-6">
            <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{fact.label}</dt>
            <dd className="mt-2 text-lg font-semibold">{fact.value}</dd>
          </div>
        ))}
      </dl>

      {metrics.length > 0 && (
        <dl className="mt-20 grid grid-cols-2 gap-x-6 gap-y-10 border-y border-line py-10 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dd className="font-display text-[clamp(2.75rem,6vw,4.5rem)] uppercase leading-none">{metric.value}</dd>
              <dt className="mt-3 text-sm text-soft">{metric.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {sections.length > 0 && (
        <div className="mt-20 flex flex-col">
          {sections.map((section, i) => (
            <section
              key={section.title}
              className="grid gap-4 border-t border-line py-10 last:border-b lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-20"
            >
              <h2 className="flex items-baseline gap-4 font-display text-3xl uppercase sm:text-4xl">
                <span className="text-xl text-muted">{String(i + 1).padStart(2, "0")}</span>
                {section.title}
              </h2>
              <div className="flex max-w-3xl flex-col gap-4 text-lg leading-relaxed text-soft">
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

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
                <span className="font-display text-2xl text-muted">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-lg leading-relaxed text-soft">{point}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <nav aria-label="More projects" className="card mt-24 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
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
