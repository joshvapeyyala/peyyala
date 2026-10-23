"use server";

import { eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { failed, type SaveResult } from "@/lib/schemas";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";

// The Inbox reads messages per request, so refresh() re-renders it with the change

const messageId = z.number().int().positive();

export async function setRead(id: number, read: boolean): Promise<SaveResult> {
  await requireAdmin();
  const parsed = z.tuple([messageId, z.boolean()]).safeParse([id, read]);
  if (!parsed.success) return failed("Couldn't update that message.");

  const [row] = await db
    .update(t.messages)
    .set({ readAt: read ? new Date() : null })
    .where(eq(t.messages.id, parsed.data[0]))
    .returning({ id: t.messages.id });
  if (!row) return failed("That message no longer exists.");

  refresh();
  return { ok: true };
}

export async function markAllRead(): Promise<SaveResult> {
  await requireAdmin();
  await db.update(t.messages).set({ readAt: new Date() }).where(isNull(t.messages.readAt));
  refresh();
  return { ok: true };
}

export async function deleteMessage(id: number): Promise<SaveResult> {
  await requireAdmin();
  const parsed = messageId.safeParse(id);
  if (!parsed.success) return failed("Couldn't delete that message.");

  const [row] = await db.delete(t.messages).where(eq(t.messages.id, parsed.data)).returning({ id: t.messages.id });
  if (!row) return failed("That message was already deleted.");

  refresh();
  return { ok: true };
}
