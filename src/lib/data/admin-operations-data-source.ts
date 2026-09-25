import {
  adminActionPointTemplateSchema,
  adminDeliverySchema,
  adminSpecialistSchema,
  type AdminActionPointTemplate,
  type AdminDelivery,
  type AdminSpecialist,
} from "@/lib/contracts/admin-operations";
import type {
  DiagnosticReport,
  DimensionId,
  DimensionQuestionResult,
  RespondentGroup,
} from "@/lib/contracts/omdx";
import { classifyScore } from "@/lib/data/omdx-domain";
import {
  buildOmdxOverviewAnalyticsFromReports,
  type OverviewAnalytics,
} from "@/lib/data/omdx-overview-analytics";
import { dimensions } from "@/lib/mock-data";

export const adminSpecialists: AdminSpecialist[] = [
  {
    id: "specialist_don",
    name: "Don Santos",
    email: "don.santos@directscal.com",
    title: "Especialista em estruturação",
    location: "São Paulo, SP",
    status: "ativo",
    companyCount: 3,
    activeDeliveryCount: 2,
    createdAt: "2026-02-12T13:00:00.000Z",
  },
  {
    id: "specialist_mariana",
    name: "Mariana Costa",
    email: "mariana.costa@directscal.com",
    title: "Especialista em gestão operacional",
    location: "Florianópolis, SC",
    status: "ativo",
    companyCount: 2,
    activeDeliveryCount: 1,
    createdAt: "2026-04-08T13:00:00.000Z",
  },
  {
    id: "specialist_rafael",
    name: "Rafael Nunes",
    email: "rafael.nunes@directscal.com",
    title: "Especialista em performance",
    location: "Belo Horizonte, MG",
    status: "ativo",
    companyCount: 1,
    activeDeliveryCount: 1,
    createdAt: "2026-05-19T13:00:00.000Z",
  },
  {
    id: "specialist_elisa",
    name: "Elisa Rocha",
    email: "elisa.rocha@directscal.com",
    title: "Especialista em processos",
    location: "Curitiba, PR",
    status: "inativo",
    companyCount: 0,
    activeDeliveryCount: 0,
    createdAt: "2026-01-21T13:00:00.000Z",
  },
].map((specialist) => adminSpecialistSchema.parse(specialist));

