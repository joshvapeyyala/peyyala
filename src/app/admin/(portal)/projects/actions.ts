"use server";

import { and, eq, max, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { CaseStudy } from "@/content/types";
import { contentTags } from "@/lib/content";
import { failed, invalid, projectSchema, type ProjectInput, type SaveResult } from "@/lib/schemas";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";

const slugTaken = () => failed("Couldn't save: another project uses this slug.", { slug: "Another project already uses this slug." });

// Creates a project (currentSlug null) or updates the one at currentSlug.
// A new project, or a changed slug, moves the admin to the project's new URL.
export async function saveProject(currentSlug: string | null, input: ProjectInput): Promise<SaveResult<ProjectInput>> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { screenshotAlt, caseStudy, ...fields } = parsed.data;
  const values = { ...fields, caseStudy: toCaseStudy(caseStudy) };

  let result: SaveResult<ProjectInput>;
  try {
    result = await db.transaction(async (tx): Promise<SaveResult<ProjectInput>> => {
      const [taken] = await tx
        .select({ id: t.projects.id })
        .from(t.projects)
        .where(and(eq(t.projects.slug, fields.slug), currentSlug === null ? undefined : ne(t.projects.slug, currentSlug)));
      if (taken) return slugTaken();

      if (currentSlug === null) {
        // New projects go to the end of the list
        const [{ last }] = await tx.select({ last: max(t.projects.position) }).from(t.projects);
        await tx.insert(t.projects).values({ ...values, position: (last ?? -1) + 1 });
        return { ok: true };
      }

      // The screenshot's file and size come from the database, never the form
      const [existing] = await tx.select({ screenshot: t.projects.screenshot }).from(t.projects).where(eq(t.projects.slug, currentSlug));
      if (!existing) return failed("This project no longer exists. It may have been deleted in another tab.");
      if (existing.screenshot && !screenshotAlt) {
        return failed("Couldn't save: 1 field needs attention.", { screenshotAlt: "Describe the screenshot for people using screen readers." });
      }
      const screenshot = existing.screenshot && { ...existing.screenshot, alt: screenshotAlt };
      await tx.update(t.projects).set({ ...values, screenshot }).where(eq(t.projects.slug, currentSlug));
      return { ok: true };
    });
  } catch (error) {
    // Another save took the slug between the check and the write
    if (isUniqueViolation(error)) return slugTaken();
    throw error;
  }
  if (!result.ok) return result;

  updateTag(contentTags.projects);
  if (fields.slug !== currentSlug) redirect(`/admin/projects/${fields.slug}`);
  return { ok: true, value: parsed.data };
}

// Saves the order of the project list: slugs, first to last
export async function reorderProjects(order: string[]): Promise<SaveResult> {
  await requireAdmin();
  const parsed = z.array(z.string()).max(500).safeParse(order);
  if (!parsed.success) return failed("Couldn't save the order. Reload the page and try again.");
  const slugs = parsed.data;

  const result = await db.transaction(async (tx): Promise<SaveResult> => {
    // The order must list exactly the projects that exist, each once
    const rows = await tx.select({ slug: t.projects.slug }).from(t.projects);
    const complete = rows.length === slugs.length && new Set(slugs).size === slugs.length && rows.every((row) => slugs.includes(row.slug));
    if (!complete) return failed("Projects were added or deleted since this page loaded. Reload it and try again.");

    for (const [index, slug] of slugs.entries()) await tx.update(t.projects).set({ position: index }).where(eq(t.projects.slug, slug));
    return { ok: true };
  });
  if (!result.ok) return result;

  updateTag(contentTags.projects);
  return { ok: true };
}

export async function deleteProject(slug: string): Promise<SaveResult> {
  await requireAdmin();
  if (typeof slug !== "string") return failed("Couldn't delete this project.");

  const deleted = await db.delete(t.projects).where(eq(t.projects.slug, slug)).returning({ id: t.projects.id });
  if (!deleted.length) return failed("This project was already deleted.");

  updateTag(contentTags.projects);
  redirect("/admin/projects");
}

// The form edits every case-study part; the database stores only the parts
// with text, and null when there are none (the site checks for that)
function toCaseStudy({ metrics, ...sections }: ProjectInput["caseStudy"]): CaseStudy | null {
  const story: CaseStudy = {};
  if (metrics.length) story.metrics = metrics.map(({ label, value }) => ({ label, value }));
  for (const key of ["problem", "approach", "architecture", "outcome"] as const) {
    if (sections[key].length) story[key] = sections[key];
  }
  return Object.keys(story).length ? story : null;
}

// Postgres error 23505, which Drizzle wraps in its own query error
function isUniqueViolation(error: unknown): boolean {
  const codeOf = (value: unknown) => (value && typeof value === "object" && "code" in value ? value.code : undefined);
  return codeOf(error) === "23505" || (error instanceof Error && codeOf(error.cause) === "23505");
}
