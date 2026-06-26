import type {
  AcquisitionCampaign,
  AdminModule,
  Classification,
  Diagnostic,
  DiagnosticReportQuestion,
  DimensionInsightRecord,
  DimensionInsightSummary,
  DiagnosticTemplate,
  Dimension,
  DimensionId,
  Organization,
  Lead,
  RespondentGroup,
  RespondentGroupMeta,
  UserProfile,
} from "./types";

export const mockOrganizations: Organization[] = [
  {
    id: "org_directscal",
    name: "Directscal",
    employeeCount: 12,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "org_vertex",
    name: "Vertex Logistics",
    employeeCount: 84,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "org_lumen",
    name: "Lumen Health",
    employeeCount: 132,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "org_northbound",
    name: "Northbound Capital",
    employeeCount: 47,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "org_praca",
    name: "Praça Studios",
    employeeCount: 29,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
  },
  {
    id: "org_forte",
    name: "Forte & Cia",
    employeeCount: 63,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
  },
];

export const mockUserProfile: UserProfile = {
  id: "user_daniel",
  organizationId: "org_directscal",
  name: "Daniel Santos",
  email: "work.donsant@gmail.com",
  avatarUrl: null,
  company: "Directscal",
  employeeCount: 12,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-05-08T00:00:00.000Z",
};

export const adminModules: AdminModule[] = [
  {
    id: "module_omdx",
    slug: "omdx",
    name: "Maturidade",
    shortName: "Maturidade",
    description:
      "Diagnóstico de maturidade operacional usado como porta de entrada para mapear empresas com demanda de estruturação.",
    status: "ativo",
    productPath: "/omdx",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    campaignsCount: 0,
    activeCampaigns: 0,
    leadCount: 0,
    companyCount: 0,
  },
  {
    id: "module_people",
    slug: "pessoas",
    name: "Pessoas",
    shortName: "Pessoas",
    description:
      "Estrutura de pessoas, vínculos, custos, pendências e fechamento mensal para operações digitais em crescimento.",
    status: "ativo",
    productPath: "/pessoas",
    createdAt: "2026-06-24T00:00:00.000Z",
    updatedAt: "2026-06-24T00:00:00.000Z",
    campaignsCount: 0,
    activeCampaigns: 0,
    leadCount: 0,
    companyCount: 0,
  },
];

const defaultAcquisitionFields = [
  {
    id: "nome",
    label: "Nome completo",
    type: "text",
    required: true,
    placeholder: "Nome e sobrenome",
    options: null,
    order: 0,
  },
  {
    id: "email",
    label: "E-mail profissional",
    type: "email",
    required: true,
    placeholder: "nome@empresa.com.br",
    options: null,
    order: 1,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    type: "phone",
    required: false,
    placeholder: "(11) 99999-9999",
    options: null,
    order: 2,
  },
  {
    id: "cargo",
    label: "Cargo",
    type: "text",
    required: false,
    placeholder: "Fundador, CEO, COO...",
    options: null,
    order: 3,
  },
  {
    id: "empresa",
    label: "Empresa",
    type: "text",
    required: true,
    placeholder: "Nome da empresa",
    options: null,
    order: 4,
  },
  {
    id: "tamanho_empresa",
    label: "Tamanho da empresa",
    type: "select",
    required: true,
    placeholder: null,
    options: [
      "1-10 pessoas",
      "11-50 pessoas",
      "51-200 pessoas",
      "201-500 pessoas",
      "Mais de 500 pessoas",
    ],
    order: 5,
  },
  {
    id: "objetivo",
    label: "Principal objetivo",
    type: "textarea",
    required: false,
    placeholder: "Descreva em uma frase o que a empresa quer estruturar.",
    options: null,
    order: 6,
  },
] satisfies AcquisitionCampaign["fields"];

export const acquisitionCampaigns: AcquisitionCampaign[] = [
  {
    id: "camp_omdx_site",
    moduleId: "module_omdx",
    name: "Maturidade — Site",
    source: "Site institucional",
    status: "ativo",
    slug: "omdx-site",
    publicPath: "/a/omdx-site",
    createdAt: "2026-04-15T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    visits: 184,
    fields: defaultAcquisitionFields,
  },
  {
    id: "camp_omdx_outbound",
    moduleId: "module_omdx",
    name: "Maturidade — Outbound",
    source: "Outbound consultivo",
    status: "ativo",
    slug: "omdx-outbound",
    publicPath: "/a/omdx-outbound",
    createdAt: "2026-04-18T00:00:00.000Z",
    updatedAt: "2026-05-08T00:00:00.000Z",
    visits: 73,
    fields: defaultAcquisitionFields,
  },
];

