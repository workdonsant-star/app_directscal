import { diagnosticSchema, diagnosticTemplateSchema, diagnosticResponseWorkspaceSchema, dimensionInsightSummarySchema, dimensionQuestionResultSchema, organizationSectorSchema, profileSettingsDataSchema, type DiagnosticShareLink, type DimensionId } from "@/lib/contracts";
import { demoAssets, demoPeople, demoReport, demoReports, DEMO_DATE } from "./demo-data";
import type { DemoState } from "./demo-state";
import { classifyScore, getRespondentGroups, suggestedMessages } from "@/lib/data/omdx-domain";
import { getManagementAssetCategoryFolders } from "@/lib/data/management-asset-categories";

export const demoUser = { id: "demo-marina", name: "Marina Alves", company: "Vertex Logistics", role: "cliente" as const, initials: "MA" };
export const demoSectors = demoPeople.map((person, index) => organizationSectorSchema.parse({ id: `demo-sector-${index}`, name: person.sector, active: true, leader: { accessLevel: "admin", id: `demo-leader-${index}`, email: "", name: person.name, avatarUrl: null, position: "Líder de área", slackUserId: `UDEMO${index}`, slackTeamId: "TDEMO" }, inviteStatus: "ativo", lastInviteSentAt: null, createdAt: DEMO_DATE }));
export const demoProfile = profileSettingsDataSchema.parse({ ...demoUser, email: "marina@vertex.example", organizationId: "demo-vertex", avatarUrl: null, employeeCount: 27, createdAt: DEMO_DATE, updatedAt: DEMO_DATE, profilePersisted: true, companyDetails: { socialName: "Vertex Logistics", officialName: "Vertex Operações Logísticas", cnpj: null, registrationStatus: null, activityStartedAt: null, cnaeCode: null, cnaeDescription: null, legalNature: null, registrySize: null, registeredAddress: null, city: "São Paulo", state: "SP", position: "Diretor", industry: "Logística", instagram: null, website: null, companySize: "11-50 pessoas", lastQuarterRevenue: "R$ 1 milhão a R$ 2 milhões", challenges: "Dar previsibilidade à operação e clareza às responsabilidades." } });
export const demoTemplate = diagnosticTemplateSchema.parse({ id: "omdx-v1", name: "Maturidade", description: "Diagnóstico de maturidade operacional", dimensions: demoReport.dimensions.map(d => d.id), scale: ["Discordo totalmente", "Discordo parcialmente", "Nem concordo nem discordo", "Concordo parcialmente", "Concordo totalmente"].map((label, i) => ({ value: i + 1, label })) });
export function demoDiagnostics(state: DemoState) {
 return state.surveys.map(survey => {
  const historical = demoReports.find(report => report.diagnostic.id === survey.id)?.diagnostic;
  return diagnosticSchema.parse({ ...demoReport.diagnostic, ...historical, id: survey.id, organizationId: "demo-vertex", name: survey.name, description: survey.description ?? null, deadline: survey.deadline ?? null, status: survey.status, closedAt: survey.status === "encerrado" ? historical?.closedAt ?? DEMO_DATE : null, generalScore: historical?.generalScore ?? null, responses: historical?.responses ?? { total: survey.responses, fundador: Math.min(1, survey.responses), lideranca: Math.min(3, Math.max(0, survey.responses - 1)), operacao: Math.max(0, survey.responses - 4) }, creator: { userId: demoUser.id, name: demoUser.name, avatarUrl: null, role: "cliente" }, sectors: demoSectors.filter(s => !survey.leaderIds || survey.leaderIds.includes(s.leader.id)).map(s => ({ id: s.id, name: s.name, leaderIds: [s.leader.id] })), permissions: { canManage: true, canViewFounderLink: true, canViewAllTeamLinks: true } });
 });
}
export function demoShareLinks(state: DemoState, origin = "https://directscal-demo.vercel.app") {
 return Object.fromEntries(demoDiagnostics(state).map(diagnostic => [diagnostic.id, getRespondentGroups().flatMap(group => (group.id === "operacao" ? diagnostic.sectors ?? [] : [null]).map(sector => {
  const token = `${diagnostic.id}~${group.id}${sector ? `~${sector.id}` : ""}`;
  const publicUrl = `${origin}/demo/r/${token}`;
  return { id: token, diagnosticId: diagnostic.id, group: group.id, sectorId: sector?.id ?? null, sectorName: sector?.name ?? null, token, publicUrl, previewPath: `/demo/r/${token}`, suggestedMessage: `${suggestedMessages[group.id]}\n${publicUrl}` } satisfies DiagnosticShareLink;
 }))]));
}
export function demoResponseWorkspace(state: DemoState, token: string) {
 const [id, groupId] = token.split("~");
 const diagnostic = demoDiagnostics(state).find(d => d.id === id);
 const group = getRespondentGroups().find(g => g.id === groupId);
 if (!diagnostic || !group) return null;
 return diagnosticResponseWorkspaceSchema.parse({ token, diagnostic, group, expiresAt: null, template: demoTemplate, dimensions: demoReport.dimensions.map(dimension => ({ ...dimension, questions: dimension.questions.map((q, i) => ({ id: q.id, dimensionId: q.dimensionId, text: q.text, orderIndex: i + 1 })) })) });
}
export function demoDimension(dimensionId: DimensionId, selected = "todos") {
 const reports = demoReports.filter(r => selected === "todos" || r.diagnostic.id === selected);
 const latest = reports.at(-1) ?? demoReport;
 const dimension = latest.dimensions.find(d => d.id === dimensionId)!;
 return {
  summary: dimensionInsightSummarySchema.parse({ dimensionId, filter: selected, totalResponses: reports.reduce((n, r) => n + r.responses.total, 0), averageScore: dimension.score, diagnosticsWithData: reports.length, variation: dimension.variance, layerScores: dimension.layerScores, trend: reports.map(r => { const d = r.dimensions.find(d => d.id === dimensionId)!; return { diagnosticId: r.diagnostic.id, diagnosticName: r.diagnostic.name, company: r.diagnostic.company, createdAt: r.diagnostic.createdAt, gap: d.misalignment?.value ?? null, responses: d.responses, score: d.score }; }) }),
  questionResults: dimension.questions.map(q => dimensionQuestionResultSchema.parse({ ...q, gap: Math.max(...Object.values(q.layerScores).filter((v): v is number => v !== null)) - Math.min(...Object.values(q.layerScores).filter((v): v is number => v !== null)), classification: classifyScore(q.score), priorityIndex: Math.round((5 - q.score) * 20) })),
 };
}
export function demoFolders(state: DemoState) { return getManagementAssetCategoryFolders(state.assets ?? demoAssets, state.navigation.categories); }
