// Runs before each test file. The actions run for real against the test
// database; only what needs a live Next.js request, the Google session or an
// email service is replaced, recording into mock-state.ts.
import { mkdirSync, rmSync } from "node:fs";
import { sql } from "drizzle-orm";
import { afterAll, beforeEach, vi } from "vitest";
import { db, pool } from "@/server/db/client";
import { mocks, RedirectError, resetMocks } from "./mock-state";

vi.mock("next/cache", () => ({
  updateTag: (tag: string) => mocks.updatedTags.push(tag),
  refresh: () => mocks.refreshes++,
  cacheTag: () => {},
  cacheLife: () => {},
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
  unstable_rethrow: () => {},
}));

vi.mock("next/headers", () => ({ headers: async () => mocks.headers }));

vi.mock("next/server", () => ({
  after: (task: () => unknown) => mocks.afterTasks.push(task),
  connection: async () => {},
}));

// The session check, without Google: signed in unless a test says otherwise
vi.mock("@/server/auth", () => ({
  requireAdmin: async () => {
    if (!mocks.signedIn) throw new RedirectError("/admin/login");
    return { name: "Test Admin", email: "admin@example.com" };
  },
  getAdmin: async () => (mocks.signedIn ? { name: "Test Admin", email: "admin@example.com" } : null),
}));

vi.mock("@/server/mail", () => ({
  sendMail: async (mail: (typeof mocks.mails)[number]) => {
    if (mocks.mailFails) throw new Error("Mail service is down");
    mocks.mails.push(mail);
  },
}));

beforeEach(async () => {
  resetMocks();
  // Uploads from earlier tests
  rmSync(process.env.STORAGE_DIR!, { recursive: true, force: true });
  mkdirSync(process.env.STORAGE_DIR!);
  await db.execute(
    sql`truncate projects, profile, jobs, roles, skill_groups, education, services, process_steps, site_settings, messages restart identity cascade`,
  );
});

afterAll(() => pool.end());
