import type {
  Classification,
  Diagnostic,
  Dimension,
  DimensionId,
} from "./types";

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

export const diagnostics: Diagnostic[] = [
  {
    id: "diag_01",
    name: "OMDx — Q2 2026",
    company: "Vertex Logistics",
    status: "ativo",
    createdAt: "2026-04-22",
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
    name: "Diagnóstico operacional pré-rodada",
    company: "Lumen Health",
    status: "encerrado",
    createdAt: "2026-03-08",
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
    name: "OMDx — onboarding C-level",
    company: "Northbound Capital",
    status: "ativo",
    createdAt: "2026-04-30",
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
    name: "Maturidade operacional 2026",
    company: "Praça Studios",
    status: "rascunho",
    createdAt: "2026-05-05",
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
    name: "Diagnóstico anual",
    company: "Forte & Cia",
    status: "encerrado",
    createdAt: "2026-01-12",
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
    name: "OMDx — Liderança expandida",
    company: "Vertex Logistics",
    status: "rascunho",
    createdAt: "2026-05-06",
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

export function classifyScore(score: number): Classification {
  if (score <= 2.0) return "Crítico";
  if (score <= 3.0) return "Em desenvolvimento";
  if (score < 4.0) return "Em estruturação";
  if (score <= 4.5) return "Maduro";
  return "Referência";
}

export function getDimensionById(id: DimensionId): Dimension {
  const dimension = dimensions.find((d) => d.id === id);
  if (!dimension) throw new Error(`Dimension not found: ${id}`);
  return dimension;
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
