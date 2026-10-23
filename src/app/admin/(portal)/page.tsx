import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { statusOptions } from "@/components/admin/options";
import { Badge, ButtonLink, Card, buttonBase, buttonStyles, sectionId } from "@/components/admin/ui";
import { designs } from "@/content/themes";
import { cacheLife, cacheTag } from "next/cache";
import { contentTags, getProfile, getProjects, getServices, getTheme } from "@/lib/content";
import { getUnreadCount } from "@/server/inbox";
import { fileExists } from "@/server/storage";

// absolute: the layout's "%s — Admin" template only applies to child segments
export const metadata: Metadata = { title: { absolute: "Dashboard — Admin" } };

type Check = { done: boolean; text: string; href: string };

async function InboxCard() {
  const unread = await getUnreadCount();
  return (
    <Link href="/admin/inbox" className="group rounded-xl">
      <Card className={`h-full p-5 transition-colors group-hover:border-border-strong ${unread ? "border-primary/50" : ""}`}>
        <p className="text-sm text-muted">Inbox</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{unread}</p>
        <p className="mt-1 text-sm text-muted">{unread === 1 ? "unread message" : "unread messages"}</p>
      </Card>
    </Link>
  );
}

// Cached with the profile: the file only changes through the resume upload,
// which refreshes the profile tag
async function resumeExists(url: string) {
  "use cache";
  cacheTag(contentTags.profile);
  cacheLife("max");
  return fileExists(url);
}

export default async function DashboardPage() {
  const [profile, projects, { services }, theme] = await Promise.all([getProfile(), getProjects(), getServices(), getTheme()]);
  const hasResume = await resumeExists(profile.resumePdf);
  const live = projects.filter((project) => project.status === "live").length;

  // Content the site looks thin without. Links go straight to the field to fix.
  const checks: Check[] = [
    ...projects.map((project) => ({
      done: Boolean(project.screenshot),
      text: `${project.name}: screenshot`,
      href: `/admin/projects/${project.slug}#${sectionId("Screenshot")}`,
    })),
    ...projects.map((project) => ({
      done: Boolean(project.caseStudy),
      text: `${project.name}: case-study write-up`,
      href: `/admin/projects/${project.slug}#${sectionId("Case study")}`,
    })),
    {
      done: hasResume,
      text: "Resume PDF",
      href: `/admin/profile#${sectionId("Resume PDF")}`,
    },
    { done: services.length > 0, text: "At least one service", href: "/admin/services" },
  ];
  const done = checks.filter((check) => check.done).length;
  // Open items first, so the list reads as a to-do
  checks.sort((a, b) => Number(a.done) - Number(b.done));

  const stats = [
    { href: "/admin/projects", label: "Projects", value: projects.length, detail: `${live} live` },
    { href: "/admin/services", label: "Services", value: services.length, detail: "offered" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile.firstName}. Here's how the site looks right now.`}
        actions={
          <>
            {/* Plain <a>: the site has its own root layout */}
            <a href="/" target="_blank" rel="noreferrer" className={`${buttonBase} ${buttonStyles.secondary}`}>
              View site ↗
            </a>
            <ButtonLink href="/admin/projects/new" variant="primary">
              + New project
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Messages are read per request, so the count streams in */}
        <Suspense fallback={<Card className="h-full min-h-28 animate-pulse bg-sunken" />}>
          <InboxCard />
        </Suspense>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group rounded-xl">
            <Card className="h-full p-5 transition-colors group-hover:border-border-strong">
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.detail}</p>
            </Card>
          </Link>
        ))}
        <Link href="/admin/appearance" className="group rounded-xl">
          <Card className="flex h-full items-start justify-between gap-3 p-5 transition-colors group-hover:border-border-strong">
            <span>
              <span className="block text-sm text-muted">Theme</span>
              <span className="mt-2 block text-2xl font-semibold tracking-tight">{theme.colors.label}</span>
              <span className="mt-1 block text-sm text-muted">{designs[theme.design].label} design</span>
            </span>
            {/* The live palette's background and accent */}
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border" style={{ background: theme.colors.bg }}>
              <span className="h-4 w-4 rounded-full" style={{ background: theme.colors.accent }} />
            </span>
          </Card>
        </Link>
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card className="p-5">
          <h2 className="text-base font-semibold">Availability</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={profile.openToWork ? "success" : "neutral"}>● {profile.openToWork ? "Open" : "Not looking"}</Badge>
            <span className="text-sm">{profile.openToWorkLabel}</span>
          </div>
          <p className="mt-3 text-sm text-muted">{profile.location}</p>
          <Link href={`/admin/profile#${sectionId("Availability")}`} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Change availability →
          </Link>
        </Card>

        <Card className="p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">Site checklist</h2>
            <p className="text-sm text-muted tabular-nums">
              {done} of {checks.length} done
            </p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-label="Checklist progress" aria-valuemin={0} aria-valuemax={checks.length} aria-valuenow={done}>
            <div className="h-full rounded-full bg-success" style={{ width: `${(done / checks.length) * 100}%` }} />
          </div>
          <ul className="mt-4 flex flex-col">
            {checks.map((check) => (
              <li key={check.text}>
                <Link href={check.href} className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-sunken">
                  {check.done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12.5l2.5 2.5L16 9.5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 text-warning" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                    </svg>
                  )}
                  <span className={check.done ? "text-muted" : ""}>{check.text}</span>
                  <span className="sr-only">{check.done ? "(done)" : "(to do)"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Projects</h2>
          <Link href="/admin/projects" className="text-sm font-medium text-primary hover:underline">
            Manage →
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link href={`/admin/projects/${project.slug}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-sunken">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{project.name}</span>
                  <span className="block truncate text-xs text-muted">{project.category}</span>
                </span>
                <Badge tone={project.status === "live" ? "success" : "neutral"}>
                  {statusOptions.find((option) => option.value === project.status)?.label}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
