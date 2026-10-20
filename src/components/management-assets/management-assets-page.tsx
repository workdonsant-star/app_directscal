import { getCurrentAuthSession } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/access-control";
import { getPublishedManagementAssetFolders } from "@/lib/data/management-assets-data-source";
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
  const [assets, folders, session] = await Promise.all([getManagementAssetsByType(type), getPublishedManagementAssetFolders(), getCurrentAuthSession()]);

  return (
    <>
      <AppTopbar />

      <AppPage>
        <section aria-labelledby="management-assets-title" className="space-y-6">
          <div className="space-y-1">
            <h1
              id="management-assets-title"
              className="text-ui-page"
            >
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <ManagementAssetsLibrary
            assets={assets}
            folders={folders}
            canEdit={!!session && canManageOrganization(session.user) && !session.acquisition && !session.leadershipInvitation}
            categoryFilter={categoryFilter}
          />
        </section>
      </AppPage>
    </>
  );
}
