// What each admin screen sends to its server action, and the rules it must
// pass before anything is saved. The actions validate with these schemas; the
// forms only import the types.
//
// A schema's output has the same shape as its input, just cleaned up (text
// trimmed, empty lines and duplicate tags dropped). The action sends it back,
// so after saving the form shows exactly what was stored.
import { z } from "zod";
import { isThemeSetting } from "@/content/themes";
import type { ProjectStatus } from "@/content/types";
import { messageTopics } from "@/lib/message-topics";

// ---- Building blocks ----

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const required = (max: number, message = "This can't be empty.") => text(max).min(1, message);
const webUrl = z
  .string()
  .trim()
  .pipe(z.url({ protocol: /^https?$/, hostname: z.regexes.domain, error: "Enter a full address, starting with https://" }));
// Chips (stack, skills, examples): blanks and repeats dropped
const tags = z
  .array(text(60))
  .max(60, "That's a lot of tags. Keep it under 60.")
  .transform((list) => [...new Set(list.filter(Boolean))]);
// Lines or paragraphs the form splits text into: blank ones dropped
const paragraphs = z
  .array(text(3000))
  .max(40)
  .transform((list) => list.filter(Boolean));

// ---- Profile & resume ----
// The resume PDF isn't part of this: it changes only by uploading a new file.

export const profileSchema = z.object({
  firstName: required(40),
  lastName: required(40),
  title: required(80),
  tagline: required(120),
  summary: required(1500),
  location: required(80),
  yearsOfExperience: required(20),
  openToWork: z.boolean(),
  openToWorkLabel: required(80),
  email: z.string().trim().pipe(z.email("Enter a valid email address.")),
  linkedin: webUrl,
  github: webUrl,
  learning: tags,
  techStrip: tags,
  experience: z
    .array(
      z.object({
        company: required(80),
        location: required(80),
        roles: z
          .array(z.object({ title: required(80), start: required(20), end: required(20), points: paragraphs }))
          .min(1, "Add at least one role, or remove the company."),
      }),
    )
    .max(20),
  skills: z.array(z.object({ label: required(60), items: tags })).max(20),
  education: z.array(z.object({ degree: required(120), school: required(120) })).max(10),
});

export type ProfileInput = z.output<typeof profileSchema>;

// ---- Services ----

export const servicesSchema = z.object({
  services: z.array(z.object({ title: required(80), description: required(500), examples: tags })).max(12),
  process: z.array(z.object({ title: required(80), text: required(500) })).max(12),
});

export type ServicesInput = z.output<typeof servicesSchema>;

// ---- Appearance ----

export const themeSchema = z
  .object({ design: z.string(), palette: z.string() })
  // `: boolean` keeps the output a plain { design, palette } for the form
  .refine((setting): boolean => isThemeSetting(setting), "That design or palette doesn't exist any more. Reload the page.");

export type ThemeInput = z.output<typeof themeSchema>;

// ---- Projects ----

export const projectStatuses = ["live", "in-progress", "archived"] as const satisfies readonly ProjectStatus[];

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .max(60, "Keep this under 60 characters.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens, like my-project.")
    // /admin/projects/new is the create screen
    .refine((slug) => slug !== "new", "“new” is reserved. Pick another slug."),
  name: required(60),
  category: required(80),
  summary: required(300),
  role: required(80),
  url: webUrl,
  urlLabel: required(80),
  status: z.enum(projectStatuses),
  stack: tags,
  highlights: paragraphs,
  // The image itself is uploaded separately; only its description is edited here
  screenshotAlt: text(200),
  caseStudy: z.object({
    metrics: z.array(z.object({ value: required(20), label: required(80) })).max(8),
    problem: paragraphs,
    approach: paragraphs,
    architecture: paragraphs,
    outcome: paragraphs,
  }),
});

export type ProjectInput = z.output<typeof projectSchema>;

// ---- Contact form (public) ----

export const contactSchema = z
  .object({
    topic: z.enum(messageTopics, "Pick what you're reaching out about."),
    name: required(100, "Please tell me your name."),
    email: z.string().trim().pipe(z.email("That email address doesn't look right.")),
    company: text(120),
    message: required(5000, "Please write a message.").min(10, "A little more detail, please."),
  })
  // A job enquiry without a company is hard to act on
  .refine((value) => value.topic !== "job" || value.company, { path: ["company"], message: "Which company is hiring?" });

export type ContactInput = z.output<typeof contactSchema>;

// ---- Uploads ----

// Screenshots and the resume PDF. next.config's serverActions.bodySizeLimit leaves room above this.
export const maxUploadBytes = 5 * 1024 * 1024;

// ---- Results ----

// Error messages keyed by the field's path in the input, e.g. "experience.0.roles.1.title"
export type FieldErrors = Record<string, string>;

export type SaveResult<T = undefined> = { ok: true; value?: T } | { ok: false; message: string; errors: FieldErrors };

export function failed(message: string, errors: FieldErrors = {}): SaveResult<never> {
  return { ok: false, message, errors };
}

// The first problem with each field, for the form to show beside it
export function fieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) errors[issue.path.join(".")] ??= issue.message;
  return errors;
}

export function invalid(error: z.ZodError): SaveResult<never> {
  const errors = fieldErrors(error);
  const count = Object.keys(errors).length;
  return failed(`Couldn't save: ${count === 1 ? "1 field needs" : `${count} fields need`} attention.`, errors);
}
