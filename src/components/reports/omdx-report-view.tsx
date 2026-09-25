import type { ReactNode } from "react";

import styles from "@/components/reports/omdx-report-view.module.css";
import { ReportBarChart, type ReportBarDatum } from "@/components/reports/report-bar-chart";
import { ReportHeatmapChart } from "@/components/reports/report-heatmap-chart";
import type { AdminDeliveryReportDraft } from "@/lib/contracts/admin-operations";
import { buildNativeReportCharts } from "@/lib/data/omdx-native-report-charts";
import type { DiagnosticReport } from "@/lib/types";

const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const challenges = [
  ["Processos pouco padronizados", "Atividades relevantes ainda dependem do repertório de quem executa e possuem critérios pouco formalizados. Isso aumenta variações na entrega, dificulta a transferência de conhecimento e faz com que qualidade e velocidade dependam excessivamente da experiência individual de cada profissional."],
  ["Liderança sobrecarregada", "Parte da liderança permanece envolvida na resolução recorrente de dúvidas e impedimentos operacionais. Sem limites claros de autonomia, decisões que poderiam permanecer nas áreas continuam subindo na estrutura e ocupando capacidade gerencial que deveria estar direcionada a coordenação."],
  ["Comunicação fragmentada", "Informações importantes circulam entre canais e pessoas sem um padrão consistente de registro. Isso cria perda de contexto, repetições de alinhamento e maior dificuldade para recuperar decisões anteriores, especialmente quando diferentes áreas precisam coordenar uma mesma entrega."],
  ["Performance pouco integrada", "Existem dados e indicadores disponíveis, mas eles ainda não compõem uma leitura gerencial comum. Como consequência, prioridades podem ser definidas por percepções distintas e a liderança possui dificuldade para acompanhar desempenho e corrigir desvios com a frequência necessária."],
  ["Visão pouco desdobrada", "A direção estratégica é conhecida pelas camadas mais próximas da liderança, porém seu desdobramento até a execução apresenta diferentes níveis de clareza. Isso reduz a conexão entre prioridades estratégicas, decisões das áreas e atividades realizadas diariamente pela operação."],
] as const;

const causes = [
  ["Papéis pouco definidos", "Decisões e responsabilidades ainda possuem limites pouco claros entre funções."],
  ["Processos pouco padronizados", "A execução depende excessivamente do conhecimento individual das pessoas."],
  ["Cadência insuficiente", "Prioridades e impedimentos não seguem um ritmo comum de acompanhamento."],
  ["Indicadores fragmentados", "Os dados disponíveis ainda não formam uma leitura gerencial compartilhada."],
  ["Decisões concentradas", "Questões operacionais continuam escalando para poucas pessoas da estrutura."],
] as const;

