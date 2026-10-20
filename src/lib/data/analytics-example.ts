import { diagnosticReportSchema } from "@/lib/contracts";
import { classifyScore } from "@/lib/data/omdx-domain";
import { buildOmdxOverviewComparisonFromReports } from "@/lib/data/omdx-overview-analytics";

const dimensionExamples = [
  { id: "cultura", name: "Cultura", scores: [3.8, 3.4, 3.1], variance: 0.55 },
  { id: "visao", name: "Visão", scores: [4.2, 3.5, 2.8], variance: 0.83 },
  { id: "comunicacao", name: "Comunicação", scores: [3.5, 2.7, 2.3], variance: 0.76 },
  { id: "processos", name: "Processos", scores: [3.2, 2.8, 2.5], variance: 0.62 },
  { id: "lideranca", name: "Liderança", scores: [3.9, 3.2, 2.9], variance: 0.68 },
  { id: "performance", name: "Performance", scores: [3.7, 2.9, 2.6], variance: 0.72 },
] as const;

// Afirmações reais do template Maturidade (supabase/migrations/20260517000100_production_base_auth.sql),
// quatro por dimensão, para o exemplo ler como uma coleta de verdade.
const questionStatements: Record<(typeof dimensionExamples)[number]["id"], string[]> = {
  cultura: [
    "Problemas relevantes podem ser levantados sem custo político.",
    "O time consegue discordar de decisões quando identifica risco operacional.",
    "Erros recorrentes são tratados como aprendizado e não como culpa individual.",
    "Feedbacks são dados com clareza suficiente para melhorar comportamento e execução.",
  ],
  visao: [
    "A direção comunica prioridades de forma clara para todos os níveis.",
    "Cada área entende como seu trabalho contribui para os objetivos da empresa.",
    "As metas de curto prazo estão conectadas à visão de médio prazo.",
    "Mudanças de prioridade são explicadas com contexto suficiente.",
  ],
  comunicacao: [
    "As informações necessárias chegam a tempo para decisão e execução.",
    "Reuniões têm pauta, decisão registrada e próximo passo definido.",
    "Áreas diferentes mantêm alinhamento sem depender de conversas informais.",
    "Responsáveis por decisões importantes são claros para o time.",
  ],
  processos: [
    "Os processos críticos estão documentados em um nível útil para execução.",
    "A operação consegue repetir entregas sem depender de improviso.",
    "Gargalos são identificados com dados e tratados de forma recorrente.",
    "Ferramentas e rituais sustentam o trabalho sem criar burocracia excessiva.",
  ],
  lideranca: [
    "A liderança delega com contexto, critério de sucesso e autonomia.",
    "Gestores acompanham execução sem centralizar todas as decisões.",
    "O time recebe suporte antes que problemas de execução escalem.",
    "Responsabilidades entre líderes e operação são claras no dia a dia.",
  ],
  performance: [
    "Métricas de sucesso são conhecidas por quem executa o trabalho.",
    "Prioridades são protegidas quando surgem demandas paralelas.",
    "A empresa acompanha resultado com cadência suficiente para corrigir rota.",
    "Reconhecimento e cobrança estão conectados a entregas objetivas.",
  ],
};

export function buildAnalyticsExampleReports() {
  const reports = [0, 1].map((period) => {
    const id = `analytics-example-${period}`;
    const date = period === 0 ? "2026-07-15T12:00:00.000Z" : "2026-10-01T12:00:00.000Z";
    const responses = { total: period === 0 ? 21 : 27, fundador: 1, lideranca: period === 0 ? 4 : 5, operacao: period === 0 ? 16 : 21 };
    const dimensions = dimensionExamples.map((dimension, index) => {
      const adjustment = period === 0 ? [-0.2, 0.1, -0.3, -0.1, 0.2, -0.2][index] : 0;
      const [fundador, lideranca, operacao] = dimension.scores.map((score) => Number((score + adjustment).toFixed(1)));
      const layerScores = { fundador, lideranca, operacao };
      const score = Number(((fundador + lideranca + operacao) / 3).toFixed(2));
      return {
        id: dimension.id, number: index + 1, name: dimension.name, shortName: dimension.name,
        question: `Como a operação aplica ${dimension.name.toLowerCase()}?`,
        description: `Percepção das três camadas sobre ${dimension.name.toLowerCase()}.`,
        score, classification: classifyScore(score), variance: dimension.variance, responses: responses.total,
        layerScores, misalignment: { value: Number((fundador - operacao).toFixed(1)), highestGroup: "fundador", lowestGroup: "operacao" },
        questions: [-0.3, 0.15, -0.1, 0.25].map((offset, question) => ({
          id: `${id}-${dimension.id}-${question}`, diagnosticId: id, dimensionId: dimension.id,
          text: questionStatements[dimension.id][question],
          score: Number((score + offset).toFixed(2)), variance: dimension.variance, responses: responses.total,
          layerScores: { fundador: fundador + offset, lideranca: lideranca + offset, operacao: operacao + offset },
        })),
      };
    });
    const generalScore = dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length;
    const weakest = [...dimensions].sort((left, right) => left.score - right.score)[0];
    const report = diagnosticReportSchema.parse({
      diagnostic: { id, organizationId: "analytics-example", organizationName: "Vertex Logistics", company: "Vertex Logistics",
        name: period === 0 ? "Diagnóstico de julho" : "Diagnóstico de outubro", description: null, templateId: "omdx-v1", status: "encerrado",
        createdAt: date, updatedAt: date, activatedAt: date, closedAt: date, deadline: null, responses, generalScore },
      generatedAt: date, threshold: 3, generalScore, classification: classifyScore(generalScore), responses,
      layerAverages: Object.fromEntries(["fundador", "lideranca", "operacao"].map((group) => [group, dimensions.reduce((sum, dimension) => sum + dimension.layerScores[group as keyof typeof dimension.layerScores], 0) / 6])),
      weakestDimension: { id: weakest.id, name: weakest.name, shortName: weakest.shortName, score: weakest.score, classification: weakest.classification },
      highestMisalignment: { dimensionId: "visao", dimensionName: "Visão", value: 1.4, highestGroup: "fundador", lowestGroup: "operacao" },
      dimensions,
    });
    return report;
  });
  return reports;
}

export function buildAnalyticsExample(selectedDiagnostic = "todos") {
  const reports = buildAnalyticsExampleReports();
  const selected = reports.some((report) => report.diagnostic.id === selectedDiagnostic) ? selectedDiagnostic : "todos";
  return { ...buildOmdxOverviewComparisonFromReports(reports, selected), diagnosticOptions: reports.map((report) => report.diagnostic), selectedDiagnostic: selected };
}