export const acquisitionLeads: Lead[] = [
  {
    id: "lead_01",
    moduleId: "module_omdx",
    campaignId: "camp_omdx_site",
    campaignName: "Maturidade — Site",
    source: "Site institucional",
    name: "Marina Azevedo",
    email: "marina@atlasgrowth.com.br",
    phone: "(11) 98888-1122",
    role: "COO",
    companyName: "Atlas Growth",
    companySize: "51-200 pessoas",
    objective:
      "Organizar rituais de gestão antes de ampliar a operação comercial.",
    createdAt: "2026-05-06T10:30:00.000Z",
    status: "lead",
    accountProvider: null,
    userId: null,
    organizationId: null,
    fieldValues: {
      nome: "Marina Azevedo",
      email: "marina@atlasgrowth.com.br",
      whatsapp: "(11) 98888-1122",
      cargo: "COO",
      empresa: "Atlas Growth",
      tamanho_empresa: "51-200 pessoas",
      objetivo:
        "Organizar rituais de gestão antes de ampliar a operação comercial.",
    },
  },
  {
    id: "lead_02",
    moduleId: "module_omdx",
    campaignId: "camp_omdx_outbound",
    campaignName: "Maturidade — Outbound",
    source: "Outbound consultivo",
    name: "Rafael Nogueira",
    email: "rafael@cobaltofin.com",
    phone: null,
    role: "Fundador",
    companyName: "Cobalto Fin",
    companySize: "11-50 pessoas",
    objective: "Entender gargalos de liderança e processos.",
    createdAt: "2026-05-07T15:10:00.000Z",
    status: "lead",
    accountProvider: null,
    userId: null,
    organizationId: null,
    fieldValues: {
      nome: "Rafael Nogueira",
      email: "rafael@cobaltofin.com",
      whatsapp: "",
      cargo: "Fundador",
      empresa: "Cobalto Fin",
      tamanho_empresa: "11-50 pessoas",
      objetivo: "Entender gargalos de liderança e processos.",
    },
  },
];

export const respondentGroups: RespondentGroupMeta[] = [
  {
    id: "fundador",
    label: "Fundador",
    description: "Percepção de sócios e principais decisores.",
  },
  {
    id: "lideranca",
    label: "Liderança",
    description: "Leitura de gestores e responsáveis por times.",
  },
  {
    id: "operacao",
    label: "Operação",
    description: "Visão de quem executa o trabalho no dia a dia.",
  },
];

export const dimensions: Dimension[] = [
  {
    id: "cultura",
    number: 1,
    name: "Cultura e Segurança Psicológica",
    shortName: "Cultura",
    question: "A organização cria condições para o time levantar problemas, discordar e propor sem custo político?",
    description:
      "Avalia o quanto o ambiente permite voz, dissenso e aprendizado sem retaliação.",
  },
  {
    id: "visao",
    number: 2,
    name: "Visão e Alinhamento Estratégico",
    shortName: "Visão",
    question: "A direção entende para onde a empresa vai e isso chega claro a quem executa?",
    description:
      "Avalia clareza de propósito, prioridades estratégicas e cascata para a operação.",
  },
  {
    id: "comunicacao",
    number: 3,
    name: "Comunicação e Gestão do Trabalho",
    shortName: "Comunicação",
    question: "A informação certa chega na hora certa para quem precisa decidir e executar?",
    description:
      "Avalia rituais, fluxo de informação e governança do trabalho em curso.",
  },
  {
    id: "processos",
    number: 4,
    name: "Processos e Execução Operacional",
    shortName: "Processos",
    question: "A operação entrega de forma repetível, previsível e independente de improviso?",
    description:
      "Avalia repetibilidade, padronização e dependência de pessoas-chave.",
  },
  {
    id: "lideranca",
    number: 5,
    name: "Liderança, Delegação e Autonomia",
    shortName: "Liderança",
    question: "A liderança consegue delegar com clareza e o time consegue executar com autonomia?",
    description:
      "Avalia maturidade de delegação, accountability e desenvolvimento de líderes.",
  },
  {
    id: "performance",
    number: 6,
    name: "Performance, Prioridade e Foco",
    shortName: "Performance",
    question: "A organização sabe o que é prioritário e protege o foco de quem executa?",
    description:
      "Avalia gestão de prioridades, foco e cultura de resultado.",
  },
];

