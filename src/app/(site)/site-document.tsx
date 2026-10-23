import { paletteCss, themeIndex } from "@/content/themes";
import { getTheme } from "@/lib/content";
import { fontVariables } from "@/lib/design-fonts";
import "./site.css";

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

// The public site's <html> document, shared by its root layout and the global 404
export async function SiteDocument({ children }: { children: React.ReactNode }) {
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
