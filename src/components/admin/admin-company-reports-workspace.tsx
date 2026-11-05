"use client";

import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { CustomerDocumentsWorkspace } from "@/components/admin/customer-documents-workspace";
import type { CustomerDocument } from "@/lib/contracts/customer-documents";

export function AdminCompanyReportsWorkspace({ companyId, documents }: {
  companyId: string;
  documents: CustomerDocument[];
}) {
  return <CustomerDocumentsWorkspace
    companyId={companyId}
    initialDocuments={documents}
    initialFolders={[]}
    reportsOnly
    renderTabs={actions => <AdminCompanyTabs companyId={companyId} active="report" hasOrganization showActionPoints showReport actions={actions} />}
  />;
}
