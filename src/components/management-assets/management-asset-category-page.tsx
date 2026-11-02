import { notFound, redirect } from "next/navigation";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ManagementAssetsLibrary } from "@/components/management-assets/management-assets-library";
import { canManageOrganization } from "@/lib/auth/access-control";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getManagementAssetsInCategory } from "@/lib/data/management-asset-categories";
import { listCustomerDocumentsForUser } from "@/lib/data/customer-documents-data-source";
import { getPublishedManagementAssets, getPublishedManagementAssetFolders } from "@/lib/data/management-assets-data-source";

export async function ManagementAssetCategoryPage({ categoryKey }: { categoryKey: string }) {
  const session = await getCurrentAuthSession();
  if (!session) redirect("/entrar");
  if (!canAccessCustomerApp(session.user)) redirect("/admin/operacao");
  const [published, files] = await Promise.all([getPublishedManagementAssets(), listCustomerDocumentsForUser(session.user.id, "asset")]);
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
          {getManagementAssetsInCategory(published, folder.key, folders).length > 0 ? <ManagementAssetsLibrary assets={getManagementAssetsInCategory(published, folder.key, folders)} categoryFilter={false} showType folders={folders} canEdit={canManageOrganization(session.user) && !session.acquisition && !session.leadershipInvitation} /> : null}
          {files.some(file => file.categoryKey === folder.key) ? <div className="space-y-3"><h2 className="text-ui-section">Arquivos</h2><ul className="divide-y border-t">{files.filter(file => file.categoryKey === folder.key).map(file => <li key={file.id} className="py-3"><a className="text-sm font-medium underline underline-offset-4" href={`/api/customer-documents/${file.id}`}>{file.title}</a><p className="text-xs text-muted-foreground">{file.fileName}</p></li>)}</ul></div> : null}
          {folder.count === 0 ? <p className="py-10 text-sm text-muted-foreground">Nenhum ativo publicado nesta pasta.</p> : null}
        </section>
      </AppPage>
    </>
  );
}
