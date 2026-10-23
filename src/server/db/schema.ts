// The database tables, described in TypeScript. Drizzle reads this file to
// generate SQL migrations (pnpm db:generate) and to type every query.
//
// Column names are written in camelCase here; `casing: "snake_case"` in the
// client and drizzle.config.ts stores them as snake_case in Postgres
// (urlLabel -> url_label).
import { sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { CaseStudy, Screenshot } from "@/content/types";

// Shared columns. `position` orders lists the way the admin arranged them.
const id = () => integer().primaryKey().generatedAlwaysAsIdentity();
const position = () => integer().notNull();
const textList = () => text().array().notNull().default(sql`'{}'::text[]`);
const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---- Projects ----

export const projectStatus = pgEnum("project_status", ["live", "in-progress", "archived"]);

export const projects = pgTable("projects", {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  category: text().notNull(),
  summary: text().notNull(),
  role: text().notNull(),
  url: text().notNull(),
  urlLabel: text().notNull(),
  status: projectStatus().notNull(),
  stack: textList(),
  highlights: textList(),
  // Small nested objects that are always read and written whole, so jsonb
  // rather than their own tables. $type gives them their TypeScript shape.
  screenshot: jsonb().$type<Screenshot>(),
  caseStudy: jsonb().$type<CaseStudy>(),
  position: position(),
  ...timestamps,
});

// ---- Profile & resume ----

// Single-row tables: the check constraint stops a second row from existing
const singleRow = (name: string) => (table: { id: unknown }) => [check(`${name}_single_row`, sql`${table.id} = 1`)];

export const profile = pgTable(
  "profile",
  {
    id: integer().primaryKey().default(1),
    firstName: text().notNull(),
    lastName: text().notNull(),
    title: text().notNull(),
    tagline: text().notNull(),
    summary: text().notNull(),
    location: text().notNull(),
    email: text().notNull(),
    linkedin: text().notNull(),
    github: text().notNull(),
    resumePdf: text().notNull(),
    openToWork: boolean().notNull(),
    openToWorkLabel: text().notNull(),
    yearsOfExperience: text().notNull(),
    learning: textList(),
    // The scrolling tech strip on the home page
    techStrip: textList(),
    updatedAt: timestamps.updatedAt,
  },
  singleRow("profile"),
);

export const jobs = pgTable("jobs", {
  id: id(),
  company: text().notNull(),
  location: text().notNull(),
  position: position(),
});

export const roles = pgTable("roles", {
  id: id(),
  // Deleting a company deletes its roles
  jobId: integer()
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  title: text().notNull(),
  start: text().notNull(),
  end: text().notNull(),
  points: textList(),
  position: position(),
});

export const skillGroups = pgTable("skill_groups", {
  id: id(),
  label: text().notNull(),
  items: textList(),
  position: position(),
});

export const education = pgTable("education", {
  id: id(),
  degree: text().notNull(),
  school: text().notNull(),
  position: position(),
});

// ---- Services ----

export const services = pgTable("services", {
  id: id(),
  title: text().notNull(),
  description: text().notNull(),
  examples: textList(),
  position: position(),
});

// "How I work". The step numbers (01, 02...) come from the order, not stored.
export const processSteps = pgTable("process_steps", {
  id: id(),
  title: text().notNull(),
  text: text().notNull(),
  position: position(),
});

// ---- Site settings ----

// The live design and palette. Checked against src/content/themes.ts when
// saved, since the list of designs lives in code.
export const siteSettings = pgTable(
  "site_settings",
  {
    id: integer().primaryKey().default(1),
    design: text().notNull(),
    palette: text().notNull(),
    updatedAt: timestamps.updatedAt,
  },
  singleRow("site_settings"),
);

// ---- Contact messages (the admin Inbox) ----

export const messageTopic = pgEnum("message_topic", ["job", "project", "other"]);

export const messages = pgTable("messages", {
  id: id(),
  topic: messageTopic().notNull(),
  name: text().notNull(),
  email: text().notNull(),
  company: text(),
  message: text().notNull(),
  createdAt: timestamps.createdAt,
  // Null until opened in the Inbox
  readAt: timestamp({ withTimezone: true }),
});
