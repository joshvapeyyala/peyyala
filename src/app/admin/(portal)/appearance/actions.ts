"use server";

import { updateTag } from "next/cache";
import { contentTags } from "@/lib/content";
import { failed, themeSchema, type SaveResult, type ThemeInput } from "@/lib/schemas";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";

// Switches the public site to another design and palette
export async function saveTheme(input: ThemeInput): Promise<SaveResult> {
  await requireAdmin();
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) return failed(parsed.error.issues[0].message);

  await db
    .insert(t.siteSettings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: t.siteSettings.id, set: { ...parsed.data, updatedAt: new Date() } });

  updateTag(contentTags.theme);
  return { ok: true };
}
