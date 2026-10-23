import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <>
      <PageHeader title="New project" back={{ href: "/admin/projects", label: "All projects" }} />
      <ProjectForm />
    </>
  );
}
