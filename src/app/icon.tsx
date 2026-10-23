import { ImageResponse } from "next/og";
import { antonFont, themeColors } from "@/lib/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const colors = await themeColors();
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
          fontFamily: "Anton",
          fontSize: 38,
          letterSpacing: 1,
        }}
      >
        JP
      </div>
    ),
    { ...size, fonts: await antonFont() },
  );
}
