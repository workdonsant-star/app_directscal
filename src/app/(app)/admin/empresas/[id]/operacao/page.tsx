import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminCompanyDetail } from "@/components/admin/admin-company-detail";
import { SpecialistsProvider } from "@/components/admin/use-specialists";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { getAdminCompanyContext } from "@/lib/data/admin-company-operations-data-source";
import { requireAdminPageSession } from "@/lib/data/admin-page-data";
import { getSpecialists } from "@/lib/data/person-profiles-data-source";

export const metadata: Metadata = { title: "Operação da empresa — Admin Directscal" };

export default async function AdminCompanyOperationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPageSession();
  const [context, specialists] = await Promise.all([getAdminCompanyContext(id), getSpecialists()]);
  if (!context) notFound();

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: context.company.name }]} />
      <AppPage>
        <SpecialistsProvider initialSpecialists={specialists.filter(item => !item.deleted)}>
          <AdminCompanyDetail key={`${id}:${context.operations.assignment.updatedAt}`} context={context} />
        </SpecialistsProvider>
      </AppPage>
    </>
  );
}
