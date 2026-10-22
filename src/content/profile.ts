import type { Education, Job, Profile, SkillGroup } from "./types";

export const profile: Profile = {
  name: "Joshva Peyyala",
  firstName: "Joshva",
  lastName: "Peyyala",
  title: "Software Engineer",
  tagline: "Backend-focused full-stack developer",
  summary:
    "Backend-focused full-stack developer with 2.5 years of experience building and shipping production REST APIs and web applications using Node.js, Express and Next.js. I independently designed, built and deployed three live products, CareDeck, Xpensefy and Lineage, end to end, from database schema to production deployment. Currently expanding into AI/RAG-based development.",
  location: "Amalapuram, India (open to remote)",
  email: "joshvapeyyala@gmail.com",
  linkedin: "https://www.linkedin.com/in/joshva-peyyala",
  github: "https://github.com/joshvapeyyala",
  resumePdf: "/Joshva_Peyyala_Resume.pdf",
  openToWork: true,
  openToWorkLabel: "Open to full-time roles",
  yearsOfExperience: "2.5",
  learning: ["AI/RAG systems", "LLM integration"],
};

export const experience: Job[] = [
  {
    company: "Tilli Software",
    location: "Hyderabad, India (on-site)",
    roles: [
      {
        title: "Software Engineer – Backend",
        start: "Sep 2024",
        end: "Jun 2026",
        points: [
          "Designed and built REST APIs and server-side services for enterprise web applications using Node.js and Express.js, following consistent API design and standardized response conventions.",
          "Owned MySQL database schema design, query optimization and migrations using Sequelize ORM for production applications.",
          "Built and integrated backend services powering both internal admin portals and customer-facing applications, including authentication, authorization and request validation layers.",
          "Contributed to frontend features using JavaScript (ES6+), React.js and Next.js alongside backend work.",
        ],
      },
      {
        title: "Software Engineer Intern – Backend",
        start: "Jan 2024",
        end: "Aug 2024",
        points: [
          "Built features for enterprise web applications using Node.js, Express.js and MySQL (via Sequelize ORM), assisting with REST API development and schema design under senior engineer guidance.",
        ],
      },
    ],
  },
];

export const skills: SkillGroup[] = [
  { label: "Languages", items: ["JavaScript (ES6+)", "TypeScript"] },
  {
    label: "Backend",
    items: [
      "Node.js",
      "Express.js",
      "REST API design",
      "OAuth 2.0 / OpenID Connect",
      "JWT",
      "Zod",
      "Request validation",
      "Sequelize ORM",
      "Prisma ORM",
    ],
  },
  { label: "Frontend", items: ["React.js", "Next.js", "Tailwind CSS"] },
  {
    label: "Databases",
    items: ["PostgreSQL (Neon)", "MySQL", "Redis (Upstash)"],
  },
  {
    label: "Cloud & DevOps",
    items: [
      "AWS (EC2, S3, CloudFront, IAM)",
      "Vercel (Git-based CI/CD)",
      "Docker",
      "Git",
      "GitHub",
    ],
  },
  { label: "Tools", items: ["Postman", "Swagger / OpenAPI"] },
];

export const marqueeStack = [
  "Node.js",
  "Express",
  "Next.js",
  "TypeScript",
  "Prisma",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "AWS",
  "Docker",
];

export const education: Education[] = [
  {
    degree: "Master's Degree & Bachelor's Degree",
    school: "Adikavi Nannaya University, India",
  },
];
