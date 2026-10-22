import Link from "next/link";
import type { ComponentProps } from "react";

const styles = {
  primary: "bg-accent text-ink hover:brightness-110",
  outline: "border border-[#57534e] text-paper hover:border-paper",
};

type Props = ComponentProps<typeof Link> & { variant?: keyof typeof styles };

export function ButtonLink({ variant = "primary", className = "", ...props }: Props) {
  return (
    <Link
      {...props}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold transition sm:h-14 sm:px-7 ${styles[variant]} ${className}`}
    />
  );
}
