"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Project } from "@/content/types";
import { ProjectShot } from "./project-shot";
import { StatusBadge } from "./status-badge";

type Props = {
  projects: Project[];
  boardingLabel: string;
};

const rowGrid =
  "grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 md:grid-cols-[4rem_minmax(0,1fr)_10rem] md:gap-x-6 lg:grid-cols-[4rem_minmax(0,1.25fr)_minmax(0,1fr)_11rem]";

export function DepartureBoard({ projects, boardingLabel }: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [top, setTop] = useState(0);

  function show(index: number, row: HTMLElement) {
    setActive(index);
    setTop(row.offsetTop + row.offsetHeight / 2);
  }

  const current = active === null ? null : projects[active];

  return (
    <div className="relative">
      <div
        className={`${rowGrid} hidden border-b border-line pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted md:grid`}
        aria-hidden="true"
      >
        <span>No.</span>
        <span>Destination</span>
        <span className="hidden lg:block">Via</span>
        <span className="text-right">Status</span>
      </div>

      <ul ref={listRef} className="relative" onMouseLeave={() => setActive(null)}>
        {projects.map((project, index) => {
          const isActive = active === index;
          return (
            <li key={project.slug} className="border-b border-line">
              <Link
                href={`/work/${project.slug}`}
                className={`${rowGrid} group py-5 md:py-6`}
                onMouseEnter={(event) => show(index, event.currentTarget)}
                onFocus={(event) => show(index, event.currentTarget)}
                onBlur={() => setActive(null)}
              >
                <span className="font-display text-lg text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span
                    className={`font-display text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-none transition-colors ${
                      isActive ? "text-accent" : "text-paper"
                    }`}
                  >
                    {project.name}
                  </span>
                  <span className="text-sm text-soft lg:hidden">
                    {project.category}
                    <span className="md:hidden">
                      {" · "}
                      <StatusBadge status={project.status} />
                    </span>
                  </span>
                </span>
                <span className="hidden text-sm leading-relaxed text-soft lg:block">
                  {project.category}
                  <br />
                  <span className="text-muted">{project.stack.slice(0, 3).join(" · ")}</span>
                </span>
                <StatusBadge status={project.status} className="hidden text-right text-sm md:block" />
              </Link>
            </li>
          );
        })}

        <li className="border-b border-line bg-ink-2">
          <Link
            href="/contact"
            className={`${rowGrid} group py-5 md:py-6`}
            onMouseEnter={() => setActive(null)}
          >
            <span className="font-display text-lg text-muted">
              {String(projects.length + 1).padStart(2, "0")}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-display text-[clamp(2.5rem,7vw,4.5rem)] uppercase leading-none text-accent">
                Your team
              </span>
              <span className="text-sm text-soft lg:hidden">
                {boardingLabel}
                <span className="md:hidden">
                  {" · "}
                  <span className="blink font-bold uppercase text-accent">Boarding now</span>
                </span>
              </span>
            </span>
            <span className="hidden text-sm leading-relaxed text-soft lg:block">
              {boardingLabel}
              <br />
              <span className="text-muted">Gate: Contact →</span>
            </span>
            <span className="blink hidden text-right text-sm font-bold uppercase tracking-[0.08em] text-accent md:block">
              Boarding now
            </span>
          </Link>
        </li>
      </ul>

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute right-[22%] z-10 hidden w-72 -translate-y-1/2 transition-[top,opacity,transform] duration-300 ease-out lg:block ${
          current ? "rotate-[-5deg] opacity-100" : "rotate-0 opacity-0"
        }`}
        style={{ top: top + 30 }}
      >
        {current && (
          <div className="overflow-hidden rounded-2xl border-2 border-accent bg-ink-2 shadow-[0_24px_60px_rgba(0,0,0,0.7)]">
            <ProjectShot project={current} sizes="288px" className="border-b border-line" />
            <div className="flex flex-col gap-3 p-4">
              <span className="font-display text-3xl uppercase leading-none">{current.name}</span>
              <span className="flex flex-wrap gap-1.5">
                {current.stack.slice(0, 4).map((item) => (
                  <span key={item} className="rounded-full bg-line px-2.5 py-1 text-[11px] text-soft">
                    {item}
                  </span>
                ))}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-soft">
                View case study →
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
