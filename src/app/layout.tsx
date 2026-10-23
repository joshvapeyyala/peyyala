import type { Metadata, Viewport } from "next";
import { paletteCss, themeIndex } from "@/content/themes";
import { getTheme } from "@/lib/content";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://peyyala.com"),
  title: {
    default: "Joshva Peyyala — Backend-focused full-stack developer",
    template: "%s — Joshva Peyyala",
  },
  description:
    "Software engineer building production REST APIs and web apps with Node.js, Express and Next.js. Creator of CareDeck, Xpensefy and Lineage. Open to full-time roles.",
  openGraph: {
    type: "website",
    siteName: "Joshva Peyyala",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return { themeColor: theme.colors.bg, colorScheme: theme.colors.scheme };
}

// Development only: ?design=wave&palette=mint previews any valid pair locally
// without editing src/content/site.ts. Never shipped in production builds.
const previewScript = `(() => {
  const valid = ${JSON.stringify(themeIndex())};
  const q = new URLSearchParams(location.search);
  const design = q.get("design"), palette = q.get("palette");
  if (valid[design]?.includes(palette)) {
    document.documentElement.dataset.design = design;
    document.documentElement.dataset.theme = palette;
  }
})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getTheme();

  return (
    <html
      lang="en"
      data-design={theme.design}
      data-theme={theme.palette}
      // The development preview script may change the two attributes above
      suppressHydrationWarning={process.env.NODE_ENV === "development"}
      className={`${fontVariables} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletteCss() }} />
        {process.env.NODE_ENV === "development" && (
          <script dangerouslySetInnerHTML={{ __html: previewScript }} />
        )}
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
