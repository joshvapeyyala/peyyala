import Link from "next/link";

// Shared by the site's not-found.tsx and the app-wide global-not-found.tsx
export function WrongGate() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-20 sm:px-8 lg:px-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
        Error 404 · Flight not found
      </p>
      <h1 className="mega-title mt-4 font-display text-[clamp(5rem,22vw,16rem)] uppercase leading-[0.85]">
        Wrong <span className="text-outline">gate.</span>
      </h1>
      <Link
        href="/"
        className="btn-primary mt-10 inline-flex h-14 items-center self-start rounded-full bg-accent px-7 text-[15px] font-bold text-on-accent"
      >
        Back to home →
      </Link>
    </div>
  );
}
