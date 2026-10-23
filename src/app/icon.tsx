import { ImageResponse } from "next/og";
import { displayType, themeColors } from "@/lib/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
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
          borderRadius: 14,
          color: colors.onAccent,
          letterSpacing: 1,
          ...type.style(Math.round(38 * type.iconScale)),
        }}
      >
        JP
      </div>
    ),
    { ...size, fonts: type.fonts },
  );
}
