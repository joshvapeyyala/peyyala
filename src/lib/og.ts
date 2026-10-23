// Shared pieces for the generated icons and link-preview images (next/og).
// next/og can't read next/font's woff2 files, so Anton ships as a TTF.
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTheme } from "@/lib/content";

// Colours follow the admin's chosen palette (Appearance, stored in site_settings)
export async function themeColors() {
  return (await getTheme()).colors;
}

// Read synchronously when the module loads. A pending async read is uncached
// I/O, and if it hadn't finished when an icon was prerendered, the build
// randomly made that icon dynamic.
const antonData = readFileSync(join(process.cwd(), "src/assets/fonts/Anton-Regular.ttf"));
// Wave's Sora, from @fontsource (next/og reads .woff but not .woff2)
const soraData = readFileSync(join(process.cwd(), "node_modules/@fontsource/sora/files/sora-latin-700-normal.woff"));

// The live design's display type, matching the site: Ink sets condensed Anton
// capitals, Wave sets Sora Bold in sentence case, tightly tracked. Sora is far
// wider, so `scale` shrinks font sizes chosen for Anton.
export async function displayType() {
  const { design } = await getTheme();
  if (design === "wave") {
    return {
      fonts: [{ name: "Sora", data: soraData, style: "normal" as const, weight: 700 as const }],
      uppercase: false,
      scale: 0.75,
      // Two letters ("JP") only need a little less room
      iconScale: 0.8,
      style: (fontSize: number) => ({ fontFamily: "Sora", fontWeight: 700, fontSize, letterSpacing: -0.045 * fontSize }),
    };
  }
  return {
    fonts: [{ name: "Anton", data: antonData, style: "normal" as const, weight: 400 as const }],
    uppercase: true,
    scale: 1,
    iconScale: 1,
    style: (fontSize: number) => ({ fontFamily: "Anton", fontSize }),
  };
}

// Display text in the live design's case
export function displayCase(text: string, type: { uppercase: boolean }) {
  return type.uppercase ? text.toUpperCase() : text;
}

// Reads an image from /public as a data URL for <img> inside ImageResponse
export async function publicImage(src: string) {
  const data = await readFile(join(process.cwd(), "public", src), "base64");
  return `data:image/png;base64,${data}`;
}
