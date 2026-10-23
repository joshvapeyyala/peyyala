import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content";
import { antonFont, themeColors } from "@/lib/og";

export const alt = "Joshva Peyyala — I build backends that ship real products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Sized so the longer second line fits the 1056px content width
const headline = { fontFamily: "Anton", fontSize: 112, lineHeight: 0.95 };

export default async function OpenGraphImage() {
  const profile = await getProfile();
  const colors = await themeColors();

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
          <span style={headline}>I BUILD BACKENDS</span>
          <div style={{ display: "flex", gap: 26 }}>
            <span style={headline}>THAT</span>
            <span style={{ ...headline, color: colors.accent }}>SHIP</span>
            <span style={headline}>REAL PRODUCTS.</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: colors.muted }}>
          <span>Node.js · Express · Next.js · PostgreSQL</span>
          <span style={{ color: colors.fg }}>peyyala.com</span>
        </div>
      </div>
    ),
    { ...size, fonts: await antonFont() },
  );
}
