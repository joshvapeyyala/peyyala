import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-20 sm:px-8 lg:px-10">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
        Error 404 · Flight not found
      </p>
      <h1 className="mt-4 font-display text-[clamp(5rem,22vw,16rem)] uppercase leading-[0.85]">
        Wrong <span className="text-outline">gate.</span>
      </h1>
      <Link
        href="/"
        className="mt-10 inline-flex h-14 items-center self-start rounded-full bg-accent px-7 text-[15px] font-bold text-ink"
      >
        Back to home →
      </Link>
    </main>
  );
}
