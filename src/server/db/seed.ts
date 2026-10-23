// Imports the site's content from src/content into the database.
//
//   pnpm db:seed           fills an empty database
//   pnpm db:seed --reset   replaces all content (contact messages are kept)
//   pnpm db:seed --check   only compares the database with src/content
//
// After writing, it reads everything back and compares it with the source
// files, so nothing is silently lost or changed in the move.
import "./load-env";
import { asc } from "drizzle-orm";
import { isDeepStrictEqual } from "node:util";
import { education, experience, marqueeStack, profile, skills } from "@/content/profile";
import { projects } from "@/content/projects";
import { process as steps, services } from "@/content/services";
import { theme } from "@/content/site";
import { db, pool } from "./client";
import * as t from "./schema";

const reset = process.argv.includes("--reset");
const checkOnly = process.argv.includes("--check");

// Child tables before parents, so foreign keys don't block the delete
const contentTables = [t.roles, t.jobs, t.projects, t.profile, t.skillGroups, t.education, t.services, t.processSteps, t.siteSettings];

async function seed() {
  const existing = await db.$count(t.projects);
  if (existing > 0 && !reset) {
    throw new Error(`The database already has ${existing} projects. Run "pnpm db:seed --reset" to replace all content.`);
  }

  await db.transaction(async (tx) => {
    for (const table of contentTables) await tx.delete(table);

    await tx.insert(t.projects).values(projects.map((project, index) => ({ ...project, position: index })));

    // `name` isn't stored: it's always the first and last name together
    const { name, ...profileRow } = profile;
    if (name !== `${profileRow.firstName} ${profileRow.lastName}`) throw new Error(`profile.name "${name}" isn't firstName + lastName`);
    await tx.insert(t.profile).values({ ...profileRow, techStrip: marqueeStack });

    for (const [index, job] of experience.entries()) {
      const [row] = await tx.insert(t.jobs).values({ company: job.company, location: job.location, position: index }).returning({ id: t.jobs.id });
      await tx.insert(t.roles).values(job.roles.map((role, roleIndex) => ({ ...role, jobId: row.id, position: roleIndex })));
    }

    await tx.insert(t.skillGroups).values(skills.map((group, index) => ({ ...group, position: index })));
    await tx.insert(t.education).values(education.map((item, index) => ({ ...item, position: index })));
    await tx.insert(t.services).values(services.map((service, index) => ({ ...service, position: index })));
    await tx.insert(t.processSteps).values(steps.map(({ title, text }, index) => ({ title, text, position: index })));
    await tx.insert(t.siteSettings).values(theme);
  });
}

// Reads the rows back into the shapes of src/content and compares
async function verify() {
  const [profileRow] = await db.select().from(t.profile);
  const [themeRow] = await db.select().from(t.siteSettings);
  const jobRows = await db.select().from(t.jobs).orderBy(asc(t.jobs.position));
  const roleRows = await db.select().from(t.roles).orderBy(asc(t.roles.position));

  const checks: [string, unknown, unknown][] = [
    ["projects", (await db.select().from(t.projects).orderBy(asc(t.projects.position))).map((row) => omit(row, "id", "position", "createdAt", "updatedAt")), projects],
    ["profile", { name: `${profileRow.firstName} ${profileRow.lastName}`, ...omit(profileRow, "id", "techStrip", "updatedAt") }, profile],
    ["tech strip", profileRow.techStrip, marqueeStack],
    [
      "experience",
      jobRows.map((job) => ({
        company: job.company,
        location: job.location,
        roles: roleRows.filter((role) => role.jobId === job.id).map((role) => omit(role, "id", "jobId", "position")),
      })),
      experience,
    ],
    ["skills", (await db.select().from(t.skillGroups).orderBy(asc(t.skillGroups.position))).map((row) => omit(row, "id", "position")), skills],
    ["education", (await db.select().from(t.education).orderBy(asc(t.education.position))).map((row) => omit(row, "id", "position")), education],
    ["services", (await db.select().from(t.services).orderBy(asc(t.services.position))).map((row) => omit(row, "id", "position")), services],
    [
      "process steps",
      (await db.select().from(t.processSteps).orderBy(asc(t.processSteps.position))).map((row, index) => ({
        step: String(index + 1).padStart(2, "0"),
        title: row.title,
        text: row.text,
      })),
      steps,
    ],
    ["theme", omit(themeRow, "id", "updatedAt"), theme],
  ];

  for (const [label, actual, expected] of checks) {
    const ok = isDeepStrictEqual(sortKeys(actual), sortKeys(expected));
    const count = Array.isArray(expected) ? ` (${expected.length})` : "";
    console.log(`${ok ? "✓" : "✗"} ${label}${count}`);
    if (!ok) throw new Error(`The database's ${label} don't match src/content. Read back:
${JSON.stringify(actual, null, 2)}`);
  }
}

// Drops database-only columns, and nulls (optional fields absent in src/content)
function omit<T extends object>(row: T, ...keys: string[]) {
  return Object.fromEntries(Object.entries(row).filter(([key, value]) => !keys.includes(key) && value !== null));
}

// Same values with keys in a fixed order, so key order doesn't count as a difference
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]));
  }
  return value;
}

(checkOnly ? Promise.resolve() : seed())
  .then(verify)
  .then(() => console.log(checkOnly ? "Database matches src/content." : "Seed complete."))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
