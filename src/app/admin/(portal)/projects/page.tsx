import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectList } from "@/components/admin/project-list";
import { ButtonLink } from "@/components/admin/ui";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <PageHeader
        title="Projects"
        description="Everything shown on the home board, the Work page and the case studies."
        actions={
          <ButtonLink href="/admin/projects/new" variant="primary">
            + New project
          </ButtonLink>
        }
      />
      <ProjectList projects={projects} />
    </>
  );
}
