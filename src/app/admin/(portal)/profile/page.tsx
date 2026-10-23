import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/admin/profile-form";
import { getEducation, getExperience, getProfile, getSkills } from "@/lib/content";

export const metadata: Metadata = { title: "Profile & resume" };

export default async function ProfilePage() {
  const [profile, experience, skills, education] = await Promise.all([getProfile(), getExperience(), getSkills(), getEducation()]);

  return (
    <>
      <PageHeader title="Profile & resume" description="Who you are, where you've worked and what you know. The resume page is built from this." />
      <ProfileForm profile={profile} experience={experience} skills={skills.groups} marquee={skills.marquee} education={education} />
    </>
  );
}
