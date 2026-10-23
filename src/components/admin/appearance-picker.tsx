"use client";

import { saveTheme } from "@/app/admin/(portal)/appearance/actions";
import { SaveBar, useEditor } from "./form";
import { ThemePreview } from "./theme-preview";
import { Badge, buttonBase, buttonStyles } from "./ui";

export type DesignOption = {
  id: string;
  label: string;
  description: string;
  displayFont: string;
  uppercase: boolean;
  palettes: { id: string; label: string; scheme: "light" | "dark"; tokens: Record<string, string> }[];
};

type Props = {
  designs: DesignOption[];
  current: { design: string; palette: string };
};

export function AppearancePicker({ designs, current }: Props) {
  const editor = useEditor(current, saveTheme);
  const selected = editor.value;
  const pick = designs.find((d) => d.id === selected.design)?.palettes.find((p) => p.id === selected.palette);

  // Arrow keys move the selection within a design's palettes, as radios do
  function onArrow(event: React.KeyboardEvent<HTMLDivElement>, design: DesignOption) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const from = selected.design === design.id ? design.palettes.findIndex((p) => p.id === selected.palette) : 0;
    const next = (from + step + design.palettes.length) % design.palettes.length;
    editor.set({ design: design.id, palette: design.palettes[next].id });
    (event.currentTarget.children[next] as HTMLElement).focus();
  }

  return (
    <div className="flex flex-col gap-10 pb-32 sm:pb-24">
      {designs.map((design) => (
        <section key={design.id}>
          <div className="mb-4">
            <h2 className="text-base font-semibold">{design.label} design</h2>
            <p className="mt-1 text-sm text-muted">{design.description}</p>
          </div>
          <div role="radiogroup" aria-label={`${design.label} palettes`} onKeyDown={(event) => onArrow(event, design)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {design.palettes.map((palette, index) => {
              const isSelected = selected.design === design.id && selected.palette === palette.id;
              const isLive = current.design === design.id && current.palette === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  // One tab stop per group: the selected palette, else the first
                  tabIndex={isSelected || (selected.design !== design.id && index === 0) ? 0 : -1}
                  onClick={() => editor.set({ design: design.id, palette: palette.id })}
                  className={`overflow-hidden rounded-xl border bg-panel text-left transition ${
                    isSelected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-border-strong"
                  }`}
                >
                  <ThemePreview tokens={palette.tokens} displayFont={design.displayFont} uppercase={design.uppercase} />
                  <span className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-3 w-3 rounded-full border border-border" style={{ background: palette.tokens.accent }} />
                      {palette.label}
                    </span>
                    <span className="flex gap-1.5">
                      {isLive && <Badge tone="success">Live</Badge>}
                      <Badge>{palette.scheme}</Badge>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <SaveBar
        editor={editor}
        saveLabel="Make it live"
        message={
          pick && (
            <p>
              <span className="font-medium">{pick.label}</span>
              <span className="text-muted"> selected. Visitors see it as soon as you make it live.</span>
            </p>
          )
        }
        actions={
          process.env.NODE_ENV === "development" && (
            <a href={`/?design=${selected.design}&palette=${selected.palette}`} target="_blank" rel="noreferrer" className={`${buttonBase} ${buttonStyles.ghost}`}>
              Preview site ↗
            </a>
          )
        }
      />
    </div>
  );
}
