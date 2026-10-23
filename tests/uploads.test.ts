import { existsSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { uploadResume } from "@/app/admin/(portal)/profile/actions";
import { deleteProject, removeScreenshot, uploadScreenshot } from "@/app/admin/(portal)/projects/actions";
import { db } from "@/server/db/client";
import * as t from "@/server/db/schema";
import { checkImage, checkPdf } from "@/server/uploads";
import { formWithFile, pdf, png, textFile } from "./files";
import { seedBasics } from "./fixtures";
import { mocks, RedirectError } from "./mock-state";

// Where an /uploads/... URL's file lives in the test storage folder
const stored = (url: string) => path.join(process.env.STORAGE_DIR!, url.replace("/uploads/", ""));
const screenshotOf = async (slug: string) => (await db.select().from(t.projects).where(eq(t.projects.slug, slug)))[0].screenshot;

describe("file checks", () => {
  it("reads an image's real size", async () => {
    expect(await checkImage(png(1200, 750))).toMatchObject({ ok: true, file: { width: 1200, height: 750, extension: "png" } });
  });

  it.each([
    ["a text file named .png", textFile("fake.png"), /isn't an image/],
    ["a tiny image", png(120, 80), /too small/],
    ["nothing at all", null, /Choose a file/],
  ])("refuses %s", async (_case, file, message) => {
    expect(await checkImage(file)).toEqual({ ok: false, message: expect.stringMatching(message) });
  });

  it("only accepts real PDFs", async () => {
    expect((await checkPdf(pdf())).ok).toBe(true);
    expect(await checkPdf(textFile("resume.pdf"))).toMatchObject({ ok: false });
  });
});

describe("screenshots", () => {
  it("stores an upload with its size and a default alt text", async () => {
    await seedBasics();
    const result = await uploadScreenshot("alpha", formWithFile(png(1000, 600)));
    expect(result).toMatchObject({ ok: true, value: { width: 1000, height: 600, alt: "The Project alpha website" } });

    const shot = await screenshotOf("alpha");
    expect(shot?.src).toMatch(/^\/uploads\/screenshots\/[0-9a-f]{16}\/alpha\.png$/);
    expect(existsSync(stored(shot!.src))).toBe(true);
    expect(mocks.updatedTags).toEqual(["projects"]);
  });

  it("deletes the old file when replaced, removed, or when the project is deleted", async () => {
    await seedBasics();
    await uploadScreenshot("alpha", formWithFile(png(1000, 600)));
    const first = (await screenshotOf("alpha"))!.src;

    await uploadScreenshot("alpha", formWithFile(png(900, 900)));
    const second = (await screenshotOf("alpha"))!.src;
    expect(existsSync(stored(first))).toBe(false);
    expect(existsSync(stored(second))).toBe(true);

    await removeScreenshot("alpha");
    expect(await screenshotOf("alpha")).toBeNull();
    expect(existsSync(stored(second))).toBe(false);

    await uploadScreenshot("beta", formWithFile(png(800, 500)));
    const third = (await screenshotOf("beta"))!.src;
    await expect(deleteProject("beta")).rejects.toThrow(RedirectError);
    expect(existsSync(stored(third))).toBe(false);
  });

  it("leaves screenshots that ship in /public alone", async () => {
    await seedBasics();
    const shipped = path.join(process.cwd(), "public/work/lineage.png");
    expect(existsSync(shipped)).toBe(true);
    await db.update(t.projects).set({ screenshot: { src: "/work/lineage.png", width: 10, height: 10, alt: "x" } }).where(eq(t.projects.slug, "alpha"));
    await removeScreenshot("alpha");
    expect(await screenshotOf("alpha")).toBeNull();
    expect(existsSync(shipped)).toBe(true);
  });
});

describe("resume", () => {
  it("stores the PDF under a clean name and points the profile at it", async () => {
    await seedBasics();
    const result = await uploadResume(formWithFile(pdf("Ada Lovelace — CV (2026).pdf")));
    expect(result.ok && result.value).toMatch(/^\/uploads\/resume\/[0-9a-f]{16}\/Ada-Lovelace-CV-2026\.pdf$/);
    const [profile] = await db.select().from(t.profile);
    expect(profile.resumePdf).toBe(result.ok && result.value);
    expect(mocks.updatedTags).toEqual(["profile"]);
  });
});