export const diagnosticTemplates: DiagnosticTemplate[] = [
  {
    id: "omdx-v1",
    name: "Maturidade padrão",
    description:
      "Diagnóstico de maturidade operacional com seis dimensões e escala Likert de 1 a 5.",
    dimensions: dimensions.map((dimension) => dimension.id),
    scale: [
      { value: 1, label: "Discordo totalmente" },
      { value: 2, label: "Discordo parcialmente" },
      { value: 3, label: "Nem concordo nem discordo" },
      { value: 4, label: "Concordo parcialmente" },
      { value: 5, label: "Concordo totalmente" },
    ],
  },
];

export const diagnostics: Diagnostic[] = [
  {
    id: "diag_01",
    organizationId: "org_vertex",
    organizationName: "Vertex Logistics",
    name: "Maturidade — Q2 2026",
    company: "Vertex Logistics",
    description:
      "Coleta trimestral para avaliar prontidão operacional antes do próximo ciclo comercial.",
    templateId: "omdx-v1",
    status: "ativo",
    createdAt: "2026-04-22T00:00:00.000Z",
    updatedAt: "2026-04-23T00:00:00.000Z",
    activatedAt: "2026-04-23T00:00:00.000Z",
    closedAt: null,
    deadline: "2026-05-15",
    responses: {
      total: 42,
      fundador: 3,
      lideranca: 14,
      operacao: 25,
    },
    generalScore: 3.4,
  },
  {
    id: "diag_02",
    organizationId: "org_lumen",
    organizationName: "Lumen Health",
    name: "Diagnóstico operacional pré-rodada",
    company: "Lumen Health",
    description:
      "Leitura de maturidade para apoiar decisões de estruturação antes da rodada.",
    templateId: "omdx-v1",
    status: "encerrado",
    createdAt: "2026-03-08T00:00:00.000Z",
    updatedAt: "2026-03-29T00:00:00.000Z",
    activatedAt: "2026-03-09T00:00:00.000Z",
    closedAt: "2026-03-29T00:00:00.000Z",
    deadline: "2026-03-28",
    responses: {
      total: 67,
      fundador: 4,
      lideranca: 22,
      operacao: 41,
    },
    generalScore: 2.8,
  },
  {
    id: "diag_03",
    organizationId: "org_northbound",
    organizationName: "Northbound Capital",
    name: "Maturidade — onboarding C-level",
    company: "Northbound Capital",
    description:
      "Diagnóstico rápido para alinhar nova liderança sobre gargalos de execução.",
    templateId: "omdx-v1",
    status: "ativo",
    createdAt: "2026-04-30T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    activatedAt: "2026-05-01T00:00:00.000Z",
    closedAt: null,
    deadline: "2026-05-20",
    responses: {
      total: 11,
      fundador: 2,
      lideranca: 6,
      operacao: 3,
    },
    generalScore: null,
  },
  {
    id: "diag_04",
    organizationId: "org_praca",
    organizationName: "Praça Studios",
    name: "Maturidade operacional 2026",
    company: "Praça Studios",
    description: null,
    templateId: "omdx-v1",
    status: "rascunho",
    createdAt: "2026-05-05T00:00:00.000Z",
    updatedAt: "2026-05-05T00:00:00.000Z",
    activatedAt: null,
    closedAt: null,
    deadline: null,
    responses: {
      total: 0,
      fundador: 0,
      lideranca: 0,
      operacao: 0,
    },
    generalScore: null,
  },
  {
    id: "diag_05",
    organizationId: "org_forte",
    organizationName: "Forte & Cia",
    name: "Diagnóstico anual",
    company: "Forte & Cia",
    description:
      "Revisão anual de maturidade para orientar prioridades de estruturação.",
    templateId: "omdx-v1",
    status: "encerrado",
    createdAt: "2026-01-12T00:00:00.000Z",
    updatedAt: "2026-02-03T00:00:00.000Z",
    activatedAt: "2026-01-15T00:00:00.000Z",
    closedAt: "2026-02-03T00:00:00.000Z",
    deadline: "2026-02-02",
    responses: {
      total: 38,
      fundador: 2,
      lideranca: 11,
      operacao: 25,
    },
    generalScore: 3.9,
  },
  {
    id: "diag_06",
    organizationId: "org_vertex",
    organizationName: "Vertex Logistics",
    name: "Maturidade — Liderança expandida",
    company: "Vertex Logistics",
    description:
      "Rascunho para ampliar a leitura de liderança antes do planejamento do semestre.",
    templateId: "omdx-v1",
    status: "rascunho",
    createdAt: "2026-05-06T00:00:00.000Z",
    updatedAt: "2026-05-06T00:00:00.000Z",
    activatedAt: null,
    closedAt: null,
    deadline: null,
    responses: {
      total: 0,
      fundador: 0,
      lideranca: 0,
      operacao: 0,
    },
    generalScore: null,
  },
];

