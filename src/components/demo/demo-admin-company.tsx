"use client";

import { ManagementAssetsWorkspace } from "@/components/admin/management-assets-workspace";
import { CompanyFilesWorkspace } from "@/components/admin/company-files-workspace";
import { ManagementAssetEditorWorkspace } from "@/components/admin/management-asset-editor-workspace";
import { AssetQuestionAuditsWorkspace } from "@/components/admin/asset-question-audits-workspace";
import { AdminRoutinesWorkspace } from "@/components/admin/routines/admin-routines-workspace";
import { demoAdminAssetList, demoAdminAssetId, getDemoAdminAssets, DEMO_ADMIN_ORGANIZATION_ID } from "@/lib/data/demo/demo-admin-assets";
import { demoAdminSpecialists } from "@/lib/data/demo/demo-admin-data";
import { demoContactPolicy, demoRoutineWorkspace } from "@/lib/data/demo/demo-admin-routines";
import { demoFolders } from "@/lib/data/demo/demo-workspaces";
import { DEMO_COMPANY, DEMO_DATE } from "@/lib/data/demo/demo-data";
import { useDemo } from "./demo-store";
import { DemoAdminActionPoints } from "./demo-admin-action-points";
import { AppTopbar } from "@/components/app-topbar";
import { AppPage } from "@/components/app-page";

export function DemoAdminCompany({ section, assetId, deliveryId }: { section: "assets" | "questions" | "routines" | "action-points"; assetId?: string; deliveryId?: string }) {
  const { state } = useDemo();
  const company = { id: "demo-vertex", name: DEMO_COMPANY, organizationId: DEMO_ADMIN_ORGANIZATION_ID };
  const specialists = (state.adminSpecialists ?? demoAdminSpecialists).filter(item => item.status === "ativo" && !item.archived);
  if (state.deletedCompanyIds?.includes(company.id)) return <><AppTopbar /><AppPage>Empresa não encontrada.</AppPage></>;
  if (section === "action-points") return <DemoAdminActionPoints company={company} />;
  if (section === "routines") return <AdminRoutinesWorkspace initial={demoRoutineWorkspace(state)} initialPolicy={demoContactPolicy(state)} initialBaselines={state.adminBaselines ?? []} checkedAt={DEMO_DATE} />;
  if (section === "questions") {
    const audits = state.messages.flatMap((message, index) => message.role === "assistant" ? [{ id: `00000000-0000-4000-9000-${String(index).padStart(12, "0")}`, organizationName: DEMO_COMPANY, channel: "app" as const, question: state.messages[index - 1]?.text ?? "Consulta", answer: message.text, status: message.assetId ? "respondida" as const : "insuficiente" as const, sourceTitles: getDemoAdminAssets(state).filter(asset => asset.id === demoAdminAssetId(message.assetId ?? "")).map(asset => asset.title), feedback: null, feedbackComment: null, provider: null, latencyMs: null, createdAt: DEMO_DATE }] : []);
    return <AssetQuestionAuditsWorkspace embedded={Boolean(deliveryId)} audits={audits} company={company} operations={{ operators: [{ id: "00000000-0000-4000-8000-000000000099", name: "Admin Directscal" }], reviews: state.adminGapReviews ?? [], health: { capturedAt: DEMO_DATE, slackFailures: 0, slackUncertain: 0, slackOverdue: 0, queries30Days: audits.length, queryErrors30Days: 0 } }} />;
  }
  if (assetId) {
    const asset = getDemoAdminAssets(state).find(asset => asset.id === demoAdminAssetId(assetId));
    return asset ? <ManagementAssetEditorWorkspace key={assetId} companyId={company.id} initialAsset={asset} specialists={specialists} embedded={Boolean(deliveryId)} deliveryId={deliveryId} /> : <><AppTopbar /><AppPage>Ativo não encontrado.</AppPage></>;
  }
  const folders = demoFolders(state);
  if (!deliveryId) return <CompanyFilesWorkspace company={company} assets={demoAdminAssetList(state)} documents={state.uploadedDocuments ?? []} folders={folders} showActionPoints actionsInTabs />;
  return <ManagementAssetsWorkspace assets={demoAdminAssetList(state)} company={company} specialists={specialists} categories={folders.filter(folder => folder.title !== "Sem categoria").map(folder => folder.title)} embedded deliveryId={deliveryId} />;
}
