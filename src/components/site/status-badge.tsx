import type { ProjectStatus } from "@/content/types";

export const statusMeta: Record<ProjectStatus, { label: string; detail: string; color: string }> = {
  live: { label: "Live", detail: "Live in production", color: "text-live" },
  "in-progress": { label: "In progress", detail: "In development", color: "text-soft" },
  archived: { label: "Archived", detail: "No longer running", color: "text-muted" },
};

export function StatusBadge({ status, className = "" }: { status: ProjectStatus; className?: string }) {
  const meta = statusMeta[status];
  return (
    <span className={`font-bold uppercase tracking-[0.08em] ${meta.color} ${className}`}>
      <span aria-hidden="true">● </span>
      {meta.label}
    </span>
  );
}
