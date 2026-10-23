// A miniature of the public site's hero in one design + palette, drawn from
// the palette's own tokens so it always matches src/content/themes.ts.

type Props = {
  tokens: Record<string, string>;
  displayFont: string;
  uppercase: boolean;
};

export function ThemePreview({ tokens, displayFont, uppercase }: Props) {
  const hasWave = "band" in tokens;
  const display = { fontFamily: displayFont, textTransform: uppercase ? "uppercase" : "none", letterSpacing: uppercase ? "0" : "-0.04em" } as const;

  return (
    <div
      aria-hidden="true"
      className="relative aspect-[16/10] overflow-hidden"
      style={{ background: tokens.ink, color: tokens.paper }}
    >
      {hasWave && (
        <div
          className="absolute inset-x-0 -top-[45%] h-[90%] origin-left -skew-y-[11deg]"
          style={{ background: tokens.band, opacity: Number(tokens["band-opacity"] ?? 1) }}
        />
      )}
      <div className="relative flex h-full flex-col p-[6%]">
        <div className="flex items-center justify-between text-[0.5rem] font-semibold">
          <span style={{ textTransform: uppercase ? "uppercase" : "none", letterSpacing: uppercase ? "0.12em" : "0" }}>Joshva Peyyala</span>
          <span className="rounded-full px-2 py-0.5" style={{ background: tokens.accent, color: tokens["on-accent"] }}>
            Contact
          </span>
        </div>
        <p className="mt-[8%] text-[1.35rem] leading-[0.95] font-bold" style={display}>
          I build
          <br />
          backends that{" "}
          {hasWave ? (
            <span className="rounded-[0.18em] px-[0.1em]" style={{ background: tokens.tile, color: tokens["tile-fg"] }}>
              ship
            </span>
          ) : (
            <span style={{ color: tokens.accent }}>ship</span>
          )}
        </p>
        <div className="mt-auto flex gap-1.5">
          <span className="h-3 w-12 rounded-full" style={{ background: tokens.accent }} />
          <span className="h-3 w-10 rounded-full border" style={{ borderColor: tokens.edge }} />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[9%]" style={{ background: tokens["strip-bg"] ?? tokens.accent }} />
    </div>
  );
}
