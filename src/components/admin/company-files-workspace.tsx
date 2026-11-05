"use client";

import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { CustomerDocumentsWorkspace } from "@/components/admin/customer-documents-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import type { AdminManagementAssetListItem } from "@/lib/contracts";
import type { CustomerDocument } from "@/lib/contracts/customer-documents";
import type { ManagementAssetCategoryFolder } from "@/lib/data/management-asset-categories";

export function CompanyFilesWorkspace({ company, assets, documents, folders, showActionPoints = false, actionsInTabs = false }: {
  company: { id: string; name: string };
  assets: AdminManagementAssetListItem[];
  documents: CustomerDocument[];
  folders: ManagementAssetCategoryFolder[];
  showActionPoints?: boolean;
  actionsInTabs?: boolean;
}) {
  return <>
    <AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: company.name }]} />
    <AppPage>
      <div className="flex w-full flex-col gap-8">
        <div>
          <h1 className="text-ui-page">{company.name}</h1>
        </div>
        {actionsInTabs ? null : <AdminCompanyTabs companyId={company.id} active="assets" hasOrganization showActionPoints={showActionPoints} showReport />}
        <CustomerDocumentsWorkspace companyId={company.id} initialDocuments={documents} initialFolders={folders} assets={assets} renderTabs={actionsInTabs ? actions => <AdminCompanyTabs companyId={company.id} active="assets" hasOrganization showActionPoints={showActionPoints} showReport actions={actions} /> : undefined} />
      </div>
    </AppPage>
  </>;
}
