import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign in" };

// Google sign-in, limited to the site owner's account once the backend exists.
// Until then the button is shown but disabled.
export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-panel p-8 text-center shadow-sm">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">JP</span>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">Sign in to Portfolio admin</h1>
          <p className="mt-1.5 text-sm text-muted">Only the site owner&apos;s Google account can sign in.</p>

          <button
            type="button"
            disabled
            title="Sign-in arrives with the backend"
            className="mt-7 inline-flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-border-strong bg-panel text-sm font-medium transition hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-panel"
          >
            <GoogleMark />
            Continue with Google
          </button>
          <p className="mt-3 text-xs text-muted">Sign-in arrives with the backend.</p>
        </div>

        {/* The site is another root layout, so this is a full page load */}
        <Link href="/" className="mt-6 block text-center text-sm text-muted hover:text-fg">
          ← Back to the site
        </Link>
      </div>
    </main>
  );
}

// Google's four-colour "G", as used on standard sign-in buttons
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
