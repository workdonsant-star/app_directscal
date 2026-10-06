import { notFound, redirect } from "next/navigation";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ManagementAssetsLibrary } from "@/components/management-assets/management-assets-library";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getManagementAssetCategoryFolders, getManagementAssetsInCategory } from "@/lib/data/management-asset-categories";
import { getPublishedManagementAssets } from "@/lib/data/management-assets-data-source";

export async function ManagementAssetCategoryPage({ categoryKey }: { categoryKey: string }) {
  const session = await getCurrentAuthSession();
  if (!session) redirect("/entrar");
  if (!canAccessCustomerApp(session.user)) redirect("/admin/operacao");
  const published = await getPublishedManagementAssets();
  const folder = getManagementAssetCategoryFolders(published).find(item => item.key === categoryKey);
  if (!folder) notFound();
  return (
    <>
      <AppTopbar />
      <AppPage>
        <section className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{folder.title}</h1>
            <p className="text-sm text-muted-foreground">Ativos de gestão publicados nesta categoria.</p>
          </div>
          <ManagementAssetsLibrary assets={getManagementAssetsInCategory(published, folder.key)} categoryFilter={false} showType />
        </section>
      </AppPage>
    </>
  );
}
