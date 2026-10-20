import type { ReactNode } from "react";

import styles from "@/components/reports/omdx-report-view.module.css";
import { ReportBarChart, type ReportBarDatum } from "@/components/reports/report-bar-chart";
import { ReportHeatmapChart } from "@/components/reports/report-heatmap-chart";
import type { AdminDeliveryReportDraft } from "@/lib/contracts/admin-operations";
import { buildReportFindings } from "@/lib/data/report-findings";
import { buildNativeReportCharts } from "@/lib/data/omdx-native-report-charts";
import type { DiagnosticReport } from "@/lib/types";

const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});


function ReportSection({ children, id, title }: { children: ReactNode; id: string; title: string }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function Figure({ children, companyName, number, title }: { children: ReactNode; companyName: string; number: number; title: string }) {
  return (
    <figure className={styles.figure}>
      <figcaption className={styles.figureCaption}>
        <span>Gráfico {number}</span>
        <strong>{title}</strong>
      </figcaption>
      {children}
      <p className={styles.source}>Fonte dos dados: Diagnóstico OMDx, {companyName}</p>
    </figure>
  );
}

function TextList({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className={styles.textList}>
      {items.map(([title, description]) => (
        <div key={title}>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      ))}
    </div>
  );
}

function describeScores(data: ReportBarDatum[]) {
  return data
    .map((datum) =>
      datum.value === null
        ? `${datum.label} sem dados`
        : `${datum.label} ${scoreFormatter.format(datum.value)} de 5`,
    )
    .join(", ");
}

export function OmdxReportView({
  editorial,
  example = false,
  report,
}: {
  editorial: AdminDeliveryReportDraft;
  example?: boolean;
  report: DiagnosticReport;
}) {
  const charts = buildNativeReportCharts(report);
  const findings = buildReportFindings(report);
  const companyName = report.diagnostic.company;
  const layerScores: ReportBarDatum[] = charts.layerScores.map((datum, index) => ({
    ...datum,
    color: [
      "--overview-chart-founder",
      "--overview-chart-leadership",
      "--overview-chart-tactical",
    ][index],
  }));
  const dimensionScores: ReportBarDatum[] = charts.dimensionScores.map((datum) => ({
    ...datum,
    color: "--chart-1",
  }));
  const benchmarkScores: ReportBarDatum[] = charts.benchmarkScores.map(
    (datum, index) => ({
      ...datum,
      color: ["--chart-1", "--chart-2", "--chart-3"][index],
    }),
  );
  const anatomyScores: ReportBarDatum[] = charts.anatomyScores.map((datum) => ({
    ...datum,
    color: "--chart-1",
  }));

  return (
    <article data-report-document className={styles.report}>
      <header className={styles.header}>
        <div>
          <div className={styles.metadata}>
            <span>{example ? "Exemplo · Empresa fictícia" : "Maturidade"}</span>
            <span>Atualizado em {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(report.diagnostic.closedAt ?? report.diagnostic.updatedAt))}</span>
          </div>
          <h1>{report.diagnostic.name}</h1>
          <p className={styles.lead}>Análise da estrutura de gestão, das principais vulnerabilidades da operação e dos mecanismos necessários para sustentar o crescimento da empresa.</p>
        </div>
      </header>

      <ReportSection id="metodologia" title="Antes de tudo, entenda como este diagnóstico foi feito">
        <p>O diagnóstico combina dados quantitativos com a percepção das diferentes camadas da {companyName}. As respostas são analisadas em seis dimensões de gestão e comparadas aos níveis de maturidade esperados para uma operação em crescimento, permitindo localizar vulnerabilidades e identificar suas causas.</p>
        <div className={styles.subsection}>
          <h3>O diagnóstico da sua operação</h3>
          <p>{editorial.executiveSummary}</p>
          <p>{editorial.generalReading}</p>
        </div>
        <blockquote>{editorial.conclusion}</blockquote>
      </ReportSection>

      <ReportSection id="maturidade" title="Pontuação de maturidade">
        <p>A primeira leitura compara como diferentes camadas da {companyName} percebem a gestão atual. A distância entre essas pontuações permite identificar desalinhamentos de percepção e situações em que práticas consideradas consolidadas pela liderança ainda não produzem a mesma experiência para quem executa a operação diariamente.</p>
        <Figure companyName={companyName} number={1} title={`Comparação da maturidade percebida pelas diferentes camadas da estrutura da ${companyName}.`}>
          <ReportBarChart data={layerScores} label={describeScores(layerScores)} />
        </Figure>
        <div className={styles.subsection}>
          <h3>Pontuação de maturidade nas seis dimensões pesquisadas</h3>
          <p>A segunda análise distribui a maturidade da {companyName} entre as seis dimensões avaliadas pelo OMDx. Essa leitura permite localizar quais capacidades de gestão estão mais consolidadas e quais apresentam maior fragilidade. A diferença entre as dimensões também mostra onde problemas aparentemente isolados podem compartilhar a mesma origem estrutural. Quando uma dimensão apresenta desempenho inferior às demais, seus efeitos podem aparecer em diferentes áreas da empresa, aumentando dependências, retrabalho e necessidade de intervenção da liderança.</p>
        </div>
        <Figure companyName={companyName} number={2} title={`Comparação da maturidade atual da ${companyName} entre as seis dimensões avaliadas.`}>
          <ReportBarChart data={dimensionScores} label={describeScores(dimensionScores)} />
        </Figure>
      </ReportSection>

      <ReportSection id="bloqueadores" title="Pontuação geral e bloqueadores">
        <p>{findings.distribution}</p>
        <div className={styles.subsection}>
          <h3>Pontuação geral comparada ao mínimo necessário e ideal</h3>
          <p>A pontuação média da {companyName} foi comparada aos níveis mínimo e ideal de maturidade definidos pelo modelo. O objetivo é dimensionar a distância entre a estrutura disponível hoje e aquela necessária para absorver maior complexidade sem aumentar proporcionalmente dependências, gargalos e esforço gerencial.</p>
        </div>
        <Figure companyName={companyName} number={3} title={`Resultado médio da ${companyName} comparado aos níveis mínimo e ideal de maturidade.`}>
          <ReportBarChart data={benchmarkScores} label={describeScores(benchmarkScores)} />
        </Figure>
        <div className={styles.subsection}>
          <h3>Os pontos que impedem o crescimento</h3>
          <p>{editorial.vulnerabilities}</p>
        </div>
        <TextList items={findings.challenges} />
      </ReportSection>

      <ReportSection id="anatomia" title="Anatomia dos desafios">
        <p>As pontuações abaixo descrevem a percepção registrada nesta coleta. As causas e os encaminhamentos dependem da análise publicada pelo especialista.</p>
        <Figure companyName={companyName} number={4} title={`Maturidade da ${companyName} por dimensão e distância até o mínimo recomendado.`}>
          <ReportBarChart
            data={anatomyScores}
            label={`${describeScores(anatomyScores)}; mínimo recomendado ${scoreFormatter.format(report.threshold)} de 5`}
          />
        </Figure>
        <div className={styles.subsection}>
          <h3>Diferenças observadas nesta coleta</h3>
          <p>{findings.distribution}</p>
        </div>
      </ReportSection>

      <ReportSection id="nucleo" title="Núcleo dos principais desafios para atuar">
        <p>O mapa de calor aprofunda a análise e mostra em quais perguntas estão concentradas as principais vulnerabilidades da {companyName}. Em vez de considerar uma dimensão inteira como problemática, essa leitura permite localizar comportamentos específicos que reduzem sua maturidade. A concentração dos pontos de atenção revela onde pequenas intervenções estruturais podem gerar efeito sobre diferentes sintomas da operação e ajuda a definir uma ordem mais precisa de atuação.</p>
        <Figure companyName={companyName} number={5} title="Distribuição das vulnerabilidades entre as perguntas das seis dimensões.">
          <ReportHeatmapChart
            columns={charts.vulnerabilityRows[0]?.cells.map((cell) => cell.label) ?? []}
            label="Distribuição das vulnerabilidades entre as perguntas das seis dimensões"
            rows={charts.vulnerabilityRows}
          />
        </Figure>
        <div className={styles.subsection}>
          <h3>Distribuição das respostas</h3>
          <p>O mapa permite comparar as médias por pergunta. Uma concentração só deve ser interpretada quando houver diferenças na base; as cores não demonstram causalidade.</p>
        </div>
        <div className={styles.subsection}>
          <h3>Causa raiz e alavancas de melhoria</h3>
          <p>{editorial.structuralCauses}</p>
        </div>

      </ReportSection>

      <ReportSection id="alavancas" title="Matriz de alavancas">
        <p>{editorial.recommendations}</p>
        <Figure companyName={companyName} number={6} title="Impacto das alavancas sobre as principais vulnerabilidades.">
          <ReportHeatmapChart
            columns={charts.leverageRows[0]?.cells.map((cell) => cell.label) ?? []}
            label="Impacto das alavancas sobre as principais vulnerabilidades"
            rows={charts.leverageRows}
          />
        </Figure>
        <div className={styles.subsection}>
          <h3>Leitura das alavancas</h3>
          <p>A matriz organiza as prioridades da coleta. Impactos e relações causais precisam de evidência adicional e da leitura do especialista.</p>
        </div>
      </ReportSection>

      <ReportSection id="implementacoes" title="Linha do tempo de implementações">
        <p>{editorial.recommendations}</p>
        <p>As ações e os prazos aprovados estão disponíveis em Action Points desta coleta. A publicação do relatório não confirma que uma implementação já foi realizada.</p>
      </ReportSection>

      <ReportSection id="conclusao" title="A estrutura necessária para o próximo estágio">
        <p>{editorial.conclusion}</p>
      </ReportSection>

      <footer className={styles.legal}>
        <span>Data e hora da emissão do relatório</span>
        <span>Directscal</span>
        <span>CNPJ: 42.308.050/0001-80</span>
      </footer>
    </article>
  );
}
