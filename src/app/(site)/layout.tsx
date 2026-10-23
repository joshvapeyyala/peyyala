import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getProfile, getTheme } from "@/lib/content";
import { SiteDocument } from "./site-document";

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
