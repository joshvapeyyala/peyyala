# Designs

The site has one set of markup and several **designs**, each with its own **palettes**. The admin picks one pair in `src/content/site.ts`; visitors can't change it.

- **Ink** is the base. Its look is written directly in the components with Tailwind classes, and it has no stylesheet here.
- Every other design is one stylesheet in this folder. It restyles Ink's markup through the hook classes below and never changes the components.
- Palettes are pure data in `src/content/themes.ts`. They become CSS variables scoped to `[data-design="…"][data-theme="…"]`.

Preview any pair locally without editing settings: `http://localhost:3000/?design=wave&palette=mint` (development only).

## Add a palette to an existing design

Add an entry to that design's `palettes` in `src/content/themes.ts`. TypeScript fails the build if it's missing a token the design needs. Nothing else to touch.

## Add a design

1. **Register it** in `src/content/themes.ts`: `const name = defineDesign<ExtraToken>()({ label, palettes })`, then add it to `designs`. `ExtraToken` lists any colour tokens your stylesheet needs beyond the base set (see Wave's `WaveToken`); use `defineDesign()` if there are none.
2. **Style it** in `src/app/designs/<name>.css`, with every rule scoped to `[data-design="<name>"]`. Keep it outside `@layer` so it overrides the components' Tailwind utilities, as `wave.css` does.
3. **Import it** in `src/app/globals.css`, next to `@import "./designs/wave.css";`.
4. **New fonts** go in `src/app/fonts.ts` with `preload: false`. Then use the CSS variable, for example `var(--font-sora)`.
5. **Check** it with the preview URL on every page, at desktop and phone width, before selecting it in `site.ts`.

## Colour tokens

Use these as `var(--name)` or Tailwind classes such as `bg-ink` and `text-accent`.

| Token | Role |
| --- | --- |
| `ink` | Page background |
| `ink-2` | Cards and raised surfaces |
| `paper` | Main text |
| `soft` | Secondary text |
| `muted` | Labels, captions |
| `line` | Dividers, borders |
| `edge` | Stronger borders, outlined buttons |
| `accent` | Brand colour: buttons, highlights |
| `on-accent` | Text on an accent background |
| `live` | "Live" status |
| `shadow` | Shadow colour |

## Hook classes

Ink's markup carries these class names so a design can target elements whose shape changes, not just their colour. Add a new hook to the components if a design needs one; hooks have no styling of their own.

| Hook | Element |
| --- | --- |
| `font-display` | Every big display heading (Anton in Ink) |
| `hero-title` | Home page headline |
| `mega-title` | Case-study project name, 404 headline |
| `stat-title` | Home page "2.5 yrs" figure |
| `statement` | Sentence-style page intros (Services, Contact) |
| `text-outline` | Hollow outlined words |
| `accent-tile` | Home headline accent word ("ship") |
| `hero-badge` | "JP" badge in the home headline |
| `label` | Small uppercase section labels and eyebrows |
| `site-header` | Header; has `data-scrolled` once the page scrolls |
| `brand` | Name link in the header |
| `nav-link` | Header navigation links (has `aria-current` when active) |
| `btn-primary`, `btn-ghost` | Filled and outlined buttons |
| `card` | Cards and boxed panels |
| `marquee`, `marquee-track`, `marquee-star` | Scrolling tech strip |
| `board-cta`, `board-peek` | Home board's "Your team" row and hover preview |
| `status-badge` | "Live" status labels |
