"use client";

import { Button, ButtonLink } from "@/components/admin/ui";

// An admin screen failed to render. The sidebar stays, so the other screens
// are a click away. Unsaved edits on the failed screen are lost.
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  // In production the message is hidden; the digest matches the server log entry
  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;
  const detail = process.env.NODE_ENV === "development" && error instanceof Error ? error.message : null;

  return (
    <div className="py-20 text-center">
      <p className="text-sm font-medium text-muted">Error</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">This screen didn&apos;t load</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Something went wrong on the server, often the database being briefly unreachable. Try again, and if it keeps happening check the server log.
      </p>
      {detail && <p className="mx-auto mt-4 max-w-lg rounded-lg bg-sunken px-3 py-2 text-left font-mono text-xs break-words">{detail}</p>}
      <div className="mt-6 flex justify-center gap-2">
        <Button variant="primary" onClick={retry}>
          Try again
        </Button>
        <ButtonLink href="/admin">Dashboard</ButtonLink>
      </div>
      {digest && <p className="mt-6 text-xs text-muted">Log reference: {digest}</p>}
    </div>
  );
}
