import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getProfile, getTheme } from "@/lib/content";
import { SiteDocument } from "./site-document";

// The title follows the profile (name, tagline), so an admin edit updates the
// browser tab and link previews too. getProfile() is cached and tagged, so
// this stays prerendered and refreshes with the profile.
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    metadataBase: new URL("https://peyyala.com"),
    title: {
      default: `${profile.name} — ${profile.tagline}`,
      template: `%s — ${profile.name}`,
    },
    description:
      "Software engineer building production REST APIs and web apps with Node.js, Express and Next.js. Creator of CareDeck, Xpensefy and Lineage. Open to full-time roles.",
    openGraph: {
      type: "website",
      siteName: profile.name,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return { themeColor: theme.colors.bg, colorScheme: theme.colors.scheme };
}

// Root layout of the public site; the admin portal has its own in src/app/admin
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();

  return (
    <SiteDocument>
      <SiteHeader name={profile.name} />
      <main className="flex-1">{children}</main>
      <SiteFooter profile={profile} />
    </SiteDocument>
  );
}
