"use client";

import { useState, type FormEvent } from "react";

const topics = [
  { id: "job", label: "A job role" },
  { id: "project", label: "A freelance project" },
  { id: "other", label: "Something else" },
] as const;

type TopicId = (typeof topics)[number]["id"];

const field =
  "h-13 w-full rounded-2xl border border-line bg-ink-2 px-4 text-base text-paper placeholder:text-muted transition focus:border-accent focus:outline-none";

// No backend yet: the form composes an email in the visitor's mail app.
export function ContactForm({ email }: { email: string }) {
  const [topic, setTopic] = useState<TopicId>("job");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const company = String(data.get("company") ?? "");
    const message = String(data.get("message") ?? "");
    const label = topics.find((item) => item.id === topic)?.label ?? "";
    const subject = `[peyyala.com] ${label} — ${name}`;
    const body = `${message}\n\n— ${name}${company ? `, ${company}` : ""}\n${String(data.get("email") ?? "")}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-sm font-semibold text-soft">I&apos;m reaching out about</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.map((item) => (
            <label
              key={item.id}
              className={`inline-flex h-11 cursor-pointer items-center rounded-full border px-5 text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                topic === item.id
                  ? "border-accent bg-accent text-on-accent"
                  : "border-line text-soft hover:border-paper hover:text-paper"
              }`}
            >
              <input
                type="radio"
                name="topic"
                value={item.id}
                checked={topic === item.id}
                onChange={() => setTopic(item.id)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
          Name
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
          Email
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
        {topic === "job" ? "Company" : "Company (optional)"}
        <input name="company" required={topic === "job"} autoComplete="organization" className={field} />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
        Message
        <textarea
          name="message"
          required
          rows={6}
          placeholder={
            topic === "job"
              ? "The role, the team, and a link to the job post."
              : topic === "project"
                ? "What you want built, rough timeline and budget."
                : "What's on your mind?"
          }
          className={`${field} h-auto resize-y py-3`}
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          className="btn-primary inline-flex h-14 items-center justify-center rounded-full bg-accent px-8 text-[15px] font-bold text-on-accent transition hover:brightness-110"
        >
          Send message →
        </button>
        <p className="text-sm text-muted">Opens your email app with everything filled in.</p>
      </div>
    </form>
  );
}
