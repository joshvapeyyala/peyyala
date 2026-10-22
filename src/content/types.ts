export type Profile = {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  tagline: string;
  summary: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  resumePdf: string;
  openToWork: boolean;
  openToWorkLabel: string;
  yearsOfExperience: string;
  learning: string[];
};

export type ProjectStatus = "live" | "in-progress" | "archived";

export type Project = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  role: string;
  url: string;
  urlLabel: string;
  status: ProjectStatus;
  stack: string[];
  highlights: string[];
};

export type Role = {
  title: string;
  start: string;
  end: string;
  points: string[];
};

export type Job = {
  company: string;
  location: string;
  roles: Role[];
};

export type SkillGroup = {
  label: string;
  items: string[];
};

export type Education = {
  degree: string;
  school: string;
};

export type Service = {
  title: string;
  description: string;
  examples: string[];
};