/**
 * Score por dimensão do último diagnóstico ativo (Vertex Logistics — Q2 2026).
 * Usado no card principal do dashboard.
 */
export const lastDiagnosticDimensionScores: Record<DimensionId, number> = {
  cultura: 3.8,
  visao: 3.1,
  comunicacao: 2.9,
  processos: 2.4,
  lideranca: 3.5,
  performance: 4.0,
};

export const dimensionInsightRecords: DimensionInsightRecord[] = [
  {
    diagnosticId: "diag_01",
    scores: {
      cultura: 3.8,
      visao: 3.1,
      comunicacao: 2.9,
      processos: 2.4,
      lideranca: 3.5,
      performance: 4.0,
    },
    layers: {
      cultura: { fundador: 4.0, lideranca: 3.7, operacao: 3.6 },
      visao: { fundador: 3.8, lideranca: 3.2, operacao: 2.8 },
      comunicacao: { fundador: 3.2, lideranca: 2.9, operacao: 2.6 },
      processos: { fundador: 2.8, lideranca: 2.5, operacao: 2.1 },
      lideranca: { fundador: 3.9, lideranca: 3.6, operacao: 3.2 },
      performance: { fundador: 4.2, lideranca: 4.0, operacao: 3.8 },
    },
  },
  {
    diagnosticId: "diag_02",
    scores: {
      cultura: 2.7,
      visao: 2.6,
      comunicacao: 2.4,
      processos: 2.1,
      lideranca: 2.9,
      performance: 3.0,
    },
    layers: {
      cultura: { fundador: 3.1, lideranca: 2.8, operacao: 2.4 },
      visao: { fundador: 3.0, lideranca: 2.7, operacao: 2.2 },
      comunicacao: { fundador: 2.8, lideranca: 2.5, operacao: 2.1 },
      processos: { fundador: 2.5, lideranca: 2.1, operacao: 1.8 },
      lideranca: { fundador: 3.2, lideranca: 2.9, operacao: 2.6 },
      performance: { fundador: 3.4, lideranca: 3.0, operacao: 2.7 },
    },
  },
  {
    diagnosticId: "diag_03",
    scores: {
      cultura: 3.2,
      visao: 2.9,
      comunicacao: 2.7,
      processos: 2.5,
      lideranca: 3.0,
      performance: 3.3,
    },
    layers: {
      cultura: { fundador: 3.5, lideranca: 3.1, operacao: 2.8 },
      visao: { fundador: 3.4, lideranca: 2.8, operacao: 2.5 },
      comunicacao: { fundador: 3.0, lideranca: 2.7, operacao: 2.4 },
      processos: { fundador: 2.9, lideranca: 2.5, operacao: 2.2 },
      lideranca: { fundador: 3.4, lideranca: 3.0, operacao: 2.6 },
      performance: { fundador: 3.6, lideranca: 3.3, operacao: 3.0 },
    },
  },
  {
    diagnosticId: "diag_05",
    scores: {
      cultura: 4.1,
      visao: 3.7,
      comunicacao: 3.5,
      processos: 3.2,
      lideranca: 3.8,
      performance: 4.2,
    },
    layers: {
      cultura: { fundador: 4.3, lideranca: 4.0, operacao: 3.9 },
      visao: { fundador: 4.1, lideranca: 3.7, operacao: 3.4 },
      comunicacao: { fundador: 3.8, lideranca: 3.6, operacao: 3.2 },
      processos: { fundador: 3.6, lideranca: 3.2, operacao: 2.9 },
      lideranca: { fundador: 4.0, lideranca: 3.8, operacao: 3.5 },
      performance: { fundador: 4.4, lideranca: 4.2, operacao: 4.0 },
    },
  },
];

