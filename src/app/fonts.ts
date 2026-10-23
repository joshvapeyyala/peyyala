import { Anton, Inter, Sora } from "next/font/google";

// Every font any design uses. next/font needs them declared statically, so a
// new design's font goes here; its stylesheet then uses the CSS variable.

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

// Fonts for designs other than Ink aren't preloaded, so Ink pages don't pay for them
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  preload: false,
});

export const fontVariables = [inter, anton, sora].map((font) => font.variable).join(" ");
