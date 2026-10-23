// Shared pieces for the generated icons and link-preview images (next/og).
// next/og can't read next/font's woff2 files, so Anton ships as a TTF.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const colors = {
  ink: "#0a0a0a",
  ink2: "#141414",
  paper: "#f5f5f4",
  muted: "#a8a29e",
  line: "#292524",
  accent: "#ff5533",
};

const antonData = readFile(join(process.cwd(), "src/assets/fonts/Anton-Regular.ttf"));

export async function antonFont() {
  return [{ name: "Anton", data: await antonData, style: "normal" as const, weight: 400 as const }];
}

// Reads an image from /public as a data URL for <img> inside ImageResponse
export async function publicImage(src: string) {
  const data = await readFile(join(process.cwd(), "public", src), "base64");
  return `data:image/png;base64,${data}`;
}
