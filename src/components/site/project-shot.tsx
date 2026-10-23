import Image from "next/image";
import type { Project } from "@/content/types";

type Props = {
  project: Project;
  sizes: string;
  className?: string;
  preload?: boolean;
};

// A browser window framing the project's screenshot, or its initial when there is none yet
export function ProjectShot({ project, sizes, className = "", preload = false }: Props) {
  const shot = project.screenshot;

  return (
    <div className={`flex flex-col overflow-hidden bg-ink ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="h-2 w-2 rounded-full bg-line" />
        <span className="ml-2 truncate text-[11px] text-muted">{project.urlLabel}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">
        {shot ? (
          <Image
            src={shot.src}
            alt={shot.alt}
            fill
            sizes={sizes}
            preload={preload}
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="text-outline absolute inset-0 flex items-center justify-center font-display text-[clamp(4rem,12vw,8rem)] uppercase leading-none opacity-40"
          >
            {project.name.charAt(0)}
          </span>
        )}
      </div>
    </div>
  );
}
