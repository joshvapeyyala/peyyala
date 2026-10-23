"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { deleteProject, saveProject } from "@/app/admin/(portal)/projects/actions";
import type { Project } from "@/content/types";
import type { ProjectInput } from "@/lib/schemas";
import { EditForm, LinesField, ListField, SelectField, TagField, TextAreaField, TextField, useEditor } from "./form";
import { statusOptions } from "./options";
import { Button, Section } from "./ui";

const blank: ProjectInput = {
  slug: "",
  name: "",
  category: "",
  summary: "",
  role: "Solo developer",
  url: "",
  urlLabel: "",
  status: "in-progress",
  stack: [],
  highlights: [],
  screenshotAlt: "",
  caseStudy: { metrics: [], problem: [], approach: [], architecture: [], outcome: [] },
};

function toInput(project: Project): ProjectInput {
  const story = project.caseStudy ?? {};
  return {
    slug: project.slug,
    name: project.name,
    category: project.category,
    summary: project.summary,
    role: project.role,
    url: project.url,
    urlLabel: project.urlLabel,
    status: project.status,
    stack: project.stack,
    highlights: project.highlights,
    screenshotAlt: project.screenshot?.alt ?? "",
    caseStudy: {
      metrics: (story.metrics ?? []).map(({ value, label }) => ({ value, label })),
      problem: story.problem ?? [],
      approach: story.approach ?? [],
      architecture: story.architecture ?? [],
      outcome: story.outcome ?? [],
    },
  };
}

// "My New Project!" -> "my-new-project"
const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type StoryKey = "problem" | "approach" | "architecture" | "outcome";

export function ProjectForm({ project }: { project?: Project }) {
  const isNew = !project;
  // The slug this project is saved under: the row to update, and where to
  // redirect once a new slug is saved
  const savedSlug = project?.slug ?? null;
  const editor = useEditor(project ? toInput(project) : blank, (input) => saveProject(savedSlug, input));
  const { value, update, errorAt, errorWithin } = editor;
  const story = value.caseStudy;
  const bind = (key: "name" | "slug" | "category" | "role" | "summary" | "url" | "urlLabel" | "screenshotAlt") => ({
    value: value[key],
    onChange: (text: string) => update({ [key]: text } as Partial<ProjectInput>),
    error: errorAt(key),
  });
  const bindStory = (key: StoryKey) => ({
    value: story[key],
    onChange: (paragraphs: string[]) => update({ caseStudy: { ...story, [key]: paragraphs } }),
    error: errorWithin(`caseStudy.${key}`),
  });

  return (
    <EditForm editor={editor} sections={["Basics", "Links", "Screenshot", "Stack & highlights", "Case study"]} saveLabel={isNew ? "Create project" : undefined}>
      <Section title="Basics" description="Shown on the home board, the Work page and the case study.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Name"
            {...bind("name")}
            onChange={(name) =>
              // A new project's slug follows its name until the slug is edited by hand
              update(isNew && value.slug === slugify(value.name) ? { name, slug: slugify(name) } : { name })
            }
          />
          <TextField label="Slug" {...bind("slug")} hint="The URL: /work/your-slug" />
          <TextField label="Category" {...bind("category")} placeholder="e.g. Clinic management SaaS" />
          <TextField label="Your role" {...bind("role")} />
        </div>
        <TextAreaField label="Summary" {...bind("summary")} rows={3} recommended={160} hint="One or two sentences. Also used as the link-preview description." />
        <SelectField
          label="Status"
          value={value.status}
          onChange={(status) => update({ status: status as ProjectInput["status"] })}
          error={errorAt("status")}
          options={statusOptions}
          hint="Drives the status badges and the “Live now” count."
        />
      </Section>

      <Section title="Links">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Live URL" type="url" {...bind("url")} placeholder="https://" />
          <TextField label="URL label" {...bind("urlLabel")} hint="How the link reads, e.g. caredeck.in" />
        </div>
      </Section>

      <Section title="Screenshot" description="The landing-page image used on cards, the case study and link previews.">
        {project?.screenshot ? (
          <>
            <div className="overflow-hidden rounded-lg border border-border">
              <Image src={project.screenshot.src} alt={value.screenshotAlt} width={project.screenshot.width} height={project.screenshot.height} sizes="(min-width: 1024px) 720px, 100vw" className="h-auto w-full" />
            </div>
            <TextField label="Alt text" {...bind("screenshotAlt")} recommended={125} hint="Describes the image for screen readers." />
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted">No screenshot yet.</div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-9 cursor-not-allowed items-center rounded-lg border border-border-strong px-3.5 text-sm font-medium opacity-50">
            Upload image
            <input type="file" accept="image/*" disabled className="sr-only" />
          </label>
          <p className="text-xs text-muted">Uploads arrive in the next step.</p>
        </div>
      </Section>

      <Section title="Stack & highlights">
        <TagField label="Stack" value={value.stack} onChange={(stack) => update({ stack })} error={errorWithin("stack")} />
        <ListField
          label="What I built"
          items={value.highlights}
          onChange={(highlights) => update({ highlights })}
          empty=""
          addLabel="Add highlight"
          render={(point, updatePoint, index) => <TextAreaField label="Highlight" value={point} onChange={updatePoint} error={errorAt(`highlights.${index}`)} rows={2} />}
        />
      </Section>

      <Section title="Case study" description="Optional long-form write-up. Each part only appears on the site once it has text. Separate paragraphs with a blank line.">
        <ListField
          label="Key numbers"
          items={story.metrics}
          onChange={(metrics) => update({ caseStudy: { ...story, metrics } })}
          empty={{ value: "", label: "" }}
          addLabel="Add number"
          render={(metric, updateMetric, index) => (
            <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <TextField label="Value" value={metric.value} onChange={(v) => updateMetric({ ...metric, value: v })} error={errorAt(`caseStudy.metrics.${index}.value`)} placeholder="e.g. 12" />
              <TextField label="Label" value={metric.label} onChange={(label) => updateMetric({ ...metric, label })} error={errorAt(`caseStudy.metrics.${index}.label`)} placeholder="e.g. Clinics using it" />
            </div>
          )}
        />
        <LinesField label="The problem" separator={"\n\n"} {...bindStory("problem")} rows={4} />
        <LinesField label="Approach" separator={"\n\n"} {...bindStory("approach")} rows={4} />
        <LinesField label="Architecture" separator={"\n\n"} {...bindStory("architecture")} rows={4} />
        <LinesField label="Outcome" separator={"\n\n"} {...bindStory("outcome")} rows={4} />
      </Section>

      {project && <DangerZone project={project} />}
    </EditForm>
  );
}

// Deleting asks first, in a dialog
function DangerZone({ project }: { project: Project }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      // Redirects to the project list once deleted
      const result = await deleteProject(project.slug);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <Section title="Danger zone" description={`Removes ${project.name} from the home board, the Work page and its case study.`}>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="danger" onClick={() => dialog.current?.showModal()}>
          Delete project
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="delete-title"
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-panel p-6 text-fg shadow-xl backdrop:bg-black/50"
      >
        <h2 id="delete-title" className="text-base font-semibold">
          Delete {project.name}?
        </h2>
        <p className="mt-2 text-sm text-muted">It disappears from the site straight away. This can&apos;t be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button autoFocus onClick={() => dialog.current?.close()} disabled={pending}>
            Keep it
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete project"}
          </Button>
        </div>
      </dialog>
    </Section>
  );
}
