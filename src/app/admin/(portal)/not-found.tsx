import { ButtonLink } from "@/components/admin/ui";

// Admin pages that call notFound(), e.g. an unknown project slug
export default function AdminNotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nothing here</h1>
      <p className="mt-2 text-sm text-muted">That admin page or item doesn&apos;t exist.</p>
      <ButtonLink href="/admin" variant="primary" className="mt-6">
        Back to dashboard
      </ButtonLink>
    </div>
  );
}
