"use client";

import Image from "next/image";
import type { Project } from "@/content/types";
import { EditForm, ListField, SelectField, TagField, TextAreaField, TextField } from "./form";
import { statusOptions } from "./options";
import { Button, Section } from "./ui";

const blank: Project = {
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
};

// Case-study sections are stored as paragraph arrays; edited as blank-line-separated text
const joinParagraphs = (paragraphs?: string[]) => (paragraphs ?? []).join("\n\n");

export function ProjectForm({ project = blank }: { project?: Project }) {
  const story = project.caseStudy ?? {};

  return (
    <EditForm sections={["Basics", "Links", "Screenshot", "Stack & highlights", "Case study"]}>
      <Section title="Basics" description="Shown on the home board, the Work page and the case study.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Name" name="name" defaultValue={project.name} required />
          <TextField label="Slug" name="slug" defaultValue={project.slug} hint="The URL: /work/your-slug" pattern="[a-z0-9-]+" />
          <TextField label="Category" name="category" defaultValue={project.category} placeholder="e.g. Clinic management SaaS" />
          <TextField label="Your role" name="role" defaultValue={project.role} />
        </div>
        <TextAreaField label="Summary" name="summary" defaultValue={project.summary} rows={3} recommended={160} hint="One or two sentences. Also used as the link-preview description." />
        <SelectField label="Status" name="status" defaultValue={project.status} options={statusOptions} hint="Drives the status badges and the “Live now” count." />
      </Section>

      <Section title="Links">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Live URL" name="url" type="url" defaultValue={project.url} placeholder="https://" />
          <TextField label="URL label" name="urlLabel" defaultValue={project.urlLabel} hint="How the link reads, e.g. caredeck.in" />
        </div>
      </Section>

      <Section title="Screenshot" description="The landing-page image used on cards, the case study and link previews.">
        {project.screenshot ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <Image src={project.screenshot.src} alt={project.screenshot.alt} width={project.screenshot.width} height={project.screenshot.height} sizes="(min-width: 1024px) 720px, 100vw" className="h-auto w-full" />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted">No screenshot yet.</div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex h-9 cursor-not-allowed items-center rounded-lg border border-border-strong px-3.5 text-sm font-medium opacity-50">
            Upload image
            <input type="file" accept="image/*" disabled className="sr-only" />
          </label>
          <p className="text-xs text-muted">Uploads arrive with the backend.</p>
        </div>
        <TextField label="Alt text" name="screenshotAlt" defaultValue={project.screenshot?.alt} recommended={125} hint="Describes the image for screen readers." />
      </Section>

      <Section title="Stack & highlights">
        <TagField label="Stack" initial={project.stack} />
        <ListField
          label="What I built"
          initial={project.highlights}
          empty=""
          addLabel="Add highlight"
          render={(point) => <TextAreaField label="Highlight" defaultValue={point} rows={2} />}
        />
      </Section>

      <Section title="Case study" description="Optional long-form write-up. Each part only appears on the site once it has text. Separate paragraphs with a blank line.">
        <ListField
          label="Key numbers"
          initial={story.metrics ?? []}
          empty={{ label: "", value: "" }}
          addLabel="Add number"
          render={(metric) => (
            <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <TextField label="Value" defaultValue={metric.value} placeholder="e.g. 12" />
              <TextField label="Label" defaultValue={metric.label} placeholder="e.g. Clinics using it" />
            </div>
          )}
        />
        <TextAreaField label="The problem" defaultValue={joinParagraphs(story.problem)} rows={4} />
        <TextAreaField label="Approach" defaultValue={joinParagraphs(story.approach)} rows={4} />
        <TextAreaField label="Architecture" defaultValue={joinParagraphs(story.architecture)} rows={4} />
        <TextAreaField label="Outcome" defaultValue={joinParagraphs(story.outcome)} rows={4} />
      </Section>

      {project.slug && (
        <Section title="Danger zone" description={`Removes ${project.name} from the home board, the Work page and its case study.`}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="danger" disabled title="Deleting arrives with the backend">
              Delete project
            </Button>
            <p className="text-xs text-muted">Deleting arrives with the backend.</p>
          </div>
        </Section>
      )}
    </EditForm>
  );
}
