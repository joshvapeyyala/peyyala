// Reads contact messages for the admin. Unlike portfolio content, messages are
// private, so every read checks the session itself rather than relying on the
// admin layout (which streams separately and can't hold a page back).
// Reads happen per request and aren't cached, so new messages show at once.
import "server-only";
import { count, desc, isNull } from "drizzle-orm";
import type { MessageTopic } from "@/lib/message-topics";
import { requireAdmin } from "./auth";
import { db } from "./db/client";
import * as t from "./db/schema";

export type InboxMessage = {
  id: number;
  topic: MessageTopic;
  name: string;
  email: string;
  company: string | null;
  message: string;
  // ISO strings: they're passed to client components
  sentAt: string;
  readAt: string | null;
};

// Newest first. The Inbox shows this many; older ones stay in the database.
export const inboxLimit = 200;

export async function getMessages(): Promise<InboxMessage[]> {
  await requireAdmin();
  const rows = await db
    .select({
      id: t.messages.id,
      topic: t.messages.topic,
      name: t.messages.name,
      email: t.messages.email,
      company: t.messages.company,
      message: t.messages.message,
      createdAt: t.messages.createdAt,
      readAt: t.messages.readAt,
    })
    .from(t.messages)
    .orderBy(desc(t.messages.createdAt), desc(t.messages.id))
    .limit(inboxLimit);
  return rows.map(({ createdAt, readAt, ...row }) => ({ ...row, sentAt: createdAt.toISOString(), readAt: readAt?.toISOString() ?? null }));
}

export async function getUnreadCount(): Promise<number> {
  await requireAdmin();
  const [row] = await db.select({ unread: count() }).from(t.messages).where(isNull(t.messages.readAt));
  return row.unread;
}
