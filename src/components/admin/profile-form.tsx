"use client";

import { saveProfile } from "@/app/admin/(portal)/profile/actions";
import type { Education, Job, Profile, SkillGroup } from "@/content/types";
import type { ProfileInput } from "@/lib/schemas";
import { EditForm, LinesField, ListField, TagField, TextAreaField, TextField, Toggle, useEditor } from "./form";
import { Section } from "./ui";

type Props = {
  profile: Profile;
  experience: Job[];
  skills: SkillGroup[];
  marquee: string[];
  education: Education[];
};

export function ProfileForm({ profile, experience, skills, marquee, education }: Props) {
  const editor = useEditor<ProfileInput>(
    {
      firstName: profile.firstName,
      lastName: profile.lastName,
      title: profile.title,
      tagline: profile.tagline,
      summary: profile.summary,
      location: profile.location,
      yearsOfExperience: profile.yearsOfExperience,
      openToWork: profile.openToWork,
      openToWorkLabel: profile.openToWorkLabel,
      email: profile.email,
      linkedin: profile.linkedin,
      github: profile.github,
      resumePdf: profile.resumePdf,
      learning: profile.learning,
      techStrip: marquee,
      experience,
      skills,
      education,
    },
    saveProfile,
  );
  const { value, update, errorAt, errorWithin } = editor;
  // Props for a plain text field bound to one profile value
  const bind = (key: "firstName" | "lastName" | "title" | "tagline" | "summary" | "location" | "yearsOfExperience" | "openToWorkLabel" | "email" | "linkedin" | "github" | "resumePdf") => ({
    value: value[key],
    onChange: (text: string) => update({ [key]: text } as Partial<ProfileInput>),
    error: errorAt(key),
  });

  return (
    <EditForm editor={editor} sections={["About you", "Availability", "Contact & links", "Experience", "Skills", "Education"]}>
      <Section title="About you" description="Your name and headline appear in the header, the home page and the resume.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="First name" {...bind("firstName")} />
          <TextField label="Last name" {...bind("lastName")} />
          <TextField label="Job title" {...bind("title")} />
          <TextField label="Tagline" {...bind("tagline")} recommended={60} />
          <TextField label="Location" {...bind("location")} />
          <TextField label="Years of experience" {...bind("yearsOfExperience")} hint="Shown as the big “2.5 yrs” figure." />
        </div>
        <TextAreaField label="Summary" {...bind("summary")} rows={5} recommended={450} hint="The resume's opening paragraph." />
      </Section>

      <Section title="Availability">
        <Toggle label="Open to work" checked={value.openToWork} onChange={(openToWork) => update({ openToWork })} hint="Shows the green availability badge on Home and Contact." />
        <TextField label="Availability label" {...bind("openToWorkLabel")} />
      </Section>

      <Section title="Contact & links">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Email" type="email" {...bind("email")} />
          <TextField label="LinkedIn URL" type="url" {...bind("linkedin")} />
          <TextField label="GitHub URL" type="url" {...bind("github")} />
          <TextField label="Resume PDF" {...bind("resumePdf")} hint="File in /public, e.g. /Joshva_Peyyala_Resume.pdf" />
        </div>
      </Section>

      <Section title="Experience" description="Each company holds one or more roles, newest first.">
        <ListField
          label="Companies"
          items={value.experience}
          onChange={(experience) => update({ experience })}
          empty={{ company: "", location: "", roles: [{ title: "", start: "", end: "", points: [] }] }}
          addLabel="Add company"
          render={(job, updateJob, jobIndex) => {
            const path = `experience.${jobIndex}`;
            return (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField label="Company" value={job.company} onChange={(company) => updateJob({ ...job, company })} error={errorAt(`${path}.company`)} />
                  <TextField label="Company location" value={job.location} onChange={(location) => updateJob({ ...job, location })} error={errorAt(`${path}.location`)} />
                </div>
                <ListField
                  label="Roles"
                  items={job.roles}
                  onChange={(roles) => updateJob({ ...job, roles })}
                  empty={{ title: "", start: "", end: "", points: [] }}
                  addLabel="Add role"
                  error={errorAt(`${path}.roles`)}
                  render={(role, updateRole, roleIndex) => {
                    const rolePath = `${path}.roles.${roleIndex}`;
                    return (
                      <>
                        <TextField label="Title" value={role.title} onChange={(title) => updateRole({ ...role, title })} error={errorAt(`${rolePath}.title`)} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField label="Start" value={role.start} onChange={(start) => updateRole({ ...role, start })} error={errorAt(`${rolePath}.start`)} placeholder="e.g. Sep 2024" />
                          <TextField label="End" value={role.end} onChange={(end) => updateRole({ ...role, end })} error={errorAt(`${rolePath}.end`)} placeholder="e.g. Present" />
                        </div>
                        <LinesField
                          label="Bullet points"
                          separator={"\n"}
                          value={role.points}
                          onChange={(points) => updateRole({ ...role, points })}
                          error={errorWithin(`${rolePath}.points`)}
                          rows={4}
                          hint="One per line."
                        />
                      </>
                    );
                  }}
                />
              </>
            );
          }}
        />
      </Section>

      <Section title="Skills" description="Grouped skills for the resume, plus the scrolling tech strip on the home page.">
        <ListField
          label="Skill groups"
          items={value.skills}
          onChange={(skills) => update({ skills })}
          empty={{ label: "", items: [] }}
          addLabel="Add group"
          render={(group, updateGroup, index) => (
            <>
              <TextField label="Group name" value={group.label} onChange={(label) => updateGroup({ ...group, label })} error={errorAt(`skills.${index}.label`)} />
              <TagField label="Skills" value={group.items} onChange={(items) => updateGroup({ ...group, items })} error={errorWithin(`skills.${index}.items`)} />
            </>
          )}
        />
        <TagField label="Currently learning" value={value.learning} onChange={(learning) => update({ learning })} error={errorWithin("learning")} />
        <TagField label="Home page tech strip" value={value.techStrip} onChange={(techStrip) => update({ techStrip })} error={errorWithin("techStrip")} />
      </Section>

      <Section title="Education">
        <ListField
          label="Degrees"
          items={value.education}
          onChange={(education) => update({ education })}
          empty={{ degree: "", school: "" }}
          addLabel="Add degree"
          render={(item, updateItem, index) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Degree" value={item.degree} onChange={(degree) => updateItem({ ...item, degree })} error={errorAt(`education.${index}.degree`)} />
              <TextField label="School" value={item.school} onChange={(school) => updateItem({ ...item, school })} error={errorAt(`education.${index}.school`)} />
            </div>
          )}
        />
      </Section>
    </EditForm>
  );
}
