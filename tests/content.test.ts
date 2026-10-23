// Profile, Services and Appearance: each saves a whole screen in one transaction
import { asc } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { saveTheme } from "@/app/admin/(portal)/appearance/actions";
import { saveProfile } from "@/app/admin/(portal)/profile/actions";
import { saveServices } from "@/app/admin/(portal)/services/actions";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { profileInput, seedBasics, servicesInput } from "./fixtures";
import { mocks } from "./mock-state";

async function experience() {
  const jobs = await db.select().from(t.jobs).orderBy(asc(t.jobs.position));
  const roles = await db.select().from(t.roles).orderBy(asc(t.roles.position));
  return jobs.map((job) => ({ company: job.company, roles: roles.filter((role) => role.jobId === job.id).map((role) => role.title) }));
}

describe("saveProfile", () => {
  it("saves the profile and replaces the lists, in the order given", async () => {
    await seedBasics();
    const input = {
      ...profileInput,
      title: "Staff Engineer",
      experience: [
        { company: "Newer Co", location: "Remote", roles: [{ title: "Lead", start: "2024", end: "Present", points: [" Led a team ", "", "Hired"] }] },
        { company: "Older Co", location: "Pune", roles: [{ title: "Senior", start: "2022", end: "2024", points: [] }, { title: "Junior", start: "2020", end: "2022", points: [] }] },
      ],
    };
    const result = await saveProfile(input);

    expect(result).toMatchObject({ ok: true, value: { title: "Staff Engineer" } });
    // Blank lines dropped and text trimmed, in the database and in what the form gets back
    expect(result.ok && result.value?.experience[0].roles[0].points).toEqual(["Led a team", "Hired"]);
    expect(await experience()).toEqual([
      { company: "Newer Co", roles: ["Lead"] },
      { company: "Older Co", roles: ["Senior", "Junior"] },
    ]);
    expect((await db.select().from(t.profile))[0].title).toBe("Staff Engineer");
    expect(mocks.updatedTags.sort()).toEqual(["education", "experience", "profile", "skills"]);
  });

  it("saves nothing when any part is invalid, even the valid parts", async () => {
    await seedBasics();
    await saveProfile(profileInput);
    const before = await experience();

    const result = await saveProfile({
      ...profileInput,
      title: "Changed Title",
      experience: [...profileInput.experience, { company: "", location: "Remote", roles: [] }],
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors).toMatchObject({ "experience.1.company": expect.any(String), "experience.1.roles": expect.any(String) });
    expect((await db.select().from(t.profile))[0].title).toBe("Software Engineer");
    expect(await experience()).toEqual(before);
  });

  it("never changes the resume, which only an upload replaces", async () => {
    await seedBasics();
    await saveProfile({ ...profileInput, resumePdf: "/somewhere-else.pdf" } as typeof profileInput);
    expect((await db.select().from(t.profile))[0].resumePdf).toBe("/resume.pdf");
  });
});

describe("saveServices", () => {
  it("replaces services and steps in the order given", async () => {
    const reversed = { services: [...servicesInput.services].reverse(), process: [...servicesInput.process].reverse() };
    expect(await saveServices(reversed)).toMatchObject({ ok: true });

    const services = await db.select().from(t.services).orderBy(asc(t.services.position));
    const steps = await db.select().from(t.processSteps).orderBy(asc(t.processSteps.position));
    expect(services.map((service) => service.title)).toEqual(["Web apps", "Backend & APIs"]);
    expect(steps.map((step) => step.title)).toEqual(["Build", "Call"]);
    expect(mocks.updatedTags).toEqual(["services"]);
  });

  it("rejects a service without a title and keeps the old list", async () => {
    await saveServices(servicesInput);
    const result = await saveServices({ ...servicesInput, services: [{ title: "", description: "Something", examples: [] }] });
    expect(!result.ok && result.errors["services.0.title"]).toBeTruthy();
    expect(await db.$count(t.services)).toBe(2);
  });
});

describe("saveTheme", () => {
  it("switches the live theme", async () => {
    await seedBasics();
    expect(await saveTheme({ design: "ink", palette: "volt" })).toEqual({ ok: true });
    expect((await db.select().from(t.siteSettings))[0]).toMatchObject({ design: "ink", palette: "volt" });
    expect(mocks.updatedTags).toEqual(["theme"]);
  });

  it("refuses a palette that isn't in themes.ts", async () => {
    await seedBasics();
    expect(await saveTheme({ design: "ink", palette: "neon" })).toMatchObject({ ok: false });
    expect((await db.select().from(t.siteSettings))[0].palette).toBe("ink");
  });
});
