import { ImageResponse } from "next/og";
import { antonFont, colors } from "@/lib/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
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
          color: colors.ink,
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
