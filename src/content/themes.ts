// Site designs and their colour palettes: the single source of truth.
//
// A design is the layout and typography. Ink is the base styling written in
// the components; other designs restyle the same markup with a stylesheet in
// src/app/(site)/designs/. A palette only swaps colours; its tokens become CSS
// variables (--ink, --accent, ...) scoped to [data-design][data-theme], so
// palette names only need to be unique within their design.
//
// Add a palette: add an entry to a design's `palettes` below. Nothing else.
// Add a design: see src/app/(site)/designs/README.md.

// Every palette sets these. "ink" is the page background and "paper" the main
// text, whichever is light or dark.
type BaseToken =
  | "ink"
  | "ink-2"
  | "paper"
  | "muted"
  | "soft"
  | "line"
  | "edge"
  | "accent"
  | "on-accent"
  | "live"
  | "shadow";

type PaletteDef<Extra extends string> = {
  label: string;
  scheme: "light" | "dark";
  tokens: Record<BaseToken | Extra, string>;
};

// `Extra` lists the tokens a design's stylesheet needs on top of the base set,
// so TypeScript flags any palette of that design that forgets one.
function defineDesign<Extra extends string = never>() {
  return <P extends Record<string, PaletteDef<Extra>>>(design: {
    label: string;
    description: string;
    // How the admin's Appearance screen draws a miniature of this design
    preview: { displayFont: string; uppercase: boolean };
    palettes: P;
  }) => design;
}

const ink = defineDesign()({
  label: "Ink",
  description: "Departure-board look: condensed Anton capitals, hollow lettering, pill buttons.",
  preview: { displayFont: "var(--font-anton)", uppercase: true },
  palettes: {
    ink: {
      label: "Ink",
      scheme: "dark",
      tokens: { ink: "#0a0a0a", "ink-2": "#141414", paper: "#f5f5f4", muted: "#a8a29e", soft: "#d6d3d1", line: "#292524", edge: "#57534e", accent: "#ff5533", "on-accent": "#0a0a0a", live: "#4ade80", shadow: "rgba(0, 0, 0, 0.7)" },
    },
    volt: {
      label: "Volt",
      scheme: "dark",
      tokens: { ink: "#0b0d0a", "ink-2": "#141711", paper: "#f2f5ee", muted: "#a1a995", soft: "#d3d9cc", line: "#262b20", edge: "#4e5743", accent: "#c6f432", "on-accent": "#0b0d0a", live: "#5eead4", shadow: "rgba(0, 0, 0, 0.7)" },
    },
    cobalt: {
      label: "Cobalt",
      scheme: "dark",
      tokens: { ink: "#08090d", "ink-2": "#11131a", paper: "#f2f4f8", muted: "#9aa3b5", soft: "#cfd5e0", line: "#232838", edge: "#4a5268", accent: "#5b8cff", "on-accent": "#08090d", live: "#4ade80", shadow: "rgba(0, 0, 0, 0.7)" },
    },
    bloom: {
      label: "Bloom",
      scheme: "dark",
      tokens: { ink: "#0c0a0b", "ink-2": "#171214", paper: "#f7f2f4", muted: "#ab9aa1", soft: "#ddd0d5", line: "#2b2226", edge: "#5a4a51", accent: "#ff4f9a", "on-accent": "#0c0a0b", live: "#4ade80", shadow: "rgba(0, 0, 0, 0.7)" },
    },
    plum: {
      label: "Plum",
      scheme: "dark",
      tokens: { ink: "#140f1c", "ink-2": "#1d1628", paper: "#f4effa", muted: "#a99cbd", soft: "#d8cfe6", line: "#2f2640", edge: "#574a6e", accent: "#ffb36b", "on-accent": "#140f1c", live: "#6ee7b7", shadow: "rgba(0, 0, 0, 0.7)" },
    },
    chalk: {
      label: "Chalk",
      scheme: "light",
      tokens: { ink: "#fbfbfa", "ink-2": "#f1f1ef", paper: "#0e0e10", muted: "#66666e", soft: "#3a3a40", line: "#e4e4e2", edge: "#a1a1a8", accent: "#2648ff", "on-accent": "#ffffff", live: "#15803d", shadow: "rgba(20, 20, 40, 0.15)" },
    },
  },
});

// Wave's extras: the slanted band, the floating tile behind accent words, the
// tech strip, the button glow, the live chip and card shadows.
type WaveToken = "band" | "band-opacity" | "tile" | "tile-fg" | "strip-bg" | "strip-fg" | "glow" | "live-chip" | "card-shadow";

const darkWaveShadows = { shadow: "rgba(0, 0, 0, 0.55)", "card-shadow": "0 24px 60px rgba(0, 0, 0, 0.45)" };

