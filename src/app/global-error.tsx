"use client";

// The last resort: a root layout itself failed (site or admin), so none of its
// styles, fonts or theme are available. Plain inline styles, following the
// visitor's light/dark setting.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", colorScheme: "light dark", background: "Canvas", color: "CanvasText" }}>
        <title>Something went wrong</title>
        <main style={{ minHeight: "100vh", display: "grid", placeContent: "center", gap: 16, padding: 24, textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Something went wrong</h1>
          <p style={{ margin: 0, opacity: 0.7 }}>The page couldn&apos;t load. Please try again in a moment.</p>
          <p style={{ margin: 0 }}>
            <button type="button" onClick={retry} style={{ font: "inherit", padding: "10px 20px", borderRadius: 999, cursor: "pointer" }}>
              Try again
            </button>
          </p>
        </main>
      </body>
    </html>
  );
}
