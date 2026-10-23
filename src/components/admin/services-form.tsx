"use client";

import { saveServices } from "@/app/admin/(portal)/services/actions";
import type { Service } from "@/content/types";
import type { ServicesInput } from "@/lib/schemas";
import { EditForm, ListField, TagField, TextAreaField, TextField, useEditor } from "./form";
import { Section } from "./ui";

type Step = { step: string; title: string; text: string };

export function ServicesForm({ services, process }: { services: Service[]; process: Step[] }) {
  // Step numbers follow the order, so they aren't edited or saved
  const editor = useEditor<ServicesInput>({ services, process: process.map(({ title, text }) => ({ title, text })) }, saveServices);
  const { value, update, errorAt, errorWithin } = editor;

  return (
    <EditForm editor={editor} sections={["Services", "How I work"]}>
      <Section title="Services" description="The cards at the top of the Services page.">
        <ListField
          label="Services offered"
          items={value.services}
          onChange={(services) => update({ services })}
          empty={{ title: "", description: "", examples: [] }}
          addLabel="Add service"
          render={(service, updateService, index) => (
            <>
              <TextField label="Title" value={service.title} onChange={(title) => updateService({ ...service, title })} error={errorAt(`services.${index}.title`)} />
              <TextAreaField
                label="Description"
                value={service.description}
                onChange={(description) => updateService({ ...service, description })}
                error={errorAt(`services.${index}.description`)}
                rows={2}
              />
              <TagField label="Examples" value={service.examples} onChange={(examples) => updateService({ ...service, examples })} error={errorWithin(`services.${index}.examples`)} />
            </>
          )}
        />
      </Section>

      <Section title="How I work" description="The numbered steps under the service cards. Numbers follow the order.">
        <ListField
          label="Steps"
          items={value.process}
          onChange={(process) => update({ process })}
          empty={{ title: "", text: "" }}
          addLabel="Add step"
          render={(step, updateStep, index) => (
            <>
              <TextField label="Title" value={step.title} onChange={(title) => updateStep({ ...step, title })} error={errorAt(`process.${index}.title`)} />
              <TextAreaField label="Description" value={step.text} onChange={(text) => updateStep({ ...step, text })} error={errorAt(`process.${index}.text`)} rows={2} />
            </>
          )}
        />
      </Section>
    </EditForm>
  );
}