const reportQuestionBank = {
  cultura: [
    "Problemas relevantes podem ser levantados sem custo político.",
    "O time consegue discordar de decisões quando identifica risco operacional.",
    "Erros recorrentes são tratados como aprendizado e não como culpa individual.",
    "Feedbacks são dados com clareza suficiente para melhorar comportamento e execução.",
    "As pessoas pedem ajuda antes que o problema vire urgência.",
  ],
  visao: [
    "A direção comunica prioridades de forma clara para todos os níveis.",
    "Cada área entende como seu trabalho contribui para os objetivos da empresa.",
    "As metas de curto prazo estão conectadas à visão de médio prazo.",
    "Mudanças de prioridade são explicadas com contexto suficiente.",
    "O time consegue tomar decisões sem depender de alinhamentos excessivos.",
  ],
  comunicacao: [
    "As informações necessárias chegam a tempo para decisão e execução.",
    "Reuniões têm pauta, decisão registrada e próximo passo definido.",
    "Áreas diferentes mantêm alinhamento sem depender de conversas informais.",
    "Responsáveis por decisões importantes são claros para o time.",
    "Bloqueios de comunicação são tratados antes de impactar entrega.",
  ],
  processos: [
    "Os processos críticos estão documentados em um nível útil para execução.",
    "A operação consegue repetir entregas sem depender de improviso.",
    "Gargalos são identificados com dados e tratados de forma recorrente.",
    "Ferramentas e rituais sustentam o trabalho sem criar burocracia excessiva.",
    "A empresa reduz dependência de pessoas-chave nos fluxos principais.",
  ],
  lideranca: [
    "A liderança delega com contexto, critério de sucesso e autonomia.",
    "Gestores acompanham execução sem centralizar todas as decisões.",
    "O time recebe suporte antes que problemas de execução escalem.",
    "Responsabilidades entre líderes e operação são claras no dia a dia.",
    "Líderes desenvolvem capacidade do time, não apenas cobram entrega.",
  ],
  performance: [
    "Métricas de sucesso são conhecidas por quem executa o trabalho.",
    "Prioridades são protegidas quando surgem demandas paralelas.",
    "A empresa acompanha resultado com cadência suficiente para corrigir rota.",
    "Reconhecimento e cobrança estão conectados a entregas objetivas.",
    "O foco operacional é preservado nos ciclos de maior pressão.",
  ],
} satisfies Record<DimensionId, string[]>;

const reportQuestionOffsets = [-0.24, -0.08, 0.06, 0.18, 0.1] as const;

function clampReportScore(score: number) {
  return Math.min(5, Math.max(1, Number(score.toFixed(1))));
}

function roundReportNumber(value: number) {
  return Number(value.toFixed(2));
}

function calculateLayerVariance(scores: Record<RespondentGroup, number>) {
  const values = Object.values(scores);
  const average = values.reduce((acc, value) => acc + value, 0) / values.length;

  return (
    values.reduce((acc, value) => acc + (value - average) ** 2, 0) /
    values.length
  );
}

export const diagnosticReportQuestions: DiagnosticReportQuestion[] =
  dimensionInsightRecords.flatMap((record) => {
    const diagnostic = diagnostics.find((item) => item.id === record.diagnosticId);
    const responses = diagnostic?.responses.total ?? 0;

    return dimensions.flatMap((dimension) => {
      const layerBase = record.layers[dimension.id];

      return reportQuestionBank[dimension.id].map((text, index) => {
        const offset = reportQuestionOffsets[index % reportQuestionOffsets.length];
        const layerScores = {
          fundador: clampReportScore(layerBase.fundador + offset + 0.04),
          lideranca: clampReportScore(layerBase.lideranca + offset),
          operacao: clampReportScore(layerBase.operacao + offset - 0.04),
        };
        const values = Object.values(layerScores);
        const score = clampReportScore(
          values.reduce((acc, value) => acc + value, 0) / values.length,
        );

        return {
          id: `${record.diagnosticId}_${dimension.id}_${index + 1}`,
          diagnosticId: record.diagnosticId,
          dimensionId: dimension.id,
          text,
          score,
          variance: roundReportNumber(
            0.36 + calculateLayerVariance(layerScores) + Math.abs(offset) / 2,
          ),
          responses,
          layerScores,
        };
      });
    });
  });