export const adminDeliveries: AdminDelivery[] = [
  {
    id: "delivery_don_q3",
    diagnosticId: "diagnostic_don_q3",
    diagnosticName: "Diagnóstico de maturidade Q3",
    companyId: "company_don",
    companyName: "DOn",
    specialistId: "specialist_don",
    status: "em_analise",
    responseCount: 38,
    closedAt: "2026-08-29T14:00:00.000Z",
    dueAt: "2026-09-08T14:00:00.000Z",
    generalScore: 2.8,
    scores: [
      { dimension: "Cultura", score: 3.2 },
      { dimension: "Visão", score: 3.5 },
      { dimension: "Comunicação", score: 2.6 },
      { dimension: "Processos", score: 2.1 },
      { dimension: "Liderança", score: 2.7 },
      { dimension: "Performance", score: 2.8 },
    ],
  },
  {
    id: "delivery_shipping_q2",
    diagnosticId: "diagnostic_shipping_q2",
    diagnosticName: "Diagnóstico de maturidade Q2",
    companyId: "company_shipping-caps",
    companyName: "Shipping Caps",
    specialistId: "specialist_mariana",
    status: "pronta_para_publicar",
    responseCount: 24,
    closedAt: "2026-08-26T14:00:00.000Z",
    dueAt: "2026-09-05T14:00:00.000Z",
    generalScore: 3.4,
    scores: [
      { dimension: "Cultura", score: 3.7 },
      { dimension: "Visão", score: 3.8 },
      { dimension: "Comunicação", score: 3.3 },
      { dimension: "Processos", score: 2.9 },
      { dimension: "Liderança", score: 3.4 },
      { dimension: "Performance", score: 3.2 },
    ],
  },
  {
    id: "delivery_shipping_q1",
    diagnosticId: "diagnostic_shipping_q1",
    diagnosticName: "Diagnóstico de maturidade Q1",
    companyId: "company_shipping-caps",
    companyName: "Shipping Caps",
    specialistId: "specialist_mariana",
    status: "publicada",
    responseCount: 21,
    closedAt: "2026-05-20T14:00:00.000Z",
    dueAt: "2026-05-30T14:00:00.000Z",
    generalScore: 3.0,
    scores: [
      { dimension: "Cultura", score: 3.3 },
      { dimension: "Visão", score: 3.4 },
      { dimension: "Comunicação", score: 2.9 },
      { dimension: "Processos", score: 2.5 },
      { dimension: "Liderança", score: 3.0 },
      { dimension: "Performance", score: 2.9 },
    ],
  },
  {
    id: "delivery_headcore_q3",
    diagnosticId: "diagnostic_headcore_q3",
    diagnosticName: "Diagnóstico de maturidade Q3",
    companyId: "company_headcore",
    companyName: "Headcore",
    specialistId: "specialist_rafael",
    status: "aguardando_analise",
    responseCount: 47,
    closedAt: "2026-09-01T14:00:00.000Z",
    dueAt: "2026-09-11T14:00:00.000Z",
    generalScore: 3.1,
    scores: [
      { dimension: "Cultura", score: 3.4 },
      { dimension: "Visão", score: 3.6 },
      { dimension: "Comunicação", score: 3.0 },
      { dimension: "Processos", score: 2.5 },
      { dimension: "Liderança", score: 3.1 },
      { dimension: "Performance", score: 3.0 },
    ],
  },
  {
    id: "delivery_beto_q3",
    diagnosticId: "diagnostic_beto_q3",
    diagnosticName: "Diagnóstico de maturidade Q3",
    companyId: "company_beto-sa",
    companyName: "Beto SA",
    specialistId: null,
    status: "sem_especialista",
    responseCount: 19,
    closedAt: "2026-09-02T14:00:00.000Z",
    dueAt: "2026-09-12T14:00:00.000Z",
    generalScore: 2.6,
    scores: [
      { dimension: "Cultura", score: 2.9 },
      { dimension: "Visão", score: 3.1 },
      { dimension: "Comunicação", score: 2.4 },
      { dimension: "Processos", score: 2.0 },
      { dimension: "Liderança", score: 2.5 },
      { dimension: "Performance", score: 2.7 },
    ],
  },
  {
    id: "delivery_fahto_q2",
    diagnosticId: "diagnostic_fahto_q2",
    diagnosticName: "Diagnóstico de maturidade Q2",
    companyId: "company_fahto-media",
    companyName: "Fahto Media",
    specialistId: "specialist_don",
    status: "publicada",
    responseCount: 31,
    closedAt: "2026-08-12T14:00:00.000Z",
    dueAt: "2026-08-22T14:00:00.000Z",
    generalScore: 3.6,
    scores: [
      { dimension: "Cultura", score: 3.9 },
      { dimension: "Visão", score: 4.0 },
      { dimension: "Comunicação", score: 3.4 },
      { dimension: "Processos", score: 3.1 },
      { dimension: "Liderança", score: 3.7 },
      { dimension: "Performance", score: 3.5 },
    ],
  },
].map((delivery) => adminDeliverySchema.parse(delivery));

