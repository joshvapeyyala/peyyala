export function Marquee({ items, label }: { items: string[]; label: string }) {
  const copy = (hidden: boolean) => (
    <span aria-hidden={hidden} className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((item) => (
        <span key={item} className="flex items-center gap-8">
          {item}
          <span className="text-ink/60">✦</span>
        </span>
      ))}
    </span>
  );

  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-hidden bg-accent py-3 text-ink sm:py-4"
    >
      <div className="marquee-track font-display text-2xl uppercase sm:text-4xl">
        {copy(true)}
        {copy(true)}
      </div>
    </div>
  );
}
