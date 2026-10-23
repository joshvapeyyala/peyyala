import { describe, expect, it } from "vitest";
import { sendMessage, type ContactState } from "@/app/(site)/contact/actions";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { seedBasics } from "./fixtures";
import { mocks } from "./mock-state";

const idle: ContactState = { status: "idle" };

function form(fields: Record<string, string> = {}) {
  const data = new FormData();
  const values = { topic: "job", name: "Sam Recruiter", email: "sam@example.com", company: "Example Corp", message: "We have a backend role open.", ...fields };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

// A message from a given visitor IP address, as one proxy (or Next.js itself)
// reports it: appended after whatever the visitor sent in the header
function from(ip: string, fields?: Record<string, string>, claimed = "198.51.100.99") {
  mocks.headers = new Headers({ "x-forwarded-for": `${claimed}, ${ip}` });
  return sendMessage(idle, form(fields));
}

describe("sendMessage", () => {
  it("saves the message, then emails it after responding", async () => {
    await seedBasics();
    expect(await from("203.0.113.7")).toEqual({ status: "sent" });

    const [saved] = await db.select().from(t.messages);
    expect(saved).toMatchObject({ topic: "job", name: "Sam Recruiter", company: "Example Corp", readAt: null });
    // The visitor is remembered only as a hash, never by their address
    expect(saved.senderHash).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(saved)).not.toContain("203.0.113.7");

    expect(mocks.mails).toEqual([]);
    await Promise.all(mocks.afterTasks.map((task) => task()));
    expect(mocks.mails).toMatchObject([{ replyTo: "sam@example.com", subject: expect.stringContaining("Sam Recruiter") }]);
  });

  it("keeps the message when the email fails", async () => {
    await seedBasics();
    mocks.mailFails = true;
    expect(await from("203.0.113.7")).toEqual({ status: "sent" });
    await Promise.all(mocks.afterTasks.map((task) => task()));
    expect(await db.$count(t.messages)).toBe(1);
  });

  it("explains each problem and hands back what was typed", async () => {
    await seedBasics();
    const result = await from("203.0.113.7", { email: "nope", company: "", message: "Hi" });
    expect(result).toMatchObject({
      status: "error",
      errors: { email: expect.any(String), company: "Which company is hiring?", message: expect.any(String) },
      values: { name: "Sam Recruiter", email: "nope", message: "Hi" },
    });
    expect(await db.$count(t.messages)).toBe(0);
  });

  it("only asks for a company when it's about a job", async () => {
    await seedBasics();
    expect(await from("203.0.113.7", { topic: "project", company: "" })).toEqual({ status: "sent" });
  });

  it("tells bots that fill the hidden field it worked, but saves nothing", async () => {
    await seedBasics();
    const data = form();
    data.set("website", "https://spam.example");
    expect(await sendMessage(idle, data)).toEqual({ status: "sent" });
    expect(await db.$count(t.messages)).toBe(0);
    expect(mocks.afterTasks).toEqual([]);
  });

  it("limits one visitor to 3 messages in 10 minutes, without blocking others", async () => {
    await seedBasics();
    for (let i = 0; i < 3; i++) expect(await from("203.0.113.7")).toEqual({ status: "sent" });
    expect(await from("203.0.113.7")).toMatchObject({ status: "error", message: expect.stringMatching(/a few messages/) });
    expect(await from("198.51.100.2")).toEqual({ status: "sent" });
    expect(await db.$count(t.messages)).toBe(4);
  });

  it("can't be dodged by making up a different address in the header", async () => {
    await seedBasics();
    for (let i = 0; i < 3; i++) await from("203.0.113.7", {}, `10.9.9.${i}`);
    expect(await from("203.0.113.7", {}, "10.9.9.200")).toMatchObject({ status: "error" });
  });

  it("puts names on one line, so they can't add lines to the email's headers", async () => {
    await seedBasics();
    await from("203.0.113.7", { name: "Sam\r\nBcc: victim@example.com", company: "Example\nCorp" });
    const [saved] = await db.select().from(t.messages);
    expect(saved).toMatchObject({ name: "Sam Bcc: victim@example.com", company: "Example Corp" });
  });

  it("limits the whole site to 30 messages an hour", async () => {
    await seedBasics();
    await db.insert(t.messages).values(Array.from({ length: 30 }, (_, i) => ({ topic: "other" as const, name: "Someone", email: "x@example.com", message: "Hello there!", senderHash: `visitor-${i}` })));
    expect(await from("192.0.2.50")).toMatchObject({ status: "error" });
    expect(await db.$count(t.messages)).toBe(30);
  });
});
