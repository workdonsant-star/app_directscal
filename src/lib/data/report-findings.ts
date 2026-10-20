import type { DiagnosticReport } from "@/lib/types";

export function buildReportFindings(report: DiagnosticReport) {
  const scores = report.dimensions.map(item => item.score);
  const spread = Math.max(...scores) - Math.min(...scores);
  const weak = report.dimensions.filter(item => item.score < report.threshold);
  return {
    distribution: spread < 0.05
      ? "As seis dimensões apresentam pontuações equivalentes nesta coleta. A média agregada não demonstra concentração em uma dimensão específica."
      : `A diferença entre a maior e a menor pontuação dimensional é de ${spread.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ponto(s). ${weak.length} dimensões estão abaixo da referência de ${report.threshold.toLocaleString("pt-BR")}.`,
    challenges: weak.map(item => [item.name, `Pontuação ${item.score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} de 5, abaixo da referência do diagnóstico. A pontuação indica uma prioridade de investigação; não comprova, isoladamente, sua causa.`] as const),
  };
}