const wave = defineDesign<WaveToken>()({
  label: "Wave",
  description: "Stripe-style SaaS polish: Sora headlines, a slanted gradient wave, floating tiles.",
  preview: { displayFont: "var(--font-sora)", uppercase: false },
  palettes: {
    wave: {
      label: "Wave",
      scheme: "light",
      tokens: {
        ink: "#f7f8fc", "ink-2": "#ffffff", paper: "#0a2540", muted: "#5b6b84", soft: "#3c4f6b", line: "#e3e8f0", edge: "#c9d2e0", accent: "#5a51f5", "on-accent": "#ffffff", live: "#0a7a4a", shadow: "rgba(10, 37, 64, 0.16)",
        band: "linear-gradient(100deg, #ff80b5 0%, #ffb86b 28%, #a78bff 58%, #4fd1ff 100%)", "band-opacity": "0.9",
        tile: "#ffffff", "tile-fg": "#0a2540", "strip-bg": "#0a2540", "strip-fg": "#ffffff", glow: "rgba(90, 81, 245, 0.3)", "live-chip": "#e3f5ec",
        "card-shadow": "0 24px 50px rgba(10, 37, 64, 0.1), 0 6px 14px rgba(10, 37, 64, 0.05)",
      },
    },
    wavenight: {
      label: "Wave Night",
      scheme: "dark",
      tokens: {
        ink: "#0a1628", "ink-2": "#11203a", paper: "#f2f6ff", muted: "#8ea0bf", soft: "#c6d2e8", line: "#1e3050", edge: "#2e4568", accent: "#8b84ff", "on-accent": "#0a1628", live: "#5ee0a0",
        band: "linear-gradient(100deg, #e0457b 0%, #f08a3e 28%, #7b5cff 58%, #1aa3e0 100%)", "band-opacity": "0.55",
        tile: "#ffffff", "tile-fg": "#0a1628", "strip-bg": "#f2f6ff", "strip-fg": "#0a1628", glow: "rgba(139, 132, 255, 0.45)", "live-chip": "rgba(94, 224, 160, 0.12)",
        ...darkWaveShadows,
      },
    },
    ember: {
      label: "Ember",
      scheme: "dark",
      tokens: {
        ink: "#120a08", "ink-2": "#1d1210", paper: "#fff4ee", muted: "#b39a8f", soft: "#e8d2c8", line: "#2e1d18", edge: "#4a3028", accent: "#ff7a45", "on-accent": "#120a08", live: "#6ee7a8",
        band: "linear-gradient(100deg, #ff3d6e 0%, #ff7a45 50%, #ffb347 100%)", "band-opacity": "0.5",
        tile: "#fff4ee", "tile-fg": "#120a08", "strip-bg": "#fff4ee", "strip-fg": "#120a08", glow: "rgba(255, 122, 69, 0.45)", "live-chip": "rgba(110, 231, 168, 0.12)",
        ...darkWaveShadows,
      },
    },
    mint: {
      label: "Mint",
      scheme: "dark",
      tokens: {
        ink: "#07110e", "ink-2": "#0d1c17", paper: "#effdf7", muted: "#8fb3a4", soft: "#c4e3d6", line: "#15302a", edge: "#24493f", accent: "#3ef0a6", "on-accent": "#07110e", live: "#9ae6ff",
        band: "linear-gradient(100deg, #3ef0a6 0%, #22d3ee 50%, #6366f1 100%)", "band-opacity": "0.45",
        tile: "#effdf7", "tile-fg": "#07110e", "strip-bg": "#effdf7", "strip-fg": "#07110e", glow: "rgba(62, 240, 166, 0.4)", "live-chip": "rgba(154, 230, 255, 0.12)",
        ...darkWaveShadows,
      },
    },
    graphite: {
      label: "Graphite",
      scheme: "dark",
      tokens: {
        ink: "#0b0b0d", "ink-2": "#151518", paper: "#f5f5f7", muted: "#96969f", soft: "#cfcfd6", line: "#232327", edge: "#3a3a40", accent: "#a5a1ff", "on-accent": "#0b0b0d", live: "#6ee7a8",
        band: "linear-gradient(100deg, #2a2a30 0%, #5a5a66 50%, #a5a1ff 100%)", "band-opacity": "0.5",
        tile: "#f5f5f7", "tile-fg": "#0b0b0d", "strip-bg": "#f5f5f7", "strip-fg": "#0b0b0d", glow: "rgba(165, 161, 255, 0.4)", "live-chip": "rgba(110, 231, 168, 0.12)",
        ...darkWaveShadows,
      },
    },
  },
});

// Register designs here
export const designs = { ink, wave };

export type Design = keyof typeof designs;
export type PaletteName<D extends Design> = keyof (typeof designs)[D]["palettes"];

// Only valid pairs type-check, e.g. { design: "wave", palette: "volt" } is an error
export type ThemeSetting = { [D in Design]: { design: D; palette: PaletteName<D> } }[Design];

// The stored setting is plain text, so it's checked against the designs in code
export function isThemeSetting(value: { design: string; palette: string }): value is ThemeSetting {
  return Object.hasOwn(designs, value.design) && Object.hasOwn(designs[value.design as Design].palettes, value.palette);
}

type AnyPalette = PaletteDef<string>;

function paletteOf(design: string, palette: string): AnyPalette {
  const palettes: Record<string, AnyPalette> = designs[design as Design].palettes;
  return palettes[palette];
}

// The few colours needed outside CSS: browser theme colour, icons, link previews
export function resolvePalette(setting: ThemeSetting) {
  const { label, scheme, tokens } = paletteOf(setting.design, setting.palette);
  return {
    label,
    scheme,
    bg: tokens.ink,
    card: tokens["ink-2"],
    fg: tokens.paper,
    muted: tokens.muted,
    line: tokens.line,
    accent: tokens.accent,
    onAccent: tokens["on-accent"],
  };
}

// Every palette as CSS variables, scoped to its design. Rendered into the page
// head by the root layout, so the dev preview can switch between all of them.
export function paletteCss() {
  return Object.entries(designs)
    .flatMap(([design, { palettes }]) =>
      Object.entries(palettes as Record<string, AnyPalette>).map(([name, { scheme, tokens }]) => {
        const vars = Object.entries(tokens).map(([token, value]) => `--${token}:${value}`);
        return `[data-design="${design}"][data-theme="${name}"]{color-scheme:${scheme};${vars.join(";")}}`;
      }),
    )
    .join("\n");
}

// Design -> palette names, for the dev preview's validity check
export function themeIndex() {
  return Object.fromEntries(Object.entries(designs).map(([design, { palettes }]) => [design, Object.keys(palettes)]));
}
