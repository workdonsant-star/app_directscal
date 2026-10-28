"use client";

import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { AdminCompanyDetail } from "@/components/admin/admin-company-detail";
import { ManagementAssetsWorkspace } from "@/components/admin/management-assets-workspace";
import { ManagementAssetEditorWorkspace } from "@/components/admin/management-asset-editor-workspace";
import { ManagementAssetEditableReader } from "@/components/management-assets/management-asset-editable-reader";
import { AiChatWorkspace } from "@/components/ai-chat/ai-chat-workspace";
import { ProductGuide } from "@/components/help/product-guide";
import { SpecialistContactCard } from "@/components/reports/specialist-contact-card";
import { adminManagementAssetDetailSchema, adminManagementAssetListItemSchema, managementAssetDocumentSchema, leadCompanySchema } from "@/lib/contracts";
import { getManagementAssetTemplate } from "@/lib/data/management-asset-templates";
import { legacySopContentToRichText } from "@/lib/data/rich-text";

export const organizationId = "00000000-0000-4000-8000-000000000002";
export const companyId = `company_${organizationId}`;
export const assetId = "00000000-0000-4000-8000-000000000003";
const date = "2026-10-26T12:00:00Z";
const content = legacySopContentToRichText(getManagementAssetTemplate("estrutura-raci")!.content);
const version = { id: "00000000-0000-4000-8000-000000000004", versionNumber: "1", status: "rascunho", content, changeNote: null, createdAt: date, updatedAt: date, reviewedAt: null, publishedAt: null, indexStatus: "pendente", indexError: null };
export const editorAsset = adminManagementAssetDetailSchema.parse({ id: assetId, organizationId, organizationName: "Empresa fictícia C2", type: "raci", title: "Matriz de responsabilidades C2", summary: "Responsabilidades do processo de teste", category: "Governança", ownerLabel: "Operações", reviewCycle: "Mensal", specialistId: "specialist_original", status: "rascunho", archivedAt: null, updatedAt: date, revision: { assetUpdatedAt: date, draftId: version.id, draftUpdatedAt: date }, draft: version, published: null, versions: [version], chunkCount: 0, embeddedChunkCount: 0 });
const assets = [
  adminManagementAssetListItemSchema.parse({ id: assetId, organizationId, organizationName: "Empresa fictícia C2", type: "raci", title: "Matriz de responsabilidades C2", category: "Governança", status: "publicado", draftStatus: null, publishedVersionNumber: "1", specialistId: "specialist_original", ownerLabel: "Operações", reviewCycle: "Mensal", review: { status: "vencida", nextReviewDate: "2026-10-01" }, updatedAt: date }),
  adminManagementAssetListItemSchema.parse({ id: "00000000-0000-4000-8000-000000000005", organizationId, organizationName: "Empresa fictícia C2", type: "sop", title: "SOP sem periodicidade", category: "Processos", status: "publicado", draftStatus: null, publishedVersionNumber: "1", specialistId: null, ownerLabel: null, reviewCycle: null, review: { status: "sem_periodicidade", nextReviewDate: null }, updatedAt: date }),
];
const publishedAsset = managementAssetDocumentSchema.parse({ ...assets[0], title: "SOP de teste C2", type: "sop", summary: "Orientação publicada para conferência", author: { name: "Consultora original", role: "Consultora" }, versionId: version.id, versionNumber: "1", publishedAt: date, operationalOwner: "Operações", lastEditedBy: "Consultora original", reviewCycle: "Mensal", content });
const company = leadCompanySchema.parse({ id: companyId, organizationId, name: "Empresa fictícia C2", companySize: "25 pessoas", leadCount: 1, moduleNames: [], sources: [], firstLeadAt: date, lastLeadAt: date });
const subscribe = () => () => {};
export function CycleTwoWorkspace() {
  const params = useSearchParams();
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const view = params.get("view");
  return <main data-hydrated={hydrated} className="min-h-screen bg-background p-8 text-foreground">
    <p className="mb-6 text-xs text-muted-foreground">Fixture C2 · dados fictícios · APIs interceptadas · sem persistência ou envio real</p>
    <div data-slot="app-topbar-actions" className="mb-6 flex justify-end gap-2" />
    {view === "assets" ? <ManagementAssetsWorkspace embedded assets={assets} company={{ id: companyId, name: company.name, organizationId }} specialists={[]} templates={[]} />
      : view === "editor" ? <ManagementAssetEditorWorkspace embedded initialAsset={editorAsset} specialists={[]} />
      : view === "reader" ? <ManagementAssetEditableReader asset={publishedAsset} canEdit={false} />
      : view === "chat" ? <AiChatWorkspace user={{ id: "fixture", name: "Pessoa de teste" }} />
      : view === "guide" ? <ProductGuide audience={params.get("audience") === "customer" ? "customer" : "operation"} />
      : <><AdminCompanyDetail context={{ company, modules: [], operations: { assignment: { specialistId: "specialist_original", updatedAt: date }, deliveries: [{ id: "00000000-0000-4000-8000-000000000006", diagnosticName: "Diagnóstico encerrado de teste", closedAt: date, status: "publicada", specialistId: "specialist_original", responseCount: 20, canAnalyze: true }] } }} /><div className="mt-8 max-w-sm"><SpecialistContactCard specialist={{ name: "Consultora original", email: "original@example.invalid", title: "Consultora da publicação", location: "São Paulo", avatarUrl: null }} /></div></>}
  </main>;
}
