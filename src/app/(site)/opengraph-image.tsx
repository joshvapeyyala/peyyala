import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content";
import { displayCase, displayType, themeColors } from "@/lib/og";

export const alt = "Joshva Peyyala — I build backends that ship real products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const profile = await getProfile();
  const colors = await themeColors();
  const type = await displayType();
  // Sized so the longer second line fits the 1056px content width
  const headline = { ...type.style(Math.round(112 * type.scale)), lineHeight: 0.95 };
  // Word gap: Anton's is set wide; Sora's tracking already tightens the words
  const gap = type.uppercase ? 26 : Math.round(0.28 * headline.fontSize);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: colors.bg,
          color: colors.fg,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: colors.muted, letterSpacing: 3 }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: colors.accent }} />
          {profile.name.toUpperCase()} · {profile.title.toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={headline}>{displayCase("I build backends", type)}</span>
          <div style={{ display: "flex", gap }}>
            <span style={headline}>{displayCase("that", type)}</span>
            <span style={{ ...headline, color: colors.accent }}>{displayCase("ship", type)}</span>
            <span style={headline}>{displayCase("real products.", type)}</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: colors.muted }}>
          <span>Node.js · Express · Next.js · PostgreSQL</span>
          <span style={{ color: colors.fg }}>peyyala.com</span>
        </div>
      </div>
    ),
    { ...size, fonts: type.fonts },
  );
}
