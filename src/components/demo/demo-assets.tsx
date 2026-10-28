"use client";
import { useDemo } from "./demo-store";
import { AppTopbar } from "@/components/app-topbar";
import { AppPage } from "@/components/app-page";
import { ManagementAssetsLibrary } from "@/components/management-assets/management-assets-library";
import { ManagementAssetEditableReader } from "@/components/management-assets/management-asset-editable-reader";
import { demoAssets } from "@/lib/data/demo/demo-data";
import { demoFolders } from "@/lib/data/demo/demo-workspaces";
import { getManagementAssetsInCategory } from "@/lib/data/management-asset-categories";

export function DemoAssets({ categoryHref, assetId }: { categoryHref?: string; assetId?: string }) {
 const { state } = useDemo();
 const assets = state.assets ?? demoAssets;
 const folders = demoFolders(state);
 const asset = assets.find(a => a.id === assetId);
 const folder = folders.find(f => f.href === categoryHref);
 if (assetId && !asset) return <><AppTopbar /><AppPage>Ativo não encontrado.</AppPage></>;
 return <><AppTopbar breadcrumb={asset ? [{ label: asset.category ?? "Ativos de gestão", href: folders.find(f => f.title === asset.category)?.href ?? "/ativos-de-gestao" }, { label: asset.title }] : []} /><AppPage className={asset ? "min-w-0 px-6 py-8 lg:px-12" : undefined}>{asset ? <ManagementAssetEditableReader asset={asset} canEdit /> : <section className="space-y-6"><div className="space-y-1"><h1 className="text-ui-page">{folder?.title ?? "Ativos de gestão"}</h1><p className="text-sm text-muted-foreground">Ativos de gestão publicados nesta categoria.</p></div><ManagementAssetsLibrary assets={folder ? getManagementAssetsInCategory(assets, folder.key, folders) : assets} categoryFilter={!folder} showType folders={folders} canEdit /></section>}</AppPage></>;
}
