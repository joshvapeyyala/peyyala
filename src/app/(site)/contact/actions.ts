"use server";

import { createHmac } from "node:crypto";
import { gt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { after } from "next/server";
import { getProfile } from "@/lib/content";
import { messageTopicLabels } from "@/lib/message-topics";
import { contactSchema, fieldErrors, type ContactInput, type FieldErrors } from "@/lib/schemas";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { sendMail } from "@/server/mail";

export type ContactState =
  | { status: "idle" }
  | { status: "sent" }
  // `values` refills the form, which React clears after every submission
  | { status: "error"; message: string; errors: FieldErrors; values: Record<string, string> };

// How many messages one visitor, and everyone together, can send
const limits = { visitorPer10Minutes: 3, visitorPerDay: 10, sitePerHour: 30 };

// The public contact form. Saves the message first, then emails the admin
// after the response, so a failed email never loses a message.
export async function sendMessage(_previous: ContactState, formData: FormData): Promise<ContactState> {
  const values = Object.fromEntries(["topic", "name", "email", "company", "message"].map((key) => [key, String(formData.get(key) ?? "")]));
  const fail = (message: string, errors: FieldErrors = {}): ContactState => ({ status: "error", message, errors, values });

  // A field people never see (it's hidden off-screen); bots fill in everything.
  // They're told it worked, so they don't try again.
  if (formData.get("website")) return { status: "sent" };

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));

  const sender = await senderHash();
  const directly = `Please try again later, or email ${(await getProfile()).email} directly.`;
  try {
    if (await overLimit(sender)) return fail(`You've sent a few messages in a short time. ${directly}`);
    const { company, ...message } = parsed.data;
    await db.insert(t.messages).values({ ...message, company: company || null, senderHash: sender });
  } catch (error) {
    console.error("Contact form: couldn't save a message.", error);
    return fail(`Something went wrong on my side and your message wasn't sent. ${directly}`);
  }

  after(() => notify(parsed.data).catch((error) => console.error("Contact form: the message is saved in the Inbox, but the email about it failed.", error)));
  return { status: "sent" };
}

// The visitor's IP address, hashed with a secret so it can't be turned back
// into the address. Behind a proxy or load balancer, the visitor's address is
// the first entry in x-forwarded-for. That header can be faked when nothing
// sets it, which the site-wide limit below backs up.
async function senderHash() {
  const request = await headers();
  const ip = request.get("x-forwarded-for")?.split(",")[0]?.trim() || request.get("x-real-ip") || "unknown";
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "").update(ip).digest("hex").slice(0, 32);
}

async function overLimit(sender: string) {
  const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);
  const fromSender = sql`${t.messages.senderHash} = ${sender}`;
  const [usage] = await db
    .select({
      visitorRecent: sql<number>`count(*) filter (where ${fromSender} and ${t.messages.createdAt} > ${minutesAgo(10)})`.mapWith(Number),
      visitorToday: sql<number>`count(*) filter (where ${fromSender})`.mapWith(Number),
      siteHour: sql<number>`count(*) filter (where ${t.messages.createdAt} > ${minutesAgo(60)})`.mapWith(Number),
    })
    .from(t.messages)
    .where(gt(t.messages.createdAt, minutesAgo(24 * 60)));
  return usage.visitorRecent >= limits.visitorPer10Minutes || usage.visitorToday >= limits.visitorPerDay || usage.siteHour >= limits.sitePerHour;
}

async function notify({ topic, name, email, company, message }: ContactInput) {
  const site = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  await sendMail({
    subject: `[Portfolio] ${messageTopicLabels[topic]}: ${name}${company ? ` (${company})` : ""}`,
    text: [message, "", `— ${name}${company ? `, ${company}` : ""}`, email, "", `Reply to this email to answer ${name}, or open the Inbox: ${site}/admin/inbox`].join("\n"),
    replyTo: email,
  });
}
