import type { Metadata } from "next";
import { Suspense } from "react";
import { MarkAllRead, MessageCard } from "@/components/admin/inbox";
import { PageHeader } from "@/components/admin/page-header";
import { getMessages, inboxLimit } from "@/server/inbox";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <>
      <PageHeader title="Inbox" description="Messages sent through the contact form, newest first. You also get an email for each one." />
      {/* Messages are read per request, so they stream in */}
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-sunken" />}>
        <Messages />
      </Suspense>
    </>
  );
}

async function Messages() {
  const messages = await getMessages();
  const unread = messages.filter((message) => !message.readAt).length;

  if (messages.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border-strong px-4 py-12 text-center text-sm text-muted">
        No messages yet. When someone uses the contact form, it lands here.
      </p>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {messages.length} {messages.length === 1 ? "message" : "messages"} · {unread} unread
        </p>
        {unread > 0 && <MarkAllRead />}
      </div>
      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
      </div>
      {messages.length === inboxLimit && <p className="mt-4 text-xs text-muted">Showing the newest {inboxLimit}. Older messages are kept in the database.</p>}
    </>
  );
}
