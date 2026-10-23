"use client";

import Link from "next/link";

// A site page failed to render (e.g. the database was unreachable). The header
// and footer still show; this replaces the page content.
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  // The server logs the full error under this id; visitors only see the id
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-20 sm:px-8 lg:px-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">Error 500 · Flight delayed</p>
      <h1 className="mega-title mt-4 font-display text-[clamp(5rem,22vw,16rem)] uppercase leading-[0.85]">
        Delay<span className="text-outline">ed.</span>
      </h1>
      <p className="mt-8 max-w-xl text-lg text-soft">Something went wrong loading this page. It&apos;s usually brief, so try again in a moment.</p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={retry}
          className="btn-primary inline-flex h-14 items-center rounded-full bg-accent px-7 text-[15px] font-bold text-on-accent"
        >
          Try again
        </button>
        <Link href="/" className="text-[15px] font-semibold text-soft underline underline-offset-4 hover:text-paper">
          Back to home
        </Link>
      </div>
      {digest && <p className="mt-10 text-xs text-muted">Reference: {digest}</p>}
    </div>
  );
}
