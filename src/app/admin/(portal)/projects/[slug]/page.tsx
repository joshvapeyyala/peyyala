import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { buttonBase, buttonStyles } from "@/components/admin/ui";
import { getProject, getProjects } from "@/lib/content";

// No ensureStatic here (unlike /work/[slug]): the admin layout reads the
// session on every request, so the full route can't be static. An unknown slug
// shows the not-found page with status 200, which only the admin ever sees.
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata(props: PageProps<"/admin/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProject(slug);
  return { title: project ? `Edit ${project.name}` : "Project not found" };
}

// The slug is URL data, so it's read inside Suspense, as on the site's case study
export default function EditProjectPage(props: PageProps<"/admin/projects/[slug]">) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-sunken" />}>
      <EditProject params={props.params} />
    </Suspense>
  );
}

async function EditProject({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.category}
        back={{ href: "/admin/projects", label: "All projects" }}
        actions={
          // Plain <a>: the site has its own root layout
          <a href={`/work/${project.slug}`} target="_blank" rel="noreferrer" className={`${buttonBase} ${buttonStyles.secondary}`}>
            View on site ↗
          </a>
        }
      />
      <ProjectForm project={project} />
    </>
  );
}
