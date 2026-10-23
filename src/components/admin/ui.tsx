import Link from "next/link";
import type { ComponentProps } from "react";

// Small presentational pieces shared by every admin screen

export const buttonStyles = {
  primary: "bg-primary text-primary-fg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100",
  secondary: "border border-border-strong bg-panel text-fg hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50",
  ghost: "text-muted hover:bg-sunken hover:text-fg",
  danger: "border border-danger/40 bg-panel text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-panel",
};

export const buttonBase = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition";

type Variant = keyof typeof buttonStyles;

export function Button({ variant = "secondary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" {...props} className={`${buttonBase} ${buttonStyles[variant]} ${className}`} />;
}

export function ButtonLink({ variant = "secondary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={`${buttonBase} ${buttonStyles[variant]} ${className}`} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`rounded-xl border border-border bg-panel ${className}`} />;
}

const badgeTones = {
  neutral: "bg-sunken text-muted",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  primary: "bg-primary text-primary-fg",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTones; children: React.ReactNode }) {
  return (
    <span className={`inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

// Anchor id for a form section, shared with the "On this page" list
export const sectionId = (title: string) => `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

// A titled group of fields inside a form
export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const id = sectionId(title);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 rounded-xl border border-border bg-panel p-5 sm:p-6 lg:scroll-mt-8">
      <div className="mb-5">
        <h2 id={`${id}-title`} className="text-base font-semibold">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
