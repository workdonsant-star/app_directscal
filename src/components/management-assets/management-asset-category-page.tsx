import { notFound, redirect } from "next/navigation";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ManagementAssetsLibrary } from "@/components/management-assets/management-assets-library";
import { canManageOrganization } from "@/lib/auth/access-control";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getManagementAssetsInCategory } from "@/lib/data/management-asset-categories";
import { getPublishedManagementAssets, getPublishedManagementAssetFolders } from "@/lib/data/management-assets-data-source";

export async function ManagementAssetCategoryPage({ categoryKey }: { categoryKey: string }) {
  const session = await getCurrentAuthSession();
  if (!session) redirect("/entrar");
  if (!canAccessCustomerApp(session.user)) redirect("/admin/operacao");
  const published = await getPublishedManagementAssets();
  const folders = await getPublishedManagementAssetFolders();
  const folder = folders.find(item => item.key === categoryKey);
  if (!folder) notFound();
  return (
    <>
      <AppTopbar />
      <AppPage>
        <section className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-ui-page">{folder.title}</h1>
            <p className="text-sm text-muted-foreground">Ativos de gestão publicados nesta categoria.</p>
          </div>
          <ManagementAssetsLibrary assets={getManagementAssetsInCategory(published, folder.key, folders)} categoryFilter={false} showType folders={folders} canEdit={canManageOrganization(session.user) && !session.acquisition && !session.leadershipInvitation} />
        </section>
      </AppPage>
    </>
  );
}
