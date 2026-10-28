"use client";

import { useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { PublicResponseForm } from "@/components/omdx/public-response-form";
import { OmdxReportView } from "@/components/reports/omdx-report-view";
import { diagnosticResponseWorkspaceSchema } from "@/lib/contracts";
import { getRespondentGroups } from "@/lib/data/omdx-domain";
import { AnalyticsOverview } from "@/components/omdx/analytics/analytics-overview";
import { DeliveryDraftProvider } from "@/components/admin/delivery/delivery-draft-provider";
import { DeliveryShell } from "@/components/admin/delivery/delivery-shell";
import { DeliveryReportStep } from "@/components/admin/delivery/delivery-report-step";
import { DeliveryPublishStep } from "@/components/admin/delivery/delivery-publish-step";
import { DeliveryActionPointsStep } from "@/components/admin/delivery/delivery-action-points-step";
import { buildInitialReport } from "@/components/admin/delivery/delivery-draft";
import { buildAnalyticsExampleReports } from "@/lib/data/analytics-example";
import { buildOmdxOverviewComparisonFromReports } from "@/lib/data/omdx-overview-analytics";
import { selectCollectionForOverview } from "@/lib/data/collection-comparison";
import { getAdminDeliveryAnalysisFromReport, mapAdminDeliveryFromReport, adminActionPointTemplates } from "@/lib/data/admin-operations-data-source";
import { ActionPointsPeopleView } from "@/components/action-points/action-points-people-view";
import { buildPublishedActionPointsBoard } from "@/lib/data/published-action-points-board";
import type { AdminDeliveryPublication } from "@/lib/contracts/admin-operations";
import type { GanttWorkspaceData } from "@/lib/contracts";

const reports = buildAnalyticsExampleReports();
const report = reports[1];
const delivery = { ...mapAdminDeliveryFromReport(report), specialistId: "specialist_fixture", status: "publicada" as const };
const publication: AdminDeliveryPublication = {
 diagnosticId: delivery.id, organizationId: report.diagnostic.organizationId,
 specialistId: "specialist_fixture", status: "publicada",
 report: buildInitialReport("Empresa fictícia C1"), dimensionReadings: {},
 selectedActionPointIds: [adminActionPointTemplates[0].id],
 publishedAt: "2026-10-24T12:00:00Z", updatedAt: "2026-10-24T12:00:00Z",
};
const respondent = diagnosticResponseWorkspaceSchema.parse({ token: "c1-fake-token", diagnostic: { ...report.diagnostic, status: "ativo", closedAt: null }, group: getRespondentGroups()[2], expiresAt: null, template: { id: "omdx-v1", name: "Pesquisa fictícia C1", description: "Validação do aviso", dimensions: report.dimensions.map(d => d.id), scale: ["Discordo totalmente", "Discordo parcialmente", "Nem concordo nem discordo", "Concordo parcialmente", "Concordo totalmente"].map((label, i) => ({ value: i + 1, label })) }, dimensions: report.dimensions.map(d => ({ ...d, questions: d.questions.map((q, i) => ({ ...q, orderIndex: i + 1 })) })) });
const workspace: GanttWorkspaceData = {
 source: { diagnosticId: report.diagnostic.id, diagnosticName: report.diagnostic.name, company: "Empresa fictícia C1", generatedAt: "2026-10-24T12:00:00Z" },
 tasks: [{ id: "root", title: "Ações", owner: "", blocker: "", status: "planejado", progress: 0, start: "2026-10-24", end: "2026-11-24", subitems: [{ id: adminActionPointTemplates[0].id, title: adminActionPointTemplates[0].title, owner: "", blocker: "", status: "planejado", progress: 0, start: "2026-10-24", end: "2026-11-24", actionPoint: { dimensionId: "processos", dimensionName: "Processos", problem: "Leitura confirmada da coleta fictícia", recommendedAction: adminActionPointTemplates[0].description, owner: "Liderança", involved: [], suggestedDeadline: adminActionPointTemplates[0].deadline, expectedImpact: "Previsibilidade", successIndicator: "Processos documentados", priority: "Alta", score: 3, gap: null } }] }],
};

const subscribe = () => () => {};

export function CycleOneWorkspace() {
 const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
 const params = useSearchParams();
 const [step, setStep] = useState("editor");
 const current = selectCollectionForOverview(reports, params.get("diagnostico") ?? undefined)!;
 const comparison = buildOmdxOverviewComparisonFromReports(reports, current.diagnostic.id);
 const view = params.get("view");
 return <main data-hydrated={hydrated} className="min-h-screen bg-background p-8 text-foreground">
  <p className="mb-5 text-xs text-muted-foreground">Verificação local com dados fictícios · APIs interceptadas nos testes · não comprova operação</p>
  {view === "analytics" ? <AnalyticsOverview {...comparison} diagnosticOptions={reports.map(item => item.diagnostic)} selectedDiagnostic={current.diagnostic.id} processUsage={null} />
   : view === "response" ? <PublicResponseForm questionOrderSeed="c1-fixture" workspace={respondent} />
   : view === "report" ? <div className="mx-auto max-w-3xl"><OmdxReportView report={report} editorial={publication.report} /></div>
   : view === "actions" ? <ActionPointsPeopleView board={buildPublishedActionPointsBoard(workspace, [])} />
   : <><div data-slot="app-topbar-actions" className="mb-6 flex justify-end" /><nav aria-label="Controles da fixture" className="mb-6 flex gap-6"><button onClick={() => setStep("editor")}>Fixture: editor</button><button onClick={() => setStep("preview")}>Fixture: prévia</button><button onClick={() => setStep("actions")}>Fixture: ações</button></nav>
   <DeliveryDraftProvider analysis={getAdminDeliveryAnalysisFromReport(report)} delivery={params.get("new") === "true" ? { ...delivery, status: "em_analise" } : delivery} deliveryOptions={[{ id: delivery.id, diagnosticName: delivery.diagnosticName, closedAt: delivery.closedAt }]} publication={params.get("new") === "true" ? null : publication}>
    <DeliveryShell>{step === "preview" ? <DeliveryPublishStep /> : step === "actions" ? <DeliveryActionPointsStep /> : <DeliveryReportStep />}</DeliveryShell>
   </DeliveryDraftProvider></>}
 </main>;
}
