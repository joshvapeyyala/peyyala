"use server";

import { updateTag } from "next/cache";
import { contentTags } from "@/lib/content";
import { invalid, profileSchema, type ProfileInput, type SaveResult } from "@/lib/schemas";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";

// Saves the whole Profile screen: the profile row, experience, skills and
// education. The lists are replaced wholesale inside one transaction, so a
// save either lands completely or changes nothing.
export async function saveProfile(input: ProfileInput): Promise<SaveResult<ProfileInput>> {
  await requireAdmin();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { experience, skills, education, ...profile } = parsed.data;

  await db.transaction(async (tx) => {
    await tx
      .insert(t.profile)
      .values({ id: 1, ...profile })
      .onConflictDoUpdate({ target: t.profile.id, set: { ...profile, updatedAt: new Date() } });

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
  });

  for (const tag of [contentTags.profile, contentTags.experience, contentTags.skills, contentTags.education]) updateTag(tag);
  return { ok: true, value: parsed.data };
}
