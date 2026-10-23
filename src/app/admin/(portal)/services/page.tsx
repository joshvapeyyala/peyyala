import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ServicesForm } from "@/components/admin/services-form";
import { getServices } from "@/lib/content";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage() {
  const { services, process } = await getServices();

  return (
    <>
      <PageHeader title="Services" description="What you offer freelance clients and how a project runs." />
      <ServicesForm services={services} process={process} />
    </>
  );
}
