// Every admin action is reachable by anyone who can send a POST request, so
// each one must check the session itself before touching anything.
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as appearanceActions from "@/app/admin/(portal)/appearance/actions";
import * as inboxActions from "@/app/admin/(portal)/inbox/actions";
import * as profileActions from "@/app/admin/(portal)/profile/actions";
import * as projectActions from "@/app/admin/(portal)/projects/actions";
import * as servicesActions from "@/app/admin/(portal)/services/actions";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { getMessages, getUnreadCount } from "@/server/inbox";
import { formWithFile, pdf, png } from "./files";
import { profileInput, projectInput, seedBasics, servicesInput } from "./fixtures";
import { mocks, RedirectError } from "./mock-state";

// One call per admin action, with input that would succeed if signed in
const calls: Record<string, () => Promise<unknown>> = {
  saveProfile: () => profileActions.saveProfile(profileInput),
  uploadResume: () => profileActions.uploadResume(formWithFile(pdf())),
  saveServices: () => servicesActions.saveServices(servicesInput),
  saveTheme: () => appearanceActions.saveTheme({ design: "ink", palette: "volt" }),
  saveProject: () => projectActions.saveProject("alpha", projectInput("alpha", { name: "Changed" })),
  reorderProjects: () => projectActions.reorderProjects(["gamma", "beta", "alpha"]),
  deleteProject: () => projectActions.deleteProject("alpha"),
  uploadScreenshot: () => projectActions.uploadScreenshot("alpha", formWithFile(png(800, 500))),
  removeScreenshot: () => projectActions.removeScreenshot("alpha"),
  setRead: () => inboxActions.setRead(1, true),
  markAllRead: () => inboxActions.markAllRead(),
  deleteMessage: () => inboxActions.deleteMessage(1),
  // Not actions, but they read private messages
  getMessages: () => getMessages(),
  getUnreadCount: () => getUnreadCount(),
};

// Every row of every table, to compare before and after
async function everything() {
  const tables = { projects: t.projects, profile: t.profile, jobs: t.jobs, roles: t.roles, services: t.services, siteSettings: t.siteSettings, messages: t.messages };
  return Object.fromEntries(await Promise.all(Object.entries(tables).map(async ([name, table]) => [name, await db.select().from(table)])));
}

describe("signed out", () => {
  it.each(Object.keys(calls))("%s sends the visitor to the login page and changes nothing", async (name) => {
    await seedBasics();
    await db.insert(t.messages).values({ topic: "job", name: "Sam", email: "sam@example.com", message: "Hello, is the role open?" });
    const before = await everything();

    mocks.signedIn = false;
    await expect(calls[name]()).rejects.toThrow(new RedirectError("/admin/login"));

    expect(await everything()).toEqual(before);
    expect(mocks.updatedTags).toEqual([]);
    expect(readdirSync(process.env.STORAGE_DIR!)).toEqual([]);
  });

  it("covers every exported admin action", () => {
    const exported = [appearanceActions, inboxActions, profileActions, projectActions, servicesActions].flatMap((module) => Object.keys(module));
    expect(exported.filter((name) => !(name in calls))).toEqual([]);
  });
});
