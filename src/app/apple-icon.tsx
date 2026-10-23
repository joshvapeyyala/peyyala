import { ImageResponse } from "next/og";
import { displayType, themeColors } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so this one stays square
export default async function AppleIcon() {
  const colors = await themeColors();
  const type = await displayType();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.accent,
          color: colors.onAccent,
          letterSpacing: 2,
          ...type.style(Math.round(104 * type.iconScale)),
        }}
      >
        JP
      </div>
    ),
    { ...size, fonts: type.fonts },
  );
}
