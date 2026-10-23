export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="label text-[12px] font-semibold uppercase tracking-[0.16em] text-muted">
      {children}
    </p>
  );
}
