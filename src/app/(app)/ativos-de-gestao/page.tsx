import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderClosed } from "lucide-react";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getManagementAssetCategoryFolders } from "@/lib/data/management-asset-categories";
import { getPublishedManagementAssets } from "@/lib/data/management-assets-data-source";

export default async function ManagementAssetsPage() {
  const session = await getCurrentAuthSession();
  if (!session) redirect("/entrar");
  if (!canAccessCustomerApp(session.user)) redirect("/admin/operacao");
  const folders = getManagementAssetCategoryFolders(await getPublishedManagementAssets());
  return (
    <>
      <AppTopbar />
      <AppPage>
        <section className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Ativos de gestão</h1>
            <p className="text-sm text-muted-foreground">Consulte os ativos da empresa organizados por categoria.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {folders.map(folder => (
              <Link key={folder.key} href={folder.href} className="flex items-center gap-4 rounded-lg border p-5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
                <FolderClosed className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <h2 className="text-sm font-medium">{folder.title}</h2>
                  <p className="text-sm text-muted-foreground tabular-nums">{folder.count} {folder.count === 1 ? "ativo publicado" : "ativos publicados"}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </AppPage>
    </>
  );
}
