"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { deleteMessage, markAllRead, setRead } from "@/app/admin/(portal)/inbox/actions";
import type { MessageTopic } from "@/lib/message-topics";
import type { SaveResult } from "@/lib/schemas";
import type { InboxMessage } from "@/server/inbox";
import { Badge, Button, buttonBase, buttonStyles } from "./ui";

const topicBadges: Record<MessageTopic, { label: string; tone: "primary" | "success" | "neutral" }> = {
  job: { label: "Job role", tone: "primary" },
  project: { label: "Project", tone: "success" },
  other: { label: "Other", tone: "neutral" },
};

// Runs an Inbox action, keeping its error message to show
function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(action: () => Promise<SaveResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message);
    });
  }
  return { pending, error, run };
}

export function MessageCard({ message }: { message: InboxMessage }) {
  const { pending, error, run } = useAction();
  const [confirming, setConfirming] = useState(false);
  const unread = !message.readAt;
  const badge = topicBadges[message.topic];
  const reply = `mailto:${message.email}?subject=${encodeURIComponent("Re: your message via my portfolio")}`;

  return (
    <article
      aria-label={`${unread ? "Unread message" : "Message"} from ${message.name}`}
      className={`rounded-xl border bg-panel p-5 transition-opacity ${unread ? "border-primary/50" : "border-border"} ${pending ? "opacity-60" : ""}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className={`flex items-center gap-2 text-sm ${unread ? "font-semibold" : "font-medium"}`}>
            {unread && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
            {message.name}
          </h2>
          <p className="mt-0.5 truncate text-xs text-muted">
            {message.company && `${message.company} · `}
            {message.email}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={badge.tone}>{badge.label}</Badge>
          <span className="text-xs text-muted">
            <LocalTime iso={message.sentAt} />
          </span>
        </div>
      </header>

      <p className="mt-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">{message.message}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Opens the admin's mail app; replying counts as reading it */}
        <a href={reply} onClick={() => unread && run(() => setRead(message.id, true))} className={`${buttonBase} ${buttonStyles.primary}`}>
          Reply
        </a>
        <Button disabled={pending} onClick={() => run(() => setRead(message.id, unread))}>
          {unread ? "Mark as read" : "Mark unread"}
        </Button>
        {confirming ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Delete for good?</span>
            <Button variant="danger" disabled={pending} onClick={() => run(() => deleteMessage(message.id))}>
              Delete
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
              Keep
            </Button>
          </span>
        ) : (
          <Button variant="ghost" disabled={pending} onClick={() => setConfirming(true)}>
            Delete
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

export function MarkAllRead() {
  const { pending, error, run } = useAction();
  return (
    <>
      <Button disabled={pending} onClick={() => run(markAllRead)}>
        {pending ? "Marking…" : "Mark all as read"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </>
  );
}

const noSubscription = () => () => {};

// A date in the admin's own time zone and format. The server doesn't know
// them, so it prints the plain date and the browser fills in the rest.
function LocalTime({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    noSubscription,
    () => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    () => iso.slice(0, 10),
  );
  return <time dateTime={iso}>{text}</time>;
}