const implementations = [
  ["Cadência executiva", "Implantar uma rotina executiva para acompanhar prioridades, indicadores, impedimentos e decisões. A implementação deve acontecer antes das demais frentes para estabelecer um ritmo comum de gestão. O resultado esperado é aumentar visibilidade sobre a operação e reduzir alinhamentos dispersos, criando um ponto recorrente de coordenação entre as lideranças."],
  ["Papéis e responsabilidades", "Definir responsabilidades, decisões e limites de autonomia para as funções críticas da operação. A implementação utiliza os problemas observados na nova cadência para esclarecer quais decisões pertencem a cada papel. O resultado esperado é reduzir escaladas desnecessárias e aumentar a velocidade com que questões operacionais são resolvidas pelas próprias áreas."],
  ["Sistema de indicadores", "Organizar os principais indicadores da operação, seus responsáveis e a frequência de atualização. A implantação deve aproveitar a cadência já estabelecida para transformar os dados em parte recorrente da gestão. O resultado esperado é criar uma leitura compartilhada de performance e reduzir decisões baseadas apenas em percepção ou informações fragmentadas."],
  ["Gestão do trabalho", "Padronizar a forma como prioridades, responsáveis, prazos e impedimentos são registrados e acompanhados. A implementação conecta o trabalho diário à cadência gerencial já instalada. O resultado esperado é aumentar previsibilidade sobre entregas, tornar atrasos visíveis com antecedência e reduzir a necessidade de cobranças e acompanhamentos paralelos."],
  ["Processos críticos", "Mapear e documentar os processos com maior impacto sobre qualidade, velocidade e dependência individual. A documentação deve acontecer após os critérios operacionais estarem claros e testados. O resultado esperado é reduzir variações de execução, facilitar treinamento e tornar o conhecimento crítico menos dependente de profissionais específicos."],
  ["Governança de decisões", "Definir critérios para tomada, registro e escalonamento das decisões relevantes da operação. A implementação deve utilizar a nova estrutura de papéis como referência para determinar níveis de autonomia. O resultado esperado é distribuir decisões de maneira controlada, reduzindo dependência da liderança sem comprometer visibilidade ou responsabilidade."],
  ["Rituais de liderança", "Estruturar uma rotina específica para acompanhamento dos líderes, das prioridades de suas áreas e dos principais impedimentos. O ritual complementa a cadência executiva e desloca o foco da resolução pontual para a coordenação. O resultado esperado é ampliar a capacidade da liderança para desenvolver autonomia, acompanhar performance e antecipar problemas."],
  ["Critérios de performance", "Formalizar os critérios utilizados para avaliar performance de áreas, times e responsáveis. Os critérios devem estar conectados aos indicadores já definidos e às responsabilidades de cada papel. O resultado esperado é reduzir avaliações subjetivas, tornar expectativas mais claras e permitir intervenções gerenciais baseadas em comportamentos e resultados observáveis."],
  ["Sistema de comunicação", "Definir quais informações devem circular, em quais canais precisam ser registradas e quem responde por cada comunicação crítica. A implementação deve reduzir o uso paralelo de canais para o mesmo objetivo. O resultado esperado é preservar contexto, facilitar recuperação de decisões e diminuir o volume de alinhamentos provocados por informações dispersas."],
  ["Consolidação da governança", "Integrar papéis, rituais, indicadores, processos e critérios de decisão em uma arquitetura única de gestão. Esta etapa acontece depois que os mecanismos anteriores já foram testados na rotina. O resultado esperado é consolidar uma operação mais previsível, com menor dependência individual e maior capacidade para absorver novas pessoas, projetos e complexidade."],
] as const;

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
  report,
}: {
  editorial: AdminDeliveryReportDraft;
  report: DiagnosticReport;
}) {
  const charts = buildNativeReportCharts(report);
  const companyName = report.diagnostic.company;
  const layerScores: ReportBarDatum[] = charts.layerScores.map((datum, index) => ({
    ...datum,
    color: [
      "--omdx-layer-diretoria-70",
      "--omdx-layer-lideranca-60",
      "--omdx-layer-time-50",
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
    <article className={styles.report}>
      <header className={styles.header}>
        <div>
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
        <p>A leitura conjunta mostra que a maturidade da gestão não está distribuída de forma homogênea. A {companyName} possui mecanismos mais consolidados em algumas dimensões, enquanto outras ainda apresentam práticas informais e dependência individual. Essa diferença explica parte das inconsistências percebidas no funcionamento diário da operação.</p>
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
        <TextList items={challenges} />
      </ReportSection>

      <ReportSection id="anatomia" title="Anatomia dos desafios">
        <p>Esta análise aprofunda a relação entre as vulnerabilidades identificadas. Os dados mostram que muitos sintomas encontrados na operação são consequências de uma mesma cadeia estrutural: papéis pouco claros aumentam escaladas, as escaladas concentram decisões e essa concentração reduz a capacidade da liderança para estruturar processos e acompanhar performance.</p>
        <Figure companyName={companyName} number={4} title={`Maturidade da ${companyName} por dimensão e distância até o mínimo recomendado.`}>
          <ReportBarChart
            data={anatomyScores}
            label={`${describeScores(anatomyScores)}; mínimo recomendado ${scoreFormatter.format(report.threshold)} de 5`}
          />
        </Figure>
        <div className={styles.subsection}>
          <h3>Os gaps confirmam diferentes níveis de consolidação</h3>
          <p>A comparação entre as dimensões reforça a hipótese identificada nas análises anteriores. A {companyName} possui capacidades importantes já instaladas, mas elas evoluíram em velocidades diferentes. Isso faz com que áreas mais maduras precisem compensar fragilidades de outras dimensões. A liderança, por exemplo, absorve decisões que deveriam ser resolvidas por papéis e processos mais claros, enquanto a comunicação precisa compensar a ausência de padrões formais com novos alinhamentos. Essa dinâmica funciona enquanto a complexidade é limitada, mas perde eficiência conforme aumentam pessoas, projetos e interfaces entre áreas.</p>
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
          <h3>As vulnerabilidades estão concentradas em mecanismos específicos</h3>
          <p>O mapa mostra que os principais pontos de atenção não estão distribuídos igualmente pela empresa. Eles se concentram em mecanismos ligados à responsabilidade, coordenação e padronização da execução. Isso permite priorizar intervenções capazes de corrigir várias consequências operacionais a partir de poucas causas estruturais.</p>
        </div>
        <div className={styles.subsection}>
          <h3>Causa raiz e alavancas de melhoria</h3>
          <p>{editorial.structuralCauses}</p>
        </div>
        <TextList items={causes} />
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
          <h3>Algumas alavancas atuam sobre diferentes vulnerabilidades</h3>
          <p>A matriz mostra que as intervenções possuem diferentes níveis de impacto sobre cada dimensão. A prioridade deve recair sobre mecanismos capazes de corrigir múltiplos problemas ao mesmo tempo. Essa lógica reduz iniciativas isoladas e permite construir uma estrutura em que cada novo ativo fortaleça os anteriores.</p>
        </div>
      </ReportSection>

      <ReportSection id="implementacoes" title="Linha do tempo de implementações">
        <p>A ordem das frentes considera as dependências entre cada ativo. Primeiro são estruturados cadência e critérios de decisão. Em seguida, papéis e indicadores aumentam responsabilidade e visibilidade. Por fim, processos e mecanismos de governança consolidam os padrões que já foram testados na rotina real da empresa.</p>
        <ol className={styles.timeline}>
          {implementations.map(([title, description], index) => (
            <li key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ol>
        <div className={styles.subsection}>
          <h3>Cronologia e resultados esperados</h3>
          <p>Nos primeiros 30 dias, a prioridade é estabelecer cadência, responsabilidades e visibilidade sobre a operação. O objetivo inicial é reduzir ambiguidades e criar uma rotina comum para acompanhamento das principais decisões. Entre 30 e 60 dias, indicadores, gestão do trabalho e critérios de autonomia passam a distribuir melhor a coordenação. Entre 60 e 90 dias, processos e governança consolidam os padrões testados nas etapas anteriores. Ao final do ciclo, a {companyName} deve operar com menor dependência individual e maior previsibilidade de execução.</p>
        </div>
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
