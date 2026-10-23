import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { deleteProject, reorderProjects, saveProject } from "@/app/admin/(portal)/projects/actions";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { projectInput, projectSlugsInOrder, seedBasics } from "./fixtures";
import { mocks, RedirectError } from "./mock-state";

const project = async (slug: string) => (await db.select().from(t.projects).where(eq(t.projects.slug, slug)))[0];

describe("saveProject", () => {
  it("creates a project at the end of the list and opens its edit page", async () => {
    await seedBasics();
    await expect(saveProject(null, projectInput("delta"))).rejects.toThrow(new RedirectError("/admin/projects/delta"));
    expect(await projectSlugsInOrder()).toEqual(["alpha", "beta", "gamma", "delta"]);
    expect(mocks.updatedTags).toEqual(["projects"]);
  });

  it("rejects invalid input with an error per field and saves nothing", async () => {
    await seedBasics();
    const result = await saveProject(null, projectInput("Not A Slug", { name: "  ", url: "ftp://example.com" }));
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["name", "slug", "url"]);
    expect(await projectSlugsInOrder()).toEqual(["alpha", "beta", "gamma"]);
    expect(mocks.updatedTags).toEqual([]);
  });

  it('reserves "new", which is the create screen', async () => {
    const result = await saveProject(null, projectInput("new"));
    expect(!result.ok && result.errors.slug).toMatch(/reserved/);
  });

  it("refuses a slug another project already has", async () => {
    await seedBasics();
    const result = await saveProject("alpha", projectInput("beta"));
    expect(!result.ok && result.errors.slug).toMatch(/already uses/);
    expect(await project("alpha")).toBeDefined();
  });

  it("updates in place, cleans up the input and returns what was stored", async () => {
    await seedBasics();
    const result = await saveProject("alpha", projectInput("alpha", { name: "  Alpha Two ", stack: ["Go", " Go ", ""], highlights: ["", "Shipped it"] }));
    expect(result).toMatchObject({ ok: true, value: { name: "Alpha Two", stack: ["Go"], highlights: ["Shipped it"] } });
    expect(await project("alpha")).toMatchObject({ name: "Alpha Two", stack: ["Go"], position: 0 });
  });

  it("moves to the new URL when the slug changes", async () => {
    await seedBasics();
    await expect(saveProject("alpha", projectInput("alpha-two"))).rejects.toThrow(new RedirectError("/admin/projects/alpha-two"));
    expect(await projectSlugsInOrder()).toEqual(["alpha-two", "beta", "gamma"]);
  });

  it("stores only the case-study parts that have text, and null when none do", async () => {
    await seedBasics();
    await saveProject("alpha", projectInput("alpha", { caseStudy: { metrics: [{ value: "12", label: "Clinics" }], problem: ["Paper records."], approach: [], architecture: [""], outcome: [] } }));
    expect((await project("alpha")).caseStudy).toEqual({ metrics: [{ value: "12", label: "Clinics" }], problem: ["Paper records."] });

    await saveProject("alpha", projectInput("alpha"));
    expect((await project("alpha")).caseStudy).toBeNull();
  });

  it("keeps the screenshot's file and size from the database, editing only its alt text", async () => {
    await seedBasics();
    const shot = { src: "/work/alpha.png", width: 1200, height: 750, alt: "Old alt" };
    await db.update(t.projects).set({ screenshot: shot }).where(eq(t.projects.slug, "alpha"));

    await saveProject("alpha", projectInput("alpha", { screenshotAlt: "New alt" }));
    expect((await project("alpha")).screenshot).toEqual({ ...shot, alt: "New alt" });

    const result = await saveProject("alpha", projectInput("alpha", { screenshotAlt: "" }));
    expect(!result.ok && result.errors.screenshotAlt).toBeTruthy();
  });

  it("says so when the project was deleted elsewhere", async () => {
    const result = await saveProject("ghost", projectInput("ghost"));
    expect(!result.ok && result.message).toMatch(/no longer exists/);
  });
});

describe("reorderProjects", () => {
  it("saves the new order", async () => {
    await seedBasics();
    expect(await reorderProjects(["gamma", "alpha", "beta"])).toEqual({ ok: true });
    expect(await projectSlugsInOrder()).toEqual(["gamma", "alpha", "beta"]);
    expect(mocks.updatedTags).toEqual(["projects"]);
  });

  it.each([
    ["one missing", ["gamma", "alpha"]],
    ["one repeated", ["gamma", "alpha", "alpha"]],
    ["one unknown", ["gamma", "alpha", "beta", "delta"]],
  ])("rejects a list with %s and keeps the old order", async (_case, order) => {
    await seedBasics();
    const result = await reorderProjects(order);
    expect(result.ok).toBe(false);
    expect(await projectSlugsInOrder()).toEqual(["alpha", "beta", "gamma"]);
  });
});

describe("deleteProject", () => {
  it("deletes it and returns to the project list", async () => {
    await seedBasics();
    await expect(deleteProject("beta")).rejects.toThrow(new RedirectError("/admin/projects"));
    expect(await projectSlugsInOrder()).toEqual(["alpha", "gamma"]);
    expect(mocks.updatedTags).toEqual(["projects"]);
  });

  it("reports a project that's already gone", async () => {
    await seedBasics();
    expect(await deleteProject("ghost")).toMatchObject({ ok: false });
  });
});
