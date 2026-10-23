"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { contentTags } from "@/lib/content";
import { failed, invalid, profileSchema, type ProfileInput, type SaveResult } from "@/lib/schemas";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import * as storage from "@/server/storage";
import { checkPdf, cleanFileName } from "@/server/uploads";

// Saves the whole Profile screen: the profile row, experience, skills and
// education. The lists are replaced wholesale inside one transaction, so a
// save either lands completely or changes nothing.
export async function saveProfile(input: ProfileInput): Promise<SaveResult<ProfileInput>> {
  await requireAdmin();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { experience, skills, education, ...profile } = parsed.data;

  const saved = await db.transaction(async (tx) => {
    const [row] = await tx.update(t.profile).set(profile).where(eq(t.profile.id, 1)).returning({ id: t.profile.id });
    if (!row) return false;

    // Deleting the companies deletes their roles too
    await tx.delete(t.jobs);
    for (const [index, job] of experience.entries()) {
      const [row] = await tx.insert(t.jobs).values({ company: job.company, location: job.location, position: index }).returning({ id: t.jobs.id });
      await tx.insert(t.roles).values(job.roles.map((role, roleIndex) => ({ ...role, jobId: row.id, position: roleIndex })));
    }

    await tx.delete(t.skillGroups);
    if (skills.length) await tx.insert(t.skillGroups).values(skills.map((group, index) => ({ ...group, position: index })));

    await tx.delete(t.education);
    if (education.length) await tx.insert(t.education).values(education.map((item, index) => ({ ...item, position: index })));
    return true;
  });
  if (!saved) return failed('The database has no profile yet. Run "pnpm db:seed".');

  for (const tag of [contentTags.profile, contentTags.experience, contentTags.skills, contentTags.education]) updateTag(tag);
  return { ok: true, value: parsed.data };
}

// Replaces the resume PDF (FormData "file"). Downloads keep the uploaded
// file's name. Returns the new file's URL.
export async function uploadResume(formData: FormData): Promise<SaveResult<string>> {
  await requireAdmin();
  const file = formData.get("file");
  const pdf = await checkPdf(file);
  if (!pdf.ok) return failed(pdf.message);

  const [profile] = await db.select({ resumePdf: t.profile.resumePdf }).from(t.profile).where(eq(t.profile.id, 1));
  if (!profile) return failed("There's no profile to attach the resume to. Save the profile first.");

  const name = `${cleanFileName(file instanceof File ? file.name : "", "Resume")}.pdf`;
  const url = await storage.put("resume", pdf.file, name);
  try {
    await db.update(t.profile).set({ resumePdf: url }).where(eq(t.profile.id, 1));
  } catch (error) {
    await storage.remove(url);
    throw error;
  }
  if (profile.resumePdf !== url) await storage.remove(profile.resumePdf);

  updateTag(contentTags.profile);
  return { ok: true, value: url };
}
