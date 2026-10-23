"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/content/types";
import { IconButton, SaveBar } from "./form";
import { statusOptions } from "./options";
import { Badge, Card } from "./ui";

// The projects in site order. Moving one changes the order on the home board
// and the Work page once saving is connected.
export function ProjectList({ projects }: { projects: Project[] }) {
  const [order, setOrder] = useState(projects);
  const changed = order.some((project, index) => project.slug !== projects[index].slug);

  function move(index: number, by: number) {
    const next = [...order];
    const [moved] = next.splice(index, 1);
    next.splice(index + by, 0, moved);
    setOrder(next);
  }

  return (
    <div className="pb-32 sm:pb-24">
      <Card className="overflow-hidden">
        <ul className="divide-y divide-border">
          {order.map((project, index) => (
            <li key={project.slug} className="flex items-center hover:bg-sunken">
              <Link href={`/admin/projects/${project.slug}`} className="flex min-w-0 flex-1 items-center gap-4 py-3 pl-4 sm:pl-5">
                <span className="relative hidden h-12 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-sunken sm:block">
                  {project.screenshot && <Image src={project.screenshot.src} alt="" fill sizes="80px" className="object-cover object-top" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{project.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {project.category} · {project.urlLabel}
                  </span>
                </span>
                <span className="hidden text-xs text-muted md:block">{project.caseStudy ? "Case study written" : "No case study"}</span>
                <Badge tone={project.status === "live" ? "success" : "neutral"}>
                  {statusOptions.find((option) => option.value === project.status)?.label}
                </Badge>
              </Link>
              <div className="flex shrink-0 gap-0.5 py-3 pr-3 pl-2 sm:pr-4">
                <IconButton label={`Move ${project.name} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                  ↑
                </IconButton>
                <IconButton label={`Move ${project.name} down`} disabled={index === order.length - 1} onClick={() => move(index, 1)}>
                  ↓
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-3 text-xs text-muted">Projects appear on the site in this order. Use the arrows to change it.</p>
      <SaveBar
        dirty={changed}
        onDiscard={() => setOrder(projects)}
        message={
          <p>
            <span className="font-medium">New order</span>
            <span className="text-muted"> · {order.map((project) => project.name).join(", ")}</span>
          </p>
        }
      />
    </div>
  );
}
