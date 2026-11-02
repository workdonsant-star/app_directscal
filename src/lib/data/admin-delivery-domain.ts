import { adminActionPointTemplateSchema, adminDeliverySchema, type AdminActionPointTemplate, type AdminDelivery } from "@/lib/contracts/admin-operations";
import type { DiagnosticReport, DimensionId, DimensionQuestionResult, RespondentGroup } from "@/lib/contracts/omdx";
import { classifyScore } from "@/lib/data/omdx-domain";
import { buildOmdxOverviewAnalyticsFromReports, type OverviewAnalytics } from "@/lib/data/omdx-overview-analytics";

function getLayerGap(scores: Record<RespondentGroup, number | null>) {
  const values = Object.values(scores).filter((value): value is number => value !== null);
  return values.length < 2 ? 0 : Math.round((Math.max(...values) - Math.min(...values)) * 10) / 10;
}

export const adminActionPointTemplates: AdminActionPointTemplate[] = [
  {
    id: "action_processos_ritual",
    dimensionId: "processos",
    dimension: "Processos",
    title: "Mapear os processos críticos da operação",
    description:
      "Formalizar entradas, etapas, critérios de qualidade e responsáveis dos processos que mais afetam previsibilidade.",
    owner: "Liderança",
    involved: "Responsáveis das áreas envolvidas",
    deadline: "45 dias",
    expectedImpact: "Reduzir variação de execução e dependência individual.",
    successIndicator: "Processos prioritários documentados e validados em operação.",
    priority: "Alta",
  },
  {
    id: "action_comunicacao_canais",
    dimensionId: "comunicacao",
    dimension: "Comunicação",
    title: "Definir o sistema de comunicação operacional",
    description:
      "Determinar quais informações circulam, em quais canais são registradas e quem mantém cada atualização.",
    owner: "Liderança",
    involved: "Líderes e responsáveis por rotinas críticas",
    deadline: "30 dias",
    expectedImpact: "Diminuir perda de contexto e alinhamentos repetidos.",
    successIndicator: "Canais e critérios publicados e usados nas rotinas de gestão.",
    priority: "Alta",
  },
  {
    id: "action_lideranca_autonomia",
    dimensionId: "lideranca",
    dimension: "Liderança",
    title: "Formalizar limites de autonomia",
    description:
      "Definir decisões que permanecem com cada papel e os critérios objetivos para escalonamento.",
    owner: "Fundador",
    involved: "Lideranças de área",
    deadline: "30 dias",
    expectedImpact: "Reduzir decisões concentradas e acelerar a resolução operacional.",
    successIndicator: "Matriz de decisões aplicada pelas lideranças por quatro semanas.",
    priority: "Alta",
  },
  {
    id: "action_performance_indicadores",
    dimensionId: "performance",
    dimension: "Performance",
    title: "Consolidar indicadores de gestão",
    description:
      "Selecionar indicadores essenciais, responsáveis, metas e frequência de atualização.",
    owner: "Liderança",
    involved: "Gestores e responsáveis pelos dados",
    deadline: "60 dias",
    expectedImpact: "Criar uma leitura comum de desempenho e desvios.",
    successIndicator: "Painel atualizado em duas cadências executivas consecutivas.",
    priority: "Média",
  },
  {
    id: "action_visao_desdobramento",
    dimensionId: "visao",
    dimension: "Visão",
    title: "Desdobrar prioridades estratégicas",
    description:
      "Conectar prioridades da empresa a objetivos de área, responsáveis e entregas observáveis.",
    owner: "Fundador",
    involved: "Lideranças de área",
    deadline: "45 dias",
    expectedImpact: "Aumentar clareza sobre prioridades e reduzir iniciativas concorrentes.",
    successIndicator: "Objetivos de área revisados e comunicados à operação.",
    priority: "Média",
  },
  {
    id: "action_cultura_criterios",
    dimensionId: "cultura",
    dimension: "Cultura",
    title: "Transformar valores em critérios de decisão",
    description:
      "Traduzir princípios culturais em comportamentos e critérios aplicáveis às decisões recorrentes.",
    owner: "Fundador",
    involved: "Lideranças e operação",
    deadline: "60 dias",
    expectedImpact: "Aumentar consistência entre discurso, decisões e execução.",
    successIndicator: "Critérios usados em rituais, feedbacks e decisões de prioridade.",
    priority: "Baixa",
  },
].map((actionPoint) => adminActionPointTemplateSchema.parse(actionPoint));

export type AdminDeliveryDimensionAnalysis = {
  classification: ReturnType<typeof classifyScore>;
  description: string;
  gap: number;
  id: DimensionId;
  layerScores: Record<RespondentGroup, number | null>;
  name: string;
  question: string;
  questions: DimensionQuestionResult[];
  score: number;
  shortName: string;
};

export type AdminDeliveryAnalysis = {
  analytics: OverviewAnalytics;
  dimensions: AdminDeliveryDimensionAnalysis[];
};

export function mapAdminDeliveryFromReport(
  report: DiagnosticReport,
): AdminDelivery {
  const closedAt = report.diagnostic.closedAt ?? report.diagnostic.updatedAt;
  const dueAt = new Date(closedAt);
  dueAt.setUTCDate(dueAt.getUTCDate() + 10);

  return adminDeliverySchema.parse({
    id: report.diagnostic.id,
    diagnosticId: report.diagnostic.id,
    diagnosticName: report.diagnostic.name,
    companyId: report.diagnostic.organizationId,
    companyName: report.diagnostic.organizationName,
    specialistId: null,
    status: "sem_especialista",
    responseCount: report.responses.total,
    closedAt,
    dueAt: dueAt.toISOString(),
    generalScore: report.generalScore,
    scores: report.dimensions.map((dimension) => ({
      dimension: dimension.shortName,
      score: dimension.score,
    })),
  });
}

export function getAdminDeliveryAnalysisFromReport(
  report: DiagnosticReport,
): AdminDeliveryAnalysis {

  return {
    analytics: buildOmdxOverviewAnalyticsFromReports([report]),
    dimensions: report.dimensions.map((dimension) => ({
      classification: dimension.classification,
      description: dimension.description,
      gap: dimension.misalignment?.value ?? 0,
      id: dimension.id,
      layerScores: dimension.layerScores,
      name: dimension.name,
      question: dimension.question,
      questions: dimension.questions.map((question) => ({
        id: question.id,
        dimensionId: question.dimensionId,
        text: question.text,
        score: question.score,
        layerScores: question.layerScores,
        gap: getLayerGap(question.layerScores),
        responses: question.responses,
        classification: classifyScore(question.score),
        priorityIndex: Math.round(((5 - question.score) / 4) * 100),
      })),
      score: dimension.score,
      shortName: dimension.shortName,
    })),
  };
}