export const adminActionPointTemplates: AdminActionPointTemplate[] = [
  {
    id: "action_processos_ritual",
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

function normalizeCompanyName(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function getAdminSpecialist(specialistId: string | null) {
  if (!specialistId) return null;
  return adminSpecialists.find((item) => item.id === specialistId) ?? null;
}

export function getAdminDelivery(deliveryId: string) {
  return adminDeliveries.find((item) => item.id === deliveryId) ?? null;
}

export function getAdminCompanyDeliveries(companyName: string) {
  const normalizedName = normalizeCompanyName(companyName);
  return adminDeliveries.filter(
    (delivery) => normalizeCompanyName(delivery.companyName) === normalizedName,
  );
}

export function getAdminCompanyOperationsPreview(companyName: string) {
  const deliveries = getAdminCompanyDeliveries(companyName);
  const currentDelivery = deliveries.find(
    (delivery) => delivery.status !== "publicada",
  );
  const specialist = getAdminSpecialist(
    currentDelivery?.specialistId ?? deliveries[0]?.specialistId ?? null,
  );

  return {
    deliveries,
    specialist,
    pendingDeliveryCount: deliveries.filter(
      (delivery) => delivery.status !== "publicada",
    ).length,
  };
}

const adminDeliveryQuestionBank: Record<DimensionId, string[]> = {
  cultura: [
    "Problemas relevantes podem ser levantados sem custo político.",
    "O time consegue discordar de decisões quando identifica risco operacional.",
    "Erros recorrentes são tratados como aprendizado, não como culpa individual.",
    "Feedbacks geram mudanças observáveis de comportamento e execução.",
    "As pessoas pedem ajuda antes que o problema vire urgência.",
  ],
  visao: [
    "A direção comunica prioridades de forma clara para todos os níveis.",
    "Cada área entende como seu trabalho contribui para os objetivos da empresa.",
    "As metas de curto prazo estão conectadas à visão de médio prazo.",
    "Mudanças de prioridade são explicadas com contexto suficiente.",
    "O time decide sem depender de alinhamentos excessivos.",
  ],
  comunicacao: [
    "As informações necessárias chegam a tempo para decisão e execução.",
    "Reuniões têm pauta, decisão registrada e próximo passo definido.",
    "Áreas diferentes se alinham sem depender de conversas informais.",
    "Os responsáveis por decisões importantes são claros para o time.",
    "Bloqueios de comunicação são tratados antes de impactar a entrega.",
  ],
  processos: [
    "Os processos críticos estão documentados em nível útil para execução.",
    "A operação repete entregas sem depender de improviso.",
    "Gargalos são identificados com dados e tratados de forma recorrente.",
    "Ferramentas e rituais sustentam o trabalho sem criar burocracia excessiva.",
    "A empresa reduz a dependência de pessoas-chave nos fluxos principais.",
  ],
  lideranca: [
    "A liderança delega com contexto, critério de sucesso e autonomia.",
    "Gestores acompanham a execução sem centralizar todas as decisões.",
    "O time recebe suporte antes que problemas de execução escalem.",
    "Responsabilidades entre liderança e operação são claras no dia a dia.",
    "Líderes desenvolvem a capacidade do time, não apenas cobram entrega.",
  ],
  performance: [
    "Métricas de sucesso são conhecidas por quem executa o trabalho.",
    "Prioridades são protegidas quando surgem demandas paralelas.",
    "A empresa acompanha resultados com cadência suficiente para corrigir rota.",
    "Reconhecimento e cobrança estão conectados a entregas objetivas.",
    "O foco operacional é preservado nos ciclos de maior pressão.",
  ],
};

const questionOffsets = [-0.28, -0.12, 0.04, 0.18, 0.1] as const;

function clampScore(value: number) {
  return Math.min(5, Math.max(1, Number(value.toFixed(1))));
}

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function getLayerScores(score: number, dimensionIndex: number) {
  const dimensionShift = ((dimensionIndex % 3) - 1) * 0.08;

  return {
    fundador: clampScore(score + 0.34 + dimensionShift),
    lideranca: clampScore(score + 0.04 - dimensionShift / 2),
    operacao: clampScore(score - 0.24 - dimensionShift),
  };
}

function getLayerGap(
  layerScores: Record<RespondentGroup, number | null>,
) {
  const values = Object.values(layerScores).filter(
    (value): value is number => value !== null,
  );

  if (values.length < 2) return 0;

  return round(Math.max(...values) - Math.min(...values));
}

function getLayerExtremes(layerScores: Record<RespondentGroup, number>) {
  const entries = Object.entries(layerScores) as Array<[RespondentGroup, number]>;
  const ordered = [...entries].sort((first, second) => second[1] - first[1]);

  return {
    highestGroup: ordered[0]?.[0] ?? "fundador",
    lowestGroup: ordered.at(-1)?.[0] ?? "operacao",
  };
}

export function buildAdminDeliveryReport(
  delivery: AdminDelivery,
): DiagnosticReport {
  const responseGroups = {
    fundador: Math.min(2, delivery.responseCount),
    lideranca: Math.min(
      Math.max(Math.round(delivery.responseCount * 0.25), 1),
      Math.max(delivery.responseCount - 2, 1),
    ),
  };
  const responses = {
    total: delivery.responseCount,
    fundador: responseGroups.fundador,
    lideranca: responseGroups.lideranca,
    operacao: Math.max(
      delivery.responseCount - responseGroups.fundador - responseGroups.lideranca,
      0,
    ),
  };
  const reportDimensions = dimensions.map((dimension, dimensionIndex) => {
    const deliveryScore = delivery.scores.find(
      (item) => item.dimension === dimension.shortName,
    );
    const score = deliveryScore?.score ?? delivery.generalScore;
    const layerScores = getLayerScores(score, dimensionIndex);
    const gap = getLayerGap(layerScores);
    const extremes = getLayerExtremes(layerScores);
    const questions = adminDeliveryQuestionBank[dimension.id].map(
      (text, questionIndex) => {
        const offset = questionOffsets[questionIndex];
        const questionLayerScores = {
          fundador: clampScore(layerScores.fundador + offset + 0.04),
          lideranca: clampScore(layerScores.lideranca + offset),
          operacao: clampScore(layerScores.operacao + offset - 0.04),
        };
        const values = Object.values(questionLayerScores);
        const questionScore = round(
          values.reduce((total, value) => total + value, 0) / values.length,
        );

        return {
          id: `${delivery.id}_${dimension.id}_${questionIndex + 1}`,
          diagnosticId: delivery.diagnosticId,
          dimensionId: dimension.id,
          text,
          score: questionScore,
          variance: round(0.32 + Math.abs(offset) / 2, 2),
          responses: delivery.responseCount,
          layerScores: questionLayerScores,
        };
      },
    );

    return {
      ...dimension,
      score,
      classification: classifyScore(score),
      variance: round(0.38 + gap / 4, 2),
      responses: delivery.responseCount,
      layerScores,
      misalignment: {
        value: gap,
        ...extremes,
      },
      questions,
    };
  });
  const weakestDimension = [...reportDimensions].sort(
    (first, second) => first.score - second.score,
  )[0];
  const highestMisalignmentDimension = [...reportDimensions].sort(
    (first, second) =>
      (second.misalignment?.value ?? 0) - (first.misalignment?.value ?? 0),
  )[0];
  const layerAverages = (["fundador", "lideranca", "operacao"] as const).reduce(
    (result, group) => {
      result[group] = round(
        reportDimensions.reduce(
          (total, dimension) => total + dimension.layerScores[group],
          0,
        ) / reportDimensions.length,
      );
      return result;
    },
    { fundador: null, lideranca: null, operacao: null } as Record<
      RespondentGroup,
      number | null
    >,
  );

  return {
    diagnostic: {
      id: delivery.diagnosticId,
      organizationId: delivery.companyId,
      organizationName: delivery.companyName,
      company: delivery.companyName,
      name: delivery.diagnosticName,
      description: null,
      templateId: "omdx-v1",
      status: "encerrado",
      createdAt: delivery.closedAt,
      updatedAt: delivery.closedAt,
      activatedAt: delivery.closedAt,
      closedAt: delivery.closedAt,
      deadline: delivery.dueAt.slice(0, 10),
      responses,
      generalScore: delivery.generalScore,
    },
    generatedAt: delivery.closedAt,
    threshold: 3.5,
    generalScore: delivery.generalScore,
    classification: classifyScore(delivery.generalScore),
    responses,
    layerAverages,
    weakestDimension: {
      id: weakestDimension.id,
      name: weakestDimension.name,
      shortName: weakestDimension.shortName,
      score: weakestDimension.score,
      classification: weakestDimension.classification,
    },
    highestMisalignment: highestMisalignmentDimension
      ? {
          dimensionId: highestMisalignmentDimension.id,
          dimensionName: highestMisalignmentDimension.name,
          value: highestMisalignmentDimension.misalignment.value,
          highestGroup: highestMisalignmentDimension.misalignment.highestGroup,
          lowestGroup: highestMisalignmentDimension.misalignment.lowestGroup,
        }
      : null,
    dimensions: reportDimensions,
  };
}

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

export function getAdminDeliveryAnalysis(
  delivery: AdminDelivery,
): AdminDeliveryAnalysis {
  return getAdminDeliveryAnalysisFromReport(buildAdminDeliveryReport(delivery));
}

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
