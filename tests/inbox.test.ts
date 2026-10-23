import { asc } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteMessage, markAllRead, setRead } from "@/app/admin/(portal)/inbox/actions";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { getMessages, getUnreadCount } from "@/server/inbox";
import { mocks } from "./mock-state";

const readFlags = async () => (await db.select().from(t.messages).orderBy(asc(t.messages.id))).map((message) => message.readAt !== null);

beforeEach(async () => {
  // Three messages, oldest first: ids 1, 2, 3
  for (const [index, name] of ["First", "Second", "Third"].entries()) {
    await db.insert(t.messages).values({ topic: "job", name, email: `${name.toLowerCase()}@example.com`, message: "Hello there!", createdAt: new Date(Date.UTC(2026, 9, 1 + index)) });
  }
});

describe("Inbox", () => {
  it("lists messages newest first and counts the unread ones", async () => {
    expect((await getMessages()).map((message) => message.name)).toEqual(["Third", "Second", "First"]);
    expect(await getUnreadCount()).toBe(3);
  });

  it("marks one message read and unread again", async () => {
    expect(await setRead(2, true)).toEqual({ ok: true });
    expect(await readFlags()).toEqual([false, true, false]);
    expect(await setRead(2, false)).toEqual({ ok: true });
    expect(await readFlags()).toEqual([false, false, false]);
    expect(mocks.refreshes).toBe(2);
  });

  it("marks everything read", async () => {
    await markAllRead();
    expect(await getUnreadCount()).toBe(0);
  });

  it("deletes one message", async () => {
    expect(await deleteMessage(1)).toEqual({ ok: true });
    expect((await getMessages()).map((message) => message.name)).toEqual(["Third", "Second"]);
    expect(await deleteMessage(1)).toMatchObject({ ok: false });
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects the id %s", async (id) => {
    expect(await setRead(id, true)).toMatchObject({ ok: false });
    expect(await deleteMessage(id)).toMatchObject({ ok: false });
    expect(await db.$count(t.messages)).toBe(3);
  });
});