export function classifyScore(score: number): Classification {
  if (score <= 2.0) return "Crítico";
  if (score <= 3.0) return "Inconsistente";
  if (score <= 4.0) return "Atenção";
  return "Consistente";
}

export function getDimensionById(id: DimensionId): Dimension {
  const dimension = dimensions.find((d) => d.id === id);
  if (!dimension) throw new Error(`Dimension not found: ${id}`);
  return dimension;
}

export function isDimensionId(value: string): value is DimensionId {
  return dimensions.some((dimension) => dimension.id === value);
}

export function getDimensionInsightSummary(
  dimensionId: DimensionId,
  filter: "todos" | string = "todos",
): DimensionInsightSummary {
  const records =
    filter === "todos"
      ? dimensionInsightRecords
      : dimensionInsightRecords.filter((record) => record.diagnosticId === filter);

  const trend = records
    .map((record) => {
      const diagnostic = getDiagnosticById(record.diagnosticId);
      if (!diagnostic) return null;
      return {
        diagnosticId: diagnostic.id,
        diagnosticName: diagnostic.name,
        company: diagnostic.company,
        responses: diagnostic.responses.total,
        score: record.scores[dimensionId],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const scores = trend.map((item) => item.score);
  const totalResponses = trend.reduce((acc, item) => acc + item.responses, 0);
  const averageScore =
    scores.length > 0
      ? scores.reduce((acc, score) => acc + score, 0) / scores.length
      : null;

  const layerScores = respondentGroups.reduce(
    (acc, group) => {
      const values = records.map((record) => record.layers[dimensionId][group.id]);
      acc[group.id] =
        values.length > 0
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : null;
      return acc;
    },
    { fundador: null, lideranca: null, operacao: null } as Record<
      RespondentGroup,
      number | null
    >,
  );

  return {
    dimensionId,
    filter,
    totalResponses,
    averageScore,
    diagnosticsWithData: trend.length,
    variation:
      scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : null,
    layerScores,
    trend,
  };
}

export function getDiagnosticById(id: string): Diagnostic | undefined {
  return diagnostics.find((diagnostic) => diagnostic.id === id);
}

export function getResponseToken(
  diagnosticId: string,
  group: RespondentGroup,
): string {
  return `${diagnosticId}-${group}`;
}

export function getDiagnosticByResponseToken(
  token: string,
): { diagnostic: Diagnostic; group: RespondentGroupMeta } | undefined {
  const group = respondentGroups.find((option) =>
    token.endsWith(`-${option.id}`),
  );

  if (!group) return undefined;

  const diagnosticId = token.slice(0, -group.id.length - 1);
  const diagnostic = getDiagnosticById(diagnosticId);

  if (!diagnostic) return undefined;

  return { diagnostic, group };
}

export function getDefaultDiagnosticTemplate(): DiagnosticTemplate {
  return diagnosticTemplates[0];
}

/**
 * KPIs agregados — calculados a partir do mock para feel realista.
 */
export const dashboardKpis = {
  activeDiagnostics: diagnostics.filter((d) => d.status === "ativo").length,
  totalResponses: diagnostics.reduce((acc, d) => acc + d.responses.total, 0),
  averageScore: (() => {
    const withScore = diagnostics.filter((d) => d.generalScore !== null);
    if (withScore.length === 0) return null;
    const sum = withScore.reduce((acc, d) => acc + (d.generalScore ?? 0), 0);
    return sum / withScore.length;
  })(),
  topGap: (() => {
    const lowest = Object.entries(lastDiagnosticDimensionScores).sort(
      ([, a], [, b]) => a - b,
    )[0];
    const [id, score] = lowest;
    const dim = dimensions.find((d) => d.id === (id as DimensionId));
    return { name: dim?.shortName ?? "", score };
  })(),
};
