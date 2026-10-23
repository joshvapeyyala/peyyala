import { ImageResponse } from "next/og";
import { antonFont, colors } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS rounds the corners itself, so this one stays square
export default async function AppleIcon() {
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
          color: colors.ink,
          fontFamily: "Anton",
          fontSize: 104,
          letterSpacing: 2,
        }}
      >
        JP
      </div>
    ),
    { ...size, fonts: await antonFont() },
  );
}
