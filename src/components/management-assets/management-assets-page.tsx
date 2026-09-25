import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ManagementAssetsLibrary } from "@/components/management-assets/management-assets-library";
import { getManagementAssetsByType } from "@/lib/data/management-assets-data-source";
import type { ManagementAssetType } from "@/lib/types";

export async function ManagementAssetsPage({
  categoryFilter,
  description,
  title,
  type,
}: {
  categoryFilter: boolean;
  description: string;
  title: string;
  type: ManagementAssetType;
}) {
  const assets = await getManagementAssetsByType(type);

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Ativos de gestão", href: "/ativos-de-gestao" },
          { label: title },
        ]}
      />

      <AppPage>
        <section aria-labelledby="management-assets-title" className="space-y-6">
          <div className="space-y-1">
            <h1
              id="management-assets-title"
              className="font-heading text-2xl font-semibold"
            >
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <ManagementAssetsLibrary
            assets={assets}
            categoryFilter={categoryFilter}
          />
        </section>
      </AppPage>
    </>
  );
}
