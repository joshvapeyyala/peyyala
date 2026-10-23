"use client";

import type { Education, Job, Profile, SkillGroup } from "@/content/types";
import { EditForm, ListField, TagField, TextAreaField, TextField, Toggle } from "./form";
import { Section } from "./ui";

type Props = {
  profile: Profile;
  experience: Job[];
  skills: SkillGroup[];
  marquee: string[];
  education: Education[];
};

export function ProfileForm({ profile, experience, skills, marquee, education }: Props) {
  return (
    <EditForm sections={["About you", "Availability", "Contact & links", "Experience", "Skills", "Education"]}>
      <Section title="About you" description="Your name and headline appear in the header, the home page and the resume.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="First name" defaultValue={profile.firstName} />
          <TextField label="Last name" defaultValue={profile.lastName} />
          <TextField label="Job title" defaultValue={profile.title} />
          <TextField label="Tagline" defaultValue={profile.tagline} recommended={60} />
          <TextField label="Location" defaultValue={profile.location} />
          <TextField label="Years of experience" defaultValue={profile.yearsOfExperience} hint="Shown as the big “2.5 yrs” figure." />
        </div>
        <TextAreaField label="Summary" defaultValue={profile.summary} rows={5} recommended={450} hint="The resume's opening paragraph." />
      </Section>

      <Section title="Availability">
        <Toggle label="Open to work" defaultChecked={profile.openToWork} hint="Shows the green availability badge on Home and Contact." />
        <TextField label="Availability label" defaultValue={profile.openToWorkLabel} />
      </Section>

      <Section title="Contact & links">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Email" type="email" defaultValue={profile.email} />
          <TextField label="LinkedIn URL" type="url" defaultValue={profile.linkedin} />
          <TextField label="GitHub URL" type="url" defaultValue={profile.github} />
          <TextField label="Resume PDF" defaultValue={profile.resumePdf} hint="File in /public, e.g. /Joshva_Peyyala_Resume.pdf" />
        </div>
      </Section>

      <Section title="Experience" description="Each company holds one or more roles, newest first.">
        {experience.map((job) => (
          <div key={job.company} className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Company" defaultValue={job.company} />
              <TextField label="Company location" defaultValue={job.location} />
            </div>
            <ListField
              label="Roles"
              initial={job.roles}
              empty={{ title: "", start: "", end: "", points: [] }}
              addLabel="Add role"
              render={(role) => (
                <>
                  <TextField label="Title" defaultValue={role.title} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Start" defaultValue={role.start} placeholder="e.g. Sep 2024" />
                    <TextField label="End" defaultValue={role.end} placeholder="e.g. Present" />
                  </div>
                  <TextAreaField label="Bullet points" defaultValue={role.points.join("\n")} rows={4} hint="One per line." />
                </>
              )}
            />
          </div>
        ))}
      </Section>

      <Section title="Skills" description="Grouped skills for the resume, plus the scrolling tech strip on the home page.">
        <ListField
          label="Skill groups"
          initial={skills}
          empty={{ label: "", items: [] }}
          addLabel="Add group"
          render={(group) => (
            <>
              <TextField label="Group name" defaultValue={group.label} />
              <TagField label="Skills" initial={group.items} />
            </>
          )}
        />
        <TagField label="Currently learning" initial={profile.learning} />
        <TagField label="Home page tech strip" initial={marquee} />
      </Section>

      <Section title="Education">
        <ListField
          label="Degrees"
          initial={education}
          empty={{ degree: "", school: "" }}
          addLabel="Add degree"
          render={(item) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Degree" defaultValue={item.degree} />
              <TextField label="School" defaultValue={item.school} />
            </div>
          )}
        />
      </Section>
    </EditForm>
  );
}
