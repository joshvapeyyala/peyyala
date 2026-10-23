"use client";

import type { Service } from "@/content/types";
import { EditForm, ListField, TagField, TextAreaField, TextField } from "./form";
import { Section } from "./ui";

type Step = { step: string; title: string; text: string };

export function ServicesForm({ services, process }: { services: Service[]; process: Step[] }) {
  return (
    <EditForm sections={["Services", "How I work"]}>
      <Section title="Services" description="The cards at the top of the Services page.">
        <ListField
          label="Services offered"
          initial={services}
          empty={{ title: "", description: "", examples: [] }}
          addLabel="Add service"
          render={(service) => (
            <>
              <TextField label="Title" defaultValue={service.title} />
              <TextAreaField label="Description" defaultValue={service.description} rows={2} />
              <TagField label="Examples" initial={service.examples} />
            </>
          )}
        />
      </Section>

      <Section title="How I work" description="The numbered steps under the service cards. Numbers follow the order.">
        <ListField
          label="Steps"
          initial={process}
          empty={{ step: "", title: "", text: "" }}
          addLabel="Add step"
          render={(step) => (
            <>
              <TextField label="Title" defaultValue={step.title} />
              <TextAreaField label="Description" defaultValue={step.text} rows={2} />
            </>
          )}
        />
      </Section>
    </EditForm>
  );
}
