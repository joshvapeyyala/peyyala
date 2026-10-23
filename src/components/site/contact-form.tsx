"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessage, type ContactState } from "@/app/(site)/contact/actions";
import { messageTopicLabels, messageTopics, type MessageTopic } from "@/lib/message-topics";

type TopicId = MessageTopic;

const field =
  "h-13 w-full rounded-2xl border border-line bg-ink-2 px-4 text-base text-paper placeholder:text-muted transition focus:border-accent focus:outline-none aria-invalid:border-accent";

const placeholders: Record<TopicId, string> = {
  job: "The role, the team, and a link to the job post.",
  project: "What you want built, rough timeline and budget.",
  other: "What's on your mind?",
};

// Sends the message to the admin's Inbox. Works before JavaScript loads too:
// the form posts to the server action like a plain HTML form.
export function ContactForm({ email }: { email: string }) {
  // A new round remounts the form, clearing it for another message
  const [round, setRound] = useState(0);
  return <ContactFormRound key={round} email={email} onAnother={() => setRound(round + 1)} />;
}

function ContactFormRound({ email, onAnother }: { email: string; onAnother: () => void }) {
  const [state, formAction, pending] = useActionState(sendMessage, { status: "idle" } satisfies ContactState);
  const [topic, setTopic] = useState<TopicId>("job");
  const form = useRef<HTMLFormElement>(null);
  const failed = state.status === "error" ? state : null;

  // After a rejected send, move to the first field to fix
  useEffect(() => {
    if (failed) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [failed]);

  if (state.status === "sent") {
    return (
      <div role="status" className="card flex flex-col items-start gap-4 rounded-3xl border border-line bg-ink-2 p-7 sm:p-9">
        <p className="font-display text-4xl uppercase">Message sent</p>
        <p className="text-soft">Thanks for getting in touch. I read every message and reply from {email}.</p>
        <button type="button" onClick={onAnother} className="text-sm font-semibold text-soft underline underline-offset-4 hover:text-paper">
          Send another message
        </button>
      </div>
    );
  }

  // Props for one input: its previous value, and its error if it has one
  const bind = (name: string) => {
    const error = failed?.errors[name];
    return {
      name,
      id: `contact-${name}`,
      defaultValue: failed?.values[name],
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `contact-${name}-error` : undefined,
    };
  };
  const errorFor = (name: string) =>
    failed?.errors[name] && (
      <span id={`contact-${name}-error`} className="text-sm font-semibold text-accent">
        {failed.errors[name]}
      </span>
    );

  return (
    <form ref={form} action={formAction} noValidate className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-sm font-semibold text-soft">I&apos;m reaching out about</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {messageTopics.map((id) => (
            <label
              key={id}
              className={`inline-flex h-11 cursor-pointer items-center rounded-full border px-5 text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                topic === id ? "border-accent bg-accent text-on-accent" : "border-line text-soft hover:border-paper hover:text-paper"
              }`}
            >
              <input type="radio" name="topic" value={id} checked={topic === id} onChange={() => setTopic(id)} className="sr-only" />
              {messageTopicLabels[id]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
          Name
          <input {...bind("name")} autoComplete="name" className={field} />
          {errorFor("name")}
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
          Email
          <input {...bind("email")} type="email" autoComplete="email" className={field} />
          {errorFor("email")}
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
        {topic === "job" ? "Company" : "Company (optional)"}
        <input {...bind("company")} autoComplete="organization" className={field} />
        {errorFor("company")}
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
        Message
        <textarea {...bind("message")} rows={6} placeholder={placeholders[topic]} className={`${field} h-auto resize-y py-3`} />
        {errorFor("message")}
      </label>

      {/* For bots only: hidden from people and screen readers, skipped by Tab */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary inline-flex h-14 items-center justify-center rounded-full bg-accent px-8 text-[15px] font-bold text-on-accent transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Sending…" : "Send message →"}
        </button>
        <p aria-live="polite" className={`text-sm ${failed ? "font-semibold text-accent" : "text-muted"}`}>
          {failed ? failed.message : "Goes straight to my inbox."}
        </p>
      </div>
    </form>
  );
}
