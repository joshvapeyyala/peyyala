import type { ThemeSetting } from "./themes";

// The site's look, chosen by the admin. Visitors can't change it.
//   Ink design:  ink (default), volt, cobalt, bloom, plum, chalk
//   Wave design: wave, wavenight, ember, mint, graphite
// See src/content/themes.ts for what each one looks like.
export const theme: ThemeSetting = { design: "ink", palette: "ink" };
