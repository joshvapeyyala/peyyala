import type { Metadata, Viewport } from "next";
import { Anton, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

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

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
