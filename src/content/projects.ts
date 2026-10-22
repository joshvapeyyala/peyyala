import type { Project } from "./types";

export const projects: Project[] = [
  {
    slug: "caredeck",
    name: "CareDeck",
    category: "Clinic management SaaS",
    summary:
      "A full clinic-management platform for homeopathy, dental and general-medicine practitioners: appointments, patient records and billing.",
    role: "Solo developer",
    url: "https://caredeck.in",
    urlLabel: "caredeck.in",
    status: "live",
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
      "Prisma ORM",
      "AWS (EC2, S3)",
      "Docker",
    ],
    highlights: [
      "Independently designed and built a full clinic-management platform covering appointments, patient records and billing workflows.",
      "Designed the PostgreSQL data model and API layer using Prisma ORM, and built the full frontend in Next.js with TypeScript and Tailwind CSS.",
      "Deployed and manage the production environment on AWS (EC2, S3) using Docker containers. The product is live and in active use by clinics.",
    ],
  },
  {
    slug: "xpensefy",
    name: "Xpensefy",
    category: "Expense & budget tracker",
    summary:
      "A mobile-first expense tracker with category budgets, monthly pacing insights and auto-categorization by merchant name.",
    role: "Solo developer",
    url: "https://xpensefy.vercel.app",
    urlLabel: "xpensefy.vercel.app",
    status: "live",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Prisma ORM"],
    highlights: [
      "Built a mobile-first expense tracker with category-based budgets, monthly pacing insights and auto-categorization of expenses by merchant name.",
      "Implemented CSV export, a searchable year-long spending history and two fully themeable UI skins with persisted user preference.",
    ],
  },
  {
    slug: "lineage",
    name: "Lineage",
    category: "Private family tree platform",
    summary:
      "An invite-only family tree that models multi-generation relationships and works out how any two people are related.",
    role: "Solo developer",
    url: "https://lineage-silk.vercel.app",
    urlLabel: "lineage-silk.vercel.app",
    status: "live",
    stack: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "PostgreSQL",
      "Prisma ORM",
      "Google OAuth",
    ],
    highlights: [
      "Designed a relational PostgreSQL schema modeling multi-generation family relationships (marriages, half-siblings, in-memory members), with logic to auto-link spouses and children and compute the relationship between any two people in the tree.",
      "Built invite-only access via Google OAuth (no passwords), with per-family data export and a Next.js/TypeScript frontend for navigating the tree.",
    ],
  },
];
