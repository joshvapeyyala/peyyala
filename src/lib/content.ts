// Every page reads portfolio content through these functions. Today they
// return the typed data in src/content; when the admin portal arrives they
// become database queries and the pages stay unchanged.
import { education, experience, marqueeStack, profile, skills } from "@/content/profile";
import { projects } from "@/content/projects";
import { process, services } from "@/content/services";
import { theme } from "@/content/site";
import { resolvePalette } from "@/content/themes";

export async function getProfile() {
  return profile;
}

export async function getProjects() {
  return projects;
}

export async function getProject(slug: string) {
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getExperience() {
  return experience;
}

export async function getSkills() {
  return { groups: skills, marquee: marqueeStack };
}

export async function getEducation() {
  return education;
}

export async function getServices() {
  return { services, process };
}

export async function getTheme() {
  return { ...theme, colors: resolvePalette(theme) };
}
