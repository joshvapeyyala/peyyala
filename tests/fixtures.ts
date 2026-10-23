// A small, known set of content for tests to start from
import { asc } from "drizzle-orm";
import type { ProfileInput, ProjectInput, ServicesInput } from "@/lib/schemas";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";

// The profile row's own fields; the form input adds the lists
const profileFields = {
  firstName: "Ada",
  lastName: "Lovelace",
  title: "Software Engineer",
  tagline: "Backend developer",
  summary: "Builds reliable backends.",
  location: "London",
  yearsOfExperience: "3",
  openToWork: true,
  openToWorkLabel: "Open to roles",
  email: "ada@example.com",
  linkedin: "https://linkedin.com/in/ada",
  github: "https://github.com/ada",
  learning: ["Rust"],
  techStrip: ["Node.js", "Postgres"],
};

export const profileInput: ProfileInput = {
  ...profileFields,
  experience: [{ company: "Analytical Engines", location: "London", roles: [{ title: "Engineer", start: "2022", end: "Present", points: ["Built things"] }] }],
  skills: [{ label: "Backend", items: ["Node.js"] }],
  education: [{ degree: "BSc Mathematics", school: "University of London" }],
};

// A project row's own fields; the form input adds the alt text and case study
function projectFields(slug: string) {
  return {
    slug,
    name: `Project ${slug}`,
    category: "Web app",
    summary: "A test project.",
    role: "Solo developer",
    url: `https://${slug}.example.com`,
    urlLabel: `${slug}.example.com`,
    status: "live" as const,
    stack: ["Next.js"],
    highlights: ["Did a thing"],
  };
}

export function projectInput(slug: string, overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    ...projectFields(slug),
    screenshotAlt: "",
    caseStudy: { metrics: [], problem: [], approach: [], architecture: [], outcome: [] },
    ...overrides,
  };
}

export const servicesInput: ServicesInput = {
  services: [
    { title: "Backend & APIs", description: "REST APIs and databases.", examples: ["Auth"] },
    { title: "Web apps", description: "Dashboards and tools.", examples: [] },
  ],
  process: [
    { title: "Call", text: "We talk." },
    { title: "Build", text: "I build it." },
  ],
};

// Profile, theme and three projects (alpha, beta, gamma, in that order)
export async function seedBasics() {
  await db.insert(t.profile).values({ ...profileFields, resumePdf: "/resume.pdf" });
  await db.insert(t.siteSettings).values({ design: "ink", palette: "ink" });
  await db.insert(t.projects).values(["alpha", "beta", "gamma"].map((slug, position) => ({ ...projectFields(slug), position })));
}

export async function projectSlugsInOrder() {
  const rows = await db.select({ slug: t.projects.slug }).from(t.projects).orderBy(asc(t.projects.position));
  return rows.map((row) => row.slug);
}
