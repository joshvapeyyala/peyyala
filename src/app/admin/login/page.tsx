import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GoogleSignIn } from "@/components/admin/google-sign-in";

export const metadata: Metadata = { title: "Sign in" };

// Google sign-in, limited to the site owner's account (ADMIN_EMAIL)
export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-panel p-8 text-center shadow-sm">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">JP</span>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">Sign in to Portfolio admin</h1>
          <p className="mt-1.5 text-sm text-muted">Only the site owner&apos;s Google account can sign in.</p>
          {/* Reads ?error from the URL, so it renders in the browser */}
          <Suspense fallback={<div className="mt-6 h-10 rounded-lg bg-sunken" />}>
            <GoogleSignIn />
          </Suspense>
        </div>

        {/* The site is another root layout, so this is a full page load */}
        <Link href="/" className="mt-6 block text-center text-sm text-muted hover:text-fg">
          ← Back to the site
        </Link>
      </div>
    </main>
  );
}
