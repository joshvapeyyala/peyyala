"use server";

import { updateTag } from "next/cache";
import { contentTags } from "@/lib/content";
import { invalid, servicesSchema, type SaveResult, type ServicesInput } from "@/lib/schemas";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";

// Saves the services and the "How I work" steps, replacing both lists in one
// transaction
export async function saveServices(input: ServicesInput): Promise<SaveResult<ServicesInput>> {
  await requireAdmin();
  const parsed = servicesSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { services, process } = parsed.data;

  await db.transaction(async (tx) => {
    await tx.delete(t.services);
    if (services.length) await tx.insert(t.services).values(services.map((service, index) => ({ ...service, position: index })));

    await tx.delete(t.processSteps);
    if (process.length) await tx.insert(t.processSteps).values(process.map((step, index) => ({ ...step, position: index })));
  });

  updateTag(contentTags.services);
  return { ok: true, value: parsed.data };
}
