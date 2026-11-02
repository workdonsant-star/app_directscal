"use client";
import { useDemo } from "./demo-store";
import { AppTopbar } from "@/components/app-topbar";
import { AppPage } from "@/components/app-page";
import { ManagementAssetsLibrary } from "@/components/management-assets/management-assets-library";
import { ManagementAssetEditableReader } from "@/components/management-assets/management-asset-editable-reader";
import { CustomerDocumentDownloadLink } from "@/components/management-assets/customer-document-download-link";
import { demoAssets } from "@/lib/data/demo/demo-data";
import { demoFolders } from "@/lib/data/demo/demo-workspaces";
import { getManagementAssetsInCategory } from "@/lib/data/management-asset-categories";
import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { DEMO_COMPANY } from "@/lib/data/demo/demo-data";

export function DemoAssets({ categoryHref, assetId, adminContext = false }: { categoryHref?: string; assetId?: string; adminContext?: boolean }) {
 const { state } = useDemo();
 const assets = state.assets ?? demoAssets;
 const folders = demoFolders(state);
 const asset = assets.find(a => a.id === assetId);
 const folder = folders.find(f => f.href === categoryHref);
 if (assetId && !asset) return <><AppTopbar /><AppPage>Ativo não encontrado.</AppPage></>;
 const adminBase = "/demo/admin/empresas/demo-vertex";
 const breadcrumb = adminContext && asset ? [{ label: "Empresas", href: "/demo/admin/empresas" }, { label: DEMO_COMPANY, href: adminBase }, { label: "Arquivos", href: `${adminBase}/criacao-dos-ativos` }, { label: asset.title }] : asset ? [{ label: asset.category ?? "Ativos de gestão", href: folders.find(f => f.title === asset.category)?.href ?? "/ativos-de-gestao" }, { label: asset.title }] : [];
 const uploaded = (state.uploadedDocuments ?? []).filter(document => document.kind === "asset" && (!folder || document.categoryKey === folder.key));
 const authored = folder ? getManagementAssetsInCategory(assets, folder.key, folders) : assets;
 return <><AppTopbar breadcrumb={breadcrumb} /><AppPage className={asset ? "min-w-0 px-6 py-8 lg:px-12" : undefined}>{adminContext && asset ? <div className="mb-8 space-y-6"><h1 className="text-ui-page">{DEMO_COMPANY}</h1><AdminCompanyTabs companyId="demo-vertex" active="assets" hasOrganization showActionPoints /></div> : null}{asset ? <ManagementAssetEditableReader asset={asset} canEdit /> : <section className="space-y-6"><h1 className="text-ui-page">{folder?.title ?? "Ativos de gestão"}</h1>{authored.length ? <ManagementAssetsLibrary assets={authored} categoryFilter={!folder} showType folders={folders} canEdit /> : null}{uploaded.length ? <div className="space-y-3"><h2 className="text-ui-section">Arquivos enviados</h2><ul className="divide-y border-t">{uploaded.map(document => <li key={document.id} className="py-3"><CustomerDocumentDownloadLink document={document} /><p className="text-xs text-muted-foreground">{document.fileName}</p></li>)}</ul></div> : null}{!authored.length && !uploaded.length ? <p className="py-8 text-sm text-muted-foreground">Nenhum ativo publicado nesta pasta.</p> : null}</section>}</AppPage></>;
}
