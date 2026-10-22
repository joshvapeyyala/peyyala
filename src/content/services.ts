import type { Service } from "./types";

export const services: Service[] = [
  {
    title: "Web apps & SaaS",
    description:
      "Dashboards, booking and management tools, internal portals. Built end to end and deployed.",
    examples: ["Clinic or shop management", "Admin portals", "Customer dashboards"],
  },
  {
    title: "Backend & APIs",
    description:
      "REST APIs, database design, authentication and integrations that stay fast and easy to change.",
    examples: ["API design & docs", "Postgres / MySQL schemas", "Google sign-in, JWT"],
  },
  {
    title: "MVPs for founders",
    description:
      "Turn an idea into a working first version you can put in front of real users.",
    examples: ["Scope to launch", "Hosting on Vercel or AWS", "Handover & support"],
  },
];

export const process = [
  { step: "01", title: "Call", text: "We talk through the problem and what success looks like." },
  { step: "02", title: "Plan", text: "A written scope, timeline and fixed quote." },
  { step: "03", title: "Build", text: "Weekly demos on a live preview link." },
  { step: "04", title: "Launch", text: "Deploy, hand over, and support after go-live." },
];
