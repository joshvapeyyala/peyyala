import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { schemeScript } from "@/components/admin/options";
import "./admin.css";

const inter = Inter({
  variable: "--font-admin",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s — Admin",
  },
  robots: { index: false, follow: false },
};

// Root layout of the admin portal, separate from the public site's in
// src/app/(site). Moving between the two is a full page load by design.
// The sidebar shell lives in (portal)/layout.tsx so the login page has none.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    // schemeScript may set data-scheme on <html> before React hydrates
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: schemeScript }} />
      </head>
      <body className="min-h-full font-sans">
        {children}
      </body>
    </html>
  );
}
