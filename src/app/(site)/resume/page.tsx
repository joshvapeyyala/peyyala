import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/site/print-button";
import { statusMeta } from "@/components/site/status-badge";
import { getEducation, getExperience, getProfile, getProjects, getSkills } from "@/lib/content";

export const metadata: Metadata = {
  title: "Resume",
  description: "Resume of Joshva Peyyala, backend-focused full-stack software engineer.",
};

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-line pb-3 text-[12px] font-bold uppercase tracking-[0.16em] text-paper print:text-[11px]">
      {children}
    </h2>
  );
}

export default async function ResumePage() {
  const [profile, experience, projects, skills, education] = await Promise.all([
    getProfile(),
    getExperience(),
    getProjects(),
    getSkills(),
    getEducation(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 pt-10 pb-20 sm:px-8 lg:pt-14 print:max-w-none print:p-0">
      <div className="no-print mb-10 flex flex-wrap gap-3">
        <a
          href={profile.resumePdf}
          download
          className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-[15px] font-bold text-ink transition hover:brightness-110 sm:h-14 sm:px-7"
        >
          Download PDF ↓
        </a>
        <PrintButton />
      </div>

      <article className="print-plain flex flex-col gap-12 print:gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-[clamp(3.5rem,11vw,6.5rem)] uppercase leading-[0.9] print:text-5xl">
            {profile.name}
          </h1>
          <p className="text-xl font-semibold">
            {profile.title} <span className="text-muted">· {profile.tagline}</span>
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-soft">
            <li>{profile.location}</li>
            <li>
              <a href={`mailto:${profile.email}`} className="hover:text-paper">{profile.email}</a>
            </li>
            <li>
              <a href={profile.linkedin} className="hover:text-paper">linkedin.com/in/joshva-peyyala</a>
            </li>
            <li>
              <a href={profile.github} className="hover:text-paper">github.com/joshvapeyyala</a>
            </li>
          </ul>
        </header>

        <section className="flex flex-col gap-4">
          <Heading>Summary</Heading>
          <p className="leading-relaxed text-soft">{profile.summary}</p>
        </section>

        <section className="flex flex-col gap-4">
          <Heading>Experience</Heading>
          {experience.map((job) => (
            <div key={job.company} className="flex flex-col gap-6">
              <p className="text-sm italic text-muted">
                {job.company} — {job.location}
              </p>
              {job.roles.map((role) => (
                <div key={role.title} className="break-inside-avoid">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="text-lg font-semibold">{role.title}</h3>
                    <p className="text-sm text-muted">
                      {role.start} – {role.end}
                    </p>
                  </div>
                  <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-soft marker:text-muted">
                    {role.points.map((point) => (
                      <li key={point} className="leading-relaxed">{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6">
          <Heading>Projects</Heading>
          {projects.map((project) => (
            <div key={project.slug} className="break-inside-avoid">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-lg font-semibold">
                  <Link href={`/work/${project.slug}`} className="hover:text-accent">
                    {project.name}
                  </Link>{" "}
                  <span className="font-normal text-muted">— {project.category} ({statusMeta[project.status].label})</span>
                </h3>
                <a href={project.url} className="text-sm text-soft hover:text-paper">
                  {project.urlLabel}
                </a>
              </div>
              <p className="mt-1 text-sm italic text-muted">
                {project.role} · {project.stack.join(", ")}
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-soft marker:text-muted">
                {project.highlights.map((point) => (
                  <li key={point} className="leading-relaxed">{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <Heading>Technical skills</Heading>
          <dl className="flex flex-col gap-3">
            {skills.groups.map((group) => (
              <div key={group.label} className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                <dt className="font-semibold">{group.label}</dt>
                <dd className="text-soft">{group.items.join(", ")}</dd>
              </div>
            ))}
            <div className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-semibold">Currently learning</dt>
              <dd className="text-soft">{profile.learning.join(", ")}</dd>
            </div>
          </dl>
        </section>

        <section className="flex flex-col gap-4">
          <Heading>Education</Heading>
          {education.map((item) => (
            <p key={item.degree}>
              <span className="font-semibold">{item.degree}</span>
              <span className="text-soft"> — {item.school}</span>
            </p>
          ))}
        </section>
      </article>
    </div>
  );
}
