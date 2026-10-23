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

// Paths are relative to /public; width and height are the file's pixel size
export type Screenshot = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

// Long-form case study. Every field is optional: a section only renders once it has text.
export type CaseStudy = {
  metrics?: { label: string; value: string }[];
  problem?: string[];
  approach?: string[];
  architecture?: string[];
  outcome?: string[];
};

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
  screenshot?: Screenshot;
  caseStudy?: CaseStudy;
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
