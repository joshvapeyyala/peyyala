// Every page reads portfolio content through these functions. They query the
// database and return the shapes in src/content/types.ts.
//
// Each result is cached ("use cache") and tagged with the kind of content it
// holds, so pages stay prerendered. Admin saves call updateTag() with the same
// tag, and the next request reads fresh data. Content only changes through the
// admin, so nothing expires on a timer ("max").
import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { isThemeSetting, resolvePalette, type ThemeSetting } from "@/content/themes";
import type { Education, Job, Profile, Project, Service, SkillGroup } from "@/content/types";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";

export const contentTags = {
  projects: "projects",
  profile: "profile",
  experience: "experience",
  skills: "skills",
  education: "education",
  services: "services",
  theme: "theme",
} as const;

function cached(tag: (typeof contentTags)[keyof typeof contentTags]) {
  cacheTag(tag);
  cacheLife("max");
}

// Rows store "no screenshot / no case study" as null; the types leave them out
function toProject(row: typeof t.projects.$inferSelect): Project {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    summary: row.summary,
    role: row.role,
    url: row.url,
    urlLabel: row.urlLabel,
    status: row.status,
    ...(row.screenshot && { screenshot: row.screenshot }),
    stack: row.stack,
    highlights: row.highlights,
    ...(row.caseStudy && { caseStudy: row.caseStudy }),
  };
}

export async function getProfile(): Promise<Profile> {
  "use cache";
  cached(contentTags.profile);
  const [row] = await db.select().from(t.profile);
  if (!row) throw new Error('The database has no profile yet. Run "pnpm db:seed".');
  return {
    name: `${row.firstName} ${row.lastName}`,
    firstName: row.firstName,
    lastName: row.lastName,
    title: row.title,
    tagline: row.tagline,
    summary: row.summary,
    location: row.location,
    email: row.email,
    linkedin: row.linkedin,
    github: row.github,
    resumePdf: row.resumePdf,
    openToWork: row.openToWork,
    openToWorkLabel: row.openToWorkLabel,
    yearsOfExperience: row.yearsOfExperience,
    learning: row.learning,
  };
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cached(contentTags.projects);
  const rows = await db.select().from(t.projects).orderBy(asc(t.projects.position));
  return rows.map(toProject);
}

export async function getProject(slug: string): Promise<Project | null> {
  "use cache";
  cached(contentTags.projects);
  const [row] = await db.select().from(t.projects).where(eq(t.projects.slug, slug));
  return row ? toProject(row) : null;
}

export async function getExperience(): Promise<Job[]> {
  "use cache";
  cached(contentTags.experience);
  const [jobs, roles] = await Promise.all([
    db.select().from(t.jobs).orderBy(asc(t.jobs.position)),
    db.select().from(t.roles).orderBy(asc(t.roles.position)),
  ]);
  return jobs.map((job) => ({
    company: job.company,
    location: job.location,
    roles: roles.filter((role) => role.jobId === job.id).map(({ title, start, end, points }) => ({ title, start, end, points })),
  }));
}

export async function getSkills(): Promise<{ groups: SkillGroup[]; marquee: string[] }> {
  "use cache";
  cached(contentTags.skills);
  // The tech strip is stored on the profile row but edited with the skills
  cacheTag(contentTags.profile);
  const [groups, [profile]] = await Promise.all([
    db.select({ label: t.skillGroups.label, items: t.skillGroups.items }).from(t.skillGroups).orderBy(asc(t.skillGroups.position)),
    db.select({ techStrip: t.profile.techStrip }).from(t.profile),
  ]);
  return { groups, marquee: profile?.techStrip ?? [] };
}

export async function getEducation(): Promise<Education[]> {
  "use cache";
  cached(contentTags.education);
  return db.select({ degree: t.education.degree, school: t.education.school }).from(t.education).orderBy(asc(t.education.position));
}

export async function getServices(): Promise<{ services: Service[]; process: { step: string; title: string; text: string }[] }> {
  "use cache";
  cached(contentTags.services);
  const [services, steps] = await Promise.all([
    db
      .select({ title: t.services.title, description: t.services.description, examples: t.services.examples })
      .from(t.services)
      .orderBy(asc(t.services.position)),
    db.select({ title: t.processSteps.title, text: t.processSteps.text }).from(t.processSteps).orderBy(asc(t.processSteps.position)),
  ]);
  // Step numbers follow the order: 01, 02, ...
  return { services, process: steps.map((step, index) => ({ step: String(index + 1).padStart(2, "0"), ...step })) };
}

const fallbackTheme: ThemeSetting = { design: "ink", palette: "ink" };

export async function getTheme() {
  "use cache";
  cached(contentTags.theme);
  const [row] = await db.select({ design: t.siteSettings.design, palette: t.siteSettings.palette }).from(t.siteSettings);
  // A design or palette removed from themes.ts falls back to Ink instead of breaking the site
  const theme: ThemeSetting = row && isThemeSetting(row) ? row : fallbackTheme;
  if (row && theme === fallbackTheme) console.warn(`Unknown theme ${row.design}/${row.palette} in site_settings; using ink/ink.`);
  return { ...theme, colors: resolvePalette(theme) };
}
